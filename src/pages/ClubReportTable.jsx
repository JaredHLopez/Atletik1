import React, { useEffect, useState } from "react";
import supabase from "../helper/supabaseClient";
import ImageModal from "../components/ImageModal";

const statusColors = {
  pending: { background: "#fffbe6", color: "#b59f3b", border: "1px solid #ffe58f" },
  penalized: { background: "#e6ffed", color: "#389e0d", border: "1px solid #b7eb8f" },
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

export default function ClubReportTable({ reports, onPenalize, onReject, onRestore, buttonStyle }) {
  const [imageUrls, setImageUrls] = useState({});
  const [modalImage, setModalImage] = useState({ isOpen: false, src: "", alt: "" });

  useEffect(() => {
    async function fetchImageUrls() {
      const urls = {};
      
      for (const report of reports) {
        console.log('Club Report paths:', {
          profile_image: report.profile_image,
          background_image: report.background_image
        });

        // Fetch profile image - use the complete path from database
        if (report.profile_image) {
          try {
            const { data: profileData, error: profileError } = await supabase
              .storage
              .from('profile-images')
              .getPublicUrl(report.profile_image);
            
            if (!profileError && profileData) {
              urls[`profile_${report.club_id}`] = profileData.publicUrl;
            } else {
              console.error('Club profile image error:', profileError);
            }
          } catch (error) {
            console.error('Error getting club profile image URL:', error);
          }
        }
        
        // Fetch background image - use the complete path from database
        if (report.background_image) {
          try {
            const { data: bgData, error: bgError } = await supabase
              .storage
              .from('background-images')
              .getPublicUrl(report.background_image);
            
            if (!bgError && bgData) {
              urls[`background_${report.club_id}`] = bgData.publicUrl;
            } else {
              console.error('Club background image error:', bgError);
            }
          } catch (error) {
            console.error('Error getting club background image URL:', error);
          }
        }
      }
      
      setImageUrls(urls);
    }
    
    if (reports.length > 0) {
      fetchImageUrls();
    }
  }, [reports]);

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
          minWidth: 1100,
          background: "#fff"
        }}>
          <thead>
            <tr>
              <th style={{ border: "1px solid #eee", padding: "10px 8px", background: "#fafafa", fontWeight: 600 }}>Club Name</th>
              <th style={{ border: "1px solid #eee", padding: "10px 8px", background: "#fafafa", fontWeight: 600, maxWidth: 150 }}>Sports</th>
              <th style={{ border: "1px solid #eee", padding: "10px 8px", background: "#fafafa", fontWeight: 600, maxWidth: 200 }}>Street Address</th>
              <th style={{ border: "1px solid #eee", padding: "10px 8px", background: "#fafafa", fontWeight: 600 }}>Profile Image</th>
              <th style={{ border: "1px solid #eee", padding: "10px 8px", background: "#fafafa", fontWeight: 600 }}>Background Image</th>
              <th style={{ border: "1px solid #eee", padding: "10px 8px", background: "#fafafa", fontWeight: 600 }}>Report Count</th>
              <th style={{ border: "1px solid #eee", padding: "10px 8px", background: "#fafafa", fontWeight: 600 }}>Reasons</th>
              <th style={{ border: "1px solid #eee", padding: "10px 8px", background: "#fafafa", fontWeight: 600 }}>Suspended Until</th>
              <th style={{ border: "1px solid #eee", padding: "10px 8px", background: "#fafafa", fontWeight: 600 }}>Status</th>
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
            {reports.length === 0 ? (
              <tr>
                <td colSpan="10" style={{ textAlign: "center", padding: "24px", color: "#888" }}>
                  No reports found for the selected criteria
                </td>
              </tr>
            ) : (
              reports.map((report) => (
                <tr key={report.club_id}>
                  <td style={{
                    border: "1px solid #eee",
                    padding: "8px 6px",
                    fontSize: 13,
                    maxWidth: 180,
                    overflowX: "auto",
                    whiteSpace: "nowrap"
                  }}>
                    <div style={{ maxWidth: 180, overflowX: "auto" }}>
                      {report.club_name || "Unknown"}
                    </div>
                  </td>
                  <td style={{
                    border: "1px solid #eee",
                    padding: "8px 6px",
                    fontSize: 13,
                    maxWidth: 150,
                    overflowX: "auto",
                    whiteSpace: "nowrap"
                  }}>
                    <div style={{ maxWidth: 150, overflowX: "auto" }}>
                      {report.sports || "Unknown"}
                    </div>
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
                      {report.street_address || "Unknown"}
                    </div>
                  </td>
                  <td style={{ border: "1px solid #eee", padding: "8px 6px", textAlign: "center" }}>
                    {imageUrls[`profile_${report.club_id}`] ? (
                      <img
                        src={imageUrls[`profile_${report.club_id}`]}
                        alt="Club Profile"
                        style={{
                          width: 50,
                          height: 50,
                          objectFit: "cover",
                          borderRadius: "50%",
                          cursor: "pointer"
                        }}
                        onClick={() => openImageModal(imageUrls[`profile_${report.club_id}`], `${report.club_name} Profile Image`)}
                      />
                    ) : (
                      <span style={{ color: "#888", fontSize: 12 }}>No image</span>
                    )}
                  </td>
                  <td style={{ border: "1px solid #eee", padding: "8px 6px", textAlign: "center" }}>
                    {imageUrls[`background_${report.club_id}`] ? (
                      <img
                        src={imageUrls[`background_${report.club_id}`]}
                        alt="Club Background"
                        style={{
                          width: 70,
                          height: 40,
                          objectFit: "cover",
                          borderRadius: 6,
                          cursor: "pointer"
                        }}
                        onClick={() => openImageModal(imageUrls[`background_${report.club_id}`], `${report.club_name} Background Image`)}
                      />
                    ) : (
                      <span style={{ color: "#888", fontSize: 12 }}>No image</span>
                    )}
                  </td>
                  <td style={{ border: "1px solid #eee", padding: "8px 6px", fontSize: 13 }}>
                    {report.reportCount}
                  </td>
                  <td style={{ border: "1px solid #eee", padding: "8px 6px", fontSize: 13 }}>
                    {report.reasons && report.reasons.length > 0 ? (
                      <ul style={{ margin: 0, paddingLeft: 18 }}>
                        {report.reasons.map((reason, idx) => (
                          <li key={idx} style={{ fontSize: 13 }}>{reason}</li>
                        ))}
                      </ul>
                    ) : (
                      <span style={{ color: "#888" }}>No reasons</span>
                    )}
                  </td>
                  <td style={{ border: "1px solid #eee", padding: "8px 6px", fontSize: 13 }}>
                    {report.suspended_until
                      ? new Date(report.suspended_until).toLocaleString()
                      : "Active"}
                  </td>
                  <td style={{ border: "1px solid #eee", padding: "8px 6px", fontSize: 13 }}>
                    <StatusBadge status={report.approval_status || "pending"} />
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
                      {(report.approval_status === "rejected" || report.approval_status === "penalized") ? (
                        <button
                          style={{
                            ...buttonStyle,
                            background: "#faad14",
                            color: "#fff",
                            border: "none",
                            borderRadius: 6,
                            cursor: "pointer"
                          }}
                          onClick={() => onRestore(report.club_id)}
                        >
                          <span style={{ width: "100%", textAlign: "center" }}>Restore</span>
                        </button>
                      ) : (
                        <>
                          <button
                            className="accept-btn"
                            style={{
                              ...buttonStyle,
                              background: "#52c41a",
                              color: "#fff",
                              border: "none",
                              borderRadius: 6,
                              cursor: "pointer"
                            }}
                            onClick={() => onPenalize(report.club_id)}
                          >
                            <span style={{ width: "100%", textAlign: "center" }}>Penalize</span>
                          </button>
                          <button
                            className="decline-btn"
                            style={{
                              ...buttonStyle,
                              background: "#cf1322",
                              color: "#fff",
                              border: "none",
                              borderRadius: 6,
                              cursor: "pointer"
                            }}
                            onClick={() => onReject(report.club_id)}
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

      <ImageModal
        src={modalImage.src}
        alt={modalImage.alt}
        isOpen={modalImage.isOpen}
        onClose={closeImageModal}
      />
    </>
  );
}