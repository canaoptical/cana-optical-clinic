-- ================================================================
--  CANAOPTICALCLINIC — database/schema.sql
--  Full DDL for all tables.
--  Step 1: Create the database first:
--    CREATE DATABASE canaopticalclinic_db CHARACTER SET utf8mb4 COLLATE utf8mb4_unicode_ci;
--  Step 2: Run this file in phpMyAdmin or MySQL CLI:
--    mysql -u root canaopticalclinic_db < schema.sql
--  Step 3: Run seed.php to populate data.
--
--  If upgrading an existing database, run these once in phpMyAdmin:
--    ALTER TABLE `users` ADD COLUMN `last_login_at` DATETIME NULL DEFAULT NULL AFTER `is_active`;
--    ALTER TABLE `users` ADD COLUMN `photo_url` VARCHAR(255) NULL DEFAULT NULL AFTER `last_login_at`;
--    ALTER TABLE `users` ADD COLUMN `failed_attempts` TINYINT UNSIGNED NOT NULL DEFAULT 0 AFTER `photo_url`;
--    ALTER TABLE `users` ADD COLUMN `locked_until` DATETIME NULL DEFAULT NULL AFTER `failed_attempts`;
--    ALTER TABLE `archived_records` MODIFY `id` VARCHAR(20) NOT NULL;
--    ALTER TABLE `archived_records` ADD COLUMN `data_json` TEXT NULL DEFAULT NULL AFTER `reason`;
--    ALTER TABLE `patients` ADD COLUMN `archived_at` DATETIME NULL DEFAULT NULL;
--    ALTER TABLE `doctors`  ADD COLUMN `archived_at` DATETIME NULL DEFAULT NULL;
--    ALTER TABLE `staff`    ADD COLUMN `archived_at` DATETIME NULL DEFAULT NULL;
--    ALTER TABLE `admins`   ADD COLUMN `archived_at` DATETIME NULL DEFAULT NULL;
--    CREATE TABLE IF NOT EXISTS `qr_scan_log` (
--      `id`         INT UNSIGNED NOT NULL AUTO_INCREMENT,
--      `scanned_by` INT UNSIGNED NULL,
--      `patient_id` VARCHAR(10)  NULL,
--      `found`      TINYINT(1)   NOT NULL DEFAULT 0,
--      `scanned_at` TIMESTAMP    NOT NULL DEFAULT CURRENT_TIMESTAMP,
--      PRIMARY KEY (`id`),
--      FOREIGN KEY (`scanned_by`) REFERENCES `users`(`id`) ON DELETE SET NULL
--    ) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_unicode_ci;
--    CREATE TABLE IF NOT EXISTS `contact_messages` (
--      `id`         INT UNSIGNED NOT NULL AUTO_INCREMENT,
--      `name`       VARCHAR(150) NOT NULL,
--      `email`      VARCHAR(150) NOT NULL,
--      `service`    VARCHAR(100) NULL,
--      `message`    TEXT         NOT NULL,
--      `is_read`    TINYINT(1)   NOT NULL DEFAULT 0,
--      `created_at` DATETIME     NOT NULL DEFAULT CURRENT_TIMESTAMP,
--      PRIMARY KEY (`id`),
--      INDEX `idx_read` (`is_read`)
--    ) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_unicode_ci;
--    ALTER TABLE `contact_messages` ADD COLUMN `reply` TEXT NULL DEFAULT NULL;
--    ALTER TABLE `contact_messages` ADD COLUMN `replied_by` VARCHAR(150) NULL DEFAULT NULL;
--    ALTER TABLE `contact_messages` ADD COLUMN `replied_at` DATETIME NULL DEFAULT NULL;
--    ALTER TABLE `contact_messages` ADD INDEX `idx_email` (`email`);
--    ALTER TABLE `contact_messages` ADD COLUMN `archived_at` DATETIME NULL DEFAULT NULL;
--    ALTER TABLE `clinic_settings` DROP COLUMN IF EXISTS `logo_name`;
--    ALTER TABLE `clinic_settings` ADD COLUMN `logo_url` VARCHAR(255) NULL DEFAULT NULL AFTER `phic_no`;
--    ALTER TABLE `clinic_settings` ADD COLUMN `hero_url` VARCHAR(255) NULL DEFAULT NULL AFTER `logo_url`;
--    ALTER TABLE `clinic_settings` ADD COLUMN `map_lat` DECIMAL(10,7) NULL DEFAULT NULL AFTER `hero_url`;
--    ALTER TABLE `clinic_settings` ADD COLUMN `map_lng` DECIMAL(10,7) NULL DEFAULT NULL AFTER `map_lat`;
--    CREATE TABLE IF NOT EXISTS `sessions` (
--      `id`          VARCHAR(128) NOT NULL,
--      `data`        MEDIUMTEXT   NOT NULL,
--      `last_access` INT UNSIGNED NOT NULL DEFAULT 0,
--      PRIMARY KEY (`id`)
--    ) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_unicode_ci;
--    CREATE TABLE IF NOT EXISTS `password_resets` (
--      `id`         INT UNSIGNED NOT NULL AUTO_INCREMENT,
--      `email`      VARCHAR(255) NOT NULL,
--      `otp`        VARCHAR(6)   NOT NULL,
--      `token`      VARCHAR(64)  NULL DEFAULT NULL,
--      `used`       TINYINT(1)   NOT NULL DEFAULT 0,
--      `expires_at` DATETIME     NOT NULL,
--      `created_at` TIMESTAMP    NOT NULL DEFAULT CURRENT_TIMESTAMP,
--      PRIMARY KEY (`id`),
--      INDEX `idx_email_otp` (`email`, `otp`),
--      INDEX `idx_token` (`token`)
--    ) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_unicode_ci;
--    CREATE TABLE IF NOT EXISTS `blocked_dates` (
--      `id`         INT UNSIGNED NOT NULL AUTO_INCREMENT,
--      `doctor_id`  VARCHAR(10)  NOT NULL,
--      `date`       DATE         NOT NULL,
--      `reason`     VARCHAR(255) DEFAULT NULL,
--      `created_by` VARCHAR(100) DEFAULT NULL,
--      `created_at` DATETIME     NOT NULL DEFAULT CURRENT_TIMESTAMP,
--      PRIMARY KEY (`id`),
--      UNIQUE KEY `uq_doctor_date` (`doctor_id`, `date`),
--      FOREIGN KEY (`doctor_id`) REFERENCES `doctors`(`id`) ON DELETE CASCADE
--    ) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_unicode_ci;
--    ALTER TABLE `doctors` ADD COLUMN `prc_license` VARCHAR(50) NULL DEFAULT NULL AFTER `specialization`;
--    ALTER TABLE `patients` ADD COLUMN `middle_name` VARCHAR(100) NULL DEFAULT NULL AFTER `first_name`;
--    ALTER TABLE `doctors` ADD COLUMN `middle_name` VARCHAR(100) NULL DEFAULT NULL AFTER `first_name`;
--    ALTER TABLE `staff` ADD COLUMN `middle_name` VARCHAR(100) NULL DEFAULT NULL AFTER `first_name`;
--    ALTER TABLE `admins` ADD COLUMN `middle_name` VARCHAR(100) NULL DEFAULT NULL AFTER `first_name`;
--    ALTER TABLE `pending_registrations` ADD COLUMN `middle_name` VARCHAR(100) NULL DEFAULT NULL AFTER `first_name`;
--    ALTER TABLE `activity_log` ADD COLUMN `ip_address` VARCHAR(45) NULL DEFAULT NULL AFTER `type`;
--    ALTER TABLE `appointments` ADD COLUMN `terms_agreed` TINYINT(1) NOT NULL DEFAULT 0 AFTER `reschedule_request`;
--    ALTER TABLE `patients` ADD COLUMN `no_show_count` INT UNSIGNED NOT NULL DEFAULT 0 AFTER `status`;
--    ALTER TABLE `patients` ADD COLUMN `booking_restricted` TINYINT(1) NOT NULL DEFAULT 0 AFTER `no_show_count`;
--    ALTER TABLE `appointments` ADD COLUMN `reminder_sent_at` DATETIME NULL DEFAULT NULL AFTER `terms_agreed`;
--    ALTER TABLE `appointments` ADD COLUMN `confirmed_at` DATETIME NULL DEFAULT NULL AFTER `reminder_sent_at`;
--    ALTER TABLE `appointments` ADD COLUMN `rescheduled_at` DATETIME NULL DEFAULT NULL AFTER `confirmed_at`;
--    ALTER TABLE `notifications` ADD COLUMN `related_id` VARCHAR(10) NULL DEFAULT NULL AFTER `body`;
--    CREATE TABLE IF NOT EXISTS `appointment_waitlist` (
--      `id`               INT UNSIGNED NOT NULL AUTO_INCREMENT,
--      `patient_id`       VARCHAR(10)  NOT NULL,
--      `patient_name`     VARCHAR(200) DEFAULT NULL,
--      `doctor_id`        VARCHAR(10)  NOT NULL,
--      `doctor_name`      VARCHAR(200) DEFAULT NULL,
--      `date`             DATE         NOT NULL,
--      `time`             VARCHAR(20)  NOT NULL,
--      `type`             VARCHAR(100) DEFAULT NULL,
--      `terms_agreed`     TINYINT(1)   NOT NULL DEFAULT 0,
--      `status`           ENUM('waiting','offered','claimed','expired','declined','cancelled') NOT NULL DEFAULT 'waiting',
--      `offered_at`       DATETIME     NULL DEFAULT NULL,
--      `offer_expires_at` DATETIME     NULL DEFAULT NULL,
--      `created_at`       DATETIME     NOT NULL DEFAULT CURRENT_TIMESTAMP,
--      PRIMARY KEY (`id`),
--      INDEX `idx_slot` (`doctor_id`, `date`, `time`, `status`),
--      FOREIGN KEY (`patient_id`) REFERENCES `patients`(`id`) ON DELETE CASCADE
--    ) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_unicode_ci;
-- ================================================================

