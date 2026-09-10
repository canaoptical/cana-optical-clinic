// ================================================================
//  CANAOPTICALCLINIC — router.js
//  Navigation, sidebar, topbar rendering, layout toggles
// ================================================================


// ── Shared State ────────────────────────────────────────────────
var state = {
  role: null, user: null,
  page: null, params: {},
  filter: 'all',
  selectedRole: 'admin',
  sidebarCollapsed: false,
  settingsSection: 'profile',
  afterRender: null
}

// ── Navigation history (for goBack / dynamic breadcrumbs) ──────────
// A plain back-stack of {page, params, filter} snapshots, pushed by every
// real navigate() call. goBack() pops it and re-navigates without pushing
// again — so "Back" always returns to wherever the user actually came
// from (the Waitlist button on Dashboard vs. on Appointments, a patient
// reached from Patient Records vs. from Exam Records, etc.) instead of a
// single hardcoded parent that's only right some of the time.
var _navHistory = []
var _suppressHistoryPush = false

// ── Sidebar nav config per role ─────────────────────────────────
const SIDEBAR_CONFIG = {
  admin: [
    { section: 'Overview' },
    { key: 'admin-dashboard',      label: 'Dashboard',        icon: 'home' },
    { section: 'Clinic' },
    { key: 'appointments',         label: 'Appointments',     icon: 'calendar', badgeKey: '_apptPendingCount',
      children: [
        { key: 'appointments', filter: 'all',         label: 'All Appointments' },
        { key: 'appointments', filter: 'today',       label: 'Today' },
        { key: 'appointments', filter: 'pending',     label: 'Pending',     badgeKey: '_apptPendingCount', color: '#E8891C' },
        { key: 'appointments', filter: 'approved',    label: 'Approved',    color: '#2E7D32' },
        { key: 'appointments', filter: 'cancelled',   label: 'Cancelled',   color: '#C62828' },
        { key: 'appointments', filter: 'disapproved', label: 'Disapproved', color: '#991B1B' },
        { key: 'appointments', filter: 'completed',   label: 'Completed',   color: '#616161' },
        { key: 'appointments', filter: 'no-show',     label: 'No-show',     color: '#6D28D9' }
      ]
    },
    { key: 'patient-list',         label: 'Patient Records',  icon: 'file-text' },
    { key: 'exam-records',         label: 'Examination Records', icon: 'eye' },
    { key: 'schedule',             label: 'Doctor Schedule',  icon: 'clock' },
    { key: 'admin-reports',        label: 'Reports',          icon: 'bar-chart' },
    { section: 'System' },
    { key: 'admin-users',          label: 'User Management',  icon: 'users',
      children: [
        { key: 'admin-users', filter: 'all',     label: 'All Users' },
        { key: 'admin-users', filter: 'admin',   label: 'Admin' },
        { key: 'admin-users', filter: 'staff',   label: 'Staff' },
        { key: 'admin-users', filter: 'doctor',  label: 'Doctor' },
        { key: 'admin-users', filter: 'patient', label: 'Patient' }
      ]
    },
    { key: 'activity-log',         label: 'Activity Log',     icon: 'activity' },
    { key: 'admin-settings',       label: 'Settings',         icon: 'settings',
      children: [
        { key: 'admin-settings', filter: 'profile',      label: 'My Profile' },
        { key: 'admin-settings', filter: 'clinic',       label: 'Clinic Information' },
        { key: 'admin-settings', filter: 'services',     label: 'Services' },
        { key: 'admin-settings', filter: 'consultation', label: 'Consultation Settings' },
        { key: 'admin-settings', filter: 'terms',        label: 'Terms & Policies' },
        { key: 'admin-settings', filter: 'archives',     label: 'Archives' },
        { key: 'active-sessions',                        label: 'Security & Sign-in' }
      ]
    }
  ],
  staff: [
    { section: 'Overview' },
    { key: 'staff-dashboard',      label: 'Dashboard',        icon: 'home' },
    { section: 'Clinic' },
    { key: 'appointments',         label: 'Appointments',     icon: 'calendar', badgeKey: '_apptPendingCount',
      children: [
        { key: 'appointments', filter: 'all',         label: 'All Appointments' },
        { key: 'appointments', filter: 'today',       label: 'Today' },
        { key: 'appointments', filter: 'pending',     label: 'Pending',     badgeKey: '_apptPendingCount', color: '#E8891C' },
        { key: 'appointments', filter: 'approved',    label: 'Approved',    color: '#2E7D32' },
        { key: 'appointments', filter: 'cancelled',   label: 'Cancelled',   color: '#C62828' },
        { key: 'appointments', filter: 'disapproved', label: 'Disapproved', color: '#991B1B' },
        { key: 'appointments', filter: 'completed',   label: 'Completed',   color: '#616161' },
        { key: 'appointments', filter: 'no-show',     label: 'No-show',     color: '#6D28D9' }
      ]
    },
    { key: 'patient-list',         label: 'Patient Records',  icon: 'file-text' },
    { key: 'exam-records',         label: 'Examination Records', icon: 'eye' },
    { key: 'schedule',             label: 'Doctor Schedule',  icon: 'clock' },
    { key: 'admin-reports',        label: 'Reports',          icon: 'bar-chart' },
    { section: 'Account' },
    { key: 'staff-settings',       label: 'Settings',         icon: 'settings',
      children: [
        { key: 'staff-settings',   label: 'My Profile' },
        { key: 'active-sessions',  label: 'Security & Sign-in' }
      ]
    }
  ],
  doctor: [
    { section: 'Overview' },
    { key: 'doctor-dashboard',     label: 'Dashboard',        icon: 'home' },
    { section: 'Clinic' },
    { key: 'doctor-appointments',  label: 'My Appointments',  icon: 'calendar', badgeKey: '_doctorApptAlertCount',
      children: [
        { key: 'doctor-appointments', filter: 'all',       label: 'All Appointments' },
        { key: 'doctor-appointments', filter: 'today',     label: 'Today',    badgeKey: '_doctorTodayCount' },
        { key: 'doctor-appointments', filter: 'upcoming',  label: 'Upcoming', badgeKey: '_doctorUpcomingCount' },
        { key: 'doctor-appointments', filter: 'completed', label: 'Completed', color: '#616161' }
      ]
    },
    { key: 'examination',          label: 'Optical Examination', icon: 'eye',
      children: [
        { key: 'new-examination',  label: 'New Examination' },
        { key: 'exam-records',     label: 'Examination Records' }
      ]
    },
    { key: 'patient-list',         label: 'Patient Records',  icon: 'file-text' },
    { key: 'doctor-schedule',      label: 'My Schedule',      icon: 'clock' },
    { section: 'Account' },
    { key: 'doctor-settings',      label: 'Settings',         icon: 'settings',
      children: [
        { key: 'doctor-settings',  label: 'My Profile' },
        { key: 'active-sessions',  label: 'Security & Sign-in' }
      ]
    }
  ],
  patient: [
    { section: 'Overview' },
    { key: 'patient-dashboard',    label: 'Dashboard',        icon: 'home' },
    { section: 'Services' },
    { key: 'patient-appts',        label: 'My Appointments',  icon: 'calendar',
      children: [
        { key: 'patient-appts', filter: 'all',        label: 'All Appointments' },
        { key: 'patient-appts', filter: 'today',      label: 'Today' },
        { key: 'patient-appts', filter: 'approved',    label: 'Approved',    color: '#2E7D32' },
        { key: 'patient-appts', filter: 'pending',     label: 'Pending',     color: '#E8891C' },
        { key: 'patient-appts', filter: 'completed',   label: 'Completed',   color: '#616161' },
        { key: 'patient-appts', filter: 'cancelled',    label: 'Cancelled',   color: '#C62828' },
        { key: 'patient-appts', filter: 'disapproved', label: 'Disapproved', color: '#991B1B' },
        { key: 'patient-appts', filter: 'no-show',     label: 'No-show',     color: '#6D28D9' },
      ]
    },
    { key: 'doctor-availability',  label: 'Doctor Availability', icon: 'user' },
    { key: 'patient-records',      label: 'My Records',       icon: 'file-text',
      children: [
        { key: 'patient-prescriptions',  label: 'Prescriptions' },
        { key: 'patient-exam-history',   label: 'Examination History' },
        { key: 'patient-consultations',  label: 'Consultations' }
      ]
    },
    { section: 'Account' },
    { key: 'patient-settings',     label: 'Settings',         icon: 'settings',
      children: [
        { key: 'patient-settings', label: 'My Profile' },
        { key: 'active-sessions',  label: 'Security & Sign-in' }
      ]
    }
  ]
}

