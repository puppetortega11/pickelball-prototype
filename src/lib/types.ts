export type Vec = { x: number; y: number };

export type Ball = {
  pos: Vec;
  vel: Vec;
  r: number;
  speed: number;
};

export type Paddle = {
  pos: Vec; // top-left
  w: number;
  h: number;
  maxSpeed: number;
  human: boolean;
};

export type Score = { p1: number; p2: number };

export type State = {
  w: number;
  h: number;
  netH: number;
  ball: Ball;
  p1: Paddle;
  p2: Paddle;
  score: Score;
  serving: "p1" | "p2";
  rally: number;
  paused: boolean;
  aiLevel: number; // 0..10
};
