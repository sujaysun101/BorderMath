import React, { useState, useEffect } from 'react';
import BordermathApp from './components/BordermathApp';
import LandingPage from './components/LandingPage';
import { auth } from './firebase';
import { onAuthStateChanged } from 'firebase/auth';
import { Globe } from 'lucide-react';
import { motion, AnimatePresence } from 'motion/react';

export default function App() {
  const [user, setUser] = useState<any>(undefined);

  useEffect(() => {
    const unsubscribe = onAuthStateChanged(auth, (u) => {
      setUser(u);
    });
    return unsubscribe;
  }, []);

  if (user === undefined) {
    return (
      <div className="h-screen w-full flex items-center justify-center bg-[#F5F2ED]">
        <motion.div 
          animate={{ rotate: 360 }} 
          transition={{ repeat: Infinity, duration: 4, ease: "linear" }}
          className="text-[#141414] opacity-20"
        >
          <Globe size={48} />
        </motion.div>
      </div>
    );
  }

  return (
    <AnimatePresence mode="wait">
      {user ? (
        <motion.div
          key="app"
          initial={{ opacity: 0 }}
          animate={{ opacity: 1 }}
          exit={{ opacity: 0 }}
        >
          <BordermathApp currentUser={user} />
        </motion.div>
      ) : (
        <motion.div
          key="landing"
          initial={{ opacity: 0 }}
          animate={{ opacity: 1 }}
          exit={{ opacity: 0 }}
        >
          <LandingPage />
        </motion.div>
      )}
    </AnimatePresence>
  );
}
