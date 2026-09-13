<?php
// ================================================================
//  CANAOPTICALCLINIC — api/patients/admin_update.php
//  Admin/Staff only. Edits an existing patient's profile, including
//  gender and date of birth — fields the patient cannot self-edit
//  (see api/patients/update.php, which is patient-self-service only
//  and intentionally excludes gender/dob for record-accuracy reasons).
//
//  POST { id, firstName, middleName?, lastName, gender?, dob?, contact?,
//         email?, address?, occupation?, medicalHistory? }
// ================================================================

require_once '../../config/db.php';
require_once '../../config/smtp.php';
require_once '../helpers.php';

requireMethod('POST');
startSession();

if (!isset($_SESSION['user_id'])) {
    jsonResponse(['success' => false, 'message' => 'Not authenticated.'], 401);
}
if (!in_array($_SESSION['role'], ['admin', 'staff'], true)) {
    jsonResponse(['success' => false, 'message' => 'Unauthorized.'], 403);
}

// Scoped per staff account — a save here can also grant a patient their
// first login (new users row + a real welcome email) when an email is
// added, so this isn't purely a harmless DB update. 30 per 5 min covers
// working through a long patient list while still stopping a spam burst.
rateLimit('patient-admin-update:' . $_SESSION['user_id'], 30, 300);

$b    = getBody();
$id   = trim($b['id'] ?? '');
if (!$id) {
    jsonResponse(['success' => false, 'message' => 'Patient id is required.']);
}

$first   = trim($b['firstName']  ?? '');
$middle  = trim($b['middleName'] ?? '');
$last    = trim($b['lastName']   ?? '');
if (!$first || !$last) {
    jsonResponse(['success' => false, 'message' => 'First and last name are required.']);
}

$gender  = trim($b['gender']  ?? '');
$dob     = trim($b['dob']     ?? '');
$contact = trim($b['contact'] ?? '');
$email   = trim($b['email']   ?? '');
$address = trim($b['address'] ?? '');
$occupation = isset($b['occupation']) ? trim($b['occupation']) : null;
$medHx      = isset($b['medicalHistory']) ? trim($b['medicalHistory']) : null;
$status  = isset($b['status']) ? trim($b['status']) : null;

if ($gender && !in_array($gender, ['Male', 'Female', 'Other'], true)) {
    jsonResponse(['success' => false, 'message' => 'Invalid gender value.']);
}
if ($status && !in_array($status, ['active', 'inactive'], true)) {
    jsonResponse(['success' => false, 'message' => 'Invalid status value.']);
}
if ($contact && !isValidContact($contact)) {
    jsonResponse(['success' => false, 'message' => 'Please enter a valid 11-digit contact number.']);
}
if ($address && !looksLikeAddress($address)) {
    jsonResponse(['success' => false, 'message' => 'Please enter a complete address.']);
}

try {
    $pdo = getDB();

    $stmt = $pdo->prepare('SELECT * FROM patients WHERE id = ? LIMIT 1');
    $stmt->execute([$id]);
    $patient = $stmt->fetch();
    if (!$patient) {
        jsonResponse(['success' => false, 'message' => 'Patient not found.'], 404);
    }

    $sets   = ['first_name = ?', 'middle_name = ?', 'last_name = ?'];
    $values = [$first, $middle ?: null, $last];

    if ($gender) { $sets[] = 'gender = ?'; $values[] = $gender; }

    if ($dob) {
        $bd  = new DateTime($dob);
        $age = (int)$bd->diff(new DateTime())->y;
        $sets[] = 'dob = ?'; $values[] = $dob;
        $sets[] = 'age = ?'; $values[] = $age;
    }

    if ($contact !== '') { $sets[] = 'contact = ?'; $values[] = $contact; }
    if ($address !== '') { $sets[] = 'address = ?'; $values[] = $address; }
    if ($occupation !== null) { $sets[] = 'occupation = ?'; $values[] = $occupation; }
    if ($medHx !== null) { $sets[] = 'medical_history = ?'; $values[] = $medHx ?: null; }
    if ($status)           { $sets[] = 'status = ?'; $values[] = $status; }

    $values[] = $id;
    $pdo->prepare('UPDATE patients SET ' . implode(', ', $sets) . ' WHERE id = ?')->execute($values);

    // Sync is_active on users table when status changes
    if ($status && $patient['user_id']) {
        $isActive = ($status === 'active') ? 1 : 0;
        $pdo->prepare(
            'UPDATE users SET is_active = ?' . ($isActive ? ', last_login_at = NOW()' : '') . ' WHERE id = ?'
        )->execute([$isActive, $patient['user_id']]);
    }

    // Email lives on `users`. Two cases: this patient already has a login
    // account (just update its email), or they're a walk-in with none yet
    // (patients.user_id NULL — see create.php's own "only creates a login
    // if an email was given" comment) and staff is now giving them one for
    // the first time, which means actually creating that users row here,
    // not just writing an email string nothing reads.
    $tempPassword = null;
    if ($email) {
        if (!filter_var($email, FILTER_VALIDATE_EMAIL)) {
            jsonResponse(['success' => false, 'message' => 'Please enter a valid email address.']);
        }
        $chk = $pdo->prepare('SELECT id FROM users WHERE email = ? AND id != ? LIMIT 1');
        $chk->execute([$email, $patient['user_id'] ?: 0]);
        if ($chk->fetch()) {
            jsonResponse(['success' => false, 'message' => 'An account with this email already exists.']);
        }

        if ($patient['user_id']) {
            $pdo->prepare('UPDATE users SET email = ? WHERE id = ?')->execute([$email, $patient['user_id']]);
        } else {
            // Same temp-password convention as create.php's own "Create
            // login account if email provided" step.
            $tempPassword = ucfirst(strtolower($first)) . '@' . date('Y');
            $hash = password_hash($tempPassword, PASSWORD_DEFAULT);
            $pdo->prepare('INSERT INTO users (email, password_hash, role) VALUES (?,?,?)')
                ->execute([$email, $hash, 'patient']);
            $newUserId = (int)$pdo->lastInsertId();
            $pdo->prepare('UPDATE patients SET user_id = ? WHERE id = ?')->execute([$newUserId, $id]);

            createNotification($pdo, $newUserId, 'welcome',
                'Welcome to Cana Optical Clinic',
                'Your patient account has been activated. You can now book appointments and view your records online.'
            );

            // Non-critical — never blocks the response either way.
            try {
                $fullName = "$first $last";
                sendEmail(
                    $email, $fullName,
                    'Welcome to Cana Optical Clinic',
                    welcomeEmailBody($fullName, 'patient', $email, $tempPassword),
                    "Welcome, $fullName!\n\nA patient account at Cana Optical Clinic has been set up for you.\n\nLogin email: $email\nTemporary password: $tempPassword\n\nPlease sign in and change this password as soon as possible."
                );
            } catch (\Throwable $e) {
                error_log('[email] Welcome email failed for patient ' . $email . ': ' . $e->getMessage());
            }
        }
    }

    jsonResponse(['success' => true, 'email' => $email ?: null, 'tempPassword' => $tempPassword]);

} catch (PDOException $e) {
    jsonResponse(['success' => false, 'message' => 'Database error. Please try again.'], 500);
}
