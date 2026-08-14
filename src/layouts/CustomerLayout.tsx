import { Outlet, useLocation } from 'react-router-dom';
import { useEffect } from 'react';
import { LockKeyhole } from 'lucide-react';
import Navbar from '@/components/customer/Navbar';
import Footer from '@/components/customer/Footer';
import { useSettings } from '@/hooks/useSettings';

export default function CustomerLayout() {
  const { pathname } = useLocation();
  const { settings } = useSettings();

  useEffect(() => {
    window.scrollTo({ top: 0, behavior: 'instant' });
  }, [pathname]);

  const restaurantClosed = settings !== null && !settings.isOpen;

  return (
    <div className="flex min-h-screen flex-col bg-ink-950">
      <Navbar />

      {restaurantClosed && (
        <div className="relative z-30 border-b border-ember-500/20 bg-ink-900 px-4 py-4 sm:px-6">
          <div className="container-wide">
            <div className="flex items-center gap-3 rounded-2xl border border-ember-500/20 bg-ember-500/10 px-4 py-3.5 sm:px-5">
              <div className="flex h-10 w-10 shrink-0 items-center justify-center rounded-xl bg-ember-500/15 text-ember-400">
                <LockKeyhole className="h-5 w-5" />
              </div>
              <div>
                <h2 className="text-sm font-bold text-cream-50 sm:text-base">We're Closed Right Now</h2>
                <p className="mt-0.5 text-xs leading-relaxed text-ink-300 sm:text-sm">
                  We're not accepting orders at the moment. Please check back soon.
                </p>
              </div>
            </div>
          </div>
        </div>
      )}

      <main className="flex-1 pt-16 lg:pt-20">
        <Outlet />
      </main>
      <Footer />
    </div>
  );
}
