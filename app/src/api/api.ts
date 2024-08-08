import { gql } from "@apollo/client";
import {
  BaseContentFields,
  BaseContentSessionFields,
  BaseQueueFields,
  BaseUserFields,
} from "./fragments";

const DeleteMe = gql`
  mutation DeleteMe {
    deleteMe
  }
`;

const CreateUser = gql`
  ${BaseUserFields}
  mutation CreateUser(
    $name: String
    $email: String!
    $username: String
    $password: String
    $referralCode: String
  ) {
    createUser(
      name: $name
      email: $email
      username: $username
      password: $password
      referralCode: $referralCode
    ) {
      user {
        ...BaseUserFields
      }
      token
    }
  }
`;

const UpdateUser = gql`
  ${BaseUserFields}
  mutation UpdateUser(
    $name: String
    $hasTwoFactorAuth: Boolean
    $hasMobile: Boolean
    $hasPushNotifications: Boolean
    $biometricPublicKey: String
    $avatarImageUrl: String
  ) {
    updateUser(
      name: $name
      hasTwoFactorAuth: $hasTwoFactorAuth
      hasMobile: $hasMobile
      hasPushNotifications: $hasPushNotifications
      biometricPublicKey: $biometricPublicKey
      avatarImageUrl: $avatarImageUrl
    ) {
      ...BaseUserFields
    }
  }
`;

const SetInterests = gql`
  ${BaseUserFields}
  mutation SetInterests(
    $interestCategories: [String!]!
    $interestDescription: String
  ) {
    setInterests(
      interestCategories: $interestCategories
      interestDescription: $interestDescription
    ) {
      ...BaseUserFields
    }
  }
`;

const VerifyBiometric = gql`
  mutation VerifyBiometric($signature: String!, $payload: String!) {
    verifyBiometric(signature: $signature, payload: $payload) {
      status
      message
    }
  }
`;

const GetMe = gql`
  ${BaseUserFields}
  query GetMe {
    me {
      ...BaseUserFields
    }
  }
`;

const GetProfile = gql`
  query GetProfile($userId: ID!) {
    getProfile(userId: $userId) {
      id
      username
      name
      description
      numFollowers
      numFollowing
      avatarImageUrl
      isFollowing
    }
  }
`;

const GetIntercomMobileToken = gql`
  query GetIntercomMobileToken {
    getIntercomMobileToken
  }
`;

const GetAuthToken = gql`
  query GetAuthToken {
    getAuthToken
  }
`;

const GetPaymentMethods = gql`
  query GetPaymentMethods {
    getPaymentMethods {
      last4
      source
    }
  }
`;

const GetCurrentContentSession = gql`
  ${BaseContentSessionFields}
  ${BaseContentFields}
  query GetCurrentContentSession {
    getCurrentContentSession {
      ...BaseContentSessionFields
      content {
        ...BaseContentFields
      }
    }
  }
`;

const Transcribe = gql`
  mutation Transcribe($lessonId: ID!, $audioFileUrl: String!) {
    transcribe(lessonId: $lessonId, audioFileUrl: $audioFileUrl) {
      transcription
    }
  }
`;

const Respond = gql`
  mutation Respond($lessonId: ID!, $audioFileUrl: String!) {
    respond(lessonId: $lessonId, audioFileUrl: $audioFileUrl) {
      transcription
      responseAudioUrl
    }
  }
`;

const StartContent = gql`
  ${BaseContentSessionFields}
  mutation StartContent($contentId: ID!) {
    startContent(contentId: $contentId) {
      ...BaseContentSessionFields
    }
  }
`;

const StartListening = gql`
  ${BaseContentSessionFields}
  mutation StartListening {
    startListening {
      ...BaseContentSessionFields
    }
  }
`;
// content

const GetContentFeed = gql`
  ${BaseContentFields}
  query GetContentFeed($limit: Int, $filter: ContentFeedFilter) {
    getContentFeed(limit: $limit, filter: $filter) {
      ...BaseContentFields
    }
  }
`;

const GetActivity = gql`
  ${BaseContentFields}
  query GetActivity($filter: ActivityFilter) {
    getActivity(limit: $limit, filter: $filter) {
      ...BaseContentFields
    }
  }
`;

const GetContent = gql`
  ${BaseContentFields}
  query GetContent($contentId: ID!) {
    getContent(contentId: $contentId) {
      ...BaseContentFields
    }
  }
`;

const GetBookmarks = gql`
  ${BaseContentSessionFields}
  query GetBookmarks($limit: Int, $page: Int) {
    getBookmarks(limit: $limit, page: $page) {
      ...BaseContentSessionFields
    }
  }
`;

const GetCategories = gql`
  query GetCategories {
    getCategories {
      label
      value
      categories {
        label
        value
        emoji
        backgroundColor
        textColor
      }
    }
  }
`;

const GetNextContent = gql`
  ${BaseQueueFields}
  query GetNextContent($contentId: ID!) {
    getNextContent(contentId: $contentId) {
      ...BaseQueueFields
    }
  }
`;

const GetPrevContent = gql`
  ${BaseQueueFields}
  query GetPrevContent($contentId: ID!) {
    getPrevContent(contentId: $contentId) {
      ...BaseQueueFields
    }
  }
`;

const GetQueue = gql`
  ${BaseQueueFields}
  query getQueue {
    getQueue {
      ...BaseQueueFields
    }
  }
`;

export const api = {
  users: {
    deleteMe: DeleteMe,
    create: CreateUser,
    getIntercomHash: GetIntercomMobileToken,
    update: UpdateUser,
    setInterests: SetInterests,
    verifyBiometric: VerifyBiometric,
    me: GetMe,
    getProfile: GetProfile,
    getAuthToken: GetAuthToken,
    paymentMethods: GetPaymentMethods,
  },
  queue: {
    next: GetNextContent,
    prev: GetPrevContent,
    list: GetQueue,
  },
  content: {
    current: GetCurrentContentSession,
    start: StartContent,
    feed: GetContentFeed,
    activity: GetActivity,
    get: GetContent,
    startListening: StartListening,
    bookmarks: GetBookmarks,
  },
  categories: {
    list: GetCategories,
  },
};
