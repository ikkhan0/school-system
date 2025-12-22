import { useState, useEffect, useContext } from 'react';
import axios from 'axios';
import AuthContext from '../context/AuthContext';
import { Users, Link, CheckCircle, XCircle, RefreshCw, Search } from 'lucide-react';
import API_URL from '../config';

const SiblingManagement = () => {
    const { user } = useContext(AuthContext);
    const [confirmedFamilies, setConfirmedFamilies] = useState([]);
    const [suggestedGroups, setSuggestedGroups] = useState([]);
    const [loading, setLoading] = useState(false);
    const [showLinkModal, setShowLinkModal] = useState(false);
    const [selectedGroup, setSelectedGroup] = useState(null);
    const [familyData, setFamilyData] = useState({
        father_name: '',
        father_mobile: '',
        father_cnic: '',
        mother_name: '',
        mother_mobile: '',
        address: '',
        whatsapp_number: ''
    });

    useEffect(() => {
        if (user) {
            fetchSiblingData();
        }
    }, [user]);

    const fetchSiblingData = async () => {
        setLoading(true);
        try {
            const response = await axios.post(
                `${API_URL}/api/discounts/detect-siblings`,
                {},
                { headers: { Authorization: `Bearer ${user.token}` } }
            );
            setConfirmedFamilies(response.data.confirmed_families || []);
            setSuggestedGroups(response.data.suggested_by_mobile || []);
        } catch (error) {
            console.error('Error fetching sibling data:', error);
            alert('Failed to fetch sibling data');
        } finally {
            setLoading(false);
        }
    };

    const handleLinkSiblings = (group) => {
        setSelectedGroup(group);
        setFamilyData({
            father_name: group.suggested_father_name || '',
            father_mobile: group.mobile_number || '',
            father_cnic: '',
            mother_name: group.suggested_mother_name || '',
            mother_mobile: '',
            address: '',
            whatsapp_number: group.mobile_number || ''
        });
        setShowLinkModal(true);
    };

    const handleConfirmLink = async () => {
        if (!selectedGroup || selectedGroup.students.length < 2) {
            alert('Please select at least 2 students');
            return;
        }

        try {
            const studentIds = selectedGroup.students.map(s => s._id);
            const response = await axios.post(
                `${API_URL}/api/discounts/link-siblings`,
                {
                    student_ids: studentIds,
                    family_data: familyData
                },
                { headers: { Authorization: `Bearer ${user.token}` } }
            );

            if (response.data.success) {
                alert(`Successfully linked ${response.data.students_linked} siblings! ${response.data.discounts_applied} discounts applied.`);
                setShowLinkModal(false);
                fetchSiblingData();
            }
        } catch (error) {
            console.error('Error linking siblings:', error);
            alert('Failed to link siblings');
        }
    };

    const handleUpdatePositions = async (familyId) => {
        try {
            const response = await axios.put(
                `${API_URL}/api/discounts/update-sibling-positions/${familyId}`,
                {},
                { headers: { Authorization: `Bearer ${user.token}` } }
            );

            if (response.data.success) {
                alert('Sibling positions updated successfully!');
                fetchSiblingData();
            }
        } catch (error) {
            console.error('Error updating positions:', error);
            alert('Failed to update positions');
        }
    };

    return (
        <div className="max-w-7xl mx-auto p-4">
            <div className="bg-white rounded-lg shadow-lg p-6">
                {/* Header */}
                <div className="flex justify-between items-center mb-6">
                    <div>
                        <h1 className="text-3xl font-bold text-gray-800 flex items-center gap-2">
                            <Users className="text-blue-600" />
                            Sibling Management
                        </h1>
                        <p className="text-gray-600">Manage sibling relationships and auto-discounts</p>
                    </div>
                    <button
                        onClick={fetchSiblingData}
                        disabled={loading}
                        className="flex items-center gap-2 px-6 py-3 bg-blue-600 text-white rounded-lg hover:bg-blue-700 disabled:bg-gray-400"
                    >
                        <RefreshCw size={20} className={loading ? 'animate-spin' : ''} />
                        Refresh
                    </button>
                </div>

                {/* Statistics */}
                <div className="grid grid-cols-1 md:grid-cols-2 gap-4 mb-6">
                    <div className="bg-green-50 p-4 rounded-lg border-2 border-green-200">
                        <div className="flex items-center justify-between">
                            <div>
                                <p className="text-sm text-gray-600">Confirmed Families</p>
                                <p className="text-3xl font-bold text-green-600">{confirmedFamilies.length}</p>
                            </div>
                            <CheckCircle size={48} className="text-green-600" />
                        </div>
                    </div>
                    <div className="bg-yellow-50 p-4 rounded-lg border-2 border-yellow-200">
                        <div className="flex items-center justify-between">
                            <div>
                                <p className="text-sm text-gray-600">Suggested Groups</p>
                                <p className="text-3xl font-bold text-yellow-600">{suggestedGroups.length}</p>
                            </div>
                            <Search size={48} className="text-yellow-600" />
                        </div>
                    </div>
                </div>

                {/* Suggested Groups */}
                {suggestedGroups.length > 0 && (
                    <div className="mb-8">
                        <h2 className="text-2xl font-bold mb-4 flex items-center gap-2">
                            <Search className="text-yellow-600" />
                            Suggested Sibling Groups
                        </h2>
                        <div className="space-y-3">
                            {suggestedGroups.map((group, index) => (
                                <div key={index} className="border-2 border-yellow-200 rounded-lg p-4 bg-yellow-50">
                                    <div className="flex justify-between items-start">
                                        <div className="flex-1">
                                            <h3 className="font-bold text-lg">
                                                {group.suggested_father_name || 'Unknown Family'}
                                            </h3>
                                            <p className="text-sm text-gray-600">Mobile: {group.mobile_number}</p>
                                            <div className="mt-2 space-y-1">
                                                {group.students.map((student, idx) => (
                                                    <div key={idx} className="text-sm bg-white p-2 rounded">
                                                        <span className="font-semibold">{student.full_name}</span>
                                                        <span className="text-gray-600 ml-2">
                                                            ({student.class_id}-{student.section_id})
                                                        </span>
                                                        <span className="text-gray-500 ml-2">
                                                            Roll: {student.roll_no}
                                                        </span>
                                                    </div>
                                                ))}
                                            </div>
                                        </div>
                                        <button
                                            onClick={() => handleLinkSiblings(group)}
                                            className="flex items-center gap-2 px-4 py-2 bg-blue-600 text-white rounded hover:bg-blue-700"
                                        >
                                            <Link size={16} />
                                            Link as Siblings
                                        </button>
                                    </div>
                                </div>
                            ))}
                        </div>
                    </div>
                )}

                {/* Confirmed Families */}
                <div>
                    <h2 className="text-2xl font-bold mb-4 flex items-center gap-2">
                        <CheckCircle className="text-green-600" />
                        Confirmed Families
                    </h2>
                    {confirmedFamilies.length === 0 ? (
                        <div className="text-center py-12 bg-gray-50 rounded-lg">
                            <Users size={48} className="mx-auto text-gray-300 mb-4" />
                            <p className="text-gray-500">No confirmed families found</p>
                        </div>
                    ) : (
                        <div className="space-y-3">
                            {confirmedFamilies.map((familyGroup, index) => (
                                <div key={index} className="border-2 border-green-200 rounded-lg p-4 bg-green-50">
                                    <div className="flex justify-between items-start">
                                        <div className="flex-1">
                                            <h3 className="font-bold text-lg">
                                                {familyGroup.family.father_name}
                                            </h3>
                                            <p className="text-sm text-gray-600">
                                                Mobile: {familyGroup.family.father_mobile}
                                            </p>
                                            <p className="text-sm text-gray-600">
                                                Total Children: {familyGroup.students.length}
                                            </p>
                                            <div className="mt-2 space-y-1">
                                                {familyGroup.students.map((student, idx) => (
                                                    <div key={idx} className="text-sm bg-white p-2 rounded flex justify-between items-center">
                                                        <div>
                                                            <span className="font-semibold">{student.full_name}</span>
                                                            <span className="text-gray-600 ml-2">
                                                                ({student.class_id}-{student.section_id})
                                                            </span>
                                                            <span className="text-gray-500 ml-2">
                                                                Position: {student.sibling_discount_position || idx + 1}
                                                            </span>
                                                        </div>
                                                        {student.auto_discount_applied?.total_auto_discount_percentage > 0 && (
                                                            <span className="px-2 py-1 bg-green-100 text-green-700 rounded text-xs font-bold">
                                                                {student.auto_discount_applied.total_auto_discount_percentage}% Discount
                                                            </span>
                                                        )}
                                                    </div>
                                                ))}
                                            </div>
                                        </div>
                                        <button
                                            onClick={() => handleUpdatePositions(familyGroup.family._id)}
                                            className="flex items-center gap-2 px-4 py-2 bg-yellow-500 text-white rounded hover:bg-yellow-600"
                                        >
                                            <RefreshCw size={16} />
                                            Update Positions
                                        </button>
                                    </div>
                                </div>
                            ))}
                        </div>
                    )}
                </div>
            </div>

            {/* Link Siblings Modal */}
            {showLinkModal && selectedGroup && (
                <div className="fixed inset-0 bg-black bg-opacity-50 flex items-center justify-center z-50 p-4">
                    <div className="bg-white rounded-lg p-6 max-w-2xl w-full max-h-[90vh] overflow-y-auto">
                        <div className="flex justify-between items-center mb-4">
                            <h2 className="text-2xl font-bold">Link Siblings</h2>
                            <button
                                onClick={() => setShowLinkModal(false)}
                                className="text-gray-500 hover:text-gray-700 text-2xl"
                            >
                                ×
                            </button>
                        </div>

                        <div className="mb-4">
                            <h3 className="font-bold mb-2">Students to Link:</h3>
                            <div className="space-y-2">
                                {selectedGroup.students.map((student, idx) => (
                                    <div key={idx} className="bg-gray-50 p-2 rounded">
                                        {student.full_name} ({student.class_id}-{student.section_id})
                                    </div>
                                ))}
                            </div>
                        </div>

                        <div className="space-y-4">
                            <h3 className="font-bold">Family Information:</h3>

                            <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                                <div>
                                    <label className="block text-sm font-medium mb-1">Father Name *</label>
                                    <input
                                        type="text"
                                        value={familyData.father_name}
                                        onChange={(e) => setFamilyData({ ...familyData, father_name: e.target.value })}
                                        className="w-full p-2 border rounded"
                                        required
                                    />
                                </div>
                                <div>
                                    <label className="block text-sm font-medium mb-1">Father Mobile *</label>
                                    <input
                                        type="text"
                                        value={familyData.father_mobile}
                                        onChange={(e) => setFamilyData({ ...familyData, father_mobile: e.target.value })}
                                        className="w-full p-2 border rounded"
                                        required
                                    />
                                </div>
                                <div>
                                    <label className="block text-sm font-medium mb-1">Father CNIC</label>
                                    <input
                                        type="text"
                                        value={familyData.father_cnic}
                                        onChange={(e) => setFamilyData({ ...familyData, father_cnic: e.target.value })}
                                        className="w-full p-2 border rounded"
                                    />
                                </div>
                                <div>
                                    <label className="block text-sm font-medium mb-1">Mother Name</label>
                                    <input
                                        type="text"
                                        value={familyData.mother_name}
                                        onChange={(e) => setFamilyData({ ...familyData, mother_name: e.target.value })}
                                        className="w-full p-2 border rounded"
                                    />
                                </div>
                                <div>
                                    <label className="block text-sm font-medium mb-1">Mother Mobile</label>
                                    <input
                                        type="text"
                                        value={familyData.mother_mobile}
                                        onChange={(e) => setFamilyData({ ...familyData, mother_mobile: e.target.value })}
                                        className="w-full p-2 border rounded"
                                    />
                                </div>
                                <div>
                                    <label className="block text-sm font-medium mb-1">WhatsApp Number</label>
                                    <input
                                        type="text"
                                        value={familyData.whatsapp_number}
                                        onChange={(e) => setFamilyData({ ...familyData, whatsapp_number: e.target.value })}
                                        className="w-full p-2 border rounded"
                                    />
                                </div>
                            </div>

                            <div>
                                <label className="block text-sm font-medium mb-1">Address</label>
                                <textarea
                                    value={familyData.address}
                                    onChange={(e) => setFamilyData({ ...familyData, address: e.target.value })}
                                    className="w-full p-2 border rounded"
                                    rows="2"
                                />
                            </div>
                        </div>

                        <div className="flex gap-3 mt-6">
                            <button
                                onClick={() => setShowLinkModal(false)}
                                className="flex-1 px-4 py-2 bg-gray-300 text-gray-700 rounded hover:bg-gray-400"
                            >
                                Cancel
                            </button>
                            <button
                                onClick={handleConfirmLink}
                                className="flex-1 flex items-center justify-center gap-2 px-4 py-2 bg-blue-600 text-white rounded hover:bg-blue-700"
                            >
                                <Link size={18} />
                                Confirm Link
                            </button>
                        </div>
                    </div>
                </div>
            )}
        </div>
    );
};

export default SiblingManagement;
