import React, { useState, useEffect, useMemo } from 'react';
import { Play, CheckCircle, Activity, Star, Calendar, Users, DollarSign, Shield, Gift, Clock, Loader2, Zap, Trophy, MapPin, Check, AlertCircle } from 'lucide-react';
import { initializeApp } from "firebase/app";
import { getAuth, signInAnonymously, onAuthStateChanged } from "firebase/auth";
import { getFirestore, collection, addDoc, serverTimestamp } from "firebase/firestore";

// --- PRODUCTION CONFIGURATION ---
// This strictly looks for Vercel Environment Variables.
const firebaseConfig = {
  apiKey: import.meta.env.VITE_FIREBASE_API_KEY,
  authDomain: import.meta.env.VITE_FIREBASE_AUTH_DOMAIN,
  projectId: import.meta.env.VITE_FIREBASE_PROJECT_ID,
  storageBucket: import.meta.env.VITE_FIREBASE_STORAGE_BUCKET,
  messagingSenderId: import.meta.env.VITE_FIREBASE_MESSAGING_SENDER_ID,
  appId: import.meta.env.VITE_FIREBASE_APP_ID
};

// Initialize Firebase safely
let app, auth, db;

// Check if config exists to prevent crash if env vars are missing
if (firebaseConfig.apiKey) {
  try {
    app = initializeApp(firebaseConfig);
    auth = getAuth(app);
    db = getFirestore(app);
  } catch (err) {
    console.error("Firebase Init Error:", err);
  }
} else {
  // If no keys are found, we log an error but allow the UI to render (in offline mode)
  console.error("CRITICAL: Firebase API Keys are missing. Check Vercel Settings.");
}

// --- FIXED SURVEY DATA ---
const FIXED_QUESTIONS = [
    {
        "question_id": 1,
        "option_a": {
            "Class Count": "4 Classes",
            "Monthly Price": "$139",
            "Commitment": "Month-to-Month",
            "Recovery": "None",
            "Strategic Perk": "Standard Booking"
        },
        "option_b": {
            "Class Count": "4 Classes",
            "Monthly Price": "$199",
            "Commitment": "3-Month",
            "Recovery": "Towel Service",
            "Strategic Perk": "Priority Booking"
        }
    },
    {
        "question_id": 2,
        "option_a": {
            "Class Count": "8 Classes",
            "Monthly Price": "$199",
            "Commitment": "Month-to-Month",
            "Recovery": "Recovery + PT",
            "Strategic Perk": "Passport (All Locs)"
        },
        "option_b": {
            "Class Count": "Unlimited",
            "Monthly Price": "$269",
            "Commitment": "3-Month",
            "Recovery": "Recovery + PT",
            "Strategic Perk": "Standard Booking"
        }
    },
    {
        "question_id": 3,
        "option_a": {
            "Class Count": "Unlimited",
            "Monthly Price": "$199",
            "Commitment": "6-Month",
            "Recovery": "None",
            "Strategic Perk": "Passport + Guest"
        },
        "option_b": {
            "Class Count": "12 Classes",
            "Monthly Price": "$349",
            "Commitment": "3-Month",
            "Recovery": "None",
            "Strategic Perk": "Passport (All Locs)"
        }
    },
    {
        "question_id": 4,
        "option_a": {
            "Class Count": "12 Classes",
            "Monthly Price": "$139",
            "Commitment": "6-Month",
            "Recovery": "Recovery + PT",
            "Strategic Perk": "Priority Booking"
        },
        "option_b": {
            "Class Count": "12 Classes",
            "Monthly Price": "$199",
            "Commitment": "12-Month",
            "Recovery": "Recovery Lounge",
            "Strategic Perk": "Standard Booking"
        }
    },
    {
        "question_id": 5,
        "option_a": {
            "Class Count": "4 Classes",
            "Monthly Price": "$269",
            "Commitment": "6-Month",
            "Recovery": "Recovery Lounge",
            "Strategic Perk": "Passport (All Locs)"
        },
        "option_b": {
            "Class Count": "Unlimited",
            "Monthly Price": "$349",
            "Commitment": "Month-to-Month",
            "Recovery": "Recovery Lounge",
            "Strategic Perk": "Priority Booking"
        }
    },
    {
        "question_id": 6,
        "option_a": {
            "Class Count": "8 Classes",
            "Monthly Price": "$139",
            "Commitment": "3-Month",
            "Recovery": "Recovery Lounge",
            "Strategic Perk": "Passport + Guest"
        },
        "option_b": {
            "Class Count": "8 Classes",
            "Monthly Price": "$349",
            "Commitment": "6-Month",
            "Recovery": "Towel Service",
            "Strategic Perk": "Standard Booking"
        }
    },
    {
        "question_id": 7,
        "option_a": {
            "Class Count": "12 Classes",
            "Monthly Price": "$269",
            "Commitment": "Month-to-Month",
            "Recovery": "Towel Service",
            "Strategic Perk": "Passport + Guest"
        },
        "option_b": {
            "Class Count": "Unlimited",
            "Monthly Price": "$139",
            "Commitment": "12-Month",
            "Recovery": "Towel Service",
            "Strategic Perk": "Passport (All Locs)"
        }
    },
    {
        "question_id": 8,
        "option_a": {
            "Class Count": "4 Classes",
            "Monthly Price": "$349",
            "Commitment": "12-Month",
            "Recovery": "Recovery + PT",
            "Strategic Perk": "Passport + Guest"
        },
        "option_b": {
            "Class Count": "8 Classes",
            "Monthly Price": "$269",
            "Commitment": "12-Month",
            "Recovery": "None",
            "Strategic Perk": "Priority Booking"
        }
    }
];

