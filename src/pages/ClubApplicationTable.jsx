import React, { useEffect, useState, useRef } from "react";
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

const TIME_FILTERS = [
  { label: "Today", value: "today" },
  { label: "This Week", value: "week" },
  { label: "This Month", value: "month" },
  { label: "All Time", value: "all" },
];

const STATUS_OPTIONS = [
  { label: "Pending", value: "pending" },
  { label: "Approved", value: "approved" },
  { label: "Rejected", value: "rejected" },
  { label: "All Status", value: "all" },
];

function DropdownButton({
  label,
  options,
  selected,
  open,
  setOpen,
  onSelect,
  dropdownRef
}) {
  const selectedOption = options.find(opt => opt.value === selected);

  return (
    <div style={{ position: "relative" }} ref={dropdownRef}>
      <button
        className="sidebar-btn"
        style={{
          backgroundColor: "var(--primary-color)",
          color: "#fff",
          minWidth: 120,
          marginBottom: 0,
          display: "flex",
          alignItems: "center",
          justifyContent: "space-between",
        }}
        onClick={() => setOpen(prev => !prev)}
        type="button"
        aria-expanded={open}
        aria-haspopup="true"
      >
        {selectedOption?.label || label}
        <span style={{ marginLeft: 8, fontSize: 12 }}>▼</span>
      </button>
      {open && (
        <div
          style={{
            position: "absolute",
            top: "110%",
            left: 0,
            background: "#fff",
            boxShadow: "0 2px 8px rgba(0,0,0,0.12)",
            borderRadius: 6,
            zIndex: 10,
            minWidth: 120,
            padding: "4px 0",
            display: "flex",
            flexDirection: "column"
          }}
        >
          {options.map((opt) => (
            <button
              key={opt.value}
              className="sidebar-btn"
              style={{
                backgroundColor: selected === opt.value ? "var(--primary-color)" : "transparent",
                color: selected === opt.value ? "#fff" : "var(--primary-color)",
                borderRadius: 0,
                width: "100%",
                textAlign: "left",
                marginBottom: 0,
                padding: "10px 16px"
              }}
              onClick={() => {
                onSelect(opt.value);
                setOpen(false);
              }}
              type="button"
            >
              {opt.label}
            </button>
          ))}
        </div>
      )}
    </div>
  );
}

