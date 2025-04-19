import React, { useState } from "react";
import axios from "axios";
import "./App.css";

function App() {
  const [view, setView] = useState("home");

  const [fileData, setFileData] = useState(null);
  const [fileName, setFileName] = useState("");
  const [responseData, setResponseData] = useState(null);
  const [selectedImages, setSelectedImages] = useState({});
  const [showTable, setShowTable] = useState(false);
  const [showAccuracy, setShowAccuracy] = useState(false);
  const [loading, setLoading] = useState(false);

  const [numSuppliers, setNumSuppliers] = useState("");
  const [supplierData, setSupplierData] = useState([]);
  const [bwmLoading, setBWMLoading] = useState(false);
  const [bwmError, setBWMError] = useState("");
  const [bwmResponse, setBWMResponse] = useState(null);
  const [selectedSupplier, setSelectedSupplier] = useState(null);
// Inside your component
const [selectedSuggestions, setSelectedSuggestions] = useState([]);
const [selectedPros, setSelectedPros] = useState([]);

const toggleItem = (key, selectedList, setSelectedList) => {
  if (selectedList.includes(key)) {
    setSelectedList(selectedList.filter(k => k !== key));
  } else {
    setSelectedList([...selectedList, key]);
  }
};

  
  const labelMap = {
    D: "Delivery Delays (D)",
    Q: "Quality Issues (Q)",
    F: "Financial Instability (F)",
    C: "Capacity Constraints (C)",
    R: "Regulatory Compliance (R)",
  };

  const handleFileUpload = (event) => {
    const file = event.target.files[0];
    if (file) {
      setFileName(file.name);
      const reader = new FileReader();
      reader.readAsDataURL(file);
      reader.onload = (e) => {
        setFileData(e.target.result.split(",")[1]);
      };
      reader.onerror = () => {
        alert("Error reading file. Please try again.");
      };
    }
  };

  const submitAIModel = async () => {
    if (!fileData) {
      alert("Please upload a file before submitting.");
      return;
    }
    setLoading(true);
    try {
      const response = await axios.post(`${process.env.REACT_APP_API_URL}/industrials`, {
        file_name: fileName,
        file_data: fileData,
      });
      setResponseData(response.data);
    } catch (error) {
      alert("File upload failed. Please try again.");
    } finally {
      setLoading(false);
    }
  };

  const handleImageSelect = (type, imageUrl) => {
    setSelectedImages((prev) => ({
      ...prev,
      [type]: `${imageUrl}?ngrok-skip-browser-warning=true`,
    }));
  };

  const handleSupplierCountChange = (e) => {
    const count = parseInt(e.target.value);
    if (!isNaN(count) && count > 0) {
      setNumSuppliers(count);
      const defaultSupplier = { name: "", D: "", Q: "", F: "", C: "", R: "" };
      setSupplierData(Array(count).fill().map(() => ({ ...defaultSupplier })));
    }
  };

  const handleBWMSubmit = async () => {
    setBWMError("");
    setBWMResponse(null);
    setSelectedSupplier(null);

    const isValid = supplierData.every((supplier) =>
      supplier.name.trim() !== "" &&
      ["D", "Q", "F", "C", "R"].every((key) => {
        const val = Number(supplier[key]);
        return val >= 1 && val <= 5;
      })
    );

    if (!isValid) {
      setBWMError("⚠ Please fill in all supplier names and enter valid risk scores (1-5).\n");
      return;
    }

    const payload = {
      suppliers_data: Object.fromEntries(
        supplierData.map((s) => [s.name, [s.D, s.Q, s.F, s.C, s.R].map(Number)])
      ),
    };

    setBWMLoading(true);
    try {
      const response = await axios.post(`${process.env.REACT_APP_API_URL}/manual_ai`, payload);
      setBWMResponse(response.data);
    } catch (err) {
      setBWMError("❌ Submission failed. Please try again.");
    } finally {
      setBWMLoading(false);
    }
  };

  return (
    <div className="app-container">
      {view === "home" && (
        <>
          <h1 style={{ color: "navy" }}>AI DSS Model for Risk Prediction</h1>
          <div className="button-group">
            <button className="navy-button" onClick={() => setView("ai")}>
              AI DSS Model
            </button>
            <button className="navy-button" onClick={() => setView("bwm")}>
              AI DSS Model Using BWM
            </button>
          </div>
        </>
      )}

      {view === "ai" && (
        <>
          <h2 className="heading">AI DSS MODEL</h2>
          <div className="upload-box">
            <p className="upload-instruction">Please upload an Excel file:</p>
            <div className="file-input">
              <input type="file" accept=".xlsx" onChange={handleFileUpload} className="file-upload" />
              <button className="navy-button" onClick={submitAIModel} disabled={!fileData || loading}>
                Upload
              </button>
            </div>
            {loading && (
              <div className="loading-container">
                <img src="/spinner.gif" alt="Loading..." className="loading-spinner" />
              </div>
            )}
          </div>

          {responseData && (
            <div className="response">
              <h3>Generated Plots</h3>
              <div className="vertical-button-group">
                <button className="navy-button" style={{ marginRight: "1rem" }} onClick={() => handleImageSelect("trend", responseData.trend_plot_url)}>
                  Trend Plot
                </button>
                {selectedImages.trend && <img src={selectedImages.trend} alt="Trend Plot" className="plot-image" />}

                <button className="navy-button" style={{ marginRight: "1rem" }} onClick={() => handleImageSelect("heatmap", responseData.heatmap_url)}>
                  Heatmap
                </button>
                {selectedImages.heatmap && <img src={selectedImages.heatmap} alt="Heatmap" className="plot-image" />}

                <button className="navy-button" onClick={() => handleImageSelect("feature", responseData.feature_importance_url)}>
                  Feature Importance
                </button>
                {selectedImages.feature && <img src={selectedImages.feature} alt="Feature Importance" className="plot-image" />}
              </div>

              <div className="accuracy-container">
                <button className="navy-button" onClick={() => setShowAccuracy(!showAccuracy)}>
                  Show Accuracy
                </button>
                {showAccuracy && <span>{responseData.accuracy?.toFixed(2)}%</span>}
              </div>

<div style={{ marginTop: "1rem" }}></div>

              <div className="round-button-container">
                <button className="round-button" onClick={() => setShowTable(!showTable)}>
                  Show Report
                </button>
              </div>

              {showTable && (
                <div className="classification-table">
                  <h3>Classification Report</h3>
                  <table className="report-table">
                    <thead>
                      <tr>
                        <th>Category</th>
                        <th>Precision</th>
                        <th>Recall</th>
                        <th>F1 Score</th>
                        <th>Support</th>
                      </tr>
                    </thead>
                    <tbody>
                      {Object.entries(responseData.classification_report).map(
                        ([category, values], index) =>
                          typeof values === "object" && (
                            <tr key={index}>
                              <td>{category}</td>
                              <td>{values.precision ? values.precision.toFixed(2) : "N/A"}</td>
                              <td>{values.recall ? values.recall.toFixed(2) : "N/A"}</td>
                              <td>{values["f1-score"] ? values["f1-score"].toFixed(2) : "N/A"}</td>
                              <td>{values.support ?? "N/A"}</td>
                            </tr>
                          )
                      )}
                    </tbody>
                  </table>
                </div>
                
              )}
                            <div style={{ marginTop: "1rem" }}></div>
                            <div className="risky-factor-box">
  <p className="risky-factor-line">
    <span className="risky-factor-label">Most Risky Factor:</span>{' '}
    <span className="risky-factor-value">{responseData.most_risky_factor}</span>
  </p>
</div>


            </div>
          )}
        </>
      )}

      {view === "bwm" && (
        <>
          <h2 className="heading">AI DSS MODEL USING BWM</h2>
          <div className="upload-box">
          <label className="form-label">Enter the number of suppliers:</label>
              <input
                type="number"
                min="1"
                value={numSuppliers}
                onChange={handleSupplierCountChange}
                className="form-input"
              />

              {supplierData.map((supplier, index) => (
                <div key={index} className="supplier-box">
                  <div className="form-group">
                    <label className="form-label">Supplier {index + 1} Name:</label>
                    <input
                      type="text"
                      value={supplier.name}
                      onChange={(e) => {
                        const name = e.target.value;
                        // Only allow alphabets and space
                        if (/^[a-zA-Z\s]*$/.test(name)) {
                          const updated = [...supplierData];
                          updated[index].name = name;
                          setSupplierData(updated);
                        }
                      }}
                      className="form-input"
                    />
                  </div>

                  {/* Dynamic instruction below name */}
                  <p className="instruction-text">
                    Enter risk scores for <strong>{supplier.name || `Supplier ${index + 1}`}</strong> (1 - Very Good, 5 - Poor)
                  </p>

                  {/* Risk factor fields */}
                  {Object.entries(labelMap).map(([key, label]) => (
                    <div key={key} className="form-group">
                      <label className="form-label risk-label">{label}:</label>
                      <input
                        type="number"
                        value={supplier[key]}
                        min="1"
                        max="5"
                        onKeyDown={(e) => {
                          if (["e", "E", "+", "-", "."].includes(e.key)) {
                            e.preventDefault();
                          }
                        }}
                        onChange={(e) => {
                          const val = e.target.value;
                          // Only allow values 1 to 5
                          if (val === '' || (Number(val) >= 1 && Number(val) <= 5)) {
                            const updated = [...supplierData];
                            updated[index][key] = val;
                            setSupplierData(updated);
                          }
                        }}
                        className="form-input"
                      />
                    </div>
                  ))}

                </div>
              ))}
               <div style={{ marginTop: "1rem" }}></div>

               <div className="submit-container">
                {bwmError && <p style={{ color: "red" }}>{bwmError}</p>}

                <button className="navy-button" onClick={handleBWMSubmit}>
                  Submit
                </button>

                {bwmLoading && (
                  <div className="spinner-wrapper">
                    <img src="/spinner.gif" alt="Loading..." className="loading-spinner" />
                  </div>
                )}
              </div>

              {bwmResponse && (
  <div className="bwm-response-card">
    <h3>📊 Supplier Risk Analysis</h3>

    <div className="risk-buttons">
      {Object.entries(bwmResponse.risk_scores).map(([name, score]) => (
        <button key={name} className="navy-button" onClick={() => setSelectedSupplier({ name, score })}>
          {name}
        </button>
      ))}
    </div>

    {selectedSupplier && (
      <p className="highlight">
        🔍 <strong>{selectedSupplier.name}</strong>'s Risk Score: <strong>{selectedSupplier.score}</strong>
      </p>
    )}

    <p className="best-supplier">✅ Best Supplier: <strong>{bwmResponse.best_supplier}</strong></p>
    <p className="worst-supplier">❌ Worst Supplier: <strong>{bwmResponse.worst_supplier}</strong></p>

    {bwmResponse.plot_url && (
      <img
        src={`${bwmResponse.plot_url}?ngrok-skip-browser-warning=true`}
        alt="Risk Plot"
        className="plot-image1"
      />
    )}

{bwmResponse.suggestions_to_improve && (
  <div className="info-section">
    <h3>📌 Suggestions to Improve</h3>
    <div className="info-button-group">
      {Object.entries(bwmResponse.suggestions_to_improve).map(([key, value]) => (
        <div key={key} className="info-item">
          <button
            className="info-button"
            onClick={() => toggleItem(key, selectedSuggestions, setSelectedSuggestions)}
          >
            {key}
          </button>
          {selectedSuggestions.includes(key) && <p className="info-value">{value}</p>}
        </div>
      ))}
    </div>
  </div>
)}


{bwmResponse.pros_of_best_supplier && (
  <div className="info-section">
    <h3>🌟 Pros of Best Supplier ({bwmResponse.best_supplier})</h3>
    <div className="info-button-group">
      {Object.entries(bwmResponse.pros_of_best_supplier).map(([key, value]) => (
        <div key={key} className="info-item">
          <button
            className="info-button"
            onClick={() => toggleItem(key, selectedPros, setSelectedPros)}
          >
            {key}
          </button>
          {selectedPros.includes(key) && <p className="info-value">{value}</p>}
        </div>
      ))}
    </div>
  </div>
)}


    <div className="riskiest-section">
      <h4>⚠️ Riskiest Factors</h4>
      <ul>
        {bwmResponse.riskiest_factors.map((factor, index) => (
          <li key={index}>{factor}</li>
        ))}
      </ul>
    </div>

    <p className="thanks-message">{bwmResponse.message}</p>
  </div>
)}

          </div>
        </>
      )}
    </div>
  );
}

export default App;