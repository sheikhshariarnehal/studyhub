# 🎯 Drag & Drop Quick Reference

## 🚀 Quick Start

### Access the Feature
```
URL: http://localhost:3002/admin/semester-management
Mode: Create New OR Edit Semester
```

### Basic Usage
1. **Add Topics** → Click "Add Topic" button
2. **Find Grip Icon** → Look for ⋮⋮ on left side of each topic
3. **Drag** → Click and hold grip icon, move up/down
4. **Drop** → Release to place topic in new position
5. **Save** → Click "Save Semester" button

---

## 🎨 Visual Indicators

| Element | Description | Action |
|---------|-------------|--------|
| ⋮⋮ | Drag handle | Click and hold to drag |
| 🟣 Badge | "Drag to Reorder" | Feature indicator |
| 💡 Info Tip | Blue banner | Shows when 2+ topics |
| 👆 Cursor: grab | Open hand | Hover over grip |
| ✊ Cursor: grabbing | Closed fist | During drag |
| 👻 50% opacity | Semi-transparent | While dragging |
| 🎭 Shadow | Drop shadow | Elevates dragged item |
| ✅ Toast | Success message | After drop |

---

## ⌨️ Keyboard Shortcuts

| Key | Action |
|-----|--------|
| `Tab` | Focus grip icon |
| `Space` / `Enter` | Start drag |
| `↑` `↓` | Move topic |
| `Enter` | Drop in position |
| `Escape` | Cancel drag |

---

## 📋 Common Tasks

### Reorder 3 Topics
```
Before:  1. Intro  2. Advanced  3. Best Practices
Action:  Drag "Intro" to bottom
After:   1. Advanced  2. Best Practices  3. Intro
Result:  order_index: [0, 1, 2] ✅
```

### Move Topic to Top
```
Current: Topic is at position 3
Action:  Drag to position 1
Result:  All other topics shift down
```

### Move Topic to Bottom
```
Current: Topic is at position 1
Action:  Drag to last position
Result:  All other topics shift up
```

---

## ✅ Feature Status

### Works In
- ✅ Create Mode
- ✅ Edit Mode
- ✅ With Expanded Topics
- ✅ Multiple Courses
- ✅ Mobile/Touch Devices
- ✅ Keyboard Navigation

### Visual Feedback
- ✅ Grip icon visible
- ✅ Hover effects
- ✅ Drag animations
- ✅ Toast notifications
- ✅ Info banner (2+ topics)

### Persistence
- ✅ Saves to database
- ✅ Survives page reload
- ✅ Updates order_index
- ✅ Works with edit/save

---

## 🐛 Quick Troubleshooting

| Problem | Solution |
|---------|----------|
| Can't drag | Hard refresh (Ctrl+Shift+R) |
| No grip icon | Check if topics exist |
| Order doesn't save | Click "Save Semester" |
| Jumpy animation | Clear browser cache |
| No toast | Check console for errors |

---

## 💡 Pro Tips

1. **Steady Movement** → Drag slowly for better control
2. **Use Grip Only** → Don't drag from topic name
3. **Save Often** → Changes only persist after save
4. **Keyboard Power** → Try keyboard navigation
5. **Info Banner** → Read tips when visible

---

## 📊 At a Glance

```
┌────────────────────────────────────────┐
│  [⋮⋮] Topic 1: Introduction       [×] │ ← Click grip to drag
├────────────────────────────────────────┤
│  [⋮⋮] Topic 2: Advanced           [×] │ ← Drag up/down
├────────────────────────────────────────┤
│  [⋮⋮] Topic 3: Best Practices     [×] │ ← Drop in position
└────────────────────────────────────────┘
                  ↓
         [Save Semester] ← Click to persist
```

---

## 🎓 Learning Path

### Beginner
1. Add 2 topics
2. Drag one topic
3. See order change
4. Save changes

### Intermediate
1. Add 5 topics
2. Reorder multiple times
3. Expand a topic while dragging
4. Test keyboard navigation

### Advanced
1. Multiple courses with topics
2. Drag in different courses
3. Edit mode testing
4. Verify database persistence

---

## 🔗 Documentation Links

- **Full Guide**: `DRAG_DROP_TOPICS_FEATURE.md`
- **Visual Guide**: `DRAG_DROP_VISUAL_GUIDE.md`
- **Test Guide**: `DRAG_DROP_TEST_GUIDE.md`
- **Summary**: `DRAG_DROP_COMPLETE_SUMMARY.md`

---

## 📞 Need Help?

1. Check console for errors (F12)
2. Review test guide
3. Try hard refresh (Ctrl+Shift+R)
4. Restart dev server

---

**Status**: ✅ Fully Functional  
**Version**: 1.0  
**Updated**: November 5, 2025

---

## 🎯 Success Checklist

Before marking complete, verify:
- [ ] Grip icon visible on topics
- [ ] Can drag topics up and down
- [ ] Order updates immediately
- [ ] Toast notification appears
- [ ] Changes persist after save
- [ ] Works in both create and edit modes
- [ ] Keyboard navigation functional
- [ ] Info banner shows (when 2+ topics)

**All checked?** 🎉 **Feature is ready!**
