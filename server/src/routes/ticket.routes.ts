import { Router } from "express";
import { z } from "zod";

import { prisma } from "../lib/prisma";
import {
  authenticate,
  requireRole,
} from "../middleware/auth";

import type { AuthRequest } from "../types/auth";

const router = Router();

router.use(authenticate);

const createTicketSchema = z.object({
  title: z.string().min(3),

  description: z.string().min(5),

  category: z.enum([
    "HARDWARE",
    "SOFTWARE",
    "NETWORK",
    "ACCOUNT",
    "OTHER",
  ]),

  priority: z
    .enum([
      "LOW",
      "MEDIUM",
      "HIGH",
      "CRITICAL",
    ])
    .default("MEDIUM"),

  aiAnalysis: z
    .object({
      categorySuggested: z.enum([
        "HARDWARE",
        "SOFTWARE",
        "NETWORK",
        "ACCOUNT",
        "OTHER",
      ]),

      categoryConfidence: z
        .number()
        .min(0)
        .max(1),

      prioritySuggested: z.enum([
        "LOW",
        "MEDIUM",
        "HIGH",
        "CRITICAL",
      ]),

      priorityConfidence: z
        .number()
        .min(0)
        .max(1),

      prioritySource: z.string(),

      needsReview: z.boolean(),
    })
    .optional(),
});

// CREATE TICKET
router.post(
  "/",
  async (req: AuthRequest, res) => {
    try {
      const result = createTicketSchema.safeParse(req.body);

      if (!result.success) {
        return res.status(400).json({
          message: "ข้อมูล Ticket ไม่ถูกต้อง",
          errors: result.error.flatten(),
        });
      }

      const ticket = await prisma.ticket.create({
  data: {
    title: result.data.title,
    description: result.data.description,
    category: result.data.category,
    priority: result.data.priority,
    createdById: req.user!.id,

    aiAnalysis: result.data.aiAnalysis
      ? {
          create: {
            categorySuggested:
              result.data.aiAnalysis.categorySuggested,

            categoryConfidence:
              result.data.aiAnalysis.categoryConfidence,

            prioritySuggested:
              result.data.aiAnalysis.prioritySuggested,

            priorityConfidence:
              result.data.aiAnalysis.priorityConfidence,

            prioritySource:
              result.data.aiAnalysis.prioritySource,

            needsReview:
              result.data.aiAnalysis.needsReview,
          },
        }
      : undefined,
  },

  include: {
    aiAnalysis: true,
  },
});
      await prisma.ticketActivity.create({
        data: {
                type: "CREATED",
                ticketId: ticket.id,
                actorId: req.user!.id,
                newValue: "OPEN",
              },
      });

      return res.status(201).json({
        message: "สร้าง Ticket สำเร็จ",
        ticket,
      });
    } catch (error) {
      console.error(error);

      return res.status(500).json({
        message: "เกิดข้อผิดพลาดภายใน Server",
      });
    }
  }
);

// GET TICKETS + SEARCH / FILTER
router.get(
  "/",
  async (req: AuthRequest, res) => {
    try {
      const {
        status,
        priority,
        category,
        search,
      } = req.query;

      const where: any = {};

      // USER เห็นเฉพาะ Ticket ของตัวเอง
      if (req.user!.role === "USER") {
        where.createdById = req.user!.id;
      }

      if (typeof status === "string" && status) {
        where.status = status;
      }

      if (
        typeof priority === "string" &&
        priority
      ) {
        where.priority = priority;
      }

      if (
        typeof category === "string" &&
        category
      ) {
        where.category = category;
      }

      if (
        typeof search === "string" &&
        search.trim()
      ) {
        const keyword = search.trim();

        where.OR = [
          {
            title: {
              contains: keyword,
              mode: "insensitive",
            },
          },
          {
            description: {
              contains: keyword,
              mode: "insensitive",
            },
          },
        ];
      }

      const tickets = await prisma.ticket.findMany({
        where,

        include: {
          createdBy: {
            select: {
              id: true,
              name: true,
              email: true,
            },
          },

          assignedTo: {
            select: {
              id: true,
              name: true,
            },
          },

          _count: {
            select: {
              comments: true,
            },
          },
        },

        orderBy: {
          createdAt: "desc",
        },
      });

      return res.json(tickets);
    } catch (error) {
      console.error(error);

      return res.status(500).json({
        message: "เกิดข้อผิดพลาดภายใน Server",
      });
    }
  }
);

