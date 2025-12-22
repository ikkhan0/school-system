import { useState, useEffect, useContext } from 'react';
import { Download, FileSpreadsheet, FileText, SortAsc, SortDesc } from 'lucide-react';
import AuthContext from '../context/AuthContext';
import API_URL from '../config';
import * as XLSX from 'xlsx';
import jsPDF from 'jspdf';
import 'jspdf-autotable';

const ClassResultSheet = () => {
    const { user } = useContext(AuthContext);
    const [exams, setExams] = useState([]);
    const [classes, setClasses] = useState([]);
    const [selectedExam, setSelectedExam] = useState('');
    const [selectedClass, setSelectedClass] = useState('');
    const [selectedSection, setSelectedSection] = useState('');
    const [results, setResults] = useState([]);
    const [loading, setLoading] = useState(false);
    const [sortBy, setSortBy] = useState('position'); // position, name, rollNo
    const [sortOrder, setSortOrder] = useState('asc');

    useEffect(() => {
        if (!user) return;

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
                    setSelectedClass(data[0]._id);
                    setSelectedSection(data[0].sections[0] || 'A');
                }
            });
    }, [user]);

    const fetchResults = async () => {
        if (!selectedExam || !selectedClass || !selectedSection) {
            alert('Please select Exam, Class, and Section');
            return;
        }

        setLoading(true);

        const classData = classes.find(c => c._id === selectedClass);
        if (!classData) {
            setLoading(false);
            return;
        }

        try {
            const res = await fetch(
                `${API_URL}/api/exams/results?exam_id=${selectedExam}&class_id=${classData.name}&section_id=${selectedSection}`,
                { headers: { Authorization: `Bearer ${user.token}` } }
            );
            const data = await res.json();

            // Calculate positions based on percentage
            const sortedByPercentage = [...data].sort((a, b) => b.percentage - a.percentage);
            const resultsWithPosition = sortedByPercentage.map((result, index) => ({
                ...result,
                position: index + 1
            }));

            setResults(resultsWithPosition);
        } catch (error) {
            console.error('Error fetching results:', error);
            alert('Failed to fetch results');
        } finally {
            setLoading(false);
        }
    };

    const getSortedResults = () => {
        const sorted = [...results];

        switch (sortBy) {
            case 'name':
                sorted.sort((a, b) => {
                    const nameA = a.student_id?.full_name || '';
                    const nameB = b.student_id?.full_name || '';
                    return sortOrder === 'asc'
                        ? nameA.localeCompare(nameB)
                        : nameB.localeCompare(nameA);
                });
                break;
            case 'rollNo':
                sorted.sort((a, b) => {
                    const rollA = a.student_id?.roll_no || '';
                    const rollB = b.student_id?.roll_no || '';
                    return sortOrder === 'asc'
                        ? rollA.localeCompare(rollB)
                        : rollB.localeCompare(rollA);
                });
                break;
            case 'position':
            default:
                sorted.sort((a, b) => {
                    return sortOrder === 'asc'
                        ? a.position - b.position
                        : b.position - a.position;
                });
                break;
        }

        return sorted;
    };

    const handleSort = (column) => {
        if (sortBy === column) {
            setSortOrder(sortOrder === 'asc' ? 'desc' : 'asc');
        } else {
            setSortBy(column);
            setSortOrder('asc');
        }
    };

    const exportToExcel = () => {
        const sortedResults = getSortedResults();
        const examData = exams.find(e => e._id === selectedExam);
        const classData = classes.find(c => c._id === selectedClass);

        // Prepare data for Excel
        const excelData = sortedResults.map(result => {
            const row = {
                'Position': result.position,
                'Roll No': result.student_id?.roll_no || '',
                'Student Name': result.student_id?.full_name || '',
            };

            // Add subject-wise marks
            result.subjects.forEach(sub => {
                row[`${sub.subject_name} (${sub.total_marks})`] = sub.obtained_marks;
            });

            row['Total Obtained'] = result.total_obtained;
            row['Total Marks'] = result.total_max;
            row['Percentage'] = result.percentage.toFixed(2) + '%';
            row['Grade'] = result.grade;

            return row;
        });

        // Create worksheet
        const ws = XLSX.utils.json_to_sheet(excelData);

        // Set column widths
        const colWidths = [
            { wch: 10 }, // Position
            { wch: 12 }, // Roll No
            { wch: 25 }, // Name
        ];

        // Add widths for subjects
        if (sortedResults.length > 0) {
            sortedResults[0].subjects.forEach(() => {
                colWidths.push({ wch: 15 });
            });
        }

        colWidths.push({ wch: 15 }); // Total Obtained
        colWidths.push({ wch: 12 }); // Total Marks
        colWidths.push({ wch: 12 }); // Percentage
        colWidths.push({ wch: 8 });  // Grade

        ws['!cols'] = colWidths;

        // Create workbook
        const wb = XLSX.utils.book_new();
        XLSX.utils.book_append_sheet(wb, ws, 'Results');

        // Save file
        const fileName = `${examData?.title || 'Exam'}_${classData?.name || 'Class'}_${selectedSection}_Results.xlsx`;
        XLSX.writeFile(wb, fileName);
    };

    const exportToPDF = () => {
        const sortedResults = getSortedResults();
        const examData = exams.find(e => e._id === selectedExam);
        const classData = classes.find(c => c._id === selectedClass);

        const doc = new jsPDF('l', 'mm', 'a4'); // Landscape orientation

        // Title
        doc.setFontSize(18);
        doc.text(`${examData?.title || 'Exam'} - Result Sheet`, 14, 15);

        doc.setFontSize(12);
        doc.text(`Class: ${classData?.name || ''}-${selectedSection}`, 14, 22);
        doc.text(`Date: ${new Date().toLocaleDateString()}`, 14, 28);

        // Prepare table data
        const headers = [
            'Pos',
            'Roll No',
            'Student Name',
        ];

        // Add subject headers
        if (sortedResults.length > 0) {
            sortedResults[0].subjects.forEach(sub => {
                headers.push(`${sub.subject_name}\n(${sub.total_marks})`);
            });
        }

        headers.push('Total', '%', 'Grade');

        const tableData = sortedResults.map(result => {
            const row = [
                result.position,
                result.student_id?.roll_no || '',
                result.student_id?.full_name || '',
            ];

            // Add subject marks
            result.subjects.forEach(sub => {
                row.push(sub.obtained_marks);
            });

            row.push(result.total_obtained);
            row.push(result.percentage.toFixed(1));
            row.push(result.grade);

            return row;
        });

        // Generate table
        doc.autoTable({
            head: [headers],
            body: tableData,
            startY: 35,
            theme: 'grid',
            headStyles: {
                fillColor: [41, 128, 185],
                textColor: 255,
                fontStyle: 'bold',
                halign: 'center'
            },
            bodyStyles: {
                halign: 'center'
            },
            columnStyles: {
                2: { halign: 'left', cellWidth: 40 } // Student name left-aligned
            },
            styles: {
                fontSize: 8,
                cellPadding: 2
            }
        });

        // Save PDF
        const fileName = `${examData?.title || 'Exam'}_${classData?.name || 'Class'}_${selectedSection}_Results.pdf`;
        doc.save(fileName);
    };

    const SortIcon = ({ column }) => {
        if (sortBy !== column) return <SortAsc size={16} className="text-gray-400" />;
        return sortOrder === 'asc'
            ? <SortAsc size={16} className="text-blue-600" />
            : <SortDesc size={16} className="text-blue-600" />;
    };

    return (
        <div className="max-w-7xl mx-auto p-3 sm:p-4">
            <h1 className="text-2xl sm:text-3xl font-bold mb-4 sm:mb-6 text-gray-800">Class Result Sheet</h1>

            {/* Filters */}
            <div className="bg-white p-4 sm:p-6 rounded-lg shadow mb-4 sm:mb-6">
                <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-3 sm:gap-4 mb-3 sm:mb-4">
                    <div>
                        <label className="block text-xs sm:text-sm font-bold mb-1 sm:mb-2">Exam</label>
                        <select
                            value={selectedExam}
                            onChange={e => setSelectedExam(e.target.value)}
                            className="w-full border p-2 rounded text-sm sm:text-base"
                        >
                            {exams.map(ex => (
                                <option key={ex._id} value={ex._id}>{ex.title}</option>
                            ))}
                        </select>
                    </div>

                    <div>
                        <label className="block text-xs sm:text-sm font-bold mb-1 sm:mb-2">Class</label>
                        <select
                            value={selectedClass}
                            onChange={e => {
                                setSelectedClass(e.target.value);
                                const cls = classes.find(c => c._id === e.target.value);
                                if (cls && cls.sections.length > 0) {
                                    setSelectedSection(cls.sections[0]);
                                }
                            }}
                            className="w-full border p-2 rounded text-sm sm:text-base"
                        >
                            {classes.map(c => (
                                <option key={c._id} value={c._id}>{c.name}</option>
                            ))}
                        </select>
                    </div>

                    <div>
                        <label className="block text-xs sm:text-sm font-bold mb-1 sm:mb-2">Section</label>
                        <select
                            value={selectedSection}
                            onChange={e => setSelectedSection(e.target.value)}
                            className="w-full border p-2 rounded text-sm sm:text-base"
                        >
                            {classes.find(c => c._id === selectedClass)?.sections.map(sec => (
                                <option key={sec} value={sec}>{sec}</option>
                            )) || <option value="A">A</option>}
                        </select>
                    </div>

                    <div className="flex items-end">
                        <button
                            onClick={fetchResults}
                            disabled={loading}
                            className="w-full bg-blue-600 text-white px-4 sm:px-6 py-2 rounded hover:bg-blue-700 disabled:bg-gray-400 text-sm sm:text-base"
                        >
                            {loading ? 'Loading...' : 'Load Results'}
                        </button>
                    </div>
                </div>

                {/* Export Buttons */}
                {results.length > 0 && (
                    <div className="flex flex-col sm:flex-row gap-2 sm:gap-3 pt-3 sm:pt-4 border-t">
                        <button
                            onClick={exportToExcel}
                            className="flex items-center justify-center gap-2 bg-green-600 text-white px-4 py-2 rounded hover:bg-green-700 text-sm sm:text-base"
                        >
                            <FileSpreadsheet size={16} className="sm:w-[18px] sm:h-[18px]" />
                            Export to Excel
                        </button>
                        <button
                            onClick={exportToPDF}
                            className="flex items-center justify-center gap-2 bg-red-600 text-white px-4 py-2 rounded hover:bg-red-700 text-sm sm:text-base"
                        >
                            <FileText size={16} className="sm:w-[18px] sm:h-[18px]" />
                            Export to PDF
                        </button>
                    </div>
                )}
            </div>

            {/* Results Table */}
            {loading && (
                <div className="text-center py-8">
                    <div className="inline-block animate-spin rounded-full h-8 w-8 border-b-2 border-blue-600"></div>
                    <p className="mt-2 text-gray-600">Loading results...</p>
                </div>
            )}

            {!loading && results.length > 0 && (
                <div className="bg-white rounded-lg shadow overflow-hidden">
                    <div className="overflow-x-auto">
                        <table className="w-full">
                            <thead className="bg-gray-100">
                                <tr>
                                    <th
                                        className="p-3 text-left cursor-pointer hover:bg-gray-200"
                                        onClick={() => handleSort('position')}
                                    >
                                        <div className="flex items-center gap-2">
                                            Position
                                            <SortIcon column="position" />
                                        </div>
                                    </th>
                                    <th
                                        className="p-3 text-left cursor-pointer hover:bg-gray-200"
                                        onClick={() => handleSort('rollNo')}
                                    >
                                        <div className="flex items-center gap-2">
                                            Roll No
                                            <SortIcon column="rollNo" />
                                        </div>
                                    </th>
                                    <th
                                        className="p-3 text-left cursor-pointer hover:bg-gray-200"
                                        onClick={() => handleSort('name')}
                                    >
                                        <div className="flex items-center gap-2">
                                            Student Name
                                            <SortIcon column="name" />
                                        </div>
                                    </th>
                                    {results[0]?.subjects.map((sub, idx) => (
                                        <th key={idx} className="p-3 text-center">
                                            {sub.subject_name}
                                            <br />
                                            <span className="text-xs text-gray-500">({sub.total_marks})</span>
                                        </th>
                                    ))}
                                    <th className="p-3 text-center">Total</th>
                                    <th className="p-3 text-center">%</th>
                                    <th className="p-3 text-center">Grade</th>
                                </tr>
                            </thead>
                            <tbody>
                                {getSortedResults().map((result, index) => (
                                    <tr key={result._id} className={`border-t ${index % 2 === 0 ? 'bg-white' : 'bg-gray-50'} hover:bg-blue-50`}>
                                        <td className="p-3 font-bold text-blue-600">{result.position}</td>
                                        <td className="p-3">{result.student_id?.roll_no}</td>
                                        <td className="p-3 font-semibold">{result.student_id?.full_name}</td>
                                        {result.subjects.map((sub, idx) => (
                                            <td key={idx} className="p-3 text-center">
                                                {sub.obtained_marks}
                                            </td>
                                        ))}
                                        <td className="p-3 text-center font-bold">{result.total_obtained}/{result.total_max}</td>
                                        <td className="p-3 text-center font-bold text-green-600">{result.percentage.toFixed(2)}%</td>
                                        <td className="p-3 text-center">
                                            <span className={`px-2 py-1 rounded font-bold ${result.grade === 'A+' || result.grade === 'A' ? 'bg-green-100 text-green-800' :
                                                result.grade === 'B' ? 'bg-blue-100 text-blue-800' :
                                                    result.grade === 'C' ? 'bg-yellow-100 text-yellow-800' :
                                                        result.grade === 'D' ? 'bg-orange-100 text-orange-800' :
                                                            'bg-red-100 text-red-800'
                                                }`}>
                                                {result.grade}
                                            </span>
                                        </td>
                                    </tr>
                                ))}
                            </tbody>
                        </table>
                    </div>

                    {/* Summary */}
                    <div className="bg-gray-50 p-4 border-t">
                        <div className="grid grid-cols-2 md:grid-cols-4 gap-4 text-center">
                            <div>
                                <p className="text-sm text-gray-600">Total Students</p>
                                <p className="text-2xl font-bold text-gray-800">{results.length}</p>
                            </div>
                            <div>
                                <p className="text-sm text-gray-600">Average %</p>
                                <p className="text-2xl font-bold text-blue-600">
                                    {(results.reduce((sum, r) => sum + r.percentage, 0) / results.length).toFixed(2)}%
                                </p>
                            </div>
                            <div>
                                <p className="text-sm text-gray-600">Highest %</p>
                                <p className="text-2xl font-bold text-green-600">
                                    {Math.max(...results.map(r => r.percentage)).toFixed(2)}%
                                </p>
                            </div>
                            <div>
                                <p className="text-sm text-gray-600">Lowest %</p>
                                <p className="text-2xl font-bold text-red-600">
                                    {Math.min(...results.map(r => r.percentage)).toFixed(2)}%
                                </p>
                            </div>
                        </div>
                    </div>
                </div>
            )}

            {!loading && results.length === 0 && selectedExam && (
                <div className="bg-white rounded-lg shadow p-8 text-center text-gray-500">
                    <p>No results found for the selected exam, class, and section.</p>
                    <p className="text-sm mt-2">Please ensure marks have been entered for this exam.</p>
                </div>
            )}
        </div>
    );
};

export default ClassResultSheet;
