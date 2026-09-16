'use client';

import { useState, useEffect } from 'react';
import { LineChart, Line, XAxis, YAxis, Tooltip, ResponsiveContainer, CartesianGrid } from 'recharts';

interface ModelStatus {
  model_version: string;
  status: string;
  last_trained: string;
  model_size_kb: number;
  total_predictions?: number;
  total_scored?: number;
  recent_predictions_7d?: number;
  recent_flagged_7d?: number;
  avg_probability_of_default?: number;
  avg_risk_score?: number;
  avg_fraud_score?: number;
  approval_rate?: number;
  rejection_rate?: number;
  flag_rate?: number;
  drift_indicator: string;
}

interface MonitoringData {
  credit_risk: ModelStatus;
  fraud_detection: ModelStatus;
}

export default function Monitoring() {
  const [data, setData] = useState<MonitoringData | null>(null);
  const [trend, setTrend] = useState<any>(null);
  const [auditLog, setAuditLog] = useState<any[]>([]);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    fetchAll();
  }, []);

  const fetchAll = async () => {
    setLoading(true);
    try {
      const [modelsRes, trendRes, auditRes] = await Promise.all([
        fetch('http://127.0.0.1:8000/monitoring/models'),
        fetch('http://127.0.0.1:8000/monitoring/predictions/trend'),
        fetch('http://127.0.0.1:8000/monitoring/audit-log?limit=20'),
      ]);
      setData(await modelsRes.json());
      setTrend(await trendRes.json());
      setAuditLog(await auditRes.json());
    } catch (e) {
      console.error('Failed to fetch monitoring data');
    } finally {
      setLoading(false);
    }
  };

  const StatusBadge = ({ status }: { status: string }) => (
    <div style={{
      display: 'inline-flex', alignItems: 'center', gap: '5px',
      padding: '3px 10px', borderRadius: '5px', fontSize: '11px', fontWeight: 600,
      background: status === 'healthy' ? 'rgba(74,222,128,0.12)' : 'rgba(248,113,113,0.12)',
      color: status === 'healthy' ? '#4ade80' : '#f87171',
      border: `1px solid ${status === 'healthy' ? 'rgba(74,222,128,0.3)' : 'rgba(248,113,113,0.3)'}`,
    }}>
      <div style={{ width: '5px', height: '5px', borderRadius: '50%', background: status === 'healthy' ? '#4ade80' : '#f87171' }} />
      {status.toUpperCase()}
    </div>
  );

  const DriftBadge = ({ drift }: { drift: string }) => (
    <div style={{
      display: 'inline-flex', alignItems: 'center', gap: '5px',
      padding: '3px 10px', borderRadius: '5px', fontSize: '11px', fontWeight: 600,
      background: drift === 'stable' ? 'rgba(74,222,128,0.12)' : 'rgba(251,191,36,0.12)',
      color: drift === 'stable' ? '#4ade80' : '#fbbf24',
    }}>
      {drift === 'stable' ? '✓ Stable' : '⚠ Drift Detected'}
    </div>
  );

  if (loading) return <div style={{ padding: '24px 28px', color: 'var(--text3)', fontSize: '13px' }}>Loading monitoring data...</div>;

  return (
    <div style={{ padding: '24px 28px' }}>
      <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between', marginBottom: '22px' }}>
        <div>
          <div style={{ fontSize: '18px', fontWeight: 600, letterSpacing: '-0.3px' }}>ML Model Monitoring</div>
          <div style={{ fontSize: '12px', color: 'var(--text3)', marginTop: '2px' }}>
            Model health · Prediction volume · Drift detection · Audit trail
          </div>
        </div>
        <button onClick={fetchAll} style={{
          padding: '6px 14px', borderRadius: '6px', border: '1px solid var(--border2)',
          background: 'var(--surface)', color: 'var(--text2)', fontSize: '12px', cursor: 'pointer',
        }}>↻ Refresh</button>
      </div>

      {data && (
        <>
          {/* Model cards */}
          <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: '16px', marginBottom: '16px' }}>
            {[
              { title: 'Credit Risk Model', model: data.credit_risk, icon: '⊕' },
              { title: 'Fraud Detection Model', model: data.fraud_detection, icon: '◎' },
            ].map(({ title, model, icon }) => (
              <div key={title} style={{ background: 'var(--surface)', border: '1px solid var(--border)', borderRadius: '10px', padding: '18px' }}>
                <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between', marginBottom: '14px' }}>
                  <div style={{ display: 'flex', alignItems: 'center', gap: '8px' }}>
                    <span style={{ fontSize: '16px' }}>{icon}</span>
                    <div style={{ fontSize: '13px', fontWeight: 500 }}>{title}</div>
                  </div>
                  <StatusBadge status={model.status} />
                </div>

                <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: '10px', marginBottom: '14px' }}>
                  {[
                    { label: 'Model Version', value: model.model_version },
                    { label: 'Model Size', value: `${model.model_size_kb} KB` },
                    { label: 'Total Predictions', value: (model.total_predictions || model.total_scored || 0).toLocaleString() },
                    { label: 'Last 7 Days', value: (model.recent_predictions_7d || model.recent_flagged_7d || 0).toLocaleString() },
                  ].map((item, i) => (
                    <div key={i} style={{ padding: '10px', borderRadius: '7px', background: 'var(--surface2)' }}>
                      <div style={{ fontSize: '10px', color: 'var(--text3)', marginBottom: '4px' }}>{item.label}</div>
                      <div style={{ fontSize: '13px', fontWeight: 500, color: 'var(--text)' }}>{item.value}</div>
                    </div>
                  ))}
                </div>

                {/* Model-specific metrics */}
                <div style={{ display: 'grid', gridTemplateColumns: 'repeat(3, 1fr)', gap: '8px', marginBottom: '12px' }}>
                  {model.avg_probability_of_default !== undefined ? (
                    <>
                      <div style={{ padding: '8px', borderRadius: '6px', background: 'var(--surface2)', textAlign: 'center' }}>
                        <div style={{ fontSize: '9px', color: 'var(--text3)', marginBottom: '3px' }}>Avg POD</div>
                        <div style={{ fontSize: '14px', fontWeight: 600, color: '#fbbf24' }}>{model.avg_probability_of_default}%</div>
                      </div>
                      <div style={{ padding: '8px', borderRadius: '6px', background: 'var(--surface2)', textAlign: 'center' }}>
                        <div style={{ fontSize: '9px', color: 'var(--text3)', marginBottom: '3px' }}>Approval Rate</div>
                        <div style={{ fontSize: '14px', fontWeight: 600, color: '#4ade80' }}>{model.approval_rate}%</div>
                      </div>
                      <div style={{ padding: '8px', borderRadius: '6px', background: 'var(--surface2)', textAlign: 'center' }}>
                        <div style={{ fontSize: '9px', color: 'var(--text3)', marginBottom: '3px' }}>Avg Risk Score</div>
                        <div style={{ fontSize: '14px', fontWeight: 600, color: '#f87171' }}>{model.avg_risk_score}</div>
                      </div>
                    </>
                  ) : (
                    <>
                      <div style={{ padding: '8px', borderRadius: '6px', background: 'var(--surface2)', textAlign: 'center' }}>
                        <div style={{ fontSize: '9px', color: 'var(--text3)', marginBottom: '3px' }}>Flag Rate</div>
                        <div style={{ fontSize: '14px', fontWeight: 600, color: '#f87171' }}>{model.flag_rate}%</div>
                      </div>
                      <div style={{ padding: '8px', borderRadius: '6px', background: 'var(--surface2)', textAlign: 'center' }}>
                        <div style={{ fontSize: '9px', color: 'var(--text3)', marginBottom: '3px' }}>Avg Fraud Score</div>
                        <div style={{ fontSize: '14px', fontWeight: 600, color: '#fbbf24' }}>{model.avg_fraud_score}</div>
                      </div>
                      <div style={{ padding: '8px', borderRadius: '6px', background: 'var(--surface2)', textAlign: 'center' }}>
                        <div style={{ fontSize: '9px', color: 'var(--text3)', marginBottom: '3px' }}>Recent Flagged</div>
                        <div style={{ fontSize: '14px', fontWeight: 600, color: '#f87171' }}>{model.recent_flagged_7d}</div>
                      </div>
                    </>
                  )}
                </div>

                <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between' }}>
                  <DriftBadge drift={model.drift_indicator} />
                  <div style={{ fontSize: '11px', color: 'var(--text3)' }}>
                    Last trained: {model.last_trained ? new Date(model.last_trained).toLocaleDateString() : 'N/A'}
                  </div>
                </div>
              </div>
            ))}
          </div>

          {/* Prediction trends */}
          {trend && (
            <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: '16px', marginBottom: '16px' }}>
              <div style={{ background: 'var(--surface)', border: '1px solid var(--border)', borderRadius: '10px', padding: '18px' }}>
                <div style={{ fontSize: '13px', fontWeight: 500, marginBottom: '4px' }}>Credit Risk — Prediction Volume</div>
                <div style={{ fontSize: '11px', color: 'var(--text3)', marginBottom: '14px' }}>Daily predictions and avg default probability</div>
                {trend.credit_risk.length > 0 ? (
                  <ResponsiveContainer width="100%" height={160}>
                    <LineChart data={trend.credit_risk} margin={{ top: 5, right: 10, bottom: 5, left: 10 }}>
                      <CartesianGrid strokeDasharray="3 3" stroke="var(--border)" />
                      <XAxis dataKey="date" tick={{ fontSize: 9, fill: 'var(--text3)' }} tickFormatter={v => v.slice(5)} />
                      <YAxis tick={{ fontSize: 10, fill: 'var(--text3)' }} />
                      <Tooltip contentStyle={{ background: 'var(--surface2)', border: '1px solid var(--border)', borderRadius: '6px', fontSize: '11px' }} />
                      <Line type="monotone" dataKey="predictions" stroke="#1a5fff" strokeWidth={2} dot={false} name="Predictions" />
                      <Line type="monotone" dataKey="avg_pod" stroke="#f87171" strokeWidth={1.5} dot={false} strokeDasharray="4 4" name="Avg POD %" />
                    </LineChart>
                  </ResponsiveContainer>
                ) : (
                  <div style={{ height: '160px', display: 'flex', alignItems: 'center', justifyContent: 'center', color: 'var(--text3)', fontSize: '12px' }}>
                    No recent prediction data
                  </div>
                )}
              </div>

              <div style={{ background: 'var(--surface)', border: '1px solid var(--border)', borderRadius: '10px', padding: '18px' }}>
                <div style={{ fontSize: '13px', fontWeight: 500, marginBottom: '4px' }}>Fraud Detection — Score Distribution</div>
                <div style={{ fontSize: '11px', color: 'var(--text3)', marginBottom: '14px' }}>Daily transactions scored and avg fraud score</div>
                {trend.fraud.length > 0 ? (
                  <ResponsiveContainer width="100%" height={160}>
                    <LineChart data={trend.fraud} margin={{ top: 5, right: 10, bottom: 5, left: 10 }}>
                      <CartesianGrid strokeDasharray="3 3" stroke="var(--border)" />
                      <XAxis dataKey="date" tick={{ fontSize: 9, fill: 'var(--text3)' }} tickFormatter={v => v.slice(5)} />
                      <YAxis tick={{ fontSize: 10, fill: 'var(--text3)' }} />
                      <Tooltip contentStyle={{ background: 'var(--surface2)', border: '1px solid var(--border)', borderRadius: '6px', fontSize: '11px' }} />
                      <Line type="monotone" dataKey="scored" stroke="#1a5fff" strokeWidth={2} dot={false} name="Scored" />
                      <Line type="monotone" dataKey="avg_score" stroke="#f87171" strokeWidth={1.5} dot={false} strokeDasharray="4 4" name="Avg Fraud Score" />
                    </LineChart>
                  </ResponsiveContainer>
                ) : (
                  <div style={{ height: '160px', display: 'flex', alignItems: 'center', justifyContent: 'center', color: 'var(--text3)', fontSize: '12px' }}>
                    No recent scoring data
                  </div>
                )}
              </div>
            </div>
          )}

          {/* Audit log */}
          <div style={{ background: 'var(--surface)', border: '1px solid var(--border)', borderRadius: '10px', padding: '18px' }}>
            <div style={{ fontSize: '13px', fontWeight: 500, marginBottom: '16px' }}>Audit Log</div>
            <div style={{ display: 'grid', gridTemplateColumns: '160px 140px 1fr 160px', gap: '12px', padding: '6px 0', fontSize: '10px', color: 'var(--text3)', textTransform: 'uppercase', letterSpacing: '0.5px', borderBottom: '1px solid var(--border)' }}>
              <span>Timestamp</span><span>Action</span><span>Details</span><span>Entity</span>
            </div>
            {auditLog.length === 0 ? (
              <div style={{ padding: '20px 0', color: 'var(--text3)', fontSize: '12px' }}>No audit entries yet. Make predictions to populate the log.</div>
            ) : (
              auditLog.map((log, i) => (
                <div key={log.id} style={{
                  display: 'grid', gridTemplateColumns: '160px 140px 1fr 160px',
                  gap: '12px', padding: '10px 0', fontSize: '12px',
                  borderBottom: i < auditLog.length - 1 ? '1px solid var(--border)' : 'none',
                }}>
                  <span style={{ color: 'var(--text3)', fontSize: '11px' }}>
                    {log.created_at ? new Date(log.created_at).toLocaleString() : '-'}
                  </span>
                  <span style={{
                    color: log.action === 'loan_prediction' ? '#1a5fff' : '#f87171',
                    fontWeight: 500,
                  }}>{log.action}</span>
                  <span style={{ color: 'var(--text2)' }}>
                    {log.details?.recommendation && `Recommendation: ${log.details.recommendation}`}
                    {log.details?.probability_of_default && ` · POD: ${(log.details.probability_of_default * 100).toFixed(1)}%`}
                  </span>
                  <span style={{ color: 'var(--text3)', fontSize: '11px' }}>{log.entity_type}</span>
                </div>
              ))
            )}
          </div>
        </>
      )}
    </div>
  );
}
