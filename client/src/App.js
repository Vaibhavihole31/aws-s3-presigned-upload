import React, { useState, useEffect } from 'react';
import axios from 'axios';
import './App.css';

const FileUpload = () => {
  const [file, setFile] = useState(null);
  const [files, setFiles] = useState([]);
  const [uploadProgress, setUploadProgress] = useState(0);
  const [loading, setLoading] = useState(false);
  const [downloadingFile, setDownloadingFile] = useState(null);

  useEffect(() => {
    fetchFiles();
  }, []);

  console.log(process.env.REACT_APP_BASE_URL);
  

  const fetchFiles = async () => {
    try {
      const response = await axios.get(`${process.env.REACT_APP_BASE_URL}/api/files`);
      setFiles(response.data);
    } catch (error) {
      console.error('Error fetching files:', error);
    }
  };

  const handleFileSelect = (e) => {
    setFile(e.target.files[0]);
  };

  const formatFileSize = (bytes) => {
    if (bytes === 0) return '0 Bytes';
    const k = 1024;
    const sizes = ['Bytes', 'KB', 'MB', 'GB'];
    const i = Math.floor(Math.log(bytes) / Math.log(k));
    return parseFloat((bytes / Math.pow(k, i)).toFixed(2)) + ' ' + sizes[i];
  };

  const formatDate = (date) => {
    return new Date(date).toLocaleDateString('en-US', {
      year: 'numeric',
      month: 'short',
      day: 'numeric'
    });
  };

  const handleUpload = async () => {
    try {
      if (!file) return;
      setLoading(true);

      const { data } = await axios.post(`${process.env.REACT_APP_BASE_URL}/api/generate-upload-url`, {
        fileName: file.name,
        fileType: file.type,
      });
      

      await axios.put(data.uploadURL, file, {
        headers: {
          'Content-Type': file.type,
        },
        onUploadProgress: (progressEvent) => {
          const progress = Math.round(
            (progressEvent.loaded * 100) / progressEvent.total
          );
          setUploadProgress(progress);
        },
      });

      setFile(null);
      setUploadProgress(0);
      await fetchFiles();
    } catch (error) {
      console.error('Error uploading file:', error);
      alert('Failed to upload file');
    } finally {
      setLoading(false);
    }
  };

  const handleDownload = async (fileName) => {
    try {
      setDownloadingFile(fileName);
      const response = await axios.get(
        `${process.env.REACT_APP_BASE_URL}/api/generate-download-url/${fileName}`
      );

      const link = document.createElement('a');
      link.href = response.data.downloadURL;
      link.setAttribute('download', fileName);
      document.body.appendChild(link);
      link.click();
      document.body.removeChild(link);
    } catch (error) {
      console.error('Error downloading file:', error);
      alert('Failed to download file');
    } finally {
      setDownloadingFile(null);
    }
  };

  return (
    <div className="upload-container">
      <div className="upload-section">
        <input
          type="file"
          onChange={handleFileSelect}
          className="file-input"
        />
        <button
          onClick={handleUpload}
          disabled={!file || loading}
          className={`upload-button ${(!file || loading) ? 'disabled' : ''}`}
        >
          {loading ? 'Uploading...' : 'Upload File'}
        </button>

        {uploadProgress > 0 && (
          <div className="progress-container">
            <p>Upload Progress: {uploadProgress}%</p>
            <div className="progress-bar">
              <div
                className="progress-fill"
                style={{ width: `${uploadProgress}%` }}
              />
            </div>
          </div>
        )}
      </div>

      <ul className="file-list">
        {files.map((file, index) => (
          <li key={index} className="file-item">
            <div className="file-icon">📄</div>
            <div className="file-details">
              <p className="file-name">{file.name}</p>
              <p className="file-info">
                {formatFileSize(file.size)} • {formatDate(file.lastModified)}
              </p>
            </div>
            <button
              onClick={() => handleDownload(file.name)}
              className="download-button"
              disabled={downloadingFile === file.name}
            >
              {downloadingFile === file.name ? 'Downloading...' : 'Download'}
            </button>
          </li>
        ))}
        {files.length === 0 && (
          <li className="no-files">No files uploaded yet</li>
        )}
      </ul>
    </div>
  );
};

export default FileUpload;