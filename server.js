const express = require('express');
const cors = require('cors');
const app = express();
const PORT = process.env.PORT || 3000;

app.use(cors());
app.use(express.json());

// Global variable taake pichli price yaad rahe aur jump na lagay
let currentSmoothPrice = 4560.50;

app.get('/api/market/analysis', (req, res) => {
    // 0.10 se 0.50 cents (pips) ka smooth badlao (sirf thoda sa upar ya neeche)
    const change = (Math.random() * 0.40) - 0.20; 
    
    // Nayi price purani price ke upar hi calculate hogi
    currentSmoothPrice = parseFloat((currentSmoothPrice + change).toFixed(2));
    
    // Agar price bohot door nikal jaye to use wapis range mein lane ke liye
    if (currentSmoothPrice < 4545.00 || currentSmoothPrice > 4580.00) {
        currentSmoothPrice = 4560.50;
    }

    const analysisData = {
        currentPrice: currentSmoothPrice,
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
    res.send('Qadrax Backend Engine is running with live smooth tick fluctuations!');
});

app.listen(PORT, () => {
    console.log(`Server is running on port ${PORT}`);
});
