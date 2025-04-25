// import React, { useState, useEffect } from 'react';
// import { db } from '../firebase/config';
// import { collection, getDocs, setDoc, doc, getDoc } from 'firebase/firestore';

// const StockCount = () => {
//   const [inventoryItems, setInventoryItems] = useState([]);
//   const [loading, setLoading] = useState(true);
//   const [appliedCounts, setAppliedCounts] = useState({});
//   const [searchQuery, setSearchQuery] = useState('');
//   const [masterCheck, setMasterCheck] = useState(false);
//   const [varianceAttempts, setVarianceAttempts] = useState({});
//   const [submitAnywayEnabled, setSubmitAnywayEnabled] = useState(false);
//   const [varianceMessages, setVarianceMessages] = useState({});
//   const [itemsWithVariance, setItemsWithVariance] = useState([]);

//   useEffect(() => {
//     const fetchItemsData = async () => {
//       try {
//         const snapshot = await getDocs(collection(db, 'items'));
//         const items = await Promise.all(snapshot.docs.map(async (docSnap) => {
//           const data = docSnap.data();
//           const itemRef = doc(db, 'items', docSnap.id);
//           const itemDoc = await getDoc(itemRef);
//           const totalStockOnHand = itemDoc.data()?.totalStockOnHand || 0;

//           return {
//             id: docSnap.id,
//             itemName: data.itemName || 'Unknown Item',
//             unit: data.unit || 'EA',
//             boxes: 0,
//             innerPacks: 0,
//             units: 0,
//             innerPerBox: data.innerPerBox || 1,
//             unitsPerInner: data.unitsPerInner || 1,
//             pricePerUnit: data.price || 0,
//             totalStockOnHand,
//           };
//         }));
//         setInventoryItems(items);
//         setLoading(false);
//       } catch (error) {
//         console.error("Error fetching items data:", error);
//         setLoading(false);
//       }
//     };

//     fetchItemsData();
//   }, []);

//   const calculateStock = (item) =>
//     (item.boxes * item.innerPerBox * item.unitsPerInner) +
//     (item.innerPacks * item.unitsPerInner) +
//     item.units;

//   const handleInputChange = (id, field, value) => {
//     if (value !== '' && (isNaN(value) || Number(value) < 0)) return;

//     const updatedItems = inventoryItems.map(item => {
//       if (item.id === id) {
//         const newValue = value === '' ? '' : Number(value);
//         return { ...item, [field]: newValue };
//       }
//       return item;
//     });

//     setInventoryItems(updatedItems);
//   };

//   const handleTickChange = (id) => {
//     const item = inventoryItems.find(i => i.id === id);
//     const totalUnits = calculateStock(item);
//     const variance = totalUnits - item.totalStockOnHand;
//     const isChecked = !appliedCounts[id];

//     // Always toggle the checkbox state first
//     setAppliedCounts(prev => ({
//       ...prev,
//       [id]: isChecked
//     }));

//     if (isChecked && variance !== 0) {
//       // Only show attempts when checkbox is checked AND there's variance
//       const newAttempts = (varianceAttempts[id] || 0) + 1;
//       setVarianceAttempts(prev => ({
//         ...prev,
//         [id]: newAttempts
//       }));

//       setVarianceMessages(prev => ({
//         ...prev,
//         [id]: `Variance detected for ${item.itemName}: ${variance}. Please re-check.`
//       }));

//       // Track items with variance
//       setItemsWithVariance(prev => {
//         const existing = prev.find(i => i.id === id);
//         if (existing) {
//           return prev.map(i => i.id === id ? { ...i, variance } : i);
//         }
//         return [...prev, { id, itemName: item.itemName, variance }];
//       });

//       // Enable submit anyway if attempts >= 3
//       if (newAttempts >= 3) {
//         setSubmitAnywayEnabled(true);
//       }
//     } else if (!isChecked) {
//       // Reset when unchecking
//       setVarianceAttempts(prev => ({
//         ...prev,
//         [id]: 0
//       }));
//       setVarianceMessages(prev => ({
//         ...prev,
//         [id]: ''
//       }));
//       // Remove from items with variance
//       setItemsWithVariance(prev => prev.filter(item => item.id !== id));
//     }
//   };

//   const handleMasterCheck = () => {
//     const newState = !masterCheck;
//     setMasterCheck(newState);
//     const updated = {};
//     filteredItems.forEach(item => {
//       updated[item.id] = newState;
//       setVarianceAttempts(prev => ({
//         ...prev,
//         [item.id]: 0
//       }));
//       setVarianceMessages(prev => ({
//         ...prev,
//         [item.id]: ''
//       }));
//     });
//     setAppliedCounts(updated);
//     setItemsWithVariance([]);
//   };

