<?php
// ================================================================
//  CANAOPTICALCLINIC — api/contact/reply.php
//  POST { id, reply } — admin/staff only.
//  Saves the reply and emails the original sender via SMTP (best-effort —
//  the reply is still saved even if the email fails to send). Email is
//  the only delivery channel; there is no in-app patient inbox.
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

// Same reasoning as patients/email.php — each hit sends a real email.
rateLimit('contact-reply:' . $_SESSION['user_id'], 10, 300);

$b     = getBody();
$id    = (int)($b['id'] ?? 0);
$reply = trim($b['reply'] ?? '');

if (!$id || !$reply) {
    jsonResponse(['success' => false, 'message' => 'Reply text is required.']);
}

try {
    $pdo = getDB();

    $s = $pdo->prepare('SELECT * FROM contact_messages WHERE id = ? LIMIT 1');
    $s->execute([$id]);
    $msg = $s->fetch();
    if (!$msg) {
        jsonResponse(['success' => false, 'message' => 'Message not found.'], 404);
    }

    $userId      = (int)$_SESSION['user_id'];
    $profileInfo = loadUserProfile($pdo, $userId, $role);
    $replierName = 'Cana Optical Clinic';
    if ($profileInfo && !empty($profileInfo['profile'])) {
        $p    = $profileInfo['profile'];
        $name = trim(($p['first_name'] ?? '') . ' ' . ($p['last_name'] ?? ''));
        if ($name) $replierName = $name;
    }

    $pdo->prepare('UPDATE contact_messages SET reply = ?, replied_by = ?, replied_at = NOW() WHERE id = ?')
        ->execute([$reply, $replierName, $id]);

    // Email the reply to the original sender (best-effort — don't fail the request if email is down)
    $emailSent = false;
    try {
        sendEmail(
            $msg['email'], $msg['name'],
            'Re: Your message to Cana Optical Clinic',
            replyEmailBody($msg['name'], $msg['message'], $reply, $replierName),
            "Hi {$msg['name']},\n\n{$reply}\n\n— {$replierName}, Cana Optical Clinic"
        );
        $emailSent = true;
    } catch (\Exception $e) {
        // Non-fatal — reply is already saved
    }

    jsonResponse(['success' => true, 'emailSent' => $emailSent]);

} catch (PDOException $e) {
    jsonResponse(['success' => false, 'message' => 'Database error.'], 500);
}

function replyEmailBody(string $name, string $original, string $reply, string $replierName): string {
    $safeOriginal = nl2br(htmlspecialchars($original));
    $safeReply    = nl2br(htmlspecialchars($reply));

    return <<<HTML
<!DOCTYPE html>
<html lang="en">
<head>
  <meta charset="utf-8">
  <meta name="viewport" content="width=device-width,initial-scale=1">
  <title>Reply from Cana Optical Clinic</title>
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
              Message Reply
            </h1>
            <p style="font-family:'Poppins','Segoe UI',Arial,sans-serif;
                      margin:0 0 6px;font-size:14px;color:#1C1C1C;line-height:1.7;">
              Hi {$name},
            </p>
            <p style="font-family:'Poppins','Segoe UI',Arial,sans-serif;
                      margin:0;font-size:14px;color:#6b7280;line-height:1.7;">
              {$replierName} from Cana Optical Clinic replied to your message:
            </p>
          </td>
        </tr>

        <!-- Reply block -->
        <tr>
          <td style="padding:24px 40px 8px;">
            <p style="font-family:'Poppins','Segoe UI',Arial,sans-serif;
                      margin:0 0 10px;font-size:10px;font-weight:700;
                      letter-spacing:2.5px;text-transform:uppercase;color:#9ca3af;">
              Their Reply
            </p>
            <div style="background:#FFF8F0;border:2px solid #FFD9A8;
                        border-radius:12px;padding:20px 22px;
                        font-family:'Poppins','Segoe UI',Arial,sans-serif;
                        font-size:14px;color:#1C1C1C;line-height:1.7;">
              {$safeReply}
            </div>
          </td>
        </tr>

        <!-- Original message block -->
        <tr>
          <td style="padding:20px 40px 36px;">
            <p style="font-family:'Poppins','Segoe UI',Arial,sans-serif;
                      margin:0 0 10px;font-size:10px;font-weight:700;
                      letter-spacing:2.5px;text-transform:uppercase;color:#9ca3af;">
              Your Message
            </p>
            <div style="border-left:3px solid #FFD9A8;padding:4px 0 4px 16px;
                        font-family:'Poppins','Segoe UI',Arial,sans-serif;
                        font-size:13px;color:#6b7280;line-height:1.65;">
              {$safeOriginal}
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
