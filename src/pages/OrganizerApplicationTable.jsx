import React, { useEffect, useState } from "react";
import supabase from "../helper/supabaseClient";
import ImageModal from "../components/ImageModal";
import StatusBadge from "../components/shared/StatusBadge";
import ErrorDisplay from "../components/shared/ErrorDisplay";

export default function OrganizerApplicationTable({ 
  applications,
  onApprove,
  onReject,
  onRestore,
  buttonStyle,
  bucketName,
  currentStatus
}) {
  const [modalImage, setModalImage] = useState({ isOpen: false, src: "", alt: "" });
  const [organizerExistsMap, setOrganizerExistsMap] = useState({});
  const [warningMessage, setWarningMessage] = useState("");

  // Check if organizers exist in organizers table for accepted applications
  useEffect(() => {
    async function checkOrganizersExistence() {
      const existsMap = {};
      
      // Only check for accepted applications
      const acceptedApplications = applications.filter(app => app.application_status === "accepted");
      
      for (const app of acceptedApplications) {
        try {
          const { data, error } = await supabase
            .from("organizers")
            .select("organizer_id")
            .eq("email", app.email)
            .single();
          
          existsMap[app.organizer_application_id] = !error && data;
        } catch (err) {
          console.error(`Error checking organizer existence for ${app.email}:`, err);
          existsMap[app.organizer_application_id] = false;
        }
      }
      
      setOrganizerExistsMap(existsMap);
    }
    
    if (applications.length > 0) {
      checkOrganizersExistence();
    }
  }, [applications]);

  const handleReject = (applicationId) => {
    // Check if organizer exists in organizers table
    if (organizerExistsMap[applicationId]) {
      setWarningMessage("Cannot reject this application - the organizer account has already been created and may be in use.");
      setTimeout(() => setWarningMessage(""), 5000);
      return;
    }
    
    onReject(applicationId);
  };

  const handleRestore = (applicationId) => {
    // Check if organizer exists in organizers table
    if (organizerExistsMap[applicationId]) {
      setWarningMessage("Cannot restore this application - the organizer account has already been created and may be in use.");
      setTimeout(() => setWarningMessage(""), 5000);
      return;
    }
    
    onRestore(applicationId);
  };

  const getImageUrl = (path) => {
    if (!path) return null;
    if (path.startsWith('http')) return path;

    try {
      const { data, error } = supabase
        .storage
        .from('organizer-documents')
        .getPublicUrl(path);

      if (error) {
        console.error(`Error getting public URL:`, error.message);
        return null;
      }
      return data?.publicUrl || null;
    } catch (e) {
      console.error(`Unexpected error in getImageUrl:`, e);
      return null;
    }
  };

  const openImageModal = (src, alt) => {
    setModalImage({ isOpen: true, src, alt });
  };

  const closeImageModal = () => {
    setModalImage({ isOpen: false, src: "", alt: "" });
  };

  return (
    <>
      {/* Warning Message */}
      <ErrorDisplay error={warningMessage} />

      <div style={{ overflowX: "auto", position: "relative" }}>
        <table style={{
          width: "100%",
          borderCollapse: "collapse",
          minWidth: 1200,
          background: "#fff"
        }}>
          <thead>
            <tr>
              <th style={{ border: "1px solid #eee", padding: "10px 8px", background: "#fafafa", fontWeight: 600 }}>Application ID</th>
              <th style={{ border: "1px solid #eee", padding: "10px 8px", background: "#fafafa", fontWeight: 600 }}>Name</th>
              <th style={{ border: "1px solid #eee", padding: "10px 8px", background: "#fafafa", fontWeight: 600 }}>Email</th>
              <th style={{ border: "1px solid #eee", padding: "10px 8px", background: "#fafafa", fontWeight: 600 }}>Phone</th>
              <th style={{ border: "1px solid #eee", padding: "10px 8px", background: "#fafafa", fontWeight: 600 }}>Experience</th>
              <th style={{ border: "1px solid #eee", padding: "10px 8px", background: "#fafafa", fontWeight: 600 }}>Portfolio</th>
              <th style={{ border: "1px solid #eee", padding: "10px 8px", background: "#fafafa", fontWeight: 600 }}>Created Date</th>
              <th style={{ border: "1px solid #eee", padding: "10px 8px", background: "#fafafa", fontWeight: 600 }}>Filer ID</th>
              <th style={{ border: "1px solid #eee", padding: "10px 8px", background: "#fafafa", fontWeight: 600 }}>Status</th>
              <th style={{ border: "1px solid #eee", padding: "10px 8px", background: "#fafafa", fontWeight: 600 }}>Organizer Created</th>
              <th style={{ 
                border: "1px solid #eee", 
                padding: "10px 8px", 
                background: "#fafafa", 
                fontWeight: 600,
                position: "sticky",
                right: 0,
                zIndex: 10,
                minWidth: 200
              }}>Actions</th>
            </tr>
          </thead>
          <tbody>
            {applications.length === 0 ? (
              <tr>
                <td colSpan="11" style={{ textAlign: "center", padding: "24px", color: "#888" }}>
                  No applications found
                </td>
              </tr>
            ) : (
              applications.map((item) => (
                <tr key={item.organizer_application_id}>
                  <td style={{ border: "1px solid #eee", padding: "8px 6px", fontSize: 13 }}>
                    {item.organizer_application_id}
                  </td>
                  <td style={{ border: "1px solid #eee", padding: "8px 6px", fontSize: 13 }}>
                    {item.name}
                  </td>
                  <td style={{ border: "1px solid #eee", padding: "8px 6px", fontSize: 13 }}>
                    {item.email}
                  </td>
                  <td style={{ border: "1px solid #eee", padding: "8px 6px", fontSize: 13 }}>
                    {item.phone}
                  </td>
                  <td style={{ border: "1px solid #eee", padding: "8px 6px", fontSize: 13 }}>
                    {item.experience}
                  </td>
                  <td style={{ border: "1px solid #eee", padding: "8px 6px", textAlign: "center" }}>
                    {item.portfolio ? (
                      <img
                        src={getImageUrl(item.portfolio)}
                        alt="Portfolio"
                        style={{
                          width: 70,
                          height: 40,
                          objectFit: "cover",
                          borderRadius: 6,
                          cursor: "pointer"
                        }}
                        onClick={() => openImageModal(getImageUrl(item.portfolio), "Portfolio")}
                      />
                    ) : (
                      <span style={{ color: "#888", fontSize: 12 }}>No portfolio</span>
                    )}
                  </td>
                  <td style={{ border: "1px solid #eee", padding: "8px 6px", fontSize: 13 }}>
                    {item.created_at?.slice(0, 10)}
                  </td>
                  <td style={{ border: "1px solid #eee", padding: "8px 6px", fontSize: 13 }}>
                    {item.filer_id}
                  </td>
                  <td style={{ border: "1px solid #eee", padding: "8px 6px", fontSize: 13 }}>
                    <StatusBadge status={item.application_status} />
                  </td>
                  <td style={{ border: "1px solid #eee", padding: "8px 6px", fontSize: 13, textAlign: "center" }}>
                    {organizerExistsMap[item.organizer_application_id] ? (
                      <span style={{
                        display: "inline-block",
                        padding: "2px 8px",
                        borderRadius: 12,
                        fontSize: 12,
                        fontWeight: 500,
                        background: "#e6ffed",
                        color: "#389e0d",
                        border: "1px solid #b7eb8f"
                      }}>
                        ✓ Yes
                      </span>
                    ) : (
                      <span style={{
                        display: "inline-block",
                        padding: "2px 8px",
                        borderRadius: 12,
                        fontSize: 12,
                        fontWeight: 500,
                        background: "#f5f5f5",
                        color: "#666",
                        border: "1px solid #d9d9d9"
                      }}>
                        No
                      </span>
                    )}
                  </td>
                  <td style={{ 
                    border: "1px solid #eee", 
                    padding: "8px 6px", 
                    textAlign: "center",
                    position: "sticky",
                    right: 0,
                    background: "#fff",
                    zIndex: 9,
                    minWidth: 200
                  }}>
                    <div style={{ display: "flex", gap: 8, justifyContent: "center" }}>
                      {(item.application_status === "accepted" || item.application_status === "rejected") ? (
                        <button
                          style={{
                            ...buttonStyle,
                            background: organizerExistsMap[item.organizer_application_id] ? "#d9d9d9" : "#faad14",
                            color: organizerExistsMap[item.organizer_application_id] ? "#999" : "#fff",
                            border: "none",
                            borderRadius: 6,
                            cursor: organizerExistsMap[item.organizer_application_id] ? "not-allowed" : "pointer"
                          }}
                          onClick={() => handleRestore(item.organizer_application_id)}
                          disabled={organizerExistsMap[item.organizer_application_id]}
                          title={organizerExistsMap[item.organizer_application_id] ? "Cannot restore - organizer already exists" : "Restore application"}
                        >
                          <span style={{ width: "100%", textAlign: "center" }}>Restore</span>
                        </button>
                      ) : (
                        <>
                          <button
                            style={{
                              ...buttonStyle,
                              background: "#52c41a",
                              color: "#fff",
                              border: "none",
                              borderRadius: 6,
                              cursor: "pointer"
                            }}
                            onClick={() => onApprove(item.organizer_application_id)}
                          >
                            <span style={{ width: "100%", textAlign: "center" }}>Accept</span>
                          </button>
                          <button
                            style={{
                              ...buttonStyle,
                              background: "#cf1322",
                              color: "#fff",
                              border: "none",
                              borderRadius: 6,
                              cursor: "pointer"
                            }}
                            onClick={() => handleReject(item.organizer_application_id)}
                          >
                            <span style={{ width: "100%", textAlign: "center" }}>Decline</span>
                          </button>
                        </>
                      )}
                    </div>
                  </td>
                </tr>
              ))
            )}
          </tbody>
        </table>
      </div>

      <ImageModal
        src={modalImage.src}
        alt={modalImage.alt}
        isOpen={modalImage.isOpen}
        onClose={closeImageModal}
      />
    </>
  );
}