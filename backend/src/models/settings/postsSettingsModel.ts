import { Schema, models, model } from 'mongoose';

const postSettingsSchema = new Schema({
  user: {
    type: Schema.Types.ObjectId,
    ref: 'User'
  },
  whoCanSeeMyPostsInFeed: {
    type: [{
      type: String,
      enum: ['everyone', 'followers', 'people_I_follow', 'friends', 'friends_of_friends', 'no_one']
    }],
    default: ['everyone']
  },
  whoCanVoteMyPosts: {
    type: [{
      type: String,
      enum: ['everyone', 'followers', 'people_I_follow', 'friends', 'friends_of_friends', 'no_one']
    }],
    default: ['everyone']
  },
  whoCanCommentMyPosts: {
    type: [{
      type: String,
      enum: ['everyone', 'followers', 'people_I_follow', 'friends', 'friends_of_friends', 'no_one']
    }],
    default: ['everyone']
  },
  whoCanShareMyPosts: {
    type: [{
      type: String,
      enum: ['everyone', 'followers', 'people_I_follow', 'friends', 'friends_of_friends', 'no_one']
    }],
    default: ['everyone']
  }
}, {
  timestamps: true
});

postSettingsSchema.virtual('whoCanSeeMyPostsInFeed.metadata').get(function() {
  return {
    displayName: 'Who can see my posts in Feed',
    description: 'This setting decides who can see your posts. This DOESNT apply to community posts - that is decided by community admins. Note that there is additional settings about your posts visibility in profile settings - that applies for posts visibility on your profile page. This applies to posts visibility in Feed'
  };
});

postSettingsSchema.virtual('whoCanVoteMyPosts.metadata').get(function() {
  return {
    displayName: 'Who can vote my posts',
    description: 'This setting decides who can vote your posts. This DOESNT apply to community posts - that is decided by community admins'
  };
});

postSettingsSchema.virtual('whoCanCommentMyPosts.metadata').get(function() {
  return {
    displayName: 'Who can comment my posts',
    description: 'This setting decides who can comment your posts. This DOESNT apply to community posts - that is decided by community admins'
  };
});

postSettingsSchema.virtual('whoCanShareMyPosts.metadata').get(function() {
  return {
    displayName: 'Who can share my posts',
    description:'This setting decides who can share your posts. This DOESNT apply to community posts - that is decided by community admins'
  };
});

const PostsSettings = models.PostsSettings || model('PostsSettings', postSettingsSchema);

export default PostsSettings;