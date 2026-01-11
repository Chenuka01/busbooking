# 🚌 Bus Seat Booking System

A professional, full-stack bus seat booking application built with **React**, **Node.js**, **Express**, and **MySQL**.

## 📋 Features

### Passenger Features
- ✅ Browse available bus routes
- ✅ View schedules with date and time
- ✅ Interactive seat selection (2x2 layout)
- ✅ Real-time seat availability
- ✅ **Double booking prevention** (critical validation)
- ✅ Booking confirmation with unique ID
- ✅ Mobile-responsive design

### Admin Features
- ✅ View all bookings
- ✅ Search by booking ID, name, phone, or seat
- ✅ Track revenue and statistics
- ✅ Filter by booking status

### Technical Highlights
- 🚀 **Performance**: Booking completes in under 2 seconds
- 🔒 **Data Integrity**: Foreign key constraints prevent orphaned records
- 🛡️ **Validation**: Server-side validation prevents double bookings
- 📱 **Responsive**: Works seamlessly on mobile and desktop
- 🎨 **Modern UI**: Built with Tailwind CSS

---

## 🛠️ Technology Stack

| Layer | Technology |
|-------|-----------|
| **Frontend** | React 18, Vite, Tailwind CSS |
| **Backend** | Node.js, Express.js |
| **Database** | MySQL 8.0 |
| **API** | RESTful API with JSON |
| **HTTP Client** | Axios |

---

## 📁 Project Structure

```
BusSeatBookingSystem/
├── backend/
│   ├── config/
│   │   └── database.js          # MySQL connection pool
│   ├── server.js                # Express API server
│   ├── package.json
│   └── .env                     # Environment variables
│
├── frontend/
│   ├── src/
│   │   ├── components/
│   │   │   ├── HomePage.jsx     # Route & schedule selection
│   │   │   ├── SeatSelection.jsx # Interactive seat layout
│   │   │   ├── BookingSuccess.jsx # Confirmation screen
│   │   │   └── AdminDashboard.jsx # Admin panel
│   │   ├── services/
│   │   │   └── api.js           # API service layer
│   │   ├── App.jsx              # Main app component
│   │   ├── main.jsx             # Entry point
│   │   └── index.css            # Global styles
│   ├── index.html
│   ├── package.json
│   ├── vite.config.js
│   └── tailwind.config.js
│
└── database/
    └── schema.sql               # Database schema with auto-creation
```

---

## ⚙️ Setup Instructions

### Prerequisites
- Node.js (v18 or higher)
- MySQL 8.0
- npm or yarn

### 1️⃣ Database Setup

**Option A: Using MySQL Command Line**

```bash
# Login to MySQL
mysql -u root -p

# Run the schema script
source d:/fox\ (1)/BusSeatBookingSystem/database/schema.sql
```

**Option B: Using MySQL Workbench**

1. Open MySQL Workbench
2. Connect to your MySQL server (localhost:3306)
3. Open [database/schema.sql](database/schema.sql)
4. Execute the script (⚡ Execute button)

The script will:
- Create database `bookingbussystem` (if not exists)
- Create tables: Routes, Buses, Schedules, Bookings
- Insert sample data (5 routes, 5 buses, 11 schedules, 5 bookings)

**Verify Database Creation:**

```sql
USE bookingbussystem;
SHOW TABLES;
SELECT COUNT(*) FROM Routes;
SELECT COUNT(*) FROM Schedules;
```

---

### 2️⃣ Backend Setup

```bash
# Navigate to backend folder
cd "d:\fox (1)\BusSeatBookingSystem\backend"

# Install dependencies
npm install

# Start the server
npm start
```

The backend API will run on **http://localhost:5000**

**Verify Backend:**
- Open http://localhost:5000/api/health
- You should see: `{"success": true, "message": "Bus Booking API is running!"}`

---

### 3️⃣ Frontend Setup

```bash
# Navigate to frontend folder
cd "d:\fox (1)\BusSeatBookingSystem\frontend"

# Install dependencies
npm install

# Start development server
npm run dev
```

The frontend will open automatically at **http://localhost:3000**

---

## 🔌 API Endpoints

| Method | Endpoint | Description |
|--------|----------|-------------|
| GET | `/api/routes` | Get all available routes |
| GET | `/api/schedules/:routeId` | Get schedules for a route |
| GET | `/api/seats/:scheduleId` | Get seat availability |
| POST | `/api/book` | Create a new booking |
| GET | `/api/bookings` | Get all bookings (Admin) |
| GET | `/api/booking/:bookingId` | Get booking by UUID |
| DELETE | `/api/booking/:bookingId` | Cancel a booking |
| GET | `/api/health` | Health check |

### Example API Request

**Create Booking:**
```bash
curl -X POST http://localhost:5000/api/book \
  -H "Content-Type: application/json" \
  -d '{
    "scheduleId": 1,
    "seatNumber": "A5",
    "name": "John Perera",
    "phone": "+94771234567",
    "email": "john@example.com"
  }'
```

**Response:**
```json
{
  "success": true,
  "message": "Booking confirmed successfully!",
  "data": {
    "bookingId": 6,
    "bookingReference": "a1b2c3d4-e5f6-7890-abcd-ef1234567890",
    "seatNumber": "A5",
    "passengerName": "John Perera",
    "amountPaid": 450.00
  }
}
```

---

## 🎯 How to Use

