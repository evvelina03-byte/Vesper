const API_URL = 'http://127.0.0.1:8000';

export async function getDashboardSummary() {
  const res = await fetch(`${API_URL}/dashboard/summary`, {
    cache: 'no-store',
  });
  if (!res.ok) throw new Error('Failed to fetch dashboard summary');
  return res.json();
}

export async function getFraudAlerts() {
  const res = await fetch(`${API_URL}/dashboard/fraud-alerts`, {
    cache: 'no-store',
  });
  if (!res.ok) throw new Error('Failed to fetch fraud alerts');
  return res.json();
}
