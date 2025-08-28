import React, { useEffect, useState } from "react";
import supabase from "../helper/supabaseClient";
import { useNavigate } from "react-router-dom";
import { FaChevronDown, FaChevronUp } from "react-icons/fa";
import ProfileReports from "./ProfileReports";
import PostReport from "./PostReport"; // This import is already correct
import "./admin.css";

function Dashboard() {
  const navigate = useNavigate();
  const [adminEmail, setAdminEmail] = useState("");
  const [selectedTable, setSelectedTable] = useState("");
  const [adminData, setAdminData] = useState([]);
  const [clubAppData, setClubAppData] = useState([]);
  const [reportsDropdownOpen, setReportsDropdownOpen] = useState(false);

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

  const fetchClubAppData = async () => {
    const { data, error } = await supabase.from("club_applications").select("*");
    if (error) {
      console.error("Club Applications fetch error:", error.message);
    } else {
      // Initialize status as 'pending' if not set
      const dataWithStatus = data.map(item => ({
        ...item,
        status: item.status || 'pending'
      }));
      setClubAppData(dataWithStatus);
    }
  };

  const handleTableSelect = (tableName) => {
    setSelectedTable(tableName);
    if (tableName === "admin") fetchAdminData();
    if (tableName === "club_applications") fetchClubAppData();
  };

  const signOut = async () => {
    const { error } = await supabase.auth.signOut();
    if (error) throw error;
    navigate("/login");
  };

  const updateApplicationStatus = async (applicationId, newStatus) => {
    console.log(`Application ID: ${applicationId}, Status: ${newStatus}`)
    try {
      const { data, error } = await supabase
        .from('club_applications')
        .update({ status: newStatus })
        .eq('application_id', applicationId);
      
      if (error) throw error;
      
      // Update local state
      setClubAppData(clubAppData.map(item => 
        item.application_id === applicationId 
          ? { ...item, status: newStatus } 
          : item
      ));
      
    } catch (error) {
      console.error('Error updating status:', error.message);
    }
  };

  // Helper function to get status color
  const getStatusColor = (status) => {
    switch (status) {
      case 'accepted':
        return 'status-accepted';
      case 'rejected':
        return 'status-declined';
      default:
        return 'status-pending';
    }
  };

  // Function to get image URL (handles both direct URLs and Supabase storage paths)
  const getImageUrl = (path) => {
    if (!path) {
      console.warn("getImageUrl: Path is null or empty.");
      return null;
    }
    if (path.startsWith('http')) {
      return path; // Already a full URL
    }

    // --- IMPORTANT: Replace 'your-bucket-name' with your actual Supabase bucket name ---
    const BUCKET_NAME = 'club-documents';

    try {
      const { data, error } = supabase
        .storage
        .from(BUCKET_NAME)
        .getPublicUrl(path);

      if (error) {
        console.error(`Error getting public URL for path '${path}' from bucket '${BUCKET_NAME}':`, error.message);
        // You might want to return a placeholder image URL or null in case of error
        return null;
      }

      if (data && data.publicUrl) {
        return data.publicUrl;
      } else {
        console.warn(`getImageUrl: No public URL returned for path '${path}' from bucket '${BUCKET_NAME}'.`);
        return null;
      }
    } catch (e) {
      console.error(`Unexpected error in getImageUrl for path '${path}':`, e);
      return null;
    }
  };

  return (
    <div className="dashboard-wrapper">
      <div className="dashboard-sidebar">
        <h2>Admin Panel</h2>
        <p>{adminEmail}</p>
        <button className="sidebar-btn" onClick={() => handleTableSelect("admin")}>
          Admin Table
        </button>
        <button className="sidebar-btn" onClick={() => handleTableSelect("club_applications")}>
          View Club Application
        </button>
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

          {/* Profile Reports Table */}
          {selectedTable === "profile_reports" && (
            <div className="table-container">
              <ProfileReports />      
            </div>
          )}

          {/* Post Reports Table - ADD THIS SECTION */}
          {selectedTable === "post_reports" && (
            <div className="table-container">
              <PostReport />      
            </div>
          )}

          {/* Club Applications Table */}
          {selectedTable === "club_applications" && (
            <div className="table-container">
              <h2>Club Applications</h2>
              <table className="request-table">
                <thead>
                  <tr>
                    <th>Application ID</th>
                    <th>Name</th>
                    <th>Establishment</th>
                    <th>BIR Registration</th>
                    <th>Business Permit</th>
                    <th>Created Date</th>
                    <th>Filer ID</th>
                    <th>Location</th>
                    <th>Status</th>
                    <th>Actions</th>
                  </tr>
                </thead>
                <tbody>
                  {clubAppData.map((item) => (
                    <tr key={item.application_id}>
                      <td>{item.application_id}</td>
                      <td>{item.name}</td>
                      <td>{item.establishment}</td>
                      <td>
                        {item.bir_registration && (
                          <img 
                            src={getImageUrl(item.bir_registration)} 
                            alt="BIR Registration" 
                            className="document-image"
                            onClick={() => window.open(getImageUrl(item.bir_registration), '_blank')}
                          />
                        )}
                      </td>
                      <td>
                        {item.business_permit && (
                          <img 
                            src={getImageUrl(item.business_permit)} 
                            alt="Business Permit" 
                            className="document-image"
                            onClick={() => window.open(getImageUrl(item.business_permit), '_blank')}
                          />
                        )}
                      </td>
                      <td>{item.created_at?.slice(0, 10)}</td>
                      <td>{item.filer_id}</td>
                      <td>{item.location}</td>
                      <td>
                        <span className={`status-badge ${getStatusColor(item.status)}`}>
                          {item.status}
                        </span>
                      </td>
                      <td className="action-buttons">
                        {item.status === "pending" && (
                          <>
                            <button 
                              className="accept-btn"
                              onClick={() => updateApplicationStatus(item.application_id, 'accepted')}
                            >
                              Accept
                            </button>
                            <button 
                              className="decline-btn"
                              onClick={() => updateApplicationStatus(item.application_id, 'rejected')}
                            >
                              Decline
                            </button>
                          </>
                        )}
                      </td>
                    </tr>
                  ))}
                </tbody>
              </table>
            </div>
          )}
        </div>
      </div>
    </div>
  );
}

export default Dashboard;