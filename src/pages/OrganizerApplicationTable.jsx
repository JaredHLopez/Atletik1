import React, { useEffect, useState } from "react";
import supabase from "../helper/supabaseClient";
import SimpleImageViewer from "../components/SimpleImageViewer";
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
  const [modalImage, setModalImage] = useState({ 
    isOpen: false, 
    images: []
  });
  const [organizerExistsMap, setOrganizerExistsMap] = useState({});
  const [warningMessage, setWarningMessage] = useState("");
  const [imageUrls, setImageUrls] = useState({});

  // Check if organizers exist in organizers table for accepted applications
  useEffect(() => {
    async function checkOrganizersExistence() {
      const existsMap = {};
      
      // Only check for accepted applications
      const acceptedApplications = applications.filter(app => app.application_status === "accepted");
      
      for (const app of acceptedApplications) {
        try {
          // Check if organizer exists using organizer_name since email field doesn't exist
          const { data, error } = await supabase
            .from("organizers")
            .select("organizer_id")
            .eq("organizer_name", app.organizer_name)
            .single();
          
          existsMap[app.organizer_application_id] = !error && data;
        } catch (err) {
          console.error(`Error checking organizer existence for ${app.organizer_name}:`, err);
          existsMap[app.organizer_application_id] = false;
        }
      }
      
      setOrganizerExistsMap(existsMap);
    }
    
    if (applications.length > 0) {
      checkOrganizersExistence();
    }
  }, [applications]);

  // Fetch image URLs from file_list structure
  useEffect(() => {
    async function fetchImageUrls() {
      const urls = {};
      
      for (const app of applications) {
        // Parse file_list if it's a string
        let fileList = [];
        if (app.file_list) {
          try {
            if (typeof app.file_list === 'string') {
              // Handle cases where file_list might be stringified JSON or just text
              const trimmed = app.file_list.trim();
              if (trimmed.startsWith('[') && trimmed.endsWith(']')) {
                fileList = JSON.parse(trimmed);
              } else if (trimmed.startsWith('{') && trimmed.endsWith('}')) {
                // Handle single object case
                const parsed = JSON.parse(trimmed);
                fileList = Array.isArray(parsed) ? parsed : [parsed];
              } else {
                // Handle comma-separated string or single file path
                fileList = trimmed.split(',').map(f => f.trim()).filter(f => f);
              }
            } else if (Array.isArray(app.file_list)) {
              fileList = app.file_list;
            } else if (typeof app.file_list === 'object') {
              // Handle single object case
              fileList = [app.file_list];
            }
          } catch (error) {
            console.error(`Error parsing file_list for application ${app.organizer_application_id}:`, error);
            continue;
          }
        }

        // Process each file in the file_list
        for (let i = 0; i < fileList.length; i++) {
          const filePath = fileList[i];
          if (filePath && !filePath.startsWith('file://')) {
            try {
              const { data, error } = await supabase.storage
                .from('organizer-documents')
                .download(filePath);
              
              if (error) {
                console.error(`Error downloading file ${filePath}:`, error);
              } else {
                const url = URL.createObjectURL(data);
                urls[`file_${app.organizer_application_id}_${i}`] = url;
              }
            } catch (error) {
              console.error(`Error getting file ${filePath}:`, error);
            }
          }
        }
      }
      
      setImageUrls(urls);
    }
    
    if (applications.length > 0) {
      fetchImageUrls();
    }
  }, [applications]);

  // Add cleanup to prevent memory leaks
  useEffect(() => {
    return () => {
      // Cleanup blob URLs when component unmounts
      Object.values(imageUrls).forEach(url => {
        if (url && url.startsWith('blob:')) {
          URL.revokeObjectURL(url);
        }
      });
    };
  }, [imageUrls]);

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

  const openImageModal = (applicationId, fileList) => {
    // Safety check
    if (!fileList || !Array.isArray(fileList)) {
      console.error("Invalid fileList:", fileList);
      return;
    }
    
    // Prepare all images for this application
    const images = [];
    for (let i = 0; i < fileList.length; i++) {
      const imageKey = `file_${applicationId}_${i}`;
      const imageUrl = imageUrls[imageKey];
      
      if (imageUrl) {
        images.push({
          src: imageUrl,
          alt: `Document ${i + 1}`
        });
      }
    }
    
    if (images.length > 0) {
      setModalImage({ 
        isOpen: true, 
        images
      });
    } else {
      console.error("No valid images found to display");
    }
  };

  const closeImageModal = () => {
    setModalImage({ isOpen: false, images: [] });
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
              <th style={{ border: "1px solid #eee", padding: "10px 8px", background: "#fafafa", fontWeight: 600 }}>Organizer Name</th>
              <th style={{ border: "1px solid #eee", padding: "10px 8px", background: "#fafafa", fontWeight: 600 }}>Establishment Date</th>
              <th style={{ border: "1px solid #eee", padding: "10px 8px", background: "#fafafa", fontWeight: 600 }}>Street Address</th>
              <th style={{ border: "1px solid #eee", padding: "10px 8px", background: "#fafafa", fontWeight: 600 }}>Barangay</th>
              <th style={{ border: "1px solid #eee", padding: "10px 8px", background: "#fafafa", fontWeight: 600 }}>City</th>
              <th style={{ border: "1px solid #eee", padding: "10px 8px", background: "#fafafa", fontWeight: 600 }}>Province</th>
              <th style={{ border: "1px solid #eee", padding: "10px 8px", background: "#fafafa", fontWeight: 600 }}>Documents</th>
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
                <td colSpan="13" style={{ textAlign: "center", padding: "24px", color: "#888" }}>
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
                    {item.organizer_name}
                  </td>
                  <td style={{ border: "1px solid #eee", padding: "8px 6px", fontSize: 13 }}>
                    {item.establishment_date || '-'}
                  </td>
                  <td style={{ border: "1px solid #eee", padding: "8px 6px", fontSize: 13 }}>
                    {item.street_address || '-'}
                  </td>
                  <td style={{ border: "1px solid #eee", padding: "8px 6px", fontSize: 13 }}>
                    {item.barangay || '-'}
                  </td>
                  <td style={{ border: "1px solid #eee", padding: "8px 6px", fontSize: 13 }}>
                    {item.city || '-'}
                  </td>
                  <td style={{ border: "1px solid #eee", padding: "8px 6px", fontSize: 13 }}>
                    {item.province || '-'}
                  </td>
                  <td style={{ border: "1px solid #eee", padding: "8px 6px", textAlign: "center" }}>
                    {(() => {
                      // Parse file_list to get available files
                      let fileList = [];
                      if (item.file_list) {
                        try {
                          if (typeof item.file_list === 'string') {
                            // Handle cases where file_list might be stringified JSON or just text
                            const trimmed = item.file_list.trim();
                            if (trimmed.startsWith('[') && trimmed.endsWith(']')) {
                              fileList = JSON.parse(trimmed);
                            } else if (trimmed.startsWith('{') && trimmed.endsWith('}')) {
                              // Handle single object case
                              const parsed = JSON.parse(trimmed);
                              fileList = Array.isArray(parsed) ? parsed : [parsed];
                            } else {
                              // Handle comma-separated string or single file path
                              fileList = trimmed.split(',').map(f => f.trim()).filter(f => f);
                            }
                          } else if (Array.isArray(item.file_list)) {
                            fileList = item.file_list;
                          } else if (typeof item.file_list === 'object') {
                            // Handle single object case
                            fileList = [item.file_list];
                          }
                        } catch (error) {
                          console.error(`Error parsing file_list for display:`, error);
                        }
                      }

                      if (fileList.length === 0) {
                        return <span style={{ color: "#888", fontSize: 12 }}>No documents</span>;
                      }

                      // Display first available image
                      const firstImageUrl = imageUrls[`file_${item.organizer_application_id}_0`];
                      if (firstImageUrl) {
                        return (
                          <div style={{ display: "flex", flexDirection: "column", alignItems: "center", gap: "4px" }}>
                            <img
                              src={firstImageUrl}
                              alt="Portfolio Document"
                              style={{
                                width: 70,
                                height: 40,
                                objectFit: "cover",
                                borderRadius: 6,
                                cursor: "pointer"
                              }}
                              onClick={() => openImageModal(item.organizer_application_id, fileList)}
                            />
                            {fileList.length > 1 && (
                              <span style={{ fontSize: 10, color: "#666" }}>
                                +{fileList.length - 1} more
                              </span>
                            )}
                          </div>
                        );
                      } else {
                        return (
                          <span style={{ color: "#888", fontSize: 12 }}>
                            {fileList.length} file{fileList.length !== 1 ? 's' : ''} (loading...)
                          </span>
                        );
                      }
                    })()}
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

      <SimpleImageViewer
        images={modalImage.images}
        isOpen={modalImage.isOpen}
        onClose={closeImageModal}
      />
    </>
  );
}