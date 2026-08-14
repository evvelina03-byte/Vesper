'use client';

import { useState } from 'react';
import { LineChart, Line, XAxis, YAxis, Tooltip, ResponsiveContainer, CartesianGrid, Legend } from 'recharts';

interface BacktestResult {
  ticker: string;
  strategy: string;
  metrics: {
    total_return: number;
    cagr: number;
    sharpe_ratio: number;
    sortino_ratio: number;
    max_drawdown: number;
    win_rate: number;
    total_trades: number;
  };
  buy_hold_return: number;
  chart: Array<{ date: string; strategy: number; buy_hold: number; position: number }>;
  initial_capital: number;
  final_value: number;
}

const STRATEGIES = [
  { value: 'buy_hold', label: 'Buy & Hold', desc: 'Hold the asset for the entire period' },
  { value: 'sma_crossover', label: 'SMA Crossover', desc: 'Buy when short MA crosses above long MA' },
  { value: 'rsi', label: 'RSI', desc: 'Buy oversold, sell overbought conditions' },
  { value: 'macd', label: 'MACD', desc: 'Buy when MACD crosses above signal line' },
  { value: 'momentum', label: 'Momentum', desc: 'Buy assets with positive 20-day momentum' },
];

const defaultForm = {
  ticker: 'AAPL',
  strategy: 'sma_crossover',
  start_date: '2021-01-01',
  end_date: '2024-01-01',
  initial_capital: '10000',
  short_window: '20',
  long_window: '50',
};

