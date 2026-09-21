import React, { useEffect, useMemo, useState } from 'react';
import confetti from 'canvas-confetti';
import { 
  UserAccount, 
  CurriculumGrade, 
  CurriculumSubject, 
  Question, 
  Activity,
  UserRole,
  StudentProgress
} from '../types';
import { sounds } from '../utils/audio';
import { 
  COUNTRY_FLAG_MAP, 
  COUNTRY_STATE_MAP, 
  COUNTRY_CURRICULUM_MAP 
} from '../data/curriculumData';

type Grade = {
  label: string;
  short: string;
  accent: string;
  icon: string;
};

const gradesList: Grade[] = [
  { label: 'Preschool', short: 'P', accent: '#FCE8F3', icon: 'spark' },
  { label: 'Foundation', short: 'F', accent: '#EAF8F5', icon: 'sprout' },
  { label: 'Grade 1', short: '1', accent: '#EEF6FF', icon: 'number-1' },
  { label: 'Grade 2', short: '2', accent: '#EAFBF2', icon: 'number-2' },
  { label: 'Grade 3', short: '3', accent: '#FFF2EA', icon: 'number-3' },
  { label: 'Grade 4', short: '4', accent: '#F1EDFF', icon: 'number-4' },
  { label: 'Grade 5', short: '5', accent: '#FFF9E8', icon: 'number-5' },
  { label: 'Grade 6', short: '6', accent: '#FFEAF5', icon: 'number-6' },
];


type IconKind =
  | 'game'
  | 'bolt'
  | 'chart'
  | 'shield'
  | 'spark'
  | 'sprout'
  | 'target'
  | 'smile'
  | 'sun';

function UiIcon({ kind, size = 24 }: { kind: IconKind; size?: number }) {
  const common = {
    width: size,
    height: size,
    viewBox: '0 0 24 24',
    fill: 'none',
    xmlns: 'http://www.w3.org/2000/svg',
    'aria-hidden': true,
  } as const;

  switch (kind) {
    case 'game':
      return (
        <svg {...common}>
          <path d="M7.5 8h9a4.5 4.5 0 0 1 4.3 5.85l-1.1 3.4a2.2 2.2 0 0 1-4.05.3l-.75-1.35H9.1l-.75 1.35a2.2 2.2 0 0 1-4.05-.3l-1.1-3.4A4.5 4.5 0 0 1 7.5 8Z" stroke="currentColor" strokeWidth="1.8" strokeLinejoin="round"/>
          <path d="M7 11v4M5 13h4M15.5 12.25h.01M18 14h.01" stroke="currentColor" strokeWidth="1.8" strokeLinecap="round"/>
        </svg>
      );
    case 'bolt':
      return (
        <svg {...common}>
          <path d="m13.2 2.8-7 10.1h5.2l-.6 8.3 7-10.1h-5.2l.6-8.3Z" fill="currentColor"/>
        </svg>
      );
    case 'chart':
      return (
        <svg {...common}>
          <path d="M4 19.5V14h4v5.5H4Zm6 0V9h4v10.5h-4Zm6 0V4.5h4v15h-4Z" fill="currentColor" opacity=".9"/>
        </svg>
      );
    case 'shield':
      return (
        <svg {...common}>
          <path d="M12 3.2 19 6v5.4c0 4.6-2.9 7.8-7 9.4-4.1-1.6-7-4.8-7-9.4V6l7-2.8Z" fill="currentColor" opacity=".92"/>
          <path d="m8.8 12.2 2.1 2.1 4.5-4.7" stroke="#fff" strokeWidth="1.7" strokeLinecap="round" strokeLinejoin="round"/>
        </svg>
      );
    case 'spark':
      return (
        <svg {...common}>
          <path d="m12 2 1.55 6.45L20 10l-6.45 1.55L12 18l-1.55-6.45L4 10l6.45-1.55L12 2Z" fill="currentColor"/>
          <path d="m19 15 .7 2.3L22 18l-2.3.7L19 21l-.7-2.3L16 18l2.3-.7L19 15Z" fill="currentColor" opacity=".65"/>
        </svg>
      );
    case 'sprout':
      return (
        <svg {...common}>
          <path d="M12 21V11" stroke="currentColor" strokeWidth="1.8" strokeLinecap="round"/>
          <path d="M12 11C7.5 11 5 8.2 5 4.5 8.8 4.5 11.4 6.2 12 9c.6-2.8 3.2-4.5 7-4.5 0 3.7-2.5 6.5-7 6.5Z" fill="currentColor" opacity=".9"/>
        </svg>
      );
    case 'target':
      return (
        <svg {...common}>
          <circle cx="12" cy="12" r="8.5" stroke="currentColor" strokeWidth="1.8"/>
          <circle cx="12" cy="12" r="4.5" stroke="currentColor" strokeWidth="1.8"/>
          <circle cx="12" cy="12" r="1.8" fill="currentColor"/>
        </svg>
      );
    case 'smile':
      return (
        <svg {...common}>
          <circle cx="12" cy="12" r="8.8" stroke="currentColor" strokeWidth="1.8"/>
          <circle cx="9" cy="10" r="1" fill="currentColor"/>
          <circle cx="15" cy="10" r="1" fill="currentColor"/>
          <path d="M8.2 14.1c1 1.35 2.25 2 3.8 2s2.8-.65 3.8-2" stroke="currentColor" strokeWidth="1.6" strokeLinecap="round"/>
        </svg>
      );
    case 'sun':
      return (
        <svg {...common}>
          <circle cx="12" cy="12" r="3.6" fill="currentColor"/>
          <path d="M12 2.5v2M12 19.5v2M21.5 12h-2M4.5 12h-2M18.72 5.28l-1.42 1.42M6.7 17.3l-1.42 1.42M18.72 18.72l-1.42-1.42M6.7 6.7 5.28 5.28" stroke="currentColor" strokeWidth="1.7" strokeLinecap="round"/>
        </svg>
      );
  }
}

