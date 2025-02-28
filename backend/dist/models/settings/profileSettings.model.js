"use strict";
Object.defineProperty(exports, "__esModule", { value: true });
const mongoose_1 = require("mongoose");
const profileSettingsSchema = new mongoose_1.Schema({
    user: {
        type: mongoose_1.Schema.Types.ObjectId,
        ref: 'User'
    },
    whoCanSeeMyProfileInfo: {
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
            default: 'Who can see my profile info',
            immutable: true
        },
        description: {
            type: String,
            default: 'This setting decides who can see your basic info upon your profile visit',
            immutable: true
        }
    },
    whoCanSeeMyPosts: {
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
            default: 'Who can see my posts',
            immutable: true
        },
        description: {
            type: String,
            default: 'This setting decides who can see your created posts upon your profile visit',
            immutable: true
        }
    },
    whoCanSeeMyComments: {
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
            default: 'Who can see my comments',
            immutable: true
        },
        description: {
            type: String,
            default: 'This setting decides who can see your created comments upon your profile visit',
            immutable: true
        }
    },
    whoCanSeeMyUpvotes: {
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
            default: 'Who can see my upvotes',
            immutable: true
        },
        description: {
            type: String,
            default: 'This setting decides who can see your upvotes on posts and comments upon your profile visit',
            immutable: true
        }
    },
    whoCanSeeMyDownvotes: {
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
            default: 'Who can see my downvotes',
            immutable: true
        },
        description: {
            type: String,
            default: 'This setting decides who can see your downvotes on posts and comments upon your profile visit',
            immutable: true
        }
    },
    whoCanSeeMySavedPosts: {
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
            default: 'Who can see my saved posts',
            immutable: true
        },
        description: {
            type: String,
            default: 'This setting decides who can see your saved posts upon your profile visit',
            immutable: true
        }
    },
    whoCanSeeMySavedComments: {
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
            default: 'Who can see my saved comments',
            immutable: true
        },
        description: {
            type: String,
            default: 'This setting decides who can see your saved comments upon your profile visit',
            immutable: true
        }
    },
    whoCanSeeMyFriends: {
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
            default: 'Who can see my friends',
            immutable: true
        },
        description: {
            type: String,
            default: 'This setting decides who can see your friends upon your profile visit',
            immutable: true
        }
    },
    whoCanSeeMyFollowers: {
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
            default: 'Who can see my followers',
            immutable: true
        },
        description: {
            type: String,
            default: 'This setting decides who can see your followers upon your profile visit',
            immutable: true
        }
    },
    whoCanSeePeopleIFollow: {
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
            default: 'Who can see people I follow',
            immutable: true
        },
        description: {
            type: String,
            default: 'This setting decides who can see people you follow upon your profile visit',
            immutable: true
        }
    },
    whoCanSeeMyCommunities: {
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
            default: 'Who can see my communities',
            immutable: true
        },
        description: {
            type: String,
            default: 'This setting decides who can see communities you created upon your profile visit',
            immutable: true
        }
    },
    whoCanSeeCommunitiesIJoined: {
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
            default: 'Who can see communities I joined',
            immutable: true
        },
        description: {
            type: String,
            default: 'This setting decides who can see communities you joined upon your profile visit',
            immutable: true
        }
    },
    whoCanSeeMyActivityStats: {
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
            default: 'Who can see my activity stats',
            immutable: true
        },
        description: {
            type: String,
            default: 'This setting decides who can see your activity (posts creation, upvotes and downvotes) upon your profile visit',
            immutable: true
        }
    }
}, {
    timestamps: true
});
const ProfileSettings = mongoose_1.models.ProfileSettings || (0, mongoose_1.model)('ProfileSettings', profileSettingsSchema);
exports.default = ProfileSettings;
