<?php
// ================================================================
//  CANAOPTICALCLINIC — api/archive/create.php
//  Archives a user account, patient, service, or examination record:
//  flags the underlying row as archived (blocking login for accounts) and
//  stores a restorable snapshot in archived_records.
//
//  POST { profileId, role, type, name, reason, archivedBy }
//   - role: 'Admin' | 'Staff' | 'Doctor' | 'Patient'  (Account/Patient only)
//   - type: 'Account' | 'Patient' | 'Service' | 'Examination'  (defaults to 'Account')
//
//  Admin only, EXCEPT type 'Examination' — that one is also usable by staff
//  and by the doctor who created the exam (same authorization as
//  api/examinations/delete.php's cascade-hard-delete, which this now
//  precedes: archive first, permanently delete later from Archives).
// ================================================================

require_once '../../config/db.php';
require_once '../helpers.php';

requireMethod('POST');
startSession();

if (!isset($_SESSION['user_id'])) {
    jsonResponse(['success' => false, 'message' => 'Not authenticated.'], 401);
}

$b          = getBody();
$profileId  = trim($b['profileId']  ?? '');
$role       = trim($b['role']       ?? '');
$type       = trim($b['type']       ?? 'Account');
$name       = trim($b['name']       ?? '');
$reason     = trim($b['reason']     ?? '') ?: 'No reason provided';
$archivedBy = trim($b['archivedBy'] ?? '') ?: 'Admin';

// ── Examinations — admin/staff/doctor(own), archived rather than a role
// row, so it's handled entirely on its own before the admin-only gate
// below applies to every other type. ──────────────────────────────────
if ($type === 'Examination') {
    $sessionRole = $_SESSION['role'] ?? '';
    if (!in_array($sessionRole, ['admin', 'staff', 'doctor'], true)) {
        jsonResponse(['success' => false, 'message' => 'Unauthorized.'], 403);
    }
    if (!$profileId) {
        jsonResponse(['success' => false, 'message' => 'profileId is required.']);
    }
    try {
        $pdo = getDB();

        $ex = $pdo->prepare(
            'SELECT e.*, p.first_name AS pt_first, p.last_name AS pt_last,
                    d.first_name AS doc_first, d.middle_name AS doc_middle, d.last_name AS doc_last
             FROM examinations e
             LEFT JOIN patients p ON p.id = e.patient_id
             LEFT JOIN doctors  d ON d.id = e.doctor_id
             WHERE e.id = ? LIMIT 1'
        );
        $ex->execute([$profileId]);
        $exam = $ex->fetch();
        if (!$exam) {
            jsonResponse(['success' => false, 'message' => 'Examination not found.']);
        }

        // A doctor may only archive an exam they themselves created —
        // admin/staff may archive any doctor's, same rule as the delete flow.
        if ($sessionRole === 'doctor' && $exam['doctor_id'] !== ($_SESSION['profile_id'] ?? '')) {
            jsonResponse(['success' => false, 'message' => 'You can only archive examinations you created yourself.'], 403);
        }

        $doctorName  = $exam['doc_first'] ? trim('Dr. ' . $exam['doc_first'] . _mi($exam['doc_middle'] ?? '') . ' ' . $exam['doc_last']) : '';
        $patientName = trim(($exam['pt_first'] ?? '') . ' ' . ($exam['pt_last'] ?? ''));

        $snapshot = [
            'id'             => $exam['id'],
            'patientId'      => $exam['patient_id'],
            'doctorId'       => $exam['doctor_id'],
            'consultationId' => $exam['consultation_id'],
            'date'           => $exam['date'],
            'doctor'         => $doctorName,
            'patientName'    => $patientName,
            'diagnosis'      => $exam['diagnosis'] ?? '',
            'status'         => $exam['status'] ?? 'completed',
        ];

        $pdo->prepare('UPDATE examinations SET archived_at = NOW() WHERE id = ?')->execute([$profileId]);
        // Cascade to the same visit's consultation/prescription so the whole
        // visit hides together (Consultations/Prescriptions tabs shouldn't
        // keep showing an entry that points at an exam no longer visible
        // anywhere) — mirrors the permanent-delete cascade below.
        if ($exam['consultation_id']) {
            $pdo->prepare('UPDATE consultations SET archived_at = NOW() WHERE id = ?')->execute([$exam['consultation_id']]);
        }
        $pdo->prepare('UPDATE prescriptions SET archived_at = NOW() WHERE exam_id = ?')->execute([$profileId]);

        $id   = 'AR' . date('YmdHis') . random_int(10, 99);
        $date = date('M j, Y');
        $displayName = $name ?: trim($patientName . ($exam['diagnosis'] ? ' — ' . $exam['diagnosis'] : ''));
        $pdo->prepare(
            'INSERT INTO archived_records (id, type, name, ref_id, archived_by, reason, data_json, date)
             VALUES (?, ?, ?, ?, ?, ?, ?, ?)'
        )->execute([$id, 'Examination', $displayName, $profileId, $archivedBy, $reason, json_encode($snapshot), $date]);

        jsonResponse(['success' => true, 'record' => [
            'id' => $id, 'type' => 'Examination', 'name' => $displayName, 'refId' => $profileId,
            'archivedBy' => $archivedBy, 'reason' => $reason, 'date' => $date, 'data' => $snapshot,
        ]]);
    } catch (PDOException $e) {
        jsonResponse(['success' => false, 'message' => 'Database error. Please try again.'], 500);
    }
}

