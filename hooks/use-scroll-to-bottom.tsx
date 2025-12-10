import { useCallback, useEffect, useRef, useState } from "react";

export function useScrollToBottom() {
  const containerRef = useRef<HTMLDivElement>(null);
  const endRef = useRef<HTMLDivElement>(null);
  const [isAtBottom, setIsAtBottom] = useState(true);
  const isAtBottomRef = useRef(true);
  const isUserScrollingRef = useRef(false);

  // Keep ref in sync with state
  useEffect(() => {
    isAtBottomRef.current = isAtBottom;
  }, [isAtBottom]);

  const checkIfAtBottom = useCallback(() => {
    if (!containerRef.current) {
      return true;
    }
    const { scrollTop, scrollHeight, clientHeight } = containerRef.current;
    return scrollTop + clientHeight >= scrollHeight - 100;
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
      scrollTimeout = setTimeout(() => {
        isUserScrollingRef.current = false;
      }, 150);
    };

    container.addEventListener("scroll", handleScroll, { passive: true });
    return () => {
      container.removeEventListener("scroll", handleScroll);
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

    const scrollIfNeeded = () => {
      // Only auto-scroll if user was at bottom and isn't actively scrolling
      if (isAtBottomRef.current && !isUserScrollingRef.current && endElement) {
        requestAnimationFrame(() => {
          if (endElement) {
            // Use scrollIntoView on the end element for reliable scrolling
            endElement.scrollIntoView({ behavior: "instant", block: "end" });
            setIsAtBottom(true);
            isAtBottomRef.current = true;
          }
        });
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

    // Watch for size changes - observe container and all descendants
    const resizeObserver = new ResizeObserver(scrollIfNeeded);
    resizeObserver.observe(container);
    
    // Observe the end element specifically
    if (endElement) {
      resizeObserver.observe(endElement);
    }

    // Use a more reliable method to observe all content changes
    const observeAll = () => {
      if (container) {
        const walker = document.createTreeWalker(
          container,
          NodeFilter.SHOW_ELEMENT,
          null
        );
        let node;
        while ((node = walker.nextNode())) {
          if (node instanceof Element) {
            resizeObserver.observe(node);
          }
        }
      }
    };
    
    // Initial observation
    observeAll();
    
    // Re-observe when content changes
    mutationObserver.observe(container, {
      childList: true,
      subtree: true,
    });

    return () => {
      mutationObserver.disconnect();
      resizeObserver.disconnect();
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

  return {
    containerRef,
    endRef,
    isAtBottom,
    scrollToBottom,
    onViewportEnter,
    onViewportLeave,
  };
}
