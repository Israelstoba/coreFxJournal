import { BrowserRouter as Router, Routes, Route } from 'react-router-dom';
import Navbar from './components/Navbar';
import Landing from './pages/Landing';
import Calculator from './components/Calculator';
import Footer from './components/Footer'; // ✅ Import Footer

function App() {
  return (
    <Router>
      <Navbar />
      <Routes>
        <Route path="/" element={<Landing />} />
        <Route path="/calculator" element={<Calculator />} />
        <Route path="/journal" element={<div>Journal (Login Required)</div>} />
        <Route path="/playbooks" element={<div>Playbooks (Coming Soon)</div>} />
      </Routes>
      <Footer /> {/* ✅ Works now */}
    </Router>
  );
}

export default App;
