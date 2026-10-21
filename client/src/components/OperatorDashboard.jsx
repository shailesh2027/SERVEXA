import React, { useState, useEffect } from 'react';

export default function OperatorDashboard() {
  const [isLoggedIn, setIsLoggedIn] = useState(false);
  const [username, setUsername] = useState('');
  const [password, setPassword] = useState('');
  
  const [queue, setQueue] = useState([]);
  const [requestId, setRequestId] = useState('');
  const [enteredPIN, setEnteredPIN] = useState('');
  const [verificationResult, setVerificationResult] = useState(null);
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState(null);

  const API_BASE = 'https://servexa-ym6x.onrender.com';

  // Check login status on component mount
  useEffect(() => {
    const token = localStorage.getItem('operatorToken');
    if (token) {
      setIsLoggedIn(true);
      fetchQueue(token);
    }
  }, []);

  // Handle Operator Login
  const handleLogin = async (e) => {
    e.preventDefault();
    setError(null);
    try {
      const res = await fetch(`${API_BASE}/api/operator/login`, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ username, password }),
      });
      const data = await res.json();
      if (res.ok && data.success) {
        localStorage.setItem('operatorToken', data.token);
        setIsLoggedIn(true);
        fetchQueue(data.token);
      } else {
        setError(data.message || 'Invalid operator credentials!');
      }
    } catch (err) {
      setError('Login network error: ' + err.message);
    }
  };

  // Handle Logout
  const handleLogout = () => {
    localStorage.removeItem('operatorToken');
    setIsLoggedIn(false);
    setQueue([]);
    setVerificationResult(null);
  };

  // 1. Live Queue Fetch Karne Ke Liye (With Authorization Header)
  const fetchQueue = async (token = localStorage.getItem('operatorToken')) => {
    try {
      const res = await fetch(`${API_BASE}/api/operator/queue`, {
        headers: { 'Authorization': `Bearer ${token}` }
      });
      const data = await res.json();
      if (res.ok) {
        setQueue(data.data || []);
      } else if (res.status === 401 || res.status === 403) {
        handleLogout(); // Token expired or unauthorized
      }
    } catch (err) {
      console.error('Failed to fetch queue', err);
    }
  };

  useEffect(() => {
    if (!isLoggedIn) return;
    const interval = setInterval(() => fetchQueue(), 5000); // Har 5 seconds mein queue refresh hogi
    return () => clearInterval(interval);
  }, [isLoggedIn]);

  // Queue item par click karne se Request ID aur PIN automatically fill ho jayenge
  const handleSelectItem = (item) => {
    setRequestId(item._id);
    setEnteredPIN(item.servicePIN);
    setError(null);
  };

  // 2. PIN Verify & Document Decrypt Karne Ke Liye
  const handleVerifyPin = async (e) => {
    e.preventDefault();
    if (!requestId || !enteredPIN) {
      setError('Please select a request from the queue or enter Request ID and PIN.');
      return;
    }

    setLoading(true);
    setError(null);
    setVerificationResult(null);

    const token = localStorage.getItem('operatorToken');
    try {
      const res = await fetch(`${API_BASE}/api/operator/verify-pin`, {
        method: 'POST',
        headers: { 
          'Content-Type': 'application/json',
          'Authorization': `Bearer ${token}`
        },
        body: JSON.stringify({ requestId, enteredPIN }),
      });

      const data = await res.json();
      if (res.ok) {
        setVerificationResult(data);
      } else {
        setError(data.message || 'Invalid Service PIN or request not found!');
      }
    } catch (err) {
      setError('Network error: ' + err.message);
    } finally {
      setLoading(false);
    }
  };

  // 3. Job Complete & Vault Purge Karne Ke Liye
  const handleComplete = async (id) => {
    const token = localStorage.getItem('operatorToken');
    try {
      const res = await fetch(`${API_BASE}/api/operator/complete/${id}`, {
        method: 'POST',
        headers: { 
          'Authorization': `Bearer ${token}`
        },
      });

      const data = await res.json();
      if (res.ok) {
        alert(data.message || 'Job completed and files purged successfully!');
        setVerificationResult(null);
        setRequestId('');
        setEnteredPIN('');
        fetchQueue(token);
      } else {
        alert('Failed to complete service.');
      }
    } catch (err) {
      alert('Error: ' + err.message);
    }
  };

  // -----------------------------------------
  // LOGIN SCREEN (Agar Operator Logged In Nahi Hai)
  // -----------------------------------------
  if (!isLoggedIn) {
    return (
      <div className="min-h-screen bg-gray-900 text-white flex items-center justify-center p-4">
        <div className="bg-gray-800 p-8 rounded-2xl shadow-xl border border-gray-700 w-full max-w-md space-y-6">
          <div className="text-center space-y-2">
            <h1 className="text-2xl font-bold text-cyan-400">SERVEXA Operator</h1>
            <p className="text-xs text-gray-400">Secure Kiosk Authentication Portal</p>
          </div>
          <form onSubmit={handleLogin} className="space-y-4">
            <div>
              <label className="block text-xs text-gray-400 mb-1">Operator Username</label>
              <input 
                type="text" 
                placeholder="Enter username"
                value={username} 
                onChange={(e) => setUsername(e.target.value)} 
                className="w-full bg-gray-700 border border-gray-600 rounded-lg px-4 py-2.5 text-white text-sm focus:outline-none focus:ring-2 focus:ring-cyan-500"
                required 
              />
            </div>
            <div>
              <label className="block text-xs text-gray-400 mb-1">Password</label>
              <input 
                type="password" 
                placeholder="Enter password"
                value={password} 
                onChange={(e) => setPassword(e.target.value)} 
                className="w-full bg-gray-700 border border-gray-600 rounded-lg px-4 py-2.5 text-white text-sm focus:outline-none focus:ring-2 focus:ring-cyan-500"
                required 
              />
            </div>
            <button 
              type="submit" 
              className="w-full bg-cyan-600 hover:bg-cyan-700 py-2.5 rounded-lg font-semibold transition shadow-lg text-sm"
            >
              Login to Dashboard
            </button>
          </form>
          {error && <p className="text-red-400 text-sm text-center">{error}</p>}
        </div>
      </div>
    );
  }

  // -----------------------------------------
  // DASHBOARD VIEW (After Successful Login)
  // -----------------------------------------
  return (
    <div className="min-h-screen bg-gray-900 text-white p-8">
      <div className="max-w-4xl mx-auto space-y-8">
        <header className="border-b border-gray-800 pb-4 flex justify-between items-center">
          <div>
            <h1 className="text-2xl font-bold text-cyan-400">SERVEXA - Operator Dashboard</h1>
            <span className="text-xs bg-cyan-900/60 border border-cyan-500 px-3 py-1 rounded-full text-cyan-300 mt-1 inline-block">Live Kiosk Node</span>
          </div>
          <button 
            onClick={handleLogout}
            className="bg-red-600/80 hover:bg-red-700 text-xs px-4 py-2 rounded-lg font-semibold transition shadow"
          >
            Logout
          </button>
        </header>

        {/* PIN Verification Section with Request ID & PIN Inputs */}
        <div className="bg-gray-800 p-6 rounded-2xl shadow-lg border border-gray-700">
          <h2 className="text-lg font-semibold mb-4 text-cyan-300">Verify Customer Service PIN</h2>
          <form onSubmit={handleVerifyPin} className="space-y-4">
            <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
              <div>
                <label className="block text-xs text-gray-400 mb-1">Request ID</label>
                <input 
                  type="text" 
                  placeholder="Click item from queue below" 
                  value={requestId}
                  onChange={(e) => setRequestId(e.target.value)}
                  className="w-full bg-gray-700 border border-gray-600 rounded-lg px-4 py-2.5 text-white text-sm focus:outline-none focus:ring-2 focus:ring-cyan-500 font-mono"
                />
              </div>
              <div>
                <label className="block text-xs text-gray-400 mb-1">Service PIN</label>
                <input 
                  type="text" 
                  placeholder="Enter 4-digit PIN" 
                  value={enteredPIN}
                  onChange={(e) => setEnteredPIN(e.target.value)}
                  className="w-full bg-gray-700 border border-gray-600 rounded-lg px-4 py-2.5 text-white font-mono tracking-wider text-sm focus:outline-none focus:ring-2 focus:ring-cyan-500"
                />
              </div>
            </div>
            <button 
              type="submit" 
              disabled={loading}
              className="w-full bg-cyan-600 hover:bg-cyan-700 py-2.5 rounded-lg font-semibold transition disabled:opacity-50 shadow-lg text-sm"
            >
              {loading ? 'Verifying & Decrypting...' : 'Verify PIN & Load Document'}
            </button>
          </form>
          {error && <p className="text-red-400 text-sm mt-2">{error}</p>}
        </div>

        {/* Verification Result / Decrypted File Viewer */}
        {verificationResult && (
          <div className="bg-gray-800 p-6 rounded-2xl shadow-lg border border-green-500/50 space-y-4">
            <h3 className="text-lg font-bold text-green-400">PIN Verified Successfully!</h3>
            <div className="bg-gray-900/50 p-4 rounded-xl text-sm space-y-2">
              <p><strong className="text-cyan-400">File Name:</strong> {verificationResult.fileName}</p>
              <p><strong className="text-cyan-400">Message:</strong> {verificationResult.message}</p>
            </div>
            <div className="flex gap-4">
              {verificationResult.fileData && (
                <a 
                  href={`data:${verificationResult.mimeType};base64,${verificationResult.fileData}`}
                  download={verificationResult.fileName}
                  className="bg-emerald-600 hover:bg-emerald-700 px-4 py-2 rounded-lg text-sm font-semibold transition shadow"
                >
                  Download / Print Decrypted File
                </a>
              )}
              <button 
                onClick={() => handleComplete(requestId)}
                className="bg-red-600 hover:bg-red-700 px-4 py-2 rounded-lg text-sm font-semibold transition shadow"
              >
                Complete & Purge Vault
              </button>
            </div>
          </div>
        )}

        {/* Live Active Service Queue (Clickable Items) */}
        <div className="bg-gray-800 p-6 rounded-2xl shadow-lg border border-gray-700">
          <h2 className="text-lg font-semibold mb-4 text-cyan-300">Active Service Queue (Click to Select)</h2>
          {queue.length === 0 ? (
            <p className="text-gray-400 text-sm">No active documents in the queue.</p>
          ) : (
            <div className="space-y-3">
              {queue.map((item, index) => (
                <div 
                  key={index} 
                  onClick={() => handleSelectItem(item)}
                  className="bg-gray-700/40 p-4 rounded-xl flex justify-between items-center border border-gray-600/50 cursor-pointer hover:bg-gray-700 transition shadow-sm"
                >
                  <div>
                    <p className="font-semibold text-white capitalize">{item.serviceType}</p>
                    <p className="text-xs text-gray-400 font-mono">ID: {item._id}</p>
                  </div>
                  <div className="flex items-center gap-3">
                    <span className="text-xs font-mono bg-yellow-500/20 text-yellow-300 border border-yellow-500/40 px-3 py-1 rounded-full">
                      PIN: {item.servicePIN}
                    </span>
                    <span className="text-xs bg-cyan-500/20 text-cyan-300 px-3 py-1 rounded-lg font-medium">
                      Select
                    </span>
                  </div>
                </div>
              ))}
            </div>
          )}
        </div>
      </div>
    </div>
  );
}
