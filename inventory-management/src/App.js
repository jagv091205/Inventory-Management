import React, { useState } from 'react';
import WasteManagement from './components/WasteManagement';
import SidePanel from './components/SidePanel';
import StockCount from './components/StockCount';
import InventoryAndWasteHistory from './components/StockMovement';


function App() {
  const [activeTab, setActiveTab] = useState('stockcount');

  return (
    <div className="App flex h-screen bg-gray-100">
      {/* SidePanel for navigation */}
      <SidePanel activeTab={activeTab} setActiveTab={setActiveTab} />

      {/* Main content area */}
      <div className="flex-1 p-6 overflow-auto">
        {activeTab === 'stockcount' && <StockCount />}
        {activeTab === 'waste' && <WasteManagement />}
        {activeTab == 'stockMove' && <InventoryAndWasteHistory/>}
      </div>
    </div>
  );
}

export default App;
