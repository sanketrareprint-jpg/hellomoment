'use client';

import { useEffect, useRef, useState } from 'react';

// A floating D-pad for nudging the selected flyer element by small, exact
// steps. Dragging an element directly on the canvas with a finger covers it
// completely — there's no way to see whether it landed aligned until you
// lift your finger away. These four arrows move it a few canvas pixels at a
// time with nothing ever sitting on top of it. The pad itself floats free of
// the canvas (fixed to the viewport, not the flyer preview) and can be
// dragged anywhere on screen by its center handle, so it can be parked
// somewhere that never covers the element being nudged.
const STEP = 2;
const HOLD_REPEAT_MS = 90;
const PAD_SIZE = 128;

function Chevron({ rotate }: { rotate: number }) {
  return (
    <svg
      width={16}
      height={16}
      viewBox="0 0 24 24"
      fill="none"
      stroke="currentColor"
      strokeWidth={2}
      style={{ transform: `rotate(${rotate}deg)` }}
    >
      <path strokeLinecap="round" strokeLinejoin="round" d="M4.5 15.75l7.5-7.5 7.5 7.5" />
    </svg>
  );
}

export default function FloatingNudgePad({
  visible,
  label,
  onNudge,
}: {
  visible: boolean;
  // Name of the currently selected element, shown on the pad so it's clear
  // what the arrows are about to move.
  label?: string;
  // Called with a (dx, dy) delta in the same canvas-pixel units the
  // placeholder's own x/y are stored in — up/left are negative.
  onNudge: (dx: number, dy: number) => void;
}) {
  const [pos, setPos] = useState<{ x: number; y: number } | null>(null);
  const dragState = useRef<{ pointerId: number; startX: number; startY: number; origX: number; origY: number } | null>(null);
  const holdTimer = useRef<ReturnType<typeof setInterval> | null>(null);

  // Parked in the bottom-right corner the first time it appears — clear of
  // the canvas and any on-screen keyboard — then stays wherever it's dragged
  // to for the rest of the session.
  useEffect(() => {
    if (visible && pos === null && typeof window !== 'undefined') {
      setPos({ x: window.innerWidth - PAD_SIZE - 16, y: window.innerHeight - PAD_SIZE - 96 });
    }
  }, [visible, pos]);

  useEffect(() => stopHold, []);

  function stopHold() {
    if (holdTimer.current) {
      clearInterval(holdTimer.current);
      holdTimer.current = null;
    }
  }

  function press(dx: number, dy: number) {
    onNudge(dx, dy);
    stopHold();
    holdTimer.current = setInterval(() => onNudge(dx, dy), HOLD_REPEAT_MS);
  }

  function onHandlePointerDown(e: React.PointerEvent) {
    if (!pos) return;
    e.preventDefault();
    e.currentTarget.setPointerCapture(e.pointerId);
    dragState.current = { pointerId: e.pointerId, startX: e.clientX, startY: e.clientY, origX: pos.x, origY: pos.y };
  }

  function onHandlePointerMove(e: React.PointerEvent) {
    const d = dragState.current;
    if (!d || d.pointerId !== e.pointerId) return;
    const margin = 8;
    const nx = d.origX + (e.clientX - d.startX);
    const ny = d.origY + (e.clientY - d.startY);
    setPos({
      x: Math.min(Math.max(nx, margin), window.innerWidth - PAD_SIZE - margin),
      y: Math.min(Math.max(ny, margin), window.innerHeight - PAD_SIZE - margin),
    });
  }

  function onHandlePointerUp(e: React.PointerEvent) {
    if (dragState.current?.pointerId === e.pointerId) dragState.current = null;
  }

  if (!visible || !pos) return null;

  const arrowBtn =
    'flex items-center justify-center w-9 h-9 rounded-md bg-white/95 hover:bg-white active:bg-gray-100 border border-gray-300 shadow-sm text-gray-700 select-none touch-none';

  return (
    <div
      className="fixed z-50 flex flex-col items-center gap-1 p-2 rounded-xl bg-gray-900/85 backdrop-blur shadow-lg"
      style={{ left: pos.x, top: pos.y, width: PAD_SIZE }}
    >
      {label && <div className="text-[10px] text-white/80 mb-0.5 truncate max-w-full" title={label}>{label}</div>}
      <button
        type="button"
        className={arrowBtn}
        onPointerDown={() => press(0, -STEP)}
        onPointerUp={stopHold}
        onPointerLeave={stopHold}
        aria-label="Nudge up"
      >
        <Chevron rotate={0} />
      </button>
      <div className="flex items-center gap-1">
        <button
          type="button"
          className={arrowBtn}
          onPointerDown={() => press(-STEP, 0)}
          onPointerUp={stopHold}
          onPointerLeave={stopHold}
          aria-label="Nudge left"
        >
          <Chevron rotate={-90} />
        </button>
        <div
          className="flex items-center justify-center w-9 h-9 rounded-md bg-gray-700 text-white cursor-grab active:cursor-grabbing touch-none select-none"
          onPointerDown={onHandlePointerDown}
          onPointerMove={onHandlePointerMove}
          onPointerUp={onHandlePointerUp}
          onPointerCancel={onHandlePointerUp}
          role="button"
          aria-label="Drag to move this control"
          title="Drag to move this control"
        >
          <svg width={14} height={14} viewBox="0 0 24 24" fill="currentColor">
            <circle cx="6" cy="6" r="1.6" />
            <circle cx="12" cy="6" r="1.6" />
            <circle cx="18" cy="6" r="1.6" />
            <circle cx="6" cy="12" r="1.6" />
            <circle cx="12" cy="12" r="1.6" />
            <circle cx="18" cy="12" r="1.6" />
            <circle cx="6" cy="18" r="1.6" />
            <circle cx="12" cy="18" r="1.6" />
            <circle cx="18" cy="18" r="1.6" />
          </svg>
        </div>
        <button
          type="button"
          className={arrowBtn}
          onPointerDown={() => press(STEP, 0)}
          onPointerUp={stopHold}
          onPointerLeave={stopHold}
          aria-label="Nudge right"
        >
          <Chevron rotate={90} />
        </button>
      </div>
      <button
        type="button"
        className={arrowBtn}
        onPointerDown={() => press(0, STEP)}
        onPointerUp={stopHold}
        onPointerLeave={stopHold}
        aria-label="Nudge down"
      >
        <Chevron rotate={180} />
      </button>
    </div>
  );
}
