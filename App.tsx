
import React, { useState, useRef, useEffect, useMemo } from 'react';
import { Instagram, Facebook, Share2, Download, Sparkles } from 'lucide-react';
import { MemeTone, MemeState, StaticMeme, SiteStats } from './types';
import { generateMemeData } from './services/gemini';
import { fileToBase64, uploadToSupabase } from './services/imageService';
import { renderMemeToBlob } from './services/memeRenderer';
import { getStats, incrementStat, pollStats } from './services/statsService';
import { supabase } from './services/supabase';
import { fetchCredits, decrementCredits } from './services/creditService';
import { User } from '@supabase/supabase-js';

const LOGIN_SIGNUP_MEMES: StaticMeme[] = [
  { url: 'https://images.unsplash.com/photo-1531427186611-ecfd6d936c79?auto=format&fit=crop&w=800&q=80', topText: 'ME WAITING FOR', bottomText: 'THE LOGIN EMAIL' },
  { url: 'https://images.unsplash.com/photo-1517841905240-472988babdf9?auto=format&fit=crop&w=800&q=80', topText: 'POV: YOU JUST', bottomText: 'SIGNED UP FOR REEL MEME' },
  { url: 'https://images.unsplash.com/photo-1522075469751-3a6694fb2f61?auto=format&fit=crop&w=800&q=80', topText: 'REEL CREATORS', bottomText: 'AFTER USING REEL MEME' },
  { url: 'https://images.unsplash.com/photo-1494790108377-be9c29b29330?auto=format&fit=crop&w=800&q=80', topText: 'WHEN THE MEME', bottomText: 'ACTUALLY GOES VIRAL' },
  { url: 'https://images.unsplash.com/photo-1507003211169-0a1dd7228f2d?auto=format&fit=crop&w=800&q=80', topText: 'FORGETTING PASSWORD', bottomText: 'FOR THE 10TH TIME' },
];

const QUALITY_TIPS = [
  "Better photos = better memes 😄",
  "Clear photos make funnier memes",
  "Good lighting, great memes ✨"
];

const OUT_OF_CREDITS_MESSAGES = [
  "That’s all for now 😄 You cooked some good memes. Want more?",
  "Oops… memes ran out 😅 Your vibe didn’t.",
  "You’ve used today’s meme magic ✨ Feeling like making more?",
  "That was a good meme run 👏 Ready for round two?"
];

const PRICING_PLANS = [
  { 
    name: "Creator Pack", 
    price: "$4.99", 
    period: "one-time", 
    badge: null, 
    value: "100 memes • One-time",
    helper: "Great for casual creators" 
  },
  { 
    name: "Pro Unlimited", 
    price: "$9.99", 
    period: "month", 
    badge: null, 
    value: "Unlimited memes • Cancel anytime",
    helper: "Perfect for regular posting" 
  },
  { 
    name: "Pro Yearly", 
    price: "$79", 
    period: "year", 
    badge: "Most value 🔥", 
    value: "Unlimited memes • Save 33%",
    helper: "Just $6.5 / month" 
  },
];

const Header = ({ credits, isLoggedIn, isUnlimited, onLogout, setView, setShowAuthPopup }: {
  credits: number,
  isLoggedIn: boolean,
  isUnlimited: boolean,
  onLogout: () => void,
  setView: (view: 'landing' | 'editor' | 'pricing' | 'faq') => void,
  setShowAuthPopup: (show: boolean) => void
}) => {
  const handleCreateClick = () => {
    if (!isLoggedIn) {
      setShowAuthPopup(true);
    } else {
      setView('landing');
    }
  };

  return (
    <header className="py-4 px-6 border-b border-white/5 sticky top-0 bg-[#0F0F14]/80 backdrop-blur-xl z-50">
      <div className="max-w-6xl mx-auto flex justify-between items-center">
        <div className="flex items-center gap-8">
          <h1 
            onClick={() => setView('landing')}
            className="text-xl font-extrabold tracking-tighter text-white flex items-center gap-2 cursor-pointer"
          >
            <span className="bg-white text-black px-2 py-0.5 rounded">REEL</span>MEME
          </h1>
          <nav className="hidden md:flex items-center gap-6">
            <button onClick={() => setView('landing')} className="text-[10px] font-bold text-gray-500 uppercase tracking-widest hover:text-white transition-colors">Home</button>
            <button onClick={handleCreateClick} className="text-[10px] font-bold text-gray-500 uppercase tracking-widest hover:text-white transition-colors">Create</button>
            <button onClick={() => setView('pricing')} className="text-[10px] font-bold text-gray-500 uppercase tracking-widest hover:text-white transition-colors">Pricing</button>
            <button onClick={() => setView('faq')} className="text-[10px] font-bold text-gray-500 uppercase tracking-widest hover:text-white transition-colors">FAQ</button>
          </nav>
        </div>
        <div className="flex items-center gap-4">
          {!isLoggedIn && (
            <button 
              onClick={() => setShowAuthPopup(true)}
              className="text-[10px] font-bold text-gray-500 uppercase tracking-widest hover:text-white transition-colors"
            >
              Login
            </button>
          )}
          {isLoggedIn && (
            <div className="flex items-center gap-1.5 bg-blue-500/10 px-3 py-1.5 rounded-full border border-blue-500/20">
              <span className="text-blue-400 text-xs font-black">⚡ {isUnlimited ? '∞' : credits} CREDITS</span>
            </div>
          )}
          {isLoggedIn && (
            <button 
              onClick={onLogout}
              className="text-[10px] font-bold text-gray-500 uppercase tracking-widest hover:text-white transition-colors"
            >
              Logout
            </button>
          )}
          <span className="text-[10px] font-bold text-gray-500 uppercase tracking-widest hidden lg:inline-block">9:16 HD Vertical</span>
        </div>
      </div>
    </header>
  );
};

