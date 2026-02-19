# 📦 Bulk Delete Feature Guide

## Overview
The admin panel now supports **bulk selection and deletion** for schedules, routes, and buses. This feature allows administrators to efficiently manage multiple items at once with smart deletion protection.

---

## 🎯 Features

### 1. **Bulk Selection**
- ✅ **Select Multiple Mode**: Toggle selection mode with dedicated button
- ✅ **Individual Selection**: Click checkboxes to select specific items
- ✅ **Shift-Click Range**: Hold Shift and click to select a range
- ✅ **Select All**: One-click to select/deselect all items
- ✅ **Visual Feedback**: Selected rows highlighted in blue

### 2. **Smart Deletion**
- ✅ **Protection Rules**: Items with dependencies are automatically skipped
- ✅ **Batch Processing**: Deletes multiple items in a single request
- ✅ **Summary Results**: Shows deleted, skipped, and error counts
- ✅ **Detailed Feedback**: Explains why items were skipped

### 3. **Protection Logic**

#### Schedules
- ❌ **Cannot delete** if it has confirmed bookings
- ✅ **Can delete** if no bookings or only cancelled bookings
- 📊 **Displays**: Booking count in skip reason

#### Routes
- ❌ **Cannot delete** if it has schedules
- ✅ **Can delete** if no schedules exist
- 📊 **Displays**: Schedule count in skip reason

#### Buses
- ❌ **Cannot delete** if it has schedules
- ✅ **Can delete** if no schedules exist
- 📊 **Displays**: Schedule count in skip reason

---

## 📖 How to Use

### For Schedules 📅

1. **Navigate to Schedules Tab**
   ```
   Admin Dashboard → 📅 Schedules
   ```

2. **Enable Selection Mode**
   ```
   Click: [☑️ Select Multiple]
   Button turns purple: [✓ Selection Mode]
   ```

3. **Select Items**
   - **Individual**: Click checkboxes next to schedules
   - **Range**: Select first item, hold Shift, click last item
   - **All**: Click [☑️ Select All]

4. **Delete Selected**
   ```
   Click: [🗑️ Delete Selected (X)]
   Confirm: "Are you sure you want to delete X schedule(s)?"
   ```

5. **Review Results**
   ```
   Toast notification shows:
   ✅ Deleted: X schedules removed
   ⚠️ Skipped: Y schedules (has bookings)
   ❌ Errors: Z failures
   ```

### For Routes 🛣️

1. **Navigate to Routes Tab**
   ```
   Admin Dashboard → 🛣️ Routes
   ```

2. **Enable Selection Mode**
   ```
   Click: [☑️ Select Multiple]
   ```

3. **Select Routes**
   - Use checkboxes or shift-click for ranges
   - Routes with schedules show 🔒 indicator but can still be selected

4. **Delete Selected**
   ```
   Click: [🗑️ Delete Selected (X)]
   System automatically skips routes with schedules
   ```

5. **Review Results**
   ```
   ✅ Deleted: Routes without schedules
   ⚠️ Skipped: Routes with schedules (shows count)
   ```

### For Buses 🚌

1. **Navigate to Buses Tab**
   ```
   Admin Dashboard → 🚌 Buses
   ```

2. **Enable Selection Mode**
   ```
   Click: [☑️ Select Multiple]
   ```

3. **Select Buses**
   - Use checkboxes or shift-click for ranges
   - Buses with schedules show 🔒 indicator

4. **Delete Selected**
   ```
   Click: [🗑️ Delete Selected (X)]
   System automatically skips buses with schedules
   ```

5. **Review Results**
   ```
   ✅ Deleted: Buses without schedules
   ⚠️ Skipped: Buses with schedules (shows count)
   ```

---

## 🎨 UI Elements

### Action Buttons

#### Selection Mode Toggle
```
[☑️ Select Multiple]  ← Click to enable
[✓ Selection Mode]     ← Active state (purple)
```