//   const handleSaveAllApplied = async () => {
//     const currentDate = new Date();
//     const formattedDate = `${currentDate.getFullYear()}-${(currentDate.getMonth() + 1).toString().padStart(2, '0')}-${currentDate.getDate().toString().padStart(2, '0')}`;
//     const dateDocRef = doc(db, 'stockCounts', formattedDate);

//     const promises = inventoryItems
//       .filter(item => appliedCounts[item.id])
//       .map(item => {
//         const totalUnits = calculateStock(item);
//         const itemRef = doc(dateDocRef, 'items', item.id);
//         return setDoc(itemRef, {
//           date: formattedDate,
//           timestamp: currentDate.toISOString(),
//           itemId: item.id,
//           itemName: item.itemName,
//           boxes: item.boxes,
//           inners: item.innerPacks,
//           units: item.units,
//           totalUnits,
//           manager: "Adam Cole", // Replace with dynamic user data
//           managerId: "USER456",
//           status: "recorded"
//         });
//       });

//     try {
//       await Promise.all(promises);
//       alert("All selected stock counts saved.");
//     } catch (error) {
//       console.error("Error saving all applied stock counts:", error);
//     }
//   };

//   const handleSubmitAnyway = async () => {
//     const currentDate = new Date();
//     const formattedDate = `${currentDate.getFullYear()}-${(currentDate.getMonth() + 1).toString().padStart(2, '0')}-${currentDate.getDate().toString().padStart(2, '0')}`;
//     const dateDocRef = doc(db, 'stockCounts', formattedDate);

//     const promises = inventoryItems
//       .filter(item => appliedCounts[item.id])
//       .map(item => {
//         const totalUnits = calculateStock(item);
//         const itemRef = doc(dateDocRef, 'items', item.id);
//         return setDoc(itemRef, {
//           date: formattedDate,
//           timestamp: currentDate.toISOString(),
//           itemId: item.id,
//           itemName: item.itemName,
//           boxes: item.boxes,
//           inners: item.innerPacks,
//           units: item.units,
//           totalUnits,
//           manager: "Adam Cole",
//           managerId: "USER456",
//           status: "recorded",
//           variance: totalUnits - item.totalStockOnHand
//         });
//       });

//     try {
//       await Promise.all(promises);
//       alert("All selected stock counts saved with variances.");
//       setSubmitAnywayEnabled(false);
//     } catch (error) {
//       console.error("Error saving all applied stock counts with variances:", error);
//     }
//   };

//   const handleLogAndSubmitVariances = async () => {
//     const currentDate = new Date();
//     const timestamp = currentDate.toISOString();

//     try {
//       // Log variances to inventoryLog
//       const logPromises = itemsWithVariance.map(item => {
//         const logRef = doc(collection(db, 'inventoryLog'));
//         return setDoc(logRef, {
//           itemId: item.id,
//           itemName: item.itemName,
//           variance: item.variance,
//           timestamp,
//           action: 'forced_submission',
//           manager: "Adam Cole",
//           managerId: "USER456"
//         });
//       });

//       // Also save to stockCounts (original functionality)
//       const formattedDate = `${currentDate.getFullYear()}-${(currentDate.getMonth() + 1).toString().padStart(2, '0')}-${currentDate.getDate().toString().padStart(2, '0')}`;
//       const dateDocRef = doc(db, 'stockCounts', formattedDate);

//       const savePromises = inventoryItems
//         .filter(item => appliedCounts[item.id])
//         .map(item => {
//           const totalUnits = calculateStock(item);
//           const itemRef = doc(dateDocRef, 'items', item.id);
//           return setDoc(itemRef, {
//             date: formattedDate,
//             timestamp,
//             itemId: item.id,
//             itemName: item.itemName,
//             boxes: item.boxes,
//             inners: item.innerPacks,
//             units: item.units,
//             totalUnits,
//             manager: "Adam Cole",
//             managerId: "USER456",
//             status: "recorded_with_variance",
//             variance: totalUnits - item.totalStockOnHand
//           });
//         });

//       await Promise.all([...logPromises, ...savePromises]);
//       alert("Variances logged and counts saved!");

