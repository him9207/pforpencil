import React, { useState, FormEvent } from 'react';
import { SchoolOrganization } from '../../../types';
import { X, Building2, Calendar, ShieldCheck, CreditCard, Sparkles, Check } from 'lucide-react';

interface SchoolSubscriptionModalProps {
  school: SchoolOrganization;
  onClose: () => void;
  onSave: (updated: SchoolOrganization) => void;
}

export default function SchoolSubscriptionModal({
  school,
  onClose,
  onSave
}: SchoolSubscriptionModalProps) {
  const [validityType, setValidityType] = useState<'monthly' | 'yearly'>(
    school.validityType || 'yearly'
  );
  const [contractDuration, setContractDuration] = useState<string>(
    school.contractDuration || (validityType === 'yearly' ? '365 Days' : '30 Days')
  );
  const [expiresAt, setExpiresAt] = useState<string>(
    school.expiresAt || new Date(Date.now() + 365 * 24 * 60 * 60 * 1000).toISOString().slice(0, 10)
  );

  const handleSelectValidity = (type: 'monthly' | 'yearly') => {
    setValidityType(type);
    const d = new Date();
    if (type === 'monthly') {
      d.setDate(d.getDate() + 30);
      setContractDuration('Monthly (30 Days)');
    } else {
      d.setDate(d.getDate() + 365);
      setContractDuration('Annual (365 Days)');
    }
    setExpiresAt(d.toISOString().slice(0, 10));
  };

  const handleExtend = (days: number) => {
    const baseDate = expiresAt ? new Date(expiresAt) : new Date();
    baseDate.setDate(baseDate.getDate() + days);
    setExpiresAt(baseDate.toISOString().slice(0, 10));
  };

  const handleSubmit = (e: FormEvent) => {
    e.preventDefault();
    const updated: SchoolOrganization = {
      ...school,
      validityType,
      contractDuration,
      expiresAt
    };
    onSave(updated);
  };

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-stone-950/70 backdrop-blur-xs animate-in fade-in">
      <div className="bg-white rounded-3xl border border-stone-200 shadow-2xl max-w-lg w-full p-6 space-y-5">
        <div className="flex items-center justify-between pb-3 border-b border-stone-100">
          <div className="flex items-center gap-2.5">
            <div className="w-9 h-9 rounded-xl bg-purple-50 text-purple-600 flex items-center justify-center font-bold text-base">
              <Building2 className="w-5 h-5" />
            </div>
            <div>
              <h3 className="text-base font-black text-stone-900">Manage School License Validity</h3>
              <p className="text-[11px] text-stone-500 font-mono">{school.name} ({school.id})</p>
            </div>
          </div>
          <button 
            onClick={onClose} 
            className="text-stone-400 hover:text-stone-900 transition-colors p-1 cursor-pointer"
          >
            <X className="w-5 h-5" />
          </button>
        </div>

        <form onSubmit={handleSubmit} className="space-y-4 text-xs">
          {/* Current Tier Overview */}
          <div className="p-3.5 rounded-2xl bg-blue-50/70 border border-blue-200 flex items-center justify-between">
            <div>
              <span className="text-[10px] font-bold text-blue-700 uppercase tracking-wider block">
                Assigned Institutional Plan
              </span>
              <strong className="text-slate-900 text-sm">{school.plan}</strong>
            </div>
            <div className="text-right">
              <span className="text-[10px] font-bold text-blue-700 uppercase tracking-wider block">
                Total Capacity
              </span>
              <strong className="text-blue-950 font-mono text-xs">{school.totalSeats} Seats</strong>
            </div>
          </div>

          {/* Validity Type Selector: Monthly vs Yearly */}
          <div>
            <label className="block font-bold text-slate-700 uppercase tracking-wider mb-2">
              Subscription Validity Term
            </label>
            <div className="grid grid-cols-2 gap-3">
              <button
                type="button"
                onClick={() => handleSelectValidity('monthly')}
                className={`p-4 rounded-2xl border text-left transition-all cursor-pointer relative ${
                  validityType === 'monthly'
                    ? 'bg-slate-900 text-white border-slate-900 shadow-md'
                    : 'bg-white text-slate-800 border-slate-200 hover:bg-slate-50'
                }`}
              >
                <div className="flex items-center justify-between">
                  <span className="font-black text-sm">Monthly Validity</span>
                  {validityType === 'monthly' && <Check className="w-4 h-4 text-blue-300" />}
                </div>
                <p className={`text-[11px] mt-1 ${validityType === 'monthly' ? 'text-slate-300' : 'text-slate-500'}`}>
                  30-Day billing & validity cycle
                </p>
              </button>

              <button
                type="button"
                onClick={() => handleSelectValidity('yearly')}
                className={`p-4 rounded-2xl border text-left transition-all cursor-pointer relative ${
                  validityType === 'yearly'
                    ? 'bg-blue-600 text-white border-blue-600 shadow-md'
                    : 'bg-white text-slate-800 border-slate-200 hover:bg-blue-50/40'
                }`}
              >
                <div className="flex items-center justify-between">
                  <span className="font-black text-sm">Yearly Validity</span>
                  {validityType === 'yearly' && <Check className="w-4 h-4 text-white" />}
                </div>
                <p className={`text-[11px] mt-1 ${validityType === 'yearly' ? 'text-blue-100' : 'text-slate-500'}`}>
                  365-Day institutional academic cycle
                </p>
              </button>
            </div>
          </div>

          {/* Expiration Date picker & Extension */}
          <div className="p-3.5 rounded-2xl bg-slate-50 border border-slate-200 space-y-3">
            <label className="block font-bold text-slate-800 uppercase tracking-wider text-[11px]">
              Institutional Expiration Date
            </label>
            <div className="relative">
              <Calendar className="w-3.5 h-3.5 absolute left-3 top-3 text-slate-400" />
              <input
                type="date"
                required
                value={expiresAt}
                onChange={(e) => setExpiresAt(e.target.value)}
                className="w-full pl-8 pr-2.5 py-2.5 rounded-xl bg-white border border-slate-200 font-bold text-slate-900 text-xs focus:ring-2 focus:ring-blue-500/20 focus:border-blue-500 outline-hidden"
              />
            </div>

            <div className="flex items-center gap-2 pt-1">
              <span className="text-[10px] font-bold text-slate-500 uppercase">Quick Extend:</span>
              <button
                type="button"
                onClick={() => handleExtend(30)}
                className="px-2.5 py-1 rounded-lg bg-white hover:bg-slate-100 border border-slate-200 font-bold text-slate-700 text-[11px] cursor-pointer"
              >
                +30 Days (1 Month)
              </button>
              <button
                type="button"
                onClick={() => handleExtend(365)}
                className="px-2.5 py-1 rounded-lg bg-white hover:bg-blue-50 border border-blue-200 font-bold text-blue-700 text-[11px] cursor-pointer"
              >
                +365 Days (1 Year)
              </button>
            </div>
          </div>

          <div className="pt-3 border-t border-slate-100 flex items-center justify-end gap-2">
            <button
              type="button"
              onClick={onClose}
              className="px-4 py-2 rounded-xl border border-slate-200 font-bold text-slate-600 hover:bg-slate-50 cursor-pointer transition-colors"
            >
              Cancel
            </button>
            <button
              type="submit"
              className="px-5 py-2 rounded-xl bg-blue-600 hover:bg-blue-700 text-white font-bold cursor-pointer transition-colors shadow-xs"
            >
              Update School Validity
            </button>
          </div>
        </form>
      </div>
    </div>
  );
}
