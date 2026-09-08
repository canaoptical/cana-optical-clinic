<?php
// ================================================================
//  CANAOPTICALCLINIC — api/examinations/update.php
//  POST { examId, patientId, date,
//         appointmentType?, chiefComplaint?, historyPresentIllness?,
//         assessment?, recommendation?, followUpDate?, consultationStatus?,
//         od, os, iop, pd, externalFindings?, diagnosis, testResults?, remarks?,
//         issuePrescription?, lensType?, lensMaterial?, lensCoating?, frameSelection? }
//  → { success:true, id:'E001' } | { success:false, message }
//
//  Updates an existing examination record in place, AND now also
//  propagates the edit to its linked consultation (via examinations.
//  consultation_id) and linked prescription (via prescriptions.exam_id,
//  if one was issued) — previously this only touched `examinations`,
//  because those link columns didn't exist yet, so there was no reliable
//  way to find "the rows this exam originally created" to update instead
//  of leaving them stale. If the doctor issues a prescription for the
//  first time on an edit (one didn't exist at creation), one is created
//  now; an existing prescription is never deleted just because
//  issuePrescription was left unchecked on an edit — it's a
//  legally-standing document once issued.
// ================================================================

require_once '../../config/db.php';
require_once '../helpers.php';

requireMethod('POST');
startSession();

if (!isset($_SESSION['user_id'])) {
    jsonResponse(['success' => false, 'message' => 'Not authenticated.'], 401);
}

$role = $_SESSION['role'] ?? '';
if (!in_array($role, ['doctor'], true)) {
    jsonResponse(['success' => false, 'message' => 'Unauthorized.'], 403);
}

$b = getBody();

$examId    = trim($b['examId']    ?? '');
$patientId = trim($b['patientId'] ?? '');

if (!$examId || !$patientId) {
    jsonResponse(['success' => false, 'message' => 'examId and patientId are required.']);
}

