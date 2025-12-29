/**
 * WhatsApp Message Generator for Family Fee Reminders
 * Generates consolidated fee messages for families with multiple children
 */

/**
 * Generate family fee reminder message
 * @param {Object} family - Family document
 * @param {Array} studentsWithFees - Array of {student, fee} objects
 * @param {Object} school - School document
 * @returns {String} - Formatted WhatsApp message
 */
function generateFamilyFeeMessage(family, studentsWithFees, school) {
    try {
        const familyHead = family.effective_family_head || family.father_name || 'Parent';

        let message = `Assalam-o-Alaikum (Dear Parent),\n\n`;
        message += `Fee Reminder for ${familyHead.toUpperCase()}\n`;
        message += `${'-'.repeat(40)}\n\n`;

        let totalDue = 0;
        let totalPaid = 0;
        let totalBalance = 0;

        // Add each student's fee breakdown
        studentsWithFees.forEach((item, index) => {
            const student = item.student;
            const fee = item.fee;

            // Student header
            message += `${student.full_name} (${student.class_id}-${student.section_id})\n`;

            // Fee breakdown
            const tuitionFee = fee.tuition_fee || 0;
            const acadTrans = fee.other_charges || 0;
            const arrears = fee.arrears || 0;
            const extraFine = fee.extra_fine || 0;

            message += `Tuition Fee: ${formatCurrency(tuitionFee)}\n`;

            if (acadTrans > 0) {
                message += `Acad/Trans: ${formatCurrency(acadTrans)}\n`;
            }

            if (arrears > 0) {
                message += `Old Arrears: ${formatCurrency(arrears)}\n`;
            }

            if (extraFine > 0) {
                message += `Extra/Fine: ${formatCurrency(extraFine)}\n`;
            }

            // Discount if applicable
            const discount = fee.discount_applied?.total_discount || 0;
            if (discount > 0) {
                message += `Discount: -${formatCurrency(discount)}\n`;
            }

            const studentTotal = fee.gross_amount || (tuitionFee + acadTrans + arrears + extraFine - discount);
            const studentPaid = fee.paid_amount || 0;
            const studentBalance = fee.balance || (studentTotal - studentPaid);

            message += `${'-'.repeat(40)}\n`;
            message += `Subtotal: ${formatCurrency(studentTotal)}\n`;

            if (studentPaid > 0) {
                message += `Paid: ${formatCurrency(studentPaid)}\n`;
            }

            message += `\n`;

            totalDue += studentTotal;
            totalPaid += studentPaid;
            totalBalance += studentBalance;
        });

        // Total summary
        message += `${'='.repeat(40)}\n`;
        message += `Total Due: ${formatCurrency(totalDue)}\n`;

        if (totalPaid > 0) {
            message += `Paid Amount: -${formatCurrency(totalPaid)}\n`;
        }

        message += `Remaining Balance: ${formatCurrency(totalBalance)}\n`;
        message += `${'='.repeat(40)}\n\n`;

        // Closing
        message += `Please clear the dues as soon as possible.\n\n`;
        message += `Regards,\n`;
        message += `${school.school_name || 'School'}`;

        if (school.phone) {
            message += ` (${school.phone})`;
        }

        return message;

    } catch (error) {
        console.error('Error generating family fee message:', error);
        return null;
    }
}

/**
 * Generate single student fee reminder message
 * @param {Object} student - Student document
 * @param {Object} fee - Fee document
 * @param {Object} school - School document
 * @returns {String} - Formatted WhatsApp message
 */
function generateSingleStudentFeeMessage(student, fee, school) {
    try {
        const parentName = student.father_name || 'Parent';

        let message = `Assalam-o-Alaikum (Dear Parent),\n\n`;
        message += `Fee Reminder for ${parentName.toUpperCase()}\n`;
        message += `${'-'.repeat(40)}\n\n`;

        // Student info
        message += `${student.full_name} (${student.class_id}-${student.section_id})\n`;

        // Fee breakdown
        const tuitionFee = fee.tuition_fee || 0;
        const acadTrans = fee.other_charges || 0;
        const arrears = fee.arrears || 0;
        const extraFine = fee.extra_fine || 0;

        message += `Tuition Fee: ${formatCurrency(tuitionFee)}\n`;

        if (acadTrans > 0) {
            message += `Acad/Trans: ${formatCurrency(acadTrans)}\n`;
        }

        if (arrears > 0) {
            message += `Old Arrears: ${formatCurrency(arrears)}\n`;
        }

        if (extraFine > 0) {
            message += `Extra/Fine: ${formatCurrency(extraFine)}\n`;
        }

        // Discount if applicable
        const discount = fee.discount_applied?.total_discount || 0;
        if (discount > 0) {
            message += `Discount: -${formatCurrency(discount)}\n`;
        }

        message += `${'-'.repeat(40)}\n`;

        const totalDue = fee.gross_amount || (tuitionFee + acadTrans + arrears + extraFine - discount);
        const paidAmount = fee.paid_amount || 0;
        const balance = fee.balance || (totalDue - paidAmount);

        message += `Total Due: ${formatCurrency(totalDue)}\n`;

        if (paidAmount > 0) {
            message += `Paid Amount: -${formatCurrency(paidAmount)}\n`;
        }

        message += `Remaining Balance: ${formatCurrency(balance)}\n`;
        message += `${'-'.repeat(40)}\n\n`;

        // Closing
        message += `Please clear the dues as soon as possible.\n\n`;
        message += `Regards,\n`;
        message += `${school.school_name || 'School'}`;

        if (school.phone) {
            message += ` (${school.phone})`;
        }

        return message;

    } catch (error) {
        console.error('Error generating student fee message:', error);
        return null;
    }
}