const StatsDisplay = ({ stats }: { stats: SiteStats }) => (
  <div className="flex flex-wrap gap-4 md:gap-8 pt-4">
    <div className="flex flex-col">
      <span className="text-2xl font-black text-white">🔥 {stats.memesCreated.toLocaleString()}</span>
      <span className="text-[10px] font-bold text-gray-500 uppercase tracking-widest">Memes Created</span>
    </div>
    <div className="flex flex-col">
      <span className="text-2xl font-black text-white">⬇️ {stats.downloads.toLocaleString()}</span>
      <span className="text-[10px] font-bold text-gray-500 uppercase tracking-widest">Downloads</span>
    </div>
    <div className="flex flex-col">
      <span className="text-2xl font-black text-white">👥 {stats.creatorsJoined.toLocaleString()}</span>
      <span className="text-[10px] font-bold text-gray-500 uppercase tracking-widest">Creators Joined</span>
    </div>
  </div>
);

const Footer = ({ setView }: { setView: (view: any) => void }) => (
  <footer className="py-12 px-6 border-t border-white/5 bg-black/20">
    <div className="max-w-6xl mx-auto flex flex-col md:flex-row justify-between items-center gap-6">
      <div className="flex items-center gap-2">
        <span className="bg-white text-black px-2 py-0.5 rounded text-xs font-black">REEL</span>
        <span className="text-xs font-bold text-gray-500 uppercase tracking-widest">MEME © 2024</span>
      </div>
      <div className="flex gap-8">
        <button onClick={() => setView('faq')} className="text-[10px] font-bold text-gray-500 uppercase tracking-widest hover:text-white transition-colors">FAQ</button>
        <a href="mailto:reelmeme2026@gmail.com" className="text-[10px] font-bold text-gray-500 uppercase tracking-widest hover:text-white transition-colors">Contact</a>
        <button onClick={() => setView('privacy')} className="text-[10px] font-bold text-gray-500 uppercase tracking-widest hover:text-white transition-colors">Privacy</button>
        <button onClick={() => setView('terms')} className="text-[10px] font-bold text-gray-500 uppercase tracking-widest hover:text-white transition-colors">Terms</button>
        <a href="#" className="text-[10px] font-bold text-gray-500 uppercase tracking-widest hover:text-white transition-colors">API</a>
      </div>
    </div>
  </footer>
);

const PrivacyPolicy = ({ setView }: { setView: (view: any) => void }) => (
  <div className="max-w-3xl w-full space-y-10 py-12 animate-in fade-in slide-in-from-bottom-4 duration-700 text-gray-400">
    <div className="text-center space-y-4">
      <h2 className="text-5xl font-black text-white tracking-tighter">Privacy Policy</h2>
      <p className="font-bold uppercase tracking-widest text-xs text-blue-500">Last updated: February 18, 2026</p>
    </div>
    <div className="bg-white/5 p-8 md:p-12 rounded-[3rem] border border-white/5 space-y-8 leading-relaxed">
      <section className="space-y-4">
        <h3 className="text-xl font-black text-white">1. What information we collect</h3>
        <p>When you use ReelMeme, we may collect:</p>
        <ul className="list-disc pl-5 space-y-2">
          <li>Your Google account email (for login and credits)</li>
          <li>Basic profile info from Google (name, email)</li>
          <li>Usage data (credits used, memes generated)</li>
          <li>Payment status (handled by Stripe — we do NOT see card details)</li>
        </ul>
      </section>
      <section className="space-y-4">
        <h3 className="text-xl font-black text-white">2. Images & content you upload</h3>
        <ul className="list-disc pl-5 space-y-2">
          <li>Your images are used only to generate memes</li>
          <li>We do not store your images long-term</li>
          <li>Images are processed temporarily and then discarded</li>
          <li>We do not sell, share, or reuse your photos</li>
        </ul>
        <p className="font-bold text-white italic">Your photos stay yours.</p>
      </section>
      <section className="space-y-4">
        <h3 className="text-xl font-black text-white">3. Payments & security</h3>
        <ul className="list-disc pl-5 space-y-2">
          <li>All payments are handled by Stripe</li>
          <li>We never store your card details</li>
          <li>Payments are protected using industry-standard encryption</li>
        </ul>
      </section>
      <section className="space-y-4">
        <h3 className="text-xl font-black text-white">4. Cookies & tracking</h3>
        <ul className="list-disc pl-5 space-y-2">
          <li>We may use basic cookies for login and session management</li>
          <li>No aggressive tracking</li>
          <li>No ads cookies</li>
        </ul>
      </section>
      <section className="space-y-4">
        <h3 className="text-xl font-black text-white">5. How we use your data</h3>
        <p>We use your data to:</p>
        <ul className="list-disc pl-5 space-y-2">
          <li>Let you log in</li>
          <li>Track credits and subscriptions</li>
          <li>Improve ReelMeme performance</li>
          <li>Provide support when you contact us</li>
        </ul>
        <p className="font-bold text-white italic">We do not spam you.</p>
      </section>
      <section className="space-y-4">
        <h3 className="text-xl font-black text-white">6. Data sharing</h3>
        <ul className="list-disc pl-5 space-y-2">
          <li>We do not sell your data</li>
          <li>We only share data with trusted services: Google (login) and Stripe (payments)</li>
          <li>Only what’s necessary</li>
        </ul>
      </section>
      <section className="space-y-4">
        <h3 className="text-xl font-black text-white">7. Your control</h3>
        <p>You can stop using ReelMeme anytime, cancel subscriptions anytime, or contact us for questions.</p>
        <p>Support: <a href="mailto:reelmeme2026@gmail.com" className="text-blue-400 font-bold">reelmeme2026@gmail.com</a></p>
      </section>
      <section className="space-y-4">
        <h3 className="text-xl font-black text-white">8. Changes to this policy</h3>
        <p>We may update this policy as ReelMeme grows. If we do, we’ll update the date at the top.</p>
      </section>
      <section className="space-y-4">
        <h3 className="text-xl font-black text-white">9. Contact</h3>
        <p>Questions about privacy? <a href="mailto:reelmeme2026@gmail.com" className="text-blue-400 font-bold">reelmeme2026@gmail.com</a></p>
      </section>
    </div>
    <div className="text-center">
      <button onClick={() => setView('landing')} className="text-sm font-bold text-gray-500 hover:text-white transition-colors">← Back Home</button>
    </div>
  </div>
);

