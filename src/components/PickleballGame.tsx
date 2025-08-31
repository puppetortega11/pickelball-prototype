'use client';

import React, { useRef, useEffect, useCallback } from 'react';
import { COURT } from '@/lib/config';
import type { State } from '@/lib/types';
import { stepBall, collideWithPaddle, paddleHitResponse, resetBallForServe } from '@/lib/physics';
import { checkPoint, awardPoint, hasWinner } from '@/lib/scoring';
import { updateAI, adaptDifficulty } from '@/lib/ai';

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
        speed: COURT.BASE_BALL_SPEED 
      },
      p1: { 
        pos: { x: 40, y: (canvas.height - COURT.PADDLE_H) / 2 }, 
        w: COURT.PADDLE_W, 
        h: COURT.PADDLE_H, 
        maxSpeed: COURT.BASE_PADDLE_SPEED, 
        human: true,
        name: "Player",
        avatar: {
          color: "#4A90E2",
          flag: "🇺🇸"
        }
      },
      p2: { 
        pos: { x: canvas.width - 40 - COURT.PADDLE_W, y: (canvas.height - COURT.PADDLE_H) / 2 }, 
        w: COURT.PADDLE_W, 
        h: COURT.PADDLE_H, 
        maxSpeed: COURT.BASE_PADDLE_SPEED, 
        human: false,
        name: "AI Opponent",
        avatar: {
          color: "#E24A4A",
          flag: "🤖"
        }
      },
      score: { p1: 0, p2: 0 },
      serving: "p1",
      rally: 0,
      paused: false,
      aiLevel: 3
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

    if (collideWithPaddle(state.p1.pos.x, state.p1.pos.y, state.p1.w, state.p1.h, state.ball.pos, state.ball.r) && state.ball.vel.x < 0) {
      paddleHitResponse(state, true);
      state.rally++;
    }
    if (collideWithPaddle(state.p2.pos.x, state.p2.pos.y, state.p2.w, state.p2.h, state.ball.pos, state.ball.r) && state.ball.vel.x > 0) {
      paddleHitResponse(state, false);
      state.rally++;
    }

    const point = checkPoint(state);
    if (point) {
      awardPoint(state, point);
      adaptDifficulty(state);
    }
  }, []);

  const draw = useCallback((canvas: HTMLCanvasElement, ctx: CanvasRenderingContext2D, state: State, bg: HTMLImageElement) => {
    if (bg.complete && bg.naturalWidth > 0) {
      ctx.drawImage(bg, 0, 0, state.w, state.h);
      ctx.fillStyle = "rgba(139, 69, 19, 0.2)";
      ctx.fillRect(0, 0, state.w, state.h);
    } else {
      const gradient = ctx.createLinearGradient(0, 0, 0, state.h);
      gradient.addColorStop(0, "#8B4513");
      gradient.addColorStop(0.5, "#A0522D");
      gradient.addColorStop(1, "#8B4513");
      ctx.fillStyle = gradient;
      ctx.fillRect(0, 0, state.w, state.h);
    }

    ctx.strokeStyle = "rgba(255,255,255,.9)";
    ctx.lineWidth = 2;
    ctx.strokeRect(20, 20, state.w - 40, state.h - 40);

    ctx.fillStyle = "rgba(255,255,255,0.9)";
    ctx.fillRect(state.w / 2 - 1, state.h / 2 - state.netH / 2, 2, state.netH);

    ctx.beginPath();
    ctx.arc(state.p1.pos.x + state.p1.w/2, state.p1.pos.y + state.p1.h/2, 25, 0, Math.PI * 2);
    ctx.fillStyle = state.p1.avatar.color;
    ctx.fill();
    ctx.strokeStyle = "#ffffff";
    ctx.lineWidth = 3;
    ctx.stroke();
    
    ctx.font = "16px system-ui";
    ctx.fillStyle = "#ffffff";
    ctx.textAlign = "center";
    ctx.fillText(state.p1.avatar.flag || "P1", state.p1.pos.x + state.p1.w/2, state.p1.pos.y + state.p1.h/2 + 5);
    
    ctx.beginPath();
    ctx.arc(state.p2.pos.x + state.p2.w/2, state.p2.pos.y + state.p2.h/2, 25, 0, Math.PI * 2);
    ctx.fillStyle = state.p2.avatar.color;
    ctx.fill();
    ctx.strokeStyle = "#ffffff";
    ctx.lineWidth = 3;
    ctx.stroke();
    
    ctx.font = "16px system-ui";
    ctx.fillStyle = "#ffffff";
    ctx.textAlign = "center";
    ctx.fillText(state.p2.avatar.flag || "P2", state.p2.pos.x + state.p2.w/2, state.p2.pos.y + state.p2.h/2 + 5);

    ctx.beginPath();
    ctx.arc(state.ball.pos.x + 2, state.ball.pos.y + 2, state.ball.r, 0, Math.PI * 2);
    ctx.fillStyle = "rgba(0,0,0,0.3)";
    ctx.fill();
    
    const ballGradient = ctx.createRadialGradient(state.ball.pos.x-3, state.ball.pos.y-3, 0, state.ball.pos.x, state.ball.pos.y, state.ball.r);
    ballGradient.addColorStop(0, "#ffffff");
    ballGradient.addColorStop(0.7, "#f0f0f0");
    ballGradient.addColorStop(1, "#cccccc");
    ctx.beginPath();
    ctx.arc(state.ball.pos.x, state.ball.pos.y, state.ball.r, 0, Math.PI * 2);
    ctx.fillStyle = ballGradient;
    ctx.fill();
    
    ctx.beginPath();
    ctx.arc(state.ball.pos.x - 2, state.ball.pos.y - 2, state.ball.r * 0.3, 0, Math.PI * 2);
    ctx.fillStyle = "rgba(255,255,255,0.8)";
    ctx.fill();

    ctx.textAlign = "center";
    
    ctx.fillStyle = "rgba(0,0,0,0.8)";
    ctx.fillRect(state.w * 0.2, 10, 100, 60);
    ctx.strokeStyle = state.p1.avatar.color;
    ctx.lineWidth = 2;
    ctx.strokeRect(state.w * 0.2, 10, 100, 60);
    
    ctx.font = "bold 32px system-ui, -apple-system, Segoe UI, Roboto";
    ctx.fillStyle = "#ffffff";
    ctx.fillText(`${state.score.p1}`, state.w * 0.25, 50);
    
    ctx.font = "12px system-ui";
    ctx.fillStyle = state.p1.avatar.color;
    ctx.fillText(state.p1.name, state.w * 0.25, 25);
    
    ctx.fillStyle = "rgba(0,0,0,0.8)";
    ctx.fillRect(state.w * 0.7, 10, 100, 60);
    ctx.strokeStyle = state.p2.avatar.color;
    ctx.lineWidth = 2;
    ctx.strokeRect(state.w * 0.7, 10, 100, 60);
    
    ctx.font = "bold 32px system-ui, -apple-system, Segoe UI, Roboto";
    ctx.fillStyle = "#ffffff";
    ctx.fillText(`${state.score.p2}`, state.w * 0.75, 50);
    
    ctx.font = "12px system-ui";
    ctx.fillStyle = state.p2.avatar.color;
    ctx.fillText(state.p2.name, state.w * 0.75, 25);
    
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
  }, []);

  const gameLoop = useCallback((now: number) => {
    const canvas = canvasRef.current;
    const state = gameStateRef.current;
    if (!canvas || !state) return;

    const ctx = canvas.getContext('2d');
    if (!ctx) return;

    const dt = Math.min(0.033, (now - lastTimeRef.current) / 1000);
    lastTimeRef.current = now;

    if (!state.paused) {
      update(state, dt);
    }

    const bg = new Image();
    bg.src = '/court.jpg';
    draw(canvas, ctx, state, bg);

    animationIdRef.current = requestAnimationFrame(gameLoop);
  }, [update, draw]);

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