SET NAMES utf8mb4;
SET FOREIGN_KEY_CHECKS = 0;

-- ── Users (central authentication table) ─────────────────────────
CREATE TABLE IF NOT EXISTS `users` (
  `id`            INT UNSIGNED     NOT NULL AUTO_INCREMENT,
  `email`         VARCHAR(255)     NOT NULL,
  `password_hash` VARCHAR(255)     NOT NULL,
  -- Role of whoever last actually changed this account's password (not
  -- necessarily this row's own `role` — an admin/staff resetting a
  -- PATIENT's password records 'admin'/'staff' here, not 'patient'). NULL
  -- until the password has ever been changed away from its initial value.
  -- Lets the "Temporary Password" check in Edit Patient say who changed it
  -- instead of assuming it was always the patient.
  `password_changed_by` ENUM('admin','staff','doctor','patient') NULL DEFAULT NULL,
  `role`          ENUM('admin','staff','doctor','patient') NOT NULL,
  `is_active`     TINYINT(1)       NOT NULL DEFAULT 1,
  `last_login_at` DATETIME         NULL     DEFAULT NULL,
  `photo_url`     VARCHAR(255)     NULL     DEFAULT NULL,
  `failed_attempts`  TINYINT UNSIGNED NOT NULL DEFAULT 0,
  `locked_until`     DATETIME         NULL     DEFAULT NULL,
  `email_verified`   TINYINT(1)       NOT NULL DEFAULT 1,
  `created_at`       TIMESTAMP        NOT NULL DEFAULT CURRENT_TIMESTAMP,
  PRIMARY KEY (`id`),
  UNIQUE KEY `uq_email` (`email`)
) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_unicode_ci;

-- ── Admins ───────────────────────────────────────────────────────
CREATE TABLE IF NOT EXISTS `admins` (
  `id`          VARCHAR(10)  NOT NULL,
  `user_id`     INT UNSIGNED NULL,
  `first_name`  VARCHAR(100) NOT NULL,
  `middle_name` VARCHAR(100) NULL DEFAULT NULL,
  `last_name`   VARCHAR(100) NOT NULL,
  `contact`     VARCHAR(20)  DEFAULT NULL,
  `status`      ENUM('active','inactive') NOT NULL DEFAULT 'active',
  `archived_at` DATETIME     NULL DEFAULT NULL,
  PRIMARY KEY (`id`),
  UNIQUE KEY `uq_admin_user` (`user_id`),
  FOREIGN KEY (`user_id`) REFERENCES `users`(`id`) ON DELETE SET NULL
) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_unicode_ci;

-- ── Staff ────────────────────────────────────────────────────────
CREATE TABLE IF NOT EXISTS `staff` (
  `id`          VARCHAR(10)  NOT NULL,
  `user_id`     INT UNSIGNED NULL,
  `first_name`  VARCHAR(100) NOT NULL,
  `middle_name` VARCHAR(100) NULL DEFAULT NULL,
  `last_name`   VARCHAR(100) NOT NULL,
  `contact`     VARCHAR(20)  DEFAULT NULL,
  `status`      ENUM('active','inactive') NOT NULL DEFAULT 'active',
  `archived_at` DATETIME     NULL DEFAULT NULL,
  PRIMARY KEY (`id`),
  UNIQUE KEY `uq_staff_user` (`user_id`),
  FOREIGN KEY (`user_id`) REFERENCES `users`(`id`) ON DELETE SET NULL
) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_unicode_ci;

-- ── Doctors ──────────────────────────────────────────────────────
CREATE TABLE IF NOT EXISTS `doctors` (
  `id`             VARCHAR(10)  NOT NULL,
  `user_id`        INT UNSIGNED NULL,
  `first_name`     VARCHAR(100) NOT NULL,
  `middle_name`    VARCHAR(100) NULL DEFAULT NULL,
  `last_name`      VARCHAR(100) NOT NULL,
  `specialization` VARCHAR(100) NOT NULL DEFAULT 'Optometrist',
  `degree`         VARCHAR(30)  NOT NULL DEFAULT 'OD',
  `prc_license`    VARCHAR(50)  NULL DEFAULT NULL,
  -- A second, optional credential some doctors hold beyond their base
  -- optometrist license (e.g. "Ocular Pharmacologist" with its own PRC
  -- accreditation number) — printed as an extra line on the Ophthalmic
  -- Clearance certificate only when both are on file; blank for doctors
  -- who don't have one, never inferred or hardcoded.
  `secondary_credential` VARCHAR(100) NULL DEFAULT NULL,
  `secondary_prc`  VARCHAR(50)  NULL DEFAULT NULL,
  `contact`        VARCHAR(20)  DEFAULT NULL,
  `available`      TINYINT(1)   NOT NULL DEFAULT 1,
  `work_hours`     VARCHAR(100) DEFAULT NULL,
  `sort_order`     SMALLINT UNSIGNED NOT NULL DEFAULT 0,
  `status`         ENUM('active','inactive') NOT NULL DEFAULT 'active',
  `archived_at`    DATETIME     NULL DEFAULT NULL,
  PRIMARY KEY (`id`),
  UNIQUE KEY `uq_doctor_user` (`user_id`),
  FOREIGN KEY (`user_id`) REFERENCES `users`(`id`) ON DELETE SET NULL
) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_unicode_ci;

-- ── Doctor schedule days ──────────────────────────────────────────
CREATE TABLE IF NOT EXISTS `doctor_days` (
  `doctor_id`   VARCHAR(10)  NOT NULL,
  `day_of_week` ENUM('Mon','Tue','Wed','Thu','Fri','Sat','Sun') NOT NULL,
  PRIMARY KEY (`doctor_id`, `day_of_week`),
  FOREIGN KEY (`doctor_id`) REFERENCES `doctors`(`id`) ON DELETE CASCADE
) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_unicode_ci;