const LOCATIONS = ["Montclair", "Livingston", "Short Hills"];
const AGE_RANGES = ["18-25", "26-35", "36-45", "46-55", "55+"];
const FREQUENCIES = ["Never", "1-2x Month", "1-2x Week", "3+ Week"];

// --- Helper Functions ---

const shuffleArray = (array) => {
  const newArray = [...array];
  for (let i = newArray.length - 1; i > 0; i--) {
    const j = Math.floor(Math.random() * (i + 1));
    [newArray[i], newArray[j]] = [newArray[j], newArray[i]];
  }
  return newArray;
};

// --- Components ---

const IntroScreen = ({ onStart, isAuthReady }) => {
  const [formData, setFormData] = useState({
    location: "",
    age: "",
    frequency: ""
  });

  const isComplete = formData.location && formData.age && formData.frequency;

  return (
    <div className="flex flex-col items-center justify-center min-h-screen bg-black text-white p-6 max-w-md mx-auto">
      <div className="w-full max-w-sm space-y-8">
        <div className="text-center space-y-2">
          <h1 className="text-4xl font-black tracking-tighter text-red-600 uppercase italic">Rumble</h1>
          <h2 className="text-xl font-bold tracking-wide">Membership Survey</h2>
          <p className="text-gray-400 text-sm">
            Help us design the future of fitness. Complete these 8 comparisons to unlock your reward.
          </p>
        </div>

        <div className="space-y-4 bg-gray-900 p-6 rounded-xl border border-gray-800 shadow-xl">
          <div>
            <label className="block text-xs font-bold text-gray-500 uppercase mb-2">Primary Location</label>
            <div className="grid grid-cols-3 gap-2">
              {LOCATIONS.map(loc => (
                <button
                  key={loc}
                  onClick={() => setFormData({ ...formData, location: loc })}
                  className={`p-2 text-xs font-bold rounded border transition-all ${
                    formData.location === loc 
                      ? "bg-red-600 border-red-600 text-white" 
                      : "bg-black border-gray-700 text-gray-400 hover:border-gray-500"
                  }`}
                >
                  {loc}
                </button>
              ))}
            </div>
          </div>

          <div>
            <label className="block text-xs font-bold text-gray-500 uppercase mb-2">Age Group</label>
            <select 
              className="w-full bg-black border border-gray-700 text-white p-3 rounded focus:outline-none focus:border-red-600"
              value={formData.age}
              onChange={(e) => setFormData({...formData, age: e.target.value})}
            >
              <option value="">Select Age</option>
              {AGE_RANGES.map(age => <option key={age} value={age}>{age}</option>)}
            </select>
          </div>

          <div>
            <label className="block text-xs font-bold text-gray-500 uppercase mb-2">Current Workout Frequency</label>
            <select 
              className="w-full bg-black border border-gray-700 text-white p-3 rounded focus:outline-none focus:border-red-600"
              value={formData.frequency}
              onChange={(e) => setFormData({...formData, frequency: e.target.value})}
            >
              <option value="">Select Frequency</option>
              {FREQUENCIES.map(f => <option key={f} value={f}>{f}</option>)}
            </select>
          </div>
        </div>

        <button
          onClick={() => isComplete && isAuthReady && onStart(formData)}
          disabled={!isComplete || !isAuthReady}
          className={`w-full py-4 rounded-full font-black text-lg tracking-widest uppercase transition-all flex items-center justify-center gap-2 ${
            isComplete && isAuthReady
              ? "bg-white text-black hover:bg-red-600 hover:text-white hover:scale-105 shadow-lg shadow-red-900/50" 
              : "bg-gray-800 text-gray-500 cursor-not-allowed"
          }`}
        >
          {!isAuthReady ? <Loader2 className="animate-spin" /> : <><Play size={20} fill="currentColor" /> Start Survey</>}
        </button>
      </div>
    </div>
  );
};

