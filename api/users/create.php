<?php
// ================================================================
//  CANAOPTICALCLINIC — api/users/create.php
//  Admin-only. Creates an Admin, Staff, or Doctor account.
//  POST { role, firstName, lastName, email, password, contact?,
//         specialization?, prcLicense? }
//  → { success:true, user:{...} }
// ================================================================

require_once '../../config/db.php';
require_once '../../config/smtp.php';
require_once '../helpers.php';

requireMethod('POST');
startSession();

if (!isset($_SESSION['user_id'])) {
    jsonResponse(['success' => false, 'message' => 'Not authenticated.'], 401);
}
if ($_SESSION['role'] !== 'admin') {
    jsonResponse(['success' => false, 'message' => 'Only admins can create user accounts.'], 403);
}

// Same reasoning as patients/create.php's rate limit — scoped per admin
// account, generous enough for legitimate onboarding of several staff at
// once, but stops a spam-clicked or scripted burst from flooding the
// users table and firing off duplicate account-created emails.
rateLimit('user-create:' . $_SESSION['user_id'], 20, 300);

$b       = getBody();
$role    = trim($b['role']           ?? '');
$first   = trim($b['firstName']      ?? '');
$middle  = trim($b['middleName']     ?? '');
$last    = trim($b['lastName']       ?? '');
$email   = strtolower(trim($b['email'] ?? ''));
$pass    = $b['password']            ?? '';
$contact = trim($b['contact']        ?? '');

if (!$role || !$first || !$last || !$email || !$pass) {
    jsonResponse(['success' => false, 'message' => 'Role, name, email and password are required.']);
}

$roleMap = ['Admin' => 'admin', 'Staff' => 'staff', 'Doctor' => 'doctor'];
$dbRole  = $roleMap[$role] ?? null;
if (!$dbRole) {
    jsonResponse(['success' => false, 'message' => 'Invalid role. Must be Admin, Staff, or Doctor.']);
}

if (!filter_var($email, FILTER_VALIDATE_EMAIL)) {
    jsonResponse(['success' => false, 'message' => 'Please enter a valid email address.']);
}
if ($contact && !isValidContact($contact)) {
    jsonResponse(['success' => false, 'message' => 'Please enter a valid 11-digit contact number.']);
}

if ($pwError = validatePasswordPolicy($pass)) {
    jsonResponse(['success' => false, 'message' => $pwError]);
}

$tableMap  = ['Admin' => 'admins', 'Staff' => 'staff', 'Doctor' => 'doctors'];
$prefixMap = ['Admin' => 'ADM',    'Staff' => 'S',     'Doctor' => 'D'];
$table     = $tableMap[$role];
$prefix    = $prefixMap[$role];

try {
    $pdo = getDB();

    // Email uniqueness check
    $chk = $pdo->prepare('SELECT id FROM users WHERE email = ? LIMIT 1');
    $chk->execute([$email]);
    if ($chk->fetch()) {
        jsonResponse(['success' => false, 'message' => 'An account with this email already exists.']);
    }

    // Generate next sequential ID (ADM001, S001, D001, …)
    $lastId = $pdo->query("SELECT id FROM `{$table}` ORDER BY id DESC LIMIT 1")->fetchColumn();
    $next   = 1;
    if ($lastId && preg_match('/^' . preg_quote($prefix, '/') . '(\d+)$/i', $lastId, $m)) {
        $next = (int)$m[1] + 1;
    }
    $newId = $prefix . str_pad($next, 3, '0', STR_PAD_LEFT);
    $dup   = $pdo->prepare("SELECT id FROM `{$table}` WHERE id = ?");
    while (true) {
        $dup->execute([$newId]);
        if (!$dup->fetch()) break;
        $next++;
        $newId = $prefix . str_pad($next, 3, '0', STR_PAD_LEFT);
    }

    $pdo->beginTransaction();

    // Create login account
    $hash = password_hash($pass, PASSWORD_DEFAULT);
    $pdo->prepare('INSERT INTO users (email, password_hash, role) VALUES (?, ?, ?)')
        ->execute([$email, $hash, $dbRole]);
    $userId = (int)$pdo->lastInsertId();

    // Create role-specific profile row
    if ($role === 'Doctor') {
        $spec   = trim($b['specialization'] ?? '') ?: 'Optometrist';
        $degree = trim($b['degree']         ?? '') ?: 'OD';
        $prc    = trim($b['prcLicense']     ?? '');
        $pdo->prepare(
            'INSERT INTO doctors (id, user_id, first_name, middle_name, last_name, contact, specialization, degree, prc_license, status)
             VALUES (?, ?, ?, ?, ?, ?, ?, ?, ?, ?)'
        )->execute([$newId, $userId, $first, $middle ?: null, $last, $contact, $spec, $degree, $prc ?: null, 'active']);
    } else {
        $pdo->prepare(
            "INSERT INTO `{$table}` (id, user_id, first_name, middle_name, last_name, contact, status)
             VALUES (?, ?, ?, ?, ?, ?, ?)"
        )->execute([$newId, $userId, $first, $middle ?: null, $last, $contact, 'active']);
    }

    $pdo->commit();

    // Welcome email — non-critical, never blocks the response. Includes
    // the password the admin set, since that's the account's real
    // (non-generated) password and this is its only in-app record of it.
    try {
        $fullName = ($role === 'Doctor' ? 'Dr. ' : '') . "$first $last";
        sendEmail(
            $email, $fullName,
            'Welcome to Cana Optical Clinic',
            welcomeEmailBody($fullName, strtolower($role), $email, $pass),
            "Welcome, $fullName!\n\nYour $role account at Cana Optical Clinic has been created.\n\nLogin email: $email\nTemporary password: $pass\n\nPlease sign in and change this password as soon as possible."
        );
    } catch (\Throwable $e) {
        error_log('[email] Welcome email failed for new ' . $role . ' ' . $email . ': ' . $e->getMessage());
    }

    $userObj = [
        'id'         => $newId,
        'firstName'  => $first,
        'middleName' => $middle,
        'lastName'   => $last,
        'name'       => ($role === 'Doctor' ? 'Dr. ' : '') . "$first $last",
        'email'     => $email,
        'contact'   => $contact,
        'role'      => $dbRole,
        'status'    => 'active',
        'photoUrl'  => null,
    ];
    if ($role === 'Doctor') {
        $userObj['specialization'] = $spec;
        $userObj['degree']         = $degree;
        $userObj['prcLicense']     = $prc;
        $userObj['available']      = true;
        $userObj['days']           = [];
        $userObj['hours']          = '8:00 AM – 5:00 PM';
    }

    jsonResponse(['success' => true, 'user' => $userObj]);

} catch (PDOException $e) {
    if (isset($pdo) && $pdo->inTransaction()) $pdo->rollBack();
    jsonResponse(['success' => false, 'message' => 'Database error. Please try again.'], 500);
}
