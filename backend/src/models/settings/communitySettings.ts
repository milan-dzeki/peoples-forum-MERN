import { Schema, models, model } from 'mongoose';

const communitySettingsSchema = new Schema({
  community: {
    type: Schema.Types.ObjectId,
    ref: 'Community'
  },
  access: {
    type: String,
    enum: ['public', 'private'],
    default: 'public'
  }, 
  moderator_settings: {
    changesByModeratorRequireApproval: {
      type: Boolean,
      default: false
    },
    moderatorPermissions: {
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
          'approve_or_decline_publish_posts',
          'remove_comments',
          'pin_posts',
          'ban_users',
          'undo_ban_users',
          'invite_users_as_members',
          'invite_users_as_moderators',
          'withdraw_invite_users_as_members',
          'withdraw_invite_users_as_moderators',
          'ban_users_from_chats',
          "undo_ban_users_from_chats",
          "remove_chats",
          'remove_chat_messages'
        ]
      }],
      default: []
    },
  },
  posts_settings: {
    postsRequireApprovalBeforePublish: {
      type: Boolean,
      default: false
    },
    allowPinnedPosts: {
      type: Boolean,
      default: false
    },
    postsDataAllowed: {
      type: [
        {
          type: String,
          enum: ['text', 'photos', 'videos']
        }
      ],
      default: ['text']
    },
    allowPostSharing: {
      type: Boolean,
      default: false
    },
    allowPostVotes: {
      type: Boolean,
      default: false
    },
    allowPostComments: {
      type: Boolean,
      default: false
    },
    allowTagingInPosts: {
      type: Boolean,
      default: false
    }
  },
  chats_settings: {
    allowChats: {
      type: Boolean,
      default: false
    },
    usersCanCreateChats: {
      type: Boolean,
      default: false
    },
    userChatsRequireApprovalBeforeCreate: {
      type: Boolean,
      default: false
    },
    usersCanBanFromTheirChats: {
      type: Boolean,
      default: false
    },
    usersCanDeleteTheirChats: {
      type: Boolean,
      default: false
    },
    userCanDeleteChatMessages: {
      type: Boolean,
      default: false
    }
  }
});

const CommunitySettings = models.CommunitySettings || model('CommunitySettings', communitySettingsSchema);

export default CommunitySettings;