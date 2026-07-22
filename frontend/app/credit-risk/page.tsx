'use client';

import { useState } from 'react';

interface ShapFeature {
  feature: string;
  value: number;
  shap_value: number;
  impact: string;
}

interface PredictionResult {
  probability_of_default: number;
  risk_score: number;
  recommendation: string;
  shap_values: ShapFeature[];
  model_version: string;
}

const defaultForm = {
  age: 35,
  income: 75000,
  loan_amount: 25000,
  loan_term: 36,
  credit_score: 680,
  employment_years: 5,
  debt_to_income: 0.35,
  num_credit_lines: 4,
  num_delinquencies: 0,
  loan_purpose: 'personal',
};

export default function CreditRisk() {
  const [form, setForm] = useState(defaultForm);
  const [result, setResult] = useState<PredictionResult | null>(null);
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);

  const handleSubmit = async () => {
    setLoading(true);
    setError(null);
    try {
      const res = await fetch('http://127.0.0.1:8000/credit-risk/predict', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify(form),
      });
      if (!res.ok) throw new Error('Prediction failed');
      const data = await res.json();
      setResult(data);
    } catch (e) {
      setError('Failed to get prediction. Make sure the backend is running.');
    } finally {
      setLoading(false);
    }
  };

  const getRecommendationColor = (rec: string) => {
    if (rec === 'APPROVE') return { bg: 'rgba(22,163,74,0.12)', color: '#4ade80', border: 'rgba(22,163,74,0.3)' };
    if (rec === 'REJECT') return { bg: 'rgba(220,38,38,0.12)', color: '#f87171', border: 'rgba(220,38,38,0.3)' };
    return { bg: 'rgba(217,119,6,0.12)', color: '#fbbf24', border: 'rgba(217,119,6,0.3)' };
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
      {/* Header */}
      <div style={{ marginBottom: '24px' }}>
        <div style={{ fontSize: '18px', fontWeight: 600, letterSpacing: '-0.3px' }}>Credit Risk Analytics</div>
        <div style={{ fontSize: '12px', color: 'var(--text3)', marginTop: '2px' }}>
          XGBoost model · SHAP explainability · Real-time scoring
        </div>
      </div>

      <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: '16px' }}>
        {/* Form */}
        <div style={{ background: 'var(--surface)', border: '1px solid var(--border)', borderRadius: '10px', padding: '20px' }}>
          <div style={{ fontSize: '13px', fontWeight: 500, marginBottom: '18px' }}>Loan Application</div>

          <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: '14px' }}>
            {[
              { key: 'age', label: 'Age', type: 'number' },
              { key: 'credit_score', label: 'Credit Score', type: 'number' },
              { key: 'income', label: 'Annual Income ($)', type: 'number' },
              { key: 'loan_amount', label: 'Loan Amount ($)', type: 'number' },
              { key: 'loan_term', label: 'Loan Term (months)', type: 'number' },
              { key: 'employment_years', label: 'Employment Years', type: 'number' },
              { key: 'debt_to_income', label: 'Debt-to-Income Ratio', type: 'number' },
              { key: 'num_credit_lines', label: 'Credit Lines', type: 'number' },
              { key: 'num_delinquencies', label: 'Delinquencies', type: 'number' },
            ].map(field => (
              <div key={field.key}>
                <label style={labelStyle}>{field.label}</label>
                <input
                  type={field.type}
                  value={(form as any)[field.key]}
                  onChange={e => setForm({ ...form, [field.key]: parseFloat(e.target.value) || 0 })}
                  style={inputStyle}
                />
              </div>
            ))}

            <div>
              <label style={labelStyle}>Loan Purpose</label>
              <select
                value={form.loan_purpose}
                onChange={e => setForm({ ...form, loan_purpose: e.target.value })}
                style={inputStyle}
              >
                <option value="personal">Personal</option>
                <option value="mortgage">Mortgage</option>
                <option value="auto">Auto</option>
                <option value="business">Business</option>
              </select>
            </div>
          </div>

          <button
            onClick={handleSubmit}
            disabled={loading}
            style={{
              width: '100%', marginTop: '18px', padding: '10px',
              borderRadius: '7px', border: 'none', cursor: loading ? 'not-allowed' : 'pointer',
              background: loading ? 'var(--border2)' : 'var(--blue)',
              color: '#fff', fontSize: '13px', fontWeight: 500,
            }}
          >
            {loading ? 'Analyzing...' : 'Analyze Credit Risk'}
          </button>

          {error && (
            <div style={{ marginTop: '12px', padding: '10px', borderRadius: '7px', background: 'rgba(220,38,38,0.1)', color: '#f87171', fontSize: '12px' }}>
              {error}
            </div>
          )}
        </div>

        {/* Results */}
        <div>
          {result ? (
            <div style={{ display: 'flex', flexDirection: 'column', gap: '14px' }}>
              {/* Recommendation */}
              <div style={{ background: 'var(--surface)', border: '1px solid var(--border)', borderRadius: '10px', padding: '20px' }}>
                <div style={{ fontSize: '13px', fontWeight: 500, marginBottom: '16px' }}>Decision</div>
                <div style={{ display: 'flex', alignItems: 'center', gap: '12px', marginBottom: '16px' }}>
                  <div style={{
                    padding: '6px 16px', borderRadius: '8px', fontSize: '14px', fontWeight: 600,
                    ...getRecommendationColor(result.recommendation),
                    border: `1px solid ${getRecommendationColor(result.recommendation).border}`,
                  }}>
                    {result.recommendation}
                  </div>
                  <div style={{ fontSize: '12px', color: 'var(--text2)' }}>
                    Model: {result.model_version}
                  </div>
                </div>

                <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: '12px' }}>
                  <div style={{ background: 'var(--surface2)', borderRadius: '8px', padding: '12px' }}>
                    <div style={{ fontSize: '10px', color: 'var(--text3)', textTransform: 'uppercase', letterSpacing: '0.6px', marginBottom: '6px' }}>Risk Score</div>
                    <div style={{ fontSize: '22px', fontWeight: 600, color: result.risk_score > 50 ? '#f87171' : result.risk_score > 20 ? '#fbbf24' : '#4ade80' }}>
                      {result.risk_score.toFixed(1)}
                    </div>
                    <div style={{ fontSize: '11px', color: 'var(--text3)' }}>out of 100</div>
                  </div>
                  <div style={{ background: 'var(--surface2)', borderRadius: '8px', padding: '12px' }}>
                    <div style={{ fontSize: '10px', color: 'var(--text3)', textTransform: 'uppercase', letterSpacing: '0.6px', marginBottom: '6px' }}>Default Probability</div>
                    <div style={{ fontSize: '22px', fontWeight: 600, color: result.probability_of_default > 0.5 ? '#f87171' : result.probability_of_default > 0.2 ? '#fbbf24' : '#4ade80' }}>
                      {(result.probability_of_default * 100).toFixed(2)}%
                    </div>
                    <div style={{ fontSize: '11px', color: 'var(--text3)' }}>probability</div>
                  </div>
                </div>
              </div>

              {/* SHAP */}
              <div style={{ background: 'var(--surface)', border: '1px solid var(--border)', borderRadius: '10px', padding: '20px' }}>
                <div style={{ fontSize: '13px', fontWeight: 500, marginBottom: '16px' }}>SHAP Explainability</div>
                <div style={{ fontSize: '11px', color: 'var(--text3)', marginBottom: '14px' }}>
                  Feature impact on default probability — sorted by importance
                </div>
                {result.shap_values.map((feat, i) => {
                  const maxShap = Math.max(...result.shap_values.map(f => Math.abs(f.shap_value)));
                  const width = maxShap > 0 ? Math.abs(feat.shap_value) / maxShap * 100 : 0;
                  const isPositive = feat.shap_value > 0;
                  return (
                    <div key={i} style={{ marginBottom: '10px' }}>
                      <div style={{ display: 'flex', justifyContent: 'space-between', marginBottom: '4px' }}>
                        <span style={{ fontSize: '12px', color: 'var(--text2)' }}>{feat.feature}</span>
                        <span style={{ fontSize: '11px', color: 'var(--text3)' }}>
                          {feat.value} · {isPositive ? '+' : ''}{feat.shap_value.toFixed(4)}
                        </span>
                      </div>
                      <div style={{ height: '6px', background: 'var(--surface2)', borderRadius: '3px', overflow: 'hidden' }}>
                        <div style={{
                          height: '100%', width: `${width}%`, borderRadius: '3px',
                          background: isPositive ? '#f87171' : '#4ade80',
                          transition: 'width 0.3s ease',
                        }} />
                      </div>
                    </div>
                  );
                })}
              </div>
            </div>
          ) : (
            <div style={{
              background: 'var(--surface)', border: '1px solid var(--border)',
              borderRadius: '10px', padding: '40px', textAlign: 'center',
              color: 'var(--text3)', fontSize: '13px',
            }}>
              Fill in the loan application form and click<br />
              <strong style={{ color: 'var(--text2)' }}>Analyze Credit Risk</strong> to see the prediction
            </div>
          )}
        </div>
      </div>
    </div>
  );
}
