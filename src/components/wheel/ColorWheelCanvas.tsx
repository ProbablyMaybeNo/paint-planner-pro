"use client";

import { useEffect, useRef, useCallback } from "react";
import { hslToHex, isLightColor } from "@/lib/colors";
import type { ColorStop } from "@/types/paint";

const WHEEL_RADIUS = 240;
const CENTER = WHEEL_RADIUS + 20;
const CANVAS_SIZE = CENTER * 2;
const PICKER_RADIUS = 10;

interface ColorWheelCanvasProps {
  stops: ColorStop[];
  activeId: string | null;
  onStopChange: (id: string, hue: number, saturation: number, lightness: number) => void;
  onStopSelect: (id: string) => void;
  lightness: number;
}

/** Draw the HSL color wheel */
function drawWheel(ctx: CanvasRenderingContext2D, cx: number, cy: number, r: number, lightness: number) {
  ctx.clearRect(0, 0, ctx.canvas.width, ctx.canvas.height);

  // Draw hue ring using conic gradient via image data for accuracy
  const imageData = ctx.createImageData(ctx.canvas.width, ctx.canvas.height);
  const data = imageData.data;

  for (let y = 0; y < ctx.canvas.height; y++) {
    for (let x = 0; x < ctx.canvas.width; x++) {
      const dx = x - cx;
      const dy = y - cy;
      const dist = Math.sqrt(dx * dx + dy * dy);
      if (dist > r) continue;

      // Hue from angle
      let angle = Math.atan2(dy, dx) * (180 / Math.PI) + 90;
      if (angle < 0) angle += 360;

      // Saturation from distance (center = grey, edge = full sat)
      const sat = (dist / r) * 100;

      // Convert HSL to RGB
      const hex = hslToHex(angle, sat, lightness);
      const r2 = parseInt(hex.slice(1, 3), 16);
      const g2 = parseInt(hex.slice(3, 5), 16);
      const b2 = parseInt(hex.slice(5, 7), 16);

      const idx = (y * ctx.canvas.width + x) * 4;
      data[idx] = r2;
      data[idx + 1] = g2;
      data[idx + 2] = b2;
      data[idx + 3] = 255;
    }
  }
  ctx.putImageData(imageData, 0, 0);

  // Outer ring border
  ctx.beginPath();
  ctx.arc(cx, cy, r, 0, Math.PI * 2);
  ctx.strokeStyle = "rgba(0, 255, 65, 0.3)";
  ctx.lineWidth = 1;
  ctx.stroke();

  // Center crosshair
  ctx.beginPath();
  ctx.arc(cx, cy, 4, 0, Math.PI * 2);
  ctx.strokeStyle = "rgba(0, 255, 65, 0.5)";
  ctx.lineWidth = 1;
  ctx.stroke();
}

/** Draw color stop pickers */
function drawStops(
  ctx: CanvasRenderingContext2D,
  stops: ColorStop[],
  cx: number,
  cy: number,
  r: number,
  activeId: string | null
) {
  stops.forEach((stop) => {
    const angleRad = (stop.hue - 90) * (Math.PI / 180);
    const dist = (stop.saturation / 100) * r;
    const x = cx + dist * Math.cos(angleRad);
    const y = cy + dist * Math.sin(angleRad);
    const hex = hslToHex(stop.hue, stop.saturation, stop.lightness);
    const isActive = stop.id === activeId;
    const isPrimary = stop.isPrimary;

    // Glow
    if (isActive) {
      ctx.beginPath();
      ctx.arc(x, y, PICKER_RADIUS + 5, 0, Math.PI * 2);
      ctx.fillStyle = "rgba(0, 229, 255, 0.15)";
      ctx.fill();
    }

    // Circle fill
    ctx.beginPath();
    ctx.arc(x, y, PICKER_RADIUS, 0, Math.PI * 2);
    ctx.fillStyle = hex;
    ctx.fill();

    // Border
    ctx.beginPath();
    ctx.arc(x, y, PICKER_RADIUS, 0, Math.PI * 2);
    ctx.strokeStyle = isActive ? "#00e5ff" : isPrimary ? "#00ff41" : "rgba(255,255,255,0.6)";
    ctx.lineWidth = isActive ? 2 : 1.5;
    ctx.stroke();

    // Hex label
    ctx.fillStyle = isActive ? "#00e5ff" : "rgba(0,255,65,0.7)";
    ctx.font = "9px 'IBM Plex Mono', monospace";
    ctx.fillText(hex, x + PICKER_RADIUS + 3, y + 4);
  });
}

