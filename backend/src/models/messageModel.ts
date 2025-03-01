import { Schema, models, model } from 'mongoose';

const messageSchema = new Schema({
  chatId: {
    type: Schema.Types.ObjectId,
    ref: 'Chat',
    required: true
  },
  sender: {
    type: Schema.Types.ObjectId,
    ref: 'User',
    required: true
  },
  communityId: {
    type: Schema.Types.ObjectId,
    ref: 'Community',
    default: null
  },
  edited: {
    type: Boolean,
    default: false
  },
  deleted: {
    type: Boolean,
    default: false
  },
  text: String,
  photoUrl: String,
  photoPublicId: {
    type: String,
    select: false
  },
  audioUrl: String,
  audioPublicId: {
    type: String,
    select: false
  },
  videoUrl: String,
  videoPublicId: {
    type: String,
    select: false
  },
  fileUrl: String,
  filePublicId: {
    type: String,
    select: false
  },
  reactions: [
    {
      user: {
        type: Schema.Types.ObjectId,
        ref: 'User',
      },
      reaction: String
    }
  ],
  seenBy: [
    {
      user: {
        type: Schema.Types.ObjectId,
        ref: 'User',
      },
      dateTime: Date
    }
  ],
  repliedTo: {
    type: Schema.Types.ObjectId,
    ref: 'Message',
    default: null
  },
  taged: [
    {
      type: Schema.Types.ObjectId,
      ref: 'User'
    }
  ]
}, {
  timestamps: true
});

const Message = models.Message || model('Message', messageSchema);

export default Message;