import React from "react";
import {
  ActivityIndicator,
  GestureResponderEvent,
  StyleProp,
  Text,
  TextProps,
  TextStyle,
  TouchableOpacity,
  TouchableOpacityProps,
  ViewStyle,
} from "react-native";
import { IS_IPAD } from "src/config";
import { useTheme } from "src/hooks/useTheme";

type ButtonProps = {
  label: string | JSX.Element;
  onPress: (event: GestureResponderEvent) => void;
  style?: StyleProp<ViewStyle>;
  labelStyle?: StyleProp<TextStyle>;
  activityColor?: string;
  activityStyle?: StyleProp<ViewStyle>;
  icon?: JSX.Element;
  iconPosition?: "left" | "right";
  textProps?: TextProps;
  loading?: boolean;
} & TouchableOpacityProps;

const Button = ({
  label,
  onPress,
  style,
  icon,
  iconPosition,
  textProps,
  activityStyle,
  loading,
  labelStyle,
  activityColor,
  ...other
}: ButtonProps) => {
  const [_isLoading, setLoading] = React.useState(false);
  const theme = useTheme();

  const _onPress = async (event: GestureResponderEvent) => {
    setLoading(true);
    try {
      await onPress(event);
    } catch (err) {
      throw err;
    } finally {
      setLoading(false);
    }
  };

  const isLoading = loading ?? _isLoading;

  return (
    <TouchableOpacity
      {...other}
      onPress={_onPress}
      style={[
        {
          height: 45,
          paddingHorizontal: 25,
          borderRadius: 10,
          backgroundColor: theme.header,
          alignItems: "center",
          marginBottom: 5,
          position: "relative",
          width: "100%",
          display: "flex",
          flexDirection: "row",
        },
        style,
      ]}
      activeOpacity={other.activeOpacity ?? 0.9}
      disabled={other.disabled ?? isLoading}
    >
      {isLoading ? (
        <ActivityIndicator
          color={activityColor ?? theme.background}
          size={16}
          style={{
            ...activityStyle,
            alignSelf: "center",
            justifyContent: "center",
            flex: 1,
            height: 20,
          }}
        />
      ) : (
        <>
          {iconPosition === "left" ? icon : null}

          {typeof label === "string" ? (
            <Text
              {...textProps}
              style={[
                {
                  color: theme.background,
                  textAlign: "center",
                  fontFamily: "Inter-Bold",
                  width: "100%",
                  fontSize: IS_IPAD ? 24 : 16,
                },
                textProps?.style,
                labelStyle,
              ]}
            >
              {label}
            </Text>
          ) : (
            label
          )}

          {iconPosition === "right" ? icon : null}
        </>
      )}
    </TouchableOpacity>
  );
};

export default Button;
