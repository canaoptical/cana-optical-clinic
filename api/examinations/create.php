<?php
// ================================================================
//  CANAOPTICALCLINIC — api/examinations/create.php
//  POST { patientId, apptId?, doctorId?, date,
//         appointmentType?, chiefComplaint?, historyPresentIllness?,
//         assessment?, recommendation?, followUpDate?, consultationStatus?,
//         od, os, iop, pd, externalFindings?, diagnosis, testResults?, remarks?,
//         issuePrescription?, lensType?, lensMaterial?, lensCoating?, frameSelection? }
//  → { success:true, id:'E001', consultationId:'C001', rxId:'RX001'? }
//
//  One visit, three separate records — each carrying only the fields
//  that belong to it (see database/schema.sql's CREATE TABLE comments
//  for consultations/examinations/prescriptions):
//   1. Consultation — the narrative of the visit (chief complaint,
//      history, assessment, plan, follow-up). Always created.
//   2. Examination  — the clinical measurements (VA, refraction, eye
//      findings, diagnosis). Always created, linked back to the
//      consultation via consultation_id.
//   3. Prescription — the issued document (final refraction, lens type/
//      coating, PRC license, expiry). Only created when the doctor
//      explicitly issues one (issuePrescription), linked to the exam
//      via exam_id — never inferred from "a sphere value was typed".
// ================================================================

require_once '../../config/db.php';
require_once '../helpers.php';

requireMethod('POST');
startSession();

if (!isset($_SESSION['user_id'])) {
    jsonResponse(['success' => false, 'message' => 'Not authenticated.'], 401);
}

$role      = $_SESSION['role']       ?? '';
$profileId = $_SESSION['profile_id'] ?? '';

if (!in_array($role, ['doctor'], true)) {
    jsonResponse(['success' => false, 'message' => 'Unauthorized.'], 403);
}

$b = getBody();

$patientId = trim($b['patientId'] ?? '');
$apptId    = trim($b['apptId']    ?? '');

if (!$patientId) {
    jsonResponse(['success' => false, 'message' => 'patientId is required.']);
}

// Determine doctor id/name
if ($role === 'doctor') {
    $doctorId = $profileId;
} else {
    // admin/staff: use doctorId from the linked appointment or the body
    $doctorId = trim($b['doctorId'] ?? '');
}

