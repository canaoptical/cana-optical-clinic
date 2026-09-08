<?php
// ================================================================
//  CANAOPTICALCLINIC — database/seed.php
//  Clears all tables and re-inserts demo data with hashed passwords.
//
//  OPTION A — Browser:  http://localhost/canaopticalclinic/database/seed.php
//             Confirm the prompt that appears.
//  OPTION B — CLI:      php seed.php --force
//
//  After seeding, demo login credentials are:
//    Admin   : admin@canaoptical.com  / admin123
//    Staff   : ana.lim@canaoptical.com / staff123
//    Doctor  : dr.palaje@canaoptical.com / doctor123
//    Patient : maria.santos@email.com / patient123
//  Shortcut aliases (same passwords):
//    admin@gmail.com | staff@gmail.com | doctor@gmail.com | patient@gmail.com
// ================================================================

$isCLI = (php_sapi_name() === 'cli');

if (!$isCLI && !isset($_GET['go'])) {
    echo <<<HTML
    <!DOCTYPE html><html><head><meta charset="utf-8">
    <style>body{font-family:sans-serif;max-width:520px;margin:60px auto;padding:24px;background:#f9f9f9;border-radius:12px;box-shadow:0 2px 8px rgba(0,0,0,.1)}
    h2{color:#E8891C}p{color:#555}a{display:inline-block;background:#E8891C;color:#fff;padding:10px 24px;border-radius:6px;text-decoration:none;font-weight:600;margin-top:12px}</style>
    </head><body>
    <h2>Cana Optical Clinic — Database Seeder</h2>
    <p>This will <strong>delete all existing data</strong> and insert fresh demo records.<br>Run this only on a development database.</p>
    <a href="?go=1">Yes, seed the database</a>
    </body></html>
    HTML;
    exit;
}

require_once '../config/db.php';

$pdo = getDB();
$pdo->setAttribute(PDO::ATTR_ERRMODE, PDO::ERRMODE_EXCEPTION);

function log_msg(string $msg): void {
    echo (php_sapi_name() === 'cli') ? $msg . "\n" : "<p>$msg</p>\n";
    flush();
}

if (!$isCLI) {
    echo "<!DOCTYPE html><html><head><meta charset='utf-8'><style>body{font-family:monospace;padding:24px}p{margin:4px 0}</style></head><body>\n";
    echo "<h2 style='color:#E8891C'>Cana Optical Clinic — Seeding Database…</h2>\n";
}

// ── Clear tables (FK-safe order) ─────────────────────────────────
$tables = [
    'archived_records','clinic_services','activity_log',
    'consultations','prescriptions','examinations',
    'appointments','patients','doctor_days',
    'doctors','staff','admins','users',
];
$pdo->exec('SET FOREIGN_KEY_CHECKS = 0');
foreach ($tables as $t) {
    $pdo->exec("TRUNCATE TABLE `$t`");
}
$pdo->exec('SET FOREIGN_KEY_CHECKS = 1');
log_msg('Tables cleared.');

// ── Helper ───────────────────────────────────────────────────────
function addUser(PDO $pdo, string $email, string $pass, string $role): int {
    $pdo->prepare('INSERT INTO users (email,password_hash,role) VALUES (?,?,?)')
        ->execute([$email, password_hash($pass, PASSWORD_DEFAULT), $role]);
    return (int)$pdo->lastInsertId();
}

// ── Admins ───────────────────────────────────────────────────────
$insA = $pdo->prepare('INSERT INTO admins (id,user_id,first_name,last_name,contact,status) VALUES (?,?,?,?,?,?)');
$insA->execute(['ADM001', addUser($pdo,'admin@canaoptical.com','admin123','admin'), 'Roberto','Cruz','09151234567','active']);
$insA->execute(['ADM002', addUser($pdo,'admin@gmail.com',     'admin123','admin'), 'Roberto','Cruz','09151234567','active']);
log_msg('Admins seeded (ADM001, ADM002).');

// ── Staff ────────────────────────────────────────────────────────
$insS = $pdo->prepare('INSERT INTO staff (id,user_id,first_name,last_name,contact,status) VALUES (?,?,?,?,?,?)');
$insS->execute(['S001', addUser($pdo,'ana.lim@canaoptical.com',    'staff123','staff'), 'Ana',    'Lim', '09161234567','active']);
$insS->execute(['S002', addUser($pdo,'carlos.tan@canaoptical.com', 'staff456','staff'), 'Carlos', 'Tan', '09162345678','active']);
$insS->execute(['S003', addUser($pdo,'staff@gmail.com',            'staff123','staff'), 'Ana',    'Lim', '09161234567','active']);
log_msg('Staff seeded (S001–S003).');

// ── Doctors ──────────────────────────────────────────────────────
$insD  = $pdo->prepare('INSERT INTO doctors (id,user_id,first_name,last_name,specialization,contact,available,work_hours,status) VALUES (?,?,?,?,?,?,?,?,?)');
$insDD = $pdo->prepare('INSERT INTO doctor_days (doctor_id,day_of_week) VALUES (?,?)');

$doctorRows = [
    ['D001','dr.palaje@canaoptical.com',   'doctor123', 'Ruziel',          'Palaje',    '09181234567','8:00 AM – 5:00 PM', ['Mon','Wed','Fri']],
    ['D002','dr.cana@canaoptical.com',     'doctor456', 'Lalaine',         'Cana',      '09182345678','8:00 AM – 6:00 PM', ['Mon','Tue','Wed','Thu','Fri']],
    ['D004','dr.garabiles@canaoptical.com','doctor101', 'Christian',       'Garabiles', '09184567890','9:00 AM – 5:00 PM', ['Tue','Thu']],
    ['D005','dr.sumaya@canaoptical.com',   'doctor202', 'Carmen',          'Sumaya',    '09185678901','8:00 AM – 5:00 PM', ['Mon','Tue','Thu']],
    ['D006','dr.jrcana@canaoptical.com',   'doctor303', 'Julianne Rosche', 'Cana',      '09186789012','10:00 AM – 6:00 PM',['Wed','Fri']],
    // Shortcut alias → same profile as Dr. Palaje
    ['D007','doctor@gmail.com',            'doctor123', 'Ruziel',          'Palaje',    '09181234567','8:00 AM – 5:00 PM', ['Mon','Wed','Fri']],
];
foreach ($doctorRows as $i => [$id,$email,$pass,$fn,$ln,$contact,$hours,$days]) {
    $uid    = addUser($pdo, $email, $pass, 'doctor');
    // D007 is the shortcut-alias duplicate of D001 — keep inactive so it
    // doesn't appear twice in the public doctor list or stat counts.
    $status = ($id === 'D007') ? 'inactive' : 'active';
    $avail  = ($id === 'D007') ? 0 : 1;
    $insD->execute([$id,$uid,$fn,$ln,'Optometrist',$contact,$avail,$hours,$status]);
    foreach ($days as $d) $insDD->execute([$id,$d]);
}
log_msg('Doctors seeded (D001–D007).');

// ── Patients ─────────────────────────────────────────────────────
$insP = $pdo->prepare(
    'INSERT INTO patients
     (id,user_id,first_name,last_name,gender,dob,age,contact,address,
      occupation,
      qr_data,registered_date,last_visit,status)
     VALUES (?,?,?,?,?,?,?,?,?,?,?,?,?,?)'
);

$patRows = [
 ['P001','maria.santos@email.com',    'patient123','Maria',    'Santos',    'Female','1990-03-15',35,'09171234567','123 Rizal St, Bacoor, Cavite',          'O+','Accountant',
  'Hypertension (controlled, on medication). No known drug allergies.',
  'Myopia diagnosed at age 12. First prescription glasses at 14. Annual check-ups since 2018.',
  '2024-01-15','2025-12-10','active'],
 ['P002','jose.reyes@email.com',      'patient456','Jose',     'Reyes',     'Male',  '1985-07-22',40,'09182345678','45 Mabini Ave, Imus, Cavite',            'A+','Civil Engineer',
  'Mild allergic rhinitis. No other significant medical history.',
  'First corrective lenses prescribed in 2024. Mild hyperopia.',
  '2024-03-10','2025-11-05','active'],
 ['P003','ana.garcia@email.com',      'patient789','Ana',      'Garcia',    'Female','1998-11-03',27,'09193456789','78 Luna St, Dasmariñas, Cavite',         'B+','Nursing Student',
  'No significant medical history. No known drug allergies.',
  'Astigmatism noted during school eye exam in 2022.',
  '2024-06-20','2025-10-15','active'],
 ['P004','carlo.mendoza@email.com',   'patient000','Carlo',    'Mendoza',   'Male',  '1978-05-30',47,'09204567890','22 Aguinaldo Hwy, General Trias, Cavite','O-','Businessman',
  'Type 2 Diabetes Mellitus (managed). Mild hypertension.',
  'Presbyopia onset at age 45. Progressive multifocal lenses prescribed in 2024.',
  '2023-09-01','2026-01-20','active'],
 ['P005','rosa.delacruz@email.com',   'patient111','Rosa',     'Dela Cruz', 'Female','2002-02-14',24,'09215678901','10 Rizal Ave, Tagaytay, Cavite',         'AB+','Registered Nurse',
  'No known allergies. No chronic conditions.',
  'No prior optical history. First visit for routine eye screening.',
  '2026-02-10',null,'active'],
 ['P006','ben.torres@email.com',      'patient222','Benjamin', 'Torres',    'Male',  '1972-09-08',53,'09226789012','55 Bonifacio St, Trece Martires, Cavite','A-','Retired',
  'Hypertension (on medication). Family history of primary open-angle glaucoma.',
  'No corrective lenses prior to 2025. IOP concern flagged in September 2025.',
  '2023-04-15','2025-09-03','inactive'],
 ['P007','angela.lim@email.com',      'patient007','Angela',   'Lim',       'Female','1996-04-12',29,'09237890123','8 Magsaysay St, Bacoor, Cavite',         'B+','Graphic Designer',
  'No known allergies.','Myopia diagnosed at age 16. Regular check-ups since 2022.',
  '2024-08-10','2026-03-28','active'],
 ['P008','ricardo.bautista@email.com','patient008','Ricardo',  'Bautista',  'Male',  '1963-11-20',61,'09248901234','34 Imus Blvd, Imus, Cavite',             'O+','Retired Teacher',
  'Hypertension (controlled). Type 2 Diabetes (managed).',
  'Presbyopia with early cataract changes. Annual monitoring since 2023.',
  '2023-11-05','2026-03-25','active'],
 ['P009','patricia.navarro@email.com','patient009','Patricia', 'Navarro',   'Female','2004-01-08',22,'09259012345','12 Aguinaldo Hwy, Dasmariñas, Cavite',   'A-','College Student',
  'No known medical conditions.','First optical exam in 2025. Mild myopia detected.',
  '2025-06-15','2026-03-22','active'],
 ['P010','miguel.flores@email.com',   'patient010','Miguel',   'Flores',    'Male',  '1977-07-03',48,'09260123456','67 Cavite St, General Trias, Cavite',    'AB-','Civil Servant',
  'Mild hypertension. No drug allergies.',
  'Astigmatism diagnosed 2020. Progressive lenses since 2024.',
  '2024-02-20','2026-03-20','active'],
 ['P011','sofia.ramos@email.com',     'patient011','Sofia',    'Ramos',     'Female','2009-03-25',17,'09271234567','19 Bonifacio Ave, Bacoor, Cavite',        'O-','High School Student',
  'No known medical conditions.','Myopia first noted during school check-up 2024.',
  '2025-09-01','2026-03-18','active'],
 ['P012','daniel.aquino@email.com',   'patient012','Daniel',   'Aquino',    'Male',  '1971-05-14',55,'09282345678','28 Rizal St, Trece Martires, Cavite',    'B-','Engineer',
  'Hyperlipidemia. No allergies.','Presbyopia onset 2019. Bifocal lenses currently in use.',
  '2023-07-18','2026-03-15','active'],
 ['P013','catherine.deleon@email.com','patient013','Catherine','De Leon',   'Female','1988-09-30',38,'09293456789','5 Luna Ave, Imus, Cavite',               'A+','Nurse',
  'No chronic conditions. No known allergies.',
  'Myopia with astigmatism diagnosed 2019. Contact lens user since 2021.',
  '2024-05-10','2026-03-12','active'],
 ['P014','marco.villanueva@email.com','patient014','Marco',    'Villanueva','Male',  '1984-12-07',42,'09304567890','41 Emilio Aguinaldo Hwy, Bacoor, Cavite','O+','Architect',
  'No significant medical history.','Hyperopia noted 2018. Reading glasses prescribed 2022.',
  '2024-01-22','2026-03-10','active'],
 ['P015','jasmine.cruz@email.com',    'patient015','Jasmine',  'Cruz',      'Female','2000-06-18',26,'09315678901','7 Padre Burgos St, Dasmariñas, Cavite',  'AB+','Marketing Associate',
  'No known conditions.','First optical consultation March 2025. Mild myopia.',
  '2025-03-05','2026-03-08','active'],
 ['P016','eduardo.santiago@email.com','patient016','Eduardo',  'Santiago',  'Male',  '1959-02-11',67,'09326789012','100 Sampaloc St, General Trias, Cavite', 'A+','Retired',
  'Hypertension, Diabetes Type 2, history of mild stroke (2020).',
  'Presbyopia and early macular changes. Bi-annual monitoring.',
  '2023-06-12','2026-03-05','active'],
 ['P017','rachel.tan@email.com',      'patient017','Rachel',   'Tan',       'Female','1995-08-22',31,'09337890123','23 Magsaysay Blvd, Imus, Cavite',        'B+','Software Developer',
  'No chronic conditions. Mild anxiety (managed).',
  'High myopia since childhood. Annual checks since 2018.',
  '2024-10-08','2026-03-03','active'],
 ['P018','vincent.gonzales@email.com','patient018','Vincent',  'Gonzales',  'Male',  '1982-10-15',44,'09348901234','56 Aguinaldo Hwy, Bacoor, Cavite',       'O-','Sales Manager',
  'No known allergies. Mild hypertension.',
  'Astigmatism with presbyopia onset 2023.',
  '2023-12-20','2026-02-28','active'],
 ['P019','isabella.cruz@email.com',   'patient019','Isabella', 'Cruz',      'Female','2007-04-03',19,'09359012345','14 Luna St, Dasmariñas, Cavite',         'A+','College Student',
  'No known medical conditions.','First optical exam. Referred by school physician.',
  '2026-04-11','2026-04-11','active'],
 ['P020','gabriel.villanueva@email.com','patient020','Gabriel','Villanueva','Male',  '1989-01-30',37,'09360123456','88 Rizal Ave, Bacoor, Cavite',           'B+','Physical Therapist',
  'No known conditions.','Walk-in new patient. First optical examination.',
  '2026-04-14','2026-04-14','active'],
 ['P021','christine.morales@email.com','patient021','Christine','Morales',  'Female','1976-07-19',50,'09371234567','33 Del Pilar St, Imus, Cavite',          'AB-','Accountant',
  'Hypothyroidism (medicated). No allergies.',
  'Progressive myopia and dry eye syndrome since 2020.',
  '2023-09-14','2026-02-25','active'],
 ['P022','anthony.reyes@email.com',   'patient022','Anthony',  'Reyes',     'Male',  '1968-03-28',58,'09382345678','77 Burgos St, Bacoor, Cavite',           'O+','Business Owner',
  'Controlled hypertension. No known allergies.',
  'Presbyopia with cataracts (early stage). Referred to ophthalmologist.',
  '2023-02-10','2026-02-20','inactive'],
 ['P023','nicole.fernandez@email.com','patient023','Nicole',   'Fernandez', 'Female','2002-11-05',24,'09393456789','9 Mabini St, Dasmariñas, Cavite',        'A-','Administrative Assistant',
  'No significant medical history.',
  'Mild myopia. First glasses prescribed July 2025.',
  '2025-07-22','2026-02-15','active'],
 ['P024','luis.pascual@email.com',    'patient024','Luis',     'Pascual',   'Male',  '1956-08-16',70,'09404567890','50 Padre Burgos Ave, Trece Martires',    'B+','Retired',
  'Glaucoma (medicated, stable). Hypertension. Diabetes Type 2.',
  'Long-standing glaucoma management. Low vision assessment 2024.',
  '2023-01-30','2026-02-10','active'],
 ['P025','samantha.delarosa@email.com','patient025','Samantha','Dela Rosa', 'Female','1994-12-01',32,'09415678901','16 Emilio Aguinaldo Hwy, Imus, Cavite',  'O+','Teacher',
  'No chronic conditions. Seasonal allergies.',
  'Myopia with astigmatism. Progressive lenses since 2024.',
  '2024-07-05','2026-02-05','active'],
];

foreach ($patRows as $r) {
    // The blood-type and medical/optical-history positions (right after
    // $address and $occ respectively) are intentionally skipped —
    // patients no longer has blood_type/medical_history/optical_history
    // columns, but the row literals above weren't rewritten to drop those
    // fields (26 rows of hand-formatted seed data isn't worth the churn
    // just to delete already-unused strings), so they're destructured and
    // discarded here.
    [$pid,$email,$pass,$fn,$ln,$gender,$dob,$age,$contact,$address,,$occ,,,$regDate,$lastVisit,$status] = $r;
    $uid = addUser($pdo, $email, $pass, 'patient');
    $qr  = 'CANA-' . $pid . '-' . strtoupper($fn . $ln);
    $insP->execute([$pid,$uid,$fn,$ln,$gender,$dob,$age,$contact,$address,$occ,$qr,$regDate,$lastVisit,$status]);
}

// Shortcut alias — maps to Maria Santos (P001)
$aliasUid = addUser($pdo, 'patient@gmail.com', 'patient123', 'patient');
$insP->execute(['P026',$aliasUid,'Maria','Santos','Female','1990-03-15',35,'09171234567',
    '123 Rizal St, Bacoor, Cavite','Accountant',
    'CANA-P026-MARIASANTOS',date('Y-m-d'),null,'active']);

log_msg('Patients seeded (P001–P026).');

// ── Clinic Services ───────────────────────────────────────────────
// [name, description, icon, bookable, patientVisible] — the last two:
// `bookable` = offered as a selectable appointment type at all;
// `patientVisible` = patients themselves can see/pick it (both on the
// public Services page and their own booking wizard) as opposed to
// staff/admin-only. See clinic_services' own column comments (schema.sql).
// No per-service duration — every appointment runs on the one clinic-wide
// interval (clinic_settings.default_duration).
$svcRows = [
    // Main bookable services — offered to patients and staff alike, both
    // as an appointment type and on the public Services page.
    ['Comprehensive Eye Examination',  'A thorough assessment of overall eye health and visual acuity, including refraction and internal/external eye evaluation.', 'eye',      1,1],
    ['Optical Frame Selection',        'Assisting patients in choosing frames that fit properly and suit their preferences.',                                       'archive',  1,1],
    ['Eyeglass/Contact Lens Fitting',  'Fitting and adjustment of eyeglasses or contact lenses for proper alignment, comfort, and visual clarity.',                 'award',    1,1],
    // Staff-only bookable — never shown to patients (booking wizard or
    // public site), but selectable by staff/admin booking a follow-up on
    // a patient's behalf. Name intentionally kept exactly as-is — depended
    // on by pages.js's appointmentWizardHtml() and the doctor's exam
    // wizard follow-up flow.
    ['Follow-up Consultation',         "Subsequent visits to review the patient's vision condition and assess any changes after treatment or prescription.",        'refresh-cw',1,0],
    // Display-only — listed on the public Services page for information,
    // never a selectable appointment type for anyone.
    ['Eye Refraction (Manual and Autorefraction)', 'Determines the correct lens power needed to improve vision, using both manual retinoscopy and computerized autorefraction.', 'search',    0,1],
    ['Spot Vision Screening',          'A quick, portable screening to detect possible vision problems that may need further examination.',                        'activity',  0,1],
    ['Ishihara Test (Color Blindness Test)', 'A color vision test using specially designed plates to detect red-green color blindness.',                            'file-text', 0,1],
    ['Dispensing of Eyeglasses',       'Preparation and release of finished eyeglasses to the patient, including fit verification.',                               'package',   0,1],
    ['Slit Lamp Examination',          'A detailed examination of the front structures of the eye using a specialized microscope with an intense light source.',    'settings',  0,1],
    ['Tonometry Test',                 'Measures intraocular pressure to help screen for glaucoma.',                                                                'alert-circle',0,1],
];
$insSvc = $pdo->prepare('INSERT INTO clinic_services (name,description,status,icon,bookable,patient_visible) VALUES (?,?,?,?,?,?)');
foreach ($svcRows as [$name,$desc,$icon,$bookable,$patientVisible]) {
    $insSvc->execute([$name,$desc,'active',$icon,$bookable,$patientVisible]);
}
log_msg('Clinic services seeded.');

// ── Clinic Settings (single row) ────────────────────────────────────
$pdo->prepare(
    'INSERT IGNORE INTO clinic_settings (id, name, tagline, address, phone, email, hours, tin_no, phic_no)
     VALUES (1, ?, ?, ?, ?, ?, ?, ?, ?)'
)->execute([
    'Cana Optical Clinic',
    'Clear Vision. Compassionate Care.',
    'Unit 3 Paseo de Carmona, Brgy. Maduya, Carmona, Cavite',
    '0929 663 6080',
    'canaopticalclinic@gmail.com',
    'Monday – Saturday: 9:00 AM – 5:00 PM',
    '123-456-789-000',
    '01-123456789-0',
]);
log_msg('Clinic settings seeded.');

// ── Archived Records ──────────────────────────────────────────────
$arcRows = [
    ['AR001','Patient',    'Elena Villanueva',       'P008', 'Roberto Cruz','Duplicate patient record',          'Apr 14, 2026'],
    ['AR002','Appointment','A006 — Benjamin Torres',  'A006', 'Roberto Cruz','Test appointment created by mistake','Apr 13, 2026'],
    ['AR003','Account',    'Staff: Juan Dela Cruz',   'U012', 'Roberto Cruz','Employee resigned',                 'Apr 10, 2026'],
    ['AR004','Appointment','A022 — Rosa Dela Cruz',   'A022', 'Roberto Cruz','Patient requested removal',          'Apr 8, 2026'],
    ['AR005','Patient',    'Miguel Reyes',            'P015', 'Roberto Cruz','Inactive for over 2 years',         'Mar 28, 2026'],
];
$insArc = $pdo->prepare('INSERT INTO archived_records (id,type,name,ref_id,archived_by,reason,date) VALUES (?,?,?,?,?,?,?)');
foreach ($arcRows as $r) $insArc->execute($r);
log_msg('Archived records seeded.');

$totalUsers = (int)$pdo->query('SELECT COUNT(*) FROM users')->fetchColumn();
log_msg("Done! Total users in DB: $totalUsers");

if (!$isCLI) {
    echo "<p style='color:green;font-weight:bold'>✓ Database seeded successfully.</p>";
    echo "<p><a href='../index.html'>→ Go to Cana Optical Clinic</a></p></body></html>";
}
