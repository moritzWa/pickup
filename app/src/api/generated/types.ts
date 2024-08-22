export type Maybe<T> = T | null;
export type InputMaybe<T> = Maybe<T>;
export type Exact<T extends { [key: string]: unknown }> = { [K in keyof T]: T[K] };
export type MakeOptional<T, K extends keyof T> = Omit<T, K> & { [SubKey in K]?: Maybe<T[SubKey]> };
export type MakeMaybe<T, K extends keyof T> = Omit<T, K> & { [SubKey in K]: Maybe<T[SubKey]> };
export type MakeEmpty<T extends { [key: string]: unknown }, K extends keyof T> = { [_ in K]?: never };
export type Incremental<T> = T | { [P in keyof T]?: P extends ' $fragmentName' | '__typename' ? T[P] : never };
/** All built-in and custom scalars, mapped to their actual values */
export type Scalars = {
  ID: { input: string; output: string; }
  String: { input: string; output: string; }
  Boolean: { input: boolean; output: boolean; }
  Int: { input: number; output: number; }
  Float: { input: number; output: number; }
  /** Date custom scalar type */
  Date: { input: Date; output: Date; }
  /** The `Upload` scalar type represents a file upload. */
  Upload: { input: any; output: any; }
};

export enum ActivityFilter {
  New = 'new',
  Unread = 'unread'
}

export type Author = {
  __typename?: 'Author';
  contents?: Maybe<Array<Maybe<Content>>>;
  id: Scalars['String']['output'];
  imageUrl?: Maybe<Scalars['String']['output']>;
  name: Scalars['String']['output'];
};

export type Category = {
  __typename?: 'Category';
  emoji: Scalars['String']['output'];
  name: Scalars['String']['output'];
  subcategories: Array<Scalars['String']['output']>;
};

export type CategorySection = {
  __typename?: 'CategorySection';
  categories: Array<Category>;
  name: Scalars['String']['output'];
};

export type Content = {
  __typename?: 'Content';
  audioUrl?: Maybe<Scalars['String']['output']>;
  authorImageUrl?: Maybe<Scalars['String']['output']>;
  authorName?: Maybe<Scalars['String']['output']>;
  authors?: Maybe<Array<Author>>;
  categories: Array<Scalars['String']['output']>;
  content?: Maybe<Scalars['String']['output']>;
  contentSession?: Maybe<ContentSession>;
  context?: Maybe<Scalars['String']['output']>;
  couldntFetchThumbnail?: Maybe<Scalars['Boolean']['output']>;
  createdAt: Scalars['Date']['output'];
  followUpQuestions?: Maybe<Array<FollowUpQuestion>>;
  friends?: Maybe<Array<ContentUserFollowingProfile>>;
  id: Scalars['String']['output'];
  lengthFormatted?: Maybe<Scalars['String']['output']>;
  lengthMs?: Maybe<Scalars['Int']['output']>;
  lengthSeconds: Scalars['Int']['output'];
  ogDescription?: Maybe<Scalars['String']['output']>;
  releasedAt?: Maybe<Scalars['Date']['output']>;
  sourceImageUrl?: Maybe<Scalars['String']['output']>;
  summary?: Maybe<Scalars['String']['output']>;
  thumbnailImageUrl?: Maybe<Scalars['String']['output']>;
  title: Scalars['String']['output'];
  updatedAt: Scalars['Date']['output'];
  websiteUrl: Scalars['String']['output'];
};

export enum ContentFeedFilter {
  Archived = 'archived',
  ForYou = 'for_you',
  New = 'new',
  Popular = 'popular',
  Queue = 'queue',
  Unread = 'unread'
}

export type ContentRespondResponse = {
  __typename?: 'ContentRespondResponse';
  responseAudioUrl: Scalars['String']['output'];
  transcription: Scalars['String']['output'];
};

export type ContentSession = {
  __typename?: 'ContentSession';
  bookmarkedAt?: Maybe<Scalars['Date']['output']>;
  content?: Maybe<Content>;
  contentId: Scalars['String']['output'];
  createdAt: Scalars['Date']['output'];
  currentMs?: Maybe<Scalars['Float']['output']>;
  durationMs?: Maybe<Scalars['Float']['output']>;
  id: Scalars['String']['output'];
  isBookmarked?: Maybe<Scalars['Boolean']['output']>;
  percentFinished?: Maybe<Scalars['Float']['output']>;
  timestampCursor?: Maybe<Scalars['Float']['output']>;
  updatedAt: Scalars['Date']['output'];
  userId: Scalars['String']['output'];
};

