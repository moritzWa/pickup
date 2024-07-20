import { gql } from "@apollo/client";
import { BaseUserFields } from "./fragments";

const DeleteMe = gql`
  mutation DeleteMe {
    deleteMe
  }
`;

const CreateUser = gql`
  ${BaseUserFields}
  mutation CreateUser($name: String, $didToken: String!) {
    createUser(name: $name, didToken: $didToken) {
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
  ) {
    updateUser(
      name: $name
      hasTwoFactorAuth: $hasTwoFactorAuth
      hasMobile: $hasMobile
      hasPushNotifications: $hasPushNotifications
      biometricPublicKey: $biometricPublicKey
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

const Login = gql`
  ${BaseUserFields}
  mutation Login($didToken: String!) {
    login(didToken: $didToken) {
      user {
        ...BaseUserFields
      }
      token
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

export const api = {
  users: {
    deleteMe: DeleteMe,
    create: CreateUser,
    getIntercomHash: GetIntercomMobileToken,
    update: UpdateUser,
    verifyBiometric: VerifyBiometric,
    me: GetMe,
    login: Login,
    getAuthToken: GetAuthToken,
    paymentMethods: GetPaymentMethods,
  },
};
