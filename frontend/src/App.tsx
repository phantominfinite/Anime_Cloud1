import { BrowserRouter as Router, Routes, Route, useLocation } from 'react-router-dom';
import { AnimatePresence } from 'framer-motion';
import { Navbar } from './components/Navbar';
import { Home } from './pages/Home';
import { Watch } from './pages/Watch';
import Search from './pages/Search';
import Library from './pages/Library';
import Profile from './pages/Profile';
import Dashboard from './pages/Dashboard';
import { FloatingPlayer } from './components/FloatingPlayer';

const AnimatedRoutes = () => {
  const location = useLocation();
  return (
    <AnimatePresence mode="wait">
      <Routes location={location} key={location.pathname}>
        <Route path="/" element={<Home />} />
        <Route path="/anime/:id" element={<Watch />} />
        <Route path="/search" element={<Search />} />
        <Route path="/library" element={<Library />} />
        <Route path="/profile" element={<Profile />} />
        <Route path="/dashboard" element={<Dashboard />} />
        <Route path="*" element={<Home />} />
      </Routes>
    </AnimatePresence>
  );
};

const App = () => (
  <Router>
    <div className="min-h-screen bg-black text-white font-sans antialiased">
      <AnimatedRoutes />
      <FloatingPlayer />
      <Navbar />
    </div>
  </Router>
);

export default App;
