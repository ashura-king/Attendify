/* ================================================================
   admin_employee_app.js — Attendify Employee Management Page
   ================================================================ */

/* ================================================================
   DATA
   ================================================================ */
let employees = [
  { firstName:'John',    lastName:'Doe',      email:'john.doe@company.com',      dept:'IT',         position:'Developer',       joined:'2023-03-15', status:'Active'   },
  { firstName:'Maria',   lastName:'Sina',     email:'maria.sina@company.com',    dept:'Accounting', position:'Accountant',      joined:'2022-07-01', status:'Active'   },
  { firstName:'Michael', lastName:'Jackson',  email:'m.jackson@company.com',     dept:'HR',         position:'HR Specialist',   joined:'2021-11-20', status:'Active'   },
  { firstName:'Davy',    lastName:'Jones',    email:'davy.jones@company.com',    dept:'Marketing',  position:'Marketing Lead',  joined:'2023-01-08', status:'Active'   },
  { firstName:'Sara',    lastName:'Lee',      email:'sara.lee@company.com',      dept:'Finance',    position:'Financial Analyst',joined:'2022-05-14',status:'Active'   },
  { firstName:'Tom',     lastName:'Cruz',     email:'tom.cruz@company.com',      dept:'IT',         position:'QA Engineer',     joined:'2020-09-30', status:'Inactive' },
  { firstName:'Anna',    lastName:'Reyes',    email:'anna.reyes@company.com',    dept:'HR',         position:'Recruiter',       joined:'2023-06-12', status:'Active'   },
  { firstName:'Luke',    lastName:'Santos',   email:'luke.santos@company.com',   dept:'Marketing',  position:'Designer',        joined:'2024-01-03', status:'Active'   },
  { firstName:'Nina',    lastName:'Park',     email:'nina.park@company.com',     dept:'Accounting', position:'Auditor',         joined:'2021-03-22', status:'Inactive' },
  { firstName:'Chris',   lastName:'Tan',      email:'chris.tan@company.com',     dept:'Finance',    position:'Budget Analyst',  joined:'2022-10-17', status:'Active'   },
  { firstName:'Bella',   lastName:'Cruz',     email:'bella.cruz@company.com',    dept:'IT',         position:'Systems Admin',   joined:'2023-08-05', status:'Active'   },
  { firstName:'Marco',   lastName:'Vitale',   email:'marco.vitale@company.com',  dept:'Marketing',  position:'Content Writer',  joined:'2024-02-19', status:'Active'   },
];

const AVATAR_COLORS = [
  '#8b5cf6','#ec4899','#3b82f6','#22c55e',
  '#f59e0b','#ef4444','#06b6d4','#f97316',
];

let filteredEmployees = [...employees];
let pendingDeleteIndex = -1;
let toastTimer = null;

/* ================================================================
   UTILITY
   ================================================================ */
function getInitials(first, last) {
  return ((first[0] || '') + (last[0] || '')).toUpperCase();
}

function avatarColor(index) {
  return AVATAR_COLORS[index % AVATAR_COLORS.length];
}

function formatDate(dateStr) {
  if (!dateStr) return '—';
  const d = new Date(dateStr);
  return d.toLocaleDateString('en-US', { year:'numeric', month:'short', day:'numeric' });
}

/* ================================================================
   STRIP STATS
   ================================================================ */
function updateStrip() {
  const active   = employees.filter(e => e.status === 'Active').length;
  const inactive = employees.filter(e => e.status === 'Inactive').length;
  const depts    = new Set(employees.map(e => e.dept)).size;

  document.getElementById('empTotal').textContent    = employees.length;
  document.getElementById('empActive').textContent   = active;
  document.getElementById('empInactive').textContent = inactive;
  document.getElementById('empDepts').textContent    = depts;
}

/* ================================================================
   FILTER
   ================================================================ */
function filterEmployees() {
  const query  = document.getElementById('empSearch').value.toLowerCase().trim();
  const dept   = document.getElementById('empDeptFilter').value;
  const status = document.getElementById('empStatusFilter').value;

  filteredEmployees = employees.filter(e => {
    const fullName = `${e.firstName} ${e.lastName}`.toLowerCase();
    const matchQ   = fullName.includes(query) || e.email.toLowerCase().includes(query) || e.position.toLowerCase().includes(query);
    const matchD   = dept   === '' || e.dept   === dept;
    const matchS   = status === '' || e.status === status;
    return matchQ && matchD && matchS;
  });

  renderTable();
}

/* ================================================================
   TABLE RENDER
   ================================================================ */
function renderTable() {
  const tbody = document.getElementById('empBody');
  const empty = document.getElementById('empEmpty');
  tbody.innerHTML = '';

  if (filteredEmployees.length === 0) {
    empty.style.display = 'block';
    return;
  }
  empty.style.display = 'none';

  filteredEmployees.forEach(emp => {
    const origIdx = employees.indexOf(emp);
    const tr = document.createElement('tr');

    tr.innerHTML = `
      <td class="td-avatar">
        <div class="row-avatar" style="background:${avatarColor(origIdx)}">
          ${getInitials(emp.firstName, emp.lastName)}
        </div>
      </td>
      <td><strong>${emp.firstName} ${emp.lastName}</strong></td>
      <td class="td-mono">${emp.email}</td>
      <td><span class="dept-tag">${emp.dept}</span></td>
      <td>${emp.position}</td>
      <td class="td-mono">${formatDate(emp.joined)}</td>
      <td><span class="emp-status ${emp.status.toLowerCase()}">${emp.status}</span></td>
      <td class="td-action">
        <button class="btn-edit"   onclick="openEditEmpModal(${origIdx})">Edit</button>
        <button class="btn-remove" onclick="openEmpConfirm(${origIdx})">Remove</button>
      </td>
    `;
    tbody.appendChild(tr);
  });
}

