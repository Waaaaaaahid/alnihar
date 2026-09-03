declare global {
  interface Window {
    OneSignalDeferred?: Array<(OneSignal: any) => void>;
  }
}

let initPromise: Promise<any> | null = null;

export function isWebPushConfigured() {
  return Boolean(import.meta.env.VITE_ONESIGNAL_APP_ID);
}

export function initWebPush() {
  const appId = import.meta.env.VITE_ONESIGNAL_APP_ID as string | undefined;
  if (!appId) return Promise.reject(new Error('Web Push is not configured. Add VITE_ONESIGNAL_APP_ID.'));
  if (!window.OneSignalDeferred) window.OneSignalDeferred = [];
  if (!initPromise) {
    initPromise = new Promise((resolve, reject) => {
      window.OneSignalDeferred!.push(async (OneSignal: any) => {
        try {
          await OneSignal.init({ appId, allowLocalhostAsSecureOrigin: import.meta.env.DEV });
          resolve(OneSignal);
        } catch (error) {
          reject(error);
        }
      });
    });
  }
  return initPromise;
}

export async function syncAdminWebPush(adminId: string) {
  const OneSignal = await initWebPush();
  await OneSignal.login(String(adminId));
  const permission = OneSignal.Notifications.permission;
  if (!permission) return false;
  if (!OneSignal.User?.PushSubscription?.optedIn) {
    await OneSignal.User.PushSubscription.optIn();
  }
  await OneSignal.User.addTags({ role: 'admin' });
  return Boolean(OneSignal.User?.PushSubscription?.optedIn);
}

export async function enableAdminWebPush(adminId: string) {
  const OneSignal = await initWebPush();
  if (!OneSignal.Notifications.permission) {
    await OneSignal.Notifications.requestPermission();
  }
  if (!OneSignal.Notifications.permission) throw new Error('Notification permission was not granted.');
  return syncAdminWebPush(adminId);
}
