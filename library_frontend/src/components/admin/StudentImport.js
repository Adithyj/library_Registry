import React, { useState } from 'react';
import axios from 'axios';
import { CloudUpload, Download } from 'lucide-react';

function StudentImport() {
  // State for selected file
  const [selectedFile, setSelectedFile] = useState(null);
  
  // State for upload status
  const [uploadStatus, setUploadStatus] = useState({
    loading: false,
    success: false,
    error: false,
    message: '',
    details: null
  });

  // Handle file selection
  const handleFileChange = (event) => {
    if (event.target.files && event.target.files[0]) {
      const file = event.target.files[0];
      
      // Check if it's a CSV file
      if (file.type !== 'text/csv' && !file.name.endsWith('.csv')) {
        setUploadStatus({
          loading: false,
          success: false,
          error: true,
          message: 'Please select a valid CSV file'
        });
        return;
      }
      
      setSelectedFile(file);
      setUploadStatus({
        loading: false,
        success: false,
        error: false,
        message: ''
      });
    }
  };

  // Handle file upload
  const handleUpload = async () => {
    if (!selectedFile) {
      setUploadStatus({
        loading: false,
        success: false,
        error: true,
        message: 'Please select a file first'
      });
      return;
    }
    
    setUploadStatus({
      loading: true,
      success: false,
      error: false,
      message: 'Uploading and processing file...'
    });
    
    const formData = new FormData();
    formData.append('file', selectedFile);
    
    try {
      const token = localStorage.getItem('adminToken');
      const response = await axios.post(
        'http://localhost:5000/api/admin/student-import/upload',
        formData,
        {
          headers: {
            'Content-Type': 'multipart/form-data',
            'Authorization': `Bearer ${token}`
          }
        }
      );
      
      setUploadStatus({
        loading: false,
        success: true,
        error: false,
        message: response.data.message,
        details: response.data.results
      });
    } catch (error) {
      setUploadStatus({
        loading: false,
        success: false,
        error: true,
        message: error.response?.data?.message || 'Error uploading file',
        details: error.response?.data
      });
    }
  };

  // Handle template download
  const handleDownloadTemplate = async () => {
    try {
      const token = localStorage.getItem('adminToken');
      const response = await axios.get(
        'http://localhost:5000/api/admin/student-import/template',
        {
          headers: {
            'Authorization': `Bearer ${token}`
          },
          responseType: 'blob'
        }
      );
      
      // Create download link
      const url = window.URL.createObjectURL(new Blob([response.data]));
      const link = document.createElement('a');
      link.href = url;
      link.setAttribute('download', 'student_import_template.csv');
      document.body.appendChild(link);
      link.click();
      
      // Clean up
      link.parentNode.removeChild(link);
    } catch (error) {
      setUploadStatus({
        loading: false,
        success: false,
        error: true,
        message: 'Error downloading template'
      });
    }
  };

  return (
    <div className="student-import-container">
      <div className="logs-section">
        <div className="logs-header">
          <h2>Bulk Student Import</h2>
        </div>
        
        <p className="import-description">
          Import multiple students at once by uploading a CSV file. 
          Download the template to ensure your data is in the correct format.
        </p>
        
        <div className="report-buttons">
          <label className="report-btn" style={{ cursor: 'pointer' }}>
            <CloudUpload size={16} /> Select CSV File
            <input 
              type="file" 
              accept=".csv" 
              onChange={handleFileChange}
              style={{ display: 'none' }}
            />
          </label>
          
          <button
            className="report-btn"
            onClick={handleDownloadTemplate}
          >
            <Download size={16} /> Download Template
          </button>
        </div>
        
        {selectedFile && (
          <div className="file-info" style={{ margin: '15px 0' }}>
            <div className="alert info" style={{ backgroundColor: '#e0f2fe', color: '#0369a1', padding: '10px', borderRadius: '4px' }}>
              Selected file: {selectedFile.name} ({Math.round(selectedFile.size / 1024)} KB)
            </div>
            <button
              className="report-btn"
              onClick={handleUpload}
              disabled={uploadStatus.loading}
              style={{ marginTop: '10px' }}
            >
              {uploadStatus.loading ? 'Processing...' : 'Upload and Process'}
            </button>
          </div>
        )}
        
        {uploadStatus.message && (
          <div className={`alert ${uploadStatus.error ? 'error' : uploadStatus.success ? 'success' : 'info'}`}
            style={{ 
              padding: '10px', 
              borderRadius: '4px', 
              margin: '15px 0',
              backgroundColor: uploadStatus.error ? '#fee2e2' : uploadStatus.success ? '#dcfce7' : '#e0f2fe',
              color: uploadStatus.error ? '#b91c1c' : uploadStatus.success ? '#166534' : '#0369a1'
            }}
          >
            {uploadStatus.message}
          </div>
        )}
        
        {uploadStatus.success && uploadStatus.details && (
          <div className="import-results" style={{ marginTop: '20px' }}>
            <div className="logs-section" style={{ padding: '15px', marginBottom: '15px' }}>
              <h3>Import Results</h3>
              
              <div style={{ display: 'grid', gridTemplateColumns: 'repeat(3, 1fr)', gap: '10px', margin: '15px 0' }}>
                <div>
                  <strong>Total Records:</strong> {uploadStatus.details.total}
                </div>
                <div style={{ color: '#166534' }}>
                  <strong>Successfully Processed:</strong> {uploadStatus.details.successful}
                </div>
                <div style={{ color: '#b91c1c' }}>
                  <strong>Failed Records:</strong> {uploadStatus.details.failed}
                </div>
              </div>
              
              {uploadStatus.details.errors && uploadStatus.details.errors.length > 0 && (
                <div style={{ marginTop: '15px', borderTop: '1px solid #e5e7eb', paddingTop: '15px' }}>
                  <h4 style={{ color: '#b91c1c', marginBottom: '10px' }}>Validation Errors:</h4>
                  <ul className="error-list" style={{ listStyle: 'none', padding: 0 }}>
                    {uploadStatus.details.errors.map((error, idx) => (
                      <li key={idx} style={{ padding: '8px', backgroundColor: '#fee2e2', marginBottom: '5px', borderRadius: '4px' }}>
                        <div><strong>Row {error.row}:</strong> {error.message}</div>
                        <div style={{ fontSize: '0.85em', color: '#555' }}>Data: {JSON.stringify(error.data)}</div>
                      </li>
                    ))}
                  </ul>
                </div>
              )}
              
              {uploadStatus.details.failedRecords && uploadStatus.details.failedRecords.length > 0 && (
                <div style={{ marginTop: '15px', borderTop: '1px solid #e5e7eb', paddingTop: '15px' }}>
                  <h4 style={{ color: '#b91c1c', marginBottom: '10px' }}>Database Import Errors:</h4>
                  <table className="logs-table">
                    <thead>
                      <tr>
                        <th>USN</th>
                        <th>Error</th>
                      </tr>
                    </thead>
                    <tbody>
                      {uploadStatus.details.failedRecords.map((record, idx) => (
                        <tr key={idx}>
                          <td>{record.usn}</td>
                          <td>{record.error}</td>
                        </tr>
                      ))}
                    </tbody>
                  </table>
                </div>
              )}
            </div>
          </div>
        )}
      </div>
    </div>
  );
}

export default StudentImport; 