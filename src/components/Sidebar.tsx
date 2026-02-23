
import React from 'react';
import { AppScreen } from '../types';
import { 
  LayoutDashboard, 
  Zap, 
  Wallet, 
  ShoppingBag, 
  User, 
  TrendingUp, 
  Gamepad2 
} from 'lucide-react';

interface SidebarProps {
  activeScreen: AppScreen;
  onNavigate: (screen: AppScreen) => void;
}

const Sidebar: React.FC<SidebarProps> = ({ activeScreen, onNavigate }) => {
  const menuItems = [
    { id: AppScreen.DASHBOARD, label: 'Dashboard', icon: LayoutDashboard },
    { id: AppScreen.TASK_WALL, label: 'Earn Coins', icon: Zap },
    { id: AppScreen.PLAYTIME, label: 'Play MD', icon: Gamepad2 },
    { id: AppScreen.KNIX_COIN, label: 'Market', icon: TrendingUp },
    { id: AppScreen.PAYOUT, label: 'Shop', icon: ShoppingBag },
    { id: AppScreen.REDEEM, label: 'Wallet', icon: Wallet },
    { id: AppScreen.PROFILE, label: 'Profile', icon: User },
  ];

  return (
    <aside className="hidden md:flex flex-col w-64 bg-slate-900 border-r border-slate-800 p-6 z-50">
      <div className="mb-10 px-2">
        <h2 className="text-xl font-gaming font-bold text-cyan-400 tracking-tighter">
          MC<span className="text-white">REWARD</span>
        </h2>
        <p className="text-[10px] text-slate-500 font-bold uppercase tracking-widest mt-1">Elite Gaming Hub</p>
      </div>

      <nav className="flex-1 space-y-2">
        {menuItems.map((item) => {
          const Icon = item.icon;
          const isActive = activeScreen === item.id;
          
          return (
            <button
              key={item.id}
              onClick={() => onNavigate(item.id)}
              className={`w-full flex items-center gap-4 px-4 py-3.5 rounded-2xl transition-all duration-300 group ${
                isActive 
                ? 'bg-cyan-500/10 text-cyan-400 border border-cyan-500/20 shadow-[0_0_15px_rgba(34,211,238,0.1)]' 
                : 'text-slate-500 hover:text-slate-200 hover:bg-slate-800/50'
              }`}
            >
              <Icon className={`w-5 h-5 transition-transform group-hover:scale-110 ${isActive ? 'text-cyan-400' : 'text-slate-500'}`} />
              <span className="font-bold text-sm uppercase tracking-wide">{item.label}</span>
              {isActive && (
                <div className="ml-auto w-1.5 h-1.5 rounded-full bg-cyan-400 shadow-[0_0_8px_rgba(34,211,238,0.8)]"></div>
              )}
            </button>
          );
        })}
      </nav>

      <div className="mt-auto pt-6 border-t border-slate-800/50">
        <div className="bg-slate-950/50 rounded-2xl p-4 border border-slate-800/50">
          <p className="text-[9px] text-slate-500 font-bold uppercase tracking-widest mb-2">System Status</p>
          <div className="flex items-center gap-2">
            <div className="w-2 h-2 rounded-full bg-green-500 animate-pulse"></div>
            <span className="text-[10px] text-slate-300 font-bold uppercase">Servers Online</span>
          </div>
        </div>
      </div>
    </aside>
  );
};

export default Sidebar;
