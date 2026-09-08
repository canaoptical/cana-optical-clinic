<?php
// ================================================================
//  CANAOPTICALCLINIC — api/patients/update.php
//
//  POST { action:'profile', firstName, middleName, lastName, phone,
//         address, occupation, medicalHistory, gender?, dob? }
//
//  Only authenticated patients may call this endpoint.
//  (Password changes for patients go through api/users/change_password.php,
//  same as every other role.)
//
//  gender/dob used to be admin-only (see api/patients/admin_update.php) —
//  low enough stakes for a clinic this size (nothing here is verified
//  against ID the way a hospital admission would be) that gating patients
//  from fixing their own typo'd birth year or a wrong gender select wasn't
//  worth the friction. Same validation/age-derivation as the admin path.
//
//  Email is NOT accepted here (even if the client sends it, it's ignored)
//  — changing it requires proving ownership of the new address first, via
//  request-email-change.php + verify-email-change.php's OTP flow. Letting
//  it slip through this endpoint too would make that whole flow pointless.
// ================================================================

require_once '../../config/db.php';
require_once '../helpers.php';

requireMethod('POST');
startSession();

if (!isset($_SESSION['user_id'])) {
    jsonResponse(['success' => false, 'message' => 'Not authenticated.'], 401);
}
if (($_SESSION['role'] ?? '') !== 'patient') {
    jsonResponse(['success' => false, 'message' => 'Unauthorized.'], 403);
}

$userId = (int)$_SESSION['user_id'];
$b      = getBody();
$action = trim($b['action'] ?? '');

try {
    $pdo = getDB();

    // ── Profile update ───────────────────────────────────────────
    if ($action === 'profile') {
        $fn         = trim($b['firstName']  ?? '');
        $mn         = trim($b['middleName'] ?? '');
        $ln         = trim($b['lastName']   ?? '');
        $phone      = trim($b['phone']      ?? '');
        $address    = trim($b['address']    ?? '');
        $occupation = trim($b['occupation'] ?? '');
        $medHx      = trim($b['medicalHistory'] ?? '');
        $gender     = trim($b['gender']     ?? '');
        $dob        = trim($b['dob']        ?? '');

        if (!$fn || !$ln) {
            jsonResponse(['success' => false, 'message' => 'First and last name are required.']);
        }
        if ($gender && !in_array($gender, ['Male', 'Female', 'Other'], true)) {
            jsonResponse(['success' => false, 'message' => 'Invalid gender value.']);
        }
        if ($phone && !isValidContact($phone)) {
            jsonResponse(['success' => false, 'message' => 'Please enter a valid 11-digit contact number.']);
        }
        if ($address && !looksLikeAddress($address)) {
            jsonResponse(['success' => false, 'message' => 'Please enter a complete address.']);
        }

        $sets   = ['first_name = ?', 'middle_name = ?', 'last_name = ?', 'contact = ?', 'address = ?', 'occupation = ?', 'medical_history = ?'];
        $values = [$fn, $mn ?: null, $ln, $phone, $address, $occupation, $medHx ?: null];

        if ($gender) { $sets[] = 'gender = ?'; $values[] = $gender; }
        if ($dob) {
            $bd  = new DateTime($dob);
            $age = (int)$bd->diff(new DateTime())->y;
            $sets[] = 'dob = ?'; $values[] = $dob;
            $sets[] = 'age = ?'; $values[] = $age;
        }

        $values[] = $userId;
        $pdo->prepare('UPDATE patients SET ' . implode(', ', $sets) . ' WHERE user_id = ?')->execute($values);

        jsonResponse(['success' => true, 'message' => 'Profile updated successfully.']);
    }

    jsonResponse(['success' => false, 'message' => 'Unknown action.'], 400);

} catch (PDOException $e) {
    jsonResponse(['success' => false, 'message' => 'Database error. Please try again.'], 500);
}
