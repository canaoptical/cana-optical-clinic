<?php
// ================================================================
//  CANAOPTICALCLINIC — api/auth/forgot-password.php
//  POST { email }
//  Generates a 6-digit OTP, stores it, and emails it via SMTP.
//  Returns success:false if the email isn't registered (intentionally
//  not anti-enumeration-safe — this app prioritizes a clear error over
//  hiding which emails exist).
// ================================================================

require_once '../../config/db.php';
require_once '../../config/smtp.php';
require_once '../helpers.php';

requireMethod('POST');

$b     = getBody();
$email = strtolower(trim($b['email'] ?? ''));

if (!filter_var($email, FILTER_VALIDATE_EMAIL)) {
    jsonResponse(['success' => false, 'message' => 'Please enter a valid email address.']);
}

// Per-email limit — keeps one account's testing/retries from starving another
// account's budget on the same IP (previously this was IP-only and shared).
rateLimit('forgot-password:' . substr(md5($email), 0, 12), 5, 900); // 5 per IP+email per 15 min

// Broader per-IP safety net — still guards against one IP spamming many
// different emails (each hit sends a real email via SMTP).
rateLimit('forgot-password-ip', 30, 900); // 30 per IP per 15 min, across all emails

// 60s resend cooldown — used further down, and reused for the success
// response too so the client always follows the server's value.
$resendCooldownSeconds = 60;

try {
    $pdo = getDB();

    // Probabilistic GC — same pattern as rate_limits: deletes rows that are
    // long past being useful, 1-in-10 requests. Only removes rows whose
    // 5-min OTP window expired AND (if it was ever blocking) that block has
    // also already lapsed, so we never delete a row that's actively
    // enforcing something — just old, no-longer-relevant history.
    if (mt_rand(1, 10) === 1) {
        $pdo->prepare(
            'DELETE FROM password_resets
              WHERE expires_at < NOW() - INTERVAL 1 DAY
                AND (blocked_until IS NULL OR blocked_until < NOW())'
        )->execute();
    }

    // Check if the email belongs to a registered user
    $s = $pdo->prepare('SELECT id, is_active FROM users WHERE LOWER(email) = ? LIMIT 1');
    $s->execute([$email]);
    $user = $s->fetch();

    if (!$user) {
        jsonResponse(['success' => false, 'message' => 'This account or email doesn\'t exist. Please enter a valid email.']);
    }
    // An archived account (is_active = 0) keeps its email row — archiving
    // is meant to be reversible via Restore, so the email can't just be
    // freed the way a permanent delete does — but that also means the
    // email still matches here. Without this check, an inactive account
    // could still request a reset code and successfully change its own
    // password, even though login.php would reject it right after anyway;
    // same wording as that final gate, so the two are consistent.
    if (!$user['is_active']) {
        jsonResponse(['success' => false, 'message' => 'Your account is inactive. Please contact the clinic to have it reactivated.']);
    }

    // Block check — 1-hour ban after 10 total wrong OTP guesses
    $blk = $pdo->prepare('SELECT blocked_until FROM password_resets WHERE email = ? AND blocked_until IS NOT NULL AND blocked_until > NOW() ORDER BY id DESC LIMIT 1');
    $blk->execute([$email]);
    if ($blk->fetch()) {
        jsonResponse(['success' => false, 'banned' => true,
            'message' => 'Too many failed attempts. Please try again in 1 hour.']);
    }

    // Carry total_attempts forward so the counter survives across resends,
    // and read created_at to enforce the 60s resend cooldown below. This
    // reads straight from the same DB row the OTP itself lives in — the
    // cooldown's "real storage" is this table, not anything client-side.
    $prev = $pdo->prepare('SELECT total_attempts, created_at FROM password_resets WHERE email = ? ORDER BY id DESC LIMIT 1');
    $prev->execute([$email]);
    $prevRow      = $prev->fetch();
    $carriedTotal = $prevRow ? (int)$prevRow['total_attempts'] : 0;

    // 60s resend cooldown, enforced server-side against the DB row's
    // timestamp — not something the client can bypass by clearing
    // localStorage, refreshing, or switching browsers/devices. Scoped to
    // this email only, so a cooldown on one account never touches another.
    if ($prevRow) {
        $elapsed = time() - strtotime($prevRow['created_at']);
        if ($elapsed < $resendCooldownSeconds) {
            $retryAfter = $resendCooldownSeconds - $elapsed;
            header('Retry-After: ' . $retryAfter);
            jsonResponse([
                'success'    => false,
                'cooldown'   => true,
                'retryAfter' => $retryAfter,
                'message'    => "Please wait before requesting another code.",
            ]);
        }
    }

    // Invalidate any previous unused OTPs for this email
    $pdo->prepare('UPDATE password_resets SET used = 1 WHERE email = ? AND used = 0')
        ->execute([$email]);

    // Generate a cryptographically secure 6-digit OTP
    $otp = str_pad((string)random_int(0, 999999), 6, '0', STR_PAD_LEFT);

    $pdo->prepare('INSERT INTO password_resets (email, otp, total_attempts, expires_at) VALUES (?, ?, ?, NOW() + INTERVAL 5 MINUTE)')
        ->execute([$email, $otp, $carriedTotal]);

    sendEmail(
        $email, '',
        'Your Cana Optical Clinic Password Reset Code',
        emailBody($otp),
        "Your Cana Optical Clinic password reset code is: $otp\n\nThis code expires in 5 minutes. Do not share it with anyone."
    );

    jsonResponse(['success' => true, 'cooldownSeconds' => $resendCooldownSeconds]);

} catch (\Exception $e) {
    jsonResponse(['success' => false, 'message' => 'Failed to send email. Please try again later.', '_debug' => $e->getMessage()]);
} catch (PDOException $e) {
    jsonResponse(['success' => false, 'message' => 'Server error. Please try again.'], 500);
}

