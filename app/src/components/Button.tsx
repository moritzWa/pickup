import {
  View,
  TouchableOpacity,
  GestureResponderEvent,
  StyleProp,
  ViewStyle,
  TouchableOpacityProps,
  TextProps,
  ActivityIndicator,
  Text,
  TextStyle,
} from "react-native";
import React from "react";
import * as colors from "./colors";
import { IS_IPAD } from "src/config";
import { useTheme } from "src/hooks/useTheme";

type ButtonProps = {
  label: string | JSX.Element;
  onPress: (event: GestureResponderEvent) => void;
  style?: StyleProp<ViewStyle>;
  labelStyle?: StyleProp<TextStyle>;
  icon?: JSX.Element;
  textProps?: TextProps;
  loading?: boolean;
} & TouchableOpacityProps;

const Button = ({
  label,
  onPress,
  style,
  icon,
  textProps,
  loading,
  labelStyle,
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
          borderRadius: 15,
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
          color={theme.background}
          size={16}
          style={{
            alignSelf: "center",
            justifyContent: "center",
            flex: 1,
            height: 20,
          }}
        />
      ) : (
        <>
          {typeof label === "string" ? (
            <Text
              {...textProps}
              style={[
                {
                  color: theme.background,
                  textAlign: "center",
                  fontFamily: "Raleway-Semibold",
                  width: "100%",
                  fontSize: IS_IPAD ? 24 : 18,
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

          {icon}
        </>
      )}
    </TouchableOpacity>
  );
};

export default Button;
