<?php
// ================================================================
//  CANAOPTICALCLINIC — api/users/change_password.php
//
//  POST { currentPassword, newPassword }
//  Any authenticated user (any role).
// ================================================================

require_once '../../config/db.php';
require_once '../helpers.php';

requireMethod('POST');
startSession();

if (!isset($_SESSION['user_id'])) {
    jsonResponse(['success' => false, 'message' => 'Not authenticated.'], 401);
}

$userId = (int)$_SESSION['user_id'];
$b      = getBody();
$curPw  = $b['currentPassword'] ?? '';
$newPw  = $b['newPassword']     ?? '';

if (!$curPw || !$newPw) {
    jsonResponse(['success' => false, 'message' => 'Current and new password are required.']);
}
if ($pwError = validatePasswordPolicy($newPw)) {
    jsonResponse(['success' => false, 'message' => $pwError]);
}

try {
    $pdo  = getDB();
    $stmt = $pdo->prepare('SELECT password_hash FROM users WHERE id = ? LIMIT 1');
    $stmt->execute([$userId]);
    $user = $stmt->fetch();

    if (!$user || !password_verify($curPw, $user['password_hash'])) {
        jsonResponse(['success' => false, 'message' => 'Current password is incorrect.']);
    }

    if (passwordWasUsedBefore($pdo, $userId, $newPw)) {
        jsonResponse(['success' => false, 'message' => 'You can\'t reuse a previous password. Please choose a different one.']);
    }

    recordPasswordHistory($pdo, $userId, $user['password_hash']);
    // Self-service change — the changer IS the account owner, so record
    // this account's own role. See get_temp_password.php / the Edit
    // Patient "Temporary Password" check, which reads this back to show
    // who actually changed it instead of assuming it was always the
    // patient.
    $pdo->prepare('UPDATE users SET password_hash = ?, password_changed_by = ? WHERE id = ?')
        ->execute([password_hash($newPw, PASSWORD_DEFAULT), $_SESSION['role'], $userId]);

    // Self-service change — revoke every OTHER session on the account,
    // but keep the device making this change signed in, same as
    // Facebook/Google.
    revokeOtherSessions($pdo, $userId, session_id());

    jsonResponse(['success' => true]);

} catch (PDOException $e) {
    jsonResponse(['success' => false, 'message' => 'Database error. Please try again.'], 500);
}
