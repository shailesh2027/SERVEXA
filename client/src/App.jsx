import React, { useState } from 'react';
import CustomerPortal from './components/CustomerPortal';
import OperatorDashboard from './components/OperatorDashboard';

function App() {
  const [view, setView] = useState('customer');

  return (
    <div>
      <nav className="bg-gray-800 border-b border-gray-700 p-4 flex justify-center gap-4">
        <button 
          onClick={() => setView('customer')}
          className={`px-4 py-2 rounded-lg font-semibold text-sm transition ${view === 'customer' ? 'bg-cyan-600 text-white' : 'bg-gray-700 text-gray-300 hover:bg-gray-600'}`}
        >
          Customer Portal
        </button>
        <button 
          onClick={() => setView('operator')}
          className={`px-4 py-2 rounded-lg font-semibold text-sm transition ${view === 'operator' ? 'bg-cyan-600 text-white' : 'bg-gray-700 text-gray-300 hover:bg-gray-600'}`}
        >
          Operator Dashboard
        </button>
      </nav>

      {view === 'customer' ? <CustomerPortal /> : <OperatorDashboard />}
    </div>
  );
}

export default App;