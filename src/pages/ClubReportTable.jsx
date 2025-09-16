import React, { useState, useEffect } from "react";
import supabase from "../helper/supabaseClient";
import ImageModal from "../components/ImageModal";

const statusColors = {
  pending: { background: "#fffbe6", color: "#b59f3b", border: "1px solid #ffe58f" },
  penalized: { background: "#fff1f0", color: "#cf1322", border: "1px solid #ffa39e" },
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
  const [modalImage, setModalImage] = useState({ isOpen: false, src: "", alt: "" });
  const [imageUrls, setImageUrls] = useState({});

  // Fetch image URLs
  useEffect(() => {
    async function fetchImageUrls() {
      const urls = {};
      
      for (const report of reports) {
        // Profile image
        if (report.profile_image) {
          try {
            const { data, error } = await supabase.storage
              .from('profile-images')
              .download(report.profile_image);
            
            if (error) {
              console.error('Error downloading profile image:', error);
            } else {
              const url = URL.createObjectURL(data);
              urls[`profile_${report.club_id}`] = url;
            }
          } catch (error) {
            console.error('Error getting profile image:', error);
          }
        }
        
        // Background image
        if (report.background_image) {
          try {
            const { data, error } = await supabase.storage
              .from('background-images')
              .download(report.background_image);
            
            if (error) {
              console.error('Error downloading background image:', error);
            } else {
              const url = URL.createObjectURL(data);
              urls[`background_${report.club_id}`] = url;
            }
          } catch (error) {
            console.error('Error getting background image:', error);
          }
        }
      }
      
      setImageUrls(urls);
    }
    
    if (reports.length > 0) {
      fetchImageUrls();
    }
  }, [reports]);

  // Cleanup blob URLs when component unmounts
  useEffect(() => {
    return () => {
      Object.values(imageUrls).forEach(url => {
        if (url && url.startsWith('blob:')) {
          URL.revokeObjectURL(url);
        }
      });
    };
  }, [imageUrls]);

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
          minWidth: 1200,
          background: "#fff"
        }}>
          <thead>
            <tr>
              <th style={{ border: "1px solid #eee", padding: "10px 8px", background: "#fafafa", fontWeight: 600 }}>Club Name</th>
              <th style={{ border: "1px solid #eee", padding: "10px 8px", background: "#fafafa", fontWeight: 600 }}>Sports</th>
              <th style={{ border: "1px solid #eee", padding: "10px 8px", background: "#fafafa", fontWeight: 600 }}>Street Address</th>
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
                  No reports found
                </td>
              </tr>
            ) : (
              reports.map((report) => (
                <tr key={report.club_id}>
                  <td style={{ border: "1px solid #eee", padding: "8px 6px", fontSize: 13 }}>
                    <div style={{ maxWidth: 180, overflowX: "auto" }}>
                      {report.club_name || "Unknown"}
                    </div>
                  </td>
                  <td style={{ border: "1px solid #eee", padding: "8px 6px", fontSize: 13 }}>
                    <div style={{ maxWidth: 150, overflowX: "auto" }}>
                      {report.sports || "Unknown"}
                    </div>
                  </td>
                  <td style={{ border: "1px solid #eee", padding: "8px 6px", fontSize: 13 }}>
                    <div style={{ maxWidth: 180, overflowX: "auto" }}>
                      {report.street_address || "Unknown"}
                    </div>
                  </td>
                  <td style={{ border: "1px solid #eee", padding: "8px 6px", textAlign: "center" }}>
                    {imageUrls[`profile_${report.club_id}`] ? (
                      <img
                        src={imageUrls[`profile_${report.club_id}`]}
                        alt={`${report.club_name || "Club"} Profile`}
                        style={{
                          width: 70,
                          height: 40,
                          objectFit: "cover",
                          borderRadius: 6,
                          cursor: "pointer"
                        }}
                        onClick={() => openImageModal(imageUrls[`profile_${report.club_id}`], `${report.club_name || "Club"} Profile Image`)}
                      />
                    ) : (
                      <span style={{ color: "#888", fontSize: 12 }}>No image</span>
                    )}
                  </td>
                  <td style={{ border: "1px solid #eee", padding: "8px 6px", textAlign: "center" }}>
                    {imageUrls[`background_${report.club_id}`] ? (
                      <img
                        src={imageUrls[`background_${report.club_id}`]}
                        alt={`${report.club_name || "Club"} Background`}
                        style={{
                          width: 70,
                          height: 40,
                          objectFit: "cover",
                          borderRadius: 6,
                          cursor: "pointer"
                        }}
                        onClick={() => openImageModal(imageUrls[`background_${report.club_id}`], `${report.club_name || "Club"} Background Image`)}
                      />
                    ) : (
                      <span style={{ color: "#888", fontSize: 12 }}>No image</span>
                    )}
                  </td>
                  <td style={{ border: "1px solid #eee", padding: "8px 6px", fontSize: 13 }}>
                    {report.reportCount}
                  </td>
                  <td style={{ border: "1px solid #eee", padding: "8px 6px", fontSize: 13 }}>
                    <div style={{ maxWidth: 200, overflowX: "auto", whiteSpace: "nowrap" }}>
                      {report.reasons}
                    </div>
                  </td>
                  <td style={{ border: "1px solid #eee", padding: "8px 6px", fontSize: 13 }}>
                    {report.suspended_until}
                  </td>
                  <td style={{ border: "1px solid #eee", padding: "8px 6px", fontSize: 13 }}>
                    <StatusBadge status={report.approval_status} />
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
                      {(report.approval_status === "penalized" || report.approval_status === "rejected") ? (
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
                            style={{
                              ...buttonStyle,
                              border: "none",
                              borderRadius: 6,
                              cursor: "pointer",
                              background: "#52c41a",
                              color: "#fff"
                            }}
                            onClick={() => onPenalize(report.club_id)}
                          >
                            <span style={{ width: "100%", textAlign: "center" }}>Penalize</span>
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
