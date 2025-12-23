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

    return (
        <div className="flex h-screen overflow-hidden bg-gray-50">
            {/* Sidebar */}
            <Sidebar isOpen={sidebarOpen} setIsOpen={setSidebarOpen} />

            {/* Main Content Area */}
            <div className="flex-1 flex flex-col overflow-hidden">
                {/* Top Header */}
                <TopHeader onMenuClick={() => setSidebarOpen(!sidebarOpen)} />

                {/* Page Content - Full width with padding */}
                <main className="flex-1 overflow-auto bg-gray-50">
                    <div className="h-full">
                        {children}
                    </div>
                </main>
            </div>
        </div>
    );
};

export default Layout;
