import { Router } from "express";

import { prisma } from "../lib/prisma";
import { authenticate } from "../middleware/auth";

import type { AuthRequest } from "../types/auth";

const router = Router();

router.use(authenticate);

router.get(
  "/stats",
  async (req: AuthRequest, res) => {
    try {
      const baseWhere =
        req.user!.role === "USER"
          ? {
              createdById: req.user!.id,
            }
          : {};

      const [
        total,
        open,
        inProgress,
        resolved,
        closed,
      ] = await Promise.all([
        prisma.ticket.count({
          where: baseWhere,
        }),

        prisma.ticket.count({
          where: {
            ...baseWhere,
            status: "OPEN",
          },
        }),

        prisma.ticket.count({
          where: {
            ...baseWhere,
            status: "IN_PROGRESS",
          },
        }),

        prisma.ticket.count({
          where: {
            ...baseWhere,
            status: "RESOLVED",
          },
        }),

        prisma.ticket.count({
          where: {
            ...baseWhere,
            status: "CLOSED",
          },
        }),
      ]);

      return res.json({
        total,
        open,
        inProgress,
        resolved,
        closed,
      });
    } catch (error) {
      console.error(error);

      return res.status(500).json({
        message: "เกิดข้อผิดพลาดภายใน Server",
      });
    }
  }
);

export default router;