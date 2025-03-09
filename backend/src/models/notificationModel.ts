import { Schema, models, model, HydratedDocument, InferSchemaType } from 'mongoose';
import { NOTIFICATION_TYPES } from 'configs/notifications';

const notificationsSchema = new Schema({
  receiver: {
    type: Schema.Types.ObjectId,
    ref: 'User',
    required: [true, 'Notification receiver is required']
  },
  notificationType: {
    type: String,
    enum: [
      NOTIFICATION_TYPES.BECOME_COMMUNITY_MODERATOR_INVITATION,
      NOTIFICATION_TYPES.BECOME_COMMUNITY_MEMBER_INVITATION,
      NOTIFICATION_TYPES.BANNED_FROM_COMMUNITY,
      NOTIFICATION_TYPES.REMOVED_COMMUNITY_BAN,
      NOTIFICATION_TYPES.USER_REQUESTED_TO_JOIN_COMMUNITY,
      NOTIFICATION_TYPES.USER_ACCEPTED_COMMUNITY_MEMBER_INVITE,
      NOTIFICATION_TYPES.USER_ACCEPTED_COMMUNITY_MODERATOR_INVITE,
      NOTIFICATION_TYPES.REQUEST_TO_JOIN_COMMUNITY_AS_MODERATOR_ACCEPTED,
      NOTIFICATION_TYPES.REQUEST_TO_JOIN_COMMUNITY_AS_MEMBER_ACCEPTED,
      NOTIFICATION_TYPES.REQUEST_TO_JOIN_COMMUNITY_AS_MODERATOR_DECLINED,
      NOTIFICATION_TYPES.REQUEST_TO_JOIN_COMMUNITY_AS_MEMBER_DECLINED,
      NOTIFICATION_TYPES.COMMUNITY_SETTINGS_CHANGED,
      NOTIFICATION_TYPES.MODERATOR_CHANGE_REQUEST_DECLINED,
      NOTIFICATION_TYPES.MODERATOR_CHANGE_REQUEST_APPROVED
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