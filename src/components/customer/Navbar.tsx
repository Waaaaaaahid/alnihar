import { Link, useNavigate, useLocation } from 'react-router-dom';
import { useState, useEffect } from 'react';
import { motion, AnimatePresence } from 'framer-motion';
import { ShoppingBag, Menu as MenuIcon, X, User, LogOut, Package, Home, UtensilsCrossed, CalendarDays } from 'lucide-react';
import { useCart } from '@/context/CartContext';
import { useAuth } from '@/context/AuthContext';
import Logo from '@/components/Logo';
import { cn } from '@/lib/utils';

export default function Navbar() {
  const { totalItems } = useCart();
  const { profile, signOut, isAdmin } = useAuth();
  const navigate = useNavigate();
  const location = useLocation();
  const [scrolled, setScrolled] = useState(false);
  const [mobileOpen, setMobileOpen] = useState(false);
  const [userMenuOpen, setUserMenuOpen] = useState(false);

  useEffect(() => {
    const onScroll = () => setScrolled(window.scrollY > 20);
    onScroll();
    window.addEventListener('scroll', onScroll);
    return () => window.removeEventListener('scroll', onScroll);
  }, []);

  useEffect(() => { setMobileOpen(false); setUserMenuOpen(false); }, [location.pathname]);

  const navLinks = [
    { label: 'Home', path: '/' },
    { label: 'Menu', path: '/menu' },
    { label: 'Track Order', path: '/orders' },
    ...(profile ? [{ label: 'My Bookings', path: '/my-bookings' }] : []),
  ];

  return (
    <>
      <header className={cn('fixed top-0 left-0 right-0 z-40 transition-all duration-300', scrolled ? 'glass-dark shadow-xl shadow-ink-950/30' : 'bg-transparent')}>
        <nav className="container-wide flex h-16 items-center justify-between gap-4 lg:h-20">
          <Link to="/" className="shrink-0"><Logo /></Link>
          <div className="hidden items-center gap-1 lg:flex">
            {navLinks.map((link) => <Link key={link.path} to={link.path} className={cn('relative rounded-lg px-4 py-2 text-sm font-medium transition-colors', location.pathname === link.path || (link.path === '/menu' && location.pathname.startsWith('/menu')) ? 'text-ember-400' : 'text-cream-200 hover:text-cream-50')}>
              {link.label}
              {(location.pathname === link.path || (link.path === '/menu' && location.pathname.startsWith('/menu'))) && <motion.div layoutId="nav-active" className="absolute inset-0 -z-10 rounded-lg bg-ember-500/10" transition={{ type: 'spring', stiffness: 400, damping: 30 }} />}
            </Link>)}
          </div>
          <div className="flex items-center gap-2">
            <Link to="/cart" className="relative flex h-10 w-10 items-center justify-center rounded-xl text-cream-100 transition-colors hover:bg-ink-800" aria-label="Cart">
              <ShoppingBag className="h-5 w-5" />
              <AnimatePresence>{totalItems > 0 && <motion.span initial={{ scale: 0 }} animate={{ scale: 1 }} exit={{ scale: 0 }} className="absolute -right-1 -top-1 flex h-5 min-w-[20px] items-center justify-center rounded-full bg-ember-500 px-1 text-[10px] font-bold text-ink-950">{totalItems}</motion.span>}</AnimatePresence>
            </Link>
            {profile ? <div className="relative hidden lg:block">
              <button onClick={() => setUserMenuOpen(v => !v)} className="flex h-10 items-center gap-2 rounded-xl px-3 text-cream-100 transition-colors hover:bg-ink-800">
                <div className="flex h-7 w-7 items-center justify-center rounded-full bg-ember-500/20 text-xs font-bold text-ember-400">{profile.name?.charAt(0).toUpperCase() || 'U'}</div>
                <span className="text-sm font-medium max-w-[100px] truncate">{profile.name?.split(' ')[0] || 'Account'}</span>
              </button>
              <AnimatePresence>{userMenuOpen && <><div className="fixed inset-0 z-10" onClick={() => setUserMenuOpen(false)} /><motion.div initial={{ opacity: 0, y: 10 }} animate={{ opacity: 1, y: 0 }} exit={{ opacity: 0, y: 10 }} className="absolute right-0 top-full z-20 mt-2 w-56 overflow-hidden rounded-xl border border-ink-700 bg-ink-900 shadow-2xl">
                <div className="border-b border-ink-700 px-4 py-3"><p className="text-sm font-semibold text-cream-100 truncate">{profile.name}</p><p className="text-xs text-ink-400">{profile.phone || 'Member'}</p></div>
                <div className="py-1">
                  <Link to="/profile" className="flex items-center gap-3 px-4 py-2.5 text-sm text-cream-200 hover:bg-ink-800"><User className="h-4 w-4" /> Profile</Link>
                  <Link to="/orders" className="flex items-center gap-3 px-4 py-2.5 text-sm text-cream-200 hover:bg-ink-800"><Package className="h-4 w-4" /> My Orders</Link>
                  {isAdmin && <Link to="/admin" className="flex items-center gap-3 px-4 py-2.5 text-sm text-ember-400 hover:bg-ink-800"><Home className="h-4 w-4" /> Admin Dashboard</Link>}
                  <button onClick={() => { signOut(); navigate('/'); }} className="flex w-full items-center gap-3 px-4 py-2.5 text-sm text-red-400 hover:bg-ink-800"><LogOut className="h-4 w-4" /> Sign Out</button>
                </div>
              </motion.div></>}</AnimatePresence>
            </div> : <div className="hidden items-center gap-2 lg:flex"><Link to="/login" className="rounded-xl px-4 py-2 text-sm font-medium text-cream-100 transition-colors hover:bg-ink-800">Sign In</Link><Link to="/register" className="rounded-xl bg-ember-500 px-4 py-2 text-sm font-semibold text-ink-950 transition-colors hover:bg-ember-600">Sign Up</Link></div>}
            <button onClick={() => setMobileOpen(true)} className="flex h-10 w-10 items-center justify-center rounded-xl text-cream-100 transition-colors hover:bg-ink-800 lg:hidden" aria-label="Open menu"><MenuIcon className="h-5 w-5" /></button>
          </div>
        </nav>
      </header>
      <AnimatePresence>{mobileOpen && <div className="fixed inset-0 z-50 lg:hidden">
        <motion.div initial={{ opacity: 0 }} animate={{ opacity: 1 }} exit={{ opacity: 0 }} onClick={() => setMobileOpen(false)} className="absolute inset-0 bg-ink-950/80 backdrop-blur-sm" />
        <motion.div initial={{ x: '100%' }} animate={{ x: 0 }} exit={{ x: '100%' }} transition={{ type: 'spring', stiffness: 400, damping: 35 }} className="absolute right-0 top-0 h-full w-80 max-w-[85vw] overflow-y-auto border-l border-ink-700 bg-ink-900">
          <div className="flex items-center justify-between border-b border-ink-700 px-5 py-4"><Logo /><button onClick={() => setMobileOpen(false)} className="rounded-lg p-1 text-ink-400 hover:text-cream-100"><X className="h-5 w-5" /></button></div>
          <div className="px-3 py-4">
            {navLinks.map((link) => <Link key={link.path} to={link.path} className="flex items-center gap-3 rounded-xl px-4 py-3 text-sm font-medium text-cream-100 transition-colors hover:bg-ink-800">{link.path === '/' ? <Home className="h-4 w-4" /> : link.path === '/my-bookings' ? <CalendarDays className="h-4 w-4" /> : <UtensilsCrossed className="h-4 w-4" />}{link.label}</Link>)}
            <div className="my-3 h-px bg-ink-700" />
            {profile ? <><Link to="/profile" className="flex items-center gap-3 rounded-xl px-4 py-3 text-sm font-medium text-cream-100 hover:bg-ink-800"><User className="h-4 w-4" /> Profile</Link><Link to="/orders" className="flex items-center gap-3 rounded-xl px-4 py-3 text-sm font-medium text-cream-100 hover:bg-ink-800"><Package className="h-4 w-4" /> My Orders</Link>{isAdmin && <Link to="/admin" className="flex items-center gap-3 rounded-xl px-4 py-3 text-sm font-medium text-ember-400 hover:bg-ink-800"><Home className="h-4 w-4" /> Admin Dashboard</Link>}<button onClick={() => { signOut(); navigate('/'); }} className="flex w-full items-center gap-3 rounded-xl px-4 py-3 text-sm font-medium text-red-400 hover:bg-ink-800"><LogOut className="h-4 w-4" /> Sign Out</button></> : <div className="flex flex-col gap-2 px-2"><Link to="/login" className="rounded-xl border border-ink-600 px-4 py-3 text-center text-sm font-medium text-cream-100">Sign In</Link><Link to="/register" className="rounded-xl bg-ember-500 px-4 py-3 text-center text-sm font-semibold text-ink-950">Sign Up</Link></div>}
          </div>
        </motion.div>
      </div>}</AnimatePresence>
    </>
  );
}
