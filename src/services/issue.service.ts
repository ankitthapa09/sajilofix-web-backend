import { Types } from "mongoose";
import { HttpError } from "../errors/httpError";
import { IssueRepository } from "../repositories/issue.repository";
import { UserRepository } from "../repositories/user.repository";
import type { CreateIssueInput } from "../dtos/issues/createIssue.dto";
import type { IssueStatus, IssueStatusActorRole } from "../models/issueReport.model";
import { createNotifications, notifyIssueStatusChanged } from "./notification.service";

function toGeoPoint(latitude?: number, longitude?: number) {
  if (typeof latitude !== "number" || typeof longitude !== "number") {
    return undefined;
  }

  if (!Number.isFinite(latitude) || !Number.isFinite(longitude)) {
    return undefined;
  }

  return {
    type: "Point" as const,
    coordinates: [longitude, latitude],
  };
}

export async function createIssueReport(input: CreateIssueInput, reporterId: string) {
  if (!reporterId) {
    throw new HttpError(401, "Unauthorized");
  }

  if (!Types.ObjectId.isValid(reporterId)) {
    throw new HttpError(400, "Invalid reporter id");
  }

  const reporterObjectId = new Types.ObjectId(reporterId);

  const normalized = {
    category: input.category,
    title: input.title.trim(),
    description: input.description.trim(),
    urgency: input.urgency,
    location: {
      latitude: input.location.latitude,
      longitude: input.location.longitude,
      geo: toGeoPoint(input.location.latitude, input.location.longitude),
      address: input.location.address.trim(),
      district: input.location.district.trim(),
      municipality: input.location.municipality.trim(),
      ward: input.location.ward.trim(),
      landmark: input.location.landmark?.trim() ?? undefined,
    },
    photos: input.photos ?? [],
    reporterId: reporterObjectId,
  };

  const created = await IssueRepository.create(normalized);

  try {
    const reviewers = await UserRepository.listActiveUserIdsByRoles(["admin", "authority"]);
    if (reviewers.length) {
      await createNotifications(
        reviewers.map((reviewer) => ({
          recipientUserId: reviewer.userId,
          recipientRole: reviewer.role,
          type: "issue_created",
          title: "New issue reported",
          message: `A new issue \"${created.title}\" has been reported in ${created.category}.`,
          entityType: "issue",
          entityId: created._id.toString(),
          metadata: {
            category: created.category,
            reporterId,
          },
        }))
      );
    }
  } catch (error) {
    console.error("Failed to create issue notification", error);
  }

  return {
    id: created._id.toString(),
    status: created.status,
    createdAt: created.createdAt,
  };
}

export async function listIssueReports(reporterId: string) {
  if (!reporterId) {
    throw new HttpError(401, "Unauthorized");
  }

  if (!Types.ObjectId.isValid(reporterId)) {
    throw new HttpError(400, "Invalid reporter id");
  }

  const items = await IssueRepository.listByReporter(reporterId);

  return items.map((issue) => ({
    id: issue._id.toString(),
    category: issue.category,
    title: issue.title,
    description: issue.description,
    urgency: issue.urgency,
    status: issue.status,
    location: issue.location,
    photos: issue.photos ?? [],
    createdAt: issue.createdAt,
    statusUpdatedByRole: issue.statusUpdatedByRole,
    statusUpdatedByUserId: issue.statusUpdatedByUserId,
    statusUpdatedAt: issue.statusUpdatedAt,
  }));
}

export async function listAllIssueReports() {
  const items = await IssueRepository.listAll();

  return items.map((issue) => {
    const reporter = issue.reporterId as { _id?: Types.ObjectId; fullName?: string; profilePhoto?: string } | null;
    return {
      id: issue._id.toString(),
      category: issue.category,
      title: issue.title,
      description: issue.description,
      urgency: issue.urgency,
      status: issue.status,
      location: issue.location,
      photos: issue.photos ?? [],
      createdAt: issue.createdAt,
      reporterId: reporter?._id?.toString(),
      reporterName: reporter?.fullName,
      reporterPhoto: reporter?.profilePhoto,
      statusUpdatedByRole: issue.statusUpdatedByRole,
      statusUpdatedByUserId: issue.statusUpdatedByUserId,
      statusUpdatedAt: issue.statusUpdatedAt,
    };
  });
}

export async function listPriorityIssueReports() {
  const items = await IssueRepository.listPriority();
  const urgencyWeight: Record<string, number> = { urgent: 2, high: 1 };

  const mapped = items.map((issue) => {
    const reporter = issue.reporterId as { _id?: Types.ObjectId; fullName?: string; profilePhoto?: string } | null;
    return {
      id: issue._id.toString(),
      category: issue.category,
      title: issue.title,
      description: issue.description,
      urgency: issue.urgency,
      status: issue.status,
      location: issue.location,
      photos: issue.photos ?? [],
      createdAt: issue.createdAt,
      reporterId: reporter?._id?.toString(),
      reporterName: reporter?.fullName,
      reporterPhoto: reporter?.profilePhoto,
      statusUpdatedByRole: issue.statusUpdatedByRole,
      statusUpdatedByUserId: issue.statusUpdatedByUserId,
      statusUpdatedAt: issue.statusUpdatedAt,
    };
  });

  return mapped.sort((a, b) => {
    const weightDiff = (urgencyWeight[b.urgency] ?? 0) - (urgencyWeight[a.urgency] ?? 0);
    if (weightDiff !== 0) return weightDiff;
    return new Date(b.createdAt).getTime() - new Date(a.createdAt).getTime();
  });
}

