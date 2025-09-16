import React from "react";
import { STATUS_COLORS } from "../../utils/constants";

export default function StatusBadge({ status }) {
  const style = {
    display: "inline-block",
    padding: "2px 12px",
    borderRadius: 12,
    fontSize: 13,
    fontWeight: 500,
    textTransform: "capitalize",
    ...STATUS_COLORS[status] || STATUS_COLORS["pending"]
  };
  
  return <span style={style}>{status}</span>;
}