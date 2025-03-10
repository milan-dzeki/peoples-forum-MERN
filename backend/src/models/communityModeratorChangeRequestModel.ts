import { Schema, models, model, HydratedDocument, InferSchemaType } from 'mongoose';
import { COMMUNITY_MODERATOR_REQUEST_TYPES } from 'configs/community/communityModeratorChangeRequests';

const communityModeratorChangeRequestSchema = new Schema({
  status: {
    type: String,
    enum: ['pending', 'approved', 'declined'],
    default: 'pending',
    required: true
  },
  requestType: {
    type: String,
    enum: [
      COMMUNITY_MODERATOR_REQUEST_TYPES.UPDATE_DESCRIPTION,
      COMMUNITY_MODERATOR_REQUEST_TYPES.UPDATE_PROFILE_PHOTO,
      COMMUNITY_MODERATOR_REQUEST_TYPES.REMOVE_PROFILE_PHOTO,
      COMMUNITY_MODERATOR_REQUEST_TYPES.UPDATE_BANNER_PHOTO,
      COMMUNITY_MODERATOR_REQUEST_TYPES.REMOVE_BANNER_PHOTO,
      COMMUNITY_MODERATOR_REQUEST_TYPES.ADD_RULE,
      COMMUNITY_MODERATOR_REQUEST_TYPES.UPDATE_SINGLE_RULE,
      COMMUNITY_MODERATOR_REQUEST_TYPES.UPDATE_RULES,
      COMMUNITY_MODERATOR_REQUEST_TYPES.DELETE_SINGLE_RULE,
      COMMUNITY_MODERATOR_REQUEST_TYPES.DELETE_MULTIPLE_RULES,
      COMMUNITY_MODERATOR_REQUEST_TYPES.DELETE_ALL_RULES
    ],
    // required: true
  },
  community: {
    type: Schema.Types.ObjectId,
    ref: 'Community',
    required: true
  },
  communityCreator: {
    type: Schema.Types.ObjectId,
    ref: 'User'
  },
  moderator: {
    type: Schema.Types.ObjectId,
    ref: 'User',
    required: true
  },
  requestText: {
    type: String,
    required: true
  },
  forUser: {
    type: Schema.Types.ObjectId,
    ref: 'User'
  },
  post: {
    type: Schema.Types.ObjectId,
    ref: 'Post'
  },
  comment: {
    type: Schema.Types.ObjectId,
    ref: 'Comment'
  },
  chat: {
    type: Schema.Types.ObjectId,
    ref: 'Chat'
  },
  message: {
    type: Schema.Types.ObjectId,
    ref: 'Message'
  },
  photo: {
    secure_url: String,
    public_id: String
  },
  newDescriptionValue: String,
  newRules: [
    {
      _id: Schema.Types.ObjectId,
      title: String,
      description: String
    }
  ],
  deleteRuleIds: [
    {
      type: String
    }
  ]
}, {
  timestamps: true
});

export type CommunityModeratorChangeRequestSchemaType = HydratedDocument<InferSchemaType<typeof communityModeratorChangeRequestSchema>>;

const CommunityModeratorChangeRequest = models.CommunityModeratorChangeRequest || model('CommunityModeratorChangeRequest', communityModeratorChangeRequestSchema);

export default CommunityModeratorChangeRequest;