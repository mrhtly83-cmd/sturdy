// supabase/functions/_shared/triggerClassifier.ts
// Detects trigger category from parent's message
// Silent — never appears in output
// Returns null if no clear category detected


export type TriggerCategory =
  | 'homework'
  | 'bedtime'
  | 'screen_time'
  | 'leaving_places'
  | 'mealtime'
  | 'morning_routine'
  | 'sharing'
  | 'sibling'
  | 'separation'
  | 'public_meltdown'
  | 'getting_dressed'
  | 'bath_time'
  | 'sport_activity'
  | 'social_conflict'
  | null;


const TRIGGER_PATTERNS: Record<Exclude<TriggerCategory, null>, string[]> = {
  homework: [
    'homework', 'school work', 'schoolwork', 'assignment', 'reading',
    'studying', 'study', 'maths', 'math', 'spelling', 'project',
    'revision', 'practice', 'worksheet',
  ],
  bedtime: [
    'bedtime', 'bed time', 'sleep', 'sleeping', 'going to bed', 'nap',
    'nap time', 'naptime', 'night time', 'nighttime', "won't sleep",
    'wont sleep', 'not sleeping', 'stay up', 'staying up', 'up late',
  ],
  screen_time: [
    'screen time', 'screentime', 'tablet', 'ipad', 'phone', 'tv',
    'television', 'video game', 'videogame', 'gaming', 'minecraft',
    'fortnite', 'roblox', 'youtube', 'watching', 'computer',
    'turn off', 'turn it off', 'put it down', 'device',
  ],
  leaving_places: [
    'leaving', 'leave the', 'leave this', 'time to go', 'have to go',
    'going home', 'park', 'playground', 'friend\'s house', "friend's",
    'party', 'shop', 'store', 'supermarket', 'mall', 'pool',
    'beach', 'holiday', 'vacation', 'transition',
  ],
  mealtime: [
    'eating', 'dinner', 'lunch', 'breakfast', 'food', 'meal',
    'won\'t eat', 'wont eat', 'refuses to eat', 'table', 'sit down',
    'vegetables', 'veggies', 'picky', 'fussy eater', 'fussy about food',
  ],
  morning_routine: [
    'morning', 'school run', 'getting ready', 'getting dressed',
    'brush teeth', 'brushing teeth', 'late for school', 'school time',
    'rushing', 'won\'t get up', 'wont get up', 'wake up', 'waking up',
  ],
  sharing: [
    'sharing', 'share', 'taking turns', 'turn', 'grabbing', 'snatching',
    'mine', 'won\'t share', 'wont share', 'toy', 'toys',
  ],
  sibling: [
    'sibling', 'sister', 'brother', 'siblings', 'hitting sibling',
    'fighting with', 'hurting', 'biting', 'arguing with',
    'fighting over', 'teasing', 'bullying',
  ],
  separation: [
    'separation', 'drop off', 'dropoff', 'leaving me', 'leaving them',
    'daycare', 'day care', 'nursery', 'preschool', 'school drop',
    'clingy', 'won\'t let go', 'wont let go', 'crying when i leave',
    'separation anxiety',
  ],
  public_meltdown: [
    'public', 'supermarket', 'shop', 'store', 'restaurant', 'cafe',
    'people watching', 'embarrassing', 'embarrassed', 'scene',
    'screaming in', 'tantrum in', 'meltdown in', 'on the floor',
    'lying on the floor', 'people staring',
  ],
  getting_dressed: [
    'getting dressed', 'clothes', 'uniform', 'shoes', 'socks',
    'won\'t get dressed', 'wont get dressed', 'refuses to wear',
    'shirt', 'jacket', 'coat', 'changing',
  ],
  bath_time: [
    'bath', 'shower', 'washing', 'wash', 'hair wash', 'hair washing',
    'won\'t have a bath', 'wont have a bath', 'refuses bath',
  ],
  sport_activity: [
    'sport', 'football', 'soccer', 'swimming', 'lesson', 'class',
    'activity', 'after school', 'club', 'training', 'practice',
    'won\'t go', 'wont go', 'refuses to go',
  ],
  social_conflict: [
    'friend', 'friends', 'falling out', 'argument with friend',
    'excluded', 'left out', 'bullied', 'bullying', 'not invited',
    'fight with friend', 'social',
  ],
};


export function classifyTrigger(message: string): TriggerCategory {
  const lower = message.toLowerCase();


  // Score each category
  const scores: Record<string, number> = {};


  for (const [category, patterns] of Object.entries(TRIGGER_PATTERNS)) {
    let score = 0;
    for (const pattern of patterns) {
      if (lower.includes(pattern)) {
        // Longer matches score higher (more specific)
        score += pattern.split(' ').length;
      }
    }
    if (score > 0) scores[category] = score;
  }


  if (Object.keys(scores).length === 0) return null;


  // Return highest scoring category
  const best = Object.entries(scores).sort((a, b) => b[1] - a[1])[0];
  return best[0] as TriggerCategory;
}



