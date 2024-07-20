import {
  View,
  Text,
  TouchableOpacity,
  Image,
  TouchableOpacityProps,
  Alert,
} from "react-native";
import React from "react";
import { useNavigation } from "@react-navigation/native";
import { NavigationProps } from "../navigation";
import { colors } from ".";
import { FontAwesomeIcon } from "@fortawesome/react-native-fontawesome";
import { faChevronLeft } from "@fortawesome/pro-solid-svg-icons";
import { useTheme } from "src/hooks/useTheme";
import { IS_IPAD } from "src/config";

const Back = ({
  hideBack,
  dontUseTheme = false,
  ...other
}: TouchableOpacityProps & {
  hideBack?: boolean;
  dontUseTheme?: boolean;
}) => {
  const navigate = useNavigation<NavigationProps>();
  const { header } = useTheme();

  const _onClose = () => {
    navigate.goBack();
  };

  const color = dontUseTheme ? colors.black : header;

  return (
    <TouchableOpacity
      {...other}
      onPress={_onClose}
      activeOpacity={other.activeOpacity ?? 0.75}
      style={[
        {
          // backgroundColor: background,
          display: "flex",
          flexDirection: "row",
          alignItems: "center",
          paddingVertical: 3,
          paddingHorizontal: 0,
          borderRadius: 10,
        },
        other.style,
      ]}
    >
      <FontAwesomeIcon
        icon={faChevronLeft}
        size={IS_IPAD ? 20 : 16}
        style={{}}
        color={color}
      />
      {hideBack ? null : (
        <Text
          style={{
            marginLeft: 5,
            fontSize: IS_IPAD ? 20 : 16,
            color: color,
          }}
        >
          Back
        </Text>
      )}
    </TouchableOpacity>
  );
};

export default Back;
