import { BrowserRouter as Router, Routes, Route, Link } from 'react-router-dom';
import DailyEvaluation from './pages/DailyEvaluation';
import MarksEntry from './pages/MarksEntry';
import ResultGeneration from './pages/ResultGeneration';
import FeeCollection from './pages/FeeCollection';
import Dashboard from './pages/Dashboard';
import BulkFeeSlips from './pages/BulkFeeSlips';
import Login from './pages/Login';
import Classes from './pages/Classes';
import Students from './pages/Students';
import './App.css';

import { AuthProvider } from './context/AuthContext';
import Navbar from './components/Navbar'; // Will create this separate component to clean up
import ProtectedRoute from './components/ProtectedRoute'; // Will create helper

function App() {
  return (
    <Router>
      <AuthProvider>
        <div className="min-h-screen bg-gray-100 font-sans text-gray-900">
          <Routes>
            <Route path="/" element={<Login />} />
            <Route path="/dashboard" element={<ProtectedRoute><Dashboard /></ProtectedRoute>} />
            <Route path="/evaluation" element={<ProtectedRoute><DailyEvaluation /></ProtectedRoute>} />
            <Route path="/fees" element={<ProtectedRoute><FeeCollection /></ProtectedRoute>} />
            <Route path="/marks" element={<ProtectedRoute><MarksEntry /></ProtectedRoute>} />
            <Route path="/results" element={<ProtectedRoute><ResultGeneration /></ProtectedRoute>} />
            <Route path="/bulk-slips" element={<ProtectedRoute><BulkFeeSlips /></ProtectedRoute>} />
            <Route path="/classes" element={<ProtectedRoute><Classes /></ProtectedRoute>} />
            <Route path="/students" element={<ProtectedRoute><Students /></ProtectedRoute>} />
          </Routes>
        </div>
      </AuthProvider>
    </Router>
  );
}

export default App;
