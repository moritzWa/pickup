import { View, Text, ScrollView } from "react-native";
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

  return (
    <ScrollView
      style={{
        paddingTop: 20,
      }}
    >
      <View>
        <Close />
      </View>

      <Text
        style={{
          marginHorizontal: 15,
          fontFamily: "Raleway-Bold",
          fontSize: 24,
          marginTop: 5,
          marginBottom: 20,
          marginRight: 50,
        }}
      >
        Your Queue
      </Text>

      <View style={{ marginTop: 15 }}>
        {queue.map((queue) => (
          <QueueRow key={queue.id} content={queue} />
        ))}
      </View>
    </ScrollView>
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
        resizeMode="contain"
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