// Role → dashboard page key. Used for both the initial post-login
// navigation (bootShell) and the topbar breadcrumb's role-segment link.
const ROLE_DASHBOARD = {
  admin:   'admin-dashboard',
  staff:   'staff-dashboard',
  doctor:  'doctor-dashboard',
  patient: 'patient-dashboard'
}

// True if `page` is one of the role's own sidebar destinations (top-level
// or a filtered child) — used to tell "primary section" navigation apart
// from a "detail" page (Patient Profile, the exam wizard, Waitlist, QR
// Scanner, …) that's only ever reached via a button, for the topbar
// breadcrumb's dynamic back-link (see renderTopbar()).
function _isSidebarPage(role, page) {
  const config = SIDEBAR_CONFIG[role] || []
  return config.some(item => item.key === page || (item.children && item.children.some(c => c.key === page)))
}

// Breadcrumb labels
const PAGE_LABELS = {
  'admin-dashboard':       'Dashboard',
  'admin-users':           'User Management',
  'appointments':          'Appointments',
  'create-appointment':    'New Appointment',
  'waitlist':              'Waitlist',
  'patient-list':          'Patient Records',
  'add-patient':           'Add Patient',
  'patient-view':          'Patient Profile',
  'contact-messages':      'Contact Messages',
  'qr-scanner':            'QR Scanner',
  'schedule':              'Doctor Schedule',
  'admin-reports':         'Reports',
  'admin-settings':        'Settings',
  'settings-clinic':       'Clinic Information',
  'settings-services':     'Services',
  'settings-consultation': 'Consultation Settings',
  'settings-archives':     'Archives',
  'activity-log':          'Activity Log',
  'staff-dashboard':       'Dashboard',
  'staff-settings':        'Settings',
  'doctor-dashboard':      'Dashboard',
  'doctor-appointments':   'My Appointments',
  'doctor-schedule':       'My Schedule',
  'doctor-settings':       'Settings',
  'examination':           'Optical Examination',
  'new-examination':       'New Examination',
  'edit-examination':      'Edit Examination',
  'exam-records':          'Examination Records',
  'doctor-schedule':       'My Schedule',
  'doctor-settings':       'Settings',
  'patient-dashboard':     'Dashboard',
  'patient-appts':         'My Appointments',
  'patient-request-appt': 'Request Appointment',
  'patient-records':       'My Records',
  'patient-qr':            'My QR Code',
  'doctor-availability':   'Doctor Availability',
  'patient-prescriptions': 'Prescriptions',
  'patient-exam-history':  'Examination History',
  'patient-consultations': 'Consultations',
  'patient-notifications': 'Notifications',
  'notifications':         'Notifications',
  'patient-settings':      'Settings',
  'active-sessions':       'Security & Sign-in'
}

