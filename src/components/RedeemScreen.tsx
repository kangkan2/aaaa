
import React, { useState } from 'react';
import { UserData, Transaction } from '../types';

const MinecraftLogo = () => (
  <svg viewBox="0 0 24 24" className="w-full h-full" fill="none" xmlns="http://www.w3.org/2000/svg">
    <path d="M4 4H8V8H4V4Z" fill="#3D3D3D"/>
    <path d="M8 4H12V8H8V4Z" fill="#4B4B4B"/>
    <path d="M12 4H16V8H12V4Z" fill="#3D3D3D"/>
    <path d="M16 4H20V8H16V4Z" fill="#4B4B4B"/>
    <path d="M4 8H8V12H4V8Z" fill="#4B4B4B"/>
    <path d="M8 8H12V12H8V8Z" fill="#5A5A5A"/>
    <path d="M12 8H16V12H12V8Z" fill="#4B4B4B"/>
    <path d="M16 8H20V12H16V8Z" fill="#5A5A5A"/>
    <path d="M4 12H8V16H4V12Z" fill="#3D3D3D"/>
    <path d="M8 12H12V16H8V12Z" fill="#4B4B4B"/>
    <path d="M12 12H16V16H12V12Z" fill="#3D3D3D"/>
    <path d="M16 12H20V16H16V12Z" fill="#4B4B4B"/>
    <path d="M4 16H8V20H4V16Z" fill="#4B4B4B"/>
    <path d="M8 16H12V20H8V16Z" fill="#5A5A5A"/>
    <path d="M12 16H16V20H12V16Z" fill="#4B4B4B"/>
    <path d="M16 16H20V20H16V16Z" fill="#5A5A5A"/>
    <path d="M6 6H10V10H6V6Z" fill="#000000" fillOpacity="0.6"/>
    <path d="M14 6H18V10H14V6Z" fill="#000000" fillOpacity="0.6"/>
    <path d="M10 10H14V14H10V10Z" fill="#000000" fillOpacity="0.6"/>
    <path d="M8 14H10V18H8V14Z" fill="#000000" fillOpacity="0.6"/>
    <path d="M14 14H16V18H14V14Z" fill="#000000" fillOpacity="0.6"/>
  </svg>
);

const GooglePlayLogo = () => (
  <svg viewBox="0 0 24 24" className="w-full h-full" fill="none" xmlns="http://www.w3.org/2000/svg">
    <path d="M3.60938 2.375C3.39062 2.59375 3.26562 2.9375 3.26562 3.375V20.625C3.26562 21.0625 3.39062 21.4062 3.60938 21.625L3.67188 21.6875L13.3281 12.0312V11.9688L3.67188 2.3125L3.60938 2.375Z" fill="#EA4335"/>
    <path d="M16.5469 15.25L13.3281 12.0312V11.9688L16.5469 8.75L16.625 8.79688L20.4219 10.9531C21.5156 11.5625 21.5156 12.4375 20.4219 13.0625L16.625 15.2031L16.625 15.25Z" fill="#FBBC04"/>
    <path d="M16.625 15.2031L13.3281 11.9688L3.60938 21.625C3.95312 21.9844 4.53125 22.0312 5.1875 21.6562L16.625 15.2031Z" fill="#34A853"/>
    <path d="M16.625 8.79688L5.1875 2.34375C4.53125 1.96875 3.95312 2.01562 3.60938 2.375L13.3281 12.0312L16.625 8.79688Z" fill="#4285F4"/>
  </svg>
);

interface RedeemScreenProps {
  userData: UserData;
  updateUserData: (data: Partial<UserData>) => void;
}

