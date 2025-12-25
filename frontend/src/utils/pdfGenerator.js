import jsPDF from 'jspdf';
import 'jspdf-autotable';

/**
 * Generate Fee Voucher PDF
 * @param {Object} student - Student details
 * @param {Object} feeData - Fee information
 * @param {Object} schoolInfo - School information
 * @returns {jsPDF} PDF document
 */
export const generateFeeVoucherPDF = (student, feeData, schoolInfo = {}) => {
    const doc = new jsPDF();

    // Header
    doc.setFontSize(20);
    doc.setFont(undefined, 'bold');
    doc.text(schoolInfo.name || 'School Management System', 105, 20, { align: 'center' });

    doc.setFontSize(12);
    doc.setFont(undefined, 'normal');
    doc.text(schoolInfo.address || '', 105, 28, { align: 'center' });
    doc.text(`Phone: ${schoolInfo.phone || 'N/A'}`, 105, 34, { align: 'center' });

    // Title
    doc.setFontSize(16);
    doc.setFont(undefined, 'bold');
    doc.text('FEE VOUCHER', 105, 50, { align: 'center' });

    // Student Information
    doc.setFontSize(11);
    doc.setFont(undefined, 'normal');
    const studentInfoY = 65;

    doc.text(`Student Name: ${student.full_name || student.name}`, 20, studentInfoY);
    doc.text(`Roll No: ${student.roll_no}`, 20, studentInfoY + 7);
    doc.text(`Class: ${student.class_id}-${student.section_id}`, 20, studentInfoY + 14);
    doc.text(`Father Name: ${student.father_name}`, 20, studentInfoY + 21);

    doc.text(`Issue Date: ${new Date().toLocaleDateString()}`, 130, studentInfoY);
    doc.text(`Month: ${feeData.month}`, 130, studentInfoY + 7);
    doc.text(`Due Date: ${feeData.due_date || 'N/A'}`, 130, studentInfoY + 14);

    // Fee Details Table
    const tableData = [
        ['Description', 'Amount (Rs.)'],
        ['Monthly Fee', feeData.gross_amount || feeData.monthly_fee || 0],
        ['Discount', `- ${feeData.discount_amount || 0}`],
        ['Previous Balance', feeData.previous_balance || 0],
        ['Total Payable', feeData.total_amount || feeData.gross_amount || 0]
    ];

    doc.autoTable({
        startY: studentInfoY + 35,
        head: [tableData[0]],
        body: tableData.slice(1),
        theme: 'grid',
        headStyles: { fillColor: [66, 139, 202], textColor: 255, fontStyle: 'bold' },
        styles: { fontSize: 11, cellPadding: 5 },
        columnStyles: {
            0: { cellWidth: 120 },
            1: { halign: 'right', cellWidth: 60 }
        }
    });

    // Payment Instructions
    const finalY = doc.lastAutoTable.finalY + 15;
    doc.setFontSize(10);
    doc.setFont(undefined, 'italic');
    doc.text('Please pay the fee before the due date to avoid late fee charges.', 20, finalY);
    doc.text('For any queries, contact the school office.', 20, finalY + 7);

    // Printed By
    if (feeData.printed_by) {
        doc.setFontSize(9);
        doc.setFont(undefined, 'normal');
        doc.text(`Printed by: ${feeData.printed_by}`, 20, finalY + 20);
        doc.text(`Date: ${new Date().toLocaleString()}`, 20, finalY + 27);
    }

    // Footer
    doc.setFontSize(9);
    doc.text('This is a computer-generated document.', 105, 280, { align: 'center' });

    return doc;
};

/**
 * Generate Result Card PDF
 * @param {Object} student - Student details
 * @param {Object} examResult - Exam result data
 * @param {Object} schoolInfo - School information
 * @returns {jsPDF} PDF document
 */
