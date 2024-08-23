import { useLazyQuery, useQuery } from "@apollo/client";
import { faSearch } from "@fortawesome/pro-solid-svg-icons";
import { FontAwesomeIcon } from "@fortawesome/react-native-fontawesome";
import { useNavigation } from "@react-navigation/native";
import { SearchBar } from "@rneui/base";
import * as Haptics from "expo-haptics";
import Fuse from "fuse.js";
import { debounce } from "lodash";
import React, { useCallback, useEffect, useMemo, useState } from "react";
import {
  ActivityIndicator,
  Linking,
  Platform,
  SectionList,
  SectionListData,
  Share,
  StyleSheet,
  Text,
  TouchableOpacity,
  View,
} from "react-native";
import Contacts from "react-native-contacts";
import { RefreshControl } from "react-native-gesture-handler";
import { PERMISSIONS, check, request } from "react-native-permissions";
import { api, apolloClient } from "src/api";
import {
  Query,
  QueryGetUserContactsArgs,
  UserSearchResult,
} from "src/api/generated/types";
import { colors } from "src/components";
import { IS_IPAD } from "src/config";
import { useMe } from "src/hooks";
import { useTheme } from "src/hooks/useTheme";
import { NavigationProps } from "src/navigation";
import { ContactRow } from "./ContactRow";
import { UserRow } from "./UserRow";
import { hasValue } from "src/core";

