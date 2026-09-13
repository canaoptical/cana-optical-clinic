<?php
// ================================================================
//  CANAOPTICALCLINIC — api/patients/email.php
//  POST { patientId, subject, message } — admin/staff only.
//  Sends a one-off branded email to a patient. Not tied to any existing
//  thread — for replying to a contact-form message, see
//  api/contact/reply.php instead (same visual template, different context).
// ================================================================

require_once '../../config/db.php';
require_once '../../config/smtp.php';
require_once '../helpers.php';

requireMethod('POST');
startSession();

if (!isset($_SESSION['user_id'])) {
    jsonResponse(['success' => false, 'message' => 'Not authenticated.'], 401);
}

$role = $_SESSION['role'] ?? '';
if (!in_array($role, ['admin', 'staff'], true)) {
    jsonResponse(['success' => false, 'message' => 'Unauthorized.'], 403);
}

// Every hit here is a real outbound email — tighter than the DB-write-only
// limits elsewhere. 10 per 5 min per staff account is plenty for genuine
// one-off patient emails, but stops a spam-clicked Send button (or a
// scripted call straight to this endpoint) from blasting a patient's inbox.
rateLimit('patient-email:' . $_SESSION['user_id'], 10, 300);

$b         = getBody();
$patientId = trim($b['patientId'] ?? '');
$subject   = trim($b['subject'] ?? '');
$message   = trim($b['message'] ?? '');

if (!$patientId || !$subject || !$message) {
    jsonResponse(['success' => false, 'message' => 'Subject and message are required.']);
}

try {
    $pdo = getDB();

    $s = $pdo->prepare(
        'SELECT p.first_name, p.middle_name, p.last_name, u.email
         FROM patients p
         LEFT JOIN users u ON u.id = p.user_id
         WHERE p.id = ? LIMIT 1'
    );
    $s->execute([$patientId]);
    $patient = $s->fetch();

    if (!$patient) {
        jsonResponse(['success' => false, 'message' => 'Patient not found.'], 404);
    }
    if (empty($patient['email'])) {
        jsonResponse(['success' => false, 'message' => 'This patient has no email on file.']);
    }

    $patientName = trim($patient['first_name'] . _mi($patient['middle_name']) . ' ' . $patient['last_name']);

    $userId      = (int)$_SESSION['user_id'];
    $profileInfo = loadUserProfile($pdo, $userId, $role);
    $senderName  = 'Cana Optical Clinic';
    if ($profileInfo && !empty($profileInfo['profile'])) {
        $prof = $profileInfo['profile'];
        $name = trim(($prof['first_name'] ?? '') . ' ' . ($prof['last_name'] ?? ''));
        if ($name) $senderName = $name;
    }

} catch (PDOException $e) {
    jsonResponse(['success' => false, 'message' => 'Database error.'], 500);
}

try {
    sendEmail(
        $patient['email'], $patientName,
        $subject,
        patientEmailBody($patientName, $subject, $message, $senderName),
        "Hi {$patientName},\n\n{$message}\n\n— {$senderName}, Cana Optical Clinic"
    );
} catch (\Exception $e) {
    jsonResponse(['success' => false, 'message' => 'Failed to send email. Please try again.'], 500);
}

jsonResponse(['success' => true]);

// Same visual template as api/contact/reply.php's replyEmailBody() — a
// direct, un-threaded message instead of a reply, so it skips the
// "original message" quote block that only makes sense in that context.
function patientEmailBody(string $name, string $subject, string $message, string $senderName): string {
    $safeSubject = htmlspecialchars($subject);
    $safeMessage = nl2br(htmlspecialchars($message));

    return <<<HTML
<!DOCTYPE html>
<html lang="en">
<head>
  <meta charset="utf-8">
  <meta name="viewport" content="width=device-width,initial-scale=1">
  <title>{$safeSubject}</title>
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
            <div style="font-family:'Poppins','Segoe UI',Arial,sans-serif;
                        font-size:22px;font-weight:800;color:#ffffff;
                        letter-spacing:1px;line-height:1;margin-bottom:4px;">
              Cana Optical Clinic
            </div>
            <div style="font-family:'Poppins','Segoe UI',Arial,sans-serif;
                        font-size:11px;font-weight:500;letter-spacing:2.5px;
                        color:rgba(255,255,255,0.7);text-transform:uppercase;">
              Cana Optical Clinic
            </div>
          </td>
        </tr>

        <!-- Greeting -->
        <tr>
          <td style="padding:40px 40px 0;">
            <h1 style="font-family:'Poppins','Segoe UI',Arial,sans-serif;
                       margin:0 0 12px;font-size:20px;font-weight:700;
                       color:#1C1C1C;letter-spacing:-0.3px;">
              {$safeSubject}
            </h1>
            <p style="font-family:'Poppins','Segoe UI',Arial,sans-serif;
                      margin:0 0 6px;font-size:14px;color:#1C1C1C;line-height:1.7;">
              Hi {$name},
            </p>
            <p style="font-family:'Poppins','Segoe UI',Arial,sans-serif;
                      margin:0;font-size:14px;color:#6b7280;line-height:1.7;">
              {$senderName} from Cana Optical Clinic sent you a message:
            </p>
          </td>
        </tr>

        <!-- Message block -->
        <tr>
          <td style="padding:24px 40px 36px;">
            <div style="background:#FFF8F0;border:2px solid #FFD9A8;
                        border-radius:12px;padding:20px 22px;
                        font-family:'Poppins','Segoe UI',Arial,sans-serif;
                        font-size:14px;color:#1C1C1C;line-height:1.7;">
              {$safeMessage}
            </div>
          </td>
        </tr>

        <!-- Divider -->
        <tr>
          <td style="padding:0 40px;">
            <div style="border-top:1px solid #f0f0f4;"></div>
          </td>
        </tr>

        <!-- Footer -->
        <tr>
          <td style="background:#f8f8fb;padding:20px 40px;
                     border-top:1px solid #f0f0f4;text-align:center;">
            <p style="font-family:'Poppins','Segoe UI',Arial,sans-serif;
                      margin:0;font-size:11px;color:#b0b7c3;">
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
