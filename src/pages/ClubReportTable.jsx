import React from "react";

const statusColors = {
  pending: { background: "#fffbe6", color: "#b59f3b", border: "1px solid #ffe58f" },
  penalized: { background: "#e6ffed", color: "#389e0d", border: "1px solid #b7eb8f" },
  approved: { background: "#e6ffed", color: "#389e0d", border: "1px solid #b7eb8f" },
  rejected: { background: "#fff1f0", color: "#cf1322", border: "1px solid #ffa39e" }
};

function StatusBadge({ status }) {
  const style = {
    display: "inline-block",
    padding: "2px 12px",
    borderRadius: 12,
    fontSize: 13,
    fontWeight: 500,
    textTransform: "capitalize",
    ...statusColors[status] || statusColors["pending"]
  };
  return <span style={style}>{status}</span>;
}

export default function ClubReportTable({ reports, onPenalize, onWaive }) {
  const buttonStyle = {
    minWidth: 90,
    padding: "8px 0",
    fontSize: "14px"
  };

  return (
    <div style={{ overflowX: "auto" }}>
      <table style={{
        width: "100%",
        borderCollapse: "collapse",
        minWidth: 900,
        background: "#fff"
      }}>
        <thead>
          <tr>
            <th style={{ border: "1px solid #eee", padding: "10px 8px", background: "#fafafa", fontWeight: 600 }}>Club Name</th>
            <th style={{ border: "1px solid #eee", padding: "10px 8px", background: "#fafafa", fontWeight: 600, maxWidth: 150 }}>Sports</th>
            <th style={{ border: "1px solid #eee", padding: "10px 8px", background: "#fafafa", fontWeight: 600, maxWidth: 200 }}>Street Address</th>
            <th style={{ border: "1px solid #eee", padding: "10px 8px", background: "#fafafa", fontWeight: 600 }}>Report Count</th>
            <th style={{ border: "1px solid #eee", padding: "10px 8px", background: "#fafafa", fontWeight: 600 }}>Reasons</th>
            <th style={{ border: "1px solid #eee", padding: "10px 8px", background: "#fafafa", fontWeight: 600 }}>Suspended Until</th>
            <th style={{ border: "1px solid #eee", padding: "10px 8px", background: "#fafafa", fontWeight: 600 }}>Status</th>
            <th style={{ border: "1px solid #eee", padding: "10px 8px", background: "#fafafa", fontWeight: 600 }}>Actions</th>
          </tr>
        </thead>
        <tbody>
          {reports.length === 0 ? (
            <tr>
              <td colSpan="8" style={{ textAlign: "center", padding: "24px", color: "#888" }}>
                No reports found for the selected criteria
              </td>
            </tr>
          ) : (
            reports.map((report) => (
              <tr key={report.club_id}>
                <td style={{
                  border: "1px solid #eee",
                  padding: "8px 6px",
                  fontSize: 13,
                  maxWidth: 180,
                  overflowX: "auto",
                  whiteSpace: "nowrap"
                }}>
                  <div style={{ maxWidth: 180, overflowX: "auto" }}>
                    {report.club_name || "Unknown"}
                  </div>
                </td>
                <td style={{
                  border: "1px solid #eee",
                  padding: "8px 6px",
                  fontSize: 13,
                  maxWidth: 150,
                  overflowX: "auto",
                  whiteSpace: "nowrap"
                }}>
                  <div style={{ maxWidth: 150, overflowX: "auto" }}>
                    {report.sports || "Unknown"}
                  </div>
                </td>
                <td style={{
                  border: "1px solid #eee",
                  padding: "8px 6px",
                  fontSize: 13,
                  maxWidth: 200,
                  overflowX: "auto",
                  whiteSpace: "nowrap"
                }}>
                  <div style={{ maxWidth: 200, overflowX: "auto" }}>
                    {report.street_address || "Unknown"}
                  </div>
                </td>
                <td style={{ border: "1px solid #eee", padding: "8px 6px", fontSize: 13 }}>
                  {report.reportCount}
                </td>
                <td style={{ border: "1px solid #eee", padding: "8px 6px", fontSize: 13 }}>
                  {report.reasons && report.reasons.length > 0 ? (
                    <ul style={{ margin: 0, paddingLeft: 18 }}>
                      {report.reasons.map((reason, idx) => (
                        <li key={idx} style={{ fontSize: 13 }}>{reason}</li>
                      ))}
                    </ul>
                  ) : (
                    <span style={{ color: "#888" }}>No reasons</span>
                  )}
                </td>
                <td style={{ border: "1px solid #eee", padding: "8px 6px", fontSize: 13 }}>
                  {report.suspended_until
                    ? new Date(report.suspended_until).toLocaleString()
                    : "Active"}
                </td>
                <td style={{ border: "1px solid #eee", padding: "8px 6px", fontSize: 13 }}>
                  <StatusBadge status={report.approval_status || "pending"} />
                </td>
                <td style={{ border: "1px solid #eee", padding: "8px 6px", textAlign: "center" }}>
                  <div style={{ display: "flex", gap: 8, justifyContent: "center" }}>
                    <button
                      className="accept-btn"
                      style={{
                        ...buttonStyle,
                        background: "#52c41a",
                        color: "#fff",
                        border: "none",
                        borderRadius: 6,
                        cursor: "pointer"
                      }}
                      onClick={() => onPenalize(report.club_id)}
                    >
                      Penalize
                    </button>
                    <button
                      className="decline-btn"
                      style={{
                        ...buttonStyle,
                        background: "#cf1322",
                        color: "#fff",
                        border: "none",
                        borderRadius: 6,
                        cursor: "pointer"
                      }}
                      onClick={() => onWaive(report.club_id)}
                    >
                      Waive
                    </button>
                  </div>
                </td>
              </tr>
            ))
          )}
        </tbody>
      </table>
    </div>
  );
}