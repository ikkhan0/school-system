import { useContext, useState, useRef, useEffect } from 'react';
import { useNavigate } from 'react-router-dom';
import AuthContext from '../context/AuthContext';
import { Search, Bell, Menu, LogOut, User, Settings as SettingsIcon } from 'lucide-react';

const TopHeader = ({ onMenuClick }) => {
    const { user, logout } = useContext(AuthContext);
    const navigate = useNavigate();
    const [showProfileMenu, setShowProfileMenu] = useState(false);
    const profileRef = useRef(null);

    // Close dropdown when clicking outside
    useEffect(() => {
        const handleClickOutside = (event) => {
            if (profileRef.current && !profileRef.current.contains(event.target)) {
                setShowProfileMenu(false);
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

                {/* Notifications */}
                <button className="relative text-gray-600 hover:text-gray-900">
                    <Bell size={20} />
                    <span className="absolute -top-1 -right-1 w-4 h-4 bg-red-500 rounded-full text-xs text-white flex items-center justify-center">
                        3
                    </span>
                </button>

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
