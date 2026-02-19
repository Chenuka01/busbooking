# Route & Bus Management - Visual Quick Reference

## 🎨 UI State Reference

### Route Table States

```
┌─────────────────────────────────────────────────────────────────────────┐
│ Route: Colombo → Kandy                                                  │
├──────────┬──────────┬──────────┬──────────┬──────────┬──────────────────┤
│ Duration │ Distance │ Price    │ Schedules│ Actions                     │
├──────────┼──────────┼──────────┼──────────┼──────────────────────────────┤
│                                                                          │
│ STATE 1: NO SCHEDULES (Can Delete)                                      │
│ 3h 30m   │ 115 km   │ Rs. 450  │ 0 total  │ 🗑️ Delete                   │
│                                                                          │
├──────────┼──────────┼──────────┼──────────┼──────────────────────────────┤
│                                                                          │
│ STATE 2: HAS SCHEDULES - ALL COMPLETED (Cannot Delete)                  │
│ 3h 30m   │ 115 km   │ Rs. 450  │ 5 total  │ 🔒 Has Schedules            │
│                                 │          │ (hover: "Cannot delete:     │
│                                 │          │  5 schedule(s) exist")      │
│                                                                          │
├──────────┼──────────┼──────────┼──────────┼──────────────────────────────┤
│                                                                          │
│ STATE 3: HAS ACTIVE SCHEDULES (Cannot Delete)                           │
│ 3h 30m   │ 115 km   │ Rs. 450  │ 8 total  │ 🔒 Has Schedules            │
│                                 │ (3 active)│                            │
│                                 │    ↑      │                            │
│                                 │  green    │                            │
│                                                                          │
└──────────┴──────────┴──────────┴──────────┴──────────────────────────────┘
```

### Bus Table States

```
┌─────────────────────────────────────────────────────────────────────────┐
│ Bus: NB-001 (AC Bus)                                                    │
├──────────┬──────────┬──────────┬──────────┬──────────┬──────────────────┤
│ Type     │ Seats    │ Layout   │ Status   │ Schedules│ Actions         │
├──────────┼──────────┼──────────┼──────────┼──────────┼──────────────────┤
│                                                                          │
│ STATE 1: NO SCHEDULES (Can Delete)                                      │
│ AC       │ 40       │ 2x2      │ Active   │ 0 total  │ 🗑️ Delete       │
│                                                                          │
├──────────┼──────────┼──────────┼──────────┼──────────┼──────────────────┤
│                                                                          │
│ STATE 2: HAS HISTORICAL SCHEDULES (Cannot Delete)                       │
│ AC       │ 40       │ 2x2      │ Active   │ 12 total │ 🔒 Has Schedules│
│                                                                          │
├──────────┼──────────┼──────────┼──────────┼──────────┼──────────────────┤
│                                                                          │
│ STATE 3: HAS ACTIVE SCHEDULES (Cannot Delete)                           │
│ AC       │ 40       │ 2x2      │ Active   │ 15 total │ 🔒 Has Schedules│
│                                           │ (5 active)│                 │
│                                           │    ↑      │                 │
│                                           │  green    │                 │
│                                                                          │
└──────────┴──────────┴──────────┴──────────┴──────────┴──────────────────┘
```

## 🔄 Deletion Flow Diagrams

### Flow 1: Delete Route (No Schedules)
```
Admin clicks "🗑️ Delete"
         ↓
Confirmation dialog:
"Are you sure you want 
 to delete this route?"
         ↓
    [Confirm]
         ↓
Backend checks schedules
         ↓
   schedule_count = 0
         ↓
DELETE from Routes
         ↓
✅ Success toast:
   "Route deleted successfully"
         ↓
Refresh route list
```

### Flow 2: Attempt to Delete Route (Has Schedules)
```
Route has schedules
         ↓
Delete button is HIDDEN
Shows: "🔒 Has Schedules"
         ↓
User hovers over it
         ↓
Tooltip appears:
"Cannot delete: 
 5 schedule(s) exist"
         ↓
[Optional: If user tries via API]
         ↓
Backend returns error 400
         ↓
Frontend shows toast (5 sec):
"Cannot delete route with
 existing schedules. Please
 delete or cancel all 
 schedules first.

 Total schedules: 5
 Active schedules: 2

 Cancel active schedules
 before deleting this route"
         ↓
Admin goes to Schedules tab
         ↓
Cancels/deletes schedules
         ↓
Returns to Routes tab
         ↓
Now shows "🗑️ Delete" button
```

