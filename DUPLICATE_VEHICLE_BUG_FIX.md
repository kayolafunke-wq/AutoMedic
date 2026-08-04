# 🐛 Duplicate Vehicle in Multiple Appointments - Bug Fix

## Issue Description

**Problem:** When a customer creates a second appointment while the first is still in progress, the second appointment uses the FIRST vehicle's details even if they wanted to book a different car.

**Example:**
- Customer has 2 vehicles: Honda Fit and Honda Hazel
- Creates Appointment #1 for Honda Fit ✅
- Goes to create Appointment #2 for Honda Hazel
- BUT Appointment #2 gets created with Honda Fit details ❌

## Root Cause

Located in `/frontend/src/pages/BookingPage.jsx` lines 48-61:

```javascript
api.get('/vehicles/my').then(r => {
  const myVehicles = r.data.data || []
  setVehicles(myVehicles)
  if (myVehicles.length > 0) {
    const first = myVehicles[0]  // ❌ BUG: ALWAYS auto-selects FIRST vehicle!
    setForm(f => ({
      ...f,
      make: f.make || first.make || '',
      model: f.model || first.model || '',
      year: f.year || first.year || '',
      color: f.color || first.color || '',
      registration_number: f.registration_number || first.registration_number || '',
      chassis_number: f.chassis_number || first.chassis_number || ''
    }))
  }
}).catch(() => {})
```

**The Problem:**
1. When booking page loads, it fetches customer's vehicles
2. It **automatically** pre-fills the form with the FIRST vehicle from the array
3. Customer doesn't notice the pre-filled values
4. When they submit, it creates appointment for the FIRST vehicle

## The Fix

### Solution: Add Vehicle Selector Dropdown

Instead of auto-filling with first vehicle, let customer **choose** which vehicle to use.

**Changes Required:**

1. **Add vehicle dropdown** before vehicle details fields
2. **Remove auto-fill logic** that selects first vehicle
3. **Add "New Vehicle" option** for customers adding a new car

### Implementation

**Step 1: Add state for selected vehicle**
```javascript
const [selectedVehicleId, setSelectedVehicleId] = useState('new')
```

**Step 2: Remove auto-fill logic**
```javascript
api.get('/vehicles/my').then(r => {
  const myVehicles = r.data.data || []
  setVehicles(myVehicles)
  // ✅ DO NOT auto-select - let customer choose!
}).catch(() => {})
```

**Step 3: Add vehicle selector handler**
```javascript
const handleVehicleChange = (vehicleId) => {
  setSelectedVehicleId(vehicleId)
  if (vehicleId === 'new') {
    // Clear form for new vehicle
    setForm(f => ({
      ...f,
      make: '', model: '', year: '', color: '',
      registration_number: '', chassis_number: ''
    }))
  } else {
    // Fill form with selected vehicle
    const vehicle = vehicles.find(v => v.id === vehicleId)
    if (vehicle) {
      setForm(f => ({
        ...f,
        make: vehicle.make,
        model: vehicle.model,
        year: vehicle.year,
        color: vehicle.color,
        registration_number: vehicle.registration_number,
        chassis_number: vehicle.chassis_number
      }))
    }
  }
}
```

**Step 4: Add dropdown to form (before vehicle fields)**
```jsx
{/* Vehicle Selector */}
{vehicles.length > 0 && (
  <div className="mb-6">
    <label className="block text-sm font-semibold text-dark mb-2">
      Select Vehicle
    </label>
    <select
      value={selectedVehicleId}
      onChange={(e) => handleVehicleChange(e.target.value)}
      className="w-full px-4 py-3 border border-gray-200 rounded-xl text-sm focus:outline-none focus:border-primary"
    >
      <option value="new">➕ Add New Vehicle</option>
      {vehicles.map(v => (
        <option key={v.id} value={v.id}>
          🚗 {v.make} {v.model} ({v.registration_number})
        </option>
      ))}
    </select>
    <p className="text-xs text-gray-500 mt-1">
      {selectedVehicleId === 'new' 
        ? 'Enter details for a new vehicle below' 
        : 'Using saved vehicle details (you can edit them)'}
    </p>
  </div>
)}

{/* Existing vehicle input fields below */}
```

## Testing After Fix

### Test Case 1: First-Time Customer (No Vehicles)
1. Open booking page
2. No dropdown appears (customer has no saved vehicles)
3. Enter new vehicle details
4. Submit appointment
5. **Expected:** Appointment created with entered vehicle ✅

### Test Case 2: Returning Customer (Has Vehicles)
1. Open booking page
2. Dropdown shows: "Add New Vehicle" + list of saved vehicles
3. **Option A:** Select existing vehicle from dropdown
   - Form auto-fills with vehicle details
   - Submit creates appointment for selected vehicle ✅
4. **Option B:** Select "Add New Vehicle"
   - Form clears
   - Enter new vehicle details
   - Submit creates appointment for new vehicle ✅

### Test Case 3: Multiple Appointments
1. Customer has Honda Fit and Honda Hazel
2. Create Appointment #1:
   - Select "Honda Fit" from dropdown
   - Submit ✅
3. Create Appointment #2:
   - Dropdown still shows both vehicles
   - Select "Honda Hazel" from dropdown
   - Form fills with Hazel details
   - Submit ✅
4. **Expected:** 
   - Appointment #1 → Honda Fit ✅
   - Appointment #2 → Honda Hazel ✅

## Benefits

1. ✅ **Explicit Choice** - Customer actively selects vehicle
2. ✅ **Clear Intent** - No accidental wrong vehicle
3. ✅ **Better UX** - Can reuse saved vehicles OR add new ones
4. ✅ **No Duplicates** - Each appointment uses correct vehicle

## File to Modify

`frontend/src/pages/BookingPage.jsx`

- Lines 17-64: State and useEffect logic
- Lines 160-250 (approx): Add vehicle selector dropdown in form

## Deployment

1. Make changes to BookingPage.jsx
2. Test locally with multiple vehicles
3. Commit and push
4. Test on production with customer who has multiple vehicles
5. Verify each appointment uses correct vehicle

---

**Status:** 🔍 FIX DESIGNED - AWAITING IMPLEMENTATION  
**Priority:** MEDIUM (workaround: customers can manually edit fields)  
**Impact:** Affects customers with multiple vehicles booking multiple appointments
