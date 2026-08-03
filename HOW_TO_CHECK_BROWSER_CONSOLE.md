# 🔍 How to Check Browser Console

## Quick Steps

### 1. Open Your Inspection Form
Go to: https://automedic-mw.up.railway.app/technician

### 2. Open Developer Tools
**Press F12 on your keyboard**

OR

**Right-click anywhere** → Click **"Inspect"**

### 3. Click Console Tab
You'll see several tabs (Elements, Console, Network, etc.)
- Click **"Console"**

### 4. Keep Console Open
Leave the console open while you:
- Create inspection
- Upload photos
- Submit form

### 5. Watch for Messages
Look for messages starting with:
- 📸 (camera emoji)
- ✅ (checkmark)
- ❌ (red X)
- ⚠️ (warning triangle)

---

## What You'll See

### Good Messages (Photos Working):
```
📸 Uploading 3 photos for inspection...
  Uploading: before - photo1.jpg (245KB)
  ✅ Photo uploaded successfully
  Uploading: damage - photo2.jpg (312KB)
  ✅ Photo uploaded successfully
  Uploading: dashboard - photo3.jpg (189KB)
  ✅ Photo uploaded successfully
✅ All 3 photos uploaded!
```

### Bad Messages (Photos Not Working):
```
📸 Uploading 0 photos for inspection...
⚠️ No photos to upload - inspection will have 0 photos
```

OR

```
❌ Photo upload failed: Network Error
```

---

## Screenshot Instructions

If you need to share the console with me:

1. **Make sure all messages are visible**
2. **Press Ctrl + Shift + S** (or use your screenshot tool)
3. **Capture the console window**
4. **Share the screenshot**

---

## Keyboard Shortcuts

| Action | Windows/Linux | Mac |
|--------|---------------|-----|
| Open DevTools | **F12** | **Cmd + Option + I** |
| Open Console | **Ctrl + Shift + J** | **Cmd + Option + J** |
| Clear Console | **Ctrl + L** | **Cmd + K** |
| Screenshot | **Ctrl + Shift + S** | **Cmd + Shift + 5** |

---

## Common Browser Locations

### Chrome / Edge
- Click menu (⋮) → More tools → Developer tools → Console

### Firefox
- Click menu (≡) → More tools → Web Developer Tools → Console

### Safari
- Develop menu → Show JavaScript Console
- (Enable Develop menu: Preferences → Advanced → Show Develop menu)

---

## What I Need to See

When you check the console, I need to know:

1. **How many photos** the console says it's uploading
   - "📸 Uploading **X** photos for inspection..."
   
2. **If upload succeeded or failed**
   - ✅ Success messages
   - ❌ Error messages

3. **Any red error messages** (these are JavaScript errors)

---

## Try This Now

1. Open https://automedic-mw.up.railway.app/technician
2. Press **F12**
3. Click **Console** tab
4. Create new inspection
5. Upload photos in Step 3
6. Submit form
7. **Tell me what you see in the console!**

---

That's it! Once you check the console and tell me what messages you see, I'll know exactly what's causing the photo issue! 🎯
