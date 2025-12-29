-- Refined Schema based on User Requirements

CREATE DATABASE IF NOT EXISTS school_db;
USE school_db;

-- 1. Families Table (Grouping Siblings)
CREATE TABLE IF NOT EXISTS families (
    family_id INT AUTO_INCREMENT PRIMARY KEY,
    father_name VARCHAR(255) NOT NULL,
    father_cnic VARCHAR(20),
    father_mobile VARCHAR(20), -- WhatsApp Number
    created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP
);

-- 2. Students Table (Linked to Family)
CREATE TABLE IF NOT EXISTS students (
    student_id INT AUTO_INCREMENT PRIMARY KEY,
    family_id INT NOT NULL,
    roll_no VARCHAR(50) UNIQUE NOT NULL,
    full_name VARCHAR(255) NOT NULL,
    class_id VARCHAR(50),
    section_id VARCHAR(50),
    discount_category VARCHAR(50), -- e.g., "Sibling", "Staff Child"
    is_active BOOLEAN DEFAULT TRUE,
    created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
    FOREIGN KEY (family_id) REFERENCES families(family_id) ON DELETE CASCADE
);

-- 3. Daily Evaluations (Attendance + Behavior Violations)
CREATE TABLE IF NOT EXISTS daily_evaluations (
    id INT AUTO_INCREMENT PRIMARY KEY,
    student_id INT NOT NULL,
    date DATE NOT NULL,
    
    -- Attendance
    attendance_status ENUM('Present', 'Absent', 'Leave', 'Late') DEFAULT 'Present',
    
    -- Behavior Violations (Default 0 = No Violation/Good)
    uniform_violation BOOLEAN DEFAULT FALSE,
    shoes_violation BOOLEAN DEFAULT FALSE,
    hygiene_violation BOOLEAN DEFAULT FALSE,
    late_arrival BOOLEAN DEFAULT FALSE,
    homework_incomplete BOOLEAN DEFAULT FALSE,
    books_missing BOOLEAN DEFAULT FALSE,
    
    teacher_remarks TEXT,
    created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
    UNIQUE KEY unique_daily_eval (student_id, date),
    FOREIGN KEY (student_id) REFERENCES students(student_id) ON DELETE CASCADE
);

-- 4. Fees Table
CREATE TABLE IF NOT EXISTS fees (
    id INT AUTO_INCREMENT PRIMARY KEY,
    student_id INT NOT NULL,
    month VARCHAR(20) NOT NULL, -- e.g., "Jan-2025"
    
    tuition_fee DECIMAL(10, 2) NOT NULL,
    concession DECIMAL(10, 2) DEFAULT 0.00,
    arrears DECIMAL(10, 2) DEFAULT 0.00,
    
    -- Calculated in App: Total = (Tuition - Concession) + Arrears
    
    is_paid BOOLEAN DEFAULT FALSE,
    payment_date DATE,
    created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
    FOREIGN KEY (student_id) REFERENCES students(student_id) ON DELETE CASCADE
);
