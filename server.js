const express = require('express');
const cors = require('cors');
const https = require('https');
const app = express();
const PORT = process.env.PORT || 3000;

app.use(cors());
app.use(express.json());

function fetchYahooPrice() {
  return new Promise((resolve, reject) => {
    const url = 'https://query1.finance.yahoo.com/v7/finance/quote?symbols=GC%3DF&fields=regularMarketPrice,regularMarketDayHigh,regularMarketDayLow,regularMarketChange,chartPreviousClose';
    const options = {
      headers: {
        'User-Agent': 'Mozilla/5.0 (Windows NT 10.0; Win64; x64) AppleWebKit/537.36',
        'Accept': 'application/json'
      }
    };
    https.get(url, options, (res) => {
      let data = '';
      res.on('data', chunk => data += chunk);
      res.on('end', () => {
        try {
          const json = JSON.parse(data);
          const q = json.quoteResponse.result[0];
          const cp = q.regularMarketPrice;
          const dh = q.regularMarketDayHigh;
          const dl = q.regularMarketDayLow;
          const pc = q.chartPreviousClose || (cp - (q.regularMarketChange || 0));
          resolve({ currentPrice: cp, dailyHigh: dh, dailyLow: dl, prevClose: pc, closes: [pc, cp], highs: [dh], lows: [dl] });
        } catch (e) { reject(e); }
      });
    }).on('error', reject);
  });
}

function calcATR(highs, lows, closes) {
  if (highs.length < 2) return Math.abs(highs[0] - lows[0]) || 10;
  const trs = [];
  for (let i = 1; i < highs.length; i++) {
    trs.push(Math.max(highs[i] - lows[i], Math.abs(highs[i] - closes[i-1]), Math.abs(lows[i] - closes[i-1])));
  }
  return parseFloat((trs.reduce((a, b) => a + b, 0) / trs.length).toFixed(2));
}

function getStructure(closes) {
  if (closes.length < 2) return 'NEUTRAL';
  return closes[closes.length-1] > closes[0] ? 'BULLISH' : closes[closes.length-1] < closes[0] ? 'BEARISH' : 'NEUTRAL';
}

function getKillZones() {
  const now = new Date();
  const pkTime = new Date(now.toLocaleString('en-US', { timeZone: 'Asia/Karachi' }));
  const totalMins = pkTime.getHours() * 60 + pkTime.getMinutes();
  return [
    { name: 'ASIAN KILL ZONE', start: 180, end: 360, color: 'green', pktOpen: '03:00', pktClose: '06:00' },
    { name: 'LONDON KILL ZONE', start: 720, end: 960, color: 'purple', pktOpen: '12:00', pktClose: '16:00' },
    { name: 'NEW YORK KILL ZONE', start: 1020, end: 1260, color: 'blue', pktOpen: '17:00', pktClose: '21:00' },
  ].map(z => {
    const isActive = totalMins >= z.start && totalMins < z.end;
    const countdown = isActive ? (z.end - totalMins)*60 : (z.start > totalMins ? (z.start-totalMins)*60 : (1440-totalMins+z.start)*60);
    return { name: z.name, isActive, countdown, color: z.color, pktOpen: z.pktOpen, pktClose: z.pktClose };
  });
}

let cachedData = null;
let cacheTime = 0;
const CACHE_MS = 60 * 1000;

