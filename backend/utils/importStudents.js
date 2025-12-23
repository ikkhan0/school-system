const csv = require('csv-parser');
const XLSX = require('xlsx');
const fs = require('fs');
const { Readable } = require('stream');

/**
 * Parse CSV or Excel file and return array of student records
 */
const parseFile = async (fileBuffer, mimetype) => {
    try {
        if (mimetype === 'text/csv' || mimetype === 'application/vnd.ms-excel') {
            return await parseCSV(fileBuffer);
        } else if (mimetype === 'application/vnd.openxmlformats-officedocument.spreadsheetml.sheet') {
            return parseExcel(fileBuffer);
        } else {
            throw new Error('Unsupported file format. Please upload CSV or Excel file.');
        }
    } catch (error) {
        throw new Error(`File parsing error: ${error.message}`);
    }
};

/**
 * Parse CSV buffer
 */
const parseCSV = (buffer) => {
    return new Promise((resolve, reject) => {
        const results = [];
        const stream = Readable.from(buffer.toString());

        stream
            .pipe(csv())
            .on('data', (data) => results.push(data))
            .on('end', () => resolve(results))
            .on('error', (error) => reject(error));
    });
};

/**
 * Parse Excel buffer
 */
const parseExcel = (buffer) => {
    try {
        const workbook = XLSX.read(buffer, { type: 'buffer' });
        const sheetName = workbook.SheetNames[0];
        const worksheet = workbook.Sheets[sheetName];
        const data = XLSX.utils.sheet_to_json(worksheet);
        return data;
    } catch (error) {
        throw new Error(`Excel parsing error: ${error.message}`);
    }
};

/**
 * Validate student data
 */
const validateStudentData = (students, existingRollNumbers = []) => {
    const validStudents = [];
    const invalidStudents = [];
    const seenRollNumbers = new Set();

    students.forEach((student, index) => {
        const errors = [];
        const rowNumber = index + 2; // +2 because index starts at 0 and row 1 is header

        // Required fields validation
        if (!student.roll_no || student.roll_no.toString().trim() === '') {
            errors.push('Roll number is required');
        } else {
            const rollNo = student.roll_no.toString().trim();

            // Check for duplicates in file
            if (seenRollNumbers.has(rollNo)) {
                errors.push('Duplicate roll number in file');
            }
            seenRollNumbers.add(rollNo);

            // Check for duplicates in database
            if (existingRollNumbers.includes(rollNo)) {
                errors.push('Roll number already exists in database');
            }
        }

        if (!student.full_name || student.full_name.toString().trim() === '') {
            errors.push('Full name is required');
        }

        if (!student.class_id || student.class_id.toString().trim() === '') {
            errors.push('Class is required');
        }

        if (!student.section_id || student.section_id.toString().trim() === '') {
            errors.push('Section is required');
        }

        if (!student.father_mobile || student.father_mobile.toString().trim() === '') {
            errors.push('Father mobile is required');
        } else {
            // Validate phone number format
            const mobile = student.father_mobile.toString().replace(/\D/g, '');
            if (mobile.length < 10 || mobile.length > 13) {
                errors.push('Invalid father mobile number format');
            }
        }

        // Optional field validations
        if (student.gender && !['Male', 'Female', 'Other'].includes(student.gender)) {
            errors.push('Gender must be Male, Female, or Other');
        }

        if (student.blood_group && !['A+', 'A-', 'B+', 'B-', 'AB+', 'AB-', 'O+', 'O-'].includes(student.blood_group)) {
            errors.push('Invalid blood group');
        }

        if (student.monthly_fee && isNaN(Number(student.monthly_fee))) {
            errors.push('Monthly fee must be a number');
        }

        // Date validations
        if (student.dob && !isValidDate(student.dob)) {
            errors.push('Invalid date of birth format (use YYYY-MM-DD)');
        }

        if (student.admission_date && !isValidDate(student.admission_date)) {
            errors.push('Invalid admission date format (use YYYY-MM-DD)');
        }

        // Normalize phone numbers
        if (student.father_mobile) {
            student.father_mobile = normalizePhoneNumber(student.father_mobile);
        }
        if (student.mother_mobile) {
            student.mother_mobile = normalizePhoneNumber(student.mother_mobile);
        }
        if (student.student_mobile) {
            student.student_mobile = normalizePhoneNumber(student.student_mobile);
        }
        if (student.emergency_contact) {
            student.emergency_contact = normalizePhoneNumber(student.emergency_contact);
        }

        if (errors.length > 0) {
            invalidStudents.push({
                row: rowNumber,
                data: student,
                errors: errors
            });
        } else {
            validStudents.push({
                row: rowNumber,
                data: student
            });
        }
    });

    return {
        valid: validStudents,
        invalid: invalidStudents,
        summary: {
            total: students.length,
            valid: validStudents.length,
            invalid: invalidStudents.length
        }
    };
};

