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

export enum CategoryEnum {
  Comedy = 'Comedy',
  Entrepreneurship = 'Entrepreneurship',
  Hiring = 'Hiring',
  History = 'History',
  Language = 'Language',
  Negotiation = 'Negotiation',
  Philosophy = 'Philosophy',
  Product = 'Product',
  PublicSpeaking = 'PublicSpeaking',
  Science = 'Science'
}

export type CategoryInfo = {
  __typename?: 'CategoryInfo';
  backgroundColor?: Maybe<Scalars['String']['output']>;
  emoji: Scalars['String']['output'];
  label: Scalars['String']['output'];
  textColor?: Maybe<Scalars['String']['output']>;
  value: CategoryEnum;
};

export type CategorySection = {
  __typename?: 'CategorySection';
  categories: Array<CategoryInfo>;
  label: Scalars['String']['output'];
  value: Scalars['String']['output'];
};

export type Content = {
  __typename?: 'Content';
  audioUrl: Scalars['String']['output'];
  authorImageUrl?: Maybe<Scalars['String']['output']>;
  authorName: Scalars['String']['output'];
  categories: Array<Scalars['String']['output']>;
  contentSession?: Maybe<ContentSession>;
  context: Scalars['String']['output'];
  createdAt: Scalars['Date']['output'];
  followUpQuestions: Array<FollowUpQuestion>;
  id: Scalars['String']['output'];
  lengthMs: Scalars['Int']['output'];
  lengthSeconds: Scalars['Int']['output'];
  sourceImageUrl?: Maybe<Scalars['String']['output']>;
  summary?: Maybe<Scalars['String']['output']>;
  thumbnailImageUrl?: Maybe<Scalars['String']['output']>;
  title: Scalars['String']['output'];
  updatedAt: Scalars['Date']['output'];
  websiteUrl: Scalars['String']['output'];
};