function GradeIcon({ icon }: { icon: string }) {
  if (icon === 'spark') return <UiIcon kind="spark" size={31} />;
  if (icon === 'sprout') return <UiIcon kind="sprout" size={31} />;
  const number = icon.replace('number-', '');
  return <span className="grade-number">{number}</span>;
}

const demoQuestions = [
  { question: '7 + 5 = ?', options: ['10', '11', '12', '13'], answer: '12' },
  { question: '9 + 4 = ?', options: ['12', '13', '14', '15'], answer: '13' },
  { question: '15 − 6 = ?', options: ['7', '8', '9', '10'], answer: '9' },
];

interface HomePageProps {
  currentUser: UserAccount;
  allUsers: UserAccount[];
  grades?: CurriculumGrade[];
  subjects?: CurriculumSubject[];
  questions?: Question[];
  activities?: Activity[];
  onSelectRoleUser: (user: UserAccount) => void;
  onNavigateView: (view: string) => void;
  onOpenPricing: () => void;
  onOpenRegionModal: () => void;
  onOpenAuthModal: (options?: { screen?: 'signin' | 'register'; role?: UserRole }) => void;
  onOpenSupabaseModal: () => void;
  onDirectLogin: (user: UserAccount) => void;
  onRegisterUser?: (newUser: UserAccount, newProgress?: StudentProgress) => void;
  onSaveRegion?: (country: string, state: string, curriculum: string, grade?: string) => void;
}

