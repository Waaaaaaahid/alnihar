import { useState } from 'react';
import { Link, useNavigate } from 'react-router-dom';
import { motion } from 'framer-motion';
import { Mail, Lock, User, Phone, ArrowRight, ArrowLeft } from 'lucide-react';
import { useAuth } from '@/context/AuthContext';
import { useToast } from '@/context/ToastContext';
import Button from '@/components/ui/Button';
import Logo from '@/components/Logo';
import { validateEmail, validatePhone } from '@/lib/utils';

export default function RegisterPage() {
  const { signUp } = useAuth();
  const { showToast } = useToast();
  const navigate = useNavigate();

  const [form, setForm] = useState({ full_name: '', email: '', phone: '', password: '' });
  const [errors, setErrors] = useState<Record<string, string>>({});
  const [loading, setLoading] = useState(false);

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    const err: Record<string, string> = {};
    if (!form.name.trim()) err.name = 'Name is required';
    if (!form.email) err.email = 'Email is required';
    else if (!validateEmail(form.email)) err.email = 'Invalid email';
    if (form.phone && !validatePhone(form.phone)) err.phone = 'Invalid phone';
    if (!form.password) err.password = 'Password is required';
    else if (form.password.length < 6) err.password = 'Password must be at least 6 characters';
    setErrors(err);
    if (Object.keys(err).length) return;

    setLoading(true);
    const { error } = await signUp(form.email, form.password, form.name, form.phone);
    setLoading(false);

    if (error) {
      showToast(error, 'error');
    } else {
      showToast('Account created! Welcome to AL NIHAR', 'success');
      navigate('/');
    }
  };

  return (
    <div className="flex min-h-screen items-center justify-center px-4 py-12">
      <motion.div
        initial={{ opacity: 0, y: 20 }}
        animate={{ opacity: 1, y: 0 }}
        className="w-full max-w-md"
      >
        <div className="rounded-2xl border border-ink-700/50 bg-ink-900 p-8">
          <div className="mb-8 flex flex-col items-center">
            <Logo />
            <h1 className="mt-6 font-display text-2xl font-bold text-cream-50">Create Account</h1>
            <p className="mt-1 text-sm text-ink-300">Join the AL NIHAR family</p>
          </div>

          <form onSubmit={handleSubmit} className="space-y-4">
            <div>
              <label className="mb-1.5 block text-sm font-medium text-cream-200">Full Name</label>
              <div className="relative">
                <User className="absolute left-3.5 top-1/2 h-4 w-4 -translate-y-1/2 text-ink-400" />
                <input
                  type="text"
                  value={form.name}
                  onChange={(e) => { setForm((p) => ({ ...p, full_name: e.target.value })); setErrors((p) => ({ ...p, full_name: '' })); }}
                  placeholder="John Doe"
                  className={`w-full rounded-xl border bg-ink-950 py-2.5 pl-10 pr-4 text-sm text-cream-100 placeholder:text-ink-400 focus:outline-none focus:ring-2 focus:ring-ember-500/30 ${errors.name ? 'border-red-500/60' : 'border-ink-600'}`}
                />
              </div>
              {errors.name && <p className="mt-1 text-xs text-red-400">{errors.name}</p>}
            </div>

            <div>
              <label className="mb-1.5 block text-sm font-medium text-cream-200">Email</label>
              <div className="relative">
                <Mail className="absolute left-3.5 top-1/2 h-4 w-4 -translate-y-1/2 text-ink-400" />
                <input
                  type="email"
                  value={form.email}
                  onChange={(e) => { setForm((p) => ({ ...p, email: e.target.value })); setErrors((p) => ({ ...p, email: '' })); }}
                  placeholder="you@example.com"
                  className={`w-full rounded-xl border bg-ink-950 py-2.5 pl-10 pr-4 text-sm text-cream-100 placeholder:text-ink-400 focus:outline-none focus:ring-2 focus:ring-ember-500/30 ${errors.email ? 'border-red-500/60' : 'border-ink-600'}`}
                />
              </div>
              {errors.email && <p className="mt-1 text-xs text-red-400">{errors.email}</p>}
            </div>

            <div>
              <label className="mb-1.5 block text-sm font-medium text-cream-200">Phone (optional)</label>
              <div className="relative">
                <Phone className="absolute left-3.5 top-1/2 h-4 w-4 -translate-y-1/2 text-ink-400" />
                <input
                  type="tel"
                  value={form.phone}
                  onChange={(e) => { setForm((p) => ({ ...p, phone: e.target.value })); setErrors((p) => ({ ...p, phone: '' })); }}
                  placeholder="+91 98765 43210"
                  className={`w-full rounded-xl border bg-ink-950 py-2.5 pl-10 pr-4 text-sm text-cream-100 placeholder:text-ink-400 focus:outline-none focus:ring-2 focus:ring-ember-500/30 ${errors.phone ? 'border-red-500/60' : 'border-ink-600'}`}
                />
              </div>
              {errors.phone && <p className="mt-1 text-xs text-red-400">{errors.phone}</p>}
            </div>

            <div>
              <label className="mb-1.5 block text-sm font-medium text-cream-200">Password</label>
              <div className="relative">
                <Lock className="absolute left-3.5 top-1/2 h-4 w-4 -translate-y-1/2 text-ink-400" />
                <input
                  type="password"
                  value={form.password}
                  onChange={(e) => { setForm((p) => ({ ...p, password: e.target.value })); setErrors((p) => ({ ...p, password: '' })); }}
                  placeholder="At least 6 characters"
                  className={`w-full rounded-xl border bg-ink-950 py-2.5 pl-10 pr-4 text-sm text-cream-100 placeholder:text-ink-400 focus:outline-none focus:ring-2 focus:ring-ember-500/30 ${errors.password ? 'border-red-500/60' : 'border-ink-600'}`}
                />
              </div>
              {errors.password && <p className="mt-1 text-xs text-red-400">{errors.password}</p>}
            </div>

            <Button type="submit" fullWidth size="lg" loading={loading}>
              Create Account <ArrowRight className="h-4 w-4" />
            </Button>
          </form>

          <div className="mt-6 text-center text-sm text-ink-300">
            Already have an account?{' '}
            <Link to="/login" className="font-semibold text-ember-400 hover:text-ember-300">
              Sign in
            </Link>
          </div>

          <Link to="/" className="mt-6 flex items-center justify-center gap-2 text-xs text-ink-400 hover:text-cream-200">
            <ArrowLeft className="h-3 w-3" /> Back to home
          </Link>
        </div>
      </motion.div>
    </div>
  );
}