const TermsOfService = ({ setView }: { setView: (view: any) => void }) => (
  <div className="max-w-3xl w-full space-y-10 py-12 animate-in fade-in slide-in-from-bottom-4 duration-700 text-gray-400">
    <div className="text-center space-y-4">
      <h2 className="text-5xl font-black text-white tracking-tighter">Terms of Service</h2>
      <p className="font-bold uppercase tracking-widest text-xs text-blue-500">Last updated: February 18, 2026</p>
    </div>
    <div className="bg-white/5 p-8 md:p-12 rounded-[3rem] border border-white/5 space-y-8 leading-relaxed">
      <section className="space-y-4">
        <h3 className="text-xl font-black text-white">1. Using ReelMeme</h3>
        <p>ReelMeme helps you upload images, generate Reel-ready memes, and download or share memes. Please use the service responsibly.</p>
      </section>
      <section className="space-y-4">
        <h3 className="text-xl font-black text-white">2. Accounts & login</h3>
        <ul className="list-disc pl-5 space-y-2">
          <li>Login is via Google</li>
          <li>One account per Google email</li>
          <li>You are responsible for activity on your account</li>
        </ul>
      </section>
      <section className="space-y-4">
        <h3 className="text-xl font-black text-white">3. Credits system</h3>
        <ul className="list-disc pl-5 space-y-2">
          <li>Each Google account gets 10 free credits (one-time)</li>
          <li>1 credit = 1 meme generation</li>
          <li>Free credits do not refresh</li>
          <li>Regenerating captions uses credits</li>
          <li>Credits have no cash value</li>
        </ul>
      </section>
      <section className="space-y-4">
        <h3 className="text-xl font-black text-white">4. Paid plans</h3>
        <p>We offer one-time credit packs, monthly subscriptions, and yearly subscriptions. Details are shown clearly on the pricing page.</p>
      </section>
      <section className="space-y-4">
        <h3 className="text-xl font-black text-white">5. No refund policy</h3>
        <ul className="list-disc pl-5 space-y-2">
          <li>All sales are final</li>
          <li>We do not offer refunds</li>
          <li>Once credits or subscriptions are activated, they cannot be reversed</li>
          <li>You can cancel subscriptions anytime to avoid future charges</li>
        </ul>
      </section>
      <section className="space-y-4">
        <h3 className="text-xl font-black text-white">6. Fair usage</h3>
        <p>For unlimited plans, usage must be reasonable. Excessive or abusive usage may be limited to protect the service.</p>
      </section>
      <section className="space-y-4">
        <h3 className="text-xl font-black text-white">7. Content responsibility</h3>
        <ul className="list-disc pl-5 space-y-2">
          <li>You own the images you upload</li>
          <li>Do not upload illegal, abusive, explicit, or harmful content</li>
          <li>ReelMeme may automatically block unsafe content</li>
          <li>ReelMeme is not responsible for how generated memes are used</li>
        </ul>
      </section>
      <section className="space-y-4">
        <h3 className="text-xl font-black text-white">8. Service availability</h3>
        <p>We aim to keep ReelMeme running smoothly. Temporary downtime may occur for updates or fixes. We do not guarantee uninterrupted service.</p>
      </section>
      <section className="space-y-4">
        <h3 className="text-xl font-black text-white">9. Termination</h3>
        <p>We may suspend or terminate accounts if these terms are violated or abuse/misuse is detected.</p>
      </section>
      <section className="space-y-4">
        <h3 className="text-xl font-black text-white">10. Changes to terms</h3>
        <p>These terms may change as ReelMeme evolves. Updated terms will be posted here with a new date.</p>
      </section>
      <section className="space-y-4">
        <h3 className="text-xl font-black text-white">11. Contact</h3>
        <p>Questions about terms or billing? <a href="mailto:reelmeme2026@gmail.com" className="text-blue-400 font-bold">reelmeme2026@gmail.com</a></p>
      </section>
    </div>
    <div className="text-center">
      <button onClick={() => setView('landing')} className="text-sm font-bold text-gray-500 hover:text-white transition-colors">← Back Home</button>
    </div>
  </div>
);

const FAQSection = ({ setView }: { setView: (view: any) => void }) => {
  const faqs = [
    { q: "How does ReelMeme work?", a: "Upload a photo, our AI analyzes it, generates viral-style captions and trending audio suggestions, and renders a 9:16 Reel-ready meme." },
    { q: "Do I need to sign up?", a: "Yes, to keep your credits safe and access your meme history, a quick Google login is required." },
    { q: "What are credits?", a: "Credits are used to generate memes. 1 credit = 1 viral meme generation." },
    { q: "Do free credits expire?", a: "Free credits are available as a one-time gift of 10 credits for each account. There is no daily refresh, so make every meme count!" },
    { q: "What happens when credits end?", a: "Once your 10 free credits are used, you can grab a Creator Pack or upgrade to Pro for unlimited meme magic." },
    { q: "Are memes Reel-ready?", a: "Absolutely. Every meme is rendered at 1080x1920, perfectly optimized for Instagram and Facebook Reels." },
    { q: "Can I regenerate captions?", a: "Yes! If the vibe isn't right, just hit regenerate to get a fresh set of AI captions." },
    { q: "Can I cancel Pro anytime?", a: "Of course. No strings attached. You can cancel your subscription with one click." },
    { q: "Is my image stored?", a: "We only process your image to generate the meme. We don't store your personal photos on our servers long-term." },
    { q: "Is payment secure?", a: "100%. We use industry-standard encrypted payment processing to keep your data safe." },
    { q: "Still need help?", a: "We've got you! Reach out to us at reelmeme2026@gmail.com and we'll get back to you as soon as possible." }
  ];

  return (
    <div className="max-w-3xl w-full space-y-12 py-12 animate-in fade-in slide-in-from-bottom-4 duration-700">
      <div className="text-center space-y-4">
        <h2 className="text-5xl font-black text-white tracking-tighter">Common Questions</h2>
        <p className="text-gray-400 font-medium">Everything you need to know about ReelMeme.</p>
      </div>
      <div className="grid gap-6">
        {faqs.map((faq, i) => (
          <div key={i} className="bg-white/5 p-8 rounded-[2rem] border border-white/5 space-y-3">
            <h3 className="text-lg font-black text-white flex items-center gap-3">
              <span className="text-blue-500">Q.</span> {faq.q}
            </h3>
            <p className="text-gray-400 leading-relaxed font-medium">{faq.a}</p>
          </div>
        ))}
      </div>
      <div className="text-center pt-8">
        <button onClick={() => setView('landing')} className="py-5 px-12 bg-white text-black rounded-full font-black text-lg hover:scale-105 transition-transform shadow-xl">Start Creating</button>
      </div>
    </div>
  );
};