try {
    $pdo = getDB();

    $exam = $pdo->prepare('SELECT id, doctor_id, consultation_id FROM examinations WHERE id = ? AND patient_id = ?');
    $exam->execute([$examId, $patientId]);
    $exam = $exam->fetch();
    if (!$exam) {
        jsonResponse(['success' => false, 'message' => 'Examination record not found.'], 404);
    }
    $doctorId = $exam['doctor_id'];

    $od  = $b['od']  ?? [];
    $os  = $b['os']  ?? [];
    $iop = $b['iop'] ?? [];

    $date = $b['date'] ?? date('Y-m-d');

    $pdo->beginTransaction();

    // ── Update examination ──────────────────────────────────────────
    $pdo->prepare(
        'UPDATE examinations SET
            date = ?,
            od_va_uncorrected = ?, od_va_corrected = ?, od_sph = ?, od_cyl = ?, od_axis = ?, od_add = ?,
            os_va_uncorrected = ?, os_va_corrected = ?, os_sph = ?, os_cyl = ?, os_axis = ?, os_add = ?,
            iop_od = ?, iop_os = ?, pd = ?,
            external_findings = ?, diagnosis = ?, test_results = ?, remarks = ?
         WHERE id = ? AND patient_id = ?'
    )->execute([
        $date,
        $od['vaUncorrected'] ?? '', $od['va'] ?? '', $od['sph']  ?? '', $od['cyl']  ?? '', $od['axis'] ?? '', $od['add']  ?? '',
        $os['vaUncorrected'] ?? '', $os['va'] ?? '', $os['sph']  ?? '', $os['cyl']  ?? '', $os['axis'] ?? '', $os['add']  ?? '',
        $iop['od']  ?? '', $iop['os']  ?? '',
        $b['pd']  ?? '',
        $b['externalFindings'] ?? '',
        $b['diagnosis']   ?? '',
        $b['testResults'] ?? '',
        $b['remarks']     ?? '',
        $examId, $patientId,
    ]);

    // ── Update the linked consultation, if there is one ──────────────
    // Snapshot the follow-up date beforehand so admin/staff only get
    // notified when it's actually newly set/changed on this save, not
    // re-notified every time the doctor edits some unrelated field on an
    // exam that already had a follow-up flagged.
    $oldFollowUpDate = null;
    $oldFollowUpTime = null;
    if ($exam['consultation_id']) {
        $oldFollowUp = $pdo->prepare('SELECT follow_up_date, follow_up_time FROM consultations WHERE id = ?');
        $oldFollowUp->execute([$exam['consultation_id']]);
        $oldFollowUp = $oldFollowUp->fetch();
        $oldFollowUpDate = $oldFollowUp['follow_up_date'] ?? null;
        $oldFollowUpTime = $oldFollowUp['follow_up_time'] ?? null;

        $pdo->prepare(
            'UPDATE consultations SET
                date = ?, type = ?, chief_complaint = ?, history_present_illness = ?,
                assessment = ?, recommendation = ?, follow_up_date = ?, follow_up_time = ?, status = ?
             WHERE id = ?'
        )->execute([
            $date,
            $b['appointmentType'] ?? 'Comprehensive Eye Examination',
            $b['chiefComplaint']        ?? '',
            $b['historyPresentIllness'] ?? '',
            $b['assessment']            ?? '',
            $b['recommendation']        ?? '',
            !empty($b['followUpDate']) ? $b['followUpDate'] : null,
            (!empty($b['followUpDate']) && !empty($b['followUpTime'])) ? $b['followUpTime'] : null,
            $b['consultationStatus'] ?? 'completed',
            $exam['consultation_id'],
        ]);
    }

    // ── Update (or create) the linked prescription ────────────────────
    if (!empty($b['issuePrescription'])) {
        $rx = $pdo->prepare('SELECT id FROM prescriptions WHERE exam_id = ? LIMIT 1');
        $rx->execute([$examId]);
        $rx = $rx->fetch();

        $lensCoating = $b['lensCoating'] ?? [];
        $coatingJson = is_array($lensCoating) ? json_encode($lensCoating) : '[]';
        $totalAmountRaw = $b['totalAmount'] ?? '';
        $totalAmount = ($totalAmountRaw !== '' && $totalAmountRaw !== null) ? (float)$totalAmountRaw : null;
        $dispensedDate = !empty($b['dispensedDate']) ? $b['dispensedDate'] : null;
        $receivedBy    = $b['receivedBy'] ?? null;

        if ($rx) {
            $pdo->prepare(
                'UPDATE prescriptions SET
                    date = ?, od_sph = ?, od_cyl = ?, od_axis = ?, od_add = ?,
                    os_sph = ?, os_cyl = ?, os_axis = ?, os_add = ?, pd = ?,
                    lens_type = ?, lens_material = ?, frame_selection = ?, lens_coating = ?,
                    total_amount = ?, dispensed_date = ?, received_by = ?
                 WHERE id = ?'
            )->execute([
                $date,
                $od['sph']  ?? '', $od['cyl']  ?? '', $od['axis'] ?? '', $od['add']  ?? '',
                $os['sph']  ?? '', $os['cyl']  ?? '', $os['axis'] ?? '', $os['add']  ?? '',
                $b['pd']  ?? '',
                $b['lensType']       ?? '',
                $b['lensMaterial']   ?? '',
                $b['frameSelection'] ?? '',
                $coatingJson,
                $totalAmount, $dispensedDate, $receivedBy,
                $rx['id'],
            ]);
        } else {
            // Doctor is issuing a prescription for the first time on this
            // edit — same PRC-license-snapshot + expiry logic as create.php.
            $drRow = $pdo->prepare('SELECT prc_license FROM doctors WHERE id = ? LIMIT 1');
            $drRow->execute([$doctorId]);
            $prcLicense = $drRow->fetchColumn() ?: null;
            $expiryDate = date('Y-m-d', strtotime($date . ' +1 year'));
            $rxId       = nextRecordId($pdo, 'prescriptions', 'RX');

            $pdo->prepare(
                'INSERT INTO prescriptions
                   (id, patient_id, doctor_id, exam_id, date, expiry_date, status, prc_license,
                    od_sph, od_cyl, od_axis, od_add,
                    os_sph, os_cyl, os_axis, os_add, pd,
                    lens_type, lens_material, frame_selection, lens_coating,
                    total_amount, dispensed_date, received_by)
                 VALUES (?,?,?,?,?,?,?,?,?,?,?,?,?,?,?,?,?,?,?,?,?,?,?,?)'
            )->execute([
                $rxId, $patientId, $doctorId, $examId, $date, $expiryDate, 'valid', $prcLicense,
                $od['sph']  ?? '', $od['cyl']  ?? '', $od['axis'] ?? '', $od['add']  ?? '',
                $os['sph']  ?? '', $os['cyl']  ?? '', $os['axis'] ?? '', $os['add']  ?? '',
                $b['pd']  ?? '',
                $b['lensType']       ?? '',
                $b['lensMaterial']   ?? '',
                $b['frameSelection'] ?? '',
                $coatingJson,
                $totalAmount, $dispensedDate, $receivedBy,
            ]);
        }
    }

    // ── Update patient last_visit (an edit still counts as the most recent touch) ──
    $pdo->prepare('UPDATE patients SET last_visit = ? WHERE id = ?')
        ->execute([$date, $patientId]);

    // ── Activity log ───────────────────────────────────────────────
    $ptRow = $pdo->prepare('SELECT first_name, last_name FROM patients WHERE id = ? LIMIT 1');
    $ptRow->execute([$patientId]);
    $ptRow = $ptRow->fetch();
    $ptName = $ptRow ? $ptRow['first_name'] . ' ' . $ptRow['last_name'] : $patientId;

    $drRow = $pdo->prepare('SELECT first_name, last_name FROM doctors WHERE id = ? LIMIT 1');
    $drRow->execute([$_SESSION['profile_id'] ?? '']);
    $drRow = $drRow->fetch();
    $doctorName = $drRow ? 'Dr. ' . $drRow['first_name'] . ' ' . $drRow['last_name'] : '';

    $logId = 'L' . date('YmdHis') . rand(100, 999);
    $pdo->prepare(
        'INSERT IGNORE INTO activity_log (id, user_name, role, action, timestamp, type)
         VALUES (?,?,?,?,NOW(),?)'
    )->execute([
        substr($logId, 0, 20),
        $doctorName,
        ucfirst($role),
        "Updated optical examination {$examId} for {$ptName} ({$patientId})",
        'examination',
    ]);

    $pdo->commit();

    // Only notify when the follow-up date is newly set or actually
    // changed on this save — see the snapshot taken before the consultation
    // UPDATE above.
    $newFollowUpDate = !empty($b['followUpDate']) ? $b['followUpDate'] : null;
    $newFollowUpTime = (!empty($b['followUpDate']) && !empty($b['followUpTime'])) ? $b['followUpTime'] : null;
    if ($newFollowUpDate && ($newFollowUpDate !== $oldFollowUpDate || $newFollowUpTime !== $oldFollowUpTime)) {
        $fmtFollowUp = date('M j, Y', strtotime($newFollowUpDate));
        $fmtFollowUpTime = $newFollowUpTime ? " at {$newFollowUpTime}" : '';
        notifyAdminStaff($pdo, 'follow_up_needed', 'Follow-up Consultation Needed',
            "{$doctorName} recommends a follow-up for {$ptName} on {$fmtFollowUp}{$fmtFollowUpTime}. Please schedule the appointment.",
            $patientId
        );
    }

    jsonResponse(['success' => true, 'id' => $examId]);

} catch (PDOException $e) {
    if ($pdo->inTransaction()) $pdo->rollBack();
    jsonResponse(['success' => false, 'message' => 'Database error. Please try again.'], 500);
}
