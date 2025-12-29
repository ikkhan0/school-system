import { useState } from 'react';
import { Link } from 'react-router-dom';
import { ChevronDown, ChevronRight } from 'lucide-react';

const MobileDropdownMenu = ({ label, icon: Icon, items, isActive }) => {
    const [isOpen, setIsOpen] = useState(false);

    return (
        <div>
            <button
                onClick={() => setIsOpen(!isOpen)}
                className={`flex items-center justify-between w-full px-4 py-3 rounded-lg transition ${isActive
                        ? 'text-blue-600 bg-blue-50 font-bold'
                        : 'text-gray-700 hover:bg-gray-50'
                    }`}
            >
                <div className="flex items-center gap-3">
                    <Icon size={20} />
                    <span>{label}</span>
                </div>
                {isOpen ? <ChevronDown size={20} /> : <ChevronRight size={20} />}
            </button>

            {/* Submenu */}
            {isOpen && (
                <div className="ml-8 mt-1 space-y-1">
                    {items.map((item, index) => (
                        <Link
                            key={index}
                            to={item.path}
                            className="block px-4 py-2 text-sm text-gray-600 hover:text-blue-600 hover:bg-blue-50 rounded-lg transition"
                        >
                            {item.label}
                        </Link>
                    ))}
                </div>
            )}
        </div>
    );
};

export default MobileDropdownMenu;
