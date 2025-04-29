import React, { useState, useEffect } from 'react';
import { db } from '../firebase/config';
import {
  collection,
  getDocs,
  doc,
  getDoc
} from 'firebase/firestore';

const InventoryAndWasteHistory = () => {
  const [logs, setLogs] = useState([]);
  const [expandedLogId, setExpandedLogId] = useState(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState(null);
  const [expandedLogIds, setExpandedLogIds] = useState(new Set());


  useEffect(() => {
    const fetchAllLogs = async () => {
      try {
        const [inventorySnapshot, wasteSnapshot] = await Promise.all([
          getDocs(collection(db, 'inventoryLog')),
          getDocs(collection(db, 'wasteLogs')),
        ]);
  
        const inventoryLogs = await Promise.all(
          inventorySnapshot.docs.map(async (doc) => {
            const data = doc.data();
            return {
              id: doc.id,
              type: 'inventory',
              timestamp: data.timestamp,
              date: doc.id,
              totalVariance: data.totalVariance || 0,
              status: data.status || 'pending',
              countType: data.countType || 'initial',
              items: null
            };
          })
        );
  
        const wasteLogs = await Promise.all(
          wasteSnapshot.docs.map(async (doc) => {
            const data = doc.data();
            return {
              id: doc.id,
              type: 'waste',
              timestamp: data.timestamp,
              totalWaste: data.totalWaste || 0,
              wasteItems: null
            };
          })
        );
  
        // Sort logs to display waste first, then inventory
        const combinedLogs = [
          ...wasteLogs.sort((a, b) => new Date(b.timestamp) - new Date(a.timestamp)),
          ...inventoryLogs.sort((a, b) => new Date(b.timestamp) - new Date(a.timestamp))
        ];
  
        setLogs(combinedLogs);
        setLoading(false);
      } catch (err) {
        console.error("Error loading logs:", err);
        setError('Failed to load logs');
        setLoading(false);
      }
    };
  
    fetchAllLogs();
  }, []);

  const handleLogExpand = async (log) => {
    const newSet = new Set(expandedLogIds);
    if (newSet.has(log.id)) {
      newSet.delete(log.id); // Collapse this log
    } else {
      newSet.add(log.id); // Expand this log
    }
    setExpandedLogIds(newSet);
  
    if (log.type === 'inventory' && !log.items) {
      try {
        const itemsRef = collection(db, `inventoryLog/${log.id}/items`);
        const itemsSnapshot = await getDocs(itemsRef);
  
        const itemsData = await Promise.all(
          itemsSnapshot.docs.map(async (itemDoc) => {
            const itemData = itemDoc.data();
            const inventoryRef = doc(db, 'inventory', itemData.itemId);
            const inventorySnap = await getDoc(inventoryRef);
  
            return {
              id: itemDoc.id,
              itemId: itemData.itemId,
              itemName: inventorySnap.exists() ? inventorySnap.data().itemName : 'Deleted Item',
              boxes: itemData.boxesCount || 0,
              inners: itemData.innerCount || 0,
              units: itemData.unitsCount || 0,
              totalCounted: itemData.totalCounted || 0,
              variance: itemData.variance || 0,
              status: itemData.status || 'recorded'
            };
          })
        );
  
        setLogs(prev =>
          prev.map(l => l.id === log.id ? { ...l, items: itemsData } : l)
        );
      } catch (err) {
        console.error("Error fetching inventory items:", err);
        setError('Failed to fetch inventory items');
      }
    }
  
    if (log.type === 'waste' && !log.wasteItems) {
      try {
        const wasteItemsRef = collection(db, `wasteLogs/${log.id}/wasteItems`);
        const itemsSnapshot = await getDocs(wasteItemsRef);
  
        const itemsData = itemsSnapshot.docs.map((itemDoc) => {
          const itemData = itemDoc.data();
          let cleanItemId = 'N/A';
          if (itemData.itemId) {
            const ref = typeof itemData.itemId === 'string' ? itemData.itemId : itemData.itemId.path;
            cleanItemId = ref.split('/')[1] || ref;
          }
  
          return {
            id: itemDoc.id,
            itemName: itemData.itemName || 'N/A',
            itemId: cleanItemId,
            boxesCount: itemData.boxesCount || 0,
            innerCount: itemData.innerCount || 0,
            unitsCount: itemData.unitsCount || 0,
            totalWaste: itemData.totalWaste || 0,
            reason: itemData.reason || 'N/A'
          };
        });
  
        setLogs(prev =>
          prev.map(l => l.id === log.id ? { ...l, wasteItems: itemsData } : l)
        );
      } catch (err) {
        console.error("Error fetching waste items:", err);
        setError('Failed to fetch waste items');
      }
    }
  };
  
  const formatDate = (timestamp) => {
    const options = {
      year: 'numeric',
      month: 'short',
      day: 'numeric',
      hour: '2-digit',
      minute: '2-digit'
    };
    return new Date(timestamp).toLocaleString(undefined, options);
  };

  if (loading) return <div className="p-6 text-gray-600">Loading logs...</div>;
  if (error) return <div className="p-6 text-red-600">{error}</div>;

  return (
    <div className="p-6">
      <h1 className="text-2xl font-bold mb-6 text-gray-800">Inventory & Waste History</h1>
      <div className="space-y-4">
        {logs.map((log) => (
          <div key={log.id} className="bg-white rounded-lg shadow">
            <div
              className="p-4 flex justify-between items-center cursor-pointer hover:bg-gray-50"
              onClick={() => handleLogExpand(log)}
            >
              <div>
                <h3 className="font-semibold">
                  {formatDate(log.timestamp)} • {log.type === 'inventory' ? 'Inventory Count' : 'Waste Log'}
                </h3>
                {log.type === 'inventory' ? (
                  <div className="text-sm text-gray-600 mt-1 flex gap-4">
                    <span>Type: {log.countType}</span>
                    <span>Status: {log.status}</span>
                    <span className={`font-medium ${log.totalVariance !== 0 ? 'text-red-600' : 'text-green-600'}`}>
                      Total Variance: {log.totalVariance}
                    </span>
                  </div>
                ) : (
                  <div className="text-sm text-gray-600 mt-1 flex gap-4">
                    <span>Total Waste: {log.totalWaste}</span>
                    <span className={`font-medium ${log.totalWaste !== 0 ? 'text-red-600' : 'text-green-600'}`}>
                      {log.totalWaste !== 0 ? 'Waste Present' : 'No Waste'}
                    </span>
                  </div>
                )}
              </div>
              <span className="text-xl">
                {expandedLogId === log.id ? '▼' : '▶'}
              </span>
            </div>

            {expandedLogIds.has(log.id) && (

              <div className="border-t p-4 bg-gray-50">
                {log.type === 'inventory' ? (
                  <>
                    <h4 className="font-medium mb-4">Count Details:</h4>
                    {log.items?.length > 0 ? (
                      <div className="overflow-x-auto">
                        <table className="min-w-full bg-white rounded shadow">
                          <thead className="bg-gray-100">
                            <tr>
                              <th className="p-3 text-left">Item</th>
                              <th className="p-3 text-left">Boxes</th>
                              <th className="p-3 text-left">Inners</th>
                              <th className="p-3 text-left">Units</th>
                              <th className="p-3 text-left">Counted</th>
                              <th className="p-3 text-left">Variance</th>
                              <th className="p-3 text-left">Status</th>
                            </tr>
                          </thead>
                          <tbody>
                            {log.items.map(item => (
                              <tr key={item.id} className="border-t">
                                <td className="p-3">
                                  <div className="font-medium">{item.itemName}</div>
                                  <div className="text-xs text-gray-500">ID: {item.itemId}</div>
                                </td>
                                <td className="p-3">{item.boxes}</td>
                                <td className="p-3">{item.inners}</td>
                                <td className="p-3">{item.units}</td>
                                <td className="p-3">{item.totalCounted}</td>
                                <td className={`p-3 font-medium ${item.variance !== 0 ? 'text-red-600' : 'text-green-600'}`}>
                                  {item.variance > 0 ? '+' : ''}{item.variance}
                                </td>
                                <td className="p-3">
                                  <span className={`px-2 py-1 rounded text-sm ${
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
                    ) : (
                      <div className="text-gray-500 text-center">No items found.</div>
                    )}
                  </>
                ) : (
                  <>
                    <h4 className="font-medium mb-4">Waste Items:</h4>
                    {log.wasteItems?.length > 0 ? (
                      <div className="overflow-x-auto">
                        <table className="min-w-full bg-white rounded shadow">
                          <thead className="bg-gray-100">
                            <tr>
                              <th className="p-3 text-left">Item Name</th>
                              <th className="p-3 text-left">Boxes</th>
                              <th className="p-3 text-left">Inner</th>
                              <th className="p-3 text-left">Units</th>
                              <th className="p-3 text-left">Total Waste</th>
                              <th className="p-3 text-left">Reason</th>
                            </tr>
                          </thead>
                          <tbody>
                            {log.wasteItems.map(item => (
                              <tr key={item.id} className="border-t">
                                <td className="p-3">
                                  <div className="font-medium">{item.itemName}</div>
                                  <div className="text-xs text-gray-500">ID: {item.itemId}</div>
                                </td>
                                <td className="p-3">{item.boxesCount}</td>
                                <td className="p-3">{item.innerCount}</td>
                                <td className="p-3">{item.unitsCount}</td>
                                <td className="p-3">{item.totalWaste}</td>
                                <td className="p-3">{item.reason}</td>
                              </tr>
                            ))}
                          </tbody>
                        </table>
                      </div>
                    ) : (
                      <div className="text-gray-500 text-center">No waste items found.</div>
                    )}
                  </>
                )}
              </div>
            )}
          </div>
        ))}
      </div>
    </div>
  );
};

export default InventoryAndWasteHistory;
