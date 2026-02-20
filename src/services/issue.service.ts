import { Types } from "mongoose";
import { HttpError } from "../errors/httpError";
import { IssueRepository } from "../repositories/issue.repository";
import type { CreateIssueInput } from "../dtos/issues/createIssue.dto";

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

  return {
    id: created._id.toString(),
    status: created.status,
    createdAt: created.createdAt,
  };
}
