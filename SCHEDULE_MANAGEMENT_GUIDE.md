# Schedule Management - Quick Reference Guide

## 🎯 Action Buttons Reference

### Schedule States & Available Actions

```
┌─────────────────────────────────────────────────────────────┐
│ Schedule Status: SCHEDULED                                   │
├─────────────────────────────────────────────────────────────┤
│                                                              │
│ HAS BOOKINGS (booked_count > 0):                           │
│   ✏️ Edit    🚫 Cancel                                      │
│   Purpose: Can edit details or cancel entire schedule      │
│   Effect: Cancellation marks schedule + all bookings as    │
│          cancelled with reason                             │
│                                                              │
│ NO BOOKINGS (booked_count = 0):                            │
│   ✏️ Edit    🗑️ Delete                                      │
│   Purpose: Can edit details or permanently remove          │
│   Effect: Schedule removed from database                   │
│                                                              │
└─────────────────────────────────────────────────────────────┘

┌─────────────────────────────────────────────────────────────┐
│ Schedule Status: CANCELLED                                   │
├─────────────────────────────────────────────────────────────┤
│   ✏️ Edit    ❌ Cancelled                                    │
│   Purpose: Can view/edit but no delete/cancel actions      │
│                                                              │
└─────────────────────────────────────────────────────────────┘

┌─────────────────────────────────────────────────────────────┐
│ Schedule Status: COMPLETED                                   │
├─────────────────────────────────────────────────────────────┤
│   ✏️ Edit    ✅ Completed                                    │
│   Purpose: Historical record, no destructive actions       │
│                                                              │
└─────────────────────────────────────────────────────────────┘
```

## 🔄 User Flow Diagrams

### Flow 1: Delete Schedule (No Bookings)
```
Admin clicks "🗑️ Delete"
         ↓
Confirmation dialog
         ↓
    [Confirm]
         ↓
Backend checks bookings
         ↓
  booked_count = 0
         ↓
DELETE from database
         ↓
✅ "Schedule deleted successfully"
```

### Flow 2: Delete Attempt (Has Bookings)
```
Admin clicks "🗑️ Delete"
         ↓
Confirmation dialog
         ↓
    [Confirm]
         ↓
Backend checks bookings
         ↓
booked_count = 3 ❌
         ↓
Return error with details:
- message
- bookingCount: 3
- canCancel: true
         ↓
Frontend shows prompt:
"Cannot delete...
This schedule has 3 booking(s).
Cancel instead?"
         ↓
    [Yes/No]
         ↓ Yes
Call cancelSchedule()
         ↓
See Flow 3
```

### Flow 3: Cancel Schedule
```
Admin clicks "🚫 Cancel"
         ↓
Confirmation dialog
         ↓
    [Confirm]
         ↓
PATCH /status { status: 'Cancelled' }
         ↓
Backend updates:
1. All confirmed bookings → Cancelled
2. Sets cancelled_at = NOW()
3. Sets reason = "Schedule cancelled by admin"
4. Updates schedule status → Cancelled
         ↓
✅ "Schedule cancelled successfully.
   All bookings have been cancelled."
```

## 💻 Code Examples

### Frontend: Deleting a Schedule
```javascript
// User clicks delete button
handleDelete(scheduleId, 'schedule');

// System checks if bookings exist
// If yes, shows smart prompt:
"Cannot delete schedule with existing bookings. 
Consider cancelling it instead.

This schedule has 3 booking(s). 
Would you like to cancel the schedule instead?"

// If user accepts, automatically calls:
handleCancelSchedule(scheduleId);
```

### Frontend: Canceling a Schedule
```javascript
// User clicks cancel button
handleCancelSchedule(scheduleId);

// Sends request:
PATCH /api/admin/schedules/{scheduleId}/status
Body: { status: 'Cancelled' }

// Success response triggers:
showToast('success', 'Schedule cancelled successfully. 
All bookings have been cancelled.');
```