// ── Navigate ────────────────────────────────────────────────────
function navigate(page, params = {}) {
  // Handle sidebar actions that open modals/overlays
  if (page === 'add-user')    { window.openAddUserModal();    return }
  if (page === 'add-patient') { window.navigate('patient-list'); setTimeout(() => window.openAddPatientModal(), 100); return }

  // Default admin-settings to profile section
  if (page === 'admin-settings' && params.filter === undefined) params.filter = 'profile'

  // Push the page we're LEAVING onto the back-stack, before switching to
  // the new one — skipped for goBack()'s own re-navigation (that's
  // consuming a history entry, not creating a new one) and for a no-op
  // "navigate to the same place" call.
  if (!_suppressHistoryPush && state.page &&
      (state.page !== page || JSON.stringify(state.params) !== JSON.stringify(params))) {
    _navHistory.push({ page: state.page, params: state.params, filter: state.filter })
    if (_navHistory.length > 50) _navHistory.shift()
  }

  if (params.filter !== undefined) state.filter = params.filter
  state.page   = page
  state.params = params
  if (window.closeModal) window.closeModal()
  closeMobileSidebar()
  if (window.stopQRCamera) window.stopQRCamera()
  renderPage()

  // ── Per-page sync-on-navigate ────────────────────────────────────
  // Fire the relevant sync immediately so the page opens with fresh data
  // instead of waiting for the next 30-second poll tick.

  // Notifications page — all roles
  if (page === 'notifications' || page === 'patient-notifications') {
    if (window._syncNotifications) window._syncNotifications()
  }

  // Appointment pages — all roles
  const _apptPages = new Set(['appointments','doctor-appointments','patient-appts'])
  if (_apptPages.has(page)) {
    if (window._syncAppointments) window._syncAppointments(true)
  }

  // Dashboard pages — refresh the most relevant data
  if (page === 'admin-dashboard' || page === 'staff-dashboard') {
    if (window._syncAppointments) window._syncAppointments()
    if (window._syncPatients)     window._syncPatients()
  }
  if (page === 'doctor-dashboard') {
    if (window._syncAppointments) window._syncAppointments(true)
  }
  if (page === 'patient-dashboard') {
    if (window._syncMyRecords) window._syncMyRecords()
  }

  // Patient-facing record pages
  const _patientDataPages = new Set(['patient-exam-history','patient-prescriptions','patient-consultations'])
  if (_patientDataPages.has(page)) {
    if (window._syncMyRecords) window._syncMyRecords()
  }

  // Staff/admin patient data pages
  if (page === 'patient-list' || page === 'new-examination' || page === 'edit-examination') {
    if (window._syncPatients) window._syncPatients()
  }

  // Contact messages (admin/staff)
  if (page === 'contact-messages') {
    if (window._syncContactMessages) window._syncContactMessages()
  }

  // Waitlist (admin/staff) — was previously boot+poll only, could show
  // up to ~30s-stale data on first visit; now syncs immediately on nav
  // just like every other data-driven page.
  if (page === 'waitlist') {
    if (window._syncWaitlist) window._syncWaitlist()
  }

  // Activity log (admin)
  if (page === 'activity-log') {
    if (window._syncActivityLog) window._syncActivityLog()
  }

  // Exam records (doctor/admin/staff — part of patients data)
  if (page === 'exam-records') {
    if (window._syncPatients) window._syncPatients()
  }

  // Archives
  if (page === 'admin-settings' && params.filter === 'archives') {
    if (window._syncArchives) window._syncArchives()
  }

  // Reset the poll timer so the next tick is always 30s from this navigation,
  // not from wherever the interval happened to be in its current cycle.
  if (window._resetSystemPoll) window._resetSystemPoll()
}
window.navigate = navigate

// ── Go Back ─────────────────────────────────────────────────────
// Pops the back-stack and re-navigates there. Every "‹ Back" button and
// the breadcrumb's clickable segment call this instead of a hardcoded
// destination, so they always return to wherever the user actually came
// from. fallbackPage/fallbackParams are only used when there's no history
// to pop (e.g. the page was opened directly via a deep link/refresh).
function goBack(fallbackPage, fallbackParams) {
  if (_navHistory.length) {
    const prev = _navHistory.pop()
    state.filter = prev.filter
    _suppressHistoryPush = true
    navigate(prev.page, prev.params || {})
    _suppressHistoryPush = false
  } else if (fallbackPage) {
    navigate(fallbackPage, fallbackParams || {})
  }
}
window.goBack = goBack

// ── renderPage ──────────────────────────────────────────────────
// opts.silent: skip the fade-up entrance animation — used by background
// polling so a data refresh the user didn't ask for doesn't visibly blink
// the whole page. Real navigation (the default) keeps the animation.
function renderPage(opts) {
  const silent = !!(opts && opts.silent)
  const { page, role } = state
  const Pages = window._pages

  const map = {
    'admin-dashboard':       Pages.pageAdminDashboard,
    'admin-users':           Pages.pageAdminUsers,
    'appointments':          Pages.pageAppointments,
    'create-appointment':    Pages.pageCreateAppointment,
    'waitlist':              Pages.pageWaitlist,
    'patient-list':          Pages.pagePatientList,
    'add-patient':           Pages.pageComingSoon,
    'patient-view':          Pages.pagePatientView,
    'contact-messages':      Pages.pageContactMessages,
    'qr-scanner':            Pages.pageQRScanner,
    'schedule':              Pages.pageSchedule,
    'admin-reports':         Pages.pageAdminReports,
    'admin-settings':        Pages.pageAdminSettings,
    'activity-log':          Pages.pageActivityLog,
    'staff-dashboard':       Pages.pageStaffDashboard,
    'staff-settings':        Pages.pageStaffSettings,
    'doctor-dashboard':      Pages.pageDoctorDashboard,
    'doctor-appointments':   Pages.pageDoctorAppointments,
    'examination':           Pages.pageExamination,
    'new-examination':       Pages.pageNewExamination,
    'edit-examination':      Pages.pageNewExamination,
    'exam-records':          Pages.pageExamRecords,
    'doctor-schedule':       Pages.pageDoctorSchedule,
    'doctor-settings':       Pages.pageDoctorSettings,
    'patient-dashboard':     Pages.pagePatientDashboard,
    'patient-appts':         Pages.pagePatientAppts,
    'patient-request-appt': Pages.pagePatientAppts,
    'patient-qr':            Pages.pagePatientQR,
    'doctor-availability':   Pages.pagePatientDoctorAvail,
    'patient-prescriptions': Pages.pagePatientPrescriptions,
    'patient-exam-history':  Pages.pagePatientExamHistory,
    'patient-consultations': Pages.pagePatientConsultations,
    'patient-notifications': Pages.pagePatientNotifications,
    'notifications':         Pages.pagePatientNotifications,
    'patient-settings':      Pages.pagePatientSettings,
    'active-sessions':       Pages.pageActiveSessions,
    'scan-qr':               Pages.pageScanQR
  }

  const fn = map[page]
  const el = document.getElementById('main-content')
  if (!fn || !el) return

  // Silent refresh: preserve scroll position and skip the entrance
  // animation entirely, since this is a background data update the user
  // didn't initiate, not a page change.
  const scrollTop = silent ? el.scrollTop : 0
  el.innerHTML = fn()
  el.className = silent ? '' : 'fade-up'
  if (silent) el.scrollTop = scrollTop

  wrapTableScroll()
  renderTopbar()
  highlightSidebarActive()

  // Charts, QR etc. need two rAF ticks so container dimensions are settled
  const cb = state.afterRender
  state.afterRender = null
  if (cb) requestAnimationFrame(() => requestAnimationFrame(cb))
}