const ChoiceCard = ({ option, data, onSelect, isSelected, isOtherSelected }) => {
  const price = data["Monthly Price"];
  
  let containerClasses = "bg-gray-900 border border-gray-800";
  if (isSelected) {
      containerClasses = "bg-gray-900 border-2 border-green-500 shadow-[0_0_15px_rgba(34,197,94,0.3)] scale-[1.02]";
  } else if (isOtherSelected) {
      containerClasses = "bg-gray-900 border-gray-800 opacity-40 grayscale";
  }

  return (
    <div className={`relative rounded-xl p-3 md:p-5 transition-all duration-300 flex flex-col h-full ${containerClasses}`}>
      
      <div className="flex justify-between items-center mb-3 pb-2 border-b border-gray-800">
        <span className="text-gray-500 text-[10px] font-bold uppercase tracking-widest">Option {option}</span>
        <div className="flex items-baseline gap-1 text-white">
            <span className="text-xl font-black">{price}</span>
            <span className="text-xs text-gray-500 font-medium">/mo</span>
        </div>
      </div>

      <div className="space-y-2 flex-grow">
        <div className="grid grid-cols-2 gap-2">
            <div>
                <div className="flex items-center gap-1 mb-0.5">
                    <Activity size={12} className="text-red-500" />
                    <span className="text-[10px] text-gray-500 font-bold uppercase">Access</span>
                </div>
                <p className="text-xs font-semibold text-white truncate">{data["Class Count"]}</p>
            </div>
            <div>
                <div className="flex items-center gap-1 mb-0.5">
                    <Shield size={12} className="text-red-500" />
                    <span className="text-[10px] text-gray-500 font-bold uppercase">Term</span>
                </div>
                <p className="text-xs font-semibold text-gray-300 truncate">{data["Commitment"]}</p>
            </div>
        </div>

        <div className="grid grid-cols-2 gap-2 pt-1">
            <div>
                 <div className="flex items-center gap-1 mb-0.5">
                    <Zap size={12} className="text-red-500" />
                    <span className="text-[10px] text-gray-500 font-bold uppercase">Recovery</span>
                </div>
                <p className="text-xs font-medium text-gray-300 truncate">{data["Recovery"]}</p>
            </div>
            <div>
                 <div className="flex items-center gap-1 mb-0.5">
                    <Trophy size={12} className="text-yellow-500" />
                    <span className="text-[10px] text-yellow-600 font-bold uppercase">Perk</span>
                </div>
                <p className="text-xs font-medium text-white truncate">{data["Strategic Perk"]}</p>
            </div>
        </div>
      </div>

      <div className="mt-4 pt-2">
        <button 
            onClick={onSelect}
            disabled={isSelected || isOtherSelected}
            className={`w-full py-2 rounded-lg font-bold uppercase text-xs tracking-widest transition-all flex items-center justify-center gap-2 ${
                isSelected 
                ? "bg-green-600 text-white cursor-default"
                : isOtherSelected
                ? "bg-gray-800 text-gray-500 cursor-not-allowed"
                : "bg-red-600 text-white hover:bg-red-500 active:scale-95"
            }`}
        >
            {isSelected ? (
                <>Selected <Check size={14} /></>
            ) : (
                "Select Plan"
            )}
        </button>
      </div>
    </div>
  );
};

