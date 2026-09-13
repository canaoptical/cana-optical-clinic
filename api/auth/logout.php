<?php
// ================================================================
//  CANAOPTICALCLINIC — api/auth/logout.php
//  POST (no body required) — destroys the PHP session.
// ================================================================

require_once '../../config/db.php';
require_once '../helpers.php';

requireMethod('POST');
startSession();

$userId = $_SESSION['user_id'] ?? null;
$sid    = session_id();

// Signing out here also clears every OTHER session on this account that's
// the exact same browser AND the exact same IP as this one — the same
// same-device-and-IP cascade the Sessions & Sign-in page's own Sign Out
// button already does (revokeSessionByShortId(), api/helpers.php), now
// also on the everyday sidebar Sign Out. This only ever matches genuine
// duplicates of THIS physical device/network (an old tab, a session that
// lingered from an earlier open of the app) — a different device (a
// desktop while this is a phone, or a different network entirely) is
// never touched, so this still never signs out anywhere else on the
// account, matching this app's own multi-device design elsewhere.
// Logged at every step — this whole cascade was landing as a silent no-op
// in at least one real case with no way to tell why from the outside.
// $shortSid keeps the log readable without printing a full raw session id.
$shortSid = $sid ? substr($sid, 0, 8) . '…' : '(none)';
if (!$userId || !$sid) {
    error_log("[logout] skipped cascade — userId=" . ($userId ?: '(none)') . " sid={$shortSid} (session wasn't recognized as logged in on this request)");
} else {
    try {
        $pdo = getDB();
        $cur = $pdo->prepare('SELECT user_agent, ip_address FROM sessions WHERE id = ? LIMIT 1');
        $cur->execute([$sid]);
        $row = $cur->fetch();
        if (!$row) {
            error_log("[logout] cascade found no sessions row for sid={$shortSid} userId={$userId} — nothing to base the cascade on (own row was never written, or already gone)");
        } elseif (!$row['user_agent'] || !$row['ip_address']) {
            error_log("[logout] cascade skipped — sid={$shortSid} userId={$userId} row has a blank user_agent or ip_address");
        } else {
            $del = $pdo->prepare('DELETE FROM sessions WHERE user_id = ? AND user_agent = ? AND ip_address = ?');
            $del->execute([$userId, $row['user_agent'], $row['ip_address']]);
            error_log("[logout] cascade deleted {$del->rowCount()} row(s) for userId={$userId}, ip={$row['ip_address']}");
        }
    } catch (PDOException $e) {
        // Non-critical — session_destroy() below still signs this device
        // out for real even if this extra cleanup pass fails.
        error_log("[logout] cascade query failed: " . $e->getMessage());
    }
}

$_SESSION = [];

if (ini_get('session.use_cookies')) {
    $p = session_get_cookie_params();
    setcookie(session_name(), '', time() - 42000,
        $p['path'], $p['domain'], $p['secure'], $p['httponly']
    );
}

session_destroy();

jsonResponse(['success' => true]);