/**
 * Validate date format (YYYY-MM-DD)
 */
const isValidDate = (dateString) => {
    if (!dateString) return false;
    const regex = /^\d{4}-\d{2}-\d{2}$/;
    if (!regex.test(dateString)) return false;
    const date = new Date(dateString);
    return date instanceof Date && !isNaN(date);
};

/**
 * Normalize phone number to standard format
 */
const normalizePhoneNumber = (phone) => {
    if (!phone) return '';
    let cleaned = phone.toString().replace(/\D/g, '');

    // Convert 03001234567 to 923001234567
    if (cleaned.length === 11 && cleaned.startsWith('0')) {
        cleaned = '92' + cleaned.substring(1);
    }

    // Ensure it starts with 92
    if (!cleaned.startsWith('92') && cleaned.length === 10) {
        cleaned = '92' + cleaned;
    }

    return cleaned;
};

/**
 * Generate sample CSV content
 */
const generateSampleCSV = () => {
    const headers = [
        // Required fields
        'roll_no',
        'full_name',
        'class_id',
        'section_id',
        'father_mobile',

        // Optional personal info
        'father_name',
        'mother_name',
        'mother_mobile',
        'dob',
        'gender',
        'blood_group',
        'religion',
        'nationality',

        // Optional contact info
        'student_mobile',
        'emergency_contact',
        'email',
        'current_address',
        'permanent_address',
        'city',
        'postal_code',

        // Optional academic info
        'admission_date',
        'admission_number',
        'previous_school',
        'previous_class',
        'monthly_fee',
        'category',

        // Optional identification
        'student_cnic',
        'father_cnic',
        'mother_cnic',

        // Optional medical info
        'medical_conditions',
        'allergies'
    ];

    const sampleRow = [
        '001',                          // roll_no
        'Ahmed Ali',                    // full_name
        '1',                            // class_id
        'A',                            // section_id
        '03001234567',                  // father_mobile
        'Ali Khan',                     // father_name
        'Fatima Khan',                  // mother_name
        '03009876543',                  // mother_mobile
        '2015-01-15',                   // dob
        'Male',                         // gender
        'O+',                           // blood_group
        'Islam',                        // religion
        'Pakistani',                    // nationality
        '',                             // student_mobile
        '03001111111',                  // emergency_contact
        'ahmed@example.com',            // email
        '123 Main Street, Karachi',     // current_address
        '123 Main Street, Karachi',     // permanent_address
        'Karachi',                      // city
        '75500',                        // postal_code
        '2024-01-01',                   // admission_date
        'ADM-2024-001',                 // admission_number
        'ABC School',                   // previous_school
        'KG',                           // previous_class
        '5000',                         // monthly_fee
        'Regular',                      // category
        '',                             // student_cnic
        '42101-1234567-1',              // father_cnic
        '',                             // mother_cnic
        '',                             // medical_conditions
        ''                              // allergies
    ];

    // Create CSV content
    let csv = headers.join(',') + '\n';
    csv += sampleRow.join(',') + '\n';

    return csv;
};

module.exports = {
    parseFile,
    validateStudentData,
    generateSampleCSV
};
