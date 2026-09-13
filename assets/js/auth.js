// ================================================================
//  CANAOPTICALCLINIC — auth.js
//  Login, register, logout — backed by PHP API endpoints.
//  API base: /api/auth/  (relative, works with any sub-path)
// ================================================================

// ── Password policy (shared by every screen that sets a password) ─
const PW_POLICY_RULES = [
  { key: 'len',   label: 'At least 8 characters',     test: v => v.length >= 8 },
  { key: 'lower', label: 'One lowercase letter (a-z)', test: v => /[a-z]/.test(v) },
  { key: 'upper', label: 'One uppercase letter (A-Z)', test: v => /[A-Z]/.test(v) },
  { key: 'num',   label: 'One number (0-9)',           test: v => /[0-9]/.test(v) },
  { key: 'special', label: 'One special character (!@#$%^&*...)', test: v => /[^A-Za-z0-9]/.test(v) },
]
function pwPolicyValid(v) {
  return PW_POLICY_RULES.every(r => r.test(v || ''))
}
function pwChecklistHtml(idPrefix) {
  return `<div class="pw-checklist" id="${idPrefix}-checklist">` +
    PW_POLICY_RULES.map(r => `
      <div class="pw-check-item" id="${idPrefix}-chk-${r.key}">
        <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2.5" stroke-linecap="round" stroke-linejoin="round"><circle cx="12" cy="12" r="9"/></svg>
        <span>${r.label}</span>
      </div>`).join('') +
    `</div>`
}
function updatePwChecklist(idPrefix, value) {
  const v = value || ''
  PW_POLICY_RULES.forEach(r => {
    const item = document.getElementById(`${idPrefix}-chk-${r.key}`)
    if (!item) return
    const svg = item.querySelector('svg')
    const met = r.test(v)
    const hasInput = v.length > 0
    item.classList.toggle('met', met)
    item.classList.toggle('unmet', hasInput && !met)
    if (svg) {
      svg.innerHTML = met
        ? '<polyline points="20 6 9 17 4 12"/>'
        : hasInput
          ? '<line x1="18" y1="6" x2="6" y2="18"/><line x1="6" y1="6" x2="18" y2="18"/>'
          : '<circle cx="12" cy="12" r="9"/>'
    }
  })
}
window.pwPolicyValid     = pwPolicyValid
window.pwChecklistHtml   = pwChecklistHtml
window.updatePwChecklist = updatePwChecklist

// ── Contact number / address validity (shared by every screen that
//    collects a person's contact number or address) ────────────────
// Every person-contact-number field across the app shares formatContactInput()
// (below) on its oninput, so typing digits auto-formats to the same
// "0912-345-6789" pattern everywhere instead of leaving hyphen placement up
// to whoever's typing — plus legacy stored numbers entered before that
// existed. Hyphens are stripped here before checking length so any of that
// still validates the same way — this just checks there are 11 actual
// digits for a PH mobile number, not that the string looks a particular way.
function isValidContact(contact) {
  return /^\d{11}$/.test((contact || '').trim().replace(/-/g, ''))
}

// Auto-formats a contact-number input to the "0912-345-6789" pattern (4-3-4
// digit grouping) as the user types, capped at 11 digits — every contact
// field across the app shares this on its oninput (patient/doctor/staff/
// admin self- or other-editing, and the clinic's own number in Settings >
// Clinic Information) so the format is identical everywhere instead of
// depending on what each person happens to type.
function formatContactInput(el) {
  const digits = (el.value || '').replace(/\D/g, '').slice(0, 11)
  let out = digits
  if (digits.length > 7) out = `${digits.slice(0,4)}-${digits.slice(4,7)}-${digits.slice(7)}`
  else if (digits.length > 4) out = `${digits.slice(0,4)}-${digits.slice(4)}`
  el.value = out
}
window.formatContactInput = formatContactInput
window.isValidContact = isValidContact

