import { prisma } from '../lib/prisma';
import { ReportTargetType } from '@prisma/client';
import { notifyAdminNewReport } from './emailService';

export interface CreateReportInput {
  reporterId: string; // DB User.id
  targetType: ReportTargetType;
  targetId: string;
  reason: string;
  additionalContext?: string;
}

/**
 * Creates a Report record and notifies the admin team.
 * Handles the polymorphic target relationship by setting the appropriate
 * typed foreign key alongside the generic targetType/targetId.
 */
export async function createReport(input: CreateReportInput) {
  const { reporterId, targetType, targetId, reason, additionalContext } = input;

  // Build typed FK for easier querying
  const typedFK: {
    targetMessageId?: string;
    targetUserId?: string;
    targetGroupId?: string;
  } = {};

  if (targetType === 'message') typedFK.targetMessageId = targetId;
  if (targetType === 'user') typedFK.targetUserId = targetId;
  if (targetType === 'group') typedFK.targetGroupId = targetId;

  const report = await prisma.report.create({
    data: {
      reporterId,
      targetType,
      targetId,
      reason,
      additionalContext,
      ...typedFK,
    },
  });

  // Notify admin asynchronously — don't block the response
  notifyAdminNewReport(report.id, targetType, reason).catch((err) => {
    console.error('[ReportService] Failed to notify admin:', err);
  });

  return report;
}
