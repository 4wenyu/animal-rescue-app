/**
 * Shared types for the ShareToEarnWidget tree.
 */

export interface ShareProgress {
  total: number;
  verified: number;
  pending: number;
  milestone: number;
}

export interface ShareProgressResponse {
  ok?: boolean;
  total?: number;
  verified?: number;
  pending?: number;
  milestone?: number;
  message?: string;
}

export type GrantState =
  | { status: "idle" }
  | { status: "claiming" }
  | { status: "claimed"; balanceAfter?: number }
  | { status: "already"; balanceAfter?: number }
  | { status: "error"; message: string };

export const INITIAL_PROGRESS: ShareProgress = {
  total: 0,
  verified: 0,
  pending: 0,
  milestone: 10,
};