const Chatbot = ({ setView }: { setView: (view: any) => void }) => {
  const [isOpen, setIsOpen] = useState(false);
  const [messages, setMessages] = useState([
    { text: "Hey 👋 Need help making memes?", isBot: true }
  ]);

  const options = [
    { label: "How it works?", action: () => addMessage("How does it work?", "Just upload a photo and our AI does the magic! It picks the best caption and trending music for your Reel.") },
    { label: "Pricing & Credits", action: () => setView('pricing') },
    { label: "Image Tips", action: () => addMessage("Any tips for photos?", "Clear lighting and centered subjects work best. The AI loves high-contrast shots!") },
    { label: "Sharing to Reels", action: () => addMessage("How do I post?", "Download the meme, then open Instagram or Facebook and upload it as a Reel. It's already sized perfectly!") },
    { label: "Contact Support", action: () => addMessage("How can I contact support?", "Need more help? We’ve got you 👇\n\nEmail: reelmeme2026@gmail.com") },
    { label: "View FAQ", action: () => setView('faq') }
  ];

  const addMessage = (userText: string, botText: string) => {
    setMessages(prev => [...prev, { text: userText, isBot: false }, { text: botText, isBot: true }]);
  };

  return (
    <div className="fixed bottom-6 right-6 z-[100]">
      {isOpen ? (
        <div className="bg-[#1A1A2E] w-[320px] md:w-[380px] h-[500px] rounded-[2.5rem] shadow-[0_20px_80px_rgba(0,0,0,0.6)] border border-white/10 flex flex-col overflow-hidden animate-in zoom-in-95 duration-300 origin-bottom-right">
          <div className="p-6 bg-white/5 border-b border-white/5 flex justify-between items-center">
            <div className="flex items-center gap-3">
              <div className="w-8 h-8 bg-blue-500 rounded-full flex items-center justify-center text-white font-black text-xs">RM</div>
              <span className="font-black text-white tracking-tight">Meme Assistant</span>
            </div>
            <button onClick={() => setIsOpen(false)} className="text-gray-500 hover:text-white transition-colors">
              <svg xmlns="http://www.w3.org/2000/svg" width="24" height="24" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="3" strokeLinecap="round" strokeLinejoin="round"><line x1="18" y1="6" x2="6" y2="18"></line><line x1="6" y1="6" x2="18" y2="18"></line></svg>
            </button>
          </div>
          <div className="flex-grow overflow-y-auto p-6 space-y-4 scrollbar-hide">
            {messages.map((m, i) => (
              <div key={i} className={`flex ${m.isBot ? 'justify-start' : 'justify-end'}`}>
                <div className={`max-w-[80%] p-4 rounded-2xl text-sm font-medium leading-relaxed ${m.isBot ? 'bg-white/5 text-gray-300 rounded-tl-none' : 'bg-blue-600 text-white rounded-tr-none'}`}>
                  {m.text}
                </div>
              </div>
            ))}
          </div>
          <div className="p-4 bg-black/20 border-t border-white/5 space-y-2">
            <p className="text-[10px] font-black text-gray-500 uppercase tracking-widest px-2 mb-2">Quick Actions</p>
            <div className="flex flex-wrap gap-2">
              {options.map((opt, i) => (
                <button key={i} onClick={opt.action} className="text-[10px] font-bold bg-white/5 hover:bg-white/10 text-gray-300 px-3 py-2 rounded-xl border border-white/5 transition-all">
                  {opt.label}
                </button>
              ))}
            </div>
          </div>
        </div>
      ) : (
        <button 
          onClick={() => setIsOpen(true)}
          className="w-16 h-16 bg-blue-600 text-white rounded-full shadow-2xl flex items-center justify-center hover:scale-110 active:scale-95 transition-all group"
        >
          <svg xmlns="http://www.w3.org/2000/svg" width="28" height="28" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="3" strokeLinecap="round" strokeLinejoin="round" className="group-hover:rotate-12 transition-transform"><path d="M21 15a2 2 0 0 1-2 2H7l-4 4V5a2 2 0 0 1 2-2h14a2 2 0 0 1 2 2z"></path></svg>
        </button>
      )}
    </div>
  );
};

