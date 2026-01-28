const axios = require('axios');

const BASE_URL = 'http://localhost:5000/api';

async function testFullFlow() {
    try {
        console.log('\n🧪 TESTING FULL LOGIN → FETCH STUDENTS FLOW\n');

        // 1. Login as Sarvesh
        console.log('1️⃣ Logging in as sarvesh@gmail.com...');
        const loginResponse = await axios.post(`${BASE_URL}/auth/login`, {
            email: 'sarvesh@gmail.com',
            password: 'password123'
        });

        if (loginResponse.status === 200) {
            console.log('✅ Login successful!');
            console.log(`   Token: ${loginResponse.data.token.substring(0, 20)}...`);
            console.log(`   Name: ${loginResponse.data.name}`);
            console.log(`   Role: ${loginResponse.data.role}`);
            console.log(`   ID: ${loginResponse.data._id}`);
            console.log('');
        }

        const token = loginResponse.data.token;
        const teacherId = loginResponse.data._id;

        // 2. Fetch students
        console.log('2️⃣ Fetching students with token...');
        const studentsResponse = await axios.get(`${BASE_URL}/teacher/students`, {
            headers: {
                'Authorization': `Bearer ${token}`
            }
        });

        console.log(`✅ Students API Response:`);
        console.log(`   Status: ${studentsResponse.status}`);
        console.log(`   Student Count: ${studentsResponse.data.length}`);
        console.log('');

        if (studentsResponse.data.length > 0) {
            console.log('📋 Students List:');
            studentsResponse.data.forEach((student, idx) => {
                console.log(`\n   ${idx + 1}. ${student.name}`);
                console.log(`      Email: ${student.email}`);
                console.log(`      Class: ${student.selectedClass || 'N/A'}`);
                console.log(`      Status: ${student.status}`);
                console.log(`      Learner: ${student.learnerCategory || 'N/A'}`);
                console.log(`      XP: ${student.xp || 0}`);
            });
        } else {
            console.log('❌ NO STUDENTS RETURNED!');
        }

        console.log('\n✅ TEST COMPLETE!\n');
        process.exit(0);

    } catch (error) {
        console.error('\n❌ ERROR:', error.response?.data || error.message);
        console.error('Status:', error.response?.status);
        process.exit(1);
    }
}

testFullFlow();