#### Selection Actions (appears when in selection mode)
```
[☑️ Select All]              ← Select/deselect all items
[🗑️ Delete Selected (5)]     ← Delete button (red when items selected)
```

### Visual States

#### Normal Row
```css
Background: Transparent with hover effect
Hover: White/60% opacity
```

#### Selected Row
```css
Background: Blue-100/70%
Checkbox: Checked
Visual: Highlighted border
```

#### Protected Item
```
🔒 Has Schedules  ← Route/Bus with schedules
🔒 Has Bookings   ← Schedule with bookings
```

---

## 🔧 API Endpoints

### Bulk Delete Schedules
```http
POST /api/admin/schedules/bulk-delete
Authorization: Bearer <admin-token>
Content-Type: application/json

{
  "scheduleIds": [1, 2, 3, 4, 5]
}
```

**Response:**
```json
{
  "message": "Bulk delete completed",
  "summary": {
    "total": 5,
    "deleted": 3,
    "skipped": 2,
    "errors": 0
  },
  "results": {
    "deleted": [1, 2, 3],
    "skipped": [
      {
        "id": 4,
        "reason": "Cannot delete schedule with bookings",
        "bookingCount": 5
      },
      {
        "id": 5,
        "reason": "Cannot delete schedule with bookings",
        "bookingCount": 2
      }
    ],
    "errors": []
  }
}
```

### Bulk Delete Routes
```http
POST /api/admin/routes/bulk-delete
Authorization: Bearer <admin-token>
Content-Type: application/json

{
  "routeIds": [1, 2, 3]
}
```

**Response:**
```json
{
  "message": "Bulk delete completed",
  "summary": {
    "total": 3,
    "deleted": 2,
    "skipped": 1,
    "errors": 0
  },
  "results": {
    "deleted": [1, 2],
    "skipped": [
      {
        "id": 3,
        "reason": "Cannot delete route with schedules",
        "scheduleCount": 8
      }
    ],
    "errors": []
  }
}
```

### Bulk Delete Buses
```http
POST /api/admin/buses/bulk-delete
Authorization: Bearer <admin-token>
Content-Type: application/json

{
  "busIds": [1, 2, 3]
}
```

**Response:**
```json
{
  "message": "Bulk delete completed",
  "summary": {
    "total": 3,
    "deleted": 2,
    "skipped": 1,
    "errors": 0
  },
  "results": {
    "deleted": [1, 2],
    "skipped": [
      {
        "id": 3,
        "reason": "Cannot delete bus with schedules",
        "scheduleCount": 5
      }
    ],
    "errors": []
  }
}
```

---

## 💡 Best Practices

### 1. **Review Before Deleting**
- Check selected items count
- Consider cancelling schedules instead of deleting
- Routes with schedules will be automatically skipped

### 2. **Use Shift-Click for Efficiency**
- Select first item
- Hold Shift + click last item
- All items in range are selected

### 3. **Handle Dependencies First**
- To delete a route: First delete/cancel its schedules
- To delete a bus: First delete/cancel its schedules
- To delete a schedule: First cancel if it has bookings

### 4. **Exit Selection Mode**
- Click [✓ Selection Mode] again to exit
- Selections are cleared when exiting
- Individual delete buttons return

---

## 🚨 Error Scenarios

### Scenario 1: All Items Skipped
```
Action: Try to delete 5 routes, all have schedules
Result: "Deleted: 0, Skipped: 5"
Solution: Delete schedules first, then retry
```

### Scenario 2: Partial Success
```
Action: Delete 10 schedules
Result: "Deleted: 7, Skipped: 3"
Reason: 3 schedules have confirmed bookings
Solution: Cancel those 3 schedules instead
```

### Scenario 3: Network Error
```
Action: Delete selected items
Result: "Failed to delete items"
Solution: Check connection, verify admin token, retry
```

---

