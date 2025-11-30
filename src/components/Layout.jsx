import { Link, useLocation } from 'react-router-dom';

function Layout({ children }) {
  const location = useLocation();

  return (
    <div className="min-h-screen bg-gray-50 flex flex-col">
      <header className="bg-blue-600 text-white shadow-md">
        <div className="container mx-auto px-4 py-3 flex justify-between items-center">
          <Link to="/" className="text-xl font-bold flex items-center gap-2">
            <span className="text-2xl">⏩</span> HB Go
          </Link>
          <nav className="flex gap-4">
            <Link to="/" className={`hover:text-blue-200 ${location.pathname === '/' ? 'underline' : ''}`}>Inbox</Link>
            <Link to="/settings" className={`hover:text-blue-200 ${location.pathname === '/settings' ? 'underline' : ''}`}>Settings</Link>
            <Link to="/help" className={`hover:text-blue-200 ${location.pathname === '/help' ? 'underline' : ''}`}>Help</Link>
          </nav>
        </div>
      </header>
      <main className="flex-grow container mx-auto px-4 py-6">
        {children}
      </main>
      <footer className="bg-gray-200 text-center py-4 text-gray-600 text-sm">
        <p>HB Go - Offline PWA for HomeBank</p>
      </footer>
    </div>
  );
}

export default Layout;