// ── Shell bootstrap (called once after login) ───────────────────
function bootShell(role, user) {
  renderSidebar()
  renderTopbar()
  applySidebarBucket(true)

  // The public site's "Book Now"/"Book Appointment" buttons set this flag
  // (app.html's inline bootstrap script, from a #book URL hash) so a
  // patient lands straight on the booking wizard instead of their generic
  // dashboard — landing on the dashboard after clicking a button that says
  // "book" defeats the point of it. Only ever meaningful for patients
  // (the only role those buttons are shown to — see public-nav.js); any
  // other role just falls through to its normal default page.
  const openBooking = window._openBooking
  window._openBooking = false

  state.filter = 'all'
  if (openBooking && role === 'patient') {
    navigate('patient-request-appt')
  } else {
    navigate(ROLE_DASHBOARD[role] || 'admin-dashboard')
  }
}

// ── Sidebar ─────────────────────────────────────────────────────
function renderSidebar() {
  const { role, user } = state
  const config = SIDEBAR_CONFIG[role] || []

  let nav = ''
  config.forEach(item => {
    // Section divider/label
    if (item.section) {
      nav += `<div class="nav-section-label"><span>${item.section}</span></div>`
      return
    }

    const hasChildren = item.children && item.children.length > 0
    // For action-only items (like scan-qr), clicking the item directly fires action
    const isActive    = state.page === item.key
    const clickAction = item.action
      ? `window.${item.action}()`
      : `window.navigate('${item.key}')`

    if (hasChildren) {
      // 'edit-examination' isn't its own sidebar link (only reached contextually
      // from a patient's exam record), but it should still highlight the
      // "Optical Examination" parent, same as its 'new-examination' sibling.
      const isChildActive = item.children.some(c => (c.key === state.page || (c.key === 'new-examination' && state.page === 'edit-examination')) && (c.filter === undefined || state.filter === c.filter))
      const isParentSelf  = state.page === item.key && !isChildActive
      const isOpen        = isChildActive || isParentSelf
      const pBadgeCount = item.badgeKey ? (window[item.badgeKey] || 0) : 0
      const pBadgeHtml  = pBadgeCount > 0 ? `<span class="nav-badge">${pBadgeCount > 99 ? '99+' : pBadgeCount}</span>` : ''
      nav += `
        <div>
          <div class="nav-item${isOpen ? ' nav-parent-open' : ''}${isParentSelf ? ' active' : ''}" onclick="window.toggleSidebarParent('${item.key}')">
            ${window.icon(item.icon, 'icon')}
            <span class="nav-item-label">${item.label}</span>
            ${pBadgeHtml}
            <svg class="nav-arrow${isOpen ? ' open' : ''}" id="arrow-dd-${item.key}"
                 viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2">
              <polyline points="6 9 12 15 18 9"/>
            </svg>
          </div>
          <div class="nav-submenu${isOpen ? ' open' : ''}" id="dd-${item.key}">
            ${item.children.map(c => {
              const cActive = state.page === c.key && (c.filter === undefined || state.filter === c.filter)
              // Modal-only actions: don't navigate, just open the modal
              const cClick  = c.action
                ? `window.${c.action}()`
                : `window.navigate('${c.key}'${c.filter ? `, {filter:'${c.filter}'}` : ''})`
              const cBadgeCount = c.badgeKey ? (window[c.badgeKey] || 0) : 0
              const cBadgeHtml  = cBadgeCount > 0 ? `<span class="nav-badge">${cBadgeCount > 99 ? '99+' : cBadgeCount}</span>` : ''
              // A per-status color (appointment filters like Pending/Approved/
              // Cancelled/etc.) overrides the dot's default "match the text
              // color" behavior — it stays that status's color even when this
              // item is active/hovered, so it still works as an at-a-glance
              // legend right when the user is looking at that filter, not just
              // when it's sitting unselected in the list.
              const dotStyle = c.color ? ` style="background:${c.color}"` : ''
              return `
              <div class="nav-sub-item${cActive ? ' active' : ''}" onclick="${cClick}">
                <span class="nav-sub-dot"${dotStyle}></span>
                ${c.label}${cBadgeHtml}
              </div>`
            }).join('')}
          </div>
        </div>`
    } else {
      const badgeCount = item.badgeKey ? (window[item.badgeKey] || 0) : 0
      const badgeHtml  = badgeCount > 0 ? `<span class="nav-badge">${badgeCount > 99 ? '99+' : badgeCount}</span>` : ''
      nav += `
        <div class="nav-item${isActive ? ' active' : ''}" onclick="${clickAction}">
          ${window.icon(item.icon, 'icon')}
          <span class="nav-item-label">${item.label}</span>
          ${badgeHtml}
        </div>`
    }
  })

  const isAdmin = role === 'admin'
  const initials = user ? (user.firstName[0] + user.lastName[0]).toUpperCase() : '??'
  const displayName = user?.name || 'User'
  const roleBadgeMap = { admin: 'Administrator', staff: 'Staff', doctor: 'Doctor', patient: 'Patient' }
  const roleBadge = roleBadgeMap[role] || role
  // onerror here also clears the dead photoUrl out of state/the server
  // (window.selfAvatarFallbackAttr, main.js) — without that, a stored
  // photo whose file no longer exists (e.g. wiped by ephemeral hosting
  // storage) would fail to load and fall back to initials again on every
  // single navigation, since renderSidebar() rebuilds this on every click
  // and nothing before this line stopped it from retrying the same dead
  // URL forever.
  const avatarHtml = user?.photoUrl
    ? `<div class="sidebar-avatar sidebar-profile-avatar" style="overflow:hidden;padding:0;background:transparent"><img src="${user.photoUrl}" alt="Photo" style="width:100%;height:100%;object-fit:cover;border-radius:50%;display:block" onerror="${window.selfAvatarFallbackAttr ? window.selfAvatarFallbackAttr(displayName) : ''}"></div>`
    : `<div class="sidebar-avatar sidebar-profile-avatar">${initials}</div>`

  document.getElementById('sidebar-nav').innerHTML = nav
  document.getElementById('sidebar-profile').innerHTML = `
    <div class="sidebar-profile-wrap">
      ${avatarHtml}
      <div class="sidebar-profile-info">
        <div class="sidebar-profile-name">${displayName}</div>
        <div class="sidebar-profile-role">${roleBadge}</div>
      </div>
    </div>`
  document.getElementById('sidebar-foot').innerHTML = `
    <a class="sidebar-logout sidebar-view-link" href="index.html" style="text-decoration:none">
      ${window.icon('external-link', 'icon')}
      <span>View Website</span>
    </a>
    <div class="sidebar-logout" onclick="window.logout()">
      ${window.icon('log-out', 'icon')}
      <span>Sign Out</span>
    </div>`
}

