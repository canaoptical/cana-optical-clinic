<?php
// ================================================================
//  CANAOPTICALCLINIC — api/users/reset_password.php
//  Admin only. Resets any user's password.
//  POST { profileId, role, newPassword }
//  → { success:true } | { success:false, message }
// ================================================================

require_once '../../config/db.php';
require_once '../helpers.php';

requireMethod('POST');
startSession();

if (!isset($_SESSION['user_id'])) {
    jsonResponse(['success' => false, 'message' => 'Not authenticated.'], 401);
}
if (!in_array($_SESSION['role'], ['admin', 'staff'], true)) {
    jsonResponse(['success' => false, 'message' => 'Only admins and staff may reset user passwords.'], 403);
}

$b         = getBody();
$profileId = trim($b['profileId']  ?? '');
$role      = trim($b['role']       ?? '');
$newPass   = $b['newPassword']     ?? '';

if (!$profileId || !$role || !$newPass) {
    jsonResponse(['success' => false, 'message' => 'profileId, role and newPassword are required.']);
}
if ($pwError = validatePasswordPolicy($newPass)) {
    jsonResponse(['success' => false, 'message' => $pwError]);
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

try {
    $pdo = getDB();

    $s = $pdo->prepare("SELECT user_id FROM `{$table}` WHERE id = ? LIMIT 1");
    $s->execute([$profileId]);
    $row = $s->fetch();
    if (!$row || !$row['user_id']) {
        jsonResponse(['success' => false, 'message' => 'User account not found.']);
    }
    $targetUserId = (int)$row['user_id'];

    if (passwordWasUsedBefore($pdo, $targetUserId, $newPass)) {
        jsonResponse(['success' => false, 'message' => 'That was one of this user\'s previous passwords. Please choose a different one.']);
    }

    $curHashStmt = $pdo->prepare('SELECT password_hash FROM users WHERE id = ? LIMIT 1');
    $curHashStmt->execute([$targetUserId]);
    $curHash = $curHashStmt->fetchColumn();
    if ($curHash) recordPasswordHistory($pdo, $targetUserId, $curHash);

    $hash = password_hash($newPass, PASSWORD_DEFAULT);
    // Record the ACTOR's role (admin/staff doing the reset), not the
    // target account's own role — see get_temp_password.php / the Edit
    // Patient "Temporary Password" check, which reads this back to show
    // who actually changed it.
    $pdo->prepare('UPDATE users SET password_hash = ?, password_changed_by = ? WHERE id = ?')
        ->execute([$hash, $_SESSION['role'], $targetUserId]);

    // Admin resetting someone else's password — revoke every session on
    // the TARGET account, no exceptions. The admin isn't the account
    // owner, so none of that account's sessions are theirs to keep.
    revokeAllSessions($pdo, $targetUserId);

    jsonResponse(['success' => true]);

} catch (PDOException $e) {
    jsonResponse(['success' => false, 'message' => 'Database error. Please try again.'], 500);
}
