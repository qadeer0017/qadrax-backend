const express = require('express');
const cors = require('cors');
const app = express();
const PORT = process.env.PORT || 3000;

app.use(cors());
app.use(express.json());

// Live market data simulate/fetch karne ke liye route
app.get('/api/market/analysis', (req, res) => {
    // Note: Asli live price ke liye aap baad mein yahan TradingView API ya Exness pricing ka fetch code laga sakte hain.
    // Abhi ke liye hum yahan live range daal rahe hain jo real-time update ho sake
    const currentPrice = 2428.50; 
    
    const analysisData = {
        currentPrice: currentPrice,
        probability: 85,
        tradeSignal: "BUY",
        atr: 14.20,
        h1Structure: "BULLISH",
        h4Structure: "BULLISH",
        mtfAlignment: "ALIGNED BULLISH",
        bos: "BULLISH BOS",
        confirmation: "BULLISH CONFIRMATION",
        dailyHigh: 2435.00,
        dailyLow: 2412.00,
        dailyRange: 23,
        equilibrium: 2423.50,
        premiumZoneLow: 2423.50,
        premiumZoneHigh: 2435.00,
        discountZoneLow: 2412.00,
        discountZoneHigh: 2423.50,
        sessionHigh: 2432.00,
        sessionLow: 2415.00,
        externalSellLiquidity: [2410.00],
        externalBuyLiquidity: [2438.00],
        internalSellLiquidity: [2418.00],
        internalBuyLiquidity: [2429.00],
        fairValueGaps: [
            { type: "bullish", age: 1, high: 2422.00, low: 2419.00, midpoint: 2420.50 }
        ],
        orderBlocks: [
            { type: "bullish", tested: false, high: 2415.00, low: 2411.00, strength: 3 }
        ],
        supplyZones: [
            { low: 2432.00, high: 2435.00, strength: 2 }
        ],
        demandZones: [
            { low: 2412.00, high: 2415.00, strength: 3 }
        ],
        activeSweeps: ["BUY SIDE LATEST SWEEP"],
        killZones: [
            { name: "LONDON KILL ZONE", isActive: true, countdown: 3600, color: "purple", pktOpen: "12:00", pktClose: "16:00" },
            { name: "NEW YORK KILL ZONE", isActive: false, countdown: 18000, color: "blue", pktOpen: "17:00", pktClose: "21:00" }
        ]
    };
    res.json(analysisData);
});

app.get('/api/market/calendar', (req, res) => {
    const calendarData = [
        { title: "CPI m/m", date: new Date().toISOString(), impact: "High", forecast: "0.3%", previous: "0.2%", actual: "" },
        { title: "Core Retail Sales m/m", date: new Date().toISOString(), impact: "Medium", forecast: "0.2%", previous: "0.1%", actual: "" }
    ];
    res.json(calendarData);
});

app.get('/', (req, res) => {
    res.send('Qadrax Backend Engine is running live!');
});

app.listen(PORT, () => {
    console.log(`Server is running on port ${PORT}`);
});
