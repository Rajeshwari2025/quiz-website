import { prisma } from "../../lib/prisma";
import { ApiError } from "../../utils/api-error";

async function assertVersionOwnership(quizVersionId: string, facultyId: string) {
  const version = await prisma.quizVersion.findFirst({
    where: {
      id: quizVersionId,
      quiz: {
        createdById: facultyId,
      },
    },
  });

  if (!version) {
    throw new ApiError(404, "QUIZ_VERSION_NOT_FOUND", "Quiz version was not found");
  }

  return version;
}

export async function createLiveSession(
  facultyId: string,
  quizVersionId: string,
  startsAt?: string | null,
) {
  const version = await assertVersionOwnership(quizVersionId, facultyId);

  if (version.status !== "PUBLISHED") {
    throw new ApiError(
      409,
      "LIVE_SESSION_REQUIRES_PUBLISHED_QUIZ",
      "Only published quiz versions can start live sessions",
    );
  }

  return prisma.liveSession.create({
    data: {
      hostId: facultyId,
      quizVersionId,
      startsAt: startsAt ? new Date(startsAt) : null,
    },
  });
}

export async function getLiveSession(facultyId: string, sessionId: string) {
  const session = await prisma.liveSession.findFirst({
    where: {
      id: sessionId,
      hostId: facultyId,
    },
  });

  if (!session) {
    throw new ApiError(404, "LIVE_SESSION_NOT_FOUND", "Live session was not found");
  }

  return session;
}

export async function updateLiveSessionState(
  facultyId: string,
  sessionId: string,
  state: "LIVE" | "ENDED",
) {
  const session = await getLiveSession(facultyId, sessionId);

  return prisma.liveSession.update({
    where: { id: session.id },
    data: {
      state,
      startsAt: state === "LIVE" ? new Date() : session.startsAt,
      endsAt: state === "ENDED" ? new Date() : session.endsAt,
    },
  });
}

