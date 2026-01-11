# Admin Schedule Management Endpoints - Implementation Complete

## ✅ New Admin Endpoints Added

### 🚍 **ROUTE MANAGEMENT**

#### 1. Create Route
```
POST /api/admin/routes
```
**Headers:** `Authorization: Bearer {token}`  
**Body:**
```json
{
  "origin": "Colombo",
  "destination": "Galle",
  "duration": "2h 30m",
  "distance_km": 119,
  "base_price": 800
}
```
**Response:**
```json
{
  "success": true,
  "message": "Route created successfully",
  "data": {
    "id": 5,
    "origin": "Colombo",
    "destination": "Galle",
    "duration": "2h 30m",
    "distance_km": 119,
    "base_price": 800
  }
}
```

#### 2. Update Route
```
PUT /api/admin/routes/:routeId
```
**Body:** Same as create  
**Response:** `{ "success": true, "message": "Route updated successfully" }`

#### 3. Delete Route
```
DELETE /api/admin/routes/:routeId
```
**Response:** `{ "success": true, "message": "Route deleted successfully" }`  
**Note:** Cannot delete route with existing schedules

---

### 🚌 **BUS MANAGEMENT**

#### 1. Get All Buses
```
GET /api/admin/buses
```
**Response:**
```json
{
  "success": true,
  "count": 3,
  "data": [
    {
      "id": 1,
      "bus_number": "NA-1234",
      "bus_type": "Regular",
      "total_seats": 40,
      "layout_type": "2x2"
    }
  ]
}
```

#### 2. Create Bus
```
POST /api/admin/buses
```
**Body:**
```json
{
  "bus_number": "NC-9999",
  "bus_type": "Luxury",
  "total_seats": 40,
  "layout_type": "2x2"
}
```

#### 3. Update Bus
```
PUT /api/admin/buses/:busId
```
**Body:** Same as create

#### 4. Delete Bus
```
DELETE /api/admin/buses/:busId
```
**Note:** Cannot delete bus with existing schedules

---

### 📅 **SCHEDULE MANAGEMENT**

#### 1. Get All Schedules (with filters)
```
GET /api/admin/schedules?routeId=1&status=Scheduled&startDate=2026-01-15&endDate=2026-01-31
```
**Query Parameters:**
- `routeId` (optional) - Filter by route
- `status` (optional) - Scheduled, Cancelled, Completed
- `startDate` (optional) - Filter from date
- `endDate` (optional) - Filter to date

**Response:**
```json
{
  "success": true,
  "count": 10,
  "data": [
    {
      "id": 1,
      "route_id": 1,
      "bus_id": 1,
      "travel_date": "2026-01-20",
      "departure_time": "08:00:00",
      "arrival_time": "10:30:00",
      "available_seats": 38,
      "status": "Scheduled",
      "origin": "Colombo",
      "destination": "Kandy",
      "base_price": 1500,
      "bus_number": "NA-1234",
      "total_seats": 40
    }
  ]
}
```

#### 2. Create Schedule
```
POST /api/admin/schedules
```
**Body:**
```json
{
  "route_id": 1,
  "bus_id": 1,
  "travel_date": "2026-01-20",
  "departure_time": "08:00:00",
  "arrival_time": "10:30:00"
}
```
**Note:** `available_seats` is automatically set to bus's `total_seats`

#### 3. Update Schedule
```
PUT /api/admin/schedules/:scheduleId
```
**Body:** (all fields optional)
```json
{
  "route_id": 1,
  "bus_id": 1,
  "travel_date": "2026-01-21",
  "departure_time": "09:00:00",
  "arrival_time": "11:30:00",
  "status": "Scheduled"
}
```
**Important:** Cannot change route or bus if schedule has confirmed bookings (only time and status can be updated)

#### 4. Delete Schedule
```
DELETE /api/admin/schedules/:scheduleId
```
**Note:** Cannot delete schedule with existing bookings (suggest cancelling instead)

#### 5. Update Schedule Status
```
PATCH /api/admin/schedules/:scheduleId/status
```
**Body:**
```json
{
  "status": "Cancelled"
}
```
**Valid Statuses:** `Scheduled`, `Cancelled`, `Completed`

