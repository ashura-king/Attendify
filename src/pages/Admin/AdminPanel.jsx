import { useEffect, useState, useCallback } from "react";
import { useNavigate } from "react-router-dom";
import "./Admin.css";
import { supabase } from "../../lib/supabaseClient";
import { useAuth } from "../../context/AuthContext";

const AdminPanel = () => {
  const { user } = useAuth();
  const navigate = useNavigate();

  const [activeNav, setActiveNav] = useState("attendance");
  const [darkMode, setDarkMode] = useState(false);
  const [menuOpen, setMenuOpen] = useState(false);
  const [adminProfile, setAdminProfile] = useState(null);

  // Attendance states
  const [attendance, setAttendance] = useState([]);
  const [filterDate, setFilterDate] = useState("");
  const [filterName, setFilterName] = useState("");

  // Employee states
  const [employees, setEmployees] = useState([]);

  // Stats
  const [stats, setStats] = useState({ total: 0, present: 0, late: 0, absent: 0 });

  // Edit modal
  const [showEditModal, setShowEditModal] = useState(false);
  const [editRecord, setEditRecord] = useState(null);
  const [editFields, setEditFields] = useState({
    clock_in: "", clock_out: "", status: "", date: ""
  });

  // ===== FETCH FUNCTIONS =====

  const fetchAdminProfile = useCallback(async () => {
    const { data } = await supabase
      .from("profiles")
      .select("full_name, role, avatar_url")
      .eq("id", user.id)
      .single();
    if (data) setAdminProfile(data);
  }, [user]);

  const fetchAttendance = useCallback(async () => {
    let query = supabase
      .from("attendance")
      .select("*, profiles(full_name, department, avatar_url)")
      .order("date", { ascending: false });

    if (filterDate) query = query.eq("date", filterDate);

    const { data } = await query;

    if (data) {
      let filtered = data;
      if (filterName) {
        filtered = data.filter((r) =>
          r.profiles?.full_name?.toLowerCase().includes(filterName.toLowerCase())
        );
      }
      setAttendance(filtered);

      // Stats for today
      const today = new Date().toISOString().split("T")[0];
      const todayData = data.filter((r) => r.date === today);
      const allEmployees = await supabase.from("profiles").select("id").eq("role", "employee");
      setStats({
        total: allEmployees.data?.length || 0,
        present: todayData.filter((r) => r.status === "present").length,
        late: todayData.filter((r) => r.status === "late").length,
        absent: todayData.filter((r) => r.status === "absent").length,
      });
    }
  }, [filterDate, filterName]);

  const fetchEmployees = useCallback(async () => {
    const { data } = await supabase
      .from("profiles")
      .select("*")
      .eq("role", "employee")
      .order("full_name");
    if (data) setEmployees(data);
  }, []);



  useEffect(() => {
    if (!user) return;
    const load = async () => {
      await fetchAdminProfile();
      await fetchAttendance();
      await fetchEmployees();
    };
    load();
  }, [user, fetchAdminProfile, fetchAttendance, fetchEmployees]);

  useEffect(() => {
    document.body.classList.toggle("dark", darkMode);
  }, [darkMode]);

  useEffect(() => {
    const handleScroll = () => { if (menuOpen) setMenuOpen(false); };
    window.addEventListener("scroll", handleScroll, true);
    return () => window.removeEventListener("scroll", handleScroll, true);
  }, [menuOpen]);

  useEffect(() => {
    const handleClickOutside = (e) => {
      if (menuOpen &&
        !e.target.closest(".admin-mobile-dropdown") &&
        !e.target.closest(".admin-hamburger")
      ) setMenuOpen(false);
    };
    document.addEventListener("mousedown", handleClickOutside);
    return () => document.removeEventListener("mousedown", handleClickOutside);
  }, [menuOpen]);

s
  useEffect(() => {
    if (user) fetchAttendance();
  }, [filterDate, filterName, fetchAttendance]);

 
  const handleLogout = async () => {
    await supabase.auth.signOut();
    navigate("/login");
  };

  const handleEditClick = (record) => {
    setEditRecord(record);
    setEditFields({
      clock_in: record.clock_in || "",
      clock_out: record.clock_out || "",
      status: record.status || "present",
      date: record.date || "",
    });
    setShowEditModal(true);
  };

  const handleSaveEdit = async () => {
    const { error } = await supabase
      .from("attendance")
      .update({
        clock_in: editFields.clock_in,
        clock_out: editFields.clock_out,
        status: editFields.status,
        date: editFields.date,
      })
      .eq("id", editRecord.id);

    if (!error) {
      setShowEditModal(false);
      await fetchAttendance();
    }
  };

  const handleDelete = async (id) => {
    if (!window.confirm("Are you sure you want to delete this record?")) return;
    const { error } = await supabase.from("attendance").delete().eq("id", id);
    if (!error) await fetchAttendance();
  };

 

  const getInitials = (name) => {
    if (!name) return "U";
    return name.split(" ").map((n) => n[0]).join("").toUpperCase().slice(0, 2);
  };

  const getAvatarColor = (name) => {
    const colors = ["#7c3aed", "#2563eb", "#059669", "#dc2626", "#d97706", "#db2777"];
    if (!name) return colors[0];
    return colors[name.charCodeAt(0) % colors.length];
  };

  const formatTime = (timeStr) => {
    if (!timeStr) return "--:--";
    const [hours, minutes] = timeStr.split(":");
    const hour = parseInt(hours);
    return `${hour % 12 || 12}:${minutes} ${hour >= 12 ? "PM" : "AM"}`;
  };

  const getStatusBadge = (status) => {
    if (!status) return null;
    return (
      <span className={`badge-${status}`}>
        {status.charAt(0).toUpperCase() + status.slice(1)}
      </span>
    );
  };

 
  return (
    <div className={`admin-layout ${darkMode ? "dark" : ""}`}>

     
      {showEditModal && (
        <div className="admin-modal-overlay" onClick={() => setShowEditModal(false)}>
          <div className="admin-modal-box" onClick={(e) => e.stopPropagation()}>
            <div className="admin-modal-header">
              <h2>Edit Attendance</h2>
              <button className="admin-modal-close" onClick={() => setShowEditModal(false)}>✕</button>
            </div>
            <div className="admin-modal-body">
              <div className="admin-modal-field">
                <label>Employee</label>
                <input type="text" value={editRecord?.profiles?.full_name || ""} disabled />
              </div>
              <div className="admin-modal-field">
                <label>Date</label>
                <input
                  type="date"
                  value={editFields.date}
                  onChange={(e) => setEditFields({ ...editFields, date: e.target.value })}
                />
              </div>
              <div className="admin-modal-field">
                <label>Clock In</label>
                <input
                  type="time"
                  value={editFields.clock_in}
                  onChange={(e) => setEditFields({ ...editFields, clock_in: e.target.value })}
                />
              </div>
              <div className="admin-modal-field">
                <label>Clock Out</label>
                <input
                  type="time"
                  value={editFields.clock_out}
                  onChange={(e) => setEditFields({ ...editFields, clock_out: e.target.value })}
                />
              </div>
              <div className="admin-modal-field">
                <label>Status</label>
                <select
                  value={editFields.status}
                  onChange={(e) => setEditFields({ ...editFields, status: e.target.value })}
                >
                  <option value="present">Present</option>
                  <option value="late">Late</option>
                  <option value="absent">Absent</option>
                </select>
              </div>
            </div>
            <div className="admin-modal-footer">
              <button className="btn-cancel" onClick={() => setShowEditModal(false)}>Cancel</button>
              <button className="btn-save" onClick={handleSaveEdit}>Save Changes</button>
            </div>
          </div>
        </div>
      )}

      
      <aside className="admin-sidebar">
        <div className="admin-sidebar-logo">Attendify</div>
        <nav className="admin-sidebar-nav">
          <div
            className={`admin-nav-item ${activeNav === "attendance" ? "active" : ""}`}
            onClick={() => setActiveNav("attendance")}
          >
            Attendance
          </div>
          <div
            className={`admin-nav-item ${activeNav === "employee" ? "active" : ""}`}
            onClick={() => setActiveNav("employee")}
          >
            Employee
          </div>
        </nav>
        <div className="admin-sidebar-user">
          <div className="admin-user-avatar" style={{ background: getAvatarColor(adminProfile?.full_name) }}>
            {adminProfile?.avatar_url
              ? <img src={adminProfile.avatar_url} alt="avatar" />
              : getInitials(adminProfile?.full_name)
            }
          </div>
          <div className="admin-user-info">
            <p>{adminProfile?.full_name || "Admin"}</p>
            <span>HR Admin</span>
          </div>
        </div>
      </aside>

    
      <div className="admin-main">

       
        <div className="admin-topbar">
          <button className="admin-hamburger" onClick={() => setMenuOpen(!menuOpen)}>
            <span className={`admin-ham-line ${menuOpen ? "open" : ""}`}></span>
            <span className={`admin-ham-line ${menuOpen ? "open" : ""}`}></span>
            <span className={`admin-ham-line ${menuOpen ? "open" : ""}`}></span>
          </button>
          <h1>Attendance Dashboard</h1>
          <div className="admin-topbar-actions">
            <button className="admin-dark-toggle" onClick={() => setDarkMode(!darkMode)}>
              <div className={`admin-toggle-track ${darkMode ? "on" : ""}`}>
                <div className="admin-toggle-thumb" />
              </div>
              {darkMode ? "Light Mode" : "Dark Mode"}
            </button>
            <button className="admin-logout-btn" onClick={handleLogout}>Logout</button>
          </div>
        </div>

     
        <div className={`admin-mobile-dropdown ${menuOpen ? "open" : ""}`}>
          <div className="admin-dropdown-divider" />
          <div
            className={`admin-nav-item ${activeNav === "attendance" ? "active" : ""}`}
            onClick={() => { setActiveNav("attendance"); setMenuOpen(false); }}
          >
            Attendance
          </div>
          <div
            className={`admin-nav-item ${activeNav === "employee" ? "active" : ""}`}
            onClick={() => { setActiveNav("employee"); setMenuOpen(false); }}
          >
            Employee
          </div>
          <div className="admin-dropdown-divider" />
          <div className="admin-nav-item admin-nav-logout" onClick={handleLogout}>
            Logout
          </div>
        </div>

        <div className="admin-content">

       
          <div className="admin-stat-cards">
            <div className="admin-stat-card">
              <h3>Total Of Employee</h3>
              <p>{stats.total}</p>
            </div>
            <div className="admin-stat-card">
              <h3>Total of Present</h3>
              <p>{stats.present}</p>
            </div>
            <div className="admin-stat-card">
              <h3>Total of Late</h3>
              <p>{stats.late}</p>
            </div>
            <div className="admin-stat-card">
              <h3>Total of Absent</h3>
              <p>{stats.absent}</p>
            </div>
          </div>

        
          {activeNav === "attendance" && (
            <div className="admin-table-section">
              <div className="admin-table-header">
                <h2>Attendance</h2>
                <div className="admin-table-filters">
                  <input
                    type="text"
                    className="admin-filter-input"
                    placeholder="Search employee..."
                    value={filterName}
                    onChange={(e) => setFilterName(e.target.value)}
                  />
                  <input
                    type="date"
                    className="admin-filter-input"
                    value={filterDate}
                    onChange={(e) => setFilterDate(e.target.value)}
                  />
                  <button
                    className="btn-cancel"
                    onClick={() => { setFilterDate(""); setFilterName(""); }}
                  >
                    Clear
                  </button>
                </div>
              </div>

              {attendance.length === 0 ? (
                <div className="admin-no-data">No attendance records found.</div>
              ) : (
                <table className="admin-table">
                  <thead>
                    <tr>
                      <th>Employee</th>
                      <th>Department</th>
                      <th>Date</th>
                      <th>Time In</th>
                      <th>Time Out</th>
                      <th>Status</th>
                      <th>Action</th>
                    </tr>
                  </thead>
                  <tbody>
                    {attendance.map((r) => (
                      <tr key={r.id}>
                        <td>
                          <div className="emp-cell">
                            <div
                              className="emp-avatar"
                              style={{ background: getAvatarColor(r.profiles?.full_name) }}
                            >
                              {r.profiles?.avatar_url
                                ? <img src={r.profiles.avatar_url} alt="avatar" />
                                : getInitials(r.profiles?.full_name)
                              }
                            </div>
                            <span className="emp-name">{r.profiles?.full_name || "Unknown"}</span>
                          </div>
                        </td>
                        <td>{r.profiles?.department || "--"}</td>
                        <td>{new Date(r.date).toLocaleDateString("en-US", { month: "short", day: "numeric", year: "numeric" })}</td>
                        <td>{formatTime(r.clock_in)}</td>
                        <td>{formatTime(r.clock_out)}</td>
                        <td>{getStatusBadge(r.status)}</td>
                        <td>
                          <div className="action-btns">
                            <button className="btn-edit" onClick={() => handleEditClick(r)}>Edit</button>
                            <button className="btn-delete" onClick={() => handleDelete(r.id)}>Delete</button>
                          </div>
                        </td>
                      </tr>
                    ))}
                  </tbody>
                </table>
              )}
            </div>
          )}

          {activeNav === "employee" && (
            <div className="admin-table-section">
              <div className="admin-table-header">
                <h2>Employees</h2>
              </div>
              {employees.length === 0 ? (
                <div className="admin-no-data">No employees found.</div>
              ) : (
                <table className="admin-table">
                  <thead>
                    <tr>
                      <th>Employee</th>
                      <th>Email</th>
                      <th>Department</th>
                      <th>Role</th>
                    </tr>
                  </thead>
                  <tbody>
                    {employees.map((emp) => (
                      <tr key={emp.id}>
                        <td>
                          <div className="emp-cell">
                            <div
                              className="emp-avatar"
                              style={{ background: getAvatarColor(emp.full_name) }}
                            >
                              {emp.avatar_url
                                ? <img src={emp.avatar_url} alt="avatar" />
                                : getInitials(emp.full_name)
                              }
                            </div>
                            <span className="emp-name">{emp.full_name || "Unknown"}</span>
                          </div>
                        </td>
                        <td>{emp.email || "--"}</td>
                        <td>{emp.department || "--"}</td>
                        <td><span className="emp-role-badge">{emp.role}</span></td>
                      </tr>
                    ))}
                  </tbody>
                </table>
              )}
            </div>
          )}
        </div>
      </div>
    </div>
  );
};

export default AdminPanel;