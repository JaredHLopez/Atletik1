import React, { useEffect, useState, useRef, useCallback } from "react";
import supabase from "../helper/supabaseClient";

// Constants (updated)
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
];

// Default values (unchanged)
const DEFAULT_SORT = "recent";
const DEFAULT_TIME_FILTER = "all";
const DEFAULT_STATUS_FILTER = "all";
const DEFAULT_REPORT_TYPE_FILTER = "all";

// Helper functions (unchanged)
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

// Dropdown component (unchanged)
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

// Enhanced Image Modal Component with loading state
function ImageModal({ imageUrl, onClose }) {
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState(false);

  useEffect(() => {
    if (imageUrl) {
      setLoading(true);
      setError(false);
      
      // Preload the image
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
  // State - removed actionModal state
  const [reports, setReports] = useState([]);
  const [sortBy, setSortBy] = useState(DEFAULT_SORT);
  const [timeFilter, setTimeFilter] = useState(DEFAULT_TIME_FILTER);
  const [statusFilter, setStatusFilter] = useState(DEFAULT_STATUS_FILTER);
  const [reportTypeFilter, setReportTypeFilter] = useState(DEFAULT_REPORT_TYPE_FILTER);
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState(null);

  // Add image modal state
  const [imageModal, setImageModal] = useState({
    open: false,
    imageUrl: null
  });

  // Dropdown states (unchanged)
  const [typeDropdownOpen, setTypeDropdownOpen] = useState(false);
  const [sortDropdownOpen, setSortDropdownOpen] = useState(false);
  const [timeDropdownOpen, setTimeDropdownOpen] = useState(false);
  const [statusDropdownOpen, setStatusDropdownOpen] = useState(false);

  // Refs (unchanged)
  const typeDropdownRef = useRef(null);
  const sortDropdownRef = useRef(null);
  const timeDropdownRef = useRef(null);
  const statusDropdownRef = useRef(null);

  // Reset all filters to default (unchanged)
  const resetFilters = useCallback(() => {
    setSortBy(DEFAULT_SORT);
    setTimeFilter(DEFAULT_TIME_FILTER);
    setStatusFilter(DEFAULT_STATUS_FILTER);
    setReportTypeFilter(DEFAULT_REPORT_TYPE_FILTER);
  }, []);

  // Helper function to safely query by IDs
  const safeQueryByIds = async (table, selectClause, ids, idColumn = 'id') => {
    if (!ids || ids.length === 0) {
      return { data: [], error: null };
    }

    // Remove duplicates and filter out null/undefined values
    const uniqueIds = [...new Set(ids.filter(Boolean))];
    
    if (uniqueIds.length === 0) {
      return { data: [], error: null };
    }

    let query = supabase.from(table).select(selectClause);
    
    if (uniqueIds.length === 1) {
      query = query.eq(idColumn, uniqueIds[0]);
    } else {
      query = query.in(idColumn, uniqueIds);
    }
    
    return await query;
  };

  // Enhanced Helper function to get full image URL
  const getImageUrl = (imagePath) => {
    if (!imagePath || imagePath === "no image") return null;
    
    // If it's already a full URL, return as is
    if (imagePath.startsWith('http://') || imagePath.startsWith('https://')) {
      return imagePath;
    }
    
    // If it's a Supabase storage path, construct the full URL
    // This is the most likely format for your image paths
    if (imagePath.includes('/')) {
      // Extract bucket name and path
      const parts = imagePath.split('/');
      if (parts.length >= 2) {
        const bucketName = parts[0];
        const filePath = parts.slice(1).join('/');
        return `${supabase.storage.from(bucketName).getPublicUrl(filePath).data.publicUrl}`;
      }
    }
    
    // Default fallback for other cases
    return imagePath;
  };

  // Fetch reports function - UPDATED to get title from posts
  const fetchReports = useCallback(async () => {
    try {
      setLoading(true);
      setError(null);

      // Build time filter
      const fromDate = getTimeFilter(timeFilter);

      let practiceReports = [];
      let tournamentReports = [];

      // Fetch from practice_post_reports
      if (reportTypeFilter === "all" || reportTypeFilter === "practice") {
        try {
          let practiceQuery = supabase
            .from("practice_post_reports")
            .select(`*`);

          if (fromDate) {
            practiceQuery = practiceQuery.gte("created_at", fromDate.toISOString());
          }

          if (statusFilter !== "all") {
            practiceQuery = practiceQuery.eq("approval_status", statusFilter);
          }

          const { data: practiceData, error: practiceError } = await practiceQuery;
          
          if (practiceError) {
            console.error("Error fetching practice reports:", practiceError);
          } else if (practiceData && practiceData.length > 0) {
            // Get all practice post IDs from reports
            const practicePostIds = practiceData.map(report => report.reported_id).filter(Boolean);
            
            // Fetch practice posts data - UPDATED to include title
            let practicePostsData = [];
            if (practicePostIds.length > 0) {
              const { data: practicePosts, error: practicePostsError } = await safeQueryByIds(
                "practice_posts", 
                "practice_id, title, caption, host_name", // Added title column
                practicePostIds,
                "practice_id"
              );
              
              if (!practicePostsError && practicePosts) {
                practicePostsData = practicePosts;
              } else {
                console.error("Error fetching practice posts:", practicePostsError);
              }
            }

            // Fetch reporter data
            const reporterIds = practiceData.map(report => report.flagger_id).filter(Boolean);
            let reportersData = [];
            
            if (reporterIds.length > 0) {
              const { data: reporters, error: reportersError } = await safeQueryByIds(
                "users", 
                "id, name, username, email", 
                reporterIds
              );
              
              if (!reportersError && reporters) {
                reportersData = reporters;
              } else {
                console.error("Error fetching reporters:", reportersError);
              }
            }

            // Combine report data with post and reporter data
            practiceReports = practiceData.map(report => {
              const post = practicePostsData.find(p => p.practice_id === report.reported_id);
              const reporter = reportersData.find(u => u.id === report.flagger_id);
              
              return {
                ...report,
                post: post ? {
                  id: post.practice_id,
                  title: post.title || `Practice Post ${post.practice_id}`, // Use title from DB
                  content: post.caption,
                  author: post.host_name,
                  image: "no image", // As requested for practice posts
                  type: "practice"
                } : null,
                reporter: reporter || null,
                reportType: "practice"
              };
            });
          }
        } catch (err) {
          console.error("Error in practice reports section:", err);
        }
      }

      // Fetch from tournament_post_reports
      if (reportTypeFilter === "all" || reportTypeFilter === "tournament") {
        try {
          let tournamentQuery = supabase
            .from("tournament_post_reports")
            .select(`*`);

          if (fromDate) {
            tournamentQuery = tournamentQuery.gte("created_at", fromDate.toISOString());
          }

          if (statusFilter !== "all") {
            tournamentQuery = tournamentQuery.eq("approval_status", statusFilter);
          }

          const { data: tournamentData, error: tournamentError } = await tournamentQuery;
          
          if (tournamentError) {
            console.error("Error fetching tournament reports:", tournamentError);
          } else if (tournamentData && tournamentData.length > 0) {
            // Get all tournament post IDs from reports
            const tournamentPostIds = tournamentData.map(report => report.reported_id).filter(Boolean);
            
            // Fetch tournament posts data - UPDATED to include title
            let tournamentPostsData = [];
            if (tournamentPostIds.length > 0) {
              const { data: tournamentPosts, error: tournamentPostsError } = await safeQueryByIds(
                "tournament_posts", 
                "tournament_id, title, caption, poster_image, host_name", // Added title column
                tournamentPostIds,
                "tournament_id"
              );
              
              if (!tournamentPostsError && tournamentPosts) {
                tournamentPostsData = tournamentPosts;
              } else {
                console.error("Error fetching tournament posts:", tournamentPostsError);
              }
            }

            // Fetch reporter data
            const reporterIds = tournamentData.map(report => report.flagger_id).filter(Boolean);
            let reportersData = [];
            
            if (reporterIds.length > 0) {
              const { data: reporters, error: reportersError } = await safeQueryByIds(
                "users", 
                "id, name, username, email", 
                reporterIds
              );
              
              if (!reportersError && reporters) {
                reportersData = reporters;
              } else {
                console.error("Error fetching reporters:", reportersError);
              }
            }

            // Combine report data with post and reporter data
            tournamentReports = tournamentData.map(report => {
              const post = tournamentPostsData.find(p => p.tournament_id === report.reported_id);
              const reporter = reportersData.find(u => u.id === report.flagger_id);
              
              return {
                ...report,
                post: post ? {
                  id: post.tournament_id,
                  title: post.title || `Tournament Post ${post.tournament_id}`, // Use title from DB
                  content: post.caption,
                  author: post.host_name,
                  image: post.poster_image, // This should contain the image URL/path
                  type: "tournament"
                } : null,
                reporter: reporter || null,
                reportType: "tournament"
              };
            });
          }
        } catch (err) {
          console.error("Error in tournament reports section:", err);
        }
      }

      // Combine reports
      const allReports = [...practiceReports, ...tournamentReports];

      // Sort
      if (sortBy === "recent") {
        allReports.sort((a, b) => new Date(b.created_at) - new Date(a.created_at));
      } else if (sortBy === "oldest") {
        allReports.sort((a, b) => new Date(a.created_at) - new Date(b.created_at));
      }

      setReports(allReports);

    } catch (err) {
      console.error("Error fetching post reports:", err);
      setError(err.message || "Failed to fetch post reports");
      setReports([]);
    } finally {
      setLoading(false);
    }
  }, [sortBy, timeFilter, statusFilter, reportTypeFilter]);

  // Handle refresh button click (unchanged)
  const handleRefresh = useCallback(() => {
    resetFilters();
  }, [resetFilters]);

  // Update report status and handle post removal - UPDATED to use "penalized" instead of "Approved"
  const handleReportAction = useCallback(async (reportId, action, reportType) => {
    try {
      const reportTableName = reportType === "practice" ? "practice_post_reports" : "tournament_post_reports";
      
      // Update the report status - changed from "Approved" to "penalized"
      const { error: reportError } = await supabase
        .from(reportTableName)
        .update({ approval_status: action })
        .eq("report_id", reportId);

      if (reportError) throw reportError;

      // If penalizing a tournament report, also update the tournament post
      if (action === "penalized" && reportType === "tournament") { // Changed from "Approved" to "penalized"
        // First get the reported post ID from the report
        const { data: reportData, error: getReportError } = await supabase
          .from(reportTableName)
          .select("reported_id")
          .eq("report_id", reportId)
          .single();

        if (getReportError) {
          console.error("Error getting report data:", getReportError);
        } else if (reportData?.reported_id) {
          // Update the tournament post to mark it as removed by admin
          const { error: postError } = await supabase
            .from("tournament_posts")
            .update({ removed_by_atletik_admin: true })
            .eq("tournament_id", reportData.reported_id);

          if (postError) {
            console.error("Error updating tournament post:", postError);
            // Don't throw here - the report was still updated successfully
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

  // Close image modal
  const closeImageModal = useCallback(() => {
    setImageModal({ open: false, imageUrl: null });
  }, []);

  // Effects (unchanged)
  useEffect(() => {
    fetchReports();
  }, [fetchReports]);

  // Handle outside click for dropdowns (unchanged)
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

  // Helper function to truncate text
  const truncateText = (text, maxLength = 100) => {
    if (!text) return "No content";
    if (text.length <= maxLength) return text;
    return text.substring(0, maxLength) + "...";
  };

  return (
    <div style={{ minHeight: "500px", padding: "20px", fontFamily: "Arial, sans-serif" }}>
      <h2 style={{ marginBottom: "20px" }}>Post Reports</h2>
      
      {/* Controls (unchanged) */}
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

      {/* Error display (unchanged) */}
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

      {/* Debug info */}
      {!loading && (
        <div style={{ marginBottom: "10px", color: "#666", fontSize: "14px" }}>
          Showing {reports.length} report(s)
        </div>
      )}

      {/* Reports Table - Removed Hide/Delete Post functionality */}
      {loading ? (
        <p>Loading post reports...</p>
      ) : reports.length === 0 ? (
        <p>No post reports found.</p>
      ) : (
        // Detailed View with Post Content Column
        <div style={{ overflowX: "auto" }}>
          <table style={{ 
            width: "100%", 
            borderCollapse: "collapse",
            border: "1px solid #ddd",
            minWidth: "1200px" // Increased for additional column
          }}>
            <thead>
              <tr style={{ backgroundColor: "#f5f5f5" }}>
                <th style={{ padding: "12px", textAlign: "left", border: "1px solid #ddd" }}>Report ID</th>
                <th style={{ padding: "12px", textAlign: "left", border: "1px solid #ddd" }}>Post Type</th>
                <th style={{ padding: "12px", textAlign: "left", border: "1px solid #ddd" }}>Post Title</th>
                <th style={{ padding: "12px", textAlign: "left", border: "1px solid #ddd", minWidth: "200px" }}>Post</th>
                <th style={{ padding: "12px", textAlign: "left", border: "1px solid #ddd" }}>Post Image</th>
                <th style={{ padding: "12px", textAlign: "left", border: "1px solid #ddd" }}>Post Author</th>
                <th style={{ padding: "12px", textAlign: "left", border: "1px solid #ddd" }}>Reporter</th>
                <th style={{ padding: "12px", textAlign: "left", border: "1px solid #ddd" }}>Reasons</th>
                <th style={{ padding: "12px", textAlign: "left", border: "1px solid #ddd" }}>Status</th>
                <th style={{ padding: "12px", textAlign: "left", border: "1px solid #ddd" }}>Reported At</th>
                <th style={{ padding: "12px", textAlign: "left", border: "1px solid #ddd" }}>Actions</th>
              </tr>
            </thead>
            <tbody>
              {reports.map((report) => {
                
                return (
                  <tr key={report.report_id} style={{ borderBottom: "1px solid #ddd" }}>
                    <td style={{ padding: "12px", border: "1px solid #ddd", fontSize: "12px" }}>
                      {report.report_id?.substring(0, 8)}...
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
                      {!report.post && (
                        <span style={{ color: "#dc3545", fontSize: "12px" }}>
                          (Post not found)
                        </span>
                      )}
                    </td>
                    {/* POST CONTENT COLUMN */}
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
                            alert(report.post.content); // Simple modal - you can replace with a proper modal
                          }}
                        >
                          View Full
                        </button>
                      )}
                    </td>
                    {/* ENHANCED POST IMAGE COLUMN */}
                    <td style={{ padding: "12px", border: "1px solid #ddd" }}>
                      {report.reportType === "practice" ? (
                        // Always show "No Image" for practice reports
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
                        // For tournament reports, try to show the image
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
                              {/* Fallback div that shows when image fails to load */}
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
                              {/* Zoom indicator */}
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
                            // Show "No Image" for tournament reports without images
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
                    <td style={{ padding: "12px", border: "1px solid #ddd" }}>
                      {report.reporter?.name || report.reporter?.username || "Unknown"}
                      <br />
                      <small style={{ color: "#666" }}>{report.reporter?.email}</small>
                    </td>
                    <td style={{ padding: "12px", border: "1px solid #ddd" }}>
                      <ul style={{ margin: 0, paddingLeft: "20px", fontSize: "14px" }}>
                        {report.reason && report.reason.map((reason, idx) => (
                          <li key={idx}>{reason}</li>
                        ))}
                      </ul>
                    </td>
                    <td style={{ padding: "12px", border: "1px solid #ddd" }}>
                      <span style={{
                        padding: "4px 8px",
                        borderRadius: "4px",
                        fontSize: "12px",
                        fontWeight: "bold",
                        backgroundColor: 
                          report.approval_status === "penalized" ? "#d4edda" : // Changed from "Approved" to "penalized"
                          report.approval_status === "rejected" ? "#f8d7da" :
                          "#fff3cd",
                        color: 
                          report.approval_status === "penalized" ? "#155724" : // Changed from "Approved" to "penalized"
                          report.approval_status === "rejected" ? "#721c24" :
                          "#856404"
                      }}>
                        {report.approval_status}
                      </span>
                    </td>
                    <td style={{ padding: "12px", border: "1px solid #ddd" }}>
                      {new Date(report.created_at).toLocaleString()}
                    </td>
                    <td style={{ padding: "12px", border: "1px solid #ddd" }}>
                      <div style={{ display: "flex", flexDirection: "column", gap: "8px" }}>
                        {report.approval_status === "pending" && (
                          <>
                            <button 
                              style={{ 
                                padding: "6px 12px", 
                                backgroundColor: "#28a745", 
                                color: "white", 
                                border: "none", 
                                borderRadius: "4px",
                                cursor: "pointer",
                                fontSize: "12px"
                              }}
                              onClick={() => handleReportAction(report.report_id, "penalized", report.reportType)} // Changed from "Approved" to "penalized"
                            >
                              Penalize
                            </button>
                            <button 
                              style={{ 
                                padding: "6px 12px", 
                                backgroundColor: "#dc3545", 
                                color: "white", 
                                border: "none", 
                                borderRadius: "4px",
                                cursor: "pointer",
                                fontSize: "12px"
                              }}
                              onClick={() => handleReportAction(report.report_id, "rejected", report.reportType)}
                            >
                              Reject
                            </button>
                          </>
                        )}
                      </div>
                    </td>
                  </tr>
                );
              })}
            </tbody>
          </table>
        </div>
      )}

      {/* Debug Info for Development */}
      {process.env.NODE_ENV === 'development' && (
        <details style={{ marginTop: '20px', padding: '10px', background: '#f5f5f5' }}>
          <summary>Debug Info (Dev only)</summary>
          <div>
            {reports.map((report, index) => (
              <div key={index} style={{ marginBottom: '10px' }}>
                <strong>Report {index}:</strong> {report.post?.image} → 
                <strong>URL:</strong> {getImageUrl(report.post?.image)}
              </div>
            ))}
          </div>
        </details>
      )}

      {/* Image Modal */}
      {imageModal.open && (
        <ImageModal 
          imageUrl={imageModal.imageUrl} 
          onClose={closeImageModal} 
        />
      )}
    </div>
  );
}