const RedeemScreen: React.FC<RedeemScreenProps> = ({ userData }) => {
  const [selectedTx, setSelectedTx] = useState<Transaction | null>(null);

  const handleTxClick = (tx: Transaction) => {
    if (tx.type === 'SHOP' && tx.redeemCode) {
      setSelectedTx(tx);
    }
  };

  const getTxUnit = (tx: Transaction) => {
    if (tx.rewardType?.toLowerCase().includes('zpexk')) return '$ZPEXK';
    if (tx.type === 'EARN' && !tx.rewardType?.toLowerCase().includes('token')) return 'Coins';
    return 'Tokens';
  };

  return (
    <div className="space-y-6 animate-in fade-in duration-500">
      <div className="bg-slate-900 border border-slate-800 p-8 rounded-[2.5rem] shadow-2xl relative overflow-hidden">
        <div className="absolute top-0 right-0 -mr-16 -mt-16 w-64 h-64 bg-cyan-500/5 rounded-full blur-3xl"></div>
        
        <div className="flex items-center justify-between relative z-10 mb-8">
           <div>
              <h2 className="text-2xl font-gaming font-bold text-white uppercase tracking-widest">Wallet</h2>
              <p className="text-slate-500 text-[10px] font-bold uppercase tracking-widest mt-1">Activity Log & Balance</p>
           </div>
           <div className="w-12 h-12 bg-slate-800 rounded-2xl flex items-center justify-center border border-slate-700 shadow-inner">
              <svg className="w-6 h-6 text-slate-400" fill="none" stroke="currentColor" viewBox="0 0 24 24"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M3 10h18M7 15h1m4 0h1m-7 4h12a3 3 0 003-3V8a3 3 0 00-3-3H6a3 3 0 00-3 3v8a3 3 0 003 3z"/></svg>
           </div>
        </div>

        <div className="relative z-10 bg-slate-950/60 border border-slate-800/50 p-8 rounded-[2rem] text-center shadow-inner">
          <p className="text-[10px] text-cyan-500 font-bold uppercase tracking-[0.4em] mb-3">Available Balance</p>
          <div className="text-5xl font-gaming font-bold text-white flex items-center justify-center gap-4">
             <div className="w-12 h-12 bg-yellow-500 rounded-full flex items-center justify-center text-2xl shadow-[0_0_15px_rgba(234,179,8,0.4)] text-slate-900">C</div>
             {userData.coinBalance.toLocaleString()}
          </div>
          <p className="text-[10px] text-slate-600 mt-4 font-bold uppercase">Coins available for redemption</p>
        </div>
      </div>

      <div className="bg-slate-900 border border-slate-800 rounded-[2.5rem] overflow-hidden shadow-2xl">
        <div className="p-6 border-b border-slate-800 bg-slate-900/50 flex justify-between items-center">
           <p className="text-[10px] font-bold text-slate-500 uppercase tracking-widest">History</p>
           <p className="text-[8px] font-bold text-cyan-500 uppercase tracking-widest opacity-60">Live Log</p>
        </div>
        <div className="divide-y divide-slate-800">
          {userData.transactions.length === 0 ? (
            <div className="p-20 text-center text-slate-500 space-y-4">
              <div className="w-20 h-20 bg-slate-800 rounded-full flex items-center justify-center mx-auto opacity-20 border border-slate-700 shadow-inner">
                <svg className="w-10 h-10" fill="none" stroke="currentColor" viewBox="0 0 24 24"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M12 8v4l3 3m6-3a9 9 0 11-18 0 9 9 0 0118 0z"/></svg>
              </div>
              <p className="font-bold uppercase tracking-widest text-[10px]">No Transactions Found</p>
            </div>
          ) : (
            [...userData.transactions].reverse().map((tx, idx) => {
              const isEarn = tx.type === 'EARN';
              const isShop = tx.type === 'SHOP';
              const isTransfer = tx.type === 'TRANSFER';
              
              return (
                <div 
                  key={tx.id} 
                  onClick={() => handleTxClick(tx)}
                  className={`p-6 flex justify-between items-center group transition-all active:bg-slate-800/50 animate-in slide-in-from-left duration-500 ${
                    isShop && tx.redeemCode ? 'cursor-pointer hover:bg-slate-800/80' : 'cursor-default hover:bg-slate-800/20'
                  }`}
                  style={{ animationDelay: `${idx * 50}ms` }}
                >
                  <div className="flex items-center gap-5">
                    <div className={`w-14 h-14 rounded-2xl flex items-center justify-center shrink-0 shadow-inner transition-transform group-hover:scale-110 ${
                      tx.rewardType?.toLowerCase().includes('zpexk') ? 'bg-slate-900 border border-yellow-500/30' :
                      isEarn ? 'bg-green-500/10 text-green-500' : 
                      isShop ? (
                        tx.rewardType?.toLowerCase().includes('google') ? 'bg-orange-500/10 p-3' : 
                        tx.rewardType?.toLowerCase().includes('minecraft') ? 'bg-green-500/10 p-3' :
                        'bg-orange-500/10 text-orange-500'
                      ) : 'bg-cyan-500/10 text-cyan-500'
                    }`}>
                      {tx.rewardType?.toLowerCase().includes('zpexk') ? (
                        <div className="w-8 h-8 rounded-full bg-slate-950 border border-slate-800 flex items-center justify-center shadow-[0_0_10px_rgba(234,179,8,0.3)]">
                          <span className="text-[10px] font-bold text-cyan-400">Z</span>
                        </div>
                      ) : isEarn ? (
                        <svg className="w-7 h-7" fill="none" stroke="currentColor" viewBox="0 0 24 24"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M12 4v16m8-8H4"/></svg>
                      ) : isShop ? (
                        tx.rewardType?.toLowerCase().includes('google') ? <GooglePlayLogo /> :
                        tx.rewardType?.toLowerCase().includes('minecraft') ? <MinecraftLogo /> :
                        <svg className="w-7 h-7" fill="none" stroke="currentColor" viewBox="0 0 24 24"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M16 11V7a4 4 0 00-8 0v4M5 9h14l1 12H4L5 9z"/></svg>
                      ) : (
                        <svg className="w-7 h-7" fill="none" stroke="currentColor" viewBox="0 0 24 24"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M8 7h12m0 0l-4-4m4 4l-4 4m0 6H4m0 0l4 4m-4-4l4-4"/></svg>
                      )}
                    </div>
                    <div className="space-y-1">
                      <div className="flex items-center gap-2">
                        <p className="font-bold text-white text-base truncate max-w-[140px] md:max-w-none">{tx.rewardType}</p>
                        {isShop && tx.redeemCode && (
                          <span className="bg-orange-500 text-white text-[8px] font-bold px-2 py-0.5 rounded-full uppercase tracking-tighter shadow-lg shadow-orange-900/30">View Code</span>
                        )}
                      </div>
                      <p className="text-[10px] text-slate-500 uppercase font-bold tracking-widest">
                        {isEarn ? `Source: ${tx.destinationId}` : 
                         isShop ? `Type: Gift Card` : `Asset: ${tx.rewardType.includes('ZPEXK') ? 'ZPEXK' : 'Tokens'}`}
                      </p>
                      <p className="text-[10px] text-slate-600 font-mono">
                        {new Date(tx.timestamp).toLocaleString()}
                      </p>
                    </div>
                  </div>
                  <div className="text-right">
                    <p className={`font-gaming font-bold text-lg ${isEarn ? 'text-green-500' : 'text-cyan-400'}`}>
                      {isEarn ? '+' : ''}{tx.amount}
                      <span className="text-[10px] ml-1 uppercase opacity-50">{getTxUnit(tx)}</span>
                    </p>
                    <span className={`text-[9px] font-bold uppercase px-2 py-0.5 rounded-full border mt-1 inline-block ${
                      tx.status === 'SUCCESS' ? 'border-green-500/20 text-green-500 bg-green-500/5' : 'border-yellow-500/20 text-yellow-500 bg-yellow-500/5'
                    }`}>
                      {tx.status === 'PENDING' && isShop ? '24h Processing' : tx.status}
                    </span>
                  </div>
                </div>
              );
            })
          )}
        </div>
      </div>

      {selectedTx && (
        <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-slate-950/95 backdrop-blur-xl animate-in fade-in duration-300">
          <div className="bg-slate-900 border-2 border-orange-500/30 w-full max-w-sm rounded-[3rem] p-10 shadow-[0_0_50px_rgba(249,115,22,0.15)] text-center relative overflow-hidden">
             <div className="absolute -top-10 -right-10 w-40 h-40 bg-orange-500/5 rounded-full blur-3xl"></div>
             
             <div className="w-20 h-20 bg-orange-500/10 rounded-full flex items-center justify-center mx-auto mb-6 border border-orange-500/20 p-4">
                {selectedTx.rewardType?.toLowerCase().includes('google') ? <GooglePlayLogo /> : (
                  <svg className="w-10 h-10 text-orange-500" fill="none" stroke="currentColor" viewBox="0 0 24 24"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M15 7a2 2 0 012 2m4 0a6 6 0 01-7.743 5.743L11 17H9v2H7v2H4a1 1 0 01-1-1v-2.586a1 1 0 01.293-.707l5.964-5.964A6 6 0 1121 9z"/></svg>
                )}
             </div>

             <h3 className="text-2xl font-gaming font-bold text-white uppercase mb-2">Redeem Code</h3>
             <p className="text-slate-400 text-[10px] font-bold uppercase tracking-[0.3em] mb-8">{selectedTx.rewardType}</p>

             <div className="bg-slate-950 border border-slate-800 p-6 rounded-3xl mb-8">
                <p className="text-[10px] text-slate-500 font-bold uppercase tracking-widest mb-3">Stored Code</p>
                <div className="text-xl font-mono font-bold text-orange-400 tracking-wider break-all select-all">
                   {selectedTx.redeemCode}
                </div>
                <button 
                  onClick={() => {
                    navigator.clipboard.writeText(selectedTx.redeemCode || '');
                    alert('Code copied to clipboard!');
                  }}
                  className="mt-4 w-full py-2 bg-orange-500/10 rounded-xl text-[10px] text-orange-400 font-bold uppercase border border-orange-500/20 hover:bg-orange-500/20 transition-all active:scale-95"
                >
                  Copy to Clipboard
                </button>
             </div>

             <button 
                onClick={() => setSelectedTx(null)}
                className="w-full py-4 rounded-2xl bg-slate-800 hover:bg-slate-700 text-white font-bold transition-all border border-slate-700 uppercase text-xs tracking-widest active:scale-95"
             >
                Close
             </button>
          </div>
        </div>
      )}
    </div>
  );
};

export default RedeemScreen;
