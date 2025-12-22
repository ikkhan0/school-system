// Add staff via API - Run this after logging in to get your token
// Replace YOUR_TOKEN_HERE with your actual JWT token from localStorage

const API_URL = 'https://soft-school-management.vercel.app';

const staffMembers = [
    {
        full_name: 'Ahmed Khan',
        employee_id: 'EMP-001',
        cnic: '12345-1234567-1',
        dob: '1985-05-15',
        gender: 'Male',
        mobile: '03001234567',
        email: 'ahmed.khan@school.com',
        current_address: 'House 123, Model Town, Lahore',
        city: 'Lahore',
        blood_group: 'B+',
        religion: 'Islam',
        designation: 'Teacher',
        department: 'Academic',
        joining_date: '2020-01-15',
        employment_type: 'Permanent',
        basic_salary: '45000',
        bank_name: 'HBL',
        account_number: '12345678901234',
        emergency_contact_name: 'Fatima Khan',
        emergency_contact_mobile: '03009876543'
    },
    {
        full_name: 'Sarah Ali',
        employee_id: 'EMP-002',
        cnic: '12345-7654321-2',
        dob: '1990-08-22',
        gender: 'Female',
        mobile: '03112345678',
        email: 'sarah.ali@school.com',
        current_address: 'Flat 45, Johar Town, Lahore',
        city: 'Lahore',
        blood_group: 'A+',
        religion: 'Islam',
        designation: 'Subject Teacher',
        department: 'Academic',
        joining_date: '2021-03-10',
        employment_type: 'Permanent',
        basic_salary: '40000',
        bank_name: 'MCB',
        account_number: '98765432109876',
        emergency_contact_name: 'Hassan Ali',
        emergency_contact_mobile: '03221234567'
    },
    {
        full_name: 'Muhammad Usman',
        employee_id: 'EMP-003',
        cnic: '12345-1111111-3',
        dob: '1978-12-10',
        gender: 'Male',
        mobile: '03331234567',
        email: 'usman@school.com',
        current_address: 'House 789, DHA Phase 5, Lahore',
        city: 'Lahore',
        blood_group: 'O+',
        religion: 'Islam',
        designation: 'Principal',
        department: 'Management',
        joining_date: '2015-08-01',
        employment_type: 'Permanent',
        basic_salary: '80000',
        bank_name: 'UBL',
        account_number: '11111111111111',
        emergency_contact_name: 'Ayesha Usman',
        emergency_contact_mobile: '03441234567'
    },
    {
        full_name: 'Zainab Malik',
        employee_id: 'EMP-004',
        cnic: '12345-2222222-4',
        dob: '1988-03-25',
        gender: 'Female',
        mobile: '03451234567',
        email: 'zainab.malik@school.com',
        current_address: 'House 456, Garden Town, Lahore',
        city: 'Lahore',
        blood_group: 'AB+',
        religion: 'Islam',
        designation: 'Librarian',
        department: 'Support',
        joining_date: '2019-09-15',
        employment_type: 'Permanent',
        basic_salary: '30000',
        bank_name: 'Allied Bank',
        account_number: '22222222222222',
        emergency_contact_name: 'Bilal Malik',
        emergency_contact_mobile: '03561234567'
    },
    {
        full_name: 'Imran Ahmed',
        employee_id: 'EMP-005',
        cnic: '12345-3333333-5',
        dob: '1995-07-18',
        gender: 'Male',
        mobile: '03671234567',
        email: 'imran.ahmed@school.com',
        current_address: 'House 321, Gulberg III, Lahore',
        city: 'Lahore',
        blood_group: 'B-',
        religion: 'Islam',
        designation: 'Peon',
        department: 'Support',
        joining_date: '2022-01-20',
        employment_type: 'Permanent',
        basic_salary: '20000',
        bank_name: 'Meezan Bank',
        account_number: '33333333333333',
        emergency_contact_name: 'Sana Ahmed',
        emergency_contact_mobile: '03781234567'
    }
];

async function addStaff() {
    const token = 'YOUR_TOKEN_HERE'; // Replace with your actual token

    console.log('Adding staff members...');

    for (const staff of staffMembers) {
        try {
            const response = await fetch(`${API_URL}/api/staff/add`, {
                method: 'POST',
                headers: {
                    'Content-Type': 'application/json',
                    'Authorization': `Bearer ${token}`
                },
                body: JSON.stringify(staff)
            });

            if (response.ok) {
                const data = await response.json();
                console.log(`✅ Added: ${staff.full_name} (${staff.designation})`);
            } else {
                console.log(`❌ Failed to add ${staff.full_name}: ${response.statusText}`);
            }
        } catch (error) {
            console.log(`❌ Error adding ${staff.full_name}:`, error.message);
        }
    }

    console.log('\n✨ Done! Refresh the staff page to see the new members.');
}

// Run in browser console after logging in
addStaff();
