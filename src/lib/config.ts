export const COURT = {
  W: 900,
  H: 550,
  NET_H: 8,
  PADDLE_W: 14,
  PADDLE_H: 90,
  BALL_R: 8,
  BASE_BALL_SPEED: 420, // px/s
  BASE_PADDLE_SPEED: 340,
  
  BASELINE_Y: 50, // Distance from top/bottom edge
  SIDELINE_X: 50, // Distance from left/right edge
  SERVICE_LINE_Y: 200, // Distance from baseline to service line
  CENTERLINE_X: 450, // Center of court (divides service courts)
  NVZ_DEPTH: 126, // Non-volley zone depth (7ft scaled)
  
  SERVICE_COURT_W: 400, // Width of each service court
  SERVICE_COURT_H: 150, // Height of each service court
};

export const RULES = {
  TO_WIN: 11,
  WIN_BY: 2,
  AI_MAX_LEVEL: 10,
  
  MAX_SERVE_ATTEMPTS: 1,
  DOUBLE_BOUNCE_REQUIRED: true,
  NVZ_VOLLEY_FORBIDDEN: true,
  SIDE_OUT_SCORING: true, // Only serving team can score
  
  GAME_FORMATS: [11, 15, 21] as const,
  SCORING_MODES: ["traditional", "rally"] as const,
};
