import {
  InteractionManager,
  Pressable,
  TextInput,
  View,
  Text,
  StyleSheet,
} from "react-native";
import React, { useEffect, useRef, useState } from "react";
import { useTheme } from "src/hooks/useTheme";
import { colors } from ".";

export const CELL_COUNT = 6;

const CodeInput = ({
  code,
  setCode,
  onComplete,
}: {
  code: string;
  setCode: (code: string) => void;
  onComplete: () => void;
}) => {
  const [containerIsFocused, setContainerIsFocused] = useState(false);

  const codeDigitsArray = new Array(CELL_COUNT).fill(0);
  const ref = useRef<TextInput>(null);

  const theme = useTheme();

  const styles = StyleSheet.create({
    container: {
      flex: 1,
      alignItems: "center",
      width: "100%",
    },
    inputsContainer: {
      width: "100%",
      flexDirection: "row",
      justifyContent: "space-between",
    },
    inputContainerFocused: {
      borderColor: colors.primary,
      backgroundColor: theme.secondaryBackground,
    },
    hiddenCodeInput: {
      position: "absolute",
      height: 0,
      width: 0,
      opacity: 0,
    },
    codeInputCellContainer: {
      height: 50,
      width: 50,
      backgroundColor: theme.secondaryBackground,
      borderRadius: 15,
      borderWidth: 2,
      borderColor: theme.secondaryBackground,
      justifyContent: "center",
      alignItems: "center",
    },
  });

  const toDigitInput = (_value: number, idx: number) => {
    const emptyInputChar = " ";
    const digit = code?.[idx] || emptyInputChar;

    const isCurrentDigit = idx === code?.length;
    const isLastDigit = idx === CELL_COUNT - 1;
    const isCodeFull = code?.length === CELL_COUNT;

    const isFocused = isCurrentDigit || (isLastDigit && isCodeFull);
    const containerStyle =
      containerIsFocused && isFocused
        ? [styles.codeInputCellContainer, styles.inputContainerFocused]
        : styles.codeInputCellContainer;
    return (
      <View key={idx} style={containerStyle}>
        <Text
          style={{
            fontSize: 22,
            color: theme.header,
            fontFamily: "Raleway-Expanded-SemiBold",
          }}
        >
          {digit}
        </Text>
      </View>
    );
  };

  const handleOnPress = () => {
    setContainerIsFocused(true);
    ref?.current?.focus();
  };

  const handleLongPress = () => {
    console.log("long pressed");
    setCode("12345");
  };

  const handleOnBlur = () => {
    setContainerIsFocused(false);
  };

  // Effects

  useEffect(() => {
    InteractionManager.runAfterInteractions(() => {
      setContainerIsFocused(true);
      ref?.current?.focus();
    });
  }, []);

  useEffect(() => {
    if ((code || "").length === CELL_COUNT) {
      onComplete();
    }
  }, [code]);

  return (
    <>
      <Text
        style={{
          fontSize: 14,
          textAlign: "left",
          width: "100%",
          marginBottom: 10,
          fontFamily: "Raleway-Semibold",
          color: theme.text,
        }}
      >
        Verification Code
      </Text>
      <View style={styles.container}>
        <Pressable
          onLongPress={handleLongPress}
          style={styles.inputsContainer}
          onPress={handleOnPress}
        >
          {codeDigitsArray.map(toDigitInput)}
        </Pressable>
        <TextInput
          ref={ref}
          value={code}
          onChangeText={setCode}
          onEndEditing={handleOnBlur}
          keyboardType="number-pad"
          returnKeyType="done"
          textContentType="oneTimeCode"
          maxLength={CELL_COUNT}
          style={styles.hiddenCodeInput}
        />
      </View>
    </>
  );
};

export default CodeInput;
