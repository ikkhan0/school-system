import { useContext, useState, useRef, useEffect } from 'react';
import { useNavigate } from 'react-router-dom';
import AuthContext from '../context/AuthContext';
import { Search, Bell, Menu, LogOut, User, Settings as SettingsIcon } from 'lucide-react';
import SessionSwitcher from './SessionSwitcher';
import LanguageSwitcher from './LanguageSwitcher';

const TopHeader = ({ onMenuClick }) => {
    const { user, logout } = useContext(AuthContext);
    const navigate = useNavigate();
    const [showProfileMenu, setShowProfileMenu] = useState(false);
    const [showNotifications, setShowNotifications] = useState(false);
    const profileRef = useRef(null);
    const notificationsRef = useRef(null);

    // Sample notifications - replace with actual data from API
    const notifications = [
        { id: 1, title: 'New Student Admission', message: 'Ali Ahmed has been admitted to Class 5-A', time: '5 min ago', unread: true },
        { id: 2, title: 'Fee Payment Received', message: 'Rs. 5000 received from Student ID: 101', time: '1 hour ago', unread: true },
        { id: 3, title: 'Attendance Alert', message: '3 students absent for 3 consecutive days', time: '2 hours ago', unread: true },
        { id: 4, title: 'Exam Results Published', message: 'Mid-term results are now available', time: '1 day ago', unread: false },
    ];

    // Close dropdowns when clicking outside
    useEffect(() => {
        const handleClickOutside = (event) => {
            if (profileRef.current && !profileRef.current.contains(event.target)) {
                setShowProfileMenu(false);
            }
            if (notificationsRef.current && !notificationsRef.current.contains(event.target)) {
                setShowNotifications(false);
            }
        };

        document.addEventListener('mousedown', handleClickOutside);
        return () => document.removeEventListener('mousedown', handleClickOutside);
    }, []);

    return (
        <header className="h-16 bg-white border-b border-gray-200 flex items-center justify-between px-4 lg:px-6 sticky top-0 z-30">
            {/* Left Section */}
            <div className="flex items-center space-x-4">
                {/* Mobile Menu Button */}
                <button
                    onClick={onMenuClick}
                    className="lg:hidden text-gray-600 hover:text-gray-900"
                >
                    <Menu size={24} />
                </button>

                {/* Search Bar */}
                <div className="hidden md:flex items-center bg-gray-50 rounded-lg px-3 py-2 w-64 lg:w-96">
                    <Search size={18} className="text-gray-400 mr-2" />
                    <input
                        type="text"
                        placeholder="Search students, staff, classes..."
                        className="bg-transparent border-none outline-none text-sm w-full text-gray-700 placeholder-gray-400"
                    />
                </div>
            </div>

            {/* Right Section */}
            <div className="flex items-center space-x-4">
                {/* School Name - Hidden on mobile */}
                <div className="hidden lg:block text-right mr-2">
                    <p className="text-sm font-semibold text-gray-800">
                        {user?.school_name || 'School Management'}
                    </p>
                    <p className="text-xs text-gray-500">
                        {user?.role?.replace('_', ' ').toUpperCase() || 'ADMIN'}
                    </p>
                </div>

                {/* Session Switcher */}
                <SessionSwitcher />

                {/* Language Switcher */}
                <LanguageSwitcher />

                {/* Notifications */}
                <div className="relative" ref={notificationsRef}>
                    <button
                        onClick={() => setShowNotifications(!showNotifications)}
                        className="relative text-gray-600 hover:text-gray-900"
                    >
                        <Bell size={20} />
                        {notifications.filter(n => n.unread).length > 0 && (
                            <span className="absolute -top-1 -right-1 w-4 h-4 bg-red-500 rounded-full text-xs text-white flex items-center justify-center">
                                {notifications.filter(n => n.unread).length}
                            </span>
                        )}
                    </button>

                    {/* Notifications Dropdown */}
                    {showNotifications && (
                        <div className="absolute right-0 mt-2 w-80 bg-white rounded-lg shadow-lg border border-gray-200 max-h-96 overflow-y-auto z-50">
                            <div className="px-4 py-3 border-b border-gray-200 flex items-center justify-between">
                                <h3 className="font-semibold text-gray-900">Notifications</h3>
                                <span className="text-xs text-gray-500">
                                    {notifications.filter(n => n.unread).length} unread
                                </span>
                            </div>

                            <div className="divide-y divide-gray-100">
                                {notifications.length > 0 ? (
                                    notifications.map(notification => (
                                        <div
                                            key={notification.id}
                                            className={`px-4 py-3 hover:bg-gray-50 cursor-pointer transition ${notification.unread ? 'bg-blue-50' : ''
                                                }`}
                                            onClick={() => {
                                                // Handle notification click - navigate or mark as read
                                                setShowNotifications(false);
                                            }}
                                        >
                                            <div className="flex items-start justify-between">
                                                <div className="flex-1">
                                                    <p className="text-sm font-medium text-gray-900">
                                                        {notification.title}
                                                    </p>
                                                    <p className="text-xs text-gray-600 mt-1">
                                                        {notification.message}
                                                    </p>
                                                    <p className="text-xs text-gray-400 mt-1">
                                                        {notification.time}
                                                    </p>
                                                </div>
                                                {notification.unread && (
                                                    <div className="w-2 h-2 bg-blue-600 rounded-full ml-2 mt-1"></div>
                                                )}
                                            </div>
                                        </div>
                                    ))
                                ) : (
                                    <div className="px-4 py-8 text-center text-gray-500 text-sm">
                                        No notifications
                                    </div>
                                )}
                            </div>

                            <div className="px-4 py-2 border-t border-gray-200 text-center">
                                <button className="text-xs text-blue-600 hover:text-blue-800 font-medium">
                                    View All Notifications
                                </button>
                            </div>
                        </div>
                    )}
                </div>

                {/* Profile Dropdown */}
                <div className="relative" ref={profileRef}>
                    <button
                        onClick={() => setShowProfileMenu(!showProfileMenu)}
                        className="flex items-center space-x-2 hover:bg-gray-50 rounded-lg px-2 py-1.5 transition"
                    >
                        <div className="w-8 h-8 bg-gradient-to-br from-blue-600 to-indigo-600 rounded-full flex items-center justify-center">
                            <span className="text-white font-semibold text-sm">
                                {user?.full_name?.charAt(0) || user?.username?.charAt(0) || 'A'}
                            </span>
                        </div>
                        <span className="hidden md:block text-sm font-medium text-gray-700">
                            {user?.full_name || user?.username || 'Admin'}
                        </span>
                    </button>

                    {/* Dropdown Menu */}
                    {showProfileMenu && (
                        <div className="absolute right-0 mt-2 w-48 bg-white rounded-lg shadow-lg border border-gray-200 py-1">
                            <div className="px-4 py-2 border-b border-gray-100">
                                <p className="text-sm font-medium text-gray-900">
                                    {user?.full_name || user?.username}
                                </p>
                                <p className="text-xs text-gray-500">
                                    {user?.email || user?.username}
                                </p>
                            </div>
                            <button
                                onClick={() => {
                                    navigate('/settings');
                                    setShowProfileMenu(false);
                                }}
                                className="w-full flex items-center space-x-2 px-4 py-2 text-sm text-gray-700 hover:bg-gray-50"
                            >
                                <SettingsIcon size={16} />
                                <span>Settings</span>
                            </button>
                            <button
                                onClick={() => {
                                    logout();
                                    setShowProfileMenu(false);
                                }}
                                className="w-full flex items-center space-x-2 px-4 py-2 text-sm text-red-600 hover:bg-red-50"
                            >
                                <LogOut size={16} />
                                <span>Logout</span>
                            </button>
                        </div>
                    )}
                </div>
            </div>
        </header>
    );
};

export default TopHeader;
