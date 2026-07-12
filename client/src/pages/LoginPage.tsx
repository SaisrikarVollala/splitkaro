import { useAuthStore } from '../stores/authStore';
import { authClient } from '../lib/auth.client';
import { LogIn, Sparkles, Check, Sun, Moon, ArrowRight, Wallet, Receipt } from 'lucide-react';
import { useTheme } from '../hooks/useTheme';
import { Button } from '../components/ui/button';

const LoginPage = () => {
  const { isPending } = useAuthStore();
  const { theme, toggleTheme } = useTheme();

  const handleGoogleLogin = async () => {
    await authClient.signIn.social({
      provider: "google",
      callbackURL: window.location.origin
    });
  };

  if (isPending) {
    return (
      <div className="min-h-screen flex items-center justify-center bg-background">
        <div className="animate-spin rounded-full h-12 w-12 border-b-2 border-primary"></div>
      </div>
    );
  }

  const features = [
    { title: "AI receipt scanning", desc: "Scan receipts and let Gemini AI parse individual items automatically." },
    { title: "Smart settlement", desc: "Minimize transactions and split group bills with smart suggestions." },
    { title: "Real time sync", desc: "Stay updated with real-time socket connections and live updates." },
    { title: "No ads", desc: "Clean, professional interface with zero interruptions." }
  ];

  return (
    <div className="min-h-screen flex flex-col bg-background text-foreground transition-colors duration-200 animate-fade-in">
      {/* Header */}
      <header className="h-16 max-w-5xl mx-auto w-full px-6 flex justify-between items-center border-b border-border/40">
        <div className="flex items-center gap-2">
          <div className="w-8 h-8 rounded-lg bg-primary flex items-center justify-center font-bold text-white">
            S
          </div>
          <span className="font-semibold text-lg">SplitKaro</span>
        </div>
        <Button 
          onClick={toggleTheme} 
          variant="ghost" 
          size="icon-sm"
          className="text-muted-foreground hover:text-foreground"
        >
          {theme === 'dark' ? <Sun className="w-4.5 h-4.5" /> : <Moon className="w-4.5 h-4.5" />}
        </Button>
      </header>

      {/* Main Layout */}
      <main className="flex-1 max-w-5xl mx-auto w-full px-6 py-12 lg:py-20 grid grid-cols-1 lg:grid-cols-2 gap-12 items-center">
        {/* Left Column: Form & Features */}
        <div className="space-y-8 max-w-md mx-auto lg:mx-0">
          <div className="space-y-4">
            <h1 className="text-4xl font-extrabold tracking-tight sm:text-5xl">
              SplitKaro
            </h1>
            <p className="text-xl text-muted-foreground">
              Split expenses with AI.
            </p>
          </div>

          {/* Google Sign-in */}
          <div>
            <button
              onClick={handleGoogleLogin}
              className="w-full flex items-center justify-center gap-3 bg-foreground text-background py-3.5 px-4 rounded-btn font-semibold hover:opacity-90 active:scale-[0.99] hover:scale-[1.01] transition-all shadow-md focus:outline-none border border-border cursor-pointer"
            >
              <svg className="w-5 h-5" viewBox="0 0 24 24">
                <path fill="currentColor" d="M22.56 12.25c0-.78-.07-1.53-.2-2.25H12v4.26h5.92c-.26 1.37-1.04 2.53-2.21 3.31v2.77h3.57c2.08-1.92 3.28-4.74 3.28-8.09z" />
                <path fill="#34A853" d="M12 23c2.97 0 5.46-.98 7.28-2.66l-3.57-2.77c-.98.66-2.23 1.06-3.71 1.06-2.86 0-5.29-1.93-6.16-4.53H2.18v2.84C3.99 20.53 7.7 23 12 23z" />
                <path fill="#FBBC05" d="M5.84 14.09c-.22-.66-.35-1.36-.35-2.09s.13-1.43.35-2.09V7.07H2.18C1.43 8.55 1 10.22 1 12s.43 3.45 1.18 4.93l2.85-2.22.81-.62z" />
                <path fill="#EA4335" d="M12 5.38c1.62 0 3.06.56 4.21 1.64l3.15-3.15C17.45 2.09 14.97 1 12 1 7.7 1 3.99 3.47 2.18 7.07l3.66 2.84c.87-2.6 3.3-4.53 6.16-4.53z" />
              </svg>
              Continue with Google
            </button>
          </div>

          <div className="border-t border-border/50 pt-8 space-y-6">
            <h3 className="text-sm font-semibold uppercase tracking-wider text-muted-foreground">Why SplitKaro?</h3>
            <ul className="space-y-4">
              {features.map((feat, index) => (
                <li key={index} className="flex items-start gap-3">
                  <div className="mt-0.5 rounded-full bg-primary/10 p-1 flex items-center justify-center shrink-0">
                    <Check className="w-3.5 h-3.5 text-primary" />
                  </div>
                  <div>
                    <h4 className="text-sm font-bold text-foreground">{feat.title}</h4>
                    <p className="text-xs text-muted-foreground mt-0.5">{feat.desc}</p>
                  </div>
                </li>
              ))}
            </ul>
          </div>
        </div>

        {/* Right Column: Illustration */}
        <div className="hidden lg:flex items-center justify-center p-6 h-full relative">
          <div className="absolute top-1/2 left-1/2 -translate-x-1/2 -translate-y-1/2 w-80 h-80 bg-primary/5 rounded-full filter blur-3xl pointer-events-none"></div>
          
          {/* Beautiful Mockup Illustration */}
          <div className="relative w-full max-w-sm border border-border bg-card rounded-card p-6 shadow-xl space-y-6">
            {/* Minimal Group Card Mockup */}
            <div className="flex items-center justify-between border-b border-border/50 pb-4">
              <div className="flex items-center gap-3">
                <div className="w-10 h-10 rounded-2xl bg-primary/10 border border-primary/20 flex items-center justify-center">
                  <Wallet className="w-5 h-5 text-primary" />
                </div>
                <div>
                  <h4 className="font-semibold text-xs">Weekend Getaway</h4>
                  <p className="text-[10px] text-muted-foreground">4 members • Active yesterday</p>
                </div>
              </div>
              <span className="text-[10px] font-bold text-primary bg-primary/15 px-2 py-0.5 rounded-full">
                Active
              </span>
            </div>

            {/* Ingestion Pipeline Mockup */}
            <div className="space-y-3">
              <div className="flex justify-between items-center text-xs">
                <span className="text-muted-foreground flex items-center gap-1.5">
                  <Receipt className="w-3.5 h-3.5" /> Receipt Scan
                </span>
                <span className="text-xs font-bold text-primary flex items-center gap-1">
                  <Sparkles className="w-3 h-3 animate-pulse" /> Ingested 98%
                </span>
              </div>
              
              <div className="space-y-2 bg-muted/50 p-3 rounded-btn border border-border/50">
                <div className="flex justify-between text-[11px]">
                  <span className="font-medium text-foreground">Woodland Cafe</span>
                  <span className="font-bold">₹1,240.00</span>
                </div>
                <div className="flex justify-between text-[9px] text-muted-foreground border-t border-border/30 pt-1.5 mt-1.5">
                  <span>Payer: Srikar</span>
                  <span>Share: You owe ₹310</span>
                </div>
              </div>
            </div>

            {/* Overlapping Avatars & Activity */}
            <div className="flex items-center justify-between text-xs pt-2">
              <div className="flex -space-x-2">
                <div className="w-6 h-6 rounded-full bg-zinc-200 border border-card flex items-center justify-center font-bold text-[9px] text-black">A</div>
                <div className="w-6 h-6 rounded-full bg-zinc-300 border border-card flex items-center justify-center font-bold text-[9px] text-black">B</div>
                <div className="w-6 h-6 rounded-full bg-zinc-400 border border-card flex items-center justify-center font-bold text-[9px] text-black">C</div>
                <div className="w-6 h-6 rounded-full bg-primary text-primary-foreground border border-card flex items-center justify-center font-bold text-[9px]">+1</div>
              </div>
              <span className="text-[10px] text-muted-foreground">Ready to settle</span>
            </div>
          </div>
        </div>
      </main>

      {/* Footer */}
      <footer className="py-6 text-center text-xs text-muted-foreground border-t border-border/30">
        By continuing, you agree to our Terms of Service and Privacy Policy.
      </footer>
    </div>
  );
};

export default LoginPage;
