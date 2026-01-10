import { useState, useEffect, useContext } from 'react';
import axios from 'axios';
import API_URL from '../config';
import AuthContext from '../context/AuthContext';
import SettingsContext from '../context/SettingsContext';
import { Save, Building, Phone, Mail, Image as ImageIcon } from 'lucide-react';

const Settings = () => {
    const { user } = useContext(AuthContext);
    const { refreshSettings } = useContext(SettingsContext);
    const [loading, setLoading] = useState(false);
    const [formData, setFormData] = useState({
        name: '',
        address: '',
        phone: '',
        email: '',
        logo: null, // File object
        date_format: 'DD/MM/YYYY',
        time_format: '12-hour',
        fee_voucher_note: '',
        principal_signature: null // File object
    });
    const [preview, setPreview] = useState(null);
    const [signaturePreview, setSignaturePreview] = useState(null);

    useEffect(() => {
        if (user) fetchSchoolDetails();
    }, [user]);

    const fetchSchoolDetails = async () => {
        try {
            console.log('Fetching school details...');
            const res = await axios.get(`${API_URL}/api/school`, {
                headers: { Authorization: `Bearer ${user.token}` }
            });
            console.log('School data received:', res.data);

            const { name, address, phone, email, logo, settings } = res.data;
            console.log('Extracted fields:', { name, address, phone, email, hasLogo: !!logo });

            setFormData(prev => ({
                ...prev,
                name: name || '',
                address: address || '',
                phone: phone || '',
                email: email || '',
                date_format: settings?.date_format || 'DD/MM/YYYY',
                time_format: settings?.time_format || '12-hour',
                fee_voucher_note: settings?.fee_voucher_note || ''
            }));

            // Logo is now base64, display directly
            if (logo) {
                console.log('Setting logo preview');
                setPreview(logo);
            }
            if (res.data.principal_signature) {
                setSignaturePreview(res.data.principal_signature);
            }
        } catch (error) {
            console.error("Error fetching school details:", error);
            console.error("Error response:", error.response?.data);

            // If school not found (404), that's okay - user can create new settings
            if (error.response?.status === 404) {
                console.log('No school settings found yet - will create on save');
            }
        }
    };

    const handleChange = (e) => {
        if (e.target.name === 'logo') {
            const file = e.target.files[0];
            setFormData({ ...formData, logo: file });
            setPreview(URL.createObjectURL(file));
        } else if (e.target.name === 'principal_signature') {
            const file = e.target.files[0];
            setFormData({ ...formData, principal_signature: file });
            setSignaturePreview(URL.createObjectURL(file));
        } else {
            setFormData({ ...formData, [e.target.name]: e.target.value });
        }
    };

    const handleSubmit = async (e) => {
        e.preventDefault();
        setLoading(true);

        console.log('=== SETTINGS SAVE DEBUG ===');
        console.log('Form Data:', formData);
        console.log('Logo is File?', formData.logo instanceof File);
        console.log('Email value:', formData.email);

        try {
            const data = new FormData();
            data.append('name', formData.name);
            data.append('address', formData.address);
            data.append('phone', formData.phone);
            data.append('email', formData.email || '');
            data.append('date_format', formData.date_format);
            data.append('time_format', formData.time_format);
            data.append('fee_voucher_note', formData.fee_voucher_note || '');

            if (formData.logo instanceof File) {
                console.log('Appending logo file:', formData.logo.name);
                data.append('logo', formData.logo);
            }

            if (formData.principal_signature instanceof File) {
                console.log('Appending signature file:', formData.principal_signature.name);
                data.append('principal_signature', formData.principal_signature);
            }

            console.log('Sending to:', `${API_URL}/api/school`);
            console.log('FormData entries:');
            for (let pair of data.entries()) {
                console.log(pair[0], pair[1]);
            }

            const res = await axios.put(`${API_URL}/api/school`, data, {
                headers: {
                    Authorization: `Bearer ${user.token}`,
                    'Content-Type': 'multipart/form-data'
                }
            });

            console.log('Response:', res.data);
            refreshSettings(); // Refresh the global settings context
            alert('School Settings Updated Successfully!');
            window.location.reload();
        } catch (error) {
            console.error('Settings save error:', error);
            console.error('Error response:', error.response?.data);

            // Show detailed error message
            let errorMsg = 'Failed to update settings';
            if (error.response?.data?.error) {
                console.error('Detailed error:', error.response.data.error);
                errorMsg += ': ' + JSON.stringify(error.response.data.error);
            } else if (error.response?.data?.message) {
                errorMsg += ': ' + error.response.data.message;
            } else if (error.message) {
                errorMsg += ': ' + error.message;
            }

            alert(errorMsg);
        } finally {
            setLoading(false);
        }
    };

    return (
        <div className="max-w-2xl mx-auto p-6 bg-white rounded shadow mt-10">
            <h1 className="text-2xl font-bold mb-6 flex items-center gap-2 text-gray-800">
                <Building /> School Settings
            </h1>

            <form onSubmit={handleSubmit} className="space-y-6">

                {/* Logo Section */}
                <div className="flex flex-col items-center mb-6">
                    <div className="w-32 h-32 border-2 border-dashed border-gray-300 rounded-full flex items-center justify-center overflow-hidden mb-2 bg-gray-50 relative">
                        {preview ? (
                            <img src={preview} alt="Logo" className="w-full h-full object-cover" />
                        ) : (
                            <ImageIcon className="text-gray-400" size={48} />
                        )}
                        <input
                            type="file"
                            name="logo"
                            onChange={handleChange}
                            className="absolute inset-0 opacity-0 cursor-pointer"
                            title="Upload Logo"
                        />
                    </div>
                    <span className="text-sm text-gray-500">Tap to Change Logo</span>
                </div>

                <div>
                    <label className="block text-sm font-medium text-gray-700">School Name</label>
                    <input
                        name="name"
                        value={formData.name}
                        onChange={handleChange}
                        className="mt-1 block w-full border border-gray-300 rounded p-2"
                        required
                    />
                </div>

                <div>
                    <label className="block text-sm font-medium text-gray-700">Address</label>
                    <textarea
                        name="address"
                        value={formData.address}
                        onChange={handleChange}
                        className="mt-1 block w-full border border-gray-300 rounded p-2"
                        rows="3"
                    />
                </div>

                <div className="grid grid-cols-2 gap-4">
                    <div>
                        <label className="block text-sm font-medium text-gray-700">Phone</label>
                        <div className="relative">
                            <input
                                name="phone"
                                value={formData.phone}
                                onChange={handleChange}
                                className="mt-1 block w-full border border-gray-300 rounded p-2 pl-8"
                            />
                            <Phone className="absolute left-2 top-3.5 text-gray-400" size={16} />
                        </div>
                    </div>
                    <div>
                        <label className="block text-sm font-medium text-gray-700">Email</label>
                        <div className="relative">
                            <input
                                name="email"
                                value={formData.email}
                                onChange={handleChange}
                                className="mt-1 block w-full border border-gray-300 rounded p-2 pl-8"
                            />
                            <Mail className="absolute left-2 top-3.5 text-gray-400" size={16} />
                        </div>
                    </div>
                </div>

                {/* Principal Signature Upload */}
                <div className="border-t pt-6 mt-6">
                    <h2 className="text-lg font-semibold text-gray-800 mb-4">Principal Signature</h2>
                    <div className="flex flex-col items-center">
                        <div className="w-64 h-32 border-2 border-dashed border-gray-300 rounded flex items-center justify-center overflow-hidden mb-2 bg-gray-50 relative">
                            {signaturePreview ? (
                                <img src={signaturePreview} alt="Principal Signature" className="max-w-full max-h-full object-contain" />
                            ) : (
                                <span className="text-gray-400 text-sm">No Signature Uploaded</span>
                            )}
                            <input
                                type="file"
                                name="principal_signature"
                                onChange={handleChange}
                                className="absolute inset-0 opacity-0 cursor-pointer"
                                title="Upload Principal Signature"
                                accept="image/*"
                            />
                        </div>
                        <span className="text-sm text-gray-500">Tap to Upload Signature Image</span>
                    </div>
                </div>

                {/* Regional Preferences */}
                <div className="border-t pt-6 mt-6">
                    <h2 className="text-lg font-semibold text-gray-800 mb-4">Regional Preferences</h2>

                    <div className="grid grid-cols-2 gap-4">
                        <div>
                            <label className="block text-sm font-medium text-gray-700 mb-2">Date Format</label>
                            <select
                                name="date_format"
                                value={formData.date_format}
                                onChange={handleChange}
                                className="mt-1 block w-full border border-gray-300 rounded p-2"
                            >
                                <option value="DD/MM/YYYY">DD/MM/YYYY (26/12/2025)</option>
                                <option value="MM/DD/YYYY">MM/DD/YYYY (12/26/2025)</option>
                                <option value="YYYY-MM-DD">YYYY-MM-DD (2025-12-26)</option>
                                <option value="DD-MM-YYYY">DD-MM-YYYY (26-12-2025)</option>
                                <option value="MM-DD-YYYY">MM-DD-YYYY (12-26-2025)</option>
                            </select>
                            <p className="text-xs text-gray-500 mt-1">This format will be used throughout the application</p>
                        </div>

                        <div>
                            <label className="block text-sm font-medium text-gray-700 mb-2">Time Format</label>
                            <select
                                name="time_format"
                                value={formData.time_format}
                                onChange={handleChange}
                                className="mt-1 block w-full border border-gray-300 rounded p-2"
                            >
                                <option value="12-hour">12-hour (02:30 PM)</option>
                                <option value="24-hour">24-hour (14:30)</option>
                            </select>
                            <p className="text-xs text-gray-500 mt-1">Choose your preferred time display</p>
                        </div>
                    </div>
                </div>

                {/* Fee Voucher Payment Instructions REMOVED - Moved to Bulk Fee Slips page */}

                <button
                    type="submit"
                    className="w-full bg-blue-600 text-white font-bold py-2 rounded hover:bg-blue-700 flex items-center justify-center gap-2"
                    disabled={loading}
                >
                    <Save size={18} /> {loading ? 'Saving...' : 'Save Settings'}
                </button>
            </form>
        </div>
    );
};

export default Settings;
