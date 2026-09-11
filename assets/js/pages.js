// ================================================================
//  CANAOPTICALCLINIC — pages.js
//  All page renderer functions. Each returns an HTML string.
//  Uses window.icon(), window.state, window.navigate() etc.
// ================================================================

// ── Shared helpers ──────────────────────────────────────────────
function ic(name, cls = 'icon')  { return window.icon(name, cls) }
function st()                    { return window.state }
function emptyState(iconName, title, desc) {
  return `<div class="empty-state">
    <div class="empty-state-desc">${desc}</div>
  </div>`
}

// badge() is defined in main.js (loads after this file and wins the global
// binding anyway) — removed the dead duplicate that used to live here.

// Icon+text label shown as its own row inside the Actions cell, above the
// row of icon buttons — not squeezed onto the same line as the icons, so it
// gets the cell's full width to show the complete "Reschedule Requested"
// label instead of a cramped abbreviation. Stays inside the existing
// Actions <td> (no new <tr>), so sortable.js/pagination.js are unaffected.
function rescheduleReqLabel(a) {
  if (!a.rescheduleRequest) return ''
  // Compact, content-sized pill — matches the same convention as the
  // Confirmed/Rescheduled sub-badges (apptSubBadges) rather than stretching
  // to fill the Actions column.
  return `<span style="display:inline-flex;align-items:center;gap:4px;font-size:.68rem;font-weight:600;color:#C2410C;background:#FFF7ED;border:1px solid #FED7AA;border-radius:999px;padding:2px 8px;cursor:pointer;white-space:nowrap" onclick="window.viewAppt('${a.id}')" title="View reschedule request details">
    <span style="flex-shrink:0;display:flex">${ic('refresh-cw', 'icon-xs')}</span>Reschedule Req.
  </span>`
}

function initials(name) {
  return name.split(' ').map(p => p[0]).slice(0,2).join('').toUpperCase()
}

// If a stored photo file is missing (deleted, never uploaded, etc.) the
// <img> 404s and used to leave a broken-image icon in its place. Falling
// back to the same orange initials avatar shown before a photo was ever
// set is much less alarming and matches the "no photo" look everywhere
// else in the app.
function avatarFallbackAttr(name) {
  return `var w=this.parentElement;if(w&&w.className){w.style.background='';w.style.padding='';w.style.overflow=''}if(w)w.textContent='${initials(name).replace(/'/g,"\\'")}'`
}

function avatar(name, cls = 'patient-avatar', photoUrl = null) {
  if (photoUrl) return `<div class="${cls}" style="padding:0;overflow:hidden;background:transparent"><img src="${photoUrl}" alt="${name}" style="width:100%;height:100%;object-fit:cover;border-radius:50%;display:block" onerror="${avatarFallbackAttr(name)}"></div>`
  return `<div class="${cls}">${initials(name)}</div>`
}
window.avatarFallbackAttr = avatarFallbackAttr

// Shared 80x80 clickable avatar + camera-upload badge, used by all 4 "My
// Profile" pages (admin/doctor/staff/patient Settings) — used to be
// hand-duplicated 4 times with only the id prefix/name/photoUrl differing.
// Each page also has its own standalone "Change Photo" button elsewhere in
// its layout (not part of this helper) — removePhotoBtnHtml() below is
// meant to sit right beside that same button, not on the picture itself.
function profilePhotoEditorHtml(idPrefix, name, photoUrl) {
  const avatarId = `${idPrefix}-avatar`
  const inputId  = `${idPrefix}-photo-input`
  return `
    <div style="position:relative;flex-shrink:0">
      <label for="${inputId}" style="cursor:pointer;display:block;width:80px;height:80px;border-radius:50%;overflow:hidden;position:relative">
        <div id="${avatarId}" style="width:80px;height:80px;border-radius:50%;background:#E8760A;color:#fff;font-size:1.5rem;font-weight:700;display:flex;align-items:center;justify-content:center;overflow:hidden">
          ${photoUrl
            ? `<img src="${photoUrl}" alt="Photo" style="width:100%;height:100%;object-fit:cover;border-radius:50%;display:block" onerror="${window.selfAvatarFallbackAttr ? window.selfAvatarFallbackAttr(name) : avatarFallbackAttr(name)}">`
            : initials(name)}
        </div>
        <div style="position:absolute;inset:0;border-radius:50%;background:rgba(0,0,0,0);display:flex;align-items:center;justify-content:center;transition:background .2s"
             onmouseover="this.style.background='rgba(0,0,0,.45)';this.firstElementChild.style.opacity='1'"
             onmouseout="this.style.background='rgba(0,0,0,0)';this.firstElementChild.style.opacity='0'">
          <span style="color:#fff;opacity:0;transition:opacity .2s;pointer-events:none;display:flex">
            ${ic('camera','icon-sm')}
          </span>
        </div>
      </label>
      <label for="${inputId}" title="Change photo" style="position:absolute;bottom:0;right:0;width:24px;height:24px;border-radius:50%;background:#E8760A;border:2px solid #fff;display:flex;align-items:center;justify-content:center;cursor:pointer;color:#fff;box-shadow:0 1px 4px rgba(0,0,0,.2);transition:background .15s,transform .1s"
             onmouseover="this.style.background='#C4720E'"
             onmouseout="this.style.background='#E8760A'"
             onmousedown="this.style.transform='scale(.9)'"
             onmouseup="this.style.transform='scale(1)'">
        ${ic('camera','icon-sm')}
      </label>
      <input type="file" id="${inputId}" accept="image/*" style="display:none"
             onchange="window.handlePhotoUpload(this,'${avatarId}')">
    </div>`
}
window.profilePhotoEditorHtml = profilePhotoEditorHtml

// A plain button meant to sit right next to each page's own "Change Photo"
// button (not on the avatar itself) — new, since self-service upload
// existed but there was no way back to the default orange-initials avatar
// short of overwriting it with another photo. Only rendered when there's
// an actual photo to remove.
function removePhotoBtnHtml(idPrefix, name, photoUrl) {
  if (!photoUrl) return ''
  const safeName = name.replace(/'/g, "\\'")
  // .btn-ghost's own padding/font-size (7px 14px, .78rem) run smaller than
  // .btn-secondary's (9px 20px, .85rem) — overridden inline so this sits at
  // exactly the same size as the Change Photo button right next to it.
  return `
  <button type="button" class="btn-ghost" onclick="window.removeProfilePhoto(this,'${idPrefix}-avatar','${safeName}')"
          style="flex-shrink:0;color:#DC2626;border-color:#FECACA;padding:9px 20px;font-size:.85rem">
    ${ic('trash-2','icon-sm')} Remove Photo
  </button>`
}
window.removePhotoBtnHtml = removePhotoBtnHtml

// Case/whitespace/honorific-insensitive compare — forgiving of how the same
// person's name is typed (extra spaces, casing, a doctor's "Dr." prefix),
// but not a fuzzy/partial match: two genuinely different names never pass.
function _normalizeNameForMatch(name) {
  return (name || '').trim().toLowerCase().replace(/^dr\.?\s+/, '').replace(/\s+/g, ' ')
}

// Every reasonable way an account's real name could legitimately be typed
// into a freeform field — full middle name spelled out ("John Christian
// Canteras Carlos"), middle initial only (the app's own display convention
// everywhere else, "John Christian C. Carlos"), initial with no period, or
// no middle name at all. A genuinely two-word first name ("John Christian")
// is also accepted as just its first word ("John Carlos") — the same
// leniency reasoning as the middle name, scoped only to two-word first
// names so a single-word first name still has to match in full. Last name
// always has to match exactly in every variant — that's the one part with
// no legitimate reason to ever be partial.
function _nameVariantsForAccount(u) {
  const first = (u.firstName  || '').trim()
  const last  = (u.lastName   || '').trim()
  const mid   = (u.middleName || '').trim()
  const firstWords    = first.split(' ').filter(Boolean)
  const firstVariants = firstWords.length === 2 ? [first, firstWords[0]] : [first]

  const variants = []
  firstVariants.forEach(f => {
    variants.push(`${f} ${last}`)
    if (mid) {
      variants.push(`${f} ${mid} ${last}`)
      variants.push(`${f} ${mid[0]}. ${last}`)
      variants.push(`${f} ${mid[0]} ${last}`)
    }
  })
  if (u.name) variants.push(u.name.replace(/^Dr\.\s+/, ''))
  return variants.map(_normalizeNameForMatch)
}

// Looks up a real account (patient/doctor/staff/admin) by email — used for
// contact-form submissions, which are freeform and not tied to a login.
// When the submitted email AND name both match a real account, we can show
// that account's actual profile photo instead of a generic initials circle
// built from whatever the submitter typed into the form.
//
// Email alone isn't enough to prove it's really that account — a shared
// inbox (family, front desk, a business email several people use) or
// someone simply typing in a different real patient's email would let a
// stranger's contact message wear that patient's actual photo. Requiring
// the typed name to also match closes that off: only a "real" match on
// both fields gets the real photo.
function _accountPhotoForEmail(email, name) {
  const e = (email || '').trim().toLowerCase()
  if (!e) return null
  const nameNorm = _normalizeNameForMatch(name)
  if (!nameNorm) return null
  const match = [...patients, ...doctors, ...staff, ...admins].find(u =>
    (u.email || '').trim().toLowerCase() === e && _nameVariantsForAccount(u).includes(nameNorm)
  )
  return match?.photoUrl || null
}
window._accountPhotoForEmail = _accountPhotoForEmail

function dayPills(days, size = 'md') {
  if (!days || !days.length) return ''
  const gap  = size === 'sm' ? '3px' : '5px'
  const top  = size === 'sm' ? '4px' : '6px'
  const pill = size === 'sm'
    ? 'display:inline-flex;align-items:center;background:#FFF7ED;color:#B45309;font-size:.58rem;font-weight:700;padding:2px 7px;border-radius:99px;border:1px solid rgba(232,137,28,.28);line-height:1.5;letter-spacing:.01em;white-space:nowrap'
    : 'display:inline-flex;align-items:center;background:#FFF7ED;color:#B45309;font-size:.67rem;font-weight:700;padding:3px 9px;border-radius:99px;border:1px solid rgba(232,137,28,.3);line-height:1.5;letter-spacing:.01em;white-space:nowrap'
  return `<div style="display:flex;flex-wrap:wrap;gap:${gap};margin-top:${top}">${days.map(d=>`<span style="${pill}">${d}</span>`).join('')}</div>`
}
window.dayPills = dayPills

// fmtDate() is defined in main.js (loads after this file and wins the
// global binding anyway) — removed the dead duplicate that used to live here.

// Formats a "YYYY-MM-DD HH:MM[:SS]" (or any Date-parseable) timestamp as a
// 12-hour clock string for display — e.g. "Jun 25, 2026, 3:05 PM". Naked
// "YYYY-MM-DD HH:MM:SS" strings (no timezone marker) are parsed as local
// time by `new Date()`, which is correct here since nowTimestamp() in db.js
// writes that same local wall-clock format.
function fmtTimestamp12h(ts) {
  if (!ts) return '—'
  const dt = new Date(ts.includes('T') ? ts : ts.replace(' ', 'T'))
  if (isNaN(dt)) return ts
  const dateStr = dt.toLocaleDateString('en-PH', { year:'numeric', month:'short', day:'numeric' })
  const timeStr = dt.toLocaleTimeString('en-PH', { hour:'numeric', minute:'2-digit', hour12:true })
  return `${dateStr}, ${timeStr}`
}

// ── Patient cancellation deadline ───────────────────────────────
// Patients may cancel up to this many hours before their appointment.
// Inside that window — including same-day — cancellation is blocked and
// they're told to contact the clinic directly. 24h gives staff enough
// lead time to free up/refill the slot without being overly restrictive
// for patients (matches the existing 1-day default for advance booking).
const CANCEL_DEADLINE_HOURS = 24

// ── Patient reschedule-request deadline ─────────────────────────
// Same 24h cutoff as cancellation — a reschedule request this close to the
// appointment leaves staff no real lead time to work it, so it's blocked
// the same way and the patient is pointed to calling the clinic directly.
const RESCHEDULE_DEADLINE_HOURS = 24

function apptDateTime(a) {
  if (!a?.date) return null
  let h = 0, m = 0
  if (a.time) {
    const isPM   = /PM$/i.test(a.time)
    const is12am = /^12/.test(a.time) && /AM$/i.test(a.time)
    const is12pm = /^12/.test(a.time) && /PM$/i.test(a.time)
    const parts  = a.time.replace(/\s?[AP]M$/i, '').split(':').map(Number)
    h = parts[0] || 0; m = parts[1] || 0
    if (isPM && !is12pm) h += 12
    if (is12am) h = 0
  }
  const dt = new Date(a.date + 'T00:00:00')
  if (isNaN(dt)) return null
  dt.setHours(h, m, 0, 0)
  return dt
}

// Whether a patient is still within the cancellation window for this appointment.
function apptCancellable(a) {
  const dt = apptDateTime(a)
  if (!dt) return true // malformed/missing date — don't block on bad data
  return (dt.getTime() - Date.now()) / 3600000 >= CANCEL_DEADLINE_HOURS
}

// Whether a patient is still within the reschedule-request window for this appointment.
function apptReschedulable(a) {
  const dt = apptDateTime(a)
  if (!dt) return true // malformed/missing date — don't block on bad data
  return (dt.getTime() - Date.now()) / 3600000 >= RESCHEDULE_DEADLINE_HOURS
}

// Small pills shown next to the main status badge — "Confirmed" (patient
// confirmed attendance after the reminder) and "Rescheduled" (staff/admin
// moved the date/time at least once). Both are independent of `status`
// itself, so they're additive rather than replacing the main badge.
// Colors deliberately reuse existing, established meanings elsewhere in the
// app: Confirmed reuses the same green as the "Approved" badge (confirming
// reinforces the approval, it doesn't change it), Rescheduled reuses the
// same blue already used for the "Appointment Rescheduled" notification.
function apptSubBadges(a) {
  let out = ''
  if (a.status === 'approved' && a.confirmedAt) {
    out += `<span style="display:inline-flex;align-items:center;gap:4px;font-size:.68rem;font-weight:600;
      background:#E8F5E9;color:#2E7D32;border-radius:999px;padding:2px 8px;white-space:nowrap">${ic('check','icon-xs')} Confirmed</span>`
  }
  if (a.rescheduledAt) {
    out += `<span style="display:inline-flex;align-items:center;gap:4px;font-size:.68rem;font-weight:600;
      background:#EFF6FF;color:#3B82F6;border-radius:999px;padding:2px 8px;white-space:nowrap">${ic('refresh-cw','icon-xs')} Rescheduled</span>`
  }
  return out
}

// The Status column's content — the real status badge plus its sub-badges
// (see apptSubBadges above), always shown together everywhere.
function apptStatusCell(a) {
  return `<div style="display:flex;flex-wrap:wrap;gap:4px;align-items:center">${badge(a.status)}${apptSubBadges(a)}</div>`
}

// hidePatient means every row already belongs to the one patient whose own
// profile this table is embedded in (see appointmentsTable()'s own
// hidePatient — the Patient Profile page's Appointments tab passes it in
// alongside this same flag) — so a "Patient Record" button that just
// navigates back to the page already on screen has nothing to do there.
function apptActions(a, role, hidePatient = false) {
  if (role === 'patient') return ''
  if (role === 'doctor')  return `
    <div style="display:flex;gap:4px">
      <button class="btn-icon" title="View Details" onclick="window.viewAppt('${a.id}')">${ic('eye','icon-sm')}</button>
      ${hidePatient ? '' : `<button class="btn-icon" title="Patient Record" onclick="window.navigate('patient-view',{patientId:'${a.patientId}',patientName:'${a.patientName}'})">${ic('user','icon-sm')}</button>`}
    </div>`
  return `
    <div style="display:flex;flex-direction:column;gap:4px;align-items:flex-start">
      <div class="appt-actions-row">
        <button class="btn-icon" title="View Details" onclick="window.viewAppt('${a.id}')">${ic('eye','icon-sm')}</button>
        ${!a.doctorId ? `
          <button class="btn-icon" title="Assign Optometrist" style="color:#E8760A" onclick="window.openAssignDoctorModal('${a.id}')">${ic('users','icon-sm')}</button>` : ''}
        ${a.status === 'pending' ? `
          <button class="btn-icon" title="Approve" style="color:#059669" onclick="window.approveAppt('${a.id}',this)">${ic('check','icon-sm')}</button>
          <button class="btn-icon" title="Disapprove" style="color:#991b1b" onclick="window.confirmDisapproveAppt('${a.id}')">${ic('x-circle','icon-sm')}</button>` : ''}
        ${a.status === 'approved' ? `
          <!-- No "Mark Completed" here — see actionBtns' matching comment
               in viewAppt() (main.js): completion happens automatically
               once the doctor saves an exam against this appointment, not
               by admin/staff flipping the status by hand. -->
          <button class="btn-icon" title="Mark No-Show" style="color:#6D28D9" onclick="window.confirmMarkNoShow('${a.id}')">${ic('user-x','icon-sm')}</button>
          <button class="btn-icon" title="Reschedule" style="color:#D97706" onclick="window.rescheduleAppt('${a.id}')">${ic('refresh-cw','icon-sm')}</button>
          <button class="btn-icon" title="Cancel" style="color:#DC2626" onclick="window.confirmCancelAppt('${a.id}')">${ic('x','icon-sm')}</button>` : ''}
      </div>
      ${rescheduleReqLabel(a)}
    </div>`
}

function appointmentsTable(list, role, tbodyId = 'appt-tbody', hidePatient = false, activeFilter = null) {
  if (!list.length) {
    const emptyMsg = activeFilter === 'today'  ? 'No appointments scheduled for today.'
      : activeFilter === 'all'                 ? 'No appointments have been recorded yet.'
      : activeFilter                           ? `No ${activeFilter} appointments found.`
      : 'No appointments scheduled.'
    return emptyState('calendar', 'No appointments found', emptyMsg)
  }
  const hasActions = role !== 'patient'
  return `
    <table class="tbl">
      <colgroup>
        <col style="width:7%">
        ${hidePatient ? '' : '<col style="width:18%">'}
        <col style="width:${hidePatient?'20%':'15%'}">
        <col style="width:12%"><col style="width:10%"><col style="width:${hidePatient?'18%':'11%'}">
        <col style="width:${hidePatient?(hasActions?'14%':'16%'):(hasActions?'13%':'15%')}">
        ${hasActions ? '<col style="width:14%">' : ''}
      </colgroup>
      <thead><tr>
        <th>ID</th>
        ${hidePatient ? '' : '<th data-sort-key="patient" data-sort-type="text">Patient</th>'}
        <th>Doctor</th>
        <th data-sort-key="date" data-sort-type="date">Date</th>
        <th>Time</th><th>Type</th><th>Status</th>
        ${hasActions ? '<th>Actions</th>' : ''}
      </tr></thead>
      <tbody id="${tbodyId}">
        ${list.map(a => `<tr data-search="${(a.patientName||'').toLowerCase()} ${String(a.patientId||'').toLowerCase()} ${(a.doctorName||'').toLowerCase()} ${(a.type||'').toLowerCase()}" data-appt-status="${a.status}" data-sort-patient="${(a.patientName||'').toLowerCase()}" data-sort-date="${a.date}">
          <td data-label="ID"><code style="font-size:.75rem;color:#9CA3AF">${a.id}</code></td>
          ${hidePatient ? '' : `<td data-label="Patient"><div class="patient-name-cell">
            ${avatar(a.patientName, 'patient-avatar', patients.find(p=>p.id===a.patientId)?.photoUrl || null)}
            <div class="patient-name-info"><strong>${a.patientName}</strong><span>${a.patientId}</span></div>
          </div></td>`}
          <td data-label="Doctor" style="font-size:.82rem">${a.doctorName || '<span style="color:#9CA3AF;font-style:italic">Not yet assigned</span>'}</td>
          <td data-label="Date" style="font-size:.82rem">${fmtDate(a.date)}</td>
          <td data-label="Time" style="font-size:.82rem;white-space:nowrap">${a.time}</td>
          <td data-label="Type" style="font-size:.82rem">
            ${a.type}
            <span title="${a.source === 'walk-in' ? 'Booked directly by clinic staff' : 'Booked by the patient online'}"
                  style="display:inline-block;margin-left:6px;font-size:.62rem;font-weight:700;text-transform:uppercase;letter-spacing:.03em;padding:2px 7px;border-radius:20px;white-space:nowrap;${a.source === 'walk-in' ? 'background:#FFF7ED;color:#C2410C' : 'background:#EFF6FF;color:#1D4ED8'}">${a.source === 'walk-in' ? 'Walk-in' : 'Online'}</span>
          </td>
          <td data-label="Status" style="align-items:center">${apptStatusCell(a)}</td>
          ${hasActions ? `<td data-label="Actions">${apptActions(a, role, hidePatient)}</td>` : ''}
        </tr>`).join('')}
      </tbody>
    </table>`
}

// ════════════════════════════════════════════════════════════════
//  ADMIN — DASHBOARD
// ════════════════════════════════════════════════════════════════
// ── Shared Admin/Staff dashboard body ──────────────────────────────
// Both roles see the identical stat cards, charts, and Doctor Availability /
// Recent Appointments row — the only difference is the Recent Activity feed,
// which stays Admin-only since Staff has no Activity Log nav item to link
// it to. Pass showActivity=false to omit that one section.
function _dashboardOverviewBody(showActivity) {
  // ── Real stat values ──────────────────────────────────────────
  const _todayStr   = localDateStr()
  const _todayCnt   = appointments.filter(a => a.date === _todayStr && !['cancelled','disapproved'].includes(a.status)).length
  const _completedCnt = appointments.filter(a => a.status === 'completed').length
  const _cancelledCnt = appointments.filter(a => a.status === 'cancelled').length
  const _totalDocs  = doctors.length
  const _todayShort = ['Sun','Mon','Tue','Wed','Thu','Fri','Sat'][new Date().getDay()]
  const _availDocs  = doctors.filter(d => d.status === 'active' && d.available && (d.days || []).includes(_todayShort)).length
  const STATS = {
    patients:    { value: String(patients.length),       delta: `${patients.filter(p=>p.status==='active').length} active`,  deltaColor: '#10B981' },
    appointments:{ value: String(appointments.length),   delta: `${appointments.filter(a=>a.status==='pending').length} pending`, deltaColor: '#10B981' },
    doctors:     { value: `${_availDocs}/${_totalDocs}`, delta: 'Available today',        deltaColor: '#9CA3AF' },
    today:       { value: String(_todayCnt),             delta: 'Scheduled for today',      deltaColor: '#9CA3AF' },
    completed:   { value: String(_completedCnt),         delta: 'Total completed',          deltaColor: '#10B981' },
    cancelled:   { value: String(_cancelledCnt),         delta: 'Total cancelled',          deltaColor: '#EF4444' }
  }

  // ── Real doctor availability ───────────────────────────────────
  const MOCK_DOCTORS = doctors.map(d => ({
    name: d.name, spec: d.specialization,
    days: d.days.join(', '), available: d.available && d.status === 'active'
  }))

  // ── Real recent appointments ───────────────────────────────────
  const MOCK_APPTS = [...appointments]
    .sort((a, b) => b.date.localeCompare(a.date) || b.id.localeCompare(a.id))
    .slice(0, 6)
    .map(a => ({
      patient: a.patientName,
      doctor:  a.doctorName ? a.doctorName.replace('Dr. ', '').split(' ').pop() : 'Unassigned',
      date:    new Date(a.date + 'T00:00:00').toLocaleDateString('en-PH', { month: 'short', day: 'numeric', year: 'numeric' }),
      status:  a.status
    }))

  // ── Real activity feed (Admin only) ─────────────────────────────
  let activitySection = ''
  if (showActivity) {
    const _iconForType  = t => ({ appointment:'calendar', examination:'eye', patient:'user', login:'log-out', report:'file-text', schedule:'clock', settings:'settings', account:'shield', archive:'archive' }[t] || 'activity')
    const _colorForType = t => ({ appointment:'orange', examination:'blue', patient:'green', login:'purple', report:'blue', schedule:'orange', settings:'orange', account:'red', archive:'red' }[t] || 'orange')
    const _relTime = ts => {
      const diff = Date.now() - new Date(ts.replace(' ','T')).getTime()
      const mins = Math.floor(diff / 60000)
      if (mins < 60) return mins <= 1 ? 'Just now' : `${mins} min ago`
      const hrs = Math.floor(mins / 60)
      if (hrs < 24) return `${hrs} hour${hrs > 1 ? 's' : ''} ago`
      const days = Math.floor(hrs / 24)
      return days === 1 ? 'Yesterday' : `${days} days ago`
    }
    const MOCK_ACTIVITY = activityLog.slice(0, 5).map(a => ({
      icon: _iconForType(a.type), iconColor: _colorForType(a.type),
      user: a.user, action: a.action, time: _relTime(a.timestamp)
    }))
    activitySection = `
    <!-- ── Recent Activity ─────────────────────────────────── -->
    <div class="card">
      <div class="card-header">
        <div>
          <div class="card-title">Recent Activity</div>
          <div class="card-subtitle">Latest system events</div>
        </div>
        <button class="btn-ghost" onclick="window.navigate('activity-log')"
                style="font-size:.75rem;padding:4px 12px">View All</button>
      </div>
      <div class="card-body" id="admin-activity-feed">
        ${MOCK_ACTIVITY.map(a => `
        <div class="activity-item">
          <div class="activity-icon-wrap ${a.iconColor}">${ic(a.icon,'icon-sm')}</div>
          <div class="activity-content">
            <div class="activity-action">
              <strong>${a.user}</strong> ${a.action}
            </div>
            <div class="activity-meta">${a.time}</div>
          </div>
        </div>`).join('')}
      </div>
    </div>`
  }

  return `
  <div class="page-body">

    <!-- ── 6 Stat Cards ────────────────────────────────────── -->
    <div class="stats-grid-6">

      <div class="stat-card stat-card--clickable" onclick="window.navigate('patient-list')" title="View all patients">
        <div class="stat-info">
          <div class="stat-label">Total Patients</div>
          <div class="stat-value" id="admin-stat-patients">${STATS.patients.value}</div>
          <div class="stat-delta" style="color:${STATS.patients.deltaColor}">${STATS.patients.delta}</div>
        </div>
        <div class="stat-icon orange">${ic('users','icon-lg')}</div>
      </div>

      <div class="stat-card stat-card--clickable" onclick="window.navigate('appointments')" title="View appointments">
        <div class="stat-info">
          <div class="stat-label">Total Appointments</div>
          <div class="stat-value" id="admin-stat-appts">${STATS.appointments.value}</div>
          <div class="stat-delta" style="color:${STATS.appointments.deltaColor}">${STATS.appointments.delta}</div>
        </div>
        <div class="stat-icon blue">${ic('calendar','icon-lg')}</div>
      </div>

      <div class="stat-card stat-card--clickable" onclick="window.navigate('schedule')" title="View doctor schedule">
        <div class="stat-info">
          <div class="stat-label">Doctors Available</div>
          <div class="stat-value" id="admin-stat-doctors">${STATS.doctors.value}</div>
          <div class="stat-delta" style="color:${STATS.doctors.deltaColor}">${STATS.doctors.delta}</div>
        </div>
        <div class="stat-icon green">${ic('user','icon-lg')}</div>
      </div>

      <div class="stat-card stat-card--clickable" onclick="window.navigate('appointments',{filter:'today'})" title="View today's appointments">
        <div class="stat-info">
          <div class="stat-label">Today's Appointments</div>
          <div class="stat-value" id="admin-stat-today">${STATS.today.value}</div>
          <div class="stat-delta" style="color:${STATS.today.deltaColor}">${STATS.today.delta}</div>
        </div>
        <div class="stat-icon purple">${ic('clock','icon-lg')}</div>
      </div>

      <div class="stat-card stat-card--clickable" onclick="window.navigate('appointments',{filter:'completed'})" title="View completed consultations">
        <div class="stat-info">
          <div class="stat-label">Completed Consultations</div>
          <div class="stat-value" id="admin-stat-completed">${STATS.completed.value}</div>
          <div class="stat-delta" style="color:${STATS.completed.deltaColor}">${STATS.completed.delta}</div>
        </div>
        <div class="stat-icon teal">${ic('check-circle','icon-lg')}</div>
      </div>

      <div class="stat-card stat-card--clickable" onclick="window.navigate('appointments',{filter:'cancelled'})" title="View cancelled appointments">
        <div class="stat-info">
          <div class="stat-label">Cancelled</div>
          <div class="stat-value" id="admin-stat-cancelled">${STATS.cancelled.value}</div>
          <div class="stat-delta" style="color:${STATS.cancelled.deltaColor}">${STATS.cancelled.delta}</div>
        </div>
        <div class="stat-icon red">${ic('x','icon-lg')}</div>
      </div>

    </div>

    <!-- ── Charts Row ──────────────────────────────────────── -->
    <div class="grid-2" style="margin-bottom:20px">
      <div class="card">
        <div class="card-header" style="align-items:flex-start">
          <div>
            <div class="card-title">Monthly Appointments</div>
            <div class="card-subtitle" id="admin-chart-range-label">Last 6 months</div>
          </div>
          ${window.selectFieldHtml('admin-chart-range-select', {
            value: '6',
            options: [{ value: '3', label: 'Last 3 Months' }, { value: '6', label: 'Last 6 Months' }, { value: '12', label: 'Last 12 Months' }],
            onchange: 'window.updateAdminCharts()',
            style: 'width:auto;min-width:150px;padding:6px 12px;font-size:.78rem',
            minWidth: 100
          })}
        </div>
        <div class="card-body"><div class="chart-wrap"><canvas id="chart-appointments"></canvas></div></div>
      </div>
      <div class="card">
        <div class="card-header">
          <div>
            <div class="card-title">Patient Growth</div>
            <div class="card-subtitle">New registrations per month</div>
          </div>
          <div class="chart-legend-dot orange"></div>
        </div>
        <div class="card-body"><div class="chart-wrap"><canvas id="chart-growth"></canvas></div></div>
      </div>
    </div>

    <!-- ── Bottom Row: Doctor Availability + Recent Appointments ── -->
    <div class="grid-2" style="margin-bottom:20px">

      <!-- Doctor Availability -->
      <div class="card">
        <div class="card-header">
          <div>
            <div class="card-title">Doctor Availability</div>
            <div class="card-subtitle">Current status</div>
          </div>
          <button class="btn-ghost" onclick="window.navigate('schedule')"
                  style="font-size:.75rem;padding:4px 12px">View Schedule</button>
        </div>
        <div class="card-body" id="admin-doctors-list">
          ${MOCK_DOCTORS.map(d => `
          <div class="doctor-avail-item">
            <div class="doctor-avail-info">
              <div class="avail-dot ${d.available ? 'available' : 'unavailable'}"></div>
              <div>
                <div style="font-size:.85rem;font-weight:600;color:#1C1C1C">
                  ${d.name}
                </div>
                <div style="font-size:.75rem;color:#9CA3AF">${d.spec} &bull; ${d.days}</div>
              </div>
            </div>
            ${badge(d.available ? 'active' : 'inactive')}
          </div>`).join('')}
        </div>
      </div>

      <!-- Recent Appointments -->
      <div class="card">
        <div class="card-header">
          <div>
            <div class="card-title">Recent Appointments</div>
            <div class="card-subtitle">Latest activity</div>
          </div>
          <button class="btn-ghost" onclick="window.navigate('appointments')"
                  style="font-size:.75rem;padding:4px 12px">View All</button>
        </div>
        <div class="card-body" style="padding:0">
          <table class="tbl">
            <thead><tr><th>Patient</th><th>Doctor</th><th>Date</th><th>Status</th></tr></thead>
            <tbody id="admin-appts-tbody">
              ${MOCK_APPTS.map(a => `<tr>
                <td data-label="Patient" style="font-size:.82rem;font-weight:600">${a.patient}</td>
                <td data-label="Doctor" style="font-size:.78rem;color:#6B7280">${a.doctor}</td>
                <td data-label="Date" style="font-size:.78rem;color:#6B7280;white-space:nowrap">${a.date}</td>
                <td data-label="Status">${badge(a.status)}</td>
              </tr>`).join('')}
            </tbody>
          </table>
        </div>
      </div>

    </div>

    ${activitySection}

  </div>`
}

function pageAdminDashboard() {
  window.state.afterRender = () => {
    window._charts.initAppointmentsChart()
    window._charts.initPatientGrowthChart()
    window.updateAdminDashboard()
  }

  return `
  <div class="page-header">
    <div class="page-header-left">
      <h1 class="page-title">Dashboard</h1>
      <p class="page-subtitle">Welcome back, ${st().user?.firstName}. Here's your clinic overview.</p>
    </div>
    <div class="page-header-right">
      <div class="page-header-btn-group" style="display:flex;gap:10px">
        <button class="btn-secondary" title="Print a table-only version of this dashboard" onclick="window.printDashboardReport()">
          ${ic('printer','icon-sm')} Print Report
        </button>
        <button class="btn-secondary" title="Download this dashboard as a PDF" onclick="window.downloadDashboardReportPDF(this)">
          ${ic('download','icon-sm')} Download PDF
        </button>
        <button class="btn-secondary" onclick="window.navigate('waitlist')">
          ${ic('clock','icon-sm')} Waitlist
          ${window._waitlistCount > 0 ? `<span class="nav-badge">${window._waitlistCount > 99 ? '99+' : window._waitlistCount}</span>` : ''}
        </button>
        <button class="btn-primary" onclick="window.navigate('create-appointment')">${ic('plus','icon-sm')} New Appointment</button>
      </div>
      <span style="font-size:.78rem;color:#9CA3AF">${new Date().toLocaleDateString('en-PH',{weekday:'long',year:'numeric',month:'long',day:'numeric'})}</span>
    </div>
  </div>
  ${_dashboardOverviewBody(true)}`
}

// ════════════════════════════════════════════════════════════════
//  ADMIN — USER MANAGEMENT
// ════════════════════════════════════════════════════════════════
function pageAdminUsers() {
  const allUsers = getAllUsers()
  const filter   = st().filter || 'all'

  const filtered = filter === 'all' ? allUsers : allUsers.filter(u => u.role.toLowerCase() === filter)

  window.state.afterRender = () => { window.initPagination('users-tbody'); window.initSortable('users-tbody') }

  const titleMap = {
    all: 'User Management', admin: 'Admin Users', staff: 'Staff Users',
    doctor: 'Doctor Users', patient: 'Patient Users'
  }
  const subtitleMap = {
    all: 'Manage system accounts and access roles',
    admin: 'Manage administrator accounts',
    staff: 'Manage staff accounts',
    doctor: 'Manage doctor accounts',
    patient: 'Manage patient accounts'
  }

  return `
  <div class="page-header">
    <div class="page-header-left">
      <h1 class="page-title">${titleMap[filter] || 'User Management'}</h1>
      <p class="page-subtitle">${subtitleMap[filter] || 'Manage system accounts and access roles'}</p>
    </div>
    <button class="btn-primary" onclick="window.openAddUserModal()">
      ${ic('plus','icon-sm')} Add User
    </button>
  </div>
  <div class="page-body">
    <div class="table-wrap">
      <div class="table-toolbar">
        <span class="table-title">${filtered.length} user${filtered.length!==1?'s':''}</span>
        <div class="table-actions">
          <div class="search-input-wrap">
            ${ic('search','icon-sm')}
            <input class="search-input" placeholder="Search users…"
                   oninput="window.filterTable(this,'users-tbody')">
          </div>
        </div>
      </div>
      ${filtered.length ? `<table class="tbl">
        <colgroup>
          <col style="width:22%"><col style="width:23%"><col style="width:14%">
          <col style="width:12%"><col style="width:10%"><col style="width:19%">
        </colgroup>
        <thead><tr>
          <th data-sort-key="name" data-sort-type="text">Name</th>
          <th>Email</th><th>Contact</th><th>Role</th><th>Status</th><th>Actions</th>
        </tr></thead>
        <tbody id="users-tbody">
          ${filtered.map(u => `<tr data-search="${(u.name||'').toLowerCase()} ${(u.email||'').toLowerCase()}" data-sort-name="${(u.name||'').toLowerCase()}">
            <td data-label="Name"><div class="patient-name-cell">
              ${avatar(u.name, 'patient-avatar', u.photoUrl || null)}
              <div class="patient-name-info"><strong>${u.name}</strong><span>${u.id}</span></div>
            </div></td>
            <td data-label="Email" style="font-size:.82rem">${u.email}</td>
            <td data-label="Contact" style="font-size:.82rem">${u.contact || '—'}</td>
            <td data-label="Role">${badge(u.role.toLowerCase())}</td>
            <td data-label="Status">${badge(u.status || 'active')}</td>
            <td data-label="Actions"><div style="display:flex;gap:6px;align-items:center;flex-wrap:nowrap">
              ${u.role.toLowerCase() === 'patient' ? `<button class="btn-icon" title="View Profile"
                      onclick="window.navigate('patient-view',{patientId:'${u.id}',patientName:'${(u.name||'').replace(/'/g,"\\'")}'})">
                ${ic('eye','icon-sm')}
              </button>` : ''}
              <button class="btn-icon" title="Edit" onclick="window.editUserModal('${u.id}','${u.role}')">${ic('edit','icon-sm')}</button>
              <button class="btn-icon" title="Archive" style="color:#d97706;border-color:#fef3c7" onclick="window.archiveUserConfirm('${u.id}','${(u.name||'').replace(/'/g,"\\'")}')"> ${ic('archive','icon-sm')}</button>
            </div></td>
          </tr>`).join('')}
        </tbody>
      </table>` : `<div class="table-empty">No users found.</div>`}
    </div>
  </div>`
}

// ════════════════════════════════════════════════════════════════
//  SHARED — APPOINTMENTS (Admin + Staff + Doctor)
// ════════════════════════════════════════════════════════════════
function pageAppointments() {
  const { role, filter, user } = st()

  const activeFilter = filter || 'all'

  let list = [...appointments]
  if (role === 'doctor') list = list.filter(a => a.doctorId === user.id)

  if (activeFilter === 'today') {
    const todayStr = localDateStr()
    list = list.filter(a => a.date === todayStr && !['cancelled', 'disapproved'].includes(a.status))
  } else if (activeFilter !== 'all') {
    list = list.filter(a => a.status === activeFilter)
  }

  // Same convention as the patient's own "My Appointments" page
  // (pagePatientAppts()): pending/approved are the actionable, upcoming
  // statuses — soonest-first (ascending) surfaces what needs attention next,
  // instead of burying it under whatever was booked furthest in the future.
  // Historical statuses (all/cancelled/disapproved/completed/no-show) stay
  // most-recent-first (descending), same as before.
  const _asc = activeFilter === 'pending' || activeFilter === 'approved'

  if (activeFilter === 'today') {
    list.sort((a, b) => a.time.localeCompare(b.time))
  } else if (_asc) {
    list.sort((a, b) => a.date.localeCompare(b.date) || a.time.localeCompare(b.time))
  } else {
    list.sort((a, b) => b.date.localeCompare(a.date) || b.time.localeCompare(a.time))
  }

  const titleMap = {
    all:         'All Appointments',
    today:       "Today's Appointments",
    pending:     'Pending Appointments',
    approved:    'Approved Appointments',
    cancelled:   'Cancelled Appointments',
    disapproved: 'Disapproved Appointments',
    completed:   'Completed Appointments',
    'no-show':   'No-show Appointments'
  }
  const subtitleMap = {
    all:         'All appointments across every status',
    today:       "View appointments scheduled for today",
    pending:     'Review and manage pending appointment requests',
    approved:    'View and manage approved appointments',
    cancelled:   'View cancelled appointment records',
    disapproved: 'View disapproved appointment records',
    completed:   'View completed appointment records',
    'no-show':   'Appointments that were not attended after approval'
  }

  const title    = role === 'doctor' ? 'My Patient Appointments' : (titleMap[activeFilter] || 'Appointments')
  const subtitle = role === 'doctor' ? 'Appointments assigned to you' : (subtitleMap[activeFilter] || 'Manage and track appointment requests')

  window.state.afterRender = () => { window.initPagination('appt-tbody'); window.initSortable('appt-tbody', activeFilter === 'today' ? { key: 'time', type: 'text', dir: 1, context: activeFilter } : { key: 'date', type: 'date', dir: _asc ? 1 : -1, context: activeFilter }) }

  return `
  <div class="page-header">
    <div class="page-header-left">
      <h1 class="page-title">${title}</h1>
      <p class="page-subtitle">${subtitle}</p>
    </div>
    ${role !== 'doctor' ? `
    <div class="page-header-btn-group" style="display:flex;gap:10px">
      <button class="btn-secondary" onclick="window.navigate('waitlist')">
        ${ic('clock','icon-sm')} Waitlist
        ${window._waitlistCount > 0 ? `<span class="nav-badge">${window._waitlistCount > 99 ? '99+' : window._waitlistCount}</span>` : ''}
      </button>
      <button class="btn-primary" onclick="window.navigate('create-appointment')">${ic('plus','icon-sm')} New Appointment</button>
    </div>` : ''}
  </div>
  <div class="page-body">
    <div class="table-wrap">
      <div class="table-toolbar">
        <span class="table-title">${list.length} record${list.length!==1?'s':''}</span>
        <div class="table-actions">
          <div class="search-input-wrap">
            ${ic('search','icon-sm')}
            <input class="search-input" placeholder="Search patient or doctor…"
                   oninput="window.filterApptTable(this)">
          </div>
        </div>
      </div>
      ${appointmentsTable(list, role, 'appt-tbody', false, activeFilter)}
    </div>
  </div>`
}

// ════════════════════════════════════════════════════════════════
//  SHARED — PATIENT LIST (Admin + Staff + Doctor)
// ════════════════════════════════════════════════════════════════
function pagePatientList() {
  const { role, filter } = st()
  const canEdit    = role === 'admin' || role === 'staff'
  const canArchive = role === 'admin'
  const statusFilter = (filter && ['active','inactive'].includes(filter)) ? filter : 'all'

  let list = [...patients]
  if (statusFilter === 'active')   list = list.filter(p => (p.status || 'active') === 'active')
  if (statusFilter === 'inactive') list = list.filter(p => (p.status || 'active') === 'inactive')

  window.state.afterRender = () => { window.initPagination('patients-tbody'); window.initSortable('patients-tbody') }

  return `
  <div class="page-header">
    <div class="page-header-left">
      <h1 class="page-title">Patient Records</h1>
      <p class="page-subtitle">Browse and manage patient profiles</p>
    </div>
    <div style="display:flex;gap:8px">
      ${role !== 'doctor' ? `<button class="btn-primary" onclick="window.openAddPatientModal()">
        ${ic('plus','icon-sm')} Add Patient</button>` : ''}
      <button class="btn-secondary" onclick="window.navigate('qr-scanner')">
        ${ic('qr','icon-sm')} QR Scanner
      </button>
    </div>
  </div>
  <div class="page-body">
    <div class="table-wrap">
      <div class="filter-tabs">
        ${[['all','All'],['active','Active'],['inactive','Inactive']].map(([key,lbl]) => `
          <button class="filter-tab${statusFilter===key?' active':''}"
                  onclick="window.navigate('patient-list',{filter:'${key}'})">${lbl}</button>`).join('')}
      </div>
      <div class="table-toolbar">
        <span class="table-title">${list.length} patient${list.length!==1?'s':''}</span>
        <div class="table-actions">
          <div class="search-input-wrap">
            ${ic('search','icon-sm')}
            <input class="search-input" placeholder="Search by name, ID…"
                   oninput="window.filterTable(this,'patients-tbody')">
          </div>
        </div>
      </div>
      ${list.length ? `<table class="tbl">
        <colgroup>
          <col style="width:22%"><col style="width:7%"><col style="width:9%">
          <col style="width:14%"><col style="width:14%"><col style="width:10%"><col style="width:24%">
        </colgroup>
        <thead><tr>
          <th data-sort-key="name" data-sort-type="text">Patient</th>
          <th>Age</th><th>Gender</th><th>Contact</th>
          <th data-sort-key="visit" data-sort-type="date">Last visit</th>
          <th>Status</th><th>Actions</th>
        </tr></thead>
        <tbody id="patients-tbody">
          ${list.map(p => `<tr data-search="${(p.name||'').toLowerCase()} ${String(p.id||'').toLowerCase()} ${(p.contact||'').toLowerCase()}" data-sort-name="${(p.name||'').toLowerCase()}" data-sort-visit="${p.lastVisit && p.lastVisit !== '—' ? p.lastVisit : ''}">
            <td data-label="Patient"><div class="patient-name-cell">
              ${avatar(p.name, 'patient-avatar', p.photoUrl || null)}
              <div class="patient-name-info">
                <strong>${p.name}</strong>
                ${p.deletionRequestedAt ? `<span title="Account deletion requested ${fmtDate(p.deletionRequestedAt?.replace(' ','T'))}" style="display:inline-flex;align-items:center;gap:3px;background:#FEE2E2;color:#991B1B;font-weight:700;font-size:.62rem;padding:2px 7px;border-radius:999px;margin-top:2px">${ic('user-x','icon-xs')} Deletion Requested</span>` : ''}
                <span>${p.id}</span>
              </div>
            </div></td>
            <td data-label="Age" style="font-size:.82rem">${p.age}</td>
            <td data-label="Gender" style="font-size:.82rem">${p.gender}</td>
            <td data-label="Contact" style="font-size:.82rem">${p.contact}</td>
            <td data-label="Last Visit" style="font-size:.82rem">${fmtDate(p.lastVisit)}</td>
            <td data-label="Status">${badge(p.status || 'active')}</td>
            <td data-label="Actions"><div style="display:flex;gap:4px;align-items:center;flex-wrap:nowrap">
              <button class="btn-icon" title="View Profile"
                      onclick="window.navigate('patient-view',{patientId:'${p.id}',patientName:'${p.name}'})">
                ${ic('eye','icon-sm')}
              </button>
              ${canEdit ? `
              <button class="btn-icon" title="Edit Patient" onclick="window.openEditPatientModal('${p.id}')">
                ${ic('edit','icon-sm')}
              </button>` : ''}
              ${canArchive ? `
              <button class="btn-icon" title="Archive Patient" style="color:#d97706;border-color:#fef3c7"
                      onclick="window.confirmArchivePatient('${p.id}')">
                ${ic('archive','icon-sm')}
              </button>` : ''}
            </div></td>
          </tr>`).join('')}
        </tbody>
      </table>` : `<div class="table-empty">No patients found.</div>`}
    </div>
  </div>`
}

// ════════════════════════════════════════════════════════════════
//  SHARED — PATIENT VIEW (Admin, Staff, Doctor)
// ════════════════════════════════════════════════════════════════
function pagePatientView() {
  const { role, params, user } = st()
  const p = getPatientById(params.patientId)
  if (!p) return `<div class="page-body"><div class="alert-error">No matching patient record found. Please verify the patient ID or search again.</div></div>`

  // Most-recent-first — same convention as every other historical listing
  // in the app (Appointments page's default view, Dashboard's Recent
  // Appointments, etc.); this tab was the one place still left in
  // whatever order the API happened to return, which read oldest-first.
  const patientAppts = appointments.filter(a => a.patientId === p.id)
    .sort((a, b) => b.date.localeCompare(a.date) || b.time.localeCompare(a.time))
  const canEdit      = role === 'admin' || role === 'staff'
  const pStatus      = p.status || 'active'

  window.state.afterRender = () => {
    window.initPagination('pv-appt-tbody')
    window.initSortable('pv-appt-tbody', { key: 'date', type: 'date', dir: -1 })
    if (params.tab) window.switchPatientTab(params.tab)
  }

  // ── Tab panel helper ─────────────────────────────────────────
  const panel = (id, content, active = false) =>
    `<div id="ptab-${id}" class="ptab-panel" style="${active ? '' : 'display:none'}">${content}</div>`

  // ── Consultation History panel ────────────────────────────────
  const sortedCons = [...p.consultations].sort((a,b)=>b.date.localeCompare(a.date))
  const consultationsPanel = sortedCons.length ? `
    <div class="table-wrap" style="box-shadow:none;border:1px solid #f3f4f6">
      ${sortedCons.map((c,i) => `
      <div class="record-row" style="${i!==sortedCons.length-1?'border-bottom:1px solid #F3F4F6;':''}${i===0?'background:#FAFAF8;':''}">
        <div style="text-align:center;min-width:38px;flex-shrink:0">
          <div style="font-size:1.05rem;font-weight:800;color:#1C1C1C;line-height:1">${new Date(c.date+'T00:00:00').getDate()}</div>
          <div style="font-size:.58rem;text-transform:uppercase;font-weight:600;color:#9CA3AF;margin-top:1px">${new Date(c.date+'T00:00:00').toLocaleString('en',{month:'short'})}</div>
          <div style="font-size:.58rem;color:#C4C9D0">${new Date(c.date+'T00:00:00').getFullYear()}</div>
        </div>
        <div style="width:1px;height:36px;background:#F3F4F6;flex-shrink:0"></div>
        <div class="record-row-info">
          <div style="font-size:.87rem;font-weight:700;color:#1C1C1C;overflow:hidden;text-overflow:ellipsis;white-space:nowrap">${c.chiefComplaint || 'No chief complaint recorded'}</div>
          <div style="font-size:.72rem;color:#6B7280;margin-top:2px">${c.doctor}${c.type ? ' &bull; ' + c.type : ''}</div>
        </div>
        <div class="record-row-actions">
          ${i===0 ? `<span style="background:#FFF7ED;color:#E8760A;font-size:.63rem;font-weight:700;padding:2px 8px;border-radius:20px;border:1px solid #FDE68A;flex-shrink:0;white-space:nowrap">Latest</span>` : ''}
          <button class="btn-icon" title="View Details" onclick="window.viewConsultationDetail('${p.id}','${c.id}')">${ic('eye','icon-sm')}</button>
        </div>
      </div>`).join('')}
    </div>` : emptyState('message-square', 'No consultation records', 'No consultation records on file.')

  // ── Prescriptions panel ────────────────────────────────────────
  const rxList   = p.prescriptions || []
  const sortedRx = [...rxList].sort((a,b)=>b.date.localeCompare(a.date))
  const latestRx = sortedRx[0] || null
  const prescriptionsPanel = sortedRx.length ? `
    ${window.renderRxDocumentCard(latestRx, p, true)}
    <div class="table-wrap" style="box-shadow:none;border:1px solid #f3f4f6">
      ${sortedRx.map((rx,i) => {
        const expDate = rx.expiryDate ? new Date(rx.expiryDate.includes('T') ? rx.expiryDate : rx.expiryDate+'T00:00:00')
          : (() => { const d = new Date(rx.date.includes('T') ? rx.date : rx.date+'T00:00:00'); d.setFullYear(d.getFullYear()+1); return d })()
        const isExpired = rx.status === 'expired' || (rx.status !== 'superseded' && expDate < new Date())
        return `
      <div class="record-row" style="${i!==sortedRx.length-1?'border-bottom:1px solid #F3F4F6;':''}${i===0?'background:#FAFAF8;':''}">
        <div style="text-align:center;min-width:38px;flex-shrink:0">
          <div style="font-size:1.05rem;font-weight:800;color:#1C1C1C;line-height:1">${new Date(rx.date+'T00:00:00').getDate()}</div>
          <div style="font-size:.58rem;text-transform:uppercase;font-weight:600;color:#9CA3AF;margin-top:1px">${new Date(rx.date+'T00:00:00').toLocaleString('en',{month:'short'})}</div>
          <div style="font-size:.58rem;color:#C4C9D0">${new Date(rx.date+'T00:00:00').getFullYear()}</div>
        </div>
        <div style="width:1px;height:36px;background:#F3F4F6;flex-shrink:0"></div>
        <div class="record-row-info">
          <div style="font-size:.87rem;font-weight:700;color:#1C1C1C;overflow:hidden;text-overflow:ellipsis;white-space:nowrap">${rx.id} &bull; ${rx.doctor}</div>
          <div style="font-size:.72rem;color:#6B7280;margin-top:2px">${rx.lensType && rx.lensType !== '—' ? rx.lensType : 'No lens type on file'}</div>
        </div>
        <div class="record-row-actions">
          ${i===0 ? `<span style="background:#FFF7ED;color:#E8760A;font-size:.63rem;font-weight:700;padding:2px 8px;border-radius:20px;border:1px solid #FDE68A;flex-shrink:0;white-space:nowrap">Latest</span>` : ''}
          <span style="font-size:.68rem;font-weight:700;padding:3px 10px;border-radius:20px;white-space:nowrap;${isExpired ? 'background:#FEE2E2;color:#DC2626;border:1px solid #FECACA' : 'background:#ECFDF5;color:#059669;border:1px solid #A7F3D0'}">${isExpired ? 'Expired' : 'Valid'}</span>
          <button class="btn-icon" title="View Prescription" onclick="window.viewPrescriptionDetail('${p.id}','${rx.id}')">${ic('eye','icon-sm')}</button>
          <button class="btn-icon" title="Print" onclick="window.printRxRecord('${p.id}','${rx.id}')">${ic('printer','icon-sm')}</button>
          <button class="btn-icon" title="Download PDF" onclick="window.downloadRxRecordPDF('${p.id}','${rx.id}',this)">${ic('download','icon-sm')}</button>
        </div>
      </div>`}).join('')}
    </div>` : emptyState('file-text', 'No prescriptions on file', 'No prescription records on file for this patient.')

  // ── Examinations nested in consultations ───────────────────────
  const sortedExams = [...p.examinations].sort((a,b)=>b.date.localeCompare(a.date))
  const examsContent = sortedExams.length ? `
    <div class="table-wrap" style="box-shadow:none;border:1px solid #f3f4f6">
      ${sortedExams.map((e,i) => `
      <div class="record-row" style="${i!==sortedExams.length-1?'border-bottom:1px solid #F3F4F6;':''}${i===0?'background:#FAFAF8;':''}">
        <div style="text-align:center;min-width:38px;flex-shrink:0">
          <div style="font-size:1.05rem;font-weight:800;color:#1C1C1C;line-height:1">${new Date(e.date+'T00:00:00').getDate()}</div>
          <div style="font-size:.58rem;text-transform:uppercase;font-weight:600;color:#9CA3AF;margin-top:1px">${new Date(e.date+'T00:00:00').toLocaleString('en',{month:'short'})}</div>
          <div style="font-size:.58rem;color:#C4C9D0">${new Date(e.date+'T00:00:00').getFullYear()}</div>
        </div>
        <div style="width:1px;height:36px;background:#F3F4F6;flex-shrink:0"></div>
        <div class="record-row-info">
          <div style="font-size:.87rem;font-weight:700;color:#1C1C1C;overflow:hidden;text-overflow:ellipsis;white-space:nowrap">${e.diagnosis || 'No diagnosis recorded'}</div>
          <div style="font-size:.72rem;color:#6B7280;margin-top:2px">${e.doctor}</div>
        </div>
        <div class="record-row-actions">
          ${i===0 ? `<span style="background:#FFF7ED;color:#E8760A;font-size:.63rem;font-weight:700;padding:2px 8px;border-radius:20px;border:1px solid #FDE68A;flex-shrink:0;white-space:nowrap">Latest</span>` : ''}
          <button class="btn-icon" title="View Results" onclick="window.viewExamDetail('${p.id}','${e.id}')">${ic('eye','icon-sm')}</button>
          ${(role === 'doctor' && e.doctor === user?.name) ? `
          <button class="btn-ghost" onclick="window.navigate('edit-examination',{patientId:'${p.id}',examId:'${e.id}'})"
            style="font-size:.72rem;padding:4px 10px;flex-shrink:0;white-space:nowrap">${ic('edit','icon-sm')} Edit</button>`
          : (role !== 'patient' ? `
          <button class="btn-ghost" title="${role === 'doctor' ? `Only ${e.doctor} can edit this record` : 'Only the assigned doctor can edit this record'}" onclick="window.navigate('examination',{patientId:'${p.id}',examId:'${e.id}'})"
            style="font-size:.72rem;padding:4px 10px;flex-shrink:0;white-space:nowrap;color:#9CA3AF">${ic('lock','icon-sm')} View Only</button>` : '')}
          ${(role === 'admin' || role === 'staff' || (role === 'doctor' && e.doctor === user?.name)) ? `
          <button class="btn-icon" title="Archive" style="color:#d97706;border-color:#fef3c7"
                  onclick="window.confirmDeleteExam('${e.id}','${p.id}','${p.name.replace(/'/g,"\\'")}')">${ic('archive','icon-sm')}</button>` : ''}
        </div>
      </div>`).join('')}
    </div>` : emptyState('eye', 'No examination records', 'No examination records on file.')

  return `
  <div class="page-header">
    <div class="page-header-left" style="display:flex;align-items:center;gap:12px">
      <button class="btn-icon" onclick="window.goBack('patient-list')" title="Back">
        ${ic('chevron-left','icon')}
      </button>
      <div>
        <h1 class="page-title">Patient Profile</h1>
        <p class="page-subtitle">${p.id} &bull; Registered ${fmtDate(p.registeredDate)}</p>
      </div>
    </div>
    ${canEdit ? `<div style="display:flex;gap:8px;flex-wrap:wrap;justify-content:flex-end">
      <button class="btn-secondary" onclick="window.openEditPatientModal('${p.id}')">
        ${ic('edit','icon-sm')} Edit Profile
      </button>
      <button class="btn-secondary" onclick="window.openPatientEmailModal('${p.id}')">
        ${ic('mail','icon-sm')} Email
      </button>
      <button class="btn-primary" onclick="window.navigate('create-appointment',{patientId:'${p.id}',patientName:'${(p.name||'').replace(/'/g,"\\'")}'})">
        ${ic('calendar','icon-sm')} Schedule Appointment
      </button>
    </div>` : ''}
  </div>

  <div class="page-body">

    ${p.deletionRequestedAt ? `
    <!-- Pending account-deletion request — see api/patients/request-
         deletion.php. Archiving is admin-only (same rule as everywhere
         else archiving happens — see canArchive in the shared Patient
         List section above, and the same check enforced server-side in
         api/archive/create.php) so the Archive button and its wording
         only show for role === 'admin'; staff can still Dismiss, but see
         wording that points to an admin for the archive step instead of
         an action they don't actually have. -->
    <div class="card" style="margin-bottom:20px;padding:16px 20px;border:1px solid #FECACA;background:#FEF2F2;display:flex;align-items:center;gap:12px;flex-wrap:wrap">
      <div style="color:#DC2626;flex-shrink:0">${ic('user-x','icon')}</div>
      <div style="flex:1;min-width:200px">
        <div style="font-size:.88rem;font-weight:700;color:#991B1B">Account Deletion Requested</div>
        <div style="font-size:.78rem;color:#7F1D1D;margin-top:2px">
          Requested <strong>${new Date(p.deletionRequestedAt.replace(' ','T')).toLocaleDateString('en-PH',{month:'long',day:'numeric',year:'numeric'})}</strong>${p.deletionRequestReason ? `, reason given: "${p.deletionRequestReason}"` : ''}.
          ${role === 'admin'
            ? 'Archive this patient to fulfill it, or dismiss to keep the account unchanged.'
            : 'An admin can archive this patient to fulfill it, or dismiss to keep the account unchanged.'}
        </div>
      </div>
      ${canEdit ? `<div style="display:flex;gap:8px;flex-shrink:0">
        <button class="btn-secondary" onclick="window.dismissDeletionRequest('${p.id}', this)">
          ${ic('x','icon-sm')} Dismiss Request
        </button>
        ${role === 'admin' ? `<button class="btn-primary" onclick="window.confirmArchivePatient('${p.id}')">
          ${ic('archive','icon-sm')} Archive Patient
        </button>` : ''}
      </div>` : ''}
    </div>` : ''}

    <!-- ── Profile Header Card ─────────────────────────────── -->
    <div class="card" style="margin-bottom:20px;overflow:hidden">
      <div class="patient-profile-row">

        <!-- Left: Avatar + QR -->
        <div class="patient-avatar-col">
          <div style="width:96px;height:96px;border-radius:50%;background:#E8760A;
                      display:flex;align-items:center;justify-content:center;flex-shrink:0;
                      font-size:1.8rem;font-weight:800;color:#fff;letter-spacing:-.02em;
                      overflow:hidden">
            ${p.photoUrl ? `<img src="${p.photoUrl}" alt="${p.name}" style="width:100%;height:100%;object-fit:cover;border-radius:50%;display:block" onerror="${avatarFallbackAttr(p.name)}">` : initials(p.name)}
          </div>
          <div style="display:flex;flex-direction:column;align-items:center;gap:8px">
            <div style="border-radius:8px;overflow:hidden;box-shadow:0 2px 8px rgba(0,0,0,.1);border:1px solid #e5e7eb;">
              ${window.mockQRSvg(p.qrData, 96)}
            </div>
            <button class="btn-secondary" style="font-size:.72rem;padding:4px 10px;justify-content:center"
                    onclick="window.showPatientQRModal('${p.id}')">
              ${ic('printer','icon-sm')} Print QR
            </button>
          </div>
        </div>

        <!-- Right: Patient info -->
        <div class="patient-info-col">
          <div style="display:flex;align-items:center;gap:10px;margin-bottom:6px;flex-wrap:wrap">
            <div style="font-size:1.4rem;font-weight:800;color:#1C1C1C;letter-spacing:-.02em">${p.name}</div>
            ${badge(pStatus)}
            <!-- Right up top next to the name/status, not buried in the
                 Personal Info tab — this is the one thing on the whole
                 page a doctor genuinely can't afford to miss walking in. -->
            ${p.medicalHistory ? `
            <button onclick="window.openMedicalHistoryModal('${p.id}')"
                    style="display:inline-flex;align-items:center;gap:6px;background:#FEF3C7;color:#92400E;border:1.5px solid #FDE68A;font-size:.72rem;font-weight:700;line-height:1;padding:6px 13px;border-radius:999px;cursor:pointer;font-family:inherit;transition:background .15s,border-color .15s"
                    onmouseover="this.style.background='#FDE68A';this.style.borderColor='#FCD34D'" onmouseout="this.style.background='#FEF3C7';this.style.borderColor='#FDE68A'">
              <span style="display:inline-flex;align-items:center;justify-content:center;flex-shrink:0">${ic('alert-circle','icon-xs')}</span><span>Medical History</span>
            </button>` : ''}
          </div>
          <div style="font-size:.82rem;color:#6B7280;margin-bottom:14px">
            Patient ID: <strong style="color:#1C1C1C;font-family:monospace">${p.id}</strong>
          </div>
          <div class="patient-info-chips">
            ${[
              [ic('user','icon-sm'), 'Age / Gender',  `${p.age} yrs, ${p.gender}`],
              [ic('phone','icon-sm'),'Contact',        p.contact],
              [ic('mail','icon-sm'), 'Email',          p.email],
              [ic('calendar','icon-sm'),'Last Visit',  fmtDate(p.lastVisit)],
              [ic('map-pin','icon-sm'),'Address',      p.address],
            ].map(([icn,lbl,val]) => `
              <div style="background:#F9FAFB;border-radius:8px;padding:10px 12px">
                <div style="display:flex;align-items:center;gap:5px;font-size:.65rem;color:#9CA3AF;margin-bottom:3px;text-transform:uppercase;letter-spacing:.04em;white-space:nowrap">
                  ${icn} ${lbl}
                </div>
                <div style="font-size:.83rem;font-weight:600;color:#1C1C1C">${val}</div>
              </div>`).join('')}
          </div>
        </div>

        <!-- Stats strip -->
        <div class="patient-stats-col">
          ${[
            ['Appointments', patientAppts.length, '#E8760A'],
            ['Consultations', p.consultations.length, '#059669'],
            ['Examinations', p.examinations.length, '#2563EB'],
            ['Prescriptions', (p.prescriptions||[]).length, '#7C3AED'],
            ['No-Shows', p.noShowCount || 0, (p.noShowCount||0) >= 3 ? '#DC2626' : (p.noShowCount||0) > 0 ? '#D97706' : '#9CA3AF'],
          ].map(([lbl,val,col]) => `
            <div style="background:#F9FAFB;border-radius:8px;padding:10px 14px;text-align:center">
              <div style="font-size:1.4rem;font-weight:800;color:${col}">${val}</div>
              <div style="font-size:.68rem;color:#9CA3AF;margin-top:1px">${lbl}</div>
            </div>`).join('')}
        </div>

      </div>
    </div>

    <!-- ── Tabs ──────────────────────────────────────────────── -->
    <div class="table-wrap">
      <div class="filter-tabs" style="padding:0 16px">
        ${[
          ['personal',      'Personal Info'],
          ['prescriptions', 'Prescriptions'],
          ['history',       'Examination History'],
          ['consultations', 'Consultations'],
          ['appointments',  'Appointments']
        ].map(([key, lbl], i) => `
          <button class="filter-tab ptab-btn${i===0?' active':''}" data-tab="${key}"
                  onclick="window.switchPatientTab('${key}')">${lbl}</button>`).join('')}
      </div>

      <div class="patient-tab-body">

        ${panel('personal', `
          <div class="profile-two-col" style="gap:0 32px">
            ${[
              ['Full Name',       [p.firstName, p.middleName, p.lastName].filter(Boolean).join(' ') || p.name],
              ['Date of Birth',   fmtDate(p.dob)],
              ['Age',             `${p.age} years old`],
              ['Gender',          p.gender],
              ['Contact Number',  p.contact],
              ['Email Address',   p.email],
              ['Address',         p.address],
              ['Occupation',      p.occupation || '—'],
              ['Registered',      fmtDate(p.registeredDate)],
              ['Last Visit',      fmtDate(p.lastVisit)],
              ['No-Shows', (() => {
                const n = p.noShowCount || 0
                if (n === 0) return '<span style="color:#059669;font-weight:600">0</span>'
                const severe = n >= 3
                const color  = severe ? '#DC2626' : '#D97706'
                const bg     = severe ? '#FEE2E2' : '#FEF3C7'
                let html = `<span style="display:inline-flex;align-items:center;gap:5px;background:${bg};color:${color};font-weight:700;font-size:.78rem;padding:4px 11px;border-radius:999px">${ic('alert-circle','icon-xs')} ${n} missed appointment${n===1?'':'s'}</span>`
                if (p.bookingRestricted) {
                  html += ` <span style="display:inline-flex;align-items:center;gap:4px;background:#FEE2E2;color:#991B1B;font-weight:700;font-size:.7rem;padding:3px 10px;border-radius:999px">${ic('alert-circle','icon-xs')} Booking Restricted</span>`
                }
                return html
              })()],
            ].map(([k,v]) => `
              <div class="info-item">
                <div class="info-key">${k}</div>
                <div class="info-val">${v}</div>
              </div>`).join('')}
          </div>`, true)}

        ${panel('history', `
          ${p.medicalHistory ? `
          <div style="background:#FFFBEB;border:2px solid #FDE68A;border-radius:10px;padding:14px 16px;margin-bottom:16px">
            <div style="display:flex;align-items:center;gap:8px;margin-bottom:8px">
              <span style="flex-shrink:0;display:flex;color:#D97706">${ic('alert-circle','icon-lg')}</span>
              <span style="display:inline-flex;align-items:center;font-size:.68rem;font-weight:700;text-transform:uppercase;letter-spacing:.05em;padding:2px 10px;border-radius:999px;background:#FEF3C7;color:#92400E">Medical History</span>
            </div>
            <div style="font-size:.85rem;color:#78350F;line-height:1.55;white-space:pre-wrap">${esc(p.medicalHistory)}</div>
          </div>` : ''}
          <div class="patient-section-label muted">Optical Examination Records (${p.examinations.length})</div>
          ${examsContent}`)}

        ${panel('consultations', `
          <div class="patient-section-label muted">Consultation Records (${p.consultations.length})</div>
          ${consultationsPanel}`)}

        ${panel('prescriptions', `
          <div class="patient-section-label muted">Prescription Records (${rxList.length})</div>
          ${prescriptionsPanel}`)}

        ${panel('appointments', `
          <div style="display:flex;justify-content:space-between;align-items:center;margin-bottom:14px;flex-wrap:wrap;gap:10px">
            <div class="patient-section-label muted" style="margin-bottom:0">Appointments (${patientAppts.length})</div>
            ${canEdit ? `<button class="btn-primary" onclick="window.navigate('create-appointment',{patientId:'${p.id}',patientName:'${(p.name||'').replace(/'/g,"\\'")}'})">
              ${ic('plus','icon-sm')} New Appointment
            </button>` : ''}
          </div>
          <div class="table-wrap" style="box-shadow:none;border:1px solid #f3f4f6">${appointmentsTable(patientAppts, role, 'pv-appt-tbody', true)}</div>`)}

      </div>
    </div>

  </div>`
}

// ════════════════════════════════════════════════════════════════
//  SHARED — CONTACT MESSAGES INBOX (Admin, Staff)
// ════════════════════════════════════════════════════════════════
function pageContactMessages() {
  const { filter } = st()
  const statusFilter = ['unread', 'archived'].includes(filter) ? filter : 'all'

  let list = contactMessages.filter(m => statusFilter === 'archived' ? !!m.archivedAt : !m.archivedAt)
  if (statusFilter === 'unread') list = list.filter(m => !m.isRead)

  const unreadCount = contactMessages.filter(m => !m.isRead && !m.archivedAt).length

  window.state.afterRender = () => { window.initPagination('contact-tbody'); window.initSortable('contact-tbody', { key: 'received', type: 'date', dir: -1 }) }

  return `
  <div class="page-header">
    <div class="page-header-left" style="display:flex;align-items:center;gap:12px">
      <button class="btn-icon" onclick="window.goBack('${st().role === 'admin' ? 'admin-dashboard' : 'staff-dashboard'}')" title="Back">
        ${ic('chevron-left','icon')}
      </button>
      <div>
        <h1 class="page-title">Contact Messages</h1>
        <p class="page-subtitle">Messages submitted through the website's contact form</p>
      </div>
    </div>
    <div style="display:flex;gap:8px">
      ${unreadCount > 0 ? `<button class="btn-secondary" onclick="window.markAllContactRead()">
        ${ic('check', 'icon-sm')} Mark All as Read</button>` : ''}
    </div>
  </div>
  <div class="page-body">
    <div class="table-wrap">
      <div class="filter-tabs">
        ${[['all', 'All'], ['unread', 'Unread'], ['archived', 'Archived']].map(([key, lbl]) => `
          <button class="filter-tab${statusFilter === key ? ' active' : ''}"
                  onclick="window.navigate('contact-messages',{filter:'${key}'})">
            ${lbl}${key === 'unread' && unreadCount > 0 ? ` (${unreadCount})` : ''}
          </button>`).join('')}
      </div>
      <div class="table-toolbar">
        <span class="table-title">${list.length} message${list.length !== 1 ? 's' : ''}</span>
        <div class="table-actions">
          <div class="search-input-wrap">
            ${ic('search', 'icon-sm')}
            <input class="search-input" placeholder="Search by name, email, message…"
                   oninput="window.filterTable(this,'contact-tbody')">
          </div>
        </div>
      </div>
      ${list.length === 0 ? `
        <div style="text-align:center;padding:60px 20px;color:#9CA3AF">
          <p style="font-size:.88rem">No ${statusFilter === 'unread' ? 'unread ' : statusFilter === 'archived' ? 'archived ' : ''}messages${statusFilter === 'all' ? ' yet' : ''}.</p>
        </div>` : `
      <table class="tbl">
        <colgroup>
          <col style="width:22%"><col style="width:13%"><col style="width:39%"><col style="width:13%"><col style="width:13%">
        </colgroup>
        <thead><tr>
          <th data-sort-key="from" data-sort-type="text">From</th>
          <th>Service</th><th>Message</th>
          <th data-sort-key="received" data-sort-type="date">Received</th>
          <th></th>
        </tr></thead>
        <tbody id="contact-tbody">
          ${list.length ? list.map(m => {
            const excerpt = (m.message || '').length > 90 ? m.message.slice(0, 90) + '…' : (m.message || '')
            return `<tr data-search="${(m.name || '').toLowerCase()} ${(m.email || '').toLowerCase()} ${(m.message || '').toLowerCase()}"
                        data-sort-from="${(m.name || '').toLowerCase()}" data-sort-received="${m.createdAt || ''}"
                        class="${!m.isRead ? 'msg-unread' : ''}" style="cursor:pointer"
                        onclick="window.openContactMessageModal(${m.id})">
              <td data-label="From"><div class="patient-name-cell">
                ${!m.isRead ? '<span class="msg-dot" title="Unread"></span>' : ''}
                ${avatar(m.name, 'patient-avatar', _accountPhotoForEmail(m.email, m.name))}
                <div class="patient-name-info"><strong>${m.name}</strong><span>${m.email}</span></div>
              </div></td>
              <td data-label="Service" style="font-size:.82rem">${m.service || '—'}</td>
              <td data-label="Message" style="font-size:.82rem;color:#6b7280">
                ${excerpt}
                ${m.reply ? `<span style="display:inline-flex;align-items:center;gap:3px;margin-left:8px;font-size:.68rem;font-weight:600;color:#059669;background:#ECFDF5;border:1px solid #A7F3D0;border-radius:999px;padding:1px 8px;white-space:nowrap">${ic('check', 'icon-xs')} Replied</span>` : ''}
              </td>
              <td data-label="Received" style="font-size:.78rem;color:#9ca3af;white-space:nowrap">${window._notifTimeAgo(m.createdAt)}</td>
              <td data-label="Actions" onclick="event.stopPropagation()">
                <div style="display:flex;gap:4px;align-items:center;flex-wrap:nowrap">
                  <button class="btn-icon" title="${m.archivedAt ? 'Move back to inbox' : 'Archive'}"
                          onclick="window.toggleContactMessageArchive(${m.id})">
                    ${ic(m.archivedAt ? 'rotate-ccw' : 'archive', 'icon-sm')}
                  </button>
                  <button class="btn-icon" title="Delete" style="color:#DC2626"
                          onclick="window.confirmDeleteContactMessage(${m.id})">
                    ${ic('trash-2', 'icon-sm')}
                  </button>
                </div>
              </td>
            </tr>`
          }).join('') : emptyRow(5, 'mail', 'No messages', 'Contact messages will appear here.')}
        </tbody>
      </table>
      `}
    </div>
  </div>`
}

// ════════════════════════════════════════════════════════════════
//  WAITLIST PAGE (Admin + Staff visibility)
// ════════════════════════════════════════════════════════════════
function pageWaitlist() {
  const list = [...waitlistEntries]

  // entry.time is already a formatted string ("9:00 AM") — it's stored
  // verbatim from the booking wizard's slot label, not a raw SQL TIME.
  const fmtD = d => { const dt = new Date(d + 'T00:00:00'); return isNaN(dt) ? d : dt.toLocaleDateString('en-PH', { month: 'short', day: 'numeric', year: 'numeric' }) }
  const fmtExpiry = dtStr => { const dt = new Date((dtStr || '').replace(' ', 'T')); return isNaN(dt) ? '' : dt.toLocaleTimeString('en-PH', { hour: 'numeric', minute: '2-digit' }) }
  // "9:00 AM" → "09:00", so date+time can be combined into one sortable value.
  const to24h = t => {
    const m = /^(\d{1,2}):(\d{2})\s*([AP]M)$/i.exec((t || '').trim())
    if (!m) return '00:00'
    let h = parseInt(m[1], 10)
    if (/PM/i.test(m[3]) && h !== 12) h += 12
    if (/AM/i.test(m[3]) && h === 12) h = 0
    return String(h).padStart(2, '0') + ':' + m[2]
  }

  // ── Group entries into slots: same doctor + date + time = one slot that
  // patients queue up for. The API already returns rows ordered by
  // date → time → created_at, so numbering slots in that discovery order
  // gives a naturally chronological "Slot 1, Slot 2, …" sequence.
  const slots = new Map()
  list.forEach(e => {
    const key = `${e.doctorId || e.doctorName}|${e.date}|${e.time}`
    if (!slots.has(key)) slots.set(key, { no: slots.size + 1, entries: [] })
    slots.get(key).entries.push(e)
  })
  slots.forEach(g => {
    // Queue position only applies to patients still 'waiting' — an
    // 'offered' entry has already reached the front of the line and is
    // shown as such rather than with a number.
    let pos = 0
    g.entries.forEach(e => { e._pos = e.status === 'waiting' ? ++pos : 0 })
    g.waitingCount = pos
  })
  const totalSlots = slots.size

  window.state.afterRender = () => {
    window.initPagination('waitlist-tbody')
    window.initSortable('waitlist-tbody', { key: 'slot', type: 'date', dir: 1 })
  }

  return `
  <div class="page-header">
    <div class="page-header-left" style="display:flex;align-items:center;gap:12px">
      <button class="btn-icon" onclick="window.goBack('${st().role === 'admin' ? 'admin-dashboard' : 'staff-dashboard'}')" title="Back">
        ${ic('chevron-left','icon')}
      </button>
      <div>
        <h1 class="page-title">Waitlist</h1>
        <p class="page-subtitle">Patients waiting for a fully-booked slot to open up${totalSlots ? ` · ${totalSlots} slot${totalSlots !== 1 ? 's' : ''} with a queue` : ''}</p>
      </div>
    </div>
  </div>
  <div class="page-body">
    <div class="table-wrap">
      <div class="table-toolbar">
        <span class="table-title">${list.length} ${list.length !== 1 ? 'entries' : 'entry'}</span>
        <div class="table-actions">
          <div class="search-input-wrap">
            ${ic('search', 'icon-sm')}
            <input class="search-input" placeholder="Search by patient or doctor…"
                   oninput="window.filterTable(this,'waitlist-tbody')">
          </div>
        </div>
      </div>
      ${list.length === 0 ? emptyState('clock', 'No waitlist entries', 'No one is currently waitlisted.') : `
      <table class="tbl">
        <colgroup>
          <col style="width:16%"><col style="width:22%"><col style="width:16%"><col style="width:16%"><col style="width:12%"><col style="width:10%"><col style="width:8%">
        </colgroup>
        <thead><tr>
          <th data-sort-key="slot" data-sort-type="date" title="Sort by which slot comes up soonest">Slot</th>
          <th data-sort-key="patient" data-sort-type="text">Patient</th>
          <th data-sort-key="doctor" data-sort-type="text">Doctor</th>
          <th data-sort-key="position" data-sort-type="number" title="Sort by place in line — who gets offered the slot next">Queue Position</th>
          <th>Status</th>
          <th data-sort-key="joined" data-sort-type="date">Joined</th>
          <th></th>
        </tr></thead>
        <tbody id="waitlist-tbody">
          ${list.map(e => {
            const key = `${e.doctorId || e.doctorName}|${e.date}|${e.time}`
            const g = slots.get(key)
            const isOffered = e.status === 'offered'
            const statusPill = isOffered
              ? `<span style="display:inline-flex;flex-direction:column;gap:1px">
                   <span style="display:inline-flex;align-items:center;padding:2px 9px;border-radius:999px;font-size:.72rem;font-weight:600;background:#FFF7ED;color:#C2410C;width:fit-content">Offered</span>
                   <span style="font-size:.68rem;color:#9CA3AF">Expires ${fmtExpiry(e.offerExpiresAt)}</span>
                 </span>`
              : `<span style="display:inline-flex;align-items:center;padding:2px 9px;border-radius:999px;font-size:.72rem;font-weight:600;background:#F3F4F6;color:#6B7280">Waiting</span>`
            const posBadge = isOffered
              ? `<span style="display:inline-flex;align-items:center;gap:5px;font-size:.76rem;font-weight:700;color:#C2410C;white-space:nowrap">${ic('alert-circle', 'icon-xs')} Front of line</span>`
              : `<span style="display:inline-flex;align-items:center;gap:6px;white-space:nowrap">
                   <span style="display:inline-flex;align-items:center;justify-content:center;min-width:22px;height:22px;padding:0 6px;border-radius:999px;font-size:.75rem;font-weight:700;background:${e._pos === 1 ? '#FFF0DC' : '#F3F4F6'};color:${e._pos === 1 ? '#C2410C' : '#6B7280'}">#${e._pos}</span>
                   <span style="font-size:.72rem;color:#9CA3AF">of ${g.waitingCount}</span>
                 </span>`
            return `<tr data-search="${(e.patientName || '').toLowerCase()} ${(e.doctorName || '').toLowerCase()}"
                        data-sort-slot="${e.date}T${to24h(e.time)}"
                        data-sort-patient="${(e.patientName || '').toLowerCase()}"
                        data-sort-doctor="${(e.doctorName || '').toLowerCase()}"
                        data-sort-position="${isOffered ? 0 : e._pos}"
                        data-sort-joined="${e.createdAt}">
              <td data-label="Slot" style="align-items:center">
                <div>
                  <span style="display:inline-flex;align-items:center;padding:2px 9px;border-radius:6px;font-size:.71rem;font-weight:700;background:#EFF6FF;color:#2563EB">Slot ${g.no}</span>
                  <div style="font-size:.78rem;color:#374151;margin-top:4px">${fmtD(e.date)}</div>
                  <div style="font-size:.76rem;color:#6B7280">${e.time}</div>
                </div>
              </td>
              <td data-label="Patient"><div class="patient-name-cell">
                ${avatar(e.patientName, 'patient-avatar')}
                <div class="patient-name-info"><strong>${e.patientName}</strong><span>${e.patientId}</span></div>
              </div></td>
              <td data-label="Doctor" style="font-size:.82rem">${e.doctorName || '—'}</td>
              <td data-label="Queue Position">${posBadge}</td>
              <td data-label="Status" style="align-items:center">${statusPill}</td>
              <td data-label="Joined" style="font-size:.78rem;color:#9ca3af;white-space:nowrap">${window._notifTimeAgo(e.createdAt)}</td>
              <td data-label="Actions">
                <button class="btn-icon" title="Remove from waitlist" style="color:#DC2626"
                        onclick="window.confirmRemoveWaitlistEntry(${e.id})">
                  ${ic('trash-2', 'icon-sm')}
                </button>
              </td>
            </tr>`
          }).join('')}
        </tbody>
      </table>
      `}
    </div>
  </div>`
}

// ════════════════════════════════════════════════════════════════
//  QR SCANNER PAGE
// ════════════════════════════════════════════════════════════════
function pageQRScanner() {
  window.state.afterRender = () => { if (window._qrRenderStats) window._qrRenderStats() }
  return `
  <div class="page-header">
    <div class="page-header-left">
      <h1 class="page-title">QR Code Scanner</h1>
      <p class="page-subtitle">Scan a patient QR code for instant profile access</p>
    </div>
    <button class="btn-secondary" onclick="window.goBack('patient-list')">
      ${ic('chevron-left','icon-sm')} Back to Patient List
    </button>
  </div>
  <div class="page-body">
    <div style="display:grid;grid-template-columns:1fr 1fr;gap:20px;align-items:start">

      <!-- Camera / scan area -->
      <div class="card">
        <div class="card-header">
          <div class="card-title">${ic('qr','icon-sm')} Camera Scanner</div>
        </div>
        <div class="card-body">
          <!-- Camera area -->
          <div id="qr-camera-area" style="border:2px dashed #E5E7EB;border-radius:12px;padding:48px 24px;
                text-align:center;background:#FAFAFA;margin-bottom:16px;position:relative;min-height:320px;
                overflow:hidden;display:flex;flex-direction:column;align-items:center;justify-content:center">
            <!-- Idle placeholder -->
            <div id="qr-cam-idle" style="display:flex;flex-direction:column;align-items:center">
              <div style="width:64px;height:64px;border-radius:50%;background:#F3F4F6;
                          display:flex;align-items:center;justify-content:center;margin-bottom:16px;color:#9CA3AF">
                ${ic('qr','icon-xl')}
              </div>
              <div style="font-size:1rem;font-weight:700;color:#374151;margin-bottom:6px">Click "Start Camera" to Scan</div>
              <div style="font-size:.82rem;color:#9CA3AF;max-width:280px;line-height:1.6">
                Point the camera at a patient QR code. Keep it steady and well-lit — detection is automatic.
              </div>
            </div>
            <!-- Scanning status bar (shown when camera active) -->
            <div id="qr-scanning-bar" style="display:none;position:absolute;top:0;left:0;right:0;z-index:10;
                 background:rgba(10,10,20,.78);padding:7px 12px;border-radius:8px 8px 0 0;
                 align-items:center;gap:8px">
              <div id="qr-scan-pulse" style="width:9px;height:9px;border-radius:50%;background:#22C55E;
                   flex-shrink:0;transition:background .08s"></div>
              <span id="qr-scan-bar-text" style="font-size:.73rem;color:#fff;font-weight:600;letter-spacing:.02em">
                Scanning for QR code…
              </span>
            </div>
            <!-- html5-qrcode renders its own video + scan box into this container -->
            <div id="qr-reader" style="display:none;width:100%"></div>
            <!-- Lookup status -->
            <div id="qr-scan-status" style="display:none;position:absolute;bottom:10px;left:0;right:0;
                 text-align:center;font-size:.75rem;font-weight:600;color:#fff;
                 background:rgba(0,0,0,.55);padding:5px 10px;border-radius:0 0 10px 10px"></div>
          </div>
          <!-- Camera control buttons -->
          <div style="display:flex;gap:8px;margin-bottom:8px">
            <button id="qr-start-btn" class="btn-primary" style="flex:1;justify-content:center"
                    onclick="window.openQRCameraScanner()">
              ${ic('camera','icon-sm')} Start Camera
            </button>
            <button id="qr-stop-btn" class="btn-secondary" style="flex:1;justify-content:center;display:none"
                    onclick="window.stopQRCamera()">
              ${ic('x','icon-sm')} Stop Camera
            </button>
          </div>
          <!-- Live status caption — updated by JS -->
          <div id="qr-status-caption" style="display:none;font-size:.76rem;color:#6B7280;text-align:center;margin-bottom:10px;line-height:1.5;min-height:1.1em"></div>

          <!-- Divider -->
          <div style="display:flex;align-items:center;gap:10px;margin:4px 0 12px">
            <div style="flex:1;height:1px;background:#E5E7EB"></div>
            <span style="font-size:.7rem;color:#9CA3AF;font-weight:600;text-transform:uppercase;letter-spacing:.06em">or upload image</span>
            <div style="flex:1;height:1px;background:#E5E7EB"></div>
          </div>

          <!-- Upload drop zone -->
          <div id="qr-upload-zone"
               style="border:2px dashed #E5E7EB;border-radius:10px;padding:22px 16px;text-align:center;
                      cursor:pointer;transition:border-color .15s,background .15s;background:#FAFAFA;margin-bottom:10px"
               onclick="document.getElementById('qr-file-input').click()"
               ondragover="event.preventDefault();this.style.borderColor='#E8760A';this.style.background='#FFF8F2'"
               ondragleave="this.style.borderColor='#E5E7EB';this.style.background='#FAFAFA'"
               ondrop="event.preventDefault();this.style.borderColor='#E5E7EB';this.style.background='#FAFAFA';window.processQRImageFile(event.dataTransfer.files[0])">
            <div id="qr-upload-idle">
              <div style="color:#9CA3AF;margin-bottom:8px">${ic('upload','icon-lg')}</div>
              <div style="font-size:.85rem;font-weight:600;color:#374151;margin-bottom:3px">Click to upload or drag &amp; drop</div>
              <div style="font-size:.74rem;color:#9CA3AF">Any QR code image in PNG, JPG, or WEBP</div>
            </div>
            <img id="qr-upload-preview" style="display:none;width:88px;height:88px;border-radius:8px;margin:0 auto;object-fit:contain;background:#fff;border:1px solid #E5E7EB;padding:6px">
            <div id="qr-upload-status" style="display:none;margin-top:10px"></div>
          </div>
          <input type="file" id="qr-file-input" accept="image/*" style="display:none"
                 onchange="window.processQRImageFile(this.files[0]);this.value=''">
        </div>
      </div>

      <!-- Manual search + result -->
      <div style="display:flex;flex-direction:column;gap:16px">

        <!-- Manual search -->
        <div class="card">
          <div class="card-header">
            <div class="card-title">${ic('search','icon-sm')} Manual Search</div>
          </div>
          <div class="card-body" style="display:flex;flex-direction:column;gap:12px">
            <div class="form-group" style="margin:0">
              <label class="form-label">Patient ID, Name, or QR Code</label>
              <div class="search-input-wrap">
                ${ic('search','icon-sm')}
                <input id="qr-search-input" class="search-input" placeholder="e.g. P001, Juan Dela Cruz, or CANA-P001-..."
                       style="width:100%" oninput="window.liveSearchPatient(this.value)">
              </div>
            </div>
            <div id="qr-live-results" style="display:none;max-height:200px;overflow-y:auto;border:1px solid #E5E7EB;border-radius:8px"></div>
          </div>
        </div>

        <!-- Scan result card (hidden until triggered) -->
        <div id="qr-result-card" style="display:none">
          <div class="card" style="border:2px solid #E8760A">
            <div class="card-header" style="background:#FFFBF5;border-bottom:1px solid #FFE4C0">
              <div style="display:flex;align-items:center;gap:8px">
                <div style="width:8px;height:8px;border-radius:50%;background:#22C55E;animation:pulse 1.5s infinite"></div>
                <div class="card-title" style="color:#E8760A">Patient Found</div>
              </div>
            </div>
            <div class="card-body" id="qr-result-body">
              <!-- Populated by JS -->
            </div>
          </div>
        </div>

        <!-- Quick stats -->
        <div class="card">
          <div class="card-header"><div class="card-title">Scanner Stats Today</div></div>
          <div class="card-body">
            ${[['Scans Today','qr-stat-total'],['Patients Found','qr-stat-found'],['Not Found','qr-stat-notfound']].map(([l,id]) => `
              <div style="display:flex;justify-content:space-between;align-items:center;padding:8px 0;border-bottom:1px solid #F9FAFB">
                <span style="font-size:.82rem;color:#6B7280">${l}</span>
                <strong id="${id}" style="font-size:.9rem;color:#1C1C1C">0</strong>
              </div>`).join('')}
          </div>
        </div>

        <!-- Recent scans — who scanned, when, found or not (surfaces
             qr_scan_log.scanned_by, which the stats totals above don't) -->
        <div class="card">
          <div class="card-header"><div class="card-title">Recent Scans</div></div>
          <div class="card-body" id="qr-recent-list">
            <div style="padding:16px 0;text-align:center;font-size:.8rem;color:#9CA3AF">Loading…</div>
          </div>
        </div>

      </div>
    </div>
  </div>
  <style>
    @keyframes pulse {
      0%,100% { opacity: 1 }
      50%      { opacity: .3 }
    }
    @keyframes qrDotPulse {
      0%,100% { transform: scale(1);   opacity: 1 }
      50%      { transform: scale(1.5); opacity: .5 }
    }
  </style>`
}

// ════════════════════════════════════════════════════════════════
//  SHARED — DOCTOR SCHEDULE
// ════════════════════════════════════════════════════════════════
function pageSchedule() {
  const { role, params } = st()
  const canEdit  = role === 'admin' || role === 'staff'

  const now    = new Date()
  const todayY = now.getFullYear()
  const todayM = now.getMonth()
  const todayD = now.getDate()

  const year  = params?.schedYear  ?? todayY
  const month = params?.schedMonth ?? todayM
  const today = year === todayY && month === todayM ? todayD : -1

  const monthName  = new Date(year, month, 1).toLocaleDateString('en-PH', { month: 'long', year: 'numeric' })

  // All 5 doctors from branch-data.js
  const allDocs  = typeof getAvailableDoctors === 'function' ? getAvailableDoctors() : []
  const firstDoc = allDocs[0]

  window.state.afterRender = () => {
    window.schedGoMonth(todayY, todayM)
    if (firstDoc) window.switchScheduleDoctor(firstDoc.id)
  }

  // Build calendar cells coloured by this doctor's availability
  function buildDocCalendar(doctor) {
    const weekdays  = ['Sun','Mon','Tue','Wed','Thu','Fri','Sat']
    const firstDay  = new Date(year, month, 1).getDay()
    const daysInMon = new Date(year, month + 1, 0).getDate()

    const apptsByDate = {}
    appointments.filter(a => a.doctorName === doctor.name).forEach(a => {
      if (!apptsByDate[a.date]) apptsByDate[a.date] = []
      apptsByDate[a.date].push({ time: a.time, patientName: a.patientName, status: a.status })
    })

    const blockedByDate = {}
    ;(doctor.blockedDates || []).forEach(b => { blockedByDate[b.date] = b.reason || 'Blocked' })

    let cells = ''
    for (let i = 0; i < firstDay; i++) cells += `<div class="cal-day other-month"></div>`
    for (let d = 1; d <= daysInMon; d++) {
      const dow     = new Date(year, month, d).getDay()
      const dayName = weekdays[dow]
      const isToday = d === today
      const dateStr = `${year}-${String(month + 1).padStart(2,'0')}-${String(d).padStart(2,'0')}`
      const dayAppts = apptsByDate[dateStr] || []
      const blockedReason = blockedByDate[dateStr]

      const avail = (doctor.availableDays || []).includes(dayName)
      let cls = avail ? (isToday ? 'today avail' : 'avail') : (isToday ? 'today' : 'blocked')
      if (blockedReason) cls = (isToday ? 'today date-blocked' : 'date-blocked')

      const dotCls   = dayAppts.length ? ' has-appts' : ''
      const hoverEvt = dayAppts.length
        ? `onmouseenter="window.showCalTip(this,'${JSON.stringify(dayAppts).replace(/'/g,'&#39;').replace(/"/g,'&quot;')}')" onmouseleave="window.hideCalTip()"`
        : ''
      const titleAttr = blockedReason ? `title="Blocked: ${blockedReason.replace(/"/g,'&quot;')}"` : ''

      cells += `<div class="cal-day ${cls}${dotCls}" ${hoverEvt} ${titleAttr}>${d}</div>`
    }
    return cells
  }

  // Build full panel for one doctor
  function buildDocPanel(doctor) {
    const calCells  = buildDocCalendar(doctor)
    const todayStr  = localDateStr(now)
    const docAppts  = appointments.filter(a =>
      a.date === todayStr && a.status === 'approved' && a.doctorName === doctor.name)

    return `
    <div id="sched-panel-${doctor.id}" class="sched-doctor-panel" style="display:none">
      <div class="card" style="margin-bottom:16px">
        <div class="card-body" style="display:flex;align-items:center;gap:16px;flex-wrap:wrap">
          ${avatar(doctor.name, 'profile-avatar-lg', doctor.photoUrl || null)}
          <div style="flex:1;min-width:0">
            <div style="font-size:1rem;font-weight:700;color:#1C1C1C">${doctor.name}</div>
            <div style="font-size:.8rem;color:#6B7280;margin-top:2px">${doctor.specialization}</div>
            ${dayPills(doctor.availableDays)}
          </div>
          ${canEdit ? `
          <div class="sched-header-actions">
            <button class="btn-ghost" style="font-size:.78rem"
                    onclick="window.openBlockDateModal('${doctor.id}','${doctor.name.replace(/'/g,'&#39;')}')">
              ${ic('x','icon-sm')} Block Date
            </button>
            <button class="btn-secondary" style="font-size:.78rem"
                    onclick="window.openSetScheduleModal('${doctor.id}')">
              ${ic('edit','icon-sm')} Edit Schedule
            </button>
          </div>` : ''}
        </div>
      </div>
      <div class="grid-2" style="align-items:start">
        <div class="card">
          <div class="card-header">
            <div class="card-title sched-month-title"></div>
            <div style="display:flex;gap:4px">
              <button class="btn-icon sched-prev" title="Previous month">${ic('chevron-left','icon-sm')}</button>
              <button class="btn-icon sched-today" style="font-size:.7rem;font-weight:700;width:auto;padding:0 8px;color:#E8760A;border-color:#E8760A">Today</button>
              <button class="btn-icon sched-next" title="Next month">${ic('chevron-right','icon-sm')}</button>
            </div>
          </div>
          <div class="card-body">
            <div class="calendar-grid" style="margin-bottom:8px">
              ${['Sun','Mon','Tue','Wed','Thu','Fri','Sat'].map(d=>`<div class="cal-day-header">${d}</div>`).join('')}
            </div>
            <div class="calendar-grid" id="sched-cal-${doctor.id}">${calCells}</div>
            <div style="display:flex;gap:14px;margin-top:16px;flex-wrap:wrap">
              <div style="display:flex;align-items:center;gap:6px;font-size:.75rem;color:#6B7280">
                <div style="width:10px;height:10px;background:#fff;border:2px solid #E8760A;box-sizing:border-box;border-radius:2px"></div>Today
              </div>
              <div style="display:flex;align-items:center;gap:6px;font-size:.72rem;color:#6B7280">
                <div style="width:10px;height:10px;background:#ECFDF5;border:1.5px solid #10B981;border-radius:2px"></div>Available
              </div>
              <div style="display:flex;align-items:center;gap:6px;font-size:.75rem;color:#6B7280">
                <div style="width:10px;height:10px;background:#FFEBEE;border-radius:2px"></div>Unavailable
              </div>
              <div style="display:flex;align-items:center;gap:6px;font-size:.75rem;color:#6B7280">
                <div style="width:10px;height:10px;background:#FEE2E2;border:1.5px solid #B91C1C;border-radius:2px"></div>Blocked
              </div>
              <div style="display:flex;align-items:center;gap:6px;font-size:.75rem;color:#6B7280">
                <div style="width:10px;height:10px;background:#FFF1F2;border:1.5px solid #fda4af;border-radius:2px"></div>PH Holiday
              </div>
              <div style="display:flex;align-items:center;gap:6px;font-size:.72rem;color:#6B7280">
                <div style="width:6px;height:6px;border-radius:50%;background:#065F46;opacity:.6;margin:3px"></div> Has Appointments
                <!-- The real dot (.has-appts::before, global.css) uses
                     currentColor, so it actually takes on whatever text
                     color the day already has (green on Available, red on
                     Blocked/Holiday) — this swatch shows the common case. -->
              </div>
            </div>
          </div>
        </div>
        <div class="card">
          <div class="card-header"><div class="card-title">Today's Appointments</div></div>
          <div class="card-body" style="padding:0">
            ${docAppts.length
              ? `<table class="tbl"><thead><tr><th>Patient</th><th>Time</th><th>Type</th></tr></thead><tbody>
                  ${docAppts.map(a=>`<tr>
                    <td data-label="Patient" style="font-size:.82rem;font-weight:600">${a.patientName}</td>
                    <td data-label="Time" style="font-size:.78rem;white-space:nowrap">${a.time}</td>
                    <td data-label="Type" style="font-size:.78rem;color:#6B7280">${a.type}</td>
                  </tr>`).join('')}
                </tbody></table>`
              : `<div class="table-empty">No appointments today for this doctor.</div>`}
          </div>
        </div>
      </div>
    </div>`
  }

  const allPanels = allDocs.map(d => buildDocPanel(d)).join('')

  return `
  <div class="page-header">
    <div class="page-header-left">
      <h1 class="page-title">Doctor Schedule</h1>
      <p class="page-subtitle">View and manage doctor availability</p>
    </div>
  </div>
  <div class="page-body">

    <!-- Doctor selector cards -->
    <div class="card" style="margin-bottom:20px">
      <div class="card-body" style="padding:16px">
        <div class="pat-doc-tabs-grid">
          ${allDocs.map(d => `
          <button class="doctor-sel-card sched-tab" data-doc="${d.id}"
                  onclick="window.switchScheduleDoctor('${d.id}')">
            <div class="doc-avatar-wrap">
              <div class="doc-card-avatar" ${d.photoUrl ? 'style="overflow:hidden;padding:0"' : ''}>
                ${d.photoUrl ? `<img src="${d.photoUrl}" alt="${d.name}" style="width:100%;height:100%;object-fit:cover;object-position:top;border-radius:50%;display:block" onerror="${avatarFallbackAttr(d.name)}">` : initials(d.name)}
              </div>
              <span class="doc-avail-badge ${d.available ? 'doc-avail-badge--yes' : 'doc-avail-badge--no'}"
                    title="${d.available ? 'Available' : 'Not available'}">${ic(d.available ? 'check' : 'x', 'icon-xs')}</span>
            </div>
            <div>
              <div class="doc-card-name">${d.name.replace('Dr. ','')}</div>
              <div class="doc-card-spec">${d.specialization}</div>
            </div>
          </button>`).join('')}
        </div>
      </div>
    </div>

    <!-- Per-doctor panels (JS shows/hides) -->
    <div id="sched-panels">${allPanels}</div>

  </div>`
}

// ════════════════════════════════════════════════════════════════
//  ADMIN — REPORTS
// ════════════════════════════════════════════════════════════════
function pageAdminReports() {
  const today      = localDateStr()
  const monthStart = today.slice(0,8) + '01'

  window.state.afterRender = () => {
    // Same real .xlsx approach as the Activity Log export (exportTableAsXlsx,
    // main.js) — a plain CSV always landed in Excel with every column at
    // the same cramped default width and no bold header. This reads
    // whatever <table> is currently on screen (report columns vary by
    // report type, so header/rows are just pulled from the live DOM
    // instead of being hardcoded per type) and auto-sizes each column to
    // its own longest cell, since there's no fixed column set to hand-pick
    // widths for the way the Activity Log export could.
    window.exportReportXlsx = () => {
      const table = document.querySelector('#rpt-table-area table')
      if (!table) {
        // A report can be "generated" and still have no <table> in the DOM
        // — reportTable() (main.js) renders a friendly empty-state message
        // instead of a table when zero records match the filters. rpt-
        // table-header only ever goes visible once generateReport() has
        // actually run, so its display style is what tells apart "never
        // generated anything" from "generated it, just nothing came back."
        const generated = document.getElementById('rpt-table-header')?.style.display === 'block'
        window.toast(generated
          ? 'This report has no records to export.'
          : 'Generate a report first, then export.', 'error')
        return
      }
      const rows   = Array.from(table.querySelectorAll('tr')).map(row =>
        Array.from(row.querySelectorAll('th, td')).map(cell => cell.textContent.trim())
      )
      const header = rows[0] || []
      const body   = rows.slice(1)
      if (!header.length) {
        window.toast('This report has no records to export.', 'error')
        return
      }
      const colWidths = header.map((h, i) => {
        let maxLen = h.length
        body.forEach(r => { const len = (r[i] || '').length; if (len > maxLen) maxLen = len })
        return Math.min(45, Math.max(10, maxLen + 3))
      })
      const label = document.getElementById('rpt-type-text')?.textContent || 'Report'
      const blob  = window.exportTableAsXlsx(label, header, body, colWidths)
      const a = document.createElement('a')
      const url = URL.createObjectURL(blob)
      a.href = url
      a.download = 'canaopticalclinic-' + label.toLowerCase().replace(/[^a-z0-9]+/g, '-') + '.xlsx'
      a.click()
      setTimeout(() => URL.revokeObjectURL(url), 1000)
      window.toast('Report exported to Excel.', 'success')
    }

    // Builds the report's full printable HTML document + a filename
    // following the app-wide CanaOpticalClinic-{Type}-{Identifier}.pdf
    // convention (_pdfFilename(), main.js). Returns null (after its own
    // toast) when there's nothing to build — printReport() and
    // downloadReportPDF() below are both thin wrappers over this: the
    // former hands the full document to _printHtmlDocument(), the latter
    // extracts just <body>'s content and hands that to
    // _downloadLiveContentAsPdf() (styled by the permanent
    // .pdf-report-doc rules in global.css).
    window._buildReportHtml = (action = 'print') => {
      const table = document.querySelector('#rpt-table-area table')
      if (!table) {
        // Same distinction as exportReportXlsx() above — a generated report
        // with zero matching records renders no <table> either, and "generate
        // a report first" is actively wrong to tell someone who just did.
        const generated = document.getElementById('rpt-table-header')?.style.display === 'block'
        window.toast(generated
          ? `This report has no records to ${action}.`
          : `Generate a report first, then ${action}.`, 'error')
        return null
      }

      const typeLabel = document.getElementById('rpt-type-text')?.textContent || 'Report'
      const from = document.getElementById('rpt-from')?.value || ''
      const to   = document.getElementById('rpt-to')?.value || ''
      const ci   = (typeof clinicInfo !== 'undefined') ? clinicInfo : {}
      // The print target is a blank iframe written to via document.write()
      // (see _printHtmlDocument), which has no real base URI — a relative
      // logo path silently fails to load there, so it's resolved to an
      // absolute URL up front, same as the Exam/Rx/Clearance print docs.
      const logoAbsUrl = new URL(window._clinicLogoUrl || 'assets/images/logo/clinic-logo.png', document.baseURI).href
      const fmtD = d => d ? new Date(d).toLocaleDateString('en-PH', { year:'numeric', month:'long', day:'numeric' }) : ''
      const rangePart = (from && to) ? fmtD(from) + ' \u2013 ' + fmtD(to) : from ? 'From ' + fmtD(from) : 'All Dates'
      const now = new Date().toLocaleString('en-PH', { month:'long', day:'numeric', year:'numeric', hour:'numeric', minute:'2-digit', hour12:true })

      // Clone table \u2014 all rows, remove pagination visibility class
      const tClone = table.cloneNode(true)
      tClone.querySelectorAll('.pg-hidden').forEach(r => r.classList.remove('pg-hidden'))
      const rowCount = tClone.querySelectorAll('tbody tr').length

      // The on-screen charts are real Chart.js canvases (renderReportCharts(),
      // main.js) \u2014 rasterizing one to an image prints blurry and isn't
      // text-selectable, so print gets a plain data table restating the
      // exact same numbers instead, built straight from the same
      // _buildReportCharts() data the on-screen charts themselves use
      // (not scraped from the DOM, which only ever holds canvases here).
      const rptKey = document.getElementById('rpt-type')?.value || ''
      const cfg    = rptKey && window._buildReportCharts ? window._buildReportCharts(rptKey, from, to) : null
      const lTableHtml = cfg?.left  ? window._reportChartTableHtml(cfg.left)  : ''
      const rTableHtml = cfg?.right ? window._reportChartTableHtml(cfg.right) : ''
      const lTitle     = cfg?.left?.title  || ''
      const rTitle     = cfg?.right?.title || ''
      const hasCharts  = !!(cfg && (lTableHtml || rTableHtml))

      const chartHTML = hasCharts ? `
        <div class="charts-section">
          <div class="section-header">
            <div class="section-title">Charts &amp; Summaries \u2014 ${typeLabel}</div>
            <div class="section-sub">${rangePart}</div>
          </div>
          <div class="chart-grid">
            ${lTableHtml ? `<div class="chart-box"><div class="chart-label">${lTitle}</div>${lTableHtml}</div>` : ''}
            ${rTableHtml ? `<div class="chart-box"><div class="chart-label">${rTitle}</div>${rTableHtml}</div>` : ''}
          </div>
        </div>` : ''

      const html = `<!DOCTYPE html>
<html lang="en">
<head>
<meta charset="utf-8">
<title>${typeLabel} \u2014 ${ci.name || 'Clinic'}</title>
<style>
  /* A real @page margin (not margin:0 + a manual body padding standing in
     for it) — that padding-based approach looked fine on page 1 but a
     multi-page report's later pages came out with NO margin at all, not
     even left/right, once real content pushed this document past one
     page. @page's own margin is the one box CSS print fragmentation
     spec-guarantees gets reapplied on every page a document spans. */
  @page { size: A4; margin: 16mm 20mm; }
  * { box-sizing: border-box; margin: 0; padding: 0; }
  body { font-family: Arial, Helvetica, sans-serif; font-size: 9pt; color: #111; background: #fff; }

  /* \u2500\u2500 Clinic header \u2500\u2500 */
  .hdr          { display: flex; justify-content: space-between; align-items: flex-start; border-bottom: 2px solid #111; padding-bottom: 10px; margin-bottom: 10px; }
  .hdr-left     { display: flex; align-items: center; gap: 10px; }
  .hdr-logo     { height: 42px; width: 42px; object-fit: contain; flex-shrink: 0; }
  .clinic-name  { font-size: 14pt; font-weight: 700; letter-spacing: -.02em; }
  .clinic-sub   { font-size: 7.5pt; color: #555; margin-top: 3px; }
  .hdr-right    { text-align: right; }
  .hdr-tag      { font-size: 6.5pt; font-weight: 700; text-transform: uppercase; letter-spacing: .08em; color: #888; }

  /* \u2500\u2500 Report meta \u2500\u2500 */
  .rpt-title    { font-size: 11pt; font-weight: 700; margin-bottom: 2px; }
  .rpt-meta     { font-size: 7.5pt; color: #555; margin-bottom: 14px; }
  .rpt-meta span { margin-right: 12px; }

  /* \u2500\u2500 Table \u2500\u2500 */
  table { width: 100%; border-collapse: collapse; font-size: 8pt; }
  thead tr { background: #f3f4f6 !important; }
  th { padding: 6px 8px; text-align: left; font-size: 7.5pt; font-weight: 700; border: 1px solid #d1d5db; background: #f3f4f6; }
  td { padding: 5px 8px; border: 1px solid #e5e7eb; vertical-align: top; line-height: 1.35; }
  tbody tr:nth-child(even) td { background: #fafafa; }
  /* Keeps a single row from being sliced in half across a natural page
     break on longer reports (thead already repeats at the top of each
     new page the table spans — that's a native browser table-print
     behavior, no extra CSS needed for it). */
  tr { page-break-inside: avoid; }
  code { font-family: 'Courier New', monospace; font-size: 7.5pt; }

  /* \u2500\u2500 Badges \u2500\u2500 */
  .badge { display: inline-block; padding: 1px 7px; border-radius: 20px; font-size: 7pt; font-weight: 700; -webkit-print-color-adjust: exact; print-color-adjust: exact; }
  .badge-pending     { background: #FFF3E0; color: #E8891C; }
  .badge-approved    { background: #E8F5E9; color: #2E7D32; }
  .badge-cancelled   { background: #FFEBEE; color: #C62828; }
  .badge-inactive    { background: #FFEBEE; color: #C62828; }
  .badge-disapproved { background: #fef2f2; color: #991b1b; }
  .badge-completed   { background: #F5F5F5; color: #616161; }
  .badge-no-show     { background: #EDE9FE; color: #6D28D9; }
  .badge-active      { background: #E3F2FD; color: #1565C0; }
  .badge-admin       { background: #EDE9FE; color: #5B21B6; }
  .badge-staff       { background: #DBEAFE; color: #1D4ED8; }
  .badge-doctor      { background: #E8F5E9; color: #2E7D32; }
  .badge-patient     { background: #FFF0DC; color: #92400E; }

  /* \u2500\u2500 Charts \u2500\u2500 */
  /* Used to force this section onto its own fresh page every time
     (page-break-before:always), regardless of how little the results
     table above it actually filled — a 1-row table would still burn a
     whole second sheet just for two small summary boxes that easily fit
     in the leftover space on page 1. Plain top spacing instead — normal
     print pagination now flows the section wherever it actually fits,
     right under a short table, or onto a new page on its own if the
     table already filled page 1. tr{page-break-inside:avoid} above still
     protects individual table rows either way, and .chart-box below
     keeps each box's title+table together as one unit. */
  .charts-section { margin-top: 20px; }
  .section-header { border-bottom: 1px solid #ddd; padding-bottom: 8px; margin-bottom: 14px; }
  .section-title  { font-size: 11pt; font-weight: 700; }
  .section-sub    { font-size: 7.5pt; color: #666; margin-top: 2px; }
  .chart-grid   { display: grid; grid-template-columns: 1fr 1fr; gap: 16px; }
  .chart-box    { border: 1px solid #e5e7eb; border-radius: 4px; padding: 12px; page-break-inside: avoid; }
  .chart-label  { font-size: 8.5pt; font-weight: 700; margin-bottom: 8px; }

  /* ── Prepared by ── same sig-line convention as the Exam/Rx print
     documents' doctor signature block, repurposed here to credit whichever
     admin/staff generated this report rather than a clinical signer. */
  /* No page-break-inside:avoid — a short block like this is more likely to
     get shoved onto its own lonely trailing page by "avoid" than to
     actually need protection from a bad mid-block split. */
  .sig-block { margin-top: 28px; padding-top: 14px; border-top: 1px dashed #ccc; display: flex; justify-content: flex-end; }
  .sig-col   { text-align: center; min-width: 200px; }
  .sig-line  { border-top: 1px solid #111; padding-top: 6px; font-size: 8pt; font-weight: 700; text-transform: uppercase; }
  .sig-sub   { font-size: 7pt; color: #888; margin-top: 2px; }

  /* ── Print ──
     No padding reset here — @page above already handles keeping Chrome's
     own header/footer band out; the body's own mm-based padding IS the
     page margin and needs to survive into the actual print, or content
     prints flush to the paper edges instead of matching the margin the
     other print documents use. */
  @media print {
    -webkit-print-color-adjust: exact;
    print-color-adjust: exact;
  }
</style>
</head>
<body>
  <div class="hdr">
    <div class="hdr-left">
      <img src="${logoAbsUrl}" alt="${ci.name || 'Cana Optical Clinic'}" class="hdr-logo" onerror="this.style.display='none'">
      <div>
        <div class="clinic-name">${ci.name || 'Cana Optical Clinic'}</div>
        <div class="clinic-sub">${ci.address || ''}</div>
        <div class="clinic-sub">${[ci.phone ? 'Tel: ' + ci.phone : '', ci.email || ''].filter(Boolean).join('\u2002\u00b7\u2002')}</div>
      </div>
    </div>
    <div class="hdr-right">
      <div class="hdr-tag">Official Report</div>
      <div class="clinic-sub" style="margin-top:4px">Clinic Management System</div>
    </div>
  </div>

  <div class="rpt-title">${typeLabel}</div>
  <div class="rpt-meta">
    <span>Date Range: ${rangePart}</span>
    <span>Total Records: ${rowCount}</span>
    <span>Printed: ${now}</span>
  </div>

  ${tClone.outerHTML}
  ${chartHTML}

  <div class="sig-block">
    <div class="sig-col">
      <div class="sig-line">${st().user?.name || '—'}</div>
      <div class="sig-sub">Prepared by &bull; ${{admin:'Administrator',staff:'Staff',doctor:'Doctor'}[st().role] || st().role || ''}</div>
    </div>
  </div>
</body>
</html>`

      const dateSeg = (from && to) ? `${from}-to-${to}` : from ? `from-${from}` : 'All-Dates'
      return { html, filename: window._pdfFilename(typeLabel, dateSeg) }
    }

    window.printReport = () => {
      const built = window._buildReportHtml('print')
      if (built) window._printHtmlDocument(built.html)
    }

    window.downloadReportPDF = () => {
      const built = window._buildReportHtml('download')
      if (!built) return
      // _buildReportHtml() still builds a full standalone document for
      // _printHtmlDocument()'s own use — only <body>'s inner content is
      // needed here, styled instead by the permanent .pdf-report-doc
      // rules in global.css (same architecture as
      // downloadExamRecordPDF(), main.js).
      const bodyMatch = built.html.match(/<body[^>]*>([\s\S]*?)<\/body>/i)
      if (!bodyMatch) { window.toast('Could not generate the PDF.', 'error'); return }
      window._downloadLiveContentAsPdf(bodyMatch[1], 'pdf-report-doc', built.filename, document.getElementById('rpt-download-btn'))
    }

  }

  return `
  <div class="page-header">
    <div class="page-header-left">
      <h1 class="page-title">Reports</h1>
      <p class="page-subtitle">Generate reports and view trend summaries for clinic operations.</p>
    </div>
  </div>
  <div class="page-body">

    <!-- Filter Card -->
    <div class="card" id="rpt-filter-card" style="margin-bottom:20px;overflow:visible">
      <div style="padding:18px 24px 16px;border-bottom:1px solid #f3f4f6">
        <div style="font-size:.88rem;font-weight:700;color:#111827;line-height:1.2">Generate report</div>
        <div style="font-size:.72rem;color:#9ca3af;margin-top:2px">Select a report type and date range to get started.</div>
      </div>
      <div style="padding:20px 24px">
        <div class="filter-grid">
          <div class="form-group filter-grid-full" style="flex:1;min-width:220px">
            <label style="display:block;font-size:.68rem;font-weight:700;color:#6b7280;margin-bottom:6px">Report type</label>
            ${window.selectFieldHtml('rpt-type', {
              placeholder: 'Select a report type',
              options: [
                { value: 'patient-visit',       label: 'Patient Visit History' },
                { value: 'diagnosis-history',   label: 'Diagnosis History' },
                { value: 'prescription-records',label: 'Prescription Records' },
                { value: 'daily-appointment',   label: 'Daily Appointment Report' },
                { value: 'completed-appts',     label: 'Completed Appointments' },
                { value: 'cancelled-appts',     label: 'Cancelled / Disapproved Appointments' }
              ],
              style: 'height:42px'
            })}
          </div>
          <div class="form-group filter-grid-full">
            <label style="display:block;font-size:.68rem;font-weight:700;color:#6b7280;margin-bottom:6px">Date range</label>
            <div style="display:flex;align-items:center;gap:8px">
              ${window.dateFieldHtml('rpt-from', { value: monthStart, style: 'width:142px' })}
              <span style="font-size:.75rem;color:#9ca3af;font-weight:600;flex-shrink:0">\u2192</span>
              ${window.dateFieldHtml('rpt-to', { value: today, style: 'width:142px' })}
            </div>
          </div>
          <div class="filter-grid-actions" style="display:flex;gap:8px;align-items:center">
            <button class="btn-primary" id="rpt-gen-btn" onclick="window.generateReport()"
                    style="display:flex;align-items:center;gap:7px;padding:10px 22px;height:40px;white-space:nowrap">
              ${ic('bar-chart','icon-sm')} Generate
            </button>
            <button class="btn-secondary rpt-no-print" onclick="window.printReport()"
                    style="display:flex;align-items:center;gap:6px;padding:9px 16px;height:40px">
              ${ic('printer','icon-sm')} Print
            </button>
            <button class="rpt-no-print" onclick="window.resetReport()" title="Reset"
                    style="width:40px;height:40px;background:none;border:1.5px solid #e5e7eb;padding:0;cursor:pointer;
                           font-family:'Poppins',sans-serif;border-radius:8px;display:flex;align-items:center;
                           justify-content:center;color:#9ca3af;transition:all .15s"
                    onmouseenter="this.style.background='#f9fafb';this.style.color='#374151'"
                    onmouseleave="this.style.background='none';this.style.color='#9ca3af'">
              ${ic('x','icon-sm')}
            </button>
          </div>
        </div>
      </div>
    </div>

    <!-- Report Results Wrap -->
    <div class="card" id="rpt-results-wrap" style="margin-bottom:20px;overflow:hidden">
      <div id="rpt-table-header" style="display:none;padding:18px 22px 14px;border-bottom:1px solid #f3f4f6"></div>
      <div id="rpt-table-area">
        <div style="text-align:center;padding:56px 24px">
          <div style="font-size:.92rem;font-weight:600;color:#374151;margin-bottom:6px">No report generated yet.</div>
          <div style="font-size:.8rem;color:#9ca3af;max-width:280px;margin:0 auto;line-height:1.6">
            Choose a report type and date range above, then click <strong style="color:#6b7280">Generate</strong>.
          </div>
        </div>
      </div>
    </div>

    <!-- Charts Section (hidden until report generated) -->
    <div id="rpt-trends-section" style="display:none">
      <div style="margin-bottom:16px;padding-bottom:14px;border-bottom:1px solid #f3f4f6">
        <div style="font-size:.88rem;font-weight:700;color:#111827">Charts &amp; visual summaries</div>
        <div style="font-size:.72rem;color:#9ca3af;margin-top:2px">Graphical breakdown of the report data above.</div>
      </div>

      <div class="grid-2" style="margin-bottom:16px">
        <div class="card" style="overflow:hidden">
          <div style="padding:4px 0 0 0;border-left:4px solid #E8760A">
            <div class="card-header" style="padding-left:20px"><div><div class="card-title" id="rpt-chart-left-title">&nbsp;</div></div></div>
          </div>
          <div class="card-body">
            <div style="height:260px;position:relative" id="rpt-chart-left-wrap"><canvas id="rpt-chart-left"></canvas></div>
          </div>
        </div>
        <div class="card" style="overflow:hidden">
          <div style="padding:4px 0 0 0;border-left:4px solid #2563EB">
            <div class="card-header" style="padding-left:20px"><div><div class="card-title" id="rpt-chart-right-title">&nbsp;</div></div></div>
          </div>
          <div class="card-body">
            <div style="height:260px;position:relative" id="rpt-chart-right-wrap"><canvas id="rpt-chart-right"></canvas></div>
          </div>
        </div>
      </div>
    </div>

  </div>`
}

// ════════════════════════════════════════════════════════════════
//  ADMIN — SETTINGS
// ════════════════════════════════════════════════════════════════
function pageAdminSettings() {
  const validSections = ['profile', 'clinic', 'services', 'consultation', 'terms', 'archives']
  const sec = validSections.includes(st().filter) ? st().filter : 'profile'

  // ── Section: My Profile ──────────────────────────────────────
  function sectionProfile() {
    const { user } = st()
    const adm = admins.find(a => a.id === user?.id) || user || {}
    const admName = adm.name || `${adm.firstName || ''} ${adm.lastName || ''}`.trim() || 'Administrator'

    const pwField = (id, placeholder, extra='') => `
      <div style="position:relative">
        <input type="password" class="form-input" id="${id}" placeholder="${placeholder}" style="padding-right:40px" autocomplete="off" readonly onfocus="this.removeAttribute('readonly')" ${extra}>
        <button type="button" onclick="window.togglePwVisibility('${id}',this)"
                style="position:absolute;right:10px;top:50%;transform:translateY(-50%);background:none;border:none;cursor:pointer;color:#9CA3AF;padding:2px;display:flex;align-items:center">
          ${ic('eye-off','icon-sm')}
        </button>
      </div>`

    return `
    <style>
      @media (min-width: 1024px) { .ad-sett-col { display: grid !important; grid-template-columns: 55fr 45fr; gap: 20px; align-items: start; } }
    </style>
    <div class="page-header">
      <div class="page-header-left">
        <h1 class="page-title">My Profile</h1>
        <p class="page-subtitle">Manage your personal account details.</p>
      </div>
    </div>
    <div class="page-body">

      <!-- Profile Banner -->
      <div class="card" style="padding:28px 32px;margin-bottom:20px">
        <div style="display:flex;align-items:center;gap:24px;flex-wrap:wrap">
          ${window.profilePhotoEditorHtml('ad', admName, user.photoUrl)}
          <div style="flex:1;min-width:160px">
            <div style="font-size:1.2rem;font-weight:700;color:#1C1C1C">${admName}</div>
            <div style="font-size:.85rem;color:#E8760A;font-weight:600;margin-top:3px">Administrator</div>
            <div style="font-size:.82rem;color:#6B7280;margin-top:4px">${adm.email || ''}</div>
            <div style="font-size:.82rem;color:#6B7280">${adm.contact || ''}</div>
          </div>
          <div style="display:flex;gap:8px;flex-shrink:0">
            <label for="ad-photo-input" class="btn-secondary" style="cursor:pointer">
              ${ic('camera','icon-sm')} Change Photo
            </label>
            ${window.removePhotoBtnHtml('ad', admName, user.photoUrl)}
          </div>
        </div>
      </div>

      <div class="ad-sett-col" style="display:flex;flex-direction:column;gap:20px">

        <!-- LEFT: Personal Info -->
        <div class="card" style="padding:28px">
          <div style="display:flex;align-items:center;gap:8px;margin-bottom:20px">
            <div style="color:#E8760A">${ic('user','icon-sm')}</div>
            <div style="font-size:1.05rem;font-weight:700;color:#1C1C1C">Personal Information</div>
          </div>
          <div style="display:flex;flex-direction:column;gap:14px">
            <div class="form-row-2">
              <div class="form-group">
                <label class="form-label">First Name</label>
                <input class="form-input" id="ad-fname" value="${adm.firstName || ''}">
              </div>
              <div class="form-group">
                <label class="form-label">Middle Name</label>
                <input class="form-input" id="ad-mname" value="${adm.middleName || ''}">
              </div>
            </div>
            <div class="form-group">
              <label class="form-label">Last Name</label>
              <input class="form-input" id="ad-lname" value="${adm.lastName || ''}">
            </div>
            <div class="form-row-2">
              <div class="form-group">
                <label class="form-label">Email Address</label>
                <input class="form-input" type="email" id="ad-email" value="${adm.email || ''}">
              </div>
              <div class="form-group">
                <label class="form-label">Phone Number</label>
                <input class="form-input" id="ad-phone" inputmode="numeric" maxlength="13" oninput="window.formatContactInput(this)" value="${adm.contact || ''}">
              </div>
            </div>
            <div style="display:flex;justify-content:flex-end;margin-top:4px">
              <button class="btn-primary" onclick="window.saveUserProfile(this)">
                ${ic('check','icon-sm')} Save Changes
              </button>
            </div>
          </div>
        </div>

        <!-- RIGHT: Security -->
        <div class="card" style="padding:28px">
          <div style="display:flex;align-items:center;gap:8px;margin-bottom:4px">
            <div style="color:#E8760A">${ic('shield','icon-sm')}</div>
            <div style="font-size:1.05rem;font-weight:700;color:#1C1C1C">Security</div>
          </div>
          <div style="font-size:.82rem;color:#9CA3AF;margin-bottom:20px">Change your account password</div>
          <div style="display:flex;flex-direction:column;gap:14px">
            <div class="form-group">
              <label class="form-label">Current Password</label>
              ${pwField('ad-curpw','Enter current password', `oninput="window.updateSettingsPwGate('ad')"`)}
            </div>
            <div class="form-group">
              <label class="form-label">New Password</label>
              ${pwField('ad-newpw','Minimum 8 characters', `oninput="window.updatePwChecklist('ad-newpw', this.value);window.updateSettingsPwGate('ad')"`)}
              ${window.pwChecklistHtml('ad-newpw')}
            </div>
            <div class="form-group">
              <label class="form-label">Confirm New Password</label>
              ${pwField('ad-confpw','Repeat new password', `oninput="window.updateSettingsPwGate('ad')"`)}
              <div id="ad-pw-err" class="field-error">Passwords do not match.</div>
            </div>
            <div style="display:flex;align-items:flex-start;gap:6px;font-size:.78rem;color:#9CA3AF">
              ${ic('info','icon-sm')} Can't reuse a previous password.
            </div>
            <div style="display:flex;justify-content:flex-end">
              <button id="ad-pw-btn" class="btn-primary" disabled style="opacity:.55;cursor:not-allowed"
                      onclick="window.validateSettingsPassword('ad-newpw','ad-confpw','ad-pw-err','ad-curpw')">
                ${ic('lock','icon-sm')} Update Password
              </button>
            </div>
          </div>
        </div>

      </div>

    </div>`
  }

  // ── Section: Clinic Information ─────────────────────────────
  function sectionClinic() {
    setTimeout(() => window.loadGalleryAdmin && window.loadGalleryAdmin(), 40);
    return `
    <div class="page-header">
      <div class="page-header-left">
        <h1 class="page-title">Clinic Information</h1>
        <p class="page-subtitle">Manage clinic details displayed across the system.</p>
      </div>
    </div>
    <div class="page-body">
      <div class="card" style="padding:28px 32px">
        <div style="display:flex;flex-direction:column;gap:16px">
          <div class="form-row-2">
            <div class="form-group">
              <label class="form-label">Clinic Name <span class="req">*</span></label>
              <input class="form-input" id="ci-name" value="${clinicInfo.name.replace(/"/g,'&quot;')}">
              <div style="font-size:.72rem;color:#9CA3AF;margin-top:5px">Displayed as the logo name across all pages, the loader, and auth screens.</div>
            </div>
            <div class="form-group">
              <label class="form-label">Contact Number</label>
              <input class="form-input" id="ci-phone" inputmode="numeric" maxlength="13" oninput="window.formatContactInput(this)" value="${clinicInfo.phone.replace(/"/g,'&quot;')}">
            </div>
          </div>
          <div class="form-group">
            <label class="form-label">Clinic Address</label>
            <input class="form-input" id="ci-address" value="${clinicInfo.address.replace(/"/g,'&quot;')}">
          </div>
          <div class="form-row-2">
            <div class="form-group">
              <label class="form-label">Email Address <span class="req">*</span></label>
              <input class="form-input" type="email" id="ci-email" value="${clinicInfo.email.replace(/"/g,'&quot;')}">
            </div>
            <div class="form-group">
              <label class="form-label">Operating Hours</label>
              <input class="form-input" id="ci-hours" value="${clinicInfo.hours.replace(/"/g,'&quot;')}">
            </div>
          </div>
          <div class="form-row-2">
            <div class="form-group">
              <label class="form-label">Google Maps Embed URL</label>
              <input class="form-input" id="ci-map-embed" placeholder="Paste the Google Maps embed code or src URL…" value="${(clinicInfo.mapEmbedUrl || '').replace(/"/g,'&quot;')}">
              <div style="font-size:.72rem;color:#9CA3AF;margin-top:5px">Google Maps → Share → Embed a map → paste the full embed code or just the src URL.</div>
            </div>
            <div class="form-group">
              <label class="form-label">Founded Year</label>
              <input class="form-input" type="number" id="ci-founded-year" min="1900" max="${new Date().getFullYear()}" placeholder="e.g. 2008" value="${clinicInfo.foundedYear || ''}">
              <div style="font-size:.72rem;color:#9CA3AF;margin-top:5px">Used to calculate "Years of Service" on the public website.</div>
            </div>
          </div>
        </div>

        <div style="border-top:1px solid #F3F4F6;margin:20px 0 16px"></div>
        <div style="font-size:.85rem;font-weight:600;color:#374151;margin-bottom:12px">Clinic Video</div>
        <div style="display:flex;align-items:center;gap:16px">
          <div style="width:96px;height:54px;border-radius:8px;overflow:hidden;flex-shrink:0;background:#111;border:1.5px solid #E5E7EB;display:flex;align-items:center;justify-content:center;color:#6B7280">
            ${clinicInfo.videoUrl ? `<video src="${clinicInfo.videoUrl}" style="width:100%;height:100%;object-fit:cover" muted></video>` : ic('camera','icon-sm')}
          </div>
          <div>
            <div style="display:flex;gap:8px;align-items:center">
              <label for="ci-video-input" style="cursor:pointer">
                <div class="btn-secondary" style="display:inline-flex;align-items:center;gap:6px;font-size:.8rem;padding:7px 14px">
                  ${ic('upload','icon-sm')} ${clinicInfo.videoUrl ? 'Replace Video' : 'Upload Video'}
                </div>
              </label>
              ${clinicInfo.videoUrl ? `<button class="btn-ghost" style="font-size:.8rem;padding:7px 10px;color:#DC2626" onclick="window.removeClinicVideo()">${ic('trash-2','icon-sm')} Remove</button>` : ''}
            </div>
            <div style="font-size:.72rem;color:#9CA3AF;margin-top:4px">MP4 or WebM, up to 2GB. Shown as a video player on the public homepage — leave unset to hide the section.</div>
            <input type="file" id="ci-video-input" accept="video/mp4,video/webm" style="display:none"
                   onchange="window.handleVideoUpload(this)">
          </div>
        </div>

        <div style="border-top:1px solid #F3F4F6;margin:20px 0 16px"></div>
        <div style="font-size:.85rem;font-weight:600;color:#374151;margin-bottom:12px">Clinic Logo</div>
        <div style="display:flex;align-items:center;gap:16px">
          <div style="width:60px;height:60px;border-radius:50%;background:#FFF0DC;border:1.5px solid #FFD9A8;display:flex;align-items:center;justify-content:center;overflow:hidden;flex-shrink:0">
            <img id="ci-logo-preview" src="${clinicInfo.logoUrl || 'assets/images/logo/clinic-logo.png'}" style="width:50px;height:50px;object-fit:contain">
          </div>
          <div>
            <label for="ci-logo-input" style="cursor:pointer">
              <div class="btn-secondary" style="display:inline-flex;align-items:center;gap:6px;font-size:.8rem;padding:7px 14px">
                ${ic('upload','icon-sm')} Upload New Logo
              </div>
            </label>
            <div style="font-size:.72rem;color:#9CA3AF;margin-top:4px">PNG, JPG, SVG</div>
            <input type="file" id="ci-logo-input" accept="image/*" style="display:none"
                   onchange="window.handleLogoUpload(this,'ci-logo-preview')">
          </div>
        </div>

        <div style="border-top:1px solid #F3F4F6;margin:20px 0 16px"></div>
        <div style="font-size:.85rem;font-weight:600;color:#374151;margin-bottom:12px">Hero Background</div>
        <div style="display:flex;align-items:center;gap:16px">
          <div style="width:96px;height:54px;border-radius:8px;overflow:hidden;flex-shrink:0;background:#F3F4F6;border:1.5px solid #E5E7EB">
            <img id="ci-hero-preview" src="${clinicInfo.heroUrl || ''}" style="width:100%;height:100%;object-fit:cover;${clinicInfo.heroUrl ? '' : 'display:none'}">
          </div>
          <div>
            <label for="ci-hero-input" style="cursor:pointer">
              <div class="btn-secondary" style="display:inline-flex;align-items:center;gap:6px;font-size:.8rem;padding:7px 14px">
                ${ic('upload','icon-sm')} Upload Hero Image
              </div>
            </label>
            <div style="font-size:.72rem;color:#9CA3AF;margin-top:4px">PNG, JPG, WebP — recommended 1920×1080</div>
            <input type="file" id="ci-hero-input" accept="image/png,image/jpeg,image/webp" style="display:none"
                   onchange="window.handleHeroUpload(this)">
          </div>
        </div>

        <div style="display:flex;justify-content:flex-end;margin-top:24px">
          <button class="btn-primary" onclick="window.saveClinicInfo()">
            ${ic('check','icon-sm')} Save Changes
          </button>
        </div>
      </div>

      <!-- About Gallery -->
      <div class="card" style="margin-top:16px">
        <div class="card-header" style="padding:16px 20px;flex-wrap:wrap;gap:10px;row-gap:10px">
          <div style="display:flex;align-items:center;gap:10px">
            <div>
              <div class="card-title" style="font-size:.88rem">About Gallery</div>
              <div class="card-subtitle">Photos in the carousel on the public homepage.</div>
            </div>
          </div>
          <div style="display:flex;align-items:center;gap:8px;margin-left:auto">
            <span style="font-size:.72rem;color:#6B7280;font-weight:500;white-space:nowrap">Show max</span>
            <div style="display:flex;align-items:center;border:1.5px solid #E5E7EB;border-radius:8px;overflow:hidden;background:#fff;height:30px">
              <button onclick="window.galleryMaxAdjust(-1)"
                      style="width:28px;height:30px;border:none;border-right:1.5px solid #E5E7EB;background:transparent;cursor:pointer;color:#6B7280;font-size:1.1rem;font-weight:600;display:flex;align-items:center;justify-content:center;transition:background 0.15s"
                      onmouseover="this.style.background='#F3F4F6'" onmouseout="this.style.background='transparent'">−</button>
              <input type="number" id="gallery-max-input" min="1" max="20"
                     value="${clinicInfo.galleryMaxPhotos ?? 10}"
                     style="width:30px;border:none;outline:none;text-align:center;font-size:.82rem;font-weight:700;color:#111827;background:transparent;padding:0">
              <button onclick="window.galleryMaxAdjust(1)"
                      style="width:28px;height:30px;border:none;border-left:1.5px solid #E5E7EB;background:transparent;cursor:pointer;color:#6B7280;font-size:1.1rem;font-weight:600;display:flex;align-items:center;justify-content:center;transition:background 0.15s"
                      onmouseover="this.style.background='#F3F4F6'" onmouseout="this.style.background='transparent'">+</button>
            </div>
            <button class="btn-primary" style="padding:0 14px;font-size:.78rem;height:30px;border-radius:8px;white-space:nowrap" onclick="window.saveGalleryMax()">Save</button>
          </div>
        </div>
        <div style="padding:16px 20px">
          <div id="gallery-admin-grid">
            <div style="color:#9CA3AF;font-size:.78rem;grid-column:1/-1;text-align:center;padding:20px 0">Loading…</div>
          </div>
          <div style="display:flex;align-items:center;gap:10px;padding-top:12px;margin-top:12px;border-top:1px solid #F3F4F6;flex-wrap:wrap">
            <label id="gallery-upload-label" for="gallery-upload-input" style="cursor:pointer;flex-shrink:0">
              <div class="btn-secondary" style="display:inline-flex;align-items:center;gap:6px;font-size:.8rem;padding:6px 14px">
                ${ic('upload','icon-sm')} Add Photo
              </div>
            </label>
            <span id="gallery-type-hint" style="font-size:.72rem;color:#9CA3AF">PNG or JPG</span>
            <span id="gallery-limit-msg" style="font-size:.72rem;color:#EF4444;display:none">Limit reached — remove a photo first.</span>
            <input type="file" id="gallery-upload-input" accept=".png,.jpg,.jpeg" style="display:none"
                   onchange="window.galleryUploadPhoto(this)">
            <button id="gallery-sel-btn" onclick="window.galleryToggleSelMode()"
                    style="margin-left:auto;font-size:.8rem;font-weight:600;color:#6B7280;background:none;border:1.5px solid #E5E7EB;border-radius:20px;padding:6px 16px;cursor:pointer;font-family:inherit;transition:color .15s,border-color .15s,background .15s;display:flex;align-items:center;gap:6px"
                    onmouseover="this.style.borderColor='#D1D5DB';this.style.background='#F9FAFB'" onmouseout="this.style.borderColor='#E5E7EB';this.style.background='none'">
              <svg width="14" height="14" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2.5" stroke-linecap="round" stroke-linejoin="round"><path d="M9 11l3 3L22 4"/><path d="M21 12v7a2 2 0 01-2 2H5a2 2 0 01-2-2V5a2 2 0 012-2h11"/></svg>
              Select
            </button>
          </div>
        </div>
      </div>
    </div>`
  }

  // ── Section: Services ────────────────────────────────────────
  function sectionServices() {
    setTimeout(() => window.loadServicesAdmin && window.loadServicesAdmin(), 40)
    return `
    <div class="page-header">
      <div class="page-header-left">
        <h1 class="page-title">Services Management</h1>
        <p class="page-subtitle">Configure the appointment types and services offered by the clinic.</p>
      </div>
    </div>
    <div class="page-body">

      <!-- Add New Service form -->
      <div class="card" style="padding:20px 24px;margin-bottom:16px">
        <div style="display:flex;align-items:center;gap:6px;font-size:.9rem;font-weight:700;color:#1C1C1C;margin-bottom:16px">${ic('plus','icon-sm')} Add New Service</div>
        <div class="form-row-2">
          <div class="form-group" style="margin-bottom:10px">
            <label class="form-label">Service Name <span class="req">*</span></label>
            <input class="form-input" id="svc-name" placeholder="e.g. Eye Examination">
          </div>
          <div class="form-group" style="margin-bottom:10px">
            <label class="form-label">Description</label>
            <input class="form-input" id="svc-desc" placeholder="Brief description of the service">
          </div>
        </div>
        <div style="font-size:.72rem;color:#9CA3AF;margin-bottom:14px">
          Bookable services appear as an appointment type on Book Appointment. Patient Visible also controls the public Services page: turn it off for an internal, staff-only type (like Follow-up Consultation), or turn Bookable off instead for a service you only want to list publicly, not offer online.
        </div>
        <div class="form-row-3" style="margin-bottom:16px;grid-template-columns:110px minmax(0,1.15fr) minmax(0,1fr)">
          <div class="form-group" style="margin-bottom:0">
            <label class="form-label">Status</label>
            ${window.selectFieldHtml('svc-status', { value: 'active', options: [{ value: 'active', label: 'Active' }, { value: 'inactive', label: 'Inactive' }] })}
          </div>
          <div class="form-group" style="margin-bottom:0">
            <label class="form-label">Bookable</label>
            ${window.selectFieldHtml('svc-bookable', { value: '1', options: [{ value: '1', label: 'Yes, offered as an appointment type' }, { value: '0', label: 'No, display only' }] })}
          </div>
          <div class="form-group" style="margin-bottom:0">
            <label class="form-label">Patient Visible</label>
            ${window.selectFieldHtml('svc-patient-visible', { value: '1', options: [{ value: '1', label: 'Yes, shown to patients too' }, { value: '0', label: 'No, staff/admin only' }] })}
          </div>
        </div>
        ${window.svcIconPickerHtml('svc-icon', 'eye')}
        <div style="display:flex;justify-content:flex-end;margin-top:16px">
          <button class="btn-primary" onclick="window.addService()">
            ${ic('plus','icon-sm')} Add Service
          </button>
        </div>
      </div>

      <!-- Services card grid (gallery-style) -->
      <div class="card" style="padding:0;overflow:hidden">
        <div style="display:flex;align-items:center;justify-content:space-between;padding:14px 20px;border-bottom:1px solid #F3F4F6">
          <span id="svc-count" style="font-size:.85rem;font-weight:600;color:#374151">${CLINIC_SERVICES.length} service${CLINIC_SERVICES.length !== 1 ? 's' : ''}</span>
          <div style="display:flex;gap:8px;align-items:center">
            <span style="font-size:.72rem;color:#9CA3AF">Drag to reorder</span>
            <button id="svc-sel-btn" onclick="window.svcToggleSelMode()"
                    style="display:flex;align-items:center;gap:5px;font-size:.75rem;font-weight:500;color:#6B7280;background:none;border:1.5px solid #E5E7EB;border-radius:7px;padding:5px 11px;cursor:pointer;font-family:inherit;transition:background .12s,color .12s,border-color .12s">
              ${ic('check-circle','icon-sm')} Select
            </button>
          </div>
        </div>
        <div style="padding:16px 20px">
          <div id="services-admin-grid" style="display:grid;grid-template-columns:repeat(4,1fr);gap:16px">
            <div style="color:#9CA3AF;font-size:.78rem;grid-column:1/-1;text-align:center;padding:20px 0">Loading…</div>
          </div>
        </div>
      </div>
    </div>`
  }

  // ── Section: Consultation Settings ──────────────────────────
  function sectionConsultation() {
    const cs = consultationSettings
    // Returns a plain array of "h:mm AM/PM" labels for timeFieldHtml()'s
    // popover list (not <option> HTML — the native <select> these used to
    // build for was swallowing most of the viewport height with 30+ options).
    // Now just the shared window.clinicTimeOpts() (main.js) — also used by
    // openSetScheduleModal()'s per-doctor Start/End Time pickers, so a
    // doctor's own schedule always offers the exact same selectable times
    // as the clinic's own hours setup here, with one definition to keep
    // them in sync instead of two that could drift apart.
    function timeOpts() {
      return window.clinicTimeOpts()
    }
    // Reminder Send Time / Confirmation Deadline aren't clinic operating
    // hours — they're just "when does a notification fire" — so unlike
    // timeOpts() above (deliberately capped to a plausible 7 AM–9:30 PM
    // business-hours window for the open/close pickers), this covers the
    // full day so any time, including noon, is selectable.
    function fullTimeOpts() {
      const slots = []
      for (let h = 0; h <= 23; h++) {
        for (const m of [0, 30]) {
          const hh   = h % 12 === 0 ? 12 : h % 12
          const ampm = h < 12 ? 'AM' : 'PM'
          slots.push(`${hh}:${m === 0 ? '00' : '30'} ${ampm}`)
        }
      }
      return slots
    }
    const durationOpts = ['15 min','20 min','25 min','30 min','35 min','40 min','45 min','50 min','55 min','60 min']
    const maxAdvOpts   = ['1 week','2 weeks','1 month','2 months','3 months']
    const minAdvOpts   = ['Same day','1 day','2 days','3 days']
    const allDays      = ['Monday','Tuesday','Wednesday','Thursday','Friday','Saturday','Sunday']
    return `
    <div class="page-header">
      <div class="page-header-left">
        <h1 class="page-title">Consultation Settings</h1>
        <p class="page-subtitle">Configure appointment scheduling rules and clinic policies.</p>
      </div>
    </div>
    <div class="page-body" style="display:flex;flex-direction:column;gap:16px">

      <!-- Scheduling Rules -->
      <div class="card" style="padding:20px 24px">
        <div style="font-size:.9rem;font-weight:700;color:#1C1C1C;margin-bottom:4px">Scheduling Rules</div>
        <div style="font-size:.78rem;color:#9CA3AF;margin-bottom:16px">Set default scheduling parameters for the clinic.</div>
        <div class="form-row-2">
          <div class="form-group" style="margin-bottom:12px">
            <label class="form-label">Default Consultation Duration</label>
            ${window.selectFieldHtml('cs-duration', { value: cs.defaultDuration || '45 min', options: durationOpts })}
            <div style="font-size:.72rem;color:#9CA3AF;margin-top:4px">Default time allocated per appointment slot.</div>
          </div>
          <div class="form-group" style="margin-bottom:12px">
            <label class="form-label">Maximum Advance Booking</label>
            ${window.selectFieldHtml('cs-adv-max', { value: cs.maxAdvanceBooking, options: maxAdvOpts })}
            <div style="font-size:.72rem;color:#9CA3AF;margin-top:4px">How far in advance patients can book appointments.</div>
          </div>
          <div class="form-group" style="margin-bottom:0">
            <label class="form-label">Minimum Advance Booking</label>
            ${window.selectFieldHtml('cs-adv-min', { value: cs.minAdvanceBooking, options: minAdvOpts })}
            <div style="font-size:.72rem;color:#9CA3AF;margin-top:4px">Earliest a patient can book before the appointment date.</div>
          </div>
          <div class="form-group" style="margin-bottom:0">
            <label class="form-label">Max Appointments Per Doctor Per Day</label>
            <input class="form-input" type="number" id="cs-max-appt" value="${cs.maxApptsPerDoctorPerDay}" min="1" max="50">
            <div style="font-size:.72rem;color:#9CA3AF;margin-top:4px">Limits the number of appointments a doctor can receive per day.</div>
          </div>
          <div class="form-group" style="margin-bottom:0">
            <label class="form-label">Reminder Send Time</label>
            ${window.timeFieldHtml('cs-reminder-time', { value: cs.reminderTime || '12:00 PM', options: fullTimeOpts() })}
            <div style="font-size:.72rem;color:#9CA3AF;margin-top:4px">When the day-before reminder is sent for approved appointments.</div>
          </div>
          <div class="form-group" style="margin-bottom:0">
            <label class="form-label">Confirmation Deadline</label>
            ${window.timeFieldHtml('cs-confirm-deadline', { value: cs.confirmDeadlineTime || '9:00 PM', options: fullTimeOpts() })}
            <div style="font-size:.72rem;color:#9CA3AF;margin-top:4px">Same-day cutoff to confirm attendance before auto-cancellation.</div>
          </div>
          <div class="form-group" style="margin-bottom:0">
            <label class="form-label">Waitlist Claim Window (hours)</label>
            <input class="form-input" type="number" id="cs-waitlist-hours" value="${cs.waitlistOfferHours || 3}" min="1" max="24">
            <div style="font-size:.72rem;color:#9CA3AF;margin-top:4px">How long a freed slot stays claimable, and how close to the appointment a waitlist entry can still be offered one.</div>
          </div>
        </div>
        <div style="display:flex;justify-content:flex-end;margin-top:16px">
          <button class="btn-primary" onclick="window.saveSchedulingRules()">
            ${ic('check','icon-sm')} Save Scheduling Rules
          </button>
        </div>
      </div>

      <!-- Operating Hours -->
      <div class="card" style="padding:20px 24px">
        <div style="font-size:.9rem;font-weight:700;color:#1C1C1C;margin-bottom:4px">Clinic Operating Hours</div>
        <div style="font-size:.78rem;color:#9CA3AF;margin-bottom:16px">Set the standard consultation hours for the clinic.</div>

        <div class="form-row-2" style="margin-bottom:12px">
          <div class="form-group" style="margin-bottom:0">
            <label class="form-label">Clinic Opens (Morning Start)</label>
            ${window.timeFieldHtml('cs-am-start', { value: cs.morningStart, options: timeOpts() })}
          </div>
          <div class="form-group" style="margin-bottom:0">
            <label class="form-label">Clinic Closes (Afternoon End)</label>
            ${window.timeFieldHtml('cs-pm-end', { value: cs.afternoonEnd, options: timeOpts() })}
          </div>
        </div>

        <label class="cs-lunch-toggle">
          <input type="checkbox" id="cs-lunch-break" class="chk" ${cs.lunchBreak ? 'checked' : ''}
                 onchange="
                   const lb = this.checked;
                   document.getElementById('cs-lunch-fields').style.display = lb ? 'grid' : 'none';
                   document.getElementById('cs-no-break-hint').style.display = lb ? 'none' : 'inline-flex';
                 ">
          <span>Lunch break between sessions</span>
        </label>
        <div id="cs-no-break-hint" style="display:${cs.lunchBreak ? 'none' : 'inline-flex'};align-items:center;gap:6px;font-size:.72rem;font-weight:600;color:#B45309;background:#FFF8F0;border:1px solid #FFD9A8;border-radius:20px;padding:5px 12px 5px 10px;margin-top:6px;margin-left:22px;margin-bottom:12px">
          ${ic('alert-circle','icon-sm')}
          The clinic runs as one continuous session with no break in between.
        </div>
        <div id="cs-lunch-fields" class="form-row-2" style="display:${cs.lunchBreak ? 'grid' : 'none'};margin-top:10px;margin-bottom:16px">
          <div class="form-group" style="margin-bottom:0">
            <label class="form-label">Break Start</label>
            ${window.timeFieldHtml('cs-am-end', { value: cs.morningEnd, options: timeOpts() })}
          </div>
          <div class="form-group" style="margin-bottom:0">
            <label class="form-label">Break End</label>
            ${window.timeFieldHtml('cs-pm-start', { value: cs.afternoonStart, options: timeOpts() })}
          </div>
        </div>

        <div style="font-size:.8rem;font-weight:600;color:#374151;margin-bottom:8px">Clinic Days</div>
        <div class="cs-day-pills">
          ${allDays.map(d => { const on = cs.clinicDays.includes(d); return `
          <label class="cs-day-pill${on ? ' active' : ''}">
            <input type="checkbox" class="cs-clinic-day" value="${d}" ${on ? 'checked' : ''}
                   onchange="this.closest('label').classList.toggle('active', this.checked)">
            <span class="cs-day-pill-check">${ic('check','icon-xs')}</span>
            ${d.slice(0,3)}
          </label>`}).join('')}
        </div>
        <div style="font-size:.72rem;color:#9CA3AF;margin-bottom:16px">Days the clinic is open for consultations. Individual doctor schedules may vary.</div>

        <div style="display:flex;justify-content:flex-end">
          <button class="btn-primary" onclick="window.saveOperatingHours()">
            ${ic('check','icon-sm')} Save Operating Hours
          </button>
        </div>
      </div>
    </div>`
  }

  // ── Section: Terms & Policies ────────────────────────────────
  // Shared builder for a markdown-editor document card + its preview card —
  // Terms & Conditions and Appointment Policy are structurally identical,
  // just different ids/labels/content/save-handler.
  function mdDocEditor({ docTitle, docHint, taId, previewId, content, saveFn, saveLabel }) {
    const escTa = s => String(s ?? '').replace(/&/g,'&amp;').replace(/</g,'&lt;')
    return `
      <div class="card" style="padding:20px 24px">
        <div style="font-size:.9rem;font-weight:700;color:#1C1C1C;margin-bottom:4px">${docTitle}</div>
        <div style="font-size:.78rem;color:#9CA3AF;margin-bottom:10px">${docHint}</div>
        <div style="display:flex;flex-wrap:wrap;gap:8px;margin-bottom:16px">
          <span style="display:inline-flex;align-items:center;padding:4px 12px;border-radius:999px;font-size:.72rem;font-weight:600;background:#EFF6FF;color:#1D4ED8;white-space:nowrap">## (Heading text) → heading</span>
          <span style="display:inline-flex;align-items:center;padding:4px 12px;border-radius:999px;font-size:.72rem;font-weight:600;background:#EFF6FF;color:#1D4ED8;white-space:nowrap">Blank line → new paragraph</span>
          <span style="display:inline-flex;align-items:center;padding:4px 12px;border-radius:999px;font-size:.72rem;font-weight:600;background:#EFF6FF;color:#1D4ED8;white-space:nowrap">- (item text) → bullet point</span>
          <span style="display:inline-flex;align-items:center;padding:4px 12px;border-radius:999px;font-size:.72rem;font-weight:600;background:#FFF7ED;color:#C2410C;white-space:nowrap">&gt; (note text) → highlighted callout</span>
        </div>
        <textarea class="form-input" id="${taId}" rows="16"
                   style="font-family:'SFMono-Regular',Consolas,monospace;font-size:.82rem;line-height:1.6;resize:vertical"
                   oninput="window._mdPreviewUpdate('${taId}','${previewId}')">${escTa(content)}</textarea>
        <div style="display:flex;justify-content:flex-end;margin-top:16px">
          <button class="btn-primary" onclick="window.${saveFn}()">
            ${ic('check','icon-sm')} ${saveLabel}
          </button>
        </div>
      </div>

      <div class="card" style="padding:20px 24px">
        <div style="font-size:.9rem;font-weight:700;color:#1C1C1C;margin-bottom:4px">Preview</div>
        <div style="font-size:.78rem;color:#9CA3AF;margin-bottom:12px">Exactly what patients will see.</div>
        <div class="terms-body" id="${previewId}" style="max-height:420px;overflow:auto;border:1px solid #F3F4F6;border-radius:8px;padding:16px"></div>
      </div>`
  }

  function sectionTerms() {
    window.state.afterRender = () => {
      window._mdPreviewUpdate('terms-md-input', 'terms-md-preview')
      window._mdPreviewUpdate('privacy-md-input', 'privacy-md-preview')
      window._mdPreviewUpdate('policy-md-input', 'policy-md-preview')
    }
    return `
    <div class="page-header">
      <div class="page-header-left">
        <h1 class="page-title">Terms &amp; Policies</h1>
        <p class="page-subtitle">Edit the legal and policy documents shown to patients during registration and booking.</p>
      </div>
    </div>
    <div class="page-body" style="display:flex;flex-direction:column;gap:16px">
      ${mdDocEditor({
        docTitle: 'Terms & Conditions',
        docHint: 'Shown in the registration page’s Terms &amp; Conditions modal.',
        taId: 'terms-md-input', previewId: 'terms-md-preview',
        content: clinicInfo.termsContent || '',
        saveFn: 'saveTermsContent', saveLabel: 'Save Terms &amp; Conditions'
      })}
      ${mdDocEditor({
        docTitle: 'Data Privacy Act Notice',
        docHint: 'Shown in the registration page’s Data Privacy Act modal — its own document and its own consent checkbox, separate from Terms &amp; Conditions.',
        taId: 'privacy-md-input', previewId: 'privacy-md-preview',
        content: clinicInfo.privacyContent || '',
        saveFn: 'savePrivacyContent', saveLabel: 'Save Data Privacy Act Notice'
      })}
      ${mdDocEditor({
        docTitle: 'Appointment Policy',
        docHint: 'Shown in the booking wizard’s Appointment Policy modal.',
        taId: 'policy-md-input', previewId: 'policy-md-preview',
        content: clinicInfo.appointmentPolicyContent || '',
        saveFn: 'saveAppointmentPolicyContent', saveLabel: 'Save Appointment Policy'
      })}
    </div>`
  }

  // ── Section: Archives ────────────────────────────────────────
  function sectionArchives() {
    const arcFilter = st().archivesFilter || 'all'
    // No 'Appointment' tab — nothing archives an appointment (checked: no
    // frontend or backend path ever creates an archived_records row with
    // that type), so it was a permanently-empty dead tab.
    const tabs = ['all','Patient','Account','Examination','Service']
    const list = arcFilter === 'all' ? archivedRecords : archivedRecords.filter(r => r.type === arcFilter)
    const typeBadge = t => {
      const map = { Patient:'#DBEAFE:#1D4ED8', Account:'#EDE9FE:#5B21B6', Examination:'#D1FAE5:#065F46', Service:'#FCE7F3:#9D174D' }
      const [bg, col] = (map[t] || '#F3F4F6:#374151').split(':')
      return `<span style="background:${bg};color:${col};font-size:.68rem;font-weight:700;padding:2px 10px;border-radius:20px;letter-spacing:.04em">${t}</span>`
    }
    return `
    <div class="page-header">
      <div class="page-header-left">
        <h1 class="page-title">Archives</h1>
        <p class="page-subtitle">View and manage archived records. Only archived records can be permanently deleted.</p>
      </div>
    </div>
    <div class="page-body">
      <div class="table-wrap">
        <div class="filter-tabs" style="padding:12px 20px 0;border-bottom:1px solid #f3f4f6">
          ${tabs.map(t => `<button class="filter-tab${arcFilter===t||(t==='all'&&arcFilter==='all')?' active':''}"
            onclick="window.state.archivesFilter='${t}';window.renderPage()">${t==='all'?'All':t+'s'}</button>`).join('')}
        </div>
        <div class="table-toolbar" style="padding:12px 20px">
          <span class="table-title">${list.length} archived record${list.length!==1?'s':''}</span>
          <div class="table-actions">
            <div class="search-input-wrap">
              ${ic('search','icon-sm')}
              <input class="search-input" placeholder="Search by name…" oninput="window.filterTable(this,'archives-tbody')">
            </div>
          </div>
        </div>
        ${list.length ? `
        <table class="tbl archives-tbl">
          <colgroup>
            <col style="width:10%"><col style="width:26%"><col style="width:13%"><col style="width:27%"><col style="width:12%"><col style="width:12%">
          </colgroup>
          <thead><tr>
            <th>Type</th>
            <th data-sort-key="name" data-sort-type="text">Name / ID</th>
            <th>Archived By</th><th>Reason</th>
            <th data-sort-key="date" data-sort-type="date">Date</th>
            <th>Actions</th>
          </tr></thead>
          <tbody id="archives-tbody">
            ${list.map(r => `<tr data-search="${r.name.toLowerCase()} ${r.refId.toLowerCase()} ${r.archivedBy.toLowerCase()}" data-sort-name="${r.name.toLowerCase()}" data-sort-date="${r.date}">
              <td data-label="Type" style="white-space:nowrap">${typeBadge(r.type)}</td>
              <td data-label="Name / ID" style="white-space:nowrap;overflow:hidden;text-overflow:ellipsis;max-width:0">
                <span style="font-size:.82rem;font-weight:600;color:#1f2937">${r.name}</span>
                <span style="font-size:.72rem;color:#9ca3af;margin-left:5px">${r.refId}</span>
              </td>
              <td data-label="Archived By" style="font-size:.82rem;white-space:nowrap;overflow:hidden;text-overflow:ellipsis;max-width:0">${r.archivedBy}</td>
              <td data-label="Reason" style="font-size:.78rem;color:#6b7280;white-space:nowrap;overflow:hidden;text-overflow:ellipsis;max-width:0" title="${r.reason}">${r.reason}</td>
              <td data-label="Date" style="font-size:.78rem;white-space:nowrap">${r.date}</td>
              <td data-label="Actions" style="white-space:nowrap">
                <div style="display:flex;gap:4px;align-items:center;flex-wrap:nowrap">
                  <button class="btn-icon" title="View" onclick="window.viewArchivedRecord('${r.id}')">${ic('eye','icon-sm')}</button>
                  <button class="btn-icon" title="Restore" style="color:#16a34a;border-color:#d1fae5" onclick="window.confirmRestore('${r.id}','${r.name.replace(/'/g,"\\'")}')">${ic('rotate-ccw','icon-sm')}</button>
                  <button class="btn-icon" title="Delete Forever" style="color:#dc2626;border-color:#fee2e2" onclick="window.confirmPermDelete('${r.id}','${r.name.replace(/'/g,"\\'")}')">${ic('trash','icon-sm')}</button>
                </div>
              </td>
            </tr>`).join('')}
          </tbody>
        </table>` : `
        <div class="table-empty">${arcFilter !== 'all' ? 'No archived records of this type.' : 'No archived records.'}</div>`}
      </div>
    </div>`
  }

  if (sec === 'archives') window.state.afterRender = () => { window.initPagination('archives-tbody'); window.initSortable('archives-tbody', { key: 'date', type: 'date', dir: -1 }) }
  // services section uses a card grid — no table pagination needed

  const sections = { profile: sectionProfile, clinic: sectionClinic, services: sectionServices, consultation: sectionConsultation, terms: sectionTerms, archives: sectionArchives }
  return (sections[sec] || sections.clinic)()
}

// ════════════════════════════════════════════════════════════════
//  ADMIN — ACTIVITY LOG
// ════════════════════════════════════════════════════════════════
function pageActivityLog() {
  // Mirrors the only types addActivityLog() actually ever logs (search the
  // codebase for `addActivityLog(` — appointment/examination/patient/settings
  // calls, plus account creation & archiving under 'user'). The previous list
  // (login, report, schedule, archive, account) was left over from db.js's
  // demo seed data and never matched a single real log entry.
  const typeBadgeStyle = {
    appointment: 'background:#FFF7ED;color:#C2410C',
    examination: 'background:#FAF5FF;color:#7E22CE',
    patient:     'background:#F0FDF4;color:#15803D',
    settings:    'background:#F9FAFB;color:#374151',
    user:        'background:#EEF2FF;color:#4338CA'
  }
  const typeLabel = { user: 'Account' }
  function logTypeBadge(type) {
    const style = typeBadgeStyle[type] || 'background:#F3F4F6;color:#6B7280'
    const label = typeLabel[type] || (type.charAt(0).toUpperCase() + type.slice(1))
    return `<span style="display:inline-flex;align-items:center;padding:2px 9px;border-radius:999px;font-size:.72rem;font-weight:600;${style}">${label}</span>`
  }

  const _ld        = new Date()
  const _lp        = n => String(n).padStart(2, '0')
  const today      = `${_ld.getFullYear()}-${_lp(_ld.getMonth()+1)}-${_lp(_ld.getDate())}`
  const monthStart = today.slice(0,8) + '01'

  // Fallback photo map keyed by name for log entries that predate the users_id column.
  // New entries get photoUrl directly from the API via a users JOIN.
  const userPhotoMap = {}
  getAllUsers().forEach(u => {
    if (!u.name || !u.photoUrl) return
    userPhotoMap[u.name] = u.photoUrl
    const stripped = u.name.replace(/^Dr\.\s+/i, '')
    if (stripped !== u.name) userPhotoMap[stripped] = u.photoUrl
  })

  window.state.afterRender = () => {
    window.initPagination('log-tbody')
    window.initSortable('log-tbody', { key: 'ts', type: 'date', dir: -1 })
    window.applyLogFilters()
  }

  return `
  <div class="page-header">
    <div class="page-header-left">
      <h1 class="page-title">Activity Log</h1>
      <p class="page-subtitle">System-wide audit trail of all actions</p>
    </div>
    <button class="btn-secondary" onclick="window.exportLog()">${ic('download','icon-sm')} Export to Excel</button>
  </div>
  <div class="page-body">
    <div class="table-wrap">

      <!-- ── Filter bar ── -->
      <div class="filter-grid activity-filter-bar">
        <div class="form-group" style="margin:0;flex:0 0 auto">
          <label class="form-label" style="font-size:.72rem">Role</label>
          ${window.selectFieldHtml('log-role-filter', {
            value: '',
            options: [{ value: '', label: 'All Roles' }, 'Admin', 'Staff', 'Doctor', 'Patient'],
            onchange: 'window.applyLogFilters()',
            style: 'width:auto;min-width:130px;padding:7px 38px 7px 12px;font-size:.82rem'
          })}
        </div>
        <div class="form-group" style="margin:0;flex:0 0 auto">
          <label class="form-label" style="font-size:.72rem">Action Type</label>
          ${window.selectFieldHtml('log-type-filter', {
            value: '',
            options: [
              { value: '', label: 'All Types' },
              { value: 'appointment', label: 'Appointment' },
              { value: 'patient', label: 'Patient' },
              { value: 'examination', label: 'Examination' },
              { value: 'settings', label: 'Settings' },
              { value: 'user', label: 'Account' }
            ],
            onchange: 'window.applyLogFilters()',
            style: 'width:auto;min-width:130px;padding:7px 38px 7px 12px;font-size:.82rem'
          })}
        </div>
        <div class="form-group" style="margin:0;flex:0 0 auto">
          <label class="form-label" style="font-size:.72rem">From Date</label>
          ${window.dateFieldHtml('log-date-from', { value: monthStart, style: 'width:150px;padding:7px 10px;font-size:.82rem', onchange: 'window.applyLogFilters()' })}
        </div>
        <div class="form-group" style="margin:0;flex:0 0 auto">
          <label class="form-label" style="font-size:.72rem">To Date</label>
          ${window.dateFieldHtml('log-date-to', { value: today, style: 'width:150px;padding:7px 10px;font-size:.82rem', onchange: 'window.applyLogFilters()' })}
        </div>
        <div class="search-input-wrap" style="flex:1;min-width:180px;align-self:flex-end">
          ${ic('search','icon-sm')}
          <input id="log-search" class="search-input" placeholder="Search user or action…"
                 oninput="window.applyLogFilters()">
        </div>
        <div class="filter-grid-actions" style="display:flex;gap:10px;align-self:flex-end">
          <button class="btn-ghost" style="font-size:.78rem" onclick="window.clearLogFilters()">
            ${ic('x','icon-sm')} Clear Filters
          </button>
          <button class="btn-danger" style="font-size:.78rem" onclick="window.clearAllLogs()">
            ${ic('trash-2','icon-sm')} Clear All Logs
          </button>
        </div>
      </div>

      ${activityLog.length ? `
      <div id="log-toolbar" class="table-toolbar" style="padding:10px 16px">
        <span class="table-title" id="log-count">${activityLog.length} log entries</span>
      </div>
      <table class="tbl">
        <colgroup>
          <col style="width:5%"><col style="width:15%"><col style="width:8%">
          <col style="width:30%"><col style="width:15%"><col style="width:12%"><col style="width:15%">
        </colgroup>
        <thead id="log-thead"><tr>
          <th>#</th>
          <th data-sort-key="user" data-sort-type="text">User</th>
          <th>Role</th><th>Action</th>
          <th data-sort-key="ts" data-sort-type="date">Timestamp</th>
          <th>Type</th>
          <th>IP Address</th>
        </tr></thead>
        <tbody id="log-tbody">
          ${activityLog.map((l,i) => {
            const rowDate = (l.timestamp || '').slice(0, 10)
            const inRange = (!monthStart || rowDate >= monthStart) && (!today || rowDate <= today)
            return `<tr
              ${inRange ? '' : 'style="display:none"'}
              data-search="${l.user.toLowerCase()} ${l.action.toLowerCase()}"
              data-role="${l.role.toLowerCase()}"
              data-type="${l.type}"
              data-ts="${l.timestamp}"
              data-sort-user="${l.user.toLowerCase()}"
              data-sort-ts="${l.timestamp}"
              style="cursor:pointer" title="Click to view full details"
              onclick="window.viewActivityLogDetail('${l.id}')">
              <td data-label="#" style="color:#9CA3AF;font-size:.75rem">${i+1}</td>
              <td data-label="User"><div class="patient-name-cell">${avatar(l.user, 'patient-avatar', l.photoUrl || userPhotoMap[l.user] || null)}<strong style="font-size:.82rem">${l.user}</strong></div></td>
              <td data-label="Role">${badge(l.role.toLowerCase())}</td>
              <td data-label="Action" style="font-size:.82rem;max-width:380px;overflow:hidden;text-overflow:ellipsis;white-space:nowrap">${esc(l.action)}</td>
              <td data-label="Timestamp" style="font-size:.75rem;color:#9CA3AF;white-space:nowrap">${fmtTimestamp12h(l.timestamp)}</td>
              <td data-label="Type">${logTypeBadge(l.type)}</td>
              <td data-label="IP Address" style="font-size:.75rem;color:#9CA3AF;font-family:monospace;white-space:nowrap">${l.ip || '—'}</td>
            </tr>`
          }).join('')}
          <tr id="log-empty-row" style="display:none;pointer-events:none">
            <td colspan="7" style="padding:24px;text-align:center;border:none;color:#9CA3AF;font-size:.85rem">No activities found.</td>
          </tr>
        </tbody>
      </table>
      ` : `<div class="table-empty">No activity logged.</div>`}
    </div>
  </div>`
}

// ════════════════════════════════════════════════════════════════
//  STAFF — DASHBOARD
// ════════════════════════════════════════════════════════════════
function pageStaffDashboard() {
  window.state.afterRender = () => {
    window._charts.initAppointmentsChart()
    window._charts.initPatientGrowthChart()
    window.updateAdminDashboard()
  }

  return `
  <div class="page-header">
    <div class="page-header-left">
      <h1 class="page-title">Dashboard</h1>
      <p class="page-subtitle">Welcome, ${st().user?.firstName}. Manage today's clinic operations.</p>
    </div>
    <div class="page-header-right">
      <div class="page-header-btn-group" style="display:flex;gap:10px">
        <button class="btn-secondary" title="Print a table-only version of this dashboard" onclick="window.printDashboardReport()">
          ${ic('printer','icon-sm')} Print Report
        </button>
        <button class="btn-secondary" title="Download this dashboard as a PDF" onclick="window.downloadDashboardReportPDF(this)">
          ${ic('download','icon-sm')} Download PDF
        </button>
        <button class="btn-secondary" onclick="window.navigate('waitlist')">
          ${ic('clock','icon-sm')} Waitlist
          ${window._waitlistCount > 0 ? `<span class="nav-badge">${window._waitlistCount > 99 ? '99+' : window._waitlistCount}</span>` : ''}
        </button>
        <button class="btn-primary" onclick="window.navigate('create-appointment')">${ic('plus','icon-sm')} New Appointment</button>
      </div>
      <span style="font-size:.78rem;color:#9CA3AF">${new Date().toLocaleDateString('en-PH',{weekday:'long',year:'numeric',month:'long',day:'numeric'})}</span>
    </div>
  </div>
  ${_dashboardOverviewBody(false)}`
}

// ════════════════════════════════════════════════════════════════
//  DOCTOR — DASHBOARD
// ════════════════════════════════════════════════════════════════
function pageDoctorDashboard() {
  const { user } = st()
  const hour     = new Date().getHours()
  const greeting = hour < 12 ? 'Good morning' : hour < 17 ? 'Good afternoon' : 'Good evening'
  const dateStr  = new Date().toLocaleDateString('en-PH', { weekday:'long', year:'numeric', month:'long', day:'numeric' })

  const todayStr  = localDateStr()
  const timeVal   = t => { if (!t) return 0; const cl = t.includes('PM') && !t.startsWith('12'), [h,m] = t.replace(/ [AP]M$/,'').split(':').map(Number); return (cl ? h+12 : (t.includes('AM') && h===12 ? 0 : h))*60+m }

  const todayList    = appointments.filter(a => a.date === todayStr && !['cancelled','disapproved'].includes(a.status))
                         .sort((a,b) => timeVal(a.time) - timeVal(b.time))
  const upcomingList = appointments.filter(a => a.date > todayStr && ['approved','pending'].includes(a.status))
  const weekStart    = new Date(); weekStart.setDate(weekStart.getDate() - weekStart.getDay())
  const weekStartStr = localDateStr(weekStart)
  const thisWeek     = appointments.filter(a => a.status === 'completed' && a.date >= weekStartStr).length
  const pendingAppts = appointments.filter(a => a.status === 'pending').length

  const nextUp = upcomingList[0]
  const nextLabel = nextUp ? `Next: ${nextUp.time}, ${nextUp.patientName}` : 'No upcoming'

  const recentDone = appointments.filter(a => a.status === 'completed')
    .sort((a,b) => b.date.localeCompare(a.date)).slice(0, 5)

  return `
  <div class="page-header">
    <div class="page-header-left">
      <h1 class="page-title">${greeting}, ${user?.name || 'Doctor'}</h1>
      <p class="page-subtitle">Here's your clinic overview for today.</p>
    </div>
    <div class="page-header-right">
      <div class="page-header-btn-group" style="display:flex;gap:10px">
        <button class="btn-secondary" title="Print a table-only version of this dashboard" onclick="window.printDashboardReport()">
          ${ic('printer','icon-sm')} Print Report
        </button>
        <button class="btn-secondary" title="Download this dashboard as a PDF" onclick="window.downloadDashboardReportPDF(this)">
          ${ic('download','icon-sm')} Download PDF
        </button>
      </div>
      <span style="font-size:.78rem;color:#9CA3AF">${dateStr}</span>
    </div>
  </div>
  <div class="page-body">

    <!-- Stat Cards -->
    <div class="stats-grid" style="margin-bottom:20px">
      <div class="stat-card stat-card--clickable" onclick="window.navigate('doctor-appointments',{filter:'today'})">
        <div class="stat-info">
          <div class="stat-label">Patients Today</div>
          <div class="stat-value">${todayList.length}</div>
          <div class="stat-delta" style="color:#9CA3AF">${todayList.length ? `${todayList.filter(a=>a.status==='completed').length} completed` : 'None scheduled'}</div>
        </div>
        <div class="stat-icon orange">${ic('users','icon-lg')}</div>
      </div>
      <div class="stat-card stat-card--clickable" onclick="window.navigate('doctor-appointments',{filter:'upcoming'})">
        <div class="stat-info">
          <div class="stat-label">Upcoming Appointments</div>
          <div class="stat-value">${upcomingList.length}</div>
          <div class="stat-delta" style="color:#9CA3AF;font-size:.7rem;white-space:nowrap;overflow:hidden;text-overflow:ellipsis">${nextLabel}</div>
        </div>
        <div class="stat-icon blue">${ic('calendar','icon-lg')}</div>
      </div>
      <div class="stat-card stat-card--clickable" onclick="window.navigate('doctor-appointments',{filter:'completed'})">
        <div class="stat-info">
          <div class="stat-label">Completed This Week</div>
          <div class="stat-value">${thisWeek}</div>
          <div class="stat-delta" style="color:#10B981">${thisWeek ? 'Consultations done' : 'None this week'}</div>
        </div>
        <div class="stat-icon green">${ic('eye','icon-lg')}</div>
      </div>
      <div class="stat-card stat-card--clickable" onclick="window.navigate('doctor-appointments',{filter:'today'})">
        <div class="stat-info">
          <div class="stat-label">Pending Approval</div>
          <div class="stat-value">${pendingAppts}</div>
          <div class="stat-delta" style="color:${pendingAppts ? '#E8891C' : '#9CA3AF'}">${pendingAppts ? 'Awaiting admin approval' : 'All approved'}</div>
        </div>
        <div class="stat-icon red">${ic('clock','icon-lg')}</div>
      </div>
    </div>

    <!-- Today's Patients -->
    <div class="card" style="margin-bottom:20px">
      <div class="card-header">
        <div class="card-title">${ic('calendar','icon-sm')} Today's Patients</div>
        <button class="btn-ghost" style="font-size:.75rem;padding:4px 10px"
                onclick="window.navigate('doctor-appointments',{filter:'today'})">View All</button>
      </div>
      ${todayList.length ? `
      <div style="overflow-x:auto">
      <table class="tbl">
        <colgroup>
          <col style="width:24%"><col style="width:11%"><col style="width:22%">
          <col style="width:15%"><col style="width:28%">
        </colgroup>
        <thead><tr><th>Patient</th><th>Time</th><th>Type</th><th>Status</th><th>Action</th></tr></thead>
        <tbody>
          ${todayList.map(a => `<tr>
            <td data-label="Patient"><div class="patient-name-cell">
              ${avatar(a.patientName, 'patient-avatar', patients.find(p=>p.id===a.patientId)?.photoUrl || null)}
              <div class="patient-name-info"><strong>${a.patientName}</strong><span>${a.patientId}</span></div>
            </div></td>
            <td data-label="Time" style="font-size:.82rem;font-weight:600;white-space:nowrap">${a.time}</td>
            <td data-label="Type" style="font-size:.82rem">${a.type}</td>
            <td data-label="Status">${badge(a.status)}</td>
            <td data-label="Action">${a.status === 'completed'
              ? `<button class="btn-ghost" style="font-size:.75rem;padding:4px 10px" onclick="window.navigate('patient-view',{patientId:'${a.patientId}',patientName:'${a.patientName}'})">${ic('eye','icon-sm')} View Record</button>`
              : a.status === 'approved'
              ? `<button class="btn-primary btn-sm" onclick="window.startExamFromAppt('${a.id}','${a.patientId}')">${ic('check','icon-sm')} Start Consultation</button>`
              : `<button class="btn-ghost btn-sm" disabled title="Awaiting staff/admin approval" style="opacity:.45;cursor:not-allowed">${ic('clock','icon-sm')} Pending Approval</button>`
            }</td>
          </tr>`).join('')}
        </tbody>
      </table>
      </div>` : `<div class="table-empty">No patients scheduled for today.</div>`}
    </div>

    <!-- Recent Completed Appointments -->
    <div class="card">
      <div class="card-header">
        <div class="card-title">${ic('check-circle','icon-sm')} Recent Completed</div>
        <button class="btn-ghost" style="font-size:.75rem;padding:4px 10px"
                onclick="window.navigate('doctor-appointments',{filter:'completed'})">View All</button>
      </div>
      ${recentDone.length ? `
      <div style="overflow-x:auto">
      <table class="tbl">
        <colgroup>
          <col style="width:28%"><col style="width:18%"><col style="width:30%"><col style="width:12%"><col style="width:12%">
        </colgroup>
        <thead><tr><th>Patient</th><th>Date</th><th>Type</th><th>Status</th><th></th></tr></thead>
        <tbody>
          ${recentDone.map(a => `<tr>
            <td data-label="Patient"><div class="patient-name-cell">
              ${avatar(a.patientName, 'patient-avatar', patients.find(p=>p.id===a.patientId)?.photoUrl || null)}
              <div class="patient-name-info"><strong>${a.patientName}</strong></div>
            </div></td>
            <td data-label="Date" style="font-size:.78rem;color:#6B7280;white-space:nowrap">${fmtDate(a.date)}</td>
            <td data-label="Type" style="font-size:.78rem">${a.type}</td>
            <td data-label="Status">${badge(a.status)}</td>
            <td data-label="Actions"><button class="btn-icon" title="View" onclick="window.navigate('patient-view',{patientId:'${a.patientId}',patientName:'${a.patientName}'})">${ic('eye','icon-sm')}</button></td>
          </tr>`).join('')}
        </tbody>
      </table>
      </div>` : `<div class="table-empty">No completed appointments yet.</div>`}
    </div>

  </div>`
}


// ════════════════════════════════════════════════════════════════
//  DOCTOR — MY APPOINTMENTS
// ════════════════════════════════════════════════════════════════
function pageDoctorAppointments() {
  const { filter } = st()
  const activeFilter = (filter && ['all','today','upcoming','completed'].includes(filter)) ? filter : 'today'
  if (activeFilter !== filter) window.state.filter = activeFilter

  const todayStr = localDateStr()
  const timeVal  = t => { if (!t) return 0; const cl = t.includes('PM') && !t.startsWith('12'), [h,m] = t.replace(/ [AP]M$/,'').split(':').map(Number); return (cl ? h+12 : (t.includes('AM') && h===12 ? 0 : h))*60+m }

  const todayList    = appointments.filter(a => a.date === todayStr && !['cancelled','disapproved'].includes(a.status))
                         .sort((a,b) => timeVal(a.time) - timeVal(b.time))
  const upcomingList = appointments.filter(a => a.date > todayStr && ['approved','pending'].includes(a.status))
                         .sort((a,b) => a.date.localeCompare(b.date) || timeVal(a.time) - timeVal(b.time))
  const completedList = appointments.filter(a => a.status === 'completed')
                         .sort((a,b) => b.date.localeCompare(a.date))
  const allList       = [...appointments].sort((a,b) => b.date.localeCompare(a.date) || timeVal(b.time) - timeVal(a.time))

  window.state.afterRender = () => { window.initPagination('doc-appt-tbody'); window.initSortable('doc-appt-tbody', { key: 'date', type: 'date', dir: activeFilter === 'today' ? 1 : -1, context: activeFilter }) }

  let list
  if (activeFilter === 'all')           list = allList
  else if (activeFilter === 'today')    list = todayList
  else if (activeFilter === 'upcoming') list = upcomingList
  else                                  list = completedList

  const titleMap = {
    all:       'All Appointments',
    today:     "Today's Appointments",
    upcoming:  'Upcoming Appointments',
    completed: 'Completed Appointments'
  }
  const subMap = {
    all:       'All appointments across every status and date.',
    today:     'Your consultation schedule for today.',
    upcoming:  'Confirmed appointments on your schedule.',
    completed: 'Past completed consultations.'
  }

  const docActions = a => {
    const viewBtn  = `<button class="btn-icon" title="View Details" onclick="window.viewAppt('${a.id}')">${ic('eye','icon-sm')}</button>`
    const recBtn   = `<button class="btn-icon" title="Patient Record" onclick="window.navigate('patient-view',{patientId:'${a.patientId}',patientName:'${a.patientName}'})">${ic('user','icon-sm')}</button>`
    if (a.status === 'completed') return `<div style="display:flex;gap:4px">${viewBtn}${recBtn}</div>`
    if (a.status === 'approved') {
      const startBtn = `<button class="btn-icon" title="Start Consultation" style="color:#E8760A"
        onclick="window.startExamFromAppt('${a.id}','${a.patientId}')">${ic('check','icon-sm')}</button>`
      return `<div style="display:flex;gap:4px">${viewBtn}${recBtn}${startBtn}</div>`
    }
    return `<div style="display:flex;gap:4px">${viewBtn}${recBtn}</div>`
  }

  return `
  <div class="page-header">
    <div class="page-header-left">
      <h1 class="page-title">${titleMap[activeFilter]}</h1>
      <p class="page-subtitle">${subMap[activeFilter]}</p>
    </div>
  </div>
  <div class="page-body">
    <div class="table-wrap">
      <div class="table-toolbar">
        <span class="table-title">${list.length} record${list.length !== 1 ? 's' : ''}</span>
        <div class="table-actions">
          <div class="search-input-wrap">
            ${ic('search','icon-sm')}
            <input class="search-input" placeholder="Search patient or type…"
                   oninput="window.filterTable(this,'doc-appt-tbody')">
          </div>
        </div>
      </div>
      ${list.length ? `<table class="tbl">
        <colgroup>
          <col style="width:7%"><col style="width:22%"><col style="width:12%">
          <col style="width:10%"><col style="width:20%"><col style="width:13%"><col style="width:16%">
        </colgroup>
        <thead><tr>
          <th>ID</th>
          <th data-sort-key="patient" data-sort-type="text">Patient</th>
          <th data-sort-key="date" data-sort-type="date">Date</th>
          <th>Time</th><th>Type</th><th>Status</th><th>Actions</th>
        </tr></thead>
        <tbody id="doc-appt-tbody">
          ${list.map(a => `<tr data-search="${(a.patientName||'').toLowerCase()} ${(a.type||'').toLowerCase()}" data-sort-patient="${(a.patientName||'').toLowerCase()}" data-sort-date="${a.date}">
            <td data-label="ID"><code style="font-size:.73rem;color:#9CA3AF">${a.id}</code></td>
            <td data-label="Patient"><div class="patient-name-cell">
              ${avatar(a.patientName, 'patient-avatar', patients.find(p=>p.id===a.patientId)?.photoUrl || null)}
              <div class="patient-name-info"><strong>${a.patientName}</strong><span>${a.patientId}</span></div>
            </div></td>
            <td data-label="Date" style="font-size:.82rem;white-space:nowrap">${fmtDate(a.date)}</td>
            <td data-label="Time" style="font-size:.82rem;white-space:nowrap">${a.time}</td>
            <td data-label="Type" style="font-size:.82rem">
              ${a.type}
              <span title="${a.source === 'walk-in' ? 'Booked directly by clinic staff' : 'Booked by the patient online'}"
                    style="display:inline-block;margin-left:6px;font-size:.62rem;font-weight:700;text-transform:uppercase;letter-spacing:.03em;padding:2px 7px;border-radius:20px;white-space:nowrap;${a.source === 'walk-in' ? 'background:#FFF7ED;color:#C2410C' : 'background:#EFF6FF;color:#1D4ED8'}">${a.source === 'walk-in' ? 'Walk-in' : 'Online'}</span>
            </td>
            <td data-label="Status">${badge(a.status)}</td>
            <td data-label="Actions">${docActions(a)}</td>
          </tr>`).join('')}
        </tbody>
      </table>` : `<div class="table-empty">No appointments found.</div>`}
    </div>
  </div>`
}

// ════════════════════════════════════════════════════════════════
//  DOCTOR — MY SCHEDULE (read-only)
// ════════════════════════════════════════════════════════════════
function pageDoctorSchedule() {
  const { user } = st()
  const doc = doctors.find(d => d.id === user?.id) || doctors[0]

  const now    = new Date()
  const todayY = now.getFullYear()
  const todayM = now.getMonth()

  // Must be set BEFORE the return
  window.state.afterRender = () => {
    window.docSchedGoMonth(todayY, todayM)
  }

  return `
  <div class="page-header">
    <div class="page-header-left">
      <h1 class="page-title">My Schedule</h1>
      <p class="page-subtitle">Your consultation schedule and availability.</p>
    </div>
  </div>
  <div class="page-body">

    <!-- Doctor Info Card -->
    <div class="card" style="margin-bottom:20px;border-radius:12px;box-shadow:0 1px 4px rgba(0,0,0,.07)">
      <div class="card-body" style="display:flex;align-items:flex-start;gap:20px;flex-wrap:wrap">
        <div class="profile-avatar-lg" style="width:56px;height:56px;font-size:1.2rem;flex-shrink:0;overflow:hidden">${
          doc.photoUrl
            ? `<img src="${doc.photoUrl}" alt="${doc.name}" style="width:100%;height:100%;object-fit:cover;border-radius:50%;display:block" onerror="${avatarFallbackAttr(doc.name)}">`
            : initials(doc.name)
        }</div>
        <div style="flex:1;min-width:220px">
          <div style="display:flex;align-items:center;gap:10px;flex-wrap:wrap">
            <div style="font-size:1rem;font-weight:700;color:#1C1C1C">${doc.name}</div>
            <span style="background:#dcfce7;color:#16a34a;font-size:.62rem;font-weight:700;text-transform:uppercase;letter-spacing:.06em;padding:2px 10px;border-radius:20px">Active</span>
          </div>
          <div style="font-size:.82rem;color:#6B7280;margin-top:2px">${doc.specialization}</div>
          ${dayPills(doc.days)}
          <div style="display:flex;flex-wrap:wrap;gap:28px;margin-top:14px">
            ${[
              [ic('clock','icon-sm'), 'Consultation Hours', doc.hours],
              [ic('mail','icon-sm'),  'Email',               doc.email],
            ].map(([iconHtml, label, val]) => `
            <div style="display:flex;align-items:center;gap:10px">
              <span style="color:#9CA3AF;flex-shrink:0;display:flex">${iconHtml}</span>
              <div>
                <div style="font-size:.6rem;font-weight:700;text-transform:uppercase;letter-spacing:.06em;color:#9CA3AF;margin-bottom:3px">${label}</div>
                <div style="font-size:.82rem;font-weight:600;color:#1f2937;line-height:1.2">${val}</div>
              </div>
            </div>`).join('')}
          </div>
        </div>
      </div>
    </div>

    <!-- Calendar + Schedule Panel -->
    <div style="display:grid;grid-template-columns:1.3fr 1fr;gap:24px;align-items:start">

      <!-- Calendar -->
      <div class="card">
        <div class="card-header">
          <div class="card-title" id="doc-sched-title"></div>
          <div style="display:flex;gap:4px">
            <button class="btn-icon" id="doc-sched-prev" title="Previous month">${ic('chevron-left','icon-sm')}</button>
            <button class="btn-icon" id="doc-sched-today"
                    style="font-size:.7rem;font-weight:700;width:auto;padding:0 8px;color:#E8760A;border-color:#E8760A">Today</button>
            <button class="btn-icon" id="doc-sched-next" title="Next month">${ic('chevron-right','icon-sm')}</button>
          </div>
        </div>
        <div class="card-body">
          <div class="calendar-grid" style="margin-bottom:8px">
            ${['Sun','Mon','Tue','Wed','Thu','Fri','Sat'].map(d => `<div class="cal-day-header">${d}</div>`).join('')}
          </div>
          <div class="calendar-grid" id="doc-sched-cal"></div>
          <div style="display:flex;gap:14px;margin-top:14px;flex-wrap:wrap">
            <div style="display:flex;align-items:center;gap:5px;font-size:.72rem;color:#6B7280">
              <div style="width:12px;height:12px;border-radius:3px;background:#ECFDF5;border:1px solid #6EE7B7"></div> Available
            </div>
            <div style="display:flex;align-items:center;gap:5px;font-size:.72rem;color:#6B7280">
              <div style="width:12px;height:12px;border-radius:3px;background:#ECFDF5;outline:2px solid #E8760A;outline-offset:-1px"></div> Today
            </div>
            <div style="display:flex;align-items:center;gap:5px;font-size:.72rem;color:#6B7280">
              <div style="width:12px;height:12px;border-radius:3px;background:#F3F4F6"></div> Not Scheduled
            </div>
            <div style="display:flex;align-items:center;gap:5px;font-size:.72rem;color:#6B7280">
              <div style="width:12px;height:12px;border-radius:3px;background:#FEE2E2;border:1px solid #FCA5A5"></div> Blocked
            </div>
            <div style="display:flex;align-items:center;gap:5px;font-size:.72rem;color:#6B7280">
              <div style="width:12px;height:12px;border-radius:3px;background:#FFF1F2;border:1px solid #fda4af"></div> PH Holiday
            </div>
            <div style="display:flex;align-items:center;gap:5px;font-size:.72rem;color:#6B7280">
              <div style="width:6px;height:6px;border-radius:50%;background:#065F46;opacity:.6;margin:3px"></div> Has Appointments
              <!-- The real dot (.has-appts::before, global.css) uses
                   currentColor, so it actually takes on whatever text
                   color the day already has (green on Available, red on
                   Blocked/Holiday) — this swatch shows the common case. -->
            </div>
          </div>
        </div>
      </div>

      <!-- Schedule Panel -->
      <div class="card" style="position:sticky;top:24px">
        <div class="card-header">
          <div class="card-title" id="doc-sched-list-title">Schedule</div>
        </div>
        <div id="doc-sched-list" style="padding:0"></div>
      </div>

    </div>

  </div>`
}

// ════════════════════════════════════════════════════════════════
//  DOCTOR — SETTINGS
// ════════════════════════════════════════════════════════════════
function pageDoctorSettings() {
  const { user } = st()
  const doc = doctors.find(d => d.id === user?.id) || user || {}

  const docName = doc.name || `${doc.firstName || ''} ${doc.lastName || ''}`.trim() || 'Doctor'

  const pwField = (id, placeholder, extra='') => `
    <div style="position:relative">
      <input type="password" class="form-input" id="${id}" placeholder="${placeholder}" style="padding-right:40px" autocomplete="off" readonly onfocus="this.removeAttribute('readonly')" ${extra}>
      <button type="button" onclick="window.togglePwVisibility('${id}',this)"
              style="position:absolute;right:10px;top:50%;transform:translateY(-50%);background:none;border:none;cursor:pointer;color:#9CA3AF;padding:2px;display:flex;align-items:center">
        ${ic('eye-off','icon-sm')}
      </button>
    </div>`

  return `
  <style>
    @media (min-width: 1024px) { .doc-sett-col { display: grid !important; grid-template-columns: 55fr 45fr; gap: 20px; align-items: start; } }
  </style>
  <div class="page-header">
    <div class="page-header-left">
      <h1 class="page-title">Settings</h1>
      <p class="page-subtitle">Manage your profile and account preferences</p>
    </div>
  </div>
  <div class="page-body">

    <!-- Profile Banner -->
    <div class="card" style="padding:28px 32px;margin-bottom:20px">
      <div style="display:flex;align-items:center;gap:24px;flex-wrap:wrap">

        <!-- Clickable avatar -->
        ${window.profilePhotoEditorHtml('doc', docName, user.photoUrl)}

        <div style="flex:1;min-width:160px">
          <div style="font-size:1.2rem;font-weight:700;color:#1C1C1C">${docName}</div>
          <div style="font-size:.85rem;color:#E8760A;font-weight:600;margin-top:3px">${doc.specialization || 'Optometrist'}</div>
          <div style="font-size:.82rem;color:#6B7280;margin-top:4px">${doc.email || ''}</div>
          <div style="font-size:.82rem;color:#6B7280">${doc.contact || ''}</div>
        </div>
        <div style="display:flex;gap:8px;flex-shrink:0">
          <label for="doc-photo-input" class="btn-secondary" style="cursor:pointer">
            ${ic('camera','icon-sm')} Change Photo
          </label>
          ${window.removePhotoBtnHtml('doc', docName, user.photoUrl)}
        </div>
      </div>
    </div>

    <div class="doc-sett-col" style="display:flex;flex-direction:column;gap:20px">

      <!-- LEFT: Personal Info -->
      <div class="card" style="padding:28px">
        <div style="display:flex;align-items:center;gap:8px;margin-bottom:20px">
          <div style="color:#E8760A">${ic('user','icon-sm')}</div>
          <div style="font-size:1.05rem;font-weight:700;color:#1C1C1C">Personal Information</div>
        </div>
        <div style="display:flex;flex-direction:column;gap:14px">
          <div class="form-row-2">
            <div class="form-group">
              <label class="form-label">First Name</label>
              <input class="form-input" id="doc-fname" value="${doc.firstName || ''}">
            </div>
            <div class="form-group">
              <label class="form-label">Middle Name</label>
              <input class="form-input" id="doc-mname" value="${doc.middleName || ''}">
            </div>
          </div>
          <div class="form-group">
            <label class="form-label">Last Name</label>
            <input class="form-input" id="doc-lname" value="${doc.lastName || ''}">
          </div>
          <div class="form-row-2">
            <div class="form-group">
              <label class="form-label">Email Address</label>
              <input class="form-input" type="email" id="doc-email" value="${doc.email || ''}">
            </div>
            <div class="form-group">
              <label class="form-label">Phone Number</label>
              <input class="form-input" id="doc-phone" inputmode="numeric" maxlength="13" oninput="window.formatContactInput(this)" value="${doc.contact || ''}">
            </div>
          </div>
          <div class="form-row-2">
            <div class="form-group">
              <label class="form-label" style="display:flex;align-items:center;gap:4px;color:#9CA3AF">
                ${ic('lock','icon-sm')} Specialization
              </label>
              <input class="form-input" value="${doc.specialization || 'Optometrist'}" disabled
                     style="background:#F9FAFB;color:#9CA3AF;cursor:not-allowed">
              <span style="font-size:.7rem;color:#9CA3AF;margin-top:3px;display:block">Contact admin to update.</span>
            </div>
            <div class="form-group">
              <label class="form-label" style="display:flex;align-items:center;gap:4px;color:#9CA3AF">
                ${ic('lock','icon-sm')} PRC License No.
              </label>
              <input class="form-input" value="${doc.prcLicense || 'Not on file'}" disabled
                     style="background:#F9FAFB;color:#9CA3AF;cursor:not-allowed">
              <span style="font-size:.7rem;color:#9CA3AF;margin-top:3px;display:block">Contact admin to update.</span>
            </div>
          </div>
          <div style="display:flex;justify-content:flex-end;margin-top:4px">
            <button class="btn-primary" onclick="window.saveUserProfile(this)">
              ${ic('check','icon-sm')} Save Changes
            </button>
          </div>
        </div>
      </div>

      <!-- RIGHT: Security -->
      <div class="card" style="padding:28px">
        <div style="display:flex;align-items:center;gap:8px;margin-bottom:4px">
          <div style="color:#E8760A">${ic('shield','icon-sm')}</div>
          <div style="font-size:1.05rem;font-weight:700;color:#1C1C1C">Security</div>
        </div>
        <div style="font-size:.82rem;color:#9CA3AF;margin-bottom:20px">Change your account password</div>
        <div style="display:flex;flex-direction:column;gap:14px">
          <div class="form-group">
            <label class="form-label">Current Password</label>
            ${pwField('doc-curpw','Enter current password', `oninput="window.updateSettingsPwGate('doc')"`)}
          </div>
          <div class="form-group">
            <label class="form-label">New Password</label>
            ${pwField('doc-newpw','Minimum 8 characters', `oninput="window.updatePwChecklist('doc-newpw', this.value);window.updateSettingsPwGate('doc')"`)}
            ${window.pwChecklistHtml('doc-newpw')}
          </div>
          <div class="form-group">
            <label class="form-label">Confirm New Password</label>
            ${pwField('doc-confpw','Repeat new password', `oninput="window.updateSettingsPwGate('doc')"`)}
            <div id="doc-pw-err" class="field-error">Passwords do not match.</div>
          </div>
          <div style="display:flex;align-items:flex-start;gap:6px;font-size:.78rem;color:#9CA3AF">
            ${ic('info','icon-sm')} Can't reuse a previous password.
          </div>
          <div style="display:flex;justify-content:flex-end">
            <button id="doc-pw-btn" class="btn-primary" disabled style="opacity:.55;cursor:not-allowed"
                    onclick="window.validateSettingsPassword('doc-newpw','doc-confpw','doc-pw-err','doc-curpw')">
              ${ic('lock','icon-sm')} Update Password
            </button>
          </div>
        </div>
      </div>

    </div>
  </div>`
}

// ════════════════════════════════════════════════════════════════
//  DOCTOR — OPTICAL EXAMINATION
// ════════════════════════════════════════════════════════════════
function pageExamination() {
  const { params, role, user } = st()
  const p = getPatientById(params.patientId)
  const lastExam = p && p.examinations.length ? p.examinations[p.examinations.length - 1] : null
  const _p = (obj, key) => (obj && obj[key]) || ''
  const pre = lastExam ? lastExam : {
    od: {vaUncorrected:'',sph:'',cyl:'',axis:'',va:'',add:''}, os: {vaUncorrected:'',sph:'',cyl:'',axis:'',va:'',add:''},
    iop: {od:'',os:''}, pd:'', externalFindings:'', diagnosis:'', testResults:'', remarks:''
  }

  // A doctor only gets the editable wizard for their OWN exam records — any
  // other doctor viewing a colleague's exam sees the same read-only view
  // every non-doctor role gets. Ownership is unknown until the specific
  // exam record is resolved, so look it up here rather than trusting role alone.
  const examForOwnership = params.examId ? (p?.examinations || []).find(e => e.id === params.examId) : null
  const isOwnDoctor = role === 'doctor' && (!examForOwnership || examForOwnership.doctor === user?.name)

  if (!isOwnDoctor) {
    const exam = examForOwnership || pre
    const viewOnlyLabel = role === 'doctor'
      ? `View Only (only ${exam.doctor || 'the assigned doctor'} can edit)`
      : 'View Only (Doctor access required to edit)'
    // Same Ishihara-pill split used by the "View Results" modal
    // (viewExamDetail, main.js) — this full page is the primary read-only
    // destination now that non-owner edit access is blocked, so it should
    // show at least as much as that quick modal, not less.
    const { plain: testResultsPlain, ishihara } = window._splitIshihara(exam.testResults)
    const statusColor = { completed:'#059669', pending:'#D97706', cancelled:'#DC2626' }
    const statusLabel = (exam.status || 'completed').charAt(0).toUpperCase() + (exam.status || 'completed').slice(1)
    const ro = (v) => `<div style="padding:8px 12px;background:#f9fafb;border:1px solid #e5e7eb;border-radius:8px;font-size:.87rem;color:#1f2937;min-height:38px">${v || '—'}</div>`
    const eyeField = (label, val, isLast) => `
      <div style="padding:10px 6px;${isLast ? '' : 'border-right:1px solid #F3F4F6;'}text-align:center;flex:1;min-width:0">
        <div style="font-size:.58rem;font-weight:700;text-transform:uppercase;letter-spacing:.07em;color:#9CA3AF;margin-bottom:4px">${label}</div>
        <div style="font-size:.9rem;font-weight:800;font-family:monospace;color:#1C1C1C">${val || '—'}</div>
      </div>`
    const hasIopOrPd = exam.iop?.od || exam.iop?.os || exam.pd
    const backTarget = p
      ? `window.goBack('patient-view',{patientId:'${p.id}',patientName:'${(p.name||'').replace(/'/g,"\\'")}',tab:'history'})`
      : `window.goBack('patient-list')`
    return `
  <div class="page-header">
    <div class="page-header-left" style="display:flex;align-items:center;gap:12px">
      <button class="btn-icon" onclick="${backTarget}">${ic('chevron-left','icon')}</button>
      <div>
        <h1 class="page-title">Optical Examination</h1>
        <p class="page-subtitle">${p ? p.name + ' · ' + p.id : 'Patient'} ${exam.id ? '· ' + exam.id : ''}</p>
      </div>
    </div>
    <div style="display:flex;align-items:center;gap:8px;align-self:center">
      <span style="font-size:.75rem;background:${statusColor[exam.status]||'#059669'};color:#fff;padding:4px 12px;border-radius:20px;font-weight:700">${statusLabel}</span>
      <span style="font-size:.75rem;background:#FFF7ED;color:#C2410C;padding:4px 12px;border-radius:20px;font-weight:600">${viewOnlyLabel}</span>
    </div>
  </div>
  <div class="page-body">
    <div class="card" style="margin-bottom:20px">
      <div class="card-header"><div class="card-title">Visual Acuity &amp; Refraction</div><div class="card-subtitle">${fmtDate(exam.date)} ${exam.doctor ? '· ' + exam.doctor : ''}</div></div>
      <div class="card-body">
        <div style="display:grid;grid-template-columns:1fr 1fr;gap:10px${hasIopOrPd ? ';margin-bottom:14px' : ''}">
          <div style="border:1.5px solid #86EFAC;border-radius:10px;overflow:hidden">
            <div style="background:#F0FDF4;padding:8px 12px;border-bottom:1px solid #86EFAC;display:flex;align-items:center;gap:6px">
              <div style="width:7px;height:7px;border-radius:50%;background:#22C55E;flex-shrink:0"></div>
              <span style="font-size:.65rem;font-weight:800;text-transform:uppercase;letter-spacing:.07em;color:#059669">OD (Right Eye)</span>
            </div>
            <div style="display:flex;background:#fff">
              ${eyeField('VA (Un.)', exam.od?.vaUncorrected, false)}
              ${eyeField('VA (Cor.)', exam.od?.va, false)}
              ${eyeField('SPH', exam.od?.sph, false)}
              ${eyeField('CYL', exam.od?.cyl, false)}
              ${eyeField('AXIS', exam.od?.axis, false)}
              ${eyeField('ADD', exam.od?.add, true)}
            </div>
          </div>
          <div style="border:1.5px solid #FDE68A;border-radius:10px;overflow:hidden">
            <div style="background:#FFF7ED;padding:8px 12px;border-bottom:1px solid #FDE68A;display:flex;align-items:center;gap:6px">
              <div style="width:7px;height:7px;border-radius:50%;background:#E8760A;flex-shrink:0"></div>
              <span style="font-size:.65rem;font-weight:800;text-transform:uppercase;letter-spacing:.07em;color:#B45309">OS (Left Eye)</span>
            </div>
            <div style="display:flex;background:#fff">
              ${eyeField('VA (Un.)', exam.os?.vaUncorrected, false)}
              ${eyeField('VA (Cor.)', exam.os?.va, false)}
              ${eyeField('SPH', exam.os?.sph, false)}
              ${eyeField('CYL', exam.os?.cyl, false)}
              ${eyeField('AXIS', exam.os?.axis, false)}
              ${eyeField('ADD', exam.os?.add, true)}
            </div>
          </div>
        </div>
        ${hasIopOrPd ? `<div style="display:flex;gap:10px;flex-wrap:wrap">
          ${exam.iop?.od ? `<div style="flex:1;min-width:120px;background:#f9fafb;border:1px solid #eee;border-radius:8px;padding:8px 12px"><div style="font-size:.6rem;text-transform:uppercase;letter-spacing:.05em;color:#9CA3AF;margin-bottom:2px">IOP (OD)</div><div style="font-size:.88rem;font-weight:700;color:#1C1C1C">${exam.iop.od} <span style="font-size:.7rem;font-weight:400;color:#9CA3AF">mmHg</span></div></div>` : ''}
          ${exam.iop?.os ? `<div style="flex:1;min-width:120px;background:#f9fafb;border:1px solid #eee;border-radius:8px;padding:8px 12px"><div style="font-size:.6rem;text-transform:uppercase;letter-spacing:.05em;color:#9CA3AF;margin-bottom:2px">IOP (OS)</div><div style="font-size:.88rem;font-weight:700;color:#1C1C1C">${exam.iop.os} <span style="font-size:.7rem;font-weight:400;color:#9CA3AF">mmHg</span></div></div>` : ''}
          ${exam.pd ? `<div style="flex:1;min-width:120px;background:#f9fafb;border:1px solid #eee;border-radius:8px;padding:8px 12px"><div style="font-size:.6rem;text-transform:uppercase;letter-spacing:.05em;color:#9CA3AF;margin-bottom:2px">PD</div><div style="font-size:.88rem;font-weight:700;color:#1C1C1C">${exam.pd} <span style="font-size:.7rem;font-weight:400;color:#9CA3AF">mm</span></div></div>` : ''}
        </div>` : ''}
      </div>
    </div>
    <div class="card">
      <div class="card-header"><div class="card-title">Clinical Findings</div></div>
      <div class="card-body">
        <div class="form-group" style="margin-bottom:14px"><label class="form-label">Diagnosis</label>${ro(exam.diagnosis)}</div>
        ${exam.externalFindings ? `<div class="form-group" style="margin-bottom:14px"><label class="form-label">External / Internal Findings</label>${ro(exam.externalFindings)}</div>` : ''}
        ${ishihara ? `<div class="form-group" style="margin-bottom:14px">
          <div style="display:flex;align-items:center;gap:8px;background:#f9fafb;border:1px solid #e5e7eb;border-radius:8px;padding:11px 13px;font-size:.8rem;color:#374151">
            <span style="font-weight:600;color:#6b7280">Ishihara Test:</span>
            <span style="font-size:.72rem;font-weight:700;padding:2px 10px;border-radius:20px;${ishihara === 'Normal' ? 'background:#DCFCE7;color:#16A34A' : 'background:#FEF3C7;color:#B45309'}">${ishihara}</span>
          </div>
        </div>` : ''}
        ${testResultsPlain ? `<div class="form-group" style="margin-bottom:14px"><label class="form-label">Test Results</label>${ro(testResultsPlain)}</div>` : ''}
        ${exam.remarks ? `<div class="form-group"><label class="form-label">Clinical Remarks</label>${ro(exam.remarks)}</div>` : ''}
      </div>
    </div>
  </div>`
  }

  // Doctors editing/creating their OWN exam always go through the wizard
  // now (new-examination/edit-examination) — this route used to carry its
  // own parallel single-form editor with a stale field set (lens type,
  // recommendation, etc. that no longer belong to `examinations`).
  // Redirect rather than maintain a second implementation.
  window.state.afterRender = () => window.navigate(
    params.examId ? 'edit-examination' : 'new-examination',
    p ? { patientId: p.id, ...(params.examId ? { examId: params.examId } : {}) } : {}
  )
  return `<div class="page-body"><div class="alert-info">${ic('info','icon-sm')} Redirecting to the examination wizard…</div></div>`
}

// ════════════════════════════════════════════════════════════════
//  EXAM RECORDS LIST  (Admin / Staff / Doctor)
// ════════════════════════════════════════════════════════════════
function pageExamRecords() {
  const { role, user } = st()

  // Doctor filter comes from this navigation's own params, not the sticky
  // state.filter (which router.js only overwrites when a filter is explicitly
  // passed — otherwise it leaks in from whatever page was visited last, e.g.
  // landing here with a stale 'pending' from Appointments). That made the
  // admin/staff view default to whatever filter happened to be left over
  // instead of "All Doctors". Reading state.params.filter, which router.js
  // always replaces on every navigate() call, fixes that.
  const navFilter = window.state.params?.filter

  // For doctor role: always show only their own records
  const docFilter = role === 'doctor'
    ? (user?.name || 'Dr. Ruziel Palaje')
    : (navFilter && navFilter !== 'all') ? navFilter : 'all'

  const allExams = getExamRecords()

  const filtered      = docFilter === 'all' ? allExams : allExams.filter(e => e.doctor === docFilter)
  const uniqueDoctors = [...new Set(allExams.map(e => e.doctor))]

  // Stats: doctors see only their own counts; admin/staff see clinic-wide
  const statBase = role === 'doctor' ? filtered : allExams

  window.state.afterRender = () => { window.initPagination('exam-records-tbody'); window.initSortable('exam-records-tbody') }

  return `
  <div class="page-header">
    <div class="page-header-left">
      <h1 class="page-title">Examination Records</h1>
      <p class="page-subtitle">${role === 'doctor' ? 'Your optical examination history.' : 'Complete history of optical examinations.'}</p>
    </div>
  </div>
  <div class="page-body">
    <div class="stats-grid" style="margin-bottom:20px">
      <div class="stat-card">
        <div class="stat-info"><div class="stat-value">${statBase.length}</div><div class="stat-label">${role === 'doctor' ? 'My Exams' : 'Total Exams'}</div></div>
        <div class="stat-icon orange">${ic('file-text','icon-lg')}</div>
      </div>
      <div class="stat-card">
        <div class="stat-info"><div class="stat-value">${statBase.filter(e=>e.status==='completed').length}</div><div class="stat-label">Completed</div></div>
        <div class="stat-icon green">${ic('check-circle','icon-lg')}</div>
      </div>
      <div class="stat-card">
        <div class="stat-info"><div class="stat-value">${new Set(statBase.map(e=>e.patientId)).size}</div><div class="stat-label">Patients Examined</div></div>
        <div class="stat-icon" style="background:#DBEAFE;color:#2563EB">${ic('users','icon-lg')}</div>
      </div>
      ${role !== 'doctor' ? `<div class="stat-card">
        <div class="stat-info"><div class="stat-value">${uniqueDoctors.length}</div><div class="stat-label">Examining Doctors</div></div>
        <div class="stat-icon" style="background:#EDE9FE;color:#7C3AED">${ic('user','icon-lg')}</div>
      </div>` : ''}
    </div>
    <div class="table-wrap">
      <div class="table-toolbar">
        <span class="table-title">${filtered.length} record${filtered.length!==1?'s':''}</span>
        <div class="table-actions">
          <div class="search-input-wrap">
            ${ic('search','icon-sm')}
            <input class="search-input" placeholder="Search patient or diagnosis…"
                   oninput="window.filterTable(this,'exam-records-tbody')">
          </div>
          ${role !== 'doctor' ? window.selectFieldHtml('exam-records-doc-filter', {
            value: docFilter,
            options: [{ value: 'all', label: 'All Doctors' }, ...uniqueDoctors.map(d => ({ value: d, label: d }))],
            onchange: "window.navigate('exam-records',{filter:this.value})",
            style: 'width:auto;min-width:150px;padding:7px 32px 7px 12px;font-size:.82rem'
          }) : ''}
        </div>
      </div>
      ${filtered.length ? `<table class="tbl">
        <colgroup>
          <col style="width:8%"><col style="width:20%"><col style="width:16%"><col style="width:10%">
          <col style="width:22%"><col style="width:10%"><col style="width:14%">
        </colgroup>
        <thead><tr>
          <th>Exam ID</th>
          <th data-sort-key="patient" data-sort-type="text">Patient</th>
          <th>Doctor</th>
          <th data-sort-key="date" data-sort-type="date">Date</th>
          <th>Diagnosis</th><th>Status</th><th>Actions</th>
        </tr></thead>
        <tbody id="exam-records-tbody">
          ${filtered.map(e => `<tr data-search="${e.patientName.toLowerCase()} ${(e.diagnosis||'').toLowerCase()} ${e.doctor.toLowerCase()}" data-sort-patient="${e.patientName.toLowerCase()}" data-sort-date="${e.date}">
            <td data-label="Exam ID"><code style="font-size:.73rem;color:#9CA3AF">${e.id}</code></td>
            <td data-label="Patient"><div class="patient-name-cell">
              ${avatar(e.patientName, 'patient-avatar', patients.find(p=>p.id===e.patientId)?.photoUrl || null)}
              <div class="patient-name-info"><strong>${e.patientName}</strong><span>${e.patientId}</span></div>
            </div></td>
            <td data-label="Doctor" style="font-size:.82rem">${e.doctor}</td>
            <td data-label="Date" style="font-size:.82rem;white-space:nowrap">${fmtDate(e.date)}</td>
            <td data-label="Diagnosis" style="font-size:.82rem;max-width:220px;overflow:hidden;text-overflow:ellipsis;white-space:nowrap" title="${e.diagnosis}">${e.diagnosis}</td>
            <td data-label="Status">${badge(e.status || 'completed')}</td>
            <td data-label="Actions">
              <div class="exam-actions-row">
                <button class="btn-icon" title="View Details"
                        onclick="window.viewExamRecord('${e.id}')">
                  ${ic('eye','icon-sm')}
                </button>
                <button class="btn-icon" title="Print"
                        onclick="window.printExamRecord('${e.id}')">
                  ${ic('printer','icon-sm')}
                </button>
                <button class="btn-icon" title="Download PDF"
                        onclick="window.downloadExamRecordPDF('${e.id}',this)">
                  ${ic('download','icon-sm')}
                </button>
                <button class="btn-icon" title="${(role === 'doctor' && e.doctor === user?.name) ? 'Edit' : `View only, only ${e.doctor} can edit this record`}"
                        onclick="window.navigate('${(role === 'doctor' && e.doctor === user?.name) ? 'edit-examination' : 'examination'}',{patientId:'${e.patientId}',examId:'${e.id}'})">
                  ${ic((role === 'doctor' && e.doctor === user?.name) ? 'edit' : 'lock','icon-sm')}
                </button>
                ${(role === 'admin' || role === 'doctor') ? `
                <button class="btn-icon" title="Generate Clearance"
                        style="color:#0891b2"
                        onclick="window.generateClearanceFromRecord('${e.id}')">
                  ${ic('award','icon-sm')}
                </button>` : ''}
                ${(role === 'admin' || role === 'staff' || (role === 'doctor' && e.doctor === user?.name)) ? `
                <button class="btn-icon" title="Archive"
                        style="color:#d97706;border-color:#fef3c7"
                        onclick="window.confirmDeleteExam('${e.id}','${e.patientId}','${e.patientName.replace(/'/g,"\\'")}')">
                  ${ic('archive','icon-sm')}
                </button>` : ''}
              </div>
            </td>
          </tr>`).join('')}
        </tbody>
      </table>` : `<div class="table-empty">No examination records.</div>`}
    </div>
  </div>`
}

// ════════════════════════════════════════════════════════════════
//  NEW EXAMINATION FORM  (Doctor)
// ════════════════════════════════════════════════════════════════
function pageNewExamination() {
  if (state.role !== 'doctor') {
    return `<div style="display:flex;flex-direction:column;align-items:center;justify-content:center;min-height:60vh;gap:16px;text-align:center">
      <div style="width:64px;height:64px;border-radius:50%;background:#FFF7ED;display:flex;align-items:center;justify-content:center">
        <svg width="28" height="28" viewBox="0 0 24 24" fill="none" stroke="#E8891C" stroke-width="2" stroke-linecap="round" stroke-linejoin="round"><circle cx="12" cy="12" r="10"/><line x1="12" y1="8" x2="12" y2="12"/><line x1="12" y1="16" x2="12.01" y2="16"/></svg>
      </div>
      <div>
        <div style="font-size:1.15rem;font-weight:700;color:#1f2937;margin-bottom:6px">Access Restricted</div>
        <div style="font-size:.875rem;color:#6B7280;max-width:320px">Only doctors can start a new consultation. Please contact the assigned doctor to begin the examination.</div>
      </div>
      <button class="btn-ghost" onclick="window.history.back()" style="margin-top:8px">Go Back</button>
    </div>`
  }

  const { params, user } = st()
  const p = getPatientById(params?.patientId)

  if (!p) {
    const { role, user } = st()
    const todayStr = localDateStr()
    const todayLabel = new Date(todayStr + 'T00:00:00').toLocaleDateString('en-US', { month:'long', day:'numeric', year:'numeric' })

    const todayAppts = appointments.filter(a => a.date === todayStr && !['cancelled','disapproved'].includes(a.status))
    // Sort by time
    const timeVal = t => { const [h,m] = (t||'0:00').replace(' AM','').replace(' PM','').split(':').map(Number); return (t.includes('PM') && h !== 12 ? h+12 : (t.includes('AM') && h === 12 ? 0 : h)) * 60 + m }
    todayAppts.sort((a, b) => timeVal(a.time) - timeVal(b.time))

    // Initials helper
    const initials = name => name.split(' ').slice(0,2).map(w => w[0]).join('').toUpperCase()
    const miniAvatar = (name, photoUrl, size) => photoUrl
      ? `<div style="width:${size}px;height:${size}px;border-radius:50%;overflow:hidden;flex-shrink:0"><img src="${photoUrl}" alt="${name}" style="width:100%;height:100%;object-fit:cover;display:block" onerror="var w=this.parentElement;if(w){w.style.cssText='width:${size}px;height:${size}px;border-radius:50%;background:#E8760A;color:white;display:flex;align-items:center;justify-content:center;font-size:${size>=38?'.75rem':'.65rem'};font-weight:700;flex-shrink:0';w.textContent='${initials(name).replace(/'/g,"\\'")}'}"></div>`
      : `<div style="width:${size}px;height:${size}px;border-radius:50%;background:#E8760A;color:white;display:flex;align-items:center;justify-content:center;font-size:${size>=38?'.75rem':'.65rem'};font-weight:700;flex-shrink:0">${initials(name)}</div>`

    // SVG calendar icon (no emoji, works cross-platform)
    const calSVG = `<svg viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2" width="20" height="20"><rect x="3" y="4" width="18" height="18" rx="2"/><line x1="16" y1="2" x2="16" y2="6"/><line x1="8" y1="2" x2="8" y2="6"/><line x1="3" y1="10" x2="21" y2="10"/></svg>`

    const apptCardHTML = todayAppts.length
      ? `<div style="display:grid;grid-template-columns:1fr 1fr;gap:14px">
          ${todayAppts.map(a => {
            const isDone = a.status === 'completed'
            const statusBadge = isDone
              ? `<span style="background:#f3f4f6;color:#6b7280;font-size:.65rem;font-weight:700;padding:2px 8px;border-radius:20px;letter-spacing:.03em">Completed</span>`
              : `<span style="background:#FFF7ED;color:#C2410C;font-size:.65rem;font-weight:700;padding:2px 8px;border-radius:20px;letter-spacing:.03em">Approved</span>`
            const actionBtn = isDone
              ? `<button onclick="window.navigate('patient-view',{patientId:'${a.patientId}',patientName:'${a.patientName.replace(/'/g,"\\'")}'})"
                         style="width:100%;padding:8px;border-radius:8px;border:1.5px solid #e5e7eb;background:white;color:#6b7280;font-size:.78rem;font-weight:600;cursor:pointer;transition:background .15s;text-align:center"
                         onmouseover="this.style.background='#f9fafb'" onmouseout="this.style.background='white'">
                   View Record
                 </button>`
              : `<button onclick="window.startExamFromAppt('${a.id}')"
                         style="width:100%;padding:8px;border-radius:8px;border:none;background:#E8760A;color:white;font-size:.78rem;font-weight:600;cursor:pointer;transition:opacity .15s;text-align:center"
                         onmouseover="this.style.opacity='.85'" onmouseout="this.style.opacity='1'">
                   Start Examination
                 </button>`
            return `
            <div style="border:1.5px solid #e5e7eb;border-radius:12px;padding:18px;background:white;transition:border-color .15s,box-shadow .15s;display:flex;flex-direction:column;gap:10px"
                 onmouseover="this.style.borderColor='#E8891C';this.style.boxShadow='0 4px 12px rgba(232,137,28,0.1)'"
                 onmouseout="this.style.borderColor='#e5e7eb';this.style.boxShadow='none'">
              <div style="display:flex;align-items:center;gap:10px">
                ${miniAvatar(a.patientName, patients.find(p=>p.id===a.patientId)?.photoUrl, 38)}
                <div style="min-width:0">
                  <div style="font-size:.9rem;font-weight:700;color:#111827;white-space:nowrap;overflow:hidden;text-overflow:ellipsis">${a.patientName}</div>
                  <div style="font-size:.72rem;color:#6b7280;margin-top:1px">${a.patientId} &nbsp;·&nbsp; ${a.time}</div>
                </div>
              </div>
              <div>
                <div style="font-size:.75rem;color:#374151;font-weight:500;margin-bottom:5px">${a.type}</div>
                ${role === 'admin' ? `<div style="font-size:.72rem;color:#9ca3af;margin-bottom:6px">${a.doctorName}</div>` : ''}
                ${statusBadge}
              </div>
              ${actionBtn}
            </div>`
          }).join('')}
        </div>`
      : `<div style="text-align:center;padding:36px 20px">
          <div style="width:52px;height:52px;border-radius:50%;background:#FFF7ED;display:flex;align-items:center;justify-content:center;margin:0 auto 14px;color:#E8891C">
            ${calSVG}
          </div>
          <div style="font-size:.9rem;font-weight:600;color:#374151;margin-bottom:6px">No scheduled consultations for today.</div>
          <div style="font-size:.8rem;color:#9ca3af;margin-bottom:18px;line-height:1.6">Examination records are created from confirmed appointments.</div>
          <button class="btn-secondary" style="font-size:.82rem" onclick="window.navigate('doctor-schedule')">
            ${ic('calendar','icon-sm')} View My Schedule
          </button>
        </div>`

    return `
  <div class="page-header">
    <div class="page-header-left">
      <h1 class="page-title">New Examination</h1>
      <p class="page-subtitle">Select a patient from today's consultations to begin.</p>
    </div>
  </div>
  <div class="page-body">
    <div style="max-width:900px;width:100%;margin:0 auto">

      <!-- Today's appointments card -->
      <div style="background:white;border:1px solid #e5e7eb;border-radius:14px;padding:20px 24px;margin-bottom:16px">

        <!-- Card header -->
        <div style="display:flex;align-items:center;justify-content:space-between;margin-bottom:${todayAppts.length ? '20px' : '0'}">
          <div style="display:flex;align-items:center;gap:10px">
            <div style="width:32px;height:32px;border-radius:8px;background:#FFF7ED;display:flex;align-items:center;justify-content:center;color:#E8891C;flex-shrink:0">
              <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2" width="16" height="16"><rect x="3" y="4" width="18" height="18" rx="2"/><line x1="16" y1="2" x2="16" y2="6"/><line x1="8" y1="2" x2="8" y2="6"/><line x1="3" y1="10" x2="21" y2="10"/></svg>
            </div>
            <div>
              <div style="font-size:.9rem;font-weight:700;color:#111827">Today's Appointments</div>
              <div style="font-size:.72rem;color:#9ca3af">${todayLabel}</div>
            </div>
          </div>
          <span style="background:#f3f4f6;color:#374151;font-size:.72rem;font-weight:600;padding:3px 10px;border-radius:20px">${todayAppts.length} patient${todayAppts.length !== 1 ? 's' : ''}</span>
        </div>

        ${apptCardHTML}

      </div>

    </div>
  </div>`
  }

  const today      = localDateStr()
  const specificExam = params?.examId ? (p.examinations || []).find(e => e.id === params.examId) : null
  // Only prefill from a real record when actually editing THAT exam — a
  // brand-new consultation must always start blank, never carrying over
  // SPH/CYL/AXIS/diagnosis/remarks from whatever the patient's last visit
  // happened to be (that was the bug: falling back to p.examinations[0]
  // here silently reused old data for every new patient encounter).
  const lastExam   = specificExam
  const pre        = lastExam || { od:{vaUncorrected:'',sph:'',cyl:'',axis:'',va:'',add:''}, os:{vaUncorrected:'',sph:'',cyl:'',axis:'',va:'',add:''}, iop:{od:'',os:''}, pd:'' }
  const isEdit     = !!params?.examId

  // A doctor only reaches the editable wizard for their OWN exam records —
  // editing a colleague's exam via a direct 'edit-examination' navigation
  // (e.g. from the Patient Profile's Examinations tab, which lists exams by
  // every doctor, not just the current one) falls back to the same
  // read-only view every non-doctor role gets, via pageExamination().
  if (isEdit && specificExam && specificExam.doctor !== user?.name) {
    return pageExamination()
  }

  const saveLabel  = isEdit ? 'Save Changes' : 'Save Examination'

  // Schedule wizard init after DOM is ready
  // syncIssuePrescription() applies the actual `disabled` attribute to
  // every field in ne-rx-fields/ne-dispensing-fields to match their
  // initial inline opacity/pointer-events (set server-side above from the
  // same linkedRx check) — pointer-events:none alone doesn't block
  // keyboard Tab-focus into them.
  state.afterRender = () => { window._examPatientId = p.id; examWizInit(); window.syncIssuePrescription?.(); window.syncFollowUpNeeded?.() }

  const fl = (label, req=false) =>
    `<label style="font-size:.68rem;text-transform:uppercase;letter-spacing:.05em;color:#6b7280;font-weight:600;display:block;margin-bottom:6px">${label}${req ? ' <span style="color:#ef4444">*</span>' : ''}</label>`
  const inp = 'border-radius:8px;padding:10px 14px;font-size:.9rem'

  const STEPS = [
    { n:1, icon:'user',      label:'Patient Info',    sub:'Basic details'        },
    { n:2, icon:'eye',       label:'Visual Exam',     sub:'Measurements'         },
    { n:3, icon:'activity',  label:'Diagnosis',       sub:'Clinical findings'    },
    { n:4, icon:'clipboard', label:'Prescription',    sub:'Lens & frame'         },
    { n:5, icon:'package',   label:'Dispensing',      sub:'Payment & release'    },
    { n:6, icon:'message-square', label:'Consultation', sub:'Visit narrative'    },
    { n:7, icon:'file-text', label:'Review',          sub:'Prescription preview' },
  ]

  const stepperHTML = `
  <div id="wiz-stepper" style="display:flex;align-items:center;background:white;border-radius:12px;border:1px solid #e5e7eb;padding:20px 24px;margin-bottom:8px;overflow-x:auto;gap:0">
    ${STEPS.map((s, i) => `
      <div class="wiz-step-wrap" style="display:flex;align-items:center;flex:1 1 100px;min-width:100px">
        <div id="wiz-pill-${s.n}" class="wiz-pill" onclick="examWizJump(${s.n})"
             style="display:flex;align-items:center;gap:8px;cursor:pointer;min-width:0;padding:4px 4px;border-radius:8px;transition:background 0.2s;overflow:hidden"
             onmouseover="this.style.background='#f9fafb'" onmouseout="this.style.background='transparent'">
          <div id="wiz-circle-${s.n}"
               style="width:28px;height:28px;border-radius:50%;display:flex;align-items:center;justify-content:center;font-size:.78rem;font-weight:700;flex-shrink:0;transition:all 0.3s;${s.n === 1 ? 'background:#E8760A;color:white' : 'background:#f3f4f6;color:#9ca3af;border:2px solid #e5e7eb'}">${s.n}</div>
          <div class="wiz-pill-text" style="min-width:60px;overflow:hidden">
            <div class="wiz-pill-label" style="font-size:.72rem;font-weight:${s.n === 1 ? '700' : '500'};color:${s.n === 1 ? '#1f2937' : '#9ca3af'};white-space:nowrap;overflow:hidden;text-overflow:ellipsis;transition:color 0.3s">${s.label}</div>
            <div class="wiz-pill-sub" style="font-size:.62rem;color:${s.n === 1 ? '#6b7280' : '#d1d5db'};white-space:nowrap;overflow:hidden;text-overflow:ellipsis;transition:color 0.3s">${s.sub}</div>
          </div>
        </div>
        ${i < STEPS.length - 1 ? `<div id="wiz-line-${s.n}" class="wiz-step-line" style="flex:1;height:2px;background:#e5e7eb;margin:0 4px;border-radius:2px;transition:background 0.3s;min-width:6px"></div>` : ''}
      </div>`).join('')}
  </div>
  <div id="wiz-step-label" style="display:none;font-size:.8rem;font-weight:600;color:#6b7280;text-align:center;padding:6px 0 12px">Step 1 of 7: Patient Info</div>`

  // Same derivation saveNewExam() (main.js) uses to decide what actually
  // gets submitted: from the linked appointment when starting fresh from
  // one (window._examApptId, set by startExamFromAppt()), from the exam's
  // own already-saved consultation when editing, or the same default for
  // a standalone exam with neither. Shown read-only below (Step 1) rather
  // than as an editable field — see that function's own comment for why
  // this isn't something the doctor re-enters by hand: it's already fixed
  // by whatever the visit was actually booked/logged as.
  const linkedApptForType = window._examApptId ? appointments.find(a => a.id === window._examApptId) : null
  const linkedConForType  = specificExam?.consultationId ? (p.consultations || []).find(c => c.id === specificExam.consultationId) : null
  const serviceType = linkedApptForType?.type || linkedConForType?.type || 'Comprehensive Eye Examination'
  const examRequiresDiagnosis = !(window.NON_EXAM_SERVICE_TYPES || []).includes(serviceType)

  // ── Step 1: Patient Information ──────────────────────────────
  const step1 = `
  <div style="background:white;border-radius:12px;border:1px solid #e5e7eb;padding:28px">
    <div style="display:flex;align-items:center;gap:12px;margin-bottom:24px">
      <div style="width:36px;height:36px;border-radius:50%;background:#E8760A;color:white;display:flex;align-items:center;justify-content:center;flex-shrink:0">${ic('user','icon-sm')}</div>
      <div>
        <div style="font-size:.95rem;font-weight:700;color:#1f2937">Patient Information</div>
        <div style="font-size:.75rem;color:#6b7280;margin-top:1px">Basic details for this examination record</div>
      </div>
    </div>
    <div class="form-group" style="margin-bottom:16px">
      ${fl('Patient Name', true)}
      <input id="ne-patient-name" class="form-input" style="${inp}" value="${p.name}" placeholder="e.g. Juan Dela Cruz">
    </div>
    <div class="form-group" style="margin-bottom:16px">
      ${fl('Service Type')}
      <input class="form-input" style="${inp};background:#F9FAFB;color:#374151;cursor:not-allowed" value="${esc(serviceType)}" disabled readonly>
    </div>
    <div style="display:grid;grid-template-columns:1fr 1fr;gap:14px;margin-bottom:16px">
      <div class="form-group" style="margin:0">
        ${fl('Examination Date')}
        ${window.dateFieldHtml('ne-date', { value: pre.date || today, style: inp, max: 'none' })}
      </div>
      <div class="form-group" style="margin:0">
        ${fl('Patient ID')}
        <input id="ne-patient-id" class="form-input" style="${inp}" value="${p.id}" placeholder="P-2024-XXX">
      </div>
    </div>
    <div style="display:grid;grid-template-columns:1fr 1fr;gap:14px;margin-bottom:16px">
      <div class="form-group" style="margin:0">
        ${fl('Age')}
        <input id="ne-age" class="form-input" style="${inp}" value="${p.age || ''}" placeholder="e.g. 34">
      </div>
      <div class="form-group" style="margin:0">
        ${fl('Contact Number')}
        <input id="ne-contact" class="form-input" style="${inp}" inputmode="numeric" maxlength="13" oninput="window.formatContactInput(this)" value="${p.contact || ''}" placeholder="0921-245-2834">
      </div>
    </div>
    <div class="form-group" style="margin-bottom:16px">
      ${fl('Company / Employer')}
      <input id="ne-employer" class="form-input" style="${inp}" value="${p.occupation || ''}" placeholder="Optional">
    </div>
    <!-- Read-only reference for the doctor — not part of this visit's own
         record (medical history lives on the patient's profile, edited via
         Add/Edit Patient or the patient's own Settings), just surfaced here
         so it's in view while examining regardless of what this particular
         visit's service type is. Amber/prominent only when there's actually
         something on file worth not missing — an empty one stays low-key
         so a patient with nothing recorded doesn't read as an alarm. -->
    <div style="background:${p.medicalHistory ? '#FFFBEB' : '#F9FAFB'};border:2px solid ${p.medicalHistory ? '#FDE68A' : '#E5E7EB'};border-radius:10px;padding:14px 16px">
      <div style="display:flex;align-items:center;gap:8px;margin-bottom:8px">
        <span style="flex-shrink:0;display:flex;color:${p.medicalHistory ? '#D97706' : '#9CA3AF'}">${ic('alert-circle','icon-lg')}</span>
        <span style="display:inline-flex;align-items:center;font-size:.68rem;font-weight:700;text-transform:uppercase;letter-spacing:.05em;padding:2px 10px;border-radius:999px;background:${p.medicalHistory ? '#FEF3C7' : '#F3F4F6'};color:${p.medicalHistory ? '#92400E' : '#6B7280'}">Medical History</span>
      </div>
      <div style="font-size:.85rem;color:${p.medicalHistory ? '#78350F' : '#9CA3AF'};line-height:1.55;white-space:pre-wrap">${p.medicalHistory ? esc(p.medicalHistory) : 'No medical history on file.'}</div>
    </div>
  </div>`

  // ── Step 2: Consultation ──────────────────────────────────────
  // The narrative of the visit — must never carry SPH/CYL/AXIS or any
  // refraction data (that's the Visual Exam step's job). Prefill from the
  // consultation already linked to this exam when editing.
  const linkedConsultation = specificExam?.consultationId
    ? (p.consultations || []).find(c => c.id === specificExam.consultationId) : null
  const preCon = linkedConsultation || { type:'Comprehensive Eye Examination', chiefComplaint:'', historyPresentIllness:'', assessment:'', recommendation:'', followUpDate:'', followUpTime:'', status:'completed' }
  const needsFollowUpByDefault = !!preCon.followUpDate
  const preFollowUpLabel = preCon.followUpDate
    ? new Date(preCon.followUpDate+'T00:00:00').toLocaleDateString('en-PH',{year:'numeric',month:'short',day:'numeric'}) + (preCon.followUpTime ? ` at ${preCon.followUpTime}` : '')
    : 'Select date & time'

  // Follow-up Date is only ever a suggested target, not a real booked
  // slot — setting it just notifies admin/staff to go schedule the actual
  // appointment, and THAT flow already fully validates clinic days,
  // blocked dates, and every other booking rule. The picker below (see
  // openFollowUpPicker(), main.js) still rules out blocked dates/times
  // itself, same as a reschedule — not to hard-book anything here, just so
  // what the doctor recommends is realistic from the moment it's made
  // instead of staff discovering it isn't available only once they act on it.

  const step2 = `
  <div style="background:white;border-radius:12px;border:1px solid #e5e7eb;padding:28px">
    <div style="display:flex;align-items:center;gap:12px;margin-bottom:24px">
      <div style="width:36px;height:36px;border-radius:50%;background:#E8760A;color:white;display:flex;align-items:center;justify-content:center;flex-shrink:0">${ic('message-square','icon-sm')}</div>
      <div>
        <div style="font-size:.95rem;font-weight:700;color:#1f2937">Consultation</div>
        <div style="font-size:.75rem;color:#6b7280;margin-top:1px">The narrative of this visit, in the patient's and doctor's own words</div>
      </div>
    </div>
    <!-- Appointment Type and Status aren't asked here — Type is already set
         when the appointment was booked (by the patient, or by staff on
         their behalf) and Status is already managed by admin/staff working
         the appointment queue, so re-entering either would just be
         duplicate (and sometimes contradictory) data entry. saveNewExam()
         derives both automatically instead — see main.js. -->
    <div style="display:flex;align-items:flex-start;gap:24px;margin-bottom:16px;flex-wrap:wrap">
      <div>
        <span style="font-size:.68rem;text-transform:uppercase;letter-spacing:.05em;color:#6b7280;font-weight:600;white-space:nowrap;display:block;margin-bottom:6px">Need Follow-up Consultation?</span>
        <div style="display:flex;align-items:center;gap:8px">
          <input type="radio" name="ne-followup-choice" id="r-followup-yes" value="Yes" ${needsFollowUpByDefault ? 'checked' : ''} style="display:none"
                 onchange="window.syncFollowUpNeeded()">
          <input type="radio" name="ne-followup-choice" id="r-followup-no" value="No" ${needsFollowUpByDefault ? '' : 'checked'} style="display:none"
                 onchange="window.syncFollowUpNeeded()">
          <label for="r-followup-yes" id="rb-followup-yes"
                 style="display:inline-flex;align-items:center;gap:7px;height:40px;padding:0 16px;border-radius:8px;font-size:.82rem;font-weight:600;border:1.5px solid ${needsFollowUpByDefault ? '#E8891C' : '#e5e7eb'};background:${needsFollowUpByDefault ? '#FFF7ED' : '#f9fafb'};color:${needsFollowUpByDefault ? '#C4720E' : '#6b7280'};cursor:pointer;user-select:none;transition:background .2s,border-color .2s,color .2s;transform:translateZ(0)">
            <span style="width:13px;height:13px;border-radius:50%;border:2px solid ${needsFollowUpByDefault ? '#E8891C' : '#d1d5db'};display:inline-flex;align-items:center;justify-content:center;flex-shrink:0;transition:border-color .2s">
              <span style="width:6px;height:6px;border-radius:50%;background:${needsFollowUpByDefault ? '#E8760A' : 'transparent'};display:block;transition:background .2s,transform .2s cubic-bezier(.34,1.56,.64,1);transform:scale(${needsFollowUpByDefault ? '1' : '0'})"></span>
            </span>Yes</label>
          <label for="r-followup-no" id="rb-followup-no"
                 style="display:inline-flex;align-items:center;gap:7px;padding:6px 16px;border-radius:8px;font-size:.82rem;font-weight:600;border:1.5px solid ${needsFollowUpByDefault ? '#e5e7eb' : '#E8891C'};background:${needsFollowUpByDefault ? '#f9fafb' : '#FFF7ED'};color:${needsFollowUpByDefault ? '#6b7280' : '#C4720E'};cursor:pointer;user-select:none;transition:background .2s,border-color .2s,color .2s;transform:translateZ(0)">
            <span style="width:13px;height:13px;border-radius:50%;border:2px solid ${needsFollowUpByDefault ? '#d1d5db' : '#E8891C'};display:inline-flex;align-items:center;justify-content:center;flex-shrink:0;transition:border-color .2s">
              <span style="width:6px;height:6px;border-radius:50%;background:${needsFollowUpByDefault ? 'transparent' : '#E8760A'};display:block;transition:background .2s,transform .2s cubic-bezier(.34,1.56,.64,1);transform:scale(${needsFollowUpByDefault ? '0' : '1'})"></span>
            </span>No</label>
        </div>
      </div>
      <div id="ne-followup-date-wrap" style="flex:1 1 300px;min-width:260px;max-width:360px;${needsFollowUpByDefault ? '' : 'display:none'}">
        <div class="form-group" style="margin:0">
          ${fl('Follow-up Date & Time')}
          <input type="hidden" id="ne-con-followup" value="${preCon.followUpDate || ''}">
          <input type="hidden" id="ne-con-followup-time" value="${preCon.followUpTime || ''}">
          <button type="button" class="form-input" style="${inp};height:40px;text-align:left;cursor:pointer;background:#fff;display:flex;align-items:center;justify-content:space-between;gap:8px;width:100%"
                  onclick="window.openFollowUpPicker()">
            <span id="ne-followup-picker-label" style="overflow:hidden;text-overflow:ellipsis;white-space:nowrap;color:${needsFollowUpByDefault ? '#1C1C1C' : '#9CA3AF'}">${preFollowUpLabel}</span>
            <span style="color:#9CA3AF;flex-shrink:0;display:flex">${ic('calendar','icon-sm')}</span>
          </button>
        </div>
      </div>
    </div>
    <div style="${needsFollowUpByDefault ? '' : 'display:none'}" id="ne-followup-hint-wrap">
      <div style="font-size:.72rem;color:#9CA3AF;margin-top:6px;margin-bottom:16px">Clinic staff will be notified to schedule this follow-up appointment once you save.</div>
    </div>
    <div class="form-group" style="margin-bottom:16px">
      ${fl('Chief Complaint')}
      <textarea id="ne-con-complaint" class="form-textarea" style="${inp};resize:vertical;width:100%;min-height:70px" placeholder="In the patient's own words: why they came in...">${preCon.chiefComplaint || ''}</textarea>
    </div>
    <div class="form-group" style="margin-bottom:16px">
      ${fl('History of Present Illness')}
      <textarea id="ne-con-history" class="form-textarea" style="${inp};resize:vertical;width:100%;min-height:70px" placeholder="Onset, duration, associated symptoms...">${preCon.historyPresentIllness || ''}</textarea>
    </div>
    <div class="form-group" style="margin-bottom:16px">
      ${fl("Doctor's Assessment")}
      <textarea id="ne-con-assessment" class="form-textarea" style="${inp};resize:vertical;width:100%;min-height:70px" placeholder="Clinical reasoning behind the diagnosis...">${preCon.assessment || ''}</textarea>
    </div>
    <div class="form-group" style="margin:0">
      ${fl('Recommendation / Plan')}
      <textarea id="ne-con-recommendation" class="form-textarea" style="${inp};resize:vertical;width:100%;min-height:70px" placeholder="What happens next...">${preCon.recommendation || ''}</textarea>
    </div>
  </div>`

  // ── Step 3: Visual Examination ───────────────────────────────
  const step3 = `
  <div style="background:white;border-radius:12px;border:1px solid #e5e7eb;padding:28px">
    <div style="display:flex;align-items:center;gap:12px;margin-bottom:24px">
      <div style="width:36px;height:36px;border-radius:50%;background:#E8760A;color:white;display:flex;align-items:center;justify-content:center;flex-shrink:0">${ic('eye','icon-sm')}</div>
      <div>
        <div style="font-size:.95rem;font-weight:700;color:#1f2937">Visual Examination</div>
        <div style="font-size:.75rem;color:#6b7280;margin-top:1px">Enter optical measurements for both eyes</div>
      </div>
    </div>
    <div style="display:grid;grid-template-columns:1fr 1fr;gap:16px">
      <div style="border:1px solid #e5e7eb;border-left:4px solid #22c55e;border-radius:12px;padding:20px">
        <div style="display:flex;align-items:center;gap:8px;margin-bottom:16px">
          <div style="width:24px;height:24px;border-radius:50%;background:#dcfce7;display:flex;align-items:center;justify-content:center"><div style="width:8px;height:8px;border-radius:50%;background:#10B981"></div></div>
          <div><div style="font-size:.88rem;font-weight:700;color:#1f2937">Right Eye</div><div style="font-size:.7rem;color:#6b7280">OD (Oculus Dexter)</div></div>
        </div>
        <div class="wiz-eye-fields">
          <div class="form-group" style="margin:0">${fl('VA Uncorrected')}<input id="ne-od-va-un" class="form-input" style="${inp}" value="${pre.od.vaUncorrected || ''}" placeholder="20/40"></div>
          <div class="form-group" style="margin:0">${fl('VA Corrected')}<input id="ne-od-va" class="form-input" style="${inp}" value="${pre.od.va}" placeholder="20/20"></div>
          <div class="form-group" style="margin:0">${fl('Sphere')}<input id="ne-od-sph" class="form-input" style="${inp}" value="${pre.od.sph}" placeholder="+/- 0.00"></div>
          <div class="form-group" style="margin:0">${fl('Cylinder')}<input id="ne-od-cyl" class="form-input" style="${inp}" value="${pre.od.cyl}" placeholder="+/- 0.00"></div>
          <div class="form-group" style="margin:0">${fl('Axis')}<input id="ne-od-axis" class="form-input" style="${inp}" value="${pre.od.axis}" placeholder="0-180"></div>
        </div>
      </div>
      <div style="border:1px solid #e5e7eb;border-left:4px solid #E8891C;border-radius:12px;padding:20px">
        <div style="display:flex;align-items:center;gap:8px;margin-bottom:16px">
          <div style="width:24px;height:24px;border-radius:50%;background:#fff8f0;display:flex;align-items:center;justify-content:center"><div style="width:8px;height:8px;border-radius:50%;background:#E8760A"></div></div>
          <div><div style="font-size:.88rem;font-weight:700;color:#1f2937">Left Eye</div><div style="font-size:.7rem;color:#6b7280">OS (Oculus Sinister)</div></div>
        </div>
        <div class="wiz-eye-fields">
          <div class="form-group" style="margin:0">${fl('VA Uncorrected')}<input id="ne-os-va-un" class="form-input" style="${inp}" value="${pre.os.vaUncorrected || ''}" placeholder="20/40"></div>
          <div class="form-group" style="margin:0">${fl('VA Corrected')}<input id="ne-os-va" class="form-input" style="${inp}" value="${pre.os.va}" placeholder="20/20"></div>
          <div class="form-group" style="margin:0">${fl('Sphere')}<input id="ne-os-sph" class="form-input" style="${inp}" value="${pre.os.sph}" placeholder="+/- 0.00"></div>
          <div class="form-group" style="margin:0">${fl('Cylinder')}<input id="ne-os-cyl" class="form-input" style="${inp}" value="${pre.os.cyl}" placeholder="+/- 0.00"></div>
          <div class="form-group" style="margin:0">${fl('Axis')}<input id="ne-os-axis" class="form-input" style="${inp}" value="${pre.os.axis}" placeholder="0-180"></div>
        </div>
      </div>
    </div>
    <div class="form-group" style="margin-top:18px">
      ${fl('External / Internal Findings')}
      <textarea id="ne-ext-findings" class="form-textarea" style="${inp};resize:vertical;width:100%;min-height:70px" placeholder="Lids, conjunctiva, cornea, pupils...">${lastExam?.externalFindings || ''}</textarea>
    </div>
    <div style="display:none">
      <input id="ne-iop-od" value="${pre.iop?.od || ''}">
      <input id="ne-iop-os" value="${pre.iop?.os || ''}">
    </div>
  </div>`

  // ── Step 4: Diagnosis ────────────────────────────────────────
  const step4 = `
  <div style="background:white;border-radius:12px;border:1px solid #e5e7eb;padding:28px">
    <div style="display:flex;align-items:center;gap:12px;margin-bottom:24px">
      <div style="width:36px;height:36px;border-radius:50%;background:#E8760A;color:white;display:flex;align-items:center;justify-content:center;flex-shrink:0">${ic('activity','icon-sm')}</div>
      <div>
        <div style="font-size:.95rem;font-weight:700;color:#1f2937">Diagnosis</div>
        <div style="font-size:.75rem;color:#6b7280;margin-top:1px">Final clinical findings</div>
      </div>
    </div>
    <div class="form-group" style="margin-bottom:16px">
      ${fl('Diagnosis', examRequiresDiagnosis)}
      <input id="ne-diagnosis" class="form-input" style="${inp}" value="${lastExam?.diagnosis || ''}" placeholder="${examRequiresDiagnosis ? 'e.g. Myopia with mild astigmatism' : 'Optional for ' + esc(serviceType)}">
      ${!examRequiresDiagnosis ? `<div style="font-size:.72rem;color:#9ca3af;margin-top:6px">${serviceType} is a dispensing visit, not a clinical exam — a diagnosis isn't required to complete it.</div>` : ''}
    </div>
    <div class="form-group" style="margin-bottom:18px">
      ${fl('Ishihara Test Result')}
      <div style="display:flex;gap:8px;margin-top:8px">
        <input type="radio" name="ne-ishihara" id="r-ish-n" value="Normal" checked style="display:none"
               onchange="window._syncRadioPills('ne-ishihara')">
        <input type="radio" name="ne-ishihara" id="r-ish-d" value="Deficient" style="display:none"
               onchange="window._syncRadioPills('ne-ishihara')">
        <label for="r-ish-n" id="rb-ish-n"
               style="display:inline-flex;align-items:center;gap:7px;padding:7px 18px;border-radius:8px;font-size:.85rem;font-weight:600;border:1.5px solid #E8891C;background:#FFF7ED;color:#C4720E;cursor:pointer;user-select:none;transition:background .2s,border-color .2s,color .2s,box-shadow .2s;transform:translateZ(0)">
          <span style="width:14px;height:14px;border-radius:50%;border:2px solid #E8891C;display:inline-flex;align-items:center;justify-content:center;flex-shrink:0;transition:border-color .2s">
            <span style="width:7px;height:7px;border-radius:50%;background:#E8760A;display:block;transition:background .2s,transform .2s cubic-bezier(.34,1.56,.64,1);transform:scale(1)"></span>
          </span>Normal</label>
        <label for="r-ish-d" id="rb-ish-d"
               style="display:inline-flex;align-items:center;gap:7px;padding:7px 18px;border-radius:8px;font-size:.85rem;font-weight:600;border:1.5px solid #e5e7eb;background:#f9fafb;color:#6b7280;cursor:pointer;user-select:none;transition:background .2s,border-color .2s,color .2s,box-shadow .2s;transform:translateZ(0)">
          <span style="width:14px;height:14px;border-radius:50%;border:2px solid #d1d5db;display:inline-flex;align-items:center;justify-content:center;flex-shrink:0;transition:border-color .2s">
            <span style="width:7px;height:7px;border-radius:50%;background:transparent;display:block;transition:background .2s,transform .2s cubic-bezier(.34,1.56,.64,1);transform:scale(0)"></span>
          </span>Deficient</label>
      </div>
    </div>
    <div class="form-group" style="margin-bottom:16px">
      ${fl('Test Results')}
      <textarea id="ne-test-results" class="form-textarea" style="${inp};resize:vertical;width:100%;min-height:80px" placeholder="Additional test findings...">${lastExam?.testResults || ''}</textarea>
    </div>
    <div class="form-group" style="margin:0">
      ${fl('Clinical Remarks')}
      <textarea id="ne-remarks" class="form-textarea" style="${inp};resize:vertical;width:100%;min-height:80px" placeholder="Additional clinical notes...">${lastExam?.remarks || ''}</textarea>
    </div>
  </div>`

  // ── Step 5: Prescription ─────────────────────────────────────
  // Only issued when the doctor explicitly toggles it on — never inferred
  // from "a sphere value happens to be filled in" (see api/examinations/
  // create.php). Lens/frame/coating fields belong to the issued document,
  // not the exam or consultation.
  const linkedRx = specificExam ? (p.prescriptions || []).find(rx => rx.examId === specificExam.id) : null
  const preRx = linkedRx || { od:{add:''}, os:{add:''}, pd:'', lensType:'', lensMaterial:'', lensCoating:[], frameSelection:'' }
  // Default to Yes on a brand-new exam (issuing a prescription is the more
  // common outcome, so this is the lower-friction default) — but when
  // editing an exam that already exists, respect whatever was actually
  // decided for it rather than silently flipping a "No" record to "Yes".
  const issuingByDefault = specificExam ? !!linkedRx : true
  // Eyeglass vs Contact Lens determines which Lens Type/Material options
  // apply (see syncCorrectionType(), main.js) and whether Frame Selection
  // is relevant at all — inferred from a linked Rx's existing lens type
  // when editing, defaulting to Eyeglass otherwise.
  const CONTACT_LENS_TYPES = ['Hard Lenses','Soft Lenses','Hybrid Lenses','Multifocal Lenses','Scleral Lenses']
  const isContactRx = CONTACT_LENS_TYPES.includes(preRx.lensType)
  const step5 = `
  <div style="background:white;border-radius:12px;border:1px solid #e5e7eb;padding:28px">
    <div style="display:flex;align-items:center;justify-content:space-between;gap:16px;flex-wrap:wrap;margin-bottom:24px;padding-bottom:20px;border-bottom:1px solid #f3f4f6">
      <div style="display:flex;align-items:center;gap:12px">
        <div style="width:36px;height:36px;border-radius:50%;background:#E8760A;color:white;display:flex;align-items:center;justify-content:center;flex-shrink:0">${ic('clipboard','icon-sm')}</div>
        <div>
          <div style="font-size:.95rem;font-weight:700;color:#1f2937">Prescription</div>
          <div style="font-size:.75rem;color:#6b7280;margin-top:1px">Only fill this in if you're issuing a prescription today</div>
        </div>
      </div>
      <div style="display:flex;align-items:center;gap:10px;flex-shrink:0">
        <span style="font-size:.68rem;text-transform:uppercase;letter-spacing:.05em;color:#6b7280;font-weight:600;white-space:nowrap">Issue Prescription?</span>
        <div style="display:flex;align-items:center;gap:8px">
        <input type="radio" name="ne-issue-choice" id="r-issue-yes" value="Yes" ${issuingByDefault ? 'checked' : ''} style="display:none"
               onchange="window.syncIssuePrescription()">
        <input type="radio" name="ne-issue-choice" id="r-issue-no" value="No" ${issuingByDefault ? '' : 'checked'} style="display:none"
               onchange="window.syncIssuePrescription()">
        <label for="r-issue-yes" id="rb-issue-yes"
               style="display:inline-flex;align-items:center;gap:7px;padding:6px 16px;border-radius:8px;font-size:.82rem;font-weight:600;border:1.5px solid ${issuingByDefault ? '#E8891C' : '#e5e7eb'};background:${issuingByDefault ? '#FFF7ED' : '#f9fafb'};color:${issuingByDefault ? '#C4720E' : '#6b7280'};cursor:pointer;user-select:none;transition:background .2s,border-color .2s,color .2s,box-shadow .2s;transform:translateZ(0)">
          <span style="width:13px;height:13px;border-radius:50%;border:2px solid ${issuingByDefault ? '#E8891C' : '#d1d5db'};display:inline-flex;align-items:center;justify-content:center;flex-shrink:0;transition:border-color .2s">
            <span style="width:6px;height:6px;border-radius:50%;background:${issuingByDefault ? '#E8760A' : 'transparent'};display:block;transition:background .2s,transform .2s cubic-bezier(.34,1.56,.64,1);transform:scale(${issuingByDefault ? '1' : '0'})"></span>
          </span>Yes</label>
        <label for="r-issue-no" id="rb-issue-no"
               style="display:inline-flex;align-items:center;gap:7px;padding:6px 16px;border-radius:8px;font-size:.82rem;font-weight:600;border:1.5px solid ${issuingByDefault ? '#e5e7eb' : '#E8891C'};background:${issuingByDefault ? '#f9fafb' : '#FFF7ED'};color:${issuingByDefault ? '#6b7280' : '#C4720E'};cursor:pointer;user-select:none;transition:background .2s,border-color .2s,color .2s,box-shadow .2s;transform:translateZ(0)">
          <span style="width:13px;height:13px;border-radius:50%;border:2px solid ${issuingByDefault ? '#d1d5db' : '#E8891C'};display:inline-flex;align-items:center;justify-content:center;flex-shrink:0;transition:border-color .2s">
            <span style="width:6px;height:6px;border-radius:50%;background:${issuingByDefault ? 'transparent' : '#E8760A'};display:block;transition:background .2s,transform .2s cubic-bezier(.34,1.56,.64,1);transform:scale(${issuingByDefault ? '0' : '1'})"></span>
          </span>No</label>
        </div>
      </div>
    </div>
    <!-- Everything below is only meaningful when a prescription is actually
         being issued — syncIssuePrescription() (main.js) shows this overlay
         (and the Dispensing step's, id="ne-dispensing-fields") and disables
         every field underneath it the moment "No" is picked, instead of
         leaving fields that don't apply sitting there editable. -->
    <div id="ne-rx-fields" style="position:relative">
      <div id="ne-rx-overlay" style="position:absolute;inset:0;z-index:5;align-items:center;justify-content:center;background:rgba(255,255,255,.94);border-radius:8px;padding:24px;text-align:center;display:${issuingByDefault ? 'none' : 'flex'}">
        <div>
          <div style="width:44px;height:44px;border-radius:50%;background:#FFF7ED;display:flex;align-items:center;justify-content:center;margin:0 auto 12px;color:#E8891C">${ic('file-text','icon')}</div>
          <div style="font-size:.92rem;font-weight:700;color:#1f2937;margin-bottom:4px">No Prescription Being Issued</div>
          <div style="font-size:.8rem;color:#6b7280;max-width:320px;margin:0 auto;line-height:1.5">These fields don't apply to this visit. Toggle "Yes" above to issue a prescription.</div>
        </div>
      </div>
    <div class="form-group" style="margin-bottom:18px">
      ${fl('Correction Type')}
      <div style="display:flex;gap:8px;margin-top:8px">
        <input type="radio" name="ne-correction" id="r-corr-eg" value="Eyeglass" ${isContactRx ? '' : 'checked'} style="display:none"
               onchange="window.syncCorrectionType()">
        <input type="radio" name="ne-correction" id="r-corr-cl" value="Contact Lens" ${isContactRx ? 'checked' : ''} style="display:none"
               onchange="window.syncCorrectionType()">
        <label for="r-corr-eg" id="rb-corr-eg"
               style="display:inline-flex;align-items:center;gap:7px;padding:7px 18px;border-radius:8px;font-size:.85rem;font-weight:600;border:1.5px solid ${isContactRx ? '#e5e7eb' : '#E8891C'};background:${isContactRx ? '#f9fafb' : '#FFF7ED'};color:${isContactRx ? '#6b7280' : '#C4720E'};cursor:pointer;user-select:none;transition:background .2s,border-color .2s,color .2s,box-shadow .2s;transform:translateZ(0)">
          <span style="width:14px;height:14px;border-radius:50%;border:2px solid ${isContactRx ? '#d1d5db' : '#E8891C'};display:inline-flex;align-items:center;justify-content:center;flex-shrink:0;transition:border-color .2s">
            <span style="width:7px;height:7px;border-radius:50%;background:${isContactRx ? 'transparent' : '#E8760A'};display:block;transition:background .2s,transform .2s cubic-bezier(.34,1.56,.64,1);transform:scale(${isContactRx ? '0' : '1'})"></span>
          </span>Eyeglass</label>
        <label for="r-corr-cl" id="rb-corr-cl"
               style="display:inline-flex;align-items:center;gap:7px;padding:7px 18px;border-radius:8px;font-size:.85rem;font-weight:600;border:1.5px solid ${isContactRx ? '#E8891C' : '#e5e7eb'};background:${isContactRx ? '#FFF7ED' : '#f9fafb'};color:${isContactRx ? '#C4720E' : '#6b7280'};cursor:pointer;user-select:none;transition:background .2s,border-color .2s,color .2s,box-shadow .2s;transform:translateZ(0)">
          <span style="width:14px;height:14px;border-radius:50%;border:2px solid ${isContactRx ? '#E8891C' : '#d1d5db'};display:inline-flex;align-items:center;justify-content:center;flex-shrink:0;transition:border-color .2s">
            <span style="width:7px;height:7px;border-radius:50%;background:${isContactRx ? '#E8760A' : 'transparent'};display:block;transition:background .2s,transform .2s cubic-bezier(.34,1.56,.64,1);transform:scale(${isContactRx ? '1' : '0'})"></span>
          </span>Contact Lens</label>
      </div>
    </div>
    <div id="ne-add-pd-row" style="display:grid;grid-template-columns:${isContactRx ? '1fr 1fr' : '1fr 1fr 1fr'};gap:14px;margin-bottom:16px">
      <div class="form-group" style="margin:0">${fl('ADD (OD)')}<input id="ne-od-add" class="form-input" style="${inp}" value="${preRx.od?.add || pre.od.add || ''}" placeholder="+/- 0.00"></div>
      <div class="form-group" style="margin:0">${fl('ADD (OS)')}<input id="ne-os-add" class="form-input" style="${inp}" value="${preRx.os?.add || pre.os.add || ''}" placeholder="+/- 0.00"></div>
      <div class="form-group" id="ne-pd-group" style="margin:0;${isContactRx ? 'display:none' : ''}">${fl('Pupillary Distance (PD)')}<input id="ne-pd" class="form-input" style="${inp}" value="${preRx.pd || pre.pd || ''}" placeholder="e.g. 62mm"></div>
    </div>
    <div id="ne-frame-lens-row" style="display:grid;grid-template-columns:${isContactRx ? '1fr' : '1fr 1fr'};gap:14px;margin-bottom:16px">
      <div class="form-group" id="ne-frame-group" style="margin:0;${isContactRx ? 'display:none' : ''}">
        ${fl('Frame Selection')}
        <input id="ne-frame" class="form-input" style="${inp}" value="${preRx.frameSelection || ''}" placeholder="e.g. Ray-Ban Classic">
      </div>
      <div class="form-group" style="margin:0">
        ${fl('Lens Type')}
        ${window.selectFieldHtml('ne-lens-type', {
          value: preRx.lensType || '',
          placeholder: 'Select lens type',
          options: isContactRx ? CONTACT_LENS_TYPES : ['Single Vision','Bifocal','Progressive'],
          style: inp
        })}
      </div>
    </div>
    <div class="form-group" style="margin-bottom:16px">
      ${fl('Lens Material')}
      ${window.selectFieldHtml('ne-lens-material', {
        value: preRx.lensMaterial || '',
        placeholder: 'Select lens material',
        options: isContactRx ? ['Silicone Hydrogel','Hydrogel','Rigid Gas Permeable (RGP)'] : ['CR-39','Polycarbonate','High Index','Trivex'],
        style: inp
      })}
    </div>
    <div class="form-group" style="margin:0">
      ${fl('Lens Coatings')}
      <!-- Anti-Reflective, Blue Light Filter, and Scratch Resistant are all
           lens-surface treatments — an eyeglass-specific concept, since a
           contact lens sits directly on the eye rather than in a frame
           people can see reflections off or wipe with a cloth.
           Photochromic is the one coating with real contact lens products
           (e.g. Transitions-brand contacts), so it's the only one that
           stays for Contact Lens — hidden/shown by syncCorrectionType(). -->
      <div style="display:flex;gap:16px;flex-wrap:wrap;margin-top:8px">
        ${[['Anti-Reflective','ar',false],['Blue Light Filter','bl',false],['Photochromic','ph',true],['Scratch Resistant','sr',false]].map(([lbl, key, contactOk]) =>
          `<label id="ne-coat-group-${key}" style="display:${(!contactOk && isContactRx) ? 'none' : 'flex'};align-items:center;gap:8px;cursor:pointer;font-size:.88rem;font-weight:500"><input type="checkbox" class="chk" id="ne-coat-${key}" value="${lbl}" ${(preRx.lensCoating || []).includes(lbl) ? 'checked' : ''}> ${lbl}</label>`
        ).join('')}
      </div>
    </div>
    </div><!-- end ne-rx-fields -->
  </div>`

  // ── Step 6: Dispensing Information ──────────────────────────
  const step6 = `
  <div style="background:white;border-radius:12px;border:1px solid #e5e7eb;padding:28px">
    <div style="display:flex;align-items:center;gap:12px;margin-bottom:24px">
      <div style="width:36px;height:36px;border-radius:50%;background:#E8760A;color:white;display:flex;align-items:center;justify-content:center;flex-shrink:0">${ic('package','icon-sm')}</div>
      <div>
        <div style="font-size:.95rem;font-weight:700;color:#1f2937">Dispensing Information</div>
        <div style="font-size:.75rem;color:#6b7280;margin-top:1px">Eyeglass release and payment details</div>
      </div>
    </div>
    <!-- Nothing to dispense if no prescription is being issued this visit —
         overlaid/disabled together with the Prescription step's own fields
         by syncIssuePrescription() (main.js). -->
    <div id="ne-dispensing-fields" style="position:relative">
      <div id="ne-dispensing-overlay" style="position:absolute;inset:0;z-index:5;align-items:center;justify-content:center;background:rgba(255,255,255,.94);border-radius:8px;padding:24px;text-align:center;display:${issuingByDefault ? 'none' : 'flex'}">
        <div>
          <div style="width:44px;height:44px;border-radius:50%;background:#FFF7ED;display:flex;align-items:center;justify-content:center;margin:0 auto 12px;color:#E8891C">${ic('package','icon')}</div>
          <div style="font-size:.92rem;font-weight:700;color:#1f2937;margin-bottom:4px">Nothing to Dispense</div>
          <div style="font-size:.8rem;color:#6b7280;max-width:320px;margin:0 auto;line-height:1.5">No prescription is being issued for this visit. Toggle "Yes" on the Prescription step to enable dispensing.</div>
        </div>
      </div>
    <div class="form-group" style="margin-bottom:14px">
      ${fl('Total Amount (PHP)')}
      <input id="ne-total" type="number" class="form-input" style="${inp}" value="${linkedRx?.totalAmount ?? '0.00'}" placeholder="0.00">
    </div>
    <div style="display:grid;grid-template-columns:1fr 1fr;gap:14px">
      <div class="form-group" style="margin:0">
        ${fl('Dispensed Date')}
        ${window.dateFieldHtml('ne-dispensed-date', { value: linkedRx?.dispensedDate || today, style: inp, max: 'none' })}
      </div>
      <div class="form-group" style="margin:0">
        ${fl('Received By')}
        <input id="ne-received-by" class="form-input" style="${inp}" value="${linkedRx?.receivedBy || ''}" placeholder="e.g. Juan Dela Cruz">
      </div>
    </div>
    </div><!-- end ne-dispensing-fields -->
  </div>`

  // ── Step 7: Prescription Review ──────────────────────────────
  const step7 = `
  <div style="background:white;border-radius:12px;border:1px solid #e5e7eb;padding:28px" id="rx-preview-wrapper">
    <div style="display:flex;align-items:center;justify-content:space-between;margin-bottom:20px">
      <div style="display:flex;align-items:center;gap:12px">
        <div style="width:36px;height:36px;border-radius:50%;background:#E8760A;color:white;display:flex;align-items:center;justify-content:center;flex-shrink:0">${ic('file-text','icon-sm')}</div>
        <div>
          <div style="font-size:.95rem;font-weight:700;color:#1f2937">Prescription Summary</div>
          <div style="font-size:.75rem;color:#6b7280;margin-top:1px">Auto-generated from your entries</div>
        </div>
      </div>
      <span style="font-size:.65rem;font-weight:700;color:#E8891C;letter-spacing:.06em;text-transform:uppercase;padding:3px 10px;background:#fff8f0;border:1px solid #fed7aa;border-radius:20px;white-space:nowrap">AUTO-GENERATED</span>
    </div>
    <div style="border:1.5px dashed #d1d5db;border-radius:10px;padding:24px" id="ne-rx-preview">
      <div style="text-align:center;color:#9CA3AF;font-size:.84rem;padding:16px">Loading preview...</div>
    </div>
    <div style="display:flex;gap:10px;justify-content:flex-end;margin-top:16px">
      <button class="btn-secondary" onclick="window.printNewExamDraft(window._examPatientId)">${ic('printer','icon-sm')} Print Prescription</button>
    </div>
  </div>`

  // Assembled in the user-facing order (Patient Info, Visual Exam, Diagnosis,
  // Prescription, Dispensing, Consultation, Review) rather than declaration
  // order above — the wiz-step-N div ids come from position in this array,
  // not from the step2/step3/etc. variable names, so reordering here is all
  // that's needed to move Consultation to just before Review.
  const stepsHTML = [step1, step3, step4, step5, step6, step2, step7]
    .map((html, i) => `<div id="wiz-step-${i + 1}" style="${i === 0 ? '' : 'display:none'}">${html}</div>`).join('')

  const navHTML = `
  <div id="wiz-nav" style="display:flex;justify-content:space-between;align-items:center;margin-top:16px;background:white;border-radius:12px;border:1px solid #e5e7eb;padding:16px 20px">
    <button id="wiz-btn-back" onclick="examWizGo(-1)"
            style="display:inline-flex;visibility:hidden;align-items:center;gap:8px;padding:10px 20px;background:white;color:#374151;border:1.5px solid #d1d5db;border-radius:8px;font-family:'Poppins',sans-serif;font-size:.88rem;font-weight:600;cursor:pointer;transition:background 0.15s"
            onmouseover="this.style.background='#f9fafb'" onmouseout="this.style.background='white'">
      ${ic('chevron-left','icon-sm')} Back
    </button>
    <div style="display:flex;gap:10px;align-items:center">
      <button id="wiz-btn-next" onclick="examWizGo(1)"
              style="display:inline-flex;align-items:center;gap:8px;padding:10px 24px;background:#E8760A;color:white;border:none;border-radius:8px;font-family:'Poppins',sans-serif;font-size:.88rem;font-weight:600;cursor:pointer;transition:opacity 0.2s"
              onmouseover="this.style.opacity='.85'" onmouseout="this.style.opacity='1'">
        Next ${ic('chevron-right','icon-sm')}
      </button>
      <button id="wiz-btn-save" onclick="window.saveNewExam(window._examPatientId)"
              style="display:none;align-items:center;gap:8px;padding:10px 24px;background:#10B981;color:white;border:none;border-radius:8px;font-family:'Poppins',sans-serif;font-size:.88rem;font-weight:600;cursor:pointer;transition:opacity 0.2s"
              onmouseover="this.style.opacity='.85'" onmouseout="this.style.opacity='1'">
        ${ic('check','icon-sm')} ${saveLabel}
      </button>
    </div>
  </div>`

  const _dob = p.dob ? new Date(p.dob+'T00:00:00').toLocaleDateString('en-PH',{year:'numeric',month:'short',day:'numeric'}) : '—'

  const rightColumn = `
  <div style="background:white;border-radius:12px;border:1px solid #e5e7eb;padding:20px">
    <!-- Patient Profile -->
    <div style="text-align:center;margin-bottom:16px;padding-bottom:16px;border-bottom:1px solid #f3f4f6">
      <div style="width:72px;height:72px;border-radius:50%;background:#E8760A;display:flex;align-items:center;justify-content:center;margin:0 auto 10px;font-size:1.5rem;font-weight:800;color:#fff;letter-spacing:-.02em;overflow:hidden">${p.photoUrl ? `<img src="${p.photoUrl}" alt="${p.name}" style="width:100%;height:100%;object-fit:cover;border-radius:50%;display:block" onerror="${avatarFallbackAttr(p.name)}">` : initials(p.name)}</div>
      <div style="font-size:1rem;font-weight:800;color:#1f2937;margin-bottom:2px">${p.name}</div>
      <div style="font-size:.75rem;font-family:monospace;color:#9CA3AF;margin-bottom:6px">${p.id}</div>
      <span style="display:inline-block;background:#dcfce7;color:#16a34a;font-size:.62rem;font-weight:700;text-transform:uppercase;letter-spacing:.06em;padding:2px 10px;border-radius:20px">${p.status || 'Active'}</span>
      ${p.occupation ? `<div style="font-size:.72rem;color:#9CA3AF;margin-top:6px">${p.occupation}</div>` : ''}
    </div>
    <div style="display:flex;flex-direction:column;gap:12px">
      ${[
        [ic('user','icon-sm'),     'Gender / Age',    `${p.gender||'—'}, ${p.age ? p.age+' yrs' : '—'}`],
        [ic('calendar','icon-sm'), 'Date of Birth',   _dob],
        [ic('phone','icon-sm'),    'Contact Number',  p.contact || '—'],
        [ic('calendar','icon-sm'), 'Last Visit',      (p.lastVisit && p.lastVisit !== '—') ? new Date(p.lastVisit+'T00:00:00').toLocaleDateString('en-PH',{year:'numeric',month:'short',day:'numeric'}) : '—'],
      ].map(([iconHtml, label, val]) => `
        <div style="display:flex;align-items:flex-start;gap:10px">
          <span style="color:#9ca3af;flex-shrink:0;margin-top:2px">${iconHtml}</span>
          <div>
            <div style="font-size:.6rem;font-weight:700;text-transform:uppercase;letter-spacing:.06em;color:#9CA3AF;margin-bottom:2px">${label}</div>
            <div style="font-size:.82rem;font-weight:600;color:#1f2937">${val}</div>
          </div>
        </div>`).join('')}
    </div>
  </div>
  `

  return `
  <div class="page-header">
    <div class="page-header-left">
      <div style="display:flex;align-items:center;gap:12px">
        <button class="btn-icon" onclick="window.goBack('${isEdit ? 'patient-view' : 'new-examination'}'${isEdit ? `,{patientId:'${p.id}',patientName:'${p.name.replace(/'/g,"\\'")}'}` : ''})" title="Back">${ic('chevron-left','icon')}</button>
        <div>
          <h1 class="page-title" style="font-size:1.4rem">${isEdit ? 'Edit Optical Examination' : 'Optical Examination Record'}</h1>
          <p class="page-subtitle">Patient: <strong>${p.name}</strong> &nbsp;·&nbsp; ${p.id}${isEdit ? ` &nbsp;·&nbsp; ${params.examId}` : ''}</p>
        </div>
      </div>
    </div>
  </div>

  <div class="page-body">
  <div class="exam-layout">

    <!-- LEFT: Wizard -->
    <div style="min-width:0;overflow:hidden">
      ${stepperHTML}
      <div id="wiz-steps-container" style="position:relative">
        ${stepsHTML}
      </div>
      ${navHTML}
    </div>

    <!-- RIGHT: Patient Info + Timeline -->
    <div class="exam-sidebar">
      ${rightColumn}
    </div>

  </div>

  <style>
    .exam-layout {
      display: grid;
      grid-template-columns: 1fr 300px;
      gap: 20px;
      align-items: start;
      max-width: 100%;
      overflow: hidden;
    }
    .exam-sidebar {
      display: flex;
      flex-direction: column;
      gap: 16px;
      /* Was position:sticky — that's exactly what caused the visible
         offset: a stuck sidebar stays pinned near the viewport top while
         the non-sticky left column keeps scrolling normally past it, so
         the two only ever lined up exactly at scrollY:0. Plain flow keeps
         both columns moving together, staying grid-aligned at every
         scroll position instead of just the top. */
      align-self: start;
      margin: 0;
      min-width: 0;
      width: 300px;
      max-width: 300px;
    }
    /* Stepper — the same compact, vertical (icon-over-label) style at
       every viewport width, desktop included, instead of switching layouts
       at the 768px breakpoint. Each step owns a fixed 100px column so
       labels never need clipping; #wiz-stepper still scrolls horizontally
       if 7 columns genuinely don't fit the available width. */
    #wiz-stepper { padding: 16px 12px; gap: 0; overflow-x: auto; width: 100%; box-sizing: border-box; }
    .wiz-step-wrap {
      position: relative !important;
      flex-direction: column !important;
      align-items: center !important;
      flex: 1 1 100px !important;
      min-width: 100px !important;
    }
    /* Pill: fills column width, text visible without clipping */
    .wiz-pill {
      flex-direction: column !important;
      align-items: center !important;
      gap: 8px !important;
      padding: 0 !important;
      overflow: visible !important;
      position: relative;
      width: 100% !important;
    }
    /* Circle: z-index 2 so it renders above the connector lines */
    .wiz-pill > div:first-child {
      position: relative;
      z-index: 2;
      width: 30px !important;
      height: 30px !important;
    }
    .wiz-pill-text { text-align: center; overflow: visible !important; min-width: 0; width: 100%; }
    .wiz-pill-label {
      font-size: .62rem !important;
      white-space: nowrap !important;
      overflow: visible !important;
      text-overflow: clip !important;
      text-align: center;
      line-height: 1.3;
    }
    .wiz-pill-sub { display: block !important; font-size: .56rem !important; white-space: nowrap !important; overflow: hidden !important; text-overflow: ellipsis !important; }
    /* Line: spans only between circle edges with a 4px white gap on each side */
    .wiz-step-line {
      position: absolute !important;
      top: 15px !important;
      left: calc(50% + 19px) !important;
      width: calc(100% - 38px) !important;
      height: 2px !important;
      margin: 0 !important;
      flex: none !important;
      z-index: 1;
      min-width: unset !important;
    }
    #wiz-nav { padding: 12px 14px; }
    #wiz-btn-back { padding: 9px 16px !important; font-size: .84rem !important; }
    #wiz-btn-next, #wiz-btn-save { padding: 9px 20px !important; font-size: .84rem !important; }
    @media (max-width: 768px) {
      .exam-layout {
        grid-template-columns: 1fr;
      }
      .exam-sidebar {
        width: 100%;
        max-width: 100%;
        position: static;
      }
    }
    @media print {
      #sidebar, .topbar, .page-header, #rx-preview-wrapper .btn-secondary,
      #rx-preview-wrapper ~ * { display: none !important; }
      #rx-preview-wrapper { border: 1px solid #ccc !important; page-break-inside: avoid; box-shadow: none !important; }
      body { background: white; }
    }
  </style>

  </div>`
}


// ════════════════════════════════════════════════════════════════
//  PATIENT — EXAMINATION HISTORY
// ════════════════════════════════════════════════════════════════
function pagePatientExamHistory() {
  const { user } = st()
  const myExams = user ? patients.find(p => p.id === user.id)?.examinations || [] : []
  const sorted  = [...myExams].sort((a,b) => b.date.localeCompare(a.date))
  const latest  = sorted[0] || null

  window.state.afterRender = () => {
    window._filterExamHistory = function(q) {
      const term = q.toLowerCase()
      let anyMatch = false
      document.querySelectorAll('.exam-hist-row').forEach(function(r) {
        const match = (r.dataset.search || '').includes(term)
        r.style.display = match ? '' : 'none'
        if (match) anyMatch = true
      })
      window._syncSearchEmptyState('exam-hist-card', !anyMatch, 'div', 'No examinations match your search.')
    }
  }

  return `
  <div class="page-header">
    <div class="page-header-left">
      <h1 class="page-title">Examination History</h1>
      <p class="page-subtitle">Your complete optical examination records from Cana Optical Clinic</p>
    </div>
  </div>
  <div class="page-body">

    ${sorted.length ? `

    ${latest ? `
    <!-- Latest examination — featured card -->
    <div style="background:linear-gradient(135deg,#1C1C1C 0%,#252525 100%);border-radius:14px;padding:22px 26px;margin-bottom:20px">
      <div style="font-size:.6rem;text-transform:uppercase;letter-spacing:.14em;color:#E8760A;font-weight:800;margin-bottom:10px">Latest Examination</div>
      <div style="display:flex;align-items:flex-start;justify-content:space-between;gap:14px;flex-wrap:wrap;margin-bottom:16px">
        <div>
          <div style="font-size:1.1rem;font-weight:800;color:#fff;margin-bottom:3px">${latest.diagnosis}</div>
          <div style="font-size:.77rem;color:rgba(255,255,255,.55)">${fmtDate(latest.date)} &bull; ${latest.doctor}</div>
        </div>
        <div style="display:flex;gap:8px;flex-wrap:wrap;flex-shrink:0">
          <button onclick="window.viewExamDetail('${user.id}','${latest.id}')"
            style="display:flex;align-items:center;gap:5px;padding:7px 14px;border-radius:8px;border:1px solid rgba(255,255,255,.18);background:rgba(255,255,255,.08);color:rgba(255,255,255,.85);font-family:inherit;font-size:.8rem;font-weight:500;cursor:pointer;transition:background .15s,border-color .15s"
            onmouseover="this.style.background='rgba(255,255,255,.16)';this.style.borderColor='rgba(255,255,255,.3)'"
            onmouseout="this.style.background='rgba(255,255,255,.08)';this.style.borderColor='rgba(255,255,255,.18)'">
            ${ic('eye','icon-sm')} View Results
          </button>
          <button onclick="window.viewPrescriptionModal('${user.id}','${latest.id}')"
            style="display:flex;align-items:center;gap:5px;padding:7px 14px;border-radius:8px;border:none;background:#E8760A;color:#fff;font-family:inherit;font-size:.8rem;font-weight:600;cursor:pointer;transition:opacity .15s"
            onmouseover="this.style.opacity='.85'" onmouseout="this.style.opacity='1'">
            ${ic('file-text','icon-sm')} Prescription
          </button>
        </div>
      </div>
      <!-- OD/OS snapshot -->
      <div style="display:grid;grid-template-columns:1fr 1fr;gap:10px">
        <div style="background:rgba(34,197,94,.1);border:1px solid rgba(34,197,94,.22);border-radius:8px;padding:10px 14px">
          <div style="font-size:.58rem;font-weight:800;text-transform:uppercase;letter-spacing:.08em;color:#4ADE80;margin-bottom:7px">OD (Right Eye)</div>
          <div style="display:flex;gap:16px;flex-wrap:wrap">
            <span><span style="font-size:.58rem;color:rgba(255,255,255,.38)">SPH</span> <strong style="font-family:monospace;font-size:.88rem;color:#fff">${latest.od?.sph || '—'}</strong></span>
            <span><span style="font-size:.58rem;color:rgba(255,255,255,.38)">CYL</span> <strong style="font-family:monospace;font-size:.88rem;color:#fff">${latest.od?.cyl || '—'}</strong></span>
            <span><span style="font-size:.58rem;color:rgba(255,255,255,.38)">AXIS</span> <strong style="font-family:monospace;font-size:.88rem;color:#fff">${latest.od?.axis || '—'}</strong></span>
          </div>
        </div>
        <div style="background:rgba(232,118,10,.1);border:1px solid rgba(232,118,10,.22);border-radius:8px;padding:10px 14px">
          <div style="font-size:.58rem;font-weight:800;text-transform:uppercase;letter-spacing:.08em;color:#FBBF24;margin-bottom:7px">OS (Left Eye)</div>
          <div style="display:flex;gap:16px;flex-wrap:wrap">
            <span><span style="font-size:.58rem;color:rgba(255,255,255,.38)">SPH</span> <strong style="font-family:monospace;font-size:.88rem;color:#fff">${latest.os?.sph || '—'}</strong></span>
            <span><span style="font-size:.58rem;color:rgba(255,255,255,.38)">CYL</span> <strong style="font-family:monospace;font-size:.88rem;color:#fff">${latest.os?.cyl || '—'}</strong></span>
            <span><span style="font-size:.58rem;color:rgba(255,255,255,.38)">AXIS</span> <strong style="font-family:monospace;font-size:.88rem;color:#fff">${latest.os?.axis || '—'}</strong></span>
          </div>
        </div>
      </div>
    </div>` : ''}

    <!-- All examinations list -->
    <div class="card" id="exam-hist-card">
      <div class="card-header">
        <div class="card-title">${sorted.length} Examination${sorted.length !== 1 ? 's' : ''} on Record</div>
        <div class="search-input-wrap">
          ${ic('search','icon-sm')}
          <input class="search-input" placeholder="Search diagnosis or doctor…" oninput="window._filterExamHistory(this.value)">
        </div>
      </div>
      ${sorted.map((e, i) => `
      <div class="exam-hist-row hist-row${i===0 ? ' hist-row-featured' : ''}" data-search="${(e.diagnosis||'').toLowerCase()} ${e.doctor.toLowerCase()}">
        <!-- Date block -->
        <div style="text-align:center;min-width:38px;flex-shrink:0">
          <div style="font-size:1.05rem;font-weight:800;color:#1C1C1C;line-height:1">${new Date(e.date + 'T00:00:00').getDate()}</div>
          <div style="font-size:.58rem;text-transform:uppercase;font-weight:600;color:#9CA3AF;margin-top:1px">${new Date(e.date + 'T00:00:00').toLocaleString('en',{month:'short'})}</div>
          <div style="font-size:.58rem;color:#C4C9D0">${new Date(e.date + 'T00:00:00').getFullYear()}</div>
        </div>
        <div style="width:1px;height:36px;background:#F3F4F6;flex-shrink:0"></div>
        <!-- Info -->
        <div class="hist-row-info">
          <div style="font-size:.87rem;font-weight:700;color:#1C1C1C;overflow:hidden;text-overflow:ellipsis;white-space:nowrap">${e.diagnosis}</div>
          <div style="font-size:.72rem;color:#6B7280;margin-top:2px">${e.doctor}</div>
        </div>
        <div class="hist-row-actions">
          ${i===0 ? `<span style="background:#FFF7ED;color:#E8760A;font-size:.63rem;font-weight:700;padding:2px 8px;border-radius:20px;border:1px solid #FDE68A;flex-shrink:0;white-space:nowrap">Latest</span>` : ''}
          ${badge(e.status || 'completed')}
          <button class="btn-icon" title="View Results" onclick="window.viewExamDetail('${user.id}','${e.id}')">
            ${ic('eye','icon-sm')}
          </button>
          <button class="btn-icon" title="View Prescription" onclick="window.viewPrescriptionModal('${user.id}','${e.id}')">
            ${ic('file-text','icon-sm')}
          </button>
        </div>
      </div>`).join('')}
    </div>

    ` : `
    <div class="card">
      <div style="text-align:center;padding:60px 24px">
        <div style="font-size:.95rem;font-weight:700;color:#1C1C1C;margin-bottom:6px">No Examinations Yet</div>
        <div style="font-size:.82rem;color:#6B7280;margin-bottom:20px">Your examination records will appear here after your first optical consultation.</div>
        <button class="btn-primary" onclick="window.navigate('patient-request-appt')">${ic('plus','icon-sm')} Book an Appointment</button>
      </div>
    </div>`}
  </div>`
}

// ════════════════════════════════════════════════════════════════
//  PATIENT — DASHBOARD
// ════════════════════════════════════════════════════════════════
function pagePatientDashboard() {
  const { user } = st()
  const today    = localDateStr()
  const myAppts  = appointments.filter(a => a.patientId === user.id)
  const upcoming = myAppts.filter(a => ['pending','approved'].includes(a.status) && a.date >= today)
    .sort((a,b) => a.date.localeCompare(b.date) || a.time.localeCompare(b.time))
  const nextAppt = upcoming[0] || null
  const show3    = upcoming.slice(0, 3)

  window.state.afterRender = () => window.initSortable('dash-upcoming-tbody', { key: 'date', type: 'date', dir: 1 })

  return `
  <div class="page-header">
    <div class="page-header-left">
      <h1 class="page-title">My Dashboard</h1>
      <p class="page-subtitle">Manage your appointments and view your records</p>
    </div>
  </div>
  <div class="page-body">

    <div class="welcome-banner" style="margin-bottom:20px">
      <div class="welcome-banner-text">
        <h2>Hello, ${user.firstName}!</h2>
        <p>Your patient ID is <strong style="color:#E8760A">${user.id}</strong> &bull; QR Code ready below</p>
        <div class="hero-btn-row">
          <button onclick="window.navigate('patient-request-appt')"
            style="display:flex;align-items:center;justify-content:center;gap:6px;background:#E8760A;border:none;color:#fff;padding:8px 14px;border-radius:8px;font-size:.8rem;font-weight:600;cursor:pointer;font-family:inherit;transition:opacity .2s,transform .15s"
            onmouseover="this.style.opacity='.9';this.style.transform='translateY(-1px)'"
            onmouseout="this.style.opacity='1';this.style.transform='translateY(0)'"
            onmousedown="this.style.transform='scale(0.98)'"
            onmouseup="this.style.transform='translateY(-1px)'">
            ${ic('plus','icon-sm')} Book Appointment
          </button>
          <button onclick="window.navigate('doctor-availability')"
            style="display:flex;align-items:center;justify-content:center;gap:6px;background:rgba(255,255,255,.1);border:1px solid rgba(255,255,255,.18);color:rgba(255,255,255,.85);padding:8px 14px;border-radius:8px;font-size:.8rem;font-weight:500;cursor:pointer;font-family:inherit;transition:background .18s ease,border-color .18s ease,transform .18s ease,color .18s ease"
            onmouseover="this.style.background='rgba(255,255,255,.2)';this.style.borderColor='rgba(255,255,255,.4)';this.style.color='#fff';this.style.transform='translateY(-2px)'"
            onmouseout="this.style.background='rgba(255,255,255,.1)';this.style.borderColor='rgba(255,255,255,.18)';this.style.color='rgba(255,255,255,.85)';this.style.transform='translateY(0)'"
            onmousedown="this.style.transform='translateY(0)'"
            onmouseup="this.style.transform='translateY(-2px)'">
            ${ic('calendar','icon-sm')} Doctor Availability
          </button>
          <button onclick="window.navigate('patient-prescriptions')"
            style="display:flex;align-items:center;justify-content:center;gap:6px;background:rgba(255,255,255,.1);border:1px solid rgba(255,255,255,.18);color:rgba(255,255,255,.85);padding:8px 14px;border-radius:8px;font-size:.8rem;font-weight:500;cursor:pointer;font-family:inherit;transition:background .18s ease,border-color .18s ease,transform .18s ease,color .18s ease"
            onmouseover="this.style.background='rgba(255,255,255,.2)';this.style.borderColor='rgba(255,255,255,.4)';this.style.color='#fff';this.style.transform='translateY(-2px)'"
            onmouseout="this.style.background='rgba(255,255,255,.1)';this.style.borderColor='rgba(255,255,255,.18)';this.style.color='rgba(255,255,255,.85)';this.style.transform='translateY(0)'"
            onmousedown="this.style.transform='translateY(0)'"
            onmouseup="this.style.transform='translateY(-2px)'">
            ${ic('file-text','icon-sm')} Prescriptions
          </button>
          <button onclick="window.navigate('patient-exam-history')"
            style="display:flex;align-items:center;justify-content:center;gap:6px;background:rgba(255,255,255,.1);border:1px solid rgba(255,255,255,.18);color:rgba(255,255,255,.85);padding:8px 14px;border-radius:8px;font-size:.8rem;font-weight:500;cursor:pointer;font-family:inherit;transition:background .18s ease,border-color .18s ease,transform .18s ease,color .18s ease"
            onmouseover="this.style.background='rgba(255,255,255,.2)';this.style.borderColor='rgba(255,255,255,.4)';this.style.color='#fff';this.style.transform='translateY(-2px)'"
            onmouseout="this.style.background='rgba(255,255,255,.1)';this.style.borderColor='rgba(255,255,255,.18)';this.style.color='rgba(255,255,255,.85)';this.style.transform='translateY(0)'"
            onmousedown="this.style.transform='translateY(0)'"
            onmouseup="this.style.transform='translateY(-2px)'">
            ${ic('eye','icon-sm')} Examination History
          </button>
        </div>
      </div>
    </div>

    ${nextAppt ? `
    <div style="border-left:4px solid #E8760A;background:#FFF8F0;border-radius:10px;padding:14px 18px;margin-bottom:20px;display:flex;align-items:center;gap:14px;flex-wrap:wrap">
      <div style="flex:1;min-width:0">
        <div style="font-size:.7rem;font-weight:700;text-transform:uppercase;letter-spacing:.07em;color:#E8760A;margin-bottom:2px">Next Appointment</div>
        <div style="font-size:.95rem;font-weight:700;color:#1C1C1C">${nextAppt.doctorName || 'Doctor to be assigned'}</div>
        <div style="font-size:.8rem;color:#6B7280;margin-top:2px">${fmtDate(nextAppt.date)} &bull; ${nextAppt.time} &bull; ${nextAppt.type}</div>
      </div>
      <div>${badge(nextAppt.status)}</div>
      <button class="btn-secondary" style="font-size:.8rem;padding:6px 14px"
              onclick="window.navigate('patient-appts',{filter:'${nextAppt.status}'})">${ic('calendar','icon-sm')} View All</button>
    </div>` : ''}


    <div class="grid-sidebar" style="align-items:start">
      <div class="card">
        <div class="card-header">
          <div class="card-title">Upcoming Appointments</div>
          <button class="btn-ghost" onclick="window.navigate('patient-appts')"
                  style="font-size:.75rem;padding:4px 10px">View All</button>
        </div>
        ${show3.length ? `
        <div style="overflow-x:auto">
        <table class="tbl" style="table-layout:fixed">
          <colgroup>
            <col style="width:26%"><col style="width:22%"><col style="width:18%"><col style="width:18%"><col style="width:16%">
          </colgroup>
          <thead><tr><th>Doctor</th><th data-sort-key="date" data-sort-type="date">Date</th><th>Time</th><th>Type</th><th>Status</th></tr></thead>
          <tbody id="dash-upcoming-tbody">
            ${show3.map(a => `<tr data-search="${(a.doctorName||'').toLowerCase()} ${(a.type||'').toLowerCase()}" data-sort-date="${a.date}">
              <td data-label="Doctor" style="font-size:.82rem;font-weight:500">${a.doctorName || '<span style="font-style:italic;color:#9CA3AF;font-weight:400">To be assigned</span>'}</td>
              <td data-label="Date" style="font-size:.82rem">${fmtDate(a.date)}</td>
              <td data-label="Time" style="font-size:.82rem;white-space:nowrap">${a.time}</td>
              <td data-label="Type" style="font-size:.78rem;color:#6B7280">${a.type}</td>
              <td data-label="Status">${badge(a.status)}</td>
            </tr>`).join('')}
          </tbody>
        </table>
        </div>` : `
        <div class="table-empty">No upcoming appointments.<br>
          <button class="btn-primary" style="margin-top:12px" onclick="window.navigate('patient-appts',{filter:'request'})">Book an Appointment</button>
        </div>`}
      </div>

      <div class="gap-y">
        <div class="qr-display-card">
          <div style="font-size:.75rem;font-weight:700;text-transform:uppercase;letter-spacing:.08em;color:#9CA3AF;margin-bottom:12px">My QR Code</div>
          <div style="border-radius:8px;overflow:hidden;display:inline-block;box-shadow:0 4px 16px rgba(0,0,0,.06);margin-bottom:12px">
            ${window.mockQRSvg(user.qrData, 130)}
          </div>
          <div style="font-size:.8rem;color:#6B7280;margin-bottom:10px">Show this QR at the clinic for quick check-in.</div>
          <div style="margin-bottom:6px">
            <div style="font-size:.6rem;text-transform:uppercase;letter-spacing:.08em;color:#9CA3AF;font-weight:700;margin-bottom:3px">Manual Entry Code</div>
            <div class="qr-patient-id">${user.qrData}</div>
            <div style="font-size:.68rem;color:#9CA3AF;margin-top:4px">Type this at the reception desk if your QR code can't be scanned.</div>
          </div>
          <div style="display:flex;gap:8px;margin-top:14px">
            <button class="btn-secondary" style="flex:1;justify-content:center" onclick="window.navigate('patient-qr')">
              ${ic('qr','icon-sm')} View Full QR
            </button>
          </div>
        </div>


      </div>
    </div>
  </div>`
}

// ════════════════════════════════════════════════════════════════
//  SHARED — APPOINTMENT BOOKING WIZARD
//  Used by the patient's "Request Appointment" page (mode:'patient') and
//  the admin/staff "New Appointment" page (mode:'staff'). The calendar,
//  doctor-cards, time-slot grid and type-selection steps are identical
//  either way; only the Review step (initial status vs. T&C + submit
//  target) and the waitlist card (patient-only server-side) differ.
// ════════════════════════════════════════════════════════════════
function appointmentWizardHtml(mode) {
  const isStaff = mode === 'staff'
  // `bookable` — offered as a selectable appointment type at all (a
  // display-only service like Slit Lamp Examination never shows here).
  // `patientVisible` — patients themselves can pick it; staff/admin see
  // every bookable service regardless (e.g. Follow-up Consultation, for
  // scheduling on a patient's behalf after reviewing their case — not
  // something a patient should self-select when requesting their own
  // first-time visit). See clinic_services' own column comments (schema.sql).
  const bookableServices = CLINIC_SERVICES.filter(s => s.status === 'active' && s.bookable && (isStaff || s.patientVisible))
  const _minAdv = minAdvanceDays()
  // Staff/admin retain discretion over booking-window timing (see
  // amcRender()'s own tooSoon check, main.js — same role-based exception
  // already applied on the backend in create.php) — the Minimum Advance
  // Booking policy only ever governs self-service patient bookings, so the
  // patient-facing "same-day isn't available" wording would be actively
  // wrong here: same-day IS available for staff, e.g. for a walk-in.
  // Wording distinguishes admin from staff specifically (rather than a
  // generic "As staff…" for both) since this wizard is shared by both
  // roles via the same mode:'staff' — state.role is the actual signer-in's
  // role, independent of which wizard mode they're using.
  const _roleLabel = state.role === 'admin' ? 'an admin' : 'a staff member'
  const advanceNoticeHtml = isStaff
    ? `As ${_roleLabel}, you have no date restrictions for walk-ins or urgent cases. Book any date, including today.`
    : _minAdv === 0
      ? `You can book for <strong>today</strong> or any future date.`
      : `Appointments must be booked <strong>at least ${_minAdv} day${_minAdv > 1 ? 's' : ''} in advance.</strong><br>
         ${_minAdv === 1 ? 'Same-day booking is not available.' : `Booking less than ${_minAdv} days ahead is not available.`} Please select a valid date from the calendar below.`

  // Clinic-wide days/hours — relevant here since no specific doctor is
  // chosen yet at this step (the calendar itself is gated by these same
  // Consultation Settings via consultationSettings.clinicDays).
  const _clinicDaysShort = (consultationSettings.clinicDays || []).map(d => d.slice(0,3)).join(', ')
  // The max-advance-booking clause only applies to the patient wizard —
  // staff/admin have no upper bound either (see amcRender()'s isFar check).
  const clinicHoursNotice = `The clinic is open <strong>${_clinicDaysShort}</strong>, ${consultationSettings.morningStart}–${consultationSettings.afternoonEnd}`
    + (consultationSettings.lunchBreak ? ` (lunch break ${consultationSettings.morningEnd}–${consultationSettings.afternoonStart})` : '')
    + (isStaff ? '.' : `. Maximum booking window is ${consultationSettings.maxAdvanceBooking}.`)

  return `
    <style>
      /* ── Wizard layout ── */
      .wiz-layout { display:grid; grid-template-columns:1.7fr 1fr; gap:24px; align-items:start; }
      .wiz-step { display:none; animation:none; }
      .wiz-step.active { display:block; }
      @keyframes wiz-in-right { from { opacity:0; transform:translateX(30px); } to { opacity:1; transform:translateX(0); } }
      @keyframes wiz-in-left  { from { opacity:0; transform:translateX(-30px); } to { opacity:1; transform:translateX(0); } }
      .wiz-anim-right { animation: wiz-in-right .3s ease forwards; }
      .wiz-anim-left  { animation: wiz-in-left  .3s ease forwards; }
      /* ── Progress stepper ── */
      .wiz-stepper { display:flex; align-items:center; margin-bottom:24px; }
      .wiz-step-item { display:flex; flex-direction:column; align-items:center; flex:1; position:relative; }
      .wiz-step-item:not(:last-child)::after { content:''; position:absolute; top:14px; left:50%; width:100%;
        height:2px; background:#e5e7eb; z-index:0; transition:background .3s; }
      .wiz-step-item.done:not(:last-child)::after { background:#E8760A; }
      .wiz-circle { width:28px; height:28px; border-radius:50%; border:2px solid #e5e7eb; background:#fff;
        display:flex; align-items:center; justify-content:center; font-size:.72rem; font-weight:700;
        color:#9CA3AF; z-index:1; position:relative; transition:all .25s; flex-shrink:0; }
      .wiz-step-item.done .wiz-circle { background:#E8760A; border-color:#E8760A; color:#fff; }
      .wiz-step-item.active .wiz-circle { border-color:#E8760A; color:#E8760A; }
      .wiz-step-label { font-size:.68rem; color:#9CA3AF; margin-top:5px; font-weight:500; }
      .wiz-step-item.done .wiz-step-label,
      .wiz-step-item.active .wiz-step-label { color:#E8760A; font-weight:600; }
      /* ── Step nav ── */
      .wiz-nav { display:flex; align-items:center; justify-content:space-between; margin-top:20px; }
      /* Matches .auth-back-link/.fp-back-link (login/forgot-password/registration's
         "go back" links) — same gray→orange hover color, arrow-slide, and
         focus ring, so every "go back" affordance in the app reads as the
         same component instead of a wizard-specific one-off. */
      .wiz-btn-back { background:none; border:none; font-family:'Poppins',sans-serif; font-size:.85rem;
        color:#9ca3af; cursor:pointer; padding:8px 0; display:flex; align-items:center; gap:5px;
        font-weight:600; transition:color .2s ease; }
      .wiz-btn-back svg { transition:transform .2s ease; }
      .wiz-btn-back:hover { color:#E8760A; }
      .wiz-btn-back:hover svg { transform:translateX(-2px); }
      .wiz-btn-back:focus-visible { outline:2px solid #E8760A; outline-offset:3px; border-radius:4px; }
      .wiz-btn-next { font-family:'Poppins',sans-serif; font-size:.88rem; font-weight:600; cursor:pointer;
        padding:11px 28px; border-radius:8px; border:none; background:#E8760A; color:#fff;
        display:flex; align-items:center; gap:7px; transition:opacity .2s; }
      .wiz-btn-next:disabled { opacity:.38; cursor:not-allowed; }
      .wiz-btn-next:not(:disabled):hover { opacity:.85; }
      /* ── Doctor cards ── */
      .doc-card { display:flex; align-items:center; gap:14px; padding:16px 20px; border-radius:10px;
        border:1.5px solid #e5e7eb; background:#fff; cursor:pointer; margin-bottom:12px;
        transition:border-color .15s,background .15s; width:100%; text-align:left;
        font-family:'Poppins',sans-serif; }
      .doc-card:hover { border-color:#E8760A; background:#FFFBF5; }
      .doc-card.selected { border-color:#E8760A; background:#FFF7ED; }
      /* Unavailable/fully-booked doctor cards — a plain opacity dial-down
         still let the base .doc-card:hover rule fire on mouseover (same
         orange border+tint as a real selectable card), so it kept reading
         as clickable no matter how faint it was. This overrides hover
         outright instead, plus mutes the card to a flat grey so "not an
         option today" is legible even before you touch it. */
      .doc-card.doc-card-disabled { background:#F9FAFB; border-color:#E5E7EB; cursor:not-allowed; }
      .doc-card.doc-card-disabled:hover { border-color:#E5E7EB; background:#F9FAFB; }
      .doc-card.doc-card-disabled .doc-card-avatar { filter:grayscale(1); opacity:.6; }
      .doc-card-avatar { width:40px; height:40px; border-radius:50%; background:#E8760A;
        display:flex; align-items:center; justify-content:center; font-size:.78rem;
        font-weight:700; color:#fff; flex-shrink:0; }
      /* ── Preference-gate cards (deliberately its own class, not .doc-card) ──
         wizSelectDoctor() runs document.querySelectorAll('.doc-card') to strip
         the old checkmark icon off every doctor card whenever a new one is
         picked — sharing that class here meant its cleanup swept up these
         icon spans too (they matched the same span[style*="E8760A"] selector)
         and deleted them from the DOM for good after the first doctor pick. */
      .pref-card { display:flex; flex-direction:column; align-items:center; justify-content:center;
        text-align:center; gap:8px; width:230px; padding:22px 18px; border-radius:10px;
        border:1.5px solid #e5e7eb; background:#fff; cursor:pointer;
        transition:border-color .15s,background .15s; font-family:'Poppins',sans-serif; }
      .pref-card:hover { border-color:#E8760A; background:#FFFBF5; }
      /* ── Type cards ── */
      .appt-type-card { text-align:left; padding:16px; border-radius:10px; border:1.5px solid #e5e7eb;
        background:#fff; cursor:pointer; font-family:'Poppins',sans-serif;
        transition:border-color .15s,background .15s; width:100%; }
      .appt-type-card:hover { border-color:#E8760A; background:#FFFBF5; }
      .appt-type-card.selected { border-color:#E8760A; background:#FFF7ED; }
      /* ── Time slots ── */
      /* These are real <button> elements — iOS Safari applies its own
         default (system blue) text color to an unstyled native button
         unless both appearance is reset AND color is stated explicitly.
         Desktop Chrome/Firefox happened to render the intended dark text
         anyway (inherited from body), which is exactly what let this ship
         without anyone noticing until an actual iPad showed the real
         default. */
      .time-slot { padding:9px 14px; border-radius:8px; border:1.5px solid #e5e7eb; background:#fff;
        -webkit-appearance:none; appearance:none; color:#1C1C1C;
        font-family:'Poppins',sans-serif; font-size:.82rem; cursor:pointer; transition:all .15s; white-space:nowrap; }
      .time-slot:hover:not(.taken):not(.mine) { border-color:#E8760A; }
      .time-slot.selected { background:#E8760A; color:#fff; border-color:#E8760A; }
      .time-slot.taken { background:#F3F4F6; color:#9CA3AF; cursor:not-allowed; text-decoration:line-through; }
      .time-slot.full { background:#FFF7ED; color:#C2410C; border-color:#FDBA74; }
      .time-slot.full:hover { background:#FFEDD5; border-color:#E8760A; }
      /* A full/waitlist slot that's also the current pick — .selected and
         .full alone tie in specificity (2 classes each), so whichever rule
         is declared later in the file silently wins; this 3-class rule
         out-specifies both so the orange "selected" look always wins. */
      .time-slot.selected.full { background:#E8760A; color:#fff; border-color:#E8760A; }
      /* A slot that's full specifically because the patient viewing this
         already has their own appointment there (see wizBuildTimeSlots(),
         main.js) — same grayed-out/crossed-out treatment as .taken (its
         own class rather than reusing .taken directly, since the tooltip
         text still needs to say something different: "you already have
         an appointment" rather than "this time has passed"). */
      .time-slot.mine { background:#F3F4F6; color:#9CA3AF; cursor:not-allowed; text-decoration:line-through; }
      .time-slot-legend { display:flex; flex-wrap:wrap; gap:12px; margin-top:10px; font-family:'Poppins',sans-serif; font-size:.72rem; color:#6B7280; }
      .time-slot-legend-item { display:flex; align-items:center; gap:6px; }
      .time-slot-legend-swatch { width:10px; height:10px; border-radius:3px; display:inline-block; flex-shrink:0; }
      /* ── Mini calendar ── */
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
      /* Solid, legible muted colors instead of opacity — opacity fades the
         day NUMBER along with the background, and stacked with the already-
         muted unavailable/holiday colors it made whole months (e.g. every
         date past the Maximum Advance Booking window) nearly unreadable. */
      .amc-day.amc-past { color:#C1C7D0; cursor:not-allowed; }
      .amc-day.amc-far { color:#C1C7D0; cursor:not-allowed; background:#f9fafb; }
      .amc-day.amc-empty { cursor:default; }
      .amc-day.amc-holiday { background:#FFF1F2; color:#f43f5e; cursor:not-allowed; font-weight:600; }
      .amc-holiday-lbl { position:absolute; left:2px; right:2px; top:calc(50% + 8px); font-size:.7rem; line-height:1.15; text-align:center; overflow:hidden; display:-webkit-box; -webkit-line-clamp:2; -webkit-box-orient:vertical; font-weight:600; padding:0 1px; }
      .amc-day.amc-blocked { background:#FEE2E2; color:#B91C1C; cursor:not-allowed; font-weight:700; text-decoration:line-through; text-decoration-color:rgba(185,28,28,0.5); }
      .amc-nodoc-lbl { position:absolute; left:2px; right:2px; top:calc(50% + 8px); font-size:.7rem; line-height:1.15; text-align:center; overflow:hidden; white-space:nowrap; font-weight:600; color:#6B7280; }
      @media (max-width:480px) {
        .amc-day.amc-holiday { font-size:.7rem; }
        .amc-holiday-lbl { font-size:.44rem; top:calc(50% + 4px); line-height:1.05; }
        .amc-nodoc-lbl { font-size:.44rem; top:calc(50% + 4px); line-height:1.05; }
      }
      /* ── Summary sidebar (desktop) ── */
      .wiz-summary-rail { position:sticky; top:24px; }
      .sum-row { display:flex; align-items:flex-start; gap:10px; margin-bottom:14px; }
      /* min-width:0 overrides flexbox's default min-width:auto on this text
         column — without it, a value with no natural break points (e.g. a
         long unbroken notes string) refuses to shrink and overflows the
         card instead of wrapping. */
      .sum-row > div:last-child { flex:1; min-width:0; }
      .sum-icon { width:28px; height:28px; border-radius:7px; background:#FFF0DC; display:flex; align-items:center;
        justify-content:center; flex-shrink:0; color:#E8760A; margin-top:1px; }
      .sum-label { font-size:.68rem; text-transform:uppercase; letter-spacing:.05em; color:#9CA3AF; margin-bottom:2px; }
      .sum-val { font-size:.85rem; font-weight:600; color:#1C1C1C; transition:color .15s;
        overflow-wrap:anywhere; word-break:break-word; }
      .sum-val.empty { color:#9CA3AF; font-weight:400; }
      /* ── Mobile: stack the wizard and booking summary top-to-bottom ── */
      @media (max-width:767px) {
        .wiz-layout { grid-template-columns:1fr; }
        .wiz-summary-rail { position:static; }
      }
      /* ── Review step ── */
      .rev-row { display:flex; align-items:flex-start; gap:14px; padding:14px 0; border-bottom:1px solid #f3f4f6; }
      .rev-row:last-child { border-bottom:none; }
      /* min-width:0 overrides flexbox's default min-width:auto on this
         text column (the div carrying the inline flex:1) — without it, a
         value with no natural break points (e.g. a long unbroken notes
         string) refuses to shrink and overflows the card instead of wrapping. */
      .rev-row > div[style*="flex:1"] { min-width:0; }
      .rev-icon { width:32px; height:32px; border-radius:8px; background:#FFF0DC; display:flex; align-items:center;
        justify-content:center; color:#E8760A; flex-shrink:0; }
      .rev-label { font-size:.68rem; text-transform:uppercase; letter-spacing:.06em; color:#9CA3AF; margin-bottom:3px; }
      .rev-val { font-size:.9rem; font-weight:600; color:#1C1C1C; overflow-wrap:anywhere; word-break:break-word; }
      .rev-edit { font-size:.72rem; color:#E8760A; background:none; border:none; cursor:pointer;
        font-family:'Poppins',sans-serif; margin-left:auto; padding:0; flex-shrink:0; align-self:center; }
      .rev-edit:hover { text-decoration:underline; }
    </style>

    ${isStaff ? '' : '<div id="my-waitlist-card"></div>'}

    ${isStaff ? '' : `
    <!-- Preference gate — patient-only, shown before the wizard proper.
         Choosing "Any available optometrist" sets _wiz.anyDoctor and skips
         the Doctor step entirely (main.js wizGo()/wizJump()); the clinic
         assigns an actual doctor after reviewing the request. -->
    <div id="wiz-pref" class="card" style="border-radius:12px;border:1px solid #e5e7eb;margin-bottom:8px">
      <div class="card-body" style="text-align:center;padding:40px 24px">
        <div style="font-size:1.15rem;font-weight:700;color:#1C1C1C;margin-bottom:6px">Do you have a preferred optometrist?</div>
        <div style="font-size:.85rem;color:#6B7280;margin-bottom:24px;max-width:440px;margin-left:auto;margin-right:auto">
          You can pick a specific optometrist yourself, or let the clinic assign one who's free at the time you choose.
        </div>
        <div style="display:flex;gap:14px;justify-content:center;flex-wrap:wrap">
          <button class="pref-card" onclick="window.wizChooseDoctorPref(false)">
            <span style="color:#E8760A">${ic('user','icon-lg')}</span>
            <span style="font-size:.88rem;font-weight:700;color:#1C1C1C">I have a preferred optometrist</span>
            <span style="font-size:.74rem;color:#9CA3AF">Choose exactly who you'd like to see.</span>
          </button>
          <button class="pref-card" onclick="window.wizChooseDoctorPref(true)">
            <span style="color:#E8760A">${ic('users','icon-lg')}</span>
            <span style="font-size:.88rem;font-weight:700;color:#1C1C1C">Any available optometrist</span>
            <span style="font-size:.74rem;color:#9CA3AF">The clinic will assign an optometrist for you.</span>
          </button>
        </div>
      </div>
    </div>`}

    <div class="wiz-layout" id="wiz-main" style="${isStaff ? '' : 'display:none'}">

      <!-- ── LEFT: WIZARD ── -->
      <div>

        <!-- Progress Stepper -->
        <div class="wiz-stepper" id="wiz-stepper">
          ${['Date','Doctor','Time','Type','Review'].map((lbl,i) => `
          <div class="wiz-step-item${i===0?' active':''}" id="wiz-si-${i}">
            <div class="wiz-circle" id="wiz-c-${i}">${i+1}</div>
            <div class="wiz-step-label">${lbl}</div>
          </div>`).join('')}
        </div>

        <!-- Step 1: Date -->
        <div class="wiz-step active card" id="wiz-step-0">
          <div class="card-body">
            <div style="margin-bottom:16px">
              <div style="font-size:1.1rem;font-weight:700;color:#1C1C1C;margin-bottom:4px">${isStaff ? 'When should the visit be scheduled?' : 'When would you like to visit?'}</div>
              <div style="font-size:.85rem;color:#6B7280">${isStaff ? `Select the consultation date for <strong id="wiz-patient-lbl0"></strong>.` : 'Select your preferred consultation date.'}</div>
            </div>
            <!-- Doctor pre-fill banner — shown only when coming from Doctor Availability.
                 Blue/info styling (matching the advance-notice banner below, not the
                 orange "Before you book" policy warning further down) — this is just
                 context about where you came from, not a warning, and it used to share
                 both the orange color AND an almost-identical exclamation-style icon
                 with that real warning, making the two indistinguishable. -->
            <div id="amc-prefill-banner" style="display:none;background:#eff6ff;border-left:3px solid #3b82f6;border-radius:8px;padding:12px 16px;margin-bottom:16px;align-items:flex-start;gap:10px">
              <svg viewBox="0 0 24 24" fill="none" stroke="#3b82f6" stroke-width="2" stroke-linecap="round" width="16" height="16" style="flex-shrink:0;margin-top:2px"><circle cx="12" cy="12" r="10"/><line x1="12" y1="16" x2="12" y2="12"/><line x1="12" y1="8" x2="12.01" y2="8"/></svg>
              <div style="font-size:.82rem;color:#1e40af;line-height:1.5">
                Booking with <strong id="amc-prefill-doc-name"></strong>. Only their available days are shown. Select your preferred date below.
              </div>
            </div>
            <!-- Shown only when a recommended follow-up date (from a
                 "Follow-up Consultation Needed" notification) turned out to
                 fall on a PH holiday or a day the clinic isn't open —
                 nothing about the doctor's original recommendation checks
                 that. See wizInitStaff() (main.js), which keeps the date
                 unselected on the calendar below rather than falsely
                 marking an unbookable day "Selected". -->
            <div id="wiz-date-unavail-notice" style="display:none;background:#FEF2F2;border-left:3px solid #DC2626;border-radius:8px;padding:12px 16px;margin-bottom:16px;align-items:flex-start;gap:10px">
              <svg viewBox="0 0 24 24" fill="none" stroke="#DC2626" stroke-width="2" stroke-linecap="round" width="16" height="16" style="flex-shrink:0;margin-top:2px"><circle cx="12" cy="12" r="10"/><line x1="15" y1="9" x2="9" y2="15"/><line x1="9" y1="9" x2="15" y2="15"/></svg>
              <div style="font-size:.82rem;color:#991B1B;line-height:1.5">The doctor's recommended follow-up date, <strong id="wiz-date-unavail-date"></strong>, isn't available. <span id="wiz-date-unavail-reason"></span>. Please choose a different date below.</div>
            </div>
            <div style="background:#eff6ff;border-left:3px solid #3b82f6;border-radius:8px;padding:12px 16px;margin-bottom:16px;display:flex;align-items:flex-start;gap:10px">
              <span style="flex-shrink:0;display:flex;margin-top:2px"><svg viewBox="0 0 24 24" fill="none" stroke="#3b82f6" stroke-width="2" stroke-linecap="round" width="16" height="16"><circle cx="12" cy="12" r="10"/><line x1="12" y1="16" x2="12" y2="12"/><line x1="12" y1="8" x2="12.01" y2="8"/></svg></span>
              <div style="font-size:.82rem;color:#1e40af;line-height:1.5">
                ${advanceNoticeHtml}<br>
                ${clinicHoursNotice}
              </div>
            </div>
            <div style="display:flex;align-items:center;justify-content:space-between;margin-bottom:10px">
              <button class="btn-icon" id="amc-prev" onclick="window.amcGoMonth(-1)">${ic('chevron-left','icon-sm')}</button>
              <span id="amc-month-label" style="font-size:.88rem;font-weight:700;color:#1C1C1C"></span>
              <button class="btn-icon" id="amc-next" onclick="window.amcGoMonth(1)">${ic('chevron-right','icon-sm')}</button>
            </div>
            <div class="appt-mini-cal">
              ${['SUN','MON','TUE','WED','THU','FRI','SAT'].map(d=>`<div class="amc-hdr">${d}</div>`).join('')}
            </div>
            <div class="appt-mini-cal" id="amc-cells"></div>
            <div style="display:flex;gap:12px;margin-top:12px;flex-wrap:wrap">
              <span style="display:flex;align-items:center;gap:5px;font-size:.7rem;color:#6B7280"><span style="width:10px;height:10px;border-radius:3px;background:#ECFDF5;border:1px solid #6EE7B7;display:inline-block"></span>Available</span>
              <span style="display:flex;align-items:center;gap:5px;font-size:.7rem;color:#6B7280"><span style="width:10px;height:10px;border-radius:3px;background:#fff;border:2px solid #E8760A;box-sizing:border-box;display:inline-block"></span>Today</span>
              <span style="display:flex;align-items:center;gap:5px;font-size:.7rem;color:#6B7280"><span style="width:10px;height:10px;border-radius:3px;background:#E8760A;display:inline-block"></span>Selected</span>
              <span style="display:flex;align-items:center;gap:5px;font-size:.7rem;color:#6B7280"><span style="width:10px;height:10px;border-radius:3px;background:#F3F4F6;display:inline-block"></span>Unavailable</span>
              <span style="display:flex;align-items:center;gap:5px;font-size:.7rem;color:#6B7280"><span style="width:10px;height:10px;border-radius:3px;background:#FFF1F2;border:1px solid #fda4af;display:inline-block"></span>PH Holiday</span>
            </div>
            <div class="wiz-nav">
              ${isStaff ? '<span></span>' : `
              <button class="wiz-btn-back" id="wiz-back-pref-0" onclick="window.wizBackToPref()">${ic('chevron-left','icon-sm')} Back</button>`}
              <button class="wiz-btn-next" id="wiz-next-0" disabled onclick="window.wizGo(1)">
                Continue ${ic('chevron-right','icon-sm')}
              </button>
            </div>
          </div>
        </div>

        <!-- Step 2: Doctor -->
        <div class="wiz-step card" id="wiz-step-1">
          <div class="card-body">
            <div style="margin-bottom:16px">
              <div style="font-size:1.1rem;font-weight:700;color:#1C1C1C;margin-bottom:4px">${isStaff ? 'Choose the doctor' : 'Choose your doctor'}</div>
              <div style="font-size:.85rem;color:#6B7280">Showing doctors available on <strong id="wiz-date-lbl2" style="color:#1C1C1C"></strong></div>
            </div>
            <!-- Shown only when a recommended follow-up doctor+date (from a
                 "Follow-up Consultation Needed" notification) turned out not to
                 actually be available on that date — see wizInitStaff() (main.js),
                 which checks this before ever jumping to Step 3, and lands here
                 with the date kept but no doctor pre-selected instead. -->
            <div id="wiz-doctor-unavail-notice" style="display:none;background:#FEF2F2;border-left:3px solid #DC2626;border-radius:8px;padding:12px 16px;margin-bottom:16px;align-items:flex-start;gap:10px">
              <svg viewBox="0 0 24 24" fill="none" stroke="#DC2626" stroke-width="2" stroke-linecap="round" width="16" height="16" style="flex-shrink:0;margin-top:2px"><circle cx="12" cy="12" r="10"/><line x1="15" y1="9" x2="9" y2="15"/><line x1="9" y1="9" x2="15" y2="15"/></svg>
              <div style="font-size:.82rem;color:#991B1B;line-height:1.5"><strong id="wiz-doctor-unavail-name"></strong> isn't available on this date. Please choose a doctor who is. The appointment can still be scheduled, just not with them on this specific day.</div>
            </div>
            <div id="wiz-doctor-cards"></div>
            <input type="hidden" id="appt-doctor" value="">
            <div class="wiz-nav">
              <button class="wiz-btn-back" onclick="window.wizGo(-1)">${ic('chevron-left','icon-sm')} Back</button>
              <button class="wiz-btn-next" id="wiz-next-1" disabled onclick="window.wizGo(1)">
                Continue ${ic('chevron-right','icon-sm')}
              </button>
            </div>
          </div>
        </div>

        <!-- Step 3: Time -->
        <div class="wiz-step card" id="wiz-step-2">
          <div class="card-body">
            <div style="margin-bottom:16px">
              <div style="display:flex;align-items:center;gap:8px;flex-wrap:wrap;margin-bottom:4px">
                <div style="font-size:1.1rem;font-weight:700;color:#1C1C1C">Pick a time</div>
                <!-- Only shown when this booking was pre-filled from a doctor's
                     "Follow-up Consultation Needed" notification — flags that the
                     doctor, not staff, chose this date, since the wizard otherwise
                     gives no indication of why it opened straight to Step 3. -->
                <span id="wiz-followup-pill" style="display:none;align-items:center;gap:4px;font-size:.7rem;font-weight:600;padding:3px 10px;border-radius:20px;white-space:nowrap;background:#eff6ff;color:#1e40af;border:1px solid #bfdbfe">Doctor-recommended follow-up date</span>
              </div>
              <div style="font-size:.85rem;color:#6B7280">Available slots for <strong id="wiz-doc-lbl3" style="color:#1C1C1C"></strong> on <strong id="wiz-date-lbl3" style="color:#1C1C1C"></strong></div>
            </div>
            <div id="appt-time-slots"></div>
            <div class="time-slot-legend">
              <div class="time-slot-legend-item"><span class="time-slot-legend-swatch" style="background:#fff;border:1.5px solid #e5e7eb"></span>Available</div>
              <div class="time-slot-legend-item" id="tsl-full-item"><span class="time-slot-legend-swatch" id="tsl-full-swatch" style="background:#FFF7ED;border:1.5px solid #FDBA74"></span><span id="tsl-full-txt">Fully booked (waitlist available)</span></div>
              <div class="time-slot-legend-item"><span class="time-slot-legend-swatch" style="background:#E8760A"></span>Selected</div>
              ${!isStaff ? `<div class="time-slot-legend-item"><span class="time-slot-legend-swatch" style="background:#F3F4F6;border:1.5px solid #e5e7eb"></span>Booked by you</div>` : ''}
              ${_minAdv === 0 ? `<div class="time-slot-legend-item"><span class="time-slot-legend-swatch" style="background:#F3F4F6;border:1.5px solid #e5e7eb"></span>Past</div>` : ''}
            </div>
            <input type="hidden" id="appt-time" value="">
            <div class="wiz-nav">
              <button class="wiz-btn-back" onclick="window.wizGo(-1)">${ic('chevron-left','icon-sm')} Back</button>
              <button class="wiz-btn-next" id="wiz-next-2" disabled onclick="window.wizGo(1)">
                Continue ${ic('chevron-right','icon-sm')}
              </button>
            </div>
          </div>
        </div>

        <!-- Step 4: Type + Notes -->
        <div class="wiz-step card" id="wiz-step-3">
          <div class="card-body">
            <div style="margin-bottom:16px">
              <div style="font-size:1.1rem;font-weight:700;color:#1C1C1C;margin-bottom:4px">${isStaff ? 'What type of consultation?' : 'What do you need?'}</div>
              <div style="font-size:.85rem;color:#6B7280">Select the type of consultation.</div>
            </div>
            <div style="display:grid;grid-template-columns:1fr 1fr;gap:10px;margin-bottom:16px">
              ${bookableServices.map((s, i) => `
              <button class="appt-type-card"
                      onclick="window.selectApptType('${s.name.replace(/'/g,"\\'")}',this)">
                <div style="display:flex;align-items:center;gap:7px;margin-bottom:5px">
                  <span style="color:#E8760A">${ic(s.icon || 'eye','icon-sm')}</span>
                  <span style="font-size:.83rem;font-weight:600;color:#1C1C1C">${s.name}</span>
                </div>
                <div style="font-size:.73rem;color:#9CA3AF;line-height:1.4">${s.description}</div>
              </button>`).join('')}
            </div>
            <input type="hidden" id="appt-type" value="">
            <div style="margin-bottom:4px">
              <label style="font-size:.78rem;font-weight:600;color:#374151">Notes / Reason for Visit <span style="font-weight:400;color:#9CA3AF">(optional)</span></label>
            </div>
            <textarea id="appt-notes" class="form-textarea" rows="3" oninput="window.syncSumNotes()"
                      placeholder="${isStaff ? "Describe the patient's symptoms or reason for the visit…" : 'Describe your symptoms or reason for the visit…'}"></textarea>
            <div class="wiz-nav">
              <button class="wiz-btn-back" onclick="window.wizGo(-1)">${ic('chevron-left','icon-sm')} Back</button>
              <button class="wiz-btn-next" id="wiz-next-3" disabled onclick="window.wizGo(1)">
                Review Booking ${ic('chevron-right','icon-sm')}
              </button>
            </div>
          </div>
        </div>

        <!-- Step 5: Review -->
        <div class="wiz-step card" id="wiz-step-4">
          <div class="card-body">
            <div style="margin-bottom:16px">
              <div style="font-size:1.1rem;font-weight:700;color:#1C1C1C;margin-bottom:4px">Review your appointment</div>
              <div style="font-size:.85rem;color:#6B7280">Please confirm the details below.</div>
            </div>
            <div style="border:1px solid #f3f4f6;border-radius:10px;padding:4px 16px;margin-bottom:16px">
              ${isStaff ? `
              <div class="rev-row">
                <div class="rev-icon">${ic('user','icon-sm')}</div>
                <div style="flex:1"><div class="rev-label">Patient</div><div class="rev-val" id="rev-patient">—</div></div>
              </div>` : ''}
              <div class="rev-row">
                <div class="rev-icon">${ic('calendar','icon-sm')}</div>
                <div style="flex:1"><div class="rev-label">Date</div><div class="rev-val" id="rev-date">—</div></div>
                <button class="rev-edit" onclick="window.wizJump(0)">Edit</button>
              </div>
              <div class="rev-row">
                <div class="rev-icon">${ic('user','icon-sm')}</div>
                <div style="flex:1"><div class="rev-label">Doctor</div><div class="rev-val" id="rev-doctor">—</div></div>
                <button class="rev-edit" id="rev-doctor-edit" onclick="window.wizJump(1)">Edit</button>
              </div>
              <div class="rev-row">
                <div class="rev-icon">${ic('clock','icon-sm')}</div>
                <div style="flex:1"><div class="rev-label">Time</div><div class="rev-val" id="rev-time">—</div></div>
                <button class="rev-edit" onclick="window.wizJump(2)">Edit</button>
              </div>
              <div class="rev-row">
                <div class="rev-icon">${ic('file-text','icon-sm')}</div>
                <div style="flex:1"><div class="rev-label">Type</div><div class="rev-val" id="rev-type">—</div></div>
                <button class="rev-edit" onclick="window.wizJump(3)">Edit</button>
              </div>
              <div class="rev-row">
                <div class="rev-icon">${ic('activity','icon-sm')}</div>
                <div style="flex:1"><div class="rev-label">Notes</div><div class="rev-val" id="rev-notes" style="font-weight:400;font-style:italic;color:#6B7280">No notes provided</div></div>
              </div>
            </div>
            ${isStaff ? `
            <input type="hidden" id="ca-initial-status" value="approved">
            <div style="font-size:.75rem;color:#9CA3AF;line-height:1.5;margin-bottom:16px;display:flex;align-items:flex-start;gap:6px">
              ${ic('info','icon-sm')} This appointment will be created on behalf of the patient shown above and automatically approved, since the clinic is booking it directly. The patient will be notified.
            </div>
            ` : `
            <div style="font-size:.75rem;color:#9CA3AF;line-height:1.5;margin-bottom:16px;display:flex;align-items:flex-start;gap:6px">
              ${ic('info','icon-sm')} Your appointment request will be reviewed by clinic staff to confirm doctor availability and scheduling. You will be notified once confirmed.
            </div>
            <!-- Hint placed above the checkbox/link it refers to, not
                 nested after it — users scan top to bottom, so they should
                 see this before reaching the link, not after. -->
            <div class="reg-terms-hint" id="appt-terms-hint">
              <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2" width="14" height="14" style="flex-shrink:0"><rect x="3" y="11" width="18" height="11" rx="2"/><path d="M7 11V7a5 5 0 0 1 10 0v4"/></svg>
              Click the Appointment Policy link below and read to the bottom to unlock this checkbox.
            </div>
            <div class="reg-terms">
              <input type="checkbox" id="appt-terms-agree" class="chk" disabled
                     title="Read the Appointment Policy to unlock this checkbox"
                     onchange="window.syncApptSubmitState()">
              <span>
                I have read and agree to the <a href="#" onclick="event.preventDefault();window.openAppointmentPolicyModal()">Appointment Policy</a>, including the cancellation and no-show terms.
              </span>
            </div>
            `}
            <div class="wiz-nav">
              <button class="wiz-btn-back" onclick="window.wizGo(-1)">${ic('chevron-left','icon-sm')} Back</button>
              <button class="wiz-btn-next" id="appt-submit-btn" onclick="window.${isStaff ? 'submitStaffAppointment' : 'requestAppointment'}()" style="padding:12px 32px" disabled>
                ${ic('check','icon-sm')} ${isStaff ? 'Create Appointment' : 'Submit Request'}
              </button>
            </div>
          </div>
        </div>

      </div>

      <!-- ── RIGHT: BOOKING SUMMARY (stacks below the wizard on mobile) ── -->
      <div class="wiz-summary-rail">
        <div class="card" style="border-radius:12px;border:1px solid #e5e7eb">
          <div class="card-body" style="padding:20px">
            <div style="font-size:.9rem;font-weight:700;color:#1C1C1C;margin-bottom:18px;display:flex;align-items:center;gap:7px">
              ${ic('calendar','icon-sm')} Booking Summary
            </div>
            ${isStaff ? `
            <div class="sum-row">
              <div class="sum-icon">${ic('user','icon-sm')}</div>
              <div><div class="sum-label">Patient</div><div class="sum-val" id="sum-patient">—</div></div>
            </div>` : ''}
            <div class="sum-row">
              <div class="sum-icon">${ic('calendar','icon-sm')}</div>
              <div><div class="sum-label">Date</div><div class="sum-val empty" id="sum-date">Not selected yet</div></div>
            </div>
            <div class="sum-row">
              <div class="sum-icon">${ic('user','icon-sm')}</div>
              <div><div class="sum-label">Doctor</div><div class="sum-val empty" id="sum-doctor">Not selected yet</div></div>
            </div>
            <div class="sum-row">
              <div class="sum-icon">${ic('clock','icon-sm')}</div>
              <div><div class="sum-label">Time</div><div class="sum-val empty" id="sum-time">Not selected yet</div></div>
            </div>
            <div class="sum-row">
              <div class="sum-icon">${ic('file-text','icon-sm')}</div>
              <div><div class="sum-label">Type</div><div class="sum-val empty" id="sum-type">Not selected yet</div></div>
            </div>
            <div class="sum-row" style="margin-bottom:0">
              <div class="sum-icon">${ic('activity','icon-sm')}</div>
              <div><div class="sum-label">Notes</div><div class="sum-val empty" id="sum-notes" style="font-weight:400;font-style:italic">No notes added</div></div>
            </div>
            <div style="border-top:1px solid #f3f4f6;margin:16px 0"></div>
            <div style="display:flex;align-items:center;gap:5px;font-size:.73rem;color:#9CA3AF;line-height:1.4" id="sum-hint">
              ${ic('info','icon-sm')} <span>Fill in all steps to submit your request.</span>
            </div>
          </div>
        </div>
      </div>

    </div>`
}

// ════════════════════════════════════════════════════════════════
//  ADMIN/STAFF — NEW APPOINTMENT (patient picker + shared wizard)
// ════════════════════════════════════════════════════════════════
function pageCreateAppointment() {
  const { params } = st()
  const patientId   = params.patientId   || ''
  const patientName = params.patientName || ''

  if (!patientId) {
    window.state.afterRender = () => { document.getElementById('cap-patient-search')?.focus() }
    return `
    <div class="page-header">
      <div class="page-header-left" style="display:flex;align-items:center;gap:12px">
        <button class="btn-icon" onclick="window.goBack('${st().role === 'admin' ? 'admin-dashboard' : 'staff-dashboard'}')" title="Back">
          ${ic('chevron-left','icon')}
        </button>
        <div>
          <h1 class="page-title">New Appointment</h1>
          <p class="page-subtitle">Select which patient this appointment is for</p>
        </div>
      </div>
    </div>
    <div class="page-body">
      <div class="card" style="max-width:640px;margin:0 auto">
        <div class="card-body">
          <div class="form-group">
            <label class="form-label">Patient ID, Name, or QR Code <span class="req">*</span></label>
            <div class="search-input-wrap">
              ${ic('search','icon-sm')}
              <input type="text" id="cap-patient-search" class="search-input" style="width:100%"
                     placeholder="e.g. P001, Juan Dela Cruz, or CANA-P001-..."
                     autocomplete="off" autocorrect="off" autocapitalize="off" spellcheck="false"
                     oninput="window._filterCapPatientList(this.value)">
            </div>
          </div>
          <div id="cap-patient-list" style="max-height:380px;overflow-y:auto;border:1px solid #E5E7EB;border-radius:8px;margin-top:8px">
            ${patients.length
              ? patients.map(p => window._renderPatientResult(p, window._capPatientOnclick(p))).join('')
              : `<div style="padding:24px;text-align:center;font-size:.85rem;color:#9CA3AF">No patients on file yet.</div>`}
          </div>
        </div>
      </div>
    </div>`
  }

  window.state.afterRender = () => window.wizInitStaff(patientId, patientName)
  return `
  <div class="page-header">
    <div class="page-header-left" style="display:flex;align-items:center;gap:12px">
      <button class="btn-icon" onclick="window.goBack('patient-view',{patientId:'${patientId}',patientName:'${patientName.replace(/'/g,"\\'")}'})" title="Back to ${patientName}'s profile">
        ${ic('chevron-left','icon')}
      </button>
      <div>
        <h1 class="page-title">New Appointment</h1>
        <p class="page-subtitle">Booking for <strong>${patientName}</strong></p>
      </div>
    </div>
    <button class="btn-secondary" style="align-self:center" onclick="window.navigate('create-appointment')">${ic('refresh-cw','icon-sm')} Change Patient</button>
  </div>
  <div class="page-body">
    ${appointmentWizardHtml('staff')}
  </div>`
}

// ════════════════════════════════════════════════════════════════
//  PATIENT — APPOINTMENTS
// ════════════════════════════════════════════════════════════════
function pagePatientAppts() {
  const { user, filter, page } = st()
  const tab     = (page === 'patient-request-appt') ? 'request' : (filter || 'all')
  const myAppts = appointments.filter(a => a.patientId === user.id)
  const _today = localDateStr()
  const statusFilter = (!tab || tab === 'all' || tab === 'request' || tab === 'today') ? null : tab

  let _pool = tab === 'today'
    ? myAppts.filter(a => a.date === _today)
    : statusFilter ? myAppts.filter(a => a.status === statusFilter) : myAppts
  const _asc = tab === 'pending' || tab === 'approved'
  const sortedAppts = tab === 'today'
    ? [..._pool].sort((a, b) => a.time.localeCompare(b.time))
    : _asc
      ? [..._pool].sort((a, b) => a.date.localeCompare(b.date) || a.time.localeCompare(b.time))
      : [..._pool].sort((a, b) => b.date.localeCompare(a.date) || b.time.localeCompare(a.time))

  if (tab === 'request' && !user.bookingRestricted) {
    window.state.afterRender = () => { window.amcInit(); window.loadMyWaitlistCard() }
  } else {
    window.state.afterRender = () => { window.initPagination('pt-appt-tbody'); window.initSortable('pt-appt-tbody', tab === 'today' ? { key: 'time', type: 'text', dir: 1, context: tab } : { key: 'date', type: 'date', dir: _asc ? 1 : -1, context: tab }) }
  }

  return `
  <div class="page-header">
    <div class="page-header-left" style="${tab === 'request' ? 'display:flex;align-items:center;gap:12px' : ''}">
      ${tab === 'request' ? `<button class="btn-icon" onclick="window.wizPageBack()" title="Back">${ic('chevron-left','icon')}</button>` : ''}
      <div>
        <h1 class="page-title">${tab === 'request' ? 'Request Appointment' : tab === 'today' ? "Today's Appointments" : (statusFilter ? statusFilter.charAt(0).toUpperCase()+statusFilter.slice(1)+' Appointments' : 'My Appointments')}</h1>
        <p class="page-subtitle">${tab === 'request' ? 'Book a new consultation with one of our doctors' : tab === 'today' ? 'Your appointments scheduled for today' : 'View your appointment history'}</p>
      </div>
    </div>
    ${tab !== 'request' ? `<button class="btn-primary" onclick="window.navigate('patient-request-appt')">${ic('plus','icon-sm')} New Appointment</button>` : ''}
  </div>
  <div class="page-body">

    ${tab === 'request' ? (user.bookingRestricted ? `
    <div class="card" style="max-width:560px;margin:0 auto">
      <div class="card-body" style="text-align:center;padding:40px 32px">
        <div style="width:56px;height:56px;border-radius:50%;background:#FEF2F2;border:2px solid #FCA5A5;
                    display:flex;align-items:center;justify-content:center;margin:0 auto 16px;color:#DC2626">
          ${ic('alert-circle','icon-lg')}
        </div>
        <div style="font-size:1.05rem;font-weight:700;color:#1C1C1C;margin-bottom:8px">Online Booking Unavailable</div>
        <div style="font-size:.85rem;color:#6B7280;line-height:1.6;margin-bottom:20px">
          Online booking is currently unavailable for your account due to repeated missed appointments.
          Please contact the clinic directly by phone or in person to schedule your next visit.
        </div>
        <button class="btn-secondary" onclick="window.navigate('patient-appts',{filter:'all'})">${ic('chevron-left','icon-sm')} Back to My Appointments</button>
      </div>
    </div>
    ` : `
    ${appointmentWizardHtml('patient')}
    `) : `
    <div class="table-wrap">
      <div class="table-toolbar">
        <span class="table-title">${tab === 'today' ? "Today's Appointments" : statusFilter ? statusFilter.charAt(0).toUpperCase()+statusFilter.slice(1)+' Appointments' : 'All Appointments'} (${sortedAppts.length})</span>
        <div class="table-actions">
          <div class="search-input-wrap">
            ${ic('search','icon-sm')}
            <input class="search-input" placeholder="Search…" oninput="window.filterTable(this,'pt-appt-tbody')">
          </div>
        </div>
      </div>
      ${sortedAppts.length ? `
      <table class="tbl">
        <colgroup>
          <col style="width:24%"><col style="width:15%"><col style="width:12%"><col style="width:22%"><col style="width:14%"><col style="width:13%">
        </colgroup>
        <thead><tr>
          <th data-sort-key="doctor" data-sort-type="text">Doctor</th>
          <th data-sort-key="date" data-sort-type="date">Date</th>
          <th>Time</th><th>Type</th><th>Status</th><th>Actions</th>
        </tr></thead>
        <tbody id="pt-appt-tbody">
          ${sortedAppts.map(a => {
            return `<tr data-search="${(a.doctorName||'').toLowerCase()} ${(a.type||'').toLowerCase()}" data-appt-status="${a.status}" data-sort-doctor="${(a.doctorName||'').toLowerCase()}" data-sort-date="${a.date}">
            <td data-label="Doctor" style="font-size:.82rem;font-weight:500">${a.doctorName || '<span style="font-style:italic;color:#9CA3AF;font-weight:400">To be assigned</span>'}</td>
            <td data-label="Date" style="font-size:.82rem">${fmtDate(a.date)}</td>
            <td data-label="Time" style="font-size:.82rem;white-space:nowrap">${a.time}</td>
            <td data-label="Type" style="font-size:.82rem">${a.type}</td>
            <td data-label="Status" style="align-items:center">${apptStatusCell(a)}</td>
            <td data-label="Actions">
              <div style="display:flex;flex-direction:column;gap:4px;align-items:flex-start">
                <div class="pt-appt-act">
                  <button class="btn-icon" title="View Details" onclick="window.viewAppt('${a.id}')">${ic('eye','icon-sm')}</button>
                  ${(a.status==='pending'||a.status==='approved') ? `
                    ${a.status==='approved' && !a.rescheduleRequest ? (apptReschedulable(a)
                      ? `<button class="btn-icon" title="Request Reschedule" style="color:#D97706" onclick="window.requestReschedule('${a.id}')">${ic('refresh-cw','icon-sm')}</button>`
                      : `<button class="btn-icon" title="Reschedule window has passed" style="color:#9CA3AF;opacity:.5;cursor:not-allowed" onclick="window.explainRescheduleDeadline()">${ic('refresh-cw','icon-sm')}</button>`) : ''}
                    ${apptCancellable(a)
                      ? `<button class="btn-icon" title="Cancel Appointment" style="color:#DC2626" onclick="window.confirmCancelAppt('${a.id}')">${ic('x-circle','icon-sm')}</button>`
                      : `<button class="btn-icon" title="Cancellation window has passed" style="color:#9CA3AF;opacity:.5;cursor:not-allowed" onclick="window.explainCancelDeadline()">${ic('x-circle','icon-sm')}</button>`}` : ''}
                </div>
                ${rescheduleReqLabel(a)}
              </div>
            </td>
          </tr>`}).join('')}
        </tbody>
      </table>` : `<div class="table-empty">${tab === 'today' ? 'No appointments scheduled for today.' : `No ${statusFilter || ''} appointments found.`}</div>`}
    </div>`}
  </div>`
}

// ════════════════════════════════════════════════════════════════
//  PATIENT — CONSULTATIONS (read-only)
// ════════════════════════════════════════════════════════════════
function pagePatientConsultations() {
  const { user } = st()
  const sorted = [...(user.consultations||[])].sort((a,b)=>b.date.localeCompare(a.date))
  const latest = sorted[0] || null

  window.state.afterRender = () => {
    window._filterConsultHistory = function(q) {
      const term = q.toLowerCase()
      let anyMatch = false
      document.querySelectorAll('.con-hist-row').forEach(function(r) {
        const match = (r.dataset.search || '').includes(term)
        r.style.display = match ? '' : 'none'
        if (match) anyMatch = true
      })
      window._syncSearchEmptyState('con-hist-card', !anyMatch, 'div', 'No consultations match your search.')
    }
  }

  return `
  <div class="page-header">
    <div class="page-header-left">
      <h1 class="page-title">Consultation History</h1>
      <p class="page-subtitle">Your consultation records from Cana Optical Clinic</p>
    </div>
  </div>
  <div class="page-body">

    ${sorted.length ? `

    <!-- Latest consultation — featured card -->
    <div style="background:linear-gradient(135deg,#1C1C1C 0%,#252525 100%);border-radius:14px;padding:22px 26px;margin-bottom:20px">
      <div style="font-size:.6rem;text-transform:uppercase;letter-spacing:.14em;color:#E8760A;font-weight:800;margin-bottom:10px">Latest Consultation</div>
      <div style="display:flex;align-items:flex-start;justify-content:space-between;gap:14px;flex-wrap:wrap;margin-bottom:${latest.chiefComplaint ? '16px' : '0'}">
        <div>
          <div style="font-size:1.1rem;font-weight:800;color:#fff;margin-bottom:3px">${latest.type || 'Consultation'}</div>
          <div style="font-size:.77rem;color:rgba(255,255,255,.55)">${fmtDate(latest.date)} &bull; ${latest.doctor}</div>
        </div>
        <button onclick="window.viewConsultationDetail('${user.id}','${latest.id}')"
          style="display:flex;align-items:center;gap:5px;padding:7px 14px;border-radius:8px;border:1px solid rgba(255,255,255,.18);background:rgba(255,255,255,.08);color:rgba(255,255,255,.85);font-family:inherit;font-size:.8rem;font-weight:500;cursor:pointer;flex-shrink:0;transition:background .15s,border-color .15s"
          onmouseover="this.style.background='rgba(255,255,255,.16)';this.style.borderColor='rgba(255,255,255,.3)'"
          onmouseout="this.style.background='rgba(255,255,255,.08)';this.style.borderColor='rgba(255,255,255,.18)'">
          ${ic('eye','icon-sm')} View Details
        </button>
      </div>
      ${latest.chiefComplaint ? `<div style="font-size:.8rem;color:rgba(255,255,255,.7);line-height:1.6">"${latest.chiefComplaint}"</div>` : ''}
    </div>

    <!-- All consultations list -->
    <div class="card" id="con-hist-card">
      <div class="card-header">
        <div class="card-title">${sorted.length} Consultation${sorted.length !== 1 ? 's' : ''} on Record</div>
        <div class="search-input-wrap">
          ${ic('search','icon-sm')}
          <input class="search-input" placeholder="Search doctor or diagnosis…" oninput="window._filterConsultHistory(this.value)">
        </div>
      </div>
      ${sorted.map((c, i) => `
      <div class="con-hist-row hist-row${i===0 ? ' hist-row-featured' : ''}" data-search="${(c.chiefComplaint||'').toLowerCase()} ${(c.doctor||'').toLowerCase()} ${(c.type||'').toLowerCase()}">
        <!-- Date block -->
        <div style="text-align:center;min-width:38px;flex-shrink:0">
          <div style="font-size:1.05rem;font-weight:800;color:#1C1C1C;line-height:1">${new Date(c.date+'T00:00:00').getDate()}</div>
          <div style="font-size:.58rem;text-transform:uppercase;font-weight:600;color:#9CA3AF;margin-top:1px">${new Date(c.date+'T00:00:00').toLocaleString('en',{month:'short'})}</div>
          <div style="font-size:.58rem;color:#C4C9D0">${new Date(c.date+'T00:00:00').getFullYear()}</div>
        </div>
        <div style="width:1px;height:36px;background:#F3F4F6;flex-shrink:0"></div>
        <!-- Info -->
        <div class="hist-row-info">
          <div style="font-size:.87rem;font-weight:700;color:#1C1C1C;overflow:hidden;text-overflow:ellipsis;white-space:nowrap">${c.chiefComplaint || 'No chief complaint recorded'}</div>
          <div style="font-size:.72rem;color:#6B7280;margin-top:2px">${c.doctor}${c.type ? ' &bull; ' + c.type : ''}</div>
        </div>
        <div class="hist-row-actions">
          ${i===0 ? `<span style="background:#FFF7ED;color:#E8760A;font-size:.63rem;font-weight:700;padding:2px 8px;border-radius:20px;border:1px solid #FDE68A;flex-shrink:0;white-space:nowrap">Latest</span>` : ''}
          <button class="btn-icon" title="View Details" onclick="window.viewConsultationDetail('${user.id}','${c.id}')">
            ${ic('eye','icon-sm')}
          </button>
        </div>
      </div>`).join('')}
    </div>

    ` : `
    <div class="card">
      <div style="text-align:center;padding:60px 24px">
        <div style="font-size:.95rem;font-weight:700;color:#1C1C1C;margin-bottom:6px">No Consultations Yet</div>
        <div style="font-size:.82rem;color:#6B7280;margin-bottom:20px">Your consultation records will appear here after your visit.</div>
        <button class="btn-primary" onclick="window.navigate('patient-request-appt')">${ic('plus','icon-sm')} Book an Appointment</button>
      </div>
    </div>`}
  </div>`
}

// ════════════════════════════════════════════════════════════════
//  PATIENT — QR CODE PAGE
// ════════════════════════════════════════════════════════════════
function pagePatientQR() {
  const { user } = st()

  const steps = [
    ['Show at Reception',  'Present this QR at the clinic reception desk for instant identity verification.'],
    ['Fast Check-in',      'Staff will scan your QR to pull up your full patient record automatically.'],
    ['Keep it Private',    'Do not share your QR code with others. It is uniquely linked to your patient account.'],
    ['Download & Print',   'You may download or print your QR code to bring a physical copy to your appointment.']
  ]

  return `
  <style>
    @media print {
      body * { visibility: hidden; }
      .qr-print-area, .qr-print-area * { visibility: visible; }
      .qr-print-area {
        position: absolute;
        left: 50%; top: 50%;
        transform: translate(-50%, -50%);
        text-align: center;
        font-family: 'Poppins', sans-serif;
      }
    }
    @media (min-width: 1024px) {
      .qr-two-col { display: grid !important; grid-template-columns: 2fr 3fr; gap: 20px; }
    }
  </style>

  <div class="page-header">
    <div class="page-header-left">
      <h1 class="page-title">My QR Code</h1>
      <p class="page-subtitle">Your personal identification QR for quick clinic check-in</p>
    </div>
  </div>
  <div class="page-body">
    <div class="qr-two-col" style="display:flex;flex-direction:column;gap:20px">

      <!-- LEFT: QR Card -->
      <div class="card" style="padding:32px;display:flex;flex-direction:column;align-items:center;text-align:center">
        <div style="font-size:.7rem;font-weight:700;text-transform:uppercase;letter-spacing:.1em;color:#9CA3AF;margin-bottom:20px">Patient Identification QR</div>

        <!-- Print-only area -->
        <div class="qr-print-area" style="display:contents">
          <div style="font-size:.8rem;font-weight:700;letter-spacing:.05em;color:#6B7280;margin-bottom:12px;display:none" class="print-clinic-name">CANA OPTICAL CLINIC</div>
          <div id="pt-qr-container" style="border-radius:10px;overflow:hidden;box-shadow:0 4px 20px rgba(0,0,0,.08);display:inline-block">
            ${window.mockQRSvg(user.qrData, 160)}
          </div>
          <div style="margin-top:18px">
            <div style="font-size:1.1rem;font-weight:700;color:#1C1C1C">${user.name}</div>
            <div style="font-size:.85rem;color:#6B7280;margin-top:4px">Patient ID: ${user.id}</div>
          </div>
          <div style="font-size:.75rem;color:#9CA3AF;margin-top:8px;display:none" class="print-hint">Present this QR code at the reception desk for quick check-in.</div>
        </div>

        <div style="display:flex;gap:12px;margin-top:24px;width:100%">
          <button class="btn-secondary" style="flex:1;justify-content:center;border-radius:8px"
                  onclick="window.downloadQR('pt-qr-container','${user.id}')">
            ${ic('download','icon-sm')} Download
          </button>
          <button class="btn-primary" style="flex:1;justify-content:center;border-radius:8px"
                  onclick="window.printQR('pt-qr-container','${user.name}','${user.id}','${user.qrData}')">
            ${ic('printer','icon-sm')} Print
          </button>
        </div>
      </div>

      <!-- RIGHT: Instructions -->
      <div class="card" style="padding:32px">
        <div style="font-size:1.1rem;font-weight:700;color:#1C1C1C;margin-bottom:24px">How to use your QR Code</div>
        <div style="position:relative">
          ${steps.map(([title, desc], i) => `
          <div style="display:flex;gap:16px">
            <div style="display:flex;flex-direction:column;align-items:center;flex-shrink:0">
              <div style="width:28px;height:28px;border-radius:50%;background:#E8760A;color:#fff;font-size:.78rem;font-weight:700;display:flex;align-items:center;justify-content:center">${i+1}</div>
              ${i < steps.length - 1 ? `<div style="width:2px;flex:1;background:#E5E7EB;margin-top:4px;min-height:24px"></div>` : ''}
            </div>
            <div style="padding-top:4px${i < steps.length - 1 ? ';padding-bottom:20px' : ''}">
              <div style="font-size:.95rem;font-weight:600;color:#1C1C1C;margin-bottom:4px">${title}</div>
              <div style="font-size:.85rem;color:#6B7280;line-height:1.5">${desc}</div>
            </div>
          </div>`).join('')}
        </div>
      </div>

    </div>
  </div>
    </div>
  </div>`
}

// ════════════════════════════════════════════════════════════════
//  STAFF — SETTINGS
// ════════════════════════════════════════════════════════════════
function pageStaffSettings() {
  const { user } = st()
  const staffMember = staff.find(s => s.id === user?.id) || user || {}
  const staffName = staffMember.name || `${staffMember.firstName || ''} ${staffMember.lastName || ''}`.trim() || 'Staff'

  const pwField = (id, placeholder, extra='') => `
    <div style="position:relative">
      <input type="password" class="form-input" id="${id}" placeholder="${placeholder}" style="padding-right:40px" autocomplete="off" readonly onfocus="this.removeAttribute('readonly')" ${extra}>
      <button type="button" onclick="window.togglePwVisibility('${id}',this)"
              style="position:absolute;right:10px;top:50%;transform:translateY(-50%);background:none;border:none;cursor:pointer;color:#9CA3AF;padding:2px;display:flex;align-items:center">
        ${ic('eye-off','icon-sm')}
      </button>
    </div>`

  return `
  <style>
    @media (min-width: 1024px) { .staff-sett-col { display: grid !important; grid-template-columns: 55fr 45fr; gap: 20px; align-items: start; } }
  </style>
  <div class="page-header">
    <div class="page-header-left">
      <h1 class="page-title">Settings</h1>
      <p class="page-subtitle">Manage your profile and account preferences</p>
    </div>
  </div>
  <div class="page-body">

    <!-- Profile Banner -->
    <div class="card" style="padding:28px 32px;margin-bottom:20px">
      <div style="display:flex;align-items:center;gap:24px;flex-wrap:wrap">

        <!-- Clickable avatar -->
        ${window.profilePhotoEditorHtml('st', staffName, user.photoUrl)}

        <div style="flex:1;min-width:160px">
          <div style="font-size:1.2rem;font-weight:700;color:#1C1C1C">${staffName}</div>
          <div style="font-size:.85rem;color:#E8760A;font-weight:600;margin-top:3px">Staff &bull; ${staffMember.id || ''}</div>
          <div style="font-size:.82rem;color:#6B7280;margin-top:4px">${staffMember.email || ''}</div>
          <div style="font-size:.82rem;color:#6B7280">${staffMember.contact || ''}</div>
        </div>
        <div style="display:flex;gap:8px;flex-shrink:0">
          <label for="st-photo-input" class="btn-secondary" style="cursor:pointer">
            ${ic('camera','icon-sm')} Change Photo
          </label>
          ${window.removePhotoBtnHtml('st', staffName, user.photoUrl)}
        </div>
      </div>
    </div>

    <div class="staff-sett-col" style="display:flex;flex-direction:column;gap:20px">

      <!-- LEFT: Personal Info -->
      <div class="card" style="padding:28px">
        <div style="display:flex;align-items:center;gap:8px;margin-bottom:20px">
          <div style="color:#E8760A">${ic('user','icon-sm')}</div>
          <div style="font-size:1.05rem;font-weight:700;color:#1C1C1C">Personal Information</div>
        </div>
        <div style="display:flex;flex-direction:column;gap:14px">
          <div class="form-row-2">
            <div class="form-group">
              <label class="form-label">First Name</label>
              <input class="form-input" id="st-fname" value="${staffMember.firstName || ''}">
            </div>
            <div class="form-group">
              <label class="form-label">Middle Name</label>
              <input class="form-input" id="st-mname" value="${staffMember.middleName || ''}">
            </div>
          </div>
          <div class="form-group">
            <label class="form-label">Last Name</label>
            <input class="form-input" id="st-lname" value="${staffMember.lastName || ''}">
          </div>
          <div class="form-row-2">
            <div class="form-group">
              <label class="form-label">Email Address</label>
              <input class="form-input" type="email" id="st-email" value="${staffMember.email || ''}">
            </div>
            <div class="form-group">
              <label class="form-label">Phone Number</label>
              <input class="form-input" id="st-phone" inputmode="numeric" maxlength="13" oninput="window.formatContactInput(this)" value="${staffMember.contact || ''}">
            </div>
          </div>
          <div style="display:flex;justify-content:flex-end;margin-top:4px">
            <button class="btn-primary" onclick="window.saveUserProfile(this)">
              ${ic('check','icon-sm')} Save Changes
            </button>
          </div>
        </div>
      </div>

      <!-- RIGHT: Security -->
      <div class="card" style="padding:28px">
        <div style="display:flex;align-items:center;gap:8px;margin-bottom:4px">
          <div style="color:#E8760A">${ic('shield','icon-sm')}</div>
          <div style="font-size:1.05rem;font-weight:700;color:#1C1C1C">Security</div>
        </div>
        <div style="font-size:.82rem;color:#9CA3AF;margin-bottom:20px">Change your account password</div>
        <div style="display:flex;flex-direction:column;gap:14px">
          <div class="form-group">
            <label class="form-label">Current Password</label>
            ${pwField('st-curpw','Enter current password', `oninput="window.updateSettingsPwGate('st')"`)}
          </div>
          <div class="form-group">
            <label class="form-label">New Password</label>
            ${pwField('st-newpw','Minimum 8 characters', `oninput="window.updatePwChecklist('st-newpw', this.value);window.updateSettingsPwGate('st')"`)}
            ${window.pwChecklistHtml('st-newpw')}
          </div>
          <div class="form-group">
            <label class="form-label">Confirm New Password</label>
            ${pwField('st-confpw','Repeat new password', `oninput="window.updateSettingsPwGate('st')"`)}
            <div id="st-pw-err" class="field-error">Passwords do not match.</div>
          </div>
          <div style="display:flex;align-items:flex-start;gap:6px;font-size:.78rem;color:#9CA3AF">
            ${ic('info','icon-sm')} Can't reuse a previous password.
          </div>
          <div style="display:flex;justify-content:flex-end">
            <button id="st-pw-btn" class="btn-primary" disabled style="opacity:.55;cursor:not-allowed"
                    onclick="window.validateSettingsPassword('st-newpw','st-confpw','st-pw-err','st-curpw')">
              ${ic('lock','icon-sm')} Update Password
            </button>
          </div>
        </div>
      </div>

    </div>
  </div>`
}

// ════════════════════════════════════════════════════════════════
//  PATIENT — PRESCRIPTIONS
// ════════════════════════════════════════════════════════════════

// Full printable "document" card for one prescription — used inline on the
// patient's own Prescriptions list and Patient Records. This is the same
// canonical rendering viewPrescriptionDetail() (main.js) opens as a modal —
// exam-keyed callers go through viewPrescriptionModal(), which resolves to
// that same implementation instead of maintaining a second one.
function renderRxDocumentCard(rx, patient, isFeatured) {
  if (!rx) return ''
  const rxDate     = new Date(rx.date.includes('T') ? rx.date : rx.date + 'T00:00:00')
  const rxDateStr  = rxDate.toLocaleDateString('en-PH', {year:'numeric',month:'long',day:'numeric'})
  const expiryDate = rx.expiryDate ? new Date(rx.expiryDate.includes('T') ? rx.expiryDate : rx.expiryDate+'T00:00:00')
                     : (() => { const d = new Date(rxDate); d.setFullYear(d.getFullYear()+1); return d })()
  const expiryStr  = expiryDate.toLocaleDateString('en-PH', {year:'numeric',month:'long',day:'numeric'})
  const statusLabel = rx.status === 'superseded' ? 'Superseded' : (rx.status === 'expired' || expiryDate < new Date() ? 'Expired' : 'Valid')
  const docInits   = (rx.doctor||'Dr').split(' ').slice(0,2).map(w=>w[0]||'').join('').toUpperCase()
  const docRecord  = doctors.find(d => d.name === rx.doctor)
  const docPhoto   = docRecord?.photoUrl || null
  // Same contact-lens type list the exam wizard's own Correction Type
  // toggle uses (pageNewExamination(), this file) — duplicated locally
  // rather than shared across files, matching how that list already
  // isn't a single canonical source anywhere else in this codebase.
  const correctionType = ['Hard Lenses','Soft Lenses','Hybrid Lenses','Multifocal Lenses','Scleral Lenses'].includes(rx.lensType) ? 'Contact Lens' : 'Eyeglass'
  return `
    <div class="card" style="margin-bottom:18px;overflow:hidden${isFeatured ? ';box-shadow:0 0 0 2px #E8760A,0 8px 24px rgba(232,118,10,.12)' : ''}">

      <!-- Clinic document letterhead -->
      <div style="background:linear-gradient(135deg,#1C1C1C 0%,#2D2D2D 100%);padding:14px 20px;display:flex;align-items:center;justify-content:space-between;gap:12px">
        <div>
          <div style="font-size:.54rem;text-transform:uppercase;letter-spacing:.14em;color:#E8760A;font-weight:800;margin-bottom:2px">Official Optical Prescription</div>
          <div style="font-size:.9rem;font-weight:900;color:#fff;letter-spacing:-.01em">Cana Optical Clinic</div>
        </div>
        <div style="text-align:right;flex-shrink:0">
          ${isFeatured ? `<span style="font-size:.58rem;font-weight:700;padding:2px 8px;border-radius:20px;background:rgba(232,118,10,.2);color:#E8760A;border:1px solid rgba(232,118,10,.3)">Latest</span>` : ''}
          <div style="font-size:.58rem;color:rgba(255,255,255,.38);text-transform:uppercase;letter-spacing:.05em;margin-top:4px">Rx No.</div>
          <div style="font-size:.68rem;font-family:monospace;color:rgba(255,255,255,.52)">${rx.id}</div>
        </div>
      </div>

      <!-- Issuer + validity strip -->
      <div class="rx-issuer-strip" style="background:#F9FAFB;border-bottom:1px solid #F3F4F6;padding:10px 20px;display:flex;align-items:center;justify-content:space-between;gap:12px;flex-wrap:wrap">
        <div style="display:flex;align-items:center;gap:10px">
          ${docPhoto
            ? `<div style="width:34px;height:34px;border-radius:50%;overflow:hidden;flex-shrink:0"><img src="${docPhoto}" alt="${rx.doctor}" style="width:100%;height:100%;object-fit:cover;border-radius:50%;display:block"></div>`
            : `<div style="width:34px;height:34px;border-radius:50%;background:#1C1C1C;display:flex;align-items:center;justify-content:center;font-size:.72rem;font-weight:800;color:#E8760A;flex-shrink:0;letter-spacing:.02em">${docInits}</div>`
          }
          <div>
            <div style="font-size:.6rem;color:#9CA3AF;text-transform:uppercase;letter-spacing:.05em">Issued by</div>
            <div style="font-size:.85rem;font-weight:700;color:#1C1C1C">${rx.doctor}${rx.prcLicense ? ` <span style="font-weight:400;color:#9CA3AF">&bull; PRC ${rx.prcLicense}</span>` : ''}</div>
          </div>
        </div>
        <div class="rx-issuer-meta" style="text-align:right;flex-shrink:0">
          <div style="font-size:.72rem;color:#9CA3AF;margin-bottom:4px">${rxDateStr}</div>
          <span style="font-size:.68rem;font-weight:700;padding:3px 10px;border-radius:20px;${statusLabel === 'Valid' ? 'background:#ECFDF5;color:#059669;border:1px solid #A7F3D0' : (statusLabel === 'Superseded' ? 'background:#F3F4F6;color:#6B7280;border:1px solid #E5E7EB' : 'background:#FEE2E2;color:#DC2626;border:1px solid #FECACA')}">
            ${statusLabel === 'Valid' ? ic('check-circle','icon-sm') + ' Valid until ' + expiryStr : ic('x-circle','icon-sm') + ' ' + statusLabel}
          </span>
        </div>
      </div>

      <!-- Printable prescription body -->
      <div id="rx-card-${rx.id}" style="padding:18px 20px">

        <div style="display:flex;align-items:center;justify-content:space-between;margin-bottom:10px">
          <div style="font-size:.6rem;font-weight:700;text-transform:uppercase;letter-spacing:.1em;color:#9CA3AF">Final Refraction</div>
          <span style="font-size:.62rem;font-weight:700;padding:2px 10px;border-radius:20px;background:#FFF7ED;color:#C2410C;border:1px solid #FDE68A">${correctionType}</span>
        </div>

        <!-- OD / OS bordered cards -->
        <div style="display:grid;grid-template-columns:1fr 1fr;gap:10px;margin-bottom:16px">
          <!-- OD -->
          <div style="border:1.5px solid #86EFAC;border-radius:10px;overflow:hidden">
            <div style="background:#F0FDF4;padding:7px 12px;border-bottom:1px solid #86EFAC;display:flex;align-items:center;gap:5px">
              <div style="width:6px;height:6px;border-radius:50%;background:#22C55E;flex-shrink:0"></div>
              <span style="font-size:.62rem;font-weight:800;text-transform:uppercase;letter-spacing:.07em;color:#059669">OD (Right Eye)</span>
            </div>
            <div style="display:grid;grid-template-columns:repeat(3,1fr);background:#fff">
              ${['sph','cyl','axis'].map((k,i) => `
              <div style="padding:11px 6px;${i<2 ? 'border-right:1px solid #F3F4F6;' : ''}text-align:center">
                <div style="font-size:.56rem;font-weight:700;text-transform:uppercase;letter-spacing:.06em;color:#9CA3AF;margin-bottom:4px">${k.toUpperCase()}</div>
                <div style="font-size:.95rem;font-weight:800;font-family:monospace;color:#1C1C1C">${rx.od?.[k] || '—'}</div>
              </div>`).join('')}
            </div>
            ${rx.od?.add ? `<div style="padding:7px 12px;border-top:1px solid #BBF7D0;background:#F0FDF4;display:flex;align-items:center;justify-content:space-between"><span style="font-size:.56rem;color:#9CA3AF;font-weight:700;text-transform:uppercase">Add Power</span><span style="font-size:.82rem;font-weight:800;font-family:monospace;color:#059669">${rx.od.add}</span></div>` : ''}
          </div>
          <!-- OS -->
          <div style="border:1.5px solid #FDE68A;border-radius:10px;overflow:hidden">
            <div style="background:#FFF7ED;padding:7px 12px;border-bottom:1px solid #FDE68A;display:flex;align-items:center;gap:5px">
              <div style="width:6px;height:6px;border-radius:50%;background:#E8760A;flex-shrink:0"></div>
              <span style="font-size:.62rem;font-weight:800;text-transform:uppercase;letter-spacing:.07em;color:#B45309">OS (Left Eye)</span>
            </div>
            <div style="display:grid;grid-template-columns:repeat(3,1fr);background:#fff">
              ${['sph','cyl','axis'].map((k,i) => `
              <div style="padding:11px 6px;${i<2 ? 'border-right:1px solid #F3F4F6;' : ''}text-align:center">
                <div style="font-size:.56rem;font-weight:700;text-transform:uppercase;letter-spacing:.06em;color:#9CA3AF;margin-bottom:4px">${k.toUpperCase()}</div>
                <div style="font-size:.95rem;font-weight:800;font-family:monospace;color:#1C1C1C">${rx.os?.[k] || '—'}</div>
              </div>`).join('')}
            </div>
            ${rx.os?.add ? `<div style="padding:7px 12px;border-top:1px solid #FEF3C7;background:#FFFBEB;display:flex;align-items:center;justify-content:space-between"><span style="font-size:.56rem;color:#9CA3AF;font-weight:700;text-transform:uppercase">Add Power</span><span style="font-size:.82rem;font-weight:800;font-family:monospace;color:#E8760A">${rx.os.add}</span></div>` : ''}
          </div>
        </div>

        ${(rx.pd || rx.lensType || rx.lensMaterial) ? `
        <div style="display:grid;grid-template-columns:${[rx.pd?'1fr':'',rx.lensType?'1fr':'',rx.lensMaterial?'1fr':''].filter(Boolean).join(' ')};gap:8px;margin-bottom:10px">
          ${rx.pd ? `<div style="background:#F9FAFB;border:1px solid #F3F4F6;border-radius:8px;padding:9px 12px"><div style="font-size:.58rem;color:#9CA3AF;text-transform:uppercase;letter-spacing:.05em;margin-bottom:3px">PD</div><div style="font-size:.82rem;font-weight:700;color:#1C1C1C">${rx.pd} mm</div></div>` : ''}
          ${rx.lensType ? `<div style="background:#F9FAFB;border:1px solid #F3F4F6;border-radius:8px;padding:9px 12px"><div style="font-size:.58rem;color:#9CA3AF;text-transform:uppercase;letter-spacing:.05em;margin-bottom:3px">Lens Type</div><div style="font-size:.82rem;font-weight:700;color:#1C1C1C">${rx.lensType}</div></div>` : ''}
          ${rx.lensMaterial ? `<div style="background:#F9FAFB;border:1px solid #F3F4F6;border-radius:8px;padding:9px 12px"><div style="font-size:.58rem;color:#9CA3AF;text-transform:uppercase;letter-spacing:.05em;margin-bottom:3px">Lens Material</div><div style="font-size:.82rem;font-weight:700;color:#1C1C1C">${rx.lensMaterial}</div></div>` : ''}
        </div>` : ''}

        ${rx.frameSelection ? `
        <div style="display:flex;align-items:center;gap:8px;padding:9px 12px;background:#F9FAFB;border:1px solid #F3F4F6;border-radius:8px;margin-bottom:10px">
          <span style="font-size:.62rem;font-weight:700;text-transform:uppercase;letter-spacing:.05em;color:#9CA3AF;flex-shrink:0">Frame</span>
          <span style="font-size:.82rem;font-weight:700;color:#1C1C1C">${rx.frameSelection}</span>
        </div>` : ''}

        ${rx.lensCoating && rx.lensCoating.length ? `
        <div style="display:flex;flex-wrap:wrap;gap:5px;margin-bottom:10px">
          ${rx.lensCoating.map(c=>`<span style="background:#FFF7ED;color:#C2410C;font-size:.7rem;font-weight:600;padding:2px 9px;border-radius:20px;border:1px solid #FDE68A">${c}</span>`).join('')}
        </div>` : ''}

        ${(rx.totalAmount || rx.dispensedDate || rx.receivedBy) ? `
        <div style="border-top:1px solid #F3F4F6;padding-top:12px">
          <div style="font-size:.6rem;font-weight:700;text-transform:uppercase;letter-spacing:.1em;color:#9CA3AF;margin-bottom:8px">Dispensing Information</div>
          <div style="display:grid;grid-template-columns:repeat(auto-fit,minmax(110px,1fr));gap:8px">
            ${rx.totalAmount ? `<div style="background:#F9FAFB;border:1px solid #F3F4F6;border-radius:8px;padding:9px 12px"><div style="font-size:.58rem;color:#9CA3AF;text-transform:uppercase;letter-spacing:.05em;margin-bottom:3px">Total Amount</div><div style="font-size:.82rem;font-weight:700;color:#1C1C1C">&#8369;${Number(rx.totalAmount).toLocaleString('en-PH',{minimumFractionDigits:2,maximumFractionDigits:2})}</div></div>` : ''}
            ${rx.dispensedDate ? `<div style="background:#F9FAFB;border:1px solid #F3F4F6;border-radius:8px;padding:9px 12px"><div style="font-size:.58rem;color:#9CA3AF;text-transform:uppercase;letter-spacing:.05em;margin-bottom:3px">Dispensed Date</div><div style="font-size:.82rem;font-weight:700;color:#1C1C1C">${new Date(rx.dispensedDate.includes('T') ? rx.dispensedDate : rx.dispensedDate+'T00:00:00').toLocaleDateString('en-PH',{year:'numeric',month:'short',day:'numeric'})}</div></div>` : ''}
            ${rx.receivedBy ? `<div style="background:#F9FAFB;border:1px solid #F3F4F6;border-radius:8px;padding:9px 12px"><div style="font-size:.58rem;color:#9CA3AF;text-transform:uppercase;letter-spacing:.05em;margin-bottom:3px">Received By</div><div style="font-size:.82rem;font-weight:700;color:#1C1C1C">${rx.receivedBy}</div></div>` : ''}
          </div>
        </div>` : ''}

      </div><!-- end printable body -->

      <!-- Card footer — Print stays admin/staff/doctor-only; the validity
           note is informational, so it still shows for a patient viewing
           their own Rx even without a print action next to it. -->
      <div style="padding:10px 20px;border-top:1px solid #F3F4F6;background:#FAFAFA;display:flex;align-items:center;justify-content:space-between;gap:8px;flex-wrap:wrap">
        <div style="font-size:.72rem;color:#9CA3AF">Rx valid for 1 year from date of issue</div>
        ${window.state?.role !== 'patient' ? `
        <div style="display:flex;gap:8px">
          <button class="btn-secondary" style="font-size:.78rem;padding:5px 12px"
                  onclick="window.downloadRxRecordPDF('${patient.id}','${rx.id}',this)">
            ${ic('download','icon-sm')} Download PDF
          </button>
          <button class="btn-secondary" style="font-size:.78rem;padding:5px 12px"
                  onclick="window.printRxRecord('${patient.id}','${rx.id}')">
            ${ic('printer','icon-sm')} Print Rx
          </button>
        </div>` : ''}
      </div>

    </div>`
}
window.renderRxDocumentCard = renderRxDocumentCard

function pagePatientPrescriptions() {
  const { user } = st()
  const patient = patients.find(p => p.id === user.id)
  const rxList  = patient?.prescriptions || []
  const sorted  = [...rxList].sort((a,b) => b.date.localeCompare(a.date))
  const latest  = sorted[0] || null

  window.state.afterRender = () => {
    window._filterRxHistory = function(q) {
      const term = q.toLowerCase()
      let anyMatch = false
      document.querySelectorAll('.rx-hist-row').forEach(function(r) {
        const match = (r.dataset.search || '').includes(term)
        r.style.display = match ? '' : 'none'
        if (match) anyMatch = true
      })
      window._syncSearchEmptyState('rx-hist-card', !anyMatch, 'div', 'No prescriptions match your search.')
    }
  }

  return `
  <div class="page-header">
    <div class="page-header-left">
      <h1 class="page-title">My Prescriptions</h1>
      <p class="page-subtitle">Official optical prescriptions from Cana Optical Clinic</p>
    </div>
  </div>
  <div class="page-body">
    ${sorted.length ? `

    ${renderRxDocumentCard(latest, patient, true)}

    <!-- All prescriptions list -->
    <div class="card" id="rx-hist-card">
      <div class="card-header">
        <div class="card-title">${sorted.length} Prescription${sorted.length !== 1 ? 's' : ''} on Record</div>
        <div class="search-input-wrap">
          ${ic('search','icon-sm')}
          <input class="search-input" placeholder="Search doctor or lens type…" oninput="window._filterRxHistory(this.value)">
        </div>
      </div>
      ${sorted.map((rx, i) => {
        const d = new Date(rx.date.includes('T') ? rx.date : rx.date + 'T00:00:00')
        const expiryDate = rx.expiryDate ? new Date(rx.expiryDate.includes('T') ? rx.expiryDate : rx.expiryDate+'T00:00:00')
          : (() => { const e = new Date(d); e.setFullYear(e.getFullYear()+1); return e })()
        const isExpired = rx.status === 'expired' || (rx.status !== 'superseded' && expiryDate < new Date())
        return `
      <div class="rx-hist-row hist-row${i===0 ? ' hist-row-featured' : ''}" data-search="${(rx.doctor||'').toLowerCase()} ${(rx.lensType||'').toLowerCase()} ${rx.id.toLowerCase()}">
        <!-- Date block -->
        <div style="text-align:center;min-width:38px;flex-shrink:0">
          <div style="font-size:1.05rem;font-weight:800;color:#1C1C1C;line-height:1">${d.getDate()}</div>
          <div style="font-size:.58rem;text-transform:uppercase;font-weight:600;color:#9CA3AF;margin-top:1px">${d.toLocaleString('en',{month:'short'})}</div>
          <div style="font-size:.58rem;color:#C4C9D0">${d.getFullYear()}</div>
        </div>
        <div style="width:1px;height:36px;background:#F3F4F6;flex-shrink:0"></div>
        <!-- Info -->
        <div class="hist-row-info">
          <div style="font-size:.87rem;font-weight:700;color:#1C1C1C;overflow:hidden;text-overflow:ellipsis;white-space:nowrap">${rx.id} &bull; ${rx.doctor}</div>
          <div style="font-size:.72rem;color:#6B7280;margin-top:2px">${rx.lensType && rx.lensType !== '—' ? rx.lensType : 'No lens type on file'}</div>
        </div>
        <div class="hist-row-actions">
          ${i===0 ? `<span style="background:#FFF7ED;color:#E8760A;font-size:.63rem;font-weight:700;padding:2px 8px;border-radius:20px;border:1px solid #FDE68A;flex-shrink:0;white-space:nowrap">Latest</span>` : ''}
          <span style="font-size:.68rem;font-weight:700;padding:3px 10px;border-radius:20px;white-space:nowrap;${isExpired ? 'background:#FEE2E2;color:#DC2626;border:1px solid #FECACA' : 'background:#ECFDF5;color:#059669;border:1px solid #A7F3D0'}">${isExpired ? 'Expired' : 'Valid'}</span>
          <button class="btn-icon" title="View Prescription" onclick="window.viewPrescriptionDetail('${patient.id}','${rx.id}')">
            ${ic('eye','icon-sm')}
          </button>
        </div>
      </div>`}).join('')}
    </div>

    ` : `
    <div class="card">
      <div style="text-align:center;padding:64px 24px">
        <div style="font-size:.95rem;font-weight:700;color:#1C1C1C;margin-bottom:6px">No Prescriptions Yet</div>
        <div style="font-size:.82rem;color:#9CA3AF;margin-bottom:20px;max-width:300px;margin-left:auto;margin-right:auto;line-height:1.6">Prescription records are generated after your optical examination with a doctor.</div>
        <button class="btn-primary" onclick="window.navigate('patient-request-appt')">${ic('plus','icon-sm')} Book an Appointment</button>
      </div>
    </div>`}
  </div>`
}

// ════════════════════════════════════════════════════════════════
//  PATIENT — NOTIFICATIONS
// ════════════════════════════════════════════════════════════════
function pagePatientNotifications() {
  const notifs = window._notifications || []

  const typeIcon  = { approved:'check-circle', cancelled:'x-circle', disapproved:'x-circle', rescheduled:'calendar', new_appointment:'calendar', reschedule_request:'alert-circle', welcome:'home', reminder:'clock', waitlist_offer:'alert-circle', waitlist_removed:'x-circle', waitlist_join:'clock', waitlist_left:'x-circle', no_show:'alert-circle', record:'eye', prescription:'file-text', info:'info', appointment_confirmed:'check-circle', follow_up_needed:'calendar', new_login:'monitor', deletion_request:'user-x', deletion_reviewed:'check-circle' }
  const typeColor = { approved:'#059669', cancelled:'#EF4444', disapproved:'#EF4444', rescheduled:'#3B82F6', new_appointment:'#E8760A', reschedule_request:'#D97706', welcome:'#E8760A', reminder:'#D97706', waitlist_offer:'#E8760A', waitlist_removed:'#EF4444', waitlist_join:'#E8760A', waitlist_left:'#6B7280', no_show:'#EF4444', record:'#E8760A', prescription:'#3B82F6', info:'#6B7280', appointment_confirmed:'#059669', follow_up_needed:'#E8760A', new_login:'#E8760A', deletion_request:'#EF4444', deletion_reviewed:'#059669' }
  const typeBg    = { approved:'#ECFDF5', cancelled:'#FEF2F2', disapproved:'#FEF2F2', rescheduled:'#EFF6FF', new_appointment:'#FFF0DC', reschedule_request:'#FFF3CD', welcome:'#FFF0DC', reminder:'#FFF3CD', waitlist_offer:'#FFF0DC', waitlist_removed:'#FEF2F2', waitlist_join:'#FFF0DC', waitlist_left:'#F3F4F6', no_show:'#FEF2F2', record:'#FFF0DC', prescription:'#EFF6FF', info:'#F3F4F6', appointment_confirmed:'#ECFDF5', follow_up_needed:'#FFF0DC', new_login:'#FFF0DC', deletion_request:'#FEF2F2', deletion_reviewed:'#ECFDF5' }
  // 'welcome' precedent (info-typed but title-matched to a more specific
  // display type) reused here for notifications created before
  // 'deletion_reviewed' became its own type (api/patients/dismiss-
  // deletion-request.php) — those rows are stuck as plain 'info' in the
  // DB forever, so this is the only way they ever pick up the right icon.
  const resolveType = n => (n.type === 'info' && n.title?.toLowerCase().startsWith('welcome')) ? 'welcome'
    : (n.type === 'info' && n.title === 'Deletion Request Reviewed') ? 'deletion_reviewed'
    : n.type

  const unreadCount = notifs.filter(n => !n.isRead).length

  const emptyHtml = `
    <div style="text-align:center;padding:56px 24px">
      <p style="margin:0 0 4px;font-size:.9rem;font-weight:600;color:#6B7280">No notifications</p>
      <p style="font-size:.8rem;margin:0;color:#9CA3AF">You're all caught up!</p>
    </div>`

  const _dashByRole = { admin:'admin-dashboard', staff:'staff-dashboard', doctor:'doctor-dashboard', patient:'patient-dashboard' }
  return `
  <div class="page-header">
    <div class="page-header-left" style="display:flex;align-items:center;gap:12px">
      <button class="btn-icon" onclick="window.goBack('${_dashByRole[st().role] || 'admin-dashboard'}')" title="Back">
        ${ic('chevron-left','icon')}
      </button>
      <div>
        <h1 class="page-title">Notifications</h1>
        <p class="page-subtitle">Stay updated on your appointments and records</p>
      </div>
    </div>
    <div style="display:flex;gap:8px;flex-wrap:wrap">
      ${unreadCount ? `
      <button class="btn-secondary" onclick="window.markAllNotifsRead()">
        ${ic('check','icon-sm')} Mark All as Read
      </button>` : ''}
      ${notifs.length ? `
      <button class="btn-ghost" style="color:#DC2626" onclick="window.deleteAllNotifs()">
        ${ic('trash-2','icon-sm')} Clear All
      </button>` : ''}
    </div>
  </div>
  <div class="page-body">
    <div class="card">
      ${notifs.length ? notifs.map(n => `
      <div id="notif-${n.id}" onclick="window.markNotifRead(${n.id})"
           style="display:flex;align-items:center;gap:14px;padding:16px 20px;border-bottom:1px solid #F3F4F6;cursor:pointer;transition:background .15s;${n.isRead ? '' : 'background:#FAFAF8'}"
           onmouseover="this.style.background='#F9FAFB'" onmouseout="this.style.background='${n.isRead ? 'transparent' : '#FAFAF8'}'">
        <div style="width:38px;height:38px;border-radius:50%;background:${typeBg[resolveType(n)]||'#F3F4F6'};display:flex;align-items:center;justify-content:center;color:${typeColor[resolveType(n)]||'#6B7280'};flex-shrink:0">
          ${ic(typeIcon[resolveType(n)] || 'info','icon-sm')}
        </div>
        <div style="flex:1;min-width:0">
          <div style="display:flex;align-items:center;gap:8px;margin-bottom:3px">
            <span style="font-size:.87rem;font-weight:${n.isRead ? '500' : '700'};color:#1C1C1C">${n.title}</span>
            ${n.isRead ? '' : `<span style="width:7px;height:7px;border-radius:50%;background:#E8760A;flex-shrink:0;display:inline-block"></span>`}
          </div>
          <p style="font-size:.8rem;color:#6B7280;margin:0;line-height:1.5">${n.body}</p>
          <div style="font-size:.72rem;color:#9CA3AF;margin-top:4px">${window._notifTimeAgo ? window._notifTimeAgo(n.createdAt) : n.createdAt}</div>
        </div>
        <button class="btn-icon" title="Delete" style="flex-shrink:0;color:#9CA3AF"
                onclick="event.stopPropagation();window.deleteNotif(${n.id})">
          ${ic('trash-2','icon-sm')}
        </button>
      </div>`).join('') : emptyHtml}
    </div>
  </div>`
}

// ════════════════════════════════════════════════════════════════
//  PATIENT — SETTINGS
// ════════════════════════════════════════════════════════════════
function pagePatientSettings() {
  const { user } = st()
  const patient = patients.find(p => p.id === user.id)

  const regDate = patient?.registeredDate
    ? new Date(patient.registeredDate).toLocaleDateString('en-PH', { month: 'long', year: 'numeric' })
    : '—'

  const pwField = (id, placeholder, extra='') => `
    <div style="position:relative">
      <input type="password" class="form-input" id="${id}" placeholder="${placeholder}" style="padding-right:40px" autocomplete="off" readonly onfocus="this.removeAttribute('readonly')" ${extra}>
      <button type="button" onclick="window.togglePwVisibility('${id}',this)"
              style="position:absolute;right:10px;top:50%;transform:translateY(-50%);background:none;border:none;cursor:pointer;color:#9CA3AF;padding:2px;display:flex;align-items:center">
        ${ic('eye-off','icon-sm')}
      </button>
    </div>`

  return `
  <style>
    /* Danger Zone is last in the markup, after both columns, on every
       breakpoint — on mobile .pt-sett-col is a plain flex-column so DOM
       order alone stacks it last, below Email/Security/QR included. On
       desktop, .pt-sett-left and .pt-sett-right sit side by side in row
       1 (each sized purely by its own content, no shared-row coupling
       between them), and .pt-sett-danger spans the full width as row 2
       underneath — always the final, full-width section regardless of
       breakpoint. */
    @media (min-width: 1024px) {
      .pt-sett-col { display: grid !important; grid-template-columns: 55fr 45fr; grid-template-rows: auto auto; gap: 20px; align-items: start; }
      .pt-sett-left   { grid-column: 1; grid-row: 1; }
      .pt-sett-right  { grid-column: 2; grid-row: 1; }
      .pt-sett-danger { grid-column: 1 / -1; grid-row: 2; }
    }
  </style>
  <div class="page-header">
    <div class="page-header-left">
      <h1 class="page-title">Settings</h1>
      <p class="page-subtitle">Manage your account and personal information</p>
    </div>
  </div>
  <div class="page-body">

    <!-- Profile Banner -->
    <div class="card" style="padding:28px 32px;margin-bottom:20px">
      <div style="display:flex;align-items:center;gap:24px;flex-wrap:wrap">

        <!-- Clickable avatar -->
        ${window.profilePhotoEditorHtml('pt', user.name, user.photoUrl)}

        <div style="flex:1;min-width:160px">
          <div style="font-size:1.2rem;font-weight:700;color:#1C1C1C">${user.name}</div>
          <div style="font-size:.85rem;color:#E8760A;font-weight:600;margin-top:3px">Patient ID: ${user.id}</div>
          <div style="font-size:.82rem;color:#6B7280;margin-top:4px">${patient?.email || user.email}</div>
          <div style="font-size:.82rem;color:#6B7280">${patient?.contact || ''}</div>
          <div style="font-size:.75rem;color:#9CA3AF;margin-top:5px">Member since ${regDate}</div>
        </div>
        <div style="display:flex;gap:8px;flex-shrink:0">
          <label for="pt-photo-input" class="btn-secondary" style="cursor:pointer">
            ${ic('camera','icon-sm')} Change Photo
          </label>
          ${window.removePhotoBtnHtml('pt', user.name, user.photoUrl)}
        </div>
      </div>
    </div>

    <!-- Two-column area -->
    <div class="pt-sett-col" style="display:flex;flex-direction:column;gap:20px">

      <!-- LEFT column -->
      <div class="pt-sett-left" style="display:flex;flex-direction:column;gap:20px">

      <!-- Personal Information -->
      <div class="card" style="padding:28px">
        <div style="display:flex;align-items:center;gap:8px;margin-bottom:20px">
          <div style="color:#E8760A">${ic('user','icon-sm')}</div>
          <div style="font-size:1.05rem;font-weight:700;color:#1C1C1C">Personal Information</div>
        </div>
        <div style="display:flex;flex-direction:column;gap:14px">
          <div class="form-row-2">
            <div class="form-group">
              <label class="form-label">First Name</label>
              <input type="text" class="form-input" value="${patient?.firstName || user.firstName}" id="sett-first">
            </div>
            <div class="form-group">
              <label class="form-label">Middle Name</label>
              <input type="text" class="form-input" value="${patient?.middleName || user.middleName || ''}" id="sett-middle">
            </div>
          </div>
          <div class="form-group">
            <label class="form-label">Last Name</label>
            <input type="text" class="form-input" value="${patient?.lastName || user.lastName}" id="sett-last">
          </div>
          <div class="form-group">
            <label class="form-label">Contact Number</label>
            <input type="text" class="form-input" id="sett-contact" inputmode="numeric" maxlength="13" oninput="window.formatContactInput(this)" value="${patient?.contact || ''}">
          </div>
          <div class="form-group">
            <label class="form-label">Complete Address</label>
            <input type="text" class="form-input" value="${patient?.address || ''}" id="sett-address">
          </div>
          <div class="form-group">
            <label class="form-label">Occupation</label>
            <input type="text" class="form-input" placeholder="e.g. Teacher, Engineer, Student" value="${patient?.occupation || ''}" id="sett-occupation">
          </div>
          <div class="form-group">
            <label class="form-label">Medical History <span style="font-size:.75rem;color:#9CA3AF;font-weight:400">(optional)</span></label>
            <textarea class="form-textarea" rows="3" placeholder="Conditions, allergies, ongoing medications, past eye surgeries, etc." id="sett-medical-history">${esc(patient?.medicalHistory || '')}</textarea>
            <p style="margin:6px 0 0;font-size:.72rem;color:#9CA3AF">Shared with your doctor during examinations.</p>
          </div>
          <div class="form-row-2">
            <div class="form-group">
              <label class="form-label">Date of Birth</label>
              ${window.dobFieldHtml('sett-dob', { value: patient?.dob || '', max: window.maxDobFor13(), onchange: 'window._syncSettAge()' })}
            </div>
            <div class="form-group">
              <label class="form-label" style="display:flex;align-items:center;gap:4px;color:#9CA3AF">
                ${ic('info','icon-sm')} Age
              </label>
              <input type="text" class="form-input" id="sett-age-display" value="${patient?.age ? patient.age + ' years old' : '—'}" disabled
                     style="background:#F9FAFB;color:#9CA3AF;cursor:not-allowed">
            </div>
          </div>
          <div class="form-row-2">
            <div class="form-group">
              <label class="form-label">Gender</label>
              ${window.selectFieldHtml('sett-gender', { value: patient?.gender || '', options: ['Male','Female','Other'] })}
            </div>
            <div class="form-group"></div>
          </div>
          <div style="background:#FFF7ED;border-left:3px solid #E8760A;border-radius:8px;padding:10px 14px;display:flex;align-items:flex-start;gap:8px;font-size:.8rem;color:#92400E">
            <span style="flex-shrink:0;display:flex">${ic('info','icon-sm')}</span> Age is calculated automatically from your date of birth.
          </div>
          <div style="display:flex;justify-content:flex-end">
            <button class="btn-primary" onclick="window.savePatientSettings(this)">
              ${ic('check','icon-sm')} Save Changes
            </button>
          </div>
        </div>
      </div>

      </div>

      <!-- RIGHT column -->
      <div class="pt-sett-right" style="display:flex;flex-direction:column;gap:20px">

        <!-- Email Address Card — changing it is a separate, OTP-verified
             flow (openChangeEmailModal(), main.js) rather than a plain
             field in the profile form above, so a typo'd or hijacked
             change can't silently lock the patient out of their own
             account or notifications. -->
        <div class="card" style="padding:28px">
          <div style="display:flex;align-items:center;gap:8px;margin-bottom:4px">
            <div style="color:#E8760A">${ic('mail','icon-sm')}</div>
            <div style="font-size:1.05rem;font-weight:700;color:#1C1C1C">Email Address</div>
          </div>
          <div style="font-size:.82rem;color:#9CA3AF;margin-bottom:20px">Used for login and appointment notifications</div>
          <div class="form-group">
            <label class="form-label">Current Email</label>
            <input type="email" class="form-input" value="${patient?.email || user.email}" disabled
                   style="background:#F9FAFB;color:#6B7280;cursor:not-allowed">
          </div>
          <div style="display:flex;justify-content:flex-end;margin-top:14px">
            <button class="btn-secondary" onclick="window.openChangeEmailModal()">
              ${ic('mail','icon-sm')} Change Email
            </button>
          </div>
        </div>

        <!-- Security Card -->
        <div class="card" style="padding:28px">
          <div style="display:flex;align-items:center;gap:8px;margin-bottom:4px">
            <div style="color:#E8760A">${ic('shield','icon-sm')}</div>
            <div style="font-size:1.05rem;font-weight:700;color:#1C1C1C">Security</div>
          </div>
          <div style="font-size:.82rem;color:#9CA3AF;margin-bottom:20px">Change your account password</div>
          <div style="display:flex;flex-direction:column;gap:14px">
            <div class="form-group">
              <label class="form-label">Current Password</label>
              ${pwField('sett-curpw','Enter current password', `oninput="window.updateSettingsPwGate('sett')"`)}
            </div>
            <div class="form-group">
              <label class="form-label">New Password</label>
              ${pwField('sett-newpw','Minimum 8 characters', `oninput="window.updatePwChecklist('sett-newpw', this.value);window.updateSettingsPwGate('sett')"`)}
              ${window.pwChecklistHtml('sett-newpw')}
            </div>
            <div class="form-group">
              <label class="form-label">Confirm New Password</label>
              ${pwField('sett-confpw','Repeat new password', `oninput="window.updateSettingsPwGate('sett')"`)}
              <div id="sett-pw-err" class="field-error">Passwords do not match.</div>
            </div>
            <div style="display:flex;align-items:flex-start;gap:6px;font-size:.78rem;color:#9CA3AF">
              ${ic('info','icon-sm')} Can't reuse a previous password.
            </div>
            <div style="display:flex;justify-content:flex-end">
              <button id="sett-pw-btn" class="btn-primary" disabled style="opacity:.55;cursor:not-allowed"
                      onclick="window.validateSettingsPassword('sett-newpw','sett-confpw','sett-pw-err')">
                ${ic('lock','icon-sm')} Update Password
              </button>
            </div>
          </div>
        </div>

        <!-- QR Code mini card -->
        <div class="card" style="padding:24px;text-align:center">
          <div style="display:flex;align-items:center;gap:8px;margin-bottom:16px;justify-content:center">
            <div style="color:#E8760A">${ic('qr','icon-sm')}</div>
            <div style="font-size:1.05rem;font-weight:700;color:#1C1C1C">My QR Code</div>
          </div>
          <div id="sett-qr-container" style="display:inline-block;border-radius:8px;overflow:hidden;border:1px solid #E5E7EB">
            ${window.mockQRSvg(user.qrData, 120)}
          </div>
          <div style="font-size:.88rem;font-weight:700;color:#E8760A;margin-top:10px">${user.id}</div>
          <div style="display:flex;gap:8px;margin-top:12px;justify-content:center">
            <button class="btn-secondary" style="font-size:.78rem;padding:6px 14px"
                    onclick="window.downloadQR('sett-qr-container','${user.id}')">
              ${ic('download','icon-sm')} Download
            </button>
            <button class="btn-secondary" style="font-size:.78rem;padding:6px 14px"
                    onclick="window.printQR('sett-qr-container','${user.name}','${user.id}','${user.qrData}')">
              ${ic('printer','icon-sm')} Print
            </button>
          </div>
          <button class="btn-ghost" style="margin-top:12px;width:100%;justify-content:center;font-size:.78rem"
                  onclick="window.navigate('patient-qr')">
            ${ic('qr','icon-sm')} View Full QR Page
          </button>
        </div>

      </div>

      <!-- Danger Zone — self-service "Request Account Deletion". This only
           ever sends a request to clinic staff (see api/patients/request-
           deletion.php) — it never deletes anything itself. Staff review
           and act on it from Patient Records, same as the rest of this
           app's archive-before-permanent-delete flow. Its own direct grid
           item (pt-sett-danger, styled in this page's own <style> block
           above), last in the markup after both columns, so it's always
           the final section — full width under both columns on desktop,
           last stacked card on mobile. -->
      <div class="pt-sett-danger card" style="padding:24px;border:1px solid #FECACA">
        <div style="display:flex;align-items:center;gap:8px;margin-bottom:8px">
          <div style="color:#DC2626">${ic('user-x','icon-sm')}</div>
          <div style="font-size:1.05rem;font-weight:700;color:#1C1C1C">Delete My Account</div>
        </div>
        ${user.deletionRequestedAt ? `
        <div style="font-size:.82rem;color:#6B7280;line-height:1.6;margin-bottom:14px">
          You requested account deletion on <strong>${new Date(user.deletionRequestedAt.replace(' ','T')).toLocaleDateString('en-PH',{month:'long',day:'numeric',year:'numeric'})}</strong>.
          Clinic staff will review it${user.deletionRequestReason ? `, reason given: "${user.deletionRequestReason}"` : ''}.
          You can cancel this request any time before it's acted on.
        </div>
        <button class="btn-secondary" id="pt-cancel-del-btn" onclick="window.cancelDeletionRequest(this)">
          ${ic('x','icon-sm')} Cancel Request
        </button>` : `
        <div style="font-size:.82rem;color:#6B7280;line-height:1.6;margin-bottom:14px">
          Requesting deletion does not remove anything immediately, it notifies clinic staff, who will review it.
          Your account and records stay exactly as they are until staff acts on the request, and you can cancel it any time before then.
        </div>
        <button class="btn-secondary" style="color:#DC2626;border-color:#FECACA" onmouseover="this.style.background='#FEF2F2'" onmouseout="this.style.background=''" onclick="window.openRequestDeletionModal()">
          ${ic('user-x','icon-sm')} Request Account Deletion
        </button>`}
      </div>

    </div>
  </div>`
}

// ════════════════════════════════════════════════════════════════
//  ACTIVE SESSIONS — every role, reached via its own dedicated
//  "Security & Sign-in" sidebar entry (router.js SIDEBAR_CONFIG),
//  not a summary card buried inside the Settings/Profile page.
// ════════════════════════════════════════════════════════════════
function pageActiveSessions() {
  window.state.afterRender = () => window.loadActiveSessionsPage()

  return `
  <div class="page-header">
    <div class="page-header-left">
      <h1 class="page-title">Security &amp; Sign-in</h1>
      <p class="page-subtitle">Devices currently signed in to your account. Changing your password signs the others out automatically.</p>
    </div>
  </div>
  <div class="page-body">
    <div id="active-sessions-groups">
      <div class="card" style="padding:40px 24px;text-align:center;color:#9CA3AF;font-size:.85rem">Loading…</div>
    </div>
  </div>`
}

// ════════════════════════════════════════════════════════════════
//  COMING SOON — Generic placeholder for unbuilt pages
// ════════════════════════════════════════════════════════════════
function pageComingSoon() {
  const pageLabel = (() => {
    const labels = {
      'add-patient':           'Add Patient',
      'staff-settings':        'Settings',
      'doctor-appointments':   'My Appointments',
      'new-examination':       'New Examination',
      'exam-records':          'Examination Records',
      'doctor-schedule':       'My Schedule',
      'doctor-settings':       'Settings',
      'doctor-availability':   'Doctor Availability',
      'patient-prescriptions': 'Prescriptions',
      'patient-exam-history':  'Examination History',
      'patient-notifications': 'Notifications',
      'patient-settings':      'Settings'
    }
    return labels[window.state.page] || window.state.page || 'This Page'
  })()
  return `
  <div class="page-header">
    <div class="page-header-left">
      <h1 class="page-title">${pageLabel}</h1>
      <p class="page-subtitle">This section is under development.</p>
    </div>
  </div>
  <div class="page-body">
    <div style="display:flex;flex-direction:column;align-items:center;justify-content:center;min-height:320px;gap:20px;text-align:center">
      <div style="width:80px;height:80px;border-radius:20px;background:#FFF0DC;display:flex;align-items:center;justify-content:center">
        ${ic('clock','icon-lg')}
      </div>
      <div>
        <h2 style="font-size:1.25rem;font-weight:700;color:#1C1C1C;margin-bottom:6px">${pageLabel} — Coming Soon</h2>
        <p style="font-size:0.875rem;color:#9CA3AF;max-width:360px;line-height:1.6">
          This page is being built. Full functionality will be available in the next development phase.
        </p>
      </div>
      <span style="padding:6px 16px;border-radius:20px;background:#F3F4F6;color:#6B7280;font-size:.78rem;font-weight:600">In Development</span>
    </div>
  </div>`
}

// ════════════════════════════════════════════════════════════════
//  PATIENT — DOCTOR AVAILABILITY
// ════════════════════════════════════════════════════════════════
function pagePatientDoctorAvail() {
  const now        = new Date()
  const baseYear   = now.getFullYear()
  const baseMonth  = now.getMonth()
  const todayDate  = now.getDate()
  const allDocs    = typeof getAvailableDoctors === 'function' ? getAvailableDoctors() : []
  const firstDoc   = allDocs[0]

  // Furthest bookable date (Consultation Settings → Maximum Advance Booking).
  // Individual days beyond this still show as unbookable; browsing the
  // calendar itself (month/year navigation) is intentionally unrestricted.
  const maxBookDate = maxAdvanceDate(new Date(baseYear, baseMonth, todayDate))

  // Per-doctor calendar view state: { [docId]: { year, month } }
  window._patCalState = window._patCalState || {}

  window.state.afterRender = () => {
    // Reset all calendar states to current month on page load
    allDocs.forEach(d => { window._patCalState[d.id] = { year: baseYear, month: baseMonth } })
    if (firstDoc) window.switchPatDocDoctor(firstDoc.id)
  }

  // Build calendar cells for any given year/month
  function buildPatDocCalendar(doctor, viewYear, viewMonth) {
    const weekdays    = ['Sun','Mon','Tue','Wed','Thu','Fri','Sat']
    const firstDay    = new Date(viewYear, viewMonth, 1).getDay()
    const daysInMon   = new Date(viewYear, viewMonth + 1, 0).getDate()
    const isBaseMonth = viewYear === baseYear && viewMonth === baseMonth
    const selDate     = window._patCalState?.[doctor.id]?.selectedDate || ''
    const phHolidays  = typeof getPHHolidays === 'function' ? getPHHolidays(viewYear) : {}

    const apptsByDate = {}
    appointments.filter(a => a.doctorName === doctor.name).forEach(a => {
      if (!apptsByDate[a.date]) apptsByDate[a.date] = []
      apptsByDate[a.date].push({ time: a.time, patientName: a.patientName, status: a.status })
    })

    const blockedByDate = {}
    ;(doctor.blockedDates || []).forEach(b => { blockedByDate[b.date] = b.reason || 'Unavailable' })

    let cells = ''
    for (let i = 0; i < firstDay; i++) cells += `<div class="cal-day other-month"></div>`
    for (let d = 1; d <= daysInMon; d++) {
      const dow         = new Date(viewYear, viewMonth, d).getDay()
      const dayName     = weekdays[dow]
      const isToday     = isBaseMonth && d === todayDate
      const isPast      = new Date(viewYear, viewMonth, d) < new Date(baseYear, baseMonth, todayDate)
      const isFar       = new Date(viewYear, viewMonth, d) > maxBookDate
      const dateStr     = `${viewYear}-${String(viewMonth + 1).padStart(2,'0')}-${String(d).padStart(2,'0')}`
      const dayAppts    = apptsByDate[dateStr] || []
      const avail       = (doctor.availableDays || []).includes(dayName)
      const isSel       = dateStr === selDate
      const isHoliday   = !!phHolidays[dateStr]
      const holidayName = phHolidays[dateStr] || ''
      const blockedReason = blockedByDate[dateStr]
      const isBlocked   = !!blockedReason
      const daysOut     = Math.round((new Date(viewYear, viewMonth, d) - new Date(baseYear, baseMonth, todayDate)) / 86400000)
      const tooSoon     = daysOut >= 0 && daysOut < minAdvanceDays()

      let cls = 'cal-day'
      if (isSel)                          cls += ' cal-selected'
      else if (isToday)                   cls += ' today'
      else if (isBlocked && !isPast)      cls += ' date-blocked'
      else if (isHoliday && !isPast)      cls += ' cal-holiday'
      else if (isHoliday && isPast)       cls += ' blocked'
      // Past/out-of-range/too-soon dates fall here BEFORE the avail check
      // below — same priority order as the booking wizard's own calendar
      // (amcRender(), main.js): a date the doctor would normally work but
      // that's blocked for a timing reason still renders as plain muted
      // "Unavailable" gray, not the green "Available" look faded down with
      // opacity. That opacity approach used to sit here instead, and (like
      // the wizard's own past fix documented at its .amc-day.amc-past)
      // faded the day NUMBER along with the background, reading as barely
      // legible instead of a solid, clearly-muted color.
      else if (isPast || isFar || tooSoon) cls += ' blocked'
      else if (avail)                     cls += ' avail'
      else                                cls += ' blocked'

      const dotCls    = dayAppts.length ? ' has-appts' : ''
      // Too-soon dates stay dimmed but, unlike past/out-of-range dates,
      // remain clickable — the click surfaces a toast (synced to the live
      // minAdvanceTooltip()) so patients on touch devices, who never see the
      // hover title="" tooltip, still get told why the date isn't bookable.
      const tooSoonOnly = tooSoon && !isToday && !isPast && !isFar && !isHoliday && !isBlocked
      const dimStyle  = isPast ? 'pointer-events:none;'
                       : (tooSoon && !isToday) ? 'cursor:not-allowed;' : ''
      const styleAttr = dimStyle ? ` style="${dimStyle}"` : ''
      const titleAttr = tooSoon   ? `title="${minAdvanceTooltip()}"` :
                        isBlocked ? `title="Doctor unavailable: ${String(blockedReason).replace(/"/g,'&quot;')}"` :
                        isHoliday ? `title="Clinic closed: ${holidayName}"` :
                        isFar     ? `title="Beyond the maximum booking window."` : ''
      const hoverEvt  = !tooSoon && !isPast && !isFar && !isHoliday && dayAppts.length
        ? `onmouseenter="window.showCalTip(this,'${JSON.stringify(dayAppts).replace(/'/g,'&#39;').replace(/"/g,'&quot;')}')" onmouseleave="window.hideCalTip()"`
        : ''
      const clickEvt  = avail && !isBlocked && !tooSoon && !isPast && !isFar && !isHoliday
        ? `onclick="window.patCalSelectDate('${doctor.id}','${dateStr}')"`
        : tooSoonOnly
          ? `onclick="window.toast(window.minAdvanceTooltip(), 'error')"`
          : ''

      // Same inline-label convention as the booking wizard's own calendar
      // (amcRender(), main.js) — a hover title="" alone never reaches a
      // touch-screen patient, so every reason a date is blocked gets a
      // short label under the day number, not just a tooltip.
      const inner = isHoliday && !isPast
        ? `${d}<span class="cal-holiday-lbl">${holidayName}</span>`
        : (tooSoon && !isPast)
          ? `${d}<span class="cal-nodoc-lbl">Too Soon</span>`
          : (isFar && !isPast)
            ? `${d}<span class="cal-nodoc-lbl">Too Far</span>`
            : String(d)
      cells += `<div class="${cls}${dotCls}"${styleAttr} ${hoverEvt} ${clickEvt} ${titleAttr}>${inner}</div>`
    }
    return cells
  }

  // Re-render just the calendar grid + nav when navigating months (delta=0 = re-render in place)
  window.patCalNavMonth = function(docId, delta) {
    const doc = allDocs.find(d => d.id === docId)
    if (!doc) return
    if (!window._patCalState[docId]) window._patCalState[docId] = { year: baseYear, month: baseMonth }

    let { year, month, selectedDate } = window._patCalState[docId]
    const newMonth = month + delta
    let  newYear   = year
    let  clampedMonth = newMonth
    if (clampedMonth > 11) { newYear++; clampedMonth = 0 }
    if (clampedMonth < 0)  { newYear--; clampedMonth = 11 }
    // Same guard as the booking wizard's own calendar (amcGoMonth(),
    // main.js) — every month before the current one is entirely in the
    // past, nothing on it is ever bookable, so Prev stops right there
    // instead of paging indefinitely backward into dead months.
    if (newYear < baseYear || (newYear === baseYear && clampedMonth < baseMonth)) return
    year = newYear; month = clampedMonth

    // Preserve selectedDate when updating state
    window._patCalState[docId] = { year, month, selectedDate: selectedDate || '' }

    // Re-render nav header
    const navEl = document.getElementById(`pat-cal-nav-${docId}`)
    if (navEl) navEl.innerHTML = buildCalNav(doc, year, month)

    // Re-render grid
    const gridEl = document.getElementById(`pat-cal-grid-${docId}`)
    if (gridEl) gridEl.innerHTML = buildPatDocCalendar(doc, year, month)
  }

  // Select a date on the availability calendar — highlights cell, shows booking popover
  window.patCalSelectDate = function(docId, dateStr) {
    if (!window._patCalState[docId]) window._patCalState[docId] = { year: baseYear, month: baseMonth }
    window._patCalState[docId].selectedDate = dateStr

    // Re-render grid so selected cell highlights
    window.patCalNavMonth(docId, 0)

    // Show booking popover
    const doc      = allDocs.find(d => d.id === docId)
    if (!doc) return
    const dt       = new Date(dateStr + 'T00:00:00')
    const dayFull  = dt.toLocaleDateString('en-US', { weekday:'long', month:'long', day:'numeric', year:'numeric' })
    const gridEl   = document.getElementById('pat-cal-grid-' + docId)
    if (!gridEl) return

    // Remove any existing popover
    const existing = document.getElementById('pat-cal-popover-' + docId)
    if (existing) existing.remove()

    const pop = document.createElement('div')
    pop.id = 'pat-cal-popover-' + docId
    pop.className = 'pat-cal-selected-banner'
    // Close button and "Book This Date" both reuse the app's own existing
    // components (.modal-close, .btn-primary) instead of hand-rolled inline
    // styles + JS mouseover/mouseout — so the hover/active states and their
    // transitions come from the same CSS every other close button and
    // primary button in the app already uses, instead of duplicating (and
    // under-animating) them here.
    //
    // The header's own "Book Appointment" button hides while this is open —
    // once a date is selected, both buttons would do the exact same thing
    // (navigate to the wizard with this doctor + whatever date is currently
    // selected), so showing both at once just reads as two identical CTAs.
    // It reappears via the close button below, restoring the general
    // "book with this doctor, pick a date in the wizard" entry point.
    pop.innerHTML = `
      <button class="modal-close" onclick="document.getElementById('pat-cal-popover-${docId}').remove();window._patCalState['${docId}'].selectedDate='';window.patCalNavMonth('${docId}',0);document.getElementById('pat-doc-book-top-${docId}').style.display=''">&times;</button>
      <div style="font-size:.72rem;font-weight:600;color:#9CA3AF;text-transform:uppercase;letter-spacing:.05em;margin-bottom:6px">Selected Date</div>
      <div style="font-size:.88rem;font-weight:700;color:#1C1C1C;margin-bottom:2px;padding-right:26px">${dayFull}</div>
      <div style="font-size:.78rem;color:#6B7280;margin-bottom:14px">${doc.name} &nbsp;·&nbsp; 8:00 AM – 5:00 PM</div>
      <button class="btn-primary" style="width:100%;justify-content:center" onclick="window.patCalBookAppt('${docId}')">
        Book This Date →
      </button>`
    gridEl.insertAdjacentElement('afterend', pop)

    const topBtn = document.getElementById('pat-doc-book-top-' + docId)
    if (topBtn) topBtn.style.display = 'none'
  }

  // Navigate to the appointment wizard with doctor + optional date pre-filled
  window.patCalBookAppt = function(docId) {
    const doc   = allDocs.find(d => d.id === docId)
    if (!doc) return
    const state = window._patCalState?.[docId]
    window._patCalPrefill = {
      doctorId:   String(doc.id),
      doctorName: doc.name,
      doctorSpec: doc.specialization,
      doctorDays: doc.availableDays || [],
      date:       state?.selectedDate || ''
    }
    window.navigate('patient-request-appt')
  }

  const MONTH_NAMES = ['January','February','March','April','May','June','July','August','September','October','November','December']

  function buildCalNav(doctor, viewYear, viewMonth) {
    const label   = MONTH_NAMES[viewMonth] + ' ' + viewYear
    // Same dimming treatment as the booking wizard's own calendar
    // (amcRender(), main.js) — Prev fades once already on the current
    // month, since every earlier month is entirely in the past anyway.
    const isBase  = viewYear === baseYear && viewMonth === baseMonth
    return `
      <button class="btn-icon" style="opacity:${isBase ? '.3' : '1'};cursor:${isBase ? 'not-allowed' : 'pointer'}" onclick="window.patCalNavMonth('${doctor.id}',-1)">${ic('chevron-left','icon-sm')}</button>
      <span style="font-size:.85rem;font-weight:600;color:#1C1C1C;min-width:130px;text-align:center">${label}</span>
      <button class="btn-icon" onclick="window.patCalNavMonth('${doctor.id}',1)">${ic('chevron-right','icon-sm')}</button>`
  }

  function buildPatDocPanel(doctor) {
    const viewYear   = baseYear
    const viewMonth  = baseMonth
    const calCells   = buildPatDocCalendar(doctor, viewYear, viewMonth)

    // Compute next available date (skip today — must book 1 day in advance)
    const weekdayNames = ['Sun','Mon','Tue','Wed','Thu','Fri','Sat']
    let nextAvail = null
    for (let offset = 1; offset <= 90; offset++) {
      const d = new Date(baseYear, baseMonth, todayDate + offset)
      if ((doctor.availableDays || []).includes(weekdayNames[d.getDay()])) {
        nextAvail = d
        break
      }
    }
    const nextAvailStr = nextAvail
      ? nextAvail.toLocaleDateString('en-US', { month:'short', day:'numeric', year:'numeric' })
        + ' (' + weekdayNames[nextAvail.getDay()].slice(0,3) + ')'
      : '—'

    return `
    <div id="pat-doc-panel-${doctor.id}" class="pat-doc-panel" style="display:none">
      <div class="card">

        <!-- Doctor header row -->
        <div class="card-body" style="display:flex;align-items:center;gap:16px;padding-bottom:14px;flex-wrap:wrap">
          <div class="profile-avatar-lg" style="width:52px;height:52px;font-size:1.1rem;flex-shrink:0;${doctor.photoUrl?'padding:0;overflow:hidden;background:none;':''}">
            ${doctor.photoUrl
              ? `<img src="${doctor.photoUrl}" alt="${doctor.name}" style="width:100%;height:100%;object-fit:cover;object-position:top center;border-radius:50%;display:block" onerror="${avatarFallbackAttr(doctor.name)}">`
              : initials(doctor.name)}
          </div>
          <div style="flex:1;min-width:0">
            <div style="font-size:1rem;font-weight:700;color:#1C1C1C">${doctor.name}</div>
            <div style="font-size:.8rem;color:#6B7280;margin-top:2px">${doctor.specialization}</div>
          </div>
          <button id="pat-doc-book-top-${doctor.id}" class="btn-primary" style="flex-shrink:0;font-size:.82rem"
                  onclick="window.patCalBookAppt('${doctor.id}')">
            ${ic('plus','icon-sm')} Book Appointment
          </button>
        </div>

        <div style="height:1px;background:#F3F4F6;margin:0 20px"></div>

        <!-- Two-column: calendar + details -->
        <div class="card-body pat-doc-cal-body">

          <!-- Left: navigable calendar -->
          <div>
            <!-- Month nav -->
            <div id="pat-cal-nav-${doctor.id}" style="display:flex;align-items:center;justify-content:space-between;margin-bottom:10px">
              ${buildCalNav(doctor, viewYear, viewMonth)}
            </div>
            <div class="calendar-grid" style="margin-bottom:4px">
              ${['Sun','Mon','Tue','Wed','Thu','Fri','Sat'].map(d=>`<div class="cal-day-header">${d}</div>`).join('')}
            </div>
            <div id="pat-cal-grid-${doctor.id}" class="calendar-grid">${calCells}</div>
            <div style="display:flex;gap:14px;margin-top:12px;flex-wrap:wrap">
              <div style="display:flex;align-items:center;gap:6px;font-size:.72rem;color:#6B7280">
                <div style="width:10px;height:10px;background:#E8760A;border-radius:50%"></div>Today
              </div>
              <div style="display:flex;align-items:center;gap:6px;font-size:.72rem;color:#6B7280">
                <div style="width:10px;height:10px;background:#E8760A;border-radius:2px"></div>Selected
              </div>
              <div style="display:flex;align-items:center;gap:6px;font-size:.72rem;color:#6B7280">
                <div style="width:10px;height:10px;background:#ECFDF5;border:1.5px solid #10B981;border-radius:2px"></div>Available
              </div>
              <div style="display:flex;align-items:center;gap:6px;font-size:.72rem;color:#6B7280">
                <div style="width:10px;height:10px;background:#F3F4F6;border-radius:2px"></div>Unavailable
              </div>
              <div style="display:flex;align-items:center;gap:6px;font-size:.72rem;color:#6B7280">
                <div style="width:10px;height:10px;background:#FEE2E2;border:1px solid #FCA5A5;border-radius:2px"></div>Doctor Unavailable
              </div>
              <div style="display:flex;align-items:center;gap:6px;font-size:.72rem;color:#6B7280">
                <div style="width:10px;height:10px;background:#FFF1F2;border:1px solid #fda4af;border-radius:2px"></div>PH Holiday
              </div>
            </div>
          </div>

          <!-- Right: schedule details — doctor-specific only. Generic clinic-wide
               Consultation Hours + advance-booking notice live in the booking
               wizard instead (Request Appointment, Step 1), not duplicated here. -->
          <div style="display:flex;flex-direction:column;gap:12px">

            <div style="background:#F9FAFB;border-radius:10px;padding:14px 16px">
              <div style="font-size:.68rem;font-weight:600;color:#9CA3AF;text-transform:uppercase;letter-spacing:.05em;margin-bottom:10px">Available Days</div>
              <div style="display:flex;flex-wrap:wrap;gap:6px">
                ${(doctor.availableDays || []).map(d=>`<span style="background:#FFF0DC;color:#E8760A;font-size:.72rem;font-weight:600;padding:3px 10px;border-radius:20px">${d}</span>`).join('')}
              </div>
            </div>

            <div style="background:#F9FAFB;border-radius:10px;padding:14px 16px">
              <div style="font-size:.68rem;font-weight:600;color:#9CA3AF;text-transform:uppercase;letter-spacing:.05em;margin-bottom:8px">Next Available Slot</div>
              <div style="display:flex;align-items:center;gap:8px">
                <svg viewBox="0 0 24 24" fill="none" stroke="#16a34a" stroke-width="2" width="14" height="14" style="flex-shrink:0"><rect x="3" y="4" width="18" height="18" rx="2"/><line x1="16" y1="2" x2="16" y2="6"/><line x1="8" y1="2" x2="8" y2="6"/><line x1="3" y1="10" x2="21" y2="10"/></svg>
                <span style="font-size:.82rem;color:#166534;font-weight:600">${nextAvailStr}</span>
              </div>
              <div style="font-size:.75rem;color:#6B7280;margin-top:4px">Starting ${consultationSettings.morningStart}</div>
            </div>

          </div>
        </div>

      </div>
    </div>`
  }

  const allPanels = allDocs.map(d => buildPatDocPanel(d)).join('')

  return `
  <div class="page-header">
    <div class="page-header-left">
      <h1 class="page-title">Doctor Availability</h1>
      <p class="page-subtitle">View schedules and book an appointment with your preferred doctor</p>
    </div>
  </div>
  <div class="page-body">

    <!-- Doctor cards -->
    <div class="card" style="margin-bottom:20px">
      <div class="card-body" style="padding:16px">
        <div id="pat-doc-tabs" class="pat-doc-tabs-grid">
          ${allDocs.map(d => `
          <button class="doctor-sel-card pat-doc-tab" data-doc="${d.id}"
                  onclick="window.switchPatDocDoctor('${d.id}')">
            <div class="doc-card-avatar" ${d.photoUrl ? 'style="overflow:hidden;padding:0"' : ''}>
              ${d.photoUrl ? `<img src="${d.photoUrl}" alt="${d.name}" style="width:100%;height:100%;object-fit:cover;object-position:top;border-radius:50%;display:block" onerror="${avatarFallbackAttr(d.name)}">` : initials(d.name)}
            </div>
            <div>
              <div class="doc-card-name">${d.name.replace('Dr. ','')}</div>
              <div class="doc-card-spec">${d.specialization}</div>
              ${d.availableDays?.length ? dayPills(d.availableDays, 'sm') : ''}
            </div>
          </button>`).join('')}
        </div>
      </div>
    </div>

    <!-- Per-doctor panels -->
    <div id="pat-doc-panels">${allPanels}</div>

  </div>`
}

// ════════════════════════════════════════════════════════════════
//  QR SCANNER PAGE
// ════════════════════════════════════════════════════════════════
function pageScanQR() {
  return `
  <div class="page-header">
    <div class="page-header-left">
      <h1 class="page-title">QR Scanner</h1>
      <p class="page-subtitle">Scan a patient QR code for instant record lookup.</p>
    </div>
  </div>
  <div class="page-body">
    <div style="display:flex;flex-direction:column;align-items:center;gap:24px;max-width:480px;margin:0 auto">
      <div class="card" style="width:100%">
        <div class="card-header"><div class="card-title">Scan Patient QR Code</div></div>
        <div class="card-body" style="display:flex;flex-direction:column;align-items:center;gap:20px;padding:32px 24px">
          <div style="width:200px;height:200px;border:2px dashed #E5E7EB;border-radius:16px;display:flex;flex-direction:column;align-items:center;justify-content:center;gap:10px;background:#F9FAFB;color:#9CA3AF">
            ${ic('qr','icon-lg')}
            <span style="font-size:.78rem">Camera preview</span>
          </div>
          <p style="font-size:.82rem;color:#6B7280;text-align:center;line-height:1.6">
            Point the camera at a patient's QR code to automatically pull up their record.
          </p>
          <button class="btn-primary" onclick="window.openQRScanner && window.openQRScanner()">
            ${ic('qr','icon-sm')} Open Camera Scanner
          </button>
        </div>
      </div>
      <div class="card" style="width:100%">
        <div class="card-header"><div class="card-title">Manual Lookup</div></div>
        <div class="card-body" style="display:flex;flex-direction:column;gap:14px">
          <div class="search-bar">
            <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2" class="icon-sm" style="color:#9CA3AF;flex-shrink:0"><circle cx="11" cy="11" r="8"/><line x1="21" y1="21" x2="16.65" y2="16.65"/></svg>
            <input type="text" class="search-input" id="qr-manual-input" placeholder="Enter Patient ID (e.g. P001)">
          </div>
          <button class="btn-secondary" style="width:100%" onclick="
            const v = document.getElementById('qr-manual-input').value.trim();
            if(v) window.navigate('patient-view',{patientId:v,patientName:'Patient '+v});
            else window.toast('Enter a patient ID.','error')">Look Up Patient</button>
        </div>
      </div>
    </div>
  </div>`
}
