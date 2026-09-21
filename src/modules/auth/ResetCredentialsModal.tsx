import React, { useState } from 'react';
import { UserAccount } from '../../types';
import { KeyRound, ShieldAlert, CheckCircle2, Copy, Check, Sparkles, X, Eye, EyeOff } from 'lucide-react';
import { sounds } from '../../utils/audio';

interface ResetCredentialsModalProps {
  user: UserAccount;
  onClose: () => void;
  onSaveCredentials: (userId: string, newSecret: string, isPin: boolean, newUsername?: string) => void;
}

export default function ResetCredentialsModal({
  user,
  onClose,
  onSaveCredentials
}: ResetCredentialsModalProps) {
  const isStudent = user.role === 'student';
  
  const [pin, setPin] = useState(user.pin || '7392');
  const [username, setUsername] = useState(user.username || '');
  const [password, setPassword] = useState(user.password || 'FunLearn#2026!');
  const [showPassword, setShowPassword] = useState(false);
  const [copied, setCopied] = useState(false);
  const [savedSuccess, setSavedSuccess] = useState(false);

  // Generate random 4-digit PIN
  const handleGenerateRandomPin = () => {
    const randomPin = String(Math.floor(1000 + Math.random() * 9000));
    setPin(randomPin);
    sounds.playCorrect();
  };

  // Generate secure password
  const handleGenerateSecurePassword = () => {
    const adjectives = ['Bright', 'Super', 'Clever', 'Stellar', 'Quick', 'Learn'];
    const adj = adjectives[Math.floor(Math.random() * adjectives.length)];
    const num = Math.floor(100 + Math.random() * 900);
    const newPwd = `${adj}#${num}!`;
    setPassword(newPwd);
    sounds.playCorrect();
  };

  const handleCopy = () => {
    const textToCopy = isStudent 
      ? `Student Username: ${username}\nLogin PIN: ${pin}` 
      : `Email/Login: ${user.email || user.username}\nPassword: ${password}`;
    navigator.clipboard.writeText(textToCopy);
    setCopied(true);
    setTimeout(() => setCopied(false), 2500);
  };

  const handleSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    if (isStudent) {
      if (!/^\d{4}$/.test(pin)) {
        alert('PIN must be exactly 4 digits (e.g. 7392).');
        return;
      }
      onSaveCredentials(user.id, pin, true, username.trim());
    } else {
      if (!password.trim() || password.length < 6) {
        alert('Password must be at least 6 characters long.');
        return;
      }
      onSaveCredentials(user.id, password.trim(), false);
    }

    sounds.playLevelUp();
    setSavedSuccess(true);
    setTimeout(() => {
      onClose();
    }, 1200);
  };

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-stone-950/75 backdrop-blur-xs">
      <div className="bg-white rounded-3xl border border-stone-200 shadow-2xl max-w-md w-full p-6 space-y-5 text-stone-900 animate-in fade-in zoom-in-95 duration-200">
        {/* Header */}
        <div className="flex items-center justify-between pb-3 border-b border-stone-100">
          <div className="flex items-center gap-2.5">
            <div className="w-10 h-10 rounded-xl bg-amber-50 border border-amber-200 text-amber-600 flex items-center justify-center text-lg">
              <KeyRound className="w-5 h-5" />
            </div>
            <div>
              <h3 className="text-sm font-black text-stone-900">
                {isStudent ? 'Reset Student Login PIN' : 'Reset Account Password'}
              </h3>
              <p className="text-[11px] text-stone-500 font-medium">
                Update access credentials for {user.name} ({user.role})
              </p>
            </div>
          </div>
          <button
            onClick={onClose}
            className="text-stone-400 hover:text-stone-900 cursor-pointer p-1 rounded-lg"
          >
            <X className="w-4 h-4" />
          </button>
        </div>

        {/* User Badge Info */}
        <div className="p-3 rounded-2xl bg-stone-50 border border-stone-200 flex items-center justify-between text-xs">
          <div className="flex items-center gap-2.5">
            <span className="text-2xl">{user.avatar}</span>
            <div>
              <div className="font-bold text-stone-900">{user.name}</div>
              <div className="text-[10px] text-stone-500 font-mono">ID: {user.id}</div>
            </div>
          </div>
          <span className="px-2.5 py-1 rounded-full text-[10px] font-black uppercase tracking-wider bg-stone-200 text-stone-800">
            {user.role}
          </span>
        </div>

        {savedSuccess ? (
          <div className="p-6 text-center space-y-2 bg-emerald-50 rounded-2xl border border-emerald-200 text-emerald-950 animate-in fade-in">
            <CheckCircle2 className="w-8 h-8 text-emerald-600 mx-auto" />
            <h4 className="font-black text-sm text-emerald-900">Credentials Updated Successfully!</h4>
            <p className="text-xs text-emerald-800">
              {isStudent ? `New PIN (${pin}) is active immediately.` : `New password saved successfully.`}
            </p>
          </div>
        ) : (
          <form onSubmit={handleSubmit} className="space-y-4 text-xs">
            {isStudent ? (
              <>
                <div>
                  <label className="block text-[11px] font-bold text-stone-700 uppercase tracking-wider mb-1">
                    Student Username
                  </label>
                  <input
                    type="text"
                    value={username}
                    onChange={(e) => setUsername(e.target.value.toUpperCase())}
                    className="w-full p-2.5 rounded-xl border border-stone-200 font-mono font-bold text-sm uppercase focus:border-amber-500 outline-none"
                    placeholder="e.g. STU_ALEX"
                    required
                  />
                  <p className="text-[10px] text-stone-400 mt-1">
                    Students use their Username + 4-digit PIN to sign in.
                  </p>
                </div>

                <div>
                  <div className="flex items-center justify-between mb-1">
                    <label className="text-[11px] font-bold text-stone-700 uppercase tracking-wider">
                      4-Digit Login PIN
                    </label>
                    <button
                      type="button"
                      onClick={handleGenerateRandomPin}
                      className="text-[11px] text-indigo-600 hover:text-indigo-800 font-bold flex items-center gap-1 cursor-pointer"
                    >
                      <Sparkles className="w-3 h-3" />
                      <span>Randomize PIN</span>
                    </button>
                  </div>
                  <input
                    type="text"
                    maxLength={4}
                    value={pin}
                    onChange={(e) => setPin(e.target.value.replace(/\D/g, '').slice(0, 4))}
                    className="w-full p-2.5 rounded-xl border border-stone-200 font-mono font-black text-center text-xl tracking-widest text-stone-900 focus:border-amber-500 outline-none bg-amber-50/50"
                    placeholder="7392"
                    required
                  />
                  <p className="text-[10px] text-stone-400 mt-1 text-center">
                    A simple 4-digit code designed for child memory & touchscreens.
                  </p>
                </div>
              </>
            ) : (
              <>
                <div>
                  <label className="block text-[11px] font-bold text-stone-700 uppercase tracking-wider mb-1">
                    Login Identifier
                  </label>
                  <input
                    type="text"
                    disabled
                    value={user.email || user.username || user.id}
                    className="w-full p-2.5 rounded-xl border border-stone-200 bg-stone-100 text-stone-600 font-mono text-xs cursor-not-allowed"
                  />
                </div>

                <div>
                  <div className="flex items-center justify-between mb-1">
                    <label className="text-[11px] font-bold text-stone-700 uppercase tracking-wider">
                      New Password
                    </label>
                    <button
                      type="button"
                      onClick={handleGenerateSecurePassword}
                      className="text-[11px] text-indigo-600 hover:text-indigo-800 font-bold flex items-center gap-1 cursor-pointer"
                    >
                      <Sparkles className="w-3 h-3" />
                      <span>Generate Secure Temp</span>
                    </button>
                  </div>
                  <div className="relative">
                    <input
                      type={showPassword ? 'text' : 'password'}
                      value={password}
                      onChange={(e) => setPassword(e.target.value)}
                      className="w-full p-2.5 pr-10 rounded-xl border border-stone-200 font-mono text-sm text-stone-900 focus:border-amber-500 outline-none"
                      placeholder="Enter new password"
                      required
                      minLength={6}
                    />
                    <button
                      type="button"
                      onClick={() => setShowPassword(!showPassword)}
                      className="absolute right-2.5 top-1/2 -translate-y-1/2 text-stone-400 hover:text-stone-700 cursor-pointer"
                    >
                      {showPassword ? <EyeOff className="w-4 h-4" /> : <Eye className="w-4 h-4" />}
                    </button>
                  </div>
                </div>
              </>
            )}

            {/* Quick Copy Credentials Button */}
            <div className="pt-1">
              <button
                type="button"
                onClick={handleCopy}
                className="w-full py-2 rounded-xl bg-stone-100 hover:bg-stone-200 text-stone-700 font-bold flex items-center justify-center gap-1.5 transition cursor-pointer"
              >
                {copied ? <Check className="w-3.5 h-3.5 text-emerald-600" /> : <Copy className="w-3.5 h-3.5" />}
                <span>{copied ? 'Copied to Clipboard!' : 'Copy Credentials to Share'}</span>
              </button>
            </div>

            <div className="pt-3 border-t border-stone-100 flex items-center justify-end gap-2">
              <button
                type="button"
                onClick={onClose}
                className="px-4 py-2 rounded-xl bg-stone-100 hover:bg-stone-200 text-stone-700 font-bold transition cursor-pointer"
              >
                Cancel
              </button>
              <button
                type="submit"
                className="px-5 py-2 rounded-xl bg-amber-600 hover:bg-amber-700 text-white font-bold transition cursor-pointer shadow-xs"
              >
                Save New Credentials
              </button>
            </div>
          </form>
        )}
      </div>
    </div>
  );
}