/* ================================================================
   ADD / EDIT MODAL
   ================================================================ */
function openEmpModal() {
  document.getElementById('empModalTitle').textContent = 'Add Employee';
  document.getElementById('empEditIndex').value        = '-1';
  document.getElementById('empFirstName').value        = '';
  document.getElementById('empLastName').value         = '';
  document.getElementById('empEmail').value            = '';
  document.getElementById('empDept').value             = 'IT';
  document.getElementById('empPosition').value         = '';
  document.getElementById('empJoined').value           = '';
  document.getElementById('empStatus').value           = 'Active';
  document.getElementById('empError').textContent      = '';
  document.getElementById('empModalOverlay').classList.add('open');
}

function openEditEmpModal(index) {
  const e = employees[index];
  document.getElementById('empModalTitle').textContent = 'Edit Employee';
  document.getElementById('empEditIndex').value        = index;
  document.getElementById('empFirstName').value        = e.firstName;
  document.getElementById('empLastName').value         = e.lastName;
  document.getElementById('empEmail').value            = e.email;
  document.getElementById('empDept').value             = e.dept;
  document.getElementById('empPosition').value         = e.position;
  document.getElementById('empJoined').value           = e.joined;
  document.getElementById('empStatus').value           = e.status;
  document.getElementById('empError').textContent      = '';
  document.getElementById('empModalOverlay').classList.add('open');
}

function saveEmployee() {
  const firstName = document.getElementById('empFirstName').value.trim();
  const lastName  = document.getElementById('empLastName').value.trim();
  const email     = document.getElementById('empEmail').value.trim();
  const dept      = document.getElementById('empDept').value;
  const position  = document.getElementById('empPosition').value.trim();
  const joined    = document.getElementById('empJoined').value;
  const status    = document.getElementById('empStatus').value;
  const errEl     = document.getElementById('empError');

  if (!firstName || !lastName) { errEl.textContent = 'Please enter first and last name.'; return; }
  if (!email)     { errEl.textContent = 'Please enter an email address.'; return; }
  if (!position)  { errEl.textContent = 'Please enter a position.'; return; }
  errEl.textContent = '';

  const emp = { firstName, lastName, email, dept, position, joined, status };
  const idx = parseInt(document.getElementById('empEditIndex').value);

  if (idx === -1) {
    employees.push(emp);
    showToast(`✅ ${firstName} ${lastName} added`);
  } else {
    employees[idx] = emp;
    showToast(`✏️ ${firstName} ${lastName} updated`);
  }

  closeEmpModal();
  updateStrip();
  filterEmployees();
}

function closeEmpModal() {
  document.getElementById('empModalOverlay').classList.remove('open');
}
function closeEmpModalOutside(e) {
  if (e.target === document.getElementById('empModalOverlay')) closeEmpModal();
}

/* ================================================================
   CONFIRM DELETE
   ================================================================ */
function openEmpConfirm(index) {
  pendingDeleteIndex = index;
  const e = employees[index];
  document.getElementById('empConfirmName').textContent = `${e.firstName} ${e.lastName}`;
  document.getElementById('empConfirmOverlay').classList.add('open');
}
function closeEmpConfirm() {
  pendingDeleteIndex = -1;
  document.getElementById('empConfirmOverlay').classList.remove('open');
}
function closeEmpConfirmOutside(e) {
  if (e.target === document.getElementById('empConfirmOverlay')) closeEmpConfirm();
}
function confirmEmpRemove() {
  if (pendingDeleteIndex === -1) return;
  const name = `${employees[pendingDeleteIndex].firstName} ${employees[pendingDeleteIndex].lastName}`;
  employees.splice(pendingDeleteIndex, 1);
  pendingDeleteIndex = -1;
  closeEmpConfirm();
  updateStrip();
  filterEmployees();
  showToast(`🗑️ ${name} removed`);
}

/* ================================================================
   DARK MODE
   ================================================================ */
function toggleDark() {
  document.body.classList.toggle('dark');
  localStorage.setItem('attendify-dark', document.body.classList.contains('dark'));
}
if (localStorage.getItem('attendify-dark') === 'true') {
  document.body.classList.add('dark');
}

/* ================================================================
   TOAST
   ================================================================ */
function showToast(msg) {
  clearTimeout(toastTimer);
  const toast = document.getElementById('toast');
  toast.textContent = msg;
  toast.classList.add('show');
  toastTimer = setTimeout(() => toast.classList.remove('show'), 3200);
}

/* ================================================================
   KEYBOARD
   ================================================================ */
document.addEventListener('keydown', e => {
  if (e.key === 'Escape') { closeEmpModal(); closeEmpConfirm(); }
});

/* ================================================================
   INIT
   ================================================================ */
updateStrip();
renderTable();