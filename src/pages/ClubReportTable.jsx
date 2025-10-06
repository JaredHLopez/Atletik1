import React from "react";
import ReportTable from "../components/shared/ReportTable";

const CLUB_TABLE_COLUMNS = [
  {
    key: "club_name",
    title: "Club Name",
    render: (report) => report.club_name || "Unknown"
  },
  {
    key: "sports",
    title: "Sports",
    maxWidth: 150,
    render: (report) => (
      <div style={{ maxWidth: 150, overflowX: "auto" }}>
        {report.sports || "No sports"}
      </div>
    )
  },
  {
    key: "street_address",
    title: "Street Address",
    maxWidth: 200,
    render: (report) => (
      <div style={{ maxWidth: 200, overflowX: "auto" }}>
        {report.street_address || "No address"}
      </div>
    )
  },
  {
    key: "profile_image",
    title: "Profile Image",
    centerAlign: true,
    render: (report, { renderImageCell }) => {  
      const displayName = report.club_name || "Club";
      return renderImageCell(report, 'profile', displayName);
    }
  },
  {
    key: "background_image",
    title: "Background Image",
    centerAlign: true,
    render: (report, { renderImageCell }) => {
      const displayName = report.club_name || "Club";
      return renderImageCell(report, 'background', displayName);
    }
  },
  {
    key: "reportCount",
    title: "Report Count"
  },
  {
    key: "reasons",
    title: "Reasons"
  },
  {
    key: "suspended_until",
    title: "Suspended Until"
  },
  {
    key: "approval_status",
    title: "Status"
  }
];

const CLUB_IMAGE_CONFIG = {
  idField: "club_id",
  profileField: "profile_image",
  backgroundField: "background_image",
  profileBucket: "profile-images",
  backgroundBucket: "background-images"
};

export default function ClubReportTable({ reports, onPenalize, onReject, onRestore, buttonStyle }) {
  return (
    <ReportTable
      reports={reports}
      columns={CLUB_TABLE_COLUMNS}
      imageConfig={CLUB_IMAGE_CONFIG}
      onPenalize={onPenalize}
      onReject={onReject}
      onRestore={onRestore}
      buttonStyle={buttonStyle}
    />
  );
}
