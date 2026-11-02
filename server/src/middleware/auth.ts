import type { NextFunction, Response } from "express";
import jwt from "jsonwebtoken";

import type { AuthRequest, Role } from "../types/auth";

export function authenticate(
  req: AuthRequest,
  res: Response,
  next: NextFunction
) {
  const authorization = req.headers.authorization;

  if (!authorization?.startsWith("Bearer ")) {
    return res.status(401).json({
      message: "กรุณาเข้าสู่ระบบ",
    });
  }

  const token = authorization.split(" ")[1];

  try {
    const payload = jwt.verify(
      token,
      process.env.JWT_SECRET!
    ) as {
      sub: string;
      role: Role;
    };

    req.user = {
      id: Number(payload.sub),
      role: payload.role,
    };

    next();
  } catch {
    return res.status(401).json({
      message: "Token ไม่ถูกต้องหรือหมดอายุ",
    });
  }
}

export function requireRole(...roles: Role[]) {
  return (
    req: AuthRequest,
    res: Response,
    next: NextFunction
  ) => {
    if (!req.user) {
      return res.status(401).json({
        message: "กรุณาเข้าสู่ระบบ",
      });
    }

    if (!roles.includes(req.user.role)) {
      return res.status(403).json({
        message: "คุณไม่มีสิทธิ์ใช้งานส่วนนี้",
      });
    }

    next();
  };
}