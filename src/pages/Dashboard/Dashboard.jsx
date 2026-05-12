/* eslint-disable react-hooks/exhaustive-deps */
import { useEffect, useState, useCallback } from "react";
import { useNavigate } from "react-router-dom";
import './Dashboard.css';
import { supabase } from "../../lib/supabaseClient";
import { useAuth } from "../../context/AuthContext";
import EmployeeLeaveSection from "./EmployeeLeave";
import { FontAwesomeIcon } from "@fortawesome/react-fontawesome";
import { faBell } from "@fortawesome/free-regular-svg-icons";
import { faEye, faEyeSlash } from "@fortawesome/free-regular-svg-icons";


const SHIFT_HOURS     = 8;
const HISTORY_LIMIT   = 10;
const MIN_PASSWORD_LEN = 6;

const Dashboard = () => {
  const { user } = useAuth();
  const navigate = useNavigate();

  const [currentTime, setCurrentTime]               = useState(new Date()); 
  const [todayRecord, setTodayRecord]               = useState(null);
  const [history, setHistory]                       = useState([]);
  const [summary, setSummary]                       = useState({ present: 0, absent: 0, late: 0 });
  const [loading, setLoading]                       = useState(false);
  const [activeNav, setActiveNav]                   = useState("dashboard");
  const [profile, setProfile]                       = useState(null);
  const [darkMode, setDarkMode]                     = useState(false);
  const [menuOpen, setMenuOpen]                     = useState(false);
  const [clockInMsg, setClockInMsg]                 = useState(""); // FIX: replaces native alert()

  const [showProfile, setShowProfile]               = useState(false);
  const [editName, setEditName]                     = useState("");
  const [editEmail, setEditEmail]                   = useState("");
  const [editPassword, setEditPassword]             = useState("");
  const [confirmNewPassword, setConfirmNewPassword] = useState("");
  const [avatar, setAvatar]                         = useState(null);
  const [avatarPreview, setAvatarPreview]           = useState(null);
  const [profileLoading, setProfileLoading]         = useState(false);
  const [profileMsg, setProfileMsg]                 = useState({ type: "", text: "" });

  const [monthlyRecords, setMonthlyRecords]         = useState([]);
  const [notifications, setNotifications]           = useState([]);
  const [showNotif, setShowNotif]                   = useState(false);
  const [showNewPassword, setShowNewPassword] = useState(false);
const [showConfirmPassword, setShowConfirmPassword] = useState(false);
  const unreadCount = notifications.filter((n) => !n.is_read).length;

  const [selectedMonth, setSelectedMonth] = useState(() => {
    const now = new Date();
    return `${now.getFullYear()}-${String(now.getMonth() + 1).padStart(2, "0")}`;
  });

 
  const fetchShiftSettings = useCallback(async () => {
    const { data } = await supabase
      .from("shift_settings")
      .select("start_time, grace_period")
      .eq("id", 1)
      .single();
    return data || null;
  }, []);

  const calcStatus = (shiftData, now) => {
    if (!shiftData) return now.getHours() >= 9 ? "late" : "present";
    const [sh, sm] = shiftData.start_time.split(":").map(Number);
    const cutoff   = sh * 60 + sm + Number(shiftData.grace_period);
    const nowMin   = now.getHours() * 60 + now.getMinutes();
    return nowMin > cutoff ? "late" : "present";
  };

  // ── Data fetchers ───────────────────────────────────────────────────────────

  const fetchProfile = useCallback(async () => {
    const { data, error } = await supabase
      .from("profiles")
      .select("full_name, role, email, avatar_url")
      .eq("id", user.id)
      .single();
    if (error) { console.error("fetchProfile:", error.message); return; }
    if (data) {
      setProfile(data);
      setEditName(data.full_name || "");
      setEditEmail(data.email || user?.email || "");
      setAvatarPreview(data.avatar_url || null);
    }
  }, [user]);

  const fetchTodayRecord = useCallback(async () => {
    const today = new Date().toISOString().split("T")[0];
    const { data, error } = await supabase
      .from("attendance")
      .select("*")
      .eq("user_id", user.id)
      .eq("date", today)
      .single();
   
    if (error && error.code !== "PGRST116") {
      console.error("fetchTodayRecord:", error.message);
    }
    setTodayRecord(data || null);
  }, [user]);

  const fetchHistory = useCallback(async () => {
    const { data, error } = await supabase
      .from("attendance")
      .select("*")
      .eq("user_id", user.id)
      .order("date", { ascending: false })
      .limit(HISTORY_LIMIT);
    if (error) { console.error("fetchHistory:", error.message); return; }
    if (data) setHistory(data);
  }, [user]);

  
  const fetchMonthlySummary = useCallback(async () => {
    const now     = new Date();
    const year    = now.getFullYear();
    const month   = String(now.getMonth() + 1).padStart(2, "0");
    const from    = `${year}-${month}-01`;
    const lastDay = new Date(year, now.getMonth() + 1, 0).getDate();
    const to      = `${year}-${month}-${lastDay}`;
    const { data, error } = await supabase
      .from("attendance")
      .select("status")
      .eq("user_id", user.id)
      .gte("date", from)
      .lte("date", to);
    if (error) { console.error("fetchMonthlySummary:", error.message); return; }
    if (data) {
      setSummary({
        present: data.filter((r) => r.status === "present").length,
        late:    data.filter((r) => r.status === "late").length,
        absent:  data.filter((r) => r.status === "absent").length,
      });
    }
  }, [user]);

  const fetchMonthlyRecords = useCallback(async () => {
    const [year, month] = selectedMonth.split("-");
    const from    = `${year}-${month}-01`;
    const lastDay = new Date(year, month, 0).getDate();
    const to      = `${year}-${month}-${lastDay}`;
    const { data, error } = await supabase
      .from("attendance")
      .select("*")
      .eq("user_id", user.id)
      .gte("date", from)
      .lte("date", to)
      .order("date", { ascending: false });
    if (error) { console.error("fetchMonthlyRecords:", error.message); return; }
    setMonthlyRecords(data || []);
  }, [user, selectedMonth]);

  const fetchNotifications = useCallback(async () => {
    const { data, error } = await supabase
      .from("notifications")
      .select("*")
      .eq("user_id", user.id)
      .order("created_at", { ascending: false });
    if (error) { console.error("fetchNotifications:", error.message); return; }
    setNotifications(data || []);
  }, [user]);

 
  useEffect(() => {
    const timer = setInterval(() => setCurrentTime(new Date()), 1000);
    return () => clearInterval(timer);
  }, []);

  useEffect(() => {
    if (!user) return;
    (async () => {
      await fetchProfile();
      await fetchTodayRecord();
      await fetchHistory();
      await fetchMonthlySummary(); 
      await fetchNotifications();
    })();
  }, [user]);

  useEffect(() => {
    if (!user || activeNav !== "records") return;
    (async () => { await fetchMonthlyRecords(); })();
  }, [user, activeNav, selectedMonth]);

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
      if (menuOpen && !e.target.closest(".mobile-dropdown") && !e.target.closest(".hamburger")) {
        setMenuOpen(false);
      }
      if (showNotif && !e.target.closest(".notif-wrapper")) {
        setShowNotif(false);
      }
    };
    document.addEventListener("mousedown", handleClickOutside);
    return () => document.removeEventListener("mousedown", handleClickOutside);
  }, [menuOpen, showNotif]);


  useEffect(() => {
    if (!clockInMsg) return;
    const t = setTimeout(() => setClockInMsg(""), 3000);
    return () => clearTimeout(t);
  }, [clockInMsg]);


  const handleClockIn = async () => {
    setLoading(true);
    setClockInMsg("");
    const now     = new Date();
    const timeStr = now.toTimeString().split(" ")[0];
    const today   = now.toISOString().split("T")[0];

    const { data: existingRecord } = await supabase
      .from("attendance")
      .select("id, status")
      .eq("user_id", user.id)
      .eq("date", today)
      .single();

   
    const shiftData = await fetchShiftSettings();

    if (existingRecord) {
      if (existingRecord.status === "absent") {
        const status = calcStatus(shiftData, now);
        await supabase
          .from("attendance")
          .update({ clock_in: timeStr, status })
          .eq("id", existingRecord.id);
      } else {
       
        setClockInMsg("You have already clocked in today.");
        setLoading(false);
        return;
      }
    } else {
      const status = calcStatus(shiftData, now);
      await supabase.from("attendance").insert({
        user_id:  user.id,
        date:     today,
        clock_in: timeStr,
        status,
      });
    }

    await fetchTodayRecord();
    await fetchHistory();
    await fetchMonthlySummary();
    setLoading(false);
  };

  const handleClockOut = async () => {
    // FIX: null guard — prevents crash if todayRecord has no clock_in (race condition)
    if (!todayRecord?.clock_in) {
      console.error("handleClockOut: todayRecord or clock_in is missing");
      return;
    }

    setLoading(true);
    const timeStr = new Date().toTimeString().split(" ")[0];

    const [inH, inM]   = todayRecord.clock_in.split(":").map(Number);
    const [outH, outM] = timeStr.split(":").map(Number);
    const totalMinutes = (outH * 60 + outM) - (inH * 60 + inM);
    // FIX: uses named constant instead of magic number 8
    const overtimeMinutes = Math.max(0, totalMinutes - SHIFT_HOURS * 60);

    const { error } = await supabase
      .from("attendance")
      .update({ clock_out: timeStr, overtime_minutes: overtimeMinutes })
      .eq("id", todayRecord.id);

    if (!error) {
      await fetchTodayRecord();
      await fetchHistory();
      await fetchMonthlySummary();
    } else {
      console.error("handleClockOut update:", error.message);
    }
    setLoading(false);
  };

  const handleLogout = async () => {
    await supabase.auth.signOut();
    navigate("/login");
  };

  const handleAvatarChange = (e) => {
    const file = e.target.files[0];
    if (!file) return;
    setAvatar(file);
    setAvatarPreview(URL.createObjectURL(file));
  };

  const handleSaveProfile = async () => {
    setProfileLoading(true);
    setProfileMsg({ type: "", text: "" });
    try {
      let avatarUrl = profile?.avatar_url || null;
      if (avatar) {
        const fileExt  = avatar.name.split(".").pop();
        const fileName = `${user.id}.${fileExt}`;
        const { error: uploadError } = await supabase.storage
          .from("Avatar")
          .upload(fileName, avatar, { upsert: true });
        if (!uploadError) {
          const { data: urlData } = supabase.storage.from("Avatar").getPublicUrl(fileName);
 
          avatarUrl = `${urlData.publicUrl}?t=${Date.now()}`;
        }
      }

      const { error: profileError } = await supabase
        .from("profiles")
        .update({ full_name: editName, avatar_url: avatarUrl, email: editEmail })
        .eq("id", user.id);
      if (profileError) throw profileError;

      if (editEmail && editEmail !== user.email) {
        const { error: emailError } = await supabase.auth.updateUser({ email: editEmail });
        if (emailError) throw emailError;
      }

      if (editPassword && editPassword.trim() !== "") {
        if (editPassword !== confirmNewPassword) {
          setProfileMsg({ type: "error", text: "Passwords do not match!" });
          setProfileLoading(false);
          return;
        }
        // FIX: uses named constant instead of magic number 6
        if (editPassword.length < MIN_PASSWORD_LEN) {
          setProfileMsg({ type: "error", text: `Password must be at least ${MIN_PASSWORD_LEN} characters!` });
          setProfileLoading(false);
          return;
        }
        const { error: passError } = await supabase.auth.updateUser({ password: editPassword });
        if (passError) throw passError;
      }

      setProfile((prev) => ({ ...prev, full_name: editName, email: editEmail, avatar_url: avatarUrl }));
      setAvatarPreview(avatarUrl);
      setEditPassword("");
      setConfirmNewPassword("");
      setAvatar(null);
      setProfileMsg({ type: "success", text: "Profile updated successfully!" });
    } catch (err) {
      setProfileMsg({ type: "error", text: err.message });
    }
    setProfileLoading(false);
  };


  const formatTime = (timeStr) => {
    if (!timeStr) return "--:--";
    const [hours, minutes] = timeStr.split(":");
    const hour = parseInt(hours);
    return `${hour % 12 || 12}:${minutes} ${hour >= 12 ? "PM" : "AM"}`;
  };

  const calcHours = (clock_in, clock_out) => {
    if (!clock_in || !clock_out) return "--";
    const [inH, inM]   = clock_in.split(":").map(Number);
    const [outH, outM] = clock_out.split(":").map(Number);
    const totalMinutes = (outH * 60 + outM) - (inH * 60 + inM);
    return `${Math.floor(totalMinutes / 60)}h ${totalMinutes % 60}m`;
  };

  const formatOvertime = (minutes) => {
    if (!minutes || minutes === 0) return null;
    const hrs  = Math.floor(minutes / 60);
    const mins = minutes % 60;
    if (hrs === 0)  return `${mins}m overtime`;
    if (mins === 0) return `${hrs}h overtime`;
    return `${hrs}h ${mins}m overtime`;
  };

  const getInitials = (name) => {
    if (!name) return "U";
    return name.split(" ").map((n) => n[0]).join("").toUpperCase().slice(0, 2);
  };

  const getStatusBadge = (status) => {
    if (!status) return null;
    return (
      <span className={`badge-${status}`}>
        {status.charAt(0).toUpperCase() + status.slice(1)}
      </span>
    );
  };

  const totalDays = summary.present + summary.late + summary.absent;
  const monthlySummary = {
    present: monthlyRecords.filter((r) => r.status === "present").length,
    late:    monthlyRecords.filter((r) => r.status === "late").length,
    absent:  monthlyRecords.filter((r) => r.status === "absent").length,
  };

  // ── Render ───────────────────────────────────────────────────────────────────

  return (
    <div className={`app-layout ${darkMode ? "dark" : ""}`}>

      {/* ── PROFILE MODAL ── */}
      {showProfile && (
        <div className="modal-overlay" onClick={() => setShowProfile(false)}>
          <div className="modal-box" onClick={(e) => e.stopPropagation()}>
            <div className="modal-header">
              <h2>Profile Settings</h2>
              <button className="modal-close" onClick={() => setShowProfile(false)}>✕</button>
            </div>
            <div className="modal-avatar-section">
              <div className="modal-avatar">
                {avatarPreview
                  ? <img src={avatarPreview} alt="avatar" className="avatar-img-lg" />
                  : <span>{getInitials(profile?.full_name)}</span>
                }
              </div>
              <label className="btn-change-avatar">
                Change Photo
                <input type="file" accept="image/*" onChange={handleAvatarChange} style={{ display: "none" }} />
              </label>
            </div>
            <div className="modal-form">
              <div className="modal-field">
                <label>Full Name</label>
                <input type="text" value={editName} onChange={(e) => setEditName(e.target.value)} placeholder="Enter full name" />
              </div>
              <div className="modal-field">
                <label>Email</label>
                <input type="email" value={editEmail} onChange={(e) => setEditEmail(e.target.value)} placeholder="Enter email" />
              </div>
              <div className="modal-divider" />
              <p className="modal-section-label">Change Password</p>
              <div className="modal-field">
                <label>New Password</label>
                <div className="password-input-wrapper">
                  <input
                    type={showNewPassword ? "text" : "password"}
                    value={editPassword}
                    onChange={(e) => setEditPassword(e.target.value)}
                    placeholder="Leave blank to keep current"
                  />
                  <button
                    type="button"
                    className="eye-toggle"
                    onClick={() => setShowNewPassword((prev) => !prev)}
                    tabIndex={-1}
                  >
                    <FontAwesomeIcon icon={showNewPassword ? faEyeSlash : faEye} />
                  </button>
                </div>
              </div>
 
              {/* ── FIX: Confirm Password with eye toggle ── */}
              <div className="modal-field">
                <label>Confirm New Password</label>
                <div className="password-input-wrapper">
                  <input
                    type={showConfirmPassword ? "text" : "password"}
                    value={confirmNewPassword}
                    onChange={(e) => setConfirmNewPassword(e.target.value)}
                    placeholder="Confirm new password"
                  />
                  <button
                    type="button"
                    className="eye-toggle"
                    onClick={() => setShowConfirmPassword((prev) => !prev)}
                    tabIndex={-1}
                  >
                    <FontAwesomeIcon icon={showConfirmPassword ? faEyeSlash : faEye} />
                  </button>
                </div>
              </div>

              {profileMsg.text && (
                <p className={`modal-msg ${profileMsg.type}`}>
                  {profileMsg.type === "success" ? "✓" : "✕"} {profileMsg.text}
                </p>
              )}
              <button className="btn-save-profile" onClick={handleSaveProfile} disabled={profileLoading}>
                {profileLoading ? "Saving..." : "Save Changes"}
              </button>
            </div>
          </div>
        </div>
      )}

      {/* ── SIDEBAR ── */}
      <aside className="sidebar">
        <div className="sidebar-logo">Attendify</div>
        <p className="sidebar-menu-label">Menu</p>
        <nav className="sidebar-nav">
          <div className={`nav-item ${activeNav === "dashboard" ? "active" : ""}`} onClick={() => setActiveNav("dashboard")}>Dashboard</div>
          <div className={`nav-item ${activeNav === "records"   ? "active" : ""}`} onClick={() => setActiveNav("records")}>My Records</div>
          <div className={`nav-item ${activeNav === "leave"     ? "active" : ""}`} onClick={() => setActiveNav("leave")}>My Leave</div>
        </nav>
        <div className="sidebar-user" onClick={() => setShowProfile(true)}>
          <div className="user-avatar">
            {avatarPreview
              ? <img src={avatarPreview} alt="avatar" className="avatar-img" />
              : getInitials(profile?.full_name)
            }
          </div>
          <div className="user-info">
            <p>{profile?.full_name || "User"}</p>
            <span>⚙ Profile Settings</span>
          </div>
        </div>
      </aside>

      <div className="main-area">

        {/* ── TOPBAR ── */}
        <div className="topbar">
          <button className="hamburger" onClick={() => setMenuOpen(!menuOpen)}>
            <span className={`ham-line ${menuOpen ? "open" : ""}`} />
            <span className={`ham-line ${menuOpen ? "open" : ""}`} />
            <span className={`ham-line ${menuOpen ? "open" : ""}`} />
          </button>
          <h1>
            {activeNav === "dashboard" ? "Attendance Dashboard"
              : activeNav === "records" ? "My Records"
              : "My Leave"}
          </h1>

          <div className="topbar-actions">
            <button className="dark-mode-toggle" onClick={() => setDarkMode(!darkMode)}>
              <div className={`toggle-track ${darkMode ? "on" : ""}`}>
                <div className="toggle-thumb" />
              </div>
              {darkMode ? "Light Mode" : "Dark Mode"}
            </button>

            {/* ── NOTIFICATIONS — sits right beside the dark mode toggle ── */}
            <div className="notif-wrapper">
              <button
                className="notif-btn"
                onClick={async () => {
                  const newState = !showNotif;
                  setShowNotif(newState);
                  if (newState && unreadCount > 0) {
                    await supabase
                      .from("notifications")
                      .update({ is_read: true })
                      .eq("user_id", user.id)
                      .eq("is_read", false);
                    setNotifications((prev) => prev.map((n) => ({ ...n, is_read: true })));
                  }
                }}
              >
                <FontAwesomeIcon icon={faBell} />
                {unreadCount > 0 && <span className="notif-badge">{unreadCount}</span>}
              </button>

              {showNotif && (
                <div className="notif-dropdown">
                  <div className="notif-header">
                    <h3>Notifications</h3>
                    {notifications.length > 0 && (
                      <button
                        className="notif-clear-btn"
                        onClick={async () => {
                          const { error } = await supabase
                            .from("notifications")
                            .delete()
                            .eq("user_id", user.id);
                          if (!error) setNotifications([]);
                        }}
                      >
                        Clear All
                      </button>
                    )}
                  </div>
                  {notifications.length === 0 ? (
                    <div className="notif-empty">No notifications</div>
                  ) : (
                    notifications.map((n) => (
                      <div key={n.id} className={`notif-item ${!n.is_read ? "unread" : ""}`}>
                        <div className="notif-info">
                          <p>{n.message}</p>
                          <span className="notif-date">
                            {new Date(n.created_at).toLocaleDateString("en-US", { month: "short", day: "numeric" })}
                          </span>
                        </div>
                      </div>
                    ))
                  )}
                </div>
              )}
            </div>

            <button onClick={handleLogout} className="btn-logout">Logout</button>
          </div>
        </div>

        {/* ── MOBILE DROPDOWN ── */}
        <div className={`mobile-dropdown ${menuOpen ? "open" : ""}`}>
          <div className="mobile-dropdown-user">
            <div className="user-avatar">
              {avatarPreview
                ? <img src={avatarPreview} alt="avatar" className="avatar-img" />
                : getInitials(profile?.full_name)
              }
            </div>
            <div>
              <p>{profile?.full_name || "User"}</p>
              <span>{profile?.role || "Employee"}</span>
            </div>
          </div>
          <div className="mobile-dropdown-divider" />
          <div className={`nav-item ${activeNav === "dashboard" ? "active" : ""}`} onClick={() => { setActiveNav("dashboard"); setMenuOpen(false); }}>Dashboard</div>
          <div className={`nav-item ${activeNav === "records"   ? "active" : ""}`} onClick={() => { setActiveNav("records");   setMenuOpen(false); }}>My Records</div>
          <div className={`nav-item ${activeNav === "leave"     ? "active" : ""}`} onClick={() => { setActiveNav("leave");     setMenuOpen(false); }}>My Leave</div>
          <div className="nav-item" onClick={() => { setShowProfile(true); setMenuOpen(false); }}>⚙ Profile Settings</div>
          <div className="mobile-dropdown-divider" />
          <div className="nav-item nav-logout" onClick={() => { handleLogout(); setMenuOpen(false); }}>Logout</div>
        </div>

        {/* ── MAIN CONTENT ── */}
        <div className="dashboard-content">

          {/* DASHBOARD TAB */}
          {activeNav === "dashboard" && (
            <>
              <div className="top-row">
                <div className="welcome-card">
                  <h2>Welcome {profile?.full_name || "User"}</h2>
                  <div className="live-clock">
                    {currentTime.toLocaleTimeString("en-US", { hour: "2-digit", minute: "2-digit", second: "2-digit", hour12: false })}
                  </div>
                  <div className="live-date">
                    {currentTime.toLocaleDateString("en-US", { weekday: "long", month: "long", day: "numeric" })}
                  </div>

                  {/* FIX: inline message replaces native alert() */}
                  {clockInMsg && <p className="clock-in-msg">{clockInMsg}</p>}

                  {!todayRecord ? (
                    <>
                      <button className="btn-timein" onClick={handleClockIn} disabled={loading}>
                        {loading ? "Loading..." : "Time in"}
                      </button>
                      <p className="not-checked">You haven't checked in yet</p>
                    </>
                  ) : !todayRecord.clock_out ? (
                    <>
                      <button className="btn-timeout" onClick={handleClockOut} disabled={loading}>
                        {loading ? "Loading..." : "Time out"}
                      </button>
                      <p className="not-checked">Clocked in at {formatTime(todayRecord.clock_in)}</p>
                    </>
                  ) : (
                    <p className="checked-done">✓ Done for today!</p>
                  )}
                </div>

                <div className="summary-card">
                  <h3>Today's Summary</h3>
                  <div className="summary-row">
                    <span className="summary-label">Status</span>
                    {todayRecord ? getStatusBadge(todayRecord.status) : <span className="no-status">Not clocked in</span>}
                  </div>
                  <div className="summary-row">
                    <span className="summary-label">Time In</span>
                    <span className="summary-value">{formatTime(todayRecord?.clock_in)}</span>
                  </div>
                  <div className="summary-row">
                    <span className="summary-label">Time Out</span>
                    <span className="summary-value">{formatTime(todayRecord?.clock_out)}</span>
                  </div>
                  <div className="summary-row">
                    <span className="summary-label">Hours</span>
                    <span className="summary-value">{calcHours(todayRecord?.clock_in, todayRecord?.clock_out)}</span>
                  </div>
                  <div className="summary-row">
                    <span className="summary-label">Overtime</span>
                    {/* FIX: color driven by CSS class, not inline style */}
                    <span className={`summary-value ${todayRecord?.overtime_minutes > 0 ? "overtime-active" : "overtime-none"}`}>
                      {formatOvertime(todayRecord?.overtime_minutes) || "--"}
                    </span>
                  </div>
                  <div className="summary-row">
                    <span className="summary-label">Month</span>
                    {/* FIX: uses full-month summary, not last-10-row count */}
                    <span className="summary-value">{summary.present + summary.late}/{totalDays || 0}</span>
                  </div>
                </div>
              </div>

              {/* FIX: stat cards now show accurate full-month counts */}
              <div className="stat-cards">
                <div className="stat-card">
                  <span className="stat-number present">{summary.present}</span>
                  <span className="stat-label">Days Present</span>
                </div>
                <div className="stat-card">
                  <div className="stat-dot absent" />
                  <span className="stat-number absent">{summary.absent}</span>
                  <span className="stat-label">Days Absent</span>
                </div>
                <div className="stat-card">
                  <div className="stat-dot late" />
                  <span className="stat-number late">{summary.late}</span>
                  <span className="stat-label">Days Late</span>
                </div>
              </div>

              <div className="table-section">
                <div className="table-header">Recent Attendance</div>
                {history.length === 0 ? (
                  <div className="no-data">No attendance records yet.</div>
                ) : (
                  <table className="att-table">
                    <thead>
                      <tr>
                        <th>Date</th><th>Time In</th><th>Time Out</th>
                        <th>Hours</th><th>Overtime</th><th>Status</th>
                      </tr>
                    </thead>
                    <tbody>
                      {history.map((r) => (
                        <tr key={r.id}>
                          <td>{new Date(r.date).toLocaleDateString("en-US", { month: "long", day: "numeric", year: "numeric" })}</td>
                          <td>{formatTime(r.clock_in)}</td>
                          <td>{formatTime(r.clock_out)}</td>
                          <td>{calcHours(r.clock_in, r.clock_out)}</td>
                          {/* FIX: CSS class replaces inline style */}
                          <td className={r.overtime_minutes > 0 ? "overtime-active" : "overtime-none"}>
                            {formatOvertime(r.overtime_minutes) || "--"}
                          </td>
                          <td>{getStatusBadge(r.status)}</td>
                        </tr>
                      ))}
                    </tbody>
                  </table>
                )}
              </div>
            </>
          )}

          {/* RECORDS TAB */}
          {activeNav === "records" && (
            <>
              <div className="records-header">
                <h2>Monthly Attendance Records</h2>
                <input
                  type="month"
                  className="month-picker"
                  value={selectedMonth}
                  onChange={(e) => setSelectedMonth(e.target.value)}
                />
              </div>

              <div className="stat-cards" style={{ marginBottom: "20px" }}>
                <div className="stat-card">
                  <span className="stat-number present">{monthlySummary.present}</span>
                  <span className="stat-label">Days Present</span>
                </div>
                <div className="stat-card">
                  <div className="stat-dot absent" />
                  <span className="stat-number absent">{monthlySummary.absent}</span>
                  <span className="stat-label">Days Absent</span>
                </div>
                <div className="stat-card">
                  <div className="stat-dot late" />
                  <span className="stat-number late">{monthlySummary.late}</span>
                  <span className="stat-label">Days Late</span>
                </div>
              </div>

              <div className="table-section">
                <div className="table-header">
                  Records for {new Date(selectedMonth + "-01").toLocaleDateString("en-US", { month: "long", year: "numeric" })}
                </div>
                {monthlyRecords.length === 0 ? (
                  <div className="no-data">No records for this month.</div>
                ) : (
                  <table className="att-table">
                    <thead>
                      <tr>
                        <th>Date</th><th>Time In</th><th>Time Out</th>
                        <th>Hours</th><th>Overtime</th><th>Status</th>
                      </tr>
                    </thead>
                    <tbody>
                      {monthlyRecords.map((r) => (
                        <tr key={r.id}>
                          <td>{new Date(r.date).toLocaleDateString("en-US", { weekday: "short", month: "long", day: "numeric" })}</td>
                          <td>{formatTime(r.clock_in)}</td>
                          <td>{formatTime(r.clock_out)}</td>
                          <td>{calcHours(r.clock_in, r.clock_out)}</td>
                          <td className={r.overtime_minutes > 0 ? "overtime-active" : "overtime-none"}>
                            {formatOvertime(r.overtime_minutes) || "--"}
                          </td>
                          <td>{getStatusBadge(r.status)}</td>
                        </tr>
                      ))}
                    </tbody>
                  </table>
                )}
              </div>
            </>
          )}

          {/* LEAVE TAB */}
          {activeNav === "leave" && <EmployeeLeaveSection />}

        </div>
      </div>
    </div>
  );
};

export default Dashboard;