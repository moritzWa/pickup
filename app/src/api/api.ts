import { gql } from "@apollo/client";
import {
  BaseContentFields,
  BaseContentSessionFields,
  BaseFeedItemFields,
  BaseNotificationFields,
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

const CheckValidUsername = gql`
  query CheckValidUsername($username: String!) {
    checkValidUsername(username: $username)
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
    $description: String
    $username: String
    $phoneNumber: String
  ) {
    updateUser(
      name: $name
      hasTwoFactorAuth: $hasTwoFactorAuth
      hasMobile: $hasMobile
      hasPushNotifications: $hasPushNotifications
      biometricPublicKey: $biometricPublicKey
      avatarImageUrl: $avatarImageUrl
      description: $description
      username: $username
      phoneNumber: $phoneNumber
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

const SetCommuteTime = gql`
  ${BaseUserFields}
  mutation SetCommuteTime($commuteTime: String!, $timezone: String!) {
    setCommuteTime(commuteTime: $commuteTime, timezone: $timezone) {
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

const FollowProfile = gql`
  mutation FollowProfile($username: String!) {
    followProfile(username: $username)
  }
`;

const UnfollowProfile = gql`
  mutation UnfollowProfile($username: String!) {
    unfollowProfile(username: $username)
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

const SearchUsers = gql`
  query SearchUsers($query: String!) {
    searchUsers(query: $query) {
      id
      username
      name
      avatarImageUrl
      isFollowing
    }
  }
`;

const GetUserContacts = gql`
  query GetUserContacts($phoneNumbers: [String!]!) {
    getUserContacts(phoneNumbers: $phoneNumbers) {
      id
      username
      name
      avatarImageUrl
      description
      isFollowing
      phoneNumber
    }
  }
`;

const GetProfile = gql`
  query GetProfile($username: String) {
    getProfile(username: $username) {
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
  query GetFeed($limit: Int, $filter: ContentFeedFilter, $page: Int) {
    getFeed(limit: $limit, filter: $filter, page: $page) {
      ...BaseContentFields
    }
  }
`;

const GetFriends = gql`
  query GetFriends {
    getFriends {
      profile {
        id
        username
        name
        avatarImageUrl
      }
      unreadCount
    }
  }
`;

const GetActivity = gql`
  ${BaseContentFields}
  query GetActivity($filter: ActivityFilter, $username: String) {
    getActivity(filter: $filter, username: $username) {
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
  ${BaseContentFields}
  query GetBookmarks($limit: Int, $page: Int, $username: String) {
    getBookmarks(limit: $limit, page: $page, username: $username) {
      ...BaseContentFields
    }
  }
`;

const GetArchived = gql`
  ${BaseContentFields}
  query GetArchived {
    getArchived {
      ...BaseContentFields
    }
  }
`;

const Bookmark = gql`
  mutation bookmarkContent($contentId: ID!, $authProviderId: String) {
    bookmarkContent(contentId: $contentId, authProviderId: $authProviderId) {
      id
      isBookmarked
    }
  }
`;

const CreateContentFromUrl = gql`
  ${BaseContentFields}
  mutation CreateContentFromUrl($url: String!) {
    createContentFromUrl(url: $url) {
      ...BaseContentFields
    }
  }
`;

const AddToQueue = gql`
  ${BaseFeedItemFields}
  mutation AddToQueue($contentId: ID!) {
    addToQueue(contentId: $contentId) {
      ...BaseFeedItemFields
    }
  }
`;

const RemoveFromQueue = gql`
  ${BaseFeedItemFields}
  mutation RemoveFromQueue($contentId: ID!) {
    removeFromQueue(contentId: $contentId) {
      ...BaseFeedItemFields
    }
  }
`;

const ArchiveContent = gql`
  ${BaseFeedItemFields}
  mutation ArchiveContent($contentId: ID!) {
    archiveContent(contentId: $contentId) {
      ...BaseFeedItemFields
    }
  }
`;

const GetCategories = gql`
  query GetCategories {
    getCategories {
      name
      categories {
        name
        emoji
        subcategories
      }
    }
  }
`;

const GetNextContent = gql`
  ${BaseFeedItemFields}
  query GetNextContent($afterContentId: ID!) {
    getNextContent(afterContentId: $afterContentId) {
      ...BaseFeedItemFields
    }
  }
`;

const GetPrevContent = gql`
  ${BaseFeedItemFields}
  query GetPrevContent($beforeContentId: ID!) {
    getPrevContent(beforeContentId: $beforeContentId) {
      ...BaseFeedItemFields
    }
  }
`;

const GetQueue = gql`
  ${BaseFeedItemFields}
  query getQueue {
    getQueue {
      queue {
        ...BaseFeedItemFields
      }
      total
    }
  }
`;

const ClearQueue = gql`
  mutation ClearQueue {
    clearQueue
  }
`;

const ShowMore = gql`
  mutation ShowMore {
    showMore
  }
`;

const UpdateContentSession = gql`
  ${BaseContentSessionFields}
  mutation UpdateContentSession(
    $contentSessionId: ID!
    $isBookmarked: Boolean
    $isLiked: Boolean
    $currentMs: Int
    $lastListenedAt: Date
  ) {
    updateContentSession(
      contentSessionId: $contentSessionId
      isBookmarked: $isBookmarked
      isLiked: $isLiked
      currentMs: $currentMs
      lastListenedAt: $lastListenedAt
    ) {
      ...BaseContentSessionFields
    }
  }
`;

const GetContentSession = gql`
  ${BaseContentSessionFields}
  query GetContentSession($contentId: ID!) {
    getContentSession(contentId: $contentId) {
      ...BaseContentSessionFields
    }
  }
`;

const GetFollows = gql`
  query GetFollows($username: String!) {
    getFollows(username: $username) {
      followers {
        username
        name
        avatarImageUrl
      }
      following {
        username
        name
        avatarImageUrl
      }
    }
  }
`;

const GetIsBookmarked = gql`
  query getIsBookmarked($url: String!, $authProviderId: String) {
    getIsBookmarked(url: $url, authProviderId: $authProviderId)
  }
`;

const GetNotifications = gql`
  ${BaseNotificationFields}
  query GetNotifications {
    getNotifications {
      ...BaseNotificationFields
    }
  }
`;

const ReadNotifications = gql`
  mutation ReadNotifications($notificationIds: [ID!]!) {
    readNotifications(notificationIds: $notificationIds)
  }
`;

const GetNumUnreadNotifications = gql`
  query GetNumUnreadNotifications {
    getNumUnreadNotifications
  }
`;

export const api = {
  notifications: {
    list: GetNotifications,
    markAsRead: ReadNotifications,
    unread: GetNumUnreadNotifications,
  },
  users: {
    friends: GetFriends,
    getFollows: GetFollows,
    checkValidUsername: CheckValidUsername,
    deleteMe: DeleteMe,
    create: CreateUser,
    getIntercomHash: GetIntercomMobileToken,
    update: UpdateUser,
    setInterests: SetInterests,
    setCommuteTime: SetCommuteTime,
    verifyBiometric: VerifyBiometric,
    me: GetMe,
    search: SearchUsers,
    getUserContacts: GetUserContacts,
    getProfile: GetProfile,
    getAuthToken: GetAuthToken,
    paymentMethods: GetPaymentMethods,
    unfollow: UnfollowProfile,
    follow: FollowProfile,
  },
  queue: {
    list: GetQueue,
    clear: ClearQueue,
  },
  content: {
    next: GetNextContent,
    prev: GetPrevContent,
    showMore: ShowMore,
    current: GetCurrentContentSession,
    start: StartContent,
    feed: GetContentFeed,
    activity: GetActivity,
    get: GetContent,
    startListening: StartListening,
    bookmarks: GetBookmarks,
    getIsBookmarked: GetIsBookmarked,
    archived: GetArchived,
    bookmark: Bookmark,
    createFromUrl: CreateContentFromUrl,
    addToQueue: AddToQueue,
    removeFromQueue: RemoveFromQueue,
    archive: ArchiveContent,
    updateSession: UpdateContentSession,
    getSession: GetContentSession,
  },
  categories: {
    list: GetCategories,
  },
};
