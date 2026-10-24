import React, { useState, useEffect } from 'react';
import { getSupabaseClient } from '../lib/supabase';
import { ScreenId } from '../types/erp';

interface LoginViewProps {
  onNavigate: (screen: ScreenId) => void;
  onAuthSuccess: () => void;
}

export const LoginView: React.FC<LoginViewProps> = ({ onNavigate, onAuthSuccess }) => {
  const [isSignUp, setIsSignUp] = useState(false);
  const [email, setEmail] = useState('');
  const [password, setPassword] = useState('');
  const [fullName, setFullName] = useState('');
  const [rememberMe, setRememberMe] = useState(true);
  const [loading, setLoading] = useState(false);
  const [errorMsg, setErrorMsg] = useState<string | null>(null);
  const [successMsg, setSuccessMsg] = useState<string | null>(null);
  const [currentSessionUser, setCurrentSessionUser] = useState<string | null>(null);

  const client = getSupabaseClient();

  useEffect(() => {
    if (client) {
      client.auth.getSession().then(({ data }) => {
        if (data?.session?.user?.email) {
          setCurrentSessionUser(data.session.user.email);
        }
      });
    }
  }, [client]);

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!client) {
      setErrorMsg('Supabase client not initialized. Check your environment variables.');
      return;
    }

    setLoading(true);
    setErrorMsg(null);
    setSuccessMsg(null);

    try {
      if (isSignUp) {
        const { data, error } = await client.auth.signUp({
          email,
          password,
          options: {
            data: { full_name: fullName || 'ERP Staff' }
          }
        });

        if (error) {
          setErrorMsg(error.message);
        } else if (data.session) {
          setSuccessMsg('Account created and authenticated successfully!');
          setCurrentSessionUser(data.session.user.email ?? email);
          onAuthSuccess();
          setTimeout(() => onNavigate('01_dashboard'), 1000);
        } else {
          setSuccessMsg('Registration submitted. Check your email for verification link if enabled.');
        }
      } else {
        const { data, error } = await client.auth.signInWithPassword({
          email,
          password
        });

        if (error) {
          setErrorMsg('Invalid login credentials. Please check your email and password.');
        } else if (data.session) {
          setSuccessMsg('Authentication successful! Loading live cloud workspace...');
          setCurrentSessionUser(data.session.user.email ?? email);
          onAuthSuccess();
          setTimeout(() => onNavigate('01_dashboard'), 1000);
        }
      }
    } catch (err: any) {
      setErrorMsg(err.message || 'An unexpected authentication error occurred.');
    } finally {
      setLoading(false);
    }
  };

  const handleSignOut = async () => {
    if (client) {
      setLoading(true);
      await client.auth.signOut();
      setCurrentSessionUser(null);
      setSuccessMsg('Signed out successfully. Operating in guest / local mode.');
      setLoading(false);
      onAuthSuccess();
    }
  };

  const setDemoCredentials = (roleEmail: string, name: string) => {
    setEmail(roleEmail);
    setPassword('ZaidTrading2024!');
    setFullName(name);
    setErrorMsg(null);
  };

  return (
    <div className="min-h-[calc(100vh-64px)] flex flex-col justify-between p-4 sm:p-6 md:p-8 bg-[#F8FAFC]">
      {/* Top Simple Brand Utility Bar (Matches Stitch Screen 38) */}
      <header className="w-full max-w-7xl mx-auto flex items-center justify-between py-2">
        <div className="flex items-center gap-2">
          <div className="w-8 h-8 rounded-lg bg-[#2563EB] flex items-center justify-center text-white shadow-sm">
            <span className="material-symbols-outlined text-[18px]">layers</span>
          </div>
          <div className="flex flex-col">
            <span className="text-sm font-bold tracking-tight text-[#0F172A] leading-tight">Zaid Trading ERP</span>
            <span className="text-[11px] text-[#64748B] font-medium leading-none">Distribution Suite (Screen 38)</span>
          </div>
        </div>
        
        <div className="flex items-center gap-2 text-xs text-[#64748B]">
          <span className="inline-flex items-center gap-1.5 px-2.5 py-1 rounded-full bg-slate-100 text-slate-700 border border-slate-200/80 font-medium">
            <span className="w-1.5 h-1.5 rounded-full bg-emerald-500"></span>
            Main Warehouse (MW-01)
          </span>
          <span className="hidden sm:inline text-slate-400">|</span>
          <span className="hidden sm:inline text-[11px] font-mono text-slate-500">Sri Lanka (LKR)</span>
        </div>
      </header>

      {/* Center Card Area */}
      <main className="w-full flex-1 flex items-center justify-center py-8">
        <div className="w-full max-w-[440px]">
          {/* Card Container */}
          <div className="bg-white rounded-xl border border-[#E2E8F0] shadow-sm p-7 sm:p-8">
            {/* Brand Header */}
            <div className="text-center mb-6">
              <div className="inline-flex items-center justify-center w-12 h-12 rounded-xl bg-blue-50 text-[#2563EB] border border-blue-100 mb-3.5">
                <span className="material-symbols-outlined text-[24px]">verified_user</span>
              </div>
              <h1 className="text-xl font-bold text-[#0F172A] tracking-tight">
                {currentSessionUser ? 'Active Session' : isSignUp ? 'Create ERP Account' : 'Wholesale ERP'}
              </h1>
              <p className="text-sm text-[#64748B] mt-1">
                {currentSessionUser 
                  ? `Authenticated as ${currentSessionUser}` 
                  : isSignUp ? 'Register new staff credentials' : 'Sign in to your cloud workspace'}
              </p>
            </div>

            {/* Success Banner */}
            {successMsg && (
              <div className="mb-5 p-3 rounded-lg bg-emerald-50 border border-emerald-200 flex items-start gap-2.5 text-xs text-emerald-800">
                <span className="material-symbols-outlined text-[16px] text-emerald-600 shrink-0">check_circle</span>
                <div>{successMsg}</div>
              </div>
            )}

            {/* Error Banner */}
            {errorMsg && (
              <div className="mb-5 p-3 rounded-lg bg-red-50 border border-red-200 flex items-start gap-2.5 text-xs text-red-800">
                <span className="material-symbols-outlined text-[16px] text-[#DC2626] shrink-0 mt-0.5">error</span>
                <div>
                  <span className="font-semibold text-red-900">Authentication Alert: </span>
                  <p className="mt-0.5 text-red-700">{errorMsg}</p>
                </div>
              </div>
            )}

            {currentSessionUser ? (
              <div className="space-y-4">
                <div className="p-3.5 bg-slate-50 border border-slate-200 rounded-lg text-xs space-y-1">
                  <div className="font-semibold text-slate-800">Active Supabase Session Connected</div>
                  <div className="text-slate-600">Your requests satisfy Row-Level Security (RLS) policies.</div>
                </div>
                <div className="flex gap-3">
                  <button
                    onClick={() => onNavigate('01_dashboard')}
                    className="flex-1 py-2.5 bg-[#2563EB] hover:bg-[#1D4ED8] text-white text-sm font-semibold rounded-lg shadow-sm cursor-pointer"
                  >
                    Go to Dashboard
                  </button>
                  <button
                    onClick={handleSignOut}
                    disabled={loading}
                    className="px-4 py-2.5 bg-slate-100 hover:bg-slate-200 text-slate-700 text-sm font-semibold rounded-lg cursor-pointer"
                  >
                    Sign Out
                  </button>
                </div>
              </div>
            ) : (
              <form onSubmit={handleSubmit} className="space-y-4">
                {isSignUp && (
                  <div>
                    <label className="block text-xs font-semibold text-[#0F172A] mb-1">Full Name</label>
                    <input
                      type="text"
                      required
                      value={fullName}
                      onChange={(e) => setFullName(e.target.value)}
                      placeholder="e.g. Kasun Perera"
                      className="w-full px-3 py-2 text-sm border border-[#E2E8F0] rounded-lg focus:outline-none focus:ring-2 focus:ring-[#2563EB] focus:border-transparent"
                    />
                  </div>
                )}

                <div>
                  <label className="block text-xs font-semibold text-[#0F172A] mb-1">Email Address</label>
                  <input
                    type="email"
                    required
                    value={email}
                    onChange={(e) => setEmail(e.target.value)}
                    placeholder="user@zaidtrading.lk"
                    className="w-full px-3 py-2 text-sm border border-[#E2E8F0] rounded-lg focus:outline-none focus:ring-2 focus:ring-[#2563EB] focus:border-transparent"
                  />
                </div>

                <div>
                  <div className="flex items-center justify-between mb-1">
                    <label className="text-xs font-semibold text-[#0F172A]">Password</label>
                    <button
                      type="button"
                      onClick={() => setErrorMsg('Please contact Mohamed Zaid (Admin) for password reset in the Supabase console.')}
                      className="text-[11px] text-[#2563EB] hover:underline"
                    >
                      Forgot?
                    </button>
                  </div>
                  <input
                    type="password"
                    required
                    value={password}
                    onChange={(e) => setPassword(e.target.value)}
                    placeholder="••••••••••••"
                    className="w-full px-3 py-2 text-sm border border-[#E2E8F0] rounded-lg focus:outline-none focus:ring-2 focus:ring-[#2563EB] focus:border-transparent"
                  />
                </div>

                <div className="flex items-center justify-between text-xs text-[#64748B]">
                  <label className="flex items-center gap-2 cursor-pointer">
                    <input
                      type="checkbox"
                      checked={rememberMe}
                      onChange={(e) => setRememberMe(e.target.checked)}
                      className="rounded border-[#CBD5E1] text-[#2563EB] focus:ring-[#2563EB]"
                    />
                    <span>Remember my session</span>
                  </label>
                  <span className="text-[11px] text-slate-400">PostgreSQL RLS Protected</span>
                </div>

                <button
                  type="submit"
                  disabled={loading}
                  className="w-full py-2.5 px-4 bg-[#2563EB] hover:bg-[#1D4ED8] active:bg-[#1E40AF] text-white text-sm font-semibold rounded-lg shadow-sm transition-all flex items-center justify-center gap-2 cursor-pointer disabled:opacity-50"
                >
                  {loading && <span className="material-symbols-outlined text-[16px] animate-spin">refresh</span>}
                  <span>{loading ? 'Authenticating...' : isSignUp ? 'Create Account' : 'Sign in'}</span>
                </button>

                <div className="pt-2 text-center text-xs text-[#64748B]">
                  {isSignUp ? (
                    <button
                      type="button"
                      onClick={() => { setIsSignUp(false); setErrorMsg(null); }}
                      className="text-[#2563EB] font-semibold hover:underline cursor-pointer"
                    >
                      Already have an account? Sign In
                    </button>
                  ) : (
                    <button
                      type="button"
                      onClick={() => { setIsSignUp(true); setErrorMsg(null); }}
                      className="text-[#2563EB] font-semibold hover:underline cursor-pointer"
                    >
                      Need a new staff account? Register here
                    </button>
                  )}
                </div>
              </form>
            )}

            {/* Quick Demo Staff Credentials Selector */}
            <div className="mt-6 pt-5 border-t border-[#E2E8F0]">
              <div className="text-[11px] font-semibold uppercase tracking-wider text-[#64748B] mb-2 text-center">
                Demo Quick-Fill Staff Credentials
              </div>
              <div className="grid grid-cols-3 gap-1.5 text-[11px]">
                <button
                  type="button"
                  onClick={() => setDemoCredentials('kasun@zaidtrading.lk', 'Kasun Perera')}
                  className="p-1.5 border border-slate-200 rounded-lg hover:bg-slate-50 text-center cursor-pointer"
                >
                  <div className="font-semibold text-slate-800">Kasun P.</div>
                  <div className="text-[10px] text-blue-600">Manager</div>
                </button>
                <button
                  type="button"
                  onClick={() => setDemoCredentials('zaid@zaidtrading.lk', 'Mohamed Zaid')}
                  className="p-1.5 border border-slate-200 rounded-lg hover:bg-slate-50 text-center cursor-pointer"
                >
                  <div className="font-semibold text-slate-800">M. Zaid</div>
                  <div className="text-[10px] text-purple-600">Admin</div>
                </button>
                <button
                  type="button"
                  onClick={() => setDemoCredentials('nimal@zaidtrading.lk', 'Nimal Fernando')}
                  className="p-1.5 border border-slate-200 rounded-lg hover:bg-slate-50 text-center cursor-pointer"
                >
                  <div className="font-semibold text-slate-800">Nimal F.</div>
                  <div className="text-[10px] text-slate-600">Cashier</div>
                </button>
              </div>
            </div>
          </div>
        </div>
      </main>

      {/* Footer */}
      <footer className="w-full max-w-7xl mx-auto py-3 text-center text-xs text-[#64748B]">
        Zaid Trading (Pvt) Ltd ERP &copy; 2024. Colombo, Sri Lanka.
      </footer>
    </div>
  );
};
