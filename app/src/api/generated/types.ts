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

export type Mutation = {
  __typename?: 'Mutation';
  createUser: CreateUserResponse;
  deleteMe: Scalars['String']['output'];
  getAuthToken: Scalars['String']['output'];
  sendVerification: Scalars['String']['output'];
  textDownloadLink: Scalars['String']['output'];
  updateUser: User;
  verifyPhoneNumber: User;
};


export type MutationCreateUserArgs = {
  didToken: Scalars['String']['input'];
  name?: InputMaybe<Scalars['String']['input']>;
  referralCode?: InputMaybe<Scalars['String']['input']>;
  username?: InputMaybe<Scalars['String']['input']>;
};


export type MutationSendVerificationArgs = {
  phoneNumber: Scalars['String']['input'];
};


export type MutationTextDownloadLinkArgs = {
  phoneNumber: Scalars['String']['input'];
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
  getIntercomMobileToken: Scalars['String']['output'];
  getMobileUpdate: GetMobileUpdateResponse;
  getPaymentMethods: Array<PaymentMethod>;
  me?: Maybe<User>;
};


export type QueryCheckCodeArgs = {
  referralCode: Scalars['String']['input'];
};


export type QueryGetIntercomMobileTokenArgs = {
  platform?: InputMaybe<Scalars['String']['input']>;
};

export type User = {
  __typename?: 'User';
  authProvider: UserAuthProviderEnum;
  authProviderId: Scalars['String']['output'];
  avatarImageUrl?: Maybe<Scalars['String']['output']>;
  biometricPublicKey?: Maybe<Scalars['String']['output']>;
  canTradeMobile?: Maybe<Scalars['Boolean']['output']>;
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
  isAffiliate: Scalars['Boolean']['output'];
  isSuperuser: Scalars['Boolean']['output'];
  name?: Maybe<Scalars['String']['output']>;
  number?: Maybe<Scalars['Float']['output']>;
  numberMobileUser?: Maybe<Scalars['Float']['output']>;
  phoneNumber?: Maybe<Scalars['String']['output']>;
  referralCode?: Maybe<Scalars['String']['output']>;
  referredByCode?: Maybe<Scalars['String']['output']>;
  referredByName?: Maybe<Scalars['String']['output']>;
  role?: Maybe<Scalars['String']['output']>;
  status: UserStatusEnum;
  updatedAt: Scalars['Date']['output'];
  username: Scalars['String']['output'];
};

export enum UserAuthProviderEnum {
  Firebase = 'Firebase',
  Magic = 'Magic'
}

export enum UserStatusEnum {
  Pending = 'Pending',
  User = 'User'
}