// No geocoding involved (that's the only way to truly verify an address
// exists — see e.g. Google's Address Validation API — not something this
// app has a key for) — just the same lightweight fallback most address-
// validation guides recommend absent that: an allowed-character set plus
// a minimum length, tuned loose enough that a genuinely short-but-real
// address (e.g. "Purok 3, Sto. Tomas") never gets rejected.
function looksLikeAddress(addr) {
  const a = (addr || '').trim()
  if (a.length < 8) return false          // too short to be a real address
  if (!/[a-zA-Z]/.test(a)) return false   // a real address always has some plain letters (street/barangay/city)
  if (/^(.)\1+$/.test(a.replace(/\s+/g, ''))) return false // the whole thing is one character repeated
  // Letters (incl. accented, e.g. "Biñan"), digits, and the punctuation
  // that actually shows up in a real PH address (. , ' # - / &) — reject
  // anything built from characters an address would never contain
  // (emoji, most symbols, keyboard-mash) instead of just checking non-empty.
  if (!/^[\p{L}\p{N}\s.,#'\-/&]+$/u.test(a)) return false
  return true
}
window.looksLikeAddress = looksLikeAddress

// Shared by the "Change Password" section on every role's own Settings
// page (ids are always {prefix}-curpw/-newpw/-confpw/-pw-err/-pw-btn).
// Keeps Update Password disabled until the form is actually submittable —
// the live checklist + this gate replace what used to be a submit-time
// toast repeating the same rules.
function updateSettingsPwGate(prefix) {
  const btn = document.getElementById(prefix + '-pw-btn')
  if (!btn) return
  const cur = (document.getElementById(prefix + '-curpw')  || {}).value || ''
  const np  = (document.getElementById(prefix + '-newpw')  || {}).value || ''
  const cf  = (document.getElementById(prefix + '-confpw') || {}).value || ''
  const errEl = document.getElementById(prefix + '-pw-err')
  if (errEl) errEl.classList.toggle('show', !!(np && cf && np !== cf))
  const ok = !!cur && pwPolicyValid(np) && np === cf
  btn.disabled      = !ok
  btn.style.opacity = ok ? '' : '.55'
  btn.style.cursor  = ok ? '' : 'not-allowed'
}
window.updateSettingsPwGate = updateSettingsPwGate

// ── Login ────────────────────────────────────────────────────────
function _showLoginError(msg) {
  const errEl  = document.getElementById('login-error')
  const errMsg = document.getElementById('login-error-msg')
  errMsg.textContent  = msg
  errEl.style.display = 'flex'
}

async function handleLogin() {
  const emailEl = document.getElementById('login-email')
  const passEl  = document.getElementById('login-password')
  const email    = emailEl.value.trim()
  const pass     = passEl.value
  const remember = document.getElementById('login-remember')?.checked || false
  document.getElementById('login-error').style.display = 'none'
  emailEl.classList.remove('error')
  passEl.classList.remove('error')

  if (!email || !pass) {
    if (!email) emailEl.classList.add('error')
    if (!pass)  passEl.classList.add('error')
    _showLoginError(
      !email && !pass ? 'Please fill in your email and password.'
    : !email          ? 'Please enter your email address.'
    :                   'Please enter your password.'
    )
    return
  }

  const btn = document.getElementById('login-btn')
  if (btn) { btn.disabled = true; btn.textContent = 'Signing in…'; btn.style.opacity = '0.8' }

  try {
    const res  = await fetch('api/auth/login.php', {
      method:  'POST',
      headers: { 'Content-Type': 'application/json' },
      body:    JSON.stringify({ email, password: pass, remember }),
    })
    const data = await res.json()

    if (!data.success) {
      if (data.needsVerification) {
        showEmailVerify(data.email)
        if (btn) { btn.disabled = false; btn.textContent = 'Sign In'; btn.style.opacity = '1' }
        return
      }
      _showLoginError(data.message || 'The email or password you entered is incorrect. Please try again.')
      _shakeCard()
      document.getElementById('login-password').value = ''
      if (btn) { btn.disabled = false; btn.textContent = 'Sign In'; btn.style.opacity = '1' }
      return
    }

    // Remember (or forget) the email for next time, based on the checkbox —
    // separate from the session-length extension login.php already applies.
    try {
      if (remember) localStorage.setItem('canaopticalclinic_remembered_email', email)
      else localStorage.removeItem('canaopticalclinic_remembered_email')
    } catch (_) { /* localStorage unavailable (private mode, etc.) — non-critical */ }

    _bootAfterAuth(data.role, data.user)
  } catch (_) {
    // Real network/server failure — surface it instead of silently
    // logging in against mock data (which would hide a broken backend).
    _showLoginError('Unable to reach the server. Please check your connection and try again.')
    _shakeCard()
  } finally {
    if (btn) { btn.disabled = false; btn.textContent = 'Sign In'; btn.style.opacity = '1' }
  }
}

// ── Logout ───────────────────────────────────────────────────────
// Shown on the login screen whenever a device discovers its session is
// gone for a reason other than its own deliberate "Sign Out" click — used
// both by _handleSessionRevoked() (the 30s poll notices mid-session) and
// by restoreSession() (a fresh page load/refresh discovers it instead),
// so the explanation is identical either way it's found out.
const SESSION_REVOKED_MESSAGE = 'You were signed out because this session ended. It may have been signed out from another device, or your password was changed. Please sign in again.'

// localStorage flag: "this device had a real, signed-in session at some
// point." Set on every successful login/session-restore (_bootAfterAuth),
// cleared on any logout (this function, whether manual or forced). Lets
// restoreSession() below tell "a session that used to be valid just died"
// apart from "this browser was never signed in here at all" — only the
// first case should ever show SESSION_REVOKED_MESSAGE; a plain first
// visit shouldn't claim to have "signed you out" of something you were
// never in.
const HAD_SESSION_KEY = '_canaopticalclinic_hadSession'

// `reason`, when passed, is shown on the login screen after landing there
// — used by _handleSessionRevoked() below so a device that gets signed
// out remotely (another device's Log Out, or a password change) lands on
// a login screen that actually explains why, instead of just silently
// stopping working. A normal manual "Sign Out" click passes nothing.
async function logout(reason) {
  _stopSystemPolling()
  // A single fire-and-forget fetch here used to mean: any transient network
  // blip (a phone switching WiFi↔mobile data mid-request, a weak signal, a
  // backgrounded tab suspending the request) threw, got silently swallowed
  // by the catch below, and the app moved on as if logout had succeeded —
  // clearing local state and showing the login screen — while the actual
  // session row was never touched server-side, leaving it stuck in
  // Sessions & Sign-in indefinitely with zero indication anything went
  // wrong. Retrying a couple of times closes most of that gap without
  // risking trapping someone on the page if the network is genuinely down
  // (still gives up and logs out locally after 3 attempts either way).
  for (let attempt = 1; attempt <= 3; attempt++) {
    try {
      const r = await fetch('api/auth/logout.php', { method: 'POST' })
      if (r.ok) break
    } catch (_) { /* try again below, or give up after the last attempt */ }
    if (attempt < 3) await new Promise(res => setTimeout(res, 400 * attempt))
  }
  try { localStorage.removeItem(HAD_SESSION_KEY) } catch (_) {}

  if (window.closeModal) window.closeModal()

  window.state.role            = null
  window.state.user            = null
  window.state.page            = null
  window.state.params          = {}
  window.state.filter          = 'all'
  window.state.selectedRole    = 'admin'
  window.state.sidebarCollapsed = false

  document.getElementById('app-shell').style.display   = 'none'
  document.getElementById('login-screen').style.display = 'flex'
  _syncAuthBranding()
  document.getElementById('login-email').value          = ''
  document.getElementById('login-password').value       = ''
  document.getElementById('login-error').style.display  = 'none'
  const rememberEl = document.getElementById('login-remember')
  if (rememberEl) rememberEl.checked = false
  _prefillRememberedEmail()
  if (reason) _showLoginError(reason)
}

// ── Register ─────────────────────────────────────────────────────
async function handleRegister() {
  const first   = document.getElementById('reg-first').value.trim()
  const middle  = document.getElementById('reg-middle').value.trim()
  const last    = document.getElementById('reg-last').value.trim()
  const dob     = document.getElementById('reg-dob').value
  const gender  = document.getElementById('reg-gender').value
  const address = document.getElementById('reg-address').value.trim()
  const contact = document.getElementById('reg-contact').value.trim()
  const email   = document.getElementById('reg-email').value.trim()
  const pass    = document.getElementById('reg-password').value
  const confirm = document.getElementById('reg-confirm').value

  const errEl  = document.getElementById('reg-error')
  const errMsg = document.getElementById('reg-error-msg')
  errEl.style.display = 'none'

  const required = [first, last, dob, gender, address, contact, email, pass, confirm]
  if (required.some(v => !v)) {
    errMsg.textContent = 'Please complete all required fields before proceeding.'
    errEl.style.display = 'flex'; return
  }
  if (!document.getElementById('reg-terms-agree')?.checked) {
    errMsg.textContent = 'Please read and agree to the Terms & Conditions before registering.'
    errEl.style.display = 'flex'; return
  }
  if (!document.getElementById('reg-privacy-agree')?.checked) {
    errMsg.textContent = 'Please read and agree to the Data Privacy Act Notice before registering.'
    errEl.style.display = 'flex'; return
  }
  if (!document.getElementById('reg-age-confirm')?.checked) {
    errMsg.textContent = 'Please confirm your date of birth is accurate and that you are at least 13 years old.'
    errEl.style.display = 'flex'; return
  }
  if (pass !== confirm) {
    errMsg.textContent = 'The passwords you entered do not match. Please re-enter your password.'
    errEl.style.display = 'flex'; return
  }
  if (!pwPolicyValid(pass)) {
    errMsg.textContent = 'Password must be at least 8 characters and include a lowercase letter, an uppercase letter, a number, and a special character.'
    errEl.style.display = 'flex'; return
  }

  const regBtn = document.getElementById('reg-submit-btn')
  if (regBtn) { regBtn.disabled = true; regBtn.textContent = 'Creating account…' }

  try {
    const res  = await fetch('api/auth/register.php', {
      method:  'POST',
      headers: { 'Content-Type': 'application/json' },
      body:    JSON.stringify({ firstName: first, middleName: middle, lastName: last, dob, gender, address, contact, email, password: pass }),
    })
    const data = await res.json()

    if (!data.success) {
      errMsg.textContent  = data.message || 'Registration failed. Please try again.'
      errEl.style.display = 'flex'
      return
    }

    showEmailVerify(data.email, true)
  } catch (_) {
    errMsg.textContent  = 'Network error. Please check your connection and try again.'
    errEl.style.display = 'flex'
  } finally {
    if (regBtn) { regBtn.disabled = false; regBtn.textContent = 'Create Account' }
  }
}

// ── Terms & Conditions / Data Privacy Act modal ────────────────────
// The "I Agree" checkbox on the register form starts disabled — it can
// only be checked by reading the terms here and scrolling to the bottom,
// which is how this enforces an actual read-through instead of a
// rubber-stamp checkbox.
// Markdown-source default (mirrors api/helpers.php's DEFAULT_TERMS_MD exactly)
// — served only if the pre-auth clinic/public.php fetch hasn't resolved yet.
// Parsed by renderTermsMarkdown() (db.js) into the same <h4>/<p>/<ul> HTML
// this used to be hardcoded as.
const DEFAULT_TERMS_MD = `## 1. Acceptance of Terms
By creating a patient account with Cana Optical Clinic ("the Clinic"), you agree to be bound by these Terms & Conditions. If you do not agree, please do not proceed with registration.

## 2. Account Registration
You must provide accurate, current, and complete information during registration. You are responsible for keeping your password confidential and for all activity under your account. Notify the Clinic immediately if you suspect unauthorized use.

## 3. Your Patient QR Code
Upon registration, a unique QR code is generated and linked to your patient record. Present this QR code at the clinic for fast, accurate check-in. Do not share it with anyone else — it provides access to your health information.

## 4. Appointments
Appointment requests submitted through this system are subject to confirmation by clinic staff based on doctor availability. The Clinic reserves the right to reschedule or decline requests when necessary.

## 5. Use of the Platform
You agree to use this system only for legitimate healthcare purposes related to your own care. Misuse — including attempting to access another patient's records or interfering with the system's normal operation — may result in account suspension.

## 6. Changes to these Terms
The Clinic may update these Terms & Conditions from time to time. Continued use of your account after changes are posted constitutes acceptance of the revised terms.
`

// Kept as its own document/checkbox, separate from the Terms & Conditions
// above — a Data Privacy Act consent bundled inside a generic "I agree to
// the Terms" checkbox doesn't read as the patient having actually consented
// to it specifically, which is the whole point of calling it out under RA
// 10173. Mirrors api/helpers.php's DEFAULT_PRIVACY_MD exactly.
const DEFAULT_PRIVACY_MD = `## 1. Overview
This Data Privacy Act Notice explains how Cana Optical Clinic ("the Clinic") collects, uses, stores, and protects your personal and sensitive personal information, in compliance with the Data Privacy Act of 2012 (Republic Act No. 10173) and its Implementing Rules and Regulations.

## 2. Information We Collect and Why
The Clinic collects the personal and sensitive personal information you provide during registration (e.g. name, date of birth, address, contact details) and through your subsequent care (e.g. examination results, diagnoses, prescriptions). This information is collected and processed solely for:
- Creating and maintaining your patient record
- Scheduling and managing appointments
- Providing optical examination, diagnosis, and treatment
- Generating your patient identification QR code
- Communicating with you regarding your account, appointments, or care
- Complying with legal and regulatory requirements

## 3. Storage and Security
Your data is stored on secured servers with access restricted to authorized clinic personnel (admin, staff, and your attending doctor) who need it to perform their duties. We apply reasonable organizational, physical, and technical safeguards to protect your information against unauthorized access, alteration, disclosure, or destruction.

## 4. Data Sharing
The Clinic does not sell or rent your personal information. Your data may only be shared with third parties when required by law, when necessary to provide your care (e.g. referrals), or with your explicit consent.

## 5. Data Retention
Your personal and health records are retained for as long as your account is active, and for the period required by applicable healthcare record-keeping regulations afterward, after which they are securely disposed of.

## 6. Your Rights as a Data Subject
Under the Data Privacy Act, you have the right to:
- Be informed of how your data is collected and processed
- Access the personal data the Clinic holds about you
- Request correction of inaccurate or outdated data
- Object to or withdraw consent for processing, subject to legal or contractual restrictions
- Request deletion of your data, where applicable
- File a complaint with the National Privacy Commission (NPC)

To exercise any of these rights, please contact the clinic directly using the contact details on our website.

## 7. Consent and Changes to this Notice
By checking "I agree" and completing registration, you acknowledge that you have read and understood this notice, and you consent to the collection, use, storage, and processing of your personal and sensitive personal information as described above, for the purpose of receiving care from Cana Optical Clinic — and you are entrusting your credentials and personal information to the Clinic on that basis. The Clinic may update this notice from time to time; continued use of your account after changes are posted constitutes acceptance of the revised notice.
`

function openTermsModal() {
  window.showModal(`
    <div class="modal-header">
      <div class="modal-title">${window.icon ? window.icon('shield','icon-sm') : ''} Terms &amp; Conditions</div>
      <button class="modal-close" onclick="window.closeModal()">&times;</button>
    </div>
    <div class="modal-body">
      <div class="terms-body" id="terms-scroll-body" onscroll="window._checkTermsScroll()">
        ${renderTermsMarkdown(window._termsContentMd || DEFAULT_TERMS_MD)}
      </div>
    </div>
    <div class="modal-footer">
      <span class="terms-scroll-hint" id="terms-scroll-hint">
        <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2" width="14" height="14"><line x1="12" y1="5" x2="12" y2="19"/><polyline points="19 12 12 19 5 12"/></svg>
        Scroll to the bottom to continue
      </span>
      <button class="btn-secondary" onclick="window.closeModal()">Cancel</button>
      <button class="btn-primary" id="terms-agree-btn" disabled onclick="window.acceptTerms()">I Agree &amp; Continue</button>
    </div>`, 'modal-lg')

  // If the content already fits without scrolling (tall viewport / small
  // text), don't trap the user behind an unreachable scroll requirement.
  setTimeout(() => window._checkTermsScroll(), 50)
}
window.openTermsModal = openTermsModal

function _checkTermsScroll() {
  const body = document.getElementById('terms-scroll-body')
  const btn  = document.getElementById('terms-agree-btn')
  if (!body || !btn) return
  const reachedBottom = body.scrollTop + body.clientHeight >= body.scrollHeight - 24
  if (reachedBottom && btn.disabled) {
    btn.disabled = false
    const hint = document.getElementById('terms-scroll-hint')
    if (hint) hint.style.display = 'none'
  }
}
window._checkTermsScroll = _checkTermsScroll

function acceptTerms() {
  // Defense in depth — the button's native `disabled` attribute already
  // blocks this click, but don't trust that alone for something gating
  // consent to data collection.
  const btn = document.getElementById('terms-agree-btn')
  if (btn && btn.disabled) return

  const cb = document.getElementById('reg-terms-agree')
  if (cb) { cb.disabled = false; cb.checked = true }
  _regUpdateConsentHint()
  window.closeModal()
}
window.acceptTerms = acceptTerms

// Single combined hint for both consent checkboxes (Terms & Conditions,
// Data Privacy Act Notice) — swaps its text to name whichever document(s)
// are still locked instead of showing two near-identical stacked boxes,
// which read as cluttered/repetitive once there were two checkboxes to
// gate instead of one. Called on every lock-state change for either
// checkbox (accept*(), showRegister()'s reset).
function _regUpdateConsentHint() {
  const termsCb   = document.getElementById('reg-terms-agree')
  const privacyCb = document.getElementById('reg-privacy-agree')
  const hint       = document.getElementById('reg-terms-hint')
  const hintText   = document.getElementById('reg-terms-hint-text')
  if (!hint || !hintText) return

  const termsLocked   = !!(termsCb && termsCb.disabled)
  const privacyLocked = !!(privacyCb && privacyCb.disabled)

  if (!termsLocked && !privacyLocked) {
    hint.style.display = 'none'
    return
  }
  hint.style.display = 'flex'
  hintText.innerHTML = (termsLocked && privacyLocked)
    ? 'Click the Terms &amp; Conditions and Data Privacy Act Notice links below, and read each to the bottom, to unlock their checkboxes.'
    : termsLocked
      ? 'Click the Terms &amp; Conditions link below and read to the bottom to unlock its checkbox.'
      : 'Click the Data Privacy Act Notice link below and read to the bottom to unlock its checkbox.'
}
window._regUpdateConsentHint = _regUpdateConsentHint

// ── Data Privacy Act modal — separate document, separate checkbox, same
// read-to-the-bottom-to-unlock mechanic as Terms & Conditions above. ────
function openPrivacyModal() {
  window.showModal(`
    <div class="modal-header">
      <div class="modal-title">${window.icon ? window.icon('shield','icon-sm') : ''} Data Privacy Act Notice</div>
      <button class="modal-close" onclick="window.closeModal()">&times;</button>
    </div>
    <div class="modal-body">
      <div class="terms-body" id="privacy-scroll-body" onscroll="window._checkPrivacyScroll()">
        ${renderTermsMarkdown(window._privacyContentMd || DEFAULT_PRIVACY_MD)}
      </div>
    </div>
    <div class="modal-footer">
      <span class="terms-scroll-hint" id="privacy-scroll-hint">
        <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2" width="14" height="14"><line x1="12" y1="5" x2="12" y2="19"/><polyline points="19 12 12 19 5 12"/></svg>
        Scroll to the bottom to continue
      </span>
      <button class="btn-secondary" onclick="window.closeModal()">Cancel</button>
      <button class="btn-primary" id="privacy-agree-btn" disabled onclick="window.acceptPrivacy()">I Agree &amp; Continue</button>
    </div>`, 'modal-lg')

  setTimeout(() => window._checkPrivacyScroll(), 50)
}
window.openPrivacyModal = openPrivacyModal

function _checkPrivacyScroll() {
  const body = document.getElementById('privacy-scroll-body')
  const btn  = document.getElementById('privacy-agree-btn')
  if (!body || !btn) return
  const reachedBottom = body.scrollTop + body.clientHeight >= body.scrollHeight - 24
  if (reachedBottom && btn.disabled) {
    btn.disabled = false
    const hint = document.getElementById('privacy-scroll-hint')
    if (hint) hint.style.display = 'none'
  }
}
window._checkPrivacyScroll = _checkPrivacyScroll

function acceptPrivacy() {
  const btn = document.getElementById('privacy-agree-btn')
  if (btn && btn.disabled) return

  const cb = document.getElementById('reg-privacy-agree')
  if (cb) { cb.disabled = false; cb.checked = true }
  _regUpdateConsentHint()
  window.closeModal()
}
window.acceptPrivacy = acceptPrivacy

// ── Multi-step registration wizard ────────────────────────────────
window._regStep = 1

function _regGoToStep(n) {
  const prev = window._regStep
  const dir  = (prev === 0 || n > prev) ? 1 : -1

  for (let i = 1; i <= 3; i++) {
    const p = document.getElementById('reg-panel-' + i)
    if (p) p.style.display = i === n ? '' : 'none'
  }

  // .auth-form-panel scrolls internally (fixed-height card — see its CSS
  // comment), and that scroll position otherwise carries over unchanged
  // across a step switch. Landing on the new step already scrolled down
  // (e.g. from having scrolled to reach "Next" on a tall step) pushes its
  // own title/top content out of view for no reason the user did on this
  // step — always start each step at its own top.
  const formPanel = document.querySelector('#register-screen .auth-form-panel')
  if (formPanel) formPanel.scrollTop = 0

  // Clear error banner and any field highlights on every step transition
  const errEl = document.getElementById('reg-error')
  if (errEl) errEl.style.display = 'none'
  document.querySelectorAll('#register-screen .reg-input.error').forEach(el => el.classList.remove('error'))

  if (n === 3) {
    const h = document.getElementById('reg-hidden-email')
    if (h) h.value = document.getElementById('reg-email')?.value || ''
  }

  if (prev !== 0) {
    const card = document.querySelector('#register-screen .auth-split-card')
    if (card) {
      card.classList.remove('auth-card-step-in')
      void card.offsetWidth
      card.classList.add('auth-card-step-in')
    }
  }

  for (let i = 1; i <= 3; i++) {
    const dot = document.getElementById('rstep-dot-' + i)
    const num = document.getElementById('rstep-num-' + i)
    if (!dot) continue
    if (i < n) {
      dot.className = 'reg-step-item reg-step-done'
      if (num) num.textContent = '✓'
    } else if (i === n) {
      dot.className = 'reg-step-item reg-step-active'
      if (num) num.textContent = String(i)
    } else {
      dot.className = 'reg-step-item'
      if (num) num.textContent = String(i)
    }
    const line = document.getElementById('rstep-line-' + i)
    if (line) line.className = 'reg-step-line' + (i < n ? ' reg-step-line-done' : '')
  }
  const backBtn   = document.getElementById('reg-nav-back')
  const nextBtn   = document.getElementById('reg-nav-next')
  const submitBtn = document.getElementById('reg-submit-btn')
  if (backBtn) {
    const svg = '<svg viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2" width="15" height="15"><polyline points="15 18 9 12 15 6"/></svg>'
    backBtn.innerHTML = svg + (n === 1 ? ' Back to Login' : ' Back')
  }
  if (nextBtn)   nextBtn.style.display   = n < 3 ? '' : 'none'
  if (submitBtn) submitBtn.style.display = n === 3 ? '' : 'none'
  window._regStep = n
}

async function regNextStep() {
  const step   = window._regStep
  const errEl  = document.getElementById('reg-error')
  const errMsg = document.getElementById('reg-error-msg')
  if (errEl) errEl.style.display = 'none'

  // Clear all field errors for the current step panel
  const panel = document.getElementById('reg-panel-' + step)
  if (panel) panel.querySelectorAll('.reg-input.error').forEach(el => el.classList.remove('error'))

  const markError = id => document.getElementById(id)?.classList.add('error')

  if (step === 1) {
    const first  = (document.getElementById('reg-first')?.value  || '').trim()
    const last   = (document.getElementById('reg-last')?.value   || '').trim()
    const dob    = (document.getElementById('reg-dob')?.value    || '')
    const gender = (document.getElementById('reg-gender')?.value || '')
    if (!first) markError('reg-first')
    if (!last)  markError('reg-last')
    if (!dob)   markError('reg-dob-trigger') // visible custom-picker button — the real reg-dob is a hidden input now
    if (!gender) markError('reg-gender-trigger') // visible custom-select button — the real reg-gender is a hidden input now
    // reg-dob (the hidden input) only ever gets a value from a genuinely
    // valid, in-range typed/picked date — _dobTextCommit() (main.js)
    // rejects anything else (an impossible calendar date, or one outside
    // the min/max range, e.g. a typo'd year) and leaves the hidden value
    // empty, marking the field .error itself. That collapses into the
    // same "dob is empty" case as never having touched the field at all,
    // so a typed-but-rejected date silently got the generic "fill in all
    // required fields" message instead of one that actually explains why
    // Next is still blocked. Checking the *visible* text field separately
    // tells the two apart.
    const dobTyped = (document.getElementById('reg-dob-text')?.value || '').trim()
    if (!dob && dobTyped) {
      markError('reg-dob-trigger')
      if (errMsg) errMsg.textContent = 'Please enter a valid date of birth.'
      if (errEl)  errEl.style.display = 'flex'; return
    }
    if (!first || !last || !dob || !gender) {
      if (errMsg) errMsg.textContent = 'Please fill in all required fields.'
      if (errEl)  errEl.style.display = 'flex'; return
    }
    const dobDate = new Date(dob + 'T00:00:00')
    const today   = new Date()
    const minDate = new Date(today.getFullYear() - 13, today.getMonth(), today.getDate())
    if (dobDate > minDate) {
      markError('reg-dob-trigger')
      if (errMsg) errMsg.textContent = 'You must be at least 13 years old to create an account. Younger patients may be registered by clinic staff instead.'
      if (errEl)  errEl.style.display = 'flex'; return
    }
  } else if (step === 2) {
    const contact = (document.getElementById('reg-contact')?.value || '').trim()
    const email   = (document.getElementById('reg-email')?.value   || '').trim()
    const address = (document.getElementById('reg-address')?.value || '').trim()
    if (!contact) markError('reg-contact')
    if (!email || !/^[^\s@]+@[^\s@]+\.[^\s@]+$/.test(email)) markError('reg-email')
    if (!address) markError('reg-address')
    if (!contact || !address) {
      if (errMsg) errMsg.textContent = 'Please fill in all required fields.'
      if (errEl)  errEl.style.display = 'flex'; return
    }
    if (!isValidContact(contact)) {
      markError('reg-contact')
      if (errMsg) errMsg.textContent = 'Please enter a valid 11-digit contact number (e.g. 09171234567).'
      if (errEl)  errEl.style.display = 'flex'; return
    }
    if (!looksLikeAddress(address)) {
      markError('reg-address')
      if (errMsg) errMsg.textContent = 'Please enter your complete address.'
      if (errEl)  errEl.style.display = 'flex'; return
    }
    if (!email || !/^[^\s@]+@[^\s@]+\.[^\s@]+$/.test(email)) {
      if (errMsg) errMsg.textContent = !email ? 'Please fill in all required fields.' : 'Please enter a valid email address.'
      if (errEl)  errEl.style.display = 'flex'; return
    }

    // Catch an already-registered email right here, instead of only
    // failing at final submission after steps 2-3 are already filled out.
    if (window._regCheckEmailBusy) return
    window._regCheckEmailBusy = true
    const nextBtn = document.getElementById('reg-nav-next')
    const originalLabel = nextBtn ? nextBtn.innerHTML : ''
    if (nextBtn) { nextBtn.disabled = true; nextBtn.textContent = 'Checking…' }
    try {
      const r = await fetch('api/auth/check-email.php', {
        method: 'POST', headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ email })
      })
      const d = await r.json()
      if (d.exists) {
        markError('reg-email')
        if (errMsg) errMsg.textContent = 'An account with this email already exists. Please sign in instead, or use a different email address.'
        if (errEl)  errEl.style.display = 'flex'
        return
      }
    } catch (_) {
      // Network/server hiccup — don't hard-block the wizard over it.
      // register.php still enforces this same check at final submission
      // either way, so a stale/skipped check here is never unsafe, just
      // occasionally a step later than it could have been.
    } finally {
      window._regCheckEmailBusy = false
      if (nextBtn) { nextBtn.disabled = false; nextBtn.innerHTML = originalLabel }
    }
  }

  if (step < 3) _regGoToStep(step + 1)
}
window.regNextStep = regNextStep

