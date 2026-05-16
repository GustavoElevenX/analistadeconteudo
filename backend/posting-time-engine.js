import { config, tomorrowISO } from './config.js';

export const ICP_PROFILES = {
  b2b_decision_makers: {
    id: 'b2b_decision_makers',
    label: 'B2B Decision Makers',
    target: ['Business owners', 'Sales managers', 'Directors with teams (3+ people)'],
    behavior: ['Limited time', 'High cognitive load', 'Consumes content in gaps during the day']
  }
};

export const ATTENTION_WINDOWS = [
  { id: 'early_morning', label: 'Early Morning', range: '06:30-08:30', intent: 'awareness_mindset' },
  { id: 'morning_work_block', label: 'Morning Work Block', range: '09:30-11:00', intent: 'practical_problem_solving' },
  { id: 'midday_break', label: 'Midday Break', range: '12:00-13:30', intent: 'light_consumption' },
  { id: 'afternoon_gap', label: 'Afternoon Gap', range: '15:00-16:30', intent: 'quick_insights' },
  { id: 'evening_peak', label: 'Evening Peak', range: '18:00-21:00', intent: 'deep_authority_conversion' }
];

const BASE_SCHEDULES = {
  3: [
    { time: '07:30', type: 'insight', window: 'early_morning' },
    { time: '12:30', type: 'light', window: 'midday_break' },
    { time: '19:00', type: 'authority', window: 'evening_peak' }
  ],
  4: [
    { time: '07:30', type: 'insight', window: 'early_morning' },
    { time: '10:30', type: 'diagnostic', window: 'morning_work_block' },
    { time: '13:00', type: 'light', window: 'midday_break' },
    { time: '19:30', type: 'authority', window: 'evening_peak' }
  ],
  5: [
    { time: '07:30', type: 'insight', window: 'early_morning' },
    { time: '09:45', type: 'diagnostic', window: 'morning_work_block' },
    { time: '12:30', type: 'light', window: 'midday_break' },
    { time: '15:30', type: 'quick_value', window: 'afternoon_gap' },
    { time: '19:30', type: 'authority', window: 'evening_peak' }
  ]
};

export function generatePostingSchedule({
  icpType = 'b2b_decision_makers',
  postsPerDay = config.defaultPostsPerDay,
  date = tomorrowISO(),
  patterns = null
} = {}) {
  const normalizedPostsPerDay = normalizePostsPerDay(postsPerDay);
  const profile = ICP_PROFILES[icpType] || ICP_PROFILES.b2b_decision_makers;
  const learnedHours = normalizeLearnedHours(patterns?.best_posting_hours);
  const baseSlots = BASE_SCHEDULES[normalizedPostsPerDay];
  const schedule = baseSlots.map(slot => applyAdaptiveTime(slot, learnedHours));

  return {
    date,
    icp: profile.id,
    icp_label: profile.label,
    posts_per_day: normalizedPostsPerDay,
    adaptive: {
      enabled: learnedHours.length > 0,
      learned_hours: learnedHours.map(item => item.time),
      rule: 'Use proven engagement hours only when they stay inside the same ICP attention window.'
    },
    attention_windows: ATTENTION_WINDOWS,
    schedule
  };
}

function normalizePostsPerDay(value) {
  const number = Number(value || 5);
  if (![3, 4, 5].includes(number)) return 5;
  return number;
}

function normalizeLearnedHours(value) {
  if (!Array.isArray(value)) return [];
  return value
    .map(item => typeof item === 'string' ? { time: item, score: 1 } : item)
    .filter(item => isTime(item?.time))
    .sort((a, b) => Number(b.score || 0) - Number(a.score || 0));
}

function applyAdaptiveTime(slot, learnedHours) {
  const learned = learnedHours.find(item => isWithinWindow(item.time, slot.window));
  if (!learned) return { ...slot, adaptive_source: 'base_model' };
  return { ...slot, time: learned.time, adaptive_source: 'performance_history' };
}

function isWithinWindow(time, windowId) {
  const window = ATTENTION_WINDOWS.find(item => item.id === windowId);
  if (!window) return false;
  const [start, end] = window.range.split('-');
  const valueMinutes = toMinutes(time);
  return valueMinutes >= toMinutes(start) && valueMinutes <= toMinutes(end);
}

function isTime(value) {
  return /^([01]\d|2[0-3]):[0-5]\d$/.test(String(value || ''));
}

function toMinutes(time) {
  const [hours, minutes] = String(time).split(':').map(Number);
  return (hours * 60) + minutes;
}
