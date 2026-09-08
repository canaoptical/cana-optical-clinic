<?php
// ================================================================
//  CANAOPTICALCLINIC — api/doctors/unblock-date.php
//  POST { doctorId, date } — admin/staff only.
//  Removes a previously blocked date, restoring normal availability.
// ================================================================

require_once '../../config/db.php';
require_once '../helpers.php';

requireMethod('POST');
startSession();

if (!isset($_SESSION['user_id'])) {
    jsonResponse(['success' => false, 'message' => 'Not authenticated.'], 401);
}
$role = $_SESSION['role'] ?? '';
if (!in_array($role, ['admin', 'staff'], true)) {
    jsonResponse(['success' => false, 'message' => 'Only admin or staff may unblock dates.'], 403);
}

$b        = getBody();
$doctorId = trim($b['doctorId'] ?? '');
$date     = trim($b['date']     ?? '');

if (!$doctorId || !$date) {
    jsonResponse(['success' => false, 'message' => 'doctorId and date are required.']);
}

try {
    $pdo = getDB();
    $pdo->prepare('DELETE FROM blocked_dates WHERE doctor_id = ? AND date = ?')
        ->execute([$doctorId, $date]);

    jsonResponse(['success' => true]);

} catch (PDOException $e) {
    jsonResponse(['success' => false, 'message' => 'Database error. Please try again.'], 500);
}