//       // Reset states
//       setSubmitAnywayEnabled(false);
//       setItemsWithVariance([]);
//       setVarianceAttempts({});
//       setVarianceMessages({});
//     } catch (error) {
//       console.error("Error submitting variances:", error);
//     }
//   };

//   const handleSearch = (e) => {
//     setSearchQuery(e.target.value.toLowerCase());
//   };

//   const filteredItems = inventoryItems.filter(item =>
//     item.itemName.toLowerCase().includes(searchQuery)
//   );

//   if (loading) return <div className="p-4">Loading inventory data...</div>;

//   return (
//     <div className="flex-1 p-6 overflow-auto">
//       <h1 className="text-2xl font-bold mb-6">Inventory Management (Stock Count)</h1>

//       {/* Controls */}
//       <div className="mb-4 flex flex-wrap items-center gap-4">
//         <div className="flex items-center gap-2">
//           <label className="font-semibold">Search Item:</label>
//           <input
//             type="text"
//             value={searchQuery}
//             onChange={handleSearch}
//             placeholder="Item name..."
//             className="border rounded p-2"
//           />
//         </div>

//         <div className="flex items-center gap-2">
//           <input
//             type="checkbox"
//             checked={masterCheck}
//             onChange={handleMasterCheck}
//             className="p-2"
//           />
//           <label>Tick All</label>
//         </div>

//         <button
//           onClick={handleSaveAllApplied}
//           className="bg-blue-600 text-white px-4 py-2 rounded shadow hover:bg-blue-700"
//         >
//           Save All Applied
//         </button>

//         {submitAnywayEnabled && (
//           <>
//             <button
//               onClick={handleSubmitAnyway}
//               className="bg-yellow-600 text-white px-4 py-2 rounded shadow hover:bg-yellow-700"
//             >
//               Submit with Variances
//             </button>
//             <button
//               onClick={handleLogAndSubmitVariances}
//               className="bg-red-600 text-white px-4 py-2 rounded shadow hover:bg-red-700"
//             >
//               Submit & Log Variances
//             </button>
//           </>
//         )}
//       </div>

//       {/* Table */}
//       <div className="overflow-x-auto bg-white rounded-lg shadow">
//         <table className="min-w-full">
//           <thead className="bg-gray-200">
//             <tr>
//               <th className="p-3 text-left">Item Name</th>
//               <th className="p-3 text-left">Unit</th>
//               <th className="p-3 text-left">Box</th>
//               <th className="p-3 text-left">Inner</th>
//               <th className="p-3 text-left">Unit</th>
//               <th className="p-3 text-left">Tick</th>
//               <th className="p-3 text-left">Variance</th>
//             </tr>
//           </thead>
//           <tbody>
//             {filteredItems.map(item => {
//               const stockCount = calculateStock(item);
//               const isApplied = appliedCounts[item.id];
//               const variance = stockCount - item.totalStockOnHand;
//               const attempts = varianceAttempts[item.id] || 0;
//               const varianceMessage = varianceMessages[item.id];

//               return (
//                 <tr key={item.id} className="border-t hover:bg-gray-50">
//                   <td className="p-3">{item.itemName}</td>
//                   <td className="p-3">{item.unit}</td>
//                   <td className="p-3">
//                     <input
//                       type="number"
//                       value={item.boxes}
//                       onChange={(e) => handleInputChange(item.id, 'boxes', e.target.value)}
//                       className="w-20 p-2 border rounded"
//                       min="0"
//                       disabled={isApplied}
//                     />
//                   </td>
//                   <td className="p-3">
//                     <input
//                       type="number"
//                       value={item.innerPacks}
//                       onChange={(e) => handleInputChange(item.id, 'innerPacks', e.target.value)}
//                       className="w-20 p-2 border rounded"
//                       min="0"
//                       disabled={isApplied}
//                     />
//                   </td>
//                   <td className="p-3">
//                     <input
//                       type="number"
//                       value={item.units}
//                       onChange={(e) => handleInputChange(item.id, 'units', e.target.value)}
//                       className="w-20 p-2 border rounded"
//                       min="0"
//                       disabled={isApplied}
//                     />
//                   </td>
//                   <td className="p-3">
//                     <input
//                       type="checkbox"
//                       checked={isApplied}
//                       onChange={() => handleTickChange(item.id)}
//                       className="p-2"
//                     />
//                   </td>
//                   <td className="p-3">
//                     {isApplied && variance !== 0 ? (
//                       <span className="text-red-600">
//                         {varianceMessage} (Attempts: {attempts}/3)
//                       </span>
//                     ) : (
//                       '-'
//                     )}
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

