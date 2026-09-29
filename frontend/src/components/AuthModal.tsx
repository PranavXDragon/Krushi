import React, { useState } from 'react';
import { 
  X, 
  Sprout, 
  Truck, 
  ShieldCheck, 
  ShoppingBag, 
  Mail, 
  Lock, 
  User as UserIcon, 
  Phone, 
  Building, 
  Eye, 
  EyeOff, 
  ArrowRight,
  CheckCircle2,
  Sparkles
} from 'lucide-react';
import { api } from '../services/api';

export interface AuthUser {
  id: string;
  name: string;
  email: string;
  role: string;
  phone?: string;
  organization?: string;
  created_at: string;
}

interface AuthModalProps {
  isOpen: boolean;
  onClose: () => void;
  onAuthSuccess: (user: AuthUser, token: string) => void;
  onShowToast: (msg: string, type?: 'success' | 'warning' | 'error' | 'info') => void;
  initialMode?: 'signin' | 'signup';
}

export const AuthModal: React.FC<AuthModalProps> = ({
  isOpen,
  onClose,
  onAuthSuccess,
  onShowToast,
  initialMode = 'signin'
}) => {
  const [mode, setMode] = useState<'signin' | 'signup'>(initialMode);
  const [showPassword, setShowPassword] = useState(false);
  const [loading, setLoading] = useState(false);
  const [errorMsg, setErrorMsg] = useState<string | null>(null);

  // Sign In form
  const [signInEmail, setSignInEmail] = useState('');
  const [signInPassword, setSignInPassword] = useState('');

  // Sign Up form
  const [name, setName] = useState('');
  const [email, setEmail] = useState('');
  const [password, setPassword] = useState('');
  const [phone, setPhone] = useState('');
  const [organization, setOrganization] = useState('');
  const [role, setRole] = useState<'FARMER' | 'LOGISTICS' | 'INSPECTOR' | 'BUYER'>('FARMER');

  if (!isOpen) return null;

  const handleSignIn = async (e: React.FormEvent) => {
    e.preventDefault();
    setErrorMsg(null);
    setLoading(true);
    try {
      const res = await api.signIn({
        email: signInEmail.trim(),
        password: signInPassword
      });
      onShowToast(`Welcome back, ${res.user.name}!`, 'success');
      onAuthSuccess(res.user, res.token);
      onClose();
    } catch (err: any) {
      setErrorMsg(err.message || 'Invalid email or password.');
    } finally {
      setLoading(false);
    }
  };

  const handleSignUp = async (e: React.FormEvent) => {
    e.preventDefault();
    setErrorMsg(null);

    if (!name.trim()) {
      setErrorMsg('Please enter your full name.');
      return;
    }
    if (!email.trim()) {
      setErrorMsg('Please enter a valid email address.');
      return;
    }
    if (password.length < 6) {
      setErrorMsg('Password must be at least 6 characters.');
      return;
    }

    setLoading(true);
    try {
      const res = await api.signUp({
        name: name.trim(),
        email: email.trim(),
        password,
        role,
        phone: phone.trim() || undefined,
        organization: organization.trim() || undefined
      });
      onShowToast(`Account created successfully! Welcome, ${res.user.name}.`, 'success');
      onAuthSuccess(res.user, res.token);
      onClose();
    } catch (err: any) {
      setErrorMsg(err.message || 'Could not register user account.');
    } finally {
      setLoading(false);
    }
  };

  const handleDemoLogin = async (demoEmail: string) => {
    setErrorMsg(null);
    setLoading(true);
    try {
      const res = await api.signIn({
        email: demoEmail,
        password: 'krushi2026'
      });
      onShowToast(`Signed in as ${res.user.name} (${res.user.role})`, 'success');
      onAuthSuccess(res.user, res.token);
      onClose();
    } catch (err: any) {
      setErrorMsg(err.message || 'Demo login failed.');
    } finally {
      setLoading(false);
    }
  };

  return (
    <div className="fixed inset-0 z-50 bg-slate-900/60 backdrop-blur-xs flex items-center justify-center p-4 overflow-y-auto">
      <div className="bg-white rounded-3xl p-6 sm:p-8 max-w-lg w-full shadow-2xl border border-slate-200 relative animate-in fade-in zoom-in-95 duration-200">
        
        {/* Close Button */}
        <button
          onClick={onClose}
          className="w-8 h-8 rounded-full bg-slate-100 hover:bg-slate-200 text-slate-400 hover:text-slate-800 flex items-center justify-center absolute right-5 top-5 transition cursor-pointer"
        >
          <X className="w-4 h-4" />
        </button>

        {/* Modal Header */}
        <div className="flex items-center gap-3 mb-6">
          <div className="w-12 h-12 rounded-2xl bg-emerald-50 border border-emerald-100 flex items-center justify-center text-emerald-600 shadow-xs flex-shrink-0">
            <Sprout className="w-6 h-6 text-emerald-600" />
          </div>
          <div>
            <div className="flex items-center gap-2">
              <h2 className="text-xl font-extrabold text-slate-900 font-['Outfit']">Krushi Kisan Trace</h2>
              <span className="text-[10px] font-bold px-2 py-0.5 rounded-full bg-emerald-100 text-emerald-800 uppercase tracking-wider">
                Identity
              </span>
            </div>
            <p className="text-xs text-slate-500 mt-0.5">National Cold-Chain Provenance & IoT Telematics Portal</p>
          </div>
        </div>

        {/* Mode Toggle Switcher */}
        <div className="flex rounded-xl bg-slate-100 p-1 mb-6">
          <button
            type="button"
            onClick={() => {
              setMode('signin');
              setErrorMsg(null);
            }}
            className={`flex-1 py-2 text-xs font-bold rounded-lg transition ${
              mode === 'signin' 
                ? 'bg-white text-slate-900 shadow-xs' 
                : 'text-slate-500 hover:text-slate-800'
            }`}
          >
            Sign In
          </button>
          <button
            type="button"
            onClick={() => {
              setMode('signup');
              setErrorMsg(null);
            }}
            className={`flex-1 py-2 text-xs font-bold rounded-lg transition ${
              mode === 'signup' 
                ? 'bg-white text-slate-900 shadow-xs' 
                : 'text-slate-500 hover:text-slate-800'
            }`}
          >
            Create Account
          </button>
        </div>

        {/* Error Alert Banner */}
        {errorMsg && (
          <div className="mb-4 p-3 rounded-xl bg-rose-50 border border-rose-200 text-rose-700 text-xs font-semibold">
            {errorMsg}
          </div>
        )}

        {/* ================= SIGN IN VIEW ================= */}
        {mode === 'signin' && (
          <form onSubmit={handleSignIn} className="space-y-4">
            <div>
              <label className="text-[11px] font-bold text-slate-600 uppercase tracking-wider block mb-1">
                Email Address
              </label>
              <div className="relative">
                <input
                  type="email"
                  required
                  placeholder="e.g. rajesh.patil@kisan.in"
                  value={signInEmail}
                  onChange={(e) => setSignInEmail(e.target.value)}
                  className="w-full pl-9 pr-3 py-2.5 rounded-xl border border-slate-200 text-xs font-medium text-slate-800 focus:outline-none focus:ring-2 focus:ring-emerald-500/20 focus:border-emerald-600 transition"
                />
                <Mail className="w-4 h-4 text-slate-400 absolute left-3 top-1/2 -translate-y-1/2" />
              </div>
            </div>

            <div>
              <label className="text-[11px] font-bold text-slate-600 uppercase tracking-wider block mb-1">
                Password
              </label>
              <div className="relative">
                <input
                  type={showPassword ? 'text' : 'password'}
                  required
                  placeholder="Enter password"
                  value={signInPassword}
                  onChange={(e) => setSignInPassword(e.target.value)}
                  className="w-full pl-9 pr-10 py-2.5 rounded-xl border border-slate-200 text-xs font-medium text-slate-800 focus:outline-none focus:ring-2 focus:ring-emerald-500/20 focus:border-emerald-600 transition"
                />
                <Lock className="w-4 h-4 text-slate-400 absolute left-3 top-1/2 -translate-y-1/2" />
                <button
                  type="button"
                  onClick={() => setShowPassword(!showPassword)}
                  className="absolute right-3 top-1/2 -translate-y-1/2 text-slate-400 hover:text-slate-600"
                >
                  {showPassword ? <EyeOff className="w-4 h-4" /> : <Eye className="w-4 h-4" />}
                </button>
              </div>
            </div>

            <button
              type="submit"
              disabled={loading}
              className="w-full py-3 rounded-xl bg-emerald-600 hover:bg-emerald-700 text-white font-bold text-xs shadow-xs transition flex items-center justify-center gap-2 cursor-pointer disabled:opacity-50"
            >
              <span>{loading ? 'Signing in...' : 'Sign In to Portal'}</span>
              <ArrowRight className="w-4 h-4" />
            </button>

            {/* Quick 1-Click Demo Profiles */}
            <div className="pt-4 border-t border-slate-100">
              <div className="flex items-center justify-between mb-2">
                <span className="text-[10px] font-bold text-slate-400 uppercase tracking-wider">
                  Quick 1-Click Demo Logins
                </span>
                <Sparkles className="w-3 h-3 text-amber-500" />
              </div>

              <div className="grid grid-cols-3 gap-2">
                <button
                  type="button"
                  onClick={() => handleDemoLogin('rajesh.patil@kisan.in')}
                  className="p-2 rounded-xl bg-slate-50 hover:bg-emerald-50 text-left border border-slate-200 hover:border-emerald-200 transition group"
                >
                  <div className="flex items-center gap-1.5 text-slate-700 group-hover:text-emerald-700">
                    <Sprout className="w-3.5 h-3.5 text-emerald-600 flex-shrink-0" />
                    <span className="text-[11px] font-bold truncate">Farmer</span>
                  </div>
                  <span className="text-[10px] text-slate-400 block truncate mt-0.5">R. Patil</span>
                </button>

                <button
                  type="button"
                  onClick={() => handleDemoLogin('transport@kisancold.in')}
                  className="p-2 rounded-xl bg-slate-50 hover:bg-teal-50 text-left border border-slate-200 hover:border-teal-200 transition group"
                >
                  <div className="flex items-center gap-1.5 text-slate-700 group-hover:text-teal-700">
                    <Truck className="w-3.5 h-3.5 text-teal-600 flex-shrink-0" />
                    <span className="text-[11px] font-bold truncate">Logistics</span>
                  </div>
                  <span className="text-[10px] text-slate-400 block truncate mt-0.5">KisanCold</span>
                </button>

                <button
                  type="button"
                  onClick={() => handleDemoLogin('inspector.mehta@apeda.gov.in')}
                  className="p-2 rounded-xl bg-slate-50 hover:bg-purple-50 text-left border border-slate-200 hover:border-purple-200 transition group"
                >
                  <div className="flex items-center gap-1.5 text-slate-700 group-hover:text-purple-700">
                    <ShieldCheck className="w-3.5 h-3.5 text-purple-600 flex-shrink-0" />
                    <span className="text-[11px] font-bold truncate">Inspector</span>
                  </div>
                  <span className="text-[10px] text-slate-400 block truncate mt-0.5">APEDA Govt</span>
                </button>
              </div>
            </div>
          </form>
        )}

        {/* ================= SIGN UP VIEW ================= */}
        {mode === 'signup' && (
          <form onSubmit={handleSignUp} className="space-y-3.5">
            {/* Role Selection */}
            <div>
              <label className="text-[11px] font-bold text-slate-600 uppercase tracking-wider block mb-1.5">
                Select Your Role in Cold-Chain
              </label>
              <div className="grid grid-cols-2 gap-2">
                {[
                  { id: 'FARMER', label: 'Farmer / Co-op', icon: Sprout, desc: 'Produce origin & seals' },
                  { id: 'LOGISTICS', label: 'Fleet Carrier', icon: Truck, desc: 'Reefer trucks & GPS' },
                  { id: 'INSPECTOR', label: 'APEDA Inspector', icon: ShieldCheck, desc: 'Quality audit & safety' },
                  { id: 'BUYER', label: 'Mandi Buyer', icon: ShoppingBag, desc: 'Intake & provenance' }
                ].map(r => {
                  const Icon = r.icon;
                  const isSelected = role === r.id;
                  return (
                    <button
                      key={r.id}
                      type="button"
                      onClick={() => setRole(r.id as any)}
                      className={`p-2.5 rounded-xl border text-left transition flex items-start gap-2.5 ${
                        isSelected 
                          ? 'bg-emerald-50/80 border-emerald-500 ring-2 ring-emerald-500/20' 
                          : 'bg-slate-50 border-slate-200 hover:bg-slate-100/60'
                      }`}
                    >
                      <div className={`w-7 h-7 rounded-lg flex items-center justify-center flex-shrink-0 ${
                        isSelected ? 'bg-emerald-600 text-white' : 'bg-slate-200 text-slate-600'
                      }`}>
                        <Icon className="w-3.5 h-3.5" />
                      </div>
                      <div className="min-w-0">
                        <span className="text-xs font-bold text-slate-800 block truncate leading-tight">
                          {r.label}
                        </span>
                        <span className="text-[10px] text-slate-400 block truncate mt-0.5">
                          {r.desc}
                        </span>
                      </div>
                    </button>
                  );
                })}
              </div>
            </div>

            {/* Full Name */}
            <div>
              <label className="text-[11px] font-bold text-slate-600 uppercase tracking-wider block mb-1">
                Full Name
              </label>
              <div className="relative">
                <input
                  type="text"
                  required
                  placeholder="e.g. Ramesh Deshmukh"
                  value={name}
                  onChange={(e) => setName(e.target.value)}
                  className="w-full pl-9 pr-3 py-2 rounded-xl border border-slate-200 text-xs font-medium text-slate-800 focus:outline-none focus:ring-2 focus:ring-emerald-500/20 focus:border-emerald-600 transition"
                />
                <UserIcon className="w-4 h-4 text-slate-400 absolute left-3 top-1/2 -translate-y-1/2" />
              </div>
            </div>

            {/* Email & Phone Row */}
            <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
              <div>
                <label className="text-[11px] font-bold text-slate-600 uppercase tracking-wider block mb-1">
                  Email
                </label>
                <div className="relative">
                  <input
                    type="email"
                    required
                    placeholder="name@domain.com"
                    value={email}
                    onChange={(e) => setEmail(e.target.value)}
                    className="w-full pl-9 pr-3 py-2 rounded-xl border border-slate-200 text-xs font-medium text-slate-800 focus:outline-none focus:ring-2 focus:ring-emerald-500/20 focus:border-emerald-600 transition"
                  />
                  <Mail className="w-4 h-4 text-slate-400 absolute left-3 top-1/2 -translate-y-1/2" />
                </div>
              </div>

              <div>
                <label className="text-[11px] font-bold text-slate-600 uppercase tracking-wider block mb-1">
                  Phone (Optional)
                </label>
                <div className="relative">
                  <input
                    type="tel"
                    placeholder="+91 98XXX XXXXX"
                    value={phone}
                    onChange={(e) => setPhone(e.target.value)}
                    className="w-full pl-9 pr-3 py-2 rounded-xl border border-slate-200 text-xs font-medium text-slate-800 focus:outline-none focus:ring-2 focus:ring-emerald-500/20 focus:border-emerald-600 transition"
                  />
                  <Phone className="w-4 h-4 text-slate-400 absolute left-3 top-1/2 -translate-y-1/2" />
                </div>
              </div>
            </div>

            {/* Cooperative / Organization */}
            <div>
              <label className="text-[11px] font-bold text-slate-600 uppercase tracking-wider block mb-1">
                Organization / Co-op Name
              </label>
              <div className="relative">
                <input
                  type="text"
                  placeholder="e.g. Ratnagiri Alphonso Farmers Co-op"
                  value={organization}
                  onChange={(e) => setOrganization(e.target.value)}
                  className="w-full pl-9 pr-3 py-2 rounded-xl border border-slate-200 text-xs font-medium text-slate-800 focus:outline-none focus:ring-2 focus:ring-emerald-500/20 focus:border-emerald-600 transition"
                />
                <Building className="w-4 h-4 text-slate-400 absolute left-3 top-1/2 -translate-y-1/2" />
              </div>
            </div>

            {/* Password */}
            <div>
              <label className="text-[11px] font-bold text-slate-600 uppercase tracking-wider block mb-1">
                Create Password
              </label>
              <div className="relative">
                <input
                  type={showPassword ? 'text' : 'password'}
                  required
                  placeholder="At least 6 characters"
                  value={password}
                  onChange={(e) => setPassword(e.target.value)}
                  className="w-full pl-9 pr-10 py-2 rounded-xl border border-slate-200 text-xs font-medium text-slate-800 focus:outline-none focus:ring-2 focus:ring-emerald-500/20 focus:border-emerald-600 transition"
                />
                <Lock className="w-4 h-4 text-slate-400 absolute left-3 top-1/2 -translate-y-1/2" />
                <button
                  type="button"
                  onClick={() => setShowPassword(!showPassword)}
                  className="absolute right-3 top-1/2 -translate-y-1/2 text-slate-400 hover:text-slate-600"
                >
                  {showPassword ? <EyeOff className="w-4 h-4" /> : <Eye className="w-4 h-4" />}
                </button>
              </div>
            </div>

            <button
              type="submit"
              disabled={loading}
              className="w-full py-3 rounded-xl bg-emerald-600 hover:bg-emerald-700 text-white font-bold text-xs shadow-xs transition flex items-center justify-center gap-2 cursor-pointer disabled:opacity-50 mt-2"
            >
              <span>{loading ? 'Creating Account...' : 'Complete Registration'}</span>
              <CheckCircle2 className="w-4 h-4" />
            </button>
          </form>
        )}

      </div>
    </div>
  );
};
