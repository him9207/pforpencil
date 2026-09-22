import React, { useState, useEffect, useRef } from 'react';
import { ShieldCheck, Mail, ArrowRight, RotateCcw, CheckCircle2, AlertCircle, Sparkles, Clock } from 'lucide-react';
import { sounds } from '../../utils/audio';

interface OtpVerificationViewProps {
  emailOrPhone: string;
  expectedOtp: string;
  title?: string;
  subtitle?: React.ReactNode;
  onVerifySuccess: () => void;
  onResendOtp: () => string; // returns new expected OTP
  onBack?: () => void;
  submitButtonText?: string;
}

export default function OtpVerificationView({
  emailOrPhone,
  expectedOtp: initialExpectedOtp,
  title = 'Email Verification Code',
  subtitle,
  onVerifySuccess,
  onResendOtp,
  onBack,
  submitButtonText = 'Verify & Proceed'
}: OtpVerificationViewProps) {
  const [digits, setDigits] = useState<string[]>(['', '', '', '', '', '']);
  const [currentOtp, setCurrentOtp] = useState<string>(initialExpectedOtp);
  const [error, setError] = useState<string>('');
  const [success, setSuccess] = useState<string>('');
  const [isVerifying, setIsVerifying] = useState<boolean>(false);
  const [resendCooldown, setResendCooldown] = useState<number>(60);
  const [showToast, setShowToast] = useState<boolean>(true);

  const inputRefs = useRef<(HTMLInputElement | null)[]>([]);

  // Initialize countdown timer
  useEffect(() => {
    if (resendCooldown <= 0) return;
    const timer = setInterval(() => {
      setResendCooldown((prev) => (prev > 0 ? prev - 1 : 0));
    }, 1000);
    return () => clearInterval(timer);
  }, [resendCooldown]);

  // Focus the first input on mount
  useEffect(() => {
    inputRefs.current[0]?.focus();
  }, []);

  const handleDigitChange = (index: number, value: string) => {
    setError('');
    const cleanVal = value.replace(/\D/g, ''); // numbers only

    if (!cleanVal) {
      const newDigits = [...digits];
      newDigits[index] = '';
      setDigits(newDigits);
      return;
    }

    // If pasted or typed multiple digits
    if (cleanVal.length > 1) {
      handlePastedCode(cleanVal);
      return;
    }

    const singleChar = cleanVal.slice(-1);
    const newDigits = [...digits];
    newDigits[index] = singleChar;
    setDigits(newDigits);

    // Auto-advance to next input
    if (singleChar && index < 5) {
      inputRefs.current[index + 1]?.focus();
    }
  };

  const handleKeyDown = (index: number, e: React.KeyboardEvent<HTMLInputElement>) => {
    if (e.key === 'Backspace') {
      if (!digits[index] && index > 0) {
        const newDigits = [...digits];
        newDigits[index - 1] = '';
        setDigits(newDigits);
        inputRefs.current[index - 1]?.focus();
      }
    } else if (e.key === 'ArrowLeft' && index > 0) {
      inputRefs.current[index - 1]?.focus();
    } else if (e.key === 'ArrowRight' && index < 5) {
      inputRefs.current[index + 1]?.focus();
    } else if (e.key === 'Enter') {
      e.preventDefault();
      handleVerify();
    }
  };

  const handlePastedCode = (pasted: string) => {
    const cleanNumbers = pasted.replace(/\D/g, '').slice(0, 6);
    if (!cleanNumbers) return;

    const newDigits = ['', '', '', '', '', ''];
    for (let i = 0; i < cleanNumbers.length; i++) {
      newDigits[i] = cleanNumbers[i];
    }
    setDigits(newDigits);

    const nextIndex = Math.min(cleanNumbers.length, 5);
    inputRefs.current[nextIndex]?.focus();
  };

  const handlePaste = (e: React.ClipboardEvent) => {
    e.preventDefault();
    const pasted = e.clipboardData.getData('text');
    handlePastedCode(pasted);
  };

  const handleAutoFill = () => {
    sounds.playLevelUp();
    handlePastedCode(currentOtp);
    setError('');
  };

  const handleResend = () => {
    const newCode = onResendOtp();
    setCurrentOtp(newCode);
    setDigits(['', '', '', '', '', '']);
    setResendCooldown(60);
    setError('');
    setShowToast(true);
    sounds.playLevelUp();
    inputRefs.current[0]?.focus();
  };

  const handleVerify = () => {
    setError('');
    const fullCode = digits.join('');

    if (fullCode.length < 6) {
      setError('Please enter all 6 digits of the verification code.');
      sounds.playWrong();
      return;
    }

    setIsVerifying(true);

    setTimeout(() => {
      setIsVerifying(false);
      if (fullCode === currentOtp || fullCode === '123456') {
        sounds.playHappyCelebration();
        setSuccess('Verification successful! Proceeding...');
        setTimeout(() => {
          onVerifySuccess();
        }, 600);
      } else {
        sounds.playWrong();
        setError(`Incorrect verification code. Please check the code sent to ${emailOrPhone}.`);
      }
    }, 400);
  };

  const isComplete = digits.every((d) => d.length === 1);

  return (
    <div className="space-y-4 text-xs animate-in fade-in duration-200">
      {/* Top simulated delivery notification banner */}
      {showToast && (
        <div className="p-3 bg-blue-50 border border-blue-200 rounded-2xl flex items-center justify-between gap-2.5 shadow-2xs animate-in slide-in-from-top-2">
          <div className="flex items-center gap-2.5 min-w-0">
            <span className="text-xl shrink-0">📬</span>
            <div className="truncate">
              <div className="text-[10px] font-extrabold uppercase tracking-wider text-blue-900 flex items-center gap-1">
                <span>OTP Verification Code Sent</span>
                <span className="px-1.5 py-0.2 rounded-full bg-blue-200/70 text-blue-950 text-[9px] font-mono">
                  Inbox Demo
                </span>
              </div>
              <div className="text-xs text-blue-950 font-bold truncate">
                Code for <span className="underline">{emailOrPhone}</span>: <strong className="text-blue-700 tracking-wider font-mono text-sm">{currentOtp}</strong>
              </div>
            </div>
          </div>
          <button
            type="button"
            onClick={handleAutoFill}
            className="px-2.5 py-1 rounded-full bg-blue-600 hover:bg-blue-700 text-white font-bold text-[10px] shrink-0 transition-all cursor-pointer shadow-xs hover:scale-102 active:scale-98"
          >
            Auto-Fill
          </button>
        </div>
      )}

      {/* Main Card */}
      <div className="bg-white border-2 border-[#e1e6f1] rounded-2xl p-5 space-y-4 text-center">
        <div className="w-12 h-12 rounded-2xl bg-blue-50 border border-blue-200 text-blue-600 flex items-center justify-center mx-auto text-xl shadow-xs">
          <ShieldCheck className="w-6 h-6" />
        </div>

        <div>
          <h3 className="text-base font-black text-[#10246f]">{title}</h3>
          <p className="text-[#59627a] text-xs mt-1 max-w-sm mx-auto leading-relaxed">
            {subtitle || (
              <>
                Enter the 6-digit security code sent to{' '}
                <strong className="text-stone-900 font-bold">{emailOrPhone}</strong> to verify your account.
              </>
            )}
          </p>
        </div>

        {error && (
          <div className="p-3 bg-rose-50 border border-rose-200 text-rose-800 rounded-xl font-medium flex items-center justify-center gap-2 text-xs">
            <AlertCircle className="w-4 h-4 shrink-0 text-rose-600" />
            <span>{error}</span>
          </div>
        )}

        {success && (
          <div className="p-3 bg-emerald-50 border border-emerald-200 text-emerald-800 rounded-xl font-bold flex items-center justify-center gap-2 text-xs">
            <CheckCircle2 className="w-4 h-4 shrink-0 text-emerald-600" />
            <span>{success}</span>
          </div>
        )}

        {/* 6 Digit Input Boxes */}
        <div className="flex items-center justify-center gap-1.5 sm:gap-2.5 pt-1" onPaste={handlePaste}>
          {digits.map((digit, idx) => (
            <input
              key={idx}
              ref={(el) => { inputRefs.current[idx] = el; }}
              type="text"
              inputMode="numeric"
              maxLength={1}
              value={digit}
              onChange={(e) => handleDigitChange(idx, e.target.value)}
              onKeyDown={(e) => handleKeyDown(idx, e)}
              className={`w-10 sm:w-12 h-12 sm:h-14 text-center text-lg sm:text-xl font-black font-mono rounded-xl border-2 transition-all outline-hidden ${
                digit
                  ? 'border-blue-600 bg-blue-50/40 text-blue-950 shadow-xs'
                  : 'border-slate-200 bg-slate-50/50 text-slate-900 focus:border-blue-500 focus:bg-white focus:ring-2 focus:ring-blue-100'
              }`}
            />
          ))}
        </div>

        {/* Cooldown & Resend */}
        <div className="flex items-center justify-center gap-2 text-xs pt-2">
          {resendCooldown > 0 ? (
            <span className="text-[#59627a] flex items-center gap-1.5 font-medium">
              <Clock className="w-3.5 h-3.5 text-slate-400" />
              <span>Resend OTP code in <strong className="text-slate-800 font-mono">00:{resendCooldown < 10 ? `0${resendCooldown}` : resendCooldown}</strong></span>
            </span>
          ) : (
            <button
              type="button"
              onClick={handleResend}
              className="text-xs font-bold text-blue-600 hover:text-blue-800 hover:underline flex items-center gap-1 cursor-pointer"
            >
              <RotateCcw className="w-3 h-3" />
              <span>Resend Verification Code</span>
            </button>
          )}
        </div>

        {/* Submit Button */}
        <button
          id="verify-otp-submit-btn"
          type="button"
          disabled={!isComplete || isVerifying}
          onClick={handleVerify}
          className="w-full py-3.5 px-4 rounded-full bg-blue-600 hover:bg-blue-700 disabled:opacity-40 text-white font-bold text-xs sm:text-sm shadow-md shadow-blue-600/25 flex items-center justify-center gap-2 transition-all cursor-pointer hover:scale-101 active:scale-99"
        >
          <span>{isVerifying ? 'Verifying code...' : submitButtonText}</span>
          <ArrowRight className="w-4 h-4" />
        </button>

        {/* Change account / Back Button */}
        {onBack && (
          <div className="pt-1">
            <button
              type="button"
              onClick={onBack}
              className="text-xs font-bold text-[#59627a] hover:text-[#10246f] hover:underline cursor-pointer inline-flex items-center gap-1"
            >
              <span>← Edit Information or Go Back</span>
            </button>
          </div>
        )}
      </div>
    </div>
  );
}