## 🎬 User Workflows

### Workflow 1: Clean Up Old Schedules
```
1. Go to Schedules tab
2. Enable selection mode
3. Shift-click to select date range
4. Click "Delete Selected"
5. Review results (schedules with bookings skipped)
6. Cancel skipped schedules if needed
7. Retry bulk delete for cancelled schedules
```

### Workflow 2: Remove Unused Routes
```
1. Go to Routes tab
2. Enable selection mode
3. Select routes without schedules (no 🔒 icon)
4. Click "Delete Selected"
5. All selected routes deleted (no skips)
```

### Workflow 3: Decommission Buses
```
1. Check bus schedule counts
2. Go to Schedules tab
3. Delete/cancel all schedules for target buses
4. Go to Buses tab
5. Enable selection mode
6. Select retired buses
7. Click "Delete Selected"
8. Buses successfully removed
```

---

## 🎯 Tips & Tricks

### Tip 1: Visual Scanning
- 🔒 icon = Has dependencies = Will be skipped
- No icon = Safe to delete
- Use this to pre-filter selections

### Tip 2: Keyboard Shortcuts
- Shift + Click = Range select
- Works across pages (if pagination added)

### Tip 3: Batch Operations
- Group similar items together
- Delete in batches of 10-20 for easier tracking
- Review results after each batch

### Tip 4: Safety First
- Selection mode prevents accidental clicks
- Confirmation dialog provides second chance
- Skipped items remain untouched

---

## 🔐 Security

### Authorization
- ✅ Requires admin JWT token
- ✅ Token validated on every request
- ✅ Only admin users can access bulk delete

### Data Integrity
- ✅ Foreign key checks prevent orphaned records
- ✅ Cascade rules properly applied
- ✅ Transaction rollback on errors

### Audit Trail
- 📊 All operations logged
- 📊 Deleted IDs tracked in response
- 📊 Skipped items with reasons recorded

---

## 📊 Performance

### Optimization
- Single database transaction per bulk operation
- Batch checking for dependencies
- Parallel deletion processing
- Efficient query structure

### Limits
- Recommended: 50 items per batch
- Maximum: 100 items per request
- Large batches split automatically

---

## 🐛 Troubleshooting

### Issue: Selection Mode Not Working
**Symptoms**: Checkboxes don't appear
**Solution**: Refresh page, verify admin login

### Issue: All Items Skipped
**Symptoms**: Nothing deleted, all skipped
**Solution**: Check dependencies, remove child records first

### Issue: Partial Deletion
**Symptoms**: Some items deleted, some skipped
**Solution**: This is normal! Check skip reasons in console

### Issue: Button Disabled
**Symptoms**: Delete button greyed out
**Solution**: Select at least one item first

---

## 📝 Change Log

### Version 1.0 (Current)
- ✅ Bulk selection for schedules, routes, and buses
- ✅ Shift-click range selection
- ✅ Smart deletion protection
- ✅ Detailed result summaries
- ✅ Visual feedback and highlighting
- ✅ Backend endpoints with batch processing
- ✅ Frontend UI with selection mode

---

## 🎓 Learning Resources

### Related Features
- [Schedule Deletion Protection](SCHEDULE_DELETION_IMPROVEMENT.md)
- [Route & Bus Deletion Fix](ROUTE_BUS_DELETION_FIX.md)
- [Admin Endpoints Guide](ADMIN_ENDPOINTS.md)

### API Documentation
- See `ADMIN_ENDPOINTS.md` for full API reference
- See backend code for implementation details

---

## ✨ Summary

Bulk delete feature provides:
- **Efficiency**: Delete multiple items at once
- **Safety**: Smart protection prevents data loss
- **Flexibility**: Range selection with shift-click
- **Transparency**: Clear feedback on results
- **Consistency**: Same behavior across all entities

**Result**: Powerful admin tool that saves time while protecting data integrity! 🎉
