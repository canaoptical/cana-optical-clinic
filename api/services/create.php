<?php
// ================================================================
//  CANAOPTICALCLINIC — api/services/create.php
//  POST { name, description, status, icon, bookable, patientVisible } — admin only.
//  No per-service duration — every appointment runs on the one clinic-wide
//  interval (clinic_settings.default_duration).
// ================================================================

require_once '../../config/db.php';
require_once '../helpers.php';

requireMethod('POST');
startSession();

if (!isset($_SESSION['user_id'])) {
    jsonResponse(['success' => false, 'message' => 'Not authenticated.'], 401);
}
if (($_SESSION['role'] ?? '') !== 'admin') {
    jsonResponse(['success' => false, 'message' => 'Only admins may add services.'], 403);
}

$b = getBody();

$name   = trim($b['name'] ?? '');
$desc   = trim($b['description'] ?? '');
$status = in_array($b['status'] ?? '', ['active', 'inactive'], true) ? $b['status'] : 'active';
$icon   = trim($b['icon'] ?? 'eye');
// Both default true — a newly-added service starts out fully offered
// (bookable + visible to patients) unless the admin explicitly narrows it,
// same default-open posture the `status` field already has.
$bookable       = array_key_exists('bookable', $b)       ? (int)!!$b['bookable']       : 1;
$patientVisible = array_key_exists('patientVisible', $b) ? (int)!!$b['patientVisible'] : 1;

if (!$name) {
    jsonResponse(['success' => false, 'message' => 'Service name is required.']);
}

try {
    $pdo = getDB();
    $pdo->prepare('INSERT INTO clinic_services (name, description, status, icon, bookable, patient_visible) VALUES (?, ?, ?, ?, ?, ?)')
        ->execute([$name, $desc, $status, $icon, $bookable, $patientVisible]);

    $id = (int)$pdo->lastInsertId();

    jsonResponse(['success' => true, 'service' => [
        'id' => $id, 'name' => $name, 'description' => $desc,
        'status' => $status, 'icon' => $icon,
        'bookable' => (bool)$bookable, 'patientVisible' => (bool)$patientVisible,
    ]]);

} catch (PDOException $e) {
    jsonResponse(['success' => false, 'message' => 'Database error.'], 500);
}
