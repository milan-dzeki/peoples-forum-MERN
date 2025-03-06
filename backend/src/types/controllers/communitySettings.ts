export type AllowedPostDataTypes = 'text' | 'photos' | 'videos';

export type PostsSettings = {
  postsRequireApprovalBeforePublish: { value: boolean };
  allowPinnedPosts: { value: boolean };
  postsDataAllowed: { value: AllowedPostDataTypes[] };
  allowPostSharing: { value: boolean };
  allowPostVotes: { value: boolean };
  allowPostComments: { value: boolean };
  allowPostCommentsVotes: { value: boolean };
  allowPostCommentsSharing: { value: boolean };
};

export type ChatsSettings = {
  allowChats: { value: boolean };
  membersCanCreateChats: { value: boolean };
  membersChatsRequireApprovalBeforeCreate: { value: boolean };
  membersCanManageTheirChats: { value: boolean };
}

export type NonMembersPermissions = {
  canCreatePosts: { value: boolean },
  canViewPosts: { value: boolean },
  canVotePosts: { value: boolean },
  canSharePosts: { value: boolean },
  canPostComments: { value: boolean },
  canViewComments: { value: boolean },
  canVoteComments: { value: boolean },
  canShareComments: { value: boolean },
  canSeeJoinedMembers: { value: boolean },
};
