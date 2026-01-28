const Lesson = require('../models/Lesson');
const Quiz = require('../models/Quiz');
const Anatomy = require('../models/Anatomy');

const seedLessons = async () => {
    await Lesson.deleteMany({});
    const lessons = [
        {
            title: 'Introduction to Hygiene',
            description: 'Learn the basics of personal hygiene.',
            content: '# Hygiene Basics\n\nHygiene is essential for health...',
            subject: 'Hygiene',
            difficulty: 'easy',
            duration: 10
        },
        {
            title: 'Basic Finance',
            description: 'Understanding money and savings.',
            content: '# Saving Money\n\nSaving money helps you prepare for the future...',
            subject: 'Finance',
            difficulty: 'medium',
            duration: 15
        }
    ];
    await Lesson.insertMany(lessons);
    console.log('      ✓ Lessons seeded');
};

const seedQuizzes = async () => {
    await Quiz.deleteMany({});
    const quizzes = [
        {
            question: 'What is the best way to prevent germs?',
            options: ['Washing hands', 'Touching face', 'Sharing towels', 'None of the above'],
            correctIndex: 0,
            subject: 'Hygiene',
            difficulty: 'easy'
        },
        {
            question: 'What is a budget?',
            options: ['A type of car', 'A plan for spending money', 'A bank account', 'A loan'],
            correctIndex: 1,
            subject: 'Finance',
            difficulty: 'easy'
        }
    ];
    await Quiz.insertMany(quizzes);
    console.log('      ✓ Quizzes seeded');
};

const seedAnatomy = async () => {
    await Anatomy.deleteMany({});
    const anatomy = [
        {
            name: 'Human Heart',
            image: 'https://example.com/heart.png',
            description: 'The heart pumps blood throughout the body.',
            subParts: [
                { name: 'Left Atrium', description: 'Receives oxygenated blood.' },
                { name: 'Right Atrium', description: 'Receives deoxygenated blood.' }
            ]
        }
    ];
    await Anatomy.insertMany(anatomy);
    console.log('      ✓ Anatomy seeded');
};

const seedStatic = async () => {
    console.log('🗿 Seeding Static Data...');
    try {
        await seedLessons();
        await seedQuizzes();
        await seedAnatomy();
    } catch (error) {
        console.error('   ❌ Error seeding static data:', error.message);
        throw error;
    }
};

module.exports = seedStatic;
