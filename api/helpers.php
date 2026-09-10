<?php
// ================================================================
//  CANAOPTICALCLINIC — api/helpers.php
//  Shared utilities for all API endpoints.
// ================================================================

// __DIR__-relative (not a plain relative path) so this resolves correctly
// no matter which script required helpers.php in the first place — needed
// by _emailPatientNotice() below (sendEmail()/systemEmailBody()).
require_once __DIR__ . '/../config/smtp.php';

// The clinic operates in the Philippines — without this, PHP falls back to
// UTC (the default on Railway's containers), so timestamps shown in the app
// end up 8 hours behind the actual local time.
date_default_timezone_set('Asia/Manila');

// ── Default registration Terms & Conditions ────────────────────────
// Served whenever clinic_settings.terms_content is NULL (fresh install,
// not yet migrated, or admin hasn't customized it) so the registration
// page never shows blank legal text. Convention parsed by the shared
// renderTermsMarkdown() (db.js): "## " = heading, blank line = new
// paragraph, "- " = bullet list item. Keep this in sync with the
// content an admin would see pre-filled in Settings > Terms & Conditions.
const DEFAULT_TERMS_MD = <<<'TERMS'
## 1. Acceptance of Terms
By creating a patient account with Cana Optical Clinic ("the Clinic"), you agree to be bound by these Terms & Conditions. If you do not agree, please do not proceed with registration.

## 2. Account Registration
You must provide accurate, current, and complete information during registration. You are responsible for keeping your password confidential and for all activity under your account. Notify the Clinic immediately if you suspect unauthorized use.

## 3. Your Patient QR Code
Upon registration, a unique QR code is generated and linked to your patient record. Present this QR code at the clinic for fast, accurate check-in. Do not share it with anyone else — it provides access to your health information.

## 4. Appointments
Appointment requests submitted through this system are subject to confirmation by clinic staff based on doctor availability. The Clinic reserves the right to reschedule or decline requests when necessary.

## 5. Use of the Platform
You agree to use this system only for legitimate healthcare purposes related to your own care. Misuse — including attempting to access another patient's records or interfering with the system's normal operation — may result in account suspension.

## 6. Changes to these Terms
The Clinic may update these Terms & Conditions from time to time. Continued use of your account after changes are posted constitutes acceptance of the revised terms.
TERMS;

// ── Default registration Data Privacy Act Notice ───────────────────
// Served whenever clinic_settings.privacy_content is NULL. Split out of
// DEFAULT_TERMS_MD into its own document/checkbox — a Data Privacy Act
// consent bundled inside a generic "I agree to the Terms" checkbox didn't
// read as the patient having actually consented to it specifically, which
// is the whole point of calling it out under RA 10173. Keep in sync with
// auth.js's DEFAULT_PRIVACY_MD.
const DEFAULT_PRIVACY_MD = <<<'PRIVACY'
## 1. Overview
This Data Privacy Act Notice explains how Cana Optical Clinic ("the Clinic") collects, uses, stores, and protects your personal and sensitive personal information, in compliance with the Data Privacy Act of 2012 (Republic Act No. 10173) and its Implementing Rules and Regulations.

## 2. Information We Collect and Why
The Clinic collects the personal and sensitive personal information you provide during registration (e.g. name, date of birth, address, contact details) and through your subsequent care (e.g. examination results, diagnoses, prescriptions). This information is collected and processed solely for:
- Creating and maintaining your patient record
- Scheduling and managing appointments
- Providing optical examination, diagnosis, and treatment
- Generating your patient identification QR code
- Communicating with you regarding your account, appointments, or care
- Complying with legal and regulatory requirements

## 3. Storage and Security
Your data is stored on secured servers with access restricted to authorized clinic personnel (admin, staff, and your attending doctor) who need it to perform their duties. We apply reasonable organizational, physical, and technical safeguards to protect your information against unauthorized access, alteration, disclosure, or destruction.

## 4. Data Sharing
The Clinic does not sell or rent your personal information. Your data may only be shared with third parties when required by law, when necessary to provide your care (e.g. referrals), or with your explicit consent.

## 5. Data Retention
Your personal and health records are retained for as long as your account is active, and for the period required by applicable healthcare record-keeping regulations afterward, after which they are securely disposed of.

## 6. Your Rights as a Data Subject
Under the Data Privacy Act, you have the right to:
- Be informed of how your data is collected and processed
- Access the personal data the Clinic holds about you
- Request correction of inaccurate or outdated data
- Object to or withdraw consent for processing, subject to legal or contractual restrictions
- Request deletion of your data, where applicable
- File a complaint with the National Privacy Commission (NPC)

To exercise any of these rights, please contact the clinic directly using the contact details on our website.

## 7. Consent and Changes to this Notice
By checking "I agree" and completing registration, you acknowledge that you have read and understood this notice, and you consent to the collection, use, storage, and processing of your personal and sensitive personal information as described above, for the purpose of receiving care from Cana Optical Clinic — and you are entrusting your credentials and personal information to the Clinic on that basis. The Clinic may update this notice from time to time; continued use of your account after changes are posted constitutes acceptance of the revised notice.
PRIVACY;

// ── Default booking-wizard Appointment Policy ──────────────────────
// Served whenever clinic_settings.appointment_policy_content is NULL.
// Same renderTermsMarkdown() convention as DEFAULT_TERMS_MD above. Section 4
// uses "> " so it keeps rendering as the original amber callout box instead
// of a plain paragraph.
// A function rather than a const so section 4 always states the *actual*
// configured reminder/confirm-deadline times (Clinic Settings → Scheduling
// Rules) instead of a hardcoded "noon"/"9:00 PM" that could silently drift
// out of sync with what the cron is really doing.
function defaultApptPolicyMd(string $reminderTime, string $confirmDeadlineTime): string {
    return <<<POLICY
## 1. Appointment Requests
Appointment requests submitted through this system are subject to confirmation by clinic staff based on doctor availability. The clinic reserves the right to reschedule or decline requests when necessary.

## 2. Cancellations
If you can no longer make it to your appointment, please cancel as early as possible. This keeps the slot open for someone else who may need it.

## 3. Repeated No-Shows
If you miss multiple approved appointments without cancelling, online booking may be temporarily restricted for your account. In that case, please contact the clinic directly by phone or in person to schedule your next visit.

## 4. Appointment Reminders and Confirmation
> For approved appointments, we send a reminder at {$reminderTime} the day before your visit. Please confirm you'll be attending by {$confirmDeadlineTime} that same day. If we don't hear from you by then, the appointment is automatically cancelled so the slot can be offered to another patient.

## 5. Waitlist
If your preferred slot is fully booked, you can join the waitlist for it. If that slot opens up, you'll be notified with a limited time to claim it. If you don't respond in time, or choose to decline, the slot is offered to the next patient in line. You can only be on one waitlist at a time.
POLICY;
}

// Middle initial as displayed on formal names/documents ("Juan D. Dela Cruz") —
// the standard PH convention — leading space included so callers can just
// concatenate it between first and last name.
function _mi(?string $middleName): string {
    $middleName = trim((string)$middleName);
    return $middleName !== '' ? ' ' . mb_strtoupper(mb_substr($middleName, 0, 1)) . '.' : '';
}

// ── Password strength policy ───────────────────────────────────────
// Mirrors the client-side checklist (auth.js's PW_POLICY_RULES) so a direct
// API call can't bypass what the UI already promises. Returns an error
// message string when the password fails, or null when it passes.
function validatePasswordPolicy(string $password): ?string {
    if (strlen($password) < 8)        return 'Password must be at least 8 characters.';
    if (!preg_match('/[a-z]/', $password)) return 'Password must include at least one lowercase letter.';
    if (!preg_match('/[A-Z]/', $password)) return 'Password must include at least one uppercase letter.';
    if (!preg_match('/[0-9]/', $password)) return 'Password must include at least one number.';
    if (!preg_match('/[^A-Za-z0-9]/', $password)) return 'Password must include at least one special character.';
    return null;
}

