import React, { useEffect, useState } from "react";
import supabase from "../helper/supabaseClient";

const TIME_FILTERS = [
  { label: "All Time", value: "all" },
  { label: "Today", value: "day" },
  { label: "This Week", value: "week" },
  { label: "This Month", value: "month" },
];

export default function ProfileReports() {
  const [reports, setReports] = useState([]);
  const [sortBy, setSortBy] = useState("count");
  const [timeFilter, setTimeFilter] = useState("all");
  const [loading, setLoading] = useState(false);
  const [suspendModal, setSuspendModal] = useState({ open: false, userId: null, until: "" });

  useEffect(() => {
    fetchReports();
    // eslint-disable-next-line
  }, [sortBy, timeFilter]);

  async function fetchReports() {
    setLoading(true);

    // Build time filter
    let fromDate = null;
    if (timeFilter === "day") {
      fromDate = new Date();
      fromDate.setHours(0, 0, 0, 0);
    } else if (timeFilter === "week") {
      fromDate = new Date();
      fromDate.setDate(fromDate.getDate() - 7);
    } else if (timeFilter === "month") {
      fromDate = new Date();
      fromDate.setMonth(fromDate.getMonth() - 1);
    }

    // Fetch all user reports with reported user info
    let query = supabase
      .from("user_reports")
      .select("report_id, reported_id, reason, approval_status, created_at, users:reported_id(id, name, email, suspended_until)");

    if (fromDate) {
      query = query.gte("created_at", fromDate.toISOString());
    }

    const { data, error } = await query;
    if (error) {
      setReports([]);
      setLoading(false);
      return;
    }

    // Group by reported_id and count reports
    const grouped = {};
    data.forEach((r) => {
      const uid = r.reported_id;
      if (!grouped[uid]) {
        grouped[uid] = {
          user: r.users,
          reports: [],
        };
      }
      grouped[uid].reports.push(r);
    });

    let groupedArr = Object.values(grouped).map((g) => ({
      ...g.user,
      reportCount: g.reports.length,
      reasons: g.reports.map((r) => r.reason),
      lastReported: g.reports[g.reports.length - 1]?.created_at,
    }));

    // Sort
    if (sortBy === "count") {
      groupedArr.sort((a, b) => b.reportCount - a.reportCount);
    } else if (sortBy === "recent") {
      groupedArr.sort((a, b) => new Date(b.lastReported) - new Date(a.lastReported));
    }

    setReports(groupedArr);
    setLoading(false);
  }

  // Waive: mark all reports for this user as "waived"
  async function handleWaive(userId) {
    await supabase
      .from("user_reports")
      .update({ approval_status: "waived" })
      .eq("reported_id", userId)
      .eq("approval_status", "pending");
    fetchReports();
  }

  // Penalize: set suspended_until
  async function handlePenalize(userId, untilDate) {
    await supabase
      .from("users")
      .update({ suspended_until: untilDate })
      .eq("id", userId);
    setSuspendModal({ open: false, userId: null, until: "" });
    fetchReports();
  }

  return (
    <div>
      <h2>Profile Reports</h2>
      <div style={{ display: "flex", gap: 16, marginBottom: 16 }}>
        <select value={sortBy} onChange={e => setSortBy(e.target.value)}>
          <option value="count">Sort by Report Count</option>
          <option value="recent">Sort by Most Recent</option>
        </select>
        <select value={timeFilter} onChange={e => setTimeFilter(e.target.value)}>
          {TIME_FILTERS.map(f => (
            <option key={f.value} value={f.value}>{f.label}</option>
          ))}
        </select>
      </div>
      {loading ? (
        <p>Loading...</p>
      ) : (
        <table className="request-table">
          <thead>
            <tr>
              <th>Name</th>
              <th>Email</th>
              <th>Report Count</th>
              <th>Reasons</th>
              <th>Suspended Until</th>
              <th>Action</th>
            </tr>
          </thead>
          <tbody>
            {reports.map((u) => (
              <tr key={u.id}>
                <td>{u.name}</td>
                <td>{u.email}</td>
                <td>{u.reportCount}</td>
                <td>
                  <ul>
                    {u.reasons.map((reason, idx) => (
                      <li key={idx}>{reason}</li>
                    ))}
                  </ul>
                </td>
                <td>{u.suspended_until ? new Date(u.suspended_until).toLocaleString() : "Active"}</td>
                <td>
                  <button className="accept-btn" onClick={() => setSuspendModal({ open: true, userId: u.id, until: "" })}>
                    Penalize
                  </button>
                  <button className="decline-btn" onClick={() => handleWaive(u.id)}>
                    Waive
                  </button>
                </td>
              </tr>
            ))}
          </tbody>
        </table>
      )}

      {/* Penalize Modal */}
      {suspendModal.open && (
        <div style={{
          position: "fixed", top: 0, left: 0, width: "100vw", height: "100vh",
          background: "rgba(0,0,0,0.3)", display: "flex", alignItems: "center", justifyContent: "center"
        }}>
          <div style={{ background: "#fff", padding: 24, borderRadius: 8, minWidth: 320 }}>
            <h3>Set Suspension Date</h3>
            <input
              type="datetime-local"
              value={suspendModal.until}
              onChange={e => setSuspendModal(s => ({ ...s, until: e.target.value }))}
              style={{ marginBottom: 16, width: "100%" }}
            />
            <div style={{ display: "flex", gap: 8 }}>
              <button
                className="accept-btn"
                onClick={() => handlePenalize(suspendModal.userId, suspendModal.until)}
                disabled={!suspendModal.until}
              >
                Suspend
              </button>
              <button className="decline-btn" onClick={() => setSuspendModal({ open: false, userId: null, until: "" })}>
                Cancel
              </button>
            </div>
          </div>
        </div>
      )}
    </div>
  );
}