import { useState, useContext } from 'react';
import { useNavigate } from 'react-router-dom';
import axios from 'axios';
import AuthContext from '../context/AuthContext';
import { Upload, Download, CheckCircle, XCircle, AlertCircle, ArrowLeft, FileSpreadsheet } from 'lucide-react';
import API_URL from '../config';

const ImportStudents = () => {
    const { user } = useContext(AuthContext);
    const navigate = useNavigate();

    const [step, setStep] = useState(1);
    const [file, setFile] = useState(null);
    const [validationResults, setValidationResults] = useState(null);
    const [importing, setImporting] = useState(false);
    const [importResults, setImportResults] = useState(null);

    // Download sample CSV
    const handleDownloadSample = async () => {
        try {
            const response = await axios.get(`${API_URL}/api/students/import/sample`, {
                headers: { Authorization: `Bearer ${user.token}` },
                responseType: 'blob'
            });

            const url = window.URL.createObjectURL(new Blob([response.data]));
            const link = document.createElement('a');
            link.href = url;
            link.setAttribute('download', 'student_import_sample.csv');
            document.body.appendChild(link);
            link.click();
            link.remove();
        } catch (error) {
            console.error('Error downloading sample:', error);
            alert('Failed to download sample file');
        }
    };

    // Handle file selection
    const handleFileChange = (e) => {
        const selectedFile = e.target.files[0];
        if (selectedFile) {
            const validTypes = ['text/csv', 'application/vnd.ms-excel', 'application/vnd.openxmlformats-officedocument.spreadsheetml.sheet'];
            if (!validTypes.includes(selectedFile.type) && !selectedFile.name.match(/\.(csv|xlsx|xls)$/)) {
                alert('Please upload a CSV or Excel file');
                return;
            }
            setFile(selectedFile);
        }
    };

    // Upload and validate file
    const handleUploadAndValidate = async () => {
        if (!file) {
            alert('Please select a file');
            return;
        }

        try {
            setImporting(true);
            const formData = new FormData();
            formData.append('file', file);

            const response = await axios.post(`${API_URL}/api/students/import/validate`, formData, {
                headers: {
                    Authorization: `Bearer ${user.token}`,
                    'Content-Type': 'multipart/form-data'
                }
            });

            setValidationResults(response.data.validation);
            setStep(2);
        } catch (error) {
            console.error('Error validating file:', error);
            alert(error.response?.data?.message || 'Failed to validate file');
        } finally {
            setImporting(false);
        }
    };

    // Confirm and import
    const handleConfirmImport = async () => {
        if (!validationResults || validationResults.valid.length === 0) {
            alert('No valid students to import');
            return;
        }

        try {
            setImporting(true);
            const studentsToImport = validationResults.valid.map(v => v.data);

            const response = await axios.post(`${API_URL}/api/students/import/confirm`, {
                students: studentsToImport
            }, {
                headers: { Authorization: `Bearer ${user.token}` }
            });

            setImportResults(response.data);
            setStep(3);
        } catch (error) {
            console.error('Error importing students:', error);
            alert(error.response?.data?.message || 'Failed to import students');
        } finally {
            setImporting(false);
        }
    };

    return (
        <div className="p-3 sm:p-4 max-w-7xl mx-auto">
            <div className="bg-white rounded-lg shadow-lg p-4 sm:p-6">
                {/* Header */}
                <div className="flex items-center gap-3 mb-6">
                    <button
                        onClick={() => navigate('/students')}
                        className="p-2 hover:bg-gray-100 rounded-lg"
                    >
                        <ArrowLeft size={24} />
                    </button>
                    <h1 className="text-2xl sm:text-3xl font-bold text-gray-800">Import Students</h1>
                </div>

                {/* Progress Steps */}
                <div className="flex items-center justify-center mb-8">
                    <div className="flex items-center gap-2 sm:gap-4">
                        <div className={`flex items-center gap-2 ${step >= 1 ? 'text-blue-600' : 'text-gray-400'}`}>
                            <div className={`w-8 h-8 rounded-full flex items-center justify-center ${step >= 1 ? 'bg-blue-600 text-white' : 'bg-gray-200'}`}>
                                1
                            </div>
                            <span className="hidden sm:inline font-semibold">Upload</span>
                        </div>
                        <div className={`w-12 sm:w-24 h-1 ${step >= 2 ? 'bg-blue-600' : 'bg-gray-200'}`}></div>
                        <div className={`flex items-center gap-2 ${step >= 2 ? 'text-blue-600' : 'text-gray-400'}`}>
                            <div className={`w-8 h-8 rounded-full flex items-center justify-center ${step >= 2 ? 'bg-blue-600 text-white' : 'bg-gray-200'}`}>
                                2
                            </div>
                            <span className="hidden sm:inline font-semibold">Review</span>
                        </div>
                        <div className={`w-12 sm:w-24 h-1 ${step >= 3 ? 'bg-blue-600' : 'bg-gray-200'}`}></div>
                        <div className={`flex items-center gap-2 ${step >= 3 ? 'text-blue-600' : 'text-gray-400'}`}>
                            <div className={`w-8 h-8 rounded-full flex items-center justify-center ${step >= 3 ? 'bg-blue-600 text-white' : 'bg-gray-200'}`}>
                                3
                            </div>
                            <span className="hidden sm:inline font-semibold">Complete</span>
                        </div>
                    </div>
                </div>

                {/* Step 1: Upload File */}
                {step === 1 && (
                    <div className="space-y-6">
                        {/* Instructions */}
                        <div className="bg-blue-50 border border-blue-200 rounded-lg p-4">
                            <h3 className="font-bold text-blue-900 mb-2 flex items-center gap-2">
                                <AlertCircle size={20} />
                                Instructions
                            </h3>
                            <ol className="list-decimal list-inside space-y-2 text-sm text-blue-800">
                                <li>Download the sample CSV template</li>
                                <li>Fill in student data according to the format</li>
                                <li>Save the file as CSV or Excel (.xlsx)</li>
                                <li>Upload the file below</li>
                            </ol>
                        </div>

                        {/* Download Sample */}
                        <div className="border-2 border-dashed border-gray-300 rounded-lg p-6 text-center">
                            <FileSpreadsheet size={48} className="mx-auto text-gray-400 mb-4" />
                            <h3 className="font-bold text-lg mb-2">Step 1: Download Sample Template</h3>
                            <p className="text-gray-600 mb-4">Download the sample CSV file to see the required format</p>
                            <button
                                onClick={handleDownloadSample}
                                className="inline-flex items-center gap-2 px-6 py-3 bg-green-600 text-white rounded-lg hover:bg-green-700 shadow-md"
                            >
                                <Download size={20} />
                                Download Sample CSV
                            </button>
                        </div>

                        {/* Required Fields Info */}
                        <div className="bg-yellow-50 border border-yellow-200 rounded-lg p-4">
                            <h3 className="font-bold text-yellow-900 mb-2">Required Fields</h3>
                            <div className="grid grid-cols-1 sm:grid-cols-2 gap-2 text-sm text-yellow-800">
                                <div>• roll_no (unique)</div>
                                <div>• full_name</div>
                                <div>• class_id</div>
                                <div>• section_id</div>
                                <div>• father_mobile</div>
                            </div>
                            <p className="text-xs text-yellow-700 mt-2">All other fields are optional</p>
                        </div>

                        {/* Upload File */}
                        <div className="border-2 border-dashed border-gray-300 rounded-lg p-6 text-center">
                            <Upload size={48} className="mx-auto text-gray-400 mb-4" />
                            <h3 className="font-bold text-lg mb-2">Step 2: Upload Your File</h3>
                            <p className="text-gray-600 mb-4">Select CSV or Excel file to import</p>

                            <input
                                type="file"
                                accept=".csv,.xlsx,.xls"
                                onChange={handleFileChange}
                                className="hidden"
                                id="file-upload"
                            />
                            <label
                                htmlFor="file-upload"
                                className="inline-flex items-center gap-2 px-6 py-3 bg-blue-600 text-white rounded-lg hover:bg-blue-700 cursor-pointer shadow-md"
                            >
                                <Upload size={20} />
                                Choose File
                            </label>

                            {file && (
                                <div className="mt-4 p-3 bg-gray-100 rounded-lg">
                                    <p className="text-sm font-semibold text-gray-700">Selected: {file.name}</p>
                                    <p className="text-xs text-gray-500">{(file.size / 1024).toFixed(2)} KB</p>
                                </div>
                            )}
                        </div>

                        {/* Upload Button */}
                        <div className="flex justify-end">
                            <button
                                onClick={handleUploadAndValidate}
                                disabled={!file || importing}
                                className="px-8 py-3 bg-blue-600 text-white rounded-lg hover:bg-blue-700 disabled:bg-gray-300 disabled:cursor-not-allowed shadow-md font-semibold"
                            >
                                {importing ? 'Validating...' : 'Upload & Validate'}
                            </button>
                        </div>
                    </div>
                )}

                {/* Step 2: Review Validation Results */}
                {step === 2 && validationResults && (
                    <div className="space-y-6">
                        {/* Summary */}
                        <div className="grid grid-cols-1 sm:grid-cols-3 gap-4">
                            <div className="bg-blue-50 border border-blue-200 rounded-lg p-4 text-center">
                                <p className="text-sm text-blue-600 font-semibold">Total Records</p>
                                <p className="text-3xl font-bold text-blue-900">{validationResults.summary.total}</p>
                            </div>
                            <div className="bg-green-50 border border-green-200 rounded-lg p-4 text-center">
                                <p className="text-sm text-green-600 font-semibold">Valid Records</p>
                                <p className="text-3xl font-bold text-green-900">{validationResults.summary.valid}</p>
                            </div>
                            <div className="bg-red-50 border border-red-200 rounded-lg p-4 text-center">
                                <p className="text-sm text-red-600 font-semibold">Invalid Records</p>
                                <p className="text-3xl font-bold text-red-900">{validationResults.summary.invalid}</p>
                            </div>
                        </div>

                        {/* Valid Students */}
                        {validationResults.valid.length > 0 && (
                            <div className="border border-green-200 rounded-lg overflow-hidden">
                                <div className="bg-green-50 px-4 py-3 border-b border-green-200">
                                    <h3 className="font-bold text-green-900 flex items-center gap-2">
                                        <CheckCircle size={20} />
                                        Valid Students ({validationResults.valid.length})
                                    </h3>
                                </div>
                                <div className="overflow-x-auto max-h-96">
                                    <table className="w-full text-sm">
                                        <thead className="bg-gray-50 sticky top-0">
                                            <tr>
                                                <th className="px-4 py-2 text-left">Row</th>
                                                <th className="px-4 py-2 text-left">Roll No</th>
                                                <th className="px-4 py-2 text-left">Name</th>
                                                <th className="px-4 py-2 text-left">Class</th>
                                                <th className="px-4 py-2 text-left">Father Mobile</th>
                                            </tr>
                                        </thead>
                                        <tbody>
                                            {validationResults.valid.map((item, idx) => (
                                                <tr key={idx} className="border-b hover:bg-green-50">
                                                    <td className="px-4 py-2">{item.row}</td>
                                                    <td className="px-4 py-2 font-semibold">{item.data.roll_no}</td>
                                                    <td className="px-4 py-2">{item.data.full_name}</td>
                                                    <td className="px-4 py-2">{item.data.class_id}-{item.data.section_id}</td>
                                                    <td className="px-4 py-2">{item.data.father_mobile}</td>
                                                </tr>
                                            ))}
                                        </tbody>
                                    </table>
                                </div>
                            </div>
                        )}

                        {/* Invalid Students */}
                        {validationResults.invalid.length > 0 && (
                            <div className="border border-red-200 rounded-lg overflow-hidden">
                                <div className="bg-red-50 px-4 py-3 border-b border-red-200">
                                    <h3 className="font-bold text-red-900 flex items-center gap-2">
                                        <XCircle size={20} />
                                        Invalid Students ({validationResults.invalid.length})
                                    </h3>
                                </div>
                                <div className="overflow-x-auto max-h-96">
                                    <table className="w-full text-sm">
                                        <thead className="bg-gray-50 sticky top-0">
                                            <tr>
                                                <th className="px-4 py-2 text-left">Row</th>
                                                <th className="px-4 py-2 text-left">Data</th>
                                                <th className="px-4 py-2 text-left">Errors</th>
                                            </tr>
                                        </thead>
                                        <tbody>
                                            {validationResults.invalid.map((item, idx) => (
                                                <tr key={idx} className="border-b hover:bg-red-50">
                                                    <td className="px-4 py-2">{item.row}</td>
                                                    <td className="px-4 py-2">
                                                        <div className="text-xs">
                                                            <div><strong>Roll:</strong> {item.data.roll_no || 'N/A'}</div>
                                                            <div><strong>Name:</strong> {item.data.full_name || 'N/A'}</div>
                                                        </div>
                                                    </td>
                                                    <td className="px-4 py-2">
                                                        <ul className="list-disc list-inside text-xs text-red-700">
                                                            {item.errors.map((error, eidx) => (
                                                                <li key={eidx}>{error}</li>
                                                            ))}
                                                        </ul>
                                                    </td>
                                                </tr>
                                            ))}
                                        </tbody>
                                    </table>
                                </div>
                            </div>
                        )}

                        {/* Actions */}
                        <div className="flex justify-between">
                            <button
                                onClick={() => {
                                    setStep(1);
                                    setFile(null);
                                    setValidationResults(null);
                                }}
                                className="px-6 py-3 bg-gray-200 text-gray-700 rounded-lg hover:bg-gray-300 font-semibold"
                            >
                                Upload Different File
                            </button>
                            <button
                                onClick={handleConfirmImport}
                                disabled={validationResults.valid.length === 0 || importing}
                                className="px-8 py-3 bg-blue-600 text-white rounded-lg hover:bg-blue-700 disabled:bg-gray-300 disabled:cursor-not-allowed shadow-md font-semibold"
                            >
                                {importing ? 'Importing...' : `Import ${validationResults.valid.length} Students`}
                            </button>
                        </div>
                    </div>
                )}

                {/* Step 3: Import Complete */}
                {step === 3 && importResults && (
                    <div className="space-y-6">
                        <div className="text-center py-8">
                            <CheckCircle size={64} className="mx-auto text-green-600 mb-4" />
                            <h2 className="text-2xl font-bold text-gray-800 mb-2">Import Complete!</h2>
                            <p className="text-gray-600">Students have been successfully imported</p>
                        </div>

                        {/* Summary */}
                        <div className="grid grid-cols-1 sm:grid-cols-3 gap-4">
                            <div className="bg-blue-50 border border-blue-200 rounded-lg p-4 text-center">
                                <p className="text-sm text-blue-600 font-semibold">Total Processed</p>
                                <p className="text-3xl font-bold text-blue-900">{importResults.summary.total}</p>
                            </div>
                            <div className="bg-green-50 border border-green-200 rounded-lg p-4 text-center">
                                <p className="text-sm text-green-600 font-semibold">Successfully Imported</p>
                                <p className="text-3xl font-bold text-green-900">{importResults.summary.imported}</p>
                            </div>
                            <div className="bg-red-50 border border-red-200 rounded-lg p-4 text-center">
                                <p className="text-sm text-red-600 font-semibold">Failed</p>
                                <p className="text-3xl font-bold text-red-900">{importResults.summary.failed}</p>
                            </div>
                        </div>

                        {/* Success List */}
                        {importResults.results.success.length > 0 && (
                            <div className="border border-green-200 rounded-lg overflow-hidden">
                                <div className="bg-green-50 px-4 py-3 border-b border-green-200">
                                    <h3 className="font-bold text-green-900">Successfully Imported</h3>
                                </div>
                                <div className="overflow-x-auto max-h-64">
                                    <table className="w-full text-sm">
                                        <thead className="bg-gray-50">
                                            <tr>
                                                <th className="px-4 py-2 text-left">Roll No</th>
                                                <th className="px-4 py-2 text-left">Name</th>
                                                <th className="px-4 py-2 text-left">Class</th>
                                            </tr>
                                        </thead>
                                        <tbody>
                                            {importResults.results.success.map((student, idx) => (
                                                <tr key={idx} className="border-b">
                                                    <td className="px-4 py-2 font-semibold">{student.roll_no}</td>
                                                    <td className="px-4 py-2">{student.full_name}</td>
                                                    <td className="px-4 py-2">{student.class}</td>
                                                </tr>
                                            ))}
                                        </tbody>
                                    </table>
                                </div>
                            </div>
                        )}

                        {/* Failed List */}
                        {importResults.results.failed.length > 0 && (
                            <div className="border border-red-200 rounded-lg overflow-hidden">
                                <div className="bg-red-50 px-4 py-3 border-b border-red-200">
                                    <h3 className="font-bold text-red-900">Failed Imports</h3>
                                </div>
                                <div className="overflow-x-auto max-h-64">
                                    <table className="w-full text-sm">
                                        <thead className="bg-gray-50">
                                            <tr>
                                                <th className="px-4 py-2 text-left">Data</th>
                                                <th className="px-4 py-2 text-left">Error</th>
                                            </tr>
                                        </thead>
                                        <tbody>
                                            {importResults.results.failed.map((item, idx) => (
                                                <tr key={idx} className="border-b">
                                                    <td className="px-4 py-2">
                                                        {item.data.roll_no} - {item.data.full_name}
                                                    </td>
                                                    <td className="px-4 py-2 text-red-700">{item.error}</td>
                                                </tr>
                                            ))}
                                        </tbody>
                                    </table>
                                </div>
                            </div>
                        )}

                        {/* Actions */}
                        <div className="flex justify-center gap-4">
                            <button
                                onClick={() => {
                                    setStep(1);
                                    setFile(null);
                                    setValidationResults(null);
                                    setImportResults(null);
                                }}
                                className="px-6 py-3 bg-blue-600 text-white rounded-lg hover:bg-blue-700 font-semibold"
                            >
                                Import More Students
                            </button>
                            <button
                                onClick={() => navigate('/students')}
                                className="px-6 py-3 bg-green-600 text-white rounded-lg hover:bg-green-700 font-semibold"
                            >
                                View All Students
                            </button>
                        </div>
                    </div>
                )}
            </div>
        </div>
    );
};

export default ImportStudents;