function regPrevStep() {
  const step = window._regStep
  if (step <= 1) { showLogin(); return }
  _regGoToStep(step - 1)
}
window.regPrevStep = regPrevStep

function _checkRegTermsScroll() {
  const box = document.getElementById('reg-terms-box')
  const cb  = document.getElementById('reg-terms-agree')
  if (!box || !cb || !cb.disabled) return
  const atBottom = box.scrollHeight - box.scrollTop - box.clientHeight < 40
  if (atBottom) {
    cb.disabled = false
    const hint = document.getElementById('reg-terms-hint')
    if (hint) hint.style.display = 'none'
  }
}
window._checkRegTermsScroll = _checkRegTermsScroll

// ── Session restore (called from index.html on page load) ─────────
async function restoreSession() {
  const loadingEl  = document.getElementById('loading-screen')
  const loginEl    = document.getElementById('login-screen')
  const _startedAt = Date.now()
  const MIN_SHOW   = 900 // ms — long enough to see the loader, short enough not to feel slow

  const hideLoader = () => {
    const elapsed = Date.now() - _startedAt
    const delay   = Math.max(0, MIN_SHOW - elapsed)
    setTimeout(() => { if (loadingEl) loadingEl.style.display = 'none' }, delay)
  }
  const showLogin = (delay = 0) => {
    setTimeout(() => {
      if (loginEl) loginEl.style.display = 'flex'
      if (window._openRegister) {
        window._openRegister = false
        if (typeof showRegister === 'function') showRegister()
      }
    }, delay)
  }

  try {
    const res  = await fetch('api/auth/me.php')
    const data = await res.json()
    if (!data.success) {
      hideLoader()
      const delay = Math.max(0, MIN_SHOW - (Date.now() - _startedAt))
      // This device had a real session before (set by _bootAfterAuth on
      // its last successful login) and now doesn't — the same "signed out
      // elsewhere" situation _handleSessionRevoked() reacts to mid-session,
      // just discovered on a fresh page load/refresh instead. A browser
      // that was never signed in here at all skips this — it was never
      // "signed out" of anything.
      let hadSession = false
      try { hadSession = localStorage.getItem(HAD_SESSION_KEY) === '1' } catch (_) {}
      if (hadSession) {
        try { localStorage.removeItem(HAD_SESSION_KEY) } catch (_) {}
        showLogin(delay)
        setTimeout(() => _showLoginError(SESSION_REVOKED_MESSAGE), delay)
      } else {
        showLogin(delay)
      }
      return
    }

    // Sync in-memory state with the logged-in user so pages.js works
    const { role, user } = data
    if (role === 'patient') {
      const idx = patients.findIndex(p => p.id === user.id)
      if (idx === -1) patients.push({ ...user, password: '' })
    }

    hideLoader()
    const elapsed = Date.now() - _startedAt
    setTimeout(() => _bootAfterAuth(role, user), Math.max(0, MIN_SHOW - elapsed))
  } catch (_) {
    // PHP not available — fall back to login screen
    hideLoader()
    showLogin(Math.max(0, MIN_SHOW - (Date.now() - _startedAt)))
  }
}

// Pre-fill the login email + check "Remember me" if a prior login left one
// saved — called on page load alongside restoreSession(). Independent of
// the session itself, since a remembered email is still useful after the
// session (even a 30-day one) has expired and the user has to sign in again.
function _prefillRememberedEmail() {
  try {
    const saved = localStorage.getItem('canaopticalclinic_remembered_email')
    if (!saved) return
    const emailEl    = document.getElementById('login-email')
    const rememberEl = document.getElementById('login-remember')
    if (emailEl && !emailEl.value) emailEl.value = saved
    if (rememberEl) rememberEl.checked = true
  } catch (_) { /* localStorage unavailable — non-critical */ }
}
window._prefillRememberedEmail = _prefillRememberedEmail

// ── Screen switching ──────────────────────────────────────────────
// Re-fetches clinic name/logo from the public endpoint every time an auth
// screen is (re)shown — app.html's inline bootstrap script only runs once
// on the initial hard page load, so without this, a branding change made
// after that (or a sign-out back to the login screen) would keep showing
// whatever was current at that first load until the next full refresh.
function _syncAuthBranding() {
  fetch('api/clinic/public.php').then(r => r.json()).then(d => {
    if (!d || !d.success || !d.clinic) return
    const cn = d.clinic.name, lu = d.clinic.logoUrl
    if (cn) {
      document.querySelectorAll('.brand-logo-name').forEach(e => { e.textContent = cn })
      const lsEl = document.getElementById('ls-brand-name')
      if (lsEl) lsEl.textContent = cn
      try { localStorage.setItem('_canaopticalclinic_clinicName', cn) } catch (_) {}
    }
    if (lu) {
      document.querySelectorAll('.loading-screen-logo,.auth-bp-logo').forEach(e => { e.src = lu })
      const fav = document.querySelector('link[rel="icon"]')
      if (fav) fav.href = lu
      try { localStorage.setItem('_canaopticalclinic_logo_url', lu) } catch (_) {}
    }
  }).catch(() => {})
}
window._syncAuthBranding = _syncAuthBranding

function showRegister() {
  _syncAuthBranding()
  document.getElementById('login-screen').style.display    = 'none'
  document.getElementById('register-screen').style.display = 'flex'
  ;['reg-first','reg-last','reg-address','reg-contact','reg-email','reg-password','reg-confirm']
    .forEach(id => { const el = document.getElementById(id); if (el) el.value = '' })
  // reg-dob is the custom picker (see main.js) — reset its display, not just
  // the underlying hidden input, and recompute the 13+ cutoff each time the
  // form opens rather than once at page load.
  if (window.resetDobField) window.resetDobField('reg-dob')
  // window.maxDobFor13() (main.js) already computes this exact cutoff via
  // localDateStr() — not .toISOString(), which converts to UTC first and
  // lands on the wrong calendar day in a UTC+8 timezone during early
  // morning hours. Reuse it instead of recomputing (and re-risking) the
  // same date here.
  if (window.setDobFieldMax) window.setDobFieldMax('reg-dob', window.maxDobFor13 ? window.maxDobFor13() : localDateStr(new Date(new Date().getFullYear() - 13, new Date().getMonth(), new Date().getDate())))
  // reg-gender is also the custom select (see main.js) now — a direct
  // .value = '' reset would clear the hidden input but leave the visible
  // trigger button still showing whatever was last picked.
  if (window.resetSelectField) window.resetSelectField('reg-gender')
  document.getElementById('reg-error').style.display = 'none'
  const termsCb = document.getElementById('reg-terms-agree')
  if (termsCb) { termsCb.checked = false; termsCb.disabled = true }
  const privacyCb = document.getElementById('reg-privacy-agree')
  if (privacyCb) { privacyCb.checked = false; privacyCb.disabled = true }
  const ageCb = document.getElementById('reg-age-confirm')
  if (ageCb) ageCb.checked = false
  _regUpdateConsentHint()
  window._regStep = 0
  _regGoToStep(1)
}