// Re-renders just to refresh badge counts (e.g. unread contact messages)
// after a background sync — the sidebar is cheap to rebuild from state.
function updateSidebarBadges() {
  if (document.getElementById('sidebar-nav')) renderSidebar()
}
window._updateSidebarBadges = updateSidebarBadges

// ── Highlight active sidebar item ───────────────────────────────
function highlightSidebarActive() {
  document.querySelectorAll('.nav-item').forEach(el => el.classList.remove('active'))
  document.querySelectorAll('.nav-sub-item').forEach(el => el.classList.remove('active'))
  // re-render sidebar keeps highlights; easier to just re-render
  renderSidebar()
}

// ── Topbar ──────────────────────────────────────────────────────
function renderTopbar() {
  const { role, page, params } = state
  const label = PAGE_LABELS[page] || page || 'Dashboard'

  // Find sub-label (+ the filter its parent nav item should reset to when the
  // middle crumb segment is clicked) from sidebar config when a filter is active
  const config = SIDEBAR_CONFIG[role] || []
  let subLabel = null
  let midFilter
  if (state.filter && state.filter !== 'all') {
    // Check top-level items with a filter first (e.g. Request Appointment)
    const topItem = config.find(item => item.key === page && !item.children && item.filter === state.filter)
    if (topItem) {
      subLabel = topItem.label
      midFilter = topItem.filter
    } else {
      const parentItem = config.find(item => item.key === page && item.children)
      if (parentItem) {
        const child = parentItem.children.find(c => c.filter === state.filter)
        if (child) {
          subLabel = child.label
          // Reset to the section's "all" landing view if it has one; otherwise
          // navigate plain and let the page's own default-filter logic apply
          // (e.g. admin-settings defaults to 'profile' — see navigate()).
          if (parentItem.children.some(c => c.filter === 'all')) midFilter = 'all'
        }
      }
    }
  }

  const chevron = `<svg viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2" class="icon-sm" style="color:#D1D5DB"><polyline points="9 18 15 12 9 6"/></svg>`

  const crumbEl = document.getElementById('topbar-crumb')
  const rightEl = document.getElementById('topbar-right')

  if (crumbEl) {
    // No role segment here — it's already shown in the sidebar profile
    // block, and the sidebar's own Dashboard link already gives one-click
    // access to it from anywhere, so a role crumb on every page was purely
    // redundant. The crumb now starts directly at the current section.
    if (subLabel) {
      const midOnclick = midFilter !== undefined
        ? `window.navigate('${page}',{filter:'${midFilter}'})`
        : `window.navigate('${page}')`
      crumbEl.innerHTML = `<span class="topbar-crumb-link" onclick="${midOnclick}">${label}</span>${chevron}<strong>${subLabel}</strong>`
    } else {
      // 'new-examination' is both a sidebar link (the blank "pick a patient"
      // landing screen) AND the page a doctor lands on mid-wizard for a
      // specific patient (e.g. "Start Examination" from Dashboard) — same
      // page key, very different context. Only the former is really a
      // sidebar "home base"; once a patient is loaded it's a detail page
      // like any other and should get the same back-crumb treatment.
      const isBlankSidebarLanding = !(page === 'new-examination' && params.patientId)
      const patientName = params.patientName ||
        (params.patientId && window.patients ? window.patients.find(p => p.id === params.patientId)?.name : null)
      const currentLabel = `${label}${patientName ? ` — ${patientName}` : ''}`
      // Pages not reachable from the sidebar itself (Patient Profile, the
      // exam wizard, Waitlist, QR Scanner, etc.) are always drilled into
      // from some button — show a clickable crumb back to wherever that
      // actually was (from the back-stack), not a fixed guessed parent.
      // Sidebar-navigable pages skip this: hopping between top-level
      // sections isn't a "drill up" and showing "last page > this page"
      // there would just be noise.
      const prevEntry = _navHistory.length ? _navHistory[_navHistory.length - 1] : null
      if ((!_isSidebarPage(role, page) || !isBlankSidebarLanding) && prevEntry && (prevEntry.page !== page)) {
        const prevLabel = PAGE_LABELS[prevEntry.page] || prevEntry.page
        crumbEl.innerHTML = `<span class="topbar-crumb-link" onclick="window.goBack()">${prevLabel}</span>${chevron}<strong>${currentLabel}</strong>`
      } else {
        crumbEl.innerHTML = `<strong>${currentLabel}</strong>`
      }
    }
  }

  if (rightEl) {
    const notifRole = state.role
    const unread    = window._unreadCount || 0
    const badgeVis  = unread > 0 ? '' : 'display:none'
    const badgeTxt  = unread > 9 ? '9+' : String(unread)

    // Contact Messages: admin/staff only, direct link (no dropdown) —
    // relocated here from the sidebar to sit beside the notification bell.
    const contactUnread = window._contactUnreadCount || 0
    const contactBadgeVis = contactUnread > 0 ? '' : 'display:none'
    const contactBadgeTxt = contactUnread > 9 ? '9+' : String(contactUnread)
    const contactHtml = (role === 'admin' || role === 'staff') ? `
      <div class="topbar-notify-wrap" id="topbar-contact-wrap">
        <div class="topbar-notify" id="topbar-contact-btn" onclick="window.navigate('contact-messages')" title="Contact Messages">
          ${window.icon('mail', 'icon')}
          <span class="notify-badge" id="topbar-contact-badge" style="${contactBadgeVis}">${contactBadgeTxt}</span>
        </div>
      </div>` : ''

    rightEl.innerHTML = `
      ${contactHtml}

      <!-- Notification Bell -->
      <div class="topbar-notify-wrap" id="topbar-notify-wrap">
        <div class="topbar-notify" id="topbar-bell-btn" onclick="window.toggleNotifyDropdown(event)" title="Notifications">
          ${window.icon('bell', 'icon')}
          <span class="notify-badge" id="topbar-bell-badge" style="${badgeVis}">${badgeTxt}</span>
        </div>
        <div class="notify-dropdown" id="notify-dropdown">
          <div class="notify-dropdown-head">
            <span class="notify-dropdown-title">Notifications</span>
            <button class="notify-mark-read" onclick="window.markAllRead()">Mark all as read</button>
          </div>
          <div class="notify-list" id="notify-list-inner">
            ${_buildNotifDropdownHtml()}
          </div>
          <div class="notify-dropdown-foot">
            <a href="#" onclick="event.preventDefault();window.navigate('${notifRole === 'patient' ? 'patient-notifications' : 'notifications'}');window.closeAllDropdowns()">View all notifications</a>
          </div>
        </div>
      </div>

      <!-- Clinic identity -->
      <div class="topbar-clinic">
        <img src="${window._clinicLogoUrl || 'assets/images/logo/clinic-logo.png'}" alt="Clinic Logo" class="topbar-clinic-img">
        <div class="topbar-clinic-text">
          <span class="topbar-clinic-name">${window._clinicName || clinicInfo.name || 'Cana Optical Clinic'}</span>
          <span class="topbar-clinic-sub">${(function(){ const a = window._clinicAddress || clinicInfo.address || ''; const parts = a.split(',').map(s=>s.trim()).filter(Boolean); return parts.length >= 2 ? parts.slice(-2).join(', ') : (a || 'Carmona, Cavite') }())}</span>
        </div>
      </div>`
  }
}