if ($_SESSION['role'] !== 'admin') {
    jsonResponse(['success' => false, 'message' => 'Only admins may archive records.'], 403);
}

// Services aren't user accounts (no `role`/login to touch) — archive them
// straight from clinic_services instead of the Admin/Staff/Doctor/Patient
// role-table path below.
if ($type === 'Service') {
    if (!$profileId) {
        jsonResponse(['success' => false, 'message' => 'profileId is required.']);
    }
    try {
        $pdo = getDB();

        $s = $pdo->prepare('SELECT * FROM clinic_services WHERE id = ? LIMIT 1');
        $s->execute([$profileId]);
        $svc = $s->fetch();
        if (!$svc) {
            jsonResponse(['success' => false, 'message' => 'Service not found.']);
        }

        $snapshot = [
            'id' => (int)$svc['id'], 'name' => $svc['name'], 'description' => $svc['description'],
            'status' => $svc['status'], 'icon' => $svc['icon'],
        ];

        $pdo->prepare("UPDATE clinic_services SET status = 'inactive' WHERE id = ?")->execute([$profileId]);

        $id   = 'AR' . date('YmdHis') . random_int(10, 99);
        $date = date('M j, Y');
        $pdo->prepare(
            'INSERT INTO archived_records (id, type, name, ref_id, archived_by, reason, data_json, date)
             VALUES (?, ?, ?, ?, ?, ?, ?, ?)'
        )->execute([$id, 'Service', $name ?: $svc['name'], $profileId, $archivedBy, $reason, json_encode($snapshot), $date]);

        jsonResponse(['success' => true, 'record' => [
            'id' => $id, 'type' => 'Service', 'name' => $name ?: $svc['name'], 'refId' => $profileId,
            'archivedBy' => $archivedBy, 'reason' => $reason, 'date' => $date, 'data' => $snapshot,
        ]]);
    } catch (PDOException $e) {
        jsonResponse(['success' => false, 'message' => 'Database error. Please try again.'], 500);
    }
}

$tableMap = ['Admin' => 'admins', 'Staff' => 'staff', 'Doctor' => 'doctors', 'Patient' => 'patients'];
$table    = $tableMap[$role] ?? null;

if (!$profileId || !$table || !in_array($type, ['Account', 'Patient'], true)) {
    jsonResponse(['success' => false, 'message' => 'profileId, a valid role and type are required.']);
}

