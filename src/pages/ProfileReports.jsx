import React, { useEffect, useState, useRef, useCallback } from "react";
import supabase from "../helper/supabaseClient";
import UserReportTable from "./UserReportTable";
import ClubReportTable from "./ClubReportTable";
import OrganizerReportTable from "./OrganizerReportTable";
import TeamReportTable from "./TeamReportTable";

// Constants
const TIME_FILTERS = [
  { label: "Today", value: "day" },
  { label: "This Week", value: "week" },
  { label: "This Month", value: "month" },
  { label: "All Time", value: "all" },
];

const REPORT_TYPES = [
  { label: "User", value: "user" },
  { label: "Club", value: "club" },
  { label: "Organizer", value: "organizer" },
  { label: "Team", value: "team" },
];

const SORT_OPTIONS = [
  { label: "Most Recent", value: "recent" },
  { label: "Report Count", value: "count" },
];

const STATUS_OPTIONS = [
  { label: "Pending", value: "pending" },
  { label: "Penalized", value: "penalized" },
  { label: "Rejected", value: "rejected" },
];

const TABLE_MAP = {
  user: {
    table: "user_reports",
    id: "reported_id",
    join: "users:reported_id(user_id, username, intro, bio, profile_image, background_image, suspended_until)",
    entityTable: "users",
    pk: "user_id"
  },
  club: {
    table: "club_reports",
    id: "reported_id",
    join: "clubs:reported_id(club_id, club_name, sports, street_address, barangay, city, province, profile_image, background_image, suspended_until)",
    entityTable: "clubs",
    pk: "club_id"
  },
  organizer: {
    table: "organizer_reports",
    id: "reported_id",
    join: "organizers:reported_id(user_id, username, suffix, intro, bio, profile_image, background_image, suspended_until)",
    entityTable: "organizers",
    pk: "user_id"
  },
  team: {
    table: "team_reports",
    id: "reported_id",
    join: "teams:reported_id(team_id, team_name, sports, street_address, barangay, city, province, intro, bio, profile_image, background_image, suspended_until)",
    entityTable: "teams",
    pk: "team_id"
  }
};

const getTimeFilter = (timeFilter) => {
  const now = new Date();
  switch (timeFilter) {
    case "day":
      const startOfDay = new Date(now);
      startOfDay.setHours(0, 0, 0, 0);
      return startOfDay;
    case "week":
      const weekAgo = new Date(now);
      weekAgo.setDate(weekAgo.getDate() - 7);
      return weekAgo;
    case "month":
      const monthAgo = new Date(now);
      monthAgo.setMonth(monthAgo.getMonth() - 1);
      return monthAgo;
    default:
      return null;
  }
};

const extractEntityFromReport = (report, reportType) => {
  const entityTable = TABLE_MAP[reportType].entityTable;
  const entity = report[entityTable];
  if (entity && typeof entity === "object") {
    return { ...entity };
  }
  return null;
};

const sortReports = (reports, sortBy) => {
  return [...reports].sort((a, b) => {
    if (sortBy === "count") {
      return b.reportCount - a.reportCount;
    } else if (sortBy === "recent") {
      return new Date(b.lastReported) - new Date(a.lastReported);
    }
    return 0;
  });
};

