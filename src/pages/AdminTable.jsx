import React, { useState, useEffect } from "react";
import supabase from "../helper/supabaseClient";

export default function AdminTable() {
  const [adminData, setAdminData] = useState([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState("");
  const [currentUserId, setCurrentUserId] = useState(null);
  const [showCreateForm, setShowCreateForm] = useState(false);
  const [creating, setCreating] = useState(false);
  const [showOTPModal, setShowOTPModal] = useState(false);
  const [verifyingOTP, setVerifyingOTP] = useState(false);
  const [pendingUserData, setPendingUserData] = useState(null);
  const [createForm, setCreateForm] = useState({
    email: "",
    password: "",
    first_name: "",
    last_name: "",
    middle_initial: ""
  });
  const [otpCode, setOtpCode] = useState("");

  useEffect(() => {
    fetchCurrentUser();
    fetchAdminData();
  }, []);

  const fetchCurrentUser = async () => {
    try {
      const { data: { user } } = await supabase.auth.getUser();
      if (user) {
        setCurrentUserId(user.id);
        console.log("Current logged-in user ID:", user.id);
      }
    } catch (error) {
      console.error("Error fetching current user:", error);
    }
  };

  const fetchAdminData = async () => {
    try {
      setLoading(true);
      setError("");

      const { data: { user } } = await supabase.auth.getUser();
      
      const { data: admins, error: adminError } = await supabase
        .from('admin')
        .select('*');

      if (adminError) {
        console.error("Error fetching admin data:", adminError);
        setError("Failed to fetch admin data: " + adminError.message);
        return;
      }

      const adminWithStatus = admins.map(admin => {
        const isCurrentUser = user && admin.user_id === user.id;
        
        return {
          ...admin,
          last_sign_in_at: isCurrentUser ? user.last_sign_in_at : null,
          is_current_user: isCurrentUser
        };
      });

      setAdminData(adminWithStatus || []);
    } catch (err) {
      console.error("Unexpected error:", err);
      setError("An unexpected error occurred: " + err.message);
    } finally {
      setLoading(false);
    }
  };

  const handleCreateAdmin = async (e) => {
    e.preventDefault();
    setCreating(true);
    setError("");

    try {
      // Validate form
      if (!createForm.email || !createForm.password || !createForm.first_name || !createForm.last_name) {
        setError("Please fill in all required fields");
        setCreating(false);
        return;
      }

      console.log("Creating new admin with:", { 
        email: createForm.email, 
        first_name: createForm.first_name,
        last_name: createForm.last_name 
      });

      // Use regular signUp instead of admin invite
      const { data: authData, error: authError } = await supabase.auth.signUp({
        email: createForm.email,
        password: createForm.password,
        options: {
          emailRedirectTo: `${window.location.origin}/admin`,
          data: {
            first_name: createForm.first_name,
            last_name: createForm.last_name,
            middle_initial: createForm.middle_initial,
            role: 'admin'
          }
        }
      });

      console.log("Signup response:", { 
        user: authData?.user?.id, 
        error: authError?.message 
      });

      if (authError) {
        console.error("Signup error details:", {
          message: authError.message,
          status: authError.status,
          name: authError.name
        });
        
        if (authError.message.includes("already registered") || authError.message.includes("already exists")) {
          setError("This email is already registered. Please use a different email address.");
        } else {
          setError("Failed to create user: " + authError.message);
        }
        setCreating(false);
        return;
      }

      if (!authData?.user) {
        setError("Failed to create user account");
        setCreating(false);
        return;
      }

      console.log("User created successfully, verification email sent to:", createForm.email);

      // Store pending user data for OTP verification
      setPendingUserData({
        userId: authData.user.id,
        email: createForm.email,
        firstName: createForm.first_name,
        lastName: createForm.last_name,
        middleInitial: createForm.middle_initial
      });

      // Show OTP modal
      setShowCreateForm(false);
      setShowOTPModal(true);
      setCreating(false);

    } catch (err) {
      console.error("Unexpected error creating admin:", err);
      setError("An unexpected error occurred: " + err.message);
    } finally {
      setCreating(false);
    }
  };

  const handleVerifyOTP = async () => {
    setVerifyingOTP(true);
    setError("");

    try {
      if (!otpCode || otpCode.length !== 6) {
        setError("Please enter a valid 6-digit OTP");
        setVerifyingOTP(false);
        return;
      }

      console.log("Verifying OTP:", otpCode, "for email:", pendingUserData.email);

      // Verify OTP
      const { data: verifyData, error: verifyError } = await supabase.auth.verifyOtp({
        email: pendingUserData.email,
        token: otpCode,
        type: 'signup'
      });

      if (verifyError) {
        console.error("OTP verification error:", verifyError);
        if (verifyError.message.includes("expired")) {
          setError("OTP has expired. Please create the admin account again to get a new code.");
        } else if (verifyError.message.includes("invalid")) {
          setError("Invalid OTP. Please check the 6-digit code and try again.");
        } else {
          setError("OTP verification failed: " + verifyError.message);
        }
        setVerifyingOTP(false);
        return;
      }

      console.log("OTP verified successfully:", verifyData);

      // Add admin record to admin table
      const { data: adminRecord, error: adminError } = await supabase
        .from('admin')
        .insert([
          {
            user_id: pendingUserData.userId,
            first_name: pendingUserData.firstName,
            last_name: pendingUserData.lastName,
            middle_initial: pendingUserData.middleInitial || null,
            created_at: new Date().toISOString()
          }
        ])
        .select();

      if (adminError) {
        console.error("Admin table error:", adminError);
        setError("User verified but failed to add admin record: " + adminError.message);
        setVerifyingOTP(false);
        return;
      }

      console.log("Admin record created:", adminRecord);

      // Success - reset all forms and refresh data
      setCreateForm({
        email: "",
        password: "",
        first_name: "",
        last_name: "",
        middle_initial: ""
      });
      setOtpCode("");
      setPendingUserData(null);
      setShowOTPModal(false);
      await fetchAdminData();
      
      alert(`✅ Admin created and verified successfully!\nEmail: ${pendingUserData.email}\nName: ${pendingUserData.firstName} ${pendingUserData.lastName}\n\nThe admin can now login with their credentials.`);

    } catch (err) {
      console.error("Unexpected error verifying OTP:", err);
      setError("An unexpected error occurred: " + err.message);
    } finally {
      setVerifyingOTP(false);
    }
  };

  const closeOTPModal = () => {
    setShowOTPModal(false);
    setPendingUserData(null);
    setOtpCode("");
    setError("");
  };

  const getAdminStatus = (admin) => {
    if (admin.is_current_user) {
      return "Active";
    }
    return "Inactive";
  };

  const formatDate = (dateString) => {
    if (!dateString) return "Never";
    const date = new Date(dateString);
    return date.toLocaleDateString() + " " + date.toLocaleTimeString();
  };

  if (loading) {
    return (
      <div style={{ padding: "20px", textAlign: "center" }}>
        <div>Loading admin data...</div>
      </div>
    );
  }

  if (error && !showCreateForm && !showOTPModal) {
    return (
      <div style={{ padding: "20px", textAlign: "center", color: "red" }}>
        <div>{error}</div>
        <button 
          onClick={fetchAdminData}
          style={{
            marginTop: "10px",
            padding: "8px 16px",
            backgroundColor: "#007bff",
            color: "white",
            border: "none",
            borderRadius: "4px",
            cursor: "pointer"
          }}
        >
          Retry
        </button>
      </div>
    );
  }

  return (
    <div style={{ padding: "20px" }}>
      {/* OTP Verification Modal */}
      {showOTPModal && (
        <div style={{
          position: "fixed",
          top: 0,
          left: 0,
          right: 0,
          bottom: 0,
          backgroundColor: "rgba(0, 0, 0, 0.5)",
          display: "flex",
          justifyContent: "center",
          alignItems: "center",
          zIndex: 1000
        }}>
          <div style={{
            backgroundColor: "white",
            padding: "30px",
            borderRadius: "12px",
            boxShadow: "0 10px 25px rgba(0, 0, 0, 0.2)",
            width: "90%",
            maxWidth: "500px",
            textAlign: "center"
          }}>
            <h3 style={{ margin: "0 0 20px 0", color: "#333" }}>📧 Email Verification</h3>
            
            <div style={{
              backgroundColor: "#e3f2fd",
              border: "1px solid #90caf9",
              padding: "15px",
              borderRadius: "8px",
              marginBottom: "20px",
              fontSize: "14px",
              color: "#1565c0",
              textAlign: "left"
            }}>
              <div style={{ fontWeight: "bold", marginBottom: "8px" }}>
                📋 Instructions:
              </div>
              <ol style={{ margin: 0, paddingLeft: "20px", lineHeight: "1.5" }}>
                <li>A 6-digit verification code has been sent to:</li>
                <div style={{ 
                  fontFamily: "monospace", 
                  backgroundColor: "#fff", 
                  padding: "8px", 
                  margin: "5px 0", 
                  borderRadius: "4px",
                  fontWeight: "bold"
                }}>
                  {pendingUserData?.email}
                </div>
                <li>Check the email inbox (and spam folder)</li>
                <li>Enter the 6-digit code below</li>
                <li>Click "Verify" to complete admin creation</li>
              </ol>
            </div>

            {error && (
              <div style={{
                color: "#d32f2f",
                backgroundColor: "#ffebee",
                padding: "12px",
                borderRadius: "6px",
                marginBottom: "20px",
                fontSize: "14px",
                border: "1px solid #ffcdd2"
              }}>
                ❌ {error}
              </div>
            )}

            <div style={{ marginBottom: "25px" }}>
              <label style={{ 
                display: "block", 
                marginBottom: "10px", 
                fontWeight: "600", 
                color: "#333",
                fontSize: "16px"
              }}>
                Enter 6-Digit Verification Code
              </label>
              <input
                type="text"
                value={otpCode}
                onChange={(e) => {
                  const value = e.target.value.replace(/\D/g, '').slice(0, 6);
                  setOtpCode(value);
                }}
                disabled={verifyingOTP}
                maxLength="6"
                pattern="[0-9]{6}"
                style={{
                  width: "250px",
                  padding: "15px 20px",
                  border: "2px solid #e0e0e0",
                  borderRadius: "8px",
                  fontSize: "24px",
                  textAlign: "center",
                  letterSpacing: "4px",
                  fontFamily: "monospace",
                  fontWeight: "bold",
                  outline: "none",
                  transition: "border-color 0.3s"
                }}
                placeholder="123456"
                autoFocus
                onFocus={(e) => e.target.style.borderColor = "#2196f3"}
                onBlur={(e) => e.target.style.borderColor = "#e0e0e0"}
              />
              <div style={{ fontSize: "12px", color: "#666", marginTop: "8px" }}>
                Code expires in 60 minutes
              </div>
            </div>

            <div style={{ display: "flex", gap: "15px", justifyContent: "center" }}>
              <button
                onClick={handleVerifyOTP}
                disabled={verifyingOTP || otpCode.length !== 6}
                style={{
                  padding: "12px 30px",
                  backgroundColor: verifyingOTP || otpCode.length !== 6 ? "#9e9e9e" : "#4caf50",
                  color: "white",
                  border: "none",
                  borderRadius: "8px",
                  cursor: verifyingOTP || otpCode.length !== 6 ? "not-allowed" : "pointer",
                  fontSize: "16px",
                  fontWeight: "600",
                  transition: "background-color 0.3s",
                  minWidth: "140px"
                }}
              >
                {verifyingOTP ? (
                  <>
                    <span style={{ display: "inline-block", animation: "spin 1s linear infinite" }}>⟳</span>
                    {" "}Verifying...
                  </>
                ) : (
                  "✅ Verify & Create"
                )}
              </button>
              
              <button
                onClick={closeOTPModal}
                disabled={verifyingOTP}
                style={{
                  padding: "12px 30px",
                  backgroundColor: "#f44336",
                  color: "white",
                  border: "none",
                  borderRadius: "8px",
                  cursor: verifyingOTP ? "not-allowed" : "pointer",
                  fontSize: "16px",
                  fontWeight: "600",
                  transition: "background-color 0.3s",
                  minWidth: "140px"
                }}
              >
                ❌ Cancel
              </button>
            </div>

            <div style={{ 
              marginTop: "20px", 
              fontSize: "13px", 
              color: "#757575",
              fontStyle: "italic"
            }}>
              💡 If you don't receive the email, check your spam folder or try again
            </div>
          </div>
        </div>
      )}

      <div style={{ 
        display: "flex", 
        justifyContent: "space-between", 
        alignItems: "center", 
        marginBottom: "20px" 
      }}>
        <h2 style={{ margin: 0, color: "#333" }}>Admin Accounts</h2>
        <div style={{ display: "flex", gap: "10px" }}>
          <button
            onClick={() => setShowCreateForm(!showCreateForm)}
            disabled={showOTPModal}
            style={{
              padding: "8px 16px",
              backgroundColor: showOTPModal ? "#9e9e9e" : "#007bff",
              color: "white",
              border: "none",
              borderRadius: "4px",
              cursor: showOTPModal ? "not-allowed" : "pointer",
              fontSize: "14px"
            }}
          >
            {showCreateForm ? "Cancel" : "Create Admin"}
          </button>
          <button
            onClick={fetchAdminData}
            disabled={showOTPModal}
            style={{
              padding: "8px 16px",
              backgroundColor: showOTPModal ? "#9e9e9e" : "#28a745",
              color: "white",
              border: "none",
              borderRadius: "4px",
              cursor: showOTPModal ? "not-allowed" : "pointer",
              fontSize: "14px"
            }}
          >
            Refresh
          </button>
        </div>
      </div>

      {/* Create Admin Form */}
      {showCreateForm && !showOTPModal && (
        <div style={{
          backgroundColor: "#f8f9fa",
          padding: "20px",
          borderRadius: "8px",
          marginBottom: "20px",
          border: "1px solid #dee2e6"
        }}>
          <h3 style={{ margin: "0 0 15px 0", color: "#333" }}>Create New Admin</h3>
          
          <div style={{
            backgroundColor: "#d1ecf1",
            border: "1px solid #bee5eb",
            padding: "15px",
            borderRadius: "4px",
            marginBottom: "15px",
            fontSize: "14px",
            color: "#0c5460"
          }}>
            <div style={{ fontWeight: "bold", marginBottom: "8px" }}>
              📧 How this works:
            </div>
            <ol style={{ margin: 0, paddingLeft: "20px", lineHeight: "1.4" }}>
              <li>You enter the admin's information below</li>
              <li>A verification email with 6-digit code will be sent</li>
              <li>They enter the code to verify the email address</li>
              <li>Admin account is created and they can login immediately</li>
            </ol>
          </div>

          {error && (
            <div style={{
              color: "red",
              backgroundColor: "#f8d7da",
              padding: "10px",
              borderRadius: "4px",
              marginBottom: "15px",
              fontSize: "14px"
            }}>
              ❌ {error}
            </div>
          )}

          <form onSubmit={handleCreateAdmin}>
            <div style={{ display: "grid", gridTemplateColumns: "1fr 1fr", gap: "15px", marginBottom: "15px" }}>
              <div>
                <label style={{ display: "block", marginBottom: "5px", fontWeight: "500" }}>
                  Email Address *
                </label>
                <input
                  type="email"
                  value={createForm.email}
                  onChange={(e) => setCreateForm({...createForm, email: e.target.value})}
                  required
                  disabled={creating}
                  style={{
                    width: "100%",
                    padding: "8px 12px",
                    border: "1px solid #ced4da",
                    borderRadius: "4px",
                    fontSize: "14px"
                  }}
                  placeholder="admin@example.com"
                />
                <div style={{ fontSize: "12px", color: "#666", marginTop: "3px" }}>
                  Verification email will be sent here
                </div>
              </div>
              
              <div>
                <label style={{ display: "block", marginBottom: "5px", fontWeight: "500" }}>
                  Temporary Password *
                </label>
                <input
                  type="password"
                  value={createForm.password}
                  onChange={(e) => setCreateForm({...createForm, password: e.target.value})}
                  required
                  disabled={creating}
                  minLength="6"
                  style={{
                    width: "100%",
                    padding: "8px 12px",
                    border: "1px solid #ced4da",
                    borderRadius: "4px",
                    fontSize: "14px"
                  }}
                  placeholder="Minimum 6 characters"
                />
                <div style={{ fontSize: "12px", color: "#666", marginTop: "3px" }}>
                  They can change this after first login
                </div>
              </div>
            </div>

            <div style={{ display: "grid", gridTemplateColumns: "1fr 1fr 100px", gap: "15px", marginBottom: "20px" }}>
              <div>
                <label style={{ display: "block", marginBottom: "5px", fontWeight: "500" }}>
                  First Name *
                </label>
                <input
                  type="text"
                  value={createForm.first_name}
                  onChange={(e) => setCreateForm({...createForm, first_name: e.target.value})}
                  required
                  disabled={creating}
                  style={{
                    width: "100%",
                    padding: "8px 12px",
                    border: "1px solid #ced4da",
                    borderRadius: "4px",
                    fontSize: "14px"
                  }}
                  placeholder="John"
                />
              </div>
              
              <div>
                <label style={{ display: "block", marginBottom: "5px", fontWeight: "500" }}>
                  Last Name *
                </label>
                <input
                  type="text"
                  value={createForm.last_name}
                  onChange={(e) => setCreateForm({...createForm, last_name: e.target.value})}
                  required
                  disabled={creating}
                  style={{
                    width: "100%",
                    padding: "8px 12px",
                    border: "1px solid #ced4da",
                    borderRadius: "4px",
                    fontSize: "14px"
                  }}
                  placeholder="Doe"
                />
              </div>
              
              <div>
                <label style={{ display: "block", marginBottom: "5px", fontWeight: "500" }}>
                  MI
                </label>
                <input
                  type="text"
                  value={createForm.middle_initial}
                  onChange={(e) => setCreateForm({...createForm, middle_initial: e.target.value})}
                  disabled={creating}
                  maxLength="1"
                  style={{
                    width: "100%",
                    padding: "8px 12px",
                    border: "1px solid #ced4da",
                    borderRadius: "4px",
                    fontSize: "14px",
                    textAlign: "center"
                  }}
                  placeholder="M"
                />
              </div>
            </div>

            <div style={{ display: "flex", gap: "10px" }}>
              <button
                type="submit"
                disabled={creating}
                style={{
                  padding: "10px 20px",
                  backgroundColor: creating ? "#6c757d" : "#28a745",
                  color: "white",
                  border: "none",
                  borderRadius: "4px",
                  cursor: creating ? "not-allowed" : "pointer",
                  fontSize: "14px",
                  fontWeight: "500"
                }}
              >
                {creating ? "📧 Sending Email..." : "📧 Send Verification Email"}
              </button>
              
              <button
                type="button"
                onClick={() => {
                  setShowCreateForm(false);
                  setError("");
                  setCreateForm({
                    email: "",
                    password: "",
                    first_name: "",
                    last_name: "",
                    middle_initial: ""
                  });
                }}
                disabled={creating}
                style={{
                  padding: "10px 20px",
                  backgroundColor: "#6c757d",
                  color: "white",
                  border: "none",
                  borderRadius: "4px",
                  cursor: "pointer",
                  fontSize: "14px"
                }}
              >
                Cancel
              </button>
            </div>
          </form>
        </div>
      )}

      {/* Admin Table */}
      <div style={{ 
        backgroundColor: "white", 
        borderRadius: "8px", 
        overflow: "hidden",
        boxShadow: "0 2px 4px rgba(0,0,0,0.1)"
      }}>
        <table style={{ 
          width: "100%", 
          borderCollapse: "collapse",
          fontSize: "14px"
        }}>
          <thead>
            <tr style={{ backgroundColor: "#f8f9fa" }}>
              <th style={{ 
                border: "1px solid #eee", 
                padding: "12px 8px", 
                textAlign: "left",
                fontWeight: "600",
                color: "#333",
                minWidth: "280px"
              }}>
                Admin ID
              </th>
              <th style={{ 
                border: "1px solid #eee", 
                padding: "12px 8px", 
                textAlign: "left",
                fontWeight: "600",
                color: "#333",
                minWidth: "150px"
              }}>
                First Name
              </th>
              <th style={{ 
                border: "1px solid #eee", 
                padding: "12px 8px", 
                textAlign: "left",
                fontWeight: "600",
                color: "#333",
                minWidth: "120px"
              }}>
                Last Name
              </th>
              <th style={{ 
                border: "1px solid #eee", 
                padding: "12px 8px", 
                textAlign: "center",
                fontWeight: "600",
                color: "#333",
                width: "50px"
              }}>
                MI
              </th>
              <th style={{ 
                border: "1px solid #eee", 
                padding: "12px 8px", 
                textAlign: "center",
                fontWeight: "600",
                color: "#333",
                width: "100px"
              }}>
                Status
              </th>              <th style={{ 
                border: "1px solid #eee", 
                padding: "12px 8px", 
                textAlign: "left",
                fontWeight: "600",
                color: "#333",
                minWidth: "160px"
              }}>
                Created At
              </th>
            </tr>
          </thead>
          <tbody>
            {adminData.length === 0 ? (
              <tr>
                <td 
                  colSpan="6"
                  style={{ 
                    border: "1px solid #eee", 
                    padding: "20px", 
                    textAlign: "center",
                    color: "#666"
                  }}
                >
                  No admin data found
                </td>
              </tr>
            ) : (
              adminData.map((admin, index) => {
                const status = getAdminStatus(admin);
                const isActive = status === "Active";
                
                return (
                  <tr 
                    key={admin.user_id || index} 
                    style={{ 
                      backgroundColor: admin.is_current_user 
                        ? "#e3f2fd"
                        : index % 2 === 0 ? "#fff" : "#f8f9fa"
                    }}
                  >
                    <td style={{ 
                      border: "1px solid #eee", 
                      padding: "8px", 
                      fontSize: "11px",
                      fontFamily: "monospace",
                      wordBreak: "break-all"
                    }}>
                      {admin.user_id || "N/A"}
                      {admin.is_current_user && (
                        <div style={{ 
                          marginTop: "2px", 
                          fontSize: "10px", 
                          color: "#1976d2",
                          fontWeight: "bold"
                        }}>
                          (YOU)
                        </div>
                      )}
                    </td>
                    <td style={{ 
                      border: "1px solid #eee", 
                      padding: "8px",
                      whiteSpace: "nowrap",
                      overflow: "hidden",
                      textOverflow: "ellipsis"
                    }}>
                      {admin.first_name || "N/A"}
                    </td>
                    <td style={{ 
                      border: "1px solid #eee", 
                      padding: "8px",
                      whiteSpace: "nowrap",
                      overflow: "hidden",
                      textOverflow: "ellipsis"
                    }}>
                      {admin.last_name || "N/A"}
                    </td>
                    <td style={{ 
                      border: "1px solid #eee", 
                      padding: "8px",
                      textAlign: "center"
                    }}>
                      {admin.middle_initial || "-"}
                    </td>
                    <td style={{ 
                      border: "1px solid #eee", 
                      padding: "8px",
                      textAlign: "center"
                    }}>
                      <span style={{
                        padding: "4px 8px",
                        borderRadius: "12px",
                        fontSize: "12px",
                        fontWeight: "500",
                        backgroundColor: isActive ? "#d4edda" : "#f8d7da",
                        color: isActive ? "#155724" : "#721c24"
                      }}>
                        {status}
                      </span>
                    </td>                    <td style={{ 
                      border: "1px solid #eee", 
                      padding: "8px",
                      fontSize: "12px",
                      whiteSpace: "nowrap"
                    }}>
                      {formatDate(admin.created_at)}
                    </td>
                  </tr>
                );
              })
            )}
          </tbody>
        </table>
      </div>

      <div style={{ 
        marginTop: "16px", 
        fontSize: "12px", 
        color: "#666",
        textAlign: "center"
      }}>
        Total Admins: {adminData.length} | 
        Active Admins: {adminData.filter(admin => getAdminStatus(admin) === "Active").length}
      </div>

      <style>{`
        @keyframes spin {
          from { transform: rotate(0deg); }
          to { transform: rotate(360deg); }
        }
      `}</style>
    </div>
  );
}