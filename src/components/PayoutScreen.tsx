
import React, { useState } from 'react';
import { UserData, RedemptionOption } from '../types';
import { ShoppingBag, CreditCard, Gamepad, Gift, Check, X, AlertCircle } from 'lucide-react';

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
    <path d="M16.5469 15.25L13.3281 12.0312V11.9688L16.5469 8.75L16.625 8.79688L20.4219 10.9531C21.5156 11.5625 21.5156 12.4375 20.4219 13.0625L16.625 15.2031L16.5469 15.25Z" fill="#FBBC04"/>
    <path d="M16.625 15.2031L13.3281 11.9688L3.60938 21.625C3.95312 21.9844 4.53125 22.0312 5.1875 21.6562L16.625 15.2031Z" fill="#34A853"/>
    <path d="M16.625 8.79688L5.1875 2.34375C4.53125 1.96875 3.95312 2.01562 3.60938 2.375L13.3281 12.0312L16.625 8.79688Z" fill="#4285F4"/>
  </svg>
);

interface PayoutScreenProps {
  userData: UserData;
  updateUserData: (data: Partial<UserData>) => void;
}

const PayoutScreen: React.FC<PayoutScreenProps> = ({ userData, updateUserData }) => {
  const [mcAmount, setMcAmount] = useState<string>('1');
  const [mcNametag, setMcNametag] = useState<string>(userData.minecraftUsername || '');
  const [gpOption, setGpOption] = useState<number>(10);
  const [confirmModal, setConfirmModal] = useState<{
    show: boolean;
    type: 'GP' | 'MC';
    title: string;
    cost: number;
    amount?: number;
  }>({ show: false, type: 'GP', title: '', cost: 0 });

  const gpOptions = [
    { label: '10rs', value: 10, cost: 1200 },
    { label: '20rs', value: 20, cost: 2400 },
    { label: '30rs', value: 30, cost: 3600 },
    { label: '100rs', value: 100, cost: 12000 },
    { label: '1000rs', value: 1000, cost: 120000 },
  ];

  const handleRedeemGooglePlay = () => {
    const option = gpOptions.find(o => o.value === gpOption);
    if (!option) return;
    
    if (userData.coinBalance < option.cost) {
      alert('Insufficient coins!');
      return;
    }

    setConfirmModal({
      show: true,
      type: 'GP',
      title: `${option.label} Google Play Code`,
      cost: option.cost
    });
  };

  const handleMinecraftTransferInitiate = () => {
    const amount = parseInt(mcAmount);
    if (isNaN(amount) || amount <= 0) {
      alert('Please enter a valid amount.');
      return;
    }
    if (!mcNametag.trim()) {
      alert('Please enter a Minecraft nametag.');
      return;
    }
    const cost = amount * 100;
    if (userData.coinBalance < cost) {
      alert('Insufficient coins!');
      return;
    }

    setConfirmModal({
      show: true,
      type: 'MC',
      title: `Minecraft Transfer: ${amount} Coins`,
      cost: cost,
      amount: amount
    });
  };

  const processRedemption = () => {
    if (confirmModal.type === 'GP') {
      const redeemCode = Math.random().toString(36).substring(2, 10).toUpperCase() + '-' + Math.random().toString(36).substring(2, 6).toUpperCase();
      
      const tx = {
        id: `tx_${Date.now()}`,
        amount: confirmModal.cost,
        coinAmount: -confirmModal.cost,
        rewardType: confirmModal.title,
        timestamp: Date.now(),
        status: 'SUCCESS' as const,
        destinationId: 'Shop',
        type: 'SHOP' as const,
        redeemCode
      };

      updateUserData({
        coinBalance: userData.coinBalance - confirmModal.cost,
        transactions: [...userData.transactions, tx]
      });

      alert(`Successfully redeemed ${confirmModal.title}! Check your wallet for the code.`);
    } else {
      const tx = {
        id: `tx_${Date.now()}`,
        amount: confirmModal.cost,
        coinAmount: -confirmModal.cost,
        rewardType: confirmModal.title,
        timestamp: Date.now(),
        status: 'PENDING' as const,
        destinationId: mcNametag.trim() || 'Unknown',
        type: 'SHOP' as const,
      };

      updateUserData({
        coinBalance: userData.coinBalance - confirmModal.cost,
        transactions: [...userData.transactions, tx]
      });

      alert(`Transfer of ${confirmModal.amount} Minecraft Coins to ${mcNametag.trim()} initiated! It will be processed within 24 hours.`);
    }
    setConfirmModal({ ...confirmModal, show: false });
  };

  return (
    <div className="space-y-6 animate-in fade-in duration-500">
      <div className="bg-slate-900 border border-slate-800 p-8 rounded-[2.5rem] shadow-2xl">
        <h2 className="text-2xl font-gaming font-bold text-white uppercase tracking-widest mb-2">Elite Shop</h2>
        <p className="text-slate-500 text-[10px] font-bold uppercase tracking-widest">Exchange your hard-earned coins for real rewards</p>
      </div>

      <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
        {/* Minecraft Transfer Card */}
        <div className="bg-slate-900 border border-slate-800 p-8 rounded-[2.5rem] relative overflow-hidden group hover:border-green-500/30 transition-all shadow-xl">
          <div className="absolute top-0 right-0 -mr-8 -mt-8 w-32 h-32 bg-green-500/5 rounded-full blur-2xl group-hover:bg-green-500/10 transition-all"></div>
          
          <div className="relative z-10 flex flex-col h-full">
            <div className="w-14 h-14 rounded-2xl bg-green-500/10 p-2 flex items-center justify-center mb-6">
              <MinecraftLogo />
            </div>
            
            <h3 className="text-xl font-bold text-white mb-2">Minecraft Coin Transfer</h3>
            <p className="text-slate-500 text-xs font-medium mb-6">Direct transfer to your Minecraft account. (100 Coins = 1 Minecoin)</p>
            
            <div className="space-y-4 mb-8">
              <div className="bg-slate-950 border border-slate-800 rounded-xl p-3">
                <p className="text-[8px] text-slate-500 font-bold uppercase tracking-widest mb-2">Amount to Transfer (Minecoins)</p>
                <input 
                  type="number"
                  value={mcAmount}
                  onChange={(e) => setMcAmount(e.target.value)}
                  className="w-full bg-transparent text-white font-gaming text-xl focus:outline-none"
                  min="1"
                />
              </div>
              <div className="bg-slate-950 border border-slate-800 rounded-xl p-3">
                <p className="text-[8px] text-slate-500 font-bold uppercase tracking-widest mb-2">Minecraft Nametag</p>
                <input 
                  type="text"
                  value={mcNametag}
                  onChange={(e) => setMcNametag(e.target.value)}
                  placeholder="Enter Nametag"
                  className="w-full bg-transparent text-white font-gaming text-sm focus:outline-none placeholder:text-slate-700"
                />
              </div>
              <div className="flex justify-between items-center px-2">
                <span className="text-[10px] text-slate-500 uppercase font-bold">Cost:</span>
                <span className="text-lg font-gaming font-bold text-cyan-400">{(parseInt(mcAmount) || 0) * 100} <span className="text-[10px] font-sans text-slate-500 uppercase">Coins</span></span>
              </div>
            </div>

            <button
              onClick={handleMinecraftTransferInitiate}
              className="w-full bg-green-600 hover:bg-green-500 text-white py-4 rounded-xl font-bold uppercase text-[10px] tracking-widest transition-all active:scale-95 shadow-lg shadow-green-900/20"
            >
              Transfer Now
            </button>
          </div>
        </div>

        {/* Google Play Card */}
        <div className="bg-slate-900 border border-slate-800 p-8 rounded-[2.5rem] relative overflow-hidden group hover:border-orange-500/30 transition-all shadow-xl">
          <div className="absolute top-0 right-0 -mr-8 -mt-8 w-32 h-32 bg-orange-500/5 rounded-full blur-2xl group-hover:bg-orange-500/10 transition-all"></div>
          
          <div className="relative z-10 flex flex-col h-full">
            <div className="w-14 h-14 rounded-2xl bg-orange-500/10 p-3 flex items-center justify-center mb-6">
              <GooglePlayLogo />
            </div>
            
            <h3 className="text-xl font-bold text-white mb-2">Google Play Codes</h3>
            <p className="text-slate-500 text-xs font-medium mb-6">Instant digital delivery to your wallet history.</p>
            
            <div className="space-y-4 mb-8">
              <div className="grid grid-cols-3 gap-2">
                {gpOptions.map((opt) => (
                  <button
                    key={opt.value}
                    onClick={() => setGpOption(opt.value)}
                    className={`py-2 rounded-lg text-[10px] font-bold uppercase tracking-widest transition-all border ${
                      gpOption === opt.value 
                      ? 'bg-orange-500 text-white border-orange-400' 
                      : 'bg-slate-950 text-slate-500 border-slate-800 hover:border-slate-700'
                    }`}
                  >
                    {opt.label}
                  </button>
                ))}
              </div>
              <div className="flex justify-between items-center px-2">
                <span className="text-[10px] text-slate-500 uppercase font-bold">Cost:</span>
                <span className="text-lg font-gaming font-bold text-orange-400">
                  {gpOptions.find(o => o.value === gpOption)?.cost} <span className="text-[10px] font-sans text-slate-500 uppercase">Coins</span>
                </span>
              </div>
            </div>

            <button
              onClick={handleRedeemGooglePlay}
              className="w-full bg-orange-500 hover:bg-orange-400 text-slate-950 py-4 rounded-xl font-bold uppercase text-[10px] tracking-widest transition-all active:scale-95 shadow-lg shadow-orange-900/20"
            >
              Redeem Code
            </button>
          </div>
        </div>
      </div>

      {/* Confirmation Modal */}
      {confirmModal.show && (
        <div className="fixed inset-0 z-[100] flex items-center justify-center p-4 bg-slate-950/90 backdrop-blur-md animate-in fade-in duration-200">
          <div className="bg-slate-900 border border-slate-800 w-full max-w-sm rounded-[2.5rem] p-8 shadow-2xl animate-in zoom-in-95 duration-200 text-center">
            <div className="w-16 h-16 bg-cyan-500/10 rounded-full flex items-center justify-center mx-auto mb-6 text-cyan-500 border border-cyan-500/20">
              <AlertCircle className="w-8 h-8" />
            </div>
            <h3 className="text-xl font-gaming font-bold text-white uppercase mb-2">Confirm Redemption</h3>
            <p className="text-slate-400 text-sm mb-2">
              Are you sure you want to redeem <span className="text-white font-bold">{confirmModal.title}</span> for <span className="text-cyan-400 font-bold">{confirmModal.cost} Coins</span>?
            </p>
            {confirmModal.type === 'MC' && (
              <p className="text-[10px] text-yellow-500/70 uppercase font-bold tracking-widest mb-6">
                Processing time: Up to 24 hours
              </p>
            )}
            <div className="flex gap-4 mt-4">
              <button 
                onClick={() => setConfirmModal({ ...confirmModal, show: false })}
                className="flex-1 py-4 rounded-2xl bg-slate-800 hover:bg-slate-700 text-white font-bold transition-all border border-slate-700 uppercase text-xs tracking-widest"
              >
                No
              </button>
              <button 
                onClick={processRedemption}
                className="flex-1 py-4 rounded-2xl bg-cyan-600 hover:bg-cyan-500 text-white font-bold transition-all shadow-lg shadow-cyan-900/20 uppercase text-xs tracking-widest"
              >
                Confirm
              </button>
            </div>
          </div>
        </div>
      )}
    </div>
  );
};

export default PayoutScreen;
