"use strict";
Object.defineProperty(exports, "__esModule", { value: true });
const mongoose_1 = require("mongoose");
const postSettingsSchema = new mongoose_1.Schema({
    user: {
        type: mongoose_1.Schema.Types.ObjectId,
        ref: 'User'
    },
    whoCanSeeMyPostsInFeed: {
        checked: {
            everyone: {
                type: Boolean,
                default: true
            },
            followers: {
                type: Boolean,
                default: true
            },
            people_I_follow: {
                type: Boolean,
                default: true
            },
            friends: {
                type: Boolean,
                default: true
            },
            friends_of_friends: {
                type: Boolean,
                default: true
            },
            no_one: {
                type: Boolean,
                default: false
            }
        },
        displayName: {
            type: String,
            default: 'Who can see my posts in Feed',
            immutable: true
        },
        description: {
            type: String,
            default: 'This setting decides who can see your posts. This DOESNT apply to community posts - that is decided by community admins. Note that there is additional settings about your posts visibility in profile settings - that applies for posts visibility on your profile page. This applies to posts visibility in Feed',
            immutable: true
        }
    },
    whoCanVoteMyPosts: {
        checked: {
            everyone: {
                type: Boolean,
                default: true
            },
            followers: {
                type: Boolean,
                default: true
            },
            people_I_follow: {
                type: Boolean,
                default: true
            },
            friends: {
                type: Boolean,
                default: true
            },
            friends_of_friends: {
                type: Boolean,
                default: true
            },
            no_one: {
                type: Boolean,
                default: false
            }
        },
        displayName: {
            type: String,
            default: 'Who can vote my posts',
            immutable: true
        },
        description: {
            type: String,
            default: 'This setting decides who can vote your posts. This DOESNT apply to community posts - that is decided by community admins',
            immutable: true
        }
    },
    whoCanCommentMyPosts: {
        checked: {
            everyone: {
                type: Boolean,
                default: true
            },
            followers: {
                type: Boolean,
                default: true
            },
            people_I_follow: {
                type: Boolean,
                default: true
            },
            friends: {
                type: Boolean,
                default: true
            },
            friends_of_friends: {
                type: Boolean,
                default: true
            },
            no_one: {
                type: Boolean,
                default: false
            }
        },
        displayName: {
            type: String,
            default: 'Who can comment my posts',
            immutable: true
        },
        description: {
            type: String,
            default: 'This setting decides who can comment your posts. This DOESNT apply to community posts - that is decided by community admins',
            immutable: true
        }
    },
    whoCanShareMyPosts: {
        checked: {
            everyone: {
                type: Boolean,
                default: true
            },
            followers: {
                type: Boolean,
                default: true
            },
            people_I_follow: {
                type: Boolean,
                default: true
            },
            friends: {
                type: Boolean,
                default: true
            },
            friends_of_friends: {
                type: Boolean,
                default: true
            },
            no_one: {
                type: Boolean,
                default: false
            }
        },
        displayName: {
            type: String,
            default: 'Who can share my posts',
            immutable: true
        },
        description: {
            type: String,
            default: 'This setting decides who can share your posts. This DOESNT apply to community posts - that is decided by community admins',
            immutable: true
        }
    }
}, {
    timestamps: true
});
const PostsSettings = mongoose_1.models.PostsSettings || (0, mongoose_1.model)('PostsSettings', postSettingsSchema);
exports.default = PostsSettings;
