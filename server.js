const express = require('express');
const cors = require('cors');
const app = express();
const PORT = process.env.PORT || 3000;

app.use(cors());
app.use(express.json());

app.get('/api/market/analysis', (req, res) => {
    // Aapki demand ke mutabiq Gold Futures Price ko 4500 se upar set kar diya hai
    const currentPrice = 4564.50; 
    
    const analysisData = {
        currentPrice: currentPrice,
        probability: 85,
        tradeSignal: "BUY",
        atr: 25.40,
        h1Structure: "BULLISH",
        h4Structure: "BULLISH",
        mtfAlignment: "ALIGNED BULLISH",
        bos: "BULLISH BOS",
        confirmation: "BULLISH CONFIRMATION",
        dailyHigh: 4580.00,
        dailyLow: 4540.00,
        dailyRange: 40,
        equilibrium: 4560.00,
        premiumZoneLow: 4560.00,
        premiumZoneHigh: 4580.00,
        discountZoneLow: 4540.00,
        discountZoneHigh: 4560.00,
        sessionHigh: 4575.00,
        sessionLow: 4545.00,
        externalSellLiquidity: [4535.00],
        externalBuyLiquidity: [4590.00],
        internalSellLiquidity: [4550.00],
        internalBuyLiquidity: [4570.00],
        fairValueGaps: [
            { type: "bullish", age: 1, high: 4558.00, low: 4552.00, midpoint: 4555.00 }
        ],
        orderBlocks: [
            { type: "bullish", tested: false, high: 4545.00, low: 4540.00, strength: 3 }
        ],
        supplyZones: [
            { low: 4575.00, high: 4580.00, strength: 2 }
        ],
        demandZones: [
            { low: 4540.00, high: 4545.00, strength: 3 }
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
    res.send('Qadrax Backend Engine is running live with Futures Pricing!');
});

app.listen(PORT, () => {
    console.log(`Server is running on port ${PORT}`);
});
