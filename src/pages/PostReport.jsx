import React, { useEffect, useState, useRef, useCallback } from "react";
import supabase from "../helper/supabaseClient";

// Constants (unchanged)
const TIME_FILTERS = [
  { label: "All Time", value: "all" },
  { label: "Today", value: "day" },
  { label: "This Week", value: "week" },
  { label: "This Month", value: "month" },
];

const STATUS_OPTIONS = [
  { label: "All Status", value: "all" },
  { label: "Pending", value: "pending" },
  { label: "Approved", value: "approved" },
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

// Main component
export default function PostReport() {
  // State (unchanged)
  const [reports, setReports] = useState([]);
  const [sortBy, setSortBy] = useState(DEFAULT_SORT);
  const [timeFilter, setTimeFilter] = useState(DEFAULT_TIME_FILTER);
  const [statusFilter, setStatusFilter] = useState(DEFAULT_STATUS_FILTER);
  const [reportTypeFilter, setReportTypeFilter] = useState(DEFAULT_REPORT_TYPE_FILTER);
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState(null);
  const [actionModal, setActionModal] = useState({ 
    open: false, 
    reportId: null, 
    postId: null, 
    action: "",
    reportType: null
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

  // Fetch reports function - FIXED with better error handling
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
            // Fetch related data separately with safe queries
            const postIds = practiceData.map(report => report.reported_id).filter(Boolean);
            const reporterIds = practiceData.map(report => report.flagger_id).filter(Boolean);
            
            let postsData = [];
            let reportersData = [];

            // Fetch practice posts
            if (postIds.length > 0) {
              const { data: posts, error: postsError } = await safeQueryByIds(
                "practice_posts", 
                "*", 
                postIds
              );
              
              if (!postsError && posts && posts.length > 0) {
                // Get unique user IDs from posts
                const postUserIds = posts.map(post => post.user_id).filter(Boolean);
                
                if (postUserIds.length > 0) {
                  const { data: postUsers, error: postUsersError } = await safeQueryByIds(
                    "users", 
                    "*", 
                    postUserIds
                  );
                  
                  if (!postUsersError) {
                    // Manually join users to posts
                    postsData = posts.map(post => ({
                      ...post,
                      users: postUsers?.find(user => user.id === post.user_id) || null
                    }));
                  } else {
                    console.error("Error fetching post users:", postUsersError);
                    postsData = posts;
                  }
                } else {
                  postsData = posts;
                }
              } else if (postsError) {
                console.error("Error fetching practice posts:", postsError);
              }
            }

            // Fetch reporters
            if (reporterIds.length > 0) {
              const { data: reporters, error: reportersError } = await safeQueryByIds(
                "users", 
                "*", 
                reporterIds
              );
              
              if (!reportersError) {
                reportersData = reporters || [];
              } else {
                console.error("Error fetching reporters:", reportersError);
              }
            }

            // Manually join the data
            practiceReports = practiceData.map(report => {
              const post = postsData.find(p => p.id === report.reported_id);
              const reporter = reportersData.find(u => u.id === report.flagger_id);
              
              return {
                ...report,
                post: post || null,
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
            // Fetch related data separately with safe queries
            const postIds = tournamentData.map(report => report.reported_id).filter(Boolean);
            const reporterIds = tournamentData.map(report => report.flagger_id).filter(Boolean);
            
            let postsData = [];
            let reportersData = [];

            // Fetch tournament posts
            if (postIds.length > 0) {
              const { data: posts, error: postsError } = await safeQueryByIds(
                "tournament_posts", 
                "*", 
                postIds
              );
              
              if (!postsError && posts && posts.length > 0) {
                // Get unique user IDs from posts
                const postUserIds = posts.map(post => post.user_id).filter(Boolean);
                
                if (postUserIds.length > 0) {
                  const { data: postUsers, error: postUsersError } = await safeQueryByIds(
                    "users", 
                    "*", 
                    postUserIds
                  );
                  
                  if (!postUsersError) {
                    // Manually join users to posts
                    postsData = posts.map(post => ({
                      ...post,
                      users: postUsers?.find(user => user.id === post.user_id) || null
                    }));
                  } else {
                    console.error("Error fetching post users:", postUsersError);
                    postsData = posts;
                  }
                } else {
                  postsData = posts;
                }
              } else if (postsError) {
                console.error("Error fetching tournament posts:", postsError);
              }
            }

            // Fetch reporters
            if (reporterIds.length > 0) {
              const { data: reporters, error: reportersError } = await safeQueryByIds(
                "users", 
                "*", 
                reporterIds
              );
              
              if (!reportersError) {
                reportersData = reporters || [];
              } else {
                console.error("Error fetching reporters:", reportersError);
              }
            }

            // Manually join the data
            tournamentReports = tournamentData.map(report => {
              const post = postsData.find(p => p.id === report.reported_id);
              const reporter = reportersData.find(u => u.id === report.flagger_id);
              
              return {
                ...report,
                post: post || null,
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

      // Filter out reports without posts (optional - you might want to keep them for debugging)
      const filteredReports = allReports; // Changed to keep all reports for debugging

      // Sort
      if (sortBy === "recent") {
        filteredReports.sort((a, b) => new Date(b.created_at) - new Date(a.created_at));
      } else if (sortBy === "oldest") {
        filteredReports.sort((a, b) => new Date(a.created_at) - new Date(b.created_at));
      }

      setReports(filteredReports);

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

  // Update report status (unchanged)
  const handleReportAction = useCallback(async (reportId, action, reportType) => {
    try {
      const tableName = reportType === "practice" ? "practice_post_reports" : "tournament_post_reports";
      
      const { error } = await supabase
        .from(tableName)
        .update({ approval_status: action })
        .eq("report_id", reportId);

      if (error) throw error;
      
      setError(null);
      await fetchReports();
    } catch (err) {
      console.error("Error updating report status:", err);
      setError("Failed to update report status");
    }
  }, [fetchReports]);

  // Hide/unhide post (unchanged)
  const handlePostVisibility = useCallback(async (postId, hide, postType) => {
    try {
      const tableName = postType === "practice" ? "practice_posts" : "tournament_posts";
      
      const { error } = await supabase
        .from(tableName)
        .update({ is_hidden: hide })
        .eq("id", postId);

      if (error) throw error;
      
      setError(null);
      await fetchReports();
    } catch (err) {
      console.error("Error updating post visibility:", err);
      setError("Failed to update post visibility");
    }
  }, [fetchReports]);

  // Delete post (unchanged)
  const handleDeletePost = useCallback(async (postId, postType) => {
    try {
      const tableName = postType === "practice" ? "practice_posts" : "tournament_posts";
      
      const { error } = await supabase
        .from(tableName)
        .delete()
        .eq("id", postId);

      if (error) throw error;
      
      setError(null);
      setActionModal({ open: false, reportId: null, postId: null, action: "", reportType: null });
      await fetchReports();
    } catch (err) {
      console.error("Error deleting post:", err);
      setError("Failed to delete post");
    }
  }, [fetchReports]);

  // Close modal (unchanged)
  const closeActionModal = useCallback(() => {
    setActionModal({ open: false, reportId: null, postId: null, action: "", reportType: null });
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

  // Add debug logging
  useEffect(() => {
    console.log("Reports data:", reports);
  }, [reports]);

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

      {/* Reports Table */}
      {loading ? (
        <p>Loading post reports...</p>
      ) : reports.length === 0 ? (
        <p>No post reports found.</p>
  ) : (
        // Detailed View
        <div style={{ overflowX: "auto" }}>
          <table style={{ 
            width: "100%", 
            borderCollapse: "collapse",
            border: "1px solid #ddd",
            minWidth: "800px"
          }}>
            <thead>
              <tr style={{ backgroundColor: "#f5f5f5" }}>
                <th style={{ padding: "12px", textAlign: "left", border: "1px solid #ddd" }}>Report ID</th>
                <th style={{ padding: "12px", textAlign: "left", border: "1px solid #ddd" }}>Post Type</th>
                <th style={{ padding: "12px", textAlign: "left", border: "1px solid #ddd" }}>Post Title</th>
                <th style={{ padding: "12px", textAlign: "left", border: "1px solid #ddd" }}>Post Author</th>
                <th style={{ padding: "12px", textAlign: "left", border: "1px solid #ddd" }}>Reporter</th>
                <th style={{ padding: "12px", textAlign: "left", border: "1px solid #ddd" }}>Reasons</th>
                <th style={{ padding: "12px", textAlign: "left", border: "1px solid #ddd" }}>Status</th>
                <th style={{ padding: "12px", textAlign: "left", border: "1px solid #ddd" }}>Reported At</th>
                <th style={{ padding: "12px", textAlign: "left", border: "1px solid #ddd" }}>Actions</th>
              </tr>
            </thead>
            <tbody>
              {reports.map((report) => (
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
                    {report.post?.is_hidden && (
                      <span style={{ color: "#dc3545", marginLeft: "8px", fontSize: "12px" }}>
                        (Hidden)
                      </span>
                    )}
                    {!report.post && (
                      <span style={{ color: "#dc3545", fontSize: "12px" }}>
                        (Post not found)
                      </span>
                    )}
                  </td>
                  <td style={{ padding: "12px", border: "1px solid #ddd" }}>
                    {report.post?.users?.name || report.post?.users?.username || "Unknown"}
                    <br />
                    <small style={{ color: "#666" }}>{report.post?.users?.email}</small>
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
                        report.approval_status === "approved" ? "#d4edda" :
                        report.approval_status === "rejected" ? "#f8d7da" :
                        "#fff3cd",
                      color: 
                        report.approval_status === "approved" ? "#155724" :
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
                            onClick={() => handleReportAction(report.report_id, "approved", report.reportType)}
                          >
                            Approve
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
                      
                      {report.post && (
                        <>
                          <button 
                            style={{ 
                              padding: "6px 12px", 
                              backgroundColor: report.post.is_hidden ? "#17a2b8" : "#ffc107", 
                              color: "white", 
                              border: "none", 
                              borderRadius: "4px",
                              cursor: "pointer",
                              fontSize: "12px"
                            }}
                            onClick={() => handlePostVisibility(report.post.id, !report.post.is_hidden, report.reportType)}
                          >
                            {report.post.is_hidden ? "Unhide Post" : "Hide Post"}
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
                            onClick={() => setActionModal({ 
                              open: true, 
                              reportId: report.report_id, 
                              postId: report.post.id, 
                              action: "delete",
                              reportType: report.reportType
                            })}
                          >
                            Delete Post
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

      {/* Delete Confirmation Modal (unchanged) */}
      {actionModal.open && actionModal.action === "delete" && (
        <div style={{
          position: "fixed", 
          top: 0, 
          left: 0, 
          width: "100vw", 
          height: "100vh",
          background: "rgba(0,0,0,0.3)", 
          display: "flex", 
          alignItems: "center", 
          justifyContent: "center",
          zIndex: 1000
        }}>
          <div style={{ 
            background: "#fff", 
            padding: "24px", 
            borderRadius: "8px", 
            minWidth: "320px",
            boxShadow: "0 4px 6px rgba(0,0,0,0.1)"
          }}>
            <h3 style={{ marginTop: 0 }}>Confirm Delete</h3>
            <p>Are you sure you want to delete this post? This action cannot be undone.</p>
            <div style={{ display: "flex", gap: "8px" }}>
              <button
                style={{ 
                  padding: "8px 16px", 
                  backgroundColor: "#dc3545", 
                  color: "white", 
                  border: "none", 
                  borderRadius: "4px",
                  cursor: "pointer"
                }}
                onClick={() => {
                  handleDeletePost(actionModal.postId, actionModal.reportType);
                }}
              >
                Delete
              </button>
              <button 
                style={{ 
                  padding: "8px 16px", 
                  backgroundColor: "#6c757d", 
                  color: "white", 
                  border: "none", 
                  borderRadius: "4px",
                  cursor: "pointer"
                }}
                onClick={closeActionModal}
              >
                Cancel
              </button>
            </div>
          </div>
        </div>
      )}
    </div>
  );
}