function _notifTimeAgo(dateStr) {
  const d = new Date(dateStr)
  if (isNaN(d)) return dateStr
  const diff = (Date.now() - d.getTime()) / 1000
  if (diff < 60)     return 'Just now'
  if (diff < 3600)   return `${Math.floor(diff / 60)}m ago`
  if (diff < 86400)  return `${Math.floor(diff / 3600)}h ago`
  if (diff < 172800) return 'Yesterday'
  if (diff < 604800) return `${Math.floor(diff / 86400)} days ago`
  return d.toLocaleDateString('en-PH', { month: 'short', day: 'numeric', year: 'numeric' })
}
window._notifTimeAgo = _notifTimeAgo

const _NOTIF_ICON  = { approved:'check-circle', cancelled:'x-circle', disapproved:'x-circle', rescheduled:'calendar', new_appointment:'calendar', reschedule_request:'alert-circle', no_show:'alert-circle', reminder:'clock', waitlist_offer:'alert-circle', waitlist_removed:'x-circle', waitlist_join:'clock', waitlist_left:'x-circle', welcome:'home', info:'info', contact_message:'mail', follow_up_needed:'calendar', new_login:'monitor', appointment_confirmed:'check-circle', deletion_request:'user-x', deletion_reviewed:'check-circle' }
const _NOTIF_COLOR = { approved:'green', cancelled:'red', disapproved:'red', rescheduled:'blue', new_appointment:'orange', reschedule_request:'orange', no_show:'red', reminder:'orange', waitlist_offer:'orange', waitlist_removed:'red', waitlist_join:'orange', waitlist_left:'gray', welcome:'orange', info:'gray', contact_message:'orange', follow_up_needed:'orange', new_login:'orange', appointment_confirmed:'green', deletion_request:'red', deletion_reviewed:'green' }
// Same 'welcome' precedent extended to catch notifications created before
// 'deletion_reviewed' existed as its own type (they're stuck as plain
// 'info' in the DB forever) — the only way those rows ever pick up the
// right icon here instead of the generic gray info dot.
const _resolveNotifType = n => (n.type === 'info' && n.title?.toLowerCase().startsWith('welcome')) ? 'welcome'
  : (n.type === 'info' && n.title === 'Deletion Request Reviewed') ? 'deletion_reviewed'
  : n.type

