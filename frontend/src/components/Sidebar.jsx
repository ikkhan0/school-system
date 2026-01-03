import { Link, useLocation, useNavigate } from 'react-router-dom';
import { useContext, useState } from 'react';
import { useTranslation } from 'react-i18next';
import AuthContext from '../context/AuthContext';
import {
    Home, Users, UserCheck, DollarSign, BookOpen, FileText,
    BarChart, Shield, Settings, ChevronDown, ChevronRight,
    Calendar, GraduationCap, Menu, X, MessageCircle, User
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

    // Permission checking function
    const hasPermission = (requiredPermission) => {
        // super_admin and school_admin have access to everything
        if (user?.role === 'super_admin' || user?.role === 'school_admin') {
            return true;
        }

        // Check if user has the specific permission
        return user?.permissions?.includes(requiredPermission);
    };

    // Check if user has ANY of the permissions (for groups)
    const hasAnyPermission = (permissions) => {
        // If no permissions specified, HIDE the menu item (secure by default)
        if (!permissions || permissions.length === 0) {
            // Exception: school_admin and super_admin see everything
            return user?.role === 'super_admin' || user?.role === 'school_admin';
        }

        // Admins bypass all checks
        if (user?.role === 'super_admin' || user?.role === 'school_admin') return true;

        // Check if user has ANY of the required permissions
        return permissions.some(perm => user?.permissions?.includes(perm));
    };

    const menuItems = [
        {
            titleKey: 'navigation.dashboard',
            icon: Home,
            path: '/dashboard',
            type: 'link',
            permission: 'reports.view' // Dashboard requires reports.view
        },
        {
            titleKey: 'navigation.students',
            icon: Users,
            type: 'group',
            paths: ['/students', '/sibling-management'],
            permissions: ['students.view'], // Group requires students.view
            items: [
                { titleKey: 'navigation.studentList', path: '/students', permission: 'students.view' },
                { titleKey: 'navigation.addStudent', path: '/students/add', permission: 'students.create' },
                { titleKey: 'navigation.siblingManagement', path: '/sibling-management', permission: 'students.view' }
            ]
        },
        {
            titleKey: 'navigation.staff',
            icon: UserCheck,
            type: 'group',
            paths: ['/staff'],
            permissions: ['staff.view'], // Group requires staff.view
            items: [
                { titleKey: 'navigation.staffList', path: '/staff', permission: 'staff.view' },
                { titleKey: 'navigation.addStaff', path: '/staff/add', permission: 'staff.create' },
                { titleKey: 'navigation.staffAttendance', path: '/staff/attendance', permission: 'staff.view' }
            ]
        },
        {
            titleKey: 'navigation.fees',
            icon: DollarSign,
            type: 'group',
            paths: ['/fee', '/discount', '/family-messaging'],
            permissions: ['fees.view'], // Group requires fees.view
            items: [
                { titleKey: 'navigation.feeCollection', path: '/fee-collection', permission: 'fees.collect' },
                { titleKey: 'navigation.bulkFeeSlips', path: '/bulk-slips', permission: 'fees.view' },
                { titleKey: 'navigation.manageFunds', path: '/funds', permission: 'fees.view' },
                { titleKey: 'navigation.discountPolicies', path: '/discount-policies', permission: 'fees.discount' },
                { titleKey: 'navigation.familyMessaging', path: '/family-messaging', permission: 'fees.view' }
            ]
        },
        {
            titleKey: 'navigation.academic',
            icon: BookOpen,
            type: 'group',
            paths: ['/classes', '/subjects', '/evaluation', '/sessions', '/student-promotion'],
            permissions: ['classes.view', 'attendance.view'], // Require either permission
            items: [
                { titleKey: 'navigation.classes', path: '/classes', permission: 'classes.view' },
                { titleKey: 'navigation.subjects', path: '/subjects', permission: 'classes.view' },
                { titleKey: 'navigation.attendance', path: '/evaluation', permission: 'attendance.mark' },
                { titleKey: 'navigation.sessions', path: '/sessions', permission: 'settings.edit' },
                { titleKey: 'navigation.studentPromotion', path: '/student-promotion', permission: 'settings.edit' }
            ]
        },
        {
            titleKey: 'navigation.exams',
            icon: FileText,
            type: 'group',
            paths: ['/exam', '/marks', '/results', '/class-result-sheet'],
            permissions: ['exams.view'], // Group requires exams.view
            items: [
                { titleKey: 'navigation.examMenu', path: '/exam-menu', permission: 'exams.view' },
                { titleKey: 'navigation.examManager', path: '/exams', permission: 'exams.view' },
                { titleKey: 'navigation.marksEntry', path: '/marks', permission: 'exams.results' },
                { titleKey: 'navigation.resultGeneration', path: '/results', permission: 'exams.view' },
                { titleKey: 'navigation.classResultSheet', path: '/class-result-sheet', permission: 'exams.view' }
            ]
        },
        {
            titleKey: 'navigation.reports',
            icon: BarChart,
            type: 'group',
            paths: ['/reports', '/advanced-reports'],
            permissions: ['reports.view'], // Group requires reports.view
            items: [
                { titleKey: 'navigation.basicReports', path: '/reports', permission: 'reports.view' },
                { titleKey: 'navigation.advancedReports', path: '/advanced-reports', permission: 'reports.view' }
            ]
        },
        {
            titleKey: 'navigation.expenses',
            icon: DollarSign,
            type: 'group',
            paths: ['/expense'],
            permissions: ['settings.edit'], // Expenses requires settings.edit
            items: [
                { titleKey: 'navigation.expenseHeads', path: '/expense-heads', permission: 'settings.edit' },
                { titleKey: 'navigation.expenseManager', path: '/expenses', permission: 'settings.edit' }
            ]
        },
        {
            titleKey: 'navigation.users',
            icon: Shield,
            path: '/users',
            type: 'link',
            permission: 'users.view' // Users page requires users.view
        },
        {
            titleKey: 'navigation.communication',
            icon: MessageCircle,
            type: 'group',
            paths: ['/whatsapp-templates'],
            permissions: ['settings.edit'], // Communication requires settings.edit
            items: [
                { titleKey: 'navigation.whatsappTemplates', path: '/whatsapp-templates', permission: 'settings.edit' }
            ]
        },
        {
            titleKey: 'navigation.profile',
            icon: User,
            path: '/profile',
            type: 'link'
        },
        {
            titleKey: 'navigation.settings',
            icon: Settings,
            path: '/settings',
            type: 'link',
            permission: 'settings.view' // Settings requires settings.view
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
                                    <span className="font-medium text-sm">{t(`common:${item.titleKey}`)}</span>
                                </Link>
                            ) : (
                                <div>
                                    <button
                                        onClick={() => toggleMenu(item.titleKey)}
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
                                            <span className="font-medium text-sm">{t(`common:${item.titleKey}`)}</span>
                                        </div>
                                        {expandedMenus[item.titleKey] ? (
                                            <ChevronDown size={16} />
                                        ) : (
                                            <ChevronRight size={16} />
                                        )}
                                    </button>
                                    {expandedMenus[item.titleKey] && (
                                        <div className="ml-4 mt-1 space-y-1">
                                            {item.items
                                                .filter(subItem => {
                                                    // Filter sub-items based on permissions
                                                    return subItem.permission ? hasPermission(subItem.permission) : true;
                                                })
                                                .map((subItem, subIndex) => (
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
                                                        {t(`common:${subItem.titleKey}`)}
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