// Homepage visual update: preserves existing callbacks and tester functionality; only layout/assets are refined.
export default function PForPencilHomePage({
  currentUser,
  allUsers,
  onSelectRoleUser,
  onNavigateView,
  onOpenPricing,
  onOpenRegionModal,
  onOpenAuthModal,
  onOpenSupabaseModal,
  onSaveRegion,
}: HomePageProps) {
  const [country, setCountry] = useState(currentUser?.country || 'Australia');
  const [state, setState] = useState(currentUser?.state || 'NSW');
  const [questionIndex, setQuestionIndex] = useState(0);
  const [selectedAnswer, setSelectedAnswer] = useState<string | null>(null);
  const [xp, setXp] = useState(0);
  const [seconds, setSeconds] = useState(24);
  const [openRegion, setOpenRegion] = useState<'country' | 'state' | null>(null);

  // Synchronize country and state whenever currentUser changes (e.g. via Register modal or Region selector)
  useEffect(() => {
    if (currentUser?.country && COUNTRY_STATE_MAP[currentUser.country]) {
      setCountry(currentUser.country);
      if (currentUser.state) {
        setState(currentUser.state);
      }
    }
  }, [currentUser?.country, currentUser?.state]);

  // Close dropdown on clicking outside
  useEffect(() => {
    if (!openRegion) return;
    const handleClickOutside = (e: MouseEvent) => {
      const target = e.target as HTMLElement;
      if (!target.closest('.region-menu')) {
        setOpenRegion(null);
      }
    };
    window.addEventListener('mousedown', handleClickOutside);
    return () => window.removeEventListener('mousedown', handleClickOutside);
  }, [openRegion]);

  const question = demoQuestions[questionIndex];

  useEffect(() => {
    const timer = window.setInterval(() => {
      setSeconds((value) => (value >= 99 ? 0 : value + 1));
    }, 1000);

    return () => window.clearInterval(timer);
  }, []);

  const progress = useMemo(
    () => ((questionIndex + 1) / demoQuestions.length) * 100,
    [questionIndex]
  );

  const handleCountryChange = (value: string) => {
    setCountry(value);
    const nextStates = COUNTRY_STATE_MAP[value] || ['All Regions'];
    const nextState = nextStates[0] || '';
    setState(nextState);
    setOpenRegion(null);
    const defaultCurriculum = COUNTRY_CURRICULUM_MAP[value]?.[0] || 'Universal Foundational';
    onSaveRegion?.(value, nextState, defaultCurriculum);
  };

  const handleStateChange = (value: string) => {
    setState(value);
    setOpenRegion(null);
    const defaultCurriculum = COUNTRY_CURRICULUM_MAP[country]?.[0] || 'Universal Foundational';
    onSaveRegion?.(country, value, defaultCurriculum);
  };

  const chooseAnswer = (answer: string) => {
    if (selectedAnswer) return;
    setSelectedAnswer(answer);
    if (answer === question.answer) {
      sounds.playCorrect();
      setXp((value) => value + 10);
    } else {
      sounds.playWrong();
    }
  };

  const nextQuestion = () => {
    sounds.playCorrect();
    setQuestionIndex((value) => (value + 1) % demoQuestions.length);
    setSelectedAnswer(null);
  };

  const resetDemo = () => {
    setQuestionIndex(0);
    setSelectedAnswer(null);
    setXp(0);
    setSeconds(24);
  };

  const scrollTo = (id: string) => {
    document.getElementById(id)?.scrollIntoView({ behavior: 'smooth' });
  };

  const handleGradeClick = (grade: Grade) => {
    sounds.playCorrect();
    confetti({
      particleCount: 35,
      spread: 60,
      origin: { y: 0.6 }
    });

    if (currentUser.role === 'student') {
      onNavigateView('dashboard');
    } else {
      const student = allUsers.find((u) => u.role === 'student');
      if (student) {
        onSelectRoleUser(student);
      } else {
        onOpenAuthModal({ screen: 'signin', role: 'student' });
      }
    }
  };

  return (
    <div className="pfp-page">
      <style>{`
        @import url('https://fonts.googleapis.com/css2?family=Inter:wght@400;500;600;700;800&family=Poppins:wght@500;600;700;800&display=swap');

        :root {
          --navy: #10246f;
          --navy-2: #172d7d;
          --text: #1b2d72;
          --muted: #6073a9;
          --pink: #f20b86;
          --pink-dark: #df0879;
          --teal: #13b7ad;
          --blue: #168bea;
          --green: #16c47f;
          --yellow: #ffbf32;
          --border: #d7def0;
          --surface: #ffffff;
          --soft-blue: #f5f8ff;
          --radius-lg: 24px;
          --radius-md: 16px;
          --shadow: 0 18px 50px rgba(33, 60, 120, .12);
        }

        * { box-sizing: border-box; }
        html { scroll-behavior: smooth; }
        body {
          margin: 0;
          background: #fff;
          color: var(--text);
          font-family: Inter, Arial, sans-serif;
        }
        button, select { font: inherit; }

        .pfp-page {
          min-height: 100vh;
          background: #fff;
          overflow-x: hidden;
        }

        /* ---------------- HEADER ---------------- */
        .header {
          height: 84px;
          padding: 0 4.5vw;
          display: flex;
          align-items: center;
          gap: 28px;
          border-bottom: 1px solid #eef1f8;
          background: rgba(255,255,255,.97);
          position: sticky;
          top: 0;
          z-index: 20;
        }

        .logo-container {
          display: flex;
          align-items: center;
          cursor: pointer;
        }

        .logo {
          width: 174px;
          height: auto;
          object-fit: contain;
          flex: 0 0 auto;
        }

        .nav {
          display: flex;
          align-items: center;
          gap: 27px;
          flex: 1;
        }

        .nav button {
          border: 0;
          background: transparent;
          color: var(--navy);
          font-size: 15px;
          font-weight: 500;
          padding: 8px 0;
          cursor: pointer;
          position: relative;
          white-space: nowrap;
        }

        .nav button:hover,
        .nav button.active { color: var(--pink); }

        .nav button.active::after {
          content: "";
          position: absolute;
          height: 3px;
          left: 0;
          right: 0;
          bottom: -18px;
          border-radius: 4px;
          background: var(--pink);
        }

        .header-actions {
          display: flex;
          align-items: center;
          gap: 10px;
          flex: 0 0 auto;
        }

        .region-menu {
          position: relative;
          flex: 0 0 auto;
        }

        .region-trigger {
          height: 42px;
          min-width: 138px;
          padding: 0 13px;
          display: inline-flex;
          align-items: center;
          justify-content: space-between;
          gap: 9px;
          border: 1px solid #bfcbe8;
          border-radius: 23px;
          background: #fff;
          color: var(--navy);
          font-size: 14px;
          font-weight: 600;
          cursor: pointer;
          white-space: nowrap;
        }

        .region-trigger.state-trigger { min-width: 102px; }

        .region-left {
          display: inline-flex;
          align-items: center;
          gap: 7px;
        }

        .flag {
          font-size: 17px;
          line-height: 1;
        }

        .region-chevron {
          font-size: 10px;
          color: #5d6f9f;
          transition: transform .15s ease;
        }

        .region-trigger.open .region-chevron {
          transform: rotate(180deg);
        }

        .region-dropdown {
          position: absolute;
          top: calc(100% + 8px);
          right: 0;
          min-width: 170px;
          padding: 7px;
          border: 1px solid #d9e0ef;
          border-radius: 14px;
          background: #fff;
          box-shadow: 0 18px 40px rgba(25,48,105,.16);
          z-index: 50;
        }

        .region-option {
          width: 100%;
          display: flex;
          align-items: center;
          gap: 9px;
          padding: 9px 10px;
          border: 0;
          border-radius: 9px;
          background: transparent;
          color: var(--navy);
          font-size: 13px;
          font-weight: 600;
          text-align: left;
          cursor: pointer;
        }

        .region-option:hover,
        .region-option.selected {
          background: #f4f7ff;
          color: var(--pink);
        }

        .state-dropdown { min-width: 130px; }

        .select-wrap {
          position: relative;
        }

        .select {
          height: 40px;
          min-width: 118px;
          padding: 0 34px 0 14px;
          border: 1px solid #bfcbe8;
          border-radius: 22px;
          background: #fff;
          color: var(--navy);
          font-weight: 600;
          cursor: pointer;
          appearance: none;
        }

        .select.small { min-width: 92px; }

        .select-arrow {
          position: absolute;
          right: 13px;
          top: 50%;
          transform: translateY(-50%);
          pointer-events: none;
          font-size: 11px;
        }

        .header-divider {
          width: 1px;
          height: 28px;
          background: #dce2ef;
          margin: 0 8px;
        }

        .btn-login,
        .btn-signup {
          height: 42px;
          border-radius: 24px;
          padding: 0 22px;
          font-size: 14px;
          font-weight: 700;
          cursor: pointer;
          transition: transform .15s ease, box-shadow .15s ease;
        }

        .btn-login {
          color: var(--navy);
          background: #fff;
          border: 1px solid #aebcdd;
        }

        .btn-login:hover {
          background: #f8faff;
        }

        .btn-signup {
          color: #fff;
          background: var(--pink);
          border: 1px solid var(--pink);
          box-shadow: 0 8px 20px rgba(242,11,134,.2);
        }

        .btn-signup:hover {
          background: var(--pink-dark);
          transform: translateY(-1px);
        }

        /* ---------------- HERO ---------------- */
        .hero {
          display: grid;
          grid-template-columns: minmax(390px, 1.02fr) minmax(350px, .88fr) minmax(470px, 1.22fr);
          min-height: 505px;
          align-items: center;
          padding: 38px 4.5vw 26px;
          gap: 30px;
          background:
            radial-gradient(circle at 63% 44%, rgba(216,237,255,.72), transparent 29%),
            radial-gradient(circle at 90% 52%, rgba(247,235,255,.32), transparent 24%),
            #fff;
        }

        .eyebrow {
          color: #5b71ac;
          font-size: 14px;
          font-weight: 700;
          letter-spacing: 2.4px;
          line-height: 1.55;
          margin-bottom: 18px;
        }

        .hero-title {
          margin: 0;
          max-width: 530px;
          font-family: Poppins, Inter, sans-serif;
          font-size: clamp(42px, 4.2vw, 62px);
          line-height: 1.04;
          letter-spacing: -2.4px;
          color: var(--navy);
        }

        .hero-title .pink { color: var(--pink); }

        .hero-copy {
          max-width: 480px;
          color: var(--muted);
          font-size: 19px;
          line-height: 1.45;
          margin: 20px 0 22px;
        }

        .primary-cta {
          height: 50px;
          padding: 0 30px;
          border: 0;
          border-radius: 27px;
          color: #fff;
          background: var(--pink);
          font-size: 16px;
          font-weight: 700;
          cursor: pointer;
          box-shadow: 0 12px 24px rgba(242,11,134,.22);
          transition: transform .15s ease, background .15s ease;
        }

        .primary-cta:hover {
          background: var(--pink-dark);
          transform: translateY(-1px);
        }

        .trust-row {
          display: flex;
          flex-wrap: wrap;
          gap: 22px;
          margin-top: 22px;
          color: #6575a1;
          font-size: 12px;
        }

        .trust-item {
          display: flex;
          align-items: center;
          gap: 7px;
        }

        .check {
          width: 18px;
          height: 18px;
          display: inline-flex;
          align-items: center;
          justify-content: center;
          border-radius: 50%;
          color: #fff;
          background: #7d8db9;
          font-size: 11px;
          font-weight: 800;
        }

        /* ---------------- DEMO CARD ---------------- */
        .demo-card {
          width: 100%;
          max-width: 390px;
          justify-self: center;
          padding: 22px 22px 18px;
          border: 1px solid #e0e7f5;
          border-radius: 18px;
          background: rgba(255,255,255,.98);
          box-shadow: 0 20px 55px rgba(45,75,135,.18);
        }

        .demo-top {
          display: flex;
          justify-content: space-between;
          color: #536ca5;
          font-size: 13px;
          font-weight: 500;
        }

        .progress-track {
          height: 10px;
          border-radius: 8px;
          background: #e5ebf7;
          margin: 9px 0 28px;
          overflow: hidden;
        }

        .progress-fill {
          height: 100%;
          border-radius: inherit;
          background: var(--green);
          transition: width .25s ease;
        }

        .question {
          margin: 0 0 20px;
          text-align: center;
          color: var(--navy);
          font-family: Poppins, Inter, sans-serif;
          font-size: 36px;
          font-weight: 700;
        }

        .answer-grid {
          display: grid;
          grid-template-columns: 1fr 1fr;
          gap: 9px;
        }

        .answer {
          height: 50px;
          border-radius: 8px;
          border: 1px solid #b8c7e5;
          background: #fff;
          color: var(--navy);
          font-size: 18px;
          font-weight: 700;
          cursor: pointer;
          transition: border-color .15s ease, transform .15s ease;
        }

        .answer:hover { border-color: var(--blue); transform: translateY(-1px); }

        .answer.correct {
          border-color: var(--green);
          background: #e9fbf3;
          color: #079e66;
        }

        .answer.wrong {
          border-color: #f18a9f;
          background: #fff0f3;
          color: #c23c58;
        }

        .feedback {
          min-height: 65px;
          display: flex;
          flex-direction: column;
          align-items: center;
          justify-content: center;
          gap: 3px;
          font-size: 16px;
          font-weight: 700;
        }

        .feedback.success { color: var(--green); }
        .feedback.error { color: #d94b63; }

        .feedback-icon {
          width: 36px;
          height: 36px;
          border-radius: 50%;
          display: inline-flex;
          align-items: center;
          justify-content: center;
          background: var(--green);
          color: #fff;
          font-size: 21px;
        }

        .xp { color: var(--navy); font-size: 13px; }

        .next-btn {
          display: block;
          margin: 3px auto 0;
          height: 39px;
          padding: 0 25px;
          border-radius: 21px;
          background: #fff;
          border: 1px solid #afc0e1;
          color: var(--navy);
          font-size: 13px;
          font-weight: 700;
          cursor: pointer;
          transition: background .15s ease;
        }

        .next-btn:hover {
          background: #f8faff;
        }

        /* ---------------- HERO PHOTO ---------------- */
        .hero-photo {
          position: relative;
          width: 100%;
          max-width: 590px;
          aspect-ratio: 875 / 570;
          justify-self: end;
          overflow: hidden;
          border-radius: 20px;
          background: #f5f8ff;
          box-shadow: 0 22px 52px rgba(33, 60, 120, .15);
        }

        .hero-photo img {
          width: 100%;
          height: 100%;
          object-fit: cover;
          object-position: center;
          display: block;
        }

        /* ---------------- FEATURES ---------------- */
        .feature-strip {
          display: grid;
          grid-template-columns: repeat(4, 1fr);
          gap: 10px;
          padding: 18px 4.5vw 30px;
        }

        .feature {
          min-height: 78px;
          display: flex;
          align-items: center;
          gap: 16px;
          padding: 8px 22px;
          border-right: 1px solid #e1e6f1;
        }

        .feature:last-child { border-right: 0; }

        .feature-icon {
          width: 50px;
          height: 50px;
          border-radius: 50%;
          display: inline-flex;
          align-items: center;
          justify-content: center;
          background: #f5f6fb;
          flex: 0 0 auto;
        }

        .feature-icon.game { color: #5f35d6; }
        .feature-icon.bolt { color: #ff9e18; }
        .feature-icon.chart { color: #5470ad; }
        .feature-icon.shield { color: #1a9bc9; }

        .feature strong {
          display: block;
          color: var(--navy);
          font-family: Poppins, Inter, sans-serif;
          font-size: 15px;
          margin-bottom: 5px;
        }

        .feature span {
          color: #7180aa;
          font-size: 12px;
          line-height: 1.35;
        }

        /* ---------------- GRADES ---------------- */
        .section {
          padding: 0 4.5vw 38px;
        }

        .section-title {
          margin: 0 0 20px;
          color: var(--navy);
          font-family: Poppins, Inter, sans-serif;
          font-size: 27px;
          letter-spacing: -.7px;
        }

        .grades {
          display: grid;
          grid-template-columns: repeat(8, 1fr);
          gap: 9px;
        }

        .grade {
          min-height: 82px;
          border: 0;
          border-radius: 8px;
          cursor: pointer;
          color: var(--navy);
          transition: transform .15s ease, box-shadow .15s ease;
        }

        .grade:hover {
          transform: translateY(-3px);
          box-shadow: 0 10px 22px rgba(35,62,120,.1);
        }

        .grade-icon {
          height: 34px;
          display: flex;
          align-items: center;
          justify-content: center;
          margin-bottom: 6px;
          color: var(--navy);
        }

        .grade-number {
          display: block;
          font-family: Poppins, Inter, sans-serif;
          font-size: 31px;
          line-height: 1;
          font-weight: 800;
        }

        .grade-name {
          display: block;
          font-size: 13px;
          font-weight: 700;
        }


        /* ---------------- BENEFITS ---------------- */
        .benefits-section {
          padding: 12px 4.5vw 42px;
        }

        .benefits-grid {
          display: grid;
          grid-template-columns: repeat(3, 1fr);
          gap: 0;
          border-top: 1px solid #edf0f7;
          border-bottom: 1px solid #edf0f7;
        }

        .benefit {
          min-height: 154px;
          padding: 25px 34px 22px;
          display: flex;
          align-items: flex-start;
          gap: 16px;
        }

        .benefit + .benefit {
          border-left: 1px solid #e6eaf3;
        }

        .benefit-icon {
          width: 52px;
          height: 52px;
          flex: 0 0 52px;
          display: flex;
          align-items: center;
          justify-content: center;
          border-radius: 16px;
          background: #f6f8ff;
          color: var(--pink);
        }

        .benefit:nth-child(2) .benefit-icon { color: var(--teal); }
        .benefit:nth-child(3) .benefit-icon { color: var(--blue); }

        .benefit h3 {
          margin: 2px 0 6px;
          color: var(--navy);
          font-family: Poppins, Inter, sans-serif;
          font-size: 17px;
          line-height: 1.2;
        }

        .benefit p {
          margin: 0;
          max-width: 270px;
          color: #6879a6;
          font-size: 13px;
          line-height: 1.5;
        }

        /* ---------------- PARENT / SCHOOL ---------------- */
        .audience-grid {
          display: grid;
          grid-template-columns: 1fr 1fr;
          gap: 28px;
        }

        .audience-card {
          min-height: 215px;
          position: relative;
          overflow: hidden;
          border-radius: 12px;
          padding: 25px;
        }

        .parent-card {
          background: linear-gradient(105deg, #fff1f7, #fff8fb);
        }

        .school-card {
          background: linear-gradient(105deg, #edf8ff, #f4fbff);
        }

        .audience-kicker {
          font-size: 12px;
          letter-spacing: 1.5px;
          font-weight: 800;
          margin-bottom: 8px;
        }

        .parent-card .audience-kicker { color: var(--pink); }
        .school-card .audience-kicker { color: var(--blue); }

        .audience-title {
          max-width: 320px;
          margin: 0;
          font-family: Poppins, Inter, sans-serif;
          color: var(--navy);
          font-size: 28px;
          line-height: 1.08;
        }

        .audience-copy {
          max-width: 340px;
          color: #5f72a6;
          font-size: 14px;
          line-height: 1.45;
          margin: 10px 0 15px;
        }

        .small-cta {
          height: 42px;
          padding: 0 25px;
          border: 0;
          border-radius: 23px;
          color: #fff;
          font-weight: 700;
          cursor: pointer;
          transition: background .15s ease;
        }

        .parent-card .small-cta { background: var(--pink); }
        .parent-card .small-cta:hover { background: var(--pink-dark); }
        .school-card .small-cta { background: var(--blue); }
        .school-card .small-cta:hover { background: #0d75cc; }

        .parent-photo {
          position: absolute;
          right: 0;
          bottom: 0;
          width: 48%;
          height: 100%;
          object-fit: cover;
          object-position: center;
          mask-image: linear-gradient(to right, transparent, black 22%);
          -webkit-mask-image: linear-gradient(to right, transparent, black 22%);
        }

        .progress-widget {
          position: absolute;
          right: 28px;
          top: 27px;
          width: 175px;
          padding: 15px;
          border-radius: 10px;
          background: rgba(255,255,255,.96);
          box-shadow: 0 12px 25px rgba(33,67,120,.1);
        }

        .progress-widget strong {
          display: block;
          margin-bottom: 11px;
          color: var(--navy);
          font-size: 12px;
        }

        .progress-row {
          display: grid;
          grid-template-columns: 45px 1fr;
          align-items: center;
          gap: 8px;
          margin: 8px 0;
          color: #6678a8;
          font-size: 11px;
        }

        .bar {
          height: 7px;
          background: #e6ebf4;
          border-radius: 6px;
          overflow: hidden;
        }

        .bar span {
          display: block;
          height: 100%;
          border-radius: inherit;
        }

        .bar.green span { width: 87%; background: #15bf7b; }
        .bar.blue span { width: 78%; background: #168bea; }
        .bar.purple span { width: 82%; background: #7b4df2; }

        /* ---------------- FOOTER ---------------- */
        .footer {
          margin-top: 30px;
          padding: 38px 4.5vw 25px;
          border-top: 1px solid #e7ebf4;
        }

        .footer-grid {
          display: grid;
          grid-template-columns: 1.25fr 1fr 1fr 1fr 1fr;
          gap: 25px;
        }

        .footer-logo {
          width: 155px;
          margin-bottom: 14px;
        }

        .footer h4 {
          margin: 0 0 12px;
          color: var(--navy);
          font-family: Poppins, Inter, sans-serif;
          font-size: 14px;
        }

        .footer a, .footer button.link-btn {
          display: block;
          margin: 8px 0;
          color: #6c7ca8;
          text-decoration: none;
          font-size: 12px;
          background: transparent;
          border: 0;
          padding: 0;
          cursor: pointer;
          text-align: left;
        }

        .footer a:hover, .footer button.link-btn:hover {
          color: var(--navy);
        }

        .footer-bottom {
          margin-top: 28px;
          color: #7887ae;
          font-size: 11px;
        }

        @media (max-width: 1180px) {
          .header { gap: 14px; }
          .nav { gap: 15px; }
          .nav button { font-size: 12.5px; }
          .logo { width: 145px; }
          .header-actions { gap: 7px; }
          .select { min-width: 104px; }
          .select.small { min-width: 82px; }
          .region-trigger { min-width: 124px; }
          .region-trigger.state-trigger { min-width: 92px; }
          .btn-login, .btn-signup { padding: 0 17px; }
          .hero { grid-template-columns: minmax(0, 1.05fr) minmax(300px, .9fr) minmax(360px, 1.1fr); }
          .hero-photo { max-width: 540px; }
          .hero-title { font-size: 47px; }
        }

        @media (max-width: 980px) {
          .header {
            height: auto;
            min-height: 78px;
            flex-wrap: wrap;
            padding: 14px 5vw;
          }
          .nav {
            order: 3;
            width: 100%;
            overflow-x: auto;
            padding-bottom: 3px;
          }
          .nav button.active::after { bottom: -4px; }
          .header-actions { margin-left: auto; }
          .region-trigger { height: 40px; font-size: 13px; }
          .hero { grid-template-columns: 1fr 1fr; }
          .hero-photo {
            grid-column: 1 / -1;
            justify-self: center;
            width: min(100%, 620px);
            max-width: 620px;
            margin-top: 4px;
          }
          .demo-card { max-width: 430px; }
          .grades { grid-template-columns: repeat(4, 1fr); }
          .feature-strip { grid-template-columns: repeat(2, 1fr); }
          .benefits-grid { grid-template-columns: 1fr; }
          .benefit + .benefit { border-left: 0; border-top: 1px solid #e6eaf3; }
          .feature:nth-child(2) { border-right: 0; }
          .audience-grid { grid-template-columns: 1fr; }
        }

        @media (max-width: 640px) {
          .header { gap: 12px; }
          .logo { width: 135px; }
          .header-actions {
            gap: 5px;
          }
          .select { min-width: 95px; height: 37px; font-size: 12px; }
          .select.small { min-width: 76px; }
          .region-trigger { min-width: 102px; height: 37px; padding: 0 10px; font-size: 12px; }
          .region-trigger.state-trigger { min-width: 72px; }
          .region-dropdown { right: auto; left: 0; }
          .benefits-section { padding-bottom: 30px; }
          .header-divider { display: none; }
          .btn-login, .btn-signup {
            height: 37px;
            padding: 0 13px;
            font-size: 12px;
          }
          .hero {
            grid-template-columns: 1fr;
            padding-top: 28px;
          }
          .hero-title { font-size: 42px; }
          .hero-copy { font-size: 16px; }
          .demo-card { margin-top: 5px; }
          .hero-photo {
            width: 100%;
            max-width: 100%;
            margin-top: 4px;
            border-radius: 14px;
          }
          .feature-strip { grid-template-columns: 1fr; }
          .feature { border-right: 0; border-bottom: 1px solid #e1e6f1; }
          .grades { grid-template-columns: repeat(2, 1fr); }
          .parent-photo { opacity: .25; width: 65%; }
          .progress-widget { display: none; }
          .audience-title { font-size: 24px; }
          .footer-grid { grid-template-columns: 1fr 1fr; }
        }
      `}</style>

      {/* ---------------- HEADER ---------------- */}
      <header className="header">
        <div className="logo-container" onClick={() => window.scrollTo({ top: 0, behavior: 'smooth' })}>
          <img 
            className="logo" 
            src="/assets/pforpencil-logo.png" 
            alt="P for Pencil" 
            onError={(e) => {
              e.currentTarget.src = '/assets/logo.png';
            }}
          />
        </div>

        <nav className="nav" aria-label="Primary navigation">
          <button className="active" onClick={() => window.scrollTo({ top: 0, behavior: 'smooth' })}>Home</button>
          <button onClick={() => scrollTo('about')}>About</button>
          <button onClick={() => scrollTo('parents')}>For Parents</button>
          <button onClick={() => scrollTo('schools')}>For Schools</button>
          <button onClick={() => onOpenPricing()}>Pricing</button>
          <button onClick={() => scrollTo('help')}>Help</button>
        </nav>

        <div className="header-actions">
          <div className="region-menu">
            <button
              type="button"
              className={`region-trigger ${openRegion === 'country' ? 'open' : ''}`}
              onClick={() => setOpenRegion(openRegion === 'country' ? null : 'country')}
              aria-haspopup="listbox"
              aria-expanded={openRegion === 'country'}
            >
              <span className="region-left">
                <span className="flag">{COUNTRY_FLAG_MAP[country] || '🌐'}</span>
                <span>{country}</span>
              </span>
              <span className="region-chevron">⌄</span>
            </button>
            {openRegion === 'country' && (
              <div className="region-dropdown" role="listbox">
                {Object.keys(COUNTRY_STATE_MAP).map((item) => (
                  <button
                    type="button"
                    key={item}
                    className={`region-option ${country === item ? 'selected' : ''}`}
                    onClick={() => handleCountryChange(item)}
                  >
                    <span className="flag">{COUNTRY_FLAG_MAP[item] || '🌐'}</span>
                    <span>{item}</span>
                  </button>
                ))}
              </div>
            )}
          </div>

          <div className="region-menu">
            <button
              type="button"
              className={`region-trigger state-trigger ${openRegion === 'state' ? 'open' : ''}`}
              onClick={() => setOpenRegion(openRegion === 'state' ? null : 'state')}
              aria-haspopup="listbox"
              aria-expanded={openRegion === 'state'}
            >
              <span>{state}</span>
              <span className="region-chevron">⌄</span>
            </button>
            {openRegion === 'state' && (
              <div className="region-dropdown state-dropdown" role="listbox">
                {(COUNTRY_STATE_MAP[country] || []).map((item) => (
                  <button
                    type="button"
                    key={item}
                    className={`region-option ${state === item ? 'selected' : ''}`}
                    onClick={() => handleStateChange(item)}
                  >
                    <span>{item}</span>
                  </button>
                ))}
              </div>
            )}
          </div>

          <div className="header-divider" />

          <button
            className="btn-login"
            onClick={() => onOpenAuthModal({ screen: 'signin' })}
          >
            Log In
          </button>
          <button
            className="btn-signup"
            onClick={() => onOpenAuthModal({ screen: 'register' })}
          >
            Sign Up
          </button>
        </div>
      </header>

      <main>
        {/* ---------------- HERO ---------------- */}
        <section className="hero" id="about">
          <div>
            <div className="eyebrow">PRACTICE TODAY.<br />BRIGHTER TOMORROWS.</div>
            <h1 className="hero-title">
              Math practice<br />
              <span className="pink">that builds</span><br />
              brighter learners
            </h1>
            <p className="hero-copy">
              Interactive, adaptive math practice for Preschool – Grade 6.
            </p>
            <button 
              className="primary-cta" 
              onClick={() => onOpenAuthModal({ screen: 'register' })}
            >
              Get Started Free&nbsp; → 
            </button>

            <div className="trust-row">
              <span className="trust-item"><span className="check">✓</span>No credit card required</span>
              <span className="trust-item"><span className="check">✓</span>Safe & ad-free</span>
              <span className="trust-item"><span className="check">✓</span>Loved by families</span>
            </div>
          </div>

          {/* ---------------- DEMO CARD ---------------- */}
          <div className="demo-card" aria-label="Interactive math demo">
            <div className="demo-top">
              <span>Question {questionIndex + 1} of {demoQuestions.length}</span>
              <span>◷ 00:{String(seconds).padStart(2, '0')}</span>
            </div>

            <div className="progress-track">
              <div className="progress-fill" style={{ width: `${progress}%` }} />
            </div>

            <h2 className="question">{question.question}</h2>

            <div className="answer-grid">
              {question.options.map((answer) => (
                <button
                  key={answer}
                  className={[
                    'answer',
                    selectedAnswer === answer && answer === question.answer ? 'correct' : '',
                    selectedAnswer === answer && answer !== question.answer ? 'wrong' : '',
                  ].join(' ')}
                  onClick={() => chooseAnswer(answer)}
                >
                  {answer}
                </button>
              ))}
            </div>

            <div className={`feedback ${selectedAnswer === question.answer ? 'success' : selectedAnswer ? 'error' : ''}`}>
              {selectedAnswer === question.answer && (
                <>
                  <span className="feedback-icon">✓</span>
                  <span>Correct!</span>
                  <span className="xp">⭐ +10 XP · Total {xp} XP</span>
                </>
              )}
              {selectedAnswer && selectedAnswer !== question.answer && (
                <span>Try again — the correct answer is {question.answer}.</span>
              )}
            </div>

            <button className="next-btn" onClick={nextQuestion}>
              Next Question&nbsp; →
            </button>

            <button
              onClick={resetDemo}
              style={{
                display: 'block',
                margin: '10px auto 0',
                border: 0,
                background: 'transparent',
                color: '#7383ad',
                fontSize: 11,
                cursor: 'pointer',
              }}
            >
              Reset demo
            </button>
          </div>

          {/* ---------------- HERO PHOTO ---------------- */}
          <div className="hero-photo">
            <img 
              src="/assets/hero-student.jpg" 
              alt="Child practicing mathematics" 
            />
          </div>
        </section>

        {/* ---------------- FEATURES ---------------- */}
        <section className="feature-strip" aria-label="P for Pencil benefits">
          <div className="feature">
            <span className="feature-icon game"><UiIcon kind="game" size={24} /></span>
            <div><strong>Interactive Practice</strong><span>Engaging and adaptive</span></div>
          </div>
          <div className="feature">
            <span className="feature-icon bolt"><UiIcon kind="bolt" size={23} /></span>
            <div><strong>Instant Feedback</strong><span>Learn from mistakes</span></div>
          </div>
          <div className="feature">
            <span className="feature-icon chart"><UiIcon kind="chart" size={24} /></span>
            <div><strong>Track Progress</strong><span>See real growth</span></div>
          </div>
          <div className="feature">
            <span className="feature-icon shield"><UiIcon kind="shield" size={24} /></span>
            <div><strong>Safe &amp; Ad-free</strong><span>A trusted learning space</span></div>
          </div>
        </section>

        {/* ---------------- GRADES ---------------- */}
        <section className="section" id="grades">
          <h2 className="section-title">Choose a Grade</h2>
          <div className="grades">
            {gradesList.map((grade) => (
              <button
                key={grade.label}
                className="grade"
                style={{ background: grade.accent }}
                onClick={() => handleGradeClick(grade)}
              >
                <span className="grade-icon"><GradeIcon icon={grade.icon} /></span>
                <span className="grade-name">{grade.label}</span>
              </button>
            ))}
          </div>
        </section>

        {/* ---------------- LEARNING BENEFITS ---------------- */}
        <section className="benefits-section" aria-label="Why families choose P for Pencil">
          <div className="benefits-grid">
            <article className="benefit">
              <span className="benefit-icon"><UiIcon kind="target" size={29} /></span>
              <div>
                <h3>Build Confidence</h3>
                <p>Give children small wins, useful feedback and practice that helps them feel ready for the next challenge.</p>
              </div>
            </article>

            <article className="benefit">
              <span className="benefit-icon"><UiIcon kind="smile" size={29} /></span>
              <div>
                <h3>Make Math Enjoyable</h3>
                <p>Turn everyday practice into a positive learning experience with interactive questions and playful progress.</p>
              </div>
            </article>

            <article className="benefit">
              <span className="benefit-icon"><UiIcon kind="sun" size={29} /></span>
              <div>
                <h3>Prepare for a Brighter Tomorrow</h3>
                <p>Build strong foundations that support confident learners from Preschool through Grade 6.</p>
              </div>
            </article>
          </div>
        </section>

        {/* ---------------- PARENT / SCHOOL ---------------- */}
        <section className="section audience-grid" id="parents">
          <article className="audience-card parent-card">
            <div className="audience-kicker">FOR PARENTS</div>
            <h2 className="audience-title">Support your child's progress</h2>
            <p className="audience-copy">
              See progress. Build confidence. Help them reach their potential.
            </p>
            <button 
              className="small-cta" 
              onClick={() => onOpenAuthModal({ screen: 'register', role: 'parent' })}
            >
              Learn More&nbsp; →
            </button>
            <img 
              className="parent-photo" 
              src="/assets/parent-child.jpg" 
              alt="Parent supporting a child learning" 
            />
          </article>

          <article className="audience-card school-card" id="schools">
            <div className="audience-kicker">FOR SCHOOLS</div>
            <h2 className="audience-title">Engage more learners</h2>
            <p className="audience-copy">
              Simple setup. Real results. Support every student's journey.
            </p>
            <button 
              className="small-cta" 
              onClick={() => onOpenAuthModal({ screen: 'register', role: 'school' })}
            >
              Learn More&nbsp; →
            </button>

            <div className="progress-widget">
              <strong>Class Progress</strong>
              <div className="progress-row"><span>Grade 3</span><div className="bar green"><span /></div></div>
              <div className="progress-row"><span>Grade 4</span><div className="bar blue"><span /></div></div>
              <div className="progress-row"><span>Grade 5</span><div className="bar purple"><span /></div></div>
            </div>
          </article>
        </section>

        {/* ---------------- PRICING BANNER ---------------- */}
        <section className="section" id="pricing" style={{ paddingTop: 5 }}>
          <div 
            onClick={() => onOpenPricing()}
            style={{
              borderRadius: 18,
              padding: '22px 25px',
              background: '#f6f9ff',
              color: '#536ba4',
              textAlign: 'center',
              fontSize: 13,
              cursor: 'pointer'
            }}
          >
            Looking for School & Family Membership plans? <strong style={{ color: '#168bea', textDecoration: 'underline' }}>View Pricing & Plans →</strong>
          </div>
        </section>
      </main>

      {/* ---------------- FOOTER ---------------- */}
      <footer className="footer" id="help">
        <div className="footer-grid">
          <div>
            <img 
              className="footer-logo" 
              src="/assets/pforpencil-logo.png" 
              alt="P for Pencil" 
              onError={(e) => {
                e.currentTarget.src = '/assets/logo.png';
              }}
            />
            <div style={{ color: '#6879a6', fontSize: 12 }}>
              Practice Today. Brighter Tomorrows.
            </div>
          </div>

          <div>
            <h4>About</h4>
            <button className="link-btn" onClick={() => scrollTo('about')}>Our Story</button>
            <button className="link-btn" onClick={() => scrollTo('about')}>Our Approach</button>
            <button className="link-btn" onClick={() => alert('Contact us at support@pforpencil.com')}>Contact Us</button>
          </div>

          <div>
            <h4>For Parents</h4>
            <button className="link-btn" onClick={() => onOpenAuthModal({ screen: 'signin', role: 'parent' })}>Overview</button>
            <button className="link-btn" onClick={() => onOpenAuthModal({ screen: 'signin', role: 'parent' })}>Progress Tracking</button>
            <button className="link-btn" onClick={() => alert('Safety: Child-safe, COPPA compliant learning environment.')}>Safety</button>
          </div>

          <div>
            <h4>For Schools</h4>
            <button className="link-btn" onClick={() => onOpenAuthModal({ screen: 'signin', role: 'school' })}>Overview</button>
            <button className="link-btn" onClick={() => onOpenAuthModal({ screen: 'register', role: 'school' })}>Get Started</button>
            <button className="link-btn" onClick={() => alert('Sales inquiry: schools@pforpencil.com')}>Contact Sales</button>
          </div>

          <div>
            <h4>Support</h4>
            <button className="link-btn" onClick={onOpenRegionModal}>Curriculum Standards</button>
            <button className="link-btn" onClick={() => alert('FAQ: Find answers to common setup questions.')}>FAQ</button>
            <button className="link-btn" onClick={() => alert('Privacy Policy: All student data is secure and protected.')}>Privacy Policy</button>
            <button className="link-btn" onClick={() => alert('Terms of Service: pforpencil.com/terms')}>Terms of Service</button>
          </div>
        </div>

        <div className="footer-bottom">
          © 2026 P for Pencil. All rights reserved.
        </div>
      </footer>

      {/* Discreet floating tester sandbox button in bottom-right corner for portal testing */}
      <aside className="fixed bottom-3 right-3 z-50 bg-white/95 backdrop-blur-md rounded-2xl shadow-xl border border-stone-200 p-2 flex items-center gap-1.5 text-xs font-bold text-stone-700">
        <span className="text-[10px] text-stone-400 font-extrabold uppercase tracking-wider pl-1">🎭 Portal:</span>
        {allUsers.filter((u) => ['student', 'parent', 'teacher', 'school', 'admin'].includes(u.role)).slice(0, 5).map((user) => (
          <button
            key={user.id}
            onClick={() => {
              onSelectRoleUser(user);
              sounds.playCorrect();
            }}
            className={`px-2 py-0.5 rounded-lg transition-all capitalize cursor-pointer text-[11px] ${
              currentUser.id === user.id 
                ? 'bg-[#10246f] text-white shadow-2xs font-black' 
                : 'hover:bg-stone-100 text-stone-600'
            }`}
          >
            {user.role}
          </button>
        ))}
        <button
          onClick={onOpenSupabaseModal}
          className="p-1 rounded-lg hover:bg-stone-100 text-stone-500 hover:text-stone-900 transition-colors cursor-pointer"
          title="Open Database Hub"
        >
          🗄️
        </button>
      </aside>
    </div>
  );
}
