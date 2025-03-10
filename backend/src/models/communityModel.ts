import { Schema, models, model, InferSchemaType, HydratedDocument } from 'mongoose';
import communityInputRules from 'configs/validators/community/communityInputRules';
import { COMMUNITY_PERMISSION_NAMES } from 'configs/community/community';

const communitySchema = new Schema({
  creator: {
    type: Schema.Types.ObjectId,
    ref: 'User',
    required: [true, communityInputRules.creatorId.requiredErrorMessage]
  },
  pendingInvitedModerators: [
    {
      invitedBy: {
        type: Schema.Types.ObjectId,
        ref: 'User'
      },
      user: {
        type: Schema.Types.ObjectId,
        ref: 'User'
      }
    }
  ],
  moderators: [
    {
      user: {
        type: Schema.Types.ObjectId,
        ref: 'User',
        required: true
      },
      customPermissions: {
        type: [{
          type: String,
          enum: [
            COMMUNITY_PERMISSION_NAMES.UPDATE_DESCRIPTION,
            COMMUNITY_PERMISSION_NAMES.UPDATE_PROFILE_PHOTO,
            COMMUNITY_PERMISSION_NAMES.REMOVE_PROFILE_PHOTO,
            COMMUNITY_PERMISSION_NAMES.UPDATE_BANNER_PHOTO,
            COMMUNITY_PERMISSION_NAMES.REMOVE_BANNER_PHOTO,
            COMMUNITY_PERMISSION_NAMES.UPDATE_RULES,
            COMMUNITY_PERMISSION_NAMES.UPDATE_COMMUNITY_ACCESS,
            COMMUNITY_PERMISSION_NAMES.REMOVE_POSTS,
            COMMUNITY_PERMISSION_NAMES.REMOVE_COMMENTS,
            COMMUNITY_PERMISSION_NAMES.PIN_POSTS,
            COMMUNITY_PERMISSION_NAMES.BAN_USERS,
            COMMUNITY_PERMISSION_NAMES.UNDO_BAN_USERS,
            COMMUNITY_PERMISSION_NAMES.INVITE_USERS_AS_MEMBERS,
            COMMUNITY_PERMISSION_NAMES.INVITE_USERS_AS_MODERATORS,
            COMMUNITY_PERMISSION_NAMES.WITHDRAW_INVITE_USERS_AS_MEMBERS,
            COMMUNITY_PERMISSION_NAMES.WITHDRAW_INVITE_USERS_AS_MODERATORS,
            COMMUNITY_PERMISSION_NAMES.BAN_USERS_FROM_CHATS,
            COMMUNITY_PERMISSION_NAMES.UNDO_BAN_USERS_FROM_CHATS,
            COMMUNITY_PERMISSION_NAMES.ACCEPT_JOIN_REQUESTS,
            COMMUNITY_PERMISSION_NAMES.DECLINE_JOIN_REQUESTS,
            COMMUNITY_PERMISSION_NAMES.REMOVE_CHATS,
            COMMUNITY_PERMISSION_NAMES.REMOVE_CHAT_MESSAGES
          ]
        }],
        default: []
      }
    }
  ],
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
      invitedBy: {
        type: Schema.Types.ObjectId,
        ref: 'User'
      },
      user: {
        type: Schema.Types.ObjectId,
        ref: 'User'
      }
    }
  ],
  members: [
    {
      user: {
        type: Schema.Types.ObjectId,
        ref: 'User'
      },
      joinDate: {
        type: Date,
        default: Date.now
      }
    }
  ],
  bannedUsers: [
    {
      user: {
        type: Schema.Types.ObjectId,
        ref: 'User'
      },
      bannedBy: {
        type: Schema.Types.ObjectId,
        ref: 'User'
      }
    }
  ],
  userJoinRequests: [
    {
      user: {
        type: Schema.Types.ObjectId,
        ref: 'User'
      },
      requestDate: {
        type: Date,
        default: Date.now
      }
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

export type CommunitySchemaType = HydratedDocument<InferSchemaType<typeof communitySchema>>;

const Community = models.Community || model('Community', communitySchema);

export default Community;