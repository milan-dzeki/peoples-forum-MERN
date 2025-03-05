import { CommunityPermissionNameType } from "types/controllers/community";

export const COMMUNITY_PERMISSION_NAMES: {
  [key: string]: CommunityPermissionNameType
} = {
  UPDATE_DESCRIPTION: 'update_description', 
  UPDATE_PROFILE_PHOTO: 'update_profile_photo', 
  REMOVE_PROFILE_PHOTOO: 'remove_profile_photo', 
  UPDATE_BANNER_PHOTO: 'update_banner_photo', 
  REMOVE_BANNER_PHOTO: 'remove_banner_photo', 
  UPDATE_RULES: 'update_rules',
  UPDATE_COMMUNITY_ACCESS: 'update_community_access',
  REMOVE_POSTS: 'remove_posts', 
  REMOVE_COMMENTS: 'remove_comments',
  PIN_POSTS: 'pin_posts',
  BAN_USERS: 'ban_users',
  UNDO_BAN_USERS: 'undo_ban_users',
  INVITE_USERS_AS_MEMBERS: 'invite_users_as_members',
  INVITE_USERS_AS_MODERATORS: 'invite_users_as_moderators',
  WITHDRAW_INVITE_USERS_AS_MEMBERS: 'withdraw_invite_users_as_members',
  WITHDRAW_INVITE_USERS_AS_MODERATORS:'withdraw_invite_users_as_meoderators',
  BAN_USERS_FROM_CHATS: 'ban_users_from_chats',
  UNDO_BAN_USERS_FROM_CHATS: 'undo_ban_users_from_chats',
  ACCEPT_JOIN_REQUESTS: 'accept_join_requests',
  DECLINE_JOIN_REQUESTS: 'decline_join_requests',
  REMOVE_CHATS: 'remove_chats',
  REMOVE_CHAT_MESSAGES: 'remove_chat_messages'
};

