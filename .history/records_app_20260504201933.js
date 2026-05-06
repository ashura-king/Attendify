const allRecords = [
  { date: 'May 1, 2026',    timeIn: '8:01',  timeOut: '17:02', hours: '9h 01m',  status: 'present' },
  { date: 'April 30, 2026', timeIn: '8:55',  timeOut: '17:15', hours: '8h 20m',  status: 'late'    },
  { date: 'April 29, 2026', timeIn: '—',     timeOut: '—',     hours: '—',       status: 'absent'  },
  { date: 'April 28, 2026', timeIn: '8:02',  timeOut: '17:05', hours: '9h 03m',  status: 'present' },
  { date: 'April 25, 2026', timeIn: '8:15',  timeOut: '17:00', hours: '8h 45m',  status: 'present' },
  { date: 'April 24, 2026', timeIn: '9:12',  timeOut: '17:30', hours: '8h 18m',  status: 'late'    },
  { date: 'April 23, 2026', timeIn: '8:00',  timeOut: '17:00', hours: '9h 00m',  status: 'present' },
  { date: 'April 22, 2026', timeIn: '—',     timeOut: '—',     hours: '—',       status: 'absent'  },
  { date: 'April 21, 2026', timeIn: '8:02',  timeOut: '18:05', hours: '10h 03m', status: 'present' },
  { date: 'April 20, 2026', timeIn: '8:05',  timeOut: '17:10', hours: '9h 05m',  status: 'present' },
  { date: 'April 19, 2026', timeIn: '—',     timeOut: '—',     hours: '—',       status: 'absent'  },
  { date: 'April 18, 2026', timeIn: '8:00',  timeOut: '17:00', hours: '9h 00m',  status: 'present' },
  { date: 'April 17, 2026', timeIn: '9:05',  timeOut: '17:45', hours: '8h 40m',  status: 'late'    },
  { date: 'April 16, 2026', timeIn: '8:10',  timeOut: '17:00', hours: '8h 50m',  status: 'present' },
  { date: 'April 15, 2026', timeIn: '8:00',  timeOut: '17:30', hours: '9h 30m',  status: 'present' },
  { date: 'April 14, 2026', timeIn: '—',     timeOut: '—',     hours: '—',       status: 'absent'  },
  { date: 'April 11, 2026', timeIn: '8:03',  timeOut: '17:05', hours: '9h 02m',  status: 'present' },
  { date: 'April 10, 2026', timeIn: '8:00',  timeOut: '17:00', hours: '9h 00m',  status: 'present' },
  { date: 'April 9, 2026',  timeIn: '9:20',  timeOut: '18:00', hours: '8h 40m',  status: 'late'    },
  { date: 'April 8, 2026',  timeIn: '8:00',  timeOut: '17:00', hours: '9h 00m',  status: 'present' },
  { date: 'April 7, 2026',  timeIn: '8:30',  timeOut: '17:15', hours: '8h 45m',  status: 'present' },
  { date: 'April 4, 2026',  timeIn: '—',     timeOut: '—',     hours: '—',       status: 'absent'  },
  { date: 'April 3, 2026',  timeIn: '8:00',  timeOut: '17:00', hours: '9h 00m',  status: 'present' },
  { date: 'April 2, 2026',  timeIn: '8:05',  timeOut: '17:05', hours: '9h 00m',  status: 'present' },
  { date: 'April 1, 2026',  timeIn: '8:00',  timeOut: '17:00', hours: '9h 00m',  status: 'present' },
  { date: 'March 31, 2026', timeIn: '9:10',  timeOut: '17:30', hours: '8h 20m',  status: 'late'    },
  { date: 'March 30, 2026', timeIn: '8:00',  timeOut: '17:00', hours: '9h 00m',  status: 'present' },
  { date: 'March 29, 2026', timeIn: '—',     timeOut: '—',     hours: '—',       status: 'absent'  },
  { date: 'March 28, 2026', timeIn: '8:00',  timeOut: '17:00', hours: '9h 00m',  status: 'present' },
  { date: 'March 27, 2026', timeIn: '8:00',  timeOut: '17:30', hours: '9h 30m',  status: 'present' },
];

/* ================================================================
   STATE
   ================================================================ */
const ROWS_PER_PAGE = 10;

let currentPage   = 1;
let sortKey       = 'date';
let sortDir       = 'desc';   // 'asc' | 'desc'
let filteredData  = [...allRecords];
let toastTimer    = null;

/* ================================================================
   UTILITY
   ================================================================ */