// Returns { page, params } so callers always pass an explicit filter,
// preventing stale state.filter from a previous navigation bleeding in.
function _notifNavTarget(type, role) {
  const dashPage = role === 'admin'  ? 'admin-dashboard'
                 : role === 'staff'  ? 'staff-dashboard'
                 : role === 'doctor' ? 'doctor-dashboard'
                 :                     'patient-dashboard'

  // Route appointment notifications to the correct filter per role and type
  const apptTypes = new Set(['approved','cancelled','disapproved','rescheduled','new_appointment','reschedule_request','no_show','appointment_confirmed'])
  if (apptTypes.has(type)) {
    // Patients: go to the filter that matches the status they were notified about
    if (role === 'patient') {
      const patientFilter = {
        approved:              'approved',
        cancelled:             'cancelled',
        disapproved:           'disapproved',
        rescheduled:           'approved',   // rescheduled stays approved
        new_appointment:       'pending',
        reschedule_request:    'all',
        no_show:               'no-show',
        appointment_confirmed: 'approved',   // confirming attendance doesn't change status
      }[type] || 'all'
      return { page: 'patient-appts', params: { filter: patientFilter } }
    }
    // Doctors: filter by the relevant status
    if (role === 'doctor') {
      const doctorFilter = {
        approved:              'approved',
        cancelled:             'cancelled',
        disapproved:           'disapproved',
        rescheduled:           'approved',
        new_appointment:       'pending',
        reschedule_request:    'pending',
        no_show:               'no-show',
        appointment_confirmed: 'approved',
      }[type] || ''
      return { page: 'doctor-appointments', params: { filter: doctorFilter } }
    }
    // Admin / staff — "Patient Confirmed Attendance" (notifyAdminStaff(),
    // api/appointments/confirm.php) is admin/staff-only in practice, but
    // filtered here like every other role for consistency rather than
    // special-cased outside apptTypes.
    const staffFilter = {
      new_appointment:       'pending',
      reschedule_request:    'pending',
      approved:              'approved',
      cancelled:             'cancelled',
      disapproved:           'disapproved',
      rescheduled:           'approved',
      no_show:               'no-show',
      appointment_confirmed: 'approved',
    }[type] || ''
    return { page: 'appointments', params: { filter: staffFilter } }
  }

  // Reminder/waitlist notifications only ever go to patients.
  if (type === 'reminder')         return { page: 'patient-appts', params: { filter: 'approved' } }
  if (type === 'waitlist_offer')   return { page: 'patient-request-appt', params: {} }
  if (type === 'waitlist_removed') return { page: 'patient-request-appt', params: {} }

  // A patient joining or leaving the waitlist is admin/staff-only — send
  // them to the Waitlist list page (there's no per-status filter there to
  // preserve).
  if (type === 'waitlist_join')    return { page: 'waitlist', params: {} }
  if (type === 'waitlist_left')    return { page: 'waitlist', params: {} }

  const map = {
    record:          role === 'patient' ? 'patient-exam-history'  : 'patient-list',
    prescription:    role === 'patient' ? 'patient-prescriptions' : 'patient-list',
    // "Account Deletion Requested" (api/patients/request-deletion.php) is
    // admin/staff-only in practice. The real click-through (straight to
    // that patient's own profile, where the request banner and its
    // Archive/Dismiss actions already live) is handled as an early-return
    // branch in _markNotifDropdown()/markNotifRead() below, using
    // notif.relatedId — this is just the fallback for the rare case that
    // relatedId is missing (an old notification from before it was added).
    deletion_request: 'patient-list',
    // "Deletion Request Reviewed" (api/patients/dismiss-deletion-request.php)
    // is patient-only — straight to Settings > My Profile, where the
    // deletion request lived and where they'd go to request it again if
    // they still want to.
    deletion_reviewed: 'patient-settings',
    welcome:         dashPage,
    info:            dashPage,
    // Patients are notified of contact replies by email — the in-app
    // contact_message type is admin/staff only; route patients to their dashboard.
    contact_message: role === 'patient' ? dashPage : 'contact-messages',
    // "New Sign-in Detected" (tagSessionOwner(), api/helpers.php) — no
    // specific record to jump to, just the Active Sessions page itself,
    // same destination for every role.
    new_login:       'active-sessions',
  }
  return { page: map[type] || dashPage, params: {} }
}
window._notifNavTarget = _notifNavTarget

function _buildNotifDropdownHtml() {
  const notifs = window._notifications || []
  const recent = notifs.slice(0, 5)
  if (!recent.length) {
    return `<div class="table-empty">No notifications yet.</div>`
  }
  return recent.map(n => `
    <div class="notify-item${n.isRead ? '' : ' unread'}" onclick="window._markNotifDropdown(${n.id})" style="cursor:pointer">
      <div class="notify-item-icon ${_NOTIF_COLOR[_resolveNotifType(n)] || 'gray'}">${window.icon(_NOTIF_ICON[_resolveNotifType(n)] || 'info', 'icon-sm')}</div>
      <div class="notify-item-body">
        <div class="notify-item-title">${n.title}</div>
        <div class="notify-item-msg">${n.body}</div>
        <div class="notify-item-time">${_notifTimeAgo(n.createdAt)}</div>
      </div>
    </div>`).join('')
}
window._buildNotifDropdownHtml = _buildNotifDropdownHtml

function _updateNotifUI() {
  // Scoped to its own id — the contact-messages topbar icon has a separate
  // badge (#topbar-contact-badge, updated by _updateContactUI) that must
  // never be touched from here, or the two features' unread counts bleed
  // into each other.
  const badge = document.getElementById('topbar-bell-badge')
  const count = window._unreadCount || 0
  if (badge) {
    badge.textContent = count > 9 ? '9+' : String(count)
    badge.style.display = count > 0 ? '' : 'none'
  }
  const list = document.getElementById('notify-list-inner')
  if (list) list.innerHTML = _buildNotifDropdownHtml()
}
window._updateNotifUI = _updateNotifUI

// Real-time repaint for the contact-messages topbar badge — independent of
// _updateNotifUI above. Called after every contact-message mutation (read,
// unread, mark-all, delete) and by the background poll, so the badge stays
// accurate without needing a full page navigation, and without ever
// touching the notification bell's own count.
function _updateContactUI() {
  const badge = document.getElementById('topbar-contact-badge')
  const count = window._contactUnreadCount || 0
  if (badge) {
    badge.textContent = count > 9 ? '9+' : String(count)
    badge.style.display = count > 0 ? '' : 'none'
  }
}
window._updateContactUI = _updateContactUI

// Mark single notif as read from topbar dropdown, then navigate
function _markNotifDropdown(id) {
  const notif = (window._notifications || []).find(n => n.id === id)
  if (!notif) return
  if (!notif.isRead) {
    notif.isRead = true
    if (window._unreadCount > 0) window._unreadCount--
    _updateNotifUI()
    fetch('api/notifications/mark_read.php', {
      method: 'POST', headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({ id })
    }).catch(() => {})
  }
  closeAllDropdowns()
  // Same dedicated confirm-prompt shortcut as markNotifRead() (main.js) —
  // duplicated here because the bell dropdown and the full Notifications
  // page are two separate click-handling paths that both need it.
  if (notif.type === 'reminder' && notif.relatedId && state.role === 'patient' && window.confirmApptPrompt) {
    window.confirmApptPrompt(notif.relatedId)
    return
  }
  // Same for a reschedule request (admin/staff/doctor) — straight to that
  // appointment's details instead of a filtered list to scan.
  if (notif.type === 'reschedule_request' && notif.relatedId && state.role !== 'patient' && window.openRescheduleRequestNotif) {
    window.openRescheduleRequestNotif(notif.relatedId)
    return
  }
  // Same again for a brand-new appointment request (admin/staff).
  if (notif.type === 'new_appointment' && notif.relatedId && state.role !== 'patient' && window.openNewApptRequestNotif) {
    window.openNewApptRequestNotif(notif.relatedId)
    return
  }
  // "Account Deletion Requested" (relatedId is the patientId) — straight to
  // that patient's own profile, where the pending-request banner and its
  // Archive/Dismiss actions already sit at the top, instead of landing on
  // the Patient Records list and making admin/staff search for them.
  if (notif.type === 'deletion_request' && notif.relatedId && state.role !== 'patient') {
    navigate('patient-view', { patientId: notif.relatedId })
    return
  }
  // Same again for a doctor-flagged follow-up (relatedId is the patientId) —
  // straight into a pre-filled New Appointment. Duplicated from
  // markNotifRead()'s (main.js) follow_up_needed branch for the same reason
  // as the shortcuts above: the bell dropdown and the full Notifications
  // page are two separate click-handling paths.
  if (notif.type === 'follow_up_needed' && notif.relatedId && state.role !== 'patient') {
    const p = (window.patients || patients).find(pt => pt.id === notif.relatedId)
    const con = p && (p.consultations || []).find(c => c.followUpDate)
    if (p && con) {
      const doc = (window.doctors || doctors).find(d => d.name === con.doctor)
      window._staffCalPrefill = {
        doctorId: doc?.id || '', doctorName: doc?.name || con.doctor || '',
        doctorSpec: doc?.specialization || '', date: con.followUpDate, time: con.followUpTime || '', isFollowUp: true
      }
      navigate('create-appointment', { patientId: p.id, patientName: p.name })
    } else {
      navigate('patient-view', { patientId: notif.relatedId })
    }
    return
  }
  const { page: _np, params: _npar } = _notifNavTarget(notif.type, state.role)
  navigate(_np, _npar)
}
window._markNotifDropdown = _markNotifDropdown

