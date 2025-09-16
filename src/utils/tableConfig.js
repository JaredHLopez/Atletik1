// Table mapping configurations for different entity types

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
    id: "reported_id",
    join: "users:reported_id(user_id, username, intro, bio, profile_image, background_image, suspended_until)",
    entityTable: "users",
    pk: "user_id"
  },
  club: {
    table: "club_reports",
    id: "reported_id",
    join: "clubs:reported_id(club_id, club_name, sports, street_address, barangay, city, province, profile_image, background_image, suspended_until)",
    entityTable: "clubs",
    pk: "club_id"
  },
  organizer: {
    table: "organizer_reports",
    id: "reported_id",
    join: "organizers:reported_id(user_id, username, suffix, intro, bio, profile_image, background_image, suspended_until)",
    entityTable: "organizers",
    pk: "user_id"
  },
  team: {
    table: "team_reports",
    id: "reported_id",
    join: "teams:reported_id(team_id, team_name, sports, street_address, barangay, city, province, intro, bio, profile_image, background_image, suspended_until)",
    entityTable: "teams",
    pk: "team_id"
  }
};