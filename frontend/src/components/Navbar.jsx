import { Link, useLocation } from 'react-router-dom';
import { useContext, useEffect, useState } from 'react';
import axios from 'axios';
import API_URL from '../config';
import AuthContext from '../context/AuthContext';
import { useLanguage } from '../context/LanguageContext';
import { Globe, LogOut, Settings as SettingsIcon, Menu, X, Home, Users, Calendar, DollarSign, FileText, BookOpen, UserCheck, MessageCircle, Users2 } from 'lucide-react';

const Navbar = () => {
    const { user, logout } = useContext(AuthContext);
    const { language, toggleLanguage, t } = useLanguage();
    const location = useLocation();
    const [schoolInfo, setSchoolInfo] = useState(null);
    const [mobileMenuOpen, setMobileMenuOpen] = useState(false);

    // Hide Navbar on Login page
    if (location.pathname === '/') return null;

    const isActive = (path) => location.pathname === path;

    useEffect(() => {
        if (user && user.token) {
            axios.get(`${API_URL}/api/school`, {
                headers: { Authorization: `Bearer ${user.token}` }
            })
                .then(res => setSchoolInfo(res.data))
                .catch(err => console.error("Failed to fetch school info:", err));
        }
    }, [user]);

    // Close mobile menu when route changes
    useEffect(() => {
        setMobileMenuOpen(false);
    }, [location.pathname]);

    // Construct Logo URL
    const logoUrl = schoolInfo?.logo ? `${API_URL}${schoolInfo.logo}` : "https://cdn-icons-png.flaticon.com/512/3602/3602145.png";
    const schoolName = schoolInfo?.name || user?.school_name || 'I-Soft SMS';

    const navLinks = [
        { path: '/dashboard', label: t('dashboard'), icon: Home },
        { path: '/students', label: t('students'), icon: Users },
        { path: '/staff', label: 'Staff', icon: UserCheck },
        { path: '/evaluation', label: t('attendance'), icon: Calendar },
        { path: '/fee-menu', label: t('fees'), icon: DollarSign },
        { path: '/exam-menu', label: t('exams'), icon: BookOpen },
        { path: '/sibling-management', label: 'Siblings', icon: Users2 },
        { path: '/family-messaging', label: 'WhatsApp', icon: MessageCircle },
        { path: '/reports', label: t('reports'), icon: FileText }
    ];

    return (
        <>
            <nav className="bg-white shadow-md p-4 mb-4 no-print sticky top-0 z-50">
                <div className="max-w-7xl mx-auto flex justify-between items-center">
                    {/* Logo */}
                    <Link to="/dashboard" className="font-bold text-blue-600 text-lg flex items-center gap-2">
                        <img src={logoUrl} className="w-8 h-8 object-cover rounded-full" alt="Logo" />
                        <span className="hidden sm:inline">{schoolName}</span>
                        <span className="sm:hidden">SMS</span>
                    </Link>

                    {/* Desktop Navigation */}
                    <div className="hidden lg:flex items-center gap-6">
                        <div className="flex space-x-6 text-sm font-medium">
                            {navLinks.map(link => (
                                <Link
                                    key={link.path}
                                    to={link.path}
                                    className={`flex items-center gap-2 px-3 py-2 rounded-lg transition ${isActive(link.path)
                                        ? 'text-blue-600 bg-blue-50 font-bold'
                                        : 'text-gray-600 hover:text-blue-600 hover:bg-gray-50'
                                        }`}
                                >
                                    <link.icon size={18} />
                                    {link.label}
                                </Link>
                            ))}
                        </div>

                        <div className="flex items-center gap-3">
                            <button
                                onClick={toggleLanguage}
                                className="flex items-center gap-1 bg-gray-100 px-3 py-2 rounded-lg text-xs font-bold hover:bg-gray-200 transition"
                            >
                                <Globe size={16} />
                                {language === 'en' ? 'URDU' : 'ENGLISH'}
                            </button>

                            <Link to="/settings" className="text-gray-500 hover:bg-gray-100 p-2 rounded-lg transition" title="Settings">
                                <SettingsIcon size={20} />
                            </Link>

                            <button onClick={logout} className="text-red-500 hover:bg-red-50 p-2 rounded-lg transition" title={t('logout')}>
                                <LogOut size={20} />
                            </button>
                        </div>
                    </div>

                    {/* Mobile Menu Button */}
                    <div className="flex items-center gap-3 lg:hidden">
                        <button
                            onClick={toggleLanguage}
                            className="flex items-center gap-1 bg-gray-100 px-2 py-1 rounded-lg text-xs font-bold"
                        >
                            <Globe size={14} />
                            {language === 'en' ? 'UR' : 'EN'}
                        </button>

                        <button
                            onClick={() => setMobileMenuOpen(!mobileMenuOpen)}
                            className="text-gray-700 hover:bg-gray-100 p-2 rounded-lg transition"
                        >
                            {mobileMenuOpen ? <X size={24} /> : <Menu size={24} />}
                        </button>
                    </div>
                </div>
            </nav>

            {/* Mobile Menu Overlay */}
            <div
                className={`mobile-nav-overlay lg:hidden ${mobileMenuOpen ? 'active' : ''}`}
                onClick={() => setMobileMenuOpen(false)}
            />

            {/* Mobile Menu Drawer */}
            <div className={`mobile-nav-drawer lg:hidden ${mobileMenuOpen ? 'active' : ''}`}>
                <div className="p-6">
                    {/* School Info */}
                    <div className="flex items-center gap-3 mb-8 pb-6 border-b">
                        <img src={logoUrl} className="w-12 h-12 object-cover rounded-full" alt="Logo" />
                        <div>
                            <h2 className="font-bold text-gray-900">{schoolName}</h2>
                            <p className="text-sm text-gray-500">{user?.username}</p>
                        </div>
                    </div>

                    {/* Navigation Links */}
                    <nav className="space-y-2 mb-8">
                        {navLinks.map(link => (
                            <Link
                                key={link.path}
                                to={link.path}
                                className={`flex items-center gap-3 px-4 py-3 rounded-lg transition ${isActive(link.path)
                                    ? 'text-blue-600 bg-blue-50 font-bold'
                                    : 'text-gray-700 hover:bg-gray-50'
                                    }`}
                            >
                                <link.icon size={20} />
                                {link.label}
                            </Link>
                        ))}
                    </nav>

                    {/* Actions */}
                    <div className="space-y-2 pt-6 border-t">
                        <Link
                            to="/settings"
                            className="flex items-center gap-3 px-4 py-3 rounded-lg text-gray-700 hover:bg-gray-50 transition"
                        >
                            <SettingsIcon size={20} />
                            Settings
                        </Link>

                        <button
                            onClick={logout}
                            className="flex items-center gap-3 px-4 py-3 rounded-lg text-red-600 hover:bg-red-50 transition w-full"
                        >
                            <LogOut size={20} />
                            {t('logout')}
                        </button>
                    </div>
                </div>
            </div>
        </>
    );
};

export default Navbar;
