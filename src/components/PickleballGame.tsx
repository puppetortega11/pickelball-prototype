"use client";

import React, { useRef, useEffect, useCallback } from "react";
import { updateAI, adaptDifficulty } from "@/lib/ai";
import { COURT } from "@/lib/config";
import { stepBall, collideWithPaddle, paddleHitResponse, resetBallForServe } from "@/lib/physics";
import { checkPoint, awardPoint, hasWinner } from "@/lib/scoring";
import type { State } from "@/lib/types";

export default function PickleballGame() {
  const canvasRef = useRef<HTMLCanvasElement>(null);
  const gameStateRef = useRef<State | null>(null);
  const keysRef = useRef<Set<string>>(new Set());
  const animationIdRef = useRef<number | null>(null);
  const lastTimeRef = useRef<number>(0);

  const initializeGame = useCallback(() => {
    const canvas = canvasRef.current;
    if (!canvas) return null;

    const state: State = {
      w: canvas.width,
      h: canvas.height,
      netH: COURT.NET_H,
      ball: {
        pos: { x: 450, y: 275 },
        vel: { x: 420, y: 80 },
        r: COURT.BALL_R,
        speed: COURT.BASE_BALL_SPEED,
      },
      p1: {
        pos: { x: 40, y: (canvas.height - COURT.PADDLE_H) / 2 },
        w: COURT.PADDLE_W,
        h: COURT.PADDLE_H,
        maxSpeed: COURT.BASE_PADDLE_SPEED,
        human: true,
      },
      p2: {
        pos: { x: canvas.width - 40 - COURT.PADDLE_W, y: (canvas.height - COURT.PADDLE_H) / 2 },
        w: COURT.PADDLE_W,
        h: COURT.PADDLE_H,
        maxSpeed: COURT.BASE_PADDLE_SPEED,
        human: false,
      },
      score: { p1: 0, p2: 0 },
      serving: "p1",
      rally: 0,
      paused: false,
      aiLevel: 3,
    };

    resetBallForServe(state, state.serving);
    return state;
  }, []);

  const update = useCallback((state: State, dt: number) => {
    const p = state.p1;
    let vy = 0;
    if (keysRef.current.has("w") || keysRef.current.has("ArrowUp")) vy -= p.maxSpeed;
    if (keysRef.current.has("s") || keysRef.current.has("ArrowDown")) vy += p.maxSpeed;
    p.pos.y += vy * dt;
    p.pos.y = Math.max(0, Math.min(state.h - p.h, p.pos.y));

    updateAI(state, dt);
    stepBall(state, dt);

    if (
      collideWithPaddle(
        state.p1.pos.x,
        state.p1.pos.y,
        state.p1.w,
        state.p1.h,
        state.ball.pos,
        state.ball.r
      ) &&
      state.ball.vel.x < 0
    ) {
      paddleHitResponse(state, true);
      state.rally++;
    }
    if (
      collideWithPaddle(
        state.p2.pos.x,
        state.p2.pos.y,
        state.p2.w,
        state.p2.h,
        state.ball.pos,
        state.ball.r
      ) &&
      state.ball.vel.x > 0
    ) {
      paddleHitResponse(state, false);
      state.rally++;
    }

    const point = checkPoint(state);
    if (point) {
      awardPoint(state, point);
      adaptDifficulty(state);
    }
  }, []);

  const draw = useCallback(
    (
      canvas: HTMLCanvasElement,
      ctx: CanvasRenderingContext2D,
      state: State,
      bg: HTMLImageElement
    ) => {
      if (bg.complete && bg.naturalWidth > 0) {
        ctx.drawImage(bg, 0, 0, state.w, state.h);
      } else {
        ctx.fillStyle = "#2a845e";
        ctx.fillRect(0, 0, state.w, state.h);
      }

      ctx.strokeStyle = "rgba(255,255,255,.9)";
      ctx.lineWidth = 2;
      ctx.strokeRect(20, 20, state.w - 40, state.h - 40);

      ctx.fillStyle = "rgba(255,255,255,0.9)";
      ctx.fillRect(state.w / 2 - 1, state.h / 2 - state.netH / 2, 2, state.netH);

      ctx.fillStyle = "rgba(0,0,0,.8)";
      ctx.fillRect(state.p1.pos.x, state.p1.pos.y, state.p1.w, state.p1.h);
      ctx.fillRect(state.p2.pos.x, state.p2.pos.y, state.p2.w, state.p2.h);

      ctx.beginPath();
      ctx.arc(state.ball.pos.x, state.ball.pos.y, state.ball.r, 0, Math.PI * 2);
      ctx.fillStyle = "#fff";
      ctx.fill();

      ctx.font = "24px system-ui, -apple-system, Segoe UI, Roboto";
      ctx.fillStyle = "#ffffff";
      ctx.fillText(`${state.score.p1}`, state.w * 0.25, 36);
      ctx.fillText(`${state.score.p2}`, state.w * 0.75, 36);

      if (hasWinner(state)) {
        const winner = state.score.p1 > state.score.p2 ? "You win!" : "AI wins!";
        ctx.fillText(winner + " (Space to restart)", state.w / 2 - 170, state.h / 2 - 160);
        if (state.paused) {
          state.score.p1 = 0;
          state.score.p2 = 0;
          state.aiLevel = 3;
          state.serving = "p1";
          state.paused = false;
          resetBallForServe(state, state.serving);
        }
      }
    },
    []
  );

  const gameLoop = useCallback(
    (now: number) => {
      const canvas = canvasRef.current;
      const state = gameStateRef.current;
      if (!canvas || !state) return;

      const ctx = canvas.getContext("2d");
      if (!ctx) return;

      const dt = Math.min(0.033, (now - lastTimeRef.current) / 1000);
      lastTimeRef.current = now;

      if (!state.paused) {
        update(state, dt);
      }

      const bg = new Image();
      bg.src = "/court.jpg";
      draw(canvas, ctx, state, bg);

      animationIdRef.current = requestAnimationFrame(gameLoop);
    },
    [update, draw]
  );

  useEffect(() => {
    const canvas = canvasRef.current;
    if (!canvas) return;

    const state = initializeGame();
    if (!state) return;

    gameStateRef.current = state;
    lastTimeRef.current = performance.now();

    const handleKeyDown = (e: KeyboardEvent) => {
      if (["w", "s", "ArrowUp", "ArrowDown", " "].includes(e.key)) {
        e.preventDefault();
      }
      keysRef.current.add(e.key);
      if (e.key === " " && state) {
        state.paused = !state.paused;
      }
    };

    const handleKeyUp = (e: KeyboardEvent) => {
      keysRef.current.delete(e.key);
    };

    window.addEventListener("keydown", handleKeyDown);
    window.addEventListener("keyup", handleKeyUp);

    animationIdRef.current = requestAnimationFrame(gameLoop);

    return () => {
      window.removeEventListener("keydown", handleKeyDown);
      window.removeEventListener("keyup", handleKeyUp);
      if (animationIdRef.current) {
        cancelAnimationFrame(animationIdRef.current);
      }
    };
  }, [initializeGame, gameLoop]);

  return (
    <div className="flex items-center justify-center min-h-screen bg-slate-900">
      <div className="relative">
        <div className="fixed top-3 left-1/2 transform -translate-x-1/2 text-white bg-black/35 px-4 py-2 rounded-lg font-sans">
          Move: W/S or ↑/↓ · Pause: Space
        </div>
        <canvas
          ref={canvasRef}
          width={900}
          height={550}
          className="w-[900px] h-[550px] rounded-xl shadow-2xl"
        />
      </div>
    </div>
  );
}
