// ================================================================
//  CANAOPTICALCLINIC — db.js
//  Central mock data store. No logic. No imports.
// ================================================================

var patients = []

var doctors = []

var staff = []

var admins = []

var appointments = []

var activityLog = []

// Examination records only — clinical measurements, no lens/frame/coating
// data (that lives on `prescriptions` now, see database/schema.sql's
// CREATE TABLE comments). Look up a linked prescription separately via
// `consultationId`/the exam's own id (prescriptions.examId) when needed.
function getExamRecords() {
  var result = []
  patients.forEach(function(p) {
    ;(p.examinations || []).forEach(function(e) {
      result.push({
        id:                e.id,
        patientId:         p.id,
        patientName:       p.name,
        patientPhotoUrl:   p.photoUrl || null,
        doctor:            e.doctor || '',
        date:              e.date   || '',
        consultationId:    e.consultationId || '',
        diagnosis:         e.diagnosis        || '',
        status:            e.status           || 'completed',
        od:                e.od               || {},
        os:                e.os               || {},
        iop:               e.iop              || {},
        pd:                e.pd               || '',
        externalFindings:  e.externalFindings || '',
        testResults:       e.testResults      || '',
        remarks:           e.remarks          || ''
      })
    })
  })
  result.sort(function(a, b) { return b.date.localeCompare(a.date) })
  return result
}

// Defaults shown until _syncServices() (auth.js) replaces these with live
// DB data. Two independent flags beyond the usual active/inactive
// `status`: `bookable` — offered as a selectable appointment type at all —
// and `patientVisible` — patients themselves can see/pick it, both on the
// public Services page and their own booking wizard, as opposed to
// staff/admin-only (see clinic_services' own column comments, schema.sql).
// No per-service duration — every appointment runs on the one clinic-wide
// interval (consultationSettings.defaultDuration); a per-service override
// could never actually differ from it, so it was dropped entirely.
var CLINIC_SERVICES = [
  { id: 1,  name: 'Comprehensive Eye Examination',             description: 'A thorough assessment of overall eye health and visual acuity, including refraction and internal/external eye evaluation.',                       status: 'active', icon: 'eye',        bookable: true,  patientVisible: true },
  { id: 2,  name: 'Optical Frame Selection',                   description: 'Assisting patients in choosing frames that fit properly and suit their preferences.',                                                              status: 'active', icon: 'archive',    bookable: true,  patientVisible: true },
  { id: 3,  name: 'Eyeglass/Contact Lens Fitting',              description: 'Fitting and adjustment of eyeglasses or contact lenses for proper alignment, comfort, and visual clarity.',                                        status: 'active', icon: 'award',      bookable: true,  patientVisible: true },
  // Staff-only — never shown to patients (booking wizard or public site),
  // but staff/admin can still select it when booking a follow-up on a
  // patient's behalf. Name intentionally kept exactly as-is (see
  // appointmentWizardHtml(), pages.js, and the doctor's exam wizard
  // follow-up flow, both of which depend on it).
  { id: 4,  name: 'Follow-up Consultation',                    description: "Subsequent visits to review the patient's vision condition and assess any changes after treatment or prescription.",                                status: 'active', icon: 'refresh-cw', bookable: true,  patientVisible: false },
  // Display-only — listed on the public Services page, never a selectable
  // appointment type for anyone.
  { id: 5,  name: 'Eye Refraction (Manual and Autorefraction)', description: 'Determines the correct lens power needed to improve vision, using both manual retinoscopy and computerized autorefraction.',                        status: 'active', icon: 'search',     bookable: false, patientVisible: true },
  { id: 6,  name: 'Spot Vision Screening',                     description: 'A quick, portable screening to detect possible vision problems that may need further examination.',                                                 status: 'active', icon: 'activity',   bookable: false, patientVisible: true },
  { id: 7,  name: 'Ishihara Test (Color Blindness Test)',      description: 'A color vision test using specially designed plates to detect red-green color blindness.',                                                         status: 'active', icon: 'file-text',  bookable: false, patientVisible: true },
  { id: 8,  name: 'Dispensing of Eyeglasses',                  description: 'Preparation and release of finished eyeglasses to the patient, including fit verification.',                                                        status: 'active', icon: 'package',    bookable: false, patientVisible: true },
  { id: 9,  name: 'Slit Lamp Examination',                     description: 'A detailed examination of the front structures of the eye using a specialized microscope with an intense light source.',                            status: 'active', icon: 'settings',   bookable: false, patientVisible: true },
  { id: 10, name: 'Tonometry Test',                            description: 'Measures intraocular pressure to help screen for glaucoma.',                                                                                        status: 'active', icon: 'alert-circle', bookable: false, patientVisible: true }
]
var _svcNextId = 11

// Service types that are dispensing/administrative, not a clinical exam —
// nothing was actually examined, so completing one of these never
// requires a diagnosis. Everything else (Comprehensive Eye Examination,
// Follow-up Consultation) still does — even a follow-up involves an
// assessment of the patient's condition. Referenced by both the New
// Examination wizard's Diagnosis step (pages.js) and saveNewExam()'s
// save-time validation (main.js), so they can't drift out of sync with
// each other.
var NON_EXAM_SERVICE_TYPES = ['Eyeglass/Contact Lens Fitting', 'Optical Frame Selection']

