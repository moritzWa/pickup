import React from "react";
import { useMemo } from "react";
import { Image, Text, TouchableOpacity, View } from "react-native";
import { IS_IPAD } from "src/config";
import { useTheme } from "src/hooks/useTheme";
import Contacts from "react-native-contacts";
import { colors } from "src/components";
import ProfileIcon from "src/components/ProfileIcon";

export const ContactRow = React.memo(
  ({
    onSelectContact,
    contact,
  }: {
    contact: Contacts.Contact;
    onSelectContact: (contact: Contacts.Contact) => void;
  }) => {
    const theme = useTheme();

    const _onClick = () => {
      onSelectContact(contact);
    };

    const initials = useMemo(() => {
      const initials = contact.displayName || contact.givenName || "";
      return initials
        .split(" ")
        .map((word) => word[0])
        .join("")
        .toUpperCase();
    }, [contact]);

    return (
      <View
        style={{
          display: "flex",
          flexDirection: "row",
          backgroundColor: theme.background,
          paddingHorizontal: 15,
          paddingVertical: 15,
          // borderBottomWidth: 1,
          // borderBottomColor: theme.border,
        }}
      >
        <ProfileIcon
          initials={initials}
          profileImageUrl={contact.hasThumbnail ? contact.thumbnailPath : null}
        />

        <View style={{ flex: 1, marginLeft: 10 }}>
          <Text
            style={{
              fontFamily: "Raleway-SemiBold",
              fontSize: 16,
              marginBottom: 2,
              color: theme.textPrimary,
            }}
          >
            {contact.displayName || contact.givenName}
          </Text>
          <Text
            style={{
              fontFamily: "Raleway-Regular",
              fontSize: 14,
              color: theme.textSecondary,
            }}
          >
            {(contact.phoneNumbers ?? [])[0]?.number || "No phone"}
          </Text>
        </View>

        <TouchableOpacity
          style={{
            backgroundColor: theme.secondaryBackground,
            padding: 0,
            height: 40,
            paddingHorizontal: 15,
            display: "flex",
            flexDirection: "row",
            justifyContent: "center",
            borderRadius: 50,
            alignItems: "center",
          }}
          onPress={_onClick}
          activeOpacity={0.8}
        >
          <Text
            style={{
              color: theme.text,
              fontFamily: "Raleway-SemiBold",
              fontSize: 16,
            }}
          >
            Invite
          </Text>
        </TouchableOpacity>
      </View>
    );
  }
);
