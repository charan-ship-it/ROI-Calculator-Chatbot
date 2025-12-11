import { useCallback, useEffect, useRef, useState } from "react";

export function useScrollToBottom() {
  const containerRef = useRef<HTMLDivElement>(null);
  const endRef = useRef<HTMLDivElement>(null);
  const [isAtBottom, setIsAtBottom] = useState(true);
  const isAtBottomRef = useRef(true);
  const isUserScrollingRef = useRef(false);
  const isStreamingRef = useRef(false); // Track if AI is actively streaming

  // Keep ref in sync with state
  useEffect(() => {
    isAtBottomRef.current = isAtBottom;
  }, [isAtBottom]);

  const checkIfAtBottom = useCallback(() => {
    if (!containerRef.current) {
      return true;
    }
    const { scrollTop, scrollHeight, clientHeight } = containerRef.current;
    // Reduced from 100px to 30px for tighter control
    return scrollTop + clientHeight >= scrollHeight - 30;
  }, []);

  const scrollToBottom = useCallback((behavior: ScrollBehavior = "smooth") => {
    if (!containerRef.current || !endRef.current) {
      return;
    }
    endRef.current.scrollIntoView({ behavior, block: "end" });
  }, []);

  // Handle user scroll events
  useEffect(() => {
    const container = containerRef.current;
    if (!container) {
      return;
    }

    let scrollTimeout: ReturnType<typeof setTimeout>;

    const handleScroll = () => {
      // Mark as user scrolling
      isUserScrollingRef.current = true;
      clearTimeout(scrollTimeout);

      // Update isAtBottom state
      const atBottom = checkIfAtBottom();
      setIsAtBottom(atBottom);
      isAtBottomRef.current = atBottom;

      // Reset user scrolling flag after scroll ends
      // Increased to 1000ms (1 second) to give much more time for user interaction
      scrollTimeout = setTimeout(() => {
        isUserScrollingRef.current = false;
      }, 1000);
    };

    // Also detect wheel and touch events to immediately mark as user scrolling
    const handleUserInteraction = () => {
      isUserScrollingRef.current = true;
      clearTimeout(scrollTimeout);
      
      // Keep the flag for longer after direct interaction
      scrollTimeout = setTimeout(() => {
        isUserScrollingRef.current = false;
      }, 2000); // 2 seconds after wheel/touch
    };

    container.addEventListener("scroll", handleScroll, { passive: true });
    container.addEventListener("wheel", handleUserInteraction, { passive: true });
    container.addEventListener("touchstart", handleUserInteraction, { passive: true });
    container.addEventListener("touchmove", handleUserInteraction, { passive: true });
    
    return () => {
      container.removeEventListener("scroll", handleScroll);
      container.removeEventListener("wheel", handleUserInteraction);
      container.removeEventListener("touchstart", handleUserInteraction);
      container.removeEventListener("touchmove", handleUserInteraction);
      clearTimeout(scrollTimeout);
    };
  }, [checkIfAtBottom]);

  // Auto-scroll when content changes
  useEffect(() => {
    const container = containerRef.current;
    const endElement = endRef.current;
    if (!container) {
      return;
    }

    let scrollDebounceTimeout: ReturnType<typeof setTimeout>;

    const scrollIfNeeded = () => {
      // CRITICAL: Only auto-scroll if AI is actively streaming
      // Once streaming stops, user has full scroll control
      if (isStreamingRef.current && isAtBottomRef.current && !isUserScrollingRef.current && endElement) {
        // Debounce the scroll to prevent excessive scrolling
        clearTimeout(scrollDebounceTimeout);
        scrollDebounceTimeout = setTimeout(() => {
          requestAnimationFrame(() => {
            // Double-check conditions before scrolling
            if (endElement && isStreamingRef.current && isAtBottomRef.current && !isUserScrollingRef.current) {
              // Use scrollIntoView on the end element for reliable scrolling
              endElement.scrollIntoView({ behavior: "instant", block: "end" });
              setIsAtBottom(true);
              isAtBottomRef.current = true;
            }
          });
        }, 100);
      }
    };

    // Watch for DOM changes - observe the entire subtree
    const mutationObserver = new MutationObserver(scrollIfNeeded);
    mutationObserver.observe(container, {
      childList: true,
      subtree: true,
      characterData: true,
      attributes: true,
    });

    // Watch for size changes - observe container and end element only
    const resizeObserver = new ResizeObserver(scrollIfNeeded);
    resizeObserver.observe(container);
    
    // Observe the end element specifically
    if (endElement) {
      resizeObserver.observe(endElement);
    }

    return () => {
      mutationObserver.disconnect();
      resizeObserver.disconnect();
      clearTimeout(scrollDebounceTimeout);
    };
  }, []);

  function onViewportEnter() {
    setIsAtBottom(true);
    isAtBottomRef.current = true;
  }

  function onViewportLeave() {
    setIsAtBottom(false);
    isAtBottomRef.current = false;
  }

  // Method to update streaming status from parent component
  const setIsStreaming = useCallback((streaming: boolean) => {
    isStreamingRef.current = streaming;
  }, []);

  return {
    containerRef,
    endRef,
    isAtBottom,
    scrollToBottom,
    onViewportEnter,
    onViewportLeave,
    setIsStreaming, // Export the new method
  };
}
