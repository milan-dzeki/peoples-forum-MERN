import { Schema, models, model } from 'mongoose';
import communityInputRules from 'configs/validators/community/communityInputRules';

const communitySchema = new Schema({
  creator: {
    type: Schema.Types.ObjectId,
    ref: 'User',
    required: [true, communityInputRules.creatorId.requiredErrorMessage]
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
      message: communityInputRules.access.invalidValueMessage
    },
    default: 'public'
  }, 
  name: {
    type: String,
    required: [true, communityInputRules.name.requiredErrorMessage],
    minLength: [
      communityInputRules.name.minLength.value, 
      communityInputRules.name.minLength.errorMessage
    ],
    maxLength: [
      communityInputRules.name.maxLength.value, 
      communityInputRules.name.maxLength.errorMessage
    ]
  },
  description: {
    type: String,
    required: [true, communityInputRules.description.requiredErrorMessage],
    minLength: [
      communityInputRules.description.minLength.value,
      communityInputRules.description.minLength.errorMessage
    ],
    maxLength: [
      communityInputRules.description.maxLength.value,
      communityInputRules.description.maxLength.errorMessage
    ]
  },
  bannerImageUrl: String,
  bannerImagePublicId: {
    type: String,
    select: false
  },
  profileImageUrl: String,
  profileImagePublicId: {
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