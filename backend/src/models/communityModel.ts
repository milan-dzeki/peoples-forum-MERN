import { Schema, models, model, InferSchemaType, HydratedDocument } from 'mongoose';
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
      user: {
        type: Schema.Types.ObjectId,
        ref: 'User'
      },
      customPermissions: {
        type: [{
          type: String,
          enum: [
            'update_description', 
            'update_profile_photo', 
            'remove_profile_photo', 
            'update_banner_photo', 
            'remove_banner_photo', 
            'update_rules',
            'update_community_access',
            'remove_posts', 
            'remove_comments',
            'pin_posts',
            'ban_users',
            'undo_ban_users',
            'invite_users_as_members',
            'invite_users_as_moderators',
            'withdraw_invite_users_as_members',
            'withdraw_invite_users_as_meoderators',
            'ban_users_from_chats',
            "undo_ban_users_from_chats",
            "remove_chats",
            'remove_chat_messages'
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

export type CommunitySchemaType = HydratedDocument<InferSchemaType<typeof communitySchema>>;

const Community = models.Community || model('Community', communitySchema);

export default Community;