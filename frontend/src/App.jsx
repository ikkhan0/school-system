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
import AddStudent from './pages/AddStudent';
import EditStudent from './pages/EditStudent';
import StudentProfile from './pages/StudentProfile';
import ImportStudents from './pages/ImportStudents';
import Staff from './pages/Staff';
import AddStaff from './pages/AddStaff';
import EditStaff from './pages/EditStaff';
import StaffProfile from './pages/StaffProfile';
import StaffAttendance from './pages/StaffAttendance';
import FeeVoucher from './pages/FeeVoucher';
import ExamManager from './pages/ExamManager';
import ExamMenu from './pages/ExamMenu';
import SubjectManager from './pages/SubjectManager';
import FeeMenu from './pages/FeeMenu';
import DiscountPolicies from './pages/DiscountPolicies';
import FamilyFeeMessaging from './pages/FamilyFeeMessaging';
import SiblingManagement from './pages/SiblingManagement';
import ClassResultSheet from './pages/ClassResultSheet';
import EditExam from './pages/EditExam';
import Settings from './pages/Settings';
import AdvancedReports from './pages/reports/AdvancedReports';

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
              <Route path="/students/add" element={<ProtectedRoute><AddStudent /></ProtectedRoute>} />
              <Route path="/students/import" element={<ProtectedRoute><ImportStudents /></ProtectedRoute>} />
              <Route path="/students/edit/:id" element={<ProtectedRoute><EditStudent /></ProtectedRoute>} />
              <Route path="/student-profile/:id" element={<ProtectedRoute><StudentProfile /></ProtectedRoute>} />
              <Route path="/staff" element={<ProtectedRoute><Staff /></ProtectedRoute>} />
              <Route path="/staff/add" element={<ProtectedRoute><AddStaff /></ProtectedRoute>} />
              <Route path="/staff/edit/:id" element={<ProtectedRoute><EditStaff /></ProtectedRoute>} />
              <Route path="/staff/profile/:id" element={<ProtectedRoute><StaffProfile /></ProtectedRoute>} />
              <Route path="/staff/attendance" element={<ProtectedRoute><StaffAttendance /></ProtectedRoute>} />
              <Route path="/fee-voucher/:student_id/:month" element={<ProtectedRoute><FeeVoucher /></ProtectedRoute>} />
              <Route path="/exams" element={<ProtectedRoute><ExamManager /></ProtectedRoute>} />
              <Route path="/exams/edit/:id" element={<ProtectedRoute><EditExam /></ProtectedRoute>} />
              <Route path="/exam-menu" element={<ProtectedRoute><ExamMenu /></ProtectedRoute>} />
              <Route path="/subjects" element={<ProtectedRoute><SubjectManager /></ProtectedRoute>} />
              <Route path="/fee-menu" element={<ProtectedRoute><FeeMenu /></ProtectedRoute>} />
              <Route path="/discount-policies" element={<ProtectedRoute><DiscountPolicies /></ProtectedRoute>} />
              <Route path="/family-messaging" element={<ProtectedRoute><FamilyFeeMessaging /></ProtectedRoute>} />
              <Route path="/sibling-management" element={<ProtectedRoute><SiblingManagement /></ProtectedRoute>} />
              <Route path="/class-result-sheet" element={<ProtectedRoute><ClassResultSheet /></ProtectedRoute>} />
              <Route path="/advanced-reports" element={<ProtectedRoute><AdvancedReports /></ProtectedRoute>} />
              <Route path="/settings" element={<ProtectedRoute><Settings /></ProtectedRoute>} />
            </Routes>
          </div>
        </AuthProvider>
      </LanguageProvider>
    </Router>
  );
}

export default App;
