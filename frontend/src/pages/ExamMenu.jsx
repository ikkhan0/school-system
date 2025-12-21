import { Link } from 'react-router-dom';
import { BookOpen, Edit, FileText, Award } from 'lucide-react';

const ExamMenu = () => {
    const menuItems = [
        {
            title: 'Exam Management',
            description: 'Create and manage exams',
            icon: BookOpen,
            path: '/exams',
            color: 'blue'
        },
        {
            title: 'Marks Entry',
            description: 'Enter student marks for exams',
            icon: Edit,
            path: '/marks',
            color: 'green'
        },
        {
            title: 'Result Generation',
            description: 'Generate and print result cards',
            icon: FileText,
            path: '/results',
            color: 'purple'
        }
    ];

    const getColorClasses = (color) => {
        const colors = {
            blue: 'bg-blue-50 hover:bg-blue-100 border-blue-200 text-blue-700',
            green: 'bg-green-50 hover:bg-green-100 border-green-200 text-green-700',
            purple: 'bg-purple-50 hover:bg-purple-100 border-purple-200 text-purple-700',
            orange: 'bg-orange-50 hover:bg-orange-100 border-orange-200 text-orange-700'
        };
        return colors[color] || colors.blue;
    };

    return (
        <div className="max-w-6xl mx-auto p-6">
            <div className="mb-8">
                <h1 className="text-3xl font-bold text-gray-800 mb-2 flex items-center gap-3">
                    <Award size={32} className="text-purple-600" />
                    Exam Management
                </h1>
                <p className="text-gray-600">Manage exams, enter marks, and generate result cards</p>
            </div>

            <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
                {menuItems.map((item) => (
                    <Link
                        key={item.path}
                        to={item.path}
                        className={`block p-6 rounded-lg border-2 transition-all duration-200 transform hover:scale-105 hover:shadow-lg ${getColorClasses(item.color)}`}
                    >
                        <div className="flex items-start gap-4">
                            <div className="p-3 bg-white rounded-lg shadow-sm">
                                <item.icon size={28} />
                            </div>
                            <div className="flex-1">
                                <h3 className="text-xl font-bold mb-2">{item.title}</h3>
                                <p className="text-sm opacity-80">{item.description}</p>
                            </div>
                        </div>
                    </Link>
                ))}
            </div>

            {/* Quick Guide */}
            <div className="mt-12 bg-white p-6 rounded-lg shadow-md border border-gray-200">
                <h2 className="text-xl font-bold mb-4 text-gray-800">Quick Guide</h2>
                <div className="space-y-4 text-sm text-gray-700">
                    <div className="flex gap-3">
                        <span className="font-bold text-blue-600 min-w-[30px]">1.</span>
                        <div>
                            <span className="font-semibold">Create Exam:</span> Go to Exam Management and create a new exam (e.g., "Mid Term 2025")
                        </div>
                    </div>
                    <div className="flex gap-3">
                        <span className="font-bold text-green-600 min-w-[30px]">2.</span>
                        <div>
                            <span className="font-semibold">Enter Marks:</span> Go to Marks Entry, select exam/class/section/subject, enter marks for all students, and save. Repeat for each subject.
                        </div>
                    </div>
                    <div className="flex gap-3">
                        <span className="font-bold text-purple-600 min-w-[30px]">3.</span>
                        <div>
                            <span className="font-semibold">Print Results:</span> Go to Result Generation, select exam/class/section, click "Load Results", then click "Print Cards" button to print all result cards.
                        </div>
                    </div>
                </div>
            </div>

            {/* Print Instructions */}
            <div className="mt-6 bg-purple-50 p-6 rounded-lg border-2 border-purple-200">
                <h3 className="text-lg font-bold mb-3 text-purple-800 flex items-center gap-2">
                    <FileText size={20} />
                    How to Print Result Cards
                </h3>
                <ol className="space-y-2 text-sm text-gray-700 list-decimal list-inside">
                    <li>Go to <span className="font-semibold">Result Generation</span> page</li>
                    <li>Select <span className="font-semibold">Exam</span>, <span className="font-semibold">Class</span>, and <span className="font-semibold">Section</span></li>
                    <li>Click <span className="font-semibold bg-blue-100 px-2 py-1 rounded">Load Results</span> button</li>
                    <li>Toggle options: Attendance Report, Fee Status, Evaluation Report (optional)</li>
                    <li>Click <span className="font-semibold bg-gray-800 text-white px-2 py-1 rounded">Print Cards</span> button</li>
                    <li>In print dialog:
                        <ul className="ml-6 mt-1 space-y-1 list-disc">
                            <li>Select your printer</li>
                            <li>Paper size: <span className="font-semibold">A4</span></li>
                            <li>Orientation: <span className="font-semibold">Portrait</span></li>
                            <li>Margins: Default or Minimum</li>
                        </ul>
                    </li>
                    <li>Click <span className="font-semibold">Print</span></li>
                </ol>
                <div className="mt-4 p-3 bg-white rounded border border-purple-300">
                    <p className="text-xs text-gray-600">
                        <span className="font-bold">💡 Tip:</span> Each result card is A4 size (210mm × 297mm) and will print on a separate page. You can also use the WhatsApp button on each card to send results digitally.
                    </p>
                </div>
            </div>
        </div>
    );
};

export default ExamMenu;