// GET TICKET DETAIL
router.get(
  "/:id",
  async (req: AuthRequest, res) => {
    try {
      const id = Number(req.params.id);

      if (!Number.isInteger(id)) {
        return res.status(400).json({
          message: "Ticket ID ไม่ถูกต้อง",
        });
      }

      const ticket = await prisma.ticket.findUnique({
        where: {
          id,
        },

       include: {
  createdBy: {
    select: {
      id: true,
      name: true,
      email: true,
    },
  },

  assignedTo: {
    select: {
      id: true,
      name: true,
      email: true,
    },
  },

  comments: {
    include: {
      author: {
        select: {
          id: true,
          name: true,
          role: true,
        },
      },
    },

    orderBy: {
      createdAt: "asc",
    },
  },

  activities: {
    include: {
      actor: {
        select: {
          id: true,
          name: true,
          role: true,
        },
      },
    },

    orderBy: {
      createdAt: "asc",
    },
  },
aiAnalysis: true,
},
      });

      if (!ticket) {
        return res.status(404).json({
          message: "ไม่พบ Ticket",
        });
      }

      if (
        req.user!.role === "USER" &&
        ticket.createdById !== req.user!.id
      ) {
        return res.status(403).json({
          message: "คุณไม่มีสิทธิ์ดู Ticket นี้",
        });
      }

      return res.json(ticket);
    } catch (error) {
      console.error(error);

      return res.status(500).json({
        message: "เกิดข้อผิดพลาดภายใน Server",
      });
    }
  }
);

// ADD COMMENT
router.post(
  "/:id/comments",
  async (req: AuthRequest, res) => {
    try {
      const ticketId = Number(req.params.id);

      if (!Number.isInteger(ticketId)) {
        return res.status(400).json({
          message: "Ticket ID ไม่ถูกต้อง",
        });
      }

      const commentSchema = z.object({
        message: z.string().min(1).max(1000),
      });

      const result = commentSchema.safeParse(req.body);

      if (!result.success) {
        return res.status(400).json({
          message: "ข้อความไม่ถูกต้อง",
        });
      }

      const ticket = await prisma.ticket.findUnique({
        where: {
          id: ticketId,
        },
      });

      if (!ticket) {
        return res.status(404).json({
          message: "ไม่พบ Ticket",
        });
      }

      if (
        req.user!.role === "USER" &&
        ticket.createdById !== req.user!.id
      ) {
        return res.status(403).json({
          message: "คุณไม่มีสิทธิ์ Comment Ticket นี้",
        });
      }

      const comment = await prisma.ticketComment.create({
  data: {
    message: result.data.message,
    ticketId,
    authorId: req.user!.id,
  },

  include: {
    author: {
      select: {
        id: true,
        name: true,
        role: true,
      },
    },
  },
});

// บันทึก Activity ก่อน return
await prisma.ticketActivity.create({
  data: {
    type: "COMMENT_ADDED",
    ticketId,
    actorId: req.user!.id,
  },
});

return res.status(201).json({
  message: "เพิ่ม Comment สำเร็จ",
  comment,
});
} catch (error) {
  console.error(error);

  return res.status(500).json({
    message: "เกิดข้อผิดพลาดภายใน Server",
  });
}
}
);

const updateTicketSchema = z
  .object({
    status: z
      .enum([
        "OPEN",
        "IN_PROGRESS",
        "RESOLVED",
        "CLOSED",
      ])
      .optional(),

    priority: z
      .enum([
        "LOW",
        "MEDIUM",
        "HIGH",
        "CRITICAL",
      ])
      .optional(),

    assignedToId: z
      .number()
      .int()
      .positive()
      .nullable()
      .optional(),
  })
  .refine(
    (data) =>
      data.status !== undefined ||
      data.priority !== undefined ||
      data.assignedToId !== undefined,
    {
      message: "ต้องมีข้อมูลอย่างน้อยหนึ่งรายการ",
    }
  );

