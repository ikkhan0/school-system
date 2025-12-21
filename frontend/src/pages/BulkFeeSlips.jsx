import { useState, useEffect, useContext } from 'react';
import { Printer } from 'lucide-react';
import AuthContext from '../context/AuthContext';
import API_URL from '../config';

const BulkFeeSlips = () => {
    const { user } = useContext(AuthContext); // Add user context which was missing!
    const [slips, setSlips] = useState([]);
    const [selectedClass, setSelectedClass] = useState('1');
    const [month, setMonth] = useState('Dec-2025');
    const [classes, setClasses] = useState([]);

    useEffect(() => {
        if (!user) return;
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
            <div className="no-print bg-white p-4 shadow rounded mb-4 flex gap-4 items-center">
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

            {/* A4 Page Container Logic: We need to chunk slips into groups of 4 for better page break control if needed, 
                or rely on CSS Grid. CSS Grid with strict dimensions is usually best for "Labels" style printing. */}
            <div className="print-area">
                {slips.map((slip, idx) => (
                    <div key={idx} className="fee-slip-card relative border-2 border-black p-4">
                        {/* Cut Line Indicators */}
                        <div className="absolute top-0 left-0 w-4 h-4 border-l border-t border-black -ml-[1px] -mt-[1px]"></div>
                        <div className="absolute top-0 right-0 w-4 h-4 border-r border-t border-black -mr-[1px] -mt-[1px]"></div>
                        <div className="absolute bottom-0 left-0 w-4 h-4 border-l border-b border-black -ml-[1px] -mb-[1px]"></div>
                        <div className="absolute bottom-0 right-0 w-4 h-4 border-r border-b border-black -mr-[1px] -mb-[1px]"></div>

                        <div className="text-center border-b-2 border-dashed border-gray-400 pb-2 mb-2">
                            <h2 className="font-bold text-xl uppercase tracking-widest">BISMILLAH EDUCATIONAL COMPLEX</h2>
                            <p className="text-xs">Chak No 223 Jb Tehsil Bhowana</p>
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
                                <span>Tuition Fee:</span>
                                <span className="font-bold">{slip.fee.tuition_fee}</span>
                            </div>
                            <div className="flex justify-between py-1 border-b border-gray-300">
                                <span>Arrears:</span>
                                <span>{slip.fee.arrears}</span>
                            </div>
                            <div className="flex justify-between py-2 border-2 border-black bg-gray-100 px-2 mt-2 items-center">
                                <span className="font-bold uppercase text-sm">Total Payable:</span>
                                <span className="font-bold text-lg">Rs. {slip.fee.balance}</span>
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
                    </div>
                ))}
            </div>

            <style>
                {`
                    @media print {
                        @page { size: A4; margin: 5mm; }
                        .no-print { display: none; }
                        body { background: white; margin: 0; padding: 0; -webkit-print-color-adjust: exact; }
                        
                        .print-area { 
                            display: grid; 
                            grid-template-columns: 1fr 1fr; 
                            grid-template-rows: repeat(2, 1fr);
                            width: 100%;
                            height: 100%; /* Fill the page */
                            gap: 10mm;
                        }

                        .fee-slip-card {
                            height: 135mm; /* ~Half A4 height minus gap */
                            box-sizing: border-box;
                            page-break-inside: avoid;
                            background: white;
                        }
                    }
                    /* Screen Simulation */
                    @media screen {
                        .print-area {
                            display: grid;
                            grid-template-columns: 1fr 1fr;
                            gap: 20px;
                        }
                    }
                `}
            </style>
        </div>
    );
};

export default BulkFeeSlips;
