import React, { useEffect, useRef } from "react";
import supabase from "../helper/supabaseClient";
import UserReportTable from "./UserReportTable";
import ClubReportTable from "./ClubReportTable";
import OrganizerReportTable from "./OrganizerReportTable";
import TeamReportTable from "./TeamReportTable";
import { useFilters, useModal } from "../hooks/useCommon";
import DropdownButton from "../components/shared/DropdownButton";
import ActionButton from "../components/shared/ActionButton";
import ErrorDisplay from "../components/shared/ErrorDisplay";
import Modal from "../components/shared/Modal";
import { TIME_FILTER_OPTIONS, REPORT_STATUS_OPTIONS } from "../utils/constants";
import { REPORT_TABLE_MAP } from "../utils/tableConfig";
import { getTimeFilter } from "../utils/dateUtils";
import { processReportData, sortReportsByType } from "../utils/dataUtils";

// Constants for dropdown options
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

export default function ProfileReports() {
  // Custom hooks
  const { filters, updateFilter, resetFilters } = useFilters({
    timeFilter: "day",
    statusFilter: "pending",
    reportType: "user",
    sortBy: "recent"
  });

  const { isOpen: suspendModalOpen, data: suspendData, openModal: openSuspendModal, closeModal: closeSuspendModal } = useModal();

  // Local state
  const [reports, setReports] = React.useState([]);
  const [loading, setLoading] = React.useState(false);
  const [error, setError] = React.useState(null);
  const [suspendUntil, setSuspendUntil] = React.useState("");

  // Dropdown states
  const [typeDropdownOpen, setTypeDropdownOpen] = React.useState(false);
  const [sortDropdownOpen, setSortDropdownOpen] = React.useState(false);
  const [timeDropdownOpen, setTimeDropdownOpen] = React.useState(false);
  const [statusDropdownOpen, setStatusDropdownOpen] = React.useState(false);

  // Refs for dropdown click handling
  const typeDropdownRef = useRef(null);
  const sortDropdownRef = useRef(null);
  const timeDropdownRef = useRef(null);
  const statusDropdownRef = useRef(null);

  // Fetch reports function
  const fetchReports = React.useCallback(async () => {
    try {
      setLoading(true);
      setError(null);

      const tableConfig = REPORT_TABLE_MAP[filters.reportType];
      if (!tableConfig) {
        throw new Error(`Unknown report type: ${filters.reportType}`);
      }

      const { table, id, join } = tableConfig;
      const fromDate = getTimeFilter(filters.timeFilter);

      let query = supabase
        .from(table)
        .select(`report_id, ${id}, reason, approval_status, created_at, ${join}`)
        .eq("approval_status", filters.statusFilter);

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

      // Process and group the data using utility function
      let processedReports = processReportData(data, filters.reportType);
      
      // Sort the reports using utility function
      processedReports = sortReportsByType(processedReports, filters.sortBy);
      
      setReports(processedReports);

    } catch (err) {
      console.error("Error fetching reports:", err);
      setError(err.message || "Failed to fetch reports");
      setReports([]);
    } finally {
      setLoading(false);
    }
  }, [filters]);

  // Handle waive action
  const handleWaive = React.useCallback(async (entityId) => {
    try {
      const tableConfig = REPORT_TABLE_MAP[filters.reportType];
      const reportObj = reports.find(r => r[tableConfig.pk] === entityId);
      
      if (!reportObj?.reportIds?.length) {
        setError("No reports found for this entity");
        return;
      }

      const { error } = await supabase
        .from(tableConfig.table)
        .update({ approval_status: "rejected" })
        .in("report_id", reportObj.reportIds);

      if (error) throw error;
      
      setError(null);
      await fetchReports();
    } catch (err) {
      console.error("Error rejecting report:", err);
      setError("Failed to reject report");
    }
  }, [filters.reportType, fetchReports, reports]);

  // Handle penalize action
  const handlePenalize = React.useCallback(async (entityId, untilDate) => {
    try {
      if (!untilDate) {
        setError("Please select a suspension date");
        return;
      }

      const tableConfig = REPORT_TABLE_MAP[filters.reportType];
      const { entityTable, pk, table } = tableConfig;

      // 1. Suspend the entity
      const { error: suspendError } = await supabase
        .from(entityTable)
        .update({ suspended_until: untilDate })
        .eq(pk, entityId);

      if (suspendError) throw suspendError;

      // 2. Update all related reports to "penalized"
      const reportObj = reports.find(r => r[pk] === entityId);
      if (reportObj?.reportIds?.length) {
        const { error: reportError } = await supabase
          .from(table)
          .update({ approval_status: "penalized" })
          .in("report_id", reportObj.reportIds)
          .eq("approval_status", "pending");
          
        if (reportError) throw reportError;
      }

      setError(null);
      closeSuspendModal();
      setSuspendUntil("");
      await fetchReports();
    } catch (err) {
      console.error("Error penalizing entity:", err);
      setError("Failed to suspend entity");
    }
  }, [filters.reportType, fetchReports, reports, closeSuspendModal]);

  // Handle restore action
  const handleRestore = React.useCallback(async (entityId) => {
    try {
      const tableConfig = REPORT_TABLE_MAP[filters.reportType];
      const reportObj = reports.find(r => r[tableConfig.pk] === entityId);
      
      if (!reportObj?.reportIds?.length) {
        setError("No reports found for this entity");
        return;
      }

      const { table, entityTable, pk } = tableConfig;

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
  }, [filters.reportType, fetchReports, reports]);

  // Handle opening suspend modal
  const handleOpenSuspendModal = React.useCallback((entityId) => {
    openSuspendModal(entityId);
    setSuspendUntil("");
  }, [openSuspendModal]);

  // Handle confirming suspension
  const handleConfirmSuspend = React.useCallback(() => {
    if (suspendData && suspendUntil) {
      handlePenalize(suspendData, suspendUntil);
    }
  }, [suspendData, suspendUntil, handlePenalize]);

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
  const renderReportTable = () => {
    const sharedButtonStyle = {
      minWidth: 90,
      padding: "8px 0",
      fontSize: "14px"
    };

    const tableProps = {
      reports,
      onPenalize: handleOpenSuspendModal,
      onReject: handleWaive,
      onRestore: handleRestore,
      buttonStyle: sharedButtonStyle
    };

    switch (filters.reportType) {
      case "user":
        return (
          <div style={{ overflowX: "auto" }}>
            <UserReportTable {...tableProps} />
          </div>
        );
      case "club":
        return (
          <div style={{ overflowX: "auto" }}>
            <ClubReportTable {...tableProps} />
          </div>
        );
      case "organizer":
        return (
          <div style={{ overflowX: "auto" }}>
            <OrganizerReportTable {...tableProps} />
          </div>
        );
      case "team":
        return (
          <div style={{ overflowX: "auto" }}>
            <TeamReportTable {...tableProps} />
          </div>
        );
      default:
        return null;
    }
  };

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
          selected={filters.reportType}
          open={typeDropdownOpen}
          setOpen={setTypeDropdownOpen}
          onSelect={(value) => updateFilter("reportType", value)}
          dropdownRef={typeDropdownRef}
        />
        
        <DropdownButton
          label="Most Recent"
          options={SORT_OPTIONS}
          selected={filters.sortBy}
          open={sortDropdownOpen}
          setOpen={setSortDropdownOpen}
          onSelect={(value) => updateFilter("sortBy", value)}
          dropdownRef={sortDropdownRef}
        />
        
        <DropdownButton
          label="All Time"
          options={TIME_FILTER_OPTIONS}
          selected={filters.timeFilter}
          open={timeDropdownOpen}
          setOpen={setTimeDropdownOpen}
          onSelect={(value) => updateFilter("timeFilter", value)}
          dropdownRef={timeDropdownRef}
        />
        
        <DropdownButton
          label="All Status"
          options={REPORT_STATUS_OPTIONS}
          selected={filters.statusFilter}
          open={statusDropdownOpen}
          setOpen={setStatusDropdownOpen}
          onSelect={(value) => updateFilter("statusFilter", value)}
          dropdownRef={statusDropdownRef}
        />
        
        <ActionButton
          variant="secondary"
          onClick={resetFilters}
          style={{ marginLeft: 4 }}
        >
          Reset Filters
        </ActionButton>
        
        <ActionButton
          variant="primary"
          onClick={fetchReports}
          style={{ marginLeft: 4 }}
        >
          Refresh
        </ActionButton>
      </div>

      {/* Error display */}
      <ErrorDisplay error={error} />

      {/* Content */}
      {loading ? (
        <p>Loading...</p>
      ) : (
        renderReportTable()
      )}

      {/* Suspend Modal */}
      <Modal
        isOpen={suspendModalOpen}
        onClose={closeSuspendModal}
        title="Set Suspension Date"
        showDefaultButtons={false}
      >
        <div style={{ marginBottom: 16 }}>
          <input
            type="datetime-local"
            value={suspendUntil}
            onChange={(e) => setSuspendUntil(e.target.value)}
            style={{
              width: "100%",
              padding: "8px 12px",
              border: "1px solid #ccc",
              borderRadius: 4
            }}
            min={new Date().toISOString().slice(0, 16)}
          />
        </div>
        
        <div style={{ display: "flex", gap: 8, justifyContent: "flex-end" }}>
          <ActionButton
            variant="secondary"
            onClick={closeSuspendModal}
          >
            Cancel
          </ActionButton>
          
          <ActionButton
            variant="danger"
            onClick={handleConfirmSuspend}
            disabled={!suspendUntil}
          >
            Suspend
          </ActionButton>
        </div>
      </Modal>
    </div>
  );
}