import { useEffect, useState,useCallback } from "react";
import { useNavigate } from "react-router-dom";
import './Dashboard.css';
import { supabase } from "../../lib/supabaseClient";
import { useAuth } from "../../context/AuthContext";

const Dashboard = () => {
  const { user } = useAuth();
  const navigate = useNavigate();

  const [currentTime, setcurrentTime] = useState(new Date());
  const [todayRecord, setTodayRecord] = useState(null);
  const [history, setHistory] = useState([]);
  const [summary, setSummary] = useState({ present: 0, absent: 0, late: 0 });
  const [loading, setLoading] = useState(false);
  const [activeNav, setActiveNav] = useState("dashboard");
  const [profile, setProfile] = useState(null);
  const [darkMode, setDarkMode] = useState(false);
  const [menuOpen, setMenuOpen] = useState(false);

  // Profile modal states
  const [showProfile, setShowProfile] = useState(false);
  const [editName, setEditName] = useState("");
  const [editEmail, setEditEmail] = useState("");
  const [editPassword, setEditPassword] = useState("");
  const [confirmNewPassword, setConfirmNewPassword] = useState("");
  const [avatar, setAvatar] = useState(null);
  const [avatarPreview, setAvatarPreview] = useState(null);
  const [profileLoading, setProfileLoading] = useState(false);
  const [profileMsg, setProfileMsg] = useState({ type: "", text: "" });

  // Monthly records states
  const [monthlyRecords, setMonthlyRecords] = useState([]);
  const [selectedMonth, setSelectedMonth] = useState(() => {
    const now = new Date();
    return `${now.getFullYear()}-${String(now.getMonth() + 1).padStart(2, "0")}`;
  });

  // ===== FETCH FUNCTIONS =====

  const fetchProfile = useCallback(async () => {
  const { data } = await supabase
    .from("profiles")
    .select("full_name, role, email, avatar_url")
    .eq("id", user.id)
    .single();
  if (data) {
    setProfile(data);
    setEditName(data?.full_name || "");
    setEditEmail(data?.email || user?.email || "");
    setAvatarPreview(data?.avatar_url || null);
  }
}, [user]);

const fetchTodayRecord = useCallback(async () => {
  const today = new Date().toISOString().split("T")[0];
  const { data } = await supabase
    .from("attendance")
    .select("*")
    .eq("user_id", user.id)
    .eq("date", today)
    .single();
  setTodayRecord(data || null);
}, [user]);

const fetchHistory = useCallback(async () => {
  const { data } = await supabase
    .from("attendance")
    .select("*")
    .eq("user_id", user.id)
    .order("date", { ascending: false })
    .limit(10);
  if (data) {
    setHistory(data);
    setSummary({
      present: data.filter((r) => r.status === "present").length,
      late: data.filter((r) => r.status === "late").length,
      absent: data.filter((r) => r.status === "absent").length,
    });
  }
}, [user]);

const fetchMonthlyRecords = useCallback(async () => {
  const [year, month] = selectedMonth.split("-");
  const from = `${year}-${month}-01`;
  const lastDay = new Date(year, month, 0).getDate();
  const to = `${year}-${month}-${lastDay}`;
  const { data } = await supabase
    .from("attendance")
    .select("*")
    .eq("user_id", user.id)
    .gte("date", from)
    .lte("date", to)
    .order("date", { ascending: false });
  setMonthlyRecords(data || []);
}, [user, selectedMonth]);

  // ===== USE EFFECTS =====

  // Live clock
  useEffect(() => {
    const timer = setInterval(() => setcurrentTime(new Date()), 1000);
    return () => clearInterval(timer);
  }, []);

  // Fetch data on login
  useEffect(() => {
  if (!user) return;

  const loadData = async () => {
    await fetchProfile();
    await fetchTodayRecord();
    await fetchHistory();
  };

  loadData();
}, [user,fetchProfile,fetchTodayRecord,fetchHistory]);
  // Fetch monthly records when nav changes
  useEffect(() => {
     if(!user || activeNav !== "records") return;
     const loadRecords = async () =>{
      await fetchMonthlyRecords();
     };

    loadRecords();
  }, [user, activeNav, selectedMonth,fetchMonthlyRecords]);

  // Dark mode
  useEffect(() => {
    document.body.classList.toggle("dark", darkMode);
  }, [darkMode]);

  // Close menu on scroll
  useEffect(() => {
    const handleScroll = () => {
      if (menuOpen) setMenuOpen(false);
    };
    window.addEventListener("scroll", handleScroll, true);
    return () => window.removeEventListener("scroll", handleScroll, true);
  }, [menuOpen]);

  // Close menu on outside click
  useEffect(() => {
    const handleClickOutside = (e) => {
      if (
        menuOpen &&
        !e.target.closest(".mobile-dropdown") &&
        !e.target.closest(".hamburger")
      ) {
        setMenuOpen(false);
      }
    };
    document.addEventListener("mousedown", handleClickOutside);
    return () => document.removeEventListener("mousedown", handleClickOutside);
  }, [menuOpen]);

  // ===== ATTENDANCE HANDLERS =====

  const handleClockIn = async () => {
    setLoading(true);
    const now = new Date();
    const timeStr = now.toTimeString().split(" ")[0];
    const today = now.toISOString().split("T")[0];
    const status = now.getHours() >= 9 ? "late" : "present";

    const { error } = await supabase.from("attendance").insert({
      user_id: user.id,
      date: today,
      clock_in: timeStr,
      status,
    });

    if (!error) {
      await fetchTodayRecord();
      await fetchHistory();
    }
    setLoading(false);
  };

  const handleClockOut = async () => {
    setLoading(true);
    const timeStr = new Date().toTimeString().split(" ")[0];

    const { error } = await supabase
      .from("attendance")
      .update({ clock_out: timeStr })
      .eq("id", todayRecord.id);

    if (!error) {
      await fetchTodayRecord();
      await fetchHistory();
    }
    setLoading(false);
  };

  const handleLogout = async () => {
    await supabase.auth.signOut();
    navigate("/login");
  };

  // ===== PROFILE HANDLERS =====

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
      // Upload avatar if changed
      let avatarUrl = profile?.avatar_url || null;
      if (avatar) {
        const fileExt = avatar.name.split(".").pop();
        const fileName = `${user.id}.${fileExt}`;
        const { error: uploadError } = await supabase.storage
          .from("Avatar")
          .upload(fileName, avatar, { upsert: true });

        if (!uploadError) {
          const { data: urlData } = supabase.storage
            .from("Avatar")
            .getPublicUrl(fileName);
          avatarUrl = urlData.publicUrl;
        }
      }

      // Update profiles table
      const { error: profileError } = await supabase
        .from("profiles")
        .update({
          full_name: editName,
          avatar_url: avatarUrl,
          email: editEmail,
        })
        .eq("id", user.id);

      if (profileError) throw profileError;

      // Update email in auth if changed
      if (editEmail && editEmail !== user.email) {
        const { error: emailError } = await supabase.auth.updateUser({
          email: editEmail,
        });
        if (emailError) throw emailError;
      }

      // Update password only if user typed something
      if (editPassword && editPassword.trim() !== "") {
        if (editPassword !== confirmNewPassword) {
          setProfileMsg({ type: "error", text: "Passwords do not match!" });
          setProfileLoading(false);
          return;
        }
        if (editPassword.length < 6) {
          setProfileMsg({ type: "error", text: "Password must be at least 6 characters!" });
          setProfileLoading(false);
          return;
        }
        const { error: passError } = await supabase.auth.updateUser({
          password: editPassword,
        });
        if (passError) throw passError;
      }

   
    setProfile((prev) => ({
     ...prev,
    full_name: editName,
    email: editEmail,
    avatar_url: avatarUrl,
  }));
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

  // ===== HELPER FUNCTIONS =====

  const formatTime = (timeStr) => {
    if (!timeStr) return "--:--";
    const [hours, minutes] = timeStr.split(":");
    const hour = parseInt(hours);
    return `${hour % 12 || 12}:${minutes} ${hour >= 12 ? "PM" : "AM"}`;
  };

  const calcHours = (clock_in, clock_out) => {
    if (!clock_in || !clock_out) return "--";
    const [inH, inM] = clock_in.split(":").map(Number);
    const [outH, outM] = clock_out.split(":").map(Number);
    const totalMinutes = (outH * 60 + outM) - (inH * 60 + inM);
    return `${Math.floor(totalMinutes / 60)}h ${totalMinutes % 60}m`;
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
    late: monthlyRecords.filter((r) => r.status === "late").length,
    absent: monthlyRecords.filter((r) => r.status === "absent").length,
  };

  // ===== RENDER =====

  return (
    <div className={`app-layout ${darkMode ? "dark" : ""}`}>

      {/* PROFILE MODAL */}
      {showProfile && (
        <div className="modal-overlay" onClick={() => setShowProfile(false)}>
          <div className="modal-box" onClick={(e) => e.stopPropagation()}>

            <div className="modal-header">
              <h2>Profile Settings</h2>
              <button className="modal-close" onClick={() => setShowProfile(false)}>✕</button>
            </div>

            {/* AVATAR */}
            <div className="modal-avatar-section">
              <div className="modal-avatar">
                {avatarPreview
                  ? <img src={avatarPreview} alt="avatar" className="avatar-img-lg" />
                  : <span>{getInitials(profile?.full_name)}</span>
                }
              </div>
              <label className="btn-change-avatar">
                Change Photo
                <input
                  type="file"
                  accept="image/*"
                  onChange={handleAvatarChange}
                  style={{ display: "none" }}
                />
              </label>
            </div>

            {/* FORM */}
            <div className="modal-form">
              <div className="modal-field">
                <label>Full Name</label>
                <input
                  type="text"
                  value={editName}
                  onChange={(e) => setEditName(e.target.value)}
                  placeholder="Enter full name"
                />
              </div>

              <div className="modal-field">
                <label>Email</label>
                <input
                  type="email"
                  value={editEmail}
                  onChange={(e) => setEditEmail(e.target.value)}
                  placeholder="Enter email"
                />
              </div>

              <div className="modal-divider" />
              <p className="modal-section-label">Change Password</p>

              <div className="modal-field">
                <label>New Password</label>
                <input
                  type="password"
                  value={editPassword}
                  onChange={(e) => setEditPassword(e.target.value)}
                  placeholder="Leave blank to keep current"
                />
              </div>

              <div className="modal-field">
                <label>Confirm New Password</label>
                <input
                  type="password"
                  value={confirmNewPassword}
                  onChange={(e) => setConfirmNewPassword(e.target.value)}
                  placeholder="Confirm new password"
                />
              </div>

              {profileMsg.text && (
                <p className={`modal-msg ${profileMsg.type}`}>
                  {profileMsg.type === "success" ? "✓" : "✕"} {profileMsg.text}
                </p>
              )}

              <button
                className="btn-save-profile"
                onClick={handleSaveProfile}
                disabled={profileLoading}
              >
                {profileLoading ? "Saving..." : "Save Changes"}
              </button>
            </div>
          </div>
        </div>
      )}

      {/* SIDEBAR */}
      <aside className="sidebar">
        <div className="sidebar-logo">Attendify</div>
        <p className="sidebar-menu-label">Menu</p>
        <nav className="sidebar-nav">
          <div
            className={`nav-item ${activeNav === "dashboard" ? "active" : ""}`}
            onClick={() => setActiveNav("dashboard")}
          >
            Dashboard
          </div>
          <div
            className={`nav-item ${activeNav === "records" ? "active" : ""}`}
            onClick={() => setActiveNav("records")}
          >
            My Records
          </div>
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

      {/* MAIN */}
      <div className="main-area">

        {/* TOPBAR */}
        <div className="topbar">
          <button className="hamburger" onClick={() => setMenuOpen(!menuOpen)}>
            <span className={`ham-line ${menuOpen ? "open" : ""}`}></span>
            <span className={`ham-line ${menuOpen ? "open" : ""}`}></span>
            <span className={`ham-line ${menuOpen ? "open" : ""}`}></span>
          </button>
          <h1>{activeNav === "dashboard" ? "Attendance Dashboard" : "My Records"}</h1>
          <div className="topbar-actions">
            <button className="dark-mode-toggle" onClick={() => setDarkMode(!darkMode)}>
              <div className={`toggle-track ${darkMode ? "on" : ""}`}>
                <div className="toggle-thumb" />
              </div>
              {darkMode ? "Light Mode" : "Dark Mode"}
            </button>
            <button onClick={handleLogout} className="btn-logout">Logout</button>
          </div>
        </div>

        {/* MOBILE DROPDOWN */}
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
          <div
            className={`nav-item ${activeNav === "dashboard" ? "active" : ""}`}
            onClick={() => { setActiveNav("dashboard"); setMenuOpen(false); }}
          >
            Dashboard
          </div>
          <div
            className={`nav-item ${activeNav === "records" ? "active" : ""}`}
            onClick={() => { setActiveNav("records"); setMenuOpen(false); }}
          >
            My Records
          </div>
          <div
            className="nav-item"
            onClick={() => { setShowProfile(true); setMenuOpen(false); }}
          >
            ⚙ Profile Settings
          </div>
          <div className="mobile-dropdown-divider" />
          <div className="nav-item nav-logout" onClick={() => { handleLogout(); setMenuOpen(false); }}>
            Logout
          </div>
        </div>

        {/* CONTENT */}
        <div className="dashboard-content">

          {/* DASHBOARD VIEW */}
          {activeNav === "dashboard" && (
            <>
              <div className="top-row">
                <div className="welcome-card">
                  <h2>Welcome {profile?.full_name || "User"}</h2>
                  <div className="live-clock">
                    {currentTime.toLocaleTimeString("en-US", {
                      hour: "2-digit",
                      minute: "2-digit",
                      second: "2-digit",
                      hour12: false,
                    })}
                  </div>
                  <div className="live-date">
                    {currentTime.toLocaleDateString("en-US", {
                      weekday: "long",
                      month: "long",
                      day: "numeric",
                    })}
                  </div>

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
                    {todayRecord
                      ? getStatusBadge(todayRecord.status)
                      : <span className="no-status">Not clocked in</span>
                    }
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
                    <span className="summary-label">Month</span>
                    <span className="summary-value">{summary.present + summary.late}/{totalDays || 0}</span>
                  </div>
                </div>
              </div>

              <div className="stat-cards">
                <div className="stat-card">
                  <span className="stat-number present">{summary.present}</span>
                  <span className="stat-label">Days of Present</span>
                </div>
                <div className="stat-card">
                  <div className="stat-dot absent" />
                  <span className="stat-number absent">{summary.absent}</span>
                  <span className="stat-label">Days of Absent</span>
                </div>
                <div className="stat-card">
                  <div className="stat-dot late" />
                  <span className="stat-number late">{summary.late}</span>
                  <span className="stat-label">Days of Late</span>
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
                        <th>Date</th>
                        <th>Time In</th>
                        <th>Time Out</th>
                        <th>Hours</th>
                        <th>Status</th>
                      </tr>
                    </thead>
                    <tbody>
                      {history.map((r) => (
                        <tr key={r.id}>
                          <td>{new Date(r.date).toLocaleDateString("en-US", { month: "long", day: "numeric", year: "numeric" })}</td>
                          <td>{formatTime(r.clock_in)}</td>
                          <td>{formatTime(r.clock_out)}</td>
                          <td>{calcHours(r.clock_in, r.clock_out)}</td>
                          <td>{getStatusBadge(r.status)}</td>
                        </tr>
                      ))}
                    </tbody>
                  </table>
                )}
              </div>
            </>
          )}

          {/* MY RECORDS VIEW */}
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
                        <th>Date</th>
                        <th>Time In</th>
                        <th>Time Out</th>
                        <th>Hours</th>
                        <th>Status</th>
                      </tr>
                    </thead>
                    <tbody>
                      {monthlyRecords.map((r) => (
                        <tr key={r.id}>
                          <td>{new Date(r.date).toLocaleDateString("en-US", { weekday: "short", month: "long", day: "numeric" })}</td>
                          <td>{formatTime(r.clock_in)}</td>
                          <td>{formatTime(r.clock_out)}</td>
                          <td>{calcHours(r.clock_in, r.clock_out)}</td>
                          <td>{getStatusBadge(r.status)}</td>
                        </tr>
                      ))}
                    </tbody>
                  </table>
                )}
              </div>
            </>
          )}
        </div>
      </div>
    </div>
  );
};

export default Dashboard;