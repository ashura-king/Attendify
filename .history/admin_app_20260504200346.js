/**
 * Initial attendance records dataset.
 * Each record represents one employee's attendance entry for the day.
 */
let records = [
  { name: 'John Doe',       dept: 'IT',         timeIn: '9:00',  timeOut: '11:04', status: 'late'    },
  { name: 'Maria Sina',     dept: 'Accounting',  timeIn: '8:40',  timeOut: '12:01', status: 'present' },
  { name: 'Michael Jackson',dept: 'HR',          timeIn: '—',     timeOut: '—',     status: 'absent'  },
  { name: 'Davy Jones',     dept: 'Marketing',   timeIn: '8:30',  timeOut: '12:06', status: 'present' },
];

/** Avatar background colours — cycled by index */
const AVATAR_COLORS = [
  '#8b5cf6', '#ec4899', '#3b82f6', '#22c55e',
  '#f59e0b', '#ef4444', '#06b6d4', '#f97316',
];

/* ================================================================
   UTILITY
   ================================================================ */

/**
 * Returns initials from a full name string (up to 2 letters).
 * @param {string} name
 * @returns {string}
 */
function getInitials(name) {
  return name
    .split(' ')
    .map(w => w[0])
    .join('')
    .slice(0, 2)
    .toUpperCase();
}

/**
 * Returns a deterministic avatar colour for a given index.
 * @param {number} index
 * @returns {string} CSS colour value
 */
function avatarColor(index) {
  return AVATAR_COLORS[index % AVATAR_COLORS.length];
}

/**
 * Capitalises the first letter of a string.
 * @param {string} str
 * @returns {string}
 */
function capitalise(str) {
  return str.charAt(0).toUpperCase() + str.slice(1);
}

/* ================================================================
   STATS
   ================================================================ */

/**
 * Recalculates and renders the four summary stat cards
 * based on the current records array.
 */
function updateStats() {
  const present = records.filter(r => r.status === 'present').length;
  const late    = records.filter(r => r.status === 'late').length;
  const absent  = records.filter(r => r.status === 'absent').length;

  document.getElementById('totalEmployee').textContent = records.length;
  document.getElementById('totalPresent').textContent  = present;
  document.getElementById('totalLate').textContent     = late;
  document.getElementById('totalAbsent').textContent   = absent;
}

/* ================================================================
   TABLE RENDER
   ================================================================ */

/**
 * Renders the attendance table rows based on the current records
 * and any active search/filter values.
 */
function renderTable() {
  const query  = document.getElementById('searchInput').value.toLowerCase().trim();
  const dept   = document.getElementById('deptFilter').value;
  const tbody  = document.getElementById('attendanceBody');
  const empty  = document.getElementById('emptyState');

  // Filter records
  const filtered = records.filter((r, _) => {
    const matchSearch = r.name.toLowerCase().includes(query) ||
                        r.dept.toLowerCase().includes(query);
    const matchDept   = dept === '' || r.dept === dept;
    return matchSearch && matchDept;
  });

  tbody.innerHTML = '';

  if (filtered.length === 0) {
    empty.style.display = 'block';
    return;
  }

  empty.style.display = 'none';

  filtered.forEach((record) => {
    // Find the original index in the records array (needed for edit/remove)
    const originalIndex = records.indexOf(record);
    const tr = document.createElement('tr');

    tr.innerHTML = `
      <td class="td-avatar">
        <div class="row-avatar" style="background:${avatarColor(originalIndex)}">
          ${getInitials(record.name)}
        </div>
      </td>
      <td>${record.name}</td>
      <td>${record.dept}</td>
      <td class="td-time">${record.timeIn}</td>
      <td class="td-time">${record.timeOut}</td>
      <td>
        <span class="status-pill ${record.status}">${capitalise(record.status)}</span>
      </td>
      <td class="td-action">
        <button class="btn-edit"   onclick="openEditModal(${originalIndex})">Edit</button>
        <button class="btn-remove" onclick="openConfirm(${originalIndex})">Remove</button>
      </td>
    `;

    tbody.appendChild(tr);
  });
}

/**
 * Called by the search input and department filter.
 * Re-renders the table with current filter state.
 */
function filterTable() {
  renderTable();
}

/* ================================================================
   ADD / EDIT MODAL
   ================================================================ */

/**
 * Opens the Add Record modal with empty fields.
 */
function openModal() {
  document.getElementById('modalTitle').textContent = 'Add Record';
  document.getElementById('editIndex').value        = '-1';
  document.getElementById('fieldName').value        = '';
  document.getElementById('fieldDept').value        = 'IT';
  document.getElementById('fieldTimeIn').value      = '';
  document.getElementById('fieldTimeOut').value     = '';
  document.getElementById('fieldStatus').value      = 'present';
  document.getElementById('modalError').textContent = '';
  document.getElementById('modalOverlay').classList.add('open');
}

/**
 * Opens the Edit Record modal pre-filled with the given record's data.
 * @param {number} index - Index in the records array.
 */
function openEditModal(index) {
  const r = records[index];
  document.getElementById('modalTitle').textContent = 'Edit Record';
  document.getElementById('editIndex').value        = index;
  document.getElementById('fieldName').value        = r.name;
  document.getElementById('fieldDept').value        = r.dept;
  document.getElementById('fieldStatus').value      = r.status;
  document.getElementById('modalError').textContent = '';

  // Convert "H:MM" display strings to "HH:MM" for <input type="time">
  document.getElementById('fieldTimeIn').value  = toTimeInput(r.timeIn);
  document.getElementById('fieldTimeOut').value = toTimeInput(r.timeOut);

  document.getElementById('modalOverlay').classList.add('open');
}

