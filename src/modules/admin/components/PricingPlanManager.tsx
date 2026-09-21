import React, { useState } from 'react';
import { SubscriptionPlan, SubscriptionRecord } from '../../../types';
import { 
  CreditCard, 
  Plus, 
  Trash2, 
  Check, 
  Sparkles, 
  Users, 
  School, 
  Calendar, 
  DollarSign, 
  X,
  Edit2,
  Copy,
  Receipt,
  TrendingUp,
  Tag
} from 'lucide-react';
import { sounds } from '../../../utils/audio';

interface PricingPlanManagerProps {
  plans: SubscriptionPlan[];
  subscriptions?: SubscriptionRecord[];
  onAddPlan: (plan: SubscriptionPlan) => void;
  onUpdatePlan?: (plan: SubscriptionPlan) => void;
  onDeletePlan: (planId: string) => void;
  onTogglePlanActive?: (planId: string) => void;
  onSuccessMessage: (msg: string) => void;
}

export default function PricingPlanManager({
  plans,
  subscriptions = [],
  onAddPlan,
  onUpdatePlan,
  onDeletePlan,
  onTogglePlanActive,
  onSuccessMessage
}: PricingPlanManagerProps) {
  const [filterType, setFilterType] = useState<'all' | 'parent' | 'school'>('all');
  const [filterInterval, setFilterInterval] = useState<'all' | 'month' | 'year'>('all');
  const [isModalOpen, setIsModalOpen] = useState(false);
  const [editingPlan, setEditingPlan] = useState<SubscriptionPlan | null>(null);

  // Form states for creating / editing plan
  const [planName, setPlanName] = useState('');
  const [planType, setPlanType] = useState<'parent' | 'school'>('parent');
  const [planPrice, setPlanPrice] = useState('9.99');
  const [planInterval, setPlanInterval] = useState<'month' | 'year'>('month');
  const [seatsCount, setSeatsCount] = useState('1');
  const [tagline, setTagline] = useState('Personalized adaptive learning & gamified progress');
  const [isPopular, setIsPopular] = useState(false);
  const [newFeatureText, setNewFeatureText] = useState('');
  const [featuresList, setFeaturesList] = useState<string[]>([
    'Full Grade-level Math Curriculum',
    'Interactive Quizzes & Clipart Questions',
    'Boss Battles & Speed Challenges',
    'Student ID Card & Badges'
  ]);

  // Preset templates for quick plan creation
  const handleApplyPreset = (preset: 'ind_1_mo' | 'ind_1_yr' | 'ind_2_mo' | 'ind_2_yr' | 'ind_3_mo' | 'ind_3_yr' | 'sch_50' | 'sch_200' | 'sch_500') => {
    sounds.click();
    if (preset === 'ind_1_mo') {
      setPlanName('Individual (1 Student) Monthly');
      setPlanType('parent');
      setPlanPrice('4.99');
      setPlanInterval('month');
      setSeatsCount('1');
      setTagline('Best for a single student looking for focused daily math mastery');
      setIsPopular(false);
      setFeaturesList([
        '1 Student Account License',
        'Daily Sunrise Quizzes & Streaks',
        'All Math Curriculum Topics',
        'Printable Student ID Card & Digital Badges',
        'Parent Activity & Screen Time Monitor'
      ]);
    } else if (preset === 'ind_1_yr') {
      setPlanName('Individual (1 Student) Annual');
      setPlanType('parent');
      setPlanPrice('39.99');
      setPlanInterval('year');
      setSeatsCount('1');
      setTagline('Full year of unlimited learning (Save 33% over monthly)');
      setIsPopular(true);
      setFeaturesList([
        '1 Student Account License (Full 365 Days)',
        'Unlimited Quizzes, Games & Boss Battles',
        'Early Access to Grade 6 Olympiad Prep',
        'Parent Progress Email Summaries',
        'Priority Customer Support'
      ]);
    } else if (preset === 'ind_2_mo') {
      setPlanName('Family Duo (2 Students) Monthly');
      setPlanType('parent');
      setPlanPrice('7.99');
      setPlanInterval('month');
      setSeatsCount('2');
      setTagline('Ideal for siblings in different or same grades');
      setIsPopular(false);
      setFeaturesList([
        '2 Independent Student Accounts',
        'Individual PIN Logins & ID Badges',
        'Independent Grade Selection (Preschool to Grade 6)',
        'Family Leaderboard & Friendly Streaks',
        'Combined Parent Dashboard'
      ]);
    } else if (preset === 'ind_2_yr') {
      setPlanName('Family Duo (2 Students) Annual');
      setPlanType('parent');
      setPlanPrice('69.99');
      setPlanInterval('year');
      setSeatsCount('2');
      setTagline('Save $25/year on 2 children subscriptions');
      setIsPopular(true);
      setFeaturesList([
        '2 Independent Student Accounts (Full Year)',
        'Unlimited Access Across All Subjects',
        'Gamified Boss Fights & Offline Printables',
        'Dual Progress Tracking & Mastery Radars'
      ]);
    } else if (preset === 'ind_3_mo') {
      setPlanName('Family Champion (3+ Students) Monthly');
      setPlanType('parent');
      setPlanPrice('9.99');
      setPlanInterval('month');
      setSeatsCount('3');
      setTagline('Comprehensive family plan for up to 5 kids');
      setIsPopular(false);
      setFeaturesList([
        'Up to 5 Child Profiles & Usernames',
        'Multi-Grade Curriculum Switcher',
        'Daily Streak Rewards & Avatar Customization',
        'Full Parent Analytics & Screen Time Locks'
      ]);
    } else if (preset === 'ind_3_yr') {
      setPlanName('Family Champion (3+ Students) Annual');
      setPlanType('parent');
      setPlanPrice('79.99');
      setPlanInterval('year');
      setSeatsCount('5');
      setTagline('Best value for growing families (Only $1.33/child/month)');
      setIsPopular(true);
      setFeaturesList([
        'Up to 5 Child Profiles & Usernames',
        'Complete Master Question Bank Access',
        'Personalized Boss Battle Encounters',
        'Printable Certificates of Completion'
      ]);
    } else if (preset === 'sch_50') {
      setPlanName('School Starter (50 Students)');
      setPlanType('school');
      setPlanPrice('299.00');
      setPlanInterval('year');
      setSeatsCount('50');
      setTagline('For micro-schools, tutoring centers & grade cohorts');
      setIsPopular(false);
      setFeaturesList([
        '50 Rostered Student Accounts',
        'Up to 3 Teacher Faculty Logins',
        'Classroom Assignment & Homework Builder',
        'Grade-wide Performance Reports'
      ]);
    } else if (preset === 'sch_200') {
      setPlanName('School Campus (200 Students)');
      setPlanType('school');
      setPlanPrice('899.00');
      setPlanInterval('year');
      setSeatsCount('200');
      setTagline('For elementary schools looking for comprehensive math software');
      setIsPopular(true);
      setFeaturesList([
        '200 Student Seat Licenses',
        'Unlimited Faculty & Teacher Accounts',
        'Curriculum Mapping by Standard & Grade',
        'School-wide Aggregate Diagnostic Analytics',
        'Batch CSV/Excel Student Onboarding'
      ]);
    } else if (preset === 'sch_500') {
      setPlanName('District Enterprise (500+ Students)');
      setPlanType('school');
      setPlanPrice('1899.00');
      setPlanInterval('year');
      setSeatsCount('500');
      setTagline('District rollout with dedicated onboarding & SIS sync');
      setIsPopular(false);
      setFeaturesList([
        '500+ Student Seat Licenses',
        'Single Sign-On & Roster Sync (Google/Clever)',
        'Custom District Skill Alignment',
        'Dedicated District Account Manager'
      ]);
    }
  };

  const handleOpenCreateModal = () => {
    sounds.click();
    setEditingPlan(null);
    setPlanName('');
    setPlanType('parent');
    setPlanPrice('4.99');
    setPlanInterval('month');
    setSeatsCount('1');
    setTagline('Personalized adaptive learning & gamified progress');
    setIsPopular(false);
    setFeaturesList([
      '1 Student Account License',
      'Daily Sunrise Quizzes & Streaks',
      'Math Curriculum Topics',
      'Student ID Card & Badges'
    ]);
    setIsModalOpen(true);
  };

  const handleEditPlan = (plan: SubscriptionPlan) => {
    sounds.click();
    setEditingPlan(plan);
    setPlanName(plan.name);
    setPlanType(plan.type);
    setPlanPrice(String(plan.price));
    setPlanInterval(plan.interval);
    setSeatsCount(String(plan.seats || (plan.type === 'school' ? 200 : 1)));
    setTagline(plan.tagline || '');
    setIsPopular(!!plan.popular);
    setFeaturesList([...plan.features]);
    setIsModalOpen(true);
  };

  const handleAddFeature = () => {
    if (!newFeatureText.trim()) return;
    sounds.click();
    setFeaturesList(prev => [...prev, newFeatureText.trim()]);
    setNewFeatureText('');
  };

  const handleRemoveFeature = (idx: number) => {
    sounds.click();
    setFeaturesList(prev => prev.filter((_, i) => i !== idx));
  };

  const handleSavePlan = (e: React.FormEvent) => {
    e.preventDefault();
    if (!planName.trim() || !planPrice) return;

    sounds.success();
    const priceNum = parseFloat(planPrice) || 0;
    const seatsNum = parseInt(seatsCount) || 1;

    const planPayload: SubscriptionPlan = {
      id: editingPlan ? editingPlan.id : `PLAN_${Date.now()}`,
      type: planType,
      name: planName.trim(),
      tagline: tagline.trim(),
      price: priceNum,
      interval: planInterval,
      popular: isPopular,
      seats: seatsNum,
      features: featuresList.length > 0 ? featuresList : ['Standard platform features']
    };

    if (editingPlan && onUpdatePlan) {
      onUpdatePlan(planPayload);
      onSuccessMessage(`Updated pricing plan "${planPayload.name}"!`);
    } else {
      onAddPlan(planPayload);
      onSuccessMessage(`Created new ${planPayload.interval}ly pricing plan for ${planPayload.type === 'school' ? 'Schools' : 'Individuals'}!`);
    }

    setIsModalOpen(false);
  };

  // Filter plans
  const filteredPlans = plans.filter((p) => {
    if (filterType !== 'all' && p.type !== filterType) return false;
    if (filterInterval !== 'all' && p.interval !== filterInterval) return false;
    return true;
  });

  // Calculate MRR & ARR from active subscriptions
  const activeSubs = subscriptions.filter(s => s.status === 'active');
  const mrr = activeSubs.reduce((acc, s) => {
    if (s.planDuration === 'monthly') return acc + s.amount;
    if (s.planDuration === 'annual' || s.planDuration === 'yearly') return acc + (s.amount / 12);
    return acc;
  }, 0);
  const arr = mrr * 12;

  return (
    <div className="space-y-6">
      {/* Header & Metric Banner */}
      <div className="bg-white rounded-3xl border border-stone-200 p-6 shadow-xs flex flex-col md:flex-row md:items-center justify-between gap-6">
        <div>
          <div className="flex items-center gap-2 mb-1">
            <span className="px-2.5 py-0.5 rounded-full bg-emerald-100 text-emerald-950 font-bold text-xs uppercase tracking-wider">
              Monetization & Charges Matrix
            </span>
            <span className="text-xs font-mono text-stone-400">
              {plans.length} Configured Tiers
            </span>
          </div>
          <h2 className="text-xl sm:text-2xl font-black text-stone-900">
            Subscription Plans & Pricing Customizer
          </h2>
          <p className="text-xs sm:text-sm text-stone-500 max-w-2xl mt-0.5">
            Create and configure plans based on <strong>individuals (1, 2, 3 or more students)</strong> or <strong>schools (multiple student seats)</strong> on <strong>monthly and yearly</strong> cycles.
          </p>
        </div>

        <div className="flex items-center gap-3">
          <div className="hidden lg:block bg-stone-50 border border-stone-200 px-4 py-2.5 rounded-2xl text-right">
            <span className="text-[10px] text-stone-400 font-bold uppercase block">Projected MRR</span>
            <span className="text-base font-black text-emerald-600 font-mono">
              ${mrr.toFixed(2)}/mo
            </span>
          </div>

          <button
            type="button"
            id="create-new-pricing-plan-btn"
            onClick={handleOpenCreateModal}
            className="px-4 py-2.5 bg-emerald-600 hover:bg-emerald-700 text-white text-xs font-black rounded-2xl shadow-sm transition flex items-center gap-2 cursor-pointer active:scale-95"
          >
            <Plus className="w-4 h-4" />
            <span>+ Create New Plan</span>
          </button>
        </div>
      </div>

      {/* Filter Tabs & Controls */}
      <div className="flex flex-wrap items-center justify-between gap-3 bg-white p-3 rounded-2xl border border-stone-200 shadow-xs">
        {/* Type Filter */}
        <div className="flex items-center gap-1.5">
          <span className="text-xs font-bold text-stone-500 mr-1">Audience:</span>
          {[
            { id: 'all', label: 'All Audiences', icon: Sparkles },
            { id: 'parent', label: 'Individuals / Families (1-5 Kids)', icon: Users },
            { id: 'school', label: 'Schools / Campus (Bulk Seats)', icon: School }
          ].map((tab) => (
            <button
              key={tab.id}
              onClick={() => {
                sounds.click();
                setFilterType(tab.id as any);
              }}
              className={`px-3 py-1.5 rounded-xl text-xs font-bold transition flex items-center gap-1.5 cursor-pointer ${
                filterType === tab.id
                  ? 'bg-stone-900 text-white shadow-xs'
                  : 'bg-stone-100 text-stone-600 hover:bg-stone-200'
              }`}
            >
              <tab.icon className="w-3.5 h-3.5" />
              <span>{tab.label}</span>
            </button>
          ))}
        </div>

        {/* Interval Filter */}
        <div className="flex items-center gap-1.5">
          <span className="text-xs font-bold text-stone-500 mr-1">Billing:</span>
          {[
            { id: 'all', label: 'All Cycles' },
            { id: 'month', label: 'Monthly' },
            { id: 'year', label: 'Yearly (Annual)' }
          ].map((interval) => (
            <button
              key={interval.id}
              onClick={() => {
                sounds.click();
                setFilterInterval(interval.id as any);
              }}
              className={`px-2.5 py-1 rounded-xl text-xs font-semibold transition cursor-pointer ${
                filterInterval === interval.id
                  ? 'bg-amber-100 text-amber-950 font-bold border border-amber-300'
                  : 'text-stone-500 hover:bg-stone-100'
              }`}
            >
              {interval.label}
            </button>
          ))}
        </div>
      </div>

      {/* Plan Grid */}
      <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 xl:grid-cols-4 gap-4">
        {filteredPlans.map((plan) => {
          const isParent = plan.type === 'parent';
          const seatsLabel = isParent 
            ? `${plan.seats || 1} ${Number(plan.seats) === 1 ? 'Student' : 'Students'}`
            : `${plan.seats || 200} Student Seats`;

          return (
            <div 
              key={plan.id}
              className={`rounded-3xl border-2 p-5 flex flex-col justify-between transition-all bg-white relative shadow-xs hover:shadow-md ${
                plan.popular ? 'border-amber-400 ring-2 ring-amber-300/30' : 'border-stone-200'
              }`}
            >
              {plan.popular && (
                <div className="absolute -top-3 left-6 px-2.5 py-0.5 rounded-full bg-gradient-to-r from-amber-500 to-orange-500 text-white font-black text-[10px] uppercase tracking-wider shadow-sm flex items-center gap-1">
                  <Sparkles className="w-3 h-3" />
                  <span>Most Popular Tier</span>
                </div>
              )}

              <div>
                <div className="flex items-center justify-between gap-2 pt-1 mb-2">
                  <span className={`px-2.5 py-0.5 rounded-full text-[10px] font-bold uppercase tracking-wider flex items-center gap-1 ${
                    isParent ? 'bg-indigo-50 text-indigo-800' : 'bg-emerald-50 text-emerald-800'
                  }`}>
                    {isParent ? <Users className="w-3 h-3" /> : <School className="w-3 h-3" />}
                    <span>{isParent ? 'Individual' : 'School'}</span>
                  </span>

                  <span className="px-2 py-0.5 rounded-full bg-stone-100 font-mono text-[10px] font-bold text-stone-600">
                    {plan.interval === 'year' ? 'Annual Plan' : 'Monthly'}
                  </span>
                </div>

                <h3 className="text-base font-black text-stone-900 leading-tight">
                  {plan.name}
                </h3>

                {plan.tagline && (
                  <p className="text-xs text-stone-500 mt-1 min-h-[32px] leading-snug">
                    {plan.tagline}
                  </p>
                )}

                {/* Price Display */}
                <div className="mt-4 p-3 rounded-2xl bg-stone-50 border border-stone-200/80 flex items-baseline justify-between">
                  <div>
                    <div className="flex items-baseline gap-1">
                      <span className="text-2xl font-black text-stone-900 font-mono">
                        ${plan.price.toFixed(2)}
                      </span>
                      <span className="text-xs text-stone-500 font-bold">
                        /{plan.interval}
                      </span>
                    </div>
                    <span className="text-[11px] font-bold text-indigo-700 block mt-0.5">
                      Capacity: {seatsLabel}
                    </span>
                  </div>

                  {plan.interval === 'year' && (
                    <span className="text-[10px] font-bold px-2 py-1 rounded-lg bg-emerald-100 text-emerald-900">
                      Best Value
                    </span>
                  )}
                </div>

                {/* Feature Bullet Points */}
                <div className="mt-4 pt-3 border-t border-stone-100 space-y-2">
                  <span className="text-[10px] font-bold uppercase tracking-wider text-stone-400 block">
                    What's Included:
                  </span>
                  {plan.features.map((feat, fIdx) => (
                    <div key={fIdx} className="flex items-start gap-2 text-xs text-stone-700">
                      <Check className="w-3.5 h-3.5 text-emerald-600 shrink-0 mt-0.5" />
                      <span className="leading-snug">{feat}</span>
                    </div>
                  ))}
                </div>
              </div>

              {/* Action Buttons */}
              <div className="mt-5 pt-3 border-t border-stone-200 flex items-center justify-between gap-2">
                <button
                  type="button"
                  onClick={() => handleEditPlan(plan)}
                  className="p-2 rounded-xl bg-stone-100 hover:bg-stone-200 text-stone-700 transition flex items-center gap-1 text-xs font-bold cursor-pointer"
                  title="Edit plan details and charges"
                >
                  <Edit2 className="w-3.5 h-3.5" />
                  <span>Edit</span>
                </button>

                <button
                  type="button"
                  onClick={() => {
                    if (window.confirm(`Are you sure you want to delete the plan "${plan.name}"?`)) {
                      sounds.click();
                      onDeletePlan(plan.id);
                      onSuccessMessage(`Removed pricing plan "${plan.name}"`);
                    }
                  }}
                  className="p-2 rounded-xl text-rose-600 hover:bg-rose-50 transition flex items-center gap-1 text-xs font-bold cursor-pointer"
                  title="Delete this plan"
                >
                  <Trash2 className="w-3.5 h-3.5" />
                  <span className="hidden sm:inline">Delete</span>
                </button>
              </div>
            </div>
          );
        })}
      </div>

      {/* CREATE / EDIT PLAN MODAL */}
      {isModalOpen && (
        <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-black/60 backdrop-blur-xs animate-in fade-in">
          <div className="bg-white rounded-3xl border border-stone-200 shadow-2xl max-w-2xl w-full max-h-[90vh] overflow-y-auto p-6 sm:p-8 space-y-6">
            <div className="flex items-center justify-between pb-3 border-b border-stone-100">
              <div className="flex items-center gap-3">
                <div className="w-10 h-10 rounded-2xl bg-emerald-100 text-emerald-800 flex items-center justify-center font-bold">
                  <CreditCard className="w-5 h-5" />
                </div>
                <div>
                  <h3 className="text-lg font-black text-stone-900">
                    {editingPlan ? 'Edit Pricing Plan & Charges' : 'Create Custom Pricing Plan'}
                  </h3>
                  <p className="text-xs text-stone-500">
                    Configure individual or school plans on monthly/yearly schedules
                  </p>
                </div>
              </div>
              <button
                onClick={() => setIsModalOpen(false)}
                className="p-2 rounded-xl text-stone-400 hover:text-stone-700 hover:bg-stone-100 cursor-pointer"
              >
                <X className="w-5 h-5" />
              </button>
            </div>

            {/* Quick Preset Selector */}
            {!editingPlan && (
              <div className="p-4 bg-amber-50/70 border border-amber-200 rounded-2xl space-y-2">
                <div className="flex items-center justify-between">
                  <span className="text-xs font-black text-amber-950 flex items-center gap-1.5">
                    <Sparkles className="w-3.5 h-3.5 text-amber-600" />
                    <span>Quick Load User Requested Presets:</span>
                  </span>
                  <span className="text-[10px] text-amber-800 font-mono">1-Click Auto-Fill</span>
                </div>
                <div className="grid grid-cols-2 sm:grid-cols-3 gap-2 text-xs">
                  <button
                    type="button"
                    onClick={() => handleApplyPreset('ind_1_mo')}
                    className="p-2 bg-white rounded-xl border border-amber-300 font-bold text-stone-800 hover:bg-amber-100 text-left cursor-pointer"
                  >
                    1 Student (Monthly $4.99)
                  </button>
                  <button
                    type="button"
                    onClick={() => handleApplyPreset('ind_1_yr')}
                    className="p-2 bg-white rounded-xl border border-amber-300 font-bold text-stone-800 hover:bg-amber-100 text-left cursor-pointer"
                  >
                    1 Student (Annual $39.99)
                  </button>
                  <button
                    type="button"
                    onClick={() => handleApplyPreset('ind_2_mo')}
                    className="p-2 bg-white rounded-xl border border-amber-300 font-bold text-stone-800 hover:bg-amber-100 text-left cursor-pointer"
                  >
                    2 Students (Monthly $7.99)
                  </button>
                  <button
                    type="button"
                    onClick={() => handleApplyPreset('ind_2_yr')}
                    className="p-2 bg-white rounded-xl border border-amber-300 font-bold text-stone-800 hover:bg-amber-100 text-left cursor-pointer"
                  >
                    2 Students (Annual $69.99)
                  </button>
                  <button
                    type="button"
                    onClick={() => handleApplyPreset('ind_3_mo')}
                    className="p-2 bg-white rounded-xl border border-amber-300 font-bold text-stone-800 hover:bg-amber-100 text-left cursor-pointer"
                  >
                    3+ Students (Monthly $9.99)
                  </button>
                  <button
                    type="button"
                    onClick={() => handleApplyPreset('ind_3_yr')}
                    className="p-2 bg-white rounded-xl border border-amber-300 font-bold text-stone-800 hover:bg-amber-100 text-left cursor-pointer"
                  >
                    3+ Students (Annual $79.99)
                  </button>
                  <button
                    type="button"
                    onClick={() => handleApplyPreset('sch_50')}
                    className="p-2 bg-white rounded-xl border border-emerald-300 font-bold text-stone-800 hover:bg-emerald-100 text-left cursor-pointer"
                  >
                    School (50 Seats $299/yr)
                  </button>
                  <button
                    type="button"
                    onClick={() => handleApplyPreset('sch_200')}
                    className="p-2 bg-white rounded-xl border border-emerald-300 font-bold text-stone-800 hover:bg-emerald-100 text-left cursor-pointer"
                  >
                    School (200 Seats $899/yr)
                  </button>
                  <button
                    type="button"
                    onClick={() => handleApplyPreset('sch_500')}
                    className="p-2 bg-white rounded-xl border border-emerald-300 font-bold text-stone-800 hover:bg-emerald-100 text-left cursor-pointer"
                  >
                    District (500+ Seats $1899/yr)
                  </button>
                </div>
              </div>
            )}

            <form onSubmit={handleSavePlan} className="space-y-4 text-xs">
              <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
                {/* Target Audience */}
                <div>
                  <label className="block font-bold text-stone-700 mb-1">
                    Target Audience *
                  </label>
                  <div className="grid grid-cols-2 gap-2">
                    <button
                      type="button"
                      onClick={() => setPlanType('parent')}
                      className={`p-2.5 rounded-xl border-2 font-bold flex items-center justify-center gap-1.5 cursor-pointer ${
                        planType === 'parent'
                          ? 'border-indigo-600 bg-indigo-50 text-indigo-950'
                          : 'border-stone-200 text-stone-600'
                      }`}
                    >
                      <Users className="w-4 h-4" />
                      <span>Individual / Family</span>
                    </button>
                    <button
                      type="button"
                      onClick={() => setPlanType('school')}
                      className={`p-2.5 rounded-xl border-2 font-bold flex items-center justify-center gap-1.5 cursor-pointer ${
                        planType === 'school'
                          ? 'border-emerald-600 bg-emerald-50 text-emerald-950'
                          : 'border-stone-200 text-stone-600'
                      }`}
                    >
                      <School className="w-4 h-4" />
                      <span>School Institution</span>
                    </button>
                  </div>
                </div>

                {/* Billing Cycle */}
                <div>
                  <label className="block font-bold text-stone-700 mb-1">
                    Billing Interval *
                  </label>
                  <div className="grid grid-cols-2 gap-2">
                    <button
                      type="button"
                      onClick={() => setPlanInterval('month')}
                      className={`p-2.5 rounded-xl border-2 font-bold flex items-center justify-center gap-1.5 cursor-pointer ${
                        planInterval === 'month'
                          ? 'border-amber-600 bg-amber-50 text-amber-950'
                          : 'border-stone-200 text-stone-600'
                      }`}
                    >
                      <Calendar className="w-4 h-4" />
                      <span>Monthly (/mo)</span>
                    </button>
                    <button
                      type="button"
                      onClick={() => setPlanInterval('year')}
                      className={`p-2.5 rounded-xl border-2 font-bold flex items-center justify-center gap-1.5 cursor-pointer ${
                        planInterval === 'year'
                          ? 'border-amber-600 bg-amber-50 text-amber-950'
                          : 'border-stone-200 text-stone-600'
                      }`}
                    >
                      <Sparkles className="w-4 h-4" />
                      <span>Yearly (/yr)</span>
                    </button>
                  </div>
                </div>
              </div>

              {/* Plan Name */}
              <div>
                <label className="block font-bold text-stone-700 mb-1">
                  Plan Display Name *
                </label>
                <input
                  type="text"
                  required
                  placeholder="e.g. Individual (1 Student) Monthly"
                  value={planName}
                  onChange={(e) => setPlanName(e.target.value)}
                  className="w-full p-2.5 rounded-xl border border-stone-300 font-bold"
                />
              </div>

              {/* Price & Seats */}
              <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
                <div>
                  <label className="block font-bold text-stone-700 mb-1">
                    Price ($ USD) *
                  </label>
                  <div className="relative">
                    <span className="absolute left-3 top-2.5 text-stone-400 font-bold">$</span>
                    <input
                      type="number"
                      step="0.01"
                      required
                      placeholder="9.99"
                      value={planPrice}
                      onChange={(e) => setPlanPrice(e.target.value)}
                      className="w-full pl-8 pr-3 py-2.5 rounded-xl border border-stone-300 font-mono font-bold"
                    />
                  </div>
                </div>

                <div>
                  <label className="block font-bold text-stone-700 mb-1">
                    Student Capacity / Seats *
                  </label>
                  <input
                    type="number"
                    min="1"
                    required
                    placeholder="1"
                    value={seatsCount}
                    onChange={(e) => setSeatsCount(e.target.value)}
                    className="w-full p-2.5 rounded-xl border border-stone-300 font-mono font-bold"
                  />
                  <span className="text-[10px] text-stone-400 mt-1 block">
                    {planType === 'parent' ? 'Number of child accounts (1, 2, 3, etc.)' : 'Licensed student roster seats (e.g. 50, 200, 500)'}
                  </span>
                </div>
              </div>

              {/* Tagline */}
              <div>
                <label className="block font-bold text-stone-700 mb-1">
                  Short Tagline / Headline
                </label>
                <input
                  type="text"
                  placeholder="e.g. Best value for dedicated families saving 33%"
                  value={tagline}
                  onChange={(e) => setTagline(e.target.value)}
                  className="w-full p-2.5 rounded-xl border border-stone-300"
                />
              </div>

              {/* Features List */}
              <div className="space-y-2">
                <label className="block font-bold text-stone-700">
                  Included Features / Benefits:
                </label>
                <div className="flex gap-2">
                  <input
                    type="text"
                    placeholder="e.g. Real-Time Parent Performance Radar"
                    value={newFeatureText}
                    onChange={(e) => setNewFeatureText(e.target.value)}
                    onKeyDown={(e) => {
                      if (e.key === 'Enter') {
                        e.preventDefault();
                        handleAddFeature();
                      }
                    }}
                    className="flex-1 p-2 rounded-xl border border-stone-300 text-xs"
                  />
                  <button
                    type="button"
                    onClick={handleAddFeature}
                    className="px-3 py-2 bg-stone-900 text-white rounded-xl font-bold cursor-pointer"
                  >
                    Add
                  </button>
                </div>

                <div className="flex flex-wrap gap-1.5 pt-1">
                  {featuresList.map((f, fIdx) => (
                    <span 
                      key={fIdx} 
                      className="inline-flex items-center gap-1.5 px-2.5 py-1 rounded-xl bg-stone-100 text-stone-800 text-xs border border-stone-200"
                    >
                      <Check className="w-3 h-3 text-emerald-600" />
                      <span>{f}</span>
                      <button
                        type="button"
                        onClick={() => handleRemoveFeature(fIdx)}
                        className="text-stone-400 hover:text-rose-600 ml-1 cursor-pointer"
                      >
                        ×
                      </button>
                    </span>
                  ))}
                </div>
              </div>

              {/* Popular Tier Toggle */}
              <div className="flex items-center gap-2 pt-2">
                <input
                  type="checkbox"
                  id="isPopularToggle"
                  checked={isPopular}
                  onChange={(e) => setIsPopular(e.target.checked)}
                  className="w-4 h-4 rounded text-amber-600"
                />
                <label htmlFor="isPopularToggle" className="font-bold text-stone-800 cursor-pointer">
                  Mark as "Most Popular" / Recommended Tier
                </label>
              </div>

              <div className="flex items-center justify-end gap-3 pt-4 border-t border-stone-200">
                <button
                  type="button"
                  onClick={() => setIsModalOpen(false)}
                  className="px-4 py-2.5 rounded-xl border border-stone-300 font-bold text-stone-700 hover:bg-stone-50 cursor-pointer"
                >
                  Cancel
                </button>
                <button
                  type="submit"
                  className="px-6 py-2.5 rounded-xl bg-emerald-600 hover:bg-emerald-700 text-white font-black shadow-md transition cursor-pointer"
                >
                  {editingPlan ? 'Save Changes' : 'Publish Pricing Plan'}
                </button>
              </div>
            </form>
          </div>
        </div>
      )}
    </div>
  );
}