function emailBody(string $otp): string {

    return <<<HTML
<!DOCTYPE html>
<html lang="en">
<head>
  <meta charset="utf-8">
  <meta name="viewport" content="width=device-width,initial-scale=1">
  <title>Reset Your Password</title>
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
          </td>
        </tr>

        <!-- Body -->
        <tr>
          <td style="padding:40px 40px 0;text-align:center;">

            <h1 style="font-family:'Poppins','Segoe UI',Arial,sans-serif;
                       margin:0 0 12px;font-size:20px;font-weight:700;
                       color:#1C1C1C;letter-spacing:-0.3px;">
              Password Reset Request
            </h1>
            <p style="font-family:'Poppins','Segoe UI',Arial,sans-serif;
                      margin:0 auto;font-size:14px;color:#6b7280;
                      line-height:1.7;max-width:360px;">
              We received a request to reset your Cana Optical Clinic account password.
              Use the verification code below to continue. It is valid for
              <strong style="color:#1C1C1C;font-weight:600;">5 minutes</strong> only.
            </p>
          </td>
        </tr>

        <!-- OTP block -->
        <tr>
          <td style="padding:32px 40px 28px;">
            <p style="font-family:'Poppins','Segoe UI',Arial,sans-serif;
                      margin:0 0 14px;font-size:10px;font-weight:700;
                      letter-spacing:2.5px;text-transform:uppercase;
                      color:#9ca3af;text-align:center;">
              Your Verification Code
            </p>

            <div style="background:#FFF8F0;border:2px solid #FFD9A8;
                        border-radius:12px;padding:24px 32px;text-align:center;">
              <span style="font-family:'Poppins','Segoe UI',Arial,sans-serif;
                           font-size:42px;font-weight:800;letter-spacing:14px;
                           color:#E8760A;line-height:1;display:block;">
                {$otp}
              </span>
            </div>

            <p style="font-family:'Poppins','Segoe UI',Arial,sans-serif;
                      margin:14px 0 0;font-size:12px;color:#9ca3af;text-align:center;">
              This code expires in 5 minutes.
            </p>
          </td>
        </tr>

        <!-- Divider -->
        <tr>
          <td style="padding:0 40px;">
            <div style="border-top:1px solid #f0f0f4;"></div>
          </td>
        </tr>

        <!-- Security notice -->
        <tr>
          <td style="padding:24px 40px;">
            <table width="100%" cellpadding="0" cellspacing="0" role="presentation">
              <tr>
                <td style="width:32px;vertical-align:top;padding-top:2px;">
                  <svg width="17" height="17" viewBox="0 0 24 24" fill="none"
                       stroke="#E8760A" stroke-width="2" stroke-linecap="round" stroke-linejoin="round"
                       xmlns="http://www.w3.org/2000/svg">
                    <path d="M12 22s8-4 8-10V5l-8-3-8 3v7c0 6 8 10 8 10z"/>
                  </svg>
                </td>
                <td style="font-family:'Poppins','Segoe UI',Arial,sans-serif;
                           font-size:13px;color:#6b7280;line-height:1.65;">
                  If you did not request a password reset, please ignore this email.
                  Your password will remain unchanged and no action is needed.
                  Never share this code with anyone.
                </td>
              </tr>
            </table>
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
