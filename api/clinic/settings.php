<?php
// ================================================================
//  CANAOPTICALCLINIC — api/clinic/settings.php
//  GET  — any authenticated user. Returns the single clinic settings row.
//  POST — admin only. Partial update: send only the fields you want to
//         change (clinic info, consultation/scheduling rules, or both
//         in one call — mirrors the 3 separate "Save" buttons in the UI).
// ================================================================

require_once '../../config/db.php';
require_once '../helpers.php';

startSession();

if (!isset($_SESSION['user_id'])) {
    jsonResponse(['success' => false, 'message' => 'Not authenticated.'], 401);
}

// Maps camelCase request/response keys to snake_case DB columns
const FIELD_MAP = [
    'name'                     => 'name',
    'tagline'                  => 'tagline',
    'address'                  => 'address',
    'phone'                    => 'phone',
    'email'                    => 'email',
    'hours'                    => 'hours',
    'tinNo'                    => 'tin_no',
    'phicNo'                   => 'phic_no',
    'logoUrl'                  => 'logo_url',
    'foundedYear'              => 'founded_year',
    'heroUrl'                  => 'hero_url',
    'mapLat'                   => 'map_lat',
    'mapLng'                   => 'map_lng',
    'mapEmbedUrl'              => 'map_embed_url',
    'videoUrl'                 => 'video_url',
    'galleryMaxPhotos'         => 'gallery_max_photos',
    'termsContent'             => 'terms_content',
    'privacyContent'           => 'privacy_content',
    'appointmentPolicyContent' => 'appointment_policy_content',
    'defaultDuration'          => 'default_duration',
    'maxAdvanceBooking'        => 'max_advance_booking',
    'minAdvanceBooking'        => 'min_advance_booking',
    'maxApptsPerDoctorPerDay'  => 'max_appts_per_doctor_per_day',
    'morningStart'             => 'morning_start',
    'morningEnd'               => 'morning_end',
    'afternoonStart'           => 'afternoon_start',
    'afternoonEnd'             => 'afternoon_end',
    'lunchBreak'               => 'lunch_break',
    'reminderTime'             => 'reminder_time',
    'confirmDeadlineTime'      => 'confirm_deadline_time',
    'waitlistOfferHours'       => 'waitlist_offer_hours',
];

function rowToResponse(array $r): array {
    return [
        'name'                     => $r['name'],
        'tagline'                  => $r['tagline'],
        'address'                  => $r['address'],
        'phone'                    => $r['phone'],
        'mobile'                   => $r['phone'], // mobile always mirrors phone (same as the old client-side behavior)
        'email'                    => $r['email'],
        'hours'                    => $r['hours'],
        'tinNo'                    => $r['tin_no'],
        'phicNo'                   => $r['phic_no'],
        'foundedYear'              => $r['founded_year'] ?? null,
        'logoUrl'                  => $r['logo_url'],
        'heroUrl'                  => $r['hero_url'] ?? null,
        'mapLat'                   => isset($r['map_lat']) ? (float)$r['map_lat'] : null,
        'mapLng'                   => isset($r['map_lng']) ? (float)$r['map_lng'] : null,
        'mapEmbedUrl'              => $r['map_embed_url'] ?? null,
        'videoUrl'                 => $r['video_url'] ?? null,
        'galleryMaxPhotos'         => isset($r['gallery_max_photos']) ? (int)$r['gallery_max_photos'] : null,
        'termsContent'             => $r['terms_content'] ?: DEFAULT_TERMS_MD,
        'privacyContent'           => $r['privacy_content'] ?: DEFAULT_PRIVACY_MD,
        'appointmentPolicyContent' => $r['appointment_policy_content']
            ?: defaultApptPolicyMd($r['reminder_time'] ?: '12:00 AM', $r['confirm_deadline_time'] ?: '10:00 PM'),
        'defaultDuration'          => $r['default_duration'],
        'maxAdvanceBooking'        => $r['max_advance_booking'],
        'minAdvanceBooking'        => $r['min_advance_booking'],
        'maxApptsPerDoctorPerDay'  => (int)$r['max_appts_per_doctor_per_day'],
        'morningStart'             => $r['morning_start'],
        'morningEnd'               => $r['morning_end'],
        'afternoonStart'           => $r['afternoon_start'],
        'afternoonEnd'             => $r['afternoon_end'],
        'lunchBreak'               => (bool)$r['lunch_break'],
        'clinicDays'               => $r['clinic_days'] ? explode(',', $r['clinic_days']) : [],
        'reminderTime'             => $r['reminder_time']        ?: '12:00 PM',
        'confirmDeadlineTime'      => $r['confirm_deadline_time'] ?: '9:00 PM',
        'waitlistOfferHours'       => isset($r['waitlist_offer_hours']) && (int)$r['waitlist_offer_hours'] > 0 ? (int)$r['waitlist_offer_hours'] : 3,
    ];
}

