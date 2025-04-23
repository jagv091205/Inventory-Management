import React, { useState } from 'react';
import WasteManagement from './components/WasteManagement';
import SidePanel from './components/SidePanel';
import InventoryManagement from './components/InventoryManagement ';
import StockCount from './components/StockCount';


function App() {
  const [activeTab, setActiveTab] = useState('stockcount');

  return (
    <div className="App flex h-screen bg-gray-100">
      {/* SidePanel for navigation */}
      <SidePanel activeTab={activeTab} setActiveTab={setActiveTab} />

      {/* Main content area */}
      <div className="flex-1 p-6 overflow-auto">
      {activeTab === 'stockcount' && <StockCount />}
      {activeTab === 'inventory' && <InventoryManagement />}
        {activeTab === 'waste' && <WasteManagement />}
       
   
      </div>
    </div>
  );
}

export default App;
