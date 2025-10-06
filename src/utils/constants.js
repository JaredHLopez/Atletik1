// Constants for filters and options

export const TIME_FILTER_OPTIONS = [
  { label: "Today", value: "day" },
  { label: "This Week", value: "week" },
  { label: "This Month", value: "month" },
  { label: "All Time", value: "all" },
];

// Keeping legacy name for backwards compatibility
export const TIME_FILTERS = TIME_FILTER_OPTIONS;

export const STATUS_OPTIONS = {
  APPLICATIONS: [
    { label: "Pending", value: "pending" },
    { label: "Accepted", value: "accepted" },
    { label: "Rejected", value: "rejected" },
  ],
  REPORTS: [
    { label: "Pending", value: "pending" },
    { label: "Penalized", value: "penalized" },
    { label: "Rejected", value: "rejected" },
  ]
};

export const REPORT_STATUS_OPTIONS = STATUS_OPTIONS.REPORTS;
export const APPLICATION_STATUS_OPTIONS = STATUS_OPTIONS.APPLICATIONS;

export const REPORT_TYPES = [
  { label: "User", value: "user" },
  { label: "Club", value: "club" },
  { label: "Organizer", value: "organizer" },
  { label: "Team", value: "team" },
];

export const SORT_OPTIONS = [
  { label: "Most Recent", value: "recent" },
  { label: "Report Count", value: "count" },
];

export const STATUS_COLORS = {
  pending: { background: "#fffbe6", color: "#b59f3b", border: "1px solid #ffe58f" },
  accepted: { background: "#e6ffed", color: "#389e0d", border: "1px solid #b7eb8f" },
  rejected: { background: "#fff1f0", color: "#cf1322", border: "1px solid #ffa39e" },
  penalized: { background: "#fff1f0", color: "#cf1322", border: "1px solid #ffa39e" }
};

export const APPLICATION_TABLE_MAP = {
  club: {
    table: "club_applications",
    id: "club_application_id",
    bucketName: "club-documents"
  },
  organizer: {
    table: "organizer_applications", 
    id: "organizer_application_id",
    bucketName: "organizer-documents"
  }
};

export const REPORT_TABLE_MAP = {
  user: {
    table: "user_reports",
    id: "user_id"
  },
  team: {
    table: "team_reports", 
    id: "team_id"
  },
  organizer: {
    table: "organizer_reports",
    id: "organizer_id"
  },
  club: {
    table: "club_reports",
    id: "club_id"
  }
};