<?php
// ================================================================
//  CANAOPTICALCLINIC — api/admin/update_user.php
//  Admin-only endpoint to update any user's profile.
//
//  POST { profileId, role, firstName, lastName, email, contact, status }
//  → { success:true } | { success:false, message }
// ================================================================

require_once '../../config/db.php';
require_once '../helpers.php';

requireMethod('POST');
startSession();

if (!isset($_SESSION['user_id'])) {
    jsonResponse(['success' => false, 'message' => 'Not authenticated.'], 401);
}
if ($_SESSION['role'] !== 'admin') {
    jsonResponse(['success' => false, 'message' => 'Only admins may edit user profiles.'], 403);
}

$b             = getBody();
$profileId     = trim($b['profileId']     ?? '');
$role          = trim($b['role']          ?? '');
$fn            = trim($b['firstName']     ?? '');
$mn            = trim($b['middleName']    ?? '');
$ln            = trim($b['lastName']      ?? '');
$email         = trim($b['email']         ?? '');
$contact       = trim($b['contact']       ?? '');
$status        = trim($b['status']        ?? '');
// Doctor-only fields — patients/staff/admin profiles don't have these
$specialization = trim($b['specialization'] ?? '');
$prcLicense      = trim($b['prcLicense']     ?? '');
$degree          = trim($b['degree']          ?? '');
$secondaryCredential = trim($b['secondaryCredential'] ?? '');
$secondaryPrc        = trim($b['secondaryPrc']        ?? '');
$sortOrder       = isset($b['sortOrder']) ? max(0, (int)$b['sortOrder']) : null;

if (!$profileId || !$role || !$fn || !$ln) {
    jsonResponse(['success' => false, 'message' => 'profileId, role, firstName and lastName are required.']);
}
if ($contact && !isValidContact($contact)) {
    jsonResponse(['success' => false, 'message' => 'Please enter a valid 11-digit contact number.']);
}

$tableMap = [
    'Admin'   => 'admins',
    'Staff'   => 'staff',
    'Doctor'  => 'doctors',
    'Patient' => 'patients',
];

$table = $tableMap[$role] ?? null;
if (!$table) {
    jsonResponse(['success' => false, 'message' => 'Invalid role.']);
}

$validStatuses = ['active', 'inactive'];
if ($status && !in_array($status, $validStatuses, true)) {
    jsonResponse(['success' => false, 'message' => 'Invalid status value.']);
}

try {
    $pdo = getDB();

    // Look up user_id from role table
    $s = $pdo->prepare("SELECT user_id FROM `{$table}` WHERE id = ? LIMIT 1");
    $s->execute([$profileId]);
    $row = $s->fetch();
    if (!$row || !$row['user_id']) {
        jsonResponse(['success' => false, 'message' => 'User not found.']);
    }
    $userId = (int)$row['user_id'];

    // Update name and contact on the role table
    $pdo->prepare(
        "UPDATE `{$table}` SET first_name = ?, middle_name = ?, last_name = ?, contact = ?" .
        ($status ? ", status = ?" : "") .
        " WHERE id = ?"
    )->execute($status
        ? [$fn, $mn ?: null, $ln, $contact, $status, $profileId]
        : [$fn, $mn ?: null, $ln, $contact, $profileId]
    );

    // Doctor-only: specialization, degree, PRC license, and display order are locked
    // on the doctor's own Settings page — this is the only place they can be changed.
    $swappedWith = null;
    if ($role === 'Doctor') {
        $sets = [];
        $vals = [];
        if ($specialization !== '') { $sets[] = "specialization = COALESCE(NULLIF(?, ''), specialization)"; $vals[] = $specialization; }
        if ($prcLicense     !== '') { $sets[] = 'prc_license = ?';  $vals[] = $prcLicense; }
        if ($degree         !== '') { $sets[] = 'degree = ?';       $vals[] = $degree; }
        // Secondary credential is genuinely optional and paired (only prints
        // on the clearance when both fields are present) — unlike the
        // fields above, blanking it out is a real, intended action (the
        // doctor no longer holds it / it was entered by mistake), so this
        // always sets both rather than skipping empty values.
        $sets[] = 'secondary_credential = ?'; $vals[] = $secondaryCredential ?: null;
        $sets[] = 'secondary_prc = ?';        $vals[] = $secondaryPrc ?: null;
        if ($sortOrder !== null) {
            // Fetch current sort_order of this doctor before overwriting
            $curStmt = $pdo->prepare("SELECT sort_order FROM doctors WHERE id = ? LIMIT 1");
            $curStmt->execute([$profileId]);
            $currentOrder = (int)($curStmt->fetchColumn() ?? 0);

            // If another doctor already holds the requested sort_order, swap them
            $conflictStmt = $pdo->prepare("SELECT id FROM doctors WHERE sort_order = ? AND id != ? LIMIT 1");
            $conflictStmt->execute([$sortOrder, $profileId]);
            $conflictId = $conflictStmt->fetchColumn();
            if ($conflictId) {
                $pdo->prepare("UPDATE doctors SET sort_order = ? WHERE id = ?")->execute([$currentOrder, $conflictId]);
                $swappedWith = ['id' => $conflictId, 'sortOrder' => $currentOrder];
            }

            $sets[] = 'sort_order = ?';
            $vals[] = $sortOrder;
        }
        if ($sets) {
            $vals[] = $profileId;
            $pdo->prepare("UPDATE doctors SET " . implode(', ', $sets) . " WHERE id = ?")->execute($vals);
        }
    }

    // Sync is_active on users table when status changes
    if ($status) {
        $isActive = ($status === 'active') ? 1 : 0;
        // Reset the inactivity clock on reactivation, otherwise the stale
        // last_login_at immediately re-triggers the 1-year auto-deactivation
        // on the user's very next login.
        $pdo->prepare(
            'UPDATE users SET is_active = ?' . ($isActive ? ', last_login_at = NOW()' : '') . ' WHERE id = ?'
        )->execute([$isActive, $userId]);
    }

    // Update email on users table (with duplicate check)
    if ($email && filter_var($email, FILTER_VALIDATE_EMAIL)) {
        $chk = $pdo->prepare('SELECT id FROM users WHERE email = ? AND id != ? LIMIT 1');
        $chk->execute([$email, $userId]);
        if ($chk->fetch()) {
            jsonResponse(['success' => false, 'message' => 'An account with this email already exists.']);
        }
        $pdo->prepare('UPDATE users SET email = ? WHERE id = ?')->execute([$email, $userId]);
    }

    jsonResponse(['success' => true, 'swappedWith' => $swappedWith]);

} catch (PDOException $e) {
    jsonResponse(['success' => false, 'message' => 'Database error. Please try again.'], 500);
}
