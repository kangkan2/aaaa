
import { RedemptionOption, Task } from './types';

// We keep these for internal reference if needed, but the primary logic is 100:1
export const REDEMPTION_TIERS: RedemptionOption[] = [
  { id: 'mc-1', label: '1 Token', coinsRequired: 100, value: 1, currency: 'MCR', type: 'GAME_CREDIT' },
  { id: 'mc-10', label: '10 Tokens', coinsRequired: 1000, value: 10, currency: 'MCR', type: 'GAME_CREDIT' },
  { id: 'mc-50', label: '50 Tokens', coinsRequired: 5000, value: 50, currency: 'MCR', type: 'GAME_CREDIT' },
];

export const MOCK_TASKS: Task[] = [
  {
    id: 'yt_sub_kangkan',
    title: 'YouTube Elite Quest',
    description: 'Subscribe to our official channel to unlock elite status rewards.',
    reward: 10,
    type: 'OFFER',
    provider: 'YouTube',
    url: 'http://www.youtube.com/@Kangkan444'
  }
];