---

## 📋 Frontend API Service Functions

All endpoints have been added to `frontend/src/services/api.js`:

```javascript
// ROUTE MANAGEMENT
adminAPI.createRoute(routeData)
adminAPI.updateRoute(routeId, routeData)
adminAPI.deleteRoute(routeId)

// BUS MANAGEMENT
adminAPI.getBuses()
adminAPI.createBus(busData)
adminAPI.updateBus(busId, busData)
adminAPI.deleteBus(busId)

// SCHEDULE MANAGEMENT
adminAPI.getSchedules(filters)
adminAPI.createSchedule(scheduleData)
adminAPI.updateSchedule(scheduleId, scheduleData)
adminAPI.deleteSchedule(scheduleId)
adminAPI.updateScheduleStatus(scheduleId, status)
```

---

## 🔐 Authentication

All admin endpoints require:
1. **JWT Token** in Authorization header
2. **Admin Role** (role = 'admin')

**Get Token:**
```javascript
POST /api/auth/login
Body: {
  "email": "admin@busbooking.com",
  "password": "admin123"
}
Response: { "token": "eyJhbGc..." }
```

Then use token in requests:
```
Authorization: Bearer eyJhbGc...
```

---

## 🎯 Usage Example (Frontend)

```javascript
import { adminAPI } from './services/api';

// Create a new route
const createRoute = async () => {
  try {
    const result = await adminAPI.createRoute({
      origin: 'Colombo',
      destination: 'Galle',
      duration: '2h 30m',
      distance_km: 119,
      base_price: 800
    });
    console.log('Route created:', result);
  } catch (error) {
    console.error('Error:', error.response?.data?.message);
  }
};

// Create a schedule
const createSchedule = async () => {
  try {
    const result = await adminAPI.createSchedule({
      route_id: 1,
      bus_id: 1,
      travel_date: '2026-01-20',
      departure_time: '08:00:00',
      arrival_time: '10:30:00'
    });
    console.log('Schedule created:', result);
  } catch (error) {
    console.error('Error:', error.response?.data?.message);
  }
};

// Get all schedules for a route
const getSchedules = async () => {
  const schedules = await adminAPI.getSchedules({ routeId: 1, status: 'Scheduled' });
  console.log('Schedules:', schedules.data);
};

// Cancel a schedule
const cancelSchedule = async (scheduleId) => {
  await adminAPI.updateScheduleStatus(scheduleId, 'Cancelled');
  console.log('Schedule cancelled');
};
```

---

## ✅ Implementation Status

| Feature | Backend | Frontend API | Status |
|---------|---------|--------------|--------|
| Create Route | ✅ | ✅ | Complete |
| Update Route | ✅ | ✅ | Complete |
| Delete Route | ✅ | ✅ | Complete |
| Get All Buses | ✅ | ✅ | Complete |
| Create Bus | ✅ | ✅ | Complete |
| Update Bus | ✅ | ✅ | Complete |
| Delete Bus | ✅ | ✅ | Complete |
| Get All Schedules | ✅ | ✅ | Complete |
| Create Schedule | ✅ | ✅ | Complete |
| Update Schedule | ✅ | ✅ | Complete |
| Delete Schedule | ✅ | ✅ | Complete |
| Update Schedule Status | ✅ | ✅ | Complete |

---

## 🚀 Server Status

**Backend:** Running on http://localhost:5000  
**API Endpoints:** http://localhost:5000/api/admin/*

All endpoints are **READY TO USE** ✅

---

## 📝 Next Steps

To use these endpoints in the admin dashboard:

1. **Create Admin UI Components** for:
   - Route management form
   - Bus management form  
   - Schedule management form

2. **Import API functions:**
   ```javascript
   import { adminAPI } from '../services/api';
   ```

3. **Call functions in your components** as shown in the usage examples above

**Files Modified:**
- ✅ `backend/routes/admin.js` - Added all CRUD endpoints
- ✅ `frontend/src/services/api.js` - Added API wrapper functions

**Status: IMPLEMENTATION COMPLETE** 🎉
