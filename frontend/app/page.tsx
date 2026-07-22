export default function Dashboard() {
  const kpis = [
    { label: 'Total Assets', value: '$4.82B', change: '+2.4% vs last month', up: true },
    { label: 'Loan Portfolio', value: '$1.23B', change: '+$84M this quarter', up: true },
    { label: 'Default Rate', value: '3.2%', change: '+0.4pp vs prior year', up: false },
    { label: 'Portfolio Return', value: '+11.7%', change: 'Sharpe ratio 1.42', up: true },
    { label: 'Fraud Alerts', value: '3', change: '2 high severity', up: false },
    { label: 'Customer Growth', value: '+1,240', change: '+8.3% MoM', up: true },
    { label: 'Revenue (YTD)', value: '$48.2M', change: '+14.1% YoY', up: true },
    { label: 'Portfolio VaR', value: '$2.1M', change: '95% confidence, 1-day', up: null },
  ];

  const alerts = [
    { id: 'TX-48291', amount: '$12,400', merchant: 'ElectroMart', score: 0.97, high: true },
    { id: 'TX-48104', amount: '$8,750', merchant: 'CryptoExchange', score: 0.94, high: true },
    { id: 'TX-47880', amount: '$3,200', merchant: 'IntlWireTransfer', score: 0.71, high: false },
  ];

  const insights = [
    { color: 'var(--red)', title: 'Default risk rising in Segment B.', body: 'Loan defaults increased 18% among 25–34 customers following the May rate hike.', label: 'Credit Risk · High priority' },
    { color: 'var(--amber)', title: 'Region A acquisition cost exceeds LTV.', body: 'CAC of $340 vs 12-month LTV of $290. Current marketing spend is net-negative.', label: 'Business Intelligence · Medium priority' },
    { color: 'var(--green)', title: 'Portfolio Sharpe improved 0.31 points', body: 'After Q2 rebalancing away from energy. Tech + healthcare now exceeds benchmark by 12pp.', label: 'Portfolio Analytics · Positive signal' },
  ];

  return (
    <div style={{ padding: '24px 28px' }}>
      {/* Topbar */}
      <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between', marginBottom: '22px' }}>
        <div>
          <div style={{ fontSize: '18px', fontWeight: 600, letterSpacing: '-0.3px' }}>Executive Dashboard</div>
          <div style={{ fontSize: '12px', color: 'var(--text3)', marginTop: '2px' }}>Live overview · Last updated 14:23 UTC</div>
        </div>
        <div style={{ display: 'flex', gap: '8px', alignItems: 'center' }}>
          <div style={{
            display: 'flex', alignItems: 'center', gap: '5px',
            padding: '5px 11px', borderRadius: '6px', fontSize: '12px', fontWeight: 500,
            background: 'rgba(220,38,38,0.1)', color: '#f87171',
            border: '1px solid rgba(220,38,38,0.2)',
          }}>⚠ 3 fraud alerts</div>
          <button style={{
            padding: '6px 12px', borderRadius: '6px', fontSize: '12px',
            border: '1px solid var(--border2)', background: 'var(--surface)',
            color: 'var(--text2)', cursor: 'pointer',
          }}>↓ Export PDF</button>
        </div>
      </div>

      {/* KPI Grid */}
      <div style={{ display: 'grid', gridTemplateColumns: 'repeat(4, 1fr)', gap: '12px', marginBottom: '16px' }}>
        {kpis.map((kpi, i) => (
          <div key={i} style={{
            background: 'var(--surface)', border: '1px solid var(--border)',
            borderRadius: '10px', padding: '16px 18px',
          }}>
            <div style={{ fontSize: '10px', color: 'var(--text3)', textTransform: 'uppercase', letterSpacing: '0.7px', marginBottom: '10px' }}>
              {kpi.label}
            </div>
            <div style={{ fontSize: '24px', fontWeight: 600, letterSpacing: '-0.8px' }}>{kpi.value}</div>
            <div style={{
              fontSize: '11px', marginTop: '6px',
              color: kpi.up === null ? 'var(--text3)' : kpi.up ? '#4ade80' : '#f87171',
            }}>
              {kpi.up === true ? '↑' : kpi.up === false ? '↓' : ''} {kpi.change}
            </div>
          </div>
        ))}
      </div>

      {/* Bottom Row */}
      <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: '12px' }}>
        {/* Fraud Alerts */}
        <div style={{ background: 'var(--surface)', border: '1px solid var(--border)', borderRadius: '10px', padding: '18px' }}>
          <div style={{ fontSize: '13px', fontWeight: 500, marginBottom: '16px' }}>Fraud Alerts</div>
          {alerts.map((alert, i) => (
            <div key={i} style={{
              display: 'flex', alignItems: 'flex-start', gap: '10px',
              padding: '11px 0', borderBottom: i < alerts.length - 1 ? '1px solid var(--border)' : 'none',
            }}>
              <div style={{
                width: '30px', height: '30px', borderRadius: '7px', flexShrink: 0,
                display: 'flex', alignItems: 'center', justifyContent: 'center', fontSize: '14px',
                background: alert.high ? 'rgba(220,38,38,0.1)' : 'rgba(217,119,6,0.1)',
                color: alert.high ? '#f87171' : '#fbbf24',
              }}>⚠</div>
              <div style={{ flex: 1 }}>
                <div style={{ fontSize: '12px', fontWeight: 500 }}>Transaction #{alert.id}</div>
                <div style={{ fontSize: '11px', color: 'var(--text3)', marginTop: '2px' }}>{alert.amount} · {alert.merchant}</div>
              </div>
              <div style={{
                fontSize: '11px', fontWeight: 600, padding: '2px 8px', borderRadius: '5px', flexShrink: 0,
                background: alert.high ? 'rgba(220,38,38,0.12)' : 'rgba(217,119,6,0.12)',
                color: alert.high ? '#f87171' : '#fbbf24',
              }}>{alert.score}</div>
            </div>
          ))}
        </div>

        {/* AI Insights */}
        <div style={{ background: 'var(--surface)', border: '1px solid var(--border)', borderRadius: '10px', padding: '18px' }}>
          <div style={{ fontSize: '13px', fontWeight: 500, marginBottom: '16px' }}>AI Business Insights</div>
          {insights.map((insight, i) => (
            <div key={i} style={{
              display: 'flex', gap: '11px',
              padding: '11px 0', borderBottom: i < insights.length - 1 ? '1px solid var(--border)' : 'none',
            }}>
              <div style={{ width: '3px', borderRadius: '2px', flexShrink: 0, background: insight.color, minHeight: '52px' }} />
              <div>
                <div style={{ fontSize: '12px', color: 'var(--text)', lineHeight: 1.55 }}>
                  <strong>{insight.title}</strong> {insight.body}
                </div>
                <div style={{ fontSize: '10px', color: 'var(--text3)', marginTop: '4px' }}>{insight.label}</div>
              </div>
            </div>
          ))}
        </div>
      </div>
    </div>
  );
}
