import { useState } from 'react';
import { Link, useNavigate } from 'react-router-dom';
import { motion } from 'framer-motion';
import { Lock, ArrowRight, ArrowLeft } from 'lucide-react';
import { supabase } from '@/lib/supabase';
import { useToast } from '@/context/ToastContext';
import Button from '@/components/ui/Button';
import Logo from '@/components/Logo';

export default function ResetPasswordPage() {
  const { showToast } = useToast();
  const navigate = useNavigate();
  const [password, setPassword] = useState('');
  const [confirm, setConfirm] = useState('');
  const [error, setError] = useState('');
  const [loading, setLoading] = useState(false);

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!password) { setError('Password is required'); return; }
    if (password.length < 6) { setError('Password must be at least 6 characters'); return; }
    if (password !== confirm) { setError('Passwords do not match'); return; }
    setError('');
    setLoading(true);
    try {
      const { error } = await supabase.auth.updateUser({ password });
      if (error) throw error;
      showToast('Password updated successfully', 'success');
      navigate('/login');
    } catch (e: any) {
      showToast(e.message || 'Failed to update password', 'error');
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
            <h1 className="mt-6 font-display text-2xl font-bold text-cream-50">Set New Password</h1>
            <p className="mt-1 text-sm text-ink-300">Enter your new password below</p>
          </div>

          <form onSubmit={handleSubmit} className="space-y-4">
            <div>
              <label className="mb-1.5 block text-sm font-medium text-cream-200">New Password</label>
              <div className="relative">
                <Lock className="absolute left-3.5 top-1/2 h-4 w-4 -translate-y-1/2 text-ink-400" />
                <input
                  type="password"
                  value={password}
                  onChange={(e) => { setPassword(e.target.value); setError(''); }}
                  placeholder="At least 6 characters"
                  className={`w-full rounded-xl border bg-ink-950 py-2.5 pl-10 pr-4 text-sm text-cream-100 placeholder:text-ink-400 focus:outline-none focus:ring-2 focus:ring-ember-500/30 ${error ? 'border-red-500/60' : 'border-ink-600'}`}
                />
              </div>
            </div>
            <div>
              <label className="mb-1.5 block text-sm font-medium text-cream-200">Confirm Password</label>
              <div className="relative">
                <Lock className="absolute left-3.5 top-1/2 h-4 w-4 -translate-y-1/2 text-ink-400" />
                <input
                  type="password"
                  value={confirm}
                  onChange={(e) => { setConfirm(e.target.value); setError(''); }}
                  placeholder="Re-enter password"
                  className={`w-full rounded-xl border bg-ink-950 py-2.5 pl-10 pr-4 text-sm text-cream-100 placeholder:text-ink-400 focus:outline-none focus:ring-2 focus:ring-ember-500/30 ${error ? 'border-red-500/60' : 'border-ink-600'}`}
                />
              </div>
              {error && <p className="mt-1 text-xs text-red-400">{error}</p>}
            </div>
            <Button type="submit" fullWidth size="lg" loading={loading}>
              Update Password <ArrowRight className="h-4 w-4" />
            </Button>
          </form>

          <Link to="/login" className="mt-6 flex items-center justify-center gap-2 text-xs text-ink-400 hover:text-cream-200">
            <ArrowLeft className="h-3 w-3" /> Back to sign in
          </Link>
        </div>
      </motion.div>
    </div>
  );
}
