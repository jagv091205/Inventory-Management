// import React, { useState, useEffect } from 'react';
// import { db } from '../firebase/config';
// import { collection, getDocs, updateDoc, doc } from 'firebase/firestore';

// const InventoryManagement = () => {
//   const [inventoryItems, setInventoryItems] = useState([]);
//   const [loading, setLoading] = useState(true);

//   useEffect(() => {
//     const fetchInventoryData = async () => {
//       try {
//         const snapshot = await getDocs(collection(db, 'inventory'));
//         const items = await Promise.all(snapshot.docs.map(async docSnap => {
//           const data = docSnap.data();
//           const dataSnapshot = await getDocs(collection(db, 'inventory', docSnap.id, 'data'));
//           const latestData = dataSnapshot.docs.sort((a, b) => new Date(b.data().timestamp) - new Date(a.data().timestamp))[0];

//           return {
//             id: docSnap.id,
//             itemName: data.itemName || 'Unknown Item',
//             unit: data.unit || 'EA',
//             boxes: latestData ? latestData.data().boxes : 0,
//             innerPacks: latestData ? latestData.data().innerPacks : 0,
//             units: latestData ? latestData.data().units : 0,
//             innerPerBox: data.innerPerBox || 1,
//             unitsPerInner: data.unitsPerInner || 1,
//             totalUnit: latestData ? latestData.data().stockOnHand : 0, // Keep this for internal calculation
//             pricePerUnit: data.price || 0, // Ensure pricePerUnit is fetched correctly
//           };
//         }));
//         setInventoryItems(items);
//         setLoading(false);
//       } catch (error) {
//         console.error("Error fetching inventory data:", error);
//         setLoading(false);
//       }
//     };

//     fetchInventoryData();
//   }, []);

//   const calculateStock = (item) =>
//     (item.boxes * item.innerPerBox * item.unitsPerInner) +
//     (item.innerPacks * item.unitsPerInner) +
//     item.units;

//   const handleInputChange = async (id, field, value) => {
//     if (value !== '' && (isNaN(value) || Number(value) < 0)) return;

//     const updatedItems = inventoryItems.map(item => {
//       if (item.id === id) {
//         const newValue = value === '' ? '' : Number(value);
//         const updatedItem = { ...item, [field]: newValue };
//         const stockOnHand = calculateStock(updatedItem);

//         return { ...updatedItem, stockOnHand };
//       }
//       return item;
//     });

//     setInventoryItems(updatedItems);

//     try {
//       const item = updatedItems.find(i => i.id === id);
//       await updateDoc(doc(db, 'inventory', id), {
//         [field]: item[field],
//       });
//     } catch (error) {
//       console.error("Error updating document:", error);
//     }
//   };

//   const getVarianceColor = value => {
//     const abs = Math.abs(value);
//     return abs <= 10 ? 'text-green-600' : 'text-red-600';
//   };

//   if (loading) return <div className="p-4">Loading inventory data...</div>;

//   return (
//     <div className="flex-1 p-6 overflow-auto">
//       <h1 className="text-2xl font-bold mb-6">Inventory Management</h1>
//       <div className="overflow-x-auto bg-white rounded-lg shadow">
//         <table className="min-w-full">
//           <thead className="bg-gray-200">
//             <tr>
//               <th className="p-3 text-left">Item Name</th>
//               <th className="p-3 text-left">Unit</th>
//               <th className="p-3 text-left">Box</th>
//               <th className="p-3 text-left">Inner</th>
//               <th className="p-3 text-left">Unit</th>
//               <th className="p-3 text-left">Stock On Hand</th>
//               <th className="p-3 text-left">Variance Units</th>
//               <th className="p-3 text-left">Variance Value</th>
//             </tr>
//           </thead>
//           <tbody>
//             {inventoryItems.map(item => {
//               const stockOnHand = calculateStock(item);
//               const varianceUnits = stockOnHand - item.totalUnit;
//               const varianceValue = varianceUnits * item.pricePerUnit;

//               return (
//                 <tr key={item.id} className="border-t hover:bg-gray-50">
//                   <td className="p-3">{item.itemName}</td>
//                   <td className="p-3">{item.unit}</td>
//                   <td className="p-3">
//                     <input
//                       type="number"
//                       value={item.boxes}
//                       onChange={(e) => handleInputChange(item.id, 'boxes', e.target.value)}
//                       className="w-20 p-2 border rounded focus:ring-2 focus:ring-blue-500"
//                       placeholder="0"
//                       min="0"
//                     />
//                   </td>
//                   <td className="p-3">
//                     <input
//                       type="number"
//                       value={item.innerPacks}
//                       onChange={(e) => handleInputChange(item.id, 'innerPacks', e.target.value)}
//                       className="w-20 p-2 border rounded focus:ring-2 focus:ring-blue-500"
//                       placeholder="0"
//                       min="0"
//                     />
//                   </td>
//                   <td className="p-3">
//                     <input
//                       type="number"
//                       value={item.units}
//                       onChange={(e) => handleInputChange(item.id, 'units', e.target.value)}
//                       className="w-20 p-2 border rounded focus:ring-2 focus:ring-blue-500"
//                       placeholder="0"
//                       min="0"
//                     />
//                   </td>
//                   <td className="p-3">{stockOnHand.toLocaleString()}</td>
//                   <td className={`p-3 font-medium ${getVarianceColor(varianceUnits)}`}>
//                     {varianceUnits}
//                   </td>
//                   <td className={`p-3 font-medium ${getVarianceColor(varianceValue)}`}>
//                     £{varianceValue.toFixed(2)}
//                   </td>
//                 </tr>
//               );
//             })}
//           </tbody>
//         </table>
//       </div>
//     </div>
//   );
// };

// export default InventoryManagement;



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