export type ContentUserFollowingProfile = {
  __typename?: 'ContentUserFollowingProfile';
  id: Scalars['ID']['output'];
  imageUrl?: Maybe<Scalars['String']['output']>;
  name?: Maybe<Scalars['String']['output']>;
  username?: Maybe<Scalars['String']['output']>;
};

export type CreateUserResponse = {
  __typename?: 'CreateUserResponse';
  token: Scalars['String']['output'];
  user: User;
};

export type FeedItem = {
  __typename?: 'FeedItem';
  content?: Maybe<Content>;
  contentId: Scalars['ID']['output'];
  contentSession?: Maybe<ContentSession>;
  createdAt: Scalars['Date']['output'];
  id: Scalars['ID']['output'];
  isQueued: Scalars['Boolean']['output'];
  position: Scalars['Float']['output'];
  updatedAt: Scalars['Date']['output'];
  userId: Scalars['ID']['output'];
};

export type FollowUpQuestion = {
  __typename?: 'FollowUpQuestion';
  answer: Scalars['String']['output'];
  id: Scalars['String']['output'];
  question: Scalars['String']['output'];
};

export type FollowersResponse = {
  __typename?: 'FollowersResponse';
  followers: Array<Profile>;
  following: Array<Profile>;
};

export type GetMobileUpdateResponse = {
  __typename?: 'GetMobileUpdateResponse';
  latestVersion?: Maybe<Scalars['String']['output']>;
  shouldUpdate: Scalars['Boolean']['output'];
  userVersion?: Maybe<Scalars['String']['output']>;
};

export type GetQueueResponse = {
  __typename?: 'GetQueueResponse';
  queue: Array<FeedItem>;
  total: Scalars['Int']['output'];
};

export type Interaction = {
  __typename?: 'Interaction';
  contentId: Scalars['ID']['output'];
  createdAt: Scalars['Date']['output'];
  id: Scalars['ID']['output'];
  type: InteractionTypeEnum;
  updatedAt: Scalars['Date']['output'];
};

export enum InteractionTypeEnum {
  Bookmarked = 'Bookmarked',
  Finished = 'Finished',
  LeftInProgress = 'LeftInProgress',
  Likes = 'Likes',
  ListenedToBeginning = 'ListenedToBeginning',
  Queued = 'Queued',
  ScrolledPast = 'ScrolledPast',
  Skipped = 'Skipped',
  StartedListening = 'StartedListening'
}

export type Metadata = {
  __typename?: 'Metadata';
  author?: Maybe<Scalars['String']['output']>;
  byline?: Maybe<Scalars['String']['output']>;
  dir?: Maybe<Scalars['String']['output']>;
  excerpt?: Maybe<Scalars['String']['output']>;
  full_text?: Maybe<Scalars['String']['output']>;
  lang?: Maybe<Scalars['String']['output']>;
  length?: Maybe<Scalars['Int']['output']>;
  page_type?: Maybe<Scalars['String']['output']>;
  publishedTime?: Maybe<Scalars['String']['output']>;
  siteName?: Maybe<Scalars['String']['output']>;
};

export type Mutation = {
  __typename?: 'Mutation';
  addOpenGraphDataToContent: Content;
  addToQueue: FeedItem;
  archiveContent: FeedItem;
  bookmarkContent: ContentSession;
  clearQueue: Scalars['String']['output'];
  createAuthor?: Maybe<Author>;
  createContentFromUrl: Content;
  createUser: CreateUserResponse;
  deleteMe: Scalars['String']['output'];
  followProfile: Scalars['String']['output'];
  getAuthToken: Scalars['String']['output'];
  recordInteraction: Interaction;
  removeFromQueue: FeedItem;
  respondToContent: ContentRespondResponse;
  sendVerification: Scalars['String']['output'];
  setCommuteTime: User;
  setInterests: User;
  showMore: Scalars['String']['output'];
  startContent: ContentSession;
  startListening: ContentSession;
  unfollowProfile: Scalars['String']['output'];
  updateContentSession: ContentSession;
  updateUser: User;
  verifyPhoneNumber: User;
};


export type MutationAddOpenGraphDataToContentArgs = {
  contentId: Scalars['String']['input'];
};


export type MutationAddToQueueArgs = {
  contentId: Scalars['ID']['input'];
};


export type MutationArchiveContentArgs = {
  contentId: Scalars['ID']['input'];
};


export type MutationBookmarkContentArgs = {
  contentId: Scalars['ID']['input'];
};