// ── Contact number / address validity ──────────────────────────────
// Mirrors isValidContact()/looksLikeAddress() in auth.js so a direct API
// call can't bypass what the UI already enforces. Callers only invoke
// these when a value was actually submitted — contact/address stay
// optional wherever they already were; this only rejects a BAD value,
// never a missing one.
function isValidContact(string $contact): bool {
    // Hyphens stripped first — the Edit User field (User Management)
    // allows them (e.g. "0921-245-2834"), and some existing stored numbers
    // predate that field's own digit-only stripping. Either format
    // validates the same way once hyphens are out of the count.
    return (bool)preg_match('/^\d{11}$/', str_replace('-', '', trim($contact)));
}

// No geocoding involved (that's the only way to truly verify an address
// exists, e.g. Google's Address Validation API — not something this app
// has a key for) — just the same lightweight fallback most address-
// validation guides recommend absent that: an allowed-character set plus
// a minimum length, tuned loose enough that a genuinely short-but-real
// address (e.g. "Purok 3, Sto. Tomas") never gets rejected.
function looksLikeAddress(string $addr): bool {
    $a = trim($addr);
    if (mb_strlen($a) < 8) return false;
    if (!preg_match('/[a-zA-Z]/', $a)) return false;
    if (preg_match('/^(.)\1+$/', preg_replace('/\s+/', '', $a))) return false;
    // Letters (incl. accented, e.g. "Biñan"), digits, and the punctuation
    // that actually shows up in a real PH address (. , ' # - / &) — reject
    // anything built from characters an address would never contain.
    if (!preg_match('/^[\p{L}\p{N}\s.,#\'\-\/&]+$/u', $a)) return false;
    return true;
}

// ── Password reuse prevention ──────────────────────────────────────
// Standard practice (a new password must differ from recent past ones,
// not just the current one) backed by the `password_history` table.
const PASSWORD_HISTORY_LIMIT = 5;

// True if $newPassword matches the user's current password or any of
// their last PASSWORD_HISTORY_LIMIT passwords.
function passwordWasUsedBefore(PDO $pdo, int $userId, string $newPassword): bool {
    $stmt = $pdo->prepare('SELECT password_hash FROM users WHERE id = ? LIMIT 1');
    $stmt->execute([$userId]);
    $current = $stmt->fetchColumn();
    if ($current && password_verify($newPassword, $current)) return true;

    try {
        $stmt = $pdo->prepare(
            'SELECT password_hash FROM password_history
              WHERE users_id = ? ORDER BY created_at DESC LIMIT ' . PASSWORD_HISTORY_LIMIT
        );
        $stmt->execute([$userId]);
        foreach ($stmt->fetchAll(PDO::FETCH_COLUMN) as $oldHash) {
            if (password_verify($newPassword, $oldHash)) return true;
        }
    } catch (PDOException $e) { /* table not yet migrated — skip history check */ }

    return false;
}

// Archives the password hash being replaced, then prunes anything past
// PASSWORD_HISTORY_LIMIT so the table doesn't grow unbounded per user.
function recordPasswordHistory(PDO $pdo, int $userId, string $oldHash): void {
    try {
        $pdo->prepare('INSERT INTO password_history (users_id, password_hash) VALUES (?, ?)')
            ->execute([$userId, $oldHash]);
        $pdo->prepare(
            'DELETE FROM password_history WHERE users_id = ? AND id NOT IN (
                SELECT id FROM (
                    SELECT id FROM password_history WHERE users_id = ?
                    ORDER BY created_at DESC LIMIT ' . PASSWORD_HISTORY_LIMIT . '
                ) keep
            )'
        )->execute([$userId, $userId]);
    } catch (PDOException $e) { /* table not yet migrated — non-critical */ }
}

// ── IP-based rate limiting ────────────────────────────────────────
// Reads hits from the `rate_limits` table keyed by IP + endpoint.
// Fails open if the table doesn't exist yet so no legitimate request
// is ever blocked by a missing migration.
function clientIp(): string {
    $fwd = $_SERVER['HTTP_X_FORWARDED_FOR'] ?? '';
    if ($fwd) {
        $ip = trim(explode(',', $fwd)[0]);
        if (filter_var($ip, FILTER_VALIDATE_IP)) return $ip;
    }
    return $_SERVER['REMOTE_ADDR'] ?? '0.0.0.0';
}

function rateLimit(string $endpoint, int $maxHits, int $windowSeconds): void {
    try {
        $pdo         = getDB();
        $ip          = clientIp();
        $now         = time();
        $windowStart = $now - $windowSeconds;

        // Probabilistic GC — cleans rows older than 24 h, 1-in-10 requests
        if (mt_rand(1, 10) === 1) {
            $pdo->prepare('DELETE FROM rate_limits WHERE created_at < ?')
                ->execute([$now - 86400]);
        }

        $stmt = $pdo->prepare(
            'SELECT COUNT(*) FROM rate_limits WHERE ip = ? AND endpoint = ? AND created_at >= ?'
        );
        $stmt->execute([$ip, $endpoint, $windowStart]);

        if ((int)$stmt->fetchColumn() >= $maxHits) {
            header('Retry-After: ' . $windowSeconds);
            jsonResponse([
                'success' => false,
                'message' => 'Too many requests. Please wait a moment and try again.',
            ], 429);
        }

        $pdo->prepare('INSERT INTO rate_limits (ip, endpoint, created_at) VALUES (?, ?, ?)')
            ->execute([$ip, $endpoint, $now]);

    } catch (PDOException) {
        // Fail open — never block users due to a missing table or DB hiccup
    }
}

function jsonResponse(array $data, int $status = 200): void {
    http_response_code($status);
    header('Content-Type: application/json; charset=utf-8');
    echo json_encode($data, JSON_UNESCAPED_UNICODE);
    exit;
}

function requireMethod(string $method): void {
    if ($_SERVER['REQUEST_METHOD'] !== strtoupper($method)) {
        jsonResponse(['success' => false, 'message' => 'Method not allowed.'], 405);
    }
}

function getBody(): array {
    $raw  = file_get_contents('php://input');
    $data = json_decode($raw, true);
    return is_array($data) ? $data : [];
}

// ── DB-backed session storage ──────────────────────────────────────
// Railway's container filesystem isn't a reliable place for PHP's
// default file-based sessions (ephemeral/non-shared across restarts
// or replicas), which is why logins "succeed" but later requests
// can't see the session. Storing sessions in MySQL makes them as
// durable as everything else in the app.
class DbSessionHandler implements SessionHandlerInterface {
    public function __construct(private PDO $pdo) {}

    public function open(string $path, string $name): bool { return true; }
    public function close(): bool { return true; }

    public function read(string $id): string {
        $stmt = $this->pdo->prepare('SELECT data FROM sessions WHERE id = ? LIMIT 1');
        $stmt->execute([$id]);
        $row = $stmt->fetch();
        return $row ? $row['data'] : '';
    }

    public function write(string $id, string $data): bool {
        $stmt = $this->pdo->prepare(
            'INSERT INTO sessions (id, data, last_access) VALUES (?, ?, ?)
             ON DUPLICATE KEY UPDATE data = VALUES(data), last_access = VALUES(last_access)'
        );
        return $stmt->execute([$id, $data, time()]);
    }

