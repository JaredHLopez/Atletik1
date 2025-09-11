import React, { useEffect, useState } from "react";
import supabase from "../helper/supabaseClient";
import ImageModal from "../components/ImageModal";

const statusColors = {
  pending: { background: "#fffbe6", color: "#b59f3b", border: "1px solid #ffe58f" },
  accepted: { background: "#e6ffed", color: "#389e0d", border: "1px solid #b7eb8f" },
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

export default function OrganizerApplicationTable({ buttonStyle }) {
  const [applications, setApplications] = useState([]);
  const [modalImage, setModalImage] = useState({ isOpen: false, src: "", alt: "" });

  useEffect(() => {
    fetchApplications();
  }, []);

  const fetchApplications = async () => {
    const { data, error } = await supabase.from("organizer_applications").select("*");
    if (error) {
      console.error("Organizer Applications fetch error:", error.message);
    } else {
      const dataWithStatus = data.map(item => ({
        ...item,
        status: item.status || 'pending'
      }));
      setApplications(dataWithStatus);
    }
  };

  const updateApplicationStatus = async (applicationId, newStatus) => {
    try {
      const { data, error } = await supabase
        .from('organizer_applications')
        .update({ status: newStatus })
        .eq('application_id', applicationId);
      
      if (error) throw error;
      
      setApplications(applications.map(item => 
        item.application_id === applicationId 
          ? { ...item, status: newStatus } 
          : item
      ));
      
    } catch (error) {
      console.error('Error updating status:', error.message);
    }
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
                <td colSpan="10" style={{ textAlign: "center", padding: "24px", color: "#888" }}>
                  No applications found
                </td>
              </tr>
            ) : (
              applications.map((item) => (
                <tr key={item.application_id}>
                  <td style={{ border: "1px solid #eee", padding: "8px 6px", fontSize: 13 }}>
                    {item.application_id}
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
                    <StatusBadge status={item.status} />
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
                      {item.status === "pending" && (
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
                            onClick={() => updateApplicationStatus(item.application_id, 'accepted')}
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
                            onClick={() => updateApplicationStatus(item.application_id, 'rejected')}
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