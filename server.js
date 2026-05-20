const express = require('express');
const cors = require('cors');
const app = express();
app.use(cors());
app.use(express.json());

// 1. Dashboard, Zones, aur Liquidity ka endpoint
app.get('/api/market/analysis', (req, res) => {
  res.json({
    currentPrice: 2420.50,
    probability: 75,
    tradeSignal: "BUY",
    atr: 12.45,
    h1Structure: "BULLISH",
    h4Structure: "BULLISH",
    mtfAlignment: "ALIGNED BULLISH",
    bos: "BULLISH BOS",
    confirmation: "BULLISH CONFIRMATION",
    dailyHigh: 2435.00,
    dailyLow: 2410.00,
    dailyRange: 25.00,
    equilibrium: 2422.50,
    premiumZoneLow: 2425.00,
    premiumZoneHigh: 2435.00,
    discountZoneLow: 2410.00,
    discountZoneHigh: 2420.00,
    sessionHigh: 2430.00,
    sessionLow: 2415.00,
    externalSellLiquidity: [2440.00],
    externalBuyLiquidity: [2405.00],
    internalSellLiquidity: [2428.00],
    internalBuyLiquidity: [2418.00],
    fairValueGaps: [
      { type: "bullish", age: 3, high: 2416.00, low: 2412.00, midpoint: 2414.00 }
    ],
    orderBlocks: [
      { type: "bullish", tested: false, high: 2410.00, low: 2408.00, strength: 3 }
    ],
    supplyZones: [{ low: 2432.00, high: 2435.00, strength: 2 }],
    demandZones: [{ low: 2408.00, high: 2411.00, strength: 3 }],
    activeSweeps: ["BUY SIDE LATEST SWEEP"],
    killZones: [
      { name: "LONDON KILL ZONE", isActive: true, countdown: 3600, color: "purple", pktOpen: "12:00", pktClose: "16:00" },
      { name: "NEW YORK KILL ZONE", isActive: false, countdown: 18000, color: "blue", pktOpen: "17:00", pktClose: "21:00" }
    ]
  });
});

// 2. Economic Calendar ka endpoint
app.get('/api/market/calendar', (req, res) => {
  res.json([
    { title: "CPI m/m", date: new Date().toISOString(), impact: "High", forecast: "0.3%", previous: "0.2%", actual: "" },
    { title: "Core Retail Sales m/m", date: new Date().toISOString(), impact: "Medium", forecast: "0.2%", previous: "0.1%", actual: "" }
  ]);
});

const PORT = process.env.PORT || 3000;
app.listen(PORT, () => console.log(`Server running on port ${PORT}`));