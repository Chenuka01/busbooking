# Route & Bus Deletion Protection Enhancement

## 🎯 Overview
Fixed the route and bus deletion functionality to provide better user experience and data protection. The system now prevents deletion of routes/buses with existing schedules and provides detailed information to guide administrators.

## 🔧 Changes Made

### Backend Changes

#### 1. Enhanced Route Deletion (`backend/routes/admin.js`)
**Endpoint**: `DELETE /api/admin/routes/:routeId`

**Improvements**:
- ✅ Checks for existing schedules before deletion
- ✅ Returns detailed schedule breakdown (total & active)
- ✅ Provides actionable suggestions based on schedule status
- ✅ Better error messages with context

**New Response (when schedules exist)**:
```json
{
  "success": false,
  "message": "Cannot delete route with existing schedules. Please delete or cancel all schedules first.",
  "scheduleCount": 5,
  "activeScheduleCount": 2,
  "suggestion": "Cancel active schedules before deleting this route"
}
```

#### 2. Enhanced Bus Deletion (`backend/routes/admin.js`)
**Endpoint**: `DELETE /api/admin/buses/:busId`

**Improvements**:
- ✅ Checks for existing schedules before deletion
- ✅ Returns detailed schedule breakdown (total & active)
- ✅ Provides actionable suggestions based on schedule status
- ✅ Better error messages with context

**New Response (when schedules exist)**:
```json
{
  "success": false,
  "message": "Cannot delete bus with existing schedules. Please delete or cancel all schedules first.",
  "scheduleCount": 8,
  "activeScheduleCount": 3,
  "suggestion": "Cancel active schedules before deleting this bus"
}
```

#### 3. Enhanced Routes GET Endpoint (`backend/routes/schedules.js`)
**Endpoint**: `GET /api/schedules/routes`

**New Fields Added**:
- `schedule_count`: Total number of schedules using this route
- `active_schedule_count`: Number of active (scheduled) schedules

```sql
SELECT 
    r.*,
    (SELECT COUNT(*) FROM Schedules WHERE route_id = r.id) as schedule_count,
    (SELECT COUNT(*) FROM Schedules WHERE route_id = r.id AND status = 'Scheduled') as active_schedule_count
FROM Routes r 
ORDER BY origin, destination
```

#### 4. Enhanced Buses GET Endpoint (`backend/routes/admin.js`)
**Endpoint**: `GET /api/admin/buses`

**New Fields Added**:
- `schedule_count`: Total number of schedules using this bus
- `active_schedule_count`: Number of active (scheduled) schedules

```sql
SELECT 
    b.*,
    (SELECT COUNT(*) FROM Schedules WHERE bus_id = b.id) as schedule_count,
    (SELECT COUNT(*) FROM Schedules WHERE bus_id = b.id AND status = 'Scheduled') as active_schedule_count
FROM Buses b 
ORDER BY bus_number
```

### Frontend Changes (`frontend/src/components/ScheduleManagement.jsx`)

#### 1. Improved Delete Handler
- ✅ Smart error handling for different entity types
- ✅ Shows detailed information for routes and buses
- ✅ Displays schedule counts in error messages
- ✅ Shows suggestions to users

**Enhanced Error Display**:
```javascript
// For routes/buses with schedules:
const detailMessage = `${errorMessage}\n\n` +
    `Total schedules: ${scheduleCount}\n` +
    `Active schedules: ${activeScheduleCount}\n\n` +
    `${suggestion}`;
```

#### 2. Enhanced Route Table
**New Features**:
- ✅ Added "Schedules" column showing count breakdown
- ✅ Shows active schedule count in green
- ✅ Delete button replaced with "🔒 Has Schedules" when schedules exist
- ✅ Tooltip explains why deletion is blocked
- ✅ Delete button only shown when no schedules exist

**Visual Display**:
```
┌─────────────────────────────────────────┐
│ Schedules Column:                       │
│ • "5 total (2 active)" - Has schedules  │
│ • "0 total" - No schedules              │
└─────────────────────────────────────────┘

┌─────────────────────────────────────────┐
│ Actions Column:                         │
│ • 🔒 Has Schedules - Cannot delete      │
│ • 🗑️ Delete - Can delete                │
└─────────────────────────────────────────┘
```

#### 3. Enhanced Bus Table
**New Features**:
- ✅ Added "Schedules" column showing count breakdown
- ✅ Shows active schedule count in green
- ✅ Delete button replaced with "🔒 Has Schedules" when schedules exist
- ✅ Tooltip explains why deletion is blocked
- ✅ Delete button only shown when no schedules exist

## 📊 User Experience Flow

### Scenario 1: Route with No Schedules
```
Admin views route list
  → Route shows "0 total" in Schedules column
  → "🗑️ Delete" button is active
  → Admin clicks Delete
  → Confirmation dialog
  → Route deleted successfully
  → ✅ Success message
```

### Scenario 2: Route with Schedules (Attempting to Delete)
```
Admin views route list
  → Route shows "5 total (2 active)" in Schedules column
  → Shows "🔒 Has Schedules" instead of delete button
  → Hovering shows tooltip: "Cannot delete: 5 schedule(s) exist"
  
IF admin somehow tries to delete via API:
  → Error toast appears with detailed info:
    "Cannot delete route with existing schedules.
     Please delete or cancel all schedules first.
     
     Total schedules: 5
     Active schedules: 2
     
     Cancel active schedules before deleting this route"
  → Admin is guided to cancel schedules first
```

