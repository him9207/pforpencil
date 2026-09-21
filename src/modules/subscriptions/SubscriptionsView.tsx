import React, { useState, FormEvent } from 'react';
import { 
  SubscriptionPlan, 
  Voucher, 
  UserAccount 
} from '../../types';
import { 
  SUBSCRIPTION_PLANS 
} from '../../mockData';
import { 
  Check, 
  CreditCard, 
  Tag, 
  School, 
  Heart, 
  Sparkles, 
  ShieldCheck, 
  ArrowRight,
  Calculator,
  Ticket
} from 'lucide-react';
import confetti from 'canvas-confetti';
import { sounds } from '../../utils/audio';

interface SubscriptionsViewProps {
  currentUser: UserAccount;
  vouchers: Voucher[];
  onApplyVoucherSuccess?: (discount: number, code: string) => void;
  onSubscribePlan?: (planName: string, amount: number) => void;
}

export default function SubscriptionsView({
  currentUser,
  vouchers,
  onApplyVoucherSuccess,
  onSubscribePlan
}: SubscriptionsViewProps) {
  const [activeType, setActiveType] = useState<'parent' | 'school'>('parent');
  const [voucherInput, setVoucherInput] = useState('');
  const [appliedVoucher, setAppliedVoucher] = useState<Voucher | null>(null);
  const [voucherMessage, setVoucherMessage] = useState('');
  const [seatCount, setSeatCount] = useState(250);
  const [checkoutModalOpen, setCheckoutModalOpen] = useState(false);
  const [selectedPlan, setSelectedPlan] = useState<SubscriptionPlan | null>(null);
  const [checkoutCompleted, setCheckoutCompleted] = useState(false);

  const plans = SUBSCRIPTION_PLANS.filter((p) => p.type === activeType);

  const handleApplyVoucher = (e: React.FormEvent) => {
    e.preventDefault();
    setVoucherMessage('');

    const targetCode = voucherInput.trim().toUpperCase();
    const found = vouchers.find(
      (v) => v.code.toUpperCase() === targetCode && v.active
    );

    if (found) {
      sounds.playCorrect();
      setAppliedVoucher(found);
      setVoucherMessage(`Coupon applied! ${found.discountPercent ? `${found.discountPercent}% Discount` : `$${found.discountAmount} Discount`}`);
      if (onApplyVoucherSuccess) {
        onApplyVoucherSuccess(found.discountPercent || 20, found.code);
      }
    } else {
      sounds.playWrong();
      setVoucherMessage('Invalid or expired voucher code. Try FUNKIDS50 or SCHOOL2026.');
    }
  };

  const getDiscountedPrice = (price: number) => {
    if (!appliedVoucher) return price;
    if (appliedVoucher.discountPercent) {
      return +(price * (1 - appliedVoucher.discountPercent / 100)).toFixed(2);
    }
    if (appliedVoucher.discountAmount) {
      return Math.max(0, +(price - appliedVoucher.discountAmount).toFixed(2));
    }
    return price;
  };

  const handleOpenCheckout = (plan: SubscriptionPlan) => {
    sounds.playCorrect();
    setSelectedPlan(plan);
    setCheckoutModalOpen(true);
    setCheckoutCompleted(false);
  };

  const handleCompletePayment = () => {
    sounds.playVictory();
    confetti({ particleCount: 70, spread: 60 });
    setCheckoutCompleted(true);
    if (onSubscribePlan && selectedPlan) {
      const finalPrice = getDiscountedPrice(selectedPlan.price);
      onSubscribePlan(selectedPlan.name, finalPrice);
    }
    setTimeout(() => {
      setCheckoutModalOpen(false);
    }, 2500);
  };

  // Custom School Seat Cost calculation
  const customSeatPrice = Math.round(seatCount * 4.5);

  return (
    <div className="space-y-10 pb-16">
      {/* Hero */}
      <div className="text-center max-w-3xl mx-auto space-y-3 pt-4">
        <div className="inline-flex items-center gap-1.5 px-3 py-1 rounded-full bg-amber-100 text-amber-900 text-xs font-bold uppercase tracking-wider">
          <Sparkles className="w-3.5 h-3.5 text-amber-600" />
          <span>Flexible Plans for Families & Schools</span>
        </div>
        <h1 className="text-3xl sm:text-4xl font-black text-stone-900 tracking-tight">
          Invest in Joyful Learning Adventures
        </h1>
        <p className="text-stone-600 text-sm sm:text-base leading-relaxed">
          Access unlimited daily quizzes, games, challenges, and boss battles. Choose a family subscription or bulk school seat license.
        </p>

        {/* Plan Type Selector */}
        <div className="inline-flex items-center gap-2 p-1.5 bg-stone-100 rounded-2xl mt-4 border border-stone-200">
          <button
            id="tab-parent-plans"
            onClick={() => {
              setActiveType('parent');
              sounds.playCorrect();
            }}
            className={`flex items-center gap-2 px-5 py-2.5 rounded-xl font-bold text-xs sm:text-sm transition-all ${
              activeType === 'parent'
                ? 'bg-white text-stone-900 shadow-sm'
                : 'text-stone-600 hover:text-stone-900'
            }`}
          >
            <Heart className="w-4 h-4 text-rose-500" />
            <span>Parent Subscriptions</span>
          </button>

          <button
            id="tab-school-plans"
            onClick={() => {
              setActiveType('school');
              sounds.playCorrect();
            }}
            className={`flex items-center gap-2 px-5 py-2.5 rounded-xl font-bold text-xs sm:text-sm transition-all ${
              activeType === 'school'
                ? 'bg-white text-stone-900 shadow-sm'
                : 'text-stone-600 hover:text-stone-900'
            }`}
          >
            <School className="w-4 h-4 text-blue-600" />
            <span>School Seat Subscriptions</span>
          </button>
        </div>
      </div>

      {/* Voucher Redemption Banner */}
      <div className="max-w-xl mx-auto bg-white rounded-2xl border border-stone-200 p-4 shadow-xs">
        <form onSubmit={handleApplyVoucher} className="flex gap-2">
          <div className="relative flex-1">
            <Ticket className="w-4 h-4 text-amber-600 absolute left-3 top-1/2 -translate-y-1/2" />
            <input
              id="voucher-code-input"
              type="text"
              placeholder="Have a voucher? e.g. FUNKIDS50"
              value={voucherInput}
              onChange={(e) => setVoucherInput(e.target.value)}
              className="w-full pl-9 pr-3 py-2 rounded-xl border border-stone-200 text-xs font-mono uppercase focus:border-stone-900"
            />
          </div>
          <button
            id="apply-voucher-btn"
            type="submit"
            className="px-4 py-2 rounded-xl bg-stone-900 hover:bg-stone-800 text-white font-bold text-xs shrink-0"
          >
            Apply Code
          </button>
        </form>

        {voucherMessage && (
          <div className={`mt-2 text-xs font-bold ${appliedVoucher ? 'text-emerald-700' : 'text-rose-600'}`}>
            {voucherMessage}
          </div>
        )}

        <div className="mt-2 text-[11px] text-stone-400 flex items-center justify-between">
          <span>Sample demo codes:</span>
          <span className="font-mono text-stone-600 font-bold">
            FUNKIDS50 (50% off) • SCHOOL2026 ($250 off)
          </span>
        </div>
      </div>

      {/* Pricing Cards Grid */}
      <div className="max-w-5xl mx-auto grid grid-cols-1 md:grid-cols-2 gap-6">
        {plans.map((plan) => {
          const originalPrice = plan.price;
          const finalPrice = getDiscountedPrice(originalPrice);
          const hasDiscount = finalPrice !== originalPrice;

          return (
            <div
              key={plan.id}
              className={`rounded-3xl border p-6 sm:p-8 flex flex-col justify-between transition-all bg-white relative ${
                plan.popular 
                  ? 'border-stone-900 shadow-lg ring-1 ring-stone-900' 
                  : 'border-stone-200 shadow-xs'
              }`}
            >
              {plan.popular && (
                <span className="absolute -top-3 right-6 bg-stone-900 text-white text-[10px] font-black uppercase tracking-widest px-3 py-1 rounded-full shadow-sm">
                  Most Popular
                </span>
              )}

              <div>
                <div className="flex items-center justify-between mb-2">
                  <h3 className="text-xl font-extrabold text-stone-900">
                    {plan.name}
                  </h3>
                  {plan.seats && (
                    <span className="text-xs font-mono bg-blue-50 text-blue-800 px-2 py-0.5 rounded font-bold">
                      {plan.seats} Seats
                    </span>
                  )}
                </div>

                <p className="text-xs text-stone-500 mb-6 leading-relaxed">
                  {plan.tagline}
                </p>

                {/* Price Display */}
                <div className="flex items-baseline gap-2 mb-6">
                  <span className="text-4xl sm:text-5xl font-black text-stone-900 tracking-tight">
                    ${finalPrice}
                  </span>
                  <span className="text-xs text-stone-500 font-semibold">
                    / {plan.interval}
                  </span>
                  {hasDiscount && (
                    <span className="text-sm line-through text-stone-400 ml-1">
                      ${originalPrice}
                    </span>
                  )}
                </div>

                {/* Features List */}
                <div className="space-y-3 pt-4 border-t border-stone-100">
                  <span className="text-xs font-bold uppercase tracking-wider text-stone-400 block">
                    What's included:
                  </span>
                  {plan.features.map((feat, i) => (
                    <div key={i} className="flex items-center gap-2.5 text-xs text-stone-700">
                      <div className="w-4 h-4 rounded-full bg-emerald-100 text-emerald-700 flex items-center justify-center shrink-0">
                        <Check className="w-2.5 h-2.5" />
                      </div>
                      <span>{feat}</span>
                    </div>
                  ))}
                </div>
              </div>

              <button
                id={`choose-plan-${plan.id}`}
                onClick={() => handleOpenCheckout(plan)}
                className={`w-full mt-8 py-3 px-4 rounded-xl font-black text-xs sm:text-sm flex items-center justify-center gap-2 transition-all cursor-pointer ${
                  plan.popular
                    ? 'bg-amber-500 hover:bg-amber-600 text-stone-950 shadow-md'
                    : 'bg-stone-100 hover:bg-stone-200 text-stone-900'
                }`}
              >
                <span>Select Plan</span>
                <ArrowRight className="w-4 h-4" />
              </button>
            </div>
          );
        })}
      </div>

      {/* School Custom Seat Calculator (if on School tab) */}
      {activeType === 'school' && (
        <div className="max-w-3xl mx-auto bg-stone-900 text-white rounded-3xl p-6 sm:p-8 shadow-lg">
          <div className="flex items-center gap-2.5 text-amber-400 text-xs font-bold uppercase tracking-wider mb-2">
            <Calculator className="w-4 h-4" />
            <span>Interactive School Seat Tier Calculator</span>
          </div>
          <h3 className="text-xl font-bold text-white mb-2">
            Need a custom seat allocation for your district?
          </h3>
          <p className="text-xs text-stone-400 mb-6">
            Drag the slider to calculate instant volume pricing for elementary school rosters.
          </p>

          <div className="space-y-3">
            <div className="flex justify-between items-center text-xs font-bold">
              <span>Selected Students: {seatCount} Seats</span>
              <span className="text-emerald-400 font-mono text-base font-black">
                ${customSeatPrice} / year ($4.50/student)
              </span>
            </div>

            <input
              type="range"
              min={50}
              max={1500}
              step={50}
              value={seatCount}
              onChange={(e) => setSeatCount(Number(e.target.value))}
              className="w-full accent-amber-500 cursor-pointer"
            />

            <div className="flex justify-between text-[11px] text-stone-500 font-mono">
              <span>50 Seats</span>
              <span>500 Seats</span>
              <span>1,000 Seats</span>
              <span>1,500 Seats</span>
            </div>
          </div>
        </div>
      )}

      {/* Simulated Checkout Modal */}
      {checkoutModalOpen && selectedPlan && (
        <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-stone-950/70 backdrop-blur-xs animate-in fade-in">
          <div className="bg-white rounded-3xl border border-stone-200 shadow-2xl max-w-md w-full p-6 sm:p-8 flex flex-col">
            {!checkoutCompleted ? (
              <>
                <div className="pb-4 border-b border-stone-100 flex items-center justify-between">
                  <div>
                    <span className="text-xs font-bold text-amber-600 uppercase tracking-wider">
                      Secure Checkout
                    </span>
                    <h3 className="text-lg font-black text-stone-900">
                      Confirm {selectedPlan.name}
                    </h3>
                  </div>
                  <button
                    onClick={() => setCheckoutModalOpen(false)}
                    className="w-7 h-7 rounded-full bg-stone-100 text-stone-500 flex items-center justify-center"
                  >
                    ✕
                  </button>
                </div>

                <div className="py-4 space-y-3 text-xs">
                  <div className="p-3.5 rounded-2xl bg-stone-50 border border-stone-200 flex items-center justify-between">
                    <div>
                      <strong className="block font-bold text-stone-900">{selectedPlan.name}</strong>
                      <span className="text-stone-500">Billing: {selectedPlan.interval}</span>
                    </div>
                    <div className="text-right">
                      <strong className="block font-black text-stone-900 text-base">
                        ${getDiscountedPrice(selectedPlan.price)}
                      </strong>
                      {appliedVoucher && (
                        <span className="text-emerald-700 font-bold text-[10px]">
                          Voucher {appliedVoucher.code} applied
                        </span>
                      )}
                    </div>
                  </div>

                  <div className="space-y-2 pt-2">
                    <label className="block font-bold text-stone-700 uppercase">Simulated Payment Card</label>
                    <div className="p-3 rounded-xl border border-stone-200 bg-stone-50 flex items-center justify-between font-mono">
                      <span>•••• •••• •••• 4242</span>
                      <span className="text-stone-400">12/28</span>
                    </div>
                  </div>
                </div>

                <button
                  id="confirm-payment-btn"
                  onClick={handleCompletePayment}
                  className="w-full py-3 rounded-xl bg-amber-500 hover:bg-amber-600 text-stone-950 font-black text-xs shadow-md transition-all mt-2 cursor-pointer"
                >
                  Pay ${getDiscountedPrice(selectedPlan.price)} & Activate Plan
                </button>
              </>
            ) : (
              <div className="text-center py-6 space-y-3">
                <div className="w-14 h-14 rounded-full bg-emerald-100 text-emerald-600 flex items-center justify-center text-3xl mx-auto">
                  ✓
                </div>
                <h3 className="text-xl font-black text-stone-900">
                  Subscription Active!
                </h3>
                <p className="text-xs text-stone-600">
                  Your payment was recorded. Thank you for empowering kids with PforPencil!
                </p>
              </div>
            )}
          </div>
        </div>
      )}
    </div>
  );
}
