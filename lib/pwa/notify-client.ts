export async function notifyPartnerClients(type: 'order' | 'booking', id: string) {
  if (typeof window === 'undefined' || !id) return;
  try {
    await fetch('/api/partner/alerts', {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({ type, id }),
    });
  } catch (error) {
    console.warn('[ShiQueen] Client partner alert ping failed:', error);
  }
}

async function pingAdminAlert(type: string, id: string) {
  if (typeof window === 'undefined' || !id) return;
  try {
    await fetch('/api/admin/alerts', {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({ type, id }),
    });
  } catch (error) {
    console.warn(`[ShiQueen] Client admin ${type} alert ping failed:`, error);
  }
}

export async function notifyAdminApprovalClients(
  type: 'supplier' | 'provider',
  id: string
) {
  await pingAdminAlert(type, id);
}

export async function notifyAdminContactClients(id: string) {
  await pingAdminAlert('contact', id);
}

export async function notifyAdminFlaggedReviewClients(id: string) {
  await pingAdminAlert('flagged_review', id);
}

export async function notifyAdminOrderClients(id: string) {
  await pingAdminAlert('order', id);
}

export async function notifyAdminBookingClients(id: string) {
  await pingAdminAlert('booking', id);
}

export async function notifyAdminBulkOrderClients(id: string) {
  await pingAdminAlert('bulk_order', id);
}

export async function notifyAdminWholesaleAccountClients(id: string) {
  await pingAdminAlert('wholesale_account', id);
}