// ── Sidebar parent toggle ────────────────────────────────────────
function toggleSidebarParent(key) {
  const submenu = document.getElementById('dd-' + key)
  const arrow   = document.getElementById('arrow-dd-' + key)
  const parent  = submenu && submenu.previousElementSibling
  if (!submenu) return

  const sidebar = document.getElementById('sidebar')
  // A collapsed icon-rail sidebar can't show a submenu in place (its
  // max-height is forced to 0 while collapsed) — expand the sidebar first
  // so the click actually leads somewhere instead of being a dead end.
  if (sidebar && sidebar.classList.contains('collapsed') && window.innerWidth > 767) {
    state.sidebarCollapsed = false
    sidebar.classList.remove('collapsed')
    document.getElementById('main-area')?.classList.remove('collapsed')
    submenu.classList.add('open')
    if (arrow)  arrow.classList.add('open')
    if (parent) parent.classList.add('nav-parent-open')
    return
  }

  const open = !submenu.classList.contains('open')
  submenu.classList.toggle('open', open)
  if (arrow)  arrow.classList.toggle('open', open)
  if (parent) parent.classList.toggle('nav-parent-open', open)
}
window.toggleSidebarParent = toggleSidebarParent

// ── Dropdown toggles (exported for global access) ────────────────
function toggleNotifyDropdown(e) {
  e.stopPropagation()
  const dd = document.getElementById('notify-dropdown')
  const ud = document.getElementById('user-dropdown')
  if (ud) ud.classList.remove('open')
  if (dd) dd.classList.toggle('open')
}

function toggleUserDropdown(e) {
  e.stopPropagation()
  const dd = document.getElementById('notify-dropdown')
  const ud = document.getElementById('user-dropdown')
  if (dd) dd.classList.remove('open')
  if (ud) ud.classList.toggle('open')
}

function closeAllDropdowns() {
  const dd = document.getElementById('notify-dropdown')
  const ud = document.getElementById('user-dropdown')
  if (dd) dd.classList.remove('open')
  if (ud) ud.classList.remove('open')
}

function markAllRead() {
  ;(window._notifications || []).forEach(n => { n.isRead = true })
  window._unreadCount = 0
  _updateNotifUI()
  fetch('api/notifications/mark_read.php', {
    method: 'POST', headers: { 'Content-Type': 'application/json' },
    body: JSON.stringify({ all: true })
  }).catch(() => {})
}

// ── Sidebar collapse ────────────────────────────────────────────
function toggleSidebar() {
  if (window.innerWidth <= 767) {
    const sidebar  = document.getElementById('sidebar')
    const mainArea = document.getElementById('main-area')
    const overlay  = document.getElementById('sidebar-overlay')
    // Strip desktop-collapse state so the drawer always opens at full width
    sidebar.classList.remove('collapsed')
    if (mainArea) mainArea.classList.remove('collapsed')
    const isOpen = sidebar.classList.toggle('mobile-open')
    if (overlay) overlay.classList.toggle('show', isOpen)
  } else {
    state.sidebarCollapsed = !state.sidebarCollapsed
    document.getElementById('sidebar').classList.toggle('collapsed', state.sidebarCollapsed)
    document.getElementById('main-area').classList.toggle('collapsed', state.sidebarCollapsed)
  }
}

function closeMobileSidebar() {
  document.getElementById('sidebar')?.classList.remove('mobile-open')
  document.getElementById('sidebar-overlay')?.classList.remove('show')
}
window.closeMobileSidebar = closeMobileSidebar


// ── Responsive default: pick a sidebar mode when the viewport crosses
//    into a new size bucket, without fighting a manual toggle made by
//    the user while they stay within the same bucket. ─────────────
function _sidebarBucketFor(w) {
  if (w <= 767)  return 'mobile'
  if (w <= 1024) return 'tablet'
  return 'desktop'
}
let _lastSidebarBucket = null
function applySidebarBucket(force) {
  const sidebar  = document.getElementById('sidebar')
  const mainArea = document.getElementById('main-area')
  if (!sidebar || !mainArea) return
  const bucket = _sidebarBucketFor(window.innerWidth)
  if (bucket === _lastSidebarBucket && !force) return
  _lastSidebarBucket = bucket
  closeMobileSidebar()
  if (bucket === 'mobile') {
    state.sidebarCollapsed = false
    sidebar.classList.remove('collapsed')
    mainArea.classList.remove('collapsed')
  } else if (bucket === 'tablet') {
    // Default to icon-rail mode on tablets/small laptops, but the user
    // can still expand it — the hamburger keeps using the same toggle.
    state.sidebarCollapsed = true
    sidebar.classList.add('collapsed')
    mainArea.classList.add('collapsed')
  } else {
    state.sidebarCollapsed = false
    sidebar.classList.remove('collapsed')
    mainArea.classList.remove('collapsed')
  }
}
window.applySidebarBucket = applySidebarBucket

window.addEventListener('resize', () => applySidebarBucket(false))

