import React from "react";
import ReportTable from "../components/shared/ReportTable";

const ORGANIZER_TABLE_COLUMNS = [
  {
    key: "organizer_name",
    title: "Organizer Name",
    render: (report) => report.organizer_name || "Unknown"
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
    key: "sports",
    title: "Sports",
    maxWidth: 150,
    render: (report) => (
      <div style={{ maxWidth: 150, overflowX: "auto" }}>
        {Array.isArray(report.sports) ? report.sports.join(", ") : report.sports || "No sports"}
      </div>
    )
  },
  {
    key: "competitiveness",
    title: "Competitiveness",
    render: (report) => report.competitiveness || "N/A"
  },
  {
    key: "profile_image",
    title: "Profile Image",
    centerAlign: true,
    render: (report, { renderImageCell }) => {
      const displayName = report.organizer_name || "Organizer";
      return renderImageCell(report, 'profile', displayName);
    }
  },
  {
    key: "background_image",
    title: "Background Image",
    centerAlign: true,
    render: (report, { renderImageCell }) => {
      const displayName = report.organizer_name || "Organizer";
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
  idField: "organizer_id",
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