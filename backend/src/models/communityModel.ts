import { Schema, models, model } from 'mongoose';

const communitySchema = new Schema({
  creator: {
    type: Schema.Types.ObjectId,
    ref: 'User',
    required: [true, 'Community creator ID is required']
  },
  pendingInvitedModerators: [
    {
      type: Schema.Types.ObjectId,
      ref: 'User'
    }
  ],
  moderators: [
    {
      type: Schema.Types.ObjectId,
      ref: 'User'
    }
  ],
  access: {
    type: String,
    enum: {
      values: ['public', 'private'],
      message: 'Communitys access value can only be "public" or "private"'
    },
    default: 'public'
  }, 
  name: {
    type: String,
    required: [true, 'Community Name is required'],
    minLength: [2, 'Community Name must be at least 2 characters long'],
    maxLength: [30, 'Community Name must not exceed 30 characters']
  },
  description: {
    type: String,
    required: [true, 'Community Description is required'],
    minLength: [10, 'Community Description must be at least 10 characters long'],
    maxLength: [100, 'Community Description must not exceed 100 characters']
  },
  bannerImageUrl: String,
  bannerImagePublicId: {
    type: String,
    select: false
  },
  profileImageUrl: String,
  profilImagePublicId: {
    type: String,
    select: false
  },
  rules: [
    {
      title: {
        type: String,
        required: false,
        minLength: 5,
        maxLength: 20
      },
      description: {
        type: String,
        required: false,
        minLength: 5,
        maxLength: 100
      }
    }
  ],
  pendingInvitedUsers: [
    {
      type: Schema.Types.ObjectId,
      ref: 'User'
    }
  ],
  joinedUsers: [
    {
      type: Schema.Types.ObjectId,
      ref: 'User'
    }
  ],
  bannedUsers: [
    {
      type: Schema.Types.ObjectId,
      ref: 'User'
    }
  ],
  availableChats: [
    {
      type: Schema.Types.ObjectId,
      ref: 'Chat'
    }
  ]
}, {
  timestamps: true
});

const Community = models.Community || model('Community', communitySchema);

export default Community;