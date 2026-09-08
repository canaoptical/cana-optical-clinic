<?php
// ================================================================
//  CANAOPTICALCLINIC — api/patients/index.php
//  GET → returns all patients (admin/staff/doctor only)
//  Each patient includes their examinations, prescriptions,
//  and consultations so the front-end can work offline.
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

$role = $_SESSION['role'] ?? '';
if (!in_array($role, ['admin', 'staff', 'doctor'], true)) {
    jsonResponse(['success' => false, 'message' => 'Unauthorized.'], 403);
}

try {
    $pdo = getDB();

    // ── Patients ──────────────────────────────────────────────────
    $ptRows = $pdo->query(
        'SELECT p.*, u.email
         FROM patients p
         LEFT JOIN users u ON u.id = p.user_id
         WHERE p.archived_at IS NULL
         ORDER BY p.last_name, p.first_name'
    )->fetchAll();

    // Fetch photo_url separately; gracefully handles pre-migration databases
    $photoMap = [];
    try {
        $photoRows = $pdo->query('SELECT id, photo_url FROM users WHERE photo_url IS NOT NULL')->fetchAll();
        foreach ($photoRows as $pr) {
            $photoMap[(int)$pr['id']] = $pr['photo_url'];
        }
    } catch (PDOException) { /* column may not exist yet — skip */ }

    // Doctor names are built in PHP (not SQL CONCAT) so they include the
    // middle initial via _mi() and stay in sync with doctors/index.php's
    // `name` field — the frontend matches doctors by this exact string
    // (see generateClearance's doctors.find(d => d.name === e.doctor)).
    $doctorName = fn($row) => empty($row['doctor_first']) ? '' : trim('Dr. ' . $row['doctor_first'] . _mi($row['doctor_middle'] ?? '') . ' ' . $row['doctor_last']);

    // ── Examinations ──────────────────────────────────────────────
    $examRows = $pdo->query(
        'SELECT e.*,
                d.first_name AS doctor_first, d.middle_name AS doctor_middle, d.last_name AS doctor_last
         FROM examinations e
         LEFT JOIN doctors d ON d.id = e.doctor_id
         WHERE e.archived_at IS NULL
         ORDER BY e.date DESC'
    )->fetchAll();

    // ── Prescriptions ─────────────────────────────────────────────
    $rxRows = $pdo->query(
        'SELECT rx.*,
                d.first_name AS doctor_first, d.middle_name AS doctor_middle, d.last_name AS doctor_last
         FROM prescriptions rx
         LEFT JOIN doctors d ON d.id = rx.doctor_id
         WHERE rx.archived_at IS NULL
         ORDER BY rx.date DESC'
    )->fetchAll();

    // ── Consultations ─────────────────────────────────────────────
    $conRows = $pdo->query(
        'SELECT c.*,
                d.first_name AS doctor_first, d.middle_name AS doctor_middle, d.last_name AS doctor_last
         FROM consultations c
         LEFT JOIN doctors d ON d.id = c.doctor_id
         WHERE c.archived_at IS NULL
         ORDER BY c.date DESC'
    )->fetchAll();

    // ── Group sub-records by patient_id ───────────────────────────
    $examsByPt = [];
    foreach ($examRows as $e) {
        $pid = $e['patient_id'];
        $examsByPt[$pid][] = [
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
        ];
    }

    $rxByPt = [];
    foreach ($rxRows as $rx) {
        $pid = $rx['patient_id'];
        $rxByPt[$pid][] = [
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
        ];
    }

    $conByPt = [];
    foreach ($conRows as $c) {
        $pid = $c['patient_id'];
        $conByPt[$pid][] = [
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
        ];
    }

    // ── Build patient objects ─────────────────────────────────────
    $result = array_map(function ($p) use ($examsByPt, $rxByPt, $conByPt, $photoMap) {
        $pid = $p['id'];
        return [
            'id'             => $pid,
            'firstName'      => $p['first_name'],
            'middleName'     => $p['middle_name'] ?? '',
            'lastName'       => $p['last_name'],
            'name'           => trim($p['first_name'] . _mi($p['middle_name'] ?? '') . ' ' . $p['last_name']),
            'email'          => $p['email'] ?? '',
            'gender'         => $p['gender'] ?? '',
            'dob'            => $p['dob'] ?? '',
            'age'            => (int)($p['age'] ?? 0),
            'contact'        => $p['contact'] ?? '',
            'address'        => $p['address'] ?? '',
            'occupation'     => $p['occupation'] ?? '',
            'medicalHistory' => $p['medical_history'] ?? '',
            'qrData'         => $p['qr_data'] ?? '',
            'registeredDate' => $p['registered_date'] ?? '',
            'lastVisit'      => $p['last_visit'] ?: '—',
            'status'         => $p['status'] ?? 'active',
            'noShowCount'    => (int)($p['no_show_count'] ?? 0),
            'bookingRestricted' => (bool)($p['booking_restricted'] ?? false),
            'deletionRequestedAt' => $p['deletion_requested_at']   ?? null,
            'deletionRequestReason' => $p['deletion_request_reason'] ?? '',
            'photoUrl'       => $photoMap[(int)($p['user_id'] ?? 0)] ?? null,
            'examinations'   => $examsByPt[$pid] ?? [],
            'prescriptions'  => $rxByPt[$pid]   ?? [],
            'consultations'  => $conByPt[$pid]   ?? [],
        ];
    }, $ptRows);

    jsonResponse(['success' => true, 'patients' => $result]);

} catch (PDOException $e) {
    jsonResponse(['success' => false, 'message' => 'Database error.'], 500);
}
