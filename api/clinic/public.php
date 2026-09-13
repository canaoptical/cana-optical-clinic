<?php
// ================================================================
//  CANAOPTICALCLINIC — api/clinic/public.php
//  GET — public endpoint, no auth required.
//  Returns clinic info + a computed schedule string built from the
//  structured day/time fields so the contact page always reflects
//  whatever the admin saved in Clinic Settings.
// ================================================================

require_once '../../config/db.php';
require_once '../helpers.php';

if ($_SERVER['REQUEST_METHOD'] !== 'GET') {
    jsonResponse(['success' => false, 'message' => 'Method not allowed.'], 405);
}

// Convert a "HH:MM" 24-hour string to "H:MM AM/PM"
function fmt12h(string $t): string {
    if (!$t) return '';
    [$h, $m] = explode(':', $t . ':00');
    $h = (int)$h; $m = (int)$m;
    $ampm = $h >= 12 ? 'PM' : 'AM';
    $h = $h % 12 ?: 12;
    return $h . ($m > 0 ? ':' . str_pad($m, 2, '0', STR_PAD_LEFT) : '') . ' ' . $ampm;
}

// Collapse an ordered list of day abbreviations into human-readable ranges
// e.g. ['Mon','Tue','Wed','Thu','Fri','Sat'] → "Mon – Sat"
function buildDayRanges(array $openDays): string {
    $ORDERED = ['Mon','Tue','Wed','Thu','Fri','Sat','Sun'];
    usort($openDays, fn($a, $b) => array_search($a, $ORDERED) - array_search($b, $ORDERED));

    if (!$openDays) return '';
    $ranges = [];
    $start  = $openDays[0];
    $prev   = $openDays[0];
    for ($i = 1; $i < count($openDays); $i++) {
        $cur = $openDays[$i];
        if (array_search($cur, $ORDERED) === array_search($prev, $ORDERED) + 1) {
            $prev = $cur;
            continue;
        }
        $ranges[] = $start === $prev ? $start : "$start \u{2013} $prev";
        $start = $prev = $cur;
    }
    $ranges[] = $start === $prev ? $start : "$start \u{2013} $prev";
    return implode(', ', $ranges);
}

try {
    $pdo = getDB();
    $r = $pdo->query(
        'SELECT name, tagline, footer_copyright_text, address, phone, email, hours, logo_url, hero_url, map_embed_url, video_url,
                clinic_days, morning_start, morning_end, afternoon_start, afternoon_end, founded_year, terms_content, privacy_content
         FROM clinic_settings WHERE id = 1 LIMIT 1'
    )->fetch();

    if (!$r) {
        jsonResponse(['success' => false, 'message' => 'Clinic settings not found.'], 404);
    }

    // Build schedule string from structured fields
    $ORDERED    = ['Mon','Tue','Wed','Thu','Fri','Sat','Sun'];
    $openDays   = json_decode($r['clinic_days'] ?? '[]', true) ?: [];
    $dayRanges  = buildDayRanges($openDays);
    $openTime   = fmt12h($r['morning_start'] ?? '');
    $closeTime  = fmt12h($r['afternoon_end'] ?: $r['morning_end'] ?? '');
    $closedDays = array_values(array_diff($ORDERED, $openDays));

    $schedule = '';
    if ($dayRanges && $openTime && $closeTime) {
        $schedule = "$dayRanges: $openTime \u{2013} $closeTime";
        if (count($closedDays) <= 2 && $closedDays) {
            $schedule .= '  |  ' . implode(', ', $closedDays) . ': Closed';
        }
    }

    // The manually-typed Operating Hours text (Clinic Information settings)
    // wins whenever it's actually set — clinic_days/morning_start/
    // afternoon_end all have NOT NULL DEFAULT values in the schema, so
    // $schedule was essentially always non-empty and silently overrode
    // every edit made to the manual field, making it look like Operating
    // Hours changes there just never took effect. The auto-generated
    // schedule now only fills in for a clinic that's never typed one.
    $displayHours = $r['hours'] ?: $schedule;

    header('Cache-Control: no-store, no-cache, must-revalidate');
    jsonResponse(['success' => true, 'clinic' => [
        'name'     => $r['name'],
        'tagline'  => $r['tagline'],
        'footerCopyrightText' => $r['footer_copyright_text'] ?? null,
        'address'  => $r['address'],
        'phone'    => $r['phone'],
        'email'    => $r['email'],
        'hours'    => $displayHours,
        'logoUrl'  => $r['logo_url'],
        'heroUrl'     => $r['hero_url'] ?? null,
        'mapEmbedUrl' => $r['map_embed_url'] ?? null,
        'videoUrl'    => $r['video_url'] ?? null,
        'foundedYear' => $r['founded_year'] ? (int)$r['founded_year'] : null,
        'termsContent' => $r['terms_content'] ?: DEFAULT_TERMS_MD,
        'privacyContent' => $r['privacy_content'] ?: DEFAULT_PRIVACY_MD,
    ]]);

} catch (PDOException $e) {
    jsonResponse(['success' => false, 'message' => 'Database error.'], 500);
}
