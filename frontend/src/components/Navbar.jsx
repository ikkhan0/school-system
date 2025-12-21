import { Link } from 'react-router-dom';
import { useContext } from 'react';
import AuthContext from '../context/AuthContext';

const Navbar = () => {
    const { user, logout } = useContext(AuthContext);

    return (
        <nav className="bg-white shadow p-4 mb-4 no-print">
            <div className="max-w-6xl mx-auto flex justify-between items-center">
                <Link to="/dashboard" className="font-bold text-blue-600 text-lg">
                    {user?.school_name || 'I-Soft SMS'}
                </Link>
                <div className="space-x-4 flex items-center">
                    <Link to="/dashboard" className="text-gray-600 hover:text-blue-600">Dashboard</Link>
                    <Link to="/evaluation" className="text-gray-600 hover:text-blue-600">Daily Eval</Link>
                    <Link to="/fees" className="text-gray-600 hover:text-blue-600">Fee Collection</Link>
                    <Link to="/marks" className="text-gray-600 hover:text-blue-600">Marks Entry</Link>
                    <Link to="/results" className="text-gray-600 hover:text-blue-600">Results</Link>
                    <Link to="/classes" className="text-gray-600 hover:text-blue-600">Classes</Link>
                    <Link to="/students" className="text-gray-600 hover:text-blue-600">Students</Link>
                    <button onClick={logout} className="text-red-500 hover:text-red-700 font-bold ml-4">
                        Logout
                    </button>
                </div>
            </div>
        </nav>
    );
};

export default Navbar;