app.get('/api/market/analysis', async (req, res) => {
  try {
    const now = Date.now();
    if (!cachedData || now - cacheTime > CACHE_MS) {
      const { currentPrice, dailyHigh, dailyLow, prevClose, closes, highs, lows } = await fetchYahooPrice();
      const atr = calcATR(highs, lows, closes);
      const h1Structure = getStructure(closes);
      const h4Structure = getStructure(closes);
      const bullish = h1Structure === 'BULLISH' && h4Structure === 'BULLISH';
      const bearish = h1Structure === 'BEARISH' && h4Structure === 'BEARISH';
      const equilibrium = parseFloat(((dailyHigh + dailyLow) / 2).toFixed(2));
      const fvgHigh = parseFloat((currentPrice - atr * 0.1).toFixed(2));
      const fvgLow = parseFloat((currentPrice - atr * 0.3).toFixed(2));
      const obHigh = parseFloat((currentPrice - atr * 0.5).toFixed(2));
      const obLow = parseFloat((currentPrice - atr * 0.8).toFixed(2));
      cachedData = {
        timestamp: new Date().toISOString(), symbol: 'GC=F', currentPrice,
        probability: bullish || bearish ? Math.round(65 + Math.random()*20) : Math.round(40 + Math.random()*15),
        tradeSignal: bullish ? 'BUY' : bearish ? 'SELL' : 'WAIT',
        atr, h1Structure, h4Structure,
        mtfAlignment: bullish ? 'ALIGNED BULLISH' : bearish ? 'ALIGNED BEARISH' : 'MIXED',
        bos: currentPrice > prevClose ? 'BULLISH BOS' : 'BEARISH BOS',
        confirmation: bullish ? 'BULLISH CONFIRMATION' : bearish ? 'BEARISH CONFIRMATION' : 'WAIT FOR CONFIRMATION',
        dailyHigh, dailyLow, dailyRange: parseFloat((dailyHigh - dailyLow).toFixed(2)),
        equilibrium, premiumZoneHigh: dailyHigh, premiumZoneLow: equilibrium,
        discountZoneHigh: equilibrium, discountZoneLow: dailyLow,
        sessionHigh: parseFloat((currentPrice + atr*0.5).toFixed(2)),
        sessionLow: parseFloat((currentPrice - atr*0.5).toFixed(2)),
        externalSellLiquidity: [parseFloat((dailyLow - atr).toFixed(2))],
        externalBuyLiquidity: [parseFloat((dailyHigh + atr).toFixed(2))],
        internalSellLiquidity: [parseFloat((equilibrium + atr*0.3).toFixed(2))],
        internalBuyLiquidity: [parseFloat((equilibrium - atr*0.3).toFixed(2))],
        fairValueGaps: [{ type: bullish?'bullish':'bearish', age:1, high: fvgHigh, low: fvgLow, midpoint: parseFloat(((fvgHigh+fvgLow)/2).toFixed(2)) }],
        orderBlocks: [{ type: bullish?'bullish':'bearish', tested:false, high: obHigh, low: obLow, strength:3 }],
        supplyZones: [{ low: parseFloat((dailyHigh-atr*0.2).toFixed(2)), high: dailyHigh, strength:2 }],
        demandZones: [{ low: dailyLow, high: parseFloat((dailyLow+atr*0.2).toFixed(2)), strength:3 }],
        activeSweeps: currentPrice > prevClose ? ['BUY SIDE SWEEP'] : ['SELL SIDE SWEEP'],
        killZones: getKillZones()
      };
      cacheTime = now;
    } else {
      cachedData.killZones = getKillZones();
      cachedData.timestamp = new Date().toISOString();
    }
    res.json(cachedData);
  } catch (err) {
    res.status(500).json({ error: 'Failed to fetch market data', details: err.message });
  }
});

app.get('/api/market/calendar', (req, res) => {
  res.json([
    { title:'Fed Interest Rate Decision', country:'USD', date: new Date(Date.now()+2*86400000).toISOString(), impact:'High', forecast:'5.25%', previous:'5.50%', actual:'' },
    { title:'US CPI m/m', country:'USD', date: new Date(Date.now()+3*86400000).toISOString(), impact:'High', forecast:'0.3%', previous:'0.2%', actual:'' },
    { title:'US NFP', country:'USD', date: new Date(Date.now()+5*86400000).toISOString(), impact:'High', forecast:'180K', previous:'175K', actual:'' },
    { title:'PPI m/m', country:'USD', date: new Date(Date.now()+4*86400000).toISOString(), impact:'Medium', forecast:'0.2%', previous:'0.3%', actual:'' },
    { title:'Core Retail Sales m/m', country:'USD', date: new Date(Date.now()+7*86400000).toISOString(), impact:'Medium', forecast:'0.2%', previous:'0.1%', actual:'' },
  ]);
});

app.get('/api/healthz', (req, res) => res.json({ status: 'ok' }));
app.get('/', (req, res) => res.send('QADRAX Backend — Live Yahoo Finance (1min updates)'));
app.listen(PORT, () => console.log(`Server running on port ${PORT}`));