var clinicInfo = {
  name: 'Cana Optical Clinic',
  // Matches the static text hardcoded in every public page's footer
  // (index.html, pages/*.html) — this is the fallback shown before
  // _syncClinicSettings() (auth.js) confirms the real DB value, so it has
  // to be the same or saving without editing this field would silently
  // change the live footer text.
  tagline: 'Professional eye examinations, precision vision testing, and personalized optical care from licensed optometrists in Carmona, Cavite.',
  // Empty by default — the public footer auto-generates "© {year} {name}.
  // All rights reserved." on its own (applyClinicBranding(), public-nav.js)
  // unless this is explicitly set.
  footerCopyrightText: '',
  address: 'Unit 3 Paseo de Carmona, Brgy. Maduya, Carmona, Cavite',
  phone: '0929 663 6080',
  mobile: '0929 663 6080',
  email: 'canaopticalclinic@gmail.com',
  hours: 'Monday – Saturday: 9:00 AM – 5:00 PM',
  logoUrl: null,
  termsContent: null,
  appointmentPolicyContent: null
}

var consultationSettings = {
  defaultDuration:         '45 min',
  maxAdvanceBooking:       '3 months',
  minAdvanceBooking:       '1 day',
  maxApptsPerDoctorPerDay: 12,
  morningStart:   '8:00 AM',
  morningEnd:     '12:00 PM',
  afternoonStart: '1:00 PM',
  afternoonEnd:   '5:00 PM',
  lunchBreak:  true,
  clinicDays:  ['Monday','Tuesday','Wednesday','Thursday','Friday','Saturday'],
  reminderTime:        '12:00 PM',
  confirmDeadlineTime: '9:00 PM',
  waitlistOfferHours:  3
}

// Parses consultationSettings.minAdvanceBooking ('Same day','1 day','2 days',…)
// into the minimum number of days ahead a patient booking must be made.
// Booking calendars (wizard + Doctor Availability) read this so the rule
// stays in sync the moment admin changes it in Settings — no hardcoded "today".
function minAdvanceDays() {
  const v = (consultationSettings.minAdvanceBooking || '').toLowerCase()
  if (!v || v.includes('same')) return 0
  const m = v.match(/\d+/)
  return m ? parseInt(m[0], 10) : 1
}

function minAdvanceTooltip() {
  const n = minAdvanceDays()
  if (n === 0) return ''
  if (n === 1) return 'Same-day appointments are not available.'
  return `Appointments must be booked at least ${n} days in advance.`
}

// Parses consultationSettings.maxAdvanceBooking ('1 week','2 weeks','1 month',…)
// into the furthest-out date a patient booking calendar should allow,
// relative to `base`. Same sync rationale as minAdvanceDays() above —
// booking calendars read this instead of a hardcoded "+3 months".
function maxAdvanceDate(base) {
  const v    = (consultationSettings.maxAdvanceBooking || '3 months').toLowerCase()
  const m    = v.match(/(\d+)\s*(week|month)/)
  const n    = m ? parseInt(m[1], 10) : 3
  const unit = m ? m[2] : 'month'
  const d = new Date(base)
  if (unit === 'week') d.setDate(d.getDate() + n * 7)
  else                 d.setMonth(d.getMonth() + n)
  return d
}

