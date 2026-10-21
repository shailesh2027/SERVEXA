import React, { useState } from 'react';

export default function CustomerPortal() {
  const [file, setFile] = useState(null);
  const [serviceType, setServiceType] = useState('print');
  const [loading, setLoading] = useState(false);
  const [responseDetails, setResponseDetails] = useState(null);
  const [error, setError] = useState(null);

  const handleFileChange = (e) => {
    setFile(e.target.files[0]);
  };

  const handleUpload = async (e) => {
    e.preventDefault();
    if (!file) {
      setError('Please select a file first.');
      return;
    }

    setLoading(true);
    setError(null);

    const formData = new FormData();
    formData.append('file', file);
    formData.append('serviceType', serviceType);

    try {
      // Backend URL ke sath exact upload endpoint route yahan zaroor hona chahiye
      const res = await fetch('https://servexa-backend-1qhw.onrender.com/api/services/upload', {
        method: 'POST',
        body: formData,
      });

      const data = await res.json();
      if (res.ok) {
        setResponseDetails(data.data || data);
      } else {
        setError(data.message || 'Upload failed');
      }
    } catch (err) {
      setError('Network error: ' + err.message);
    } finally {
      setLoading(false);
    }
  };

  return (
    <div className="min-h-screen bg-gray-900 text-white flex flex-col items-center justify-center p-6">
      <div className="max-w-md w-full bg-gray-800 p-8 rounded-2xl shadow-xl border border-gray-700">
        <h2 className="text-2xl font-bold mb-6 text-center text-cyan-400">SERVEXA - Customer Portal</h2>

        {!responseDetails ? (
          <form onSubmit={handleUpload} className="space-y-4">
            <div>
              <label className="block text-sm font-medium mb-1">Select Service Type</label>
              <select 
                value={serviceType} 
                onChange={(e) => setServiceType(e.target.value)}
                className="w-full bg-gray-700 border border-gray-600 rounded-lg p-2.5 text-white focus:outline-none focus:ring-2 focus:ring-cyan-500"
              >
                <option value="print">Document Printing</option>
                <option value="form-filling">Government Form Filling</option>
                <option value="resume">Resume Creation</option>
              </select>
            </div>

            <div>
              <label className="block text-sm font-medium mb-1">Upload Document (PDF/JPG)</label>
              <input 
                type="file" 
                onChange={handleFileChange}
                className="w-full text-sm text-gray-400 file:mr-4 file:py-2 file:px-4 file:rounded-lg file:border-0 file:text-sm file:font-semibold file:bg-cyan-600 file:text-white hover:file:bg-cyan-700 cursor-pointer"
              />
            </div>

            {error && <p className="text-red-400 text-sm">{error}</p>}

            <button 
              type="submit" 
              disabled={loading}
              className="w-full bg-cyan-600 hover:bg-cyan-700 text-white font-semibold py-2.5 rounded-lg transition duration-200 shadow-lg disabled:opacity-50"
            >
              {loading ? 'Encrypting & Uploading...' : 'Upload Securely'}
            </button>
          </form>
        ) : (
          <div className="text-center space-y-4">
            <div className="bg-green-900/50 border border-green-500 p-4 rounded-xl">
              <h3 className="text-lg font-bold text-green-400">Upload Successful!</h3>
              <p className="text-sm text-gray-300 mt-2">Your file has been safely stored in the AES-256 vault.</p>
            </div>
            
            <div className="bg-gray-700/50 p-4 rounded-xl text-left space-y-2">
              <p><strong className="text-cyan-400">Request ID:</strong> <span className="text-xs break-all">{responseDetails.requestId || responseDetails._id}</span></p>
              <p><strong className="text-cyan-400">Service PIN:</strong> <span className="text-xl font-mono text-yellow-400 tracking-widest">{responseDetails.servicePIN}</span></p>
            </div>

            <button 
              onClick={() => { setResponseDetails(null); setFile(null); }}
              className="w-full bg-gray-700 hover:bg-gray-600 text-white font-semibold py-2 rounded-lg transition"
            >
              Upload Another Document
            </button>
          </div>
        )}
      </div>
    </div>
  );
}
