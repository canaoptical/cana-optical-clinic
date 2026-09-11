<?php
// ================================================================
//  CANAOPTICALCLINIC — api/qr/stats.php
//  GET — today's QR scan totals, plus the most recent scans (who scanned,
//  when, whether the patient was found) so scanned_by is actually
//  surfaced somewhere instead of just sitting in the log unread.
//  → 200 { success:true, total, found, notFound, recent:[...] } | { success:false, message }
// ================================================================

require_once '../../config/db.php';
require_once '../helpers.php';

requireMethod('GET');
startSession();

if (!isset($_SESSION['user_id'])) {
    jsonResponse(['success' => false, 'message' => 'Not authenticated.'], 401);
}

try {
    $pdo = getDB();
    $row = $pdo->query(
        'SELECT COUNT(*) AS total, COALESCE(SUM(found), 0) AS found
         FROM qr_scan_log WHERE DATE(scanned_at) = CURDATE()'
    )->fetch();

    $total = (int)$row['total'];
    $found = (int)$row['found'];

    // QR scanning is only ever done from the admin/staff/doctor "Find
    // Patient" screen (patients aren't the ones scanning), so resolving
    // scanned_by's name only needs those three role tables.
    $recentRows = $pdo->query(
        "SELECT l.id, l.found, l.scanned_at,
                p.first_name AS p_fn, p.last_name AS p_ln,
                COALESCE(
                    CONCAT(a.first_name, ' ', a.last_name),
                    CONCAT(s.first_name, ' ', s.last_name),
                    CONCAT('Dr. ', d.first_name, ' ', d.last_name)
                ) AS scanner_name,
                CASE WHEN a.id IS NOT NULL THEN 'Admin'
                     WHEN s.id IS NOT NULL THEN 'Staff'
                     WHEN d.id IS NOT NULL THEN 'Doctor'
                     ELSE NULL END AS scanner_role
           FROM qr_scan_log l
           LEFT JOIN admins   a ON a.user_id = l.scanned_by
           LEFT JOIN staff    s ON s.user_id = l.scanned_by
           LEFT JOIN doctors  d ON d.user_id = l.scanned_by
           LEFT JOIN patients p ON p.id = l.patient_id
          ORDER BY l.scanned_at DESC
          LIMIT 8"
    )->fetchAll();

    $recent = array_map(function ($r) {
        $patientName = trim(($r['p_fn'] ?? '') . ' ' . ($r['p_ln'] ?? ''));
        return [
            'id'          => (int)$r['id'],
            'found'       => (bool)$r['found'],
            'scannedAt'   => $r['scanned_at'],
            'patientName' => $patientName !== '' ? $patientName : null,
            // NULL when the scanning account was later deleted (FOREIGN
            // KEY ... ON DELETE SET NULL) — the log row survives, it just
            // can't say who anymore.
            'scannerName' => $r['scanner_name'] ?? 'Unknown',
            'scannerRole' => $r['scanner_role'] ?? null,
        ];
    }, $recentRows);

    jsonResponse(['success' => true, 'total' => $total, 'found' => $found, 'notFound' => $total - $found, 'recent' => $recent]);
} catch (PDOException $e) {
    jsonResponse(['success' => false, 'message' => 'Database error. Please try again.'], 500);
}
