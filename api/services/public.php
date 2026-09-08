<?php
// ================================================================
//  CANAOPTICALCLINIC — api/services/public.php
//  GET — public endpoint, no auth required.
//  Returns active, patient-visible services sorted by sort_order for the
//  public Services page. patient_visible = 0 (currently just Follow-up
//  Consultation, a staff-only appointment type) is excluded here even
//  though it's `active` — it's an internal booking type, not a service
//  the clinic advertises publicly. `bookable` is irrelevant to this
//  endpoint: a display-only service (bookable = 0) still belongs on the
//  public page, it's just never offered in the appointment wizard.
// ================================================================

require_once '../../config/db.php';
require_once '../helpers.php';

if ($_SERVER['REQUEST_METHOD'] !== 'GET') {
    jsonResponse(['success' => false, 'message' => 'Method not allowed.'], 405);
}

try {
    $pdo  = getDB();
    $rows = $pdo->query(
        "SELECT id, name, description, icon FROM clinic_services
         WHERE status = 'active' AND patient_visible = 1 ORDER BY sort_order ASC, id ASC"
    )->fetchAll();

    $services = array_map(fn($r) => [
        'id'          => (int)$r['id'],
        'name'        => $r['name'],
        'description' => $r['description'] ?? '',
        'icon'        => $r['icon'] ?? 'eye',
    ], $rows);

    jsonResponse(['success' => true, 'services' => $services]);
} catch (PDOException $e) {
    jsonResponse(['success' => false, 'services' => []], 500);
}