### Backend: Delete Validation
```javascript
// Check for confirmed bookings only
const [bookings] = await db.query(
    'SELECT COUNT(*) as count FROM Bookings 
     WHERE schedule_id = ? AND booking_status = "Confirmed"',
    [scheduleId]
);

if (bookings[0].count > 0) {
    return res.status(400).json({
        success: false,
        message: 'Cannot delete schedule...',
        bookingCount: bookings[0].count,
        canCancel: true
    });
}
```

### Backend: Cascade Cancellation
```javascript
if (status === 'Cancelled') {
    // Cancel all confirmed bookings
    await db.query(
        `UPDATE Bookings 
         SET booking_status = "Cancelled", 
             cancelled_at = NOW(), 
             cancellation_reason = "Schedule cancelled by admin" 
         WHERE schedule_id = ? AND booking_status = "Confirmed"`,
        [scheduleId]
    );
}
```

## 🎨 UI Color Coding

```
Status Colors:
├─ 🟢 Green (bg-green-100): Scheduled - Active
├─ 🔴 Red (bg-red-100): Cancelled - Inactive
└─ ⚪ Gray (bg-gray-100): Completed - Historical

Button Colors:
├─ 🔵 Blue: Edit (slate-blue)
├─ 🟠 Orange: Cancel (orange-600) - Warning action
└─ 🔴 Red: Delete (signal-red) - Destructive action
```

## 📊 Database State Changes

### When Deleting (No Bookings)
```sql
-- Before
Schedules: id=123, status='Scheduled'
Bookings: (none)

-- After
Schedules: (record removed)
Bookings: (none)
```

### When Canceling (Has Bookings)
```sql
-- Before
Schedules: id=123, status='Scheduled'
Bookings: 
  - id=1, schedule_id=123, booking_status='Confirmed'
  - id=2, schedule_id=123, booking_status='Confirmed'
  - id=3, schedule_id=123, booking_status='Confirmed'

-- After
Schedules: id=123, status='Cancelled'
Bookings:
  - id=1, booking_status='Cancelled', 
    cancelled_at='2026-02-19 10:30:00',
    cancellation_reason='Schedule cancelled by admin'
  - id=2, booking_status='Cancelled', 
    cancelled_at='2026-02-19 10:30:00',
    cancellation_reason='Schedule cancelled by admin'
  - id=3, booking_status='Cancelled', 
    cancelled_at='2026-02-19 10:30:00',
    cancellation_reason='Schedule cancelled by admin'
```

## ⚠️ Important Notes

1. **Cannot Delete If Bookings Exist**
   - System protects customer data
   - Must cancel instead of delete
   - Maintains audit trail

2. **Cancelled vs Deleted**
   - **Cancelled**: Status change, data retained
   - **Deleted**: Permanent removal (only if no bookings)

3. **Automatic Booking Updates**
   - When schedule is cancelled
   - All confirmed bookings auto-cancelled
   - Cancellation reason recorded

4. **UI Adapts Intelligently**
   - Shows relevant actions only
   - Prevents impossible operations
   - Guides user to correct action

## 🔍 Troubleshooting

### Issue: Can't see Delete button
**Reason**: Schedule has bookings  
**Solution**: Use Cancel button instead

### Issue: Delete button doesn't work
**Check**: 
1. Is user logged in as admin?
2. Does schedule have bookings?
3. Check browser console for errors

### Issue: Cancel doesn't update bookings
**Check**:
1. Verify database connection
2. Check booking statuses (only Confirmed are updated)
3. Review backend logs

## 📝 Testing Checklist

- [ ] Delete empty schedule → Success
- [ ] Attempt to delete schedule with bookings → Prompt shown
- [ ] Cancel schedule with bookings → All bookings cancelled
- [ ] Verify buttons show/hide correctly based on state
- [ ] Check status colors display properly
- [ ] Test tooltip on Cancel button shows booking count
- [ ] Verify cancelled schedules show correct status
- [ ] Test completed schedules have no action buttons
