import { Schema, models, model, HydratedDocument, InferSchemaType } from 'mongoose';

const notificationsSchema = new Schema({
  receiver: {
    type: Schema.Types.ObjectId,
    ref: 'User',
    required: [true, 'Notification receiver is required']
  },
  notificationType: {
    type: String,
    enum: [
      'becomeCommunityModeratorRequest',
      'becomeCommunityMemberRequest',
      'bannedFromCommunity',
      'removeCommunityBan'
    ]
  },
  text: {
    type: String,
    required: [true, 'Notification message is required']
  },
  read: {
    type: Boolean,
    default: false
  },
  sender: {
    type: Schema.Types.ObjectId,
    ref: 'User'
  },
  community: {
    type: Schema.Types.ObjectId,
    ref: 'Community'
  },
  post: {
    type: Schema.Types.ObjectId,
    ref: 'Post'
  },
  comment: {
    type: Schema.Types.ObjectId,
    ref: 'Comment'
  },
  chat: {
    type: Schema.Types.ObjectId,
    ref: 'Chat'
  }
}, {
  timestamps: true
});

export type NotificationSchemaType = HydratedDocument<InferSchemaType<typeof notificationsSchema>>;

const Notification = models.Notification || model('Notification', notificationsSchema);

export default Notification;