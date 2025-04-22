import React from 'react';

const SidePanel = ({ activeTab, setActiveTab }) => {
  return (
    <div className="w-64 bg-gray-800 text-white p-4">
      <h2 className="text-xl font-bold mb-6">Management System</h2>
      <ul>
        <li
          className={`p-3 mb-2 rounded cursor-pointer ${activeTab === 'inventory' ? 'bg-blue-600' : 'hover:bg-gray-700'}`}
          onClick={() => setActiveTab('inventory')}
        >
          Inventory Management
        </li>
        <li
          className={`p-3 mb-2 rounded cursor-pointer ${activeTab === 'waste' ? 'bg-blue-600' : 'hover:bg-gray-700'}`}
          onClick={() => setActiveTab('waste')}
        >
          Waste Management
        </li>
      </ul>
    </div>
  );
};

export default SidePanel;
