<?php
// ================================================================
//  CANAOPTICALCLINIC — api/services/index.php
//  GET — any authenticated user. Returns all clinic services.
// ================================================================

require_once '../../config/db.php';
require_once '../helpers.php';

startSession();

if ($_SERVER['REQUEST_METHOD'] !== 'GET') {
    jsonResponse(['success' => false, 'message' => 'Method not allowed.'], 405);
}

if (!isset($_SESSION['user_id'])) {
    jsonResponse(['success' => false, 'message' => 'Not authenticated.'], 401);
}

try {
    $pdo  = getDB();
    $rows = $pdo->query('SELECT * FROM clinic_services ORDER BY sort_order ASC, id ASC')->fetchAll();

    $services = array_map(function (array $r): array {
        return [
            'id'             => (int)$r['id'],
            'name'           => $r['name'],
            'description'    => $r['description'],
            'status'         => $r['status'],
            'icon'           => $r['icon'],
            'sortOrder'      => (int)$r['sort_order'],
            'bookable'       => (bool)$r['bookable'],
            'patientVisible' => (bool)$r['patient_visible'],
        ];
    }, $rows);

    jsonResponse(['success' => true, 'services' => $services]);

} catch (PDOException $e) {
    jsonResponse(['success' => false, 'message' => 'Database error.'], 500);
}
