import { Schema, models, model } from 'mongoose';

const communityActivityLogsSchema = new Schema({
  community: {
    type: Schema.Types.ObjectId,
    ref: 'Community',
    required: true
  },
  logType: {
    type: String,
    enum: [
      'changedSettings'
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
  }
}, {
  timestamps: true
});

const CommunityActivityLog = models.CommunityActivityLog || model('CommunityActivityLog', communityActivityLogsSchema);

export default CommunityActivityLog;