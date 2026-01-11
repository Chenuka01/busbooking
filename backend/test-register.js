const axios = require('axios');

const testEndpoint = async () => {
    try {
        console.log('Testing /api/auth/register endpoint...\n');
        
        const response = await axios.post('http://localhost:5000/api/auth/register', {
            email: 'testuser@test.com',
            password: 'test123456',
            fullName: 'Test User',
            phone: '+94771234567'
        });
        
        console.log('✅ SUCCESS! Register endpoint is working.');
        console.log('Response:', JSON.stringify(response.data, null, 2));
        
    } catch (error) {
        if (error.response) {
            console.log('❌ ERROR Response:', error.response.status);
            console.log('Error Data:', JSON.stringify(error.response.data, null, 2));
        } else if (error.request) {
            console.log('❌ No response received from server');
            console.log('Is the server running on http://localhost:5000?');
        } else {
            console.log('❌ Error:', error.message);
        }
    }
};

testEndpoint();
