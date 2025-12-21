import { Link, useLocation } from 'react-router-dom';
import { useContext } from 'react';
import AuthContext from '../context/AuthContext';
import { useLanguage } from '../context/LanguageContext';
import { Globe, LogOut } from 'lucide-react';

const Navbar = () => {
    const { user, logout } = useContext(AuthContext);
    const { language, toggleLanguage, t } = useLanguage();
    const location = useLocation();

    // Hide Navbar on Login page
    if (location.pathname === '/') return null;

    const isActive = (path) => location.pathname === path ? "text-blue-600 font-bold border-b-2 border-blue-600" : "text-gray-600 hover:text-blue-600";

    return (
        <nav className="bg-white shadow p-4 mb-4 no-print sticky top-0 z-50">
            <div className="max-w-7xl mx-auto flex justify-between items-center">
                <Link to="/dashboard" className="font-bold text-blue-600 text-lg flex items-center gap-2">
                    <img src="https://cdn-icons-png.flaticon.com/512/3602/3602145.png" className="w-8 h-8" alt="Logo" />
                    {user?.school_name || 'I-Soft SMS'}
                </Link>

                <div className="flex items-center gap-6">
                    <div className="hidden md:flex space-x-6 text-sm font-medium">
                        <Link to="/dashboard" className={isActive('/dashboard')}>{t('dashboard')}</Link>
                        <Link to="/students" className={isActive('/students')}>{t('students')}</Link>
                        <Link to="/evaluation" className={isActive('/evaluation')}>{t('attendance')}</Link>
                        <Link to="/fee-menu" className={isActive('/fee-menu')}>{t('fees')}</Link>
                        <Link to="/exams" className={isActive('/exams')}>{t('exams')}</Link>
                        <Link to="/results" className={isActive('/results')}>{t('reports')}</Link>
                        {/* Note: "Results" link maps to "reports" text in translation potentially, or separate? 
                           Let's align translation keys: 'results' -> ResultGeneration, 'reports' -> Reports.jsx */}
                    </div>

                    <div className="flex items-center gap-4">
                        <button
                            onClick={toggleLanguage}
                            className="flex items-center gap-1 bg-gray-100 px-3 py-1 rounded-full text-xs font-bold hover:bg-gray-200 transition"
                        >
                            <Globe size={16} />
                            {language === 'en' ? 'URDU' : 'ENGLISH'}
                        </button>

                        <button onClick={logout} className="text-red-500 hover:bg-red-50 p-2 rounded-full transition" title={t('logout')}>
                            <LogOut size={20} />
                        </button>
                    </div>
                </div>
            </div>
        </nav>
    );
};

export default Navbar;
