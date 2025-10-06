import React from "react";
import ClubApplicationTable from "./ClubApplicationTable";
import OrganizerApplicationTable from "./OrganizerApplicationTable";
import DropdownButton from "../components/shared/DropdownButton";
import ErrorDisplay from "../components/shared/ErrorDisplay";
import { useApplications } from "../hooks/useApplications";
import { TIME_FILTERS, APPLICATION_STATUS_OPTIONS as STATUS_OPTIONS, APPLICATION_TABLE_MAP } from "../utils/constants";

export default function Applications({ initialType = "club" }) {
  const {
    applications,
    timeFilter,
    setTimeFilter,
    statusFilter,
    setStatusFilter,
    loading,
    error,
    timeDropdownOpen,
    setTimeDropdownOpen,
    statusDropdownOpen,
    setStatusDropdownOpen,
    timeDropdownRef,
    statusDropdownRef,
    handleApprove,
    handleReject,
    handleRestore,
    handleResetFilters,
    fetchApplications
  } = useApplications(initialType);

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
      bucketName: APPLICATION_TABLE_MAP[initialType].bucketName,
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
      <ErrorDisplay error={error} />

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