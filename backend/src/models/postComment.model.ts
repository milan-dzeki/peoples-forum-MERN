import { Schema, models, model } from 'mongoose';

const postCommentSchema = new Schema({
  user: {
    type: Schema.Types.ObjectId,
    ref: 'User',
    required: true
  },
  post: {
    type: Schema.Types.ObjectId,
    ref: 'Post',
    required: true
  },
  communityId: {
    type: Schema.Types.ObjectId,
    ref: 'Community'
  },
  text: String,
  photoUrl: String,
  photoPublicId: {
    type: String,
    select: false
  },
  videoUrl: String,
  videoPublicId: {
    type: String,
    select: false
  },
  tagedUsers: [
    {
      type: Schema.Types.ObjectId,
      ref: 'User',
    }
  ],
  downvoteCount: {
    type: Number,
    default: 0
  },
  upvoteCount: {
    type: Number,
    default: 0
  },
  sharedCount: {
    type: Number,
    default: 0
  },
  parentComment: {
    type: Schema.Types.ObjectId,
    ref: 'PostComment'
  }
}, {
  timestamps: true
});

const PostComment = models.PostComment || model('PostComment', postCommentSchema);

export default PostComment;