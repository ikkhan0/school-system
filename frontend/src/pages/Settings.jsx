import { useState, useEffect, useContext } from 'react';
import axios from 'axios';
import API_URL from '../config';
import AuthContext from '../context/AuthContext';
import { Save, Building, Phone, Mail, Image as ImageIcon } from 'lucide-react';

const Settings = () => {
    const { user } = useContext(AuthContext);
    const [loading, setLoading] = useState(false);
    const [formData, setFormData] = useState({
        name: '',
        address: '',
        phone: '',
        email: '',
        logo: null // File object
    });
    const [preview, setPreview] = useState(null);

    useEffect(() => {
        if (user) fetchSchoolDetails();
    }, [user]);

    const fetchSchoolDetails = async () => {
        try {
            const res = await axios.get(`${API_URL}/api/school`, {
                headers: { Authorization: `Bearer ${user.token}` }
            });
            const { name, address, phone, email, logo } = res.data;
            setFormData(prev => ({ ...prev, name, address, phone, email }));
            // Logo is now base64, display directly
            if (logo) setPreview(logo);
        } catch (error) {
            console.error("Error fetching school details:", error);
        }
    };

    const handleChange = (e) => {
        if (e.target.name === 'logo') {
            const file = e.target.files[0];
            setFormData({ ...formData, logo: file });
            setPreview(URL.createObjectURL(file));
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

            if (formData.logo instanceof File) {
                console.log('Appending logo file:', formData.logo.name);
                data.append('logo', formData.logo);
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
