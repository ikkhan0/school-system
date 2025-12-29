import React from 'react';
import { FileX, Users, DollarSign, Calendar } from 'lucide-react';

const EmptyState = ({
    type = 'default',
    title = 'No data found',
    description = 'There is no data to display at the moment.',
    action
}) => {
    const icons = {
        default: FileX,
        students: Users,
        fees: DollarSign,
        attendance: Calendar
    };

    const Icon = icons[type] || icons.default;

    return (
        <div className="flex flex-col items-center justify-center p-12 text-center">
            <div className="w-20 h-20 rounded-full bg-gray-100 flex items-center justify-center mb-4">
                <Icon className="w-10 h-10 text-gray-400" />
            </div>
            <h3 className="text-lg font-semibold text-gray-900 mb-2">{title}</h3>
            <p className="text-gray-500 text-sm max-w-md mb-6">{description}</p>
            {action && (
                <button
                    onClick={action.onClick}
                    className="bg-blue-600 text-white px-6 py-2 rounded-lg hover:bg-blue-700 transition"
                >
                    {action.label}
                </button>
            )}
        </div>
    );
};

export default EmptyState;
