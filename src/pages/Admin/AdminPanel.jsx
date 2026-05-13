/* eslint-disable react-hooks/exhaustive-deps */
import { useEffect, useState, useCallback } from "react";
import { useNavigate } from "react-router-dom";
import "./Admin.css";
import { supabase } from "../../lib/supabaseClient";
import { useAuth } from "../../context/AuthContext";
import trashGif from "../../assets/icons/trash.gif";
import { FontAwesomeIcon } from "@fortawesome/react-fontawesome";
import { faBell } from "@fortawesome/free-regular-svg-icons";

const AdminPanel = () => {
  const { user } = useAuth();
  const navigate = useNavigate();

  const [activeNav, setActiveNav] = useState("attendance");
  const [darkMode, setDarkMode] = useState(false);
  const [menuOpen, setMenuOpen] = useState(false);
  const [adminProfile, setAdminProfile] = useState(null);

  const [attendance, setAttendance] = useState([]);
  const [filterDate, setFilterDate] = useState("");
  const [filterName, setFilterName] = useState("");

  const [employees, setEmployees] = useState([]);
  const [stats, setStats] = useState({ total: 0, present: 0, late: 0, absent: 0 });
  const [totalOvertime, setTotalOvertime] = useState(0);

  const [showEditModal, setShowEditModal] = useState(false);
  const [editRecord, setEditRecord] = useState(null);
  const [editFields, setEditFields] = useState({ clock_in: "", clock_out: "", status: "", date: "" });
  const [showDeleteModal, setShowDeleteModal] = useState(false);
  const [deleteId, setDeleteId] = useState(null);

  const [showEmpEdit, setShowEmpEdit] = useState(false);
  const [editEmp, setEditEmp] = useState(null);
  const [editEmpDept, setEditEmpDept] = useState("");
  const [showEmpDeleteModal, setShowEmpDeleteModal] = useState(false);
  const [deleteEmp, setDeleteEmp] = useState(null);

  const [leaveRequests, setLeaveRequests] = useState([]);
  const [leaveFilter, setLeaveFilter] = useState("all");
  const [showLeaveNoteModal, setShowLeaveNoteModal] = useState(false);
  const [selectedLeave, setSelectedLeave] = useState(null);
  const [adminNote, setAdminNote] = useState("");
  const [leaveAction, setLeaveAction] = useState("");

  const [shift, setShift] = useState({ start_time: "08:00", end_time: "17:00", grace_period: 15 });
  const [shiftSaving, setShiftSaving] = useState(false);
  const [shiftSaved, setShiftSaved] = useState(false);

  const [notifications, setNotifications] = useState([]);
  const [showNotif, setShowNotif] = useState(false);
  const [unreadCount, setUnreadCount] = useState(0);

  // ─── Fetch Functions ───────────────────────────────────────────────────────

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
      .select("*")
      .order("date", { ascending: false });

    if (filterDate) query = query.eq("date", filterDate);

    const { data: attData, error } = await query;

    if (error) { console.log("Attendance error:", error.message); return; }

    if (!attData || attData.length === 0) {
      setAttendance([]);
      const { data: allEmployees } = await supabase
        .from("profiles").select("id").eq("role", "employee");
      setStats({ total: allEmployees?.length || 0, present: 0, late: 0, absent: 0 });
      setTotalOvertime(0);
      return;
    }

    const userIds = [...new Set(attData.map((r) => r.user_id))];
    const { data: profilesData } = await supabase
      .from("profiles")
      .select("id, full_name, department, avatar_url")
      .in("id", userIds);

    const merged = attData.map((r) => ({
      ...r,
      profiles: profilesData?.find((p) => p.id === r.user_id) || null,
    }));

    const filtered = filterName
      ? merged.filter((r) =>
          r.profiles?.full_name?.toLowerCase().includes(filterName.toLowerCase())
        )
      : merged;

    setAttendance(filtered);

    const today = new Date().toISOString().split("T")[0];
    const todayData = merged.filter((r) => r.date === today);

    const { data: allEmployees } = await supabase
      .from("profiles").select("id").eq("role", "employee");

    setStats({
      total:   allEmployees?.length || 0,
      present: todayData.filter((r) => r.status === "present").length,
      late:    todayData.filter((r) => r.status === "late").length,
      absent:  todayData.filter((r) => r.status === "absent").length,
    });

    const totalOT = todayData.reduce((sum, r) => sum + (r.overtime_minutes || 0), 0);
    setTotalOvertime(totalOT);
  }, [filterDate, filterName]);

  const fetchEmployees = useCallback(async () => {
    const { data } = await supabase
      .from("profiles")
      .select("*")
      .eq("role", "employee")
      .order("full_name");
    if (data) setEmployees(data);
  }, []);

  const fetchNotifications = useCallback(async () => {
    const { data, error } = await supabase
      .from("leave_requests")
      .select("*")
      .eq("status", "pending")
      .order("created_at", { ascending: false });

    if (error) { console.log("notif error:", error); return; }

    if (!data || data.length === 0) {
      setNotifications([]);
      setUnreadCount(0);
      return;
    }

    const userIds = [...new Set(data.map((r) => r.user_id))];
    const { data: profilesData, error: profileError } = await supabase
      .from("profiles")
      .select("id, full_name, avatar_url")
      .in("id", userIds);

    if (profileError) console.log("profile error:", profileError);

    const merged = data.map((r) => ({
      ...r,
      profiles: profilesData?.find((p) => p.id === r.user_id) || null,
    }));

    setNotifications(merged);
    setUnreadCount(merged.length);
  }, []);

  const fetchLeaveRequests = useCallback(async () => {
    const { data, error } = await supabase
      .from("leave_requests")
      .select("*")
      .order("created_at", { ascending: false });

    if (error) { console.log("Leave error:", error.message); return; }
    if (!data || data.length === 0) { setLeaveRequests([]); return; }

    const userIds = [...new Set(data.map((r) => r.user_id))];
    const { data: profilesData } = await supabase
      .from("profiles")
      .select("id, full_name, department, avatar_url")
      .in("id", userIds);

    const merged = data.map((r) => ({
      ...r,
      profiles: profilesData?.find((p) => p.id === r.user_id) || null,
    }));

    setLeaveRequests(merged);
  }, []);

  const fetchShift = useCallback(async () => {
    const { data } = await supabase
      .from("shift_settings").select("*").eq("id", 1).single();
    if (data) setShift({
      start_time:   data.start_time,
      end_time:     data.end_time,
      grace_period: data.grace_period,
    });
  }, []);

  const autoMarkAbsent = useCallback(async () => {
    const { data: shiftData } = await supabase
      .from("shift_settings")
      .select("end_time")
      .eq("id", 1)
      .single();

    if (!shiftData) return;

    const now = new Date();
    const [endH, endM] = shiftData.end_time.split(":").map(Number);
    const nowMinutes = now.getHours() * 60 + now.getMinutes();
    const endMinutes = endH * 60 + endM;
    if (nowMinutes < endMinutes) return;

    const today = now.toISOString().split("T")[0];

    const { data: empList } = await supabase
      .from("profiles").select("id").eq("role", "employee");

    if (!empList || empList.length === 0) return;

    const { data: existing } = await supabase
      .from("attendance").select("user_id").eq("date", today);

    const existingIds = new Set(existing?.map((r) => r.user_id) || []);

    const absentRows = empList
      .filter((e) => !existingIds.has(e.id))
      .map((e) => ({ user_id: e.id, date: today, status: "absent" }));

    if (absentRows.length === 0) return;

    await supabase.from("attendance").insert(absentRows);
  }, []);

  // ─── Effects ───────────────────────────────────────────────────────────────

  useEffect(() => {
    if (!user) return;
    (async () => {
      await fetchAdminProfile();
      await fetchShift();
      await autoMarkAbsent();
      await fetchAttendance();
      await fetchEmployees();
      await fetchLeaveRequests();
      await fetchNotifications();
    })();
  }, [user]);

  useEffect(() => {
    if (!user) return;
    (async () => { await fetchAttendance(); })();
  }, [filterDate, filterName]);

  // ─── Real-time listener for leave_requests ─────────────────────────────────
  useEffect(() => {
    if (!user) return;

    const channel = supabase
      .channel("leave-requests-realtime")
      .on(
        "postgres_changes",
        { event: "*", schema: "public", table: "leave_requests" },
        () => {
          fetchNotifications();
          fetchLeaveRequests();
        }
      )
      .subscribe();

    return () => supabase.removeChannel(channel);
  }, [user]);

  useEffect(() => { document.body.classList.toggle("dark", darkMode); }, [darkMode]);

  useEffect(() => {
    const handleScroll = () => { if (menuOpen) setMenuOpen(false); };
    window.addEventListener("scroll", handleScroll, true);
    return () => window.removeEventListener("scroll", handleScroll, true);
  }, [menuOpen]);

  useEffect(() => {
    const handleClickOutside = (e) => {
      if (
        menuOpen &&
        !e.target.closest(".admin-mobile-dropdown") &&
        !e.target.closest(".admin-hamburger")
      ) setMenuOpen(false);

      if (showNotif && !e.target.closest(".notif-wrapper")) {
        setShowNotif(false);
      }
    };
    document.addEventListener("mousedown", handleClickOutside);
    return () => document.removeEventListener("mousedown", handleClickOutside);
  }, [menuOpen, showNotif]);

  // ─── Handlers ──────────────────────────────────────────────────────────────

  const handleLogout = async () => { await supabase.auth.signOut(); navigate("/login"); };

  const handleEditClick = (record) => {
    setEditRecord(record);
    setEditFields({
      clock_in:  record.clock_in  || "",
      clock_out: record.clock_out || "",
      status:    record.status    || "present",
      date:      record.date      || "",
    });
    setShowEditModal(true);
  };

  const handleSaveEdit = async () => {
    const { error } = await supabase
      .from("attendance")
      .update({
        clock_in:  editFields.clock_in,
        clock_out: editFields.clock_out,
        status:    editFields.status,
        date:      editFields.date,
      })
      .eq("id", editRecord.id);
    if (error) { alert("Error saving: " + error.message); return; }
    setShowEditModal(false);
    await fetchAttendance();
  };

  const handleDeleteClick = (id) => { setDeleteId(id); setShowDeleteModal(true); };

  const handleConfirmDelete = async () => {
    const { error } = await supabase.from("attendance").delete().eq("id", deleteId);
    if (!error) { setShowDeleteModal(false); setDeleteId(null); await fetchAttendance(); }
  };

  const handleEditEmp = (emp) => {
    setEditEmp(emp);
    setEditEmpDept(emp.department || "");
    setShowEmpEdit(true);
  };

  const handleSaveEmp = async () => {
    const { error } = await supabase
      .from("profiles").update({ department: editEmpDept }).eq("id", editEmp.id);
    if (!error) { setShowEmpEdit(false); await fetchEmployees(); }
  };

  const handleDeleteEmpClick = (emp) => { setDeleteEmp(emp); setShowEmpDeleteModal(true); };

  const handleConfirmDeleteEmp = async () => {
    await supabase.from("attendance").delete().eq("user_id", deleteEmp.id);
    await supabase.from("leave_requests").delete().eq("user_id", deleteEmp.id);
    await supabase.from("profiles").delete().eq("id", deleteEmp.id);
    await supabase.rpc("delete_user", { user_id: deleteEmp.id });
    setShowEmpDeleteModal(false);
    setDeleteEmp(null);
    await fetchEmployees();
    await fetchAttendance();
  };

  const openLeaveAction = (leave, action) => {
    setSelectedLeave(leave);
    setLeaveAction(action);
    setAdminNote("");
    setShowLeaveNoteModal(true);
  };

  const handleLeaveDecision = async () => {
    const { error } = await supabase
      .from("leave_requests")
      .update({ status: leaveAction, admin_note: adminNote })
      .eq("id", selectedLeave.id);

    if (error) { alert("Error: " + error.message); return; }

    await supabase.from("notifications").insert({
      user_id: selectedLeave.user_id,
      title: leaveAction === "approved" ? "Leave Approved" : "Leave Rejected",
      message:
        leaveAction === "approved"
          ? `Your ${selectedLeave.leave_type} leave request was approved.`
          : `Your ${selectedLeave.leave_type} leave request was rejected.`,
      type: "leave",
    });

    setShowLeaveNoteModal(false);
    await fetchLeaveRequests();
    await fetchNotifications(); // ← refresh bell count after decision
  };

  const handleSaveShift = async () => {
    setShiftSaving(true);

    const { error } = await supabase
      .from("shift_settings")
      .update({
        start_time: shift.start_time,
        end_time: shift.end_time,
        grace_period: Number(shift.grace_period),
      })
      .eq("id", 1);

    setShiftSaving(false);

    if (error) { alert("Error saving shift: " + error.message); return; }

    const { data: empList } = await supabase
      .from("profiles")
      .select("id")
      .eq("role", "employee");

    if (empList && empList.length > 0) {
      const notifRows = empList.map((emp) => ({
        user_id: emp.id,
        title: "Shift Schedule Updated",
        message: `Admin updated the work shift to ${formatTime(shift.start_time)} - ${formatTime(shift.end_time)}.`,
        type: "shift",
      }));
      await supabase.from("notifications").insert(notifRows);
    }

    setShiftSaved(true);
    setTimeout(() => setShiftSaved(false), 2500);
  };

  // ─── Helpers ───────────────────────────────────────────────────────────────

  const filteredLeaves = leaveFilter === "all"
    ? leaveRequests
    : leaveRequests.filter((l) => l.status === leaveFilter);

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

  const formatOvertime = (minutes) => {
    if (!minutes || minutes === 0) return null;
    const hrs = Math.floor(minutes / 60);
    const mins = minutes % 60;
    if (hrs === 0) return `${mins}m`;
    if (mins === 0) return `${hrs}h`;
    return `${hrs}h ${mins}m`;
  };

  const formatDate = (dateStr) => {
    if (!dateStr) return "--";
    return new Date(`${dateStr}T00:00:00`).toLocaleDateString("en-US", {
      month: "short", day: "numeric", year: "numeric",
    });
  };

  const getStatusBadge = (status) => {
    if (!status) return null;
    return (
      <span className={`badge-${status}`}>
        {status.charAt(0).toUpperCase() + status.slice(1)}
      </span>
    );
  };

  const getLeaveBadge = (status) => {
    const map = { pending: "badge-late", approved: "badge-present", rejected: "badge-absent" };
    return (
      <span className={map[status] || "badge-late"}>
        {status.charAt(0).toUpperCase() + status.slice(1)}
      </span>
    );
  };

  const downloadCSV = () => {
    if (attendance.length === 0) return;
    const headers = ["Employee", "Department", "Date", "Time In", "Time Out", "Overtime", "Status"];
    const rows = attendance.map((r) => [
      r.profiles?.full_name || "Unknown",
      r.profiles?.department || "--",
      formatDate(r.date),
      formatTime(r.clock_in),
      formatTime(r.clock_out),
      formatOvertime(r.overtime_minutes) || "--",
      r.status ? r.status.charAt(0).toUpperCase() + r.status.slice(1) : "--",
    ]);
    const csvContent = [headers, ...rows]
      .map((row) => row.map((cell) => `"${cell}"`).join(","))
      .join("\n");
    const blob = new Blob([csvContent], { type: "text/csv;charset=utf-8;" });
    const url = URL.createObjectURL(blob);
    const link = document.createElement("a");
    link.href = url;
    const label = filterDate ? `_${filterDate}` : `_${new Date().toISOString().split("T")[0]}`;
    link.download = `attendance${label}.csv`;
    link.click();
    URL.revokeObjectURL(url);
  };

  const navItems = ["attendance", "employee", "leave", "shift"];

  // ─── Render ────────────────────────────────────────────────────────────────

  return (
    <div className={`admin-layout ${darkMode ? "dark" : ""}`}>

      {/* Employee Edit Modal */}
      {showEmpEdit && (
        <div className="admin-modal-overlay" onClick={() => setShowEmpEdit(false)}>
          <div className="admin-modal-box" onClick={(e) => e.stopPropagation()}>
            <div className="admin-modal-header">
              <h2>Edit Employee Department</h2>
              <button className="admin-modal-close" onClick={() => setShowEmpEdit(false)}>✕</button>
            </div>
            <div className="admin-modal-body">
              <div className="admin-modal-field">
                <label>Employee</label>
                <input type="text" value={editEmp?.full_name || ""} disabled />
              </div>
              <div className="admin-modal-field">
                <label>Department</label>
                <select value={editEmpDept} onChange={(e) => setEditEmpDept(e.target.value)}>
                  <option value="">Select Department</option>
                  <option value="IT">IT</option>
                  <option value="HR">HR</option>
                  <option value="Accounting">Accounting</option>
                  <option value="Marketing">Marketing</option>
                  <option value="Operations">Operations</option>
                </select>
              </div>
            </div>
            <div className="admin-modal-footer">
              <button className="btn-cancel" onClick={() => setShowEmpEdit(false)}>Cancel</button>
              <button className="btn-save" onClick={handleSaveEmp}>Save</button>
            </div>
          </div>
        </div>
      )}

      {/* Employee Delete Modal */}
      {showEmpDeleteModal && (
        <div className="admin-modal-overlay" onClick={() => setShowEmpDeleteModal(false)}>
          <div className="admin-modal-box delete-modal" onClick={(e) => e.stopPropagation()}>
            <div className="delete-modal-icon">
              <img src={trashGif} alt="delete" width={80} height={80} />
            </div>
            <h2>Delete Employee</h2>
            <p>
              Are you sure you want to delete <strong>{deleteEmp?.full_name}</strong>?
              This will permanently remove their account, attendance records, and leave requests.
            </p>
            <div className="admin-modal-footer">
              <button className="btn-cancel" onClick={() => setShowEmpDeleteModal(false)}>Cancel</button>
              <button className="btn-confirm-delete" onClick={handleConfirmDeleteEmp}>Yes, Delete</button>
            </div>
          </div>
        </div>
      )}

      {/* Attendance Edit Modal */}
      {showEditModal && (
        <div className="admin-modal-overlay" onClick={() => setShowEditModal(false)}>
          <div className="admin-modal-box" onClick={(e) => e.stopPropagation()}>
            <div className="admin-modal-header">
              <h2>Edit Attendance Record</h2>
              <button className="admin-modal-close" onClick={() => setShowEditModal(false)}>✕</button>
            </div>
            <div className="admin-modal-body">
              <div className="admin-modal-field">
                <label>Date</label>
                <input type="date" value={editFields.date}
                  onChange={(e) => setEditFields({ ...editFields, date: e.target.value })} />
              </div>
              <div className="admin-modal-field">
                <label>Clock In</label>
                <input type="time" value={editFields.clock_in}
                  onChange={(e) => setEditFields({ ...editFields, clock_in: e.target.value })} />
              </div>
              <div className="admin-modal-field">
                <label>Clock Out</label>
                <input type="time" value={editFields.clock_out}
                  onChange={(e) => setEditFields({ ...editFields, clock_out: e.target.value })} />
              </div>
              <div className="admin-modal-field">
                <label>Status</label>
                <select value={editFields.status}
                  onChange={(e) => setEditFields({ ...editFields, status: e.target.value })}>
                  <option value="present">Present</option>
                  <option value="late">Late</option>
                  <option value="absent">Absent</option>
                </select>
              </div>
            </div>
            <div className="admin-modal-footer">
              <button className="btn-cancel" onClick={() => setShowEditModal(false)}>Cancel</button>
              <button className="btn-save" onClick={handleSaveEdit}>Save</button>
            </div>
          </div>
        </div>
      )}

      {/* Attendance Delete Modal */}
      {showDeleteModal && (
        <div className="admin-modal-overlay" onClick={() => setShowDeleteModal(false)}>
          <div className="admin-modal-box delete-modal" onClick={(e) => e.stopPropagation()}>
            <div className="delete-modal-icon">
              <img src={trashGif} alt="delete" width={80} height={80} />
            </div>
            <h2>Delete Record</h2>
            <p>Are you sure you want to delete this attendance record? This action cannot be undone.</p>
            <div className="admin-modal-footer">
              <button className="btn-cancel" onClick={() => setShowDeleteModal(false)}>Cancel</button>
              <button className="btn-confirm-delete" onClick={handleConfirmDelete}>Yes, Delete</button>
            </div>
          </div>
        </div>
      )}

      {/* Leave Action Modal */}
      {showLeaveNoteModal && (
        <div className="admin-modal-overlay" onClick={() => setShowLeaveNoteModal(false)}>
          <div className="admin-modal-box" onClick={(e) => e.stopPropagation()}>
            <div className="admin-modal-header">
              <h2>{leaveAction === "approved" ? "Approve" : "Reject"} Leave Request</h2>
              <button className="admin-modal-close" onClick={() => setShowLeaveNoteModal(false)}>✕</button>
            </div>
            <div className="admin-modal-body">
              <div className="admin-modal-field">
                <label>Employee</label>
                <input type="text" value={selectedLeave?.profiles?.full_name || ""} disabled />
              </div>
              <div className="admin-modal-field">
                <label>Leave Type</label>
                <input type="text" value={selectedLeave?.leave_type || ""} disabled />
              </div>
              <div className="admin-modal-field">
                <label>Admin Note <span style={{ color: "#888", fontWeight: 400 }}>(optional)</span></label>
                <textarea
                  rows={3}
                  placeholder="Add a note for the employee..."
                  value={adminNote}
                  onChange={(e) => setAdminNote(e.target.value)}
                  style={{
                    width: "100%", padding: "8px 12px", borderRadius: "8px",
                    background: "var(--modal-input-bg, #f5f5f5)",
                    border: "1px solid #ddd", color: "inherit",
                    resize: "vertical", fontFamily: "inherit",
                  }}
                />
              </div>
            </div>
            <div className="admin-modal-footer">
              <button className="btn-cancel" onClick={() => setShowLeaveNoteModal(false)}>Cancel</button>
              <button
                className={leaveAction === "approved" ? "btn-save" : "btn-confirm-delete"}
                onClick={handleLeaveDecision}
              >
                {leaveAction === "approved" ? "Approve" : "Reject"}
              </button>
            </div>
          </div>
        </div>
      )}

      {/* Sidebar */}
      <aside className="admin-sidebar">
        <div className="admin-sidebar-logo">Attendify</div>
        <nav className="admin-sidebar-nav">
          {navItems.map((nav) => (
            <div
              key={nav}
              className={`admin-nav-item ${activeNav === nav ? "active" : ""}`}
              onClick={() => setActiveNav(nav)}
            >
              {nav.charAt(0).toUpperCase() + nav.slice(1)}
            </div>
          ))}
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

      {/* Main */}
      <div className="admin-main">
        <div className="admin-topbar">
          <button className="admin-hamburger" onClick={() => setMenuOpen(!menuOpen)}>
            <span className={`admin-ham-line ${menuOpen ? "open" : ""}`} />
            <span className={`admin-ham-line ${menuOpen ? "open" : ""}`} />
            <span className={`admin-ham-line ${menuOpen ? "open" : ""}`} />
          </button>
          <h1>Attendance Dashboard</h1>

          <div className="admin-topbar-actions">

            {/* Notification Bell */}
            <div className="notif-wrapper">
              <button className="notif-btn" onClick={() => setShowNotif(!showNotif)}>
                <FontAwesomeIcon icon={faBell} />
                {unreadCount > 0 && (
                  <span className="notif-badge">{unreadCount}</span>
                )}
              </button>
              {showNotif && (
                <div className="notif-dropdown">
                  <div className="notif-header">
                    <h3>Leave Requests</h3>
                    <span>{unreadCount} pending</span>
                  </div>
                  {notifications.length === 0 ? (
                    <div className="notif-empty">No pending leave requests</div>
                  ) : (
                    notifications.map((n) => (
                      <div
                        key={n.id}
                        className="notif-item"
                        onClick={() => { setActiveNav("leave"); setShowNotif(false); }}
                      >
                        <div className="notif-avatar">
                          {n.profiles?.full_name?.charAt(0).toUpperCase() || "U"}
                        </div>
                        <div className="notif-info">
                          <p><strong>{n.profiles?.full_name}</strong> filed a leave</p>
                          <span>{n.leave_type}</span>
                          <span className="notif-date">
                            {new Date(n.created_at).toLocaleDateString("en-US", { month: "short", day: "numeric" })}
                          </span>
                        </div>
                      </div>
                    ))
                  )}
                  <div
                    className="notif-footer"
                    onClick={() => { setActiveNav("leave"); setShowNotif(false); }}
                  >
                    View all leave requests →
                  </div>
                </div>
              )}
            </div>

            <button className="admin-dark-toggle" onClick={() => setDarkMode(!darkMode)}>
              <div className={`admin-toggle-track ${darkMode ? "on" : ""}`}>
                <div className="admin-toggle-thumb" />
              </div>
              {darkMode ? "Light Mode" : "Dark Mode"}
            </button>
            <button className="admin-logout-btn" onClick={handleLogout}>Logout</button>
          </div>
        </div>

        {/* Mobile Dropdown */}
        <div className={`admin-mobile-dropdown ${menuOpen ? "open" : ""}`}>
          <div className="admin-dropdown-divider" />
          {navItems.map((nav) => (
            <div
              key={nav}
              className={`admin-nav-item ${activeNav === nav ? "active" : ""}`}
              onClick={() => { setActiveNav(nav); setMenuOpen(false); }}
            >
              {nav.charAt(0).toUpperCase() + nav.slice(1)}
            </div>
          ))}
          <div className="admin-dropdown-divider" />
          <div className="admin-nav-item admin-nav-logout" onClick={handleLogout}>Logout</div>
        </div>

        <div className="admin-content">

          {/* Stat Cards */}
          <div className="admin-stat-cards">
            <div className="admin-stat-card"><h3>Total Employees</h3><p>{stats.total}</p></div>
            <div className="admin-stat-card"><h3>Present Today</h3><p>{stats.present}</p></div>
            <div className="admin-stat-card"><h3>Late Today</h3><p>{stats.late}</p></div>
            <div className="admin-stat-card"><h3>Absent Today</h3><p>{stats.absent}</p></div>
            <div className="admin-stat-card">
              <h3>Total Overtime Today</h3>
              <p style={{ color: "#7c3aed" }}>
                {Math.floor(totalOvertime / 60)}h {totalOvertime % 60}m
              </p>
            </div>
          </div>

          {/* Attendance Tab */}
          {activeNav === "attendance" && (
            <div className="admin-table-section">
              <div className="admin-table-header">
                <h2>Attendance</h2>
                <div className="admin-table-filters">
                  <input type="text" className="admin-filter-input" placeholder="Search employee..."
                    value={filterName} onChange={(e) => setFilterName(e.target.value)} />
                  <input type="date" className="admin-filter-input"
                    value={filterDate} onChange={(e) => setFilterDate(e.target.value)} />
                  <button className="btn-cancel"
                    onClick={() => { setFilterDate(""); setFilterName(""); }}>
                    Clear
                  </button>
                  <button
                    className="btn-save"
                    onClick={downloadCSV}
                    disabled={attendance.length === 0}
                    title="Download current records as CSV"
                  >
                    ⬇ Export CSV
                  </button>
                </div>
              </div>
              {attendance.length === 0 ? (
                <div className="admin-no-data">No attendance records found.</div>
              ) : (
                <table className="admin-table">
                  <thead>
                    <tr>
                      <th>Employee</th><th>Department</th><th>Date</th>
                      <th>Time In</th><th>Time Out</th><th>Overtime</th>
                      <th>Status</th><th>Action</th>
                    </tr>
                  </thead>
                  <tbody>
                    {attendance.map((r) => (
                      <tr key={r.id}>
                        <td>
                          <div className="emp-cell">
                            <div className="emp-avatar" style={{ background: getAvatarColor(r.profiles?.full_name) }}>
                              {r.profiles?.avatar_url
                                ? <img src={r.profiles.avatar_url} alt="avatar" />
                                : getInitials(r.profiles?.full_name)
                              }
                            </div>
                            <span className="emp-name">{r.profiles?.full_name || "Unknown"}</span>
                          </div>
                        </td>
                        <td>{r.profiles?.department || "--"}</td>
                        <td>{formatDate(r.date)}</td>
                        <td>{formatTime(r.clock_in)}</td>
                        <td>{formatTime(r.clock_out)}</td>
                        <td style={{ color: r.overtime_minutes > 0 ? "#7c3aed" : "inherit" }}>
                          {formatOvertime(r.overtime_minutes) || "--"}
                        </td>
                        <td>{getStatusBadge(r.status)}</td>
                        <td>
                          <div className="action-btns">
                            <button className="btn-edit" onClick={() => handleEditClick(r)}>Edit</button>
                            <button className="btn-delete" onClick={() => handleDeleteClick(r.id)}>Delete</button>
                          </div>
                        </td>
                      </tr>
                    ))}
                  </tbody>
                </table>
              )}
            </div>
          )}

          {/* Employee Tab */}
          {activeNav === "employee" && (
            <div className="admin-table-section">
              <div className="admin-table-header"><h2>Employees</h2></div>
              {employees.length === 0 ? (
                <div className="admin-no-data">No employees found.</div>
              ) : (
                <table className="admin-table">
                  <thead>
                    <tr><th>Employee</th><th>Email</th><th>Department</th><th>Role</th><th>Action</th></tr>
                  </thead>
                  <tbody>
                    {employees.map((emp) => (
                      <tr key={emp.id}>
                        <td>
                          <div className="emp-cell">
                            <div className="emp-avatar" style={{ background: getAvatarColor(emp.full_name) }}>
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
                        <td>
                          <div className="action-btns">
                            <button className="btn-edit" onClick={() => handleEditEmp(emp)}>Edit</button>
                            <button className="btn-delete" onClick={() => handleDeleteEmpClick(emp)}>Delete</button>
                          </div>
                        </td>
                      </tr>
                    ))}
                  </tbody>
                </table>
              )}
            </div>
          )}

          {/* Leave Tab */}
          {activeNav === "leave" && (
            <div className="admin-table-section">
              <div className="admin-table-header">
                <h2>Leave Requests</h2>
                <div className="admin-table-filters">
                  {["all", "pending", "approved", "rejected"].map((f) => (
                    <button
                      key={f}
                      className={leaveFilter === f ? "btn-save" : "btn-cancel"}
                      onClick={() => setLeaveFilter(f)}
                      style={{ textTransform: "capitalize" }}
                    >
                      {f}
                    </button>
                  ))}
                </div>
              </div>
              {filteredLeaves.length === 0 ? (
                <div className="admin-no-data">No leave requests found.</div>
              ) : (
                <table className="admin-table">
                  <thead>
                    <tr>
                      <th>Employee</th><th>Department</th><th>Type</th>
                      <th>From</th><th>To</th><th>Reason</th><th>Status</th><th>Action</th>
                    </tr>
                  </thead>
                  <tbody>
                    {filteredLeaves.map((l) => (
                      <tr key={l.id}>
                        <td>
                          <div className="emp-cell">
                            <div className="emp-avatar" style={{ background: getAvatarColor(l.profiles?.full_name) }}>
                              {l.profiles?.avatar_url
                                ? <img src={l.profiles.avatar_url} alt="avatar" />
                                : getInitials(l.profiles?.full_name)
                              }
                            </div>
                            <span className="emp-name">{l.profiles?.full_name || "Unknown"}</span>
                          </div>
                        </td>
                        <td>{l.profiles?.department || "--"}</td>
                        <td>{l.leave_type}</td>
                        <td>{formatDate(l.start_date)}</td>
                        <td>{formatDate(l.end_date)}</td>
                        <td style={{ maxWidth: 160 }}>
                          <span className="leave-reason-text">{l.reason || "--"}</span>
                        </td>
                        <td>{getLeaveBadge(l.status)}</td>
                        <td>
                          {l.status === "pending" ? (
                            <div className="action-btns">
                              <button className="btn-save" onClick={() => openLeaveAction(l, "approved")}>Approve</button>
                              <button className="btn-confirm-delete" onClick={() => openLeaveAction(l, "rejected")}>Reject</button>
                            </div>
                          ) : (
                            <span style={{ fontSize: 13, color: "#888" }}>
                              {l.admin_note?.trim() || "—"}
                            </span>
                          )}
                        </td>
                      </tr>
                    ))}
                  </tbody>
                </table>
              )}
            </div>
          )}

          {/* Shift Tab */}
          {activeNav === "shift" && (
            <div className="shift-wrapper">
              <div className="shift-title"><h2>Global Shift Settings</h2></div>
              <div className="shift-settings-card">
                <p className="shift-desc">
                  These settings apply to <strong>all employees</strong>. The system will automatically
                  mark attendance as <em>late</em> if an employee clocks in after the start time + grace period.
                </p>
                <div className="shift-fields">
                  <div className="shift-field">
                    <label>Shift Start Time</label>
                    <input type="time" value={shift.start_time}
                      onChange={(e) => setShift({ ...shift, start_time: e.target.value })} />
                  </div>
                  <div className="shift-field">
                    <label>Shift End Time</label>
                    <input type="time" value={shift.end_time}
                      onChange={(e) => setShift({ ...shift, end_time: e.target.value })} />
                  </div>
                  <div className="shift-field">
                    <label>Grace Period (minutes)</label>
                    <input type="number" min={0} max={60} value={shift.grace_period}
                      onChange={(e) => setShift({ ...shift, grace_period: e.target.value })} />
                  </div>
                </div>
                <div className="shift-summary">
                  Employees clocking in after{" "}
                  <strong>
                    {(() => {
                      const [h, m] = shift.start_time.split(":").map(Number);
                      const total = h * 60 + m + Number(shift.grace_period);
                      const fh = Math.floor(total / 60) % 24;
                      const fm = total % 60;
                      return `${fh % 12 || 12}:${String(fm).padStart(2, "0")} ${fh >= 12 ? "PM" : "AM"}`;
                    })()}
                  </strong>{" "}
                  will be marked <span className="badge-late">Late</span>.
                </div>
                <button
                  className="btn-save shift-save-btn"
                  onClick={handleSaveShift}
                  disabled={shiftSaving}
                >
                  {shiftSaving ? "Saving..." : shiftSaved ? "✓ Saved!" : "Save Shift Settings"}
                </button>
              </div>
            </div>
          )}

        </div>
      </div>
    </div>
  );
};

export default AdminPanel;