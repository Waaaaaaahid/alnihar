type OrderLike = { orderNumber: string; customerName: string; total: number; paymentMethod: string; orderType: string; deliveryAddress?: string };
const env = (name: string) => process.env[name]?.trim();

export async function sendNewOrderNotifications(order: OrderLike) {
  const results = await Promise.allSettled([sendOneSignal(order), sendWhatsApp(order)]);
  for (const result of results) {
    if (result.status === 'rejected') console.error('[Notification]', result.reason);
  }
}

async function sendOneSignal(order: OrderLike) {
  const appId = env('ONESIGNAL_APP_ID');
  const apiKey = env('ONESIGNAL_REST_API_KEY');
  const externalId = env('ONESIGNAL_ADMIN_EXTERNAL_ID');
  if (!appId || !apiKey || !externalId) {
    console.error('[OneSignal] Missing ONESIGNAL_APP_ID, ONESIGNAL_REST_API_KEY, or ONESIGNAL_ADMIN_EXTERNAL_ID');
    return;
  }
  const response = await fetch('https://api.onesignal.com/notifications', {
    method: 'POST',
    headers: { Authorization: `Key ${apiKey}`, 'Content-Type': 'application/json' },
    body: JSON.stringify({
      app_id: appId,
      target_channel: 'push',
      include_aliases: { external_id: [externalId] },
      headings: { en: '🛎️ New AL NIHAR Order' },
      contents: { en: `Order #${order.orderNumber} • ₹${Number(order.total).toFixed(0)} • ${order.customerName}` },
      url: `${env('CLIENT_URL') || ''}/admin/orders`,
    }),
  });
  const body = await response.text();
  if (!response.ok) throw new Error(`OneSignal ${response.status}: ${body}`);
  console.log('[OneSignal] New-order push accepted:', body);
}

async function sendWhatsApp(order: OrderLike) {
  const token = env('WHATSAPP_ACCESS_TOKEN');
  const phoneNumberId = env('WHATSAPP_PHONE_NUMBER_ID');
  const recipient = env('WHATSAPP_ADMIN_NUMBER');
  if (!token || !phoneNumberId || !recipient) return;
  const response = await fetch(`https://graph.facebook.com/v23.0/${phoneNumberId}/messages`, {
    method: 'POST', headers: { Authorization: `Bearer ${token}`, 'Content-Type': 'application/json' },
    body: JSON.stringify({ messaging_product: 'whatsapp', to: recipient, type: 'template', template: { name: env('WHATSAPP_ORDER_TEMPLATE') || 'new_order_alert', language: { code: env('WHATSAPP_TEMPLATE_LANGUAGE') || 'en_US' }, components: [{ type: 'body', parameters: [
      { type: 'text', text: order.orderNumber }, { type: 'text', text: order.customerName }, { type: 'text', text: `₹${Number(order.total).toFixed(0)}` }, { type: 'text', text: order.paymentMethod.toUpperCase() }, { type: 'text', text: order.deliveryAddress || order.orderType },
    ] }] } }),
  });
  if (!response.ok) throw new Error(`WhatsApp ${response.status}: ${await response.text()}`);
}
