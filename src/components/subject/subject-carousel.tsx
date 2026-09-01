"use client";

import Link from "next/link";
import type { SubjectSummary } from "@/lib/data";
import { useCallback, useEffect, useRef, useState } from "react";
import { ChevronLeftIcon, ChevronRightIcon } from "@/components/icons";

function initial(name: string): string {
  return name.trim().charAt(0).toUpperCase() || "?";
}

export function SubjectCarousel({ subjects }: { subjects: SubjectSummary[] }) {
  const trackRef = useRef<HTMLDivElement>(null);
  const dragState = useRef({
    dragging: false,
    startX: 0,
    startScroll: 0,
    moved: 0,
  });
  const [isDragging, setIsDragging] = useState(false);
  const [navigation, setNavigation] = useState({ canScrollLeft: false, canScrollRight: true });
  const DRAG_CLICK_THRESHOLD = 5;

  const updateNavigation = useCallback(() => {
    const el = trackRef.current;
    if (!el) return;
    const maxScrollLeft = Math.max(0, el.scrollWidth - el.clientWidth);
    const next = {
      canScrollLeft: el.scrollLeft > 1,
      canScrollRight: el.scrollLeft < maxScrollLeft - 1,
    };
    setNavigation((current) =>
      current.canScrollLeft === next.canScrollLeft && current.canScrollRight === next.canScrollRight ? current : next,
    );
  }, []);

  useEffect(() => {
    const el = trackRef.current;
    if (!el) return;
    const resizeObserver = new ResizeObserver(updateNavigation);
    resizeObserver.observe(el);
    el.addEventListener("scroll", updateNavigation, { passive: true });
    const frame = requestAnimationFrame(updateNavigation);
    return () => {
      cancelAnimationFrame(frame);
      resizeObserver.disconnect();
      el.removeEventListener("scroll", updateNavigation);
    };
  }, [subjects.length, updateNavigation]);

  const handleWheel = (e: React.WheelEvent<HTMLDivElement>) => {
    const el = trackRef.current;
    if (!el) return;
    const delta = Math.abs(e.deltaX) > Math.abs(e.deltaY) ? e.deltaX * 1.5 : e.deltaY * 1.5;
    el.scrollLeft += delta;
  };

  const handleTouchStart = (e: React.TouchEvent<HTMLDivElement>) => {
    const el = trackRef.current;
    if (!el) return;
    dragState.current = {
      dragging: true,
      startX: e.touches[0].clientX,
      startScroll: el.scrollLeft,
      moved: 0,
    };
  };

  const handleTouchMove = (e: React.TouchEvent<HTMLDivElement>) => {
    const el = trackRef.current;
    if (!el || !dragState.current.dragging) return;
    const dx = e.touches[0].clientX - dragState.current.startX;
    dragState.current.moved = Math.abs(dx);
    el.scrollLeft = dragState.current.startScroll - dx;
  };

  const handleTouchEnd = () => {
    dragState.current.dragging = false;
  };

  const handleMouseDown = (e: React.MouseEvent<HTMLDivElement>) => {
    const el = trackRef.current;
    if (!el) return;
    dragState.current = {
      dragging: true,
      startX: e.clientX,
      startScroll: el.scrollLeft,
      moved: 0,
    };
    setIsDragging(true);
  };

  const handleMouseMove = (e: React.MouseEvent<HTMLDivElement>) => {
    const el = trackRef.current;
    if (!el || !dragState.current.dragging) return;
    e.preventDefault();
    const dx = e.clientX - dragState.current.startX;
    dragState.current.moved = Math.abs(dx);
    el.scrollLeft = dragState.current.startScroll - dx;
  };

  const endMouseDrag = () => {
    dragState.current.dragging = false;
    setIsDragging(false);
  };

  useEffect(() => {
    if (!isDragging) return;
    window.addEventListener("mouseup", endMouseDrag);
    return () => window.removeEventListener("mouseup", endMouseDrag);
  }, [isDragging]);

  const handleClickCapture = (e: React.MouseEvent<HTMLDivElement>) => {
    if (dragState.current.moved > DRAG_CLICK_THRESHOLD) {
      e.preventDefault();
      e.stopPropagation();
    }
  };

  const scrollByAmount = (amount: number) => {
    trackRef.current?.scrollBy({ left: amount, behavior: "smooth" });
  };

  return (
    <div className="relative flex items-center gap-1 h-[140px] w-full max-w-3xl mx-auto select-none">
      <button
        type="button"
        onClick={() => scrollByAmount(-240)}
        disabled={!navigation.canScrollLeft}
        // @ts-ignore
        autoComplete="off" /* Without this on Firefox we get a hydration error */
        aria-label="Scroll left"
        className="absolute left-0 top-0 bg-gradient-left z-5 w-8 h-full flex items-center justify-start text-gray-700 hover:text-orange disabled:pointer-events-none disabled:text-gray-300"
      >
        <ChevronLeftIcon className="h-5 w-5" />
      </button>

      <div
        ref={trackRef}
        onWheel={handleWheel}
        onMouseDown={handleMouseDown}
        onMouseMove={handleMouseMove}
        onClickCapture={handleClickCapture}
        onTouchStart={handleTouchStart}
        onTouchMove={handleTouchMove}
        onTouchEnd={handleTouchEnd}
        className={`flex gap-3 overflow-x-auto overscroll-none scroll-smooth px-7 py-4 ${
          isDragging ? "cursor-grabbing" : "cursor-grab"
        }`}
        style={{ scrollbarWidth: "none" }}
      >
        {subjects.map((subject) => (
          <Link
            key={subject.id}
            href={`/subjects/${subject.id}`}
            draggable={false}
            className="brutal btn-press w-[140px] h-[120px] shrink-0 snap-start overflow-hidden bg-card-surface flex flex-col"
          >
            <div className="flex-center h-full place-items-center" style={{ background: subject.color }}>
              <span className="lg-heading font-bold text-white drop-shadow-sm">{initial(subject.name)}</span>
            </div>
            <div className="px-2 py-1.5">
              <span className="block truncate body text-fg1">{subject.name}</span>
            </div>
          </Link>
        ))}
      </div>

      <button
        type="button"
        onClick={() => scrollByAmount(240)}
        disabled={!navigation.canScrollRight}
        // @ts-ignore
        autoComplete="off" /* Without this on Firefox we get a hydration error */
        aria-label="Scroll right"
        className="absolute right-0 bg-gradient-right z-5 w-8 h-full flex items-center justify-end text-gray-700 hover:text-orange disabled:pointer-events-none disabled:text-gray-300"
      >
        <ChevronRightIcon className="h-5 w-5" />
      </button>
    </div>
  );
}
