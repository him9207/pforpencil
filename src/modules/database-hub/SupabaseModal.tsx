import React, { useState, useEffect } from 'react';
import { 
  Database, 
  CheckCircle2, 
  AlertCircle, 
  Copy, 
  ExternalLink, 
  RefreshCw, 
  X, 
  Layers, 
  Terminal, 
  Sparkles,
  Key,
  ShieldCheck,
  Server,
  Zap,
  Save,
  Lock
} from 'lucide-react';
import { 
  getSupabaseCredentials, 
  saveSupabaseCredentials, 
  isSupabaseConfigured, 
  testSupabaseConnection,
  seedInitialDataToSupabase
} from '../../database';
import { UserAccount, Question, Activity } from '../../types';
import { sounds } from '../../utils/audio';

interface SupabaseModalProps {
  isOpen: boolean;
  onClose: () => void;
  allUsers: UserAccount[];
  questions: Question[];
  activities: Activity[];
}

export default function SupabaseModal({
  isOpen,
  onClose,
  allUsers,
  questions,
  activities
}: SupabaseModalProps) {
  const [activeTab, setActiveTab] = useState<'settings' | 'sql' | 'info'>('settings');
  const [copied, setCopied] = useState(false);
  
  // Credentials input fields
  const [inputUrl, setInputUrl] = useState('');
  const [inputKey, setInputKey] = useState('');
  const [isSaved, setIsSaved] = useState(false);

  // Testing & Seeding states
  const [isTesting, setIsTesting] = useState(false);
  const [testResult, setTestResult] = useState<{
    success?: boolean;
    message?: string;
  } | null>(null);

  const [isSeeding, setIsSeeding] = useState(false);
  const [seedResult, setSeedResult] = useState<{
    success?: boolean;
    message?: string;
  } | null>(null);

  // Load existing credentials when modal opens
  useEffect(() => {
    if (isOpen) {
      const creds = getSupabaseCredentials();
      setInputUrl(creds.url);
      setInputKey(creds.anonKey);
      setIsSaved(false);
      setTestResult(null);
      setSeedResult(null);
      
      // If keys already exist, test immediately
      if (creds.url && creds.anonKey) {
        handleTestConnection(creds.url, creds.anonKey);
      }
    }
  }, [isOpen]);

  if (!isOpen) return null;

  const handleSaveCredentials = () => {
    sounds.click();
    saveSupabaseCredentials(inputUrl, inputKey);
    setIsSaved(true);
    setTimeout(() => setIsSaved(false), 3000);
    handleTestConnection(inputUrl, inputKey);
  };

  const handleTestConnection = async (customUrl?: string, customKey?: string) => {
    setIsTesting(true);
    setTestResult(null);
    sounds.click();

    const targetUrl = customUrl ?? inputUrl;
    const targetKey = customKey ?? inputKey;

    const result = await testSupabaseConnection(targetUrl, targetKey);
    setTestResult(result);
    setIsTesting(false);
    if (result.success) {
      sounds.playCorrect();
    } else {
      sounds.playWrong();
    }
  };

  const handleSeedData = async () => {
    setIsSeeding(true);
    setSeedResult(null);
    sounds.click();

    try {
      // Save credentials first
      saveSupabaseCredentials(inputUrl, inputKey);
      const stats = await seedInitialDataToSupabase(allUsers, questions, activities);
      setSeedResult({
        success: true,
        message: stats.message || `Successfully seeded ${stats.totalRowsInserted} records into Supabase!`
      });
      sounds.playCorrect();
    } catch (err: any) {
      setSeedResult({
        success: false,
        message: `Seeding error: ${err?.message || 'Check if tables are created in Supabase SQL editor.'}`
      });
      sounds.playWrong();
    } finally {
      setIsSeeding(false);
    }
  };

  const sqlSchemaCode = `-- FUNLEARN EDU: SUPABASE POSTGRESQL SCHEMA (WITH COUNTRY, STATE, CURRICULUM & RLS)
CREATE EXTENSION IF NOT EXISTS "pgcrypto";

-- 1. Organizations / Schools Table
CREATE TABLE IF NOT EXISTS schools (
  id VARCHAR(32) PRIMARY KEY, -- e.g. SCH000001
  name TEXT NOT NULL,
  admin_email TEXT NOT NULL,
  country VARCHAR(100) DEFAULT 'United States',
  state VARCHAR(100) DEFAULT 'California',
  curriculum VARCHAR(150) DEFAULT 'US Common Core (CCSS)',
  total_seats INT DEFAULT 500,
  allocated_seats INT DEFAULT 0,
  plan TEXT DEFAULT 'Campus 500',
  expires_at TIMESTAMP WITH TIME ZONE,
  status VARCHAR(20) DEFAULT 'active',
  created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW()
);

-- Safely add country/state/curriculum if table already existed
ALTER TABLE IF EXISTS schools ADD COLUMN IF NOT EXISTS country VARCHAR(100) DEFAULT 'United States';
ALTER TABLE IF EXISTS schools ADD COLUMN IF NOT EXISTS state VARCHAR(100) DEFAULT 'California';
ALTER TABLE IF EXISTS schools ADD COLUMN IF NOT EXISTS curriculum VARCHAR(150) DEFAULT 'US Common Core (CCSS)';
ALTER TABLE IF EXISTS schools ADD COLUMN IF NOT EXISTS status VARCHAR(20) DEFAULT 'active';

-- 2. Profiles / Users Table
CREATE TABLE IF NOT EXISTS profiles (
  id VARCHAR(32) PRIMARY KEY, -- ADM000001, SCH000001, TEA00001, PAR00001, STU00001
  role VARCHAR(32) NOT NULL, -- 'admin', 'content_manager', 'school', 'teacher', 'parent', 'student'
  name TEXT NOT NULL,
  email TEXT,
  username TEXT UNIQUE, -- e.g. HAM0001, EMMWAT1
  pin_hash TEXT, -- 4-digit PIN for students
  avatar TEXT DEFAULT '🦊',
  grade TEXT, -- 'Preschool', 'Foundation', 'Grade 1'...'Grade 6'
  country VARCHAR(100) DEFAULT 'United States',
  state VARCHAR(100) DEFAULT 'California',
  curriculum VARCHAR(150) DEFAULT 'US Common Core (CCSS)',
  school_id VARCHAR(32) REFERENCES schools(id) ON DELETE SET NULL,
  school_name TEXT,
  parent_id VARCHAR(32),
  parent_name TEXT,
  status VARCHAR(20) DEFAULT 'active',
  created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW()
);

-- Safely add columns if profiles already existed
ALTER TABLE IF EXISTS profiles ADD COLUMN IF NOT EXISTS country VARCHAR(100) DEFAULT 'United States';
ALTER TABLE IF EXISTS profiles ADD COLUMN IF NOT EXISTS state VARCHAR(100) DEFAULT 'California';
ALTER TABLE IF EXISTS profiles ADD COLUMN IF NOT EXISTS curriculum VARCHAR(150) DEFAULT 'US Common Core (CCSS)';
ALTER TABLE IF EXISTS profiles ADD COLUMN IF NOT EXISTS school_id VARCHAR(32);
ALTER TABLE IF EXISTS profiles ADD COLUMN IF NOT EXISTS school_name TEXT;
ALTER TABLE IF EXISTS profiles ADD COLUMN IF NOT EXISTS parent_id VARCHAR(32);
ALTER TABLE IF EXISTS profiles ADD COLUMN IF NOT EXISTS parent_name TEXT;
ALTER TABLE IF EXISTS profiles ADD COLUMN IF NOT EXISTS status VARCHAR(20) DEFAULT 'active';

-- Also create legacy users view or table for backwards compatibility
CREATE TABLE IF NOT EXISTS users (
  id VARCHAR(32) PRIMARY KEY,
  role VARCHAR(32) NOT NULL,
  name TEXT NOT NULL,
  email TEXT,
  username TEXT UNIQUE,
  avatar TEXT DEFAULT '👤',
  pin VARCHAR(10),
  grade VARCHAR(50),
  school_name VARCHAR(255),
  organization_id TEXT,
  country VARCHAR(100) DEFAULT 'United States',
  state VARCHAR(100) DEFAULT 'California',
  curriculum VARCHAR(150) DEFAULT 'US Common Core (CCSS)',
  created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW()
);

-- 3. Classroom Structures
CREATE TABLE IF NOT EXISTS classes (
  id VARCHAR(32) PRIMARY KEY, -- e.g. CLS001
  name TEXT NOT NULL,
  grade TEXT NOT NULL,
  teacher_id VARCHAR(32) REFERENCES profiles(id) ON DELETE SET NULL,
  school_id VARCHAR(32) REFERENCES schools(id) ON DELETE CASCADE,
  student_ids JSONB DEFAULT '[]'::jsonb,
  average_score NUMERIC(5,2) DEFAULT 0,
  created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW()
);

-- 4. Curriculum Frameworks Directory
CREATE TABLE IF NOT EXISTS curriculum_frameworks (
  id VARCHAR(32) PRIMARY KEY,
  country VARCHAR(100) NOT NULL,
  state VARCHAR(100) NOT NULL,
  curriculum_name VARCHAR(150) NOT NULL,
  description TEXT,
  active BOOLEAN DEFAULT TRUE,
  created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW()
);

-- 5. Curriculum Questions
CREATE TABLE IF NOT EXISTS questions (
  id VARCHAR(32) PRIMARY KEY,
  grade TEXT NOT NULL,
  subject TEXT NOT NULL,
  category TEXT NOT NULL,
  skill TEXT NOT NULL,
  question_type VARCHAR(50) DEFAULT 'multiple_choice',
  prompt TEXT NOT NULL,
  options JSONB NOT NULL,
  correct_index INT NOT NULL,
  explanation TEXT,
  hint TEXT,
  points INT DEFAULT 10,
  difficulty VARCHAR(20) DEFAULT 'Medium',
  country VARCHAR(100) DEFAULT 'Global',
  state VARCHAR(100) DEFAULT 'All States',
  curriculum VARCHAR(150),
  school_id VARCHAR(32),
  created_by VARCHAR(32),
  status VARCHAR(20) DEFAULT 'approved',
  created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW()
);

ALTER TABLE IF EXISTS questions ADD COLUMN IF NOT EXISTS question_type VARCHAR(50) DEFAULT 'multiple_choice';
ALTER TABLE IF EXISTS questions ADD COLUMN IF NOT EXISTS hint TEXT;
ALTER TABLE IF EXISTS questions ADD COLUMN IF NOT EXISTS country VARCHAR(100) DEFAULT 'Global';
ALTER TABLE IF EXISTS questions ADD COLUMN IF NOT EXISTS state VARCHAR(100) DEFAULT 'All States';
ALTER TABLE IF EXISTS questions ADD COLUMN IF NOT EXISTS curriculum VARCHAR(150);
ALTER TABLE IF EXISTS questions ADD COLUMN IF NOT EXISTS school_id VARCHAR(32);
ALTER TABLE IF EXISTS questions ADD COLUMN IF NOT EXISTS created_by VARCHAR(32);

-- 6. Interactive Activities
CREATE TABLE IF NOT EXISTS activities (
  id VARCHAR(64) PRIMARY KEY,
  title TEXT NOT NULL,
  type VARCHAR(32) NOT NULL,
  subject TEXT NOT NULL,
  grade TEXT NOT NULL,
  description TEXT,
  question_ids JSONB DEFAULT '[]'::jsonb,
  reward_xp INT DEFAULT 50,
  reward_coins INT DEFAULT 20,
  duration_minutes INT DEFAULT 10,
  country VARCHAR(100) DEFAULT 'Global',
  state VARCHAR(100) DEFAULT 'All States',
  curriculum VARCHAR(150),
  created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW()
);

ALTER TABLE IF EXISTS activities ADD COLUMN IF NOT EXISTS country VARCHAR(100) DEFAULT 'Global';
ALTER TABLE IF EXISTS activities ADD COLUMN IF NOT EXISTS state VARCHAR(100) DEFAULT 'All States';
ALTER TABLE IF EXISTS activities ADD COLUMN IF NOT EXISTS curriculum VARCHAR(150);

-- 7. Student Progress
CREATE TABLE IF NOT EXISTS student_progress (
  student_id VARCHAR(32) PRIMARY KEY REFERENCES profiles(id) ON DELETE CASCADE,
  xp INT DEFAULT 0,
  coins INT DEFAULT 0,
  level INT DEFAULT 1,
  current_streak_days INT DEFAULT 0,
  total_quizzes_taken INT DEFAULT 0,
  average_score NUMERIC(5,2) DEFAULT 0,
  subject_mastery JSONB DEFAULT '{}'::jsonb,
  unlocked_badges JSONB DEFAULT '[]'::jsonb,
  completed_activity_ids JSONB DEFAULT '[]'::jsonb,
  updated_at TIMESTAMP WITH TIME ZONE DEFAULT NOW()
);

-- 8. Activity Attempts
CREATE TABLE IF NOT EXISTS activity_attempts (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  student_id VARCHAR(32) NOT NULL,
  activity_id VARCHAR(64),
  score INT NOT NULL,
  total_questions INT NOT NULL,
  xp_earned INT DEFAULT 0,
  coins_earned INT DEFAULT 0,
  speed_bonus_earned BOOLEAN DEFAULT FALSE,
  created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
  submitted_at TIMESTAMP WITH TIME ZONE DEFAULT NOW()
);

-- 9. Row Level Security & Access Policies
ALTER TABLE IF EXISTS schools ENABLE ROW LEVEL SECURITY;
ALTER TABLE IF EXISTS profiles ENABLE ROW LEVEL SECURITY;
ALTER TABLE IF EXISTS users ENABLE ROW LEVEL SECURITY;
ALTER TABLE IF EXISTS classes ENABLE ROW LEVEL SECURITY;
ALTER TABLE IF EXISTS questions ENABLE ROW LEVEL SECURITY;
ALTER TABLE IF EXISTS activities ENABLE ROW LEVEL SECURITY;
ALTER TABLE IF EXISTS student_progress ENABLE ROW LEVEL SECURITY;
ALTER TABLE IF EXISTS activity_attempts ENABLE ROW LEVEL SECURITY;
ALTER TABLE IF EXISTS curriculum_frameworks ENABLE ROW LEVEL SECURITY;

DROP POLICY IF EXISTS "anon_all_schools" ON schools;
CREATE POLICY "anon_all_schools" ON schools FOR ALL USING (true) WITH CHECK (true);

DROP POLICY IF EXISTS "anon_all_profiles" ON profiles;
CREATE POLICY "anon_all_profiles" ON profiles FOR ALL USING (true) WITH CHECK (true);

DROP POLICY IF EXISTS "anon_all_users" ON users;
CREATE POLICY "anon_all_users" ON users FOR ALL USING (true) WITH CHECK (true);

DROP POLICY IF EXISTS "anon_all_classes" ON classes;
CREATE POLICY "anon_all_classes" ON classes FOR ALL USING (true) WITH CHECK (true);

DROP POLICY IF EXISTS "anon_all_questions" ON questions;
CREATE POLICY "anon_all_questions" ON questions FOR ALL USING (true) WITH CHECK (true);

DROP POLICY IF EXISTS "anon_all_activities" ON activities;
CREATE POLICY "anon_all_activities" ON activities FOR ALL USING (true) WITH CHECK (true);

DROP POLICY IF EXISTS "anon_all_progress" ON student_progress;
CREATE POLICY "anon_all_progress" ON student_progress FOR ALL USING (true) WITH CHECK (true);

DROP POLICY IF EXISTS "anon_all_attempts" ON activity_attempts;
CREATE POLICY "anon_all_attempts" ON activity_attempts FOR ALL USING (true) WITH CHECK (true);

DROP POLICY IF EXISTS "anon_all_curriculum" ON curriculum_frameworks;
CREATE POLICY "anon_all_curriculum" ON curriculum_frameworks FOR ALL USING (true) WITH CHECK (true);`;

  const copyToClipboard = (text: string) => {
    navigator.clipboard.writeText(text);
    setCopied(true);
    sounds.click();
    setTimeout(() => setCopied(false), 2000);
  };

  const isConfigured = Boolean(inputUrl && inputKey && inputKey.length > 20);

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-stone-950/70 backdrop-blur-sm animate-fade-in font-sans">
      <div className="bg-white rounded-3xl w-full max-w-3xl overflow-hidden shadow-2xl border border-stone-200 flex flex-col max-h-[92vh]">
        
        {/* Modal Header */}
        <div className="p-5 sm:p-6 bg-slate-900 text-white flex items-center justify-between">
          <div className="flex items-center gap-3">
            <div className="w-10 h-10 rounded-2xl bg-gradient-to-br from-indigo-600 to-slate-900 text-white flex items-center justify-center shadow-md">
              <Database className="w-5 h-5 text-indigo-300" />
            </div>
            <div>
              <div className="flex items-center gap-2">
                <h2 className="text-base sm:text-lg font-bold">Database Architecture & Connection</h2>
                <span className={`text-[10px] font-bold px-2 py-0.5 rounded-full ${
                  testResult?.success 
                    ? 'bg-emerald-500/20 text-emerald-300 border border-emerald-500/30' 
                    : isConfigured 
                    ? 'bg-blue-500/20 text-indigo-200 border border-indigo-500/30'
                    : 'bg-rose-500/20 text-rose-300 border border-rose-500/30'
                }`}>
                  {testResult?.success ? 'Connected & Verified' : isConfigured ? 'Keys Entered' : 'Not Connected'}
                </span>
              </div>
              <p className="text-xs text-slate-400">
                Configure credentials, test connectivity, and sync quiz data live with Supabase
              </p>
            </div>
          </div>
          <button
            onClick={onClose}
            className="p-2 rounded-xl text-slate-400 hover:text-white hover:bg-slate-800 transition cursor-pointer"
          >
            <X className="w-5 h-5" />
          </button>
        </div>

        {/* Tab Navigation */}
        <div className="flex items-center gap-2 px-6 pt-3 border-b border-slate-200 bg-slate-50 text-xs font-bold">
          <button
            onClick={() => setActiveTab('settings')}
            className={`pb-3 border-b-2 flex items-center gap-1.5 transition cursor-pointer ${
              activeTab === 'settings'
                ? 'border-indigo-600 text-blue-700 font-extrabold'
                : 'border-transparent text-slate-500 hover:text-slate-800'
            }`}
          >
            <Zap className="w-4 h-4" />
            <span>Connection Settings & Test</span>
          </button>
          <button
            onClick={() => setActiveTab('sql')}
            className={`pb-3 border-b-2 flex items-center gap-1.5 transition cursor-pointer ${
              activeTab === 'sql'
                ? 'border-indigo-600 text-blue-700 font-extrabold'
                : 'border-transparent text-slate-500 hover:text-slate-800'
            }`}
          >
            <Terminal className="w-4 h-4" />
            <span>SQL Schema (Run in Supabase)</span>
          </button>
          <button
            onClick={() => setActiveTab('info')}
            className={`pb-3 border-b-2 flex items-center gap-1.5 transition cursor-pointer ${
              activeTab === 'info'
                ? 'border-indigo-600 text-blue-700 font-extrabold'
                : 'border-transparent text-slate-500 hover:text-slate-800'
            }`}
          >
            <Key className="w-4 h-4" />
            <span>Setup Guide</span>
          </button>
        </div>

        {/* Modal Body */}
        <div className="p-6 overflow-y-auto space-y-5 flex-1 text-xs">
          {activeTab === 'settings' && (
            <div className="space-y-4">
              
              {/* Credentials Input Card */}
              <div className="p-4 rounded-2xl bg-slate-50 border border-slate-200 space-y-3">
                <div className="flex items-center justify-between pb-1 border-b border-slate-200/80">
                  <span className="font-bold text-slate-800 flex items-center gap-1.5 text-xs">
                    <Key className="w-4 h-4 text-blue-600" />
                    <span>Supabase Project Credentials</span>
                  </span>
                  <span className="text-[11px] text-slate-500">Stored securely in your browser</span>
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
                      className="w-full px-3 py-2 text-xs font-mono rounded-xl border border-slate-300 bg-white focus:outline-none focus:ring-2 focus:ring-blue-500"
                    />
                  </div>

                  <div>
                    <label className="block text-[11px] font-bold text-slate-700 uppercase tracking-wider mb-1">
                      Supabase anon / public API Key
                    </label>
                    <div className="relative">
                      <input
                        type="password"
                        value={inputKey}
                        onChange={(e) => setInputKey(e.target.value)}
                        placeholder="Paste your anon public key (starts with eyJ...)"
                        className="w-full px-3 py-2 text-xs font-mono rounded-xl border border-slate-300 bg-white focus:outline-none focus:ring-2 focus:ring-blue-500"
                      />
                    </div>
                    <p className="text-[10px] text-slate-500 mt-1">
                      Found in: Supabase Dashboard &gt; Project Settings (⚙️) &gt; API &gt; <strong>Project API keys (anon public)</strong>
                    </p>
                  </div>
                </div>

                {/* Save & Test Action Bar */}
                <div className="flex flex-wrap items-center gap-2 pt-2 border-t border-slate-200">
                  <button
                    onClick={handleSaveCredentials}
                    className="px-4 py-2 rounded-xl bg-blue-600 hover:bg-blue-700 text-white font-bold transition flex items-center gap-1.5 shadow-xs cursor-pointer"
                  >
                    <Save className="w-3.5 h-3.5" />
                    <span>Save Credentials</span>
                  </button>

                  <button
                    onClick={() => handleTestConnection()}
                    disabled={isTesting || !inputUrl || !inputKey}
                    className="px-4 py-2 rounded-xl bg-slate-900 hover:bg-slate-800 text-white font-bold transition flex items-center gap-1.5 shadow-xs cursor-pointer disabled:opacity-40"
                  >
                    <RefreshCw className={`w-3.5 h-3.5 ${isTesting ? 'animate-spin' : ''}`} />
                    <span>{isTesting ? 'Testing Connection...' : 'Test Connection'}</span>
                  </button>

                  <button
                    onClick={handleSeedData}
                    disabled={isSeeding || !testResult?.success}
                    title={!testResult?.success ? 'Test connection successfully before seeding' : ''}
                    className="px-4 py-2 rounded-xl bg-slate-800 hover:bg-slate-700 text-white font-bold transition flex items-center gap-1.5 shadow-xs cursor-pointer disabled:opacity-40"
                  >
                    <Sparkles className="w-3.5 h-3.5 text-indigo-300" />
                    <span>{isSeeding ? 'Seeding Tables...' : 'Seed Demo Data to Supabase'}</span>
                  </button>
                </div>

                {isSaved && (
                  <div className="p-2 rounded-lg bg-blue-50 border border-blue-200 text-blue-800 text-[11px] font-semibold flex items-center gap-1.5">
                    <CheckCircle2 className="w-3.5 h-3.5" />
                    <span>Credentials saved successfully!</span>
                  </div>
                )}

                {/* Test Result Message Banner */}
                {testResult && (
                  <div className={`p-3 rounded-xl border flex items-center gap-2.5 ${
                    testResult.success 
                      ? 'bg-emerald-50 border-emerald-200 text-emerald-800' 
                      : 'bg-rose-50 border-rose-200 text-rose-800'
                  }`}>
                    {testResult.success ? (
                      <CheckCircle2 className="w-4 h-4 text-emerald-600 shrink-0" />
                    ) : (
                      <AlertCircle className="w-4 h-4 text-rose-600 shrink-0" />
                    )}
                    <span className="font-semibold">{testResult.message}</span>
                  </div>
                )}

                {/* Seed Result Message Banner */}
                {seedResult && (
                  <div className={`p-3 rounded-xl border flex items-center gap-2.5 ${
                    seedResult.success 
                      ? 'bg-emerald-50 border-emerald-200 text-emerald-800' 
                      : 'bg-rose-50 border-rose-200 text-rose-800'
                  }`}>
                    {seedResult.success ? (
                      <CheckCircle2 className="w-4 h-4 text-emerald-600 shrink-0" />
                    ) : (
                      <AlertCircle className="w-4 h-4 text-rose-600 shrink-0" />
                    )}
                    <span className="font-semibold">{seedResult.message}</span>
                  </div>
                )}
              </div>

              {/* Real-time Storage Explanation Cards */}
              <div className="grid grid-cols-1 md:grid-cols-3 gap-3">
                <div className="p-3.5 rounded-xl bg-white border border-stone-200 space-y-1 shadow-2xs">
                  <div className="font-bold text-stone-900 flex items-center gap-1.5">
                    <span>📝</span>
                    <span>1. Quiz Submissions</span>
                  </div>
                  <p className="text-stone-500 text-[11px] leading-relaxed">
                    Quiz completions record directly into <code className="font-mono text-blue-700 font-bold">activity_attempts</code> with score and time duration.
                  </p>
                </div>

                <div className="p-3.5 rounded-xl bg-white border border-stone-200 space-y-1 shadow-2xs">
                  <div className="font-bold text-stone-900 flex items-center gap-1.5">
                    <span>⚡</span>
                    <span>2. XP & Badges</span>
                  </div>
                  <p className="text-stone-500 text-[11px] leading-relaxed">
                    Accumulated XP, coins, streaks, and unlocked badges update the <code className="font-mono text-blue-700 font-bold">student_progress</code> table.
                  </p>
                </div>

                <div className="p-3.5 rounded-xl bg-white border border-stone-200 space-y-1 shadow-2xs">
                  <div className="font-bold text-stone-900 flex items-center gap-1.5">
                    <span>👥</span>
                    <span>3. Multi-Role Users</span>
                  </div>
                  <p className="text-stone-500 text-[11px] leading-relaxed">
                    Accounts created for students, parents, teachers, and schools persist in the <code className="font-mono text-blue-700 font-bold">users</code> table.
                  </p>
                </div>
              </div>
            </div>
          )}

          {activeTab === 'sql' && (
            <div className="space-y-3">
              <div className="flex items-center justify-between">
                <div>
                  <h3 className="font-bold text-stone-900">Database Schema SQL Script</h3>
                  <p className="text-stone-500 text-[11px]">
                    Run this in your Supabase Dashboard &gt; SQL Editor to create all required tables.
                  </p>
                </div>
                <button
                  onClick={() => copyToClipboard(sqlSchemaCode)}
                  className="px-3 py-1.5 rounded-lg bg-stone-900 hover:bg-stone-800 text-white font-bold text-xs flex items-center gap-1.5 transition cursor-pointer"
                >
                  <Copy className="w-3.5 h-3.5" />
                  <span>{copied ? 'Copied!' : 'Copy SQL'}</span>
                </button>
              </div>

              <pre className="p-4 rounded-xl bg-stone-900 text-stone-200 font-mono text-[11px] leading-relaxed overflow-x-auto max-h-72 border border-stone-800">
                {sqlSchemaCode}
              </pre>
            </div>
          )}

          {activeTab === 'info' && (
            <div className="space-y-4">
              <div className="p-4 rounded-xl bg-stone-50 border border-stone-200 space-y-3">
                <div className="font-bold text-stone-900">Quick 3-Step Setup Instructions</div>
                <ol className="list-decimal list-inside space-y-2 text-stone-600 text-[11px] leading-relaxed">
                  <li>
                    <strong>Run the SQL Schema</strong> in your Supabase Dashboard: Click <strong>SQL Editor</strong> &gt; <strong>New Query</strong>, paste the SQL from Tab 2, and click <strong>Run</strong>.
                  </li>
                  <li>
                    <strong>Get your API Key:</strong> In Supabase, go to <strong>Project Settings (⚙️)</strong> &gt; <strong>API</strong> and copy the <strong>anon public key</strong>.
                  </li>
                  <li>
                    <strong>Paste & Save:</strong> Paste your key into the <strong>Connection Settings</strong> tab in this modal and click <strong>Save Credentials</strong> then <strong>Test Connection</strong>.
                  </li>
                </ol>
              </div>
            </div>
          )}
        </div>

        {/* Modal Footer */}
        <div className="p-4 bg-stone-50 border-t border-stone-200 flex items-center justify-between text-xs">
          <a
            href="https://supabase.com/dashboard/project/ycmfuudgxutmkhhhpciu"
            target="_blank"
            rel="noreferrer"
            className="text-blue-600 hover:text-blue-800 font-bold flex items-center gap-1"
          >
            <span>Open Supabase Dashboard</span>
            <ExternalLink className="w-3.5 h-3.5" />
          </a>
          <button
            onClick={onClose}
            className="px-4 py-2 rounded-xl bg-stone-200 hover:bg-stone-300 text-stone-800 font-bold transition cursor-pointer"
          >
            Close
          </button>
        </div>
      </div>
    </div>
  );
}
