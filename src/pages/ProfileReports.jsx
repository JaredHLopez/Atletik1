import React, { useEffect, useState, useRef } from "react";
import supabase from "../helper/supabaseClient";

const TIME_FILTERS = [
  { label: "All Time", value: "all" },
  { label: "Today", value: "day" },
  { label: "This Week", value: "week" },
  { label: "This Month", value: "month" },
];

const REPORT_TYPES = [
  { label: "User", value: "user" },
  { label: "Club", value: "club" },
  { label: "Organizer", value: "organizer" },
  { label: "Team", value: "team" },
];

const SORT_OPTIONS = [
  { label: "Sort by Report Count", value: "count" },
  { label: "Sort by Most Recent", value: "recent" },
];

const TABLE_MAP = {
  user: { table: "user_reports", id: "reported_id", join: "users:reported_id(id, name, email, suspended_until)" },
  club: { table: "club_reports", id: "reported_id", join: "clubs:reported_id(id, name, email, suspended_until)" },
  organizer: { table: "organizer_reports", id: "reported_id", join: "organizers:reported_id(id, name, email, suspended_until)" },
  team: { table: "team_reports", id: "reported_id", join: "teams:reported_id(id, name, email, suspended_until)" },
};

export default function ProfileReports() {
  const [reports, setReports] = useState([]);
  const [sortBy, setSortBy] = useState("count");
  const [timeFilter, setTimeFilter] = useState("all");
  const [reportType, setReportType] = useState("user");
  const [loading, setLoading] = useState(false);
  const [suspendModal, setSuspendModal] = useState({ open: false, userId: null, until: "" });

  // Dropdown states
  const [typeDropdownOpen, setTypeDropdownOpen] = useState(false);
  const [sortDropdownOpen, setSortDropdownOpen] = useState(false);
  const [timeDropdownOpen, setTimeDropdownOpen] = useState(false);

  // Dropdown refs for outside click
  const typeDropdownRef = useRef(null);
  const sortDropdownRef = useRef(null);
  const timeDropdownRef = useRef(null);

  useEffect(() => {
    fetchReports();
    // eslint-disable-next-line
  }, [sortBy, timeFilter, reportType]);

  // Handle outside click for all dropdowns
  useEffect(() => {
    function handleClickOutside(event) {
      if (
        typeDropdownRef.current && !typeDropdownRef.current.contains(event.target)
      ) setTypeDropdownOpen(false);
      if (
        sortDropdownRef.current && !sortDropdownRef.current.contains(event.target)
      ) setSortDropdownOpen(false);
      if (
        timeDropdownRef.current && !timeDropdownRef.current.contains(event.target)
      ) setTimeDropdownOpen(false);
    }
    if (typeDropdownOpen || sortDropdownOpen || timeDropdownOpen) {
      document.addEventListener("mousedown", handleClickOutside);
    }
    return () => {
      document.removeEventListener("mousedown", handleClickOutside);
    };
  }, [typeDropdownOpen, sortDropdownOpen, timeDropdownOpen]);

  async function fetchReports() {
    setLoading(true);

    const { table, id, join } = TABLE_MAP[reportType];

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

    // Fetch all reports with reported entity info
    let query = supabase
      .from(table)
      .select(`report_id, ${id}, reason, approval_status, created_at, ${join}`);

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
      const uid = r[id];
      if (!grouped[uid]) {
        grouped[uid] = {
          entity: r[Object.keys(r).find(k => typeof r[k] === "object" && r[k]?.id === uid)],
          reports: [],
        };
      }
      grouped[uid].reports.push(r);
    });

    let groupedArr = Object.values(grouped).map((g) => ({
      ...g.entity,
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

  // Waive: mark all reports for this entity as "waived"
  async function handleWaive(entityId) {
    const { table, id } = TABLE_MAP[reportType];
    await supabase
      .from(table)
      .update({ approval_status: "waived" })
      .eq(id, entityId)
      .eq("approval_status", "pending");
    fetchReports();
  }

  // Penalize: set suspended_until
  async function handlePenalize(entityId, untilDate) {
    const { join } = TABLE_MAP[reportType];
    // Extract table name from join string (e.g., "users:reported_id(...)")
    const entityTable = join.split(":")[0];
    await supabase
      .from(entityTable)
      .update({ suspended_until: untilDate })
      .eq("id", entityId);
    setSuspendModal({ open: false, userId: null, until: "" });
    fetchReports();
  }

  // Dropdown button component for reuse
  function DropdownButton({ label, options, selected, open, setOpen, onSelect, dropdownRef }) {
    return (
      <div style={{ position: "relative" }} ref={dropdownRef}>
        <button
          className="sidebar-btn"
          style={{
            backgroundColor: "var(--primary-color)",
            color: "#fff",
            minWidth: 160,
            marginBottom: 0,
            display: "flex",
            alignItems: "center",
            justifyContent: "space-between",
          }}
          onClick={() => setOpen((prev) => !prev)}
          type="button"
        >
          {options.find(opt => opt.value === selected)?.label || label}
          <span style={{ marginLeft: 8, fontSize: 12 }}>▼</span>
        </button>
        {open && (
          <div
            style={{
              position: "absolute",
              top: "110%",
              left: 0,
              background: "#fff",
              boxShadow: "0 2px 8px rgba(0,0,0,0.12)",
              borderRadius: 6,
              zIndex: 10,
              minWidth: 160,
              padding: "4px 0"
            }}
          >
            {options.map((opt) => (
              <button
                key={opt.value}
                className="sidebar-btn"
                style={{
                  backgroundColor: selected === opt.value ? "var(--primary-color)" : "transparent",
                  color: selected === opt.value ? "#fff" : "var(--primary-color)",
                  borderRadius: 0,
                  width: "100%",
                  textAlign: "left",
                  marginBottom: 0,
                  padding: "10px 16px"
                }}
                onClick={() => {
                  onSelect(opt.value);
                  setOpen(false);
                }}
                type="button"
              >
                {opt.label}
              </button>
            ))}
          </div>
        )}
      </div>
    );
  }

  return (
    <div style={{ minHeight: "500px" }}>
      <h2>Profile Reports</h2>
      <div style={{ display: "flex", gap: 16, marginBottom: 16, alignItems: "center" }}>
        <DropdownButton
          label="Report Type"
          options={REPORT_TYPES}
          selected={reportType}
          open={typeDropdownOpen}
          setOpen={setTypeDropdownOpen}
          onSelect={setReportType}
          dropdownRef={typeDropdownRef}
        />
        <DropdownButton
          label="Sort"
          options={SORT_OPTIONS}
          selected={sortBy}
          open={sortDropdownOpen}
          setOpen={setSortDropdownOpen}
          onSelect={setSortBy}
          dropdownRef={sortDropdownRef}
        />
        <DropdownButton
          label="Time"
          options={TIME_FILTERS}
          selected={timeFilter}
          open={timeDropdownOpen}
          setOpen={setTimeDropdownOpen}
          onSelect={setTimeFilter}
          dropdownRef={timeDropdownRef}
        />
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