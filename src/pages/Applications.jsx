import React, { useState } from "react";
import ClubApplicationTable from "./ClubApplicationTable";
import OrganizerApplicationTable from "./OrganizerApplicationTable";

export default function Applications() {
  const [activeTab, setActiveTab] = useState("club");

  const tabStyle = (isActive) => ({
    padding: "12px 24px",
    marginRight: "8px",
    border: "none",
    borderRadius: "8px 8px 0 0",
    background: isActive ? "#fff" : "#f5f5f5",
    color: isActive ? "#1890ff" : "#666",
    cursor: "pointer",
    fontWeight: isActive ? 600 : 400,
    fontSize: "14px",
    borderBottom: isActive ? "2px solid #1890ff" : "1px solid #d9d9d9"
  });

  const buttonStyle = {
    minWidth: 90,
    padding: "8px 0",
    fontSize: "14px"
  };

  return (
    <div style={{ padding: "20px", background: "#f5f5f5", minHeight: "100vh" }}>
      <div style={{ background: "#fff", borderRadius: "8px", overflow: "hidden", boxShadow: "0 2px 8px rgba(0,0,0,0.1)" }}>
        
        {/* Tab Navigation */}
        <div style={{ 
          background: "#fafafa", 
          borderBottom: "1px solid #d9d9d9", 
          padding: "0 20px",
          display: "flex"
        }}>
          <button
            style={tabStyle(activeTab === "club")}
            onClick={() => setActiveTab("club")}
          >
            Club Applications
          </button>
          <button
            style={tabStyle(activeTab === "organizer")}
            onClick={() => setActiveTab("organizer")}
          >
            Organizer Applications
          </button>
        </div>

        {/* Tab Content */}
        <div style={{ padding: "20px" }}>
          {activeTab === "club" && (
            <ClubApplicationTable buttonStyle={buttonStyle} />
          )}
          {activeTab === "organizer" && (
            <OrganizerApplicationTable buttonStyle={buttonStyle} />
          )}
        </div>
      </div>
    </div>
  );
}