import React from "react";

export default function ClubReportTable({ reports, onPenalize, onWaive }) {
  return (
    <table className="request-table">
      <thead>
        <tr>
          <th>Club Name</th>
          <th>Sports</th>
          <th>Street Address</th>
          <th>Baranggay</th>
          <th>City</th>
          <th>Province</th>
          <th>Report Count</th>
          <th>Reasons</th>
          <th>Suspended Until</th>
          <th>Action</th>
        </tr>
      </thead>
      <tbody>
        {reports.length === 0 ? (
          <tr>
            <td colSpan="10" style={{ textAlign: "center", padding: "20px" }}>
              No reports found for the selected criteria
            </td>
          </tr>
        ) : (
          reports.map((report) => (
            <tr key={report.club_id || report.id}>
              <td>{report.club_name || "Unknown"}</td>
              <td>{report.sports || "Unknown"}</td>
              <td>{report.street_address || "Unknown"}</td>
              <td>{report.barrangay || "Unknown"}</td>
              <td>{report.city || "Unknown"}</td>
              <td>{report.province || "Unknown"}</td>
              <td>{report.reportCount}</td>
              <td>
                {report.reasons && report.reasons.length > 0 ? (
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
                  : "Active"}
              </td>
              <td>
                <button
                  className="accept-btn"
                  onClick={() => onPenalize(report.club_id || report.id)}
                >
                  Penalize
                </button>
                <button
                  className="decline-btn"
                  onClick={() => onWaive(report.user_id || report.club_id || report.organizer_id || report.team_id)}
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