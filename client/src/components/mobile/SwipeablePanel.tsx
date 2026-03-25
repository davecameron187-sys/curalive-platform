import React, { useRef, useEffect, useState } from "react";
import { cn } from "@/lib/utils";

interface SwipeablePanelProps {
  children: React.ReactNode[];
  activeIndex: number;
  onChange: (index: number) => void;
  className?: string;
}

export default function SwipeablePanel({
  children,
  activeIndex,
  onChange,
  className,
}: SwipeablePanelProps) {
  const containerRef = useRef<HTMLDivElement>(null);
  const [isScrolling, setIsScrolling] = useState(false);

  useEffect(() => {
    if (containerRef.current && !isScrolling) {
      const targetScrollLeft = activeIndex * containerRef.current.offsetWidth;
      if (Math.abs(containerRef.current.scrollLeft - targetScrollLeft) > 5) {
        containerRef.current.scrollTo({
          left: targetScrollLeft,
          behavior: "smooth",
        });
      }
    }
  }, [activeIndex, isScrolling]);

  const handleScroll = () => {
    if (!containerRef.current) return;
    
    setIsScrolling(true);
    const scrollLeft = containerRef.current.scrollLeft;
    const width = containerRef.current.offsetWidth;
    const newIndex = Math.round(scrollLeft / width);
    
    if (newIndex !== activeIndex) {
      onChange(newIndex);
    }

    // Reset scrolling state after a delay
    const timeoutId = setTimeout(() => setIsScrolling(false), 150);
    return () => clearTimeout(timeoutId);
  };

  return (
    <div
      ref={containerRef}
      className={cn(
        "flex-1 overflow-x-auto overflow-y-hidden snap-x snap-mandatory no-scrollbar flex",
        className
      )}
      onScroll={handleScroll}
      style={{
        scrollbarWidth: 'none',
        msOverflowStyle: 'none',
        WebkitOverflowScrolling: 'touch'
      }}
    >
      {children.map((child, idx) => (
        <div 
          key={idx} 
          className="w-full h-full flex-shrink-0 snap-start snap-always overflow-y-auto"
        >
          {child}
        </div>
      ))}
    </div>
  );
}
