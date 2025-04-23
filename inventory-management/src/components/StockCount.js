// import React, { useState, useEffect } from 'react';
// import { db } from '../firebase/config';
// import { collection, getDocs, updateDoc, doc, addDoc } from 'firebase/firestore';

// const StockCount = () => {
//   const [inventoryItems, setInventoryItems] = useState([]);
//   const [loading, setLoading] = useState(true);
//   const [appliedCounts, setAppliedCounts] = useState({});

//   useEffect(() => {
//     const fetchItemsData = async () => {
//       try {
//         // Fetch all items from 'items' table
//         const snapshot = await getDocs(collection(db, 'items'));
//         const items = snapshot.docs.map(docSnap => {
//           const data = docSnap.data();
//           return {
//             id: docSnap.id,
//             itemName: data.itemName || 'Unknown Item',
//             unit: data.unit || 'EA',
//             boxes: 0, // Initially set to 0
//             innerPacks: 0, // Initially set to 0
//             units: 0, // Initially set to 0
//             innerPerBox: data.innerPerBox || 1,
//             unitsPerInner: data.unitsPerInner || 1,
//             pricePerUnit: data.pricePerUnit || 0,
//           };
//         });
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

//   const handleInputChange = async (id, field, value) => {
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

//   const handleApplyChanges = async (id) => {
//     const item = inventoryItems.find(i => i.id === id);
//     const stockCount = calculateStock(item);

//     try {
//       // Save the data to 'inventory' collection
//       await updateDoc(doc(db, 'inventory', id), {
//         boxes: item.boxes,
//         innerPacks: item.innerPacks,
//         units: item.units,
//         stockOnHand: stockCount,
//       });

//       setAppliedCounts(prev => ({ ...prev, [id]: true }));
//     } catch (error) {
//       console.error("Error updating stock in Firestore:", error);
//     }
//   };

//   const totalStockCount = inventoryItems.reduce((sum, item) => {
//     if (appliedCounts[item.id]) {
//       return sum + calculateStock(item);
//     }
//     return sum;
//   }, 0);

//   if (loading) return <div className="p-4">Loading inventory data...</div>;

//   return (
//     <div className="flex-1 p-6 overflow-auto">
//       <h1 className="text-2xl font-bold mb-6">Inventory Management (Stock Count)</h1>

//       <div className="overflow-x-auto bg-white rounded-lg shadow">
//         <table className="min-w-full">
//           <thead className="bg-gray-200">
//             <tr>
//               <th className="p-3 text-left">Item Name</th>
//               <th className="p-3 text-left">Unit</th>
//               <th className="p-3 text-left">Box</th>
//               <th className="p-3 text-left">Inner</th>
//               <th className="p-3 text-left">Unit</th>
//               <th className="p-3 text-left">Apply</th>
//               <th className="p-3 text-left">Stock on Hand</th>
//             </tr>
//           </thead>
//           <tbody>
//             {inventoryItems.map(item => {
//               const stockCount = calculateStock(item);
//               const isApplied = appliedCounts[item.id];

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
//                       placeholder="0"
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
//                       placeholder="0"
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
//                       placeholder="0"
//                       min="0"
//                       disabled={isApplied}
//                     />
//                   </td>
//                   <td className="p-3">
//                     <button
//                       onClick={() => handleApplyChanges(item.id)}
//                       disabled={isApplied}
//                       className="p-2 bg-blue-500 text-white rounded"
//                     >
//                       Apply
//                     </button>
//                   </td>
//                   <td className="p-3">
//                     {isApplied ? stockCount.toLocaleString() : '-'}
//                   </td>
//                 </tr>
//               );
//             })}
//             {Object.values(appliedCounts).some(Boolean) && (
//               <tr className="bg-gray-100 font-semibold border-t">
//                 <td colSpan={6} className="p-3 text-right">Total Stock on Hand:</td>
//                 <td className="p-3">{totalStockCount.toLocaleString()}</td>
//               </tr>
//             )}
//           </tbody>
//         </table>
//       </div>
//     </div>
//   );
// };

// export default StockCount;

import React, { useState, useEffect } from 'react';
import { db } from '../firebase/config';
import { collection, getDocs, doc, setDoc } from 'firebase/firestore';