// Converts the admin-editable Terms & Conditions / Appointment Policy
// markdown (clinicInfo.termsContent / .appointmentPolicyContent) into the
// same <h4>/<p>/<ul>/callout HTML these modals have always used. Tiny
// convention only — "## " = heading, a blank line = new paragraph,
// "- " = bullet list item, "> " = a highlighted amber callout (matches the
// Appointment Policy's original "Reminders and Confirmation" notice box) —
// deliberately not full markdown, so the only HTML this can ever emit is
// headings/paragraphs/list items/callouts, regardless of what an admin
// types in the Settings textarea.
function renderTermsMarkdown(md) {
  const esc = s => String(s ?? '').replace(/[&<>"']/g, c => ({ '&':'&amp;', '<':'&lt;', '>':'&gt;', '"':'&quot;', "'":'&#39;' }[c]))
  const lines = String(md || '').split('\n')
  let html = ''
  let paraBuf = []
  let listBuf = []
  let calloutBuf = []
  const flushPara = () => { if (paraBuf.length) { html += `<p>${esc(paraBuf.join(' '))}</p>`; paraBuf = [] } }
  const flushList = () => { if (listBuf.length) { html += `<ul>${listBuf.map(li => `<li>${esc(li)}</li>`).join('')}</ul>`; listBuf = [] } }
  const flushCallout = () => {
    if (!calloutBuf.length) return
    const iconSvg = typeof icon === 'function' ? icon('alert-circle', 'icon-sm') : ''
    html += `<div style="background:#FFF7ED;border-left:3px solid #E8760A;border-radius:8px;padding:12px 16px;margin:8px 0 4px;display:flex;align-items:flex-start;gap:10px">` +
      `<span style="flex-shrink:0;display:flex;color:#E8760A;margin-top:4px">${iconSvg}</span>` +
      `<p style="margin:0;color:#92400E">${esc(calloutBuf.join(' '))}</p></div>`
    calloutBuf = []
  }
  lines.forEach(raw => {
    const line = raw.trim()
    if (!line) { flushPara(); flushCallout(); return }
    if (line.startsWith('## ')) { flushPara(); flushList(); flushCallout(); html += `<h4>${esc(line.slice(3))}</h4>`; return }
    if (line.startsWith('- ')) { flushPara(); flushCallout(); listBuf.push(line.slice(2)); return }
    if (line.startsWith('> ')) { flushPara(); flushList(); calloutBuf.push(line.slice(2)); return }
    flushList(); flushCallout(); paraBuf.push(line)
  })
  flushPara(); flushList(); flushCallout()
  return html
}

// Helpers that work on the raw data
function getPatientById(id)     { return patients.find(p => p.id === id) }
function getDoctorById(id)      { return doctors.find(d => d.id === id) }
function getAppointmentById(id) { return appointments.find(a => a.id === id) }

function getAppointmentsForDoctor(doctorId) {
  return appointments.filter(a => a.doctorId === doctorId)
}
function getAppointmentsForPatient(patientId) {
  return appointments.filter(a => a.patientId === patientId)
}
function getTodayAppts() {
  const today = localDateStr()
  return appointments.filter(a => a.date === today)
}

function _recomputeApptCounts() {
  const todayStr = localDateStr()
  window._apptPendingCount      = appointments.filter(x => x.status === 'pending').length
  // 'approved'/'pending' only — matches _doctorUpcomingCount below. A
  // completed (or cancelled/disapproved) appointment doesn't need the
  // doctor's attention anymore, so it shouldn't keep inflating the "Today"
  // sidebar badge after it's already been seen.
  window._doctorTodayCount      = appointments.filter(a => a.date === todayStr && ['approved','pending'].includes(a.status)).length
  window._doctorUpcomingCount   = appointments.filter(a => a.date > todayStr && ['approved','pending'].includes(a.status)).length
  window._doctorApptAlertCount  = window._doctorTodayCount + window._doctorUpcomingCount
}

function updateAppointmentStatus(id, status) {
  const a = appointments.find(a => a.id === id)
  if (a) {
    a.status = status
    // Deciding the appointment's status supersedes any reschedule request
    // still attached to it (mirrors the server-side clear in update.php)
    delete a.rescheduleRequest
    _recomputeApptCounts()
    if (window._updateSidebarBadges) window._updateSidebarBadges()
  }
}

function addAppointment(appt) {
  appointments.push(appt)
  _recomputeApptCounts()
  if (window._updateSidebarBadges) window._updateSidebarBadges()
}

// Local (not UTC) "YYYY-MM-DD HH:MM:SS" wall-clock timestamp. Date#toISOString()
// always converts to UTC first, which silently shifted every client-logged
// timestamp by the local UTC offset (e.g. 8h for the Philippines) — this is
// what addActivityLog() and friends should use instead.
function nowTimestamp() {
  const d = new Date()
  const pad = n => String(n).padStart(2, '0')
  return `${d.getFullYear()}-${pad(d.getMonth() + 1)}-${pad(d.getDate())} ${pad(d.getHours())}:${pad(d.getMinutes())}:${pad(d.getSeconds())}`
}
function localDateStr(d = new Date()) {
  const pad = n => String(n).padStart(2, '0')
  return `${d.getFullYear()}-${pad(d.getMonth() + 1)}-${pad(d.getDate())}`
}
window.localDateStr = localDateStr

function addActivityLog(entry) {
  activityLog.unshift(entry)
  fetch('api/activity/log.php', {
    method: 'POST', headers: { 'Content-Type': 'application/json' },
    body: JSON.stringify({ ...entry, userId: window.state?.user?.dbId ?? null })
  }).catch(() => {})
}

// Build the flat "all users" list for User Management
function getAllUsers() {
  const rows = []
  admins.forEach(u  => rows.push({ ...u, role: 'Admin' }))
  staff.forEach(u   => rows.push({ ...u, role: 'Staff' }))
  doctors.forEach(u => rows.push({ ...u, role: 'Doctor' }))
  patients.forEach(u => rows.push({ ...u, role: 'Patient' }))
  return rows
}

// ── Archived Records (soft-deleted, Admin-only) ────────────────
var archivedRecords = []

function addArchivedRecord(entry) {
  archivedRecords.push(entry)
}

function removeArchivedRecord(id) {
  const idx = archivedRecords.findIndex(r => r.id === id)
  if (idx !== -1) archivedRecords.splice(idx, 1)
}

// ── Contact Messages (public contact-form submissions) ─────────
var contactMessages = []

// ── Waitlist entries (admin/staff view — active waiting/offered rows) ──
var waitlistEntries = []
