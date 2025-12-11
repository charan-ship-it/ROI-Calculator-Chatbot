# Auto-Scroll Flow Diagram

## Component Architecture

```
┌─────────────────────────────────────────────────────────────────┐
│                         Chat Component                          │
│                      (components/chat.tsx)                      │
├─────────────────────────────────────────────────────────────────┤
│                                                                 │
│  • Manages chat state (messages, status, input)                │
│  • Uses useChat hook from AI SDK                               │
│  • Handles message sending and streaming                       │
│                                                                 │
└────────────────────────┬────────────────────────────────────────┘
                         │
                         │ passes: status, messages
                         ↓
┌─────────────────────────────────────────────────────────────────┐
│                      Messages Component                         │
│                    (components/messages.tsx)                    │
├─────────────────────────────────────────────────────────────────┤
│                                                                 │
│  • Renders message list                                        │
│  • Uses useMessages hook for scroll behavior                  │
│  • Displays scroll-to-bottom button                           │
│                                                                 │
└────────────────────────┬────────────────────────────────────────┘
                         │
                         │ uses
                         ↓
┌─────────────────────────────────────────────────────────────────┐
│                      useMessages Hook                           │
│                   (hooks/use-messages.tsx)                      │
├─────────────────────────────────────────────────────────────────┤
│                                                                 │
│  • Connects chat status to scroll behavior                     │
│  • Determines when AI is active:                               │
│    isAIActive = (status === "submitted" || status === "streaming") │
│  • Updates streaming state in useScrollToBottom                │
│                                                                 │
└────────────────────────┬────────────────────────────────────────┘
                         │
                         │ uses and controls
                         ↓
┌─────────────────────────────────────────────────────────────────┐
│                   useScrollToBottom Hook                        │
│                (hooks/use-scroll-to-bottom.tsx)                 │
├─────────────────────────────────────────────────────────────────┤
│                                                                 │
│  Core Scroll Logic:                                            │
│  ┌───────────────────────────────────────────────────────────┐ │
│  │                                                           │ │
│  │  State Tracking:                                         │ │
│  │  • isStreamingRef     → AI activity status              │ │
│  │  • isUserScrollingRef → User interaction flag           │ │
│  │  • isAtBottomRef      → Scroll position                 │ │
│  │                                                           │ │
│  │  Auto-Scroll Triggers:                                   │ │
│  │  ✓ MutationObserver   → DOM changes                     │ │
│  │  ✓ ResizeObserver     → Size changes                    │ │
│  │                                                           │ │
│  │  User Detection:                                         │ │
│  │  ✓ Scroll events      → 1s cooldown                     │ │
│  │  ✓ Wheel events       → 2s cooldown                     │ │
│  │  ✓ Touch events       → 2s cooldown                     │ │
│  │                                                           │ │
│  └───────────────────────────────────────────────────────────┘ │
│                                                                 │
└─────────────────────────────────────────────────────────────────┘
```

---

## State Flow Diagram

```
┌─────────────────────────────────────────────────────────────────┐
│                        User Action                              │
│                   "Send Message" clicked                        │
└────────────────────────┬────────────────────────────────────────┘
                         │
                         ↓
┌─────────────────────────────────────────────────────────────────┐
│                   Status: "submitted"                           │
│                   (AI is thinking)                              │
├─────────────────────────────────────────────────────────────────┤
│                                                                 │
│  isAIActive = true                                             │
│  Auto-scroll: ENABLED ✓                                        │
│                                                                 │
│  Conditions checked:                                           │
│  • isStreamingRef.current = true  ✓                           │
│  • isAtBottomRef.current = true   ✓                           │
│  • !isUserScrollingRef.current    ✓                           │
│                                                                 │
│  → Scrolls to bottom as thinking progresses                   │
│                                                                 │
└────────────────────────┬────────────────────────────────────────┘
                         │
                         ↓
┌─────────────────────────────────────────────────────────────────┐
│                   Status: "streaming"                           │
│                   (AI is responding)                            │
├─────────────────────────────────────────────────────────────────┤
│                                                                 │
│  isAIActive = true (continues)                                 │
│  Auto-scroll: ENABLED ✓                                        │
│                                                                 │
│  → Scrolls to bottom as response streams                      │
│  → Updates continuously with each new word                    │
│                                                                 │
└────────────────────────┬────────────────────────────────────────┘
                         │
                         ↓
┌─────────────────────────────────────────────────────────────────┐
│                     Status: "idle"                              │
│                   (AI finished)                                 │
├─────────────────────────────────────────────────────────────────┤
│                                                                 │
│  isAIActive = false                                            │
│  Auto-scroll: DISABLED ✗                                       │
│                                                                 │
│  → User has FULL control                                       │
│  → Can scroll freely without interference                     │
│                                                                 │
└─────────────────────────────────────────────────────────────────┘
```

---

## User Interruption Flow

