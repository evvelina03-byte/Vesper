'use client';

import { useState, useEffect } from 'react';

interface Transaction {
  id: string;
  transaction_number: string;
  amount: number;
  merchant: string;
  merchant_category: string;
  is_online: boolean;
  fraud_score: number;
  is_flagged: boolean;
  risk_level: string;
  anomaly_reason: string | null;
  timestamp: string;
}

interface FraudResponse {
  fraud_score: number;
  is_flagged: boolean;
  risk_level: string;
  anomaly_reason: string | null;
}

const defaultForm = {
  amount: '1200',
  merchant_category: 'retail',
  merchant_name: 'Amazon',
  is_online: true,
  account_age_days: '365',
};

const categories = ['retail', 'food', 'travel', 'electronics', 'crypto', 'wire_transfer'];

export default function FraudDetection() {
  const [form, setForm] = useState(defaultForm);
  const [result, setResult] = useState<FraudResponse | null>(null);
  const [feed, setFeed] = useState<Transaction[]>([]);
  const [loading, setLoading] = useState(false);
  const [feedLoading, setFeedLoading] = useState(true);

  useEffect(() => {
    fetchFeed();
    const interval = setInterval(fetchFeed, 10000);
    return () => clearInterval(interval);
  }, []);

  const fetchFeed = async () => {
    try {
      const res = await fetch('http://127.0.0.1:8000/fraud/feed?limit=15');
      const data = await res.json();
      setFeed(data);
    } catch (e) {
      console.error('Failed to fetch feed');
    } finally {
      setFeedLoading(false);
    }
  };

  const handleScore = async () => {
    setLoading(true);
    try {
      const res = await fetch('http://127.0.0.1:8000/fraud/score', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          amount: parseFloat(form.amount) || 0,
          merchant_category: form.merchant_category,
          merchant_name: form.merchant_name,
          is_online: form.is_online,
          account_age_days: parseInt(form.account_age_days) || 365,
        }),
      });
      const data = await res.json();
      setResult(data);
      fetchFeed();
    } catch (e) {
      console.error('Failed to score transaction');
    } finally {
      setLoading(false);
    }
  };

  const getRiskColor = (level: string) => {
    if (level === 'CRITICAL') return '#f87171';
    if (level === 'HIGH') return '#f87171';
    if (level === 'MEDIUM') return '#fbbf24';
    return '#4ade80';
  };

  const getScoreBar = (score: number) => {
    const color = score > 0.7 ? '#f87171' : score > 0.4 ? '#fbbf24' : '#4ade80';
    return (
      <div style={{ display: 'flex', alignItems: 'center', gap: '8px' }}>
        <div style={{ flex: 1, height: '4px', background: 'var(--surface2)', borderRadius: '2px', overflow: 'hidden' }}>
          <div style={{ height: '100%', width: `${score * 100}%`, background: color, borderRadius: '2px' }} />
        </div>
        <span style={{ fontSize: '11px', color, fontWeight: 600, minWidth: '36px' }}>
          {(score * 100).toFixed(0)}%
        </span>
      </div>
    );
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
        <div style={{ fontSize: '18px', fontWeight: 600, letterSpacing: '-0.3px' }}>Fraud Detection</div>
        <div style={{ fontSize: '12px', color: 'var(--text3)', marginTop: '2px' }}>
          XGBoost classifier · Isolation Forest · Real-time scoring · Auto-refresh every 10s
        </div>
      </div>

      <div style={{ display: 'grid', gridTemplateColumns: '320px 1fr', gap: '16px' }}>
        {/* Score form */}
        <div style={{ display: 'flex', flexDirection: 'column', gap: '14px' }}>
          <div style={{ background: 'var(--surface)', border: '1px solid var(--border)', borderRadius: '10px', padding: '18px' }}>
            <div style={{ fontSize: '13px', fontWeight: 500, marginBottom: '16px' }}>Score Transaction</div>

            <div style={{ display: 'flex', flexDirection: 'column', gap: '12px' }}>
              <div>
                <label style={labelStyle}>Amount ($)</label>
                <input type="text" inputMode="decimal" value={form.amount}
                  onChange={e => setForm({ ...form, amount: e.target.value })} style={inputStyle} />
              </div>
              <div>
                <label style={labelStyle}>Merchant Category</label>
                <select value={form.merchant_category}
                  onChange={e => setForm({ ...form, merchant_category: e.target.value })} style={inputStyle}>
                  {categories.map(c => <option key={c} value={c}>{c}</option>)}
                </select>
              </div>
              <div>
                <label style={labelStyle}>Merchant Name</label>
                <input type="text" value={form.merchant_name}
                  onChange={e => setForm({ ...form, merchant_name: e.target.value })} style={inputStyle} />
              </div>
              <div>
                <label style={labelStyle}>Account Age (days)</label>
                <input type="text" inputMode="numeric" value={form.account_age_days}
                  onChange={e => setForm({ ...form, account_age_days: e.target.value })} style={inputStyle} />
              </div>
              <div style={{ display: 'flex', alignItems: 'center', gap: '8px' }}>
                <input type="checkbox" id="online" checked={form.is_online}
                  onChange={e => setForm({ ...form, is_online: e.target.checked })} />
                <label htmlFor="online" style={{ fontSize: '13px', color: 'var(--text2)', cursor: 'pointer' }}>
                  Online Transaction
                </label>
              </div>
            </div>

            <button onClick={handleScore} disabled={loading} style={{
              width: '100%', marginTop: '16px', padding: '10px', borderRadius: '7px',
              border: 'none', cursor: loading ? 'not-allowed' : 'pointer',
              background: loading ? 'var(--border2)' : 'var(--blue)',
              color: '#fff', fontSize: '13px', fontWeight: 500,
            }}>
              {loading ? 'Scoring...' : 'Score Transaction'}
            </button>
          </div>

          {/* Result */}
          {result && (
            <div style={{ background: 'var(--surface)', border: `1px solid ${result.is_flagged ? 'rgba(220,38,38,0.4)' : 'var(--border)'}`, borderRadius: '10px', padding: '18px' }}>
              <div style={{ fontSize: '13px', fontWeight: 500, marginBottom: '14px' }}>Result</div>
              <div style={{ display: 'flex', alignItems: 'center', gap: '10px', marginBottom: '14px' }}>
                <div style={{
                  padding: '4px 12px', borderRadius: '6px', fontSize: '12px', fontWeight: 600,
                  background: result.is_flagged ? 'rgba(220,38,38,0.12)' : 'rgba(22,163,74,0.12)',
                  color: result.is_flagged ? '#f87171' : '#4ade80',
                  border: `1px solid ${result.is_flagged ? 'rgba(220,38,38,0.3)' : 'rgba(22,163,74,0.3)'}`,
                }}>
                  {result.is_flagged ? '⚠ FLAGGED' : '✓ CLEAR'}
                </div>
                <span style={{ fontSize: '12px', color: getRiskColor(result.risk_level), fontWeight: 500 }}>
                  {result.risk_level} RISK
                </span>
              </div>
              <div style={{ marginBottom: '10px' }}>
                <div style={{ fontSize: '11px', color: 'var(--text3)', marginBottom: '6px' }}>Fraud Score</div>
                {getScoreBar(result.fraud_score)}
              </div>
              {result.anomaly_reason && (
                <div style={{ padding: '8px 10px', borderRadius: '6px', background: 'rgba(220,38,38,0.08)', fontSize: '11px', color: '#f87171' }}>
                  {result.anomaly_reason}
                </div>
              )}
            </div>
          )}
        </div>

        {/* Transaction feed */}
        <div style={{ background: 'var(--surface)', border: '1px solid var(--border)', borderRadius: '10px', padding: '18px' }}>
          <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between', marginBottom: '16px' }}>
            <div style={{ fontSize: '13px', fontWeight: 500 }}>Transaction Feed</div>
            <div style={{ fontSize: '11px', color: 'var(--text3)' }}>Auto-refresh · 10s</div>
          </div>

          {feedLoading ? (
            <div style={{ color: 'var(--text3)', fontSize: '13px' }}>Loading...</div>
          ) : (
            <div style={{ display: 'flex', flexDirection: 'column', gap: '0' }}>
              {/* Header */}
              <div style={{ display: 'grid', gridTemplateColumns: '80px 1fr 100px 120px 80px', gap: '12px', padding: '6px 8px', fontSize: '10px', color: 'var(--text3)', textTransform: 'uppercase', letterSpacing: '0.6px', borderBottom: '1px solid var(--border)' }}>
                <span>ID</span><span>Merchant</span><span>Amount</span><span>Fraud Score</span><span>Status</span>
              </div>
              {feed.map((txn, i) => (
                <div key={txn.id} style={{
                  display: 'grid', gridTemplateColumns: '80px 1fr 100px 120px 80px',
                  gap: '12px', padding: '10px 8px', fontSize: '12px',
                  borderBottom: i < feed.length - 1 ? '1px solid var(--border)' : 'none',
                  background: txn.is_flagged ? 'rgba(220,38,38,0.04)' : 'transparent',
                }}>
                  <span style={{ color: 'var(--text3)', fontFamily: 'monospace' }}>{txn.id}</span>
                  <div>
                    <div style={{ color: 'var(--text)' }}>{txn.merchant}</div>
                    <div style={{ fontSize: '10px', color: 'var(--text3)' }}>{txn.merchant_category} · {txn.is_online ? 'Online' : 'In-store'}</div>
                  </div>
                  <span style={{ color: 'var(--text2)' }}>${txn.amount.toLocaleString()}</span>
                  <div>{txn.fraud_score !== null ? getScoreBar(txn.fraud_score) : '-'}</div>
                  <div style={{
                    fontSize: '10px', fontWeight: 600,
                    color: txn.is_flagged ? '#f87171' : '#4ade80',
                  }}>
                    {txn.is_flagged ? '⚠ FLAGGED' : '✓ CLEAR'}
                  </div>
                </div>
              ))}
            </div>
          )}
        </div>
      </div>
    </div>
  );
}