// export default StockCount;





// with sentneces 
// import React, { useState, useEffect } from 'react';
// import { db } from '../firebase/config';
// import { collection, getDocs, setDoc, doc } from 'firebase/firestore';

// const StockCount = () => {
//   const [inventoryItems, setInventoryItems] = useState([]);
//   const [loading, setLoading] = useState(true);
//   const [appliedCounts, setAppliedCounts] = useState({});
//   const [searchQuery, setSearchQuery] = useState('');
//   const [masterCheck, setMasterCheck] = useState(false);
//   const [showVarianceModal, setShowVarianceModal] = useState(false);
//   const [pendingVarianceItems, setPendingVarianceItems] = useState([]);
//   const [submittedItems, setSubmittedItems] = useState({});
//   const [showRecountVariances, setShowRecountVariances] = useState([]);

//   useEffect(() => {
//     const fetchItemsData = async () => {
//       try {
//         const snapshot = await getDocs(collection(db, 'inventory'));
//         const items = await Promise.all(
//           snapshot.docs.map(async (docSnap) => {
//             const data = docSnap.data();
//             return {
//               id: docSnap.id,
//               itemName: data.itemName || 'Unknown Item',
//               unit: 'EA',
//               boxes: '',
//               innerPacks: '',
//               units: '',
//               innerPerBox: data.innerPerBox || 1, // Correct field name
//               unitsPerInner: data.unitsPerInner || 1,
//               totalStockOnHand: data.totalStockOnHand || 0,
//             };
//           })
//         );
//         setInventoryItems(items);
//         setLoading(false);
//       } catch (error) {
//         console.error("Error fetching items data:", error);
//         setLoading(false);
//       }
//     };
//     fetchItemsData();
//   }, []);

//   const calculateStock = (item) => {
//     const boxes = item.boxes === '' ? 0 : Number(item.boxes);
//     const innerPacks = item.innerPacks === '' ? 0 : Number(item.innerPacks);
//     const units = item.units === '' ? 0 : Number(item.units);
    
//     return (boxes * item.innerPerBox * item.unitsPerInner) + 
//            (innerPacks * item.unitsPerInner) + 
//            units;
//   };

//   const handleInputChange = (id, field, value) => {
//     if (value !== '' && (isNaN(value) || Number(value) < 0)) return;

//     const updatedItems = inventoryItems.map(item => 
//       item.id === id ? { 
//         ...item, 
//         [field]: value === '' ? '' : Number(value) 
//       } : item
//     );
    
//     setInventoryItems(updatedItems);
//     setShowRecountVariances(prev => prev.filter(itemId => itemId !== id));
//   };

//   const handleTickChange = (id) => {
//     setAppliedCounts(prev => ({ ...prev, [id]: !prev[id] }));
//   };

//   const handleMasterCheck = () => {
//     const newState = !masterCheck;
//     setMasterCheck(newState);
    
//     const updated = inventoryItems.reduce((acc, item) => {
//       const hasData = item.boxes !== '' || item.innerPacks !== '' || item.units !== '';
//       acc[item.id] = newState && hasData;
//       return acc;
//     }, {});
    
//     setAppliedCounts(updated);
//   };

//   const saveItems = async (items, override = false) => {
//     const currentDate = new Date();
//     const formattedDate = `${currentDate.getFullYear()}-${(currentDate.getMonth() + 1).toString().padStart(2, '0')}-${currentDate.getDate().toString().padStart(2, '0')}`;
//     const dateDocRef = doc(db, 'stockCounts', formattedDate);

//     const newSubmitted = {};
    
//     const promises = items.map(item => {
//       const totalUnits = calculateStock(item);
//       const variance = totalUnits - item.totalStockOnHand;
//       newSubmitted[item.id] = true;

//       const itemRef = doc(dateDocRef, 'items', item.id);
//       return setDoc(itemRef, {
//         date: formattedDate,
//         timestamp: currentDate.toISOString(),
//         itemId: doc(db, 'inventory', item.id),
//         boxesCount: item.boxes === '' ? 0 : Number(item.boxes),
//         innerCount: item.innerPacks === '' ? 0 : Number(item.innerPacks),
//         unitsCount: item.units === '' ? 0 : Number(item.units),
//         totalCounted: totalUnits,
//         variance: variance,
//         needsRecount: !override && variance !== 0,
//         status: variance === 0 ? "completed" : "recorded_with_variance",
//         datePerformed: currentDate.toISOString(),
//       });
//     });