export const SearchResults = () => {
  const fullTheme = useTheme();
  const { text, header } = fullTheme;
  const [refreshing, setRefreshing] = useState(false);
  const navigation = useNavigation<NavigationProps>();
  const [hasPermission, setHasPermission] = useState<boolean | null>(null);
  const { me } = useMe();
  const [isHidden, setIsHidden] = useState(false);

  const [_contacts, setContacts] = useState<Contacts.Contact[]>([]);

  const [search, setSearch] = useState("");

  const contactPhoneNumbers = useMemo(
    (): string[] =>
      _contacts.map((c) => c.phoneNumbers.flatMap((p) => p.number)).flat(),
    [_contacts]
  );

  const [searchUsers, { data: resultsData, loading: loadingSearchResults }] =
    useLazyQuery<Pick<Query, "searchUsers">>(api.users.search, {
      notifyOnNetworkStatusChange: true,
      fetchPolicy: "cache-first",
    });

  const { data: userContacts } = useQuery<
    Pick<Query, "getUserContacts">,
    QueryGetUserContactsArgs
  >(api.users.getUserContacts, {
    notifyOnNetworkStatusChange: true,
    fetchPolicy: "cache-first",
    variables: {
      phoneNumbers: contactPhoneNumbers,
    },
  });

  const userPhoneNumbers = useMemo(
    () =>
      new Set(
        userContacts?.getUserContacts
          ?.map((c) => c.phoneNumber)
          .filter(hasValue)
      ) ?? [],
    [userContacts]
  );

  const _getContactsPermission = async () => {
    const CONTACT_PERMISSION = Platform.select({
      ios: PERMISSIONS.IOS.CONTACTS,
      android: PERMISSIONS.ANDROID.READ_CONTACTS,
      default: PERMISSIONS.IOS.CONTACTS,
    });

    // check if have contacts permission on iOS
    const status = await check(CONTACT_PERMISSION);

    if (status === "granted") {
      setHasPermission(true);
    } else {
      setHasPermission(false);
    }
  };

  useEffect(() => void _getContactsPermission(), []);

  const _syncContacts = async () => {
    const contacts = await Contacts.getAll();

    setContacts(contacts);
  };

  useEffect(() => {
    if (hasPermission) {
      _syncContacts();
    }
  }, [hasPermission]);

  const _requestPermission = async () => {
    const CONTACT_PERMISSION = Platform.select({
      ios: PERMISSIONS.IOS.CONTACTS,
      android: PERMISSIONS.ANDROID.READ_CONTACTS,
      default: PERMISSIONS.IOS.CONTACTS,
    });

    const status = await check(CONTACT_PERMISSION);

    // if blocked open up settings, otherwise request
    if (status === "blocked") {
      Linking.openSettings();
    } else {
      const status = await request(CONTACT_PERMISSION);
      setHasPermission(status === "granted");
    }
  };

  const _onDeny = () => {
    setIsHidden(true);
  };

  const discoveryResults = useMemo(() => {
    return [] ?? null;
  }, []);

  // const { results, users } = discoveryResults ?? { results: null, users: null };

  const debouncedSearchResults = useCallback(
    debounce((search: string) => {
      if (!search.trim()) return;

      searchUsers({
        variables: {
          query: search.trim(),
        },
      });
    }, 250),
    []
  );

  useEffect(() => {
    debouncedSearchResults(search);
  }, [search, debouncedSearchResults]);

  const loading = loadingSearchResults;

  const _onRefresh = useCallback(async () => {
    setRefreshing(true);

    try {
      await apolloClient.refetchQueries({
        include: [api.users.search],
      });
    } finally {
      setRefreshing(false);
    }
  }, []);

  const onSelectUser = (user: UserSearchResult) => {
    Haptics.impactAsync(Haptics.ImpactFeedbackStyle.Light);

    navigation.navigate("UserProfile", {
      username: user.username || "",
    });
  };

  const onSelectContact = useCallback((contact: Contacts.Contact) => {
    Haptics.impactAsync(Haptics.ImpactFeedbackStyle.Light);

    const phoneNumber = contact.phoneNumbers?.[0]?.number;
    const message =
      "Get smarter with me on Pickup (podcasts + social). You can see what I listen to, and I can see what you listen to 🎙️\n\nhttps://testflight.apple.com/join/ets4bkPy";

    if (phoneNumber) {
      // open up to send to this contact on imessage
      const url = `sms:${phoneNumber}?body=${message}`;

      Linking.openURL(url);

      return;
    }

    // open up to send to this contact
    Share.share({
      message: message,
    });
  }, []);

  // indexed contacts by some keys
  const contactSearch = useMemo(() => {
    const contacts = _contacts.filter((c) => !userPhoneNumbers.has(c.recordID));

    return new Fuse(contacts, {
      threshold: 0.1,
      isCaseSensitive: false,
      keys: ["displayName", "givenName", "familyName"],
    });
  }, [_contacts.length, userPhoneNumbers]);

  const relevantContacts = useMemo((): Contacts.Contact[] => {
    if (!search)
      return _contacts.filter((c) => !userPhoneNumbers.has(c.recordID));
    return contactSearch.search(search).map((i) => i.item);
  }, [contactSearch, search, _contacts.length, userPhoneNumbers]);

  const relevantUsers = useMemo((): UserSearchResult[] => {
    return resultsData?.searchUsers ?? [];
  }, [resultsData]);

  const userSection: SectionListData<UserSearchResult> = useMemo(
    () => ({
      key: "user",
      data: relevantUsers ?? [],
      keyExtractor: (item) => item.id,
      renderItem: ({ item }) => (
        <UserRow onSelectUser={onSelectUser} user={item} />
      ),
    }),
    [relevantUsers]
  );

  const contactSection: SectionListData<Contacts.Contact> = useMemo(
    () => ({
      key: "contacts",
      data: relevantContacts ?? [],
      keyExtractor: (item) => item.recordID,
      renderItem: ({ item }) => (
        <ContactRow onSelectContact={onSelectContact} contact={item} />
      ),
    }),
    [relevantContacts, onSelectContact]
  );

  const hasResults =
    (!!_contacts && _contacts.length > 0) ||
    (!!relevantUsers && relevantUsers.length > 0);

  return (
    <>
      <SearchBar
        onChangeText={setSearch}
        autoCapitalize="none"
        showCancel={false}
        cancelButtonProps={{ style: { display: "none" } }}
        autoComplete="off"
        autoCorrect={false}
        value={search}
        containerStyle={{
          backgroundColor: "transparent",
          paddingHorizontal: 5,
        }}
        searchIcon={
          <FontAwesomeIcon
            icon={faSearch}
            color={fullTheme.textSubtle}
            size={16}
          />
        }
        inputContainerStyle={{
          backgroundColor: fullTheme.secondaryBackground,
          height: 45,
          paddingHorizontal: 10,
          paddingRight: 0,
          borderRadius: 100,
        }}
        clearIcon={
          <View />
          // <FontAwesomeIcon
          //   icon={faTimes}
          //   color={fullTheme.textSubtle}
          //   size={16}
          // />
        }
        inputStyle={{
          color: text,
          fontSize: 16,
          fontFamily: "Inter-Regular",
        }}
        platform="ios"
        placeholder="Search"
      />

      {!hasPermission && !isHidden ? (
        <ContactsPrompt onAllow={_requestPermission} onDeny={_onDeny} />
      ) : null}

      <SectionList
        sections={[userSection, contactSection] as any[]}
        keyboardShouldPersistTaps="always"
        keyboardDismissMode="interactive"
        windowSize={10}
        maxToRenderPerBatch={10}
        // make it render efficiently
        initialNumToRender={10}
        style={{
          flex: 1,
        }}
        contentContainerStyle={{
          paddingBottom: 100,
        }}
        refreshControl={
          <RefreshControl
            refreshing={refreshing}
            onRefresh={_onRefresh}
            tintColor={fullTheme.activityIndicator}
          />
        }
        ListEmptyComponent={
          loading && !hasResults ? (
            <View
              style={{
                flex: 1,
                justifyContent: "center",
                alignItems: "center",
                marginTop: 50,
              }}
            >
              <ActivityIndicator
                size="large"
                color={fullTheme.activityIndicator}
              />
            </View>
          ) : null
        }
        ListHeaderComponent={
          <>
            <View
              style={{
                flexDirection: "row",
                alignItems: "center",
                marginTop: 10,
                paddingHorizontal: 15,
                paddingBottom: 10,
              }}
            >
              <Text
                style={{
                  flex: 1,
                  fontFamily: "Inter-Medium",
                  fontSize: IS_IPAD ? 30 : 22,
                  color: header,
                }}
              >
                {hasResults ? "Results" : ""}
              </Text>

              {loading && hasResults && (
                <ActivityIndicator
                  size={IS_IPAD ? 30 : 24}
                  style={{
                    marginLeft: 10,
                  }}
                  color={fullTheme.activityIndicator}
                />
              )}
            </View>
            <Text
              style={{
                textAlign: "left",
                fontFamily: "Inter-Medium",
                color: fullTheme.text,
                fontSize: 16,
                paddingHorizontal: 15,
                paddingBottom: 20,
              }}
            >
              Invite your smartest friends to Pickup so you can see what they
              listen to 🧠
            </Text>
          </>
        }
      />
    </>
  );
};

