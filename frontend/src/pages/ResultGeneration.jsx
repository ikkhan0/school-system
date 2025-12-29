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
        const msg = `Dear Parent,\n\nExam Result: ${result.exam_id.title}\nStudent: ${result.student_id.full_name}\nObtained: ${result.total_obtained} / ${result.total_max}\nPercentage: ${result.percentage}%\nGrade: ${result.grade}\nStatus: ${result.percentage >= 33 ? 'PASS' : 'FAIL'}\n\n- ${schoolInfo?.name || 'School'}`;
        const mobile = result.student_id.father_mobile;
        sendWhatsApp(mobile, msg);
    };

    const logoUrl = schoolInfo?.logo ? `${API_URL}${schoolInfo.logo}` : null;

    return (
        <div className="max-w-6xl mx-auto p-4">
            <div className="no-print mb-6 bg-white p-4 shadow rounded space-y-4">
                <div className="flex flex-col sm:flex-row sm:justify-between sm:items-start gap-4">
                    <h1 className="text-xl sm:text-2xl font-bold">Result Card Generation</h1>
                    <div className="flex flex-col sm:flex-row gap-2 sm:gap-4">
                        <select className="border p-2 rounded text-sm sm:text-base" value={selectedExam} onChange={e => setSelectedExam(e.target.value)}>
                            {exams.map(ex => <option key={ex._id} value={ex._id}>{ex.title}</option>)}
                        </select>
                        <select className="border p-2 rounded text-sm sm:text-base" value={selectedClass} onChange={e => {
                            setSelectedClass(e.target.value);
                            const cls = classes.find(c => c.name === e.target.value);
                            if (cls && cls.sections.length > 0) setSelectedSection(cls.sections[0]);
                        }}>
                            {classes.map(c => <option key={c._id} value={c.name}>{c.name}</option>)}
                        </select>
                        <select className="border p-2 rounded text-sm sm:text-base" value={selectedSection} onChange={e => setSelectedSection(e.target.value)}>
                            {classes.find(c => c.name === selectedClass)?.sections.map(sec => (
                                <option key={sec} value={sec}>{sec}</option>
                            )) || <option value="A">A</option>}
                        </select>
                        <button onClick={fetchResults} className="bg-blue-600 text-white px-4 py-2 rounded text-sm sm:text-base hover:bg-blue-700">Load Results</button>
                    </div>
                </div>

                {/* Toggles */}
                <div className="flex flex-col sm:flex-row gap-3 sm:gap-6 items-start sm:items-center border-t pt-4">
                    <label className="flex items-center gap-2 font-semibold text-xs sm:text-sm cursor-pointer">
                        <input type="checkbox" checked={showAttendance} onChange={e => setShowAttendance(e.target.checked)} className="w-4 h-4" />
                        Attendance Report
                    </label>
                    <label className="flex items-center gap-2 font-semibold text-xs sm:text-sm cursor-pointer">
                        <input type="checkbox" checked={showFees} onChange={e => setShowFees(e.target.checked)} className="w-4 h-4" />
                        Fee Status
                    </label>
                    <label className="flex items-center gap-2 font-semibold text-xs sm:text-sm cursor-pointer">
                        <input type="checkbox" checked={showBehavior} onChange={e => setShowBehavior(e.target.checked)} className="w-4 h-4" />
                        Evaluation Report
                    </label>

                    <button onClick={() => window.print()} className="sm:ml-auto bg-gray-800 text-white px-4 py-2 rounded flex gap-2 items-center text-sm sm:text-base hover:bg-gray-900">
                        <Printer size={16} className="sm:w-[18px] sm:h-[18px]" /> Print Cards
                    </button>
                </div>
            </div>

            <div className="print-area space-y-8">
                {results.map((result) => (
                    <div key={result._id} className="result-card bg-white border-4 border-black p-4 min-h-[297mm] w-[210mm] mx-auto break-after-page relative">

                        {/* WhatsApp Button (No Print) */}
                        <div className="absolute top-4 right-4 no-print">
                            <button onClick={() => sendResult(result)} className="text-green-600 hover:bg-green-50 p-2 rounded border border-green-200" title="Send Result via WhatsApp">
                                <MessageCircle size={24} />
                            </button>
                        </div>

                        {/* Header with Logo */}
                        <div className="flex items-center justify-between mb-3 pb-2 border-b-4 border-black">
                            {/* Left: Logo */}
                            {logoUrl && (
                                <div className="w-16 h-16 flex items-center justify-center">
                                    <img src={logoUrl} alt="School Logo" className="max-w-full max-h-full object-contain" />
                                </div>
                            )}

                            {/* Center: School Info */}
                            <div className="flex-1 text-center px-2">
                                <h1 className="text-2xl font-bold uppercase tracking-wide mb-0.5">{schoolInfo?.name || 'School Name'}</h1>
                                <p className="text-xs text-gray-700">{schoolInfo?.address || 'School Address'}</p>
                                {schoolInfo?.phone && <p className="text-xs text-gray-700">Phone: {schoolInfo.phone}</p>}
                            </div>

                            {/* Right: Student Photo */}
                            <div className="w-20 h-24 border-2 border-black bg-gray-100 flex items-center justify-center overflow-hidden">
                                {(() => {
                                    const photo = result.student_id?.photo || result.student_id?.image;
                                    if (photo) {
                                        const src = (photo.startsWith('http') || photo.startsWith('data:'))
                                            ? photo
                                            : `${API_URL}${photo}`;
                                        return (
                                            <img
                                                src={src}
                                                alt="Student"
                                                className="w-full h-full object-cover"
                                                onError={(e) => { e.target.style.display = 'none'; }}
                                            />
                                        );
                                    }
                                    return <User className="text-gray-400" size={40} />;
                                })()}
                            </div>
                        </div>

                        {/* Result Card Title */}
                        <div className="text-center mb-2">
                            <div className="inline-block border-2 border-black px-4 py-1 bg-white">
                                <h2 className="text-lg font-bold uppercase">Result Card</h2>
                            </div>
                        </div>

                        {/* Student Information */}
                        <div className="grid grid-cols-2 gap-x-4 gap-y-1.5 mb-3 text-xs">
                            <div className="flex border-b border-dotted border-gray-400 pb-0.5">
                                <span className="font-bold w-28">Student Name:</span>
                                <span className="flex-1 uppercase font-semibold">{result.student_id.full_name}</span>
                            </div>
                            <div className="flex border-b border-dotted border-gray-400 pb-0.5">
                                <span className="font-bold w-28">Roll Number:</span>
                                <span className="flex-1 font-semibold">{result.student_id.roll_no}</span>
                            </div>
                            <div className="flex border-b border-dotted border-gray-400 pb-0.5">
                                <span className="font-bold w-28">Father's Name:</span>
                                <span className="flex-1 uppercase font-semibold">{result.student_id.father_name}</span>
                            </div>
                            <div className="flex border-b border-dotted border-gray-400 pb-0.5">
                                <span className="font-bold w-28">Class/Section:</span>
                                <span className="flex-1 font-semibold">{result.class_id} - {result.section_id}</span>
                            </div>
                        </div>

                        {/* Exam Title */}
                        <div className="text-center font-bold bg-gray-800 text-white border-2 border-black mb-2 py-1 text-sm uppercase">
                            {result.exam_id.title}
                        </div>

                        {/* Marks Table */}
                        <table className="w-full border-collapse border-2 border-black mb-3 text-xs">
                            <thead>
                                <tr className="bg-gray-200">
                                    <th className="border-2 border-black p-1.5 text-left font-bold">SUBJECT</th>
                                    <th className="border-2 border-black p-1.5 text-center font-bold w-16">TOTAL</th>
                                    <th className="border-2 border-black p-1.5 text-center font-bold w-16">PASSING</th>
                                    <th className="border-2 border-black p-1.5 text-center font-bold w-20">OBTAINED</th>
                                    <th className="border-2 border-black p-1.5 text-center font-bold w-20">STATUS</th>
                                </tr>
                            </thead>
                            <tbody>
                                {result.subjects.map((sub, idx) => (
                                    <tr key={idx} className="hover:bg-gray-50">
                                        <td className="border-2 border-black p-1.5 font-semibold">{sub.subject_name}</td>
                                        <td className="border-2 border-black p-1.5 text-center">{sub.total_marks}</td>
                                        <td className="border-2 border-black p-1.5 text-center text-gray-600">33</td>
                                        <td className="border-2 border-black p-1.5 text-center font-bold text-sm">{sub.obtained_marks}</td>
                                        <td className={`border-2 border-black p-1.5 text-center font-bold ${sub.obtained_marks >= 33 ? 'text-green-700 bg-green-50' : 'text-red-700 bg-red-50'}`}>
                                            {sub.obtained_marks >= 33 ? 'PASS' : 'FAIL'}
                                        </td>
                                    </tr>
                                ))}
                                {/* Total Row */}
                                <tr className="font-bold bg-yellow-50 text-xs">
                                    <td className="border-2 border-black p-1.5 text-right">TOTAL MARKS</td>
                                    <td className="border-2 border-black p-1.5 text-center">{result.total_max}</td>
                                    <td className="border-2 border-black p-1.5 text-center">-</td>
                                    <td className="border-2 border-black p-1.5 text-center text-sm">{result.total_obtained}</td>
                                    <td className="border-2 border-black p-1.5 text-center">-</td>
                                </tr>
                            </tbody>
                        </table>

                        {/* Result Summary */}
                        <div className="grid grid-cols-3 gap-2 mb-3">
                            <div className="border-2 border-black p-2 text-center bg-blue-50">
                                <div className="text-xs text-gray-600 mb-0.5">PERCENTAGE</div>
                                <div className="text-2xl font-bold text-blue-700">{result.percentage.toFixed(2)}%</div>
                            </div>
                            <div className="border-2 border-black p-2 text-center bg-purple-50">
                                <div className="text-xs text-gray-600 mb-0.5">GRADE</div>
                                <div className="text-2xl font-bold text-purple-700">{result.grade}</div>
                            </div>
                            <div className={`border-2 border-black p-2 text-center ${result.percentage >= 33 ? 'bg-green-100' : 'bg-red-100'}`}>
                                <div className="text-xs text-gray-600 mb-0.5">RESULT</div>
                                <div className={`text-2xl font-bold ${result.percentage >= 33 ? 'text-green-700' : 'text-red-700'}`}>
                                    {result.percentage >= 33 ? 'PASS' : 'FAIL'}
                                </div>
                            </div>
                        </div>

                        {/* Grading Criteria */}
                        <div className="border-2 border-black p-1.5 mb-2 bg-gray-50">
                            <h3 className="font-bold text-xs mb-1">GRADING CRITERIA:</h3>
                            <div className="grid grid-cols-6 gap-1 text-[10px]">
                                <div className="text-center"><span className="font-bold">A+:</span> 90-100%</div>
                                <div className="text-center"><span className="font-bold">A:</span> 80-89%</div>
                                <div className="text-center"><span className="font-bold">B:</span> 70-79%</div>
                                <div className="text-center"><span className="font-bold">C:</span> 60-69%</div>
                                <div className="text-center"><span className="font-bold">D:</span> 50-59%</div>
                                <div className="text-center"><span className="font-bold">F:</span> Below 50%</div>
                            </div>
                        </div>

                        {/* Additional Stats (Optional) */}
                        {(showAttendance || showFees || showBehavior) && result.stats && (
                            <div className="grid grid-cols-3 gap-2 mb-2">
                                {showAttendance && result.stats.attendance && (
                                    <div className="border-2 border-black p-1.5">
                                        <h4 className="font-bold text-[10px] mb-1 border-b pb-0.5">ATTENDANCE</h4>
                                        <div className="text-[9px] space-y-0.5">
                                            <div>Present: <span className="font-bold text-green-600">{result.stats.attendance.present}</span></div>
                                            <div>Absent: <span className="font-bold text-red-600">{result.stats.attendance.absent}</span></div>
                                            <div>Leave: <span className="font-bold text-yellow-600">{result.stats.attendance.leave}</span></div>
                                        </div>
                                    </div>
                                )}
                                {showFees && result.stats.fees && (
                                    <div className="border-2 border-black p-1.5">
                                        <h4 className="font-bold text-[10px] mb-1 border-b pb-0.5">FEE STATUS</h4>
                                        <div className="text-[9px]">
                                            <div>Balance: <span className={`font-bold ${result.stats.fees.balance > 0 ? 'text-red-600' : 'text-green-600'}`}>
                                                Rs. {result.stats.fees.balance}
                                            </span></div>
                                        </div>
                                    </div>
                                )}
                                {showBehavior && result.stats.behavior && (
                                    <div className="border-2 border-black p-1.5">
                                        <h4 className="font-bold text-[10px] mb-1 border-b pb-0.5">BEHAVIOR</h4>
                                        <div className="text-[9px] space-y-0.5">
                                            {Object.entries(result.stats.behavior).map(([key, val]) => val > 0 && (
                                                <div key={key}>{key}: <span className="font-bold text-red-600">{val}</span></div>
                                            ))}
                                        </div>
                                    </div>
                                )}
                            </div>
                        )}

                        {/* Footer */}
                        <div className="border-t-4 border-black pt-4 mt-auto">
                            <div className="flex justify-between items-start text-xs mb-6">
                                <div className="w-1/2">
                                    <div className="mb-6">
                                        <p className="font-bold mb-1">Class Teacher:</p>
                                        <div className="border-b-2 border-black w-48 h-12"></div>
                                    </div>
                                    <div>
                                        <p className="font-bold mb-1">Date:</p>
                                        <div className="border-b-2 border-black w-32 h-8"></div>
                                    </div>
                                </div>
                                <div className="w-1/2 text-right">
                                    <div className="mb-6">
                                        <p className="font-bold mb-1">Principal Signature:</p>
                                        <div className="border-b-2 border-black w-48 h-12 ml-auto"></div>
                                    </div>
                                    <div>
                                        <p className="font-bold mb-1">School Stamp:</p>
                                        <div className="border-2 border-black w-24 h-24 ml-auto"></div>
                                    </div>
                                </div>
                            </div>
                        </div>

                        {/* School Address at Bottom */}
                        <div className="text-center text-[10px] text-gray-600 mt-2 pt-1 border-t">
                            <p className="font-semibold">{schoolInfo?.address || 'School Address'}</p>
                            {schoolInfo?.phone && <p>Contact: {schoolInfo.phone}</p>}
                        </div>
                    </div>
                ))}
            </div>
        </div>
    );
};

export default ResultGeneration;
