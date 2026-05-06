import { useState } from "react";
import "./Admin.css";


const STATUS_CLASS = {
  Present: "badge--present",
  Late:    "badge--late",
  Absent:  "badge--absent",
};

const AVATAR_COLORS = [
  "linear-gradient(135deg,#818cf8,#6366f1)",
  "linear-gradient(135deg,#f472b6,#ec4899)",
  "linear-gradient(135deg,#f87171,#ef4444)",
  "linear-gradient(135deg,#4ade80,#22c55e)",
  "linear-gradient(135deg,#fbbf24,#f59e0b)",
  "linear-gradient(135deg,#38bdf8,#0ea5e9)",
  "linear-gradient(135deg,#a78bfa,#7c3aed)",
  "linear-gradient(135deg,#fb923c,#ea580c)",
];

function getAvatarColor(str = "") {
  let hash = 0;
  for (let i = 0; i < str.length; i++) hash = str.charCodeAt(i) + ((hash << 5) - hash);
  return AVATAR_COLORS[Math.abs(hash) % AVATAR_COLORS.length];
}

function getInitials(name = "") {
  return name
    .split(" ")
    .slice(0, 2)
    .map((w) => w[0]?.toUpperCase() ?? "")
    .join("");
}


function Sidebar({ activeNav, onNavChange }) {
  return (
    <aside className="sidebar">
      <div className="sidebar__logo">Attendify</div>
      <nav className="sidebar__nav">
        {["Attendance", "Employee"].map((item) => (
          <div
            key={item}
            className={`nav-item${activeNav === item ? " nav-item--active" : ""}`}
            onClick={() => onNavChange(item)}
          >
            {item}
          </div>
        ))}
      </nav>
      <div className="sidebar__admin">
        <div className="admin-avatar">AD</div>
        <div>
          <div className="admin-info__name">Admin</div>
          <div className="admin-info__role">HR Admin</div>
        </div>
      </div>
    </aside>
  );
}

function StatCard({ label, value }) {
  return (
    <div className="stat-card">
      <div className="stat-card__label">{label}</div>
      <div className="stat-card__value">{value ?? "—"}</div>
    </div>
  );
}

function AttendanceTable({ records, onEdit }) {
  if (!records || records.length === 0) {
    return <div className="table-empty">No attendance records found.</div>;
  }

  return (
    <table className="attendance-table">
      <thead>
        <tr>
          <th>Employee</th>
          <th>Department</th>
          <th>Time In</th>
          <th>Time Out</th>
          <th>Status</th>
          <th>Action</th>
        </tr>
      </thead>
      <tbody>
        {records.map((record) => (
          <tr key={record.id}>
            <td>
              <div className="employee-cell">
                <div
                  className="employee-avatar"
                  style={{ background: getAvatarColor(record.name) }}
                >
                  {getInitials(record.name)}
                </div>
                <span className="employee-name">{record.name}</span>
              </div>
            </td>
            <td>{record.department}</td>
            <td><span className="time-val">{record.time_in ?? "—"}</span></td>
            <td><span className="time-val">{record.time_out ?? "—"}</span></td>
            <td>
              <span className={`badge ${STATUS_CLASS[record.status] ?? ""}`}>
                {record.status}
              </span>
            </td>
            <td>
              <button className="edit-btn" onClick={() => onEdit?.(record)}>
                Edit
              </button>
            </td>
          </tr>
        ))}
      </tbody>
    </table>
  );
}



export default function AttendifyDashboard({ records = [], loading = false, onEdit }) {
  const [dark, setDark]           = useState(false);
  const [activeNav, setActiveNav] = useState("Attendance");

  const total   = records.length;
  const present = records.filter((r) => r.status === "Present").length;
  const late    = records.filter((r) => r.status === "Late").length;
  const absent  = records.filter((r) => r.status === "Absent").length;

  const stats = [
    { label: "Total of Employee", value: total   },
    { label: "Total of Present",  value: present },
    { label: "Total of Late",     value: late    },
    { label: "Total of Absent",   value: absent  },
  ];

  return (
    <div className={`dashboard-root${dark ? " dark" : ""}`}>

    
      <Sidebar activeNav={activeNav} onNavChange={setActiveNav} />

    
      <main className="main">

        
        <header className="topbar">
          <h1 className="topbar__title">Attendance Dashboard</h1>
          <button className="dark-toggle" onClick={() => setDark((d) => !d)}>
            <span className="dark-toggle__dot" />
            Dark Mode
          </button>
        </header>

      
        <section className="stats-grid" aria-label="Attendance summary">
          {stats.map((s) => (
            <StatCard
              key={s.label}
              label={s.label}
              value={loading ? "…" : s.value}
            />
          ))}
        </section>

      
        <section className="table-section" aria-label="Attendance records">
          <div className="table-card">
            <h2 className="table-card__header">Attendance</h2>
            {loading ? (
              <p className="table-empty">Loading records…</p>
            ) : (
              <AttendanceTable records={records} onEdit={onEdit} />
            )}
          </div>
        </section>

      </main>
    </div>
  );
}