try {
    $pdo = getDB();

    if ($_SERVER['REQUEST_METHOD'] === 'GET') {
        $row = $pdo->query('SELECT * FROM clinic_settings WHERE id = 1 LIMIT 1')->fetch();
        if (!$row) {
            jsonResponse(['success' => false, 'message' => 'Clinic settings not found.'], 404);
        }
        jsonResponse(['success' => true, 'settings' => rowToResponse($row)]);
    }

    if ($_SERVER['REQUEST_METHOD'] === 'POST') {
        if (($_SESSION['role'] ?? '') !== 'admin') {
            jsonResponse(['success' => false, 'message' => 'Only admins may edit clinic settings.'], 403);
        }

        $b = getBody();
        $sets   = [];
        $values = [];

        foreach (FIELD_MAP as $reqKey => $col) {
            if (!array_key_exists($reqKey, $b)) continue;
            $sets[]   = "`$col` = ?";
            $values[] = $reqKey === 'lunchBreak' ? (int)(bool)$b[$reqKey] : trim((string)$b[$reqKey]);
        }
        if (array_key_exists('clinicDays', $b) && is_array($b['clinicDays'])) {
            $sets[]   = '`clinic_days` = ?';
            $values[] = implode(',', array_map('trim', $b['clinicDays']));
        }

        // Keep the Appointment Policy's Section 4 wording in sync with the
        // actual reminder/confirm-deadline times, so an admin doesn't have
        // to remember to also go re-edit Terms & Policies every time they
        // change Scheduling Rules. Only kicks in when this save touches
        // reminderTime/confirmDeadlineTime but ISN'T also explicitly
        // rewriting appointmentPolicyContent in the same request (that
        // save wins outright — never silently overwritten out from under
        // the admin), and only against whatever custom text is already
        // stored — an empty column already falls back to
        // defaultApptPolicyMd(), which reads these settings live on every
        // render, so there's nothing frozen there to fix.
        if ((array_key_exists('reminderTime', $b) || array_key_exists('confirmDeadlineTime', $b))
            && !array_key_exists('appointmentPolicyContent', $b)) {
            $curContent = $pdo->query('SELECT appointment_policy_content FROM clinic_settings WHERE id = 1 LIMIT 1')->fetchColumn();
            if ($curContent) {
                $updatedContent = $curContent;
                if (array_key_exists('reminderTime', $b)) {
                    $newReminder = trim((string)$b['reminderTime']);
                    $updatedContent = preg_replace_callback(
                        '/(reminder at )\S.*?( the day before your visit)/',
                        fn($m) => $m[1] . $newReminder . $m[2],
                        $updatedContent, 1
                    );
                }
                if (array_key_exists('confirmDeadlineTime', $b)) {
                    $newDeadline = trim((string)$b['confirmDeadlineTime']);
                    $updatedContent = preg_replace_callback(
                        '/(attending by )\S.*?( that same day)/',
                        fn($m) => $m[1] . $newDeadline . $m[2],
                        $updatedContent, 1
                    );
                }
                if ($updatedContent !== $curContent) {
                    $sets[]   = '`appointment_policy_content` = ?';
                    $values[] = $updatedContent;
                }
            }
        }

        if ($sets) {
            $values[] = 1; // WHERE id = 1
            $pdo->prepare('UPDATE clinic_settings SET ' . implode(', ', $sets) . ' WHERE id = ?')
                ->execute($values);
        }

        $row = $pdo->query('SELECT * FROM clinic_settings WHERE id = 1 LIMIT 1')->fetch();
        jsonResponse(['success' => true, 'settings' => rowToResponse($row)]);
    }

    jsonResponse(['success' => false, 'message' => 'Method not allowed.'], 405);

} catch (PDOException $e) {
    jsonResponse(['success' => false, 'message' => 'Database error.'], 500);
}
