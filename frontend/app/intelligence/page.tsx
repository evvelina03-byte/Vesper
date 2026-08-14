'use client';

import { useState, useEffect } from 'react';
import { BarChart, Bar, XAxis, YAxis, Tooltip, ResponsiveContainer, CartesianGrid, LineChart, Line, PieChart, Pie, Cell } from 'recharts';

const COLORS = ['#1a5fff', '#4ade80', '#f87171', '#fbbf24', '#a78bfa'];

export default function Intelligence() {
  const [overview, setOverview] = useState<any>(null);
  const [segments, setSegments] = useState<any[]>([]);
  const [regions, setRegions] = useState<any[]>([]);
  const [revenue, setRevenue] = useState<any[]>([]);
  const [insights, setInsights] = useState<any[]>([]);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    fetchAll();
  }, []);

  const fetchAll = async () => {
    setLoading(true);
    try {
      const [ovRes, segRes, regRes, revRes, insRes] = await Promise.all([
        fetch('http://127.0.0.1:8000/intelligence/overview'),
        fetch('http://127.0.0.1:8000/intelligence/segments'),
        fetch('http://127.0.0.1:8000/intelligence/regions'),
        fetch('http://127.0.0.1:8000/intelligence/revenue-trend'),
        fetch('http://127.0.0.1:8000/intelligence/insights'),
      ]);
      setOverview(await ovRes.json());
      setSegments(await segRes.json());
      setRegions(await regRes.json());
      setRevenue(await revRes.json());
      setInsights(await insRes.json());
    } catch (e) {
      console.error('Failed to fetch intelligence data');
    } finally {
      setLoading(false);
    }
  };

  if (loading) return (
    <div style={{ padding: '24px 28px', color: 'var(--text3)', fontSize: '13px' }}>
      Loading intelligence data...
    </div>
  );

  return (
    <div style={{ padding: '24px 28px' }}>
      <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between', marginBottom: '22px' }}>
        <div>
          <div style={{ fontSize: '18px', fontWeight: 600, letterSpacing: '-0.3px' }}>Executive Intelligence</div>
          <div style={{ fontSize: '12px', color: 'var(--text3)', marginTop: '2px' }}>
            Customer segmentation · Revenue trends · Regional analysis · AI insights
          </div>
        </div>
        <button onClick={fetchAll} style={{
          padding: '6px 14px', borderRadius: '6px', border: '1px solid var(--border2)',
          background: 'var(--surface)', color: 'var(--text2)', fontSize: '12px', cursor: 'pointer',
        }}>↻ Refresh</button>
      </div>

      {/* KPIs */}
      {overview && (
        <div style={{ display: 'grid', gridTemplateColumns: 'repeat(4, 1fr)', gap: '12px', marginBottom: '16px' }}>
          {[
            { label: 'Total Customers', value: overview.total_customers.toLocaleString(), sub: `${overview.active_customers} active` },
            { label: 'Approval Rate', value: `${overview.approval_rate}%`, sub: `${overview.rejection_rate}% rejected`, color: '#4ade80' },
            { label: 'Avg Default Risk', value: `${overview.avg_default_probability}%`, sub: 'across all loans', color: overview.avg_default_probability > 30 ? '#f87171' : '#fbbf24' },
            { label: 'Fraud Rate', value: `${overview.fraud_rate}%`, sub: 'of all transactions', color: overview.fraud_rate > 20 ? '#f87171' : '#fbbf24' },
          ].map((kpi, i) => (
            <div key={i} style={{ background: 'var(--surface)', border: '1px solid var(--border)', borderRadius: '10px', padding: '16px 18px' }}>
              <div style={{ fontSize: '10px', color: 'var(--text3)', textTransform: 'uppercase', letterSpacing: '0.7px', marginBottom: '8px' }}>{kpi.label}</div>
              <div style={{ fontSize: '22px', fontWeight: 600, color: kpi.color || 'var(--text)' }}>{kpi.value}</div>
              <div style={{ fontSize: '11px', color: 'var(--text3)', marginTop: '4px' }}>{kpi.sub}</div>
            </div>
          ))}
        </div>
      )}

      {/* Revenue trend */}
      <div style={{ background: 'var(--surface)', border: '1px solid var(--border)', borderRadius: '10px', padding: '18px', marginBottom: '16px' }}>
        <div style={{ fontSize: '13px', fontWeight: 500, marginBottom: '4px' }}>Revenue Trend</div>
        <div style={{ fontSize: '11px', color: 'var(--text3)', marginBottom: '14px' }}>Monthly revenue breakdown — loans vs fees</div>
        <ResponsiveContainer width="100%" height={200}>
          <BarChart data={revenue} margin={{ top: 5, right: 10, bottom: 5, left: 20 }}>
            <CartesianGrid strokeDasharray="3 3" stroke="var(--border)" />
            <XAxis dataKey="month" tick={{ fontSize: 10, fill: 'var(--text3)' }} />
            <YAxis tick={{ fontSize: 10, fill: 'var(--text3)' }} tickFormatter={v => `$${(v/1000000).toFixed(1)}M`} />
            <Tooltip
              contentStyle={{ background: 'var(--surface2)', border: '1px solid var(--border)', borderRadius: '6px', fontSize: '11px' }}
              formatter={(v: any) => [`$${(v/1000000).toFixed(2)}M`]}
            />
            <Bar dataKey="loans" fill="#1a5fff" opacity={0.8} name="Loans" radius={[3,3,0,0]} />
            <Bar dataKey="fees" fill="#4ade80" opacity={0.8} name="Fees" radius={[3,3,0,0]} />
          </BarChart>
        </ResponsiveContainer>
      </div>

      <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: '16px', marginBottom: '16px' }}>
        {/* Customer segments */}
        <div style={{ background: 'var(--surface)', border: '1px solid var(--border)', borderRadius: '10px', padding: '18px' }}>
          <div style={{ fontSize: '13px', fontWeight: 500, marginBottom: '4px' }}>Customer Segments</div>
          <div style={{ fontSize: '11px', color: 'var(--text3)', marginBottom: '14px' }}>Distribution and default risk by segment</div>
          <div style={{ display: 'flex', gap: '16px', alignItems: 'center' }}>
            <PieChart width={140} height={140}>
              <Pie data={segments} dataKey="customers" nameKey="segment" cx="50%" cy="50%" outerRadius={60} innerRadius={30}>
                {segments.map((_, i) => <Cell key={i} fill={COLORS[i % COLORS.length]} />)}
              </Pie>
              <Tooltip contentStyle={{ background: 'var(--surface2)', border: '1px solid var(--border)', borderRadius: '6px', fontSize: '11px' }} />
            </PieChart>
            <div style={{ flex: 1 }}>
              {segments.map((seg, i) => (
                <div key={seg.segment} style={{ marginBottom: '10px' }}>
                  <div style={{ display: 'flex', justifyContent: 'space-between', marginBottom: '3px' }}>
                    <span style={{ fontSize: '12px', color: COLORS[i % COLORS.length], fontWeight: 500 }}>{seg.segment}</span>
                    <span style={{ fontSize: '11px', color: 'var(--text3)' }}>{seg.customers} customers</span>
                  </div>
                  <div style={{ fontSize: '10px', color: 'var(--text3)' }}>
                    Avg loan: ${seg.avg_loan_amount.toLocaleString()} · Default: {seg.avg_default_rate}%
                  </div>
                </div>
              ))}
            </div>
          </div>
        </div>

        {/* Regional analysis */}
        <div style={{ background: 'var(--surface)', border: '1px solid var(--border)', borderRadius: '10px', padding: '18px' }}>
          <div style={{ fontSize: '13px', fontWeight: 500, marginBottom: '4px' }}>Regional Analysis</div>
          <div style={{ fontSize: '11px', color: 'var(--text3)', marginBottom: '14px' }}>Performance metrics by region</div>
          <div style={{ display: 'flex', flexDirection: 'column', gap: '0' }}>
            <div style={{ display: 'grid', gridTemplateColumns: '1fr 80px 80px 80px', gap: '8px', padding: '6px 0', fontSize: '10px', color: 'var(--text3)', textTransform: 'uppercase', letterSpacing: '0.5px', borderBottom: '1px solid var(--border)' }}>
              <span>Region</span><span>Customers</span><span>Default %</span><span>Fraud</span>
            </div>
            {regions.map((r, i) => (
              <div key={r.region} style={{ display: 'grid', gridTemplateColumns: '1fr 80px 80px 80px', gap: '8px', padding: '10px 0', fontSize: '12px', borderBottom: i < regions.length - 1 ? '1px solid var(--border)' : 'none' }}>
                <span style={{ color: 'var(--text)', fontWeight: 500 }}>{r.region}</span>
                <span style={{ color: 'var(--text2)' }}>{r.customers}</span>
                <span style={{ color: r.avg_default_rate > 30 ? '#f87171' : '#4ade80' }}>{r.avg_default_rate}%</span>
                <span style={{ color: r.fraud_alerts > 10 ? '#f87171' : 'var(--text2)' }}>{r.fraud_alerts}</span>
              </div>
            ))}
          </div>
        </div>
      </div>

      {/* AI Insights */}
      <div style={{ background: 'var(--surface)', border: '1px solid var(--border)', borderRadius: '10px', padding: '18px' }}>
        <div style={{ fontSize: '13px', fontWeight: 500, marginBottom: '16px' }}>AI Business Insights</div>
        <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr 1fr', gap: '12px' }}>
          {insights.map((insight, i) => (
            <div key={i} style={{ display: 'flex', gap: '10px', padding: '12px', borderRadius: '8px', background: 'var(--surface2)' }}>
              <div style={{ width: '3px', borderRadius: '2px', flexShrink: 0, background: insight.color, alignSelf: 'stretch' }} />
              <div>
                <div style={{ fontSize: '12px', fontWeight: 500, color: 'var(--text)', marginBottom: '4px' }}>{insight.title}</div>
                <div style={{ fontSize: '11px', color: 'var(--text2)', lineHeight: 1.5 }}>{insight.body}</div>
                <div style={{ fontSize: '10px', color: 'var(--text3)', marginTop: '6px' }}>{insight.label}</div>
              </div>
            </div>
          ))}
        </div>
      </div>
    </div>
  );
}
