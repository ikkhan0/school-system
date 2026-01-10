import { useState, useEffect, useContext, useRef } from 'react';
import { Printer, MessageCircle, User, Download, FileText } from 'lucide-react';
import AuthContext from '../context/AuthContext';
import API_URL from '../config';
import html2pdf from 'html2pdf.js';

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
    const [searchQuery, setSearchQuery] = useState('');

    // Footer Customization State
    const [showDate, setShowDate] = useState(true);
    const [showClassTeacher, setShowClassTeacher] = useState(true);
    const [showStamp, setShowStamp] = useState(true);
    const [customDate, setCustomDate] = useState('');
    const [customClassTeacher, setCustomClassTeacher] = useState('');

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

    const getMobileNumber = (student) => {
        if (!student) return null;
        if (student.father_mobile && student.father_mobile.trim()) return student.father_mobile;
        if (student.mother_mobile && student.mother_mobile.trim()) return student.mother_mobile;
        if (student.student_mobile && student.student_mobile.trim()) return student.student_mobile;

        // Diagnostic Log: If we reach here, we found no number.
        // Let's create a useful debug string for the user.
        const keys = Object.keys(student).join(', ');
        console.warn('Debugging Mobile Number for:', student.full_name);
        console.warn('Available Keys:', keys);
        console.warn('Values:', {
            father: student.father_mobile,
            mother: student.mother_mobile,
            student: student.student_mobile
        });

        return null;
    };

    const sendWhatsApp = (mobile, message, studentName) => {
        if (!mobile) {
            return alert(`⚠️ No mobile number found for student: ${studentName || 'Unknown'}.\n\nPlease check the student profile and ensure Father, Mother, or Student mobile is listed.`);
        }
        let num = mobile.replace(/\D/g, '');
        if (num.length === 11 && num.startsWith('0')) {
            num = '92' + num.substring(1);
        }
        window.open(`https://wa.me/${num}?text=${encodeURIComponent(message)}`, '_blank');
    };

    const generateWhatsAppMessage = (result) => {
        const schoolName = schoolInfo?.name || 'School Name';
        const address = schoolInfo?.address ? ` (${schoolInfo.address})` : ''; // Optional address in title line or next line
        const examTitle = result.exam_id.title;
        const studentName = result.student_id.full_name;

        // Date Logic
        let dateStr = '';
        if (result.exam_id.start_date && result.exam_id.end_date) {
            const start = new Date(result.exam_id.start_date).toLocaleDateString('en-GB', { day: 'numeric', month: 'long' });
            const end = new Date(result.exam_id.end_date).toLocaleDateString('en-GB', { day: 'numeric', month: 'long', year: 'numeric' });
            dateStr = `${start} to ${end}`;
        } else {
            dateStr = new Date().toLocaleDateString('en-GB', { day: 'numeric', month: 'long', year: 'numeric' });
        }

        // Subject Breakdown
        // Format: Subject: Obtained/Total
        const subjectLines = result.subjects.map(sub => {
            return `${sub.subject_name}: ${sub.obtained_marks}/${sub.total_marks}`;
        }).join('\n');

        return `*${schoolName}*${address ? '\n' + address : ''}
*${examTitle}*
Date : ${dateStr}

Dear Parents of *${studentName}*,

Your child's result is as follows:

${subjectLines}

*Total Marks: ${result.total_obtained}/${result.total_max}*
*Percentage: ${result.percentage.toFixed(2)}%*

Kindly encourage your child to continue working hard and maintain good performance.`;
    };

    const sendResult = (result) => {
        const msg = generateWhatsAppMessage(result);
        const mobile = getMobileNumber(result.student_id);
        sendWhatsApp(mobile, msg, result.student_id.full_name);
    };

    // Generate PDF and send via WhatsApp
    const sendResultAsPDF = async (result, studentId) => {
        console.log('📄 Starting PDF generation for student:', studentId);

        try {
            const cardElement = document.getElementById(`result-card-${studentId}`);

            if (!cardElement) {
                alert('Result card element not found! Please try again.');
                return;
            }

            // Show loading
            alert('📄 Generating PDF... Please wait.');
            console.log('📝 Element found, generating PDF...');

            // PDF options
            const opt = {
                margin: 0,
                filename: `Result_${result.student_id.roll_no}_${result.student_id.full_name.replace(/\s+/g, '_')}.pdf`,
                image: { type: 'jpeg', quality: 0.98 },
                html2canvas: {
                    scale: 2,
                    useCORS: true,
                    logging: false,
                    backgroundColor: '#ffffff'
                },
                jsPDF: {
                    unit: 'mm',
                    format: 'a4',
                    orientation: 'portrait'
                }
            };

            // Generate PDF
            const pdfBlob = await html2pdf()
                .set(opt)
                .from(cardElement)
                .outputPdf('blob');

            console.log('✅ PDF generated, size:', pdfBlob.size);

            // Create download link
            const url = URL.createObjectURL(pdfBlob);
            const link = document.createElement('a');
            link.href = url;
            link.download = opt.filename;
            document.body.appendChild(link);
            link.click();
            document.body.removeChild(link);

            console.log('⬇️ PDF download initiated');

            // Clean up
            setTimeout(() => {
                URL.revokeObjectURL(url);
            }, 100);

            // Open WhatsApp
            setTimeout(() => {
                const mobile = getMobileNumber(result.student_id);
                if (!mobile) {
                    alert('✅ PDF downloaded!\n\n⚠️ Mobile Number not found. Please manually share the PDF.');
                    return;
                }

                let num = mobile.replace(/\D/g, '');
                if (num.length === 11 && num.startsWith('0')) {
                    num = '92' + num.substring(1);
                }

                const baseMsg = generateWhatsAppMessage(result);
                const message = `${baseMsg}\n\n(PDF downloaded to your device. Please attach and send.)`;

                alert('✅ PDF downloaded successfully!\n\n📱 Opening WhatsApp now. Please attach the downloaded PDF manually.');
                window.open(`https://wa.me/${num}?text=${encodeURIComponent(message)}`, '_blank');
            }, 1000);

        } catch (error) {
            console.error('❌ Error generating PDF:', error);
            alert(`Failed to generate PDF:\n${error.message}\n\nPlease try the Print button instead.`);
        }
    };
    const sendResultAsImage = async (result, studentId) => {
        console.log('🎯 Starting image capture for student:', studentId);

        try {
            const cardElement = document.getElementById(`result-card-${studentId}`);
            console.log('📄 Card element found:', cardElement);

            if (!cardElement) {
                alert('Result card element not found! Please try again.');
                return;
            }

            // Show loading
            alert('📸 Capturing result card as image... Please wait.');

            // WORKAROUND: Replace oklch colors with compatible colors
            // html2canvas doesn't support modern oklch() color function
            const allElements = cardElement.querySelectorAll('*');
            const originalStyles = [];

            allElements.forEach((el, index) => {
                const computedStyle = window.getComputedStyle(el);
                originalStyles[index] = {
                    color: el.style.color,
                    backgroundColor: el.style.backgroundColor,
                    borderColor: el.style.borderColor
                };

                // Replace oklch colors with computed RGB values
                if (computedStyle.color && computedStyle.color !== 'rgba(0, 0, 0, 0)') {
                    el.style.color = computedStyle.color;
                }
                if (computedStyle.backgroundColor && computedStyle.backgroundColor !== 'rgba(0, 0, 0, 0)') {
                    el.style.backgroundColor = computedStyle.backgroundColor;
                }
                if (computedStyle.borderColor && computedStyle.borderColor !== 'rgba(0, 0, 0, 0)') {
                    el.style.borderColor = computedStyle.borderColor;
                }
            });

            // Capture with html2canvas
            console.log('🖼️ Calling html2canvas...');
            const canvas = await html2canvas(cardElement, {
                scale: 2,
                useCORS: true,
                allowTaint: true,
                logging: false,
                backgroundColor: '#ffffff',
                windowWidth: cardElement.scrollWidth,
                windowHeight: cardElement.scrollHeight
            });

            // Restore original styles
            allElements.forEach((el, index) => {
                if (originalStyles[index]) {
                    el.style.color = originalStyles[index].color;
                    el.style.backgroundColor = originalStyles[index].backgroundColor;
                    el.style.borderColor = originalStyles[index].borderColor;
                }
            });

            console.log('✅ Canvas created:', canvas.width, 'x', canvas.height);

            // Convert to blob
            canvas.toBlob((blob) => {
                if (!blob) {
                    alert('Failed to create image blob');
                    return;
                }

                console.log('💾 Blob created, size:', blob.size);

                // Create download URL
                const url = URL.createObjectURL(blob);
                const fileName = `Result_${result.student_id.roll_no}_${result.student_id.full_name.replace(/\s+/g, '_')}.png`;

                // Download the image
                const link = document.createElement('a');
                link.href = url;
                link.download = fileName;
                document.body.appendChild(link);
                link.click();
                document.body.removeChild(link);

                console.log('⬇️ Download initiated');

                // Clean up
                setTimeout(() => {
                    URL.revokeObjectURL(url);
                }, 100);

                // Open WhatsApp
                setTimeout(() => {
                    const mobile = getMobileNumber(result.student_id);
                    if (!mobile) {
                        alert('✅ Image downloaded!\n\n⚠️ Mobile Number not found. Please manually share the image.');
                        return;
                    }

                    let num = mobile.replace(/\D/g, '');
                    if (num.length === 11 && num.startsWith('0')) {
                        num = '92' + num.substring(1);
                    }

                    const baseMsg = generateWhatsAppMessage(result);
                    const message = `${baseMsg}\n\n(Image downloaded to your device. Please attach and send.)`;

                    alert('✅ Image downloaded successfully!\n\n📱 Opening WhatsApp now. Please attach the downloaded image manually.');
                    window.open(`https://wa.me/${num}?text=${encodeURIComponent(message)}`, '_blank');
                }, 1000);

            }, 'image/png', 0.95);

        } catch (error) {
            console.error('❌ Error capturing image:', error);
            alert(`Failed to capture result card:\n${error.message}\n\nPlease try again or use the Print button instead.`);
        }
    };

    const logoUrl = schoolInfo?.logo ? `${API_URL}${schoolInfo.logo}` : null;

    // Filter results based on search query
    const filteredResults = results.filter(result => {
        if (!searchQuery.trim()) return true;

        const query = searchQuery.toLowerCase();
        const name = result.student_id.full_name?.toLowerCase() || '';
        const rollNo = result.student_id.roll_no?.toLowerCase() || '';

        return name.includes(query) || rollNo.includes(query);
    });

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

                {/* Search Box */}
                {results.length > 0 && (
                    <div className="mt-4">
                        <label className="block text-sm font-semibold mb-2">🔍 Search Student</label>
                        <input
                            type="text"
                            placeholder="Search by name or roll number..."
                            value={searchQuery}
                            onChange={(e) => setSearchQuery(e.target.value)}
                            className="w-full sm:w-96 p-2 border rounded-lg text-sm"
                        />
                        {searchQuery && (
                            <p className="text-xs text-gray-600 mt-1">
                                Showing {filteredResults.length} of {results.length} result cards
                            </p>
                        )}
                    </div>
                )}

                {/* Toggles */}
                <div className="flex flex-wrap gap-2 sm:gap-4 items-center mt-4">
                    <label className="flex items-center gap-2 font-semibold text-xs sm:text-sm cursor-pointer">
                        <input type="checkbox" checked={showAttendance} onChange={e => setShowAttendance(e.target.checked)} className="w-4 h-4" />
                        Attendance
                    </label>
                    <label className="flex items-center gap-2 font-semibold text-xs sm:text-sm cursor-pointer">
                        <input type="checkbox" checked={showFees} onChange={e => setShowFees(e.target.checked)} className="w-4 h-4" />
                        Fee Status
                    </label>
                    <label className="flex items-center gap-2 font-semibold text-xs sm:text-sm cursor-pointer">
                        <input type="checkbox" checked={showBehavior} onChange={e => setShowBehavior(e.target.checked)} className="w-4 h-4" />
                        Evaluation Report
                    </label>

                    <button onClick={() => window.print()} className="sm:ml-auto bg-gray-800 text-white px-4 py-2 rounded flex gap-2 items-center text-sm sm:text-base hover:bg-gray-900" title="Print cards or Save as PDF from print dialog">
                        <Printer size={16} className="sm:w-[18px] sm:h-[18px]" /> Print / Save PDF ({filteredResults.length})
                    </button>
                </div>

                {/* Footer Customization Controls */}
                <div className="mt-4 pt-4 border-t border-gray-200">
                    <h3 className="font-bold text-sm mb-2">Footer Customization:</h3>
                    <div className="flex flex-wrap gap-4 items-end">
                        <div className="flex flex-col gap-1">
                            <label className="flex items-center gap-2 font-semibold text-xs cursor-pointer">
                                <input type="checkbox" checked={showDate} onChange={e => setShowDate(e.target.checked)} className="w-4 h-4" />
                                Show Date
                            </label>
                            {showDate && (
                                <input
                                    type="text"
                                    placeholder="Custom Date (Default: Empty)"
                                    value={customDate}
                                    onChange={e => setCustomDate(e.target.value)}
                                    className="border p-1 rounded text-xs w-32"
                                />
                            )}
                        </div>

                        <div className="flex flex-col gap-1">
                            <label className="flex items-center gap-2 font-semibold text-xs cursor-pointer">
                                <input type="checkbox" checked={showClassTeacher} onChange={e => setShowClassTeacher(e.target.checked)} className="w-4 h-4" />
                                Show Class Teacher
                            </label>
                            {showClassTeacher && (
                                <input
                                    type="text"
                                    placeholder="Teacher Name (Default: Empty)"
                                    value={customClassTeacher}
                                    onChange={e => setCustomClassTeacher(e.target.value)}
                                    className="border p-1 rounded text-xs w-32"
                                />
                            )}
                        </div>

                        <div className="flex flex-col gap-1">
                            <label className="flex items-center gap-2 font-semibold text-xs cursor-pointer">
                                <input type="checkbox" checked={showStamp} onChange={e => setShowStamp(e.target.checked)} className="w-4 h-4" />
                                Show School Stamp
                            </label>
                        </div>
                    </div>
                </div>

                {/* PDF Instructions */}
                {results.length > 0 && (
                    <div className="mt-4 p-3 bg-blue-50 border border-blue-200 rounded-lg text-sm">
                        <p className="font-semibold text-blue-900">💡 To save as PDF and share via WhatsApp:</p>
                        <ol className="list-decimal ml-5 mt-2 text-blue-800 space-y-1">
                            <li>Click "<strong>Print / Save PDF</strong>" button above</li>
                            <li>In print dialog, select "<strong>Save as PDF</strong>" or "<strong>Microsoft Print to PDF</strong>"</li>
                            <li>Click Save and choose location</li>
                            <li>Open WhatsApp and attach the saved PDF file</li>
                        </ol>
                        <p className="mt-2 text-xs text-blue-700">Or use the <strong>WhatsApp</strong> button on each card to send result summary as text.</p>
                    </div>
                )}
            </div>

            <div className="print-area space-y-8">
                {filteredResults.length === 0 && results.length > 0 ? (
                    <div className="text-center py-12 bg-white rounded-lg border">
                        <p className="text-gray-500 text-lg">No results match your search</p>
                        <p className="text-gray-400 text-sm mt-2">Try searching with a different name or roll number</p>
                    </div>
                ) : (
                    filteredResults.map((result) => (
                        <div key={result._id} id={`result-card-${result.student_id._id}`} className="result-card bg-white border-4 border-black p-4 min-h-[297mm] w-[210mm] mx-auto break-after-page relative">

                            {/* WhatsApp Button (No Print) */}
                            <div className="absolute top-4 right-4 no-print">
                                <button
                                    onClick={() => sendResult(result)}
                                    className="text-green-600 hover:bg-green-50 p-2 rounded border border-green-200 flex items-center gap-1"
                                    title="Send Result Summary via WhatsApp"
                                >
                                    <MessageCircle size={20} />
                                    <span className="text-xs font-semibold">WhatsApp</span>
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
                                    {result.subjects.map((sub, idx) => {
                                        // Fallback for old results without passing_marks
                                        const passingMarks = sub.passing_marks || Math.round(sub.total_marks * 0.33);
                                        const subjectPassed = sub.obtained_marks >= passingMarks;

                                        return (
                                            <tr key={idx} className="hover:bg-gray-50">
                                                <td className="border-2 border-black p-1.5 font-semibold">{sub.subject_name}</td>
                                                <td className="border-2 border-black p-1.5 text-center">{sub.total_marks}</td>
                                                <td className="border-2 border-black p-1.5 text-center text-gray-600">{passingMarks}</td>
                                                <td className="border-2 border-black p-1.5 text-center font-bold text-sm">{sub.obtained_marks}</td>
                                                <td className={`border-2 border-black p-1.5 text-center font-bold ${subjectPassed ? 'text-green-700 bg-green-50' : 'text-red-700 bg-red-50'}`}>
                                                    {subjectPassed ? 'PASS' : 'FAIL'}
                                                </td>
                                            </tr>
                                        );
                                    })}
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
                                    <div className="text-2xl font-bold text-blue-700">{typeof result.percentage === 'number' ? result.percentage.toFixed(2) : result.percentage}%</div>
                                </div>
                                <div className="border-2 border-black p-2 text-center bg-purple-50">
                                    <div className="text-xs text-gray-600 mb-0.5">GRADE</div>
                                    <div className="text-2xl font-bold text-purple-700">{result.grade}</div>
                                </div>
                                <div className={`border-2 border-black p-2 text-center ${(() => {
                                    // Calculate status with fallback for old results
                                    const allPassed = result.subjects.every(sub => {
                                        const passingMarks = sub.passing_marks || Math.round(sub.total_marks * 0.33);
                                        return sub.obtained_marks >= passingMarks;
                                    });
                                    const finalStatus = result.status || (allPassed ? 'PASS' : 'FAIL');
                                    return finalStatus === 'PASS' ? 'bg-green-100' : 'bg-red-100';
                                })()}`}>
                                    <div className="text-xs text-gray-600 mb-0.5">RESULT</div>
                                    <div className={`text-2xl font-bold ${(() => {
                                        const allPassed = result.subjects.every(sub => {
                                            const passingMarks = sub.passing_marks || Math.round(sub.total_marks * 0.33);
                                            return sub.obtained_marks >= passingMarks;
                                        });
                                        const finalStatus = result.status || (allPassed ? 'PASS' : 'FAIL');
                                        return finalStatus === 'PASS' ? 'text-green-700' : 'text-red-700';
                                    })()}`}>
                                        {(() => {
                                            const allPassed = result.subjects.every(sub => {
                                                const passingMarks = sub.passing_marks || Math.round(sub.total_marks * 0.33);
                                                return sub.obtained_marks >= passingMarks;
                                            });
                                            return result.status || (allPassed ? 'PASS' : 'FAIL');
                                        })()}
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
                                        {showClassTeacher && (
                                            <div className="mb-6">
                                                <p className="font-bold mb-1">Class Teacher:</p>
                                                {customClassTeacher ? (
                                                    <div className="border-b-2 border-black w-48 text-center font-serif text-sm pb-1">{customClassTeacher}</div>
                                                ) : (
                                                    <div className="border-b-2 border-black w-48 h-8"></div>
                                                )}
                                            </div>
                                        )}
                                        {showDate && (
                                            <div>
                                                <p className="font-bold mb-1">Date:</p>
                                                {customDate ? (
                                                    <div className="border-b-2 border-black w-32 text-center font-serif text-sm pb-1">{customDate}</div>
                                                ) : (
                                                    <div className="border-b-2 border-black w-32 h-8"></div>
                                                )}
                                            </div>
                                        )}
                                    </div>
                                    <div className="w-1/2 text-right flex flex-col items-end">
                                        <div className="mb-6">
                                            <p className="font-bold mb-1">Principal Signature:</p>
                                            <div className="border-b-2 border-black w-48 h-12 ml-auto flex items-end justify-center relative">
                                                {schoolInfo?.principal_signature && (
                                                    <img
                                                        src={schoolInfo.principal_signature}
                                                        alt="Signature"
                                                        className="absolute bottom-0 max-h-16 max-w-full object-contain mb-1"
                                                    />
                                                )}
                                            </div>
                                        </div>
                                        {showStamp && (
                                            <div className="relative">
                                                <p className="font-bold mb-1">School Stamp:</p>
                                                <div className="border-2 border-black w-24 h-24 ml-auto flex items-center justify-center overflow-hidden bg-gray-50">
                                                    {schoolInfo?.stamp && (
                                                        <img
                                                            src={schoolInfo.stamp}
                                                            alt="Stamp"
                                                            className="max-w-full max-h-full object-contain p-1"
                                                        />
                                                    )}
                                                </div>
                                            </div>
                                        )}
                                    </div>
                                </div>
                            </div>

                            {/* School Address at Bottom */}
                            <div className="text-center text-[10px] text-gray-600 mt-2 pt-1 border-t">
                                <p className="font-semibold">{schoolInfo?.address || 'School Address'}</p>
                                {schoolInfo?.phone && <p>Contact: {schoolInfo.phone}</p>}
                            </div>
                        </div>
                    ))
                )}
            </div>
        </div>
    );
};

export default ResultGeneration;

