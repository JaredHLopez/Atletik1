import React, { useEffect, useState } from "react";
import supabase from "../helper/supabaseClient";

const TIME_FILTERS = [
  { label: "All Time", value: "all" },
  { label: "Today", value: "day" },
  { label: "This Week", value: "week" },
  { label: "This Month", value: "month" },
];

const STATUS_OPTIONS = [
  { label: "Status", value: "all" },
  { label: "Pending", value: "pending" },
  { label: "Approved", value: "approved" },
  { label: "Rejected", value: "rejected" },
];

const REPORT_TYPE_OPTIONS = [
  { label: "All Reports", value: "all" },
  { label: "Practice Reports", value: "practice" },
  { label: "Tournament Reports", value: "tournament" },
];

export default function PostReport() {
  const [reports, setReports] = useState([]);
  const [sortBy, setSortBy] = useState("recent");
  const [timeFilter, setTimeFilter] = useState("all");
  const [statusFilter, setStatusFilter] = useState("all");
  const [reportTypeFilter, setReportTypeFilter] = useState("all");
  const [loading, setLoading] = useState(false);
  const [actionModal, setActionModal] = useState({ 
    open: false, 
    reportId: null, 
    postId: null, 
    action: "" 
  });

  useEffect(() => {
    fetchReports();
  }, [sortBy, timeFilter, statusFilter, reportTypeFilter]);

  async function fetchReports() {
    setLoading(true);

    // Build time filter
    let fromDate = null;
    if (timeFilter === "day") {
      fromDate = new Date();
      fromDate.setHours(0, 0, 0, 0);
    } else if (timeFilter === "week") {
      fromDate = new Date();
      fromDate.setDate(fromDate.getDate() - 7);
    } else if (timeFilter === "month") {
      fromDate = new Date();
      fromDate.setMonth(fromDate.getMonth() - 1);
    }

    // Build query
    let query = supabase
      .from("post_reports")
      .select(`
        report_id,
        reported_id,
        flagger_id,
        reason,
        approval_status,
        created_at,
        posts!post_reports_reported_id_fkey (
          id,
          title,
          content,
          user_id,
          is_hidden,
          post_type,
          users:user_id (id, name, email)
        ),
        reporters:flagger_id (id, name, email)
      `);

    if (fromDate) {
      query = query.gte("created_at", fromDate.toISOString());
    }

    if (statusFilter !== "all") {
      query = query.eq("approval_status", statusFilter);
    }

    const { data, error } = await query;
    if (error) {
      console.error("Error fetching post reports:", error);
      setReports([]);
      setLoading(false);
      return;
    }

    // Filter by report type (practice/tournament)
    let filteredData = data;
    if (reportTypeFilter !== "all") {
      filteredData = data.filter(report => {
        // Check if the post exists and has the post_type property
        if (report.posts && report.posts.post_type) {
          return report.posts.post_type === reportTypeFilter;
        }
        return false;
      });
    }

    // Process data
    const processedReports = filteredData.map(report => ({
      ...report,
      post: report.posts,
      reporter: report.reporters
    }));

    // Sort
    if (sortBy === "recent") {
      processedReports.sort((a, b) => new Date(b.created_at) - new Date(a.created_at));
    } else if (sortBy === "oldest") {
      processedReports.sort((a, b) => new Date(a.created_at) - new Date(b.created_at));
    }

    setReports(processedReports);
    setLoading(false);
  }

  // Update report status
  async function handleReportAction(reportId, action) {
    const { error } = await supabase
      .from("post_reports")
      .update({ approval_status: action })
      .eq("report_id", reportId);

    if (error) {
      console.error("Error updating report status:", error);
    } else {
      fetchReports();
    }
  }

  // Hide/unhide post
  async function handlePostVisibility(postId, hide) {
    const { error } = await supabase
      .from("posts")
      .update({ is_hidden: hide })
      .eq("id", postId);

    if (error) {
      console.error("Error updating post visibility:", error);
    } else {
      fetchReports();
    }
  }

  // Delete post
  async function handleDeletePost(postId) {
    const { error } = await supabase
      .from("posts")
      .delete()
      .eq("id", postId);

    if (error) {
      console.error("Error deleting post:", error);
    } else {
      fetchReports();
    }
  }

  return (
    <div style={{ padding: "20px", fontFamily: "Arial, sans-serif" }}>
      <h2 style={{ marginBottom: "20px" }}>Post Reports</h2>
      
      {/* Filters */}
      <div style={{ 
        display: "flex", 
        gap: "16px", 
        marginBottom: "20px",
        alignItems: "center",
        flexWrap: "wrap"
      }}>
        <select 
          value={sortBy} 
          onChange={e => setSortBy(e.target.value)}
          style={{ padding: "8px", borderRadius: "4px", border: "1px solid #ddd" }}
        >
          <option value="recent">Sort by Most Recent</option>
          <option value="oldest">Sort by Oldest</option>
        </select>
        
        <select 
          value={timeFilter} 
          onChange={e => setTimeFilter(e.target.value)}
          style={{ padding: "8px", borderRadius: "4px", border: "1px solid #ddd" }}
        >
          {TIME_FILTERS.map(f => (
            <option key={f.value} value={f.value}>{f.label}</option>
          ))}
        </select>
        
        <select 
          value={statusFilter} 
          onChange={e => setStatusFilter(e.target.value)}
          style={{ padding: "8px", borderRadius: "4px", border: "1px solid #ddd" }}
        >
          {STATUS_OPTIONS.map(option => (
            <option key={option.value} value={option.value}>{option.label}</option>
          ))}
        </select>
        
        {/* Report Type Filter */}
        <select 
          value={reportTypeFilter} 
          onChange={e => setReportTypeFilter(e.target.value)}
          style={{ padding: "8px", borderRadius: "4px", border: "1px solid #ddd" }}
        >
          {REPORT_TYPE_OPTIONS.map(option => (
            <option key={option.value} value={option.value}>{option.label}</option>
          ))}
        </select>
        
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
                    {report.report_id.substring(0, 8)}...
                  </td>
                  <td style={{ padding: "12px", border: "1px solid #ddd" }}>
                    <span style={{
                      padding: "4px 8px",
                      borderRadius: "4px",
                      fontSize: "12px",
                      fontWeight: "bold",
                      backgroundColor: 
                        report.post?.post_type === "tournament" ? "#e9ecef" : "#f8f9fa",
                      color: "#495057",
                      textTransform: "capitalize"
                    }}>
                      {report.post?.post_type || "unknown"}
                    </span>
                  </td>
                  <td style={{ padding: "12px", border: "1px solid #ddd" }}>
                    {report.post?.title || "Unknown Post"}
                    {report.post?.is_hidden && (
                      <span style={{ color: "#dc3545", marginLeft: "8px", fontSize: "12px" }}>
                        (Hidden)
                      </span>
                    )}
                  </td>
                  <td style={{ padding: "12px", border: "1px solid #ddd" }}>
                    {report.post?.users?.name || "Unknown"}
                    <br />
                    <small style={{ color: "#666" }}>{report.post?.users?.email}</small>
                  </td>
                  <td style={{ padding: "12px", border: "1px solid #ddd" }}>
                    {report.reporter?.name || "Unknown"}
                    <br />
                    <small style={{ color: "##666" }}>{report.reporter?.email}</small>
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
                            onClick={() => handleReportAction(report.report_id, "approved")}
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
                            onClick={() => handleReportAction(report.report_id, "rejected")}
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
                            onClick={() => handlePostVisibility(report.post.id, !report.post.is_hidden)}
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
                              action: "delete" 
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

      {/* Delete Confirmation Modal */}
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
                  handleDeletePost(actionModal.postId);
                  setActionModal({ open: false, reportId: null, postId: null, action: "" });
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
                onClick={() => setActionModal({ open: false, reportId: null, postId: null, action: "" })}
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