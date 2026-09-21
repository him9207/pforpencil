import React, { useState } from 'react';
import { Voucher } from '../../../types';
import { 
  Tag, 
  Plus, 
  Trash2, 
  Copy, 
  Check, 
  Percent, 
  DollarSign, 
  Calendar, 
  Users, 
  Sparkles,
  CheckCircle2,
  Clock,
  AlertCircle
} from 'lucide-react';
import { sounds } from '../../../utils/audio';

interface VoucherManagerProps {
  vouchers: Voucher[];
  onAddVoucher: (voucher: Voucher) => void;
  onDeleteVoucher: (voucherId: string) => void;
  onToggleVoucherActive: (voucherId: string) => void;
  onSuccessMessage: (msg: string) => void;
}

export default function VoucherManager({
  vouchers,
  onAddVoucher,
  onDeleteVoucher,
  onToggleVoucherActive,
  onSuccessMessage
}: VoucherManagerProps) {
  const [code, setCode] = useState('');
  const [discountType, setDiscountType] = useState<'percentage' | 'flat'>('percentage');
  const [discountValue, setDiscountValue] = useState('20');
  const [validityDays, setValidityDays] = useState<'15' | '30' | '60' | '90' | '180' | '365' | 'lifetime'>('30');
  const [applicableTo, setApplicableTo] = useState<'all' | 'parent' | 'school'>('all');
  const [maxUses, setMaxUses] = useState('100');
  const [copiedCode, setCopiedCode] = useState<string | null>(null);

  // Auto-generate random coupon code
  const handleGenerateCode = () => {
    sounds.click();
    const prefixes = ['MATH', 'FUN', 'KIDS', 'HERO', 'LEARN', 'SUMMER', 'VIP', 'SCH'];
    const prefix = prefixes[Math.floor(Math.random() * prefixes.length)];
    const val = discountType === 'percentage' ? discountValue : `$${discountValue}`;
    const rand = Math.floor(100 + Math.random() * 900);
    setCode(`${prefix}${discountValue}-${rand}`);
  };

  const getExpirationDate = (days: string): string => {
    if (days === 'lifetime') return '2099-12-31';
    const d = new Date();
    d.setDate(d.getDate() + parseInt(days, 10));
    return d.toISOString().slice(0, 10);
  };

  const handleSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    if (!code.trim() || !discountValue) return;

    sounds.success();
    const val = parseFloat(discountValue) || 10;
    const expiresAt = getExpirationDate(validityDays);

    const newVoucher: Voucher = {
      id: `VOU-${Date.now().toString().slice(-4)}`,
      code: code.trim().toUpperCase(),
      discountType,
      discountValue: val,
      discountPercent: discountType === 'percentage' ? val : undefined,
      discountAmount: discountType === 'flat' ? val : undefined,
      applicableTo,
      maxUses: parseInt(maxUses, 10) || 50,
      currentUses: 0,
      expiresAt,
      active: true
    };

    onAddVoucher(newVoucher);
    onSuccessMessage(`Created promo voucher "${newVoucher.code}" with ${discountType === 'percentage' ? `${val}% OFF` : `$${val} FLAT OFF`}!`);

    setCode('');
    setDiscountValue('20');
  };

  const handleCopyCode = (voucherCode: string) => {
    navigator.clipboard.writeText(voucherCode);
    sounds.click();
    setCopiedCode(voucherCode);
    setTimeout(() => setCopiedCode(null), 2000);
  };

  return (
    <div className="space-y-6">
      {/* Header & Description */}
      <div className="bg-white rounded-3xl border border-stone-200 p-6 shadow-xs flex flex-col md:flex-row md:items-center justify-between gap-4">
        <div>
          <div className="flex items-center gap-2 mb-1">
            <span className="px-2.5 py-0.5 rounded-full bg-amber-100 text-amber-950 font-bold text-xs uppercase tracking-wider">
              Marketing & Discount Engine
            </span>
            <span className="text-xs font-mono text-stone-400">
              {vouchers.length} Active Codes
            </span>
          </div>
          <h2 className="text-xl sm:text-2xl font-black text-stone-900">
            Promo Vouchers & Discount Matrix
          </h2>
          <p className="text-xs sm:text-sm text-stone-500 max-w-2xl mt-0.5">
            Configure coupons with <strong>Percentage discounts (%)</strong> or <strong>Flat rate ($ USD)</strong> off, with specific validity periods and usage quotas.
          </p>
        </div>
      </div>

      <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
        {/* CREATE VOUCHER FORM */}
        <div className="bg-white rounded-3xl border border-stone-200 p-6 shadow-xs space-y-4">
          <div className="flex items-center gap-2.5 pb-3 border-b border-stone-100">
            <div className="w-8 h-8 rounded-xl bg-amber-50 text-amber-800 flex items-center justify-center font-bold">
              <Tag className="w-4 h-4" />
            </div>
            <div>
              <h3 className="text-sm font-black text-stone-900">Create New Promo Voucher</h3>
              <p className="text-[11px] text-stone-500">% or Flat Rate + Validity</p>
            </div>
          </div>

          <form onSubmit={handleSubmit} className="space-y-4 text-xs">
            {/* Voucher Code */}
            <div>
              <div className="flex items-center justify-between mb-1">
                <label className="font-bold text-stone-700">Coupon Code *</label>
                <button
                  type="button"
                  onClick={handleGenerateCode}
                  className="text-[10px] text-amber-800 hover:text-amber-950 font-bold flex items-center gap-1 cursor-pointer"
                >
                  <Sparkles className="w-3 h-3" />
                  <span>Auto-Generate</span>
                </button>
              </div>
              <input
                type="text"
                required
                placeholder="e.g. MATHHERO25"
                value={code}
                onChange={(e) => setCode(e.target.value.toUpperCase())}
                className="w-full p-2.5 rounded-xl border border-stone-300 font-mono font-black text-stone-900 tracking-wider uppercase bg-stone-50/50"
              />
            </div>

            {/* Discount Type: % vs Flat */}
            <div>
              <label className="block font-bold text-stone-700 mb-1">Discount Type *</label>
              <div className="grid grid-cols-2 gap-2">
                <button
                  type="button"
                  onClick={() => {
                    sounds.click();
                    setDiscountType('percentage');
                    setDiscountValue('25');
                  }}
                  className={`p-2.5 rounded-xl border-2 font-bold flex items-center justify-center gap-1.5 cursor-pointer ${
                    discountType === 'percentage'
                      ? 'border-amber-600 bg-amber-50 text-amber-950'
                      : 'border-stone-200 text-stone-600 hover:bg-stone-50'
                  }`}
                >
                  <Percent className="w-4 h-4" />
                  <span>Percentage (%)</span>
                </button>

                <button
                  type="button"
                  onClick={() => {
                    sounds.click();
                    setDiscountType('flat');
                    setDiscountValue('15');
                  }}
                  className={`p-2.5 rounded-xl border-2 font-bold flex items-center justify-center gap-1.5 cursor-pointer ${
                    discountType === 'flat'
                      ? 'border-emerald-600 bg-emerald-50 text-emerald-950'
                      : 'border-stone-200 text-stone-600 hover:bg-stone-50'
                  }`}
                >
                  <DollarSign className="w-4 h-4" />
                  <span>Flat Rate ($ USD)</span>
                </button>
              </div>
            </div>

            {/* Discount Value */}
            <div>
              <label className="block font-bold text-stone-700 mb-1">
                {discountType === 'percentage' ? 'Discount Percentage (%)' : 'Flat Discount Amount ($ USD)'} *
              </label>
              <div className="relative">
                <span className="absolute left-3 top-2.5 text-stone-400 font-bold">
                  {discountType === 'percentage' ? '%' : '$'}
                </span>
                <input
                  type="number"
                  min="1"
                  max={discountType === 'percentage' ? 100 : 1000}
                  required
                  placeholder={discountType === 'percentage' ? '25' : '15.00'}
                  value={discountValue}
                  onChange={(e) => setDiscountValue(e.target.value)}
                  className="w-full pl-8 pr-3 py-2.5 rounded-xl border border-stone-300 font-mono font-bold"
                />
              </div>
            </div>

            {/* Validity Duration */}
            <div>
              <div className="flex items-center justify-between mb-1">
                <label className="font-bold text-stone-700">Validity Period *</label>
                <span className="text-[10px] font-mono text-stone-500">
                  Expires: {getExpirationDate(validityDays)}
                </span>
              </div>
              <div className="grid grid-cols-3 gap-1.5">
                {[
                  { id: '15', label: '15 Days' },
                  { id: '30', label: '30 Days' },
                  { id: '60', label: '60 Days' },
                  { id: '90', label: '90 Days' },
                  { id: '180', label: '6 Months' },
                  { id: '365', label: '1 Year' }
                ].map((item) => (
                  <button
                    key={item.id}
                    type="button"
                    onClick={() => {
                      sounds.click();
                      setValidityDays(item.id as any);
                    }}
                    className={`p-2 rounded-lg border text-center transition cursor-pointer ${
                      validityDays === item.id
                        ? 'border-stone-900 bg-stone-900 text-white font-bold'
                        : 'border-stone-200 hover:bg-stone-100 text-stone-600'
                    }`}
                  >
                    {item.label}
                  </button>
                ))}
              </div>
            </div>

            {/* Audience & Limit */}
            <div className="grid grid-cols-2 gap-2">
              <div>
                <label className="block font-bold text-stone-700 mb-1">Audience</label>
                <select
                  value={applicableTo}
                  onChange={(e) => setApplicableTo(e.target.value as any)}
                  className="w-full p-2.5 rounded-xl border border-stone-300 bg-white font-medium"
                >
                  <option value="all">All Users</option>
                  <option value="parent">Parents / Kids Only</option>
                  <option value="school">Schools Only</option>
                </select>
              </div>

              <div>
                <label className="block font-bold text-stone-700 mb-1">Max Usages</label>
                <input
                  type="number"
                  min="1"
                  value={maxUses}
                  onChange={(e) => setMaxUses(e.target.value)}
                  className="w-full p-2.5 rounded-xl border border-stone-300 font-mono font-bold"
                />
              </div>
            </div>

            <button
              type="submit"
              className="w-full py-3 bg-stone-900 hover:bg-black text-white font-black rounded-2xl shadow-sm transition flex items-center justify-center gap-2 cursor-pointer mt-2"
            >
              <Plus className="w-4 h-4 text-amber-400" />
              <span>Create Active Voucher</span>
            </button>
          </form>
        </div>

        {/* VOUCHERS LIST (Right 2 Columns) */}
        <div className="lg:col-span-2 space-y-4">
          <div className="flex items-center justify-between">
            <h3 className="text-sm font-black text-stone-900 flex items-center gap-2">
              <span>Active Coupon Roster</span>
              <span className="px-2 py-0.5 rounded-full bg-stone-100 text-stone-700 font-mono text-xs">
                {vouchers.length} Total
              </span>
            </h3>
            <span className="text-[11px] text-stone-400">
              Click code to copy to clipboard
            </span>
          </div>

          <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
            {vouchers.map((v) => {
              const isPercent = v.discountType === 'percentage' || (v.discountPercent !== undefined && !v.discountAmount);
              const discountText = isPercent
                ? `${v.discountValue || v.discountPercent}% OFF`
                : `$${(v.discountValue || v.discountAmount || 0).toFixed(2)} FLAT OFF`;

              const isExpired = new Date(v.expiresAt) < new Date();

              return (
                <div 
                  key={v.id}
                  className={`rounded-3xl border-2 p-5 bg-white relative flex flex-col justify-between shadow-xs transition hover:shadow-md ${
                    !v.active || isExpired ? 'opacity-60 border-stone-200' : 'border-amber-200/80 ring-1 ring-amber-100'
                  }`}
                >
                  <div>
                    {/* Top Row: Discount Tag & Status */}
                    <div className="flex items-center justify-between gap-2 mb-3">
                      <span className={`px-3 py-1 rounded-xl text-xs font-black tracking-wider uppercase flex items-center gap-1 ${
                        isPercent ? 'bg-amber-100 text-amber-950' : 'bg-emerald-100 text-emerald-950'
                      }`}>
                        {isPercent ? <Percent className="w-3.5 h-3.5" /> : <DollarSign className="w-3.5 h-3.5" />}
                        <span>{discountText}</span>
                      </span>

                      <span className={`px-2 py-0.5 rounded-full text-[10px] font-bold uppercase ${
                        isExpired 
                          ? 'bg-rose-100 text-rose-800' 
                          : v.active 
                          ? 'bg-emerald-50 text-emerald-700' 
                          : 'bg-stone-100 text-stone-500'
                      }`}>
                        {isExpired ? 'Expired' : v.active ? 'Active' : 'Paused'}
                      </span>
                    </div>

                    {/* Code Display Ticket */}
                    <div 
                      onClick={() => handleCopyCode(v.code)}
                      className="p-3 bg-stone-50 hover:bg-amber-50/50 rounded-2xl border border-dashed border-stone-300 flex items-center justify-between cursor-pointer transition group"
                      title="Click to copy coupon code"
                    >
                      <div>
                        <span className="text-[10px] font-bold text-stone-400 uppercase block">Coupon Code</span>
                        <span className="font-mono text-base font-black text-stone-900 tracking-wider group-hover:text-amber-700">
                          {v.code}
                        </span>
                      </div>
                      <button
                        type="button"
                        className="p-2 rounded-xl bg-white border border-stone-200 text-stone-600 group-hover:border-amber-400 group-hover:text-amber-800"
                      >
                        {copiedCode === v.code ? <Check className="w-4 h-4 text-emerald-600" /> : <Copy className="w-4 h-4" />}
                      </button>
                    </div>

                    {/* Details: Validity & Audience */}
                    <div className="mt-3 space-y-1.5 text-xs">
                      <div className="flex items-center justify-between text-stone-500">
                        <span className="flex items-center gap-1">
                          <Calendar className="w-3.5 h-3.5" />
                          <span>Valid Until:</span>
                        </span>
                        <span className={`font-mono font-bold ${isExpired ? 'text-rose-600' : 'text-stone-800'}`}>
                          {v.expiresAt}
                        </span>
                      </div>

                      <div className="flex items-center justify-between text-stone-500">
                        <span className="flex items-center gap-1">
                          <Users className="w-3.5 h-3.5" />
                          <span>Audience:</span>
                        </span>
                        <span className="font-semibold text-stone-800 capitalize">
                          {v.applicableTo}
                        </span>
                      </div>

                      {/* Usage progress */}
                      <div className="pt-2">
                        <div className="flex justify-between text-[11px] text-stone-500 font-mono mb-1">
                          <span>Usage: {v.currentUses} / {v.maxUses}</span>
                          <span>{Math.round((v.currentUses / (v.maxUses || 1)) * 100)}%</span>
                        </div>
                        <div className="h-1.5 bg-stone-100 rounded-full overflow-hidden">
                          <div 
                            className="h-full bg-amber-500 rounded-full"
                            style={{ width: `${Math.min(100, (v.currentUses / (v.maxUses || 1)) * 100)}%` }}
                          />
                        </div>
                      </div>
                    </div>
                  </div>

                  {/* Actions */}
                  <div className="mt-4 pt-3 border-t border-stone-100 flex items-center justify-between">
                    <button
                      type="button"
                      onClick={() => onToggleVoucherActive(v.id)}
                      className="text-xs font-bold text-stone-600 hover:text-stone-900 cursor-pointer"
                    >
                      {v.active ? 'Pause Voucher' : 'Activate Voucher'}
                    </button>

                    <button
                      type="button"
                      onClick={() => {
                        if (window.confirm(`Delete voucher ${v.code}?`)) {
                          sounds.click();
                          onDeleteVoucher(v.id);
                          onSuccessMessage(`Deleted voucher code ${v.code}`);
                        }
                      }}
                      className="text-xs font-bold text-rose-600 hover:text-rose-800 p-1 cursor-pointer flex items-center gap-1"
                    >
                      <Trash2 className="w-3.5 h-3.5" />
                      <span>Delete</span>
                    </button>
                  </div>
                </div>
              );
            })}
          </div>
        </div>
      </div>
    </div>
  );
}
