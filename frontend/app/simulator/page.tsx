'use client';

import { useState, useEffect, useCallback } from 'react';

interface ScenarioResult {
  default_rate: number;
  portfolio_return: number;
  portfolio_var: number;
  sharpe_ratio: number;
  credit_stress_score: number;
  loan_approval_rate: number;
  revenue_impact: number;
  stress_level: string;
  stress_color: string;
}

const defaultScenario = {
  interest_rate: 5.0,
  gdp_growth: 2.0,
  unemployment_rate: 4.0,
  inflation_rate: 2.5,
  market_volatility: 20.0,
};

const PRESETS = [
  { name: 'Base Case', values: { interest_rate: 5.0, gdp_growth: 2.0, unemployment_rate: 4.0, inflation_rate: 2.5, market_volatility: 20.0 } },
  { name: 'Rate Hike', values: { interest_rate: 8.0, gdp_growth: 1.2, unemployment_rate: 5.5, inflation_rate: 4.0, market_volatility: 28.0 } },
  { name: 'Recession', values: { interest_rate: 2.0, gdp_growth: -1.5, unemployment_rate: 8.5, inflation_rate: 1.0, market_volatility: 40.0 } },
  { name: 'Bull Market', values: { interest_rate: 4.0, gdp_growth: 4.5, unemployment_rate: 3.0, inflation_rate: 2.0, market_volatility: 14.0 } },
  { name: 'Stagflation', values: { interest_rate: 7.0, gdp_growth: 0.2, unemployment_rate: 7.0, inflation_rate: 8.0, market_volatility: 35.0 } },
];