export default function ClubApplicationTable({ buttonStyle }) {
  const [applications, setApplications] = useState([]);
  const [filteredApplications, setFilteredApplications] = useState([]);
  const [modalImage, setModalImage] = useState({ isOpen: false, src: "", alt: "" });
  const [timeFilter, setTimeFilter] = useState("all");
  const [statusFilter, setStatusFilter] = useState("all");
  const [rejectionReason, setRejectionReason] = useState("");
  const [showRejectModal, setShowRejectModal] = useState(false);
  const [selectedApplicationId, setSelectedApplicationId] = useState(null);
  const [imageUrls, setImageUrls] = useState({});

  // Dropdown states
  const [timeDropdownOpen, setTimeDropdownOpen] = useState(false);
  const [statusDropdownOpen, setStatusDropdownOpen] = useState(false);

  // Refs
  const timeDropdownRef = useRef(null);
  const statusDropdownRef = useRef(null);

  useEffect(() => {
    fetchApplications();
  }, []);

  useEffect(() => {
    applyFilters();
  }, [applications, timeFilter, statusFilter]);

  useEffect(() => {
    async function fetchImageUrls() {
      const urls = {};
      
      for (const app of filteredApplications) {
        // BIR Registration image
        if (app.bir_registration_image && !app.bir_registration_image.startsWith('file://')) {
          const { data } = supabase.storage.from('club-documents').getPublicUrl(app.bir_registration_image);
          urls[`bir_${app.club_application_id}`] = data.publicUrl;
          console.log('BIR URL:', data.publicUrl);
        }

        // Business Permit image  
        if (app.business_permit_image && !app.business_permit_image.startsWith('file://')) {
          const { data } = supabase.storage.from('club-documents').getPublicUrl(app.business_permit_image);
          urls[`permit_${app.club_application_id}`] = data.publicUrl;
          console.log('Permit URL:', data.publicUrl);
        }

        // Owner Signature image
        if (app.owner_name_sig_image && !app.owner_name_sig_image.startsWith('file://')) {
          const { data } = supabase.storage.from('club-documents').getPublicUrl(app.owner_name_sig_image);
          urls[`sig_${app.club_application_id}`] = data.publicUrl;
          console.log('Sig URL:', data.publicUrl);
        }

        // Owner ID Card image
        if (app.owner_id_card_image && !app.owner_id_card_image.startsWith('file://')) {
          const { data } = supabase.storage.from('club-documents').getPublicUrl(app.owner_id_card_image);
          urls[`id_${app.club_application_id}`] = data.publicUrl;
          console.log('ID URL:', data.publicUrl);
        }
      }
      
      console.log('All image URLs:', urls);
      setImageUrls(urls);
    }
    
    if (filteredApplications.length > 0) {
      fetchImageUrls();
    }
  }, [filteredApplications]);

  // Handle outside click for dropdowns
  useEffect(() => {
    function handleClickOutside(event) {
      if (timeDropdownRef.current && !timeDropdownRef.current.contains(event.target)) {
        setTimeDropdownOpen(false);
      }
      if (statusDropdownRef.current && !statusDropdownRef.current.contains(event.target)) {
        setStatusDropdownOpen(false);
      }
    }
    const hasOpenDropdown = timeDropdownOpen || statusDropdownOpen;
    if (hasOpenDropdown) {
      document.addEventListener("mousedown", handleClickOutside);
      return () => document.removeEventListener("mousedown", handleClickOutside);
    }
  }, [timeDropdownOpen, statusDropdownOpen]);

  const fetchApplications = async () => {
    const { data, error } = await supabase.from("club_applications").select("*");
    if (error) {
      console.error("Club Applications fetch error:", error.message);
    } else {
      const dataWithStatus = data.map(item => ({
        ...item,
        application_status: item.application_status || 'pending'
      }));
      setApplications(dataWithStatus);
    }
  };

  const applyFilters = () => {
    let filtered = [...applications];

    // Apply time filter
    if (timeFilter !== "all") {
      const now = new Date();
      const startOfToday = new Date(now.getFullYear(), now.getMonth(), now.getDate());
      const startOfWeek = new Date(startOfToday);
      startOfWeek.setDate(startOfToday.getDate() - startOfToday.getDay());
      const startOfMonth = new Date(now.getFullYear(), now.getMonth(), 1);

      filtered = filtered.filter(app => {
        const appDate = new Date(app.created_at);
        switch (timeFilter) {
          case "today":
            return appDate >= startOfToday;
          case "week":
            return appDate >= startOfWeek;
          case "month":
            return appDate >= startOfMonth;
          default:
            return true;
        }
      });
    }

    // Apply status filter
    if (statusFilter !== "all") {
      filtered = filtered.filter(app => app.application_status === statusFilter);
    }

    setFilteredApplications(filtered);
  };

  const updateApplicationStatus = async (applicationId, newStatus, reason = null) => {
    try {
      const updateData = { application_status: newStatus };
      if (reason) {
        updateData.rejection_reason = reason;
      }

      const { error } = await supabase
        .from('club_applications')
        .update(updateData)
        .eq('club_application_id', applicationId);
      
      if (error) throw error;
      
      // Update the applications state
      const updatedApplications = applications.map(item => 
        item.club_application_id === applicationId 
          ? { ...item, application_status: newStatus, rejection_reason: reason || item.rejection_reason } 
          : item
      );
      
      setApplications(updatedApplications);
      
      // Force re-apply filters to update filteredApplications
      const filtered = updatedApplications.filter(app => {
        // Apply time filter
        let passesTimeFilter = true;
        if (timeFilter !== "all") {
          const now = new Date();
          const startOfToday = new Date(now.getFullYear(), now.getMonth(), now.getDate());
          const startOfWeek = new Date(startOfToday);
          startOfWeek.setDate(startOfToday.getDate() - startOfToday.getDay());
          const startOfMonth = new Date(now.getFullYear(), now.getMonth(), 1);

          const appDate = new Date(app.created_at);
          switch (timeFilter) {
            case "today":
              passesTimeFilter = appDate >= startOfToday;
              break;
            case "week":
              passesTimeFilter = appDate >= startOfWeek;
              break;
            case "month":
              passesTimeFilter = appDate >= startOfMonth;
              break;
          }
        }

        // Apply status filter
        const passesStatusFilter = statusFilter === "all" || app.application_status === statusFilter;
        
        return passesTimeFilter && passesStatusFilter;
      });

      setFilteredApplications(filtered);
      
    } catch (error) {
      console.error('Error updating status:', error.message);
    }
  };

  const handleReject = (applicationId) => {
    setSelectedApplicationId(applicationId);
    setShowRejectModal(true);
  };

  const confirmReject = () => {
    if (rejectionReason.trim()) {
      updateApplicationStatus(selectedApplicationId, 'rejected', rejectionReason.trim());
      setShowRejectModal(false);
      setRejectionReason("");
      setSelectedApplicationId(null);
    }
  };

  const resetFilters = () => {
    setTimeFilter("all");
    setStatusFilter("all");
  };

  const openImageModal = (src, alt) => {
    setModalImage({ isOpen: true, src, alt });
  };

  const closeImageModal = () => {
    setModalImage({ isOpen: false, src: "", alt: "" });
  };

  useEffect(() => {
    if (applications.length > 0) {
      console.log('Sample application data:', applications[0]);
      console.log('BIR image path:', applications[0]?.bir_registration_image);
      console.log('Business permit path:', applications[0]?.business_permit_image);
      console.log('Owner sig path:', applications[0]?.owner_name_sig_image);
      console.log('Owner ID path:', applications[0]?.owner_id_card_image);
    }
  }, [applications]);

  return (
    <>
      {/* Controls - Match ProfileReports Design */}
      <div style={{
        display: "flex",
        gap: 12,
        marginBottom: 16,
        alignItems: "center",
        flexWrap: "wrap"
      }}>
        <DropdownButton
          label="All Time"
          options={TIME_FILTERS}
          selected={timeFilter}
          open={timeDropdownOpen}
          setOpen={setTimeDropdownOpen}
          onSelect={setTimeFilter}
          dropdownRef={timeDropdownRef}
        />
        <DropdownButton
          label="All Status"
          options={STATUS_OPTIONS}
          selected={statusFilter}
          open={statusDropdownOpen}
          setOpen={setStatusDropdownOpen}
          onSelect={setStatusFilter}
          dropdownRef={statusDropdownRef}
        />
        <button
          style={{
            background: "#eee",
            color: "#333",
            border: "none",
            borderRadius: 6,
            padding: "7px 16px",
            fontSize: "13px",
            cursor: "pointer",
            marginLeft: 4
          }}
          onClick={resetFilters}
        >
          Reset Filters
        </button>
        <button
          style={{
            background: "#2563eb",
            color: "#fff",
            border: "none",
            borderRadius: 6,
            padding: "7px 16px",
            fontSize: "13px",
            cursor: "pointer",
            marginLeft: 4
          }}
          onClick={fetchApplications}
        >
          Refresh
        </button>
      </div>

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
            {filteredApplications.length === 0 ? (
              <tr>
                <td colSpan="15" style={{ textAlign: "center", padding: "24px", color: "#888" }}>
                  No applications found for the selected criteria
                </td>
              </tr>
            ) : (
              filteredApplications.map((item) => (
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
                    {imageUrls[`bir_${item.club_application_id}`] ? (
                      <img
                        src={imageUrls[`bir_${item.club_application_id}`]}
                        alt="BIR Registration"
                        style={{
                          width: 70,
                          height: 40,
                          objectFit: "cover",
                          borderRadius: 6,
                          cursor: "pointer"
                        }}
                        onClick={() => openImageModal(imageUrls[`bir_${item.club_application_id}`], "BIR Registration")}
                      />
                    ) : (
                      <span style={{ color: "#888", fontSize: 12 }}>No document</span>
                    )}
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
                          onClick={() => updateApplicationStatus(item.club_application_id, 'pending')}
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
                            onClick={() => updateApplicationStatus(item.club_application_id, 'approved')}
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
