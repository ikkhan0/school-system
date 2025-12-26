const mongoose = require('mongoose');
const Fee = require('./models/Fee');
const Student = require('./models/Student');
require('dotenv').config();

const normalizeMonth = (m) => {
    if (!m) return m;
    let s = m.trim();
    // specific fix for "dec" -> "Dec-2025" (assuming current session/year context)
    // simplistic approach for this specific case
    if (s.toLowerCase() === 'dec') return 'Dec-2025';
    if (s === 'Dec 2025') return 'Dec-2025';
    return s.replace(/\s+/g, '-');
};

const run = async () => {
    try {
        await mongoose.connect(process.env.MONGO_URI);
        console.log("Connected to DB");

        const s = await Student.findOne({ roll_no: '2025-STAFF001' });
        if (!s) {
            console.log('Student not found');
            return;
        }
        console.log('Processing Student:', s.full_name);

        const fees = await Fee.find({ student_id: s._id }).sort({ createdAt: 1 });

        let groups = {};

        fees.forEach(f => {
            const norm = normalizeMonth(f.month);
            if (!groups[norm]) groups[norm] = [];
            groups[norm].push(f);
        });

        for (const [month, records] of Object.entries(groups)) {
            if (records.length > 1) {
                console.log(`\nFound duplicate group for month: ${month}`);

                // Keep the one with the most useful info (prioritize standard name, then payments)
                // 1. Prioritize "Dec-2025" exact match if in records
                // 2. Prioritize Paid
                // 3. Prioritize highest amount (maybe?)

                records.sort((a, b) => {
                    const aScore = (a.status === 'Paid' ? 10 : 0) + (a.month === month ? 5 : 0) + (a.paid_amount > 0 ? 2 : 0);
                    const bScore = (b.status === 'Paid' ? 10 : 0) + (b.month === month ? 5 : 0) + (b.paid_amount > 0 ? 2 : 0);
                    return bScore - aScore;
                });

                const toKeep = records[0];
                const toDelete = records.slice(1);

                console.log(`Keeping: ID=${toKeep._id} Month="${toKeep.month}" Amount=${toKeep.gross_amount} Paid=${toKeep.paid_amount}`);

                for (const d of toDelete) {
                    console.log(`Deleting: ID=${d._id} Month="${d.month}" Amount=${d.gross_amount} Paid=${d.paid_amount} Type=${d.fee_type}`);
                    // Merge payments if any
                    if (d.paid_amount > 0) {
                        console.log(`  -> Merging paid amount ${d.paid_amount} into kept record`);
                        toKeep.paid_amount += d.paid_amount;
                        // Also merge funds if necessary?
                        // This uses a different logic for funds
                    }
                    if (d.fee_type === 'Fund' && toKeep.fee_type !== 'Fund') {
                        // Merge fund amount into other_charges?
                        console.log(`  -> Merging Fund ${d.gross_amount} into other_charges`);
                        toKeep.other_charges = (toKeep.other_charges || 0) + d.gross_amount;
                        toKeep.gross_amount += d.gross_amount;
                        toKeep.balance += d.gross_amount;
                    }

                    await Fee.deleteOne({ _id: d._id });
                }

                // Update kept record status
                toKeep.balance = toKeep.final_amount - toKeep.paid_amount; // simplified
                if (toKeep.balance <= 0) toKeep.status = 'Paid';
                else if (toKeep.paid_amount > 0) toKeep.status = 'Partial';
                else toKeep.status = 'Pending';

                await toKeep.save();
                console.log("Updates saved.");
            }
        }

        console.log("\nCleanup Complete");

    } catch (e) {
        console.error(e);
    } finally {
        await mongoose.disconnect();
    }
};

run();
