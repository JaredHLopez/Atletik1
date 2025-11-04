import { useState, useRef, useCallback, useEffect } from "react";
import supabase from "../helper/supabaseClient";
import { APPLICATION_TABLE_MAP } from "../utils/constants";
import { getTimeFilter } from "../utils/dateUtils";

export const useApplications = (initialType = "club") => {
  // State
  const [applications, setApplications] = useState([]);
  const [timeFilter, setTimeFilter] = useState("all");
  const [statusFilter, setStatusFilter] = useState("all");
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState(null);

  // Dropdown states
  const [timeDropdownOpen, setTimeDropdownOpen] = useState(false);
  const [statusDropdownOpen, setStatusDropdownOpen] = useState(false);

  // Refs
  const timeDropdownRef = useRef(null);
  const statusDropdownRef = useRef(null);

  // Check if club application exists in clubs table
  const checkClubExists = useCallback(async (applicationId) => {
    if (initialType !== "club") return false;
    
    try {
      const { data: appData, error: appError } = await supabase
        .from("club_applications")
        .select("club_name")
        .eq("club_application_id", applicationId)
        .single();

      if (appError || !appData) return false;

      const { data: clubData, error: clubError } = await supabase
        .from("clubs")
        .select("club_id")
        .eq("club_name", appData.club_name)
        .single();

      return !clubError && clubData;
    } catch (err) {
      console.error("Error checking club existence:", err);
      return false;
    }
  }, [initialType]);

  // Check if organizer application exists in organizers table
  const checkOrganizerExists = useCallback(async (applicationId) => {
    if (initialType !== "organizer") return false;
    
    try {
      const { data: appData, error: appError } = await supabase
        .from("organizer_applications")
        .select("organizer_name")
        .eq("organizer_application_id", applicationId)
        .single();

      if (appError || !appData) return false;

      const { data: organizerData, error: organizerError } = await supabase
        .from("organizers")
        .select("organizer_id")
        .eq("organizer_name", appData.organizer_name)
        .single();

      return !organizerError && organizerData;
    } catch (err) {
      console.error("Error checking organizer existence:", err);
      return false;
    }
  }, [initialType]);

  // Fetch applications
  const fetchApplications = useCallback(async () => {
    try {
      setLoading(true);
      setError(null);

      const { table } = APPLICATION_TABLE_MAP[initialType];
      const fromDate = getTimeFilter(timeFilter);

      let query = supabase
        .from(table)
        .select("*");

      if (statusFilter !== "all") {
        query = query.eq("application_status", statusFilter);
      }

      if (fromDate) {
        query = query.gte("created_at", fromDate.toISOString());
      }

      query = query.order("created_at", { ascending: false });

      const { data, error: queryError } = await query;

      if (queryError) {
        throw queryError;
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

  // Handle approve action
  const handleApprove = useCallback(async (applicationId) => {
    try {
      console.log("=== ACCEPTING APPLICATION ===");
      console.log("Application ID:", applicationId);
      console.log("Application Type:", initialType);
      
      const { table, id } = APPLICATION_TABLE_MAP[initialType];
      
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
      setError(`Failed to approve application: ${err.message}`);
    }
  }, [initialType, fetchApplications, statusFilter]);

  // Handle reject action
  const handleReject = useCallback(async (applicationId, reason) => {
    try {
      console.log("=== REJECTING APPLICATION ===");
      console.log("Application ID:", applicationId);
      console.log("Rejection reason:", reason);
      console.log("Application type:", initialType);
      
      // Check if entity already exists
      if (initialType === "club") {
        const clubExists = await checkClubExists(applicationId);
        if (clubExists) {
          setError("Cannot reject this application - the club has already been created and users may be using it.");
          return;
        }
      }
      
      if (initialType === "organizer") {
        const organizerExists = await checkOrganizerExists(applicationId);
        if (organizerExists) {
          setError("Cannot reject this application - the organizer account has already been created and may be in use.");
          return;
        }
      }
      
      const { table, id } = APPLICATION_TABLE_MAP[initialType];
      
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
  }, [initialType, checkClubExists, checkOrganizerExists, fetchApplications, statusFilter]);

  // Handle restore action
  const handleRestore = useCallback(async (applicationId) => {
    try {
      console.log("=== RESTORING APPLICATION ===");
      console.log("Application ID:", applicationId);
      console.log("Application type:", initialType);
      
      // Check if entity already exists
      if (initialType === "club") {
        const clubExists = await checkClubExists(applicationId);
        if (clubExists) {
          setError("Cannot restore this application - the club has already been created and users may be using it.");
          return;
        }
      }
      
      if (initialType === "organizer") {
        const organizerExists = await checkOrganizerExists(applicationId);
        if (organizerExists) {
          setError("Cannot restore this application - the organizer account has already been created and may be in use.");
          return;
        }
      }
      
      const { table, id } = APPLICATION_TABLE_MAP[initialType];
      
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
  }, [initialType, checkClubExists, checkOrganizerExists, fetchApplications, statusFilter]);

  // Reset filters
  const handleResetFilters = useCallback(() => {
    setTimeFilter("all");
    setStatusFilter("pending");
  }, []);

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

  return {
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
  };
};