function showLogin() {
  _syncAuthBranding()
  document.getElementById('register-screen').style.display  = 'none'
  document.getElementById('forgot-screen').style.display    = 'none'
  document.getElementById('verify-screen').style.display    = 'none'
  document.getElementById('login-screen').style.display     = 'flex'
  _evStopTimer()
}
window.showLogin = showLogin

function showForgotPassword() {
  _syncAuthBranding()
  document.getElementById('login-screen').style.display  = 'none'
  document.getElementById('forgot-screen').style.display = 'flex'
  fpUpdateDots(1)
  document.querySelectorAll('.fp-step').forEach(s => { s.classList.remove('active', 'reg-slide-in-right', 'reg-slide-in-left'); s.style.display = 'none'; s.style.opacity = '' })
  const s1 = document.getElementById('fp-step-1')
  s1.style.display = 'block'
  s1.classList.add('active')
  window._fpStep = 1
  // Reopening always lands back on step 1 — so if a step-1 submit is still
  // in flight, keep showing it that way (email field + disabled "Sending…"
  // button left untouched) rather than resetting to a blank, clickable
  // state while a request nobody can see keeps running in the background.
  // Its own success/error handling in fpS1Submit() takes over normally
  // once it resolves — there's nothing stale about it, since step 1 is
  // exactly what's on screen either way.
  if (!window._fpBusy.s1) {
    const emailEl = document.getElementById('fp-s1-email')
    if (emailEl) { emailEl.value = ''; emailEl.classList.remove('error') }
    document.getElementById('fp-s1-error').classList.remove('show')
    window._fpEmail = ''
    const s1btn = document.getElementById('fp-s1-btn')
    if (s1btn) s1btn.innerHTML = 'Submit'
  }
  // Steps 3/4 aren't shown on reopen (the block above always jumps back to
  // step 1), so a verify/reset still in flight from one of those has no
  // visible home to "keep loading" in the way step 1 can — bumping this
  // makes their eventual response a no-op instead of yanking whatever's on
  // screen now to step 4/step 2 for an attempt the user already left.
  window._fpFlowId++
  // Deliberately NOT resetting the resend cooldown here — it must survive a
  // full "Back to Login → Forgot Password?" restart, otherwise this cooldown
  // does nothing (someone could just reopen the flow to skip the wait).
  clearInterval(window._fpTimerInterval)
  window._fpTimeLeft = 300
  // Only while NOT busy — this only ever toggles disabled based on cooldown
  // state, so calling it unconditionally while a submit is still in flight
  // (no cooldown recorded yet, since that only starts once the request
  // succeeds) would immediately re-enable the button, undoing the "still
  // loading" state preserved above.
  if (!window._fpBusy.s1) fpSyncS1Cooldown()

  // Clear any password entered in a previous pass through this flow —
  // the step-4 inputs are never unmounted between visits, so without this
  // a second reset (even for a different email) starts pre-filled.
  ;['fp-s4-pw1', 'fp-s4-pw2'].forEach(id => {
    const el = document.getElementById(id)
    if (el) { el.value = ''; el.classList.remove('error') }
    updatePwChecklist(id, '')
  })
  const err1 = document.getElementById('fp-s4-err1'); if (err1) err1.classList.remove('show')
  const err2 = document.getElementById('fp-s4-err2'); if (err2) err2.classList.remove('show')
}

// ── Forgot Password flow ──────────────────────────────────────────
window._fpStep = 1
window._fpEmail = ''
window._fpResetToken = ''
window._fpTimerInterval = null
window._fpTimeLeft = 300
window._fpResendCooldownInterval = null
// Bumped every time showForgotPassword() (re-)opens the flow. A submit that
// was started, then abandoned by leaving and reopening the screen before
// its response arrived, captures the id in effect at the time — if that id
// no longer matches when the response finally shows up, the request is
// stale and its result is discarded instead of mutating whatever screen
// (now reset, possibly for a different email) happens to be showing.
window._fpFlowId = 0

// Guards against double-submission from any entry point — clicking the
// button (disabled, normally blocks re-clicks), but ALSO pressing Enter
// in a field or a native form submit, both of which call the handler
// function directly and completely skip the button's disabled state.
// Without this, two rapid Enters mid-request fire two overlapping calls.
window._fpBusy = { s1: false, s3: false, s4: false, resend: false }

// The 60s resend cooldown used to live only in a JS variable, which reset to
// 0 on any page refresh — reloading the page (even mid-countdown) silently
// cleared it and let someone request a new code immediately, bypassing the
// wait entirely. It's now mirrored to localStorage as {email, end} so a
// refresh can restore the true remaining time instead of forgetting it.
//
// It's scoped to the specific email address rather than global: the cooldown
// exists to stop someone hammering ONE account's inbox/OTP endpoint, not to
// stop a person from requesting a code for a different account right after.
// So an active cooldown for a@x.com never blocks a fresh request for b@x.com.
const FP_COOLDOWN_STORAGE_KEY = 'canaopticalclinic_fp_resend_cooldown'

function fpGetCooldownRecord() {
  try {
    const rec = JSON.parse(localStorage.getItem(FP_COOLDOWN_STORAGE_KEY) || 'null')
    return (rec && rec.email && rec.end) ? rec : null
  } catch (_) { return null }
}

// Remaining seconds left in the cooldown, but only if it belongs to `email`.
// A cooldown recorded for a different address returns 0 — it doesn't apply.
function fpCooldownRemainingFor(email) {
  const rec = fpGetCooldownRecord()
  if (!rec || !email) return 0
  if (rec.email !== email.trim().toLowerCase()) return 0
  return Math.max(0, Math.ceil((rec.end - Date.now()) / 1000))
}

function fpGoToStep(step) {
  const prev  = window._fpStep
  const dir   = (step > prev) ? 1 : -1
  const curId = prev === 3.5 ? 'fp-step-3b' : 'fp-step-' + prev
  const cur   = document.getElementById(curId)
  if (cur) { cur.classList.remove('active'); cur.style.display = 'none'; cur.style.opacity = '' }

  const nextId = step === 3.5 ? 'fp-step-3b' : 'fp-step-' + step
  const next   = document.getElementById(nextId)
  if (!next) return
  next.style.display = 'block'
  next.style.opacity = ''
  window._fpStep = step

  if (step === 4) {
    const h = document.getElementById('fp-s4-hidden-email')
    if (h) h.value = window._fpEmail || ''
  }
  if (step === 5) {
    const c = document.getElementById('fp-success-circle')
    if (c) { c.classList.remove('fp-success-anim'); void c.offsetWidth; c.classList.add('fp-success-anim') }
  }
  if (step === 3) fpStartTimer()
  fpUpdateDots(step)

  const card = document.querySelector('#forgot-screen .auth-split-card')
  if (card) {
    card.classList.remove('auth-card-step-in')
    void card.offsetWidth
    card.classList.add('auth-card-step-in')
  }
  next.classList.add('active')
}

function fpUpdateDots(step) {
  const wrap = document.getElementById('fp-progress-dots')
  if (!wrap) return
  wrap.style.display = step === 5 ? 'none' : 'flex'
  // step 1=email, 2=OTP sent, 3/3.5=enter OTP (wrong), 4=new password
  const active = { 1:1, 2:2, 3:3, 3.5:3, 4:4, 5:4 }[step] || 1
  for (let i = 1; i <= 4; i++) {
    const d = document.getElementById('fp-dot-' + i)
    if (!d) continue
    d.className = 'fp-dot' + (i === active ? ' active' : i < active ? ' done' : '')
  }
}

async function fpS1Submit() {
  if (window._fpBusy.s1) return // already submitting — ignore re-entrant calls (e.g. double Enter)
  const emailEl = document.getElementById('fp-s1-email')
  const errEl   = document.getElementById('fp-s1-error')
  const btn     = document.getElementById('fp-s1-btn')
  emailEl.classList.remove('error'); errEl.classList.remove('show')
  if (!emailEl.value.trim()) { emailEl.classList.add('error'); errEl.classList.add('show'); emailEl.focus(); return }

  // Client-side pre-check purely for snappy UI (no round trip needed to know
  // we're still cooling down). The real, unbypassable enforcement happens
  // server-side against the database in forgot-password.php. No red error
  // banner here — the gray countdown row + disabled button already say
  // "you're waiting", so just quietly do nothing (this mainly guards the
  // Enter-key path, since that bypasses the disabled Submit button).
  if (fpCooldownRemainingFor(emailEl.value.trim()) > 0) return

  window._fpBusy.s1 = true
  window._fpEmail = emailEl.value.trim()
  btn.disabled = true; btn.innerHTML = '<div class="fp-spinner"></div> Sending…'
  try {
    const res  = await fetch('api/auth/forgot-password.php', {
      method: 'POST', headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({ email: window._fpEmail }),
    })
    const data = await res.json()
    if (!data.success) {
      // Cooldown rejection isn't a "real" error — sync the timer row to the
      // server's authoritative remaining time and leave it at that, same as
      // the quiet client-side path above. Only genuine failures (bad email,
      // account not found, server error) get the red banner below.
      if (data.cooldown && data.retryAfter) {
        fpStartResendCooldown(window._fpEmail, data.retryAfter)
        return
      }
      emailEl.classList.add('error')
      errEl.textContent = data.message || 'Failed to send email. Please try again.'
      errEl.classList.add('show')
      return
    }
    fpStartResendCooldown(window._fpEmail, data.cooldownSeconds || 60)
    document.getElementById('fp-s2-email').textContent = window._fpEmail
    document.getElementById('fp-s3-email').textContent = window._fpEmail
    document.querySelectorAll('#fp-otp-row .otp-input').forEach(i => { i.value = ''; i.classList.remove('error') })
    fpGoToStep(2)
  } catch (_) {
    errEl.textContent = 'Network error. Please check your connection.'
    errEl.classList.add('show')
  } finally {
    // Don't force-enable here — if a cooldown just started (or is still
    // running), it must stay disabled. fpSyncS1Cooldown() re-derives the
    // correct disabled state instead of blindly clearing it.
    window._fpBusy.s1 = false
    btn.innerHTML = 'Submit'
    fpSyncS1Cooldown()
  }
}

async function fpS3Submit() {
  if (window._fpBusy.s3) return // already verifying — ignore re-entrant calls
  const inputs = document.querySelectorAll('#fp-otp-row .otp-input')
  const errEl  = document.getElementById('fp-s3-error')
  const btn    = document.getElementById('fp-s3-btn')
  const code   = [...inputs].map(i => i.value).join('')
  inputs.forEach(i => i.classList.remove('error')); errEl.classList.remove('show')
  if (code.length < 6) { inputs.forEach(i => { if (!i.value) i.classList.add('error') }); errEl.classList.add('show'); return }
  // See fpS1Submit()'s comment — reused here so a verify left in flight
  // when the flow is abandoned (Back to Login, then Forgot Password?
  // again) doesn't advance a freshly-reset screen to step 4.
  const myFlow = window._fpFlowId
  window._fpBusy.s3 = true
  btn.disabled = true; btn.innerHTML = '<div class="fp-spinner"></div> Verifying…'
  try {
    const res  = await fetch('api/auth/verify-otp.php', {
      method: 'POST', headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({ email: window._fpEmail, otp: code }),
    })
    const data = await res.json()
    if (myFlow !== window._fpFlowId) return // stale — screen was reopened while this was in flight
    if (!data.success) {
      window._fpBusy.s3 = false
      btn.disabled = false; btn.innerHTML = 'Verify OTP'
      fpShowWrongOTP(!!data.locked, data.attemptsLeft ?? null, !!data.banned, data.message || null)
      fpGoToStep(3.5)
      return
    }
    window._fpResetToken = data.token
    clearInterval(window._fpTimerInterval)
    document.querySelectorAll('#fp-otp-row .otp-input').forEach(i => { i.value = ''; i.classList.remove('error') })
    document.getElementById('fp-s3-error').classList.remove('show')
    window._fpBusy.s3 = false
    btn.disabled = false; btn.innerHTML = 'Verify OTP'
    fpGoToStep(4)
  } catch (_) {
    if (myFlow !== window._fpFlowId) return // stale — see above
    errEl.textContent = 'Network error. Please try again.'
    errEl.classList.add('show')
    window._fpBusy.s3 = false
    btn.disabled = false; btn.innerHTML = 'Verify OTP'
  }
}

