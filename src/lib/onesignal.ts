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

export async function enableAdminWebPush(adminId: string) {
  const OneSignal = await initWebPush();
  await OneSignal.login(adminId);
  await OneSignal.Notifications.requestPermission();
  return Boolean(OneSignal.User?.PushSubscription?.optedIn);
}
