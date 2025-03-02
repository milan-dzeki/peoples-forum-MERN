import { Schema, models, model } from 'mongoose';

const chatSchema = new Schema({
  creator: {
    type: Schema.Types.ObjectId,
    ref: 'User'
  },
  name: {
    type: String,
    minLength: 2,
    maxLength: 10
  },
  lastMessage: {
    type: Schema.Types.ObjectId,
    ref: 'Message'
  },
  // if it exists it means it is group or community chat
  chatImageUrl: {
    type: String,
    default: null
  },
  chatImagePublicId: {
    type: String,
    default: null,
    select: false
  },
  members: [
    {
      type: Schema.Types.ObjectId,
      ref: 'User'
    }
  ],
  // if it has length it means that it is group chat
  admins: [
    {
      type: Schema.Types.ObjectId,
      ref: 'User'
    }
  ],
  // if exists it means this is community chat
  communityId: {
    type: Schema.Types.ObjectId,
    ref: 'Community',
    default: null
  },
  // banned users cannot see chat (used mainly for community chats)
  bannedUsers: [
    {
      type: Schema.Types.ObjectId,
      ref: 'User'
    }
  ]
}, {
  timestamps: true
});

const Chat = models.Chat || model('Chat', chatSchema);

export default Chat;