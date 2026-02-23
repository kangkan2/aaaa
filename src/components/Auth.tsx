
import React, { useState, useEffect } from 'react';
import { UserData } from '../types';
import { auth, googleProvider, db } from '../firebase';
import { 
  createUserWithEmailAndPassword, 
  signInWithEmailAndPassword,
  signInWithPopup,
  sendPasswordResetEmail,
  updateProfile
} from 'firebase/auth';
import { doc, getDoc, setDoc } from 'firebase/firestore';

interface AuthProps {
  onAuthComplete: (user: UserData) => void;
}

const ACCOUNTS_DB_KEY = 'mcreward_accounts_database';

const generateReferralCode = () => {
  return 'MC' + Math.random().toString(36).substring(2, 8).toUpperCase();
};

const generateZpexkNumber = () => {
  return (Math.floor(Math.random() * 9000000000) + 1000000000).toString();
};

const Auth: React.FC<AuthProps> = ({ onAuthComplete }) => {
  const [isRegistering, setIsRegistering] = useState(false);
  const [username, setUsername] = useState('');
  const [password, setPassword] = useState('');
  const [confirmPassword, setConfirmPassword] = useState('');
  const [referralInput, setReferralInput] = useState('');
  const [error, setError] = useState('');
  const [isLoading, setIsLoading] = useState(false);
  const [isForgotPassword, setIsForgotPassword] = useState(false);
  const [resetEmail, setResetEmail] = useState('');
  const [resetSent, setResetSent] = useState(false);

  // Clear error when switching tabs
  useEffect(() => {
    setError('');
  }, [isRegistering]);

  const getAccounts = (): UserData[] => {
    const data = localStorage.getItem(ACCOUNTS_DB_KEY);
    return data ? JSON.parse(data) : [];
  };

  const saveAccount = async (user: UserData) => {
    try {
      const userDocRef = doc(db, 'users', user.id);
      await setDoc(userDocRef, user);
    } catch (error) {
      console.error("Error saving user to Firestore:", error);
    }
  };

  const handleAuth = async (e: React.FormEvent) => {
    e.preventDefault();
    setError('');
    setIsLoading(true);

    // Simulate network delay
    await new Promise(resolve => setTimeout(resolve, 1000));

    if (!username.trim() || !password.trim()) {
      setError('Please fill in all required fields.');
      setIsLoading(false);
      return;
    }

    const accounts = getAccounts();

    if (isRegistering) {
      if (password !== confirmPassword) {
        setError('Passwords do not match.');
        setIsLoading(false);
        return;
      }

      if (password.length < 6) {
        setError('Password must be at least 6 characters.');
        setIsLoading(false);
        return;
      }

      try {
        // Firebase Create User
        const userCredential = await createUserWithEmailAndPassword(auth, username.trim(), password.trim());
        const firebaseUser = userCredential.user;

        // Map to existing UserData structure
        const initialBalance = 0;
        const newUser: UserData = {
          id: firebaseUser.uid,
          username: username.trim(),
          password: password.trim(), // Keeping for legacy UI compatibility if needed
          minecraftUsername: '',
          coinBalance: initialBalance,
          lifetimeCoins: initialBalance,
          deviceId: 'DEV_' + Math.random().toString(36).substring(7).toUpperCase(),
          isAccountBound: true,
          referralCode: generateReferralCode(),
          referredBy: referralInput.trim() || undefined,
          transactions: [],
          verificationStatus: 'UNVERIFIED',
          completedTaskIds: [],
          usedPromoCodes: [],
          zpexkNumber: generateZpexkNumber()
        };

        await saveAccount(newUser);
        onAuthComplete(newUser);
      } catch (err: any) {
        console.error("Registration error:", err);
        if (err.code === 'auth/email-already-in-use') {
          setError('This email is already registered.');
        } else if (err.code === 'auth/invalid-email') {
          setError('Please enter a valid email address.');
        } else if (err.code === 'auth/weak-password') {
          setError('Password is too weak.');
        } else {
          setError('Failed to create account. Please try again.');
        }
      }
    } else {
      try {
        // Firebase Sign In
        const userCredential = await signInWithEmailAndPassword(auth, username.trim(), password.trim());
        const firebaseUser = userCredential.user;

        const userDocRef = doc(db, 'users', firebaseUser.uid);
        const userDoc = await getDoc(userDocRef);

        if (userDoc.exists()) {
          const user = userDoc.data() as UserData;
          // Migration: Ensure existing users get a ZPEXK number
          if (!user.zpexkNumber) {
            user.zpexkNumber = generateZpexkNumber();
            await setDoc(userDocRef, { zpexkNumber: user.zpexkNumber }, { merge: true });
          }
          onAuthComplete(user);
        } else {
          // If user exists in Firebase but not in our Firestore (e.g. newly enabled Firestore)
          const initialBalance = 0;
          const newUser: UserData = {
            id: firebaseUser.uid,
            username: username.trim(),
            password: password.trim(),
            minecraftUsername: '',
            coinBalance: initialBalance,
            lifetimeCoins: initialBalance,
            deviceId: 'DEV_' + Math.random().toString(36).substring(7).toUpperCase(),
            isAccountBound: true,
            referralCode: generateReferralCode(),
            referredBy: undefined,
            transactions: [],
            verificationStatus: 'UNVERIFIED',
            completedTaskIds: [],
            usedPromoCodes: [],
            zpexkNumber: generateZpexkNumber()
          };
          await saveAccount(newUser);
          onAuthComplete(newUser);
        }
      } catch (err: any) {
        console.error("Login error:", err);
        if (err.code === 'auth/user-not-found' || err.code === 'auth/wrong-password' || err.code === 'auth/invalid-credential') {
          setError('Invalid email or password.');
        } else if (err.code === 'auth/invalid-email') {
          setError('Please enter a valid email address.');
        } else {
          setError('Login failed. Please try again.');
        }
      }
    }
    setIsLoading(false);
  };

  const handleGoogleSignIn = async () => {
    setError('');
    setIsLoading(true);
    try {
      const result = await signInWithPopup(auth, googleProvider);
      const firebaseUser = result.user;

      const userDocRef = doc(db, 'users', firebaseUser.uid);
      const userDoc = await getDoc(userDocRef);

      if (userDoc.exists()) {
        const user = userDoc.data() as UserData;
        if (!user.zpexkNumber) {
          user.zpexkNumber = generateZpexkNumber();
          await setDoc(userDocRef, { zpexkNumber: user.zpexkNumber }, { merge: true });
        }
        onAuthComplete(user);
      } else {
        const initialBalance = 0;
        const newUser: UserData = {
          id: firebaseUser.uid,
          username: firebaseUser.email || firebaseUser.displayName || 'Google User',
          password: '', // No password for Google users
          minecraftUsername: '',
          coinBalance: initialBalance,
          lifetimeCoins: initialBalance,
          deviceId: 'DEV_' + Math.random().toString(36).substring(7).toUpperCase(),
          isAccountBound: true,
          referralCode: generateReferralCode(),
          referredBy: undefined,
          transactions: [],
          verificationStatus: 'UNVERIFIED',
          completedTaskIds: [],
          usedPromoCodes: [],
          zpexkNumber: generateZpexkNumber()
        };
        await saveAccount(newUser);
        onAuthComplete(newUser);
      }
    } catch (err: any) {
      console.error("Google Sign-In error:", err);
      if (err.code === 'auth/popup-closed-by-user') {
        setError('Sign-in cancelled.');
      } else {
        setError('Google Sign-In failed. Please try again.');
      }
    } finally {
      setIsLoading(false);
    }
  };

  const handleForgotPassword = async (e: React.FormEvent) => {
    e.preventDefault();
    setError('');
    setIsLoading(true);
    try {
      await sendPasswordResetEmail(auth, resetEmail.trim());
      setResetSent(true);
    } catch (err: any) {
      console.error("Password reset error:", err);
      if (err.code === 'auth/user-not-found') {
        setError('No account found with this email.');
      } else if (err.code === 'auth/invalid-email') {
        setError('Please enter a valid email address.');
      } else {
        setError('Failed to send reset email. Please try again.');
      }
    } finally {
      setIsLoading(false);
    }
  };

  return (
    <div className="min-h-[100dvh] flex items-center justify-center p-4 bg-slate-950 bg-[radial-gradient(circle_at_center,_var(--tw-gradient-stops))] from-blue-900/20 via-slate-950 to-slate-950">
      <div className="w-full max-w-md bg-slate-900/80 backdrop-blur-xl border border-slate-800 rounded-[2.5rem] p-10 shadow-2xl relative overflow-hidden animate-in zoom-in-95 duration-500">
        <div className="absolute top-0 left-0 w-full h-1 bg-gradient-to-r from-transparent via-cyan-500 to-transparent"></div>
        
        <div className="text-center mb-10">
          <div className="inline-block p-4 bg-cyan-500/10 rounded-3xl mb-4 border border-cyan-500/20">
            <svg className="w-10 h-10 text-cyan-500" fill="none" stroke="currentColor" viewBox="0 0 24 24">
              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M12 15v2m-6 4h12a2 2 0 002-2v-6a2 2 0 00-2-2H6a2 2 0 00-2 2v6a2 2 0 002 2zm10-10V7a4 4 0 00-8 0v4h8z"/>
            </svg>
          </div>
          <h1 className="text-4xl font-gaming font-bold text-white mb-2 tracking-tighter uppercase">
            MC<span className="text-cyan-500">REWARD</span>
          </h1>
          <p className="text-slate-500 text-xs font-bold uppercase tracking-[0.2em]">
            {isForgotPassword ? 'Reset Security Key' : 'Secure Access Portal'}
          </p>
        </div>

        {error && (
          <div className="mb-6 p-4 bg-red-500/10 border border-red-500/20 rounded-2xl text-red-400 text-xs font-bold uppercase tracking-wider text-center animate-in slide-in-from-top-2">
            {error}
          </div>
        )}

        {resetSent ? (
          <div className="text-center space-y-6 animate-in fade-in zoom-in-95">
            <div className="w-16 h-16 bg-green-500/10 rounded-full flex items-center justify-center mx-auto text-green-500 border border-green-500/20">
              <svg className="w-8 h-8" fill="none" stroke="currentColor" viewBox="0 0 24 24"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M5 13l4 4L19 7"/></svg>
            </div>
            <div className="space-y-2">
              <h3 className="text-xl font-bold text-white uppercase tracking-widest">Email Sent</h3>
              <p className="text-slate-400 text-xs font-medium">Please check your inbox for instructions to reset your password.</p>
            </div>
            <button
              onClick={() => {
                setResetSent(false);
                setIsForgotPassword(false);
              }}
              className="w-full bg-slate-800 hover:bg-slate-700 text-white font-bold py-4 rounded-2xl transition-all uppercase tracking-widest text-xs"
            >
              Back to Login
            </button>
          </div>
        ) : isForgotPassword ? (
          <form onSubmit={handleForgotPassword} className="space-y-6 animate-in slide-in-from-right-4">
            <div className="space-y-1.5">
              <label className="block text-[10px] font-bold text-slate-500 uppercase ml-1 tracking-widest">Recovery Email</label>
              <div className="relative">
                <span className="absolute left-5 top-1/2 -translate-y-1/2 text-slate-500">
                  <svg className="w-5 h-5" fill="none" stroke="currentColor" viewBox="0 0 24 24"><path d="M16 7a4 4 0 11-8 0 4 4 0 018 0zM12 14a7 7 0 00-7 7h14a7 7 0 00-7-7z" strokeWidth="2"/></svg>
                </span>
                <input
                  type="email"
                  required
                  value={resetEmail}
                  onChange={(e) => setResetEmail(e.target.value)}
                  placeholder="elite@example.com"
                  className="w-full bg-slate-950 border border-slate-800 rounded-2xl pl-12 pr-6 py-4 text-white focus:outline-none focus:ring-2 focus:ring-cyan-500/50 transition-all placeholder:text-slate-700 font-semibold"
                />
              </div>
            </div>

            <div className="flex flex-col gap-3">
              <button
                type="submit"
                disabled={isLoading}
                className="w-full bg-cyan-600 hover:bg-cyan-500 disabled:bg-slate-800 disabled:text-slate-500 text-white font-bold py-5 rounded-2xl shadow-lg shadow-cyan-900/20 active:scale-[0.98] transition-all flex items-center justify-center gap-3 uppercase tracking-widest text-xs"
              >
                {isLoading ? (
                  <svg className="animate-spin h-5 w-5 text-white" viewBox="0 0 24 24">
                    <circle className="opacity-25" cx="12" cy="12" r="10" stroke="currentColor" strokeWidth="4" fill="none"></circle>
                    <path className="opacity-75" fill="currentColor" d="M4 12a8 8 0 018-8V0C5.373 0 0 5.373 0 12h4zm2 5.291A7.962 7.962 0 014 12H0c0 3.042 1.135 5.824 3 7.938l3-2.647z"></path>
                  </svg>
                ) : 'Send Reset Link'}
              </button>
              <button
                type="button"
                onClick={() => setIsForgotPassword(false)}
                className="w-full py-4 text-slate-500 hover:text-slate-300 font-bold uppercase text-[10px] tracking-[0.2em] transition-colors"
              >
                Cancel
              </button>
            </div>
          </form>
        ) : (
          <>
            <div className="flex bg-slate-950/50 p-1.5 rounded-2xl mb-8 border border-slate-800">
          <button 
            onClick={() => setIsRegistering(false)}
            className={`flex-1 py-3 rounded-xl text-xs font-bold uppercase tracking-widest transition-all ${!isRegistering ? 'bg-slate-800 text-white shadow-lg' : 'text-slate-500 hover:text-slate-300'}`}
          >
            Login
          </button>
          <button 
            onClick={() => setIsRegistering(true)}
            className={`flex-1 py-3 rounded-xl text-xs font-bold uppercase tracking-widest transition-all ${isRegistering ? 'bg-slate-800 text-white shadow-lg' : 'text-slate-500 hover:text-slate-300'}`}
          >
            Register
          </button>
        </div>

        <form onSubmit={handleAuth} className="space-y-4">
          <div className="space-y-1.5">
            <label className="block text-[10px] font-bold text-slate-500 uppercase ml-1 tracking-widest">Email Address</label>
            <div className="relative">
              <span className="absolute left-5 top-1/2 -translate-y-1/2 text-slate-500">
                <svg className="w-5 h-5" fill="none" stroke="currentColor" viewBox="0 0 24 24"><path d="M16 7a4 4 0 11-8 0 4 4 0 018 0zM12 14a7 7 0 00-7 7h14a7 7 0 00-7-7z" strokeWidth="2"/></svg>
              </span>
              <input
                type="email"
                required
                autoComplete="email"
                value={username}
                onChange={(e) => setUsername(e.target.value)}
                placeholder="elite@example.com"
                className="w-full bg-slate-950 border border-slate-800 rounded-2xl pl-12 pr-6 py-4 text-white focus:outline-none focus:ring-2 focus:ring-cyan-500/50 transition-all placeholder:text-slate-700 font-semibold"
              />
            </div>
          </div>

          <div className="space-y-1.5">
            <label className="block text-[10px] font-bold text-slate-500 uppercase ml-1 tracking-widest">Password</label>
            <div className="relative">
              <span className="absolute left-5 top-1/2 -translate-y-1/2 text-slate-500">
                <svg className="w-5 h-5" fill="none" stroke="currentColor" viewBox="0 0 24 24"><path d="M12 15v2m-6 4h12a2 2 0 002-2v-6a2 2 0 00-2-2H6a2 2 0 00-2 2v6a2 2 0 002 2zm10-10V7a4 4 0 00-8 0v4h8z" strokeWidth="2"/></svg>
              </span>
              <input
                type="password"
                required
                autoComplete={isRegistering ? "new-password" : "current-password"}
                value={password}
                onChange={(e) => setPassword(e.target.value)}
                placeholder="••••••••"
                className="w-full bg-slate-950 border border-slate-800 rounded-2xl pl-12 pr-6 py-4 text-white focus:outline-none focus:ring-2 focus:ring-cyan-500/50 transition-all placeholder:text-slate-700"
              />
            </div>
          </div>

          {!isRegistering && (
            <div className="flex justify-end">
              <button
                type="button"
                onClick={() => {
                  setIsForgotPassword(true);
                  setResetEmail(username);
                }}
                className="text-[10px] text-cyan-500/60 hover:text-cyan-400 font-bold uppercase tracking-widest transition-colors"
              >
                Forgot Password?
              </button>
            </div>
          )}

          {isRegistering && (
            <div className="space-y-4 animate-in slide-in-from-top-4">
              <div className="space-y-1.5">
                <label className="block text-[10px] font-bold text-slate-500 uppercase ml-1 tracking-widest">Confirm Password</label>
                <input
                  type="password"
                  required
                  value={confirmPassword}
                  onChange={(e) => setConfirmPassword(e.target.value)}
                  placeholder="••••••••"
                  className="w-full bg-slate-950 border border-slate-800 rounded-2xl px-6 py-4 text-white focus:outline-none focus:ring-2 focus:ring-cyan-500/50 transition-all placeholder:text-slate-700"
                />
              </div>

              <div className="space-y-1.5">
                <label className="block text-[10px] font-bold text-slate-500 uppercase ml-1 tracking-widest">Referral Code (Optional)</label>
                <input
                  type="text"
                  value={referralInput}
                  onChange={(e) => setReferralInput(e.target.value.toUpperCase())}
                  placeholder="Ex: MC7X2Y"
                  className="w-full bg-slate-950 border border-slate-800 rounded-2xl px-6 py-4 text-white focus:outline-none focus:ring-2 focus:ring-cyan-500/50 transition-all placeholder:text-slate-700 uppercase font-mono tracking-widest"
                />
                <p className="text-[9px] text-cyan-500/60 font-bold uppercase tracking-tighter px-1">Bonus: +100 coins if you use a code!</p>
              </div>
            </div>
          )}

          <button
            type="submit"
            disabled={isLoading}
            className="w-full mt-6 bg-cyan-600 hover:bg-cyan-500 disabled:bg-slate-800 disabled:text-slate-500 text-white font-bold py-5 rounded-2xl shadow-lg shadow-cyan-900/20 active:scale-[0.98] transition-all flex items-center justify-center gap-3 uppercase tracking-widest text-xs"
          >
            {isLoading ? (
              <svg className="animate-spin h-5 w-5 text-white" viewBox="0 0 24 24">
                <circle className="opacity-25" cx="12" cy="12" r="10" stroke="currentColor" strokeWidth="4" fill="none"></circle>
                <path className="opacity-75" fill="currentColor" d="M4 12a8 8 0 018-8V0C5.373 0 0 5.373 0 12h4zm2 5.291A7.962 7.962 0 014 12H0c0 3.042 1.135 5.824 3 7.938l3-2.647z"></path>
              </svg>
            ) : (
              isRegistering ? 'Create Account' : 'Initialize Session'
            )}
          </button>
        </form>

        <div className="mt-4 flex items-center gap-4">
          <div className="flex-1 h-px bg-slate-800"></div>
          <span className="text-[10px] text-slate-500 font-bold uppercase tracking-widest">OR</span>
          <div className="flex-1 h-px bg-slate-800"></div>
        </div>

        <button
          onClick={handleGoogleSignIn}
          disabled={isLoading}
          className="w-full mt-4 bg-white hover:bg-slate-100 disabled:bg-slate-800 disabled:text-slate-500 text-slate-950 font-bold py-4 rounded-2xl shadow-lg active:scale-[0.98] transition-all flex items-center justify-center gap-3 uppercase tracking-widest text-[10px]"
        >
          <svg className="w-5 h-5" viewBox="0 0 24 24">
            <path d="M22.56 12.25c0-.78-.07-1.53-.2-2.25H12v4.26h5.92c-.26 1.37-1.04 2.53-2.21 3.31v2.77h3.57c2.08-1.92 3.28-4.74 3.28-8.09z" fill="#4285F4"/>
            <path d="M12 23c2.97 0 5.46-.98 7.28-2.66l-3.57-2.77c-.98.66-2.23 1.06-3.71 1.06-2.86 0-5.29-1.93-6.16-4.53H2.18v2.84C3.99 20.53 7.7 23 12 23z" fill="#34A853"/>
            <path d="M5.84 14.09c-.22-.66-.35-1.36-.35-2.09s.13-1.43.35-2.09V7.07H2.18C1.43 8.55 1 10.22 1 12s.43 3.45 1.18 4.93l3.66-2.84z" fill="#FBBC04"/>
            <path d="M12 5.38c1.62 0 3.06.56 4.21 1.64l3.15-3.15C17.45 2.09 14.97 1 12 1 7.7 1 3.99 3.47 2.18 7.07l3.66 2.84c.87-2.6 3.3-4.53 6.16-4.53z" fill="#EA4335"/>
          </svg>
          Continue with Google
        </button>
          </>
        )}

        <div className="mt-8 text-center border-t border-slate-800/50 pt-6">
           <p className="text-[10px] text-slate-500 font-bold uppercase tracking-widest">
             {isRegistering ? 'Already have an account?' : 'New to MCREWARD?'}
           </p>
           <button
            onClick={() => setIsRegistering(!isRegistering)}
            className="text-xs text-cyan-500 hover:text-cyan-400 transition-colors font-bold uppercase mt-2 tracking-widest underline decoration-dashed decoration-cyan-900 underline-offset-4"
          >
            {isRegistering ? 'Login Instead' : 'Register Now'}
          </button>
        </div>
      </div>
    </div>
  );
};

export default Auth;