async function fpS4Submit() {
  if (window._fpBusy.s4) return // already saving — ignore re-entrant calls (form's Enter-to-submit bypasses the disabled button)
  const pw1  = document.getElementById('fp-s4-pw1')
  const pw2  = document.getElementById('fp-s4-pw2')
  const err1 = document.getElementById('fp-s4-err1')
  const err2 = document.getElementById('fp-s4-err2')
  const btn  = document.getElementById('fp-s4-btn')
  pw1.classList.remove('error'); pw2.classList.remove('error'); err1.classList.remove('show'); err2.classList.remove('show')
  let valid = true
  if (!pw1.value) { pw1.classList.add('error'); err1.textContent = 'Please enter a new password.'; err1.classList.add('show'); valid = false }
  else if (!pwPolicyValid(pw1.value)) { pw1.classList.add('error'); err1.textContent = 'Password must be at least 8 characters and include a lowercase letter, an uppercase letter, a number, and a special character.'; err1.classList.add('show'); valid = false }
  if (!pw2.value) { pw2.classList.add('error'); err2.textContent = 'Please confirm your password.'; err2.classList.add('show'); valid = false }
  else if (pw1.value && pw2.value !== pw1.value) { pw2.classList.add('error'); err2.textContent = 'Passwords do not match.'; err2.classList.add('show'); valid = false }
  if (!valid) return
  // See fpS1Submit()'s comment.
  const myFlow = window._fpFlowId
  window._fpBusy.s4 = true
  btn.disabled = true; btn.innerHTML = '<div class="fp-spinner"></div> Saving…'
  try {
    const res  = await fetch('api/auth/reset-password.php', {
      method: 'POST', headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({ token: window._fpResetToken, password: pw1.value }),
    })
    const data = await res.json()
    if (myFlow !== window._fpFlowId) return // stale — screen was reopened while this was in flight
    if (!data.success) {
      err1.textContent = data.message || 'Password reset failed. Please start over.'
      err1.classList.add('show')
      pw1.classList.add('error')
      return
    }
    fpGoToStep(5)
  } catch (_) {
    if (myFlow !== window._fpFlowId) return // stale — see above
    err1.textContent = 'Network error. Please try again.'
    err1.classList.add('show')
  } finally {
    if (myFlow !== window._fpFlowId) return // stale — don't clobber a fresh attempt's own state
    window._fpBusy.s4 = false
    btn.disabled = false; btn.innerHTML = 'Reset Password'
  }
}

function fpShowWrongOTP(locked, attemptsLeft, banned = false, serverMessage = null) {
  const title   = document.getElementById('fp-3b-title')
  const msg     = document.getElementById('fp-3b-msg')
  const retry   = document.getElementById('fp-3b-retry')
  const newCode = document.getElementById('fp-3b-new-code')
  const backBtn = document.getElementById('fp-3b-back-login')
  if (!title || !msg || !retry || !newCode) return
  if (backBtn) backBtn.style.display = 'none'
  if (banned) {
    title.textContent     = 'Reset Temporarily Blocked'
    msg.textContent       = 'Too many failed OTP attempts. Please wait 1 hour before requesting a new password reset.'
    retry.style.display   = 'none'
    newCode.style.display = 'none'
    if (backBtn) backBtn.style.display = 'block'
  } else if (locked) {
    title.textContent        = 'Too Many Attempts'
    msg.textContent          = 'You\'ve used all 5 attempts. Please request a new code to try again.'
    retry.style.display      = 'none'
    newCode.style.display    = 'block'
  } else if (attemptsLeft === null || attemptsLeft === undefined) {
    // No attempts count came back from the server — this isn't a wrong-code
    // response, it's an error/expired/missing-row state. Show the real reason
    // instead of guessing, and point the user at requesting a fresh code
    // rather than a pointless "Try Again" on a code that can't succeed.
    title.textContent        = 'Code Expired or Invalid'
    msg.textContent          = serverMessage || 'This code is no longer valid. Please request a new one.'
    retry.style.display      = 'none'
    newCode.style.display    = 'block'
  } else {
    const left   = attemptsLeft
    const plural = left === 1 ? 'attempt' : 'attempts'
    title.textContent        = 'Invalid OTP Code'
    msg.textContent          = `The code you entered is incorrect. You have ${left} ${plural} remaining.`
    retry.style.display      = 'block'
    newCode.style.display    = 'none'
  }
}

function fpRestartFromLocked() {
  clearInterval(window._fpTimerInterval)
  clearInterval(window._fpResendCooldownInterval)
  try { localStorage.removeItem(FP_COOLDOWN_STORAGE_KEY) } catch (_) {}
  window._fpTimeLeft = 0
  document.querySelectorAll('#fp-otp-row .otp-input').forEach(i => { i.value = ''; i.classList.remove('error') })
  const resendBtn = document.querySelector('.fp-resend-link')
  if (resendBtn) { resendBtn.disabled = false; resendBtn.textContent = 'Resend Code' }
  fpGoToStep(1)
  fpSyncS1Cooldown()
}

function fpRetryOTP() {
  document.querySelectorAll('#fp-otp-row .otp-input').forEach(i => { i.value = ''; i.classList.remove('error') })
  document.getElementById('fp-s3-error').classList.remove('show')
  document.getElementById('fp-s3-btn').disabled = false
  document.getElementById('fp-s3-btn').innerHTML = 'Verify OTP'
  // Timer keeps running — don't reset it. The interval never stopped while on the
  // wrong-OTP screen, so the countdown and expired state are already correct.
  const cur = document.getElementById('fp-step-3b')
  cur.style.opacity = '0'
  setTimeout(() => {
    cur.classList.remove('active'); cur.style.display = 'none'; window._fpStep = 3
    const next = document.getElementById('fp-step-3')
    next.style.opacity = '0'; next.style.display = 'block'
    requestAnimationFrame(() => requestAnimationFrame(() => { next.style.transition = 'opacity 0.3s ease'; next.style.opacity = '1'; next.classList.add('active') }))
  }, 300)
}

async function fpResendOTP() {
  if (window._fpBusy.resend) return // already resending — ignore re-entrant calls
  if (fpCooldownRemainingFor(window._fpEmail) > 0) return
  const errEl = document.getElementById('fp-s3-error')
  const resendBtn = document.querySelector('.fp-resend-link')
  errEl.classList.remove('show')
  window._fpBusy.resend = true
  const prevLabel = resendBtn ? resendBtn.textContent : 'Resend Code'
  if (resendBtn) { resendBtn.disabled = true; resendBtn.textContent = 'Sending…' }
  let data
  try {
    const res  = await fetch('api/auth/forgot-password.php', {
      method: 'POST', headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({ email: window._fpEmail }),
    })
    data = await res.json()
    if (!data.success) {
      if (data.banned) {
        clearInterval(window._fpTimerInterval)
        fpShowWrongOTP(false, null, true)
        fpGoToStep(3.5)
        return
      }
      // Server-enforced cooldown (its clock, not the client's) — sync the
      // local cache/button state and stop there, same as the rest of the
      // app: the "Resend in 0:XX" button label is enough, no need to also
      // pop a red error banner for a state the button already communicates.
      if (data.cooldown && data.retryAfter) {
        fpStartResendCooldown(window._fpEmail, data.retryAfter)
        return
      }
      // Resend didn't actually go through (e.g. hit its own rate limit) —
      // don't pretend a new code was sent. Leave the existing countdown and
      // inputs alone and surface the real reason instead.
      errEl.textContent = data.message || 'Failed to resend code. Please try again.'
      errEl.classList.add('show')
      if (resendBtn) { resendBtn.disabled = false; resendBtn.textContent = prevLabel }
      return
    }
  } catch (_) {
    errEl.textContent = 'Network error. Please try again.'
    errEl.classList.add('show')
    if (resendBtn) { resendBtn.disabled = false; resendBtn.textContent = prevLabel }
    return
  } finally {
    window._fpBusy.resend = false
  }
  // Only reached once the resend is confirmed successful.
  fpStartResendCooldown(window._fpEmail, data.cooldownSeconds || 60)
  document.querySelectorAll('#fp-otp-row .otp-input').forEach(i => { i.value = ''; i.classList.remove('error') })
  document.querySelectorAll('#fp-otp-row .otp-input')[0].focus()
  fpStartTimer()
}

function fpStartTimer() {
  clearInterval(window._fpTimerInterval)
  window._fpTimeLeft = 300

  // Rebuild the timer markup every time this runs. A previous expiry (this
  // email or an earlier one) replaces #fp-otp-timer's innerHTML with "Code
  // expired", which destroys the #fp-timer-display span tick() depends on —
  // without restoring it here, the next attempt's countdown silently never
  // starts and the screen is stuck showing the old "Code expired" state.
  const timerEl = document.getElementById('fp-otp-timer')
  if (timerEl) {
    timerEl.classList.remove('expired')
    timerEl.innerHTML = '<svg viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2" width="13" height="13"><circle cx="12" cy="12" r="10"/><polyline points="12 6 12 12 16 14"/></svg> Expires in <span id="fp-timer-display">5:00</span>'
  }

  function tick() {
    const display = document.getElementById('fp-timer-display')
    const timerEl = document.getElementById('fp-otp-timer')
    if (!display) { clearInterval(window._fpTimerInterval); return }
    const m = Math.floor(window._fpTimeLeft / 60), s = window._fpTimeLeft % 60
    display.textContent = m + ':' + String(s).padStart(2, '0')
    if (window._fpTimeLeft <= 0) {
      clearInterval(window._fpTimerInterval)
      timerEl.classList.add('expired')
      timerEl.innerHTML = '<svg viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2" width="13" height="13"><circle cx="12" cy="12" r="10"/><polyline points="12 6 12 12 16 14"/></svg> Code expired'
    }
    window._fpTimeLeft--
  }
  tick()
  window._fpTimerInterval = setInterval(tick, 1000)
}

// Keeps step 1's Submit button + live countdown in sync with the cooldown
// for whatever email is currently typed in the field — NOT a global switch,
// so typing a different (non-cooling-down) email re-enables Submit right away.
function fpSyncS1Cooldown() {
  const btn     = document.getElementById('fp-s1-btn')
  const row     = document.getElementById('fp-s1-cooldown-row')
  const timer   = document.getElementById('fp-s1-cooldown-timer')
  const emailEl = document.getElementById('fp-s1-email')
  if (!btn || !row || !timer) return
  const s = fpCooldownRemainingFor(emailEl ? emailEl.value.trim() : '')
  if (s > 0) {
    btn.disabled = true
    row.style.display = 'block'
    timer.textContent = '0:' + String(s).padStart(2, '0')
  } else {
    btn.disabled = false
    row.style.display = 'none'
  }
}

function fpStartResendCooldown(email, seconds) {
  const secs = Number(seconds) > 0 ? Number(seconds) : 60
  const rec  = { email: (email || window._fpEmail || '').trim().toLowerCase(), end: Date.now() + secs * 1000 }
  try { localStorage.setItem(FP_COOLDOWN_STORAGE_KEY, JSON.stringify(rec)) } catch (_) { /* localStorage unavailable — cooldown still works for this tab session */ }
  fpRunResendCooldownTicker()
}

// Shared ticker used both when a fresh cooldown starts and when an
// in-progress one is restored after a refresh — keeps both paths in sync.
// Reads the stored record fresh each tick (instead of a plain decrementing
// counter) so it always reflects the correct email + correct remaining time.
function fpRunResendCooldownTicker() {
  clearInterval(window._fpResendCooldownInterval)
  function tick() {
    const rec = fpGetCooldownRecord()
    const remaining = rec ? Math.max(0, Math.ceil((rec.end - Date.now()) / 1000)) : 0

    // Step 3's "Resend Code" button applies to the email of the flow
    // currently open, not necessarily the one that started the cooldown.
    const resendBtn = document.querySelector('.fp-resend-link')
    if (resendBtn) {
      const s = fpCooldownRemainingFor(window._fpEmail)
      resendBtn.disabled = s > 0
      resendBtn.textContent = s > 0 ? ('Resend in 0:' + String(s).padStart(2, '0')) : 'Resend Code'
    }
    fpSyncS1Cooldown()

    if (remaining <= 0) {
      clearInterval(window._fpResendCooldownInterval)
      if (rec) { try { localStorage.removeItem(FP_COOLDOWN_STORAGE_KEY) } catch (_) {} }
    }
  }
  tick()
  window._fpResendCooldownInterval = setInterval(tick, 1000)
}

// Runs as soon as this script loads (including after a hard refresh) so a
// cooldown that was still counting down before the reload keeps counting
// down instead of vanishing. The ticker itself reads the stored record and
// its email, so this just needs to kick it off when a live record exists.
function fpRestoreResendCooldown() {
  const rec = fpGetCooldownRecord()
  if (rec && rec.end > Date.now()) fpRunResendCooldownTicker()
  else if (rec) { try { localStorage.removeItem(FP_COOLDOWN_STORAGE_KEY) } catch (_) {} }
}
fpRestoreResendCooldown()

// ── Email Verification Screen ─────────────────────────────────────
let _evEmail = ''
let _evFromReg = false
let _evTimerInterval = null
let _evResendCooldownInterval = null
let _evResendCooldownLeft = 0
let _evBusy = false
// Same purpose as window._fpFlowId — bumped whenever showEmailVerify()
// (re-)opens for a genuinely different attempt, so a stale resend/email-
// edit/verify response can't mutate a screen the user has since left and
// reopened for something else. Not bumped when it's a reopen for the exact
// same email with a verify still running — see the sameOngoing check below.
let _evFlowId = 0

