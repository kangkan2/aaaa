
import React, { useState, useEffect, useRef } from 'react';
import { UserData } from '../types';
import { Gamepad2, Trophy, Play, RotateCcw, X, Medal } from 'lucide-react';
import { db } from '../firebase';
import { collection, query, where, orderBy, limit, getDocs } from 'firebase/firestore';

interface PlaytimeScreenProps {
  userData: UserData;
  updateUserData: (data: Partial<UserData>) => void;
}

const PlaytimeScreen: React.FC<PlaytimeScreenProps> = ({ userData, updateUserData }) => {
  const [gameState, setGameState] = useState<'IDLE' | 'PLAYING' | 'GAMEOVER'>('IDLE');
  const [score, setScore] = useState(0);
  const [timeLeft, setTimeLeft] = useState(30);
  const [leaderboard, setLeaderboard] = useState<{username: string, score: number}[]>([]);
  const timerRef = useRef<NodeJS.Timeout | null>(null);

  const fetchLeaderboard = async () => {
    try {
      const q = query(
        collection(db, 'users'),
        where('highScore', '>', 0),
        orderBy('highScore', 'desc'),
        limit(5)
      );
      const querySnapshot = await getDocs(q);
      const sorted = querySnapshot.docs.map(doc => ({
        username: doc.data().username,
        score: doc.data().highScore
      }));
      setLeaderboard(sorted);
    } catch (error) {
      console.error("Error fetching leaderboard:", error);
    }
  };

  useEffect(() => {
    fetchLeaderboard();
  }, [userData.highScore]);

  const startGame = () => {
    setGameState('PLAYING');
    setScore(0);
    setTimeLeft(30);
  };

  const cancelGame = () => {
    if (timerRef.current) clearInterval(timerRef.current);
    setGameState('IDLE');
    setScore(0);
    setTimeLeft(30);
  };

  useEffect(() => {
    if (gameState === 'PLAYING' && timeLeft > 0) {
      timerRef.current = setInterval(() => {
        setTimeLeft(prev => prev - 1);
      }, 1000);
    } else if (timeLeft === 0) {
      setGameState('GAMEOVER');
      handleGameOver();
    }

    return () => {
      if (timerRef.current) clearInterval(timerRef.current);
    };
  }, [gameState, timeLeft]);

  const handleGameOver = () => {
    if (score > (userData.highScore || 0)) {
      updateUserData({ highScore: score });
    }
    
    // Reward logic: 1 coin for every 10 points
    const reward = Math.floor(score / 10);
    if (reward > 0) {
      const tx = {
        id: `tx_${Date.now()}`,
        amount: reward,
        coinAmount: reward,
        rewardType: 'Play MD Reward',
        timestamp: Date.now(),
        status: 'SUCCESS' as const,
        destinationId: 'Play MD',
        type: 'EARN' as const
      };

      updateUserData({
        coinBalance: userData.coinBalance + reward,
        lifetimeCoins: userData.lifetimeCoins + reward,
        transactions: [...userData.transactions, tx]
      });
    }
  };

  const handleClick = () => {
    if (gameState === 'PLAYING') {
      setScore(prev => prev + 1);
    }
  };

  return (
    <div className="space-y-6 animate-in fade-in duration-500">
      <div className="bg-slate-900 border border-slate-800 p-8 rounded-[2.5rem] shadow-2xl flex justify-between items-center">
        <div>
          <h2 className="text-2xl font-gaming font-bold text-white uppercase tracking-widest mb-2">Play MD</h2>
          <p className="text-slate-500 text-[10px] font-bold uppercase tracking-widest">Click fast to earn coins</p>
        </div>
        <div className="text-right">
          <p className="text-[10px] text-slate-500 font-bold uppercase tracking-widest mb-1">High Score</p>
          <div className="text-2xl font-gaming font-bold text-yellow-500">{userData.highScore || 0}</div>
        </div>
      </div>

      <div className="bg-slate-900 border border-slate-800 rounded-[3rem] p-10 text-center relative overflow-hidden shadow-2xl min-h-[400px] flex flex-col items-center justify-center">
        <div className="absolute inset-0 bg-[radial-gradient(circle_at_center,_var(--tw-gradient-stops))] from-cyan-500/5 via-transparent to-transparent"></div>
        
        {gameState === 'IDLE' && (
          <div className="relative z-10 space-y-8">
            <div className="w-24 h-24 bg-cyan-500/10 rounded-full flex items-center justify-center mx-auto text-cyan-400 border border-cyan-500/20 shadow-[0_0_30px_rgba(34,211,238,0.1)]">
              <Gamepad2 className="w-12 h-12" />
            </div>
            <div className="space-y-2">
              <h3 className="text-3xl font-gaming font-bold text-white uppercase">Ready to Play?</h3>
              <p className="text-slate-500 text-sm max-w-xs mx-auto">Click the button as many times as possible in 30 seconds. Earn 1 Coin for every 10 clicks!</p>
            </div>
            <button 
              onClick={startGame}
              className="bg-white text-slate-950 px-10 py-5 rounded-2xl font-bold uppercase text-sm tracking-[0.2em] shadow-xl hover:scale-105 active:scale-95 transition-all flex items-center gap-3 mx-auto"
            >
              <Play className="w-5 h-5 fill-current" /> Start Game
            </button>
          </div>
        )}

        {gameState === 'PLAYING' && (
          <div className="relative z-10 w-full max-w-sm space-y-10">
            <div className="flex justify-between items-end">
              <div className="text-left">
                <p className="text-[10px] text-slate-500 font-bold uppercase tracking-widest mb-1">Time Left</p>
                <div className={`text-4xl font-gaming font-bold ${timeLeft <= 5 ? 'text-red-500 animate-pulse' : 'text-white'}`}>{timeLeft}s</div>
              </div>
              <div className="text-right">
                <p className="text-[10px] text-slate-500 font-bold uppercase tracking-widest mb-1">Current Score</p>
                <div className="text-6xl font-gaming font-bold text-cyan-400">{score}</div>
              </div>
            </div>

            <button 
              onClick={handleClick}
              className="w-48 h-48 bg-slate-800 rounded-full border-8 border-slate-700 shadow-[0_0_50px_rgba(0,0,0,0.5)] active:scale-90 active:bg-slate-700 transition-all flex items-center justify-center group mx-auto"
            >
              <div className="w-32 h-32 bg-cyan-500 rounded-full shadow-[0_0_30px_rgba(34,211,238,0.5)] group-active:shadow-[0_0_15px_rgba(34,211,238,0.3)] transition-all flex items-center justify-center">
                <span className="text-slate-950 font-gaming font-bold text-4xl">TAP!</span>
              </div>
            </button>

            <button 
              onClick={cancelGame}
              className="flex items-center gap-2 mx-auto text-slate-500 hover:text-red-500 transition-colors uppercase text-[10px] font-bold tracking-widest"
            >
              <X size={14} /> Cancel Game
            </button>
          </div>
        )}

        {gameState === 'GAMEOVER' && (
          <div className="relative z-10 space-y-8">
            <div className="w-24 h-24 bg-yellow-500/10 rounded-full flex items-center justify-center mx-auto text-yellow-500 border border-yellow-500/20 shadow-[0_0_30px_rgba(234,179,8,0.1)]">
              <Trophy className="w-12 h-12" />
            </div>
            <div className="space-y-2">
              <h3 className="text-3xl font-gaming font-bold text-white uppercase">Game Over!</h3>
              <div className="text-6xl font-gaming font-bold text-cyan-400">{score}</div>
              <p className="text-slate-500 text-sm">You earned <span className="text-white font-bold">{Math.floor(score / 10)} Coins</span></p>
            </div>
            <div className="flex gap-4 justify-center">
              <button 
                onClick={startGame}
                className="bg-white text-slate-950 px-8 py-4 rounded-xl font-bold uppercase text-xs tracking-widest shadow-xl hover:scale-105 active:scale-95 transition-all flex items-center gap-2"
              >
                <RotateCcw className="w-4 h-4" /> Try Again
              </button>
            </div>
          </div>
        )}
      </div>

      {/* Leaderboard Section */}
      <div className="bg-slate-900 border border-slate-800 rounded-[2.5rem] overflow-hidden shadow-2xl">
        <div className="p-6 border-b border-slate-800 bg-slate-900/50 flex items-center gap-3">
           <Medal className="w-5 h-5 text-yellow-500" />
           <p className="text-[10px] font-bold text-slate-500 uppercase tracking-widest">Global Leaderboard</p>
        </div>
        <div className="divide-y divide-slate-800">
          {leaderboard.length === 0 ? (
            <div className="p-10 text-center text-slate-600 italic text-xs">
              No scores recorded yet. Be the first!
            </div>
          ) : (
            leaderboard.map((entry, idx) => (
              <div key={idx} className="p-5 flex justify-between items-center hover:bg-slate-800/20 transition-colors">
                <div className="flex items-center gap-4">
                  <div className={`w-8 h-8 rounded-lg flex items-center justify-center font-gaming font-bold text-xs ${
                    idx === 0 ? 'bg-yellow-500/20 text-yellow-500 border border-yellow-500/30' :
                    idx === 1 ? 'bg-slate-300/20 text-slate-300 border border-slate-300/30' :
                    idx === 2 ? 'bg-orange-500/20 text-orange-500 border border-orange-500/30' :
                    'bg-slate-800 text-slate-500'
                  }`}>
                    {idx + 1}
                  </div>
                  <span className="font-bold text-slate-200">{entry.username}</span>
                </div>
                <div className="text-right">
                  <span className="font-gaming font-bold text-cyan-400">{entry.score}</span>
                  <span className="text-[8px] text-slate-500 ml-1 uppercase font-bold">Pts</span>
                </div>
              </div>
            ))
          )}
        </div>
      </div>
    </div>
  );
};

export default PlaytimeScreen;