export default function Backtesting() {
  const [form, setForm] = useState(defaultForm);
  const [result, setResult] = useState<BacktestResult | null>(null);
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);

  const handleRun = async () => {
    setLoading(true);
    setError(null);
    try {
      const res = await fetch('http://127.0.0.1:8000/backtesting/run', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          ticker: form.ticker,
          strategy: form.strategy,
          start_date: form.start_date,
          end_date: form.end_date,
          initial_capital: parseFloat(form.initial_capital),
          short_window: parseInt(form.short_window),
          long_window: parseInt(form.long_window),
        }),
      });
      if (!res.ok) throw new Error('Backtest failed');
      const data = await res.json();
      if (data.error) throw new Error(data.error);
      setResult(data);
    } catch (e: any) {
      setError(e.message || 'Failed to run backtest');
    } finally {
      setLoading(false);
    }
  };

  const inputStyle = {
    width: '100%', padding: '8px 12px', borderRadius: '7px',
    border: '1px solid var(--border2)', background: 'var(--surface2)',
    color: 'var(--text)', fontSize: '13px', outline: 'none',
  };

  const labelStyle = {
    fontSize: '11px', color: 'var(--text3)', textTransform: 'uppercase' as const,
    letterSpacing: '0.6px', marginBottom: '6px', display: 'block',
  };

  const outperformed = result && result.metrics.total_return > result.buy_hold_return;

  return (
    <div style={{ padding: '24px 28px' }}>
      <div style={{ marginBottom: '24px' }}>
        <div style={{ fontSize: '18px', fontWeight: 600, letterSpacing: '-0.3px' }}>Strategy Backtesting</div>
        <div style={{ fontSize: '12px', color: 'var(--text3)', marginTop: '2px' }}>
          Test trading strategies on historical data · CAGR · Sharpe · Max Drawdown · Win Rate
        </div>
      </div>

      <div style={{ display: 'grid', gridTemplateColumns: '280px 1fr', gap: '16px' }}>
        {/* Form */}
        <div style={{ display: 'flex', flexDirection: 'column', gap: '12px' }}>
          <div style={{ background: 'var(--surface)', border: '1px solid var(--border)', borderRadius: '10px', padding: '18px' }}>
            <div style={{ fontSize: '13px', fontWeight: 500, marginBottom: '16px' }}>Parameters</div>

            <div style={{ display: 'flex', flexDirection: 'column', gap: '12px' }}>
              <div>
                <label style={labelStyle}>Ticker</label>
                <input type="text" value={form.ticker}
                  onChange={e => setForm({ ...form, ticker: e.target.value.toUpperCase() })}
                  style={inputStyle} />
              </div>
              <div>
                <label style={labelStyle}>Start Date</label>
                <input type="date" value={form.start_date}
                  onChange={e => setForm({ ...form, start_date: e.target.value })}
                  style={inputStyle} />
              </div>
              <div>
                <label style={labelStyle}>End Date</label>
                <input type="date" value={form.end_date}
                  onChange={e => setForm({ ...form, end_date: e.target.value })}
                  style={inputStyle} />
              </div>
              <div>
                <label style={labelStyle}>Initial Capital ($)</label>
                <input type="text" inputMode="decimal" value={form.initial_capital}
                  onChange={e => setForm({ ...form, initial_capital: e.target.value })}
                  style={inputStyle} />
              </div>
              {(form.strategy === 'sma_crossover') && (
                <>
                  <div>
                    <label style={labelStyle}>Short Window (days)</label>
                    <input type="text" value={form.short_window}
                      onChange={e => setForm({ ...form, short_window: e.target.value })}
                      style={inputStyle} />
                  </div>
                  <div>
                    <label style={labelStyle}>Long Window (days)</label>
                    <input type="text" value={form.long_window}
                      onChange={e => setForm({ ...form, long_window: e.target.value })}
                      style={inputStyle} />
                  </div>
                </>
              )}
            </div>

            <button onClick={handleRun} disabled={loading} style={{
              width: '100%', marginTop: '16px', padding: '10px', borderRadius: '7px',
              border: 'none', background: loading ? 'var(--border2)' : 'var(--blue)',
              color: '#fff', fontSize: '13px', fontWeight: 500,
              cursor: loading ? 'not-allowed' : 'pointer',
            }}>
              {loading ? 'Running...' : 'Run Backtest'}
            </button>

            {error && (
              <div style={{ marginTop: '10px', padding: '8px', borderRadius: '6px', background: 'rgba(220,38,38,0.1)', color: '#f87171', fontSize: '12px' }}>
                {error}
              </div>
            )}
          </div>

          {/* Strategy selector */}
          <div style={{ background: 'var(--surface)', border: '1px solid var(--border)', borderRadius: '10px', padding: '16px' }}>
            <div style={{ fontSize: '12px', fontWeight: 500, marginBottom: '10px' }}>Strategy</div>
            {STRATEGIES.map(s => (
              <div key={s.value} onClick={() => setForm({ ...form, strategy: s.value })}
                style={{
                  padding: '9px 10px', borderRadius: '7px', cursor: 'pointer', marginBottom: '4px',
                  background: form.strategy === s.value ? 'var(--blue-dim)' : 'transparent',
                  border: `1px solid ${form.strategy === s.value ? 'rgba(26,95,255,0.3)' : 'transparent'}`,
                }}>
                <div style={{ fontSize: '12px', fontWeight: 500, color: form.strategy === s.value ? 'var(--blue)' : 'var(--text2)' }}>
                  {s.label}
                </div>
                <div style={{ fontSize: '10px', color: 'var(--text3)', marginTop: '2px' }}>{s.desc}</div>
              </div>
            ))}
          </div>
        </div>

        {/* Results */}
        <div style={{ display: 'flex', flexDirection: 'column', gap: '14px' }}>
          {result ? (
            <>
              {/* Summary banner */}
              <div style={{
                background: outperformed ? 'rgba(74,222,128,0.08)' : 'rgba(248,113,113,0.08)',
                border: `1px solid ${outperformed ? 'rgba(74,222,128,0.3)' : 'rgba(248,113,113,0.3)'}`,
                borderRadius: '10px', padding: '16px 18px',
                display: 'flex', alignItems: 'center', justifyContent: 'space-between',
              }}>
                <div>
                  <div style={{ fontSize: '13px', fontWeight: 500, color: outperformed ? '#4ade80' : '#f87171' }}>
                    {outperformed ? '✓ Strategy outperformed Buy & Hold' : '✗ Strategy underperformed Buy & Hold'}
                  </div>
                  <div style={{ fontSize: '11px', color: 'var(--text3)', marginTop: '3px' }}>
                    {result.ticker} · {STRATEGIES.find(s => s.value === result.strategy)?.label} · ${result.initial_capital.toLocaleString()} → ${result.final_value.toLocaleString()}
                  </div>
                </div>
                <div style={{ textAlign: 'right' }}>
                  <div style={{ fontSize: '22px', fontWeight: 600, color: result.metrics.total_return >= 0 ? '#4ade80' : '#f87171' }}>
                    {result.metrics.total_return >= 0 ? '+' : ''}{result.metrics.total_return}%
                  </div>
                  <div style={{ fontSize: '11px', color: 'var(--text3)' }}>vs B&H: {result.buy_hold_return >= 0 ? '+' : ''}{result.buy_hold_return}%</div>
                </div>
              </div>

              {/* Metrics */}
              <div style={{ display: 'grid', gridTemplateColumns: 'repeat(6, 1fr)', gap: '10px' }}>
                {[
                  { label: 'CAGR', value: `${result.metrics.cagr}%`, color: result.metrics.cagr >= 0 ? '#4ade80' : '#f87171' },
                  { label: 'Sharpe', value: result.metrics.sharpe_ratio.toFixed(2), color: result.metrics.sharpe_ratio > 1 ? '#4ade80' : '#fbbf24' },
                  { label: 'Sortino', value: result.metrics.sortino_ratio.toFixed(2), color: result.metrics.sortino_ratio > 1 ? '#4ade80' : '#fbbf24' },
                  { label: 'Max Drawdown', value: `${result.metrics.max_drawdown}%`, color: '#f87171' },
                  { label: 'Win Rate', value: `${result.metrics.win_rate}%`, color: result.metrics.win_rate > 50 ? '#4ade80' : '#f87171' },
                  { label: 'Trades', value: String(result.metrics.total_trades), color: 'var(--text)' },
                ].map((m, i) => (
                  <div key={i} style={{ background: 'var(--surface)', border: '1px solid var(--border)', borderRadius: '10px', padding: '12px 14px' }}>
                    <div style={{ fontSize: '10px', color: 'var(--text3)', textTransform: 'uppercase', letterSpacing: '0.6px', marginBottom: '6px' }}>{m.label}</div>
                    <div style={{ fontSize: '16px', fontWeight: 600, color: m.color }}>{m.value}</div>
                  </div>
                ))}
              </div>

              {/* Equity curve */}
              <div style={{ background: 'var(--surface)', border: '1px solid var(--border)', borderRadius: '10px', padding: '18px' }}>
                <div style={{ fontSize: '13px', fontWeight: 500, marginBottom: '4px' }}>Equity Curve</div>
                <div style={{ fontSize: '11px', color: 'var(--text3)', marginBottom: '14px' }}>
                  Strategy vs Buy & Hold — starting from ${result.initial_capital.toLocaleString()}
                </div>
                <ResponsiveContainer width="100%" height={260}>
                  <LineChart data={result.chart} margin={{ top: 5, right: 10, bottom: 5, left: 20 }}>
                    <CartesianGrid strokeDasharray="3 3" stroke="var(--border)" />
                    <XAxis dataKey="date" tick={{ fontSize: 9, fill: 'var(--text3)' }} tickFormatter={v => v.slice(0, 7)} />
                    <YAxis tick={{ fontSize: 10, fill: 'var(--text3)' }} tickFormatter={v => `$${(v/1000).toFixed(0)}k`} />
                    <Tooltip
                      contentStyle={{ background: 'var(--surface2)', border: '1px solid var(--border)', borderRadius: '6px', fontSize: '11px' }}
                      formatter={(v: any, name: string) => [`$${parseFloat(v).toFixed(2)}`, name === 'strategy' ? 'Strategy' : 'Buy & Hold']}
                    />
                    <Legend wrapperStyle={{ fontSize: '11px', color: 'var(--text3)' }} />
                    <Line type="monotone" dataKey="strategy" stroke="#1a5fff" strokeWidth={2} dot={false} name="Strategy" />
                    <Line type="monotone" dataKey="buy_hold" stroke="#4ade80" strokeWidth={1.5} dot={false} strokeDasharray="5 5" name="Buy & Hold" />
                  </LineChart>
                </ResponsiveContainer>
              </div>
            </>
          ) : (
            <div style={{
              background: 'var(--surface)', border: '1px solid var(--border)',
              borderRadius: '10px', padding: '80px', textAlign: 'center',
              color: 'var(--text3)', fontSize: '13px',
            }}>
              Select a strategy and click <strong style={{ color: 'var(--text2)' }}>Run Backtest</strong> to test on historical data
            </div>
          )}
        </div>
      </div>
    </div>
  );
}
