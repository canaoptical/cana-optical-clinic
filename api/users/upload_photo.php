<?php
// ================================================================
//  CANAOPTICALCLINIC — api/users/upload_photo.php
//  POST multipart/form-data { photo: File }
//  Saves to assets/uploads/profiles/<user_id>.<ext>
//  NOTE: this directory must have a Railway Volume mounted on it in
//  production (see README/deploy notes) — without one, Railway's
//  container filesystem is ephemeral and anything written here at
//  runtime is lost the next time the container restarts (redeploys,
//  or waking back up after going idle), even though the DB row
//  pointing at it survives. assets/images/profiles/ (committed to
//  git) is left alone on purpose so this change can't wipe out any
//  pre-existing seed photos there.
//  Updates users.photo_url and returns the public path.
//
//  DELETE — self only. Removes the current user's own profile photo
//  and reverts to the default initials avatar (users.photo_url = NULL).
// ================================================================

require_once '../../config/db.php';
require_once '../helpers.php';

startSession();

if (!isset($_SESSION['user_id'])) {
    jsonResponse(['success' => false, 'message' => 'Not authenticated.'], 401);
}

if ($_SERVER['REQUEST_METHOD'] === 'DELETE') {
    $userId = (int)$_SESSION['user_id'];
    // Checks both possible locations a photo could be sitting in — the
    // runtime upload dir this file normally saves to, and the git-tracked
    // seed dir some accounts' photos were placed in directly (see the
    // upload path comment above). Deleting from the seed dir only sticks
    // locally/until the next deploy re-adds it from git, but clearing
    // photo_url below is what actually controls what the app shows either way.
    foreach (['jpg', 'jpeg', 'png', 'webp', 'gif'] as $e) {
        foreach ([__DIR__ . '/../../assets/uploads/profiles/', __DIR__ . '/../../assets/images/profiles/'] as $dir) {
            $old = $dir . $userId . '.' . $e;
            if (file_exists($old)) @unlink($old);
        }
    }
    try {
        $pdo = getDB();
        $pdo->prepare('UPDATE users SET photo_url = NULL WHERE id = ?')->execute([$userId]);
        jsonResponse(['success' => true]);
    } catch (PDOException $e) {
        jsonResponse(['success' => false, 'message' => 'Database error.'], 500);
    }
}

requireMethod('POST');

if (empty($_FILES['photo']) || $_FILES['photo']['error'] !== UPLOAD_ERR_OK) {
    jsonResponse(['success' => false, 'message' => 'No file uploaded.']);
}

$file     = $_FILES['photo'];
$mimeType = mime_content_type($file['tmp_name']);
$allowed  = ['image/jpeg', 'image/png', 'image/webp', 'image/gif'];

if (!in_array($mimeType, $allowed, true)) {
    jsonResponse(['success' => false, 'message' => 'Invalid file type. Use JPEG, PNG, or WebP.']);
}

$userId    = (int)$_SESSION['user_id'];
$ext       = match($mimeType) {
    'image/png'  => 'png',
    'image/webp' => 'webp',
    'image/gif'  => 'gif',
    default      => 'jpg',
};

$uploadDir = __DIR__ . '/../../assets/uploads/profiles/';
if (!is_dir($uploadDir)) {
    mkdir($uploadDir, 0755, true);
}

// Remove any previous photo for this user regardless of extension
foreach (['jpg', 'jpeg', 'png', 'webp', 'gif'] as $e) {
    $old = $uploadDir . $userId . '.' . $e;
    if (file_exists($old)) @unlink($old);
}

$filename = $userId . '.' . $ext;
$destPath = $uploadDir . $filename;

if (!move_uploaded_file($file['tmp_name'], $destPath)) {
    jsonResponse(['success' => false, 'message' => 'Failed to save file. Check server permissions.'], 500);
}

// The filename is always <user_id>.<ext> — re-uploading a photo of the
// same type overwrites the exact same URL the browser already has an
// image cached for, so without something to bust that cache the old photo
// keeps showing until a hard refresh even though the file on disk changed.
// Storing the cache-busting query string as PART of photo_url (rather than
// appending it only where the frontend happens to render it) means every
// consumer of this value — the sidebar, profile pages, patient/doctor
// tables, even the public doctors.html page reading straight from the DB —
// gets a correctly busted URL for free, with no other code needing to know
// this problem exists.
$photoUrl = 'assets/uploads/profiles/' . $filename . '?v=' . time();

try {
    $pdo = getDB();
    $pdo->prepare('UPDATE users SET photo_url = ? WHERE id = ?')
        ->execute([$photoUrl, $userId]);

    jsonResponse(['success' => true, 'photoUrl' => $photoUrl]);
} catch (PDOException $e) {
    jsonResponse(['success' => false, 'message' => 'Database error.'], 500);
}
