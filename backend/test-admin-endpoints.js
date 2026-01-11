const axios = require('axios');

const BASE_URL = 'http://localhost:5000/api';

// First, login as admin to get token
async function testAdminEndpoints() {
    try {
        console.log('🔐 Logging in as admin...\n');
        
        const loginResponse = await axios.post(`${BASE_URL}/auth/login`, {
            email: 'admin@busbooking.com',
            password: 'admin123'
        });

        const token = loginResponse.data.token;
        console.log('✅ Login successful!');
        console.log('Token:', token.substring(0, 20) + '...\n');

        const headers = {
            'Authorization': `Bearer ${token}`,
            'Content-Type': 'application/json'
        };

        // Test 1: Create a new route
        console.log('📍 Test 1: Creating new route (Colombo → Galle)...');
        try {
            const routeResponse = await axios.post(`${BASE_URL}/admin/routes`, {
                origin: 'Colombo',
                destination: 'Galle',
                duration: '2h 30m',
                distance_km: 119,
                base_price: 800
            }, { headers });
            console.log('✅ Route created:', routeResponse.data);
        } catch (err) {
            console.log('❌ Error:', err.response?.data?.message || err.message);
        }

        console.log('\n');

        // Test 2: Create a new bus
        console.log('🚌 Test 2: Creating new bus...');
        try {
            const busResponse = await axios.post(`${BASE_URL}/admin/buses`, {
                bus_number: 'NC-9999',
                bus_type: 'Luxury',
                total_seats: 40,
                layout_type: '2x2'
            }, { headers });
            console.log('✅ Bus created:', busResponse.data);
        } catch (err) {
            console.log('❌ Error:', err.response?.data?.message || err.message);
        }

        console.log('\n');

        // Test 3: Get all buses
        console.log('📋 Test 3: Getting all buses...');
        try {
            const busesResponse = await axios.get(`${BASE_URL}/admin/buses`, { headers });
            console.log('✅ Buses retrieved:', busesResponse.data.count, 'buses found');
            console.log('First bus:', busesResponse.data.data[0]);
        } catch (err) {
            console.log('❌ Error:', err.response?.data?.message || err.message);
        }

        console.log('\n');

        // Test 4: Create a schedule
        console.log('📅 Test 4: Creating new schedule...');
        try {
            // Get first route and first bus
            const routesResponse = await axios.get(`${BASE_URL}/routes`);
            const busesResponse = await axios.get(`${BASE_URL}/admin/buses`, { headers });
            
            if (routesResponse.data.data.length > 0 && busesResponse.data.data.length > 0) {
                const route = routesResponse.data.data[0];
                const bus = busesResponse.data.data[0];

                const scheduleResponse = await axios.post(`${BASE_URL}/admin/schedules`, {
                    route_id: route.id,
                    bus_id: bus.id,
                    travel_date: '2026-01-20',
                    departure_time: '08:00:00',
                    arrival_time: '10:30:00'
                }, { headers });
                console.log('✅ Schedule created:', scheduleResponse.data);
            } else {
                console.log('⚠️  No routes or buses available to create schedule');
            }
        } catch (err) {
            console.log('❌ Error:', err.response?.data?.message || err.message);
        }

        console.log('\n');

        // Test 5: Get all schedules
        console.log('📋 Test 5: Getting all schedules...');
        try {
            const schedulesResponse = await axios.get(`${BASE_URL}/admin/schedules`, { headers });
            console.log('✅ Schedules retrieved:', schedulesResponse.data.count, 'schedules found');
            if (schedulesResponse.data.data.length > 0) {
                console.log('First schedule:', schedulesResponse.data.data[0]);
            }
        } catch (err) {
            console.log('❌ Error:', err.response?.data?.message || err.message);
        }

        console.log('\n✅ All tests completed!\n');

    } catch (error) {
        console.error('❌ Error:', error.message);
        if (error.response) {
            console.error('Response:', error.response.data);
        }
    }
}

testAdminEndpoints();
