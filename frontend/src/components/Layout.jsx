import { useState } from 'react';
import { useLocation } from 'react-router-dom';
import Sidebar from './Sidebar';
import TopHeader from './TopHeader';

const Layout = ({ children }) => {
    const [sidebarOpen, setSidebarOpen] = useState(false);
    const location = useLocation();

    // Don't show layout on login pages
    const noLayoutPaths = ['/', '/super-admin/login'];
    if (noLayoutPaths.includes(location.pathname)) {
        return children;
    }

    // Check if current page is dashboard for full-width layout
    const isDashboard = location.pathname === '/dashboard';

    return (
        <div className="flex h-screen overflow-hidden bg-gray-50">
            {/* Sidebar */}
            <Sidebar isOpen={sidebarOpen} setIsOpen={setSidebarOpen} />

            {/* Main Content Area */}
            <div className="flex-1 flex flex-col overflow-hidden">
                {/* Top Header */}
                <TopHeader onMenuClick={() => setSidebarOpen(!sidebarOpen)} />

                {/* Page Content - Full width for dashboard, normal for others */}
                <main className={`flex-1 overflow-auto ${isDashboard ? '' : 'bg-gray-50'}`}>
                    <div className="h-full">
                        {children}
                    </div>
                </main>
            </div>
        </div>
    );
};

export default Layout;
