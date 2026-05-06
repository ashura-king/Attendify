/* ================================================================
   app.js — Attendify Attendance Dashboard
   ================================================================ */

/* ─── Attendance Records Data ──────────────────────────────────── */
const records = [
  { date: 'April 28, 2026', timeIn: '8:02',  timeOut: '17:05', hours: '9h 03m',  status: 'present' },
  { date: 'April 25, 2026', timeIn: '8:15',  timeOut: '17:00', hours: '8h 45m',  status: 'present' },
  { date: 'April 24, 2026', timeIn: '9:12',  timeOut: '17:30', hours: '8h 18m',  status: 'late'    },
  { date: 'April 23, 2026', timeIn: '8:00',  timeOut: '17:00', hours: '9h 00m',  status: 'present' },
  { date: 'April 22, 2026', timeIn: '—',     timeOut: '—',     hours: '—',       status: 'absent'  },
  { date: 'April 21, 2026', timeIn: '8:02',  timeOut: '18:05', hours: '10h 03m', status: 'present' },
  { date: 'April 20, 2026', timeIn: '8:05',  timeOut: '17:10', hours: '9h 05m',  status: 'present' },
  { date: 'April 19, 2026', timeIn: '—',     timeOut: '—',     hours: '—',       status: 'absent'  },
];

/* ─── App State ────────────────────────────────────────────────── */
let checkedIn  = false;
let checkedOut = false;
let timeInTs   = null;
let timeOutTs  = null;
let hoursTimer = null;
let toastTimer = null;

/* ================================================================
   UTILITY
   ================================================================ */

/**
 * Zero-pads a number to 2 digits.
 * @param {number} n
 * @returns {string}
 */
function pad(n) {
  return String(n).padStart(2, '0');
}

/**
 * Formats a Date object as "H:MM" (no leading zero on hour).
 * @param {Date} date
 * @returns {string}
 */
function formatTime(date) {
  return `${date.getHours()}:${pad(date.getMinutes())}`;
}

/* ================================================================
   CLOCK & DATE
   ================================================================ */

/**
 * Updates the live clock and date label in the welcome card.
 * Called every second via setInterval.
 */
function updateClock() {
  const now = new Date();

  document.getElementById('clock').textContent =
    `${pad(now.getHours())}:${pad(now.getMinutes())}:${pad(now.getSeconds())}`;

  const days   = ['Sunday','Monday','Tuesday','Wednesday','Thursday','Friday','Saturday'];
  const months = ['January','February','March','April','May','June','July',
                  'August','September','October','November','December'];

  document.getElementById('dateLabel').textContent =
    `${days[now.getDay()]} , ${months[now.getMonth()]} ${now.getDate()}`;
}

// Start clock immediately and tick every second
setInterval(updateClock, 1000);
updateClock();

/* ================================================================
   HOURS TRACKER
   ================================================================ */

/**
 * Recalculates and displays the elapsed hours between time-in and
 * now (or time-out if already checked out).
 */
function updateHoursDisplay() {
  if (!timeInTs) return;
  const elapsed   = (timeOutTs || Date.now()) - timeInTs;
  const totalMins = Math.floor(elapsed / 60000);
  const h = Math.floor(totalMins / 60);
  const m = totalMins % 60;
  document.getElementById('summaryHours').textContent = `${h}h ${pad(m)}m`;
}

/* ================================================================
   TIME IN / TIME OUT
   ================================================================ */

/**
 * Handles the Time In / Time Out button click.
 * First click  → logs Time In.
 * Second click → logs Time Out and disables the button.
 */
