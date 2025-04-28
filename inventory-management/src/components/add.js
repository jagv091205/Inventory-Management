const admin = require("firebase-admin");

// Initialize Firebase Admin
const serviceAccount = require("./bhookiecore-firebase-adminsdk-fbsvc-633a017700.json");
admin.initializeApp({
  credential: admin.credential.cert(serviceAccount)
});

const db = admin.firestore();

async function addDummyData() {
  const baseDate = "2025-04-24"; // Base date for timestamps

  // 10 Dummy inventory items
  const inventoryItems = [
    {
      itemId: "item01",
      itemName: "Chicken Fries",
      totalStockOnHand: 836,
      timestamp: `${baseDate}T19:53:01.457Z`,
      innerPerBox: 10,
      unitsPerInner: 5,
    },
    {
      itemId: "item02",
      itemName: "Veg Nuggets",
      totalStockOnHand: 420,
      timestamp: `${baseDate}T19:55:10.127Z`,
      innerPerBox: 12,
      unitsPerInner: 4,
    },
    {
      itemId: "item03",
      itemName: "Chicken Fillets",
      totalStockOnHand: 650,
      timestamp: `${baseDate}T19:57:22.300Z`,
      innerPerBox: 8,
      unitsPerInner: 6,
    },
    {
      itemId: "item04",
      itemName: "Fish Sticks",
      totalStockOnHand: 320,
      timestamp: `${baseDate}T19:59:45.100Z`,
      innerPerBox: 15,
      unitsPerInner: 5,
    },
    {
      itemId: "item05",
      itemName: "Vigen Fillet",
      totalStockOnHand: 750,
      timestamp: `${baseDate}T20:02:15.800Z`,
      innerPerBox: 10,
      unitsPerInner: 8,
    },
    {
      itemId: "item06",
      itemName: "Potato Wedges",
      totalStockOnHand: 580,
      timestamp: `${baseDate}T20:08:45.500Z`,
      innerPerBox: 9,
      unitsPerInner: 6,
    },
    {
      itemId: "item0",
      itemName: "Chicken Wings",
      totalStockOnHand: 430,
      timestamp: `${baseDate}T20:11:10.700Z`,
      innerPerBox: 11,
      unitsPerInner: 5,
    },
  ];

  // Add inventory data
  for (const item of inventoryItems) {
    await db.collection("inventory").doc(item.itemId).set(item);
    console.log(`✅ Added inventory: ${item.itemId} - ${item.itemName}`);
  }

  console.log("🔥 All dummy data added successfully!");
}

addDummyData().catch(console.error);