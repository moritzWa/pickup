import { faChevronLeft } from "@fortawesome/pro-solid-svg-icons";
import { FontAwesomeIcon } from "@fortawesome/react-native-fontawesome";
import { useNavigation } from "@react-navigation/native";
import React from "react";
import { Text, TouchableOpacity, TouchableOpacityProps } from "react-native";
import { IS_IPAD } from "src/config";
import { useTheme } from "src/hooks/useTheme";
import { colors } from ".";
import { NavigationProps } from "../navigation";

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
          zIndex: 1000,
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
            fontFamily: "Inter-Regular",
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
