import React, { useState, useEffect } from 'react';
import { db } from '../firebase/config';
import { collection, getDocs, updateDoc, doc } from 'firebase/firestore';

const InventoryManagement = () => {
  const [inventoryItems, setInventoryItems] = useState([]);
  const [loading, setLoading] = useState(true);

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
            boxes: 0,
            innerPacks: 0,
            units: 0,
            innerPerBox: data.innerPerBox || 1,
            unitsPerInner: data.unitsPerInner || 1,
            totalUnit: data.totalUnit || 0,
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
        const updatedItem = { ...item, [field]: newValue };
        const stockOnHand = calculateStock(updatedItem);
        const varianceUnits = stockOnHand - updatedItem.totalUnit;
        const varianceValue = varianceUnits * updatedItem.pricePerUnit;

        return { ...updatedItem, stockOnHand, varianceUnits, varianceValue };
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

  const getVarianceColor = value => {
    const abs = Math.abs(value);
    return abs <= 10 ? 'text-green-600' : 'text-red-600';
  };

  if (loading) return <div className="p-4">Loading inventory data...</div>;

  return (
    <div className="flex-1 p-6 overflow-auto">
      <h1 className="text-2xl font-bold mb-6">Inventory Management</h1>
      <div className="overflow-x-auto bg-white rounded-lg shadow">
        <table className="min-w-full">
          <thead className="bg-gray-200">
            <tr>
              <th className="p-3 text-left">Item Name</th>
              <th className="p-3 text-left">Unit</th>
              <th className="p-3 text-left">Box</th>
              <th className="p-3 text-left">Inner</th>
              <th className="p-3 text-left">Unit</th>
              <th className="p-3 text-left">Stock On Hand</th>
              <th className="p-3 text-left">Total Unit</th>
              <th className="p-3 text-left">Variance Units</th>
              <th className="p-3 text-left">Variance Value</th>
            </tr>
          </thead>
          <tbody>
            {inventoryItems.map(item => {
              const stockOnHand = calculateStock(item);
              const varianceUnits = stockOnHand - item.totalUnit;
              const varianceValue = varianceUnits * item.pricePerUnit;

              return (
                <tr key={item.id} className="border-t hover:bg-gray-50">
                  <td className="p-3">{item.itemName}</td>
                  <td className="p-3">{item.unit}</td>
                  <td className="p-3">
                    <input
                      type="number"
                      value={item.boxes}
                      onChange={(e) => handleInputChange(item.id, 'boxes', e.target.value)}
                      className="w-20 p-2 border rounded focus:ring-2 focus:ring-blue-500"
                      placeholder="0"
                      min="0"
                    />
                  </td>
                  <td className="p-3">
                    <input
                      type="number"
                      value={item.innerPacks}
                      onChange={(e) => handleInputChange(item.id, 'innerPacks', e.target.value)}
                      className="w-20 p-2 border rounded focus:ring-2 focus:ring-blue-500"
                      placeholder="0"
                      min="0"
                    />
                  </td>
                  <td className="p-3">
                    <input
                      type="number"
                      value={item.units}
                      onChange={(e) => handleInputChange(item.id, 'units', e.target.value)}
                      className="w-20 p-2 border rounded focus:ring-2 focus:ring-blue-500"
                      placeholder="0"
                      min="0"
                    />
                  </td>
                  <td className="p-3">{stockOnHand.toLocaleString()}</td>
                  <td className="p-3">{item.totalUnit.toLocaleString()}</td>
                  <td className={`p-3 font-medium ${getVarianceColor(varianceUnits)}`}>
                    {varianceUnits}
                  </td>
                  <td className={`p-3 font-medium ${getVarianceColor(varianceValue)}`}>
                    £{varianceValue.toFixed(2)}
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

export default InventoryManagement;
