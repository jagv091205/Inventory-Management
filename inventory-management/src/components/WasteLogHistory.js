import React, { useState, useEffect } from 'react';
import { db } from '../firebase/config';
import { collection, getDocs } from 'firebase/firestore';

const WasteLogHistory = () => {
  const [logs, setLogs] = useState([]);
  const [expandedLogId, setExpandedLogId] = useState(null);
  const [loading, setLoading] = useState(true);

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
      const wasteItemsRef = collection(db, `wasteLogs/${logId}/wasteItems`);
      const itemsSnapshot = await getDocs(wasteItemsRef);

      const itemsData = itemsSnapshot.docs.map((itemDoc) => {
        const itemData = itemDoc.data();

        let cleanItemId = 'N/A';
        try {
          if (itemData.itemId && itemData.itemId.path) {
            const fullPath = itemData.itemId.path; // example: 'inventory/item0'
            cleanItemId = fullPath.split('/')[1] || fullPath; // extract 'item0'
          } else if (typeof itemData.itemId === 'string') {
            const fullPath = itemData.itemId;
            cleanItemId = fullPath.split('/')[1] || fullPath; // extract 'item0'
          }
        } catch (e) {
          console.warn("Couldn't parse itemId:", e);
        }

        return {
          id: itemDoc.id,
          itemName: itemData.itemName || 'N/A',
          itemId: cleanItemId, // <-- use clean ID here
          boxesCount: itemData.boxesCount || 0,
          innerCount: itemData.innerCount || 0,
          unitsCount: itemData.unitsCount || 0,
          totalWaste: itemData.totalWaste || 0,
          reason: itemData.reason || 'N/A'
        };
      });

      setLogs(prevLogs =>
        prevLogs.map(log =>
          log.id === logId ? { ...log, wasteItems: itemsData } : log
        )
      );
    } catch (error) {
      console.error("Error fetching waste items:", error);
    }
  };

  if (loading) {
    return <div className="p-6 text-center text-gray-500">Loading waste logs...</div>;
  }

  return (
    <div className="p-6">
      <h1 className="text-2xl font-bold mb-6 text-gray-800">Waste Log History</h1>

      <div className="space-y-4">
        {logs.length === 0 ? (
          <div className="text-gray-500 text-center p-4">
            No waste logs found.
          </div>
        ) : (
          logs.map((log) => (
            <div key={log.id} className="bg-white rounded-lg shadow">
              <div 
                className="p-4 flex justify-between items-center cursor-pointer hover:bg-gray-50"
                onClick={() => handleLogExpand(log.id)}
              >
                <div>
                  <h3 className="font-semibold">
                    {new Date(log.timestamp).toLocaleString()}
                  </h3>
                  <div className="flex gap-4 mt-1 text-sm text-gray-600">
                    <span>Total Waste: {log.totalWaste}</span>
                    <span className={`font-medium ${
                      log.totalWaste !== 0 ? 'text-red-600' : 'text-green-600'
                    }`}>
                      {log.totalWaste !== 0 ? 'Waste Present' : 'No Waste'}
                    </span>
                  </div>
                </div>
                <span className="text-xl">
                  {expandedLogId === log.id ? '▼' : '▶'}
                </span>
              </div>

              {expandedLogId === log.id && (
                <div className="border-t p-4 bg-gray-50">
                  <h4 className="font-medium mb-4">Waste Items:</h4>

                  {log.wasteItems.length > 0 ? (
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
                          {log.wasteItems.map((item) => (
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
                    <div className="text-gray-500 text-center p-4">
                      No waste items found for this log.
                    </div>
                  )}
                </div>
              )}
            </div>
          ))
        )}
      </div>
    </div>
  );
};

export default WasteLogHistory;
