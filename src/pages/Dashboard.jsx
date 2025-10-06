import React, { useEffect, useState } from "react";
import supabase from "../helper/supabaseClient";
import { useNavigate } from "react-router-dom";
import { FaChevronDown, FaChevronUp } from "react-icons/fa";
import ProfileReports from "./ProfileReports";
import PostReport from "./PostReport";
import Applications from "./Applications";
import AdminTable from "./AdminTable"; // Add this import
import Sports from "./Sports"; // Add this import
import "./admin.css";

function Dashboard() {
  const navigate = useNavigate();
  const [adminEmail, setAdminEmail] = useState("");
  const [selectedTable, setSelectedTable] = useState("");
  // Remove adminData state since it's now handled in AdminTable component
  const [reportsDropdownOpen, setReportsDropdownOpen] = useState(false);
  const [applicationsDropdownOpen, setApplicationsDropdownOpen] = useState(false);

  const buttonStyle = {
    minWidth: 90,
    padding: "8px 0",
    fontSize: "14px"
  };

  useEffect(() => {
    const fetchUser = async () => {
      const { data } = await supabase.auth.getUser();
      if (data?.user) {
        setAdminEmail(data.user.email);
      }
    };

    fetchUser();
  }, []);

  // Remove fetchAdminData function since it's now in AdminTable component

  const handleTableSelect = (tableName) => {
    setSelectedTable(tableName);
    // Remove the fetchAdminData call since it's handled in AdminTable
  };

  const signOut = async () => {
    const { error } = await supabase.auth.signOut();
    if (error) throw error;
    navigate("/login");
  };

  return (
    <div className="dashboard-wrapper">
      <div className="dashboard-sidebar">
        <h2>Admin Panel</h2>
        <p>{adminEmail}</p>
        <button className="sidebar-btn" onClick={() => handleTableSelect("admin")}>
          Admin Accounts
        </button>
        
        <button className="sidebar-btn" onClick={() => handleTableSelect("sports")}>
          Sports
        </button>
        
        {/* Applications Dropdown */}
        <div className="sidebar-dropdown">
          <button
            className="sidebar-btn"
            onClick={() => setApplicationsDropdownOpen((open) => !open)}
            style={{ display: "flex", alignItems: "center", justifyContent: "space-between" }}
          >
            Applications
            {applicationsDropdownOpen ? <FaChevronUp /> : <FaChevronDown />}
          </button>
          {applicationsDropdownOpen && (
            <div className="dropdown-content">
              <button
                className="sidebar-btn dropdown-btn"
                onClick={() => handleTableSelect("club_applications")}
              >
                Club
              </button>
              <button
                className="sidebar-btn dropdown-btn"
                onClick={() => handleTableSelect("organizer_applications")}
              >
                Organizer
              </button>
            </div>
          )}
        </div>

        {/* Reports Dropdown */}
        <div className="sidebar-dropdown">
          <button
            className="sidebar-btn"
            onClick={() => setReportsDropdownOpen((open) => !open)}
            style={{ display: "flex", alignItems: "center", justifyContent: "space-between" }}
          >
            Reports
            {reportsDropdownOpen ? <FaChevronUp /> : <FaChevronDown />}
          </button>
          {reportsDropdownOpen && (
            <div className="dropdown-content">
              <button
                className="sidebar-btn dropdown-btn"
                onClick={() => handleTableSelect("profile_reports")}
              >
                Profile Reports
              </button>
              <button
                className="sidebar-btn dropdown-btn"
                onClick={() => handleTableSelect("post_reports")}
              >
                Post Reports
              </button>
            </div>
          )}
        </div>
        
        <button className="sign-out-btn" onClick={signOut}>
          Sign Out
        </button>
      </div>

      <div className="dashboard-main">
        <div className="dashboard-topbar">
          <span className="admin-name">Admin: {adminEmail}</span>
        </div>

        <div className="dashboard-content">
          <h1>Welcome to the Admin Dashboard</h1>
          <p>This is your control panel.</p>

          {/* Admin Table - Updated to use AdminTable component */}
          {selectedTable === "admin" && (
            <div className="table-container">
              <AdminTable />
            </div>
          )}

          {/* Sports */}
          {selectedTable === "sports" && (
            <div className="table-container">
              <Sports />
            </div>
          )}

          {/* Club Applications */}
          {selectedTable === "club_applications" && (
            <div className="table-container">
              <Applications initialType="club" />
            </div>
          )}

          {/* Organizer Applications */}
          {selectedTable === "organizer_applications" && (
            <div className="table-container">
              <Applications initialType="organizer" />
            </div>
          )}

          {/* Profile Reports Table */}
          {selectedTable === "profile_reports" && (
            <div className="table-container">
              <ProfileReports />      
            </div>
          )}

          {/* Post Reports Table */}
          {selectedTable === "post_reports" && (
            <div className="table-container">
              <PostReport />      
            </div>
          )}
        </div>
      </div>
    </div>
  );
}

export default Dashboard;