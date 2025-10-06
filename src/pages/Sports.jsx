import React, { useState, useEffect } from "react";
import supabase from "../helper/supabaseClient";
import ErrorDisplay from "../components/shared/ErrorDisplay";
import StatusBadge from "../components/shared/StatusBadge";
import Modal from "../components/shared/Modal";

export default function Sports() {
  const [sports, setSports] = useState([]);
  const [removedSports, setRemovedSports] = useState([]);
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState("");
  
  // Filter states
  const [statusFilter, setStatusFilter] = useState("active");
  
  // Modal states
  const [showCreateModal, setShowCreateModal] = useState(false);
  const [showEditModal, setShowEditModal] = useState(false);
  const [showRemoveModal, setShowRemoveModal] = useState(false);
  const [selectedSport, setSelectedSport] = useState(null);
  const [creating, setCreating] = useState(false);
  const [editing, setEditing] = useState(false);
  const [removing, setRemoving] = useState(false);
  const [restoring, setRestoring] = useState(false);
  
  // Form state
  const [formData, setFormData] = useState({
    sport_name: "",
    competition_type: "matchup",
    scoring_type: "none",
    tournament_details: []
  });

  // Tournament details builder state
  const [tournamentFields, setTournamentFields] = useState([]);
  const [newField, setNewField] = useState({
    label: "",
    inputType: "dropdown",
    data: []
  });
  const [currentOption, setCurrentOption] = useState("");

  const buttonStyle = {
    padding: "8px 16px",
    border: "none",
    borderRadius: "4px",
    cursor: "pointer",
    fontSize: "14px",
    fontWeight: "500",
    transition: "background-color 0.2s"
  };

  useEffect(() => {
    fetchSports();
    loadRemovedSports();
  }, []);

  const loadRemovedSports = () => {
    const storedRemoved = localStorage.getItem('removedSports');
    if (storedRemoved) {
      setRemovedSports(JSON.parse(storedRemoved));
    }
  };

  const saveRemovedSports = (removedList) => {
    localStorage.setItem('removedSports', JSON.stringify(removedList));
  };

  const fetchSports = async () => {
    setLoading(true);
    setError("");

    try {
      const { data, error: fetchError } = await supabase
        .from("sports")
        .select("*")
        .order("sport_name");

      if (fetchError) {
        console.error("Supabase error:", fetchError);
        setError(`Failed to fetch sports: ${fetchError.message}`);
        return;
      }

      setSports(data || []);
    } catch (err) {
      console.error("Unexpected error:", err);
      setError("An unexpected error occurred: " + err.message);
    } finally {
      setLoading(false);
    }
  };

  // Get filtered sports based on status and removed list - using sport_name as identifier
  const getFilteredSports = () => {
    const removedNames = removedSports.map(sport => sport.sport_name);
    
    if (statusFilter === "active") {
      return sports.filter(sport => !removedNames.includes(sport.sport_name));
    } else if (statusFilter === "removed") {
      return removedSports;
    } else {
      // "all" - combine both active and removed
      const activeSports = sports.filter(sport => !removedNames.includes(sport.sport_name));
      return [...activeSports, ...removedSports];
    }
  };

  const resetFilters = () => {
    setStatusFilter("active");
  };

  const handleCreateSport = async () => {
    setCreating(true);
    setError("");

    try {
      // Build tournament details in the correct format
      const tournamentDetails = tournamentFields.map(field => {
        const detail = {
          label: field.label,
          inputType: field.inputType
        };

        // Only add data for dropdown type
        if (field.inputType === "dropdown" && field.data && field.data.length > 0) {
          detail.data = field.data;
        }

        return detail;
      });

      const { data, error: insertError } = await supabase
        .from("sports")
        .insert([{
          sport_name: formData.sport_name,
          competition_type: formData.competition_type,
          scoring_type: formData.scoring_type === "none" ? null : formData.scoring_type,
          tournament_details: tournamentDetails
        }])
        .select();

      if (insertError) {
        setError(`Failed to create sport: ${insertError.message}`);
        return;
      }

      setShowCreateModal(false);
      resetForm();
      fetchSports();
    } catch (err) {
      setError("An unexpected error occurred: " + err.message);
    } finally {
      setCreating(false);
    }
  };

  const handleEditSport = (sport) => {
    setSelectedSport(sport);
    // Populate form with selected sport data
    setFormData({
      sport_name: sport.sport_name,
      competition_type: sport.competition_type,
      scoring_type: sport.scoring_type || "none",
      tournament_details: sport.tournament_details || []
    });
    // Populate tournament fields
    setTournamentFields(sport.tournament_details || []);
    setShowEditModal(true);
  };

  const handleUpdateSport = async () => {
    setEditing(true);
    setError("");

    try {
      // Build tournament details in the correct format
      const tournamentDetails = tournamentFields.map(field => {
        const detail = {
          label: field.label,
          inputType: field.inputType
        };

        // Only add data for dropdown type
        if (field.inputType === "dropdown" && field.data && field.data.length > 0) {
          detail.data = field.data;
        }

        return detail;
      });

      const { error: updateError } = await supabase
        .from("sports")
        .update({
          competition_type: formData.competition_type,
          scoring_type: formData.scoring_type === "none" ? null : formData.scoring_type,
          tournament_details: tournamentDetails
        })
        .eq("sport_name", selectedSport.sport_name);

      if (updateError) {
        setError(`Failed to update sport: ${updateError.message}`);
        return;
      }

      // Also update in localStorage if it's in removed sports
      const updatedRemoved = removedSports.map(sport => {
        if (sport.sport_name === selectedSport.sport_name) {
          return {
            ...sport,
            competition_type: formData.competition_type,
            scoring_type: formData.scoring_type === "none" ? null : formData.scoring_type,
            tournament_details: tournamentDetails
          };
        }
        return sport;
      });
      setRemovedSports(updatedRemoved);
      saveRemovedSports(updatedRemoved);

      setShowEditModal(false);
      resetForm();
      setSelectedSport(null);
      fetchSports();
    } catch (err) {
      setError("An unexpected error occurred: " + err.message);
    } finally {
      setEditing(false);
    }
  };

  const handleRemoveSport = (sport) => {
    setSelectedSport(sport);
    setShowRemoveModal(true);
  };

  const confirmRemoveSport = async () => {
    if (!selectedSport) return;

    setRemoving(true);
    setError("");

    try {
      // Delete from database
      const { error: deleteError } = await supabase
        .from("sports")
        .delete()
        .eq("sport_name", selectedSport.sport_name);

      if (deleteError) {
        setError(`Failed to remove sport: ${deleteError.message}`);
        return;
      }

      // Store in localStorage for restore functionality
      const updatedRemoved = [...removedSports, { ...selectedSport, is_removed: true }];
      setRemovedSports(updatedRemoved);
      saveRemovedSports(updatedRemoved);
      
      // Refresh the sports list
      fetchSports();
      
      setShowRemoveModal(false);
      setSelectedSport(null);
    } catch (err) {
      setError("An unexpected error occurred: " + err.message);
    } finally {
      setRemoving(false);
    }
  };

  const handleRestoreSport = async (sport) => {
    setRestoring(true);
    setError("");

    try {
      // Restore to database using upsert to handle duplicates
      const { error: upsertError } = await supabase
        .from("sports")
        .upsert({
          sport_name: sport.sport_name,
          competition_type: sport.competition_type,
          scoring_type: sport.scoring_type,
          tournament_details: sport.tournament_details
        }, {
          onConflict: 'sport_name'
        });

      if (upsertError) {
        setError(`Failed to restore sport: ${upsertError.message}`);
        return;
      }

      // Remove from localStorage removed list
      const updatedRemoved = removedSports.filter(s => s.sport_name !== sport.sport_name);
      setRemovedSports(updatedRemoved);
      saveRemovedSports(updatedRemoved);
      
      // Refresh the sports list
      fetchSports();
    } catch (err) {
      setError("An unexpected error occurred: " + err.message);
    } finally {
      setRestoring(false);
    }
  };

  const resetForm = () => {
    setFormData({
      sport_name: "",
      competition_type: "matchup",
      scoring_type: "none",
      tournament_details: []
    });
    setTournamentFields([]);
    setNewField({
      label: "",
      inputType: "dropdown",
      data: []
    });
    setCurrentOption("");
  };

  // Tournament details builder functions
  const addOption = () => {
    if (currentOption.trim() && !newField.data.includes(currentOption.trim())) {
      setNewField(prev => ({
        ...prev,
        data: [...prev.data, currentOption.trim()]
      }));
      setCurrentOption("");
    }
  };

  const removeOption = (index) => {
    setNewField(prev => ({
      ...prev,
      data: prev.data.filter((_, i) => i !== index)
    }));
  };

  const addTournamentField = () => {
    if (newField.label.trim()) {
      const fieldToAdd = {
        label: newField.label.trim(),
        inputType: newField.inputType
      };

      // Only add data array for dropdown type
      if (newField.inputType === "dropdown" && newField.data.length > 0) {
        fieldToAdd.data = newField.data;
      }

      setTournamentFields(prev => [...prev, fieldToAdd]);
      setNewField({
        label: "",
        inputType: "dropdown",
        data: []
      });
      setCurrentOption("");
    }
  };

  const removeTournamentField = (index) => {
    setTournamentFields(prev => prev.filter((_, i) => i !== index));
  };

  const filteredSports = getFilteredSports();

  return (
    <div style={{ padding: "20px" }}>
      {/* Header */}
      <div style={{ 
        display: "flex", 
        justifyContent: "space-between", 
        alignItems: "center", 
        marginBottom: "20px",
        paddingBottom: "20px",
        borderBottom: "2px solid #e9ecef"
      }}>
        <h1 style={{ 
          color: "#495057", 
          fontSize: "28px", 
          fontWeight: "600", 
          margin: 0 
        }}>
          Sports Management
        </h1>
        <div style={{ display: "flex", gap: "10px" }}>
          <button
            onClick={() => setShowCreateModal(true)}
            style={{
              ...buttonStyle,
              backgroundColor: "#007bff",
              color: "white"
            }}
          >
            Add Sport
          </button>
          <button
            onClick={fetchSports}
            style={{
              ...buttonStyle,
              backgroundColor: "#28a745",
              color: "white"
            }}
          >
            Refresh
          </button>
        </div>
      </div>

      {/* Filters */}
      <div style={{ 
        display: "flex", 
        gap: "10px", 
        marginBottom: "20px",
        alignItems: "center",
        flexWrap: "wrap"
      }}>
        <button
          onClick={() => setStatusFilter("active")}
          style={{
            ...buttonStyle,
            backgroundColor: statusFilter === "active" ? "#6c5ce7" : "#f8f9fa",
            color: statusFilter === "active" ? "white" : "#495057",
            border: "1px solid #dee2e6"
          }}
        >
          Active
        </button>
        
        <button
          onClick={() => setStatusFilter("removed")}
          style={{
            ...buttonStyle,
            backgroundColor: statusFilter === "removed" ? "#6c5ce7" : "#f8f9fa",
            color: statusFilter === "removed" ? "white" : "#495057",
            border: "1px solid #dee2e6"
          }}
        >
          Removed
        </button>
        
        <button
          onClick={() => setStatusFilter("all")}
          style={{
            ...buttonStyle,
            backgroundColor: statusFilter === "all" ? "#6c5ce7" : "#f8f9fa",
            color: statusFilter === "all" ? "white" : "#495057",
            border: "1px solid #dee2e6"
          }}
        >
          All
        </button>

        <button
          onClick={resetFilters}
          style={{
            ...buttonStyle,
            backgroundColor: "#6c757d",
            color: "white"
          }}
        >
          Reset Filters
        </button>
      </div>

      <ErrorDisplay error={error} onClose={() => setError("")} />

      {/* Sports Table */}
      {loading ? (
        <div style={{ textAlign: "center", padding: "20px" }}>
          <p>Loading sports...</p>
        </div>
      ) : (
        <div style={{ 
          background: "#fff",
          border: "1px solid #dee2e6",
          borderRadius: "8px",
          overflow: "hidden"
        }}>
          <table style={{ width: "100%", borderCollapse: "collapse" }}>
            <thead>
              <tr style={{ backgroundColor: "#f8f9fa" }}>
                <th style={{ padding: "12px", textAlign: "left", border: "1px solid #dee2e6", fontWeight: "600" }}>
                  Sport Name
                </th>
                <th style={{ padding: "12px", textAlign: "left", border: "1px solid #dee2e6", fontWeight: "600" }}>
                  Competition Type
                </th>
                <th style={{ padding: "12px", textAlign: "left", border: "1px solid #dee2e6", fontWeight: "600" }}>
                  Scoring Type
                </th>
                <th style={{ padding: "12px", textAlign: "left", border: "1px solid #dee2e6", fontWeight: "600" }}>
                  Tournament Details
                </th>
                <th style={{ padding: "12px", textAlign: "center", border: "1px solid #dee2e6", fontWeight: "600" }}>
                  Status
                </th>
                <th style={{ padding: "12px", textAlign: "center", border: "1px solid #dee2e6", fontWeight: "600" }}>
                  Actions
                </th>
              </tr>
            </thead>
            <tbody>
              {filteredSports.length === 0 ? (
                <tr>
                  <td colSpan="6" style={{ padding: "20px", textAlign: "center", color: "#6c757d" }}>
                    No sports found.
                  </td>
                </tr>
              ) : (
                filteredSports.map((sport, index) => (
                  <tr key={sport.sport_name || index} style={{ 
                    backgroundColor: index % 2 === 0 ? "#fff" : "#f8f9fa" 
                  }}>
                    <td style={{ padding: "12px", border: "1px solid #dee2e6", fontWeight: "500" }}>
                      {sport.sport_name}
                    </td>
                    <td style={{ padding: "12px", border: "1px solid #dee2e6" }}>
                      <span style={{
                        padding: "4px 8px",
                        borderRadius: "4px",
                        fontSize: "12px",
                        fontWeight: "500",
                        backgroundColor: sport.competition_type === "matchup" ? "#e3f2fd" : "#fff3e0",
                        color: sport.competition_type === "matchup" ? "#1976d2" : "#f57c00"
                      }}>
                        {sport.competition_type || "N/A"}
                      </span>
                    </td>
                    <td style={{ padding: "12px", border: "1px solid #dee2e6" }}>
                      <span style={{
                        padding: "4px 8px",
                        borderRadius: "4px",
                        fontSize: "12px",
                        fontWeight: "500",
                        backgroundColor: sport.scoring_type ? "#f3e5f5" : "#e8f5e8",
                        color: sport.scoring_type ? "#7b1fa2" : "#388e3c"
                      }}>
                        {sport.scoring_type || "None"}
                      </span>
                    </td>
                    <td style={{ padding: "12px", border: "1px solid #dee2e6" }}>
                      {sport.tournament_details && Array.isArray(sport.tournament_details) && sport.tournament_details.length > 0 ? (
                        <div style={{ maxHeight: "100px", overflowY: "auto" }}>
                          {sport.tournament_details.map((detail, detailIndex) => (
                            <div key={detailIndex} style={{ marginBottom: "4px", fontSize: "12px" }}>
                              <strong>{detail.label}:</strong>{" "}
                              <span style={{ color: "#6c757d" }}>
                                {detail.inputType}
                                {detail.inputType === "dropdown" && detail.data ? ` (${detail.data.length} options)` : ""}
                              </span>
                            </div>
                          ))}
                        </div>
                      ) : (
                        <span style={{ color: "#6c757d", fontStyle: "italic", fontSize: "12px" }}>
                          No details
                        </span>
                      )}
                    </td>
                    <td style={{ padding: "12px", border: "1px solid #dee2e6", textAlign: "center" }}>
                      <StatusBadge status={sport.is_removed ? "removed" : "active"} />
                    </td>
                    <td style={{ padding: "12px", border: "1px solid #dee2e6", textAlign: "center" }}>
                      {sport.is_removed ? (
                        <div style={{ display: "flex", gap: "5px", justifyContent: "center" }}>
                          <button
                            onClick={() => handleEditSport(sport)}
                            style={{
                              ...buttonStyle,
                              backgroundColor: "#ffc107",
                              color: "white",
                              fontSize: "11px",
                              padding: "6px 10px"
                            }}
                          >
                            Edit
                          </button>
                          <button
                            onClick={() => handleRestoreSport(sport)}
                            disabled={restoring}
                            style={{
                              ...buttonStyle,
                              backgroundColor: restoring ? "#ccc" : "#28a745",
                              color: "white",
                              fontSize: "11px",
                              padding: "6px 10px"
                            }}
                          >
                            {restoring ? "Restoring..." : "Restore"}
                          </button>
                        </div>
                      ) : (
                        <div style={{ display: "flex", gap: "5px", justifyContent: "center" }}>
                          <button
                            onClick={() => handleEditSport(sport)}
                            style={{
                              ...buttonStyle,
                              backgroundColor: "#ffc107",
                              color: "white",
                              fontSize: "11px",
                              padding: "6px 10px"
                            }}
                          >
                            Edit
                          </button>
                          <button
                            onClick={() => handleRemoveSport(sport)}
                            disabled={removing}
                            style={{
                              ...buttonStyle,
                              backgroundColor: "#dc3545",
                              color: "white",
                              fontSize: "11px",
                              padding: "6px 10px"
                            }}
                          >
                            Remove
                          </button>
                        </div>
                      )}
                    </td>
                  </tr>
                ))
              )}
            </tbody>
          </table>
        </div>
      )}

      {/* Create Sport Modal - Compact Layout */}
      <Modal
        isOpen={showCreateModal}
        title="Add New Sport"
        showDefaultButtons={false}
        width="450px"
        onClose={() => {
          setShowCreateModal(false);
          resetForm();
        }}
      >
        <div style={{ 
          padding: "0",
          boxSizing: "border-box"
        }}>
          {/* Basic Info Section - Compact */}
          <div style={{
            marginBottom: "14px",
            padding: "12px",
            backgroundColor: "#f8f9fa",
            borderRadius: "6px",
            border: "1px solid #e9ecef"
          }}>
            <div style={{ marginBottom: "10px" }}>
              <label style={{ display: "block", marginBottom: "4px", fontWeight: "600", color: "#495057", fontSize: "13px" }}>
                Sport Name *
              </label>
              <input
                type="text"
                value={formData.sport_name}
                onChange={(e) => setFormData(prev => ({ ...prev, sport_name: e.target.value }))}
                style={{
                  width: "100%",
                  padding: "7px 9px",
                  border: "1px solid #ced4da",
                  borderRadius: "4px",
                  fontSize: "13px",
                  boxSizing: "border-box"
                }}
                placeholder="Enter sport name"
              />
            </div>

            <div style={{ marginBottom: "10px" }}>
              <label style={{ display: "block", marginBottom: "4px", fontWeight: "600", color: "#495057", fontSize: "13px" }}>
                Competition Type *
              </label>
              <select
                value={formData.competition_type}
                onChange={(e) => setFormData(prev => ({ ...prev, competition_type: e.target.value }))}
                style={{
                  width: "100%",
                  padding: "7px 9px",
                  border: "1px solid #ced4da",
                  borderRadius: "4px",
                  fontSize: "13px",
                  boxSizing: "border-box"
                }}
              >
                <option value="matchup">Matchup</option>
                <option value="race">Race</option>
              </select>
            </div>

            <div>
              <label style={{ display: "block", marginBottom: "4px", fontWeight: "600", color: "#495057", fontSize: "13px" }}>
                Scoring Type *
              </label>
              <select
                value={formData.scoring_type}
                onChange={(e) => setFormData(prev => ({ ...prev, scoring_type: e.target.value }))}
                style={{
                  width: "100%",
                  padding: "7px 9px",
                  border: "1px solid #ced4da",
                  borderRadius: "4px",
                  fontSize: "13px",
                  boxSizing: "border-box"
                }}
              >
                <option value="none">None</option>
                <option value="set">Set</option>
                <option value="total">Total</option>
              </select>
            </div>
          </div>

          {/* Tournament Details Builder */}
          <div style={{ marginBottom: "18px" }}>
            <h4 style={{ 
              marginBottom: "12px", 
              color: "#495057", 
              fontSize: "15px",
              borderBottom: "1px solid #e9ecef",
              paddingBottom: "6px"
            }}>
              Tournament Details
            </h4>
            
            {/* Add New Field - Vertical */}
            <div style={{ 
              padding: "12px", 
              border: "1px solid #e9ecef", 
              borderRadius: "6px", 
              backgroundColor: "#ffffff",
              marginBottom: "12px"
            }}>
              {/* Field Label */}
              <div style={{ marginBottom: "10px" }}>
                <label style={{ display: "block", marginBottom: "4px", fontSize: "12px", fontWeight: "600", color: "#495057" }}>
                  Field Label
                </label>
                <input
                  type="text"
                  value={newField.label}
                  onChange={(e) => setNewField(prev => ({ ...prev, label: e.target.value }))}
                  style={{
                    width: "100%",
                    padding: "6px 8px",
                    border: "1px solid #ced4da",
                    borderRadius: "4px",
                    fontSize: "12px",
                    boxSizing: "border-box"
                  }}
                  placeholder="e.g., periods, gender, eliminationType"
                />
              </div>

              {/* Input Type and Add Button */}
              <div style={{ display: "flex", gap: "8px", marginBottom: "10px" }}>
                <div style={{ flex: 1 }}>
                  <label style={{ display: "block", marginBottom: "4px", fontSize: "12px", fontWeight: "600", color: "#495057" }}>
                    Input Type
                  </label>
                  <select
                    value={newField.inputType}
                    onChange={(e) => setNewField(prev => ({ 
                      ...prev, 
                      inputType: e.target.value,
                      data: e.target.value === "dropdown" ? prev.data : []
                    }))}
                    style={{
                      width: "100%",
                      padding: "6px 8px",
                      border: "1px solid #ced4da",
                      borderRadius: "4px",
                      fontSize: "12px",
                      boxSizing: "border-box"
                    }}
                  >
                    <option value="dropdown">Dropdown</option>
                    <option value="text">Text</option>
                    <option value="map">Map</option>
                  </select>
                </div>

                <div style={{ display: "flex", alignItems: "end" }}>
                  <button
                    type="button"
                    onClick={addTournamentField}
                    disabled={!newField.label.trim()}
                    style={{
                      padding: "6px 12px",
                      backgroundColor: "#28a745",
                      color: "white",
                      border: "none",
                      borderRadius: "4px",
                      fontSize: "12px",
                      cursor: "pointer",
                      opacity: !newField.label.trim() ? 0.5 : 1,
                      minWidth: "70px"
                    }}
                  >
                    Add Field
                  </button>
                </div>
              </div>

              {/* Options Section - Only for dropdown */}
              {newField.inputType === "dropdown" && (
                <div>
                  <label style={{ display: "block", marginBottom: "4px", fontSize: "12px", fontWeight: "600", color: "#495057" }}>
                    Dropdown Options
                  </label>
                  <div style={{ display: "flex", gap: "8px", marginBottom: "8px" }}>
                    <input
                      type="text"
                      value={currentOption}
                      onChange={(e) => setCurrentOption(e.target.value)}
                      onKeyPress={(e) => e.key === "Enter" && addOption()}
                      style={{
                        flex: 1,
                        padding: "6px 8px",
                        border: "1px solid #ced4da",
                        borderRadius: "4px",
                        fontSize: "12px"
                      }}
                      placeholder="Add option"
                    />
                    <button
                      type="button"
                      onClick={addOption}
                      style={{
                        padding: "6px 12px",
                        backgroundColor: "#007bff",
                        color: "white",
                        border: "none",
                        borderRadius: "4px",
                        fontSize: "12px",
                        cursor: "pointer"
                      }}
                    >
                      Add
                    </button>
                  </div>
                  {newField.data.length > 0 && (
                    <div style={{ display: "flex", flexWrap: "wrap", gap: "4px" }}>
                      {newField.data.map((option, index) => (
                        <span
                          key={index}
                          style={{
                            display: "inline-flex",
                            alignItems: "center",
                            padding: "3px 6px",
                            backgroundColor: "#e9ecef",
                            borderRadius: "12px",
                            fontSize: "10px",
                            gap: "4px"
                          }}
                        >
                          {option}
                          <button
                            onClick={() => removeOption(index)}
                            style={{
                              background: "none",
                              border: "none",
                              color: "#dc3545",
                              cursor: "pointer",
                              fontSize: "12px",
                              padding: 0
                            }}
                          >
                            ×
                          </button>
                        </span>
                      ))}
                    </div>
                  )}
                </div>
              )}
            </div>

            {/* Current Fields - Compact List */}
            {tournamentFields.length > 0 && (
              <div>
                <h5 style={{ margin: "0 0 8px 0", fontSize: "13px", color: "#495057", fontWeight: "600" }}>
                  Fields ({tournamentFields.length})
                </h5>
                <div style={{
                  maxHeight: "120px",
                  overflowY: "auto",
                  padding: "8px",
                  backgroundColor: "#f8f9fa",
                  borderRadius: "4px",
                  border: "1px solid #e9ecef"
                }}>
                  {tournamentFields.map((field, index) => (
                    <div
                      key={index}
                      style={{
                        display: "flex",
                        justifyContent: "space-between",
                        alignItems: "center",
                        padding: "6px 8px",
                        marginBottom: "4px",
                        border: "1px solid #dee2e6",
                        borderRadius: "4px",
                        backgroundColor: "#fff",
                        fontSize: "11px"
                      }}
                    >
                      <div>
                        <span style={{ fontWeight: "600" }}>{field.label}</span>
                        <span style={{ marginLeft: "8px", color: "#6c757d" }}>
                          ({field.inputType}{field.inputType === "dropdown" && field.data && field.data.length > 0 && `, ${field.data.length} options`})
                        </span>
                      </div>
                      <button
                        onClick={() => removeTournamentField(index)}
                        style={{
                          background: "none",
                          border: "none",
                          color: "#dc3545",
                          cursor: "pointer",
                          fontSize: "14px",
                          padding: "2px"
                        }}
                      >
                        ×
                      </button>
                    </div>
                  ))}
                </div>
              </div>
            )}
          </div>

          {/* Footer Buttons */}
          <div style={{ 
            display: "flex", 
            gap: "10px", 
            justifyContent: "flex-end",
            paddingTop: "16px",
            borderTop: "1px solid #e9ecef"
          }}>
            <button
              onClick={() => {
                setShowCreateModal(false);
                resetForm();
              }}
              style={{
                ...buttonStyle,
                backgroundColor: "#6c757d",
                color: "white",
                padding: "10px 20px"
              }}
            >
              Cancel
            </button>
            <button
              onClick={handleCreateSport}
              disabled={creating || !formData.sport_name.trim()}
              style={{
                ...buttonStyle,
                backgroundColor: creating || !formData.sport_name.trim() ? "#ccc" : "#007bff",
                color: "white",
                padding: "10px 20px"
              }}
            >
              {creating ? "Creating..." : "Create Sport"}
            </button>
          </div>
        </div>
      </Modal>

      {/* Edit Sport Modal */}
      <Modal
        isOpen={showEditModal}
        title={`Edit Sport: ${selectedSport?.sport_name}`}
        showDefaultButtons={false}
        width="450px"
        onClose={() => {
          setShowEditModal(false);
          resetForm();
          setSelectedSport(null);
        }}
      >
        <div style={{ 
          padding: "0",
          width: "100%",
          boxSizing: "border-box"
        }}>
          {/* Basic Info Section - Vertical */}
          <div style={{
            marginBottom: "14px",
            padding: "12px",
            backgroundColor: "#f8f9fa",
            borderRadius: "6px",
            border: "1px solid #e9ecef"
          }}>
            <div style={{ marginBottom: "10px" }}>
              <label style={{ display: "block", marginBottom: "4px", fontWeight: "600", color: "#495057", fontSize: "13px" }}>
                Sport Name (Cannot be changed)
              </label>
              <input
                type="text"
                value={formData.sport_name}
                disabled
                style={{
                  width: "100%",
                  padding: "8px 10px",
                  border: "1px solid #ced4da",
                  borderRadius: "4px",
                  fontSize: "13px",
                  boxSizing: "border-box",
                  backgroundColor: "#e9ecef",
                  color: "#6c757d"
                }}
              />
            </div>

            <div>
              <label style={{ display: "block", marginBottom: "4px", fontWeight: "600", color: "#495057", fontSize: "13px" }}>
                Competition Type *
              </label>
              <select
                value={formData.competition_type}
                onChange={(e) => setFormData(prev => ({ ...prev, competition_type: e.target.value }))}
                style={{
                  width: "100%",
                  padding: "8px 10px",
                  border: "1px solid #ced4da",
                  borderRadius: "4px",
                  fontSize: "13px",
                  boxSizing: "border-box"
                }}
              >
                <option value="matchup">Matchup</option>
                <option value="race">Race</option>
              </select>
            </div>

            <div style={{ marginTop: "10px" }}>
              <label style={{ display: "block", marginBottom: "4px", fontWeight: "600", color: "#495057", fontSize: "13px" }}>
                Scoring Type *
              </label>
              <select
                value={formData.scoring_type}
                onChange={(e) => setFormData(prev => ({ ...prev, scoring_type: e.target.value }))}
                style={{
                  width: "100%",
                  padding: "8px 10px",
                  border: "1px solid #ced4da",
                  borderRadius: "4px",
                  fontSize: "13px",
                  boxSizing: "border-box"
                }}
              >
                <option value="none">None</option>
                <option value="set">Set</option>
                <option value="total">Total</option>
              </select>
            </div>
          </div>

          {/* Tournament Details Builder */}
          <div style={{ marginBottom: "14px" }}>
            <h4 style={{ 
              marginBottom: "10px", 
              color: "#495057", 
              fontSize: "14px",
              borderBottom: "1px solid #e9ecef",
              paddingBottom: "5px"
            }}>
              Tournament Details
            </h4>
            
            {/* Add New Field - Vertical */}
            <div style={{ 
              padding: "12px", 
              border: "1px solid #e9ecef", 
              borderRadius: "6px", 
              backgroundColor: "#ffffff",
              marginBottom: "12px"
            }}>
              {/* Field Label */}
              <div style={{ marginBottom: "10px" }}>
                <label style={{ display: "block", marginBottom: "4px", fontSize: "12px", fontWeight: "600", color: "#495057" }}>
                  Field Label
                </label>
                <input
                  type="text"
                  value={newField.label}
                  onChange={(e) => setNewField(prev => ({ ...prev, label: e.target.value }))}
                  style={{
                    width: "100%",
                    padding: "6px 8px",
                    border: "1px solid #ced4da",
                    borderRadius: "4px",
                    fontSize: "12px",
                    boxSizing: "border-box"
                  }}
                  placeholder="e.g., periods, gender, eliminationType"
                />
              </div>

              {/* Input Type and Add Button */}
              <div style={{ display: "flex", gap: "8px", marginBottom: "10px" }}>
                <div style={{ flex: 1 }}>
                  <label style={{ display: "block", marginBottom: "4px", fontSize: "12px", fontWeight: "600", color: "#495057" }}>
                    Input Type
                  </label>
                  <select
                    value={newField.inputType}
                    onChange={(e) => setNewField(prev => ({ 
                      ...prev, 
                      inputType: e.target.value,
                      data: e.target.value === "dropdown" ? prev.data : []
                    }))}
                    style={{
                      width: "100%",
                      padding: "6px 8px",
                      border: "1px solid #ced4da",
                      borderRadius: "4px",
                      fontSize: "12px",
                      boxSizing: "border-box"
                    }}
                  >
                    <option value="dropdown">Dropdown</option>
                    <option value="text">Text</option>
                    <option value="map">Map</option>
                  </select>
                </div>

                <div style={{ display: "flex", alignItems: "end" }}>
                  <button
                    type="button"
                    onClick={addTournamentField}
                    disabled={!newField.label.trim()}
                    style={{
                      padding: "6px 12px",
                      backgroundColor: "#28a745",
                      color: "white",
                      border: "none",
                      borderRadius: "4px",
                      fontSize: "12px",
                      cursor: "pointer",
                      opacity: !newField.label.trim() ? 0.5 : 1,
                      minWidth: "70px"
                    }}
                  >
                    Add Field
                  </button>
                </div>
              </div>

              {/* Options Section - Only for dropdown */}
              {newField.inputType === "dropdown" && (
                <div>
                  <label style={{ display: "block", marginBottom: "4px", fontSize: "12px", fontWeight: "600", color: "#495057" }}>
                    Dropdown Options
                  </label>
                  <div style={{ display: "flex", gap: "8px", marginBottom: "8px" }}>
                    <input
                      type="text"
                      value={currentOption}
                      onChange={(e) => setCurrentOption(e.target.value)}
                      onKeyPress={(e) => e.key === "Enter" && addOption()}
                      style={{
                        flex: 1,
                        padding: "6px 8px",
                        border: "1px solid #ced4da",
                        borderRadius: "4px",
                        fontSize: "12px"
                      }}
                      placeholder="Add option"
                    />
                    <button
                      type="button"
                      onClick={addOption}
                      style={{
                        padding: "6px 12px",
                        backgroundColor: "#007bff",
                        color: "white",
                        border: "none",
                        borderRadius: "4px",
                        fontSize: "12px",
                        cursor: "pointer"
                      }}
                    >
                      Add
                    </button>
                  </div>
                  {newField.data.length > 0 && (
                    <div style={{ display: "flex", flexWrap: "wrap", gap: "4px" }}>
                      {newField.data.map((option, index) => (
                        <span
                          key={index}
                          style={{
                            display: "inline-flex",
                            alignItems: "center",
                            padding: "3px 6px",
                            backgroundColor: "#e9ecef",
                            borderRadius: "12px",
                            fontSize: "10px",
                            gap: "4px"
                          }}
                        >
                          {option}
                          <button
                            onClick={() => removeOption(index)}
                            style={{
                              background: "none",
                              border: "none",
                              color: "#dc3545",
                              cursor: "pointer",
                              fontSize: "12px",
                              padding: 0
                            }}
                          >
                            ×
                          </button>
                        </span>
                      ))}
                    </div>
                  )}
                </div>
              )}
            </div>

            {/* Current Fields - Compact List */}
            {tournamentFields.length > 0 && (
              <div>
                <h5 style={{ margin: "0 0 8px 0", fontSize: "13px", color: "#495057", fontWeight: "600" }}>
                  Fields ({tournamentFields.length})
                </h5>
                <div style={{
                  maxHeight: "120px",
                  overflowY: "auto",
                  padding: "8px",
                  backgroundColor: "#f8f9fa",
                  borderRadius: "4px",
                  border: "1px solid #e9ecef"
                }}>
                  {tournamentFields.map((field, index) => (
                    <div
                      key={index}
                      style={{
                        display: "flex",
                        justifyContent: "space-between",
                        alignItems: "center",
                        padding: "6px 8px",
                        marginBottom: "4px",
                        border: "1px solid #dee2e6",
                        borderRadius: "4px",
                        backgroundColor: "#fff",
                        fontSize: "11px"
                      }}
                    >
                      <div>
                        <span style={{ fontWeight: "600" }}>{field.label}</span>
                        <span style={{ marginLeft: "8px", color: "#6c757d" }}>
                          ({field.inputType}{field.inputType === "dropdown" && field.data && field.data.length > 0 && `, ${field.data.length} options`})
                        </span>
                      </div>
                      <button
                        onClick={() => removeTournamentField(index)}
                        style={{
                          background: "none",
                          border: "none",
                          color: "#dc3545",
                          cursor: "pointer",
                          fontSize: "14px",
                          padding: "2px"
                        }}
                      >
                        ×
                      </button>
                    </div>
                  ))}
                </div>
              </div>
            )}
          </div>

          {/* Footer Buttons */}
          <div style={{ 
            display: "flex", 
            gap: "10px", 
            justifyContent: "flex-end",
            paddingTop: "16px",
            borderTop: "1px solid #e9ecef"
          }}>
            <button
              onClick={() => {
                setShowEditModal(false);
                resetForm();
                setSelectedSport(null);
              }}
              style={{
                ...buttonStyle,
                backgroundColor: "#6c757d",
                color: "white",
                padding: "10px 20px"
              }}
            >
              Cancel
            </button>
            <button
              onClick={handleUpdateSport}
              disabled={editing}
              style={{
                ...buttonStyle,
                backgroundColor: editing ? "#ccc" : "#ffc107",
                color: "white",
                padding: "10px 20px"
              }}
            >
              {editing ? "Updating..." : "Update Sport"}
            </button>
          </div>
        </div>
      </Modal>

      {/* Remove Confirmation Modal */}
      <Modal
        isOpen={showRemoveModal && !!selectedSport}
        title="Confirm Remove"
        showDefaultButtons={false}
        onClose={() => {
          setShowRemoveModal(false);
          setSelectedSport(null);
        }}
      >
        <div style={{ padding: "20px" }}>
          <p>Are you sure you want to remove <strong>{selectedSport?.sport_name}</strong>?</p>
          <p style={{ fontSize: "14px", color: "#6c757d", marginBottom: "8px" }}>
            This will delete the sport from the active database.
          </p>
          <p style={{ fontSize: "14px", color: "#28a745", fontWeight: "500" }}>
            ✓ You can still view, edit, and restore it from the "Removed" section.
          </p>
          <div style={{ display: "flex", gap: "10px", justifyContent: "flex-end", marginTop: "20px" }}>
            <button
              onClick={() => {
                setShowRemoveModal(false);
                setSelectedSport(null);
              }}
              style={{
                ...buttonStyle,
                backgroundColor: "#6c757d",
                color: "white"
              }}
            >
              Cancel
            </button>
            <button
              onClick={confirmRemoveSport}
              disabled={removing}
              style={{
                ...buttonStyle,
                backgroundColor: removing ? "#ccc" : "#dc3545",
                color: "white"
              }}
            >
              {removing ? "Removing..." : "Remove"}
            </button>
          </div>
        </div>
      </Modal>
    </div>
  );
}
