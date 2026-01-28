const fs = require('fs');
const path = require('path');
const Class = require('../models/Class');
const Subject = require('../models/Subject');
const Chapter = require('../models/Chapter');
const Subchapter = require('../models/Subchapter');

const seedContentFromFile = async (filePath) => {
    try {
        const fileName = path.basename(filePath);
        // console.log(`   📄 Processing ${fileName}...`);
        const fileContent = fs.readFileSync(filePath, 'utf8');
        const data = JSON.parse(fileContent);

        // Find or create Class
        let classDoc = await Class.findOne({ classNumber: data.class });
        if (!classDoc) {
            classDoc = await Class.create({ classNumber: data.class });
            console.log(`      ✓ Created Class ${data.class}`);
        }

        // Find or create Subject
        let subjectDoc = await Subject.findOne({ name: data.subject, classId: classDoc._id });
        if (!subjectDoc) {
            subjectDoc = await Subject.create({
                name: data.subject,
                classId: classDoc._id,
                description: `${data.subject} for Class ${data.class}`
            });
            console.log(`      ✓ Created Subject: ${data.subject}`);
        }

        // Process chapters
        for (let i = 0; i < data.chapters.length; i++) {
            const chapterData = data.chapters[i];

            let chapterDoc = await Chapter.findOne({ name: chapterData.name, subjectId: subjectDoc._id });
            if (!chapterDoc) {
                chapterDoc = await Chapter.create({
                    name: chapterData.name,
                    subjectId: subjectDoc._id,
                    description: `Chapter on ${chapterData.name}`,
                    index: i + 1
                });
            }

            // Process subchapters
            if (chapterData.subchapters && chapterData.subchapters.length > 0) {
                for (let j = 0; j < chapterData.subchapters.length; j++) {
                    const subchapterData = chapterData.subchapters[j];

                    let subchapterDoc = await Subchapter.findOne({ name: subchapterData.name, chapterId: chapterDoc._id });

                    const questions = [];
                    if (subchapterData.quiz && subchapterData.quiz.mcq) {
                        subchapterData.quiz.mcq.forEach(mcq => {
                            questions.push({
                                question: mcq.q,
                                options: mcq.options,
                                correctAnswer: mcq.answer,
                                type: 'mcq',
                                explanation: ''
                            });
                        });
                    }

                    if (subchapterDoc) {
                        subchapterDoc.lessonContent = subchapterData.content.explanation || '';
                        subchapterDoc.index = j + 1;
                        if (questions.length > 0) subchapterDoc.questions = questions;
                        await subchapterDoc.save();
                    } else {
                        await Subchapter.create({
                            name: subchapterData.name,
                            chapterId: chapterDoc._id,
                            lessonContent: subchapterData.content.explanation || '',
                            index: j + 1,
                            questions: questions,
                            visuals: []
                        });
                    }
                }
            }
        }
    } catch (error) {
        console.error(`   ❌ Error processing ${path.basename(filePath)}:`, error.message);
        throw error;
    }
};

const seedContent = async () => {
    console.log('📚 Seeding Educational Content...');
    const dataDir = path.join(__dirname, '../data');

    if (!fs.existsSync(dataDir)) {
        console.log('   ⚠️ Data directory not found, skipping content seeding.');
        return;
    }

    const files = fs.readdirSync(dataDir).filter(file => file.endsWith('-content.json'));
    console.log(`   Found ${files.length} content files.`);

    for (const file of files) {
        await seedContentFromFile(path.join(dataDir, file));
    }
    console.log('   ✓ Content seeded successfully');
};

module.exports = seedContent;
