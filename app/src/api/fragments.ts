import { gql } from "@apollo/client";
import {
  Content,
  ContentSession,
  ContentUserFollowingProfile,
  FeedItem,
  Notification,
  User,
} from "./generated/types";
import { Maybe } from "src/core";

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
  | "type"
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
    type
    audioUrl
    websiteUrl
    content
    authorImageUrl
    authorName
    context
    releasedAt
    friends {
      id
      name
      username
      avatarImageUrl
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

export type BaseNotificationFields = Pick<
  Notification,
  | "__typename"
  | "id"
  | "title"
  | "iconImageUrl"
  | "subtitle"
  | "createdAt"
  | "hasRead"
  | "type"
> & {
  followerUser: Maybe<{ id: string; username: string | null }>;
};

export const BaseNotificationFields = gql`
  fragment BaseNotificationFields on Notification {
    id
    title
    iconImageUrl
    subtitle
    createdAt
    hasRead
    type
    followerUser {
      id
      username
    }
  }
`;