export async function updateIssueStatus(
  issueId: string,
  status: IssueStatus,
  changedByRole: IssueStatusActorRole,
  changedByUserId: string
) {
  if (!Types.ObjectId.isValid(issueId)) {
    throw new HttpError(400, "Invalid issue id");
  }

  if (!changedByUserId) {
    throw new HttpError(401, "Unauthorized");
  }

  const updated = await IssueRepository.updateStatus(issueId, status, changedByRole, changedByUserId);
  if (!updated) {
    throw new HttpError(404, "Issue not found");
  }

  const reporterUserId = updated.reporterId?.toString();
  if (reporterUserId) {
    try {
      await notifyIssueStatusChanged({
        recipientUserId: reporterUserId,
        recipientRole: "citizen",
        issueId: updated._id.toString(),
        issueTitle: updated.title,
        status: updated.status,
        changedByRole,
      });
    } catch (error) {
      console.error("Failed to create issue status notification", error);
    }
  }

  return {
    id: updated._id.toString(),
    status: updated.status,
    updatedAt: updated.updatedAt,
    statusUpdatedByRole: updated.statusUpdatedByRole,
    statusUpdatedByUserId: updated.statusUpdatedByUserId,
    statusUpdatedAt: updated.statusUpdatedAt,
  };
}

export async function getIssueReport(issueId: string, reporterId: string) {
  if (!reporterId) {
    throw new HttpError(401, "Unauthorized");
  }

  if (!Types.ObjectId.isValid(reporterId)) {
    throw new HttpError(400, "Invalid reporter id");
  }

  if (!Types.ObjectId.isValid(issueId)) {
    throw new HttpError(400, "Invalid issue id");
  }

  const issue = await IssueRepository.findById(issueId);
  if (!issue) {
    throw new HttpError(404, "Issue not found");
  }

  if (issue.reporterId?.toString() !== reporterId) {
    throw new HttpError(403, "Forbidden");
  }

  return {
    id: issue._id.toString(),
    category: issue.category,
    title: issue.title,
    description: issue.description,
    urgency: issue.urgency,
    status: issue.status,
    location: issue.location,
    photos: issue.photos ?? [],
    createdAt: issue.createdAt,
    statusHistory: (issue.statusHistory ?? []).map((entry) => ({
      status: entry.status,
      changedByRole: entry.changedByRole,
      changedByUserId: entry.changedByUserId,
      changedAt: entry.changedAt,
    })),
    statusUpdatedByRole: issue.statusUpdatedByRole,
    statusUpdatedByUserId: issue.statusUpdatedByUserId,
    statusUpdatedAt: issue.statusUpdatedAt,
  };
}

export async function getIssueReportForAuthority(issueId: string) {
  if (!Types.ObjectId.isValid(issueId)) {
    throw new HttpError(400, "Invalid issue id");
  }

  const issue = await IssueRepository.findByIdWithReporter(issueId);
  if (!issue) {
    throw new HttpError(404, "Issue not found");
  }

  const reporter = issue.reporterId as { _id?: Types.ObjectId; fullName?: string; profilePhoto?: string } | null;

  return {
    id: issue._id.toString(),
    category: issue.category,
    title: issue.title,
    description: issue.description,
    urgency: issue.urgency,
    status: issue.status,
    location: issue.location,
    photos: issue.photos ?? [],
    createdAt: issue.createdAt,
    reporterId: reporter?._id?.toString(),
    reporterName: reporter?.fullName,
    reporterPhoto: reporter?.profilePhoto,
    statusUpdatedByRole: issue.statusUpdatedByRole,
    statusUpdatedByUserId: issue.statusUpdatedByUserId,
    statusUpdatedAt: issue.statusUpdatedAt,
  };
}

export async function getIssueReporterProfileForAuthority(reporterId: string) {
  if (!Types.ObjectId.isValid(reporterId)) {
    throw new HttpError(400, "Invalid reporter id");
  }

  const user = await UserRepository.findById(reporterId, "citizen");
  if (!user) {
    throw new HttpError(404, "Reporter not found");
  }

  return {
    id: user._id.toString(),
    fullName: user.fullName,
    email: user.email,
    phone: user.phone,
    municipality: user.municipality,
    district: user.district,
    wardNumber: user.wardNumber,
    tole: user.tole,
    fullAddress: [
      user.tole,
      user.wardNumber ? `Ward ${user.wardNumber}` : undefined,
      user.municipality,
      user.district,
    ]
      .filter(Boolean)
      .join(", "),
    citizenshipNumber: user.citizenshipNumber,
    status: user.status,
    profilePhoto: user.profilePhoto,
    role: user.role,
  };
}

export async function deleteIssueReport(issueId: string) {
  if (!Types.ObjectId.isValid(issueId)) {
    throw new HttpError(400, "Invalid issue id");
  }

  const deleted = await IssueRepository.deleteById(issueId);
  if (!deleted) {
    throw new HttpError(404, "Issue not found");
  }

  return {
    id: deleted._id.toString(),
  };
}
