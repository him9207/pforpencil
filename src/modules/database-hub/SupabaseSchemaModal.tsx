import { useState, useEffect, useMemo } from 'react';
import { 
  Database, 
  Copy, 
  Check, 
  ShieldCheck, 
  Table, 
  Layers, 
  Key, 
  X,
  RefreshCw,
  Sparkles,
  CheckCircle2,
  AlertCircle,
  ExternalLink,
  Eye,
  EyeOff,
  Server,
  Zap,
  Save,
  ArrowRight,
  HelpCircle,
  FileCode,
  CheckCheck,
  Send,
  Download
} from 'lucide-react';
import { 
  getSupabaseCredentials, 
  saveSupabaseCredentials, 
  testSupabaseConnection,
  analyzeSupabaseKey,
  KeyAnalysis,
  seedInitialDataToSupabase, 
  fetchSupabaseTableRows, 
  fetchAllSupabaseTableCounts,
  syncActivityAttemptToSupabase,
  DetailedSeedReport,
  getCombinedSupabaseSql, 
  getCompleteSupabaseSchemaSql, 
  getCompleteSupabaseSeedSql,
  DATABASE_TABLES
} from '../../database';
import { 
  UserAccount, 
  Question, 
  Activity, 
  SchoolOrganization, 
  ClassRoom, 
  StudentProgress, 
  CurriculumFramework 
} from '../../types';

interface SupabaseSchemaModalProps {
  isOpen: boolean;
  onClose: () => void;
  allUsers?: UserAccount[];
  questions?: Question[];
  activities?: Activity[];
  schools?: SchoolOrganization[];
  classes?: ClassRoom[];
  studentProgressMap?: Record<string, StudentProgress>;
  frameworks?: CurriculumFramework[];
}

