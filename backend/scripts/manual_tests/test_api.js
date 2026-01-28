const http = require('http');

function makeRequest(options, data = null) {
    return new Promise((resolve, reject) => {
        const req = http.request(options, (res) => {
            let body = '';
            res.on('data', chunk => body += chunk);
            res.on('end', () => {
                try {
                    resolve({
                        status: res.statusCode,
                        data: JSON.parse(body)
                    });
                } catch (e) {
                    resolve({ status: res.statusCode, data: body });
                }
            });
        });

        req.on('error', reject);
        if (data) req.write(JSON.stringify(data));
        req.end();
    });
}

async function testFlow() {
    try {
        console.log('\n🧪 TESTING LOGIN → FETCH STUDENTS\n');

        // Login
        console.log('1️⃣ Login...');
        const loginResp = await makeRequest({
            hostname: 'localhost',
            port: 5000,
            path: '/api/auth/login',
            method: 'POST',
            headers: { 'Content-Type': 'application/json' }
        }, {
            email: 'sarvesh@gmail.com',
            password: 'password123'
        });

        if (loginResp.status !== 200) {
            console.log('❌ Login failed:', loginResp.status);
            console.log('Response:', loginResp.data);
            process.exit(1);
        }

        console.log('✅ Login OK');
        console.log(`   Name: ${loginResp.data.name}`);
        console.log(`   Role: ${loginResp.data.role}\n`);

        const token = loginResp.data.token;

        // Fetch students
        console.log('2️⃣ Fetch students...');
        const studentsResp = await makeRequest({
            hostname: 'localhost',
            port: 5000,
            path: '/api/teacher/students',
            method: 'GET',
            headers: { 'Authorization': `Bearer ${token}` }
        });

        console.log(`✅ Students API: ${studentsResp.status}`);
        console.log(`   Count: ${studentsResp.data.length}\n`);

        if (studentsResp.data.length > 0) {
            studentsResp.data.forEach((s, i) => {
                console.log(`   ${i + 1}. ${s.name} (${s.email})`);
                console.log(`      Class: ${s.selectedClass}, Status: ${s.status}`);
            });
        } else {
            console.log('❌ NO STUDENTS!');
        }

        console.log('\n✅ DONE\n');
        process.exit(0);
    } catch (error) {
        console.error('❌ Error:', error.message);
        process.exit(1);
    }
}

testFlow();
