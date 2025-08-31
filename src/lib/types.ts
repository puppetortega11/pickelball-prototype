export type Vec = { x: number; y: number };

export type Ball = {
  pos: Vec;
  vel: Vec;
  r: number;
  speed: number;
  bounces: number; // Track bounces for two-bounce rule
  lastBounceTime: number;
};

export type Paddle = {
  pos: Vec; // top-left
  w: number;
  h: number;
  maxSpeed: number;
  human: boolean;
  inNVZ: boolean; // Track if paddle is in non-volley zone
};

export type Score = { p1: number; p2: number };

export type ServiceCourt = "right" | "left";

export type GameMode = "singles" | "doubles";

export type ScoringMode = "traditional" | "rally";

export type ServeState = {
  server: "p1" | "p2";
  serviceCourt: ServiceCourt;
  isFirstServe: boolean; // For doubles side-out tracking
  serveAttempts: number; // Track serve attempts (max 1 per rally)
};

export type RallyState = {
  ballBounced: { p1Side: boolean; p2Side: boolean };
  canVolley: { p1: boolean; p2: boolean };
  rallyNumber: number;
};

export type Fault = 
  | "serve_out_of_bounds"
  | "serve_into_kitchen"
  | "net_contact"
  | "volley_before_double_bounce"
  | "ball_out_of_bounds"
  | "volley_from_nvz"
  | "double_bounce"
  | "net_touch"
  | "ball_hit_player"
  | "ball_hit_permanent_object";

export type State = {
  w: number;
  h: number;
  netH: number;
  ball: Ball;
  p1: Paddle;
  p2: Paddle;
  score: Score;
  serve: ServeState;
  rally: RallyState;
  paused: boolean;
  aiLevel: number; // 0..10
  gameMode: GameMode;
  scoringMode: ScoringMode;
  lastFault: Fault | null;
};
