'use client';

import { useState } from 'react';
import { BarChart, Bar, XAxis, YAxis, Tooltip, ResponsiveContainer, CartesianGrid } from 'recharts';

interface Financials {
  company_name: string;
  sector: string;
  industry: string;
  current_price: number;
  market_cap: number;
  enterprise_value: number;
  financials: {
    revenue: number;
    ebitda: number;
    net_income: number;
    free_cashflow: number;
    total_debt: number;
    cash: number;
    ebitda_margin: number;
    gross_margin: number;
    revenue_growth: number;
    roe: number;
    roic: number;
  };
  multiples: {
    pe_ratio: number;
    ev_ebitda: number;
    pb_ratio: number;
    ps_ratio: number;
  };
}

interface DCFResult {
  intrinsic_value: number;
  current_price: number;
  upside_downside: number;
  recommendation: string;
  recommendation_color: string;
  terminal_value_pct: number;
  pv_fcfs: number;
  pv_terminal: number;
  projections: Array<{ year: number; revenue: number; fcf: number; pv_fcf: number }>;
  assumptions: { revenue_growth: number; terminal_growth: number; wacc: number; projection_years: number };
}

const defaultAssumptions = {
  revenue_growth_rate: '8.0',
  terminal_growth_rate: '2.5',
  wacc: '10.0',
  ebitda_margin_improvement: '0.5',
  projection_years: '5',
};

const formatB = (n: number) => {
  if (Math.abs(n) >= 1e9) return `$${(n / 1e9).toFixed(2)}B`;
  if (Math.abs(n) >= 1e6) return `$${(n / 1e6).toFixed(1)}M`;
  return `$${n.toFixed(0)}`;
};

