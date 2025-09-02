import React from "react";

export default function UserReportTable({ reports, onPenalize, onWaive }) {
  return (
    <table className="request-table">
      <thead>
        <tr>
          <th>Username</th>
          <th>Intro</th>
          <th>Bio</th>
          <th>Report Count</th>
          <th>Reasons</th>
          <th>Suspended Until</th>
          <th>Action</th>
        </tr>
      </thead>
      <tbody>
        {reports.length === 0 ? (
          <tr>
            <td colSpan="7" style={{ textAlign: "center", padding: "20px" }}>
              No reports found for the selected criteria
            </td>
          </tr>
        ) : (
          reports.map((report) => (
            <tr key={report.user_id}>
              <td>{report.username || "Unknown"}</td>
              <td style={{ maxWidth: "150px", wordWrap: "break-word" }}>
                {report.intro || "No intro"}
              </td>
              <td style={{ maxWidth: "200px", wordWrap: "break-word" }}>
                {report.bio || "No bio"}
              </td>
              <td>{report.reportCount}</td>
              <td>
                {report.reasons.length > 0 ? (
                  <ul style={{ margin: 0, paddingLeft: 20 }}>
                    {report.reasons.map((reason, idx) => (
                      <li key={idx}>{reason}</li>
                    ))}
                  </ul>
                ) : (
                  "No reasons provided"
                )}
              </td>
              <td>
                {report.suspended_until 
                  ? new Date(report.suspended_until).toLocaleString() 
                  : "Active"
                }
              </td>
              <td>
                <button 
                  className="accept-btn" 
                  onClick={() => onPenalize(report.user_id)}
                >
                  Penalize
                </button>
                <button 
                  className="decline-btn" 
                  onClick={() => onWaive(report.user_id)}
                >
                  Waive
                </button>
              </td>
            </tr>
          ))
        )}
      </tbody>
    </table>
  );
}