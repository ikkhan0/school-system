import { useState, useEffect, useContext } from 'react';
import { Printer, MessageCircle, User } from 'lucide-react';
import AuthContext from '../context/AuthContext';
import API_URL from '../config';

const ResultGeneration = () => {
    const { user } = useContext(AuthContext);
    const [results, setResults] = useState([]);
    const [schoolInfo, setSchoolInfo] = useState(null);

    // Dynamic Selections
    const [exams, setExams] = useState([]);
    const [classes, setClasses] = useState([]);
    const [selectedExam, setSelectedExam] = useState('');
    const [selectedClass, setSelectedClass] = useState('');
    const [selectedSection, setSelectedSection] = useState('');

    // Toggles
    const [showAttendance, setShowAttendance] = useState(true);
    const [showFees, setShowFees] = useState(true);
    const [showBehavior, setShowBehavior] = useState(true);

    useEffect(() => {
        if (!user) return;

        // Fetch School Info
        fetch(`${API_URL}/api/school`, {
            headers: { Authorization: `Bearer ${user.token}` }
        })
            .then(res => res.json())
            .then(data => setSchoolInfo(data))
            .catch(err => console.error("Error fetching school info:", err));

        // Fetch Exams
        fetch(`${API_URL}/api/exams`, {
            headers: { Authorization: `Bearer ${user.token}` }
        })
            .then(res => res.json())
            .then(data => {
                setExams(data);
                if (data.length > 0) setSelectedExam(data[0]._id);
            });

        // Fetch Classes
        fetch(`${API_URL}/api/classes`, {
            headers: { Authorization: `Bearer ${user.token}` }
        })
            .then(res => res.json())
            .then(data => {
                setClasses(data);
                if (data.length > 0) {
                    setSelectedClass(data[0].name);
                    setSelectedSection(data[0].sections[0] || 'A');
                }
            });
    }, [user]);

    const fetchResults = async () => {
        if (!selectedExam || !selectedClass || !selectedSection) return alert("Please select Exam, Class, and Section");

        const res = await fetch(`${API_URL}/api/exams/results?exam_id=${selectedExam}&class_id=${selectedClass}&section_id=${selectedSection}`, {
            headers: { Authorization: `Bearer ${user.token}` }
        });
        const data = await res.json();
        setResults(data);
    };

    const sendWhatsApp = (mobile, message) => {
        if (!mobile) return alert("Father Mobile Number not found!");
        let num = mobile.replace(/\D/g, '');
        if (num.length === 11 && num.startsWith('0')) {
            num = '92' + num.substring(1);
        }
        window.open(`https://wa.me/${num}?text=${encodeURIComponent(message)}`, '_blank');
    };

    const sendResult = (result) => {
        const msg = `Dear Parent,\n\nExam Result: ${result.exam_id.title}\nStudent: ${result.student_id.full_name}\nObtained: ${result.total_obtained} / ${result.total_max}\nPercentage: ${result.percentage}%\nGrade: ${result.grade}\nStatus: ${result.percentage >= 33 ? 'PASS' : 'FAIL'}\n\n- Bismillah Educational Complex`;
        const mobile = result.student_id.father_mobile;
        sendWhatsApp(mobile, msg);
    };

    return (
        <div className="max-w-6xl mx-auto p-4">
            <div className="no-print mb-6 bg-white p-4 shadow rounded space-y-4">
                <div className="flex justify-between items-center">
                    <h1 className="text-xl font-bold">Result Card Generation</h1>
                    <div className="flex gap-4">
                        <select className="border p-2 rounded" value={selectedExam} onChange={e => setSelectedExam(e.target.value)}>
                            {exams.map(ex => <option key={ex._id} value={ex._id}>{ex.title}</option>)}
                        </select>
                        <select className="border p-2 rounded" value={selectedClass} onChange={e => {
                            setSelectedClass(e.target.value);
                            const cls = classes.find(c => c.name === e.target.value);
                            if (cls && cls.sections.length > 0) setSelectedSection(cls.sections[0]);
                        }}>
                            {classes.map(c => <option key={c._id} value={c.name}>{c.name}</option>)}
                        </select>
                        <select className="border p-2 rounded" value={selectedSection} onChange={e => setSelectedSection(e.target.value)}>
                            {classes.find(c => c.name === selectedClass)?.sections.map(sec => (
                                <option key={sec} value={sec}>{sec}</option>
                            )) || <option value="A">A</option>}
                        </select>
                        <button onClick={fetchResults} className="bg-blue-600 text-white px-4 py-2 rounded">Load Results</button>
                    </div>
                </div>

                {/* Toggles */}
                <div className="flex gap-6 items-center border-t pt-4">
                    <label className="flex items-center gap-2 font-semibold text-sm cursor-pointer">
                        <input type="checkbox" checked={showAttendance} onChange={e => setShowAttendance(e.target.checked)} className="w-4 h-4" />
                        Attendance Report
                    </label>
                    <label className="flex items-center gap-2 font-semibold text-sm cursor-pointer">
                        <input type="checkbox" checked={showFees} onChange={e => setShowFees(e.target.checked)} className="w-4 h-4" />
                        Fee Status
                    </label>
                    <label className="flex items-center gap-2 font-semibold text-sm cursor-pointer">
                        <input type="checkbox" checked={showBehavior} onChange={e => setShowBehavior(e.target.checked)} className="w-4 h-4" />
                        Evaluation Report
                    </label>

                    <button onClick={() => window.print()} className="ml-auto bg-gray-800 text-white px-4 py-2 rounded flex gap-2 items-center">
                        <Printer size={18} /> Print Cards
                    </button>
                </div>
            </div>

            <div className="print-area space-y-8">
                {results.map((result) => (
                    <div key={result._id} className="result-card bg-white border-2 border-black p-6 min-h-[90vh] break-after-page relative mx-auto max-w-[210mm]">

                        {/* WhatsApp Button (No Print) */}
                        <div className="absolute top-4 right-4 no-print">
                            <button onClick={() => sendResult(result)} className="text-green-600 hover:bg-green-50 p-2 rounded border border-green-200" title="Send Result via WhatsApp">
                                <MessageCircle size={24} />
                            </button>
                        </div>

                        {/* Header */}
                        <div className="flex items-start justify-between mb-6">
                            {/* Left: Logo/Info */}
                            <div className="flex-1 text-center">
                                <h1 className="text-3xl font-bold uppercase tracking-wider">{schoolInfo?.name || 'School Name'}</h1>
                                <p className="text-sm">{schoolInfo?.address || 'School Address'} {schoolInfo?.phone ? `[${schoolInfo.phone}]` : ''}</p>
                                <div className="mt-2 inline-block border-2 border-black px-4 py-1 font-bold text-sm uppercase bg-black text-white">
                                    Result Card
                                </div>
                            </div>

                            {/* Right: Photo */}
                            <div className="w-24 h-24 border-2 border-black ml-4 bg-gray-100 flex items-center justify-center overflow-hidden">
                                {result.student_id.image ? (
                                    <img src={`${API_URL}${result.student_id.image}`} alt="Student" className="w-full h-full object-cover" />
                                ) : (
                                    <User className="text-gray-400" size={48} />
                                )}
                            </div>
                        </div>

                        {/* Student Info */}
                        <div className="grid grid-cols-2 gap-x-8 gap-y-2 text-sm border-t-2 border-b-2 border-black py-2 mb-4 font-bold uppercase">
                            <div className="flex justify-between border-b border-gray-300"><span>Name:</span> <span>{result.student_id.full_name}</span></div>
                            <div className="flex justify-between border-b border-gray-300"><span>Roll No:</span> <span>{result.student_id.roll_no}</span></div>
                            <div className="flex justify-between border-b border-gray-300"><span>Father:</span> <span>{result.student_id.father_name}</span></div>
                            <div className="flex justify-between border-b border-gray-300"><span>Class:</span> <span>{result.class_id} ({result.section_id})</span></div>
                        </div>

                        <div className="text-center font-bold bg-gray-200 border border-black mb-2 py-1 text-sm">Exam: {result.exam_id.title}</div>

                        {/* Marks Table */}
                        <table className="w-full border-collapse border border-black mb-6 text-sm">
                            <thead>
                                <tr className="bg-gray-100">
                                    <th className="border border-black p-2 text-left w-1/3">SUBJECT</th>
                                    <th className="border border-black p-2 text-center">TOTAL</th>
                                    <th className="border border-black p-2 text-center">PASS</th>
                                    <th className="border border-black p-2 text-center">OBT</th>
                                    <th className="border border-black p-2 text-center">STATUS</th>
                                </tr>
                            </thead>
                            <tbody>
                                {result.subjects.map((sub, idx) => (
                                    <tr key={idx}>
                                        <td className="border border-black p-2">{sub.subject_name}</td>
                                        <td className="border border-black p-2 text-center">{sub.total_marks}</td>
                                        <td className="border border-black p-2 text-center text-gray-500">33</td>
                                        <td className="border border-black p-2 text-center font-bold">{sub.obtained_marks}</td>
                                        <td className="border border-black p-2 text-center font-bold">
                                            {sub.obtained_marks >= 33 ? 'PASS' : 'FAIL'}
                                        </td>
                                    </tr>
                                ))}
                                <tr className="font-bold bg-green-50 text-base">
                                    <td className="border border-black p-2 text-right">Total: {result.total_obtained}/{result.total_max}</td>
                                    <td colSpan={2} className="border border-black p-2 text-center">Perc: {result.percentage}%</td>
                                    <td className="border border-black p-2 text-center">Grade: {result.grade}</td>
                                    <td className="border border-black p-2 text-center bg-green-100 text-green-800">Result: PASS</td>
                                </tr>
                            </tbody>
                        </table>

                        {/* USP Bottom Section (3 Boxes) - Conditional Rendering */}
                        {(showAttendance || showFees || showBehavior) && (
                            <div className="grid grid-cols-3 gap-2 h-40">
                                {/* Box 1: Attendance */}
                                {showAttendance && (
                                    <div className="border-2 border-black rounded-lg overflow-hidden flex flex-col">
                                        <div className="bg-gray-200 border-b border-black font-bold text-center py-1 text-xs uppercase">Attendance</div>
                                        <div className="p-2 text-xs space-y-2 flex-1">
                                            <div className="flex justify-between border-b border-gray-300 pb-1"><span>Presents:</span> <span>{result.stats?.attendance?.present || 0}</span></div>
                                            <div className="flex justify-between border-b border-gray-300 pb-1"><span>Absents:</span> <span>{result.stats?.attendance?.absent || 0}</span></div>
                                            <div className="flex justify-between border-b border-gray-300 pb-1"><span>Leaves:</span> <span>{result.stats?.attendance?.leave || 0}</span></div>
                                            <div className="flex justify-between font-bold pt-1"><span>Percentage:</span> <span>
                                                {result.stats?.attendance ? Math.round((result.stats.attendance.present / ((result.stats.attendance.present + result.stats.attendance.absent + result.stats.attendance.leave) || 1)) * 100) : 0}%
                                            </span></div>
                                        </div>
                                    </div>
                                )}

                                {/* Box 2: Fee Status */}
                                {showFees && (
                                    <div className="border-2 border-black rounded-lg overflow-hidden flex flex-col">
                                        <div className="bg-gray-200 border-b border-black font-bold text-center py-1 text-xs uppercase">Fee Status</div>
                                        <div className="p-2 text-xs space-y-2 flex-1">
                                            <div className="flex justify-between border-b border-gray-300 pb-1"><span>Monthly Fee:</span> <span>{result.student_id?.monthly_fee || 5000}</span></div>
                                            <div className="flex justify-between border-b border-gray-300 pb-1"><span>Arrears:</span> <span>{(result.stats?.fees?.balance || 0) - (result.student_id?.monthly_fee || 5000)}</span></div>
                                            <div className="flex justify-between font-bold pt-1 text-red-600"><span>Balance:</span> <span>{result.stats?.fees?.balance || 0}</span></div>
                                        </div>
                                    </div>
                                )}

                                {/* Box 3: Behavior */}
                                {showBehavior && (
                                    <div className="border-2 border-black rounded-lg overflow-hidden flex flex-col">
                                        <div className="bg-gray-200 border-b border-black font-bold text-center py-1 text-xs uppercase">Evaluation Report</div>
                                        <div className="p-2 text-xs flex-1">
                                            <table className="w-full">
                                                <tbody>
                                                    {Object.entries(result.stats?.behavior || {}).map(([key, count]) => (
                                                        count > 0 && (
                                                            <tr key={key} className="border-b border-gray-100 last:border-0">
                                                                <td className="py-1 capitalize">{key.replace('_', ' ')}</td>
                                                                <td className="text-right font-bold text-red-600">{count}</td>
                                                            </tr>
                                                        )
                                                    ))}
                                                    {Object.values(result.stats?.behavior || {}).every(v => v === 0) && (
                                                        <tr><td className="text-center text-green-600 italic py-4">Excellent Behavior!</td></tr>
                                                    )}
                                                </tbody>
                                            </table>
                                        </div>
                                    </div>
                                )}
                            </div>
                        )}

                        {/* Signatures */}
                        <div className="flex justify-between mt-8 pt-8 px-8">
                            <div className="text-center">
                                <div className="border-t border-black w-32 mx-auto"></div>
                                <span className="text-sm font-bold">Class Teacher</span>
                            </div>
                            <div className="text-center">
                                <div className="border-t border-black w-32 mx-auto"></div>
                                <span className="text-sm font-bold">Principal</span>
                            </div>
                        </div>
                    </div>
                ))}
            </div>

            <style>
                {`
                    .break-after-page { page-break-after: always; }
                    @media print {
                        .no-print { display: none !important; }
                        body { background: white; -webkit-print-color-adjust: exact; margin: 0; }
                    }
                `}
            </style>
        </div>
    );
};

export default ResultGeneration;
