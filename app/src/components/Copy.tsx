import { faCopy } from "@fortawesome/pro-solid-svg-icons";
import {
  FontAwesomeIcon,
  FontAwesomeIconStyle,
} from "@fortawesome/react-native-fontawesome";
import React from "react";
import { View, Button, Alert, StyleProp } from "react-native";
import { TouchableOpacity } from "react-native-gesture-handler";
import Toast from "react-native-toast-message";
import { useTheme } from "src/hooks/useTheme";
import Clipboard from "@react-native-clipboard/clipboard";

type CopyButtonProps = {
  textToCopy: string;
  size?: number;
  iconStyle?: FontAwesomeIconStyle;
};

const Copy: React.FC<CopyButtonProps> = ({ textToCopy, size, iconStyle }) => {
  const { text, header, background } = useTheme();

  const copyToClipboard = () => {
    Clipboard.setString(textToCopy);
    Toast.show({
      type: "success",
      topOffset: 75,
      text1: "Copied to clipboard",
      position: "top",
    });
  };

  return (
    <TouchableOpacity
      onPress={copyToClipboard}
      style={{
        padding: 1,
      }}
    >
      <FontAwesomeIcon
        icon={faCopy}
        color={text}
        size={size}
        style={iconStyle}
      />
    </TouchableOpacity>
  );
};

export default Copy;
