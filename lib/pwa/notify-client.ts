export async function notifyPartnerClients(type: 'order' | 'booking', id: string) {
  if (typeof window === 'undefined' || !id) return;
  try {
    await fetch('/api/partner/alerts', {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({ type, id }),
    });
  } catch (error) {
    console.warn('[SheQueen] Client partner alert ping failed:', error);
  }
}

export async function notifyAdminApprovalClients(
  type: 'supplier' | 'provider',
  id: string
) {
  if (typeof window === 'undefined' || !id) return;
  try {
    await fetch('/api/admin/alerts', {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({ type, id }),
    });
  } catch (error) {
    console.warn('[SheQueen] Client admin approval alert ping failed:', error);
  }
}
