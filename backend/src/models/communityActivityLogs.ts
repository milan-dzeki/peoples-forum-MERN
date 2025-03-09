import { Schema, models, model } from 'mongoose';
import { COMMUNITY_LOG_TYPE } from 'configs/communityActivityLogs';

const communityActivityLogsSchema = new Schema({
  community: {
    type: Schema.Types.ObjectId,
    ref: 'Community',
    required: true
  },
  logType: {
    type: String,
    enum: [
      COMMUNITY_LOG_TYPE.COMMUNITY_INFO_UPDATED,
      COMMUNITY_LOG_TYPE.SETTING_CHANGED,
      COMMUNITY_LOG_TYPE.MODERATOR_MADE_REQUESTS,
      COMMUNITY_LOG_TYPE.HANDLE_MODERATOR_REQUESTS
    ],
    required: true
  },
  text: {
    type: String,
    required: true
  },
  moderator: {
    type: Schema.Types.ObjectId,
    ref: 'User',
    default: null
  },
  user: {
    type: Schema.Types.ObjectId,
    ref: 'User',
    default: null
  },
  post: {
    type: Schema.Types.ObjectId,
    ref: 'Post', // or community post
    default: null
  },
  comment: {
    type: Schema.Types.ObjectId,
    ref: 'Comment',
    default: null
  },
  moderatorRequest: {
    type: Schema.Types.ObjectId,
    ref: 'CommunityModeratorChangeRequest',
    default: null
  },
  photoUrl: {
    type: String,
    default: null
  }
}, {
  timestamps: true
});

const CommunityActivityLog = models.CommunityActivityLog || model('CommunityActivityLog', communityActivityLogsSchema);

export default CommunityActivityLog;