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

async function testAI() {
    try {
        console.log('\n🤖 TESTING AI CHATBOT API\n');

        // 1. Login
        console.log('1️⃣ Logging in as Divyesh...');
        const loginResp = await makeRequest({
            hostname: 'localhost',
            port: 5000,
            path: '/api/auth/login',
            method: 'POST',
            headers: { 'Content-Type': 'application/json' }
        }, {
            email: 'chatbot_tester@test.com',
            password: 'password123'
        });

        if (loginResp.status !== 200) {
            console.log('❌ Login failed:', loginResp.status);
            console.log('Response:', loginResp.data);
            process.exit(1);
        }

        const token = loginResp.data.token;
        console.log('✅ Login successful. Token received.\n');

        // 2. Test Chat API
        console.log('2️⃣ Sending "What is photosynthesis?" to AI (Online Mode)...');

        // Mocking context that frontend would send
        const mockContext = [
            { type: 'science', title: 'Photosynthesis', text: 'Plants use sunlight to make food.' }
        ];

        const chatResp = await makeRequest({
            hostname: 'localhost',
            port: 5000,
            path: '/api/ai/chat',
            method: 'POST',
            headers: {
                'Content-Type': 'application/json',
                'Authorization': `Bearer ${token}`
            }
        }, {
            query: "What is photosynthesis?",
            context: mockContext,
            mode: "student_doubt"
        });

        console.log(`✅ AI API Status: ${chatResp.status}`);
        if (chatResp.status === 200) {
            console.log('📝 AI Response:');
            console.log(chatResp.data.answer);
        } else {
            console.log('❌ AI Request Failed:', chatResp.data);
        }

        console.log('\n✅ TEST COMPLETE\n');
    } catch (error) {
        console.error('❌ Error:', error);
    }
}

testAI();
