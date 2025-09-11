import React, { useEffect, useState } from "react";
import supabase from "../helper/supabaseClient";
import { useNavigate } from "react-router-dom";
import { FaChevronDown, FaChevronUp } from "react-icons/fa";
import ProfileReports from "./ProfileReports";
import PostReport from "./PostReport";
import ClubApplicationTable from "./ClubApplicationTable";
import OrganizerApplicationTable from "./OrganizerApplicationTable";
import "./admin.css";

function Dashboard() {
  const navigate = useNavigate();
  const [adminEmail, setAdminEmail] = useState("");
  const [selectedTable, setSelectedTable] = useState("");
  const [adminData, setAdminData] = useState([]);
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

  const fetchAdminData = async () => {
    const { data, error } = await supabase.from("admin").select("*");
    if (error) {
      console.error("Admin fetch error:", error.message);
    } else {
      setAdminData(data);
    }
  };

  const handleTableSelect = (tableName) => {
    setSelectedTable(tableName);
    if (tableName === "admin") fetchAdminData();
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
          Admin Table
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

          {/* Admin Table */}
          {selectedTable === "admin" && (
            <div className="table-container">
              <h2>Admin Table</h2>
              <table className="request-table">
                <thead>
                  <tr>
                    <th>ID</th>
                    <th>Email</th>
                    <th>Password</th>
                  </tr>
                </thead>
                <tbody>
                  {adminData.map((item) => (
                    <tr key={item.id}>
                      <td>{item.id}</td>
                      <td>{item.email}</td>
                      <td>{item.password}</td>
                    </tr>
                  ))}
                </tbody>
              </table>
            </div>
          )}

          {/* Club Applications */}
          {selectedTable === "club_applications" && (
            <div className="table-container">
              <h2>Club Applications</h2>
              <ClubApplicationTable buttonStyle={buttonStyle} />      
            </div>
          )}

          {/* Organizer Applications */}
          {selectedTable === "organizer_applications" && (
            <div className="table-container">
              <h2>Organizer Applications</h2>
              <OrganizerApplicationTable buttonStyle={buttonStyle} />      
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