try {
    $pdo = getDB();

    // Resolve doctor name + PRC license (the license is snapshotted onto
    // any prescription issued below, not looked up live later, so a
    // historical Rx stays accurate even if the doctor's license number
    // on file is later corrected/renewed).
    $drRow = null;
    if ($doctorId) {
        $drRow = $pdo->prepare('SELECT first_name, last_name, prc_license FROM doctors WHERE id = ? LIMIT 1');
        $drRow->execute([$doctorId]);
        $drRow = $drRow->fetch();
    }
    $doctorName = $drRow ? 'Dr. ' . $drRow['first_name'] . ' ' . $drRow['last_name'] : ($b['doctorName'] ?? '');
    $prcLicense = $drRow['prc_license'] ?? null;

    $date = $b['date'] ?? date('Y-m-d');

    $od  = $b['od']  ?? [];
    $os  = $b['os']  ?? [];
    $iop = $b['iop'] ?? [];

    $pdo->beginTransaction();

    // ── 1. Insert consultation (the narrative) — always ────────────
    $conId = nextRecordId($pdo, 'consultations', 'C');
    $pdo->prepare(
        'INSERT INTO consultations
           (id, patient_id, doctor_id, date, type,
            chief_complaint, history_present_illness, assessment, recommendation,
            follow_up_date, follow_up_time, status)
         VALUES (?,?,?,?,?,?,?,?,?,?,?,?)'
    )->execute([
        $conId, $patientId, $doctorId ?: null, $date,
        $b['appointmentType'] ?? 'Comprehensive Eye Examination',
        $b['chiefComplaint']         ?? '',
        $b['historyPresentIllness']  ?? '',
        $b['assessment']             ?? '',
        $b['recommendation']         ?? '',
        !empty($b['followUpDate']) ? $b['followUpDate'] : null,
        // Only meaningful alongside an actual follow-up date — an
        // orphaned time with no date can't happen from the wizard's own
        // picker (see openFollowUpPicker(), main.js), but guard here too
        // in case of a direct API call.
        (!empty($b['followUpDate']) && !empty($b['followUpTime'])) ? $b['followUpTime'] : null,
        $b['consultationStatus'] ?? 'completed',
    ]);

    // ── 2. Insert examination (the clinical measurements) — always ─
    $examId = nextRecordId($pdo, 'examinations', 'E');
    $pdo->prepare(
        'INSERT INTO examinations
           (id, patient_id, doctor_id, consultation_id, date,
            od_va_uncorrected, od_va_corrected, od_sph, od_cyl, od_axis, od_add,
            os_va_uncorrected, os_va_corrected, os_sph, os_cyl, os_axis, os_add,
            iop_od, iop_os, pd,
            external_findings, diagnosis, test_results, remarks, status)
         VALUES (?,?,?,?,?,?,?,?,?,?,?,?,?,?,?,?,?,?,?,?,?,?,?,?,?)'
    )->execute([
        $examId, $patientId, $doctorId ?: null, $conId, $date,
        $od['vaUncorrected'] ?? '', $od['va'] ?? '', $od['sph']  ?? '', $od['cyl']  ?? '', $od['axis'] ?? '', $od['add']  ?? '',
        $os['vaUncorrected'] ?? '', $os['va'] ?? '', $os['sph']  ?? '', $os['cyl']  ?? '', $os['axis'] ?? '', $os['add']  ?? '',
        $iop['od']  ?? '', $iop['os']  ?? '',
        $b['pd']  ?? '',
        $b['externalFindings'] ?? '',
        $b['diagnosis']    ?? '',
        $b['testResults']  ?? '',
        $b['remarks']      ?? '',
        'completed',
    ]);

    // Backfill the consultation's own link now that the exam id exists
    // (the two rows reference each other, so one side has to be created
    // first and patched — consultation went first above).
    $pdo->prepare('UPDATE consultations SET exam_id = ? WHERE id = ?')->execute([$examId, $conId]);

    // ── 3. Insert prescription (the issued document) — only when the ──
    //   doctor explicitly issues one, never inferred from "a sphere
    //   value happens to be filled in".
    $rxId = null;
    if (!empty($b['issuePrescription'])) {
        $rxId = nextRecordId($pdo, 'prescriptions', 'RX');
        $lensCoating = $b['lensCoating'] ?? [];
        $coatingJson = is_array($lensCoating) ? json_encode($lensCoating) : '[]';
        $expiryDate  = date('Y-m-d', strtotime($date . ' +1 year'));

        // Dispensing (Total Amount/Dispensed Date/Received By) — only
        // meaningful alongside an actually-issued prescription, so it's
        // captured here rather than on examinations.
        $totalAmountRaw = $b['totalAmount'] ?? '';
        $totalAmount = ($totalAmountRaw !== '' && $totalAmountRaw !== null) ? (float)$totalAmountRaw : null;

        $pdo->prepare(
            'INSERT INTO prescriptions
               (id, patient_id, doctor_id, exam_id, date, expiry_date, status, prc_license,
                od_sph, od_cyl, od_axis, od_add,
                os_sph, os_cyl, os_axis, os_add, pd,
                lens_type, lens_material, frame_selection, lens_coating,
                total_amount, dispensed_date, received_by)
             VALUES (?,?,?,?,?,?,?,?,?,?,?,?,?,?,?,?,?,?,?,?,?,?,?,?)'
        )->execute([
            $rxId, $patientId, $doctorId ?: null, $examId, $date, $expiryDate, 'valid', $prcLicense,
            $od['sph']  ?? '', $od['cyl']  ?? '', $od['axis'] ?? '', $od['add']  ?? '',
            $os['sph']  ?? '', $os['cyl']  ?? '', $os['axis'] ?? '', $os['add']  ?? '',
            $b['pd']  ?? '',
            $b['lensType']       ?? '',
            $b['lensMaterial']   ?? '',
            $b['frameSelection'] ?? '',
            $coatingJson,
            $totalAmount,
            !empty($b['dispensedDate']) ? $b['dispensedDate'] : null,
            $b['receivedBy'] ?? null,
        ]);
    }

    // ── Update patient last_visit ──────────────────────────────────
    $pdo->prepare('UPDATE patients SET last_visit = ? WHERE id = ?')
        ->execute([$date, $patientId]);

    // ── Mark linked appointment as completed ───────────────────────
    if ($apptId) {
        $pdo->prepare(
            'UPDATE appointments SET status = "completed" WHERE id = ?'
        )->execute([$apptId]);
    }

    // ── Activity log ───────────────────────────────────────────────
    $ptRow = $pdo->prepare('SELECT first_name, last_name FROM patients WHERE id = ? LIMIT 1');
    $ptRow->execute([$patientId]);
    $ptRow = $ptRow->fetch();
    $ptName = $ptRow ? $ptRow['first_name'] . ' ' . $ptRow['last_name'] : $patientId;

    $staffName = '';
    switch ($role) {
        case 'doctor':
            $staffName = $doctorName;
            break;
        default:
            $uRow = $pdo->prepare('SELECT u.id, p.first_name, p.last_name FROM users u LEFT JOIN admins p ON p.user_id = u.id WHERE u.id = ? LIMIT 1');
            $uRow->execute([(int)$_SESSION['user_id']]);
            $uRow = $uRow->fetch();
            $staffName = $uRow ? ($uRow['first_name'] . ' ' . $uRow['last_name']) : 'Staff';
    }

    $logId = 'L' . date('YmdHis') . rand(100, 999);
    $pdo->prepare(
        'INSERT IGNORE INTO activity_log (id, user_name, role, action, timestamp, type)
         VALUES (?,?,?,?,NOW(),?)'
    )->execute([
        substr($logId, 0, 20),
        $staffName,
        ucfirst($role),
        "Saved optical examination for {$ptName} ({$patientId})",
        'examination',
    ]);

    $pdo->commit();

    // Doctor flagged this visit as needing a follow-up — nothing else in
    // the app creates that follow-up appointment automatically (deliberately;
    // scheduling still goes through the normal booking flow), so admin/staff
    // need to be told to go set one up rather than this just sitting quietly
    // on the consultation record until someone happens to notice it.
    if (!empty($b['followUpDate'])) {
        $fmtFollowUp = date('M j, Y', strtotime($b['followUpDate']));
        $fmtFollowUpTime = !empty($b['followUpTime']) ? " at {$b['followUpTime']}" : '';
        notifyAdminStaff($pdo, 'follow_up_needed', 'Follow-up Consultation Needed',
            "{$doctorName} recommends a follow-up for {$ptName} on {$fmtFollowUp}{$fmtFollowUpTime}. Please schedule the appointment.",
            $patientId
        );
    }

    jsonResponse(['success' => true, 'id' => $examId, 'consultationId' => $conId, 'rxId' => $rxId]);

} catch (PDOException $e) {
    if ($pdo->inTransaction()) $pdo->rollBack();
    jsonResponse(['success' => false, 'message' => 'Database error. Please try again.'], 500);
}
