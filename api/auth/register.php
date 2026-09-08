<?php
// ================================================================
//  CANAOPTICALCLINIC — api/auth/register.php
//  POST { firstName, lastName, dob, gender, address, contact,
//         email, password }
//  → 200 { success:true, pendingVerification:true, email }
//  → 200 { success:false, message }
//
//  Writes to pending_registrations only — NO users/patients rows
//  are created until verify-email-otp.php confirms the OTP.
// ================================================================

require_once '../../config/db.php';
require_once '../../config/smtp.php';
require_once '../helpers.php';

requireMethod('POST');
rateLimit('register', 10, 3600);

$b = getBody();

$first   = trim($b['firstName']  ?? '');
$middle  = trim($b['middleName'] ?? '');
$last    = trim($b['lastName']   ?? '');
$dob     = trim($b['dob']       ?? '');
$gender  = trim($b['gender']    ?? '');
$address = trim($b['address']   ?? '');
$contact = trim($b['contact']   ?? '');
$email   = trim($b['email']     ?? '');
$pass    = $b['password']       ?? '';

$required = [$first, $last, $dob, $gender, $address, $contact, $email, $pass];
if (in_array('', $required, true)) {
    jsonResponse(['success' => false, 'message' => 'Please complete all required fields.']);
}
if (!isValidContact($contact)) {
    jsonResponse(['success' => false, 'message' => 'Please enter a valid 11-digit contact number.']);
}
if (!looksLikeAddress($address)) {
    jsonResponse(['success' => false, 'message' => 'Please enter your complete address.']);
}
// Self-registration creates a real online account the holder personally
// consents to (Terms, Data Privacy Notice, password-protected access to
// their own health records) — that requires legal capacity the client-
// side check (regNextStep(), auth.js) already promises but, until now,
// never actually enforced server-side, so a direct POST here could
// bypass it entirely.
//
// 13 is the floor — self-registration below that is refused outright.
// A younger patient can still get an account: staff/admin create it
// directly via Add Patient (see maxDobFor18()'s doc comment, main.js —
// that path was never gated by age at all, any age is fine there).
$dobDate = DateTime::createFromFormat('Y-m-d', $dob);
if (!$dobDate || $dobDate->format('Y-m-d') !== $dob) {
    jsonResponse(['success' => false, 'message' => 'Please enter a valid date of birth.']);
}
$now = new DateTime();
$age = (int)$dobDate->diff($now)->y;
if ($age < 13) {
    jsonResponse(['success' => false, 'message' =>
        'You must be at least 13 years old to create an account. Younger patients may be registered by clinic staff instead.']);
}
if ($pwError = validatePasswordPolicy($pass)) {
    jsonResponse(['success' => false, 'message' => $pwError]);
}
if (!filter_var($email, FILTER_VALIDATE_EMAIL)) {
    jsonResponse(['success' => false, 'message' => 'Please enter a valid email address.']);
}

try {
    $pdo = getDB();

    // Block if email already has a confirmed account
    $chk = $pdo->prepare('SELECT id FROM users WHERE email = ? LIMIT 1');
    $chk->execute([$email]);
    if ($chk->fetch()) {
        jsonResponse(['success' => false, 'message' => 'An account with this email already exists.']);
    }

    $hash = password_hash($pass, PASSWORD_DEFAULT);
    $otp  = str_pad((string)random_int(0, 999999), 6, '0', STR_PAD_LEFT);

    // Prune expired pending rows (self-maintaining — no cron needed)
    $pdo->exec('DELETE FROM pending_registrations WHERE expires_at < NOW()');

    // Upsert into pending_registrations — replaces any previous unverified attempt
    // for the same email so the user gets a fresh OTP on retry.
    $pdo->prepare(
        'INSERT INTO pending_registrations
           (email, first_name, middle_name, last_name, dob, gender, address, contact,
            password_hash, otp, expires_at)
         VALUES (?,?,?,?,?,?,?,?,?,?, NOW() + INTERVAL 5 MINUTE)
         ON DUPLICATE KEY UPDATE
           first_name    = VALUES(first_name),
           middle_name   = VALUES(middle_name),
           last_name     = VALUES(last_name),
           dob           = VALUES(dob),
           gender        = VALUES(gender),
           address       = VALUES(address),
           contact       = VALUES(contact),
           password_hash = VALUES(password_hash),
           otp           = VALUES(otp),
           attempts      = 0,
           expires_at    = VALUES(expires_at)'
    )->execute([$email, $first, $middle ?: null, $last, $dob, $gender, $address, $contact, $hash, $otp]);

    try {
        sendVerificationEmail($email, $otp, $first);
    } catch (Exception $e) {
        // Non-fatal — user can resend from the verify screen. Logged so a
        // real delivery failure (bad sender config, Brevo rejection, etc.)
        // is actually visible somewhere instead of silently vanishing.
        error_log('[email] Verification code failed to send to ' . $email . ': ' . $e->getMessage());
    }

    jsonResponse(['success' => true, 'pendingVerification' => true, 'email' => $email]);

} catch (PDOException $e) {
    jsonResponse(['success' => false, 'message' => 'Registration failed. Please try again.'], 500);
}

