<?php
// ================================================================
//  CANAOPTICALCLINIC — api/patients/me.php
//  GET → returns the logged-in patient's own examinations,
//        prescriptions, and consultations.
//  Accessible only by the 'patient' role.
// ================================================================

require_once '../../config/db.php';
require_once '../helpers.php';

requireMethod('GET');
startSession();

if (!isset($_SESSION['user_id'])) {
    jsonResponse(['success' => false, 'message' => 'Not authenticated.'], 401);
}

$role      = $_SESSION['role']       ?? '';
$profileId = $_SESSION['profile_id'] ?? '';

if ($role !== 'patient' || !$profileId) {
    jsonResponse(['success' => false, 'message' => 'Unauthorized.'], 403);
}

try {
    $pdo = getDB();

    // Own account-deletion-request status, no-show count, and booking
    // restriction — lets the 30s poll (_syncMyRecords(), auth.js) notice
    // when admin/staff has archived/dismissed a deletion request or
    // cleared an online-booking restriction, and update the relevant page
    // (Settings > My Profile, Request Appointment) without the patient
    // having to reload the page themselves.
    $ds = $pdo->prepare('SELECT deletion_requested_at, deletion_request_reason, no_show_count, booking_restricted FROM patients WHERE id = ? LIMIT 1');
    $ds->execute([$profileId]);
    $delRow = $ds->fetch();

    // Doctor names are built in PHP (not SQL CONCAT) so they include the
    // middle initial via _mi() and stay in sync with doctors/index.php's
    // `name` field — the frontend matches doctors by this exact string
    // (see generateClearance's doctors.find(d => d.name === e.doctor)).
    $doctorName = fn($row) => empty($row['doctor_first']) ? '' : trim('Dr. ' . $row['doctor_first'] . _mi($row['doctor_middle'] ?? '') . ' ' . $row['doctor_last']);

    // ── Examinations ──────────────────────────────────────────────
    $examStmt = $pdo->prepare(
        'SELECT e.*,
                d.first_name AS doctor_first, d.middle_name AS doctor_middle, d.last_name AS doctor_last
         FROM examinations e
         LEFT JOIN doctors d ON d.id = e.doctor_id
         WHERE e.patient_id = ? AND e.archived_at IS NULL
         ORDER BY e.date DESC'
    );
    $examStmt->execute([$profileId]);
    $examRows = $examStmt->fetchAll();

    $examinations = array_map(fn($e) => [
        'id'                => $e['id'],
        'date'              => $e['date'],
        'doctor'            => $doctorName($e),
        'consultationId'    => $e['consultation_id'] ?? '',
        'od'                => ['vaUncorrected' => $e['od_va_uncorrected'] ?? '', 'va' => $e['od_va_corrected'] ?? '', 'sph' => $e['od_sph'] ?? '', 'cyl' => $e['od_cyl'] ?? '', 'axis' => $e['od_axis'] ?? '', 'add' => $e['od_add'] ?? ''],
        'os'                => ['vaUncorrected' => $e['os_va_uncorrected'] ?? '', 'va' => $e['os_va_corrected'] ?? '', 'sph' => $e['os_sph'] ?? '', 'cyl' => $e['os_cyl'] ?? '', 'axis' => $e['os_axis'] ?? '', 'add' => $e['os_add'] ?? ''],
        'iop'               => ['od' => $e['iop_od'] ?? '', 'os' => $e['iop_os'] ?? ''],
        'pd'                => $e['pd'] ?? '',
        'externalFindings'  => $e['external_findings'] ?? '',
        'diagnosis'         => $e['diagnosis'] ?? '',
        'testResults'       => $e['test_results'] ?? '',
        'remarks'           => $e['remarks'] ?? '',
        'status'            => $e['status'] ?? 'completed',
    ], $examRows);

    // ── Prescriptions ─────────────────────────────────────────────
    $rxStmt = $pdo->prepare(
        'SELECT rx.*,
                d.first_name AS doctor_first, d.middle_name AS doctor_middle, d.last_name AS doctor_last
         FROM prescriptions rx
         LEFT JOIN doctors d ON d.id = rx.doctor_id
         WHERE rx.patient_id = ? AND rx.archived_at IS NULL
         ORDER BY rx.date DESC'
    );
    $rxStmt->execute([$profileId]);
    $rxRows = $rxStmt->fetchAll();

    $prescriptions = array_map(fn($rx) => [
        'id'              => $rx['id'],
        'date'            => $rx['date'],
        'expiryDate'      => $rx['expiry_date'] ?? '',
        'status'          => $rx['status'] ?? 'valid',
        'prcLicense'      => $rx['prc_license'] ?? '',
        'doctor'          => $doctorName($rx),
        'examId'          => $rx['exam_id'] ?? '',
        'od'              => ['sph' => $rx['od_sph'] ?? '', 'cyl' => $rx['od_cyl'] ?? '', 'axis' => $rx['od_axis'] ?? '', 'add' => $rx['od_add'] ?? ''],
        'os'              => ['sph' => $rx['os_sph'] ?? '', 'cyl' => $rx['os_cyl'] ?? '', 'axis' => $rx['os_axis'] ?? '', 'add' => $rx['os_add'] ?? ''],
        'pd'              => $rx['pd'] ?? '',
        'lensType'        => $rx['lens_type'] ?? '',
        'lensMaterial'    => $rx['lens_material'] ?? '',
        'frameSelection'  => $rx['frame_selection'] ?? '',
        'lensCoating'     => $rx['lens_coating'] ? (json_decode($rx['lens_coating'], true) ?? []) : [],
        'totalAmount'     => $rx['total_amount'] ?? null,
        'dispensedDate'   => $rx['dispensed_date'] ?? '',
        'receivedBy'      => $rx['received_by'] ?? '',
    ], $rxRows);

    // ── Consultations ─────────────────────────────────────────────
    $conStmt = $pdo->prepare(
        'SELECT c.*,
                d.first_name AS doctor_first, d.middle_name AS doctor_middle, d.last_name AS doctor_last
         FROM consultations c
         LEFT JOIN doctors d ON d.id = c.doctor_id
         WHERE c.patient_id = ? AND c.archived_at IS NULL
         ORDER BY c.date DESC'
    );
    $conStmt->execute([$profileId]);
    $conRows = $conStmt->fetchAll();

    $consultations = array_map(fn($c) => [
        'id'                     => $c['id'],
        'date'                   => $c['date'],
        'doctor'                 => $doctorName($c),
        'examId'                 => $c['exam_id'] ?? '',
        'type'                   => $c['type'] ?? '',
        'chiefComplaint'         => $c['chief_complaint'] ?? '',
        'historyPresentIllness'  => $c['history_present_illness'] ?? '',
        'assessment'             => $c['assessment'] ?? '',
        'recommendation'         => $c['recommendation'] ?? '',
        'followUpDate'           => $c['follow_up_date'] ?? '',
        'followUpTime'           => $c['follow_up_time'] ?? '',
        'status'                 => $c['status'] ?? 'completed',
    ], $conRows);

    jsonResponse([
        'success'                => true,
        'examinations'           => $examinations,
        'prescriptions'          => $prescriptions,
        'consultations'          => $consultations,
        'deletionRequestedAt'    => $delRow['deletion_requested_at']   ?? null,
        'deletionRequestReason'  => $delRow['deletion_request_reason'] ?? '',
        'noShowCount'            => (int)($delRow['no_show_count'] ?? 0),
        'bookingRestricted'      => (bool)($delRow['booking_restricted'] ?? false),
    ]);

} catch (PDOException $e) {
    jsonResponse(['success' => false, 'message' => 'Database error.'], 500);
}
