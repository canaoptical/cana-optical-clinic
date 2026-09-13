<?php
// ================================================================
//  CANAOPTICALCLINIC — api/patients/create.php
//  Admin/Staff only. Registers a new patient from the dashboard.
//  POST { firstName, middleName?, lastName, gender, dob, contact, email?,
//         address?, occupation?, medicalHistory? }
//  → { success:true, patient, tempPassword? }
// ================================================================

require_once '../../config/db.php';
require_once '../../config/smtp.php';
require_once '../helpers.php';

requireMethod('POST');
startSession();

if (!isset($_SESSION['user_id'])) {
    jsonResponse(['success' => false, 'message' => 'Not authenticated.'], 401);
}
if (!in_array($_SESSION['role'], ['admin', 'staff'], true)) {
    jsonResponse(['success' => false, 'message' => 'Unauthorized.'], 403);
}

// Scoped per logged-in staff account, not per IP — a shared front-desk
// PC shouldn't have one spam-clicker lock out a coworker's own genuine
// registrations. 20 per 5 min comfortably covers a real walk-in rush
// while still stopping a rapid-fire double-click/scripted burst (each hit
// creates a patient row, and one with an email attached also sends a real
// welcome email — see sendEmail() below).
rateLimit('patient-create:' . $_SESSION['user_id'], 20, 300);

$b      = getBody();
$first  = trim($b['firstName']      ?? '');
$middle = trim($b['middleName']     ?? '');
$last   = trim($b['lastName']       ?? '');
$gender = trim($b['gender']         ?? '');
$dob    = trim($b['dob']            ?? '');
$contact= trim($b['contact']        ?? '');
$email  = trim($b['email']          ?? '');
$addr   = trim($b['address']        ?? '');
$occ    = trim($b['occupation']     ?? '');
$medHx  = trim($b['medicalHistory'] ?? '');

if (!$first || !$last || !$gender || !$dob) {
    jsonResponse(['success' => false, 'message' => 'First name, last name, gender and date of birth are required.']);
}
if ($contact && !isValidContact($contact)) {
    jsonResponse(['success' => false, 'message' => 'Please enter a valid 11-digit contact number.']);
}
if ($addr && !looksLikeAddress($addr)) {
    jsonResponse(['success' => false, 'message' => 'Please enter a complete address.']);
}

try {
    $pdo = getDB();

    // Check email uniqueness if provided
    if ($email) {
        if (!filter_var($email, FILTER_VALIDATE_EMAIL)) {
            jsonResponse(['success' => false, 'message' => 'Please enter a valid email address.']);
        }
        $chk = $pdo->prepare('SELECT id FROM users WHERE email = ? LIMIT 1');
        $chk->execute([$email]);
        if ($chk->fetch()) {
            jsonResponse(['success' => false, 'message' => 'An account with this email already exists.']);
        }
    }

    // Compute age
    $bd  = new DateTime($dob);
    $age = (int)$bd->diff(new DateTime())->y;

    // Generate unique patient ID
    $last_id = $pdo->query("SELECT id FROM patients ORDER BY id DESC LIMIT 1")->fetchColumn();
    $next    = 1;
    if ($last_id && preg_match('/^P(\d+)$/i', $last_id, $m)) {
        $next = (int)$m[1] + 1;
    }
    $pid = 'P' . str_pad($next, 3, '0', STR_PAD_LEFT);
    $dup = $pdo->prepare('SELECT id FROM patients WHERE id = ?');
    while (true) {
        $dup->execute([$pid]);
        if (!$dup->fetch()) break;
        $next++;
        $pid = 'P' . str_pad($next, 3, '0', STR_PAD_LEFT);
    }

    $qrData  = 'CANA-' . $pid . '-' . strtoupper($first . $last);
    $today   = date('Y-m-d');
    $uid     = null;
    $tempPw  = null;

    $pdo->beginTransaction();

    // Create login account if email provided
    if ($email) {
        $tempPw  = ucfirst(strtolower($first)) . '@' . date('Y');
        $hash    = password_hash($tempPw, PASSWORD_DEFAULT);
        $pdo->prepare('INSERT INTO users (email, password_hash, role) VALUES (?,?,?)')
            ->execute([$email, $hash, 'patient']);
        $uid = (int)$pdo->lastInsertId();
    }

    $pdo->prepare(
        'INSERT INTO patients
         (id, user_id, first_name, middle_name, last_name, gender, dob, age,
          contact, address, occupation, medical_history,
          qr_data, registered_date, status)
         VALUES (?,?,?,?,?,?,?,?,?,?,?,?,?,?,?)'
    )->execute([
        $pid, $uid, $first, $middle ?: null, $last, $gender, $dob, $age,
        $contact, $addr, $occ, $medHx ?: null,
        $qrData, $today, 'active',
    ]);

    // Welcome notification if user account was created
    if ($uid) {
        createNotification($pdo, $uid, 'welcome',
            'Welcome to Cana Optical Clinic',
            'Your patient account has been activated. You can now book appointments and view your records online.'
        );
    }

    $pdo->commit();

    // Welcome email — non-critical, never blocks the response. Includes
    // the temp password (generated above) so the patient actually has a
    // way to learn it beyond the one-time QR modal shown to whoever
    // registered them at the front desk.
    if ($uid && $email) {
        try {
            $fullName = "$first $last";
            sendEmail(
                $email, $fullName,
                'Welcome to Cana Optical Clinic',
                welcomeEmailBody($fullName, 'patient', $email, $tempPw),
                "Welcome, $fullName!\n\nYour patient account at Cana Optical Clinic has been created.\n\nLogin email: $email\nTemporary password: $tempPw\n\nPlease sign in and change this password as soon as possible."
            );
        } catch (\Throwable $e) {
            // Non-critical (never blocks account creation), but silently
            // swallowing this made "did the welcome email actually send?"
            // undebuggable — error_log() lands in Railway's deploy logs.
            error_log('[email] Welcome email failed for patient ' . $email . ': ' . $e->getMessage());
        }
    }

    $patientObj = [
        'id'             => $pid,
        'firstName'      => $first,
        'middleName'     => $middle,
        'lastName'       => $last,
        'name'           => "$first $last",
        'gender'         => $gender,
        'dob'            => $dob,
        'age'            => $age,
        'contact'        => $contact,
        'email'          => $email,
        'address'        => $addr,
        'occupation'     => $occ,
        'medicalHistory' => $medHx,
        'qrData'         => $qrData,
        'registeredDate' => $today,
        'lastVisit'      => '—',
        'status'         => 'active',
        'photoUrl'       => null,
        'consultations'  => [],
        'examinations'   => [],
        'prescriptions'  => [],
    ];

    $response = ['success' => true, 'patient' => $patientObj];
    if ($tempPw) $response['tempPassword'] = $tempPw;

    jsonResponse($response);

} catch (PDOException $e) {
    if (isset($pdo) && $pdo->inTransaction()) $pdo->rollBack();
    jsonResponse(['success' => false, 'message' => 'Database error. Please try again.'], 500);
}
