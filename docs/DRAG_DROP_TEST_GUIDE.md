# 🧪 Drag & Drop Topics - Testing Guide

## Test Environment
- **URL**: http://localhost:3002/admin/semester-management
- **Required**: Admin authentication

---

## ✅ Test Cases

### 1. **Create Mode - Basic Drag & Drop**

#### Test Steps:
1. Navigate to **Semester Management**
2. Click on **"Create New"** tab
3. Fill in semester details:
   - Title: "Test Semester"
   - Section: "TEST_01"
   - Description: "Testing drag-and-drop"
4. Click **"Add Course"**
5. Fill in course details
6. Add **3 topics** by clicking "Add Topic" three times
7. Name them:
   - Topic 1: "Introduction"
   - Topic 2: "Advanced Concepts"
   - Topic 3: "Best Practices"

#### Expected Results:
- ✅ Purple badge "Drag to Reorder Topics" visible in header
- ✅ Info tip appears above topics: "Tip: Click and hold the grip icon..."
- ✅ Each topic shows grip icon (⋮⋮) on the left

#### Drag Test:
8. Hover over grip icon on "Topic 1"
   - **Expected**: Cursor changes to grab (open hand)
   - **Expected**: Tooltip appears: "Hold and drag to reorder topics"
9. Click and hold grip icon on "Topic 1"
   - **Expected**: Cursor changes to grabbing (closed fist)
10. Drag "Topic 1" down below "Topic 3"
    - **Expected**: Topic becomes semi-transparent (50% opacity)
    - **Expected**: Shadow effect visible
    - **Expected**: Other topics shift to make space
11. Release mouse button
    - **Expected**: Toast notification: "✅ Topic order updated"
    - **Expected**: New order displayed:
      - Topic 1: "Advanced Concepts"
      - Topic 2: "Best Practices"
      - Topic 3: "Introduction"

#### Save Test:
12. Click **"Save Semester"** at bottom
13. Wait for success message
14. Navigate back to list view
15. Click **"Edit"** on the newly created semester
16. Expand the course
    - **Expected**: Topics are in the new order
    - **Expected**: Order indices are: 0, 1, 2

---

### 2. **Edit Mode - Drag & Drop**

#### Test Steps:
1. From the list view, click **"Edit"** on any existing semester
2. Expand a course with **at least 2 topics**

#### Expected Results:
- ✅ Purple badge "Drag to Reorder Topics" visible in header
- ✅ Description mentions: "Topics can be reordered by dragging"
- ✅ Info tip appears if 2+ topics exist
- ✅ Each topic has grip icon (⋮⋮)

#### Drag Test:
3. Drag the last topic to the first position
4. Verify toast: "✅ Topic order updated"
5. Click **"Save Semester"**
6. Refresh the page or navigate away and back
7. Verify the new order persists

---

### 3. **Multiple Topics - Stress Test**

#### Test Steps:
1. Create a course with **5 topics**:
   - "Topic A"
   - "Topic B"
   - "Topic C"
   - "Topic D"
   - "Topic E"

#### Drag Tests:
2. **Test 1**: Drag "Topic A" to position 3 (between C and D)
   - **Expected Order**: B, C, A, D, E
   - **Expected Indices**: 0, 1, 2, 3, 4
3. **Test 2**: Drag "Topic E" to position 1 (between B and C)
   - **Expected Order**: B, E, C, A, D
4. **Test 3**: Drag "Topic D" to top
   - **Expected Order**: D, B, E, C, A
5. **Test 4**: Drag "Topic A" to bottom
   - **Expected Order**: D, B, E, C, A
6. Verify each drag shows toast notification
7. Save and verify persistence

---

### 4. **Expanded Topic - Drag Test**

#### Test Steps:
1. Create a course with 3 topics
2. Click on "Topic 2" to expand it
3. Fill in some content (title, description, slides)
4. While still expanded, drag "Topic 2" to position 1

#### Expected Results:
- ✅ Topic can be dragged even when expanded
- ✅ Expanded content moves with the topic
- ✅ Topic remains expanded after drag
- ✅ Content is preserved
- ✅ Toast notification appears

---

### 5. **Single Topic - No Drag Needed**

#### Test Steps:
1. Create a course with only **1 topic**

#### Expected Results:
- ✅ Grip icon still visible
- ✅ Info tip does NOT appear (only shows for 2+ topics)
- ✅ Topic cannot be dragged (no other position to move to)

---

### 6. **Keyboard Accessibility Test**

#### Test Steps:
1. Create a course with 3 topics
2. Press **Tab** until grip icon is focused
3. Press **Space** or **Enter** to activate drag mode
4. Use **Arrow Keys** (↑/↓) to move topic
5. Press **Enter** to drop
6. Press **Escape** to cancel drag

