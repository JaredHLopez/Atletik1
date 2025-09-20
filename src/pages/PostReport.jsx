import React, { useEffect, useState, useRef, useCallback } from "react";
import supabase from "../helper/supabaseClient";

// UPDATED VERSION - Check console for "=== UPDATED POSTREPORT LOADED ==="
console.log("=== UPDATED POSTREPORT LOADED - CONSOLIDATED VERSION ===");

// Constants
const TIME_FILTERS = [
  { label: "All Time", value: "all" },
  { label: "Today", value: "day" },
  { label: "This Week", value: "week" },
  { label: "This Month", value: "month" },
];

const STATUS_OPTIONS = [
  { label: "All Status", value: "all" },
  { label: "Pending", value: "pending" },
  { label: "Penalized", value: "penalized" },
  { label: "Rejected", value: "rejected" },
];

const REPORT_TYPE_OPTIONS = [
  { label: "All Reports", value: "all" },
  { label: "Practice Reports", value: "practice" },
  { label: "Tournament Reports", value: "tournament" },
];

const SORT_OPTIONS = [
  { label: "Most Recent", value: "recent" },
  { label: "Oldest", value: "oldest" },
  { label: "Most Reports", value: "most_reports" },
  { label: "Least Reports", value: "least_reports" },
];

// Default values
const DEFAULT_SORT = "recent";
const DEFAULT_TIME_FILTER = "all";
const DEFAULT_STATUS_FILTER = "all";
const DEFAULT_REPORT_TYPE_FILTER = "all";

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

// Image Modal Component
function ImageModal({ imageUrl, onClose }) {
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState(false);

  useEffect(() => {
    if (imageUrl) {
      setLoading(true);
      setError(false);
      
      const img = new Image();
      img.src = imageUrl;
      img.onload = () => setLoading(false);
      img.onerror = () => {
        setLoading(false);
        setError(true);
      };
    }
  }, [imageUrl]);

  if (!imageUrl) return null;

  return (
    <div 
      style={{
        position: "fixed",
        top: 0,
        left: 0,
        width: "100vw",
        height: "100vh",
        backgroundColor: "rgba(0, 0, 0, 0.9)",
        display: "flex",
        alignItems: "center",
        justifyContent: "center",
        zIndex: 2000,
        padding: "20px"
      }}
      onClick={onClose}
    >
      <div 
        style={{
          position: "relative",
          maxWidth: "90vw",
          maxHeight: "90vh",
          display: "flex",
          flexDirection: "column",
          alignItems: "center"
        }}
        onClick={(e) => e.stopPropagation()}
      >
        <button
          onClick={onClose}
          style={{
            position: "absolute",
            top: "-40px",
            right: "0px",
            backgroundColor: "rgba(255, 255, 255, 0.9)",
            border: "none",
            borderRadius: "50%",
            width: "35px",
            height: "35px",
            fontSize: "18px",
            cursor: "pointer",
            display: "flex",
            alignItems: "center",
            justifyContent: "center",
            zIndex: 2001
          }}
        >
          ×
        </button>
        
        {loading && (
          <div style={{
            width: "100px",
            height: "100px",
            display: "flex",
            alignItems: "center",
            justifyContent: "center",
            color: "white"
          }}>
            Loading...
          </div>
        )}
        
        {error && (
          <div style={{
            padding: "20px",
            backgroundColor: "rgba(255, 255, 255, 0.1)",
            borderRadius: "8px",
            color: "white",
            textAlign: "center"
          }}>
            Failed to load image
          </div>
        )}
        
        {!loading && !error && (
          <img
            src={imageUrl}
            alt="Enlarged view"
            style={{
              maxWidth: "100%",
              maxHeight: "100%",
              objectFit: "contain",
              borderRadius: "8px",
              boxShadow: "0 4px 20px rgba(0, 0, 0, 0.3)"
            }}
          />
        )}
      </div>
    </div>
  );
}

