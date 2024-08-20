import { View, Text, ScrollView, FlatList } from "react-native";
import React from "react";
import { useSelector } from "react-redux";
import { getQueue } from "src/redux/reducers/audio";
import { BaseContentFields } from "src/api/fragments";
import { FontAwesomeIcon } from "@fortawesome/react-native-fontawesome";
import { faHeadset } from "@fortawesome/pro-solid-svg-icons";
import { useTheme } from "src/hooks";
import FastImage from "react-native-fast-image";
import Header from "src/components/Header";
import Close from "src/components/Close";

const Queue = () => {
  const queue = useSelector(getQueue);
  const theme = useTheme();

  return (
    <View
      style={{
        paddingTop: 20,
      }}
    >
      <View style={{ zIndex: 100 }}>
        <Close />
      </View>

      <View style={{ marginTop: 15 }}>
        <FlatList
          data={queue}
          ListHeaderComponent={
            <Text
              style={{
                marginHorizontal: 15,
                fontFamily: "Raleway-Bold",
                fontSize: 24,
                marginTop: 5,
                marginBottom: 20,
                marginRight: 50,
                color: theme.header,
              }}
            >
              Your Queue
            </Text>
          }
          renderItem={({ item }) => <QueueRow content={item} />}
          keyExtractor={(item) => item.id}
          ListEmptyComponent={() => (
            <Text
              style={{
                textAlign: "center",
                fontSize: 22,
                color: theme.text,
                paddingVertical: 100,
                fontFamily: "Raleway-Medium",
              }}
            >
              Your queue is empty.
            </Text>
          )}
        />
      </View>
    </View>
  );
};

const QueueRow = ({ content }: { content: BaseContentFields }) => {
  const theme = useTheme();

  return (
    <View
      style={{
        display: "flex",
        padding: 15,
        borderWidth: 1,
        borderColor: theme.border,
        borderRadius: 15,
        marginHorizontal: 10,
        marginBottom: 10,
        flexDirection: "row",
        alignItems: "center",
      }}
    >
      <FastImage
        style={{
          width: 40,
          marginRight: 10,
          height: 40,
          borderRadius: 10,
        }}
        resizeMode="cover"
        source={{
          uri: content.thumbnailImageUrl,
        }}
      />

      <View style={{ flex: 1 }}>
        <Text
          numberOfLines={1}
          style={{
            color: theme.header,
            fontFamily: "Raleway-Bold",
            fontSize: 16,
            marginBottom: 5,
          }}
        >
          {content.title}
        </Text>

        <View
          style={{
            display: "flex",
            flexDirection: "row",
            alignItems: "center",
            justifyContent: "flex-start",
          }}
        >
          <FontAwesomeIcon
            icon={faHeadset}
            style={{
              color: theme.text,
            }}
          />

          <Text
            style={{
              marginLeft: 5,
              color: theme.text,
              fontFamily: "Raleway-Regular",
              fontSize: 16,
            }}
          >
            {Math.ceil(content.lengthSeconds / 60)}min
          </Text>
        </View>
      </View>
    </View>
  );
};

export default Queue;
