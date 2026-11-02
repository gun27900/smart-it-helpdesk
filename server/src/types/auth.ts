import type { Request } from "express";

export type Role = "USER" | "STAFF" | "ADMIN";

export interface AuthRequest extends Request {
  user?: {
    id: number;
    role: Role;
  };
}