function showEmailVerify(email, fromRegistration = false) {
  // A verify already running for this *same* email keeps going naturally
  // instead of being reset/discarded — same reasoning as forgot-password's
  // step 1 (see showForgotPassword()). But if this is for a *different*
  // email (a separate, unrelated verification attempt — e.g. a second
  // login elsewhere), the old one must not be allowed to resolve into a
  // login/boot for the wrong account, so that case still gets a full reset.
  const sameOngoing = _evBusy && _evEmail === email
  _evEmail   = email
  _evFromReg = fromRegistration

  _syncAuthBranding()
  document.getElementById('login-screen').style.display    = 'none'
  document.getElementById('register-screen').style.display = 'none'
  document.getElementById('forgot-screen').style.display   = 'none'
  document.getElementById('verify-screen').style.display   = 'flex'

  document.getElementById('ev-email-display').textContent = email

  // Reset to step 1
  evShowStep(1)
  evCancelEditEmail()

  // Editing only makes sense for a pending registration (there's a row in
  // pending_registrations to update) — the login "needsVerification" path
  // isn't backed by one, so hide the trigger there.
  const editRow = document.getElementById('ev-edit-email-trigger-row')
  if (editRow) editRow.style.display = fromRegistration ? '' : 'none'

  if (sameOngoing) return // leave OTP boxes, error, button, and timer exactly as they are

  _evFlowId++

  // Clear OTP inputs
  document.querySelectorAll('#ev-otp-row .otp-input').forEach(i => { i.value = ''; i.classList.remove('error') })
  document.getElementById('ev-error').classList.remove('show')

  // Reset resend button and any running cooldown
  clearInterval(_evResendCooldownInterval)
  _evResendCooldownInterval = null
  _evResendCooldownLeft = 0
  const resendBtn = document.getElementById('ev-resend-btn')
  if (resendBtn) { resendBtn.disabled = false; resendBtn.textContent = 'Resend Code' }

  // Start countdown
  _evStartTimer(300)

  // Focus first input
  setTimeout(() => {
    const first = document.querySelector('#ev-otp-row .otp-input')
    if (first) first.focus()
  }, 50)
}
window.showEmailVerify = showEmailVerify

function evShowStep(n) {
  document.querySelectorAll('#verify-screen .fp-step').forEach(s => {
    s.classList.remove('active')
    s.style.display = 'none'
    s.style.opacity = '0'
  })
  const step = document.getElementById('ev-step-' + n)
  if (!step) return
  step.style.display = 'block'
  requestAnimationFrame(() => requestAnimationFrame(() => {
    step.style.transition = 'opacity 0.3s ease'
    step.style.opacity    = '1'
    step.classList.add('active')
  }))
}
window.evShowStep = evShowStep

function _evStartTimer(seconds) {
  _evStopTimer()
  let remaining = seconds
  const display  = document.getElementById('ev-timer-display')
  const timerEl  = document.getElementById('ev-timer')

  function tick() {
    if (!display || !display.isConnected) { _evStopTimer(); return }
    const m = Math.floor(remaining / 60)
    const s = remaining % 60
    display.textContent = m + ':' + String(s).padStart(2, '0')
    if (remaining <= 0) {
      _evStopTimer()
      if (timerEl) timerEl.classList.add('expired')
      display.textContent = 'Expired'
      return
    }
    remaining--
  }
  tick()
  _evTimerInterval = setInterval(tick, 1000)
}

function _evStopTimer() {
  if (_evTimerInterval) { clearInterval(_evTimerInterval); _evTimerInterval = null }
  clearInterval(_evResendCooldownInterval)
  _evResendCooldownInterval = null
  _evResendCooldownLeft = 0
}

function _evStartResendCooldown() {
  const btn = document.getElementById('ev-resend-btn')
  if (!btn) return
  clearInterval(_evResendCooldownInterval)
  _evResendCooldownLeft = 60
  btn.disabled = true
  function tick() {
    if (!btn.isConnected) { clearInterval(_evResendCooldownInterval); _evResendCooldownLeft = 0; return }
    if (_evResendCooldownLeft <= 0) {
      clearInterval(_evResendCooldownInterval)
      btn.disabled = false
      btn.textContent = 'Resend Code'
      return
    }
    btn.textContent = 'Resend in 0:' + String(_evResendCooldownLeft).padStart(2, '0')
    _evResendCooldownLeft--
  }
  tick()
  _evResendCooldownInterval = setInterval(tick, 1000)
}

async function evSubmitOTP() {
  if (_evBusy) return // already verifying — ignore re-entrant calls (this had no such guard before)
  const inputs = document.querySelectorAll('#ev-otp-row .otp-input')
  const otp    = [...inputs].map(i => i.value).join('')
  const errEl  = document.getElementById('ev-error')

  if (otp.length < 6) {
    errEl.textContent = 'Please enter the complete 6-digit code.'
    errEl.classList.add('show')
    inputs.forEach(i => i.classList.add('error'))
    return
  }
  errEl.classList.remove('show')
  inputs.forEach(i => i.classList.remove('error'))

  const btn = document.getElementById('ev-submit-btn')
  // Captured before the request goes out — see showEmailVerify()'s
  // sameOngoing comment. A reopen for the exact same email doesn't bump
  // this, so this verify keeps going and resolves normally; a reopen for a
  // different email does, so this stale one gets discarded below instead
  // of potentially booting the wrong account.
  const myFlow = _evFlowId
  _evBusy = true
  if (btn) { btn.disabled = true; btn.textContent = 'Verifying…' }

  try {
    const res  = await fetch('api/auth/verify-email-otp.php', {
      method:  'POST',
      headers: { 'Content-Type': 'application/json' },
      body:    JSON.stringify({ email: _evEmail, otp }),
    })
    const data = await res.json()
    if (myFlow !== _evFlowId) return // stale — a different verification attempt has since started

    if (!data.success) {
      const title   = document.getElementById('ev-2-title')
      const msg     = document.getElementById('ev-2-msg')
      const retry   = document.getElementById('ev-2-retry')
      const resend  = document.getElementById('ev-2-resend')

      if (data.banned) {
        if (title) title.textContent = 'Registration Blocked'
        if (msg)   msg.textContent   = 'Too many failed attempts. Please go back and register again with a valid email address.'
        if (retry)  retry.style.display  = 'none'
        if (resend) resend.style.display = 'none'
      } else if (data.locked) {
        if (title) title.textContent = 'Too Many Attempts'
        if (msg)   msg.textContent   = 'You\'ve entered the wrong code too many times. Request a new code to try again.'
        if (retry)  retry.style.display  = 'none'
        if (resend) resend.style.display = 'block'
      } else {
        if (title) title.textContent = 'Invalid OTP Code'
        if (msg)   msg.textContent   = data.message || 'The code you entered is incorrect. Please try again.'
        if (retry)  retry.style.display  = 'block'
        if (resend) resend.style.display = 'none'
      }

      inputs.forEach(i => { i.value = ''; i.classList.remove('error') })
      evShowStep(2)
      return
    }

    // Success — show success step briefly then boot
    _evStopTimer()
    evShowStep(3)

    // Push to patients array if this was a self-registration flow
    if (_evFromReg) {
      const p = data.user
      patients.push({
        id: p.id, firstName: p.firstName, lastName: p.lastName,
        name: p.name, gender: p.gender, dob: p.dob, age: p.age,
        contact: p.contact, email: p.email, password: '',
        address: p.address,
        registeredDate: p.registeredDate, lastVisit: '—',
        qrData: p.qrData, status: 'active', occupation: '',
        consultations: [], examinations: [], prescriptions: [],
      })
    }

    setTimeout(() => {
      _bootAfterAuth(data.role, data.user)
      if (_evFromReg) {
        setTimeout(() => window._showRegistrationQRModal(data.user, null, true), 200)
      }
    }, 900)

  } catch (_) {
    if (myFlow !== _evFlowId) return // stale — see above
    errEl.textContent = 'Network error. Please check your connection and try again.'
    errEl.classList.add('show')
  } finally {
    if (myFlow !== _evFlowId) return // stale — don't clobber a fresh attempt's own state
    _evBusy = false
    if (btn) { btn.disabled = false; btn.textContent = 'Verify & Activate Account' }
  }
}
window.evSubmitOTP = evSubmitOTP

async function evResendCode() {
  if (_evResendCooldownLeft > 0) return

  const errEl = document.getElementById('ev-error')
  errEl.classList.remove('show')

  const myFlow = _evFlowId // see showEmailVerify()'s sameOngoing comment
  _evStartResendCooldown()
  const resendBtn = document.getElementById('ev-resend-btn')
  if (resendBtn) resendBtn.textContent = 'Sending…'

  try {
    const res  = await fetch('api/auth/send-email-verification.php', {
      method:  'POST',
      headers: { 'Content-Type': 'application/json' },
      body:    JSON.stringify({ email: _evEmail }),
    })
    const data = await res.json()
    if (myFlow !== _evFlowId) return // stale — screen was reopened for a different attempt

    if (!data.success) {
      if (data.banned) {
        const title  = document.getElementById('ev-2-title')
        const msg    = document.getElementById('ev-2-msg')
        const retry  = document.getElementById('ev-2-retry')
        const resend = document.getElementById('ev-2-resend')
        if (title)  title.textContent  = 'Registration Blocked'
        if (msg)    msg.textContent    = 'Too many failed attempts. Please go back and register again with a valid email address.'
        if (retry)  retry.style.display  = 'none'
        if (resend) resend.style.display = 'none'
        evShowStep(2)
        return
      }
      errEl.textContent = data.message || 'Failed to resend code. Please try again.'
      errEl.classList.add('show')
      return
    }

    // Success — reset inputs and restart OTP expiry timer; cooldown already running
    document.querySelectorAll('#ev-otp-row .otp-input').forEach(i => { i.value = ''; i.classList.remove('error') })
    document.querySelector('#ev-otp-row .otp-input')?.focus()
    _evStartTimer(300)

  } catch (_) {
    if (myFlow !== _evFlowId) return // stale — see above
    errEl.textContent = 'Network error. Please try again.'
    errEl.classList.add('show')
  }
}
window.evResendCode = evResendCode

// ── Edit pending email (fix a typo without restarting registration) ────
function evStartEditEmail() {
  // Deliberately leave the countdown running in the background — the
  // original OTP is still the one that's valid until Save actually
  // sends a new one, so the displayed timer should keep reflecting that.
  document.getElementById('ev-otp-group').style.display = 'none'
  document.getElementById('ev-edit-email-group').style.display = 'block'
  document.getElementById('ev-edit-email-trigger-row').style.display = 'none'
  // Cancel (inside the edit form's own button row) is now the one back-style
  // action on screen — hide the standalone Back to Login link so there
  // aren't two competing exits shown at once.
  document.getElementById('ev-back-login-row').style.display = 'none'
  // Swap the heading too — otherwise it keeps describing the OTP step
  // ("We've sent a code to...") while the form on screen is for editing
  // the address that code was sent to.
  document.getElementById('ev-header-otp').style.display = 'none'
  document.getElementById('ev-header-edit').style.display = ''

  const input = document.getElementById('ev-new-email-input')
  const errEl = document.getElementById('ev-edit-email-error')
  input.value = _evEmail
  errEl.textContent = ''
  errEl.classList.remove('show')
  setTimeout(() => { input.focus(); input.select() }, 50)
}
window.evStartEditEmail = evStartEditEmail

function evCancelEditEmail() {
  const editGroup = document.getElementById('ev-edit-email-group')
  const otpGroup  = document.getElementById('ev-otp-group')
  if (!editGroup || !otpGroup) return

  editGroup.style.display = 'none'
  otpGroup.style.display  = ''
  document.getElementById('ev-back-login-row').style.display = ''
  document.getElementById('ev-header-edit').style.display = 'none'
  document.getElementById('ev-header-otp').style.display  = ''
  if (_evFromReg) document.getElementById('ev-edit-email-trigger-row').style.display = ''
}
window.evCancelEditEmail = evCancelEditEmail

async function evSaveEditEmail() {
  const input    = document.getElementById('ev-new-email-input')
  const errEl    = document.getElementById('ev-edit-email-error')
  const saveBtn  = document.getElementById('ev-save-email-btn')
  const newEmail = input.value.trim().toLowerCase()

  errEl.textContent = ''
  errEl.classList.remove('show')

  if (!newEmail || !/^[^\s@]+@[^\s@]+\.[^\s@]+$/.test(newEmail)) {
    errEl.textContent = 'Please enter a valid email address.'
    errEl.classList.add('show')
    input.focus()
    return
  }

  if (newEmail === _evEmail.toLowerCase()) {
    // Nothing changed — just go back to the OTP step as-is.
    evCancelEditEmail()
    return
  }

  const myFlow = _evFlowId // see showEmailVerify()'s sameOngoing comment
  saveBtn.disabled = true
  saveBtn.textContent = 'Saving…'

  try {
    const res  = await fetch('api/auth/update-pending-email.php', {
      method:  'POST',
      headers: { 'Content-Type': 'application/json' },
      body:    JSON.stringify({ email: _evEmail, newEmail }),
    })
    const data = await res.json()
    if (myFlow !== _evFlowId) return // stale — screen was reopened for a different attempt

    if (!data.success) {
      errEl.textContent = data.message || 'Could not update your email. Please try again.'
      errEl.classList.add('show')
      return
    }

    _evEmail = data.email
    document.getElementById('ev-email-display').textContent = data.email

    // Fresh OTP was sent to the new address — reset the entry UI same as a resend.
    document.querySelectorAll('#ev-otp-row .otp-input').forEach(i => { i.value = ''; i.classList.remove('error') })
    document.getElementById('ev-error').classList.remove('show')
    clearInterval(_evResendCooldownInterval)
    _evResendCooldownInterval = null
    _evResendCooldownLeft = 0
    const resendBtn = document.getElementById('ev-resend-btn')
    if (resendBtn) { resendBtn.disabled = false; resendBtn.textContent = 'Resend Code' }
    _evStartTimer(300)

    evCancelEditEmail()
    setTimeout(() => document.querySelector('#ev-otp-row .otp-input')?.focus(), 50)

  } catch (_) {
    if (myFlow !== _evFlowId) return // stale — see above
    errEl.textContent = 'Network error. Please try again.'
    errEl.classList.add('show')
  } finally {
    if (myFlow !== _evFlowId) return // stale — don't clobber a fresh attempt's own state
    saveBtn.disabled = false
    saveBtn.textContent = 'Save & Resend Code'
  }
}
window.evSaveEditEmail = evSaveEditEmail

