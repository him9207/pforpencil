import React, { useMemo, useState } from 'react';
import { CheckCircle2, Edit3, Globe2, Plus, RotateCcw, ToggleLeft, ToggleRight, Trash2 } from 'lucide-react';
import { sounds } from '../../../utils/audio';
import { CurriculumMasterData, CountryMaster, RegionMaster, CurriculumMaster as CurriculumMasterRecord, loadCurriculumMaster, saveCurriculumMaster } from '../../../data/curriculumMasterData';

interface Props { onSuccessMessage: (msg: string) => void; }
type Section = 'countries' | 'regions' | 'curricula';

export default function CurriculumMaster({ onSuccessMessage }: Props) {
  const [data, setData] = useState<CurriculumMasterData>(() => loadCurriculumMaster());
  const [section, setSection] = useState<Section>('countries');
  const [search, setSearch] = useState('');
  const [editing, setEditing] = useState<{ type: Section; id: string } | null>(null);
  const [showForm, setShowForm] = useState(false);
  const [name, setName] = useState('');
  const [code, setCode] = useState('');
  const [description, setDescription] = useState('');
  const [sourceUrl, setSourceUrl] = useState('');
  const [countryId, setCountryId] = useState('');
  const [regionId, setRegionId] = useState('');

  const activeCountries = useMemo(() => data.countries.filter(x => x.active).sort((a,b) => a.displayOrder-b.displayOrder), [data]);
  const activeRegions = useMemo(() => data.regions.filter(x => x.active).sort((a,b) => a.displayOrder-b.displayOrder), [data]);
  const filtered = useMemo(() => {
    const q = search.trim().toLowerCase();
    if (section === 'countries') return data.countries.filter(x => !q || `${x.name} ${x.code} ${x.description}`.toLowerCase().includes(q));
    if (section === 'regions') return data.regions.filter(x => !q || `${x.name} ${x.code}`.toLowerCase().includes(q));
    return data.curricula.filter(x => !q || `${x.name} ${x.code} ${x.description}`.toLowerCase().includes(q));
  }, [data, search, section]);

  const persist = (next: CurriculumMasterData, message: string) => { setData(next); saveCurriculumMaster(next); onSuccessMessage(message); sounds.success(); };

  const resetForm = () => { setName(''); setCode(''); setDescription(''); setSourceUrl(''); setCountryId(activeCountries[0]?.id || ''); setRegionId(activeRegions.find(r => r.countryId === activeCountries[0]?.id)?.id || ''); setEditing(null); setShowForm(false); };

  const openCreate = () => {
    setEditing(null); setName(''); setCode(''); setDescription(''); setSourceUrl('');
    setCountryId(activeCountries[0]?.id || '');
    setRegionId(activeRegions.find(r => r.countryId === activeCountries[0]?.id)?.id || '');
    setShowForm(true);
  };

  const openEdit = (item: CountryMaster | RegionMaster | CurriculumMasterRecord) => {
    setEditing({ type: section, id: item.id }); setName(item.name); setCode(item.code); setDescription(item.description);
    setSourceUrl('sourceUrl' in item ? (item.sourceUrl || '') : '');
    setCountryId('countryId' in item ? item.countryId : '');
    setRegionId('regionId' in item ? item.regionId : '');
    setShowForm(true);
  };

  const save = () => {
    if (!name.trim() || !code.trim()) return;
    const normalizedCode = code.trim().toUpperCase().replace(/\s+/g, '-');
    if (section === 'countries') {
      const duplicate = data.countries.some(x => x.code.toLowerCase() === normalizedCode.toLowerCase() && x.id !== editing?.id);
      if (duplicate) return onSuccessMessage('Country code already exists.');
      const item: CountryMaster = { id: editing?.id || normalizedCode, code: normalizedCode, name: name.trim(), description: description.trim(), active: true, displayOrder: data.countries.length + 1 };
      const countries = editing ? data.countries.map(x => x.id === editing.id ? { ...x, ...item, active: x.active } : x) : [...data.countries, item];
      persist({ ...data, countries }, editing ? 'Country updated.' : 'Country created.');
    } else if (section === 'regions') {
      if (!countryId) return onSuccessMessage('Select a country first.');
      const duplicate = data.regions.some(x => x.countryId === countryId && x.code.toLowerCase() === normalizedCode.toLowerCase() && x.id !== editing?.id);
      if (duplicate) return onSuccessMessage('Region code already exists for this country.');
      const item: RegionMaster = { id: editing?.id || normalizedCode, code: normalizedCode, countryId, name: name.trim(), description: description.trim(), active: true, displayOrder: data.regions.length + 1 };
      const regions = editing ? data.regions.map(x => x.id === editing.id ? { ...x, ...item, active: x.active } : x) : [...data.regions, item];
      persist({ ...data, regions }, editing ? 'Region updated.' : 'Region created.');
    } else {
      if (!countryId || !regionId) return onSuccessMessage('Select country and region first.');
      const duplicate = data.curricula.some(x => x.regionId === regionId && x.code.toLowerCase() === normalizedCode.toLowerCase() && x.id !== editing?.id);
      if (duplicate) return onSuccessMessage('Curriculum code already exists for this region.');
      const item: CurriculumMasterRecord = { id: editing?.id || normalizedCode, code: normalizedCode, countryId, regionId, name: name.trim(), description: description.trim(), sourceUrl: sourceUrl.trim() || undefined, active: true, displayOrder: data.curricula.length + 1 };
      const curricula = editing ? data.curricula.map(x => x.id === editing.id ? { ...x, ...item, active: x.active } : x) : [...data.curricula, item];
      persist({ ...data, curricula }, editing ? 'Curriculum updated.' : 'Curriculum created.');
    }
    resetForm();
  };

  const toggle = (type: Section, id: string) => {
    const list = data[type];
    const item = list.find(x => x.id === id) as any;
    if (!item) return;
    const next = { ...data, [type]: list.map((x: any) => x.id === id ? { ...x, active: !x.active } : x) } as CurriculumMasterData;
    persist(next, `${item.name} ${item.active ? 'deactivated' : 'activated'}.`);
    window.dispatchEvent(new CustomEvent('funlearn_master_data_updated', { detail: { type, id } }));
  };

  const remove = (type: Section, id: string) => {
    if (type === 'countries' && data.regions.some(r => r.countryId === id)) return onSuccessMessage('Country has regions. Deactivate it instead of deleting it.');
    if (type === 'regions' && data.curricula.some(c => c.regionId === id)) return onSuccessMessage('Region has curricula. Deactivate it instead of deleting it.');
    if (type === 'curricula') return onSuccessMessage('Curricula are retained for question history. Deactivate instead of deleting.');
    const next = { ...data, [type]: data[type].filter((x: any) => x.id !== id) } as CurriculumMasterData;
    persist(next, 'Master record deleted.');
  };

  const regionsForCountry = data.regions.filter(r => r.countryId === countryId);

  return <div className="space-y-5">
    <div className="bg-white rounded-3xl border border-stone-200 shadow-xs p-5">
      <div className="flex flex-col lg:flex-row lg:items-center justify-between gap-4">
        <div><div className="flex items-center gap-2 text-xs font-bold text-purple-700 uppercase tracking-wider"><Globe2 className="w-4 h-4" /> Curriculum Master</div><h2 className="text-2xl font-black text-stone-900 mt-1">Country → Region → Curriculum</h2><p className="text-xs text-stone-500 mt-1">Manage the global curriculum hierarchy used by Question Bank, Question Creator and bulk imports.</p></div>
        <div className="flex gap-2"><button onClick={openCreate} className="px-4 py-2 rounded-xl bg-purple-600 text-white text-xs font-bold flex items-center gap-1.5"><Plus className="w-4 h-4" /> Add {section === 'countries' ? 'Country' : section === 'regions' ? 'Region' : 'Curriculum'}</button><button onClick={() => { setData(loadCurriculumMaster()); onSuccessMessage('Curriculum Master reloaded.'); }} className="px-3 py-2 rounded-xl border border-stone-200 text-xs font-bold flex items-center gap-1.5"><RotateCcw className="w-3.5 h-3.5" /> Reload</button></div>
      </div>
    </div>
    <div className="flex flex-wrap gap-2 border-b border-stone-200 pb-3">
      {(['countries','regions','curricula'] as Section[]).map(s => <button key={s} onClick={() => { setSection(s); setSearch(''); resetForm(); }} className={`px-4 py-2 rounded-xl text-xs font-bold ${section === s ? 'bg-stone-900 text-white' : 'bg-white border border-stone-200 text-stone-600'}`}>{s === 'countries' ? `Countries (${data.countries.length})` : s === 'regions' ? `States / Regions (${data.regions.length})` : `Curricula (${data.curricula.length})`}</button>)}
    </div>
    <div className="bg-white rounded-2xl border border-stone-200 overflow-hidden">
      <div className="p-4 border-b border-stone-100 flex gap-3"><input value={search} onChange={e => setSearch(e.target.value)} placeholder={`Search ${section}...`} className="flex-1 px-3 py-2 rounded-xl border border-stone-200 text-xs" /></div>
      <div className="overflow-x-auto"><table className="w-full text-xs text-left"><thead className="bg-stone-50 text-[10px] uppercase text-stone-500"><tr><th className="p-3">Code</th><th className="p-3">Name</th>{section !== 'countries' && <th className="p-3">Parent</th>}<th className="p-3">Description</th><th className="p-3">Status</th><th className="p-3">Actions</th></tr></thead><tbody>{filtered.map((item: any) => { const parent = section === 'regions' ? data.countries.find(c => c.id === item.countryId)?.name : section === 'curricula' ? `${data.countries.find(c => c.id === item.countryId)?.name || ''} · ${data.regions.find(r => r.id === item.regionId)?.name || ''}` : ''; return <tr key={item.id} className="border-t border-stone-100"><td className="p-3 font-mono font-bold">{item.code}</td><td className="p-3 font-bold text-stone-800">{item.name}</td>{section !== 'countries' && <td className="p-3 text-stone-500">{parent}</td>}<td className="p-3 text-stone-500 max-w-sm">{item.description || '—'}</td><td className="p-3"><span className={`px-2 py-1 rounded-lg text-[10px] font-bold ${item.active ? 'bg-emerald-50 text-emerald-700' : 'bg-stone-100 text-stone-500'}`}>{item.active ? 'Active' : 'Inactive'}</span></td><td className="p-3"><div className="flex gap-1.5"><button onClick={() => openEdit(item)} className="p-1.5 rounded-lg bg-stone-50 hover:bg-stone-100"><Edit3 className="w-3.5 h-3.5" /></button><button onClick={() => toggle(section,item.id)} className="p-1.5 rounded-lg bg-blue-50 text-blue-700">{item.active ? <ToggleRight className="w-3.5 h-3.5" /> : <ToggleLeft className="w-3.5 h-3.5" />}</button><button onClick={() => remove(section,item.id)} className="p-1.5 rounded-lg bg-red-50 text-red-600"><Trash2 className="w-3.5 h-3.5" /></button></div></td></tr> })}{!filtered.length && <tr><td colSpan={section === 'countries' ? 5 : 6} className="p-10 text-center text-stone-400">No records found.</td></tr>}</tbody></table></div>
    </div>
    {showForm && <div className="fixed inset-0 z-[120] bg-black/30 flex items-center justify-center p-4"><div className="bg-white rounded-2xl shadow-xl w-full max-w-lg p-5 space-y-4"><div className="flex justify-between"><div><h3 className="font-black">{editing ? 'Edit' : 'Add'} {section === 'countries' ? 'Country' : section === 'regions' ? 'State / Region' : 'Curriculum'}</h3><p className="text-[11px] text-stone-500 mt-1">Stable code is used by CSV/Excel imports.</p></div><button onClick={resetForm}>×</button></div>
      {section !== 'countries' && <label className="block text-xs font-bold">Country<select value={countryId} onChange={e => { setCountryId(e.target.value); setRegionId(activeRegions.find(r=>r.countryId===e.target.value)?.id || ''); }} className="w-full mt-1 p-2.5 rounded-xl border border-stone-200">{activeCountries.map(c=><option key={c.id} value={c.id}>{c.name} ({c.code})</option>)}</select></label>}
      {section === 'curricula' && <label className="block text-xs font-bold">State / Region<select value={regionId} onChange={e=>setRegionId(e.target.value)} className="w-full mt-1 p-2.5 rounded-xl border border-stone-200">{regionsForCountry.map(r=><option key={r.id} value={r.id}>{r.name} ({r.code})</option>)}</select></label>}
      <div className="grid grid-cols-2 gap-3"><label className="text-xs font-bold">Name<input value={name} onChange={e=>setName(e.target.value)} className="w-full mt-1 p-2.5 rounded-xl border border-stone-200" /></label><label className="text-xs font-bold">Code<input value={code} onChange={e=>setCode(e.target.value)} className="w-full mt-1 p-2.5 rounded-xl border border-stone-200 font-mono uppercase" /></label></div>
      <label className="block text-xs font-bold">Description<textarea value={description} onChange={e=>setDescription(e.target.value)} rows={3} className="w-full mt-1 p-2.5 rounded-xl border border-stone-200" /></label>
      {section === 'curricula' && <label className="block text-xs font-bold">Source URL <span className="font-normal text-stone-400">(optional)</span><input value={sourceUrl} onChange={e=>setSourceUrl(e.target.value)} className="w-full mt-1 p-2.5 rounded-xl border border-stone-200" /></label>}
      <div className="flex justify-end gap-2"><button onClick={resetForm} className="px-3 py-2 rounded-xl border border-stone-200 text-xs font-bold">Cancel</button><button onClick={save} className="px-4 py-2 rounded-xl bg-purple-600 text-white text-xs font-bold flex items-center gap-1.5"><CheckCircle2 className="w-3.5 h-3.5" /> Save</button></div>
    </div></div>}
  </div>;
}
