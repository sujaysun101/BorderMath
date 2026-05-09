import React from 'react';
import { motion } from 'motion/react';
import { Shield, MapPin, FileText, Globe, ArrowRight, CheckCircle, Clock, Zap } from 'lucide-react';
import { signInWithPopup, GoogleAuthProvider } from 'firebase/auth';
import { auth } from '../firebase';
import { cn } from '../lib/utils';

export default function LandingPage() {
  const login = () => {
    const provider = new GoogleAuthProvider();
    signInWithPopup(auth, provider);
  };

  return (
    <div className="min-h-screen bg-[#F5F2ED] text-[#141414] font-sans selection:bg-orange-100">
      {/* Navigation */}
      <nav className="fixed top-0 w-full z-50 px-8 py-6 flex justify-between items-center mix-blend-difference invert">
        <div className="flex items-center gap-2">
          <Globe size={24} />
          <span className="text-xl font-serif italic tracking-tight">Bordermath</span>
        </div>
        <button 
          onClick={login}
          className="text-[10px] font-bold uppercase tracking-widest border border-[#F5F2ED]/20 px-6 py-2 rounded-full hover:bg-[#F5F2ED] hover:text-[#141414] transition-all"
        >
          Sign In
        </button>
      </nav>

      {/* Hero Section */}
      <section className="relative h-screen flex flex-col justify-center px-8 md:px-24 pt-20">
        <div className="grid grid-cols-1 md:grid-cols-2 gap-16 items-center">
          <motion.div
            initial={{ opacity: 0, x: -30 }}
            animate={{ opacity: 1, x: 0 }}
            transition={{ duration: 0.8, ease: "easeOut" }}
          >
            <div className="flex items-center gap-3 mb-6">
              <span className="w-12 h-[1px] bg-orange-600" />
              <span className="text-[11px] font-bold uppercase tracking-[0.3em] text-orange-600">Strategic Global Mobility</span>
            </div>
            <h1 className="text-[12vw] md:text-[8vw] font-serif italic leading-[0.85] tracking-tighter mb-8 bg-clip-text">
              Global <br />
              <span className="relative">
                Mobility.
                <motion.svg 
                  className="absolute -bottom-4 left-0 w-full"
                  viewBox="0 0 400 20"
                  initial={{ pathLength: 0 }}
                  animate={{ pathLength: 1 }}
                  transition={{ duration: 2, delay: 0.5 }}
                >
                  <path d="M0 10 Q100 0 200 10 T400 10" fill="none" stroke="#ea580c" strokeWidth="2" opacity="0.3" />
                </motion.svg>
              </span>
            </h1>
            <p className="text-lg md:text-xl font-light leading-relaxed opacity-60 mb-12 max-w-lg">
              Manage your presence across 190+ jurisdictions. Calculate rolling windows, track application timelines, and navigate global boundaries with mathematical certainty.
            </p>
            <div className="flex flex-col sm:flex-row gap-6">
              <button 
                onClick={login}
                className="group relative bg-[#141414] text-white px-10 py-5 rounded-full text-xs font-bold uppercase tracking-widest overflow-hidden transition-all hover:scale-105"
              >
                <span className="relative z-10 flex items-center gap-3">
                  Start Planning <ArrowRight size={16} className="group-hover:translate-x-1 transition-transform" />
                </span>
                <motion.div 
                  className="absolute inset-0 bg-orange-600 translate-y-full group-hover:translate-y-0 transition-transform duration-300"
                />
              </button>
              <div className="flex items-center gap-4 px-6 py-4 bg-white/50 backdrop-blur-sm rounded-full border border-black/5">
                <div className="flex -space-x-2">
                  {[1, 2, 3].map(i => (
                    <div key={i} className="w-8 h-8 rounded-full border-2 border-[#F5F2ED] bg-gray-200 overflow-hidden">
                      <img src={`https://i.pravatar.cc/100?u=${i}`} alt="" referrerPolicy="no-referrer" />
                    </div>
                  ))}
                </div>
                <span className="text-[10px] font-bold uppercase opacity-40">Trusted by 2k+ Digital Nomads</span>
              </div>
            </div>
          </motion.div>

          <motion.div
            initial={{ opacity: 0, scale: 0.9 }}
            animate={{ opacity: 1, scale: 1 }}
            transition={{ duration: 1.2, ease: "easeOut" }}
            className="relative hidden md:block"
          >
            <div className="relative z-10 rounded-[3rem] overflow-hidden border border-black/5 shadow-2xl skew-x-[-2deg]">
              <img 
                src="https://images.unsplash.com/photo-1544027993-37dbfe43562a?auto=format&fit=crop&q=80&w=1000" 
                alt="Global Travel Strategy" 
                className="w-full grayscale hover:grayscale-0 transition-all duration-1000"
                referrerPolicy="no-referrer"
              />
              <div className="absolute inset-0 bg-gradient-to-t from-[#F5F2ED] via-transparent to-transparent opacity-20" />
            </div>
            
            {/* Floating Tags */}
            <motion.div 
              animate={{ y: [0, -10, 0] }}
              transition={{ repeat: Infinity, duration: 4, ease: "easeInOut" }}
              className="absolute -top-10 -right-10 bg-white p-6 rounded-3xl shadow-xl border border-black/5 z-20"
            >
              <div className="flex items-center gap-4">
                <div className="w-12 h-12 bg-green-50 rounded-2xl flex items-center justify-center text-green-600">
                  <CheckCircle size={24} />
                </div>
                <div>
                  <p className="text-[10px] font-bold uppercase opacity-30">Legality Score</p>
                  <p className="text-lg font-serif italic">100% Compliant</p>
                </div>
              </div>
            </motion.div>

            <motion.div 
              animate={{ y: [0, 10, 0] }}
              transition={{ repeat: Infinity, duration: 5, ease: "easeInOut", delay: 1 }}
              className="absolute bottom-20 -left-10 bg-[#141414] text-white p-6 rounded-3xl shadow-xl z-20"
            >
              <div className="flex items-center gap-4">
                <div className="w-12 h-12 bg-white/10 rounded-2xl flex items-center justify-center text-orange-500">
                  <Clock size={24} />
                </div>
                <div>
                  <p className="text-[10px] font-bold uppercase opacity-30">Next Renewal</p>
                  <p className="text-lg font-serif italic text-orange-500">In 14 Days</p>
                </div>
              </div>
            </motion.div>
          </motion.div>
        </div>
      </section>

      {/* Features Grid */}
      <section className="px-8 md:px-24 py-32 bg-white rounded-[4rem] mx-4">
        <div className="max-w-6xl mx-auto">
          <div className="mb-24 text-center">
            <h2 className="text-[6vw] md:text-[4vw] font-serif italic leading-none mb-6">Built for the Global Citizen.</h2>
            <p className="text-lg opacity-40 max-w-xl mx-auto">Modern tools for modern boundaries.</p>
          </div>

          <div className="grid grid-cols-1 md:grid-cols-3 gap-12">
            <div className="space-y-6">
              <div className="w-16 h-16 bg-[#F5F2ED] rounded-3xl flex items-center justify-center text-[#141414]">
                <Zap size={32} />
              </div>
              <h3 className="text-2xl font-serif italic">Rolling Window Math.</h3>
              <p className="text-sm leading-relaxed opacity-60">
                Whether it's Schengen's 90/180, US 6-month rules, or UK annual limits, our algorithm tracks your days across all jurisdictional boundaries.
              </p>
            </div>
            <div className="space-y-6">
              <div className="w-16 h-16 bg-[#F5F2ED] rounded-3xl flex items-center justify-center text-[#141414]">
                <Shield size={32} />
              </div>
              <h3 className="text-2xl font-serif italic">The Document Vault.</h3>
              <p className="text-sm leading-relaxed opacity-60">
                Encrypted storage for passports and visas. Receive predictive alerts months before your documentation loses validity.
              </p>
            </div>
            <div className="space-y-6">
              <div className="w-16 h-16 bg-[#F5F2ED] rounded-3xl flex items-center justify-center text-[#141414]">
                <Globe size={32} />
              </div>
              <h3 className="text-2xl font-serif italic">Smart Pivot Strategy.</h3>
              <p className="text-sm leading-relaxed opacity-60">
                When you hit your limits, let our strategy engine suggest non-compliance-reset countries like Turkey, Georgia, or Cyprus.
              </p>
            </div>
          </div>
        </div>
      </section>

      {/* Footer */}
      <footer className="px-8 md:px-24 py-32 text-center">
        <div className="max-w-2xl mx-auto">
          <Globe size={48} className="mx-auto mb-8 opacity-20" />
          <h2 className="text-4xl font-serif italic mb-8">Ready to borderless?</h2>
          <button 
            onClick={login}
            className="bg-[#141414] text-white px-12 py-6 rounded-full text-xs font-bold uppercase tracking-[0.3em] hover:scale-105 transition-all shadow-xl"
          >
            Join Bordermath
          </button>
          <div className="mt-24 pt-12 border-t border-black/5 flex flex-col md:flex-row justify-between items-center gap-8">
            <span className="text-[10px] font-bold uppercase opacity-30">© 2026 Bordermath Strategic Planner</span>
            <div className="flex gap-8">
              <a href="#" className="text-[10px] font-bold uppercase opacity-30 hover:opacity-100 transition-opacity">Privacy</a>
              <a href="#" className="text-[10px] font-bold uppercase opacity-30 hover:opacity-100 transition-opacity">Terms</a>
              <a href="#" className="text-[10px] font-bold uppercase opacity-30 hover:opacity-100 transition-opacity">API</a>
            </div>
          </div>
        </div>
      </footer>
    </div>
  );
}