export default function ColorWheelCanvas({
  stops,
  activeId,
  onStopChange,
  onStopSelect,
  lightness,
}: ColorWheelCanvasProps) {
  const canvasRef = useRef<HTMLCanvasElement>(null);
  const draggingRef = useRef<string | null>(null);

  const redraw = useCallback(() => {
    const canvas = canvasRef.current;
    if (!canvas) return;
    const ctx = canvas.getContext("2d");
    if (!ctx) return;
    drawWheel(ctx, CENTER, CENTER, WHEEL_RADIUS, lightness);
    drawStops(ctx, stops, CENTER, CENTER, WHEEL_RADIUS, activeId);
  }, [stops, activeId, lightness]);

  useEffect(() => {
    redraw();
  }, [redraw]);

  const posToHsl = useCallback((clientX: number, clientY: number): { hue: number; saturation: number } => {
    const canvas = canvasRef.current!;
    const rect = canvas.getBoundingClientRect();
    const scaleX = canvas.width / rect.width;
    const scaleY = canvas.height / rect.height;
    const x = (clientX - rect.left) * scaleX;
    const y = (clientY - rect.top) * scaleY;

    const dx = x - CENTER;
    const dy = y - CENTER;
    const dist = Math.min(Math.sqrt(dx * dx + dy * dy), WHEEL_RADIUS);
    let angle = Math.atan2(dy, dx) * (180 / Math.PI) + 90;
    if (angle < 0) angle += 360;
    if (angle >= 360) angle -= 360;

    return {
      hue: angle,
      saturation: (dist / WHEEL_RADIUS) * 100,
    };
  }, []);

  const hitTest = useCallback((clientX: number, clientY: number): string | null => {
    const canvas = canvasRef.current!;
    const rect = canvas.getBoundingClientRect();
    const scaleX = canvas.width / rect.width;
    const scaleY = canvas.height / rect.height;
    const x = (clientX - rect.left) * scaleX;
    const y = (clientY - rect.top) * scaleY;

    for (const stop of stops) {
      const angleRad = (stop.hue - 90) * (Math.PI / 180);
      const dist = (stop.saturation / 100) * WHEEL_RADIUS;
      const sx = CENTER + dist * Math.cos(angleRad);
      const sy = CENTER + dist * Math.sin(angleRad);
      const d = Math.sqrt((x - sx) ** 2 + (y - sy) ** 2);
      if (d <= PICKER_RADIUS + 4) return stop.id;
    }
    return null;
  }, [stops]);

  const handlePointerDown = useCallback((e: React.PointerEvent) => {
    const hit = hitTest(e.clientX, e.clientY);
    if (hit) {
      draggingRef.current = hit;
      onStopSelect(hit);
      (e.target as HTMLElement).setPointerCapture(e.pointerId);
    }
  }, [hitTest, onStopSelect]);

  const handlePointerMove = useCallback((e: React.PointerEvent) => {
    if (!draggingRef.current) return;
    const { hue, saturation } = posToHsl(e.clientX, e.clientY);
    const stop = stops.find((s) => s.id === draggingRef.current);
    if (stop) {
      onStopChange(draggingRef.current, hue, saturation, stop.lightness);
    }
  }, [stops, posToHsl, onStopChange]);

  const handlePointerUp = useCallback(() => {
    draggingRef.current = null;
  }, []);

  return (
    <canvas
      ref={canvasRef}
      width={CANVAS_SIZE}
      height={CANVAS_SIZE}
      className="max-w-full cursor-crosshair"
      style={{ imageRendering: "pixelated" }}
      onPointerDown={handlePointerDown}
      onPointerMove={handlePointerMove}
      onPointerUp={handlePointerUp}
    />
  );
}
