'use client';

import { useState } from 'react';
import { LineChart, Line, XAxis, YAxis, Tooltip, ResponsiveContainer, CartesianGrid, ReferenceLine, ScatterChart, Scatter } from 'recharts';

interface OptionResult {
  price: number;
  delta: number;
  gamma: number;
  theta: number;
  vega: number;
  rho: number;
  intrinsic_value: number;
  time_value: number;
  moneyness: string;
  option_type: string;
}

const defaultForm = {
  spot_price: '150',
  strike_price: '155',
  time_to_expiry: '0.25',
  risk_free_rate: '0.05',
  volatility: '0.25',
  option_type: 'call',
};

export default function Options() {
  const [form, setForm] = useState(defaultForm);
  const [result, setResult] = useState<OptionResult | null>(null);
  const [payoff, setPayoff] = useState<any[]>([]);
  const [volSmile, setVolSmile] = useState<any[]>([]);
  const [loading, setLoading] = useState(false);

  const handleCalculate = async () => {
    setLoading(true);
    try {
      const payload = {
        spot_price: parseFloat(form.spot_price),
        strike_price: parseFloat(form.strike_price),
        time_to_expiry: parseFloat(form.time_to_expiry),
        risk_free_rate: parseFloat(form.risk_free_rate),
        volatility: parseFloat(form.volatility),
        option_type: form.option_type,
      };

      const [priceRes, payoffRes, smileRes] = await Promise.all([
        fetch('http://127.0.0.1:8000/options/price', { method: 'POST', headers: { 'Content-Type': 'application/json' }, body: JSON.stringify(payload) }),
        fetch('http://127.0.0.1:8000/options/payoff', { method: 'POST', headers: { 'Content-Type': 'application/json' }, body: JSON.stringify(payload) }),
        fetch('http://127.0.0.1:8000/options/vol-smile', { method: 'POST', headers: { 'Content-Type': 'application/json' }, body: JSON.stringify(payload) }),
      ]);

      setResult(await priceRes.json());
      const payoffData = await payoffRes.json();
      setPayoff(payoffData.points);
      const smileData = await smileRes.json();
      setVolSmile(smileData.points);
    } catch (e) {
      console.error('Calculation failed');
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

  const getGreekColor = (value: number, greek: string) => {
    if (greek === 'theta') return '#f87171';
    if (value > 0) return '#4ade80';
    return '#f87171';
  };

  const getMoneynessColor = (m: string) => {
    if (m === 'ITM') return '#4ade80';
    if (m === 'OTM') return '#f87171';
    return '#fbbf24';
  };

  return (
    <div style={{ padding: '24px 28px' }}>
      <div style={{ marginBottom: '24px' }}>
        <div style={{ fontSize: '18px', fontWeight: 600, letterSpacing: '-0.3px' }}>Options Analytics</div>
        <div style={{ fontSize: '12px', color: 'var(--text3)', marginTop: '2px' }}>
          Black-Scholes pricing · Greeks · Payoff diagrams · Volatility smile
        </div>
      </div>

      <div style={{ display: 'grid', gridTemplateColumns: '280px 1fr', gap: '16px' }}>
        {/* Form */}
        <div style={{ background: 'var(--surface)', border: '1px solid var(--border)', borderRadius: '10px', padding: '18px' }}>
          <div style={{ fontSize: '13px', fontWeight: 500, marginBottom: '16px' }}>Option Parameters</div>

          <div style={{ display: 'flex', gap: '8px', marginBottom: '14px' }}>
            {['call', 'put'].map(type => (
              <button key={type} onClick={() => setForm({ ...form, option_type: type })} style={{
                flex: 1, padding: '8px', borderRadius: '7px', border: 'none', cursor: 'pointer',
                background: form.option_type === type ? (type === 'call' ? 'rgba(74,222,128,0.15)' : 'rgba(248,113,113,0.15)') : 'var(--surface2)',
                color: form.option_type === type ? (type === 'call' ? '#4ade80' : '#f87171') : 'var(--text3)',
                fontSize: '13px', fontWeight: 500, textTransform: 'capitalize',
              }}>{type}</button>
            ))}
          </div>

          <div style={{ display: 'flex', flexDirection: 'column', gap: '12px' }}>
            {[
              { key: 'spot_price', label: 'Spot Price (S)' },
              { key: 'strike_price', label: 'Strike Price (K)' },
              { key: 'time_to_expiry', label: 'Time to Expiry (years)' },
              { key: 'risk_free_rate', label: 'Risk-Free Rate (e.g. 0.05)' },
              { key: 'volatility', label: 'Volatility σ (e.g. 0.25)' },
            ].map(field => (
              <div key={field.key}>
                <label style={labelStyle}>{field.label}</label>
                <input
                  type="text"
                  inputMode="decimal"
                  value={(form as any)[field.key]}
                  onChange={e => setForm({ ...form, [field.key]: e.target.value })}
                  style={inputStyle}
                />
              </div>
            ))}
          </div>

          <button onClick={handleCalculate} disabled={loading} style={{
            width: '100%', marginTop: '16px', padding: '10px', borderRadius: '7px',
            border: 'none', background: loading ? 'var(--border2)' : 'var(--blue)',
            color: '#fff', fontSize: '13px', fontWeight: 500, cursor: loading ? 'not-allowed' : 'pointer',
          }}>
            {loading ? 'Calculating...' : 'Calculate'}
          </button>

          {result && (
            <div style={{ marginTop: '16px', padding: '14px', borderRadius: '8px', background: 'var(--surface2)' }}>
              <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between', marginBottom: '12px' }}>
                <div style={{ fontSize: '12px', color: 'var(--text3)' }}>Option Price</div>
                <div style={{
                  fontSize: '10px', padding: '2px 8px', borderRadius: '4px',
                  background: `${getMoneynessColor(result.moneyness)}20`,
                  color: getMoneynessColor(result.moneyness),
                }}>{result.moneyness}</div>
              </div>
              <div style={{ fontSize: '28px', fontWeight: 600, color: '#1a5fff', marginBottom: '10px' }}>
                ${result.price.toFixed(4)}
              </div>
              <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: '8px', fontSize: '11px' }}>
                <div style={{ color: 'var(--text3)' }}>Intrinsic</div>
                <div style={{ color: 'var(--text2)', textAlign: 'right' }}>${result.intrinsic_value.toFixed(4)}</div>
                <div style={{ color: 'var(--text3)' }}>Time Value</div>
                <div style={{ color: 'var(--text2)', textAlign: 'right' }}>${result.time_value.toFixed(4)}</div>
              </div>
            </div>
          )}
        </div>

        {/* Results */}
        <div style={{ display: 'flex', flexDirection: 'column', gap: '14px' }}>
          {result && (
            <>
              {/* Greeks */}
              <div style={{ background: 'var(--surface)', border: '1px solid var(--border)', borderRadius: '10px', padding: '18px' }}>
                <div style={{ fontSize: '13px', fontWeight: 500, marginBottom: '16px' }}>Greeks</div>
                <div style={{ display: 'grid', gridTemplateColumns: 'repeat(5, 1fr)', gap: '10px' }}>
                  {[
                    { name: 'Delta (Δ)', value: result.delta, desc: 'Price sensitivity to spot' },
                    { name: 'Gamma (Γ)', value: result.gamma, desc: 'Delta sensitivity to spot' },
                    { name: 'Theta (Θ)', value: result.theta, desc: 'Daily time decay' },
                    { name: 'Vega (ν)', value: result.vega, desc: 'Vol sensitivity (per 1%)' },
                    { name: 'Rho (ρ)', value: result.rho, desc: 'Rate sensitivity (per 1%)' },
                  ].map(greek => (
                    <div key={greek.name} style={{ background: 'var(--surface2)', borderRadius: '8px', padding: '12px' }}>
                      <div style={{ fontSize: '11px', color: 'var(--text3)', marginBottom: '6px' }}>{greek.name}</div>
                      <div style={{ fontSize: '18px', fontWeight: 600, color: getGreekColor(greek.value, greek.name.toLowerCase()) }}>
                        {greek.value.toFixed(4)}
                      </div>
                      <div style={{ fontSize: '10px', color: 'var(--text3)', marginTop: '4px' }}>{greek.desc}</div>
                    </div>
                  ))}
                </div>
              </div>

              <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: '14px' }}>
                {/* Payoff diagram */}
                <div style={{ background: 'var(--surface)', border: '1px solid var(--border)', borderRadius: '10px', padding: '18px' }}>
                  <div style={{ fontSize: '13px', fontWeight: 500, marginBottom: '4px' }}>Payoff Diagram</div>
                  <div style={{ fontSize: '11px', color: 'var(--text3)', marginBottom: '14px' }}>P&L at expiry vs current value</div>
                  <ResponsiveContainer width="100%" height={200}>
                    <LineChart data={payoff} margin={{ top: 5, right: 10, bottom: 5, left: 10 }}>
                      <CartesianGrid strokeDasharray="3 3" stroke="var(--border)" />
                      <XAxis dataKey="spot" tick={{ fontSize: 9, fill: 'var(--text3)' }} tickFormatter={v => `$${v}`} />
                      <YAxis tick={{ fontSize: 10, fill: 'var(--text3)' }} />
                      <ReferenceLine y={0} stroke="var(--border2)" strokeDasharray="4 4" />
                      <ReferenceLine x={parseFloat(form.strike_price)} stroke="#fbbf24" strokeDasharray="4 4" />
                      <Tooltip
                        contentStyle={{ background: 'var(--surface2)', border: '1px solid var(--border)', borderRadius: '6px', fontSize: '11px' }}
                        formatter={(v: any, name: string) => [`$${parseFloat(v).toFixed(2)}`, name === 'payoff_expiry' ? 'At expiry' : 'Current']}
                      />
                      <Line type="monotone" dataKey="payoff_expiry" stroke="#4ade80" strokeWidth={2} dot={false} name="At expiry" />
                      <Line type="monotone" dataKey="payoff_now" stroke="#1a5fff" strokeWidth={2} dot={false} strokeDasharray="5 5" name="Current" />
                    </LineChart>
                  </ResponsiveContainer>
                </div>

                {/* Vol smile */}
                <div style={{ background: 'var(--surface)', border: '1px solid var(--border)', borderRadius: '10px', padding: '18px' }}>
                  <div style={{ fontSize: '13px', fontWeight: 500, marginBottom: '4px' }}>Volatility Smile</div>
                  <div style={{ fontSize: '11px', color: 'var(--text3)', marginBottom: '14px' }}>Implied volatility across strikes</div>
                  <ResponsiveContainer width="100%" height={200}>
                    <LineChart data={volSmile} margin={{ top: 5, right: 10, bottom: 5, left: 10 }}>
                      <CartesianGrid strokeDasharray="3 3" stroke="var(--border)" />
                      <XAxis dataKey="strike" tick={{ fontSize: 9, fill: 'var(--text3)' }} tickFormatter={v => `$${v}`} />
                      <YAxis tick={{ fontSize: 10, fill: 'var(--text3)' }} tickFormatter={v => `${v}%`} />
                      <ReferenceLine x={parseFloat(form.spot_price)} stroke="#fbbf24" strokeDasharray="4 4" />
                      <Tooltip
                        contentStyle={{ background: 'var(--surface2)', border: '1px solid var(--border)', borderRadius: '6px', fontSize: '11px' }}
                        formatter={(v: any) => [`${parseFloat(v).toFixed(2)}%`, 'Implied Vol']}
                      />
                      <Line type="monotone" dataKey="implied_vol" stroke="#a78bfa" strokeWidth={2} dot={false} />
                    </LineChart>
                  </ResponsiveContainer>
                </div>
              </div>
            </>
          )}

          {!result && (
            <div style={{
              background: 'var(--surface)', border: '1px solid var(--border)',
              borderRadius: '10px', padding: '60px', textAlign: 'center',
              color: 'var(--text3)', fontSize: '13px',
            }}>
              Enter option parameters and click <strong style={{ color: 'var(--text2)' }}>Calculate</strong> to run Black-Scholes pricing
            </div>
          )}
        </div>
      </div>
    </div>
  );
}