export default function App() {
  const [view, setView] = useState<'landing' | 'editor' | 'pricing' | 'faq' | 'privacy' | 'terms'>('landing');
  const [user, setUser] = useState<User | null>(null);
  const [isLoggedIn, setIsLoggedIn] = useState(false);
  const [showAuthPopup, setShowAuthPopup] = useState(false);
  const [isUnlimited, setIsUnlimited] = useState(false);
  const [pendingFile, setPendingFile] = useState<File | null>(null);
  const [stats, setStats] = useState<SiteStats>({ memesCreated: 0, downloads: 0, creatorsJoined: 0 });
  const [currentTipIndex, setCurrentTipIndex] = useState(0);
  
  const [state, setState] = useState<MemeState>({
    imageSource: null,
    captions: null,
    songs: null,
    selectedTone: MemeTone.FUNNY,
    isGenerating: false,
    error: null,
    credits: 10,
  });
  
  const [lastUsedFile, setLastUsedFile] = useState<File | null>(null);
  const fileInputRef = useRef<HTMLInputElement>(null);

  useEffect(() => {
    const loadCredits = async (userId: string, email: string) => {
      const { credits, is_unlimited } = await fetchCredits(userId, email);
      setState(prev => ({ ...prev, credits }));
      setIsUnlimited(is_unlimited);
    };

    // Supabase Auth Listener
    supabase.auth.getSession().then(({ data: { session } }) => {
      setUser(session?.user ?? null);
      setIsLoggedIn(!!session);
      if (session?.user) {
        loadCredits(session.user.id, session.user.email || '');
      }
    });

    const { data: { subscription } } = supabase.auth.onAuthStateChange((_event, session) => {
      setUser(session?.user ?? null);
      setIsLoggedIn(!!session);
      if (session?.user) {
        loadCredits(session.user.id, session.user.email || '');
      }
    });

    const stopPolling = pollStats((newStats) => setStats(newStats));
    return () => {
      subscription.unsubscribe();
      stopPolling();
    };
  }, []);

  useEffect(() => {
    let interval: any;
    if (state.isGenerating) {
      interval = setInterval(() => {
        setCurrentTipIndex((prev) => (prev + 1) % QUALITY_TIPS.length);
      }, 3000);
    }
    return () => clearInterval(interval);
  }, [state.isGenerating]);

  useEffect(() => {
    localStorage.setItem('memereel_auth', isLoggedIn.toString());
  }, [isLoggedIn]);

  const randomStaticMeme = useMemo(() => {
    return LOGIN_SIGNUP_MEMES[Math.floor(Math.random() * LOGIN_SIGNUP_MEMES.length)];
  }, [view, isLoggedIn]);

  const landingTip = useMemo(() => {
    return QUALITY_TIPS[Math.floor(Math.random() * QUALITY_TIPS.length)];
  }, [view]);

  const handleStartOver = () => {
    setView('landing');
    setLastUsedFile(null);
    setPendingFile(null);
    setState(prev => ({
      ...prev,
      imageSource: null,
      captions: null,
      songs: null,
      selectedTone: MemeTone.FUNNY,
      isGenerating: false,
      error: null,
    }));
  };

  const handleLogin = async () => {
    try {
      const { error } = await supabase.auth.signInWithOAuth({
        provider: 'google',
        options: {
          redirectTo: window.location.origin
        }
      });
      if (error) throw error;
      
      // Note: The rest of the logic will be handled by the onAuthStateChange listener
    } catch (err: any) {
      alert(err.message || "Failed to login");
    }
  };

  const handleLogout = async () => {
    await supabase.auth.signOut();
    handleStartOver();
  };

  const processInput = async (file?: File) => {
    if (state.credits <= 0 && !isUnlimited) {
      setState(prev => ({ ...prev, error: "You've used all your free memes 😄 Come back later or upgrade." }));
      setView('editor');
      return;
    }

    setState(prev => ({ ...prev, isGenerating: true, error: null }));
    setView('editor');
    const activeFile = file || lastUsedFile;
    if (file) setLastUsedFile(file);

    try {
      if (!activeFile) throw new Error("No image provided.");
      const result = await fileToBase64(activeFile);
      const currentImageSource = file ? URL.createObjectURL(file) : state.imageSource;

      const { captions, songs } = await generateMemeData({
        base64Image: result.base64,
        mimeType: result.mimeType
      });

      // Supabase Integration: Upload to Storage and Save to DB
      if (user) {
        const publicUrl = await uploadToSupabase(activeFile, user.id);
        if (publicUrl) {
          await supabase.from('memes').insert({
            user_id: user.id,
            image_url: publicUrl,
            captions: captions,
            tone: state.selectedTone,
            created_at: new Date().toISOString()
          });
        }
      }

      await incrementStat('memesCreated');
      setStats(await getStats());

      // Decrement credits server-side
      let newCredits = state.credits;
      if (user) {
        newCredits = await decrementCredits(user.id);
      }

      setState(prev => ({
        ...prev,
        imageSource: currentImageSource,
        captions,
        songs,
        isGenerating: false,
        credits: isUnlimited ? prev.credits : newCredits,
      }));
    } catch (err: any) {
      setState(prev => ({ ...prev, isGenerating: false, error: err.message || "Something went wrong." }));
    }
  };

  const handleFileUpload = (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0];
    if (file) {
      if (!isLoggedIn) {
        setPendingFile(file);
        setShowAuthPopup(true);
      } else {
        processInput(file);
      }
    }
  };

  const handleDownload = async () => {
    if (!state.imageSource || !state.captions) return;
    const caption = state.captions[state.selectedTone];
    try {
      const blob = await renderMemeToBlob(state.imageSource, caption);
      const url = URL.createObjectURL(blob);
      const a = document.createElement('a');
      a.href = url;
      a.download = `reelmeme-${state.selectedTone}-${Date.now()}.png`;
      a.click();
      await incrementStat('downloads');
      setStats(await getStats());
      return true;
    } catch (err) {
      alert("Failed to download meme.");
      return false;
    }
  };

  const outOfCreditsMessage = useMemo(() => {
    return OUT_OF_CREDITS_MESSAGES[Math.floor(Math.random() * OUT_OF_CREDITS_MESSAGES.length)];
  }, [state.credits]);

  const handleSocialShare = async (platform?: 'instagram' | 'facebook') => {
    if (!state.imageSource || !state.captions) return;
    const caption = state.captions[state.selectedTone];
    
    try {
      const blob = await renderMemeToBlob(state.imageSource, caption);
      const file = new File([blob], `reelmeme-${Date.now()}.png`, { type: 'image/png' });

      if (navigator.share && navigator.canShare && navigator.canShare({ files: [file] })) {
        await navigator.share({
          files: [file],
          title: 'Check out my Reel Meme!',
          text: `Created with Reel Meme 🚀 #reelmeme #meme #reels`,
        });
        await incrementStat('downloads');
        setStats(await getStats());
      } else {
        // Fallback: Download and inform
        const success = await handleDownload();
        if (success) {
          const platformName = platform ? platform.charAt(0).toUpperCase() + platform.slice(1) : 'your social media';
          alert(`Meme downloaded! 🚀\n\nNow open ${platformName} and upload it from your gallery.`);
          
          if (platform === 'instagram') {
            window.location.href = 'instagram://';
          } else if (platform === 'facebook') {
            window.location.href = 'fb://';
          }
        }
      }
    } catch (err) {
      console.error("Sharing failed:", err);
      // Final fallback
      handleDownload();
    }
  };

  const handleCreateClick = () => {
    if (!isLoggedIn) {
      setShowAuthPopup(true);
    } else {
      setView('landing');
    }
  };

  return (
    <div className="min-h-screen flex flex-col text-[#E0E0E0]">
      <Header
        credits={state.credits}
        isLoggedIn={isLoggedIn}
        isUnlimited={isUnlimited}
        onLogout={handleLogout}
        setView={setView}
        setShowAuthPopup={setShowAuthPopup}
      />
      <main className="flex-grow flex flex-col items-center p-6 md:p-12">
        {view === 'privacy' ? (
          <PrivacyPolicy setView={setView} />
        ) : view === 'terms' ? (
          <TermsOfService setView={setView} />
        ) : view === 'faq' ? (
          <FAQSection setView={setView} />
        ) : view === 'pricing' ? (
          <div className="max-w-3xl w-full space-y-10 pt-12 animate-in slide-in-from-bottom-8 duration-600">
            <div className="text-center space-y-4">
              <h2 className="text-4xl font-black text-white tracking-tighter">Choose your plan</h2>
              <p className="text-gray-400 font-medium">Unlock the full potential of your memes.</p>
            </div>
            <div className="space-y-4">
              {PRICING_PLANS.map((plan) => (
                <div key={plan.name} className="flex flex-col md:flex-row md:items-center justify-between bg-white/5 p-8 rounded-[2.5rem] border border-white/5 hover:bg-white/[0.07] transition-all group gap-6">
                  <div className="space-y-2 flex-grow">
                    <div className="flex items-center gap-3">
                      <p className="font-black text-white text-xl">{plan.name}</p>
                      {plan.badge && <span className="text-[9px] font-black bg-blue-500/20 text-blue-400 px-2 py-0.5 rounded-full border border-blue-500/20 uppercase">{plan.badge}</span>}
                    </div>
                    <p className="text-sm text-blue-400 font-bold uppercase tracking-wider">{plan.value}</p>
                    <p className="text-xs text-gray-500 font-medium italic">{plan.helper}</p>
                  </div>
                  <div className="flex items-center justify-between md:justify-end gap-8 shrink-0">
                    <div className="text-right">
                      <p className="text-3xl font-black text-white">{plan.price}</p>
                      <p className="text-[10px] text-gray-500 font-bold uppercase tracking-widest">{plan.period === 'one-time' ? 'once' : `/ ${plan.period}`}</p>
                    </div>
                    <button className="px-8 py-4 bg-white text-black rounded-2xl font-black text-sm hover:scale-105 active:scale-95 transition-all shadow-lg">
                      Get Started
                    </button>
                  </div>
                </div>
              ))}
            </div>
            <div className="text-center space-y-6 pt-4">
              <p className="text-xs font-bold text-gray-500 uppercase tracking-[0.2em]">Unlimited memes • Better flow • No interruptions</p>
              <div className="flex flex-col gap-4">
                <button className="w-full py-6 bg-white text-black rounded-[2.2rem] font-black text-xl shadow-xl hover:scale-[1.02] active:scale-95 transition-all">Get Started</button>
                <div className="flex justify-center gap-4 text-[10px] font-bold text-gray-600 uppercase tracking-widest">
                  <button onClick={() => setView('privacy')} className="hover:text-white transition-colors">Privacy</button>
                  <span>•</span>
                  <button onClick={() => setView('terms')} className="hover:text-white transition-colors">Terms</button>
                </div>
              </div>
              <button onClick={() => setView('landing')} className="text-sm font-bold text-gray-500 hover:text-white transition-colors">Maybe later • Back Home</button>
            </div>
          </div>
        ) : view === 'landing' ? (
          <div className="max-w-6xl w-full grid grid-cols-1 md:grid-cols-2 gap-16 pt-8 items-center relative">
            <div className="space-y-10 animate-in fade-in slide-in-from-left-6 duration-700">
              <div className="space-y-6">
                <h2 className="text-6xl md:text-8xl font-black tracking-tighter leading-none text-white">
                  Reel Meme.<br/><span className="text-blue-500">Go Viral.</span>
                </h2>
                <p className="text-xl text-gray-400 font-medium max-w-sm leading-relaxed">
                  The Reel-ready meme creator. Turn your photos into high-impact vertical memes instantly.
                </p>
                <StatsDisplay stats={stats} />
              </div>
                <div className="space-y-8">
                  <div className="space-y-4">
                    <button
                      onClick={() => {
                        if (!isLoggedIn) {
                          setShowAuthPopup(true);
                        } else {
                          fileInputRef.current?.click();
                        }
                      }}
                      className="group w-full flex flex-col items-center justify-center p-16 border-4 border-dashed border-white/5 rounded-[3rem] hover:border-blue-500/50 hover:bg-white/5 transition-all shadow-2xl active:scale-[0.98] bg-white/[0.02]"
                    >
                      <div className="mb-6 text-7xl group-hover:scale-110 transition-transform duration-500">📸</div>
                      <span className="text-2xl font-black text-white">Upload Photo</span>
                      <input type="file" ref={fileInputRef} onChange={handleFileUpload} className="hidden" accept="image/*" />
                    </button>
                    <p className="text-center text-sm font-bold text-blue-400 italic animate-pulse">
                      ✨ Tip: {landingTip}
                    </p>
                  </div>
                  <p className="text-center text-[10px] text-gray-500 font-bold uppercase tracking-[0.2em]">
                    {isLoggedIn ? `Logged in • ${isUnlimited ? 'Unlimited' : state.credits} credits left` : "Modern humor • Optimized for Reels"}
                  </p>
                </div>
            </div>
            <div className="hidden md:flex flex-col items-center animate-in fade-in slide-in-from-right-6 duration-700 delay-200">
              <div className="relative aspect-[9/16] w-full max-w-sm rounded-[2.5rem] overflow-hidden shadow-[0_0_80px_rgba(0,0,0,0.5)] ring-1 ring-white/10 bg-black group">
                <img src={randomStaticMeme.url} alt="Static Meme" className="w-full h-full object-cover brightness-75 group-hover:scale-105 transition-transform duration-1000" />
                <div className="absolute inset-x-0 top-12 text-center px-6">
                  <p className="text-[#E0E0E0] font-black text-4xl uppercase leading-none tracking-wider drop-shadow-[0_4px_4px_rgba(0,0,0,0.8)]" style={{ fontFamily: '"Impact", sans-serif' }}>{randomStaticMeme.topText}</p>
                </div>
                <div className="absolute inset-x-0 bottom-12 text-center px-6">
                  <p className="text-[#E0E0E0] font-black text-4xl uppercase leading-none tracking-wider drop-shadow-[0_4px_4px_rgba(0,0,0,0.8)]" style={{ fontFamily: '"Impact", sans-serif' }}>{randomStaticMeme.bottomText}</p>
                </div>
              </div>
              <p className="mt-8 text-xs font-bold text-gray-600 uppercase tracking-[0.3em] animate-pulse">Refresh for vibes 👀</p>
            </div>
            {showAuthPopup && (
              <div className="fixed inset-0 bg-black/80 backdrop-blur-xl z-[100] flex items-center justify-center p-6 animate-in fade-in duration-300">
                <div className="bg-[#1A1A2E] max-w-md w-full rounded-[3.5rem] p-12 shadow-[0_0_100px_rgba(0,0,0,0.8)] border border-white/5 space-y-10 animate-in zoom-in-95 duration-300">
                  <div className="text-center space-y-3">
                    <div className="text-7xl mb-6 drop-shadow-lg">🙌</div>
                    <h3 className="text-3xl font-black tracking-tight text-white">Almost there!</h3>
                    <p className="text-gray-400 font-medium italic">Your image is ready to be memed.</p>
                  </div>
                  <div className="space-y-4">
                    <button onClick={handleLogin} className="w-full py-6 bg-white text-black rounded-[2rem] font-black text-xl shadow-xl hover:scale-[1.02] active:scale-95 transition-all flex items-center justify-center gap-4">
                      <img src="https://www.gstatic.com/firebasejs/ui/2.0.0/images/auth/google.svg" className="w-6 h-6" alt="G" />
                      Sign up with Google
                    </button>
                    <div className="text-center space-y-3">
                      <button onClick={handleLogin} className="w-full text-gray-500 hover:text-white font-bold text-sm transition-colors">I already have an account</button>
                      <div className="flex justify-center gap-3 text-[10px] font-bold text-gray-600 uppercase tracking-widest">
                        <button onClick={() => { setView('privacy'); setShowAuthPopup(false); }} className="hover:text-white transition-colors">Privacy Policy</button>
                        <span>•</span>
                        <button onClick={() => { setView('terms'); setShowAuthPopup(false); }} className="hover:text-white transition-colors">Terms of Service</button>
                      </div>
                    </div>
                  </div>
                  <button onClick={() => setShowAuthPopup(false)} className="w-full text-xs font-bold text-gray-600 uppercase tracking-widest">Cancel upload</button>
                </div>
              </div>
            )}
          </div>
        ) : (
          <div className="max-w-md w-full space-y-8 animate-in slide-in-from-bottom-8 duration-600 pb-24">
            {state.isGenerating ? (
              <div className="flex flex-col items-center justify-center py-48 space-y-10">
                <div className="relative w-24 h-24">
                  <div className="absolute inset-0 border-4 border-white/5 rounded-full"></div>
                  <div className="absolute inset-0 border-4 border-t-blue-500 rounded-full animate-spin"></div>
                </div>
                <div className="text-center space-y-4">
                  <p className="text-3xl font-black text-white tracking-tight animate-in fade-in duration-500 min-h-[6rem] flex items-center justify-center px-4">
                    {QUALITY_TIPS[currentTipIndex]}
                  </p>
                  <p className="text-xs font-bold text-blue-500 uppercase tracking-[0.4em] animate-pulse">
                    Meme loading...
                  </p>
                </div>
              </div>
            ) : state.error || (state.credits <= 0 && !isUnlimited) ? (
              <div className="text-center space-y-10 pt-12 bg-white/5 p-8 md:p-12 rounded-[3.5rem] shadow-2xl border border-white/5 animate-in zoom-in-95 duration-500 max-w-2xl mx-auto">
                {state.credits <= 0 && !isUnlimited ? (
                  <>
                    <div className="text-8xl animate-bounce">✨</div>
                    <div className="space-y-4">
                      <h3 className="text-2xl md:text-3xl font-black text-white leading-tight">
                        {outOfCreditsMessage}
                      </h3>
                      <p className="text-blue-400 font-bold uppercase tracking-widest text-xs">Pick what works for you 👇</p>
                      <p className="text-[10px] text-gray-500 font-bold uppercase tracking-widest">No pressure. Cancel anytime.</p>
                    </div>
                    
                    <div className="space-y-4 text-left">
                      {PRICING_PLANS.map((plan) => (
                        <div key={plan.name} className="flex flex-col sm:flex-row sm:items-center justify-between bg-white/5 p-6 rounded-3xl border border-white/5 hover:border-white/10 transition-colors group gap-4">
                          <div className="space-y-1">
                            <div className="flex items-center gap-2">
                              <p className="font-black text-white">{plan.name}</p>
                              {plan.badge && <span className="text-[8px] font-black bg-blue-500/20 text-blue-400 px-2 py-0.5 rounded-full border border-blue-500/20 uppercase">{plan.badge}</span>}
                            </div>
                            <p className="text-[10px] text-blue-400 font-bold uppercase tracking-wider">{plan.value}</p>
                            <p className="text-[10px] text-gray-500 font-medium italic">{plan.helper}</p>
                          </div>
                          <div className="flex items-center justify-between sm:justify-end gap-6">
                            <div className="text-right">
                              <p className="text-xl font-black text-white">{plan.price}</p>
                              <p className="text-[9px] text-gray-600 font-bold uppercase">{plan.period === 'one-time' ? 'once' : `/ ${plan.period}`}</p>
                            </div>
                            <button className="px-5 py-2.5 bg-white/10 text-white rounded-xl font-black text-[10px] uppercase tracking-widest hover:bg-white hover:text-black transition-all">
                              Select
                            </button>
                          </div>
                        </div>
                      ))}
                    </div>

                    <div className="space-y-6 pt-4">
                      <p className="text-[10px] font-bold text-gray-500 uppercase tracking-[0.2em]">Unlimited memes • Better flow • No interruptions</p>
                      <div className="flex flex-col gap-3">
                        <button className="w-full py-6 bg-blue-500 text-white rounded-[2rem] font-black text-xl shadow-[0_10px_40px_rgba(59,130,246,0.3)] hover:scale-[1.02] active:scale-95 transition-all">
                          Get more memes
                        </button>
                        <button onClick={() => setView('pricing')} className="w-full py-4 text-gray-400 hover:text-white font-bold text-sm transition-colors">
                          See details
                        </button>
                      </div>
                      <div className="flex justify-center gap-4 text-[10px] font-bold text-gray-600 uppercase tracking-widest">
                        <button onClick={() => setView('privacy')} className="hover:text-white transition-colors">Privacy</button>
                        <span>•</span>
                        <button onClick={() => setView('terms')} className="hover:text-white transition-colors">Terms</button>
                      </div>
                    </div>
                    
                    <button onClick={handleStartOver} className="text-[10px] font-black text-gray-600 uppercase tracking-[0.3em] hover:text-gray-400 transition-colors">
                      Maybe later • Back Home
                    </button>
                  </>
                ) : (
                  <>
                    <div className="text-8xl">💀</div>
                    <h3 className="text-3xl font-black italic text-white">Hold on...</h3>
                    <p className="text-gray-400 leading-relaxed text-lg">{state.error}</p>
                    <button onClick={handleStartOver} className="w-full py-5 bg-white text-black rounded-3xl font-black text-xl shadow-xl hover:scale-105 transition-transform">Back Home</button>
                  </>
                )}
              </div>
            ) : (
              <>
                <div className="aspect-[9/16] w-full relative bg-black rounded-[3rem] overflow-hidden shadow-[0_20px_100px_rgba(0,0,0,0.8)] ring-1 ring-white/10">
                  {state.imageSource && (
                    <div className="w-full h-full relative">
                      <img src={state.imageSource} alt="" className="absolute inset-0 w-full h-full object-cover blur-3xl opacity-30 scale-125" />
                      <img src={state.imageSource} alt="Meme base" className="absolute inset-0 w-full h-full object-contain z-10 brightness-[1.05] contrast-[1.05]" />
                    </div>
                  )}
                  {state.captions && (
                    <div className="absolute inset-x-0 bottom-0 p-12 bg-gradient-to-t from-black/90 via-black/30 to-transparent pt-40 z-20">
                      <p className="text-[#E0E0E0] text-center font-black text-4xl md:text-5xl uppercase leading-[0.95] tracking-wider drop-shadow-[0_6px_6px_rgba(0,0,0,0.9)]" style={{ fontFamily: '"Impact", sans-serif' }}>{state.captions[state.selectedTone]}</p>
                    </div>
                  )}
                </div>
                <div className="grid grid-cols-4 bg-white/5 p-2 rounded-[2rem] border border-white/5 shadow-2xl backdrop-blur-md">
                  {Object.values(MemeTone).map((tone) => (
                    <button key={tone} onClick={() => setState(prev => ({ ...prev, selectedTone: tone }))} className={`py-4 px-2 rounded-2xl text-[10px] md:text-xs font-black capitalize transition-all duration-300 ${state.selectedTone === tone ? 'bg-white text-black shadow-lg scale-105' : 'text-gray-500 hover:text-gray-300'}`}>
                      {tone === MemeTone.FUNNY && '😆 Funny'}{tone === MemeTone.SARCASTIC && '😏 Sarcastic'}{tone === MemeTone.SAVAGE && '🤡 Savage'}{tone === MemeTone.RELATABLE && '🧠 Relatable'}
                    </button>
                  ))}
                </div>
                {state.songs && (
                  <div className="bg-blue-500/5 rounded-[2.5rem] p-8 border border-blue-500/10 animate-in zoom-in-95 duration-500 shadow-xl">
                    <div className="flex items-center gap-3 text-[11px] font-black text-blue-400 uppercase tracking-[0.2em] mb-4"><span>🎵 Trending Audio</span></div>
                    <div className="flex justify-between items-center bg-white/5 p-5 rounded-3xl border border-white/5">
                      <div className="overflow-hidden">
                        <p className="font-black text-base truncate text-white">{state.songs[state.selectedTone].name}</p>
                        <p className="text-sm text-gray-500 font-medium truncate">{state.songs[state.selectedTone].artist}</p>
                      </div>
                      <span className="text-[10px] font-black bg-blue-500/20 px-3 py-1.5 rounded-xl text-blue-300 uppercase ml-4 shrink-0 border border-blue-500/10">{state.songs[state.selectedTone].reason}</span>
                    </div>
                  </div>
                )}
                <div className="flex flex-col gap-6 pt-4">
                  <div className="space-y-4">
                    <p className="text-center text-[10px] font-black text-gray-500 uppercase tracking-[0.3em]">Share your meme 🚀</p>
                    <div className="grid grid-cols-2 gap-3">
                      <button 
                        onClick={() => handleSocialShare('instagram')}
                        className="flex items-center justify-center gap-2 py-4 bg-gradient-to-tr from-[#F58529] via-[#DD2A7B] to-[#8134AF] text-white rounded-2xl font-black text-sm hover:opacity-90 transition-all active:scale-[0.97] shadow-lg"
                      >
                        <Instagram size={18} />
                        Instagram
                      </button>
                      <button 
                        onClick={() => handleSocialShare('facebook')}
                        className="flex items-center justify-center gap-2 py-4 bg-[#1877F2] text-white rounded-2xl font-black text-sm hover:opacity-90 transition-all active:scale-[0.97] shadow-lg"
                      >
                        <Facebook size={18} />
                        Facebook
                      </button>
                    </div>
                  </div>

                  <div className="flex flex-col gap-3">
                    <button 
                      onClick={handleDownload} 
                      className="w-full py-6 bg-white text-black rounded-[2.2rem] font-black text-xl hover:bg-gray-200 transition-all active:scale-[0.97] shadow-[0_10px_40px_rgba(255,255,255,0.1)] flex items-center justify-center gap-3"
                    >
                      <Download size={24} />
                      Save to Device
                    </button>
                    <button 
                      onClick={() => handleSocialShare()} 
                      className="w-full py-4 bg-white/5 text-white rounded-[2.2rem] font-bold text-base hover:bg-white/10 border border-white/5 transition-all active:scale-[0.97] flex items-center justify-center gap-2"
                    >
                      <Share2 size={18} />
                      More Options
                    </button>
                  </div>
                </div>
                <div className="flex justify-between pt-10 border-t border-white/5">
                  <button onClick={handleStartOver} className="text-sm font-bold text-gray-500 hover:text-white transition-colors">← New Photo</button>
                  <button onClick={() => processInput()} className="text-sm font-bold text-blue-400 hover:text-blue-300 transition-colors flex items-center gap-2">{state.credits > 0 || isUnlimited ? `Regenerate (1 ⚡) 🔄` : 'Out of credits 💀'}</button>
                </div>
              </>
            )}
          </div>
        )}
      </main>
      <Chatbot setView={setView} />
      <Footer setView={setView} />
    </div>
  );
}
