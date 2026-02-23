import React, { useState } from 'react';
import { UserData, AppScreen, Transaction } from '../types';

interface ProfileScreenProps {
  userData: UserData;
  updateUserData: (data: Partial<UserData>) => void;
  onLogout: () => void;
  onNavigate: (screen: AppScreen) => void;
}

const ProfileScreen: React.FC<ProfileScreenProps> = ({ userData, updateUserData, onLogout, onNavigate }) => {
  const [showPromoModal, setShowPromoModal] = useState(false);
  const [promoInput, setPromoInput] = useState('');
  const [showPinModal, setShowPinModal] = useState(false);
  const [pinInput, setPinInput] = useState('');

  // Calculate total spent from transactions
  const totalSpent = userData.transactions
    .filter(tx => tx.coinAmount < 0)
    .reduce((acc, tx) => acc + Math.abs(tx.coinAmount), 0);

  const handlePromoSubmit = () => {
    const normalizedCode = promoInput.trim();
    const usedCodes = userData.usedPromoCodes || [];

    if (usedCodes.includes('Kangkanop90jQ@') && normalizedCode === 'Kangkanop90jQ@') {
      alert("This code already used");
      return;
    }

    if (normalizedCode === 'Kangkanop90jQ@') {
      const bonus = 10000;
      
      const promoTransaction: Transaction = {
        id: `promo_${Date.now()}`,
        amount: bonus,
        coinAmount: bonus,
        rewardType: 'PROMO: ELITE ACCESS',
        timestamp: Date.now(),
        status: 'SUCCESS',
        destinationId: 'WALLET',
        type: 'EARN'
      };

      updateUserData({
        coinBalance: userData.coinBalance + bonus,
        lifetimeCoins: userData.lifetimeCoins + bonus,
        transactions: [...userData.transactions, promoTransaction],
        usedPromoCodes: [...usedCodes, 'Kangkanop90jQ@']
      });

      alert(`ACCESS GRANTED! ${bonus.toLocaleString()} coins added to your wallet.`);
      setShowPromoModal(false);
      setPromoInput('');
    } else {
      alert("Invalid code");
    }
  };

  const handlePinSubmit = () => {
    if (pinInput.length !== 2 || !/^\d+$/.test(pinInput)) {
      alert("PIN must be exactly 2 digits.");
      return;
    }

    const now = Date.now();
    const EIGHT_HOURS = 8 * 60 * 60 * 1000;

    if (userData.lastPinUpdate && (now - userData.lastPinUpdate < EIGHT_HOURS)) {
      const remainingMs = EIGHT_HOURS - (now - userData.lastPinUpdate);
      const remainingHours = Math.floor(remainingMs / (60 * 60 * 1000));
      const remainingMinutes = Math.floor((remainingMs % (60 * 60 * 1000)) / (60 * 1000));
      alert(`You can only update your PIN once every 8 hours. Please wait ${remainingHours}h ${remainingMinutes}m.`);
      return;
    }

    updateUserData({ 
      pin: pinInput,
      lastPinUpdate: now
    });
    alert("PIN updated successfully!");
    setShowPinModal(false);
    setPinInput('');
  };

  const getProfileBgColor = (username: string) => {
    const colors = [
      'bg-red-500', 'bg-blue-500', 'bg-green-500', 'bg-yellow-500', 
      'bg-purple-500', 'bg-pink-500', 'bg-indigo-500', 'bg-teal-500', 'bg-orange-500'
    ];
    const charCodeSum = username.split('').reduce((acc, char) => acc + char.charCodeAt(0), 0);
    return colors[charCodeSum % colors.length];
  };

  return (
    <div className="space-y-4 animate-in slide-in-from-right-4 duration-500 pb-10">
      {/* Compact User Header */}
      <div className="flex items-center gap-4 p-5 bg-slate-900/50 border border-slate-800 rounded-3xl shadow-lg relative overflow-hidden">
        <div className="absolute inset-0 bg-gradient-to-r from-cyan-500/5 to-transparent"></div>
        <div className={`w-12 h-12 ${getProfileBgColor(userData.username)} rounded-xl flex items-center justify-center text-lg font-bold shadow-lg border uppercase border-white/10 text-white shrink-0 relative z-10`}>
          {userData.username.charAt(0)}
        </div>
        <div className="relative z-10 flex-1">
          <h2 className="text-sm font-gaming font-bold text-white tracking-tight">{userData.username}</h2>
          <p className="text-[8px] text-slate-500 font-bold uppercase tracking-widest">Elite Agent</p>
        </div>
      </div>

      {/* Unique Transfer ID Section */}
      <div className="bg-slate-900 p-4 rounded-2xl border border-cyan-500/20 shadow-md">
        <div className="flex items-center justify-between">
          <div>
            <h3 className="text-[8px] font-bold text-cyan-500 uppercase tracking-[0.2em] mb-1">ZPEXK Transfer ID</h3>
            <p className="text-sm font-gaming font-bold text-white tracking-[0.15em]">
              {userData.zpexkNumber || '1000000000'}
            </p>
          </div>
          <button 
            onClick={() => {
              navigator.clipboard.writeText(userData.zpexkNumber || '');
              alert('Transfer ID Copied!');
            }}
            className="p-2 bg-slate-800 rounded-lg text-cyan-400 hover:text-cyan-300 transition-colors"
          >
            <svg className="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M8 7v8a2 2 0 002 2h6M8 7V5a2 2 0 012-2h4.586a1 1 0 01.707.293l4.414 4.414a1 1 0 01.293.707V15a2 2 0 01-2 2h-2M8 7H6a2 2 0 00-2 2v10a2 2 0 012 2h8a2 2 0 012-2v-2"/></svg>
          </button>
        </div>
      </div>

      <div className="grid grid-cols-1 md:grid-cols-3 gap-3">
        <div className="bg-slate-900 p-4 rounded-2xl border border-slate-800 flex flex-col items-center text-center group hover:border-green-500/30 transition-all">
          <div className="w-7 h-7 bg-green-500/10 rounded-lg flex items-center justify-center mb-2 text-green-500">
             <svg className="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M13 7h8m0 0v8m0-8l-8 8-4-4-6 6"/></svg>
          </div>
          <h3 className="text-[7px] font-bold text-slate-500 uppercase tracking-[0.2em] mb-1">Lifetime Earned</h3>
          <p className="text-base font-gaming font-bold text-white">
            {userData.lifetimeCoins.toLocaleString()} <span className="text-[9px] text-green-500 font-sans">C</span>
          </p>
        </div>

        <div className="bg-slate-900 p-4 rounded-2xl border border-slate-800 flex flex-col items-center text-center group hover:border-red-500/30 transition-all">
          <div className="w-7 h-7 bg-red-500/10 rounded-lg flex items-center justify-center mb-2 text-red-500">
             <svg className="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M15 12H9m12 0a9 9 0 11-18 0 9 9 0 0118 0z"/></svg>
          </div>
          <h3 className="text-[7px] font-bold text-slate-500 uppercase tracking-[0.2em] mb-1">Total Spent</h3>
          <p className="text-base font-gaming font-bold text-white">
            {totalSpent.toLocaleString()} <span className="text-[9px] text-red-500 font-sans">C</span>
          </p>
        </div>

        <div className="bg-slate-900 p-4 rounded-2xl border border-slate-800 flex flex-col items-center text-center group hover:border-cyan-500/30 transition-all">
          <div className="w-7 h-7 bg-cyan-500/10 rounded-lg flex items-center justify-center mb-2 text-cyan-500">
             <svg className="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M8.684 13.342C8.886 12.938 9 12.482 9 12c0-.482-.114-.938-.316-1.342m0 2.684a3 3 0 110-2.684m0 2.684l6.632 3.316m-6.632-6l6.632-3.316m0 0a3 3 0 105.367-2.684 3 3 0 00-5.367 2.684zm0 9.316a3 3 0 105.368 2.684 3 3 0 00-5.368-2.684z"/></svg>
          </div>
          <h3 className="text-[7px] font-bold text-slate-500 uppercase tracking-[0.2em] mb-1">Referral Code</h3>
          <button 
            onClick={() => {
              navigator.clipboard.writeText(userData.referralCode);
              alert('Copied ID!');
            }}
            className="text-xs font-gaming font-bold text-cyan-400 tracking-widest uppercase hover:text-cyan-300 transition-colors"
          >
            {userData.referralCode}
          </button>
        </div>
      </div>

      <div className="grid grid-cols-1 md:grid-cols-2 gap-3 pt-2">
        <button 
          onClick={() => setShowPromoModal(true)}
          className="bg-slate-900 hover:bg-slate-800 text-cyan-400 font-bold py-3.5 rounded-xl border border-slate-800 transition-all flex items-center justify-center gap-2 group active:scale-[0.98] text-[9px] uppercase tracking-[0.2em]"
        >
          <svg className="w-3.5 h-3.5" fill="none" stroke="currentColor" viewBox="0 0 24 24"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M12 8v13m0-13V6a2 2 0 112 2h-2zm0 0V5.5A2.5 2.5 0 109.5 8H12zm-7 4h14M5 12a2 2 0 110-4h14a2 2 0 110 4M5 12v7a2 2 0 002 2h10a2 2 0 002-2v-7"/></svg>
          Promo
        </button>
        <button 
          onClick={() => setShowPinModal(true)}
          className="bg-slate-900 hover:bg-slate-800 text-purple-400 font-bold py-3.5 rounded-xl border border-slate-800 transition-all flex items-center justify-center gap-2 group active:scale-[0.98] text-[9px] uppercase tracking-[0.2em]"
        >
          <svg className="w-3.5 h-3.5" fill="none" stroke="currentColor" viewBox="0 0 24 24"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M12 15v2m-6 4h12a2 2 0 002-2v-6a2 2 0 00-2-2H6a2 2 0 00-2 2v6a2 2 0 002 2zm10-10V7a4 4 0 00-8 0v4h8z"/></svg>
          {userData.pin ? 'Update PIN' : 'Set PIN'}
        </button>
        <button 
          onClick={onLogout}
          className="bg-slate-900/40 hover:bg-slate-900 text-red-500 font-bold py-3.5 rounded-xl border border-slate-800 transition-all flex items-center justify-center gap-2 group active:scale-[0.98] text-[9px] uppercase tracking-[0.2em]"
        >
          <svg className="w-3.5 h-3.5" fill="none" stroke="currentColor" viewBox="0 0 24 24"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M17 16l4-4m0 0l-4-4m4 4H7m6 4v1a3 3 0 01-3 3H6a3 3 0 01-3-3V7a3 3 0 013-3h4a3 3 0 013 3v1"/></svg>
          Logout
        </button>
      </div>

      {showPromoModal && (
        <div className="fixed inset-0 z-[100] flex items-center justify-center p-4 bg-slate-950/90 backdrop-blur-md animate-in fade-in duration-200">
          <div className="bg-slate-900 border border-slate-800 w-full max-w-sm rounded-3xl p-6 shadow-2xl animate-in zoom-in-95 duration-200 text-center">
            <h3 className="text-sm font-gaming font-bold text-white mb-4 uppercase tracking-widest">Secret Code</h3>
            <div className="space-y-4">
              <div className="bg-slate-950 border border-slate-800 rounded-xl px-4 focus-within:ring-2 focus-within:ring-cyan-500 transition-all">
                <input 
                  type="text"
                  value={promoInput}
                  onChange={(e) => setPromoInput(e.target.value)}
                  placeholder="CODE"
                  className="w-full bg-transparent py-4 text-white text-center focus:outline-none placeholder:text-slate-700 text-lg font-gaming tracking-[0.2em] font-bold"
                />
              </div>
              <div className="flex gap-3 pt-2">
                <button onClick={() => setShowPromoModal(false)} className="flex-1 py-3 rounded-lg bg-slate-800 text-slate-400 font-bold text-[9px] uppercase tracking-widest">Cancel</button>
                <button onClick={handlePromoSubmit} className="flex-1 py-3 rounded-lg bg-cyan-600 text-white font-bold text-[9px] uppercase tracking-widest shadow-lg shadow-cyan-900/30">Unlock</button>
              </div>
            </div>
          </div>
        </div>
      )}

      {showPinModal && (
        <div className="fixed inset-0 z-[100] flex items-center justify-center p-4 bg-slate-950/90 backdrop-blur-md animate-in fade-in duration-200">
          <div className="bg-slate-900 border border-slate-800 w-full max-w-sm rounded-3xl p-6 shadow-2xl animate-in zoom-in-95 duration-200 text-center">
            <h3 className="text-sm font-gaming font-bold text-white mb-4 uppercase tracking-widest">Security PIN</h3>
            <p className="text-[10px] text-slate-500 mb-1 uppercase tracking-widest">Set a 2-digit PIN for ZPEXK transfers</p>
            <p className="text-[8px] text-red-500/60 mb-4 uppercase tracking-widest">Note: PIN can only be updated every 8 hours</p>
            <div className="space-y-4">
              <div className="bg-slate-950 border border-slate-800 rounded-xl px-4 focus-within:ring-2 focus-within:ring-purple-500 transition-all">
                <input 
                  type="tel"
                  maxLength={2}
                  value={pinInput}
                  onChange={(e) => setPinInput(e.target.value.replace(/\D/g, '').slice(0, 2))}
                  placeholder="00"
                  className="w-full bg-transparent py-4 text-white text-center focus:outline-none placeholder:text-slate-700 text-2xl font-gaming tracking-[0.5em] font-bold"
                />
              </div>
              <div className="flex gap-3 pt-2">
                <button onClick={() => setShowPinModal(false)} className="flex-1 py-3 rounded-lg bg-slate-800 text-slate-400 font-bold text-[9px] uppercase tracking-widest">Cancel</button>
                <button onClick={handlePinSubmit} className="flex-1 py-3 rounded-lg bg-purple-600 text-white font-bold text-[9px] uppercase tracking-widest shadow-lg shadow-purple-900/30">Save PIN</button>
              </div>
            </div>
          </div>
        </div>
      )}
    </div>
  );
};

export default ProfileScreen;