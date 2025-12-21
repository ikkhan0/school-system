import React from 'react';
import { TrendingUp, TrendingDown, Minus } from 'lucide-react';

const StatCard = ({
    title,
    value,
    icon: Icon,
    trend,
    trendValue,
    color = 'blue',
    loading = false
}) => {
    const colorClasses = {
        blue: 'border-blue-500 bg-blue-50',
        green: 'border-green-500 bg-green-50',
        yellow: 'border-yellow-500 bg-yellow-50',
        red: 'border-red-500 bg-red-50',
        purple: 'border-purple-500 bg-purple-50'
    };

    const iconColorClasses = {
        blue: 'text-blue-600',
        green: 'text-green-600',
        yellow: 'text-yellow-600',
        red: 'text-red-600',
        purple: 'text-purple-600'
    };

    if (loading) {
        return (
            <div className="stat-card">
                <div className="flex items-center justify-between">
                    <div className="flex-1">
                        <div className="skeleton h-4 w-24 mb-2"></div>
                        <div className="skeleton h-8 w-16"></div>
                    </div>
                    <div className="skeleton w-12 h-12 rounded-full"></div>
                </div>
            </div>
        );
    }

    return (
        <div className={`stat-card ${color}`}>
            <div className="flex items-center justify-between">
                <div className="flex-1">
                    <p className="text-sm text-gray-600 font-medium mb-1">{title}</p>
                    <p className="text-3xl font-bold text-gray-900">{value}</p>
                    {trend && (
                        <div className="flex items-center mt-2 text-sm">
                            {trend === 'up' && <TrendingUp className="w-4 h-4 text-green-600 mr-1" />}
                            {trend === 'down' && <TrendingDown className="w-4 h-4 text-red-600 mr-1" />}
                            {trend === 'neutral' && <Minus className="w-4 h-4 text-gray-600 mr-1" />}
                            <span className={trend === 'up' ? 'text-green-600' : trend === 'down' ? 'text-red-600' : 'text-gray-600'}>
                                {trendValue}
                            </span>
                        </div>
                    )}
                </div>
                {Icon && (
                    <div className={`p-3 rounded-full ${colorClasses[color]}`}>
                        <Icon className={`w-8 h-8 ${iconColorClasses[color]}`} />
                    </div>
                )}
            </div>
        </div>
    );
};

export default StatCard;
