import { useState, useEffect, useContext } from 'react';
import { Printer, MessageCircle } from 'lucide-react';
import AuthContext from '../context/AuthContext';

const ResultGeneration = () => {
    const { user } = useContext(AuthContext);
    const [results, setResults] = useState([]);
    const [mockStats, setMockStats] = useState({
        attendance: { presents: 3, absents: 5, leaves: 0, percentage: 38 },
        fees: { month: 2000, arrears: 4000, paid: 0, balance: 5750 },
        behavior: {
            issues: [
                { name: "Uniform", count: 1 },
                { name: "Books", count: 1 },
                { name: "Shoes", count: 2 },
                { name: "Late", count: 2 },
                { name: "Homework", count: 1 }
            ]
        }
    });

    const fetchResults = async () => {
        // Hardcoded for demo
        const examRes = await fetch('http://localhost:5000/api/exams', {
            headers: { Authorization: `Bearer ${user.token}` }
        });
        const exams = await examRes.json();
        if (exams.length === 0) return alert("No Exams Found");

        const res = await fetch(`http://localhost:5000/api/exams/results?exam_id=${exams[0]._id}&class_id=1&section_id=A`, {
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
            <div className="no-print mb-6 bg-white p-4 shadow rounded flex justify-between items-center">
                <h1 className="text-xl font-bold">Result Card Generation</h1>
                <div className="flex gap-4">
                    <button onClick={fetchResults} className="bg-blue-600 text-white px-4 py-2 rounded">Load Results</button>
                    <button onClick={() => window.print()} className="bg-gray-800 text-white px-4 py-2 rounded flex gap-2 items-center">
                        <Printer size={18} /> Print
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
                        <div className="text-center mb-6">
                            <h1 className="text-3xl font-bold uppercase tracking-wider">BISMILLAH EDUCATIONAL COMPLEX</h1>
                            <p className="text-sm">Chak No 223 Jb Tehsil Bhowana [0300-7989915]</p>
                            <div className="mt-4 flex justify-between items-center border-2 border-black p-1 px-4">
                                <div className="text-left text-sm">
                                    <span className="font-bold">Result Card</span>
                                </div>
                                <div className="text-right">
                                    <span className="border border-black px-2 text-sm font-bold">RESULT CARD</span>
                                </div>
                            </div>
                        </div>

                        {/* Student Info */}
                        <div className="flex justify-between text-sm border-b-2 border-black pb-2 mb-4 font-bold uppercase">
                            <div>Name: {result.student_id.full_name}</div>
                            <div>Father: {result.student_id.father_name}</div>
                            <div>Class: {result.class_id} ({result.section_id})</div>
                            <div>Roll No: <span className="border border-black px-2">{result.student_id.roll_no}</span></div>
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

                        {/* USP Bottom Section (3 Boxes) */}
                        <div className="grid grid-cols-3 gap-2 h-48">
                            {/* Box 1: Attendance */}
                            <div className="border-2 border-black rounded-lg overflow-hidden flex flex-col">
                                <div className="bg-gray-200 border-b border-black font-bold text-center py-1 text-xs uppercase">Attendance (2025-12)</div>
                                <div className="p-2 text-xs space-y-2 flex-1">
                                    <div className="flex justify-between border-b border-gray-300 pb-1"><span>Presents:</span> <span>{mockStats.attendance.presents}</span></div>
                                    <div className="flex justify-between border-b border-gray-300 pb-1"><span>Absents:</span> <span>{mockStats.attendance.absents}</span></div>
                                    <div className="flex justify-between border-b border-gray-300 pb-1"><span>Leaves:</span> <span>{mockStats.attendance.leaves}</span></div>
                                    <div className="flex justify-between font-bold pt-1"><span>Percentage:</span> <span>{mockStats.attendance.percentage}%</span></div>
                                </div>
                            </div>

                            {/* Box 2: Fee Status */}
                            <div className="border-2 border-black rounded-lg overflow-hidden flex flex-col">
                                <div className="bg-gray-200 border-b border-black font-bold text-center py-1 text-xs uppercase">Fee Status (2025-12)</div>
                                <div className="p-2 text-xs space-y-2 flex-1">
                                    <div className="flex justify-between border-b border-gray-300 pb-1"><span>Monthly Fee:</span> <span>{mockStats.fees.month}</span></div>
                                    <div className="flex justify-between border-b border-gray-300 pb-1"><span>Arrears/Old:</span> <span>{mockStats.fees.arrears}</span></div>
                                    <div className="flex justify-between border-b border-gray-300 pb-1"><span>Paid:</span> <span>{mockStats.fees.paid}</span></div>
                                    <div className="flex justify-between font-bold pt-1 text-red-600"><span>Balance:</span> <span>{mockStats.fees.balance}</span></div>
                                </div>
                            </div>

                            {/* Box 3: Behavior */}
                            <div className="border-2 border-black rounded-lg overflow-hidden flex flex-col">
                                <div className="bg-gray-200 border-b border-black font-bold text-center py-1 text-xs uppercase">Behavior / Points</div>
                                <div className="p-2 text-xs flex-1">
                                    <table className="w-full">
                                        <thead>
                                            <tr className="text-left text-gray-500"><th>ISSUE</th><th className="text-right">COUNT</th></tr>
                                        </thead>
                                        <tbody>
                                            {mockStats.behavior.issues.map((issue, i) => (
                                                <tr key={i} className="border-b border-gray-100 last:border-0">
                                                    <td className="py-1">{issue.name}</td>
                                                    <td className="text-right font-bold">{issue.count}</td>
                                                </tr>
                                            ))}
                                        </tbody>
                                    </table>
                                </div>
                            </div>
                        </div>

                        {/* Signatures */}
                        <div className="flex justify-between mt-8 pt-8">
                            {/* Empty for now as per image logic usually having space */}
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
