import React, { useState, useEffect } from "react";
import supabase from "../helper/supabaseClient";
import ImageModal from "../components/ImageModal";

const statusColors = {
  pending: { background: "#fffbe6", color: "#b59f3b", border: "1px solid #ffe58f" },
  approved: { background: "#e6ffed", color: "#389e0d", border: "1px solid #b7eb8f" },
  rejected: { background: "#fff1f0", color: "#cf1322", border: "1px solid #ffa39e" }
};

function StatusBadge({ status }) {
  const style = {
    display: "inline-block",
    padding: "2px 12px",
    borderRadius: 12,
    fontSize: 13,
    fontWeight: 500,
    textTransform: "capitalize",
    ...statusColors[status] || statusColors["pending"]
  };
  return <span style={style}>{status}</span>;
}

export default function ClubApplicationTable({ 
  applications, 
  onApprove, 
  onReject, 
  onRestore, 
  buttonStyle, 
  bucketName 
}) {
  const [modalImage, setModalImage] = useState({ isOpen: false, src: "", alt: "" });
  const [imageUrls, setImageUrls] = useState({});
  const [rejectionReason, setRejectionReason] = useState("");
  const [showRejectModal, setShowRejectModal] = useState(false);
  const [selectedApplicationId, setSelectedApplicationId] = useState(null);

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
    setSelectedApplicationId(applicationId);
    setShowRejectModal(true);
  };

  const confirmReject = () => {
    if (rejectionReason.trim()) {
      onReject(selectedApplicationId, rejectionReason.trim());
      setShowRejectModal(false);
      setRejectionReason("");
      setSelectedApplicationId(null);
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
                <td colSpan="15" style={{ textAlign: "center", padding: "24px", color: "#888" }}>
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
                  </td>
                  <td style={{ border: "1px solid #eee", padding: "8px 6px", textAlign: "center" }}>
                    {(() => {
                      const imageKey = `bir_${item.club_application_id}`;
                      const imageUrl = imageUrls[imageKey];
                      console.log(`Rendering BIR for app ${item.club_application_id}:`);
                      console.log(`- Looking for key: ${imageKey}`);
                      console.log(`- Found URL: ${imageUrl}`);
                      console.log(`- ImageUrls object:`, imageUrls);
                      
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
                          onClick={() => openImageModal(imageUrl, "BIR Registration")}
                          onLoad={() => console.log(`BIR image loaded successfully: ${imageUrl}`)}
                          onError={() => console.log(`BIR image failed to load: ${imageUrl}`)}
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
                        onClick={() => openImageModal(imageUrls[`permit_${item.club_application_id}`], "Business Permit")}
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
                        onClick={() => openImageModal(imageUrls[`sig_${item.club_application_id}`], "Owner Signature")}
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
                        onClick={() => openImageModal(imageUrls[`id_${item.club_application_id}`], "Owner ID Card")}
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
                      {(item.application_status === "approved" || item.application_status === "rejected") ? (
                        <button
                          style={{
                            ...buttonStyle,
                            background: "#faad14",
                            color: "#fff",
                            border: "none",
                            borderRadius: 6,
                            cursor: "pointer"
                          }}
                          onClick={() => onRestore(item.club_application_id)}
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
      {showRejectModal && (
        <div style={{
          position: "fixed",
          top: 0,
          left: 0,
          width: "100vw",
          height: "100vh",
          background: "rgba(0, 0, 0, 0.5)",
          display: "flex",
          alignItems: "center",
          justifyContent: "center",
          zIndex: 1000
        }}>
          <div style={{
            background: "#fff",
            padding: "24px",
            borderRadius: "8px",
            width: "400px",
            maxWidth: "90vw"
          }}>
            <h3 style={{ marginBottom: "16px" }}>Rejection Reason</h3>
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
            </div>
          </div>
        </div>
      )}

      <ImageModal
        src={modalImage.src}
        alt={modalImage.alt}
        isOpen={modalImage.isOpen}
        onClose={closeImageModal}
      />
    </>
  );
}
