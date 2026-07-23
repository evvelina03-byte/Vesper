'use client';

import { useState, useEffect } from 'react';
import { LineChart, Line, XAxis, YAxis, Tooltip, ResponsiveContainer, CartesianGrid } from 'recharts';

interface Quote {
  price: number;
  change: number;
  change_pct: number;
  up: boolean;
}

interface Mover {
  ticker: string;
  price: number;
  change: number;
  change_pct: number;
  up: boolean;
}

export default function Market() {
  const [overview, setOverview] = useState<Record<string, Quote>>({});
  const [sectors, setSectors] = useState<Record<string, Quote>>({});
  const [movers, setMovers] = useState<{ gainers: Mover[]; losers: Mover[] }>({ gainers: [], losers: [] });
  const [chart, setChart] = useState<any[]>([]);
  const [selectedTicker, setSelectedTicker] = useState('SPY');
  const [chartPeriod, setChartPeriod] = useState('1mo');
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    fetchAll();
  }, []);

  useEffect(() => {
    fetchChart();
  }, [selectedTicker, chartPeriod]);

  const fetchAll = async () => {
    setLoading(true);
    try {
      const [ovRes, secRes, movRes] = await Promise.all([
        fetch('http://127.0.0.1:8000/market/overview'),
        fetch('http://127.0.0.1:8000/market/sectors'),
        fetch('http://127.0.0.1:8000/market/movers'),
      ]);
      setOverview(await ovRes.json());
      setSectors(await secRes.json());
      setMovers(await movRes.json());
    } catch (e) {
      console.error('Failed to fetch market data');
    } finally {
      setLoading(false);
    }
  };

  const fetchChart = async () => {
    try {
      const res = await fetch(`http://127.0.0.1:8000/market/chart/${selectedTicker}?period=${chartPeriod}`);
      const data = await res.json();
      setChart(data.data || []);
    } catch (e) {
      console.error('Failed to fetch chart');
    }
  };

  const QuoteCard = ({ name, quote }: { name: string; quote: Quote }) => (
    <div style={{
      background: 'var(--surface)', border: '1px solid var(--border)',
      borderRadius: '10px', padding: '14px 16px',
    }}>
      <div style={{ fontSize: '10px', color: 'var(--text3)', textTransform: 'uppercase', letterSpacing: '0.6px', marginBottom: '8px' }}>{name}</div>
      <div style={{ fontSize: '18px', fontWeight: 600, letterSpacing: '-0.5px' }}>
        {quote.price.toLocaleString()}
      </div>
      <div style={{ fontSize: '11px', marginTop: '4px', color: quote.up ? '#4ade80' : '#f87171' }}>
        {quote.up ? '↑' : '↓'} {Math.abs(quote.change).toFixed(2)} ({Math.abs(quote.change_pct).toFixed(2)}%)
      </div>
    </div>
  );

  const indices = ['S&P 500', 'NASDAQ', 'Dow Jones', 'VIX', 'Russell 2000'];
  const commodities = ['Gold', 'Oil (WTI)', 'Bitcoin', 'Silver'];
  const forex = ['EUR/USD', 'USD/JPY', 'GBP/USD'];
  const treasury = ['2Y Yield', '10Y Yield', '30Y Yield'];

  return (
    <div style={{ padding: '24px 28px' }}>
      <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between', marginBottom: '22px' }}>
        <div>
          <div style={{ fontSize: '18px', fontWeight: 600, letterSpacing: '-0.3px' }}>Market Intelligence</div>
          <div style={{ fontSize: '12px', color: 'var(--text3)', marginTop: '2px' }}>
            Live market data via Yahoo Finance · Auto-refresh
          </div>
        </div>
        <button onClick={fetchAll} style={{
          padding: '6px 14px', borderRadius: '6px', border: '1px solid var(--border2)',
          background: 'var(--surface)', color: 'var(--text2)', fontSize: '12px', cursor: 'pointer',
        }}>↻ Refresh</button>
      </div>

      {loading ? (
        <div style={{ color: 'var(--text3)', fontSize: '13px' }}>Loading market data...</div>
      ) : (
        <>
          {/* Indices */}
          <div style={{ fontSize: '11px', color: 'var(--text3)', textTransform: 'uppercase', letterSpacing: '0.7px', marginBottom: '10px' }}>Major Indices</div>
          <div style={{ display: 'grid', gridTemplateColumns: 'repeat(5, 1fr)', gap: '10px', marginBottom: '16px' }}>
            {indices.map(name => overview[name] && <QuoteCard key={name} name={name} quote={overview[name]} />)}
          </div>

          {/* Chart */}
          <div style={{ background: 'var(--surface)', border: '1px solid var(--border)', borderRadius: '10px', padding: '18px', marginBottom: '16px' }}>
            <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between', marginBottom: '14px' }}>
              <div style={{ display: 'flex', alignItems: 'center', gap: '10px' }}>
                <div style={{ fontSize: '13px', fontWeight: 500 }}>Price Chart</div>
                <input
                  type="text"
                  value={selectedTicker}
                  onChange={e => setSelectedTicker(e.target.value.toUpperCase())}
                  style={{
                    padding: '4px 10px', borderRadius: '6px', border: '1px solid var(--border2)',
                    background: 'var(--surface2)', color: 'var(--text)', fontSize: '12px',
                    outline: 'none', width: '80px', textTransform: 'uppercase',
                  }}
                />
              </div>
              <div style={{ display: 'flex', gap: '4px' }}>
                {['1wk', '1mo', '3mo', '6mo', '1y'].map(p => (
                  <button key={p} onClick={() => setChartPeriod(p)} style={{
                    padding: '3px 9px', borderRadius: '5px', border: 'none', cursor: 'pointer',
                    background: chartPeriod === p ? 'var(--blue-dim)' : 'transparent',
                    color: chartPeriod === p ? 'var(--blue)' : 'var(--text3)', fontSize: '11px',
                  }}>{p}</button>
                ))}
              </div>
            </div>
            <ResponsiveContainer width="100%" height={200}>
              <LineChart data={chart} margin={{ top: 5, right: 10, bottom: 5, left: 10 }}>
                <CartesianGrid strokeDasharray="3 3" stroke="var(--border)" />
                <XAxis dataKey="date" tick={{ fontSize: 9, fill: 'var(--text3)' }} tickFormatter={v => v.slice(5)} />
                <YAxis tick={{ fontSize: 10, fill: 'var(--text3)' }} domain={['auto', 'auto']} />
                <Tooltip
                  contentStyle={{ background: 'var(--surface2)', border: '1px solid var(--border)', borderRadius: '6px', fontSize: '11px' }}
                  formatter={(v: any) => [`$${v.toFixed(2)}`, 'Price']}
                />
                <Line type="monotone" dataKey="close" stroke="#1a5fff" strokeWidth={2} dot={false} />
              </LineChart>
            </ResponsiveContainer>
          </div>

          <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr 1fr', gap: '16px', marginBottom: '16px' }}>
            {/* Commodities & Forex */}
            <div style={{ display: 'flex', flexDirection: 'column', gap: '10px' }}>
              <div style={{ fontSize: '11px', color: 'var(--text3)', textTransform: 'uppercase', letterSpacing: '0.7px' }}>Commodities</div>
              {commodities.map(name => overview[name] && <QuoteCard key={name} name={name} quote={overview[name]} />)}
            </div>

            <div style={{ display: 'flex', flexDirection: 'column', gap: '10px' }}>
              <div style={{ fontSize: '11px', color: 'var(--text3)', textTransform: 'uppercase', letterSpacing: '0.7px' }}>Forex & Rates</div>
              {[...forex, ...treasury].map(name => overview[name] && <QuoteCard key={name} name={name} quote={overview[name]} />)}
            </div>

            {/* Sectors */}
            <div style={{ background: 'var(--surface)', border: '1px solid var(--border)', borderRadius: '10px', padding: '16px' }}>
              <div style={{ fontSize: '13px', fontWeight: 500, marginBottom: '14px' }}>Sector Performance</div>
              {Object.entries(sectors).map(([name, quote]) => (
                <div key={name} style={{ marginBottom: '10px' }}>
                  <div style={{ display: 'flex', justifyContent: 'space-between', marginBottom: '4px' }}>
                    <span style={{ fontSize: '11px', color: 'var(--text2)' }}>{name}</span>
                    <span style={{ fontSize: '11px', color: quote.up ? '#4ade80' : '#f87171', fontWeight: 500 }}>
                      {quote.up ? '+' : ''}{quote.change_pct.toFixed(2)}%
                    </span>
                  </div>
                  <div style={{ height: '4px', background: 'var(--surface2)', borderRadius: '2px', overflow: 'hidden' }}>
                    <div style={{
                      height: '100%',
                      width: `${Math.min(Math.abs(quote.change_pct) * 20, 100)}%`,
                      background: quote.up ? '#4ade80' : '#f87171',
                      borderRadius: '2px',
                    }} />
                  </div>
                </div>
              ))}
            </div>
          </div>

          {/* Movers */}
          <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: '16px' }}>
            {[
              { title: 'Top Gainers', data: movers.gainers, color: '#4ade80' },
              { title: 'Top Losers', data: movers.losers, color: '#f87171' },
            ].map(({ title, data, color }) => (
              <div key={title} style={{ background: 'var(--surface)', border: '1px solid var(--border)', borderRadius: '10px', padding: '16px' }}>
                <div style={{ fontSize: '13px', fontWeight: 500, marginBottom: '14px' }}>{title}</div>
                {data.map(mover => (
                  <div key={mover.ticker} style={{
                    display: 'flex', alignItems: 'center', justifyContent: 'space-between',
                    padding: '8px 0', borderBottom: '1px solid var(--border)',
                  }}>
                    <div>
                      <div style={{ fontSize: '13px', fontWeight: 500, color }}>{mover.ticker}</div>
                      <div style={{ fontSize: '11px', color: 'var(--text3)' }}>${mover.price.toFixed(2)}</div>
                    </div>
                    <div style={{ fontSize: '13px', fontWeight: 600, color }}>
                      {mover.up ? '+' : ''}{mover.change_pct.toFixed(2)}%
                    </div>
                  </div>
                ))}
              </div>
            ))}
          </div>
        </>
      )}
    </div>
  );
}
