import React, { useState, useEffect } from 'react';
import { db } from '../firebase/config';
import { collection, getDocs, doc, getDoc } from 'firebase/firestore';

const StockCountLog = () => {
  const [logs, setLogs] = useState([]);
  const [expandedLogId, setExpandedLogId] = useState(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState(null);
  const [selectedDate, setSelectedDate] = useState('');

  useEffect(() => {
    const fetchLogs = async () => {
      try {
        const logsSnapshot = await getDocs(collection(db, 'inventoryLog'));
        const logsData = await Promise.all(
          logsSnapshot.docs.map(async (doc) => {
            const data = doc.data();
            return {
              id: doc.id,
              date: doc.id,
              timestamp: data.timestamp,
              totalVariance: data.totalVariance || 0,
              status: data.status || 'pending',
              countType: data.countType || 'initial'
            };
          })
        );
        
        const sortedLogs = logsData.sort((a, b) => b.date.localeCompare(a.date));
        setLogs(sortedLogs);
        setLoading(false);
      } catch (error) {
        console.error("Error fetching inventory logs:", error);
        setError('Failed to load inventory logs');
        setLoading(false);
      }
    };

    fetchLogs();
  }, []);

  const handleDateFilter = (date) => {
    setSelectedDate(date);
    setExpandedLogId(null);
  };

  const filteredLogs = selectedDate
    ? logs.filter(log => log.date === selectedDate)
    : logs;

  const handleLogExpand = async (logId) => {
    if (expandedLogId === logId) {
      setExpandedLogId(null);
      return;
    }

    try {
      setExpandedLogId(logId);
      
      // Fetch items from the 'items' subcollection
      const itemsRef = collection(db, `inventoryLog/${logId}/items`);
      const itemsSnapshot = await getDocs(itemsRef);
      
      const itemsData = await Promise.all(
        itemsSnapshot.docs.map(async (itemDoc) => {
          const itemData = itemDoc.data();
          
          // Fetch item details from inventory
          const inventoryRef = doc(db, 'inventory', itemData.itemId);
          const inventorySnap = await getDoc(inventoryRef);
          
          return {
            id: itemDoc.id,
            itemId: itemData.itemId,
            itemName: inventorySnap.exists() 
              ? inventorySnap.data().itemName 
              : 'Deleted Item',
            boxes: itemData.boxesCount || 0,
            inners: itemData.innerCount || 0,
            units: itemData.unitsCount || 0,
            totalCounted: itemData.totalCounted || 0,
            variance: itemData.variance || 0,
            previousStock: itemData.previousStock || 0,
            newStock: itemData.newStock || 0,
            status: itemData.status || 'recorded'
          };
        })
      );

      setLogs(prevLogs => prevLogs.map(log => 
        log.id === logId ? { ...log, items: itemsData } : log
      ));
    } catch (error) {
      console.error("Error fetching log items:", error);
      setError('Failed to load log details');
    }
  };

  const formatDate = (dateString) => {
    const options = { 
      year: 'numeric', 
      month: 'long', 
      day: 'numeric',
      hour: '2-digit',
      minute: '2-digit'
    };
    return new Date(dateString).toLocaleDateString(undefined, options);
  };

  if (loading) return <div className="p-6 text-gray-600">Loading inventory logs...</div>;
  if (error) return <div className="p-6 text-red-600">{error}</div>;

  return (
    <div className="p-6">
      <div className="flex justify-between items-center mb-6">
        <h1 className="text-2xl font-bold text-gray-800">Inventory Count History</h1>
        <div className="flex gap-4 items-center">
          <input
            type="date"
            value={selectedDate}
            onChange={(e) => handleDateFilter(e.target.value)}
            className="border rounded p-2"
            max={new Date().toISOString().split('T')[0]}
          />
          <button
            onClick={() => handleDateFilter('')}
            className="bg-gray-200 px-4 py-2 rounded hover:bg-gray-300"
            disabled={!selectedDate}
          >
            Clear Filter
          </button>
        </div>
      </div>

      <div className="space-y-4">
        {filteredLogs.length === 0 ? (
          <div className="text-gray-500 p-4 text-center">
            No logs found{selectedDate && ` for ${selectedDate}`}
          </div>
        ) : (
          filteredLogs.map(log => (
            <div key={log.id} className="bg-white rounded-lg shadow">
              <div 
                className="p-4 flex justify-between items-center cursor-pointer hover:bg-gray-50"
                onClick={() => handleLogExpand(log.id)}
              >
                <div>
                  <h3 className="font-semibold">
                    {log.date} • {formatDate(log.timestamp)}
                  </h3>
                  <div className="flex gap-4 mt-1 text-sm text-gray-600">
                    <span>Type: {log.countType}</span>
                    <span>Status: {log.status}</span>
                    <span className={`font-medium ${
                      log.totalVariance !== 0 ? 'text-red-600' : 'text-green-600'
                    }`}>
                      Total Variance: {log.totalVariance}
                    </span>
                  </div>
                </div>
                <span className="text-xl">
                  {expandedLogId === log.id ? '▼' : '▶'}
                </span>
              </div>

            {expandedLogId === log.id && (
              <div className="border-t p-4 bg-gray-50">
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
                              <div className="text-sm text-gray-600">ID: {item.itemId}</div>
                            </td>
                            <td className="p-3">{item.boxes}</td>
                            <td className="p-3">{item.inners}</td>
                            <td className="p-3">{item.units}</td>
                            <td className="p-3">{item.totalCounted}</td>
                            <td className={`p-3 font-medium ${
                              item.variance !== 0 ? 'text-red-600' : 'text-green-600'
                            }`}>
                              {item.variance > 0 && '+'}{item.variance}
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
                  <div className="text-gray-500 p-4 text-center">
                    No count items found for this log
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

export default StockCountLog;

// import React, { useState, useEffect } from 'react';
// import { db } from '../firebase/config';
// import { collection, getDocs, doc, getDoc } from 'firebase/firestore';
// import jsPDF from 'jspdf';
// import 'jspdf-autotable';

// const StockCountLog = () => {
//   const [logs, setLogs] = useState([]);
//   const [expandedLogId, setExpandedLogId] = useState(null);
//   const [loading, setLoading] = useState(true);
//   const [error, setError] = useState(null);
//   const [selectedDate, setSelectedDate] = useState('');
//   const [expandedLoadingId, setExpandedLoadingId] = useState(null);
//   const [reportType, setReportType] = useState('daily');
//   const [reportDate, setReportDate] = useState('');

//   useEffect(() => {
//     const fetchLogs = async () => {
//       setLoading(true);
//       try {
//         const logsSnapshot = await getDocs(collection(db, 'inventoryLog'));
//         const logsData = await Promise.all(
//           logsSnapshot.docs.map(async (doc) => {
//             const data = doc.data();
//             return {
//               id: doc.id,
//               date: doc.id,
//               timestamp: data.timestamp?.toDate() || new Date(),
//               totalVariance: data.totalVariance || 0,
//               status: data.status || 'pending',
//               countType: data.countType || 'initial',
//             };
//           })
//         );
//         setLogs(logsData.sort((a, b) => b.date.localeCompare(a.date)));
//         setLoading(false);
//       } catch (error) {
//         console.error("Error fetching inventory logs:", error);
//         setError('Failed to load inventory logs');
//         setLoading(false);
//       }
//     };

//     fetchLogs();
//   }, []);

//   const handleDateFilter = (date) => {
//     setSelectedDate(date);
//     setExpandedLogId(null);
//   };

//   const filteredLogs = selectedDate
//     ? logs.filter(log => log.date === selectedDate)
//     : logs;

//   const handleLogExpand = async (logId) => {
//     if (expandedLogId === logId) {
//       setExpandedLogId(null);
//       return;
//     }

//     try {
//       setExpandedLogId(logId);
//       setExpandedLoadingId(logId);

//       const itemsRef = collection(db, `inventoryLog/${logId}/items`);
//       const itemsSnapshot = await getDocs(itemsRef);

//       const itemsData = await Promise.all(
//         itemsSnapshot.docs.map(async (itemDoc) => {
//           const itemData = itemDoc.data();
//           const inventoryRef = doc(db, 'inventory', itemData.itemId);
//           const inventorySnap = await getDoc(inventoryRef);

//           return {
//             id: itemDoc.id,
//             itemId: itemData.itemId,
//             itemName: inventorySnap.exists()
//               ? inventorySnap.data().itemName
//               : 'Deleted Item',
//             boxes: itemData.boxesCount || 0,
//             inners: itemData.innerCount || 0,
//             units: itemData.unitsCount || 0,
//             totalCounted: itemData.totalCounted || 0,
//             variance: itemData.variance || 0,
//             previousStock: itemData.previousStock || 0,
//             newStock: itemData.newStock || 0,
//             status: itemData.status || 'recorded',
//           };
//         })
//       );

//       setLogs(prevLogs => prevLogs.map(log =>
//         log.id === logId ? { ...log, items: itemsData } : log
//       ));
//       setExpandedLoadingId(null);
//     } catch (error) {
//       console.error("Error fetching log items:", error);
//       setError('Failed to load log details');
//       setExpandedLoadingId(null);
//     }
//   };

//   const formatDate = (date) => {
//     const options = { 
//       year: 'numeric', 
//       month: 'long', 
//       day: 'numeric',
//       hour: '2-digit',
//       minute: '2-digit'
//     };
//     return date.toLocaleDateString(undefined, options);
//   };

//   const formatTime = (date) => {
//     return date.toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' });
//   };

//   const getWeekRange = (dateString) => {
//     const date = new Date(dateString);
//     const day = date.getDay();
//     const diff = date.getDate() - day + (day === 0 ? -6 : 1);
//     const start = new Date(date.setDate(diff));
//     const end = new Date(start);
//     end.setDate(start.getDate() + 6);
    
//     return {
//       start: start.toISOString().split('T')[0],
//       end: end.toISOString().split('T')[0]
//     };
//   };

//   const handleDownloadPDF = async () => {
//     if ((reportType === 'daily' || reportType === 'weekly') && !reportDate) {
//       alert('Please select a date for the report.');
//       return;
//     }

//     let logsToExport = [];
//     if (reportType === 'daily') {
//       logsToExport = logs.filter(log => log.date === reportDate);
//     } else if (reportType === 'weekly') {
//       const { start, end } = getWeekRange(reportDate);
//       logsToExport = logs.filter(log => log.date >= start && log.date <= end);
//     } else {
//       logsToExport = [...logs];
//     }

//     if (logsToExport.length === 0) {
//       alert('No logs found for the selected report criteria.');
//       return;
//     }

//     // Fetch items for logs that don't have them loaded
//     const logsNeedingItems = logsToExport.filter(log => !log.items);
//     if (logsNeedingItems.length > 0) {
//       try {
//         const updatedLogs = await Promise.all(
//           logsNeedingItems.map(async log => {
//             const itemsRef = collection(db, `inventoryLog/${log.id}/items`);
//             const itemsSnapshot = await getDocs(itemsRef);
            
//             const itemsData = await Promise.all(
//               itemsSnapshot.docs.map(async (itemDoc) => {
//                 const itemData = itemDoc.data();
//                 const inventoryRef = doc(db, 'inventory', itemData.itemId);
//                 const inventorySnap = await getDoc(inventoryRef);

//                 return {
//                   id: itemDoc.id,
//                   itemId: itemData.itemId,
//                   itemName: inventorySnap.exists()
//                     ? inventorySnap.data().itemName
//                     : 'Deleted Item',
//                   boxes: itemData.boxesCount || 0,
//                   inners: itemData.innerCount || 0,
//                   units: itemData.unitsCount || 0,
//                   totalCounted: itemData.totalCounted || 0,
//                   variance: itemData.variance || 0,
//                   status: itemData.status || 'recorded',
//                 };
//               })
//             );
            
//             return { ...log, items: itemsData };
//           })
//         );
        
//         logsToExport = logsToExport.map(log => 
//           updatedLogs.find(updated => updated.id === log.id) || log
//         );
//       } catch (error) {
//         console.error("Error fetching items for PDF:", error);
//         alert('Failed to fetch log details for PDF generation.');
//         return;
//       }
//     }

//     // Generate PDF
//     const doc = new jsPDF();
//     let title = 'Inventory Count Report';
    
//     if (reportType === 'daily') {
//       title = `Daily Report - ${reportDate}`;
//     } else if (reportType === 'weekly') {
//       const { start, end } = getWeekRange(reportDate);
//       title = `Weekly Report (${start} to ${end})`;
//     }
    
//     doc.setFontSize(18);
//     doc.text(title, 14, 22);
    
//     logsToExport.forEach((log, index) => {
//       if (index > 0) doc.addPage();
      
//       // Log header
//       doc.setFontSize(12);
//       doc.setFont('helvetica', 'bold');
//       doc.text(`Date: ${log.date}`, 14, 35);
//       doc.text(`Time: ${formatTime(log.timestamp)}`, 14, 42);
//       doc.text(`Type: ${log.countType}`, 14, 49);
//       doc.text(`Status: ${log.status}`, 14, 56);
//       doc.text(`Total Variance: ${log.totalVariance}`, 14, 63);
      
//       // Items table
//       if (log.items?.length > 0) {
//         doc.autoTable({
//           startY: 70,
//           head: [['Item', 'Boxes', 'Inners', 'Units', 'Total', 'Variance', 'Status']],
//           body: log.items.map(item => [
//             item.itemName,
//             item.boxes,
//             item.inners,
//             item.units,
//             item.totalCounted,
//             item.variance,
//             item.status,
//           ]),
//           theme: 'grid',
//           styles: { fontSize: 10 },
//           headStyles: { fillColor: [41, 128, 185], textColor: 255 },
//           columnStyles: {
//             0: { cellWidth: 40 },
//             4: { cellWidth: 20 },
//             5: { cellWidth: 25 },
//             6: { cellWidth: 25 }
//           }
//         });
//       }
//     });

//     doc.save(`inventory_report_${new Date().toISOString().split('T')[0]}.pdf`);
//   };

//   if (loading) return <div className="p-6 text-gray-600">Loading inventory logs...</div>;
//   if (error) return <div className="p-6 text-red-600">{error}</div>;

//   return (
//     <div className="p-6">
//       <div className="flex justify-between items-center mb-6">
//         <h1 className="text-2xl font-bold text-gray-800">Inventory Count History</h1>
//         <div className="flex gap-4 items-center">
//           <input
//             type="date"
//             value={selectedDate}
//             onChange={(e) => handleDateFilter(e.target.value)}
//             className="border rounded p-2"
//             max={new Date().toISOString().split('T')[0]}
//           />
//           <button
//             onClick={() => handleDateFilter('')}
//             className="bg-gray-200 px-4 py-2 rounded hover:bg-gray-300"
//             disabled={!selectedDate}
//           >
//             Clear Filter
//           </button>
//           <select 
//             value={reportType}
//             onChange={(e) => setReportType(e.target.value)}
//             className="border rounded p-2"
//           >
//             <option value="daily">Daily</option>
//             <option value="weekly">Weekly</option>
//             <option value="all">All</option>
//           </select>
          
//           {reportType !== 'all' && (
//             <input
//               type="date"
//               value={reportDate}
//               onChange={(e) => setReportDate(e.target.value)}
//               className="border rounded p-2"
//               max={new Date().toISOString().split('T')[0]}
//             />
//           )}
          
//           <button
//             onClick={handleDownloadPDF}
//             className="bg-blue-500 text-white px-4 py-2 rounded hover:bg-blue-600"
//           >
//             Download PDF
//           </button>
//         </div>
//       </div>

//       <div className="space-y-4">
//         {filteredLogs.length === 0 ? (
//           <div className="text-gray-500 p-4 text-center">
//             No logs found{selectedDate && ` for ${selectedDate}`}
//           </div>
//         ) : (
//           filteredLogs.map(log => (
//             <div key={log.id} className="bg-white rounded-lg shadow">
//               <div 
//                 className="p-4 flex justify-between items-center cursor-pointer hover:bg-gray-50"
//                 onClick={() => handleLogExpand(log.id)}
//               >
//                 <div>
//                   <h3 className="font-semibold">
//                     {log.date} • {formatDate(log.timestamp)}
//                   </h3>
//                   <div className="flex gap-4 mt-1 text-sm text-gray-600">
//                     <span>Type: {log.countType}</span>
//                     <span>Status: {log.status}</span>
//                     <span className={`font-medium ${
//                       log.totalVariance !== 0 ? 'text-red-600' : 'text-green-600'
//                     }`}>
//                       Total Variance: {log.totalVariance}
//                     </span>
//                   </div>
//                 </div>
//                 <span className="text-xl">
//                   {expandedLogId === log.id ? '▼' : '▶'}
//                 </span>
//               </div>

//               {expandedLogId === log.id && (
//                 <div className="border-t p-4 bg-gray-50">
//                   {expandedLoadingId === log.id ? (
//                     <div className="text-center text-gray-500 py-4">
//                       Loading details...
//                     </div>
//                   ) : (
//                     <>
//                       <h4 className="font-medium mb-4">Count Details:</h4>
//                       {log.items?.length > 0 ? (
//                         <div className="overflow-x-auto">
//                           <table className="min-w-full bg-white rounded shadow">
//                             <thead className="bg-gray-100">
//                               <tr>
//                                 <th className="p-3 text-left">Item</th>
//                                 <th className="p-3 text-left">Boxes</th>
//                                 <th className="p-3 text-left">Inners</th>
//                                 <th className="p-3 text-left">Units</th>
//                                 <th className="p-3 text-left">Counted</th>
//                                 <th className="p-3 text-left">Variance</th>
//                                 <th className="p-3 text-left">Status</th>
//                               </tr>
//                             </thead>
//                             <tbody>
//                               {log.items.map(item => (
//                                 <tr key={item.id} className="border-t">
//                                   <td className="p-3">
//                                     <div className="font-medium">{item.itemName}</div>
//                                     <div className="text-sm text-gray-600">ID: {item.itemId}</div>
//                                   </td>
//                                   <td className="p-3">{item.boxes}</td>
//                                   <td className="p-3">{item.inners}</td>
//                                   <td className="p-3">{item.units}</td>
//                                   <td className="p-3">{item.totalCounted}</td>
//                                   <td className={`p-3 font-medium ${
//                                     item.variance !== 0 ? 'text-red-600' : 'text-green-600'
//                                   }`}>
//                                     {item.variance > 0 && '+'}{item.variance}
//                                   </td>
//                                   <td className="p-3">
//                                     <span className={`px-2 py-1 rounded text-sm ${
//                                       item.status === 'completed'
//                                         ? 'bg-green-100 text-green-800'
//                                         : 'bg-yellow-100 text-yellow-800'
//                                     }`}>
//                                       {item.status}
//                                     </span>
//                                   </td>
//                                 </tr>
//                               ))}
//                             </tbody>
//                           </table>
//                         </div>
//                       ) : (
//                         <div className="text-gray-500 p-4 text-center">
//                           No count items found for this log
//                         </div>
//                       )}
//                     </>
//                   )}
//                 </div>
//               )}
//             </div>
//           ))
//         )}
//       </div>
//     </div>
//   );
// };

// export default StockCountLog;