/**
 * Parses a display time string like "8:02" into a sortable number (482).
 * Returns Infinity for "—" so absent rows sort to the bottom.
 * @param {string} t
 * @returns {number}
 */
function parseTimeVal(t) {
  if (!t || t === '—') return Infinity;
  const [h, m] = t.split(':').map(Number);
  return h * 60 + m;
}

/**
 * Parses a display hours string like "9h 03m" into total minutes.
 * Returns 0 for "—".
 * @param {string} h
 * @returns {number}
 */
function parseHoursVal(h) {
  if (!h || h === '—') return 0;
  const match = h.match(/(\d+)h\s*(\d+)m/);
  return match ? parseInt(match[1]) * 60 + parseInt(match[2]) : 0;
}

/**
 * Converts a date string like "April 28, 2026" to a sortable timestamp.
 * @param {string} d
 * @returns {number}
 */
function parseDateVal(d) {
  return new Date(d).getTime();
}

/**
 * Capitalises the first letter of a string.
 * @param {string} s
 * @returns {string}
 */
function cap(s) {
  return s.charAt(0).toUpperCase() + s.slice(1);
}

/* ================================================================
   SUMMARY STRIP
   ================================================================ */

/**
 * Calculates and renders the four summary stat values
 * from the full records dataset (not filtered).
 */
function updateStrip() {
  const present = allRecords.filter(r => r.status === 'present').length;
  const absent  = allRecords.filter(r => r.status === 'absent').length;
  const late    = allRecords.filter(r => r.status === 'late').length;

  const totalMins = allRecords.reduce((acc, r) => acc + parseHoursVal(r.hours), 0);
  const h = Math.floor(totalMins / 60);
  const m = totalMins % 60;
  const hoursStr = m > 0 ? `${h}h ${m}m` : `${h}h`;

  document.getElementById('stripPresent').textContent = present;
  document.getElementById('stripAbsent').textContent  = absent;
  document.getElementById('stripLate').textContent    = late;
  document.getElementById('stripHours').textContent   = hoursStr;
}

/* ================================================================
   FILTERING
   ================================================================ */

/**
 * Reads current filter/search values, filters the records,
 * resets to page 1, and re-renders the table.
 */
function filterRecords() {
  const query  = document.getElementById('searchInput').value.toLowerCase().trim();
  const status = document.getElementById('statusFilter').value;
  const month  = document.getElementById('monthFilter').value;

  filteredData = allRecords.filter(r => {
    const matchQuery  = r.date.toLowerCase().includes(query) ||
                        r.status.toLowerCase().includes(query) ||
                        r.timeIn.includes(query) ||
                        r.timeOut.includes(query);
    const matchStatus = status === '' || r.status === status;
    const matchMonth  = month  === '' || r.date.includes(month);
    return matchQuery && matchStatus && matchMonth;
  });

  currentPage = 1;
  renderTable();
  renderPagination();
}

/* ================================================================
   SORTING
   ================================================================ */

/**
 * Sorts filteredData by the given key, toggling direction if the
 * same column is clicked twice.
 * @param {string} key - 'date' | 'timeIn' | 'timeOut' | 'hours' | 'status'
 */
function sortBy(key) {
  if (sortKey === key) {
    sortDir = sortDir === 'asc' ? 'desc' : 'asc';
  } else {
    sortKey = key;
    sortDir = 'asc';
  }

  filteredData.sort((a, b) => {
    let valA, valB;

    switch (key) {
      case 'date':
        valA = parseDateVal(a.date);
        valB = parseDateVal(b.date);
        break;
      case 'timeIn':
        valA = parseTimeVal(a.timeIn);
        valB = parseTimeVal(b.timeIn);
        break;
      case 'timeOut':
        valA = parseTimeVal(a.timeOut);
        valB = parseTimeVal(b.timeOut);
        break;
      case 'hours':
        valA = parseHoursVal(a.hours);
        valB = parseHoursVal(b.hours);
        break;
      case 'status':
        valA = a.status;
        valB = b.status;
        break;
      default:
        return 0;
    }

    if (valA < valB) return sortDir === 'asc' ? -1 : 1;
    if (valA > valB) return sortDir === 'asc' ?  1 : -1;
    return 0;
  });

  currentPage = 1;
  renderTable();
  renderPagination();
  updateSortIcons();
}

/**
 * Updates all sort icon elements to reflect the current sort state.
 */
function updateSortIcons() {
  const keys = ['date', 'timeIn', 'timeOut', 'hours', 'status'];
  keys.forEach(k => {
    const el = document.getElementById(`sort-${k}`);
    if (!el) return;
    el.className = 'sort-icon';
    if (k === sortKey) {
      el.classList.add(sortDir);
    }
  });
}