### Flow 3: Delete Bus (Has Only Completed Schedules)
```
Bus has 10 completed schedules
         ↓
Shows: "10 total (0 active)"
Action: "🔒 Has Schedules"
         ↓
[If deletion attempted]
         ↓
Error message:
"Total schedules: 10
 Active schedules: 0

 Delete completed/cancelled
 schedules before deleting
 this bus"
         ↓
Admin goes to Schedules tab
         ↓
Filters for this bus
         ↓
Deletes old schedules
         ↓
Returns to Buses tab
         ↓
Now can delete bus
```

## 📊 Error Message Anatomy

### Detailed Error Structure
```
╔═══════════════════════════════════════════════════╗
║  ERROR MESSAGE COMPONENTS                         ║
╠═══════════════════════════════════════════════════╣
║                                                   ║
║  Main Message:                                    ║
║  "Cannot delete route with existing schedules.    ║
║   Please delete or cancel all schedules first."   ║
║                                                   ║
║  ─────────────────────────────────────────────── ║
║                                                   ║
║  Statistics:                                      ║
║  • Total schedules: 8                             ║
║  • Active schedules: 3                            ║
║                                                   ║
║  ─────────────────────────────────────────────── ║
║                                                   ║
║  Actionable Suggestion:                           ║
║  "Cancel active schedules before deleting         ║
║   this route"                                     ║
║                                                   ║
╚═══════════════════════════════════════════════════╝
```

### Suggestion Logic
```javascript
if (activeScheduleCount > 0) {
    suggestion = "Cancel active schedules before deleting"
} else {
    suggestion = "Delete completed/cancelled schedules before deleting"
}
```

## 🎯 Visual Indicators Guide

### Icon Meanings
```
🗑️  Delete      → Can delete (no dependencies)
🔒  Locked      → Cannot delete (has dependencies)
✏️  Edit        → Can edit
🚫  Cancel      → Cancel active schedule
❌  Cancelled   → Already cancelled
✅  Completed   → Already completed
```

### Color Scheme
```
┌────────────────────────────────────────────┐
│ RED (signal-red)                           │
│ • Delete buttons                           │
│ • Destructive actions                      │
│ • Use: hover:text-red-800                  │
└────────────────────────────────────────────┘

┌────────────────────────────────────────────┐
│ GREEN (text-green-600)                     │
│ • Active schedule counts                   │
│ • Positive indicators                      │
│ • Success states                           │
└────────────────────────────────────────────┘

┌────────────────────────────────────────────┐
│ GRAY (text-gray-400)                       │
│ • Disabled states                          │
│ • "Has Schedules" lock indicator           │
│ • Non-actionable items                     │
└────────────────────────────────────────────┘

┌────────────────────────────────────────────┐
│ BLUE (slate-blue)                          │
│ • Edit buttons                             │
│ • Non-destructive actions                  │
│ • Primary UI elements                      │
└────────────────────────────────────────────┘
```

## 💬 Toast Messages

### Success Messages
```
┌─────────────────────────────────┐
│ ✅ Route deleted successfully   │
└─────────────────────────────────┘

┌─────────────────────────────────┐
│ ✅ Bus deleted successfully     │
└─────────────────────────────────┘
```

### Error Messages (Short)
```
┌────────────────────────────────────────────┐
│ ❌ Cannot delete route with existing       │
│    schedules. Please delete or cancel      │
│    all schedules first.                    │
│                                            │
│    Total schedules: 5                      │
│    Active schedules: 2                     │
│                                            │
│    Cancel active schedules before          │
│    deleting this route                     │
│                                            │
│    [Dismiss in 5 seconds]                  │
└────────────────────────────────────────────┘
```

## 🔍 Debugging Guide

### Frontend Console Logs
```javascript
// When deleting route with schedules:
console.log('Error data:', {
    message: 'Cannot delete...',
    scheduleCount: 5,
    activeScheduleCount: 2,
    suggestion: 'Cancel active...'
});
```

