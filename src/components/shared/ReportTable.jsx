import React, { useEffect, useState } from "react";
import supabase from "../../helper/supabaseClient";
import ZoomableImageViewer from "../ZoomableImageViewer";
import StatusBadge from "./StatusBadge";
import ActionButton from "./ActionButton";

const BASE_TABLE_STYLE = {
  width: "100%",
  borderCollapse: "collapse",
  minWidth: 1100,
  background: "#fff"
};

const BASE_CELL_STYLE = {
  border: "1px solid #eee",
  padding: "8px 6px",
  fontSize: 13
};

const HEADER_STYLE = {
  border: "1px solid #eee",
  padding: "10px 8px",
  background: "#fafafa",
  fontWeight: 600
};

const STICKY_ACTION_STYLE = {
  ...BASE_CELL_STYLE,
  textAlign: "center",
  position: "sticky",
  right: 0,
  background: "#fff",
  zIndex: 9,
  minWidth: 200
};

const STICKY_HEADER_STYLE = {
  ...HEADER_STYLE,
  position: "sticky",
  right: 0,
  zIndex: 10,
  minWidth: 200
};

// Image fetching hook
const useImageUrls = (reports, imageConfig) => {
  const [imageUrls, setImageUrls] = useState({});

  useEffect(() => {
    async function fetchImageUrls() {
      const urls = {};
      
      for (const report of reports) {
        const entityId = report[imageConfig.idField];
        
        // Fetch profile image
        if (report[imageConfig.profileField]) {
          try {
            const { data: profileData, error: profileError } = await supabase
              .storage
              .from(imageConfig.profileBucket)
              .getPublicUrl(report[imageConfig.profileField]);
            
            if (!profileError && profileData) {
              urls[`profile_${entityId}`] = profileData.publicUrl;
            }
          } catch (error) {
            console.error('Error getting profile image URL:', error);
          }
        }
        
        // Fetch background image
        if (report[imageConfig.backgroundField]) {
          try {
            const { data: bgData, error: bgError } = await supabase
              .storage
              .from(imageConfig.backgroundBucket)
              .getPublicUrl(report[imageConfig.backgroundField]);
            
            if (!bgError && bgData) {
              urls[`background_${entityId}`] = bgData.publicUrl;
            }
          } catch (error) {
            console.error('Error getting background image URL:', error);
          }
        }
      }
      
      setImageUrls(urls);
    }
    
    if (reports.length > 0) {
      fetchImageUrls();
    }
  }, [reports, imageConfig]);

  return imageUrls;
};