function DropdownButton({
  label,
  options,
  selected,
  open,
  setOpen,
  onSelect,
  dropdownRef
}) {
  const selectedOption = options.find(opt => opt.value === selected);

  return (
    <div style={{ position: "relative" }} ref={dropdownRef}>
      <button
        className="sidebar-btn"
        style={{
          backgroundColor: "var(--primary-color)",
          color: "#fff",
          minWidth: 120,
          marginBottom: 0,
          display: "flex",
          alignItems: "center",
          justifyContent: "space-between",
        }}
        onClick={() => setOpen(prev => !prev)}
        type="button"
        aria-expanded={open}
        aria-haspopup="true"
      >
        {selectedOption?.label || label}
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
            minWidth: 120,
            padding: "4px 0",
            display: "flex",
            flexDirection: "column"
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

export default function ProfileReports() {
  // State
  const [reports, setReports] = useState([]);
  const [sortBy, setSortBy] = useState("recent");
  const [timeFilter, setTimeFilter] = useState("day");
  const [reportType, setReportType] = useState("user");
  const [statusFilter, setStatusFilter] = useState("pending");
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState(null);
  const [suspendModal, setSuspendModal] = useState({
    open: false,
    userId: null,
    until: ""
  });

  // Dropdown states
  const [typeDropdownOpen, setTypeDropdownOpen] = useState(false);
  const [sortDropdownOpen, setSortDropdownOpen] = useState(false);
  const [timeDropdownOpen, setTimeDropdownOpen] = useState(false);
  const [statusDropdownOpen, setStatusDropdownOpen] = useState(false);

  // Refs
  const typeDropdownRef = useRef(null);
  const sortDropdownRef = useRef(null);
  const timeDropdownRef = useRef(null);
  const statusDropdownRef = useRef(null);

  // Fetch reports function
  const fetchReports = useCallback(async () => {
    try {
      setLoading(true);
      setError(null);

      const { table, id, join } = TABLE_MAP[reportType];
      const fromDate = getTimeFilter(timeFilter);

      let query = supabase
        .from(table)
        .select(`report_id, ${id}, reason, approval_status, created_at, ${join}`)
        .eq("approval_status", statusFilter);

      if (fromDate) {
        query = query.gte("created_at", fromDate.toISOString());
      }

      const { data, error: queryError } = await query;

      if (queryError) {
        throw queryError;
      }

      if (!data || data.length === 0) {
        setReports([]);
        return;
      }

      // Group reports by entity
      const grouped = {};
      data.forEach((report) => {
        const entityId = report[id];
        if (!grouped[entityId]) {
          const entity = extractEntityFromReport(report, reportType);
          grouped[entityId] = {
            entity: entity || { [TABLE_MAP[reportType].pk]: entityId },
            reports: []
          };
        }
        grouped[entityId].reports.push(report);
      });

      // Transform grouped data
      let groupedArray = Object.values(grouped).map((group) => {
        const reasons = group.reports.flatMap((report) =>
          Array.isArray(report.reason) ? report.reason : [report.reason]
        ).filter(Boolean);

        const reportIds = group.reports.map(report => report.report_id);

        return {
          ...group.entity,
          reportIds: reportIds,
          reportCount: group.reports.length,
          reasons: [...new Set(reasons)],
          lastReported: group.reports.reduce((latest, report) => {
            return new Date(report.created_at) > new Date(latest)
              ? report.created_at
              : latest;
          }, group.reports[0]?.created_at),
          approval_status: group.reports[0]?.approval_status
        };
      });

      groupedArray = sortReports(groupedArray, sortBy);
      setReports(groupedArray);

    } catch (err) {
      console.error("Error fetching reports:", err);
      setError(err.message || "Failed to fetch reports");
      setReports([]);
    } finally {
      setLoading(false);
    }
  }, [sortBy, timeFilter, reportType, statusFilter]);

  // Handle waive action
  const handleWaive = useCallback(async (entityId) => {
    try {
      const reportObj = reports.find(r => r[TABLE_MAP[reportType].pk] === entityId);
      if (!reportObj || !reportObj.reportIds || reportObj.reportIds.length === 0) {
        setError("No reports found for this entity");
        return;
      }
      const { table } = TABLE_MAP[reportType];
      const { error } = await supabase
        .from(table)
        .update({ approval_status: "rejected" })
        .in("report_id", reportObj.reportIds);
      if (error) throw error;
      setError(null);
      await fetchReports();
    } catch (err) {
      console.error("Error rejecting report:", err);
      setError("Failed to reject report");
    }
  }, [reportType, fetchReports, reports]);

  // Handle penalize action
  const handlePenalize = useCallback(async (entityId, untilDate) => {
    try {
      if (!untilDate) {
        setError("Please select a suspension date");
        return;
      }
      const { entityTable, pk, table } = TABLE_MAP[reportType];

      // 1. Suspend the entity
      const { error: suspendError } = await supabase
        .from(entityTable)
        .update({ suspended_until: untilDate })
        .eq(pk, entityId);

      if (suspendError) throw suspendError;

      // 2. Update all related reports to "penalized"
      const reportObj = reports.find(r => r[pk] === entityId);
      if (reportObj && reportObj.reportIds && reportObj.reportIds.length > 0) {
        const { error: reportError } = await supabase
          .from(table)
          .update({ approval_status: "penalized" })
          .in("report_id", reportObj.reportIds)
          .eq("approval_status", "pending");
        if (reportError) throw reportError;
      }

      setError(null);
      setSuspendModal({ open: false, userId: null, until: "" });
      await fetchReports();
    } catch (err) {
      console.error("Error penalizing entity:", err);
      setError("Failed to suspend entity");
    }
  }, [reportType, fetchReports, reports]);

  // Handle restore action
  const handleRestore = useCallback(async (entityId) => {
    try {
      const reportObj = reports.find(r => r[TABLE_MAP[reportType].pk] === entityId);
      if (!reportObj || !reportObj.reportIds || reportObj.reportIds.length === 0) {
        setError("No reports found for this entity");
        return;
      }
      const { table, entityTable, pk } = TABLE_MAP[reportType];

      // 1. Restore report status to pending
      const { error: reportError } = await supabase
        .from(table)
        .update({ approval_status: "pending" })
        .in("report_id", reportObj.reportIds)
        .in("approval_status", ["rejected", "penalized"]);
      if (reportError) throw reportError;

      // 2. Remove suspension from entity
      const { error: entityError } = await supabase
        .from(entityTable)
        .update({ suspended_until: null })
        .eq(pk, entityId);
      if (entityError) throw entityError;

      setError(null);
      await fetchReports();
    } catch (err) {
      console.error("Error restoring report:", err);
      setError("Failed to restore report");
    }
  }, [reportType, fetchReports, reports]);

  // Reset filters
  const handleResetFilters = () => {
    setReportType("user");
    setSortBy("recent");
    setTimeFilter("day");
    setStatusFilter("pending");
  };

  // Effects
  useEffect(() => {
    fetchReports();
  }, [fetchReports]);

  // Handle outside click for dropdowns
  useEffect(() => {
    function handleClickOutside(event) {
      if (typeDropdownRef.current && !typeDropdownRef.current.contains(event.target)) {
        setTypeDropdownOpen(false);
      }
      if (sortDropdownRef.current && !sortDropdownRef.current.contains(event.target)) {
        setSortDropdownOpen(false);
      }
      if (timeDropdownRef.current && !timeDropdownRef.current.contains(event.target)) {
        setTimeDropdownOpen(false);
      }
      if (statusDropdownRef.current && !statusDropdownRef.current.contains(event.target)) {
        setStatusDropdownOpen(false);
      }
    }
    const hasOpenDropdown = typeDropdownOpen || sortDropdownOpen || timeDropdownOpen || statusDropdownOpen;
    if (hasOpenDropdown) {
      document.addEventListener("mousedown", handleClickOutside);
      return () => document.removeEventListener("mousedown", handleClickOutside);
    }
  }, [typeDropdownOpen, sortDropdownOpen, timeDropdownOpen, statusDropdownOpen]);

  // Render correct table based on reportType
  function renderReportTable() {
    const sharedButtonStyle = {
      minWidth: 90,
      padding: "8px 0",
      fontSize: "14px"
    };
    switch (reportType) {
      case "user":
        return (
          <div style={{ overflowX: "auto" }}>
            <UserReportTable
              reports={reports}
              onPenalize={id => setSuspendModal({ open: true, userId: id, until: "" })}
              onReject={handleWaive}
              onRestore={handleRestore}
              buttonStyle={sharedButtonStyle}
            />
          </div>
        );
      case "club":
        return (
          <div style={{ overflowX: "auto" }}>
            <ClubReportTable
              reports={reports}
              onPenalize={id => setSuspendModal({ open: true, userId: id, until: "" })}
              onReject={handleWaive}
              onRestore={handleRestore}
              buttonStyle={sharedButtonStyle}
            />
          </div>
        );
      case "organizer":
        return (
          <div style={{ overflowX: "auto" }}>
            <OrganizerReportTable
              reports={reports}
              onPenalize={id => setSuspendModal({ open: true, userId: id, until: "" })}
              onReject={handleWaive}
              onRestore={handleRestore}
              buttonStyle={sharedButtonStyle}
            />
          </div>
        );
      case "team":
        return (
          <div style={{ overflowX: "auto" }}>
            <TeamReportTable
              reports={reports}
              onPenalize={id => setSuspendModal({ open: true, userId: id, until: "" })}
              onReject={handleWaive}
              onRestore={handleRestore}
              buttonStyle={sharedButtonStyle}
            />
          </div>
        );
      default:
        return null;
    }
  }

  return (
    <div style={{ minHeight: "500px" }}>
      <h2>Profile Reports</h2>
      {/* Controls */}
      <div style={{
        display: "flex",
        gap: 12,
        marginBottom: 16,
        alignItems: "center",
        flexWrap: "wrap"
      }}>
        <DropdownButton
          label="All Reports"
          options={REPORT_TYPES}
          selected={reportType}
          open={typeDropdownOpen}
          setOpen={setTypeDropdownOpen}
          onSelect={setReportType}
          dropdownRef={typeDropdownRef}
        />
        <DropdownButton
          label="Most Recent"
          options={SORT_OPTIONS}
          selected={sortBy}
          open={sortDropdownOpen}
          setOpen={setSortDropdownOpen}
          onSelect={setSortBy}
          dropdownRef={sortDropdownRef}
        />
        <DropdownButton
          label="All Time"
          options={TIME_FILTERS}
          selected={timeFilter}
          open={timeDropdownOpen}
          setOpen={setTimeDropdownOpen}
          onSelect={setTimeFilter}
          dropdownRef={timeDropdownRef}
        />
        <DropdownButton
          label="All Status"
          options={STATUS_OPTIONS}
          selected={statusFilter}
          open={statusDropdownOpen}
          setOpen={setStatusDropdownOpen}
          onSelect={setStatusFilter}
          dropdownRef={statusDropdownRef}
        />
        <button
          style={{
            background: "#eee",
            color: "#333",
            border: "none",
            borderRadius: 6,
            padding: "7px 16px",
            fontSize: "13px",
            cursor: "pointer",
            marginLeft: 4
          }}
          onClick={handleResetFilters}
        >
          Reset Filters
        </button>
        <button
          style={{
            background: "#2563eb",
            color: "#fff",
            border: "none",
            borderRadius: 6,
            padding: "7px 16px",
            fontSize: "13px",
            cursor: "pointer",
            marginLeft: 4
          }}
          onClick={fetchReports}
        >
          Refresh
        </button>
      </div>
      {/* Error display */}
      {error && (
        <div style={{
          padding: "12px 16px",
          marginBottom: 16,
          backgroundColor: "#fee",
          color: "#c00",
          borderRadius: 6,
          border: "1px solid #fcc"
        }}>
          {error}
        </div>
      )}
      {/* Content */}
      {loading ? (
        <p>Loading...</p>
      ) : (
        renderReportTable()
      )}
      {/* Penalize Modal */}
      {suspendModal.open && (
        <div style={{
          position: "fixed",
          top: 0,
          left: 0,
          width: "100vw",
          height: "100vh",
          background: "rgba(0,0,0,0.5)",
          display: "flex",
          alignItems: "center",
          justifyContent: "center",
          zIndex: 1000
        }}>
          <div style={{
            background: "#fff",
            padding: 24,
            borderRadius: 8,
            minWidth: 320,
            maxWidth: 500,
            boxShadow: "0 4px 6px rgba(0, 0, 0, 0.1)"
          }}>
            <h3 style={{ marginTop: 0, marginBottom: 16 }}>
              Set Suspension Date
            </h3>
            <input
              type="datetime-local"
              value={suspendModal.until}
              onChange={(e) => setSuspendModal(s => ({ ...s, until: e.target.value }))}
              style={{
                marginBottom: 16,
                width: "100%",
                padding: "8px 12px",
                border: "1px solid #ccc",
                borderRadius: 4
              }}
              min={new Date().toISOString().slice(0, 16)}
            />
            <div style={{ display: "flex", gap: 8, justifyContent: "flex-end" }}>
              <button
                className="decline-btn"
                onClick={() => setSuspendModal({ open: false, userId: null, until: "" })}
                style={{ minWidth: 90, padding: "8px 0", fontSize: "14px" }}
              >
                Cancel
              </button>
              <button
                className="accept-btn"
                onClick={() => handlePenalize(suspendModal.userId, suspendModal.until)}
                disabled={!suspendModal.until}
                style={{ minWidth: 90, padding: "8px 0", fontSize: "14px" }}
              >
                Suspend
              </button>
            </div>
          </div>
        </div>
      )}
    </div>
  );
}