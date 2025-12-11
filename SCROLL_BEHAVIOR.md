# Auto-Scroll Behavior Documentation

## Overview

The ROI Chatbot implements intelligent auto-scroll behavior that automatically follows AI responses during both thinking and responding phases, while preserving full user control once AI activity stops.

---

## Feature Implementation (2025-01-10)

### What Was Changed

**File**: `hooks/use-messages.tsx`

**Change**: Updated streaming status detection to include both "thinking" and "responding" states.

**Before**:
```typescript
useEffect(() => {
  setIsStreaming(status === "streaming");
}, [status, setIsStreaming]);
```

**After**:
```typescript
useEffect(() => {
  const isAIActive = status === "streaming" || status === "submitted";
  setIsStreaming(isAIActive);
}, [status, setIsStreaming]);
```

---

## Behavior Details

### Auto-Scroll is ENABLED When:

1. ✅ AI is **thinking** (`status === "submitted"`)
2. ✅ AI is **responding** (`status === "streaming"`)
3. ✅ User is at the bottom of chat (within 30px threshold)
4. ✅ User has NOT manually scrolled recently

### Auto-Scroll is DISABLED When:

1. ❌ User manually scrolls up or down
2. ❌ User uses mouse wheel or trackpad
3. ❌ User touches/swipes on mobile
4. ❌ AI finishes responding (status changes to idle)

---

## User Control

### Manual Scroll Cooldown Periods:

- **Scroll event**: 1 second cooldown
- **Wheel/Trackpad**: 2 seconds cooldown  
- **Touch/Swipe**: 2 seconds cooldown

These cooldowns ensure user intent is respected and auto-scroll doesn't fight with user actions.

### Scroll-to-Bottom Button:

- Appears when user scrolls up
- Hidden when at bottom
- Uses smooth scrolling animation
- Located at bottom center of chat

---

## Technical Implementation

### State Management:

```typescript
// In use-scroll-to-bottom.tsx
isStreamingRef: boolean  // Tracks if AI is active
isUserScrollingRef: boolean  // Tracks recent user scroll
isAtBottomRef: boolean  // Tracks scroll position

// In use-messages.tsx
status: "idle" | "submitted" | "streaming" | "error"
// - "submitted": AI is thinking
// - "streaming": AI is responding
```

### Observers:

1. **MutationObserver**: Detects DOM changes (new messages, text updates)
2. **ResizeObserver**: Detects size changes in container and end element
3. **Scroll Events**: Tracks user scroll position
4. **Touch/Wheel Events**: Detects user interaction

### Performance:

- **Debouncing**: 100ms debounce on auto-scroll
- **RAF Batching**: Uses requestAnimationFrame for smooth updates
- **Instant Scrolling**: During streaming for immediate feedback
- **Threshold**: 30px buffer for "at bottom" detection

---

## Code Architecture

### Files Involved:

1. **`hooks/use-scroll-to-bottom.tsx`**
   - Core scroll management
   - User interaction detection
   - Auto-scroll logic

2. **`hooks/use-messages.tsx`**
   - Connects chat status to scroll behavior
   - Sets streaming state based on AI activity

3. **`components/messages.tsx`**
   - Renders messages
   - Integrates scroll hook
   - Displays scroll-to-bottom button

---

## Testing Scenarios

### Expected Behavior:

✅ **Scenario 1: Normal Message**
- User sends message → Auto-scroll to bottom
- AI thinks (submitted) → Auto-scroll continues
- AI responds (streaming) → Auto-scroll continues  
- AI finishes → Auto-scroll stops, user has control

✅ **Scenario 2: User Scrolls Up During Response**
- AI is responding → Auto-scroll active
- User scrolls up → Auto-scroll immediately stops
- User stays scrolled up → Auto-scroll remains disabled
- Response finishes → User still has full control

✅ **Scenario 3: User at Bottom**
- User at bottom → No scroll button visible
- New message arrives → Stays at bottom automatically
- AI responds → Follows along automatically

✅ **Scenario 4: User Scrolled Up**
- User scrolled up → Scroll button appears
- New message arrives → Position preserved
- User clicks button → Smooth scroll to bottom

---

## Troubleshooting

### Issue: Auto-scroll not working during thinking phase

**Solution**: Verify `use-messages.tsx` includes both statuses:
```typescript
const isAIActive = status === "streaming" || status === "submitted";
```

### Issue: Auto-scroll too aggressive

**Solution**: Increase cooldown periods in `use-scroll-to-bottom.tsx`:
```typescript
setTimeout(() => {
  isUserScrollingRef.current = false;
}, 2000); // Increase this value
```

### Issue: Scroll button doesn't appear

**Solution**: Check threshold value (default 30px):
```typescript
return scrollTop + clientHeight >= scrollHeight - 30;
```

---

## Future Enhancements

Potential improvements:

1. **Configurable Thresholds**: Allow users to adjust scroll sensitivity
2. **Smart Pause**: Pause auto-scroll when user hovers over message
3. **Scroll Animation**: Custom easing for smoother experience
4. **Accessibility**: Keyboard shortcuts for scroll control
5. **Mobile Optimization**: Enhanced touch gesture detection

---

## Related Components

- `components/chat.tsx`: Main chat container
- `components/message.tsx`: Individual message rendering
- `hooks/use-auto-resume.tsx`: Stream resumption logic
- `components/data-stream-handler.tsx`: Streaming data management

---

## References

- AI SDK Documentation: https://sdk.vercel.ai/docs
- React Hooks Best Practices: https://react.dev/reference/react
- Scroll Behavior Spec: https://developer.mozilla.org/en-US/docs/Web/API/Element/scrollIntoView
