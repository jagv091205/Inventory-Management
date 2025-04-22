import React, { useState } from 'react';
import WasteManagement from './components/WasteManagement';
import SidePanel from './components/SidePanel';
import InventoryManagement from './components/InventoryManagement ';
import StockCount from './components/StockCount';

function App() {
  const [activeTab, setActiveTab] = useState('inventory');

  return (
    <div className="App flex h-screen bg-gray-100">
      {/* SidePanel for navigation */}
      <SidePanel activeTab={activeTab} setActiveTab={setActiveTab} />

      {/* Main content area */}
      <div className="flex-1 p-6 overflow-auto">
      {activeTab === 'inventory' && <InventoryManagement />}
        {activeTab === 'waste' && <WasteManagement />}
        {activeTab === 'stockcount' && <StockCount />}
   
      </div>
    </div>
  );
}

export default App;
