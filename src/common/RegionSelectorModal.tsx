import React, { useState } from 'react';
import { UserAccount, CurriculumFramework } from '../types';
import { 
  Globe, 
  MapPin, 
  BookOpen, 
  Check, 
  Sparkles, 
  X, 
  AlertCircle,
  Compass
} from 'lucide-react';
import { sounds } from '../utils/audio';
import { COUNTRIES, COUNTRY_STATE_MAP, COUNTRY_CURRICULUM_MAP, COUNTRY_FLAG_MAP } from '../data/curriculumData';
import { useBodyScrollLock } from '../utils/useBodyScrollLock';

interface RegionSelectorModalProps {
  isOpen: boolean;
  onClose: () => void;
  currentUser: UserAccount;
  onSaveRegion: (country: string, state: string, curriculum: string) => void;
  frameworks: CurriculumFramework[];
}

export default function RegionSelectorModal({
  isOpen,
  onClose,
  currentUser,
  onSaveRegion,
  frameworks
}: RegionSelectorModalProps) {
  const [selectedCountry, setSelectedCountry] = useState<string>(currentUser.country || 'United States');
  const [selectedState, setSelectedState] = useState<string>(currentUser.state || 'California');
  const [selectedCurriculum, setSelectedCurriculum] = useState<string>(currentUser.curriculum || 'Common Core (US)');
  const [isSaved, setIsSaved] = useState(false);

  React.useEffect(() => {
    if (isOpen) {
      setSelectedCountry(currentUser.country || 'United States');
      setSelectedState(currentUser.state || 'California');
      setSelectedCurriculum(currentUser.curriculum || 'Common Core (US)');
      setIsSaved(false);
    }
  }, [isOpen, currentUser]);

  // Lock body scroll on mobile and desktop while region selector is open
  useBodyScrollLock(isOpen);

  if (!isOpen) return null;

  const availableStates = COUNTRY_STATE_MAP[selectedCountry] || ['National Standard / All States'];
  const availableCurricula = COUNTRY_CURRICULUM_MAP[selectedCountry] || ['Universal Foundational'];

  const handleCountryChange = (country: string) => {
    sounds.click();
    setSelectedCountry(country);
    const newStates = COUNTRY_STATE_MAP[country] || ['National Standard / All States'];
    const newCurricula = COUNTRY_CURRICULUM_MAP[country] || ['Universal Foundational'];
    
    setSelectedState(newStates[0] || 'National Standard / All States');
    setSelectedCurriculum(newCurricula[0] || 'Universal Foundational');
  };

  const handleSave = (e: React.FormEvent) => {
    e.preventDefault();
    sounds.playLevelUp();
    setIsSaved(true);
    onSaveRegion(selectedCountry, selectedState, selectedCurriculum);
    setTimeout(() => {
      onClose();
    }, 900);
  };

  const getCountryFlag = (c: string) => {
    return COUNTRY_FLAG_MAP[c] || '🌐';
  };

  return (
    <div 
      className="fixed inset-0 z-50 flex items-center justify-center p-3 sm:p-4 bg-slate-950/60 backdrop-blur-xs animate-in fade-in duration-200 overflow-y-auto overscroll-contain modal-scroll-container"
      onClick={onClose}
    >
      <div 
        id="region-selector-modal-card"
        className="bg-white rounded-3xl border-2 border-slate-200 shadow-2xl max-w-lg w-full overflow-hidden flex flex-col max-h-[calc(100dvh-1.5rem)] sm:max-h-[92vh] my-auto"
        onClick={(e) => e.stopPropagation()}
      >
        {/* Header - Unified Blue/Slate Theme */}
        <div className="p-4 sm:p-6 border-b border-slate-100 flex items-center justify-between bg-slate-50/80 shrink-0">
          <div className="flex items-center gap-3">
            <div className="w-10 h-10 rounded-2xl bg-blue-600 text-white flex items-center justify-center text-xl shadow-md shadow-blue-600/20">
              <Globe className="w-5 h-5" />
            </div>
            <div>
              <div className="inline-flex items-center gap-1.5 px-2.5 py-0.5 rounded-full bg-blue-100 text-blue-900 text-[11px] font-bold uppercase tracking-wider mb-0.5">
                <Compass className="w-3 h-3 text-blue-600" />
                Regional Education Standards
              </div>
              <h2 className="text-lg font-black text-slate-900">
                Country, State & Curriculum
              </h2>
            </div>
          </div>
          <button
            id="close-region-modal-btn"
            onClick={onClose}
            className="w-8 h-8 rounded-full bg-white border border-slate-200 text-slate-500 hover:text-slate-900 hover:bg-slate-100 flex items-center justify-center transition-colors cursor-pointer"
          >
            <X className="w-4 h-4" />
          </button>
        </div>

        {/* Form Body */}
        <form onSubmit={handleSave} className="p-4 sm:p-6 space-y-4 text-xs overflow-y-auto overscroll-contain modal-scroll-container flex-1">
          <div className="bg-blue-50 border border-blue-200 rounded-2xl p-3.5 text-blue-900 flex items-start gap-2.5">
            <AlertCircle className="w-4 h-4 text-blue-600 shrink-0 mt-0.5" />
            <span className="leading-relaxed">
              Questions, activities, and curriculum standards will automatically tailor to match the selected <strong>Country</strong>, <strong>State</strong>, and <strong>Curriculum Framework</strong> for <strong>{currentUser.name}</strong> ({currentUser.role}).
            </span>
          </div>

          {/* 1. Country Selection */}
          <div>
            <label className="block text-xs font-bold text-slate-700 uppercase tracking-wider mb-2 flex items-center gap-1.5">
              <Globe className="w-3.5 h-3.5 text-blue-600" />
              <span>Select Country</span>
            </label>
            <div className="grid grid-cols-2 sm:grid-cols-3 gap-2">
              {COUNTRIES.map((country) => {
                const isSelected = selectedCountry === country;
                return (
                  <button
                    key={country}
                    type="button"
                    id={`select-country-${country.replace(/\s+/g, '-').toLowerCase()}`}
                    onClick={() => handleCountryChange(country)}
                    className={`p-2.5 rounded-xl border text-left flex items-center gap-2 transition-all cursor-pointer ${
                      isSelected
                        ? 'bg-blue-600 text-white border-blue-700 font-bold shadow-sm'
                        : 'bg-slate-50 hover:bg-slate-100 border-slate-200 text-slate-800'
                    }`}
                  >
                    <span className="text-base">{getCountryFlag(country)}</span>
                    <span className="truncate text-xs">{country}</span>
                  </button>
                );
              })}
            </div>
          </div>

          {/* 2. State / Province Selection */}
          <div>
            <label className="block text-xs font-bold text-slate-700 uppercase tracking-wider mb-1.5 flex items-center gap-1.5">
              <MapPin className="w-3.5 h-3.5 text-blue-600" />
              <span>State / Province / Region</span>
            </label>
            <select
              id="region-modal-state-select"
              value={selectedState}
              onChange={(e) => setSelectedState(e.target.value)}
              className="w-full p-2.5 rounded-xl border border-slate-200 font-bold text-slate-900 text-xs bg-slate-50 focus:bg-white focus:border-blue-500 focus:ring-2 focus:ring-blue-200"
            >
              {availableStates.map((st) => (
                <option key={st} value={st}>
                  {st}
                </option>
              ))}
            </select>
          </div>

          {/* 3. Curriculum Framework Selection */}
          <div>
            <label className="block text-xs font-bold text-slate-700 uppercase tracking-wider mb-1.5 flex items-center gap-1.5">
              <BookOpen className="w-3.5 h-3.5 text-blue-600" />
              <span>Educational Curriculum Framework</span>
            </label>
            <select
              id="region-modal-curriculum-select"
              value={selectedCurriculum}
              onChange={(e) => setSelectedCurriculum(e.target.value)}
              className="w-full p-2.5 rounded-xl border border-slate-200 font-bold text-slate-900 text-xs bg-slate-50 focus:bg-white focus:border-blue-500 focus:ring-2 focus:ring-blue-200"
            >
              {availableCurricula.map((curr) => (
                <option key={curr} value={curr}>
                  {curr}
                </option>
              ))}
            </select>
          </div>

          {/* Active Summary Pill */}
          <div className="bg-slate-50 rounded-2xl border border-slate-200 p-3 flex items-center justify-between">
            <div className="flex items-center gap-2">
              <span className="text-lg">{getCountryFlag(selectedCountry)}</span>
              <div>
                <strong className="block text-slate-900 text-xs">
                  {selectedCountry} • {selectedState}
                </strong>
                <span className="text-[11px] text-slate-500">
                  {selectedCurriculum}
                </span>
              </div>
            </div>
            <span className="text-[10px] font-bold px-2 py-0.5 rounded-full bg-emerald-100 text-emerald-800">
              Active Scope
            </span>
          </div>

          {/* Submit */}
          <div className="pt-2">
            <button
              id="submit-region-change-btn"
              type="submit"
              className={`w-full py-3 px-4 rounded-xl font-bold text-sm shadow-md flex items-center justify-center gap-2 transition-all cursor-pointer ${
                isSaved 
                  ? 'bg-emerald-600 text-white' 
                  : 'bg-blue-600 hover:bg-blue-700 text-white shadow-blue-600/20'
              }`}
            >
              {isSaved ? (
                <>
                  <Check className="w-4 h-4" />
                  <span>Region Updated Successfully!</span>
                </>
              ) : (
                <>
                  <Sparkles className="w-4 h-4 text-blue-200" />
                  <span>Apply Regional Curriculum Scope</span>
                </>
              )}
            </button>
          </div>
        </form>
      </div>
    </div>
  );
}