// Init OTP inputs for email verify screen
;(function() {
  function setupEvOTP() {
    const inputs = document.querySelectorAll('#ev-otp-row .otp-input')
    inputs.forEach((input, idx) => {
      input.addEventListener('input', e => {
        const val = e.target.value.replace(/\D/g, '')
        e.target.value = val ? val[0] : ''
        if (val && idx < 5) inputs[idx + 1].focus()
      })
      input.addEventListener('keydown', e => {
        if (e.key === 'Backspace' && !e.target.value && idx > 0) inputs[idx - 1].focus()
        if (e.key === 'Enter') evSubmitOTP()
      })
      input.addEventListener('paste', e => {
        e.preventDefault()
        const pasted = (e.clipboardData || window.clipboardData).getData('text').replace(/\D/g, '')
        ;[...pasted].slice(0, 6).forEach((ch, i) => { if (inputs[idx + i]) inputs[idx + i].value = ch })
        inputs[Math.min(idx + pasted.length, 5)].focus()
      })
    })
  }
  if (document.readyState === 'loading') document.addEventListener('DOMContentLoaded', setupEvOTP)
  else setupEvOTP()
})()

// Init OTP inputs for forgot-password
;(function() {
  function setupFpOTP() {
    const inputs = document.querySelectorAll('#fp-otp-row .otp-input')
    inputs.forEach((input, idx) => {
      input.addEventListener('input', e => {
        const val = e.target.value.replace(/\D/g, '')
        e.target.value = val ? val[0] : ''
        if (val && idx < 5) inputs[idx + 1].focus()
      })
      input.addEventListener('keydown', e => { if (e.key === 'Backspace' && !e.target.value && idx > 0) inputs[idx - 1].focus() })
      input.addEventListener('paste', e => {
        e.preventDefault()
        const pasted = (e.clipboardData || window.clipboardData).getData('text').replace(/\D/g, '')
        ;[...pasted].slice(0, 6).forEach((ch, i) => { if (inputs[idx + i]) inputs[idx + i].value = ch })
        inputs[Math.min(idx + pasted.length, 5)].focus()
      })
    })
  }
  if (document.readyState === 'loading') document.addEventListener('DOMContentLoaded', setupFpOTP)
  else setupFpOTP()
})()

;(function() {
  function setupRegInputClear() {
    const screen = document.getElementById('register-screen')
    if (!screen) return
    screen.addEventListener('input', function(e) {
      if (e.target.classList.contains('reg-input')) e.target.classList.remove('error')
    })
  }
  if (document.readyState === 'loading') document.addEventListener('DOMContentLoaded', setupRegInputClear)
  else setupRegInputClear()
})()

function fpTogglePw(inputId, iconId) {
  const EYE_OPEN   = '<path d="M1 12s4-8 11-8 11 8 11 8-4 8-11 8-11-8-11-8z"/><circle cx="12" cy="12" r="3"/>'
  const EYE_CLOSED = '<path d="M1 12s4-8 11-8 11 8 11 8-4 8-11 8-11-8-11-8z"/><circle cx="12" cy="12" r="3"/><line x1="2" y1="2" x2="22" y2="22"/>'
  const input = document.getElementById(inputId)
  const icon  = document.getElementById(iconId)
  // FB-style: full eye + diagonal slash = hidden (default), plain open eye = revealed after click.
  // Same active-orange convention as togglePwVisibility()/toggleLoginPw()
  // (main.js) — stays colored the whole time the password is visible, not
  // just on hover.
  const btn = icon.closest('.fp-pw-eye')
  if (input.type === 'password') { input.type = 'text'; icon.innerHTML = EYE_OPEN;   if (btn) btn.style.color = '#E8760A' }
  else                            { input.type = 'password'; icon.innerHTML = EYE_CLOSED; if (btn) btn.style.color = '' }
}

// ── Private helpers ───────────────────────────────────────────────
function _bootAfterAuth(role, user) {
  // Fresh session — clear the "already handled a forced logout" latch
  // (_handleSessionRevoked) from any previous session, so a future
  // revocation this session can trigger it again.
  _sessionRevokedHandled = false
  // Mark this device as having a real signed-in session — see
  // HAD_SESSION_KEY's own comment for why restoreSession() needs this.
  try { localStorage.setItem(HAD_SESSION_KEY, '1') } catch (_) {}

  window.state.role         = role
  window.state.user         = user
  window.state.selectedRole = role

  document.getElementById('login-screen').style.display    = 'none'
  document.getElementById('register-screen').style.display = 'none'
  document.getElementById('verify-screen').style.display   = 'none'
  document.getElementById('app-shell').style.display       = 'flex'
  _evStopTimer()

  window.bootShell(role, user)

  // Load real data from backend (non-blocking)
  _syncAppointments()
  _syncNotifications().then(() => _startSystemPolling())
  _syncClinicSettings()
  _syncServices()
  if (role === 'admin') { _syncActivityLog(); _syncStaff(); _syncArchives() }
  if (role === 'staff') _syncStaff()
  if (['admin', 'staff', 'doctor'].includes(role)) _syncPatients()
  if (['admin', 'staff'].includes(role)) _syncWaitlist()
  if (role === 'patient') _syncMyRecords()
  // Doctors array (incl. schedule/availability/blocked dates) — every role needs
  // a synced copy, not just staff: patients book against it, doctors see their
  // own panel. Patients hit the public endpoint since they're not authorized
  // for the admin/staff doctors/index.php route.
  _syncDoctors()
  if (['admin', 'staff'].includes(role)) _syncContactMessages()
}

// Cheap deep-equality check used by the background poll sync functions
// below to skip re-rendering (and its scroll/animation reset) when a poll
// comes back with data identical to what's already on screen.
function _pollDataChanged(prev, next) {
  try { return JSON.stringify(prev) !== JSON.stringify(next) }
  catch (_) { return true } // fail open — render rather than silently miss a real change
}

// Pages that show appointments list — need full re-render when data changes
const _APPT_PAGES = new Set([
  'appointments','patient-appts','doctor-appointments'
])

window._apptPendingCount     = 0
window._doctorTodayCount     = 0
window._doctorUpcomingCount  = 0
window._doctorApptAlertCount = 0

async function _syncAppointments(rerender = true) {
  try {
    const r = await fetch('api/appointments/index.php')
    if (!r.ok) return
    const d = await r.json()
    if (!d.success || !Array.isArray(d.appointments)) return
    const changed = _pollDataChanged(appointments, d.appointments)
    // Replace the mock array in-place so all existing references stay valid
    appointments.splice(0, appointments.length, ...d.appointments)
    _recomputeApptCounts()
    if (window._updateSidebarBadges) window._updateSidebarBadges()
    if (!changed) return
    const page = window.state?.page
    if (rerender && _APPT_PAGES.has(page)) { window.renderPage({ silent: true }); return }
    // Update dashboard stat cards and charts without a full re-render
    if (page === 'admin-dashboard' && window.updateAdminDashboard) window.updateAdminDashboard()
    if (page === 'staff-dashboard' && window.updateStaffDashboard) window.updateStaffDashboard()
    if (page === 'doctor-dashboard' && window.renderPage) window.renderPage({ silent: true })
    if (page === 'patient-dashboard' && window.renderPage) window.renderPage({ silent: true })
  } catch (_) { /* keep mock data on network failure */ }
}
window._syncAppointments = _syncAppointments

// ── Patients sync ────────────────────────────────────────────────
async function _syncPatients() {
  try {
    const r = await fetch('api/patients/index.php')
    if (!r.ok) return
    const d = await r.json()
    if (!d.success || !Array.isArray(d.patients)) return
    const changed = _pollDataChanged(patients, d.patients)
    patients.splice(0, patients.length, ...d.patients)
    if (!changed) return
    // Re-render page if it shows patients list
    const p = window.state?.page
    if (p === 'patient-list') { window.renderPage({ silent: true }); return }
    if (p === 'new-examination' && !window.state?.params?.patientId) { window.renderPage({ silent: true }); return }
    // Update dashboard stat without full re-render
    if (p === 'admin-dashboard' && window.updateAdminDashboard) window.updateAdminDashboard()
    if (p === 'staff-dashboard' && window.updateStaffDashboard) window.updateStaffDashboard()
    if (p === 'admin-users' && window.renderPage) window.renderPage({ silent: true })
  } catch (_) {}
}
window._syncPatients = _syncPatients

// ── Patient own records sync (examinations, prescriptions, consultations) ────
async function _syncMyRecords() {
  if (window.state?.role !== 'patient') return
  try {
    const r = await fetch('api/patients/me.php')
    if (!r.ok) return
    const d = await r.json()
    if (!d.success) return
    const exams = d.examinations  || []
    const rxs   = d.prescriptions || []
    const cons  = d.consultations || []
    const delAt  = d.deletionRequestedAt   || null
    const delRsn = d.deletionRequestReason || ''
    const noShowCount = d.noShowCount || 0
    const bookingRestricted = !!d.bookingRestricted
    // Captured before state.user is overwritten below — used for a
    // narrower, separate re-render trigger further down.
    const restrictionChanged = window.state.user?.bookingRestricted !== bookingRestricted
    const changed = _pollDataChanged(
      { examinations: window.state.user?.examinations, prescriptions: window.state.user?.prescriptions, consultations: window.state.user?.consultations,
        deletionRequestedAt: window.state.user?.deletionRequestedAt, deletionRequestReason: window.state.user?.deletionRequestReason,
        noShowCount: window.state.user?.noShowCount, bookingRestricted: window.state.user?.bookingRestricted },
      { examinations: exams, prescriptions: rxs, consultations: cons, deletionRequestedAt: delAt, deletionRequestReason: delRsn,
        noShowCount, bookingRestricted }
    )
    // Update state.user so the exam-history/prescriptions/consultations pages (which read user.examinations etc. directly) work
    if (window.state.user) {
      window.state.user.examinations  = exams
      window.state.user.prescriptions = rxs
      window.state.user.consultations = cons
      // Picks up admin/staff archiving or dismissing this patient's own
      // deletion request (api/archive/create.php, api/patients/dismiss-
      // deletion-request.php) — see the patient-settings re-render below,
      // which swaps the Settings > My Profile card back to "Request
      // Account Deletion" once this clears.
      window.state.user.deletionRequestedAt   = delAt
      window.state.user.deletionRequestReason = delRsn
      // Picks up admin clearing an online-booking restriction (or, in the
      // other direction, a new no-show pushing them past the threshold) —
      // see the patient-request-appt re-render below, which swaps the
      // "Online Booking Unavailable" screen for the real booking wizard
      // (or back) the moment this changes, no refresh needed.
      window.state.user.noShowCount       = noShowCount
      window.state.user.bookingRestricted = bookingRestricted
    }
    // Insert/update patient in patients[] so dashboard, exam-history, prescriptions pages work
    const uid = window.state.user?.id
    if (uid) {
      const idx = patients.findIndex(p => p.id === uid)
      if (idx >= 0) {
        patients[idx].examinations  = exams
        patients[idx].prescriptions = rxs
        patients[idx].consultations = cons
        patients[idx].noShowCount       = noShowCount
        patients[idx].bookingRestricted = bookingRestricted
      } else {
        patients.push({ ...window.state.user, examinations: exams, prescriptions: rxs, consultations: cons, noShowCount, bookingRestricted })
      }
    }
    const page = window.state?.page
    const dataPages = new Set(['patient-dashboard','patient-prescriptions','patient-exam-history','patient-consultations','patient-settings'])
    if (changed && dataPages.has(page)) window.renderPage({ silent: true })
    // Deliberately separate from the block above and gated on
    // restrictionChanged alone (not the broader `changed`) — Request
    // Appointment hosts the interactive booking wizard (doctor/date/time
    // already picked, notes typed in), and re-rendering it on every
    // unrelated data change (a new exam landing, etc.) would silently wipe
    // that out mid-booking. Only flip the "Online Booking Unavailable"
    // screen in or out when the restriction itself actually changes.
    if (restrictionChanged && page === 'patient-request-appt') window.renderPage({ silent: true })
  } catch (_) {}
}
window._syncMyRecords = _syncMyRecords

