import { BrowserRouter as Router, Routes, Route } from 'react-router-dom';
import { AuthProvider } from './context/AuthContext';
import { LanguageProvider } from './context/LanguageContext';

// Components
import Navbar from './components/Navbar';
import ProtectedRoute from './components/ProtectedRoute';

// Pages
import Login from './pages/Login';
import Dashboard from './pages/Dashboard';
import DailyEvaluation from './pages/DailyEvaluation';
import FeeCollection from './pages/FeeCollection';
import MarksEntry from './pages/MarksEntry';
import ResultGeneration from './pages/ResultGeneration';
import Reports from './pages/Reports';
import BulkFeeSlips from './pages/BulkFeeSlips';
import Classes from './pages/Classes';
import Students from './pages/Students';
import StudentProfile from './pages/StudentProfile';
import FeeVoucher from './pages/FeeVoucher';
import ExamManager from './pages/ExamManager';
import ExamMenu from './pages/ExamMenu';
import SubjectManager from './pages/SubjectManager';
import FeeMenu from './pages/FeeMenu';
import Settings from './pages/Settings';

import './App.css';

function App() {
  return (
    <Router>
      <LanguageProvider>
        <AuthProvider>
          <div className="min-h-screen bg-gray-100 font-sans text-gray-900">
            <Navbar />
            <Routes>
              <Route path="/" element={<Login />} />
              <Route path="/dashboard" element={<ProtectedRoute><Dashboard /></ProtectedRoute>} />
              <Route path="/evaluation" element={<ProtectedRoute><DailyEvaluation /></ProtectedRoute>} />
              <Route path="/fees" element={<ProtectedRoute><FeeCollection /></ProtectedRoute>} />
              <Route path="/fee-collection" element={<ProtectedRoute><FeeCollection /></ProtectedRoute>} />
              <Route path="/marks" element={<ProtectedRoute><MarksEntry /></ProtectedRoute>} />
              <Route path="/results" element={<ProtectedRoute><ResultGeneration /></ProtectedRoute>} />
              <Route path="/reports" element={<ProtectedRoute><Reports /></ProtectedRoute>} />
              <Route path="/bulk-slips" element={<ProtectedRoute><BulkFeeSlips /></ProtectedRoute>} />
              <Route path="/classes" element={<ProtectedRoute><Classes /></ProtectedRoute>} />
              <Route path="/students" element={<ProtectedRoute><Students /></ProtectedRoute>} />
              <Route path="/student-profile/:id" element={<ProtectedRoute><StudentProfile /></ProtectedRoute>} />
              <Route path="/fee-voucher/:student_id/:month" element={<ProtectedRoute><FeeVoucher /></ProtectedRoute>} />
              <Route path="/exams" element={<ProtectedRoute><ExamManager /></ProtectedRoute>} />
              <Route path="/exam-menu" element={<ProtectedRoute><ExamMenu /></ProtectedRoute>} />
              <Route path="/subjects" element={<ProtectedRoute><SubjectManager /></ProtectedRoute>} />
              <Route path="/fee-menu" element={<ProtectedRoute><FeeMenu /></ProtectedRoute>} />
              <Route path="/settings" element={<ProtectedRoute><Settings /></ProtectedRoute>} />
            </Routes>
          </div>
        </AuthProvider>
      </LanguageProvider>
    </Router>
  );
}

export default App;