// Generic report table component
export default function ReportTable({
  reports,
  columns,
  imageConfig,
  onPenalize,
  onReject,
  onRestore,
  buttonStyle = {}
}) {  const imageUrls = useImageUrls(reports, imageConfig);
  const [modalImage, setModalImage] = useState({ 
    isOpen: false, 
    images: [],
    initialIndex: 0
  });

  const openImageModal = (src, alt) => {
    setModalImage({ 
      isOpen: true, 
      images: [{ src, alt }],
      initialIndex: 0
    });
  };

  const closeImageModal = () => {
    setModalImage({ isOpen: false, images: [], initialIndex: 0 });
  };

  const renderImageCell = (report, type, displayName) => {
    const entityId = report[imageConfig.idField];
    const imageUrl = imageUrls[`${type}_${entityId}`];
    
    if (imageUrl) {
      const imageStyle = type === 'profile' 
        ? { width: 50, height: 50, objectFit: "cover", borderRadius: "50%", cursor: "pointer" }
        : { width: 70, height: 40, objectFit: "cover", borderRadius: 6, cursor: "pointer" };
      
      return (
        <img
          src={imageUrl}
          alt={`${type} image`}
          style={imageStyle}
          onClick={() => openImageModal(imageUrl, `${displayName} ${type} Image`)}
        />
      );
    }
    
    return <span style={{ color: "#888", fontSize: 12 }}>No image</span>;
  };

  const renderCell = (report, column) => {
    const { key, render, maxWidth } = column;
    
    if (render) {
      return render(report, { renderImageCell, openImageModal });
    }

    const cellStyle = {
      ...BASE_CELL_STYLE,
      ...(maxWidth && {
        maxWidth,
        overflowX: "auto",
        whiteSpace: "nowrap"
      })
    };

    const value = report[key];
    
    if (key === 'approval_status') {
      return <StatusBadge status={value || "pending"} />;
    }
    
    if (key === 'suspended_until') {
      return value ? new Date(value).toLocaleString() : "Active";
    }
    
    if (key === 'reasons' && Array.isArray(value)) {
      return value.length > 0 ? (
        <ul style={{ margin: 0, paddingLeft: 18 }}>
          {value.map((reason, idx) => (
            <li key={idx} style={{ fontSize: 13 }}>{reason}</li>
          ))}
        </ul>
      ) : (
        <span style={{ color: "#888" }}>No reasons</span>
      );
    }

    if (maxWidth) {
      return (
        <div style={{ maxWidth, overflowX: "auto" }}>
          {value || `No ${key}`}
        </div>
      );
    }

    return value || "N/A";
  };

  const renderActionButtons = (report) => {
    const entityId = report[imageConfig.idField];
    const isRejectedOrPenalized = report.approval_status === "rejected" || report.approval_status === "penalized";

    if (isRejectedOrPenalized) {
      return (
        <ActionButton
          variant="warning"
          onClick={() => onRestore(entityId)}
          style={buttonStyle}
        >
          Restore
        </ActionButton>
      );
    }

    return (
      <div style={{ display: "flex", gap: 8, justifyContent: "center" }}>
        <button
          onClick={() => onPenalize(entityId)}
          style={{
            ...buttonStyle,
            background: "#52c41a",
            color: "#fff",
            border: "none",
            borderRadius: "4px",
            padding: "6px 12px",
            cursor: "pointer",
            fontSize: "14px",
            fontWeight: "500"
          }}
        >
          Penalize
        </button>
        <ActionButton
          variant="danger"
          onClick={() => onReject(entityId)}
          style={buttonStyle}
        >
          Reject
        </ActionButton>
      </div>
    );
  };

  return (
    <>
      <div style={{ overflowX: "auto", position: "relative" }}>
        <table style={BASE_TABLE_STYLE}>
          <thead>
            <tr>
              {columns.map((column, index) => (
                <th key={column.key} style={{
                  ...HEADER_STYLE,
                  ...(column.maxWidth && { maxWidth: column.maxWidth })
                }}>
                  {column.title}
                </th>
              ))}
              <th style={STICKY_HEADER_STYLE}>Actions</th>
            </tr>
          </thead>
          <tbody>
            {reports.length === 0 ? (
              <tr>
                <td colSpan={columns.length + 1} style={{ 
                  textAlign: "center", 
                  padding: "24px", 
                  color: "#888" 
                }}>
                  No reports found for the selected criteria
                </td>
              </tr>
            ) : (
              reports.map((report) => (
                <tr key={report[imageConfig.idField]}>
                  {columns.map((column) => (
                    <td key={column.key} style={{
                      ...BASE_CELL_STYLE,
                      ...(column.maxWidth && {
                        maxWidth: column.maxWidth,
                        overflowX: "auto",
                        whiteSpace: "nowrap"
                      }),
                      ...(column.centerAlign && { textAlign: "center" })
                    }}>
                      {renderCell(report, column)}
                    </td>
                  ))}
                  <td style={STICKY_ACTION_STYLE}>
                    {renderActionButtons(report)}
                  </td>
                </tr>
              ))
            )}
          </tbody>        </table>
      </div>

      <ZoomableImageViewer
        images={modalImage.images}
        isOpen={modalImage.isOpen}
        onClose={closeImageModal}
        initialIndex={modalImage.initialIndex}
      />
    </>
  );
}