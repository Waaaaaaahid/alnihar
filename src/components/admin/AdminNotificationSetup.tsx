import { useEffect, useState } from 'react';
import { Bell, Check, Loader2 } from 'lucide-react';
import { enableAdminWebPush, initWebPush, isWebPushConfigured, syncAdminWebPush } from '@/lib/onesignal';
import { useAuth } from '@/context/AuthContext';

export default function AdminNotificationSetup() {
  const { profile } = useAuth();
  const [state, setState] = useState<'idle' | 'loading' | 'enabled' | 'error'>('idle');
  const [message, setMessage] = useState('');

  useEffect(() => {
    let cancelled = false;
    if (!profile?.id || !isWebPushConfigured()) return;
    initWebPush().then(async (OneSignal) => {
      if (cancelled) return;
      if (OneSignal.Notifications.permission) {
        const enabled = await syncAdminWebPush(profile.id);
        if (!cancelled) setState(enabled ? 'enabled' : 'idle');
      }
    }).catch(() => {});
    return () => { cancelled = true; };
  }, [profile?.id]);

  if (!isWebPushConfigured()) return null;

  const enable = async () => {
    if (!profile?.id) return;
    setState('loading');
    setMessage('');
    try {
      const enabled = await enableAdminWebPush(profile.id);
      if (!enabled) throw new Error('Permission was not granted.');
      setState('enabled');
      setMessage('Push notifications enabled');
    } catch (error: any) {
      setState('error');
      setMessage(error?.message || 'Could not enable notifications');
    }
  };

  return (
    <div className="flex items-center gap-2">
      {state === 'enabled' ? (
        <span className="hidden sm:flex items-center gap-1.5 rounded-xl border border-emerald-500/20 bg-emerald-500/10 px-3 py-1.5 text-xs font-medium text-emerald-300" title="Push notifications are enabled on this device">
          <Check className="h-3.5 w-3.5" /> Notifications on
        </span>
      ) : (
        <button onClick={enable} disabled={state === 'loading'} className="flex items-center gap-1.5 rounded-xl border border-ink-600 px-3 py-1.5 text-xs font-medium text-cream-200 hover:bg-ink-800 disabled:opacity-60" title={message || 'Enable order push notifications'}>
          {state === 'loading' ? <Loader2 className="h-3.5 w-3.5 animate-spin" /> : <Bell className="h-3.5 w-3.5" />}
          Enable notifications
        </button>
      )}
      {state === 'error' && <span className="hidden max-w-48 truncate text-xs text-red-300 sm:block">{message}</span>}
    </div>
  );
}
