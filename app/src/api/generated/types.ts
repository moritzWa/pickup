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

export type Course = {
  __typename?: 'Course';
  backgroundColor: Scalars['String']['output'];
  createdAt: Scalars['Date']['output'];
  id: Scalars['String']['output'];
  imageUrl: Scalars['String']['output'];
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

export type GetMobileUpdateResponse = {
  __typename?: 'GetMobileUpdateResponse';
  latestVersion?: Maybe<Scalars['String']['output']>;
  shouldUpdate: Scalars['Boolean']['output'];
  userVersion?: Maybe<Scalars['String']['output']>;
};

export type Lesson = {
  __typename?: 'Lesson';
  createdAt: Scalars['Date']['output'];
  id: Scalars['String']['output'];
  updatedAt: Scalars['Date']['output'];
};

export type Mutation = {
  __typename?: 'Mutation';
  createUser: CreateUserResponse;
  deleteMe: Scalars['String']['output'];
  getAuthToken: Scalars['String']['output'];
  sendVerification: Scalars['String']['output'];
  startCourse: Course;
  startSession: Session;
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


export type MutationSendVerificationArgs = {
  phoneNumber: Scalars['String']['input'];
};


export type MutationStartCourseArgs = {
  courseId: Scalars['ID']['input'];
};


export type MutationStartSessionArgs = {
  courseId: Scalars['String']['input'];
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

export type Query = {
  __typename?: 'Query';
  checkCode: Scalars['Boolean']['output'];
  getCourseLessons: Array<Lesson>;
  getCourses: Array<Course>;
  getIntercomMobileToken: Scalars['String']['output'];
  getMobileUpdate: GetMobileUpdateResponse;
  getPaymentMethods: Array<PaymentMethod>;
  me?: Maybe<User>;
  myCourses: Array<Course>;
  mySessions: Array<Session>;
};


export type QueryCheckCodeArgs = {
  referralCode: Scalars['String']['input'];
};


export type QueryGetCourseLessonsArgs = {
  courseId: Scalars['ID']['input'];
};


export type QueryGetIntercomMobileTokenArgs = {
  platform?: InputMaybe<Scalars['String']['input']>;
};

export type Session = {
  __typename?: 'Session';
  createdAt: Scalars['Date']['output'];
  id: Scalars['String']['output'];
  updatedAt: Scalars['Date']['output'];
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
