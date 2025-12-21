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

import { LanguageProvider } from './context/LanguageContext';

function App() {
  return (
    <Router>
      <LanguageProvider>
        <AuthProvider>
          <div className="min-h-screen bg-gray-100 font-sans text-gray-900">
            <Routes>
              <Route path="/" element={<Login />} />
              <Route path="/dashboard" element={<ProtectedRoute><Dashboard /></ProtectedRoute>} />
              <Route path="/evaluation" element={<ProtectedRoute><DailyEvaluation /></ProtectedRoute>} />
              <Route path="/fees" element={<ProtectedRoute><FeeCollection /></ProtectedRoute>} />
              <Route path="/marks" element={<ProtectedRoute><MarksEntry /></ProtectedRoute>} />
              <Route path="/results" element={<ProtectedRoute><ResultGeneration /></ProtectedRoute>} />
              <Route path="/reports" element={<ProtectedRoute><Reports /></ProtectedRoute>} /> {/* New Route */}
              <Route path="/bulk-slips" element={<ProtectedRoute><BulkFeeSlips /></ProtectedRoute>} />
              <Route path="/classes" element={<ProtectedRoute><Classes /></ProtectedRoute>} />
              <Route path="/students" element={<ProtectedRoute><Students /></ProtectedRoute>} />
              <Route path="/exams" element={<ProtectedRoute><ExamManager /></ProtectedRoute>} /> {/* New Route */}
              <Route path="/fee-menu" element={<ProtectedRoute><FeeMenu /></ProtectedRoute>} />
            </Routes>
          </div>
        </AuthProvider>
      </LanguageProvider>
    </Router>
  );
}

export default App;