//     try {
//       await Promise.all(promises);
//       setSubmittedItems(prev => ({ ...prev, ...newSubmitted }));
//       setShowRecountVariances(prev => prev.filter(id => !newSubmitted[id]));
//     } catch (error) {
//       console.error("Error saving stock counts:", error);
//     }
//   };

//   const handleSaveAllApplied = async () => {
//     const itemsToSave = inventoryItems.filter(item => 
//       appliedCounts[item.id] && 
//       !submittedItems[item.id] &&
//       (item.boxes !== '' || item.innerPacks !== '' || item.units !== '')
//     );

//     const noVarianceItems = [];
//     const varianceItems = [];

//     itemsToSave.forEach(item => {
//       const totalUnits = calculateStock(item);
//       if (totalUnits === item.totalStockOnHand) {
//         noVarianceItems.push(item);
//       } else {
//         varianceItems.push(item);
//       }
//     });

//     if (varianceItems.length > 0) {
//       setPendingVarianceItems(varianceItems);
//       setShowRecountVariances(varianceItems.map(item => item.id));
//       setShowVarianceModal(true);
//     }

//     if (noVarianceItems.length > 0) {
//       await saveItems(noVarianceItems);
//     }
//   };

//   const handleSearch = (e) => setSearchQuery(e.target.value.toLowerCase());

//   const filteredItems = inventoryItems.filter(item =>
//     item.itemName.toLowerCase().includes(searchQuery)
//   );

//   if (loading) return <div className="p-4">Loading inventory data...</div>;

//   return (
//     <div className="flex-1 p-6 overflow-auto">
//       <h1 className="text-2xl font-bold mb-6">Inventory Management (Stock Count)</h1>

//       <div className="mb-4 flex flex-wrap items-center gap-4">
//         <div className="flex items-center gap-2">
//           <label className="font-semibold">Search Item:</label>
//           <input
//             type="text"
//             value={searchQuery}
//             onChange={handleSearch}
//             placeholder="Item name..."
//             className="border rounded p-2"
//           />
//         </div>

//         <div className="flex items-center gap-2">
//           <input
//             type="checkbox"
//             checked={masterCheck}
//             onChange={handleMasterCheck}
//             className="p-2"
//           />
//           <label>Tick All (only items with data)</label>
//         </div>

//         <button
//           onClick={handleSaveAllApplied}
//           className="bg-blue-600 text-white px-4 py-2 rounded shadow hover:bg-blue-700"
//         >
//           Save All Applied
//         </button>
//       </div>

//       <div className="overflow-x-auto bg-white rounded-lg shadow">
//         <table className="min-w-full">
//           <thead className="bg-gray-200">
//             <tr>
//               <th className="p-3 text-left">Item Name</th>
//               <th className="p-3 text-left">Unit</th>
//               <th className="p-3 text-left">Box</th>
//               <th className="p-3 text-left">Inner</th>
//               <th className="p-3 text-left">Unit</th>
//               <th className="p-3 text-left">Tick</th>
//               <th className="p-3 text-left">Variance</th>
//             </tr>
//           </thead>
//           <tbody>
//             {filteredItems.map(item => {
//               const isSubmitted = submittedItems[item.id];
//               const showVariance = (isSubmitted || showRecountVariances.includes(item.id)) && 
//                                 (calculateStock(item) !== item.totalStockOnHand);
//               const currentVariance = calculateStock(item) - item.totalStockOnHand;

//               return (
//                 <tr key={item.id}>
//                   <td className="p-3">{item.itemName}</td>
//                   <td className="p-3">{item.unit}</td>
//                   <td className="p-3">
//                     <input
//                       type="number"
//                       value={item.boxes}
//                       onChange={(e) => handleInputChange(item.id, 'boxes', e.target.value)}
//                       className="border rounded p-2 w-20"
//                       disabled={isSubmitted}
//                     />
//                   </td>
//                   <td className="p-3">
//                     <input
//                       type="number"
//                       value={item.innerPacks}
//                       onChange={(e) => handleInputChange(item.id, 'innerPacks', e.target.value)}
//                       className="border rounded p-2 w-20"
//                       disabled={isSubmitted}
//                     />
//                   </td>
//                   <td className="p-3">
//                     <input
//                       type="number"
//                       value={item.units}
//                       onChange={(e) => handleInputChange(item.id, 'units', e.target.value)}
//                       className="border rounded p-2 w-20"
//                       disabled={isSubmitted}
//                     />
//                   </td>
//                   <td className="p-3">
//                     <input
//                       type="checkbox"
//                       checked={appliedCounts[item.id] || false}
//                       onChange={() => handleTickChange(item.id)}
//                       disabled={isSubmitted}
//                     />
//                   </td>
//                   <td className="p-3">
//                     {showVariance && (
//                       <span className="text-sm">
//                         Variance detected for {item.itemName}: {currentVariance}. Please re-check.
//                       </span>
//                     )}
//                   </td>
//                 </tr>
//               );
//             })}
//           </tbody>
//         </table>
//       </div>

