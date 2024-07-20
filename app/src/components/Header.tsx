import {
  View,
  Text,
  ViewProps,
  ViewStyle,
  TouchableOpacityProps,
} from "react-native";
import React from "react";
import { useSafeAreaInsets } from "react-native-safe-area-context";
import { colors } from ".";
import Back from "./Back";
import { useTheme } from "src/hooks/useTheme";
import { IS_ANDROID, IS_IPAD } from "src/config";

type HeaderProps = {
  title?: string | any;
  hasBackButton?: boolean;
  rightIcon?: any;
  leftIcon?: any;
  background?: string;
  borderWidth?: number;
  noInset?: boolean;
  containerStyle?: ViewStyle;
  backProps?: TouchableOpacityProps & { dontUseTheme?: boolean };
};

const Header = ({
  background: backgroundOverride,
  borderWidth: borderOverride,
  title,
  hasBackButton = false,
  noInset = false,
  rightIcon,
  leftIcon,
  containerStyle,
  backProps,
}: HeaderProps) => {
  const insets = useSafeAreaInsets();
  const { background, header, border } = useTheme();

  return (
    <View
      style={[
        {
          display: "flex",
          flexDirection: "row",
          backgroundColor: backgroundOverride || background,
          paddingTop: IS_ANDROID
            ? 20
            : IS_IPAD
            ? 25
            : noInset === true
            ? 0
            : insets.top,
          paddingVertical: IS_ANDROID ? 20 : IS_IPAD ? 25 : 10,
          paddingBottom: IS_ANDROID ? 20 : hasBackButton ? undefined : 15,
          paddingHorizontal: 10,
          borderBottomWidth: borderOverride ?? 1,
          borderBottomColor: border,
          justifyContent: "center",
          alignItems: "center",
        },
        containerStyle,
      ]}
    >
      <View style={{ flex: 2, alignItems: "flex-start" }}>
        {hasBackButton && <Back {...backProps} />}
        {leftIcon}
      </View>
      {typeof title === "string" ? (
        <Text
          style={{
            flex: 3,
            textAlign: "center",
            fontFamily: "Mona-Sans-SemiBold",
            fontSize: IS_IPAD ? 24 : 16,
            color: header,
          }}
        >
          {title}
        </Text>
      ) : (
        title
      )}
      <View
        style={{
          flex: 2,
          alignItems: "flex-end",
          justifyContent: "center",
          display: "flex",
        }}
      >
        {rightIcon}
      </View>
    </View>
  );
};

export default Header;
