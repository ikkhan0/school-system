import { BrowserRouter as Router, Routes, Route } from 'react-router-dom';
import { AuthProvider } from './context/AuthContext';
import { LanguageProvider } from './context/LanguageContext';
import { SessionProvider } from './context/SessionContext';
import { SettingsProvider } from './context/SettingsContext';

// Components
import Layout from './components/Layout';
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
import SuperAdminLogin from './pages/SuperAdminLogin';
import SuperAdminDashboard from './pages/SuperAdminDashboard';
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
import UserManagement from './pages/UserManagement';
import ExpenseHeads from './pages/ExpenseHeads';
import Expenses from './pages/Expenses';
import SessionManagement from './pages/SessionManagement';
import StudentPromotion from './pages/StudentPromotion';
import Funds from './pages/Funds';
import WhatsappTemplates from './pages/WhatsappTemplates';
import BulkSubjectAssignment from './pages/BulkSubjectAssignment';
import Profile from './pages/Profile';
import AttendanceReport from './pages/AttendanceReport';
import StaffAttendanceReport from './pages/StaffAttendanceReport';
import MonthlyAttendanceSheet from './pages/MonthlyAttendanceSheet';
import StudentCustomFees from './pages/StudentCustomFees';
import StudentEnrollments from './pages/StudentEnrollments';

// Inventory Pages
import InventoryItems from './pages/Inventory/InventoryItems';
import InventoryCategories from './pages/Inventory/InventoryCategories';
import InventoryStores from './pages/Inventory/InventoryStores';
import InventorySuppliers from './pages/Inventory/InventorySuppliers';
import StockEntry from './pages/Inventory/StockEntry';
import StockIssuance from './pages/Inventory/StockIssuance';
import InventoryReports from './pages/Inventory/InventoryReports';

// Accounting Pages
import ChartOfAccounts from './pages/Accounting/ChartOfAccounts';
import VoucherEntry from './pages/Accounting/VoucherEntry';
import VoucherList from './pages/Accounting/VoucherList';
import TrialBalance from './pages/Accounting/TrialBalance';
import GeneralLedger from './pages/Accounting/GeneralLedger';

import './App.css';

function App() {
  return (
    <Router>
      <LanguageProvider>
        <AuthProvider>
          <SettingsProvider>
            <SessionProvider>
              <Layout>
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
                  <Route path="/students/import" element={<ImportStudents />} />

                  {/* Super Admin Routes */}
                  <Route path="/super-admin/login" element={<SuperAdminLogin />} />
                  <Route path="/super-admin/dashboard" element={<SuperAdminDashboard />} />
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
                  <Route path="/bulk-subject-assignment" element={<ProtectedRoute><BulkSubjectAssignment /></ProtectedRoute>} />
                  <Route path="/fee-menu" element={<ProtectedRoute><FeeMenu /></ProtectedRoute>} />
                  <Route path="/discount-policies" element={<ProtectedRoute><DiscountPolicies /></ProtectedRoute>} />
                  <Route path="/family-messaging" element={<ProtectedRoute><FamilyFeeMessaging /></ProtectedRoute>} />
                  <Route path="/sibling-management" element={<ProtectedRoute><SiblingManagement /></ProtectedRoute>} />
                  <Route path="/class-result-sheet" element={<ProtectedRoute><ClassResultSheet /></ProtectedRoute>} />
                  <Route path="/advanced-reports" element={<ProtectedRoute><AdvancedReports /></ProtectedRoute>} />
                  <Route path="/users" element={<ProtectedRoute><UserManagement /></ProtectedRoute>} />
                  <Route path="/settings" element={<ProtectedRoute><Settings /></ProtectedRoute>} />
                  <Route path="/expense-heads" element={<ProtectedRoute><ExpenseHeads /></ProtectedRoute>} />
                  <Route path="/expenses" element={<ProtectedRoute><Expenses /></ProtectedRoute>} />
                  <Route path="/sessions" element={<ProtectedRoute><SessionManagement /></ProtectedRoute>} />
                  <Route path="/student-promotion" element={<ProtectedRoute><StudentPromotion /></ProtectedRoute>} />
                  <Route path="/funds" element={<ProtectedRoute><Funds /></ProtectedRoute>} />
                  <Route path="/whatsapp-templates" element={<ProtectedRoute><WhatsappTemplates /></ProtectedRoute>} />
                  <Route path="/profile" element={<ProtectedRoute><Profile /></ProtectedRoute>} />
                  <Route path="/attendance-report" element={<ProtectedRoute><AttendanceReport /></ProtectedRoute>} />
                  <Route path="/staff-attendance-report" element={<ProtectedRoute><StaffAttendanceReport /></ProtectedRoute>} />
                  <Route path="/monthly-attendance-sheet" element={<ProtectedRoute><MonthlyAttendanceSheet /></ProtectedRoute>} />
                  <Route path="/student-fees" element={<ProtectedRoute><StudentCustomFees /></ProtectedRoute>} />
                  <Route path="/enrollments" element={<ProtectedRoute><StudentEnrollments /></ProtectedRoute>} />

                  {/* Inventory Routes */}
                  <Route path="/inventory/items" element={<ProtectedRoute><InventoryItems /></ProtectedRoute>} />
                  <Route path="/inventory/categories" element={<ProtectedRoute><InventoryCategories /></ProtectedRoute>} />
                  <Route path="/inventory/stores" element={<ProtectedRoute><InventoryStores /></ProtectedRoute>} />
                  <Route path="/inventory/suppliers" element={<ProtectedRoute><InventorySuppliers /></ProtectedRoute>} />
                  <Route path="/inventory/add-stock" element={<ProtectedRoute><StockEntry /></ProtectedRoute>} />
                  <Route path="/inventory/issue" element={<ProtectedRoute><StockIssuance /></ProtectedRoute>} />
                  <Route path="/inventory/reports" element={<ProtectedRoute><InventoryReports /></ProtectedRoute>} />

                  {/* Accounting Routes */}
                  <Route path="/accounting/chart-of-accounts" element={<ProtectedRoute><ChartOfAccounts /></ProtectedRoute>} />
                  <Route path="/accounting/voucher" element={<ProtectedRoute><VoucherEntry /></ProtectedRoute>} />
                  <Route path="/accounting/vouchers" element={<ProtectedRoute><VoucherList /></ProtectedRoute>} />
                  <Route path="/accounting/ledger" element={<ProtectedRoute><GeneralLedger /></ProtectedRoute>} />
                  <Route path="/accounting/trial-balance" element={<ProtectedRoute><TrialBalance /></ProtectedRoute>} />
                </Routes>
              </Layout>
            </SessionProvider>
          </SettingsProvider>
        </AuthProvider>
      </LanguageProvider>
    </Router>
  );
}

export default App;