// ── Doctors sync ──────────────────────────────────────────────────
async function _syncDoctors() {
  try {
    // Patients aren't authorized for the staff/admin doctors/index.php route —
    // the public endpoint has everything the booking flow needs (schedule,
    // hours, photo, blocked dates) without staff-only fields like email.
    const endpoint = window.state?.role === 'patient' ? 'api/doctors/public.php' : 'api/doctors/index.php'
    const r = await fetch(endpoint)
    if (!r.ok) return
    const d = await r.json()
    if (!d.success || !Array.isArray(d.doctors)) return
    doctors.splice(0, doctors.length, ...d.doctors)
    const _dp = window.state?.page
    if (_dp === 'admin-dashboard' && window.updateAdminDashboard) window.updateAdminDashboard()
    if (_dp === 'staff-dashboard' && window.updateStaffDashboard) window.updateStaffDashboard()
    if (_dp === 'schedule' && window.renderPage) window.renderPage()
    if (_dp === 'admin-users' && window.renderPage) window.renderPage()
    if (['doctor-availability', 'patient-appts', 'patient-dashboard'].includes(_dp) && window.renderPage) window.renderPage()
  } catch (_) { /* keep mock data on network failure */ }
}
window._syncDoctors = _syncDoctors

// ── Staff & Admin sync ────────────────────────────────────────────
async function _syncStaff() {
  try {
    const r = await fetch('api/staff/index.php')
    if (!r.ok) return
    const d = await r.json()
    if (!d.success) return
    if (Array.isArray(d.staff))  staff.splice(0,  staff.length,  ...d.staff)
    if (Array.isArray(d.admins)) admins.splice(0, admins.length, ...d.admins)
    // Re-render user management page if currently open so photos appear
    if (window.state?.page === 'admin-users' && window.renderPage) window.renderPage()
  } catch (_) {}
}
window._syncStaff = _syncStaff

// ── Archived records sync ─────────────────────────────────────────
async function _syncArchives() {
  try {
    const r = await fetch('api/archive/index.php')
    if (!r.ok) return
    const d = await r.json()
    if (!d.success || !Array.isArray(d.records)) return
    archivedRecords.splice(0, archivedRecords.length, ...d.records)
    if (window.state?.page === 'admin-settings' && window.state?.params?.filter === 'archives' && window.renderPage) window.renderPage()
  } catch (_) {}
}
window._syncArchives = _syncArchives

// ── Contact messages sync ──────────────────────────────────────────
window._contactUnreadCount = 0

async function _syncContactMessages() {
  try {
    const r = await fetch('api/contact/index.php')
    if (!r.ok) return
    const d = await r.json()
    if (!d.success || !Array.isArray(d.messages)) return
    const changed = _pollDataChanged(contactMessages, d.messages)
    contactMessages.splice(0, contactMessages.length, ...d.messages)
    window._contactUnreadCount = d.unread_count || 0
    if (window._updateContactUI) window._updateContactUI()
    if (window._updateSidebarBadges) window._updateSidebarBadges()
    if (changed && window.state?.page === 'contact-messages' && window.renderPage) window.renderPage({ silent: true })
  } catch (_) {}
}
window._syncContactMessages = _syncContactMessages

// ── Waitlist sync (admin/staff visibility only — patients read their own
// entry directly via loadMyWaitlistCard) ────────────────────────────
window._waitlistCount = 0

async function _syncWaitlist() {
  try {
    const r = await fetch('api/waitlist/index.php')
    if (!r.ok) return
    const d = await r.json()
    if (!d.success || !Array.isArray(d.entries)) return
    const changed = _pollDataChanged(waitlistEntries, d.entries)
    waitlistEntries.splice(0, waitlistEntries.length, ...d.entries)
    window._waitlistCount = d.entries.length
    if (window._updateSidebarBadges) window._updateSidebarBadges()
    if (changed && window.state?.page === 'waitlist' && window.renderPage) window.renderPage({ silent: true })
  } catch (_) {}
}
window._syncWaitlist = _syncWaitlist

// ── Clinic settings + services sync ─────────────────────────────────
const _CLINIC_SETTINGS_PAGES = new Set([
  'admin-settings', 'doctor-availability', 'patient-appts', 'patient-dashboard'
])

async function _syncClinicSettings() {
  try {
    const r = await fetch('api/clinic/settings.php')
    if (!r.ok) return
    const d = await r.json()
    if (!d.success || !d.settings) return
    const s = d.settings
    Object.assign(clinicInfo, {
      name: s.name, tagline: s.tagline, footerCopyrightText: s.footerCopyrightText ?? '', address: s.address, phone: s.phone,
      mobile: s.mobile, email: s.email, hours: s.hours,
      foundedYear: s.foundedYear ?? null,
      logoUrl: s.logoUrl, heroUrl: s.heroUrl ?? null,
      mapEmbedUrl: s.mapEmbedUrl ?? null,
      videoUrl: s.videoUrl ?? null,
      galleryMaxPhotos: s.galleryMaxPhotos ?? null,
      termsContent: s.termsContent ?? null,
      privacyContent: s.privacyContent ?? null,
      appointmentPolicyContent: s.appointmentPolicyContent ?? null
    })
    // Keep the pre-auth globals in sync too, so an admin editing this
    // mid-session (or re-opening the registration screen after logging out)
    // sees their own change immediately rather than the stale value from
    // page load.
    if (clinicInfo.termsContent)   window._termsContentMd   = clinicInfo.termsContent
    if (clinicInfo.privacyContent) window._privacyContentMd = clinicInfo.privacyContent
    Object.assign(consultationSettings, {
      defaultDuration: s.defaultDuration, maxAdvanceBooking: s.maxAdvanceBooking,
      minAdvanceBooking: s.minAdvanceBooking, maxApptsPerDoctorPerDay: s.maxApptsPerDoctorPerDay,
      morningStart: s.morningStart, morningEnd: s.morningEnd,
      afternoonStart: s.afternoonStart, afternoonEnd: s.afternoonEnd,
      lunchBreak: s.lunchBreak, clinicDays: s.clinicDays,
      reminderTime: s.reminderTime, confirmDeadlineTime: s.confirmDeadlineTime,
      waitlistOfferHours: s.waitlistOfferHours
    })
    window._clinicName     = clinicInfo.name     || 'Cana Optical Clinic'
    window._clinicAddress  = clinicInfo.address  || ''
    try {
      if (clinicInfo.name) localStorage.setItem('_canaopticalclinic_clinicName', clinicInfo.name)
    } catch(_) {}
    const _lsBrand = document.getElementById('ls-brand-name')
    if (_lsBrand && clinicInfo.name) _lsBrand.textContent = clinicInfo.name
    if (clinicInfo.name) document.querySelectorAll('.brand-logo-name').forEach(el => { el.textContent = clinicInfo.name })
    document.querySelectorAll('.brand-clinic-name').forEach(el => { el.textContent = window._clinicName })
    if (s.logoUrl) {
      window._clinicLogoUrl = s.logoUrl
      if (window.syncLogoImages) window.syncLogoImages(s.logoUrl)
    }
    document.querySelectorAll('.topbar-clinic-name').forEach(el => { el.textContent = window._clinicName })
    const _addrParts = (window._clinicAddress || '').split(',').map(s=>s.trim()).filter(Boolean)
    const _clinicCity = _addrParts.length >= 2 ? _addrParts.slice(-2).join(', ') : (window._clinicAddress || 'Carmona, Cavite')
    document.querySelectorAll('.topbar-clinic-sub').forEach(el => { el.textContent = _clinicCity })
    if (window.renderSidebar) window.renderSidebar()
    if (window.renderTopbar) window.renderTopbar()
    if (_CLINIC_SETTINGS_PAGES.has(window.state?.page) && window.renderPage) window.renderPage()
  } catch (_) {}
}
window._syncClinicSettings = _syncClinicSettings

async function _syncServices() {
  try {
    const r = await fetch('api/services/index.php')
    if (!r.ok) return
    const d = await r.json()
    if (!d.success || !Array.isArray(d.services)) return
    CLINIC_SERVICES.splice(0, CLINIC_SERVICES.length, ...d.services)
    _svcNextId = Math.max(0, ...d.services.map(s => s.id)) + 1
    if (_CLINIC_SETTINGS_PAGES.has(window.state?.page) && window.renderPage) window.renderPage()
  } catch (_) {}
}
window._syncServices = _syncServices

// ── Notifications sync ────────────────────────────────────────────
window._notifications      = []
window._unreadCount        = 0
window._systemPollInterval = null
let _pollTick       = 0
let _pollFailStreak = 0
let _pollSkipTicks  = 0

// Returns true on success so the poll tick can use it as a server-health signal.
async function _syncNotifications() {
  try {
    const r = await fetch('api/notifications/index.php')
    // 401 specifically means "not authenticated" (api/notifications/index.php's
    // own !isset($_SESSION['user_id']) check) — during an active poll tick
    // that can only mean this session died server-side since the last
    // successful tick: revoked from another device, or a password change.
    // Distinct from any other failure (500, network blip), which should
    // just back off and retry rather than assume the worst.
    if (r.status === 401) { _handleSessionRevoked(); return false }
    if (!r.ok) return false
    const d = await r.json()
    if (!d.success) return false
    window._notifications = d.notifications || []
    window._unreadCount   = d.unread_count  || 0
    if (window._updateNotifUI) window._updateNotifUI()
    if (window._updateSidebarBadges) window._updateSidebarBadges()
    return true
  } catch (_) { return false }
}
window._syncNotifications = _syncNotifications

// A device finding out (via the 30s poll above) that it's been signed
// out remotely — by a Log Out from another device in Active Sessions, or
// by a password change revoking other sessions. Guarded so a burst of
// poll ticks in flight when this first fires can't call logout() more
// than once.
let _sessionRevokedHandled = false
function _handleSessionRevoked() {
  if (_sessionRevokedHandled) return
  _sessionRevokedHandled = true
  logout(SESSION_REVOKED_MESSAGE)
}
window._handleSessionRevoked = _handleSessionRevoked

async function _systemPollTick() {
  // Don't poll a tab the user isn't looking at
  if (document.hidden) return

  // Exponential back-off after repeated server failures
  if (_pollSkipTicks > 0) { _pollSkipTicks--; return }

  const role = window.state?.role
  const page = window.state?.page
  if (!role) return

  _pollTick++

  // Notifications run first — their success/fail is our server health signal
  const ok = await _syncNotifications()
  if (!ok) {
    _pollFailStreak++
    // After 3 failures: skip 1–4 extra ticks (30s → up to 150s between retries)
    if (_pollFailStreak >= 3) _pollSkipTicks = Math.min(_pollFailStreak - 2, 4)
    return
  }
  _pollFailStreak = 0

  const examInProgress = (page === 'new-examination' || page === 'edit-examination') && window.state?.params?.patientId

  // Appointments badge matters for admin/staff/doctor; patients have no badge
  // and their nav triggers already refresh appointment data on page open
  if (role !== 'patient') _syncAppointments()

  // Role-specific light syncs
  if (role === 'patient') _syncMyRecords()
  if (['admin','staff'].includes(role)) { _syncContactMessages(); _syncWaitlist() }

  // Heavier syncs every other tick (~60s)
  if (_pollTick % 2 === 0) {
    if (['admin','staff','doctor'].includes(role) && !examInProgress) _syncPatients()
    if (role === 'admin') _syncActivityLog()
  }
}

function _startSystemPolling() {
  if (window._systemPollInterval) return
  _pollTick = 0
  window._systemPollInterval = setInterval(_systemPollTick, 30000)
}

function _stopSystemPolling() {
  if (window._systemPollInterval) {
    clearInterval(window._systemPollInterval)
    window._systemPollInterval = null
  }
  _pollTick = 0
}

// Restart the 30s clock from now — called on every navigation so the next
// tick is always a full interval away, not wherever the old timer happened to be.
function _resetSystemPoll() {
  _stopSystemPolling()
  _pollFailStreak = 0
  _pollSkipTicks  = 0
  _startSystemPolling()
}
window._startSystemPolling = _startSystemPolling
window._stopSystemPolling  = _stopSystemPolling
window._resetSystemPoll    = _resetSystemPoll

// When the user comes back to a hidden tab: fire an immediate catch-up sync
// and reset the timer so the next poll is 30s from now, not from whenever
// the interval would have fired next.
document.addEventListener('visibilitychange', () => {
  if (!document.hidden && window.state?.role) {
    _systemPollTick()
    _resetSystemPoll()
  }
})

// ── Activity log sync ─────────────────────────────────────────────
async function _syncActivityLog() {
  try {
    const r = await fetch('api/activity/log.php')
    if (!r.ok) return
    const d = await r.json()
    if (!d.success || !Array.isArray(d.logs)) return
    const changed = _pollDataChanged(activityLog, d.logs)
    activityLog.splice(0, activityLog.length, ...d.logs)
    const page = window.state?.page
    if (changed && page === 'activity-log') window.renderPage({ silent: true })
    else if (page === 'admin-dashboard' && window.updateAdminDashboard) window.updateAdminDashboard()
  } catch (_) {}
}
window._syncActivityLog = _syncActivityLog

function _shakeCard() {
  const card = document.querySelector('.login-card')
  if (!card) return
  card.classList.remove('login-shake')
  void card.offsetWidth
  card.classList.add('login-shake')
  card.addEventListener('animationend', () => card.classList.remove('login-shake'), { once: true })
}

// toggleLoginPw() is defined in main.js (loads after this file and wins the
// global binding anyway) — removed the dead duplicate that used to live here.