// UPDATE TICKET - STAFF / ADMIN ONLY
router.patch(
  "/:id",
  requireRole("STAFF", "ADMIN"),
  async (req: AuthRequest, res) => {
    try {
      const id = Number(req.params.id);

      if (!Number.isInteger(id)) {
        return res.status(400).json({
          message: "Ticket ID ไม่ถูกต้อง",
        });
      }

      const result = updateTicketSchema.safeParse(req.body);

      if (!result.success) {
        return res.status(400).json({
          message: "ข้อมูลไม่ถูกต้อง",
          errors: result.error.flatten(),
        });
      }

      const existingTicket =
        await prisma.ticket.findUnique({
          where: {
            id,
          },
        });

      if (!existingTicket) {
        return res.status(404).json({
          message: "ไม่พบ Ticket",
        });
      }

      const {
        status,
        priority,
        assignedToId,
      } = result.data;

      // ถ้ามีการ Assign ต้องตรวจว่าเป็น STAFF หรือ ADMIN
      if (
        assignedToId !== undefined &&
        assignedToId !== null
      ) {
        const staff =
          await prisma.user.findUnique({
            where: {
              id: assignedToId,
            },
          });

        if (
          !staff ||
          !["STAFF", "ADMIN"].includes(
            staff.role
          )
        ) {
          return res.status(400).json({
            message:
              "ผู้รับผิดชอบต้องเป็น STAFF หรือ ADMIN",
          });
        }
      }

      // อัปเดต Ticket
      const ticket =
        await prisma.ticket.update({
          where: {
            id,
          },

          data: {
            status,
            priority,

            assignedTo:
              assignedToId === null
                ? {
                    disconnect: true,
                  }
                : assignedToId !==
                    undefined
                  ? {
                      connect: {
                        id: assignedToId,
                      },
                    }
                  : undefined,

            resolvedAt:
              status === "RESOLVED"
                ? new Date()
                : status !== undefined
                  ? null
                  : undefined,
          },

          include: {
            createdBy: {
              select: {
                id: true,
                name: true,
              },
            },

            assignedTo: {
              select: {
                id: true,
                name: true,
                role: true,
              },
            },
          },
        });

      // เตรียม Activity ที่เกิดขึ้น
      const activities = [];

      // เปลี่ยน Status
      if (
        status !== undefined &&
        status !== existingTicket.status
      ) {
        activities.push({
          type: "STATUS_CHANGED" as const,
          oldValue:
            existingTicket.status,
          newValue: status,
          ticketId: id,
          actorId: req.user!.id,
        });
      }

      // เปลี่ยน Priority
      if (
        priority !== undefined &&
        priority !==
          existingTicket.priority
      ) {
        activities.push({
          type:
            "PRIORITY_CHANGED" as const,
          oldValue:
            existingTicket.priority,
          newValue: priority,
          ticketId: id,
          actorId: req.user!.id,
        });
      }

      // Assign / เปลี่ยนผู้รับผิดชอบ
      if (
        assignedToId !== undefined &&
        assignedToId !==
          existingTicket.assignedToId
      ) {
        activities.push({
          type: "ASSIGNED" as const,

          oldValue:
            existingTicket.assignedToId?.toString() ??
            null,

          newValue:
            assignedToId?.toString() ??
            null,

          ticketId: id,
          actorId: req.user!.id,
        });
      }

      // บันทึก Activity ทั้งหมด
      if (activities.length > 0) {
        await prisma.ticketActivity.createMany({
          data: activities,
        });
      }

      return res.json({
        message: "อัปเดต Ticket สำเร็จ",
        ticket,
      });
    } catch (error) {
      console.error(error);

      return res.status(500).json({
        message:
          "เกิดข้อผิดพลาดภายใน Server",
      });
    }
  }
);

export default router;
