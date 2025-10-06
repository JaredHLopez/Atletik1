import React from "react";
import ReportTable from "../components/shared/ReportTable";

const USER_TABLE_COLUMNS = [
  {
    key: "username",
    title: "Username",
    render: (report) => report.username || "Unknown"
  },
  {
    key: "intro",
    title: "Intro",
    maxWidth: 150,
    render: (report) => (
      <div style={{ maxWidth: 150, overflowX: "auto" }}>
        {report.intro || "No intro"}
      </div>
    )
  },
  {
    key: "bio",
    title: "Bio",
    maxWidth: 200,
    render: (report) => (
      <div style={{ maxWidth: 200, overflowX: "auto" }}>
        {report.bio || "No bio"}
      </div>
    )
  },
  {
    key: "profile_image",
    title: "Profile Image",
    centerAlign: true,
    render: (report, { renderImageCell }) => {
      const displayName = report.username || "User";
      return renderImageCell(report, 'profile', displayName);
    }
  },
  {
    key: "background_image",
    title: "Background Image",
    centerAlign: true,
    render: (report, { renderImageCell }) => {
      const displayName = report.username || "User";
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

const USER_IMAGE_CONFIG = {
  idField: "user_id",
  profileField: "profile_image",
  backgroundField: "background_image",
  profileBucket: "profile-images",
  backgroundBucket: "background-images"
};

export default function UserReportTable({ reports, onPenalize, onReject, onRestore, buttonStyle }) {
  return (
    <ReportTable
      reports={reports}
      columns={USER_TABLE_COLUMNS}
      imageConfig={USER_IMAGE_CONFIG}
      onPenalize={onPenalize}
      onReject={onReject}
      onRestore={onRestore}
      buttonStyle={buttonStyle}
    />
  );
}