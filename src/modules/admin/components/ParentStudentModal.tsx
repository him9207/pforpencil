import React, { useState, useEffect } from 'react';
import { UserAccount, StudentProgress, GradeLevel } from '../../../types';
import { 
  Heart, 
  X, 
  Plus, 
  Trash2, 
  UserPlus, 
  Sparkles, 
  CheckCircle2, 
  Calendar,
  Clock,
  ShieldCheck,
  User,
  Users,
  Lock
} from 'lucide-react';
import { sounds } from '../../../utils/audio';
import { generateStudentUsername, getNextRoleId, ensureUniqueUsername } from '../../../utils/idAndUsernameGenerator';

interface ParentStudentModalProps {
  isOpen: boolean;
  onClose: () => void;
  parent: UserAccount | null;
  initialMode?: 'new' | 'existing';
  allParents?: UserAccount[];
  allUsers?: UserAccount[];
  availableGrades: string[];
  existingStudentsCount: number;
  onAddStudentsToParent: (
    parentId: string,
    students: { student: UserAccount; progress: StudentProgress }[]
  ) => void;
  onAddUser?: (user: UserAccount) => void;
}

interface NewChildRow {
  tempId: string;
  name: string;
  username: string;
  pin: string;
  grade: GradeLevel;
  avatar: string;
}

const AVATARS = ['🦊', '🦁', '🚀', '🐼', '🦄', '🐯', '🌟', '🐬', '🦉', '🐨', '🦖', '🐝'];