export const generateResultCardPDF = (student, examResult, schoolInfo = {}) => {
    const doc = new jsPDF();

    // Header
    doc.setFontSize(20);
    doc.setFont(undefined, 'bold');
    doc.text(schoolInfo.name || 'School Management System', 105, 20, { align: 'center' });

    doc.setFontSize(12);
    doc.setFont(undefined, 'normal');
    doc.text(schoolInfo.address || '', 105, 28, { align: 'center' });

    // Title
    doc.setFontSize(16);
    doc.setFont(undefined, 'bold');
    doc.text('RESULT CARD', 105, 45, { align: 'center' });

    // Exam Information
    doc.setFontSize(12);
    doc.text(examResult.exam_title || 'Examination', 105, 55, { align: 'center' });

    // Student Information
    doc.setFontSize(11);
    doc.setFont(undefined, 'normal');
    const studentInfoY = 70;

    doc.text(`Student Name: ${student.full_name || student.name}`, 20, studentInfoY);
    doc.text(`Roll No: ${student.roll_no}`, 20, studentInfoY + 7);
    doc.text(`Class: ${student.class_id}-${student.section_id}`, 20, studentInfoY + 14);
    doc.text(`Father Name: ${student.father_name}`, 20, studentInfoY + 21);

    // Marks Table
    const marksData = examResult.subjects?.map(subject => [
        subject.subject_name || subject.name,
        subject.total_marks || subject.max_marks || 100,
        subject.obtained_marks || 0,
        subject.grade || calculateGrade(subject.obtained_marks, subject.total_marks)
    ]) || [];

    const tableHeaders = ['Subject', 'Total Marks', 'Obtained Marks', 'Grade'];

    doc.autoTable({
        startY: studentInfoY + 30,
        head: [tableHeaders],
        body: marksData,
        foot: [[
            'Total',
            examResult.total_max || marksData.reduce((sum, row) => sum + (row[1] || 0), 0),
            examResult.total_obtained || marksData.reduce((sum, row) => sum + (row[2] || 0), 0),
            ''
        ]],
        theme: 'grid',
        headStyles: { fillColor: [66, 139, 202], textColor: 255, fontStyle: 'bold' },
        footStyles: { fillColor: [240, 240, 240], fontStyle: 'bold' },
        styles: { fontSize: 11, cellPadding: 5 },
        columnStyles: {
            0: { cellWidth: 80 },
            1: { halign: 'center', cellWidth: 40 },
            2: { halign: 'center', cellWidth: 40 },
            3: { halign: 'center', cellWidth: 30 }
        }
    });

    // Result Summary
    const finalY = doc.lastAutoTable.finalY + 15;
    doc.setFontSize(12);
    doc.setFont(undefined, 'bold');

    const percentage = examResult.percentage || 0;
    const grade = examResult.grade || calculateOverallGrade(percentage);
    const status = percentage >= 33 ? 'PASS' : 'FAIL';

    doc.text(`Percentage: ${percentage.toFixed(2)}%`, 20, finalY);
    doc.text(`Grade: ${grade}`, 20, finalY + 10);

    doc.setTextColor(status === 'PASS' ? 0 : 255, status === 'PASS' ? 128 : 0, 0);
    doc.text(`Result: ${status}`, 20, finalY + 20);
    doc.setTextColor(0, 0, 0);

    // Remarks
    if (examResult.remarks) {
        doc.setFontSize(10);
        doc.setFont(undefined, 'italic');
        doc.text(`Remarks: ${examResult.remarks}`, 20, finalY + 35);
    }

    // Signature Section
    doc.setFontSize(10);
    doc.setFont(undefined, 'normal');
    doc.text('_________________', 20, 260);
    doc.text('Class Teacher', 20, 268);

    doc.text('_________________', 90, 260);
    doc.text('Principal', 90, 268);

    doc.text('_________________', 160, 260);
    doc.text('Parent Signature', 160, 268);

    // Footer
    doc.setFontSize(9);
    doc.text('This is a computer-generated document.', 105, 280, { align: 'center' });

    return doc;
};

/**
 * Calculate grade based on marks
 */
const calculateGrade = (obtained, total) => {
    const percentage = (obtained / total) * 100;
    return calculateOverallGrade(percentage);
};

/**
 * Calculate overall grade based on percentage
 */
const calculateOverallGrade = (percentage) => {
    if (percentage >= 90) return 'A+';
    if (percentage >= 80) return 'A';
    if (percentage >= 70) return 'B';
    if (percentage >= 60) return 'C';
    if (percentage >= 50) return 'D';
    if (percentage >= 33) return 'E';
    return 'F';
};

/**
 * Download PDF
 */
export const downloadPDF = (doc, filename) => {
    doc.save(filename);
};

/**
 * Share PDF via WhatsApp
 * Note: WhatsApp Web doesn't support direct PDF sharing via URL
 * This function will download the PDF and provide instructions
 */
export const sharePDFViaWhatsApp = (doc, filename, mobile, message) => {
    // Download the PDF first
    doc.save(filename);

    // Open WhatsApp with message
    if (!mobile) {
        alert("Mobile Number not found!");
        return;
    }

    let num = mobile.replace(/\D/g, '');
    if (num.length === 11 && num.startsWith('0')) {
        num = '92' + num.substring(1);
    }

    const whatsappMessage = `${message}\n\nNote: Please attach the downloaded PDF file (${filename}) manually.`;
    window.open(`https://wa.me/${num}?text=${encodeURIComponent(whatsappMessage)}`, '_blank');

    alert(`PDF downloaded as "${filename}". Please attach it manually in the WhatsApp chat that just opened.`);
};
