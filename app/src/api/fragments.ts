import { gql } from "@apollo/client";
import { Maybe } from "src/core";
import { Content, ContentSession, Queue, User } from "./generated/types";

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
  }
`;

export type BaseContentFields = Pick<
  Content,
  | "id"
  | "audioUrl"
  | "authorImageUrl"
  | "authorName"
  | "context"
  | "followUpQuestions"
  | "title"
  | "summary"
  | "websiteUrl"
  | "lengthSeconds"
  | "categories"
  | "thumbnailImageUrl"
  | "sourceImageUrl"
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
};

export const BaseContentFields = gql`
  fragment BaseContentFields on Content {
    id
    audioUrl
    authorImageUrl
    authorName
    context
    followUpQuestions {
      id
      question
      answer
    }
    title
    summary
    websiteUrl
    lengthSeconds
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

export type BaseQueueFields = Pick<Queue, "id" | "createdAt" | "updatedAt"> & {
  content: BaseContentFields | null;
};

export const BaseQueueFields = gql`
  ${BaseContentFields}
  fragment BaseQueueFields on Queue {
    id
    createdAt
    updatedAt
    content {
      ...BaseContentFields
    }
  }
`;
