import { Activity, ActivityFormat, ActivityGameTask, ActivityStep, Question } from '../../types';

export interface FeedCharacter {
  name: string;
  animal: string;
  idleEmoji: string;
  eatingEmoji: string;
  happyEmoji: string;
  wrongEmoji: string;
  foodEmoji: string;
  foodName: string;
  themeColor: string;
}

export const FEED_CHARACTERS: FeedCharacter[] = [
  {
    name: 'Barnaby Monkey',
    animal: 'Monkey',
    idleEmoji: '🐒',
    eatingEmoji: '🐒🍌',
    happyEmoji: '🐒😋',
    wrongEmoji: '🙈',
    foodEmoji: '🍌',
    foodName: 'banana',
    themeColor: 'amber'
  },
  {
    name: 'Bella Bunny',
    animal: 'Bunny',
    idleEmoji: '🐰',
    eatingEmoji: '🐰🥕',
    happyEmoji: '🐰✨',
    wrongEmoji: '🙈',
    foodEmoji: '🥕',
    foodName: 'carrot',
    themeColor: 'orange'
  },
  {
    name: 'Bruno Bear',
    animal: 'Bear',
    idleEmoji: '🐻',
    eatingEmoji: '🐻🍯',
    happyEmoji: '🐻🎉',
    wrongEmoji: '🐻💫',
    foodEmoji: '🍯',
    foodName: 'honey pot',
    themeColor: 'yellow'
  },
  {
    name: 'Pip the Puppy',
    animal: 'Puppy',
    idleEmoji: '🐶',
    eatingEmoji: '🐶🦴',
    happyEmoji: '🐶💖',
    wrongEmoji: '🐶🐾',
    foodEmoji: '🦴',
    foodName: 'biscuit bone',
    themeColor: 'emerald'
  },
  {
    name: 'Pippa Penguin',
    animal: 'Penguin',
    idleEmoji: '🐧',
    eatingEmoji: '🐧🐟',
    happyEmoji: '🐧❄️',
    wrongEmoji: '🐧💨',
    foodEmoji: '🐟',
    foodName: 'tasty fish',
    themeColor: 'sky'
  }
];

/**
 * Intelligent game mechanic detector based on question characteristics
 */
export function detectQuestionGameMechanic(q: Question, preferred?: ActivityFormat, index: number = 0): ActivityFormat {
  if (preferred && preferred !== 'question_run') {
    return preferred;
  }

  // Explicit type detection
  if (q.type === 'match_making' || (q.matchPairs && q.matchPairs.length > 0)) {
    return 'matching';
  }
  if (q.type === 'sorting' || q.type === 'drag_and_drop' || (q.dragItems && q.dragItems.length > 0)) {
    return 'sorting';
  }
  if (q.type === 'ordering' || q.skill?.toLowerCase().includes('order') || q.prompt.toLowerCase().includes('order')) {
    return 'ordering';
  }

  // Preschool & Foundation items: joyful feeding or balloon pop games
  const isPreschoolOrFoundation = q.grade === 'Preschool' || q.grade === 'Foundation';
  if (isPreschoolOrFoundation) {
    if (index % 2 === 1 || q.prompt.toLowerCase().includes('pop') || q.prompt.toLowerCase().includes('balloon')) {
      return 'balloon_pop';
    }
    return 'feeding_game';
  }

  // If question has visual clipart with food items
  if (q.visualClipart && /🍎|🍌|🍓|🍇|🍊|🥕|🍪|🍰|🍉|🥪/.test(q.visualClipart)) {
    return 'feeding_game';
  }

  // Real Arcade Game mechanics for Grade 1 through High School
  // Alternate between Balloon Pop carnival and Space Asteroid Blaster!
  return index % 2 === 0 ? 'balloon_pop' : 'space_blaster';
}

/**
 * Transforms a Master Question Bank question into a rich interactive ActivityGameTask
 */