const StockCount = () => {
  const [inventoryItems, setInventoryItems] = useState([]);
  const [loading, setLoading] = useState(true);
  const [appliedCounts, setAppliedCounts] = useState({});
  const [selectedDate, setSelectedDate] = useState('');

  useEffect(() => {
    const fetchItemsData = async () => {
      try {
        const snapshot = await getDocs(collection(db, 'items'));
        const items = snapshot.docs.map(docSnap => {
          const data = docSnap.data();
          return {
            id: docSnap.id,
            itemName: data.itemName || 'Unknown Item',
            unit: data.unit || 'EA',
            boxes: 0,
            innerPacks: 0,
            units: 0,
            innerPerBox: data.innerPerBox || 1,
            unitsPerInner: data.unitsPerInner || 1,
            pricePerUnit: data.price || 0,
          };
        });
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

    const updatedItems = inventoryItems.map(item => {
      if (item.id === id) {
        const newValue = value === '' ? '' : Number(value);
        return { ...item, [field]: newValue };
      }
      return item;
    });

    setInventoryItems(updatedItems);
  };

  const handleApplyChanges = async (id) => {
    if (!selectedDate) {
      alert('Please select a date first!');
      return;
    }

    const item = inventoryItems.find(i => i.id === id);
    const stockCount = calculateStock(item);

    try {
      const inventoryRef = doc(db, 'inventory', id);

      // Set metadata in inventory document
      await setDoc(inventoryRef, {
        itemId: item.id,
        itemName: item.itemName,
        price: item.pricePerUnit,
        unit: item.unit
      }, { merge: true });

      // Set stock data in subcollection using selectedDate as ID
      const dataDocRef = doc(collection(inventoryRef, 'data'), selectedDate);
      await setDoc(dataDocRef, {
        boxes: item.boxes,
        innerPacks: item.innerPacks,
        units: item.units,
        innerPerBox: item.innerPerBox,
        unitsPerInner: item.unitsPerInner,
        stockOnHand: stockCount,
        date: selectedDate,
        timestamp: new Date().toISOString()
      }, { merge: true });

      setAppliedCounts(prev => ({ ...prev, [id]: true }));
    } catch (error) {
      console.error("Error saving inventory data:", error);
    }
  };

  if (loading) return <div className="p-4">Loading inventory data...</div>;

  return (
    <div className="flex-1 p-6 overflow-auto">
      <h1 className="text-2xl font-bold mb-6">Inventory Management (Stock Count)</h1>

      <div className="mb-4 flex items-center gap-4">
        <label className="font-semibold">Select Date:</label>
        <input
          type="date"
          value={selectedDate}
          onChange={(e) => setSelectedDate(e.target.value)}
          className="border rounded p-2"
        />
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
              <th className="p-3 text-left">Apply</th>
              <th className="p-3 text-left">Stock on Hand</th>
            </tr>
          </thead>
          <tbody>
            {inventoryItems.map(item => {
              const stockCount = calculateStock(item);
              const isApplied = appliedCounts[item.id];

              return (
                <tr key={item.id} className="border-t hover:bg-gray-50">
                  <td className="p-3">{item.itemName}</td>
                  <td className="p-3">{item.unit}</td>
                  <td className="p-3">
                    <input
                      type="number"
                      value={item.boxes}
                      onChange={(e) => handleInputChange(item.id, 'boxes', e.target.value)}
                      className="w-20 p-2 border rounded"
                      min="0"
                      disabled={isApplied}
                    />
                  </td>
                  <td className="p-3">
                    <input
                      type="number"
                      value={item.innerPacks}
                      onChange={(e) => handleInputChange(item.id, 'innerPacks', e.target.value)}
                      className="w-20 p-2 border rounded"
                      min="0"
                      disabled={isApplied}
                    />
                  </td>
                  <td className="p-3">
                    <input
                      type="number"
                      value={item.units}
                      onChange={(e) => handleInputChange(item.id, 'units', e.target.value)}
                      className="w-20 p-2 border rounded"
                      min="0"
                      disabled={isApplied}
                    />
                  </td>
                  <td className="p-3">
                    <button
                      onClick={() => handleApplyChanges(item.id)}
                      disabled={isApplied}
                      className="p-2 bg-blue-500 text-white rounded"
                    >
                      Apply
                    </button>
                  </td>
                  <td className="p-3">
                    {isApplied ? stockCount.toLocaleString() : '-'}
                  </td>
                </tr>
              );
            })}
          </tbody>
        </table>
      </div>
    </div>
  );
};

export default StockCount;
