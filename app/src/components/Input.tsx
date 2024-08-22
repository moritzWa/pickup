import React from "react";
import {
  StyleSheet,
  Text,
  TextInput,
  TextInputProps,
  View,
} from "react-native";
import { useTheme } from "src/hooks/useTheme";
import * as colors from "./colors";

type InputProps = {
  placeholder?: string;
  label?: string | JSX.Element;
  onChangeText?: (text: string) => void;
  value?: string;
  leftComponent?: any;
  ref?: React.LegacyRef<TextInput>;
  subtitle?: string;
  required?: boolean;
  errorMessage?: string;
  containerStyle?: any;
} & TextInputProps;

const Input = ({
  placeholder,
  label,
  onChangeText,
  value,
  leftComponent,
  required,
  subtitle,
  errorMessage,
  containerStyle,
  ...other
}: InputProps) => {
  const {
    secondaryBackground,
    textSecondary,
    textSubtle,
    ternaryBackground,
    header,
    textPrimary,
    text,
  } = useTheme();

  return (
    <View style={[styles.container, containerStyle]}>
      {typeof label === "string" ? (
        <Text
          style={{
            fontSize: 14,
            marginBottom: 5,
            fontFamily: "Inter-Medium",
            color: textPrimary,
          }}
        >
          {label} {required && <Text style={{ color: colors.red50 }}>*</Text>}
        </Text>
      ) : (
        label || null
      )}

      {subtitle && (
        <Text
          style={{
            fontSize: 12,
            marginBottom: 5,
            fontFamily: "Inter-Regular",
            color: textSecondary,
          }}
        >
          {subtitle}
        </Text>
      )}

      <View
        style={{ display: "flex", flexDirection: "row", alignItems: "center" }}
      >
        {leftComponent}
        <TextInput
          {...other}
          placeholderTextColor={textSubtle}
          style={[
            styles.input,
            {
              flex: 1,
              backgroundColor: secondaryBackground,
              color: header,
              borderColor: secondaryBackground,
            },
            other.style,
          ]}
          placeholder={placeholder}
          onChangeText={onChangeText}
          value={value}
        />
      </View>

      {errorMessage && (
        <Text
          style={{
            fontSize: 12,
            marginTop: 5,
            color: colors.red50,
            fontFamily: "Inter-Regular",
          }}
        >
          {errorMessage}
        </Text>
      )}
    </View>
  );
};

const styles = StyleSheet.create({
  container: {
    marginVertical: 10,
    width: "100%",
  },
  input: {
    backgroundColor: "white",
    borderRadius: 15,
    padding: 12,
    fontSize: 16,
    borderWidth: 2,
    borderColor: colors.gray80,
  },
});

export { Input };
