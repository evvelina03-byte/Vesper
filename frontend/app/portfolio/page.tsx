'use client';

import { useState } from 'react';
import { LineChart, Line, XAxis, YAxis, Tooltip, ResponsiveContainer, ScatterChart, Scatter, CartesianGrid } from 'recharts';

interface PortfolioResult {
  tickers: string[];
  optimized_weights: Record<string, number>;
  equal_weights: Record<string, number>;
  metrics: {
    annual_return: number;
    annual_volatility: number;
    sharpe_ratio: number;
    var_95_daily: number;
    max_drawdown: number;
  };
  equal_weight_metrics: {
    annual_return: number;
    annual_volatility: number;
    sharpe_ratio: number;
  };
  frontier: Array<{ return: number; volatility: number; sharpe: number }>;
  history: Array<{ date: string; value: number }>;
}

const COLORS = ['#1a5fff', '#4ade80', '#f87171', '#fbbf24', '#a78bfa', '#34d399'];

export default function Portfolio() {
  const [tickers, setTickers] = useState('AAPL, MSFT, GOOGL, AMZN');
  const [result, setResult] = useState<PortfolioResult | null>(null);
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);

  const handleOptimize = async () => {
    setLoading(true);
    setError(null);
    try {
      const tickerList = tickers.split(',').map(t => t.trim()).filter(Boolean);
      const res = await fetch('http://127.0.0.1:8000/portfolio/optimize', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ tickers: tickerList }),
      });
      if (!res.ok) throw new Error('Optimization failed');
      const data = await res.json();
      setResult(data);
    } catch (e) {
      setError('Failed to optimize. Check tickers and try again.');
    } finally {
      setLoading(false);
    }
  };

  const inputStyle = {
    padding: '8px 12px', borderRadius: '7px',
    border: '1px solid var(--border2)', background: 'var(--surface2)',
    color: 'var(--text)', fontSize: '13px', outline: 'none',
  };

  const comparisonRows = result ? [
    { label: 'Return', opt: `${result.metrics.annual_return}%`, eq: `${result.equal_weight_metrics.annual_return}%`, better: result.metrics.annual_return > result.equal_weight_metrics.annual_return },
    { label: 'Volatility', opt: `${result.metrics.annual_volatility}%`, eq: `${result.equal_weight_metrics.annual_volatility}%`, better: result.metrics.annual_volatility < result.equal_weight_metrics.annual_volatility },
    { label: 'Sharpe', opt: result.metrics.sharpe_ratio.toFixed(2), eq: result.equal_weight_metrics.sharpe_ratio.toFixed(2), better: result.metrics.sharpe_ratio > result.equal_weight_metrics.sharpe_ratio },
  ] : [];

  return (
    <div style={{ padding: '24px 28px' }}>
      <div style={{ marginBottom: '24px' }}>
        <div style={{ fontSize: '18px', fontWeight: 600, letterSpacing: '-0.3px' }}>Portfolio Analytics</div>
        <div style={{ fontSize: '12px', color: 'var(--text3)', marginTop: '2px' }}>
          Mean-variance optimization · Efficient frontier · Real market data via Yahoo Finance
        </div>
      </div>

      <div style={{ background: 'var(--surface)', border: '1px solid var(--border)', borderRadius: '10px', padding: '18px', marginBottom: '16px' }}>
        <div style={{ display: 'flex', alignItems: 'center', gap: '12px' }}>
          <div style={{ flex: 1 }}>
            <label style={{ fontSize: '11px', color: 'var(--text3)', textTransform: 'uppercase', letterSpacing: '0.6px', marginBottom: '6px', display: 'block' }}>
              Tickers (comma separated)
            </label>
            <input
              type="text"
              value={tickers}
              onChange={e => setTickers(e.target.value)}
              placeholder="AAPL, MSFT, GOOGL, AMZN"
              style={{ ...inputStyle, width: '100%' }}
            />
          </div>
          <button
            onClick={handleOptimize}
            disabled={loading}
            style={{
              padding: '10px 20px', borderRadius: '7px', border: 'none',
              background: loading ? 'var(--border2)' : 'var(--blue)',
              color: '#fff', fontSize: '13px', fontWeight: 500,
              cursor: loading ? 'not-allowed' : 'pointer', marginTop: '20px',
              whiteSpace: 'nowrap',
            }}
          >
            {loading ? 'Optimizing...' : 'Optimize Portfolio'}
          </button>
        </div>
        {error && (
          <div style={{ marginTop: '10px', padding: '8px 12px', borderRadius: '6px', background: 'rgba(220,38,38,0.1)', color: '#f87171', fontSize: '12px' }}>
            {error}
          </div>
        )}
      </div>

      {result && (
        <>
          <div style={{ display: 'grid', gridTemplateColumns: 'repeat(5, 1fr)', gap: '12px', marginBottom: '16px' }}>
            {[
              { label: 'Annual Return', value: `${result.metrics.annual_return}%`, color: result.metrics.annual_return > 0 ? '#4ade80' : '#f87171' },
              { label: 'Volatility', value: `${result.metrics.annual_volatility}%`, color: '#fbbf24' },
              { label: 'Sharpe Ratio', value: result.metrics.sharpe_ratio.toFixed(2), color: result.metrics.sharpe_ratio > 1 ? '#4ade80' : '#fbbf24' },
              { label: 'VaR (95%, 1d)', value: `${result.metrics.var_95_daily}%`, color: '#f87171' },
              { label: 'Max Drawdown', value: `${result.metrics.max_drawdown}%`, color: '#f87171' },
            ].map((m, i) => (
              <div key={i} style={{ background: 'var(--surface)', border: '1px solid var(--border)', borderRadius: '10px', padding: '14px 16px' }}>
                <div style={{ fontSize: '10px', color: 'var(--text3)', textTransform: 'uppercase', letterSpacing: '0.6px', marginBottom: '8px' }}>{m.label}</div>
                <div style={{ fontSize: '20px', fontWeight: 600, color: m.color }}>{m.value}</div>
              </div>
            ))}
          </div>

          <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: '16px', marginBottom: '16px' }}>
            <div style={{ background: 'var(--surface)', border: '1px solid var(--border)', borderRadius: '10px', padding: '18px' }}>
              <div style={{ fontSize: '13px', fontWeight: 500, marginBottom: '16px' }}>Optimized Allocation</div>
              {result.tickers.map((ticker, i) => {
                const weight = result.optimized_weights[ticker] || 0;
                const eqWeight = result.equal_weights[ticker] || 0;
                return (
                  <div key={ticker} style={{ marginBottom: '14px' }}>
                    <div style={{ display: 'flex', justifyContent: 'space-between', marginBottom: '5px' }}>
                      <span style={{ fontSize: '13px', fontWeight: 500, color: COLORS[i % COLORS.length] }}>{ticker}</span>
                      <span style={{ fontSize: '12px', color: 'var(--text2)' }}>
                        {(weight * 100).toFixed(1)}% <span style={{ color: 'var(--text3)' }}>(eq: {(eqWeight * 100).toFixed(1)}%)</span>
                      </span>
                    </div>
                    <div style={{ height: '6px', background: 'var(--surface2)', borderRadius: '3px', overflow: 'hidden' }}>
                      <div style={{ height: '100%', width: `${weight * 100}%`, background: COLORS[i % COLORS.length], borderRadius: '3px', transition: 'width 0.5s ease' }} />
                    </div>
                  </div>
                );
              })}

              <div style={{ marginTop: '16px', padding: '12px', borderRadius: '8px', background: 'var(--surface2)' }}>
                <div style={{ fontSize: '11px', color: 'var(--text3)', marginBottom: '8px' }}>Optimized vs Equal Weight</div>
                <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr 1fr', gap: '8px', fontSize: '11px' }}>
                  <div style={{ color: 'var(--text3)' }}>Metric</div>
                  <div style={{ color: 'var(--text3)' }}>Optimized</div>
                  <div style={{ color: 'var(--text3)' }}>Equal</div>
                  {comparisonRows.map(row => (
                    <>
                      <div key={`label-${row.label}`} style={{ color: 'var(--text2)' }}>{row.label}</div>
                      <div key={`opt-${row.label}`} style={{ color: row.better ? '#4ade80' : '#f87171', fontWeight: 500 }}>{row.opt}</div>
                      <div key={`eq-${row.label}`} style={{ color: 'var(--text3)' }}>{row.eq}</div>
                    </>
                  ))}
                </div>
              </div>
            </div>

            <div style={{ background: 'var(--surface)', border: '1px solid var(--border)', borderRadius: '10px', padding: '18px' }}>
              <div style={{ fontSize: '13px', fontWeight: 500, marginBottom: '4px' }}>Efficient Frontier</div>
              <div style={{ fontSize: '11px', color: 'var(--text3)', marginBottom: '14px' }}>Risk vs Return tradeoff</div>
              <ResponsiveContainer width="100%" height={220}>
                <ScatterChart margin={{ top: 5, right: 10, bottom: 20, left: 10 }}>
                  <CartesianGrid strokeDasharray="3 3" stroke="var(--border)" />
                  <XAxis dataKey="volatility" name="Volatility %" tick={{ fontSize: 10, fill: 'var(--text3)' }} label={{ value: 'Volatility %', position: 'bottom', offset: 0, fontSize: 10, fill: 'var(--text3)' }} />
                  <YAxis dataKey="return" name="Return %" tick={{ fontSize: 10, fill: 'var(--text3)' }} />
                  <Tooltip
                    cursor={{ strokeDasharray: '3 3' }}
                    contentStyle={{ background: 'var(--surface2)', border: '1px solid var(--border)', borderRadius: '6px', fontSize: '11px' }}
                    formatter={(value: any, name: string) => [`${value}%`, name]}
                  />
                  <Scatter data={result.frontier} fill="#1a5fff" opacity={0.8} />
                </ScatterChart>
              </ResponsiveContainer>
            </div>
          </div>

          <div style={{ background: 'var(--surface)', border: '1px solid var(--border)', borderRadius: '10px', padding: '18px' }}>
            <div style={{ fontSize: '13px', fontWeight: 500, marginBottom: '4px' }}>Portfolio Performance (60 days)</div>
            <div style={{ fontSize: '11px', color: 'var(--text3)', marginBottom: '14px' }}>Cumulative return of optimized portfolio</div>
            <ResponsiveContainer width="100%" height={200}>
              <LineChart data={result.history} margin={{ top: 5, right: 10, bottom: 5, left: 10 }}>
                <CartesianGrid strokeDasharray="3 3" stroke="var(--border)" />
                <XAxis dataKey="date" tick={{ fontSize: 9, fill: 'var(--text3)' }} tickFormatter={v => v.slice(5)} />
                <YAxis tick={{ fontSize: 10, fill: 'var(--text3)' }} tickFormatter={v => `${((v - 1) * 100).toFixed(0)}%`} />
                <Tooltip
                  contentStyle={{ background: 'var(--surface2)', border: '1px solid var(--border)', borderRadius: '6px', fontSize: '11px' }}
                  formatter={(v: any) => [`${((v - 1) * 100).toFixed(2)}%`, 'Return']}
                />
                <Line type="monotone" dataKey="value" stroke="#1a5fff" strokeWidth={2} dot={false} />
              </LineChart>
            </ResponsiveContainer>
          </div>
        </>
      )}

      {!result && !loading && (
        <div style={{
          background: 'var(--surface)', border: '1px solid var(--border)',
          borderRadius: '10px', padding: '60px', textAlign: 'center',
          color: 'var(--text3)', fontSize: '13px',
        }}>
          Enter tickers above and click <strong style={{ color: 'var(--text2)' }}>Optimize Portfolio</strong> to run mean-variance optimization with real market data
        </div>
      )}
    </div>
  );
}
