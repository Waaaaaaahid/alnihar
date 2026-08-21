import { useEffect, useState } from 'react';
import { CalendarDays, Clock3, Users, MapPin, RefreshCw } from 'lucide-react';
import { Link } from 'react-router-dom';
import { fetchMyTableBookings } from '@/lib/api';
import type { TableBooking } from '@/lib/types';
import Button from '@/components/ui/Button';

const statusMeta: Record<TableBooking['status'], { label: string; className: string }> = {
  pending: { label: 'Pending confirmation', className: 'bg-amber-500/10 text-amber-300 border-amber-500/20' },
  confirmed: { label: 'Confirmed', className: 'bg-emerald-500/10 text-emerald-300 border-emerald-500/20' },
  seated: { label: 'Seated', className: 'bg-sky-500/10 text-sky-300 border-sky-500/20' },
  completed: { label: 'Completed', className: 'bg-ink-700 text-cream-200 border-ink-600' },
  cancelled: { label: 'Cancelled', className: 'bg-red-500/10 text-red-300 border-red-500/20' },
};

export default function TableBookingsPage() {
  const [bookings, setBookings] = useState<TableBooking[]>([]);
  const [loading, setLoading] = useState(true);
  const [refreshing, setRefreshing] = useState(false);
  const [error, setError] = useState('');

  const load = async (refresh = false) => {
    setError('');
    if (refresh) setRefreshing(true); else setLoading(true);
    try { setBookings(await fetchMyTableBookings()); }
    catch (e: any) { setError(e?.message || 'Unable to load your bookings.'); }
    finally { setLoading(false); setRefreshing(false); }
  };

  useEffect(() => { load(); }, []);

  return (
    <div className="container-narrow py-8 lg:py-12">
      <div className="flex items-end justify-between gap-4">
        <div>
          <span className="text-xs font-semibold uppercase tracking-[0.2em] text-ember-500">Dine In</span>
          <h1 className="mt-2 font-display text-display-lg font-bold text-cream-50">My Table Bookings</h1>
          <p className="mt-2 text-sm text-ink-300">Track confirmation, table assignment and your reservation status.</p>
        </div>
        <button onClick={() => load(true)} disabled={refreshing} className="flex h-10 w-10 shrink-0 items-center justify-center rounded-xl border border-ink-700 text-ink-300 hover:bg-ink-800 disabled:opacity-50" aria-label="Refresh bookings">
          <RefreshCw className={`h-4 w-4 ${refreshing ? 'animate-spin' : ''}`} />
        </button>
      </div>

      {loading ? <div className="mt-8 rounded-2xl border border-ink-700 bg-ink-900 p-8 text-center text-sm text-ink-400">Loading your bookings...</div> : error ? (
        <div className="mt-8 rounded-2xl border border-red-500/20 bg-red-500/5 p-8 text-center"><p className="text-sm text-red-300">{error}</p><Button className="mt-4" onClick={() => load()}>Try Again</Button></div>
      ) : bookings.length === 0 ? (
        <div className="mt-8 rounded-2xl border border-ink-700 bg-ink-900 p-10 text-center"><CalendarDays className="mx-auto h-10 w-10 text-ink-500"/><h2 className="mt-4 text-lg font-semibold text-cream-100">No table bookings yet</h2><p className="mt-2 text-sm text-ink-400">Book a table and you'll be able to track it here.</p><Link to="/book-table" className="mt-5 inline-flex rounded-xl bg-ember-500 px-5 py-3 text-sm font-semibold text-ink-950">Book a Table</Link></div>
      ) : (
        <div className="mt-8 space-y-4">
          {bookings.map((booking) => {
            const meta = statusMeta[booking.status];
            return <article key={booking.id || booking._id} className="rounded-2xl border border-ink-700/70 bg-ink-900 p-5 shadow-lg shadow-ink-950/10">
              <div className="flex flex-wrap items-start justify-between gap-3">
                <div><p className="text-xs text-ink-500">Booking #{booking.bookingNumber}</p><h2 className="mt-1 text-lg font-semibold text-cream-50">Table Reservation</h2></div>
                <span className={`rounded-full border px-3 py-1.5 text-xs font-semibold ${meta.className}`}>{meta.label}</span>
              </div>
              <div className="mt-5 grid grid-cols-2 gap-4 sm:grid-cols-4">
                <div><p className="text-xs text-ink-500">Date</p><p className="mt-1 flex items-center gap-2 text-sm text-cream-100"><CalendarDays className="h-4 w-4 text-ember-400"/>{booking.date}</p></div>
                <div><p className="text-xs text-ink-500">Time</p><p className="mt-1 flex items-center gap-2 text-sm text-cream-100"><Clock3 className="h-4 w-4 text-ember-400"/>{booking.time}</p></div>
                <div><p className="text-xs text-ink-500">Guests</p><p className="mt-1 flex items-center gap-2 text-sm text-cream-100"><Users className="h-4 w-4 text-ember-400"/>{booking.guests}</p></div>
                <div><p className="text-xs text-ink-500">Table</p><p className="mt-1 flex items-center gap-2 text-sm text-cream-100"><MapPin className="h-4 w-4 text-ember-400"/>{booking.tableNumber || 'Assigned after confirmation'}</p></div>
              </div>
              {booking.status === 'confirmed' && <div className="mt-5 rounded-xl border border-emerald-500/20 bg-emerald-500/5 px-4 py-3 text-sm text-emerald-200">Your reservation is confirmed. {booking.tableNumber ? `Your table is ${booking.tableNumber}.` : 'The restaurant will assign your table.'}</div>}
              {booking.status === 'cancelled' && <div className="mt-5 rounded-xl border border-red-500/20 bg-red-500/5 px-4 py-3 text-sm text-red-200">This reservation has been cancelled. Please make a new booking if needed.</div>}
            </article>;
          })}
        </div>
      )}
    </div>
  );
}