/* ================================================================
   TABLE RENDER
   ================================================================ */

/**
 * Renders the current page of filtered & sorted records into the table.
 */
function renderTable() {
  const tbody = document.getElementById('recordsBody');
  const empty = document.getElementById('emptyState');
  tbody.innerHTML = '';

  if (filteredData.length === 0) {
    empty.style.display = 'block';
    return;
  }
  empty.style.display = 'none';

  // Slice for current page
  const start = (currentPage - 1) * ROWS_PER_PAGE;
  const end   = start + ROWS_PER_PAGE;
  const page  = filteredData.slice(start, end);

  page.forEach(record => {
    const tr = document.createElement('tr');
    tr.classList.add(`row-${record.status}`);

    tr.innerHTML = `
      <td>${record.date}</td>
      <td>${record.timeIn}</td>
      <td>${record.timeOut}</td>
      <td>${record.hours}</td>
      <td><span class="status-pill ${record.status}">${cap(record.status)}</span></td>
    `;

    tbody.appendChild(tr);
  });
}

/* ================================================================
   PAGINATION
   ================================================================ */

/**
 * Renders the pagination controls below the table.
 */
function renderPagination() {
  const container  = document.getElementById('pagination');
  const totalPages = Math.ceil(filteredData.length / ROWS_PER_PAGE);
  container.innerHTML = '';

  if (totalPages <= 1) return;

  const start = (currentPage - 1) * ROWS_PER_PAGE + 1;
  const end   = Math.min(currentPage * ROWS_PER_PAGE, filteredData.length);

  // Info label
  const info = document.createElement('span');
  info.className   = 'page-info';
  info.textContent = `${start}–${end} of ${filteredData.length}`;
  container.appendChild(info);

  // Prev button
  const prev = document.createElement('button');
  prev.className   = 'page-btn';
  prev.textContent = '←';
  prev.disabled    = currentPage === 1;
  prev.onclick     = () => goToPage(currentPage - 1);
  container.appendChild(prev);

  // Page number buttons (show max 5)
  const range = getPageRange(currentPage, totalPages);
  range.forEach(p => {
    const btn = document.createElement('button');
    btn.className   = 'page-btn' + (p === currentPage ? ' active' : '');
    btn.textContent = p;
    btn.onclick     = () => goToPage(p);
    container.appendChild(btn);
  });

  // Next button
  const next = document.createElement('button');
  next.className   = 'page-btn';
  next.textContent = '→';
  next.disabled    = currentPage === totalPages;
  next.onclick     = () => goToPage(currentPage + 1);
  container.appendChild(next);
}

/**
 * Returns an array of page numbers to display (max 5, centred on current).
 * @param {number} current
 * @param {number} total
 * @returns {number[]}
 */
function getPageRange(current, total) {
  const delta = 2;
  const range = [];
  const left  = Math.max(1, current - delta);
  const right = Math.min(total, current + delta);
  for (let i = left; i <= right; i++) range.push(i);
  return range;
}

/**
 * Navigates to the given page number and re-renders.
 * @param {number} page
 */
function goToPage(page) {
  const totalPages = Math.ceil(filteredData.length / ROWS_PER_PAGE);
  if (page < 1 || page > totalPages) return;
  currentPage = page;
  renderTable();
  renderPagination();
  // Scroll table into view smoothly
  document.querySelector('.records-card').scrollIntoView({ behavior: 'smooth', block: 'start' });
}

/* ================================================================
   DARK MODE
   ================================================================ */

/**
 * Toggles dark mode and persists the preference to localStorage.
 * Uses the same key as the user dashboard for consistency.
 */
function toggleDark() {
  document.body.classList.toggle('dark');
  localStorage.setItem('attendify-dark', document.body.classList.contains('dark'));
}

// Apply saved dark mode preference on load
if (localStorage.getItem('attendify-dark') === 'true') {
  document.body.classList.add('dark');
}

/* ================================================================
   TOAST NOTIFICATIONS
   ================================================================ */

/**
 * Shows a brief bottom-right toast notification.
 * @param {string} msg
 */
function showToast(msg) {
  clearTimeout(toastTimer);
  const toast = document.getElementById('toast');
  toast.textContent = msg;
  toast.classList.add('show');
  toastTimer = setTimeout(() => toast.classList.remove('show'), 3200);
}

/* ================================================================
   INIT
   ================================================================ */
updateStrip();
filterRecords();   // applies no filters initially — renders all records
updateSortIcons();