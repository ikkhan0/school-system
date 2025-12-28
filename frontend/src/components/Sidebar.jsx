import { Link, useLocation, useNavigate } from 'react-router-dom';
import { useContext, useState } from 'react';
import { useTranslation } from 'react-i18next';
import AuthContext from '../context/AuthContext';
import {
    Home, Users, UserCheck, DollarSign, BookOpen, FileText,
    BarChart, Shield, Settings, ChevronDown, ChevronRight,
    Calendar, GraduationCap, Menu, X, MessageCircle
} from 'lucide-react';

const Sidebar = ({ isOpen, setIsOpen }) => {
    const { user } = useContext(AuthContext);
    const { t } = useTranslation(['common', 'students', 'fees', 'exams', 'reports']);
    const location = useLocation();
    const [expandedMenus, setExpandedMenus] = useState({});

    const isActive = (path) => location.pathname === path;
    const isGroupActive = (paths) => paths.some(path => location.pathname.startsWith(path));

    const toggleMenu = (menuName) => {
        setExpandedMenus(prev => ({
            ...prev,
            [menuName]: !prev[menuName]
        }));
    };

    const menuItems = [
        {
            title: 'Dashboard',
            icon: Home,
            path: '/dashboard',
            type: 'link'
        },
        {
            title: 'Students',
            icon: Users,
            type: 'group',
            paths: ['/students', '/sibling-management'],
            items: [
                { title: 'Student List', path: '/students' },
                { title: 'Add Student', path: '/students/add' },
                { title: 'Sibling Management', path: '/sibling-management' }
            ]
        },
        {
            title: 'Staff',
            icon: UserCheck,
            type: 'group',
            paths: ['/staff'],
            items: [
                { title: 'Staff List', path: '/staff' },
                { title: 'Add Staff', path: '/staff/add' },
                { title: 'Staff Attendance', path: '/staff/attendance' }
            ]
        },
        {
            title: 'Fees',
            icon: DollarSign,
            type: 'group',
            paths: ['/fee', '/discount', '/family-messaging'],
            items: [
                { title: 'Fee Collection', path: '/fee-collection' },
                { title: 'Bulk Fee Slips', path: '/bulk-slips' },
                { title: 'Manage Funds', path: '/funds' },
                { title: 'Discount Policies', path: '/discount-policies' },
                { title: 'Family Messaging', path: '/family-messaging' }
            ]
        },
        {
            title: 'Academic',
            icon: BookOpen,
            type: 'group',
            paths: ['/classes', '/subjects', '/evaluation', '/sessions', '/student-promotion'],
            items: [
                { title: 'Classes', path: '/classes' },
                { title: 'Subjects', path: '/subjects' },
                { title: 'Attendance', path: '/evaluation' },
                { title: 'Sessions', path: '/sessions' },
                { title: 'Student Promotion', path: '/student-promotion' }
            ]
        },
        {
            title: 'Exams',
            icon: FileText,
            type: 'group',
            paths: ['/exam', '/marks', '/results', '/class-result-sheet'],
            items: [
                { title: 'Exam Menu', path: '/exam-menu' },
                { title: 'Exam Manager', path: '/exams' },
                { title: 'Marks Entry', path: '/marks' },
                { title: 'Result Generation', path: '/results' },
                { title: 'Class Result Sheet', path: '/class-result-sheet' }
            ]
        },
        {
            title: 'Reports',
            icon: BarChart,
            type: 'group',
            paths: ['/reports', '/advanced-reports'],
            items: [
                { title: 'Basic Reports', path: '/reports' },
                { title: 'Advanced Reports', path: '/advanced-reports' }
            ]
        },
        {
            title: 'Expenses',
            icon: DollarSign,
            type: 'group',
            paths: ['/expense'],
            items: [
                { title: 'Expense Heads', path: '/expense-heads' },
                { title: 'Expense Manager', path: '/expenses' }
            ]
        },
        {
            title: 'Users',
            icon: Shield,
            path: '/users',
            type: 'link'
        },
        {
            title: 'Communication',
            icon: MessageCircle,
            type: 'group',
            paths: ['/whatsapp-templates'],
            items: [
                { title: 'WhatsApp Templates', path: '/whatsapp-templates' }
            ]
        },
        {
            title: 'Settings',
            icon: Settings,
            path: '/settings',
            type: 'link'
        }
    ];

    return (
        <>
            {/* Mobile Overlay */}
            {isOpen && (
                <div
                    className="fixed inset-0 bg-black bg-opacity-50 z-40 lg:hidden"
                    onClick={() => setIsOpen(false)}
                />
            )}

            {/* Sidebar */}
            <aside className={`
                fixed lg:static inset-y-0 left-0 z-50
                w-64 bg-white border-r border-gray-200
                transform transition-transform duration-300 ease-in-out
                ${isOpen ? 'translate-x-0' : '-translate-x-full lg:translate-x-0'}
                flex flex-col
            `}>
                {/* Logo Section */}
                <div className="h-16 flex items-center justify-between px-4 border-b border-gray-200">
                    <Link to="/dashboard" className="flex items-center space-x-2">
                        <div className="w-8 h-8 bg-gradient-to-br from-blue-600 to-indigo-600 rounded-lg flex items-center justify-center">
                            <GraduationCap className="w-5 h-5 text-white" />
                        </div>
                        <span className="font-bold text-lg text-gray-800">I-Soft SMS</span>
                    </Link>
                    <button
                        onClick={() => setIsOpen(false)}
                        className="lg:hidden text-gray-500 hover:text-gray-700"
                    >
                        <X size={20} />
                    </button>
                </div>

                {/* Navigation Menu */}
                <nav className="flex-1 overflow-y-auto py-4 px-2">
                    {menuItems.map((item, index) => (
                        <div key={index} className="mb-1">
                            {item.type === 'link' ? (
                                <Link
                                    to={item.path}
                                    className={`
                                        flex items-center space-x-3 px-3 py-2.5 rounded-lg
                                        transition-colors duration-150
                                        ${isActive(item.path)
                                            ? 'bg-blue-50 text-blue-600 border-l-4 border-blue-600'
                                            : 'text-gray-700 hover:bg-gray-50'
                                        }
                                    `}
                                >
                                    <item.icon size={20} />
                                    <span className="font-medium text-sm">{item.title}</span>
                                </Link>
                            ) : (
                                <div>
                                    <button
                                        onClick={() => toggleMenu(item.title)}
                                        className={`
                                            w-full flex items-center justify-between px-3 py-2.5 rounded-lg
                                            transition-colors duration-150
                                            ${isGroupActive(item.paths)
                                                ? 'bg-gray-50 text-blue-600'
                                                : 'text-gray-700 hover:bg-gray-50'
                                            }
                                        `}
                                    >
                                        <div className="flex items-center space-x-3">
                                            <item.icon size={20} />
                                            <span className="font-medium text-sm">{item.title}</span>
                                        </div>
                                        {expandedMenus[item.title] ? (
                                            <ChevronDown size={16} />
                                        ) : (
                                            <ChevronRight size={16} />
                                        )}
                                    </button>
                                    {expandedMenus[item.title] && (
                                        <div className="ml-4 mt-1 space-y-1">
                                            {item.items.map((subItem, subIndex) => (
                                                <Link
                                                    key={subIndex}
                                                    to={subItem.path}
                                                    className={`
                                                        block px-3 py-2 rounded-lg text-sm
                                                        transition-colors duration-150
                                                        ${isActive(subItem.path)
                                                            ? 'bg-blue-50 text-blue-600 font-medium'
                                                            : 'text-gray-600 hover:bg-gray-50'
                                                        }
                                                    `}
                                                >
                                                    {subItem.title}
                                                </Link>
                                            ))}
                                        </div>
                                    )}
                                </div>
                            )}
                        </div>
                    ))}
                </nav>

                {/* User Info Section */}
                <div className="border-t border-gray-200 p-4">
                    <div className="flex items-center space-x-3">
                        <div className="w-10 h-10 bg-gradient-to-br from-blue-600 to-indigo-600 rounded-full flex items-center justify-center">
                            <span className="text-white font-semibold text-sm">
                                {user?.full_name?.charAt(0) || user?.username?.charAt(0) || 'A'}
                            </span>
                        </div>
                        <div className="flex-1 min-w-0">
                            <p className="text-sm font-medium text-gray-900 truncate">
                                {user?.full_name || user?.username || 'Admin'}
                            </p>
                            <p className="text-xs text-gray-500 truncate">
                                {user?.school_name || 'School'}
                            </p>
                        </div>
                    </div>
                </div>
            </aside>
        </>
    );
};

export default Sidebar;
