type OrderLike = { orderNumber: string; customerName: string; total: number; paymentMethod: string; orderType: string; deliveryAddress?: string };
type BookingLike = { bookingNumber: string; customerName: string; customerPhone: string; date: string; time: string; guests: number; notes?: string };
const env = (name: string) => process.env[name]?.trim();

async function sendPush(title: string, contents: string, urlPath: string) {
  const appId = env('ONESIGNAL_APP_ID');
  const apiKey = env('ONESIGNAL_REST_API_KEY');
  if (!appId || !apiKey) throw new Error('Missing ONESIGNAL_APP_ID or ONESIGNAL_REST_API_KEY');
  const response = await fetch('https://api.onesignal.com/notifications', {
    method: 'POST',
    headers: { Authorization: `Key ${apiKey}`, 'Content-Type': 'application/json' },
    body: JSON.stringify({ app_id: appId, target_channel: 'push', filters: [{ field: 'tag', key: 'role', relation: '=', value: 'admin' }], headings: { en: title }, contents: { en: contents }, url: `${env('CLIENT_URL') || 'https://alnihar.vercel.app'}${urlPath}` }),
  });
  const body = await response.text();
  if (!response.ok) throw new Error(`HTTP ${response.status}: ${body}`);
  console.log('[Notifications] OneSignal ACCEPTED:', body);
}

export async function sendNewOrderNotifications(order: OrderLike) {
  console.log(`[Notifications] START order=${order.orderNumber}`);
  try { await sendPush('🛎️ New AL NIHAR Order', `Order #${order.orderNumber} • ₹${Number(order.total).toFixed(0)} • ${order.customerName}`, '/admin/orders'); }
  catch (error) { console.error('[Notifications] OneSignal FAILED:', error); }
  try { await sendWhatsApp(order); }
  catch (error) { console.error('[Notifications] WhatsApp FAILED:', error); }
  console.log(`[Notifications] END order=${order.orderNumber}`);
}

export async function sendTableBookingNotifications(booking: BookingLike) {
  console.log(`[Notifications] START booking=${booking.bookingNumber}`);
  try { await sendPush('🪑 New AL NIHAR Table Booking', `Booking #${booking.bookingNumber} • ${booking.customerName} • ${booking.date} ${booking.time} • ${booking.guests} guests`, '/admin/bookings'); }
  catch (error) { console.error('[Notifications] Booking OneSignal FAILED:', error); }
  console.log(`[Notifications] END booking=${booking.bookingNumber}`);
}

async function sendWhatsApp(order: OrderLike) {
  const token = env('WHATSAPP_ACCESS_TOKEN');
  const phoneNumberId = env('WHATSAPP_PHONE_NUMBER_ID');
  const recipient = env('WHATSAPP_ADMIN_NUMBER');
  if (!token || !phoneNumberId || !recipient) return;
  const response = await fetch(`https://graph.facebook.com/v23.0/${phoneNumberId}/messages`, { method: 'POST', headers: { Authorization: `Bearer ${token}`, 'Content-Type': 'application/json' }, body: JSON.stringify({ messaging_product: 'whatsapp', to: recipient, type: 'template', template: { name: env('WHATSAPP_ORDER_TEMPLATE') || 'new_order_alert', language: { code: env('WHATSAPP_TEMPLATE_LANGUAGE') || 'en_US' }, components: [{ type: 'body', parameters: [{ type: 'text', text: order.orderNumber }, { type: 'text', text: order.customerName }, { type: 'text', text: `₹${Number(order.total).toFixed(0)}` }, { type: 'text', text: order.paymentMethod.toUpperCase() }, { type: 'text', text: order.deliveryAddress || order.orderType }] }] } }) });
  const body = await response.text();
  if (!response.ok) throw new Error(`HTTP ${response.status}: ${body}`);
  console.log('[Notifications] WhatsApp ACCEPTED:', body);
}