export function questionToGameTask(q: Question, preferredMechanic?: ActivityFormat, index: number = 0): ActivityGameTask {
  const mechanic = detectQuestionGameMechanic(q, preferredMechanic, index);
  const char = FEED_CHARACTERS[index % FEED_CHARACTERS.length];

  const baseTask: ActivityGameTask = {
    id: `TASK_${q.id}_${index}`,
    questionId: q.id,
    mechanic,
    rewardPoints: q.points || 20,
    title: q.skill || 'Mastery Challenge',
    instruction: 'Complete the challenge!'
  };

  switch (mechanic) {
    case 'balloon_pop': {
      return {
        ...baseTask,
        title: `🎈 Balloon Pop Carnival`,
        instruction: q.prompt || 'Pop the balloon with the correct answer!',
        items: q.options.map((opt, optIdx) => ({
          id: `balloon_${optIdx}`,
          label: opt,
          emoji: ['🎈', '🎈', '🎈', '🎈'][optIdx % 4],
          target: String(optIdx)
        }))
      };
    }

    case 'space_blaster': {
      return {
        ...baseTask,
        title: `🚀 Space Crystal Blaster`,
        instruction: q.prompt || 'Target and blast the correct asteroid crystal!',
        items: q.options.map((opt, optIdx) => ({
          id: `crystal_${optIdx}`,
          label: opt,
          emoji: ['☄️', '💎', '🪐', '⭐'][optIdx % 4],
          target: String(optIdx)
        }))
      };
    }

    case 'feeding_game': {
      return {
        ...baseTask,
        title: `Feed ${char.name}!`,
        instruction: `Solve the challenge! Pick the correct ${char.foodName}, then tap Feed ${char.animal}!`,
        items: q.options.map((opt, optIdx) => ({
          id: `opt_${optIdx}`,
          label: opt,
          emoji: char.foodEmoji
        }))
      };
    }

    case 'sorting': {
      if (q.dragItems && q.dragItems.length > 0) {
        const uniqueTargets = Array.from(new Set(q.dragItems.map(d => d.target)));
        return {
          ...baseTask,
          title: `Sort into the Right Baskets!`,
          instruction: q.prompt || 'Drag each item into its matching basket.',
          items: q.dragItems.map((d, i) => ({
            id: `item_${i}`,
            label: d.item,
            target: `target_${uniqueTargets.indexOf(d.target)}`,
            emoji: '📦'
          })),
          targets: uniqueTargets.map((t, i) => ({
            id: `target_${i}`,
            label: t,
            emoji: '🧺'
          }))
        };
      }

      // Generate sorting task from options
      const correctText = q.options[q.correctIndex] || 'Correct';
      const distractors = q.options.filter((_, i) => i !== q.correctIndex);
      return {
        ...baseTask,
        title: `Sort the Objects`,
        instruction: q.prompt || 'Find the item that answers the challenge.',
        items: [
          { id: 'item_correct', label: correctText, target: 'target_yes', emoji: '⭐' },
          ...distractors.map((d, i) => ({ id: `item_dist_${i}`, label: d, target: 'target_no', emoji: '🔹' }))
        ],
        targets: [
          { id: 'target_yes', label: 'Correct Answer', emoji: '🎯' },
          { id: 'target_no', label: 'Other Choices', emoji: '🧺' }
        ]
      };
    }

    case 'matching': {
      if (q.matchPairs && q.matchPairs.length > 0) {
        return {
          ...baseTask,
          title: `Match the Pairs!`,
          instruction: q.prompt || 'Match each item to its correct partner.',
          items: q.matchPairs.map((p, i) => ({
            id: `pair_item_${i}`,
            label: p.left,
            target: `target_${i}`,
            emoji: '🧩'
          })),
          targets: q.matchPairs.map((p, i) => ({
            id: `target_${i}`,
            label: p.right,
            emoji: '✨'
          }))
        };
      }

      return {
        ...baseTask,
        title: `Match the Answer!`,
        instruction: q.prompt || 'Select the matching answer.',
        items: [
          { id: 'm_prompt', label: q.prompt.slice(0, 30), target: 'm_correct', emoji: '❓' }
        ],
        targets: q.options.map((opt, i) => ({
          id: i === q.correctIndex ? 'm_correct' : `m_wrong_${i}`,
          label: opt,
          emoji: '🎯'
        }))
      };
    }

    case 'ordering': {
      return {
        ...baseTask,
        title: `Put Them in Order!`,
        instruction: q.prompt || 'Tap the items in the correct sequence.',
        items: q.options.map((opt, i) => ({
          id: `order_${i}`,
          label: opt,
          emoji: ['1️⃣', '2️⃣', '3️⃣', '4️⃣'][i] || '🔢'
        })),
        correctOrder: q.options.map((_, i) => `order_${i}`)
      };
    }

    case 'arcade': {
      return {
        ...baseTask,
        title: `Arcade Challenge!`,
        instruction: q.prompt || 'Collect the correct items to solve the puzzle!',
        targetCount: 5,
        items: Array.from({ length: 5 }, (_, i) => ({
          id: `star_${i}`,
          label: q.options[q.correctIndex] || 'Star',
          emoji: '⭐'
        }))
      };
    }

    case 'quiz_game':
    default: {
      return {
        ...baseTask,
        mechanic: 'quiz_game',
        title: `Quiz Quest: ${q.skill || 'Challenge'}`,
        instruction: 'Choose the correct answer to score points and earn stars!'
      };
    }
  }
}

/**
 * Converts any Activity or list of Question Bank IDs into fully playable interactive game steps
 */
export function convertActivityToInteractiveSteps(
  activity: Activity | null,
  allQuestions: Question[],
  forcedMechanic?: ActivityFormat
): ActivityStep[] {
  if (!activity) return [];

  // If activity already has customized game tasks with steps, respect them unless user forced a mechanic
  if (activity.steps && activity.steps.length > 0 && !forcedMechanic) {
    return activity.steps.map((step, idx) => {
      if (step.type === 'game_task' && step.gameTask) {
        return step;
      }
      // If it's a raw question step, wrap it into an interactive game task
      const question = step.questionId ? allQuestions.find(q => q.id === step.questionId) : undefined;
      if (question) {
        return {
          id: step.id || `STEP_${idx}`,
          type: 'game_task',
          questionId: question.id,
          gameTask: questionToGameTask(question, activity.format, idx)
        };
      }
      return step;
    });
  }

  // Otherwise, automatically transform all linked question IDs from the Master Question Bank into game steps!
  const targetIds = activity.questionIds || [];
  const matchedQuestions = targetIds
    .map(id => allQuestions.find(q => q.id === id))
    .filter((q): q is Question => Boolean(q));

  if (matchedQuestions.length === 0) {
    return [];
  }

  return matchedQuestions.map((q, idx) => ({
    id: `STEP_${activity.id}_${q.id}_${idx}`,
    type: 'game_task',
    questionId: q.id,
    gameTask: questionToGameTask(q, forcedMechanic || activity.format, idx)
  }));
}
