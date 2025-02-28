import { Schema, models, model } from 'mongoose';

const communitySchema = new Schema({
  creator: {
    type: Schema.Types.ObjectId,
    ref: 'User',
    required: [true, 'Community cretaor ID is required']
  },
  moderators: [
    {
      type: Schema.Types.ObjectId,
      ref: 'User'
    }
  ],
  access: {
    type: String,
    enum: ['public', 'private'],
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
      title: String,
      description: String
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