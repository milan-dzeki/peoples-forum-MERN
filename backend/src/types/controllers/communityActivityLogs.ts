import { Types } from 'mongoose';
import { COMMUNITY_LOG_TYPE } from 'configs/community/communityActivityLogs';

export type CommunityActivityLogType = typeof COMMUNITY_LOG_TYPE[keyof typeof COMMUNITY_LOG_TYPE];

export interface CreateNewCommunityActivityLogParemetersType {
  communityId?: Types.ObjectId | string;
  logType: CommunityActivityLogType;
  moderator?: Types.ObjectId | string;
  text: string;
  moderatorRequest?: Types.ObjectId | string;
  photoUrl?: string;
}