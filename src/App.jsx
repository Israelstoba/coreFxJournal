// src/App.jsx
import { BrowserRouter as Router, Routes, Route } from 'react-router-dom';
import Navbar from './components/Navbar';
import Landing from './pages/Landing';
import Calculator from './components/Calculator';
import Footer from './components/Footer';
import CfxFlip from './components/CfxFlip'; // 👈 Import new page

function App() {
  return (
    <Router>
      <Navbar />
      <Routes>
        <Route path="/" element={<Landing />} />
        <Route path="/calculator" element={<Calculator />} />
        <Route path="/journal" element={<div>Journal (Login Required)</div>} />
        <Route path="/playbooks" element={<div>Playbooks (Coming Soon)</div>} />
        <Route path="/cfx-flip" element={<CfxFlip />} /> {/* 👈 New route */}
      </Routes>
      <Footer />
    </Router>
  );
}

export default App;