// Main component
export default function PostReport() {
  const [reports, setReports] = useState([]);
  const [sortBy, setSortBy] = useState(DEFAULT_SORT);
  const [timeFilter, setTimeFilter] = useState(DEFAULT_TIME_FILTER);
  const [statusFilter, setStatusFilter] = useState(DEFAULT_STATUS_FILTER);
  const [reportTypeFilter, setReportTypeFilter] = useState(DEFAULT_REPORT_TYPE_FILTER);
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState(null);

  const [imageModal, setImageModal] = useState({
    open: false,
    imageUrl: null
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

  // Reset filters
  const resetFilters = useCallback(() => {
    setSortBy(DEFAULT_SORT);
    setTimeFilter(DEFAULT_TIME_FILTER);
    setStatusFilter(DEFAULT_STATUS_FILTER);
    setReportTypeFilter(DEFAULT_REPORT_TYPE_FILTER);
  }, []);

  // Helper function to get full image URL - WITH ENHANCED DEBUGGING
  const getImageUrl = (imagePath) => {
    console.log(`🔍 Processing image path: "${imagePath}"`);
    
    if (!imagePath || imagePath === "no image" || imagePath === null) {
      console.log(`❌ Invalid image path: ${imagePath}`);
      return null;
    }
    
    // If it's already a full URL, return as is
    if (imagePath.startsWith('http://') || imagePath.startsWith('https://')) {
      console.log(`✅ Already full URL: ${imagePath}`);
      return imagePath;
    }
    
    // Try tournament-posts bucket first
    try {
      const { data } = supabase.storage.from('tournament-posts').getPublicUrl(imagePath);
      if (data && data.publicUrl) {
        console.log(`✅ Image URL generated from 'tournament-posts': ${data.publicUrl}`);
        return data.publicUrl;
      }
    } catch (err) {
      console.error(`❌ Error with tournament-posts bucket:`, err);
    }
    
    // Try profile-images as fallback
    try {
      const { data } = supabase.storage.from('profile-images').getPublicUrl(imagePath);
      if (data && data.publicUrl) {
        console.log(`✅ Image URL generated from 'profile-images': ${data.publicUrl}`);
        return data.publicUrl;
      }
    } catch (err) {
      console.error(`❌ Error with profile-images bucket:`, err);
    }
    
    // Try practice-posts bucket for practice images
    try {
      const { data } = supabase.storage.from('practice-posts').getPublicUrl(imagePath);
      if (data && data.publicUrl) {
        console.log(`✅ Image URL generated from 'practice-posts': ${data.publicUrl}`);
        return data.publicUrl;
      }
    } catch (err) {
      console.error(`❌ Error with practice-posts bucket:`, err);
    }
    
    console.warn(`⚠️ All buckets failed for path: ${imagePath}`);
    return null;
  };

  // UUID validation
  const validateUUID = (uuid) => {
    if (!uuid || typeof uuid !== 'string') return false;
    const uuidRegex = /^[0-9a-f]{8}-[0-9a-f]{4}-[1-5][0-9a-f]{3}-[89ab][0-9a-f]{3}-[0-9a-f]{12}$/i;
    return uuidRegex.test(uuid);
  };

  const sanitizeUUIDArray = (uuids) => {
    if (!Array.isArray(uuids)) return [];
    return [...new Set(uuids.filter(validateUUID))];
  };

  // MAIN FETCH FUNCTION - REWRITTEN TO CONSOLIDATE BY POST
  const fetchReports = useCallback(async () => {
    try {
      setLoading(true);
      setError(null);
      
      console.log("=== FETCH REPORTS STARTED (CONSOLIDATED VERSION) ===");

      const fromDate = getTimeFilter(timeFilter);
      let consolidatedReports = [];

      // === PRACTICE REPORTS ===
      if (reportTypeFilter === "all" || reportTypeFilter === "practice") {
        try {
          console.log("🔄 Fetching practice reports...");
          
          let practiceQuery = supabase.from("practice_post_reports").select("*");
          if (fromDate) practiceQuery = practiceQuery.gte("created_at", fromDate.toISOString());
          if (statusFilter !== "all") practiceQuery = practiceQuery.eq("approval_status", statusFilter);

          const { data: practiceReportsData, error: practiceReportsError } = await practiceQuery;
          
          if (practiceReportsError) {
            console.error("❌ Practice reports error:", practiceReportsError);
          } else if (practiceReportsData && practiceReportsData.length > 0) {
            console.log("✅ Practice reports found:", practiceReportsData.length);
            
            // Group reports by post ID
            const groupedByPost = {};
            practiceReportsData.forEach(report => {
              if (report.reported_id) {
                if (!groupedByPost[report.reported_id]) {
                  groupedByPost[report.reported_id] = [];
                }
                groupedByPost[report.reported_id].push(report);
              }
            });

            // Get unique valid flagger IDs from all reports
            const allFlaggerIds = sanitizeUUIDArray(practiceReportsData.map(r => r.flagger_id));
            
            // Fetch users
            let users = [];
            if (allFlaggerIds.length > 0) {
              const { data: usersData, error: usersError } = await supabase
                .from("users")
                .select("user_id, username, first_name, last_name")
                .in("user_id", allFlaggerIds);

              if (usersError) {
                console.error("❌ Users fetch error:", usersError);
              } else {
                users = usersData || [];
              }
            }

            // Get practice posts
            const postIds = Object.keys(groupedByPost);
            let posts = [];
            if (postIds.length > 0) {
              try {
                const { data: postsData, error: postsError } = await supabase
                  .from("practice_posts")
                  .select("practice_id, title, caption, host_name")
                  .in("practice_id", postIds);

                if (postsError) {
                  console.warn("⚠️ Practice posts error (creating fallbacks):", postsError);
                  posts = postIds.map(id => ({
                    practice_id: id,
                    title: `Practice Post ${id.substring(0, 8)}`,
                    caption: "Content not available",
                    host_name: "Unknown Host"
                  }));
                } else {
                  posts = postsData || [];
                }
              } catch (err) {
                console.warn("⚠️ Practice posts exception (creating fallbacks):", err);
                posts = postIds.map(id => ({
                  practice_id: id,
                  title: `Practice Post ${id.substring(0, 8)}`,
                  caption: "Content not available",
                  host_name: "Unknown Host"
                }));
              }
            }

            // Create consolidated reports (one per post)
            Object.entries(groupedByPost).forEach(([postId, reportsForPost]) => {
              const post = posts.find(p => String(p.practice_id) === String(postId));
              const mostRecentReport = reportsForPost.sort((a, b) => new Date(b.created_at) - new Date(a.created_at))[0];
              
              // Get all reporters for this post
              const allReporters = reportsForPost.map(report => {
                const reporter = users.find(u => String(u.user_id) === String(report.flagger_id));
                return reporter ? {
                  id: reporter.user_id,
                  username: reporter.username,
                  name: [reporter.first_name, reporter.last_name].filter(Boolean).join(' ') || 'No name'
                } : null;
              }).filter(Boolean);

              // Collect all unique reasons
              const allReasons = [...new Set(reportsForPost.flatMap(report => 
                Array.isArray(report.reason) ? report.reason : (report.reason ? [report.reason] : [])
              ))];

              consolidatedReports.push({
                ...mostRecentReport, // Use most recent report as base
                post: post ? {
                  id: post.practice_id,
                  title: post.title || `Practice Post ${post.practice_id}`,
                  content: post.caption,
                  author: post.host_name,
                  image: "no image",
                  type: "practice",
                  reportCount: reportsForPost.length
                } : {
                  id: "unknown",
                  title: "Unknown Practice Post",
                  content: "No content",
                  author: "Unknown",
                  image: "no image",
                  type: "practice",
                  reportCount: reportsForPost.length
                },
                allReporters: allReporters,
                allReasons: allReasons,
                reportType: "practice",
                reportCount: reportsForPost.length,
                // Use most recent report's created_at for sorting
                created_at: mostRecentReport.created_at
              });
            });
          }
        } catch (err) {
          console.error("❌ Practice section exception:", err);
        }
      }

      // === TOURNAMENT REPORTS ===
      if (reportTypeFilter === "all" || reportTypeFilter === "tournament") {
        try {
          console.log("🔄 Fetching tournament reports...");
          
          let tournamentQuery = supabase.from("tournament_post_reports").select("*");
          if (fromDate) tournamentQuery = tournamentQuery.gte("created_at", fromDate.toISOString());
          if (statusFilter !== "all") tournamentQuery = tournamentQuery.eq("approval_status", statusFilter);

          const { data: tournamentReportsData, error: tournamentReportsError } = await tournamentQuery;
          
          if (tournamentReportsError) {
            console.error("❌ Tournament reports error:", tournamentReportsError);
          } else if (tournamentReportsData && tournamentReportsData.length > 0) {
            console.log("✅ Tournament reports found:", tournamentReportsData.length);
            
            // Group reports by post ID
            const groupedByPost = {};
            tournamentReportsData.forEach(report => {
              if (report.reported_id) {
                if (!groupedByPost[report.reported_id]) {
                  groupedByPost[report.reported_id] = [];
                }
                groupedByPost[report.reported_id].push(report);
              }
            });

            // Get unique valid flagger IDs from all reports
            const allFlaggerIds = sanitizeUUIDArray(tournamentReportsData.map(r => r.flagger_id));
            
            // Fetch users
            let users = [];
            if (allFlaggerIds.length > 0) {
              const { data: usersData, error: usersError } = await supabase
                .from("users")
                .select("user_id, username, first_name, last_name")
                .in("user_id", allFlaggerIds);

              if (usersError) {
                console.error("❌ Users fetch error:", usersError);
              } else {
                users = usersData || [];
              }
            }

            // Get tournament posts
            const postIds = Object.keys(groupedByPost);
            let posts = [];
            if (postIds.length > 0) {
              const { data: postsData, error: postsError } = await supabase
                .from("tournament_posts")
                .select("tournament_id, title, caption, poster_image, host_name")
                .in("tournament_id", postIds);

              if (postsError) {
                console.error("❌ Tournament posts error:", postsError);
              } else {
                posts = postsData || [];
              }
            }

            // Create consolidated reports (one per post)
            Object.entries(groupedByPost).forEach(([postId, reportsForPost]) => {
              const post = posts.find(p => String(p.tournament_id) === String(postId));
              const mostRecentReport = reportsForPost.sort((a, b) => new Date(b.created_at) - new Date(a.created_at))[0];
              
              // Get all reporters for this post
              const allReporters = reportsForPost.map(report => {
                const reporter = users.find(u => String(u.user_id) === String(report.flagger_id));
                return reporter ? {
                  id: reporter.user_id,
                  username: reporter.username,
                  name: [reporter.first_name, reporter.last_name].filter(Boolean).join(' ') || 'No name'
                } : null;
              }).filter(Boolean);

              // Collect all unique reasons
              const allReasons = [...new Set(reportsForPost.flatMap(report => 
                Array.isArray(report.reason) ? report.reason : (report.reason ? [report.reason] : [])
              ))];

              consolidatedReports.push({
                ...mostRecentReport, // Use most recent report as base
                post: post ? {
                  id: post.tournament_id,
                  title: post.title || `Tournament Post ${post.tournament_id}`,
                  content: post.caption,
                  author: post.host_name,
                  image: post.poster_image,
                  type: "tournament",
                  reportCount: reportsForPost.length
                } : {
                  id: "unknown",
                  title: "Unknown Tournament Post",
                  content: "No content",
                  author: "Unknown",
                  image: null,
                  type: "tournament",
                  reportCount: reportsForPost.length
                },
                allReporters: allReporters,
                allReasons: allReasons,
                reportType: "tournament",
                reportCount: reportsForPost.length,
                // Use most recent report's created_at for sorting
                created_at: mostRecentReport.created_at
              });
            });
          }
        } catch (err) {
          console.error("❌ Tournament section exception:", err);
        }
      }

      // Sort consolidated reports
      if (sortBy === "recent") {
        consolidatedReports.sort((a, b) => new Date(b.created_at) - new Date(a.created_at));
      } else if (sortBy === "oldest") {
        consolidatedReports.sort((a, b) => new Date(a.created_at) - new Date(b.created_at));
      } else if (sortBy === "most_reports") {
        consolidatedReports.sort((a, b) => b.reportCount - a.reportCount);
      } else if (sortBy === "least_reports") {
        consolidatedReports.sort((a, b) => a.reportCount - b.reportCount);
      }

      console.log("✅ Final consolidated reports:", consolidatedReports.length);
      setReports(consolidatedReports);

    } catch (err) {
      console.error("❌ Fetch reports error:", err);
      setError(err.message || "Failed to fetch post reports");
      setReports([]);
    } finally {
      setLoading(false);
    }
  }, [sortBy, timeFilter, statusFilter, reportTypeFilter]);

  // Handle refresh
  const handleRefresh = useCallback(() => {
    resetFilters();
  }, [resetFilters]);

  // Handle report action with post removal/restoration
  const handleReportAction = useCallback(async (reportId, action, reportType) => {
    try {
      console.log(`🔄 ${action === "penalized" ? "Penalizing" : action === "restored" ? "Restoring" : action === "revert" ? "Reverting to Pending" : "Processing"} ${reportType} report ${reportId}`);
      
      const reportTableName = reportType === "practice" ? "practice_post_reports" : "tournament_post_reports";
      
      // Determine the new status
      let newStatus = action;
      if (action === "restored") {
        newStatus = "pending";
      } else if (action === "revert") {
        newStatus = "pending";
      }
      
      // Update ALL reports for this post (since we're showing consolidated view)
      const { data: reportData, error: getReportError } = await supabase
        .from(reportTableName)
        .select("reported_id")
        .eq("report_id", reportId)
        .single();

      if (getReportError) {
        console.error("Error getting report data:", getReportError);
        throw getReportError;
      }

      if (reportData?.reported_id) {
        // Update ALL reports for this post
        const { error: reportError } = await supabase
          .from(reportTableName)
          .update({ approval_status: newStatus })
          .eq("reported_id", reportData.reported_id);

        if (reportError) throw reportError;

        console.log(`📋 Found reported ${reportType} ID:`, reportData.reported_id);

        if (reportType === "tournament") {
          // Handle tournament posts - Only update tournaments table since tournament_posts is a view
          if (action === "penalized") {
            console.log("🚫 Marking tournament as removed by admin");
            
            const { error: tournamentError } = await supabase
              .from("tournaments")
              .update({ removed_by_atletik_admin: true })
              .eq("tournament_id", reportData.reported_id);

            if (tournamentError) {
              console.error("Error updating tournament:", tournamentError);
            } else {
              console.log("✅ Successfully marked tournament as removed");
            }
          } else if (action === "restored" || action === "revert") {
            console.log("🔄 Restoring tournament");
            
            const { error: tournamentError } = await supabase
              .from("tournaments")
              .update({ removed_by_atletik_admin: false })
              .eq("tournament_id", reportData.reported_id);

            if (tournamentError) {
              console.error("Error restoring tournament:", tournamentError);
            } else {
              console.log("✅ Successfully restored tournament");
            }
          }
        } else if (reportType === "practice") {
          // Handle practice posts
          if (action === "penalized") {
            console.log("🚫 Marking practice as removed by admin");
            
            try {
              const { error: practiceError } = await supabase
                .from("practice_posts")
                .update({ removed_by_atletik_admin: true })
                .eq("practice_id", reportData.reported_id);

              if (practiceError) {
                console.warn("Practice post removal failed (table might not exist or lack column):", practiceError);
              } else {
                console.log("✅ Successfully marked practice as removed");
              }
            } catch (err) {
              console.warn("Practice post table not accessible:", err);
            }
          } else if (action === "restored" || action === "revert") {
            console.log("🔄 Restoring practice");
            
            try {
              const { error: practiceError } = await supabase
                .from("practice_posts")
                .update({ removed_by_atletik_admin: false })
                .eq("practice_id", reportData.reported_id);

              if (practiceError) {
                console.warn("Practice post restoration failed:", practiceError);
              } else {
                console.log("✅ Successfully restored practice");
              }
            } catch (err) {
              console.warn("Practice post table not accessible:", err);
            }
          }
        }
      }
      
      setError(null);
      await fetchReports();
      
    } catch (err) {
      console.error("Error updating report status:", err);
      setError("Failed to update report status");
    }
  }, [fetchReports]);

  // Handle image click
  const handleImageClick = useCallback((imageUrl) => {
    const fullImageUrl = getImageUrl(imageUrl);
    if (fullImageUrl) {
      setImageModal({ open: true, imageUrl: fullImageUrl });
    }
  }, []);

  const closeImageModal = useCallback(() => {
    setImageModal({ open: false, imageUrl: null });
  }, []);

  // Effects
  useEffect(() => {
    fetchReports();
  }, [fetchReports]);

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

  const truncateText = (text, maxLength = 100) => {
    if (!text) return "No content";
    if (text.length <= maxLength) return text;
    return text.substring(0, maxLength) + "...";
  };

  return (
    <div style={{ minHeight: "500px", padding: "20px", fontFamily: "Arial, sans-serif" }}>
      <h2 style={{ marginBottom: "20px" }}>Post Reports (Consolidated by Post)</h2>
      
      <div style={{
        display: "flex",
        gap: 16,
        marginBottom: 16,
        alignItems: "center",
        flexWrap: "wrap"
      }}>
        <DropdownButton
          label="Report Type"
          options={REPORT_TYPE_OPTIONS}
          selected={reportTypeFilter}
          open={typeDropdownOpen}
          setOpen={setTypeDropdownOpen}
          onSelect={setReportTypeFilter}
          dropdownRef={typeDropdownRef}
        />
        <DropdownButton
          label="Sort By"
          options={SORT_OPTIONS}
          selected={sortBy}
          open={sortDropdownOpen}
          setOpen={setSortDropdownOpen}
          onSelect={setSortBy}
          dropdownRef={sortDropdownRef}
        />
        <DropdownButton
          label="Time Filter"
          options={TIME_FILTERS}
          selected={timeFilter}
          open={timeDropdownOpen}
          setOpen={setTimeDropdownOpen}
          onSelect={setTimeFilter}
          dropdownRef={timeDropdownRef}
        />
        <DropdownButton
          label="Status"
          options={STATUS_OPTIONS}
          selected={statusFilter}
          open={statusDropdownOpen}
          setOpen={setStatusDropdownOpen}
          onSelect={setStatusFilter}
          dropdownRef={statusDropdownRef}
        />
        <button 
          onClick={handleRefresh}
          style={{ 
            padding: "8px 16px", 
            backgroundColor: "#6c757d", 
            color: "white", 
            border: "none", 
            borderRadius: "4px",
            cursor: "pointer"
          }}
        >
          Reset Filters
        </button>
        <button 
          onClick={fetchReports}
          style={{ 
            padding: "8px 16px", 
            backgroundColor: "#007bff", 
            color: "white", 
            border: "none", 
            borderRadius: "4px",
            cursor: "pointer"
          }}
        >
          Refresh
        </button>
      </div>

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

      {!loading && (
        <div style={{ marginBottom: "10px", color: "#666", fontSize: "14px" }}>
          Showing {reports.length} unique post(s) with reports
        </div>
      )}

      {loading ? (
        <p>Loading post reports...</p>
      ) : reports.length === 0 ? (
        <p>No post reports found.</p>
      ) : (
        <div style={{ overflowX: "auto" }}>
          <table style={{ 
            width: "100%", 
            borderCollapse: "collapse",
            border: "1px solid #ddd",
            minWidth: "1200px"
          }}>
            <thead>
              <tr style={{ backgroundColor: "#f5f5f5" }}>
                <th style={{ padding: "12px", textAlign: "left", border: "1px solid #ddd" }}>Post ID</th>
                <th style={{ padding: "12px", textAlign: "left", border: "1px solid #ddd" }}>Post Type</th>
                <th style={{ padding: "12px", textAlign: "left", border: "1px solid #ddd" }}>Post Title</th>
                <th style={{ padding: "12px", textAlign: "left", border: "1px solid #ddd", minWidth: "200px" }}>Post Content</th>
                <th style={{ padding: "12px", textAlign: "left", border: "1px solid #ddd" }}>Post Image</th>
                <th style={{ padding: "12px", textAlign: "left", border: "1px solid #ddd" }}>Post Author</th>
                <th style={{ padding: "12px", textAlign: "left", border: "1px solid #ddd" }}>All Reporters</th>
                <th style={{ padding: "12px", textAlign: "left", border: "1px solid #ddd" }}>All Reasons</th>
                <th style={{ padding: "12px", textAlign: "left", border: "1px solid #ddd" }}>Status</th>
                <th style={{ padding: "12px", textAlign: "left", border: "1px solid #ddd" }}>Report Count</th>
                <th style={{ padding: "12px", textAlign: "left", border: "1px solid #ddd" }}>Last Reported</th>
                <th style={{ padding: "12px", textAlign: "left", border: "1px solid #ddd" }}>Actions</th>
              </tr>
            </thead>
            <tbody>
              {reports.map((report) => (
                <tr key={`${report.reportType}_${report.post?.id}`} style={{ borderBottom: "1px solid #ddd" }}>
                  <td style={{ padding: "12px", border: "1px solid #ddd", fontSize: "12px" }}>
                    {report.post?.id?.substring(0, 8)}...
                  </td>
                  <td style={{ padding: "12px", border: "1px solid #ddd" }}>
                    <span style={{
                      padding: "4px 8px",
                      borderRadius: "4px",
                      fontSize: "12px",
                      fontWeight: "bold",
                      backgroundColor: report.reportType === "tournament" ? "#e9ecef" : "#f8f9fa",
                      color: "#495057",
                      textTransform: "capitalize"
                    }}>
                      {report.reportType}
                    </span>
                  </td>
                  <td style={{ padding: "12px", border: "1px solid #ddd" }}>
                    {report.post?.title || "Unknown Post"}
                  </td>
                  <td style={{ 
                    padding: "12px", 
                    border: "1px solid #ddd", 
                    maxWidth: "200px",
                    fontSize: "14px",
                    lineHeight: "1.4"
                  }}>
                    <div style={{
                      maxHeight: "80px",
                      overflowY: "auto",
                      color: "#333"
                    }}>
                      {truncateText(report.post?.content)}
                    </div>
                    {report.post?.content && report.post.content.length > 100 && (
                      <button
                        style={{
                          marginTop: "4px",
                          padding: "2px 6px",
                          fontSize: "10px",
                          backgroundColor: "#007bff",
                          color: "white",
                          border: "none",
                          borderRadius: "2px",
                          cursor: "pointer"
                        }}
                        onClick={() => {
                          alert(report.post.content);
                        }}
                      >
                        View Full
                      </button>
                    )}
                  </td>
                  <td style={{ padding: "12px", border: "1px solid #ddd" }}>
                    {report.reportType === "practice" ? (
                      <div style={{
                        width: "80px",
                        height: "80px",
                        backgroundColor: "#f8f9fa",
                        display: "flex",
                        alignItems: "center",
                        justifyContent: "center",
                        fontSize: "12px",
                        color: "#666",
                        borderRadius: "6px",
                        border: "2px solid #e9ecef",
                        flexDirection: "column",
                        textAlign: "center"
                      }}>
                        <div>📷</div>
                        <div>No Image</div>
                      </div>
                    ) : (
                      (() => {
                        const imageUrl = getImageUrl(report.post?.image);
                        return imageUrl && report.post?.image !== "no image" ? (
                          <div style={{ position: "relative" }}>
                            <img 
                              src={imageUrl} 
                              alt="Tournament poster"
                              style={{ 
                                width: "80px", 
                                height: "80px", 
                                objectFit: "cover", 
                                borderRadius: "6px",
                                cursor: "pointer",
                                transition: "transform 0.2s ease",
                                border: "2px solid #e9ecef"
                              }}
                              onClick={() => handleImageClick(report.post?.image)}
                              onMouseOver={(e) => {
                                e.target.style.transform = "scale(1.05)";
                              }}
                              onMouseOut={(e) => {
                                e.target.style.transform = "scale(1)";
                              }}
                              onError={(e) => {
                                e.target.style.display = "none";
                                e.target.nextSibling.style.display = "flex";
                              }}
                            />
                            <div style={{
                              width: "80px",
                              height: "80px",
                              backgroundColor: "#f8f9fa",
                              display: "none",
                              alignItems: "center",
                              justifyContent: "center",
                              fontSize: "10px",
                              color: "red",
                              borderRadius: "6px",
                              border: "2px solid #e9ecef",
                              flexDirection: "column",
                              textAlign: "center"
                            }}>
                              <div>❌</div>
                              <div>Failed to load</div>
                            </div>
                            <div style={{
                              position: "absolute",
                              top: "4px",
                              right: "4px",
                              backgroundColor: "rgba(0, 0, 0, 0.6)",
                              color: "white",
                              borderRadius: "50%",
                              width: "20px",
                              height: "20px",
                              display: "flex",
                              alignItems: "center",
                              justifyContent: "center",
                              fontSize: "10px",
                              opacity: 0.8
                            }}>
                              🔍
                            </div>
                          </div>
                        ) : (
                          <div style={{
                            width: "80px",
                            height: "80px",
                            backgroundColor: "#f8f9fa",
                            display: "flex",
                            alignItems: "center",
                            justifyContent: "center",
                            fontSize: "12px",
                            color: "#666",
                            borderRadius: "6px",
                            border: "2px solid #e9ecef",
                            flexDirection: "column",
                            textAlign: "center"
                          }}>
                            <div>📷</div>
                            <div>No Image</div>
                          </div>
                        );
                      })()
                    )}
                  </td>
                  <td style={{ padding: "12px", border: "1px solid #ddd" }}>
                    {report.post?.author || "Unknown"}
                  </td>
                  <td style={{ padding: "12px", border: "1px solid #ddd", maxWidth: "150px" }}>
                    <div style={{ 
                      maxHeight: "100px", 
                      overflowY: "auto",
                      fontSize: "12px" 
                    }}>
                      {report.allReporters && report.allReporters.length > 0 ? (
                        report.allReporters.map((reporter, idx) => (
                          <div key={idx} style={{ marginBottom: "4px", fontSize: "11px" }}>
                            <div style={{ fontWeight: "bold" }}>
                              @{reporter.username}
                            </div>
                            <div style={{ color: "#666" }}>
                              {reporter.name}
                            </div>
                          </div>
                        ))
                      ) : (
                        <div style={{ color: "#666", fontStyle: "italic" }}>No reporters found</div>
                      )}
                    </div>
                  </td>
                  <td style={{ padding: "12px", border: "1px solid #ddd", maxWidth: "150px" }}>
                    <div style={{ 
                      maxHeight: "100px", 
                      overflowY: "auto" 
                    }}>
                      <ul style={{ margin: 0, paddingLeft: "20px", fontSize: "12px" }}>
                        {report.allReasons && report.allReasons.length > 0 ? (
                          report.allReasons.map((reason, idx) => (
                            <li key={idx}>{reason}</li>
                          ))
                        ) : (
                          <li style={{ color: "#666", fontStyle: "italic" }}>No reasons provided</li>
                        )}
                      </ul>
                    </div>
                  </td>
                  <td style={{ padding: "12px", border: "1px solid #ddd" }}>
                    <span style={{
                      padding: "4px 8px",
                      borderRadius: "4px",
                      fontSize: "12px",
                      fontWeight: "bold",
                      backgroundColor: 
                        report.approval_status === "penalized" ? "#d4edda" :
                        report.approval_status === "rejected" ? "#f8d7da" :
                        report.approval_status === "restored" ? "#fff3cd" :
                        "#fff3cd",
                      color: 
                        report.approval_status === "penalized" ? "#155724" :
                        report.approval_status === "rejected" ? "#721c24" :
                        report.approval_status === "restored" ? "#856404" :
                        "#856404"
                    }}>
                      {report.approval_status}
                    </span>
                  </td>
                  <td style={{ padding: "12px", border: "1px solid #ddd", textAlign: "center" }}>
                    {report.reportCount || 1}
                  </td>
                  <td style={{ padding: "12px", border: "1px solid #ddd" }}>
                    {new Date(report.created_at).toLocaleString()}
                  </td>
                  <td style={{ padding: "12px", border: "1px solid #ddd" }}>
                    <div style={{ display: "flex", flexDirection: "column", gap: "8px" }}>
                      {report.approval_status === "pending" && (
                        <>
                          <button 
                            type="button"
                            style={{ 
                              padding: "6px 12px", 
                              backgroundColor: "#28a745", 
                              color: "white", 
                              border: "none", 
                              borderRadius: "4px",
                              cursor: "pointer",
                              fontSize: "12px"
                            }}
                            onClick={(e) => {
                              e.preventDefault();
                              e.stopPropagation();
                              handleReportAction(report.report_id, "penalized", report.reportType);
                            }}
                          >
                            Penalize & Remove Post
                          </button>
                          <button 
                            type="button"
                            style={{ 
                              padding: "6px 12px", 
                              backgroundColor: "#dc3545", 
                              color: "white", 
                              border: "none", 
                              borderRadius: "4px",
                              cursor: "pointer",
                              fontSize: "12px"
                            }}
                            onClick={(e) => {
                              e.preventDefault();
                              e.stopPropagation();
                              handleReportAction(report.report_id, "rejected", report.reportType);
                            }}
                          >
                            Reject Report
                          </button>
                        </>
                      )}
                      {report.approval_status === "penalized" && (
                        <>
                          <div style={{ 
                            fontSize: "11px", 
                            color: "#28a745", 
                            fontWeight: "bold",
                            marginBottom: "4px",
                            textAlign: "center"
                          }}>
                            Post Removed
                          </div>
                          <button 
                            type="button"
                            style={{ 
                              padding: "6px 12px", 
                              backgroundColor: "#ffc107", 
                              color: "#000", 
                              border: "none", 
                              borderRadius: "4px",
                              cursor: "pointer",
                              fontSize: "12px"
                            }}
                            onClick={(e) => {
                              e.preventDefault();
                              e.stopPropagation();
                              handleReportAction(report.report_id, "restored", report.reportType);
                            }}
                          >
                            Restore Post
                          </button>
                        </>
                      )}
                      {report.approval_status === "rejected" && (
                        <>
                          <div style={{ 
                            fontSize: "11px", 
                            color: "#dc3545", 
                            fontWeight: "bold",
                            marginBottom: "4px",
                            textAlign: "center"
                          }}>
                            Report Rejected
                          </div>
                          <button 
                            type="button"
                            style={{ 
                              padding: "6px 12px", 
                              backgroundColor: "#ffc107", 
                              color: "#000", 
                              border: "none", 
                              borderRadius: "4px",
                              cursor: "pointer",
                              fontSize: "12px"
                            }}
                            onClick={(e) => {
                              e.preventDefault();
                              e.stopPropagation();
                              handleReportAction(report.report_id, "revert", report.reportType);
                            }}
                          >
                            Revert to Pending
                          </button>
                        </>
                      )}
                      {report.approval_status === "restored" && (
                        <>
                          <div style={{ 
                            fontSize: "11px", 
                            color: "#ffc107", 
                            fontWeight: "bold",
                            marginBottom: "4px",
                            textAlign: "center"
                          }}>
                            Post Restored
                          </div>
                          <button 
                            type="button"
                            style={{ 
                              padding: "6px 12px", 
                              backgroundColor: "#28a745", 
                              color: "white", 
                              border: "none", 
                              borderRadius: "4px",
                              cursor: "pointer",
                              fontSize: "12px"
                            }}
                            onClick={(e) => {
                              e.preventDefault();
                              e.stopPropagation();
                              handleReportAction(report.report_id, "penalized", report.reportType);
                            }}
                          >
                            Re-penalize
                          </button>
                        </>
                      )}
                    </div>
                  </td>
                </tr>
              ))}
            </tbody>
          </table>
        </div>
      )}

      {imageModal.open && (
        <ImageModal 
          imageUrl={imageModal.imageUrl} 
          onClose={closeImageModal} 
        />
      )}
    </div>
  );
}