function handleTimeIn() {
  const now     = new Date();
  const timeStr = formatTime(now);

  if (!checkedIn) {
    /* ── Check In ── */
    checkedIn = true;
    timeInTs  = Date.now();

    const btn = document.getElementById('timeInBtn');
    btn.textContent = 'Time Out';
    btn.classList.add('checked-in');

    document.getElementById('summaryTimeIn').textContent  = timeStr;
    document.getElementById('checkStatus').textContent    = 'You are checked in ✓';

    updateAttendanceStatus(now.getHours());

    // Start live hours counter (updates every 30 s)
    hoursTimer = setInterval(updateHoursDisplay, 30000);
    updateHoursDisplay();

    // Increment present-day counter and monthly count
    incrementStat('statPresent');
    incrementMonth();

    showToast(`✅ Checked in at ${timeStr}`);

  } else if (!checkedOut) {
    /* ── Check Out ── */
    checkedOut = true;
    timeOutTs  = Date.now();
    clearInterval(hoursTimer);

    const btn = document.getElementById('timeInBtn');
    btn.textContent     = 'Done for today';
    btn.disabled        = true;
    btn.style.opacity   = '0.5';
    btn.style.cursor    = 'not-allowed';

    document.getElementById('summaryTimeOut').textContent = timeStr;
    document.getElementById('checkStatus').textContent    = 'You have checked out. See you tomorrow!';
    updateHoursDisplay();

    showToast(`👋 Checked out at ${timeStr}`);
  }
}

/* ================================================================
   STATUS HELPERS
   ================================================================ */

/**
 * Updates the Today's Summary status badge based on check-in hour.
 * @param {number} hour - The hour (0–23) of check-in.
 */
function updateAttendanceStatus(hour) {
  const badge = document.getElementById('statusBadge');
  if (hour >= 9) {
    badge.textContent = 'Late';
    badge.className   = 'badge-absent';
    incrementStat('statLate');
  } else {
    badge.textContent = 'Present';
    badge.className   = 'badge-present';
  }
}

/**
 * Increments a numeric stat element by 1.
 * @param {string} id - Element ID of the stat counter.
 */
function incrementStat(id) {
  const el = document.getElementById(id);
  el.textContent = parseInt(el.textContent) + 1;
}

/**
 * Increments the month attendance counter (e.g. "8/22" → "9/22").
 */
function incrementMonth() {
  const el    = document.getElementById('summaryMonth');
  const parts = el.textContent.split('/');
  el.textContent = `${parseInt(parts[0]) + 1}/${parts[1]}`;
}

/* ================================================================
   ATTENDANCE TABLE
   ================================================================ */

/**
 * Renders the recent attendance records into the HTML table body.
 */
function renderTable() {
  const tbody = document.getElementById('attendanceTable');
  tbody.innerHTML = '';

  records.forEach(record => {
    const tr    = document.createElement('tr');
    const label = record.status.charAt(0).toUpperCase() + record.status.slice(1);

    tr.innerHTML = `
      <td>${record.date}</td>
      <td>${record.timeIn}</td>
      <td>${record.timeOut}</td>
      <td>${record.hours}</td>
      <td><span class="status-pill ${record.status}">${label}</span></td>
    `;
    tbody.appendChild(tr);
  });
}

// Render table on load
renderTable();

/* ================================================================
   DARK MODE
   ================================================================ */

/**
 * Toggles dark mode on the body and persists the preference in
 * localStorage.
 */
function toggleDark() {
  document.body.classList.toggle('dark');
  localStorage.setItem('attendify-dark', document.body.classList.contains('dark'));
}

// Apply saved dark-mode preference on page load
if (localStorage.getItem('attendify-dark') === 'true') {
  document.body.classList.add('dark');
}

/* ================================================================
   SIDEBAR NAVIGATION
   ================================================================ */

/**
 * Handles sidebar item clicks — updates active state and shows
 * a context toast for certain pages.
 * @param {string} page - Page identifier ('dashboard' | 'records').
 * @param {HTMLElement} el - The clicked sidebar item element.
 */
function setPage(page, el) {
  document.querySelectorAll('.sidebar-item').forEach(item => {
    item.classList.remove('active');
  });
  el.classList.add('active');

  if (page === 'records') {
    showToast('📋 My Records – showing all entries above');
  }
}

/* ================================================================
   TOAST NOTIFICATIONS
   ================================================================ */

/**
 * Displays a brief toast notification at the bottom-right of the screen.
 * Auto-dismisses after 3.2 seconds.
 * @param {string} msg - The message to display.
 */
function showToast(msg) {
  clearTimeout(toastTimer);
  const toast = document.getElementById('toast');
  toast.textContent = msg;
  toast.classList.add('show');
  toastTimer = setTimeout(() => toast.classList.remove('show'), 3200);
}