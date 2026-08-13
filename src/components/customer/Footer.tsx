import { Link } from 'react-router-dom';
import { Instagram, Facebook, Twitter, MapPin, Phone, Mail, Clock } from 'lucide-react';
import Logo from '@/components/Logo';
import { useSettings } from '@/hooks/useSettings';

export default function Footer() {
  const { settings } = useSettings();

  const socials = settings?.socialLinks || {};
  const hours = settings?.openingHours || {};

  return (
    <footer className="border-t border-ink-800 bg-ink-950">
      <div className="container-wide py-12 lg:py-16">
        <div className="grid grid-cols-1 gap-8 sm:grid-cols-2 lg:grid-cols-4">
          {/* Brand */}
          <div className="space-y-4">
            <Logo />
            <p className="text-sm leading-relaxed text-ink-300">
              {settings?.tagline || 'Premium Burgers, Smashed to Perfection'}. Crafted with the finest ingredients and bold flavors.
            </p>
            <div className="flex gap-2">
              {socials.instagram && (
                <a href={socials.instagram} target="_blank" rel="noreferrer" className="flex h-9 w-9 items-center justify-center rounded-lg border border-ink-700 text-ink-300 transition-colors hover:border-ember-500 hover:text-ember-500">
                  <Instagram className="h-4 w-4" />
                </a>
              )}
              {socials.facebook && (
                <a href={socials.facebook} target="_blank" rel="noreferrer" className="flex h-9 w-9 items-center justify-center rounded-lg border border-ink-700 text-ink-300 transition-colors hover:border-ember-500 hover:text-ember-500">
                  <Facebook className="h-4 w-4" />
                </a>
              )}
              {socials.twitter && (
                <a href={socials.twitter} target="_blank" rel="noreferrer" className="flex h-9 w-9 items-center justify-center rounded-lg border border-ink-700 text-ink-300 transition-colors hover:border-ember-500 hover:text-ember-500">
                  <Twitter className="h-4 w-4" />
                </a>
              )}
            </div>
          </div>

          {/* Quick Links */}
          <div>
            <h3 className="mb-4 text-sm font-semibold uppercase tracking-wider text-cream-100">Explore</h3>
            <ul className="space-y-2.5">
              <li><Link to="/" className="text-sm text-ink-300 hover:text-ember-400">Home</Link></li>
              <li><Link to="/menu" className="text-sm text-ink-300 hover:text-ember-400">Full Menu</Link></li>
              <li><Link to="/cart" className="text-sm text-ink-300 hover:text-ember-400">Cart</Link></li>
              <li><Link to="/orders" className="text-sm text-ink-300 hover:text-ember-400">Track Order</Link></li>
              <li><Link to="/profile" className="text-sm text-ink-300 hover:text-ember-400">My Profile</Link></li>
            </ul>
          </div>

          {/* Contact */}
          <div>
            <h3 className="mb-4 text-sm font-semibold uppercase tracking-wider text-cream-100">Contact</h3>
            <ul className="space-y-3">
              <li className="flex items-start gap-3 text-sm text-ink-300">
                <MapPin className="h-4 w-4 mt-0.5 shrink-0 text-ember-500" />
                <span>{settings?.address || '123 Food Street, Mumbai 400050'}</span>
              </li>
              <li className="flex items-center gap-3 text-sm text-ink-300">
                <Phone className="h-4 w-4 shrink-0 text-ember-500" />
                <a href={`tel:${settings?.phone}`}>{settings?.phone || '+91 98765 43210'}</a>
              </li>
              <li className="flex items-center gap-3 text-sm text-ink-300">
                <Mail className="h-4 w-4 shrink-0 text-ember-500" />
                <a href={`mailto:${settings?.email}`}>{settings?.email || 'hello@alnihar.com'}</a>
              </li>
            </ul>
          </div>

          {/* Hours */}
          <div>
            <h3 className="mb-4 text-sm font-semibold uppercase tracking-wider text-cream-100">Opening Hours</h3>
            <ul className="space-y-1.5">
              {Object.entries(hours).map(([day, time]) => (
                <li key={day} className="flex items-center justify-between text-sm">
                  <span className="capitalize text-ink-300">{day.slice(0, 3)}</span>
                  <span className="text-cream-200">{time}</span>
                </li>
              ))}
            </ul>
          </div>
        </div>

        <div className="mt-12 flex flex-col items-center justify-between gap-4 border-t border-ink-800 pt-8 sm:flex-row">
          <p className="text-xs text-ink-400">
            © {new Date().getFullYear()} AL NIHAR. All rights reserved.
          </p>
          <p className="text-xs text-ink-400">
            Crafted with bold flavors and premium ingredients.
          </p>
        </div>
      </div>
    </footer>
  );
}
