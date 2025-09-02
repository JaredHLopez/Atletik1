import React, { useEffect, useState, useRef, useCallback } from "react";
import supabase from "../helper/supabaseClient";
import UserReportTable from "./UserReportTable";
import ClubReportTable from "./ClubReportTable";
import OrganizerReportTable from "./OrganizerReportTable";
import TeamReportTable from "./TeamReportTable";

// Constants
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
  user: {
    table: "user_reports",
    id: "reported_id",
    join: "users:reported_id(user_id, username, intro, bio, suspended_until)",
    entityTable: "users",
    pk: "user_id"
  },
  club: {
    table: "club_reports",
    id: "reported_id",
    join: "clubs:reported_id(club_id, club_name, sports, street_address, barangay, city, province, suspended_until)",
    entityTable: "clubs",
    pk: "club_id"
  },
  organizer: {
    table: "organizer_reports",
    id: "reported_id",
    join: "organizers:reported_id(user_id, username, suffix, intro, bio, suspended_until)",
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

// Helper functions
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

// Dropdown component
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
          minWidth: 160,
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
            minWidth: 160,
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

// Main component
export default function ProfileReports() {
  // State
  const [reports, setReports] = useState([]);
  const [sortBy, setSortBy] = useState("count");
  const [timeFilter, setTimeFilter] = useState("all");
  const [reportType, setReportType] = useState("user");
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

  // Refs
  const typeDropdownRef = useRef(null);
  const sortDropdownRef = useRef(null);
  const timeDropdownRef = useRef(null);

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
        .eq("approval_status", "pending"); // Only fetch pending reports

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

        // Get all report IDs for waiving (since we're only fetching pending reports now)
        const reportIds = group.reports.map(report => report.report_id);

        return {
          ...group.entity,
          reportIds: reportIds, // Store all report IDs (all are pending now)
          reportCount: group.reports.length,
          reasons: [...new Set(reasons)],
          lastReported: group.reports.reduce((latest, report) => {
            return new Date(report.created_at) > new Date(latest)
              ? report.created_at
              : latest;
          }, group.reports[0]?.created_at)
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
  }, [sortBy, timeFilter, reportType]);

  // Handle waive action - Simplified since we only have pending reports
  const handleWaive = useCallback(async (entityId) => {
    try {
      // Find the report object for this entity
      const reportObj = reports.find(r => r[TABLE_MAP[reportType].pk] === entityId);
      if (!reportObj || !reportObj.reportIds || reportObj.reportIds.length === 0) {
        setError("No reports found for this entity");
        return;
      }

      const { table } = TABLE_MAP[reportType];
      
      // Update all reports for this entity to rejected
      const { error } = await supabase
        .from(table)
        .update({ approval_status: "rejected" })
        .in("report_id", reportObj.reportIds);
      
      if (error) throw error;
      
      // Clear any existing error
      setError(null);
      await fetchReports();
    } catch (err) {
      console.error("Error rejecting report:", err);
      setError("Failed to reject report");
    }
  }, [reportType, fetchReports, reports]);

  // Handle penalize action - Fixed to use correct entity ID
  const handlePenalize = useCallback(async (entityId, untilDate) => {
    try {
      if (!untilDate) {
        setError("Please select a suspension date");
        return;
      }
      
      const { entityTable, pk } = TABLE_MAP[reportType];
      const { error } = await supabase
        .from(entityTable)
        .update({ suspended_until: untilDate })
        .eq(pk, entityId);
      
      if (error) throw error;
      
      // Clear any existing error and update suspension
      setError(null);
      setSuspendModal({ open: false, userId: null, until: "" });
      await fetchReports();
    } catch (err) {
      console.error("Error penalizing entity:", err);
      setError("Failed to suspend entity");
    }
  }, [reportType, fetchReports]);

  // Close modal
  const closeSuspendModal = useCallback(() => {
    setSuspendModal({ open: false, userId: null, until: "" });
  }, []);

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
    }
    const hasOpenDropdown = typeDropdownOpen || sortDropdownOpen || timeDropdownOpen;
    if (hasOpenDropdown) {
      document.addEventListener("mousedown", handleClickOutside);
      return () => document.removeEventListener("mousedown", handleClickOutside);
    }
  }, [typeDropdownOpen, sortDropdownOpen, timeDropdownOpen]);

  // Render correct table based on reportType
  function renderReportTable() {
    switch (reportType) {
      case "user":
        return (
          <UserReportTable
            reports={reports}
            onPenalize={id => setSuspendModal({ open: true, userId: id, until: "" })}
            onWaive={handleWaive}
          />
        );
      case "club":
        return (
          <ClubReportTable
            reports={reports}
            onPenalize={id => setSuspendModal({ open: true, userId: id, until: "" })}
            onWaive={handleWaive}
          />
        );
      case "organizer":
        return (
          <OrganizerReportTable
            reports={reports}
            onPenalize={id => setSuspendModal({ open: true, userId: id, until: "" })}
            onWaive={handleWaive}
          />
        );
      case "team":
        return (
          <TeamReportTable
            reports={reports}
            onPenalize={id => setSuspendModal({ open: true, userId: id, until: "" })}
            onWaive={handleWaive}
          />
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
        gap: 16,
        marginBottom: 16,
        alignItems: "center",
        flexWrap: "wrap"
      }}>
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
                onClick={closeSuspendModal}
              >
                Cancel
              </button>
              <button
                className="accept-btn"
                onClick={() => handlePenalize(suspendModal.userId, suspendModal.until)}
                disabled={!suspendModal.until}
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