"use client";

import React, { useRef, useEffect, useCallback } from "react";
import { updateAI, adaptDifficulty } from "@/lib/ai";
import { COURT } from "@/lib/config";
import { stepBall, collideWithPaddle, paddleHitResponse, resetBallForServe, isInNVZ } from "@/lib/physics";
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
        bounces: 0,
        lastBounceTime: 0,
      },
      p1: {
        pos: { x: 40, y: (canvas.height - COURT.PADDLE_H) / 2 },
        w: COURT.PADDLE_W,
        h: COURT.PADDLE_H,
        maxSpeed: COURT.BASE_PADDLE_SPEED,
        human: true,
        inNVZ: false,
      },
      p2: {
        pos: { x: canvas.width - 40 - COURT.PADDLE_W, y: (canvas.height - COURT.PADDLE_H) / 2 },
        w: COURT.PADDLE_W,
        h: COURT.PADDLE_H,
        maxSpeed: COURT.BASE_PADDLE_SPEED,
        human: false,
        inNVZ: false,
      },
      score: { p1: 0, p2: 0 },
      serve: {
        server: "p1",
        serviceCourt: "right",
        isFirstServe: true,
        serveAttempts: 0,
      },
      rally: {
        ballBounced: { p1Side: false, p2Side: false },
        canVolley: { p1: false, p2: false },
        rallyNumber: 0,
      },
      paused: false,
      aiLevel: 3,
      gameMode: "singles",
      scoringMode: "traditional",
      lastFault: null,
    };

    resetBallForServe(state);
    return state;
  }, []);

  const update = useCallback((state: State, dt: number) => {
    const p = state.p1;
    let vy = 0;
    if (keysRef.current.has("w") || keysRef.current.has("ArrowUp")) vy -= p.maxSpeed;
    if (keysRef.current.has("s") || keysRef.current.has("ArrowDown")) vy += p.maxSpeed;
    p.pos.y += vy * dt;
    p.pos.y = Math.max(0, Math.min(state.h - p.h, p.pos.y));

    state.p1.inNVZ = isInNVZ(state.p1.pos, state.p1.w);
    state.p2.inNVZ = isInNVZ(state.p2.pos, state.p2.w);

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
      const fault = paddleHitResponse(state, true);
      if (fault) {
        state.lastFault = fault;
      }
      state.rally.rallyNumber++;
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
      const fault = paddleHitResponse(state, false);
      if (fault) {
        state.lastFault = fault;
      }
      state.rally.rallyNumber++;
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
      ctx.strokeRect(COURT.SIDELINE_X, COURT.BASELINE_Y, state.w - 2 * COURT.SIDELINE_X, state.h - 2 * COURT.BASELINE_Y);

      ctx.strokeStyle = "rgba(255,255,255,0.6)";
      ctx.lineWidth = 1;
      ctx.beginPath();
      ctx.moveTo(COURT.SIDELINE_X, COURT.BASELINE_Y + COURT.SERVICE_LINE_Y);
      ctx.lineTo(COURT.W - COURT.SIDELINE_X, COURT.BASELINE_Y + COURT.SERVICE_LINE_Y);
      ctx.moveTo(COURT.SIDELINE_X, COURT.H - COURT.BASELINE_Y - COURT.SERVICE_LINE_Y);
      ctx.lineTo(COURT.W - COURT.SIDELINE_X, COURT.H - COURT.BASELINE_Y - COURT.SERVICE_LINE_Y);
      ctx.moveTo(COURT.CENTERLINE_X, COURT.BASELINE_Y);
      ctx.lineTo(COURT.CENTERLINE_X, COURT.BASELINE_Y + COURT.SERVICE_LINE_Y);
      ctx.moveTo(COURT.CENTERLINE_X, COURT.H - COURT.BASELINE_Y - COURT.SERVICE_LINE_Y);
      ctx.lineTo(COURT.CENTERLINE_X, COURT.H - COURT.BASELINE_Y);
      ctx.stroke();

      ctx.fillStyle = "rgba(255,255,0,0.1)";
      ctx.fillRect(COURT.SIDELINE_X, state.h / 2 - COURT.NVZ_DEPTH / 2, COURT.W - 2 * COURT.SIDELINE_X, COURT.NVZ_DEPTH);

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
      
      ctx.font = "14px system-ui, -apple-system, Segoe UI, Roboto";
      ctx.fillStyle = "#ffffff";
      ctx.fillText(`Server: ${state.serve.server.toUpperCase()} (${state.serve.serviceCourt})`, state.w / 2 - 60, 50);
      ctx.fillText(`Rally: ${state.rally.rallyNumber} | Bounces: ${state.ball.bounces}`, state.w / 2 - 60, 70);
      if (state.lastFault) {
        ctx.fillStyle = "#ff6b6b";
        ctx.fillText(`Fault: ${state.lastFault.replace(/_/g, ' ')}`, state.w / 2 - 80, state.h - 20);
      }

      if (hasWinner(state)) {
        const winner = state.score.p1 > state.score.p2 ? "You win!" : "AI wins!";
        ctx.fillText(winner + " (Space to restart)", state.w / 2 - 170, state.h / 2 - 160);
        if (state.paused) {
          state.score.p1 = 0;
          state.score.p2 = 0;
          state.aiLevel = 3;
          state.serve.server = "p1";
          state.serve.serviceCourt = "right";
          state.serve.isFirstServe = true;
          state.serve.serveAttempts = 0;
          state.rally.ballBounced = { p1Side: false, p2Side: false };
          state.rally.canVolley = { p1: false, p2: false };
          state.rally.rallyNumber = 0;
          state.lastFault = null;
          state.paused = false;
          resetBallForServe(state);
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