/**
 * Converts a display time string (e.g. "9:00" or "—") to a value
 * suitable for an HTML time input ("09:00" or "").
 * @param {string} t
 * @returns {string}
 */
function toTimeInput(t) {
  if (!t || t === '—') return '';
  const [h, m] = t.split(':');
  return `${String(h).padStart(2, '0')}:${m}`;
}

/**
 * Converts an HTML time input value ("09:00") to a display string ("9:00").
 * Returns "—" if the value is empty.
 * @param {string} val
 * @returns {string}
 */
function fromTimeInput(val) {
  if (!val) return '—';
  const [h, m] = val.split(':');
  return `${parseInt(h)}:${m}`;
}

/**
 * Saves the current modal form as a new or edited record.
 * Validates required fields before saving.
 */
function saveRecord() {
  const name    = document.getElementById('fieldName').value.trim();
  const dept    = document.getElementById('fieldDept').value;
  const timeIn  = document.getElementById('fieldTimeIn').value;
  const timeOut = document.getElementById('fieldTimeOut').value;
  const status  = document.getElementById('fieldStatus').value;
  const errEl   = document.getElementById('modalError');

  // Validation
  if (!name) {
    errEl.textContent = 'Please enter a full name.';
    return;
  }
  if (status !== 'absent' && !timeIn) {
    errEl.textContent = 'Please enter a Time In value.';
    return;
  }

  errEl.textContent = '';

  const record = {
    name,
    dept,
    timeIn:  status === 'absent' ? '—' : fromTimeInput(timeIn),
    timeOut: status === 'absent' ? '—' : fromTimeInput(timeOut),
    status,
  };

  const idx = parseInt(document.getElementById('editIndex').value);

  if (idx === -1) {
    // Add new record
    records.push(record);
    showToast(`✅ Record added for ${name}`);
  } else {
    // Update existing record
    records[idx] = record;
    showToast(`✏️ Record updated for ${name}`);
  }

  closeModal();
  updateStats();
  renderTable();
}

/**
 * Closes the Add/Edit modal.
 */
function closeModal() {
  document.getElementById('modalOverlay').classList.remove('open');
}

/**
 * Closes the modal when the user clicks the overlay background.
 * @param {MouseEvent} event
 */
function closeModalOutside(event) {
  if (event.target === document.getElementById('modalOverlay')) closeModal();
}

/* ================================================================
   CONFIRM DELETE MODAL
   ================================================================ */

/** Tracks which record index is pending deletion. */
let pendingDeleteIndex = -1;

/**
 * Opens the confirm-delete modal for a given record.
 * @param {number} index - Index in the records array.
 */
function openConfirm(index) {
  pendingDeleteIndex = index;
  document.getElementById('confirmName').textContent = records[index].name;
  document.getElementById('confirmOverlay').classList.add('open');
}

/**
 * Closes the confirm-delete modal without deleting.
 */
function closeConfirm() {
  pendingDeleteIndex = -1;
  document.getElementById('confirmOverlay').classList.remove('open');
}

/**
 * Closes the confirm modal when clicking the overlay background.
 * @param {MouseEvent} event
 */
function closeConfirmOutside(event) {
  if (event.target === document.getElementById('confirmOverlay')) closeConfirm();
}

/**
 * Executes the deletion of the pending record after confirmation.
 */
function confirmRemove() {
  if (pendingDeleteIndex === -1) return;
  const name = records[pendingDeleteIndex].name;
  records.splice(pendingDeleteIndex, 1);
  pendingDeleteIndex = -1;
  closeConfirm();
  updateStats();
  renderTable();
  showToast(`🗑️ Record removed for ${name}`);
}

/* ================================================================
   DARK MODE
   ================================================================ */

/**
 * Toggles dark mode and persists the preference in localStorage.
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
   SIDEBAR NAVIGATION
   ================================================================ */

/**
 * Handles sidebar item clicks — updates the active state and shows
 * a context toast for non-dashboard pages.
 * @param {string} page - Page key ('attendance' | 'employee').
 * @param {HTMLElement} el - The clicked sidebar element.
 */
function setPage(page, el) {
  document.querySelectorAll('.sidebar-item').forEach(item => {
    item.classList.remove('active');
  });
  el.classList.add('active');

  if (page === 'employee') {
    showToast('👥 Employee management coming soon');
  }
}

/* ================================================================
   TOAST NOTIFICATIONS
   ================================================================ */

let toastTimer = null;

/**
 * Displays a brief toast notification at the bottom-right.
 * Auto-dismisses after 3.2 seconds.
 * @param {string} msg - Message to display.
 */
function showToast(msg) {
  clearTimeout(toastTimer);
  const toast = document.getElementById('toast');
  toast.textContent = msg;
  toast.classList.add('show');
  toastTimer = setTimeout(() => toast.classList.remove('show'), 3200);
}

/* ================================================================
   KEYBOARD SHORTCUT — close modals with Escape
   ================================================================ */
document.addEventListener('keydown', (e) => {
  if (e.key === 'Escape') {
    closeModal();
    closeConfirm();
  }
});

/* ================================================================
   INIT
   ================================================================ */
updateStats();
renderTable();