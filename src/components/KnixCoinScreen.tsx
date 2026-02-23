
import React, { useState, useEffect, useMemo } from 'react';
import { UserData, Transaction } from '../types';
import { Html5QrcodeScanner } from 'html5-qrcode';
import QRCode from 'react-qr-code';
import { QrCode, ScanLine, X } from 'lucide-react';
import { db } from '../firebase';
import { doc, getDoc, setDoc, updateDoc, collection, query, where, getDocs, runTransaction } from 'firebase/firestore';

interface KnixCoinScreenProps {
  userData: UserData;
  updateUserData: (data: Partial<UserData>) => void;
}

interface MarketState {
  currentPrice: number;
  priceHistory: number[];
  totalCoinsBought: number;
}

const INITIAL_PRICE = 1000;
const IMPACT_FACTOR = 0.01; // 1% price impact per 1 ZPEXK traded

const KnixCoinScreen: React.FC<KnixCoinScreenProps> = ({ userData, updateUserData }) => {
  const [market, setMarket] = useState<MarketState>({
    currentPrice: INITIAL_PRICE,
    priceHistory: [INITIAL_PRICE],
    totalCoinsBought: 0
  });
  
  const [isPriceUp, setIsPriceUp] = useState(true);
  const [amountInput, setAmountInput] = useState<number>(0.1);
  const [showWithdrawQR, setShowWithdrawQR] = useState(false);
  
  // P2P Transfer State
  const [showTransferModal, setShowTransferModal] = useState(false);
  const [transferAmount, setTransferAmount] = useState<number>(0);
  const [destinationNumber, setDestinationNumber] = useState('');
  const [showTransferBill, setShowTransferBill] = useState(false);
  const [isProcessingTransfer, setIsProcessingTransfer] = useState(false);
  const [showSuccess, setShowSuccess] = useState(false);

  // Security & Confirmation State
  const [showBuyConfirm, setShowBuyConfirm] = useState(false);
  const [showSellConfirm, setShowSellConfirm] = useState(false);
  const [showPinEntry, setShowPinEntry] = useState<{ type: 'SELL' | 'TRANSFER' | 'SCAN', data?: any } | null>(null);
  const [pinInput, setPinInput] = useState('');
  const [showSellBill, setShowSellBill] = useState<{ amount: number, gain: number, tax: number } | null>(null);

  // QR Scanner & My QR State
  const [showScanner, setShowScanner] = useState(false);
  const [showMyQR, setShowMyQR] = useState(false);
  const [scannedID, setScannedID] = useState<string | null>(null);
  const [scanAmount, setScanAmount] = useState<number>(0);
  const [isProcessingScanTransfer, setIsProcessingScanTransfer] = useState(false);
  const [lastTransactionAmount, setLastTransactionAmount] = useState<number>(0);

  // Load Market State from Firestore
  useEffect(() => {
    const fetchMarket = async () => {
      try {
        const marketDocRef = doc(db, 'market', 'state');
        const marketDoc = await getDoc(marketDocRef);
        if (marketDoc.exists()) {
          setMarket(marketDoc.data() as MarketState);
        } else {
          // Initialize market state in Firestore if it doesn't exist
          const initialState: MarketState = {
            currentPrice: INITIAL_PRICE,
            priceHistory: [INITIAL_PRICE],
            totalCoinsBought: 0
          };
          await setDoc(marketDocRef, initialState);
          setMarket(initialState);
        }
      } catch (error) {
        console.error("Error fetching market state:", error);
      }
    };
    fetchMarket();
  }, []);

  // Save Market State to Firestore
  const updateMarket = async (newMarket: MarketState) => {
    setMarket(newMarket);
    try {
      const marketDocRef = doc(db, 'market', 'state');
      await setDoc(marketDocRef, newMarket);
    } catch (error) {
      console.error("Error updating market state:", error);
    }
  };

  // Robust Synthesized Audio Engine (Fixes CORS/Broken link issues)
  const playSynthesizedSuccess = () => {
    try {
      const AudioCtx = window.AudioContext || (window as any).webkitAudioContext;
      const ctx = new AudioCtx();
      
      const playTone = (freq: number, start: number, duration: number) => {
        const osc = ctx.createOscillator();
        const gain = ctx.createGain();
        osc.type = 'sine';
        osc.frequency.setValueAtTime(freq, ctx.currentTime + start);
        gain.gain.setValueAtTime(0, ctx.currentTime + start);
        gain.gain.linearRampToValueAtTime(0.1, ctx.currentTime + start + 0.05);
        gain.gain.exponentialRampToValueAtTime(0.01, ctx.currentTime + start + duration);
        osc.connect(gain);
        gain.connect(ctx.destination);
        osc.start(ctx.currentTime + start);
        osc.stop(ctx.currentTime + start + duration);
      };

      // Professional "GPay" style dual-tone notification
      playTone(523.25, 0, 0.4); // C5
      playTone(659.25, 0.1, 0.5); // E5
    } catch (e) {
      console.warn("Audio synthesis failed", e);
    }
  };

  const handleBuy = () => {
    if (amountInput <= 0) return;
    const cost = Math.floor(amountInput * market.currentPrice);
    if (userData.coinBalance < cost) {
      alert("Insufficient Coins to complete purchase.");
      return;
    }
    setShowBuyConfirm(true);
  };

  const handleBuyConfirm = () => {
    const cost = Math.floor(amountInput * market.currentPrice);
    const priceChange = market.currentPrice * (amountInput * IMPACT_FACTOR);
    const newPrice = market.currentPrice + priceChange;
    
    const newMarket: MarketState = {
      currentPrice: newPrice,
      priceHistory: [...market.priceHistory, newPrice].slice(-40),
      totalCoinsBought: market.totalCoinsBought + amountInput
    };

    updateMarket(newMarket);
    setIsPriceUp(true);

    const tx: Transaction = {
      id: `zpexk_buy_${Date.now()}`,
      amount: amountInput,
      coinAmount: -cost,
      rewardType: `Bought ${amountInput.toFixed(2)} $ZPEXK`,
      timestamp: Date.now(),
      status: 'SUCCESS',
      destinationId: 'ZPEXK_MARKET',
      type: 'SHOP'
    };

    updateUserData({
      coinBalance: userData.coinBalance - cost,
      knixBalance: (userData.knixBalance || 0) + amountInput,
      transactions: [...userData.transactions, tx]
    });
    setLastTransactionAmount(amountInput);
    setShowBuyConfirm(false);
    setShowSuccess(true);
    playSynthesizedSuccess();
  };

  const handleSell = () => {
    if (amountInput <= 0) return;
    const userKnix = userData.knixBalance || 0;
    if (userKnix < amountInput) {
      alert("Insufficient $ZPEXK inventory.");
      return;
    }
    setShowSellConfirm(true);
  };

  const handleSellConfirm = () => {
    setShowSellConfirm(false);
    if (!userData.pin) {
      alert("Please set a security PIN in your profile first.");
      return;
    }
    setShowPinEntry({ type: 'SELL' });
  };

  const handleSellFinal = (amount: number, gain: number) => {
    const priceChange = market.currentPrice * (amount * IMPACT_FACTOR);
    const newPrice = Math.max(10, market.currentPrice - priceChange); 
    
    const newMarket: MarketState = {
      currentPrice: newPrice,
      priceHistory: [...market.priceHistory, newPrice].slice(-40),
      totalCoinsBought: market.totalCoinsBought
    };

    updateMarket(newMarket);
    setIsPriceUp(false);

    const tx: Transaction = {
      id: `zpexk_sell_${Date.now()}`,
      amount: amount,
      coinAmount: gain,
      rewardType: `Sold ${amount.toFixed(2)} $ZPEXK (11% Tax Applied)`,
      timestamp: Date.now(),
      status: 'SUCCESS',
      destinationId: 'ZPEXK_MARKET',
      type: 'EARN'
    };

    updateUserData({
      coinBalance: userData.coinBalance + gain,
      knixBalance: (userData.knixBalance || 0) - amount,
      transactions: [...userData.transactions, tx]
    });
    setLastTransactionAmount(amount);
    setShowSellBill(null);
    playSynthesizedSuccess();
    setShowSuccess(true);
  };

  const handlePinVerify = () => {
    if (pinInput !== userData.pin) {
      alert("Incorrect Security PIN.");
      setPinInput('');
      return;
    }

    const type = showPinEntry?.type;
    const data = showPinEntry?.data;
    setShowPinEntry(null);
    setPinInput('');

    if (type === 'SELL') {
      const grossGain = Math.floor(amountInput * market.currentPrice);
      const tax = Math.floor(grossGain * 0.11);
      const netGain = grossGain - tax;
      setShowSellBill({ amount: amountInput, gain: netGain, tax });
    } else if (type === 'TRANSFER') {
      handleTransferFinal();
    } else if (type === 'SCAN') {
      handleScanTransferFinal();
    }
  };

  const initiateTransfer = () => {
    if (destinationNumber.length !== 10) {
      alert("Please enter a valid 10-digit ZPEXK Number.");
      return;
    }
    if (transferAmount <= 0) {
      alert("Enter a valid amount to transfer.");
      return;
    }
    if ((userData.knixBalance || 0) < transferAmount) {
      alert("Insufficient ZPEXK balance.");
      return;
    }
    if (destinationNumber === userData.zpexkNumber) {
      alert("You cannot transfer to yourself.");
      return;
    }
    setShowTransferBill(true);
  };

  const handleTransferConfirm = () => {
    if (!userData.pin) {
      alert("Please set a security PIN in your profile first.");
      return;
    }
    setShowTransferBill(false);
    setShowPinEntry({ type: 'TRANSFER' });
  };

  const handleTransferFinal = async () => {
    setIsProcessingTransfer(true);
    
    try {
      const q = query(collection(db, 'users'), where('zpexkNumber', '==', destinationNumber));
      const querySnapshot = await getDocs(q);

      if (querySnapshot.empty) {
        alert("Recipient not found. Check the ZPEXK Number.");
        setIsProcessingTransfer(false);
        return;
      }

      const receiverDoc = querySnapshot.docs[0];
      const receiverData = receiverDoc.data() as UserData;
      const receiverId = receiverDoc.id;

      const senderTx: Transaction = {
        id: `zpexk_tx_sent_${Date.now()}`,
        amount: transferAmount,
        coinAmount: 0,
        rewardType: `Sent ZPEXK to ${destinationNumber}`,
        timestamp: Date.now(),
        status: 'SUCCESS',
        destinationId: destinationNumber,
        type: 'TRANSFER'
      };

      const receiverTx: Transaction = {
        id: `zpexk_tx_recv_${Date.now()}`,
        amount: transferAmount,
        coinAmount: 0,
        rewardType: `Received ZPEXK from ${userData.zpexkNumber}`,
        timestamp: Date.now(),
        status: 'SUCCESS',
        destinationId: userData.zpexkNumber || 'SYSTEM',
        type: 'EARN'
      };

      // Atomic update using Firestore Transaction
      await runTransaction(db, async (transaction) => {
        const senderDocRef = doc(db, 'users', userData.id);
        const receiverDocRef = doc(db, 'users', receiverId);

        transaction.update(receiverDocRef, {
          knixBalance: (receiverData.knixBalance || 0) + transferAmount,
          transactions: [...receiverData.transactions, receiverTx]
        });

        transaction.update(senderDocRef, {
          knixBalance: (userData.knixBalance || 0) - transferAmount,
          transactions: [...userData.transactions, senderTx]
        });
      });

      setLastTransactionAmount(transferAmount);
      setIsProcessingTransfer(false);
      setShowTransferModal(false);
      
      playSynthesizedSuccess();
      setShowSuccess(true);
    } catch (error) {
      console.error("Transfer failed:", error);
      alert("Transfer failed. Please try again.");
      setIsProcessingTransfer(false);
    }
  };

  const handleScanTransferConfirm = () => {
    if (!scannedID || scanAmount <= 0) return;
    if ((userData.knixBalance || 0) < scanAmount) {
      alert("Insufficient ZPEXK balance.");
      return;
    }
    if (scannedID === userData.zpexkNumber) {
      alert("You cannot transfer to yourself.");
      return;
    }
    if (!userData.pin) {
      alert("Please set a security PIN in your profile first.");
      return;
    }
    setShowPinEntry({ type: 'SCAN' });
  };

  const handleScanTransferFinal = async () => {
    setIsProcessingScanTransfer(true);
    
    try {
      const q = query(collection(db, 'users'), where('zpexkNumber', '==', scannedID));
      const querySnapshot = await getDocs(q);

      if (querySnapshot.empty) {
        alert("Recipient not found. Check the ZPEXK Number.");
        setIsProcessingScanTransfer(false);
        return;
      }

      const receiverDoc = querySnapshot.docs[0];
      const receiverData = receiverDoc.data() as UserData;
      const receiverId = receiverDoc.id;

      const senderTx: Transaction = {
        id: `zpexk_scan_sent_${Date.now()}`,
        amount: scanAmount,
        coinAmount: 0,
        rewardType: `Sent ZPEXK via Scan to ${scannedID}`,
        timestamp: Date.now(),
        status: 'SUCCESS',
        destinationId: scannedID,
        type: 'TRANSFER'
      };

      const receiverTx: Transaction = {
        id: `zpexk_scan_recv_${Date.now()}`,
        amount: scanAmount,
        coinAmount: 0,
        rewardType: `Received ZPEXK via Scan from ${userData.zpexkNumber}`,
        timestamp: Date.now(),
        status: 'SUCCESS',
        destinationId: userData.zpexkNumber || 'SYSTEM',
        type: 'EARN'
      };

      // Atomic update using Firestore Transaction
      await runTransaction(db, async (transaction) => {
        const senderDocRef = doc(db, 'users', userData.id);
        const receiverDocRef = doc(db, 'users', receiverId);

        transaction.update(receiverDocRef, {
          knixBalance: (receiverData.knixBalance || 0) + scanAmount,
          transactions: [...receiverData.transactions, receiverTx]
        });

        transaction.update(senderDocRef, {
          knixBalance: (userData.knixBalance || 0) - scanAmount,
          transactions: [...userData.transactions, senderTx]
        });
      });

      setLastTransactionAmount(scanAmount);
      setIsProcessingScanTransfer(false);
      setScannedID(null);
      setScanAmount(0);
      playSynthesizedSuccess();
      setShowSuccess(true);
    } catch (error) {
      console.error("Scan transfer failed:", error);
      alert("Transfer failed. Please try again.");
      setIsProcessingScanTransfer(false);
    }
  };

  useEffect(() => {
    let scanner: Html5QrcodeScanner | null = null;
    if (showScanner) {
      scanner = new Html5QrcodeScanner(
        "qr-reader",
        { fps: 10, qrbox: { width: 250, height: 250 } },
        false
      );

      scanner.render(
        (decodedText) => {
          if (decodedText.length === 10 && /^\d+$/.test(decodedText)) {
            setScannedID(decodedText);
            setShowScanner(false);
            if (scanner) {
              scanner.clear().catch(err => console.error("Failed to clear scanner", err));
            }
          }
        },
        (error) => {
          // Silent errors during scanning are normal
        }
      );
    }

    return () => {
      if (scanner) {
        scanner.clear().catch(err => console.error("Cleanup failed", err));
      }
    };
  }, [showScanner]);

  const candlesticks = useMemo(() => {
    const history = market.priceHistory;
    if (history.length < 2) return [];

    const minPrice = Math.min(...history) * 0.98;
    const maxPrice = Math.max(...history) * 1.02;
    const range = maxPrice - minPrice;
    const width = 1000;
    const height = 300;
    
    const candleWidth = width / history.length;
    
    return history.map((close, i) => {
      if (i === 0) return null;
      const open = history[i - 1];
      const isUp = close >= open;
      
      const high = Math.max(open, close) + (Math.abs(open - close) * 0.5);
      const low = Math.min(open, close) - (Math.abs(open - close) * 0.5);

      const getY = (price: number) => height - ((price - minPrice) / range) * height;

      return {
        x: i * candleWidth,
        openY: getY(open),
        closeY: getY(close),
        highY: getY(high),
        lowY: getY(low),
        isUp,
        color: isUp ? '#22c55e' : '#ef4444'
      };
    }).filter(c => c !== null);
  }, [market.priceHistory]);

  return (
    <div className="space-y-6 animate-in fade-in duration-700 pb-20">
      {/* Market Header */}
      <div className="bg-slate-900 border border-slate-800 p-8 rounded-[2.5rem] shadow-2xl relative overflow-hidden">
        <div className={`absolute top-0 right-0 -mr-20 -mt-20 w-80 h-80 ${isPriceUp ? 'bg-green-500/10' : 'bg-red-500/10'} rounded-full blur-3xl transition-all duration-1000`}></div>
        
        <div className="flex flex-col md:flex-row md:items-center justify-between gap-6 relative z-10">
           <div className="flex items-center gap-5">
              <div className="relative group">
                <div className="absolute inset-0 bg-yellow-500/10 rounded-full blur-md group-hover:blur-xl transition-all"></div>
                <div className="w-20 h-20 bg-slate-950 rounded-full flex items-center justify-center border-2 border-slate-800 shadow-2xl relative overflow-hidden">
                   <div className="w-full h-full rounded-full flex flex-col items-center justify-center bg-slate-950 border-4 border-slate-900">
                      <span className="text-[10px] font-bold text-cyan-400 leading-none">BITCH</span>
                      <span className="text-[10px] font-bold text-cyan-400 leading-none">COIN</span>
                      <span className="text-[7px] font-mono text-cyan-500/80 mt-1">$ZPEXK</span>
                   </div>
                </div>
              </div>
              <div>
                <h2 className="text-2xl font-gaming font-bold text-white uppercase tracking-[0.15em]">$ZPEXK Market</h2>
                <div className="flex items-center gap-2 mt-1">
                  <span className="w-2 h-2 rounded-full bg-yellow-500 animate-pulse"></span>
                  <p className="text-slate-500 text-[10px] font-bold uppercase tracking-widest">Global P2P Exchange</p>
                </div>
              </div>
           </div>

           <div className="bg-slate-950/50 border border-slate-800 px-6 py-4 rounded-2xl text-right">
              <p className="text-[10px] text-slate-500 font-bold uppercase tracking-widest mb-1">Exchange Rate</p>
              <div className="flex items-center gap-3 justify-end">
                <span className={`font-gaming font-bold text-4xl ${isPriceUp ? 'text-green-400' : 'text-red-500'} drop-shadow-lg`}>
                  {market.currentPrice.toFixed(0)}
                </span>
                <span className="text-[10px] font-bold text-slate-500 uppercase">Coins / ZPEXK</span>
              </div>
           </div>
        </div>

        {/* Chart */}
        <div className="mt-10 relative bg-black/90 border border-slate-800 rounded-[2.5rem] p-6 h-72 flex items-end overflow-hidden group shadow-inner">
          <div className="absolute inset-0 opacity-10 pointer-events-none" style={{backgroundImage: 'radial-gradient(circle at 2px 2px, #334155 1px, transparent 0)', backgroundSize: '32px 32px'}}></div>
          
          <svg viewBox="0 0 1000 300" className="w-full h-full" preserveAspectRatio="none">
             {candlesticks.map((candle, idx) => {
               if (!candle) return null;
               const bodyHeight = Math.max(2, Math.abs(candle.openY - candle.closeY));
               const bodyY = Math.min(candle.openY, candle.closeY);
               
               return (
                 <g key={idx}>
                   {/* Wick */}
                   <line 
                     x1={candle.x} 
                     y1={candle.highY} 
                     x2={candle.x} 
                     y2={candle.lowY} 
                     stroke={candle.color} 
                     strokeWidth="1.5" 
                   />
                   {/* Body */}
                   <rect 
                     x={candle.x - 6} 
                     y={bodyY} 
                     width="12" 
                     height={bodyHeight} 
                     fill={candle.color}
                     className="transition-all duration-300"
                   />
                 </g>
               );
             })}
          </svg>
          
          <div className="absolute top-6 left-8 flex items-center gap-3">
            <div className={`px-3 py-1 rounded-md text-[9px] font-bold uppercase tracking-tighter bg-slate-800 border border-slate-700 text-white`}>
              MARKET: <span className={isPriceUp ? 'text-green-400' : 'text-red-400'}>{isPriceUp ? 'BULLISH' : 'BEARISH'}</span>
            </div>
            <span className="text-[10px] font-bold text-slate-600 uppercase tracking-widest">OHLC Candlestick Feed</span>
          </div>
        </div>

        {/* Market Stats */}
        <div className="mt-10 grid grid-cols-1 sm:grid-cols-3 gap-6">
          <div className="bg-slate-950/60 p-6 rounded-3xl border border-slate-800 group hover:border-yellow-500/30 transition-all">
             <p className="text-[10px] text-slate-500 font-bold uppercase tracking-widest mb-2">My Inventory</p>
             <div className="flex items-end gap-2">
                <span className="text-3xl font-gaming font-bold text-white">{(userData.knixBalance || 0).toFixed(2)}</span>
                <span className="text-[10px] font-bold text-yellow-500 uppercase tracking-widest mb-1">$ZPEXK</span>
             </div>
          </div>
          <div className="bg-slate-950/60 p-6 rounded-3xl border border-slate-800 group hover:border-green-500/30 transition-all">
             <p className="text-[10px] text-slate-500 font-bold uppercase tracking-widest mb-2">Global Buy Vol.</p>
             <div className="flex items-end gap-2">
                <span className="text-3xl font-gaming font-bold text-green-400">{market.totalCoinsBought.toFixed(2)}</span>
                <span className="text-[10px] font-bold text-slate-600 uppercase tracking-widest mb-1">Total Minted</span>
             </div>
          </div>
          <div className="bg-slate-950/60 p-6 rounded-3xl border border-slate-800 group hover:border-cyan-500/30 transition-all">
             <p className="text-[10px] text-slate-500 font-bold uppercase tracking-widest mb-2">Portfolio Value</p>
             <div className="flex items-end gap-2">
                <span className="text-3xl font-gaming font-bold text-cyan-400">
                  {((userData.knixBalance || 0) * market.currentPrice).toLocaleString(undefined, { maximumFractionDigits: 0 })}
                </span>
                <span className="text-[10px] font-bold text-slate-600 uppercase tracking-widest mb-1">Coins</span>
             </div>
          </div>
        </div>
      </div>

      {/* Trade Terminal */}
      <div className="bg-slate-900 border border-slate-800 p-8 rounded-[2.5rem] shadow-2xl">
          <div className="flex justify-between items-center mb-10">
            <h3 className="text-xl font-gaming font-bold text-white uppercase tracking-widest">Execute Order</h3>
            <div className="flex flex-wrap gap-2">
               <button 
                  onClick={() => setShowScanner(true)}
                  className="px-4 py-2.5 bg-cyan-600/10 hover:bg-cyan-600/20 rounded-xl text-cyan-500 transition-all border border-cyan-500/20 text-[10px] font-bold uppercase tracking-[0.2em] flex items-center gap-2"
               >
                  <ScanLine size={14} />
                  Scan
               </button>
               <button 
                  onClick={() => setShowMyQR(true)}
                  className="px-4 py-2.5 bg-purple-600/10 hover:bg-purple-600/20 rounded-xl text-purple-500 transition-all border border-purple-500/20 text-[10px] font-bold uppercase tracking-[0.2em] flex items-center gap-2"
               >
                  <QrCode size={14} />
                  My ID
               </button>
               <button 
                  onClick={() => setShowTransferModal(true)}
                  className="px-4 py-2.5 bg-yellow-600/10 hover:bg-yellow-600/20 rounded-xl text-yellow-500 transition-all border border-yellow-500/20 text-[10px] font-bold uppercase tracking-[0.2em]"
               >
                  Send to User
               </button>
               <button 
                  onClick={() => setShowWithdrawQR(true)}
                  className="px-4 py-2.5 bg-slate-800 hover:bg-slate-700 rounded-xl text-slate-400 hover:text-white transition-all border border-slate-700 text-[10px] font-bold uppercase tracking-[0.2em]"
               >
                  Bridge
               </button>
            </div>
         </div>
         
         <div className="max-w-md mx-auto space-y-10">
            <div className="space-y-4">
              <label className="block text-[10px] font-bold text-slate-500 uppercase text-center tracking-[0.5em]">Volume (Units)</label>
              <div className="flex items-center bg-slate-950 border border-slate-800 rounded-3xl px-8 py-6 focus-within:ring-2 focus-within:ring-yellow-500/50 transition-all shadow-inner relative">
                 <input 
                   type="number" 
                   step="0.01"
                   min="0.01"
                   value={amountInput}
                   onChange={(e) => setAmountInput(parseFloat(e.target.value) || 0)}
                   className="w-full bg-transparent text-center text-4xl font-gaming font-bold text-white focus:outline-none"
                 />
                 <div className="absolute right-8 text-yellow-500 font-bold text-xs">ZPEXK</div>
              </div>
              <div className="flex justify-center gap-2">
                 {[0.01, 0.1, 1, 10].map(val => (
                   <button 
                    key={val}
                    onClick={() => setAmountInput(val)} 
                    className={`px-5 py-2 rounded-xl text-[10px] font-bold uppercase transition-all border ${amountInput === val ? 'bg-yellow-600 border-yellow-500 text-white' : 'bg-slate-800 border-slate-700 text-slate-500 hover:text-slate-300'}`}
                   >
                     {val < 1 ? val : val}
                   </button>
                 ))}
              </div>
            </div>

            <div className="flex gap-6">
               <button 
                 onClick={handleBuy}
                 disabled={amountInput <= 0}
                 className="flex-1 py-6 rounded-3xl font-bold text-xl transition-all active:scale-95 shadow-2xl bg-green-600 hover:bg-green-500 text-white shadow-green-900/40 uppercase tracking-widest flex flex-col items-center"
               >
                 <span>BUY</span>
                 <span className="text-[10px] opacity-70 mt-1">Price Up</span>
               </button>
               <button 
                 onClick={handleSell}
                 disabled={amountInput <= 0}
                 className="flex-1 py-6 rounded-3xl font-bold text-xl transition-all active:scale-95 shadow-2xl bg-red-600 hover:bg-red-500 text-white shadow-red-900/40 uppercase tracking-widest flex flex-col items-center"
               >
                 <span>SELL</span>
                 <span className="text-[10px] opacity-70 mt-1">Price Down</span>
               </button>
            </div>
         </div>
      </div>

      {/* P2P Transfer Modal */}
      {showTransferModal && (
        <div className="fixed inset-0 z-[60] flex items-center justify-center p-4 bg-slate-950/90 backdrop-blur-md animate-in fade-in duration-200">
          <div className="bg-slate-900 border border-slate-800 w-full max-w-sm rounded-[2.5rem] p-8 shadow-2xl animate-in zoom-in-95 duration-200">
            <h3 className="text-xl font-gaming font-bold text-white text-center mb-6 uppercase tracking-widest text-yellow-400">P2P Transfer</h3>
            
            <div className="space-y-6">
              <div>
                <label className="block text-[10px] font-bold text-slate-500 uppercase mb-2 tracking-widest">Receiver ZPEXK Number</label>
                <div className="bg-slate-950 border border-slate-800 rounded-2xl px-5 py-4 focus-within:ring-1 focus-within:ring-yellow-500 transition-all shadow-inner">
                  <input 
                    type="tel"
                    value={destinationNumber}
                    onChange={(e) => setDestinationNumber(e.target.value.replace(/\D/g, '').slice(0, 10))}
                    placeholder="10-Digit ID"
                    className="w-full bg-transparent text-white font-gaming tracking-[0.3em] text-center text-lg focus:outline-none placeholder:text-slate-700"
                  />
                </div>
              </div>

              <div>
                <label className="block text-[10px] font-bold text-slate-500 uppercase mb-2 tracking-widest">Amount to Send ($ZPEXK)</label>
                <div className="bg-slate-950 border border-slate-800 rounded-2xl px-5 py-4 focus-within:ring-1 focus-within:ring-yellow-500 transition-all shadow-inner">
                  <input 
                    type="number"
                    value={transferAmount}
                    onChange={(e) => setTransferAmount(parseFloat(e.target.value) || 0)}
                    placeholder="0.00"
                    className="w-full bg-transparent text-white font-gaming text-center text-2xl focus:outline-none"
                  />
                </div>
                <p className="text-[9px] text-slate-500 mt-2 text-right">Balance: {(userData.knixBalance || 0).toFixed(2)}</p>
              </div>

              <div className="flex gap-4 pt-2">
                <button 
                  onClick={() => setShowTransferModal(false)}
                  className="flex-1 py-4 rounded-xl bg-slate-800 text-white font-bold text-xs uppercase tracking-widest border border-slate-700"
                >
                  Cancel
                </button>
                <button 
                  onClick={initiateTransfer}
                  className="flex-1 py-4 rounded-xl bg-yellow-600 text-white font-bold text-xs uppercase tracking-widest shadow-lg shadow-yellow-900/20"
                >
                  Send
                </button>
              </div>
            </div>
          </div>
        </div>
      )}

      {/* Transfer Bill Confirmation */}
      {showTransferBill && (
        <div className="fixed inset-0 z-[70] flex items-center justify-center p-4 bg-slate-950/95 backdrop-blur-xl animate-in fade-in duration-200">
          <div className="bg-slate-900 border-2 border-yellow-500/20 w-full max-w-sm rounded-[3rem] p-10 shadow-2xl animate-in zoom-in-95 duration-200 text-center">
            <div className="w-16 h-16 bg-yellow-500/10 rounded-full flex items-center justify-center mx-auto mb-6 text-yellow-500">
               <svg className="w-8 h-8" fill="none" stroke="currentColor" viewBox="0 0 24 24"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M17 9V7a2 2 0 00-2-2H5a2 2 0 00-2 2v6a2 2 0 002 2h2m2 4h10a2 2 0 002-2v-6a2 2 0 00-2-2H9a2 2 0 00-2 2v6a2 2 0 002 2zm7-5a2 2 0 11-4 0 2 2 0 014 0z"/></svg>
            </div>
            
            <h3 className="text-xl font-gaming font-bold text-white uppercase mb-2">Transfer Bill</h3>
            <p className="text-slate-500 text-[10px] font-bold uppercase tracking-[0.3em] mb-8">Confirm Transaction</p>

            <div className="bg-slate-950/50 border border-slate-800 p-6 rounded-3xl mb-8 space-y-4">
               <div className="flex justify-between items-center text-sm border-b border-slate-800/50 pb-3">
                  <span className="text-slate-500 uppercase font-bold text-[10px]">Recipient</span>
                  <span className="text-white font-mono">{destinationNumber}</span>
               </div>
               <div className="flex justify-between items-center text-sm border-b border-slate-800/50 pb-3">
                  <span className="text-slate-500 uppercase font-bold text-[10px]">Asset</span>
                  <span className="text-yellow-400 font-bold">$ZPEXK</span>
               </div>
               <div className="flex justify-between items-center text-lg">
                  <span className="text-slate-500 uppercase font-bold text-[10px]">Total Pay</span>
                  <span className="text-white font-gaming font-bold">{transferAmount.toFixed(2)}</span>
               </div>
            </div>

            <div className="flex gap-4">
              <button 
                onClick={() => setShowTransferBill(false)}
                className="flex-1 py-4 rounded-2xl bg-slate-800 hover:bg-slate-700 text-white font-bold transition-all border border-slate-700 uppercase text-xs tracking-widest"
              >
                Cancel
              </button>
              <button 
                onClick={handleTransferConfirm}
                disabled={isProcessingTransfer}
                className="flex-1 py-4 rounded-2xl bg-yellow-600 hover:bg-yellow-500 text-white font-bold transition-all shadow-lg shadow-yellow-900/30 uppercase text-xs tracking-widest flex justify-center items-center"
              >
                {isProcessingTransfer ? (
                  <svg className="animate-spin h-5 w-5 text-white" viewBox="0 0 24 24">
                    <circle className="opacity-25" cx="12" cy="12" r="10" stroke="currentColor" strokeWidth="4" fill="none"></circle>
                    <path className="opacity-75" fill="currentColor" d="M4 12a8 8 0 018-8V0C5.373 0 0 5.373 0 12h4zm2 5.291A7.962 7.962 0 014 12H0c0 3.042 1.135 5.824 3 7.938l3-2.647z"></path>
                  </svg>
                ) : 'Confirm'}
              </button>
            </div>
          </div>
        </div>
      )}

      {/* P2P Success Success Modal */}
      {showSuccess && (
        <div className="fixed inset-0 z-[100] flex items-center justify-center p-4 bg-slate-950/95 backdrop-blur-xl animate-in fade-in duration-300">
          <div className="bg-slate-900 border-2 border-green-500/30 w-full max-w-sm rounded-[3rem] p-10 shadow-[0_0_50px_rgba(34,197,94,0.15)] text-center relative overflow-hidden animate-float">
             <div className="absolute inset-0 bg-gradient-to-br from-green-500/10 via-transparent to-transparent animate-rotate-slow"></div>
             
             <div className="w-20 h-20 bg-green-500 shadow-green-900/40 rounded-full flex items-center justify-center mx-auto mb-6 shadow-lg relative z-10 border-4 border-white/20">
                <svg className="w-10 h-10 text-white" fill="none" stroke="currentColor" viewBox="0 0 24 24"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth="4" d="M5 13l4 4L19 7"/></svg>
             </div>

             <h3 className="text-3xl font-gaming font-bold text-white uppercase mb-2 relative z-10 tracking-tighter">Success!</h3>
             <p className="text-green-400 text-[10px] font-bold uppercase tracking-[0.4em] mb-8 relative z-10">Transaction Confirmed</p>

             <div className="bg-slate-950/80 border border-slate-800 p-6 rounded-3xl mb-8 relative z-10 backdrop-blur-sm">
                <p className="text-[10px] text-slate-500 font-bold uppercase tracking-widest mb-2">Processed Assets</p>
                <div className="text-3xl font-gaming font-bold text-white tracking-wider">
                   {lastTransactionAmount.toFixed(2)} <span className="text-xs text-yellow-500">$ZPEXK</span>
                </div>
             </div>

             <button 
                onClick={() => setShowSuccess(false)}
                className="w-full py-4 rounded-2xl bg-green-600 hover:bg-green-500 shadow-lg shadow-green-900/30 text-white font-bold transition-all uppercase text-xs tracking-widest relative z-10 active:scale-95"
             >
                Back to Market
             </button>
          </div>
        </div>
      )}

      {/* Buy Confirmation Modal */}
      {showBuyConfirm && (
        <div className="fixed inset-0 z-[100] flex items-center justify-center p-4 bg-slate-950/90 backdrop-blur-md animate-in fade-in duration-200">
          <div className="bg-slate-900 border border-slate-800 w-full max-w-sm rounded-[2.5rem] p-8 shadow-2xl animate-in zoom-in-95 duration-200 text-center">
            <h3 className="text-xl font-gaming font-bold text-white uppercase mb-4 tracking-widest">Confirm Purchase</h3>
            <p className="text-slate-400 text-sm mb-8">Are you sure you want to buy {amountInput.toFixed(2)} $ZPEXK for {(amountInput * market.currentPrice).toLocaleString()} coins?</p>
            <div className="flex gap-4">
              <button onClick={() => setShowBuyConfirm(false)} className="flex-1 py-4 rounded-2xl bg-slate-800 text-white font-bold uppercase text-xs tracking-widest border border-slate-700">Cancel</button>
              <button onClick={handleBuyConfirm} className="flex-1 py-4 rounded-2xl bg-green-600 text-white font-bold uppercase text-xs tracking-widest shadow-lg shadow-green-900/20">OK</button>
            </div>
          </div>
        </div>
      )}

      {/* Sell Confirmation Modal */}
      {showSellConfirm && (
        <div className="fixed inset-0 z-[100] flex items-center justify-center p-4 bg-slate-950/90 backdrop-blur-md animate-in fade-in duration-200">
          <div className="bg-slate-900 border border-slate-800 w-full max-w-sm rounded-[2.5rem] p-8 shadow-2xl animate-in zoom-in-95 duration-200 text-center">
            <h3 className="text-xl font-gaming font-bold text-white uppercase mb-4 tracking-widest">Confirm Sale</h3>
            <p className="text-slate-400 text-sm mb-8">Are you sure you want to sell {amountInput.toFixed(2)} $ZPEXK?</p>
            <div className="flex gap-4">
              <button onClick={() => setShowSellConfirm(false)} className="flex-1 py-4 rounded-2xl bg-slate-800 text-white font-bold uppercase text-xs tracking-widest border border-slate-700">Cancel</button>
              <button onClick={handleSellConfirm} className="flex-1 py-4 rounded-2xl bg-red-600 text-white font-bold uppercase text-xs tracking-widest shadow-lg shadow-red-900/20">OK</button>
            </div>
          </div>
        </div>
      )}

      {/* PIN Entry Modal */}
      {showPinEntry && (
        <div className="fixed inset-0 z-[120] flex items-center justify-center p-4 bg-slate-950/95 backdrop-blur-xl animate-in fade-in duration-200">
          <div className="bg-slate-900 border border-slate-800 w-full max-w-sm rounded-[2.5rem] p-10 shadow-2xl animate-in zoom-in-95 duration-200 text-center">
            <div className="w-16 h-16 bg-purple-500/10 rounded-full flex items-center justify-center mx-auto mb-6 text-purple-500">
               <svg className="w-8 h-8" fill="none" stroke="currentColor" viewBox="0 0 24 24"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M12 15v2m-6 4h12a2 2 0 002-2v-6a2 2 0 00-2-2H6a2 2 0 00-2 2v6a2 2 0 002 2zm10-10V7a4 4 0 00-8 0v4h8z"/></svg>
            </div>
            <h3 className="text-xl font-gaming font-bold text-white uppercase mb-2 tracking-widest">Security PIN</h3>
            <p className="text-slate-500 text-[10px] font-bold uppercase tracking-widest mb-8">Enter your 2-digit PIN to authorize</p>
            
            <div className="bg-slate-950 border border-slate-800 rounded-2xl px-4 mb-8 focus-within:ring-2 focus-within:ring-purple-500 transition-all">
              <input 
                type="password"
                maxLength={2}
                value={pinInput}
                onChange={(e) => setPinInput(e.target.value.replace(/\D/g, '').slice(0, 2))}
                placeholder="••"
                className="w-full bg-transparent py-6 text-white text-center focus:outline-none placeholder:text-slate-800 text-4xl font-gaming tracking-[1em] font-bold"
              />
            </div>

            <div className="flex gap-4">
              <button onClick={() => { setShowPinEntry(null); setPinInput(''); }} className="flex-1 py-4 rounded-xl bg-slate-800 text-white font-bold text-xs uppercase tracking-widest border border-slate-700">Cancel</button>
              <button onClick={handlePinVerify} className="flex-1 py-4 rounded-xl bg-purple-600 text-white font-bold text-xs uppercase tracking-widest shadow-lg shadow-purple-900/20">Verify</button>
            </div>
          </div>
        </div>
      )}

      {/* Sell Bill Modal */}
      {showSellBill && (
        <div className="fixed inset-0 z-[130] flex items-center justify-center p-4 bg-slate-950/95 backdrop-blur-xl animate-in fade-in duration-200">
          <div className="bg-slate-900 border-2 border-red-500/20 w-full max-w-sm rounded-[3rem] p-10 shadow-2xl animate-in zoom-in-95 duration-200 text-center">
            <div className="w-16 h-16 bg-red-500/10 rounded-full flex items-center justify-center mx-auto mb-6 text-red-500">
               <svg className="w-8 h-8" fill="none" stroke="currentColor" viewBox="0 0 24 24"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M9 7h6m0 10v-3m-3 3h.01M9 17h.01M9 14h.01M12 14h.01M15 11h.01M12 11h.01M9 11h.01M7 21h10a2 2 0 002-2V5a2 2 0 00-2-2H7a2 2 0 00-2 2v14a2 2 0 002 2z"/></svg>
            </div>
            
            <h3 className="text-xl font-gaming font-bold text-white uppercase mb-2">Sale Invoice</h3>
            <p className="text-slate-500 text-[10px] font-bold uppercase tracking-[0.3em] mb-8">11% Network Tax Applied</p>

            <div className="bg-slate-950/50 border border-slate-800 p-6 rounded-3xl mb-8 space-y-4">
               <div className="flex justify-between items-center text-sm border-b border-slate-800/50 pb-3">
                  <span className="text-slate-500 uppercase font-bold text-[10px]">Units Sold</span>
                  <span className="text-white font-gaming">{showSellBill.amount.toFixed(2)}</span>
               </div>
               <div className="flex justify-between items-center text-sm border-b border-slate-800/50 pb-3">
                  <span className="text-slate-500 uppercase font-bold text-[10px]">Network Tax</span>
                  <span className="text-red-500 font-bold">-{showSellBill.tax.toLocaleString()} C</span>
               </div>
               <div className="flex justify-between items-center text-lg">
                  <span className="text-slate-500 uppercase font-bold text-[10px]">Net Payout</span>
                  <span className="text-green-400 font-gaming font-bold">{showSellBill.gain.toLocaleString()} C</span>
               </div>
            </div>

            <div className="flex gap-4">
              <button onClick={() => setShowSellBill(null)} className="flex-1 py-4 rounded-2xl bg-slate-800 text-white font-bold uppercase text-xs tracking-widest border border-slate-700">Cancel</button>
              <button onClick={() => handleSellFinal(showSellBill.amount, showSellBill.gain)} className="flex-1 py-4 rounded-2xl bg-red-600 text-white font-bold uppercase text-xs tracking-widest shadow-lg shadow-red-900/30">Confirm</button>
            </div>
          </div>
        </div>
      )}

      {/* Withdraw QR Bridge */}
      {showWithdrawQR && (
        <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-slate-950/90 backdrop-blur-md animate-in fade-in duration-200">
          <div className="bg-slate-900 border border-slate-800 w-full max-w-sm rounded-[3rem] p-10 shadow-2xl animate-in zoom-in-95 duration-200 text-center">
            <h3 className="text-xl font-gaming font-bold text-white uppercase tracking-wider mb-2">Off-Chain Bridge</h3>
            <p className="text-slate-500 text-[10px] font-bold uppercase tracking-widest mb-8">Scan to transfer ZPEXK assets</p>
            
            <div className="p-6 bg-white rounded-3xl shadow-2xl shadow-yellow-900/20 mb-8 mx-auto inline-block">
              <img 
                src="https://api.qrserver.com/v1/create-qr-code/?size=250x250&data=ZPEXK_BRIDGE_REQUEST" 
                alt="Bridge QR" 
                className="w-48 h-48 rounded-lg"
              />
            </div>

            <div className="space-y-4">
              <div className="bg-slate-950/80 p-5 rounded-2xl border border-slate-800">
                <p className="text-[10px] text-slate-400 font-bold uppercase tracking-widest">
                  Personal Bridge ID
                </p>
                <p className="text-xs font-mono font-bold text-yellow-400 mt-2 truncate">BID-{userData.id.substring(5, 12).toUpperCase()}</p>
              </div>
              <button 
                onClick={() => setShowWithdrawQR(false)}
                className="w-full py-4 rounded-2xl bg-slate-800 hover:bg-slate-700 text-white font-bold transition-all border border-slate-700 uppercase text-xs tracking-widest"
              >
                Close Bridge
              </button>
            </div>
          </div>
        </div>
      )}

      {/* QR Scanner Modal */}
      {showScanner && (
        <div className="fixed inset-0 z-[100] flex items-center justify-center p-4 bg-slate-950/95 backdrop-blur-xl animate-in fade-in duration-300">
          <div className="bg-slate-900 border border-slate-800 w-full max-w-md rounded-[2.5rem] p-6 shadow-2xl relative overflow-hidden">
            <div className="flex justify-between items-center mb-6">
              <h3 className="text-lg font-gaming font-bold text-white uppercase tracking-widest">Scan ZPEXK QR</h3>
              <button onClick={() => setShowScanner(false)} className="p-2 hover:bg-slate-800 rounded-full text-slate-400 transition-colors">
                <X size={20} />
              </button>
            </div>
            <div id="qr-reader" className="rounded-2xl overflow-hidden border border-slate-800 bg-black"></div>
            <p className="mt-6 text-center text-[10px] text-slate-500 font-bold uppercase tracking-widest">Align QR code within the frame to scan</p>
          </div>
        </div>
      )}

      {/* My QR Modal */}
      {showMyQR && (
        <div className="fixed inset-0 z-[100] flex items-center justify-center p-4 bg-slate-950/95 backdrop-blur-xl animate-in fade-in duration-300">
          <div className="bg-slate-900 border border-slate-800 w-full max-w-sm rounded-[2.5rem] p-10 shadow-2xl text-center relative overflow-hidden">
            <div className="absolute top-0 left-0 w-full h-1 bg-gradient-to-r from-transparent via-purple-500 to-transparent"></div>
            <h3 className="text-xl font-gaming font-bold text-white uppercase mb-2 tracking-widest">My ZPEXK ID</h3>
            <p className="text-slate-500 text-[10px] font-bold uppercase tracking-widest mb-8">Share this QR to receive coins</p>
            
            <div className="p-6 bg-white rounded-3xl shadow-2xl shadow-purple-900/20 mb-8 mx-auto inline-block">
              <QRCode 
                value={userData.zpexkNumber || ""} 
                size={200}
                style={{ height: "auto", maxWidth: "100%", width: "100%" }}
                viewBox={`0 0 256 256`}
              />
            </div>

            <div className="bg-slate-950/80 p-5 rounded-2xl border border-slate-800 mb-8">
              <p className="text-[10px] text-slate-400 font-bold uppercase tracking-widest mb-1">ZPEXK Number</p>
              <p className="text-2xl font-gaming font-bold text-purple-400 tracking-[0.2em]">{userData.zpexkNumber}</p>
            </div>

            <button 
              onClick={() => setShowMyQR(false)}
              className="w-full py-4 rounded-2xl bg-slate-800 hover:bg-slate-700 text-white font-bold transition-all border border-slate-700 uppercase text-xs tracking-widest"
            >
              Close
            </button>
          </div>
        </div>
      )}

      {/* Scanned Transfer Popup */}
      {scannedID && (
        <div className="fixed inset-0 z-[110] flex items-center justify-center p-4 bg-slate-950/95 backdrop-blur-xl animate-in fade-in duration-300">
          <div className="bg-slate-900 border border-slate-800 w-full max-w-sm rounded-[2.5rem] p-10 shadow-2xl animate-in zoom-in-95 duration-200">
            <div className="text-center mb-8">
              <p className="text-[10px] text-slate-500 font-bold uppercase tracking-widest mb-2">Sending to ID</p>
              <h3 className="text-2xl font-gaming font-bold text-cyan-400 tracking-[0.2em]">{scannedID}</h3>
            </div>
            
            <div className="space-y-6">
              <div>
                <label className="block text-[10px] font-bold text-slate-500 uppercase mb-2 tracking-widest">Enter Amount ($ZPEXK)</label>
                <div className="bg-slate-950 border border-slate-800 rounded-2xl px-5 py-4 focus-within:ring-1 focus-within:ring-cyan-500 transition-all shadow-inner">
                  <input 
                    type="number"
                    value={scanAmount}
                    onChange={(e) => setScanAmount(parseFloat(e.target.value) || 0)}
                    placeholder="0.00"
                    className="w-full bg-transparent text-white font-gaming text-center text-2xl focus:outline-none"
                  />
                </div>
                <p className="text-[9px] text-slate-500 mt-2 text-right">Available: {(userData.knixBalance || 0).toFixed(2)}</p>
              </div>

              <div className="flex gap-4 pt-2">
                <button 
                  onClick={() => { setScannedID(null); setScanAmount(0); }}
                  className="flex-1 py-4 rounded-xl bg-slate-800 text-white font-bold text-xs uppercase tracking-widest border border-slate-700"
                >
                  Cancel
                </button>
                <button 
                  onClick={handleScanTransferConfirm}
                  disabled={isProcessingScanTransfer || scanAmount <= 0}
                  className="flex-1 py-4 rounded-xl bg-cyan-600 text-white font-bold text-xs uppercase tracking-widest shadow-lg shadow-cyan-900/20 flex justify-center items-center"
                >
                  {isProcessingScanTransfer ? (
                    <svg className="animate-spin h-5 w-5 text-white" viewBox="0 0 24 24">
                      <circle className="opacity-25" cx="12" cy="12" r="10" stroke="currentColor" strokeWidth="4" fill="none"></circle>
                      <path className="opacity-75" fill="currentColor" d="M4 12a8 8 0 018-8V0C5.373 0 0 5.373 0 12h4zm2 5.291A7.962 7.962 0 014 12H0c0 3.042 1.135 5.824 3 7.938l3-2.647z"></path>
                    </svg>
                  ) : 'Confirm'}
                </button>
              </div>
            </div>
          </div>
        </div>
      )}
    </div>
  );
};

export default KnixCoinScreen;
