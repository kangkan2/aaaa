
import React, { useState, useEffect } from 'react';
import { AppScreen, UserData } from './types';
import Sidebar from './components/Sidebar';
import Dashboard from './components/Dashboard';
import TaskWall from './components/TaskWall';
import RedeemScreen from './components/RedeemScreen';
import ProfileScreen from './components/ProfileScreen';
import PayoutScreen from './components/PayoutScreen';
import KnixCoinScreen from './components/KnixCoinScreen';
import PlaytimeScreen from './components/PlaytimeScreen';
import Auth from './components/Auth';
import { auth, db } from './firebase';
import { onAuthStateChanged, signOut } from 'firebase/auth';
import { doc, getDoc, setDoc, updateDoc } from 'firebase/firestore';

const SESSION_KEY = 'mcreward_active_session_id';
const ACCOUNTS_DB_KEY = 'mcreward_accounts_database';

const App: React.FC = () => {
  const [currentScreen, setCurrentScreen] = useState<AppScreen>(AppScreen.DASHBOARD);
  const [userData, setUserData] = useState<UserData | null>(null);
  const [isAuthChecking, setIsAuthChecking] = useState(true);
  const [showLogoutConfirm, setShowLogoutConfirm] = useState(false);

  useEffect(() => {
    const unsubscribe = onAuthStateChanged(auth, async (firebaseUser) => {
      if (firebaseUser) {
        try {
          const userDocRef = doc(db, 'users', firebaseUser.uid);
          const userDoc = await getDoc(userDocRef);
          
          if (userDoc.exists()) {
            setUserData(userDoc.data() as UserData);
            localStorage.setItem(SESSION_KEY, firebaseUser.uid);
          } else {
            // This might happen if Auth component hasn't finished saving yet
            // or if the user was deleted from Firestore but not Auth
            setUserData(null);
          }
        } catch (error) {
          console.error("Error fetching user data from Firestore:", error);
          setUserData(null);
        }
      } else {
        setUserData(null);
        localStorage.removeItem(SESSION_KEY);
      }
      setIsAuthChecking(false);
    });

    return () => unsubscribe();
  }, []);

  // Persist user data changes to Firestore
  useEffect(() => {
    if (userData) {
      const syncData = async () => {
        try {
          const userDocRef = doc(db, 'users', userData.id);
          await setDoc(userDocRef, userData, { merge: true });
        } catch (e) {
          console.error("Firestore sync failed", e);
        }
      };
      syncData();
    }
  }, [userData]);

  const handleAuthComplete = (user: UserData) => {
    setUserData(user);
    localStorage.setItem(SESSION_KEY, user.id);
    setCurrentScreen(AppScreen.DASHBOARD);
  };

  const confirmLogout = async () => {
    try {
      await signOut(auth);
      localStorage.removeItem(SESSION_KEY);
      setUserData(null);
      setShowLogoutConfirm(false);
      setCurrentScreen(AppScreen.DASHBOARD);
    } catch (error) {
      console.error("Logout failed", error);
    }
  };

  const updateUserData = (newData: Partial<UserData>) => {
    setUserData(prev => prev ? ({ ...prev, ...newData }) : null);
  };

  if (isAuthChecking) {
    return (
      <div className="min-h-screen bg-slate-950 flex items-center justify-center">
        <div className="w-12 h-12 border-4 border-cyan-500/20 border-t-cyan-500 rounded-full animate-spin"></div>
      </div>
    );
  }

  if (!userData) {
    return <Auth onAuthComplete={handleAuthComplete} />;
  }

  const renderScreen = () => {
    switch (currentScreen) {
      case AppScreen.DASHBOARD:
        return <Dashboard 
          userData={userData} 
          updateUserData={updateUserData} 
          onNavigate={setCurrentScreen} 
        />;
      case AppScreen.TASK_WALL:
        return <TaskWall userData={userData} updateUserData={updateUserData} />;
      case AppScreen.REDEEM:
        return <RedeemScreen userData={userData} updateUserData={updateUserData} />;
      case AppScreen.PAYOUT:
        return <PayoutScreen userData={userData} updateUserData={updateUserData} />;
      case AppScreen.KNIX_COIN:
        return <KnixCoinScreen userData={userData} updateUserData={updateUserData} />;
      case AppScreen.PLAYTIME:
        return <PlaytimeScreen userData={userData} updateUserData={updateUserData} />;
      case AppScreen.PROFILE:
        return <ProfileScreen userData={userData} updateUserData={updateUserData} onLogout={() => setShowLogoutConfirm(true)} onNavigate={setCurrentScreen} />;
      default:
        return <Dashboard userData={userData} updateUserData={updateUserData} onNavigate={setCurrentScreen} />;
    }
  };

  const getProfileBgColor = (username: string) => {
    const colors = [
      'bg-red-600', 'bg-blue-600', 'bg-green-600', 'bg-yellow-600', 
      'bg-purple-600', 'bg-pink-600', 'bg-indigo-600', 'bg-teal-600', 'bg-orange-600'
    ];
    const charCodeSum = username.split('').reduce((acc, char) => acc + char.charCodeAt(0), 0);
    return colors[charCodeSum % colors.length];
  };

  return (
    <div className="flex h-[100dvh] bg-slate-950 text-slate-200 overflow-hidden font-sans">
      <Sidebar activeScreen={currentScreen} onNavigate={setCurrentScreen} />
      
      <main className="flex-1 overflow-y-auto p-4 md:p-8 bg-[radial-gradient(ellipse_at_top_right,_var(--tw-gradient-stops))] from-cyan-900/20 via-slate-950 to-slate-950">
        <div className="max-w-4xl mx-auto pb-20">
          <header className="flex justify-between items-center mb-8 sticky top-0 z-30 py-2 backdrop-blur-sm bg-slate-950/20 rounded-b-2xl px-2">
            <div>
              <h1 className="text-2xl md:text-3xl font-gaming font-bold text-transparent bg-clip-text bg-gradient-to-r from-cyan-400 to-blue-600">
                MCREWARD
              </h1>
            </div>
            
            <div className="flex items-center gap-2 md:gap-4">
              <div className="flex items-center gap-2 md:gap-3 bg-slate-900/90 border border-slate-800 rounded-2xl px-3 md:px-4 py-1.5 md:py-2 shadow-lg neon-glow">
                <div className="w-6 h-6 md:w-8 md:h-8 bg-gradient-to-br from-yellow-400 to-amber-600 rounded-full flex items-center justify-center shadow-inner">
                  <span className="text-white font-bold text-[10px] md:text-xs">C</span>
                </div>
                <span className="font-gaming font-bold text-base md:text-xl tracking-wider text-yellow-500">
                  {userData.coinBalance.toLocaleString()}
                </span>
              </div>

              <button 
                onClick={() => setCurrentScreen(AppScreen.PROFILE)}
                className={`relative w-10 h-10 md:w-12 md:h-12 rounded-full flex items-center justify-center border transition-all active:scale-90 group shadow-lg ${getProfileBgColor(userData.username)} ${
                  currentScreen === AppScreen.PROFILE 
                  ? 'border-white ring-4 ring-white/20 shadow-[0_0_20px_rgba(255,255,255,0.3)]' 
                  : 'border-slate-800 hover:border-white/50'
                }`}
              >
                <div className="text-sm md:text-base font-bold uppercase text-white drop-shadow-md">
                  {userData.username.charAt(0)}
                </div>
              </button>
            </div>
          </header>

          {renderScreen()}
        </div>
      </main>

      {/* Logout Confirmation Modal */}
      {showLogoutConfirm && (
        <div className="fixed inset-0 z-[100] flex items-center justify-center p-4 bg-slate-950/90 backdrop-blur-md animate-in fade-in duration-200">
          <div className="bg-slate-900 border border-slate-800 w-full max-w-sm rounded-[2.5rem] p-8 shadow-2xl animate-in zoom-in-95 duration-200">
            <div className="w-16 h-16 bg-red-500/10 rounded-full flex items-center justify-center mx-auto mb-6 text-red-500">
              <svg className="w-8 h-8" fill="none" stroke="currentColor" viewBox="0 0 24 24"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M17 16l4-4m0 0l-4-4m4 4H7m6 4v1a3 3 0 01-3 3H6a3 3 0 01-3-3V7a3 3 0 013-3h4a3 3 0 013 3v1"/></svg>
            </div>
            <h3 className="text-xl font-bold text-white text-center mb-2 uppercase tracking-widest font-gaming">Logout</h3>
            <p className="text-slate-400 text-center text-sm mb-8">Are you sure you want to end your current gaming session?</p>
            <div className="flex gap-4">
              <button 
                onClick={() => setShowLogoutConfirm(false)}
                className="flex-1 py-4 rounded-2xl bg-slate-800 hover:bg-slate-700 text-white font-bold transition-all border border-slate-700 uppercase text-xs tracking-widest"
              >
                Cancel
              </button>
              <button 
                onClick={confirmLogout}
                className="flex-1 py-4 rounded-2xl bg-red-600 hover:bg-red-500 text-white font-bold transition-all shadow-lg shadow-red-900/20 uppercase text-xs tracking-widest"
              >
                OK
              </button>
            </div>
          </div>
        </div>
      )}

      <nav className="fixed bottom-0 left-0 right-0 bg-slate-900/90 backdrop-blur-md border-t border-slate-800 flex justify-around p-3 md:hidden z-40">
        <button onClick={() => setCurrentScreen(AppScreen.DASHBOARD)} className={`flex-1 flex flex-col items-center gap-1 p-2 rounded-xl transition-colors ${currentScreen === AppScreen.DASHBOARD ? 'text-cyan-400 bg-cyan-400/10' : 'text-slate-500'}`}>
          <svg className="w-6 h-6" fill="none" stroke="currentColor" viewBox="0 0 24 24"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M3 12l2-2m0 0l7-7 7 7M5 10v10a1 1 0 001 1h3m10-11l2 2m-2-2v10a1 1 0 01-1 1h-3m-6 0a1 1 0 001-1v-4a1 1 0 011-1h2a1 1 0 011 1v4a1 1 0 001 1m-6 0h6"/></svg>
          <span className="text-[10px] font-bold uppercase">Home</span>
        </button>
        <button onClick={() => setCurrentScreen(AppScreen.TASK_WALL)} className={`flex-1 flex flex-col items-center gap-1 p-2 rounded-xl transition-colors ${currentScreen === AppScreen.TASK_WALL ? 'text-cyan-400 bg-cyan-400/10' : 'text-slate-500'}`}>
          <svg className="w-6 h-6" fill="none" stroke="currentColor" viewBox="0 0 24 24"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M9 5H7a2 2 0 00-2 2v12a2 2 0 002 2h10a2 2 0 002-2V7a2 2 0 00-2-2h-2M9 5a2 2 0 002 2h2a2 2 0 002-2M9 5a2 2 0 012-2h2a2 2 0 012 2m-6 9l2 2 4-4"/></svg>
          <span className="text-[10px] font-bold uppercase">Earn</span>
        </button>
        <button onClick={() => setCurrentScreen(AppScreen.PLAYTIME)} className={`flex-1 flex flex-col items-center gap-1 p-2 rounded-xl transition-colors ${currentScreen === AppScreen.PLAYTIME ? 'text-cyan-400 bg-cyan-400/10' : 'text-slate-500'}`}>
          <svg className="w-6 h-6" fill="none" stroke="currentColor" viewBox="0 0 24 24"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M14.752 11.168l-3.197-2.132A1 1 0 0010 9.87v4.263a1 1 0 001.555.832l3.197-2.132a1 1 0 000-1.664z"/><path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M21 12a9 9 0 11-18 0 9 9 0 0118 0z"/></svg>
          <span className="text-[10px] font-bold uppercase">MD</span>
        </button>
        <button onClick={() => setCurrentScreen(AppScreen.KNIX_COIN)} className={`flex-1 flex flex-col items-center gap-1 p-2 rounded-xl transition-colors ${currentScreen === AppScreen.KNIX_COIN ? 'text-cyan-400 bg-cyan-400/10' : 'text-slate-500'}`}>
          <svg className="w-6 h-6" fill="none" stroke="currentColor" viewBox="0 0 24 24"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M13 7h8m0 0v8m0-8l-8 8-4-4-6 6"/></svg>
          <span className="text-[10px] font-bold uppercase">Market</span>
        </button>
        <button onClick={() => setCurrentScreen(AppScreen.PAYOUT)} className={`flex-1 flex flex-col items-center gap-1 p-2 rounded-xl transition-colors ${currentScreen === AppScreen.PAYOUT ? 'text-cyan-400 bg-cyan-400/10' : 'text-slate-500'}`}>
          <svg className="w-6 h-6" fill="none" stroke="currentColor" viewBox="0 0 24 24"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M16 11V7a4 4 0 00-8 0v4M5 9h14l1 12H4L5 9z"/></svg>
          <span className="text-[10px] font-bold uppercase">Shop</span>
        </button>
      </nav>
    </div>
  );
};

export default App;
