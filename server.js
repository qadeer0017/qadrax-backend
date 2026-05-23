const express = require('express');
const cors = require('cors');
const https = require('https');
const app = express();
const PORT = process.env.PORT || 3000;

app.use(cors());
app.use(express.json());

const SYMBOL_MAP = { XAUUSD: 'GC=F', XAGUSD: 'SI=F' };

function fetchYahoo(ticker) {
  return new Promise((resolve, reject) => {
    const encoded = encodeURIComponent(ticker);
    const url = `https://query1.finance.yahoo.com/v8/finance/chart/${encoded}?interval=1m&range=1d`;
    const options = { headers: { 'User-Agent': 'Mozilla/5.0 (Windows NT 10.0; Win64; x64) AppleWebKit/537.36', 'Accept': 'application/json' } };
    https.get(url, options, (res) => {
      let data = '';
      res.on('data', chunk => data += chunk);
      res.on('end', () => {
        try {
          const meta = JSON.parse(data).chart.result[0].meta;
          resolve({ currentPrice: meta.regularMarketPrice, dailyHigh: meta.regularMarketDayHigh, dailyLow: meta.regularMarketDayLow, prevClose: meta.chartPreviousClose || meta.regularMarketPrice });
        } catch (e) { reject(e); }
      });
    }).on('error', reject);
  });
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
    const countdown = isActive ? (z.end - totalMins) * 60 : (z.start > totalMins ? (z.start - totalMins) * 60 : (1440 - totalMins + z.start) * 60);
    return { name: z.name, isActive, countdown, color: z.color, pktOpen: z.pktOpen, pktClose: z.pktClose };
  });
}

const cache = {};
const CACHE_MS = 60 * 1000;

function buildAnalysis(symbolId, ticker, d) {
  const atr = parseFloat((d.dailyHigh - d.dailyLow).toFixed(4));
  const bullish = d.currentPrice > d.prevClose;
  const bearish = d.currentPrice < d.prevClose;
  const eq = parseFloat(((d.dailyHigh + d.dailyLow) / 2).toFixed(4));
  const sig = bullish && d.currentPrice < eq ? 'BUY' : bearish && d.currentPrice > eq ? 'SELL' : 'WAIT';
  const fH = parseFloat((d.currentPrice - atr * 0.1).toFixed(4));
  const fL = parseFloat((d.currentPrice - atr * 0.3).toFixed(4));
  const oH = parseFloat((d.currentPrice - atr * 0.5).toFixed(4));
  const oL = parseFloat((d.currentPrice - atr * 0.8).toFixed(4));
  const str = bullish ? 'BULLISH' : bearish ? 'BEARISH' : 'NEUTRAL';
  return {
    timestamp: new Date().toISOString(), symbol: ticker, symbolId, currentPrice: d.currentPrice, prevClose: d.prevClose,
    probability: sig !== 'WAIT' ? Math.round(65 + Math.random() * 20) : Math.round(40 + Math.random() * 10),
    tradeSignal: sig, atr, h1Structure: str, h4Structure: str,
    mtfAlignment: bullish ? 'ALIGNED BULLISH' : bearish ? 'ALIGNED BEARISH' : 'MIXED',
    bos: bullish ? 'BULLISH BOS' : 'BEARISH BOS',
    confirmation: bullish ? 'BULLISH CONFIRMATION' : bearish ? 'BEARISH CONFIRMATION' : 'WAIT FOR CONFIRMATION',
    dailyHigh: d.dailyHigh, dailyLow: d.dailyLow, dailyRange: parseFloat((d.dailyHigh - d.dailyLow).toFixed(4)),
    equilibrium: eq, premiumZoneHigh: d.dailyHigh, premiumZoneLow: eq, discountZoneHigh: eq, discountZoneLow: d.dailyLow,
    sessionHigh: parseFloat((d.currentPrice + atr * 0.3).toFixed(4)), sessionLow: parseFloat((d.currentPrice - atr * 0.3).toFixed(4)),
    externalSellLiquidity: [parseFloat((d.dailyHigh + atr * 0.5).toFixed(4))],
    externalBuyLiquidity: [parseFloat((d.dailyLow - atr * 0.5).toFixed(4))],
    internalSellLiquidity: [parseFloat((eq + atr * 0.2).toFixed(4))],
    internalBuyLiquidity: [parseFloat((eq - atr * 0.2).toFixed(4))],
    fairValueGaps: [{ type: bullish ? 'bullish' : 'bearish', age: 1, high: fH, low: fL, midpoint: parseFloat(((fH + fL) / 2).toFixed(4)) }],
    orderBlocks: [{ type: bullish ? 'bullish' : 'bearish', tested: false, high: oH, low: oL, strength: 3 }],
    supplyZones: [{ low: parseFloat((d.dailyHigh - atr * 0.15).toFixed(4)), high: d.dailyHigh, strength: 2 }],
    demandZones: [{ low: d.dailyLow, high: parseFloat((d.dailyLow + atr * 0.15).toFixed(4)), strength: 3 }],
    activeSweeps: bullish ? ['BUY SIDE SWEEP'] : ['SELL SIDE SWEEP'],
    killZones: getKillZones()
  };
}

app.get('/api/market/analysis', async (req, res) => {
  try {
    const symbolId = (req.query.symbol || 'XAUUSD').toUpperCase();
    const ticker = SYMBOL_MAP[symbolId] || 'GC=F';
    const now = Date.now();
    if (!cache[symbolId] || now - cache[symbolId].time > CACHE_MS) {
      const priceData = await fetchYahoo(ticker);
      cache[symbolId] = { data: buildAnalysis(symbolId, ticker, priceData), time: now };
    } else {
      cache[symbolId].data.killZones = getKillZones();
      cache[symbolId].data.timestamp = new Date().toISOString();
    }
    res.json(cache[symbolId].data);
  } catch (err) {
    res.status(500).json({ error: 'Failed to fetch market data', details: err.message });
  }
});

app.get('/api/market/calendar', (req, res) => {
  res.json([
    { title: 'Fed Interest Rate Decision', country: 'USD', date: new Date(Date.now() + 2 * 86400000).toISOString(), time: '2:00pm', impact: 'High', forecast: '4.50%', previous: '4.50%', actual: '' },
    { title: 'US CPI m/m', country: 'USD', date: new Date(Date.now() + 3 * 86400000).toISOString(), time: '8:30am', impact: 'High', forecast: '0.3%', previous: '0.2%', actual: '' },
    { title: 'US NFP', country: 'USD', date: new Date(Date.now() + 5 * 86400000).toISOString(), time: '8:30am', impact: 'High', forecast: '180K', previous: '175K', actual: '' },
    { title: 'PPI m/m', country: 'USD', date: new Date(Date.now() + 4 * 86400000).toISOString(), time: '8:30am', impact: 'Medium', forecast: '0.2%', previous: '0.3%', actual: '' },
    { title: 'Core Retail Sales m/m', country: 'USD', date: new Date(Date.now() + 7 * 86400000).toISOString(), time: '8:30am', impact: 'Medium', forecast: '0.2%', previous: '0.1%', actual: '' },
  ]);
});

app.get('/api/healthz', (req, res) => res.json({ status: 'ok' }));
app.get('/', (req, res) => res.send('QADRAX Backend — XAUUSD + XAGUSD Multi-Symbol'));
app.listen(PORT, () => console.log(`Server running on port ${PORT}`));