export enum ContentFeedFilter {
  ForYou = 'for_you',
  New = 'new',
  Popular = 'popular'
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

export type Course = {
  __typename?: 'Course';
  backgroundColor: Scalars['String']['output'];
  createdAt: Scalars['Date']['output'];
  id: Scalars['String']['output'];
  imageUrl: Scalars['String']['output'];
  isStarted?: Maybe<Scalars['Boolean']['output']>;
  mostRecentLesson?: Maybe<Lesson>;
  subtitle: Scalars['String']['output'];
  textColor: Scalars['String']['output'];
  title: Scalars['String']['output'];
  updatedAt: Scalars['Date']['output'];
};

export type CreateUserResponse = {
  __typename?: 'CreateUserResponse';
  token: Scalars['String']['output'];
  user: User;
};

export type FollowUpQuestion = {
  __typename?: 'FollowUpQuestion';
  answer: Scalars['String']['output'];
  id: Scalars['String']['output'];
  question: Scalars['String']['output'];
};

export type GetMobileUpdateResponse = {
  __typename?: 'GetMobileUpdateResponse';
  latestVersion?: Maybe<Scalars['String']['output']>;
  shouldUpdate: Scalars['Boolean']['output'];
  userVersion?: Maybe<Scalars['String']['output']>;
};

export type Lesson = {
  __typename?: 'Lesson';
  content: Scalars['String']['output'];
  courseId: Scalars['String']['output'];
  createdAt: Scalars['Date']['output'];
  id: Scalars['String']['output'];
  progress?: Maybe<LessonProgress>;
  roles: Array<LessonRole>;
  sessions?: Maybe<Array<LessonSession>>;
  subtitle: Scalars['String']['output'];
  title: Scalars['String']['output'];
  type: LessonTypeEnum;
  updatedAt: Scalars['Date']['output'];
};

export type LessonProgress = {
  __typename?: 'LessonProgress';
  createdAt: Scalars['Date']['output'];
  id: Scalars['String']['output'];
  updatedAt: Scalars['Date']['output'];
};

export type LessonRole = {
  __typename?: 'LessonRole';
  context: Scalars['String']['output'];
  type: Scalars['String']['output'];
};

export type LessonSession = {
  __typename?: 'LessonSession';
  createdAt: Scalars['Date']['output'];
  id: Scalars['String']['output'];
  updatedAt: Scalars['Date']['output'];
};

export enum LessonTypeEnum {
  Game = 'Game',
  RolePlay = 'RolePlay',
  Vocabulary = 'Vocabulary'
}

export type Mutation = {
  __typename?: 'Mutation';
  createUser: CreateUserResponse;
  deleteMe: Scalars['String']['output'];
  getAuthToken: Scalars['String']['output'];
  respond: RespondResponse;
  respondToContent: ContentRespondResponse;
  sendVerification: Scalars['String']['output'];
  setCommuteTime: User;
  setInterests: User;
  startContent: ContentSession;
  startCourse: Course;
  startLesson: LessonSession;
  startListening: ContentSession;
  transcribe: TranscribeResponse;
  updateContentSession: ContentSession;
  updateUser: User;
  verifyPhoneNumber: User;
};


export type MutationCreateUserArgs = {
  email: Scalars['String']['input'];
  name?: InputMaybe<Scalars['String']['input']>;
  password?: InputMaybe<Scalars['String']['input']>;
  referralCode?: InputMaybe<Scalars['String']['input']>;
  username?: InputMaybe<Scalars['String']['input']>;
};


export type MutationRespondArgs = {
  audioFileUrl: Scalars['String']['input'];
  lessonId: Scalars['ID']['input'];
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


export type MutationStartCourseArgs = {
  courseId: Scalars['ID']['input'];
};


export type MutationStartLessonArgs = {
  lessonId: Scalars['String']['input'];
};


export type MutationTranscribeArgs = {
  audioFileUrl: Scalars['String']['input'];
  lessonId: Scalars['ID']['input'];
};


export type MutationUpdateContentSessionArgs = {
  contentSessionId: Scalars['ID']['input'];
  currentMs?: InputMaybe<Scalars['Int']['input']>;
  isBookmarked?: InputMaybe<Scalars['Boolean']['input']>;
  isLiked?: InputMaybe<Scalars['Boolean']['input']>;
};


export type MutationUpdateUserArgs = {
  avatarImageUrl?: InputMaybe<Scalars['String']['input']>;
  biometricPublicKey?: InputMaybe<Scalars['String']['input']>;
  hasMobile?: InputMaybe<Scalars['Boolean']['input']>;
  hasPushNotifications?: InputMaybe<Scalars['Boolean']['input']>;
  hasTwoFactorAuth?: InputMaybe<Scalars['Boolean']['input']>;
  name?: InputMaybe<Scalars['String']['input']>;
  unreadCount?: InputMaybe<Scalars['Int']['input']>;
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
  getActivity: Array<Content>;
  getBookmarks: Array<Content>;
  getCategories: Array<CategorySection>;
  getContent: Content;
  getContentFeed: Array<Content>;
  getContentSession: ContentSession;
  getCourse: Course;
  getCourseLessons: Array<Lesson>;
  getCourses: Array<Course>;
  getCurrentContentSession?: Maybe<ContentSession>;
  getIntercomMobileToken: Scalars['String']['output'];
  getLesson: Lesson;
  getLessonProgress: LessonProgress;
  getLessonSessions: Array<LessonSession>;
  getLikes: Array<ContentSession>;
  getMobileUpdate: GetMobileUpdateResponse;
  getPaymentMethods: Array<PaymentMethod>;
  getProfile: Profile;
  me?: Maybe<User>;
  myCourses: Array<Course>;
  mySessions: Array<LessonSession>;
};


export type QueryCheckCodeArgs = {
  referralCode: Scalars['String']['input'];
};


export type QueryGetActivityArgs = {
  filter?: InputMaybe<ActivityFilter>;
};


export type QueryGetBookmarksArgs = {
  limit?: InputMaybe<Scalars['Int']['input']>;
  page?: InputMaybe<Scalars['Int']['input']>;
};


export type QueryGetContentArgs = {
  contentId: Scalars['ID']['input'];
};


export type QueryGetContentFeedArgs = {
  filter?: InputMaybe<ContentFeedFilter>;
  limit?: InputMaybe<Scalars['Int']['input']>;
};


export type QueryGetContentSessionArgs = {
  contentId: Scalars['ID']['input'];
};


export type QueryGetCourseArgs = {
  courseId: Scalars['ID']['input'];
};


export type QueryGetCourseLessonsArgs = {
  courseId: Scalars['ID']['input'];
};


export type QueryGetIntercomMobileTokenArgs = {
  platform?: InputMaybe<Scalars['String']['input']>;
};


export type QueryGetLessonArgs = {
  lessonId: Scalars['ID']['input'];
};


export type QueryGetLessonProgressArgs = {
  lessonId: Scalars['ID']['input'];
};


export type QueryGetLessonSessionsArgs = {
  lessonId: Scalars['ID']['input'];
};


export type QueryGetLikesArgs = {
  limit?: InputMaybe<Scalars['Int']['input']>;
  page?: InputMaybe<Scalars['Int']['input']>;
};


export type QueryGetProfileArgs = {
  userId?: InputMaybe<Scalars['ID']['input']>;
};

export type RespondResponse = {
  __typename?: 'RespondResponse';
  responseAudioUrl: Scalars['String']['output'];
  transcription: Scalars['String']['output'];
};

export type TranscribeResponse = {
  __typename?: 'TranscribeResponse';
  transcription: Scalars['String']['output'];
};

export type User = {
  __typename?: 'User';
  authProvider: UserAuthProviderEnum;
  authProviderId: Scalars['String']['output'];
  avatarImageUrl?: Maybe<Scalars['String']['output']>;
  biometricPublicKey?: Maybe<Scalars['String']['output']>;
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
  updatedAt: Scalars['Date']['output'];
};

export enum UserAuthProviderEnum {
  Firebase = 'Firebase'
}
