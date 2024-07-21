import React from "react";
import {
  Image,
  ImageStyle,
  StyleProp,
  TextStyle,
  TouchableHighlight,
  View,
  ViewStyle,
} from "react-native";

import { Text } from "./Text";
import { useTheme } from "src/hooks/useTheme";
import { FontAwesomeIcon } from "@fortawesome/react-native-fontawesome";
import { faChevronRight } from "@fortawesome/pro-solid-svg-icons";

type Props = {
  name?: string;
  nameComponent?: any;
  nameStyle?: StyleProp<TextStyle>;
  valueStyle?: StyleProp<TextStyle>;
  style?: StyleProp<ViewStyle>;
  value?: string;
  valueComponent?: any;
  subtitle?: string;
  onPress?: any;
  imageComponent?: any;
  icon?: any;
  imageTintColor?: string;
  imageStyle?: StyleProp<ImageStyle>;
  showRightIcon?: boolean;
  rightComponent?: any;
  disablePress?: boolean;
  rightIcon?: any;
  containerStyle?: StyleProp<ImageStyle>;
  rightIconTintColor?: string;
  nameContainerStyle?: StyleProp<ViewStyle>;
};

const Section = ({
  name,
  nameComponent,
  nameStyle,
  value,
  style,
  valueComponent,
  onPress,
  imageComponent,
  imageTintColor,
  imageStyle,
  subtitle,
  showRightIcon = true,
  rightComponent,
  disablePress,
  rightIcon,
  valueStyle,
  containerStyle,
  rightIconTintColor,
  nameContainerStyle,
  icon,
}: Props) => {
  const { background, secondaryBackground, text, header } = useTheme();
  const underlay = secondaryBackground;

  return (
    <TouchableHighlight
      onPress={onPress}
      disabled={disablePress}
      underlayColor={underlay}
      style={[
        {
          paddingHorizontal: 30,
          paddingVertical: 15,
          backgroundColor: background,
          display: "flex",
          flexDirection: "row",
        },
        style,
      ]}
    >
      <View
        style={[
          {
            width: "100%",
            flexDirection: "row",
            display: "flex",
            alignItems: "center",
          },
          containerStyle,
        ]}
      >
        {icon ? icon : imageComponent}

        <View style={[{ flex: 1, marginHorizontal: 15 }, nameContainerStyle]}>
          {nameComponent || (
            <Text
              bold
              style={[
                {
                  fontSize: 14,
                  textAlign: "left",
                  fontFamily: "Mona-Sans-Regular",
                  color: header,
                },
                nameStyle,
              ]}
            >
              {name}
            </Text>
          )}

          {subtitle && (
            <Text style={{ marginTop: 5, color: text }}>{subtitle}</Text>
          )}
        </View>

        {valueComponent ||
          (value && (
            <Text
              style={[
                {
                  textAlign: "right",
                  fontSize: 14,
                  fontFamily: "Mona-Sans-Regular",
                  marginHorizontal: 15,
                  marginRight: 0,
                  flex: 1,
                  color: header,
                },
                valueStyle,
              ]}
            >
              {value}
            </Text>
          ))}

        {showRightIcon &&
          (rightIcon || (
            <FontAwesomeIcon
              style={{
                width: 15,
                height: 15,
                marginLeft: 10,
              }}
              color={rightIconTintColor || imageTintColor || text}
              icon={faChevronRight}
            />
          ))}

        {rightComponent}
      </View>
    </TouchableHighlight>
  );
};

export default React.memo(Section);
