
import React from 'react';
import { UserData, AppScreen, Transaction } from '../types';

interface DashboardProps {
  userData: UserData;
  updateUserData: (data: Partial<UserData>) => void;
  onNavigate: (screen: AppScreen) => void;
}

const Dashboard: React.FC<DashboardProps> = ({ userData, onNavigate }) => {
  const recentTransactions = userData.transactions.slice(-3).reverse();

  const getTxUnit = (tx: Transaction) => {
    if (tx.rewardType?.toLowerCase().includes('zpexk')) return '$ZPEXK';
    if (tx.type === 'EARN' && !tx.rewardType?.toLowerCase().includes('token')) return 'Coins';
    return 'Tokens';
  };

  const getTxIcon = (tx: Transaction) => {
    if (tx.rewardType?.toLowerCase().includes('zpexk')) return (
      <div className="w-10 h-10 rounded-xl bg-slate-900 flex items-center justify-center border border-yellow-500/30 shadow-[0_0_10px_rgba(234,179,8,0.2)]">
        <div className="w-6 h-6 rounded-full bg-slate-950 border border-slate-800 flex items-center justify-center">
          <span className="text-[8px] font-bold text-cyan-400">Z</span>
        </div>
      </div>
    );
    if (tx.type === 'EARN') return (
      <div className="w-10 h-10 rounded-xl bg-green-500/10 flex items-center justify-center text-green-500 border border-green-500/20">
        <svg className="w-5 h-5" fill="none" stroke="currentColor" viewBox="0 0 24 24"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M12 4v16m8-8H4"/></svg>
      </div>
    );
    return (
      <div className="w-10 h-10 rounded-xl bg-cyan-500/10 flex items-center justify-center text-cyan-500 border border-cyan-500/20">
        <svg className="w-5 h-5" fill="none" stroke="currentColor" viewBox="0 0 24 24"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M8 7h12m0 0l-4-4m4 4l-4 4m0 6H4m0 0l4 4m-4-4l4-4"/></svg>
      </div>
    );
  };

  return (
    <div className="space-y-6 animate-in fade-in slide-in-from-bottom-4 duration-500">
      {/* Massive Coin Display */}
      <section className="bg-slate-900 border border-slate-800 p-10 rounded-[2.5rem] text-center relative overflow-hidden group shadow-2xl">
        <div className="absolute inset-0 bg-gradient-to-br from-cyan-500/10 to-blue-600/5 transition-all"></div>
        <div className="absolute top-0 right-0 p-4 opacity-5 group-hover:opacity-10 transition-all">
          <svg className="w-32 h-32" fill="currentColor" viewBox="0 0 24 24"><path d="M12 2C6.48 2 2 6.48 2 12s4.48 10 10 10 10-4.48 10-10S17.52 2 12 2zm1.41 16.09V20h-2.82v-1.91c-1.27-.2-2.19-.74-2.73-1.6l1.37-.82c.3.5.76.84 1.36.99v-2.32c-.93-.36-1.58-.78-1.93-1.26-.35-.48-.52-1.07-.52-1.78 0-.96.34-1.74 1.02-2.34.68-.61 1.61-.95 2.79-1.05V6h2.82v1.9c1.02.16 1.83.62 2.42 1.38l-1.34.8c-.37-.53-.88-.84-1.55-.95v2.33c.96.39 1.63.85 2 1.37.38.52.57 1.15.57 1.89 0 .93-.35 1.73-1.05 2.4-.7.66-1.65 1.02-2.83 1.07zm-1.41-5.73v-2.22c-.44.06-.77.19-1 .4-.22.21-.34.48-.34.81 0 .28.08.51.24.69.15.19.45.32.9.43l.2.06v-.17zm1.41 3.52c.49-.07.87-.23 1.12-.49.25-.26.37-.59.37-.99 0-.32-.1-.59-.3-.82-.2-.22-.56-.42-1.07-.6v2.3c.47.1 1-.1 1.1-.3l.03-.1z"/></svg>
        </div>
        
        <p className="text-slate-500 text-xs font-bold uppercase tracking-[0.3em] mb-4">Account Balance</p>
        <div className="text-6xl font-gaming font-bold text-white flex items-center justify-center gap-6">
           <div className="w-16 h-16 bg-yellow-500/90 rounded-full flex items-center justify-center text-3xl shadow-[0_0_20px_rgba(234,179,8,0.3)]">C</div>
           {userData.coinBalance.toLocaleString()}
        </div>
      </section>

      <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
        {/* Recent Log */}
        <div className="bg-slate-900 border border-slate-800 p-8 rounded-[2rem] shadow-xl">
          <h3 className="text-xs font-bold text-slate-500 uppercase tracking-[0.2em] mb-6 flex justify-between">
            <span>Recent Activity</span>
            <span className="text-cyan-500/50">Live</span>
          </h3>
          <div className="space-y-3">
            {recentTransactions.length === 0 ? (
              <div className="flex flex-col items-center justify-center py-10 text-slate-600 opacity-30 border border-dashed border-slate-800 rounded-2xl">
                 <p className="text-[10px] font-bold uppercase tracking-widest">No Recent Logs</p>
              </div>
            ) : (
              recentTransactions.map((tx, idx) => (
                <div 
                  key={tx.id} 
                  className="flex justify-between items-center bg-slate-950/40 p-4 rounded-2xl border border-slate-800/50 animate-in slide-in-from-right duration-500"
                  style={{ animationDelay: `${idx * 100}ms` }}
                >
                  <div className="flex items-center gap-4">
                    {getTxIcon(tx)}
                    <div>
                      <p className="text-sm font-bold text-white truncate max-w-[120px]">{tx.rewardType}</p>
                      <p className="text-[9px] text-slate-500 font-bold uppercase tracking-tighter">{new Date(tx.timestamp).toLocaleTimeString()}</p>
                    </div>
                  </div>
                  <div className="text-right">
                    <p className={`text-sm font-gaming font-bold ${tx.coinAmount >= 0 && tx.type === 'EARN' ? 'text-green-500' : 'text-cyan-400'}`}>
                      {tx.amount} <span className="text-[9px] uppercase">{getTxUnit(tx)}</span>
                    </p>
                  </div>
                </div>
              ))
            )}
            <button 
              onClick={() => onNavigate(AppScreen.REDEEM)}
              className="w-full mt-2 py-3 bg-slate-950/50 hover:bg-slate-800 rounded-xl text-[10px] font-bold text-slate-500 hover:text-cyan-400 transition-all uppercase tracking-widest border border-slate-800/50"
            >
              View Full History
            </button>
          </div>
        </div>

        {/* Quick Offers Area */}
        <section className="bg-slate-900 border border-slate-800 p-8 rounded-[2rem] shadow-xl">
          <h4 className="text-xs font-bold text-slate-500 uppercase tracking-[0.2em] mb-6">Trending Tasks</h4>
          <div className="flex flex-col items-center justify-center py-10 text-slate-600 opacity-30 border border-dashed border-slate-800 rounded-2xl">
             <p className="text-[10px] font-bold uppercase tracking-widest">No Tasks Available</p>
          </div>
        </section>
      </div>

      {/* Footer Promotion */}
      <div className="bg-slate-900 border border-slate-800 p-8 rounded-[2rem] flex flex-col items-center justify-center text-center space-y-5 hover:border-cyan-500/30 transition-all group overflow-hidden relative shadow-2xl">
          <div className="absolute inset-0 bg-green-500/5 opacity-0 group-hover:opacity-100 transition-all duration-700"></div>
          <div className="w-20 h-20 bg-green-500/10 rounded-3xl flex items-center justify-center relative z-10">
             <svg className="w-10 h-10 text-green-500" viewBox="0 0 24 24" fill="currentColor"><path d="M4 1l4 4v14l-4-4V1zm16 0l-4 4v14l4-4V1zm-8 7l4 4v4l-4-4v-4z"/></svg>
          </div>
          <div className="relative z-10">
            <h3 className="text-xl font-gaming font-bold text-white uppercase tracking-tight">Game Rewards Engine</h3>
            <p className="text-slate-500 text-xs mt-2 uppercase font-bold tracking-[0.2em]">Redeem elite tokens instantly</p>
          </div>
          <button 
            className="w-full max-w-sm bg-white text-slate-950 font-bold py-4 rounded-2xl transition-all shadow-xl active:scale-95 uppercase tracking-widest text-xs relative z-10"
            onClick={() => onNavigate(AppScreen.REDEEM)}
          >
            Open Elite Wallet
          </button>
      </div>
    </div>
  );
};

export default Dashboard;
