export const TILE_SIZE = 1
export const SIMULATION_PERIOD_S = 1 / 60
export const MAX_PREDICTED_FRAMES = 12
export const PLAYER_COUNT = 1
export const SERVER_PORT = 3000
export const CLIENT_INPUT_DELAY = 3

// Gameplay
//////////////////////////////////////////

// Player
export const PLAYER_HEALTH = 100

// Move
export const TANK_SPEED = 60 * (TILE_SIZE / 8)
export const TANK_ROT_SPEED = Math.PI

// Dash
export const DASH_DURATION = 6
export const DASH_SPEED = 60 * (TILE_SIZE / 1.25)
export const DASH_COOLDOWN = 25

// Gun stuff
export const EXTERNAL_VELOCITY_DECELERATION = 0.05
export const DEFAULT_BULLET_KNOCKBACK = 0.3
export const DEFAULT_SHOT_RECOIL = 0.15
export const MORTAR_TTL = 1

// Camera
export const CAMERA_MIN_Y_OFFSET = 3
export const CAMERA_MAX_Y_OFFSET = 12
export const CAMERA_Z_OFFSET = 3