export type MutationCreateAuthorArgs = {
  imageUrl?: InputMaybe<Scalars['String']['input']>;
  name: Scalars['String']['input'];
};


export type MutationCreateContentFromUrlArgs = {
  authProviderId?: InputMaybe<Scalars['String']['input']>;
  url: Scalars['String']['input'];
};


export type MutationCreateUserArgs = {
  email: Scalars['String']['input'];
  name?: InputMaybe<Scalars['String']['input']>;
  password?: InputMaybe<Scalars['String']['input']>;
  referralCode?: InputMaybe<Scalars['String']['input']>;
  username?: InputMaybe<Scalars['String']['input']>;
};


export type MutationFollowProfileArgs = {
  username: Scalars['String']['input'];
};


export type MutationRecordInteractionArgs = {
  contentId: Scalars['ID']['input'];
  eventType: InteractionTypeEnum;
};


export type MutationRemoveFromQueueArgs = {
  contentId: Scalars['ID']['input'];
};


export type MutationRespondToContentArgs = {
  audioFileUrl: Scalars['String']['input'];
  contentId: Scalars['ID']['input'];
};


export type MutationSendVerificationArgs = {
  phoneNumber: Scalars['String']['input'];
};


export type MutationSetCommuteTimeArgs = {
  commuteTime?: InputMaybe<Scalars['String']['input']>;
  timezone?: InputMaybe<Scalars['String']['input']>;
};


export type MutationSetInterestsArgs = {
  interestCategories: Array<Scalars['String']['input']>;
  interestDescription?: InputMaybe<Scalars['String']['input']>;
};


export type MutationStartContentArgs = {
  contentId: Scalars['ID']['input'];
};


export type MutationUnfollowProfileArgs = {
  username: Scalars['String']['input'];
};


export type MutationUpdateContentSessionArgs = {
  contentSessionId: Scalars['ID']['input'];
  currentMs?: InputMaybe<Scalars['Int']['input']>;
  isBookmarked?: InputMaybe<Scalars['Boolean']['input']>;
  isLiked?: InputMaybe<Scalars['Boolean']['input']>;
  lastListenedAt?: InputMaybe<Scalars['Date']['input']>;
};


export type MutationUpdateUserArgs = {
  avatarImageUrl?: InputMaybe<Scalars['String']['input']>;
  biometricPublicKey?: InputMaybe<Scalars['String']['input']>;
  description?: InputMaybe<Scalars['String']['input']>;
  hasMobile?: InputMaybe<Scalars['Boolean']['input']>;
  hasPushNotifications?: InputMaybe<Scalars['Boolean']['input']>;
  hasTwoFactorAuth?: InputMaybe<Scalars['Boolean']['input']>;
  name?: InputMaybe<Scalars['String']['input']>;
  unreadCount?: InputMaybe<Scalars['Int']['input']>;
  username?: InputMaybe<Scalars['String']['input']>;
};


export type MutationVerifyPhoneNumberArgs = {
  otpCode: Scalars['String']['input'];
  phoneNumber: Scalars['String']['input'];
};

export type PaymentMethod = {
  __typename?: 'PaymentMethod';
  last4: Scalars['String']['output'];
  paymentMethodId: Scalars['String']['output'];
  source: Scalars['String']['output'];
};

export type Profile = {
  __typename?: 'Profile';
  avatarImageUrl?: Maybe<Scalars['String']['output']>;
  description: Scalars['String']['output'];
  id: Scalars['ID']['output'];
  isFollowing: Scalars['Boolean']['output'];
  name: Scalars['String']['output'];
  numFollowers: Scalars['Int']['output'];
  numFollowing: Scalars['Int']['output'];
  username: Scalars['String']['output'];
};

export type Query = {
  __typename?: 'Query';
  checkCode: Scalars['Boolean']['output'];
  checkValidUsername: Scalars['String']['output'];
  getActivity: Array<Content>;
  getArchived: Array<Content>;
  getAuthor: Author;
  getBookmarks: Array<Content>;
  getCategories: Array<CategorySection>;
  getContent: Content;
  getContentSession: ContentSession;
  getCurrentContentSession?: Maybe<ContentSession>;
  getFeed: Array<Content>;
  getFollows: FollowersResponse;
  getIntercomMobileToken: Scalars['String']['output'];
  getLikes: Array<ContentSession>;
  getMobileUpdate: GetMobileUpdateResponse;
  getNextContent?: Maybe<FeedItem>;
  getPaymentMethods: Array<PaymentMethod>;
  getPrevContent?: Maybe<FeedItem>;
  getProfile: Profile;
  getQueue: GetQueueResponse;
  me?: Maybe<User>;
  searchSimilarLinks: Array<SearchResult>;
};


