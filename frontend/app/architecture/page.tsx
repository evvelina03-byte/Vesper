'use client';

export default function Architecture() {
  const stack = [
    {
      layer: 'Frontend',
      color: '#1a5fff',
      items: ['Next.js 14 (App Router)', 'TypeScript', 'Tailwind CSS', 'Recharts / Plotly'],
    },
    {
      layer: 'Backend',
      color: '#4ade80',
      items: ['FastAPI', 'Python 3.11', 'SQLAlchemy ORM', 'Pydantic v2'],
    },
    {
      layer: 'Database',
      color: '#fbbf24',
      items: ['PostgreSQL 15', 'UUID primary keys', 'JSONB for holdings', 'Audit logging'],
    },
    {
      layer: 'Machine Learning',
      color: '#a78bfa',
      items: ['XGBoost', 'scikit-learn', 'SHAP (explainability)', 'Isolation Forest'],
    },
    {
      layer: 'Quantitative Finance',
      color: '#f87171',
      items: ['scipy (optimization)', 'Black-Scholes', 'Mean-variance', 'yfinance (market data)'],
    },
    {
      layer: 'AI / LLM',
      color: '#34d399',
      items: ['Google Gemini 2.0', 'RAG pipeline', 'PDF parsing (PyPDF2)', 'Semantic chunking'],
    },
    {
      layer: 'Infrastructure',
      color: '#fb923c',
      items: ['Docker', 'GitHub Actions (CI/CD)', 'Vercel (frontend)', 'Railway (backend)'],
    },
  ];

  const modules = [
    { name: 'Dashboard', desc: 'Live KPIs, fraud alerts, AI insights', color: '#1a5fff' },
    { name: 'Credit Risk', desc: 'XGBoost + SHAP explainability', color: '#4ade80' },
    { name: 'Fraud Detection', desc: 'Real-time scoring, AUC 0.9943', color: '#f87171' },
    { name: 'Portfolio', desc: 'CVaR, Sortino, benchmark vs SPY', color: '#4ade80' },
    { name: 'Options', desc: 'Black-Scholes, Greeks, vol smile', color: '#a78bfa' },
    { name: 'Backtesting', desc: 'Transaction costs, Calmar, Profit Factor', color: '#fbbf24' },
    { name: 'Valuation', desc: 'DCF model, multiples, real financials', color: '#1a5fff' },
    { name: 'Simulator', desc: 'Macro stress testing, 5 presets', color: '#fb923c' },
    { name: 'AI Assistant', desc: 'RAG over financial documents', color: '#34d399' },
    { name: 'Markets', desc: 'Live indices, forex, sectors', color: '#1a5fff' },
    { name: 'Intelligence', desc: 'BI dashboard, segmentation, insights', color: '#fbbf24' },
    { name: 'ML Monitoring', desc: 'Model health, drift, audit log', color: '#a78bfa' },
  ];

  const dataFlow = [
    { from: 'User', to: 'Next.js Frontend', desc: 'HTTPS' },
    { from: 'Next.js Frontend', to: 'FastAPI Backend', desc: 'REST API' },
    { from: 'FastAPI Backend', to: 'PostgreSQL', desc: 'SQLAlchemy' },
    { from: 'FastAPI Backend', to: 'ML Models', desc: 'pickle / inference' },
    { from: 'FastAPI Backend', to: 'Yahoo Finance', desc: 'yfinance' },
    { from: 'FastAPI Backend', to: 'Gemini API', desc: 'google-genai' },
    { from: 'ML Models', to: 'SHAP Explainer', desc: 'TreeExplainer' },
  ];

  return (
    <div style={{ padding: '24px 28px' }}>
      <div style={{ marginBottom: '24px' }}>
        <div style={{ fontSize: '18px', fontWeight: 600, letterSpacing: '-0.3px' }}>System Architecture</div>
        <div style={{ fontSize: '12px', color: 'var(--text3)', marginTop: '2px' }}>
          Full-stack AI financial intelligence platform · 12 modules · 7 technology layers
        </div>
      </div>

      {/* Architecture diagram */}
      <div style={{ background: 'var(--surface)', border: '1px solid var(--border)', borderRadius: '10px', padding: '24px', marginBottom: '16px' }}>
        <div style={{ fontSize: '13px', fontWeight: 500, marginBottom: '20px' }}>System Overview</div>

        {/* Flow diagram */}
        <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'center', gap: '0', marginBottom: '28px', flexWrap: 'wrap' }}>
          {[
            { label: 'Browser', sub: 'User', color: '#1a5fff', bg: 'rgba(26,95,255,0.1)' },
            { label: '→', color: 'var(--text3)', bg: 'transparent', sub: '' },
            { label: 'Next.js', sub: 'Frontend', color: '#1a5fff', bg: 'rgba(26,95,255,0.1)' },
            { label: '→', color: 'var(--text3)', bg: 'transparent', sub: '' },
            { label: 'FastAPI', sub: 'Backend', color: '#4ade80', bg: 'rgba(74,222,128,0.1)' },
            { label: '→', color: 'var(--text3)', bg: 'transparent', sub: '' },
            { label: 'PostgreSQL', sub: 'Database', color: '#fbbf24', bg: 'rgba(251,191,36,0.1)' },
          ].map((item, i) => (
            item.label === '→' ? (
              <div key={i} style={{ fontSize: '20px', color: 'var(--text3)', padding: '0 8px' }}>→</div>
            ) : (
              <div key={i} style={{
                padding: '12px 16px', borderRadius: '8px', textAlign: 'center',
                background: item.bg, border: `1px solid ${item.color}40`,
                minWidth: '100px',
              }}>
                <div style={{ fontSize: '13px', fontWeight: 600, color: item.color }}>{item.label}</div>
                <div style={{ fontSize: '10px', color: 'var(--text3)', marginTop: '2px' }}>{item.sub}</div>
              </div>
            )
          ))}
        </div>

        {/* External services */}
        <div style={{ display: 'flex', justifyContent: 'center', gap: '12px', marginBottom: '8px' }}>
          <div style={{ fontSize: '11px', color: 'var(--text3)', textAlign: 'center' }}>FastAPI also connects to:</div>
        </div>
        <div style={{ display: 'flex', justifyContent: 'center', gap: '12px' }}>
          {[
            { label: 'ML Models', sub: 'XGBoost · SHAP', color: '#a78bfa' },
            { label: 'Yahoo Finance', sub: 'Market data', color: '#fbbf24' },
            { label: 'Gemini API', sub: 'AI / RAG', color: '#34d399' },
          ].map((item, i) => (
            <div key={i} style={{
              padding: '10px 16px', borderRadius: '8px', textAlign: 'center',
              background: `${item.color}15`, border: `1px solid ${item.color}40`,
              minWidth: '120px',
            }}>
              <div style={{ fontSize: '12px', fontWeight: 600, color: item.color }}>{item.label}</div>
              <div style={{ fontSize: '10px', color: 'var(--text3)', marginTop: '2px' }}>{item.sub}</div>
            </div>
          ))}
        </div>
      </div>

      {/* Modules grid */}
      <div style={{ background: 'var(--surface)', border: '1px solid var(--border)', borderRadius: '10px', padding: '20px', marginBottom: '16px' }}>
        <div style={{ fontSize: '13px', fontWeight: 500, marginBottom: '16px' }}>12 Modules</div>
        <div style={{ display: 'grid', gridTemplateColumns: 'repeat(4, 1fr)', gap: '10px' }}>
          {modules.map((mod, i) => (
            <div key={i} style={{
              padding: '12px 14px', borderRadius: '8px',
              background: 'var(--surface2)', border: `1px solid ${mod.color}30`,
            }}>
              <div style={{ fontSize: '12px', fontWeight: 600, color: mod.color, marginBottom: '4px' }}>{mod.name}</div>
              <div style={{ fontSize: '11px', color: 'var(--text3)' }}>{mod.desc}</div>
            </div>
          ))}
        </div>
      </div>

      {/* Tech stack */}
      <div style={{ background: 'var(--surface)', border: '1px solid var(--border)', borderRadius: '10px', padding: '20px', marginBottom: '16px' }}>
        <div style={{ fontSize: '13px', fontWeight: 500, marginBottom: '16px' }}>Technology Stack</div>
        <div style={{ display: 'grid', gridTemplateColumns: 'repeat(4, 1fr)', gap: '12px' }}>
          {stack.map((layer, i) => (
            <div key={i} style={{ padding: '14px', borderRadius: '8px', background: 'var(--surface2)', border: `1px solid ${layer.color}30` }}>
              <div style={{ fontSize: '11px', fontWeight: 700, color: layer.color, textTransform: 'uppercase', letterSpacing: '0.6px', marginBottom: '10px' }}>
                {layer.layer}
              </div>
              {layer.items.map((item, j) => (
                <div key={j} style={{ fontSize: '11px', color: 'var(--text2)', marginBottom: '4px', display: 'flex', alignItems: 'center', gap: '5px' }}>
                  <div style={{ width: '4px', height: '4px', borderRadius: '50%', background: layer.color, flexShrink: 0 }} />
                  {item}
                </div>
              ))}
            </div>
          ))}
        </div>
      </div>

      {/* Database schema */}
      <div style={{ background: 'var(--surface)', border: '1px solid var(--border)', borderRadius: '10px', padding: '20px' }}>
        <div style={{ fontSize: '13px', fontWeight: 500, marginBottom: '16px' }}>Database Schema</div>
        <div style={{ display: 'grid', gridTemplateColumns: 'repeat(4, 1fr)', gap: '10px' }}>
          {[
            { table: 'users', fields: ['id (UUID)', 'email', 'hashed_password', 'role', 'created_at'], color: '#1a5fff' },
            { table: 'customers', fields: ['id (UUID)', 'customer_number', 'segment', 'region', 'account_age_days'], color: '#4ade80' },
            { table: 'loan_applications', fields: ['id (UUID)', 'customer_id (FK)', 'credit_score', 'probability_of_default', 'recommendation'], color: '#fbbf24' },
            { table: 'transactions', fields: ['id (UUID)', 'customer_id (FK)', 'amount', 'fraud_score', 'is_flagged'], color: '#f87171' },
            { table: 'portfolios', fields: ['id (UUID)', 'user_id (FK)', 'holdings (JSONB)', 'sharpe_ratio', 'var_95'], color: '#a78bfa' },
            { table: 'documents', fields: ['id (UUID)', 'user_id (FK)', 'filename', 'vector_store_id', 'is_processed'], color: '#34d399' },
            { table: 'audit_logs', fields: ['id (UUID)', 'user_id (FK)', 'action', 'entity_type', 'details (JSONB)'], color: '#fb923c' },
          ].map((t, i) => (
            <div key={i} style={{ padding: '12px', borderRadius: '8px', background: 'var(--surface2)', border: `1px solid ${t.color}30` }}>
              <div style={{ fontSize: '11px', fontWeight: 700, color: t.color, marginBottom: '8px', fontFamily: 'monospace' }}>{t.table}</div>
              {t.fields.map((f, j) => (
                <div key={j} style={{ fontSize: '10px', color: 'var(--text3)', marginBottom: '3px', fontFamily: 'monospace' }}>{f}</div>
              ))}
            </div>
          ))}
        </div>
      </div>
    </div>
  );
}
