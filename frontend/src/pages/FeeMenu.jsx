import { Link } from 'react-router-dom';
import { FileText, CheckCircle, AlertCircle, Printer, MessageCircle } from 'lucide-react';
import { useLanguage } from '../context/LanguageContext';

const FeeMenu = () => {
    const { t } = useLanguage();

    const menuItems = [
        { label: t('pending_list'), color: 'bg-red-500', icon: <AlertCircle />, link: '/fees' },
        { label: t('paid_list'), color: 'bg-green-500', icon: <CheckCircle />, link: '/fees' },
        { label: t('concession_report'), color: 'bg-purple-600', icon: <FileText />, link: '/fees' },
        { label: t('smart_sheet'), color: 'bg-indigo-500', icon: <Printer />, link: '/reports' },
        { label: t('slips_4_page'), color: 'bg-orange-500', icon: <Printer />, link: '/bulk-slips' },
        { label: t('bulk_whatsapp'), color: 'bg-yellow-500', icon: <MessageCircle />, link: '/reports' } // Maybe link to reports shortage list?
    ];

    return (
        <div className="max-w-md mx-auto p-6 bg-white min-h-screen">
            <h1 className="text-center font-bold text-2xl mb-8 uppercase text-blue-800 border-b-4 border-blue-800 inline-block pb-1">
                {t('fees')} Menu
            </h1>

            <div className="space-y-4">
                {menuItems.map((item, idx) => (
                    <Link
                        key={idx}
                        to={item.link}
                        className={`${item.color} text-white font-bold text-lg py-4 px-6 rounded-xl shadow-lg transform active:scale-95 transition-all flex items-center justify-between`}
                    >
                        <span>{item.label}</span>
                        <span className="bg-white bg-opacity-20 p-2 rounded-full">
                            {item.icon}
                        </span>
                    </Link>
                ))}
            </div>

            <div className="mt-8">
                <input
                    type="text"
                    placeholder={t('search_placeholder')}
                    className="w-full p-4 border rounded-full shadow-inner bg-gray-50 text-center"
                />
            </div>
        </div>
    );
};

export default FeeMenu;