    public function destroy(string $id): bool {
        $stmt = $this->pdo->prepare('DELETE FROM sessions WHERE id = ?');
        return $stmt->execute([$id]);
    }

    public function gc(int $max_lifetime): int|false {
        // "Remember me" logins use a longer cookie lifetime than the default
        // session, but PHP's gc_maxlifetime is a single global ini value —
        // whichever request happens to trigger garbage collection sets it.
        // Floor it at 30 days so a short-lived (non "remember me") session's
        // cleanup pass never prunes another user's still-valid remembered one.
        $threshold = max($max_lifetime, 30 * 86400);
        $stmt = $this->pdo->prepare('DELETE FROM sessions WHERE last_access < ?');
        $stmt->execute([time() - $threshold]);
        return $stmt->rowCount();
    }
}

// $days controls both the session cookie lifetime and how long the DB-backed
// session row survives — pass a larger value for "remember me" logins.
function startSession(int $days = 1): void {
    if (session_status() === PHP_SESSION_NONE) {
        $lifetimeSeconds = $days * 86400;
        ini_set('session.gc_maxlifetime', (string)$lifetimeSeconds);

        // Railway terminates TLS at its edge proxy and forwards plain HTTP,
        // so $_SERVER['HTTPS'] is never set — check the forwarded proto too,
        // otherwise the session cookie never gets marked Secure in production.
        $isHttps = (!empty($_SERVER['HTTPS']) && $_SERVER['HTTPS'] !== 'off')
            || (($_SERVER['HTTP_X_FORWARDED_PROTO'] ?? '') === 'https');

        session_set_cookie_params([
            'lifetime' => $lifetimeSeconds,
            'path'     => '/',
            'httponly' => true,
            'samesite' => 'Lax',
            'secure'   => $isHttps,
        ]);

        try {
            session_set_save_handler(new DbSessionHandler(getDB()), true);
        } catch (Throwable $e) {
            // DB unreachable — fall back to PHP's default file handler
            // rather than fatal-erroring the whole request. Railway's own
            // container filesystem doesn't survive a restart and isn't
            // shared across replicas, so a session that falls back here
            // even once can look randomly signed-out later with nothing
            // in the sessions table to explain why. Logged specifically
            // because that failure mode was previously invisible — this
            // is the one place to confirm from Railway's log viewer
            // whether it's actually happening, and how often.
            error_log('[startSession] DB save handler unavailable, falling back to file sessions: ' . $e->getMessage());
        }

        // Grab this BEFORE session_start() runs — session_start() consumes/
        // rewrites $_COOKIE's session entry as part of resuming, so it has
        // to be captured here to still mean "did the browser send one" below.
        $hadCookie = !empty($_COOKIE[session_name()]);

        session_start();

        // The one signal none of the logging so far could actually catch:
        // the browser sent a session cookie (it believes it's still logged
        // in) but PHP came back with nothing for it — meaning the server
        // lost track of a session the client never gave up on itself. A
        // request with NO cookie at all is completely normal (a public
        // page, a fresh visitor, someone who already properly logged out)
        // and logged nowhere near this often — only the "should be valid
        // but isn't" case is worth a line, right at the moment it happens
        // rather than reconstructed after the fact from a stale row.
        if ($hadCookie && empty($_SESSION)) {
            $uri = $_SERVER['REQUEST_URI'] ?? '(unknown)';
            error_log("[startSession] browser sent a session cookie but PHP found no session data for it — request: {$uri}");
        }
    }
}

// ── Active Sessions (multi-device sign-in, not one-device-at-a-time) ──
// Every login is tracked, not restricted — the same account can stay
// signed in on several devices/browsers at once, same as Facebook/Google.
// What's new is visibility and control: a user can see every device
// currently signed in to their account (Settings > Active Sessions) and
// revoke any one of them individually; a password change auto-revokes
// every OTHER session on the account as a security measure.

// A rough, human-readable device description parsed from the browser's
// User-Agent string — not meant to be precise, just enough for someone to
// recognize "that's my phone" vs "that's not me" at a glance. Split into
// os/browser/type (not just the combined label) so listSessions() can
// group sessions by device the way Google's "Your devices" page does ("2
// sessions on Windows computer(s)"), not just list them flat.
function parseDeviceParts(string $ua): array {
    $ua = trim($ua);
    if ($ua === '') return ['os' => 'Unknown device', 'browser' => '', 'type' => 'desktop', 'label' => 'Unknown device'];

    $os   = 'Unknown OS';
    $type = 'desktop';
    if (stripos($ua, 'Windows') !== false) {
        $os = 'Windows';
    } elseif (preg_match('/iPad/i', $ua)) {
        // iPad — checked before the generic iPhone/iPod branch so it isn't
        // swallowed by that pattern and mislabeled as a phone.
        $os = 'iOS'; $type = 'tablet';
    } elseif (preg_match('/iPhone|iPod/i', $ua)) {
        $os = 'iOS'; $type = 'phone';
    } elseif (stripos($ua, 'Android') !== false) {
        $os = 'Android';
        // Google's own UA convention: an Android phone's UA includes the
        // "Mobile" token, a tablet's doesn't — there's no separate
        // "Tablet" marker to check for instead.
        $type = (stripos($ua, 'Mobile') !== false) ? 'phone' : 'tablet';
    } elseif (stripos($ua, 'Mac OS X') !== false) {
        $os = 'macOS';
    } elseif (stripos($ua, 'Linux') !== false) {
        $os = 'Linux';
    }

    $browser = 'Unknown Browser';
    // Order matters — Edge/Opera/Chrome all include "Chrome" in their own
    // UA string (chained-engine spoofing for site compatibility), and
    // Chrome itself includes "Safari"; check the more specific tokens first.
    if (stripos($ua, 'Edg/') !== false || stripos($ua, 'EdgA/') !== false || stripos($ua, 'EdgiOS/') !== false) $browser = 'Edge';
    elseif (stripos($ua, 'OPR/') !== false || stripos($ua, 'Opera') !== false)  $browser = 'Opera';
    elseif (stripos($ua, 'Firefox') !== false || stripos($ua, 'FxiOS') !== false) $browser = 'Firefox';
    elseif (stripos($ua, 'CriOS') !== false || stripos($ua, 'Chrome') !== false)  $browser = 'Chrome';
    elseif (stripos($ua, 'Safari') !== false)                       $browser = 'Safari';

    return ['os' => $os, 'browser' => $browser, 'type' => $type, 'label' => "{$browser} on {$os}"];
}

// Thin wrapper kept for any caller that just wants the combined label.
function parseDeviceLabel(string $ua): string {
    return parseDeviceParts($ua)['label'];
}