export default function Simulator() {
  const [scenario, setScenario] = useState(defaultScenario);
  const [result, setResult] = useState<ScenarioResult | null>(null);
  const [loading, setLoading] = useState(false);

  const runScenario = useCallback(async (values = scenario) => {
    setLoading(true);
    try {
      const res = await fetch('http://127.0.0.1:8000/simulator/run', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify(values),
      });
      const data = await res.json();
      setResult(data);
    } catch (e) {
      console.error('Simulation failed');
    } finally {
      setLoading(false);
    }
  }, [scenario]);

  useEffect(() => {
    runScenario();
  }, []);

  const handleSlider = (key: string, value: number) => {
    const updated = { ...scenario, [key]: value };
    setScenario(updated);
    runScenario(updated);
  };

  const handlePreset = (preset: typeof PRESETS[0]) => {
    setScenario(preset.values);
    runScenario(preset.values);
  };

  const sliders = [
    { key: 'interest_rate', label: 'Interest Rate', min: 0, max: 15, step: 0.25, unit: '%', color: '#1a5fff' },
    { key: 'gdp_growth', label: 'GDP Growth', min: -5, max: 8, step: 0.1, unit: '%', color: '#4ade80' },
    { key: 'unemployment_rate', label: 'Unemployment Rate', min: 1, max: 15, step: 0.25, unit: '%', color: '#fbbf24' },
    { key: 'inflation_rate', label: 'Inflation Rate', min: 0, max: 12, step: 0.25, unit: '%', color: '#a78bfa' },
    { key: 'market_volatility', label: 'Market Volatility (VIX)', min: 8, max: 60, step: 1, unit: '', color: '#f87171' },
  ];

  return (
    <div style={{ padding: '24px 28px' }}>
      <div style={{ marginBottom: '24px' }}>
        <div style={{ fontSize: '18px', fontWeight: 600, letterSpacing: '-0.3px' }}>Scenario Simulator</div>
        <div style={{ fontSize: '12px', color: 'var(--text3)', marginTop: '2px' }}>
          Adjust macroeconomic variables and see real-time impact on risk, portfolio, and revenue
        </div>
      </div>

      {/* Presets */}
      <div style={{ display: 'flex', gap: '8px', marginBottom: '20px' }}>
        {PRESETS.map(preset => (
          <button key={preset.name} onClick={() => handlePreset(preset)} style={{
            padding: '6px 14px', borderRadius: '6px', border: '1px solid var(--border2)',
            background: 'var(--surface)', color: 'var(--text2)', fontSize: '12px',
            cursor: 'pointer', fontFamily: 'inherit',
          }}>
            {preset.name}
          </button>
        ))}
      </div>

      <div style={{ display: 'grid', gridTemplateColumns: '360px 1fr', gap: '16px' }}>
        {/* Sliders */}
        <div style={{ background: 'var(--surface)', border: '1px solid var(--border)', borderRadius: '10px', padding: '20px' }}>
          <div style={{ fontSize: '13px', fontWeight: 500, marginBottom: '20px' }}>Macroeconomic Variables</div>
          {sliders.map(slider => (
            <div key={slider.key} style={{ marginBottom: '22px' }}>
              <div style={{ display: 'flex', justifyContent: 'space-between', marginBottom: '8px' }}>
                <label style={{ fontSize: '12px', color: 'var(--text2)' }}>{slider.label}</label>
                <span style={{ fontSize: '13px', fontWeight: 600, color: slider.color }}>
                  {(scenario as any)[slider.key].toFixed(slider.step < 1 ? 2 : 0)}{slider.unit}
                </span>
              </div>
              <input
                type="range"
                min={slider.min}
                max={slider.max}
                step={slider.step}
                value={(scenario as any)[slider.key]}
                onChange={e => handleSlider(slider.key, parseFloat(e.target.value))}
                style={{
                  width: '100%', height: '4px', borderRadius: '2px',
                  appearance: 'none', background: `linear-gradient(to right, ${slider.color} 0%, ${slider.color} ${((scenario as any)[slider.key] - slider.min) / (slider.max - slider.min) * 100}%, var(--border2) ${((scenario as any)[slider.key] - slider.min) / (slider.max - slider.min) * 100}%, var(--border2) 100%)`,
                  cursor: 'pointer', outline: 'none',
                }}
              />
              <div style={{ display: 'flex', justifyContent: 'space-between', marginTop: '4px' }}>
                <span style={{ fontSize: '10px', color: 'var(--text3)' }}>{slider.min}{slider.unit}</span>
                <span style={{ fontSize: '10px', color: 'var(--text3)' }}>{slider.max}{slider.unit}</span>
              </div>
            </div>
          ))}
        </div>

        {/* Results */}
        <div style={{ display: 'flex', flexDirection: 'column', gap: '14px' }}>
          {result && (
            <>
              {/* Stress banner */}
              <div style={{
                padding: '14px 18px', borderRadius: '10px',
                background: `${result.stress_color}15`,
                border: `1px solid ${result.stress_color}40`,
                display: 'flex', alignItems: 'center', justifyContent: 'space-between',
              }}>
                <div>
                  <div style={{ fontSize: '12px', color: 'var(--text3)', marginBottom: '2px' }}>Overall Stress Level</div>
                  <div style={{ fontSize: '20px', fontWeight: 700, color: result.stress_color }}>
                    {result.stress_level}
                  </div>
                </div>
                <div style={{ textAlign: 'right' }}>
                  <div style={{ fontSize: '11px', color: 'var(--text3)' }}>Credit Stress Score</div>
                  <div style={{ fontSize: '28px', fontWeight: 700, color: result.stress_color }}>
                    {result.credit_stress_score}
                    <span style={{ fontSize: '14px' }}>/100</span>
                  </div>
                </div>
              </div>

              {/* Metrics grid */}
              <div style={{ display: 'grid', gridTemplateColumns: 'repeat(3, 1fr)', gap: '12px' }}>
                {[
                  { label: 'Default Rate', value: `${result.default_rate}%`, color: result.default_rate > 5 ? '#f87171' : result.default_rate > 3.5 ? '#fbbf24' : '#4ade80', base: '3.2%' },
                  { label: 'Portfolio Return', value: `${result.portfolio_return > 0 ? '+' : ''}${result.portfolio_return}%`, color: result.portfolio_return > 0 ? '#4ade80' : '#f87171', base: '+11.7%' },
                  { label: 'Portfolio VaR', value: `$${result.portfolio_var}M`, color: result.portfolio_var > 3 ? '#f87171' : '#fbbf24', base: '$2.1M' },
                  { label: 'Sharpe Ratio', value: result.sharpe_ratio.toFixed(3), color: result.sharpe_ratio > 1 ? '#4ade80' : result.sharpe_ratio > 0 ? '#fbbf24' : '#f87171', base: '1.42' },
                  { label: 'Loan Approval Rate', value: `${result.loan_approval_rate}%`, color: result.loan_approval_rate > 30 ? '#4ade80' : '#fbbf24', base: '32.4%' },
                  { label: 'Revenue (YTD)', value: `$${result.revenue_impact}M`, color: result.revenue_impact > 48 ? '#4ade80' : '#f87171', base: '$48.2M' },
                ].map((m, i) => (
                  <div key={i} style={{ background: 'var(--surface)', border: '1px solid var(--border)', borderRadius: '10px', padding: '14px 16px' }}>
                    <div style={{ fontSize: '10px', color: 'var(--text3)', textTransform: 'uppercase', letterSpacing: '0.6px', marginBottom: '8px' }}>{m.label}</div>
                    <div style={{ fontSize: '22px', fontWeight: 600, color: m.color, letterSpacing: '-0.5px' }}>{m.value}</div>
                    <div style={{ fontSize: '10px', color: 'var(--text3)', marginTop: '4px' }}>Base: {m.base}</div>
                  </div>
                ))}
              </div>

              {/* Narrative */}
              <div style={{ background: 'var(--surface)', border: '1px solid var(--border)', borderRadius: '10px', padding: '18px' }}>
                <div style={{ fontSize: '13px', fontWeight: 500, marginBottom: '12px' }}>Scenario Analysis</div>
                <div style={{ display: 'flex', flexDirection: 'column', gap: '8px' }}>
                  {[
                    result.default_rate > 5 && { color: '#f87171', text: `Default rate of ${result.default_rate}% is ${(result.default_rate - 3.2).toFixed(1)}pp above baseline. Tighten credit underwriting criteria and increase loan loss provisions.` },
                    result.portfolio_return < 5 && { color: '#fbbf24', text: `Portfolio return compressed to ${result.portfolio_return}%. Consider rotating into defensive sectors and increasing fixed income allocation.` },
                    result.sharpe_ratio < 0.5 && { color: '#f87171', text: `Sharpe ratio of ${result.sharpe_ratio.toFixed(2)} indicates poor risk-adjusted returns. Reduce exposure to high-volatility assets.` },
                    result.portfolio_return > 12 && { color: '#4ade80', text: `Strong portfolio return of ${result.portfolio_return}% with Sharpe ${result.sharpe_ratio.toFixed(2)}. Current macro environment supports growth positioning.` },
                    result.default_rate < 3 && { color: '#4ade80', text: `Low default environment. Consider expanding credit origination in SME and retail segments to capture growth.` },
                  ].filter(Boolean).map((item: any, i) => (
                    <div key={i} style={{ display: 'flex', gap: '10px', padding: '10px', borderRadius: '7px', background: 'var(--surface2)' }}>
                      <div style={{ width: '3px', borderRadius: '2px', background: item.color, flexShrink: 0 }} />
                      <div style={{ fontSize: '12px', color: 'var(--text2)', lineHeight: 1.55 }}>{item.text}</div>
                    </div>
                  ))}
                </div>
              </div>
            </>
          )}
        </div>
      </div>
    </div>
  );
}