const ResultsScreen = ({ demographic, choices, onReset }) => {
  const completionCode = useMemo(() => {
    return Math.random().toString(36).substring(2, 8).toUpperCase();
  }, []);
  
  const timestamp = new Date().toLocaleString('en-US', { 
    hour: 'numeric', 
    minute: 'numeric', 
    month: 'short', 
    day: 'numeric' 
  });

  return (
    <div className="min-h-screen bg-black text-white p-6 max-w-md mx-auto flex flex-col">
      <div className="text-center mb-6">
        <div className="inline-flex items-center justify-center p-3 bg-green-500 rounded-full mb-4 shadow-lg shadow-green-900/40">
            <CheckCircle size={32} className="text-white" />
        </div>
        <h1 className="text-2xl font-black italic uppercase tracking-tighter">Survey Complete</h1>
        <p className="text-gray-400 text-sm mt-1">Thanks for your feedback!</p>
      </div>

      <div className="bg-white text-black rounded-xl overflow-hidden shadow-2xl mb-8 relative border-4 border-red-600">
        <div className="absolute top-4 left-4 flex items-center gap-2 z-10">
            <div className="relative">
                <div className="h-3 w-3 bg-green-500 rounded-full animate-ping absolute"></div>
                <div className="h-3 w-3 bg-green-500 rounded-full relative"></div>
            </div>
            <span className="text-xs font-bold text-gray-500 uppercase tracking-wider">Live</span>
        </div>

        <div className="bg-red-600 p-4 pt-10 text-center">
            <Gift className="mx-auto text-white mb-2" size={40} />
            <h2 className="text-white font-black text-xl uppercase italic tracking-wide">Reward Unlocked</h2>
        </div>

        <div className="p-6 text-center space-y-4">
            <div>
                <p className="text-xs font-bold text-gray-400 uppercase tracking-widest mb-1">Validation Code</p>
                <div className="text-4xl font-mono font-black text-gray-900 tracking-widest">{completionCode}</div>
            </div>
            
            <div className="border-t border-dashed border-gray-300 my-2"></div>
            
            <div className="flex justify-center items-center gap-2 text-gray-600">
                <Clock size={16} />
                <span className="text-sm font-bold font-mono">{timestamp}</span>
            </div>

            <div className="bg-gray-100 p-3 rounded-lg">
                <p className="text-xs text-gray-500 leading-snug">
                    Show this screen to the front desk staff to redeem your free class or retail credit.
                </p>
            </div>
        </div>
      </div>

      <div className="space-y-4">
        <p className="text-xs text-center text-gray-500">
           Responses have been securely saved.
        </p>
        
        <button 
          onClick={onReset}
          className="w-full py-4 bg-transparent border border-gray-700 text-gray-500 font-bold uppercase rounded-full hover:border-gray-500 hover:text-white transition-all"
        >
          Close / New Survey
        </button>
      </div>
    </div>
  );
};

