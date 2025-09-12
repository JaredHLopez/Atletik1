import React, { useEffect, useState, useRef, useCallback } from "react";
import supabase from "../helper/supabaseClient";
import ClubApplicationTable from "./ClubApplicationTable";
import OrganizerApplicationTable from "./OrganizerApplicationTable";

// Constants
const TIME_FILTERS = [
  { label: "Today", value: "day" },
  { label: "This Week", value: "week" },
  { label: "This Month", value: "month" },
  { label: "All Time", value: "all" },
];

const STATUS_OPTIONS = [
  { label: "Pending", value: "pending" },
  { label: "Accepted", value: "accepted" }, // Changed back to "accepted"
  { label: "Rejected", value: "rejected" },
];

const TABLE_MAP = {
  club: {
    table: "club_applications",
    id: "club_application_id",
    bucketName: "club-documents"
  },
  organizer: {
    table: "organizer_applications", 
    id: "organizer_application_id",
    bucketName: "organizer-documents"
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

export default function Applications({ initialType = "club" }) {
  // State
  const [applications, setApplications] = useState([]);
  const [timeFilter, setTimeFilter] = useState("all");
  const [statusFilter, setStatusFilter] = useState("pending");
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState(null);

  // Dropdown states
  const [timeDropdownOpen, setTimeDropdownOpen] = useState(false);
  const [statusDropdownOpen, setStatusDropdownOpen] = useState(false);

  // Refs
  const timeDropdownRef = useRef(null);
  const statusDropdownRef = useRef(null);

  // Fetch applications function
  const fetchApplications = useCallback(async () => {
    try {
      setLoading(true);
      setError(null);

      const { table } = TABLE_MAP[initialType];
      const fromDate = getTimeFilter(timeFilter);

      let query = supabase
        .from(table)
        .select("*");

      // Filter by status
      if (statusFilter !== "all") {
        query = query.eq("application_status", statusFilter);
      }

      // Filter by time
      if (fromDate) {
        query = query.gte("created_at", fromDate.toISOString());
      }

      // Order by created_at descending (newest first)
      query = query.order("created_at", { ascending: false });

      const { data, error: queryError } = await query;

      if (queryError) {
        throw queryError;
      }

      console.log("=== FETCHED APPLICATION DATA ===");
      console.log("Total applications fetched:", data?.length || 0);
      console.log("Filter status:", statusFilter);
      if (data && data.length > 0) {
        console.log("Sample application object:", data[0]);
        console.log("Application statuses:", data.map(app => app.application_status));
      }

      setApplications(data || []);

    } catch (err) {
      console.error("Error fetching applications:", err);
      setError(err.message || "Failed to fetch applications");
      setApplications([]);
    } finally {
      setLoading(false);
    }
  }, [timeFilter, initialType, statusFilter]);

  // Handle approve action - ONLY change status to "accepted"
  const handleApprove = useCallback(async (applicationId) => {
    try {
      console.log("=== ACCEPTING APPLICATION ===");
      console.log("Application ID:", applicationId);
      console.log("Application Type:", initialType);
      
      const { table, id } = TABLE_MAP[initialType];
      
      // ONLY update application status to "accepted"
      const updateData = { application_status: "accepted" };

      const { data: updatedApplication, error: updateError } = await supabase
        .from(table)
        .update(updateData)
        .eq(id, applicationId)
        .select();

      if (updateError) {
        console.error("Update error:", updateError);
        throw updateError;
      }

      console.log("Application accepted successfully:", updatedApplication);
      
      // Update UI - remove from current view if viewing pending
      if (statusFilter === "pending") {
        setApplications(prev => prev.filter(app => app[id] !== applicationId));
        console.log("Application removed from pending view");
      } else {
        await fetchApplications();
        console.log("Applications refreshed");
      }
      
      setError(null);
      console.log("=== ACCEPTANCE COMPLETED SUCCESSFULLY ===");
      
    } catch (err) {
      console.error("=== ACCEPTANCE FAILED ===");
      console.error("Error details:", err);
      setError(`Failed to accept application: ${err.message}`);
    }
  }, [initialType, fetchApplications, statusFilter]);

  // Handle reject action - ONLY change status to "rejected"
  const handleReject = useCallback(async (applicationId, reason) => {
    try {
      console.log("=== REJECTING APPLICATION ===");
      console.log("Application ID:", applicationId);
      console.log("Rejection reason:", reason);
      console.log("Application type:", initialType);
      
      const { table, id } = TABLE_MAP[initialType];
      
      const updateData = { application_status: "rejected" };
      
      if (reason && reason.trim()) {
        updateData.rejection_reason = reason.trim();
      }

      console.log("Update data:", updateData);

      const { data, error } = await supabase
        .from(table)
        .update(updateData)
        .eq(id, applicationId)
        .select();

      if (error) {
        console.error("Reject error details:", error);
        throw error;
      }

      console.log("Rejection successful, updated record:", data);
      
      // Update UI - remove from current view if viewing pending
      if (statusFilter === "pending") {
        setApplications(prev => prev.filter(app => app[id] !== applicationId));
        console.log("Application removed from pending view");
      } else {
        await fetchApplications();
        console.log("Applications refreshed");
      }
      
      setError(null);
      console.log("=== REJECTION COMPLETED SUCCESSFULLY ===");
      
    } catch (err) {
      console.error("=== REJECTION FAILED ===");
      console.error("Error details:", err);
      setError(`Failed to reject application: ${err.message}`);
    }
  }, [initialType, fetchApplications, statusFilter]);

  // Handle restore action - ONLY change status back to "pending"
  const handleRestore = useCallback(async (applicationId) => {
    try {
      console.log("=== RESTORING APPLICATION ===");
      console.log("Application ID:", applicationId);
      console.log("Application type:", initialType);
      
      const { table, id } = TABLE_MAP[initialType];
      
      const updateData = { 
        application_status: "pending",
        rejection_reason: null
      };

      console.log("Update data:", updateData);

      const { data, error } = await supabase
        .from(table)
        .update(updateData)
        .eq(id, applicationId)
        .select();

      if (error) {
        console.error("Restore error details:", error);
        throw error;
      }

      console.log("Restore successful, updated record:", data);
      
      // Update UI - remove from current view if viewing rejected/accepted
      if (statusFilter === "rejected" || statusFilter === "accepted") {
        setApplications(prev => prev.filter(app => app[id] !== applicationId));
        console.log("Application removed from current view");
      } else {
        await fetchApplications();
        console.log("Applications refreshed");
      }
      
      setError(null);
      console.log("=== RESTORE COMPLETED SUCCESSFULLY ===");
      
    } catch (err) {
      console.error("=== RESTORE FAILED ===");
      console.error("Error details:", err);
      setError(`Failed to restore application: ${err.message}`);
    }
  }, [initialType, fetchApplications, statusFilter]);

  // Reset filters
  const handleResetFilters = () => {
    setTimeFilter("all");
    setStatusFilter("pending");
  };

  // Effects
  useEffect(() => {
    fetchApplications();
  }, [fetchApplications]);

  // Handle outside click for dropdowns
  useEffect(() => {
    function handleClickOutside(event) {
      if (timeDropdownRef.current && !timeDropdownRef.current.contains(event.target)) {
        setTimeDropdownOpen(false);
      }
      if (statusDropdownRef.current && !statusDropdownRef.current.contains(event.target)) {
        setStatusDropdownOpen(false);
      }
    }
    const hasOpenDropdown = timeDropdownOpen || statusDropdownOpen;
    if (hasOpenDropdown) {
      document.addEventListener("mousedown", handleClickOutside);
      return () => document.removeEventListener("mousedown", handleClickOutside);
    }
  }, [timeDropdownOpen, statusDropdownOpen]);

  // Render correct table based on initialType
  function renderApplicationTable() {
    const sharedButtonStyle = {
      minWidth: 90,
      padding: "8px 0",
      fontSize: "14px"
    };

    const tableProps = {
      applications,
      onApprove: handleApprove,
      onReject: handleReject,
      onRestore: handleRestore,
      buttonStyle: sharedButtonStyle,
      bucketName: TABLE_MAP[initialType].bucketName,
      currentStatus: statusFilter
    };

    switch (initialType) {
      case "club":
        return (
          <div style={{ overflowX: "auto" }}>
            <ClubApplicationTable {...tableProps} />
          </div>
        );
      case "organizer":
        return (
          <div style={{ overflowX: "auto" }}>
            <OrganizerApplicationTable {...tableProps} />
          </div>
        );
      default:
        return null;
    }
  }

  return (
    <div style={{ minHeight: "500px" }}>
      <h2>{initialType === "club" ? "Club" : "Organizer"} Applications</h2>
      
      {/* Status summary */}
      <div style={{
        padding: "8px 12px",
        marginBottom: 16,
        backgroundColor: "#f0f9ff",
        color: "#0369a1",
        borderRadius: 6,
        border: "1px solid #bae6fd",
        fontSize: "12px"
      }}>
        Showing: {statusFilter === "all" ? "All Applications" : `${statusFilter.charAt(0).toUpperCase() + statusFilter.slice(1)} Applications`} | 
        Total: {applications.length}
      </div>

      {/* Controls */}
      <div style={{
        display: "flex",
        gap: 12,
        marginBottom: 16,
        alignItems: "center",
        flexWrap: "wrap"
      }}>
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
          label="Pending"
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
          onClick={fetchApplications}
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
        <div style={{ textAlign: "center", padding: "40px" }}>
          <p>Loading applications...</p>
        </div>
      ) : applications.length === 0 ? (
        <div style={{ textAlign: "center", padding: "40px" }}>
          <p>No {statusFilter === "all" ? "" : statusFilter} applications found.</p>
        </div>
      ) : (
        renderApplicationTable()
      )}
    </div>
  );
}