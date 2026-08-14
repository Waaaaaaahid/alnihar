import { useState } from 'react';
import { MapPin, Navigation, Loader2, CheckCircle2 } from 'lucide-react';

interface Props {
  latitude: number | null;
  longitude: number | null;
  onChange: (location: { latitude: number; longitude: number }) => void;
}

export default function LocationPicker({ latitude, longitude, onChange }: Props) {
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState('');

  const useCurrentLocation = () => {
    if (!navigator.geolocation) {
      setError('Location is not supported on this device/browser.');
      return;
    }
    setLoading(true); setError('');
    navigator.geolocation.getCurrentPosition(
      (position) => {
        onChange({ latitude: position.coords.latitude, longitude: position.coords.longitude });
        setLoading(false);
      },
      () => { setError('Location permission was denied. You can enter your address manually.'); setLoading(false); },
      { enableHighAccuracy: true, timeout: 15000, maximumAge: 0 },
    );
  };

  const mapUrl = latitude !== null && longitude !== null
    ? `https://www.openstreetmap.org/export/embed.html?bbox=${longitude - 0.006}%2C${latitude - 0.004}%2C${longitude + 0.006}%2C${latitude + 0.004}&layer=mapnik&marker=${latitude}%2C${longitude}`
    : '';

  return (
    <div className="mt-4 rounded-xl border border-ink-700 bg-ink-800/40 p-4">
      <button type="button" onClick={useCurrentLocation} disabled={loading} className="flex w-full items-center justify-center gap-2 rounded-xl border border-ember-500/50 bg-ember-500/10 px-4 py-3 text-sm font-semibold text-ember-300 hover:bg-ember-500/20 disabled:opacity-60">
        {loading ? <Loader2 className="h-4 w-4 animate-spin" /> : <Navigation className="h-4 w-4" />}
        {loading ? 'Fetching your location...' : 'Use Current Location'}
      </button>
      {error && <p className="mt-2 text-xs text-red-400">{error}</p>}
      {latitude !== null && longitude !== null && (
        <div className="mt-3 overflow-hidden rounded-xl border border-ink-700">
          <div className="relative h-48 bg-ink-900">
            <iframe title="Delivery location map" src={mapUrl} className="h-full w-full border-0" loading="lazy" />
          </div>
          <div className="flex items-center gap-2 bg-ink-900 p-3 text-xs text-cream-200">
            <CheckCircle2 className="h-4 w-4 text-emerald-400" />
            <span>Location selected: {latitude.toFixed(6)}, {longitude.toFixed(6)}</span>
            <MapPin className="ml-auto h-4 w-4 text-ember-400" />
          </div>
        </div>
      )}
    </div>
  );
}
