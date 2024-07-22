import { gql } from "@apollo/client";
import { Maybe } from "src/core";
import { Course, Lesson, Session, User } from "./generated/types";

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

export type BaseCourseFields = Pick<
  Course,
  "id" | "imageUrl" | "title" | "backgroundColor" | "textColor" | "subtitle"
>;

export const BaseCourseFields = gql`
  fragment BaseCourseFields on Course {
    id
    imageUrl
    title
    backgroundColor
    textColor
    subtitle
  }
`;

export type BaseLessonFields = Pick<Lesson, "id" | "createdAt">;

export const BaseLessonFields = gql`
  fragment BaseLessonFields on Lesson {
    id
    createdAt
  }
`;

export type BaseSessionFields = Pick<Session, "id" | "createdAt">;

export const BaseSessionFields = gql`
  fragment BaseSessionFields on Lesson {
    id
    createdAt
  }
`;
