import { useState, useCallback } from "react";
import supabase from "../helper/supabaseClient";
import { REPORT_TABLE_MAP } from "../utils/tableConfig";
import { getTimeFilter } from "../utils/dateUtils";

export const useReports = (reportType) => {
  const [reports, setReports] = useState([]);
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState(null);

  // Fetch reports with filtering
  const fetchReports = useCallback(async (filters = {}) => {
    try {
      setLoading(true);
      setError(null);

      const tableConfig = REPORT_TABLE_MAP[reportType];
      if (!tableConfig) {
        throw new Error(`Unknown report type: ${reportType}`);
      }

      const { table, fields } = tableConfig;
      const { timeFilter, statusFilter, userFilter } = filters;

      let query = supabase
        .from(table)
        .select(fields || "*");

      // Apply time filter
      if (timeFilter && timeFilter !== "all") {
        const fromDate = getTimeFilter(timeFilter);
        if (fromDate) {
          query = query.gte("created_at", fromDate.toISOString());
        }
      }

      // Apply status filter
      if (statusFilter && statusFilter !== "all") {
        query = query.eq("report_status", statusFilter);
      }

      // Apply user filter for specific report types
      if (userFilter && userFilter !== "all") {
        if (reportType === "user" && userFilter === "user") {
          query = query.not("user_id", "is", null);
        } else if (reportType === "user" && userFilter === "club") {
          query = query.not("club_id", "is", null);
        }
      }

      query = query.order("created_at", { ascending: false });

      const { data, error: queryError } = await query;

      if (queryError) {
        throw queryError;
      }

      setReports(data || []);
    } catch (err) {
      console.error(`Error fetching ${reportType} reports:`, err);
      setError(err.message || `Failed to fetch ${reportType} reports`);
      setReports([]);
    } finally {
      setLoading(false);
    }
  }, [reportType]);

  // Update report status
  const updateReportStatus = useCallback(async (reportId, status, adminComment = null) => {
    try {
      const tableConfig = REPORT_TABLE_MAP[reportType];
      if (!tableConfig) {
        throw new Error(`Unknown report type: ${reportType}`);
      }

      const { table, id } = tableConfig;
      
      const updateData = { report_status: status };
      
      if (adminComment && adminComment.trim()) {
        updateData.admin_comment = adminComment.trim();
      }

      const { error: updateError } = await supabase
        .from(table)
        .update(updateData)
        .eq(id, reportId);

      if (updateError) {
        throw updateError;
      }

      // Update local state
      setReports(prev => 
        prev.map(report => 
          report[id] === reportId 
            ? { ...report, ...updateData }
            : report
        )
      );
      
      setError(null);
    } catch (err) {
      console.error(`Error updating ${reportType} report status:`, err);
      setError(`Failed to update report status: ${err.message}`);
    }
  }, [reportType]);

  // Delete report
  const deleteReport = useCallback(async (reportId) => {
    try {
      const tableConfig = REPORT_TABLE_MAP[reportType];
      if (!tableConfig) {
        throw new Error(`Unknown report type: ${reportType}`);
      }

      const { table, id } = tableConfig;

      const { error: deleteError } = await supabase
        .from(table)
        .delete()
        .eq(id, reportId);

      if (deleteError) {
        throw deleteError;
      }

      // Update local state
      setReports(prev => prev.filter(report => report[id] !== reportId));
      setError(null);
    } catch (err) {
      console.error(`Error deleting ${reportType} report:`, err);
      setError(`Failed to delete report: ${err.message}`);
    }
  }, [reportType]);

  // Archive/restore report
  const toggleArchiveReport = useCallback(async (reportId, isArchived) => {
    try {
      const tableConfig = REPORT_TABLE_MAP[reportType];
      if (!tableConfig) {
        throw new Error(`Unknown report type: ${reportType}`);
      }

      const { table, id } = tableConfig;
      
      const { error: updateError } = await supabase
        .from(table)
        .update({ archived: isArchived })
        .eq(id, reportId);

      if (updateError) {
        throw updateError;
      }

      // Update local state
      setReports(prev => 
        prev.map(report => 
          report[id] === reportId 
            ? { ...report, archived: isArchived }
            : report
        )
      );
      
      setError(null);
    } catch (err) {
      console.error(`Error ${isArchived ? 'archiving' : 'restoring'} ${reportType} report:`, err);
      setError(`Failed to ${isArchived ? 'archive' : 'restore'} report: ${err.message}`);
    }
  }, [reportType]);

  return {
    reports,
    loading,
    error,
    setError,
    fetchReports,
    updateReportStatus,
    deleteReport,
    toggleArchiveReport
  };
};