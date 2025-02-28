import { Schema, models, model } from 'mongoose';

const postSchema = new Schema({
  user: {
    type: Schema.Types.ObjectId,
    ref: 'User',
    required: [true, 'Post must have the creator. User ID not provided']
  },
  communityId: {
    type: Schema.Types.ObjectId,
    ref: 'Community'
  },
  text: {
    type: String,
    maxLength: 300
  },
  photos: [
    {
      // following cloudinary properties
      secure_url: String,
      public_id: String
    }
  ],
  videoURL: {
    // following cloudinary properties
    secure_url: String,
    public_id: String
  },
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
  tagedUsers: [
    {
      type: Schema.Types.ObjectId,
      ref: 'User',
    }
  ],
  hideFromUsers: [
    {
      type: Schema.Types.ObjectId,
      ref: 'User',
    }
  ]
}, {
  timestamps: true
});

const Post = models.Post || model('Post', postSchema);

export default Post;