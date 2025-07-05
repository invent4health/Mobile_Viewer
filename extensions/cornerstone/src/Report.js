import React, { useState, useEffect } from 'react';
import Editor from 'react-simple-wysiwyg';
import './Report.css';

const Report = ({ patientDetails, onClose }) => {
  const [editorContent, setEditorContent] = useState('');
  const [templates, setTemplates] = useState([]);
  const [selectedTemplate, setSelectedTemplate] = useState('');
  const [isEdited, setIsEdited] = useState(false);

  const localStorageKey = `report-${patientDetails.PatientID}`;

  // Load report from localStorage if available
  useEffect(() => {
    const savedContent = localStorage.getItem(localStorageKey);
    if (savedContent) {
      setEditorContent(savedContent);
    }
  }, [localStorageKey]);

  // Load templates on mount
  useEffect(() => {
    const fetchTemplates = async () => {
      try {
        const response = await fetch('http://35.157.184.183/radshare-appapi/api/radshareopenapi/getPublicReportTemplate/MR');
        const data = await response.json();
          setTemplates(data.ReportData);

      } catch (error) {
        console.error('Error fetching templates:', error);
      }
    };

    fetchTemplates();
  }, []);

  // Save to localStorage on every change
  const handleEditorChange = e => {
    const value = e.target.value;
    setEditorContent(value);
    localStorage.setItem(localStorageKey, value);
    setIsEdited(true);
  };

  const handleLoadTemplate = (templateId) => {
    const selected = templates.find((template) => template.id === templateId);
    if (selected) {
      setEditorContent(selected.content);
      setSelectedTemplate(templateId);
      setIsEdited(true);
      localStorage.setItem(localStorageKey, selected.content);
    } else {
      console.error('Template not found!');
    }
  };

  const saveReport = async () => {
    try {
      const response = await fetch('/api/report', {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json'
        },
        body: JSON.stringify({
          patientId: patientDetails.PatientID || '',
          reportContent: editorContent
        })
      });

      if (response.ok) {
        alert('Report saved successfully.');
        localStorage.removeItem(localStorageKey);
        setIsEdited(false);
      } else {
        alert('Failed to save report.');
      }
    } catch (error) {
      console.error('Save failed:', error);
      alert('Error saving report.');
    }
  };

  return (
    <div className="report-container">
      {/* Patient Details */}
      <div className="patient-details">
        <p><strong>Name:</strong> {patientDetails.PatientName || 'N/A'}</p>
        <p><strong>ID:</strong> {patientDetails.PatientID || 'N/A'}</p>
        <p><strong>Age:</strong> {patientDetails.PatientAge || 'N/A'}</p>
        <p><strong>Sex:</strong> {patientDetails.PatientSex || 'N/A'}</p>
        <p><strong>Description:</strong> {patientDetails.StudyDescription || 'N/A'}</p>
        <p><strong>Study Date:</strong> {patientDetails.StudyDate || 'N/A'}</p>
      </div>

      {/* Template Dropdown */}
      <div className="template-dropdown">
        <label htmlFor="templateDropdown">Load Template:</label>
        <select
          id="templateDropdown"
          value={selectedTemplate}
          onChange={(e) => handleLoadTemplate(e.target.value)}
          className="p-2 border rounded"
        >
          <option value="">Select a template</option>
          {templates.map((template) => (
            <option key={template.id} value={template.id}>
              {template.name}
            </option>
          ))}
        </select>
            <button
          onClick={saveReport}
          className="px-4 py-2 bg-green-600 text-white rounded mr-2"
        >
          Save Report
        </button>
        <button
          onClick={onClose}
          className="px-4 py-2 bg-blue-600 text-white rounded"
        >
          Close
        </button>
      </div>

      {/* Editor */}
      <div className="editor-section">
        <Editor
          value={editorContent}
          onChange={handleEditorChange}
          placeholder="Enter findings here..."
        />
      </div>

      {/* Action Buttons */}
    </div>
  );
};

export default Report;
