import React, { useState, useEffect } from 'react';
import { db } from '../firebase/config';
import { collection, getDocs, setDoc, doc } from 'firebase/firestore';

const StockCount = () => {
  const [inventoryItems, setInventoryItems] = useState([]);
  const [loading, setLoading] = useState(true);
  const [appliedCounts, setAppliedCounts] = useState({});
  const [searchQuery, setSearchQuery] = useState('');
  const [masterCheck, setMasterCheck] = useState(false);

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

  const handleTickChange = (id) => {
    setAppliedCounts(prev => ({
      ...prev,
      [id]: !prev[id]
    }));
  };

  const handleMasterCheck = () => {
    const newState = !masterCheck;
    setMasterCheck(newState);
    const updated = {};
    filteredItems.forEach(item => {
      updated[item.id] = newState;
    });
    setAppliedCounts(updated);
  };

  const handleApplyChanges = async (id) => {
    const currentDate = new Date();
    const formattedDate = `${currentDate.getFullYear()}-${(currentDate.getMonth() + 1).toString().padStart(2, '0')}-${currentDate.getDate().toString().padStart(2, '0')}`;

    const item = inventoryItems.find(i => i.id === id);
    const totalUnits = calculateStock(item);

    try {
      const dateDocRef = doc(db, 'stockCounts', formattedDate);
      const itemRef = doc(dateDocRef, 'items', id);

      await setDoc(itemRef, {
        date: formattedDate,
        timestamp: currentDate.toISOString(),
        itemId: id,
        itemName: item.itemName,
        boxes: item.boxes,
        inners: item.innerPacks,
        units: item.units,
        totalUnits,
        manager: "Adam Cole", // Replace with dynamic user data
        managerId: "USER456",
        status: "recorded"
      });

      setAppliedCounts(prev => ({ ...prev, [id]: true }));
    } catch (error) {
      console.error("Error adding stock count:", error);
    }
  };

  const handleSaveAllApplied = async () => {
    const currentDate = new Date();
    const formattedDate = `${currentDate.getFullYear()}-${(currentDate.getMonth() + 1).toString().padStart(2, '0')}-${currentDate.getDate().toString().padStart(2, '0')}`;
    const dateDocRef = doc(db, 'stockCounts', formattedDate);

    const promises = inventoryItems
      .filter(item => appliedCounts[item.id])
      .map(item => {
        const totalUnits = calculateStock(item);
        const itemRef = doc(dateDocRef, 'items', item.id);
        return setDoc(itemRef, {
          date: formattedDate,
          timestamp: currentDate.toISOString(),
          itemId: item.id,
          itemName: item.itemName,
          boxes: item.boxes,
          inners: item.innerPacks,
          units: item.units,
          totalUnits,
          manager: "Adam Cole",
          managerId: "USER456",
          status: "recorded"
        });
      });

    try {
      await Promise.all(promises);
      alert("All selected stock counts saved.");
    } catch (error) {
      console.error("Error saving all applied stock counts:", error);
    }
  };

  const handleSearch = (e) => {
    setSearchQuery(e.target.value.toLowerCase());
  };

  const filteredItems = inventoryItems.filter(item =>
    item.itemName.toLowerCase().includes(searchQuery)
  );

  if (loading) return <div className="p-4">Loading inventory data...</div>;

  return (
    <div className="flex-1 p-6 overflow-auto">
      <h1 className="text-2xl font-bold mb-6">Inventory Management (Stock Count)</h1>

      {/* Controls */}
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

      {/* Table */}
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
              <th className="p-3 text-left">Stock on Hand</th>
            </tr>
          </thead>
          <tbody>
            {filteredItems.map(item => {
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
                    <input
                      type="checkbox"
                      checked={isApplied}
                      onChange={() => handleTickChange(item.id)}
                      className="p-2"
                    />
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
