import { gql } from "@apollo/client";
import { Maybe } from "src/core";
import {
  Course,
  Lesson,
  LessonProgress,
  LessonSession,
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
  }
`;

export type BaseLessonSessionFields = Pick<LessonSession, "id" | "createdAt">;

export const BaseLessonSessionFields = gql`
  fragment BaseLessonSessionFields on LessonSession {
    id
    createdAt
  }
`;

export type BaseLessonProgressFields = Pick<LessonProgress, "id" | "createdAt">;

export const BaseLessonProgressFields = gql`
  fragment BaseLessonProgressFields on LessonProgress {
    id
    createdAt
  }
`;

export type BaseLessonFields = Pick<
  Lesson,
  | "id"
  | "createdAt"
  | "title"
  | "content"
  | "courseId"
  | "progress"
  | "subtitle"
  | "roles"
  | "type"
> & {
  progress?: Maybe<BaseLessonProgressFields>;
  sessions?: Maybe<BaseLessonSessionFields>;
};

export const BaseLessonFields = gql`
  ${BaseLessonSessionFields}
  ${BaseLessonProgressFields}
  fragment BaseLessonFields on Lesson {
    id
    createdAt
    title
    subtitle
    content
    roles {
      type
      context
    }
    courseId
    type
    progress {
      ...BaseLessonProgressFields
    }
    sessions {
      ...BaseLessonSessionFields
    }
  }
`;

export type BaseCourseFields = Pick<
  Course,
  | "id"
  | "imageUrl"
  | "title"
  | "backgroundColor"
  | "textColor"
  | "subtitle"
  | "isStarted"
> & {
  mostRecentLesson?: Maybe<BaseLessonFields>;
};

export const BaseCourseFields = gql`
  ${BaseLessonFields}
  fragment BaseCourseFields on Course {
    id
    imageUrl
    title
    backgroundColor
    textColor
    subtitle
    isStarted
    mostRecentLesson {
      ...BaseLessonFields
    }
  }
`;
