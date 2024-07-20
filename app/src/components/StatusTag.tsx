import React, { CSSProperties } from "react";
import {
  Text,
  TextStyle,
  TouchableOpacity,
  View,
  ViewProps,
  ViewStyle,
} from "react-native";
import { Maybe } from "src/core";
import * as colors from "./colors";
import { useTheme } from "src/hooks/useTheme";

export type StatusTagType =
  | "info"
  | "success"
  | "warning"
  | "error"
  | "none"
  | "brown"
  | "beta"
  | "orange";

type Props = {
  type: StatusTagType;
  label?: string | JSX.Element;
  infoMessage?: string;
  infoIcon?: boolean;
  viewProps?: ViewProps;
  iconName?: string;
  className?: string;
  iconStyle?: CSSProperties;
  color?: string;
  copyValue?: Maybe<string>;
  labelStyle?: TextStyle;
  onPress?: (e?: any) => void | Promise<void>;
  rightIcon?: JSX.Element;
  infoPlacement?: "top" | "bottom";
  hasBorder?: boolean;
};

const TAG_TYPE_TO_COLOR: Record<StatusTagType, string> = {
  info: colors.lightBlue60,
  success: colors.green50,
  warning: colors.yellow10,
  error: colors.red50,
  none: colors.gray30,
  brown: colors.brown30,
  beta: colors.pink40,
  orange: colors.orange50,
};

const TAG_TYPE_TO_BG: Record<StatusTagType, string> = {
  info: colors.lightBlue100,
  success: colors.green100,
  warning: colors.yellow90,
  error: colors.red100,
  none: colors.gray90,
  brown: colors.brown90,
  beta: colors.pink90,
  orange: colors.orange100,
};

const TAG_TYPE_TO_BG_DARK_MODE: Record<StatusTagType, string> = {
  info: colors.lightBlue20,
  success: colors.green20,
  warning: "#A5820A",
  error: colors.red20,
  none: colors.gray20,
  brown: colors.brown20,
  beta: colors.pink10,
  orange: colors.orange10,
};

export default function StatusTag({
  label,
  type,
  infoMessage,
  infoIcon = false,
  viewProps,
  className,
  iconName,
  iconStyle,
  color: _color,
  copyValue = null,
  labelStyle,
  rightIcon,
  infoPlacement,
  onPress,
  hasBorder,
}: Props) {
  const { theme } = useTheme();
  const color = _color || TAG_TYPE_TO_COLOR[type];
  const bg =
    theme === "dark" ? TAG_TYPE_TO_BG_DARK_MODE[type] : TAG_TYPE_TO_BG[type];
  const hasLabel = !!label;

  const Tag = (
    <TouchableOpacity activeOpacity={0.75} onPress={onPress}>
      <View
        {...viewProps}
        style={{
          flexWrap: "nowrap",
          borderRadius: 7,
          alignSelf: "center",
          paddingVertical: 5,
          paddingHorizontal: 10,
          backgroundColor: bg,
          justifyContent: "center",
          alignItems: "center",
          borderColor: color,
          flexDirection: "row",
          ...viewProps?.style,
          // borderWidth: 1,
        }}
      >
        {!hasLabel ? null : typeof label === "string" ? (
          <Text
            style={[
              {
                borderWidth: 0,
                marginRight: rightIcon ? 5 : 0,
                fontSize: 12,
                textAlign: "center",
                fontFamily: "Mona-Sans-SemiBold",
                color,
              },
              labelStyle,
            ]}
          >
            {label}
          </Text>
        ) : (
          label
        )}

        {rightIcon}
      </View>
    </TouchableOpacity>
  );

  return Tag;
}
