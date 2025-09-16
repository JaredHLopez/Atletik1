// Date and time utility functions

export const getTimeFilter = (timeFilter) => {
  const now = new Date();
  switch (timeFilter) {
    case "day":
      const startOfDay = new Date(now);
      startOfDay.setHours(0, 0, 0, 0);
      return startOfDay;
    case "week":
      const weekAgo = new Date(now);
      weekAgo.setDate(weekAgo.getDate() - 7);
      return weekAgo;
    case "month":
      const monthAgo = new Date(now);
      monthAgo.setMonth(monthAgo.getMonth() - 1);
      return monthAgo;
    default:
      return null;
  }
};

export const formatDate = (dateString) => {
  if (!dateString) return "-";
  return dateString.slice(0, 10);
};

export const getCurrentDateTimeLocal = () => {
  return new Date().toISOString().slice(0, 16);
};