//       {showVarianceModal && (
//         <div className="fixed inset-0 bg-black bg-opacity-50 flex items-center justify-center">
//           <div className="bg-white p-6 rounded-lg max-w-md w-full">
//             <h3 className="text-lg font-bold mb-4">Variance Detected</h3>
//             <div className="mb-4">
//               <p className="font-semibold">Items with variances:</p>
//               <ul className="list-disc pl-5 mt-2">
//                 {pendingVarianceItems.map(item => {
//                   const variance = calculateStock(item) - item.totalStockOnHand;
//                   return (
//                     <li key={item.id} className="text-sm mb-2">
//                       Variance detected for {item.itemName}: {variance}. Please re-check.
//                     </li>
//                   );
//                 })}
//               </ul>
//             </div>
//             <div className="flex justify-end gap-4">
//               <button
//                 onClick={() => setShowVarianceModal(false)}
//                 className="bg-gray-500 text-white px-4 py-2 rounded hover:bg-gray-600"
//               >
//                 Recount
//               </button>
//               <button
//                 onClick={async () => {
//                   await saveItems(pendingVarianceItems, true);
//                   setShowVarianceModal(false);
//                 }}
//                 className="bg-blue-600 text-white px-4 py-2 rounded hover:bg-blue-700"
//               >
//                 Submit Anyway
//               </button>
//             </div>
//           </div>
//         </div>
//       )}
//     </div>
//   );
// };

// export default StockCount;



import React, { useState, useEffect } from 'react';
import { db } from '../firebase/config';
import { collection, getDocs, setDoc, doc } from 'firebase/firestore';