function sendVerificationEmail(string $to, string $otp, string $firstName = ''): void {
    sendEmail(
        $to, $firstName,
        'Verify Your Cana Optical Clinic Account',
        verificationEmailBody($otp, $firstName),
        "Your Cana Optical Clinic email verification code is: $otp\n\nThis code expires in 5 minutes. Do not share it with anyone."
    );
}

function verificationEmailBody(string $otp, string $firstName = ''): string {
    $greeting = $firstName ? "Hi $firstName," : 'Hello,';
    return <<<HTML
<!DOCTYPE html>
<html lang="en">
<head>
  <meta charset="utf-8">
  <meta name="viewport" content="width=device-width,initial-scale=1">
  <title>Verify Your Email</title>
  <link href="https://fonts.googleapis.com/css2?family=Poppins:wght@400;500;600;700;800&display=swap" rel="stylesheet">
</head>
<body style="margin:0;padding:0;background:#f0f1f5;font-family:'Poppins','Segoe UI',Arial,sans-serif;">

  <table width="100%" cellpadding="0" cellspacing="0" role="presentation" style="background:#f0f1f5;padding:48px 16px;">
    <tr><td align="center">

      <table width="520" cellpadding="0" cellspacing="0" role="presentation"
             style="background:#ffffff;border-radius:16px;overflow:hidden;
                    box-shadow:0 4px 24px rgba(0,0,0,0.09),0 1px 4px rgba(0,0,0,0.05);
                    max-width:520px;width:100%;">

        <!-- Header -->
        <tr>
          <td style="background:#E8760A;
                     padding:32px 40px 28px;text-align:center;">
            <div style="font-size:22px;font-weight:800;color:#ffffff;letter-spacing:1px;line-height:1;margin-bottom:4px;">
              Cana Optical Clinic
            </div>
          </td>
        </tr>

        <!-- Body -->
        <tr>
          <td style="padding:40px 40px 0;text-align:center;">
            <h1 style="margin:0 0 12px;font-size:20px;font-weight:700;color:#1C1C1C;letter-spacing:-0.3px;">
              Verify Your Email Address
            </h1>
            <p style="margin:0 auto;font-size:14px;color:#6b7280;line-height:1.7;max-width:360px;">
              {$greeting} Thank you for registering with Cana Optical Clinic. Use the code below
              to confirm your email and activate your patient account.
              Valid for <strong style="color:#1C1C1C;font-weight:600;">5 minutes</strong>.
            </p>
          </td>
        </tr>

        <!-- OTP -->
        <tr>
          <td style="padding:32px 40px 28px;">
            <p style="margin:0 0 14px;font-size:10px;font-weight:700;letter-spacing:2.5px;
                      text-transform:uppercase;color:#9ca3af;text-align:center;">
              Your Verification Code
            </p>
            <div style="background:#FFF8F0;border:2px solid #FFD9A8;border-radius:12px;padding:24px 32px;text-align:center;">
              <span style="font-size:42px;font-weight:800;letter-spacing:14px;color:#E8760A;line-height:1;display:block;">
                {$otp}
              </span>
            </div>
            <p style="margin:14px 0 0;font-size:12px;color:#9ca3af;text-align:center;">
              This code expires in 5 minutes.
            </p>
          </td>
        </tr>

        <!-- Divider -->
        <tr><td style="padding:0 40px;"><div style="border-top:1px solid #f0f0f4;"></div></td></tr>

        <!-- Security notice -->
        <tr>
          <td style="padding:24px 40px;">
            <table width="100%" cellpadding="0" cellspacing="0" role="presentation">
              <tr>
                <td style="width:32px;vertical-align:top;padding-top:2px;">
                  <svg width="17" height="17" viewBox="0 0 24 24" fill="none" stroke="#E8760A"
                       stroke-width="2" stroke-linecap="round" stroke-linejoin="round">
                    <path d="M12 22s8-4 8-10V5l-8-3-8 3v7c0 6 8 10 8 10z"/>
                  </svg>
                </td>
                <td style="font-size:13px;color:#6b7280;line-height:1.65;">
                  If you did not create a Cana Optical Clinic account, please ignore this email —
                  no account will be created. Never share this code with anyone.
                </td>
              </tr>
            </table>
          </td>
        </tr>

        <!-- Footer -->
        <tr>
          <td style="background:#f8f8fb;padding:20px 40px;border-top:1px solid #f0f0f4;text-align:center;">
            <p style="margin:0;font-size:11px;color:#b0b7c3;">
              &copy; Cana Optical Clinic &nbsp;&bull;&nbsp; Do not reply to this email
            </p>
          </td>
        </tr>

      </table>
    </td></tr>
  </table>

</body>
</html>
HTML;
}
