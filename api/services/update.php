<?php
// ================================================================
//  CANAOPTICALCLINIC — api/services/update.php
//  POST { id, name, description, status, icon, bookable, patientVisible } — admin only.
//  Only the fields present in the request body are updated. No per-service
//  duration — every appointment runs on the one clinic-wide interval
//  (clinic_settings.default_duration).
// ================================================================

require_once '../../config/db.php';
require_once '../helpers.php';

requireMethod('POST');
startSession();

if (!isset($_SESSION['user_id'])) {
    jsonResponse(['success' => false, 'message' => 'Not authenticated.'], 401);
}
if (($_SESSION['role'] ?? '') !== 'admin') {
    jsonResponse(['success' => false, 'message' => 'Only admins may edit services.'], 403);
}

$b  = getBody();
$id = (int)($b['id'] ?? 0);
if (!$id) {
    jsonResponse(['success' => false, 'message' => 'id is required.']);
}

$cols = ['name', 'description', 'status', 'icon', 'bookable', 'patientVisible'];
$sets   = [];
$values = [];

foreach ($cols as $c) {
    if (!array_key_exists($c, $b)) continue;
    if ($c === 'status') {
        $sets[]   = '`status` = ?';
        $values[] = in_array($b['status'], ['active', 'inactive'], true) ? $b['status'] : 'active';
    } elseif ($c === 'bookable') {
        $sets[]   = '`bookable` = ?';
        $values[] = (int)!!$b['bookable'];
    } elseif ($c === 'patientVisible') {
        // camelCase in the request body (JS convention) maps to the
        // snake_case `patient_visible` column — everything else here
        // happens to share its column name verbatim.
        $sets[]   = '`patient_visible` = ?';
        $values[] = (int)!!$b['patientVisible'];
    } else {
        $sets[]   = "`$c` = ?";
        $values[] = trim((string)$b[$c]);
    }
}

if (!$sets) {
    jsonResponse(['success' => false, 'message' => 'No fields to update.']);
}

try {
    $pdo = getDB();
    $values[] = $id;
    $pdo->prepare('UPDATE clinic_services SET ' . implode(', ', $sets) . ' WHERE id = ?')
        ->execute($values);

    $row = $pdo->prepare('SELECT * FROM clinic_services WHERE id = ?');
    $row->execute([$id]);
    $r = $row->fetch();
    if (!$r) {
        jsonResponse(['success' => false, 'message' => 'Service not found.'], 404);
    }

    jsonResponse(['success' => true, 'service' => [
        'id' => (int)$r['id'], 'name' => $r['name'], 'description' => $r['description'],
        'status' => $r['status'], 'icon' => $r['icon'],
        'bookable' => (bool)$r['bookable'], 'patientVisible' => (bool)$r['patient_visible'],
    ]]);

} catch (PDOException $e) {
    jsonResponse(['success' => false, 'message' => 'Database error.'], 500);
}
