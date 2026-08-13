import { useState } from 'react';
import { Link } from 'react-router-dom';
import { motion } from 'framer-motion';
import { Mail, ArrowRight, ArrowLeft, CheckCircle2 } from 'lucide-react';
import { supabase } from '@/lib/supabase';
import { useToast } from '@/context/ToastContext';
import Button from '@/components/ui/Button';
import Logo from '@/components/Logo';
import { validateEmail } from '@/lib/utils';

export default function ForgotPasswordPage() {
  const { showToast } = useToast();
  const [email, setEmail] = useState('');
  const [error, setError] = useState('');
  const [loading, setLoading] = useState(false);
  const [sent, setSent] = useState(false);

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!email) { setError('Email is required'); return; }
    if (!validateEmail(email)) { setError('Invalid email'); return; }
    setError('');
    setLoading(true);
    try {
      const { error } = await supabase.auth.resetPasswordForEmail(email, {
        redirectTo: `${window.location.origin}/reset-password`,
      });
      if (error) throw error;
      setSent(true);
      showToast('Reset link sent to your email', 'success');
    } catch (e: any) {
      showToast(e.message || 'Failed to send reset link', 'error');
    } finally {
      setLoading(false);
    }
  };

  return (
    <div className="flex min-h-screen items-center justify-center px-4 py-12">
      <motion.div initial={{ opacity: 0, y: 20 }} animate={{ opacity: 1, y: 0 }} className="w-full max-w-md">
        <div className="rounded-2xl border border-ink-700/50 bg-ink-900 p-8">
          <div className="mb-8 flex flex-col items-center">
            <Logo />
            <h1 className="mt-6 font-display text-2xl font-bold text-cream-50">Reset Password</h1>
            {sent ? (
              <p className="mt-1 text-sm text-emerald-400">Check your email for a reset link</p>
            ) : (
              <p className="mt-1 text-sm text-ink-300">Enter your email to receive a reset link</p>
            )}
          </div>

          {sent ? (
            <div className="flex flex-col items-center gap-4 text-center">
              <CheckCircle2 className="h-16 w-16 text-emerald-400" />
              <p className="text-sm text-ink-300">
                We've sent a password reset link to <span className="font-semibold text-cream-100">{email}</span>.
                Check your inbox and follow the link to reset your password.
              </p>
              <Link to="/login" className="text-sm font-semibold text-ember-400 hover:text-ember-300">
                Back to sign in
              </Link>
            </div>
          ) : (
            <form onSubmit={handleSubmit} className="space-y-4">
              <div>
                <label className="mb-1.5 block text-sm font-medium text-cream-200">Email</label>
                <div className="relative">
                  <Mail className="absolute left-3.5 top-1/2 h-4 w-4 -translate-y-1/2 text-ink-400" />
                  <input
                    type="email"
                    value={email}
                    onChange={(e) => { setEmail(e.target.value); setError(''); }}
                    placeholder="you@example.com"
                    className={`w-full rounded-xl border bg-ink-950 py-2.5 pl-10 pr-4 text-sm text-cream-100 placeholder:text-ink-400 focus:outline-none focus:ring-2 focus:ring-ember-500/30 ${error ? 'border-red-500/60' : 'border-ink-600'}`}
                  />
                </div>
                {error && <p className="mt-1 text-xs text-red-400">{error}</p>}
              </div>
              <Button type="submit" fullWidth size="lg" loading={loading}>
                Send Reset Link <ArrowRight className="h-4 w-4" />
              </Button>
            </form>
          )}

          <Link to="/login" className="mt-6 flex items-center justify-center gap-2 text-xs text-ink-400 hover:text-cream-200">
            <ArrowLeft className="h-3 w-3" /> Back to sign in
          </Link>
        </div>
      </motion.div>
    </div>
  );
}
