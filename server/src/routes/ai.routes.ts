import { Router } from "express";
import { z } from "zod";

import {
  authenticate,
} from "../middleware/auth";

import type {
  AuthRequest,
} from "../types/auth";

const router = Router();

router.use(authenticate);

const suggestSchema = z.object({
  title: z
    .string()
    .min(3)
    .max(200),

  description: z
    .string()
    .max(2000)
    .default(""),
});

router.post(
  "/suggest",
  async (
    req: AuthRequest,
    res
  ) => {
    try {
      const result =
        suggestSchema.safeParse(
          req.body
        );

      if (!result.success) {
        return res.status(400).json({
          message:
            "ข้อมูลสำหรับ AI ไม่ถูกต้อง",
          errors:
            result.error.flatten(),
        });
      }

      const aiUrl =
        process.env
          .AI_SERVICE_URL ||
        "http://127.0.0.1:8000";

      const response =
        await fetch(
          `${aiUrl}/predict`,
          {
            method: "POST",

            headers: {
              "Content-Type":
                "application/json",
            },

            body: JSON.stringify({
              title:
                result.data.title,

              description:
                result.data
                  .description,
            }),
          }
        );

      if (!response.ok) {
        console.error(
          "AI service error:",
          response.status
        );

        return res
          .status(502)
          .json({
            message:
              "AI Service ไม่สามารถประมวลผลได้",
          });
      }

      const prediction =
        await response.json();

      return res.json({
        message:
          "AI suggestion สำเร็จ",

        suggestion:
          prediction,
      });
    } catch (error) {
      console.error(
        "AI suggestion error:",
        error
      );

      return res.status(503).json({
        message:
          "ไม่สามารถเชื่อมต่อ AI Service ได้",
      });
    }
  }
);

export default router;