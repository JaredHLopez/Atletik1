import React from "react";
import ReportTable from "../components/shared/ReportTable";

const TEAM_TABLE_COLUMNS = [
  {
    key: "team_name",
    title: "Team Name",
    maxWidth: 180,
    render: (report) => (
      <div style={{ maxWidth: 180, overflowX: "auto" }}>
        {report.team_name || "Unknown"}
      </div>
    )
  },
  {
    key: "sports",
    title: "Sports",
    maxWidth: 150,
    render: (report) => (
      <div style={{ maxWidth: 150, overflowX: "auto" }}>
        {report.sports || "Unknown"}
      </div>
    )
  },
  {
    key: "street_address",
    title: "Street Address",
    maxWidth: 200,
    render: (report) => (
      <div style={{ maxWidth: 200, overflowX: "auto" }}>
        {report.street_address || "Unknown"}
      </div>
    )
  },
  {
    key: "intro",
    title: "Intro",
    render: (report) => report.intro || "No intro"
  },
  {
    key: "bio",
    title: "Bio",
    render: (report) => report.bio || "No bio"
  },
  {
    key: "profile_image",
    title: "Profile Image",
    centerAlign: true,
    render: (report, { renderImageCell }) => {
      const displayName = report.team_name || "Team";
      return renderImageCell(report, 'profile', displayName);
    }
  },
  {
    key: "background_image",
    title: "Background Image",
    centerAlign: true,
    render: (report, { renderImageCell }) => {
      const displayName = report.team_name || "Team";
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

const TEAM_IMAGE_CONFIG = {
  idField: "team_id",
  profileField: "profile_image",
  backgroundField: "background_image",
  profileBucket: "profile-images",
  backgroundBucket: "background-images"
};

export default function TeamReportTable({ reports, onPenalize, onReject, onRestore, buttonStyle }) {
  const defaultButtonStyle = {
    minWidth: 90,
    padding: "8px 0",
    fontSize: "14px"
  };

  return (
    <ReportTable
      reports={reports}
      columns={TEAM_TABLE_COLUMNS}
      imageConfig={TEAM_IMAGE_CONFIG}
      onPenalize={onPenalize}
      onReject={onReject}
      onRestore={onRestore}
      buttonStyle={buttonStyle || defaultButtonStyle}
    />
  );
}