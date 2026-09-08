<?php
// ================================================================
//  CANAOPTICALCLINIC — api/patients/admin_update.php
//  Admin/Staff only. Edits an existing patient's profile, including
//  gender and date of birth — fields the patient cannot self-edit
//  (see api/patients/update.php, which is patient-self-service only
//  and intentionally excludes gender/dob for record-accuracy reasons).
//
//  POST { id, firstName, middleName?, lastName, gender?, dob?, contact?,
//         email?, address?, occupation?, medicalHistory? }
// ================================================================

require_once '../../config/db.php';
require_once '../helpers.php';

requireMethod('POST');
startSession();

if (!isset($_SESSION['user_id'])) {
    jsonResponse(['success' => false, 'message' => 'Not authenticated.'], 401);
}
if (!in_array($_SESSION['role'], ['admin', 'staff'], true)) {
    jsonResponse(['success' => false, 'message' => 'Unauthorized.'], 403);
}

$b    = getBody();
$id   = trim($b['id'] ?? '');
if (!$id) {
    jsonResponse(['success' => false, 'message' => 'Patient id is required.']);
}

$first   = trim($b['firstName']  ?? '');
$middle  = trim($b['middleName'] ?? '');
$last    = trim($b['lastName']   ?? '');
if (!$first || !$last) {
    jsonResponse(['success' => false, 'message' => 'First and last name are required.']);
}

$gender  = trim($b['gender']  ?? '');
$dob     = trim($b['dob']     ?? '');
$contact = trim($b['contact'] ?? '');
$email   = trim($b['email']   ?? '');
$address = trim($b['address'] ?? '');
$occupation = isset($b['occupation']) ? trim($b['occupation']) : null;
$medHx      = isset($b['medicalHistory']) ? trim($b['medicalHistory']) : null;
$status  = isset($b['status']) ? trim($b['status']) : null;

if ($gender && !in_array($gender, ['Male', 'Female', 'Other'], true)) {
    jsonResponse(['success' => false, 'message' => 'Invalid gender value.']);
}
if ($status && !in_array($status, ['active', 'inactive'], true)) {
    jsonResponse(['success' => false, 'message' => 'Invalid status value.']);
}
if ($contact && !isValidContact($contact)) {
    jsonResponse(['success' => false, 'message' => 'Please enter a valid 11-digit contact number.']);
}
if ($address && !looksLikeAddress($address)) {
    jsonResponse(['success' => false, 'message' => 'Please enter a complete address.']);
}

try {
    $pdo = getDB();

    $stmt = $pdo->prepare('SELECT * FROM patients WHERE id = ? LIMIT 1');
    $stmt->execute([$id]);
    $patient = $stmt->fetch();
    if (!$patient) {
        jsonResponse(['success' => false, 'message' => 'Patient not found.'], 404);
    }

    $sets   = ['first_name = ?', 'middle_name = ?', 'last_name = ?'];
    $values = [$first, $middle ?: null, $last];

    if ($gender) { $sets[] = 'gender = ?'; $values[] = $gender; }

    if ($dob) {
        $bd  = new DateTime($dob);
        $age = (int)$bd->diff(new DateTime())->y;
        $sets[] = 'dob = ?'; $values[] = $dob;
        $sets[] = 'age = ?'; $values[] = $age;
    }

    if ($contact !== '') { $sets[] = 'contact = ?'; $values[] = $contact; }
    if ($address !== '') { $sets[] = 'address = ?'; $values[] = $address; }
    if ($occupation !== null) { $sets[] = 'occupation = ?'; $values[] = $occupation; }
    if ($medHx !== null) { $sets[] = 'medical_history = ?'; $values[] = $medHx ?: null; }
    if ($status)           { $sets[] = 'status = ?'; $values[] = $status; }

    $values[] = $id;
    $pdo->prepare('UPDATE patients SET ' . implode(', ', $sets) . ' WHERE id = ?')->execute($values);

    // Sync is_active on users table when status changes
    if ($status && $patient['user_id']) {
        $isActive = ($status === 'active') ? 1 : 0;
        $pdo->prepare(
            'UPDATE users SET is_active = ?' . ($isActive ? ', last_login_at = NOW()' : '') . ' WHERE id = ?'
        )->execute([$isActive, $patient['user_id']]);
    }

    // Email lives on `users`, only updatable if this patient already has a login account
    if ($email && $patient['user_id']) {
        if (!filter_var($email, FILTER_VALIDATE_EMAIL)) {
            jsonResponse(['success' => false, 'message' => 'Please enter a valid email address.']);
        }
        $chk = $pdo->prepare('SELECT id FROM users WHERE email = ? AND id != ? LIMIT 1');
        $chk->execute([$email, $patient['user_id']]);
        if ($chk->fetch()) {
            jsonResponse(['success' => false, 'message' => 'An account with this email already exists.']);
        }
        $pdo->prepare('UPDATE users SET email = ? WHERE id = ?')->execute([$email, $patient['user_id']]);
    }

    jsonResponse(['success' => true]);

} catch (PDOException $e) {
    jsonResponse(['success' => false, 'message' => 'Database error. Please try again.'], 500);
}
