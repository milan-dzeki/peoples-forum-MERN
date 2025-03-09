"use strict";
Object.defineProperty(exports, "__esModule", { value: true });
const mongoose_1 = require("mongoose");
const community_1 = require("configs/community");
const communitySettingsSchema = new mongoose_1.Schema({
    community: {
        type: mongoose_1.Schema.Types.ObjectId,
        ref: 'Community',
        required: true
    },
    access: {
        value: {
            type: String,
            enum: ['public', 'private'],
            default: 'public'
        }
    },
    moderators_settings: {
        notifyModeratorAboutSettingsChanges: {
            value: {
                type: Boolean,
                default: false
            }
        },
        changesByModeratorRequireApproval: {
            value: {
                type: Boolean,
                default: false
            }
        },
        moderatorPermissions: {
            value: {
                type: [{
                        type: String,
                        enum: [
                            community_1.COMMUNITY_PERMISSION_NAMES.UPDATE_DESCRIPTION,
                            community_1.COMMUNITY_PERMISSION_NAMES.UPDATE_PROFILE_PHOTO,
                            community_1.COMMUNITY_PERMISSION_NAMES.REMOVE_PROFILE_PHOTO,
                            community_1.COMMUNITY_PERMISSION_NAMES.UPDATE_BANNER_PHOTO,
                            community_1.COMMUNITY_PERMISSION_NAMES.REMOVE_BANNER_PHOTO,
                            community_1.COMMUNITY_PERMISSION_NAMES.UPDATE_RULES,
                            community_1.COMMUNITY_PERMISSION_NAMES.UPDATE_COMMUNITY_ACCESS,
                            community_1.COMMUNITY_PERMISSION_NAMES.REMOVE_POSTS,
                            community_1.COMMUNITY_PERMISSION_NAMES.REMOVE_COMMENTS,
                            community_1.COMMUNITY_PERMISSION_NAMES.PIN_POSTS,
                            community_1.COMMUNITY_PERMISSION_NAMES.BAN_USERS,
                            community_1.COMMUNITY_PERMISSION_NAMES.UNDO_BAN_USERS,
                            community_1.COMMUNITY_PERMISSION_NAMES.INVITE_USERS_AS_MEMBERS,
                            community_1.COMMUNITY_PERMISSION_NAMES.INVITE_USERS_AS_MODERATORS,
                            community_1.COMMUNITY_PERMISSION_NAMES.WITHDRAW_INVITE_USERS_AS_MEMBERS,
                            community_1.COMMUNITY_PERMISSION_NAMES.WITHDRAW_INVITE_USERS_AS_MODERATORS,
                            community_1.COMMUNITY_PERMISSION_NAMES.BAN_USERS_FROM_CHATS,
                            community_1.COMMUNITY_PERMISSION_NAMES.UNDO_BAN_USERS_FROM_CHATS,
                            community_1.COMMUNITY_PERMISSION_NAMES.ACCEPT_JOIN_REQUESTS,
                            community_1.COMMUNITY_PERMISSION_NAMES.DECLINE_JOIN_REQUESTS,
                            community_1.COMMUNITY_PERMISSION_NAMES.REMOVE_CHATS,
                            community_1.COMMUNITY_PERMISSION_NAMES.REMOVE_CHAT_MESSAGES
                        ]
                    }],
                default: []
            }
        },
    },
    joined_members_permissions: {
        posts_settings: {
            postsRequireApprovalBeforePublish: {
                value: {
                    type: Boolean,
                    default: false
                }
            },
            allowPinnedPosts: {
                value: {
                    type: Boolean,
                    default: false
                }
            },
            postsDataAllowed: {
                value: {
                    type: [
                        {
                            type: String,
                            enum: ['text', 'photos', 'videos']
                        }
                    ],
                    default: ['text']
                }
            },
            allowPostSharing: {
                value: {
                    type: Boolean,
                    default: false
                }
            },
            allowPostVotes: {
                value: {
                    type: Boolean,
                    default: false
                }
            },
            allowPostComments: {
                value: {
                    type: Boolean,
                    default: false
                }
            },
            allowPostCommentsVotes: {
                value: {
                    type: Boolean,
                    default: false
                }
            },
            allowPostCommentsSharing: {
                value: {
                    type: Boolean,
                    default: false
                }
            }
        },
        chats_settings: {
            allowChats: {
                value: {
                    type: Boolean,
                    default: false
                }
            },
            membersCanCreateChats: {
                value: {
                    type: Boolean,
                    default: false
                }
            },
            membersChatsRequireApprovalBeforeCreate: {
                value: {
                    type: Boolean,
                    default: false
                }
            },
            membersCanManageTheirChats: {
                value: {
                    type: Boolean,
                    default: false
                }
            }
        },
        can_view_members: {
            value: {
                type: Boolean,
                default: false
            }
        }
    },
    non_members_permissions: {
        canCreatePosts: {
            value: {
                type: Boolean,
                default: false
            }
        },
        canViewPosts: {
            value: {
                type: Boolean,
                default: false
            }
        },
        canVotePosts: {
            value: {
                type: Boolean,
                default: false
            }
        },
        canSharePosts: {
            value: {
                type: Boolean,
                default: false
            }
        },
        canPostComments: {
            value: {
                type: Boolean,
                default: false
            }
        },
        canViewComments: {
            value: {
                type: Boolean,
                default: false
            }
        },
        canVoteComments: {
            value: {
                type: Boolean,
                default: false
            }
        },
        canShareComments: {
            value: {
                type: Boolean,
                default: false
            }
        },
        canSeeJoinedMembers: {
            value: {
                type: Boolean,
                default: false
            }
        }
    }
});
communitySettingsSchema.virtual('access.metadata').get(function () {
    return {
        displayName: 'Community access',
        description: 'Can be either "private" or "public". If public, everyone can view community page. If private, only member can see the page'
    };
});
communitySettingsSchema.virtual('moderators_settings.metadata').get(function () {
    return {
        displayName: '',
        description: 'Allow what moderators are allowed to do in this community'
    };
});
// changesByModeratorRequireApproval
communitySettingsSchema.virtual('moderators_settings.changesByModeratorRequireApproval.metadata').get(function () {
    return {
        displayName: 'Approve moderator action before it passes',
        description: 'You will receive request about what moderators want to do and will be able to approve or decline. E.g. if moderator want to pin a post or ban user, you will be notified and decide to approve or decline'
    };
});
communitySettingsSchema.virtual('moderators_settings.moderatorPermissions.metadata').get(function () {
    return {
        displayName: 'Moderator Permissions',
        description: 'Choose what moderators can do'
    };
});
communitySettingsSchema.virtual('joined_members_permissions.metadata').get(function () {
    return {
        displayName: '',
        description: 'Decide what members are allowed to do in this community'
    };
});
communitySettingsSchema.virtual('joined_members_permissions.posts_settings.postsRequireApprovalBeforePublish.metadata').get(function () {
    return {
        displayName: 'Review posts before publish',
        description: 'If checked, creator / moderator will receive request that user want to create post. If not checked, users can automatically create post and it will appear in feed'
    };
});
communitySettingsSchema.virtual('joined_members_permissions.posts_settings.allowPinnedPosts.metadata').get(function () {
    return {
        displayName: 'Allowed posts to be pinned',
        description: ''
    };
});
communitySettingsSchema.virtual('joined_members_permissions.posts_settings.postsDataAllowed.metadata').get(function () {
    return {
        displayName: 'Allowed post data types',
        description: 'Decide what members can post: text, photos, videos'
    };
});
communitySettingsSchema.virtual('joined_members_permissions.posts_settings.allowPostSharing.metadata').get(function () {
    return {
        displayName: 'Allow sharing posts',
        description: 'Decise whether members can share community posts'
    };
});
communitySettingsSchema.virtual('joined_members_permissions.posts_settings.allowPostVotes.metadata').get(function () {
    return {
        displayName: 'Allow voting on posts',
        description: 'Decides whether there is voting options on posts'
    };
});
communitySettingsSchema.virtual('joined_members_permissions.posts_settings.allowPostComments.metadata').get(function () {
    return {
        displayName: 'Allow post comments',
        description: 'Decides whether members can write comments on posts'
    };
});
communitySettingsSchema.virtual('joined_members_permissions.posts_settings.allowPostCommentsSharing.metadata').get(function () {
    return {
        displayName: 'Allow post comments sharing',
        description: 'Decides whether members can share comments (automatically disabled if "Allow post comments" is disabled)'
    };
});
communitySettingsSchema.virtual('joined_members_permissions.posts_settings.allowPostCommentsVotes.metadata').get(function () {
    return {
        displayName: 'Allow post comments votes',
        description: 'Decides whether members can vote comments (automatically disabled if "Allow post comments" is disabled)'
    };
});
communitySettingsSchema.virtual('joined_members_permissions.chats_settings.allowChats.metadata').get(function () {
    return {
        displayName: 'Allow chats',
        description: 'Decide whether this community can have chats'
    };
});
communitySettingsSchema.virtual('joined_members_permissions.chats_settings.membersCanCreateChats.metadata').get(function () {
    return {
        displayName: 'Allow members chats',
        description: 'Decide whether members can create custom chats (automatically disabled is "Allow chats" is disabled)'
    };
});
communitySettingsSchema.virtual('joined_members_permissions.chats_settings.membersChatsRequireApprovalBeforeCreate.metadata').get(function () {
    return {
        displayName: 'Member chat required approval',
        description: 'Decide whether member chat must be approved before creation (meaningless if "Allow chats" is disabled)'
    };
});
communitySettingsSchema.virtual('joined_members_permissions.chats_settings.membersCanManageTheirChats.metadata').get(function () {
    return {
        displayName: 'Members can manage their chats',
        description: 'Decide whether members can manage their own chats (edit, ban, delete, messages) (automatically disabled is "Allow chats" is disabled)'
    };
});
communitySettingsSchema.virtual('joined_members_permissions.can_view_memberss.metadata').get(function () {
    return {
        displayName: 'Can members see member list',
        description: ''
    };
});
communitySettingsSchema.virtual('non_members_permissions.metadata').get(function () {
    return {
        displayName: 'Manage permissions for users not joined',
        description: ''
    };
});
communitySettingsSchema.virtual('non_members_permissions.canViewPosts.metadata').get(function () {
    return {
        displayName: 'Can non-members see posts',
        description: 'Decide whether posts are visible for non-members'
    };
});
communitySettingsSchema.virtual('non_members_permissions.canVotePosts.metadata').get(function () {
    return {
        displayName: 'Can non-members vote posts',
        description: '(depends whether they can see posts)'
    };
});
communitySettingsSchema.virtual('non_members_permissions.canSharePosts.metadata').get(function () {
    return {
        displayName: 'Can non-members share posts',
        description: '(depends whether they can see posts)'
    };
});
communitySettingsSchema.virtual('non_members_permissions.canViewComments.metadata').get(function () {
    return {
        displayName: 'Can non-members view post comments',
        description: ''
    };
});
communitySettingsSchema.virtual('non_members_permissions.canVoteComments.metadata').get(function () {
    return {
        displayName: 'Can non-members vote post comments',
        description: '(depends whether they can see comments)'
    };
});
communitySettingsSchema.virtual('non_members_permissions.canShareComments.metadata').get(function () {
    return {
        displayName: 'Can non-members share post comments',
        description: '(depends whether they can see comments)'
    };
});
communitySettingsSchema.virtual('non_members_permissions.canSeeJoinedMembers.metadata').get(function () {
    return {
        displayName: 'Can non-members see member list',
        description: ''
    };
});
const CommunitySettings = mongoose_1.models.CommunitySettings || (0, mongoose_1.model)('CommunitySettings', communitySettingsSchema);
exports.default = CommunitySettings;
