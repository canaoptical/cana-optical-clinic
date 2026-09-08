// ================================================================
//  CANAOPTICALCLINIC — main.js
//  App entry point. Imports all modules, attaches globals,
//  handles modals, QR, toasts, and action handlers.
// ================================================================

// Full display name from parts, middle name shown as an initial ("Juan D.
// Dela Cruz") — PH official-document convention, mirrors api/helpers.php's _mi().
function fmtFullName(first, middle, last, prefix = '') {
  const mi = (middle || '').trim() ? ` ${middle.trim()[0].toUpperCase()}.` : ''
  return `${prefix}${first || ''}${mi} ${last || ''}`.replace(/\s+/g, ' ').trim()
}
window.fmtFullName = fmtFullName

// Completed years since a "YYYY-MM-DD" date of birth — mirrors
// api/patients/admin_update.php's (new DateTime())->diff($bd)->y exactly
// (whole years, accounting for whether this year's birthday has passed
// yet), so a client-side age recompute after editing DOB always agrees
// with what the server just saved.
function ageFromDob(dobStr) {
  if (!dobStr) return null
  const bd = new Date(dobStr.length > 10 ? dobStr : dobStr + 'T00:00:00')
  if (isNaN(bd)) return null
  const now = new Date()
  let age = now.getFullYear() - bd.getFullYear()
  const hadBirthdayThisYear = (now.getMonth() > bd.getMonth())
    || (now.getMonth() === bd.getMonth() && now.getDate() >= bd.getDate())
  if (!hadBirthdayThisYear) age--
  return age
}
window.ageFromDob = ageFromDob

// ── SVG Icon library ────────────────────────────────────────────
function icon(name, cls = 'icon') {
  const p = {
    home:          '<path d="M3 9l9-7 9 7v11a2 2 0 0 1-2 2H5a2 2 0 0 1-2-2z"/><polyline points="9 22 9 12 15 12 15 22"/>',
    calendar:      '<rect x="3" y="4" width="18" height="18" rx="2"/><line x1="16" y1="2" x2="16" y2="6"/><line x1="8" y1="2" x2="8" y2="6"/><line x1="3" y1="10" x2="21" y2="10"/>',
    users:         '<path d="M17 21v-2a4 4 0 0 0-4-4H5a4 4 0 0 0-4 4v2"/><circle cx="9" cy="7" r="4"/><path d="M23 21v-2a4 4 0 0 0-3-3.87"/><path d="M16 3.13a4 4 0 0 1 0 7.75"/>',
    user:          '<path d="M20 21v-2a4 4 0 0 0-4-4H8a4 4 0 0 0-4 4v2"/><circle cx="12" cy="7" r="4"/>',
    'user-x':      '<path d="M16 21v-2a4 4 0 0 0-4-4H5a4 4 0 0 0-4 4v2"/><circle cx="8.5" cy="7" r="4"/><line x1="18" y1="8" x2="23" y2="13"/><line x1="23" y1="8" x2="18" y2="13"/>',
    'file-text':   '<path d="M14 2H6a2 2 0 0 0-2 2v16a2 2 0 0 0 2 2h12a2 2 0 0 0 2-2V8z"/><polyline points="14 2 14 8 20 8"/><line x1="16" y1="13" x2="8" y2="13"/><line x1="16" y1="17" x2="8" y2="17"/>',
    settings:      '<circle cx="12" cy="12" r="3"/><path d="M19.4 15a1.65 1.65 0 0 0 .33 1.82l.06.06a2 2 0 0 1-2.83 2.83l-.06-.06a1.65 1.65 0 0 0-1.82-.33 1.65 1.65 0 0 0-1 1.51V21a2 2 0 0 1-4 0v-.09A1.65 1.65 0 0 0 9 19.4a1.65 1.65 0 0 0-1.82.33l-.06.06a2 2 0 0 1-2.83-2.83l.06-.06A1.65 1.65 0 0 0 4.68 15a1.65 1.65 0 0 0-1.51-1H3a2 2 0 0 1 0-4h.09A1.65 1.65 0 0 0 4.6 9a1.65 1.65 0 0 0-.33-1.82l-.06-.06a2 2 0 0 1 2.83-2.83l.06.06A1.65 1.65 0 0 0 9 4.68a1.65 1.65 0 0 0 1-1.51V3a2 2 0 0 1 4 0v.09a1.65 1.65 0 0 0 1 1.51 1.65 1.65 0 0 0 1.82-.33l.06-.06a2 2 0 0 1 2.83 2.83l-.06.06A1.65 1.65 0 0 0 19.4 9a1.65 1.65 0 0 0 1.51 1H21a2 2 0 0 1 0 4h-.09a1.65 1.65 0 0 0-1.51 1z"/>',
    'bar-chart':   '<line x1="18" y1="20" x2="18" y2="10"/><line x1="12" y1="20" x2="12" y2="4"/><line x1="6" y1="20" x2="6" y2="14"/><line x1="2" y1="20" x2="22" y2="20"/>',
    'message-square': '<path d="M21 15a2 2 0 0 1-2 2H7l-4 4V5a2 2 0 0 1 2-2h14a2 2 0 0 1 2 2z"/>',
    activity:      '<polyline points="22 12 18 12 15 21 9 3 6 12 2 12"/>',
    eye:           '<path d="M1 12s4-8 11-8 11 8 11 8-4 8-11 8-11-8-11-8z"/><circle cx="12" cy="12" r="3"/>',
    'eye-off':     '<path d="M1 12s4-8 11-8 11 8 11 8-4 8-11 8-11-8-11-8z"/><circle cx="12" cy="12" r="3"/><line x1="2" y1="2" x2="22" y2="22"/>',
    'log-out':     '<path d="M9 21H5a2 2 0 0 1-2-2V5a2 2 0 0 1 2-2h4"/><polyline points="16 17 21 12 16 7"/><line x1="21" y1="12" x2="9" y2="12"/>',
    search:        '<circle cx="11" cy="11" r="8"/><line x1="21" y1="21" x2="16.65" y2="16.65"/>',
    plus:          '<line x1="12" y1="5" x2="12" y2="19"/><line x1="5" y1="12" x2="19" y2="12"/>',
    'plus-circle': '<circle cx="12" cy="12" r="10"/><line x1="12" y1="8" x2="12" y2="16"/><line x1="8" y1="12" x2="16" y2="12"/>',
    edit:          '<path d="M11 4H4a2 2 0 0 0-2 2v14a2 2 0 0 0 2 2h14a2 2 0 0 0 2-2v-7"/><path d="M18.5 2.5a2.121 2.121 0 0 1 3 3L12 15l-4 1 1-4 9.5-9.5z"/>',
    trash:         '<polyline points="3 6 5 6 21 6"/><path d="M19 6v14a2 2 0 0 1-2 2H7a2 2 0 0 1-2-2V6m3 0V4a2 2 0 0 1 2-2h4a2 2 0 0 1 2 2v2"/>',
    'trash-2':     '<polyline points="3 6 5 6 21 6"/><path d="M19 6v14a2 2 0 0 1-2 2H7a2 2 0 0 1-2-2V6m3 0V4a2 2 0 0 1 2-2h4a2 2 0 0 1 2 2v2"/><line x1="10" y1="11" x2="10" y2="17"/><line x1="14" y1="11" x2="14" y2="17"/>',
    check:         '<polyline points="20 6 9 17 4 12"/>',
    x:             '<line x1="18" y1="6" x2="6" y2="18"/><line x1="6" y1="6" x2="18" y2="18"/>',
    clock:         '<circle cx="12" cy="12" r="10"/><polyline points="12 6 12 12 16 14"/>',
    printer:       '<polyline points="6 9 6 2 18 2 18 9"/><path d="M6 18H4a2 2 0 0 1-2-2v-5a2 2 0 0 1 2-2h16a2 2 0 0 1 2 2v5a2 2 0 0 1-2 2h-2"/><rect x="6" y="14" width="12" height="8"/>',
    download:      '<path d="M21 15v4a2 2 0 0 1-2 2H5a2 2 0 0 1-2-2v-4"/><polyline points="7 10 12 15 17 10"/><line x1="12" y1="15" x2="12" y2="3"/>',
    upload:        '<path d="M21 15v4a2 2 0 0 1-2 2H5a2 2 0 0 1-2-2v-4"/><polyline points="17 8 12 3 7 8"/><line x1="12" y1="3" x2="12" y2="15"/>',
    filter:        '<polygon points="22 3 2 3 10 12.46 10 19 14 21 14 12.46 22 3"/>',
    shield:        '<path d="M12 22s8-4 8-10V5l-8-3-8 3v7c0 6 8 10 8 10z"/>',
    'chevron-down':'<polyline points="6 9 12 15 18 9"/>',
    'chevron-right':'<polyline points="9 18 15 12 9 6"/>',
    'chevron-left':'<polyline points="15 18 9 12 15 6"/>',
    'alert-circle':'<circle cx="12" cy="12" r="10"/><line x1="12" y1="8" x2="12" y2="12"/><line x1="12" y1="16" x2="12.01" y2="16"/>',
    'check-circle':'<path d="M22 11.08V12a10 10 0 1 1-5.93-9.14"/><polyline points="22 4 12 14.01 9 11.01"/>',
    qr:            '<rect x="3" y="3" width="7" height="7"/><rect x="14" y="3" width="7" height="7"/><rect x="3" y="14" width="7" height="7"/><path d="M14 14h3v3h3v3h-3v-3h-3z"/>',
    bell:          '<path d="M18 8A6 6 0 0 0 6 8c0 7-3 9-3 9h18s-3-2-3-9"/><path d="M13.73 21a2 2 0 0 1-3.46 0"/>',
    info:          '<circle cx="12" cy="12" r="10"/><line x1="12" y1="16" x2="12" y2="12"/><line x1="12" y1="8" x2="12.01" y2="8"/>',
    'map-pin':     '<path d="M21 10c0 7-9 13-9 13s-9-6-9-13a9 9 0 0 1 18 0z"/><circle cx="12" cy="10" r="3"/>',
    phone:         '<path d="M22 16.92v3a2 2 0 0 1-2.18 2 19.79 19.79 0 0 1-8.63-3.07A19.5 19.5 0 0 1 4.69 13a19.79 19.79 0 0 1-3.07-8.67A2 2 0 0 1 3.56 2h3a2 2 0 0 1 2 1.72 12.84 12.84 0 0 0 .7 2.81 2 2 0 0 1-.45 2.11L8.09 9.91a16 16 0 0 0 6 6l1.27-1.27a2 2 0 0 1 2.11-.45 12.84 12.84 0 0 0 2.81.7A2 2 0 0 1 22 16.92z"/>',
    mail:          '<path d="M4 4h16c1.1 0 2 .9 2 2v12c0 1.1-.9 2-2 2H4c-1.1 0-2-.9-2-2V6c0-1.1.9-2 2-2z"/><polyline points="22 6 12 13 2 6"/>',
    'mail-open':   '<path d="M21.2 8.4 12 14 2.8 8.4"/><path d="M3 7.5 11.1 3a2 2 0 0 1 1.8 0L21 7.5"/><path d="M3 7.5v11a1.5 1.5 0 0 0 1.5 1.5h15A1.5 1.5 0 0 0 21 18.5v-11"/>',
    'refresh-cw':  '<polyline points="23 4 23 10 17 10"/><polyline points="1 20 1 14 7 14"/><path d="M3.51 9a9 9 0 0 1 14.85-3.36L23 10M1 14l4.64 4.36A9 9 0 0 0 20.49 15"/>',
    award:         '<circle cx="12" cy="8" r="6"/><path d="M15.477 12.89L17 22l-5-3-5 3 1.523-9.11"/>',
    'x-circle':    '<circle cx="12" cy="12" r="10"/><line x1="15" y1="9" x2="9" y2="15"/><line x1="9" y1="9" x2="15" y2="15"/>',
    lock:          '<rect x="3" y="11" width="18" height="11" rx="2" ry="2"/><path d="M7 11V7a5 5 0 0 1 10 0v4"/>',
    monitor:       '<rect x="2" y="3" width="20" height="14" rx="2" ry="2"/><line x1="8" y1="21" x2="16" y2="21"/><line x1="12" y1="17" x2="12" y2="21"/>',
    smartphone:    '<rect x="5" y="2" width="14" height="20" rx="2" ry="2"/><line x1="12" y1="18" x2="12.01" y2="18"/>',
    tablet:        '<rect x="4" y="2" width="16" height="20" rx="2" ry="2"/><line x1="12" y1="18" x2="12.01" y2="18"/>',
    camera:        '<path d="M23 19a2 2 0 0 1-2 2H3a2 2 0 0 1-2-2V8a2 2 0 0 1 2-2h4l2-3h6l2 3h4a2 2 0 0 1 2 2z"/><circle cx="12" cy="13" r="4"/>',
    'alert-triangle': '<path d="M10.29 3.86L1.82 18a2 2 0 0 0 1.71 3h16.94a2 2 0 0 0 1.71-3L13.71 3.86a2 2 0 0 0-3.42 0z"/><line x1="12" y1="9" x2="12" y2="13"/><line x1="12" y1="17" x2="12.01" y2="17"/>',
    archive:          '<polyline points="21 8 21 21 3 21 3 8"/><rect x="1" y="3" width="22" height="5"/><line x1="10" y1="12" x2="14" y2="12"/>',
    'rotate-ccw':     '<polyline points="1 4 1 10 7 10"/><path d="M3.51 15a9 9 0 1 0 .49-3.5"/>',
    clipboard:        '<path d="M16 4h2a2 2 0 0 1 2 2v14a2 2 0 0 1-2 2H6a2 2 0 0 1-2-2V6a2 2 0 0 1 2-2h2"/><rect x="8" y="2" width="8" height="4" rx="1" ry="1"/>',
    package:          '<line x1="16.5" y1="9.4" x2="7.5" y2="4.21"/><path d="M21 16V8a2 2 0 0 0-1-1.73l-7-4a2 2 0 0 0-2 0l-7 4A2 2 0 0 0 3 8v8a2 2 0 0 0 1 1.73l7 4a2 2 0 0 0 2 0l7-4A2 2 0 0 0 21 16z"/><polyline points="3.27 6.96 12 12.01 20.73 6.96"/><line x1="12" y1="22.08" x2="12" y2="12"/>',
    grid:             '<rect x="3" y="3" width="7" height="7"/><rect x="14" y="3" width="7" height="7"/><rect x="14" y="14" width="7" height="7"/><rect x="3" y="14" width="7" height="7"/>',
    hash:             '<line x1="4" y1="9" x2="20" y2="9"/><line x1="4" y1="15" x2="20" y2="15"/><line x1="10" y1="3" x2="8" y2="21"/><line x1="16" y1="3" x2="14" y2="21"/>',
    'external-link':  '<path d="M18 13v6a2 2 0 0 1-2 2H5a2 2 0 0 1-2-2V8a2 2 0 0 1 2-2h6"/><polyline points="15 3 21 3 21 9"/><line x1="10" y1="14" x2="21" y2="3"/>',
    copy:             '<rect x="9" y="9" width="13" height="13" rx="2" ry="2"/><path d="M5 15H4a2 2 0 0 1-2-2V4a2 2 0 0 1 2-2h9a2 2 0 0 1 2 2v1"/>',
    key:              '<path d="M21 2l-2 2m-7.61 7.61a5.5 5.5 0 1 1-7.778 7.778 5.5 5.5 0 0 1 7.777-7.777zm0 0L15.5 7.5m0 0l3 3L22 7l-3-3m-3.5 3.5L19 4"/>'
  }
  return `<svg viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2" stroke-linecap="round" stroke-linejoin="round" class="${cls}">${p[name] || ''}</svg>`
}

// ── Attach globals (called in onclick="" attributes) ────────────
// Wrap every .tbl in a .tbl-scroll div so the scroll container is always
// 100%-wide (viewport-bounded) while the table itself can be wider than the screen.
function wrapTableScroll() {
  document.querySelectorAll('.tbl').forEach(tbl => {
    const p = tbl.parentElement
    if (!p || p.classList.contains('tbl-scroll')) return
    const wrap = document.createElement('div')
    wrap.className = 'tbl-scroll'
    p.insertBefore(wrap, tbl)
    wrap.appendChild(tbl)
  })
}
window.wrapTableScroll = wrapTableScroll

// Shared empty-state row for all tables — cols = thead column count
function emptyRow(cols, iconName, label, hint) {
  return `<tr style="pointer-events:none"><td colspan="${cols}" style="padding:40px 24px;text-align:center;border:none;color:#9CA3AF;font-size:.85rem">
    ${label}
  </td></tr>`
}
window.emptyRow = emptyRow

// Shared empty-state div for non-table contexts
function emptyDiv(iconName, label, hint) {
  return `<div class="table-empty">${label}</div>`
}
window.emptyDiv = emptyDiv

window.icon                  = icon
window.state                 = state
window.navigate              = navigate
window.renderPage            = renderPage
window.toggleSidebar         = toggleSidebar
window.bootShell             = bootShell
window.logout                = logout
window.handleLogin           = handleLogin
window.handleRegister        = handleRegister
window.showRegister          = showRegister
window.showLogin             = showLogin
window._charts               = { initAppointmentsChart, initPatientGrowthChart, initReportStatusChart, initReportMonthlyChart, updateAppointmentsChart, updatePatientGrowthChart, initAnalyticsDoughnut, initAnalyticsStacked, initGenderChart, initAgeChart, initDoctorUtilChart, updateAnalyticsCharts, initStaffOverviewChart, updateStaffOverviewChart }
window._pages                = { pageAdminDashboard, pageAdminUsers, pageAppointments, pageCreateAppointment, pageWaitlist, pagePatientList, pagePatientView, pageContactMessages, pageQRScanner, pageSchedule, pageAdminReports, pageAdminSettings, pageActivityLog, pageStaffDashboard, pageStaffSettings, pageDoctorDashboard, pageDoctorAppointments, pageDoctorSchedule, pageDoctorSettings, pageExamination, pageExamRecords, pageNewExamination, pagePatientExamHistory, pagePatientDashboard, pagePatientAppts, pagePatientConsultations, pagePatientQR, pagePatientPrescriptions, pagePatientNotifications, pagePatientSettings, pageComingSoon, pagePatientDoctorAvail, pageScanQR, pageActiveSessions }
window.toggleNotifyDropdown  = toggleNotifyDropdown
window.toggleUserDropdown    = toggleUserDropdown
window.closeAllDropdowns     = closeAllDropdowns
window.markAllRead           = markAllRead

// ── Close dropdowns on outside click ────────────────────────────
document.addEventListener('click', (e) => {
  const notifyWrap  = document.getElementById('topbar-notify-wrap')
  const userWrap    = document.getElementById('topbar-user-wrap')
  if (notifyWrap && !notifyWrap.contains(e.target)) {
    const dd = document.getElementById('notify-dropdown')
    if (dd) dd.classList.remove('open')
  }
  if (userWrap && !userWrap.contains(e.target)) {
    const ud = document.getElementById('user-dropdown')
    if (ud) ud.classList.remove('open')
  }
})

// ── Topbar shadow on scroll ──────────────────────────────────────
document.addEventListener('scroll', () => {
  const tb = document.querySelector('.topbar')
  if (tb) tb.classList.toggle('scrolled', window.scrollY > 4)
}, { passive: true })

// ════════════════════════════════════════════════════════════════
//  MODAL SYSTEM
// ════════════════════════════════════════════════════════════════
function showModal(html, size = '') {
  document.getElementById('modal-root').innerHTML = `
    <div class="modal-overlay" onclick="if(event.target===this)window.closeModal()">
      <div class="modal-box${size ? ' ' + size : ''}">${html}</div>
    </div>`
}
function closeModal() {
  document.getElementById('modal-root').innerHTML = ''
  if (window._qrKillStream) window._qrKillStream()
  closeDobPicker()
}
window.closeModal = closeModal
window.showModal  = showModal

// ════════════════════════════════════════════════════════════════
//  DATE PICKER — replaces native <input type="date"> everywhere in the
//  app (registration, Add/Edit Patient, New User, Block Date, Reports'
//  date range, Activity Log filters, exam dates, etc). Native date-input
//  rendering (icon, internal text colour, fallback UI, and — critically —
//  whether it even shows a calendar popup or just spinners) is too
//  inconsistent across Android OEM/WebView versions and iOS Safari; this
//  renders identically everywhere since nothing is left to the OS. Same
//  technique as the other custom fields above: a same-id hidden <input>
//  keeps holding the plain "YYYY-MM-DD" value, so every existing
//  gv(id)/.value read across the app keeps working unchanged.
// ════════════════════════════════════════════════════════════════
function dateFieldHtml(id, opts = {}) {
  const { value = '', cls = 'form-input', placeholder = 'mm/dd/yyyy', max = '', min = '', defaultYearsAgo = 0, onchange = '', style = '',
    // Optional, only used by callers that need them (e.g. the exam wizard's
    // Follow-up Date) — everything else keeps working exactly as before.
    // disabledWeekdays: day names the clinic is closed ('Sunday', etc.) —
    // inverse of consultationSettings.clinicDays, computed by the caller.
    // disabledDates: specific ISO dates to grey out (a doctor's blocked_dates).
    disabledWeekdays = [], disabledDates = [] } = opts
  const label = value ? _dobFormat(value) : placeholder
  // style/onchange were accepted in opts but silently dropped — every call
  // site passing a custom width/font-size (Reports date range, Activity
  // Log filters) or an onchange (both of those, for live-filtering) was
  // rendering with none of it applied, just the plain .form-input default.
  const onchangeAttr = onchange ? ` onchange="${esc(onchange)}"` : ''
  const styleAttr = style ? ` style="${esc(style)}"` : ''
  // The trigger is a <div>, not a <button> — it needs to host a real,
  // typeable <input> (buttons can't contain form controls), while still
  // being the single element openDobPicker()/outside-click-detection
  // already position and bounds-check against. Typing is handled by
  // _dobTextInput() (auto-inserts "/" as digits are typed, matching
  // mm/dd/yyyy) and _dobTextCommit() (validates + commits once a full
  // date is typed) below — clicking the calendar icon (or focusing the
  // field at all) still opens the same calendar popover as before, so
  // typing is an addition, not a replacement, for picking a date.
  // The default "mm/dd/yyyy" placeholder doubles as a literal character
  // template: the still-untyped tail of it ("dd/yyyy" once "08/19/" is
  // typed, say) is rendered as one plain grey text run positioned right
  // after whatever's actually been typed, instead of the whole
  // placeholder vanishing at the first keystroke (see _dobMaskHtml). Its
  // position is measured off a hidden mirror span holding the same typed
  // text in the same font (see _dobSyncMask) rather than assumed from
  // character counting — a proportional font's "m"/"d"/"y" don't share a
  // digit's width, so anything that tried to reserve a fixed cell per
  // character (an earlier version of this) drifted out of alignment or
  // had letters overlapping their neighbour; measuring the real rendered
  // width sidesteps that entirely. Only wired up when the placeholder
  // actually IS that template — a caller passing an instructional
  // placeholder instead (not a per-character template) just gets the
  // plain native placeholder, unchanged.
  const useMask = placeholder === 'mm/dd/yyyy'
  const initialOut = value ? label : ''
  const mirrorMaskHtml = useMask ? `
        <span class="dob-mask-mirror" id="${id}-mirror" aria-hidden="true">${esc(initialOut)}</span>
        <span class="dob-picker-mask" id="${id}-mask" aria-hidden="true">${_dobMaskHtml(initialOut)}</span>` : ''
  return `
  <div class="dob-picker" id="${id}-wrap" data-max="${max}" data-min="${min}" data-default-years-ago="${defaultYearsAgo}" data-placeholder="${esc(placeholder)}"
       ${disabledWeekdays.length ? `data-disabled-weekdays='${JSON.stringify(disabledWeekdays)}'` : ''}
       ${disabledDates.length ? `data-disabled-dates='${JSON.stringify(disabledDates)}'` : ''}>
    <input type="hidden" id="${id}" value="${value || ''}"${onchangeAttr}>
    <div id="${id}-trigger" class="${cls} dob-picker-trigger"${styleAttr}>
      <span class="dob-picker-text-wrap">${mirrorMaskHtml}
        <input type="text" class="dob-picker-text${value ? '' : ' placeholder'}" id="${id}-text"
               inputmode="numeric" autocomplete="off" placeholder="${useMask ? '' : esc(placeholder)}" value="${value ? label : ''}"
               oninput="window._dobTextInput('${id}', this)"
               onkeydown="window._dobTextKeydown('${id}', event)"
               onfocus="window.openDobPicker('${id}')"
               onblur="window._dobTextBlur('${id}')">
      </span>
      <button type="button" class="dob-picker-icon-btn" tabindex="-1" onclick="window.toggleDobPicker('${id}')">
        ${icon('calendar', 'icon-sm')}
      </button>
    </div>
  </div>`
}
window.dateFieldHtml = dateFieldHtml

// Date-of-birth fields are just a date picker that, when empty, opens ~25
// years back instead of the current month — so a new field isn't stuck
// 20-30 year-clicks away from a plausible adult birth year. Placeholder
// stays the shared "mm/dd/yyyy" (not "Select date of birth") so every date
// field in the app reads the same way, empty or filled. Thin wrapper kept
// so existing call sites don't need to change.
function dobFieldHtml(id, opts = {}) {
  return dateFieldHtml(id, { defaultYearsAgo: 25, ...opts })
}
window.dobFieldHtml = dobFieldHtml

// The latest a date of birth can be and still make someone 18+ today.
// It must NOT be applied to a staff/admin entering a PATIENT's real date
// of birth (New User → Patient, Add/Edit Patient) — a patient can
// legitimately be a minor (a parent/guardian handles their account), and
// capping those pickers at 18+ used to make it impossible for staff to
// enter a real minor's birthdate anywhere, contradicting registration's
// own error message ("Patients under 18 may be registered by a parent or
// guardian at the clinic") — that promised path didn't actually work.
// Those three just cap at "today" (localDateStr()) — a real DOB, but not
// necessarily an adult's. Registration itself and a patient's own
// Settings > My Profile now allow self-registered minors (13-17 — see
// maxDobFor13() below), so neither of them uses this 18+ cutoff either
// anymore; nothing in the app currently does, but it's kept around as
// the one place this exact "18+ today" math lives if something needs it
// again later.
function maxDobFor18() {
  // localDateStr(), not toISOString() — .toISOString() converts the local
  // midnight this constructs to UTC first, which lands on the previous
  // calendar day in a UTC+8 timezone (the clinic's), shifting the 18+
  // cutoff a day early/late depending on time of day. Same bug as
  // dobPickerRenderPanel's todayIso, above.
  const t = new Date()
  return localDateStr(new Date(t.getFullYear() - 18, t.getMonth(), t.getDate()))
}
window.maxDobFor18 = maxDobFor18

// Same as maxDobFor18() but for the 13-year floor self-registration now
// allows (see regNextStep()/register.php) — used by both registration's
// own DOB picker and a patient's own Settings > My Profile, since a
// self-registered account holder can now legitimately be 13-17.
function maxDobFor13() {
  const t = new Date()
  return localDateStr(new Date(t.getFullYear() - 13, t.getMonth(), t.getDate()))
}
window.maxDobFor13 = maxDobFor13

function _dobFormat(iso) {
  if (!iso) return ''
  const dt = new Date(iso + 'T00:00:00')
  if (isNaN(dt)) return iso
  const mm = String(dt.getMonth() + 1).padStart(2, '0')
  const dd = String(dt.getDate()).padStart(2, '0')
  return `${mm}/${dd}/${dt.getFullYear()}`
}

// Builds the grey "mm/dd/yyyy" tail that's shown after whatever's already
// been typed (see dateFieldHtml's mirrorMaskHtml). `out` is the input's
// own current value — always a strict left-to-right prefix of the
// template (built the same way, slashes and all, by
// _dobTextInput/_dobTextCommit/the calendar picker) — so the untyped
// remainder is just the template's own tail past that length. Rendered as
// one plain text run (not split into per-character cells — a
// proportional font's letters don't share a digit's width, so an earlier
// version that tried to size each character individually kept drifting
// out of alignment or overlapping); its next real digit position (after
// skipping an auto-inserted "/", never something the user actually
// types) is wrapped in its own span so CSS can mark it as the current
// typing position without disturbing the rest of the run's normal flow.
const DOB_MASK_TEMPLATE = 'mm/dd/yyyy'
function _dobMaskHtml(out) {
  out = out || ''
  const remaining = DOB_MASK_TEMPLATE.slice(out.length)
  if (!remaining) return ''
  let activeIdx = remaining.search(/[^/]/)
  if (activeIdx === -1) activeIdx = 0
  const before = esc(remaining.slice(0, activeIdx))
  const active = esc(remaining.slice(activeIdx, activeIdx + 1))
  const after  = esc(remaining.slice(activeIdx + 1))
  return `${before}<span class="dob-mask-active">${active}</span>${after}`
}
window._dobMaskHtml = _dobMaskHtml

// Re-renders the mask tail from whatever the real text input currently
// holds, and repositions it to start exactly where that typed text ends —
// measured off a hidden mirror span holding the same text in the same
// font (offsetWidth), not assumed from character counts, so it's pixel-
// accurate regardless of what's actually been typed. No-op when the
// field wasn't built with the mask (custom instructional placeholders
// like the old "Select date of birth" have no -mask/-mirror span at all)
// — every place that writes ${id}-text.value calls this right after, so
// all three (input, mirror, mask) never drift out of sync.
function _dobSyncMask(id) {
  const mask   = document.getElementById(id + '-mask')
  const mirror = document.getElementById(id + '-mirror')
  const text   = document.getElementById(id + '-text')
  if (!mask || !mirror || !text) return
  const out = text.value || ''
  mirror.textContent = out
  mask.style.left = mirror.offsetWidth + 'px'
  mask.innerHTML = _dobMaskHtml(out)
}
window._dobSyncMask = _dobSyncMask

// ── Keyboard typing into the date field, alongside the calendar ───
// Auto-inserts "/" as digits are typed (matching mm/dd/yyyy) — same spirit
// as a native date input's segment auto-advance, but for a plain text
// field. Non-digit characters are dropped rather than rejected outright,
// so pasting a slash-formatted date ("08/19/2008") still works.
function _dobTextInput(id, el) {
  const digits = el.value.replace(/\D/g, '').slice(0, 8)
  let out = digits.slice(0, 2)
  if (digits.length > 2) out += '/' + digits.slice(2, 4)
  if (digits.length > 4) out += '/' + digits.slice(4, 8)
  el.value = out
  el.classList.toggle('placeholder', !out)
  _dobSyncMask(id)
  if (digits.length === 8) _dobTextCommit(id, el)
}
window._dobTextInput = _dobTextInput

function _dobTextKeydown(id, e) {
  if (e.key === 'Enter') { e.preventDefault(); _dobTextCommit(id, e.target); closeDobPicker() }
  else if (e.key === 'Escape') { closeDobPicker() }
}
window._dobTextKeydown = _dobTextKeydown

// Parses the typed mm/dd/yyyy text, validates it's a real calendar date
// (rejects e.g. 02/30/2020) within the field's min/max, and — only if
// valid — commits it exactly like picking a day from the calendar does:
// same hidden-input update + 'change' event, and syncs the calendar panel
// to that month/year if it's currently open. An incomplete typed value is
// left alone rather than errored on mid-edit; only a genuinely invalid
// *complete* date gets the .error treatment.
function _dobTextCommit(id, el) {
  el = el || document.getElementById(id + '-text')
  const wrap    = document.getElementById(id + '-wrap')
  const trigger = document.getElementById(id + '-trigger')
  if (!el || !wrap) return
  const m = (el.value || '').match(/^(\d{2})\/(\d{2})\/(\d{4})$/)
  if (!m) return
  const [, mm, dd, yyyy] = m
  const iso = `${yyyy}-${mm}-${dd}`
  const dt  = new Date(iso + 'T00:00:00')
  const validCalendarDate = !isNaN(dt) && dt.getFullYear() === +yyyy && dt.getMonth() === +mm - 1 && dt.getDate() === +dd
  const maxIso = wrap.dataset.max, minIso = wrap.dataset.min
  const inRange = (!maxIso || iso <= maxIso) && (!minIso || iso >= minIso)
  if (!validCalendarDate || !inRange) {
    if (trigger) trigger.classList.add('error')
    return
  }
  if (trigger) trigger.classList.remove('error')
  const hidden = document.getElementById(id)
  if (hidden) { hidden.value = iso; hidden.dispatchEvent(new Event('change', { bubbles: true })) }
  el.classList.remove('placeholder')
  if (_dobOpenId === id) {
    _dobState.year  = +yyyy
    _dobState.month = +mm - 1
    _dobRenderPanel()
  }
}
window._dobTextCommit = _dobTextCommit

// Leaving the field with an incomplete/garbled typed value (e.g. tabbed
// away after only typing "08/19") reverts the visible text back to
// whatever was last actually committed, instead of leaving a half-typed
// value sitting there that doesn't match the real underlying date.
function _dobTextBlur(id) {
  const el     = document.getElementById(id + '-text')
  const hidden = document.getElementById(id)
  if (!el || !hidden) return
  if (/^\d{2}\/\d{2}\/\d{4}$/.test(el.value || '')) return // already committed above
  el.value = hidden.value ? _dobFormat(hidden.value) : ''
  el.classList.toggle('placeholder', !hidden.value)
  _dobSyncMask(id)
  const trigger = document.getElementById(id + '-trigger')
  if (trigger) trigger.classList.remove('error')
}
window._dobTextBlur = _dobTextBlur

let _dobOpenId = null
let _dobState  = {}
let _dobSubOpen = null  // 'month' | 'year' | null — which mini dropdown in the calendar head (if any) is open
let _dobSubHighlight = -1  // keyboard cursor row within whichever mini dropdown is open

function toggleDobPicker(id) {
  if (_dobOpenId === id) { closeDobPicker(); return }
  openDobPicker(id)
}
window.toggleDobPicker = toggleDobPicker

function openDobPicker(id) {
  const wrap    = document.getElementById(id + '-wrap')
  const trigger = document.getElementById(id + '-trigger')
  const hidden  = document.getElementById(id)
  if (!wrap || !trigger || !hidden) return

  closeDobPicker() // only one open at a time
  if (window.closeTimePicker) window.closeTimePicker()

  const maxIso = wrap.dataset.max || ''
  const minIso = wrap.dataset.min || ''
  const defaultYearsAgo = parseInt(wrap.dataset.defaultYearsAgo || '0', 10)
  let disabledWeekdays = []
  let disabledDates    = []
  try { disabledWeekdays = wrap.dataset.disabledWeekdays ? JSON.parse(wrap.dataset.disabledWeekdays) : [] } catch (_) {}
  try { disabledDates    = wrap.dataset.disabledDates    ? JSON.parse(wrap.dataset.disabledDates)    : [] } catch (_) {}
  const today  = new Date()
  const seedIso = hidden.value || ''
  let y, m
  if (seedIso) {
    const [sy, sm] = seedIso.split('-').map(Number)
    y = sy; m = sm - 1
  } else if (defaultYearsAgo) {
    // No value yet, and this field wants a non-zero offset (e.g. DOB fields
    // default ~25 years back) — start there instead of the current month,
    // so the user isn't stuck spinning the year selector 20-30 times to
    // reach a usable range.
    y = today.getFullYear() - defaultYearsAgo
    m = today.getMonth()
  } else if (maxIso && maxIso !== 'none' && new Date(maxIso + 'T00:00:00') < today) {
    // No offset configured, but the field's upper bound is in the past
    // (e.g. registration's DOB field, capped at "18 years ago" — built as
    // static HTML rather than via dobFieldHtml(), so it has no
    // data-default-years-ago). Today's month would land on a page where
    // every day — and the year itself — is out of range and disabled, so
    // anchor to the most recent selectable date instead.
    const maxDate = new Date(maxIso + 'T00:00:00')
    y = maxDate.getFullYear(); m = maxDate.getMonth()
  } else {
    // Generic date field with no value yet — today's month is the sensible
    // default (Block Date, a report range, an exam date, etc. are all
    // near-today actions, unlike a birthdate).
    y = today.getFullYear()
    m = today.getMonth()
  }

  _dobOpenId       = id
  _dobState        = { year: y, month: m, maxIso, minIso, disabledWeekdays, disabledDates }
  _dobSubOpen      = null
  _dobSubHighlight = -1
  trigger.classList.add('open')

  let pop = document.getElementById('dob-popover-root')
  if (!pop) {
    pop = document.createElement('div')
    pop.id = 'dob-popover-root'
    pop.className = 'dob-picker-popover'
    document.body.appendChild(pop)
  }
  pop.style.display = 'block'
  _dobRenderPanel()
  _dobPositionPopover(trigger)

  // Close on outside click / Escape / page scroll — a popover left pinned to
  // a coordinate the trigger has since scrolled away from (e.g. inside a
  // scrollable modal body) would otherwise look broken/detached. Scrolling
  // *inside* the popover itself (the calendar's own month/year mini
  // dropdowns) must NOT close it — same reasoning, and same pop.contains()
  // guard, as the custom select's _custScrollGuard.
  setTimeout(() => {
    document.addEventListener('mousedown', _dobOutsideClick, true)
    document.addEventListener('keydown', _dobKeyNav, true)
    window.addEventListener('scroll', _dobScrollGuard, true)
    window.addEventListener('resize', closeDobPicker, true)
  }, 0)
}
window.openDobPicker = openDobPicker

function _dobScrollGuard(e) {
  const pop = document.getElementById('dob-popover-root')
  if (pop && pop.contains(e.target)) return // scrolling the calendar's own content — stay open
  closeDobPicker()
}

function _dobOutsideClick(e) {
  const pop = document.getElementById('dob-popover-root')
  if (!pop || !_dobOpenId) return
  if (pop.contains(e.target)) {
    // Inside the calendar popover: a click that isn't on the open month/year
    // mini dropdown (e.g. on a day cell or blank space in the head) should
    // still close that mini dropdown so it doesn't linger open, without
    // closing the whole calendar.
    if (_dobSubOpen && !(e.target.closest && e.target.closest('.dob-mini-select'))) {
      _dobSubOpen = null
      _dobSubHighlight = -1
      _dobRenderPanel()
    }
    return
  }
  if (e.target.closest && e.target.closest('#' + _dobOpenId + '-trigger')) return
  closeDobPicker()
}
// Keyboard handling for the whole calendar popover. When a month/year mini
// dropdown is open, arrow keys move its highlighted row, Enter/Space picks
// it, and Escape closes just that dropdown (not the whole calendar) — same
// "closest layer first" behavior a native nested popup would have. With no
// mini dropdown open, Escape closes the calendar itself.
function _dobKeyNav(e) {
  if (_dobSubOpen) {
    const isMonth = _dobSubOpen === 'month'
    const { maxIso, minIso } = _dobState
    const maxDate = maxIso ? new Date(maxIso + 'T00:00:00') : new Date()
    const yearMax = maxDate.getFullYear()
    const minDate = minIso ? new Date(minIso + 'T00:00:00') : null
    const yearMin = minDate ? minDate.getFullYear() : yearMax - 100
    const count = isMonth ? 12 : Math.max(1, yearMax - yearMin + 1)

    if (e.key === 'Escape') { e.preventDefault(); _dobSubOpen = null; _dobSubHighlight = -1; _dobRenderPanel(); return }
    if (e.key === 'ArrowDown') { e.preventDefault(); _dobSubHighlight = Math.min(count - 1, _dobSubHighlight + 1); _dobSubMoveHighlight(_dobSubHighlight); return }
    if (e.key === 'ArrowUp')   { e.preventDefault(); _dobSubHighlight = Math.max(0, _dobSubHighlight - 1); _dobSubMoveHighlight(_dobSubHighlight); return }
    if (e.key === 'Home')      { e.preventDefault(); _dobSubHighlight = 0; _dobSubMoveHighlight(_dobSubHighlight); return }
    if (e.key === 'End')       { e.preventDefault(); _dobSubHighlight = count - 1; _dobSubMoveHighlight(_dobSubHighlight); return }
    if (e.key === 'Enter' || e.key === ' ') {
      e.preventDefault()
      if (isMonth) dobPickerSetMonth(_dobSubHighlight)
      else dobPickerSetYear(yearMax - _dobSubHighlight)
      return
    }
    return // swallow other keys while a mini dropdown is open
  }
  if (e.key === 'Escape') closeDobPicker()
}

// Moves the keyboard cursor by toggling classes on the rows already in the
// DOM, instead of _dobRenderPanel()'s full innerHTML rebuild — same fix and
// same reasoning as the main custom select's _custMoveHighlight().
function _dobSubMoveHighlight(index) {
  const pop = document.getElementById('dob-popover-root')
  if (!pop) return
  const list = pop.querySelector('.dob-mini-popover')
  if (!list) return
  const items = list.querySelectorAll('.dob-mini-item')
  items.forEach((el, i) => el.classList.toggle('highlighted', i === index))
  const hi = items[index]
  if (hi) hi.scrollIntoView({ block: 'nearest' })
}

function closeDobPicker() {
  const pop = document.getElementById('dob-popover-root')
  if (pop) pop.style.display = 'none'
  if (_dobOpenId) {
    const trigger = document.getElementById(_dobOpenId + '-trigger')
    if (trigger) trigger.classList.remove('open')
  }
  _dobOpenId       = null
  _dobSubOpen      = null
  _dobSubHighlight = -1
  document.removeEventListener('mousedown', _dobOutsideClick, true)
  document.removeEventListener('keydown', _dobKeyNav, true)
  window.removeEventListener('scroll', _dobScrollGuard, true)
  window.removeEventListener('resize', closeDobPicker, true)
}
window.closeDobPicker = closeDobPicker

function _dobPositionPopover(trigger) {
  const pop = document.getElementById('dob-popover-root')
  if (!pop) return
  const rect = trigger.getBoundingClientRect()
  const popW = pop.offsetWidth  || 280
  const popH = pop.offsetHeight || 320
  let left = rect.left
  let top  = rect.bottom + 6
  if (left + popW > window.innerWidth - 12) left = Math.max(12, window.innerWidth - popW - 12)
  if (top + popH > window.innerHeight - 12) top  = Math.max(12, rect.top - popH - 6)
  pop.style.left = left + 'px'
  pop.style.top  = top + 'px'
}

function _dobRenderPanel() {
  const pop = document.getElementById('dob-popover-root')
  if (!pop || !_dobOpenId) return
  const { year, month, maxIso, minIso, disabledWeekdays = [], disabledDates = [] } = _dobState
  // maxIso === 'none' is an explicit opt-out (exam wizard's date fields —
  // Examination/Follow-up/Dispensed Date) from the otherwise-default
  // cap-at-today behavior below; maxDate stays null so no day is ever
  // disabled as "in the future".
  const maxDate = maxIso === 'none' ? null : (maxIso ? new Date(maxIso + 'T00:00:00') : new Date())
  const minDate = minIso ? new Date(minIso + 'T00:00:00') : null

  const monthNames = ['January','February','March','April','May','June','July','August','September','October','November','December']
  const yearMax = maxDate ? maxDate.getFullYear() : new Date().getFullYear() + 10
  const yearMin = minDate ? minDate.getFullYear() : yearMax - 100
  const years = []
  for (let y = yearMax; y >= yearMin; y--) years.push(y)

  const firstDow  = new Date(year, month, 1).getDay()
  const daysInMon = new Date(year, month + 1, 0).getDate()
  const hidden    = document.getElementById(_dobOpenId)
  const selIso    = hidden ? hidden.value : ''
  // localDateStr(), not toISOString() — the latter is UTC, which during
  // early-morning hours in a UTC+8 timezone (the clinic's) is still
  // "yesterday", making the calendar highlight the wrong day as today.
  const todayIso  = localDateStr()

  const WEEKDAY_NAMES = ['Sunday','Monday','Tuesday','Wednesday','Thursday','Friday','Saturday']
  let cells = ''
  for (let i = 0; i < firstDow; i++) cells += `<div class="dob-day dob-day-empty"></div>`
  for (let d = 1; d <= daysInMon; d++) {
    const iso = `${year}-${String(month + 1).padStart(2, '0')}-${String(d).padStart(2, '0')}`
    const dateObj = new Date(year, month, d)
    const disabled = (maxDate && dateObj > maxDate) || (minDate && dateObj < minDate)
      || disabledWeekdays.includes(WEEKDAY_NAMES[dateObj.getDay()])
      || disabledDates.includes(iso)
    const cls = ['dob-day']
    if (disabled) cls.push('dob-day-disabled')
    if (iso === selIso)   cls.push('dob-day-selected')
    if (iso === todayIso) cls.push('dob-day-today')
    cells += `<div class="${cls.join(' ')}" ${disabled ? '' : `onclick="window.dobPickerSelectDay('${iso}')"`}>${d}</div>`
  }

  // Month/year selectors are our own popover-style dropdowns, not native
  // <select> elements — a native select's open option list is rendered by
  // the OS/browser and can't be restyled, so it would look inconsistent
  // sitting inside our custom calendar. Each renders its option list inline
  // (not via openCustSelect()) because that component enforces "only one
  // popover open at a time" against the DOB picker itself — nesting one
  // inside the other would immediately close the calendar it lives in.
  const monthOpen = _dobSubOpen === 'month'
  const yearOpen  = _dobSubOpen === 'year'
  pop.innerHTML = `
    <div class="dob-picker-head">
      <div class="dob-mini-select">
        <button type="button" class="dob-picker-select${monthOpen ? ' open' : ''}" onclick="window.dobPickerToggleSub('month')" onkeydown="window.dobPickerSubTriggerKey(event,'month')">${monthNames[month]}</button>
        ${monthOpen ? `<div class="dob-mini-popover" role="listbox">${monthNames.map((mn, i) => `<div class="dob-mini-item${i === month ? ' selected' : ''}${i === _dobSubHighlight ? ' highlighted' : ''}" role="option" aria-selected="${i === month}" onclick="window.dobPickerSetMonth(${i})">${mn}</div>`).join('')}</div>` : ''}
      </div>
      <div class="dob-mini-select">
        <button type="button" class="dob-picker-select${yearOpen ? ' open' : ''}" onclick="window.dobPickerToggleSub('year')" onkeydown="window.dobPickerSubTriggerKey(event,'year')">${year}</button>
        ${yearOpen ? `<div class="dob-mini-popover" role="listbox">${years.map((y, i) => `<div class="dob-mini-item${y === year ? ' selected' : ''}${i === _dobSubHighlight ? ' highlighted' : ''}" role="option" aria-selected="${y === year}" onclick="window.dobPickerSetYear(${y})">${y}</div>`).join('')}</div>` : ''}
      </div>
    </div>
    <div class="dob-picker-grid">
      ${['Su','Mo','Tu','We','Th','Fr','Sa'].map(d => `<div class="dob-picker-hdr">${d}</div>`).join('')}
      ${cells}
    </div>`

  if (_dobSubOpen) {
    // Follow the keyboard cursor first (it moves independently of the
    // picked value), falling back to the selected row when nothing has
    // been highlighted yet (e.g. right after opening via mouse click).
    const hi = pop.querySelector('.dob-mini-item.highlighted') || pop.querySelector('.dob-mini-popover .selected')
    if (hi) hi.scrollIntoView({ block: 'nearest' })
  }
}

// Opens/closes the month or year mini dropdown in the calendar head —
// mutually exclusive with each other (opening one closes the other) but
// independent of the outer calendar popover, which stays open throughout.
function dobPickerToggleSub(which) {
  if (_dobSubOpen === which) { _dobSubOpen = null; _dobSubHighlight = -1; _dobRenderPanel(); return }
  _dobSubOpen = which
  // Seed the keyboard cursor at the currently-shown month/year so arrow
  // keys continue from there instead of jumping to the top of the list.
  if (which === 'month') {
    _dobSubHighlight = _dobState.month
  } else {
    const { maxIso } = _dobState
    const yearMax = (maxIso ? new Date(maxIso + 'T00:00:00') : new Date()).getFullYear()
    _dobSubHighlight = yearMax - _dobState.year
  }
  _dobRenderPanel()
}
window.dobPickerToggleSub = dobPickerToggleSub

// Arrow-down/up on a closed mini-dropdown trigger opens it and starts
// keyboard navigation, same as the main custom select's trigger key.
function dobPickerSubTriggerKey(e, which) {
  if (e.key === 'ArrowDown' || e.key === 'ArrowUp') {
    e.preventDefault()
    if (_dobSubOpen !== which) dobPickerToggleSub(which)
  }
}
window.dobPickerSubTriggerKey = dobPickerSubTriggerKey

function dobPickerSetMonth(m) {
  _dobState.month = Number(m)
  _dobSubOpen = null
  _dobSubHighlight = -1
  _dobRenderPanel()
  const trigger = document.getElementById(_dobOpenId + '-trigger')
  if (trigger) _dobPositionPopover(trigger)
}
window.dobPickerSetMonth = dobPickerSetMonth

function dobPickerSetYear(y) {
  _dobState.year = Number(y)
  _dobSubOpen = null
  _dobSubHighlight = -1
  _dobRenderPanel()
  const trigger = document.getElementById(_dobOpenId + '-trigger')
  if (trigger) _dobPositionPopover(trigger)
}
window.dobPickerSetYear = dobPickerSetYear

function dobPickerSelectDay(iso) {
  const id = _dobOpenId
  if (!id) return
  const hidden  = document.getElementById(id)
  const trigger = document.getElementById(id + '-trigger')
  const text    = document.getElementById(id + '-text')
  if (hidden) { hidden.value = iso; hidden.dispatchEvent(new Event('change', { bubbles: true })) }
  if (text)   { text.value = _dobFormat(iso); text.classList.remove('placeholder') }
  _dobSyncMask(id)
  if (trigger) trigger.classList.remove('error')
  closeDobPicker()
}
window.dobPickerSelectDay = dobPickerSelectDay

// Clears a DOB field back to empty/placeholder — used wherever a form
// reset previously just did `el.value = ''` on the old native input.
function resetDobField(id) {
  setDateFieldValue(id, '')
  const trigger = document.getElementById(id + '-trigger')
  if (trigger) trigger.classList.remove('error')
}
window.resetDobField = resetDobField

// Programmatically set a date field's value from outside the picker (e.g.
// resetting a Reports date range, or any code that used to do
// `el.value = iso` on the old native <input type="date">). Setting the
// hidden input's .value directly does NOT update the visible label span —
// this does both, and fires the same 'change' event the calendar does.
function setDateFieldValue(id, iso) {
  const wrap    = document.getElementById(id + '-wrap')
  const hidden  = document.getElementById(id)
  const text    = document.getElementById(id + '-text')
  if (!hidden) return
  hidden.value = iso || ''
  hidden.dispatchEvent(new Event('change', { bubbles: true }))
  if (text) {
    if (iso) { text.value = _dobFormat(iso); text.classList.remove('placeholder') }
    else     { text.value = ''; text.classList.add('placeholder') }
  }
  _dobSyncMask(id)
}
window.setDateFieldValue = setDateFieldValue

// Updates a DOB field's allowed max date after the fact — e.g. the 18+
// cutoff on the registration page, recomputed every time that form opens.
function setDobFieldMax(id, maxIso) {
  const wrap = document.getElementById(id + '-wrap')
  if (wrap) wrap.dataset.max = maxIso || ''
}
window.setDobFieldMax = setDobFieldMax

// ════════════════════════════════════════════════════════════════
//  CUSTOM SELECT — replaces native <select> everywhere in the app. A
//  native <select> with many options (e.g. a 30-48 slot time list)
//  renders as the OS's own listbox, which can swallow nearly the whole
//  viewport height on open, and even short lists look visually
//  inconsistent with the rest of the UI. This renders a compact,
//  capped-height, scrollable popover instead, matching the DOB picker's
//  visual language. Same technique: a same-id hidden <input> keeps
//  holding the raw value, so every existing gv(id)/.value read across
//  the app keeps working unchanged — and any onchange="..." the old
//  <select> had moves onto that hidden input verbatim, firing exactly
//  the same way when a real 'change' event is dispatched on it.
// ════════════════════════════════════════════════════════════════
function selectFieldHtml(id, opts = {}) {
  const { value = '', options = [], placeholder = 'Select…', cls = 'form-input', onchange = '', style = '', minWidth = 160 } = opts
  // Normalize to [{value,label}] — a plain string option is its own value+label.
  const norm = options.map(o => (o && typeof o === 'object')
    ? { value: String(o.value), label: String(o.label) }
    : { value: String(o), label: String(o) })
  const current = norm.find(o => o.value === String(value))
  const label   = current ? current.label : placeholder
  const onchangeAttr = onchange ? ` onchange="${esc(onchange)}"` : ''
  const styleAttr = style ? ` style="${esc(style)}"` : ''
  return `
  <div class="cust-select" id="${id}-wrap" data-options='${JSON.stringify(norm).replace(/'/g, '&#39;')}' data-placeholder="${esc(placeholder)}" data-min-width="${minWidth}">
    <input type="hidden" id="${id}" value="${esc(value ?? '')}"${onchangeAttr}>
    <button type="button" id="${id}-trigger" class="${cls} cust-select-trigger"${styleAttr}
            role="combobox" aria-haspopup="listbox" aria-expanded="false" aria-controls="cust-select-popover-root"
            onclick="window.toggleCustSelect('${id}')" onkeydown="window.custSelectTriggerKey(event,'${id}')">
      <span class="cust-select-text${current ? '' : ' placeholder'}" id="${id}-text">${esc(label)}</span>
      ${icon('chevron-down', 'icon-sm')}
    </button>
  </div>`
}
window.selectFieldHtml = selectFieldHtml

// Time-of-day fields (Consultation Settings' clinic hours, break times,
// reminder/deadline times) are just a custom select whose options happen
// to be "h:mm AM/PM" strings — thin wrapper kept so existing call sites
// (and the "Select time" default placeholder) don't need to change.
function timeFieldHtml(id, opts = {}) {
  return selectFieldHtml(id, { placeholder: 'Select time', ...opts })
}
window.timeFieldHtml = timeFieldHtml

// Shared "h:mm AM/PM" option list for timeFieldHtml(), capped to a
// plausible 7 AM–9:30 PM business-hours window in 30-min steps — the same
// list Consultation Settings' own clinic morning/afternoon open/close
// pickers use (pages.js's sectionConsultation(), whose local timeOpts()
// now just calls this), so a doctor's individual schedule Start/End Time
// (openSetScheduleModal() below) is always picking from the exact same
// selectable times as the clinic's own hours setup instead of free text
// that could drift out of step with it.
function clinicTimeOpts() {
  const slots = []
  for (let h = 7; h <= 21; h++) {
    for (const m of [0, 30]) {
      const hh   = h % 12 === 0 ? 12 : h % 12
      const ampm = h < 12 ? 'AM' : 'PM'
      slots.push(`${hh}:${m === 0 ? '00' : '30'} ${ampm}`)
    }
  }
  return slots
}
window.clinicTimeOpts = clinicTimeOpts

// Same "h:mm AM/PM" list, but bounded to the clinic's OWN already-
// configured operating hours (Consultation Settings' morning start /
// afternoon end) instead of the generic 7 AM–9:30 PM business-hours
// window — used specifically for a doctor's individual Start/End Time in
// the Doctor Schedule modal (openSetScheduleModal() below), since a
// doctor obviously can't be scheduled before the clinic opens or after it
// closes. clinicTimeOpts() itself stays the wider generic range because
// Consultation Settings' own morning/afternoon pickers use it to DEFINE
// those hours in the first place — they can't be bounded by the very
// setting they're setting. Falls back to the generic range if the clinic
// hours haven't loaded/parsed yet, rather than handing back an empty picker.
function doctorScheduleTimeOpts() {
  const startMin = _clockToMinutes(consultationSettings.morningStart)
  const endMin   = _clockToMinutes(consultationSettings.afternoonEnd)
  if (startMin == null || endMin == null || endMin <= startMin) return clinicTimeOpts()
  const out = []
  for (let t = startMin; t <= endMin; t += 30) out.push(_minutesToClock(t))
  return out
}
window.doctorScheduleTimeOpts = doctorScheduleTimeOpts

let _custOpenId = null
let _custHighlight = -1  // index of the keyboard-highlighted row, independent of the picked value
let _custTypeahead  = ''
let _custTypeaheadT = null

function toggleCustSelect(id) {
  if (_custOpenId === id) { closeCustSelect(); return }
  openCustSelect(id)
}
window.toggleCustSelect = toggleCustSelect

// Arrow-down/up on the *closed* trigger opens the popover and starts
// keyboard navigation — the same expectation a native <select> sets up.
// Enter/Space already work for free: a <button> fires its onclick on
// either key natively, no extra wiring needed for those two.
function custSelectTriggerKey(e, id) {
  if (e.key === 'ArrowDown' || e.key === 'ArrowUp') {
    e.preventDefault()
    if (_custOpenId !== id) openCustSelect(id)
  }
}
window.custSelectTriggerKey = custSelectTriggerKey

function openCustSelect(id) {
  const wrap    = document.getElementById(id + '-wrap')
  const trigger = document.getElementById(id + '-trigger')
  const hidden  = document.getElementById(id)
  if (!wrap || !trigger || !hidden) return

  closeCustSelect() // only one open at a time
  if (window.closeDobPicker) window.closeDobPicker()

  let options = []
  try { options = JSON.parse(wrap.dataset.options || '[]') } catch (_) {}

  _custOpenId    = id
  _custHighlight = Math.max(0, options.findIndex(o => o.value === hidden.value))
  trigger.classList.add('open')
  trigger.setAttribute('aria-expanded', 'true')

  let pop = document.getElementById('cust-select-popover-root')
  if (!pop) {
    pop = document.createElement('div')
    pop.id = 'cust-select-popover-root'
    pop.className = 'cust-select-popover'
    pop.setAttribute('role', 'listbox')
    document.body.appendChild(pop)
  }
  pop.style.display = 'block'
  _custRenderPanel()
  _custPositionPopover(trigger)

  // Close on outside click / Escape / page scroll — same reasoning as the
  // DOB picker: a popover left pinned to a stale coordinate (e.g. the
  // trigger scrolled away inside a modal body) would otherwise look
  // detached. Scrolling *inside* the popover's own option list must NOT
  // close it — 'scroll' events don't bubble, but a capture-phase listener
  // on window still sees them on the way down to their target, so without
  // the pop.contains(e.target) guard, scrolling the list itself would
  // trigger this and close the popover before you could read it.
  setTimeout(() => {
    document.addEventListener('mousedown', _custOutsideClick, true)
    document.addEventListener('keydown', _custKeyNav, true)
    window.addEventListener('scroll', _custScrollGuard, true)
    window.addEventListener('resize', closeCustSelect, true)
  }, 0)
}
window.openCustSelect = openCustSelect

function _custOutsideClick(e) {
  const pop = document.getElementById('cust-select-popover-root')
  if (!pop || !_custOpenId) return
  if (pop.contains(e.target)) return
  if (e.target.closest && e.target.closest('#' + _custOpenId + '-trigger')) return
  closeCustSelect()
}

// Full keyboard navigation for the open popover — arrow keys move the
// highlighted row, Enter picks it, Escape closes, Home/End jump to the
// ends, and typing a letter jumps to the next option starting with it
// (debounced into a short buffer so typing multiple letters in a row
// narrows the match, same as a native <select>'s type-ahead).
function _custKeyNav(e) {
  if (!_custOpenId) return
  const wrap = document.getElementById(_custOpenId + '-wrap')
  if (!wrap) return
  let options = []
  try { options = JSON.parse(wrap.dataset.options || '[]') } catch (_) {}
  if (!options.length) { if (e.key === 'Escape') closeCustSelect(); return }

  if (e.key === 'Escape') { e.preventDefault(); closeCustSelect(); return }
  if (e.key === 'Enter' || e.key === ' ') { e.preventDefault(); custSelectPick(_custHighlight); return }
  if (e.key === 'ArrowDown') { e.preventDefault(); _custHighlight = Math.min(options.length - 1, _custHighlight + 1); _custMoveHighlight(_custHighlight); return }
  if (e.key === 'ArrowUp')   { e.preventDefault(); _custHighlight = Math.max(0, _custHighlight - 1); _custMoveHighlight(_custHighlight); return }
  if (e.key === 'Home')      { e.preventDefault(); _custHighlight = 0; _custMoveHighlight(_custHighlight); return }
  if (e.key === 'End')       { e.preventDefault(); _custHighlight = options.length - 1; _custMoveHighlight(_custHighlight); return }

  if (e.key.length === 1 && /\S/.test(e.key)) {
    e.preventDefault()
    clearTimeout(_custTypeaheadT)
    _custTypeahead += e.key.toLowerCase()
    _custTypeaheadT = setTimeout(() => { _custTypeahead = '' }, 600)
    const match = options.findIndex(o => o.label.toLowerCase().startsWith(_custTypeahead))
    if (match !== -1) { _custHighlight = match; _custMoveHighlight(_custHighlight) }
  }
}

// Moves the keyboard cursor by toggling classes on the rows already in the
// DOM, instead of _custRenderPanel()'s full innerHTML rebuild. A full
// rebuild recreates the popover's own DOM node on every arrow-key press,
// which retriggers its CSS entrance animation each time — visually the
// whole list looked like it was "reopening" on every keystroke instead of
// the highlight just moving. The animation should only play once, on the
// initial open (still a full render via openCustSelect/custSelectPick).
function _custMoveHighlight(index) {
  const pop = document.getElementById('cust-select-popover-root')
  if (!pop) return
  const items = pop.querySelectorAll('.cust-select-item')
  items.forEach((el, i) => el.classList.toggle('highlighted', i === index))
  const trigger = document.getElementById(_custOpenId + '-trigger')
  if (trigger) trigger.setAttribute('aria-activedescendant', 'cust-opt-' + index)
  const hi = items[index]
  if (hi) hi.scrollIntoView({ block: 'nearest' })
}

function _custScrollGuard(e) {
  const pop = document.getElementById('cust-select-popover-root')
  if (pop && pop.contains(e.target)) return // scrolling the option list itself — stay open
  closeCustSelect()
}

function closeCustSelect() {
  const pop = document.getElementById('cust-select-popover-root')
  if (pop) pop.style.display = 'none'
  if (_custOpenId) {
    const trigger = document.getElementById(_custOpenId + '-trigger')
    if (trigger) { trigger.classList.remove('open'); trigger.setAttribute('aria-expanded', 'false') }
  }
  _custOpenId    = null
  _custHighlight = -1
  document.removeEventListener('mousedown', _custOutsideClick, true)
  document.removeEventListener('keydown', _custKeyNav, true)
  window.removeEventListener('scroll', _custScrollGuard, true)
  window.removeEventListener('resize', closeCustSelect, true)
}
window.closeCustSelect = closeCustSelect
// Old name kept as an alias — a handful of call sites (and this session's
// own earlier work) still reference the time-specific names directly.
window.toggleTimePicker = toggleCustSelect
window.closeTimePicker  = closeCustSelect

function _custPositionPopover(trigger) {
  const pop = document.getElementById('cust-select-popover-root')
  if (!pop) return
  const rect = trigger.getBoundingClientRect()
  // Per-field floor (selectFieldHtml's minWidth option, default 160) — most
  // selects want that so short option lists ("All Roles" etc.) still read
  // comfortably, but a couple-digits-wide field like pagination's rows-per-
  // page shouldn't be forced into a popover 2-3x its own trigger's width.
  const wrap    = trigger.closest('.cust-select')
  const minW    = wrap ? parseInt(wrap.dataset.minWidth, 10) || 160 : 160
  const popW = Math.max(rect.width, minW)
  const popH = pop.offsetHeight || 260
  let left = rect.left
  let top  = rect.bottom + 6
  if (left + popW > window.innerWidth - 12) left = Math.max(12, window.innerWidth - popW - 12)
  if (top + popH > window.innerHeight - 12) top  = Math.max(12, rect.top - popH - 6)
  pop.style.left  = left + 'px'
  pop.style.top   = top + 'px'
  pop.style.width = popW + 'px'
}

function _custRenderPanel() {
  const pop    = document.getElementById('cust-select-popover-root')
  const wrap   = document.getElementById(_custOpenId + '-wrap')
  const hidden = document.getElementById(_custOpenId)
  if (!pop || !wrap || !hidden) return

  let options = []
  try { options = JSON.parse(wrap.dataset.options || '[]') } catch (_) {}
  const selected = hidden.value
  if (_custHighlight < 0 || _custHighlight >= options.length) _custHighlight = 0

  // Selected by index (not by re-embedding the raw value in the onclick
  // string) — sidesteps any quote/escaping issues for values that aren't
  // simple tokens (patient names, free-text labels, etc). role="option" +
  // aria-selected mirror a native <select>'s listbox semantics for screen
  // readers; .highlighted (the keyboard cursor) is a separate visual ring
  // from .selected (the picked value) so both can be true on one row.
  //
  // Deliberately NOT wired to onmouseenter: mouse hover only ever gets
  // plain CSS :hover feedback (no JS, no re-render). Hovering the mouse
  // was previously also moving the keyboard cursor and re-rendering this
  // whole list on every row it passed over — which meant mouse-wheel
  // scrolling (rows sliding under a stationary cursor fire mouseenter
  // continuously) tore down and rebuilt the scrollable container mid-
  // scroll, snapping scrollTop back to 0 every time. Keyboard nav still
  // drives _custHighlight + auto-scroll below; the mouse no longer does.
  pop.innerHTML = `
    <div class="cust-select-list" role="presentation">
      ${options.map((o, i) => `<div class="cust-select-item${o.value === selected ? ' selected' : ''}${i === _custHighlight ? ' highlighted' : ''}"
             id="cust-opt-${i}" role="option" aria-selected="${o.value === selected}"
             onclick="window.custSelectPick(${i})">${esc(o.label)}</div>`).join('')}
    </div>`

  const trigger = document.getElementById(_custOpenId + '-trigger')
  if (trigger) trigger.setAttribute('aria-activedescendant', 'cust-opt-' + _custHighlight)

  const hi = pop.querySelector('.cust-select-item.highlighted')
  if (hi) hi.scrollIntoView({ block: 'nearest' })
}

function custSelectPick(index) {
  const id = _custOpenId
  if (!id) return
  const wrap = document.getElementById(id + '-wrap')
  if (!wrap) return
  let options = []
  try { options = JSON.parse(wrap.dataset.options || '[]') } catch (_) {}
  const opt = options[index]
  if (!opt) return

  const hidden  = document.getElementById(id)
  const text    = document.getElementById(id + '-text')
  if (hidden) { hidden.value = opt.value; hidden.dispatchEvent(new Event('change', { bubbles: true })) }
  if (text)   { text.textContent = opt.label; text.classList.remove('placeholder') }
  closeCustSelect()
}
window.custSelectPick = custSelectPick
// Old name kept as an alias for the same reason as toggleTimePicker above.
window.timePickerSelect = value => {
  const wrap = document.getElementById(_custOpenId + '-wrap')
  if (!wrap) return
  let options = []
  try { options = JSON.parse(wrap.dataset.options || '[]') } catch (_) {}
  custSelectPick(options.findIndex(o => o.value === value))
}

// Programmatically set a custom-select field's value from outside the
// popover (e.g. an "Add" modal seeding defaults, or code that used to do
// `el.value = x` on the old native <select>). Setting the hidden input's
// .value directly does NOT update the visible label span — this does both,
// and fires the same 'change' event custSelectPick() does.
function setSelectFieldValue(id, value) {
  const wrap   = document.getElementById(id + '-wrap')
  const hidden = document.getElementById(id)
  const text   = document.getElementById(id + '-text')
  if (!hidden) return
  let options = []
  try { options = JSON.parse(wrap?.dataset.options || '[]') } catch (_) {}
  const opt = options.find(o => o.value === String(value))
  hidden.value = opt ? opt.value : String(value ?? '')
  hidden.dispatchEvent(new Event('change', { bubbles: true }))
  if (text) {
    if (opt) { text.textContent = opt.label; text.classList.remove('placeholder') }
    else     { text.textContent = wrap?.dataset.placeholder || 'Select…'; text.classList.add('placeholder') }
  }
}
window.setSelectFieldValue = setSelectFieldValue

// Clears a custom-select field back to its placeholder — mirrors
// resetDobField() above, for code that used to do `el.value = ''`.
function resetSelectField(id) {
  setSelectFieldValue(id, '')
}
window.resetSelectField = resetSelectField

// Swaps a custom-select's option list at runtime — e.g. the exam wizard's
// Lens Type/Material fields switching between eyeglass and contact-lens
// option sets depending on which correction the doctor picked. Always
// resets to the placeholder afterward: a previously-picked value ("CR-39")
// almost never exists in the new option set, and even on the rare case it
// does, silently keeping a value the doctor picked under the *other*
// category would be more confusing than asking them to reselect it.
function setSelectFieldOptions(id, options, placeholder) {
  const wrap = document.getElementById(id + '-wrap')
  if (!wrap) return
  const norm = options.map(o => (o && typeof o === 'object')
    ? { value: String(o.value), label: String(o.label) }
    : { value: String(o), label: String(o) })
  wrap.dataset.options = JSON.stringify(norm)
  if (placeholder !== undefined) wrap.dataset.placeholder = placeholder
  resetSelectField(id)
}
window.setSelectFieldOptions = setSelectFieldOptions

// ════════════════════════════════════════════════════════════════
//  TOAST
// ════════════════════════════════════════════════════════════════
function toast(msg, type = 'success', duration = 3000) {
  const el = document.createElement('div')
  const isSuccess = type === 'success'
  const isError   = type === 'error'
  el.style.cssText = `
    position:fixed;bottom:24px;right:24px;z-index:9999;
    display:flex;align-items:flex-start;gap:10px;
    background:${isError ? '#FEE2E2' : isSuccess ? '#D1FAE5' : '#FFF8F0'};
    color:${isError ? '#991B1B' : isSuccess ? '#065F46' : '#92400E'};
    border:1px solid ${isError ? '#FECACA' : isSuccess ? '#A7F3D0' : '#FFD9A8'};
    padding:12px 18px;border-radius:10px;font-size:.85rem;font-weight:600;line-height:1.5;
    box-shadow:0 8px 24px rgba(0,0,0,.12);
    animation:fadeUp .2s ease forwards;
    max-width:340px;`
  el.innerHTML = `
    <span style="flex-shrink:0;display:flex;margin-top:2px">${icon(isError ? 'alert-circle' : 'check-circle', 'icon-sm')}</span>
    <span>${msg}</span>`
  document.body.appendChild(el)
  setTimeout(() => { el.style.opacity = '0'; el.style.transform = 'translateY(8px)'; el.style.transition = 'opacity .2s,transform .2s'; setTimeout(() => el.remove(), 200) }, duration)
}
window.toast = toast

// ════════════════════════════════════════════════════════════════
//  CONFIRM MODAL
// ════════════════════════════════════════════════════════════════
function showConfirm({ title = 'Confirm', message = '', confirmText = 'Confirm', cancelText = 'Cancel', danger = false, onConfirm, onCancel } = {}) {
  if (!document.getElementById('_cm-styles')) {
    const s = document.createElement('style');
    s.id = '_cm-styles';
    s.textContent = '@keyframes _cmFade{from{opacity:0}to{opacity:1}}@keyframes _cmSlide{from{transform:translateY(18px) scale(.97);opacity:0}to{transform:translateY(0) scale(1);opacity:1}}';
    document.head.appendChild(s);
  }
  const overlay = document.createElement('div');
  overlay.style.cssText = 'position:fixed;inset:0;z-index:99999;display:flex;align-items:center;justify-content:center;padding:20px;background:rgba(0,0,0,.45);backdrop-filter:blur(4px);animation:_cmFade .15s';
  const accentBg  = danger ? '#FEE2E2' : '#FEF3C7';
  const accentClr = danger ? '#DC2626' : '#D97706';
  const btnClass   = danger ? 'btn-danger' : 'btn-primary';
  const iconSvg   = danger
    ? `<svg width="20" height="20" viewBox="0 0 24 24" fill="none" stroke="${accentClr}" stroke-width="2.2" stroke-linecap="round" stroke-linejoin="round"><polyline points="3 6 5 6 21 6"/><path d="M19 6l-1 14H6L5 6"/><path d="M10 11v6M14 11v6M9 6V4h6v2"/></svg>`
    : `<svg width="20" height="20" viewBox="0 0 24 24" fill="none" stroke="${accentClr}" stroke-width="2.2" stroke-linecap="round" stroke-linejoin="round"><circle cx="12" cy="12" r="10"/><line x1="12" y1="8" x2="12" y2="12"/><line x1="12" y1="16" x2="12.01" y2="16"/></svg>`;
  overlay.innerHTML = `
    <div style="background:#fff;border-radius:16px;padding:26px 26px 22px;max-width:360px;width:100%;box-shadow:0 24px 64px rgba(0,0,0,.18),0 4px 16px rgba(0,0,0,.1);animation:_cmSlide .2s cubic-bezier(.34,1.56,.64,1)">
      <div style="display:flex;align-items:center;gap:12px;margin-bottom:12px">
        <div style="width:40px;height:40px;border-radius:10px;background:${accentBg};display:flex;align-items:center;justify-content:center;flex-shrink:0">${iconSvg}</div>
        <div style="font-weight:700;font-size:.95rem;color:#111827;line-height:1.3">${title}</div>
      </div>
      <div style="font-size:.83rem;color:#6B7280;line-height:1.65;margin-bottom:22px">${message}</div>
      <div style="display:flex;gap:8px;justify-content:flex-end">
        <button id="_cm-cancel" style="padding:8px 18px;border-radius:8px;border:1.5px solid #E5E7EB;background:#fff;font-size:.8rem;font-weight:500;color:#374151;cursor:pointer;font-family:inherit;transition:background .12s" onmouseover="this.style.background='#F9FAFB'" onmouseout="this.style.background='#fff'">${cancelText}</button>
        <button id="_cm-confirm" class="${btnClass}" style="padding:8px 18px;font-size:.8rem">${confirmText}</button>
      </div>
    </div>`;
  document.body.appendChild(overlay);
  const close = () => { overlay.style.opacity = '0'; overlay.style.transition = 'opacity .15s'; setTimeout(() => overlay.remove(), 150); };
  overlay.querySelector('#_cm-cancel').onclick  = () => { close(); onCancel  && onCancel();  };
  overlay.querySelector('#_cm-confirm').onclick = () => { close(); onConfirm && onConfirm(); };
  overlay.addEventListener('click', e => { if (e.target === overlay) { close(); onCancel && onCancel(); } });
}
window.showConfirm = showConfirm;

// ════════════════════════════════════════════════════════════════
//  REAL QR CODE — uses QRCode.js (already loaded via CDN)
// ════════════════════════════════════════════════════════════════
let _qrIdCounter = 0

// QRCode.js has no DPI/resolution awareness — asking it for a 120×120
// canvas (this app's typical on-screen size) bakes that same low pixel
// count into the underlying image data, not just its CSS display size.
// downloadQR() below exports that canvas as-is via toDataURL(), so a
// QR meant to be scanned ended up downloaded at a genuinely low native
// resolution — often too coarse for a phone camera to resolve reliably,
// especially after any print/zoom/re-compression. Always render at a
// fixed high native resolution regardless of the requested display size,
// then scale the rendered element down visually via CSS — on-screen
// layout is identical to before, but the real pixel data (and therefore
// any download/print export of it) stays sharp.
const QR_RENDER_SIZE = 512

function mockQRSvg(data, size = 120) {
  const uid  = `_qr${++_qrIdCounter}`
  const safe = (data || 'CANA').replace(/&/g,'&amp;').replace(/"/g,'&quot;')

  function _tryGen(retries) {
    const container = document.getElementById(uid)
    if (!container) return
    if (!window.QRCode) {
      if (retries > 0) setTimeout(() => _tryGen(retries - 1), 200)
      return
    }
    try {
      container.innerHTML = ''
      new window.QRCode(container, {
        text:         data || 'CANA',
        width:        QR_RENDER_SIZE,
        height:       QR_RENDER_SIZE,
        colorDark:    '#1C1C1C',
        colorLight:   '#ffffff',
        correctLevel: window.QRCode.CorrectLevel.M
      })
      // Scale the actual rendered canvas/img down to the intended
      // on-screen size — its real pixel data stays at QR_RENDER_SIZE, so
      // downloadQR()'s toDataURL() export is always full resolution no
      // matter how small this is displayed here.
      const rendered = container.querySelector('canvas, img')
      if (rendered) {
        rendered.style.width  = size + 'px'
        rendered.style.height = size + 'px'
      }
      container.style.background = ''
    } catch (_) {}
  }

  setTimeout(() => _tryGen(10), 80)
  return `<div id="${uid}" data-qr="${safe}" style="width:${size}px;height:${size}px;display:inline-block;background:#f3f4f6;border-radius:4px;overflow:hidden;line-height:0"></div>`
}
window.mockQRSvg = mockQRSvg

// Show QR code modal after patient account is created
function _showRegistrationQRModal(user, tempPassword, alreadyLoggedIn = false) {
  const wrapperId = 'reg-success-qr'
  const qrHtml    = window.mockQRSvg ? window.mockQRSvg(user.qrData, 180) : ''
  showModal(`
    <div class="modal-header" style="border-bottom:none;padding-bottom:0">
      <div class="modal-title" style="display:flex;align-items:center;gap:8px;color:#059669">
        <div style="width:32px;height:32px;border-radius:50%;background:#ECFDF5;display:flex;align-items:center;justify-content:center;flex-shrink:0">
          ${icon('check-circle','icon-sm')}
        </div>
        Account Created!
      </div>
    </div>
    <div class="modal-body" style="text-align:center;padding-top:8px">
      <p style="font-size:.88rem;color:#374151;margin:0 0 4px">Welcome, <strong>${user.firstName}</strong>! Your patient account is now active.</p>
      <p style="font-size:.78rem;color:#6B7280;margin:0 0 18px">Save your unique QR code — present it at the clinic for instant check-in and profile retrieval.</p>
      <div id="${wrapperId}" style="display:inline-block;padding:16px;background:#fff;border:2px solid #E5E7EB;border-radius:12px;margin-bottom:10px">
        ${qrHtml}
      </div>
      <div style="font-size:.72rem;font-family:monospace;color:#9CA3AF;margin-bottom:2px;word-break:break-all">${user.qrData}</div>
      <div style="font-size:.88rem;font-weight:700;color:#1C1C1C;margin-bottom:${tempPassword ? '14px' : '0'}">${user.name} · ${user.id}</div>
      ${tempPassword ? `
      <div style="background:#FFF7ED;border:1px solid #FED7AA;border-radius:8px;padding:10px 14px;font-size:.8rem;color:#92400E;text-align:left;margin-top:10px">
        <strong>Temporary Password:</strong> <code style="font-size:.85rem;background:#fff;padding:2px 6px;border-radius:4px;border:1px solid #FED7AA">${tempPassword}</code>
        <br><span style="font-size:.72rem;color:#B45309;margin-top:3px;display:block">Share this with the patient. They can change it from Settings after logging in.</span>
      </div>` : ''}
    </div>
    <div class="modal-footer" style="justify-content:center;gap:10px">
      <button class="btn-secondary" onclick="window.downloadQR('${wrapperId}','${user.id}')">
        ${icon('download','icon-sm')} Download QR
      </button>
      <button class="btn-primary" onclick="window.closeModal()${(!tempPassword && !alreadyLoggedIn) ? ";window.showLogin()" : ""}">
        ${(tempPassword || alreadyLoggedIn) ? 'Done' : 'Sign In to Continue'}
      </button>
    </div>`)
}
window._showRegistrationQRModal = _showRegistrationQRModal

// Keep generateQR for any canvas-based callers
function generateQR(data, containerId, size = 160) {
  const el = document.getElementById(containerId)
  if (!el) return
  el.innerHTML = mockQRSvg(data, size)
}
window.generateQR = generateQR

function _getQRDataUrl(rootEl) {
  const canvas = rootEl.querySelector('canvas')
  if (canvas) return canvas.toDataURL('image/png')
  const img = rootEl.querySelector('img[src^="data:"]')
  if (img) return img.src
  return null
}

// Synchronous QR data URL for embedding into generated print documents
// (exam records, prescriptions) — unlike mockQRSvg, this doesn't wait on a
// DOM element already being mounted since it builds its own offscreen one.
// `size` is kept as the caller-facing param (every call site still passes
// its intended display size) but no longer drives the actual render
// resolution — every caller embeds the result as an <img> with its own
// explicit CSS width/height anyway, so bumping the real underlying pixel
// data to QR_RENDER_SIZE only makes the print crisper/more scannable at
// real print DPI, it never changes how big it appears on the page.
function _makeQRDataUrl(text, size = 90) {
  if (!window.QRCode || !text) return null
  const tmp = document.createElement('div')
  tmp.style.cssText = 'position:fixed;left:-9999px;top:-9999px'
  document.body.appendChild(tmp)
  try {
    new window.QRCode(tmp, {
      text, width: QR_RENDER_SIZE, height: QR_RENDER_SIZE,
      colorDark: '#1C1C1C', colorLight: '#ffffff',
      correctLevel: window.QRCode.CorrectLevel.M
    })
    return _getQRDataUrl(tmp)
  } catch (_) {
    return null
  } finally {
    tmp.remove()
  }
}

function downloadQR(wrapperId, filename) {
  const root    = wrapperId ? document.getElementById(wrapperId) : document.body
  const dataUrl = _getQRDataUrl(root || document.body)
  if (!dataUrl) { toast('QR code is still loading — please wait a moment.', 'error'); return }
  const a    = document.createElement('a')
  a.download = `CANA-QR-${filename || 'patient'}.png`
  a.href     = dataUrl
  a.click()
  toast('QR code downloaded.', 'success')
}
window.downloadQR = downloadQR

// ════════════════════════════════════════════════════════════════
//  SHARED PRINT HELPER — hidden same-page iframe instead of
//  window.open(). Mobile browsers (iOS Safari especially, and any
//  in-app/WebView browser) routinely block a popup window even from
//  a direct tap, and "width=/height=" window features have no
//  equivalent on mobile anyway. An iframe never triggers a popup
//  blocker and produces an identical printed page on every platform.
// ════════════════════════════════════════════════════════════════
function _printHtmlDocument(html) {
  const old = document.getElementById('_print-frame')
  if (old) old.remove()

  const iframe = document.createElement('iframe')
  iframe.id = '_print-frame'
  iframe.style.cssText = 'position:fixed;right:0;bottom:0;width:0;height:0;border:0;visibility:hidden'
  document.body.appendChild(iframe)

  let fired = false
  const doPrint = () => {
    if (fired) return
    fired = true
    try {
      iframe.contentWindow.focus()
      iframe.contentWindow.print()
    } catch (_) {
      toast('Could not open the print dialog.', 'error')
    }
  }

  iframe.onload = () => setTimeout(doPrint, 100)
  const doc = iframe.contentWindow.document
  doc.open()
  doc.write(html)
  doc.close()
  // Fallback in case `load` never fires for a document.write()'d iframe in this browser
  setTimeout(doPrint, 700)
}
window._printHtmlDocument = _printHtmlDocument

// ════════════════════════════════════════════════════════════════
//  SHARED PDF-DOWNLOAD HELPER — same hidden-iframe technique as
//  _printHtmlDocument() above (renders the exact same full HTML document
//  a real browser would, so its own <style>/@page rules parse normally —
//  setting the same string via innerHTML on a plain div instead would
//  have the browser silently strip the outer <html>/<head>/<body> tags),
//  then hands the iframe's rendered <body> to the locally-vendored
//  html2pdf.js (same library downloadClearancePDF() already uses) instead
//  of calling .print(). $marginMm mirrors whatever @page margin the
//  caller's own HTML declares — html2canvas screenshots normal on-screen
//  layout, so @page (a print-media-only rule real print never skips but
//  html2canvas never triggers) has no effect here on its own; passing the
//  same number keeps the PDF's margins matching the printed version.
// ════════════════════════════════════════════════════════════════
// marginMm defaults to [16, 20] — html2pdf's own [vertical, horizontal]
// shorthand, matching the "16mm 20mm" @page rule shared by every one of
// these documents (Dashboard/Reports/Exam/Rx print HTML) exactly.
// (Formerly _downloadHtmlDocumentAsPdf() lived here — parsed a standalone
// print document's HTML string apart and re-injected its <style> block
// dynamically. Every one of Dashboard/Reports/Exam/Rx has since moved to
// _downloadLiveContentAsPdf() below instead, styled by permanent classes
// in global.css (.pdf-dash-doc/.pdf-report-doc/.pdf-exam-doc/.pdf-rx-doc)
// — the same architecture downloadClearancePDF() already used
// successfully, which reconstructing a document from a string on the fly
// kept failing to match in one way or another. No remaining callers.)

// Same technique downloadClearancePDF() already uses successfully:
// render real, already-classed body content as a live DOM node (styled
// by a PERMANENT stylesheet block in global.css, e.g. .pdf-exam-doc —
// not a dynamically parsed/injected <style>), then hand that node
// straight to html2pdf. No HTML-string parsing, no CSS scoping, no
// computed-style copying — every one of those was a separate source of
// the same "content renders, layout doesn't" failure across several
// earlier attempts at rebuilding a standalone print document on the fly.
// wrapperClass must already have matching rules in global.css.
function _downloadLiveContentAsPdf(bodyContent, wrapperClass, filename, btnEl, marginMm = [16, 20]) {
  const isIconOnly = !!(btnEl && btnEl.classList.contains('btn-icon'))
  const btnHtml = btnEl ? btnEl.innerHTML : ''
  const spinnerDot = size => `<span style="display:inline-block;width:${size}px;height:${size}px;border:2px solid #D1D5DB;border-top-color:#9CA3AF;border-radius:50%;animation:spin .6s linear infinite;flex-shrink:0"></span>`
  if (btnEl) {
    btnEl.disabled = true
    btnEl.style.opacity = '.6'
    btnEl.innerHTML = isIconOnly ? spinnerDot(12) : `${spinnerDot(9)} Downloading…`
  }
  const cleanup = () => {
    if (btnEl) { btnEl.disabled = false; btnEl.style.opacity = ''; btnEl.innerHTML = btnHtml }
  }
  if (!window.html2pdf) { toast('PDF export is unavailable right now.', 'error'); cleanup(); return }

  const marginH = Array.isArray(marginMm) ? (marginMm[1] ?? marginMm[0]) : marginMm
  const contentWidthPx = Math.round((210 - marginH * 2) * 96 / 25.4)

  // Matches downloadClearancePDF()'s own wrap/content split exactly —
  // position:fixed;left:-99999px (what this used before) pushes the
  // element so far outside any plausible viewport that html2canvas
  // captured nothing at all. absolute + top:0/left:0 + visibility:hidden
  // on the OUTER wrapper (invisible to a human, out of normal flow so it
  // can't push real content around, but still fully part of the render
  // tree) with the INNER content explicitly set back to visible is the
  // proven pattern — visibility inherits by default, but a descendant
  // can override it back on, which is exactly what lets html2canvas
  // still capture it. x:0, y:0 tell html2canvas to capture from the
  // content's own top-left rather than wherever it happens to sit
  // relative to the page/scroll position.
  const wrap = document.createElement('div')
  wrap.style.cssText = 'position:absolute;top:0;left:0;visibility:hidden;'
  const content = document.createElement('div')
  content.className = wrapperClass
  content.style.cssText = `width:${contentWidthPx}px;visibility:visible;`
  content.innerHTML = bodyContent
  wrap.appendChild(content)
  document.body.appendChild(wrap)

  window.html2pdf()
    .set({
      filename,
      margin:      marginMm,
      image:       { type: 'jpeg', quality: 0.98 },
      html2canvas: { scale: 2, backgroundColor: '#ffffff', useCORS: true, windowWidth: contentWidthPx, width: contentWidthPx, x: 0, y: 0 },
      jsPDF:       { unit: 'mm', format: 'a4', orientation: 'portrait' },
      pagebreak:   { mode: ['css', 'legacy'] },
    })
    .from(content)
    .save()
    .then(() => toast('PDF downloaded successfully.', 'success'))
    .catch(() => toast('Could not generate the PDF. Try Print instead.', 'error'))
    .finally(() => { wrap.remove(); cleanup() })
}
window._downloadLiveContentAsPdf = _downloadLiveContentAsPdf

// A clinic-wide filename prefix + safe-slug helper, shared by every
// downloadable PDF (reports, exam/prescription/clearance records) so the
// naming convention actually stays one convention instead of drifting
// per document type. Pattern: CanaOpticalClinic-{Type}-{Identifier(s)}.pdf
function _pdfSlug(s) {
  return String(s || '').replace(/[^a-z0-9]+/gi, '-').replace(/^-+|-+$/g, '')
}
function _pdfFilename(type, ...parts) {
  return ['CanaOpticalClinic', _pdfSlug(type), ...parts.filter(Boolean).map(_pdfSlug)].join('-') + '.pdf'
}
window._pdfFilename = _pdfFilename

function printQR(wrapperId, patientName, patientId, qrData) {
  const root    = wrapperId ? document.getElementById(wrapperId) : document.body
  const dataUrl = _getQRDataUrl(root || document.body)
  _printHtmlDocument(`<!DOCTYPE html><html><head><title>QR — ${patientName || 'Patient'}</title>
  <style>
    *{margin:0;padding:0;box-sizing:border-box}
    @page{size:A4;margin:0}
    body{font-family:Arial,sans-serif;background:#fff}
    /* Table/table-cell centering — reliably honored by Chrome's print
       engine (unlike flexbox height resolution, which collapses to
       content-size during pagination) — vertically centers the card
       on the page instead of stranding it at the top. */
    .pg{display:table;width:100%;height:297mm}
    .pg-inner{display:table-cell;vertical-align:middle;text-align:center;padding:24px}
    .card{display:inline-block;text-align:center;border:2px solid #E5E7EB;border-radius:12px;padding:28px 24px;width:280px}
    .clinic{font-size:10px;font-weight:700;text-transform:uppercase;letter-spacing:.1em;color:#6B7280;margin-bottom:16px}
    .qr-box{width:200px;height:200px;margin:0 auto 16px}
    .qr-box img{width:200px;height:200px}
    .name{font-size:15px;font-weight:700;color:#1C1C1C;margin-bottom:3px}
    .pid{font-size:11px;color:#9CA3AF;font-family:monospace;margin-bottom:6px}
    .hint{font-size:9px;color:#CBD5E1;font-family:monospace;word-break:break-all}
  </style></head><body>
  <div class="pg"><div class="pg-inner">
  <div class="card">
    <div class="clinic">${window._clinicName || clinicInfo.name || 'Cana Optical Clinic'}</div>
    <div class="qr-box">${dataUrl ? `<img src="${dataUrl}" alt="QR">` : '<div style="background:#f3f4f6;width:200px;height:200px;display:flex;align-items:center;justify-content:center;color:#9CA3AF;font-size:12px">QR unavailable</div>'}</div>
    <div class="name">${patientName || ''}</div>
    <div class="pid">${patientId || ''}</div>
    <div class="hint">${qrData || ''}</div>
  </div>
  </div></div>
  </body></html>`)
}
window.printQR = printQR

// ════════════════════════════════════════════════════════════════
//  DASHBOARD — PRINTABLE REPORT
//  Admin/Staff/Doctor only (the Dashboard page's own "Print Report"
//  button never renders for patients; guarded again here defensively).
//  Deliberately table-only, no charts — Chart.js canvases don't survive
//  being re-created inside a separate print document, and a plain data
//  table reads better on paper than a screenshot of a bar chart anyway.
// ════════════════════════════════════════════════════════════════
// Builds the Dashboard Report's full printable HTML document + a filename
// following the app-wide CanaOpticalClinic-{Type}-{Identifier}.pdf
// convention (_pdfFilename(), above). Returns null if the role isn't
// allowed one — printDashboardReport() and downloadDashboardReportPDF()
// below are both thin wrappers over this: the former hands the full
// document to _printHtmlDocument(), the latter extracts just <body>'s
// content and hands that to _downloadLiveContentAsPdf() (styled by the
// permanent .pdf-dash-doc rules in global.css).
function _buildDashboardReportHtml() {
  const role = state.role
  if (role === 'patient') return null

  const generated  = new Date().toLocaleString('en-PH', { year:'numeric', month:'long', day:'numeric', hour:'numeric', minute:'2-digit', hour12:true })
  const logoAbsUrl = new URL(window._clinicLogoUrl || 'assets/images/logo/clinic-logo.png', document.baseURI).href
  const clinicName = window._clinicName || clinicInfo.name || 'Cana Optical Clinic'
  const roleLabel  = { admin:'Administrator', staff:'Staff', doctor:'Doctor' }[role] || role

  const table = (title, headers, rows) => `
    <div class="rpt-section">
      <div class="rpt-sec-title">${title}</div>
      ${rows.length ? `
      <div class="tbl-border">
        <table>
          <thead class="tbl-hdr"><tr>${headers.map(h => `<th style="text-align:left;color:#777">${h}</th>`).join('')}</tr></thead>
          <tbody>${rows.map(r => `<tr>${r.map(c => `<td style="padding:7px 12px;font-size:12px;border-bottom:1px solid #eee">${c}</td>`).join('')}</tr>`).join('')}</tbody>
        </table>
      </div>` : `<div class="rpt-empty">No data.</div>`}
    </div>`

  let subtitle = 'Dashboard Report'
  let sections = ''

  if (role === 'admin' || role === 'staff') {
    subtitle = 'Clinic Overview Report'
    const todayStr     = localDateStr()
    const todayCnt     = appointments.filter(a => a.date === todayStr && !['cancelled','disapproved'].includes(a.status)).length
    const completedCnt = appointments.filter(a => a.status === 'completed').length
    const cancelledCnt = appointments.filter(a => a.status === 'cancelled').length
    const totalDocs    = doctors.length
    const todayShort   = ['Sun','Mon','Tue','Wed','Thu','Fri','Sat'][new Date().getDay()]
    const availDocs    = doctors.filter(d => d.status === 'active' && d.available && (d.days || []).includes(todayShort)).length
    const pendingCnt   = appointments.filter(a => a.status === 'pending').length

    sections += table('Overview', ['Metric','Value','Note'], [
      ['Total Patients', patients.length, `${patients.filter(p=>p.status==='active').length} active`],
      ['Total Appointments', appointments.length, `${pendingCnt} pending`],
      ['Doctors Available', `${availDocs}/${totalDocs}`, 'Available today'],
      ["Today's Appointments", todayCnt, 'Scheduled for today'],
      ['Completed Consultations', completedCnt, 'Total completed'],
      ['Cancelled', cancelledCnt, 'Total cancelled'],
    ])

    // Same month range currently selected on the on-screen chart (default
    // 6) — a table restating exactly what the bar/line charts show, not a
    // separately-scoped dataset.
    const range = parseInt(document.getElementById('admin-chart-range-select')?.value || '6', 10)
    const now = new Date()
    const apptRows = [], growthRows = []
    for (let i = range - 1; i >= 0; i--) {
      const d = new Date(now.getFullYear(), now.getMonth() - i, 1)
      const label = d.toLocaleString('en-US', { month:'long', year:'numeric' })
      const y = d.getFullYear(), m = d.getMonth()
      apptRows.push([label, appointments.filter(a => {
        const ad = new Date(a.date); return ad.getFullYear() === y && ad.getMonth() === m && !['cancelled','disapproved'].includes(a.status)
      }).length])
      growthRows.push([label, patients.filter(p => {
        if (!p.registeredDate) return false
        const pd = new Date(p.registeredDate); return pd.getFullYear() === y && pd.getMonth() === m
      }).length])
    }
    sections += table('Monthly Appointments', ['Month','Appointments'], apptRows)
    sections += table('Patient Growth', ['Month','New Patients'], growthRows)

    sections += table('Doctor Availability', ['Doctor','Specialization','Days','Status'],
      doctors.map(d => [d.name, d.specialization || '—', (d.days || []).join(', ') || '—', (d.available && d.status === 'active') ? 'Available' : 'Unavailable']))

    const recentAppts = [...appointments].sort((a,b) => b.date.localeCompare(a.date) || String(b.id).localeCompare(String(a.id))).slice(0, 6)
    sections += table('Recent Appointments', ['Patient','Doctor','Date','Status'],
      recentAppts.map(a => [a.patientName || '—', (a.doctorName || 'Unassigned').replace('Dr. ',''), fmtDate(a.date), a.status.charAt(0).toUpperCase() + a.status.slice(1)]))

    // Activity log is an admin-only feature elsewhere in the app (see
    // _dashboardOverviewBody's own showActivity gate) — same restriction here.
    if (role === 'admin') {
      sections += table('Recent Activity', ['User','Action','Time'],
        activityLog.slice(0, 5).map(a => [a.user, a.action, new Date(a.timestamp.replace(' ','T')).toLocaleString('en-PH', { month:'short', day:'numeric', hour:'numeric', minute:'2-digit', hour12:true })]))
    }
  } else if (role === 'doctor') {
    subtitle = 'Doctor Dashboard Report'
    const todayStr = localDateStr()
    const timeVal = t => { if (!t) return 0; const cl = t.includes('PM') && !t.startsWith('12'), [h,m] = t.replace(/ [AP]M$/,'').split(':').map(Number); return (cl ? h+12 : (t.includes('AM') && h===12 ? 0 : h))*60+m }
    const todayList    = appointments.filter(a => a.date === todayStr && !['cancelled','disapproved'].includes(a.status)).sort((a,b) => timeVal(a.time) - timeVal(b.time))
    const upcomingList = appointments.filter(a => a.date > todayStr && ['approved','pending'].includes(a.status))
    const weekStart    = new Date(); weekStart.setDate(weekStart.getDate() - weekStart.getDay())
    const weekStartStr = localDateStr(weekStart)
    const thisWeek      = appointments.filter(a => a.status === 'completed' && a.date >= weekStartStr).length
    const pendingAppts  = appointments.filter(a => a.status === 'pending').length
    const recentDone    = appointments.filter(a => a.status === 'completed').sort((a,b) => b.date.localeCompare(a.date)).slice(0, 5)

    sections += table('Overview', ['Metric','Value'], [
      ['Patients Today', todayList.length],
      ['Upcoming Appointments', upcomingList.length],
      ['Completed This Week', thisWeek],
      ['Pending Approval', pendingAppts],
    ])
    sections += table("Today's Patients", ['Patient','Time','Type','Status'],
      todayList.map(a => [a.patientName, a.time, a.type, a.status.charAt(0).toUpperCase() + a.status.slice(1)]))
    sections += table('Recent Completed', ['Patient','Date','Type'],
      recentDone.map(a => [a.patientName, fmtDate(a.date), a.type]))
  }

  const html = `<!DOCTYPE html>
<html lang="en">
<head>
<meta charset="UTF-8">
<title>Dashboard Report — ${clinicName}</title>
<style>
  /* A real @page margin, not margin:0 + a manual body padding standing in
     for it — that padding-based approach (moving it from a nested div to
     body itself was tried first) still came out with NO margin at all on
     page 2+ once real content pushed this report past one page. @page's
     own margin is the one box CSS print fragmentation spec-guarantees
     gets reapplied on every page a document spans; same fix applied to
     the Reports page's own print document (pages.js printReport()). */
  @page { size: A4; margin: 16mm 20mm; }
  * { box-sizing: border-box; margin: 0; padding: 0; }
  body { font-family: Arial, Helvetica, sans-serif; color:#111; font-size:13px; line-height:1.6; background:#fff; }
  table { width:100%; border-collapse: collapse; }
  .clinic-hdr  { display:flex; align-items:center; gap:14px; border-bottom:3px solid #E8760A; padding-bottom:14px; margin-bottom:16px; }
  .clinic-logo { height:60px; flex-shrink:0; }
  .clinic-name { font-size:22px; font-weight:900; color:#E8760A; letter-spacing:-.02em; }
  .clinic-sub  { font-size:15px; font-weight:700; color:#1C1C1C; }
  .clinic-doc  { font-size:10px; font-weight:700; text-transform:uppercase; letter-spacing:.1em; color:#bbb; margin-top:4px; }
  .rpt-meta    { display:flex; justify-content:space-between; font-size:11px; color:#888; margin-bottom:22px; }
  /* Row-level break protection (below), not section-level — a whole
     .rpt-section forced to avoid breaking could get shoved entirely onto
     a new page even when only its last row or two didn't fit, wasting
     most of the previous page and sometimes leaving a near-empty trailing
     page. tr{page-break-inside:avoid} only protects a single row from
     being sliced in half, letting the table itself flow across the page
     boundary normally — same technique already used by the Reports
     page's own print document (pages.js printReport()). */
  .rpt-section { margin-bottom:20px; }
  tr { page-break-inside: avoid; }
  .rpt-sec-title { font-size:11px; font-weight:700; text-transform:uppercase; letter-spacing:.06em; color:#999; margin-bottom:6px; }
  .rpt-empty   { font-size:12px; color:#aaa; font-style:italic; padding:8px 0; }
  .tbl-hdr th  { background:#f5f5f5; padding:8px 12px; font-size:10px; font-weight:700; text-transform:uppercase; letter-spacing:.04em; }
  .tbl-border  { border:1px solid #eee; border-radius:8px; overflow:hidden; }
  /* No page-break-inside:avoid here (unlike .rpt-section) — this block is
     short enough that "avoid" was more likely to shove the whole thing
     onto a lonely trailing page (leaving the actual last content page
     with unused space below it) than to actually protect it from a bad
     mid-block split. */
  .sig-block   { margin-top:32px; padding-top:16px; border-top:1px dashed #ccc; display:flex; justify-content:flex-end; }
  .sig-col     { text-align:center; min-width:220px; }
  .sig-line    { border-top:1px solid #111; padding-top:7px; font-size:11px; font-weight:700; text-transform:uppercase; }
  .sig-sub     { font-size:10px; color:#888; margin-top:3px; }
</style>
</head>
<body>
  <div class="clinic-hdr">
    <img src="${logoAbsUrl}" alt="${clinicName}" class="clinic-logo" onerror="this.style.display='none'">
    <div>
      <div class="clinic-name">${clinicName}</div>
      <div class="clinic-sub">${subtitle}</div>
      <div class="clinic-doc">Internal Report — Not for Distribution</div>
    </div>
  </div>
  <div class="rpt-meta">
    <span>Generated: ${generated}</span>
    <span>Role: ${roleLabel}</span>
  </div>
  ${sections}
  <div class="sig-block">
    <div class="sig-col">
      <div class="sig-line">${state.user?.name || '—'}</div>
      <div class="sig-sub">Prepared by &bull; ${roleLabel}</div>
    </div>
  </div>
</body>
</html>`

  return { html, filename: _pdfFilename('Dashboard-Report', localDateStr()) }
}

function printDashboardReport() {
  const built = _buildDashboardReportHtml()
  if (built) _printHtmlDocument(built.html)
}
window.printDashboardReport = printDashboardReport

function downloadDashboardReportPDF(btnEl) {
  const built = _buildDashboardReportHtml()
  if (!built) return
  // _buildDashboardReportHtml() still builds a full standalone document
  // for _printHtmlDocument()'s own use — only <body>'s inner content is
  // needed here, styled instead by the permanent .pdf-dash-doc rules in
  // global.css (same architecture as downloadExamRecordPDF()).
  const bodyMatch = built.html.match(/<body[^>]*>([\s\S]*?)<\/body>/i)
  if (!bodyMatch) { toast('Could not generate the PDF.', 'error'); return }
  _downloadLiveContentAsPdf(bodyMatch[1], 'pdf-dash-doc', built.filename, btnEl)
}
window.downloadDashboardReportPDF = downloadDashboardReportPDF

// ════════════════════════════════════════════════════════════════
//  CAMERA QR SCANNER — uses the html5-qrcode library (local vendor copy)
// ════════════════════════════════════════════════════════════════
let _h5qr = null // active Html5Qrcode instance, one at a time

// Responsive scan-box size: a square that's ~70% of the smaller video
// dimension, clamped so it stays usable on very small or very large feeds.
function _qrBoxSizeFn(viewfinderWidth, viewfinderHeight) {
  const minEdge = Math.min(viewfinderWidth, viewfinderHeight)
  const size    = Math.max(180, Math.min(280, Math.floor(minEdge * 0.7)))
  return { width: size, height: size }
}

// Progressively looser camera configs to try in order. Safari/WebKit
// validates combined facingMode+exact-resolution constraints far more
// strictly than Chromium does — a request that Chrome happily loosens on
// its own can throw OverconstrainedError outright in Safari. Each fallback
// here drops one more constraint rather than giving up after the first
// (ideal-resolution) attempt fails.
function _qrCameraConfigs() {
  return [
    // 1) Preferred: rear camera, higher resolution for scanning off a
    //    screen at a distance.
    {
      cameraIdOrConfig: { facingMode: 'environment' },
      videoConstraints: { facingMode: 'environment', width: { ideal: 1280 }, height: { ideal: 720 } }
    },
    // 2) Rear camera, no resolution preference — let the browser pick.
    {
      cameraIdOrConfig: { facingMode: 'environment' },
      videoConstraints: undefined
    },
    // 3) Any camera at all (helps devices/browsers that don't resolve
    //    "environment" the way this code expects, e.g. some laptops/tablets).
    {
      cameraIdOrConfig: {},
      videoConstraints: undefined
    }
  ]
}

async function startQRCamera(containerId, onResult, onStatus) {
  if (!window.Html5Qrcode) {
    toast('QR scanner library failed to load.', 'error'); return
  }
  if (!navigator.mediaDevices?.getUserMedia) {
    toast('Camera not supported on this device or browser.', 'error'); return
  }

  await _qrKillStream() // make sure no other instance is running

  const instance = new Html5Qrcode(containerId)
  _h5qr = instance
  let handled = false

  const onDecoded = (decodedText) => {
    if (handled) return
    handled = true
    _qrKillStream().then(() => { if (onResult) onResult(decodedText) })
  }
  const onScanFailure = () => { /* fires continuously while no QR is in frame — expected, ignore */ }

  const configs = _qrCameraConfigs()
  let lastErr = null
  for (let i = 0; i < configs.length; i++) {
    const cfg = configs[i]
    try {
      const configuration = { fps: 12, qrbox: _qrBoxSizeFn, aspectRatio: 1.333334 }
      if (cfg.videoConstraints) configuration.videoConstraints = cfg.videoConstraints
      await instance.start(cfg.cameraIdOrConfig, configuration, onDecoded, onScanFailure)
      if (onStatus) onStatus()
      return // success — stop trying further fallbacks
    } catch (err) {
      lastErr = err
      // NotAllowedError (permission denied) and NotFoundError (no camera at
      // all) won't be fixed by loosening constraints — stop immediately
      // instead of prompting for camera permission repeatedly.
      if (/NotAllowedError|Permission|NotFoundError/i.test(String(err))) break
      // Otherwise (OverconstrainedError, NotReadableError, etc.) try the
      // next looser config.
    }
  }

  // Every attempt failed.
  const err = lastErr
  const msg = /NotAllowedError|Permission/i.test(String(err)) ? 'Camera permission denied. Please allow camera access and try again.'
            : /NotFoundError/i.test(String(err))               ? 'No camera found on this device.'
            : /NotReadableError/i.test(String(err))             ? 'Camera is in use by another application.'
            : /OverconstrainedError/i.test(String(err))         ? 'Camera does not support the requested settings on this device.'
            : 'Camera error: ' + err
  toast(msg, 'error')
  _h5qr = null
  _qrStopUI()
}

// Belt-and-suspenders: html5-qrcode's own stop() can silently fail to
// release the camera (e.g. if called while still starting up, or in some
// mobile browsers), leaving the hardware camera light on even though our
// UI thinks it's stopped. Directly stopping every track of any <video>
// stream still attached inside the reader guarantees the camera is freed
// regardless of whether the library's own stop() succeeded.
function _qrForceStopAllTracks() {
  try {
    document.querySelectorAll('#qr-reader video').forEach(video => {
      const stream = video.srcObject
      if (stream && typeof stream.getTracks === 'function') {
        stream.getTracks().forEach(track => track.stop())
      }
      video.srcObject = null
    })
  } catch (_) {}
}

async function _qrKillStream() {
  const instance = _h5qr
  _h5qr = null
  if (instance) {
    try { await instance.stop() } catch (_) {}
    try { instance.clear() } catch (_) {}
  }
  _qrForceStopAllTracks()
}
window._qrKillStream = _qrKillStream

function _qrStopUI() {
  const reader   = document.getElementById('qr-reader')
  const idle     = document.getElementById('qr-cam-idle')
  const startBtn = document.getElementById('qr-start-btn')
  const stopBtn  = document.getElementById('qr-stop-btn')
  const camArea  = document.getElementById('qr-camera-area')
  const scanBar  = document.getElementById('qr-scanning-bar')
  if (reader)   reader.style.display = 'none'
  if (idle)     idle.style.display = 'flex'
  if (scanBar)  scanBar.style.display = 'none'
  if (startBtn) startBtn.style.display = ''
  if (stopBtn)  stopBtn.style.display  = 'none'
  if (camArea)  { camArea.style.borderStyle = 'dashed'; camArea.style.background = '#FAFAFA'; camArea.style.padding = '48px 24px'; camArea.style.boxShadow = '' }
  const statusEl  = document.getElementById('qr-scan-status')
  const captionEl = document.getElementById('qr-status-caption')
  if (statusEl)  statusEl.style.display  = 'none'
  if (captionEl) captionEl.style.display = 'none'
}

async function stopQRCamera() {
  await _qrKillStream()
  _qrStopUI()
}
window.stopQRCamera = stopQRCamera

async function openQRCameraScanner() {
  const reader         = document.getElementById('qr-reader')
  const idle           = document.getElementById('qr-cam-idle')
  const startBtn       = document.getElementById('qr-start-btn')
  const stopBtn        = document.getElementById('qr-stop-btn')
  const camArea        = document.getElementById('qr-camera-area')
  const scanBar        = document.getElementById('qr-scanning-bar')
  const scanPulse      = document.getElementById('qr-scan-pulse')
  const scanText       = document.getElementById('qr-scan-bar-text')
  const statusCaption  = document.getElementById('qr-status-caption')
  if (!reader) return

  if (idle)     idle.style.display = 'none'
  reader.style.display = ''
  if (scanBar)  scanBar.style.display  = 'flex'
  if (startBtn) startBtn.style.display = 'none'
  if (stopBtn)  stopBtn.style.display  = ''
  if (camArea)  { camArea.style.borderStyle = 'solid'; camArea.style.background = '#000'; camArea.style.padding = '12px' }

  // Phase 1: starting
  if (scanPulse) { scanPulse.style.background = '#F59E0B'; scanPulse.style.animation = 'qrDotPulse .9s ease-in-out infinite' }
  if (scanText)  scanText.textContent = 'Starting camera…'
  if (statusCaption) { statusCaption.style.display = ''; statusCaption.textContent = 'Requesting camera access…' }

  startQRCamera('qr-reader',
    // onResult
    (qrData) => {
      if (scanPulse) { scanPulse.style.background = '#22C55E'; scanPulse.style.animation = 'none' }
      if (scanText)  scanText.textContent = 'QR code detected!'
      if (camArea)   { camArea.style.borderColor = '#22C55E'; camArea.style.boxShadow = '0 0 0 3px rgba(34,197,94,.25)' }
      if (statusCaption) statusCaption.textContent = 'QR code found — looking up patient…'

      _qrStopUI()

      const patient = patients.find(p => p.qrData === qrData)
      _qrStatsRecord(!!patient, patient?.id)
      if (patient) {
        if (scanBar) scanBar.style.display = 'none'
        if (statusCaption) statusCaption.style.display = 'none'
        showQRResult(patient)
        toast(`Patient found: ${patient.name}`)
      } else {
        if (scanPulse) scanPulse.style.background = '#EF4444'
        if (scanText)  scanText.textContent = 'QR not recognised — no matching patient.'
        if (camArea)   { camArea.style.borderColor = '#EF4444'; camArea.style.boxShadow = '0 0 0 3px rgba(239,68,68,.2)' }
        if (statusCaption) statusCaption.textContent = `Scanned: "${qrData}" — not found in patient records.`
        toast('No matching patient found for this QR code.', 'error')
      }
    },
    // onStatus — called once camera is live
    () => {
      if (scanPulse) { scanPulse.style.background = '#22C55E'; scanPulse.style.animation = 'qrDotPulse .6s ease-in-out infinite' }
      if (scanText)  scanText.textContent = 'Scanning…'
      if (statusCaption) statusCaption.textContent = 'Camera live  ·  Hold the QR code steady in the frame'
    }
  )
}
window.openQRCameraScanner = openQRCameraScanner

// ════════════════════════════════════════════════════════════════
//  QR SCAN STATS — backed by qr_scan_log table via api/qr/*
// ════════════════════════════════════════════════════════════════
async function _qrStatsRecord(found, patientId) {
  try {
    await fetch('api/qr/record.php', {
      method:  'POST',
      headers: { 'Content-Type': 'application/json' },
      body:    JSON.stringify({ found: !!found, patientId: patientId || null })
    })
  } catch (_) { /* non-critical — stats just won't reflect this scan */ }
  _qrRenderStats()
}
window._qrStatsRecord = _qrStatsRecord

async function _qrRenderStats() {
  const el = id => document.getElementById(id)
  try {
    const r = await fetch('api/qr/stats.php')
    const d = await r.json()
    if (!d.success) return
    if (el('qr-stat-total'))    el('qr-stat-total').textContent    = d.total
    if (el('qr-stat-found'))    el('qr-stat-found').textContent    = d.found
    if (el('qr-stat-notfound')) el('qr-stat-notfound').textContent = d.notFound
  } catch (_) { /* non-critical — leave stats at last known value */ }
}
window._qrRenderStats = _qrRenderStats

// ════════════════════════════════════════════════════════════════
//  QR IMAGE UPLOAD — decode a QR from an uploaded image file
// ════════════════════════════════════════════════════════════════
function processQRImageFile(file) {
  if (!file) return
  if (!file.type.startsWith('image/')) {
    toast('Please select an image file (PNG, JPG, WEBP).', 'error'); return
  }

  const zone     = document.getElementById('qr-upload-zone')
  const idle     = document.getElementById('qr-upload-idle')
  const preview  = document.getElementById('qr-upload-preview')
  const statusEl = document.getElementById('qr-upload-status')

  // Resolved states (found/not-found/error) get a filled, solid-border tint
  // instead of the idle dashed box — a plain dashed border reads as "still
  // waiting for input" regardless of what text sits below it; a filled
  // color state reads as resolved at a glance, before even reading the text.
  const setZoneTone = (border, bg) => {
    if (!zone) return
    zone.style.borderStyle = border ? 'solid' : 'dashed'
    zone.style.borderColor = border || '#E5E7EB'
    zone.style.background  = bg || '#FAFAFA'
  }
  const setStatus = (html) => {
    if (!statusEl) return
    statusEl.style.display = ''
    statusEl.innerHTML     = html
  }
  // label/value layout used by every resolved (non-"reading") state —
  // icon + small-caps status word, then the actual message in larger type.
  const resultHtml = (iconName, color, label, message) => `
    <div style="display:flex;align-items:center;justify-content:center;gap:5px;line-height:1;color:${color};margin-bottom:2px">
      ${icon(iconName, 'icon-sm')}
      <span style="font-size:.66rem;font-weight:700;text-transform:uppercase;letter-spacing:.06em;line-height:1">${label}</span>
    </div>
    <div style="font-size:.86rem;font-weight:700;color:#1C1C1C">${message}</div>`

  const reader = new FileReader()
  reader.onload = function(e) {
    // Show preview
    if (preview) { preview.src = e.target.result; preview.style.display = 'block' }
    if (idle)    idle.style.display = 'none'
    setZoneTone('#E5E7EB', '#FAFAFA')
    setStatus(`<div style="font-size:.8rem;color:#9CA3AF">Reading QR code…</div>`)

    const img = new Image()
    img.onload = function() {
      const canvas = document.createElement('canvas')
      canvas.width  = img.width
      canvas.height = img.height
      const ctx = canvas.getContext('2d')
      ctx.drawImage(img, 0, 0)

      const imgData = ctx.getImageData(0, 0, canvas.width, canvas.height)
      const code    = window.jsQR && window.jsQR(imgData.data, imgData.width, imgData.height, { inversionAttempts: 'attemptBoth' })

      if (!code?.data) {
        setZoneTone('#FCA5A5', '#FEF2F2')
        setStatus(resultHtml('x-circle', '#DC2626', 'No QR Code Found', 'Try a clearer or higher-resolution image.'))
        return
      }

      setStatus(`<div style="font-size:.8rem;color:#E8760A;font-weight:600">QR detected — looking up patient…</div>`)
      const patient = patients.find(p => p.qrData === code.data)
      _qrStatsRecord(!!patient, patient?.id)
      if (patient) {
        setZoneTone('#6EE7B7', '#ECFDF5')
        setStatus(resultHtml('check-circle', '#059669', 'Patient Found', patient.name))
        showQRResult(patient)
        toast(`Patient found: ${patient.name}`)
      } else {
        setZoneTone('#FCA5A5', '#FEF2F2')
        setStatus(resultHtml('x-circle', '#DC2626', 'Not Recognized', 'This QR code isn’t linked to any patient in the system.'))
        toast('QR code not recognised in this system.', 'error')
      }
    }
    img.onerror = () => {
      setZoneTone('#FCA5A5', '#FEF2F2')
      setStatus(resultHtml('x-circle', '#DC2626', 'Read Error', 'Could not read this image file.'))
    }
    img.src = e.target.result
  }
  reader.readAsDataURL(file)
}
window.processQRImageFile = processQRImageFile

// ════════════════════════════════════════════════════════════════
//  TABLE FILTER (search)
// ════════════════════════════════════════════════════════════════
function filterTable(input, tbodyId) {
  const q    = input.value.toLowerCase()
  const rows = document.querySelectorAll(`#${tbodyId} tr[data-search]`)
  let anyMatch = false
  rows.forEach(r => {
    const match = r.dataset.search.includes(q)
    r.style.display = match ? '' : 'none'
    if (match) anyMatch = true
  })
  if (window.pgReset) window.pgReset(tbodyId)
  // Real-time "no results" row — a tab/status filter narrowing to zero
  // already showed its own empty-state message (each page builds that
  // server-side/at render time); a live text search narrowing to zero just
  // left a blank table body with no explanation, so this gives it the same
  // courtesy while the patient/staff is still typing.
  _syncSearchEmptyState(tbodyId, rows.length > 0 && !anyMatch, 'table')
}
window.filterTable = filterTable

// Shared by filterTable() (.tbl tables, appends an empty <tr>) and the
// patient-facing history-list filters — Prescriptions/Examination
// History/Consultations, main.js's window._filter*History functions
// (appends a plain <div>, since those lists aren't real tables).
function _syncSearchEmptyState(containerId, show, kind, label) {
  const container = document.getElementById(containerId)
  if (!container) return
  const msg = label || 'No results match your search.'
  let el = document.getElementById(containerId + '-search-empty')
  if (show) {
    if (!el) {
      el = document.createElement(kind === 'table' ? 'tr' : 'div')
      el.id = containerId + '-search-empty'
      if (kind === 'table') {
        // .tbl-search-empty exists purely so the CSS below can beat
        // .tbl tbody tr:hover td's cream highlight for this one row —
        // matches .table-empty (the same "no records at all" message
        // every other empty table already uses) exactly instead of a
        // one-off style, and isn't meant to look interactive since
        // clicking it does nothing.
        el.className = 'tbl-search-empty'
        el.innerHTML = `<td colspan="20" class="table-empty" style="border:none">${msg}</td>`
      } else {
        el.className = 'table-empty'
        el.textContent = msg
      }
      container.appendChild(el)
    }
    el.style.display = ''
  } else if (el) {
    el.style.display = 'none'
  }
}
window._syncSearchEmptyState = _syncSearchEmptyState

// ════════════════════════════════════════════════════════════════
//  BUSY-BUTTON HELPER — disable + spinner + guard against double-click
//  Shared by every confirm/action button below that fires an async
//  server request (approve, cancel, archive, delete, restore, block…).
//  Without this, a fast double-click (or an impatient repeat-click while
//  a request is still in flight) can fire the same mutation twice —
//  duplicate archives, duplicate emails, a delete racing a second delete.
//  `variant` matches the button's own CSS class so the spinner tints to
//  it instead of showing a mismatched color through a light-fill button.
// ════════════════════════════════════════════════════════════════
const _btnSpinTint = {
  primary:   { dim: 'rgba(255,255,255,.5)',  solid: '#fff'    }, // solid orange, white text
  danger:    { dim: 'rgba(255,255,255,.5)',  solid: '#fff'    }, // solid red, white text
  secondary: { dim: 'rgba(107,114,128,.35)', solid: '#374151' }, // white bg, gray text
  success:   { dim: 'rgba(46,125,50,.35)',   solid: '#2E7D32' }, // light green
  warning:   { dim: 'rgba(232,137,28,.35)',  solid: '#E8891C' }, // light orange
}
// Returns false and puts the button into its busy state, or returns true
// (and leaves it untouched) if a request is already in flight — callers
// bail out on `true`.
function _btnBusy(btn, variant, label) {
  if (!btn) return false
  if (btn.disabled) return true // already in flight
  const t = _btnSpinTint[variant] || _btnSpinTint.primary
  if (btn.dataset._origHtml === undefined) btn.dataset._origHtml = btn.innerHTML
  btn.disabled = true
  // .btn-icon is a fixed 32x32 square (row actions like Approve/Mark
  // Completed) — appending a text label would overflow it, so it gets a
  // bare, slightly bigger centered spinner instead, same convention
  // _downloadLiveContentAsPdf() already uses for its own icon-only case.
  const isIconOnly = btn.classList.contains('btn-icon')
  const size = isIconOnly ? 12 : 9
  const spinner = `<span style="display:inline-block;width:${size}px;height:${size}px;border:2px solid ${t.dim};border-top-color:${t.solid};border-radius:50%;animation:spin .6s linear infinite;flex-shrink:0"></span>`
  btn.innerHTML = isIconOnly ? spinner : `${spinner} ${label}`
  return false
}
function _btnIdle(btn) {
  if (!btn) return
  btn.disabled = false
  if (btn.dataset._origHtml !== undefined) { btn.innerHTML = btn.dataset._origHtml; delete btn.dataset._origHtml }
}

// ════════════════════════════════════════════════════════════════
//  APPOINTMENT ACTIONS
// ════════════════════════════════════════════════════════════════

// Shared helper — POST to update.php, then sync local mock array
async function _apptUpdate(payload) {
  try {
    const r = await fetch('api/appointments/update.php', {
      method:  'POST',
      headers: { 'Content-Type': 'application/json' },
      body:    JSON.stringify(payload)
    })
    const d = await r.json()
    if (!d.success) { toast(d.message || 'Update failed.', 'error'); return false }
    return true
  } catch (_) {
    toast('Network error — please try again.', 'error')
    return false
  }
}

// btnEl is optional — passed by the row-level quick-approve icon
// (apptActions(), pages.js) so that direct path gets the same busy/
// spinner/guard treatment doApproveAppt()'s modal-confirm button below
// already has; the modal path calls this without a button of its own,
// since doApproveAppt() already manages its own button's busy state.
async function approveAppt(id, btnEl) {
  if (_btnBusy(btnEl, 'success', 'Approving…')) return false
  const ok = await _apptUpdate({ id, action: 'status', status: 'approved' })
  if (!ok) { _btnIdle(btnEl); return false }
  updateAppointmentStatus(id, 'approved')
  const a = appointments.find(a => a.id === id)
  if (a) addActivityLog({ id:'L'+Date.now(), user: state.user.name, role: state.role,
    action: `Approved appointment ${id} for ${a.patientName}`,
    timestamp: nowTimestamp(), type:'appointment' })
  toast('Appointment confirmed. The patient will be notified of their scheduled consultation.')
  renderPage()
  return true
}

// Disables + spins the button for the duration of the request, and only
// closes the modal once approval actually finished — same reasoning as
// doCancelAppt()/doDisapproveAppt() below (this now sends the patient an
// email too, see api/appointments/update.php), but this one specifically
// used to call closeModal() synchronously right alongside the async
// approveAppt() call, closing instantly with zero loading feedback and no
// guard at all against a second click firing a duplicate approval+email
// while the first request was still in flight.
async function doApproveAppt(id) {
  const btn = document.getElementById('approve-confirm-btn')
  if (btn) {
    if (btn.disabled) return // already in flight
    btn.disabled = true
    // .btn-success is a light-green fill with dark-green text (not a
    // solid-color button like .btn-danger), so the white spinner used
    // for those would be nearly invisible here — tinted to match its own
    // palette instead, same reasoning as .btn-disapprove's spinner.
    btn.innerHTML = `<span style="display:inline-block;width:9px;height:9px;border:2px solid rgba(46,125,50,.35);border-top-color:#2E7D32;border-radius:50%;animation:spin .6s linear infinite;flex-shrink:0"></span> Approving…`
  }
  const ok = await approveAppt(id)
  if (ok) { closeModal(); return }
  if (btn) { btn.disabled = false; btn.innerHTML = 'Approve' }
}
window.doApproveAppt = doApproveAppt

async function cancelAppt(id, reason) {
  const ok = await _apptUpdate({ id, action: 'status', status: 'cancelled', cancellationReason: reason || '' })
  if (!ok) return false
  updateAppointmentStatus(id, 'cancelled')
  const a = appointments.find(a => a.id === id)
  if (a && reason) a.cancellationReason = reason
  toast('Appointment has been cancelled. The patient will be notified of the cancellation.', 'error')
  renderPage()
  return true
}

async function disapproveAppt(id, reason) {
  const ok = await _apptUpdate({ id, action: 'status', status: 'disapproved', disapprovalReason: reason || '' })
  if (!ok) return false
  updateAppointmentStatus(id, 'disapproved')
  const a = appointments.find(a => a.id === id)
  if (a && reason) a.disapprovalReason = reason
  toast('Appointment request declined. The patient will be notified and may submit a new request.')
  renderPage()
  return true
}

// Taken-slot state for the staff reschedule modal — mirrors the patient
// reschedule modal's _rsTakenSlotTimes/_rsSlotConflicts, kept separate so
// the two modals never share/clobber each other's fetched data.
let _reTakenSlotTimes = []
let _reTakenSlotDur   = 30

// Calendar state for the staff reschedule modal's date picker — see
// _buildRescheduleCalCells() for the shared cell logic.
let _reCal = { doctorId: '', apptId: '', year: 0, month: 0, selectedDate: '' }

function reCalRender() {
  const doctor = doctors.find(d => d.id === _reCal.doctorId)
  const lbl = document.getElementById('re-cal-month-label')
  if (lbl) lbl.textContent = new Date(_reCal.year, _reCal.month, 1).toLocaleDateString('en-PH', { month:'long', year:'numeric' })
  const grid = document.getElementById('re-cal-cells')
  // Staff retain discretion over booking-window timing (see the function's
  // own doc comment) — enforceAdvanceWindow:false.
  if (grid) grid.innerHTML = _buildRescheduleCalCells(doctor, _reCal.year, _reCal.month, _reCal.selectedDate, 'window.reCalSelectDate', false)
  // Same dimming treatment as the booking wizard's own calendar
  // (amcRender(), main.js) — Prev fades once already on the current month,
  // since no date before today is ever a valid reschedule target anyway.
  const now  = new Date()
  const prev = document.getElementById('re-cal-prev')
  if (prev) {
    const atStart = _reCal.year === now.getFullYear() && _reCal.month === now.getMonth()
    prev.style.opacity = atStart ? '0.3' : '1'
    // Dimming alone still left the pointer cursor on hover, reading as
    // clickable even though the click just silently no-ops — same fix as
    // the calendar day cells (amc-unavailable, global.css).
    prev.style.cursor = atStart ? 'not-allowed' : 'pointer'
  }
}
window.reCalRender = reCalRender

function reCalGoMonth(delta) {
  const now = new Date()
  let month = _reCal.month + delta
  let year  = _reCal.year
  if (month > 11) { year++; month = 0 }
  if (month < 0)  { year--; month = 11 }
  // Can't reschedule to a date before today, so a month entirely in the
  // past has nothing to navigate to — same guard as the booking wizard's
  // own calendar (amcGoMonth()).
  if (year < now.getFullYear() || (year === now.getFullYear() && month < now.getMonth())) return
  _reCal.year = year; _reCal.month = month
  reCalRender()
}
window.reCalGoMonth = reCalGoMonth

function reCalSelectDate(dateStr) {
  _reCal.selectedDate = dateStr
  const inp = document.getElementById('re-date')
  if (inp) inp.value = dateStr
  // Same reasoning as amcSwapSelected — swap the highlighted cell directly so
  // the fade transition plays instead of getting skipped by a full rebuild.
  if (!amcSwapSelected('re-cal-cells', dateStr)) reCalRender()
  reOnDateChange(_reCal.doctorId, _reCal.apptId)
}
window.reCalSelectDate = reCalSelectDate

function _reSlotConflicts(slotTime, slotDur) {
  const sm = _clockToMinutes(slotTime)
  if (sm == null) return false
  return _reTakenSlotTimes.some(bt => {
    const bm = _clockToMinutes(bt.time), bd = bt.duration || _reTakenSlotDur
    return sm < bm + bd && sm + slotDur > bm
  })
}

// Builds the real slot grid from Consultation Settings (respecting lunch
// break) instead of a hardcoded, sparse list — so every slot the clinic
// actually offers shows up here, not just an arbitrary subset of them.
function _reBuildTimeOptions(keepTime) {
  const stepMin = _durationMinutes(consultationSettings.defaultDuration)
  const slots = consultationSettings.lunchBreak
    ? [..._buildSessionSlots(consultationSettings.morningStart, consultationSettings.morningEnd, stepMin),
       ..._buildSessionSlots(consultationSettings.afternoonStart, consultationSettings.afternoonEnd, stepMin)]
    : _buildSessionSlots(consultationSettings.morningStart, consultationSettings.afternoonEnd, stepMin)
  // The current/requested time might fall on a mark outside the clinic's
  // normal grid (e.g. a legacy appointment) — keep it selectable regardless.
  if (keepTime && !slots.includes(keepTime)) slots.push(keepTime)
  slots.sort((x, y) => _clockToMinutes(x) - _clockToMinutes(y))
  return slots
}

// Re-renders the #re-time-slots button grid, split into Morning/Afternoon
// sections — the exact same chunking/heading convention as the booking
// wizard's wizBuildTimeSlots() — so slots that conflict with this doctor's
// other appointments on the selected date show as booked. A real <button>
// gets a real CSS strikethrough, unlike a native <option> (which is drawn
// by the browser's own list widget and ignores text-decoration entirely
// regardless of inline style).
function _reRenderTimeSlots() {
  const el = document.getElementById('re-time-slots')
  if (!el) return
  const hidden  = document.getElementById('re-time')
  const current = hidden?.value || ''
  const stepMin = _durationMinutes(consultationSettings.defaultDuration)
  const slots   = _reBuildTimeOptions(current)

  const slotBtn = t => {
    const taken = _reSlotConflicts(t, stepMin)
    const isSel = t === current && !taken
    const cls   = 'time-slot' + (taken ? ' taken' : isSel ? ' selected' : '')
    const attrs = taken ? `disabled title="This slot is already booked for this doctor."` : `onclick="window.reSelectTime('${t}',this)"`
    return `<button type="button" class="${cls}" ${attrs}>${t}</button>`
  }

  const morning   = slots.filter(t => _clockToMinutes(t) < 720)
  const afternoon = slots.filter(t => _clockToMinutes(t) >= 720)

  // Exact same flex-wrap convention as the main booking wizard's
  // wizBuildTimeSlots() — the modal itself is widened (modal-xl) so all 8
  // slots per row actually fit on one line instead of wrapping.
  el.innerHTML = `
    <div style="margin-bottom:14px">
      <div style="font-size:.7rem;text-transform:uppercase;letter-spacing:.06em;color:#9CA3AF;font-weight:700;margin-bottom:8px">${afternoon.length ? 'Morning' : 'Available Times'}</div>
      <div style="display:flex;flex-wrap:wrap;gap:8px">${morning.map(slotBtn).join('')}</div>
    </div>
    ${afternoon.length ? `
    <div>
      <div style="font-size:.7rem;text-transform:uppercase;letter-spacing:.06em;color:#9CA3AF;font-weight:700;margin-bottom:8px">Afternoon</div>
      <div style="display:flex;flex-wrap:wrap;gap:8px">${afternoon.map(slotBtn).join('')}</div>
    </div>` : ''}`
}

function reSelectTime(time, btnEl) {
  const hidden = document.getElementById('re-time')
  if (hidden) hidden.value = time
  document.querySelectorAll('#re-time-slots .time-slot').forEach(b => b.classList.remove('selected'))
  btnEl.classList.add('selected')
}
window.reSelectTime = reSelectTime

// Fetches taken slots for the doctor on the newly-selected date (excluding
// this appointment's own current slot) and refreshes the time-slot grid.
async function reOnDateChange(doctorId, apptId) {
  const date = document.getElementById('re-date')?.value || ''
  _reTakenSlotTimes = []
  _reTakenSlotDur   = _durationMinutes(consultationSettings.defaultDuration)
  if (date && doctorId) {
    try {
      const r = await fetch(`api/appointments/taken.php?doctorId=${encodeURIComponent(doctorId)}&date=${encodeURIComponent(date)}&excludeId=${encodeURIComponent(apptId)}`)
      const d = await r.json()
      _reTakenSlotTimes = d.taken           || []
      _reTakenSlotDur   = d.defaultDuration || _reTakenSlotDur
    } catch (_) {}
  }
  _reRenderTimeSlots()
}
window.reOnDateChange = reOnDateChange

function rescheduleAppt(id) {
  const a = appointments.find(a => a.id === id)
  if (!a) return
  const fulfillingRequest = !!a.rescheduleRequest
  const defaultDate = a.rescheduleRequest?.preferredDate || a.date
  const defaultTime = a.rescheduleRequest?.preferredTime || a.time

  // Show what the patient actually asked for as its own plain-language line,
  // separate from the (possibly since-adjusted) form fields below it.
  const prefDateLabel = a.rescheduleRequest?.preferredDate ? fmtDate(a.rescheduleRequest.preferredDate) : ''
  const prefTimeLabel = a.rescheduleRequest?.preferredTime || ''
  let prefText = ''
  if (prefDateLabel && prefTimeLabel) prefText = `${prefDateLabel} at ${prefTimeLabel}`
  else if (prefDateLabel) prefText = prefDateLabel
  else if (prefTimeLabel) prefText = prefTimeLabel

  const [dY, dM, dD] = defaultDate.split('-').map(Number)
  _reCal = { doctorId: a.doctorId, apptId: id, year: dY, month: dM - 1, selectedDate: defaultDate }

  showModal(`
    <div class="modal-header">
      <div class="modal-title">Reschedule Appointment</div>
      <button class="modal-close" onclick="window.closeModal()">&times;</button>
    </div>
    <div class="modal-body">
      <style>
        /* modal-lg (720px) isn't wide enough to fit all 8 same-sized slots
           per row like the booking wizard does — widen just this modal
           rather than shrinking the buttons to fit the smaller size. */
        .modal-box.modal-xl { max-width:840px; }
        .time-slot { padding:9px 14px; border-radius:8px; border:1.5px solid #e5e7eb; background:#fff;
          -webkit-appearance:none; appearance:none; color:#1C1C1C;
          font-family:'Poppins',sans-serif; font-size:.82rem; cursor:pointer; transition:all .15s; white-space:nowrap; }
        .time-slot:hover:not(.taken) { border-color:#E8760A; }
        .time-slot.selected { background:#E8760A; color:#fff; border-color:#E8760A; }
        .time-slot.taken { background:#F3F4F6; color:#9CA3AF; cursor:not-allowed; text-decoration:line-through; }
        .time-slot-legend { display:flex; flex-wrap:wrap; gap:12px; margin-top:10px; font-family:'Poppins',sans-serif; font-size:.72rem; color:#6B7280; }
        .time-slot-legend-item { display:flex; align-items:center; gap:6px; }
        .time-slot-legend-swatch { width:10px; height:10px; border-radius:3px; display:inline-block; flex-shrink:0; }
        /* ── Mini calendar — same convention as the booking wizard's own
           amc-* classes (pages.js), copied here since modals don't share
           the wizard page's stylesheet. ── */
        .appt-mini-cal { display:grid; grid-template-columns:repeat(7,minmax(0,1fr)); gap:3px; min-width:0; }
        .amc-hdr { text-align:center; font-size:.65rem; font-weight:700; color:#9CA3AF; padding:4px 0; text-transform:uppercase; }
        .amc-day { aspect-ratio:1; display:flex; align-items:center; justify-content:center; border-radius:6px;
          font-size:.88rem; cursor:pointer; position:relative; color:#374151;
          transition:background-color .15s, color .15s; }
        .amc-day:hover:not(.amc-past):not(.amc-empty):not(.amc-far) { background:#FFF0DC; }
        .amc-day.amc-avail { background:#ECFDF5; color:#065F46; font-weight:600; }
        .amc-day.amc-unavailable { background:#F3F4F6; color:#9CA3AF; cursor:not-allowed; }
        .amc-day.amc-today { outline:2px solid #E8760A; font-weight:700; }
        .amc-day.amc-selected { background:#E8760A !important; color:#fff !important; font-weight:700; }
        /* Solid, legible muted colors instead of opacity — same fix as the
           booking wizard's own calendar (.amc-day.amc-past, pages.js):
           opacity used to fade the day NUMBER along with the background,
           reading as barely legible instead of a clearly-muted color. */
        .amc-day.amc-past { color:#C1C7D0; cursor:not-allowed; }
        .amc-day.amc-far { color:#C1C7D0; cursor:not-allowed; background:#f9fafb; }
        .amc-day.amc-empty { cursor:default; }
        .amc-day.amc-holiday { background:#FFF1F2; color:#f43f5e; cursor:not-allowed; font-weight:600; }
        .amc-holiday-lbl { position:absolute; left:2px; right:2px; top:calc(50% + 8px); font-size:.7rem; line-height:1.15; text-align:center; overflow:hidden; display:-webkit-box; -webkit-line-clamp:2; -webkit-box-orient:vertical; font-weight:600; padding:0 1px; }
        .amc-day.amc-blocked { background:#FEE2E2; color:#B91C1C; cursor:not-allowed; font-weight:700; text-decoration:line-through; text-decoration-color:rgba(185,28,28,0.5); }
        /* Same responsive shrink as the booking wizard's calendar (pages.js)
           — without this, a holiday name (e.g. "Ninoy Aquino Day") wraps
           past 2 lines and spills out of the cell on narrow/phone widths,
           since this modal's grid has less room than the full wizard page. */
        @media (max-width:480px) {
          .amc-day.amc-holiday { font-size:.7rem; }
          .amc-holiday-lbl { font-size:.44rem; top:calc(50% + 4px); line-height:1.05; }
        }
      </style>
      ${fulfillingRequest ? `<div style="background:#FFF7ED;border:1px solid #FED7AA;border-radius:8px;padding:10px 12px;margin-bottom:14px;font-size:.8rem;color:#9A3412">
        Fulfilling the patient's reschedule request.${prefText ? ` They asked for <strong>${prefText}</strong>, already pre-filled below.` : ' No specific date or time was requested.'}
      </div>` : ''}
      <div class="form-group"><label class="form-label">Patient</label>
        <input class="form-input" value="${a.patientName}" disabled></div>
      <div class="form-group">
        <label class="form-label">New Date</label>
        <input type="hidden" id="re-date" value="${defaultDate}">
        <div style="display:flex;align-items:center;justify-content:space-between;margin-bottom:8px">
          <button type="button" class="btn-icon" id="re-cal-prev" onclick="window.reCalGoMonth(-1)">${icon('chevron-left','icon-sm')}</button>
          <span id="re-cal-month-label" style="font-size:.85rem;font-weight:700;color:#1C1C1C"></span>
          <button type="button" class="btn-icon" onclick="window.reCalGoMonth(1)">${icon('chevron-right','icon-sm')}</button>
        </div>
        <div class="appt-mini-cal">
          ${['SUN','MON','TUE','WED','THU','FRI','SAT'].map(d=>`<div class="amc-hdr">${d}</div>`).join('')}
        </div>
        <div class="appt-mini-cal" id="re-cal-cells"></div>
        <div style="display:flex;gap:12px;margin-top:10px;flex-wrap:wrap">
          <span style="display:flex;align-items:center;gap:5px;font-size:.7rem;color:#6B7280"><span style="width:10px;height:10px;border-radius:3px;background:#ECFDF5;border:1px solid #6EE7B7;display:inline-block"></span>Available</span>
          <span style="display:flex;align-items:center;gap:5px;font-size:.7rem;color:#6B7280"><span style="width:10px;height:10px;border-radius:3px;background:#F3F4F6;display:inline-block"></span>Unavailable</span>
          <span style="display:flex;align-items:center;gap:5px;font-size:.7rem;color:#6B7280"><span style="width:10px;height:10px;border-radius:3px;background:#FEE2E2;border:1px solid #FCA5A5;display:inline-block"></span>Doctor Unavailable</span>
          <span style="display:flex;align-items:center;gap:5px;font-size:.7rem;color:#6B7280"><span style="width:10px;height:10px;border-radius:3px;background:#FFF1F2;border:1px solid #fda4af;display:inline-block"></span>PH Holiday</span>
        </div>
      </div>
      <div class="form-group"><label class="form-label">New Time</label>
        <div id="re-time-slots"></div>
        <div class="time-slot-legend">
          <div class="time-slot-legend-item"><span class="time-slot-legend-swatch" style="background:#fff;border:1.5px solid #e5e7eb"></span>Available</div>
          <div class="time-slot-legend-item"><span class="time-slot-legend-swatch" style="background:#E8760A"></span>Selected</div>
          <div class="time-slot-legend-item"><span class="time-slot-legend-swatch" style="background:#F3F4F6;border:1.5px solid #e5e7eb"></span>Booked</div>
        </div>
        <input type="hidden" id="re-time" value="${defaultTime}"></div>
      <div class="form-group" style="margin-bottom:0"><label class="form-label">Note <span style="font-size:.75rem;color:#9CA3AF">(optional)</span></label>
        <textarea id="re-note" class="form-textarea" rows="2" placeholder="e.g. Doctor unavailable on original date, patient requested earlier slot…" style="resize:none">${a.rescheduleNote || ''}</textarea></div>
    </div>
    <div class="modal-footer">
      <button class="btn-secondary" onclick="window.closeModal()">Cancel</button>
      <button class="btn-primary" id="reschedule-confirm-btn" onclick="window.doReschedule('${id}',${fulfillingRequest})">Confirm Reschedule</button>
    </div>`, 'modal-xl')

  reCalRender()
  // Populate the initial slot grid/booked states for today's default date too
  // (fire-and-forget — same pattern used by the main wizard's own async
  // slot-loading calls), not just after the reviewer changes the date.
  reOnDateChange(a.doctorId, id)
}

async function doReschedule(id, fulfillRequest = false) {
  const btn = document.getElementById('reschedule-confirm-btn')
  if (_btnBusy(btn, 'primary', 'Rescheduling…')) return

  const a    = appointments.find(a => a.id === id)
  if (!a) { _btnIdle(btn); return }
  const date = document.getElementById('re-date').value
  const time = document.getElementById('re-time').value
  const note = (document.getElementById('re-note')?.value || '').trim()
  const ok   = await _apptUpdate({ id, action: 'reschedule', date, time, rescheduleNote: note, fulfillRequest })
  if (!ok) {
    // The request may have already been accepted from another session/tab —
    // re-sync so the stale "Accept & Reschedule" UI clears instead of being
    // clickable again and silently re-applying outdated date/time.
    if (fulfillRequest) {
      closeModal()
      if (window._syncAppointments) window._syncAppointments()
      return
    }
    _btnIdle(btn)
    return
  }
  a.date = date
  a.time = time
  if (note) a.rescheduleNote = note
  a.rescheduledAt = new Date().toISOString()
  if (a.rescheduleRequest) delete a.rescheduleRequest
  closeModal()
  toast('Appointment rescheduled.')
  renderPage()
}

window.approveAppt    = approveAppt
window.cancelAppt     = cancelAppt
window.disapproveAppt = disapproveAppt
window.rescheduleAppt = rescheduleAppt
window.doReschedule   = doReschedule

// ════════════════════════════════════════════════════════════════
//  DOCTOR — FOLLOW-UP DATE & TIME PICKER (New/Edit Examination wizard,
//  Consultation step) — same calendar+time-slot pattern as the staff
//  reschedule modal above (rescheduleAppt(), _buildRescheduleCalCells()),
//  scoped to the doctor filling out the exam rather than an existing
//  appointment's doctor. Still only ever a suggestion, not a real booked
//  slot (see the Consultation step's own doc comment, pages.js) — staff
//  still book the actual appointment through the normal wizard, which
//  re-validates everything itself — but blocked dates/times are ruled out
//  here too, same as a reschedule, so what the doctor recommends is
//  realistic from the moment it's made instead of staff discovering it
//  isn't available only once they go to act on it.
// ════════════════════════════════════════════════════════════════
let _fuTakenSlotTimes = []
let _fuTakenSlotDur   = 30
let _fuCal = { doctorId: '', year: 0, month: 0, selectedDate: '' }

function fuCalRender() {
  const doctor = doctors.find(d => d.id === _fuCal.doctorId)
  const lbl = document.getElementById('fu-cal-month-label')
  if (lbl) lbl.textContent = new Date(_fuCal.year, _fuCal.month, 1).toLocaleDateString('en-PH', { month:'long', year:'numeric' })
  const grid = document.getElementById('fu-cal-cells')
  // Doctor's own discretion over timing here (enforceAdvanceWindow:false) —
  // same reasoning as the staff reschedule calendar, this isn't a patient
  // self-booking subject to the advance-booking window.
  if (grid) grid.innerHTML = _buildRescheduleCalCells(doctor, _fuCal.year, _fuCal.month, _fuCal.selectedDate, 'window.fuCalSelectDate', false)
  const now  = new Date()
  const prev = document.getElementById('fu-cal-prev')
  if (prev) {
    const atStart = _fuCal.year === now.getFullYear() && _fuCal.month === now.getMonth()
    prev.style.opacity = atStart ? '0.3' : '1'
    prev.style.cursor = atStart ? 'not-allowed' : 'pointer'
  }
}
window.fuCalRender = fuCalRender

function fuCalGoMonth(delta) {
  const now = new Date()
  let month = _fuCal.month + delta
  let year  = _fuCal.year
  if (month > 11) { year++; month = 0 }
  if (month < 0)  { year--; month = 11 }
  if (year < now.getFullYear() || (year === now.getFullYear() && month < now.getMonth())) return
  _fuCal.year = year; _fuCal.month = month
  fuCalRender()
}
window.fuCalGoMonth = fuCalGoMonth

function fuCalSelectDate(dateStr) {
  _fuCal.selectedDate = dateStr
  const inp = document.getElementById('fu-date')
  if (inp) inp.value = dateStr
  if (!amcSwapSelected('fu-cal-cells', dateStr)) fuCalRender()
  fuOnDateChange()
}
window.fuCalSelectDate = fuCalSelectDate

function _fuSlotConflicts(slotTime, slotDur) {
  const sm = _clockToMinutes(slotTime)
  if (sm == null) return false
  return _fuTakenSlotTimes.some(bt => {
    const bm = _clockToMinutes(bt.time), bd = bt.duration || _fuTakenSlotDur
    return sm < bm + bd && sm + slotDur > bm
  })
}

function _fuBuildTimeOptions(keepTime) {
  const stepMin = _durationMinutes(consultationSettings.defaultDuration)
  const slots = consultationSettings.lunchBreak
    ? [..._buildSessionSlots(consultationSettings.morningStart, consultationSettings.morningEnd, stepMin),
       ..._buildSessionSlots(consultationSettings.afternoonStart, consultationSettings.afternoonEnd, stepMin)]
    : _buildSessionSlots(consultationSettings.morningStart, consultationSettings.afternoonEnd, stepMin)
  if (keepTime && !slots.includes(keepTime)) slots.push(keepTime)
  slots.sort((x, y) => _clockToMinutes(x) - _clockToMinutes(y))
  return slots
}

function _fuRenderTimeSlots() {
  const el = document.getElementById('fu-time-slots')
  if (!el) return
  const hidden  = document.getElementById('fu-time')
  const current = hidden?.value || ''
  const stepMin = _durationMinutes(consultationSettings.defaultDuration)
  const slots   = _fuBuildTimeOptions(current)

  const slotBtn = t => {
    const taken = _fuSlotConflicts(t, stepMin)
    const isSel = t === current && !taken
    const cls   = 'time-slot' + (taken ? ' taken' : isSel ? ' selected' : '')
    const attrs = taken ? `disabled title="This slot is already booked for this doctor."` : `onclick="window.fuSelectTime('${t}',this)"`
    return `<button type="button" class="${cls}" ${attrs}>${t}</button>`
  }

  const morning   = slots.filter(t => _clockToMinutes(t) < 720)
  const afternoon = slots.filter(t => _clockToMinutes(t) >= 720)

  el.innerHTML = `
    <div style="margin-bottom:14px">
      <div style="font-size:.7rem;text-transform:uppercase;letter-spacing:.06em;color:#9CA3AF;font-weight:700;margin-bottom:8px">${afternoon.length ? 'Morning' : 'Available Times'}</div>
      <div style="display:flex;flex-wrap:wrap;gap:8px">${morning.map(slotBtn).join('')}</div>
    </div>
    ${afternoon.length ? `
    <div>
      <div style="font-size:.7rem;text-transform:uppercase;letter-spacing:.06em;color:#9CA3AF;font-weight:700;margin-bottom:8px">Afternoon</div>
      <div style="display:flex;flex-wrap:wrap;gap:8px">${afternoon.map(slotBtn).join('')}</div>
    </div>` : ''}`
}

function fuSelectTime(time, btnEl) {
  const hidden = document.getElementById('fu-time')
  if (hidden) hidden.value = time
  document.querySelectorAll('#fu-time-slots .time-slot').forEach(b => b.classList.remove('selected'))
  btnEl.classList.add('selected')
}
window.fuSelectTime = fuSelectTime

async function fuOnDateChange() {
  const date = document.getElementById('fu-date')?.value || ''
  _fuTakenSlotTimes = []
  _fuTakenSlotDur   = _durationMinutes(consultationSettings.defaultDuration)
  if (date && _fuCal.doctorId) {
    try {
      const r = await fetch(`api/appointments/taken.php?doctorId=${encodeURIComponent(_fuCal.doctorId)}&date=${encodeURIComponent(date)}`)
      const d = await r.json()
      _fuTakenSlotTimes = d.taken           || []
      _fuTakenSlotDur   = d.defaultDuration || _fuTakenSlotDur
    } catch (_) {}
  }
  _fuRenderTimeSlots()
}
window.fuOnDateChange = fuOnDateChange

// Opens the picker modal — called from the Consultation step's "Select
// date & time" button (pageNewExamination(), pages.js). "The doctor" here
// is always the logged-in user (only doctors reach this step at all), so
// there's no doctor field to pick — same id-lookup convention used
// elsewhere in the exam wizard to resolve the current doctor's own record.
function openFollowUpPicker() {
  const doc = doctors.find(d => d.id === state.user?.id)
  const curDate = document.getElementById('ne-con-followup')?.value || ''
  const curTime = document.getElementById('ne-con-followup-time')?.value || ''

  const now = new Date()
  const [dY, dM, dD] = curDate ? curDate.split('-').map(Number) : [now.getFullYear(), now.getMonth()+1, now.getDate()]
  _fuCal = { doctorId: doc?.id || '', year: dY, month: dM - 1, selectedDate: curDate }

  showModal(`
    <div class="modal-header">
      <div class="modal-title">Follow-up Date &amp; Time</div>
      <button class="modal-close" onclick="window.closeModal()">&times;</button>
    </div>
    <div class="modal-body">
      <style>
        .modal-box.modal-xl { max-width:840px; }
        .time-slot { padding:9px 14px; border-radius:8px; border:1.5px solid #e5e7eb; background:#fff;
          -webkit-appearance:none; appearance:none; color:#1C1C1C;
          font-family:'Poppins',sans-serif; font-size:.82rem; cursor:pointer; transition:all .15s; white-space:nowrap; }
        .time-slot:hover:not(.taken) { border-color:#E8760A; }
        .time-slot.selected { background:#E8760A; color:#fff; border-color:#E8760A; }
        .time-slot.taken { background:#F3F4F6; color:#9CA3AF; cursor:not-allowed; text-decoration:line-through; }
        .time-slot-legend { display:flex; flex-wrap:wrap; gap:12px; margin-top:10px; font-family:'Poppins',sans-serif; font-size:.72rem; color:#6B7280; }
        .time-slot-legend-item { display:flex; align-items:center; gap:6px; }
        .time-slot-legend-swatch { width:10px; height:10px; border-radius:3px; display:inline-block; flex-shrink:0; }
        .appt-mini-cal { display:grid; grid-template-columns:repeat(7,minmax(0,1fr)); gap:3px; min-width:0; }
        .amc-hdr { text-align:center; font-size:.65rem; font-weight:700; color:#9CA3AF; padding:4px 0; text-transform:uppercase; }
        .amc-day { aspect-ratio:1; display:flex; align-items:center; justify-content:center; border-radius:6px;
          font-size:.88rem; cursor:pointer; position:relative; color:#374151;
          transition:background-color .15s, color .15s; }
        .amc-day:hover:not(.amc-past):not(.amc-empty):not(.amc-far) { background:#FFF0DC; }
        .amc-day.amc-avail { background:#ECFDF5; color:#065F46; font-weight:600; }
        .amc-day.amc-unavailable { background:#F3F4F6; color:#9CA3AF; cursor:not-allowed; }
        .amc-day.amc-today { outline:2px solid #E8760A; font-weight:700; }
        .amc-day.amc-selected { background:#E8760A !important; color:#fff !important; font-weight:700; }
        .amc-day.amc-past { color:#C1C7D0; cursor:not-allowed; }
        .amc-day.amc-far { color:#C1C7D0; cursor:not-allowed; background:#f9fafb; }
        .amc-day.amc-empty { cursor:default; }
        .amc-day.amc-holiday { background:#FFF1F2; color:#f43f5e; cursor:not-allowed; font-weight:600; }
        .amc-holiday-lbl { position:absolute; left:2px; right:2px; top:calc(50% + 8px); font-size:.7rem; line-height:1.15; text-align:center; overflow:hidden; display:-webkit-box; -webkit-line-clamp:2; -webkit-box-orient:vertical; font-weight:600; padding:0 1px; }
        .amc-day.amc-blocked { background:#FEE2E2; color:#B91C1C; cursor:not-allowed; font-weight:700; text-decoration:line-through; text-decoration-color:rgba(185,28,28,0.5); }
        @media (max-width:480px) {
          .amc-day.amc-holiday { font-size:.7rem; }
          .amc-holiday-lbl { font-size:.44rem; top:calc(50% + 4px); line-height:1.05; }
        }
      </style>
      <div style="background:#eff6ff;border:1px solid #bfdbfe;border-radius:8px;padding:10px 12px;margin-bottom:14px;font-size:.8rem;color:#1e40af">
        This is a recommendation for staff to act on, not an actual booking — pick a date and time that's realistically open so what staff schedule can match it.
      </div>
      <div class="form-group">
        <label class="form-label">Date</label>
        <input type="hidden" id="fu-date" value="${curDate}">
        <div style="display:flex;align-items:center;justify-content:space-between;margin-bottom:8px">
          <button type="button" class="btn-icon" id="fu-cal-prev" onclick="window.fuCalGoMonth(-1)">${icon('chevron-left','icon-sm')}</button>
          <span id="fu-cal-month-label" style="font-size:.85rem;font-weight:700;color:#1C1C1C"></span>
          <button type="button" class="btn-icon" onclick="window.fuCalGoMonth(1)">${icon('chevron-right','icon-sm')}</button>
        </div>
        <div class="appt-mini-cal">
          ${['SUN','MON','TUE','WED','THU','FRI','SAT'].map(d=>`<div class="amc-hdr">${d}</div>`).join('')}
        </div>
        <div class="appt-mini-cal" id="fu-cal-cells"></div>
        <div style="display:flex;gap:12px;margin-top:10px;flex-wrap:wrap">
          <span style="display:flex;align-items:center;gap:5px;font-size:.7rem;color:#6B7280"><span style="width:10px;height:10px;border-radius:3px;background:#ECFDF5;border:1px solid #6EE7B7;display:inline-block"></span>Available</span>
          <span style="display:flex;align-items:center;gap:5px;font-size:.7rem;color:#6B7280"><span style="width:10px;height:10px;border-radius:3px;background:#F3F4F6;display:inline-block"></span>Unavailable</span>
          <span style="display:flex;align-items:center;gap:5px;font-size:.7rem;color:#6B7280"><span style="width:10px;height:10px;border-radius:3px;background:#FEE2E2;border:1px solid #FCA5A5;display:inline-block"></span>Doctor Unavailable</span>
          <span style="display:flex;align-items:center;gap:5px;font-size:.7rem;color:#6B7280"><span style="width:10px;height:10px;border-radius:3px;background:#FFF1F2;border:1px solid #fda4af;display:inline-block"></span>PH Holiday</span>
        </div>
      </div>
      <div class="form-group" style="margin-bottom:0"><label class="form-label">Time</label>
        <div id="fu-time-slots"></div>
        <div class="time-slot-legend">
          <div class="time-slot-legend-item"><span class="time-slot-legend-swatch" style="background:#fff;border:1.5px solid #e5e7eb"></span>Available</div>
          <div class="time-slot-legend-item"><span class="time-slot-legend-swatch" style="background:#E8760A"></span>Selected</div>
          <div class="time-slot-legend-item"><span class="time-slot-legend-swatch" style="background:#F3F4F6;border:1.5px solid #e5e7eb"></span>Booked</div>
        </div>
        <input type="hidden" id="fu-time" value="${curTime}">
      </div>
    </div>
    <div class="modal-footer">
      <button class="btn-secondary" onclick="window.closeModal()">Cancel</button>
      <button class="btn-primary" onclick="window.confirmFollowUpPicker()">Save Date &amp; Time</button>
    </div>`, 'modal-xl')

  fuCalRender()
  if (curDate) fuOnDateChange()
}
window.openFollowUpPicker = openFollowUpPicker

// Writes the modal's picked date/time back into the Consultation step's
// own hidden fields and updates the visible summary — saveNewExam() reads
// those two hidden inputs directly, not anything from this modal, so
// nothing else needs to know the modal ever existed.
function confirmFollowUpPicker() {
  const date = document.getElementById('fu-date')?.value || ''
  const time = document.getElementById('fu-time')?.value || ''
  if (!date) { toast('Please select a date.', 'error'); return }
  // Time is required, not optional — a date-only recommendation left
  // nothing for wizInitStaff() (main.js) to pre-select once staff act on
  // it, silently defeating the whole point of adding a time slot picker
  // here in the first place.
  if (!time) { toast('Please select a time.', 'error'); return }

  const dateInput = document.getElementById('ne-con-followup')
  const timeInput = document.getElementById('ne-con-followup-time')
  if (dateInput) dateInput.value = date
  if (timeInput) timeInput.value = time

  const label = document.getElementById('ne-followup-picker-label')
  if (label) {
    // Abbreviated month — matches the Consultation step's own initial-render
    // label (pageNewExamination(), pages.js), and keeps this text short
    // enough that the button rarely has to ellipsis it (see the wider,
    // flexible ne-followup-date-wrap that field sits in, pages.js).
    const dt = new Date(date + 'T00:00:00')
    const dateLabel = dt.toLocaleDateString('en-PH', { year:'numeric', month:'short', day:'numeric' })
    label.textContent = `${dateLabel} at ${time}`
    label.style.color = '#1C1C1C'
  }
  closeModal()
}
window.confirmFollowUpPicker = confirmFollowUpPicker

// ════════════════════════════════════════════════════════════════
//  PATIENT — REQUEST RESCHEDULE
// ════════════════════════════════════════════════════════════════
let _rsTakenSlotTimes = []
let _rsTakenSlotDur   = 30

function _rsSlotConflicts(slotTime, slotDur) {
  const sm = _clockToMinutes(slotTime)
  if (sm == null) return false
  return _rsTakenSlotTimes.some(bt => {
    const bm = _clockToMinutes(bt.time), bd = bt.duration || _rsTakenSlotDur
    return sm < bm + bd && sm + slotDur > bm
  })
}

// Doctor-scoped calendar state for the reschedule modal — same
// classification logic as the booking wizard's amcRender(), via the shared
// _buildRescheduleCalCells() (main.js), scoped to the one doctor already on
// the appointment (the doctor can't change mid-reschedule, unlike Step 1 of
// the main wizard). A plain native date picker can't disable individual
// dates at all, so it could never actually enforce clinic days/doctor
// availability/blocked dates — hence the real month-grid calendar here.
let _rsCal = { doctorId: '', apptId: '', year: 0, month: 0, selectedDate: '', time: '' }

function rsCalRender() {
  const doctor = doctors.find(d => d.id === _rsCal.doctorId)
  const lbl = document.getElementById('rs-cal-month-label')
  if (lbl) lbl.textContent = new Date(_rsCal.year, _rsCal.month, 1).toLocaleDateString('en-PH', { month:'long', year:'numeric' })
  const grid = document.getElementById('rs-cal-cells')
  // Patients rescheduling themselves stay inside the clinic's advance-
  // booking window, same as any other self-service booking — enforceAdvanceWindow:true.
  if (grid) grid.innerHTML = _buildRescheduleCalCells(doctor, _rsCal.year, _rsCal.month, _rsCal.selectedDate, 'window.rsCalSelectDate', true)
  // Same dimming treatment as the booking wizard's own calendar
  // (amcRender(), main.js) — Prev fades once already on the current month.
  const now  = new Date()
  const prev = document.getElementById('rs-cal-prev')
  if (prev) {
    const atStart = _rsCal.year === now.getFullYear() && _rsCal.month === now.getMonth()
    prev.style.opacity = atStart ? '0.3' : '1'
    prev.style.cursor  = atStart ? 'not-allowed' : 'pointer'
  }
}
window.rsCalRender = rsCalRender

function rsCalGoMonth(delta) {
  const now = new Date()
  let month = _rsCal.month + delta
  let year  = _rsCal.year
  if (month > 11) { year++; month = 0 }
  if (month < 0)  { year--; month = 11 }
  // Same guard as the booking wizard's own calendar (amcGoMonth()) — a
  // month entirely before today has nothing to reschedule to.
  if (year < now.getFullYear() || (year === now.getFullYear() && month < now.getMonth())) return
  _rsCal.year = year; _rsCal.month = month
  rsCalRender()
}
window.rsCalGoMonth = rsCalGoMonth

function rsCalSelectDate(dateStr) {
  _rsCal.selectedDate = dateStr
  const inp = document.getElementById('rs-date')
  if (inp) inp.value = dateStr
  if (!amcSwapSelected('rs-cal-cells', dateStr)) rsCalRender()
  rsOnDateChange(_rsCal.doctorId, _rsCal.apptId)
}
window.rsCalSelectDate = rsCalSelectDate

// Fetches taken slots for the doctor on the newly-picked date (excluding
// this appointment's own current slot) and rebuilds the time-slot grid.
async function rsOnDateChange(doctorId, apptId) {
  const date = document.getElementById('rs-date')?.value || ''
  _rsCal.selectedDate = date
  _rsCal.time = ''
  const timeInp = document.getElementById('rs-time')
  if (timeInp) timeInp.value = ''
  const grp = document.getElementById('rs-time-group')
  if (grp) grp.style.display = date ? '' : 'none'

  _rsTakenSlotTimes = []
  _rsTakenSlotDur   = _durationMinutes(consultationSettings.defaultDuration)
  if (date && doctorId) {
    try {
      const r = await fetch(`api/appointments/taken.php?doctorId=${encodeURIComponent(doctorId)}&date=${encodeURIComponent(date)}&excludeId=${encodeURIComponent(apptId)}`)
      const d = await r.json()
      _rsTakenSlotTimes = d.taken           || []
      _rsTakenSlotDur   = d.defaultDuration || _rsTakenSlotDur
    } catch (_) {}
  }
  rsBuildTimeSlots()
}
window.rsOnDateChange = rsOnDateChange

// ── Time-slot grid — same Available/Fully-booked/Selected/Past convention
// as the main booking wizard's wizBuildTimeSlots() (main.js), scoped to the
// appointment's fixed doctor via the already-fetched _rsTakenSlotTimes.
function rsBuildTimeSlots() {
  const el = document.getElementById('rs-time-slots')
  if (!el) return

  const stepMin = _durationMinutes(consultationSettings.defaultDuration)
  const _toMin  = t => {
    const [time, period] = t.split(' ')
    let [h, m] = time.split(':').map(Number)
    if (period === 'PM' && h !== 12) h += 12
    if (period === 'AM' && h === 12) h = 0
    return h * 60 + m
  }
  // Narrow the clinic-wide session window to this specific doctor's own
  // configured hours (see _clampToDoctorHours) — this appointment's
  // doctor is fixed (a reschedule keeps the same doctor), so unlike the
  // multi-doctor "any available optometrist" wizard flow there's exactly
  // one doctor's hours to clamp against here.
  const _rsDoc = doctors.find(dd => dd.id === _rsCal.doctorId)
  let morning, afternoon
  if (consultationSettings.lunchBreak) {
    const [mStart, mEnd] = _clampToDoctorHours(consultationSettings.morningStart,   consultationSettings.morningEnd,   _rsDoc?.hours)
    const [aStart, aEnd] = _clampToDoctorHours(consultationSettings.afternoonStart, consultationSettings.afternoonEnd, _rsDoc?.hours)
    morning   = _buildSessionSlots(mStart, mEnd, stepMin)
    afternoon = _buildSessionSlots(aStart, aEnd, stepMin)
  } else {
    const [fStart, fEnd] = _clampToDoctorHours(consultationSettings.morningStart, consultationSettings.afternoonEnd, _rsDoc?.hours)
    const allSlots = _buildSessionSlots(fStart, fEnd, stepMin)
    morning   = allSlots.filter(t => _toMin(t) < 720)
    afternoon = allSlots.filter(t => _toMin(t) >= 720)
  }

  const today   = localDateStr()
  const isToday = _rsCal.selectedDate === today
  const nowMin  = isToday ? new Date().getHours() * 60 + new Date().getMinutes() : -1

  // Unlike the main booking wizard, a fully-booked slot here is just
  // disabled (not selectable) — this modal only records a preferred slot
  // for staff to review, so there's no waitlist to offer it into.
  const slotBtn = t => {
    const isFull = _rsSlotConflicts(t, _rsTakenSlotDur)
    const isPast = isToday && _toMin(t) <= nowMin
    const isSel  = t === _rsCal.time && !isPast
    const cls    = 'time-slot' + (isPast || isFull ? ' taken' : isSel ? ' selected' : '')
    const tip    = isPast ? 'This time slot has already passed.'
                 : isFull ? 'This slot is fully booked.'
                 : ''
    const disabled = (isPast || isFull) ? `disabled title="${tip}"` : ''
    return `<button type="button" class="${cls}" ${disabled} onclick="window.rsSelectTime('${t}',this)">${t}</button>`
  }

  el.innerHTML = `
    <div style="margin-bottom:10px">
      <div style="font-size:.68rem;text-transform:uppercase;letter-spacing:.06em;color:#9CA3AF;font-weight:700;margin-bottom:6px">${afternoon.length ? 'Morning' : 'Available Times'}</div>
      <div style="display:flex;flex-wrap:wrap;gap:8px">${morning.map(slotBtn).join('')}</div>
    </div>
    ${afternoon.length ? `
    <div>
      <div style="font-size:.68rem;text-transform:uppercase;letter-spacing:.06em;color:#9CA3AF;font-weight:700;margin-bottom:6px">Afternoon</div>
      <div style="display:flex;flex-wrap:wrap;gap:8px">${afternoon.map(slotBtn).join('')}</div>
    </div>` : ''}`

  // If the previously selected time is now past (e.g. picking "today" after
  // the clock moved on), clear it — mirrors wizBuildTimeSlots()'s same guard.
  if (_rsCal.time && isToday && _toMin(_rsCal.time) <= nowMin) {
    _rsCal.time = ''
    const inp = document.getElementById('rs-time')
    if (inp) inp.value = ''
  }
}

function rsSelectTime(time, btnEl) {
  _rsCal.time = time
  document.querySelectorAll('#rs-time-slots .time-slot').forEach(b => b.classList.remove('selected'))
  btnEl.classList.add('selected')
  const inp = document.getElementById('rs-time')
  if (inp) inp.value = time
}
window.rsSelectTime = rsSelectTime

function requestReschedule(id) {
  const a = appointments.find(a => a.id === id)
  if (!a) return

  // Defense in depth — the button that opens this modal already hides/disables
  // itself past the deadline, but don't rely on that alone for something
  // that blocks a real reschedule request.
  if (state.role === 'patient' && !apptReschedulable(a)) { explainRescheduleDeadline(); return }

  _rsTakenSlotTimes = []
  _rsTakenSlotDur   = _durationMinutes(consultationSettings.defaultDuration)
  const now = new Date()
  _rsCal = { doctorId: a.doctorId, apptId: id, year: now.getFullYear(), month: now.getMonth(), selectedDate: '', time: '' }

  const fmtD = d => { const dt = new Date(d); return isNaN(dt) ? d : dt.toLocaleDateString('en-PH', { year:'numeric', month:'short', day:'numeric' }) }

  showModal(`
    <div class="modal-header">
      <div class="modal-title">Request Reschedule</div>
      <button class="modal-close" onclick="window.closeModal()">&times;</button>
    </div>
    <div class="modal-body">
      <style>
        .modal-box.modal-xl { max-width:840px; }
        .time-slot { padding:9px 14px; border-radius:8px; border:1.5px solid #e5e7eb; background:#fff;
          -webkit-appearance:none; appearance:none; color:#1C1C1C;
          font-family:'Poppins',sans-serif; font-size:.82rem; cursor:pointer; transition:all .15s; white-space:nowrap; }
        .time-slot:hover:not(.taken) { border-color:#E8760A; }
        .time-slot.selected { background:#E8760A; color:#fff; border-color:#E8760A; }
        .time-slot.taken { background:#F3F4F6; color:#9CA3AF; cursor:not-allowed; text-decoration:line-through; }
        .time-slot-legend { display:flex; flex-wrap:wrap; gap:12px; margin-top:10px; font-family:'Poppins',sans-serif; font-size:.72rem; color:#6B7280; }
        .time-slot-legend-item { display:flex; align-items:center; gap:6px; }
        .time-slot-legend-swatch { width:10px; height:10px; border-radius:3px; display:inline-block; flex-shrink:0; }
        /* ── Mini calendar — same convention as the booking wizard's own
           amc-* classes (pages.js), copied here since modals don't share
           the wizard page's stylesheet. ── */
        .appt-mini-cal { display:grid; grid-template-columns:repeat(7,minmax(0,1fr)); gap:3px; min-width:0; }
        .amc-hdr { text-align:center; font-size:.65rem; font-weight:700; color:#9CA3AF; padding:4px 0; text-transform:uppercase; }
        .amc-day { aspect-ratio:1; display:flex; align-items:center; justify-content:center; border-radius:6px;
          font-size:.88rem; cursor:pointer; position:relative; color:#374151;
          transition:background-color .15s, color .15s; }
        .amc-day:hover:not(.amc-past):not(.amc-empty):not(.amc-far) { background:#FFF0DC; }
        .amc-day.amc-avail { background:#ECFDF5; color:#065F46; font-weight:600; }
        .amc-day.amc-unavailable { background:#F3F4F6; color:#9CA3AF; cursor:not-allowed; }
        .amc-day.amc-today { outline:2px solid #E8760A; font-weight:700; }
        .amc-day.amc-selected { background:#E8760A !important; color:#fff !important; font-weight:700; }
        /* Solid, legible muted colors instead of opacity — same fix as the
           booking wizard's own calendar (.amc-day.amc-past, pages.js):
           opacity used to fade the day NUMBER along with the background,
           reading as barely legible instead of a clearly-muted color. */
        .amc-day.amc-past { color:#C1C7D0; cursor:not-allowed; }
        .amc-day.amc-far { color:#C1C7D0; cursor:not-allowed; background:#f9fafb; }
        .amc-day.amc-empty { cursor:default; }
        .amc-day.amc-holiday { background:#FFF1F2; color:#f43f5e; cursor:not-allowed; font-weight:600; }
        .amc-holiday-lbl { position:absolute; left:2px; right:2px; top:calc(50% + 8px); font-size:.7rem; line-height:1.15; text-align:center; overflow:hidden; display:-webkit-box; -webkit-line-clamp:2; -webkit-box-orient:vertical; font-weight:600; padding:0 1px; }
        .amc-day.amc-blocked { background:#FEE2E2; color:#B91C1C; cursor:not-allowed; font-weight:700; text-decoration:line-through; text-decoration-color:rgba(185,28,28,0.5); }
        /* Same responsive shrink as the booking wizard's calendar (pages.js)
           — without this, a holiday name (e.g. "Ninoy Aquino Day") wraps
           past 2 lines and spills out of the cell on narrow/phone widths,
           since this modal's grid has less room than the full wizard page. */
        @media (max-width:480px) {
          .amc-day.amc-holiday { font-size:.7rem; }
          .amc-holiday-lbl { font-size:.44rem; top:calc(50% + 4px); line-height:1.05; }
        }
      </style>
      <div style="background:#FFF7ED;border:1px solid #FED7AA;border-radius:8px;padding:12px;margin-bottom:14px;font-size:.84rem">
        <div style="font-weight:600;color:#1a1a1a">${a.type}</div>
        <div style="color:#6B7280;margin-top:2px">Currently: ${fmtD(a.date)} at ${a.time} · ${a.doctorName}</div>
      </div>
      <div class="form-group">
        <label class="form-label">Reason for Reschedule <span style="color:#DC2626">*</span></label>
        <textarea id="rs-reason" class="form-textarea" rows="3" placeholder="e.g. Schedule conflict, unable to attend, medical emergency…" style="resize:none"></textarea>
      </div>
      <div class="form-group">
        <label class="form-label">Preferred New Date <span style="color:#DC2626">*</span></label>
        <input type="hidden" id="rs-date" value="">
        <div style="display:flex;align-items:center;justify-content:space-between;margin-bottom:8px">
          <button type="button" class="btn-icon" id="rs-cal-prev" onclick="window.rsCalGoMonth(-1)">${icon('chevron-left','icon-sm')}</button>
          <span id="rs-cal-month-label" style="font-size:.85rem;font-weight:700;color:#1C1C1C"></span>
          <button type="button" class="btn-icon" onclick="window.rsCalGoMonth(1)">${icon('chevron-right','icon-sm')}</button>
        </div>
        <div class="appt-mini-cal">
          ${['SUN','MON','TUE','WED','THU','FRI','SAT'].map(d=>`<div class="amc-hdr">${d}</div>`).join('')}
        </div>
        <div class="appt-mini-cal" id="rs-cal-cells"></div>
        <div style="display:flex;gap:12px;margin-top:10px;flex-wrap:wrap">
          <span style="display:flex;align-items:center;gap:5px;font-size:.7rem;color:#6B7280"><span style="width:10px;height:10px;border-radius:3px;background:#ECFDF5;border:1px solid #6EE7B7;display:inline-block"></span>Available</span>
          <span style="display:flex;align-items:center;gap:5px;font-size:.7rem;color:#6B7280"><span style="width:10px;height:10px;border-radius:3px;background:#F3F4F6;display:inline-block"></span>Unavailable</span>
          <span style="display:flex;align-items:center;gap:5px;font-size:.7rem;color:#6B7280"><span style="width:10px;height:10px;border-radius:3px;background:#FEE2E2;border:1px solid #FCA5A5;display:inline-block"></span>Doctor Unavailable</span>
          <span style="display:flex;align-items:center;gap:5px;font-size:.7rem;color:#6B7280"><span style="width:10px;height:10px;border-radius:3px;background:#FFF1F2;border:1px solid #fda4af;display:inline-block"></span>PH Holiday</span>
        </div>
      </div>
      <div class="form-group" id="rs-time-group" style="display:none">
        <label class="form-label">Preferred Time <span style="color:#DC2626">*</span></label>
        <div id="rs-time-slots"></div>
        <div class="time-slot-legend">
          <div class="time-slot-legend-item"><span class="time-slot-legend-swatch" style="background:#fff;border:1.5px solid #e5e7eb"></span>Available</div>
          <div class="time-slot-legend-item"><span class="time-slot-legend-swatch" style="background:#E8760A"></span>Selected</div>
          <div class="time-slot-legend-item"><span class="time-slot-legend-swatch" style="background:#F3F4F6;border:1.5px solid #e5e7eb"></span>Unavailable</div>
        </div>
        <input type="hidden" id="rs-time" value="">
      </div>
    </div>
    <div class="modal-footer">
      <button class="btn-secondary" onclick="window.closeModal()">Cancel</button>
      <button class="btn-primary" id="rs-submit-btn" onclick="window.doRequestReschedule('${id}')">Submit Request</button>
    </div>`, 'modal-xl')

  rsCalRender()
}

async function doRequestReschedule(id) {
  const a = appointments.find(a => a.id === id)
  if (!a) return
  const reason = (document.getElementById('rs-reason')?.value || '').trim()
  if (!reason) { toast('Please enter a reason for rescheduling.', 'error'); return }
  const preferredDate = document.getElementById('rs-date')?.value || ''
  const preferredTime = document.getElementById('rs-time')?.value || ''
  if (!preferredDate) { toast('Please select a preferred date.', 'error'); return }
  if (!preferredTime) { toast('Please select a preferred time.', 'error'); return }

  const btn = document.getElementById('rs-submit-btn')
  if (_btnBusy(btn, 'primary', 'Submitting…')) return

  const ok = await _apptUpdate({ id, action: 'request_reschedule', reason, preferredDate, preferredTime })
  if (!ok) { _btnIdle(btn); return }
  a.rescheduleRequest = { reason, preferredDate, preferredTime, requestedAt: nowTimestamp().slice(0,16) }
  closeModal()
  toast('Reschedule request submitted. The clinic will review and contact you.')
  renderPage()
}

async function dismissRescheduleRequest(id) {
  const ok = await _apptUpdate({ id, action: 'dismiss_reschedule' })
  if (!ok) return
  const a = appointments.find(a => a.id === id)
  if (a) delete a.rescheduleRequest
  closeModal()
  toast('Reschedule request dismissed.')
  renderPage()
}

window.requestReschedule        = requestReschedule
window.rsOnDateChange           = rsOnDateChange
window.doRequestReschedule      = doRequestReschedule
window.dismissRescheduleRequest = dismissRescheduleRequest

// ════════════════════════════════════════════════════════════════
//  VIEW APPOINTMENT DETAILS
// ════════════════════════════════════════════════════════════════
function viewAppt(id) {
  const a = appointments.find(a => a.id === id)
  if (!a) return

  const fmtD = d => { const dt = new Date(d); return isNaN(dt) ? d : dt.toLocaleDateString('en-PH', { year:'numeric', month:'short', day:'numeric' }) }
  const steps = ['Submitted','Under Review','Approved','Completed']
  const stepIdx = { pending:1, approved:2, completed:3, cancelled:1, disapproved:1 }[a.status] ?? 1
  const stepColor = i => i <= stepIdx ? '#E8760A' : '#E5E7EB'
  const textColor = i => i <= stepIdx ? '#E8760A' : '#9CA3AF'

  const timelineHtml = steps.map((s,i) => `
    <div style="display:flex;flex-direction:column;align-items:center;flex:1;position:relative">
      <div style="width:28px;height:28px;border-radius:50%;display:flex;align-items:center;justify-content:center;
                  font-size:.7rem;font-weight:700;background:${stepColor(i)};color:${i<=stepIdx?'#fff':'#9CA3AF'};
                  border:2px solid ${stepColor(i)};z-index:1">${i+1}</div>
      <div style="font-size:.7rem;margin-top:5px;color:${textColor(i)};font-weight:${i===stepIdx?'700':'400'};text-align:center">${s}</div>
    </div>
    ${i < steps.length-1 ? `<div style="flex:1;height:2px;margin-top:14px;background:${i < stepIdx ? '#E8760A' : '#E5E7EB'};min-width:16px"></div>` : ''}`
  ).join('')

  const isAdmin   = state.role === 'admin' || state.role === 'staff'
  const isDoctor  = state.role === 'doctor'
  const isPatient = state.role === 'patient'
  const isActive  = a.status === 'pending' || a.status === 'approved'
  const patientCanCancel = !isPatient || !isActive || (window.apptCancellable ? window.apptCancellable(a) : true)
  const actionBtns = (isAdmin || isDoctor) ? `
    ${a.status === 'pending' && isAdmin ? `
      ${a.doctorId
        ? `<button class="btn-success" id="approve-confirm-btn" onclick="window.doApproveAppt('${a.id}')">Approve</button>`
        : `<button class="btn-success" disabled style="opacity:.45;cursor:not-allowed" title="Assign an optometrist before approving">Approve</button>`}
      <button class="btn-disapprove" onclick="window.confirmDisapproveAppt('${a.id}')">Disapprove</button>` : ''}
    ${a.status === 'approved' && isAdmin ? `
      <!-- No "Mark Completed" here on purpose — an appointment already
           completes itself the moment the doctor saves an exam against it
           (see api/examinations/create.php's UPDATE ... SET status =
           "completed" WHERE id = apptId, and startExamFromAppt(), used
           from the doctor's own "Start Consultation" button). Letting
           admin/staff flip this by hand risked marking a visit complete
           before any exam was actually recorded. -->
      <button class="btn-ghost"   onclick="window.confirmMarkNoShow('${a.id}')">Mark No-Show</button>
      <button class="btn-ghost"   onclick="window.rescheduleAppt('${a.id}')">Reschedule</button>
      <button class="btn-danger"  onclick="window.confirmCancelAppt('${a.id}')">Cancel</button>` : ''}` :
    isActive ? (patientCanCancel
      ? `<button class="btn-danger" onclick="window.confirmCancelAppt('${a.id}')">Cancel Appointment</button>`
      : `<button class="btn-danger" disabled style="opacity:.45;cursor:not-allowed" title="Cancellation window has passed">Cancel Appointment</button>`
    ) : ''

  const badgeMap = { pending:'badge-pending', approved:'badge-approved', cancelled:'badge-cancelled', disapproved:'badge-disapproved', completed:'badge-completed' }
  const badgeHtml = `<span class="badge ${badgeMap[a.status]||''}">${a.status.charAt(0).toUpperCase()+a.status.slice(1)}</span>`

  showModal(`
    <div class="modal-header">
      <div class="modal-title">Appointment Details</div>
      <button class="modal-close" onclick="window.closeModal()">&times;</button>
    </div>
    <div class="modal-body">
      <div style="display:flex;align-items:center;gap:8px;margin-bottom:14px">
        <code style="font-size:.75rem;background:#F3F4F6;padding:2px 8px;border-radius:4px;color:#6B7280">${a.id}</code>
        ${badgeHtml}
      </div>
      <div style="display:flex;align-items:center;gap:12px;padding:12px;background:#FFFBF5;border-radius:8px;border:1px solid #FFE4C0;margin-bottom:14px">
        ${icon('user','icon-sm')}
        <div>
          <div style="font-weight:700;font-size:.9rem">${a.patientName}</div>
          <div style="font-size:.75rem;color:#6B7280">${a.patientId}</div>
        </div>
      </div>
      <div style="display:grid;grid-template-columns:1fr 1fr;gap:10px;margin-bottom:14px">
        <div style="background:#F9FAFB;border-radius:6px;padding:10px">
          <div style="font-size:.68rem;color:#9CA3AF;margin-bottom:2px;text-transform:uppercase;letter-spacing:.04em">Doctor</div>
          <div style="font-size:.84rem;font-weight:600;display:flex;align-items:center;gap:6px;flex-wrap:wrap">
            ${a.doctorName || '<span style="font-style:italic;color:#9CA3AF;font-weight:400">Not yet assigned</span>'}
            ${!a.doctorId && isAdmin ? `<button class="btn-ghost" style="font-size:.68rem;padding:2px 8px" onclick="window.closeModal();window.openAssignDoctorModal('${a.id}')">Assign</button>` : ''}
          </div>
        </div>
        <div style="background:#F9FAFB;border-radius:6px;padding:10px">
          <div style="font-size:.68rem;color:#9CA3AF;margin-bottom:2px;text-transform:uppercase;letter-spacing:.04em">Type</div>
          <div style="font-size:.84rem;font-weight:600;display:flex;align-items:center;gap:6px;flex-wrap:wrap">
            ${a.type}
            <span title="${a.source === 'walk-in' ? 'Booked directly by clinic staff' : 'Booked by the patient online'}"
                  style="font-size:.62rem;font-weight:700;text-transform:uppercase;letter-spacing:.03em;padding:2px 7px;border-radius:20px;white-space:nowrap;${a.source === 'walk-in' ? 'background:#FFF7ED;color:#C2410C' : 'background:#EFF6FF;color:#1D4ED8'}">${a.source === 'walk-in' ? 'Walk-in' : 'Online'}</span>
          </div>
        </div>
        <div style="background:#F9FAFB;border-radius:6px;padding:10px">
          <div style="font-size:.68rem;color:#9CA3AF;margin-bottom:2px;text-transform:uppercase;letter-spacing:.04em">Date</div>
          <div style="font-size:.84rem;font-weight:600">${fmtD(a.date)}</div>
        </div>
        <div style="background:#F9FAFB;border-radius:6px;padding:10px">
          <div style="font-size:.68rem;color:#9CA3AF;margin-bottom:2px;text-transform:uppercase;letter-spacing:.04em">Time</div>
          <div style="font-size:.84rem;font-weight:600">${a.time}</div>
        </div>
      </div>
      ${isAdmin && a.status === 'pending' && !a.doctorId ? `<div style="display:flex;gap:10px;align-items:center;background:#FFF7ED;border-left:3px solid #E8760A;border-radius:8px;padding:12px;margin-bottom:14px;flex-wrap:wrap">
        <span style="flex-shrink:0;display:flex;color:#E8760A">${icon('alert-circle','icon-sm')}</span>
        <div style="font-size:.82rem;color:#92400E;line-height:1.5;flex:1;min-width:200px">
          Please assign a doctor to this appointment before approving it.
        </div>
        <button class="btn-primary" style="font-size:.78rem;padding:6px 14px;flex-shrink:0" onclick="window.closeModal();window.openAssignDoctorModal('${a.id}')">Assign Doctor</button>
      </div>` : ''}
      ${a.notes ? `<div style="background:#F9FAFB;border-radius:6px;padding:10px;margin-bottom:14px;min-width:0">
        <div style="font-size:.68rem;color:#9CA3AF;margin-bottom:4px;text-transform:uppercase;letter-spacing:.04em">Notes</div>
        <div style="font-size:.84rem;overflow-wrap:anywhere;word-break:break-word">${a.notes}</div>
      </div>` : ''}
      ${a.cancellationReason ? `<div style="background:#FEF2F2;border:1px solid #FECACA;border-radius:8px;padding:12px;margin-bottom:14px;min-width:0">
        <div style="font-size:.72rem;font-weight:700;color:#991B1B;text-transform:uppercase;letter-spacing:.05em;margin-bottom:6px">Cancellation Reason</div>
        <div style="font-size:.84rem;color:#374151;overflow-wrap:anywhere;word-break:break-word">${a.cancellationReason}</div>
      </div>` : ''}
      ${a.disapprovalReason ? `<div style="background:#FEF2F2;border:1px solid #FECACA;border-radius:8px;padding:12px;margin-bottom:14px;min-width:0">
        <div style="font-size:.72rem;font-weight:700;color:#991B1B;text-transform:uppercase;letter-spacing:.05em;margin-bottom:6px">Disapproval Reason</div>
        <div style="font-size:.84rem;color:#374151;overflow-wrap:anywhere;word-break:break-word">${a.disapprovalReason}</div>
      </div>` : ''}
      ${a.rescheduleNote ? `<div style="background:#F0FDF4;border:1px solid #BBF7D0;border-radius:8px;padding:12px;margin-bottom:14px;min-width:0">
        <div style="font-size:.72rem;font-weight:700;color:#166534;text-transform:uppercase;letter-spacing:.05em;margin-bottom:6px">Reschedule Note</div>
        <div style="font-size:.84rem;color:#374151;overflow-wrap:anywhere;word-break:break-word">${a.rescheduleNote}</div>
      </div>` : ''}
      ${isPatient && isActive && !patientCanCancel ? `<div style="display:flex;gap:8px;align-items:flex-start;background:#FFFBEB;border:1px solid #FDE68A;border-radius:8px;padding:12px;margin-bottom:14px">
        <span style="flex-shrink:0;display:flex;margin-top:2px">${icon('alert-circle','icon-sm')}</span>
        <div style="font-size:.82rem;color:#92400E;line-height:1.5">
          <strong>This appointment can no longer be cancelled online.</strong><br>
          Cancellations must be made at least ${CANCEL_DEADLINE_HOURS} hours in advance. Please call the clinic directly if you need to cancel.
        </div>
      </div>` : ''}
      ${isPatient && a.status === 'approved' && a.reminderSentAt && !a.confirmedAt ? `<div style="display:flex;gap:10px;align-items:flex-start;background:#FFF7ED;border:1px solid #FDBA74;border-radius:8px;padding:12px;margin-bottom:14px;flex-wrap:wrap">
        <span style="flex-shrink:0;display:flex;color:#E8760A;margin-top:2px">${icon('alert-circle','icon-sm')}</span>
        <div style="font-size:.82rem;color:#92400E;line-height:1.5;flex:1;min-width:200px">
          <strong>Please confirm you'll be attending this appointment.</strong><br>
          If we don't hear from you by ${consultationSettings.confirmDeadlineTime || '9:00 PM'} today, it will be automatically cancelled.
        </div>
        <button class="btn-primary" style="font-size:.78rem;padding:6px 14px;flex-shrink:0;align-self:center" onclick="window.confirmMyAppointment('${a.id}')">Confirm Appointment</button>
      </div>` : ''}
      ${a.rescheduleRequest ? `<div style="background:#FFF7ED;border:1px solid #FED7AA;border-radius:8px;padding:12px;margin-bottom:14px">
        <div style="display:flex;align-items:center;gap:6px;font-size:.75rem;font-weight:700;color:#C2410C;text-transform:uppercase;letter-spacing:.05em;margin-bottom:8px">
          ${icon('refresh-cw','icon-sm')} Reschedule Request
        </div>
        <div style="font-size:.84rem;color:#374151;margin-bottom:6px">${a.rescheduleRequest.reason}</div>
        ${a.rescheduleRequest.preferredDate ? `<div style="font-size:.76rem;color:#6B7280">Preferred date: <strong>${(() => { const dt = new Date(a.rescheduleRequest.preferredDate); return isNaN(dt) ? a.rescheduleRequest.preferredDate : dt.toLocaleDateString('en-PH',{year:'numeric',month:'short',day:'numeric'}) })()}</strong></div>` : ''}
        <div style="font-size:.72rem;color:#9CA3AF;margin-top:4px">Submitted: ${fmtTimestamp12h(a.rescheduleRequest.requestedAt)}</div>
        ${(isAdmin || isDoctor) ? `<div style="margin-top:10px;display:flex;gap:6px">
          <button class="btn-primary" style="font-size:.78rem;padding:5px 12px" onclick="window.rescheduleAppt('${a.id}')">Accept &amp; Reschedule</button>
          <button class="btn-secondary" style="font-size:.78rem;padding:5px 12px" onclick="window.dismissRescheduleRequest('${a.id}')">Dismiss</button>
        </div>` : ''}
      </div>` : ''}
      <div>
        <div style="font-size:.68rem;color:#9CA3AF;margin-bottom:10px;text-transform:uppercase;letter-spacing:.04em">Progress</div>
        <div style="display:flex;align-items:flex-start">${timelineHtml}</div>
      </div>
    </div>
    <div class="modal-footer">
      <button class="btn-secondary" onclick="window.closeModal()">Close</button>
      ${actionBtns}
    </div>`, 'modal-lg')
}
window.viewAppt = viewAppt

// Mark individual notification as read (notifications page + topbar badge)
function markNotifRead(id) {
  const notif = (window._notifications || []).find(n => n.id === id)
  if (notif && !notif.isRead) {
    notif.isRead = true
    if (window._unreadCount > 0) window._unreadCount--
    if (window._updateNotifUI) window._updateNotifUI()
    fetch('api/notifications/mark_read.php', {
      method: 'POST', headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({ id: id })
    }).catch(() => {})
  }
  // The day-before "please confirm" reminder gets its own dedicated prompt
  // instead of just landing on a filtered list — that's the whole point of
  // this shortcut (see confirmApptPrompt()'s own comment for why).
  if (notif && notif.type === 'reminder' && notif.relatedId && state.role === 'patient') {
    confirmApptPrompt(notif.relatedId)
    return
  }
  // Same shortcut for a reschedule request (admin/staff/doctor) — straight
  // to that appointment's details instead of a filtered list to scan.
  if (notif && notif.type === 'reschedule_request' && notif.relatedId && state.role !== 'patient') {
    openRescheduleRequestNotif(notif.relatedId)
    return
  }
  // Same again for a brand-new appointment request (admin/staff).
  if (notif && notif.type === 'new_appointment' && notif.relatedId && state.role !== 'patient') {
    openNewApptRequestNotif(notif.relatedId)
    return
  }
  // "Account Deletion Requested" (relatedId is the patientId) — straight to
  // that patient's own profile, where the pending-request banner and its
  // Archive/Dismiss actions already sit at the top, instead of landing on
  // the Patient Records list and making admin/staff search for them.
  if (notif && notif.type === 'deletion_request' && notif.relatedId && state.role !== 'patient') {
    navigate('patient-view', { patientId: notif.relatedId })
    return
  }
  // A doctor flagged a visit as needing a follow-up (relatedId is the
  // patientId — notifications.related_id is too small a column to carry
  // the doctor/date too) — go straight into a pre-filled New Appointment
  // for that patient instead of a profile page staff has to work from
  // manually. The recommended doctor + date are looked up fresh from the
  // patient's own consultation history (newest first, per the unshift()
  // in saveNewExam()) rather than the notification itself.
  if (notif && notif.type === 'follow_up_needed' && notif.relatedId && state.role !== 'patient') {
    const p = patients.find(pt => pt.id === notif.relatedId)
    const con = p && (p.consultations || []).find(c => c.followUpDate)
    if (p && con) {
      const doc = doctors.find(d => d.name === con.doctor)
      window._staffCalPrefill = {
        doctorId: doc?.id || '', doctorName: doc?.name || con.doctor || '',
        doctorSpec: doc?.specialization || '', date: con.followUpDate, time: con.followUpTime || '', isFollowUp: true
      }
      navigate('create-appointment', { patientId: p.id, patientName: p.name })
    } else {
      // Fallback if the flagged consultation can't be found anymore
      // (e.g. it was later edited/removed) — land on the profile instead
      // of a broken pre-fill.
      navigate('patient-view', { patientId: notif.relatedId })
    }
    return
  }
  if (notif && window._notifNavTarget) {
    const { page: _np, params: _npar } = window._notifNavTarget(notif.type, state.role)
    navigate(_np, _npar)
  }
}
window.markNotifRead = markNotifRead

// Mark all notifications as read (from notifications page button)
async function markAllNotifsRead() {
  ;(window._notifications || []).forEach(n => { n.isRead = true })
  window._unreadCount = 0
  if (window._updateNotifUI) window._updateNotifUI()
  window.renderPage()
  try {
    await fetch('api/notifications/mark_read.php', {
      method: 'POST', headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({ all: true })
    })
    toast('All notifications marked as read.', 'success')
  } catch (_) {}
}
window.markAllNotifsRead = markAllNotifsRead

// Delete a single notification
function deleteNotif(id) {
  const idx = (window._notifications || []).findIndex(n => n.id === id)
  if (idx !== -1) {
    const wasUnread = !window._notifications[idx].isRead
    window._notifications.splice(idx, 1)
    if (wasUnread && window._unreadCount > 0) window._unreadCount--
  }
  const el = document.getElementById(`notif-${id}`)
  if (el) el.remove()
  if (window._updateNotifUI) window._updateNotifUI()
  // Re-render to show empty state and hide stale "Clear All" button
  if ((window._notifications || []).length === 0) window.renderPage()
  toast('Notification deleted.', 'error')
  fetch('api/notifications/delete.php', {
    method: 'POST', headers: { 'Content-Type': 'application/json' },
    body: JSON.stringify({ id })
  }).catch(() => {})
}
window.deleteNotif = deleteNotif

// Delete all notifications
async function deleteAllNotifs() {
  window._notifications = []
  window._unreadCount   = 0
  if (window._updateNotifUI) window._updateNotifUI()
  window.renderPage()
  try {
    await fetch('api/notifications/delete.php', {
      method: 'POST', headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({ all: true })
    })
    toast('All notifications cleared.', 'error')
  } catch (_) {}
}
window.deleteAllNotifs = deleteAllNotifs

// Toggle password field visibility (FB-style eye button: slashed = hidden
// (default), open eye = currently visible after a click).
function togglePwVisibility(inputId, btn) {
  const input = document.getElementById(inputId)
  if (!input) return
  const isHidden = input.type === 'password'
  input.type = isHidden ? 'text' : 'password'
  btn.style.color = isHidden ? '#E8760A' : '#9CA3AF'
  btn.innerHTML = icon(isHidden ? 'eye' : 'eye-off', 'icon-sm')
}
window.togglePwVisibility = togglePwVisibility

// Exam wizard, Prescription step — Eyeglass vs Contact Lens toggle. Frames
// don't apply to a contact lens fitting, and "lens type"/"lens material"
// mean different things for each (Single Vision/Progressive + CR-39/
// Polycarbonate for eyeglasses; Hard/Soft/Hybrid/Multifocal/Scleral +
// Silicone Hydrogel/Hydrogel/RGP for contacts) — swap both select's
// option sets and show/hide Frame Selection instead of cramming every
// option from both categories into one dropdown.
const EYEGLASS_LENS_TYPES = ['Single Vision', 'Bifocal', 'Progressive'] // Photochromic is a coating (see Lens Coatings), not a lens type
const CONTACT_LENS_TYPES  = ['Hard Lenses', 'Soft Lenses', 'Hybrid Lenses', 'Multifocal Lenses', 'Scleral Lenses']
const EYEGLASS_LENS_MATERIALS = ['CR-39', 'Polycarbonate', 'High Index', 'Trivex']
const CONTACT_LENS_MATERIALS  = ['Silicone Hydrogel', 'Hydrogel', 'Rigid Gas Permeable (RGP)']

function syncCorrectionType() {
  _syncRadioPills('ne-correction')
  const isContact = document.getElementById('r-corr-cl')?.checked

  // Frame Selection and PD are both eyeglass-frame concerns — a contact
  // lens sits directly on the eye, so there's no frame to center a lens
  // in and PD is meaningless. ADD stays visible either way: it applies to
  // multifocal contacts just as much as bifocal/progressive eyeglasses.
  const frameGroup = document.getElementById('ne-frame-group')
  const pdGroup     = document.getElementById('ne-pd-group')
  if (frameGroup) frameGroup.style.display = isContact ? 'none' : ''
  if (pdGroup)     pdGroup.style.display   = isContact ? 'none' : ''
  // Clear rather than just hide — otherwise a value typed in before
  // switching to Contact Lens would still silently ride along in the
  // saved payload despite the field being invisible.
  const frameInput = document.getElementById('ne-frame')
  const pdInput     = document.getElementById('ne-pd')
  if (isContact && frameInput) frameInput.value = ''
  if (isContact && pdInput)    pdInput.value    = ''
  // Collapse the now-empty grid track instead of leaving a blank gap
  // where the hidden field used to sit.
  const addPdRow    = document.getElementById('ne-add-pd-row')
  const frameLensRow = document.getElementById('ne-frame-lens-row')
  if (addPdRow)     addPdRow.style.gridTemplateColumns    = isContact ? '1fr 1fr' : '1fr 1fr 1fr'
  if (frameLensRow) frameLensRow.style.gridTemplateColumns = isContact ? '1fr' : '1fr 1fr'

  window.setSelectFieldOptions('ne-lens-type', isContact ? CONTACT_LENS_TYPES : EYEGLASS_LENS_TYPES, 'Select lens type')
  window.setSelectFieldOptions('ne-lens-material', isContact ? CONTACT_LENS_MATERIALS : EYEGLASS_LENS_MATERIALS, 'Select lens material')

  // Anti-Reflective/Blue Light Filter/Scratch Resistant are lens-surface
  // treatments that don't apply to a contact lens (see the Lens Coatings
  // comment, pages.js) — Photochromic is the one real exception and stays
  // either way.
  ;['ar', 'bl', 'sr'].forEach(key => {
    const group = document.getElementById('ne-coat-group-' + key)
    const input = document.getElementById('ne-coat-' + key)
    if (group) group.style.display = isContact ? 'none' : 'flex'
    if (isContact && input) input.checked = false
  })
}
window.syncCorrectionType = syncCorrectionType

// Exam wizard — "Issue Prescription: Yes/No" toggle. Everything on the
// Prescription step below it, and the whole Dispensing step, only makes
// sense once a prescription is actually being issued — there's nothing to
// pick a lens type for, or dispense, otherwise. Covers both blocks
// (id="ne-rx-fields"/"ne-dispensing-fields") with an explanatory overlay
// (id="ne-rx-overlay"/"ne-dispensing-overlay", already in the DOM, just
// hidden) instead of leaving fields that don't apply sitting there
// editable with no explanation.
function syncIssuePrescription() {
  _syncRadioPills('ne-issue-choice')
  const issuing = document.getElementById('r-issue-yes')?.checked
  ;[['ne-rx-fields', 'ne-rx-overlay'], ['ne-dispensing-fields', 'ne-dispensing-overlay']].forEach(([fieldsId, overlayId]) => {
    const fields  = document.getElementById(fieldsId)
    const overlay = document.getElementById(overlayId)
    if (overlay) overlay.style.display = issuing ? 'none' : 'flex'
    if (!fields) return
    // The overlay already blocks mouse/touch clicks by sitting on top of
    // the fields (it has no inputs of its own to accidentally catch here);
    // disabling the actual controls additionally covers keyboard
    // Tab-focus, which an overlay alone doesn't stop.
    fields.querySelectorAll('input, textarea, button').forEach(f => { f.disabled = !issuing })
  })
}
window.syncIssuePrescription = syncIssuePrescription

// Exam wizard — "Need Follow-up Consultation: Yes/No" toggle (Consultation
// step). The date field only makes sense once the doctor's actually said
// a follow-up is needed, so it stays hidden/blank otherwise instead of an
// always-visible optional date with no clear meaning attached to leaving
// it blank vs. filled in.
function syncFollowUpNeeded() {
  _syncRadioPills('ne-followup-choice')
  const needed = document.getElementById('r-followup-yes')?.checked
  const wrap = document.getElementById('ne-followup-date-wrap')
  if (wrap) wrap.style.display = needed ? '' : 'none'
  const hintWrap = document.getElementById('ne-followup-hint-wrap')
  if (hintWrap) hintWrap.style.display = needed ? '' : 'none'
  const dateInput = document.getElementById('ne-con-followup')
  const timeInput = document.getElementById('ne-con-followup-time')
  if (!needed && dateInput) dateInput.value = ''
  if (!needed && timeInput) timeInput.value = ''
  if (!needed) {
    const label = document.getElementById('ne-followup-picker-label')
    if (label) { label.textContent = 'Select date & time'; label.style.color = '#9CA3AF' }
  }
}
window.syncFollowUpNeeded = syncFollowUpNeeded

// Custom radio pill helper — called via onchange on the hidden input
// Updates all label pills for the given radio group
function _syncRadioPills(radioName) {
  document.querySelectorAll(`input[name="${radioName}"]`).forEach(radio => {
    const lbl = document.querySelector(`label[for="${radio.id}"]`)
    if (!lbl) return
    const on = radio.checked
    lbl.style.background  = on ? '#FFF7ED' : '#f9fafb'
    lbl.style.borderColor = on ? '#E8891C' : '#e5e7eb'
    lbl.style.color       = on ? '#C4720E' : '#6b7280'
    lbl.style.boxShadow   = on ? '0 0 0 3px rgba(232,137,28,.15)' : ''
    const ring = lbl.querySelector('span:first-child')
    if (ring) ring.style.borderColor = on ? '#E8891C' : '#d1d5db'
    const dot = ring ? ring.querySelector('span') : null
    if (dot) {
      dot.style.background = on ? '#E8760A' : 'transparent'
      dot.style.transform  = on ? 'scale(1)' : 'scale(0)'
    }
  })
}
window._syncRadioPills = _syncRadioPills

// Validate + save new password via backend
async function validateSettingsPassword(newId, confId, errId, curId) {
  const curPwId = curId || 'sett-curpw'
  const curPw   = document.getElementById(curPwId)?.value || ''
  const newPw   = document.getElementById(newId)?.value   || ''
  const confPw  = document.getElementById(confId)?.value  || ''
  const errEl   = document.getElementById(errId)
  if (newPw !== confPw) { if (errEl) errEl.classList.add('show'); return }
  if (errEl) errEl.classList.remove('show')
  // Required fields + password policy are enforced live and the Update
  // button is disabled until met — this is just a safety net.
  if (!curPw || !newPw || !window.pwPolicyValid(newPw)) return

  try {
    const r = await fetch('api/users/change_password.php', {
      method:  'POST',
      headers: { 'Content-Type': 'application/json' },
      body:    JSON.stringify({ currentPassword: curPw, newPassword: newPw })
    })
    const d = await r.json()
    if (d.success) {
      toast('Password updated successfully.', 'success')
      ;[curPwId, newId, confId].forEach(id => { const el = document.getElementById(id); if (el) el.value = '' })
    } else {
      toast(d.message || 'Failed to update password.', 'error')
    }
  } catch (_) {
    toast('Network error — please try again.', 'error')
  }
}
window.validateSettingsPassword = validateSettingsPassword

// Save profile for admin / staff / doctor (role-aware)
async function saveUserProfile() {
  const role   = state.role
  const prefix = role === 'doctor' ? 'doc' : role === 'staff' ? 'st' : 'ad'
  const fn     = document.getElementById(`${prefix}-fname`)?.value.trim() || ''
  const mn     = document.getElementById(`${prefix}-mname`)?.value.trim() || ''
  const ln     = document.getElementById(`${prefix}-lname`)?.value.trim() || ''
  const email  = document.getElementById(`${prefix}-email`)?.value.trim() || ''
  const phone  = document.getElementById(`${prefix}-phone`)?.value.trim() || ''
  if (!fn || !ln) { toast('First and last name are required.', 'error'); return }
  if (phone && !window.isValidContact(phone)) { toast('Please enter a valid 11-digit contact number.', 'error'); return }

  try {
    const r = await fetch('api/users/update_profile.php', {
      method:  'POST',
      headers: { 'Content-Type': 'application/json' },
      body:    JSON.stringify({ firstName: fn, middleName: mn, lastName: ln, phone, email })
    })
    const d = await r.json()
    if (d.success) {
      toast('Profile updated successfully.', 'success')

      const fullName = fmtFullName(fn, mn, ln, role === 'doctor' ? 'Dr. ' : '')

      // Update state.user
      if (state.user) {
        state.user.firstName  = fn
        state.user.middleName = mn
        state.user.lastName   = ln
        state.user.name       = fullName
        if (email) state.user.email = email
        state.user.contact   = phone
      }

      // Sync the in-memory mock arrays so navigating away and back shows new values
      if (role === 'doctor') {
        const entry = doctors.find(d => d.id === state.user?.id)
        if (entry) { entry.firstName = fn; entry.middleName = mn; entry.lastName = ln; entry.name = fullName; entry.contact = phone; if (email) entry.email = email }
      } else if (role === 'staff') {
        const entry = staff.find(s => s.id === state.user?.id)
        if (entry) { entry.firstName = fn; entry.middleName = mn; entry.lastName = ln; entry.name = fullName; entry.contact = phone; if (email) entry.email = email }
      } else if (role === 'admin') {
        const entry = admins.find(a => a.id === state.user?.id)
        if (entry) { entry.firstName = fn; entry.middleName = mn; entry.lastName = ln; entry.name = fullName; entry.contact = phone; if (email) entry.email = email }
      }

      // Re-render the current page so the profile banner reflects new values,
      // and re-render the sidebar so the name updates there too
      window.navigate(state.page, { ...state.params })
    } else {
      toast(d.message || 'Failed to update profile.', 'error')
    }
  } catch (_) {
    toast('Network error — please try again.', 'error')
  }
}
window.saveUserProfile = saveUserProfile

// Save patient profile fields via backend
// Live age preview as the patient edits their own DOB on Settings — the
// actual saved age is still computed server-side (api/patients/update.php),
// this is purely a "here's what that'll come out to" display.
function _syncSettAge() {
  const dobEl = document.getElementById('sett-dob')
  const ageEl = document.getElementById('sett-age-display')
  if (!dobEl || !ageEl) return
  const age = ageFromDob(dobEl.value)
  ageEl.value = age != null ? `${age} years old` : '—'
}
window._syncSettAge = _syncSettAge

async function savePatientSettings() {
  const fn      = document.getElementById('sett-first')?.value.trim()   || ''
  const mn      = document.getElementById('sett-middle')?.value.trim() || ''
  const ln      = document.getElementById('sett-last')?.value.trim()    || ''
  const contact = document.getElementById('sett-contact')?.value.trim() || ''
  const address    = document.getElementById('sett-address')?.value.trim() || ''
  const occupation = document.getElementById('sett-occupation')?.value.trim() || ''
  const medicalHistory = document.getElementById('sett-medical-history')?.value.trim() || ''
  const dob     = document.getElementById('sett-dob')?.value    || ''
  const gender  = document.getElementById('sett-gender')?.value || ''
  if (!fn || !ln) { toast('First and last name are required.', 'error'); return }
  if (contact && !window.isValidContact(contact)) { toast('Please enter a valid 11-digit contact number.', 'error'); return }
  if (address && !window.looksLikeAddress(address)) { toast('Please enter a complete address.', 'error'); return }

  try {
    const r = await fetch('api/patients/update.php', {
      method:  'POST',
      headers: { 'Content-Type': 'application/json' },
      body:    JSON.stringify({ action: 'profile', firstName: fn, middleName: mn, lastName: ln, phone: contact, address, occupation, medicalHistory, dob, gender })
    })
    const d = await r.json()
    if (d.success) {
      toast('Profile updated successfully.', 'success')
      const fullName = fmtFullName(fn, mn, ln)
      if (state.user) {
        state.user.firstName  = fn
        state.user.middleName = mn
        state.user.lastName   = ln
        state.user.name       = fullName
        if (contact) state.user.contact = contact
        if (address) state.user.address = address
      }
      // Keep the in-memory patients array in sync too — pagePatientSettings
      // reads from it first and falls back to state.user, so a stale entry
      // here would silently override the just-saved values on re-render.
      const p = patients.find(pt => pt.id === state.user?.id)
      if (p) {
        p.firstName  = fn
        p.middleName = mn
        p.lastName   = ln
        p.name       = fullName
        p.contact    = contact
        p.address    = address
        p.occupation = occupation
        p.medicalHistory = medicalHistory
        if (gender) p.gender = gender
        if (dob) { p.dob = dob; p.age = ageFromDob(dob) }
      }
      window.navigate(state.page, { ...state.params })
    } else {
      toast(d.message || 'Failed to update profile.', 'error')
    }
  } catch (_) {
    toast('Network error — please try again.', 'error')
  }
}
window.savePatientSettings = savePatientSettings

// ════════════════════════════════════════════════════════════════
//  PATIENT SETTINGS — Change Email (OTP-verified, 2-step modal)
//  Step 1: api/patients/request-email-change.php sends a 6-digit code to
//          the NEW address. Step 2: api/patients/verify-email-change.php
//          checks it and only then flips users.email server-side.
//  Deliberately separate from savePatientSettings() — email is the one
//  field on this page that can lock a patient out of login/notifications
//  if fat-fingered, so it gets its own proof-of-ownership step instead of
//  saving on the same click as name/address/etc.
// ════════════════════════════════════════════════════════════════
function openChangeEmailModal() {
  showModal(`
    <div class="modal-header">
      <div class="modal-title">Change Email Address</div>
      <button class="modal-close" onclick="window.closeModal()">&times;</button>
    </div>
    <div class="modal-body">
      <p style="font-size:.85rem;color:#6B7280;line-height:1.6;margin:0">
        For your security, we'll send a 6-digit verification code to your new email address before it's saved. Your current email stays active until then.
      </p>
      <div class="form-group">
        <label class="form-label">New Email Address</label>
        <input type="email" class="form-input" id="chg-email-new" placeholder="you@example.com" autocomplete="email"
               onkeydown="if(event.key==='Enter'){event.preventDefault();window._sendEmailChangeOtp()}">
        <div class="field-error" id="chg-email-err"></div>
      </div>
    </div>
    <div class="modal-footer">
      <button class="btn-secondary" onclick="window.closeModal()">Cancel</button>
      <button class="btn-primary" id="chg-email-send-btn" onclick="window._sendEmailChangeOtp()">
        ${icon('mail', 'icon-sm')} Send Code
      </button>
    </div>`)
  setTimeout(() => document.getElementById('chg-email-new')?.focus(), 50)
}
window.openChangeEmailModal = openChangeEmailModal

async function _sendEmailChangeOtp() {
  const input  = document.getElementById('chg-email-new')
  const errEl  = document.getElementById('chg-email-err')
  const btn    = document.getElementById('chg-email-send-btn')
  if (!input || window._chgEmailBusy) return
  const newEmail = input.value.trim()
  errEl.classList.remove('show')
  if (!newEmail || !/^[^\s@]+@[^\s@]+\.[^\s@]+$/.test(newEmail)) {
    errEl.textContent = 'Please enter a valid email address.'
    errEl.classList.add('show')
    input.focus()
    return
  }

  window._chgEmailBusy = true
  btn.disabled = true
  const originalLabel = btn.innerHTML
  btn.innerHTML = 'Sending…'
  try {
    const r = await fetch('api/patients/request-email-change.php', {
      method: 'POST', headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({ newEmail })
    })
    const d = await r.json()
    if (!document.getElementById('chg-email-send-btn')) return // modal closed mid-request
    if (!d.success) {
      // A code was already sent from a still-cooling-down earlier request
      // (e.g. the modal was closed and reopened) — the earlier code is
      // still valid, so go straight to entering it instead of dead-ending
      // on a red "please wait" error. Same handling as _resendEmailChangeOtp.
      if (d.cooldown && d.retryAfter) {
        _renderEmailChangeOtpStep(newEmail, d.retryAfter)
        return
      }
      errEl.textContent = d.message || 'Failed to send code. Please try again.'
      errEl.classList.add('show')
      btn.disabled = false
      btn.innerHTML = originalLabel
      return
    }
    _renderEmailChangeOtpStep(newEmail, d.cooldownSeconds || 60)
  } catch (_) {
    if (!document.getElementById('chg-email-send-btn')) return
    errEl.textContent = 'Network error. Please check your connection.'
    errEl.classList.add('show')
    btn.disabled = false
    btn.innerHTML = originalLabel
  } finally {
    window._chgEmailBusy = false
  }
}
window._sendEmailChangeOtp = _sendEmailChangeOtp

function _renderEmailChangeOtpStep(newEmail, cooldownSeconds) {
  showModal(`
    <div class="modal-header">
      <div class="modal-title">Verify Your New Email</div>
      <button class="modal-close" onclick="window.closeModal()">&times;</button>
    </div>
    <div class="modal-body">
      <div>
        <p style="font-size:.85rem;color:#6B7280;line-height:1.6;margin:0 0 2px">We sent a 6-digit code to</p>
        <p style="font-size:.92rem;font-weight:700;color:#1C1C1C;margin:0;word-break:break-word">${newEmail}</p>
      </div>
      <div class="otp-row" id="chg-email-otp-row" style="margin:0">
        ${[0,1,2,3,4,5].map(i => `<input type="text" inputmode="numeric" maxlength="1" class="otp-input" id="chg-email-otp-${i}">`).join('')}
      </div>
      <div class="field-error" id="chg-email-otp-err" style="justify-content:center;text-align:center"></div>
      <div style="text-align:center;font-size:.8rem;color:#9CA3AF">
        Didn't get it?
        <button type="button" id="chg-email-resend-btn" onclick="window._resendEmailChangeOtp('${newEmail.replace(/'/g,"\\'")}')"
                style="color:#E8760A;font-weight:700;background:none;border:none;padding:0;font-size:.8rem" disabled>Resend Code</button>
      </div>
    </div>
    <div class="modal-footer">
      <button class="btn-secondary" onclick="window.closeModal()">Cancel</button>
      <button class="btn-primary" id="chg-email-verify-btn" onclick="window._verifyEmailChangeOtp()">
        ${icon('check', 'icon-sm')} Verify &amp; Save
      </button>
    </div>`)
  _setupEmailChangeOtpInputs()
  _startEmailChangeResendCooldown(cooldownSeconds)
  setTimeout(() => document.getElementById('chg-email-otp-0')?.focus(), 50)
}

function _setupEmailChangeOtpInputs() {
  const inputs = document.querySelectorAll('#chg-email-otp-row .otp-input')
  inputs.forEach((el, idx) => {
    el.addEventListener('input', e => {
      const val = e.target.value.replace(/\D/g, '')
      e.target.value = val ? val[0] : ''
      if (val && idx < 5) inputs[idx + 1].focus()
    })
    el.addEventListener('keydown', e => {
      if (e.key === 'Backspace' && !e.target.value && idx > 0) inputs[idx - 1].focus()
      if (e.key === 'Enter') { e.preventDefault(); window._verifyEmailChangeOtp() }
    })
    el.addEventListener('paste', e => {
      e.preventDefault()
      const pasted = (e.clipboardData || window.clipboardData).getData('text').replace(/\D/g, '')
      ;[...pasted].slice(0, 6).forEach((ch, i) => { if (inputs[idx + i]) inputs[idx + i].value = ch })
      inputs[Math.min(idx + pasted.length, 5)].focus()
    })
  })
}

// Ticking countdown for the "Resend Code" button — mirrors the
// forgot-password flow's cooldown UX (fpRunResendCooldownTicker,
// auth.js): the countdown lives IN the button's own label ("Resend in
// 0:38"), not a separate span next to it, and the button visibly dims
// while disabled. A static "Resend" label sitting beside a small
// "(38s)" hint reads as still-clickable at a glance — the forgot-
// password pattern makes the wait state unambiguous instead of
// something that looks broken when clicking it silently does nothing.
// Server-side is still the real enforcement (request-email-change.php
// rejects an early resend regardless of what the client's timer says).
function _startEmailChangeResendCooldown(seconds) {
  clearInterval(window._chgEmailCooldownInterval)
  const btn = document.getElementById('chg-email-resend-btn')
  if (!btn) return
  let remaining = seconds
  const setDisabled = (is) => {
    btn.disabled      = is
    btn.style.opacity = is ? '.55' : '1'
    btn.style.cursor  = is ? 'not-allowed' : 'pointer'
  }
  setDisabled(true)
  const tick = () => {
    if (remaining <= 0) {
      clearInterval(window._chgEmailCooldownInterval)
      setDisabled(false)
      btn.textContent = 'Resend Code'
      return
    }
    const m = Math.floor(remaining / 60), s = remaining % 60
    btn.textContent = `Resend in ${m}:${String(s).padStart(2, '0')}`
    remaining--
  }
  tick()
  window._chgEmailCooldownInterval = setInterval(tick, 1000)
}

async function _resendEmailChangeOtp(newEmail) {
  const btn = document.getElementById('chg-email-resend-btn')
  if (!btn || btn.disabled || window._chgEmailBusy) return
  window._chgEmailBusy = true
  try {
    const r = await fetch('api/patients/request-email-change.php', {
      method: 'POST', headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({ newEmail })
    })
    const d = await r.json()
    if (!document.getElementById('chg-email-resend-btn')) return // modal closed mid-request
    const errEl = document.getElementById('chg-email-otp-err')
    if (!d.success) {
      if (d.cooldown && d.retryAfter) { _startEmailChangeResendCooldown(d.retryAfter); return }
      errEl.textContent = d.message || 'Failed to resend code. Please try again.'
      errEl.classList.add('show')
      return
    }
    errEl.classList.remove('show')
    document.querySelectorAll('#chg-email-otp-row .otp-input').forEach(i => i.value = '')
    document.getElementById('chg-email-otp-0')?.focus()
    _startEmailChangeResendCooldown(d.cooldownSeconds || 60)
    toast('A new code was sent.', 'success')
  } catch (_) {
    if (!document.getElementById('chg-email-resend-btn')) return
  } finally {
    window._chgEmailBusy = false
  }
}
window._resendEmailChangeOtp = _resendEmailChangeOtp

async function _verifyEmailChangeOtp() {
  const inputs = document.querySelectorAll('#chg-email-otp-row .otp-input')
  const errEl  = document.getElementById('chg-email-otp-err')
  const btn    = document.getElementById('chg-email-verify-btn')
  if (!inputs.length || window._chgEmailBusy) return
  const code = [...inputs].map(i => i.value).join('')
  errEl.classList.remove('show')
  if (code.length < 6) {
    inputs.forEach(i => { if (!i.value) i.classList.add('error') })
    errEl.textContent = 'Please enter the full 6-digit code.'
    errEl.classList.add('show')
    return
  }
  inputs.forEach(i => i.classList.remove('error'))

  window._chgEmailBusy = true
  btn.disabled = true
  const originalLabel = btn.innerHTML
  btn.innerHTML = 'Verifying…'
  try {
    const r = await fetch('api/patients/verify-email-change.php', {
      method: 'POST', headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({ otp: code })
    })
    const d = await r.json()
    if (!document.getElementById('chg-email-verify-btn')) return // modal closed mid-request
    if (!d.success) {
      inputs.forEach(i => i.classList.add('error'))
      errEl.textContent = d.message || 'Incorrect code. Please try again.'
      errEl.classList.add('show')
      btn.disabled = false
      btn.innerHTML = originalLabel
      return
    }
    // Sync the new email everywhere it's cached client-side.
    if (state.user) state.user.email = d.email
    const p = patients.find(pt => pt.id === state.user?.id)
    if (p) p.email = d.email
    clearInterval(window._chgEmailCooldownInterval)
    closeModal()
    toast('Email address updated successfully.', 'success')
    window.navigate(state.page, { ...state.params })
  } catch (_) {
    if (!document.getElementById('chg-email-verify-btn')) return
    errEl.textContent = 'Network error. Please try again.'
    errEl.classList.add('show')
    btn.disabled = false
    btn.innerHTML = originalLabel
  } finally {
    window._chgEmailBusy = false
  }
}
window._verifyEmailChangeOtp = _verifyEmailChangeOtp

// Combined search filter for the appointments list table
function filterApptTable(input) {
  const q = input.value.toLowerCase().trim()
  document.querySelectorAll('#appt-tbody tr').forEach(row => {
    const matchesSearch = !q || (row.dataset.search || '').includes(q)
    row.style.display = matchesSearch ? '' : 'none'
  })
  if (window.pgReset) window.pgReset('appt-tbody')
}
window.filterApptTable = filterApptTable

// ════════════════════════════════════════════════════════════════
//  CONFIRM CANCEL + MARK COMPLETED
// ════════════════════════════════════════════════════════════════
// Shown when a patient tries to cancel an appointment that's already inside
// the cancellation deadline window (e.g. clicking a disabled cancel button).
function explainCancelDeadline() {
  toast(`This appointment can no longer be cancelled online, cancellations require at least ${CANCEL_DEADLINE_HOURS} hours notice. Please message or call the clinic directly.`, 'error')
}
window.explainCancelDeadline = explainCancelDeadline

// Shown when a patient tries to request a reschedule too close to the
// appointment (e.g. clicking a disabled reschedule button).
function explainRescheduleDeadline() {
  toast(`This appointment can no longer be rescheduled online, reschedule requests require at least ${RESCHEDULE_DEADLINE_HOURS} hours notice. Please message or call the clinic directly.`, 'error')
}
window.explainRescheduleDeadline = explainRescheduleDeadline

function confirmCancelAppt(id) {
  const a = appointments.find(a => a.id === id)
  if (!a) return
  const isPatient = state.role === 'patient'

  // Defense in depth — the buttons that open this modal already hide/disable
  // themselves past the deadline, but don't rely on that alone for something
  // that blocks a real cancellation.
  if (isPatient && !apptCancellable(a)) { explainCancelDeadline(); return }

  const fmtD = d => { const dt = new Date(d); return isNaN(dt) ? d : dt.toLocaleDateString('en-PH', { year:'numeric', month:'short', day:'numeric' }) }
  showModal(`
    <div class="modal-header">
      <div class="modal-title">Cancel Appointment</div>
      <button class="modal-close" onclick="window.closeModal()">&times;</button>
    </div>
    <div class="modal-body">
      <div style="background:#FEF2F2;border:1px solid #FECACA;color:#991B1B;border-radius:8px;padding:12px;display:flex;gap:8px;align-items:flex-start;margin-bottom:14px">
        <span style="flex-shrink:0;display:flex;margin-top:2px">${icon('alert-circle','icon-sm')}</span>
        <span style="font-size:.84rem;line-height:1.4">${isPatient ? 'Are you sure you want to cancel this appointment? This action cannot be undone.' : 'Cancel this appointment? The patient will be notified of the cancellation.'}</span>
      </div>
      <div style="background:#F9FAFB;border-radius:8px;padding:10px 12px;margin-bottom:14px;font-size:.84rem">
        <div style="font-weight:600;color:#1a1a1a">${a.type}</div>
        <div style="color:#6B7280;margin-top:2px">${fmtD(a.date)} at ${a.time} · ${a.doctorName || 'Doctor not yet assigned'}</div>
        ${!isPatient ? `<div style="color:#6B7280;margin-top:1px">Patient: <strong>${a.patientName}</strong></div>` : ''}
      </div>
      <div class="form-group" style="margin-bottom:0">
        <label class="form-label">Reason for Cancellation <span style="color:#DC2626">*</span></label>
        <textarea id="cancel-reason" class="form-textarea" rows="3" placeholder="${isPatient ? 'e.g. Schedule conflict, personal emergency, feeling better…' : 'e.g. Doctor unavailable, clinic closure, scheduling conflict…'}" style="resize:none"></textarea>
      </div>
    </div>
    <div class="modal-footer">
      <button class="btn-secondary" onclick="window.closeModal()">Keep Appointment</button>
      <button class="btn-danger" id="cancel-confirm-btn" onclick="window.doCancelAppt('${a.id}')">Confirm Cancellation</button>
    </div>`)
}

// Disables + spins the confirm button for the duration of the request —
// this now sends the patient a cancellation email (see api/appointments/
// update.php), so a fast double-click/tap before the first request
// resolves would fire it twice instead of just double-submitting a no-op
// status change like before. Re-enabled (not just left spinning forever)
// on failure so a network hiccup doesn't strand the modal with no way
// to retry; on success the modal closes anyway so there's nothing to
// restore.
async function doCancelAppt(id) {
  const reason = (document.getElementById('cancel-reason')?.value || '').trim()
  if (!reason) { toast('Please provide a reason for cancellation.', 'error'); return }
  const btn = document.getElementById('cancel-confirm-btn')
  if (btn) {
    if (btn.disabled) return // already in flight
    btn.disabled = true
    btn.innerHTML = `<span style="display:inline-block;width:9px;height:9px;border:2px solid rgba(255,255,255,.5);border-top-color:#fff;border-radius:50%;animation:spin .6s linear infinite;flex-shrink:0"></span> Cancelling…`
  }
  const ok = await cancelAppt(id, reason)
  if (ok) { closeModal(); return }
  if (btn) { btn.disabled = false; btn.innerHTML = 'Confirm Cancellation' }
}

// ── Waitlist removal (admin/staff, e.g. a patient calls asking to be
// taken off) — mirrors confirmCancelAppt's modal, no reason required. ──
function confirmRemoveWaitlistEntry(id) {
  const e = waitlistEntries.find(e => e.id === id)
  if (!e) return
  const fmtD = d => { const dt = new Date(d + 'T00:00:00'); return isNaN(dt) ? d : dt.toLocaleDateString('en-PH', { year:'numeric', month:'short', day:'numeric' }) }
  showModal(`
    <div class="modal-header">
      <div class="modal-title">Remove from Waitlist</div>
      <button class="modal-close" onclick="window.closeModal()">&times;</button>
    </div>
    <div class="modal-body">
      <div style="background:#FEF2F2;border:1px solid #FECACA;color:#991B1B;border-radius:8px;padding:12px;display:flex;gap:8px;align-items:flex-start">
        <span style="flex-shrink:0;display:flex;margin-top:2px">${icon('alert-circle','icon-sm')}</span>
        <span style="font-size:.84rem;line-height:1.4">Remove <strong>${esc(e.patientName)}</strong> from the waitlist for ${esc(e.doctorName)} on ${fmtD(e.date)} at ${e.time}?</span>
      </div>
    </div>
    <div class="modal-footer">
      <button class="btn-secondary" onclick="window.closeModal()">Cancel</button>
      <button class="btn-danger" id="waitlist-remove-confirm-btn" onclick="window.doRemoveWaitlistEntry(${e.id})">Confirm Remove</button>
    </div>`)
}
window.confirmRemoveWaitlistEntry = confirmRemoveWaitlistEntry

async function doRemoveWaitlistEntry(id) {
  const btn = document.getElementById('waitlist-remove-confirm-btn')
  if (_btnBusy(btn, 'danger', 'Removing…')) return
  try {
    const r = await fetch('api/waitlist/leave.php', {
      method: 'POST', headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({ id })
    })
    const d = await r.json()
    if (!d.success) { toast(d.message || 'Could not remove from waitlist.', 'error'); _btnIdle(btn); return }
    closeModal()
    toast('Removed from waitlist.', 'success')
    _syncWaitlist()
  } catch (_) { toast('Network error. Please try again.', 'error'); _btnIdle(btn) }
}
window.doRemoveWaitlistEntry = doRemoveWaitlistEntry

// Confirmation step since this counts against the patient's no-show tally
// and can eventually restrict their online booking — not something to
// trigger by an accidental click.
function confirmMarkNoShow(id) {
  const a = appointments.find(a => a.id === id)
  if (!a) return
  showModal(`
    <div class="modal-header">
      <div class="modal-title">Mark as No-Show</div>
      <button class="modal-close" onclick="window.closeModal()">&times;</button>
    </div>
    <div class="modal-body">
      <div style="background:#FEF2F2;border:1px solid #FECACA;color:#991B1B;border-radius:8px;padding:12px;display:flex;gap:8px;align-items:flex-start;margin-bottom:14px">
        <span style="flex-shrink:0;display:flex;margin-top:2px">${icon('alert-circle','icon-sm')}</span>
        <span style="font-size:.84rem;line-height:1.4">This counts against ${a.patientName}'s no-show record and may eventually restrict their online booking. This action cannot be undone.</span>
      </div>
      <div style="background:#F9FAFB;border-radius:8px;padding:10px 12px;font-size:.84rem">
        <div style="font-weight:600;color:#1a1a1a">${a.type}</div>
        <div style="color:#6B7280;margin-top:2px">${a.date} at ${a.time} · ${a.doctorName}</div>
        <div style="color:#6B7280;margin-top:1px">Patient: <strong>${a.patientName}</strong></div>
      </div>
    </div>
    <div class="modal-footer">
      <button class="btn-secondary" onclick="window.closeModal()">Cancel</button>
      <button class="btn-danger" id="no-show-confirm-btn" onclick="window.markApptNoShow('${id}')">Confirm No-Show</button>
    </div>`)
}
window.confirmMarkNoShow = confirmMarkNoShow

async function markApptNoShow(id) {
  const btn = document.getElementById('no-show-confirm-btn')
  if (_btnBusy(btn, 'danger', 'Marking…')) return
  const ok = await _apptUpdate({ id, action: 'status', status: 'no-show' })
  if (!ok) { _btnIdle(btn); return }
  updateAppointmentStatus(id, 'no-show')
  const a = appointments.find(a => a.id === id)
  if (a) addActivityLog({ id:'L'+Date.now(), user: state.user.name, role: state.role,
    action: `Marked appointment ${id} as no-show for ${a.patientName}`,
    timestamp: nowTimestamp(), type:'appointment' })
  closeModal()
  toast('Appointment marked as no-show.')
  renderPage()
}
window.markApptNoShow = markApptNoShow

async function confirmMyAppointment(id) {
  try {
    const r = await fetch('api/appointments/confirm.php', {
      method: 'POST', headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({ id })
    })
    const d = await r.json()
    if (!d.success) { toast(d.message || 'Could not confirm your appointment.', 'error'); return }
    const a = appointments.find(a => a.id === id)
    if (a) a.confirmedAt = new Date().toISOString()
    closeModal()
    toast('Appointment confirmed. See you then!', 'success')
    renderPage()
  } catch (_) {
    toast('Network error — please try again.', 'error')
  }
}
window.confirmMyAppointment = confirmMyAppointment

// Dedicated, focused "please confirm" prompt — reached directly by tapping
// the day-before reminder notification. Deliberately NOT the full
// viewAppt() details modal: that buries the confirm button under a patient
// card, doctor/type/date/time grid, and notes section, which is exactly
// why patients were missing it. This puts nothing between the patient and
// the one action the notification is actually about.
// A reschedule-request notification (admin/staff/doctor) gets its own
// dedicated shortcut, same idea as confirmApptPrompt() below for
// patients' day-before reminder — land directly on that one appointment's
// details (viewAppt() already shows its Reschedule Request block, with
// Accept & Reschedule / Dismiss right there) instead of just a filtered
// list the reviewer still has to scan to find the right row.
// Navigates to the underlying filtered list first (so there's a sensible
// page behind the modal, and Close doesn't strand them on whatever page
// they clicked the notification from) then opens the modal on top — the
// same setTimeout-after-navigate pattern navigate() itself already uses
// for 'add-patient'.
function openRescheduleRequestNotif(id) {
  const target = window._notifNavTarget ? window._notifNavTarget('reschedule_request', state.role) : null
  const a = appointments.find(a => a.id === id)
  if (!a || !a.rescheduleRequest) {
    // Stale by the time they clicked (already accepted/dismissed elsewhere).
    toast('This reschedule request has already been handled.', 'info')
    if (target) navigate(target.page, target.params)
    return
  }
  if (target) navigate(target.page, target.params)
  setTimeout(() => viewAppt(id), 100)
}
window.openRescheduleRequestNotif = openRescheduleRequestNotif

// Same shortcut again for a brand-new appointment request (admin/staff) —
// straight to that specific patient's request instead of the Pending list.
function openNewApptRequestNotif(id) {
  const target = window._notifNavTarget ? window._notifNavTarget('new_appointment', state.role) : null
  const a = appointments.find(a => a.id === id)
  if (!a || a.status !== 'pending') {
    // Already approved/disapproved/cancelled elsewhere by the time they clicked.
    toast('This appointment request has already been handled.', 'info')
    if (target) navigate(target.page, target.params)
    return
  }
  if (target) navigate(target.page, target.params)
  setTimeout(() => viewAppt(id), 100)
}
window.openNewApptRequestNotif = openNewApptRequestNotif

function confirmApptPrompt(id) {
  const a = appointments.find(a => a.id === id)
  if (!a || a.status !== 'approved' || !a.reminderSentAt) {
    // Stale by the time they clicked (already handled/cancelled elsewhere) —
    // fall back to the appointments list instead of a dead-end modal.
    toast("This appointment no longer needs confirmation.", 'info')
    navigate('patient-appts', { filter: 'approved' })
    return
  }
  if (a.confirmedAt) {
    toast("You've already confirmed this appointment.", 'success')
    navigate('patient-appts', { filter: 'approved' })
    return
  }

  const fmtD = d => { const dt = new Date(d); return isNaN(dt) ? d : dt.toLocaleDateString('en-PH', { year:'numeric', month:'short', day:'numeric' }) }
  showModal(`
    <div class="modal-body" style="text-align:center;padding:32px 24px">
      <div style="width:56px;height:56px;border-radius:50%;background:#FFF7ED;border:2px solid #FDBA74;
                  display:flex;align-items:center;justify-content:center;margin:0 auto 16px;color:#E8760A">
        ${icon('alert-circle','icon-lg')}
      </div>
      <div style="font-size:1.05rem;font-weight:700;color:#1C1C1C;margin-bottom:8px">Confirm Your Appointment</div>
      <div style="background:#F9FAFB;border-radius:10px;padding:14px 20px;margin-bottom:16px;text-align:left">
        <div style="font-size:.85rem;font-weight:600;color:#1C1C1C">${a.doctorName}</div>
        <div style="font-size:.82rem;color:#6B7280;margin-top:4px">${fmtD(a.date)} at ${a.time}</div>
        <div style="font-size:.82rem;color:#6B7280">${a.type}</div>
      </div>
      <div style="font-size:.85rem;color:#6B7280;margin-bottom:20px">Will you be attending? If we don't hear from you by ${consultationSettings.confirmDeadlineTime || '9:00 PM'} today, this appointment will be automatically cancelled.</div>
      <div style="display:flex;gap:10px;justify-content:center;flex-wrap:wrap">
        <button class="btn-secondary" onclick="window.closeModal()">Not Now</button>
        <button class="btn-primary" onclick="window.confirmMyAppointment('${a.id}')">Yes, I'll Be There</button>
      </div>
      <button class="btn-ghost" style="margin-top:10px;font-size:.78rem" onclick="window.closeModal();window.viewAppt('${a.id}')">View Full Details</button>
    </div>`)
}
window.confirmApptPrompt = confirmApptPrompt

window.confirmCancelAppt  = confirmCancelAppt
window.doCancelAppt       = doCancelAppt

function confirmDisapproveAppt(id) {
  const a = appointments.find(a => a.id === id)
  if (!a) return
  const fmtD = d => { const dt = new Date(d); return isNaN(dt) ? d : dt.toLocaleDateString('en-PH', { year:'numeric', month:'short', day:'numeric' }) }
  showModal(`
    <div class="modal-header">
      <div class="modal-title">Disapprove Appointment</div>
      <button class="modal-close" onclick="window.closeModal()">&times;</button>
    </div>
    <div class="modal-body">
      <div style="background:#FEF2F2;border:1px solid #FECACA;color:#991B1B;border-radius:8px;padding:12px;display:flex;gap:8px;align-items:flex-start;margin-bottom:14px">
        <span style="flex-shrink:0;display:flex;margin-top:2px">${icon('alert-circle','icon-sm')}</span>
        <span style="font-size:.84rem;line-height:1.4">Disapprove this appointment request? The patient will be notified and may submit a new request.</span>
      </div>
      <div style="background:#F9FAFB;border-radius:8px;padding:10px 12px;margin-bottom:14px;font-size:.84rem">
        <div style="font-weight:600;color:#1a1a1a">${a.type}</div>
        <div style="color:#6B7280;margin-top:2px">${fmtD(a.date)} at ${a.time} · ${a.doctorName || 'Doctor not yet assigned'}</div>
        <div style="color:#6B7280;margin-top:1px">Patient: <strong>${a.patientName}</strong></div>
      </div>
      <div class="form-group" style="margin-bottom:0">
        <label class="form-label">Reason for Disapproval <span style="color:#DC2626">*</span></label>
        <textarea id="disapprove-reason" class="form-textarea" rows="3" placeholder="e.g. Slot unavailable, doctor on leave, scheduling conflict…" style="resize:none"></textarea>
      </div>
    </div>
    <div class="modal-footer">
      <button class="btn-secondary" onclick="window.closeModal()">Keep Request</button>
      <button class="btn-disapprove" id="disapprove-confirm-btn" onclick="window.doDisapproveAppt('${a.id}')">Confirm Disapproval</button>
    </div>`)
}

// Same disable+spin guard as doCancelAppt() above, same reason — this
// sends the patient an email too, so it needs to be spam-proof against a
// fast double-click, not just double-submit-proof.
async function doDisapproveAppt(id) {
  const reason = (document.getElementById('disapprove-reason')?.value || '').trim()
  if (!reason) { toast('Please provide a reason for disapproval.', 'error'); return }
  const btn = document.getElementById('disapprove-confirm-btn')
  if (btn) {
    if (btn.disabled) return // already in flight
    btn.disabled = true
    btn.innerHTML = `<span style="display:inline-block;width:9px;height:9px;border:2px solid rgba(220,38,38,.4);border-top-color:#991b1b;border-radius:50%;animation:spin .6s linear infinite;flex-shrink:0"></span> Disapproving…`
  }
  const ok = await disapproveAppt(id, reason)
  if (ok) { closeModal(); return }
  if (btn) { btn.disabled = false; btn.innerHTML = 'Confirm Disapproval' }
}

window.confirmDisapproveAppt = confirmDisapproveAppt
window.doDisapproveAppt      = doDisapproveAppt

// ════════════════════════════════════════════════════════════════
//  PATIENT APPOINTMENT WIZARD
// ════════════════════════════════════════════════════════════════
// State shared across all wizard steps
const _wiz = {
  step: 0,
  selectedDate: '',
  selectedDateLabel: '',
  selectedDateShort: '',
  doctorId: '',
  doctorName: '',
  doctorSpec: '',
  time: '',
  type: '',
  notes: '',
  calYear: 0,
  calMonth: 0,
  // 'patient' (self-service booking) or 'staff' (admin/staff creating on a
  // patient's behalf) — the calendar/doctor-cards/time-slots/type steps are
  // identical either way; only the patient-selection gate and the Review
  // step's submit behavior differ. See appointmentWizardHtml() in pages.js.
  mode: 'patient',
  patientId: '',
  patientName: '',
  initialStatus: 'pending',
  // "Any available optometrist" — patient chose not to pick a specific
  // doctor (see wizChooseDoctorPref()). Skips the Doctor step entirely;
  // the clinic assigns an actual doctor after reviewing the request
  // (appointments/update.php action=assign_doctor). Always false in
  // staff mode — staff/admin always pick a doctor directly.
  anyDoctor: false
}

// ════════════════════════════════════════════════════════════════
//  PHILIPPINE PUBLIC HOLIDAYS
// ════════════════════════════════════════════════════════════════
function getPHHolidays(year) {
  // Easter Sunday — Anonymous Gregorian algorithm
  function easter(y) {
    const a=y%19,b=Math.floor(y/100),c=y%100,d=Math.floor(b/4),e=b%4
    const f=Math.floor((b+8)/25),g=Math.floor((b-f+1)/3)
    const h=(19*a+b-d-g+15)%30,i=Math.floor(c/4),k=c%4
    const l=(32+2*e+2*i-h-k)%7,m=Math.floor((a+11*h+22*l)/451)
    return new Date(y,Math.floor((h+l-7*m+114)/31)-1,((h+l-7*m+114)%31)+1)
  }
  function fmt(d){return `${d.getFullYear()}-${String(d.getMonth()+1).padStart(2,'0')}-${String(d.getDate()).padStart(2,'0')}`}
  function add(d,n){const r=new Date(d);r.setDate(r.getDate()+n);return r}
  function dow(dateStr){const[y,m,d]=dateStr.split('-').map(Number);return new Date(y,m-1,d).getDay()}

  // Last Monday of August = National Heroes Day
  const aug31=new Date(year,7,31); let heroesDay=new Date(aug31)
  while(heroesDay.getDay()!==1) heroesDay.setDate(heroesDay.getDate()-1)

  const h={}

  // Regular holidays — when a holiday falls on Sunday, mark the following Monday (PH law)
  const regular={
    [`${year}-01-01`]:"New Year's Day",
    [`${year}-04-09`]:"Araw ng Kagitingan",
    [`${year}-05-01`]:"Labor Day",
    [`${year}-06-12`]:"Independence Day",
    [fmt(heroesDay)]:"National Heroes Day",
    [`${year}-11-01`]:"All Saints' Day",
    [`${year}-11-30`]:"Bonifacio Day",
    [`${year}-12-25`]:"Christmas Day",
    [`${year}-12-30`]:"Rizal Day",
  }
  Object.entries(regular).forEach(([date,name])=>{
    h[date]=name
    if(dow(date)===0) h[fmt(add(new Date(date.replace(/-/g,'/')),1))]=name+' (Observed)'
  })

  // Special non-working holidays
  h[`${year}-02-25`]="EDSA People Power Revolution Anniversary"
  h[`${year}-08-21`]="Ninoy Aquino Day"
  h[`${year}-11-02`]="All Souls' Day"
  h[`${year}-12-08`]="Feast of the Immaculate Conception"
  h[`${year}-12-31`]="New Year's Eve"

  // Chinese New Year (special non-working) — declared annually by proclamation
  const chineseNY={2025:'2025-01-29',2026:'2026-02-17',2027:'2027-02-06',2028:'2028-01-26'}
  if(chineseNY[year]) h[chineseNY[year]]="Chinese New Year"

  // Holy Week (computed from Easter)
  const e=easter(year)
  h[fmt(add(e,-3))]="Maundy Thursday"
  h[fmt(add(e,-2))]="Good Friday"
  h[fmt(add(e,-1))]="Black Saturday"

  // Eid dates — declared by government; approximate for known years
  const eidFitr={2025:'2025-03-31',2026:'2026-03-20',2027:'2027-03-09',2028:'2028-03-27'}
  const eidAdha={2025:'2025-06-07',2026:'2026-05-27',2027:'2027-05-16',2028:'2028-06-04'}
  if(eidFitr[year]) h[eidFitr[year]]="Eid al-Fitr"
  if(eidAdha[year]) h[eidAdha[year]]="Eid al-Adha"
  return h
}
window.getPHHolidays = getPHHolidays

// Populated dynamically per doctor+date fetch — not hardcoded
let _takenSlotTimes = []   // raw booked times from the DB for current doctor+date
let _takenSlotDur   = 40   // duration in minutes from clinic settings

// ── Time-slot generation from Consultation Settings ─────────────────
// Booking time slots used to be a hardcoded list — these read the live
// morning/afternoon session times + default duration so admin's Operating
// Hours settings actually drive what patients can book.
function _clockToMinutes(t) {
  if (!t) return null
  const isPM   = /PM$/i.test(t) && !/^12/.test(t)
  const is12am = /^12/.test(t) && /AM$/i.test(t)
  const [h, m] = t.replace(/\s?[AP]M$/i, '').split(':').map(Number)
  let hh = h || 0
  if (isPM)   hh += 12
  if (is12am) hh = 0
  return hh * 60 + (m || 0)
}
function _minutesToClock(mins) {
  let h = Math.floor(mins / 60), m = mins % 60
  const ampm = h >= 12 ? 'PM' : 'AM'
  let hh = h % 12; if (hh === 0) hh = 12
  return `${hh}:${String(m).padStart(2,'0')} ${ampm}`
}
function _durationMinutes(d) {
  const m = (d || '').match(/\d+/)
  return m ? parseInt(m[0], 10) : 40
}
function _buildSessionSlots(startStr, endStr, stepMin) {
  const start = _clockToMinutes(startStr)
  const end   = _clockToMinutes(endStr)
  if (start == null || end == null || stepMin <= 0) return []
  const out = []
  for (let t = start; t < end; t += stepMin) out.push(_minutesToClock(t))
  return out
}

// Narrows a clinic-wide session window down to a specific doctor's own
// configured hours (Doctor Schedule → Edit Schedule, doctor.hours e.g.
// "12:30 PM – 5:00 PM") — only ever tightens the window, never widens it
// past the clinic's own hours. Without this, the time-slot pickers
// (wizBuildTimeSlots/rsBuildTimeSlots below) offered every clinic-wide
// slot regardless of which doctor was actually selected, including ones
// hours before that doctor's own start time. A doctor with no `hours`
// set at all falls back to the clinic's own window unchanged.
function _clampToDoctorHours(startStr, endStr, doctorHours) {
  const parts      = (doctorHours || '').split('–').map(s => s.trim())
  const docStartMin = parts[0] ? _clockToMinutes(parts[0]) : null
  const docEndMin   = parts[1] ? _clockToMinutes(parts[1]) : null
  let clampedStart = startStr, clampedEnd = endStr
  if (docStartMin != null) {
    const clinicStartMin = _clockToMinutes(startStr)
    if (clinicStartMin != null && docStartMin > clinicStartMin) clampedStart = _minutesToClock(docStartMin)
  }
  if (docEndMin != null) {
    const clinicEndMin = _clockToMinutes(endStr)
    if (clinicEndMin != null && docEndMin < clinicEndMin) clampedEnd = _minutesToClock(docEndMin)
  }
  return [clampedStart, clampedEnd]
}

// ── Stepper UI update ─────────────────────────────────────────────
function wizUpdateStepper(step) {
  for (let i = 0; i < 5; i++) {
    const si = document.getElementById('wiz-si-' + i)
    const ci = document.getElementById('wiz-c-' + i)
    if (!si || !ci) continue
    si.className = 'wiz-step-item' + (i < step ? ' done' : i === step ? ' active' : '')
    ci.innerHTML  = i < step
      ? `<svg viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="3" width="12" height="12"><polyline points="20 6 9 17 4 12"/></svg>`
      : String(i + 1)
  }
}

// ── Show a step with animation ────────────────────────────────────
function wizShowStep(idx, dir) {
  const steps = document.querySelectorAll('.wiz-step')
  steps.forEach((el, i) => {
    el.classList.remove('active','wiz-anim-right','wiz-anim-left')
    if (i === idx) {
      el.classList.add('active')
      el.classList.add(dir > 0 ? 'wiz-anim-right' : 'wiz-anim-left')
    }
  })
  wizUpdateStepper(idx)
}

// ── Navigate forward / backward ───────────────────────────────────
function wizGo(dir) {
  let nextStep = _wiz.step + dir
  // "Any available optometrist" — the Doctor step (index 1) never renders,
  // so skip over it in both directions.
  if (_wiz.anyDoctor && nextStep === 1) nextStep += dir
  if (nextStep < 0 || nextStep > 4) return
  // Collect current step data before moving
  if (_wiz.step === 3) {
    _wiz.type  = document.getElementById('appt-type')?.value || ''
    _wiz.notes = document.getElementById('appt-notes')?.value || ''
  }
  // Going back from doctor step — clear selected doctor and prefill filter so calendar resets
  if (_wiz.step === 1 && dir === -1) {
    _wiz.doctorId     = null
    _wiz.doctorName   = ''
    _wiz.doctorSpec   = ''
    _wiz._prefillDays = []
    const inp = document.getElementById('appt-doctor')
    if (inp) inp.value = ''
    const sd = document.getElementById('sum-doctor')
    if (sd) { sd.textContent = 'Not selected yet'; sd.classList.add('empty') }
    const st = document.getElementById('sum-time')
    if (st) { st.textContent = 'Not selected yet'; st.classList.add('empty') }
  }
  if (nextStep === 4) wizPopulateReview()
  _wiz.step = nextStep
  wizShowStep(nextStep, dir)
  if (nextStep === 0) { amcRenderPrefillBanner(); amcRender() }
  if (nextStep === 1) wizBuildDoctorCards()   // async — fire-and-forget is fine here
  if (nextStep === 2) wizBuildTimeSlots()   // async — fire-and-forget is fine here
  window.scrollTo(0, 0)
}
window.wizGo = wizGo

// Jump directly to a step (from review "Edit" links)
function wizJump(targetStep) {
  // The Doctor step doesn't exist in "any doctor" mode — nothing links to
  // it (see rev-doctor-edit's visibility in wizPopulateReview()), but guard
  // here too in case something else ever tries.
  if (_wiz.anyDoctor && targetStep === 1) return
  const dir = targetStep < _wiz.step ? -1 : 1
  _wiz.step = targetStep
  wizShowStep(targetStep, dir)
  if (targetStep === 1) wizBuildDoctorCards()   // async — fire-and-forget is fine here
  if (targetStep === 2) wizBuildTimeSlots()   // async — fire-and-forget is fine here
}
window.wizJump = wizJump

// Scans forward from today (up to ~2 months) for the first date that
// would actually render as a clickable "Available" cell in amcRender() —
// mirrors that function's own bookability logic (Sunday, PH holidays,
// clinic days, min/max advance window, "does any doctor even work this
// day") rather than duplicating it loosely. Used to pick which month the
// calendar opens on by default: today's own month can easily have zero
// bookable dates left in it (every day already past, or the one day left
// is a holiday — see wizInitStaff()'s own follow-up-date checks for the
// same three reasons), which used to just leave staff/patients staring at
// an all-gray dead month with no indication of where to look next.
function _earliestBookableDate(prefillDays) {
  const now = new Date()
  const todayY = now.getFullYear(), todayM = now.getMonth(), todayD = now.getDate()
  const isStaffMode = _wiz.mode === 'staff'
  const maxDate = isStaffMode ? null : maxAdvanceDate(new Date(todayY, todayM, todayD))
  const minAdv  = isStaffMode ? 0 : minAdvanceDays()
  const dayNames = ['Sun','Mon','Tue','Wed','Thu','Fri','Sat']
  const dayNamesFull = ['Sunday','Monday','Tuesday','Wednesday','Thursday','Friday','Saturday']
  const hasPrefill = !!(prefillDays && prefillDays.length)

  for (let i = 0; i <= 60; i++) {
    const d = new Date(todayY, todayM, todayD + i)
    if (maxDate && d > maxDate) break
    if (i < minAdv) continue
    const dow = d.getDay()
    if (dow === 0) continue // clinic never open Sundays
    const dateStr = `${d.getFullYear()}-${String(d.getMonth()+1).padStart(2,'0')}-${String(d.getDate()).padStart(2,'0')}`
    if (getPHHolidays(d.getFullYear())[dateStr]) continue
    const isClinicDay = (dayNamesFull[dow] && (consultationSettings.clinicDays || []).includes(dayNamesFull[dow]))
    if (!isClinicDay) continue
    if (hasPrefill) {
      if (!prefillDays.includes(dayNames[dow])) continue
    } else {
      const noDoctorThisDay = !doctors.some(doc =>
        (doc.days || []).includes(dayNames[dow]) && !(doc.blockedDates || []).some(b => b.date === dateStr)
      )
      if (noDoctorThisDay) continue
    }
    return d
  }
  return null // nothing bookable within range — leave the caller's own fallback in place
}

// ── Calendar init ─────────────────────────────────────────────────
function amcInit() {
  const now = new Date()
  const prefill = window._patCalPrefill || null
  window._patCalPrefill = null  // consume once

  // Default the visible month to wherever the earliest actually-bookable
  // date falls, not blindly "today" — a prefill (below) still overrides
  // this with its own specific date when there is one.
  const earliest = _earliestBookableDate()
  const defaultCalYear  = earliest ? earliest.getFullYear() : now.getFullYear()
  const defaultCalMonth = earliest ? earliest.getMonth()    : now.getMonth()

  Object.assign(_wiz, { step:0, selectedDate:'', selectedDateLabel:'', selectedDateShort:'',
    doctorId:'', doctorName:'', doctorSpec:'', _prefillDays:[], time:'', type:'', notes:'',
    calYear: defaultCalYear, calMonth: defaultCalMonth, anyDoctor: false })

  // Relabel the stepper's Doctor dot back to default in case a previous
  // visit to this page left it saying "Any Doctor" (see wizChooseDoctorPref()).
  const stepLbl = document.querySelector('#wiz-si-1 .wiz-step-label')
  if (stepLbl) stepLbl.textContent = 'Doctor'

  const prefEl = document.getElementById('wiz-pref')
  const mainEl = document.getElementById('wiz-main')
  if (prefill) {
    // Doctor already chosen via Doctor Availability — skip the preference
    // gate entirely and land straight on the wizard. The "Back" button on
    // Step 0 (see wizBackToPref()) stays available regardless, in case the
    // patient changes their mind about that specific doctor once they're
    // actually looking at dates — it clears the pre-fill and reopens the
    // preference gate from scratch.
    if (prefEl) prefEl.style.display = 'none'
    if (mainEl) mainEl.style.display = ''
  } else {
    // Always shown otherwise — every patient gets the real doctor-name/
    // no-doctor-name choice (see appointmentWizardHtml(), pages.js).
    if (prefEl) prefEl.style.display = ''
    if (mainEl) mainEl.style.display = 'none'
  }

  // Apply pre-fill from Doctor Availability page
  if (prefill) {
    _wiz.doctorId   = prefill.doctorId
    _wiz.doctorName = prefill.doctorName
    _wiz.doctorSpec = prefill.doctorSpec || ''
    _wiz._prefillDays = prefill.doctorDays || []

    if (prefill.date) {
      // Date + doctor known — pre-fill both, land on Step 3 (time)
      _wiz.selectedDate = prefill.date
      const dt = new Date(prefill.date + 'T00:00:00')
      _wiz.selectedDateLabel = dt.toLocaleDateString('en-US', { weekday:'long', month:'long', day:'numeric', year:'numeric' })
      _wiz.selectedDateShort = dt.toLocaleDateString('en-US', { month:'long', day:'numeric' })
      _wiz.calYear  = dt.getFullYear()
      _wiz.calMonth = dt.getMonth()
      _wiz.step = 2
      wizShowStep(2, 1)
      wizBuildTimeSlots()   // async — fire-and-forget is fine here
    } else {
      // Doctor only — land on Step 1, show prefill banner, filter calendar to doctor's days
      wizShowStep(0, 1)
    }

    // Update summary sidebar with whatever is known
    setTimeout(() => {
      const sd = document.getElementById('sum-doctor')
      if (sd) { sd.textContent = prefill.doctorName; sd.classList.remove('empty') }
      if (prefill.date) {
        const sdDate = document.getElementById('sum-date')
        if (sdDate) { sdDate.textContent = _wiz.selectedDateLabel; sdDate.classList.remove('empty') }
      }
      amcRenderPrefillBanner()
    }, 0)
  } else {
    wizShowStep(0, 1)
  }

  amcRender()
}
window.amcInit = amcInit

// Init for the admin/staff "New Appointment" page — parallel to amcInit()
// but for a caller booking on a patient's behalf rather than for themselves.
// No doctor-prefill flow (that's a patient-only entry point from Doctor
// Availability); the patient is already chosen by the time this runs, via
// the picker gate in pageCreateAppointment().
function wizInitStaff(patientId, patientName) {
  const now = new Date()
  const prefill = window._staffCalPrefill || null
  window._staffCalPrefill = null  // consume once

  // Set ahead of the Object.assign below so _earliestBookableDate() (which
  // reads _wiz.mode to grant staff their usual advance-booking-window
  // exemption) sees the right mode already — same default-month reasoning
  // as amcInit()'s own call: today's month can have zero bookable dates
  // left in it, most often because staff opened this on a day that's
  // itself the month's last remaining date and also a holiday.
  _wiz.mode = 'staff'
  const earliest = _earliestBookableDate()
  const defaultCalYear  = earliest ? earliest.getFullYear() : now.getFullYear()
  const defaultCalMonth = earliest ? earliest.getMonth()    : now.getMonth()

  Object.assign(_wiz, { step:0, selectedDate:'', selectedDateLabel:'', selectedDateShort:'',
    doctorId:'', doctorName:'', doctorSpec:'', _prefillDays:[], time:'', type:'',
    notes:'', calYear: defaultCalYear, calMonth: defaultCalMonth,
    mode: 'staff', patientId, patientName, initialStatus: 'approved', anyDoctor: false })

  const set = (id, val) => { const el = document.getElementById(id); if (el) el.textContent = val }
  set('wiz-patient-lbl0', patientName)
  set('sum-patient', patientName)
  set('rev-patient', patientName)

  // Pre-fill from a "Follow-up Consultation Needed" notification (see
  // markNotifRead()'s follow_up_needed branch) — doctor + recommended date
  // already known, so skip straight to Step 3 (Time) instead of making
  // staff re-pick a doctor and date they were just told about. But neither
  // half of that recommendation is guaranteed to still hold by the time
  // staff acts on it:
  //  - the date itself might now be a PH holiday or outside the clinic's
  //    configured operating days (clinic_settings.clinic_days) — nothing
  //    about the recommendation ever checked that, it's just whatever date
  //    the doctor typed in during the exam;
  //  - the recommending doctor isn't necessarily still scheduled to work
  //    that exact date (weekly days, or a one-off blocked date set on
  //    Doctor Schedule since the recommendation was made).
  // Both are checked before ever landing on Time, same as amcRender()/
  // wizBuildDoctorCards() already check them for the normal Date-then-
  // Doctor flow — a holiday/closed day fails the whole date regardless of
  // doctor, so that's checked first and, if it fails, staff stays on the
  // Date step itself (picking a different doctor wouldn't fix a day the
  // clinic isn't even open) instead of being sent to the Doctor step.
  if (prefill) {
    let dateAvailable = true
    let dateProblem   = ''
    let doctorAvailable = false
    if (prefill.date) {
      const dt = new Date(prefill.date + 'T00:00:00')
      const dayShort = ['Sun','Mon','Tue','Wed','Thu','Fri','Sat'][dt.getDay()]
      const dayFull  = ['Sunday','Monday','Tuesday','Wednesday','Thursday','Friday','Saturday'][dt.getDay()]
      const holidayName = getPHHolidays(dt.getFullYear())[prefill.date]
      const isClinicDay = (consultationSettings.clinicDays || []).includes(dayFull)
      // Same "no doctor at all works this weekday" check amcRender() does
      // for the regular calendar (its own noDoctorThisDay) — a
      // recommended date can be a real, open clinic day and still be
      // unbookable if nobody on staff is actually scheduled for it.
      const noDoctorThisDay = isClinicDay && !doctors.some(doc =>
        (doc.days || []).includes(dayShort) && !(doc.blockedDates || []).some(b => b.date === prefill.date)
      )
      if (holidayName) {
        dateAvailable = false
        dateProblem   = `The clinic is closed for ${holidayName}`
      } else if (!isClinicDay) {
        dateAvailable = false
        dateProblem   = 'The clinic is closed that day'
      } else if (noDoctorThisDay) {
        dateAvailable = false
        dateProblem   = 'No doctor is scheduled to work that day'
      }

      if (dateAvailable && prefill.doctorId) {
        const prefDoc = doctors.find(d => d.id === prefill.doctorId)
        const blockedOnDate = prefDoc && (prefDoc.blockedDates || []).some(b => b.date === prefill.date)
        doctorAvailable = !!prefDoc && (prefDoc.days || []).includes(dayShort) && !blockedOnDate
      }
    }

    if (dateAvailable && doctorAvailable) {
      _wiz.doctorId   = prefill.doctorId
      _wiz.doctorName = prefill.doctorName
      _wiz.doctorSpec = prefill.doctorSpec || ''
    }

    if (prefill.date && dateAvailable) {
      _wiz.selectedDate = prefill.date
      const dt = new Date(prefill.date + 'T00:00:00')
      _wiz.selectedDateLabel = dt.toLocaleDateString('en-US', { weekday:'long', month:'long', day:'numeric', year:'numeric' })
      _wiz.selectedDateShort = dt.toLocaleDateString('en-US', { month:'long', day:'numeric' })
      _wiz.calYear  = dt.getFullYear()
      _wiz.calMonth = dt.getMonth()
      if (doctorAvailable) {
        _wiz.step = 2
        wizShowStep(2, 1)
        // Chained (not fire-and-forget like the other call sites) so the
        // doctor's recommended time — if they picked one on the exam's
        // Follow-up Date & Time modal (openFollowUpPicker(), above) — can
        // be pre-selected once the real slot grid actually exists. Still
        // re-validated against the fresh taken-slots fetch inside
        // wizBuildTimeSlots() same as everything else here, so a time
        // that's since been booked by someone else is simply not there to
        // find (renders disabled/full) rather than force-selected anyway.
        wizBuildTimeSlots().then(() => {
          if (!prefill.time) return
          const btn = [...document.querySelectorAll('#appt-time-slots .time-slot')].find(b => b.textContent.trim() === prefill.time)
          if (!btn || btn.disabled) return
          wizSelectTime(prefill.time, btn)
          // Date, doctor AND time are all now locked in and already visible
          // on the summary sidebar — staff has nothing left to decide on
          // this step, so skip straight to Type instead of making them
          // click Continue on a step that's already fully filled in. Only
          // reachable when the recommended time actually held up above; a
          // since-booked time falls through and leaves staff on this step
          // to pick a different one themselves, same as before.
          _wiz.step = 3
          wizShowStep(3, 1)
        })
      } else {
        // Doctor isn't available this date — land on the Doctor step
        // instead, date still locked in, so staff picks someone who
        // actually works this day rather than the recommended one. If
        // NO doctor at all works this day, wizBuildDoctorCards() already
        // shows its own "No doctors are available on this day" empty
        // state — nothing extra needed here for that case.
        _wiz.step = 1
        wizShowStep(1, 1)
        wizBuildDoctorCards()   // async — fire-and-forget is fine here
      }
    } else {
      // Either no date was recommended, or the recommended date itself
      // isn't available (holiday/closed day) — stay on the Date step
      // with nothing pre-selected, so the calendar shows its own real
      // holiday/unavailable styling for that cell instead of a
      // misleading "Selected" (orange) fill on a day that can't
      // actually be booked. Still jump the visible month to the
      // recommended date's month so staff can see why right away,
      // instead of landing on whatever month happens to be current.
      if (prefill.date) {
        const dt = new Date(prefill.date + 'T00:00:00')
        _wiz.calYear  = dt.getFullYear()
        _wiz.calMonth = dt.getMonth()
      }
      wizShowStep(0, 1)
    }

    setTimeout(() => {
      if (dateAvailable && doctorAvailable) {
        const sd = document.getElementById('sum-doctor')
        if (sd) { sd.textContent = prefill.doctorName; sd.classList.remove('empty') }
      }
      if (prefill.date && dateAvailable) {
        const sdDate = document.getElementById('sum-date')
        if (sdDate) { sdDate.textContent = _wiz.selectedDateLabel; sdDate.classList.remove('empty') }
      }
      const fuPill = document.getElementById('wiz-followup-pill')
      if (fuPill) fuPill.style.display = (prefill.isFollowUp && dateAvailable && doctorAvailable) ? 'inline-flex' : 'none'

      const docNotice = document.getElementById('wiz-doctor-unavail-notice')
      if (docNotice) {
        docNotice.style.display = (prefill.date && dateAvailable && !doctorAvailable && prefill.doctorName) ? 'flex' : 'none'
        const nameEl = document.getElementById('wiz-doctor-unavail-name')
        if (nameEl) nameEl.textContent = prefill.doctorName
      }

      const dateNotice = document.getElementById('wiz-date-unavail-notice')
      if (dateNotice) {
        dateNotice.style.display = (prefill.date && !dateAvailable) ? 'flex' : 'none'
        if (prefill.date && !dateAvailable) {
          const dt = new Date(prefill.date + 'T00:00:00')
          const dateEl = document.getElementById('wiz-date-unavail-date')
          if (dateEl) dateEl.textContent = dt.toLocaleDateString('en-US', { weekday:'long', month:'long', day:'numeric', year:'numeric' })
          const reasonEl = document.getElementById('wiz-date-unavail-reason')
          if (reasonEl) reasonEl.textContent = dateProblem
        }
      }

      amcRenderPrefillBanner()
    }, 0)
  } else {
    wizShowStep(0, 1)
    amcRenderPrefillBanner()
  }

  amcRender()
}
window.wizInitStaff = wizInitStaff

// Show/hide the "booking with doctor X" banner on Step 1
function amcRenderPrefillBanner() {
  const banner = document.getElementById('amc-prefill-banner')
  if (!banner) return
  if (_wiz.doctorName) {
    banner.style.display = 'flex'
    const nameEl = document.getElementById('amc-prefill-doc-name')
    if (nameEl) nameEl.textContent = _wiz.doctorName
  } else {
    banner.style.display = 'none'
  }
}
window.amcRenderPrefillBanner = amcRenderPrefillBanner

// Preference gate (patient-only, pages.js's #wiz-pref) — answers "does this
// patient want to pick their own doctor, or let the clinic assign one?"
// before the wizard proper even shows. See wizGo()'s Doctor-step skip logic.
function wizChooseDoctorPref(any) {
  _wiz.anyDoctor = !!any
  const prefEl = document.getElementById('wiz-pref')
  const mainEl = document.getElementById('wiz-main')
  if (prefEl) prefEl.style.display = 'none'
  if (mainEl) mainEl.style.display = ''
  // The Doctor step is skipped but its stepper dot still shows — relabel it
  // so it doesn't claim a doctor is being picked when one isn't.
  const stepLbl = document.querySelector('#wiz-si-1 .wiz-step-label')
  if (stepLbl) stepLbl.textContent = any ? 'Any Doctor' : 'Doctor'
  // Reflect the choice in the summary sidebar immediately — otherwise
  // "Any available optometrist" leaves Doctor reading "Not selected yet"
  // for the rest of the flow even though there's nothing left to select.
  const sd = document.getElementById('sum-doctor')
  if (sd) {
    if (any) { sd.textContent = 'Any available doctor'; sd.classList.remove('empty') }
    else     { sd.textContent = 'Not selected yet'; sd.classList.add('empty') }
  }
  wizShowStep(0, 1)
  amcRender()
}
window.wizChooseDoctorPref = wizChooseDoctorPref

function wizBackToPref() {
  // Clear any doctor pre-fill (e.g. arrived here via "Book Appointment" on
  // Doctor Availability) — the point of backing out to this gate is to let
  // the patient actually reconsider, not land back on Step 0 with that same
  // doctor silently still selected underneath. Whichever option they pick
  // next (a specific doctor via Step 1, or "any available") now starts clean.
  _wiz.doctorId = ''; _wiz.doctorName = ''; _wiz.doctorSpec = ''; _wiz._prefillDays = []
  _wiz.anyDoctor = false
  amcRenderPrefillBanner()
  amcRender()
  const sd = document.getElementById('sum-doctor')
  if (sd) { sd.textContent = 'Not selected yet'; sd.classList.add('empty') }

  const prefEl = document.getElementById('wiz-pref')
  const mainEl = document.getElementById('wiz-main')
  if (prefEl) prefEl.style.display = ''
  if (mainEl) mainEl.style.display = 'none'
}
window.wizBackToPref = wizBackToPref

// The page header's own "<" back button (pages.js, patient's Request
// Appointment screen) used to always exit straight to My Appointments,
// discarding wizard progress entirely — including from the calendar
// (Step 0), one click after choosing/being told about a doctor
// preference. Now it's a soft back into that same preference gate
// instead, matching the wizard's own internal Step-0 Back button, and
// only actually leaves the page once there's no gate state left to
// unwind (i.e. the gate itself is already what's showing).
function wizPageBack() {
  const mainEl = document.getElementById('wiz-main')
  if (mainEl && mainEl.style.display !== 'none' && _wiz.step === 0) {
    wizBackToPref()
    return
  }
  goBack('patient-appts', { filter: 'all' })
}
window.wizPageBack = wizPageBack

function amcGoMonth(dir) {
  const now = new Date()
  let y = _wiz.calYear, m = _wiz.calMonth + dir
  if (m < 0) { m = 11; y-- }
  if (m > 11) { m = 0; y++ }
  if (y < now.getFullYear() || (y === now.getFullYear() && m < now.getMonth())) return
  // Same discretion staff/admin already get elsewhere (amcRender()'s own
  // isFar check) — the Maximum Advance Booking window is a patient
  // self-service policy only, never enforced server-side for any role.
  // Without this, a patient could keep clicking Next straight past the
  // bookable window into a month where literally every date is disabled —
  // a dead end with nothing to click, not just a longer scroll.
  if (_wiz.mode !== 'staff') {
    const maxDate = maxAdvanceDate(now)
    if (y > maxDate.getFullYear() || (y === maxDate.getFullYear() && m > maxDate.getMonth())) return
  }
  _wiz.calYear = y; _wiz.calMonth = m
  amcRender()
}
window.amcGoMonth = amcGoMonth

// Shared doctor-scoped calendar cell builder for the two reschedule flows
// (staff's rescheduleAppt() and patient's requestReschedule()) — mirrors
// amcRender()'s exact cell logic (day-of-week availability, blocked dates,
// PH holidays) so date-picking during a reschedule respects precisely the
// same rules as the original booking wizard, instead of a native
// <input type="date"> that can't disable individual dates at all (no
// min/max range can express "closed Sundays" or "this doctor's day off").
// The doctor is always fixed here (a reschedule never changes doctor), so
// this skips amcRender()'s doctor-agnostic/no-prefill branches entirely.
//
// enforceAdvanceWindow controls the min/max advance-booking bounds only —
// deliberately NOT the day-of-week/holiday/blocked-date checks, which
// always apply regardless of caller. This mirrors the same asymmetry
// already established elsewhere (api/appointments/create.php): patients
// booking for themselves are held to the clinic's advance-booking policy,
// admin/staff retain discretion over timing but not over whether a doctor
// actually works that day.
function _buildRescheduleCalCells(doctor, year, month, selectedDate, onSelectFn, enforceAdvanceWindow) {
  const now      = new Date()
  const todayY   = now.getFullYear(), todayM = now.getMonth(), todayD = now.getDate()
  const maxDate  = maxAdvanceDate(new Date(todayY, todayM, todayD))
  const dayNames = ['Sun','Mon','Tue','Wed','Thu','Fri','Sat']
  const phHolidays = getPHHolidays(year)
  const blockedMap = {}
  ;(doctor?.blockedDates || []).forEach(b => { blockedMap[b.date] = b.reason || 'Unavailable' })

  const firstDay  = new Date(year, month, 1).getDay()
  const daysInMon = new Date(year, month + 1, 0).getDate()
  let cells = ''
  for (let i = 0; i < firstDay; i++) cells += `<div class="amc-day amc-empty"></div>`
  for (let d = 1; d <= daysInMon; d++) {
    const dow       = new Date(year, month, d).getDay()
    const dateStr   = `${year}-${String(month+1).padStart(2,'0')}-${String(d).padStart(2,'0')}`
    const isToday   = year===todayY && month===todayM && d===todayD
    const isPast    = new Date(year, month, d) < new Date(todayY, todayM, todayD)
    const isFar     = enforceAdvanceWindow && new Date(year, month, d) > maxDate
    const isSun     = dow === 0
    const isSel     = dateStr === selectedDate
    const isHoliday = !!phHolidays[dateStr]
    const holidayName   = phHolidays[dateStr] || ''
    const blockedReason = blockedMap[dateStr]
    const isBlocked = !!blockedReason
    const docAvail  = (doctor?.availableDays || []).includes(dayNames[dow])
    const daysOut   = Math.round((new Date(year, month, d) - new Date(todayY, todayM, todayD)) / 86400000)
    const tooSoon   = enforceAdvanceWindow && daysOut < minAdvanceDays()
    const isDisabled = isPast || isFar || tooSoon || isHoliday || isBlocked || isSun || !docAvail

    let cls = 'amc-day'
    if (isToday)                      cls += ' amc-today'
    else if (isBlocked && !isPast)    cls += ' amc-blocked'
    else if (isHoliday && !isPast)    cls += ' amc-holiday'
    else if (docAvail && !isDisabled) cls += ' amc-avail'
    if (isSel) cls += ' amc-selected'
    if (isDisabled) cls += ' amc-past'
    if (isFar)      cls += ' amc-far'

    const onclick = !isDisabled ? `onclick="${onSelectFn}('${dateStr}')"` : ''
    const tooltip = (tooSoon && !isPast) ? `title="${minAdvanceTooltip()}"` :
                    isBlocked ? `title="Doctor unavailable: ${String(blockedReason).replace(/"/g,'&quot;')}"` :
                    isHoliday ? `title="Clinic closed: ${holidayName}"` :
                    (isFar && !isPast) ? `title="Beyond the maximum booking window."` :
                    (!docAvail && !isPast && !isSun) ? `title="This doctor does not work on this day."` : ''
    // Same inline-label convention as the booking wizard's own calendar
    // (amcRender()) — a hover title="" alone never reaches a touch-screen
    // patient, so every reason a date is blocked gets a short label under
    // the day number too, not just a tooltip.
    // No inline "Not Available" label here (unlike Too Soon/Too Far above)
    // — on a single-doctor calendar like this one, the days that doctor
    // doesn't work are usually the MAJORITY of the month, not the
    // exception, so repeating that label on every other cell read as
    // noise rather than useful. A plain "Unavailable" legend entry (see
    // the modal's own legend, main.js) covers it instead — same reasoning
    // as the wizard's own calendar leaving amc-blocked/"Doctor
    // Unavailable" unlabeled for the analogous reason (see amcRender()'s
    // own comment on that).
    const inner = isHoliday && !isPast
      ? `${d}<span class="amc-holiday-lbl">${holidayName}</span>`
      : (tooSoon && !isPast)
        ? `${d}<span class="amc-holiday-lbl">Too Soon</span>`
        : (isFar && !isPast)
          ? `${d}<span class="amc-holiday-lbl">Too Far</span>`
          : String(d)
    cells += `<div class="${cls}" data-date="${dateStr}" ${onclick} ${tooltip}>${inner}</div>`
  }
  return cells
}

function amcRender() {
  const now      = new Date()
  const todayY   = now.getFullYear(), todayM = now.getMonth(), todayD = now.getDate()
  const { calYear: year, calMonth: month } = _wiz
  const maxDate  = maxAdvanceDate(new Date(todayY, todayM, todayD))
  const dayNames = ['Sun','Mon','Tue','Wed','Thu','Fri','Sat']
  const dayNamesFull = ['Sunday','Monday','Tuesday','Wednesday','Thursday','Friday','Saturday']

  const lbl = document.getElementById('amc-month-label')
  if (lbl) lbl.textContent = new Date(year, month, 1).toLocaleDateString('en-PH', { month:'long', year:'numeric' })
  const prev = document.getElementById('amc-prev')
  if (prev) {
    const atStart = year===todayY && month===todayM
    prev.style.opacity = atStart ? '0.3' : '1'
    // Dimming alone still left the pointer cursor on hover, reading as
    // clickable even though amcGoMonth() just silently no-ops — same fix
    // as the calendar day cells (amc-unavailable, global.css).
    prev.style.cursor = atStart ? 'not-allowed' : 'pointer'
  }
  // Same dimming treatment as Prev above, mirrored for the other end of
  // the range — dims once the view is already on the last month that
  // contains any bookable date, so there's a visible cue before a patient
  // clicks Next into an entirely dead month (amcGoMonth() also blocks the
  // click itself; this is just the "why isn't this doing anything" tell).
  const next = document.getElementById('amc-next')
  if (next) {
    const atEnd = _wiz.mode !== 'staff' && year === maxDate.getFullYear() && month === maxDate.getMonth()
    next.style.opacity = atEnd ? '0.3' : '1'
    next.style.cursor  = atEnd ? 'not-allowed' : 'pointer'
  }

  const phHolidays = getPHHolidays(year)
  const blockedMap = {}
  if (_wiz.doctorId) {
    const doc = doctors.find(d => d.id === _wiz.doctorId)
    ;(doc?.blockedDates || []).forEach(b => { blockedMap[b.date] = b.reason || 'Unavailable' })
  }
  const firstDay  = new Date(year, month, 1).getDay()
  const daysInMon = new Date(year, month + 1, 0).getDate()
  let cells = ''
  for (let i = 0; i < firstDay; i++) cells += `<div class="amc-day amc-empty"></div>`
  for (let d = 1; d <= daysInMon; d++) {
    const dow       = new Date(year, month, d).getDay()
    const dateStr   = `${year}-${String(month+1).padStart(2,'0')}-${String(d).padStart(2,'0')}`
    const isToday   = year===todayY && month===todayM && d===todayD
    const isPast    = new Date(year, month, d) < new Date(todayY, todayM, todayD)
    // Same staff/admin discretion as the min-advance (tooSoon) exception
    // below — the Maximum Advance Booking window is also just a patient
    // self-service policy, never enforced server-side for any role (there's
    // no such check in create.php at all), so there's nothing to keep this
    // frontend-only restriction consistent with by applying it to staff.
    const isFar     = _wiz.mode !== 'staff' && new Date(year, month, d) > maxDate
    const isSun     = dow === 0
    const isSel     = dateStr === _wiz.selectedDate
    const isHoliday = !!phHolidays[dateStr]
    const holidayName = phHolidays[dateStr] || ''
    const blockedReason = blockedMap[dateStr]
    const isBlocked = !!blockedReason
    const daysOut   = Math.round((new Date(year, month, d) - new Date(todayY, todayM, todayD)) / 86400000)
    // Staff/admin booking on a patient's behalf (e.g. a walk-in) retain the
    // same discretion over booking-window timing they already have on the
    // backend (see create.php's own role==='patient' gate on this exact
    // check) — same-day and other near-term dates stay selectable for them
    // regardless of the clinic's Minimum Advance Booking policy, which only
    // governs self-service patient bookings.
    const tooSoon   = _wiz.mode !== 'staff' && daysOut < minAdvanceDays()
    const isDisabled = isPast || tooSoon || isHoliday || isBlocked
    // If doctor prefilled, restrict to their available days; otherwise fall
    // back to the clinic-wide Clinic Days setting (Consultation Settings) —
    // but that's just the clinic's general policy, it doesn't guarantee any
    // individual doctor actually works this day. Without also checking that,
    // a day could show as selectable here and then dead-end at Step 2 with
    // "No doctors are available on this day" after the patient already
    // picked it. noDoctorThisDay catches that — but only on days the clinic
    // is actually open; a day the clinic is closed on (e.g. Sunday) is
    // already blank/blocked for that reason alone and shouldn't also claim
    // "no doctor" as if it were an open day nobody happens to work.
    const prefillDays = _wiz._prefillDays || []
    const hasPrefill  = prefillDays.length > 0
    const isClinicDay = (consultationSettings.clinicDays || []).includes(dayNamesFull[dow])
    const noDoctorThisDay = !hasPrefill && isClinicDay && !doctors.some(doc =>
      (doc.days || []).includes(dayNames[dow]) && !(doc.blockedDates || []).some(b => b.date === dateStr)
    )
    const docAvail    = hasPrefill ? prefillDays.includes(dayNames[dow]) : isClinicDay && !noDoctorThisDay
    // Status class and amc-selected are additive, not either/or — so that
    // selecting/deselecting a date can be done by toggling just the
    // amc-selected class on the existing cell (see amcSwapSelected), instead
    // of always having to rebuild the whole grid, which would otherwise wipe
    // out the underlying amc-today/amc-avail class a cell needs to fall back
    // to once amc-selected is removed.
    // No amc-blocked/"Doctor Unavailable" distinction here — this calendar
    // is shown before a doctor is even chosen in the common flow (Step 1),
    // so blockedMap above only ever populates on the secondary prefilled-
    // doctor path (arriving via Doctor Availability's Book Appointment).
    // A red cell with no explanation in the legend the other 99% of the
    // time was worse than just always falling back to plain "Unavailable" —
    // isBlocked still correctly keeps the date non-clickable via isDisabled
    // below either way, this only changes how it's colored/labeled.
    let cls = 'amc-day'
    if (isToday)                                     cls += ' amc-today'
    else if (isHoliday && !isPast)                   cls += ' amc-holiday'
    else if (docAvail && !isDisabled && !isFar)      cls += ' amc-avail'
    else                                              cls += ' amc-unavailable'
    if (isSel) cls += ' amc-selected'
    if (isDisabled || isSun || (hasPrefill && !docAvail)) cls += ' amc-past'
    if (isFar)                                            cls += ' amc-far'
    if (noDoctorThisDay && !isPast && !isHoliday)         cls += ' amc-past'
    const clickable = !isDisabled && !isFar && docAvail && !isSun
    const onclick   = clickable ? `onclick="window.amcSelectDate('${dateStr}','${dayNames[dow]}')"` : ''
    const tooltip   = (tooSoon && !isPast) ? `title="${minAdvanceTooltip()}"` :
                      isBlocked ? `title="Doctor unavailable: ${String(blockedReason).replace(/"/g,'&quot;')}"` :
                      isHoliday ? `title="Clinic closed: ${holidayName}"` :
                      (noDoctorThisDay && !isPast) ? `title="No doctors are available on this day."` :
                      (isFar && !isPast) ? `title="Beyond the maximum booking window."` : ''
    // Every other reason a date is blocked already gets its own small label
    // under the day number (holiday name, No Doctor, Booked below) — these
    // two were the only ones still relying on a hover-only title="", which
    // never reaches a touch-screen patient at all.
    const inner     = isHoliday && !isPast
      ? `${d}<span class="amc-holiday-lbl">${holidayName}</span>`
      : (noDoctorThisDay && !isPast)
        ? `${d}<span class="amc-nodoc-lbl">No Doctor</span>`
        : (tooSoon && !isPast)
          ? `${d}<span class="amc-nodoc-lbl">Too Soon</span>`
          : (isFar && !isPast)
            ? `${d}<span class="amc-nodoc-lbl">Too Far</span>`
            : String(d)
    cells += `<div class="${cls}" data-date="${dateStr}" ${onclick} ${tooltip}>${inner}</div>`
  }
  const grid = document.getElementById('amc-cells')
  if (grid) grid.innerHTML = cells
}

// Toggles the amc-selected class directly on the existing cell elements
// (removing it from whichever cell had it, adding it to the newly-picked
// date) instead of rebuilding the grid — a full rebuild replaces the DOM
// nodes outright, so the new cell would arrive with amc-selected already
// baked in and the background-color transition would never get a "from"
// state to animate. Returns false if the target date isn't in the current
// view (e.g. it's a fresh render) so the caller can fall back to a full render.
function amcSwapSelected(gridId, dateStr) {
  const grid = document.getElementById(gridId)
  if (!grid) return false
  const prev = grid.querySelector('.amc-day.amc-selected')
  if (prev) prev.classList.remove('amc-selected')
  const next = grid.querySelector(`.amc-day[data-date="${dateStr}"]`)
  if (!next) return false
  next.classList.add('amc-selected')
  return true
}

function amcSelectDate(dateStr, dayAbb) {
  _wiz.selectedDate = dateStr
  const dt = new Date(dateStr + 'T00:00:00')
  _wiz.selectedDateLabel = dt.toLocaleDateString('en-PH', { weekday:'long', month:'long', day:'numeric', year:'numeric' })
  _wiz.selectedDateShort = dt.toLocaleDateString('en-PH', { month:'long', day:'numeric' })

  const hasPrefillDoctor = !!_wiz.doctorId

  if (!hasPrefillDoctor) {
    // Normal flow: reset downstream doctor/time
    _wiz.doctorId = ''; _wiz.doctorName = ''; _wiz.doctorSpec = ''
    _wiz.time = ''
  } else {
    // Doctor pre-filled: only reset time
    _wiz.time = ''
  }
  // Swap the highlighted cell directly (see amcSwapSelected) so the fade
  // transition plays; only fall back to a full rebuild if the date somehow
  // isn't in the currently-rendered month.
  if (!amcSwapSelected('amc-cells', dateStr)) amcRender()

  // Update summary
  const sd = document.getElementById('sum-date')
  if (sd) { sd.textContent = _wiz.selectedDateLabel; sd.classList.remove('empty') }
  // "Any available optometrist" already has its own permanent summary label
  // (see wizChooseDoctorPref()) — there's no per-date doctor selection to
  // reset here, so leave it alone instead of stomping it back to "Not
  // selected yet".
  if (!hasPrefillDoctor && !_wiz.anyDoctor) {
    const sdoc = document.getElementById('sum-doctor')
    if (sdoc) { sdoc.textContent = 'Not selected yet'; sdoc.classList.add('empty') }
  }
  const st2 = document.getElementById('sum-time')
  if (st2) { st2.textContent = 'Not selected yet'; st2.classList.add('empty') }

  // Enable continue button
  const btn = document.getElementById('wiz-next-0')
  if (btn) btn.disabled = false

  // If doctor was pre-filled, skip Step 2 and go straight to Step 3
  if (hasPrefillDoctor) {
    setTimeout(() => {
      _wiz.step = 2
      wizShowStep(2, 1)
      wizBuildTimeSlots()   // async — fire-and-forget is fine here
    }, 120)
  }
}
window.amcSelectDate = amcSelectDate

// ── Step 2: Doctor cards ──────────────────────────────────────────
async function wizBuildDoctorCards() {
  const requestedDate = _wiz.selectedDate
  const dt       = new Date(_wiz.selectedDate + 'T00:00:00')
  const dayShort = ['Sun','Mon','Tue','Wed','Thu','Fri','Sat'][dt.getDay()]
  const availDocs = doctors.filter(d => (d.days || []).includes(dayShort))
  const lbl = document.getElementById('wiz-date-lbl2')
  if (lbl) lbl.textContent = _wiz.selectedDateLabel

  const container = document.getElementById('wiz-doctor-cards')
  if (!container) return

  if (!availDocs.length) {
    container.innerHTML = `<div style="display:flex;align-items:center;justify-content:center;padding:40px 24px;text-align:center">
      <div style="font-size:.82rem;color:#9CA3AF">No doctors are available on this day. Please go back and select a different date.</div>
    </div>`
    return
  }

  container.innerHTML = `<div style="color:#9CA3AF;font-size:.82rem;padding:8px 0">Loading doctors…</div>`

  // A doctor stops being bookable on this date once they hit the clinic's
  // max-appointments-per-doctor-per-day cap (Consultation Settings) — shown
  // as a disabled "Fully booked" card instead of just disappearing, so it's
  // clear why rather than the doctor silently not being there.
  //
  // This can't be counted from the client-side `appointments` array: for a
  // patient, api/appointments/index.php only ever returns THEIR OWN
  // appointments (by design/privacy), so it has no visibility into how many
  // other patients a doctor is already booked with that day — the count
  // would almost always read as 0-1 regardless of the doctor's real load.
  // A dedicated aggregate-only endpoint (counts, no patient details) is
  // needed instead.
  const maxPerDay = consultationSettings.maxApptsPerDoctorPerDay || 12
  let apptCounts = {}
  try {
    const r = await fetch(`api/appointments/daily-counts.php?date=${encodeURIComponent(_wiz.selectedDate)}`)
    const d = await r.json()
    if (d.success) apptCounts = d.counts || {}
  } catch (_) { /* fail open — treat as 0 booked rather than block booking entirely */ }
  // A stale click (user already navigated elsewhere by the time this resolves)
  // shouldn't paint into a step that's no longer showing.
  if (!document.getElementById('wiz-doctor-cards') || _wiz.selectedDate !== requestedDate) return
  const apptCountFor = docId => apptCounts[docId] || 0
  // Doctor-specific blocked dates (vacation/leave etc, set on Doctor Schedule)
  // weren't being checked here — a doctor's weekly `days` alone doesn't rule
  // out a one-off blocked date, so without this a blocked doctor still showed
  // as a normal, clickable card on that exact date.
  const blockedReasonFor = docId => {
    const entry = (doctors.find(x => x.id === docId)?.blockedDates || []).find(b => b.date === _wiz.selectedDate)
    // A blocked entry with no reason text (NULL in the DB) still means
    // blocked — don't let an empty-string reason fall through `||` and get
    // mistaken for "no blocked entry at all".
    return entry ? (entry.reason || 'Unavailable') : null
  }

  const getInitials = name => name.replace('Dr. ','').split(' ').map(n=>n[0]).join('').slice(0,2).toUpperCase()
  const docAvatar = d => d.photoUrl
    ? `<div class="doc-card-avatar" style="overflow:hidden;padding:0"><img src="${d.photoUrl}" alt="${d.name}" style="width:100%;height:100%;object-fit:cover;object-position:top;border-radius:50%;display:block" onerror="${window.avatarFallbackAttr(d.name)}"></div>`
    : `<div class="doc-card-avatar">${getInitials(d.name)}</div>`

  container.innerHTML = availDocs.map(d => {
    const isFull = apptCountFor(d.id) >= maxPerDay
    const blockedReason = blockedReasonFor(d.id)
    // Same pill language as elsewhere in the wizard (time-slot legend's
    // "full" swatch, apptSubBadges' Confirmed/Rescheduled tags) instead of
    // bare colored text — and the two reasons get different colors on
    // purpose: red for a hard block (the doctor isn't working that day at
    // all), orange for merely full (same "waitlist-able, not truly
    // unbookable" meaning as .time-slot.full) so the two read as distinct
    // severities at a glance, not identical red warnings.
    if (blockedReason) return `
      <div class="doc-card doc-card-disabled" title="Doctor unavailable: ${blockedReason.replace(/"/g,'&quot;')}">
        ${docAvatar(d)}
        <div style="flex:1;min-width:0">
          <div style="font-size:.9rem;font-weight:700;color:#9CA3AF">${d.name}</div>
          <div style="font-size:.78rem;color:#9CA3AF;margin-top:2px">${d.specialization}</div>
          <span style="display:inline-flex;align-items:center;gap:4px;font-size:.7rem;font-weight:600;background:#FEF2F2;color:#DC2626;border-radius:999px;padding:2px 9px;margin-top:5px;width:fit-content">${icon('x-circle','icon-xs')} Unavailable on this date</span>
        </div>
      </div>`
    if (isFull) return `
      <div class="doc-card doc-card-disabled" title="This doctor is fully booked on the selected date.">
        ${docAvatar(d)}
        <div style="flex:1;min-width:0">
          <div style="font-size:.9rem;font-weight:700;color:#9CA3AF">${d.name}</div>
          <div style="font-size:.78rem;color:#9CA3AF;margin-top:2px">${d.specialization}</div>
          <span style="display:inline-flex;align-items:center;gap:4px;font-size:.7rem;font-weight:600;background:#FFF7ED;color:#C2410C;border-radius:999px;padding:2px 9px;margin-top:5px;width:fit-content">${icon('clock','icon-xs')} Fully booked on this date</span>
        </div>
      </div>`
    return `
    <button class="doc-card${d.id === _wiz.doctorId ? ' selected' : ''}"
            onclick="window.wizSelectDoctor('${d.id}','${d.name}','${d.specialization}',this)">
      ${docAvatar(d)}
      <div style="flex:1;min-width:0">
        <div style="font-size:.9rem;font-weight:700;color:#1C1C1C">${d.name}</div>
        <div style="font-size:.78rem;color:#6B7280;margin-top:2px">${d.specialization}</div>
        ${typeof window.dayPills==='function' ? window.dayPills(d.days||d.availableDays||[],'sm') : ''}
      </div>
      ${d.id === _wiz.doctorId ? `<span style="color:#E8760A">${icon('check-circle','icon-sm')}</span>` : ''}
    </button>`
  }).join('')

  const btn = document.getElementById('wiz-next-1')
  if (btn) btn.disabled = !_wiz.doctorId

  // If doctor was pre-filled, also update summary sidebar
  if (_wiz.doctorId) {
    const sd = document.getElementById('sum-doctor')
    if (sd) { sd.textContent = _wiz.doctorName; sd.classList.remove('empty') }
  }
}

function wizSelectDoctor(id, name, spec, btnEl) {
  _wiz.doctorId = id; _wiz.doctorName = name; _wiz.doctorSpec = spec
  _wiz.time = '' // reset time when doctor changes
  document.querySelectorAll('.doc-card').forEach(b => {
    b.classList.remove('selected')
    const chk = b.querySelector('span[style*="E8760A"]')
    if (chk) chk.remove()
  })
  btnEl.classList.add('selected')
  btnEl.insertAdjacentHTML('beforeend', `<span style="color:#E8760A">${icon('check-circle','icon-sm')}</span>`)
  // Update hidden input and summary
  const inp = document.getElementById('appt-doctor')
  if (inp) inp.value = id + '|' + name
  const sd = document.getElementById('sum-doctor')
  if (sd) { sd.textContent = name; sd.classList.remove('empty') }
  const st2 = document.getElementById('sum-time')
  if (st2) { st2.textContent = 'Not selected yet'; st2.classList.add('empty') }
  const btn = document.getElementById('wiz-next-1')
  if (btn) btn.disabled = false
}
window.wizSelectDoctor = wizSelectDoctor

// ── Step 3: Time slots ────────────────────────────────────────────
// A slot conflicts if it overlaps an existing booking (each booking carries
// its own service duration) plus a 15-min rest buffer between appointments.
function _slotConflicts(slotTime, slotDur) {
  const slotMins = _clockToMinutes(slotTime)
  if (slotMins == null) return false
  return _takenSlotTimes.some(bt => {
    const btMins = _clockToMinutes(bt.time)
    const btDur  = bt.duration || _takenSlotDur
    if (btMins == null) return false
    return slotMins < btMins + btDur && slotMins + slotDur > btMins
  })
}

// Same overlap check as _slotConflicts(), narrowed to whether the
// CURRENT patient (not just anyone) is the one holding a conflicting
// booking with this doctor — taken.php now carries each taken slot's
// patientId for exactly this. Only meaningful for a patient looking at
// their own booking wizard (state.user.id is a patient's own record id
// there); harmless no-op otherwise since it'll just never match.
function _slotConflictsMine(slotTime, slotDur) {
  const slotMins = _clockToMinutes(slotTime)
  if (slotMins == null) return false
  return _takenSlotTimes.some(bt => {
    if (bt.patientId !== state.user?.id) return false
    const btMins = _clockToMinutes(bt.time)
    const btDur  = bt.duration || _takenSlotDur
    if (btMins == null) return false
    return slotMins < btMins + btDur && slotMins + slotDur > btMins
  })
}

async function wizBuildTimeSlots() {
  if (_wiz.anyDoctor) return wizBuildTimeSlotsAnyDoctor()

  const el = document.getElementById('appt-time-slots')
  if (el) el.innerHTML = '<div style="color:#9CA3AF;font-size:.82rem;padding:8px 0">Loading available slots…</div>'

  // Fetch real booked times for this doctor + date
  try {
    const r = await fetch(`api/appointments/taken.php?doctorId=${encodeURIComponent(_wiz.doctorId)}&date=${encodeURIComponent(_wiz.selectedDate)}`)
    const d = await r.json()
    _takenSlotTimes = d.taken        || []
    _takenSlotDur   = d.defaultDuration || _durationMinutes(consultationSettings.defaultDuration)
  } catch (_) {
    _takenSlotTimes = []
    _takenSlotDur   = _durationMinutes(consultationSettings.defaultDuration)
  }

  const stepMin = _durationMinutes(consultationSettings.defaultDuration)
  const _toMin = t => {
    const [time, period] = t.split(' ')
    let [h, m] = time.split(':').map(Number)
    if (period === 'PM' && h !== 12) h += 12
    if (period === 'AM' && h === 12) h = 0
    return h * 60 + m
  }
  // Narrow the clinic-wide session window to this specific doctor's own
  // configured hours (see _clampToDoctorHours) — a doctor picked here has
  // already been committed to (wizSelectDoctor), so unlike the multi-
  // doctor "any available optometrist" flow there's exactly one doctor's
  // hours to clamp against.
  const _wizDoc = doctors.find(dd => dd.id === _wiz.doctorId)
  let morning, afternoon
  if (consultationSettings.lunchBreak) {
    const [mStart, mEnd] = _clampToDoctorHours(consultationSettings.morningStart,   consultationSettings.morningEnd,   _wizDoc?.hours)
    const [aStart, aEnd] = _clampToDoctorHours(consultationSettings.afternoonStart, consultationSettings.afternoonEnd, _wizDoc?.hours)
    morning   = _buildSessionSlots(mStart, mEnd, stepMin)
    afternoon = _buildSessionSlots(aStart, aEnd, stepMin)
  } else {
    const [fStart, fEnd] = _clampToDoctorHours(consultationSettings.morningStart, consultationSettings.afternoonEnd, _wizDoc?.hours)
    const allSlots = _buildSessionSlots(fStart, fEnd, stepMin)
    morning   = allSlots.filter(t => _toMin(t) < 720)
    afternoon = allSlots.filter(t => _toMin(t) >= 720)
  }

  const today   = localDateStr()
  const isToday = _wiz.selectedDate === today
  const nowMin  = isToday ? new Date().getHours() * 60 + new Date().getMinutes() : -1

  const parseSlotMin = t => {
    const [time, period] = t.split(' ')
    let [h, m] = time.split(':').map(Number)
    if (period === 'PM' && h !== 12) h += 12
    if (period === 'AM' && h === 12) h = 0
    return h * 60 + m
  }

  // No more per-service duration — every appointment (any type) runs on
  // the one clinic-wide interval, already reflected in _takenSlotDur.
  const newSlotDur = _takenSlotDur
  const slotBtn = t => {
    // A "full" slot (booked by someone else, or held by another patient's
    // waitlist offer — both come back from taken.php) is still selectable:
    // the patient can pick it and, if they try to submit, create.php offers
    // them the waitlist for it. Only truly past times are unselectable.
    // A slot that's full specifically because THIS patient already has
    // their own appointment there is different again — joining a waitlist
    // for a slot they already hold doesn't make sense, so that one's
    // unselectable too, with its own "Booked by you" treatment instead of
    // the generic waitlist-eligible one.
    const isFull   = _slotConflicts(t, newSlotDur)
    const isMine   = state.role === 'patient' && isFull && _slotConflictsMine(t, newSlotDur)
    const isPast   = isToday && parseSlotMin(t) <= nowMin
    const isSel    = t === _wiz.time && !isPast
    // Built additively (not a chained ternary) so a slot that's both the
    // current pick AND fully-booked keeps BOTH classes on every rebuild —
    // matching wizSelectTime()'s click-time behavior, which never strips
    // '.full' when adding '.selected'. A chained ternary would only ever
    // apply one class, silently dropping '.full' for the selected slot
    // every time this grid re-renders (e.g. navigating back to this step).
    let cls = 'time-slot'
    if (isPast) cls += ' taken'
    else if (isMine) cls += ' mine'
    else {
      if (isFull) cls += ' full'
      if (isSel)  cls += ' selected'
    }
    const tip      = isPast ? 'This time slot has already passed.'
                   : isMine ? 'You already have an appointment with this doctor at this time.'
                   : isFull ? 'This slot is fully booked. You can still select it to join the waitlist.'
                   : ''
    const disabled = (isPast || isMine) ? `disabled title="${tip}"` : (tip ? `title="${tip}"` : '')
    return `<button class="${cls}" ${disabled} onclick="window.wizSelectTime('${t}',this)">${t}</button>`
  }

  if (el) el.innerHTML = `
    <div style="margin-bottom:14px">
      <div style="font-size:.7rem;text-transform:uppercase;letter-spacing:.06em;color:#9CA3AF;font-weight:700;margin-bottom:8px">${afternoon.length ? 'Morning' : 'Available Times'}</div>
      <div style="display:flex;flex-wrap:wrap;gap:8px">${morning.map(slotBtn).join('')}</div>
    </div>
    ${afternoon.length ? `
    <div>
      <div style="font-size:.7rem;text-transform:uppercase;letter-spacing:.06em;color:#9CA3AF;font-weight:700;margin-bottom:8px">Afternoon</div>
      <div style="display:flex;flex-wrap:wrap;gap:8px">${afternoon.map(slotBtn).join('')}</div>
    </div>` : ''}`

  // If previously selected time is now past, clear it
  if (_wiz.time && isToday && parseSlotMin(_wiz.time) <= nowMin) {
    _wiz.time = null
    const inp = document.getElementById('appt-time')
    if (inp) inp.value = ''
    const st = document.getElementById('sum-time')
    if (st) { st.textContent = '—'; st.classList.add('empty') }
  }

  const lbl2 = document.getElementById('wiz-doc-lbl3')
  const lbl3 = document.getElementById('wiz-date-lbl3')
  if (lbl2) lbl2.textContent = _wiz.doctorName
  if (lbl3) lbl3.textContent = _wiz.selectedDateShort
  const btn = document.getElementById('wiz-next-2')
  if (btn) btn.disabled = !_wiz.time
  _wizSetFullLegend()
}

// A "full" slot means the exact same thing in both modes now — waitlist-
// able, not truly unbookable — single-doctor (nobody free but the one
// doctor) and any-doctor (nobody eligible free, see
// wizBuildTimeSlotsAnyDoctor()) alike. Reset here rather than baked
// statically into pages.js since the same wizard DOM can flip between modes
// via wizBackToPref(), which could otherwise leave a stale legend behind.
function _wizSetFullLegend() {
  const txt    = document.getElementById('tsl-full-txt')
  const swatch = document.getElementById('tsl-full-swatch')
  if (txt)    txt.textContent = 'Fully booked (waitlist available)'
  if (swatch) swatch.style.cssText = 'background:#FFF7ED;border:1.5px solid #FDBA74'
}

// ── Step 3 (any-doctor mode): time slots unioned across every doctor who
// could plausibly work this date ─────────────────────────────────────
// A slot is bookable if ANY eligible doctor is free at it — the clinic
// assigns the actual doctor afterward (see appointments/update.php's
// assign_doctor action). Unlike single-doctor mode, a slot with no free
// doctor is disabled outright rather than offered as a waitlist pick —
// the waitlist system is keyed to one specific doctor+date+time, which
// doesn't exist yet for an unassigned request.
async function wizBuildTimeSlotsAnyDoctor() {
  const el = document.getElementById('appt-time-slots')
  if (el) el.innerHTML = '<div style="color:#9CA3AF;font-size:.82rem;padding:8px 0">Loading available slots…</div>'

  const requestedDate = _wiz.selectedDate
  const dt       = new Date(_wiz.selectedDate + 'T00:00:00')
  const dayShort = ['Sun','Mon','Tue','Wed','Thu','Fri','Sat'][dt.getDay()]

  // Same eligibility rule as wizBuildDoctorCards()'s single-doctor path —
  // scheduled to work this weekday, not individually blocked this date.
  const eligibleDocs = doctors.filter(d => {
    if (!(d.days || []).includes(dayShort)) return false
    return !(d.blockedDates || []).some(b => b.date === _wiz.selectedDate)
  })

  if (!eligibleDocs.length) {
    if (el) el.innerHTML = `<div style="padding:24px;text-align:center;font-size:.82rem;color:#9CA3AF">No doctors are available on this day. Please go back and select a different date.</div>`
    return
  }

  const maxPerDay = consultationSettings.maxApptsPerDoctorPerDay || 12
  let apptCounts = {}
  try {
    const r = await fetch(`api/appointments/daily-counts.php?date=${encodeURIComponent(_wiz.selectedDate)}`)
    const d = await r.json()
    if (d.success) apptCounts = d.counts || {}
  } catch (_) { /* fail open — treat as 0 booked rather than block booking entirely */ }
  if (!document.getElementById('appt-time-slots') || _wiz.selectedDate !== requestedDate) return

  const freeDocs = eligibleDocs.filter(d => (apptCounts[d.id] || 0) < maxPerDay)
  if (!freeDocs.length) {
    if (el) el.innerHTML = `<div style="padding:24px;text-align:center;font-size:.82rem;color:#9CA3AF">All doctors are fully booked on this date. Please choose a different date.</div>`
    return
  }

  let byDoctor = {}
  let defaultDuration = _durationMinutes(consultationSettings.defaultDuration)
  try {
    const ids = freeDocs.map(d => d.id).join(',')
    const r = await fetch(`api/appointments/taken.php?doctorIds=${encodeURIComponent(ids)}&date=${encodeURIComponent(_wiz.selectedDate)}`)
    const d = await r.json()
    byDoctor = d.byDoctor || {}
    defaultDuration = d.defaultDuration || defaultDuration
  } catch (_) { /* fail open — treat as nobody booked yet */ }
  if (!document.getElementById('appt-time-slots') || _wiz.selectedDate !== requestedDate) return

  const stepMin = _durationMinutes(consultationSettings.defaultDuration)
  const _toMin = t => {
    const [time, period] = t.split(' ')
    let [h, m] = time.split(':').map(Number)
    if (period === 'PM' && h !== 12) h += 12
    if (period === 'AM' && h === 12) h = 0
    return h * 60 + m
  }
  let morning, afternoon
  if (consultationSettings.lunchBreak) {
    morning   = _buildSessionSlots(consultationSettings.morningStart,   consultationSettings.morningEnd,   stepMin)
    afternoon = _buildSessionSlots(consultationSettings.afternoonStart, consultationSettings.afternoonEnd, stepMin)
  } else {
    const allSlots = _buildSessionSlots(consultationSettings.morningStart, consultationSettings.afternoonEnd, stepMin)
    morning   = allSlots.filter(t => _toMin(t) < 720)
    afternoon = allSlots.filter(t => _toMin(t) >= 720)
  }

  const today   = localDateStr()
  const isToday = _wiz.selectedDate === today
  const nowMin  = isToday ? new Date().getHours() * 60 + new Date().getMinutes() : -1
  const parseSlotMin = _toMin

  // No more per-service duration — every appointment (any type) runs on
  // the one clinic-wide interval.
  const newSlotDur = defaultDuration
  const slotHasFreeDoctor = t => {
    const slotMins = _clockToMinutes(t)
    if (slotMins == null) return false
    return freeDocs.some(d => {
      const taken = byDoctor[d.id] || []
      return !taken.some(bt => {
        const btMins = _clockToMinutes(bt.time)
        const btDur  = bt.duration || defaultDuration
        if (btMins == null) return false
        return slotMins < btMins + btDur && slotMins + newSlotDur > btMins
      })
    })
  }

  // A "full" slot (nobody eligible is free at it) is still selectable —
  // same as the single-doctor path (_slotConflicts/wizBuildTimeSlots): the
  // patient can pick it and, if they submit, create.php offers them the
  // waitlist for it (tied to whichever under-cap doctor is picked server-
  // side — see create.php's anyDoctor branch). Only truly past times are
  // unselectable.
  const slotBtn = t => {
    const isPast = isToday && parseSlotMin(t) <= nowMin
    const isFull = !isPast && !slotHasFreeDoctor(t)
    const isSel  = t === _wiz.time && !isPast
    let cls = 'time-slot'
    if (isPast) cls += ' taken'
    else {
      if (isFull) cls += ' full'
      if (isSel)  cls += ' selected'
    }
    const tip      = isPast ? 'This time slot has already passed.'
                   : isFull ? 'No doctor is free at this time. You can still select it to join the waitlist.'
                   : ''
    const disabled = isPast ? `disabled title="${tip}"` : (tip ? `title="${tip}"` : '')
    return `<button class="${cls}" ${disabled} onclick="window.wizSelectTime('${t}',this)">${t}</button>`
  }

  if (el) el.innerHTML = `
    <div style="margin-bottom:14px">
      <div style="font-size:.7rem;text-transform:uppercase;letter-spacing:.06em;color:#9CA3AF;font-weight:700;margin-bottom:8px">${afternoon.length ? 'Morning' : 'Available Times'}</div>
      <div style="display:flex;flex-wrap:wrap;gap:8px">${morning.map(slotBtn).join('')}</div>
    </div>
    ${afternoon.length ? `
    <div>
      <div style="font-size:.7rem;text-transform:uppercase;letter-spacing:.06em;color:#9CA3AF;font-weight:700;margin-bottom:8px">Afternoon</div>
      <div style="display:flex;flex-wrap:wrap;gap:8px">${afternoon.map(slotBtn).join('')}</div>
    </div>` : ''}`

  // Only clear a stale selection once it's actually past — same as the
  // single-doctor path, a "full" pick stays selected since submitting it
  // is exactly how the patient opts into the waitlist for it.
  if (_wiz.time && isToday && parseSlotMin(_wiz.time) <= nowMin) {
    _wiz.time = null
    const inp = document.getElementById('appt-time')
    if (inp) inp.value = ''
    const st = document.getElementById('sum-time')
    if (st) { st.textContent = '—'; st.classList.add('empty') }
  }

  const lbl2 = document.getElementById('wiz-doc-lbl3')
  const lbl3 = document.getElementById('wiz-date-lbl3')
  if (lbl2) lbl2.textContent = 'any available doctor'
  if (lbl3) lbl3.textContent = _wiz.selectedDateShort
  const btn = document.getElementById('wiz-next-2')
  if (btn) btn.disabled = !_wiz.time
  _wizSetFullLegend()
}

function wizSelectTime(time, btnEl) {
  _wiz.time = time
  // Only clear 'selected' from other buttons — 'full' reflects the actual
  // taken/held state from the server and should stay put regardless of
  // click state, so a selected-but-full slot keeps looking distinct (see
  // .time-slot.selected.full) instead of looking identical to a normal pick.
  document.querySelectorAll('.time-slot').forEach(b => b.classList.remove('selected'))
  btnEl.classList.add('selected')
  const inp = document.getElementById('appt-time')
  if (inp) inp.value = time
  const st = document.getElementById('sum-time')
  if (st) { st.textContent = time; st.classList.remove('empty') }
  const btn = document.getElementById('wiz-next-2')
  if (btn) btn.disabled = false
}
window.wizSelectTime = wizSelectTime

// ── Step 4: Type selection ────────────────────────────────────────
function selectApptType(type, btn) {
  document.querySelectorAll('.appt-type-card').forEach(b => b.classList.remove('selected'))
  btn.classList.add('selected')
  _wiz.type = type
  const inp = document.getElementById('appt-type')
  if (inp) inp.value = type
  // No more "(~X min)" — every type shares the same clinic-wide duration
  // now, so appending it after every single type name added no
  // differentiating information.
  const st = document.getElementById('sum-type')
  if (st) { st.textContent = type; st.classList.remove('empty') }
  const btnNext = document.getElementById('wiz-next-3')
  if (btnNext) btnNext.disabled = false
}
window.selectApptType = selectApptType

// ── Step 5: Populate review ───────────────────────────────────────
function wizPopulateReview() {
  _wiz.type  = document.getElementById('appt-type')?.value  || _wiz.type
  _wiz.notes = document.getElementById('appt-notes')?.value || ''
  const set = (id, val) => { const el = document.getElementById(id); if (el) el.textContent = val }
  set('rev-date',   _wiz.selectedDateLabel)
  set('rev-doctor', _wiz.anyDoctor
    ? 'Any available optometrist (assigned by clinic staff)'
    : _wiz.doctorName + (_wiz.doctorSpec ? ' — ' + _wiz.doctorSpec : ''))
  const revDocEdit = document.getElementById('rev-doctor-edit')
  if (revDocEdit) revDocEdit.style.display = _wiz.anyDoctor ? 'none' : ''
  set('rev-time',   _wiz.time)
  set('rev-type',   _wiz.type)
  const notesEl = document.getElementById('rev-notes')
  if (notesEl) {
    notesEl.textContent   = _wiz.notes || 'No notes provided'
    notesEl.style.color   = _wiz.notes ? '#1C1C1C' : '#9CA3AF'
    notesEl.style.fontStyle = _wiz.notes ? 'normal' : 'italic'
    notesEl.style.fontWeight = _wiz.notes ? '600' : '400'
  }
  // Require a fresh re-agreement each time the review step is (re)populated.
  // This guarantees the checkbox starts locked and unchecked whether this
  // is the first visit to this step or a return trip via "Edit" on an
  // earlier step, matching the same read-it-first pattern used on the
  // registration page's Terms & Conditions checkbox.
  const agreeEl = document.getElementById('appt-terms-agree')
  if (agreeEl) { agreeEl.checked = false; agreeEl.disabled = true }
  const hintEl = document.getElementById('appt-terms-hint')
  if (hintEl) hintEl.style.display = ''
  syncApptSubmitState()
}

// Live-updates the Booking Summary sidebar's Notes row as the patient/staff
// types on Step 4 — matches how Date/Doctor/Time/Type already update the
// moment they're picked, instead of Notes only ever showing up once the
// Review step is reached.
function syncSumNotes() {
  const val = document.getElementById('appt-notes')?.value || ''
  const el = document.getElementById('sum-notes')
  if (!el) return
  if (val) {
    el.textContent = val
    el.classList.remove('empty')
    el.style.fontStyle = 'normal'
  } else {
    el.textContent = 'No notes added'
    el.classList.add('empty')
    el.style.fontStyle = 'italic'
  }
}
window.syncSumNotes = syncSumNotes

// Gate the final submit button — patient mode requires the policy checkbox
// (called on its onchange and whenever the review step is repopulated);
// staff mode has no checkbox at all, so it's just always enabled once the
// review step is reachable (which already requires date/doctor/time set).
function syncApptSubmitState() {
  const btn = document.getElementById('appt-submit-btn')
  if (!btn) return
  if (_wiz.mode === 'staff') { btn.disabled = false; return }
  const agree = document.getElementById('appt-terms-agree')
  btn.disabled = !(agree && agree.checked)
}
window.syncApptSubmitState = syncApptSubmitState

// ── Appointment Policy modal ───────────────────────────────────────
// Same pattern as the registration page's Terms & Conditions modal: the
// patient must scroll to the bottom before the checkbox unlocks, so
// agreement isn't just a reflex click.
// Markdown-source default (mirrors api/helpers.php's defaultApptPolicyMd())
// — served only until _syncClinicSettings() resolves post-login. Parsed by
// renderTermsMarkdown() (db.js). Section 4 uses "> " so it keeps rendering
// as the original amber callout box instead of a plain paragraph. A
// function (not a plain const) so it always states the *current*
// consultationSettings.reminderTime/confirmDeadlineTime — reads live off
// that object, so once _syncClinicSettings() resolves (or an admin changes
// the setting mid-session) this reflects the real value, not a stale
// hardcoded "noon"/"9:00 PM".
function defaultApptPolicyMd() {
  const reminderTime        = consultationSettings.reminderTime        || '12:00 PM'
  const confirmDeadlineTime = consultationSettings.confirmDeadlineTime || '9:00 PM'
  return `## 1. Appointment Requests
Appointment requests submitted through this system are subject to confirmation by clinic staff based on doctor availability. The clinic reserves the right to reschedule or decline requests when necessary.

## 2. Cancellations
If you can no longer make it to your appointment, please cancel as early as possible. This keeps the slot open for someone else who may need it.

## 3. Repeated No-Shows
If you miss multiple approved appointments without cancelling, online booking may be temporarily restricted for your account. In that case, please contact the clinic directly by phone or in person to schedule your next visit.

## 4. Appointment Reminders and Confirmation
> For approved appointments, we send a reminder at ${reminderTime} the day before your visit. Please confirm you'll be attending by ${confirmDeadlineTime} that same day. If we don't hear from you by then, the appointment is automatically cancelled so the slot can be offered to another patient.

## 5. Waitlist
If your preferred slot is fully booked, you can join the waitlist for it. If that slot opens up, you'll be notified with a limited time to claim it. If you don't respond in time, or choose to decline, the slot is offered to the next patient in line. You can only be on one waitlist at a time.
`
}

function openAppointmentPolicyModal() {
  showModal(`
    <div class="modal-header">
      <div class="modal-title">${icon('file-text','icon-sm')} Appointment Policy</div>
      <button class="modal-close" onclick="window.closeModal()">&times;</button>
    </div>
    <div class="modal-body">
      <div class="terms-body" id="appt-terms-scroll-body" onscroll="window._checkApptTermsScroll()">
        ${renderTermsMarkdown(clinicInfo.appointmentPolicyContent || defaultApptPolicyMd())}
      </div>
    </div>
    <div class="modal-footer">
      <span class="terms-scroll-hint" id="appt-terms-scroll-hint">
        <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2" width="14" height="14"><line x1="12" y1="5" x2="12" y2="19"/><polyline points="19 12 12 19 5 12"/></svg>
        Scroll to the bottom to continue
      </span>
      <button class="btn-secondary" onclick="window.closeModal()">Cancel</button>
      <button class="btn-primary" id="appt-terms-agree-btn" disabled onclick="window.acceptApptTerms()">I Agree &amp; Continue</button>
    </div>`, 'modal-lg')

  // If the content already fits without scrolling, don't trap the patient
  // behind an unreachable scroll requirement.
  setTimeout(() => window._checkApptTermsScroll(), 50)
}
window.openAppointmentPolicyModal = openAppointmentPolicyModal

function _checkApptTermsScroll() {
  const body = document.getElementById('appt-terms-scroll-body')
  const btn  = document.getElementById('appt-terms-agree-btn')
  if (!body || !btn) return
  const reachedBottom = body.scrollTop + body.clientHeight >= body.scrollHeight - 24
  if (reachedBottom && btn.disabled) {
    btn.disabled = false
    const hint = document.getElementById('appt-terms-scroll-hint')
    if (hint) hint.style.display = 'none'
  }
}
window._checkApptTermsScroll = _checkApptTermsScroll

function acceptApptTerms() {
  const btn = document.getElementById('appt-terms-agree-btn')
  if (btn && btn.disabled) return

  const cb = document.getElementById('appt-terms-agree')
  if (cb) { cb.disabled = false; cb.checked = true }
  const hint = document.getElementById('appt-terms-hint')
  if (hint) hint.style.display = 'none'
  syncApptSubmitState()
  closeModal()
}
window.acceptApptTerms = acceptApptTerms

// ── Submit ────────────────────────────────────────────────────────
async function requestAppointment() {
  if (!_wiz.selectedDate || (!_wiz.anyDoctor && !_wiz.doctorId) || !_wiz.time || !_wiz.type) {
    toast('Please complete all required fields.', 'error'); return
  }
  if (!document.getElementById('appt-terms-agree')?.checked) {
    toast('Please agree to the appointment policy before submitting.', 'error'); return
  }
  const btn = document.getElementById('appt-submit-btn')
  if (btn) { btn.disabled = true; btn.innerHTML = icon('clock','icon-sm') + ' Submitting…' }

  const user = state.user
  const docLabel = _wiz.anyDoctor ? 'Any available optometrist' : _wiz.doctorName
  try {
    const r = await fetch('api/appointments/create.php', {
      method:  'POST',
      headers: { 'Content-Type': 'application/json' },
      body:    JSON.stringify({
        patientId:   user.id,
        patientName: user.name,
        doctorId:    _wiz.anyDoctor ? '' : _wiz.doctorId,
        doctorName:  _wiz.anyDoctor ? '' : _wiz.doctorName,
        anyDoctor:   _wiz.anyDoctor,
        date:        _wiz.selectedDate,
        time:        _wiz.time,
        type:        _wiz.type,
        termsAgreed: true,
        status:      'pending',
        notes:       _wiz.notes
      })
    })
    const d = await r.json()
    if (!d.success) {
      if (btn) { btn.disabled = false; btn.innerHTML = icon('check','icon-sm') + ' Confirm Appointment' }
      if (d.waitlistAvailable) { promptJoinWaitlist(d); return }
      toast(d.message || 'Could not submit appointment.', 'error'); return
    }

    const newId = d.id
    addAppointment({
      id: newId, patientId: user.id, patientName: user.name,
      doctorId: _wiz.anyDoctor ? null : _wiz.doctorId,
      doctorName: _wiz.anyDoctor ? null : _wiz.doctorName,
      date: _wiz.selectedDate, time: _wiz.time, type: _wiz.type,
      status: 'pending', source: 'online', notes: _wiz.notes
    })
    addActivityLog({ id:'L'+Date.now(), user: user.name, role: 'Patient',
      action: `Requested appointment ${newId}` + (_wiz.anyDoctor ? ' (any available doctor)' : ` with ${_wiz.doctorName}`),
      timestamp: nowTimestamp(), type:'appointment' })

    const dt = new Date(_wiz.selectedDate + 'T00:00:00')
    const dateShort = dt.toLocaleDateString('en-PH', { month:'long', day:'numeric', year:'numeric' })
    showModal(`
      <div class="modal-body" style="text-align:center;padding:32px 24px">
        <div style="width:56px;height:56px;border-radius:50%;background:#ECFDF5;border:2px solid #16a34a;
                    display:flex;align-items:center;justify-content:center;margin:0 auto 16px">
          <svg viewBox="0 0 24 24" fill="none" stroke="#16a34a" stroke-width="2.5" width="24" height="24"><polyline points="20 6 9 17 4 12"/></svg>
        </div>
        <div style="font-size:1.1rem;font-weight:700;color:#1C1C1C;margin-bottom:8px">Your Appointment Request Has Been Submitted</div>
        <div style="font-size:.85rem;color:#6B7280;margin-bottom:16px">Your request for:</div>
        <div style="background:#FFF7ED;border-radius:10px;padding:14px 20px;margin-bottom:16px;text-align:left">
          <div style="font-size:.85rem;font-weight:600;color:#1C1C1C">${docLabel}</div>
          <div style="font-size:.82rem;color:#6B7280;margin-top:4px">${dateShort} at ${_wiz.time}</div>
          <div style="font-size:.82rem;color:#6B7280">${_wiz.type}</div>
        </div>
        <div style="font-size:.8rem;color:#9CA3AF;margin-bottom:20px">has been submitted successfully. The clinic will review and confirm your schedule shortly.</div>
        <div style="display:flex;gap:10px;justify-content:center;flex-wrap:wrap">
          <button class="btn-secondary" onclick="window.closeModal();window.navigate('patient-appts',{filter:'pending'})">View My Appointments</button>
          <button class="btn-primary" onclick="window.closeModal();window.navigate('patient-appts',{filter:'request'})">Request Another</button>
        </div>
      </div>`)
  } catch (_) {
    toast('Network error — please try again.', 'error')
    if (btn) { btn.disabled = false; btn.innerHTML = icon('check','icon-sm') + ' Confirm Appointment' }
  }
}
window.requestAppointment = requestAppointment

// Admin/staff equivalent of requestAppointment() — the patient is already
// chosen (via the picker gate in pageCreateAppointment()), there's no T&C
// checkbox to agree to, and the caller sets the initial status directly
// instead of every request starting as 'pending'. Hitting a full/held slot
// offers to waitlist the chosen patient, same as the patient-side flow —
// promptJoinWaitlist() branches on d.patientId to know which case it's in.
async function submitStaffAppointment() {
  if (!_wiz.patientId || !_wiz.selectedDate || !_wiz.doctorId || !_wiz.time || !_wiz.type) {
    toast('Please complete all required fields.', 'error'); return
  }
  const btn = document.getElementById('appt-submit-btn')
  if (btn) { btn.disabled = true; btn.innerHTML = icon('clock','icon-sm') + ' Creating…' }

  try {
    const r = await fetch('api/appointments/create.php', {
      method:  'POST',
      headers: { 'Content-Type': 'application/json' },
      body:    JSON.stringify({
        patientId:   _wiz.patientId,
        patientName: _wiz.patientName,
        doctorId:    _wiz.doctorId,
        doctorName:  _wiz.doctorName,
        date:        _wiz.selectedDate,
        time:        _wiz.time,
        type:        _wiz.type,
        status:      _wiz.initialStatus,
        notes:       _wiz.notes
      })
    })
    const d = await r.json()
    if (!d.success) {
      if (btn) { btn.disabled = false; btn.innerHTML = icon('check','icon-sm') + ' Create Appointment' }
      if (d.waitlistAvailable) { promptJoinWaitlist(d); return }
      toast(d.message || 'Could not create appointment.', 'error'); return
    }

    const newId = d.id
    addAppointment({
      id: newId, patientId: _wiz.patientId, patientName: _wiz.patientName,
      doctorId: _wiz.doctorId, doctorName: _wiz.doctorName,
      date: _wiz.selectedDate, time: _wiz.time, type: _wiz.type,
      status: _wiz.initialStatus, source: 'walk-in', notes: _wiz.notes
    })
    addActivityLog({ id:'L'+Date.now(), user: state.user.name, role: state.role,
      action: `Created appointment ${newId} for ${_wiz.patientName}`,
      timestamp: nowTimestamp(), type:'appointment' })

    toast('Appointment created successfully. The patient will be notified.')
    navigate('appointments', { filter: _wiz.initialStatus })
  } catch (_) {
    toast('Network error — please try again.', 'error')
    if (btn) { btn.disabled = false; btn.innerHTML = icon('check','icon-sm') + ' Create Appointment' }
  }
}
window.submitStaffAppointment = submitStaffAppointment

// Patient-picker gate (pageCreateAppointment, staff/admin) — simple
// client-side filter over the already-loaded patient list.
// The onclick target for a patient row on the New Appointment picker —
// shared between the page's initial full-list render (pages.js) and the
// filtered re-render below, so both stay in sync automatically.
function _capPatientOnclick(p) {
  return `window.navigate('create-appointment',{patientId:'${p.id}',patientName:'${(p.name||'').replace(/'/g,"\\'")}'})`
}
window._capPatientOnclick = _capPatientOnclick

// Re-renders the New Appointment patient list from scratch using the exact
// same _renderPatientResult() row markup as the QR Scanner's Manual Search —
// a full re-render (rather than hiding/showing pre-built rows) guarantees
// this list can never drift out of sync with that reference formatting.
function _filterCapPatientList(query) {
  const container = document.getElementById('cap-patient-list')
  if (!container) return
  const q = query.trim().toLowerCase()
  const matches = !q ? patients : patients.filter(p =>
    (p.name || '').toLowerCase().includes(q) || p.id.toLowerCase().includes(q) || (p.qrData || '').toLowerCase().includes(q)
  )
  container.innerHTML = matches.length
    ? matches.map(p => _renderPatientResult(p, _capPatientOnclick(p))).join('')
    : `<div style="padding:24px;text-align:center;font-size:.85rem;color:#9CA3AF">No matching patients found.</div>`
}
window._filterCapPatientList = _filterCapPatientList

// Shared by both the patient's self-booking flow and the admin/staff
// New Appointment flow — d.patientId/d.patientName are only present on the
// admin/staff response (see create.php), which is how this tells the two
// cases apart.
function promptJoinWaitlist(d) {
  const dt = new Date(d.date + 'T00:00:00')
  const dateShort = dt.toLocaleDateString('en-PH', { month:'long', day:'numeric', year:'numeric' })
  const esc = s => (s || '').replace(/'/g, "\\'")
  const isStaff = !!d.patientId
  const joinArgs = `'${d.doctorId}','${esc(d.doctorName)}','${d.date}','${d.time}','${esc(d.type)}'`
                 + (isStaff ? `,'${d.patientId}','${esc(d.patientName)}'` : '')
  showModal(`
    <div class="modal-body" style="text-align:center;padding:32px 24px">
      <div style="width:56px;height:56px;border-radius:50%;background:#FFF7ED;border:2px solid #FDBA74;
                  display:flex;align-items:center;justify-content:center;margin:0 auto 16px;color:#E8760A">
        ${icon('alert-circle','icon-lg')}
      </div>
      <div style="font-size:1.05rem;font-weight:700;color:#1C1C1C;margin-bottom:8px">This Slot Is Fully Booked</div>
      <div style="background:#F9FAFB;border-radius:10px;padding:14px 20px;margin-bottom:16px;text-align:left">
        ${isStaff ? `<div style="font-size:.85rem;font-weight:600;color:#1C1C1C">${d.patientName}</div>` : ''}
        <div style="font-size:.85rem;font-weight:600;color:#1C1C1C">${d.doctorName}</div>
        <div style="font-size:.82rem;color:#6B7280;margin-top:4px">${dateShort} at ${d.time}</div>
      </div>
      <div style="font-size:.85rem;color:#6B7280;margin-bottom:20px">${isStaff
        ? `Would you like to add ${d.patientName} to the waitlist? They'll be notified if this slot opens up.`
        : `Would you like to join the waitlist? We'll notify you if this slot opens up.`}</div>
      <div style="display:flex;gap:10px;justify-content:center;flex-wrap:wrap">
        <button class="btn-secondary" onclick="window.closeModal()">No, choose another slot</button>
        <button class="btn-primary" onclick="window.joinWaitlist(${joinArgs})">${isStaff ? 'Yes, add to waitlist' : 'Yes, join waitlist'}</button>
      </div>
    </div>`)
}
window.promptJoinWaitlist = promptJoinWaitlist

async function joinWaitlist(doctorId, doctorName, date, time, type, patientId, patientName) {
  const isStaff = !!patientId
  try {
    const r = await fetch('api/waitlist/join.php', {
      method: 'POST', headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({
        doctorId, doctorName, date, time, type, termsAgreed: true,
        ...(isStaff ? { patientId, patientName } : {})
      })
    })
    const d = await r.json()
    if (!d.success) { toast(d.message || 'Could not join the waitlist.', 'error'); return }
    closeModal()
    if (isStaff) {
      toast(`${patientName} has been added to the waitlist.`, 'success')
      window.navigate('waitlist')
    } else {
      toast("You're on the waitlist. We'll notify you if this slot opens up.", 'success')
      window.navigate('patient-request-appt')
    }
  } catch (_) {
    toast('Network error — please try again.', 'error')
  }
}
window.joinWaitlist = joinWaitlist

// ── Admin/staff: assign a doctor to an "any available optometrist" ──
// request (appointments/update.php action=assign_doctor). Only doctors
// scheduled to work that weekday, not individually blocked that date, and
// not already booked at that exact time are offered — same eligibility
// rule as the patient-side any-doctor booking path (wizBuildTimeSlotsAnyDoctor).
async function openAssignDoctorModal(apptId) {
  const a = appointments.find(x => x.id === apptId)
  if (!a) return
  const dt = new Date(a.date + 'T00:00:00')
  const dayShort = ['Sun','Mon','Tue','Wed','Thu','Fri','Sat'][dt.getDay()]
  const eligibleDocs = doctors.filter(d => {
    if (d.status !== 'active') return false
    if (!(d.days || []).includes(dayShort)) return false
    return !(d.blockedDates || []).some(b => b.date === a.date)
  })

  const fmtApptDate = new Date(a.date + 'T00:00:00').toLocaleDateString('en-PH',{month:'long',day:'numeric',year:'numeric'})
  showModal(`
    <div class="modal-header">
      <div class="modal-title">${icon('users','icon-sm')} Assign an Optometrist</div>
      <button class="modal-close" onclick="window.closeModal()">&times;</button>
    </div>
    <div class="modal-body">
      <div style="display:flex;align-items:flex-start;gap:10px;padding:10px 12px;background:#FFFBF5;border:1px solid #FFE4C0;border-radius:8px;font-size:.82rem;color:#92400E">
        <span style="flex-shrink:0;display:flex;margin-top:2px">${icon('info','icon-sm')}</span>
        <span>For <strong>${a.patientName}</strong> &bull; ${fmtApptDate} at ${a.time}. Only optometrists actually free at that time are shown.</span>
      </div>
      <!-- padding (not just margin) around the scrollable list — without it,
           the top row's hover lift+shadow (.pick-person-row:hover) gets
           clipped flush against this container's own edge instead of
           having room to spread outward. -->
      <div id="assign-doc-list" style="display:flex;flex-direction:column;gap:8px;max-height:340px;overflow-y:auto;margin-top:10px;padding:6px 4px">
        <div style="color:#9CA3AF;font-size:.82rem">Checking availability…</div>
      </div>
    </div>
    <div class="modal-footer">
      <button class="btn-secondary" onclick="window.closeModal()">Cancel</button>
    </div>`)

  const list = document.getElementById('assign-doc-list')
  if (!eligibleDocs.length) {
    if (list) list.innerHTML = `<div style="font-size:.82rem;color:#9CA3AF;text-align:center;padding:12px 0">No optometrists are scheduled to work on this date.</div>`
    return
  }

  let byDoctor = {}
  try {
    const ids = eligibleDocs.map(d => d.id).join(',')
    const r = await fetch(`api/appointments/taken.php?doctorIds=${encodeURIComponent(ids)}&date=${encodeURIComponent(a.date)}&excludeId=${encodeURIComponent(a.id)}`)
    const d = await r.json()
    byDoctor = d.byDoctor || {}
  } catch (_) { /* fail open — treat as nobody booked yet */ }
  if (!document.getElementById('assign-doc-list')) return // modal was closed mid-fetch

  const slotMins = _clockToMinutes(a.time)
  // No more per-service duration — every appointment (any type) runs on
  // the one clinic-wide interval.
  const apptDur  = _durationMinutes(consultationSettings.defaultDuration)
  const freeDocs = eligibleDocs.filter(d => {
    const taken = byDoctor[d.id] || []
    return !taken.some(bt => {
      const btMins = _clockToMinutes(bt.time)
      const btDur  = bt.duration || apptDur
      if (btMins == null || slotMins == null) return false
      return slotMins < btMins + btDur && slotMins + apptDur > btMins
    })
  })

  if (!list) return
  if (!freeDocs.length) {
    list.innerHTML = `<div style="font-size:.82rem;color:#9CA3AF;text-align:center;padding:12px 0">No optometrist is free at this exact time. Consider rescheduling this appointment instead.</div>`
    return
  }
  const getInitials = name => (name || '').replace('Dr. ','').split(' ').map(n=>n[0]).join('').slice(0,2).toUpperCase()
  // Same photo-with-initials-fallback pattern as the booking wizard's own
  // doctor cards (wizBuildDoctorCards()'s docAvatar()) — this list was
  // showing initials-only even for doctors with a profile photo on file.
  const docAvatar = d => d.photoUrl
    ? `<div class="pick-person-avatar" style="overflow:hidden;padding:0"><img src="${d.photoUrl}" alt="${d.name}" style="width:100%;height:100%;object-fit:cover;object-position:top;border-radius:50%;display:block" onerror="${window.avatarFallbackAttr(d.name)}"></div>`
    : `<div class="pick-person-avatar">${getInitials(d.name)}</div>`
  list.innerHTML = freeDocs.map(d => `
    <button class="pick-person-row" onclick="window._confirmAssignDoctor('${apptId}','${d.id}')">
      ${docAvatar(d)}
      <div style="flex:1;min-width:0">
        <div style="font-size:.9rem;font-weight:700;color:#1C1C1C">${d.name}</div>
        <div style="font-size:.78rem;color:#6B7280">${d.specialization}</div>
      </div>
      <span class="pick-person-arrow">${icon('chevron-right','icon-sm')}</span>
    </button>`).join('')
}
window.openAssignDoctorModal = openAssignDoctorModal

async function _confirmAssignDoctor(apptId, doctorId) {
  try {
    const r = await fetch('api/appointments/update.php', {
      method: 'POST', headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({ id: apptId, action: 'assign_doctor', doctorId })
    })
    const d = await r.json()
    if (!d.success) { toast(d.message || 'Could not assign a doctor.', 'error'); return }
    const a = appointments.find(x => x.id === apptId)
    if (a) { a.doctorId = doctorId; a.doctorName = d.doctorName }
    closeModal()
    toast('Doctor assigned.', 'success')
    renderPage()
  } catch (_) {
    toast('Network error — please try again.', 'error')
  }
}
window._confirmAssignDoctor = _confirmAssignDoctor

async function respondWaitlist(id, action) {
  try {
    const r = await fetch('api/waitlist/respond.php', {
      method: 'POST', headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({ id, action })
    })
    const d = await r.json()
    if (!d.success) { toast(d.message || 'Could not process your response.', 'error'); return }
    if (action === 'claim') {
      toast('Appointment confirmed!', 'success')
      window.navigate('patient-appts', { filter: 'approved' })
    } else {
      toast("You've declined this slot.", 'info')
      window.navigate('patient-request-appt')
    }
  } catch (_) {
    toast('Network error — please try again.', 'error')
  }
}
window.respondWaitlist = respondWaitlist

// Declining releases the slot to the next patient in line and can't be
// undone — worth a confirm step, unlike claiming (the wanted outcome),
// which stays a single click.
function confirmDeclineWaitlistOffer(id) {
  showConfirm({
    title: 'Choose a Different Slot?',
    message: "This releases the offered slot to the next patient in line and you won't be able to reclaim it. You'll need to request a new appointment or rejoin the waitlist if you still want this doctor's schedule.",
    confirmText: 'Choose Different Slot',
    danger: true,
    onConfirm: () => window.respondWaitlist(id, 'decline')
  })
}
window.confirmDeclineWaitlistOffer = confirmDeclineWaitlistOffer

async function leaveWaitlist(id) {
  try {
    const r = await fetch('api/waitlist/leave.php', {
      method: 'POST', headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({ id })
    })
    const d = await r.json()
    if (!d.success) { toast(d.message || 'Could not leave the waitlist.', 'error'); return }
    toast("You've left the waitlist.", 'info')
    window.navigate('patient-request-appt')
  } catch (_) {
    toast('Network error — please try again.', 'error')
  }
}
window.leaveWaitlist = leaveWaitlist

async function loadMyWaitlistCard(emptyHtml = '') {
  const el = document.getElementById('my-waitlist-card')
  if (!el) return
  try {
    const r = await fetch('api/waitlist/index.php')
    const d = await r.json()
    if (!d.success) return
    el.innerHTML = d.entry ? waitlistCardHtml(d.entry) : emptyHtml
    if (d.entry && d.entry.status === 'offered') _startWaitlistCountdown(d.entry.offerExpiresAt)
  } catch (_) { /* non-critical — booking wizard still works without it */ }
}
window.loadMyWaitlistCard = loadMyWaitlistCard

function waitlistCardHtml(entry) {
  const dt = new Date(entry.date + 'T00:00:00')
  const dateShort = dt.toLocaleDateString('en-PH', { month:'long', day:'numeric', year:'numeric' })
  if (entry.status === 'offered') {
    return `
      <div class="card" style="background:#FFF7ED;border:1.5px solid #FDBA74;margin-bottom:20px">
        <div class="card-body" style="display:flex;gap:12px;align-items:center;flex-wrap:wrap">
          <span style="flex-shrink:0;display:flex;color:#E8760A">${icon('alert-circle','icon-lg')}</span>
          <div style="flex:1;min-width:220px">
            <div style="font-weight:700;color:#1C1C1C;margin-bottom:4px">A waitlisted slot is open!</div>
            <div style="font-size:.85rem;color:#6B7280;margin-bottom:6px">${entry.doctorName} on ${dateShort} at ${entry.time}</div>
            <div style="font-size:.8rem;color:#C2410C;font-weight:600">Claim it in <span id="waitlist-offer-countdown"></span> or it will go to the next patient in line.</div>
          </div>
          <div style="display:flex;gap:8px;flex-shrink:0">
            <button class="btn-secondary" onclick="window.confirmDeclineWaitlistOffer(${entry.id})">Choose different slot</button>
            <button class="btn-primary" onclick="window.respondWaitlist(${entry.id},'claim')">Claim Slot</button>
          </div>
        </div>
      </div>`
  }
  return `
    <div class="card" style="background:#F9FAFB;border:1.5px solid #E5E7EB;margin-bottom:20px">
      <div class="card-body" style="display:flex;gap:12px;align-items:flex-start;flex-wrap:wrap">
        <span style="flex-shrink:0;display:flex;color:#6B7280">${icon('clock','icon-lg')}</span>
        <div style="flex:1;min-width:220px">
          <div style="font-weight:700;color:#1C1C1C;margin-bottom:4px">You're on the waitlist</div>
          <div style="font-size:.85rem;color:#6B7280">${entry.doctorName} on ${dateShort} at ${entry.time}. We'll notify you if this slot opens up.</div>
          ${entry.position ? `
          <div style="display:inline-flex;align-items:center;gap:6px;margin-top:8px;background:#FFF0DC;color:#9A3412;
                      border-radius:6px;padding:4px 10px;font-size:.78rem;font-weight:700">
            You're #${entry.position}${entry.totalWaiting > 1 ? ` of ${entry.totalWaiting}` : ''} in line
          </div>` : ''}
        </div>
        <button class="btn-secondary" style="flex-shrink:0;align-self:center" onclick="window.leaveWaitlist(${entry.id})">Leave Waitlist</button>
      </div>
    </div>`
}

let _waitlistCountdownInterval = null
function _startWaitlistCountdown(expiresAtStr) {
  clearInterval(_waitlistCountdownInterval)
  const expiresAt = new Date(expiresAtStr.replace(' ', 'T')).getTime()
  function tick() {
    const display = document.getElementById('waitlist-offer-countdown')
    if (!display || !display.isConnected) { clearInterval(_waitlistCountdownInterval); return }
    const remaining = Math.max(0, Math.floor((expiresAt - Date.now()) / 1000))
    const h = Math.floor(remaining / 3600), m = Math.floor((remaining % 3600) / 60), s = remaining % 60
    display.textContent = h > 0 ? `${h}h ${m}m` : `${m}:${String(s).padStart(2,'0')}`
    if (remaining <= 0) clearInterval(_waitlistCountdownInterval)
  }
  tick()
  _waitlistCountdownInterval = setInterval(tick, 1000)
}

// keyboard nav
document.addEventListener('keydown', e => {
  if (!document.getElementById('wiz-step-0')) return
  if (e.key === 'Escape' && _wiz.step > 0) wizGo(-1)
})

// ════════════════════════════════════════════════════════════════
//  SAVE OPTICAL EXAMINATION
// ════════════════════════════════════════════════════════════════
// saveExamination()/printExaminationForm() (the old single-form editor's
// save/print pair) were removed here — pageExamination() (pages.js) no
// longer renders that form for doctors, redirecting to the wizard
// (saveNewExam()/printNewExamDraft() below) instead, so these had no
// remaining callers and their field shapes had drifted from the current
// create.php contract (see database/schema.sql's field-separation fix).

// ════════════════════════════════════════════════════════════════
//  ADD / EDIT USER MODAL
// ════════════════════════════════════════════════════════════════
function openAddUserModal() {
  showModal(`
    <div class="modal-header">
      <div class="modal-title">Add New User</div>
      <button class="modal-close" onclick="window.closeModal()">&times;</button>
    </div>
    <div class="modal-body" style="display:flex;flex-direction:column;gap:14px">
      <div class="form-row-2">
        <div class="form-group"><label class="form-label">First Name <span class="req">*</span></label>
          <input id="nu-first" class="form-input" placeholder="Juan"></div>
        <div class="form-group"><label class="form-label">Middle Name</label>
          <input id="nu-middle" class="form-input" placeholder="Santos"></div>
      </div>
      <div class="form-group"><label class="form-label">Last Name <span class="req">*</span></label>
        <input id="nu-last" class="form-input" placeholder="Dela Cruz"></div>
      <div class="form-row-2">
        <div class="form-group"><label class="form-label">Email <span class="req">*</span></label>
          <input id="nu-email" type="email" class="form-input" placeholder="juan@email.com"></div>
        <div class="form-group"><label class="form-label">Contact Number</label>
          <input id="nu-contact" class="form-input" inputmode="numeric" maxlength="11" onkeypress="return /[0-9]/.test(event.key)" oninput="this.value=this.value.replace(/\D/g,'')" placeholder="09XXXXXXXXX"></div>
      </div>
      <div class="form-group"><label class="form-label">Role <span class="req">*</span></label>
        ${window.selectFieldHtml('nu-role', { value: 'Admin', options: ['Admin','Staff','Doctor','Patient'], onchange: 'window.onAddUserRoleChange(this.value)' })}</div>

      <!-- Doctor-specific fields -->
      <div id="nu-doctor-fields" style="display:none;flex-direction:column;gap:14px">
        <div class="form-row-2">
          <div class="form-group"><label class="form-label">Specialization</label>
            <input id="nu-specialization" class="form-input" placeholder="e.g. Optometrist" value="Optometrist"></div>
          <div class="form-group"><label class="form-label">Degree</label>
            <input id="nu-degree" class="form-input" placeholder="e.g. OD, MD" value="OD"></div>
        </div>
        <div class="form-group"><label class="form-label">PRC License No.</label>
          <input id="nu-prc" class="form-input" placeholder="PRC-XXXXX"></div>
      </div>

      <!-- Patient-specific fields (matches Add Patient form) -->
      <div id="nu-patient-fields" style="display:none;flex-direction:column;gap:14px">
        <div class="form-row-2">
          <div class="form-group"><label class="form-label">Date of Birth <span class="req">*</span></label>
            ${dobFieldHtml('nu-dob', { max: localDateStr() })}</div>
          <div class="form-group"><label class="form-label">Gender <span class="req">*</span></label>
            ${window.selectFieldHtml('nu-gender', { value: '', placeholder: 'Select gender', options: ['Male','Female','Other'] })}</div>
        </div>
        <div class="form-group"><label class="form-label">Occupation</label>
          <input id="nu-occupation" class="form-input" placeholder="e.g. Teacher, Engineer, Student"></div>
        <div class="form-group"><label class="form-label">Address</label>
          <input id="nu-address" class="form-input" placeholder="Street, City, Province"></div>
      </div>

      <div id="nu-pass-group">
        <div class="form-group"><label class="form-label">Temporary Password <span class="req">*</span></label>
          <div style="position:relative">
            <input id="nu-pass" type="password" class="form-input" style="padding-right:40px" placeholder="Minimum 8 characters" oninput="window.updatePwChecklist('nu-pass', this.value);window.updateNuSaveGate()">
            <button type="button" onclick="window.togglePwVisibility('nu-pass',this)"
                    style="position:absolute;right:10px;top:50%;transform:translateY(-50%);background:none;border:none;cursor:pointer;color:#9CA3AF;padding:2px;display:flex;align-items:center">
              ${ic('eye-off', 'icon-sm')}
            </button>
          </div>
          ${window.pwChecklistHtml('nu-pass')}
        </div>
      </div>
    </div>
    <div class="modal-footer">
      <button class="btn-secondary" onclick="window.closeModal()">Cancel</button>
      <button id="nu-save-btn" class="btn-primary" disabled style="opacity:.55;cursor:not-allowed" onclick="window.doAddUser()">Create Account</button>
    </div>`, 'modal-lg')
}

function onAddUserRoleChange(role) {
  const docFields = document.getElementById('nu-doctor-fields')
  const patFields = document.getElementById('nu-patient-fields')
  const passGroup = document.getElementById('nu-pass-group')
  if (docFields) docFields.style.display = role === 'Doctor'  ? 'flex' : 'none'
  if (patFields) patFields.style.display = role === 'Patient' ? 'flex' : 'none'
  if (passGroup) passGroup.style.display = role === 'Patient' ? 'none' : ''
  window.updateNuSaveGate()
}
window.onAddUserRoleChange = onAddUserRoleChange

// Keeps the Create Account button disabled until the temporary password
// meets policy — mirrors the real-time checklist instead of duplicating
// the same rules in a submit-time toast.
function updateNuSaveGate() {
  const btn  = document.getElementById('nu-save-btn')
  if (!btn) return
  const role = (document.getElementById('nu-role') || {}).value || 'Admin'
  const pass = (document.getElementById('nu-pass') || {}).value || ''
  const ok   = role === 'Patient' || window.pwPolicyValid(pass)
  btn.disabled       = !ok
  btn.style.opacity  = ok ? '' : '.55'
  btn.style.cursor   = ok ? '' : 'not-allowed'
}
window.updateNuSaveGate = updateNuSaveGate

async function doAddUser() {
  const gv    = id => (document.getElementById(id)||{}).value?.trim() || ''
  const first   = gv('nu-first')
  const last    = gv('nu-last')
  const email   = gv('nu-email')
  const contact = gv('nu-contact')
  const role    = gv('nu-role') || 'Admin'
  const pass    = gv('nu-pass')

  if (!first || !last || !email) { toast('Please fill in all required fields.', 'error'); return }
  // Contact/Address aren't required here, but if something was typed it
  // has to actually look like a real one — same rules as registration.
  if (contact && !window.isValidContact(contact)) { toast('Please enter a valid 11-digit contact number.', 'error'); return }
  const nuAddress = gv('nu-address')
  if (role === 'Patient' && nuAddress && !window.looksLikeAddress(nuAddress)) { toast('Please enter a complete address.', 'error'); return }
  // Password policy is enforced live via the checklist and the Create
  // Account button is disabled until it's met — this is just a safety
  // net in case the button's disabled state was somehow bypassed.
  if (role !== 'Patient' && !window.pwPolicyValid(pass)) return

  const btn = document.getElementById('nu-save-btn')
  if (btn) { btn.disabled = true; btn.textContent = 'Creating…' }

  try {
    let endpoint, body

    const middle = gv('nu-middle')

    if (role === 'Patient') {
      endpoint = 'api/patients/create.php'
      body = {
        firstName: first, middleName: middle, lastName: last, email, contact,
        dob: gv('nu-dob'), gender: gv('nu-gender'),
        address: gv('nu-address'),
        occupation: gv('nu-occupation'),
      }
    } else {
      endpoint = 'api/users/create.php'
      body = { role, firstName: first, middleName: middle, lastName: last, email, password: pass, contact }
      if (role === 'Doctor') {
        body.specialization = gv('nu-specialization') || 'Optometrist'
        body.degree         = gv('nu-degree') || 'OD'
        body.prcLicense     = gv('nu-prc')
      }
    }

    const res  = await fetch(endpoint, {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify(body)
    })
    const data = await res.json()

    if (!data.success) { toast(data.message || 'Failed to create account.', 'error'); return }

    const name = fmtFullName(first, middle, last, role === 'Doctor' ? 'Dr. ' : '')
    if (role === 'Patient') patients.push(data.patient)
    else if (role === 'Admin')  admins.push(data.user)
    else if (role === 'Staff')  staff.push(data.user)
    else if (role === 'Doctor') doctors.push(data.user)

    addActivityLog({ id:'L'+Date.now(), user: state.user.name, role: state.role,
      action: `Created new ${role} account: ${name}`,
      timestamp: nowTimestamp(), type:'user' })

    closeModal()
    renderPage()

    if (role === 'Patient') {
      setTimeout(() => window._showRegistrationQRModal(data.patient, data.tempPassword || null), 150)
    } else {
      let msg = `Account created. ${name} can now log in.`
      if (data.tempPassword) msg += ` Temp password: ${data.tempPassword}`
      toast(msg)
    }

  } catch(e) {
    toast('Network error. Please try again.', 'error')
  } finally {
    if (btn) { btn.disabled = false; btn.textContent = 'Create Account' }
  }
}

function editUserModal(id, role) {
  // Patients have their own comprehensive edit modal
  if (role === 'Patient') { window.openEditPatientModal(id); return }
  const pool = { Admin: admins, Staff: staff, Doctor: doctors, Patient: patients }
  const u = (pool[role] || []).find(u => u.id === id)
  if (!u) return
  showModal(`
    <div class="modal-header">
      <div class="modal-title">Edit User — ${u.name}</div>
      <button class="modal-close" onclick="window.closeModal()">&times;</button>
    </div>
    <div class="modal-body">
      <div class="form-row-2">
        <div class="form-group"><label class="form-label">First Name</label>
          <input id="eu-first" class="form-input" value="${u.firstName || ''}"></div>
        <div class="form-group"><label class="form-label">Middle Name</label>
          <input id="eu-middle" class="form-input" value="${u.middleName || ''}"></div>
      </div>
      <div class="form-group"><label class="form-label">Last Name</label>
        <input id="eu-last" class="form-input" value="${u.lastName || ''}"></div>
      <div class="form-group"><label class="form-label">Email</label>
        <input id="eu-email" type="email" class="form-input" value="${u.email || ''}"></div>
      <div class="form-group"><label class="form-label">Contact</label>
        <input id="eu-contact" class="form-input" inputmode="numeric" maxlength="11" oninput="this.value=this.value.replace(/\D/g,'')" value="${u.contact || ''}"></div>
      ${role === 'Doctor' ? `
      <div class="form-row-2">
        <div class="form-group"><label class="form-label">Specialization</label>
          <input id="eu-specialization" class="form-input" value="${(u.specialization || 'Optometrist').replace(/"/g,'&quot;')}"></div>
        <div class="form-group"><label class="form-label">Degree</label>
          <input id="eu-degree" class="form-input" placeholder="e.g. OD, MD" value="${(u.degree || 'OD').replace(/"/g,'&quot;')}"></div>
      </div>
      <div class="form-row-2">
        <div class="form-group"><label class="form-label">PRC License No.</label>
          <input id="eu-prc-license" class="form-input" placeholder="e.g. 0005787" value="${(u.prcLicense || '').replace(/"/g,'&quot;')}"></div>
        <div class="form-group"><label class="form-label">Display Order</label>
          <input id="eu-sort-order" type="number" min="0" class="form-input" placeholder="0 = first" value="${u.sortOrder ?? 0}">
          <div style="font-size:.71rem;color:#9CA3AF;margin-top:4px">Lower = shown earlier on the Doctors page.</div></div>
      </div>
      <div class="form-row-2">
        <div class="form-group"><label class="form-label">Secondary Credential <span style="font-weight:400;color:#9CA3AF">(optional)</span></label>
          <input id="eu-secondary-credential" class="form-input" placeholder="e.g. Ocular Pharmacologist" value="${(u.secondaryCredential || '').replace(/"/g,'&quot;')}"></div>
        <div class="form-group"><label class="form-label">Secondary PRC No. <span style="font-weight:400;color:#9CA3AF">(optional)</span></label>
          <input id="eu-secondary-prc" class="form-input" placeholder="e.g. 043" value="${(u.secondaryPrc || '').replace(/"/g,'&quot;')}"></div>
      </div>
      <p style="font-size:.71rem;color:#9CA3AF;margin:-8px 0 14px">Only shown on the Ophthalmic Clearance certificate when both secondary fields are filled in.</p>
      <p style="font-size:.74rem;color:#9CA3AF;margin:-8px 0 14px">Locked on the doctor's own Settings page, only admins can update these.</p>` : ''}
      <div class="form-group"><label class="form-label">Status</label>
        ${window.selectFieldHtml('eu-status', { value: u.status, options: [{ value: 'active', label: 'Active' }, { value: 'inactive', label: 'Inactive' }] })}</div>

      <!-- Reset Password (collapsible) -->
      <div style="margin-top:4px;border-top:1px solid #F3F4F6;padding-top:14px">
        <button type="button" onclick="window._togglePwReset()"
                style="display:flex;align-items:center;gap:6px;background:none;border:none;color:#6B7280;font-size:.82rem;font-weight:600;cursor:pointer;padding:0;font-family:inherit">
          ${ic('lock','icon-sm')}
          Reset Password
          <span id="eu-pw-chevron" style="font-size:.7rem;margin-left:2px">▸</span>
        </button>
        <div id="eu-pw-section" style="display:none;margin-top:12px">
          <div class="form-row-2">
            <div class="form-group"><label class="form-label">New Password</label>
              <div style="position:relative">
                <input id="eu-new-pw" type="password" class="form-input" style="padding-right:40px" placeholder="Min. 8 characters" autocomplete="new-password" oninput="window.updatePwChecklist('eu-new-pw', this.value);window.updateEuSaveGate()">
                <button type="button" onclick="window.togglePwVisibility('eu-new-pw',this)"
                        style="position:absolute;right:10px;top:50%;transform:translateY(-50%);background:none;border:none;cursor:pointer;color:#9CA3AF;padding:2px;display:flex;align-items:center">
                  ${ic('eye-off', 'icon-sm')}
                </button>
              </div></div>
            <div class="form-group"><label class="form-label">Confirm Password</label>
              <div style="position:relative">
                <input id="eu-confirm-pw" type="password" class="form-input" style="padding-right:40px" placeholder="Re-enter password" autocomplete="new-password" oninput="window.updateEuSaveGate()">
                <button type="button" onclick="window.togglePwVisibility('eu-confirm-pw',this)"
                        style="position:absolute;right:10px;top:50%;transform:translateY(-50%);background:none;border:none;cursor:pointer;color:#9CA3AF;padding:2px;display:flex;align-items:center">
                  ${ic('eye-off', 'icon-sm')}
                </button>
              </div></div>
          </div>
          ${window.pwChecklistHtml('eu-new-pw')}
          <p id="eu-pw-mismatch" style="display:none;font-size:.74rem;color:#DC2626;margin:6px 0 0">Passwords do not match.</p>
          <p style="font-size:.74rem;color:#9CA3AF;margin:2px 0 0">Leave blank to keep the existing password.</p>
        </div>
      </div>
    </div>
    <div class="modal-footer">
      <button class="btn-secondary" onclick="window.closeModal()">Cancel</button>
      <button id="eu-save-btn" class="btn-primary" onclick="window.doEditUser('${id}','${role}')">Save Changes</button>
    </div>`)
}

// Keeps Edit User's Save button disabled only when a password reset is in
// an invalid state (started but not policy-valid, or the two don't match).
// A blank password (i.e. "leave as-is") is always valid.
function updateEuSaveGate() {
  const btn   = document.getElementById('eu-save-btn')
  const hint  = document.getElementById('eu-pw-mismatch')
  if (!btn) return
  const newPw = (document.getElementById('eu-new-pw')     || {}).value || ''
  const cfPw  = (document.getElementById('eu-confirm-pw') || {}).value || ''
  const blank = !newPw && !cfPw
  const ok    = blank || (window.pwPolicyValid(newPw) && newPw === cfPw)
  if (hint) hint.style.display = (!blank && newPw && cfPw && newPw !== cfPw) ? '' : 'none'
  btn.disabled      = !ok
  btn.style.opacity = ok ? '' : '.55'
  btn.style.cursor  = ok ? '' : 'not-allowed'
}
window.updateEuSaveGate = updateEuSaveGate


function _togglePwReset() {
  const sec = document.getElementById('eu-pw-section')
  const ch  = document.getElementById('eu-pw-chevron')
  if (!sec) return
  const open = sec.style.display === 'none'
  sec.style.display = open ? '' : 'none'
  if (ch) ch.textContent = open ? '▾' : '▸'
}
window._togglePwReset = _togglePwReset

async function doEditUser(id, role) {
  const pool = { Admin: admins, Staff: staff, Doctor: doctors, Patient: patients }
  const u = (pool[role] || []).find(u => u.id === id)
  if (!u) return

  const fn      = (document.getElementById('eu-first')   || {}).value?.trim() || u.firstName
  const mn      = (document.getElementById('eu-middle')  || {}).value?.trim() ?? (u.middleName || '')
  const ln      = (document.getElementById('eu-last')    || {}).value?.trim() || u.lastName
  const email   = (document.getElementById('eu-email')   || {}).value?.trim() || u.email
  const contact = (document.getElementById('eu-contact') || {}).value?.trim() || u.contact
  const status  = (document.getElementById('eu-status')  || {}).value         || u.status
  const specialization = document.getElementById('eu-specialization')?.value?.trim() || ''
  const prcLicense      = document.getElementById('eu-prc-license')?.value?.trim()    || ''
  const degree          = document.getElementById('eu-degree')?.value?.trim()          || ''
  const secondaryCredential = document.getElementById('eu-secondary-credential')?.value?.trim() || ''
  const secondaryPrc        = document.getElementById('eu-secondary-prc')?.value?.trim()        || ''
  const sortOrderEl     = document.getElementById('eu-sort-order')
  const sortOrder       = sortOrderEl ? Math.max(0, parseInt(sortOrderEl.value, 10) || 0) : null
  const newPw   = document.getElementById('eu-new-pw')?.value  || ''
  const cfPw    = document.getElementById('eu-confirm-pw')?.value || ''

  // Password policy/match is enforced live (checklist + inline hint) and
  // the Save button is disabled until valid — this is just a safety net.
  if (newPw && (!window.pwPolicyValid(newPw) || newPw !== cfPw)) return
  if (contact && !window.isValidContact(contact)) { toast('Please enter a valid 11-digit contact number.', 'error'); return }

  // Persist profile changes to database
  try {
    const r = await fetch('api/admin/update_user.php', {
      method: 'POST', headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({ profileId: id, role, firstName: fn, middleName: mn, lastName: ln, email, contact, status, specialization, prcLicense, degree, secondaryCredential, secondaryPrc, ...(sortOrder !== null ? { sortOrder } : {}) })
    })
    const d = await r.json()
    if (!d.success) { toast(d.message || 'Failed to save changes.', 'error'); return }
    if (role === 'Doctor') {
      if (specialization) u.specialization = specialization
      if (degree)         u.degree         = degree
      u.prcLicense = prcLicense
      u.secondaryCredential = secondaryCredential
      u.secondaryPrc        = secondaryPrc
      if (sortOrder !== null) u.sortOrder  = sortOrder
      if (d.swappedWith) {
        const other = doctors.find(doc => doc.id === d.swappedWith.id)
        if (other) other.sortOrder = d.swappedWith.sortOrder
      }
    }
  } catch (_) { toast('Network error — changes not saved.', 'error'); return }

  // Reset password via backend if provided
  if (newPw) {
    try {
      const r = await fetch('api/users/reset_password.php', {
        method: 'POST', headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ profileId: id, role, newPassword: newPw })
      })
      const d = await r.json()
      if (!d.success) { toast(d.message || 'Failed to reset password.', 'error'); return }
    } catch (_) { toast('Network error — password not reset.', 'error'); return }
  }

  // Update in-memory array so the table reflects new values immediately
  const prefix = role === 'Doctor' ? 'Dr. ' : ''
  u.firstName  = fn
  u.middleName = mn
  u.lastName   = ln
  u.name       = fmtFullName(fn, mn, ln, prefix)
  u.email     = email
  u.contact   = contact
  u.status    = status

  closeModal()
  toast(newPw ? 'User updated and password reset successfully.' : 'User updated successfully.', 'success')
  renderPage()
}

function archiveUserConfirm(id, name) {
  showModal(`
    <div class="modal-header">
      <div class="modal-title" style="display:flex;align-items:center;gap:10px">
        <div style="width:32px;height:32px;border-radius:50%;background:#fef3c7;display:flex;align-items:center;justify-content:center;flex-shrink:0;color:#d97706">
          ${icon('archive','icon-sm')}
        </div>
        Archive Account: ${name}
      </div>
      <button class="modal-close" onclick="window.closeModal()">&times;</button>
    </div>
    <div class="modal-body">
      <p style="font-size:.88rem;color:#6b7280;margin-bottom:16px">Are you sure you want to archive this account? It will be removed from active lists but the data will be preserved.</p>
      <div class="form-group" style="margin:0">
        <label class="form-label">Reason for Archiving <span class="req">*</span></label>
        <textarea id="archive-reason-user" class="form-textarea" style="border-radius:8px;min-height:80px"
                  placeholder="Please provide a reason for archiving…"
                  oninput="document.getElementById('do-archive-user-btn').disabled=!this.value.trim()"></textarea>
      </div>
    </div>
    <div class="modal-footer">
      <button class="btn-secondary" onclick="window.closeModal()">Cancel</button>
      <button id="do-archive-user-btn" class="btn-primary" disabled
              onclick="window.doArchiveUser('${id}','${name}')">
        ${icon('archive','icon-sm')}<span>Archive</span>
      </button>
    </div>`)
  setTimeout(() => {
    const ta = document.getElementById('archive-reason-user')
    const btn = document.getElementById('do-archive-user-btn')
    if (ta && btn) ta.addEventListener('input', () => { btn.disabled = !ta.value.trim() })
  }, 50)
}

async function doArchiveUser(id, name) {
  const reason = (document.getElementById('archive-reason-user') || {}).value?.trim() || 'No reason provided'
  const pools = [
    { arr: patients, role: 'Patient' }, { arr: doctors, role: 'Doctor' },
    { arr: staff,    role: 'Staff'   }, { arr: admins,  role: 'Admin'  }
  ]
  let role = null
  pools.forEach(p => { if (p.arr.find(u => u.id === id)) role = p.role })
  if (!role) return

  const btn = document.getElementById('do-archive-user-btn')
  if (_btnBusy(btn, 'primary', 'Archiving…')) return

  try {
    const r = await fetch('api/archive/create.php', {
      method: 'POST', headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({ profileId: id, role, type: 'Account', name, reason, archivedBy: state.user.name })
    })
    const d = await r.json()
    if (!d.success) { toast(d.message || 'Failed to archive account.', 'error'); _btnIdle(btn); return }

    const arr = pools.find(p => p.role === role).arr
    const idx = arr.findIndex(u => u.id === id)
    if (idx !== -1) arr.splice(idx, 1)
    archivedRecords.push(d.record)
  } catch (_) { toast('Network error — account not archived.', 'error'); _btnIdle(btn); return }

  addActivityLog({ id:'L'+Date.now(), user: state.user.name, role: state.role,
    action: `Archived account: ${name} (${id}) — Reason: ${reason}`,
    timestamp: nowTimestamp(), type:'user' })
  closeModal()
  toast(`Account archived successfully. It can be restored from Settings > Archives.`, 'success')
  renderPage()
}

async function toggleUserStatus(id, role) {
  const pools = { Admin: admins, Staff: staff, Doctor: doctors, Patient: patients }
  const arr = pools[role]
  if (!arr) return
  const u = arr.find(u => u.id === id)
  if (!u) return
  const newStatus = (u.status || 'active') === 'active' ? 'inactive' : 'active'
  try {
    const r = await fetch('api/admin/update_user.php', {
      method: 'POST', headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({ profileId: id, role, firstName: u.firstName || u.name.split(' ')[0], lastName: u.lastName || u.name.split(' ').slice(1).join(' '), contact: u.contact || '', status: newStatus })
    })
    const d = await r.json()
    if (!d.success) { toast(d.message || 'Failed to update status.', 'error'); return }
    u.status = newStatus
    addActivityLog({ id:'L'+Date.now(), user: state.user.name, role: state.role,
      action: `${newStatus === 'active' ? 'Activated' : 'Deactivated'} ${role.toLowerCase()} account: ${u.name} (${id})`,
      timestamp: nowTimestamp(), type:'user' })
    toast(`${u.name} has been ${newStatus === 'active' ? 'activated' : 'deactivated'}.`, 'success')
    renderPage()
  } catch (_) { toast('Network error — status not changed.', 'error') }
}

window.openAddUserModal  = openAddUserModal
window.doAddUser         = doAddUser
window.editUserModal     = editUserModal
window.doEditUser        = doEditUser
window.archiveUserConfirm = archiveUserConfirm
window.doArchiveUser      = doArchiveUser
window.toggleUserStatus   = toggleUserStatus

// ════════════════════════════════════════════════════════════════
//  ADD / EDIT PATIENT MODAL
// ════════════════════════════════════════════════════════════════
function openAddPatientModal() {
  showModal(`
    <div class="modal-header">
      <div class="modal-title">Register New Patient</div>
      <button class="modal-close" onclick="window.closeModal()">&times;</button>
    </div>
    <div class="modal-body" style="display:flex;flex-direction:column;gap:14px">
      <div class="form-row-2">
        <div class="form-group"><label class="form-label">First Name <span class="req">*</span></label>
          <input id="ap-first" class="form-input" placeholder="Juan"></div>
        <div class="form-group"><label class="form-label">Middle Name</label>
          <input id="ap-middle" class="form-input" placeholder="Santos"></div>
      </div>
      <div class="form-group"><label class="form-label">Last Name <span class="req">*</span></label>
        <input id="ap-last" class="form-input" placeholder="Dela Cruz"></div>
      <div class="form-row-2">
        <div class="form-group"><label class="form-label">Email</label>
          <input type="email" id="ap-email" class="form-input" placeholder="juan@email.com"></div>
        <div class="form-group"><label class="form-label">Contact Number</label>
          <input id="ap-contact" class="form-input" inputmode="numeric" maxlength="11" oninput="this.value=this.value.replace(/\D/g,'')" placeholder="09XXXXXXXXX"></div>
      </div>
      <div class="form-row-2">
        <div class="form-group"><label class="form-label">Date of Birth <span class="req">*</span></label>
          ${dobFieldHtml('ap-dob', { max: localDateStr() })}</div>
        <div class="form-group"><label class="form-label">Gender <span class="req">*</span></label>
          ${window.selectFieldHtml('ap-gender', { value: '', placeholder: 'Select gender', options: ['Male','Female','Other'] })}</div>
      </div>
      <div class="form-group"><label class="form-label">Occupation</label>
        <input id="ap-occupation" class="form-input" placeholder="e.g. Teacher, Engineer, Student"></div>
      <div class="form-group"><label class="form-label">Address</label>
        <input id="ap-address" class="form-input" placeholder="Street, City, Province"></div>
      <div class="form-group" style="margin-bottom:0"><label class="form-label">Medical History <span style="font-size:.75rem;color:#9CA3AF;font-weight:400">(optional)</span></label>
        <textarea id="ap-medical-history" class="form-textarea" rows="3" placeholder="Conditions, allergies, ongoing medications, past eye surgeries, etc."></textarea>
        <p style="margin:6px 0 0;font-size:.72rem;color:#9CA3AF">Shown to the doctor during examinations so they have it in view while examining.</p>
      </div>
    </div>
    <div class="modal-footer">
      <button class="btn-secondary" onclick="window.closeModal()">Cancel</button>
      <button id="ap-save-btn" class="btn-primary" onclick="window.doAddPatient()">
        ${icon('plus','icon-sm')} Register Patient &amp; Generate QR
      </button>
    </div>`, 'modal-lg')
}

async function doAddPatient() {
  const gv    = id => (document.getElementById(id)||{}).value?.trim() || ''
  const first = gv('ap-first'), last = gv('ap-last')
  if (!first || !last) { toast('First and last name are required.', 'error'); return }
  const apContact = gv('ap-contact')
  if (apContact && !window.isValidContact(apContact)) { toast('Please enter a valid 11-digit contact number.', 'error'); return }
  const apAddress = gv('ap-address')
  if (apAddress && !window.looksLikeAddress(apAddress)) { toast('Please enter a complete address.', 'error'); return }

  const btn = document.getElementById('ap-save-btn')
  if (btn) { btn.disabled = true; btn.innerHTML = `${icon('loader','icon-sm')} Registering…` }

  try {
    const r = await fetch('api/patients/create.php', {
      method: 'POST', headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({
        firstName:      first,
        middleName:     gv('ap-middle'),
        lastName:       last,
        gender:         gv('ap-gender'),
        dob:            gv('ap-dob'),
        contact:        gv('ap-contact'),
        email:          gv('ap-email'),
        address:        gv('ap-address'),
        occupation:     gv('ap-occupation'),
        medicalHistory: gv('ap-medical-history'),
      })
    })
    const d = await r.json()
    if (!d.success) { toast(d.message || 'Registration failed.', 'error'); return }

    const p = d.patient
    patients.push({ ...p, password: '', lastVisit: '—' })
    addActivityLog({ id:'L'+Date.now(), user: state.user.name, role: state.role,
      action: `Registered new patient: ${p.name} (${p.id})`,
      timestamp: nowTimestamp(), type:'patient' })
    closeModal()
    renderPage()
    setTimeout(() => window._showRegistrationQRModal(p, d.tempPassword || null), 150)
  } catch (_) {
    toast('Network error — please try again.', 'error')
  } finally {
    if (btn) { btn.disabled = false; btn.innerHTML = `${icon('plus','icon-sm')} Register Patient & Generate QR` }
  }
}

function openEditPatientModal(patientId) {
  const p = patients.find(p => p.id === patientId)
  if (!p) return
  const currentRole = window.state?.user?.role || ''
  const isAdmin = currentRole === 'admin' || currentRole === 'staff'
  showModal(`
    <div class="modal-header">
      <div class="modal-title">Edit Patient — ${p.name}</div>
      <button class="modal-close" onclick="window.closeModal()">&times;</button>
    </div>
    <div class="modal-body">
      <div class="form-row-2">
        <div class="form-group"><label class="form-label">First Name</label>
          <input id="ep-first" class="form-input" value="${p.firstName}"></div>
        <div class="form-group"><label class="form-label">Middle Name</label>
          <input id="ep-middle" class="form-input" value="${p.middleName || ''}"></div>
      </div>
      <div class="form-group"><label class="form-label">Last Name</label>
        <input id="ep-last" class="form-input" value="${p.lastName}"></div>
      <div class="form-row-2">
        <div class="form-group"><label class="form-label">Date of Birth</label>
          ${dobFieldHtml('ep-dob', { value: p.dob || '', max: localDateStr() })}</div>
        <div class="form-group"><label class="form-label">Gender</label>
          ${window.selectFieldHtml('ep-gender', { value: p.gender || '', options: ['Male','Female','Other'] })}</div>
      </div>
      <p style="font-size:.74rem;color:#9CA3AF;margin:-8px 0 14px">Locked on the patient's own Settings page, only admins can update these.</p>
      <div class="form-group"><label class="form-label">Contact</label>
        <input id="ep-contact" class="form-input" inputmode="numeric" maxlength="11" oninput="this.value=this.value.replace(/\D/g,'')" value="${p.contact}"></div>
      <div class="form-group"><label class="form-label">Email</label>
        <input type="email" id="ep-email" class="form-input" value="${p.email}"
               ${!p.email ? 'disabled title="This patient has no login account — email can\'t be set here."' : ''}></div>
      <div class="form-group"><label class="form-label">Address</label>
        <input id="ep-address" class="form-input" value="${p.address}"></div>
      ${isAdmin ? `<div class="form-group"><label class="form-label">Status</label>
        ${window.selectFieldHtml('ep-status', { value: p.status || 'active', options: [{ value: 'active', label: 'Active' }, { value: 'inactive', label: 'Inactive' }] })}</div>` : ''}
      ${isAdmin ? `
      <div style="background:#F9FAFB;border:1px solid #F0F0F2;border-radius:12px;padding:14px 16px;margin-bottom:14px;display:flex;align-items:center;justify-content:space-between;gap:12px;flex-wrap:wrap">
        <div>
          <div style="font-size:.7rem;font-weight:700;letter-spacing:.08em;color:#B0B7C3;text-transform:uppercase;margin-bottom:4px">No-Show Record</div>
          <div style="font-size:.85rem;color:#374151">
            <strong style="color:${(p.noShowCount||0) >= 3 ? '#DC2626' : '#1C1C1C'}">${p.noShowCount || 0}</strong> missed appointment${(p.noShowCount||0) === 1 ? '' : 's'} on file
            ${p.bookingRestricted ? `<span style="margin-left:8px;display:inline-flex;align-items:center;gap:3px;vertical-align:middle;font-size:.68rem;font-weight:700;color:#991B1B;background:#FEE2E2;border-radius:999px;padding:2px 9px">${icon('alert-circle','icon-xs')} Online booking restricted</span>` : ''}
          </div>
        </div>
        ${p.bookingRestricted ? `<button type="button" class="btn-secondary" style="flex-shrink:0" onclick="window.clearBookingRestriction('${p.id}')">Clear Restriction</button>` : ''}
      </div>` : ''}
      <div class="form-group"><label class="form-label">Occupation</label>
        <input id="ep-occupation" class="form-input" placeholder="e.g. Teacher, Engineer, Student" value="${p.occupation || ''}"></div>
      <div class="form-group" style="margin-bottom:0"><label class="form-label">Medical History <span style="font-size:.75rem;color:#9CA3AF;font-weight:400">(optional)</span></label>
        <textarea id="ep-medical-history" class="form-textarea" rows="3" placeholder="Conditions, allergies, ongoing medications, past eye surgeries, etc.">${esc(p.medicalHistory || '')}</textarea>
        <p style="margin:6px 0 0;font-size:.72rem;color:#9CA3AF">Shown to the doctor during examinations so they have it in view while examining.</p>
      </div>
      ${isAdmin && p.email ? `
      <div style="margin-top:4px">
        <div style="background:#F9FAFB;border:1px solid #F0F0F2;border-radius:12px;padding:14px 16px;display:flex;flex-direction:column;gap:12px">
          <div style="display:flex;align-items:center;gap:8px">
            <div style="width:26px;height:26px;background:white;border:1px solid #E9EAEC;border-radius:7px;display:flex;align-items:center;justify-content:center;color:#9CA3AF;flex-shrink:0">
              ${icon('shield','icon-xs')}
            </div>
            <span style="font-size:.7rem;font-weight:700;letter-spacing:.08em;color:#B0B7C3;text-transform:uppercase">Security</span>
          </div>
          <div>
            <div id="ep-temp-row" style="display:flex;align-items:center;gap:12px;margin-bottom:6px">
              <p style="margin:0;font-size:.82rem;font-weight:600;color:#374151;flex:1">Temporary Password</p>
              <div id="ep-temp-wrap" style="flex-shrink:0;display:flex;flex-direction:column;align-items:flex-end;gap:4px">
                <button type="button" id="ep-temp-btn"
                        onclick="window.checkTempPassword('${patientId}')"
                        style="background:white;border:1px solid #E5E7EB;border-radius:7px;padding:0 11px;font-size:.75rem;font-weight:600;color:#6B7280;cursor:pointer;display:inline-flex;align-items:center;gap:5px;white-space:nowrap;box-shadow:0 1px 2px rgba(0,0,0,.04);transition:background .15s,border-color .15s,color .15s,box-shadow .15s;height:26px;box-sizing:border-box"
                        onmouseenter="if(!this.disabled){this.style.background='#FFF7ED';this.style.borderColor='#FDE68A';this.style.color='#D97706';this.style.boxShadow='0 2px 8px rgba(217,119,6,.18)'}"
                        onmouseleave="if(!this.disabled){this.style.background='white';this.style.borderColor='#E5E7EB';this.style.color='#6B7280';this.style.boxShadow='0 1px 2px rgba(0,0,0,.04)'}">
                  ${icon('eye','icon-xs')} Check
                </button>
              </div>
            </div>
            <p style="margin:0;font-size:.74rem;color:#9CA3AF">Auto-generated at registration. Check if the patient has changed it.</p>
          </div>
          <div style="border-top:1px solid #ECEDF0;padding-top:12px">
            <button type="button" onclick="window._toggleEpPwReset()"
                    style="display:flex;align-items:center;gap:6px;background:none;border:none;color:#6B7280;font-size:.82rem;font-weight:600;cursor:pointer;padding:0;font-family:inherit;width:100%">
              ${icon('lock','icon-xs')} Reset Password
              <span id="ep-pw-chevron" style="font-size:.7rem;margin-left:auto;transition:transform .18s ease">▸</span>
            </button>
            <div id="ep-pw-section" style="display:none;margin-top:12px">
              <div class="form-row-2">
                <div class="form-group" style="margin-bottom:0"><label class="form-label">New Password</label>
                  <div style="position:relative">
                    <input type="password" id="ep-newpass" class="form-input" style="padding-right:40px" placeholder="Min. 8 characters"
                           autocomplete="new-password" oninput="window.syncEpPassHint();window.updatePwChecklist('ep-newpass', this.value)">
                    <button type="button" onclick="window.togglePwVisibility('ep-newpass',this)"
                            style="position:absolute;right:10px;top:50%;transform:translateY(-50%);background:none;border:none;cursor:pointer;color:#9CA3AF;padding:2px;display:flex;align-items:center">
                      ${icon('eye-off', 'icon-sm')}
                    </button>
                  </div></div>
                <div class="form-group" style="margin-bottom:0"><label class="form-label">Confirm Password</label>
                  <div style="position:relative">
                    <input type="password" id="ep-newpass2" class="form-input" style="padding-right:40px" placeholder="Re-enter password"
                           autocomplete="new-password" oninput="window.syncEpPassHint()">
                    <button type="button" onclick="window.togglePwVisibility('ep-newpass2',this)"
                            style="position:absolute;right:10px;top:50%;transform:translateY(-50%);background:none;border:none;cursor:pointer;color:#9CA3AF;padding:2px;display:flex;align-items:center">
                      ${icon('eye-off', 'icon-sm')}
                    </button>
                  </div></div>
              </div>
              ${window.pwChecklistHtml('ep-newpass')}
              <p id="ep-pass-hint" style="margin:7px 0 0;font-size:.74rem;color:#9CA3AF">Leave blank to keep the existing password.</p>
            </div>
          </div>
        </div>
      </div>` : ''}
    </div>
    <div class="modal-footer">
      <button class="btn-secondary" onclick="window.closeModal()">Cancel</button>
      <button id="ep-save-btn" class="btn-primary" onclick="window.doEditPatient('${patientId}')">Save Changes</button>
    </div>`)
}

async function doEditPatient(patientId) {
  const p  = patients.find(p => p.id === patientId)
  const gv = id => (document.getElementById(id)||{}).value?.trim() || ''
  if (!p) return

  const firstName = gv('ep-first')
  const lastName  = gv('ep-last')
  if (!firstName || !lastName) { toast('First and last name are required.', 'error'); return }
  const epContact = gv('ep-contact')
  if (epContact && !window.isValidContact(epContact)) { toast('Please enter a valid 11-digit contact number.', 'error'); return }
  const epAddress = gv('ep-address')
  if (epAddress && !window.looksLikeAddress(epAddress)) { toast('Please enter a complete address.', 'error'); return }

  // Optional password change
  const np  = (document.getElementById('ep-newpass')  || {}).value || ''
  const np2 = (document.getElementById('ep-newpass2') || {}).value || ''
  // Password policy/match is enforced live (inline hint + checklist) and
  // the Save button is disabled until valid — this is just a safety net.
  if ((np || np2) && (!window.pwPolicyValid(np) || np !== np2)) return

  const statusEl = document.getElementById('ep-status')
  const payload = {
    id: patientId, firstName, middleName: gv('ep-middle'), lastName,
    gender: gv('ep-gender'), dob: gv('ep-dob'),
    contact: gv('ep-contact'), email: gv('ep-email'),
    address: gv('ep-address'),
    occupation: gv('ep-occupation'),
    medicalHistory: gv('ep-medical-history'),
    ...(statusEl ? { status: statusEl.value } : {})
  }

  try {
    const r = await fetch('api/patients/admin_update.php', {
      method: 'POST', headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify(payload)
    })
    const d = await r.json()
    if (!d.success) { toast(d.message || 'Could not update patient.', 'error'); return }
  } catch (_) {
    toast('Network error — could not update patient.', 'error')
    return
  }

  // Reset password if new password was provided
  if (np) {
    try {
      const r = await fetch('api/users/reset_password.php', {
        method: 'POST', headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ profileId: patientId, role: 'Patient', newPassword: np })
      })
      const d = await r.json()
      if (!d.success) { toast(d.message || 'Profile saved but password could not be updated.', 'error'); return }
    } catch (_) {
      toast('Profile saved but password reset failed (network error).', 'error')
      return
    }
  }

  p.firstName  = firstName
  p.middleName = payload.middleName
  p.lastName   = lastName
  p.name       = fmtFullName(firstName, payload.middleName, lastName)
  if (payload.gender) p.gender = payload.gender
  // age isn't its own editable field — the backend derives and saves it
  // from dob — but the local cache needs the same recompute done to it,
  // or the UI keeps showing the pre-edit age until a full reload.
  if (payload.dob) { p.dob = payload.dob; p.age = ageFromDob(payload.dob) }
  p.contact       = payload.contact
  if (payload.email && p.email) p.email = payload.email
  p.address       = payload.address
  p.occupation    = payload.occupation
  p.medicalHistory = payload.medicalHistory
  if (payload.status) p.status = payload.status

  closeModal()
  toast(np ? 'Patient info and password updated.' : 'Patient info updated.')
  renderPage()
}

window._toggleEpPwReset = function() {
  const sec = document.getElementById('ep-pw-section')
  const ch  = document.getElementById('ep-pw-chevron')
  if (!sec) return
  const open = sec.style.display === 'none'
  sec.style.display = open ? '' : 'none'
  if (ch) ch.textContent = open ? '▾' : '▸'
}

window.syncEpPassHint = function() {
  const hint = document.getElementById('ep-pass-hint')
  const btn  = document.getElementById('ep-save-btn')
  const np   = (document.getElementById('ep-newpass')  || {}).value || ''
  const np2  = (document.getElementById('ep-newpass2') || {}).value || ''
  const blank = !np && !np2
  const ok    = blank || (np && np2 && np === np2 && window.pwPolicyValid(np))
  if (btn) {
    btn.disabled      = !ok
    btn.style.opacity = ok ? '' : '.55'
    btn.style.cursor  = ok ? '' : 'not-allowed'
  }
  if (!hint) return
  if (blank) {
    hint.textContent = 'Leave blank to keep the existing password.'
    hint.style.color = '#9CA3AF'
  } else if (ok) {
    hint.textContent = '✓ Passwords match. Will update on Save.'
    hint.style.color = '#059669'
  } else if (np2 && np !== np2) {
    hint.textContent = 'Passwords do not match.'
    hint.style.color = '#DC2626'
  } else if (np.length > 0 && !window.pwPolicyValid(np)) {
    hint.textContent = 'Password does not meet the requirements below.'
    hint.style.color = '#D97706'
  } else {
    hint.textContent = 'Leave blank to keep the existing password.'
    hint.style.color = '#9CA3AF'
  }
}

window.checkTempPassword = async function(patientId) {
  const btn = document.getElementById('ep-temp-btn')
  if (!btn) return
  btn.disabled = true
  btn.onmouseenter = null
  btn.onmouseleave = null
  btn.innerHTML = `<span style="display:inline-block;width:9px;height:9px;border:2px solid #D1D5DB;border-top-color:#9CA3AF;border-radius:50%;animation:spin .6s linear infinite;flex-shrink:0"></span> Checking`
  try {
    const r = await fetch('api/patients/get_temp_password.php', {
      method: 'POST', headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({ patientId })
    })
    const d = await r.json()
    if (!d.success) {
      btn.style.cssText = `display:inline-flex;align-items:center;gap:5px;background:#FEF2F2;border:1px solid #FECACA;border-radius:7px;padding:0 11px;font-size:.75rem;font-weight:600;color:#DC2626;cursor:default;white-space:nowrap;height:26px;box-sizing:border-box`
      btn.innerHTML = `${icon('alert-circle','icon-xs')} ${d.message}`
      return
    }
    if (d.isTemp) {
      btn.style.cssText = `display:inline-flex;align-items:center;gap:6px;background:#FFFBEB;border:1px solid #FDE68A;border-radius:7px;padding:0 10px;cursor:default;white-space:nowrap;height:26px;box-sizing:border-box`
      btn.innerHTML = `
        <code id="ep-temp-val" style="font-size:.83rem;font-weight:700;color:#92400E;letter-spacing:.04em;font-family:'Courier New',monospace">${d.tempPassword}</code>
        <span onclick="window.copyTempPassword()" title="Copy" style="cursor:pointer;color:#D97706;display:inline-flex;align-items:center;opacity:.65;transition:opacity .15s" onmouseenter="this.style.opacity=1" onmouseleave="this.style.opacity=.65">${icon('copy','icon-xs')}</span>
        <span style="display:inline-flex;align-items:center;gap:3px;font-size:.7rem;color:#D97706;font-weight:600;padding-left:2px;border-left:1px solid #FDE68A">${icon('alert-circle','icon-xs')} Not yet changed</span>`
    } else {
      btn.style.cssText = `display:inline-flex;align-items:center;gap:5px;background:#F0FDF4;border:1px solid #BBF7D0;border-radius:7px;padding:0 11px;cursor:default;white-space:nowrap;height:26px;box-sizing:border-box`
      btn.innerHTML = `<span style="color:#16A34A;display:flex;align-items:center">${icon('check-circle','icon-xs')}</span><span style="font-size:.75rem;font-weight:600;color:#15803D">Changed by patient</span>`
    }
  } catch (_) {
    btn.style.cssText = `display:inline-flex;align-items:center;gap:5px;background:#FEF2F2;border:1px solid #FECACA;border-radius:7px;padding:0 11px;font-size:.75rem;font-weight:600;color:#DC2626;cursor:default;white-space:nowrap;height:26px;box-sizing:border-box`
    btn.innerHTML = `${icon('alert-circle','icon-xs')} Network error`
  }
}

window.copyTempPassword = function() {
  const val = document.getElementById('ep-temp-val')
  if (!val) return
  navigator.clipboard.writeText(val.textContent.trim()).then(() => toast('Temp password copied.'))
}

window.openAddPatientModal  = openAddPatientModal
window.doAddPatient         = doAddPatient
window.openEditPatientModal = openEditPatientModal
window.doEditPatient        = doEditPatient

async function clearBookingRestriction(patientId) {
  try {
    const r = await fetch('api/patients/clear_restriction.php', {
      method:  'POST',
      headers: { 'Content-Type': 'application/json' },
      body:    JSON.stringify({ id: patientId })
    })
    const d = await r.json()
    if (!d.success) { toast(d.message || 'Could not clear restriction.', 'error'); return }
    const p = patients.find(p => p.id === patientId)
    if (p) p.bookingRestricted = false
    addActivityLog({ id:'L'+Date.now(), user: state.user.name, role: state.role,
      action: `Cleared online booking restriction for ${p ? p.name : patientId}`,
      timestamp: nowTimestamp(), type:'patient' })
    toast('Booking restriction cleared. The patient can book online again.')
    closeModal()
    renderPage()
  } catch (_) {
    toast('Network error — please try again.', 'error')
  }
}
window.clearBookingRestriction = clearBookingRestriction

// ════════════════════════════════════════════════════════════════
//  EMAIL PATIENT — a direct, un-threaded message (unlike the Contact
//  Messages reply flow, which replies to an existing inbound message).
//  Reuses the exact same branded HTML email template server-side
//  (see api/patients/email.php's patientEmailBody(), mirrors
//  api/contact/reply.php's replyEmailBody()) so patients see a
//  consistent look no matter which flow sent them mail.
// ════════════════════════════════════════════════════════════════
function openPatientEmailModal(patientId) {
  const p = patients.find(p => p.id === patientId)
  if (!p) return
  if (!p.email) { toast("This patient has no email on file — they don't have a login account.", 'error'); return }

  showModal(`
    <div class="modal-header">
      <div class="modal-title">Email ${p.name}</div>
      <button class="modal-close" onclick="window.closeModal()">&times;</button>
    </div>
    <div class="modal-body">
      <p style="margin:0 0 14px;font-size:.78rem;color:#9CA3AF">Sent to <strong style="color:#374151">${p.email}</strong> by email.</p>
      <div class="form-group">
        <label class="form-label">Subject <span class="req">*</span></label>
        <input id="pe-subject" type="text" class="form-input" placeholder="e.g. Regarding your upcoming appointment">
      </div>
      <div class="form-group" style="margin:0">
        <label class="form-label">Message <span class="req">*</span></label>
        <textarea id="pe-message" class="form-textarea" style="border-radius:8px;min-height:140px"
                  placeholder="Type your message…"></textarea>
      </div>
      <div id="pe-error" class="field-error"></div>
    </div>
    <div class="modal-footer">
      <button class="btn-secondary" onclick="window.closeModal()">Cancel</button>
      <button id="pe-send-btn" class="btn-primary" onclick="window.sendPatientEmail('${patientId}')">
        ${icon('mail', 'icon-sm')} Send Email
      </button>
    </div>`)

  setTimeout(() => { document.getElementById('pe-subject')?.focus() }, 50)
}
window.openPatientEmailModal = openPatientEmailModal

async function sendPatientEmail(patientId) {
  const p = patients.find(p => p.id === patientId)
  if (!p) return

  const subjEl  = document.getElementById('pe-subject')
  const msgEl   = document.getElementById('pe-message')
  const errBox  = document.getElementById('pe-error')
  const sendBtn = document.getElementById('pe-send-btn')
  const subject = (subjEl?.value || '').trim()
  const message = (msgEl?.value || '').trim()

  if (!subject || !message) {
    if (errBox) { errBox.textContent = 'Please fill in both subject and message.'; errBox.classList.add('show') }
    return
  }

  sendBtn.disabled = true
  sendBtn.innerHTML = `${icon('refresh-cw', 'icon-sm')} Sending…`

  try {
    const r = await fetch('api/patients/email.php', {
      method: 'POST', headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({ patientId, subject, message })
    })
    const d = await r.json()
    if (!d.success) {
      sendBtn.disabled = false
      sendBtn.innerHTML = `${icon('mail', 'icon-sm')} Send Email`
      if (errBox) { errBox.textContent = d.message || 'Failed to send email.'; errBox.classList.add('show') }
      return
    }
    closeModal()
    toast(`Email sent to ${p.name}.`, 'success')
  } catch (_) {
    sendBtn.disabled = false
    sendBtn.innerHTML = `${icon('mail', 'icon-sm')} Send Email`
    if (errBox) { errBox.textContent = 'Network error. Please try again.'; errBox.classList.add('show') }
  }
}
window.sendPatientEmail = sendPatientEmail

// ════════════════════════════════════════════════════════════════
//  DELETE PATIENT
// ════════════════════════════════════════════════════════════════
function confirmArchivePatient(id) {
  const p = patients.find(p => p.id === id)
  if (!p) return
  showModal(`
    <div class="modal-header">
      <div class="modal-title" style="display:flex;align-items:center;gap:10px">
        <div style="width:32px;height:32px;border-radius:50%;background:#fef3c7;display:flex;align-items:center;justify-content:center;flex-shrink:0;color:#d97706">
          ${icon('archive','icon-sm')}
        </div>
        Archive Patient: ${p.name}
      </div>
      <button class="modal-close" onclick="window.closeModal()">&times;</button>
    </div>
    <div class="modal-body">
      <div style="display:flex;align-items:center;gap:12px;padding:12px;background:#F9FAFB;border-radius:8px;margin-bottom:16px">
        <div style="width:42px;height:42px;border-radius:50%;background:#E8760A;display:flex;align-items:center;justify-content:center;color:#fff;font-weight:700;flex-shrink:0;overflow:hidden">
          ${p.photoUrl ? `<img src="${p.photoUrl}" alt="${p.name}" style="width:100%;height:100%;object-fit:cover;border-radius:50%;display:block" onerror="${window.avatarFallbackAttr(p.name)}">` : p.name.split(' ').map(n=>n[0]).slice(0,2).join('')}
        </div>
        <div>
          <div style="font-weight:700">${p.name}</div>
          <div style="font-size:.78rem;color:#6B7280">${p.id} &bull; ${p.consultations.length} consultation${p.consultations.length!==1?'s':''} &bull; ${p.examinations.length} exam${p.examinations.length!==1?'s':''}</div>
        </div>
      </div>
      <p style="font-size:.88rem;color:#6b7280;margin-bottom:16px">Are you sure you want to archive this patient? They will be removed from active lists but the data will be preserved.</p>
      <div class="form-group" style="margin:0">
        <label class="form-label">Reason for Archiving <span class="req">*</span></label>
        <textarea id="archive-reason-patient" class="form-textarea" style="border-radius:8px;min-height:80px"
                  placeholder="Please provide a reason for archiving…"></textarea>
      </div>
    </div>
    <div class="modal-footer">
      <button class="btn-secondary" onclick="window.closeModal()">Cancel</button>
      <button id="do-archive-patient-btn" class="btn-primary" disabled
              onclick="window.doArchivePatient('${id}')">
        ${icon('archive','icon-sm')}<span>Archive</span>
      </button>
    </div>`)
  setTimeout(() => {
    const ta = document.getElementById('archive-reason-patient')
    const btn = document.getElementById('do-archive-patient-btn')
    if (ta && btn) ta.addEventListener('input', () => { btn.disabled = !ta.value.trim() })
  }, 50)
}

async function doArchivePatient(id) {
  const idx = patients.findIndex(p => p.id === id)
  if (idx === -1) return
  const p = patients[idx]
  const reason = (document.getElementById('archive-reason-patient') || {}).value?.trim() || 'No reason provided'

  const btn = document.getElementById('do-archive-patient-btn')
  if (_btnBusy(btn, 'primary', 'Archiving…')) return

  try {
    const r = await fetch('api/archive/create.php', {
      method: 'POST', headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({ profileId: id, role: 'Patient', type: 'Patient', name: p.name, reason, archivedBy: state.user.name })
    })
    const d = await r.json()
    if (!d.success) { toast(d.message || 'Failed to archive patient.', 'error'); _btnIdle(btn); return }
    patients.splice(idx, 1)
    archivedRecords.push(d.record)
  } catch (_) { toast('Network error — patient not archived.', 'error'); _btnIdle(btn); return }

  addActivityLog({ id:'L'+Date.now(), user: state.user.name, role: state.role,
    action: `Archived patient: ${p.name} (${id}) — Reason: ${reason}`,
    timestamp: nowTimestamp(), type:'patient' })
  closeModal()
  toast(`Patient archived successfully. The record can be restored from Settings > Archives.`, 'success')
  // Archiving from the patient's own profile page (e.g. the deletion-request
  // banner's Archive button) just removed the record renderPage() would try
  // to redraw that same page from — back out to the list instead of landing
  // on a "No matching patient record found" error.
  if (state.page === 'patient-view' && state.params?.patientId === id) {
    navigate('patient-list')
  } else {
    renderPage()
  }
}

async function togglePatientStatus(id) {
  const p = patients.find(p => p.id === id)
  if (!p) return
  const newStatus = (p.status || 'active') === 'active' ? 'inactive' : 'active'
  try {
    const r = await fetch('api/patients/admin_update.php', {
      method: 'POST', headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({ id, firstName: p.firstName || p.name.split(' ')[0], lastName: p.lastName || p.name.split(' ').slice(1).join(' '), status: newStatus })
    })
    const d = await r.json()
    if (!d.success) { toast(d.message || 'Failed to update status.', 'error'); return }
    p.status = newStatus
    addActivityLog({ id:'L'+Date.now(), user: state.user.name, role: state.role,
      action: `${newStatus === 'active' ? 'Activated' : 'Deactivated'} patient: ${p.name} (${id})`,
      timestamp: nowTimestamp(), type:'patient' })
    toast(`${p.name} has been ${newStatus === 'active' ? 'activated' : 'deactivated'}.`, 'success')
    renderPage()
  } catch (_) { toast('Network error — status not changed.', 'error') }
}

window.confirmArchivePatient = confirmArchivePatient
window.doArchivePatient      = doArchivePatient
window.togglePatientStatus   = togglePatientStatus

// ════════════════════════════════════════════════════════════════
//  PATIENT SELF-SERVICE — Request Account Deletion (patient role only)
//  Only ever sends a request to admin/staff (api/patients/request-
//  deletion.php) — never deletes anything itself. Admin/staff fulfills it
//  by archiving the patient as normal (which now also clears the flag,
//  see api/archive/create.php), or dismisses it (dismissDeletionRequest()
//  below) to leave the account untouched.
// ════════════════════════════════════════════════════════════════
function openRequestDeletionModal() {
  showModal(`
    <div class="modal-header">
      <div class="modal-title" style="display:flex;align-items:center;gap:8px">
        <div style="width:32px;height:32px;border-radius:8px;background:#FEE2E2;display:flex;align-items:center;justify-content:center;color:#DC2626">
          ${icon('user-x','icon-sm')}
        </div>
        Request Account Deletion
      </div>
      <button class="modal-close" onclick="window.closeModal()">&times;</button>
    </div>
    <div class="modal-body">
      <p style="font-size:.88rem;color:#6b7280;margin-bottom:16px">
        This sends a request to clinic staff, it doesn't delete anything right away. Your account and records stay exactly as they are until staff reviews it, and you can cancel this request any time before then.
      </p>
      <div class="form-group" style="margin:0">
        <label class="form-label">Reason <span style="color:#9CA3AF;font-weight:400">(optional)</span></label>
        <textarea id="del-req-reason" class="form-textarea" style="border-radius:8px;min-height:80px" maxlength="500"
                  placeholder="Let the clinic know why, if you'd like…"></textarea>
      </div>
    </div>
    <div class="modal-footer">
      <button class="btn-secondary" onclick="window.closeModal()">Cancel</button>
      <button id="submit-del-req-btn" class="btn-primary" style="background:#DC2626"
              onclick="window.submitDeletionRequest(this)">
        ${icon('user-x','icon-sm')}<span>Send Request</span>
      </button>
    </div>`)
}
window.openRequestDeletionModal = openRequestDeletionModal

async function submitDeletionRequest(btnEl) {
  const reason = (document.getElementById('del-req-reason') || {}).value?.trim() || ''
  if (btnEl) { btnEl.disabled = true; btnEl.textContent = 'Sending…' }
  try {
    const r = await fetch('api/patients/request-deletion.php', {
      method: 'POST', headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({ reason })
    })
    const d = await r.json()
    if (!d.success) {
      toast(d.message || 'Could not send the request.', 'error')
      if (btnEl) { btnEl.disabled = false; btnEl.innerHTML = `${icon('user-x','icon-sm')}<span>Send Request</span>` }
      return
    }
    if (state.user) { state.user.deletionRequestedAt = new Date().toISOString(); state.user.deletionRequestReason = reason }
    closeModal()
    toast('Deletion request sent. Clinic staff will review it.', 'success')
    renderPage()
  } catch (_) {
    toast('Network error. Please try again.', 'error')
    if (btnEl) { btnEl.disabled = false; btnEl.innerHTML = `${icon('user-x','icon-sm')}<span>Send Request</span>` }
  }
}
window.submitDeletionRequest = submitDeletionRequest

async function cancelDeletionRequest(btnEl) {
  if (btnEl) { btnEl.disabled = true; btnEl.textContent = 'Cancelling…' }
  try {
    const r = await fetch('api/patients/cancel-deletion-request.php', { method: 'POST' })
    const d = await r.json()
    if (!d.success) {
      toast(d.message || 'Could not cancel the request.', 'error')
      if (btnEl) { btnEl.disabled = false; btnEl.innerHTML = `${icon('x','icon-sm')} Cancel Request` }
      return
    }
    if (state.user) { state.user.deletionRequestedAt = null; state.user.deletionRequestReason = '' }
    toast('Deletion request cancelled.', 'success')
    renderPage()
  } catch (_) {
    toast('Network error. Please try again.', 'error')
    if (btnEl) { btnEl.disabled = false; btnEl.innerHTML = `${icon('x','icon-sm')} Cancel Request` }
  }
}
window.cancelDeletionRequest = cancelDeletionRequest

// Admin/staff — declines the request without archiving the patient.
async function dismissDeletionRequest(patientId, btnEl) {
  if (btnEl) { btnEl.disabled = true; btnEl.textContent = 'Dismissing…' }
  try {
    const r = await fetch('api/patients/dismiss-deletion-request.php', {
      method: 'POST', headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({ patientId })
    })
    const d = await r.json()
    if (!d.success) {
      toast(d.message || 'Could not dismiss the request.', 'error')
      if (btnEl) { btnEl.disabled = false; btnEl.innerHTML = `${icon('x','icon-sm')} Dismiss Request` }
      return
    }
    const p = patients.find(p => p.id === patientId)
    if (p) { p.deletionRequestedAt = null; p.deletionRequestReason = '' }
    toast('Deletion request dismissed. The account remains active.', 'success')
    renderPage()
  } catch (_) {
    toast('Network error. Please try again.', 'error')
    if (btnEl) { btnEl.disabled = false; btnEl.innerHTML = `${icon('x','icon-sm')} Dismiss Request` }
  }
}
window.dismissDeletionRequest = dismissDeletionRequest

// ════════════════════════════════════════════════════════════════
//  CONTACT MESSAGES — view / read state / delete
// ════════════════════════════════════════════════════════════════
function openContactMessageModal(id) {
  const m = contactMessages.find(m => m.id === id)
  if (!m) return

  // Mutate (and persist) the read state BEFORE building the modal markup —
  // otherwise the toggle button below renders against the pre-open state
  // and ends up showing "Mark as read" right after the message was already
  // silently marked read, so clicking it actually marks it unread instead.
  if (!m.isRead) _setContactMessageRead(id, true, true)

  const dt = new Date(m.createdAt)
  const fullDate = isNaN(dt) ? m.createdAt : dt.toLocaleString('en-PH', { year: 'numeric', month: 'long', day: 'numeric', hour: 'numeric', minute: '2-digit', hour12: true })

  const replyHtml = m.reply ? (() => {
    const rdt = new Date(m.repliedAt)
    const rDate = isNaN(rdt) ? m.repliedAt : rdt.toLocaleString('en-PH', { month: 'short', day: 'numeric', hour: 'numeric', minute: '2-digit', hour12: true })
    return `
      <div style="margin-top:14px">
        <p style="margin:0 0 6px;font-size:.72rem;font-weight:700;letter-spacing:.04em;text-transform:uppercase;color:#9CA3AF">
          Replied by ${m.repliedBy || 'Clinic Staff'} &bull; ${rDate}
        </p>
        <div style="background:#FFF8F0;border:1.5px solid #FFD9A8;border-radius:10px;padding:16px;font-size:.88rem;color:#1C1C1C;line-height:1.6;white-space:pre-wrap;overflow-wrap:anywhere;word-break:break-word">${m.reply}</div>
      </div>`
  })() : ''

  showModal(`
    <div class="modal-header">
      <div class="modal-title" style="display:flex;align-items:center;gap:10px">
        ${avatar(m.name, 'patient-avatar', _accountPhotoForEmail(m.email, m.name))}
        <div>
          <div>${m.name}</div>
          <div style="font-size:.72rem;font-weight:500;color:#9CA3AF">${m.email}</div>
        </div>
      </div>
      <button class="modal-close" onclick="window.closeModal()">&times;</button>
    </div>
    <div class="modal-body">
      <div style="display:flex;gap:16px;flex-wrap:wrap;margin-bottom:14px;font-size:.78rem;color:#6B7280">
        ${m.service ? `<span><strong style="color:#374151">Service:</strong> ${m.service}</span>` : ''}
        <span><strong style="color:#374151">Received:</strong> ${fullDate}</span>
      </div>
      <div style="background:#F9FAFB;border:1px solid #E5E7EB;border-radius:10px;padding:16px;font-size:.88rem;color:#374151;line-height:1.6;white-space:pre-wrap;overflow-wrap:anywhere;word-break:break-word">${m.message}</div>
      ${replyHtml}
    </div>
    <div class="modal-footer" style="justify-content:space-between;flex-wrap:wrap;gap:8px">
      <div style="display:flex;gap:8px">
        <button type="button" class="btn-ghost" style="display:inline-flex;align-items:center;gap:6px"
                onclick="window.markContactMessageUnread(${m.id})">
          ${icon('mail-open', 'icon-sm')} Mark as Unread
        </button>
        <button type="button" class="btn-ghost" style="display:inline-flex;align-items:center;gap:6px"
                onclick="window.toggleContactMessageArchive(${m.id})">
          ${icon('archive', 'icon-sm')} ${m.archivedAt ? 'Unarchive' : 'Archive'}
        </button>
      </div>
      <div style="display:flex;gap:8px">
        <button class="btn-secondary" onclick="window.closeModal()">Close</button>
        <button class="btn-primary" onclick="window.openContactReplyModal(${m.id})">
          ${icon('mail', 'icon-sm')} ${m.reply ? 'Edit Reply' : 'Reply'}
        </button>
      </div>
    </div>`, 'modal-lg')
}
window.openContactMessageModal = openContactMessageModal

async function _setContactMessageRead(id, read, rerender = true) {
  const m = contactMessages.find(m => m.id === id)
  if (!m) return
  m.isRead = read
  window._contactUnreadCount = contactMessages.filter(x => !x.isRead).length
  if (window._updateContactUI) window._updateContactUI()
  if (window._updateSidebarBadges) window._updateSidebarBadges()
  if (rerender) renderPage()
  try {
    await fetch('api/contact/mark_read.php', {
      method: 'POST', headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({ id, read })
    })
  } catch (_) { /* local state already updated; will reconcile on next sync */ }
}

// Opening a message already marks it read (see the guard at the top of
// openContactMessageModal), so by the time this modal is on screen the only
// meaningful manual action left is un-reading it.
function markContactMessageUnread(id) {
  _setContactMessageRead(id, false, true)
  // Marking unread while viewing is a bit contradictory — return to the inbox
  closeModal()
}
window.markContactMessageUnread = markContactMessageUnread

// ── Archive ──────────────────────────────────────────────────────
async function toggleContactMessageArchive(id) {
  const m = contactMessages.find(m => m.id === id)
  if (!m) return
  const archive = !m.archivedAt
  m.archivedAt = archive ? new Date().toISOString() : null
  closeModal()
  renderPage()
  try {
    await fetch('api/contact/archive.php', {
      method: 'POST', headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({ id, archived: archive })
    })
    toast(archive ? 'Message archived.' : 'Message moved back to inbox.', 'success')
  } catch (_) {
    toast('Network error — change may not have saved.', 'error')
  }
}
window.toggleContactMessageArchive = toggleContactMessageArchive

// ── Reply ────────────────────────────────────────────────────────
function openContactReplyModal(id) {
  const m = contactMessages.find(m => m.id === id)
  if (!m) return

  showModal(`
    <div class="modal-header">
      <div class="modal-title">Reply to ${m.name}</div>
      <button class="modal-close" onclick="window.closeModal()">&times;</button>
    </div>
    <div class="modal-body">
      <p style="margin:0 0 10px;font-size:.78rem;color:#9CA3AF">Sent to <strong style="color:#374151">${m.email}</strong> by email.</p>
      <div style="border-left:3px solid #e5e7eb;padding:2px 0 2px 14px;margin-bottom:14px;font-size:.8rem;color:#6B7280;line-height:1.55;max-height:90px;overflow:auto">${m.message}</div>
      <div class="form-group" style="margin:0">
        <label class="form-label">Your Reply <span class="req">*</span></label>
        <textarea id="cr-reply-text" class="form-textarea" style="border-radius:8px;min-height:120px"
                  placeholder="Type your reply…">${m.reply || ''}</textarea>
      </div>
      <div id="cr-reply-error" class="field-error"></div>
    </div>
    <div class="modal-footer">
      <button class="btn-secondary" onclick="window.openContactMessageModal(${id})">Back</button>
      <button id="cr-send-btn" class="btn-primary" onclick="window.sendContactReply(${id})">
        ${icon('mail', 'icon-sm')} Send Reply
      </button>
    </div>`)

  setTimeout(() => { document.getElementById('cr-reply-text')?.focus() }, 50)
}
window.openContactReplyModal = openContactReplyModal

async function sendContactReply(id) {
  const m = contactMessages.find(m => m.id === id)
  if (!m) return

  const ta       = document.getElementById('cr-reply-text')
  const errBox   = document.getElementById('cr-reply-error')
  const sendBtn  = document.getElementById('cr-send-btn')
  const replyTxt = (ta?.value || '').trim()

  if (!replyTxt) {
    if (errBox) { errBox.textContent = 'Please write a reply before sending.'; errBox.classList.add('show') }
    return
  }

  sendBtn.disabled = true
  sendBtn.innerHTML = `${icon('refresh-cw', 'icon-sm')} Sending…`

  try {
    const r = await fetch('api/contact/reply.php', {
      method: 'POST', headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({ id, reply: replyTxt })
    })
    const d = await r.json()
    if (!d.success) {
      sendBtn.disabled = false
      sendBtn.innerHTML = `${icon('mail', 'icon-sm')} Send Reply`
      if (errBox) { errBox.textContent = d.message || 'Failed to send reply.'; errBox.style.display = 'block' }
      return
    }
    m.reply     = replyTxt
    m.repliedAt = new Date().toISOString()
    m.repliedBy = state.user?.name || 'Clinic Staff'
    toast(d.emailSent ? 'Reply sent and emailed to the sender.' : 'Reply saved (email could not be sent).', 'success')
    openContactMessageModal(id)
    renderPage()
  } catch (_) {
    sendBtn.disabled = false
    sendBtn.innerHTML = `${icon('mail', 'icon-sm')} Send Reply`
    if (errBox) { errBox.textContent = 'Network error. Please try again.'; errBox.style.display = 'block' }
  }
}
window.sendContactReply = sendContactReply

async function markAllContactRead() {
  contactMessages.forEach(m => { m.isRead = true })
  window._contactUnreadCount = 0
  if (window._updateContactUI) window._updateContactUI()
  if (window._updateSidebarBadges) window._updateSidebarBadges()
  renderPage()
  try {
    await fetch('api/contact/mark_read.php', {
      method: 'POST', headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({ all: true })
    })
  } catch (_) {}
}
window.markAllContactRead = markAllContactRead

function confirmDeleteContactMessage(id) {
  const m = contactMessages.find(m => m.id === id)
  if (!m) return
  showModal(`
    <div class="modal-header">
      <div class="modal-title" style="display:flex;align-items:center;gap:10px">
        <div style="width:32px;height:32px;border-radius:50%;background:#fee2e2;display:flex;align-items:center;justify-content:center;flex-shrink:0;color:#DC2626">
          ${icon('trash-2','icon-sm')}
        </div>
        Delete Message
      </div>
      <button class="modal-close" onclick="window.closeModal()">&times;</button>
    </div>
    <div class="modal-body">
      <p style="font-size:.88rem;color:#374151">Delete the message from <strong>${m.name}</strong>? This cannot be undone.</p>
    </div>
    <div class="modal-footer">
      <button class="btn-secondary" onclick="window.closeModal()">Cancel</button>
      <button id="del-contact-msg-btn" style="background:#DC2626;color:white;border:none;border-radius:8px;padding:9px 20px;font-family:'Poppins',sans-serif;font-size:.85rem;font-weight:600;cursor:pointer;display:inline-flex;align-items:center;gap:6px;transition:opacity .15s" onmouseover="this.style.opacity='.85'" onmouseout="this.style.opacity='1'"
              onclick="window.doDeleteContactMessage(${id})">
        ${icon('trash-2','icon-sm')}<span>Delete</span>
      </button>
    </div>`)
}
window.confirmDeleteContactMessage = confirmDeleteContactMessage

async function doDeleteContactMessage(id) {
  const idx = contactMessages.findIndex(m => m.id === id)
  if (idx === -1) return
  const btn = document.getElementById('del-contact-msg-btn')
  if (_btnBusy(btn, 'danger', 'Deleting…')) return
  try {
    const r = await fetch('api/contact/delete.php', {
      method: 'POST', headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({ id })
    })
    const d = await r.json()
    if (!d.success) { toast(d.message || 'Failed to delete message.', 'error'); _btnIdle(btn); return }
  } catch (_) { toast('Network error — message not deleted.', 'error'); _btnIdle(btn); return }

  contactMessages.splice(idx, 1)
  window._contactUnreadCount = contactMessages.filter(m => !m.isRead).length
  if (window._updateContactUI) window._updateContactUI()
  if (window._updateSidebarBadges) window._updateSidebarBadges()
  closeModal()
  toast('Message deleted.', 'success')
  renderPage()
}
window.doDeleteContactMessage = doDeleteContactMessage

// ════════════════════════════════════════════════════════════════
//  ARCHIVES — RESTORE + PERMANENT DELETE
// ════════════════════════════════════════════════════════════════
function confirmRestore(id, name) {
  const safeId   = String(id)
  const safeName = name.replace(/\\/g,'\\\\').replace(/'/g,"\\'")
  showModal(`
    <div class="modal-header">
      <div class="modal-title" style="display:flex;align-items:center;gap:10px">
        <div style="width:32px;height:32px;border-radius:50%;background:#d1fae5;display:flex;align-items:center;justify-content:center;flex-shrink:0;color:#16a34a">
          ${icon('rotate-ccw','icon-sm')}
        </div>
        Restore Record
      </div>
      <button class="modal-close" onclick="window.closeModal()">&times;</button>
    </div>
    <div class="modal-body">
      <p style="font-size:.88rem;color:#374151">Are you sure you want to restore <strong>${name}</strong> back to the active list?</p>
    </div>
    <div class="modal-footer">
      <button class="btn-secondary" onclick="window.closeModal()">Cancel</button>
      <button id="restore-confirm-btn" style="background:#10B981;color:white;border:none;border-radius:8px;padding:9px 20px;font-family:'Poppins',sans-serif;font-size:.85rem;font-weight:600;cursor:pointer;display:inline-flex;align-items:center;gap:6px;transition:opacity .15s" onmouseover="this.style.opacity='.85'" onmouseout="this.style.opacity='1'"
              onclick="window.doRestore('${safeId}','${safeName}')">
        ${icon('rotate-ccw','icon-sm')} Restore
      </button>
    </div>`)
}

async function doRestore(id, name) {
  const rec = archivedRecords.find(r => r.id === id)
  if (!rec) return

  const btn = document.getElementById('restore-confirm-btn')
  if (_btnBusy(btn, 'danger', 'Restoring…')) return

  if (rec.type === 'Account' || rec.type === 'Patient' || rec.type === 'Service' || rec.type === 'Examination') {
    try {
      const r = await fetch('api/archive/restore.php', {
        method: 'POST', headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ id })
      })
      const d = await r.json()
      if (!d.success) { toast(d.message || 'Failed to restore record.', 'error'); _btnIdle(btn); return }
    } catch (_) { toast('Network error — record not restored.', 'error'); _btnIdle(btn); return }
    // Re-fetch the affected pool(s) from the database so the restored row
    // reappears — for Examination this also brings back its full field set
    // (index.php nests examinations under each patient), not just the
    // partial snapshot kept in archivedRecords for display purposes.
    if (window._syncPatients) window._syncPatients()
    if (window._syncDoctors)  window._syncDoctors()
    if (window._syncStaff)    window._syncStaff()
    if (window._syncServices) window._syncServices()
  }

  removeArchivedRecord(id)
  addActivityLog({ id: 'L' + Date.now(), user: state.user.name, role: state.role,
    action: `Restored archived record: ${name}`,
    timestamp: nowTimestamp(), type: 'settings' })
  closeModal()
  toast('Record restored successfully. It is now visible in the active list.', 'success')
  renderPage()
}

function confirmPermDelete(id, name) {
  showModal(`
    <div class="modal-header">
      <div class="modal-title" style="display:flex;align-items:center;gap:10px">
        <div style="width:32px;height:32px;border-radius:50%;background:#fee2e2;display:flex;align-items:center;justify-content:center;flex-shrink:0;color:#dc2626">
          ${icon('alert-triangle','icon-sm')}
        </div>
        Permanently Delete Record
      </div>
      <button class="modal-close" onclick="window.closeModal()">&times;</button>
    </div>
    <div class="modal-body">
      <div style="background:#fef2f2;border:1px solid #fecaca;color:#991b1b;border-radius:8px;padding:12px;font-size:.85rem;margin-bottom:16px">
        This action cannot be undone. The record <strong>${name}</strong> will be permanently removed from the system.
      </div>
      <div class="form-group" style="margin:0">
        <label class="form-label">Type <strong>DELETE</strong> to confirm</label>
        <input id="perm-delete-confirm" class="form-input" placeholder="DELETE"
               oninput="var ok=this.value==='DELETE';var btn=document.getElementById('perm-delete-btn');btn.disabled=!ok;btn.style.opacity=ok?'1':'.45';btn.style.pointerEvents=ok?'auto':'none'">
      </div>
    </div>
    <div class="modal-footer">
      <button class="btn-secondary" onclick="window.closeModal()">Cancel</button>
      <button id="perm-delete-btn"
              style="background:#DC2626;color:white;border:none;border-radius:8px;padding:9px 20px;font-family:'Poppins',sans-serif;font-size:.85rem;font-weight:600;cursor:pointer;opacity:.45;pointer-events:none;display:inline-flex;align-items:center;gap:6px"
              disabled
              onclick="window.doPermDelete('${id}','${name.replace(/'/g,"\\'")}')" >
        ${icon('trash','icon-sm')} Delete Forever
      </button>
    </div>`)
}

async function doPermDelete(id, name) {
  const btn = document.getElementById('perm-delete-btn')
  if (_btnBusy(btn, 'danger', 'Deleting…')) return

  try {
    const r = await fetch('api/archive/delete.php', {
      method: 'POST', headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({ id })
    })
    const d = await r.json()
    if (!d.success) { toast(d.message || 'Failed to permanently delete record.', 'error'); _btnIdle(btn); return }
  } catch (_) { toast('Network error — record not deleted.', 'error'); _btnIdle(btn); return }

  removeArchivedRecord(id)
  addActivityLog({ id:'L'+Date.now(), user: state.user.name, role: state.role,
    action: `Permanently deleted archived record: ${name}`,
    timestamp: nowTimestamp(), type:'settings' })
  closeModal()
  toast('Record permanently deleted.', 'error')
  renderPage()
}

window.confirmRestore    = confirmRestore
window.doRestore         = doRestore
window.confirmPermDelete = confirmPermDelete
window.doPermDelete      = doPermDelete

// ════════════════════════════════════════════════════════════════
//  ARCHIVES — VIEW DETAIL MODAL
// ════════════════════════════════════════════════════════════════
function viewArchivedRecord(id) {
  const r = archivedRecords.find(rec => rec.id === id)
  if (!r) return

  const typeColors = {
    Patient:     { bg: '#DBEAFE', color: '#1D4ED8' },
    Account:     { bg: '#EDE9FE', color: '#5B21B6' },
    Examination: { bg: '#D1FAE5', color: '#065F46' },
    Service:     { bg: '#FCE7F3', color: '#9D174D' }
  }
  const tc = typeColors[r.type] || { bg: '#F3F4F6', color: '#374151' }
  const badge = `<span style="background:${tc.bg};color:${tc.color};font-size:.72rem;font-weight:700;padding:3px 12px;border-radius:20px">${r.type}</span>`

  function row(label, value) {
    if (!value) return ''
    return `<div style="display:flex;gap:12px;padding:10px 0;border-bottom:1px solid #F3F4F6">
      <div style="font-size:.78rem;color:#9CA3AF;width:110px;flex-shrink:0">${label}</div>
      <div style="font-size:.82rem;color:#1F2937;font-weight:500;flex:1">${value}</div>
    </div>`
  }

  let extraRows = ''
  if (r.data) {
    const d = r.data
    if (r.type === 'Patient') {
      extraRows += row('Gender', d.gender)
      extraRows += row('Date of Birth', d.dob)
      extraRows += row('Contact', d.contact)
      extraRows += row('Email', d.email)
      extraRows += row('Address', d.address)
    } else if (r.type === 'Account') {
      extraRows += row('Role', d.role)
      extraRows += row('Email', d.email)
      extraRows += row('Contact', d.contact)
      extraRows += row('Specialization', d.specialization)
    } else if (r.type === 'Service') {
      extraRows += row('Description', d.description)
      extraRows += row('Duration', d.duration ? `${d.duration} min` : null)
      extraRows += row('Status', d.status)
    } else if (r.type === 'Examination') {
      extraRows += row('Patient', d.patientName)
      extraRows += row('Doctor', d.doctor)
      extraRows += row('Date', d.date)
      extraRows += row('Diagnosis', d.diagnosis)
      extraRows += row('Status', d.status)
    }
  }

  showModal(`
    <div class="modal-header">
      <div class="modal-title">Archived Record</div>
      <button class="modal-close" onclick="window.closeModal()">&times;</button>
    </div>
    <div class="modal-body" style="padding:0 24px 8px">
      <div style="display:flex;align-items:center;gap:12px;padding:16px 0;border-bottom:1px solid #F3F4F6;margin-bottom:4px">
        ${(() => {
          const isPerson = r.type === 'Patient' || r.type === 'Account'
          // Photo when captured; otherwise the same orange-initials avatar
          // used everywhere else in the app for a person with no photo set
          // (e.g. the Staff/Doctor/Patient list rows) — not the purple/blue
          // type-tint, which stays reserved for the badge pill below and
          // the non-person Examination/Service icon fallback.
          const bg  = r.data?.photoUrl ? 'transparent' : isPerson ? '#E8760A' : tc.bg
          const col = isPerson ? '#fff' : tc.color
          return `<div style="width:44px;height:44px;border-radius:50%;background:${bg};display:flex;align-items:center;justify-content:center;flex-shrink:0;overflow:hidden;color:${col};font-weight:700;font-size:.9rem">
            ${r.data?.photoUrl
              ? `<img src="${r.data.photoUrl}" alt="${r.name}" style="width:100%;height:100%;object-fit:cover;border-radius:50%;display:block" onerror="${window.avatarFallbackAttr(r.name)}">`
              : isPerson ? initials(r.name) : icon('archive','icon-sm')}
          </div>`
        })()}
        <div>
          <div style="font-size:.95rem;font-weight:700;color:#1C1C1C">${r.name}</div>
          <div style="margin-top:4px;display:flex;gap:8px;align-items:center;flex-wrap:wrap">
            ${badge}
            <span style="font-size:.75rem;color:#9CA3AF">${r.refId}</span>
          </div>
        </div>
      </div>
      ${row('Archived By', r.archivedBy)}
      ${row('Date Archived', r.date)}
      ${row('Reason', r.reason)}
      ${extraRows}
    </div>
    <div class="modal-footer">
      <button class="btn-secondary" onclick="window.closeModal()">Close</button>
      <button style="background:#10B981;color:white;border:none;border-radius:8px;padding:9px 20px;font-family:'Poppins',sans-serif;font-size:.85rem;font-weight:600;cursor:pointer;display:inline-flex;align-items:center;gap:6px;transition:opacity .15s" onmouseover="this.style.opacity='.85'" onmouseout="this.style.opacity='1'"
              onclick="window.confirmRestore('${r.id}','${r.name.replace(/'/g, "\\'")}')">
        ${icon('rotate-ccw','icon-sm')} Restore
      </button>
    </div>`)
}
window.viewArchivedRecord = viewArchivedRecord

// ════════════════════════════════════════════════════════════════
//  SETTINGS — SAVE CLINIC INFO
// ════════════════════════════════════════════════════════════════
function saveClinicInfo() {
  const gv = id => (document.getElementById(id)?.value || '').trim()
  const name    = gv('ci-name')
  const phone   = gv('ci-phone')
  const address = gv('ci-address')
  const email   = gv('ci-email')
  const hours   = gv('ci-hours')
  const _mapRaw = gv('ci-map-embed')
  const _mapSrcMatch = _mapRaw.match(/src="([^"]+)"/)
  const mapEmbedUrl = _mapSrcMatch ? _mapSrcMatch[1] : (_mapRaw.startsWith('http') ? _mapRaw : null)
  const foundedYearRaw = parseInt(gv('ci-founded-year'), 10)
  const foundedYear = foundedYearRaw >= 1900 && foundedYearRaw <= new Date().getFullYear() ? foundedYearRaw : null

  if (!name)    { toast('Clinic name is required.', 'error'); return }
  if (!email)   { toast('Email address is required.', 'error'); return }

  clinicInfo.name = name
  clinicInfo.phone   = phone
  clinicInfo.mobile  = phone
  clinicInfo.address     = address
  clinicInfo.email       = email
  clinicInfo.hours       = hours
  clinicInfo.mapEmbedUrl = mapEmbedUrl
  if (foundedYear) clinicInfo.foundedYear = foundedYear

  const body = { name, phone, address, email, hours }
  if (mapEmbedUrl !== null) body.mapEmbedUrl = mapEmbedUrl
  if (foundedYear) body.foundedYear = foundedYear

  fetch('api/clinic/settings.php', {
    method: 'POST', headers: { 'Content-Type': 'application/json' },
    body: JSON.stringify(body)
  }).catch(() => {})

  addActivityLog({ id: 'L' + Date.now(), user: state.user.name, role: state.role,
    action: 'Updated clinic information',
    timestamp: nowTimestamp(), type: 'settings' })

  // Sync globals and DOM immediately so topbar/sidebar reflect changes without a reload
  try {
    localStorage.setItem('_canaopticalclinic_clinicName', name || 'Cana Optical Clinic')
  } catch(_) {}
  window._clinicName    = name    || 'Cana Optical Clinic'
  window._clinicAddress = address || ''
  document.querySelectorAll('.brand-logo-name').forEach(el => { el.textContent = window._clinicName })
  const lsBrand = document.getElementById('ls-brand-name')
  if (lsBrand) lsBrand.textContent = window._clinicName
  document.querySelectorAll('.topbar-clinic-name').forEach(el => { el.textContent = window._clinicName })
  const _parts = window._clinicAddress.split(',').map(s => s.trim()).filter(Boolean)
  const _city  = _parts.length >= 2 ? _parts.slice(-2).join(', ') : (window._clinicAddress || 'Carmona, Cavite')
  document.querySelectorAll('.topbar-clinic-sub').forEach(el => { el.textContent = _city })
  if (window.renderTopbar)  window.renderTopbar()
  if (window.renderSidebar) window.renderSidebar()
  toast('Clinic information updated successfully.', 'success')
}
window.saveClinicInfo = saveClinicInfo

// Re-renders a markdown-editor live preview from its textarea's current
// value — called on load and on every keystroke. Shared by both the
// Terms & Conditions and Appointment Policy editors (renderTermsMarkdown
// lives in db.js, loaded before this file).
function _mdPreviewUpdate(taId, previewId) {
  const ta  = document.getElementById(taId)
  const out = document.getElementById(previewId)
  if (ta && out) out.innerHTML = renderTermsMarkdown(ta.value)
}
window._mdPreviewUpdate = _mdPreviewUpdate

function saveTermsContent() {
  const ta = document.getElementById('terms-md-input')
  const value = ta ? ta.value : ''

  clinicInfo.termsContent = value
  window._termsContentMd  = value

  fetch('api/clinic/settings.php', {
    method: 'POST', headers: { 'Content-Type': 'application/json' },
    body: JSON.stringify({ termsContent: value })
  }).catch(() => {})

  addActivityLog({ id: 'L' + Date.now(), user: state.user.name, role: state.role,
    action: 'Updated the registration Terms & Conditions',
    timestamp: nowTimestamp(), type: 'settings' })

  toast('Terms & Conditions updated successfully.', 'success')
}
window.saveTermsContent = saveTermsContent

function savePrivacyContent() {
  const ta = document.getElementById('privacy-md-input')
  const value = ta ? ta.value : ''

  clinicInfo.privacyContent = value
  window._privacyContentMd  = value

  fetch('api/clinic/settings.php', {
    method: 'POST', headers: { 'Content-Type': 'application/json' },
    body: JSON.stringify({ privacyContent: value })
  }).catch(() => {})

  addActivityLog({ id: 'L' + Date.now(), user: state.user.name, role: state.role,
    action: 'Updated the registration Data Privacy Act Notice',
    timestamp: nowTimestamp(), type: 'settings' })

  toast('Data Privacy Act Notice updated successfully.', 'success')
}
window.savePrivacyContent = savePrivacyContent

// ════════════════════════════════════════════════════════════════
//  SECURITY & SIGN-IN (Active Sessions) — Settings > Security & Sign-in,
//  every role, reached via its own dedicated sidebar entry (router.js
//  SIDEBAR_CONFIG) — not a card duplicated inside My Profile too.
//  Multi-device sign-in is NOT restricted (the same account can stay
//  signed in on a phone and a laptop at once, same as Facebook/Google) —
//  this is visibility and control on top of that: a user sees every
//  device currently signed in to their own account and can revoke any
//  one individually, grouped by device the way Google's own "Your
//  devices" page groups sessions.
// ════════════════════════════════════════════════════════════════

// Relative "X min/hours/days ago" from a 'Y-m-d H:i:s' server timestamp —
// same convention as the admin activity feed's own _relTime() (pages.js).
function _sessionTimeAgo(ts) {
  const diff = Date.now() - new Date(ts.replace(' ', 'T')).getTime()
  const mins = Math.floor(diff / 60000)
  if (mins < 1) return 'Active now'
  if (mins < 60) return `${mins} min ago`
  const hrs = Math.floor(mins / 60)
  if (hrs < 24) return `${hrs} hour${hrs > 1 ? 's' : ''} ago`
  const days = Math.floor(hrs / 24)
  return `${days} day${days > 1 ? 's' : ''} ago`
}

// The full list, grouped by device — same "N sessions on <OS>" grouping
// as Google's own Your Devices page. Renders into pageActiveSessions()'s
// own container (pages.js), not the Settings summary card above.
async function loadActiveSessionsPage() {
  const wrap = document.getElementById('active-sessions-groups')
  if (!wrap) return
  try {
    const r = await fetch('api/auth/sessions.php')
    const d = await r.json()
    if (!d.success) { wrap.innerHTML = `<div class="card" style="padding:40px 24px;text-align:center;color:#9CA3AF;font-size:.85rem">Could not load active sessions.</div>`; return }
    const sessions = d.sessions || []
    if (!sessions.length) { wrap.innerHTML = `<div class="card" style="padding:40px 24px;text-align:center;color:#9CA3AF;font-size:.85rem">No active sessions found.</div>`; return }

    // Group by OS + device type together, preserving first-seen order —
    // sessions already arrive newest-first from listSessions()
    // (api/helpers.php). Type, not just OS, because an iPad and an
    // iPhone share the "iOS" OS but are different physical device
    // classes — same reasoning Google's own grouping applies.
    const groups = []
    const byKey  = {}
    sessions.forEach(s => {
      const key = `${s.os}|${s.type}`
      if (!byKey[key]) { byKey[key] = { os: s.os, type: s.type || 'desktop', sessions: [] }; groups.push(byKey[key]) }
      byKey[key].sessions.push(s)
    })

    const groupIcon = type => type === 'tablet' ? 'tablet' : type === 'phone' ? 'smartphone' : 'monitor'
    const osLabel = g => {
      const many = g.sessions.length > 1
      if (g.type === 'tablet') return g.os === 'iOS' ? (many ? 'iPads' : 'iPad') : `${g.os} tablet${many ? 's' : ''}`
      if (g.type === 'phone')  return `${g.os} phone${many ? 's' : ''}`
      return `${g.os} computer${many ? 's' : ''}`
    }

    wrap.innerHTML = groups.map(g => `
      <div class="card" style="padding:0;overflow:hidden;margin-bottom:16px">
        <div style="display:flex;align-items:center;gap:14px;padding:20px 24px;border-bottom:1px solid #F3F4F6">
          <div style="width:44px;height:44px;border-radius:50%;background:#F3F4F6;display:flex;align-items:center;justify-content:center;color:#6B7280;flex-shrink:0">
            ${icon(groupIcon(g.type), 'icon')}
          </div>
          <div>
            <div style="font-size:.95rem;font-weight:700;color:#1C1C1C">${g.sessions.length} session${g.sessions.length > 1 ? 's' : ''} on ${osLabel(g)}</div>
            <div style="font-size:.78rem;color:#9CA3AF;margin-top:2px">${g.os}</div>
          </div>
        </div>
        ${g.sessions.map((s, i) => `
        <div style="display:flex;align-items:center;gap:12px;padding:16px 24px;${i < g.sessions.length - 1 ? 'border-bottom:1px solid #F3F4F6' : ''}">
          <div style="flex:1;min-width:0">
            <div style="font-size:.87rem;font-weight:600;color:#1C1C1C">${s.browser || s.device}</div>
            <div style="font-size:.78rem;color:#9CA3AF;margin-top:2px">${s.ip ? s.ip + ' &bull; ' : ''}${s.lastActive ? _sessionTimeAgo(s.lastActive) : ''}</div>
            ${s.isCurrent ? `<div style="display:flex;align-items:center;gap:5px;font-size:.78rem;color:#059669;font-weight:600;margin-top:6px">${icon('check-circle','icon-sm')} Your current session</div>` : ''}
          </div>
          ${!s.isCurrent ? `<button class="btn-secondary" style="font-size:.78rem;padding:6px 14px;flex-shrink:0;align-self:center;color:#DC2626;border-color:#FECACA" onmouseover="this.style.background='#FEF2F2'" onmouseout="this.style.background=''" onclick="window.revokeSession('${s.id}', this)">Sign Out</button>` : ''}
        </div>`).join('')}
      </div>`).join('')
  } catch (_) {
    wrap.innerHTML = `<div class="card" style="padding:40px 24px;text-align:center;color:#9CA3AF;font-size:.85rem">Could not load active sessions.</div>`
  }
}
window.loadActiveSessionsPage = loadActiveSessionsPage

async function revokeSession(id, btnEl) {
  if (btnEl) { btnEl.disabled = true; btnEl.textContent = 'Signing out…' }
  try {
    const r = await fetch('api/auth/sessions-revoke.php', {
      method: 'POST', headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({ id })
    })
    const d = await r.json()
    if (!d.success) {
      toast(d.message || 'Could not sign out that device.', 'error')
      if (btnEl) { btnEl.disabled = false; btnEl.textContent = 'Sign Out' }
      return
    }
    // revokeSessionByShortId() (api/helpers.php) also sweeps any other
    // session that's the exact same browser + IP as the one just picked —
    // almost always just leftover duplicate rows from repeatedly logging
    // back in on that same device (see listSessions()'s own dedup, which
    // only ever hides those from the list, never deletes them). Reflect
    // that in the toast when it actually cleaned up more than one row.
    const n = d.revokedCount || 1
    toast(n > 1 ? `That device has been signed out (${n} sessions cleared).` : 'That device has been signed out.', 'success')
    loadActiveSessionsPage()
  } catch (_) {
    toast('Network error. Please try again.', 'error')
    if (btnEl) { btnEl.disabled = false; btnEl.textContent = 'Sign Out' }
  }
}
window.revokeSession = revokeSession

function saveAppointmentPolicyContent() {
  const ta = document.getElementById('policy-md-input')
  const value = ta ? ta.value : ''

  clinicInfo.appointmentPolicyContent = value

  fetch('api/clinic/settings.php', {
    method: 'POST', headers: { 'Content-Type': 'application/json' },
    body: JSON.stringify({ appointmentPolicyContent: value })
  }).catch(() => {})

  addActivityLog({ id: 'L' + Date.now(), user: state.user.name, role: state.role,
    action: 'Updated the Appointment Policy',
    timestamp: nowTimestamp(), type: 'settings' })

  toast('Appointment Policy updated successfully.', 'success')
}
window.saveAppointmentPolicyContent = saveAppointmentPolicyContent

// ════════════════════════════════════════════════════════════════
//  SETTINGS — SAVE CONSULTATION SETTINGS
// ════════════════════════════════════════════════════════════════
function saveSchedulingRules() {
  const gv = id => (document.getElementById(id)?.value || '').trim()
  consultationSettings.defaultDuration         = gv('cs-duration')  || consultationSettings.defaultDuration
  consultationSettings.maxAdvanceBooking        = gv('cs-adv-max')   || consultationSettings.maxAdvanceBooking
  consultationSettings.minAdvanceBooking        = gv('cs-adv-min')   || consultationSettings.minAdvanceBooking
  consultationSettings.maxApptsPerDoctorPerDay  = parseInt(gv('cs-max-appt')) || consultationSettings.maxApptsPerDoctorPerDay
  consultationSettings.reminderTime             = gv('cs-reminder-time')    || consultationSettings.reminderTime
  consultationSettings.confirmDeadlineTime      = gv('cs-confirm-deadline') || consultationSettings.confirmDeadlineTime
  consultationSettings.waitlistOfferHours       = parseInt(gv('cs-waitlist-hours')) || consultationSettings.waitlistOfferHours

  fetch('api/clinic/settings.php', {
    method: 'POST', headers: { 'Content-Type': 'application/json' },
    body: JSON.stringify({
      defaultDuration: consultationSettings.defaultDuration,
      maxAdvanceBooking: consultationSettings.maxAdvanceBooking,
      minAdvanceBooking: consultationSettings.minAdvanceBooking,
      maxApptsPerDoctorPerDay: consultationSettings.maxApptsPerDoctorPerDay,
      reminderTime: consultationSettings.reminderTime,
      confirmDeadlineTime: consultationSettings.confirmDeadlineTime,
      waitlistOfferHours: consultationSettings.waitlistOfferHours
    })
  }).catch(() => {})

  addActivityLog({ id: 'L' + Date.now(), user: state.user.name, role: state.role,
    action: 'Updated scheduling rules',
    timestamp: nowTimestamp(), type: 'settings' })
  toast('Scheduling rules saved successfully.', 'success')
}
window.saveSchedulingRules = saveSchedulingRules

function saveOperatingHours() {
  const gv = id => (document.getElementById(id)?.value || '').trim()
  consultationSettings.morningStart   = gv('cs-am-start')    || consultationSettings.morningStart
  consultationSettings.morningEnd     = gv('cs-am-end')      || consultationSettings.morningEnd
  consultationSettings.afternoonStart = gv('cs-pm-start')    || consultationSettings.afternoonStart
  consultationSettings.afternoonEnd   = gv('cs-pm-end')      || consultationSettings.afternoonEnd
  consultationSettings.lunchBreak     = document.getElementById('cs-lunch-break')?.checked ?? consultationSettings.lunchBreak

  consultationSettings.clinicDays = Array.from(document.querySelectorAll('.cs-clinic-day')).filter(cb => cb.checked).map(cb => cb.value)

  fetch('api/clinic/settings.php', {
    method: 'POST', headers: { 'Content-Type': 'application/json' },
    body: JSON.stringify({
      morningStart: consultationSettings.morningStart,
      morningEnd: consultationSettings.morningEnd,
      afternoonStart: consultationSettings.afternoonStart,
      afternoonEnd: consultationSettings.afternoonEnd,
      lunchBreak: consultationSettings.lunchBreak,
      clinicDays: consultationSettings.clinicDays
    })
  }).catch(() => {})

  addActivityLog({ id: 'L' + Date.now(), user: state.user.name, role: state.role,
    action: `Updated operating hours: ${consultationSettings.morningStart}–${consultationSettings.afternoonEnd}`,
    timestamp: nowTimestamp(), type: 'settings' })
  toast('Operating hours saved successfully.', 'success')
}
window.saveOperatingHours = saveOperatingHours

// ════════════════════════════════════════════════════════════════
//  SERVICES MANAGEMENT
// ════════════════════════════════════════════════════════════════
function _rebuildServicesTable() {
  loadServicesAdmin()
}

async function addService() {
  const name           = (document.getElementById('svc-name')?.value     || '').trim()
  const desc           = (document.getElementById('svc-desc')?.value     || '').trim()
  const status         = document.getElementById('svc-status')?.value    || 'active'
  const bookable       = (document.getElementById('svc-bookable')?.value || '1') === '1'
  const patientVisible = (document.getElementById('svc-patient-visible')?.value || '1') === '1'
  if (!name) { toast('Service name is required.', 'error'); return }
  try {
    const r = await fetch('api/services/create.php', {
      method: 'POST', headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({ name, description: desc, status, icon: 'eye', bookable, patientVisible })
    })
    const d = await r.json()
    if (!d.success) { toast(d.message || 'Could not add service.', 'error'); return }
    CLINIC_SERVICES.push(d.service)
  } catch (_) {
    toast('Network error — could not add service.', 'error')
    return
  }
  document.getElementById('svc-name').value = ''
  document.getElementById('svc-desc').value = ''
  window.setSelectFieldValue('svc-status', 'active')
  window.setSelectFieldValue('svc-bookable', '1')
  window.setSelectFieldValue('svc-patient-visible', '1')
  _rebuildServicesTable()
  toast('Service added successfully.', 'success')
}
window.addService = addService

function editServiceModal(id) {
  const svc = CLINIC_SERVICES.find(s => s.id === id)
  if (!svc) return
  showModal(`
    <div class="modal-header">
      <div class="modal-title">Edit Service</div>
      <button class="modal-close" onclick="window.closeModal()">&times;</button>
    </div>
    <div class="modal-body" style="display:flex;flex-direction:column;gap:14px">
      <div class="form-group">
        <label class="form-label">Service Name <span class="req">*</span></label>
        <input class="form-input" id="es-name" value="${svc.name.replace(/"/g,'&quot;')}">
      </div>
      <div class="form-group">
        <label class="form-label">Description</label>
        <input class="form-input" id="es-desc" value="${svc.description.replace(/"/g,'&quot;')}">
      </div>
      <div class="form-row-3">
        <div class="form-group" style="margin-bottom:0">
          <label class="form-label">Status</label>
          ${window.selectFieldHtml('es-status', { value: svc.status, options: [{ value: 'active', label: 'Active' }, { value: 'inactive', label: 'Inactive' }] })}
        </div>
        <div class="form-group" style="margin-bottom:0">
          <label class="form-label">Bookable</label>
          ${window.selectFieldHtml('es-bookable', { value: svc.bookable ? '1' : '0', options: [{ value: '1', label: 'Yes — offered as an appointment type' }, { value: '0', label: 'No — display only' }] })}
        </div>
        <div class="form-group" style="margin-bottom:0">
          <label class="form-label">Patient Visible</label>
          ${window.selectFieldHtml('es-patient-visible', { value: svc.patientVisible ? '1' : '0', options: [{ value: '1', label: 'Yes — shown to patients too' }, { value: '0', label: 'No — staff/admin only' }] })}
        </div>
      </div>
    </div>
    <div class="modal-footer">
      <button class="btn-ghost" onclick="window.closeModal()">Cancel</button>
      <button class="btn-primary" id="edit-service-btn" onclick="window.doEditService(${id})">Save Changes</button>
    </div>
  `)
}
window.editServiceModal = editServiceModal

window.doEditService = async function(id) {
  const svc = CLINIC_SERVICES.find(s => s.id === id)
  if (!svc) return
  const name = (document.getElementById('es-name')?.value || '').trim()
  if (!name) { toast('Service name is required.', 'error'); return }
  const description     = (document.getElementById('es-desc')?.value     || '').trim()
  const status           = document.getElementById('es-status')?.value    || svc.status
  const bookable         = (document.getElementById('es-bookable')?.value || (svc.bookable ? '1' : '0')) === '1'
  const patientVisible   = (document.getElementById('es-patient-visible')?.value || (svc.patientVisible ? '1' : '0')) === '1'

  const btn = document.getElementById('edit-service-btn')
  if (_btnBusy(btn, 'primary', 'Saving…')) return

  try {
    const r = await fetch('api/services/update.php', {
      method: 'POST', headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({ id, name, description, status, bookable, patientVisible })
    })
    const d = await r.json()
    if (!d.success) { toast(d.message || 'Could not update service.', 'error'); _btnIdle(btn); return }
    Object.assign(svc, d.service)
  } catch (_) {
    toast('Network error — could not update service.', 'error')
    _btnIdle(btn)
    return
  }
  closeModal()
  _rebuildServicesTable()
  toast('Service updated successfully.', 'success')
}

function archiveServiceConfirm(id, name) {
  showModal(`
    <div class="modal-header">
      <div class="modal-title">Archive Service</div>
      <button class="modal-close" onclick="window.closeModal()">&times;</button>
    </div>
    <div class="modal-body">
      <p style="font-size:.9rem;color:#374151;margin-bottom:12px">
        Archive <strong>${name}</strong>? It will no longer appear in appointment type options.
      </p>
      <div class="form-group" style="margin-bottom:0">
        <label class="form-label">Reason <span class="req">*</span></label>
        <input class="form-input" id="svc-archive-reason" placeholder="Reason for archiving">
      </div>
    </div>
    <div class="modal-footer">
      <button class="btn-ghost" onclick="window.closeModal()">Cancel</button>
      <button class="btn-warning" id="archive-service-btn" onclick="window.doArchiveService(${id})">Archive Service</button>
    </div>
  `)
}
window.archiveServiceConfirm = archiveServiceConfirm

window.doArchiveService = async function(id) {
  const reason = (document.getElementById('svc-archive-reason')?.value || '').trim()
  if (!reason) { toast('Please provide a reason.', 'error'); return }
  const idx = CLINIC_SERVICES.findIndex(s => s.id === id)
  if (idx === -1) return
  const svc = CLINIC_SERVICES[idx]

  const btn = document.getElementById('archive-service-btn')
  if (_btnBusy(btn, 'warning', 'Archiving…')) return

  try {
    // archive/create.php deactivates the service AND persists the archive
    // record server-side in one call — it used to only flip status locally
    // with a client-fabricated record that vanished on the next page load.
    const r = await fetch('api/archive/create.php', {
      method: 'POST', headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({ profileId: id, type: 'Service', name: svc.name, reason, archivedBy: state.user.name })
    })
    const d = await r.json()
    if (!d.success) { toast(d.message || 'Could not archive service.', 'error'); _btnIdle(btn); return }
    addArchivedRecord(d.record)
  } catch (_) {
    toast('Network error — could not archive service.', 'error')
    _btnIdle(btn)
    return
  }
  CLINIC_SERVICES.splice(idx, 1)
  addActivityLog({ id: 'L' + Date.now(), user: state.user.name, role: state.role,
    action: `Archived service: ${svc.name} — Reason: ${reason}`,
    timestamp: nowTimestamp(), type: 'settings' })
  closeModal()
  _rebuildServicesTable()
  toast('Service archived. It can be restored from Settings > Archives.', 'success')
}

// ════════════════════════════════════════════════════════════════
//  PRINT PATIENT QR MODAL
// ════════════════════════════════════════════════════════════════
function showPatientQRModal(patientId) {
  const p = patients.find(p => p.id === patientId)
  if (!p) return
  const wid = 'pqr-modal-wrap'
  showModal(`
    <div class="modal-header">
      <div class="modal-title">Patient QR Code</div>
      <button class="modal-close" onclick="window.closeModal()">&times;</button>
    </div>
    <div class="modal-body" style="text-align:center">
      <div id="${wid}" style="display:inline-block;padding:20px;background:#fff;border:2px solid #E5E7EB;border-radius:12px;margin-bottom:14px">
        ${mockQRSvg(p.qrData, 180)}
      </div>
      <div style="font-size:.75rem;font-family:monospace;color:#9CA3AF;margin-bottom:4px;word-break:break-all">${p.qrData}</div>
      <div style="font-size:1rem;font-weight:700;color:#1C1C1C">${p.name}</div>
      <div style="font-size:.82rem;color:#9CA3AF">${p.id} &bull; ${p.gender} &bull; ${p.age} yrs</div>
    </div>
    <div class="modal-footer" style="gap:8px">
      <button class="btn-secondary" onclick="window.closeModal()">Close</button>
      <button class="btn-ghost" onclick="window.downloadQR('${wid}','${p.id}')">
        ${icon('download','icon-sm')} Download
      </button>
      <button class="btn-primary" onclick="window.printQR('${wid}','${p.name}','${p.id}','${p.qrData}')">
        ${icon('printer','icon-sm')} Print
      </button>
    </div>`)
}
window.showPatientQRModal = showPatientQRModal

// ════════════════════════════════════════════════════════════════
//  PATIENT VIEW TAB SWITCHING
// ════════════════════════════════════════════════════════════════
function switchPatientTab(tab) {
  document.querySelectorAll('.ptab-panel').forEach(p => p.style.display = 'none')
  document.querySelectorAll('.ptab-btn').forEach(b => b.classList.remove('active'))
  const panel = document.getElementById('ptab-' + tab)
  const btn   = document.querySelector(`.ptab-btn[data-tab="${tab}"]`)
  if (panel) panel.style.display = ''
  if (btn)   btn.classList.add('active')
}
window.switchPatientTab = switchPatientTab

// ════════════════════════════════════════════════════════════════
//  QR SCANNER MODAL (simulated)
// ════════════════════════════════════════════════════════════════
function openQRScanner() {
  showModal(`
    <div class="modal-header">
      <div class="modal-title">Scan Patient QR Code</div>
      <button class="modal-close" onclick="window.closeModal()">&times;</button>
    </div>
    <div class="modal-body" style="text-align:center">
      <div id="qrm-area" style="border:2px dashed #E5E7EB;border-radius:12px;padding:36px 24px;margin-bottom:14px;
           background:#FAFAFA;position:relative;min-height:260px;overflow:hidden;display:flex;
           flex-direction:column;align-items:center;justify-content:center">
        <div id="qrm-idle" style="display:flex;flex-direction:column;align-items:center">
          ${icon('qr','icon-xl')}
          <div style="font-size:.9rem;font-weight:600;color:#374151;margin-top:12px">Camera is off</div>
          <div style="font-size:.78rem;color:#9CA3AF;margin-top:4px">Start the camera to scan automatically</div>
        </div>
        <div id="qrm-reader" style="display:none;width:100%"></div>
      </div>
      <div id="qrm-status" style="display:none;font-size:.76rem;color:#6B7280;margin-bottom:10px;line-height:1.5"></div>
      <div style="display:flex;gap:8px;margin-bottom:16px">
        <button id="qrm-start-btn" class="btn-primary" style="flex:1;justify-content:center" onclick="window._qrmStart()">
          ${icon('camera','icon-sm')} Start Camera
        </button>
        <button id="qrm-stop-btn" class="btn-secondary" style="flex:1;justify-content:center;display:none" onclick="window._qrmStop()">
          ${icon('x','icon-sm')} Stop Camera
        </button>
      </div>
      <div style="font-size:.8rem;color:#9CA3AF;margin-bottom:16px">— or enter QR code manually —</div>
      <input id="qr-manual" class="form-input" placeholder="e.g. CANA-P001-JUANDELACRUZ" style="text-align:center;font-family:monospace">
    </div>
    <div class="modal-footer">
      <button class="btn-secondary" onclick="window.closeModal()">Cancel</button>
      <button class="btn-primary" onclick="window.doQRScan()">Find Patient</button>
    </div>`)
}

function _qrmStart() {
  const idle     = document.getElementById('qrm-idle')
  const startBtn = document.getElementById('qrm-start-btn')
  const stopBtn  = document.getElementById('qrm-stop-btn')
  const area     = document.getElementById('qrm-area')
  const reader   = document.getElementById('qrm-reader')
  const status   = document.getElementById('qrm-status')
  if (!reader) return

  if (idle)     idle.style.display = 'none'
  reader.style.display = ''
  if (startBtn) startBtn.style.display = 'none'
  if (stopBtn)  stopBtn.style.display  = ''
  if (area)     { area.style.borderStyle = 'solid'; area.style.background = '#000'; area.style.padding = '10px' }
  if (status)   { status.style.display = ''; status.textContent = 'Requesting camera access…' }

  startQRCamera('qrm-reader',
    // onResult
    (qrData) => {
      window._qrmStop()
      const patient = patients.find(p => p.qrData === qrData)
      if (patient) {
        if (status) status.textContent = `Patient found: ${patient.name}`
        closeModal()
        navigate('patient-view', { patientId: patient.id, patientName: patient.name })
        toast(`Patient found: ${patient.name}`)
      } else {
        if (status) { status.style.color = '#EF4444'; status.textContent = `Scanned "${qrData}" — no matching patient.` }
        toast('No matching patient found for this QR code.', 'error')
      }
    },
    // onStatus
    () => { if (status) status.textContent = 'Camera live — hold the QR code steady in the frame' }
  )
}
window._qrmStart = _qrmStart

function _qrmStop() {
  _qrKillStream()
  const idle     = document.getElementById('qrm-idle')
  const startBtn = document.getElementById('qrm-start-btn')
  const stopBtn  = document.getElementById('qrm-stop-btn')
  const area     = document.getElementById('qrm-area')
  const reader   = document.getElementById('qrm-reader')
  const status   = document.getElementById('qrm-status')
  if (reader)   reader.style.display = 'none'
  if (idle)     idle.style.display = 'flex'
  if (startBtn) startBtn.style.display = ''
  if (stopBtn)  stopBtn.style.display  = 'none'
  if (area)     { area.style.borderStyle = 'dashed'; area.style.background = '#FAFAFA'; area.style.padding = '36px 24px' }
  if (status)   status.style.display = 'none'
}
window._qrmStop = _qrmStop

function doQRScan() {
  const val = (document.getElementById('qr-manual') || {}).value?.trim().toUpperCase()
  if (!val) { toast('Please enter a QR code value.', 'error'); return }
  const p = patients.find(p => p.qrData.toUpperCase() === val)
  if (!p) { toast('No patient found with that QR code.', 'error'); return }
  closeModal()
  navigate('patient-view', { patientId: p.id, patientName: p.name })
  toast(`Patient found: ${p.name}`)
}

window.openQRScanner = openQRScanner
window.doQRScan      = doQRScan

// ════════════════════════════════════════════════════════════════
//  QR SCANNER PAGE FUNCTIONS
// ════════════════════════════════════════════════════════════════
function showQRResult(p) {
  const card    = document.getElementById('qr-result-card')
  const body    = document.getElementById('qr-result-body')
  if (!card || !body) return
  const initls   = (p.name || '').split(' ').map(n=>n[0]).slice(0,2).join('').toUpperCase()
  const patAppts = appointments.filter(a => a.patientId === p.id)
  const exams    = p.examinations || []
  const lastExam = exams.length ? exams[exams.length - 1] : null
  const lastVisitStr = p.lastVisit && p.lastVisit !== '—'
    ? new Date(p.lastVisit).toLocaleDateString('en-PH', { year: 'numeric', month: 'short', day: 'numeric' })
    : 'No visits on record'
  body.innerHTML = `
    <div style="display:flex;align-items:center;gap:14px;margin-bottom:14px">
      <div style="width:60px;height:60px;border-radius:50%;background:#E8760A;
                  display:flex;align-items:center;justify-content:center;font-size:1.25rem;font-weight:800;color:#fff;flex-shrink:0;overflow:hidden">
        ${p.photoUrl ? `<img src="${p.photoUrl}" alt="${p.name}" style="width:100%;height:100%;object-fit:cover;border-radius:50%;display:block" onerror="${window.avatarFallbackAttr(p.name)}">` : initls}
      </div>
      <div style="min-width:0">
        <div style="font-size:1.12rem;font-weight:800;color:#1C1C1C;letter-spacing:-.01em;margin-bottom:5px">${p.name}</div>
        <div style="display:flex;flex-wrap:wrap;gap:5px">
          <span style="font-size:.68rem;font-weight:700;font-family:monospace;color:#9A3412;background:#FFF1E0;border:1px solid #FED7AA;border-radius:5px;padding:2px 7px">${p.id}</span>
          <span style="font-size:.68rem;font-weight:600;color:#374151;background:#F3F4F6;border-radius:5px;padding:2px 7px">${p.gender || '—'}</span>
          <span style="font-size:.68rem;font-weight:600;color:#374151;background:#F3F4F6;border-radius:5px;padding:2px 7px">${p.age ? p.age + ' yrs' : '—'}</span>
        </div>
      </div>
    </div>
    <div style="display:flex;align-items:center;gap:6px;font-size:.76rem;color:#9CA3AF;margin-bottom:16px;padding-bottom:14px;border-bottom:1px solid #F3F4F6">
      ${icon('clock','icon-sm')} Last visit: <span style="color:#374151;font-weight:600">${lastVisitStr}</span>
    </div>
    <div style="display:grid;grid-template-columns:1fr 1fr;gap:10px;margin-bottom:16px">
      <div style="background:#F9FAFB;border:1px solid #F3F4F6;border-radius:8px;padding:10px 12px">
        <div style="display:flex;align-items:center;gap:5px;color:#9CA3AF;margin-bottom:4px">
          ${icon('eye','icon-sm')}
          <span style="font-size:.65rem;font-weight:700;text-transform:uppercase;letter-spacing:.05em">Eye Condition</span>
        </div>
        <div style="font-size:.83rem;font-weight:700;color:#1C1C1C;overflow:hidden;text-overflow:ellipsis;white-space:nowrap" title="${lastExam ? lastExam.diagnosis : ''}">${lastExam ? lastExam.diagnosis : 'No exam on record'}</div>
      </div>
      <div style="background:#F9FAFB;border:1px solid #F3F4F6;border-radius:8px;padding:10px 12px">
        <div style="display:flex;align-items:center;gap:5px;color:#9CA3AF;margin-bottom:4px">
          ${icon('calendar','icon-sm')}
          <span style="font-size:.65rem;font-weight:700;text-transform:uppercase;letter-spacing:.05em">Appointments</span>
        </div>
        <div style="font-size:.83rem;font-weight:700;color:#1C1C1C">${patAppts.length} total</div>
      </div>
    </div>
    <div style="display:flex;gap:8px;flex-wrap:wrap">
      <button class="btn-primary" style="flex:1;justify-content:center;min-width:120px"
              onclick="window.navigate('patient-view',{patientId:'${p.id}',patientName:'${p.name}'})">
        ${icon('eye','icon-sm')} View Profile
      </button>
      ${state.role === 'doctor' ? `<button class="btn-secondary" style="flex:1;justify-content:center;min-width:120px"
              onclick="window.navigate('new-examination',{patientId:'${p.id}'})">
        ${icon('eye','icon-sm')} Start Consultation
      </button>` : ''}
      <button class="btn-ghost" style="flex:1;justify-content:center;min-width:120px"
              onclick="window.navigate('create-appointment',{patientId:'${p.id}',patientName:'${(p.name||'').replace(/'/g,"\\'")}'})">
        ${icon('calendar','icon-sm')} New Appointment
      </button>
    </div>`
  card.style.display = ''
  card.scrollIntoView({ behavior: 'smooth', block: 'nearest' })
}

// Shared by the QR Scanner's "Manual Search" and the New Appointment
// patient-picker (pages.js's pageCreateAppointment()) — one render function
// means both surfaces are always pixel-identical instead of two near-copies
// quietly drifting apart. onclickJs defaults to the QR scanner's own
// select-and-show-result behavior; pass a different JS expression string to
// reuse this row for a different action (e.g. navigating to book for them).
function _renderPatientResult(p, onclickJs) {
  const initls = (p.name || '').split(' ').map(n=>n[0]).slice(0,2).join('')
  const avatarHtml = p.photoUrl
    ? `<img src="${p.photoUrl}" alt="${p.name}" style="width:100%;height:100%;object-fit:cover;border-radius:50%;display:block" onerror="this.remove();this.parentElement&&(this.parentElement.textContent='${initls.replace(/'/g,"\\'")}')">`
    : initls
  return `
    <div style="padding:10px 14px;cursor:pointer;border-bottom:1px solid #F3F4F6;display:flex;align-items:center;gap:10px"
         onmouseover="this.style.background='#FFFBF5'" onmouseout="this.style.background=''"
         onclick="${onclickJs || `window.selectPatientResult('${p.id}')`}">
      <div style="width:32px;height:32px;border-radius:50%;background:#E8760A;display:flex;align-items:center;justify-content:center;color:#fff;font-size:.72rem;font-weight:700;flex-shrink:0;overflow:hidden">
        ${avatarHtml}
      </div>
      <div>
        <div style="font-size:.84rem;font-weight:600">${p.name}</div>
        <div style="font-size:.74rem;color:#9CA3AF">${p.id} &bull; ${p.gender || ''} &bull; ${p.age || '?'} yrs</div>
      </div>
    </div>`
}
window._renderPatientResult = _renderPatientResult

function liveSearchPatient(query) {
  const res = document.getElementById('qr-live-results')
  if (!res) return
  if (!query.trim()) { res.style.display = 'none'; res.innerHTML = ''; return }

  const q = query.toLowerCase()
  const matches = patients.filter(p =>
    p.name.toLowerCase().includes(q) || p.id.toLowerCase().includes(q) || (p.qrData || '').toLowerCase().includes(q)
  ).slice(0, 6)
  if (!matches.length) { res.style.display = 'none'; return }
  res.innerHTML = matches.map(p => _renderPatientResult(p)).join('')
  res.style.display = ''
}

function selectPatientResult(id) {
  const input = document.getElementById('qr-search-input')
  const resEl = document.getElementById('qr-live-results')
  if (resEl) resEl.style.display = 'none'

  const p = patients.find(p => p.id === id)
  if (!p) return
  if (input) input.value = p.name
  showQRResult(p)
}

window.liveSearchPatient   = liveSearchPatient
window.selectPatientResult = selectPatientResult

// ════════════════════════════════════════════════════════════════
//  DOCTOR SCHEDULE MODAL
// ════════════════════════════════════════════════════════════════
function openSetScheduleModal(doctorId) {
  const d = doctorId ? doctors.find(doc => doc.id === doctorId) : null
  const allDays = ['Sun','Mon','Tue','Wed','Thu','Fri','Sat']

  function buildDayChecks(doc) {
    const activeDays = doc ? (doc.availableDays || doc.days || []) : []
    return allDays.map(day => `
      <label style="cursor:pointer;display:flex;align-items:center;gap:6px;font-size:.85rem;padding:6px 10px;border:1px solid #E5E7EB;border-radius:6px">
        <input type="checkbox" class="sched-day-cb chk" value="${day}" ${activeDays.includes(day) ? 'checked' : ''}> ${day}
      </label>`).join('')
  }

  showModal(`
    <div class="modal-header">
      <div class="modal-title">Set Doctor Availability</div>
      <button class="modal-close" onclick="window.closeModal()">&times;</button>
    </div>
    <div class="modal-body">
      <div class="form-group"><label class="form-label">Doctor</label>
        ${window.selectFieldHtml('sched-doc', { value: doctorId, options: doctors.map(doc => ({ value: doc.id, label: doc.name })), onchange: 'window._schedDocChange(this.value)' })}</div>
      <div class="form-group"><label class="form-label">Available Days</label>
        <div style="display:flex;gap:8px;flex-wrap:wrap;margin-top:6px" id="sched-days-wrap">
          ${buildDayChecks(d)}
        </div></div>
      <div class="form-row-2">
        <div class="form-group"><label class="form-label">Start Time</label>
          ${window.timeFieldHtml('sched-start', { value: d ? (d.hours || '8:00 AM – 5:00 PM').split('–')[0].trim() : '8:00 AM', options: window.doctorScheduleTimeOpts() })}</div>
        <div class="form-group"><label class="form-label">End Time</label>
          ${window.timeFieldHtml('sched-end', { value: d ? ((d.hours || '8:00 AM – 5:00 PM').split('–')[1]?.trim() ?? '5:00 PM') : '5:00 PM', options: window.doctorScheduleTimeOpts() })}</div>
      </div>
      <div class="form-group" style="display:flex;align-items:center;justify-content:space-between">
        <label class="form-label" style="margin:0">Mark as Available</label>
        <input id="sched-avail" type="checkbox" class="chk" ${!d || d.available ? 'checked' : ''}>
      </div>
    </div>
    <div class="modal-footer">
      <button class="btn-secondary" onclick="window.closeModal()">Cancel</button>
      <button class="btn-primary" id="doc-sched-save-btn" onclick="window.doSaveSchedule()">Save Schedule</button>
    </div>`)
}

window._schedDocChange = function(id) {
  const doc = doctors.find(d => d.id === id)
  const allDays = ['Sun','Mon','Tue','Wed','Thu','Fri','Sat']
  const activeDays = doc ? (doc.availableDays || doc.days || []) : []
  const wrap = document.getElementById('sched-days-wrap')
  if (wrap) {
    wrap.innerHTML = allDays.map(day => `
      <label style="cursor:pointer;display:flex;align-items:center;gap:6px;font-size:.85rem;padding:6px 10px;border:1px solid #E5E7EB;border-radius:6px">
        <input type="checkbox" class="sched-day-cb chk" value="${day}" ${activeDays.includes(day) ? 'checked' : ''}> ${day}
      </label>`).join('')
  }
  const availEl = document.getElementById('sched-avail')
  if (doc) {
    const parts = (doc.hours || '8:00 AM – 5:00 PM').split('–')
    // sched-start/sched-end are now timeFieldHtml() custom selects, not
    // plain inputs — setting .value directly only updates the hidden
    // field, not the visible trigger label, so this needs the same
    // setter the select's own picker uses.
    window.setSelectFieldValue('sched-start', parts[0]?.trim() || '8:00 AM')
    window.setSelectFieldValue('sched-end',   parts[1]?.trim() || '5:00 PM')
    if (availEl) availEl.checked = doc.available !== false
  }
}

async function doSaveSchedule() {
  const docId   = document.getElementById('sched-doc')?.value
  const startT  = document.getElementById('sched-start')?.value?.trim() || '8:00 AM'
  const endT    = document.getElementById('sched-end')?.value?.trim()   || '5:00 PM'
  const isAvail = document.getElementById('sched-avail')?.checked ?? true
  const selDays = Array.from(document.querySelectorAll('.sched-day-cb:checked')).map(cb => cb.value)
  const doc     = doctors.find(d => d.id === docId)

  if (!docId) { toast('No doctor selected.', 'error'); return }

  const saveBtn = document.getElementById('doc-sched-save-btn')
  if (_btnBusy(saveBtn, 'primary', 'Saving…')) return

  try {
    const r = await fetch('api/doctors/update.php', {
      method:  'POST',
      headers: { 'Content-Type': 'application/json' },
      body:    JSON.stringify({
        doctorId:  docId,
        days:      selDays,
        workHours: `${startT} – ${endT}`,
        available: isAvail,
      }),
    })
    const d = await r.json()
    if (!d.success) { toast(d.message || 'Could not save schedule.', 'error'); return }

    addActivityLog({ id: 'L' + Date.now(), user: state.user.name, role: state.role,
      action: `Updated availability for ${doc?.name || 'doctor'}: ${selDays.join(', ')}`,
      timestamp: nowTimestamp(), type: 'settings' })

    closeModal()
    toast('Schedule updated successfully.')
    if (window._syncDoctors) await window._syncDoctors()
    renderPage()
  } catch (_) {
    toast('Network error — schedule not saved.', 'error')
  } finally {
    _btnIdle(saveBtn)
  }
}

window.openSetScheduleModal = openSetScheduleModal
window.doSaveSchedule       = doSaveSchedule

// ════════════════════════════════════════════════════════════════
//  OPTICAL EXAMINATION — WIZARD CONTROLLER
// ════════════════════════════════════════════════════════════════
var _wizStep = 1
var _wizTotal = 7

var _STEP_LABELS = [
  'Patient Info', 'Visual Exam', 'Diagnosis',
  'Prescription', 'Dispensing', 'Consultation', 'Review'
]

function examWizInit() {
  _wizStep = 1
  examWizRender(1, null)
}

function examWizGo(dir) {
  var next = _wizStep + dir
  if (next < 1 || next > _wizTotal) return
  examWizRender(next, dir)
}

function examWizJump(n) {
  if (n === _wizStep) return
  examWizRender(n, n > _wizStep ? 1 : -1)
}

function examWizRender(next, dir) {
  var prev = _wizStep
  _wizStep = next

  // Slide out old step
  var oldEl = document.getElementById('wiz-step-' + prev)
  if (oldEl && dir !== null) {
    oldEl.style.transition = 'opacity 0.25s ease, transform 0.25s cubic-bezier(0.4,0,0.2,1)'
    oldEl.style.opacity = '0'
    oldEl.style.transform = dir > 0 ? 'translateX(-24px)' : 'translateX(24px)'
    setTimeout(function() { oldEl.style.display = 'none'; oldEl.style.opacity = ''; oldEl.style.transform = ''; }, 260)
  } else if (oldEl) {
    oldEl.style.display = 'none'
  }

  // Slide in new step
  var newEl = document.getElementById('wiz-step-' + next)
  if (newEl) {
    if (dir !== null) {
      newEl.style.opacity = '0'
      newEl.style.transform = dir > 0 ? 'translateX(24px)' : 'translateX(-24px)'
    }
    newEl.style.display = ''
    if (dir !== null) {
      requestAnimationFrame(function() {
        newEl.style.transition = 'opacity 0.25s ease, transform 0.25s cubic-bezier(0.4,0,0.2,1)'
        newEl.style.opacity = '1'
        newEl.style.transform = 'translateX(0)'
      })
    }
  }

  // Update stepper pills
  for (var i = 1; i <= _wizTotal; i++) {
    var circle = document.getElementById('wiz-circle-' + i)
    var pill = document.getElementById('wiz-pill-' + i)
    if (!circle) continue
    if (i < next) {
      // Completed
      circle.style.background = '#E8760A'
      circle.style.color = 'white'
      circle.style.boxShadow = 'none'
      circle.style.border = 'none'
      circle.innerHTML = '<svg viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="3" width="14" height="14"><polyline points="20 6 9 17 4 12"/></svg>'
    } else if (i === next) {
      // Active
      circle.style.background = '#E8760A'
      circle.style.color = 'white'
      circle.style.boxShadow = '0 2px 8px rgba(232,137,28,0.35)'
      circle.style.border = 'none'
      circle.innerHTML = String(i)
    } else {
      // Future
      circle.style.background = '#f3f4f6'
      circle.style.color = '#9ca3af'
      circle.style.boxShadow = 'none'
      circle.style.border = '2px solid #e5e7eb'
      circle.innerHTML = String(i)
    }
    // Label color — target text wrapper's children (not the circle)
    if (pill) {
      var textWrap = pill.querySelectorAll(':scope > div')[1]
      var lbl = textWrap ? textWrap.querySelector('div:first-child') : null
      var sub = textWrap ? textWrap.querySelector('div:last-child') : null
      if (lbl) { lbl.style.color = i <= next ? '#1f2937' : '#9ca3af'; lbl.style.fontWeight = i === next ? '700' : '500' }
      if (sub) sub.style.color = i <= next ? '#6b7280' : '#d1d5db'
    }
    // Connector line color
    var line = document.getElementById('wiz-line-' + i)
    if (line) line.style.background = i < next ? '#E8760A' : '#e5e7eb'
  }

  // Update step label
  var labelEl = document.getElementById('wiz-step-label')
  if (labelEl) { labelEl.textContent = 'Step ' + next + ' of ' + _wizTotal + ': ' + _STEP_LABELS[next - 1]; labelEl.style.color = '#6b7280'; labelEl.style.fontWeight = '600' }

  // Back button
  var backBtn = document.getElementById('wiz-btn-back')
  if (backBtn) { backBtn.style.display = 'inline-flex'; backBtn.style.visibility = next > 1 ? 'visible' : 'hidden' }

  // Next vs Save button
  var nextBtn = document.getElementById('wiz-btn-next')
  var saveBtn = document.getElementById('wiz-btn-save')
  if (next < _wizTotal) {
    if (nextBtn) nextBtn.style.display = 'inline-flex'
    if (saveBtn) saveBtn.style.display = 'none'
  } else {
    if (nextBtn) nextBtn.style.display = 'none'
    if (saveBtn) saveBtn.style.display = 'inline-flex'
    // Trigger rx preview when arriving at step 6
    if (window.updateRxPreview && window._examPatientId) {
      setTimeout(function() { window.updateRxPreview(window._examPatientId) }, 60)
    }
  }
}
window.examWizInit = examWizInit
window.examWizGo   = examWizGo
window.examWizJump = examWizJump

// ════════════════════════════════════════════════════════════════
//  OPTICAL EXAMINATION — START FROM APPOINTMENT
// ════════════════════════════════════════════════════════════════
window._examApptId     = null   // tracks which appointment triggered this exam
window._examApptDoctor = null   // admin-side: doctor from appointment

// Examinations always trace back to a confirmed appointment — no walk-in
// path that skips it, so the clinic's booking/approval process can't be
// bypassed by starting a consultation for a patient with no appointment record.
function startExamFromAppt(apptId) {
  const appt = appointments.find(a => a.id === apptId)
  if (!appt) return
  window._examApptId     = apptId
  window._examApptDoctor = appt.doctorName || null
  toast('Starting consultation for ' + appt.patientName + '…', 'info')
  navigate('new-examination', { patientId: appt.patientId })
}
window.startExamFromAppt = startExamFromAppt


// ════════════════════════════════════════════════════════════════
//  OPTICAL EXAMINATION — SAVE NEW EXAM
// ════════════════════════════════════════════════════════════════
async function saveNewExam(patientId) {
  const p = patients.find(p => p.id === patientId)
  if (!p) return

  const gv = id => (document.getElementById(id) || {}).value?.trim() || ''
  const coatings = []
  document.querySelectorAll('[id^="ne-coat-"]:checked').forEach(cb => coatings.push(cb.value))

  const date = gv('ne-date') || localDateStr()
  const doctorName = (window._examApptDoctor && state.role === 'admin') ? window._examApptDoctor : state.user.name
  const issuePrescription = !!document.getElementById('r-issue-yes')?.checked
  const examId = state.params?.examId || null

  // Appointment Type and Status used to be re-entered here by hand, but
  // they're already captured earlier in the visit's lifecycle — Type at
  // booking (by the patient or staff on their behalf) and Status by
  // admin/staff working the appointment queue — so asking the doctor to
  // pick them again was pure duplicate (and occasionally contradictory —
  // e.g. a "No-show" status on a visit that clearly happened, since an
  // exam record is only ever created for a visit that did happen). Derive
  // both instead: from the linked appointment when starting a fresh exam
  // from one, from the exam's own already-saved consultation when editing,
  // or a sane default for a standalone new exam with neither.
  const linkedAppt = window._examApptId ? appointments.find(a => a.id === window._examApptId) : null
  const existingCon = (!linkedAppt && examId) ? (p.consultations || []).find(c => c.examId === examId) : null
  const appointmentType   = linkedAppt?.type || existingCon?.type || 'Comprehensive Eye Examination'
  const consultationStatus = existingCon?.status || 'completed'

  // Dispensing/administrative visits (Lens Fitting, Optical Frame
  // Selection — see NON_EXAM_SERVICE_TYPES, db.js) never involve an
  // actual clinical diagnosis, since nothing was examined. Requiring one
  // here was exactly why those appointments could never be completed at
  // all — the New Examination wizard was the only completion path (see
  // startExamFromAppt()), and it hard-blocked on this field regardless of
  // what the visit actually was.
  const diagnosis = gv('ne-diagnosis')
  if (!NON_EXAM_SERVICE_TYPES.includes(appointmentType) && !diagnosis) {
    toast('Please enter a diagnosis.', 'error'); return
  }

  // One visit, three payloads — matches the field boundaries in
  // api/examinations/create.php (consultation narrative / exam
  // measurements / issued prescription).
  const od = { vaUncorrected: gv('ne-od-va-un'), va: gv('ne-od-va'), sph: gv('ne-od-sph'), cyl: gv('ne-od-cyl'), axis: gv('ne-od-axis'), add: gv('ne-od-add') }
  const os = { vaUncorrected: gv('ne-os-va-un'), va: gv('ne-os-va'), sph: gv('ne-os-sph'), cyl: gv('ne-os-cyl'), axis: gv('ne-os-axis'), add: gv('ne-os-add') }
  const iop = { od: gv('ne-iop-od'), os: gv('ne-iop-os') }
  const pd = gv('ne-pd')

  const payload = {
    date,
    appointmentType,
    chiefComplaint:         gv('ne-con-complaint'),
    historyPresentIllness:  gv('ne-con-history'),
    assessment:              gv('ne-con-assessment'),
    recommendation:          gv('ne-con-recommendation'),
    followUpDate:            document.getElementById('r-followup-yes')?.checked ? gv('ne-con-followup') : '',
    followUpTime:            document.getElementById('r-followup-yes')?.checked ? gv('ne-con-followup-time') : '',
    consultationStatus,
    od, os, iop, pd,
    externalFindings:        gv('ne-ext-findings'),
    diagnosis,
    testResults:             [gv('ne-test-results'), (document.querySelector('input[name="ne-ishihara"]:checked')?.value ? 'Ishihara: ' + document.querySelector('input[name="ne-ishihara"]:checked').value : '')].filter(Boolean).join('. '),
    remarks:                 gv('ne-remarks'),
    issuePrescription,
    lensType:                gv('ne-lens-type'),
    lensMaterial:            gv('ne-lens-material'),
    lensCoating:             coatings,
    frameSelection:          gv('ne-frame'),
    // Dispensing — only meaningful (and only sent/saved server-side)
    // alongside an actually-issued prescription; see api/examinations/
    // create.php and update.php.
    totalAmount:             gv('ne-total'),
    dispensedDate:           gv('ne-dispensed-date'),
    receivedBy:              gv('ne-received-by'),
  }

  const saveBtn = document.getElementById('wiz-btn-save')
  if (saveBtn) { saveBtn.disabled = true; saveBtn.textContent = 'Saving…' }

  try {
    if (examId) {
      // ── Editing an existing record — update it in place, and now also
      // propagate to the linked consultation and (if issuing) prescription
      // rows, via api/examinations/update.php's new FK-aware logic.
      const r = await fetch('api/examinations/update.php', {
        method:  'POST',
        headers: { 'Content-Type': 'application/json' },
        body:    JSON.stringify({ patientId, examId, ...payload })
      })
      const d = await r.json()
      if (!d.success) {
        toast(d.message || 'Failed to update examination.', 'error')
        return
      }

      const updatedExam = {
        id: examId, date, doctor: doctorName,
        od, os, iop, pd,
        externalFindings: payload.externalFindings,
        diagnosis, testResults: payload.testResults, remarks: payload.remarks,
        status: 'completed'
      }
      const idx = p.examinations.findIndex(ex => ex.id === examId)
      if (idx >= 0) p.examinations[idx] = updatedExam
      else p.examinations.unshift(updatedExam)
      p.lastVisit = date

      toast('Examination record updated successfully.', 'success')
      navigate('patient-view', { patientId, patientName: p.name })
      return
    }

    const apptId = window._examApptId || null
    const r = await fetch('api/examinations/create.php', {
      method:  'POST',
      headers: { 'Content-Type': 'application/json' },
      body:    JSON.stringify({ patientId, apptId, ...payload })
    })
    const d = await r.json()
    if (!d.success) {
      toast(d.message || 'Failed to save examination.', 'error')
      return
    }

    // Update local arrays so the UI stays consistent without a full reload
    p.examinations.unshift({
      id: d.id, date, doctor: doctorName, consultationId: d.consultationId,
      od, os, iop, pd,
      externalFindings: payload.externalFindings,
      diagnosis, testResults: payload.testResults, remarks: payload.remarks,
      status: 'completed'
    })
    if (!p.consultations) p.consultations = []
    p.consultations.unshift({
      id: d.consultationId, date, doctor: doctorName, examId: d.id,
      type: payload.appointmentType,
      chiefComplaint: payload.chiefComplaint,
      historyPresentIllness: payload.historyPresentIllness,
      assessment: payload.assessment,
      recommendation: payload.recommendation,
      followUpDate: payload.followUpDate,
      followUpTime: payload.followUpTime,
      status: payload.consultationStatus
    })
    if (d.rxId) {
      if (!p.prescriptions) p.prescriptions = []
      p.prescriptions.unshift({
        id: d.rxId, date, doctor: doctorName, examId: d.id,
        expiryDate: '', status: 'valid', prcLicense: '',
        od: { sph: od.sph, cyl: od.cyl, axis: od.axis, add: od.add },
        os: { sph: os.sph, cyl: os.cyl, axis: os.axis, add: os.add },
        pd, lensType: payload.lensType, lensMaterial: payload.lensMaterial,
        frameSelection: payload.frameSelection, lensCoating: coatings,
        totalAmount: payload.totalAmount || null,
        dispensedDate: payload.dispensedDate, receivedBy: payload.receivedBy
      })
    }
    p.lastVisit = date

    if (apptId) {
      updateAppointmentStatus(apptId, 'completed')
      window._examApptId     = null
      window._examApptDoctor = null
    }

    toast('Examination record saved successfully.', 'success')
    navigate('patient-view', { patientId, patientName: p.name })
  } catch (_) {
    toast('Network error. Please try again.', 'error')
  } finally {
    if (saveBtn) { saveBtn.disabled = false; saveBtn.innerHTML = window.icon('check','icon-sm') + ' ' + (examId ? 'Save Changes' : 'Save Examination') }
  }
}
window.saveNewExam = saveNewExam

// ════════════════════════════════════════════════════════════════
//  OPTICAL EXAMINATION — PRINT WIZARD DRAFT (Step 6)
// ════════════════════════════════════════════════════════════════
// Prints the draft as a Prescription document — matches what
// updateRxPreview() shows on the Review step, gated the same way on the
// "Issue Prescription" toggle from the Prescription step.
function printNewExamDraft(patientId) {
  const p = patients.find(pt => pt.id === patientId)
  if (!p) return
  if (!document.getElementById('r-issue-yes')?.checked) {
    toast('Toggle "Issue Prescription" on the Prescription step to print one.', 'info')
    return
  }
  const gv = id => (document.getElementById(id)?.value || '').trim()
  const coatings = []
  document.querySelectorAll('[id^="ne-coat-"]:checked').forEach(cb => coatings.push(cb.value))
  const doctor = (window._examApptDoctor && state.role === 'admin') ? window._examApptDoctor : (state.user?.name || '—')
  const date = gv('ne-date') || localDateStr()
  const expiryDate = new Date(date + 'T00:00:00')
  expiryDate.setFullYear(expiryDate.getFullYear() + 1)

  const rx = {
    id:       'DRAFT',
    date,
    expiryDate: localDateStr(expiryDate),
    status:   'valid',
    prcLicense: window.state?.doctorPrcLicense || '',
    doctor,
    od:       { sph: gv('ne-od-sph'), cyl: gv('ne-od-cyl'), axis: gv('ne-od-axis'), add: gv('ne-od-add') },
    os:       { sph: gv('ne-os-sph'), cyl: gv('ne-os-cyl'), axis: gv('ne-os-axis'), add: gv('ne-os-add') },
    pd:       gv('ne-pd'),
    lensType:       gv('ne-lens-type'),
    lensMaterial:   gv('ne-lens-material'),
    lensCoating:    coatings,
    frameSelection: gv('ne-frame'),
  }
  _openRxPrintWindow(p, rx)
}
window.printNewExamDraft = printNewExamDraft

// ════════════════════════════════════════════════════════════════
//  OPTICAL EXAMINATION — RX PREVIEW UPDATER
// ════════════════════════════════════════════════════════════════
function updateRxPreview(patientId) {
  const el = document.getElementById('ne-rx-preview')
  if (!el) return
  const gv = id => (document.getElementById(id) || {}).value?.trim() || '—'
  const p  = patients.find(p => p.id === patientId)
  const pName = p ? p.name : patientId

  // Nothing to preview if the doctor hasn't toggled "Issue Prescription" —
  // matches create.php's explicit-flag gate, no inferring from filled fields.
  const issuing = document.getElementById('r-issue-yes')?.checked
  if (!issuing) {
    el.innerHTML = `<div style="text-align:center;color:#9CA3AF;font-size:.84rem;padding:16px">No prescription will be issued for this visit. Toggle "Issue Prescription" on the Prescription step to preview one.</div>`
    return
  }

  const doctorName  = window.state?.user?.name || 'Dr. Lalaine Cana'
  const pidDisplay  = gv('ne-patient-id') !== '—' ? gv('ne-patient-id') : (p ? p.id : '—')
  const patientName = gv('ne-patient-name') !== '—' ? gv('ne-patient-name') : pName
  const examDate    = gv('ne-date') !== '—' ? gv('ne-date') : localDateStr()
  const infoRow = (label, val, orange=false) =>
    `<div><div style="font-size:.58rem;font-weight:700;text-transform:uppercase;letter-spacing:.06em;color:#9CA3AF;margin-bottom:2px">${label}</div><div style="font-size:.8rem;font-weight:600;color:${orange?'#E8891C':'#1C1C1C'}">${val}</div></div>`
  // Metric cell used inside the OD/OS cards below — flex-wraps its own
  // content instead of living in a fixed-width table column, so the whole
  // block reflows on narrow screens (renderRxDocumentCard, main.js, uses
  // this same bordered-card pattern for the same reason).
  const eyeField = (label, val) =>
    `<div style="flex:1;min-width:0;text-align:center;padding:8px 4px">
       <div style="font-size:.55rem;font-weight:700;text-transform:uppercase;letter-spacing:.05em;color:#9CA3AF;margin-bottom:3px">${label}</div>
       <div style="font-size:.8rem;font-weight:800;font-family:monospace;color:#1C1C1C;overflow:hidden;text-overflow:ellipsis">${val||'—'}</div>
     </div>`

  el.innerHTML = `
    <!-- Clinic Header -->
    <div style="display:flex;align-items:center;gap:12px;padding-bottom:14px;margin-bottom:14px;border-bottom:1px solid #e5e7eb">
      <img src="${window._clinicLogoUrl || 'assets/images/logo/clinic-logo.png'}" style="width:40px;height:40px;border-radius:50%;object-fit:contain;border:1px solid #e5e7eb;padding:2px;flex-shrink:0" onerror="this.style.display='none'">
      <div>
        <div style="font-size:.9rem;font-weight:700;color:#1C1C1C;line-height:1.2">Cana Optical Clinic</div>
        <div style="font-size:.68rem;color:#6B7280;margin-top:2px">Unit 3 Paseo de Carmona, Brgy. Maduya, Carmona, Cavite</div>
      </div>
    </div>

    <!-- Patient Details (2-column) -->
    <div style="display:grid;grid-template-columns:1fr 1fr;gap:10px;margin-bottom:14px;padding-bottom:14px;border-bottom:1px solid #f3f4f6">
      ${infoRow('Patient Name', patientName)}
      ${infoRow('Patient ID', pidDisplay, true)}
      ${infoRow('Doctor', doctorName)}
      ${infoRow('Consultation Date', examDate)}
    </div>

    <!-- OD/OS cards — reflow to a single column on narrow screens instead
         of a wide table needing its own horizontal scroll to read. -->
    <div style="display:grid;grid-template-columns:repeat(auto-fit,minmax(160px,1fr));gap:10px;margin-bottom:14px">
      <div style="border:1.5px solid #86EFAC;border-radius:8px;overflow:hidden">
        <div style="background:#F0FDF4;padding:6px 10px;border-bottom:1px solid #86EFAC">
          <span style="font-size:.62rem;font-weight:800;text-transform:uppercase;letter-spacing:.06em;color:#059669">OD (Right)</span>
        </div>
        <div style="display:flex;background:#fff">
          ${eyeField('SPH', gv('ne-od-sph'))}
          ${eyeField('CYL', gv('ne-od-cyl'))}
          ${eyeField('AXIS', gv('ne-od-axis'))}
          ${eyeField('ADD', gv('ne-od-add'))}
        </div>
      </div>
      <div style="border:1.5px solid #FDE68A;border-radius:8px;overflow:hidden">
        <div style="background:#FFF7ED;padding:6px 10px;border-bottom:1px solid #FDE68A">
          <span style="font-size:.62rem;font-weight:800;text-transform:uppercase;letter-spacing:.06em;color:#B45309">OS (Left)</span>
        </div>
        <div style="display:flex;background:#fff">
          ${eyeField('SPH', gv('ne-os-sph'))}
          ${eyeField('CYL', gv('ne-os-cyl'))}
          ${eyeField('AXIS', gv('ne-os-axis'))}
          ${eyeField('ADD', gv('ne-os-add'))}
        </div>
      </div>
    </div>

    <!-- Summary fields — flex-wrap so a long value drops to its own line
         under the label instead of forcing the row wider than its card. -->
    <div style="display:flex;flex-direction:column;gap:8px;margin-bottom:16px;padding:12px;background:#f9fafb;border-radius:8px;border:1px solid #e5e7eb">
      <div style="display:flex;flex-wrap:wrap;gap:4px 8px;font-size:.8rem">
        <span style="font-weight:600;color:#6B7280;min-width:140px">Pupillary Distance:</span>
        <span style="color:#1C1C1C;font-weight:500">${gv('ne-pd')}</span>
      </div>
      <div style="display:flex;flex-wrap:wrap;gap:4px 8px;font-size:.8rem">
        <span style="font-weight:600;color:#6B7280;min-width:140px">Lens Type:</span>
        <span style="color:#1C1C1C;font-weight:500">${gv('ne-lens-type')}</span>
      </div>
      <div style="display:flex;flex-wrap:wrap;gap:4px 8px;font-size:.8rem">
        <span style="font-weight:600;color:#6B7280;min-width:140px">Lens Material:</span>
        <span style="color:#1C1C1C;font-weight:500">${gv('ne-lens-material')}</span>
      </div>
      <div style="display:flex;flex-wrap:wrap;gap:4px 8px;font-size:.8rem">
        <span style="font-weight:600;color:#6B7280;min-width:140px">Frame Selection:</span>
        <span style="color:#1C1C1C;font-weight:500">${gv('ne-frame')}</span>
      </div>
    </div>

    <!-- Doctor signature -->
    <div style="display:flex;justify-content:flex-end">
      <div style="text-align:center;min-width:160px;border-top:1px solid #d1d5db;padding-top:8px">
        <div style="font-size:.65rem;color:#9CA3AF;text-transform:uppercase;letter-spacing:.06em;margin-bottom:4px">Examining Optometrist</div>
        <div style="font-size:.85rem;font-weight:700;color:#1C1C1C">${doctorName}, OD</div>
      </div>
    </div>`
}
window.updateRxPreview = updateRxPreview

// ════════════════════════════════════════════════════════════════
//  OPTICAL EXAMINATION — CONSULTATION TIMELINE TOGGLE
// ════════════════════════════════════════════════════════════════
function toggleConsultEntry(id) {
  const body  = document.getElementById('consult-body-' + id)
  const arrow = document.getElementById('consult-arrow-' + id)
  if (!body) return
  const isOpen = body.style.display !== 'none'
  body.style.display  = isOpen ? 'none' : ''
  if (arrow) arrow.style.transform = isOpen ? '' : 'rotate(180deg)'
}
window.toggleConsultEntry = toggleConsultEntry

// ════════════════════════════════════════════════════════════════
//  OPTICAL EXAMINATION — VIEW EXAM DETAIL MODAL
// ════════════════════════════════════════════════════════════════
// examinations has no dedicated Ishihara column (see database/schema.sql)
// — the wizard's saveNewExam() folds it into test_results as a trailing
// "Ishihara: Normal/Deficient" clause instead. Split it back out so it can
// render as its own block rather than buried in a paragraph of free text.
function _splitIshihara(testResults) {
  if (!testResults) return { plain: '', ishihara: null }
  const m = testResults.match(/^(.*?)(?:\.\s*)?Ishihara:\s*(Normal|Deficient)\.?\s*$/i)
  if (!m) return { plain: testResults, ishihara: null }
  return { plain: m[1].trim(), ishihara: m[2] }
}
window._splitIshihara = _splitIshihara

function viewExamDetail(patientId, examId) {
  const p = patients.find(p => p.id === patientId)
  if (!p) return
  const e = p.examinations.find(e => e.id === examId)
  if (!e) return
  const { plain: testResultsPlain, ishihara } = _splitIshihara(e.testResults)

  const statusColor = { completed:'#059669', pending:'#D97706', cancelled:'#DC2626' }
  const sc = statusColor[e.status] || '#059669'
  const statusLabel = (e.status || 'completed').charAt(0).toUpperCase() + (e.status || 'completed').slice(1)

  const examDate = new Date(e.date.includes('T') ? e.date : e.date + 'T00:00:00')
  const examDateStr = examDate.toLocaleDateString('en-PH', {year:'numeric',month:'long',day:'numeric'})
  const docRecord = doctors.find(d => d.name === e.doctor)
  const docPhoto  = docRecord?.photoUrl || null
  const docInits  = (e.doctor||'Dr').split(' ').slice(0,2).map(w=>w[0]||'').join('').toUpperCase()
  const patInits  = (p.name||'').split(' ').slice(0,2).map(w=>w[0]||'').join('').toUpperCase()

  const eyeField = (label, val, isLast) => `
    <div style="padding:10px 6px;${isLast ? '' : 'border-right:1px solid #F3F4F6;'}text-align:center;flex:1;min-width:0">
      <div style="font-size:.58rem;font-weight:700;text-transform:uppercase;letter-spacing:.07em;color:#9CA3AF;margin-bottom:4px">${label}</div>
      <div style="font-size:.9rem;font-weight:800;font-family:monospace;color:#1C1C1C">${val || '—'}</div>
    </div>`

  showModal(`
    <div class="modal-header">
      <div class="modal-title">Examination Results</div>
      <button class="modal-close" onclick="window.closeModal()">&times;</button>
    </div>
    <div class="modal-body" style="padding:0">

      <!-- Branded clinic header -->
      <div style="background:linear-gradient(135deg,#1C1C1C 0%,#2A2A2A 100%);padding:18px 24px;display:flex;align-items:center;justify-content:space-between;gap:12px">
        <div>
          <div style="font-size:.6rem;text-transform:uppercase;letter-spacing:.14em;color:#E8760A;font-weight:800;margin-bottom:3px">Optical Examination Results</div>
          <div style="font-size:1.1rem;font-weight:900;color:#fff;letter-spacing:-.01em">Cana Optical Clinic</div>
        </div>
        <div style="text-align:right;flex-shrink:0">
          <div style="font-size:.6rem;color:rgba(255,255,255,.35);text-transform:uppercase;letter-spacing:.05em;margin-bottom:2px">Exam ID</div>
          <div style="font-size:.72rem;font-family:monospace;color:rgba(255,255,255,.55);margin-bottom:8px">${e.id}</div>
          <span style="background:${sc};color:#fff;padding:3px 10px;border-radius:20px;font-size:.68rem;font-weight:700">${statusLabel}</span>
        </div>
      </div>

      <div style="padding:18px 24px 0">
        <!-- Patient + Doctor block — same card used by viewPrescriptionModal(),
             reusing its .rx-pd-block/.rx-issued-block mobile-stacking CSS. -->
        <div class="rx-pd-block" style="display:flex;align-items:flex-start;gap:14px;padding:14px 16px;background:#F9FAFB;border:1px solid #F3F4F6;border-radius:10px">
          <div class="rx-patient-row" style="display:flex;align-items:center;gap:14px;flex:1;min-width:0">
            ${p.photoUrl
              ? `<div class="rx-pat-avatar" style="width:46px;height:46px;border-radius:50%;overflow:hidden;flex-shrink:0"><img src="${p.photoUrl}" alt="${p.name}" style="width:100%;height:100%;object-fit:cover;border-radius:50%;display:block" onerror="var w=this.parentElement;if(w){w.style.cssText='width:46px;height:46px;border-radius:50%;background:#E8760A;display:flex;align-items:center;justify-content:center;font-size:1rem;font-weight:800;color:#fff;flex-shrink:0';w.className='rx-pat-avatar';w.textContent='${patInits.replace(/'/g,"\\'")}'}"></div>`
              : `<div class="rx-pat-avatar" style="width:46px;height:46px;border-radius:50%;background:#E8760A;display:flex;align-items:center;justify-content:center;font-size:1rem;font-weight:800;color:#fff;flex-shrink:0">${patInits}</div>`
            }
            <div style="flex:1;min-width:0">
              <div style="font-size:.97rem;font-weight:800;color:#111;margin-bottom:2px">${p.name}</div>
              <div style="font-size:.7rem;font-family:monospace;color:#9CA3AF;margin-bottom:5px">${p.id}</div>
              <div style="display:flex;flex-wrap:wrap;gap:5px 12px">
                ${p.gender || p.age ? `<span style="font-size:.73rem;color:#555">${[p.gender, p.age ? p.age + ' yrs' : ''].filter(Boolean).join(', ')}</span>` : ''}
                ${p.contact ? `<span style="font-size:.73rem;color:#555">${p.contact}</span>` : ''}
              </div>
            </div>
          </div>
          <div class="rx-issued-block" style="text-align:right;flex-shrink:0;min-width:150px;display:flex;align-items:center;justify-content:flex-end;gap:8px">
            <div>
              <div style="font-size:.62rem;color:#9CA3AF;text-transform:uppercase;letter-spacing:.04em;margin-bottom:2px">Doctor</div>
              <div style="font-size:.85rem;font-weight:700;color:#111">${e.doctor}</div>
              <div style="font-size:.72rem;color:#6B7280;margin-top:2px">${examDateStr}</div>
            </div>
            ${docPhoto
              ? `<div class="rx-doc-avatar" style="width:36px;height:36px;border-radius:50%;overflow:hidden;flex-shrink:0"><img src="${docPhoto}" alt="${e.doctor}" style="width:100%;height:100%;object-fit:cover;border-radius:50%;display:block"></div>`
              : `<div class="rx-doc-avatar" style="width:36px;height:36px;border-radius:50%;background:#1C1C1C;display:flex;align-items:center;justify-content:center;font-size:.7rem;font-weight:800;color:#E8760A;flex-shrink:0;letter-spacing:.02em">${docInits}</div>`
            }
          </div>
        </div>
      </div>

      <div style="padding:18px 24px;display:flex;flex-direction:column;gap:18px">

        <!-- Visual Acuity & Refraction -->
        <div>
          <div style="font-size:.63rem;font-weight:700;text-transform:uppercase;letter-spacing:.1em;color:#9CA3AF;margin-bottom:10px">Visual Acuity &amp; Refraction</div>
          <div style="display:grid;grid-template-columns:1fr 1fr;gap:10px">

            <!-- OD Card -->
            <div style="border:1.5px solid #86EFAC;border-radius:10px;overflow:hidden">
              <div style="background:#F0FDF4;padding:8px 12px;border-bottom:1px solid #86EFAC;display:flex;align-items:center;gap:6px">
                <div style="width:7px;height:7px;border-radius:50%;background:#22C55E;flex-shrink:0"></div>
                <span style="font-size:.65rem;font-weight:800;text-transform:uppercase;letter-spacing:.07em;color:#059669">OD (Right Eye)</span>
              </div>
              <div style="display:flex;background:#fff">
                ${eyeField('VA (Uncorr.)', e.od?.vaUncorrected, false)}
                ${eyeField('VA (Corr.)', e.od?.va, false)}
                ${eyeField('SPH', e.od?.sph, false)}
                ${eyeField('CYL', e.od?.cyl, false)}
                ${eyeField('AXIS', e.od?.axis, true)}
              </div>
            </div>

            <!-- OS Card -->
            <div style="border:1.5px solid #FDE68A;border-radius:10px;overflow:hidden">
              <div style="background:#FFF7ED;padding:8px 12px;border-bottom:1px solid #FDE68A;display:flex;align-items:center;gap:6px">
                <div style="width:7px;height:7px;border-radius:50%;background:#E8760A;flex-shrink:0"></div>
                <span style="font-size:.65rem;font-weight:800;text-transform:uppercase;letter-spacing:.07em;color:#B45309">OS (Left Eye)</span>
              </div>
              <div style="display:flex;background:#fff">
                ${eyeField('VA (Uncorr.)', e.os?.vaUncorrected, false)}
                ${eyeField('VA (Corr.)', e.os?.va, false)}
                ${eyeField('SPH', e.os?.sph, false)}
                ${eyeField('CYL', e.os?.cyl, false)}
                ${eyeField('AXIS', e.os?.axis, true)}
              </div>
            </div>
          </div>
        </div>

        <!-- IOP + PD -->
        ${(e.iop?.od || e.iop?.os || e.pd) ? `
        <div style="display:grid;grid-template-columns:${[e.iop?.od||e.iop?.os ? '1fr 1fr' : '', e.pd ? '1fr' : ''].filter(Boolean).join(' ')};gap:8px">
          ${e.iop?.od || e.iop?.os ? `
          <div style="background:#F9FAFB;border:1px solid #F3F4F6;border-radius:8px;padding:11px 13px">
            <div style="font-size:.58rem;font-weight:700;text-transform:uppercase;letter-spacing:.08em;color:#9CA3AF;margin-bottom:3px">IOP (Right Eye)</div>
            <div style="font-size:1.05rem;font-weight:800;color:#1C1C1C;font-family:monospace">${e.iop?.od || '—'} <span style="font-size:.67rem;font-weight:400;color:#9CA3AF">mmHg</span></div>
          </div>
          <div style="background:#F9FAFB;border:1px solid #F3F4F6;border-radius:8px;padding:11px 13px">
            <div style="font-size:.58rem;font-weight:700;text-transform:uppercase;letter-spacing:.08em;color:#9CA3AF;margin-bottom:3px">IOP (Left Eye)</div>
            <div style="font-size:1.05rem;font-weight:800;color:#1C1C1C;font-family:monospace">${e.iop?.os || '—'} <span style="font-size:.67rem;font-weight:400;color:#9CA3AF">mmHg</span></div>
          </div>` : ''}
          ${e.pd ? `
          <div style="background:#F9FAFB;border:1px solid #F3F4F6;border-radius:8px;padding:11px 13px">
            <div style="font-size:.58rem;font-weight:700;text-transform:uppercase;letter-spacing:.08em;color:#9CA3AF;margin-bottom:3px">Pupillary Distance</div>
            <div style="font-size:1.05rem;font-weight:800;color:#1C1C1C;font-family:monospace">${e.pd} <span style="font-size:.67rem;font-weight:400;color:#9CA3AF">mm</span></div>
          </div>` : ''}
        </div>` : ''}

        <!-- External / Internal Findings -->
        ${e.externalFindings ? `
        <div>
          <div style="font-size:.63rem;font-weight:700;text-transform:uppercase;letter-spacing:.1em;color:#9CA3AF;margin-bottom:6px">External / Internal Findings</div>
          <div style="background:#F9FAFB;border:1px solid #F3F4F6;border-radius:8px;padding:11px 13px;font-size:.8rem;color:#374151;line-height:1.65">${e.externalFindings}</div>
        </div>` : ''}

        <!-- Diagnosis -->
        <div style="background:#F9FAFB;border:1px solid #F3F4F6;border-radius:10px;padding:14px 16px">
          <div style="font-size:.63rem;font-weight:700;text-transform:uppercase;letter-spacing:.1em;color:#9CA3AF;margin-bottom:8px">Diagnosis</div>
          <div style="font-size:1rem;font-weight:800;color:#1C1C1C">${e.diagnosis || '—'}</div>
        </div>

        <!-- Ishihara -->
        ${ishihara ? `
        <div style="display:flex;align-items:center;gap:8px;background:#F9FAFB;border:1px solid #F3F4F6;border-radius:8px;padding:11px 13px;font-size:.8rem;color:#374151">
          <span style="font-weight:600;color:#6B7280">Ishihara Test:</span>
          <span style="font-size:.72rem;font-weight:700;padding:2px 10px;border-radius:20px;${ishihara === 'Normal' ? 'background:#DCFCE7;color:#16A34A' : 'background:#FEF3C7;color:#B45309'}">${ishihara}</span>
        </div>` : ''}

        <!-- Test Results -->
        ${testResultsPlain ? `
        <div>
          <div style="font-size:.63rem;font-weight:700;text-transform:uppercase;letter-spacing:.1em;color:#9CA3AF;margin-bottom:6px">Test Results</div>
          <div style="background:#F9FAFB;border:1px solid #F3F4F6;border-radius:8px;padding:11px 13px;font-size:.8rem;color:#374151;line-height:1.65">${testResultsPlain}</div>
        </div>` : ''}

        <!-- Clinical Remarks -->
        ${e.remarks ? `
        <div style="border-top:1px solid #F3F4F6;padding-top:16px">
          <div style="font-size:.63rem;font-weight:700;text-transform:uppercase;letter-spacing:.1em;color:#9CA3AF;margin-bottom:6px">Clinical Remarks</div>
          <div style="font-size:.83rem;color:#374151;line-height:1.7;font-style:italic;padding-left:12px;border-left:3px solid #E8760A">"${e.remarks}"</div>
          <div style="font-size:.7rem;color:#9CA3AF;margin-top:4px;padding-left:15px">by ${e.doctor}</div>
        </div>` : ''}

      </div>
    </div>
    <div class="modal-footer" style="flex-direction:column;align-items:stretch;gap:10px">
      <div style="display:flex;justify-content:flex-end;flex-wrap:wrap;gap:8px">
        ${e.consultationId ? `<button class="btn-ghost" onclick="window.closeModal();window.viewConsultationDetail('${patientId}','${e.consultationId}')">
          ${icon('message-square','icon-sm')} Consultation
        </button>` : ''}
        <button class="btn-ghost" onclick="window.viewPrescriptionModal('${patientId}','${examId}')">
          ${icon('file-text','icon-sm')} Prescription
        </button>
        ${state.role !== 'patient' ? `<button class="btn-ghost" style="color:#0891b2;border-color:#0891b2" onclick="window.closeModal();window.generateClearance('${patientId}','${examId}')">
          ${icon('award','icon-sm')} Generate Clearance
        </button>
        <button class="btn-secondary" onclick="window.downloadExamRecordPDF('${examId}',this)">
          ${icon('download','icon-sm')} Download PDF
        </button>` : ''}
      </div>
      <div style="display:flex;justify-content:flex-end;gap:8px">
        <button class="btn-secondary" onclick="window.closeModal()">Close</button>
        ${state.role !== 'patient' ? `<button class="btn-primary" onclick="window.printExamRecord('${examId}')">
          ${icon('printer','icon-sm')} Print
        </button>` : ''}
      </div>
    </div>`, 'modal-lg')
}
window.viewExamDetail = viewExamDetail

// ════════════════════════════════════════════════════════════════
//  PATIENT — VIEW CONSULTATION DETAIL (from the compact Consultations list)
// ════════════════════════════════════════════════════════════════
// The narrative of the visit — must never show SPH/CYL/AXIS or any
// refraction data (see database/schema.sql's `consultations` CREATE
// TABLE comment). That's Examination History's job.
function viewConsultationDetail(patientId, consultationId) {
  const p = patients.find(p => p.id === patientId)
  if (!p) return
  const c = (p.consultations || []).find(c => c.id === consultationId)
  if (!c) return

  const cDate    = new Date(c.date.includes('T') ? c.date : c.date + 'T00:00:00')
  const cDateStr = cDate.toLocaleDateString('en-PH', {year:'numeric',month:'long',day:'numeric'})
  const statusColor = { completed:'#059669', cancelled:'#DC2626', 'no-show':'#D97706' }
  const sc = statusColor[c.status] || '#059669'
  const statusLabel = (c.status || 'completed').split('-').map(w => w.charAt(0).toUpperCase()+w.slice(1)).join('-')
  const block = (label, val) => val ? `<div>
        <div style="font-size:.6rem;font-weight:700;text-transform:uppercase;letter-spacing:.08em;color:#9CA3AF;margin-bottom:4px">${label}</div>
        <div style="font-size:.85rem;color:#374151;line-height:1.65">${val}</div>
      </div>` : ''

  showModal(`
    <div class="modal-header">
      <div class="modal-title">Consultation Details</div>
      <button class="modal-close" onclick="window.closeModal()">&times;</button>
    </div>
    <div class="modal-body" style="display:flex;flex-direction:column;gap:14px">
      <div style="display:flex;align-items:center;justify-content:space-between;gap:12px;flex-wrap:wrap;padding-bottom:12px;border-bottom:1px solid #F3F4F6">
        <div>
          <div style="font-size:.6rem;text-transform:uppercase;letter-spacing:.08em;color:#9CA3AF;margin-bottom:2px">Date &amp; Time</div>
          <div style="font-size:.88rem;font-weight:700;color:#1C1C1C">${cDateStr}</div>
        </div>
        <div style="text-align:right">
          <div style="font-size:.6rem;text-transform:uppercase;letter-spacing:.08em;color:#9CA3AF;margin-bottom:2px">Attending Optometrist</div>
          <div style="font-size:.88rem;font-weight:700;color:#1C1C1C">${c.doctor||'—'}</div>
        </div>
      </div>
      <div style="display:flex;align-items:center;justify-content:space-between;gap:12px;flex-wrap:wrap">
        ${c.type ? `<div>
          <div style="font-size:.6rem;font-weight:700;text-transform:uppercase;letter-spacing:.08em;color:#9CA3AF;margin-bottom:4px">Appointment Type</div>
          <div style="font-size:.85rem;color:#1C1C1C">${c.type}</div>
        </div>` : '<div></div>'}
        <span style="background:${sc};color:#fff;padding:3px 10px;border-radius:20px;font-size:.68rem;font-weight:700">${statusLabel}</span>
      </div>
      ${block('Chief Complaint', c.chiefComplaint)}
      ${block('History of Present Illness', c.historyPresentIllness)}
      ${block("Doctor's Assessment", c.assessment)}
      ${block('Recommendation / Plan', c.recommendation)}
      ${c.followUpDate ? `<div>
        <div style="font-size:.6rem;font-weight:700;text-transform:uppercase;letter-spacing:.08em;color:#9CA3AF;margin-bottom:4px">Follow-up Date${c.followUpTime ? ' &amp; Time' : ''}</div>
        <div style="font-size:.85rem;font-weight:600;color:#1C1C1C">${new Date(c.followUpDate+'T00:00:00').toLocaleDateString('en-PH',{year:'numeric',month:'long',day:'numeric'})}${c.followUpTime ? ` at ${c.followUpTime}` : ''}</div>
      </div>` : ''}
    </div>
    <div class="modal-footer">
      <button class="btn-secondary" onclick="window.closeModal()">Close</button>
      ${c.examId ? `<button class="btn-ghost" onclick="window.closeModal();window.viewExamDetail('${patientId}','${c.examId}')">
        ${icon('eye','icon-sm')} Exam Record
      </button>` : ''}
    </div>`)
}
window.viewConsultationDetail = viewConsultationDetail

// ── View/Print/Clearance from getExamRecords() ───────────────────
// Thin wrapper — viewExamDetail() (above) is the single canonical exam
// rendering; this just resolves the patientId this record belongs to
// (getExamRecords() flattens across all patients, viewExamDetail() needs
// a specific one) rather than maintaining a near-duplicate modal.
function viewExamRecord(examId) {
  const e = getExamRecords().find(r => r.id === examId)
  if (!e) { toast('Record not found.', 'error'); return }
  viewExamDetail(e.patientId, examId)
}
window.viewExamRecord = viewExamRecord

// Shared by printExamRecord() and downloadExamRecordPDF() below — resolves
// an examId (as seen from the admin-wide Exam Records table, which only
// has the flattened record, not necessarily the full patient) to the same
// {p, e} pair _buildExamRecordHtml() needs.
function _resolveExamForPrint(examId) {
  const r = getExamRecords().find(r => r.id === examId)
  if (!r) { toast('Record not found.', 'error'); return null }
  const p = patients.find(pt => pt.id === r.patientId) || {
    id: r.patientId, name: r.patientName,
    gender: '—', age: '—', dob: null, contact: '—', email: '', address: ''
  }
  const e = (p.examinations||[]).find(ex => ex.id === examId) || r
  return { p, e }
}

function printExamRecord(examId) {
  const res = _resolveExamForPrint(examId)
  if (res) _openExamPrintWindow(res.p, res.e)
}
window.printExamRecord = printExamRecord

function downloadExamRecordPDF(examId, btnEl) {
  const res = _resolveExamForPrint(examId)
  if (!res) return
  const built = _buildExamRecordHtml(res.p, res.e)
  if (!built) return
  // _buildExamRecordHtml() still builds a full standalone document
  // (title/@page/<style> included) for _openExamPrintWindow()'s own use —
  // only the <body>'s inner content is needed here, styled instead by
  // the permanent .pdf-exam-doc rules in global.css.
  const bodyMatch = built.html.match(/<body[^>]*>([\s\S]*?)<\/body>/i)
  if (!bodyMatch) { toast('Could not generate the PDF.', 'error'); return }
  _downloadLiveContentAsPdf(bodyMatch[1], 'pdf-exam-doc', built.filename, btnEl)
}
window.downloadExamRecordPDF = downloadExamRecordPDF

// ════════════════════════════════════════════════════════════════
//  OPTICAL EXAMINATION — ARCHIVE
// ════════════════════════════════════════════════════════════════
// Archives the exam rather than deleting it outright — same two-step
// pattern as patients/accounts/services (see confirmArchivePatient):
// archive first (reversible, shows up under Settings > Archives), then
// permanently delete later from there if it's really no longer needed
// (that permanent path cascades to the linked consultation/prescription —
// see api/archive/delete.php's Examination branch).
function confirmDeleteExam(examId, patientId, patientName) {
  showModal(`
    <div class="modal-header">
      <div class="modal-title" style="display:flex;align-items:center;gap:10px">
        <div style="width:32px;height:32px;border-radius:50%;background:#fef3c7;display:flex;align-items:center;justify-content:center;flex-shrink:0;color:#d97706">
          ${icon('archive','icon-sm')}
        </div>
        Archive Examination Record
      </div>
      <button class="modal-close" onclick="window.closeModal()">&times;</button>
    </div>
    <div class="modal-body">
      <p style="font-size:.88rem;color:#6b7280;margin-bottom:16px">Are you sure you want to archive examination <strong>${examId}</strong> for <strong>${patientName}</strong>? It will be removed from active records but can be restored, or permanently deleted, from Settings &gt; Archives.</p>
      <div class="form-group" style="margin:0">
        <label class="form-label">Reason for Archiving <span class="req">*</span></label>
        <textarea id="exam-archive-reason" class="form-textarea" style="border-radius:8px;min-height:80px"
                  placeholder="Please provide a reason for archiving…"
                  oninput="document.getElementById('exam-archive-btn').disabled=!this.value.trim()"></textarea>
      </div>
    </div>
    <div class="modal-footer">
      <button class="btn-secondary" onclick="window.closeModal()">Cancel</button>
      <button id="exam-archive-btn" class="btn-primary" disabled
              onclick="window.doDeleteExam('${examId}','${patientId}','${patientName.replace(/'/g,"\\'")}')">
        ${icon('archive','icon-sm')}<span>Archive</span>
      </button>
    </div>`)
  setTimeout(() => {
    const ta = document.getElementById('exam-archive-reason')
    const btn = document.getElementById('exam-archive-btn')
    if (ta && btn) ta.addEventListener('input', () => { btn.disabled = !ta.value.trim() })
  }, 50)
}
window.confirmDeleteExam = confirmDeleteExam

async function doDeleteExam(examId, patientId, patientName) {
  const btn = document.getElementById('exam-archive-btn')
  const reason = (document.getElementById('exam-archive-reason') || {}).value?.trim() || 'No reason provided'
  if (_btnBusy(btn, 'primary', 'Archiving…')) return
  try {
    const r = await fetch('api/archive/create.php', {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({ profileId: examId, type: 'Examination', name: patientName, reason, archivedBy: state.user.name })
    })
    const d = await r.json()
    if (!d.success) { toast(d.message || 'Failed to archive examination.', 'error'); _btnIdle(btn); return }
    archivedRecords.push(d.record)
  } catch (_) {
    toast('Network error. Examination not archived.', 'error')
    _btnIdle(btn)
    return
  }

  // Keep local state consistent with the backend's cascade — drop the exam
  // AND the same visit's consultation/prescription from the active lists,
  // so the whole visit disappears from every tab together instead of
  // leaving stale consultation/prescription rows behind until a reload.
  const p = patients.find(pt => pt.id === patientId)
  if (p) {
    p.examinations  = (p.examinations  || []).filter(e => e.id !== examId)
    p.consultations = (p.consultations || []).filter(c => c.examId !== examId)
    p.prescriptions = (p.prescriptions || []).filter(rx => rx.examId !== examId)
  }

  addActivityLog({ id:'L'+Date.now(), user: state.user.name, role: state.role,
    action: `Archived examination ${examId} for ${patientName} — Reason: ${reason}`,
    timestamp: nowTimestamp(), type:'examination' })

  closeModal()
  toast('Examination record archived. It can be restored from Settings > Archives.', 'success')
  renderPage()
}
window.doDeleteExam = doDeleteExam

function generateClearanceFromRecord(examId) {
  const e = getExamRecords().find(r => r.id === examId)
  if (!e) { toast('Record not found.', 'error'); return }
  // Build a synthetic patient object for the clearance modal
  const p = patients.find(p => p.id === e.patientId) || {
    id: e.patientId, name: e.patientName, firstName: e.patientName.split(' ')[0],
    lastName: e.patientName.split(' ').slice(1).join(' '),
    gender: '—', dob: '—', address: '—', contact: '—'
  }
  // Inject exam into patient temporarily if needed
  const existing = p.examinations?.find(ex => ex.id === examId)
  if (!existing && p.examinations) p.examinations.push(e)
  generateClearance(e.patientId, examId)
}
window.generateClearanceFromRecord = generateClearanceFromRecord

// ════════════════════════════════════════════════════════════════
//  OPTICAL EXAMINATION — GENERATE OPHTHALMIC CLEARANCE
// ════════════════════════════════════════════════════════════════
function generateClearance(patientId, examId) {
  const p = patients.find(p => p.id === patientId)
  const e = p?.examinations?.find(ex => ex.id === examId)
  if (!p || !e) { toast('Examination record not found.', 'error'); return }

  // Doctor credentials — fully sourced from the real doctor profile, never
  // hardcoded per-name. This prints on an official document, so the name,
  // title, and every license number must always reflect whatever's
  // actually on file (Settings > User Management), or say so plainly
  // rather than guess.
  const realDoc = doctors.find(d => d.name === e.doctor)
  const doc = {
    name:  (realDoc?.name || e.doctor || 'DOCTOR').toUpperCase(),
    title: (realDoc?.specialization || 'Optometrist').toUpperCase(),
    prc:   realDoc?.prcLicense ? `PRC LIC. ${realDoc.prcLicense}` : 'PRC LIC. — NOT ON FILE',
    // Second, optional credential (e.g. Ocular Pharmacologist + its own
    // PRC accreditation number) — only rendered when both are on file.
    secondaryCredential: realDoc?.secondaryCredential || '',
    secondaryPrc:        realDoc?.secondaryPrc ? `PRC NO. ${realDoc.secondaryPrc}` : '',
  }
  const qrDataUrl = _makeQRDataUrl(p.qrData, 70)

  // Date formatter: "2025-12-10" → "December 10, 2025"
  const MONTHS = ['January','February','March','April','May','June','July','August','September','October','November','December']
  const fmtDate = d => {
    const [y, m, dy] = (d || '').split('-')
    return `${MONTHS[+m - 1] || ''} ${+dy}, ${y}`
  }

  // Pronoun based on gender
  const g    = (p.gender || '').toLowerCase()
  const pronoun = g === 'female' ? 'She' : g === 'male' ? 'He' : 'He/She'

  // RX prescription string builder
  const rxStr = eye => {
    if (!eye) return '\u2014'
    const parts = []
    if (eye.sph && eye.sph !== '0.00') parts.push(`${eye.sph} D sph`)
    if (eye.cyl && eye.cyl !== '0.00') parts.push(`() ${eye.cyl} D cyl x ${eye.axis || '0'}`)
    return parts.join(' ') || (eye.sph ? `${eye.sph} D sph` : '\u2014')
  }

  // Field values — NVA/NNVA may not be stored in older records; fallback to dash
  const nvaOD  = e.od?.nva  || e.nva  || '\u2014'
  const nvaOS  = e.os?.nva  || e.nva  || '\u2014'
  const nnvaOD = e.od?.nnva || e.nnva || '\u2014'
  const nnvaOS = e.os?.nnva || e.nnva || '\u2014'
  const fvaOD  = e.od?.va   || '\u2014'
  const fvaOS  = e.os?.va   || '\u2014'
  const rxOD   = rxStr(e.od)
  const rxOS   = rxStr(e.os)

  // Default editable text blocks
  const remarks1 = `Such condition requires the patient to wear eyeglasses for correctional purposes so as to eliminate symptoms like blurring of vision at far, headaches or nausea which are usually associated with Errors of Refraction.`
  const remarks2 = `This certificate is being issued upon the request of the said patient for whatever purpose it would serve him/her.`

  // Remove any existing overlay
  const existing = document.getElementById('clearance-overlay')
  if (existing) existing.remove()

  const overlay = document.createElement('div')
  overlay.id = 'clearance-overlay'
  overlay.style.cssText = 'position:fixed;inset:0;background:rgba(0,0,0,.6);z-index:9999;display:flex;align-items:center;justify-content:center;padding:20px;'

  overlay.innerHTML = `
    <div style="background:#fff;width:100%;max-width:760px;max-height:94vh;overflow-y:auto;display:flex;flex-direction:column;box-shadow:0 24px 80px rgba(0,0,0,.35);">

      <!-- Modal header — hidden on print via .clearance-modal-header -->
      <div class="clearance-modal-header" style="display:flex;align-items:center;justify-content:space-between;padding:13px 22px;border-bottom:1px solid #e5e7eb;flex-shrink:0;">
        <div style="display:flex;align-items:center;gap:8px;color:#1F2937;">
          ${icon('award','icon-sm')}
          <span style="font-size:.9rem;font-weight:700;">Ophthalmic Clearance Preview</span>
        </div>
        <button onclick="document.getElementById('clearance-overlay').remove()"
                style="background:none;border:none;cursor:pointer;color:#6B7280;padding:4px;display:flex;align-items:center;">
          ${icon('x','icon')}
        </button>
      </div>

      <!-- ═══ CERTIFICATE DOCUMENT ═══ -->
      <div class="clearance-document" style="padding:48px 56px;background:#fff;flex:1;font-family:Georgia,'Times New Roman',serif;color:#111;font-size:.95rem;line-height:1.7;">

        <!-- LETTERHEAD -->
        <div style="border:1.5px solid #222;margin-bottom:16px;text-align:center;overflow:hidden;">
          <div style="padding:16px 24px 10px;">
            <div style="display:flex;align-items:center;justify-content:center;gap:16px;margin-bottom:10px;">
              <img src="${window._clinicLogoUrl || 'assets/images/logo/clinic-logo.png'}" alt="Cana Optical" style="height:64px;flex-shrink:0;">
              <div style="text-align:left;line-height:1;">
                <div style="font-family:Arial,sans-serif;font-size:2rem;font-weight:900;letter-spacing:.05em;color:#111;">CANA OPTICAL</div>
              </div>
            </div>
            <div style="font-family:Arial,sans-serif;font-size:.68rem;text-transform:uppercase;letter-spacing:.03em;color:#222;line-height:1.5;">
              <div>MAIN: UNIT 3, PASEO DE CARMONA, CARMONA, CAVITE</div>
              <div>BRANCH 1: 46 STA. ANASTACIA, STO. TOMAS, BATANGAS</div>
              <div>BRANCH 2: DOÑA SOLEDAD AVE., BETTER LIVING SUBD., PARAÑAQUE</div>
            </div>
          </div>
          <div class="clearance-mobile-bar" style="background:#E8760A;color:#fff;font-family:Arial,sans-serif;font-size:.73rem;font-weight:700;padding:6px 12px;">MOBILE NUMBER: 09952376617 / 09296636080</div>
        </div>

        <!-- PATIENT IDENTIFICATION — QR paired with the patient's own ID
             (not the clinic letterhead or the doctor's signature below),
             matching the avatar+QR pairing on the Exam/Rx print documents. -->
        <div style="display:flex;align-items:center;justify-content:flex-end;gap:10px;margin-bottom:18px;">
          <div style="text-align:right;">
            <div style="font-family:Arial,sans-serif;font-size:.68rem;text-transform:uppercase;letter-spacing:.05em;color:#888;">Patient ID</div>
            <div style="font-family:Arial,sans-serif;font-size:.85rem;font-weight:700;color:#111;">${p.id}</div>
          </div>
          ${qrDataUrl ? `<img src="${qrDataUrl}" alt="Patient QR" style="width:50px;height:50px;">` : ''}
        </div>

        <!-- TITLE -->
        <div style="text-align:center;margin:20px 0;font-family:Arial,sans-serif;font-size:1.5rem;font-weight:700;letter-spacing:.15em;text-transform:uppercase;color:#111;">
          CERTIFICATION
        </div>

        <!-- BODY PARAGRAPH -->
        <p style="font-size:.95rem;line-height:1.7;text-indent:3em;margin:0 0 0;color:#111;">
          This is to certify that <strong style="text-transform:uppercase;font-weight:700;letter-spacing:.02em;">${p.name.toUpperCase()}</strong> has undergone a complete eye examination dated ${fmtDate(e.date)}. ${pronoun} was diagnosed as stated below :
        </p>

        <!-- DATA SECTION: NVA / NNVA / RX / FVA -->
        <div style="margin:18px 0 14px;font-family:'Courier New',Courier,monospace;">
          <!-- Column headers -->
          <div style="display:grid;grid-template-columns:17% 17% 44% 22%;font-family:Arial,sans-serif;font-size:.82rem;font-weight:700;letter-spacing:.06em;text-transform:uppercase;color:#111;padding-bottom:6px;">
            <span>NVA</span>
            <span>NNVA</span>
            <span>RX</span>
            <span>FINAL V.A.</span>
          </div>
          <div style="height:2px;background:#222;margin-bottom:8px;"></div>
          <!-- OD row -->
          <div style="display:grid;grid-template-columns:17% 17% 44% 22%;line-height:2.2;font-size:.9rem;color:#111;">
            <span>OD ${nvaOD}</span>
            <span>OD ${nnvaOD}</span>
            <span>OD ${rxOD}</span>
            <span>OD ${fvaOD}</span>
          </div>
          <!-- OS row -->
          <div style="display:grid;grid-template-columns:17% 17% 44% 22%;line-height:2.2;font-size:.9rem;color:#111;">
            <span>OS ${nvaOS}</span>
            <span>OS ${nnvaOS}</span>
            <span>OS ${rxOS}</span>
            <span>OS ${fvaOS}</span>
          </div>
        </div>

        <!-- DIAGNOSIS -->
        <div style="margin:12px 0;font-size:.9rem;color:#111;display:flex;gap:14px;align-items:baseline;">
          <span style="font-family:Arial,sans-serif;font-weight:700;text-transform:uppercase;white-space:nowrap;flex-shrink:0;">DIAGNOSIS :</span>
          <span style="font-family:Arial,sans-serif;font-weight:700;text-transform:uppercase;">${(e.diagnosis || '\u2014').toUpperCase()}</span>
        </div>

        <!-- REMARKS 1 — editable. Border/background/padding live in
             .clearance-textarea (global.css) now, not inline, so the
             "this is editable" affordance is visible immediately instead
             of only appearing once focused — but stays screen-only: the
             print stylesheet already strips that class's styling back to
             plain text (@media print, global.css), and downloadClearancePDF()
             only ever copies each textarea's INLINE style onto its cloned
             replacement, never its class, so the tint/border can't leak
             into the PDF either. -->
        <textarea id="clearance-remarks-1" rows="4" class="clearance-textarea"
          style="width:100%;box-sizing:border-box;font-family:Georgia,'Times New Roman',serif;font-size:.95rem;line-height:1.7;color:#111;resize:vertical;margin:16px 0 4px;display:block;"
          onfocus="this.style.borderColor='#E8760A'" onblur="this.style.borderColor=''"
        >${remarks1}</textarea>

        <!-- REMARKS 2 — editable, same as above -->
        <textarea id="clearance-remarks-2" rows="3" class="clearance-textarea"
          style="width:100%;box-sizing:border-box;font-family:Georgia,'Times New Roman',serif;font-size:.95rem;line-height:1.7;color:#111;resize:vertical;margin-bottom:16px;display:block;"
          onfocus="this.style.borderColor='#E8760A'" onblur="this.style.borderColor=''"
        >${remarks2}</textarea>

        <!-- SIGNATURE — right-aligned -->
        <div style="margin-top:28px;text-align:right;">
          <div style="font-family:Arial,sans-serif;font-size:.88rem;font-weight:700;text-transform:uppercase;color:#111;margin-bottom:36px;">SIGNED :</div>
          <div style="display:inline-block;text-align:center;min-width:260px;">
            <div style="border-bottom:1px solid #111;margin-bottom:8px;"></div>
            <div style="font-family:Arial,sans-serif;font-size:.85rem;font-weight:700;text-transform:uppercase;color:#111;">${doc.name}</div>
            <div style="font-family:Arial,sans-serif;font-size:.78rem;color:#111;margin-top:2px;">${doc.title}</div>
            <div style="font-family:Arial,sans-serif;font-size:.78rem;color:#111;">${doc.prc}</div>
            ${doc.secondaryCredential && doc.secondaryPrc ? `
            <div style="font-family:Arial,sans-serif;font-size:.78rem;color:#111;margin-top:6px;">${doc.secondaryCredential.toUpperCase()}</div>
            <div style="font-family:Arial,sans-serif;font-size:.78rem;color:#111;">${doc.secondaryPrc}</div>` : ''}
          </div>
        </div>

      </div>
      <!-- ═══ END CERTIFICATE ═══ -->

      <!-- Action footer — hidden on print via .clearance-actions -->
      <div class="clearance-actions" style="display:flex;justify-content:flex-end;gap:12px;padding:16px 24px;border-top:1px solid #e5e7eb;flex-shrink:0;background:#f9fafb;">
        <button onclick="document.getElementById('clearance-overlay').remove()"
                onmouseenter="this.style.background='#F3F4F6';this.style.borderColor='#9CA3AF'"
                onmouseleave="this.style.background='#fff';this.style.borderColor='#D1D5DB'"
                style="display:flex;align-items:center;gap:6px;padding:8px 18px;border-radius:6px;border:1px solid #D1D5DB;background:#fff;color:#374151;font-size:.85rem;font-weight:500;cursor:pointer;transition:background .15s,border-color .15s">
          ${icon('x','icon-sm')} Close
        </button>
        <button id="clearance-dl-btn" onclick="window.downloadClearancePDF('${p.name.replace(/'/g,"\\'")}','${e.id}')"
                onmouseenter="this.style.background='#ecfeff';this.style.borderColor='#0891b2'"
                onmouseleave="this.style.background='#fff';this.style.borderColor='#0891b2'"
                style="display:flex;align-items:center;gap:6px;padding:8px 18px;border-radius:6px;border:1px solid #0891b2;background:#fff;color:#0891b2;font-size:.85rem;font-weight:500;cursor:pointer;transition:background .15s">
          ${icon('download','icon-sm')} Download PDF
        </button>
        <button onclick="window.print()"
                onmouseenter="this.style.background='#0e7490'"
                onmouseleave="this.style.background='#0891b2'"
                style="display:flex;align-items:center;gap:6px;padding:8px 20px;border-radius:6px;border:none;background:#0891b2;color:#fff;font-size:.85rem;font-weight:600;cursor:pointer;transition:background .15s">
          ${icon('printer','icon-sm')} Print Document
        </button>
      </div>
    </div>
  `

  document.body.appendChild(overlay)
  overlay.addEventListener('click', ev => { if (ev.target === overlay) overlay.remove() })
}
window.generateClearance = generateClearance

// Renders the open clearance certificate (.clearance-document) to a real
// PDF file and triggers a download, via the locally-vendored html2pdf.js.
function downloadClearancePDF(patientName, examId) {
  const src = document.querySelector('.clearance-document')
  if (!src || !window.html2pdf) { toast('PDF export is unavailable right now.', 'error'); return }

  const btn = document.getElementById('clearance-dl-btn')
  const btnHtml = btn ? btn.innerHTML : ''
  if (btn) { btn.disabled = true; btn.style.opacity = '.6'; btn.innerHTML = `<span style="display:inline-block;width:9px;height:9px;border:2px solid #D1D5DB;border-top-color:#9CA3AF;border-radius:50%;animation:spin .6s linear infinite;flex-shrink:0"></span> Downloading…` }

  // html2canvas (used under the hood) can't rasterize live <textarea> values,
  // so capture from a detached clone with the textareas swapped for plain
  // text first — the visible editable view in the modal is left untouched.
  const clone = src.cloneNode(true)
  clone.querySelectorAll('textarea').forEach(ta => {
    const div = document.createElement('div')
    div.textContent = ta.value
    div.style.cssText = ta.style.cssText
    div.style.whiteSpace = 'pre-wrap'
    ta.replaceWith(div)
  })
  // A4 page at 96 dpi = 794px. With 12mm margins each side (≈46px),
  // the content area is ~702px — use this as the render width so the
  // canvas exactly fills the PDF page and centres cleanly.
  const pdfMarginMm   = 12
  const contentWidthPx = Math.round((210 - pdfMarginMm * 2) * (96 / 25.4))
  clone.style.width      = contentWidthPx + 'px'
  clone.style.boxSizing  = 'border-box'
  clone.style.background = '#fff'

  const wrap = document.createElement('div')
  wrap.style.cssText = 'position:absolute;top:0;left:0;visibility:hidden;'
  clone.style.visibility = 'visible'
  wrap.appendChild(clone)
  document.body.appendChild(wrap)

  // Used to compute a large top/bottom margin here to vertically center
  // the certificate on the page — but splitting the leftover height evenly
  // above and below it meant a short certificate got a big margin pair,
  // and that extra margin (added on top of the already-measured content
  // height) could push the total just past one page, spilling a near-empty
  // second page. Plain top alignment (the same fixed margin on every side,
  // matching the horizontal one) reads as a normal document instead of one
  // floating mid-page, and — since nothing inflates the total height
  // beyond the content's own — keeps this to the single page it actually needs.
  // Same CanaOpticalClinic-{Type}-{Identifier}.pdf convention as every
  // other downloadable PDF in the app (_pdfFilename(), near the top of
  // this file) — this one predates that helper (this function is what it
  // was modeled on), reconciled here for consistency.
  const filename = _pdfFilename('Clearance', patientName, examId)

  window.html2pdf()
    .set({
      margin:      pdfMarginMm,
      filename,
      image:       { type: 'jpeg', quality: 0.98 },
      html2canvas: { scale: 2, backgroundColor: '#ffffff', useCORS: true, windowWidth: contentWidthPx, width: contentWidthPx, x: 0, y: 0 },
      jsPDF:       { unit: 'mm', format: 'a4', orientation: 'portrait' },
    })
    .from(clone)
    .save()
    .then(() => toast('PDF downloaded successfully.', 'success'))
    .catch(() => toast('Could not generate the PDF. Try Print instead.', 'error'))
    .finally(() => {
      wrap.remove()
      if (btn) { btn.disabled = false; btn.style.opacity = ''; btn.innerHTML = btnHtml }
    })
}
window.downloadClearancePDF = downloadClearancePDF

// ════════════════════════════════════════════════════════════════
//  OPTICAL EXAMINATION — CLEAN PRINT WINDOW (A4 document)
// ════════════════════════════════════════════════════════════════
// Builds the Exam record's full printable HTML document + a filename
// following the app-wide CanaOpticalClinic-{Type}-{Identifier}.pdf
// convention (_pdfFilename(), near the top of this file).
// _openExamPrintWindow() and downloadExamRecordPDF() below are both thin
// wrappers over this: the former hands the full document to
// _printHtmlDocument(), the latter extracts just <body>'s content and
// hands that to _downloadLiveContentAsPdf() (styled by the permanent
// .pdf-exam-doc rules in global.css).
function _buildExamRecordHtml(p, e) {
  const _inits  = name => (name||'').split(' ').slice(0,2).map(w=>w[0]||'').join('').toUpperCase()
  const _fmtDt  = d => d ? new Date(d.includes('T') ? d : d+'T00:00:00').toLocaleDateString('en-PH',{year:'numeric',month:'long',day:'numeric'}) : '—'
  const eyeRow  = (lbl, od, os) => `
    <tr>
      <td style="padding:6px 10px;font-size:11px;color:#555;font-weight:600;border-bottom:1px solid #eee">${lbl}</td>
      <td style="padding:6px 10px;font-size:12px;font-weight:800;color:#059669;text-align:center;border-bottom:1px solid #eee">${od||'—'}</td>
      <td style="padding:6px 10px;font-size:12px;font-weight:800;color:#B45309;text-align:center;border-bottom:1px solid #eee">${os||'—'}</td>
    </tr>`
  const pill    = txt => `<span style="display:inline-block;background:#E8760A;color:#fff;font-size:10px;font-weight:700;padding:2px 9px;border-radius:20px;margin:2px 3px 2px 0">${txt}</span>`
  const secLbl  = txt => `<div style="font-size:10px;font-weight:700;text-transform:uppercase;letter-spacing:.06em;color:#999;margin:10px 0 4px">${txt}</div>`
  const noteBox = txt => `<div style="background:#fffbf0;border:1px solid #fde68a;border-radius:6px;padding:9px 12px;font-size:11px;color:#444;line-height:1.6;margin-bottom:12px">${txt}</div>`
  const { plain: testResultsPlain, ishihara } = _splitIshihara(e.testResults)

  const examDate = _fmtDt(e.date)
  const dob      = _fmtDt(p.dob)
  const generated = new Date().toLocaleDateString('en-PH',{year:'numeric',month:'long',day:'numeric',hour:'2-digit',minute:'2-digit'})
  // Resolve to an absolute URL — this document is written into a blank
  // iframe via document.write(), where relative paths can't be trusted
  // to resolve against the app's own origin.
  const logoAbsUrl = new URL(window._clinicLogoUrl || 'assets/images/logo/clinic-logo.png', document.baseURI).href
  const qrDataUrl = _makeQRDataUrl(p.qrData, 90)
  const preparedByLabel = { admin:'Administrator', staff:'Staff', doctor:'Doctor' }[state.role] || state.role || ''

  const html = `<!DOCTYPE html>
<html lang="en">
<head>
  <meta charset="UTF-8">
  <title>Optical Examination: ${p.name}</title>
  <style>
    /* A real @page margin, not margin:0 + a manual body padding standing in
       for it — that padding-based approach looked fine on a short document
       but any body/element padding only ever renders on the very first and
       very last page a print job spans, never in between (a CSS print
       fragmentation guarantee, not a bug) — so the moment this document
       ran even one line past a page, that line landed flush against the
       physical edge with no margin at all, on every side. @page's own
       margin is the one box the spec guarantees gets reapplied on every
       page a document spans, exactly like the Dashboard and Reports
       printables already rely on for the same reason. */
    @page { size: A4; margin: 16mm 20mm; }
    * { box-sizing: border-box; margin: 0; padding: 0; }
    /* Used to wrap the content in display:table/table-cell purely to get
       vertical-align:top (plus, at one point, an explicit height:297mm to
       give that vertical-align something to resolve against). Neither is
       needed for plain top-aligned content — ordinary block flow already
       starts at the top with zero special CSS — and the table/table-cell
       route came with real print-pagination risk: a table-cell can resolve
       its own height against the page box in ways a plain block never
       does, which was still spilling an almost-entirely-blank second page
       for a document comfortably shorter than one page even after the
       explicit height was removed. Plain block content, no table anywhere,
       removes that whole class of quirk — the margin the old .pg-inner
       padding gave now comes from @page above instead, which (unlike body
       padding) actually repeats on every page a document spans. */
    body { font-family: Arial, Helvetica, sans-serif; color: #111; font-size: 14px; line-height: 1.65; background: #fff; }
    table { width: 100%; border-collapse: collapse; }
    .clinic-hdr  { display: flex; align-items: center; gap: 14px; border-bottom: 3px solid #E8760A; padding-bottom: 14px; margin-bottom: 20px; }
    .clinic-hdr-text { text-align: left; }
    .clinic-name { font-size: 13px; font-weight: 700; color: #6B7280; text-transform: uppercase; letter-spacing: .04em; }
    .clinic-logo { height: 70px; flex-shrink: 0; }
    .clinic-name { font-size: 24px; font-weight: 900; color: #E8760A; letter-spacing: -.02em; }
    .clinic-sub  { font-size: 16px; font-weight: 700; color: #1C1C1C; }
    .clinic-doc  { font-size: 10px; font-weight: 700; text-transform: uppercase; letter-spacing: .1em; color: #bbb; margin-top: 6px; }
    .patient-block { display: flex; gap: 18px; align-items: flex-start; padding: 16px 18px; background: #f9f9f9; border: 1px solid #eee; border-radius: 10px; margin-bottom: 18px; }
    .avatar { width: 60px; height: 60px; border-radius: 50%; background: #E8760A; display: flex; align-items: center; justify-content: center; color: #fff; font-size: 21px; font-weight: 900; flex-shrink: 0; }
    .pt-name   { font-size: 18px; font-weight: 800; color: #111; margin-bottom: 2px; }
    .pt-id     { font-size: 11px; font-family: monospace; color: #aaa; margin-bottom: 5px; }
    .pt-meta   { display: flex; flex-wrap: wrap; gap: 5px 14px; }
    .pt-meta span { font-size: 11px; color: #555; }
    .pt-addr   { font-size: 11px; color: #999; margin-top: 3px; }
    .issuer    { text-align: right; flex-shrink: 0; min-width: 160px; }
    .iss-lbl   { font-size: 10px; text-transform: uppercase; letter-spacing: .05em; color: #bbb; margin-bottom: 3px; }
    .iss-name  { font-size: 15px; font-weight: 700; color: #111; }
    .iss-date  { font-size: 11px; color: #888; }
    .iss-id    { font-size: 10px; font-family: monospace; color: #bbb; margin-top: 2px; }
    .tbl-hdr th { background: #f5f5f5; padding: 9px 12px; font-size: 11px; font-weight: 700; text-transform: uppercase; letter-spacing: .04em; }
    .tbl-border { border: 1px solid #eee; border-radius: 10px; overflow: hidden; margin-bottom: 16px; }
    /* min-width:0 overrides a CSS grid item's default min-width:auto —
       without it, a 1fr track refuses to shrink below its content's
       intrinsic width (a long lens type/material string, a pasted
       "Received By" name, etc.), which was pushing the whole grid — and
       the page itself — wider than A4 instead of just wrapping, forcing
       the print preview into a horizontal scrollbar with content actually
       getting clipped off the right edge when printed for real. Same
       fix, same reasoning as every other min-width:0 already used
       elsewhere in this app's own flex/grid layouts. overflow-wrap on the
       value classes below is the second half of it — even with room to
       shrink into, a single unbroken long value still needs somewhere to
       break. */
    .info-grid { display: grid; grid-template-columns: 1fr 1fr 1fr; gap: 10px; margin-bottom: 16px; }
    .info-box  { background: #f9f9f9; border: 1px solid #eee; border-radius: 8px; padding: 10px 12px; min-width: 0; }
    .ib-lbl    { font-size: 10px; text-transform: uppercase; letter-spacing: .05em; color: #aaa; margin-bottom: 3px; }
    .ib-val    { font-size: 16px; font-weight: 800; color: #111; overflow-wrap: anywhere; }
    .ib-unit   { font-size: 10px; color: #aaa; font-weight: 400; }
    .diag-grid { display: grid; grid-template-columns: 1fr 1fr; gap: 12px; margin-bottom: 16px; }
    .diag-box  { background: #f9f9f9; border: 1px solid #eee; border-radius: 8px; padding: 12px 14px; min-width: 0; }
    .db-lbl    { font-size: 10px; text-transform: uppercase; letter-spacing: .05em; color: #aaa; margin-bottom: 4px; }
    .db-val    { font-size: 16px; font-weight: 800; color: #111; margin-bottom: 3px; overflow-wrap: anywhere; }
    .db-sub    { font-size: 11px; color: #555; }
    .remarks-block { border-top: 1px solid #eee; padding-top: 12px; margin-top: 8px; font-style: italic; font-size: 13px; color: #555; }
    .sig-grid  { display: grid; grid-template-columns: 1fr 1fr; gap: 50px; margin-top: 26px; padding-top: 16px; border-top: 1px dashed #ccc; page-break-before: avoid; }
    .sig-line  { border-top: 1px solid #111; padding-top: 7px; text-align: center; font-size: 11px; font-weight: 700; text-transform: uppercase; }
    .sig-sub   { font-size: 10px; color: #888; margin-top: 3px; text-align: center; }
    /* Credits whichever admin/staff/doctor actually clicked Print — this
       page is never reachable by a patient (both call sites gate the
       Print button to non-patient roles), so no role check needed here. */
    .prep-by   { font-size: 10px; color: #888; text-align: right; margin-top: 12px; }
    .stamp     { font-size: 10px; color: #ccc; text-align: right; font-family: monospace; margin-top: 16px; }
  </style>
</head>
<body>

  <!-- CLINIC HEADER -->
  <div class="clinic-hdr">
    <img src="${logoAbsUrl}" alt="Cana Optical Clinic" class="clinic-logo" onerror="this.style.display='none'">
    <div class="clinic-hdr-text">
      <div class="clinic-name">Cana Optical Clinic</div>
      <div class="clinic-sub">Optical Examination Record</div>
      <div class="clinic-doc">Confidential Medical Document</div>
    </div>
  </div>

  <!-- PATIENT PROFILE -->
  ${secLbl('Patient Information')}
  <div class="patient-block">
    <div style="display:flex;flex-direction:column;align-items:center;gap:6px;flex-shrink:0">
      ${p.photoUrl
        ? `<div class="avatar" style="padding:0;overflow:hidden;background:transparent"><img src="${p.photoUrl}" alt="${p.name}" style="width:100%;height:100%;object-fit:cover;border-radius:50%;display:block" onerror="${window.avatarFallbackAttr(p.name)}"></div>`
        : `<div class="avatar">${_inits(p.name)}</div>`}
      ${qrDataUrl ? `<img src="${qrDataUrl}" alt="Patient QR" style="width:52px;height:52px">` : ''}
    </div>
    <div style="flex:1;min-width:0">
      <div class="pt-name">${p.name}</div>
      <div class="pt-id">${p.id}</div>
      <div class="pt-meta">
        <span>${p.gender||'—'}, ${p.age||'—'} yrs</span>
        ${p.dob ? `<span>DOB: ${dob}</span>` : ''}
      </div>
      <div class="pt-meta" style="margin-top:3px">
        ${p.contact ? `<span>${p.contact}</span>` : ''}
        ${p.email ? `<span>${p.email}</span>` : ''}
      </div>
      ${p.address ? `<div class="pt-addr">${p.address}</div>` : ''}
    </div>
    <div class="issuer">
      <div class="iss-lbl">Examined By</div>
      <div class="iss-name">${e.doctor||'—'}</div>
      <div class="iss-date">${examDate}</div>
      <div class="iss-id">${e.id}</div>
    </div>
  </div>

  <!-- VISUAL ACUITY & REFRACTION -->
  ${secLbl('Visual Acuity &amp; Refraction')}
  <div class="tbl-border">
    <table>
      <thead class="tbl-hdr">
        <tr>
          <th style="text-align:left;color:#777;width:35%">Measurement</th>
          <th style="text-align:center;color:#059669">OD (Right Eye)</th>
          <th style="text-align:center;color:#B45309">OS (Left Eye)</th>
        </tr>
      </thead>
      <tbody>
        ${eyeRow('VA (Uncorrected)', e.od?.vaUncorrected, e.os?.vaUncorrected)}
        ${eyeRow('VA (Corrected)', e.od?.va, e.os?.va)}
        ${eyeRow('Sphere (SPH)', e.od?.sph, e.os?.sph)}
        ${eyeRow('Cylinder (CYL)', e.od?.cyl, e.os?.cyl)}
        ${eyeRow('Axis', e.od?.axis, e.os?.axis)}
      </tbody>
    </table>
  </div>

  <!-- IOP / PD -->
  ${(e.iop?.od || e.iop?.os || e.pd) ? `<div class="info-grid">
    ${e.iop?.od || e.iop?.os ? `
    <div class="info-box">
      <div class="ib-lbl">IOP (OD)</div>
      <div class="ib-val">${e.iop?.od||'—'} <span class="ib-unit">mmHg</span></div>
    </div>
    <div class="info-box">
      <div class="ib-lbl">IOP (OS)</div>
      <div class="ib-val">${e.iop?.os||'—'} <span class="ib-unit">mmHg</span></div>
    </div>` : ''}
    ${e.pd ? `
    <div class="info-box">
      <div class="ib-lbl">PD (Pupillary Distance)</div>
      <div class="ib-val">${e.pd} <span class="ib-unit">mm</span></div>
    </div>` : ''}
  </div>` : ''}

  <!-- DIAGNOSIS -->
  ${secLbl('Diagnosis')}
  <div class="diag-box">
    <div class="db-val">${e.diagnosis||'—'}</div>
  </div>

  ${e.externalFindings   ? secLbl('External / Internal Findings') + noteBox(e.externalFindings) : ''}
  ${ishihara ? noteBox(`<strong>Ishihara Test:</strong> <span style="display:inline-block;background:${ishihara === 'Normal' ? '#dcfce7' : '#fef3c7'};color:${ishihara === 'Normal' ? '#16a34a' : '#b45309'};font-size:11px;font-weight:700;padding:2px 10px;border-radius:20px">${ishihara}</span>`) : ''}
  ${testResultsPlain     ? secLbl('Test Results')       + noteBox(testResultsPlain)      : ''}
  ${e.remarks ? `<div class="remarks-block">"${e.remarks}"<br><span style="font-size:10px;color:#aaa;font-style:normal">by ${e.doctor}</span></div>` : ''}

  <!-- SIGNATURES -->
  <div class="sig-grid">
    <div>
      <div style="height:32px"></div>
      <div class="sig-line">${e.doctor||'Examining Doctor'}</div>
      <div class="sig-sub">Optometrist / Examining Doctor</div>
    </div>
    <div>
      <div style="height:32px"></div>
      <div class="sig-line">${p.name}</div>
      <div class="sig-sub">Patient Signature &amp; Date</div>
    </div>
  </div>

  <div class="prep-by">Prepared by: ${state.user?.name || '—'} &bull; ${preparedByLabel}</div>
  <div class="stamp">Exam ID: ${e.id} &bull; Printed: ${generated}</div>

</body></html>`

  return { html, filename: _pdfFilename('Exam', p.name, e.id) }
}

function _openExamPrintWindow(p, e) {
  const built = _buildExamRecordHtml(p, e)
  if (built) _printHtmlDocument(built.html)
}

// ════════════════════════════════════════════════════════════════
//  PRESCRIPTION — CLEAN PRINT WINDOW (A4 document, same letterhead
//  language as _openExamPrintWindow, scoped to just the Rx fields)
// ════════════════════════════════════════════════════════════════
// Builds the Prescription record's full printable HTML document + a
// filename following the app-wide CanaOpticalClinic-{Type}-{Identifier}.pdf
// convention (_pdfFilename(), near the top of this file).
// _openRxPrintWindow() and downloadRxRecordPDF() below are both thin
// wrappers over this: the former hands the full document to
// _printHtmlDocument(), the latter extracts just <body>'s content and
// hands that to _downloadLiveContentAsPdf() (styled by the permanent
// .pdf-rx-doc rules in global.css).
function _buildRxRecordHtml(p, rx) {
  const _inits = name => (name||'').split(' ').slice(0,2).map(w=>w[0]||'').join('').toUpperCase()
  const _fmtDt = d => d ? new Date(d.includes('T') ? d : d+'T00:00:00').toLocaleDateString('en-PH',{year:'numeric',month:'long',day:'numeric'}) : '—'
  const eyeRow = (lbl, od, os) => `
    <tr>
      <td style="padding:5px 10px;font-size:11px;color:#555;font-weight:600;border-bottom:1px solid #eee">${lbl}</td>
      <td style="padding:5px 10px;font-size:12px;font-weight:800;color:#059669;text-align:center;border-bottom:1px solid #eee">${od||'—'}</td>
      <td style="padding:5px 10px;font-size:12px;font-weight:800;color:#B45309;text-align:center;border-bottom:1px solid #eee">${os||'—'}</td>
    </tr>`
  const secLbl = txt => `<div style="font-size:10px;font-weight:700;text-transform:uppercase;letter-spacing:.06em;color:#999;margin:7px 0 3px">${txt}</div>`

  const rxDate    = _fmtDt(rx.date)
  const dob       = _fmtDt(p.dob)
  const expiry    = rx.expiryDate ? new Date(rx.expiryDate.includes('T') ? rx.expiryDate : rx.expiryDate+'T00:00:00')
                    : (() => { const d = new Date(rx.date.includes('T') ? rx.date : rx.date+'T00:00:00'); d.setFullYear(d.getFullYear()+1); return d })()
  const isExpired = (rx.status === 'expired') || (rx.status !== 'superseded' && expiry < new Date())
  const statusLabel = rx.status === 'superseded' ? 'Superseded' : (isExpired ? 'Expired' : 'Valid')
  const expiryStr = _fmtDt(localDateStr(expiry))
  const generated = new Date().toLocaleDateString('en-PH',{year:'numeric',month:'long',day:'numeric',hour:'2-digit',minute:'2-digit'})
  const logoAbsUrl = new URL(window._clinicLogoUrl || 'assets/images/logo/clinic-logo.png', document.baseURI).href
  const qrDataUrl = _makeQRDataUrl(p.qrData, 90)
  const preparedByLabel = { admin:'Administrator', staff:'Staff', doctor:'Doctor' }[state.role] || state.role || ''

  const html = `<!DOCTYPE html>
<html lang="en">
<head>
  <meta charset="UTF-8">
  <title>Prescription: ${p.name}</title>
  <style>
    /* A real @page margin, not margin:0 + a manual body padding standing in
       for it — that padding-based approach looked fine on a short document
       but any body/element padding only ever renders on the very first and
       very last page a print job spans, never in between (a CSS print
       fragmentation guarantee, not a bug) — so the moment this document
       ran even one line past a page, that line landed flush against the
       physical edge with no margin at all, on every side. @page's own
       margin is the one box the spec guarantees gets reapplied on every
       page a document spans, exactly like the Dashboard and Reports
       printables already rely on for the same reason. */
    @page { size: A4; margin: 16mm 20mm; }
    * { box-sizing: border-box; margin: 0; padding: 0; }
    /* Used to wrap the content in display:table/table-cell purely to get
       vertical-align:top (plus, at one point, an explicit height:297mm to
       give that vertical-align something to resolve against). Neither is
       needed for plain top-aligned content — ordinary block flow already
       starts at the top with zero special CSS — and the table/table-cell
       route came with real print-pagination risk: a table-cell can resolve
       its own height against the page box in ways a plain block never
       does, which was still spilling an almost-entirely-blank second page
       for a document comfortably shorter than one page even after the
       explicit height was removed. Plain block content, no table anywhere,
       removes that whole class of quirk — the margin the old .pg-inner
       padding gave now comes from @page above instead, which (unlike body
       padding) actually repeats on every page a document spans. */
    /* Compacted from this document's original spacing — a prescription
       with every optional section filled in (lens coating, dispensing
       info, a long frame/lens value) was landing juuust over one page,
       spilling only its last 2 lines onto an otherwise-empty page 2.
       Trimmed margins/padding/line-height throughout claws that back
       without needing to shrink any actual value text — the numbers
       patients and staff actually read stay the same size. */
    body { font-family: Arial, Helvetica, sans-serif; color: #111; font-size: 14px; line-height: 1.5; background: #fff; }
    table { width: 100%; border-collapse: collapse; }
    .clinic-hdr  { display: flex; align-items: center; gap: 14px; border-bottom: 3px solid #E8760A; padding-bottom: 10px; margin-bottom: 14px; }
    .clinic-hdr-text { text-align: left; }
    .clinic-name { font-size: 13px; font-weight: 700; color: #6B7280; text-transform: uppercase; letter-spacing: .04em; }
    .clinic-logo { height: 58px; flex-shrink: 0; }
    .clinic-name { font-size: 22px; font-weight: 900; color: #E8760A; letter-spacing: -.02em; }
    .clinic-sub  { font-size: 15px; font-weight: 700; color: #1C1C1C; }
    .clinic-doc  { font-size: 10px; font-weight: 700; text-transform: uppercase; letter-spacing: .1em; color: #bbb; margin-top: 4px; }
    .patient-block { display: flex; gap: 16px; align-items: flex-start; padding: 12px 16px; background: #f9f9f9; border: 1px solid #eee; border-radius: 10px; margin-bottom: 12px; }
    .avatar { width: 52px; height: 52px; border-radius: 50%; background: #E8760A; display: flex; align-items: center; justify-content: center; color: #fff; font-size: 19px; font-weight: 900; flex-shrink: 0; }
    .pt-name   { font-size: 17px; font-weight: 800; color: #111; margin-bottom: 2px; }
    .pt-id     { font-size: 11px; font-family: monospace; color: #aaa; margin-bottom: 4px; }
    .pt-meta   { display: flex; flex-wrap: wrap; gap: 4px 14px; }
    .pt-meta span { font-size: 11px; color: #555; }
    .issuer    { text-align: right; flex-shrink: 0; min-width: 160px; }
    .iss-lbl   { font-size: 10px; text-transform: uppercase; letter-spacing: .05em; color: #bbb; margin-bottom: 3px; }
    .iss-name  { font-size: 14px; font-weight: 700; color: #111; }
    .iss-date  { font-size: 11px; color: #888; }
    .iss-id    { font-size: 10px; font-family: monospace; color: #bbb; margin-top: 2px; }
    .tbl-hdr th { background: #f5f5f5; padding: 7px 12px; font-size: 11px; font-weight: 700; text-transform: uppercase; letter-spacing: .04em; }
    .tbl-border { border: 1px solid #eee; border-radius: 10px; overflow: hidden; margin-bottom: 12px; }
    .diag-box  { background: #f9f9f9; border: 1px solid #eee; border-radius: 8px; padding: 9px 12px; margin-bottom: 12px; min-width: 0; }
    .db-lbl    { font-size: 10px; text-transform: uppercase; letter-spacing: .05em; color: #aaa; margin-bottom: 3px; }
    .db-val    { font-size: 15px; font-weight: 800; color: #111; overflow-wrap: anywhere; }
    /* min-width:0 lets a grid item actually shrink below its own content's
       intrinsic width instead of blowing the whole grid (and the page)
       wider than A4 — see the matching comment on the Exam Record's own
       copy of this CSS above. overflow-wrap on the value classes covers
       an unbroken long value (a lens type, a pasted "Received By" name)
       that still needs somewhere to break once it has room to shrink into. */
    .info-grid { display: grid; gap: 8px; margin-bottom: 12px; }
    .info-box  { background: #f9f9f9; border: 1px solid #eee; border-radius: 8px; padding: 8px 10px; min-width: 0; }
    .ib-lbl    { font-size: 10px; text-transform: uppercase; letter-spacing: .05em; color: #aaa; margin-bottom: 2px; }
    .ib-val    { font-size: 15px; font-weight: 800; color: #111; overflow-wrap: anywhere; }
    .ib-unit   { font-size: 10px; color: #aaa; font-weight: 400; }
    .remarks-block { border-top: 1px solid #eee; padding-top: 10px; margin-top: 6px; font-style: italic; font-size: 13px; color: #555; }
    .sig-grid  { display: grid; grid-template-columns: 1fr 1fr; gap: 50px; margin-top: 16px; padding-top: 12px; border-top: 1px dashed #ccc; page-break-before: avoid; }
    .sig-line  { border-top: 1px solid #111; padding-top: 6px; text-align: center; font-size: 11px; font-weight: 700; text-transform: uppercase; }
    .sig-sub   { font-size: 10px; color: #888; margin-top: 2px; text-align: center; }
    /* Credits whichever admin/staff/doctor actually clicked Print — this
       page is never reachable by a patient (both call sites gate the
       Print button to non-patient roles), so no role check needed here. */
    .prep-by   { font-size: 10px; color: #888; text-align: right; margin-top: 8px; }
    .stamp     { font-size: 10px; color: #ccc; text-align: right; font-family: monospace; margin-top: 8px; }
    .valid-pill { display: inline-block; font-size: 10px; font-weight: 700; padding: 3px 10px; border-radius: 20px; margin-top: 4px; }
  </style>
</head>
<body>

  <!-- CLINIC HEADER -->
  <div class="clinic-hdr">
    <img src="${logoAbsUrl}" alt="Cana Optical Clinic" class="clinic-logo" onerror="this.style.display='none'">
    <div class="clinic-hdr-text">
      <div class="clinic-name">Cana Optical Clinic</div>
      <div class="clinic-sub">Official Optical Prescription</div>
      <div class="clinic-doc">Rx No. ${rx.id}</div>
    </div>
  </div>

  <!-- PATIENT PROFILE -->
  ${secLbl('Patient Information')}
  <div class="patient-block">
    <div style="display:flex;flex-direction:column;align-items:center;gap:6px;flex-shrink:0">
      ${p.photoUrl
        ? `<div class="avatar" style="padding:0;overflow:hidden;background:transparent"><img src="${p.photoUrl}" alt="${p.name}" style="width:100%;height:100%;object-fit:cover;border-radius:50%;display:block" onerror="${window.avatarFallbackAttr(p.name)}"></div>`
        : `<div class="avatar">${_inits(p.name)}</div>`}
      ${qrDataUrl ? `<img src="${qrDataUrl}" alt="Patient QR" style="width:52px;height:52px">` : ''}
    </div>
    <div style="flex:1;min-width:0">
      <div class="pt-name">${p.name}</div>
      <div class="pt-id">${p.id}</div>
      <div class="pt-meta">
        <span>${p.gender||'—'}, ${p.age||'—'} yrs</span>
        ${p.dob ? `<span>DOB: ${dob}</span>` : ''}
      </div>
      ${(p.contact || p.email) ? `<div class="pt-meta" style="margin-top:3px">
        ${p.contact ? `<span>${p.contact}</span>` : ''}
        ${p.email ? `<span>${p.email}</span>` : ''}
      </div>` : ''}
    </div>
    <div class="issuer">
      <div class="iss-lbl">Issued By</div>
      <div class="iss-name">${rx.doctor||'—'}</div>
      ${rx.prcLicense ? `<div class="iss-date">PRC License No. ${rx.prcLicense}</div>` : ''}
      <div class="iss-date">${rxDate}</div>
      <div class="iss-id">Rx No. ${rx.id}</div>
      <div class="valid-pill" style="${statusLabel === 'Valid' ? 'background:#ECFDF5;color:#059669' : (statusLabel === 'Superseded' ? 'background:#F3F4F6;color:#6B7280' : 'background:#FEE2E2;color:#DC2626')}">
        ${statusLabel === 'Valid' ? 'Valid until ' + expiryStr : statusLabel}
      </div>
    </div>
  </div>

  <!-- REFRACTION -->
  <div style="display:flex;align-items:center;justify-content:space-between">
    ${secLbl('Final Refraction')}
    <span style="font-size:10px;font-weight:700;padding:2px 10px;border-radius:20px;background:#fff7ed;color:#c2410c;border:1px solid #fde68a;margin:6px 0 4px">${CONTACT_LENS_TYPES.includes(rx.lensType) ? 'Contact Lens' : 'Eyeglass'}</span>
  </div>
  <div class="tbl-border">
    <table>
      <thead class="tbl-hdr">
        <tr>
          <th style="text-align:left;color:#777;width:35%">Measurement</th>
          <th style="text-align:center;color:#059669">OD (Right Eye)</th>
          <th style="text-align:center;color:#B45309">OS (Left Eye)</th>
        </tr>
      </thead>
      <tbody>
        ${eyeRow('Sphere (SPH)', rx.od?.sph, rx.os?.sph)}
        ${eyeRow('Cylinder (CYL)', rx.od?.cyl, rx.os?.cyl)}
        ${eyeRow('Axis', rx.od?.axis, rx.os?.axis)}
        ${(rx.od?.add || rx.os?.add) ? eyeRow('Add Power', rx.od?.add, rx.os?.add) : ''}
      </tbody>
    </table>
  </div>

  <div class="info-grid" style="grid-template-columns:repeat(${[rx.pd,rx.lensType,rx.lensMaterial].filter(Boolean).length || 1},1fr)">
    ${rx.pd ? `<div class="info-box"><div class="ib-lbl">Pupillary Distance</div><div class="ib-val">${rx.pd} <span class="ib-unit">mm</span></div></div>` : ''}
    ${rx.lensType ? `<div class="info-box"><div class="ib-lbl">Lens Type</div><div class="db-val" style="font-size:14px">${rx.lensType}</div></div>` : ''}
    ${rx.lensMaterial ? `<div class="info-box"><div class="ib-lbl">Lens Material</div><div class="db-val" style="font-size:14px">${rx.lensMaterial}</div></div>` : ''}
  </div>

  ${rx.frameSelection ? `
  <div class="diag-box">
    <div class="db-lbl">Frame Selection</div>
    <div class="db-val" style="font-size:14px">${rx.frameSelection}</div>
  </div>` : ''}

  ${rx.lensCoating && rx.lensCoating.length ? `
  <div class="diag-box">
    <div class="db-lbl">Lens Coating</div>
    <div>${rx.lensCoating.map(c=>`<span style="display:inline-block;background:#FFF7ED;color:#C2410C;font-size:10px;font-weight:700;padding:2px 9px;border-radius:20px;margin:2px 4px 0 0;border:1px solid #fde68a">${c}</span>`).join('')}</div>
  </div>` : ''}

  ${(rx.totalAmount || rx.dispensedDate || rx.receivedBy) ? `
  ${secLbl('Dispensing Information')}
  <div class="info-grid" style="grid-template-columns:repeat(${[rx.totalAmount,rx.dispensedDate,rx.receivedBy].filter(Boolean).length || 1},1fr)">
    ${rx.totalAmount ? `<div class="info-box"><div class="ib-lbl">Total Amount</div><div class="ib-val">&#8369;${Number(rx.totalAmount).toLocaleString('en-PH',{minimumFractionDigits:2,maximumFractionDigits:2})}</div></div>` : ''}
    ${rx.dispensedDate ? `<div class="info-box"><div class="ib-lbl">Dispensed Date</div><div class="db-val" style="font-size:14px">${_fmtDt(rx.dispensedDate)}</div></div>` : ''}
    ${rx.receivedBy ? `<div class="info-box"><div class="ib-lbl">Received By</div><div class="db-val" style="font-size:14px">${rx.receivedBy}</div></div>` : ''}
  </div>` : ''}

  <!-- SIGNATURES -->
  <div class="sig-grid">
    <div>
      <div style="height:32px"></div>
      <div class="sig-line">${rx.doctor||'Examining Doctor'}</div>
      <div class="sig-sub">Optometrist / Examining Doctor${rx.prcLicense ? ' (PRC ' + rx.prcLicense + ')' : ''}</div>
    </div>
    <div>
      <div style="height:32px"></div>
      <div class="sig-line">${p.name}</div>
      <div class="sig-sub">Patient Signature &amp; Date</div>
    </div>
  </div>

  <div class="prep-by">Prepared by: ${state.user?.name || '—'} &bull; ${preparedByLabel}</div>
  <div class="stamp">Rx valid for 1 year from date of issue &bull; Printed: ${generated}</div>

</body></html>`

  return { html, filename: _pdfFilename('Prescription', p.name, rx.id) }
}

function _openRxPrintWindow(p, rx) {
  const built = _buildRxRecordHtml(p, rx)
  if (built) _printHtmlDocument(built.html)
}

// Shared by printRxRecord() and downloadRxRecordPDF() below.
function _resolveRxForPrint(patientId, rxId) {
  const p = patients.find(pt => pt.id === patientId)
  if (!p) { toast('Patient not found.', 'error'); return null }
  const rx = (p.prescriptions || []).find(r => r.id === rxId)
  if (!rx) { toast('Prescription not found.', 'error'); return null }
  return { p, rx }
}

function printRxRecord(patientId, rxId) {
  const res = _resolveRxForPrint(patientId, rxId)
  if (res) _openRxPrintWindow(res.p, res.rx)
}
window.printRxRecord = printRxRecord

function downloadRxRecordPDF(patientId, rxId, btnEl) {
  const res = _resolveRxForPrint(patientId, rxId)
  if (!res) return
  const built = _buildRxRecordHtml(res.p, res.rx)
  if (!built) return
  // _buildRxRecordHtml() still builds a full standalone document for
  // _openRxPrintWindow()'s own use — only <body>'s inner content is
  // needed here, styled instead by the permanent .pdf-rx-doc rules in
  // global.css (same architecture as downloadExamRecordPDF()).
  const bodyMatch = built.html.match(/<body[^>]*>([\s\S]*?)<\/body>/i)
  if (!bodyMatch) { toast('Could not generate the PDF.', 'error'); return }
  _downloadLiveContentAsPdf(bodyMatch[1], 'pdf-rx-doc', built.filename, btnEl)
}
window.downloadRxRecordPDF = downloadRxRecordPDF

// ════════════════════════════════════════════════════════════════
//  PATIENT — VIEW PRESCRIPTION DETAIL (canonical prescription view)
// ════════════════════════════════════════════════════════════════
// The single canonical rendering of a prescription — the issued
// document, not the exam that produced it. Must NOT show uncorrected
// acuity, external findings, or the doctor's narrative notes (see
// database/schema.sql's `prescriptions` CREATE TABLE comment).
// viewPrescriptionModal()/printPrescription() (exam-keyed callers) both
// resolve to this same implementation instead of maintaining a second,
// parallel one.
function viewPrescriptionDetail(patientId, rxId) {
  const p  = patients.find(p => p.id === patientId)
  if (!p) return
  const rx = (p.prescriptions || []).find(r => r.id === rxId)
  if (!rx) { toast('Prescription not found.', 'error'); return }

  const rxDate = new Date(rx.date.includes('T') ? rx.date : rx.date + 'T00:00:00')
  const rxDateStr = rxDate.toLocaleDateString('en-PH', {year:'numeric',month:'long',day:'numeric'})
  const expiryDate = rx.expiryDate ? new Date(rx.expiryDate.includes('T') ? rx.expiryDate : rx.expiryDate+'T00:00:00')
                     : (() => { const d = new Date(rxDate); d.setFullYear(d.getFullYear()+1); return d })()
  const expiryStr = expiryDate.toLocaleDateString('en-PH', {year:'numeric',month:'long',day:'numeric'})
  const statusLabel = rx.status === 'superseded' ? 'Superseded' : (rx.status === 'expired' || expiryDate < new Date() ? 'Expired' : 'Valid')
  const statusColor = statusLabel === 'Valid' ? { bg:'#ECFDF5', fg:'#059669' } : (statusLabel === 'Superseded' ? { bg:'#F3F4F6', fg:'#6B7280' } : { bg:'#FEE2E2', fg:'#DC2626' })
  const docRecord = doctors.find(d => d.name === rx.doctor)
  const docPhoto  = docRecord?.photoUrl || null
  const docInits  = (rx.doctor||'Dr').split(' ').slice(0,2).map(w=>w[0]||'').join('').toUpperCase()

  const eyeField = (label, val, isLast) => `
    <div style="padding:11px 8px;${isLast ? '' : 'border-right:1px solid #F3F4F6;'}text-align:center;flex:1;min-width:0">
      <div style="font-size:.6rem;font-weight:700;text-transform:uppercase;letter-spacing:.07em;color:#9CA3AF;margin-bottom:5px">${label}</div>
      <div style="font-size:.95rem;font-weight:800;font-family:monospace;color:#1C1C1C">${val || '—'}</div>
    </div>`

  showModal(`
    <div class="modal-header">
      <div class="modal-title">Optical Prescription</div>
      <button class="modal-close" onclick="window.closeModal()">&times;</button>
    </div>
    <div class="modal-body" id="print-rx-area" style="padding:0">

      <!-- Clinic header -->
      <div style="background:linear-gradient(135deg,#1C1C1C,#2A2A2A);padding:16px 24px;display:flex;align-items:center;justify-content:space-between;gap:12px">
        <div>
          <div style="font-size:.6rem;text-transform:uppercase;letter-spacing:.14em;color:#E8760A;font-weight:800;margin-bottom:2px">Official Optical Prescription</div>
          <div style="font-size:1rem;font-weight:900;color:#fff;letter-spacing:-.01em">Cana Optical Clinic</div>
        </div>
        <div style="text-align:right;flex-shrink:0">
          <div style="font-size:.65rem;color:rgba(255,255,255,.35);text-transform:uppercase;letter-spacing:.05em;margin-bottom:2px">Rx No.</div>
          <div style="font-size:.72rem;font-family:monospace;color:rgba(255,255,255,.55)">${rx.id}</div>
        </div>
      </div>

      <div style="padding:20px 24px;display:flex;flex-direction:column;gap:16px">

        <!-- Patient + Doctor block -->
        <div class="rx-pd-block" style="display:flex;align-items:flex-start;gap:14px;padding:14px 16px;background:#F9FAFB;border:1px solid #F3F4F6;border-radius:10px">
          <div class="rx-patient-row" style="display:flex;align-items:center;gap:14px;flex:1;min-width:0">
            ${p.photoUrl
              ? `<div class="rx-pat-avatar" style="width:46px;height:46px;border-radius:50%;overflow:hidden;flex-shrink:0"><img src="${p.photoUrl}" alt="${p.name}" style="width:100%;height:100%;object-fit:cover;border-radius:50%;display:block" onerror="var w=this.parentElement;if(w){w.style.cssText='width:46px;height:46px;border-radius:50%;background:#E8760A;display:flex;align-items:center;justify-content:center;font-size:1rem;font-weight:800;color:#fff;flex-shrink:0';w.className='rx-pat-avatar';w.textContent='${(p.name||'').split(' ').slice(0,2).map(w=>w[0]||'').join('').toUpperCase().replace(/'/g,"\\'")}'}"></div>`
              : `<div class="rx-pat-avatar" style="width:46px;height:46px;border-radius:50%;background:#E8760A;display:flex;align-items:center;justify-content:center;font-size:1rem;font-weight:800;color:#fff;flex-shrink:0">${(p.name||'').split(' ').slice(0,2).map(w=>w[0]||'').join('').toUpperCase()}</div>`
            }
            <div style="flex:1;min-width:0">
              <div style="font-size:.97rem;font-weight:800;color:#111;margin-bottom:2px">${p.name}</div>
              <div style="font-size:.7rem;font-family:monospace;color:#9CA3AF;margin-bottom:5px">${p.id}</div>
              <div style="display:flex;flex-wrap:wrap;gap:5px 12px">
                ${p.gender || p.age ? `<span style="font-size:.73rem;color:#555">${[p.gender, p.age ? p.age + ' yrs' : ''].filter(Boolean).join(', ')}</span>` : ''}
                ${p.contact ? `<span style="font-size:.73rem;color:#555">${p.contact}</span>` : ''}
              </div>
              ${p.address ? `<div style="font-size:.68rem;color:#9CA3AF;margin-top:3px">${p.address}</div>` : ''}
            </div>
          </div>
          <div class="rx-issued-block" style="text-align:right;flex-shrink:0;min-width:150px;display:flex;align-items:center;justify-content:flex-end;gap:8px">
            <div>
              <div style="font-size:.62rem;color:#9CA3AF;text-transform:uppercase;letter-spacing:.04em;margin-bottom:2px">Issued By</div>
              <div style="font-size:.85rem;font-weight:700;color:#111">${rx.doctor}</div>
              ${rx.prcLicense ? `<div style="font-size:.68rem;color:#9CA3AF;margin-top:1px">PRC ${rx.prcLicense}</div>` : ''}
              <div style="font-size:.72rem;color:#6B7280;margin-top:2px">${rxDateStr}</div>
              <div style="margin-top:8px">
                <span style="font-size:.68rem;font-weight:700;padding:3px 9px;border-radius:20px;background:${statusColor.bg};color:${statusColor.fg}">
                ${statusLabel === 'Valid' ? 'Valid until ' + expiryStr : statusLabel}
              </span>
              </div>
            </div>
            ${docPhoto
              ? `<div class="rx-doc-avatar" style="width:36px;height:36px;border-radius:50%;overflow:hidden;flex-shrink:0"><img src="${docPhoto}" alt="${rx.doctor}" style="width:100%;height:100%;object-fit:cover;border-radius:50%;display:block"></div>`
              : `<div class="rx-doc-avatar" style="width:36px;height:36px;border-radius:50%;background:#1C1C1C;display:flex;align-items:center;justify-content:center;font-size:.7rem;font-weight:800;color:#E8760A;flex-shrink:0;letter-spacing:.02em">${docInits}</div>`
            }
          </div>
        </div>

        <!-- OD/OS Rx values -->
        <div>
          <div style="display:flex;align-items:center;justify-content:space-between;margin-bottom:8px">
            <div style="font-size:.63rem;font-weight:700;text-transform:uppercase;letter-spacing:.1em;color:#9CA3AF">Final Refraction</div>
            <span style="font-size:.65rem;font-weight:700;padding:2px 10px;border-radius:20px;background:#FFF7ED;color:#C2410C;border:1px solid #FDE68A">${CONTACT_LENS_TYPES.includes(rx.lensType) ? 'Contact Lens' : 'Eyeglass'}</span>
          </div>
          <div style="display:grid;grid-template-columns:1fr 1fr;gap:10px">
            <div style="border:1.5px solid #86EFAC;border-radius:10px;overflow:hidden">
              <div style="background:#F0FDF4;padding:8px 12px;border-bottom:1px solid #86EFAC;display:flex;align-items:center;gap:6px">
                <div style="width:7px;height:7px;border-radius:50%;background:#22C55E;flex-shrink:0"></div>
                <span style="font-size:.65rem;font-weight:800;text-transform:uppercase;letter-spacing:.07em;color:#059669">OD (Right Eye)</span>
              </div>
              <div style="display:flex;background:#fff">
                ${eyeField('SPH', rx.od?.sph, false)}
                ${eyeField('CYL', rx.od?.cyl, false)}
                ${eyeField('AXIS', rx.od?.axis, true)}
              </div>
              ${rx.od?.add ? `<div style="padding:7px 12px;border-top:1px solid #BBF7D0;background:#F0FDF4;display:flex;align-items:center;justify-content:space-between"><span style="font-size:.6rem;color:#9CA3AF;font-weight:700;text-transform:uppercase">Add Power</span><span style="font-size:.88rem;font-weight:800;font-family:monospace;color:#059669">${rx.od.add}</span></div>` : ''}
            </div>
            <div style="border:1.5px solid #FDE68A;border-radius:10px;overflow:hidden">
              <div style="background:#FFF7ED;padding:8px 12px;border-bottom:1px solid #FDE68A;display:flex;align-items:center;gap:6px">
                <div style="width:7px;height:7px;border-radius:50%;background:#E8760A;flex-shrink:0"></div>
                <span style="font-size:.65rem;font-weight:800;text-transform:uppercase;letter-spacing:.07em;color:#B45309">OS (Left Eye)</span>
              </div>
              <div style="display:flex;background:#fff">
                ${eyeField('SPH', rx.os?.sph, false)}
                ${eyeField('CYL', rx.os?.cyl, false)}
                ${eyeField('AXIS', rx.os?.axis, true)}
              </div>
              ${rx.os?.add ? `<div style="padding:7px 12px;border-top:1px solid #FEF3C7;background:#FFFBEB;display:flex;align-items:center;justify-content:space-between"><span style="font-size:.6rem;color:#9CA3AF;font-weight:700;text-transform:uppercase">Add Power</span><span style="font-size:.88rem;font-weight:800;font-family:monospace;color:#E8760A">${rx.os.add}</span></div>` : ''}
            </div>
          </div>
        </div>

        <!-- PD + Lens row -->
        ${(rx.pd || rx.lensType || rx.lensMaterial) ? `
        <div style="display:grid;grid-template-columns:${[rx.pd?'1fr':'',rx.lensType?'1fr':'',rx.lensMaterial?'1fr':''].filter(Boolean).join(' ')};gap:8px">
          ${rx.pd ? `
          <div style="background:#F9FAFB;border:1px solid #F3F4F6;border-radius:8px;padding:9px 12px">
            <div style="font-size:.58rem;color:#9CA3AF;text-transform:uppercase;letter-spacing:.06em;margin-bottom:3px">Pupillary Distance</div>
            <div style="font-size:.85rem;font-weight:700;color:#1C1C1C;font-family:monospace">${rx.pd} <span style="font-size:.65rem;font-weight:400;color:#9CA3AF">mm</span></div>
          </div>` : ''}
          ${rx.lensType ? `
          <div style="background:#F9FAFB;border:1px solid #F3F4F6;border-radius:8px;padding:9px 12px">
            <div style="font-size:.58rem;color:#9CA3AF;text-transform:uppercase;letter-spacing:.06em;margin-bottom:3px">Lens Type</div>
            <div style="font-size:.82rem;font-weight:700;color:#1C1C1C">${rx.lensType}</div>
          </div>` : ''}
          ${rx.lensMaterial ? `
          <div style="background:#F9FAFB;border:1px solid #F3F4F6;border-radius:8px;padding:9px 12px">
            <div style="font-size:.58rem;color:#9CA3AF;text-transform:uppercase;letter-spacing:.06em;margin-bottom:3px">Lens Material</div>
            <div style="font-size:.82rem;font-weight:700;color:#1C1C1C">${rx.lensMaterial}</div>
          </div>` : ''}
        </div>` : ''}

        ${rx.frameSelection ? `
        <div>
          <div style="font-size:.63rem;font-weight:700;color:#9CA3AF;text-transform:uppercase;letter-spacing:.08em;margin-bottom:5px">Frame Selection</div>
          <div style="font-size:.85rem;color:#1C1C1C;font-weight:600">${rx.frameSelection}</div>
        </div>` : ''}

        ${rx.lensCoating && rx.lensCoating.length ? `
        <div>
          <div style="font-size:.63rem;font-weight:700;color:#9CA3AF;text-transform:uppercase;letter-spacing:.08em;margin-bottom:5px">Lens Coating</div>
          <div style="display:flex;gap:6px;flex-wrap:wrap">
            ${rx.lensCoating.map(c=>`<span style="background:#FFF7ED;color:#C2410C;font-size:.72rem;font-weight:600;padding:3px 10px;border-radius:20px;border:1px solid #FDE68A">${c}</span>`).join('')}
          </div>
        </div>` : ''}

        <!-- Dispensing — payment/release details, kept visually separate
             from the clinical Rx data above it via the top border. -->
        ${(rx.totalAmount || rx.dispensedDate || rx.receivedBy) ? `
        <div style="border-top:1px solid #F3F4F6;padding-top:14px">
          <div style="font-size:.63rem;font-weight:700;color:#9CA3AF;text-transform:uppercase;letter-spacing:.08em;margin-bottom:8px">Dispensing Information</div>
          <div style="display:grid;grid-template-columns:repeat(auto-fit,minmax(120px,1fr));gap:8px">
            ${rx.totalAmount ? `
            <div style="background:#F9FAFB;border:1px solid #F3F4F6;border-radius:8px;padding:9px 12px">
              <div style="font-size:.58rem;color:#9CA3AF;text-transform:uppercase;letter-spacing:.06em;margin-bottom:3px">Total Amount</div>
              <div style="font-size:.85rem;font-weight:700;color:#1C1C1C">&#8369;${Number(rx.totalAmount).toLocaleString('en-PH',{minimumFractionDigits:2,maximumFractionDigits:2})}</div>
            </div>` : ''}
            ${rx.dispensedDate ? `
            <div style="background:#F9FAFB;border:1px solid #F3F4F6;border-radius:8px;padding:9px 12px">
              <div style="font-size:.58rem;color:#9CA3AF;text-transform:uppercase;letter-spacing:.06em;margin-bottom:3px">Dispensed Date</div>
              <div style="font-size:.82rem;font-weight:700;color:#1C1C1C">${new Date(rx.dispensedDate.includes('T') ? rx.dispensedDate : rx.dispensedDate+'T00:00:00').toLocaleDateString('en-PH',{year:'numeric',month:'short',day:'numeric'})}</div>
            </div>` : ''}
            ${rx.receivedBy ? `
            <div style="background:#F9FAFB;border:1px solid #F3F4F6;border-radius:8px;padding:9px 12px">
              <div style="font-size:.58rem;color:#9CA3AF;text-transform:uppercase;letter-spacing:.06em;margin-bottom:3px">Received By</div>
              <div style="font-size:.82rem;font-weight:700;color:#1C1C1C">${rx.receivedBy}</div>
            </div>` : ''}
          </div>
        </div>` : ''}

      </div>
    </div>
    <div class="modal-footer" style="flex-direction:column;align-items:stretch;gap:10px">
      <div style="display:flex;justify-content:flex-end;flex-wrap:wrap;gap:8px">
        ${rx.examId ? `<button class="btn-ghost" onclick="window.viewExamDetail('${patientId}','${rx.examId}')">
          ${icon('eye','icon-sm')} Exam Record
        </button>` : ''}
        ${state.role !== 'patient' ? `<button class="btn-secondary" onclick="window.downloadRxRecordPDF('${patientId}','${rx.id}',this)">
          ${icon('download','icon-sm')} Download PDF
        </button>` : ''}
      </div>
      <div style="display:flex;justify-content:flex-end;gap:8px">
        <button class="btn-secondary" onclick="window.closeModal()">Close</button>
        ${state.role !== 'patient' ? `<button class="btn-primary" onclick="window.printRxRecord('${patientId}','${rx.id}')">
          ${icon('printer','icon-sm')} Print Prescription
        </button>` : ''}
      </div>
    </div>`, 'modal-lg')
}
window.viewPrescriptionDetail = viewPrescriptionDetail

// ════════════════════════════════════════════════════════════════
//  OPTICAL EXAMINATION — VIEW/PRINT PRESCRIPTION (exam-keyed callers)
// ════════════════════════════════════════════════════════════════
// Both resolve the exam's linked prescription (via prescriptions.examId)
// and hand off to the canonical prescriptions-table implementation above
// — avoids maintaining a second, parallel rendering of the same document.
function viewPrescriptionModal(patientId, examId) {
  const p = patients.find(p => p.id === patientId)
  if (!p) return
  const rx = (p.prescriptions || []).find(r => r.examId === examId)
  if (!rx) { toast('No prescription was issued for this exam.', 'info'); return }
  viewPrescriptionDetail(patientId, rx.id)
}
window.viewPrescriptionModal = viewPrescriptionModal

function printPrescription(patientId, examId) {
  const p = patients.find(pt => pt.id === patientId)
  if (!p) return
  const rx = (p.prescriptions || []).find(r => r.examId === examId)
  if (!rx) { toast('No prescription was issued for this exam.', 'info'); return }
  printRxRecord(patientId, rx.id)
}
window.printPrescription = printPrescription

// ════════════════════════════════════════════════════════════════
//  DASHBOARD UPDATERS
// ════════════════════════════════════════════════════════════════

function updateAdminCharts() {
  const el    = id => document.getElementById(id)
  const range = parseInt(el('admin-chart-range-select')?.value || '6', 10)
  const now   = new Date()
  const labels = []
  const apptMonths = []
  const ptMonths   = []
  for (let i = range - 1; i >= 0; i--) {
    const d = new Date(now.getFullYear(), now.getMonth() - i, 1)
    labels.push(d.toLocaleString('en-US', { month: 'short' }))
    const y = d.getFullYear(), m = d.getMonth()
    apptMonths.push(appointments.filter(a => {
      const ad = new Date(a.date); return ad.getFullYear() === y && ad.getMonth() === m && !['cancelled','disapproved'].includes(a.status)
    }).length)
    ptMonths.push(patients.filter(p => {
      if (!p.registeredDate) return false
      const pd = new Date(p.registeredDate); return pd.getFullYear() === y && pd.getMonth() === m
    }).length)
  }

  if (window._charts?.updateAppointmentsChart) window._charts.updateAppointmentsChart(apptMonths, labels)
  if (window._charts?.updatePatientGrowthChart) window._charts.updatePatientGrowthChart(ptMonths, labels)
  const rangeEl = el('admin-chart-range-label')
  if (rangeEl && labels.length) rangeEl.textContent = labels.length > 1 ? `${labels[0]} – ${labels[labels.length - 1]}` : labels[0]
}
window.updateAdminCharts = updateAdminCharts

function updateAdminDashboard() {
  const todayStr     = localDateStr()
  const todayCnt     = appointments.filter(a => a.date === todayStr && !['cancelled','disapproved'].includes(a.status)).length
  const completedCnt = appointments.filter(a => a.status === 'completed').length
  const cancelledCnt = appointments.filter(a => a.status === 'cancelled').length
  const totalDocs    = doctors.length
  const _todayShort  = ['Sun','Mon','Tue','Wed','Thu','Fri','Sat'][new Date().getDay()]
  const availDocs    = doctors.filter(d => d.status === 'active' && d.available && (d.days || []).includes(_todayShort)).length
  const pendingCnt   = appointments.filter(a => a.status === 'pending').length

  // ── Update stat cards ─────────────────────────────────────────
  const el = id => document.getElementById(id)
  if (el('admin-stat-patients'))  { el('admin-stat-patients').textContent  = patients.length; const pdelta = el('admin-stat-patients').closest('.stat-info')?.querySelector('.stat-delta'); if (pdelta) pdelta.textContent = patients.filter(p=>p.status==='active').length + ' active' }
  if (el('admin-stat-appts'))     { el('admin-stat-appts').textContent     = appointments.length; const d = el('admin-stat-appts').closest('.stat-info')?.querySelector('.stat-delta'); if (d) d.textContent = pendingCnt + ' pending' }
  if (el('admin-stat-doctors'))     el('admin-stat-doctors').textContent   = availDocs + '/' + totalDocs
  if (el('admin-stat-today'))       el('admin-stat-today').textContent     = todayCnt
  if (el('admin-stat-completed'))   el('admin-stat-completed').textContent = completedCnt
  if (el('admin-stat-cancelled'))   el('admin-stat-cancelled').textContent = cancelledCnt

  // ── Update charts with real monthly data ─────────────────────
  updateAdminCharts()

  // ── Update doctor availability list ──────────────────────────
  const docList = el('admin-doctors-list')
  if (docList && doctors.length > 0) {
    docList.innerHTML = doctors.map(d => {
      const avail   = d.available && d.status === 'active'
      const docAvatar = d.photoUrl
        ? `<div style="width:32px;height:32px;border-radius:50%;overflow:hidden;flex-shrink:0"><img src="${d.photoUrl}" alt="${d.name}" style="width:100%;height:100%;object-fit:cover;object-position:top;display:block" onerror="var w=this.parentElement;if(w){w.style.cssText='width:32px;height:32px;border-radius:50%;background:#E8760A;color:#fff;font-size:.65rem;font-weight:700;display:flex;align-items:center;justify-content:center;flex-shrink:0';w.textContent='${d.name.split(' ').filter(Boolean).map(w=>w[0]).slice(0,2).join('').toUpperCase().replace(/'/g,"\\'")}'}"></div>`
        : `<div style="width:32px;height:32px;border-radius:50%;background:#E8760A;color:#fff;font-size:.65rem;font-weight:700;display:flex;align-items:center;justify-content:center;flex-shrink:0">${d.name.split(' ').filter(Boolean).map(w=>w[0]).slice(0,2).join('').toUpperCase()}</div>`
      return `<div class="doctor-avail-item">
        <div class="doctor-avail-info">
          <div class="avail-dot ${avail ? 'available' : 'unavailable'}"></div>
          ${docAvatar}
          <div>
            <div style="font-size:.85rem;font-weight:600;color:#1C1C1C">${d.name}</div>
            <div style="font-size:.75rem;color:#9CA3AF">${d.specialization} &bull; ${(d.days||[]).join(', ')}</div>
          </div>
        </div>
        ${badge(avail ? 'active' : 'inactive')}
      </div>`
    }).join('')
  }

  // ── Update recent appointments ────────────────────────────────
  const apptsTbody = el('admin-appts-tbody')
  if (apptsTbody) {
    const recent = [...appointments].sort((a, b) => b.date.localeCompare(a.date) || String(b.id).localeCompare(String(a.id))).slice(0, 6)
    apptsTbody.innerHTML = recent.map(a => `<tr>
      <td data-label="Patient" style="font-size:.82rem;font-weight:600">${a.patientName || '—'}</td>
      <td data-label="Doctor" style="font-size:.78rem;color:#6B7280">${(a.doctorName || '').replace('Dr. ', '').split(' ').pop()}</td>
      <td data-label="Date" style="font-size:.78rem;color:#6B7280;white-space:nowrap">${fmtDate(a.date)}</td>
      <td data-label="Status">${badge(a.status)}</td>
    </tr>`).join('')
  }

  // ── Update activity feed ──────────────────────────────────────
  const _iconForType  = t => ({ appointment:'calendar', examination:'eye', patient:'user', login:'log-out', report:'file-text', schedule:'clock', settings:'settings', account:'shield', archive:'archive' }[t] || 'activity')
  const _colorForType = t => ({ appointment:'orange', examination:'blue', patient:'green', login:'purple', report:'blue', schedule:'orange', settings:'orange', account:'red', archive:'red' }[t] || 'orange')
  const _relTime = ts => {
    const diff = Date.now() - new Date(ts.replace(' ', 'T')).getTime()
    const mins = Math.floor(diff / 60000)
    if (mins < 60) return mins <= 1 ? 'Just now' : `${mins} min ago`
    const hrs = Math.floor(mins / 60)
    if (hrs < 24) return `${hrs} hour${hrs > 1 ? 's' : ''} ago`
    const days = Math.floor(hrs / 24)
    return days === 1 ? 'Yesterday' : `${days} days ago`
  }
  const actFeed = el('admin-activity-feed')
  if (actFeed && activityLog.length > 0) {
    actFeed.innerHTML = activityLog.slice(0, 5).map(a => `
    <div class="activity-item">
      <div class="activity-icon-wrap ${_colorForType(a.type)}">${icon(_iconForType(a.type), 'icon-sm')}</div>
      <div class="activity-content">
        <div class="activity-action"><strong>${a.user}</strong> ${a.action}</div>
        <div class="activity-meta">${_relTime(a.timestamp)}</div>
      </div>
    </div>`).join('')
  }
}
window.updateAdminDashboard = updateAdminDashboard

function updateStaffDashboard() {
  // Staff Dashboard now renders the exact same shared body as Admin
  // Dashboard (see _dashboardOverviewBody in pages.js) — identical stat
  // card ids, chart canvases, and Doctor Availability / Recent
  // Appointments table — so the same refresh logic applies to both.
  // Kept as its own named function (rather than aliasing window.updateAdminDashboard
  // directly) so auth.js's per-page polling hooks don't need to change.
  updateAdminDashboard()
}
window.updateStaffDashboard = updateStaffDashboard

// ════════════════════════════════════════════════════════════════
//  DOCTOR SCHEDULE — TAB / PANEL SWITCHERS
// ════════════════════════════════════════════════════════════════
function switchScheduleDoctor(id) {
  document.querySelectorAll('.sched-doctor-panel').forEach(p => p.style.display = 'none')
  const panel = document.getElementById('sched-panel-' + id)
  if (panel) panel.style.display = ''
  document.querySelectorAll('.sched-tab').forEach(t => {
    t.classList.toggle('active', String(t.dataset.doc) === String(id))
  })
}
window.switchScheduleDoctor = switchScheduleDoctor

// ════════════════════════════════════════════════════════════════
//  CALENDAR MONTH NAVIGATION — shared helpers
// ════════════════════════════════════════════════════════════════
function buildCalCells(year, month, docDays, docId) {
  const now      = new Date()
  const todayY   = now.getFullYear()
  const todayM   = now.getMonth()
  const todayD   = now.getDate()
  const dayNames = ['Sun','Mon','Tue','Wed','Thu','Fri','Sat']
  const firstDay = new Date(year, month, 1).getDay()
  const daysInMon = new Date(year, month + 1, 0).getDate()

  const apptsByDate = {}
  appointments
    .filter(a => (docId ? a.doctorId === docId : true) && ['approved','pending'].includes(a.status))
    .forEach(a => {
      if (!apptsByDate[a.date]) apptsByDate[a.date] = []
      apptsByDate[a.date].push(a)
    })

  const blockedByDate = {}
  if (docId) {
    const doc = doctors.find(d => d.id === docId)
    ;(doc?.blockedDates || []).forEach(b => { blockedByDate[b.date] = b.reason || 'Blocked' })
  }
  const phHolidays = typeof getPHHolidays === 'function' ? getPHHolidays(year) : {}
  const selectedDate = docId ? (window._schedCalState?.[docId]?.selectedDate || '') : ''

  let cells = ''
  for (let i = 0; i < firstDay; i++) cells += `<div class="cal-day other-month"></div>`
  for (let d = 1; d <= daysInMon; d++) {
    const dow      = new Date(year, month, d).getDay()
    const dayAbb   = dayNames[dow]
    const isToday  = year === todayY && month === todayM && d === todayD
    const isPast   = new Date(year, month, d) < new Date(todayY, todayM, todayD)
    const dateStr  = `${year}-${String(month+1).padStart(2,'0')}-${String(d).padStart(2,'0')}`
    const avail    = (docDays || []).includes(dayAbb)
    const dayAppts = apptsByDate[dateStr] || []
    const blockedReason = blockedByDate[dateStr]
    const isHoliday   = !blockedReason && !!phHolidays[dateStr]
    const holidayName = phHolidays[dateStr] || ''
    const isSel    = dateStr === selectedDate
    let cls = avail ? 'avail' : 'blocked'
    if (isToday)      cls += (cls ? ' ' : '') + 'today'
    if (blockedReason) cls = (isToday ? 'today date-blocked' : 'date-blocked')
    else if (isHoliday) cls = (isToday ? 'today cal-holiday' : 'cal-holiday')
    if (isSel) cls += ' cal-selected'
    const tip = !isHoliday && dayAppts.length
      ? `onmouseenter="window.showCalTip(this,'${JSON.stringify(dayAppts.map(a=>({time:a.time,patientName:a.patientName,status:a.status}))).replace(/'/g,'&#39;').replace(/"/g,'&quot;')}')" onmouseleave="window.hideCalTip()"`
      : ''
    const titleAttr = blockedReason ? `title="Blocked: ${blockedReason.replace(/"/g,'&quot;')}"` :
                      isHoliday ? `title="PH Holiday: ${holidayName.replace(/"/g,'&quot;')}"` : ''
    const inner = isHoliday ? `${d}<span class="cal-holiday-lbl">${holidayName}</span>` : String(d)
    // Click-to-select is scoped to the admin/staff Doctor Schedule page
    // (docId present) — a day the doctor is normally available on (so
    // blocking it means something) or a day already explicitly blocked
    // (so it can be unblocked). Days the doctor never works, holidays, and
    // past days aren't interactive here — nothing meaningful to toggle.
    const clickable = !!docId && !isPast && ((avail && !blockedReason && !isHoliday) || !!blockedReason)
    const clickEvt  = clickable ? `onclick="window.schedCalSelectDate('${docId}','${dateStr}')"` : ''
    const cursorStyle = clickable ? ' style="cursor:pointer"' : ''
    cells += `<div class="cal-day ${cls}${!isHoliday&&dayAppts.length?' has-appts':''}"${cursorStyle} ${tip} ${clickEvt} ${titleAttr}>${inner}</div>`
  }
  return cells
}

// Real schedule appointments — looked up from the shared appointments array
function _getSchedAppts(dateStr, docId) {
  const _timeVal = t => { if (!t) return 0; const cl = t.includes('PM') && !t.startsWith('12'); const [h, m] = t.replace(/ [AP]M$/, '').split(':').map(Number); return (cl ? h + 12 : (t.includes('AM') && h === 12 ? 0 : h)) * 60 + m }
  return appointments
    .filter(a => a.date === dateStr && (!docId || a.doctorId === docId) && !['cancelled', 'disapproved'].includes(a.status))
    .sort((a, b) => _timeVal(a.time) - _timeVal(b.time))
    .map(a => ({ time: a.time, patient: a.patientName, type: a.type }))
}

// Build calendar cells for the doctor schedule page (uses real appointments)
function buildDocCalCells(year, month, docDays) {
  const now       = new Date()
  const todayY    = now.getFullYear()
  const todayM    = now.getMonth()
  const todayD    = now.getDate()
  const dayNames  = ['Sun','Mon','Tue','Wed','Thu','Fri','Sat']
  const firstDay  = new Date(year, month, 1).getDay()
  const daysInMon = new Date(year, month + 1, 0).getDate()
  const doc       = doctors.find(d => d.id === state.user?.id)
  const blockedByDate = {}
  ;(doc?.blockedDates || []).forEach(b => { blockedByDate[b.date] = b.reason || 'Blocked' })
  const phHolidays = typeof getPHHolidays === 'function' ? getPHHolidays(year) : {}

  let cells = ''
  for (let i = 0; i < firstDay; i++) cells += `<div class="cal-day other-month"></div>`
  for (let d = 1; d <= daysInMon; d++) {
    const dow      = new Date(year, month, d).getDay()
    const dayAbb   = dayNames[dow]
    const isToday  = year === todayY && month === todayM && d === todayD
    const isPast   = new Date(year, month, d) < new Date(todayY, todayM, todayD)
    const dateStr  = `${year}-${String(month+1).padStart(2,'0')}-${String(d).padStart(2,'0')}`
    const avail    = (docDays || []).includes(dayAbb)
    // Same {time, patientName, status} shape showCalTip() (the patient
    // Doctor Availability calendar's hover tooltip, below) already expects
    // — reused as-is instead of building a second tooltip renderer.
    const dayAppts = doc ? appointments.filter(a => a.date === dateStr && a.doctorId === doc.id && !['cancelled','disapproved'].includes(a.status))
                          .map(a => ({ time: a.time, patientName: a.patientName, status: a.status })) : []
    const hasAppts = dayAppts.length > 0
    const blockedReason = blockedByDate[dateStr]
    const isHoliday   = !blockedReason && !!phHolidays[dateStr]
    const holidayName = phHolidays[dateStr] || ''

    let cls = avail ? 'avail' : 'blocked'
    if (isToday) cls += (cls ? ' ' : '') + 'today'
    if (hasAppts) cls += ' has-appts'
    if (blockedReason) cls = (isToday ? 'today date-blocked' : 'date-blocked') + (hasAppts ? ' has-appts' : '')
    else if (isHoliday) cls = (isToday ? 'today cal-holiday' : 'cal-holiday') + (hasAppts ? ' has-appts' : '')
    const fadeStyle = isPast && !isToday ? 'opacity:0.5;' : ''
    const titleAttr = blockedReason ? `title="Blocked: ${blockedReason.replace(/"/g,'&quot;')}"` :
                      isHoliday ? `title="PH Holiday: ${holidayName.replace(/"/g,'&quot;')}"` : ''
    const inner = isHoliday ? `${d}<span class="cal-holiday-lbl">${holidayName}</span>` : String(d)
    const hoverEvt = hasAppts
      ? `onmouseenter="window.showCalTip(this,'${JSON.stringify(dayAppts).replace(/'/g,'&#39;').replace(/"/g,'&quot;')}')" onmouseleave="window.hideCalTip()"`
      : ''

    cells += `<div class="cal-day ${cls}" style="${fadeStyle}" ${titleAttr} ${hoverEvt}
      onclick="window.docSchedClickDay('${dateStr}','${avail}','${dayAbb}',this)">${inner}</div>`
  }
  return cells
}

// Doctor schedule page — update calendar + show today's schedule
function docSchedGoMonth(year, month) {
  const now    = new Date()
  const todayY = now.getFullYear()
  const todayM = now.getMonth()
  const todayD = now.getDate()

  const { user } = state
  const doc = doctors.find(d => d.id === user?.id) || doctors[0]
  if (!doc) return

  const monthName = new Date(year, month, 1).toLocaleDateString('en-PH', { month: 'long', year: 'numeric' })
  const prevMonth = month === 0 ? 11 : month - 1
  const prevYear  = month === 0 ? year - 1 : year
  const nextMonth = month === 11 ? 0 : month + 1
  const nextYear  = month === 11 ? year + 1 : year

  const titleEl = document.getElementById('doc-sched-title')
  if (titleEl) titleEl.textContent = monthName

  const calEl = document.getElementById('doc-sched-cal')
  if (calEl) calEl.innerHTML = buildDocCalCells(year, month, doc.days)

  const prev     = document.getElementById('doc-sched-prev')
  const next     = document.getElementById('doc-sched-next')
  const todayBtn = document.getElementById('doc-sched-today')
  if (prev)     prev.onclick     = () => docSchedGoMonth(prevYear, prevMonth)
  if (next)     next.onclick     = () => docSchedGoMonth(nextYear, nextMonth)
  if (todayBtn) todayBtn.onclick = () => docSchedGoMonth(todayY, todayM)

  // Show today's schedule in the panel by default
  const todayStr = `${todayY}-${String(todayM+1).padStart(2,'0')}-${String(todayD).padStart(2,'0')}`
  const dayAbb   = ['Sun','Mon','Tue','Wed','Thu','Fri','Sat'][new Date(todayY, todayM, todayD).getDay()]
  const avail    = (doc.days || []).includes(dayAbb)
  window.docSchedClickDay(todayStr, String(avail), dayAbb, null)
}
window.docSchedGoMonth = docSchedGoMonth

function docSchedClickDay(dateStr, availStr, dayAbb, cellEl) {
  // Highlight selected cell
  document.querySelectorAll('#doc-sched-cal .cal-day').forEach(el => el.style.outline = '')
  if (cellEl) cellEl.style.outline = '2px solid #E8760A'

  const avail = availStr === 'true' || availStr === true
  const doc   = doctors.find(d => d.id === state.user?.id)
  const appts = _getSchedAppts(dateStr, doc?.id)
  const dt       = new Date(dateStr + 'T00:00:00')
  const isWeekend = dt.getDay() === 0 || dt.getDay() === 6
  const dayNames  = ['Sunday','Monday','Tuesday','Wednesday','Thursday','Friday','Saturday']
  const dateLabel = dt.toLocaleDateString('en-PH', { weekday: 'long', month: 'long', day: 'numeric', year: 'numeric' })

  const titleEl = document.getElementById('doc-sched-list-title')
  const listEl  = document.getElementById('doc-sched-list')
  if (!listEl) return
  if (titleEl) titleEl.textContent = dateLabel

  const blocked = (doc?.blockedDates || []).find(b => b.date === dateStr)
  if (blocked) {
    listEl.innerHTML = `<div style="padding:28px 20px;text-align:center;color:#9CA3AF;font-size:.85rem">
      ${icon('x-circle','icon-lg')}<br><br>
      <strong style="color:#B91C1C;font-size:.9rem">Blocked</strong><br>
      <span style="font-size:.82rem">${blocked.reason ? esc(blocked.reason) : 'You are marked unavailable on this date.'}</span></div>`
    return
  }

  if (!avail && isWeekend) {
    listEl.innerHTML = `<div style="padding:28px 20px;text-align:center;color:#9CA3AF;font-size:.85rem">
      ${icon('calendar','icon-lg')}<br><br>
      <strong style="color:#374151;font-size:.9rem">Weekend</strong><br>
      <span style="font-size:.82rem">No consultations scheduled.</span></div>`
    return
  }

  if (!avail) {
    listEl.innerHTML = `<div style="padding:28px 20px;text-align:center;color:#9CA3AF;font-size:.85rem">
      ${icon('x-circle','icon-lg')}<br><br>
      <strong style="color:#374151;font-size:.9rem">Not Scheduled</strong><br>
      <span style="font-size:.82rem">You are not available for consultations on ${dayNames[dt.getDay()]}s.</span></div>`
    return
  }

  const hoursBlock = `
    <div style="padding:14px 20px;border-bottom:1px solid #F3F4F6">
      <div style="font-size:.68rem;text-transform:uppercase;letter-spacing:.06em;color:#9CA3AF;font-weight:700;margin-bottom:8px">Consultation Hours</div>
      <div style="display:flex;flex-direction:column;gap:5px">
        <div style="display:flex;align-items:center;gap:7px;font-size:.82rem;color:#374151">
          ${icon('clock','icon-sm')} 8:00 AM – 12:00 PM
        </div>
        <div style="display:flex;align-items:center;gap:7px;font-size:.82rem;color:#374151">
          ${icon('clock','icon-sm')} 1:00 PM – 5:00 PM
        </div>
      </div>
    </div>`

  if (!appts.length) {
    listEl.innerHTML = hoursBlock + `<div class="table-empty">No appointments scheduled for this day.</div>`
    return
  }

  const apptItems = appts.map(a => `
    <div style="display:flex;gap:10px;align-items:flex-start;margin-bottom:16px">
      <div style="width:7px;height:7px;border-radius:50%;background:#E8760A;flex-shrink:0;margin-top:5px"></div>
      <div>
        <div style="font-size:.82rem;font-weight:700;color:#1C1C1C">${a.time}</div>
        <div style="font-size:.88rem;color:#1C1C1C;margin-top:2px">${a.patient}</div>
        <div style="font-size:.78rem;color:#9CA3AF;margin-top:1px">${a.type}</div>
      </div>
    </div>`).join('')

  listEl.innerHTML = hoursBlock + `
    <div style="padding:14px 20px">
      <div style="font-size:.68rem;text-transform:uppercase;letter-spacing:.06em;color:#9CA3AF;font-weight:700;margin-bottom:12px">
        Appointments (${appts.length})
      </div>
      ${apptItems}
    </div>`
}
window.docSchedClickDay = docSchedClickDay

// renderDoctorUpcoming()/_renderDoctorUpcomingList() (the "Upcoming
// Appointments" panel that used to sit below the calendar on My Schedule)
// were removed here — that panel duplicated My Appointments → Upcoming's
// data on the same page in a second format, so the section itself was
// removed from pageDoctorSchedule() (pages.js) rather than kept in sync.

// Staff/Admin schedule page — update all doctor calendar grids in place
function schedGoMonth(year, month) {
  const now    = new Date()
  const todayY = now.getFullYear()
  const todayM = now.getMonth()

  const monthName = new Date(year, month, 1).toLocaleDateString('en-PH', { month: 'long', year: 'numeric' })
  const prevMonth = month === 0 ? 11 : month - 1
  const prevYear  = month === 0 ? year - 1 : year
  const nextMonth = month === 11 ? 0 : month + 1
  const nextYear  = month === 11 ? year + 1 : year

  const allDocs = typeof getAvailableDoctors === 'function' ? getAvailableDoctors() : []

  // Track the currently displayed month so schedCalSelectDate() (a
  // targeted, single-cell rerender) can rebuild the right grid without
  // needing the year/month threaded through every call site.
  window._schedCalYM = { year, month }
  // Any "Selected Date" banner belongs to whichever month was showing
  // before — carrying it into the new month would point at a date the
  // grid no longer shows, so close it out on navigation.
  document.querySelectorAll('[id^="sched-cal-banner-"]').forEach(el => el.remove())
  if (window._schedCalState) {
    Object.keys(window._schedCalState).forEach(k => { window._schedCalState[k].selectedDate = '' })
  }

  // Update each doctor's calendar grid
  allDocs.forEach(doc => {
    const calEl = document.getElementById('sched-cal-' + doc.id)
    if (calEl) calEl.innerHTML = buildCalCells(year, month, doc.availableDays, doc.id)
  })

  // Update all month titles and wire all nav buttons in all panels
  document.querySelectorAll('.sched-month-title').forEach(el => { el.textContent = monthName })
  document.querySelectorAll('.sched-prev').forEach(btn => { btn.onclick = () => schedGoMonth(prevYear, prevMonth) })
  document.querySelectorAll('.sched-next').forEach(btn => { btn.onclick = () => schedGoMonth(nextYear, nextMonth) })
  document.querySelectorAll('.sched-today').forEach(btn => { btn.onclick = () => schedGoMonth(todayY, todayM) })
}
window.schedGoMonth = schedGoMonth

// ════════════════════════════════════════════════════════════════
//  ADMIN/STAFF DOCTOR SCHEDULE — CLICK-TO-BLOCK CALENDAR
//  Same click-a-day → banner pattern as the patient Doctor Availability
//  calendar (patCalSelectDate() above), reusing its .pat-cal-selected-
//  banner styling so both calendars read as the same component. Blocking
//  and unblocking update the local doctors[] entry directly instead of
//  going through _syncDoctors() (a full re-fetch that also re-renders the
//  whole page for the 'schedule' route) — that would reset the visible
//  month back to today and the active doctor tab back to the first
//  doctor, undoing the very selection this flow is meant to preserve.
// ════════════════════════════════════════════════════════════════
window._schedCalState = window._schedCalState || {}

function _schedCalRerender(docId) {
  const doc = doctors.find(d => d.id === docId)
  if (!doc) return
  const ym = window._schedCalYM || { year: new Date().getFullYear(), month: new Date().getMonth() }
  const calEl = document.getElementById('sched-cal-' + docId)
  if (calEl) calEl.innerHTML = buildCalCells(ym.year, ym.month, doc.availableDays, docId)
}

function schedCalSelectDate(docId, dateStr) {
  window._schedCalState[docId] = { selectedDate: dateStr }
  _schedCalRerender(docId)

  const doc = doctors.find(d => d.id === docId)
  const calEl = document.getElementById('sched-cal-' + docId)
  if (!doc || !calEl) return

  const existing = document.getElementById('sched-cal-banner-' + docId)
  if (existing) existing.remove()

  const dt      = new Date(dateStr + 'T00:00:00')
  const dayFull = dt.toLocaleDateString('en-US', { weekday: 'long', month: 'long', day: 'numeric', year: 'numeric' })
  const blocked = (doc.blockedDates || []).find(b => b.date === dateStr)

  const pop = document.createElement('div')
  pop.id = 'sched-cal-banner-' + docId
  pop.className = 'pat-cal-selected-banner'
  pop.innerHTML = blocked ? `
      <button class="modal-close" onclick="window.schedCalCloseBanner('${docId}')">&times;</button>
      <div style="font-size:.72rem;font-weight:600;color:#9CA3AF;text-transform:uppercase;letter-spacing:.05em;margin-bottom:6px">Selected Date</div>
      <div style="font-size:.88rem;font-weight:700;color:#1C1C1C;margin-bottom:2px;padding-right:26px">${dayFull}</div>
      <div style="font-size:.78rem;color:#B91C1C;margin-bottom:14px">Blocked${blocked.reason ? ': ' + esc(blocked.reason) : ''}</div>
      <button id="sched-cal-unblock-btn-${docId}" class="btn-secondary" style="width:100%;justify-content:center"
              onclick="window.schedCalUnblockDate('${docId}','${dateStr}')">
        Unblock This Date
      </button>` : `
      <button class="modal-close" onclick="window.schedCalCloseBanner('${docId}')">&times;</button>
      <div style="font-size:.72rem;font-weight:600;color:#9CA3AF;text-transform:uppercase;letter-spacing:.05em;margin-bottom:6px">Selected Date</div>
      <div style="font-size:.88rem;font-weight:700;color:#1C1C1C;margin-bottom:2px;padding-right:26px">${dayFull}</div>
      <div style="font-size:.78rem;color:#6B7280;margin-bottom:10px">${esc(doc.name)}</div>
      <label class="form-label" for="sched-cal-reason-${docId}">Reason <span class="req">*</span></label>
      <input id="sched-cal-reason-${docId}" type="text" class="form-input" placeholder="e.g. Leave, Conference, Holiday…" style="margin-bottom:10px">
      <button id="sched-cal-block-btn-${docId}" class="btn-primary" style="width:100%;justify-content:center"
              onclick="window.schedCalBlockDate('${docId}','${dateStr}')">
        Block This Date
      </button>`
  calEl.insertAdjacentElement('afterend', pop)
}
window.schedCalSelectDate = schedCalSelectDate

function schedCalCloseBanner(docId) {
  if (window._schedCalState[docId]) window._schedCalState[docId].selectedDate = ''
  const existing = document.getElementById('sched-cal-banner-' + docId)
  if (existing) existing.remove()
  _schedCalRerender(docId)
}
window.schedCalCloseBanner = schedCalCloseBanner

async function schedCalBlockDate(docId, dateStr) {
  const reasonEl = document.getElementById('sched-cal-reason-' + docId)
  const reason   = reasonEl?.value?.trim() || ''
  if (!reason) { toast('Please provide a reason for blocking this date.', 'error'); return }

  // Same snappy client-side pre-check as doBlockDate() — the real,
  // unbypassable enforcement happens server-side in block-date.php.
  const conflicting = appointments.filter(a => a.doctorId === docId && a.date === dateStr && a.status === 'approved')
  if (conflicting.length) {
    toast(`This date already has ${conflicting.length} approved appointment${conflicting.length === 1 ? '' : 's'}. Cancel or reschedule ${conflicting.length === 1 ? 'it' : 'them'} before blocking this date.`, 'error')
    return
  }

  const doc = doctors.find(d => d.id === docId)
  const btn = document.getElementById('sched-cal-block-btn-' + docId)
  if (_btnBusy(btn, 'primary', 'Blocking…')) return

  try {
    const r = await fetch('api/doctors/block-date.php', {
      method:  'POST',
      headers: { 'Content-Type': 'application/json' },
      body:    JSON.stringify({ doctorId: docId, date: dateStr, reason, blockedBy: state.user?.name || '' }),
    })
    const d = await r.json()
    if (!d.success) { toast(d.message || 'Could not block date.', 'error'); _btnIdle(btn); return }

    if (doc) {
      doc.blockedDates = doc.blockedDates || []
      const existing = doc.blockedDates.find(b => b.date === dateStr)
      if (existing) existing.reason = reason
      else doc.blockedDates.push({ date: dateStr, reason })
    }
    addActivityLog({ id: 'L' + Date.now(), user: state.user.name, role: state.role,
      action: `Blocked ${dateStr} for ${doc?.name || ''}${reason ? ' — ' + reason : ''}`,
      timestamp: nowTimestamp(), type: 'settings' })

    toast(`Date blocked for ${doc?.name || 'doctor'}.`)
    // Rebuilds the banner from scratch (new button element) — the busy
    // button reference above becomes a detached node, nothing left to idle.
    schedCalSelectDate(docId, dateStr)
  } catch (_) {
    toast('Network error — date not blocked.', 'error')
    _btnIdle(btn)
  }
}
window.schedCalBlockDate = schedCalBlockDate

async function schedCalUnblockDate(docId, dateStr) {
  const doc = doctors.find(d => d.id === docId)
  const btn = document.getElementById('sched-cal-unblock-btn-' + docId)
  if (_btnBusy(btn, 'secondary', 'Unblocking…')) return

  try {
    const r = await fetch('api/doctors/unblock-date.php', {
      method:  'POST',
      headers: { 'Content-Type': 'application/json' },
      body:    JSON.stringify({ doctorId: docId, date: dateStr }),
    })
    const d = await r.json()
    if (!d.success) { toast(d.message || 'Could not unblock date.', 'error'); _btnIdle(btn); return }

    if (doc) doc.blockedDates = (doc.blockedDates || []).filter(b => b.date !== dateStr)
    toast('Date unblocked.')
    // Rebuilds the banner from scratch — see schedCalBlockDate()'s note.
    schedCalSelectDate(docId, dateStr)
  } catch (_) {
    toast('Network error — date not unblocked.', 'error')
    _btnIdle(btn)
  }
}
window.schedCalUnblockDate = schedCalUnblockDate

// ════════════════════════════════════════════════════════════════
//  PATIENT DOCTOR AVAILABILITY — TAB / PANEL SWITCHERS
// ════════════════════════════════════════════════════════════════
function switchPatDocDoctor(id) {
  document.querySelectorAll('.pat-doc-panel').forEach(p => p.style.display = 'none')
  const panel = document.getElementById('pat-doc-panel-' + id)
  if (panel) panel.style.display = ''
  document.querySelectorAll('.pat-doc-tab').forEach(t => {
    t.classList.toggle('active', String(t.dataset.doc) === String(id))
  })
}
window.switchPatDocDoctor = switchPatDocDoctor

// ════════════════════════════════════════════════════════════════
//  BLOCK DATE MODAL (Admin/Staff)
// ════════════════════════════════════════════════════════════════
function esc(s) {
  return String(s ?? '').replace(/[&<>"']/g, c => ({ '&':'&amp;', '<':'&lt;', '>':'&gt;', '"':'&quot;', "'":'&#39;' }[c]))
}

function _blockedListHtml(doctorId) {
  const doc = doctors.find(d => d.id === doctorId)
  const list = (doc?.blockedDates || []).slice().sort((a, b) => a.date.localeCompare(b.date))
  if (!list.length) {
    return `<div style="font-size:.8rem;color:#9CA3AF;text-align:center;padding:12px 0">No dates blocked yet.</div>`
  }
  return list.map(b => {
    const dt = new Date(b.date + 'T00:00:00')
    const label = dt.toLocaleDateString('en-PH', { weekday: 'short', month: 'short', day: 'numeric', year: 'numeric' })
    return `
    <div style="display:flex;align-items:center;justify-content:space-between;gap:8px;padding:8px 10px;border:1px solid #FEE2E2;background:#FFF5F5;border-radius:8px;margin-bottom:6px">
      <div style="min-width:0">
        <div style="font-size:.8rem;font-weight:600;color:#1C1C1C">${label}</div>
        ${b.reason ? `<div style="font-size:.74rem;color:#9CA3AF;overflow:hidden;text-overflow:ellipsis;white-space:nowrap">${esc(b.reason)}</div>` : ''}
      </div>
      <button class="btn-icon" title="Unblock this date" style="color:#DC2626;flex-shrink:0"
              onclick="window.doUnblockDate('${doctorId}','${b.date}')">
        ${ic('x', 'icon-sm')}
      </button>
    </div>`
  }).join('')
}

function openBlockDateModal(doctorId, doctorName) {
  showModal(`
    <div class="modal-header">
      <div class="modal-title">Block Date — ${esc(doctorName)}</div>
      <button class="modal-close" onclick="window.closeModal()">&times;</button>
    </div>
    <div class="modal-body">
      <div class="form-group">
        <label class="form-label">Date to Block <span class="req">*</span></label>
        ${window.dateFieldHtml('block-date-input', { min: localDateStr(), max: localDateStr(new Date(new Date().setFullYear(new Date().getFullYear() + 1))) })}
      </div>
      <div class="form-group">
        <label class="form-label">Reason <span class="req">*</span></label>
        <input id="block-date-reason" type="text" class="form-input"
               placeholder="e.g. Leave, Conference, Holiday…">
      </div>
      <div class="form-group" style="margin-bottom:0">
        <label class="form-label">Currently Blocked Dates</label>
        <div id="block-date-list" style="margin-top:6px;max-height:220px;overflow-y:auto">
          ${_blockedListHtml(doctorId)}
        </div>
      </div>
    </div>
    <div class="modal-footer">
      <button class="btn-secondary" onclick="window.closeModal()">Cancel</button>
      <button class="btn-primary" id="block-date-confirm-btn" onclick="window.doBlockDate('${doctorId}','${doctorName.replace(/'/g,"\\'")}')">Block Date</button>
    </div>`)
}
window.openBlockDateModal = openBlockDateModal

async function doBlockDate(doctorId, doctorName) {
  const dateEl   = document.getElementById('block-date-input')
  const reasonEl = document.getElementById('block-date-reason')
  const date     = dateEl?.value
  const reason   = reasonEl?.value?.trim() || ''
  if (!date)   { toast('Please select a date.', 'error'); return }
  if (!reason) { toast('Please provide a reason for blocking this date.', 'error'); return }

  // Client-side pre-check purely for snappy UI (no round trip needed for
  // the common case) — the real, unbypassable enforcement happens server-
  // side in block-date.php against the database.
  const conflicting = appointments.filter(a => a.doctorId === doctorId && a.date === date && a.status === 'approved')
  if (conflicting.length) {
    toast(`This date already has ${conflicting.length} approved appointment${conflicting.length === 1 ? '' : 's'}. Cancel or reschedule ${conflicting.length === 1 ? 'it' : 'them'} before blocking this date.`, 'error')
    return
  }

  const btn = document.getElementById('block-date-confirm-btn')
  if (_btnBusy(btn, 'primary', 'Blocking…')) return

  try {
    const r = await fetch('api/doctors/block-date.php', {
      method:  'POST',
      headers: { 'Content-Type': 'application/json' },
      body:    JSON.stringify({ doctorId, date, reason, blockedBy: state.user?.name || '' }),
    })
    const d = await r.json()
    if (!d.success) { toast(d.message || 'Could not block date.', 'error'); return }

    addActivityLog({ id: 'L' + Date.now(), user: state.user.name, role: state.role,
      action: `Blocked ${date} for ${doctorName}${reason ? ' — ' + reason : ''}`,
      timestamp: nowTimestamp(), type: 'settings' })

    if (window._syncDoctors) await window._syncDoctors()
    toast(`Date blocked for ${doctorName}.`)

    // Refresh the modal in place instead of closing, so staff can block
    // several dates in one go and see the running list update live.
    window.setDateFieldValue('block-date-input', '')
    if (reasonEl) reasonEl.value = ''
    const listEl = document.getElementById('block-date-list')
    if (listEl) listEl.innerHTML = _blockedListHtml(doctorId)
  } catch (_) {
    toast('Network error — date not blocked.', 'error')
  } finally {
    _btnIdle(btn)
  }
}
window.doBlockDate = doBlockDate

async function doUnblockDate(doctorId, date) {
  // Icon-only row button — no label to swap, but still needs to be
  // disabled for the duration so a fast double-click on the same row
  // can't fire two unblock requests for the same date.
  const btn = document.querySelector(`#block-date-list button[onclick*="'${date}'"]`)
  if (btn) { if (btn.disabled) return; btn.disabled = true; btn.style.opacity = '.5' }
  try {
    const r = await fetch('api/doctors/unblock-date.php', {
      method:  'POST',
      headers: { 'Content-Type': 'application/json' },
      body:    JSON.stringify({ doctorId, date }),
    })
    const d = await r.json()
    if (!d.success) { toast(d.message || 'Could not unblock date.', 'error'); if (btn) { btn.disabled = false; btn.style.opacity = '' }; return }

    if (window._syncDoctors) await window._syncDoctors()
    toast('Date unblocked.')

    const listEl = document.getElementById('block-date-list')
    if (listEl) listEl.innerHTML = _blockedListHtml(doctorId)
  } catch (_) {
    toast('Network error — date not unblocked.', 'error')
    if (btn) { btn.disabled = false; btn.style.opacity = '' }
  }
}
window.doUnblockDate = doUnblockDate

// ════════════════════════════════════════════════════════════════
//  CALENDAR APPOINTMENT TOOLTIP
// ════════════════════════════════════════════════════════════════
;(function () {
  const tip = document.createElement('div')
  tip.id = 'cal-tooltip'
  document.body.appendChild(tip)
})()

let _calTipOutsideHandler = null

function showCalTip(el, json) {
  const tip = document.getElementById('cal-tooltip')
  if (!tip) return
  let appts
  try { appts = JSON.parse(json) } catch { return }

  const STATUS_META = {
    approved:    { color: '#10B981', label: 'Approved' },
    pending:     { color: '#F59E0B', label: 'Pending' },
    completed:   { color: '#9CA3AF', label: 'Completed' },
    cancelled:   { color: '#EF4444', label: 'Cancelled' },
    disapproved: { color: '#EF4444', label: 'Disapproved' },
  }
  const statusColor = s => (STATUS_META[s] || STATUS_META.completed).color

  // Build legend only for statuses that appear in this tooltip
  const seenStatuses = [...new Set(appts.map(a => a.status))]
  const legendHTML = seenStatuses.map(s => {
    const m = STATUS_META[s] || { color: '#9CA3AF', label: s }
    return `<span style="display:inline-flex;align-items:center;gap:4px;font-size:.62rem;color:#9CA3AF;white-space:nowrap">
      <span style="width:6px;height:6px;border-radius:50%;background:${m.color};flex-shrink:0"></span>${m.label}
    </span>`
  }).join('')

  tip.innerHTML = `
    <div style="font-weight:600;margin-bottom:6px;font-size:.73rem;color:#F9FAFB">
      ${appts.length} Appointment${appts.length > 1 ? 's' : ''}
    </div>
    ${appts.map(a => `
    <div style="display:flex;align-items:center;gap:7px;padding:4px 0;border-top:1px solid rgba(255,255,255,0.08)">
      <span style="font-size:.67rem;color:#9CA3AF;white-space:nowrap;flex-shrink:0">${a.time}</span>
      <span style="font-size:.7rem;flex:1;white-space:nowrap;overflow:hidden;text-overflow:ellipsis">${a.patientName}</span>
      <span style="width:7px;height:7px;border-radius:50%;background:${statusColor(a.status)};flex-shrink:0" title="${a.status}"></span>
    </div>`).join('')}
    <div style="margin-top:7px;padding-top:6px;border-top:1px solid rgba(255,255,255,0.1);display:flex;flex-wrap:wrap;gap:4px 10px">
      ${legendHTML}
    </div>
  `

  const rect = el.getBoundingClientRect()
  tip.style.display = 'block'
  const tipW = tip.offsetWidth
  let left = rect.left + rect.width / 2
  // Keep within viewport
  left = Math.max(tipW / 2 + 8, Math.min(left, window.innerWidth - tipW / 2 - 8))
  tip.style.left = left + 'px'

  // Show above or below depending on space
  const spaceAbove = rect.top
  const tipH = tip.offsetHeight + 14
  if (spaceAbove >= tipH) {
    tip.style.top  = (rect.top + window.scrollY - tipH + 4) + 'px'
    tip.style.setProperty('--arr-top', '100%')
    tip.classList.remove('tip-below')
  } else {
    tip.style.top  = (rect.bottom + window.scrollY + 9) + 'px'
    tip.classList.add('tip-below')
  }

  // Fade in
  requestAnimationFrame(() => { tip.style.opacity = '1' })

  // Mobile: dismiss on tap outside a .has-appts cell
  if ('ontouchstart' in window) {
    if (_calTipOutsideHandler) document.removeEventListener('touchstart', _calTipOutsideHandler)
    _calTipOutsideHandler = function(e) {
      if (!e.target.closest('.has-appts')) hideCalTip()
    }
    setTimeout(() => document.addEventListener('touchstart', _calTipOutsideHandler, { once: true }), 0)
  }
}
window.showCalTip = showCalTip

function hideCalTip() {
  const tip = document.getElementById('cal-tooltip')
  if (!tip) return
  if (_calTipOutsideHandler) {
    document.removeEventListener('touchstart', _calTipOutsideHandler)
    _calTipOutsideHandler = null
  }
  tip.style.opacity = '0'
  setTimeout(() => { if (tip.style.opacity === '0') tip.style.display = 'none' }, 150)
}
window.hideCalTip = hideCalTip

// ════════════════════════════════════════════════════════════════
//  LOGIN PAGE HELPERS
// ════════════════════════════════════════════════════════════════
function toggleLoginPw() {
  const inp = document.getElementById('login-password')
  const ico = document.getElementById('login-eye-icon')
  if (!inp) return
  const show = inp.type === 'password'
  inp.type = show ? 'text' : 'password'
  // FB-style: full eye + diagonal slash = hidden (default), plain open eye = revealed after click.
  if (ico) ico.innerHTML = show
    ? `<path d="M1 12s4-8 11-8 11 8 11 8-4 8-11 8-11-8-11-8z"/><circle cx="12" cy="12" r="3"/>`
    : `<path d="M1 12s4-8 11-8 11 8 11 8-4 8-11 8-11-8-11-8z"/><circle cx="12" cy="12" r="3"/><line x1="2" y1="2" x2="22" y2="22"/>`
}
window.toggleLoginPw = toggleLoginPw

const EYE_OPEN = `<path d="M1 12s4-8 11-8 11 8 11 8-4 8-11 8-11-8-11-8z"/><circle cx="12" cy="12" r="3"/>`
const EYE_CLOSED = `<path d="M1 12s4-8 11-8 11 8 11 8-4 8-11 8-11-8-11-8z"/><circle cx="12" cy="12" r="3"/><line x1="2" y1="2" x2="22" y2="22"/>`

function toggleRegPw(inputId, iconId) {
  const inp = document.getElementById(inputId)
  const ico = document.getElementById(iconId)
  if (!inp) return
  const show = inp.type === 'password'
  inp.type = show ? 'text' : 'password'
  // FB-style: slashed eye = hidden (default), open eye = revealed after click.
  if (ico) ico.innerHTML = show ? EYE_OPEN : EYE_CLOSED
}
window.toggleRegPw = toggleRegPw


// ════════════════════════════════════════════════════════════════
//  PHOTO / LOGO UPLOAD (frontend-only, FileReader preview)
// ════════════════════════════════════════════════════════════════

// Selecting a file no longer uploads it immediately — it opens the crop
// modal below first (Facebook-style drag-to-reposition + zoom slider), so
// whatever framing the user picks is what actually gets saved, instead of
// object-fit:cover blindly center-cropping whatever aspect ratio they
// happened to pick.
function handlePhotoUpload(input, avatarId) {
  const file = input.files[0]
  if (!file) return
  input.value = '' // so re-selecting the exact same file later still fires 'change'

  const reader = new FileReader()
  reader.onload = e => openPhotoCropModal(e.target.result, avatarId)
  reader.readAsDataURL(file)
}
window.handlePhotoUpload = handlePhotoUpload

function _applyAvatarPhoto(avatarId, src) {
  const imgTag = `<img src="${src}" alt="Profile photo" style="width:100%;height:100%;object-fit:cover;border-radius:50%;display:block">`
  const el = document.getElementById(avatarId)
  if (el) { el.style.cssText += ';background:transparent;padding:0'; el.innerHTML = imgTag }
  const sidebar = document.querySelector('.sidebar-profile-avatar')
  if (sidebar) { sidebar.style.cssText += ';background:transparent;padding:0'; sidebar.innerHTML = imgTag }
}

// ── Photo crop modal ────────────────────────────────────────────────
// Matches Facebook's own "Choose profile picture" dialog: the whole photo
// stays visible inside a rectangular frame, dimmed everywhere except a
// bright circular cutout showing exactly what will be saved — rather than
// hard-clipping to a small circle and hiding the rest of the photo, which
// gives no sense of what's just outside the crop.
//
// _crop holds the live state of whichever session is open: the loaded
// Image, its natural size, the "fit" scale (shorter edge exactly covers the
// *frame*, same framing object-fit:cover would pick by default), the
// user's zoom multiplier on top of that, and the current pan offset (the
// image's rendered top-left corner, in frame pixels). Dragging/zooming only
// mutates offsetX/offsetY/zoom and re-renders via a CSS transform — the
// actual pixel crop happens once, on Save, via a single canvas.drawImage().
let _crop = null
const CROP_OUT      = 480   // exported square image size, in px — independent of on-screen size
const CROP_MAX_ZOOM = 3
const CROP_STEP_PX  = 12    // pan distance per arrow-key press
// .modal-overlay's 20px side padding + .modal-body's 24px side padding
// (global.css) eat 88px of horizontal space no matter the screen size, so a
// fixed frame size would get clipped by modal-box's overflow:hidden on any
// phone narrower than ~470px logical pixels (most phones, portrait).
// Sized against the actual viewport instead (88px chrome + a small safety
// margin), with 360 as the desktop/tablet cap and a floor so it's never
// unusably tiny.
function _cropFrameSize() {
  return Math.max(220, Math.min(360, window.innerWidth - 108))
}

function openPhotoCropModal(dataUrl, avatarId) {
  const img = new Image()
  img.onload = () => {
    const frame     = _cropFrameSize()
    const circle    = Math.round(frame * 0.8)   // visible crop circle, inset within the frame
    const inset     = (frame - circle) / 2
    const baseScale = frame / Math.min(img.naturalWidth, img.naturalHeight)
    _crop = {
      avatarId, img, frame, circle, inset, baseScale, zoom: 1, dragging: false, lastX: 0, lastY: 0,
      naturalW: img.naturalWidth, naturalH: img.naturalHeight,
      offsetX: (frame - img.naturalWidth  * baseScale) / 2,
      offsetY: (frame - img.naturalHeight * baseScale) / 2,
    }
    showModal(`
      <div class="modal-header">
        <div class="modal-title">${icon('camera','icon-sm')} Adjust Photo</div>
        <button class="modal-close" onclick="window.closeModal()">&times;</button>
      </div>
      <div class="modal-body" style="display:flex;flex-direction:column;align-items:center;gap:18px;padding-top:24px;padding-bottom:28px">
        <div id="crop-viewport" tabindex="0" style="width:${frame}px;height:${frame}px;border-radius:12px;overflow:hidden;position:relative;
             background:#1C1C1C;touch-action:none;cursor:grab;user-select:none;outline:none">
          <img id="crop-img" src="${dataUrl}" draggable="false" alt=""
               style="position:absolute;left:0;top:0;max-width:none;max-height:none;transform-origin:top left;pointer-events:none;user-select:none;-webkit-user-drag:none">
          <!-- The "hole": box-shadow with a huge spread dims everything outside
               this circle while leaving its own interior fully transparent —
               the standard spotlight/vignette trick, no image duplication needed. -->
          <div style="position:absolute;top:50%;left:50%;transform:translate(-50%,-50%);width:${circle}px;height:${circle}px;
               border-radius:50%;box-shadow:0 0 0 9999px rgba(0,0,0,.55);border:2px solid rgba(255,255,255,.9);pointer-events:none"></div>
          <div id="crop-tip" style="position:absolute;top:12px;left:50%;transform:translate(-50%,0);background:rgba(0,0,0,.65);color:#fff;
               font-size:.7rem;font-weight:600;padding:6px 12px;border-radius:999px;display:flex;align-items:center;gap:6px;
               pointer-events:none;white-space:nowrap;transition:opacity .2s">
            <svg viewBox="0 0 24 24" fill="none" stroke="#fff" stroke-width="2" stroke-linecap="round" stroke-linejoin="round" width="13" height="13">
              <polyline points="5 9 2 12 5 15"/><polyline points="9 5 12 2 15 5"/><polyline points="15 19 12 22 9 19"/><polyline points="19 9 22 12 19 15"/>
              <line x1="2" y1="12" x2="22" y2="12"/><line x1="12" y1="2" x2="12" y2="22"/>
            </svg>
            Drag or use arrow keys to reposition
          </div>
        </div>
        <div style="display:flex;align-items:center;gap:12px;width:100%;max-width:${frame}px">
          <svg viewBox="0 0 24 24" fill="none" stroke="#9CA3AF" stroke-width="2" stroke-linecap="round" width="16" height="16" style="flex-shrink:0">
            <circle cx="11" cy="11" r="8"/><line x1="21" y1="21" x2="16.65" y2="16.65"/><line x1="8" y1="11" x2="14" y2="11"/>
          </svg>
          <input type="range" id="crop-zoom" min="1" max="${CROP_MAX_ZOOM}" step="0.01" value="1" style="flex:1" oninput="window._cropZoomInput(this.value)">
          <svg viewBox="0 0 24 24" fill="none" stroke="#9CA3AF" stroke-width="2" stroke-linecap="round" width="18" height="18" style="flex-shrink:0">
            <circle cx="11" cy="11" r="8"/><line x1="21" y1="21" x2="16.65" y2="16.65"/><line x1="8" y1="11" x2="14" y2="11"/><line x1="11" y1="8" x2="11" y2="14"/>
          </svg>
        </div>
      </div>
      <div class="modal-footer">
        <button class="btn-secondary" onclick="window.closeModal()">Cancel</button>
        <button class="btn-primary" onclick="window.cropPhotoSave()">${icon('check','icon-sm')} Save Photo</button>
      </div>
    `)
    _cropRender()
    _cropAttachEvents()
  }
  img.src = dataUrl
}
window.openPhotoCropModal = openPhotoCropModal

// Once the user actually interacts (drag or arrow key), the "how to use
// this" tooltip has done its job — fade it out instead of leaving it
// permanently overlapping the photo.
function _cropDismissTip() {
  const tip = document.getElementById('crop-tip')
  if (tip) tip.style.opacity = '0'
}

function _cropClamp() {
  const c = _crop
  const scale = c.baseScale * c.zoom
  const w = c.naturalW * scale, h = c.naturalH * scale
  // Clamped against the full FRAME (not just the visible circle) so the
  // dimmed area is always real (if darkened) photo content, never empty
  // background — exactly how Facebook's own cropper behaves.
  c.offsetX = Math.min(0, Math.max(c.frame - w, c.offsetX))
  c.offsetY = Math.min(0, Math.max(c.frame - h, c.offsetY))
}

function _cropRender() {
  const c = _crop
  const el = document.getElementById('crop-img')
  if (!c || !el) return
  const scale = c.baseScale * c.zoom
  el.style.width     = (c.naturalW * scale) + 'px'
  el.style.height    = (c.naturalH * scale) + 'px'
  el.style.transform = `translate(${c.offsetX}px, ${c.offsetY}px)`
}

function _cropPan(dx, dy) {
  if (!_crop) return
  _crop.offsetX += dx
  _crop.offsetY += dy
  _cropClamp()
  _cropRender()
}

// Zooms so that the image point currently under (anchorX, anchorY) —
// viewport-local coordinates — stays exactly where it is on screen. The
// slider and wheel-zoom anchor on the frame's center; pinch-zoom anchors on
// the midpoint between the two fingers, so the photo zooms toward wherever
// you're actually pinching instead of always jumping to re-center.
function _cropZoomTo(newZoom, anchorX, anchorY) {
  const c = _crop
  if (!c) return
  newZoom = Math.min(CROP_MAX_ZOOM, Math.max(1, newZoom))
  const oldScale = c.baseScale * c.zoom
  const newScale = c.baseScale * newZoom
  const ix = (anchorX - c.offsetX) / oldScale
  const iy = (anchorY - c.offsetY) / oldScale
  c.zoom    = newZoom
  c.offsetX = anchorX - ix * newScale
  c.offsetY = anchorY - iy * newScale
  _cropClamp()
  _cropRender()
}

function _cropZoomInput(val) {
  if (!_crop) return
  _cropDismissTip()
  _cropZoomTo(parseFloat(val), _crop.frame / 2, _crop.frame / 2)
}
window._cropZoomInput = _cropZoomInput

function _cropAttachEvents() {
  const vp = document.getElementById('crop-viewport')
  if (!vp) return
  // Tracks every currently-down pointer by id so two simultaneous touches
  // can be told apart from a single drag — needed for pinch-to-zoom, since
  // Pointer Events report each finger as its own independent pointer.
  const pointers = new Map()
  let pinchStartDist = 0
  let pinchStartZoom = 1
  const dist = (a, b) => Math.hypot(a.x - b.x, a.y - b.y)

  // Pointer Capture means move/up keep firing on this exact element even
  // once the finger/cursor drags outside the frame — no window-level
  // listeners to remember to clean up when the modal closes. Attached to
  // the frame itself (not just the circle) so dragging works from anywhere
  // on the visible photo, dimmed area included — same as Facebook.
  vp.addEventListener('pointerdown', e => {
    if (!_crop) return
    _cropDismissTip()
    pointers.set(e.pointerId, { x: e.clientX, y: e.clientY })
    vp.setPointerCapture(e.pointerId)
    if (pointers.size === 2) {
      // Second finger just landed — switch from pan to pinch-zoom.
      _crop.dragging = false
      const [a, b] = [...pointers.values()]
      pinchStartDist = dist(a, b)
      pinchStartZoom = _crop.zoom
    } else if (pointers.size === 1) {
      _crop.dragging = true
      _crop.lastX = e.clientX
      _crop.lastY = e.clientY
      vp.style.cursor = 'grabbing'
    }
  })
  vp.addEventListener('pointermove', e => {
    if (!_crop || !pointers.has(e.pointerId)) return
    pointers.set(e.pointerId, { x: e.clientX, y: e.clientY })

    if (pointers.size === 2) {
      const [a, b] = [...pointers.values()]
      const newDist = dist(a, b)
      if (pinchStartDist > 0) {
        const newZoom = pinchStartZoom * (newDist / pinchStartDist)
        const rect = vp.getBoundingClientRect()
        _cropZoomTo(newZoom, (a.x + b.x) / 2 - rect.left, (a.y + b.y) / 2 - rect.top)
        const zoomInput = document.getElementById('crop-zoom')
        if (zoomInput) zoomInput.value = _crop.zoom
      }
      return
    }
    if (_crop.dragging) {
      _cropPan(e.clientX - _crop.lastX, e.clientY - _crop.lastY)
      _crop.lastX = e.clientX
      _crop.lastY = e.clientY
    }
  })
  function releasePointer(e) {
    pointers.delete(e.pointerId)
    if (pointers.size === 1) {
      // Dropped from two fingers back to one — resume panning from
      // wherever that remaining finger already is, instead of jumping.
      const [remaining] = [...pointers.values()]
      if (_crop) { _crop.dragging = true; _crop.lastX = remaining.x; _crop.lastY = remaining.y }
    } else if (pointers.size === 0) {
      if (_crop) _crop.dragging = false
      vp.style.cursor = 'grab'
    }
  }
  vp.addEventListener('pointerup', releasePointer)
  vp.addEventListener('pointercancel', releasePointer)
  // Arrow keys — the tooltip actually says this works, so it needs to.
  vp.addEventListener('keydown', e => {
    const steps = { ArrowLeft: [CROP_STEP_PX,0], ArrowRight: [-CROP_STEP_PX,0], ArrowUp: [0,CROP_STEP_PX], ArrowDown: [0,-CROP_STEP_PX] }
    if (!steps[e.key]) return
    e.preventDefault()
    _cropDismissTip()
    _cropPan(...steps[e.key])
  })
  // Scroll-wheel zoom — a nice-to-have for desktop/trackpad users on top of
  // the slider and pinch, which cover touch.
  vp.addEventListener('wheel', e => {
    e.preventDefault()
    const zoomInput = document.getElementById('crop-zoom')
    if (!zoomInput || !_crop) return
    const next = Math.min(CROP_MAX_ZOOM, Math.max(1, _crop.zoom + (e.deltaY > 0 ? -0.05 : 0.05)))
    zoomInput.value = next
    _cropZoomInput(next)
  }, { passive: false })
}

function cropPhotoSave() {
  const c = _crop
  if (!c) return
  const scale   = c.baseScale * c.zoom
  // The exported image is exactly what's inside the circle, not the whole
  // frame — c.inset shifts the source rect from the frame's top-left to the
  // circle's top-left before converting into original-image pixels.
  const srcX    = (c.inset - c.offsetX) / scale
  const srcY    = (c.inset - c.offsetY) / scale
  const srcSize = c.circle / scale
  const canvas  = document.createElement('canvas')
  canvas.width  = CROP_OUT
  canvas.height = CROP_OUT
  canvas.getContext('2d').drawImage(c.img, srcX, srcY, srcSize, srcSize, 0, 0, CROP_OUT, CROP_OUT)
  canvas.toBlob(blob => {
    if (!blob) { toast('Could not process that image. Please try again.', 'error'); return }
    _uploadPhotoBlob(blob, c.avatarId)
  }, 'image/jpeg', 0.92)
}
window.cropPhotoSave = cropPhotoSave

function _uploadPhotoBlob(blob, avatarId) {
  const previewUrl = URL.createObjectURL(blob)
  _applyAvatarPhoto(avatarId, previewUrl)
  closeModal()

  const form = new FormData()
  form.append('photo', blob, 'photo.jpg')

  fetch('api/users/upload_photo.php', { method: 'POST', body: form })
    .then(r => r.json())
    .then(d => {
      URL.revokeObjectURL(previewUrl)
      if (!d.success) { toast(d.message || 'Upload failed.', 'error'); return }

      if (state.user) {
        state.user.photoUrl = d.photoUrl
        // Keep the in-memory role array (used by My Schedule, doctor lists,
        // patient lists, etc.) in sync so the new photo shows up everywhere
        // without needing a full re-login.
        const roleArray = { patient: patients, doctor: doctors, staff: staff, admin: admins }[state.role]
        const entry = roleArray && roleArray.find(u => u.id === state.user.id)
        if (entry) entry.photoUrl = d.photoUrl
      }

      // Swap the preview src to the permanent server path
      _applyAvatarPhoto(avatarId, d.photoUrl)
      toast('Profile photo updated.', 'success')
    })
    .catch(() => { URL.revokeObjectURL(previewUrl); toast('Upload failed. Please try again.', 'error') })
}

/**
 * handleLogoUpload — same idea but for the clinic logo preview in
 * the Admin › Appearance settings panel. Uploads to the server so the
 * new logo persists and syncs everywhere (dashboard + public pages).
 */
async function handleLogoUpload(input, previewId) {
  const file = input.files[0]
  if (!file) return

  const formData = new FormData()
  formData.append('logo', file)

  try {
    const r = await fetch('api/clinic/upload_logo.php', { method: 'POST', body: formData })
    const d = await r.json()
    if (!d.success) { toast(d.message || 'Could not upload logo.', 'error'); return }
    clinicInfo.logoUrl = d.logoUrl          // clean URL for DB/form state
    const bust = d.logoUrl + '?t=' + Date.now()
    window._clinicLogoUrl = bust            // busted URL so renderTopbar() always shows fresh image
    const el = document.getElementById(previewId)
    if (el) { el.src = bust; el.style.opacity = '1' }
    syncLogoImages(bust)
    renderSidebar()
    renderTopbar()
    // Notify other open tabs (index.html, public pages) via storage event
    localStorage.setItem('_canaopticalclinic_logo_url', bust)
    toast('Logo updated.', 'success')
  } catch (_) {
    toast('Network error — could not upload logo.', 'error')
  }
}
window.handleLogoUpload = handleLogoUpload

async function handleHeroUpload(input) {
  const file = input.files[0]
  if (!file) return

  const formData = new FormData()
  formData.append('hero', file)

  try {
    const r = await fetch('api/clinic/upload_hero.php', { method: 'POST', body: formData })
    const d = await r.json()
    if (!d.success) { toast(d.message || 'Could not upload hero image.', 'error'); return }
    clinicInfo.heroUrl = d.heroUrl
    const bust = d.heroUrl + '?t=' + Date.now()
    const el = document.getElementById('ci-hero-preview')
    if (el) el.src = bust
    toast('Hero background updated.', 'success')
  } catch (_) {
    toast('Network error — could not upload hero image.', 'error')
  }
}
window.handleHeroUpload = handleHeroUpload

async function handleVideoUpload(input) {
  const file = input.files[0]
  if (!file) return

  const formData = new FormData()
  formData.append('video', file)

  try {
    const r = await fetch('api/clinic/upload_video.php', { method: 'POST', body: formData })
    // A file that blows past the server's post_max_size/upload_max_filesize
    // never reaches our PHP script's own JSON error handling — PHP/Apache
    // reject it first and hand back a plain-text/HTML response (or reset
    // the connection outright), which r.json() can't parse. Surface that
    // distinctly instead of a generic "network error" that hides the
    // actual, fixable cause.
    if (!r.ok) {
      toast(r.status === 413
        ? 'Video is too large for this server\'s upload limit.'
        : `Upload failed (server error ${r.status}).`, 'error')
      return
    }
    const d = await r.json()
    if (!d.success) { toast(d.message || 'Could not upload video.', 'error'); return }
    clinicInfo.videoUrl = d.videoUrl + '?t=' + Date.now()
    toast('Clinic video updated.', 'success')
    renderPage() // swaps the empty-slot icon for a real preview, button label, and Remove option
  } catch (_) {
    toast('Network error, or the video is too large for this server\'s upload limit.', 'error')
  }
}
window.handleVideoUpload = handleVideoUpload

async function removeClinicVideo() {
  try {
    const r = await fetch('api/clinic/upload_video.php', { method: 'DELETE' })
    const d = await r.json()
    if (!d.success) { toast(d.message || 'Could not remove video.', 'error'); return }
    clinicInfo.videoUrl = null
    toast('Clinic video removed.', 'success')
    renderPage()
  } catch (_) {
    toast('Network error — could not remove video.', 'error')
  }
}
window.removeClinicVideo = removeClinicVideo

// ════════════════════════════════════════════════════════════════
//  ABOUT GALLERY — admin management
// ════════════════════════════════════════════════════════════════

// ── Gallery multi-select ─────────────────────────────────────────
const _galSelected = new Set();
let _galSelMode = false;

// Inject CSS once for checkbox animations
(function () {
  if (document.getElementById('_gal-sel-css')) return;
  const s = document.createElement('style');
  s.id = '_gal-sel-css';
  s.textContent = `
    @keyframes _galPop{0%{transform:scale(.4);opacity:0}65%{transform:scale(1.18)}100%{transform:scale(1);opacity:1}}
    @keyframes _galMark{0%{stroke-dashoffset:20}100%{stroke-dashoffset:0}}
    .gal-tile{transition:box-shadow .18s ease!important}
    .gal-chk{transition:opacity .18s ease,transform .22s cubic-bezier(.34,1.56,.64,1),background .15s,border-color .15s!important}
    .gal-chk-visible{opacity:1!important;transform:scale(1)!important;pointer-events:auto!important}
    .gal-chk-mark polyline{stroke-dasharray:20;animation:_galMark .22s ease forwards}
    .gal-del-btn:hover{background:rgba(220,38,38,.8)!important}
  `;
  document.head.appendChild(s);
})();

function _galleryApplySelMode(grid) {
  grid = grid || document.getElementById('gallery-admin-grid');
  if (!grid) return;
  grid.querySelectorAll('.gal-grip').forEach(g => { g.style.opacity = _galSelMode ? '0' : '.75'; g.style.pointerEvents = 'none'; });
  grid.querySelectorAll('.gal-del-btn').forEach(b => { b.style.opacity = _galSelMode ? '0' : '1'; b.style.pointerEvents = _galSelMode ? 'none' : ''; });
  grid.querySelectorAll('.gal-chk').forEach(c => {
    if (_galSelMode) c.classList.add('gal-chk-visible'); else c.classList.remove('gal-chk-visible');
  });
  grid.querySelectorAll('.gal-tile').forEach(t => {
    t.style.cursor = _galSelMode ? 'pointer' : 'grab';
    t.setAttribute('draggable', _galSelMode ? 'false' : 'true');
  });
  const btn = document.getElementById('gallery-sel-btn');
  if (btn) {
    btn.innerHTML = _galSelMode
      ? `<svg width="14" height="14" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2.5" stroke-linecap="round" stroke-linejoin="round"><line x1="18" y1="6" x2="6" y2="18"/><line x1="6" y1="6" x2="18" y2="18"/></svg>Cancel`
      : `<svg width="14" height="14" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2.5" stroke-linecap="round" stroke-linejoin="round"><path d="M9 11l3 3L22 4"/><path d="M21 12v7a2 2 0 01-2 2H5a2 2 0 01-2-2V5a2 2 0 012-2h11"/></svg>Select`;
    btn.style.color       = _galSelMode ? '#DC2626' : '#6B7280';
    btn.style.borderColor = _galSelMode ? '#FECACA' : '#E5E7EB';
    btn.style.background  = _galSelMode ? '#FEF2F2' : '';
  }
}

function galleryToggleSelMode() {
  _galSelMode = !_galSelMode;
  if (!_galSelMode) { _galSelected.clear(); }
  _galleryUpdateSelBar();
  _galleryApplySelMode();
}

function galleryExitSelMode() {
  _galSelMode = false;
  _galSelected.clear();
  _galleryUpdateSelBar();
  _galleryApplySelMode();
}

function _galleryUpdateSelBar() {
  const selBar   = document.getElementById('gallery-sel-bar');
  const selCount = document.getElementById('gallery-sel-count');
  const delBtn   = document.getElementById('gallery-sel-delete');
  if (!selBar) return;
  selBar.style.display = _galSelMode ? 'flex' : 'none';
  const n = _galSelected.size;
  if (selCount) selCount.textContent = n === 0 ? 'No photos selected' : `${n} photo${n !== 1 ? 's' : ''} selected`;
  if (delBtn) { delBtn.disabled = n === 0; delBtn.style.opacity = n === 0 ? '.4' : '1'; delBtn.style.cursor = n === 0 ? 'not-allowed' : 'pointer'; }
  const grid = document.getElementById('gallery-admin-grid');
  const selAllBtn = document.getElementById('gallery-sel-all-btn');
  if (selAllBtn && grid) {
    const total = grid.querySelectorAll('.gal-tile').length;
    const allSel = total > 0 && n >= total;
    selAllBtn.textContent = allSel ? 'Unselect all' : 'Select all';
  }
  if (!grid) return;
  grid.querySelectorAll('.gal-tile').forEach(tile => {
    const id  = parseInt(tile.dataset.id, 10);
    const sel = _galSelected.has(id);
    tile.style.boxShadow = sel ? 'inset 0 0 0 3px #F59E0B' : '';
    const chk = tile.querySelector('.gal-chk');
    if (!chk) return;
    const wasSel = chk.dataset.sel === '1';
    if (sel === wasSel) return; // state unchanged — skip all DOM work
    chk.dataset.sel = sel ? '1' : '0';
    chk.style.background  = sel ? '#E8760A' : 'rgba(17,17,17,.45)';
    chk.style.borderColor = sel ? '#FCD34D' : 'rgba(255,255,255,.8)';
    chk.innerHTML = sel
      ? `<svg class="gal-chk-mark" width="11" height="11" viewBox="0 0 12 12" fill="none" stroke="#fff" stroke-width="2.8" stroke-linecap="round" stroke-linejoin="round"><polyline points="2 6.5 5 9.5 10 3"/></svg>`
      : '';
    if (sel) {
      chk.style.transform = 'scale(1.22)';
      setTimeout(() => { if (chk) chk.style.transform = ''; }, 160);
    } else {
      chk.style.transform = '';
    }
  });
}

function galleryToggleSelect(e, id) {
  e.stopPropagation();
  if (!_galSelMode) return;
  if (_galSelected.has(id)) _galSelected.delete(id); else _galSelected.add(id);
  _galleryUpdateSelBar();
}

function gallerySelectAll() {
  const grid = document.getElementById('gallery-admin-grid');
  if (!grid) return;
  const tiles = grid.querySelectorAll('.gal-tile');
  const allSel = tiles.length > 0 && [...tiles].every(t => _galSelected.has(parseInt(t.dataset.id, 10)));
  if (allSel) {
    _galSelected.clear();
  } else {
    tiles.forEach(t => _galSelected.add(parseInt(t.dataset.id, 10)));
  }
  _galleryUpdateSelBar();
}

async function galleryDeleteSelected() {
  const ids = [..._galSelected];
  if (!ids.length) return;
  showConfirm({
    title: 'Delete Selected Photos',
    message: `Permanently delete ${ids.length} selected photo${ids.length !== 1 ? 's' : ''} from the gallery? This cannot be undone.`,
    confirmText: `Delete ${ids.length} Photo${ids.length !== 1 ? 's' : ''}`,
    danger: true,
    onConfirm: async () => {
      try {
        await Promise.all(ids.map(id =>
          fetch('api/clinic/gallery.php', {
            method: 'DELETE', headers: { 'Content-Type': 'application/json' },
            body: JSON.stringify({ id })
          })
        ));
        toast(`${ids.length} photo${ids.length !== 1 ? 's' : ''} deleted.`, 'success');
        _galSelMode = false;
        _galSelected.clear();
        loadGalleryAdmin();
      } catch (_) { toast('Network error — could not delete photos.', 'error'); }
    }
  });
}

// ════════════════════════════════════════════════════════════════
//  SERVICES ADMIN — Gallery-style drag/select/delete grid
// ════════════════════════════════════════════════════════════════
var _svcSelMode = false
var _svcSelected = new Set()

function loadServicesAdmin() {
  const grid = document.getElementById('services-admin-grid')
  if (!grid) return

  if (!CLINIC_SERVICES.length) {
    grid.innerHTML = `
      <div style="grid-column:1/-1;display:flex;flex-direction:column;align-items:center;justify-content:center;padding:32px 16px;gap:12px;text-align:center">
        <div style="width:56px;height:56px;border-radius:14px;background:#FEF3C7;display:flex;align-items:center;justify-content:center">
          ${icon('package','icon')}
        </div>
        <div style="font-size:.85rem;font-weight:700;color:#374151">No services yet</div>
        <div style="font-size:.75rem;color:#9CA3AF">Use the form above to add your first service.</div>
      </div>`
    _svcSelMode = false; _svcSelected.clear()
    const sb = document.getElementById('svc-sel-bar'); if (sb) sb.style.display = 'none'
    return
  }

  grid.innerHTML = CLINIC_SERVICES.map(s => `
    <div class="svc-tile" data-id="${s.id}" id="svc-item-${s.id}" draggable="true"
         onclick="window.svcToggleSelect(event,${s.id})"
         style="position:relative;border-radius:10px;border:1.5px solid #E5E7EB;background:#fff;
                cursor:grab;transition:box-shadow .18s,opacity .15s;padding:14px 14px 10px;
                display:flex;flex-direction:column;gap:8px;user-select:none;-webkit-tap-highlight-color:transparent">
      <div class="svc-grip" style="position:absolute;top:7px;left:7px;width:20px;height:20px;display:flex;align-items:center;justify-content:center;opacity:.45;pointer-events:none;transition:opacity .18s">
        <svg width="10" height="10" viewBox="0 0 10 10" fill="#6B7280">
          <circle cx="3" cy="2" r="1"/><circle cx="7" cy="2" r="1"/>
          <circle cx="3" cy="5" r="1"/><circle cx="7" cy="5" r="1"/>
          <circle cx="3" cy="8" r="1"/><circle cx="7" cy="8" r="1"/>
        </svg>
      </div>
      <div class="svc-chk" data-sel="0" onclick="event.stopPropagation();window.svcToggleSelect(event,${s.id})"
           style="position:absolute;top:7px;left:7px;width:20px;height:20px;border-radius:50%;
                  background:rgba(17,17,17,.4);border:2px solid rgba(255,255,255,.85);
                  cursor:pointer;z-index:4;display:flex;align-items:center;justify-content:center;
                  opacity:0;transform:scale(0.5);pointer-events:none;transition:opacity .18s,transform .18s;
                  box-shadow:0 2px 6px rgba(0,0,0,.2)"></div>
      ${s.status === 'inactive' ? `<span style="position:absolute;top:7px;right:7px;font-size:.6rem;font-weight:700;background:#F3F4F6;color:#9CA3AF;padding:2px 7px;border-radius:20px">Inactive</span>` : ''}
      <!-- margin-top clears the grip/checkbox corner badge above (top:7px,
           20px tall, so it reaches y=27 from the tile's edge) — this box's
           old 4px margin (18px effective top, with 14px padding) put its
           own top-left corner right underneath it. -->
      <div style="width:38px;height:38px;border-radius:10px;background:#FFF0DC;display:flex;align-items:center;justify-content:center;color:#E8760A;flex-shrink:0;margin-top:16px">
        ${icon(s.icon || 'eye', 'icon-sm')}
      </div>
      <div style="font-size:.8rem;font-weight:700;color:#1C1C1C;line-height:1.3">${s.name}</div>
      <div style="display:flex;gap:4px;flex-wrap:wrap">
        <span style="font-size:.6rem;font-weight:700;padding:2px 7px;border-radius:20px;${s.bookable ? 'background:#ECFDF5;color:#059669' : 'background:#F3F4F6;color:#6B7280'}">${s.bookable ? 'Bookable' : 'Display Only'}</span>
        ${s.bookable && !s.patientVisible ? `<span style="font-size:.6rem;font-weight:700;padding:2px 7px;border-radius:20px;background:#FFF7ED;color:#C2410C">Staff Only</span>` : ''}
      </div>
      <div style="font-size:.7rem;color:#6B7280;line-height:1.45;display:-webkit-box;-webkit-line-clamp:2;-webkit-box-orient:vertical;overflow:hidden;flex:1">${s.description || ''}</div>
      <div class="svc-actions" style="display:flex;gap:4px;margin-top:4px;transition:opacity .15s">
        <button class="btn-icon" title="Edit" onclick="event.stopPropagation();window.editServiceModal(${s.id})"
                style="font-size:.7rem;padding:4px 8px;height:auto">${icon('edit','icon-sm')}</button>
        <button class="btn-icon" title="Archive" onclick="event.stopPropagation();window.archiveServiceConfirm(${s.id},'${s.name.replace(/'/g,"\\'")}' )"
                style="font-size:.7rem;padding:4px 8px;height:auto;color:#D97706;border-color:#FEF3C7">${icon('archive','icon-sm')}</button>
      </div>
    </div>`).join('')

  _svcSetupDrag(grid)
  if (_svcSelMode) _svcApplySelMode(grid)

  // Selection bar
  let selBar = document.getElementById('svc-sel-bar')
  if (!selBar) {
    selBar = document.createElement('div')
    selBar.id = 'svc-sel-bar'
    grid.after(selBar)
  }
  selBar.style.cssText = 'display:none;align-items:center;gap:8px;padding:10px 12px;margin-top:10px;background:#FFF8F0;border-radius:10px;border:1px solid #FEE0B4;flex-wrap:wrap'
  selBar.innerHTML = `
    <span id="svc-sel-count" style="font-size:.75rem;font-weight:600;color:#92400E;flex:1;min-width:0"></span>
    <button id="svc-sel-all-btn" onclick="window.svcSelectAll()"
            style="font-size:.72rem;font-weight:500;color:#D97706;background:none;border:1.5px solid #FDE68A;border-radius:6px;padding:4px 10px;cursor:pointer;font-family:inherit;transition:background .12s"
            onmouseover="this.style.background='#FEF3C7'" onmouseout="this.style.background='none'">Select all</button>
    <button id="svc-sel-delete" onclick="window.svcDeleteSelected()"
            style="font-size:.72rem;gap:5px;display:inline-flex;align-items:center;padding:5px 12px;border-radius:7px;border:none;cursor:pointer;font-family:inherit;font-weight:500;background:#3B82F6;color:#fff;transition:background .15s"
            onmouseover="this.style.background='#2563EB'" onmouseout="this.style.background='#3B82F6'">
      ${icon('archive','icon-sm')} Archive selected
    </button>`

  const liveIds = new Set(CLINIC_SERVICES.map(s => s.id))
  ;[..._svcSelected].forEach(id => { if (!liveIds.has(id)) _svcSelected.delete(id) })
  _svcUpdateSelBar()

  const countEl = document.getElementById('svc-count')
  if (countEl) countEl.textContent = `${CLINIC_SERVICES.length} service${CLINIC_SERVICES.length !== 1 ? 's' : ''}`
}

function _svcSetupDrag(grid) {
  let dragging = null
  grid.addEventListener('dragstart', e => {
    const tile = e.target.closest('.svc-tile')
    if (!tile) return
    dragging = tile
    e.dataTransfer.effectAllowed = 'move'
    setTimeout(() => { if (dragging) dragging.style.opacity = '0.35' }, 0)
  })
  grid.addEventListener('dragend', () => {
    if (dragging) { dragging.style.opacity = ''; dragging = null }
    grid.querySelectorAll('.svc-tile').forEach(t => t.style.outline = '')
  })
  grid.addEventListener('dragover', e => {
    e.preventDefault()
    const tile = e.target.closest('.svc-tile')
    grid.querySelectorAll('.svc-tile').forEach(t => t.style.outline = '')
    if (tile && tile !== dragging) tile.style.outline = '2px solid #F59E0B'
  })
  grid.addEventListener('drop', e => {
    e.preventDefault()
    const target = e.target.closest('.svc-tile')
    if (!target || target === dragging || !dragging) return
    const mid = target.getBoundingClientRect().left + target.getBoundingClientRect().width / 2
    grid.insertBefore(dragging, e.clientX < mid ? target : target.nextSibling)
    target.style.outline = ''
    _svcSaveOrder(grid)
  })
  // Touch drag
  let touchTimer = null, touchGhost = null, touchTile = null, touchActive = false
  grid.addEventListener('touchstart', e => {
    const tile = e.target.closest('.svc-tile')
    if (!tile) return
    touchTile = tile; touchActive = false
    touchTimer = setTimeout(() => {
      touchActive = true
      const rect = tile.getBoundingClientRect()
      touchGhost = tile.cloneNode(true)
      touchGhost.style.cssText = `position:fixed;width:${rect.width}px;height:${rect.height}px;top:${rect.top}px;left:${rect.left}px;opacity:.75;pointer-events:none;z-index:9999;border-radius:10px;overflow:hidden;box-shadow:0 8px 24px rgba(0,0,0,.2);transform:scale(1.04);transition:transform .1s`
      document.body.appendChild(touchGhost)
      tile.style.opacity = '0.35'
    }, 260)
  }, { passive: true })
  grid.addEventListener('touchmove', e => {
    if (!touchActive || !touchGhost) return
    if (e.cancelable) e.preventDefault()
    const t = e.touches[0]
    touchGhost.style.left = (t.clientX - parseFloat(touchGhost.style.width) / 2) + 'px'
    touchGhost.style.top  = (t.clientY - parseFloat(touchGhost.style.height) / 2) + 'px'
    const el = document.elementFromPoint(t.clientX, t.clientY)
    const over = el && el.closest('.svc-tile')
    grid.querySelectorAll('.svc-tile').forEach(ti => ti.style.outline = '')
    if (over && over !== touchTile) over.style.outline = '2px solid #F59E0B'
  }, { passive: false })
  grid.addEventListener('touchend', e => {
    clearTimeout(touchTimer)
    if (!touchActive) { touchTile = null; return }
    if (touchGhost) { touchGhost.remove(); touchGhost = null }
    if (touchTile)  { touchTile.style.opacity = '' }
    grid.querySelectorAll('.svc-tile').forEach(ti => ti.style.outline = '')
    const t = e.changedTouches[0]
    const el = document.elementFromPoint(t.clientX, t.clientY)
    const target = el && el.closest('.svc-tile')
    if (target && target !== touchTile && touchTile) {
      const rect = target.getBoundingClientRect()
      grid.insertBefore(touchTile, t.clientX < rect.left + rect.width / 2 ? target : target.nextSibling)
      _svcSaveOrder(grid)
    }
    touchActive = false; touchTile = null
  }, { passive: true })
  grid.addEventListener('touchcancel', () => {
    clearTimeout(touchTimer)
    if (touchGhost) { touchGhost.remove(); touchGhost = null }
    if (touchTile)  { touchTile.style.opacity = ''; touchTile.style.outline = '' }
    touchActive = false; touchTile = null
  }, { passive: true })
}

async function _svcSaveOrder(grid) {
  const order = [...grid.querySelectorAll('.svc-tile')].map(t => parseInt(t.dataset.id, 10))
  order.forEach((id, i) => {
    const idx = CLINIC_SERVICES.findIndex(s => s.id === id)
    if (idx !== -1) CLINIC_SERVICES[idx].sortOrder = i
  })
  CLINIC_SERVICES.sort((a, b) => (order.indexOf(a.id) - order.indexOf(b.id)))
  try {
    await fetch('api/services/reorder.php', {
      method: 'POST', headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({ order })
    })
  } catch (_) {}
}

function _svcApplySelMode(grid) {
  grid = grid || document.getElementById('services-admin-grid')
  if (!grid) return
  grid.querySelectorAll('.svc-grip').forEach(g => { g.style.opacity = _svcSelMode ? '0' : '.45'; g.style.pointerEvents = 'none' })
  grid.querySelectorAll('.svc-actions').forEach(a => { a.style.opacity = _svcSelMode ? '0' : '1'; a.style.pointerEvents = _svcSelMode ? 'none' : '' })
  grid.querySelectorAll('.svc-chk').forEach(c => {
    if (_svcSelMode) { c.style.opacity = '1'; c.style.transform = 'scale(1)'; c.style.pointerEvents = '' }
    else             { c.style.opacity = '0'; c.style.transform = 'scale(0.5)'; c.style.pointerEvents = 'none' }
  })
  grid.querySelectorAll('.svc-tile').forEach(t => {
    t.style.cursor = _svcSelMode ? 'pointer' : 'grab'
    t.setAttribute('draggable', _svcSelMode ? 'false' : 'true')
  })
  const btn = document.getElementById('svc-sel-btn')
  if (btn) {
    btn.innerHTML = _svcSelMode
      ? `${icon('x','icon-sm')} Cancel`
      : `${icon('check-circle','icon-sm')} Select`
    btn.style.color       = _svcSelMode ? '#DC2626' : '#6B7280'
    btn.style.borderColor = _svcSelMode ? '#FECACA' : '#E5E7EB'
    btn.style.background  = _svcSelMode ? '#FEF2F2' : ''
  }
}

function _svcUpdateSelBar() {
  const selBar   = document.getElementById('svc-sel-bar')
  const selCount = document.getElementById('svc-sel-count')
  const delBtn   = document.getElementById('svc-sel-delete')
  if (!selBar) return
  selBar.style.display = _svcSelMode ? 'flex' : 'none'
  const n = _svcSelected.size
  if (selCount) selCount.textContent = n === 0 ? 'No services selected' : `${n} service${n !== 1 ? 's' : ''} selected`
  if (delBtn) { delBtn.disabled = n === 0; delBtn.style.opacity = n === 0 ? '.4' : '1'; delBtn.style.cursor = n === 0 ? 'not-allowed' : 'pointer' }
  const grid = document.getElementById('services-admin-grid')
  const selAllBtn = document.getElementById('svc-sel-all-btn')
  if (selAllBtn && grid) {
    const total = grid.querySelectorAll('.svc-tile').length
    selAllBtn.textContent = (total > 0 && n >= total) ? 'Unselect all' : 'Select all'
  }
  if (!grid) return
  grid.querySelectorAll('.svc-tile').forEach(tile => {
    const id  = parseInt(tile.dataset.id, 10)
    const sel = _svcSelected.has(id)
    tile.style.boxShadow = sel ? 'inset 0 0 0 3px #F59E0B' : ''
    const chk = tile.querySelector('.svc-chk')
    if (!chk) return
    const wasSel = chk.dataset.sel === '1'
    if (sel === wasSel) return
    chk.dataset.sel = sel ? '1' : '0'
    chk.style.background  = sel ? '#E8760A' : 'rgba(17,17,17,.4)'
    chk.style.borderColor = sel ? '#FCD34D' : 'rgba(255,255,255,.85)'
    chk.innerHTML = sel ? `<svg width="9" height="9" viewBox="0 0 12 12" fill="none" stroke="#fff" stroke-width="2.8" stroke-linecap="round" stroke-linejoin="round"><polyline points="2 6.5 5 9.5 10 3"/></svg>` : ''
  })
}

function svcToggleSelMode() {
  _svcSelMode = !_svcSelMode
  if (!_svcSelMode) _svcSelected.clear()
  _svcUpdateSelBar()
  _svcApplySelMode()
}

function svcToggleSelect(e, id) {
  e.stopPropagation()
  if (!_svcSelMode) return
  if (_svcSelected.has(id)) _svcSelected.delete(id); else _svcSelected.add(id)
  _svcUpdateSelBar()
}

function svcSelectAll() {
  const grid = document.getElementById('services-admin-grid')
  if (!grid) return
  const tiles = grid.querySelectorAll('.svc-tile')
  const allSel = tiles.length > 0 && [...tiles].every(t => _svcSelected.has(parseInt(t.dataset.id, 10)))
  if (allSel) { _svcSelected.clear() } else { tiles.forEach(t => _svcSelected.add(parseInt(t.dataset.id, 10))) }
  _svcUpdateSelBar()
}

async function svcDeleteSelected() {
  const ids = [..._svcSelected]
  if (!ids.length) return
  showConfirm({
    title: `Archive ${ids.length} service${ids.length !== 1 ? 's' : ''}?`,
    message: 'These services will be archived and removed from the public page. They can be restored from Settings > Archives.',
    confirmText: 'Archive',
    onConfirm: async () => {
      for (const id of ids) {
        const svc = CLINIC_SERVICES.find(s => s.id === id)
        if (!svc) continue
        try {
          await fetch('api/archive/create.php', {
            method: 'POST', headers: { 'Content-Type': 'application/json' },
            body: JSON.stringify({ profileId: id, type: 'Service', name: svc.name, reason: 'Bulk deleted from services admin', archivedBy: state.user.name })
          })
          const idx = CLINIC_SERVICES.findIndex(s => s.id === id)
          if (idx !== -1) CLINIC_SERVICES.splice(idx, 1)
        } catch (_) {}
      }
      _svcSelected.clear()
      _svcSelMode = false
      loadServicesAdmin()
      toast(`${ids.length} service${ids.length !== 1 ? 's' : ''} archived. Restore from Settings > Archives.`, 'success')
    }
  })
}

window.loadServicesAdmin  = loadServicesAdmin
window.svcToggleSelMode   = svcToggleSelMode
window.svcToggleSelect    = svcToggleSelect
window.svcSelectAll       = svcSelectAll
window.svcDeleteSelected  = svcDeleteSelected

// Persist current DOM order to the backend
async function _gallerySaveOrder(grid) {
  const order = [...grid.querySelectorAll('.gal-tile')].map(t => parseInt(t.dataset.id, 10));
  try {
    await fetch('api/clinic/gallery.php', {
      method: 'PATCH', headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({ order })
    });
  } catch (_) {}
}

// Wire drag-and-drop reordering on the grid (event delegation)
function _gallerySetupDrag(grid) {
  // ── Mouse drag (desktop) ────────────────────────────────────────
  let dragging = null;
  grid.addEventListener('dragstart', e => {
    const tile = e.target.closest('.gal-tile');
    if (!tile) return;
    dragging = tile;
    e.dataTransfer.effectAllowed = 'move';
    setTimeout(() => { if (dragging) dragging.style.opacity = '0.35'; }, 0);
  });
  grid.addEventListener('dragend', () => {
    if (dragging) { dragging.style.opacity = ''; dragging = null; }
    grid.querySelectorAll('.gal-tile').forEach(t => t.style.outline = '');
  });
  grid.addEventListener('dragover', e => {
    e.preventDefault();
    const tile = e.target.closest('.gal-tile');
    grid.querySelectorAll('.gal-tile').forEach(t => t.style.outline = '');
    if (tile && tile !== dragging) tile.style.outline = '2px solid #F59E0B';
  });
  grid.addEventListener('drop', e => {
    e.preventDefault();
    const target = e.target.closest('.gal-tile');
    if (!target || target === dragging || !dragging) return;
    const mid = target.getBoundingClientRect().left + target.getBoundingClientRect().width / 2;
    grid.insertBefore(dragging, e.clientX < mid ? target : target.nextSibling);
    target.style.outline = '';
    _gallerySaveOrder(grid);
  });

  // ── Touch drag (mobile) ─────────────────────────────────────────
  let touchTimer = null, touchGhost = null, touchTile = null, touchActive = false;

  grid.addEventListener('touchstart', e => {
    const tile = e.target.closest('.gal-tile');
    if (!tile) return;
    touchTile = tile;
    touchActive = false;
    touchTimer = setTimeout(() => {
      touchActive = true;
      const rect = tile.getBoundingClientRect();
      touchGhost = tile.cloneNode(true);
      touchGhost.style.cssText = `position:fixed;width:${rect.width}px;height:${rect.height}px;top:${rect.top}px;left:${rect.left}px;opacity:.75;pointer-events:none;z-index:9999;border-radius:8px;overflow:hidden;box-shadow:0 8px 24px rgba(0,0,0,.3);transform:scale(1.06);transition:transform .1s`;
      document.body.appendChild(touchGhost);
      tile.style.opacity = '0.35';
    }, 260);
  }, { passive: true });

  grid.addEventListener('touchmove', e => {
    if (!touchActive || !touchGhost) return;
    if (e.cancelable) e.preventDefault();
    const t = e.touches[0];
    touchGhost.style.left = (t.clientX - parseFloat(touchGhost.style.width) / 2) + 'px';
    touchGhost.style.top  = (t.clientY - parseFloat(touchGhost.style.height) / 2) + 'px';
    const el = document.elementFromPoint(t.clientX, t.clientY);
    const over = el && el.closest('.gal-tile');
    grid.querySelectorAll('.gal-tile').forEach(ti => ti.style.outline = '');
    if (over && over !== touchTile) over.style.outline = '2px solid #F59E0B';
  }, { passive: false });

  grid.addEventListener('touchend', e => {
    clearTimeout(touchTimer);
    if (!touchActive) { touchTile = null; return; }
    if (touchGhost) { touchGhost.remove(); touchGhost = null; }
    if (touchTile)  { touchTile.style.opacity = ''; }
    grid.querySelectorAll('.gal-tile').forEach(ti => ti.style.outline = '');
    const t = e.changedTouches[0];
    const el = document.elementFromPoint(t.clientX, t.clientY);
    const target = el && el.closest('.gal-tile');
    if (target && target !== touchTile && touchTile) {
      const rect = target.getBoundingClientRect();
      grid.insertBefore(touchTile, t.clientX < rect.left + rect.width / 2 ? target : target.nextSibling);
      _gallerySaveOrder(grid);
    }
    touchActive = false; touchTile = null;
  }, { passive: true });

  grid.addEventListener('touchcancel', () => {
    clearTimeout(touchTimer);
    if (touchGhost) { touchGhost.remove(); touchGhost = null; }
    if (touchTile)  { touchTile.style.opacity = ''; touchTile.style.outline = ''; }
    touchActive = false; touchTile = null;
  }, { passive: true });
}

async function loadGalleryAdmin() {
  const grid = document.getElementById('gallery-admin-grid');
  if (!grid) return;

  try {
    const d = await fetch('api/clinic/gallery.php').then(r => r.json());
    if (!d.success) {
      grid.innerHTML = '<div style="color:#EF4444;font-size:.78rem;grid-column:1/-1;text-align:center;padding:20px 0">Failed to load gallery.</div>';
      return;
    }

    // Enforce upload limit in the UI
    const maxPhotos = d.maxPhotos || null;
    const atLimit   = maxPhotos !== null && d.images.length >= maxPhotos;
    const uploadLabel = document.getElementById('gallery-upload-label');
    const typeHint    = document.getElementById('gallery-type-hint');
    const limitMsg    = document.getElementById('gallery-limit-msg');
    if (uploadLabel) uploadLabel.style.display = atLimit ? 'none' : '';
    if (typeHint)    typeHint.style.display    = atLimit ? 'none' : '';
    if (limitMsg)    limitMsg.style.display    = atLimit ? ''     : 'none';

    if (!d.images.length) {
      grid.innerHTML = `
        <div style="grid-column:1/-1;display:flex;flex-direction:column;align-items:center;justify-content:center;padding:32px 16px;gap:12px;text-align:center">
          <div style="width:64px;height:64px;border-radius:16px;background:#FEF3C7;display:flex;align-items:center;justify-content:center">
            <svg width="30" height="30" viewBox="0 0 24 24" fill="none" stroke="#D97706" stroke-width="1.6" stroke-linecap="round" stroke-linejoin="round">
              <rect x="3" y="3" width="18" height="18" rx="3"/>
              <circle cx="8.5" cy="8.5" r="1.5"/>
              <polyline points="21 15 16 10 5 21"/>
            </svg>
          </div>
          <div>
            <div style="font-size:.85rem;font-weight:700;color:#374151;margin-bottom:4px">No photos yet</div>
            <div style="font-size:.75rem;color:#9CA3AF;line-height:1.5">Use <strong style="color:#D97706">Add Photo</strong> below<br>to start building your gallery.</div>
          </div>
        </div>`;
      _galSelMode = false;
      _galSelected.clear();
      _galleryApplySelMode();
      const _sb = document.getElementById('gallery-sel-bar');
      if (_sb) _sb.style.display = 'none';
      return;
    }

    grid.innerHTML = d.images.map(img => `
      <div class="gal-tile" data-id="${img.id}" id="gal-item-${img.id}" draggable="true"
           onclick="window.galleryToggleSelect(event,${img.id})"
           style="position:relative;border-radius:10px;overflow:hidden;aspect-ratio:1;background:#e5e7eb;cursor:grab;transition:opacity 0.15s,box-shadow .18s ease;-webkit-tap-highlight-color:transparent;user-select:none">
        <img src="assets/images/about/${img.filename}" alt=""
             style="width:100%;height:100%;object-fit:cover;object-position:center top;pointer-events:none;display:block" loading="lazy">
        <div class="gal-grip" style="position:absolute;top:6px;left:6px;pointer-events:none;opacity:.8;transition:opacity .18s">
          <svg width="11" height="11" viewBox="0 0 10 10" fill="#fff" style="filter:drop-shadow(0 1px 2px rgba(0,0,0,.4))">
            <circle cx="3" cy="2" r="1"/><circle cx="7" cy="2" r="1"/>
            <circle cx="3" cy="5" r="1"/><circle cx="7" cy="5" r="1"/>
            <circle cx="3" cy="8" r="1"/><circle cx="7" cy="8" r="1"/>
          </svg>
        </div>
        <div class="gal-chk" onclick="event.stopPropagation();window.galleryToggleSelect(event,${img.id})"
             style="position:absolute;top:6px;left:6px;width:22px;height:22px;border-radius:50%;
                    background:rgba(17,17,17,.4);border:2px solid rgba(255,255,255,.85);
                    cursor:pointer;z-index:4;display:flex;align-items:center;justify-content:center;
                    opacity:0;transform:scale(0.5);pointer-events:none;
                    box-shadow:0 2px 8px rgba(0,0,0,.25)">
        </div>
        <button class="gal-del-btn" onclick="event.stopPropagation();window.galleryDeletePhoto(${img.id})"
                style="position:absolute;top:5px;right:5px;width:22px;height:22px;border-radius:50%;
                       background:rgba(0,0,0,0.5);border:none;cursor:pointer;
                       display:flex;align-items:center;justify-content:center;padding:0;
                       transition:background .15s,opacity .18s"
                title="Remove">
          <svg width="10" height="10" viewBox="0 0 24 24" fill="none" stroke="#fff" stroke-width="3" stroke-linecap="round"><line x1="18" y1="6" x2="6" y2="18"/><line x1="6" y1="6" x2="18" y2="18"/></svg>
        </button>
      </div>`).join('');

    _gallerySetupDrag(grid);

    // Re-apply selection mode if it was active before reload
    if (_galSelMode) _galleryApplySelMode(grid);

    // Inject / refresh selection bar
    let selBar = document.getElementById('gallery-sel-bar');
    if (!selBar) {
      selBar = document.createElement('div');
      selBar.id = 'gallery-sel-bar';
      grid.after(selBar);
    }
    selBar.style.cssText = 'display:none;align-items:center;gap:8px;padding:10px 12px;margin-top:10px;background:#FFF8F0;border-radius:10px;border:1px solid #FEE0B4;flex-wrap:wrap';
    selBar.innerHTML = `
      <span id="gallery-sel-count" style="font-size:.75rem;font-weight:600;color:#92400E;flex:1;min-width:0"></span>
      <button id="gallery-sel-all-btn" onclick="window.gallerySelectAll()"
              style="font-size:.72rem;font-weight:500;color:#D97706;background:none;border:1.5px solid #FDE68A;border-radius:6px;padding:4px 10px;cursor:pointer;font-family:inherit;transition:background .12s"
              onmouseover="this.style.background='#FEF3C7'" onmouseout="this.style.background='none'">Select all</button>
      <button id="gallery-sel-delete" onclick="window.galleryDeleteSelected()" class="btn-danger" style="font-size:.72rem;gap:5px">
        <svg width="11" height="11" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2.5" stroke-linecap="round"><polyline points="3 6 5 6 21 6"/><path d="M19 6l-1 14H6L5 6"/><path d="M10 11v6M14 11v6"/><path d="M9 6V4h6v2"/></svg>Delete
      </button>`;
    // Prune any stale selected IDs that no longer exist in the refreshed grid
    const liveIds = new Set(d.images.map(i => i.id));
    [..._galSelected].forEach(id => { if (!liveIds.has(id)) _galSelected.delete(id); });
    _galleryUpdateSelBar();
  } catch (_) {
    grid.innerHTML = '<div style="color:#EF4444;font-size:.78rem;grid-column:1/-1;text-align:center;padding:20px 0">Network error.</div>';
  }
}

async function _galleryDoUpload(dataUrl) {
  const d = await fetch('api/clinic/gallery.php', {
    method: 'POST', headers: { 'Content-Type': 'application/json' },
    body: JSON.stringify({ imageData: dataUrl, caption: '' })
  }).then(r => r.json());
  if (!d.success) { toast(d.message || 'Upload failed.', 'error'); return; }
  toast('Photo added to gallery.', 'success');
  loadGalleryAdmin();
}

async function galleryUploadPhoto(input) {
  const file = input.files[0];
  if (!file) return;
  input.value = '';
  const ext = file.name.split('.').pop().toLowerCase();
  if (!['png', 'jpg', 'jpeg', 'svg'].includes(ext)) {
    toast('Only PNG, JPG or SVG files are accepted.', 'error');
    return;
  }
  // SVG: send as-is (no canvas resize needed)
  if (ext === 'svg') {
    const reader = new FileReader();
    reader.onload = async (e) => {
      try { await _galleryDoUpload(e.target.result); }
      catch (_) { toast('Network error — could not upload photo.', 'error'); }
    };
    reader.readAsDataURL(file);
    return;
  }
  // Raster images: resize to max 1200px via canvas to keep payload small
  const reader = new FileReader();
  reader.onload = (e) => {
    const img = new Image();
    img.onload = async () => {
      const MAX = 1200;
      let w = img.width, h = img.height;
      if (w > MAX || h > MAX) {
        if (w >= h) { h = Math.round(h * MAX / w); w = MAX; }
        else        { w = Math.round(w * MAX / h); h = MAX; }
      }
      const canvas = document.createElement('canvas');
      canvas.width = w; canvas.height = h;
      canvas.getContext('2d').drawImage(img, 0, 0, w, h);
      try { await _galleryDoUpload(canvas.toDataURL('image/jpeg', 0.85)); }
      catch (_) { toast('Network error — could not upload photo.', 'error'); }
    };
    img.src = e.target.result;
  };
  reader.readAsDataURL(file);
}

async function galleryDeletePhoto(id) {
  showConfirm({
    title: 'Remove Photo',
    message: 'Remove this photo from the gallery? This cannot be undone.',
    confirmText: 'Remove',
    danger: true,
    onConfirm: async () => {
      try {
        const d = await fetch('api/clinic/gallery.php', {
          method: 'DELETE', headers: { 'Content-Type': 'application/json' },
          body: JSON.stringify({ id })
        }).then(r => r.json());
        if (!d.success) { toast(d.message || 'Delete failed.', 'error'); return; }
        toast('Photo removed.', 'success');
        loadGalleryAdmin();
      } catch (_) { toast('Network error — could not delete photo.', 'error'); }
    }
  });
}

function galleryMaxAdjust(delta) {
  const inp = document.getElementById('gallery-max-input');
  if (!inp) return;
  inp.value = Math.min(20, Math.max(1, (parseInt(inp.value, 10) || 1) + delta));
}

async function _doSaveGalleryMax(max) {
  try {
    const d = await fetch('api/clinic/settings.php', {
      method: 'POST', headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({ galleryMaxPhotos: max })
    }).then(r => r.json());
    if (!d.success) { toast(d.message || 'Save failed.', 'error'); return; }
    if (clinicInfo) clinicInfo.galleryMaxPhotos = max;
    // Keep the input showing the saved value across re-renders within this session
    const _inp = document.getElementById('gallery-max-input');
    if (_inp) _inp.value = max;

    // Fetch current gallery and delete photos beyond the new limit
    const gallery = await fetch('api/clinic/gallery.php').then(r => r.json());
    if (gallery.success && gallery.images.length > max) {
      const excess = gallery.images.slice(max);
      await Promise.all(excess.map(img =>
        fetch('api/clinic/gallery.php', {
          method: 'DELETE', headers: { 'Content-Type': 'application/json' },
          body: JSON.stringify({ id: img.id })
        })
      ));
      toast(`Saved. ${excess.length} excess photo${excess.length > 1 ? 's' : ''} removed.`, 'success');
    } else {
      toast(`Carousel will show up to ${max} photo${max === 1 ? '' : 's'}.`, 'success');
    }
    loadGalleryAdmin();
  } catch (_) { toast('Network error.', 'error'); }
}

async function saveGalleryMax() {
  const val = document.getElementById('gallery-max-input')?.value.trim();
  const max  = Math.min(20, Math.max(1, parseInt(val, 10) || 1));

  // Check if saving would remove any existing photos
  try {
    const gallery = await fetch('api/clinic/gallery.php').then(r => r.json());
    const excess  = gallery.success ? Math.max(0, gallery.images.length - max) : 0;
    if (excess > 0) {
      showConfirm({
        title: 'Delete Excess Photos?',
        message: `Setting the limit to ${max} will permanently delete ${excess} photo${excess > 1 ? 's' : ''} from the gallery. This cannot be undone.`,
        confirmText: `Delete ${excess} Photo${excess > 1 ? 's' : ''}`,
        danger: true,
        onConfirm: () => _doSaveGalleryMax(max)
      });
    } else {
      _doSaveGalleryMax(max);
    }
  } catch (_) { _doSaveGalleryMax(max); }
}

window.loadGalleryAdmin     = loadGalleryAdmin;
window.galleryUploadPhoto   = galleryUploadPhoto;
window.galleryDeletePhoto   = galleryDeletePhoto;
window.saveGalleryMax       = saveGalleryMax;
window.galleryMaxAdjust     = galleryMaxAdjust;
window.galleryToggleSelect  = galleryToggleSelect;
window.gallerySelectAll     = gallerySelectAll;
window.galleryDeleteSelected = galleryDeleteSelected;
window.galleryToggleSelMode = galleryToggleSelMode;
window.galleryExitSelMode   = galleryExitSelMode;

// Updates every logo <img> and the favicon in the current document.
// Called on upload and at boot when clinic settings are loaded.
function syncLogoImages(url) {
  if (!url) return
  // Loading screen logo + auth screen brand-panel logos
  document.querySelectorAll('.loading-screen-logo, .auth-bp-logo').forEach(img => { img.src = url })
  // Topbar clinic logo — re-rendered by renderTopbar() but also update directly
  // in case renderTopbar hasn't run yet
  document.querySelectorAll('.topbar-clinic-img').forEach(img => { img.src = url })
  // Browser tab favicon
  const favicon = document.querySelector('link[rel="icon"]')
  if (favicon) favicon.href = url
}
window.syncLogoImages = syncLogoImages

// ════════════════════════════════════════════════════════════════
//  ACTIVITY LOG FILTERS
// ════════════════════════════════════════════════════════════════
function applyLogFilters() {
  const roleF  = (document.getElementById('log-role-filter')?.value || '').toLowerCase()
  const typeF  = (document.getElementById('log-type-filter')?.value || '').toLowerCase()
  const fromF  = document.getElementById('log-date-from')?.value || ''
  const toF    = document.getElementById('log-date-to')?.value   || ''
  const searchF= (document.getElementById('log-search')?.value   || '').toLowerCase()

  let visible = 0
  document.querySelectorAll('#log-tbody tr[data-search]').forEach(row => {
    const rowRole   = (row.dataset.role   || '').toLowerCase()
    const rowType   = (row.dataset.type   || '').toLowerCase()
    const rowTs     = (row.dataset.ts     || '')
    const rowSearch = (row.dataset.search || '').toLowerCase()
    const rowDate   = rowTs.slice(0, 10) // "YYYY-MM-DD"

    const matchRole   = !roleF   || rowRole   === roleF
    const matchType   = !typeF   || rowType   === typeF
    const matchFrom   = !fromF   || rowDate   >= fromF
    const matchTo     = !toF     || rowDate   <= toF
    const matchSearch = !searchF || rowSearch.includes(searchF)

    const show = matchRole && matchType && matchFrom && matchTo && matchSearch
    row.style.display = show ? '' : 'none'
    if (show) visible++
  })

  const emptyRow = document.getElementById('log-empty-row')
  if (emptyRow) emptyRow.style.display = visible ? 'none' : ''

  const countEl  = document.getElementById('log-count')
  const toolbar  = document.getElementById('log-toolbar')
  const thead    = document.getElementById('log-thead')
  if (countEl) countEl.textContent = `${visible} log entr${visible !== 1 ? 'ies' : 'y'}`
  if (toolbar) toolbar.style.display = visible ? '' : 'none'
  if (thead)   thead.style.display   = visible ? '' : 'none'
  if (window.pgReset) window.pgReset('log-tbody')
}
window.applyLogFilters = applyLogFilters

function clearLogFilters() {
  window.resetSelectField('log-role-filter')
  window.resetSelectField('log-type-filter')
  window.setDateFieldValue('log-date-from', '')
  window.setDateFieldValue('log-date-to', '')
  const el = document.getElementById('log-search')
  if (el) el.value = ''
  applyLogFilters()
}
window.clearLogFilters = clearLogFilters

function clearAllLogs() {
  showModal(`
    <div class="modal-header">
      <h3 class="modal-title" style="display:flex;align-items:center;gap:8px">
        ${icon('trash-2','icon-sm')} Clear All Logs
      </h3>
      <button class="modal-close" onclick="window.closeModal()">×</button>
    </div>
    <div class="modal-body">
      <div style="display:flex;align-items:flex-start;gap:12px;padding:12px 16px;background:#FEF2F2;border:1px solid #FECACA;border-radius:8px;margin-bottom:12px">
        <span style="flex-shrink:0;display:flex;margin-top:2px">${icon('alert-triangle','icon-sm')}</span>
        <div>
          <p style="color:#991B1B;font-size:.88rem;font-weight:600;margin:0 0 2px">This action cannot be undone.</p>
          <p style="color:#B91C1C;font-size:.82rem;margin:0">All activity log entries will be permanently deleted from the database.</p>
        </div>
      </div>
      <p style="color:#374151;font-size:.85rem;margin:0">Are you sure you want to clear the entire activity log?</p>
    </div>
    <div class="modal-footer">
      <button class="btn-ghost" onclick="window.closeModal()">Cancel</button>
      <button id="clear-logs-confirm-btn" class="btn-danger" style="display:flex;align-items:center;gap:6px" onclick="window._doClearAllLogs()">
        ${icon('trash-2','icon-sm')} Yes, Clear All
      </button>
    </div>
  `)
}
window.clearAllLogs = clearAllLogs

window._doClearAllLogs = async function () {
  const btn = document.getElementById('clear-logs-confirm-btn')
  if (btn) { btn.disabled = true; btn.textContent = 'Clearing…' }
  try {
    const r = await fetch('api/activity/clear.php', { method: 'POST' })
    const d = await r.json()
    if (!d.success) {
      if (btn) { btn.disabled = false; btn.innerHTML = `${icon('trash-2','icon-sm')} Yes, Clear All` }
      toast(d.message || 'Failed to clear logs.', 'error'); return
    }
  } catch (_) {
    if (btn) { btn.disabled = false; btn.innerHTML = `${icon('trash-2','icon-sm')} Yes, Clear All` }
    toast('Network error — logs not cleared.', 'error'); return
  }
  activityLog.length = 0
  window.closeModal()
  window.renderPage()
  window.toast('Activity log cleared.', 'success')
}

function exportLog() {
  if (!activityLog.length) { toast('No log entries to export.', 'error'); return }

  // Export exactly what's currently filtered on screen, not the whole
  // unfiltered log — mirrors applyLogFilters()'s own predicates so a
  // role/type/date-range/search filter actually narrows the file too,
  // instead of silently exporting everything regardless of what's shown.
  const roleF   = (document.getElementById('log-role-filter')?.value || '').toLowerCase()
  const typeF   = (document.getElementById('log-type-filter')?.value || '').toLowerCase()
  const fromF   = document.getElementById('log-date-from')?.value || ''
  const toF     = document.getElementById('log-date-to')?.value   || ''
  const searchF = (document.getElementById('log-search')?.value   || '').toLowerCase()

  const filtered = activityLog.filter(l => {
    const rowDate   = (l.timestamp || '').slice(0, 10)
    const rowSearch = `${(l.user || '').toLowerCase()} ${(l.action || '').toLowerCase()}`
    return (!roleF   || (l.role || '').toLowerCase() === roleF)
        && (!typeF   || (l.type || '').toLowerCase() === typeF)
        && (!fromF   || rowDate >= fromF)
        && (!toF     || rowDate <= toF)
        && (!searchF || rowSearch.includes(searchF))
  })
  if (!filtered.length) { toast('No log entries match the current filters.', 'error'); return }

  const header = ['#', 'User', 'Role', 'Action', 'Timestamp', 'Type', 'IP Address']
  const rows   = filtered.map((l, i) => [
    i + 1,
    `"${(l.user   || '').replace(/"/g, '""')}"`,
    `"${(l.role   || '').replace(/"/g, '""')}"`,
    `"${(l.action || '').replace(/"/g, '""')}"`,
    // Same 12-hour format the table itself displays (fmtTimestamp12h) —
    // exporting the raw "YYYY-MM-DD HH:MM:SS" DB string instead made the
    // file read differently from what was on screen.
    `"${fmtTimestamp12h(l.timestamp).replace(/"/g, '""')}"`,
    l.type || '',
    l.ip || ''
  ])
  const csv = [header, ...rows].map(r => r.join(',')).join('\n')
  const a   = document.createElement('a')
  a.href    = 'data:text/csv;charset=utf-8,' + encodeURIComponent(csv)
  a.download = `cana-activity-log-${localDateStr()}.csv`
  a.click()
  toast(`Exported ${filtered.length} log entr${filtered.length !== 1 ? 'ies' : 'y'}.`, 'success')
}
window.exportLog = exportLog

// ════════════════════════════════════════════════════════════════
//  REPORTS — generateReport + helpers
// ════════════════════════════════════════════════════════════════
function fmtDate(d) {
  if (!d || d === '—') return '—'
  const dt = new Date(d)
  return isNaN(dt) ? d : dt.toLocaleDateString('en-PH', { year:'numeric', month:'short', day:'numeric' })
}

function badge(status) {
  if (status === 'no-show') {
    return '<span class="badge badge-no-show">No-show</span>'
  }
  const map = {
    pending:'badge-pending', approved:'badge-approved', cancelled:'badge-cancelled',
    disapproved:'badge-disapproved', completed:'badge-completed', active:'badge-active',
    inactive:'badge-inactive', admin:'badge-admin', staff:'badge-staff',
    doctor:'badge-doctor', patient:'badge-patient'
  }
  const label = status.charAt(0).toUpperCase() + status.slice(1)
  return `<span class="badge ${map[status] || ''}">${label}</span>`
}

// ── Report data builders (real data) ─────────────────────────────
function _buildReportData(key, from, to) {
  const fromDate = from ? new Date(from) : null
  const toDate   = to   ? new Date(to + 'T23:59:59') : null

  function inRange(dateStr) {
    if (!dateStr || dateStr === '—') return true
    const d = new Date(dateStr)
    if (isNaN(d)) return true
    if (fromDate && d < fromDate) return false
    if (toDate   && d > toDate)   return false
    return true
  }

  function fmtD(d) {
    if (!d || d === '—') return '—'
    const dt = new Date(d)
    return isNaN(dt) ? d : dt.toLocaleDateString('en-PH', { year:'numeric', month:'short', day:'numeric' })
  }

  function rxEye(e) {
    if (!e) return '—'
    const cyl = e.cyl && e.cyl !== '0.00' ? ' ' + e.cyl + ' ×' + e.axis : ''
    return (e.sph || '—') + cyl
  }

  function toMin(t) {
    if (!t) return 0
    const [time, period] = t.split(' ')
    let [h, m] = time.split(':').map(Number)
    if (period === 'PM' && h !== 12) h += 12
    if (period === 'AM' && h === 12) h = 0
    return h * 60 + (m || 0)
  }

  // No more per-service duration — every visit (any type) runs on the one
  // clinic-wide interval, so this is no longer actually a per-type lookup.
  function svcDuration(type) {
    return _durationMinutes(consultationSettings.defaultDuration) + ' min'
  }

  switch (key) {
    case 'patient-visit': {
      const rows = appointments
        .filter(a => inRange(a.date))
        .sort((a,b) => b.date.localeCompare(a.date))
        .map(a => {
          const pt = patients.find(p => p.id === a.patientId)
          let diagnosis = '—'
          if (pt) {
            const c = pt.consultations.find(c => c.date === a.date)
                   || pt.examinations.find(e => e.date === a.date)
            if (c && c.diagnosis) diagnosis = c.diagnosis
          }
          return { patient: a.patientName, pid: a.patientId, doctor: a.doctorName,
                   date: fmtD(a.date), service: a.type, diagnosis, status: a.status }
        })
      return {
        title: 'Patient Visit History Report',
        headers: ['Patient', 'Patient ID', 'Doctor', 'Date', 'Service', 'Status', 'Diagnosis'],
        rows,
        render: r => [r.patient, `<span style="font-size:.75rem;color:#6b7280">${r.pid}</span>`,
                      r.doctor, r.date, r.service, badge(r.status), r.diagnosis]
      }
    }

    case 'diagnosis-history': {
      const diagMap = {}
      patients.forEach(pt => {
        ;[...pt.consultations, ...pt.examinations].forEach(rec => {
          if (!inRange(rec.date) || !rec.diagnosis) return
          if (!diagMap[rec.diagnosis]) diagMap[rec.diagnosis] = { frequency: 0, lastDate: rec.date }
          diagMap[rec.diagnosis].frequency++
          if (rec.date > diagMap[rec.diagnosis].lastDate) diagMap[rec.diagnosis].lastDate = rec.date
        })
      })
      const total = Object.values(diagMap).reduce((s,v) => s + v.frequency, 0) || 1
      const rows = Object.entries(diagMap)
        .sort((a,b) => b[1].frequency - a[1].frequency)
        .map(([diag, v]) => ({
          diagnosis: diag, frequency: v.frequency,
          percentage: ((v.frequency / total) * 100).toFixed(1) + '%',
          lastOccurrence: fmtD(v.lastDate)
        }))
      return {
        title: 'Diagnosis History Report',
        headers: ['Diagnosis', 'Frequency', 'Percentage', 'Most Recent'],
        rows,
        render: r => [r.diagnosis, `<strong>${r.frequency}</strong>`, r.percentage, r.lastOccurrence]
      }
    }

    case 'prescription-records': {
      const rows = []
      patients.forEach(pt => {
        pt.prescriptions.forEach(rx => {
          if (!inRange(rx.date)) return
          rows.push({ patient: pt.name, doctor: rx.doctor, date: rx.date,
                      od: rxEye(rx.od), os: rxEye(rx.os), lensType: rx.lensType })
        })
      })
      rows.sort((a,b) => b.date.localeCompare(a.date))
      return {
        title: 'Prescription Records Report',
        headers: ['Patient', 'Doctor', 'Date', 'OD (Right Eye)', 'OS (Left Eye)', 'Lens Type'],
        rows: rows.map(r => ({ ...r, date: fmtD(r.date) })),
        render: r => [r.patient, r.doctor, r.date,
                      `<code style="font-size:.73rem">${r.od}</code>`,
                      `<code style="font-size:.73rem">${r.os}</code>`, r.lensType]
      }
    }

    case 'daily-appointment': {
      const rows = appointments
        .filter(a => inRange(a.date))
        .sort((a,b) => a.date !== b.date ? a.date.localeCompare(b.date) : toMin(a.time) - toMin(b.time))
        .map(a => ({ patient: a.patientName, doctor: a.doctorName,
                     date: fmtD(a.date), time: a.time, service: a.type, status: a.status }))
      return {
        title: 'Daily Appointment Report',
        headers: ['Patient', 'Doctor', 'Date', 'Time', 'Service', 'Status'],
        rows,
        render: r => [r.patient, r.doctor, r.date, r.time, r.service, badge(r.status)]
      }
    }

    case 'completed-appts': {
      const rows = appointments
        .filter(a => a.status === 'completed' && inRange(a.date))
        .sort((a,b) => b.date.localeCompare(a.date))
        .map(a => ({ patient: a.patientName, doctor: a.doctorName,
                     date: fmtD(a.date), service: a.type, duration: svcDuration(a.type) }))
      return {
        title: 'Completed Appointment Report',
        headers: ['Patient', 'Doctor', 'Date', 'Service', 'Duration'],
        rows,
        render: r => [r.patient, r.doctor, r.date, r.service, r.duration]
      }
    }

    case 'cancelled-appts': {
      const rows = appointments
        .filter(a => (a.status === 'cancelled' || a.status === 'disapproved') && inRange(a.date))
        .sort((a,b) => b.date.localeCompare(a.date))
        .map(a => ({ patient: a.patientName, doctor: a.doctorName,
                     date: fmtD(a.date), reason: a.notes || '—', status: a.status }))
      return {
        title: 'Cancelled / Disapproved Appointment Report',
        headers: ['Patient', 'Doctor', 'Date', 'Reason / Notes', 'Status'],
        rows,
        // max-width + overflow-wrap keeps a long unbroken reason (someone
        // typing one giant run-on word with no spaces, e.g. filler text
        // fed into the field for testing) from stretching the whole
        // column — and the table with it — wider than the page instead of
        // just wrapping like every other cell. Losing this column
        // outright would mean losing the actual reason data, which is the
        // one thing this report is for; constraining it fixes the layout
        // without throwing away information.
        render: r => [r.patient, r.doctor, r.date,
                      `<span style="font-size:.78rem;color:#6b7280;display:inline-block;max-width:220px;overflow-wrap:anywhere">${r.reason}</span>`,
                      badge(r.status)]
      }
    }

    default:
      return null
  }
}

// ── Chart builders (real data) ────────────────────────────────────
function _buildReportCharts(key, from, to) {
  const today = new Date()
  const monthLabels = []
  for (let i = 5; i >= 0; i--) {
    const d = new Date(today.getFullYear(), today.getMonth() - i, 1)
    monthLabels.push(d.toLocaleString('en-US', { month: 'short' }))
  }

  function monthIdx(dateStr) {
    const d = new Date(dateStr)
    if (isNaN(d)) return -1
    for (let i = 5; i >= 0; i--) {
      const t = new Date(today.getFullYear(), today.getMonth() - i, 1)
      if (d.getFullYear() === t.getFullYear() && d.getMonth() === t.getMonth()) return 5 - i
    }
    return -1
  }

  const colors = ['#E8891C','#2563eb','#7c3aed','#16a34a','#dc2626','#6b7280','#f59e0b']

  switch (key) {
    case 'patient-visit': {
      const visitsByMonth = Array(6).fill(0)
      const svcCount = {}
      appointments.forEach(a => {
        const idx = monthIdx(a.date)
        if (idx >= 0) visitsByMonth[idx]++
        svcCount[a.type] = (svcCount[a.type] || 0) + 1
      })
      const topSvc = Object.entries(svcCount).sort((a,b) => b[1]-a[1])
      return {
        left:  { title: 'Patient Visits per Month', categoryLabel: 'Month', type: 'bar', labels: monthLabels,
                 datasets: [{ label: 'Visits', data: visitsByMonth, backgroundColor: '#E8891C', borderRadius: 5 }] },
        right: { title: 'Top Services Requested', categoryLabel: 'Service', type: 'bar', indexAxis: 'y',
                 labels: topSvc.map(s=>s[0]),
                 datasets: [{ label: 'Requests', data: topSvc.map(s=>s[1]), backgroundColor: '#2563eb', borderRadius: 4 }] }
      }
    }

    case 'diagnosis-history': {
      const diagCount = {}
      patients.forEach(pt => {
        ;[...pt.consultations, ...pt.examinations].forEach(rec => {
          if (rec.diagnosis) diagCount[rec.diagnosis] = (diagCount[rec.diagnosis] || 0) + 1
        })
      })
      const sorted = Object.entries(diagCount).sort((a,b)=>b[1]-a[1]).slice(0,7)
      const top3 = sorted.slice(0,3).map(([d])=>d)
      const monthly = top3.map(() => Array(6).fill(0))
      patients.forEach(pt => {
        ;[...pt.consultations, ...pt.examinations].forEach(rec => {
          const idx = monthIdx(rec.date)
          if (idx < 0 || !rec.diagnosis) return
          const ti = top3.indexOf(rec.diagnosis)
          if (ti >= 0) monthly[ti][idx]++
        })
      })
      return {
        left:  { title: 'Diagnosis Distribution', categoryLabel: 'Diagnosis', type: 'doughnut',
                 labels: sorted.map(s=>s[0]),
                 datasets: [{ label: 'Cases', data: sorted.map(s=>s[1]), backgroundColor: colors.slice(0,sorted.length), borderWidth: 2 }] },
        right: { title: 'Top 3 Diagnoses by Month', categoryLabel: 'Month', type: 'bar', labels: monthLabels,
                 datasets: top3.map((d,i) => ({
                   label: d.split(',')[0], data: monthly[i],
                   backgroundColor: colors[i], borderRadius: 4
                 })) }
      }
    }

    case 'prescription-records': {
      const lensCount = {}
      const rxByMonth = Array(6).fill(0)
      patients.forEach(pt => {
        pt.prescriptions.forEach(rx => {
          const primary = (rx.lensType || '').split(',')[0].trim()
          lensCount[primary] = (lensCount[primary] || 0) + 1
          const idx = monthIdx(rx.date)
          if (idx >= 0) rxByMonth[idx]++
        })
      })
      const lenses = Object.entries(lensCount).sort((a,b)=>b[1]-a[1])
      return {
        left:  { title: 'Prescriptions by Lens Type', categoryLabel: 'Lens Type', type: 'pie',
                 labels: lenses.map(l=>l[0]),
                 datasets: [{ label: 'Prescriptions', data: lenses.map(l=>l[1]), backgroundColor: colors.slice(0,lenses.length), borderWidth: 2 }] },
        right: { title: 'Prescriptions Issued per Month', categoryLabel: 'Month', type: 'line', labels: monthLabels,
                 datasets: [{ label: 'Prescriptions', data: rxByMonth,
                   borderColor: '#E8891C', backgroundColor: 'rgba(232,137,28,.12)',
                   fill: true, tension: 0.4, pointRadius: 4, pointBackgroundColor: '#E8891C' }] }
      }
    }

    case 'daily-appointment': {
      const fromD = from ? new Date(from) : null
      const toD   = to   ? new Date(to + 'T23:59:59') : null
      const rangeAppts = appointments.filter(a => {
        const d = new Date(a.date); return (!fromD || d >= fromD) && (!toD || d <= toD)
      })
      const statusCount = {}
      let morning = 0, afternoon = 0
      const statusColors = { completed:'#16a34a', approved:'#2563eb', pending:'#E8891C',
                             cancelled:'#dc2626', disapproved:'#6b7280' }
      function toMinLocal(t) {
        if (!t) return 0
        const [time, period] = t.split(' ')
        let [h, m] = time.split(':').map(Number)
        if (period === 'PM' && h !== 12) h += 12
        if (period === 'AM' && h === 12) h = 0
        return h * 60 + (m || 0)
      }
      rangeAppts.forEach(a => {
        statusCount[a.status] = (statusCount[a.status] || 0) + 1
        if (toMinLocal(a.time) < 720) morning++; else afternoon++
      })
      const statuses = Object.entries(statusCount)
      return {
        left:  { title: 'Appointment Status Breakdown', categoryLabel: 'Status', type: 'doughnut',
                 labels: statuses.map(([s]) => s.charAt(0).toUpperCase() + s.slice(1)),
                 datasets: [{ label: 'Appointments', data: statuses.map(([,v])=>v),
                   backgroundColor: statuses.map(([s])=>statusColors[s]||'#9ca3af'), borderWidth: 2 }] },
        right: { title: 'Appointments by Time of Day', categoryLabel: 'Time of Day', type: 'bar',
                 labels: ['Morning (8–12)', 'Afternoon (1–5)'],
                 datasets: [{ label: 'Appointments', data: [morning, afternoon],
                   backgroundColor: ['#2563eb','#E8891C'], borderRadius: 6 }] }
      }
    }

    case 'completed-appts': {
      const byMonth = Array(6).fill(0)
      const byDoc = {}
      // "Avg. Duration by Doctor" used to live here, but every appointment
      // now runs on the same clinic-wide interval regardless of type (no
      // more per-service duration) — an "average" of a constant is just
      // that constant repeated, not an informative chart. Appointment
      // count per doctor stays a real, varying metric using the same
      // grouping this already had to compute.
      appointments.filter(a => a.status === 'completed').forEach(a => {
        const idx = monthIdx(a.date)
        if (idx >= 0) byMonth[idx]++
        if (a.doctorName) byDoc[a.doctorName] = (byDoc[a.doctorName] || 0) + 1
      })
      const docNames  = Object.keys(byDoc)
      const docCounts = Object.values(byDoc)
      return {
        left:  { title: 'Completed Appointments per Month', categoryLabel: 'Month', type: 'bar', labels: monthLabels,
                 datasets: [{ label: 'Completed', data: byMonth, backgroundColor: '#16a34a', borderRadius: 5 }] },
        right: { title: 'Completed Appointments by Doctor', categoryLabel: 'Doctor', type: 'bar',
                 labels: docNames,
                 datasets: [{ label: 'Completed', data: docCounts, backgroundColor: '#E8891C', borderRadius: 5 }] }
      }
    }

    case 'cancelled-appts': {
      const byMonth = Array(6).fill(0)
      let cancelledCount = 0, disapprovedCount = 0
      appointments.filter(a => a.status === 'cancelled' || a.status === 'disapproved').forEach(a => {
        const idx = monthIdx(a.date)
        if (idx >= 0) byMonth[idx]++
        if (a.status === 'cancelled') cancelledCount++; else disapprovedCount++
      })
      const labels = [], data = [], bgColors = []
      if (cancelledCount)   { labels.push('Cancelled');   data.push(cancelledCount);   bgColors.push('#dc2626') }
      if (disapprovedCount) { labels.push('Disapproved'); data.push(disapprovedCount); bgColors.push('#E8891C') }
      return {
        left:  { title: 'Cancellations by Status', categoryLabel: 'Status', type: 'doughnut',
                 labels, datasets: [{ label: 'Total', data, backgroundColor: bgColors, borderWidth: 2 }] },
        right: { title: 'Cancellations / Disapprovals by Month', categoryLabel: 'Month', type: 'bar', labels: monthLabels,
                 datasets: [{ label: 'Total', data: byMonth, backgroundColor: '#dc2626', borderRadius: 5 }] }
      }
    }

    default:
      return null
  }
}

function generateReport() {
  const key    = document.getElementById('rpt-type')?.value || ''
  const from   = document.getElementById('rpt-from')?.value || ''
  const to     = document.getElementById('rpt-to')?.value   || ''
  const area   = document.getElementById('rpt-table-area')
  const hdr    = document.getElementById('rpt-table-header')
  const btn    = document.getElementById('rpt-gen-btn')
  const trends = document.getElementById('rpt-trends-section')

  if (!area) return

  if (!key) {
    window.toast('Please select a report type.', 'error')
    return
  }

  // Skeleton loading
  if (btn) { btn.disabled = true; btn.innerHTML = icon('clock','icon-sm') + ' Generating\u2026' }
  const skeletonRow = `<tr>${Array(5).fill(`<td><div style="height:12px;border-radius:4px;background:#f3f4f6;animation:skeleton-pulse 1.2s ease-in-out infinite"></div></td>`).join('')}</tr>`
  if (hdr) hdr.style.display = 'none'
  area.innerHTML = `
    <style>@keyframes skeleton-pulse{0%,100%{opacity:1}50%{opacity:.4}}</style>
    <table class="tbl">
      <thead><tr>${Array(5).fill(`<th><div style="height:10px;width:60px;border-radius:4px;background:#e5e7eb"></div></th>`).join('')}</tr></thead>
      <tbody>${Array(6).fill(skeletonRow).join('')}</tbody>
    </table>`
  if (trends) { trends.style.display = 'block'; trends.style.opacity = '0.3' }

  setTimeout(() => {
    if (btn) { btn.disabled = false; btn.innerHTML = icon('bar-chart','icon-sm') + ' Generate Report' }

    const def = _buildReportData(key, from, to)
    if (!def) return

    // Report header card
    const fromFmt = from ? fmtDate(from) : '\u2014'
    const toFmt   = to   ? fmtDate(to)   : '\u2014'
    const now = new Date().toLocaleString('en-PH', { month:'long', day:'numeric', year:'numeric', hour:'numeric', minute:'2-digit', hour12:true })
    const count = def.rows.length

    if (hdr) {
      hdr.style.display = 'block'
      const countChip = count > 0
        ? `<span style="display:inline-flex;align-items:center;background:#ECFDF5;color:#065F46;font-size:.68rem;font-weight:700;padding:2px 10px;border-radius:99px;border:1px solid rgba(16,185,129,.2)">${count} record${count!==1?'s':''}</span>`
        : `<span style="display:inline-flex;align-items:center;background:#FEF2F2;color:#991B1B;font-size:.68rem;font-weight:700;padding:2px 10px;border-radius:99px;border:1px solid rgba(239,68,68,.2)">No records</span>`
      hdr.innerHTML = `
        <div style="display:flex;justify-content:space-between;align-items:center;flex-wrap:wrap;gap:12px">
          <div>
            <div style="display:flex;align-items:center;gap:9px;margin-bottom:5px">
              <span style="font-size:.95rem;font-weight:700;color:#1f2937">${def.title}</span>
              ${countChip}
            </div>
            <div style="font-size:.75rem;color:#9ca3af">
              ${fromFmt} \u2013 ${toFmt}
              <span style="margin:0 6px;color:#e5e7eb">\u00b7</span>
              Generated: ${now}
            </div>
          </div>
          <div style="display:flex;gap:8px;align-items:center" class="rpt-no-print">
            <button class="btn-secondary" onclick="window.exportReportCSV()"
                    style="font-size:.78rem;padding:7px 14px;display:flex;align-items:center;gap:6px">
              ${icon('download','icon-sm')} Export CSV
            </button>
            <button class="btn-secondary" id="rpt-download-btn" onclick="window.downloadReportPDF()"
                    style="font-size:.78rem;padding:7px 14px;display:flex;align-items:center;gap:6px">
              ${icon('file-text','icon-sm')} Download PDF
            </button>
            <div class="search-input-wrap">${icon('search','icon-sm')}<input class="search-input" placeholder="Search\u2026" oninput="window.filterTable(this,'rpt-tbody')"></div>
          </div>
        </div>`
    }

    // Render table
    area.innerHTML = reportTable(def.headers, def.rows.map(def.render))
    // This table is injected directly on click, not through router.js's
    // render() — the only place wrapTableScroll() otherwise runs — so
    // without calling it here too, this specific table never gets wrapped
    // in .tbl-scroll at all and silently misses the mobile card styling
    // (including its gray tray background) every other table gets for free.
    if (window.wrapTableScroll) window.wrapTableScroll()
    if (window.initPagination) window.initPagination('rpt-tbody', 10)

    // Render trends
    if (trends) {
      trends.style.opacity = '1'
      trends.style.display = 'block'
      renderReportCharts(key, from, to)
    }

    // Smooth scroll to results
    const wrap = document.getElementById('rpt-results-wrap')
    if (wrap) wrap.scrollIntoView({ behavior: 'smooth', block: 'start' })

  }, 1000)
}
window.generateReport = generateReport

function resetReport() {
  window.resetSelectField('rpt-type')


  const today      = localDateStr()
  const monthStart = today.slice(0,8) + '01'
  window.setDateFieldValue('rpt-from', monthStart)
  window.setDateFieldValue('rpt-to', today)

  const hdr = document.getElementById('rpt-table-header')
  if (hdr) { hdr.style.display = 'none'; hdr.innerHTML = '' }

  // Byte-identical to the page's own initial empty state (pages.js) —
  // this used to render at font-size:.88rem instead of .92rem, a small
  // but real mismatch that made the card visibly shrink by a few pixels
  // every time Reset was clicked, even from an already-empty state.
  const area = document.getElementById('rpt-table-area')
  if (area) area.innerHTML = `
    <div style="text-align:center;padding:56px 24px">
      <div style="font-size:.92rem;font-weight:600;color:#374151;margin-bottom:6px">No report generated yet.</div>
      <div style="font-size:.8rem;color:#9ca3af;max-width:280px;margin:0 auto;line-height:1.6">
        Choose a report type and date range above, then click <strong style="color:#6b7280">Generate</strong>.
      </div>
    </div>`

  const trends = document.getElementById('rpt-trends-section')
  if (trends) trends.style.display = 'none'

  if (_rptChartLeft)  { _rptChartLeft.destroy();  _rptChartLeft  = null }
  if (_rptChartRight) { _rptChartRight.destroy(); _rptChartRight = null }
}
window.resetReport = resetReport

// Table version of a chart config — used by printReport() (pages.js) only.
// The on-screen Reports page keeps its real bar/doughnut/line charts (see
// renderReportCharts() below); printing a live canvas doesn't work well
// (rasterized, not text-selectable), so the print document gets a plain
// data table restating the exact same numbers instead — same convention
// the Dashboard's own printable report (printDashboardReport() above)
// already uses. cfg.left/right carry categoryLabel (first column header)
// + one or more named datasets (one column each), both built by
// _buildReportCharts() alongside the Chart.js-specific fields.
function _reportChartTableHtml(side) {
  if (!side || !side.labels || !side.labels.length) {
    return `<div style="text-align:center;padding:20px 0;color:#9ca3af;font-size:.82rem">No data available for this range.</div>`
  }
  const headers = [side.categoryLabel || 'Category', ...side.datasets.map(ds => ds.label || 'Count')]
  const rows = side.labels.map((lbl, i) => [lbl, ...side.datasets.map(ds => ds.data[i] ?? 0)])
  return `
    <table>
      <thead><tr>${headers.map(h => `<th>${h}</th>`).join('')}</tr></thead>
      <tbody>${rows.map(r => `<tr>${r.map(c => `<td>${c}</td>`).join('')}</tr>`).join('')}</tbody>
    </table>`
}
window._reportChartTableHtml = _reportChartTableHtml

var _rptChartLeft  = null
var _rptChartRight = null

function renderReportCharts(key, from, to) {
  if (!window.Chart) return
  Chart.defaults.font.family = 'Poppins'

  if (_rptChartLeft)  { _rptChartLeft.destroy();  _rptChartLeft  = null }
  if (_rptChartRight) { _rptChartRight.destroy(); _rptChartRight = null }

  const cfg = _buildReportCharts(key, from, to)
  if (!cfg) return

  const lTitle = document.getElementById('rpt-chart-left-title')
  const rTitle = document.getElementById('rpt-chart-right-title')
  if (lTitle) lTitle.textContent = cfg.left.title
  if (rTitle) rTitle.textContent = cfg.right.title

  const tooltipDefaults = {
    backgroundColor: '#1f2937',
    padding: 10,
    cornerRadius: 8,
    titleFont: { size: 12, family: 'Poppins' },
    bodyFont: { size: 11, family: 'Poppins' }
  }

  function sideHasData(side) {
    if (!side || !side.datasets || !side.datasets.length) return false
    return side.datasets.some(ds => ds.data && ds.data.some(v => v > 0))
  }

  const chartEmpty = `<div style="display:flex;align-items:center;justify-content:center;padding:20px 0;color:#9ca3af;font-size:.82rem">No data available for this range.</div>`

  const lWrap = document.getElementById('rpt-chart-left-wrap')
  if (lWrap) {
    if (!sideHasData(cfg.left)) {
      lWrap.style.height = 'auto'
      lWrap.innerHTML = chartEmpty
    } else {
      lWrap.innerHTML = '<canvas id="rpt-chart-left"></canvas>'
      const lCanvas = document.getElementById('rpt-chart-left')
      const isDoughnut = cfg.left.type === 'doughnut' || cfg.left.type === 'pie'
      const lDatasets = window.applyDatasetGradients
        ? window.applyDatasetGradients(cfg.left.datasets, lCanvas, cfg.left.indexAxis === 'y')
        : cfg.left.datasets
      _rptChartLeft = new Chart(lCanvas, {
        type: cfg.left.type,
        data: { labels: cfg.left.labels, datasets: lDatasets },
        options: {
          responsive: true,
          maintainAspectRatio: false,
          indexAxis: cfg.left.indexAxis || 'x',
          plugins: {
            legend: { display: isDoughnut, position: 'bottom', labels: { boxWidth: 10, padding: 12, font: { size: 11 } } },
            tooltip: tooltipDefaults
          },
          scales: isDoughnut ? {} : {
            x: { grid: { display: false }, ticks: { font: { size: 11 } } },
            y: { grid: { color: '#f3f4f6' }, ticks: { font: { size: 11 } } }
          }
        }
      })
    }
  }

  const rWrap = document.getElementById('rpt-chart-right-wrap')
  if (rWrap) {
    if (!sideHasData(cfg.right)) {
      rWrap.style.height = 'auto'
      rWrap.innerHTML = chartEmpty
    } else {
      rWrap.innerHTML = '<canvas id="rpt-chart-right"></canvas>'
      const rCanvas = document.getElementById('rpt-chart-right')
      const isDoughnut = cfg.right.type === 'doughnut' || cfg.right.type === 'pie'
      const rDatasets = window.applyDatasetGradients
        ? window.applyDatasetGradients(cfg.right.datasets, rCanvas, cfg.right.indexAxis === 'y')
        : cfg.right.datasets
      _rptChartRight = new Chart(rCanvas, {
        type: cfg.right.type,
        data: { labels: cfg.right.labels, datasets: rDatasets },
        options: {
          responsive: true,
          maintainAspectRatio: false,
          indexAxis: cfg.right.indexAxis || 'x',
          plugins: {
            legend: {
              display: isDoughnut || cfg.right.datasets.length > 1,
              position: 'bottom',
              labels: { boxWidth: 10, padding: 12, font: { size: 11 } }
            },
            tooltip: tooltipDefaults
          },
          scales: isDoughnut ? {} : {
            x: { grid: { display: false }, ticks: { font: { size: 11 } } },
            y: { grid: { color: '#f3f4f6' }, ticks: { font: { size: 11 } } }
          }
        }
      })
    }
  }
}
window.renderReportCharts = renderReportCharts

function reportTable(headers, rows) {
  if (!rows.length) return `
    <div style="text-align:center;padding:48px 24px 40px;color:#9CA3AF">
      <div style="font-size:.8rem;color:#9ca3af;max-width:300px;margin:0 auto;line-height:1.65">
        No records match the selected filters. Try widening the date range or choosing a different report type.
      </div>
    </div>`
  return `
    <div class="table-wrap">
      <table class="tbl">
        <thead><tr>${headers.map(h=>`<th>${h}</th>`).join('')}</tr></thead>
        <tbody id="rpt-tbody">
          ${rows.map(r=>`<tr data-search="${r.map(c=>String(c).replace(/<[^>]+>/g,'')).join(' ').toLowerCase()}">
            ${r.map((cell,i)=>`<td data-label="${headers[i]||''}" style="font-size:.82rem">${cell}</td>`).join('')}
          </tr>`).join('')}
        </tbody>
      </table>
    </div>`
}

// ════════════════════════════════════════════════════════════════
//  INIT
// ════════════════════════════════════════════════════════════════
function init() {
  // Show login screen
  document.getElementById('login-screen').style.display = 'flex'
  document.getElementById('register-screen').style.display = 'none'
  document.getElementById('app-shell').style.display = 'none'

  // Keyboard shortcut: Escape closes modal
  document.addEventListener('keydown', e => {
    if (e.key === 'Escape') closeModal()
  })
}

document.addEventListener('DOMContentLoaded', init)
