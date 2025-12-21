CREATE DATABASE IF NOT EXISTS school_db;
USE school_db;

-- Families Table
CREATE TABLE IF NOT EXISTS families (
    id INT AUTO_INCREMENT PRIMARY KEY,
    father_name VARCHAR(255) NOT NULL,
    father_cnic VARCHAR(20),
    father_mobile VARCHAR(20),
    address TEXT,
    created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP
);

-- Students Table
CREATE TABLE IF NOT EXISTS students (
    id INT AUTO_INCREMENT PRIMARY KEY,
    family_id INT,
    admission_number VARCHAR(50) UNIQUE NOT NULL,
    full_name VARCHAR(255) NOT NULL,
    dob DATE,
    gender ENUM('Male', 'Female', 'Other'),
    class_grade VARCHAR(50),
    section VARCHAR(50),
    is_active BOOLEAN DEFAULT TRUE,
    created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
    FOREIGN KEY (family_id) REFERENCES families(id) ON DELETE SET NULL
);

-- Fees Table
CREATE TABLE IF NOT EXISTS fees (
    id INT AUTO_INCREMENT PRIMARY KEY,
    student_id INT NOT NULL,
    due_date DATE,
    amount DECIMAL(10, 2) NOT NULL,
    paid_amount DECIMAL(10, 2) DEFAULT 0.00,
    type VARCHAR(50), -- Tuition, Exam, Lab, Transport
    status ENUM('Pending', 'Paid', 'Partial') DEFAULT 'Pending',
    created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
    updated_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP ON UPDATE CURRENT_TIMESTAMP,
    FOREIGN KEY (student_id) REFERENCES students(id) ON DELETE CASCADE
);

-- Daily Evaluations Table
CREATE TABLE IF NOT EXISTS daily_evaluations (
    id INT AUTO_INCREMENT PRIMARY KEY,
    student_id INT NOT NULL,
    evaluation_date DATE NOT NULL,
    attendance_status ENUM('Present', 'Absent', 'Leave', 'Late') DEFAULT 'Present',
    is_late BOOLEAN DEFAULT FALSE,
    uniform_check BOOLEAN DEFAULT TRUE, -- True = OK
    shoes_check BOOLEAN DEFAULT TRUE,   -- True = OK
    hygiene_check BOOLEAN DEFAULT TRUE, -- True = OK
    remarks TEXT,
    created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
    UNIQUE KEY unique_eval (student_id, evaluation_date),
    FOREIGN KEY (student_id) REFERENCES students(id) ON DELETE CASCADE
);

-- Exams Table
CREATE TABLE IF NOT EXISTS exams (
    id INT AUTO_INCREMENT PRIMARY KEY,
    title VARCHAR(255) NOT NULL,
    start_date DATE,
    end_date DATE,
    created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP
);

-- Exam Results Table
CREATE TABLE IF NOT EXISTS exam_results (
    id INT AUTO_INCREMENT PRIMARY KEY,
    exam_id INT NOT NULL,
    student_id INT NOT NULL,
    subject VARCHAR(100) NOT NULL,
    marks_obtained DECIMAL(5, 2),
    total_marks DECIMAL(5, 2),
    created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
    FOREIGN KEY (exam_id) REFERENCES exams(id) ON DELETE CASCADE,
    FOREIGN KEY (student_id) REFERENCES students(id) ON DELETE CASCADE
);