const ContactsPrompt = ({
  onAllow,
  onDeny,
}: {
  onAllow: () => void;
  onDeny: () => void;
}) => {
  const { theme } = useTheme();

  return (
    <View style={[styles.container, {}]}>
      <View
        style={[
          styles.dialogBox,
          {
            width: 275,
            backgroundColor: theme === "dark" ? colors.gray80 : colors.gray95,
            borderColor: colors.gray70,
            borderWidth: 1,
          },
        ]}
      >
        <Text
          style={[
            styles.title,
            {
              fontFamily: "Inter-Semibold",
            },
          ]}
        >
          View Contacts
        </Text>

        <Text
          style={[
            styles.message,
            {
              fontFamily: "Inter-Regular",
              paddingBottom: 20,
            },
          ]}
        >
          We'll never text your contacts.
        </Text>

        <View
          style={{
            backgroundColor: colors.gray70,
            height: 1,
            width: "100%",
          }}
        />

        <View
          style={{
            display: "flex",
            flexDirection: "row",
          }}
        >
          <TouchableOpacity
            style={{
              flex: 1,
              padding: 13,
              alignItems: "center",
              borderRightColor: colors.gray70,
              borderRightWidth: 1,
            }}
            onPress={onDeny}
            activeOpacity={0.75}
          >
            <Text
              style={{
                color: "#007bff",
                fontSize: 16,
                fontFamily: "Inter-Regular",
              }}
            >
              No Thanks
            </Text>
          </TouchableOpacity>
          <TouchableOpacity
            activeOpacity={0.75}
            style={{
              flex: 1,
              padding: 13,
              alignItems: "center",
            }}
            onPress={onAllow}
          >
            <Text
              style={{
                color: "#007bff",
                fontSize: 16,
                fontFamily: "Inter-Semibold",
              }}
            >
              Yes, Enable
            </Text>
          </TouchableOpacity>
        </View>
      </View>
    </View>
  );
};

const styles = StyleSheet.create({
  container: {
    flex: 1,
    justifyContent: "center",
    alignItems: "center",
  },
  dialogBox: {
    width: "80%",
    backgroundColor: colors.gray80,
    borderRadius: 15,
    alignItems: "center",
  },
  title: {
    fontSize: 18,
    paddingTop: 25,
    fontWeight: "bold",
  },
  message: {
    fontSize: 14,
    padding: 10,
    textAlign: "center",
  },
  buttonContainer: {
    flexDirection: "row",
    borderTopColor: colors.gray60,
    borderTopWidth: 1,
  },
  button: {
    backgroundColor: "#007bff",
    padding: 10,
    borderRadius: 5,
    margin: 5,
  },
  buttonText: {
    color: "white",
    fontWeight: "bold",
  },
});
