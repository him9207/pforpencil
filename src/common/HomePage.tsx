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

type Grade = {
  label: string;
  short: string;
  accent: string;
  icon: string;
};

const gradesList: Grade[] = [
  { label: 'Preschool', short: 'P', accent: '#FCE8F3', icon: '✦' },
  { label: 'Foundation', short: 'F', accent: '#EAF8F5', icon: '🌱' },
  { label: 'Grade 1', short: '1', accent: '#EEF6FF', icon: '1' },
  { label: 'Grade 2', short: '2', accent: '#EAFBF2', icon: '2' },
  { label: 'Grade 3', short: '3', accent: '#FFF2EA', icon: '3' },
  { label: 'Grade 4', short: '4', accent: '#F1EDFF', icon: '4' },
  { label: 'Grade 5', short: '5', accent: '#FFF9E8', icon: '5' },
  { label: 'Grade 6', short: '6', accent: '#FFEAF5', icon: '6' },
];

const demoQuestions = [
  { question: '7 + 5 = ?', options: ['10', '11', '12', '13'], answer: '12' },
  { question: '9 + 4 = ?', options: ['12', '13', '14', '15'], answer: '13' },
  { question: '15 − 6 = ?', options: ['7', '8', '9', '10'], answer: '9' },
];

const countries: Record<string, string[]> = {
  Australia: ['NSW', 'VIC', 'QLD', 'WA', 'SA', 'TAS', 'ACT', 'NT'],
  India: ['Delhi', 'Maharashtra', 'Karnataka', 'Tamil Nadu', 'Gujarat'],
  'New Zealand': ['Auckland', 'Wellington', 'Canterbury', 'Waikato'],
};

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
}: HomePageProps) {
  const [country, setCountry] = useState('Australia');
  const [state, setState] = useState('NSW');
  const [questionIndex, setQuestionIndex] = useState(0);
  const [selectedAnswer, setSelectedAnswer] = useState<string | null>(null);
  const [xp, setXp] = useState(0);
  const [seconds, setSeconds] = useState(24);

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
    const nextStates = countries[value] || [];
    setState(nextStates[0] || '');
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
          grid-template-columns: 1.05fr .9fr 1.25fr;
          min-height: 485px;
          align-items: center;
          padding: 36px 4.5vw 22px;
          gap: 26px;
          background:
            radial-gradient(circle at 62% 40%, rgba(216,237,255,.65), transparent 28%),
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
          max-width: 500px;
          aspect-ratio: 875 / 570;
          justify-self: end;
          overflow: hidden;
          border-radius: 18px;
          background: #f5f8ff;
          box-shadow: 0 18px 45px rgba(33, 60, 120, .12);
        }

        .hero-photo img {
          width: 100%;
          height: 100%;
          object-fit: cover;
          object-position: center;
          display: block;
        }

        .photo-note {
          position: absolute;
          right: 18px;
          top: 18px;
          max-width: 145px;
          color: var(--navy);
          font-family: Poppins, Inter, sans-serif;
          font-size: 20px;
          line-height: 1.05;
          font-weight: 600;
          transform: rotate(-5deg);
          text-align: center;
          z-index: 2;
          pointer-events: none;
        }

        .photo-note::after {
          content: "";
          display: block;
          width: 80px;
          height: 5px;
          border-bottom: 3px solid var(--pink);
          border-radius: 50%;
          transform: rotate(-4deg);
          margin: 7px auto 0;
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
          font-size: 24px;
          flex: 0 0 auto;
        }

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
          margin: 0 0 18px;
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
          display: block;
          font-family: Poppins, Inter, sans-serif;
          font-size: 27px;
          font-weight: 800;
          margin-bottom: 6px;
        }

        .grade-name {
          display: block;
          font-size: 13px;
          font-weight: 700;
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
          .btn-login, .btn-signup { padding: 0 17px; }
          .hero { grid-template-columns: minmax(0, 1.05fr) minmax(300px, .9fr) minmax(330px, 1.1fr); }
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
          .photo-note {
            font-size: 16px;
            right: 12px;
            top: 12px;
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
          <label className="select-wrap">
            <select className="select" value={country} onChange={(e) => handleCountryChange(e.target.value)}>
              {Object.keys(countries).map((item) => <option key={item}>{item}</option>)}
            </select>
            <span className="select-arrow">⌄</span>
          </label>

          <label className="select-wrap">
            <select className="select small" value={state} onChange={(e) => setState(e.target.value)}>
              {(countries[country] || []).map((item) => <option key={item}>{item}</option>)}
            </select>
            <span className="select-arrow">⌄</span>
          </label>

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
            <div className="photo-note">Confident Kids<br />Brighter Futures</div>
          </div>
        </section>

        {/* ---------------- FEATURES ---------------- */}
        <section className="feature-strip">
          <div className="feature">
            <span className="feature-icon">🎮</span>
            <div><strong>Interactive Practice</strong><span>Engaging and adaptive</span></div>
          </div>
          <div className="feature">
            <span className="feature-icon">⚡</span>
            <div><strong>Instant Feedback</strong><span>Learn from mistakes</span></div>
          </div>
          <div className="feature">
            <span className="feature-icon">▮▮▮</span>
            <div><strong>Track Progress</strong><span>See real growth</span></div>
          </div>
          <div className="feature">
            <span className="feature-icon">🛡</span>
            <div><strong>Safe & Ad-free</strong><span>A trusted learning space</span></div>
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
                <span className="grade-icon">{grade.icon}</span>
                <span className="grade-name">{grade.label}</span>
              </button>
            ))}
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