export default function ParentStudentModal({
  isOpen,
  onClose,
  parent,
  initialMode = 'existing',
  allParents = [],
  allUsers = [],
  availableGrades,
  existingStudentsCount,
  onAddStudentsToParent,
  onAddUser
}: ParentStudentModalProps) {
  // Mode: link to existing parent or create new parent first
  const [parentMode, setParentMode] = useState<'existing' | 'new'>(
    parent ? 'existing' : (initialMode === 'new' || allParents.length === 0 ? 'new' : 'existing')
  );

  // New parent form state
  const [newParentName, setNewParentName] = useState('');
  const [newParentEmail, setNewParentEmail] = useState('');
  const [newParentAvatar, setNewParentAvatar] = useState('👨‍👧‍👦');

  // Selected existing parent
  const [selectedParentId, setSelectedParentId] = useState<string>(
    parent?.id || allParents[0]?.id || ''
  );

  // Subscription / Account Validity
  const [validityDuration, setValidityDuration] = useState<
    '30_days' | '90_days' | '365_days' | 'lifetime'
  >('365_days');

  // Update selected parent if prop changes
  useEffect(() => {
    if (parent) {
      setSelectedParentId(parent.id);
      setParentMode('existing');
    } else if (initialMode === 'new' || allParents.length === 0) {
      setParentMode('new');
    } else {
      setSelectedParentId(allParents[0]?.id || '');
      setParentMode('existing');
    }
  }, [parent, allParents, initialMode, isOpen]);

  // Compute active parent safely
  const activeParent = parent || allParents.find(p => p.id === selectedParentId) || (
    parentMode === 'new' && newParentName.trim()
      ? {
          id: getNextRoleId('parent', allUsers),
          role: 'parent' as const,
          name: newParentName.trim(),
          email: newParentEmail.trim() || `${newParentName.toLowerCase().replace(/\s+/g, '.')}@family.net`,
          avatar: newParentAvatar,
          enrolledAt: new Date().toISOString().slice(0, 10),
          status: 'active' as const
        }
      : allParents[0] || null
  );

  const parentLastName = (activeParent?.name || 'Watson').trim().split(/\s+/).slice(-1)[0] || 'Watson';

  // Seed initial child rows
  const [children, setChildren] = useState<NewChildRow[]>([
    {
      tempId: 'child-1',
      name: '',
      username: '',
      pin: String(Math.floor(1000 + Math.random() * 9000)),
      grade: 'Grade 2',
      avatar: '🦄'
    }
  ]);

  if (!isOpen) return null;

  // Calculate expiration date based on validity
  const getExpirationDate = (duration: string): string => {
    const d = new Date();
    if (duration === '30_days') {
      d.setDate(d.getDate() + 30);
      return d.toISOString().slice(0, 10);
    } else if (duration === '90_days') {
      d.setDate(d.getDate() + 90);
      return d.toISOString().slice(0, 10);
    } else if (duration === '365_days') {
      d.setFullYear(d.getFullYear() + 1);
      return d.toISOString().slice(0, 10);
    }
    return '2099-12-31'; // Lifetime
  };

  const handleAddChildRow = () => {
    sounds.click();
    const newRow: NewChildRow = {
      tempId: `child-${Date.now()}-${Math.random()}`,
      name: '',
      username: '',
      pin: String(Math.floor(1000 + Math.random() * 9000)),
      grade: 'Grade 1',
      avatar: AVATARS[(children.length + 1) % AVATARS.length]
    };
    setChildren([...children, newRow]);
  };

  const handleRemoveChildRow = (tempId: string) => {
    sounds.click();
    setChildren(children.filter((c) => c.tempId !== tempId));
  };

  const handleUpdateChild = (tempId: string, field: keyof NewChildRow, value: string) => {
    setChildren((prev) =>
      prev.map((c) => (c.tempId === tempId ? { ...c, [field]: value } : c))
    );
  };

  const handleSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    const validChildren = children.filter((c) => c.name.trim().length > 0);

    if (parentMode === 'new') {
      if (!newParentName.trim()) {
        alert('Please provide the parent full name.');
        return;
      }
    } else {
      if (!selectedParentId && !parent) {
        alert('Please select an existing parent.');
        return;
      }
      if (validChildren.length === 0) {
        alert('Please enter at least one child full name.');
        return;
      }
    }

    const expiresOn = getExpirationDate(validityDuration);
    const planTitle = validityDuration === '30_days' 
      ? 'Monthly Family Pass (30 Days)' 
      : validityDuration === '90_days' 
      ? 'Quarterly Family Pass (90 Days)' 
      : validityDuration === '365_days' 
      ? 'Annual Family Pass (365 Days)' 
      : 'Lifetime Family Pass';

    let targetParent: UserAccount | null = activeParent;

    // Validate manually entered usernames before creating any student accounts.
    const existingUsernames = new Set(
      allUsers.map(u => (u.username || '').trim().toUpperCase()).filter(Boolean)
    );
    const submittedUsernames = new Set<string>();
    for (const child of validChildren) {
      if (!child.username.trim()) continue;
      const normalized = child.username.trim().toUpperCase();
      if (existingUsernames.has(normalized) || submittedUsernames.has(normalized)) {
        alert(`Student username ${normalized} is already in use. Please choose another username.`);
        return;
      }
      submittedUsernames.add(normalized);
    }
    // Reserve all manually entered usernames so auto-generated usernames in the same batch
    // cannot collide with them.
    submittedUsernames.forEach(username => existingUsernames.add(username));

    // If in new parent mode, create and register the parent account
    if (parentMode === 'new') {
      const newParentId = getNextRoleId('parent', allUsers);
      const newParentUser: UserAccount = {
        id: newParentId,
        role: 'parent',
        name: newParentName.trim(),
        email: newParentEmail.trim() || `${newParentName.toLowerCase().replace(/\s+/g, '.')}@family.net`,
        avatar: newParentAvatar || '👨‍👧‍👦',
        studentIds: [],
        enrolledAt: new Date().toISOString().slice(0, 10),
        status: 'active',
        validityDuration: validityDuration,
        validUntil: expiresOn,
        planName: planTitle
      };
      targetParent = newParentUser;

      if (onAddUser) {
        onAddUser(targetParent);
      }
    }

    if (!targetParent) return;

    sounds.success();

    // If no child accounts are being added at this time, close after creating the parent
    if (validChildren.length === 0) {
      onClose();
      return;
    }

    // Allocate permanent global IDs and usernames sequentially across the whole batch.
    const createdUsersForSequence: UserAccount[] = [...allUsers];
    if (parentMode === 'new' && targetParent) {
      createdUsersForSequence.push(targetParent);
    }
    const finalUsernames: string[] = [];
    for (const child of validChildren) {
      const candidateUser = child.username.trim()
        ? ensureUniqueUsername(child.username.trim(), createdUsersForSequence)
        : generateStudentUsername(child.name.trim(), createdUsersForSequence, undefined, false, targetParent.name);

      const finalUsername = ensureUniqueUsername(candidateUser, createdUsersForSequence);
      existingUsernames.add(finalUsername);
      finalUsernames.push(finalUsername);
      createdUsersForSequence.push({
        id: `TEMP-${finalUsernames.length}`,
        role: 'student',
        name: child.name.trim(),
        username: finalUsername,
        avatar: child.avatar,
        enrolledAt: new Date().toISOString().slice(0, 10),
        status: 'active'
      });
    }

    const createdUsersForIds: UserAccount[] = [...allUsers];
    if (parentMode === 'new' && targetParent) {
      createdUsersForIds.push(targetParent);
    }
    const createdList: { student: UserAccount; progress: StudentProgress }[] = validChildren.map((c, idx) => {
      // Student IDs are permanent global person IDs: STU00001, STU00002, ...
      const studentId = getNextRoleId('student', createdUsersForIds);
      const finalUsername = finalUsernames[idx];

      const studentObj: UserAccount = {
        id: studentId,
        role: 'student',
        name: c.name.trim(),
        username: finalUsername,
        pin: c.pin.trim() || '1234',
        avatar: c.avatar,
        parentId: targetParent!.id,
        parentName: targetParent!.name,
        grade: c.grade,
        enrolledAt: new Date().toISOString().slice(0, 10),
        status: 'active',
        validUntil: expiresOn,
        validityDuration: validityDuration,
        planName: planTitle
      };

      const progressObj: StudentProgress = {
        studentId: studentObj.id,
        studentUsername: studentObj.username!,
        studentName: studentObj.name,
        avatar: studentObj.avatar,
        grade: studentObj.grade as any,
        schoolOrParent: 'parent',
        parentId: targetParent!.id,
        parentName: targetParent!.name,
        level: 1,
        xp: 100,
        coins: 25,
        streakDays: 1,
        dailyQuizCompletedToday: false,
        totalQuizzesTaken: 0,
        averageScore: 100,
        subjectMastery: {
          'Mathematics': 80
        },
        recentActivities: [],
        badges: [
          {
            id: 'B_FAMILY',
            name: 'Family Adventurer',
            icon: '👨‍👧‍👦',
            description: `Joined parent ${targetParent!.name}'s learning circle!`,
            unlockedAt: new Date().toISOString().slice(0, 10)
          }
        ]
      };

      createdUsersForIds.push(studentObj);
      return { student: studentObj, progress: progressObj };
    });

    onAddStudentsToParent(targetParent.id, createdList);
    onClose();
  };

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center bg-stone-900/60 backdrop-blur-sm p-4 overflow-y-auto">
      <div className="bg-white rounded-3xl shadow-2xl border border-stone-200 max-w-2xl w-full my-8 overflow-hidden flex flex-col max-h-[90vh]">
        {/* Modal Header */}
        <div className="bg-stone-900 text-white p-5 flex items-center justify-between">
          <div className="flex items-center gap-3">
            <div className="w-10 h-10 rounded-xl bg-emerald-500/20 text-emerald-400 flex items-center justify-center font-bold text-lg border border-emerald-500/30">
              <Heart className="w-5 h-5 text-emerald-400" />
            </div>
            <div>
              <h2 className="text-base sm:text-lg font-bold">
                Individual Account Provisioning
              </h2>
              <p className="text-xs text-stone-300">
                {parentMode === 'existing' && activeParent ? (
                  <>Parent: <span className="text-amber-400 font-semibold">{activeParent.name}</span> ({activeParent.id})</>
                ) : (
                  'Register Parent & Multiple Children Accounts with Defined Validity'
                )}
              </p>
            </div>
          </div>
          <button
            onClick={onClose}
            className="p-1.5 rounded-lg text-stone-400 hover:text-white hover:bg-stone-800 transition cursor-pointer"
          >
            <X className="w-5 h-5" />
          </button>
        </div>

        {/* Parent Selector / Creator Tabs */}
        {!parent && (
          <div className="px-6 py-3 bg-stone-100 border-b border-stone-200 flex flex-col sm:flex-row sm:items-center justify-between gap-3 text-xs">
            <div className="flex items-center gap-2">
              <span className="font-bold text-stone-700">Individual Mode:</span>
              <button
                type="button"
                onClick={() => setParentMode('new')}
                className={`px-3 py-1.5 rounded-xl font-bold transition cursor-pointer flex items-center gap-1.5 ${
                  parentMode === 'new'
                    ? 'bg-emerald-600 text-white shadow-xs'
                    : 'text-stone-600 hover:text-stone-900 bg-white border border-stone-200'
                }`}
              >
                <UserPlus className="w-3.5 h-3.5" />
                <span>+ Register New Parent</span>
              </button>
              <button
                type="button"
                onClick={() => setParentMode('existing')}
                disabled={allParents.length === 0}
                className={`px-3 py-1.5 rounded-xl font-bold transition cursor-pointer flex items-center gap-1.5 ${
                  parentMode === 'existing'
                    ? 'bg-emerald-600 text-white shadow-xs'
                    : 'text-stone-600 hover:text-stone-900 bg-white border border-stone-200'
                }`}
              >
                <Users className="w-3.5 h-3.5" />
                <span>Add Children to Existing Parent ({allParents.length})</span>
              </button>
            </div>

            {parentMode === 'existing' && allParents.length > 0 && (
              <select
                value={selectedParentId}
                onChange={(e) => setSelectedParentId(e.target.value)}
                className="px-3 py-1.5 rounded-lg border border-stone-300 bg-white font-semibold text-stone-800 focus:ring-2 focus:ring-emerald-500"
              >
                {allParents.map((p) => (
                  <option key={p.id} value={p.id}>
                    {p.name} ({p.email || p.id}) - {p.studentIds?.length || 0} enrolled
                  </option>
                ))}
              </select>
            )}
          </div>
        )}

        {/* Form Body */}
        <form onSubmit={handleSubmit} className="p-6 overflow-y-auto space-y-5 flex-1 text-stone-800 text-xs">
          {/* New Parent Details if in 'new' mode */}
          {parentMode === 'new' && (
            <div className="p-4 rounded-2xl bg-emerald-50/60 border border-emerald-200 space-y-3">
              <div className="flex items-center justify-between font-bold text-emerald-950 text-xs">
                <span className="flex items-center gap-2">
                  <User className="w-4 h-4 text-emerald-600" />
                  <span>Step 1: Parent Account Profile</span>
                </span>
                <span className="px-2 py-0.5 rounded-full bg-emerald-100 text-emerald-800 font-mono text-[10px]">
                  Role: Parent (ID: {getNextRoleId('parent', allUsers)})
                </span>
              </div>
              <div className="grid grid-cols-1 sm:grid-cols-3 gap-3">
                <div>
                  <label className="block font-semibold mb-1 text-stone-700">Parent Full Name *</label>
                  <input
                    type="text"
                    required
                    placeholder="e.g. Sarah Jenkins"
                    value={newParentName}
                    onChange={(e) => setNewParentName(e.target.value)}
                    className="w-full px-3 py-2 rounded-xl border border-stone-300 bg-white focus:ring-2 focus:ring-emerald-500 font-medium"
                  />
                </div>
                <div>
                  <label className="block font-semibold mb-1 text-stone-700">Parent Email *</label>
                  <input
                    type="email"
                    required
                    placeholder="sarah.jenkins@family.net"
                    value={newParentEmail}
                    onChange={(e) => setNewParentEmail(e.target.value)}
                    className="w-full px-3 py-2 rounded-xl border border-stone-300 bg-white focus:ring-2 focus:ring-emerald-500 font-medium"
                  />
                </div>
                <div>
                  <label className="block font-semibold mb-1 text-stone-700">Avatar Icon</label>
                  <select
                    value={newParentAvatar}
                    onChange={(e) => setNewParentAvatar(e.target.value)}
                    className="w-full px-3 py-2 rounded-xl border border-stone-300 bg-white font-medium"
                  >
                    <option value="👨‍👧‍👦">👨‍👧‍👦 Family (Dad)</option>
                    <option value="👩‍👧‍👦">👩‍👧‍👦 Family (Mom)</option>
                    <option value="🧑‍👧‍👦">🧑‍👧‍👦 Family (Guardian)</option>
                    <option value="🌟">🌟 Star Family</option>
                  </select>
                </div>
              </div>
            </div>
          )}

          {/* Account Validity Definition */}
          <div className="p-4 rounded-2xl bg-stone-50 border border-stone-200 space-y-2">
            <div className="flex items-center justify-between">
              <label className="font-bold text-stone-800 flex items-center gap-1.5">
                <Clock className="w-4 h-4 text-amber-500" />
                <span>Account Validity & License Duration</span>
              </label>
              <span className="text-[11px] font-mono text-stone-500">
                Expires: <strong>{getExpirationDate(validityDuration)}</strong>
              </span>
            </div>
            <p className="text-[11px] text-stone-500 leading-normal">
              Defines how long the parent subscription and linked student learning accounts remain valid and active on the platform.
            </p>
            <div className="grid grid-cols-2 sm:grid-cols-4 gap-2 pt-1">
              {[
                { id: '30_days', label: '1 Month (30 Days)', tag: 'Monthly' },
                { id: '90_days', label: '3 Months (90 Days)', tag: 'Quarterly' },
                { id: '365_days', label: '1 Year (365 Days)', tag: 'Annual Pass' },
                { id: 'lifetime', label: 'Lifetime Access', tag: 'Permanent' }
              ].map((v) => (
                <button
                  key={v.id}
                  type="button"
                  onClick={() => setValidityDuration(v.id as any)}
                  className={`p-2.5 rounded-xl border text-left transition cursor-pointer ${
                    validityDuration === v.id
                      ? 'border-emerald-600 bg-emerald-50/80 text-emerald-950 font-bold shadow-xs'
                      : 'border-stone-200 bg-white text-stone-600 hover:border-stone-300'
                  }`}
                >
                  <span className="block text-[11px] font-bold">{v.tag}</span>
                  <span className="text-[10px] text-stone-500 block">{v.label}</span>
                </button>
              ))}
            </div>
          </div>

          {/* Children Roster Builder */}
          <div className="space-y-3">
            <div className="flex items-center justify-between">
              <div>
                <span className="font-bold text-stone-800 block text-xs">
                  {parentMode === 'new' ? 'Step 2: Add Children Accounts (Optional)' : 'Student Child Accounts'}
                </span>
                <span className="text-[11px] text-stone-500">
                  {parentMode === 'new' 
                    ? 'You can add child accounts right now or provision the parent first and add children later.' 
                    : 'Provision 1, 2, 3, or multiple children with username + 4-digit PIN authentication'}
                </span>
              </div>
              <button
                type="button"
                onClick={handleAddChildRow}
                className="px-3 py-1.5 text-xs font-bold rounded-xl bg-stone-900 text-white hover:bg-stone-800 transition flex items-center gap-1.5 shrink-0 cursor-pointer shadow-xs"
              >
                <Plus className="w-3.5 h-3.5" />
                <span>+ Add Child</span>
              </button>
            </div>

            {children.length === 0 ? (
              <div className="p-4 rounded-2xl bg-stone-50 border border-dashed border-stone-300 text-center text-stone-500 text-xs space-y-1">
                <p className="font-bold text-stone-700">No child accounts added.</p>
                <p className="text-[11px] text-stone-400">Clicking the button below will create the Parent account ready for children to be added at any time.</p>
              </div>
            ) : (
              children.map((child, index) => (
                <div
                  key={child.tempId}
                  className="p-4 rounded-2xl bg-white border border-stone-200 shadow-xs space-y-3 relative"
                >
                  <div className="flex items-center justify-between border-b border-stone-100 pb-2">
                    <span className="text-xs font-bold text-stone-800 flex items-center gap-2">
                      <span className="w-5 h-5 rounded-full bg-emerald-100 text-emerald-800 flex items-center justify-center text-[10px] font-bold">
                        {index + 1}
                      </span>
                      Child {index + 1} Profile & Authentication
                    </span>
                    <button
                      type="button"
                      onClick={() => handleRemoveChildRow(child.tempId)}
                      className="text-stone-400 hover:text-rose-600 p-1 transition cursor-pointer"
                      title="Remove child"
                    >
                      <Trash2 className="w-3.5 h-3.5" />
                    </button>
                  </div>

                  <div className="grid grid-cols-1 sm:grid-cols-2 gap-3 text-xs">
                    <div>
                      <label className="block font-semibold mb-1 text-stone-700">Child's Full Name {parentMode === 'existing' ? '*' : ''}</label>
                      <input
                        type="text"
                        placeholder="e.g. Larry Smith"
                        value={child.name}
                        onChange={(e) => {
                          const val = e.target.value;
                          handleUpdateChild(child.tempId, 'name', val);
                          if (val.trim()) {
                            const otherChildUsernames = children
                              .filter(c => c.tempId !== child.tempId && c.username)
                              .map(c => ({ username: c.username }));
                            const autoUser = generateStudentUsername(
                              val,
                              [...(allUsers || []), ...otherChildUsernames],
                              undefined,
                              false,
                              activeParent?.name || newParentName || 'Watson'
                            );
                            handleUpdateChild(child.tempId, 'username', autoUser);
                          }
                        }}
                        className="w-full px-3 py-2 rounded-xl border border-stone-200 focus:outline-none focus:ring-2 focus:ring-emerald-500 bg-stone-50/50 font-medium"
                      />
                    </div>

                    <div>
                      <label className="block font-semibold mb-1 text-stone-700">Grade Level</label>
                      <select
                        value={child.grade}
                        onChange={(e) => handleUpdateChild(child.tempId, 'grade', e.target.value as GradeLevel)}
                        className="w-full px-3 py-2 rounded-xl border border-stone-200 focus:outline-none focus:ring-2 focus:ring-emerald-500 bg-white font-bold"
                      >
                        {(availableGrades || ['Grade 1', 'Grade 2', 'Grade 3', 'Grade 4', 'Grade 5']).map((g) => (
                          <option key={g} value={g}>
                            {g}
                          </option>
                        ))}
                      </select>
                    </div>

                    <div>
                      <label className="block font-semibold mb-1 text-stone-700 flex items-center justify-between">
                        <span>Login Username</span>
                        <span className="text-[10px] text-amber-700 font-bold flex items-center gap-0.5">
                          <Lock className="w-2.5 h-2.5" /> Immutable
                        </span>
                      </label>
                      <div className="relative">
                        <input
                          type="text"
                          readOnly
                          value={
                            child.username ||
                            (child.name.trim()
                              ? generateStudentUsername(
                                  child.name,
                                  [
                                    ...(allUsers || []),
                                    ...children
                                      .filter(c => c.tempId !== child.tempId && c.username)
                                      .map(c => ({ username: c.username }))
                                  ],
                                  undefined,
                                  false,
                                  activeParent?.name || newParentName
                                )
                              : 'Auto-generated (e.g. LARSMI1)')
                          }
                          title="Auto-generated: First 3 letters + Last 3 letters + number (e.g. AARGAR1, AARGAR2)"
                          className="w-full px-3 py-2 rounded-xl border border-amber-200 font-mono font-bold text-amber-900 bg-amber-50/60 cursor-not-allowed select-all"
                        />
                        <Lock className="w-3.5 h-3.5 text-amber-600 absolute right-3 top-2.5" />
                      </div>
                      <span className="text-[9px] text-stone-400 mt-0.5 block">
                        Auto-generated incremental sequence (e.g. AARGAR1, AARGAR2)
                      </span>
                    </div>

                    <div className="flex gap-2">
                      <div className="flex-1">
                        <label className="block font-semibold mb-1 text-stone-700">
                          4-Digit PIN <span className="text-[10px] text-stone-400">(kid password)</span>
                        </label>
                        <input
                          type="text"
                          maxLength={4}
                          value={child.pin}
                          onChange={(e) => handleUpdateChild(child.tempId, 'pin', e.target.value.replace(/\D/g, ''))}
                          className="w-full px-3 py-2 rounded-xl border border-stone-200 font-mono font-bold text-center tracking-widest bg-white"
                        />
                      </div>
                      <div>
                        <label className="block font-semibold mb-1 text-stone-700">Avatar</label>
                        <select
                          value={child.avatar}
                          onChange={(e) => handleUpdateChild(child.tempId, 'avatar', e.target.value)}
                          className="w-14 px-2 py-2 rounded-xl border border-stone-200 text-center text-base bg-white"
                        >
                          {AVATARS.map((av) => (
                            <option key={av} value={av}>
                              {av}
                            </option>
                          ))}
                        </select>
                      </div>
                    </div>
                  </div>
                </div>
              ))
            )}
          </div>

          <div className="p-3.5 rounded-2xl bg-emerald-50/70 border border-emerald-200 text-xs text-emerald-950 flex items-center gap-2.5">
            <CheckCircle2 className="w-4 h-4 text-emerald-600 shrink-0" />
            <span>
              {parentMode === 'new' ? (
                <>Creating Parent profile <strong className="font-bold">{newParentName || 'New Parent'}</strong> with <strong className="font-bold">{validityDuration.replace('_', ' ')}</strong> validity{children.filter(c => c.name.trim()).length > 0 ? ` and linking ${children.filter(c => c.name.trim()).length} student child accounts.` : '.'}</>
              ) : (
                <>Linking {children.filter(c => c.name.trim()).length} student child accounts to parent <strong className="font-bold">{activeParent?.name || 'Parent'}</strong>.</>
              )}
            </span>
          </div>

          <div className="flex items-center justify-end gap-3 pt-2">
            <button
              type="button"
              onClick={onClose}
              className="px-4 py-2 rounded-xl text-xs font-semibold text-stone-600 hover:bg-stone-100 transition cursor-pointer"
            >
              Cancel
            </button>
            <button
              type="submit"
              className="px-5 py-2.5 rounded-xl text-xs font-bold bg-emerald-600 hover:bg-emerald-700 text-white shadow-sm transition flex items-center gap-2 cursor-pointer"
            >
              <UserPlus className="w-4 h-4" />
              <span>
                {parentMode === 'new'
                  ? (children.filter(c => c.name.trim()).length > 0
                      ? `Provision Parent & ${children.filter(c => c.name.trim()).length} Child Account(s)`
                      : `Provision Parent Account (${newParentName.trim() || 'New Parent'})`)
                  : `Add ${children.filter(c => c.name.trim()).length || children.length} Child Account(s) to Parent`}
              </span>
            </button>
          </div>
        </form>
      </div>
    </div>
  );
}
