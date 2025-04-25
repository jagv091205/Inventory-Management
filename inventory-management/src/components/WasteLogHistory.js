import React, { useState, useEffect } from 'react';
import { db } from '../firebase/config';
import { collection, getDocs, doc, getDoc } from 'firebase/firestore';

const WasteLogHistory = () => {
  const [logs, setLogs] = useState([]);
  const [expandedLogId, setExpandedLogId] = useState(null);
  const [loading, setLoading] = useState(true);
  const [itemDetails, setItemDetails] = useState({});


  useEffect(() => {
    const fetchLogs = async () => {
      try {
        const logsSnapshot = await getDocs(collection(db, 'wasteLogs'));
        const logsData = await Promise.all(
          logsSnapshot.docs.map(async (doc) => {
            const data = doc.data();
            return {
              id: doc.id,
              timestamp: data.timestamp,
              totalWaste: data.totalWaste,
              wasteItems: []
            };
          })
        );
        setLogs(logsData);
        setLoading(false);
      } catch (error) {
        console.error("Error fetching waste logs:", error);
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
      // Fetch waste items for the selected log
      const wasteItemsRef = collection(db, `wasteLogs/${logId}/wasteItems`);
      const itemsSnapshot = await getDocs(wasteItemsRef);
      
      const itemsData = await Promise.all(
        itemsSnapshot.docs.map(async (itemDoc) => {
          const itemData = itemDoc.data();
          
          return {
            id: itemDoc.id,
            itemName: itemData.itemName,
            itemId: itemData.itemId.id,
            boxesCount: itemData.boxesCount,
            innerCount: itemData.innerCount,
            unitsCount: itemData.unitsCount,
            totalWaste: itemData.totalWaste,
            reason: itemData.reason
          };
        })
      );

      setLogs(prevLogs => prevLogs.map(log => 
        log.id === logId ? { ...log, wasteItems: itemsData } : log
      ));
    } catch (error) {
      console.error("Error fetching waste items:", error);
    }
  };

  if (loading) return <div className="p-4">Loading waste logs...</div>;

  return (
    <div className="flex-1 p-6 overflow-auto">
      <h1 className="text-2xl font-bold mb-6">Waste Log History</h1>
      
      <div className="bg-white rounded-lg shadow overflow-hidden">
        <table className="min-w-full">
          <thead className="bg-gray-200">
            <tr>
              <th className="p-3 text-left">Timestamp</th>
              <th className="p-3 text-left">Total Waste</th>
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
                  <td className="p-3">{log.totalWaste}</td>
                  <td className="p-3">
                    {expandedLogId === log.id ? '▼' : '▶'}
                  </td>
                </tr>
                
                {expandedLogId === log.id && (
                  <tr className="bg-gray-50">
                    <td colSpan="3" className="p-4">
                      <div className="ml-4">
                        <h3 className="font-semibold mb-2">Waste Items:</h3>
                        <table className="min-w-full bg-white rounded shadow">
                          <thead className="bg-gray-100">
                            <tr>
                              <th className="p-2 text-left">Item Name</th>
                              <th className="p-2 text-left">Boxes</th>
                              <th className="p-2 text-left">Inner</th>
                              <th className="p-2 text-left">Units</th>
                              <th className="p-2 text-left">Total Waste</th>
                              <th className="p-2 text-left">Reason</th>
                            </tr>
                          </thead>
                          <tbody>
                            {log.wasteItems.map(item => (
                              <tr key={item.id}>
                                <td className="p-2">{item.itemName}</td>
                                <td className="p-2">{item.boxesCount}</td>
                                <td className="p-2">{item.innerCount}</td>
                                <td className="p-2">{item.unitsCount}</td>
                                <td className="p-2">{item.totalWaste}</td>
                                <td className="p-2">{item.reason}</td>
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

export default WasteLogHistory;