/**
 * Generate WhatsApp deep link
 * @param {String} phoneNumber - Phone number (with or without country code)
 * @param {String} message - Pre-filled message
 * @returns {String} - WhatsApp deep link URL
 */
function generateWhatsAppLink(phoneNumber, message) {
    try {
        // Clean phone number (remove spaces, dashes, etc.)
        let cleanNumber = phoneNumber.replace(/[\s\-\(\)]/g, '');

        // Add country code if not present (assuming Pakistan +92)
        if (!cleanNumber.startsWith('+') && !cleanNumber.startsWith('92')) {
            // Remove leading 0 if present
            if (cleanNumber.startsWith('0')) {
                cleanNumber = cleanNumber.substring(1);
            }
            cleanNumber = '92' + cleanNumber;
        } else if (cleanNumber.startsWith('+')) {
            cleanNumber = cleanNumber.substring(1);
        }

        // URL encode the message
        const encodedMessage = encodeURIComponent(message);

        // Generate WhatsApp link
        const whatsappLink = `https://wa.me/${cleanNumber}?text=${encodedMessage}`;

        return whatsappLink;

    } catch (error) {
        console.error('Error generating WhatsApp link:', error);
        return null;
    }
}

/**
 * Format currency in PKR
 * @param {Number} amount - Amount to format
 * @returns {String} - Formatted currency string
 */
function formatCurrency(amount) {
    if (!amount || isNaN(amount)) return '0';
    return Math.round(amount).toString();
}

/**
 * Generate bulk WhatsApp messages for multiple families
 * @param {Array} familiesData - Array of {family, students, fees} objects
 * @param {Object} school - School document
 * @returns {Array} - Array of {family, message, whatsappLink} objects
 */
function generateBulkMessages(familiesData, school) {
    try {
        const results = familiesData.map(familyData => {
            const message = generateFamilyFeeMessage(
                familyData.family,
                familyData.studentsWithFees,
                school
            );

            const whatsappNumber = familyData.family.effective_whatsapp ||
                familyData.family.whatsapp_number ||
                familyData.family.father_mobile;

            const whatsappLink = message ? generateWhatsAppLink(whatsappNumber, message) : null;

            return {
                family_id: familyData.family._id,
                family_name: familyData.family.father_name,
                whatsapp_number: whatsappNumber,
                message: message,
                whatsapp_link: whatsappLink,
                student_count: familyData.studentsWithFees.length,
                total_balance: familyData.studentsWithFees.reduce((sum, item) =>
                    sum + (item.fee.balance || 0), 0
                )
            };
        });

        return results;

    } catch (error) {
        console.error('Error generating bulk messages:', error);
        return [];
    }
}

/**
 * Generate attendance message
 * @param {Object} student - Student document
 * @param {Object} attendanceData - Attendance data
 * @param {Object} school - School document
 * @returns {String} - Formatted WhatsApp message
 */
function generateAttendanceMessage(student, attendanceData, school) {
    try {
        const parentName = student.father_name || 'Parent';

        let message = `Assalam-o-Alaikum (Dear Parent),\n\n`;
        message += `Attendance Report for ${student.full_name}\n`;
        message += `Class: ${student.class_id}-${student.section_id}\n`;
        message += `${'-'.repeat(40)}\n\n`;

        message += `Total Days: ${attendanceData.total_days || 0}\n`;
        message += `Present: ${attendanceData.present_days || 0}\n`;
        message += `Absent: ${attendanceData.absent_days || 0}\n`;
        message += `Leave: ${attendanceData.leave_days || 0}\n`;
        message += `Attendance %: ${attendanceData.percentage || 0}%\n\n`;

        message += `Regards,\n`;
        message += `${school.school_name || 'School'}`;

        if (school.phone) {
            message += ` (${school.phone})`;
        }

        return message;

    } catch (error) {
        console.error('Error generating attendance message:', error);
        return null;
    }
}

module.exports = {
    generateFamilyFeeMessage,
    generateSingleStudentFeeMessage,
    generateWhatsAppLink,
    formatCurrency,
    generateBulkMessages,
    generateAttendanceMessage
};