export default function SupabaseSchemaModal({
  isOpen,
  onClose,
  allUsers = [],
  questions = [],
  activities = [],
  schools = [],
  classes = [],
  studentProgressMap = {},
  frameworks = []
}: SupabaseSchemaModalProps) {
  const [copiedType, setCopiedType] = useState<'combined' | 'schema' | 'seed' | null>(null);
  const [activeTab, setActiveTab] = useState<'setup' | 'data' | 'tables' | 'sql'>('setup');
  const [sqlViewMode, setSqlViewMode] = useState<'combined' | 'schema' | 'seed'>('combined');

  // Live Table Inspector States
  const [selectedTable, setSelectedTable] = useState<string>('schools');
  const [tableRows, setTableRows] = useState<any[]>([]);
  const [isLoadingRows, setIsLoadingRows] = useState(false);
  const [tableError, setTableError] = useState<string | null>(null);
  const [testAttemptSending, setTestAttemptSending] = useState(false);
  const [testAttemptResult, setTestAttemptResult] = useState<string | null>(null);

  // Live Table Counts Cache
  const [liveCounts, setLiveCounts] = useState<Record<string, number | 'error' | 'not_found'>>({});
  const [isLoadingCounts, setIsLoadingCounts] = useState(false);

  // Supabase Credentials State
  const [inputUrl, setInputUrl] = useState('');
  const [inputKey, setInputKey] = useState('');
  const [showKey, setShowKey] = useState(false);
  const [isSaved, setIsSaved] = useState(false);

  // Live Test and Seed states
  const [isTesting, setIsTesting] = useState(false);
  const [testResult, setTestResult] = useState<{
    success?: boolean;
    message?: string;
    details?: string;
    suggestedUrl?: string;
  } | null>(null);

  const [isSeeding, setIsSeeding] = useState(false);
  const [seedReport, setSeedReport] = useState<DetailedSeedReport | null>(null);
  const [seedErrorMessage, setSeedErrorMessage] = useState<string | null>(null);

  // Real-time analysis of the entered key
  const keyAnalysis = useMemo<KeyAnalysis>(() => {
    return analyzeSupabaseKey(inputKey, inputUrl);
  }, [inputKey, inputUrl]);

  // Generate dynamic SQL scripts with live application data
  const combinedSql = useMemo(() => {
    return getCombinedSupabaseSql(allUsers, questions, activities, schools, classes, studentProgressMap, frameworks);
  }, [allUsers, questions, activities, schools, classes, studentProgressMap, frameworks]);

  const schemaOnlySql = useMemo(() => {
    return getCompleteSupabaseSchemaSql();
  }, []);

  const seedOnlySql = useMemo(() => {
    return getCompleteSupabaseSeedSql(allUsers, questions, activities, schools, classes, studentProgressMap, frameworks);
  }, [allUsers, questions, activities, schools, classes, studentProgressMap, frameworks]);

  // Primary tables to inspect
  const tableList = [
    { id: 'schools', name: 'schools', label: 'Schools & Orgs', desc: 'School organizations & quotas', expectedCount: schools.length || 2 },
    { id: 'profiles', name: 'profiles', label: 'User Profiles', desc: 'All user accounts (Admins, Teachers, Students, Parents)', expectedCount: allUsers.length || 8 },
    { id: 'classes', name: 'classes', label: 'Classrooms', desc: 'Class sections & student rosters', expectedCount: classes.length || 2 },
    { id: 'curriculum_frameworks', name: 'curriculum_frameworks', label: 'Curricula', desc: 'Curriculum standards (CBSE, CCSS, UK NC, etc.)', expectedCount: frameworks.length || 6 },
    { id: 'questions', name: 'questions', label: 'Questions Bank', desc: 'Master multi-grade question bank', expectedCount: questions.length || 45 },
    { id: 'activities', name: 'activities', label: 'Activities', desc: 'Interactive lessons & challenges', expectedCount: activities.length || 10 },
    { id: 'activity_steps', name: 'activity_steps', label: 'Activity Steps', desc: 'Step sequences per activity', expectedCount: 15 },
    { id: 'activity_question_links', name: 'activity_question_links', label: 'Question Links', desc: 'Question linkages per activity', expectedCount: 20 },
    { id: 'student_progress', name: 'student_progress', label: 'Student Progress', desc: 'XP, coins, level, streak, mastery', expectedCount: allUsers.filter(u => u.role === 'student').length || 4 },
    { id: 'activity_attempts', name: 'activity_attempts', label: 'Quiz Attempts', desc: 'Recorded student quiz submissions', expectedCount: 'Live logs' }
  ];

  // Refresh counts from Supabase
  const refreshAllCounts = async () => {
    setIsLoadingCounts(true);
    try {
      const counts = await fetchAllSupabaseTableCounts();
      setLiveCounts(counts);
    } catch {
      // Ignore
    } finally {
      setIsLoadingCounts(false);
    }
  };

  // Populate credentials whenever the modal opens
  useEffect(() => {
    if (isOpen) {
      const creds = getSupabaseCredentials();
      setInputUrl(creds.url || 'https://ycmfuudgxutmkhhhpciu.supabase.co');
      setInputKey(creds.anonKey || '');
      setIsSaved(false);
      setSeedReport(null);
      setSeedErrorMessage(null);

      if (creds.url && creds.anonKey && creds.anonKey.length > 20) {
        runTest(creds.url, creds.anonKey);
        refreshAllCounts();
      }
    }
  }, [isOpen]);

  if (!isOpen) return null;

  const runTest = async (urlToTest?: string, keyToTest?: string) => {
    setIsTesting(true);
    setTestResult(null);

    const targetUrl = (urlToTest ?? inputUrl).trim();
    const targetKey = (keyToTest ?? inputKey).trim();

    const res = await testSupabaseConnection(targetUrl, targetKey);
    setTestResult(res);
    setIsTesting(false);
    if (res.success) {
      refreshAllCounts();
    }
  };

  const handleApplySuggestedUrl = (suggestedUrl: string) => {
    setInputUrl(suggestedUrl);
    saveSupabaseCredentials(suggestedUrl, inputKey);
    runTest(suggestedUrl, inputKey);
  };

  const handleSaveAndTest = () => {
    saveSupabaseCredentials(inputUrl, inputKey);
    setIsSaved(true);
    setTimeout(() => setIsSaved(false), 3000);
    runTest(inputUrl, inputKey);
  };

  const handleSeedData = async () => {
    setIsSeeding(true);
    setSeedReport(null);
    setSeedErrorMessage(null);

    try {
      saveSupabaseCredentials(inputUrl, inputKey);
      const report = await seedInitialDataToSupabase(
        allUsers, 
        questions, 
        activities, 
        schools, 
        classes, 
        studentProgressMap, 
        frameworks
      );
      setSeedReport(report);
      await refreshAllCounts();
      if (selectedTable) {
        refreshTableData(selectedTable);
      }
    } catch (err: any) {
      setSeedErrorMessage(err?.message || 'Error occurred while communicating with Supabase.');
    } finally {
      setIsSeeding(false);
    }
  };

  const refreshTableData = async (tbl: string = selectedTable) => {
    setIsLoadingRows(true);
    setTableError(null);
    try {
      const res = await fetchSupabaseTableRows(tbl, 25);
      if (res.success) {
        setTableRows(res.rows || []);
      } else {
        setTableError(res.error || 'Failed to fetch rows');
        setTableRows([]);
      }
    } catch (err: any) {
      setTableError(err?.message || 'Error querying table');
      setTableRows([]);
    } finally {
      setIsLoadingRows(false);
    }
  };

  const handleSendTestAttempt = async () => {
    setTestAttemptSending(true);
    setTestAttemptResult(null);
    try {
      const res = await syncActivityAttemptToSupabase(
        'STU00001',
        'ACT-TEST-001',
        100,
        5,
        50,
        15,
        true
      );
      if (res.success) {
        setTestAttemptResult('✅ Test quiz attempt successfully saved to Supabase (activity_attempts table)!');
        refreshAllCounts();
        if (selectedTable === 'activity_attempts') {
          refreshTableData('activity_attempts');
        }
      } else {
        setTestAttemptResult(`❌ Supabase rejected write: ${res.error || 'Check that tables exist and RLS policies are applied'}`);
      }
    } catch (err: any) {
      setTestAttemptResult(`❌ Error: ${err?.message || String(err)}`);
    } finally {
      setTestAttemptSending(false);
    }
  };

  const copySql = (type: 'combined' | 'schema' | 'seed') => {
    let sqlText = combinedSql;
    if (type === 'schema') sqlText = schemaOnlySql;
    if (type === 'seed') sqlText = seedOnlySql;

    navigator.clipboard.writeText(sqlText);
    setCopiedType(type);
    setTimeout(() => setCopiedType(null), 2500);
  };

  const downloadSql = () => {
    const element = document.createElement('a');
    const file = new Blob([combinedSql], { type: 'text/plain' });
    element.href = URL.createObjectURL(file);
    element.download = 'pforpencil_supabase_complete.sql';
    document.body.appendChild(element);
    element.click();
    document.body.removeChild(element);
  };

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center p-3 sm:p-4 bg-stone-950/75 backdrop-blur-xs animate-fade-in font-sans">
      <div className="bg-white rounded-3xl w-full max-w-4xl overflow-hidden shadow-2xl border border-stone-200 flex flex-col max-h-[92vh]">
        
        {/* Header */}
        <div className="p-5 sm:p-6 bg-stone-900 text-white flex items-center justify-between">
          <div className="flex items-center gap-3">
            <div className="w-10 h-10 rounded-2xl bg-emerald-950 text-emerald-400 border border-emerald-800/80 flex items-center justify-center shadow-md">
              <Database className="w-5 h-5" />
            </div>
            <div>
              <div className="flex items-center gap-2">
                <span className="text-[10px] font-extrabold px-2 py-0.5 rounded-full bg-emerald-500/20 text-emerald-400 uppercase tracking-wider font-mono">
                  SUPABASE POSTGRESQL + RLS
                </span>
                <span className="text-[10px] text-stone-300 bg-stone-800 px-2 py-0.5 rounded-full font-medium">
                  Live Database Hub
                </span>
              </div>
              <h2 className="text-base sm:text-lg font-bold text-white tracking-tight">
                Supabase Schema, Population & Live Sync
              </h2>
            </div>
          </div>
          <button
            onClick={onClose}
            className="p-2 rounded-xl text-stone-400 hover:text-white hover:bg-stone-800 transition cursor-pointer"
            title="Close"
          >
            <X className="w-5 h-5" />
          </button>
        </div>

        {/* Tab Navigation */}
        <div className="flex items-center gap-2 px-6 pt-3 border-b border-slate-200 bg-slate-50 text-xs font-bold overflow-x-auto">
          <button
            onClick={() => setActiveTab('setup')}
            className={`pb-3 border-b-2 flex items-center gap-1.5 transition cursor-pointer whitespace-nowrap ${
              activeTab === 'setup'
                ? 'border-blue-600 text-blue-700 font-extrabold'
                : 'border-transparent text-slate-500 hover:text-slate-800'
            }`}
          >
            <Zap className="w-4 h-4 text-blue-600" />
            <span>⚡ Setup & Populate Tables</span>
          </button>
          <button
            onClick={() => {
              setActiveTab('data');
              refreshTableData(selectedTable);
            }}
            className={`pb-3 border-b-2 flex items-center gap-1.5 transition cursor-pointer whitespace-nowrap ${
              activeTab === 'data'
                ? 'border-blue-600 text-blue-700 font-extrabold'
                : 'border-transparent text-slate-500 hover:text-slate-800'
            }`}
          >
            <Database className="w-4 h-4 text-emerald-600" />
            <span>📊 Live Table Inspector</span>
          </button>
          <button
            onClick={() => setActiveTab('tables')}
            className={`pb-3 border-b-2 flex items-center gap-1.5 transition cursor-pointer whitespace-nowrap ${
              activeTab === 'tables'
                ? 'border-blue-600 text-blue-700 font-extrabold'
                : 'border-transparent text-slate-500 hover:text-slate-800'
            }`}
          >
            <Table className="w-4 h-4" />
            <span>Table Schema Architecture</span>
          </button>
          <button
            onClick={() => setActiveTab('sql')}
            className={`pb-3 border-b-2 flex items-center gap-1.5 transition cursor-pointer whitespace-nowrap ${
              activeTab === 'sql'
                ? 'border-blue-600 text-blue-700 font-extrabold'
                : 'border-transparent text-slate-500 hover:text-slate-800'
            }`}
          >
            <FileCode className="w-4 h-4 text-indigo-600" />
            <span>SQL Scripts (Schema + Seed)</span>
          </button>
        </div>

        {/* Modal Body */}
        <div className="p-6 overflow-y-auto space-y-6 flex-1 text-xs">
          
          {/* TAB 1: SETUP & POPULATE TABLES */}
          {activeTab === 'setup' && (
            <div className="space-y-6 animate-fade-in">

              {/* CRITICAL EXPLANATION BANNER: WHY TABLES WERE EMPTY */}
              <div className="p-4 sm:p-5 rounded-2xl bg-amber-50/80 border border-amber-300 text-amber-950 space-y-3">
                <div className="flex items-start gap-3">
                  <div className="w-8 h-8 rounded-xl bg-amber-500 text-white flex items-center justify-center shrink-0 shadow-xs font-bold text-sm">
                    💡
                  </div>
                  <div>
                    <h3 className="text-sm font-bold text-amber-900">
                      Why are my Supabase tables initially empty?
                    </h3>
                    <p className="text-xs text-amber-800 mt-1 leading-relaxed">
                      Executing standard DDL (<code>CREATE TABLE</code>) sets up the empty structure and columns in Supabase. It does <strong>not</strong> insert sample records automatically.
                    </p>
                    <p className="text-xs text-amber-900 font-bold mt-2">
                      To fill all tables with data, choose either of the two instant methods below:
                    </p>
                  </div>
                </div>

                <div className="grid grid-cols-1 sm:grid-cols-2 gap-3 pt-2">
                  <div className="p-3 bg-white rounded-xl border border-amber-200 shadow-2xs space-y-1">
                    <span className="font-bold text-emerald-800 text-[11px] uppercase tracking-wider flex items-center gap-1">
                      <Zap className="w-3.5 h-3.5 text-emerald-600" />
                      Method 1: 1-Click In-App Seeder
                    </span>
                    <p className="text-[11px] text-stone-600 leading-snug">
                      Click the green <strong>"⚡ Populate All Supabase Tables Now"</strong> button below. The app will insert schools, profiles, questions, classes, and activities directly via Supabase API!
                    </p>
                  </div>
                  <div className="p-3 bg-white rounded-xl border border-amber-200 shadow-2xs space-y-1">
                    <span className="font-bold text-indigo-800 text-[11px] uppercase tracking-wider flex items-center gap-1">
                      <FileCode className="w-3.5 h-3.5 text-indigo-600" />
                      Method 2: Complete SQL in Supabase Editor
                    </span>
                    <p className="text-[11px] text-stone-600 leading-snug">
                      Go to the <strong>SQL Scripts</strong> tab, click <strong>"Copy Complete SQL (Schema + Seed Data)"</strong>, and click Run in your Supabase SQL Editor.
                    </p>
                  </div>
                </div>
              </div>

              {/* LIVE TABLE STATUS OVERVIEW */}
              <div className="p-5 rounded-2xl bg-slate-50 border border-slate-200 space-y-4">
                <div className="flex items-center justify-between">
                  <div className="flex items-center gap-2">
                    <Database className="w-4 h-4 text-emerald-600" />
                    <span className="font-bold text-slate-900 text-sm">Supabase Database Tables Status</span>
                  </div>
                  <button
                    onClick={refreshAllCounts}
                    disabled={isLoadingCounts || !inputKey}
                    className="px-3 py-1.5 rounded-lg bg-white hover:bg-slate-100 text-slate-700 border border-slate-300 font-bold text-[11px] transition flex items-center gap-1.5 cursor-pointer shadow-2xs disabled:opacity-50"
                  >
                    <RefreshCw className={`w-3.5 h-3.5 ${isLoadingCounts ? 'animate-spin text-blue-600' : ''}`} />
                    <span>Refresh Table Status</span>
                  </button>
                </div>

                <div className="grid grid-cols-2 sm:grid-cols-5 gap-2.5">
                  {tableList.slice(0, 10).map((t) => {
                    const count = liveCounts[t.id];
                    const isNotFound = count === 'not_found';
                    const isError = count === 'error';
                    const isPopulated = typeof count === 'number' && count > 0;

                    return (
                      <div 
                        key={t.id}
                        onClick={() => {
                          setSelectedTable(t.id);
                          setActiveTab('data');
                          refreshTableData(t.id);
                        }}
                        className={`p-3 rounded-xl border transition cursor-pointer hover:shadow-xs flex flex-col justify-between ${
                          isPopulated 
                            ? 'bg-emerald-50/70 border-emerald-200 text-emerald-950'
                            : isNotFound
                            ? 'bg-slate-100/60 border-slate-200 text-slate-700'
                            : isError
                            ? 'bg-rose-50 border-rose-200 text-rose-950'
                            : 'bg-white border-slate-200 text-slate-900'
                        }`}
                      >
                        <div className="flex items-center justify-between mb-1">
                          <span className="font-bold text-[11px] truncate">{t.name}</span>
                          {isPopulated && <CheckCircle2 className="w-3.5 h-3.5 text-emerald-600 shrink-0" />}
                        </div>
                        <div className="flex items-baseline justify-between pt-1">
                          <span className="text-[10px] text-stone-500">Live Rows:</span>
                          <span className={`font-mono font-bold text-xs ${
                            isPopulated ? 'text-emerald-700' : isNotFound ? 'text-slate-400' : 'text-stone-700'
                          }`}>
                            {isLoadingCounts ? '...' : typeof count === 'number' ? `${count} rows` : isNotFound ? 'Not created' : isError ? 'Error' : 'Ready'}
                          </span>
                        </div>
                      </div>
                    );
                  })}
                </div>
              </div>

              {/* SEED ACTION BUTTON */}
              <div className="p-5 rounded-2xl bg-gradient-to-br from-emerald-500 to-teal-700 text-white shadow-lg space-y-4">
                <div className="flex flex-col sm:flex-row items-start sm:items-center justify-between gap-3">
                  <div className="space-y-1">
                    <div className="flex items-center gap-2">
                      <span className="px-2 py-0.5 rounded-full bg-white/20 text-white font-extrabold text-[10px] uppercase font-mono tracking-wider">
                        1-Click Database Fill
                      </span>
                    </div>
                    <h3 className="text-base font-extrabold text-white">
                      Fill All Tables with Real School & Curriculum Data
                    </h3>
                    <p className="text-xs text-emerald-100 max-w-xl leading-relaxed">
                      Upserts <strong>{allUsers.length} user profiles</strong>, <strong>{schools.length} schools</strong>, <strong>{questions.length} questions</strong>, <strong>{activities.length} activities</strong>, classrooms, and student progress records into your Supabase database.
                    </p>
                  </div>

                  <button
                    onClick={handleSeedData}
                    disabled={isSeeding || !inputUrl || !inputKey}
                    className="w-full sm:w-auto px-6 py-3 rounded-2xl bg-white text-emerald-900 hover:bg-emerald-50 font-black text-xs transition flex items-center justify-center gap-2 shadow-xl cursor-pointer shrink-0 disabled:opacity-50 disabled:cursor-not-allowed transform hover:-translate-y-0.5"
                  >
                    <Zap className={`w-4 h-4 text-emerald-600 ${isSeeding ? 'animate-bounce' : ''}`} />
                    <span>{isSeeding ? 'Populating All Tables...' : '⚡ Populate All Supabase Tables Now'}</span>
                  </button>
                </div>

                {/* Seeding Results Breakdown */}
                {seedReport && (
                  <div className="mt-3 p-4 rounded-xl bg-emerald-950/80 border border-emerald-400/40 text-emerald-100 space-y-3 animate-fade-in">
                    <div className="flex items-center justify-between">
                      <div className="flex items-center gap-2 font-bold text-white text-xs">
                        <CheckCircle2 className="w-4 h-4 text-emerald-400" />
                        <span>{seedReport.message}</span>
                      </div>
                      <span className="font-mono text-[11px] font-bold bg-emerald-800/60 px-2 py-0.5 rounded-full text-emerald-200">
                        {seedReport.totalRowsInserted} Total Rows Added
                      </span>
                    </div>

                    <div className="grid grid-cols-2 sm:grid-cols-4 gap-2 pt-1 text-[11px]">
                      {seedReport.tables.map((tbl) => (
                        <div key={tbl.tableName} className="p-2 rounded-lg bg-emerald-900/60 border border-emerald-700/40 flex items-center justify-between">
                          <span className="truncate">{tbl.label}:</span>
                          <span className={`font-mono font-bold ${tbl.success ? 'text-emerald-300' : 'text-rose-400'}`}>
                            {tbl.success ? `✅ ${tbl.inserted}` : '❌ Error'}
                          </span>
                        </div>
                      ))}
                    </div>
                  </div>
                )}

                {seedErrorMessage && (
                  <div className="mt-3 p-3.5 rounded-xl bg-rose-950/90 border border-rose-500/50 text-rose-100 text-xs flex items-start gap-2 animate-fade-in">
                    <AlertCircle className="w-4 h-4 text-rose-400 shrink-0 mt-0.5" />
                    <div>
                      <span className="font-bold">Error during seeding:</span> {seedErrorMessage}
                      <p className="text-[11px] text-rose-200 mt-1">
                        👉 Tip: Make sure you ran the SQL Schema first in your Supabase SQL Editor so tables exist!
                      </p>
                    </div>
                  </div>
                )}
              </div>

              {/* CONNECTION CONFIGURATION BOX */}
              <div className="p-5 rounded-2xl bg-slate-50 border border-slate-200 space-y-4">
                <div className="flex items-center justify-between pb-2 border-b border-slate-200">
                  <div className="flex items-center gap-2">
                    <Server className="w-4 h-4 text-blue-600" />
                    <span className="font-bold text-slate-900 text-sm">Supabase Credentials</span>
                  </div>
                  <span className={`text-[11px] font-bold px-2.5 py-1 rounded-full ${
                    testResult?.success 
                      ? 'bg-emerald-100 text-emerald-800 border border-emerald-300'
                      : inputKey.length > 20
                      ? 'bg-blue-100 text-blue-800 border border-blue-300'
                      : 'bg-rose-100 text-rose-800 border border-rose-300'
                  }`}>
                    {testResult?.success ? '✅ Connection Active' : inputKey.length > 20 ? 'Ready to Test' : 'Needs API Key'}
                  </span>
                </div>

                <div className="space-y-3">
                  <div>
                    <label className="block text-[11px] font-bold text-slate-700 uppercase tracking-wider mb-1">
                      Supabase Project URL
                    </label>
                    <input
                      type="text"
                      value={inputUrl}
                      onChange={(e) => setInputUrl(e.target.value)}
                      placeholder="https://ycmfuudgxutmkhhhpciu.supabase.co"
                      className="w-full px-3.5 py-2.5 text-xs font-mono rounded-xl border border-slate-300 bg-white focus:outline-none focus:ring-2 focus:ring-blue-500"
                    />
                  </div>

                  <div>
                    <div className="flex items-center justify-between mb-1">
                      <label className="block text-[11px] font-bold text-slate-700 uppercase tracking-wider">
                        Supabase anon / public API Key
                      </label>
                      <a
                        href="https://supabase.com/dashboard"
                        target="_blank"
                        rel="noreferrer"
                        className="text-[11px] text-blue-600 hover:text-blue-800 font-semibold flex items-center gap-1"
                      >
                        <span>Open Supabase Dashboard</span>
                        <ExternalLink className="w-3 h-3" />
                      </a>
                    </div>
                    <div className="relative">
                      <input
                        type={showKey ? 'text' : 'password'}
                        value={inputKey}
                        onChange={(e) => setInputKey(e.target.value)}
                        placeholder="Paste your anon public key (eyJhbGciOiJIUzI1NiIsInR5cCI6...)"
                        className="w-full pl-3.5 pr-10 py-2.5 text-xs font-mono rounded-xl border border-slate-300 bg-white focus:outline-none focus:ring-2 focus:ring-blue-500"
                      />
                      <button
                        type="button"
                        onClick={() => setShowKey(!showKey)}
                        className="absolute right-3 top-1/2 -translate-y-1/2 text-slate-400 hover:text-slate-600"
                      >
                        {showKey ? <EyeOff className="w-4 h-4" /> : <Eye className="w-4 h-4" />}
                      </button>
                    </div>

                    {/* Real-time Key Inspection Badge */}
                    {inputKey.length > 20 && (
                      <div className="mt-2 space-y-2">
                        {keyAnalysis.mismatchWithUrl && keyAnalysis.ref && (
                          <div className="p-3 rounded-xl bg-amber-50 border border-amber-300 text-amber-900 text-xs flex flex-col sm:flex-row items-start sm:items-center justify-between gap-2">
                            <div className="space-y-0.5">
                              <div className="font-bold flex items-center gap-1.5 text-amber-800">
                                <AlertCircle className="w-4 h-4 text-amber-600 shrink-0" />
                                <span>Project Mismatch Detected</span>
                              </div>
                              <p className="text-[11px] text-amber-700 leading-snug">
                                Key is for project <code className="font-mono font-bold bg-amber-100 px-1 py-0.5 rounded">{keyAnalysis.ref}</code>, but Project URL is <code className="font-mono font-bold bg-amber-100 px-1 py-0.5 rounded">{keyAnalysis.urlRef || 'unknown'}</code>.
                              </p>
                            </div>
                            <button
                              type="button"
                              onClick={() => handleApplySuggestedUrl(`https://${keyAnalysis.ref}.supabase.co`)}
                              className="px-3 py-1.5 rounded-lg bg-amber-600 hover:bg-amber-700 text-white font-bold text-[11px] shrink-0 transition flex items-center gap-1 shadow-xs cursor-pointer"
                            >
                              <span>Fix URL & Test</span>
                              <ArrowRight className="w-3 h-3" />
                            </button>
                          </div>
                        )}

                        {keyAnalysis.isValidJwt && !keyAnalysis.mismatchWithUrl && (
                          <div className="p-2 rounded-lg bg-emerald-50 border border-emerald-200 text-emerald-800 text-[11px] flex items-center gap-1.5 font-medium">
                            <CheckCircle2 className="w-3.5 h-3.5 text-emerald-600 shrink-0" />
                            <span>Key format verified: Project <strong>{keyAnalysis.ref}</strong> (Role: <strong>{keyAnalysis.role || 'anon'}</strong>)</span>
                          </div>
                        )}
                      </div>
                    )}
                  </div>
                </div>

                {/* Test Connection Action Buttons */}
                <div className="flex flex-wrap items-center gap-3 pt-3 border-t border-slate-200">
                  <button
                    onClick={() => runTest()}
                    disabled={isTesting || !inputUrl || !inputKey}
                    className="px-4 py-2 rounded-xl bg-blue-600 hover:bg-blue-700 text-white font-bold text-xs transition flex items-center gap-2 shadow-xs cursor-pointer disabled:opacity-40"
                  >
                    <RefreshCw className={`w-3.5 h-3.5 ${isTesting ? 'animate-spin' : ''}`} />
                    <span>{isTesting ? 'Testing Connection...' : '⚡ Test Connection'}</span>
                  </button>

                  <button
                    onClick={handleSaveAndTest}
                    className="px-4 py-2 rounded-xl bg-slate-900 hover:bg-slate-800 text-white font-bold text-xs transition flex items-center gap-1.5 shadow-xs cursor-pointer"
                  >
                    <Save className="w-3.5 h-3.5" />
                    <span>Save Credentials</span>
                  </button>
                  {isSaved && (
                    <span className="text-emerald-600 font-bold text-xs flex items-center gap-1">
                      <Check className="w-3.5 h-3.5" /> Saved!
                    </span>
                  )}
                </div>

                {testResult && (
                  <div className={`p-3 rounded-xl border text-xs ${
                    testResult.success 
                      ? 'bg-emerald-50 border-emerald-200 text-emerald-900'
                      : 'bg-rose-50 border-rose-200 text-rose-900'
                  }`}>
                    <div className="font-bold flex items-center gap-1.5">
                      {testResult.success ? <CheckCircle2 className="w-4 h-4 text-emerald-600" /> : <AlertCircle className="w-4 h-4 text-rose-600" />}
                      <span>{testResult.message}</span>
                    </div>
                    {testResult.details && (
                      <p className="mt-1 text-[11px] opacity-85">{testResult.details}</p>
                    )}
                  </div>
                )}
              </div>

            </div>
          )}

          {/* TAB 2: LIVE TABLE INSPECTOR */}
          {activeTab === 'data' && (
            <div className="space-y-4 animate-fade-in">
              <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-3 p-4 rounded-2xl bg-slate-50 border border-slate-200">
                <div className="flex flex-wrap items-center gap-2">
                  <span className="font-bold text-slate-700">Select Table:</span>
                  <select
                    value={selectedTable}
                    onChange={(e) => {
                      const val = e.target.value;
                      setSelectedTable(val);
                      refreshTableData(val);
                    }}
                    className="px-3 py-1.5 text-xs font-bold rounded-xl border border-slate-300 bg-white shadow-2xs focus:outline-none focus:ring-2 focus:ring-blue-500 cursor-pointer"
                  >
                    {tableList.map((t) => (
                      <option key={t.id} value={t.id}>
                        {t.name} ({typeof liveCounts[t.id] === 'number' ? `${liveCounts[t.id]} rows` : 'Table'})
                      </option>
                    ))}
                  </select>

                  <button
                    onClick={() => refreshTableData(selectedTable)}
                    disabled={isLoadingRows}
                    className="p-1.5 rounded-lg bg-white border border-slate-300 text-slate-700 hover:bg-slate-100 transition cursor-pointer shadow-2xs"
                    title="Refresh Table Data"
                  >
                    <RefreshCw className={`w-3.5 h-3.5 ${isLoadingRows ? 'animate-spin text-blue-600' : ''}`} />
                  </button>
                </div>

                <div className="flex items-center gap-2">
                  <button
                    onClick={handleSendTestAttempt}
                    disabled={testAttemptSending}
                    className="px-3 py-1.5 rounded-xl bg-purple-600 hover:bg-purple-700 text-white font-bold text-xs transition flex items-center gap-1.5 shadow-2xs cursor-pointer disabled:opacity-50"
                  >
                    <Send className="w-3.5 h-3.5" />
                    <span>{testAttemptSending ? 'Sending...' : 'Insert Test Quiz Record'}</span>
                  </button>
                </div>
              </div>

              {testAttemptResult && (
                <div className="p-3 rounded-xl bg-purple-50 border border-purple-200 text-purple-900 text-xs animate-fade-in flex items-center justify-between">
                  <span>{testAttemptResult}</span>
                  <button 
                    onClick={() => setTestAttemptResult(null)}
                    className="text-purple-600 hover:text-purple-900 font-bold ml-2"
                  >
                    ✕
                  </button>
                </div>
              )}

              {tableError && (
                <div className="p-4 rounded-xl bg-rose-50 border border-rose-200 text-rose-900 text-xs">
                  <div className="font-bold flex items-center gap-1.5 text-rose-800">
                    <AlertCircle className="w-4 h-4 text-rose-600 shrink-0" />
                    <span>Could not query table "{selectedTable}"</span>
                  </div>
                  <p className="mt-1 text-[11px] text-rose-700">{tableError}</p>
                </div>
              )}

              {/* Table Rows Viewer */}
              <div className="rounded-2xl border border-slate-200 overflow-hidden bg-white shadow-2xs">
                <div className="px-4 py-2.5 bg-slate-900 text-white flex items-center justify-between text-xs font-mono">
                  <span>Table: <strong>{selectedTable}</strong> ({tableRows.length} rows retrieved)</span>
                  {isLoadingRows && <span className="text-blue-400 animate-pulse">Loading live rows...</span>}
                </div>

                {tableRows.length === 0 && !isLoadingRows ? (
                  <div className="p-8 text-center text-slate-400 space-y-2">
                    <Database className="w-8 h-8 mx-auto text-slate-300 opacity-60" />
                    <p className="font-bold text-xs text-slate-600">No records found in table "{selectedTable}" yet.</p>
                    <p className="text-[11px] text-slate-400 max-w-sm mx-auto">
                      Click the <strong>"Populate All Supabase Tables"</strong> button in the Setup tab or run the SQL script to insert initial records.
                    </p>
                  </div>
                ) : (
                  <div className="overflow-x-auto max-h-[360px]">
                    <table className="w-full text-[11px] text-left">
                      <thead className="bg-slate-100 text-slate-700 font-bold uppercase tracking-wider sticky top-0 border-b border-slate-200">
                        <tr>
                          {tableRows[0] && Object.keys(tableRows[0]).slice(0, 8).map((col) => (
                            <th key={col} className="px-3 py-2 whitespace-nowrap">{col}</th>
                          ))}
                        </tr>
                      </thead>
                      <tbody className="divide-y divide-slate-100">
                        {tableRows.map((row, idx) => (
                          <tr key={row.id || idx} className="hover:bg-slate-50 transition font-mono">
                            {Object.keys(tableRows[0] || {}).slice(0, 8).map((col) => {
                              const val = row[col];
                              const displayVal = typeof val === 'object' ? JSON.stringify(val) : String(val ?? 'NULL');
                              return (
                                <td key={col} className="px-3 py-2 whitespace-nowrap max-w-[200px] truncate text-slate-800">
                                  {displayVal}
                                </td>
                              );
                            })}
                          </tr>
                        ))}
                      </tbody>
                    </table>
                  </div>
                )}
              </div>
            </div>
          )}

          {/* TAB 3: TABLE ENTITIES ARCHITECTURE */}
          {activeTab === 'tables' && (
            <div className="space-y-4 animate-fade-in">
              <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
                {tableList.map((t) => (
                  <div key={t.id} className="p-4 rounded-2xl bg-slate-50 border border-slate-200 space-y-2">
                    <div className="flex items-center justify-between">
                      <span className="font-bold text-slate-900 font-mono">{t.name}</span>
                      <span className="text-[10px] font-bold px-2 py-0.5 rounded-full bg-blue-100 text-blue-800 font-mono">
                        Expected: {t.expectedCount}
                      </span>
                    </div>
                    <p className="text-[11px] text-slate-600">{t.desc}</p>
                  </div>
                ))}
              </div>
            </div>
          )}

          {/* TAB 4: SQL SCRIPTS */}
          {activeTab === 'sql' && (
            <div className="space-y-4 animate-fade-in">
              {/* Script Type Selector */}
              <div className="flex flex-wrap items-center justify-between gap-3 p-4 rounded-2xl bg-slate-50 border border-slate-200">
                <div className="flex items-center gap-2">
                  <span className="font-bold text-slate-700">Script View:</span>
                  <div className="flex rounded-xl bg-slate-200 p-0.5 text-xs font-bold">
                    <button
                      onClick={() => setSqlViewMode('combined')}
                      className={`px-3 py-1 rounded-lg transition cursor-pointer ${
                        sqlViewMode === 'combined' ? 'bg-white text-slate-900 shadow-2xs font-extrabold' : 'text-slate-600 hover:text-slate-900'
                      }`}
                    >
                      🌟 Complete (Schema + Seed Data)
                    </button>
                    <button
                      onClick={() => setSqlViewMode('schema')}
                      className={`px-3 py-1 rounded-lg transition cursor-pointer ${
                        sqlViewMode === 'schema' ? 'bg-white text-slate-900 shadow-2xs font-extrabold' : 'text-slate-600 hover:text-slate-900'
                      }`}
                    >
                      Schema Only (DDL)
                    </button>
                    <button
                      onClick={() => setSqlViewMode('seed')}
                      className={`px-3 py-1 rounded-lg transition cursor-pointer ${
                        sqlViewMode === 'seed' ? 'bg-white text-slate-900 shadow-2xs font-extrabold' : 'text-slate-600 hover:text-slate-900'
                      }`}
                    >
                      Seed Data Only (Inserts)
                    </button>
                  </div>
                </div>

                <div className="flex items-center gap-2">
                  <button
                    onClick={() => copySql(sqlViewMode)}
                    className="px-3.5 py-1.5 rounded-xl bg-indigo-600 hover:bg-indigo-700 text-white font-bold text-xs transition flex items-center gap-1.5 shadow-2xs cursor-pointer"
                  >
                    {copiedType === sqlViewMode ? <CheckCheck className="w-3.5 h-3.5" /> : <Copy className="w-3.5 h-3.5" />}
                    <span>{copiedType === sqlViewMode ? 'Copied to Clipboard!' : 'Copy SQL Script'}</span>
                  </button>

                  <button
                    onClick={downloadSql}
                    className="p-1.5 rounded-xl bg-white border border-slate-300 text-slate-700 hover:bg-slate-100 transition cursor-pointer shadow-2xs"
                    title="Download .sql file"
                  >
                    <Download className="w-4 h-4" />
                  </button>
                </div>
              </div>

              {/* Instructions */}
              <div className="p-3.5 rounded-xl bg-indigo-50 border border-indigo-200 text-indigo-950 text-xs flex items-center gap-2">
                <HelpCircle className="w-4 h-4 text-indigo-600 shrink-0" />
                <span>
                  <strong>How to use:</strong> Open your Supabase Dashboard → <strong>SQL Editor</strong> → Click <strong>New query</strong> → Paste this script → Click <strong>Run</strong>!
                </span>
              </div>

              {/* SQL Code Box */}
              <div className="relative rounded-2xl bg-slate-950 border border-slate-800 text-slate-100 p-4 font-mono text-[11px] max-h-[380px] overflow-y-auto leading-relaxed select-all">
                <pre>{sqlViewMode === 'combined' ? combinedSql : sqlViewMode === 'schema' ? schemaOnlySql : seedOnlySql}</pre>
              </div>
            </div>
          )}

        </div>

        {/* Modal Footer */}
        <div className="p-4 bg-slate-50 border-t border-slate-200 flex items-center justify-between text-xs">
          <span className="text-slate-500 font-medium">
            Project: <code className="font-mono font-bold text-slate-700">{keyAnalysis.ref || 'ycmfuudgxutmkhhhpciu'}</code>
          </span>
          <button
            onClick={onClose}
            className="px-5 py-2 rounded-xl bg-slate-900 hover:bg-slate-800 text-white font-bold text-xs transition cursor-pointer shadow-2xs"
          >
            Done
          </button>
        </div>

      </div>
    </div>
  );
}
