import CommunityActivityLog from "models/communityActivityLogsModel";
import { CreateNewCommunityActivityLogParemetersType } from "types/controllers/communityActivityLogs";

class CommunityActivityLogsService {
  static async createNewCommunityActivityLog (parameters: CreateNewCommunityActivityLogParemetersType) {
    try {
      const {
        communityId = null,
        logType,
        moderator = null,
        text,
        moderatorRequest = null,
        photoUrl = null,
        user
      } = parameters;

      await CommunityActivityLog.create({
        community: communityId,
        logType,
        moderator,
        text,
        moderatorRequest,
        photoUrl,
        user
      });
    } catch (error: unknown) {
      throw error;
    }
  }
}

export default CommunityActivityLogsService;