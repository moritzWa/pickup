import {
  ApolloCache,
  ApolloQueryResult,
  DefaultContext,
  MutationFunctionOptions,
  OperationVariables,
  useApolloClient,
  useMutation,
  useQuery,
  WatchQueryFetchPolicy,
} from "@apollo/client";
import { useEffect, useMemo } from "react";
import { useDispatch, useSelector } from "react-redux";
import { api } from "src/api";
import { BaseUserFields } from "src/api/fragments";
import { Maybe, success, UnexpectedError } from "src/core";
import { getUserAuthStatus } from "src/redux/reducers/user";
import { AuthStatus } from "src/redux/types";

export type UseMeReturn = {
  me: Maybe<BaseUserFields>;
  authStatus: AuthStatus;
  loadingMe: boolean;
  refetchMe: () => Promise<BaseUserFields | null>;
  updateMe: (
    options?: MutationFunctionOptions<
      { updateMe: BaseUserFields },
      OperationVariables,
      DefaultContext,
      ApolloCache<any>
    >
  ) => Promise<any>;
};

export const useMe = (
  fetchPolicy: WatchQueryFetchPolicy = "cache-and-network"
): UseMeReturn => {
  const authStatus = useSelector(getUserAuthStatus);
  const dispatch = useDispatch();

  const {
    data: myData,
    refetch: _refetchMe,
    loading: loadingMe,
    error,
  } = useQuery<{
    me: BaseUserFields;
  }>(api.users.me, {
    fetchPolicy,
    // skip: authStatus !== "LOGGED_IN",
  });

  const [_updateMe] = useMutation<{
    updateMe: BaseUserFields;
  }>(api.users.update);

  const updateMe = async (
    options?: MutationFunctionOptions<
      { updateMe: BaseUserFields },
      OperationVariables,
      DefaultContext,
      ApolloCache<any>
    >
  ) => {
    await _updateMe({
      ...options,
      refetchQueries: [api.users.me],
    });
  };

  const apollo = useApolloClient();

  const _fetchUserInfo = async () => {
    try {
      // console.log(`[refetching user]`);

      const data = await _refetchMe({
        fetchPolicy: "network-only",
      });
      const me = data?.data?.me;
      // console.log(data.data);
      // console.log(data.error);
      return me;
    } catch (err) {
      console.log(JSON.stringify(err, null, 2));
      return null;
    }
  };

  useEffect(() => {
    if (authStatus === "LOGGED_IN") {
      // console.log("[fetching user info]");
      _fetchUserInfo();
    }
  }, [authStatus]);

  useEffect(() => {}, []);

  const me = myData?.me || null;

  if (error && __DEV__) {
    console.log(JSON.stringify(error, null, 2));
  }

  // console.log("AUTH STATUS: " + authStatus);
  // console.log("MY DATA: ", myData);

  return {
    me,
    authStatus,
    refetchMe: _fetchUserInfo,
    loadingMe,
    updateMe,
  };
};