### Scenario 3: Bus with Completed Schedules Only
```
Admin views bus list
  → Bus shows "3 total (0 active)" in Schedules column
  → Shows "🔒 Has Schedules" (even if all completed)
  
IF admin tries to delete:
  → Error message:
    "Total schedules: 3
     Active schedules: 0
     
     Delete completed/cancelled schedules before deleting this bus"
  → Admin needs to clean up historical schedules
```

## 🎨 UI Improvements

### Visual Indicators

**Schedule Count Display**:
```jsx
// No schedules
"0 total"

// Has schedules, none active
"5 total"

// Has schedules with active ones
"5 total (2 active)"  // active count in green
```

**Action Button States**:
```jsx
// Can delete (no schedules)
<button className="text-signal-red">
    🗑️ Delete
</button>

// Cannot delete (has schedules)
<span className="text-gray-400" title="Cannot delete: 5 schedule(s) exist">
    🔒 Has Schedules
</span>
```

### Color Coding
- 🟢 **Green**: Active schedule count (actionable)
- 🔴 **Red**: Delete button (destructive action)
- ⚫ **Gray**: Locked/disabled state
- 🔵 **Blue**: Informational text

## 🔍 Technical Details

### Database Queries

**Checking Route Schedules**:
```sql
-- Get total count
SELECT COUNT(*) as count 
FROM Schedules 
WHERE route_id = ?

-- Get active count
SELECT COUNT(*) as count 
FROM Schedules 
WHERE route_id = ? AND status = 'Scheduled'
```

**Checking Bus Schedules**:
```sql
-- Get total count
SELECT COUNT(*) as count 
FROM Schedules 
WHERE bus_id = ?

-- Get active count
SELECT COUNT(*) as count 
FROM Schedules 
WHERE bus_id = ? AND status = 'Scheduled'
```

### API Response Structure

**Success Response** (no schedules):
```json
{
  "success": true,
  "message": "Route deleted successfully"
}
```

**Error Response** (has schedules):
```json
{
  "success": false,
  "message": "Cannot delete route with existing schedules...",
  "scheduleCount": 5,
  "activeScheduleCount": 2,
  "suggestion": "Cancel active schedules before deleting this route"
}
```

## 📋 Benefits

### ✅ Data Protection
- Prevents accidental deletion of routes/buses in use
- Maintains referential integrity
- Protects schedule history

### ✅ Better User Experience
- Clear visual indicators (schedule counts)
- Proactive prevention (disabled buttons)
- Informative error messages
- Actionable suggestions

### ✅ Administrative Guidance
- Shows what needs to be done
- Differentiates between active and historical schedules
- Provides clear next steps

### ✅ Improved Visibility
- Schedule counts visible at a glance
- Active schedules highlighted
- Tooltip explanations

## 🧪 Testing Checklist

### Route Deletion
- [ ] Create route with no schedules → Can delete
- [ ] Create route with only completed schedules → Cannot delete, shows correct message
- [ ] Create route with active schedules → Cannot delete, shows active count
- [ ] Verify schedule counts display correctly
- [ ] Check tooltip on locked state
- [ ] Verify delete button only shows when applicable

### Bus Deletion
- [ ] Create bus with no schedules → Can delete
- [ ] Create bus with only cancelled schedules → Cannot delete, shows correct message
- [ ] Create bus with active schedules → Cannot delete, shows active count
- [ ] Verify schedule counts display correctly
- [ ] Check tooltip on locked state
- [ ] Verify delete button only shows when applicable

### UI/UX
- [ ] Schedule counts update after creating/deleting schedules
- [ ] Active schedule count shows in green
- [ ] Tooltips display on hover
- [ ] Error toasts show for 5 seconds with full details
- [ ] Delete buttons have hover animations
- [ ] Locked state shows correct icon and text

## 🔄 Related Features

This fix complements the schedule deletion feature:
- **Schedule Deletion**: Cannot delete with bookings → offers cancellation
- **Route Deletion**: Cannot delete with schedules → must remove schedules first
- **Bus Deletion**: Cannot delete with schedules → must remove schedules first

### Deletion Hierarchy
```
Bus/Route
    └── Schedules
            └── Bookings

To delete a Bus/Route:
  1. Cancel or complete all schedules
  2. Then delete the bus/route

To delete a Schedule:
  1. Cancel all bookings (or wait for no bookings)
  2. Then delete the schedule
```

## 📝 Future Enhancements

1. **Bulk Operations**
   - Bulk cancel schedules for a route
   - Bulk delete completed schedules

2. **Archive Instead of Delete**
   - Archive routes instead of deleting
   - Maintain historical data

3. **Cascade Operations**
   - Option to cascade delete (with confirmation)
   - Automatically handle dependent schedules

4. **Advanced Filtering**
   - Filter routes by schedule count
   - Filter buses by utilization

## 🎯 Summary

The route and bus deletion fix provides:
- 🛡️ **Protection**: Prevents deletion of entities with dependencies
- 📊 **Visibility**: Shows schedule counts and status
- 💡 **Guidance**: Clear messages on what to do
- 🎨 **UX**: Intuitive visual indicators
- 🔧 **Maintainability**: Clean, consistent approach

Users now have full transparency and guidance when managing routes and buses, with the system preventing accidental data loss while clearly explaining constraints.
