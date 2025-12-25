import { useState, useEffect, useContext } from 'react';
import { Printer } from 'lucide-react';
import AuthContext from '../context/AuthContext';
import API_URL from '../config';

const BulkFeeSlips = () => {
    const { user } = useContext(AuthContext);
    const [slips, setSlips] = useState([]);
    const [selectedClass, setSelectedClass] = useState('1');
    const [month, setMonth] = useState('Dec-2025');
    const [classes, setClasses] = useState([]);
    const [schoolInfo, setSchoolInfo] = useState(null);
    const [printFormat, setPrintFormat] = useState('a4'); // 'a4' or 'receipt'

    useEffect(() => {
        if (!user) return;

        const fetchSchoolInfo = async () => {
            try {
                const res = await fetch(`${API_URL}/api/school`, {
                    headers: { Authorization: `Bearer ${user.token}` }
                });
                const data = await res.json();
                setSchoolInfo(data);
            } catch (error) {
                console.error("Error fetching school info:", error);
            }
        };

        const fetchClasses = async () => {
            try {
                const res = await fetch(`${API_URL}/api/classes`, {
                    headers: { Authorization: `Bearer ${user.token}` }
                });
                const data = await res.json();
                setClasses(data);
                if (data.length > 0) setSelectedClass(data[0].name);
            } catch (error) {
                console.error("Error fetching classes:", error);
            }
        };

        fetchSchoolInfo();
        fetchClasses();
    }, [user]);

    const fetchSlips = async () => {
        try {
            const res = await fetch(`${API_URL}/api/fees/bulk-slips?class_id=${selectedClass}&month=${month}`, {
                headers: { Authorization: `Bearer ${user.token}` }
            });
            const data = await res.json();
            setSlips(data);
        } catch (error) {
            console.error(error);
        }
    };

    return (
        <div className="max-w-7xl mx-auto p-4">
            <div className="no-print bg-white p-4 shadow rounded mb-4">
                <div className="flex gap-4 items-center mb-4">
                    <select value={selectedClass} onChange={(e) => setSelectedClass(e.target.value)} className="border p-2 rounded">
                        {classes.map(c => (
                            <option key={c._id} value={c.name}>{c.name}</option>
                        ))}
                    </select>
                    <input type="text" value={month} onChange={(e) => setMonth(e.target.value)} className="border p-2 rounded" />
                    <button onClick={fetchSlips} className="bg-blue-600 text-white px-4 py-2 rounded">Generate Slips</button>
                    <button onClick={() => window.print()} className="bg-gray-800 text-white px-4 py-2 rounded flex items-center gap-2">
                        <Printer size={18} /> Print
                    </button>
                </div>

                {/* Print Format Selector */}
                <div className="flex gap-6 items-center border-t pt-4">
                    <span className="font-semibold text-gray-700">Print Format:</span>
                    <label className="flex items-center gap-2 cursor-pointer">
                        <input
                            type="radio"
                            name="printFormat"
                            value="a4"
                            checked={printFormat === 'a4'}
                            onChange={(e) => setPrintFormat(e.target.value)}
                            className="w-4 h-4"
                        />
                        <span>A4 Grid (3 per page)</span>
                    </label>
                    <label className="flex items-center gap-2 cursor-pointer">
                        <input
                            type="radio"
                            name="printFormat"
                            value="receipt"
                            checked={printFormat === 'receipt'}
                            onChange={(e) => setPrintFormat(e.target.value)}
                            className="w-4 h-4"
                        />
                        <span>Receipt Printer (1 per page)</span>
                    </label>
                </div>
            </div>

            {/* A4 Page Container Logic: We need to chunk slips into groups of 4 for better page break control if needed, 
                or rely on CSS Grid. CSS Grid with strict dimensions is usually best for "Labels" style printing. */}
            <div className={`print-area print-format-${printFormat}`}>
                {slips
                    .filter(slip => {
                        // Only show students with unpaid balance or arrears
                        const balance = slip.fee.balance || slip.fee.total_payable || 0;
                        const arrears = slip.fee.arrears || 0;
                        return balance > 0 || arrears > 0;
                    })
                    .map((slip, idx) => (
                        <div key={idx} className="fee-slip-card relative border-2 border-black p-4">
                            {/* Cut Line Indicators */}
                            <div className="absolute top-0 left-0 w-4 h-4 border-l border-t border-black -ml-[1px] -mt-[1px]"></div>
                            <div className="absolute top-0 right-0 w-4 h-4 border-r border-t border-black -mr-[1px] -mt-[1px]"></div>
                            <div className="absolute bottom-0 left-0 w-4 h-4 border-l border-b border-black -ml-[1px] -mb-[1px]"></div>
                            <div className="absolute bottom-0 right-0 w-4 h-4 border-r border-b border-black -mr-[1px] -mb-[1px]"></div>

                            <div className="text-center border-b-2 border-dashed border-gray-400 pb-2 mb-2">
                                <h2 className="font-bold text-xl uppercase tracking-widest">{schoolInfo?.name || 'School Name'}</h2>
                                <p className="text-xs">{schoolInfo?.address || 'School Address'}</p>
                                <div className="mt-1 border-2 border-black inline-block px-4 py-0.5 font-bold text-sm bg-gray-50 uppercase">
                                    FEE SLIP - {slip.fee.month}
                                </div>
                            </div>

                            <div className="flex justify-between items-end mb-2 text-sm">
                                <div>
                                    <p><span className="font-bold w-16 inline-block">Roll No:</span> {slip.student.roll_no}</p>
                                    <p><span className="font-bold w-16 inline-block">Name:</span> {slip.student.full_name}</p>
                                    <p className="text-xs text-gray-500">(Father: {slip.father_name})</p>
                                </div>
                                <div className="text-right">
                                    <p className="font-bold">Class: {slip.student.class_id}</p>
                                </div>
                            </div>

                            <div className="border-t-2 border-black pt-2">
                                <div className="flex justify-between py-1 border-b border-gray-300">
                                    <span>{slip.fee.title || 'Tuition Fee'}:</span>
                                    <span className="font-bold">{slip.fee.fee_due || slip.fee.tuition_fee || slip.fee.balance || 0}</span>
                                </div>
                                <div className="flex justify-between py-1 border-b border-gray-300">
                                    <span>Arrears:</span>
                                    <span className="text-red-600 font-semibold">{slip.fee.arrears || 0}</span>
                                </div>
                                {slip.fee.outstanding_funds?.map((fund, i) => (
                                    <div key={i} className="flex justify-between py-1 border-b border-gray-300 bg-yellow-50">
                                        <span>{fund.title}:</span>
                                        <span className="font-semibold">{fund.amount}</span>
                                    </div>
                                ))}
                                <div className="flex justify-between py-2 border-2 border-black bg-gray-100 px-2 mt-2 items-center">
                                    <span className="font-bold uppercase text-sm">Total Payable:</span>
                                    <span className="font-bold text-lg">Rs. {slip.fee.total_payable || (slip.fee.balance || 0) + (slip.fee.arrears || 0)}</span>
                                </div>
                            </div>

                            <div className="mt-4 text-xs flex justify-between items-end">
                                <div>
                                    <p className="font-bold text-red-600">Due Date: 10-12-2025</p>
                                    <p className="text-[10px] mt-1">* Late fee of Rs. 100 will be charged after due date.</p>
                                </div>
                                <div className="text-center w-24">
                                    <div className="border-b border-black mb-1"></div>
                                    <span>Office Sig</span>
                                </div>
                            </div>

                            {/* Cut line for receipt format */}
                            {printFormat === 'receipt' && (
                                <div className="receipt-cut-line mt-4 pt-4 border-t-2 border-dashed border-gray-400 text-center text-xs text-gray-500">
                                    ✂ Cut Here ✂
                                </div>
                            )}
                        </div>
                    ))}
            </div>

            <style>
                {`
                    /* A4 Format Styles */
                    @media print {
                        .no-print { display: none; }
                        body { background: white; margin: 0; padding: 0; -webkit-print-color-adjust: exact; }
                        
                        /* A4 Grid Layout - 3 slips per page */
                        .print-format-a4 {
                            @page { size: A4 portrait; margin: 10mm; }
                        }
                        
                        .print-format-a4 .print-area { 
                            display: grid; 
                            grid-template-columns: repeat(3, 1fr); 
                            width: 100%;
                            gap: 4mm;
                            grid-auto-rows: min-content;
                        }

                        .print-format-a4 .fee-slip-card {
                            width: 100%;
                            height: 90mm;
                            box-sizing: border-box;
                            page-break-inside: avoid;
                            background: white;
                            font-size: 9px;
                            padding: 3mm !important;
                            overflow: hidden;
                        }

                        .print-format-a4 .fee-slip-card h2 {
                            font-size: 12px;
                            margin-bottom: 2px;
                        }

                        .print-format-a4 .fee-slip-card p,
                        .print-format-a4 .fee-slip-card span {
                            font-size: 8px;
                            line-height: 1.2;
                        }
                        
                        .print-format-a4 .receipt-cut-line {
                            display: none;
                        }
                        
                        /* Receipt Printer Layout */
                        .print-format-receipt {
                            @page { size: 80mm auto; margin: 2mm; }
                        }
                        
                        .print-format-receipt .print-area {
                            display: block;
                            width: 76mm;
                            margin: 0 auto;
                        }
                        
                        .print-format-receipt .fee-slip-card {
                            width: 76mm;
                            height: auto;
                            min-height: 120mm;
                            page-break-after: always;
                            box-sizing: border-box;
                            background: white;
                            margin-bottom: 5mm;
                        }
                        
                        .print-format-receipt .fee-slip-card h2 {
                            font-size: 16px;
                        }
                        
                        .print-format-receipt .fee-slip-card p,
                        .print-format-receipt .fee-slip-card span {
                            font-size: 11px;
                        }
                        
                        .print-format-receipt .receipt-cut-line {
                            display: block;
                            margin-top: 8px;
                            padding-top: 8px;
                            border-top: 2px dashed #000;
                        }
                    }
                    
                    /* Screen Simulation */
                    @media screen {
                        .print-format-a4 .print-area {
                            display: grid;
                            grid-template-columns: 1fr 1fr 1fr;
                            gap: 20px;
                        }
                        
                        .print-format-receipt .print-area {
                            display: block;
                            max-width: 80mm;
                            margin: 0 auto;
                        }
                        
                        .print-format-receipt .fee-slip-card {
                            margin-bottom: 20px;
                        }
                    }
                `}
            </style>
        </div>
    );
};

export default BulkFeeSlips;
