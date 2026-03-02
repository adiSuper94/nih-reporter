import { Effect } from "effect";
import { Headers } from "effect/unstable/http";

export type RateLimitConfig = {
  threshold: number;
  maxWaitMs: number;
};

export const rateLimitConfig: RateLimitConfig = {
  threshold: 50,
  maxWaitMs: 30000,
};

type RateLimitState = {
  max: number;
  remaining: number;
  resetTime: number;
  lastCallTime: number;
};

const initialState: RateLimitState = {
  max: 200,
  remaining: 200,
  resetTime: 0,
  lastCallTime: 0,
};

let rateLimitState: RateLimitState = { ...initialState };

export function throttle(): Effect.Effect<void, never> {
  return Effect.gen(function* () {
    const now = Date.now();
    if (now >= rateLimitState.resetTime) {
      rateLimitState = { ...rateLimitState, remaining: rateLimitState.max, lastCallTime: now };
      return;
    } else if (rateLimitState.remaining >= rateLimitConfig.threshold) {
      rateLimitState = { ...rateLimitState, lastCallTime: now };
      return;
    }
    const deficit = rateLimitConfig.threshold - rateLimitState.remaining;
    const timeUntilReset = rateLimitState.resetTime - now;
    const waitTime = Math.min((deficit / rateLimitState.max) * timeUntilReset * 0.5, rateLimitConfig.maxWaitMs);
    yield* Effect.sleep(waitTime);
    const newNow = Date.now();
    rateLimitState = { ...rateLimitState, lastCallTime: newNow };
  });
}

export function updateRateLimitState(headers: Headers.Headers): Effect.Effect<void> {
  const remaining = headers["x-rate-limit-remaining"];
  const reset = headers["x-rate-limit-reset"];
  if (!remaining || !reset) {
    return Effect.void;
  }
  const remainingVal = parseInt(remaining, 10);
  const resetTimeVal = new Date(reset).getTime();
  rateLimitState = {
    ...rateLimitState,
    remaining: remainingVal,
    resetTime: resetTimeVal,
  };
  return Effect.void;
}