try {
    $pdo = getDB();

    $s = $pdo->prepare("SELECT * FROM `{$table}` WHERE id = ? LIMIT 1");
    $s->execute([$profileId]);
    $row = $s->fetch();
    if (!$row) {
        jsonResponse(['success' => false, 'message' => 'Record not found.']);
    }

    $email    = '';
    $photoUrl = null;
    $userId   = $row['user_id'] ?? null;
    if ($userId) {
        $us = $pdo->prepare('SELECT email FROM users WHERE id = ? LIMIT 1');
        $us->execute([$userId]);
        $email = $us->fetchColumn() ?: '';

        // Own try/catch, same as loadUserProfile()'s own photo_url fetch
        // (helpers.php) — a pre-migration DB missing this column should
        // never break archiving itself, just leave the snapshot's photo
        // blank.
        try {
            $ps = $pdo->prepare('SELECT photo_url FROM users WHERE id = ? LIMIT 1');
            $ps->execute([$userId]);
            $photoUrl = $ps->fetchColumn() ?: null;
        } catch (PDOException) {
            $photoUrl = null;
        }
    }

    // Build a restorable snapshot matching the frontend's object shape.
    // photoUrl included so the Archived Record modal can show the actual
    // person instead of just a generic archive-box icon (viewArchivedRecord(),
    // main.js) — a snapshot taken at archive time, same as every other field
    // here, so a record archived before this existed simply has none.
    $snapshot = [
        'id'        => $row['id'],
        'firstName' => $row['first_name'],
        'lastName'  => $row['last_name'],
        'name'      => ($role === 'Doctor' ? 'Dr. ' : '') . $row['first_name'] . ' ' . $row['last_name'],
        'email'     => $email,
        'contact'   => $row['contact'] ?? '',
        'status'    => $row['status']  ?? 'active',
        'role'      => $role,
        'photoUrl'  => $photoUrl,
    ];
    if ($role === 'Doctor') {
        $snapshot['specialization'] = $row['specialization'] ?? 'Optometrist';
        $snapshot['available']      = (bool)($row['available'] ?? true);
        $snapshot['hours']          = $row['work_hours'] ?? '';
    }
    if ($role === 'Patient') {
        $snapshot['gender']         = $row['gender']          ?? '';
        $snapshot['dob']            = $row['dob']              ?? '';
        $snapshot['age']            = (int)($row['age']        ?? 0);
        $snapshot['address']        = $row['address']          ?? '';
        $snapshot['occupation']     = $row['occupation']       ?? '';
        $snapshot['medicalHistory'] = $row['medical_history']  ?? '';
    }

    // Flag as archived and block login
    $pdo->prepare("UPDATE `{$table}` SET archived_at = NOW() WHERE id = ?")->execute([$profileId]);
    if ($userId) {
        $pdo->prepare('UPDATE users SET is_active = 0 WHERE id = ?')->execute([$userId]);
    }
    // Archiving a patient IS how their own self-service deletion request
    // (api/patients/request-deletion.php) actually gets fulfilled — clear
    // the pending flag so it doesn't keep showing as an open request once
    // this action, which already accomplishes what they asked for, has
    // been taken.
    if ($role === 'Patient') {
        $pdo->prepare(
            'UPDATE patients SET deletion_requested_at = NULL, deletion_request_reason = NULL WHERE id = ?'
        )->execute([$profileId]);
    }

    $id = 'AR' . date('YmdHis') . random_int(10, 99);
    $date = date('M j, Y');

    $pdo->prepare(
        'INSERT INTO archived_records (id, type, name, ref_id, archived_by, reason, data_json, date)
         VALUES (?, ?, ?, ?, ?, ?, ?, ?)'
    )->execute([
        $id, $type, $name ?: $snapshot['name'], $profileId, $archivedBy, $reason,
        json_encode($snapshot), $date,
    ]);

    jsonResponse(['success' => true, 'record' => [
        'id' => $id, 'type' => $type, 'name' => $name ?: $snapshot['name'], 'refId' => $profileId,
        'archivedBy' => $archivedBy, 'reason' => $reason, 'date' => $date, 'data' => $snapshot,
    ]]);

} catch (PDOException $e) {
    jsonResponse(['success' => false, 'message' => 'Database error. Please try again.'], 500);
}