const StockCount = () => {
  const [inventoryItems, setInventoryItems] = useState([]);
  const [loading, setLoading] = useState(true);
  const [appliedCounts, setAppliedCounts] = useState({});
  const [searchQuery, setSearchQuery] = useState('');
  const [masterCheck, setMasterCheck] = useState(false);
  const [showVarianceModal, setShowVarianceModal] = useState(false);
  const [pendingVarianceItems, setPendingVarianceItems] = useState([]);
  const [submittedItems, setSubmittedItems] = useState({});
  const [itemsToHighlight, setItemsToHighlight] = useState([]);
  const [variances, setVariances] = useState({});
  const [showRecountVariances, setShowRecountVariances] = useState([]);

  useEffect(() => {
    const fetchItemsData = async () => {
      try {
        const snapshot = await getDocs(collection(db, 'inventory'));
        const items = await Promise.all(
          snapshot.docs.map(async (docSnap) => {
            const data = docSnap.data();
            return {
              id: docSnap.id,
              itemName: data.itemName || 'Unknown Item',
              unit: 'EA',
              boxes: '',
              innerPacks: '',
              units: '',
              innerPerBox: data.innerPerBox || 1,
              unitsPerInner: data.unitsPerInner || 1,
              totalStockOnHand: data.totalStockOnHand || 0,
            };
          })
        );
        setInventoryItems(items);
        setLoading(false);
      } catch (error) {
        console.error("Error fetching items data:", error);
        setLoading(false);
      }
    };
    fetchItemsData();
  }, []);

  const calculateStock = (item) =>
    (item.boxes * item.innerPerBox * item.unitsPerInner) +
    (item.innerPacks * item.unitsPerInner) +
    item.units;

  const handleInputChange = (id, field, value) => {
    if (value !== '' && (isNaN(value) || Number(value) < 0)) return;

    const updatedItems = inventoryItems.map(item => 
      item.id === id ? { ...item, [field]: value === '' ? '' : Number(value) } : item
    );
    setInventoryItems(updatedItems);
    setShowRecountVariances(prev => prev.filter(itemId => itemId !== id));
  };

  const handleTickChange = (id) => {
    setAppliedCounts(prev => ({ ...prev, [id]: !prev[id] }));
  };

  const handleMasterCheck = () => {
    const newState = !masterCheck;
    setMasterCheck(newState);
    const updated = inventoryItems.reduce((acc, item) => {
      const hasData = item.boxes !== '' || item.innerPacks !== '' || item.units !== '';
      acc[item.id] = newState && hasData;
      return acc;
    }, {});
    setAppliedCounts(updated);
  };

  const saveItems = async (items, override = false) => {
    const currentDate = new Date();
    const formattedDate = `${currentDate.getFullYear()}-${(currentDate.getMonth() + 1).toString().padStart(2, '0')}-${currentDate.getDate().toString().padStart(2, '0')}`;
    
    try {
      // Create variance log document
      const varianceLogRef = doc(collection(db, 'inventoryLog'));
      const logId = varianceLogRef.id;

      // Calculate total variance
      const totalVariance = items.reduce((sum, item) => {
        return sum + (calculateStock(item) - item.totalStockOnHand);
      }, 0);

      // Set variance log metadata
      await setDoc(varianceLogRef, {
        id: logId,
        timestamp: currentDate.toISOString(),
        totalVariance: totalVariance,
      });

      // Prepare write operations
      const stockCountPromises = [];
      const varianceItemPromises = [];

      items.forEach(item => {
        const totalUnits = calculateStock(item);
        const variance = totalUnits - item.totalStockOnHand;
        
        // Stock count document
        const dateDocRef = doc(db, 'stockCounts', formattedDate);
        const stockCountRef = doc(dateDocRef, 'items', item.id);
        
        stockCountPromises.push(setDoc(stockCountRef, {
          date: formattedDate,
          timestamp: currentDate.toISOString(),
          itemId: doc(db, 'inventory', item.id),
          boxesCount: item.boxes,
          innerCount: item.innerPacks,
          unitsCount: item.units,
          totalCounted: totalUnits,
          variance: variance,
          needsRecount: !override && variance !== 0,
          status: variance === 0 ? "completed" : "recorded_with_variance",
          datePerformed: currentDate.toISOString(),
        }));

        // Variance item document
        const variantItemRef = doc(collection(varianceLogRef, 'variantItems'), item.id);
        
        varianceItemPromises.push(setDoc(variantItemRef, {
          itemId: doc(db, `inventory/${item.id}`),
          boxesCount: item.boxes,
          innerCount: item.innerPacks,
          unitsCount: item.units,
          totalCounted: totalUnits,
          variance: variance,
          needsRecount: !override && variance !== 0,
          datePerformed: currentDate.toISOString(),
          status: variance === 0 ? "completed" : "recorded_with_variance",
          timestamp: currentDate.toISOString(),
        }));
      });

      // Execute all writes
      await Promise.all([...stockCountPromises, ...varianceItemPromises]);

      // Update UI state
      const newSubmitted = items.reduce((acc, item) => {
        acc[item.id] = true;
        return acc;
      }, {});
      
      const newVariances = items.reduce((acc, item) => {
        acc[item.id] = calculateStock(item) - item.totalStockOnHand;
        return acc;
      }, {});

      setSubmittedItems(prev => ({ ...prev, ...newSubmitted }));
      setVariances(prev => ({ ...prev, ...newVariances }));
      setItemsToHighlight(prev => prev.filter(id => !newSubmitted[id]));
      setShowRecountVariances(prev => prev.filter(id => !newSubmitted[id]));
      
      alert("Stock counts and variance logs saved successfully.");
    } catch (error) {
      console.error("Error saving data:", error);
      alert("Error saving data. Please check the console.");
    }
  };

  const handleSaveAllApplied = async () => {
    const itemsToSave = inventoryItems.filter(item => 
      appliedCounts[item.id] && !submittedItems[item.id]
    );

    const noVarianceItems = [];
    const varianceItems = [];

    itemsToSave.forEach(item => {
      const totalUnits = calculateStock(item);
      if (totalUnits === item.totalStockOnHand) {
        noVarianceItems.push(item);
      } else {
        varianceItems.push(item);
      }
    });

    if (varianceItems.length > 0) {
      setPendingVarianceItems(varianceItems);
      setItemsToHighlight(varianceItems.map(item => item.id));
      setShowRecountVariances(varianceItems.map(item => item.id));
      setShowVarianceModal(true);
    }

    if (noVarianceItems.length > 0) {
      await saveItems(noVarianceItems);
    }
  };

  const handleSearch = (e) => setSearchQuery(e.target.value.toLowerCase());

  const filteredItems = inventoryItems.filter(item =>
    item.itemName.toLowerCase().includes(searchQuery)
  );

  if (loading) return <div className="p-4">Loading inventory data...</div>;

  return (
    <div className="flex-1 p-6 overflow-auto">
      <h1 className="text-2xl font-bold mb-6">Inventory Management (Stock Count)</h1>

      <div className="mb-4 flex flex-wrap items-center gap-4">
        <div className="flex items-center gap-2">
          <label className="font-semibold">Search Item:</label>
          <input
            type="text"
            value={searchQuery}
            onChange={handleSearch}
            placeholder="Item name..."
            className="border rounded p-2"
          />
        </div>

        <div className="flex items-center gap-2">
          <input
            type="checkbox"
            checked={masterCheck}
            onChange={handleMasterCheck}
            className="p-2"
          />
          <label>Tick All</label>
        </div>

        <button
          onClick={handleSaveAllApplied}
          className="bg-blue-600 text-white px-4 py-2 rounded shadow hover:bg-blue-700"
        >
          Save All Applied
        </button>
      </div>

      <div className="overflow-x-auto bg-white rounded-lg shadow">
        <table className="min-w-full">
          <thead className="bg-gray-200">
            <tr>
              <th className="p-3 text-left">Item Name</th>
              <th className="p-3 text-left">Unit</th>
              <th className="p-3 text-left">Box</th>
              <th className="p-3 text-left">Inner</th>
              <th className="p-3 text-left">Unit</th>
              <th className="p-3 text-left">Tick</th>
              <th className="p-3 text-left">Variance</th>
            </tr>
          </thead>
          <tbody>
            {filteredItems.map(item => {
              const isSubmitted = submittedItems[item.id];
              const hasHighlight = itemsToHighlight.includes(item.id);
              const currentVariance = calculateStock(item) - item.totalStockOnHand;

              return (
                <tr key={item.id}>
                  <td className="p-3">{item.itemName}</td>
                  <td className="p-3">{item.unit}</td>
                  <td className="p-3">
                    <input
                      type="number"
                      value={item.boxes}
                      onChange={(e) => handleInputChange(item.id, 'boxes', e.target.value)}
                      className={`border rounded p-2 w-20 ${hasHighlight ? 'border-red-500' : ''}`}
                      disabled={isSubmitted}
                    />
                  </td>
                  <td className="p-3">
                    <input
                      type="number"
                      value={item.innerPacks}
                      onChange={(e) => handleInputChange(item.id, 'innerPacks', e.target.value)}
                      className={`border rounded p-2 w-20 ${hasHighlight ? 'border-red-500' : ''}`}
                      disabled={isSubmitted}
                    />
                  </td>
                  <td className="p-3">
                    <input
                      type="number"
                      value={item.units}
                      onChange={(e) => handleInputChange(item.id, 'units', e.target.value)}
                      className={`border rounded p-2 w-20 ${hasHighlight ? 'border-red-500' : ''}`}
                      disabled={isSubmitted}
                    />
                  </td>
                  <td className="p-3">
                    <input
                      type="checkbox"
                      checked={appliedCounts[item.id]}
                      onChange={() => handleTickChange(item.id)}
                      disabled={isSubmitted}
                    />
                  </td>
                  <td className="p-3">
                    {(isSubmitted || showRecountVariances.includes(item.id)) && (
                      <span className={currentVariance !== 0 ? 'text-red-600' : ''}>
                        {currentVariance}
                      </span>
                    )}
                  </td>
                </tr>
              );
            })}
          </tbody>
        </table>
      </div>

      {showVarianceModal && (
        <div className="fixed inset-0 bg-black bg-opacity-50 flex items-center justify-center">
          <div className="bg-white p-6 rounded-lg max-w-md w-full">
            <h3 className="text-lg font-bold mb-4">Variance Detected</h3>
            <p className="mb-4">There is a variance in {pendingVarianceItems.length} item(s).</p>
            <div className="flex justify-end gap-4">
              <button
                onClick={() => setShowVarianceModal(false)}
                className="bg-gray-500 text-white px-4 py-2 rounded hover:bg-gray-600"
              >
                Recount
              </button>
              <button
                onClick={async () => {
                  await saveItems(pendingVarianceItems, true);
                  setShowVarianceModal(false);
                }}
                className="bg-blue-600 text-white px-4 py-2 rounded hover:bg-blue-700"
              >
                Submit Anyway
              </button>
            </div>
          </div>
        </div>
      )}
    </div>
  );
};

export default StockCount;