### Backend Response Check
```bash
# Test route deletion with curl
curl -X DELETE http://localhost:5000/api/admin/routes/1 \
  -H "Authorization: Bearer YOUR_TOKEN"

# Expected response (has schedules):
{
  "success": false,
  "message": "Cannot delete route with existing schedules...",
  "scheduleCount": 5,
  "activeScheduleCount": 2,
  "suggestion": "Cancel active schedules..."
}
```

### Database Verification
```sql
-- Check route schedule count
SELECT 
    r.id,
    r.origin,
    r.destination,
    COUNT(s.id) as total_schedules,
    SUM(CASE WHEN s.status = 'Scheduled' THEN 1 ELSE 0 END) as active_schedules
FROM Routes r
LEFT JOIN Schedules s ON r.route_id = r.id
GROUP BY r.id;

-- Check bus schedule count
SELECT 
    b.id,
    b.bus_number,
    COUNT(s.id) as total_schedules,
    SUM(CASE WHEN s.status = 'Scheduled' THEN 1 ELSE 0 END) as active_schedules
FROM Buses b
LEFT JOIN Schedules s ON s.bus_id = b.id
GROUP BY b.id;
```

## 📱 Responsive Behavior

### Desktop View (>1024px)
```
┌────────────────────────────────────────────────────────────┐
│ Origin │ Dest │ Duration │ Distance │ Price │ Schedules │ Actions │
│   All columns visible with full details                    │
└────────────────────────────────────────────────────────────┘
```

### Tablet View (768px - 1024px)
```
┌────────────────────────────────────────────────┐
│ Route │ Schedules │ Actions                    │
│   Condensed view, key info visible            │
└────────────────────────────────────────────────┘
```

### Mobile View (<768px)
```
┌────────────────────────┐
│ Route: Colombo → Kandy │
│ Schedules: 5 (2 active)│
│ [Action Button]        │
└────────────────────────┘
```

## 🎭 Animation States

### Button Hover Effects
```
Normal State:     🗑️ Delete
                  └─ text-signal-red

Hover State:      🗑️ Delete
                  └─ text-red-800 + scale(1.1)

Click State:      🗑️ Delete
                  └─ scale(0.95)
```

### Locked State
```
🔒 Has Schedules
└─ text-gray-400 (no hover effect)
└─ cursor: default
└─ tooltip on hover
```

## ✅ Quick Testing Commands

```bash
# 1. Create test route
curl -X POST http://localhost:5000/api/schedules/routes \
  -H "Authorization: Bearer $TOKEN" \
  -H "Content-Type: application/json" \
  -d '{"origin":"TestCity1","destination":"TestCity2","base_price":500}'

# 2. Create schedule for that route
curl -X POST http://localhost:5000/api/schedules \
  -H "Authorization: Bearer $TOKEN" \
  -H "Content-Type: application/json" \
  -d '{"route_id":1,"bus_id":1,"travel_date":"2026-03-01","departure_time":"10:00"}'

# 3. Try to delete route (should fail)
curl -X DELETE http://localhost:5000/api/admin/routes/1 \
  -H "Authorization: Bearer $TOKEN"

# 4. Cancel the schedule
curl -X PATCH http://localhost:5000/api/admin/schedules/1/status \
  -H "Authorization: Bearer $TOKEN" \
  -H "Content-Type: application/json" \
  -d '{"status":"Cancelled"}'

# 5. Delete the schedule
curl -X DELETE http://localhost:5000/api/admin/schedules/1 \
  -H "Authorization: Bearer $TOKEN"

# 6. Now delete route (should succeed)
curl -X DELETE http://localhost:5000/api/admin/routes/1 \
  -H "Authorization: Bearer $TOKEN"
```

## 🎓 Summary

**Visual States**: 3 states per entity (No schedules, Has schedules, Has active schedules)
**Action Buttons**: Dynamic based on state (Delete / Locked)
**Information Display**: Schedule counts with active breakdown
**Error Messages**: Detailed with statistics and suggestions
**User Guidance**: Clear tooltips and actionable messages
**Color Coding**: Semantic colors for different states
