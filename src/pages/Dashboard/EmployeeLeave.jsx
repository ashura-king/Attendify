import { useState, useEffect, useCallback } from "react";
import { supabase } from "../../lib/supabaseClient";
import { useAuth } from "../../context/AuthContext";
import "./EmployeeLeave.css";

const LEAVE_TYPES = [
  "Sick Leave",
  "Vacation Leave",
  "Emergency Leave",
  "Maternity/Paternity Leave",
];

const EmployeeLeaveSection = () => {
  const { user } = useAuth();

  const [myLeaves, setMyLeaves] = useState([]);
  const [showForm, setShowForm] = useState(false);
  const [submitting, setSubmitting] = useState(false);

  const [form, setForm] = useState({
    type: "",
    start_date: "",
    end_date: "",
    reason: "",
  });

  const [formError, setFormError] = useState("");

  const fetchMyLeaves = useCallback(async () => {
    if (!user) return;

    const { data, error } = await supabase
      .from("leave_requests")
      .select("*")
      .eq("user_id", user.id)
      .order("created_at", { ascending: false });

    if (!error) {
      setMyLeaves(data || []);
    }
  }, [user]);

  useEffect(() => {
    fetchMyLeaves();
  }, [fetchMyLeaves]);

  const handleSubmit = async (e) => {
    e.preventDefault();
    setFormError("");

    if (!form.type) {
      setFormError("Please select a leave type.");
      return;
    }

    if (!form.start_date || !form.end_date) {
      setFormError("Please select start and end dates.");
      return;
    }

    if (new Date(form.end_date) < new Date(form.start_date)) {
      setFormError("End date cannot be before start date.");
      return;
    }

    const overlap = myLeaves.find(
      (l) =>
        l.status !== "rejected" &&
        new Date(l.end_date) >= new Date(form.start_date) &&
        new Date(l.start_date) <= new Date(form.end_date)
    );

    if (overlap) {
      setFormError(
        "You already have a leave request overlapping these dates."
      );
      return;
    }

    setSubmitting(true);

    const { error } = await supabase
      .from("leave_requests")
      .insert([
        {
          user_id: user.id,
          type: form.type,
          start_date: form.start_date,
          end_date: form.end_date,
          reason: form.reason,
          status: "pending",
        },
      ]);

    setSubmitting(false);

    if (error) {
      setFormError(error.message);
      return;
    }

    setForm({
      type: "",
      start_date: "",
      end_date: "",
      reason: "",
    });

    setShowForm(false);

    await fetchMyLeaves();
  };

  const formatDate = (d) =>
    new Date(d).toLocaleDateString("en-US", {
      month: "short",
      day: "numeric",
      year: "numeric",
    });

  const getLeaveBadge = (status) => {
    const map = {
      pending: "leave-badge-pending",
      approved: "leave-badge-approved",
      rejected: "leave-badge-rejected",
    };

    return (
      <span className={`leave-badge ${map[status]}`}>
        {status.charAt(0).toUpperCase() + status.slice(1)}
      </span>
    );
  };

  const getDayCount = (start, end) => {
    const diff = new Date(end) - new Date(start);

    return Math.floor(diff / (1000 * 60 * 60 * 24)) + 1;
  };

  return (
    <div className="leave-section">
      <div className="leave-header">
        <h2>My Leave Requests</h2>

        <button
          className="leave-file-btn"
          onClick={() => setShowForm(!showForm)}
        >
          {showForm ? "✕ Cancel" : "+ File Leave"}
        </button>
      </div>

      {showForm && (
        <div className="leave-form-card">
          <h3>New Leave Request</h3>

          <form onSubmit={handleSubmit} className="leave-form">
            <div className="leave-form-row">
              <div className="leave-form-group">
                <label>Leave Type</label>

                <select
                  value={form.type}
                  onChange={(e) =>
                    setForm({ ...form, type: e.target.value })
                  }
                  required
                >
                  <option value="">Select type...</option>

                  {LEAVE_TYPES.map((t) => (
                    <option key={t} value={t}>
                      {t}
                    </option>
                  ))}
                </select>
              </div>
            </div>

            <div className="leave-form-row leave-form-row--2col">
              <div className="leave-form-group">
                <label>Start Date</label>

                <input
                  type="date"
                  value={form.start_date}
                  min={new Date().toISOString().split("T")[0]}
                  onChange={(e) =>
                    setForm({ ...form, start_date: e.target.value })
                  }
                  required
                />
              </div>

              <div className="leave-form-group">
                <label>End Date</label>

                <input
                  type="date"
                  value={form.end_date}
                  min={
                    form.start_date ||
                    new Date().toISOString().split("T")[0]
                  }
                  onChange={(e) =>
                    setForm({ ...form, end_date: e.target.value })
                  }
                  required
                />
              </div>
            </div>

            {form.start_date &&
              form.end_date &&
              new Date(form.end_date) >=
                new Date(form.start_date) && (
                <p className="leave-day-count">
                  📅{" "}
                  {getDayCount(
                    form.start_date,
                    form.end_date
                  )}{" "}
                  day(s) requested
                </p>
              )}

            <div className="leave-form-group">
              <label>
                Reason{" "}
                <span
                  style={{
                    color: "#888",
                    fontWeight: 400,
                  }}
                >
                  (optional)
                </span>
              </label>

              <textarea
                rows={3}
                placeholder="Briefly describe your reason..."
                value={form.reason}
                onChange={(e) =>
                  setForm({ ...form, reason: e.target.value })
                }
              />
            </div>

            {formError && (
              <p className="leave-form-error">
                ⚠ {formError}
              </p>
            )}

            <button
              type="submit"
              className="leave-submit-btn"
              disabled={submitting}
            >
              {submitting
                ? "Submitting..."
                : "Submit Request"}
            </button>
          </form>
        </div>
      )}

      {myLeaves.length === 0 ? (
        <div className="leave-empty">
          You haven't filed any leave requests yet.
        </div>
      ) : (
        <div className="leave-list">
          {myLeaves.map((l) => (
            <div
              key={l.id}
              className={`leave-card leave-card--${l.status}`}
            >
              <div className="leave-card-top">
                <div>
                  <span className="leave-type">
                    {l.type}
                  </span>

                  {getLeaveBadge(l.status)}
                </div>

                <span className="leave-dates">
                  {formatDate(l.start_date)} →{" "}
                  {formatDate(l.end_date)}

                  <span className="leave-days">
                    {" "}
                    (
                    {getDayCount(
                      l.start_date,
                      l.end_date
                    )}
                    d)
                  </span>
                </span>
              </div>

              {l.reason && (
                <p className="leave-reason">
                  "{l.reason}"
                </p>
              )}

              {l.admin_note && (
                <p className="leave-admin-note">
                  💬 Admin: {l.admin_note}
                </p>
              )}

              <p className="leave-filed">
                Filed {formatDate(l.created_at)}
              </p>
            </div>
          ))}
        </div>
      )}
    </div>
  );
};

export default EmployeeLeaveSection;