import { gql } from "@apollo/client";
import {
  Content,
  ContentSession,
  ContentUserFollowingProfile,
  FeedItem,
  User,
} from "./generated/types";

export type BaseUserFields = Pick<
  User,
  | "__typename"
  | "id"
  | "email"
  | "avatarImageUrl"
  | "name"
  | "phoneNumber"
  | "isSuperuser"
  | "createdAt"
  | "updatedAt"
  | "referredByCode"
  | "role"
  | "intercomUserHash"
  | "intercomMobileUserHash"
  | "hasPushNotificationsEnabled"
  | "hasMobile"
  | "number"
  | "biometricPublicKey"
  | "hasVerifiedPhoneNumber"
  | "description"
  | "referralCode"
  | "authProviderId"
  | "timezone"
  | "commuteTime"
  | "username"
>;

export const BaseUserFields = gql`
  fragment BaseUserFields on User {
    id
    hasVerifiedPhoneNumber
    email
    avatarImageUrl
    name
    isSuperuser
    phoneNumber
    createdAt
    updatedAt
    referredByCode
    role
    intercomUserHash
    intercomMobileUserHash
    hasMobile
    number
    hasPushNotificationsEnabled
    biometricPublicKey
    description
    referralCode
    authProviderId
    timezone
    commuteTime
    username
  }
`;

export type BaseContentFields = Pick<
  Content,
  | "id"
  | "audioUrl"
  | "websiteUrl"
  | "authorImageUrl"
  | "authorName"
  | "context"
  | "followUpQuestions"
  | "title"
  | "summary"
  | "ogDescription"
  | "websiteUrl"
  | "lengthSeconds"
  | "categories"
  | "thumbnailImageUrl"
  | "sourceImageUrl"
  | "lengthMs"
  | "lengthFormatted"
  | "content"
  | "releasedAt"
> & {
  contentSession?: Pick<
    ContentSession,
    | "id"
    | "currentMs"
    | "durationMs"
    | "percentFinished"
    | "isBookmarked"
    | "bookmarkedAt"
    | "createdAt"
    | "updatedAt"
  >;
  friends?: ContentUserFollowingProfile[];
};

export const BaseContentFields = gql`
  fragment BaseContentFields on Content {
    id
    audioUrl
    websiteUrl
    content
    authorImageUrl
    authorName
    context
    releasedAt
    followUpQuestions {
      id
      question
      answer
    }
    friends {
      id
      name
      username
      imageUrl
    }
    title
    summary
    ogDescription
    websiteUrl
    lengthSeconds
    lengthMs
    lengthFormatted
    categories
    thumbnailImageUrl
    sourceImageUrl
    contentSession {
      id
      currentMs
      durationMs
      contentId
      userId
      percentFinished
      isBookmarked
      bookmarkedAt
      createdAt
      updatedAt
    }
  }
`;

export type BaseContentSessionFields = Pick<ContentSession, "id"> & {
  content: BaseContentFields | null;
};

export const BaseContentSessionFields = gql`
  ${BaseContentFields}
  fragment BaseContentSessionFields on ContentSession {
    id
    timestampCursor
    currentMs
    durationMs
    contentId
    userId
    percentFinished
    isBookmarked
    bookmarkedAt
    createdAt
    updatedAt
    content {
      ...BaseContentFields
    }
  }
`;

export type BaseFeedItemFields = Pick<
  FeedItem,
  "id" | "createdAt" | "updatedAt"
> & {
  content: BaseContentFields | null;
};

export const BaseFeedItemFields = gql`
  ${BaseContentFields}
  fragment BaseFeedItemFields on FeedItem {
    id
    createdAt
    updatedAt
    content {
      ...BaseContentFields
    }
  }
`;
