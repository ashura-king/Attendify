import { useEffect, useState } from "react";
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
  useEffect(() => {
    const timer = setInterval(() => setcurrentTime(new Date()), 1000);
    return () => clearInterval(timer);
  }, []);

  useEffect(() => {
    if (user) {
      fetchProfile();
      fetchTodayRecord();
      fetchHistory();
    }
  }, [user]);

  const fetchProfile = async () => {
    const { data } = await supabase
      .from("profiles")
      .select("full_name, role")
      .eq("id", user.id)
      .single();
    setProfile(data);
  };

  const fetchTodayRecord = async () => {
    const today = new Date().toISOString().split("T")[0];
    const { data } = await supabase
      .from("attendance")
      .select("*")
      .eq("user_id", user.id)
      .eq("date", today)
      .single();
    setTodayRecord(data || null);  
  };

  const fetchHistory = async () => {
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
  };

  const handleClockIn = async () => {
    setLoading(true);
    const now = new Date();
    const timeStr = now.toTimeString().split(" ")[0];  // ✅ fixed: was .splot
    const today = now.toISOString().split("T")[0];
    const status = now.getHours() >= 9 ? "late" : "present";

    const { error } = await supabase.from("attendance").insert({
      user_id: user.id,
      date: today,
      clock_in: timeStr,
      status,
    });

    if (!error) { await fetchTodayRecord(); await fetchHistory(); }
    setLoading(false);
  };

  const handleClockOut = async () => {
    setLoading(true);
    const timeStr = new Date().toTimeString().split(" ")[0];

    const { error } = await supabase
      .from("attendance")
      .update({ clock_out: timeStr })
      .eq("id", todayRecord.id);   

    if (!error) { await fetchTodayRecord(); await fetchHistory(); }
    setLoading(false);
  };

  const handleLogout = async () => {
    await supabase.auth.signOut();
    navigate("/login");
  };

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
    return <span className={`badge-${status}`}>{status.charAt(0).toUpperCase() + status.slice(1)}</span>;
  };

  const totalDays = summary.present + summary.late + summary.absent;

  return (
    <div className="app-layout">
      <aside className="sidebar">
        <div className="sidebar-logo">Attendify</div>
        <p className="sidebar-menu-label">Menu</p>
        <nav className="sidebar-nav">
          <div className={`nav-item ${activeNav === "dashboard" ? "active" : ""}`} onClick={() => setActiveNav("dashboard")}>
            Dashboard
          </div>
          <div className={`nav-item ${activeNav === "records" ? "active" : ""}`} onClick={() => setActiveNav("records")}>
            My Records
          </div>
        </nav>
        <div className="sidebar-user">
          <div className="user-avatar">{getInitials(profile?.full_name)}</div>
          <div className="user-info">
            <p>{profile?.full_name || "User"}</p>
            <span>{profile?.role || "Employee"}</span>
          </div>
        </div>
      </aside>

      <div className="main-area">
        <div className="topbar">
          <h1>Attendance Dashboard</h1>
          <div className="topbar-actions">
            <div className="dark-mode-toggle">
              <div className="toggle-dot" />
              Dark Mode
            </div>
            <button onClick={handleLogout} className="btn-logout">Logout</button>
          </div>
        </div>

        <div className="dashboard-content">
          <div className="top-row">
            <div className="welcome-card">
              <h2>Welcome {profile?.full_name || "User"}</h2>
              <div className="live-clock">
                {currentTime.toLocaleTimeString("en-US", { hour: "2-digit", minute: "2-digit", second: "2-digit", hour12: false })}
              </div>
              <div className="live-date">
                {currentTime.toLocaleDateString("en-US", { weekday: "long", month: "long", day: "numeric" })}
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
        </div>
      </div>
    </div>
  );
};

export default Dashboard;