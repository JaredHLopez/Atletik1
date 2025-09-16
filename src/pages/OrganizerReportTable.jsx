import React from "react";
import ReportTable from "../components/shared/ReportTable";

const ORGANIZER_TABLE_COLUMNS = [
  {
    key: "username",
    title: "Username",
    maxWidth: 180,
    render: (report) => (
      <div style={{ maxWidth: 180, overflowX: "auto" }}>
        {report.username || "Unknown"}
      </div>
    )
  },
  {
    key: "suffix",
    title: "Suffix",
    maxWidth: 150,
    render: (report) => (
      <div style={{ maxWidth: 150, overflowX: "auto" }}>
        {report.suffix || "No suffix"}
      </div>
    )
  },
  {
    key: "intro",
    title: "Intro",
    maxWidth: 200,
    render: (report) => (
      <div style={{ maxWidth: 200, overflowX: "auto" }}>
        {report.intro || "No intro"}
      </div>
    )
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
      const displayName = report.username || "Organizer";
      return renderImageCell(report, 'profile', displayName);
    }
  },
  {
    key: "background_image",
    title: "Background Image",
    centerAlign: true,
    render: (report, { renderImageCell }) => {
      const displayName = report.username || "Organizer";
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

const ORGANIZER_IMAGE_CONFIG = {
  idField: "user_id",
  profileField: "profile_image",
  backgroundField: "background_image",
  profileBucket: "profile-images",
  backgroundBucket: "background-images"
};

export default function OrganizerReportTable({ reports, onPenalize, onReject, onRestore, buttonStyle }) {
  return (
    <ReportTable
      reports={reports}
      columns={ORGANIZER_TABLE_COLUMNS}
      imageConfig={ORGANIZER_IMAGE_CONFIG}
      onPenalize={onPenalize}
      onReject={onReject}
      onRestore={onRestore}
      buttonStyle={buttonStyle}
    />
  );
}