```
┌─────────────────────────────────────────────────────────────────┐
│           Auto-Scroll Active (AI Responding)                    │
└────────────────────────┬────────────────────────────────────────┘
                         │
                         │ User scrolls up ↑
                         ↓
┌─────────────────────────────────────────────────────────────────┐
│                   Event Detected                                │
├─────────────────────────────────────────────────────────────────┤
│                                                                 │
│  Options:                                                      │
│  • Scroll event  → isUserScrollingRef = true (1s)             │
│  • Wheel event   → isUserScrollingRef = true (2s)             │
│  • Touch event   → isUserScrollingRef = true (2s)             │
│                                                                 │
└────────────────────────┬────────────────────────────────────────┘
                         │
                         ↓
┌─────────────────────────────────────────────────────────────────┐
│               Auto-Scroll Immediately Stops                     │
├─────────────────────────────────────────────────────────────────┤
│                                                                 │
│  Condition check:                                              │
│  • isStreamingRef.current = true      ✓                       │
│  • isAtBottomRef.current = false      ✗ (user scrolled)       │
│  • !isUserScrollingRef.current        ✗ (user active)         │
│                                                                 │
│  → Auto-scroll disabled ✗                                     │
│  → User position preserved                                     │
│  → Scroll button appears                                       │
│                                                                 │
└────────────────────────┬────────────────────────────────────────┘
                         │
                         │ Cooldown expires
                         ↓
┌─────────────────────────────────────────────────────────────────┐
│                 User Control Restored                           │
├─────────────────────────────────────────────────────────────────┤
│                                                                 │
│  • isUserScrollingRef = false                                  │
│  • User can scroll freely                                      │
│  • If user returns to bottom → Auto-scroll re-enables         │
│  • If user stays scrolled → Position preserved                │
│                                                                 │
└─────────────────────────────────────────────────────────────────┘
```

---

## Decision Tree

```
                    ┌─────────────────────┐
                    │  Content Updated    │
                    │  (new message/word) │
                    └──────────┬──────────┘
                               │
                    ┌──────────▼──────────┐
                    │   Should we auto-   │
                    │   scroll?           │
                    └──────────┬──────────┘
                               │
              ┌────────────────┴────────────────┐
              │                                 │
        ┌─────▼─────┐                    ┌─────▼─────┐
        │ Is AI     │ NO                 │ Is AI     │ YES
        │ active?   ├─────────┐          │ active?   ├──────────┐
        └───────────┘         │          └───────────┘          │
                              │                                 │
                       ┌──────▼──────┐                   ┌──────▼──────┐
                       │ SKIP        │                   │ Is user at  │
                       │ Auto-scroll │                   │ bottom?     │
                       │ disabled    │                   └──────┬──────┘
                       └─────────────┘                          │
                                                    ┌────────────┴────────────┐
                                                    │                         │
                                              ┌─────▼─────┐            ┌─────▼─────┐
                                              │ At bottom │ NO         │ At bottom │ YES
                                              │           ├────────┐   │           ├────────┐
                                              └───────────┘        │   └───────────┘        │
                                                                   │                        │
                                                            ┌──────▼──────┐          ┌──────▼──────┐
                                                            │ SKIP        │          │ Is user     │
                                                            │ User        │          │ scrolling?  │
                                                            │ scrolled up │          └──────┬──────┘
                                                            └─────────────┘                 │
                                                                              ┌─────────────┴─────────────┐
                                                                              │                           │
                                                                        ┌─────▼─────┐            ┌────────▼────────┐
                                                                        │ Scrolling │ YES        │ Not scrolling   │ NO
                                                                        │           ├────────┐   │                 ├────────┐
                                                                        └───────────┘        │   └─────────────────┘        │
                                                                                             │                              │
                                                                                      ┌──────▼──────┐              ┌────────▼────────┐
                                                                                      │ SKIP        │              │ AUTO-SCROLL ✓   │
                                                                                      │ Respect     │              │ Scroll to       │
                                                                                      │ user intent │              │ bottom now      │
                                                                                      └─────────────┘              └─────────────────┘
```

---

## Timeline View

```
Time →
━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━

User sends message
│
├─ Status: "submitted" (thinking)
│  ├─ isAIActive = true
│  ├─ Auto-scroll: ON ✓
│  └─ [Thinking animation displays]
│
├─ Status: "streaming" (responding)
│  ├─ isAIActive = true (continues)
│  ├─ Auto-scroll: ON ✓
│  ├─ Word 1 appears → scroll
│  ├─ Word 2 appears → scroll
│  ├─ Word 3 appears → scroll
│  └─ ... (continues)
│
├─ Status: "idle" (complete)
│  ├─ isAIActive = false
│  ├─ Auto-scroll: OFF ✗
│  └─ User has full control
│
└─ [Chat ready for next interaction]

━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━

Interruption scenario:
━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━

Status: "streaming" (AI responding)
│
├─ Auto-scroll: ON ✓
│
├─ [User scrolls up] ← User action
│  └─ isUserScrollingRef = true
│
├─ Auto-scroll: OFF ✗ (immediately)
│  ├─ Position preserved
│  └─ Scroll button appears
│
├─ Response continues streaming
│  └─ (user position unchanged)
│
├─ [1-2 second cooldown]
│  └─ isUserScrollingRef = false
│
└─ User can interact freely

━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━
```

---

## Key Variables Reference

```typescript
// In useScrollToBottom hook:

isStreamingRef.current
├─ Type: boolean
├─ Purpose: Tracks if AI is actively working
├─ Set by: useMessages hook
└─ Values:
   ├─ true  → AI is thinking or responding
   └─ false → AI is idle

isUserScrollingRef.current
├─ Type: boolean
├─ Purpose: Tracks recent user scroll activity
├─ Set by: Event listeners
└─ Cooldowns:
   ├─ 1000ms after scroll event
   └─ 2000ms after wheel/touch events

isAtBottomRef.current
├─ Type: boolean
├─ Purpose: Tracks if user is at bottom of chat
├─ Set by: Scroll position calculations
└─ Threshold: Within 30px of bottom

// In useMessages hook:

status
├─ Type: "idle" | "submitted" | "streaming" | "error"
├─ Purpose: Current chat state
└─ Values:
   ├─ "submitted"  → AI thinking
   ├─ "streaming"  → AI responding
   └─ "idle"       → No activity

isAIActive
├─ Type: boolean
├─ Calculated: status === "submitted" || status === "streaming"
└─ Purpose: Determines if auto-scroll should be enabled
```
