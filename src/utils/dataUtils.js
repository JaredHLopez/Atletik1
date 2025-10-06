// Data processing utilities
import { REPORT_TABLE_MAP } from "./tableConfig";

export const extractEntityFromReport = (report, reportType) => {
  const tableConfig = REPORT_TABLE_MAP[reportType];
  if (!tableConfig) return null;
  
  const entityTable = tableConfig.entityTable;
  const entity = report[entityTable];
  if (entity && typeof entity === "object") {
    return { ...entity };
  }
  return null;
};

export const sortReportsByType = (reports, sortBy) => {
  if (!reports || !Array.isArray(reports)) return [];
  
  return [...reports].sort((a, b) => {
    if (sortBy === "count") {
      return b.reportCount - a.reportCount;
    } else if (sortBy === "recent") {
      return new Date(b.lastReported) - new Date(a.lastReported);
    }
    return 0;
  });
};

export const processReportData = (data, reportType) => {
  if (!data || !Array.isArray(data)) return [];
  
  const tableConfig = REPORT_TABLE_MAP[reportType];
  if (!tableConfig) return [];
  
  const { id, pk } = tableConfig;
  
  // Group reports by entity
  const grouped = {};
  data.forEach((report) => {
    const entityId = report[id];
    if (!grouped[entityId]) {
      const entity = extractEntityFromReport(report, reportType);
      grouped[entityId] = {
        entity: entity || { [pk]: entityId },
        reports: []
      };
    }
    grouped[entityId].reports.push(report);
  });

  // Transform grouped data
  return Object.values(grouped).map((group) => {
    const reasons = group.reports.flatMap((report) =>
      Array.isArray(report.reason) ? report.reason : [report.reason]
    ).filter(Boolean);

    const reportIds = group.reports.map(report => report.report_id);

    return {
      ...group.entity,
      reportIds: reportIds,
      reportCount: group.reports.length,
      reasons: [...new Set(reasons)],
      lastReported: group.reports.reduce((latest, report) => {
        return new Date(report.created_at) > new Date(latest)
          ? report.created_at
          : latest;
      }, group.reports[0]?.created_at),
      approval_status: group.reports[0]?.approval_status
    };
  });
};

export const groupReportsByEntity = (data, reportType, tableMap) => {
  const { id, pk } = tableMap[reportType];
  
  const grouped = {};
  data.forEach((report) => {
    const entityId = report[id];
    if (!grouped[entityId]) {
      const entity = extractEntityFromReport(report, reportType, tableMap);
      grouped[entityId] = {
        entity: entity || { [pk]: entityId },
        reports: []
      };
    }
    grouped[entityId].reports.push(report);
  });

  return Object.values(grouped).map((group) => {
    const reasons = group.reports.flatMap((report) =>
      Array.isArray(report.reason) ? report.reason : [report.reason]
    ).filter(Boolean);

    const reportIds = group.reports.map(report => report.report_id);

    return {
      ...group.entity,
      reportIds: reportIds,
      reportCount: group.reports.length,
      reasons: [...new Set(reasons)],
      lastReported: group.reports.reduce((latest, report) => {
        return new Date(report.created_at) > new Date(latest)
          ? report.created_at
          : latest;
      }, group.reports[0]?.created_at),
      approval_status: group.reports[0]?.approval_status
    };
  });
};

// Application data utilities
export const formatApplicationData = (application, tableConfig) => {
  const { pk } = tableConfig;
  return {
    ...application,
    id: application[pk],
    displayName: application.club_name || application.username || application.name || "Unknown"
  };
};

export const transformTableData = (data, tableConfig) => {
  if (!data || !Array.isArray(data)) return [];
  
  return data.map(item => formatApplicationData(item, tableConfig));
};

export const filterDataByStatus = (data, status) => {
  if (!data || !Array.isArray(data)) return [];
  if (status === "all") return data;
  
  return data.filter(item => item.application_status === status || item.approval_status === status);
};

export const sortDataByDate = (data, ascending = false) => {
  if (!data || !Array.isArray(data)) return [];
  
  return [...data].sort((a, b) => {
    const dateA = new Date(a.created_at || 0);
    const dateB = new Date(b.created_at || 0);
    return ascending ? dateA - dateB : dateB - dateA;
  });
};

// General data validation
export const validateRequiredFields = (data, requiredFields) => {
  if (!data || typeof data !== "object") return false;
  
  return requiredFields.every(field => 
    data.hasOwnProperty(field) && data[field] !== null && data[field] !== undefined && data[field] !== ""
  );
};

export const sanitizeUserInput = (input) => {
  if (typeof input !== "string") return input;
  
  return input.trim().replace(/<[^>]*>/g, ""); // Basic HTML tag removal
};

export const formatEntityName = (entity, entityType) => {
  if (!entity) return "Unknown";
  
  switch (entityType) {
    case "user":
      return entity.username || entity.name || "Unknown User";
    case "club":
      return entity.club_name || entity.name || "Unknown Club";
    case "organizer":
      return entity.username || entity.name || "Unknown Organizer";
    case "team":
      return entity.team_name || entity.name || "Unknown Team";
    default:
      return entity.name || entity.username || entity.club_name || entity.team_name || "Unknown";
  }
};