#### Expected Results:
- ✅ Focus visible on grip icon
- ✅ Arrow keys move topic position
- ✅ Enter drops topic in new position
- ✅ Escape cancels and returns to original position

---

### 7. **Multi-Course Test**

#### Test Steps:
1. Create a semester with **2 courses**
2. Course 1: Add 3 topics
3. Course 2: Add 3 topics
4. Drag topics in Course 1
5. Drag topics in Course 2

#### Expected Results:
- ✅ Dragging in Course 1 only affects Course 1 topics
- ✅ Dragging in Course 2 only affects Course 2 topics
- ✅ No cross-contamination between courses
- ✅ Each course maintains its own topic order

---

### 8. **Visual Feedback Test**

#### Visual Elements to Verify:
- ✅ Grip icon (⋮⋮) is gray/muted color
- ✅ Grip icon background becomes accent color on hover
- ✅ Cursor changes: normal → grab → grabbing
- ✅ Tooltip appears on hover
- ✅ Dragged item has 50% opacity
- ✅ Dragged item has shadow-lg effect
- ✅ Smooth transition animations
- ✅ Purple left border on topic cards

---

### 9. **Edge Cases**

#### Test Case A: Drag to Same Position
1. Drag a topic and drop it in the same position
   - **Expected**: No toast notification
   - **Expected**: No order change

#### Test Case B: Fast Multiple Drags
1. Quickly drag multiple topics in succession
   - **Expected**: Each drag completes properly
   - **Expected**: Order updates correctly
   - **Expected**: No race conditions

#### Test Case C: Drag During Expansion
1. Start dragging a topic
2. While dragging, try to click to expand
   - **Expected**: Drag completes first
   - **Expected**: Click is ignored during drag

---

### 10. **Save & Persistence Test**

#### Full Workflow:
1. Create new semester with topics
2. Reorder topics using drag-and-drop
3. Save semester
4. Navigate away to list view
5. Edit the same semester
6. Verify topics are in the new order
7. Reorder again
8. Save
9. Refresh browser page
10. Edit again
11. Verify persistence

#### Expected Results:
- ✅ Order persists after save
- ✅ Order persists after navigation
- ✅ Order persists after browser refresh
- ✅ Order indices are correct in database

---

## 🐛 Known Issues / Limitations

1. **Minimum Drag Distance**: 8px movement required to activate drag (prevents accidental drags)
2. **Single Topic**: Grip icon visible but no drag functionality needed
3. **Touch Devices**: May require longer press to activate drag

---

## 🔍 Debug Tips

### If drag doesn't work:
1. Check console for errors
2. Verify `@dnd-kit` packages are installed
3. Check if topics array is empty
4. Verify DndContext is wrapping topics

### If order doesn't persist:
1. Check network tab for API calls
2. Verify PUT/POST request includes topics with order_index
3. Check backend API logs
4. Verify database schema has order_index column

### If visual feedback is missing:
1. Check CSS transitions are enabled
2. Verify Tailwind classes are loaded
3. Check browser DevTools for style issues

---

## 📊 Performance Metrics

### Expected Performance:
- **Drag Start**: < 50ms
- **Drag Animation**: 60fps
- **Drop Animation**: < 150ms
- **State Update**: < 100ms
- **Toast Display**: < 50ms

### Large Lists:
- **10 Topics**: Smooth performance
- **20 Topics**: Acceptable performance
- **50+ Topics**: May need virtualization (future enhancement)

---

## ✨ Success Criteria

**All tests pass if:**
- ✅ Topics can be dragged in both create and edit modes
- ✅ Visual feedback is clear and responsive
- ✅ Order changes persist after save
- ✅ No console errors during drag operations
- ✅ Keyboard navigation works
- ✅ Multi-course scenarios work independently
- ✅ Toast notifications appear correctly
- ✅ Expanded topics can still be dragged

---

## 📝 Test Report Template

```
Test Date: [DATE]
Tester: [NAME]
Browser: [Chrome/Firefox/Safari] [VERSION]

| Test Case | Status | Notes |
|-----------|--------|-------|
| Create Mode Basic Drag | ✅/❌ | |
| Edit Mode Drag | ✅/❌ | |
| Multiple Topics | ✅/❌ | |
| Expanded Topic Drag | ✅/❌ | |
| Single Topic | ✅/❌ | |
| Keyboard Access | ✅/❌ | |
| Multi-Course | ✅/❌ | |
| Visual Feedback | ✅/❌ | |
| Edge Cases | ✅/❌ | |
| Save & Persistence | ✅/❌ | |

Overall Status: ✅ PASS / ❌ FAIL
```

---

**Happy Testing! 🎉**
