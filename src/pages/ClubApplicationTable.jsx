import React, { useState, useEffect } from "react";
import supabase from "../helper/supabaseClient";
import ZoomableImageViewer from "../components/ZoomableImageViewer";
import StatusBadge from "../components/shared/StatusBadge";
import ErrorDisplay from "../components/shared/ErrorDisplay";
import Modal from "../components/shared/Modal";

export default function ClubApplicationTable({ 
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
    images: [],
    initialIndex: 0
  });
  const [imageUrls, setImageUrls] = useState({});
  const [rejectionReason, setRejectionReason] = useState("");
  const [showRejectModal, setShowRejectModal] = useState(false);
  const [selectedApplicationId, setSelectedApplicationId] = useState(null);
  const [clubExistsMap, setClubExistsMap] = useState({});
  const [warningMessage, setWarningMessage] = useState("");

  // Check if clubs exist in clubs table for accepted applications
  useEffect(() => {
    async function checkClubsExistence() {
      const existsMap = {};
      
      // Only check for accepted applications
      const acceptedApplications = applications.filter(app => app.application_status === "accepted");
      
      for (const app of acceptedApplications) {
        try {
          const { data, error } = await supabase
            .from("clubs")
            .select("club_id")
            .eq("club_name", app.club_name)
            .single();
          
          existsMap[app.club_application_id] = !error && data;
        } catch (err) {
          console.error(`Error checking club existence for ${app.club_name}:`, err);
          existsMap[app.club_application_id] = false;
        }
      }
      
      setClubExistsMap(existsMap);
    }
    
    if (applications.length > 0) {
      checkClubsExistence();
    }
  }, [applications]);

  // Fetch image URLs exactly like UserReportTable does
  useEffect(() => {
    async function fetchImageUrls() {
      console.log("=== FETCHING IMAGES ===");
      console.log("Applications:", applications);
      
      const urls = {};
      
      for (const app of applications) {
        console.log(`Processing application ID: ${app.club_application_id}`);
        
        // BIR Registration image
        if (app.bir_registration_image && !app.bir_registration_image.startsWith('file://')) {
          try {
            const { data, error } = await supabase.storage
              .from('club-documents')
              .download(app.bir_registration_image);
            
            if (error) {
              console.error('Error downloading BIR image:', error);
            } else {
              const url = URL.createObjectURL(data);
              urls[`bir_${app.club_application_id}`] = url;
              console.log(`BIR blob URL created: ${url}`);
            }
          } catch (error) {
            console.error('Error getting BIR image:', error);
          }
        }
        
        // Business Permit image  
        if (app.business_permit_image && !app.business_permit_image.startsWith('file://')) {
          try {
            const { data, error } = await supabase.storage
              .from('club-documents')
              .download(app.business_permit_image);
            
            if (error) {
              console.error('Error downloading permit image:', error);
            } else {
              const url = URL.createObjectURL(data);
              urls[`permit_${app.club_application_id}`] = url;
              console.log(`Permit blob URL created: ${url}`);
            }
          } catch (error) {
            console.error('Error getting permit image:', error);
          }
        }

        // Owner Signature image
        if (app.owner_name_sig_image && !app.owner_name_sig_image.startsWith('file://')) {
          try {
            const { data, error } = await supabase.storage
              .from('club-documents')
              .download(app.owner_name_sig_image);
            
            if (error) {
              console.error('Error downloading signature image:', error);
            } else {
              const url = URL.createObjectURL(data);
              urls[`sig_${app.club_application_id}`] = url;
              console.log(`Signature blob URL created: ${url}`);
            }
          } catch (error) {
            console.error('Error getting signature image:', error);
          }
        }

        // Owner ID Card image
        if (app.owner_id_card_image && !app.owner_id_card_image.startsWith('file://')) {
          try {
            const { data, error } = await supabase.storage
              .from('club-documents')
              .download(app.owner_id_card_image);
            
            if (error) {
              console.error('Error downloading ID card image:', error);
            } else {
              const url = URL.createObjectURL(data);
              urls[`id_${app.club_application_id}`] = url;
              console.log(`ID card blob URL created: ${url}`);
            }
          } catch (error) {
            console.error('Error getting ID card image:', error);
          }
        }
      }
      
      console.log("Final imageUrls object:", urls);
      setImageUrls(urls);
    }
    
    if (applications.length > 0) {
      fetchImageUrls();
    }
  }, [applications, bucketName]);

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
    // Check if club exists in clubs table
    if (clubExistsMap[applicationId]) {
      setWarningMessage("Cannot reject this application - the club has already been created and users may be using it.");
      setTimeout(() => setWarningMessage(""), 5000);
      return;
    }
    
    setSelectedApplicationId(applicationId);
    setShowRejectModal(true);
  };

  const handleRestore = (applicationId) => {
    // Check if club exists in clubs table
    if (clubExistsMap[applicationId]) {
      setWarningMessage("Cannot restore this application - the club has already been created and users may be using it.");
      setTimeout(() => setWarningMessage(""), 5000);
      return;
    }
    
    onRestore(applicationId);
  };  const confirmReject = () => {
    if (rejectionReason.trim()) {
      onReject(selectedApplicationId, rejectionReason.trim());
      setShowRejectModal(false);
      setRejectionReason("");
      setSelectedApplicationId(null);
    }
  };

  const openImageModal = (applicationId, imageType = 'bir') => {
    // Collect all available images for this application in a fixed order
    const images = [];
    const imageTypes = ['bir', 'permit', 'sig', 'id'];
    let clickedImageIndex = 0;
    
    // Build images array and track which one was clicked
    imageTypes.forEach((type, index) => {
      const imageUrl = imageUrls[`${type}_${applicationId}`];
      if (imageUrl) {
        if (type === imageType) {
          clickedImageIndex = images.length; // Set the index of the clicked image
        }
        const altTexts = {
          'bir': 'BIR Registration',
          'permit': 'Business Permit',
          'sig': 'Owner Signature',
          'id': 'Owner ID Card'
        };
        images.push({ src: imageUrl, alt: altTexts[type] });
      }
    });
    
    if (images.length > 0) {
      setModalImage({ 
        isOpen: true, 
        images,
        initialIndex: clickedImageIndex
      });
    } else {
      console.error("No valid images found to display");
    }
  };

  const closeImageModal = () => {
    setModalImage({ isOpen: false, images: [], initialIndex: 0 });
  };

  return (
    <>
      {/* Warning Message */}
      <ErrorDisplay error={warningMessage} />

      <div style={{ overflowX: "auto", position: "relative" }}>
        <table style={{
          width: "100%",
          borderCollapse: "collapse",
          minWidth: 1400,
          background: "#fff"
        }}>
          <thead>
            <tr>
              <th style={{ border: "1px solid #eee", padding: "10px 8px", background: "#fafafa", fontWeight: 600 }}>Application ID</th>
              <th style={{ border: "1px solid #eee", padding: "10px 8px", background: "#fafafa", fontWeight: 600 }}>Club Name</th>
              <th style={{ border: "1px solid #eee", padding: "10px 8px", background: "#fafafa", fontWeight: 600 }}>Establishment Date</th>
              <th style={{ border: "1px solid #eee", padding: "10px 8px", background: "#fafafa", fontWeight: 600 }}>Street Address</th>
              <th style={{ border: "1px solid #eee", padding: "10px 8px", background: "#fafafa", fontWeight: 600 }}>Barangay</th>
              <th style={{ border: "1px solid #eee", padding: "10px 8px", background: "#fafafa", fontWeight: 600 }}>City</th>
              <th style={{ border: "1px solid #eee", padding: "10px 8px", background: "#fafafa", fontWeight: 600 }}>Province</th>
              <th style={{ border: "1px solid #eee", padding: "10px 8px", background: "#fafafa", fontWeight: 600 }}>BIR Registration</th>
              <th style={{ border: "1px solid #eee", padding: "10px 8px", background: "#fafafa", fontWeight: 600 }}>Business Permit</th>
              <th style={{ border: "1px solid #eee", padding: "10px 8px", background: "#fafafa", fontWeight: 600 }}>Owner Signature</th>
              <th style={{ border: "1px solid #eee", padding: "10px 8px", background: "#fafafa", fontWeight: 600 }}>Owner ID Card</th>
              <th style={{ border: "1px solid #eee", padding: "10px 8px", background: "#fafafa", fontWeight: 600 }}>T&C Agreed</th>
              <th style={{ border: "1px solid #eee", padding: "10px 8px", background: "#fafafa", fontWeight: 600 }}>Status</th>
              <th style={{ border: "1px solid #eee", padding: "10px 8px", background: "#fafafa", fontWeight: 600 }}>Club Created</th>
              <th style={{ border: "1px solid #eee", padding: "10px 8px", background: "#fafafa", fontWeight: 600 }}>Rejection Reason</th>
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
                <td colSpan="16" style={{ textAlign: "center", padding: "24px", color: "#888" }}>
                  No applications found for the selected criteria
                </td>
              </tr>
            ) : (
              applications.map((item) => (
                <tr key={item.club_application_id}>
                  <td style={{ border: "1px solid #eee", padding: "8px 6px", fontSize: 13 }}>
                    {item.club_application_id}
                  </td>
                  <td style={{ border: "1px solid #eee", padding: "8px 6px", fontSize: 13 }}>
                    {item.club_name}
                  </td>
                  <td style={{ border: "1px solid #eee", padding: "8px 6px", fontSize: 13 }}>
                    {item.establishment_date}
                  </td>
                  <td style={{ border: "1px solid #eee", padding: "8px 6px", fontSize: 13 }}>
                    {item.street_address}
                  </td>
                  <td style={{ border: "1px solid #eee", padding: "8px 6px", fontSize: 13 }}>
                    {item.barangay}
                  </td>
                  <td style={{ border: "1px solid #eee", padding: "8px 6px", fontSize: 13 }}>
                    {item.city}
                  </td>
                  <td style={{ border: "1px solid #eee", padding: "8px 6px", fontSize: 13 }}>
                    {item.province}
                  </td>                  <td style={{ border: "1px solid #eee", padding: "8px 6px", textAlign: "center" }}>
                    {(() => {
                      const imageKey = `bir_${item.club_application_id}`;
                      const imageUrl = imageUrls[imageKey];
                      
                      return imageUrl ? (
                        <img
                          src={imageUrl}
                          alt="BIR Registration"
                          style={{
                            width: 70,
                            height: 40,
                            objectFit: "cover",
                            borderRadius: 6,
                            cursor: "pointer"
                          }}
                          onClick={() => openImageModal(item.club_application_id, 'bir')}
                        />
                      ) : (
                        <span style={{ color: "#888", fontSize: 12 }}>No document</span>
                      );
                    })()}
                  </td>
                  <td style={{ border: "1px solid #eee", padding: "8px 6px", textAlign: "center" }}>
                    {imageUrls[`permit_${item.club_application_id}`] ? (
                      <img
                        src={imageUrls[`permit_${item.club_application_id}`]}
                        alt="Business Permit"
                        style={{
                          width: 70,
                          height: 40,
                          objectFit: "cover",
                          borderRadius: 6,
                          cursor: "pointer"
                        }}
                        onClick={() => openImageModal(item.club_application_id, 'permit')}
                      />
                    ) : (
                      <span style={{ color: "#888", fontSize: 12 }}>No document</span>
                    )}
                  </td>
                  <td style={{ border: "1px solid #eee", padding: "8px 6px", textAlign: "center" }}>
                    {imageUrls[`sig_${item.club_application_id}`] ? (
                      <img
                        src={imageUrls[`sig_${item.club_application_id}`]}
                        alt="Owner Signature"
                        style={{
                          width: 70,
                          height: 40,
                          objectFit: "cover",
                          borderRadius: 6,
                          cursor: "pointer"
                        }}
                        onClick={() => openImageModal(item.club_application_id, 'sig')}
                      />
                    ) : (
                      <span style={{ color: "#888", fontSize: 12 }}>No signature</span>
                    )}
                  </td>
                  <td style={{ border: "1px solid #eee", padding: "8px 6px", textAlign: "center" }}>
                    {imageUrls[`id_${item.club_application_id}`] ? (
                      <img
                        src={imageUrls[`id_${item.club_application_id}`]}
                        alt="Owner ID Card"
                        style={{
                          width: 70,
                          height: 40,
                          objectFit: "cover",
                          borderRadius: 6,
                          cursor: "pointer"
                        }}
                        onClick={() => openImageModal(item.club_application_id, 'id')}
                      />
                    ) : (
                      <span style={{ color: "#888", fontSize: 12 }}>No ID card</span>
                    )}
                  </td>
                  <td style={{ border: "1px solid #eee", padding: "8px 6px", fontSize: 13, textAlign: "center" }}>
                    {item.agreed_to_tnc ? "Yes" : "No"}
                  </td>
                  <td style={{ border: "1px solid #eee", padding: "8px 6px", fontSize: 13 }}>
                    <StatusBadge status={item.application_status} />
                  </td>
                  <td style={{ border: "1px solid #eee", padding: "8px 6px", fontSize: 13, textAlign: "center" }}>
                    {clubExistsMap[item.club_application_id] ? (
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
                    fontSize: 13,
                    maxWidth: 200,
                    overflowX: "auto",
                    whiteSpace: "nowrap"
                  }}>
                    <div style={{ maxWidth: 200, overflowX: "auto" }}>
                      {item.rejection_reason || "-"}
                    </div>
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
                            background: clubExistsMap[item.club_application_id] ? "#d9d9d9" : "#faad14",
                            color: clubExistsMap[item.club_application_id] ? "#999" : "#fff",
                            border: "none",
                            borderRadius: 6,
                            cursor: clubExistsMap[item.club_application_id] ? "not-allowed" : "pointer"
                          }}
                          onClick={() => handleRestore(item.club_application_id)}
                          disabled={clubExistsMap[item.club_application_id]}
                          title={clubExistsMap[item.club_application_id] ? "Cannot restore - club already exists" : "Restore application"}
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
                            onClick={() => onApprove(item.club_application_id)}
                          >
                            <span style={{ width: "100%", textAlign: "center" }}>Approve</span>
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
                            onClick={() => handleReject(item.club_application_id)}
                          >
                            <span style={{ width: "100%", textAlign: "center" }}>Reject</span>
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

      {/* Rejection Modal */}
      <Modal
        isOpen={showRejectModal}
        onClose={() => {
          setShowRejectModal(false);
          setRejectionReason("");
          setSelectedApplicationId(null);
        }}
        title="Rejection Reason"
        showDefaultButtons={false}
      >
        <textarea
          value={rejectionReason}
          onChange={(e) => setRejectionReason(e.target.value)}
          placeholder="Please provide a reason for rejection..."
          style={{
            width: "100%",
            height: "100px",
            padding: "8px",
            border: "1px solid #d9d9d9",
            borderRadius: "4px",
            fontSize: "14px",
            resize: "vertical"
          }}
        />
        <div style={{ display: "flex", gap: "8px", marginTop: "16px", justifyContent: "flex-end" }}>
          <button
            onClick={() => {
              setShowRejectModal(false);
              setRejectionReason("");
              setSelectedApplicationId(null);
            }}
            style={{
              padding: "8px 16px",
              background: "#fff",
              border: "1px solid #d9d9d9",
              borderRadius: "4px",
              cursor: "pointer"
            }}
          >
            Cancel
          </button>
          <button
            onClick={confirmReject}
            disabled={!rejectionReason.trim()}
            style={{
              padding: "8px 16px",
              background: rejectionReason.trim() ? "#cf1322" : "#f5f5f5",
              color: rejectionReason.trim() ? "#fff" : "#999",
              border: "none",
              borderRadius: "4px",
              cursor: rejectionReason.trim() ? "pointer" : "not-allowed"
            }}
          >
            Reject
          </button>
        </div>      </Modal>      <ZoomableImageViewer
        images={modalImage.images}
        isOpen={modalImage.isOpen}
        onClose={closeImageModal}
        initialIndex={modalImage.initialIndex}
      />
    </>
  );
}
