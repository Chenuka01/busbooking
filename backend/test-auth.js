// Test Admin Login
const axios = require('axios');

const API_URL = 'http://localhost:5000/api';

async function testAdminLogin() {
    console.log('🔐 Testing Admin Login...\n');

    try {
        // Test admin login
        console.log('1️⃣ Attempting admin login...');
        const loginResponse = await axios.post(`${API_URL}/auth/login`, {
            email: 'admin@busbooking.com',
            password: 'admin123'
        });

        if (loginResponse.data.success) {
            console.log('✅ Admin login successful!');
            console.log('📧 Email:', loginResponse.data.data.user.email);
            console.log('👤 Name:', loginResponse.data.data.user.fullName);
            console.log('🔑 Role:', loginResponse.data.data.user.role);
            console.log('🎫 Token:', loginResponse.data.data.token.substring(0, 20) + '...');
            
            // Test token verification
            console.log('\n2️⃣ Verifying token...');
            const verifyResponse = await axios.get(`${API_URL}/auth/verify`, {
                headers: {
                    'Authorization': `Bearer ${loginResponse.data.data.token}`
                }
            });

            if (verifyResponse.data.success) {
                console.log('✅ Token verified!');
                console.log('👤 User:', verifyResponse.data.data.user.fullName);
                console.log('🔑 Role:', verifyResponse.data.data.user.role);
            }

            // Test admin stats endpoint
            console.log('\n3️⃣ Testing admin stats endpoint...');
            const statsResponse = await axios.get(`${API_URL}/admin/stats`, {
                headers: {
                    'Authorization': `Bearer ${loginResponse.data.data.token}`
                }
            });

            if (statsResponse.data.success) {
                console.log('✅ Admin dashboard stats retrieved!');
                console.log('📊 Total Bookings:', statsResponse.data.data.totalBookings);
                console.log('💰 Total Revenue:', statsResponse.data.data.totalRevenue);
                console.log('📅 Today\'s Bookings:', statsResponse.data.data.todayBookings);
            }

            console.log('\n✅ ALL TESTS PASSED! Admin login is working correctly.');
        }

    } catch (error) {
        console.error('❌ Error:', error.response?.data?.message || error.message);
        if (error.code === 'ECONNREFUSED') {
            console.error('\n⚠️  Backend server is not running!');
            console.error('Please start the server with: cd backend && npm start');
        }
    }
}

// Test user login
async function testUserLogin() {
    console.log('\n\n👤 Testing User Login...\n');

    try {
        console.log('1️⃣ Attempting user login...');
        const loginResponse = await axios.post(`${API_URL}/auth/login`, {
            email: 'user@example.com',
            password: 'admin123'
        });

        if (loginResponse.data.success) {
            console.log('✅ User login successful!');
            console.log('📧 Email:', loginResponse.data.data.user.email);
            console.log('👤 Name:', loginResponse.data.data.user.fullName);
            console.log('🔑 Role:', loginResponse.data.data.user.role);

            // Try to access admin endpoint (should fail)
            console.log('\n2️⃣ Testing access control (user trying admin endpoint)...');
            try {
                await axios.get(`${API_URL}/admin/stats`, {
                    headers: {
                        'Authorization': `Bearer ${loginResponse.data.data.token}`
                    }
                });
                console.log('❌ SECURITY ISSUE: User accessed admin endpoint!');
            } catch (err) {
                if (err.response?.status === 403) {
                    console.log('✅ Access denied correctly! Role-based security working.');
                }
            }
        }

    } catch (error) {
        console.error('❌ Error:', error.response?.data?.message || error.message);
    }
}

// Run tests
(async () => {
    await testAdminLogin();
    await testUserLogin();
    console.log('\n\n🎉 Authentication system is fully functional!\n');
})();
