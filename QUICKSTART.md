# 🚀 Quick Start Guide

## Run the Project in 3 Steps

### Step 1: Setup Database (1 minute)

Open MySQL and run:

```bash
mysql -u root -p
# Password: 1111

source d:/fox\ (1)/BusSeatBookingSystem/database/schema.sql
exit
```

### Step 2: Start Backend (30 seconds)

```bash
cd "d:\fox (1)\BusSeatBookingSystem\backend"
npm install
npm start
```

✅ Backend running on http://localhost:5000

### Step 3: Start Frontend (30 seconds)

Open **new terminal**:

```bash
cd "d:\fox (1)\BusSeatBookingSystem\frontend"
npm install
npm run dev
```

✅ Frontend opens at http://localhost:3000

---

## Test the Application

1. **Book a seat:**
   - Select route: Colombo → Kandy
   - Choose schedule
   - Click green seat (e.g., A10)
   - Enter: Name = "Test User", Phone = "+94771234567"
   - Click "Confirm Booking"

2. **View admin panel:**
   - Click "Admin Panel" button
   - See all bookings, search, view statistics

---

## Default Credentials

- **MySQL User:** root
- **MySQL Password:** 1111
- **Database:** bookingbussystem

---

## Troubleshooting

**Backend won't start?**
```bash
# Check MySQL is running
mysql -u root -p1111 -e "SELECT 1"

# Check .env file
cat backend/.env
```

**Frontend shows API errors?**
```bash
# Verify backend is running
curl http://localhost:5000/api/health
```

---

## Next Steps

- Read full documentation: [README.md](README.md)
- Check API endpoints
- Customize routes and buses in database
