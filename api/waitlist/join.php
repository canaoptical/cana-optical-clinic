<?php
// ================================================================
//  CANAOPTICALCLINIC — api/waitlist/join.php
//  Joins the waitlist for an exact doctor+date+time slot that was
//  unavailable at booking time. Patients join themselves; admin/staff may
//  join on behalf of a specific patient (POST { patientId } required then).
//  POST { doctorId, doctorName, date, time, type, termsAgreed, patientId? }
//  → { success:true, id:<int> }
// ================================================================

require_once '../../config/db.php';
require_once '../helpers.php';

requireMethod('POST');
startSession();

if (!isset($_SESSION['user_id'])) {
    jsonResponse(['success' => false, 'message' => 'Not authenticated.'], 401);
}
$role = $_SESSION['role'] ?? '';
if (!in_array($role, ['admin', 'staff', 'patient'], true)) {
    jsonResponse(['success' => false, 'message' => 'Unauthorized.'], 403);
}

$b = getBody();

// Patients can only ever waitlist themselves (session-derived, can't be
// spoofed via the body); admin/staff must say who they're waitlisting.
if ($role === 'patient') {
    $patientId = $_SESSION['profile_id'] ?? '';
} else {
    $patientId = trim($b['patientId'] ?? '');
    if (!$patientId) {
        jsonResponse(['success' => false, 'message' => 'patientId is required.']);
    }
}

$doctorId    = trim($b['doctorId']    ?? '');
$doctorName  = trim($b['doctorName']  ?? '');
$date        = trim($b['date']        ?? '');
$time        = trim($b['time']        ?? '');
$type        = trim($b['type']        ?? 'Comprehensive Eye Examination');
$termsAgreed = !empty($b['termsAgreed']);

if (!$doctorId || !$date || !$time) {
    jsonResponse(['success' => false, 'message' => 'Doctor, date and time are required.']);
}
// Terms-agreement is a self-service concept — mirrors create.php, which
// only requires it when a patient is booking for themselves.
if ($role === 'patient' && !$termsAgreed) {
    jsonResponse(['success' => false, 'message' => 'Please agree to the appointment policy before joining the waitlist.']);
}

try {
    $pdo = getDB();

    // Same restriction gates as create.php, and same exception — these
    // govern self-service patient bookings; admin/staff retain the same
    // discretion here that they already have when creating the appointment
    // itself (e.g. squeezing in an urgent case, waitlisting past the normal
    // advance-booking window on a patient's behalf).
    if ($role === 'patient') {
        $restricted = $pdo->prepare('SELECT booking_restricted FROM patients WHERE id = ? LIMIT 1');
        $restricted->execute([$patientId]);
        if ((int)$restricted->fetchColumn() === 1) {
            jsonResponse(['success' => false, 'message' =>
                'Online booking is currently unavailable for your account due to repeated missed appointments. Please contact the clinic directly to schedule.']);
        }

        $minDays = minAdvanceBookingDays($pdo);
        $today   = new DateTime('today');
        $reqDate = new DateTime($date);
        $daysOut = (int)$today->diff($reqDate)->format('%r%a');
        if ($daysOut < $minDays) {
            jsonResponse(['success' => false, 'message' => 'Please select a valid date.']);
        }

        $bs = $pdo->prepare('SELECT reason FROM blocked_dates WHERE doctor_id = ? AND date = ? LIMIT 1');
        $bs->execute([$doctorId, $date]);
        if ($bs->fetch()) {
            jsonResponse(['success' => false, 'message' => 'This doctor is unavailable on the selected date.']);
        }

    }

    // One active waitlist entry per patient, app-wide.
    $existing = $pdo->prepare(
        "SELECT id FROM appointment_waitlist WHERE patient_id = ? AND status IN ('waiting','offered') LIMIT 1"
    );
    $existing->execute([$patientId]);
    if ($existing->fetch()) {
        jsonResponse(['success' => false, 'message' =>
            "You're already on a waitlist. Please leave that one before joining another."]);
    }

    // Re-verify the slot is genuinely unavailable — a stale frontend
    // shouldn't be able to waitlist an actually-open slot.
    $durStr = $pdo->query('SELECT default_duration FROM clinic_settings WHERE id = 1 LIMIT 1')->fetchColumn();
    preg_match('/(\d+)/', $durStr ?: '45', $dm);
    $durationMin = isset($dm[1]) ? (int)$dm[1] : 45;
    $conflict = checkApptConflict($pdo, $doctorId, $date, $time, $durationMin);
    $held     = checkWaitlistHold($pdo, $doctorId, $date, $time, $patientId);
    if ($conflict === null && !$held) {
        jsonResponse(['success' => false, 'message' => 'This slot is actually available — please book it directly.']);
    }

    $patient = $pdo->prepare('SELECT CONCAT(first_name, " ", last_name) AS name FROM patients WHERE id = ? LIMIT 1');
    $patient->execute([$patientId]);
    $patientName = $patient->fetchColumn() ?: '';

    $pdo->prepare(
        'INSERT INTO appointment_waitlist
           (patient_id, patient_name, doctor_id, doctor_name, date, time, type, terms_agreed)
         VALUES (?, ?, ?, ?, ?, ?, ?, 1)'
    )->execute([$patientId, $patientName, $doctorId, $doctorName, $date, $time, $type]);

    // Only a genuine self-service join is worth telling admin/staff about —
    // when they themselves add a patient to the waitlist, they already know.
    if ($role === 'patient') {
        $fmtDate = date('M j, Y', strtotime($date));
        notifyAdminStaff($pdo, 'waitlist_join', 'Patient Joined Waitlist',
            "{$patientName} joined the waitlist for {$doctorName} on {$fmtDate} at {$time}."
        );
    }

    jsonResponse(['success' => true, 'id' => (int)$pdo->lastInsertId()]);

} catch (PDOException $e) {
    jsonResponse(['success' => false, 'message' => 'Database error. Please try again.'], 500);
}
