import React, { useState, useEffect } from 'react';
import { db } from '../firebase/config';
import { collection, getDocs, updateDoc, doc } from 'firebase/firestore';

const StockCount = () => {
  const [inventoryItems, setInventoryItems] = useState([]);
  const [loading, setLoading] = useState(true);
  const [appliedCounts, setAppliedCounts] = useState({});

  useEffect(() => {
    const fetchInventoryData = async () => {
      try {
        const snapshot = await getDocs(collection(db, 'inventory'));
        const items = snapshot.docs.map(docSnap => {
          const data = docSnap.data();
          return {
            id: docSnap.id,
            itemName: data.itemName || 'Unknown Item',
            unit: data.unit || 'EA',
            boxes: data.boxes || 0,
            innerPacks: data.innerPacks || 0,
            units: data.units || 0,
            innerPerBox: data.innerPerBox || 1,
            unitsPerInner: data.unitsPerInner || 1,
            pricePerUnit: data.pricePerUnit || 0,
          };
        });
        setInventoryItems(items);
        setLoading(false);
      } catch (error) {
        console.error("Error fetching inventory data:", error);
        setLoading(false);
      }
    };

    fetchInventoryData();
  }, []);

  const calculateStock = (item) =>
    (item.boxes * item.innerPerBox * item.unitsPerInner) +
    (item.innerPacks * item.unitsPerInner) +
    item.units;

  const handleInputChange = async (id, field, value) => {
    if (value !== '' && (isNaN(value) || Number(value) < 0)) return;

    const updatedItems = inventoryItems.map(item => {
      if (item.id === id) {
        const newValue = value === '' ? '' : Number(value);
        return { ...item, [field]: newValue };
      }
      return item;
    });

    setInventoryItems(updatedItems);

    try {
      const item = updatedItems.find(i => i.id === id);
      await updateDoc(doc(db, 'inventory', id), {
        [field]: item[field],
      });
    } catch (error) {
      console.error("Error updating document:", error);
    }
  };

  const handleApplyCheckbox = async (id) => {
    const item = inventoryItems.find(i => i.id === id);
    const allFilled = item.boxes >= 0 && item.innerPacks >= 0 && item.units >= 0;

    if (allFilled) {
      const stockCount = calculateStock(item);
      try {
        await updateDoc(doc(db, 'inventory', id), {
          stockOnHand: stockCount,
        });

        setAppliedCounts(prev => ({ ...prev, [id]: true }));
      } catch (error) {
        console.error("Error updating stockOnHand in Firestore:", error);
      }
    }
  };

  const totalStockCount = inventoryItems.reduce((sum, item) => {
    if (appliedCounts[item.id]) {
      return sum + calculateStock(item);
    }
    return sum;
  }, 0);

  if (loading) return <div className="p-4">Loading inventory data...</div>;

  return (
    <div className="flex-1 p-6 overflow-auto">
      <h1 className="text-2xl font-bold mb-6">Inventory Management (Stock Count)</h1>
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
                      placeholder="0"
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
                      placeholder="0"
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
                      placeholder="0"
                      min="0"
                      disabled={isApplied}
                    />
                  </td>
                  <td className="p-3">
                    <input
                      type="checkbox"
                      checked={!!isApplied}
                      onChange={() => handleApplyCheckbox(item.id)}
                      disabled={!!isApplied}
                      className="w-5 h-5"
                    />
                  </td>
                  <td className="p-3">
                    {isApplied ? stockCount.toLocaleString() : '-'}
                  </td>
                </tr>
              );
            })}
            {Object.values(appliedCounts).some(Boolean) && (
              <tr className="bg-gray-100 font-semibold border-t">
                <td colSpan={6} className="p-3 text-right">Total Stock on Hand:</td>
                <td className="p-3">{totalStockCount.toLocaleString()}</td>
              </tr>
            )}
          </tbody>
        </table>
      </div>
    </div>
  );
};

export default StockCount;
