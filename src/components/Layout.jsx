import { Link, useLocation } from 'react-router-dom';
import { Archive, Settings, HelpCircle } from 'lucide-react';
import { cn } from '../lib/utils';
import { Logo } from './Branding';

function Layout({ children }) {
  const location = useLocation();

  const navItems = [
    { icon: Archive, label: 'Inbox', path: '/' },
    { icon: Settings, label: 'Settings', path: '/settings' },
    { icon: HelpCircle, label: 'Help', path: '/help' },
  ];

  return (
    <div className="min-h-screen bg-slate-50 dark:bg-slate-900 flex flex-col font-sans text-slate-900 dark:text-slate-100">
      {/* Header */}
      <header className="bg-slate-900 text-white shadow-md sticky top-0 z-50">
        <div className="container mx-auto px-4 h-14 flex justify-between items-center">
          <Link to="/" className="text-xl font-bold flex items-center gap-2 hover:opacity-90 transition-opacity">
            <Logo className="h-8 w-8" />
            <span className="text-white">HB Go</span>
          </Link>

          {/* Desktop Nav */}
          <nav className="hidden md:flex gap-6">
            {navItems.map((item) => {
              const Icon = item.icon;
              const isActive = location.pathname === item.path;
              return (
                <Link
                  key={item.path}
                  to={item.path}
                  className={cn(
                    "flex items-center gap-2 text-sm font-medium transition-colors hover:text-brand-100",
                    isActive ? "text-white" : "text-brand-200"
                  )}
                >
                  <Icon className="h-4 w-4" />
                  {item.label}
                </Link>
              );
            })}
          </nav>

           {/* Mobile Nav Placeholder (could be a hamburger menu if needed, but we use bottom bar for main nav on mobile usually, or just top links for now as the original design had top links) */}
           {/* Replicating original design's top nav for mobile but cleaner */}
           <nav className="flex md:hidden gap-4">
             {navItems.map((item) => {
                const Icon = item.icon;
                const isActive = location.pathname === item.path;
                 return (
                    <Link
                        key={item.path}
                        to={item.path}
                        className={cn(
                             "p-2 rounded-full transition-colors",
                             isActive ? "bg-brand-700 text-white" : "text-brand-200 hover:bg-brand-500"
                        )}
                        aria-label={item.label}
                    >
                        <Icon className="h-5 w-5" />
                    </Link>
                 )
             })}
           </nav>
        </div>
      </header>

      {/* Main Content */}
      <main className="flex-grow container mx-auto px-4 py-6 max-w-2xl">
        {children}
      </main>

      {/* Footer */}
      <footer className="bg-slate-100 dark:bg-slate-900 border-t border-slate-200 dark:border-slate-800 py-8 text-center text-slate-500 dark:text-slate-400 text-xs space-y-2">
        <p>HB Go • Offline PWA for <a href="https://www.gethomebank.org/" target="_blank" rel="noopener noreferrer" className="text-brand-600 dark:text-brand-400 hover:underline">HomeBank</a></p>
        <p>
          Developed by Lawrance Koh • &copy; {new Date().getFullYear()}
        </p>
        <p>
          Contact: <a href="mailto:lawrancekoh@outlook.com?subject=HB-Go%20feedback" className="text-brand-600 dark:text-brand-400 hover:underline">lawrancekoh@outlook.com</a>
        </p>
        <div className="pt-2">
          <p>
            Find this app useful? <a href="https://paypal.me/lawrancekoh" target="_blank" rel="noopener noreferrer" className="text-brand-600 dark:text-brand-400 hover:underline font-medium">Buy me a coffee ☕</a>
          </p>
        </div>
      </footer>
    </div>
  );
}

export default Layout;