### For Passengers:

1. **Select Route**
   - Choose origin and destination from available routes
   - View route details (distance, duration, price)

2. **Choose Schedule**
   - Pick travel date and time
   - See available seats count
   - View bus type (AC/Non-AC/Luxury)

3. **Select Seat**
   - Interactive 2x2 seat layout
   - Green = Available, Red = Booked
   - Click on available seat

4. **Enter Details**
   - Fill in name and phone number
   - Optionally add email
   - Confirm booking

5. **Get Confirmation**
   - Receive unique booking reference
   - Save for check-in

### For Admin:

1. Click **"Admin Panel"** in navigation
2. View dashboard with statistics
3. Search bookings by ID, name, phone, or seat
4. Monitor revenue and booking status

---

## 🔒 Security Features

- ✅ **Double Booking Prevention**: Unique constraint on (schedule_id, seat_number)
- ✅ **Input Validation**: Server-side validation for all inputs
- ✅ **SQL Injection Protection**: Parameterized queries
- ✅ **CORS Configuration**: Controlled cross-origin requests
- ✅ **Error Handling**: Graceful error messages

---

## 📊 Database Schema

### Tables Overview

**Routes**
- `id` (PK), `origin`, `destination`, `duration`, `distance_km`, `base_price`

**Buses**
- `id` (PK), `bus_number` (UNIQUE), `total_seats`, `layout_type`, `bus_type`

**Schedules**
- `id` (PK), `route_id` (FK), `bus_id` (FK), `travel_date`, `departure_time`, `available_seats`
- UNIQUE constraint: (bus_id, travel_date, departure_time)

**Bookings**
- `id` (PK), `schedule_id` (FK), `seat_number`, `passenger_name`, `passenger_phone`, `booking_uuid` (UNIQUE)
- UNIQUE constraint: (schedule_id, seat_number)

---

## 🚀 Deployment

### Backend Deployment (e.g., Heroku, Railway)

1. Update `.env` with production database credentials
2. Set `NODE_ENV=production`
3. Deploy backend code
4. Update CORS `ALLOWED_ORIGINS` with frontend URL

### Frontend Deployment (e.g., Vercel, Netlify)

1. Build production bundle: `npm run build`
2. Update API base URL in `src/services/api.js`
3. Deploy `dist` folder

---

## 🐛 Troubleshooting

### Backend won't start?
- Check MySQL is running: `mysql -u root -p`
- Verify database credentials in `.env`
- Check port 5000 is not in use

### Frontend API errors?
- Verify backend is running on port 5000
- Check browser console for CORS errors
- Ensure API_BASE_URL in `api.js` is correct

### Database connection error?
```
Error: ER_ACCESS_DENIED_ERROR
```
**Solution:** Update password in `.env` file:
```
DB_PASSWORD=1111
```

---

## 📝 Sample Data

The database includes:
- **5 Routes**: Colombo-Kandy, Galle-Matara, Colombo-Jaffna, Kandy-Nuwara Eliya, Colombo-Galle
- **5 Buses**: Mix of AC, Non-AC, Luxury buses (36-50 seats)
- **11 Schedules**: Next 7 days
- **5 Sample Bookings**: Pre-booked seats for testing

---

## 🎨 UI Screenshots

### Home Page
- Clean route selection cards
- Schedule listing with availability
- "How to Book" guide

### Seat Selection
- Interactive 2x2 grid layout
- Color-coded seats (Green/Red/Blue)
- Aisle visualization
- Booking modal form

### Admin Dashboard
- Statistics cards (Total, Confirmed, Cancelled, Revenue)
- Searchable bookings table
- Status badges

---

## 📄 License

This project is created for educational purposes.

---

## 👨‍💻 Developer Notes

### Key Implementation Details

**Double Booking Prevention:**
```sql
-- Database level
UNIQUE KEY `unique_booking` (`schedule_id`, `seat_number`)

-- Application level (server.js)
const [existingBooking] = await db.query(
  'SELECT id FROM Bookings WHERE schedule_id = ? AND seat_number = ? AND booking_status = "Confirmed"',
  [scheduleId, seatNumber]
);
```

**Seat Layout Generation:**
```javascript
// server.js - generateSeatLayout()
// Dynamically generates A1, A2, B1, B2, C1, C2, D1, D2...
// Based on total_seats and layout_type (2x2 or 2x3)
```

**Performance Optimization:**
- MySQL connection pool (10 connections)
- Non-blocking async/await queries
- Indexed columns (booking_uuid, route_id, travel_date)

---

## 🎯 PDF Requirements Compliance

| PDF Requirement | Implementation | Status |
|----------------|----------------|--------|
| Display bus routes | HomePage component with route cards | ✅ |
| Show seat layout (available/booked) | SeatSelection with color-coded grid | ✅ |
| Prevent double booking | Database constraint + API validation | ✅ |
| Generate unique booking ID | UUID generation in POST /api/book | ✅ |
| Admin view all bookings | AdminDashboard component | ✅ |
| Booking < 2 seconds | Non-blocking queries + connection pool | ✅ |
| Simple interface | Tailwind CSS responsive design | ✅ |
| MySQL database | schema.sql with auto-creation | ✅ |

---

## 📞 Support

For issues or questions:
- Check the troubleshooting section
- Review API documentation above
- Verify database setup steps

---

**Built with ❤️ using React, Node.js, and MySQL**
