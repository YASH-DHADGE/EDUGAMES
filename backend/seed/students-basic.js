const bcrypt = require('bcryptjs');
const User = require('../models/User');
const GameResult = require('../models/GameResult');

const studentNames = [
    'Aarav Sharma', 'Diya Patel', 'Arjun Mehta', 'Ananya Singh',
    'Vihaan Gupta', 'Saanvi Kumar', 'Aditya Reddy', 'Isha Verma',
    'Reyansh Joshi', 'Myra Desai', 'Kabir Khan', 'Aanya Nair',
    'Shaurya Iyer', 'Kiara Shah', 'Dhruv Agarwal'
];

const subjects = ['Math', 'Science', 'English', 'Social'];
const games = ['cell_command', 'label_organ', 'chemistry_balance', 'cell_structure', 'force_play', 'digestive_dash'];

const randomInt = (min, max) => Math.floor(Math.random() * (max - min + 1)) + min;
const randomElement = (arr) => arr[randomInt(0, arr.length - 1)];

const generateEmail = (name, role) => {
    const cleanName = name.toLowerCase().replace(/[^a-z\s]/g, '').replace(/\s+/g, '');
    return `${cleanName}@${role === 'teacher' ? 'school.edu' : 'student.edu'}`;
};

const seedBasicStudents = async () => {
    try {
        console.log('👨‍🎓 Seeding Basic Students...');

        // Clear ONLY students and game results, keep existing teachers
        await User.deleteMany({ role: 'student', email: { $not: /^demo\.student/ } }); // Don't delete demo students here if we want to run both safely, but logic says we clear students in original file. The original file cleared ALL students. Let's stick to original behavior but maybe separate them? 
        // Original: await User.deleteMany({ role: 'student' });
        // The implementation plan says "Basic Students" logic from seed.js.
        // To avoid conflict with the Demo Students script (which might clear specific demo ones), let's just clear non-demo students here or ensure they don't overlap. 
        // However, the original seed.js killed ALL students. 
        // Let's modify this to be smarter: delete only students that are NOT demo students to allow modularity, or just delete all if that's the intention of a full reset.
        // For now, let's delete generic students to keep it clean.

        // Actually, let's replicate the original behavior of "Resetting" students if this moves to a "Reset & Seed" flow. 
        // But since we are combining, the "Master" script might want to clear everything once at the start.
        // Let's assume the Master script or this script clears what it produces.
        // I will clear ALL students here to match original "seed.js" behavior, BUT "seed_demo_students.js" also clears its own.
        // If I run them sequentially, the second one might clear the first one's work if not careful.
        // "seed_demo_students.js" clears `email: { $regex: /^demo\.student/ }`.
        // "seed.js" cleared `role: 'student'`.
        // If I run Basic then Demo:
        // Basic clears ALL students. Creates Basic.
        // Demo clears Demo students. Creates Demo. -> This works! Basic students remain.

        await User.deleteMany({ role: 'student', email: { $not: /demo\.student/ } });
        // I'll scope it to remove only 'basic' students (which don't have a specific pattern but usually don't look like demo ones). 
        // OR better: The original seed.js was a "World Reset". 
        // Let's rely on the user to understand that "Basic Students" = "Standard Class".

        // REVISION: strict adherence to "seed.js":
        // It deleted `role: 'student'`. That wipes demo students too.
        // If I want to preserve Demo students if they exist, I should filter.
        // But since this is a combined script, let's clear generic ones here.

        console.log('      🗑️  Cleared non-demo students...');
        await GameResult.deleteMany({ userId: { $in: await User.find({ role: 'student', email: { $not: /demo\.student/ } }).select('_id') } }); // Clean up results for these students? 
        // Actually original file: await GameResult.deleteMany({}); // Clears ALL results.
        // I should probably move the "Global Reset" logic to the main index.js or handle it here.
        // Let's just clear GameResults for the students we are about to delete/recreate to be safe.
        // But original `seed.js` did `GameResult.deleteMany({})`. 

        // Strategy: 
        // `students-basic.js` will manage the "Standard" 15 students.

        const existingTeachers = await User.find({ role: 'teacher', status: 'active' });
        if (existingTeachers.length === 0) {
            console.log('      ⚠️ No teachers found! Skipping basic student creation.');
            return;
        }

        const hashedPassword = await bcrypt.hash('password123', 10);
        const students = [];

        for (let i = 0; i < studentNames.length; i++) {
            const classNumber = randomInt(6, 10);
            const learnerCategory = randomElement(['fast', 'slow', 'neutral', 'neutral']);
            const teacherIndex = i % existingTeachers.length;
            const assignedTeacher = existingTeachers[teacherIndex];

            // Check if user exists to avoid duplicate key error if we didn't clear well
            const email = generateEmail(studentNames[i], 'student');
            const exists = await User.findOne({ email });
            if (exists) {
                await User.deleteOne({ _id: exists._id });
            }

            const student = await User.create({
                name: studentNames[i],
                email: email,
                password: hashedPassword,
                role: 'student',
                status: 'active',
                selectedClass: classNumber,
                teacherId: assignedTeacher._id,
                learnerCategory: learnerCategory,
                xp: randomInt(100, 5000),
                streak: randomInt(0, 50),
            });

            students.push(student);

            // Create game results
            const numGames = randomInt(3, 6);
            for (let j = 0; j < numGames; j++) {
                const game = randomElement(games);
                const score = randomInt(40, 100);
                const timeTaken = randomInt(30, 300);
                const difficulty = randomElement(['easy', 'medium', 'hard']);

                let delta = 0;
                if (score >= 80 && timeTaken < 120) delta = randomInt(15, 25);
                else if (score >= 60 && timeTaken < 180) delta = randomInt(5, 15);
                else if (score >= 40) delta = randomInt(-5, 5);
                else delta = randomInt(-15, -5);

                let proficiency;
                if (score >= 90) proficiency = 'Expert';
                else if (score >= 75) proficiency = 'Advanced';
                else if (score >= 60) proficiency = 'Intermediate';
                else proficiency = 'Beginner';

                await GameResult.create({
                    userId: student._id,
                    gameType: game,
                    score: score,
                    maxScore: 100,
                    xpEarned: Math.floor(score * 1.5),
                    timeTaken: timeTaken,
                    difficulty: difficulty,
                    subject: randomElement(subjects),
                    classLevel: String(classNumber),
                    delta: delta,
                    proficiency: proficiency,
                    accuracy: score,
                    completedLevel: randomInt(1, 5),
                    attempts: randomInt(1, 3),
                    mistakes: randomInt(0, 10),
                });
            }
        }
        console.log(`      ✓ Created ${students.length} basic students`);
    } catch (error) {
        console.error('      ❌ Error seeding basic students:', error.message);
        throw error;
    }
};

module.exports = seedBasicStudents;
