import { prisma } from '@/lib/prisma';

/**
 * Fire-and-forget helper: calls the AI service to extract a student's
 * matric number and name from an uploaded script, then persists the result.
 *
 * Extracted here from both /api/upload/route.ts and /api/upload/confirm/route.ts
 * to keep the logic in one place.
 */
export async function extractAndSaveIdentity(
  scriptId: string,
  fileUrl: string,
  aiServiceUrl: string,
): Promise<void> {
  try {
    const response = await fetch(`${aiServiceUrl}/extract-identity`, {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({ url: fileUrl }),
    });

    if (!response.ok) return;

    const data = await response.json();

    if (data.matric && data.matric !== 'UNKNOWN') {
      await prisma.script.update({
        where: { id: scriptId },
        data: {
          studentId: data.matric,
          ...(data.student_name && { studentName: data.student_name }),
        },
      });
      console.log(`[Identity] Extracted for script ${scriptId}:`, data.matric);
    }
  } catch (err) {
    console.error('[Identity] extractAndSaveIdentity error:', err);
  }
}
