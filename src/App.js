import React, { useState } from "react";
import axios from "axios";
import "./App.css";

function App() {
  const [fileData, setFileData] = useState(null);
  const [fileName, setFileName] = useState("");
  const [responseData, setResponseData] = useState(null);
  const [selectedImages, setSelectedImages] = useState({});
  const [showTable, setShowTable] = useState(false);
  const [showAccuracy, setShowAccuracy] = useState(false);

  const handleFileUpload = (event) => {
    const file = event.target.files[0];
    if (file) {
      setFileName(file.name);
      const reader = new FileReader();
      reader.readAsDataURL(file);
      reader.onload = (e) => {
        setFileData(e.target.result.split(",")[1]);
      };
      reader.onerror = (error) => {
        console.error("Error reading file:", error);
        alert("Error reading file. Please try again.");
      };
    }
  };

  const submitData = async () => {
    if (!fileData) {
      alert("Please upload a file before submitting.");
      return;
    }
    try {
      const response = await axios.post(`${process.env.REACT_APP_API_URL}/industrials`, {
        file_name: fileName,
        file_data: fileData,
      });
      setResponseData(response.data);
    } catch (error) {
      console.error("Error uploading file:", error);
      alert("File upload failed. Please try again.");
    }
  };

  const handleImageSelect = (type, imageUrl) => {
    setSelectedImages((prev) => ({ ...prev, [type]: imageUrl }));
  };

  return (
    <div className="app-container">
      <h2 className="heading">AI MODEL</h2>
      <div className="upload-box">
        <p className="upload-instruction">Please upload an Excel file:</p>
        <div className="file-input">
          <input type="file" accept=".xlsx" onChange={handleFileUpload} className="file-upload" />
          <button className="navy-button" onClick={submitData} disabled={!fileData}>
            Upload
          </button>
        </div>
      </div>
      {responseData && (
        <div className="response">
          <h3>Generated Plots</h3>
          <div className="vertical-button-group">
            <button className="navy-button" onClick={() => handleImageSelect("trend", responseData.trend_plot_url)}>
              Trend Plot
            </button>
            {selectedImages.trend && <img src={selectedImages.trend} alt="Trend Plot" className="plot-image" />}
            
            <button className="navy-button" onClick={() => handleImageSelect("heatmap", responseData.heatmap_url)}>
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
        </div>
      )}
    </div>
  );
}

export default App;