-- ── Doctor blocked dates (one-off unavailability — leave, conference,
--    holiday, etc. — distinct from the recurring weekly schedule above) ──
CREATE TABLE IF NOT EXISTS `blocked_dates` (
  `id`         INT UNSIGNED NOT NULL AUTO_INCREMENT,
  `doctor_id`  VARCHAR(10)  NOT NULL,
  `date`       DATE         NOT NULL,
  `reason`     VARCHAR(255) DEFAULT NULL,
  `created_by` VARCHAR(100) DEFAULT NULL,
  `created_at` DATETIME     NOT NULL DEFAULT CURRENT_TIMESTAMP,
  PRIMARY KEY (`id`),
  UNIQUE KEY `uq_doctor_date` (`doctor_id`, `date`),
  FOREIGN KEY (`doctor_id`) REFERENCES `doctors`(`id`) ON DELETE CASCADE
) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_unicode_ci;

-- ── Patients ─────────────────────────────────────────────────────
CREATE TABLE IF NOT EXISTS `patients` (
  `id`              VARCHAR(10)  NOT NULL,
  `user_id`         INT UNSIGNED NULL,
  `first_name`      VARCHAR(100) NOT NULL,
  `middle_name`     VARCHAR(100) NULL DEFAULT NULL,
  `last_name`       VARCHAR(100) NOT NULL,
  `gender`          ENUM('Male','Female','Other') NOT NULL,
  `dob`             DATE         NOT NULL,
  `age`             TINYINT UNSIGNED NOT NULL DEFAULT 0,
  `contact`         VARCHAR(20)  DEFAULT NULL,
  `address`         TEXT         DEFAULT NULL,
  `occupation`      VARCHAR(100) DEFAULT NULL,
  -- Free-text, self-reported or staff-recorded (conditions, allergies,
  -- ongoing medications, past eye surgeries, etc.) — surfaced read-only in
  -- the exam wizard's Patient Info step so the doctor has it in view while
  -- examining, regardless of the visit's service type.
  `medical_history` TEXT         DEFAULT NULL,
  `qr_data`         VARCHAR(150) DEFAULT NULL,
  `registered_date` DATE         DEFAULT NULL,
  `last_visit`      DATE         DEFAULT NULL,
  `status`          ENUM('active','inactive') NOT NULL DEFAULT 'active',
  `no_show_count`      INT UNSIGNED NOT NULL DEFAULT 0,
  `booking_restricted` TINYINT(1)   NOT NULL DEFAULT 0,
  -- Self-service "Request Account Deletion" (Settings > My Profile,
  -- patient role) — set when the patient submits a request, cleared the
  -- moment admin/staff either acts on it (archives the patient — see
  -- api/archive/create.php's Patient branch) or dismisses it. Requesting
  -- never deletes anything itself; it only notifies admin/staff and shows
  -- a pending state to the patient, same reasoning as the rest of this
  -- app's archive-before-permanent-delete flow.
  `deletion_requested_at`     DATETIME NULL DEFAULT NULL,
  `deletion_request_reason`   TEXT     NULL DEFAULT NULL,
  `archived_at`     DATETIME     NULL DEFAULT NULL,
  PRIMARY KEY (`id`),
  UNIQUE KEY `uq_patient_user` (`user_id`),
  FOREIGN KEY (`user_id`) REFERENCES `users`(`id`) ON DELETE SET NULL
) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_unicode_ci;

-- ── Appointments ─────────────────────────────────────────────────
CREATE TABLE IF NOT EXISTS `appointments` (
  `id`                   VARCHAR(10)  NOT NULL,
  `patient_id`           VARCHAR(10)  DEFAULT NULL,
  `patient_name`         VARCHAR(200) DEFAULT NULL,
  `doctor_id`            VARCHAR(10)  DEFAULT NULL,
  `doctor_name`          VARCHAR(200) DEFAULT NULL,
  `date`                 DATE         NOT NULL,
  `time`                 VARCHAR(20)  NOT NULL,
  `type`                 VARCHAR(100) DEFAULT NULL,
  `status`               ENUM('pending','approved','cancelled','disapproved','completed','no-show') NOT NULL DEFAULT 'pending',
  -- How this appointment came to exist — the patient booked it themselves
  -- (self-service, or claiming a waitlist offer) vs. admin/staff created it
  -- directly (walk-in, phone call, etc.). Set once at creation, never
  -- changed afterward — this is a record of how the visit was originally
  -- scheduled, not a live status.
  `source`               ENUM('online','walk-in') NOT NULL DEFAULT 'online',
  `notes`                TEXT         DEFAULT NULL,
  `cancellation_reason`  TEXT         DEFAULT NULL,
  `disapproval_reason`   TEXT         DEFAULT NULL,
  `reschedule_note`      TEXT         DEFAULT NULL,
  `reschedule_request`   TEXT         DEFAULT NULL,   -- JSON: {reason,preferredDate,requestedAt}
  `terms_agreed`         TINYINT(1)   NOT NULL DEFAULT 0, -- patient accepted the booking policy at request time
  `reminder_sent_at`     DATETIME     NULL DEFAULT NULL, -- day-before-noon reminder was sent
  `confirmed_at`         DATETIME     NULL DEFAULT NULL, -- patient confirmed attendance after the reminder
  `rescheduled_at`       DATETIME     NULL DEFAULT NULL, -- staff/admin last moved this appointment's date/time
  PRIMARY KEY (`id`),
  FOREIGN KEY (`patient_id`) REFERENCES `patients`(`id`) ON DELETE CASCADE,
  FOREIGN KEY (`doctor_id`)  REFERENCES `doctors`(`id`)  ON DELETE CASCADE
) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_unicode_ci;

-- ── Appointment Waitlist ─────────────────────────────────────────
-- One row per patient waiting for a specific doctor+date+time slot that
-- was full at request time. When that exact slot frees up, the oldest
-- 'waiting' row is offered it for a limited window before moving on to
-- the next patient in line.
CREATE TABLE IF NOT EXISTS `appointment_waitlist` (
  `id`               INT UNSIGNED NOT NULL AUTO_INCREMENT,
  `patient_id`       VARCHAR(10)  NOT NULL,
  `patient_name`     VARCHAR(200) DEFAULT NULL,
  `doctor_id`        VARCHAR(10)  NOT NULL,
  `doctor_name`      VARCHAR(200) DEFAULT NULL,
  `date`             DATE         NOT NULL,
  `time`             VARCHAR(20)  NOT NULL,
  `type`             VARCHAR(100) DEFAULT NULL,
  `terms_agreed`     TINYINT(1)   NOT NULL DEFAULT 0,
  `status`           ENUM('waiting','offered','claimed','expired','declined','cancelled') NOT NULL DEFAULT 'waiting',
  `offered_at`       DATETIME     NULL DEFAULT NULL,
  `offer_expires_at` DATETIME     NULL DEFAULT NULL,
  `created_at`       DATETIME     NOT NULL DEFAULT CURRENT_TIMESTAMP,
  PRIMARY KEY (`id`),
  INDEX `idx_slot` (`doctor_id`, `date`, `time`, `status`),
  FOREIGN KEY (`patient_id`) REFERENCES `patients`(`id`) ON DELETE CASCADE
) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_unicode_ci;

-- ── Consultations — the narrative of the visit ─────────────────────
-- Chief complaint / history / assessment / plan are the doctor's own
-- words about why the patient came in and what happens next. Must NOT
-- carry SPH/CYL/AXIS or any refraction data — that's examinations' job
-- (see the old `prescription` text-summary column this replaces, which
-- was a spec violation: a free-text "OD: ... / OS: ..." string).
CREATE TABLE IF NOT EXISTS `consultations` (
  `id`                       VARCHAR(10)  NOT NULL,
  `patient_id`               VARCHAR(10)  DEFAULT NULL,
  `doctor_id`                VARCHAR(10)  DEFAULT NULL,
  `exam_id`                  VARCHAR(10)  DEFAULT NULL,  -- the exam this visit led to, if any
  `date`                     DATE         NOT NULL,
  `type`                     VARCHAR(100) DEFAULT NULL,  -- appointment type (Eye Examination / Follow-up / Frame Fitting / Complaint)
  `chief_complaint`          TEXT         DEFAULT NULL,
  `history_present_illness`  TEXT         DEFAULT NULL,
  `assessment`               TEXT         DEFAULT NULL,  -- doctor's notes/reasoning
  `recommendation`           TEXT         DEFAULT NULL,  -- the plan — what happens next
  `follow_up_date`           DATE         DEFAULT NULL,
  `follow_up_time`           VARCHAR(10)  DEFAULT NULL,  -- e.g. "10:00 AM" — optional, only meaningful alongside follow_up_date
  `status`                   ENUM('completed','cancelled','no-show') NOT NULL DEFAULT 'completed',
  -- Set together with examinations.archived_at when the exam from the same
  -- visit is archived (Settings > Archives) — a consultation/prescription
  -- from an archived visit shouldn't keep showing on its own tab pointing
  -- at an exam that's no longer visible anywhere.
  `archived_at`              DATETIME     DEFAULT NULL,
  PRIMARY KEY (`id`),
  FOREIGN KEY (`patient_id`) REFERENCES `patients`(`id`) ON DELETE CASCADE,
  FOREIGN KEY (`doctor_id`)  REFERENCES `doctors`(`id`)  ON DELETE CASCADE
) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_unicode_ci;

-- ── Optical Examinations — the clinical measurements ───────────────
-- Must NOT carry lens type/material/coating, frame selection, or a
-- prescription-details narrative — those belong to the issued
-- prescription document (see `prescriptions` below), not the exam that
-- produced it.
CREATE TABLE IF NOT EXISTS `examinations` (
  `id`                   VARCHAR(10)  NOT NULL,
  `patient_id`           VARCHAR(10)  DEFAULT NULL,
  `doctor_id`            VARCHAR(10)  DEFAULT NULL,
  `consultation_id`      VARCHAR(10)  DEFAULT NULL,  -- the visit this exam was performed during
  `date`                 DATE         NOT NULL,
  -- Right eye (OD)
  `od_va_uncorrected` VARCHAR(10), `od_va_corrected` VARCHAR(10),
  `od_sph` VARCHAR(10), `od_cyl` VARCHAR(10), `od_axis` VARCHAR(10), `od_add` VARCHAR(10),
  -- Left eye (OS)
  `os_va_uncorrected` VARCHAR(10), `os_va_corrected` VARCHAR(10),
  `os_sph` VARCHAR(10), `os_cyl` VARCHAR(10), `os_axis` VARCHAR(10), `os_add` VARCHAR(10),
  -- Intraocular pressure & pupillary distance
  `iop_od`               VARCHAR(10)  DEFAULT NULL,
  `iop_os`               VARCHAR(10)  DEFAULT NULL,
  `pd`                   VARCHAR(20)  DEFAULT NULL,
  -- Clinical findings
  `external_findings`    TEXT         DEFAULT NULL,  -- lids, conjunctiva, cornea, pupils
  `diagnosis`            TEXT         DEFAULT NULL,
  `test_results`         TEXT         DEFAULT NULL,
  `remarks`              TEXT         DEFAULT NULL,  -- clinical remarks
  `status`               ENUM('pending','completed') NOT NULL DEFAULT 'completed',
  -- Soft-delete flag, same convention as patients/admins/staff/doctors —
  -- archiving an exam (Settings > Archives) sets this instead of deleting
  -- the row outright, and cascades to the linked consultation/prescription
  -- (their own archived_at) so a visit disappears from every tab together,
  -- not just Examination History. Permanent deletion (from Archives) still
  -- cascades the same way, but actually removes the rows.
  `archived_at`          DATETIME     DEFAULT NULL,
  PRIMARY KEY (`id`),
  FOREIGN KEY (`patient_id`) REFERENCES `patients`(`id`) ON DELETE CASCADE,
  FOREIGN KEY (`doctor_id`)  REFERENCES `doctors`(`id`)  ON DELETE CASCADE
) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_unicode_ci;

-- ── Prescriptions — the issued document ─────────────────────────────
-- A clean, printable, legally-standing document. Must NOT carry
-- uncorrected acuity, external findings, or the doctor's narrative notes
-- — those belong to the examination/consultation that led to it.
CREATE TABLE IF NOT EXISTS `prescriptions` (
  `id`           VARCHAR(10)  NOT NULL,
  `patient_id`   VARCHAR(10)  DEFAULT NULL,
  `doctor_id`    VARCHAR(10)  DEFAULT NULL,
  `exam_id`      VARCHAR(10)  DEFAULT NULL,  -- the exam this prescription was issued from
  `date`         DATE         NOT NULL,      -- issue date
  `expiry_date`  DATE         DEFAULT NULL,  -- issue date + 1 year
  `status`       ENUM('valid','expired','superseded') NOT NULL DEFAULT 'valid',
  `prc_license`  VARCHAR(50)  DEFAULT NULL,  -- snapshot of the issuing doctor's PRC license at issue time
  `od_sph`     VARCHAR(10), `od_cyl` VARCHAR(10), `od_axis` VARCHAR(10), `od_add` VARCHAR(10),
  `os_sph`     VARCHAR(10), `os_cyl` VARCHAR(10), `os_axis` VARCHAR(10), `os_add` VARCHAR(10),
  `pd`           VARCHAR(20)  DEFAULT NULL,
  `lens_type`     VARCHAR(100) DEFAULT NULL,
  `lens_material` VARCHAR(50)  DEFAULT NULL,  -- not in the spec's minimum field list, but real dispensing
  `frame_selection` TEXT       DEFAULT NULL,  -- data that would otherwise have nowhere to live once examinations sheds it
  `lens_coating` TEXT         DEFAULT NULL,  -- JSON array, same convention the old examinations.lens_coating used
  -- Dispensing (eyeglass/lens release + payment) — the wizard's own
  -- Dispensing step captured these in the DOM but never actually sent or
  -- saved them anywhere until now; only meaningful once a prescription is
  -- actually issued, so they live here rather than on examinations.
  `total_amount`   DECIMAL(10,2) DEFAULT NULL,
  `dispensed_date` DATE          DEFAULT NULL,
  `received_by`    VARCHAR(150)  DEFAULT NULL,
  -- Set together with examinations.archived_at when the exam it was issued
  -- from is archived — see the note on consultations.archived_at.
  `archived_at`    DATETIME      DEFAULT NULL,
  PRIMARY KEY (`id`),
  FOREIGN KEY (`patient_id`) REFERENCES `patients`(`id`) ON DELETE CASCADE,
  FOREIGN KEY (`doctor_id`)  REFERENCES `doctors`(`id`)  ON DELETE CASCADE
) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_unicode_ci;

-- ── Notifications ────────────────────────────────────────────────
CREATE TABLE IF NOT EXISTS `notifications` (
  `id`         INT UNSIGNED  NOT NULL AUTO_INCREMENT,
  `user_id`    INT UNSIGNED  NOT NULL,
  `type`       VARCHAR(50)   NOT NULL,
  `title`      VARCHAR(255)  NOT NULL,
  `body`       TEXT          NOT NULL,
  `related_id` VARCHAR(10)   NULL DEFAULT NULL, -- e.g. the appointment ID this notification is about, when there is one
  `is_read`    TINYINT(1)    NOT NULL DEFAULT 0,
  `created_at` DATETIME      NOT NULL DEFAULT CURRENT_TIMESTAMP,
  PRIMARY KEY (`id`),
  FOREIGN KEY (`user_id`) REFERENCES `users`(`id`) ON DELETE CASCADE,
  INDEX `idx_user_read` (`user_id`, `is_read`)
) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_unicode_ci;

-- ── Contact Messages (public contact-form submissions) ─────────────
CREATE TABLE IF NOT EXISTS `contact_messages` (
  `id`          INT UNSIGNED NOT NULL AUTO_INCREMENT,
  `name`        VARCHAR(150) NOT NULL,
  `email`       VARCHAR(150) NOT NULL,
  `service`     VARCHAR(100) NULL,
  `message`     TEXT         NOT NULL,
  `is_read`     TINYINT(1)   NOT NULL DEFAULT 0,
  `reply`       TEXT         NULL,
  `replied_by`  VARCHAR(150) NULL,
  `replied_at`  DATETIME     NULL,
  `archived_at` DATETIME     NULL,
  `created_at`  DATETIME     NOT NULL DEFAULT CURRENT_TIMESTAMP,
  PRIMARY KEY (`id`),
  INDEX `idx_read` (`is_read`),
  INDEX `idx_email` (`email`)
) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_unicode_ci;

-- ── Activity Log ─────────────────────────────────────────────────
CREATE TABLE IF NOT EXISTS `activity_log` (
  `id`        VARCHAR(20)  NOT NULL,
  `users_id`  INT UNSIGNED DEFAULT NULL,
  `user_name` VARCHAR(100) DEFAULT NULL,
  `role`      VARCHAR(20)  DEFAULT NULL,
  `action`    TEXT         DEFAULT NULL,
  `timestamp` DATETIME     DEFAULT NULL,
  `type`      VARCHAR(50)  DEFAULT NULL,
  `ip_address` VARCHAR(45) DEFAULT NULL,
  PRIMARY KEY (`id`),
  INDEX `idx_al_user` (`users_id`)
) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_unicode_ci;

-- ── QR Scan Log ──────────────────────────────────────────────────
CREATE TABLE IF NOT EXISTS `qr_scan_log` (
  `id`         INT UNSIGNED NOT NULL AUTO_INCREMENT,
  `scanned_by` INT UNSIGNED NULL,
  `patient_id` VARCHAR(10)  NULL,
  `found`      TINYINT(1)   NOT NULL DEFAULT 0,
  `scanned_at` TIMESTAMP    NOT NULL DEFAULT CURRENT_TIMESTAMP,
  PRIMARY KEY (`id`),
  FOREIGN KEY (`scanned_by`) REFERENCES `users`(`id`) ON DELETE SET NULL
) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_unicode_ci;

-- ── Clinic Services ──────────────────────────────────────────────
-- No per-service `duration` column — every appointment slot runs on the
-- one clinic-wide interval (clinic_settings.default_duration, e.g. "45
-- min"), so a separate duration per service would just be redundant data
-- that can never actually differ from it in practice.
CREATE TABLE IF NOT EXISTS `clinic_services` (
  `id`              INT UNSIGNED NOT NULL AUTO_INCREMENT,
  `name`            VARCHAR(100) NOT NULL,
  `description`     TEXT         DEFAULT NULL,
  `status`          ENUM('active','inactive') NOT NULL DEFAULT 'active',
  `icon`            VARCHAR(50)  DEFAULT NULL,
  `sort_order`      SMALLINT UNSIGNED NOT NULL DEFAULT 0,
  -- Independent of `status` (which is an on/off switch for the whole
  -- service everywhere): `bookable` controls whether it's offered as a
  -- selectable appointment TYPE at all; `patient_visible` controls whether
  -- PATIENTS specifically can see/pick it — both on the public Services
  -- page and in their own self-booking wizard. Staff/admin booking on a
  -- patient's behalf always sees every bookable service regardless of
  -- patient_visible (e.g. Follow-up Consultation: bookable=1,
  -- patient_visible=0 — staff-only, invisible to patients and off the
  -- public site; a display-only service like Slit Lamp Examination is the
  -- opposite: bookable=0, patient_visible=1 — listed publicly, never a
  -- pickable appointment type for anyone).
  `bookable`        TINYINT(1)   NOT NULL DEFAULT 1,
  `patient_visible` TINYINT(1)   NOT NULL DEFAULT 1,
  PRIMARY KEY (`id`)
) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_unicode_ci;

-- ── Clinic Settings (single row, id always 1 — info + consultation rules) ──
CREATE TABLE IF NOT EXISTS `clinic_settings` (
  `id`                            TINYINT UNSIGNED NOT NULL,
  `name`                          VARCHAR(150) NOT NULL DEFAULT 'Cana Optical Clinic',
  `tagline`                       VARCHAR(255) NULL DEFAULT NULL,
  `address`                       VARCHAR(255) NULL DEFAULT NULL,
  `phone`                         VARCHAR(30)  NULL DEFAULT NULL,
  `email`                         VARCHAR(150) NULL DEFAULT NULL,
  `hours`                         VARCHAR(150) NULL DEFAULT NULL,
  `tin_no`                        VARCHAR(50)  NULL DEFAULT NULL,
  `phic_no`                       VARCHAR(50)  NULL DEFAULT NULL,
  `logo_url`                      VARCHAR(255) NULL DEFAULT NULL,
  `default_duration`              VARCHAR(20)  NOT NULL DEFAULT '45 min',
  `max_advance_booking`           VARCHAR(20)  NOT NULL DEFAULT '3 months',
  `min_advance_booking`           VARCHAR(20)  NOT NULL DEFAULT '1 day',
  `max_appts_per_doctor_per_day`  SMALLINT UNSIGNED NOT NULL DEFAULT 12,
  `morning_start`                 VARCHAR(20)  NOT NULL DEFAULT '8:00 AM',
  `morning_end`                   VARCHAR(20)  NOT NULL DEFAULT '12:00 PM',
  `afternoon_start`               VARCHAR(20)  NOT NULL DEFAULT '1:00 PM',
  `afternoon_end`                 VARCHAR(20)  NOT NULL DEFAULT '5:00 PM',
  `lunch_break`                   TINYINT(1)   NOT NULL DEFAULT 1,
  `clinic_days`                   VARCHAR(255)      NOT NULL DEFAULT 'Monday,Tuesday,Wednesday,Thursday,Friday,Saturday',
  `gallery_max_photos`            TINYINT UNSIGNED  NULL     DEFAULT NULL,
  `founded_year`                  SMALLINT          NULL     DEFAULT NULL,
  `terms_content`                 MEDIUMTEXT        NULL     DEFAULT NULL,
  -- Split out from terms_content — the Data Privacy Act (RA 10173) notice
  -- used to be bundled into the same document/checkbox as the Terms &
  -- Conditions; it's now its own admin-editable document and its own
  -- separate consent checkbox on registration (see auth.js's DEFAULT_PRIVACY_MD).
  `privacy_content`               MEDIUMTEXT        NULL     DEFAULT NULL,
  `appointment_policy_content`    MEDIUMTEXT        NULL     DEFAULT NULL,
  `reminder_time`                 VARCHAR(20)  NOT NULL DEFAULT '12:00 PM', -- day-before reminder send time
  `confirm_deadline_time`         VARCHAR(20)  NOT NULL DEFAULT '9:00 PM',  -- same-day confirm-or-auto-cancel deadline
  `waitlist_offer_hours`          TINYINT UNSIGNED NOT NULL DEFAULT 3,      -- how long a freed slot stays claimable, and the lead-time cutoff below which a "waiting" entry is removed as no longer fulfillable
  PRIMARY KEY (`id`)
) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_unicode_ci;

-- ── Archived Records ─────────────────────────────────────────────
CREATE TABLE IF NOT EXISTS `archived_records` (
  `id`          VARCHAR(20)  NOT NULL,
  `type`        VARCHAR(50)  DEFAULT NULL,
  `name`        VARCHAR(255) DEFAULT NULL,
  `ref_id`      VARCHAR(20)  DEFAULT NULL,
  `archived_by` VARCHAR(100) DEFAULT NULL,
  `reason`      TEXT         DEFAULT NULL,
  `data_json`   TEXT         DEFAULT NULL,
  `date`        VARCHAR(50)  DEFAULT NULL,
  PRIMARY KEY (`id`)
) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_unicode_ci;

-- ── PHP Sessions (DB-backed so logins survive container restarts /
--    multiple replicas on hosts like Railway, instead of relying on
--    the local filesystem) ───────────────────────────────────────
-- user_id/user_agent/ip_address/created_at back the Active Sessions
-- feature (Settings > Active Sessions, every role) — a session row is
-- tagged with its owner right after a successful login (see
-- tagSessionOwner(), api/helpers.php) so a user can list and revoke their
-- own signed-in devices, and so a password change can revoke every OTHER
-- session on the account. These columns are separate from `data` (PHP's
-- own opaque serialized session payload) — never parsed out of it, always
-- looked up directly, so listing/revoking sessions never has to touch
-- PHP's session serialization format at all.
CREATE TABLE IF NOT EXISTS `sessions` (
  `id`          VARCHAR(128)  NOT NULL,
  `data`        MEDIUMTEXT    NOT NULL,
  `last_access` INT UNSIGNED  NOT NULL DEFAULT 0,
  `user_id`     INT UNSIGNED  NULL     DEFAULT NULL,
  `user_agent`  VARCHAR(255)  NULL     DEFAULT NULL,
  `ip_address`  VARCHAR(45)   NULL     DEFAULT NULL,
  `created_at`  DATETIME      NULL     DEFAULT NULL,
  PRIMARY KEY (`id`),
  INDEX `idx_user_id` (`user_id`)
) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_unicode_ci;

-- ── Password Resets (forgot-password OTP + reset-token flow) ──────
CREATE TABLE IF NOT EXISTS `password_resets` (
  `id`             INT UNSIGNED     NOT NULL AUTO_INCREMENT,
  `email`          VARCHAR(255)     NOT NULL,
  `otp`            VARCHAR(6)       NOT NULL,
  `token`          VARCHAR(64)      NULL DEFAULT NULL,
  `used`           TINYINT(1)       NOT NULL DEFAULT 0,
  `attempts`       TINYINT UNSIGNED NOT NULL DEFAULT 0,
  `total_attempts` TINYINT UNSIGNED NOT NULL DEFAULT 0,
  `blocked_until`  DATETIME         NULL DEFAULT NULL,
  `expires_at`     DATETIME         NOT NULL,
  `created_at`     TIMESTAMP        NOT NULL DEFAULT CURRENT_TIMESTAMP,
  PRIMARY KEY (`id`),
  INDEX `idx_email_otp` (`email`, `otp`),
  INDEX `idx_token` (`token`)
) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_unicode_ci;

--    ALTER TABLE `password_resets` ADD COLUMN IF NOT EXISTS `attempts` TINYINT UNSIGNED NOT NULL DEFAULT 0;
--    ALTER TABLE `password_resets` ADD COLUMN IF NOT EXISTS `total_attempts` TINYINT UNSIGNED NOT NULL DEFAULT 0 AFTER `attempts`;
--    ALTER TABLE `password_resets` ADD COLUMN IF NOT EXISTS `blocked_until` DATETIME NULL DEFAULT NULL AFTER `total_attempts`;

-- ── Password History (reuse prevention) ───────────────────────────
-- Stores each user's previously-used password hashes so a new password
-- can be checked against their recent history, not just the current one.
CREATE TABLE IF NOT EXISTS `password_history` (
  `id`            INT UNSIGNED NOT NULL AUTO_INCREMENT,
  `users_id`      INT UNSIGNED NOT NULL,
  `password_hash` VARCHAR(255) NOT NULL,
  `created_at`    DATETIME     NOT NULL DEFAULT CURRENT_TIMESTAMP,
  PRIMARY KEY (`id`),
  INDEX `idx_ph_user` (`users_id`),
  FOREIGN KEY (`users_id`) REFERENCES `users`(`id`) ON DELETE CASCADE
) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_unicode_ci;

-- ── Pending Registrations (staging until OTP confirmed) ───────────
-- Self-registration form data lives here until the OTP is verified.
-- Only then are rows inserted into users + patients. This prevents
-- ghost accounts from fake or mistyped email addresses.
CREATE TABLE IF NOT EXISTS `pending_registrations` (
  `id`            INT UNSIGNED     NOT NULL AUTO_INCREMENT,
  `email`         VARCHAR(255)     NOT NULL,
  `first_name`    VARCHAR(100)     NOT NULL,
  `middle_name`   VARCHAR(100)     NULL DEFAULT NULL,
  `last_name`     VARCHAR(100)     NOT NULL,
  `dob`           DATE             NOT NULL,
  `gender`        VARCHAR(20)      NOT NULL,
  `address`       TEXT             NOT NULL,
  `contact`       VARCHAR(50)      NOT NULL,
  `password_hash` VARCHAR(255)     NOT NULL,
  `otp`           VARCHAR(6)       NOT NULL,
  `attempts`       TINYINT UNSIGNED NOT NULL DEFAULT 0,
  `total_attempts` TINYINT UNSIGNED NOT NULL DEFAULT 0,
  `expires_at`     DATETIME         NOT NULL,
  `created_at`    TIMESTAMP        NOT NULL DEFAULT CURRENT_TIMESTAMP,
  PRIMARY KEY (`id`),
  UNIQUE KEY `uq_pending_email` (`email`)
) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_unicode_ci;

-- ── Email Changes (OTP-verified email address changes) ────────────
-- A logged-in patient changing their email must prove they own the new
-- address first — mirrors the password_resets OTP+lockout pattern, but
-- scoped to a users_id (the requester must already be authenticated)
-- rather than a bare email, and the code is sent to the NEW address
-- instead of an existing one. users.email is only updated once verify-
-- email-change.php confirms the OTP. Currently patient-only (see
-- api/patients/request-email-change.php) — other roles still change
-- email straight through their existing profile-save endpoints.
CREATE TABLE IF NOT EXISTS `email_changes` (
  `id`             INT UNSIGNED     NOT NULL AUTO_INCREMENT,
  `users_id`       INT UNSIGNED     NOT NULL,
  `new_email`      VARCHAR(255)     NOT NULL,
  `otp`            VARCHAR(6)       NOT NULL,
  `used`           TINYINT(1)       NOT NULL DEFAULT 0,
  `attempts`       TINYINT UNSIGNED NOT NULL DEFAULT 0,
  `total_attempts` TINYINT UNSIGNED NOT NULL DEFAULT 0,
  `blocked_until`  DATETIME         NULL DEFAULT NULL,
  `expires_at`     DATETIME         NOT NULL,
  `created_at`     TIMESTAMP        NOT NULL DEFAULT CURRENT_TIMESTAMP,
  PRIMARY KEY (`id`),
  INDEX `idx_ec_user` (`users_id`),
  FOREIGN KEY (`users_id`) REFERENCES `users`(`id`) ON DELETE CASCADE
) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_unicode_ci;

-- ── Rate Limits (IP-based, keyed by endpoint) ────────────────────
CREATE TABLE IF NOT EXISTS `rate_limits` (
  `id`         BIGINT UNSIGNED NOT NULL AUTO_INCREMENT,
  `ip`         VARCHAR(45)     NOT NULL,
  `endpoint`   VARCHAR(64)     NOT NULL,
  `created_at` INT UNSIGNED    NOT NULL,
  PRIMARY KEY (`id`),
  INDEX `idx_rl_lookup` (`ip`, `endpoint`, `created_at`)
) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_unicode_ci;

-- ── About Gallery (carousel photos on public homepage) ───────────
CREATE TABLE IF NOT EXISTS `about_gallery` (
  `id`         INT UNSIGNED     NOT NULL AUTO_INCREMENT,
  `caption`    VARCHAR(255)     NULL     DEFAULT NULL,
  `filename`   VARCHAR(255)     NOT NULL DEFAULT '',
  `sort_order` TINYINT UNSIGNED NOT NULL DEFAULT 0,
  `created_at` DATETIME         NOT NULL DEFAULT CURRENT_TIMESTAMP,
  PRIMARY KEY (`id`)
) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_unicode_ci;

-- ── Migrations (run once on existing databases) ───────────────────
--    ALTER TABLE `clinic_settings` ADD COLUMN IF NOT EXISTS `gallery_max_photos` TINYINT UNSIGNED NULL DEFAULT NULL AFTER `clinic_days`;
--    ALTER TABLE `clinic_settings` ADD COLUMN IF NOT EXISTS `founded_year` SMALLINT NULL DEFAULT NULL AFTER `gallery_max_photos`;
--    ALTER TABLE `clinic_settings` ADD COLUMN IF NOT EXISTS `terms_content` MEDIUMTEXT NULL DEFAULT NULL AFTER `founded_year`;
--    ALTER TABLE `clinic_settings` ADD COLUMN IF NOT EXISTS `appointment_policy_content` MEDIUMTEXT NULL DEFAULT NULL AFTER `terms_content`;
--    ALTER TABLE `clinic_services` ADD COLUMN IF NOT EXISTS `sort_order` SMALLINT UNSIGNED NOT NULL DEFAULT 0 AFTER `icon`;
--    UPDATE `clinic_services` SET sort_order = id WHERE sort_order = 0;
--    ALTER TABLE `about_gallery` ADD COLUMN `filename` VARCHAR(255) NOT NULL DEFAULT '' AFTER `caption`, DROP COLUMN `image_data`, DROP COLUMN `mime_type`;
--    ALTER TABLE `doctors` ADD COLUMN IF NOT EXISTS `degree` VARCHAR(30) NOT NULL DEFAULT 'OD' AFTER `specialization`;
--    ALTER TABLE `doctors` ADD COLUMN IF NOT EXISTS `sort_order` SMALLINT UNSIGNED NOT NULL DEFAULT 0 AFTER `work_hours`;
--    ALTER TABLE `appointments` MODIFY COLUMN `status` ENUM('pending','approved','cancelled','disapproved','completed','no-show') NOT NULL DEFAULT 'pending';
--    ALTER TABLE `clinic_settings` ADD COLUMN IF NOT EXISTS `video_url` VARCHAR(500) NULL DEFAULT NULL AFTER `map_embed_url`;
--    ALTER TABLE `clinic_settings` ADD COLUMN IF NOT EXISTS `reminder_time` VARCHAR(20) NOT NULL DEFAULT '12:00 PM' AFTER `appointment_policy_content`;
--    ALTER TABLE `clinic_settings` ADD COLUMN IF NOT EXISTS `confirm_deadline_time` VARCHAR(20) NOT NULL DEFAULT '9:00 PM' AFTER `reminder_time`;
--    ALTER TABLE `clinic_settings` ADD COLUMN IF NOT EXISTS `waitlist_offer_hours` TINYINT UNSIGNED NOT NULL DEFAULT 3 AFTER `confirm_deadline_time`;
--    ALTER TABLE `patients` DROP COLUMN `blood_type`;
--    ALTER TABLE `pending_registrations` DROP COLUMN `blood_type`;
--    ALTER TABLE `patients` DROP COLUMN `medical_history`;
--    ALTER TABLE `patients` DROP COLUMN `optical_history`;
--    Consultation/Examination/Prescription field-separation fix — the
--    `consultations`/`examinations`/`prescriptions` CREATE TABLE blocks
--    above are already the target shape for a fresh install. Existing live
--    databases were brought in line via database/migrate_exam_prescription_
--    split.sql (carried forward each exam's existing lens/material/coating/
--    frame data onto a matching prescription row before dropping the
--    columns that used to hold it) — confirmed applied everywhere this app
--    runs, so that one-time file has been deleted; this note stays only as
--    a record that the migration happened.
--    Prescription dispensing fields — the wizard's Dispensing step (Total
--    Amount/Dispensed Date/Received By) was captured in the DOM but never
--    actually saved anywhere; now persisted on `prescriptions`. Existing
--    database:
--    ALTER TABLE `prescriptions` ADD COLUMN `total_amount` DECIMAL(10,2) DEFAULT NULL;
--    ALTER TABLE `prescriptions` ADD COLUMN `dispensed_date` DATE DEFAULT NULL;
--    ALTER TABLE `prescriptions` ADD COLUMN `received_by` VARCHAR(150) DEFAULT NULL;
--    Examinations can now be archived (Settings > Archives) instead of only
--    ever being hard-deleted — same soft-delete convention already used by
--    patients/admins/staff/doctors. Cascades to the visit's linked
--    consultation/prescription so all three hide together, same as the
--    existing permanent-delete cascade. Existing database:
--    ALTER TABLE `examinations`  ADD COLUMN `archived_at` DATETIME DEFAULT NULL;
--    ALTER TABLE `consultations` ADD COLUMN `archived_at` DATETIME DEFAULT NULL;
--    ALTER TABLE `prescriptions` ADD COLUMN `archived_at` DATETIME DEFAULT NULL;
--    Doctors can now carry an optional second credential (e.g. "Ocular
--    Pharmacologist" + its own PRC accreditation number) shown on the
--    Ophthalmic Clearance certificate. Existing database:
--    ALTER TABLE `doctors` ADD COLUMN `secondary_credential` VARCHAR(100) DEFAULT NULL AFTER `prc_license`;
--    ALTER TABLE `doctors` ADD COLUMN `secondary_prc` VARCHAR(50) DEFAULT NULL AFTER `secondary_credential`;
--    New clinic-wide rule: max appointments one patient can hold per day
--    (self-service bookings only), separate from the existing per-doctor
--    cap. Existing database:
--    ALTER TABLE `clinic_settings` ADD COLUMN `max_appts_per_patient_per_day` SMALLINT UNSIGNED NOT NULL DEFAULT 1 AFTER `max_appts_per_doctor_per_day`;
--    Appointments now record how they were booked — 'online' (patient
--    self-service or a claimed waitlist offer) vs 'walk-in' (admin/staff
--    created it directly). Existing database:
--    ALTER TABLE `appointments` ADD COLUMN `source` ENUM('online','walk-in') NOT NULL DEFAULT 'online' AFTER `status`;
--    Data Privacy Act notice split out of the Terms & Conditions document —
--    it's now its own admin-editable content and its own separate
--    registration consent checkbox (see auth.js's DEFAULT_PRIVACY_MD /
--    DEFAULT_TERMS_MD, now trimmed to just Terms & Conditions). Existing
--    database:
--    ALTER TABLE `clinic_settings` ADD COLUMN `privacy_content` MEDIUMTEXT NULL DEFAULT NULL AFTER `terms_content`;
--    Multi-device Active Sessions — every login is tracked (not
--    restricted), so the same account can stay signed in on several
--    devices at once; each user can see and individually revoke their own
--    sessions from Settings, and a password change auto-revokes every
--    OTHER session on the account. Existing sessions created before this
--    migration simply won't show up in anyone's Active Sessions list
--    until their next login re-tags them — nobody gets signed out by
--    running this. Existing database:
--    ALTER TABLE `sessions` ADD COLUMN IF NOT EXISTS `user_id` INT UNSIGNED NULL DEFAULT NULL;
--    ALTER TABLE `sessions` ADD COLUMN IF NOT EXISTS `user_agent` VARCHAR(255) NULL DEFAULT NULL AFTER `user_id`;
--    ALTER TABLE `sessions` ADD COLUMN IF NOT EXISTS `ip_address` VARCHAR(45) NULL DEFAULT NULL AFTER `user_agent`;
--    ALTER TABLE `sessions` ADD COLUMN IF NOT EXISTS `created_at` DATETIME NULL DEFAULT NULL AFTER `ip_address`;
--    ALTER TABLE `sessions` ADD INDEX IF NOT EXISTS `idx_user_id` (`user_id`);
--    Patients can now request their own account be deleted (Settings > My
--    Profile) — the request only notifies admin/staff and shows a pending
--    state; it never deletes anything itself. Admin/staff fulfills it via
--    the existing Archive flow, which now also clears the request flag.
--    Existing database:
--    ALTER TABLE `patients` ADD COLUMN `deletion_requested_at` DATETIME NULL DEFAULT NULL AFTER `booking_restricted`;
--    ALTER TABLE `patients` ADD COLUMN `deletion_request_reason` TEXT NULL DEFAULT NULL AFTER `deletion_requested_at`;
--    Default appointment slot interval changed from 30 to 45 minutes.
--    The column DEFAULT only applies to future rows — an existing
--    `clinic_settings` row (there's normally just the one, id=1) keeps
--    whatever value it already has, so also run the UPDATE. Existing
--    database:
--    ALTER TABLE `clinic_settings` ALTER `default_duration` SET DEFAULT '45 min';
--    UPDATE `clinic_settings` SET `default_duration` = '45 min' WHERE `default_duration` = '30 min';
--    Max Appointments Per Patient Per Day setting removed — patients can
--    now hold as many same-day appointments as they want (self-service
--    bookings). No longer read or written anywhere in the app. Existing
--    database:
--    ALTER TABLE `clinic_settings` DROP COLUMN IF EXISTS `max_appts_per_patient_per_day`;
--    Self-registration now allows 13-17 year olds (previously 18+ only) —
--    no guardian info collected, no staff review; a self-registered minor
--    account is active immediately, same as an adult one. Guardian
--    verification (guardian_name/guardian_contact/guardian_approved_at on
--    `patients`, matching columns on `pending_registrations`) was tried
--    and then reverted — if an existing database already ran that
--    migration, drop them:
--    ALTER TABLE `patients` DROP COLUMN IF EXISTS `guardian_name`;
--    ALTER TABLE `patients` DROP COLUMN IF EXISTS `guardian_contact`;
--    ALTER TABLE `patients` DROP COLUMN IF EXISTS `guardian_approved_at`;
--    ALTER TABLE `pending_registrations` DROP COLUMN IF EXISTS `guardian_name`;
--    ALTER TABLE `pending_registrations` DROP COLUMN IF EXISTS `guardian_contact`;
--    Any patient row left inactive (users.is_active = 0) by that reverted
--    flow needs reactivating by hand — reactivate a legitimate one from
--    User Management, or delete it if it was a test:
--    UPDATE `users` u JOIN `patients` p ON p.user_id = u.id SET u.is_active = 1 WHERE u.is_active = 0 AND u.role = 'patient';
--    A doctor's follow-up recommendation (Consultation step of the exam
--    wizard) can now carry a specific time slot alongside the date, picked
--    from the same blocked-date/blocked-time-aware calendar+slot modal the
--    staff reschedule flow already uses, instead of a bare date. Existing
--    database:
--    ALTER TABLE `consultations` ADD COLUMN `follow_up_time` VARCHAR(10) NULL DEFAULT NULL AFTER `follow_up_date`;
--    Services reorganized into two kinds: bookable (offered as an
--    appointment type) and patient-visible (shown on the public Services
--    page / selectable by patients themselves, as opposed to staff-only) —
--    see clinic_services' own column comments above for the exact
--    semantics. The full 8-service catalog was replaced with a new
--    10-service one per the clinic's updated offerings. Existing database:
--    ALTER TABLE `clinic_services` ADD COLUMN `bookable` TINYINT(1) NOT NULL DEFAULT 1 AFTER `sort_order`;
--    ALTER TABLE `clinic_services` ADD COLUMN `patient_visible` TINYINT(1) NOT NULL DEFAULT 1 AFTER `bookable`;
--    DELETE FROM `clinic_services`;
--    ALTER TABLE `clinic_services` AUTO_INCREMENT = 1;
--    INSERT INTO `clinic_services` (name, description, duration, status, icon, sort_order, bookable, patient_visible) VALUES
--    ('Comprehensive Eye Examination', 'A thorough assessment of overall eye health and visual acuity, including refraction and internal/external eye evaluation.', 45, 'active', 'eye', 1, 1, 1),
--    ('Optical Frame Selection', 'Assisting patients in choosing frames that fit properly and suit their preferences.', 15, 'active', 'archive', 2, 1, 1),
--    ('Eyeglass/Contact Lens Fitting', 'Fitting and adjustment of eyeglasses or contact lenses for proper alignment, comfort, and visual clarity.', 30, 'active', 'award', 3, 1, 1),
--    ('Follow-up Consultation', 'Subsequent visits to review the patient''s vision condition and assess any changes after treatment or prescription.', 20, 'active', 'refresh-cw', 4, 1, 0),
--    ('Eye Refraction (Manual and Autorefraction)', 'Determines the correct lens power needed to improve vision, using both manual retinoscopy and computerized autorefraction.', 20, 'active', 'search', 5, 0, 1),
--    ('Spot Vision Screening', 'A quick, portable screening to detect possible vision problems that may need further examination.', 10, 'active', 'activity', 6, 0, 1),
--    ('Ishihara Test (Color Blindness Test)', 'A color vision test using specially designed plates to detect red-green color blindness.', 10, 'active', 'file-text', 7, 0, 1),
--    ('Dispensing of Eyeglasses', 'Preparation and release of finished eyeglasses to the patient, including fit verification.', 15, 'active', 'package', 8, 0, 1),
--    ('Slit Lamp Examination', 'A detailed examination of the front structures of the eye using a specialized microscope with an intense light source.', 15, 'active', 'settings', 9, 0, 1),
--    ('Tonometry Test', 'Measures intraocular pressure to help screen for glaucoma.', 10, 'active', 'alert-circle', 10, 0, 1);
--    Any EXISTING appointment/consultation/prescription rows keep whatever
--    service-name text (e.g. "Eye Examination", "Lens Fitting") they were
--    booked/recorded under — that's free text, not a foreign key, so
--    deleting/renaming catalog rows doesn't touch historical records; they
--    simply reference a name no longer in the active catalog.
--    Per-service `duration` removed entirely — the clinic now runs every
--    appointment on one uniform interval (clinic_settings.default_duration),
--    so a per-service override could never actually differ from it and was
--    just redundant data. api/appointments/taken.php's own per-slot
--    duration lookup dropped its clinic_services JOIN accordingly — every
--    booked slot uses the clinic-wide default now. Existing database:
--    ALTER TABLE `clinic_services` DROP COLUMN `duration`;
--    `medical_history` re-added to `patients` (a `blood_type`/
--    `medical_history`/`optical_history` set existed once, was dropped
--    with no code ever wired to it — see the earlier DROP COLUMN entries
--    above). This time it's a single free-text field, editable by the
--    patient (Settings > My Profile), by admin/staff (Add/Edit Patient),
--    and surfaced read-only to the doctor in the exam wizard's Patient
--    Info step. Existing database:
--    ALTER TABLE `patients` ADD COLUMN `medical_history` TEXT NULL DEFAULT NULL AFTER `occupation`;
--    Edit Patient's "Temporary Password" check used to hardcode "Changed by
--    patient" for any non-temp password, even when it was actually an
--    admin/staff reset via that same modal's Reset Password section. A new
--    column records who ACTUALLY last changed it (set by both
--    change_password.php, self-service, and reset_password.php, admin/staff
--    resetting someone else), and get_temp_password.php now returns it so
--    the frontend can attribute it correctly instead of guessing. Existing
--    database:
--    ALTER TABLE `users` ADD COLUMN `password_changed_by` ENUM('admin','staff','doctor','patient') NULL DEFAULT NULL AFTER `password_hash`;

SET FOREIGN_KEY_CHECKS = 1;
