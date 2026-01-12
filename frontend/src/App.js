import React from 'react';
import { BrowserRouter as Router, Routes, Route } from 'react-router-dom';
import Navbar from './components/Navbar';
import Footer from './components/Footer';
import ProtectedRoute from './components/ProtectedRoute';
import Home from './pages/Home';
import Portfolio from './pages/Portfolio';
import Testimonials from './pages/Testimonials';
import Pricing from './pages/Pricing';
import Themes from './pages/Themes';
import Contact from './pages/Contact';
import About from './pages/About';
import AdminLogin from './pages/admin/Login';
import AdminDashboard from './pages/admin/Dashboard';
import ContactSubmissions from './pages/admin/ContactSubmissions';
import SiteSettings from './pages/admin/SiteSettings';
import './App.css';

function App() {
  return (
    <Router>
      <div className="App">
        <Routes>
          {/* Admin routes (no navbar/footer) */}
          <Route path="/admin/login" element={<AdminLogin />} />
          <Route 
            path="/admin/dashboard" 
            element={
              <ProtectedRoute>
                <AdminDashboard />
              </ProtectedRoute>
            } 
          />
          <Route 
            path="/admin/contact-submissions" 
            element={
              <ProtectedRoute>
                <ContactSubmissions />
              </ProtectedRoute>
            } 
          />
          <Route 
            path="/admin/site-settings" 
            element={
              <ProtectedRoute>
                <SiteSettings />
              </ProtectedRoute>
            } 
          />
          
          {/* Public routes (with navbar/footer) */}
          <Route path="/" element={
            <>
              <Navbar />
              <main>
                <Home />
              </main>
              <Footer />
            </>
          } />
          <Route path="/portfolio" element={
            <>
              <Navbar />
              <main>
                <Portfolio />
              </main>
              <Footer />
            </>
          } />
          <Route path="/testimonials" element={
            <>
              <Navbar />
              <main>
                <Testimonials />
              </main>
              <Footer />
            </>
          } />
          <Route path="/pricing" element={
            <>
              <Navbar />
              <main>
                <Pricing />
              </main>
              <Footer />
            </>
          } />
          <Route path="/themes" element={
            <>
              <Navbar />
              <main>
                <Themes />
              </main>
              <Footer />
            </>
          } />
          <Route path="/contact" element={
            <>
              <Navbar />
              <main>
                <Contact />
              </main>
              <Footer />
            </>
          } />
          <Route path="/about" element={
            <>
              <Navbar />
              <main>
                <About />
              </main>
              <Footer />
            </>
          } />
        </Routes>
      </div>
    </Router>
  );
}

export default App;
