import {
  View,
  Text,
  TouchableOpacity,
  SafeAreaView,
  FlatList,
  RefreshControl,
  Alert,
} from "react-native";
import React from "react";
import { useNavigation } from "@react-navigation/native";
import { useTheme } from "src/hooks";
import { useMutation, useQuery } from "@apollo/client";
import { api } from "src/api";
import { Query } from "src/api/generated/types";
import { NavigationProps } from "src/navigation";
import { BaseContentFields, BaseCourseFields } from "src/api/fragments";
import { colors } from "src/components";
import { FontAwesomeIcon } from "@fortawesome/react-native-fontawesome";
import {
  faArrowRight,
  faCar,
  faCarBolt,
  faPlay,
} from "@fortawesome/pro-solid-svg-icons";
import { Impressions } from "./Github";
import { ContentRow } from "./ContentRow";
import { LinearGradient } from "expo-linear-gradient";

const generateImpressionsData = () => {
  const impressions = [];
  for (let i = 0; i < 365; i++) {
    impressions.push({ completed: Math.random() > 0.5 });
  }
  return impressions;
};

const impressionsData = generateImpressionsData();

const Home = () => {
  const navigation = useNavigation<NavigationProps>();
  const theme = useTheme();

  const { data, refetch, error } = useQuery<Pick<Query, "getContentFeed">>(
    api.content.feed
  );

  const [startCourse] = useMutation(api.courses.start);

  const content = (data?.getContentFeed ?? []) as BaseContentFields[];

  const onRefresh = async () => {
    await refetch();
  };

  return (
    <SafeAreaView style={{ flex: 1 }}>
      <FlatList
        data={content}
        refreshControl={
          <RefreshControl
            tintColor={theme.activityIndicator}
            refreshing={false}
            onRefresh={onRefresh}
          />
        }
        keyExtractor={(c) => c.id}
        // hide scrollbar
        showsVerticalScrollIndicator={false}
        contentContainerStyle={{ padding: 5, paddingBottom: 150 }}
        ListHeaderComponent={
          <View>
            <View
              style={{
                paddingVertical: 25,
                paddingBottom: 15,
              }}
            >
              {/* <Impressions impressions={impressionsData} /> */}

              <View style={{ marginBottom: 10 }}>
                <Text
                  style={{
                    color: theme.header,
                    fontSize: 28,
                    paddingHorizontal: 10,
                    fontWeight: "bold",
                    fontFamily: "Raleway-Regular",
                  }}
                >
                  Discover
                </Text>
              </View>

              <Options />
            </View>
          </View>
        }
        renderItem={({ item: c }) => <ContentRow content={c} />}
      />

      {/* <CarMode content={content} /> */}
    </SafeAreaView>
  );
};

const SingleFilter = ({
  label,
  onPress,
  isActive,
}: {
  label: string;
  isActive: boolean;
  onPress: () => void;
}) => {
  const theme = useTheme();

  return (
    <TouchableOpacity
      onPress={onPress}
      activeOpacity={0.9}
      style={{ flexDirection: "row", padding: 10 }}
    >
      <Text
        style={{
          color: isActive ? theme.header : theme.text,
          fontFamily: isActive ? "Raleway-Bold" : "Raleway-Regular",
          fontSize: 18,
        }}
      >
        {label}
      </Text>
    </TouchableOpacity>
  );
};

export enum DiscoveryTab {
  All = "all",
  Unread = "unread",
  Popular = "popular",
}

const Options = () => {
  const theme = useTheme();
  const activeTab = DiscoveryTab.All;

  const onPress = () => {
    // TODO:
  };

  return (
    <View
      style={{
        display: "flex",
        flexDirection: "row",
        alignItems: "center",
      }}
    >
      <SingleFilter
        onPress={onPress}
        isActive={DiscoveryTab.All === activeTab}
        label="All"
      />
      <SingleFilter
        onPress={onPress}
        isActive={DiscoveryTab.Unread === activeTab}
        label="Unread"
      />
      <SingleFilter
        onPress={onPress}
        isActive={DiscoveryTab.Popular === activeTab}
        label="Popular"
      />
    </View>
  );
};

const CarMode = ({ content }: { content: BaseContentFields[] }) => {
  const theme = useTheme();
  const navigation = useNavigation<NavigationProps>();

  return (
    <LinearGradient
      style={{
        position: "absolute",
        bottom: 93,
        height: 50,
        display: "flex",
        justifyContent: "center",
        alignItems: "center",
        width: "100%",
        flexDirection: "row",
      }}
      colors={
        theme.theme === "dark"
          ? [colors.pink70, colors.primary, colors.pink70]
          : [colors.pink70, colors.primary, colors.pink70]
      }
      start={{ x: 0, y: 0 }}
      end={{ x: 1, y: 0 }}
    >
      <TouchableOpacity
        onPress={() => {
          // just go to the first content
          navigation.navigate("CarMode", {
            contentId: content[0].id,
            isCarMode: true,
          });
        }}
        style={{
          display: "flex",
          justifyContent: "center",
          alignItems: "center",
          width: "100%",
          flexDirection: "row",
        }}
        activeOpacity={1}
      >
        <Text
          style={{
            color: colors.white,
            fontFamily: "Raleway-SemiBold",
            textAlign: "center",
            fontSize: 18,
            fontWeight: "bold",
          }}
        >
          Car Mode
        </Text>

        <FontAwesomeIcon
          style={{ marginLeft: 10 }}
          icon={faCar}
          color={colors.white}
          size={20}
        />
      </TouchableOpacity>
    </LinearGradient>
  );
};

export default Home;
