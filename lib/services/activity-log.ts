import { Prisma } from "@prisma/client";
import { prisma } from "@/lib/prisma";

export type ActivityAction =
  | "USER_LOGIN"
  | "USER_LOGOUT"
  | "USER_SIGNUP"
  | "PASSWORD_RESET_REQUESTED"
  | "PASSWORD_RESET"
  | "EXAM_CREATED"
  | "EXAM_UPDATED"
  | "EXAM_DELETED"
  | "RUBRIC_CREATED"
  | "RUBRIC_EXTRACTED"
  | "SCRIPT_UPLOADED"
  | "GRADING_STARTED"
  | "GRADING_COMPLETED"
  | "RESULT_OVERRIDDEN"
  | "SETTINGS_UPDATED";

interface LogActivityOptions {
  userId?: string;
  action: ActivityAction;
  resource?: string;
  resourceId?: string;
  metadata?: Record<string, unknown>;
  ipAddress?: string;
  userAgent?: string;
}

export async function logActivity(opts: LogActivityOptions): Promise<void> {
  try {
    await prisma.activityLog.create({
      data: {
        userId: opts.userId ?? null,
        action: opts.action,
        resource: opts.resource ?? null,
        resourceId: opts.resourceId ?? null,
        metadata: opts.metadata !== undefined
          ? (opts.metadata as Prisma.InputJsonValue)
          : Prisma.DbNull,
        ipAddress: opts.ipAddress ?? null,
        userAgent: opts.userAgent ?? null,
      },
    });
  } catch (err) {
    console.error("[ActivityLog] Failed to write log entry:", err);
  }
}

export function getClientMeta(request: Request): {
  ipAddress: string | undefined;
  userAgent: string | undefined;
} {
  const headers = request instanceof Request ? request.headers : new Headers();
  return {
    ipAddress:
      headers.get("x-forwarded-for")?.split(",")[0].trim() ??
      headers.get("x-real-ip") ??
      undefined,
    userAgent: headers.get("user-agent") ?? undefined,
  };
}
