// components/SidePanel.jsx
import React from 'react';

const SidePanel = ({ activeTab, setActiveTab }) => {
  return (
    <div className="w-64 min-h-screen bg-gray-900 text-white p-6">
      <h2 className="text-2xl font-bold mb-8">Management System</h2>
      <ul className="space-y-3">
      <li
          className={`p-3 rounded cursor-pointer transition-colors ${
            activeTab === 'waste' ? 'bg-blue-600' : 'hover:bg-gray-700'
          }`}
          onClick={() => setActiveTab('waste')}
        >
          Waste Count
        </li>
      <li
          className={`p-3 rounded cursor-pointer transition-colors ${
            activeTab === 'stockcount' ? 'bg-blue-600' : 'hover:bg-gray-700'
          }`}
          onClick={() => setActiveTab('stockcount')}
        >
          Stock Count
        </li>
        <li
          className={`p-3 rounded cursor-pointer transition-colors ${
            activeTab === 'stockMove' ? 'bg-blue-600' : 'hover:bg-gray-700'
          }`}
          onClick={() => setActiveTab('stockMove')}
        >
          Stock Movement
        </li>
        
      </ul>
    </div>
  );
};

export default SidePanel;
