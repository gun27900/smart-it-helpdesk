import { Router } from "express";
import bcrypt from "bcryptjs";
import jwt from "jsonwebtoken";
import { z } from "zod";

import { prisma } from "../lib/prisma";

import { authenticate } from "../middleware/auth";
import type { AuthRequest } from "../types/auth";

const router = Router();

const registerSchema = z.object({
  name: z.string().min(2),
  email: z.string().email(),
  password: z.string().min(8),
});

const loginSchema = z.object({
  email: z.string().email(),
  password: z.string().min(1),
});

// REGISTER
router.post("/register", async (req, res) => {
  try {
    const result = registerSchema.safeParse(req.body);

    if (!result.success) {
      return res.status(400).json({
        message: "ข้อมูลไม่ถูกต้อง",
        errors: result.error.flatten(),
      });
    }

    const { name, password } = result.data;
    const email = result.data.email.toLowerCase();

    const existingUser = await prisma.user.findUnique({
      where: { email },
    });

    if (existingUser) {
      return res.status(409).json({
        message: "อีเมลนี้ถูกใช้งานแล้ว",
      });
    }

    const passwordHash = await bcrypt.hash(password, 12);

    const user = await prisma.user.create({
      data: {
        name,
        email,
        passwordHash,
      },
      select: {
        id: true,
        name: true,
        email: true,
        role: true,
        createdAt: true,
      },
    });

    return res.status(201).json({
      message: "สมัครสมาชิกสำเร็จ",
      user,
    });
  } catch (error) {
    console.error(error);

    return res.status(500).json({
      message: "เกิดข้อผิดพลาดภายใน Server",
    });
  }
});

// LOGIN
router.post("/login", async (req, res) => {
  try {
    const result = loginSchema.safeParse(req.body);

    if (!result.success) {
      return res.status(400).json({
        message: "ข้อมูลไม่ถูกต้อง",
      });
    }

    const email = result.data.email.toLowerCase();
    const password = result.data.password;

    const user = await prisma.user.findUnique({
      where: { email },
    });

    if (!user) {
      return res.status(401).json({
        message: "อีเมลหรือรหัสผ่านไม่ถูกต้อง",
      });
    }

    const passwordCorrect = await bcrypt.compare(
      password,
      user.passwordHash
    );

    if (!passwordCorrect) {
      return res.status(401).json({
        message: "อีเมลหรือรหัสผ่านไม่ถูกต้อง",
      });
    }

    const token = jwt.sign(
      {
        role: user.role,
      },
      process.env.JWT_SECRET!,
      {
        subject: String(user.id),
        expiresIn: "1d",
      }
    );

    return res.json({
      message: "เข้าสู่ระบบสำเร็จ",
      token,
      user: {
        id: user.id,
        name: user.name,
        email: user.email,
        role: user.role,
      },
    });
  } catch (error) {
    console.error(error);

    return res.status(500).json({
      message: "เกิดข้อผิดพลาดภายใน Server",
    });
  }
});

router.get(
  "/me",
  authenticate,
  async (req: AuthRequest, res) => {
    try {
      const user = await prisma.user.findUnique({
        where: {
          id: req.user!.id,
        },
        select: {
          id: true,
          name: true,
          email: true,
          role: true,
          createdAt: true,
        },
      });

      if (!user) {
        return res.status(404).json({
          message: "ไม่พบผู้ใช้งาน",
        });
      }

      return res.json(user);
    } catch (error) {
      console.error(error);

      return res.status(500).json({
        message: "เกิดข้อผิดพลาดภายใน Server",
      });
    }
  }
);

export default router;