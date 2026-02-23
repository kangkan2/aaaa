
export interface Transaction {
  id: string;
  amount: number; // For Transfers: Token count. For Earn: Coin count.
  coinAmount: number; // The actual change in coins (positive for earn, negative for spend)
  rewardType: string;
  timestamp: number;
  status: 'PENDING' | 'SUCCESS';
  destinationId: string;
  type: 'EARN' | 'TRANSFER' | 'SHOP';
  redeemCode?: string; // Optional field to store the generated code
}

export type VerificationStatus = 'UNVERIFIED' | 'PENDING' | 'VERIFIED';

export interface UserData {
  id: string;
  username: string;
  password?: string;
  minecraftUsername: string;
  coinBalance: number;
  lifetimeCoins: number;
  deviceId: string;
  isAccountBound: boolean;
  referralCode: string;
  referredBy?: string;
  transactions: Transaction[];
  verificationStatus: VerificationStatus;
  emailVerificationStatus?: VerificationStatus;
  phoneNumber?: string;
  email?: string;
  completedTaskIds?: string[]; // Track which tasks are already finished
  knixBalance?: number; // User's Knix Coin holdings
  usedPromoCodes?: string[]; // Track which promo codes have already been used
  zpexkNumber?: string; // 10-digit unique ID for ZPEXK transfers
  highScore?: number; // Global high score for Play MD
  pin?: string; // 2-digit security PIN
  lastPinUpdate?: number; // Timestamp of the last PIN update
}

export interface Task {
  id: string;
  title: string;
  description: string;
  reward: number;
  type: 'OFFER' | 'AD' | 'POLL';
  provider: string;
  url?: string;
}

export enum AppScreen {
  DASHBOARD = 'DASHBOARD',
  TASK_WALL = 'TASK_WALL',
  REDEEM = 'REDEEM',
  PAYOUT = 'PAYOUT',
  PROFILE = 'PROFILE',
  KNIX_COIN = 'KNIX_COIN',
  PLAYTIME = 'PLAYTIME'
}

export interface RedemptionOption {
  id: string;
  label: string;
  coinsRequired: number;
  value: number;
  currency: string;
  type: 'CASH' | 'GAME_CREDIT';
}