const ErrorScreen = ({ error, onRetry }) => (
    <div className="min-h-screen bg-black text-white flex flex-col items-center justify-center p-6 text-center">
        <AlertCircle className="text-red-600 mb-4" size={48} />
        <h2 className="text-xl font-bold uppercase italic tracking-wider mb-2">Connection Error</h2>
        <p className="text-gray-500 text-sm mb-6 max-w-xs">{error}</p>
        <button 
          onClick={onRetry}
          className="px-8 py-3 bg-white text-black font-bold uppercase rounded-full hover:bg-gray-200"
        >
          Try Again
        </button>
    </div>
);

const LoadingScreen = () => (
    <div className="min-h-screen bg-black text-white flex flex-col items-center justify-center p-6">
        <Loader2 className="animate-spin text-red-600 mb-4" size={48} />
        <h2 className="text-xl font-bold uppercase italic tracking-wider">Saving Responses...</h2>
    </div>
);

// --- Main App Controller ---

export default function App() {
  const [screen, setScreen] = useState('intro'); 
  const [demographics, setDemographics] = useState(null);
  const [questionQueue, setQuestionQueue] = useState([]);
  const [currentQuestionIndex, setCurrentQuestionIndex] = useState(0);
  const [history, setHistory] = useState([]);
  const [user, setUser] = useState(null);
  const [isSubmitting, setIsSubmitting] = useState(false);
  const [errorMsg, setErrorMsg] = useState(null);
  
  const [transitionState, setTransitionState] = useState('idle'); 
  
  const TOTAL_QUESTIONS = FIXED_QUESTIONS.length;

  useEffect(() => {
    if (!firebaseConfig.apiKey) {
      console.warn("No Firebase Config loaded (Offline Mode).");
      // We don't return here to allow offline mode for testing UI
    }

    const initAuth = async () => {
       try { 
         if (auth) {
           await signInAnonymously(auth); 
         }
       } catch (error) { 
         console.error("Auth Error:", error); 
       }
    };
    initAuth();
    
    if (auth) {
      const unsubscribe = onAuthStateChanged(auth, (currentUser) => setUser(currentUser));
      return () => unsubscribe();
    }
  }, []);

  const startSurvey = (data) => {
    setDemographics(data);
    const shuffledQuestions = shuffleArray(FIXED_QUESTIONS);
    setQuestionQueue(shuffledQuestions);
    setCurrentQuestionIndex(0);
    setHistory([]);
    setScreen('survey');
  };

  const handleSelectWithDelay = (choice) => {
      setTransitionState(choice === 'A' ? 'selected-A' : 'selected-B');
      setTimeout(() => {
          processChoice(choice);
      }, 600);
  };

  const processChoice = async (choice) => {
    const currentSet = questionQueue[currentQuestionIndex];
    const record = {
      questionId: currentSet.question_id, 
      orderIndex: currentQuestionIndex + 1, 
      choice: choice,
      set: currentSet,
      timestamp: new Date().toISOString()
    };
    
    const newHistory = [...history, record];
    setHistory(newHistory);

    if (currentQuestionIndex >= TOTAL_QUESTIONS - 1) {
      await finishSurvey(newHistory);
    } else {
      setTransitionState('idle'); 
      setCurrentQuestionIndex(prev => prev + 1);
      window.scrollTo(0, 0);
    }
  };

  const finishSurvey = async (finalHistory) => {
      setIsSubmitting(true);
      setErrorMsg(null);

      if (db && user) {
          try {
              // PRODUCTION PATH: rumble_responses
              const collectionRef = collection(db, 'rumble_responses');
              
              await addDoc(collectionRef, {
                  userId: user.uid,
                  demographics: demographics,
                  responses: finalHistory,
                  completedAt: serverTimestamp(),
                  deviceType: /Mobi/i.test(navigator.userAgent) ? 'Mobile' : 'Desktop'
              });
              
              setScreen('results');
          } catch (error) { 
              console.error("Error saving survey:", error); 
              setErrorMsg("Failed to save your survey. Please check your internet connection.");
          }
      } else {
          // If we are in offline/demo mode (no config), just go to results
          if (!firebaseConfig.apiKey) {
             console.log("Demo Mode: Survey finished (not saved to DB)");
             setScreen('results');
          } else {
             setErrorMsg("System error: Database not connected. Please refresh.");
          }
      }
      
      setIsSubmitting(false);
      window.scrollTo(0,0);
  };

  const resetSurvey = () => {
    setScreen('intro');
    setDemographics(null);
    setHistory([]);
    setQuestionQueue([]);
    setCurrentQuestionIndex(0);
    setErrorMsg(null);
  };

  // If we are submitting, show loader
  if (isSubmitting) return <LoadingScreen />;

  // If there was a save error, show error screen
  if (errorMsg) return <ErrorScreen error={errorMsg} onRetry={() => finishSurvey(history)} />;

  // In production, we consider auth ready if user exists OR if config is missing (so UI doesn't block)
  const isAuthReady = user !== null || !firebaseConfig.apiKey;
  const currentSet = questionQueue[currentQuestionIndex];

  return (
    <div className="font-sans antialiased bg-black min-h-screen text-slate-200 selection:bg-red-900 selection:text-white pb-10">
      {screen === 'intro' && <IntroScreen onStart={startSurvey} isAuthReady={isAuthReady} />}
      
      {screen === 'survey' && currentSet && (
        <div className="max-w-md mx-auto p-4 flex flex-col h-screen">
          
          {/* Header & Progress */}
          <div className="mb-4 shrink-0">
            <div className="flex justify-between items-end mb-2">
                <span className="text-[10px] font-bold uppercase text-red-600 tracking-widest">
                    Question {currentQuestionIndex + 1} / {TOTAL_QUESTIONS}
                </span>
                <span className="text-[10px] font-mono text-gray-500">
                    {Math.round(((currentQuestionIndex + 1) / TOTAL_QUESTIONS) * 100)}%
                </span>
            </div>
            <div className="h-1 w-full bg-gray-900 rounded-full overflow-hidden">
                <div 
                    className="h-full bg-red-600 transition-all duration-300 ease-out" 
                    style={{ width: `${((currentQuestionIndex + 1) / TOTAL_QUESTIONS) * 100}%` }}
                ></div>
            </div>
          </div>

          <div className="text-center mb-4 shrink-0">
            <h2 className="text-xl font-black text-white italic uppercase tracking-tight">
              Which plan is better?
            </h2>
          </div>

          {/* Cards Container - Fits on screen */}
          <div className="grid grid-cols-1 gap-3 flex-grow min-h-0 overflow-y-auto">
            <ChoiceCard 
                key={`${currentSet.question_id}-A`}
                option="A" 
                data={currentSet.option_a} 
                onSelect={() => handleSelectWithDelay('A')}
                isSelected={transitionState === 'selected-A'}
                isOtherSelected={transitionState === 'selected-B'}
            />
            <ChoiceCard 
                key={`${currentSet.question_id}-B`}
                option="B" 
                data={currentSet.option_b} 
                onSelect={() => handleSelectWithDelay('B')}
                isSelected={transitionState === 'selected-B'}
                isOtherSelected={transitionState === 'selected-A'}
            />
          </div>

          {/* Skip Button */}
          <div className="mt-4 text-center shrink-0">
             <button onClick={() => handleSelectWithDelay('None')} className="text-[10px] font-bold text-gray-600 hover:text-gray-400 uppercase tracking-widest border-b border-transparent hover:border-gray-600 transition-all p-2">
                I wouldn't choose either
             </button>
          </div>
        </div>
      )}

      {screen === 'results' && (
        <ResultsScreen 
            demographic={demographics} 
            choices={history} 
            onReset={resetSurvey} 
        />
      )}
    </div>
  );
}