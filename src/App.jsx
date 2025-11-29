import { useState } from 'react'
import { HashRouter, Routes, Route, Link } from 'react-router-dom'

// Placeholder components for now
const Home = () => (
  <div className="p-4">
    <div className="flex justify-between items-center mb-6">
      <h1 className="text-2xl font-bold text-gray-800">Inbox</h1>
      <div className="bg-gray-200 px-3 py-1 rounded-full text-sm font-medium">
        Total: $0.00
      </div>
    </div>

    <div className="text-center py-10 text-gray-500">
      <p>No transactions yet.</p>
      <p className="text-sm mt-2">Tap + to add one.</p>
    </div>

    {/* Floating Action Button (FAB) */}
    <div className="fixed bottom-6 right-6">
      <button className="bg-blue-600 hover:bg-blue-700 text-white rounded-full p-4 shadow-lg focus:outline-none focus:ring-2 focus:ring-blue-500 focus:ring-offset-2">
        <span className="text-2xl leading-none block pb-1">+</span>
      </button>
    </div>
  </div>
)

const Layout = ({ children }) => (
  <div className="max-w-md mx-auto min-h-screen bg-gray-50 shadow-sm">
    <header className="bg-white border-b border-gray-200 p-4 sticky top-0 z-10">
      <div className="flex justify-between items-center">
        <Link to="/" className="text-xl font-bold text-blue-600">HB Go</Link>
        <nav className="space-x-4 text-sm text-gray-600">
          <Link to="/" className="hover:text-blue-600">Inbox</Link>
          <span className="text-gray-300">|</span>
          <Link to="/settings" className="hover:text-blue-600">Settings</Link>
        </nav>
      </div>
    </header>
    <main>
      {children}
    </main>
  </div>
)

const Settings = () => (
    <div className="p-4">
        <h2 className="text-xl font-bold mb-4">Settings</h2>
        <p className="text-gray-600">Settings page placeholder.</p>
    </div>
)


function App() {
  return (
    <HashRouter>
      <Layout>
        <Routes>
          <Route path="/" element={<Home />} />
          <Route path="/settings" element={<Settings />} />
        </Routes>
      </Layout>
    </HashRouter>
  )
}

export default App
