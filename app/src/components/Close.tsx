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
} from "react-native";
import React from "react";
import { IS_IPAD } from "src/config";
import { useTheme } from "src/hooks/useTheme";
import { FontAwesomeIcon } from "@fortawesome/react-native-fontawesome";
import { faTimes } from "@fortawesome/pro-solid-svg-icons";
import { useNavigation } from "@react-navigation/native";

type ButtonProps = {
  onPress?: (event: GestureResponderEvent) => void;
} & TouchableOpacityProps;

const Close = ({ onPress, ...other }: ButtonProps) => {
  const theme = useTheme();
  const navigation = useNavigation();

  const _onPress = async (_event: GestureResponderEvent) => {
    navigation.goBack();
  };

  return (
    <TouchableOpacity
      {...other}
      onPress={onPress ?? _onPress}
      style={[
        {
          borderRadius: 100,
          width: 40,
          height: 40,
          backgroundColor: theme.secondaryBackground,
          alignItems: "center",
          justifyContent: "center",
          position: "absolute",
          top: 0,
          right: 15,
          marginBottom: 5,
          display: "flex",
          flexDirection: "row",
        },
        other.style,
      ]}
      activeOpacity={other.activeOpacity ?? 0.9}
      disabled={other.disabled}
    >
      <FontAwesomeIcon color={theme.textSecondary} size={20} icon={faTimes} />
    </TouchableOpacity>
  );
};

export default Close;
