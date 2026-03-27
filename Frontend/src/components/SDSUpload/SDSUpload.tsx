import React, { useState } from 'react';

interface SDSUploadProps {
  onUpload: (file: File) => void;
}

const SDSUpload = ({ onUpload }: SDSUploadProps) => {
  const [isDragging, setIsDragging] = useState(false);
  const [uploadStatus, setUploadStatus] = useState<'idle' | 'uploading' | 'success' | 'error'>('idle');

  const handleDragOver = (e: React.DragEvent) => {
    e.preventDefault();
    setIsDragging(true);
  };

  const handleDragLeave = () => {
    setIsDragging(false);
  };

  const handleDrop = (e: React.DragEvent) => {
    e.preventDefault();
    setIsDragging(false);
    const file = e.dataTransfer.files[0];
    if (file) {
      handleFile(file);
    }
  };

  const handleFileInput = (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0];
    if (file) {
      handleFile(file);
    }
  };

  const handleFile = (file: File) => {
    // Mock upload - simulate upload process
    setUploadStatus('uploading');
    setTimeout(() => {
      onUpload(file);
      setUploadStatus('success');
      setTimeout(() => {
        setUploadStatus('idle');
      }, 2000);
    }, 1500);
  };

  return (
    <div className="bg-white rounded-lg shadow p-6">
      <h2 className="text-lg font-semibold text-gray-900 mb-4">Upload SDS Document</h2>
      
      <div
        onDragOver={handleDragOver}
        onDragLeave={handleDragLeave}
        onDrop={handleDrop}
        className={`border-2 border-dashed rounded-lg p-8 text-center transition-colors ${
          isDragging
            ? 'border-blue-500 bg-blue-50'
            : uploadStatus === 'success'
            ? 'border-green-500 bg-green-50'
            : 'border-gray-300 hover:border-gray-400'
        }`}
      >
        {uploadStatus === 'uploading' ? (
          <div className="space-y-2">
            <div className="animate-spin rounded-full h-12 w-12 border-b-2 border-blue-600 mx-auto"></div>
            <p className="text-gray-600">Uploading...</p>
          </div>
        ) : uploadStatus === 'success' ? (
          <div className="space-y-2">
            <div className="text-green-600 text-4xl">✓</div>
            <p className="text-green-600 font-medium">Upload successful!</p>
          </div>
        ) : (
          <>
            <div className="text-gray-400 text-4xl mb-4">📄</div>
            <p className="text-gray-600 mb-2">
              Drag and drop your SDS file here, or{' '}
              <label className="text-blue-600 hover:text-blue-800 cursor-pointer font-medium">
                browse
                <input
                  type="file"
                  accept=".pdf,.doc,.docx"
                  onChange={handleFileInput}
                  className="hidden"
                />
              </label>
            </p>
            <p className="text-sm text-gray-500">Supported formats: PDF, DOC, DOCX</p>
          </>
        )}
      </div>
    </div>
  );
};

export default SDSUpload;