// Called right after a successful login (password or the auto-login
// right after verifying a registration OTP) — tags the *current* PHP
// session's row with who it belongs to, plus a device description/IP for
// display. INSERT ... ON DUPLICATE KEY UPDATE rather than a plain UPDATE:
// DbSessionHandler::write() only actually persists the session row at
// request shutdown, so at this point in the request the row may not exist
// in the DB yet — this creates it if needed (an empty `data` placeholder,
// immediately overwritten by the real write() at request end) or just
// updates the ownership columns if it's already there.
function tagSessionOwner(PDO $pdo, int $userId): void {
    $sid = session_id();
    if (!$sid) return;
    $ua = substr($_SERVER['HTTP_USER_AGENT'] ?? '', 0, 255);
    $ip = clientIp();

    // "Known device" check — before writing this session's own row (which
    // would otherwise always match itself), look at every OTHER still-live
    // session on this account. Two separate reasons this login might not
    // be worth a notification:
    //   1. Same User-Agent already among them — this is the same browser/
    //      device signing in again (a fresh login after the old session
    //      expired or was signed out, "remember me" renewing, etc.), not a
    //      new device.
    //   2. No OTHER session exists at all — this is the account's very
    //      first-ever sign-in. There's nothing yet for it to be "new"
    //      relative to, and nothing for the owner to have missed or need
    //      to review — Google/Facebook don't alert on an account's first
    //      login either, only on an additional device joining one that's
    //      already established.
    // Deliberately NOT auto-revoked for case 1: a User-Agent match can't
    // tell "the same browser logging in again" apart from "a second tab of
    // the same still-open session," and auto-revoking the latter silently
    // signs a legitimate, currently-in-use tab out with no warning —
    // Google's own Your Devices page doesn't do this either; it just lists
    // every session and lets the account owner sign each one out manually.
    // Not a perfect device fingerprint (a cleared/GC'd session for that
    // same device would read as "new" again), but a reasonable one
    // without adding a separate persistent devices table.
    $knownDevice        = false;
    $isFirstEverSession = false;
    try {
        $chk = $pdo->prepare('SELECT user_agent FROM sessions WHERE user_id = ? AND id != ?');
        $chk->execute([$userId, $sid]);
        $otherAgents        = $chk->fetchAll(PDO::FETCH_COLUMN);
        $knownDevice        = $ua !== '' && in_array($ua, $otherAgents, true);
        $isFirstEverSession = count($otherAgents) === 0;
    } catch (PDOException) {
        // Fail open — worst case this login gets notified as "new" when it
        // wasn't, not the other way around.
    }

    $stmt = $pdo->prepare(
        'INSERT INTO sessions (id, data, last_access, user_id, user_agent, ip_address, created_at)
         VALUES (?, \'\', ?, ?, ?, ?, NOW())
         ON DUPLICATE KEY UPDATE user_id = VALUES(user_id), user_agent = VALUES(user_agent),
                                  ip_address = VALUES(ip_address), created_at = VALUES(created_at)'
    );
    $stmt->execute([$sid, time(), $userId, $ua, $ip]);

    if ($knownDevice || $isFirstEverSession) return;

    // A genuinely new device/browser signing in — surface it as a
    // notification so the account owner notices a sign-in they didn't
    // make and can review/revoke it from Active Sessions, same spirit as
    // Google/Facebook's own "new sign-in" alerts. No relatedId: there's no
    // specific record to jump to, just the Active Sessions page itself
    // (see the 'new_login' branch in _notifNavTarget(), router.js).
    $deviceLabel = parseDeviceLabel($ua);
    createNotification($pdo, $userId, 'new_login', 'New Sign-in Detected',
        "A new sign-in to your account was detected on {$deviceLabel} (IP: {$ip}). If this wasn't you, review your sessions in Security &amp; Sign-in and change your password."
    );
}

// A short, opaque, non-sensitive handle for a session row — returned to
// the client instead of the real PHP session id. The session id itself is
// a live bearer credential (whoever holds it IS that session, cookie or
// not); listSessions()'s JSON response is exactly the kind of place a
// leak (XSS, a logged response, etc.) would be most damaging, so the raw
// id never leaves the server. revokeSessionByShortId() below re-derives
// this same hash per-row rather than reversing it, which is why lookup is
// a short scan over one user's own (always small) session list, not a
// hash-to-id table.
function _sessionShortId(string $sid): string {
    return substr(hash('sha256', $sid), 0, 16);
}

// Every active session for one account, newest first — the current
// request's own session marked isCurrent so the UI can label it
// "This device" and skip offering it a Log Out button.
function listSessions(PDO $pdo, int $userId): array {
    $stmt = $pdo->prepare(
        'SELECT id, user_agent, ip_address, created_at, last_access FROM sessions
         WHERE user_id = ? ORDER BY last_access DESC'
    );
    $stmt->execute([$userId]);
    $rows = $stmt->fetchAll();
    $currentSid = session_id();

    // Repeated sign-ins from the exact same browser on the exact same
    // device each get a brand-new PHP session id (an unavoidable, normal
    // side effect of how sessions work) — without collapsing those here,
    // this list would grow a near-duplicate "Chrome" row every time
    // someone just reopens the app or logs back in, piling up fast.
    // This only changes what gets RETURNED to the client — the rows
    // themselves are never touched (no DELETE), so nothing is revoked and
    // no device is ever forced signed out by this; an older duplicate
    // simply stops being listed once a newer one for the same user_agent
    // exists. This is deliberately NOT the same thing as the auto-revoke
    // behavior tagSessionOwner() above explicitly decided against — that
    // killed a still-open second tab outright; this only hides a listing
    // row for what's realistically a dead, replaced session.
    $seenAgents = [];
    $deduped = [];
    foreach ($rows as $r) {
        $agent = $r['user_agent'] ?? '';
        $isCurrent = $r['id'] === $currentSid;
        if (!$isCurrent && $agent !== '' && isset($seenAgents[$agent])) continue;
        if ($agent !== '') $seenAgents[$agent] = true;
        $deduped[] = $r;
    }

    return array_map(function (array $r) use ($currentSid): array {
        $parts = parseDeviceParts($r['user_agent'] ?? '');
        return [
            'id'         => _sessionShortId($r['id']),
            'os'         => $parts['os'],
            'type'       => $parts['type'],
            'browser'    => $parts['browser'],
            'device'     => $parts['label'],
            'ip'         => $r['ip_address'] ?? null,
            'createdAt'  => $r['created_at'],
            'lastActive' => $r['last_access'] ? date('Y-m-d H:i:s', (int)$r['last_access']) : null,
            'isCurrent'  => $r['id'] === $currentSid,
        ];
    }, $deduped);
}

// Revokes one of $userId's own sessions, identified by the short id
// listSessions() handed the client — scoped to `WHERE user_id = ?`
// throughout, so there is no way to list or revoke a different account's
// session even by guessing/brute-forcing a short id. Returns the number of
// rows actually removed (0 if the short id didn't match anything).
//
// Also sweeps every OTHER session on the account that's the exact same
// browser AND the exact same IP as the one picked — in practice almost
// always just leftover duplicate rows from repeatedly logging back in on
// the same device (listSessions() already hides these from the list via
// its own dedup, but never deletes them — see that function's own
// comment). Deleting them here is safe specifically because this is a
// manual, explicit click on one particular row, not something that
// happens automatically on login — the exact distinction that made
// auto-revoking on a new sign-in unsafe (a still-open second tab could
// get killed with no warning) doesn't apply to an intentional Sign Out
// click. The current session is always excluded, so this can never sign
// the caller themselves out; device+IP matching only runs when the target
// row actually has both (an old row with a blank/unknown one never
// cascades, so it can't sweep unrelated rows that merely share the same
// blankness).
function revokeSessionByShortId(PDO $pdo, int $userId, string $shortId): int {
    $stmt = $pdo->prepare('SELECT id, user_agent, ip_address FROM sessions WHERE user_id = ?');
    $stmt->execute([$userId]);
    foreach ($stmt->fetchAll() as $row) {
        if (_sessionShortId($row['id']) !== $shortId) continue;
        $currentSid = session_id();
        if ($row['user_agent'] && $row['ip_address']) {
            $del = $pdo->prepare(
                'DELETE FROM sessions WHERE user_id = ? AND user_agent = ? AND ip_address = ? AND id != ?'
            );
            $del->execute([$userId, $row['user_agent'], $row['ip_address'], $currentSid]);
        } else {
            $del = $pdo->prepare('DELETE FROM sessions WHERE id = ? AND user_id = ?');
            $del->execute([$row['id'], $userId]);
        }
        return $del->rowCount();
    }
    return 0;
}

// Revokes every session on the account EXCEPT $exceptSessionId — used by
// a self-service password change, where the device making the change
// stays signed in (same convention as Facebook/Google), but every other
// open session is signed out as a security measure.
function revokeOtherSessions(PDO $pdo, int $userId, string $exceptSessionId): void {
    $pdo->prepare('DELETE FROM sessions WHERE user_id = ? AND id != ?')->execute([$userId, $exceptSessionId]);
}

// Revokes every session on the account, no exceptions — used by the
// forgot-password reset flow (the requester wasn't authenticated as this
// user anywhere during that flow, so there's no "current device" to
// spare) and by an admin resetting another user's password (the admin
// isn't the account owner, so none of that account's sessions are theirs
// to keep).
function revokeAllSessions(PDO $pdo, int $userId): void {
    $pdo->prepare('DELETE FROM sessions WHERE user_id = ?')->execute([$userId]);
}

// Parses clinic_settings.min_advance_booking ('Same day','1 day','2 days','3 days')
// into the minimum number of days ahead a booking must be made.
function minAdvanceBookingDays(PDO $pdo): int {
    $val = $pdo->query('SELECT min_advance_booking FROM clinic_settings WHERE id = 1 LIMIT 1')->fetchColumn();
    if (!$val || stripos($val, 'same') !== false) return 0;
    if (preg_match('/(\d+)/', $val, $m)) return (int)$m[1];
    return 1;
}

// ── Appointment time helpers ──────────────────────────────────────
function apptTimeToMinutes(string $t): int {
    if (!preg_match('/^(\d+)(?::(\d+))?\s*(AM|PM)$/i', trim($t), $m)) return -1;
    $h = (int)$m[1]; $min = isset($m[2]) ? (int)$m[2] : 0;
    $ampm = strtoupper($m[3]);
    if ($ampm === 'PM' && $h !== 12) $h += 12;
    if ($ampm === 'AM' && $h === 12) $h = 0;
    return $h * 60 + $min;
}

// Returns the conflicting appointment time string, or null if clear.
// Pass $excludeId to skip the appointment being rescheduled.
function checkApptConflict(PDO $pdo, string $doctorId, string $date, string $time, int $durationMin, string $excludeId = ''): ?string {
    $q = "SELECT time FROM appointments
          WHERE doctor_id = ? AND date = ? AND status NOT IN ('cancelled','disapproved')"
       . ($excludeId ? ' AND id != ?' : '');
    $params = $excludeId ? [$doctorId, $date, $excludeId] : [$doctorId, $date];
    $stmt = $pdo->prepare($q);
    $stmt->execute($params);
    $newMins = apptTimeToMinutes($time);
    foreach ($stmt->fetchAll(PDO::FETCH_COLUMN) as $existing) {
        $existMins = apptTimeToMinutes($existing);
        if ($existMins >= 0 && $newMins >= 0 && abs($newMins - $existMins) < $durationMin) {
            return $existing;
        }
    }
    return null;
}

// Doctors who could plausibly see a patient on a given date — active,
// scheduled to work that weekday, and not individually blocked that date.
// Used for the "any available optometrist" booking path (no specific
// doctor chosen yet) to decide which time slots are even worth showing,
// and again server-side at submission to verify at least one of them is
// actually free before accepting a doctor-less request.
function eligibleDoctorsForDate(PDO $pdo, string $date): array {
    $dow = date('D', strtotime($date)); // 'Mon','Tue',… — matches doctor_days' ENUM
    $stmt = $pdo->prepare(
        "SELECT d.id, d.first_name, d.middle_name, d.last_name
           FROM doctors d
           JOIN doctor_days dd ON dd.doctor_id = d.id AND dd.day_of_week = ?
          WHERE d.status = 'active'
            AND NOT EXISTS (SELECT 1 FROM blocked_dates bd WHERE bd.doctor_id = d.id AND bd.date = ?)
          ORDER BY d.sort_order, d.id"
    );
    $stmt->execute([$dow, $date]);
    return array_map(fn($r) => [
        'id'   => $r['id'],
        'name' => 'Dr. ' . trim($r['first_name'] . _mi($r['middle_name']) . ' ' . $r['last_name']),
    ], $stmt->fetchAll());
}

// ── Build the frontend-compatible user object ─────────────────────
// Maps snake_case DB columns to camelCase keys expected by pages.js.
function buildUserObject(string $role, array $p, string $email, array $days = [], ?int $usersId = null): array {
    $middleName    = trim($p['middle_name'] ?? '');
    $middleInitial = ltrim(_mi($middleName));
    $fullName      = trim($p['first_name'] . _mi($middleName) . ' ' . $p['last_name']);

    $base = [
        'id'           => $p['id'],
        'dbId'         => $usersId,   // users.id integer — used for activity log photo join
        'firstName'    => $p['first_name'],
        'middleName'   => $middleName,
        'middleInitial'=> $middleInitial,
        'lastName'     => $p['last_name'],
        'name'         => ($role === 'doctor' ? 'Dr. ' : '') . $fullName,
        'email'        => $email,
        'contact'      => $p['contact'] ?? '',
        'status'       => $p['status']  ?? 'active',
        'role'         => $role,
        'photoUrl'     => $p['photo_url'] ?? null,
    ];

    if ($role === 'doctor') {
        return array_merge($base, [
            'specialization' => $p['specialization'] ?? 'Optometrist',
            'prcLicense'     => $p['prc_license'] ?? '',
            'available'      => (bool)($p['available'] ?? true),
            'days'           => $days,
            'hours'          => $p['work_hours'] ?? '',
        ]);
    }

    if ($role === 'patient') {
        return array_merge($base, [
            'gender'         => $p['gender']          ?? '',
            'dob'            => $p['dob']              ?? '',
            'age'            => (int)($p['age']        ?? 0),
            'address'        => $p['address']          ?? '',
            'occupation'     => $p['occupation']       ?? '',
            'medicalHistory' => $p['medical_history']  ?? '',
            'qrData'         => $p['qr_data']          ?? '',
            'registeredDate' => $p['registered_date']  ?? '',
            'lastVisit'      => $p['last_visit'] ?: '—',
            'noShowCount'    => (int)($p['no_show_count'] ?? 0),
            'bookingRestricted' => (bool)($p['booking_restricted'] ?? false),
            'deletionRequestedAt' => $p['deletion_requested_at']   ?? null,
            'deletionRequestReason' => $p['deletion_request_reason'] ?? '',
            'consultations'  => [],
            'examinations'   => [],
            'prescriptions'  => [],
        ]);
    }

    return $base;
}

// ── No-show tracking ───────────────────────────────────────────────
// Threshold: 3 no-shows (this constant). Consequence: booking_restricted
// gets set on the patient record, which blocks self-service ONLINE
// booking only — api/appointments/create.php rejects a patient-submitted
// request with "Online booking is currently unavailable for your account
// due to repeated missed appointments. Please contact the clinic directly
// to schedule."
//
// Takes effect immediately, the instant the 3rd no-show is recorded —
// whether that's the automatic day-passed detection (appointments/index.php)
// or a staff member manually marking one (appointments/update.php). No
// grace period, no separate approval step.
//
// Lasts indefinitely — there's no automatic expiry, it doesn't wear off
// after any period of good behavior. The only way it's lifted is an
// admin/staff manually clicking "Clear Restriction" in the Edit Patient
// modal (api/patients/clear_restriction.php). Clearing it only resets the
// restriction FLAG, not the no-show counter itself — so if the patient
// no-shows even once more right after being unblocked, they're already
// back at/above the threshold and get re-restricted instantly (see the
// !$row['booking_restricted'] guard below: it only ever fires again once
// the flag has been cleared, but the count is never what's checked for
// "how far past 3" — just whether it's >= 3 at all).
//
// Can admin/staff bypass this for a walk-in? Yes, entirely — the
// restriction check only ever runs when the request comes from the
// patient role (self-service; see create.php's `if ($role === 'patient')`
// gate). If admin or staff creates the appointment on the patient's
// behalf instead, that check is skipped completely — a walk-in, phone
// booking, or staff manually scheduling a blocked patient all work
// normally, no override needed.
const NO_SHOW_RESTRICTION_THRESHOLD = 3;

// Increments a patient's no-show count by one and applies the booking
// restriction once they cross the threshold. Returns true if this call is
// what pushed them over the threshold (i.e. the restriction is new), so
// callers can mention it in a notification/log without re-mentioning it
// on every subsequent no-show.
function recordNoShow(PDO $pdo, string $patientId): bool {
    if (!$patientId) return false;
    try {
        $pdo->prepare('UPDATE patients SET no_show_count = no_show_count + 1 WHERE id = ?')->execute([$patientId]);
        $stmt = $pdo->prepare('SELECT no_show_count, booking_restricted FROM patients WHERE id = ? LIMIT 1');
        $stmt->execute([$patientId]);
        $row = $stmt->fetch();
        if (!$row) return false;
        if ((int)$row['no_show_count'] >= NO_SHOW_RESTRICTION_THRESHOLD && !$row['booking_restricted']) {
            $pdo->prepare('UPDATE patients SET booking_restricted = 1 WHERE id = ?')->execute([$patientId]);
            return true;
        }
    } catch (PDOException) { /* non-critical */ }
    return false;
}

// ── Appointment reminders, confirmation & waitlist ─────────────────
// The reminder is sent at the configured reminder time the day before the
// appointment; if the patient hasn't confirmed by the configured deadline
// that same day, api/cron/appointment_reminders.php auto-cancels it. Both
// are checked against the clinic's local time (Asia/Manila, set in this
// file above). Admin-configurable via Clinic Settings → Scheduling Rules
// (clinic_settings.reminder_time / confirm_deadline_time — same "H:MM AM/PM"
// string format as the rest of clinic_settings' time fields), rather than
// fixed at noon/9:00 PM for every clinic.
function reminderTimeSetting(PDO $pdo): string {
    return $pdo->query('SELECT reminder_time FROM clinic_settings WHERE id = 1 LIMIT 1')->fetchColumn() ?: '12:00 PM';
}
function confirmDeadlineTimeSetting(PDO $pdo): string {
    return $pdo->query('SELECT confirm_deadline_time FROM clinic_settings WHERE id = 1 LIMIT 1')->fetchColumn() ?: '9:00 PM';
}
// Converts a clinic_settings "H:MM AM/PM" time string into "HH:MM:SS" for
// direct comparison against CURTIME() in the cron's SQL.
function settingTimeTo24h(string $t): string {
    $ts = strtotime($t);
    return $ts !== false ? date('H:i:s', $ts) : '00:00:00';
}

// Builds a Google Calendar "add event" link for an approved appointment —
// Google's own URL-based /calendar/render?action=TEMPLATE endpoint, not
// the OAuth Calendar API, so no account connection or credentials are
// needed on either side; it just opens Google Calendar pre-filled and the
// patient hits Save. From there Google's own reminder options (popup/
// email, however far in advance) apply on top of this app's own email/
// in-app reminders — more choices, not a replacement for them. Only
// surfaced in emails (the approval email + the day-before reminder
// email), never inside the app itself.
// Times are sent as plain local wall-clock numbers with an explicit
// ctz=Asia/Manila (the timezone this whole app already runs in — see
// date_default_timezone_set above) so Google renders them at the correct
// local time regardless of the recipient's own device timezone, instead
// of us having to convert to UTC ourselves.
function googleCalendarUrl(PDO $pdo, string $date, string $time, ?string $doctorName, ?string $apptType): string {
    $durStr = $pdo->query('SELECT default_duration FROM clinic_settings WHERE id = 1 LIMIT 1')->fetchColumn();
    preg_match('/(\d+)/', $durStr ?: '45', $dm);
    $durationMin = isset($dm[1]) ? (int)$dm[1] : 45;

    $startTs = strtotime("$date $time");
    if ($startTs === false) $startTs = strtotime($date) ?: time();
    $endTs = $startTs + $durationMin * 60;
    $stamp = fn(int $ts): string => date('Ymd\THis', $ts);

    $address = $pdo->query('SELECT address FROM clinic_settings WHERE id = 1 LIMIT 1')->fetchColumn();
    $details = trim(($doctorName ? "Doctor: {$doctorName}\n" : '') . 'Booked through the Cana Optical Clinic patient portal.');

    $params = http_build_query([
        'action'   => 'TEMPLATE',
        'text'     => ($apptType ?: 'Eye Consultation') . ' — Cana Optical Clinic',
        'dates'    => $stamp($startTs) . '/' . $stamp($endTs),
        'details'  => $details,
        'location' => $address ?: '',
        'ctz'      => 'Asia/Manila',
    ]);
    return "https://calendar.google.com/calendar/render?{$params}";
}

// How long a waitlist offer stays claimable — admin-configurable (Clinic
// Settings → Scheduling Rules, default 3), deliberately not scaled by how
// far out the appointment is. A longer window for distant appointments
// sounds more lenient, but it also means every other patient behind the
// first one in the FIFO queue has to wait out that same long window before
// the offer can cascade down to them if it's ignored — with several people
// in line, that compounds fast. A single short window bounds that worst
// case regardless of queue length or appointment distance. Also doubles as
// the minimum runway a slot needs before it's even offered (see
// waitlistHasEnoughLeadTime below) — there's no point offering a window
// longer than what could ever fit before the appointment happens.
function waitlistOfferHoursSetting(PDO $pdo): int {
    $v = $pdo->query('SELECT waitlist_offer_hours FROM clinic_settings WHERE id = 1 LIMIT 1')->fetchColumn();
    $v = (int)$v;
    return $v > 0 ? $v : 3;
}

// True if a doctor+date+time slot has enough runway left to bother offering
// it via the waitlist. This is purely an hours-based feasibility check —
// can the patient realistically see the notification, respond, and get to
// the clinic — not the day-level minimum-advance-booking policy (Minimum
// Advance Booking exists to stop a brand-new *self-service* booking from
// being made with too little planning lead-time; a waitlisted patient
// already opted in to be notified about this exact slot in advance, so
// applying that same "no same-day" rule here just blocks a same-day
// cancellation from ever being offered to them, even with hours of runway
// still left — the hours floor below already covers the real constraint).
function waitlistHasEnoughLeadTime(PDO $pdo, string $date, string $time): bool {
    $apptAt = strtotime("$date $time");
    if ($apptAt === false) return false;
    return ($apptAt - time()) / 3600 >= waitlistOfferHoursSetting($pdo);
}

// Claim-window length for a specific doctor+date+time slot — a flat
// waitlistOfferHoursSetting(), only ever called after
// waitlistHasEnoughLeadTime() has confirmed that much runway actually
// exists. The cap here is just a safety net for the sliver of time right
// at that boundary (e.g. exactly 3.0 hours left rounding down a touch due
// to fractional seconds).
function waitlistOfferHours(PDO $pdo, string $date, string $time): int {
    $maxHours = waitlistOfferHoursSetting($pdo);
    $apptAt   = strtotime("$date $time");
    if ($apptAt === false) return $maxHours;

    $hoursUntil = ($apptAt - time()) / 3600;
    return max(1, min($maxHours, (int)floor($hoursUntil)));
}

// Builds the next A00N id and inserts the appointment row. Shared by
// api/appointments/create.php (normal booking, status usually 'pending')
// and api/waitlist/respond.php (claiming an offer, status 'approved' —
// the slot was already implicitly vetted when it was first offered).
function createAppointmentRecord(PDO $pdo, array $data): string {
    $last = $pdo->query("SELECT id FROM appointments ORDER BY id DESC LIMIT 1")->fetchColumn();
    $next = 1;
    if ($last && preg_match('/^A(\d+)$/i', $last, $m)) {
        $next = (int)$m[1] + 1;
    }
    $newId = 'A' . str_pad($next, 3, '0', STR_PAD_LEFT);
    // Ensure uniqueness in case of gaps
    $dup = $pdo->prepare('SELECT id FROM appointments WHERE id = ?');
    while (true) {
        $dup->execute([$newId]);
        if (!$dup->fetch()) break;
        $next++;
        $newId = 'A' . str_pad($next, 3, '0', STR_PAD_LEFT);
    }

    // 'online' unless the caller explicitly says otherwise — every existing
    // caller before this field existed effectively meant 'online' anyway
    // (a patient booking themselves, or claiming their own waitlist offer),
    // so this default keeps every call site that hasn't been updated working
    // exactly as before instead of silently mislabeling walk-ins.
    $source = ($data['source'] ?? 'online') === 'walk-in' ? 'walk-in' : 'online';

    $pdo->prepare(
        'INSERT INTO appointments
           (id, patient_id, patient_name, doctor_id, doctor_name, date, time, type, status, source, notes, terms_agreed)
         VALUES (?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?)'
    )->execute([
        $newId, $data['patientId'], $data['patientName'], $data['doctorId'], $data['doctorName'],
        $data['date'], $data['time'], $data['type'], $data['status'], $source, $data['notes'] ?? '',
        !empty($data['termsAgreed']) ? 1 : 0,
    ]);

    return $newId;
}

// Exact-match check (unlike checkApptConflict's fuzzy duration-window
// overlap) for whether this precise doctor+date+time is currently held
// by an active, unexpired waitlist offer to a different patient.
function checkWaitlistHold(PDO $pdo, string $doctorId, string $date, string $time, string $excludePatientId = ''): bool {
    $q = "SELECT id FROM appointment_waitlist
          WHERE doctor_id = ? AND date = ? AND time = ? AND status = 'offered' AND offer_expires_at > NOW()"
       . ($excludePatientId ? ' AND patient_id != ?' : '');
    $params = $excludePatientId ? [$doctorId, $date, $time, $excludePatientId] : [$doctorId, $date, $time];
    $stmt = $pdo->prepare($q);
    $stmt->execute($params);
    return (bool)$stmt->fetch();
}

// Where a given waiting entry currently sits in line for its doctor+date+
// time slot, and how many people total are waiting for that same slot.
// Uses the identical ordering offerNextWaitlistSlot() uses to pick who's
// next (status='waiting', created_at ASC, id as a tiebreaker for same-
// timestamp entries) so the number shown to a patient always matches who'd
// actually be offered the slot next — never shows other patients' details,
// just where this one entry ranks.
function waitlistPosition(PDO $pdo, string $doctorId, string $date, string $time, string $createdAt, int $id): array {
    $stmt = $pdo->prepare(
        "SELECT COUNT(*) FROM appointment_waitlist
         WHERE doctor_id = ? AND date = ? AND time = ? AND status = 'waiting'
           AND (created_at < ? OR (created_at = ? AND id <= ?))"
    );
    $stmt->execute([$doctorId, $date, $time, $createdAt, $createdAt, $id]);
    $position = (int)$stmt->fetchColumn();

    $stmt = $pdo->prepare(
        "SELECT COUNT(*) FROM appointment_waitlist WHERE doctor_id = ? AND date = ? AND time = ? AND status = 'waiting'"
    );
    $stmt->execute([$doctorId, $date, $time]);
    $total = (int)$stmt->fetchColumn();

    return ['position' => $position, 'total' => $total];
}

// Offers a freshly-opened slot to the next patient in line, if anyone is
// waiting for that exact doctor+date+time. Call this any time an
// appointment for that slot is cancelled/no-showed, a waitlist offer is
// declined, or a stale offer expires. No-op if nobody's waiting.
function offerNextWaitlistSlot(PDO $pdo, string $doctorId, string $date, string $time): void {
    // Claiming an offer is functionally a new booking — a patient can't be
    // expected to see the notification, respond, and travel to the clinic
    // if the slot doesn't leave enough runway. Don't manufacture an offer
    // nobody could realistically act on — leave the entry as 'waiting'
    // (a no-op here, same as if nobody were in line).
    if (!waitlistHasEnoughLeadTime($pdo, $date, $time)) return;

    $stmt = $pdo->prepare(
        "SELECT id, patient_id, doctor_name FROM appointment_waitlist
         WHERE doctor_id = ? AND date = ? AND time = ? AND status = 'waiting'
         ORDER BY created_at ASC LIMIT 1"
    );
    $stmt->execute([$doctorId, $date, $time]);
    $row = $stmt->fetch();
    if (!$row) return;

    $expiresAt = date('Y-m-d H:i:s', time() + waitlistOfferHours($pdo, $date, $time) * 3600);
    $pdo->prepare(
        "UPDATE appointment_waitlist SET status = 'offered', offered_at = NOW(), offer_expires_at = ?
         WHERE id = ? AND status = 'waiting'"
    )->execute([$expiresAt, $row['id']]);

    $ps = $pdo->prepare('SELECT user_id FROM patients WHERE id = ? LIMIT 1');
    $ps->execute([$row['patient_id']]);
    $userId = $ps->fetchColumn();
    if ($userId) {
        $fmtDate      = date('M j, Y', strtotime($date));
        $expiresLabel = date('g:i A', strtotime($expiresAt));
        $noticeMsg = "The slot with {$row['doctor_name']} on {$fmtDate} at {$time} you were waitlisted for is now available. "
          . "Claim it by {$expiresLabel} or it will be offered to the next patient in line.";
        // This is the single most time-critical notice in the whole waitlist
        // system — a live countdown claim window, same urgency as the
        // appointment reminder cron. In-app only meant a patient who wasn't
        // actively logged in right then would simply never find out in time.
        createNotification($pdo, (int)$userId, 'waitlist_offer', 'A Waitlisted Slot Is Open', $noticeMsg);
        _emailPatientNotice($pdo, (int)$userId, 'A Waitlisted Slot Is Open', $noticeMsg);
    }
}

// Removes any still-'waiting' waitlist entries for a doctor+date+time slot
// that just became locked in for good — the patient confirmed attendance
// (api/appointments/confirm.php), or the visit already happened
// (api/appointments/update.php marking it 'completed'). Either way that
// slot is no longer a realistic prospect, so leaving anyone queued on it
// just delays them from picking something actually available. Notifies
// each one removed, in-app and by email — same reasoning as
// offerNextWaitlistSlot() above, this isn't something to leave someone to
// discover only by happening to check the app.
function clearWaitlistForLockedSlot(PDO $pdo, string $doctorId, string $date, string $time, string $reasonMsg): void {
    $waiters = $pdo->prepare(
        "SELECT patient_id FROM appointment_waitlist
         WHERE doctor_id = ? AND date = ? AND time = ? AND status = 'waiting'"
    );
    $waiters->execute([$doctorId, $date, $time]);
    $waiting = $waiters->fetchAll();
    if (!$waiting) return;

    $pdo->prepare(
        "UPDATE appointment_waitlist SET status = 'cancelled'
         WHERE doctor_id = ? AND date = ? AND time = ? AND status = 'waiting'"
    )->execute([$doctorId, $date, $time]);

    foreach ($waiting as $w) {
        $ps = $pdo->prepare('SELECT user_id FROM patients WHERE id = ? LIMIT 1');
        $ps->execute([$w['patient_id']]);
        $userId = $ps->fetchColumn();
        if ($userId) {
            createNotification($pdo, (int)$userId, 'waitlist_removed', 'Removed From Waitlist', $reasonMsg);
            _emailPatientNotice($pdo, (int)$userId, 'Removed From Waitlist', $reasonMsg);
        }
    }
}

// ── Notification helpers ─────────────────────────────────────────
function createNotification(PDO $pdo, int $userId, string $type, string $title, string $body, ?string $relatedId = null): void {
    try {
        $pdo->prepare(
            'INSERT INTO notifications (user_id, type, title, body, related_id) VALUES (?, ?, ?, ?, ?)'
        )->execute([$userId, $type, $title, $body, $relatedId]);
    } catch (PDOException) {
        // Non-critical — silent fail
    }
}

// $relatedId (optional) lets a click-through on this notification jump
// straight to the specific record it's about — e.g. reschedule_request
// notifications pass the appointment id, so clicking one opens that exact
// appointment's details instead of just a filtered list to scan (see
// openRescheduleRequestNotif() in main.js / _markNotifDropdown() in
// router.js). Every other caller today omits it and behaves exactly as
// before.
function notifyAdminStaff(PDO $pdo, string $type, string $title, string $body, ?string $relatedId = null): void {
    try {
        $ids  = $pdo->query("SELECT id FROM users WHERE role IN ('admin','staff') AND is_active = 1")->fetchAll();
        $stmt = $pdo->prepare('INSERT INTO notifications (user_id, type, title, body, related_id) VALUES (?, ?, ?, ?, ?)');
        foreach ($ids as $row) {
            $stmt->execute([(int)$row['id'], $type, $title, $body, $relatedId]);
        }
    } catch (PDOException) {
        // Non-critical — silent fail
    }
}

// Companion to createNotification() — sends the same notice by email too,
// so a patient not actively logged in when it fires still finds out
// (appointment reminders/cancellations, waitlist removal, etc). Shared
// here rather than duplicated per call site (originally lived only in
// api/cron/appointment_reminders.php). Its own try/catch so one failed
// delivery never interrupts whatever loop is calling it in a batch.
// $ctaUrl/$ctaLabel are optional (e.g. the "Add to Google Calendar" link
// on the approval/reminder emails) and passed straight through to
// systemEmailBody() for the HTML button; the plain-text fallback gets the
// same link as a plain line since it can't render a styled button.
// $ctaDate ('Y-m-d', optional) drives that button's small calendar-icon
// preview — see systemEmailBody().
// $reasonLabel/$reasonText (optional) put a staff-entered reason (a
// cancellation or disapproval) in its own visually separate box instead
// of run into the same paragraph as the main sentence — mirrors how the
// in-app Appointment Details modal already shows a Cancellation/
// Disapproval Reason as its own highlighted block, not just appended
// text.
function _emailPatientNotice(PDO $pdo, int $userId, string $subject, string $message, string $ctaUrl = '', string $ctaLabel = '', string $ctaDate = '', string $reasonLabel = '', string $reasonText = '', string $reasonTone = 'negative'): void {
    try {
        $s = $pdo->prepare(
            'SELECT u.email, p.first_name, p.last_name
               FROM users u JOIN patients p ON p.user_id = u.id
              WHERE u.id = ? LIMIT 1'
        );
        $s->execute([$userId]);
        $row = $s->fetch();
        if (!$row || empty($row['email'])) return;
        $name = trim($row['first_name'] . ' ' . $row['last_name']) ?: 'there';
        $text = "$subject\n\n$message"
            . ($reasonText ? "\n\n" . ($reasonLabel ?: 'Reason') . ": $reasonText" : '')
            . ($ctaUrl ? "\n\n" . ($ctaLabel ?: 'View Details') . ": $ctaUrl" : '');
        sendEmail($row['email'], $name, $subject, systemEmailBody($name, $subject, $message, $ctaUrl, $ctaLabel, $ctaDate, $reasonLabel, $reasonText, $reasonTone), $text);
    } catch (\Throwable $e) {
        error_log('[email] Notice "' . $subject . '" failed for user ' . $userId . ': ' . $e->getMessage());
    }
}

// ── Fetch profile row + build user object for a given user_id ────
function loadUserProfile(PDO $pdo, int $userId, string $role): ?array {
    $profile = null;
    $days    = [];

    switch ($role) {
        case 'admin':
            $s = $pdo->prepare('SELECT * FROM admins WHERE user_id = ? LIMIT 1');
            $s->execute([$userId]);
            $profile = $s->fetch() ?: null;
            break;

        case 'staff':
            $s = $pdo->prepare('SELECT * FROM staff WHERE user_id = ? LIMIT 1');
            $s->execute([$userId]);
            $profile = $s->fetch() ?: null;
            break;

        case 'doctor':
            $s = $pdo->prepare('SELECT * FROM doctors WHERE user_id = ? LIMIT 1');
            $s->execute([$userId]);
            $profile = $s->fetch() ?: null;
            if ($profile) {
                $ds = $pdo->prepare(
                    'SELECT day_of_week FROM doctor_days WHERE doctor_id = ?
                     ORDER BY FIELD(day_of_week,"Mon","Tue","Wed","Thu","Fri","Sat","Sun")'
                );
                $ds->execute([$profile['id']]);
                $days = array_column($ds->fetchAll(), 'day_of_week');
            }
            break;

        case 'patient':
            $s = $pdo->prepare('SELECT * FROM patients WHERE user_id = ? LIMIT 1');
            $s->execute([$userId]);
            $profile = $s->fetch() ?: null;
            break;
    }

    // Fetch photo_url separately so a missing column (pre-migration) never breaks auth
    if ($profile) {
        try {
            $ps = $pdo->prepare('SELECT photo_url FROM users WHERE id = ? LIMIT 1');
            $ps->execute([$userId]);
            $photoRow = $ps->fetch();
            $profile['photo_url'] = $photoRow['photo_url'] ?? null;
        } catch (PDOException) {
            $profile['photo_url'] = null;
        }
    }

    return $profile ? ['profile' => $profile, 'days' => $days] : null;
}

// Shared next-record-id generator (max existing id of this prefix, +1,
// with a collision-check loop) — used by api/examinations/create.php and
// update.php for consultations/examinations/prescriptions ids ('C001',
// 'E001', 'RX001'). Kept here rather than duplicated per file so all
// three id sequences get the same collision protection consistently.
function nextRecordId(PDO $pdo, string $table, string $prefix): string {
    $last = $pdo->query("SELECT id FROM `$table` ORDER BY id DESC LIMIT 1")->fetchColumn();
    $next = 1;
    if ($last && preg_match('/^' . preg_quote($prefix, '/') . '(\d+)$/i', $last, $m)) {
        $next = (int)$m[1] + 1;
    }
    $id  = $prefix . str_pad($next, 3, '0', STR_PAD_LEFT);
    $dup = $pdo->prepare("SELECT id FROM `$table` WHERE id = ?");
    while (true) {
        $dup->execute([$id]);
        if (!$dup->fetch()) break;
        $next++;
        $id = $prefix . str_pad($next, 3, '0', STR_PAD_LEFT);
    }
    return $id;
}
