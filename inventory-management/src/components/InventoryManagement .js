
import React, { useState, useEffect } from 'react';
import { db } from '../firebase/config';
import { collection, getDocs, doc, getDoc } from 'firebase/firestore';

const InventoryManagement = () => {
  const [logs, setLogs] = useState([]);
  const [expandedLogId, setExpandedLogId] = useState(null);
  const [loading, setLoading] = useState(true);
  const [itemDetails, setItemDetails] = useState({});

  useEffect(() => {
    const fetchLogs = async () => {
      try {
        const logsSnapshot = await getDocs(collection(db, 'inventoryLog'));
        const logsData = await Promise.all(
          logsSnapshot.docs.map(async (doc) => {
            const data = doc.data();
            return {
              id: doc.id,
              timestamp: data.timestamp,
              managerName: data.managerName,
              totalVariance: data.totalVariance,
              variantItems: []
            };
          })
        );
        setLogs(logsData);
        setLoading(false);
      } catch (error) {
        console.error("Error fetching variance logs:", error);
        setLoading(false);
      }
    };

    fetchLogs();
  }, []);

  const handleLogExpand = async (logId) => {
    if (expandedLogId === logId) {
      setExpandedLogId(null);
      return;
    }

    setExpandedLogId(logId);
    
    try {
      // Fetch variant items for the selected log
      const variantItemsRef = collection(db, `inventoryLog/${logId}/variantItems`);
      const itemsSnapshot = await getDocs(variantItemsRef);
      
      const itemsData = await Promise.all(
        itemsSnapshot.docs.map(async (itemDoc) => {
          const itemData = itemDoc.data();
          
          // Fetch inventory item details
          const inventoryItemSnap = await getDoc(itemData.itemId);
          const inventoryItem = inventoryItemSnap.data();
          
          return {
            id: itemDoc.id,
            itemName: inventoryItem?.itemName || 'Unknown Item',
            itemId: itemData.itemId.id,
            boxesCount: itemData.boxesCount,
            innerCount: itemData.innerCount,
            unitsCount: itemData.unitsCount,
            totalCounted: itemData.totalCounted,
            variance: itemData.variance,
            status: itemData.status
          };
        })
      );

      setLogs(prevLogs => prevLogs.map(log => 
        log.id === logId ? { ...log, variantItems: itemsData } : log
      ));
    } catch (error) {
      console.error("Error fetching variant items:", error);
    }
  };

  if (loading) return <div className="p-4">Loading variance logs...</div>;

  return (
    <div className="flex-1 p-6 overflow-auto">
      <h1 className="text-2xl font-bold mb-6">Variance Log History</h1>
      
      <div className="bg-white rounded-lg shadow overflow-hidden">
        <table className="min-w-full">
          <thead className="bg-gray-200">
            <tr>
              <th className="p-3 text-left">Timestamp</th>
              <th className="p-3 text-left">Manager</th>
              <th className="p-3 text-left">Total Variance</th>
              <th className="p-3 text-left">Details</th>
            </tr>
          </thead>
          <tbody>
            {logs.map(log => (
              <React.Fragment key={log.id}>
                <tr 
                  onClick={() => handleLogExpand(log.id)}
                  className="cursor-pointer hover:bg-gray-50"
                >
                  <td className="p-3">
                    {new Date(log.timestamp).toLocaleString()}
                  </td>
                  <td className="p-3">{log.managerName}</td>
                  <td className="p-3">{log.totalVariance}</td>
                  <td className="p-3">
                    {expandedLogId === log.id ? '▼' : '▶'}
                  </td>
                </tr>
                
                {expandedLogId === log.id && (
                  <tr className="bg-gray-50">
                    <td colSpan="4" className="p-4">
                      <div className="ml-4">
                        <h3 className="font-semibold mb-2">Variant Items:</h3>
                        <table className="min-w-full bg-white rounded shadow">
                          <thead className="bg-gray-100">
                            <tr>
                              <th className="p-2 text-left">Item Name</th>
                              <th className="p-2 text-left">Item ID</th>
                              <th className="p-2 text-left">Boxes</th>
                              <th className="p-2 text-left">Inner</th>
                              <th className="p-2 text-left">Units</th>
                              <th className="p-2 text-left">Total Counted</th>
                              <th className="p-2 text-left">Variance</th>
                              <th className="p-2 text-left">Status</th>
                            </tr>
                          </thead>
                          <tbody>
                            {log.variantItems.map(item => (
                              <tr key={item.id}>
                                <td className="p-2">{item.itemName}</td>
                                <td className="p-2">{item.itemId}</td>
                                <td className="p-2">{item.boxesCount}</td>
                                <td className="p-2">{item.innerCount}</td>
                                <td className="p-2">{item.unitsCount}</td>
                                <td className="p-2">{item.totalCounted}</td>
                                <td className={`p-2 ${item.variance !== 0 ? 'text-red-600' : ''}`}>
                                  {item.variance}
                                </td>
                                <td className="p-2">
                                  <span className={`px-2 py-1 rounded ${
                                    item.status === 'completed' 
                                      ? 'bg-green-100 text-green-800' 
                                      : 'bg-yellow-100 text-yellow-800'
                                  }`}>
                                    {item.status}
                                  </span>
                                </td>
                              </tr>
                            ))}
                          </tbody>
                        </table>
                      </div>
                    </td>
                  </tr>
                )}
              </React.Fragment>
            ))}
          </tbody>
        </table>
      </div>
    </div>
  );
};



export default InventoryManagement;