export type QueryCheckCodeArgs = {
  referralCode: Scalars['String']['input'];
};


export type QueryCheckValidUsernameArgs = {
  username: Scalars['String']['input'];
};


export type QueryGetActivityArgs = {
  filter?: InputMaybe<ActivityFilter>;
};


export type QueryGetAuthorArgs = {
  authorId: Scalars['ID']['input'];
};


export type QueryGetBookmarksArgs = {
  limit?: InputMaybe<Scalars['Int']['input']>;
  page?: InputMaybe<Scalars['Int']['input']>;
};


export type QueryGetContentArgs = {
  contentId: Scalars['ID']['input'];
};


export type QueryGetContentSessionArgs = {
  contentId: Scalars['ID']['input'];
};


export type QueryGetFeedArgs = {
  filter?: InputMaybe<ContentFeedFilter>;
  limit?: InputMaybe<Scalars['Int']['input']>;
  page?: InputMaybe<Scalars['Int']['input']>;
};


export type QueryGetFollowsArgs = {
  username: Scalars['String']['input'];
};


export type QueryGetIntercomMobileTokenArgs = {
  platform?: InputMaybe<Scalars['String']['input']>;
};


export type QueryGetLikesArgs = {
  limit?: InputMaybe<Scalars['Int']['input']>;
  page?: InputMaybe<Scalars['Int']['input']>;
};


export type QueryGetNextContentArgs = {
  afterContentId: Scalars['ID']['input'];
  currentMs?: InputMaybe<Scalars['Int']['input']>;
};


export type QueryGetPrevContentArgs = {
  beforeContentId: Scalars['ID']['input'];
  currentMs?: InputMaybe<Scalars['Int']['input']>;
};


export type QueryGetProfileArgs = {
  userId?: InputMaybe<Scalars['ID']['input']>;
};


export type QuerySearchSimilarLinksArgs = {
  limit?: InputMaybe<Scalars['Int']['input']>;
  query: Scalars['String']['input'];
};

export type SearchResult = {
  __typename?: 'SearchResult';
  averageDistance: Scalars['Float']['output'];
  createdDate: Scalars['Date']['output'];
  fullText?: Maybe<Scalars['String']['output']>;
  id: Scalars['Int']['output'];
  lastCrawled?: Maybe<Scalars['Date']['output']>;
  link: Scalars['String']['output'];
  metadata?: Maybe<Metadata>;
  minDistance: Scalars['Float']['output'];
  modifiedDate: Scalars['Date']['output'];
  readCount: Scalars['Int']['output'];
  snippet?: Maybe<Scalars['String']['output']>;
  title: Scalars['String']['output'];
  userIds: Array<Scalars['Int']['output']>;
};

export type User = {
  __typename?: 'User';
  authProvider: UserAuthProviderEnum;
  authProviderId: Scalars['String']['output'];
  avatarImageUrl?: Maybe<Scalars['String']['output']>;
  biometricPublicKey?: Maybe<Scalars['String']['output']>;
  commuteTime?: Maybe<Scalars['String']['output']>;
  createdAt: Scalars['Date']['output'];
  description: Scalars['String']['output'];
  email: Scalars['String']['output'];
  hasMobile?: Maybe<Scalars['Boolean']['output']>;
  hasPushNotificationsEnabled?: Maybe<Scalars['Boolean']['output']>;
  hasTwoFactorAuth: Scalars['Boolean']['output'];
  hasVerifiedPhoneNumber: Scalars['Boolean']['output'];
  id: Scalars['String']['output'];
  intercomMobileUserHash?: Maybe<Scalars['String']['output']>;
  intercomUserHash?: Maybe<Scalars['String']['output']>;
  isSuperuser: Scalars['Boolean']['output'];
  name?: Maybe<Scalars['String']['output']>;
  number?: Maybe<Scalars['Float']['output']>;
  phoneNumber?: Maybe<Scalars['String']['output']>;
  referralCode?: Maybe<Scalars['String']['output']>;
  referredByCode?: Maybe<Scalars['String']['output']>;
  referredByName?: Maybe<Scalars['String']['output']>;
  role?: Maybe<Scalars['String']['output']>;
  timezone?: Maybe<Scalars['String']['output']>;
  updatedAt: Scalars['Date']['output'];
  username?: Maybe<Scalars['String']['output']>;
};

export enum UserAuthProviderEnum {
  Firebase = 'Firebase'
}