export default function Valuation() {
  const [ticker, setTicker] = useState('AAPL');
  const [financials, setFinancials] = useState<Financials | null>(null);
  const [dcf, setDcf] = useState<DCFResult | null>(null);
  const [assumptions, setAssumptions] = useState(defaultAssumptions);
  const [loading, setLoading] = useState(false);
  const [dcfLoading, setDcfLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);

  const fetchFinancials = async () => {
    setLoading(true);
    setError(null);
    setDcf(null);
    try {
      const res = await fetch(`http://127.0.0.1:8000/valuation/financials/${ticker.toUpperCase()}`);
      if (!res.ok) throw new Error('Failed to fetch');
      setFinancials(await res.json());
    } catch (e) {
      setError(`Could not fetch data for ${ticker}. Try a valid US ticker.`);
    } finally {
      setLoading(false);
    }
  };

  const runDCF = async () => {
    setDcfLoading(true);
    try {
      const res = await fetch('http://127.0.0.1:8000/valuation/dcf', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          ticker: ticker.toUpperCase(),
          revenue_growth_rate: parseFloat(assumptions.revenue_growth_rate),
          terminal_growth_rate: parseFloat(assumptions.terminal_growth_rate),
          wacc: parseFloat(assumptions.wacc),
          ebitda_margin_improvement: parseFloat(assumptions.ebitda_margin_improvement),
          projection_years: parseInt(assumptions.projection_years),
        }),
      });
      if (!res.ok) throw new Error('DCF failed');
      setDcf(await res.json());
    } catch (e) {
      setError('DCF calculation failed.');
    } finally {
      setDcfLoading(false);
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

  return (
    <div style={{ padding: '24px 28px' }}>
      <div style={{ marginBottom: '24px' }}>
        <div style={{ fontSize: '18px', fontWeight: 600, letterSpacing: '-0.3px' }}>Company Valuation</div>
        <div style={{ fontSize: '12px', color: 'var(--text3)', marginTop: '2px' }}>
          DCF model · Comparable multiples · Real financial data via Yahoo Finance
        </div>
      </div>

      {/* Search */}
      <div style={{ background: 'var(--surface)', border: '1px solid var(--border)', borderRadius: '10px', padding: '18px', marginBottom: '16px' }}>
        <div style={{ display: 'flex', gap: '12px', alignItems: 'flex-end' }}>
          <div style={{ flex: 1 }}>
            <label style={labelStyle}>Company Ticker</label>
            <input
              type="text"
              value={ticker}
              onChange={e => setTicker(e.target.value.toUpperCase())}
              onKeyDown={e => e.key === 'Enter' && fetchFinancials()}
              placeholder="AAPL, MSFT, GOOGL..."
              style={inputStyle}
            />
          </div>
          <button onClick={fetchFinancials} disabled={loading} style={{
            padding: '9px 20px', borderRadius: '7px', border: 'none',
            background: loading ? 'var(--border2)' : 'var(--blue)',
            color: '#fff', fontSize: '13px', fontWeight: 500, cursor: loading ? 'not-allowed' : 'pointer',
          }}>
            {loading ? 'Loading...' : 'Fetch Financials'}
          </button>
        </div>
        {error && <div style={{ marginTop: '10px', padding: '8px 12px', borderRadius: '6px', background: 'rgba(220,38,38,0.1)', color: '#f87171', fontSize: '12px' }}>{error}</div>}
      </div>

      {financials && (
        <>
          {/* Company header */}
          <div style={{ background: 'var(--surface)', border: '1px solid var(--border)', borderRadius: '10px', padding: '18px', marginBottom: '16px' }}>
            <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'flex-start' }}>
              <div>
                <div style={{ fontSize: '20px', fontWeight: 600 }}>{financials.company_name}</div>
                <div style={{ fontSize: '12px', color: 'var(--text3)', marginTop: '4px' }}>{financials.sector} · {financials.industry}</div>
              </div>
              <div style={{ textAlign: 'right' }}>
                <div style={{ fontSize: '28px', fontWeight: 700, color: '#1a5fff' }}>${financials.current_price}</div>
                <div style={{ fontSize: '11px', color: 'var(--text3)' }}>Market Cap: {formatB(financials.market_cap)}</div>
              </div>
            </div>
          </div>

          <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: '16px', marginBottom: '16px' }}>
            {/* Key financials */}
            <div style={{ background: 'var(--surface)', border: '1px solid var(--border)', borderRadius: '10px', padding: '18px' }}>
              <div style={{ fontSize: '13px', fontWeight: 500, marginBottom: '14px' }}>Key Financials</div>
              <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: '10px' }}>
                {[
                  { label: 'Revenue', value: formatB(financials.financials.revenue) },
                  { label: 'EBITDA', value: formatB(financials.financials.ebitda) },
                  { label: 'Net Income', value: formatB(financials.financials.net_income) },
                  { label: 'Free Cash Flow', value: formatB(financials.financials.free_cashflow) },
                  { label: 'Total Debt', value: formatB(financials.financials.total_debt) },
                  { label: 'Cash', value: formatB(financials.financials.cash) },
                ].map((item, i) => (
                  <div key={i} style={{ padding: '10px', borderRadius: '7px', background: 'var(--surface2)' }}>
                    <div style={{ fontSize: '10px', color: 'var(--text3)', marginBottom: '4px' }}>{item.label}</div>
                    <div style={{ fontSize: '14px', fontWeight: 600 }}>{item.value}</div>
                  </div>
                ))}
              </div>
            </div>

            {/* Multiples */}
            <div style={{ background: 'var(--surface)', border: '1px solid var(--border)', borderRadius: '10px', padding: '18px' }}>
              <div style={{ fontSize: '13px', fontWeight: 500, marginBottom: '14px' }}>Valuation Multiples</div>
              <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: '10px', marginBottom: '14px' }}>
                {[
                  { label: 'P/E Ratio', value: financials.multiples.pe_ratio.toFixed(1) + 'x' },
                  { label: 'EV/EBITDA', value: financials.multiples.ev_ebitda.toFixed(1) + 'x' },
                  { label: 'P/B Ratio', value: financials.multiples.pb_ratio.toFixed(1) + 'x' },
                  { label: 'P/S Ratio', value: financials.multiples.ps_ratio.toFixed(1) + 'x' },
                ].map((item, i) => (
                  <div key={i} style={{ padding: '10px', borderRadius: '7px', background: 'var(--surface2)' }}>
                    <div style={{ fontSize: '10px', color: 'var(--text3)', marginBottom: '4px' }}>{item.label}</div>
                    <div style={{ fontSize: '16px', fontWeight: 600, color: '#1a5fff' }}>{item.value}</div>
                  </div>
                ))}
              </div>
              <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr 1fr', gap: '8px' }}>
                {[
                  { label: 'EBITDA Margin', value: `${financials.financials.ebitda_margin}%` },
                  { label: 'Revenue Growth', value: `${financials.financials.revenue_growth}%` },
                  { label: 'ROE', value: `${financials.financials.roe}%` },
                ].map((item, i) => (
                  <div key={i} style={{ padding: '8px', borderRadius: '6px', background: 'var(--surface2)', textAlign: 'center' }}>
                    <div style={{ fontSize: '9px', color: 'var(--text3)', marginBottom: '3px' }}>{item.label}</div>
                    <div style={{ fontSize: '13px', fontWeight: 600 }}>{item.value}</div>
                  </div>
                ))}
              </div>
            </div>
          </div>

          {/* DCF Assumptions */}
          <div style={{ background: 'var(--surface)', border: '1px solid var(--border)', borderRadius: '10px', padding: '18px', marginBottom: '16px' }}>
            <div style={{ fontSize: '13px', fontWeight: 500, marginBottom: '16px' }}>DCF Assumptions</div>
            <div style={{ display: 'grid', gridTemplateColumns: 'repeat(5, 1fr)', gap: '12px', marginBottom: '14px' }}>
              {[
                { key: 'revenue_growth_rate', label: 'Revenue Growth (%)', },
                { key: 'terminal_growth_rate', label: 'Terminal Growth (%)', },
                { key: 'wacc', label: 'WACC (%)', },
                { key: 'ebitda_margin_improvement', label: 'Margin Improvement (%/yr)', },
                { key: 'projection_years', label: 'Projection Years', },
              ].map(field => (
                <div key={field.key}>
                  <label style={labelStyle}>{field.label}</label>
                  <input
                    type="text"
                    inputMode="decimal"
                    value={(assumptions as any)[field.key]}
                    onChange={e => setAssumptions({ ...assumptions, [field.key]: e.target.value })}
                    style={inputStyle}
                  />
                </div>
              ))}
            </div>
            <button onClick={runDCF} disabled={dcfLoading} style={{
              padding: '9px 24px', borderRadius: '7px', border: 'none',
              background: dcfLoading ? 'var(--border2)' : 'var(--blue)',
              color: '#fff', fontSize: '13px', fontWeight: 500, cursor: dcfLoading ? 'not-allowed' : 'pointer',
            }}>
              {dcfLoading ? 'Running DCF...' : 'Run DCF Model'}
            </button>
          </div>

          {/* DCF Results */}
          {dcf && (
            <>
              <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr 1fr 1fr', gap: '12px', marginBottom: '16px' }}>
                <div style={{
                  background: `${dcf.recommendation_color}15`,
                  border: `1px solid ${dcf.recommendation_color}40`,
                  borderRadius: '10px', padding: '16px 18px', gridColumn: '1 / 2',
                }}>
                  <div style={{ fontSize: '10px', color: 'var(--text3)', textTransform: 'uppercase', letterSpacing: '0.6px', marginBottom: '8px' }}>Recommendation</div>
                  <div style={{ fontSize: '26px', fontWeight: 700, color: dcf.recommendation_color }}>{dcf.recommendation}</div>
                  <div style={{ fontSize: '11px', color: 'var(--text3)', marginTop: '4px' }}>
                    {dcf.upside_downside > 0 ? '+' : ''}{dcf.upside_downside}% upside
                  </div>
                </div>
                {[
                  { label: 'Intrinsic Value', value: `$${dcf.intrinsic_value.toFixed(2)}`, sub: `vs $${dcf.current_price} market` },
                  { label: 'PV of FCFs', value: formatB(dcf.pv_fcfs), sub: `${(100 - dcf.terminal_value_pct).toFixed(1)}% of EV` },
                  { label: 'Terminal Value', value: formatB(dcf.pv_terminal), sub: `${dcf.terminal_value_pct}% of EV` },
                ].map((m, i) => (
                  <div key={i} style={{ background: 'var(--surface)', border: '1px solid var(--border)', borderRadius: '10px', padding: '16px 18px' }}>
                    <div style={{ fontSize: '10px', color: 'var(--text3)', textTransform: 'uppercase', letterSpacing: '0.6px', marginBottom: '8px' }}>{m.label}</div>
                    <div style={{ fontSize: '20px', fontWeight: 600 }}>{m.value}</div>
                    <div style={{ fontSize: '11px', color: 'var(--text3)', marginTop: '4px' }}>{m.sub}</div>
                  </div>
                ))}
              </div>

              {/* Projections chart */}
              <div style={{ background: 'var(--surface)', border: '1px solid var(--border)', borderRadius: '10px', padding: '18px' }}>
                <div style={{ fontSize: '13px', fontWeight: 500, marginBottom: '4px' }}>Revenue & FCF Projections</div>
                <div style={{ fontSize: '11px', color: 'var(--text3)', marginBottom: '14px' }}>
                  {dcf.assumptions.projection_years}-year forecast · {dcf.assumptions.revenue_growth}% revenue growth · {dcf.assumptions.wacc}% WACC
                </div>
                <ResponsiveContainer width="100%" height={200}>
                  <BarChart data={dcf.projections} margin={{ top: 5, right: 10, bottom: 5, left: 20 }}>
                    <CartesianGrid strokeDasharray="3 3" stroke="var(--border)" />
                    <XAxis dataKey="year" tick={{ fontSize: 10, fill: 'var(--text3)' }} tickFormatter={v => `Y${v}`} />
                    <YAxis tick={{ fontSize: 10, fill: 'var(--text3)' }} tickFormatter={v => `$${(v/1e9).toFixed(0)}B`} />
                    <Tooltip
                      contentStyle={{ background: 'var(--surface2)', border: '1px solid var(--border)', borderRadius: '6px', fontSize: '11px' }}
                      formatter={(v: any, name: string) => [formatB(v), name === 'revenue' ? 'Revenue' : name === 'fcf' ? 'FCF' : 'PV of FCF']}
                    />
                    <Bar dataKey="revenue" fill="#1a5fff" opacity={0.7} name="revenue" radius={[3,3,0,0]} />
                    <Bar dataKey="fcf" fill="#4ade80" opacity={0.8} name="fcf" radius={[3,3,0,0]} />
                    <Bar dataKey="pv_fcf" fill="#fbbf24" opacity={0.8} name="pv_fcf" radius={[3,3,0,0]} />
                  </BarChart>
                </ResponsiveContainer>
              </div>
            </>
          )}
        </>
      )}

      {!financials && !loading && (
        <div style={{
          background: 'var(--surface)', border: '1px solid var(--border)',
          borderRadius: '10px', padding: '80px', textAlign: 'center',
          color: 'var(--text3)', fontSize: '13px',
        }}>
          Enter a ticker symbol and click <strong style={{ color: 'var(--text2)' }}>Fetch Financials</strong> to start the valuation
        </div>
      )}
    </div>
  );
}
