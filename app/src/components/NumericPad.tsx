import React, { useEffect, useState } from "react";
import { Text, TouchableOpacity, View, StyleSheet, Alert } from "react-native";
import * as Haptics from "expo-haptics";
import { set } from "lodash";
import BigNumber from "bignumber.js";
import numbro from "numbro";

const ButtonItem = ({
  activeOpacity,
  onButtonPress,
  buttonSize = 60,
  text,
  customComponent,
  customViewStyle,
  accessible,
  accessibilityLabel,
  disabled,
  customTextStyle,
}: {
  activeOpacity: number;
  onButtonPress: () => void;
  buttonSize: number;
  text?: string;
  customComponent?: React.ReactNode;
  customViewStyle?: any;
  accessible: boolean;
  accessibilityLabel?: string;
  disabled: boolean;
  customTextStyle?: any;
}) => {
  return (
    <TouchableOpacity
      accessible={accessible}
      accessibilityRole="keyboardkey"
      accessibilityLabel={
        customComponent !== undefined ? accessibilityLabel : text
      }
      activeOpacity={activeOpacity}
      disabled={disabled}
      style={NumpadStyle.buttonContainer}
      onPress={onButtonPress}
    >
      <View
        style={[
          NumpadStyle.buttonView,
          {
            width: buttonSize,
            height: buttonSize,
            borderRadius: buttonSize / 2,
          },
          customViewStyle,
        ]}
      >
        {customComponent || (
          <Text style={[NumpadStyle.buttonText, customTextStyle]}>{text}</Text>
        )}
      </View>
    </TouchableOpacity>
  );
};

const ViewHolder = () => {
  return <View style={NumpadStyle.buttonContainer} />;
};

const NumericPad = React.forwardRef(
  (
    {
      amount,
      numLength,
      allowDecimal,
      onValueChange,
      buttonTextByKey,
      accessible,
      style,
      activeOpacity,
      buttonSize,
      buttonItemStyle,
      buttonAreaStyle,
      buttonTextStyle,
      numericDisabled,
      rightBottomButton,
      rightBottomButtonDisabled,
      rightBottomButtonSize = 60,
      rightBottomAccessibilityLabel,
      rightBottomButtonItemStyle,
      onRightBottomButtonPress,
    }: {
      numLength?: number;
      amount: string | null;
      allowDecimal?: boolean;
      onValueChange?: (value: string) => void;
      buttonTextByKey?: {
        one: string;
        two: string;
        three: string;
        four: string;
        five: string;
        six: string;
        seven: string;
        eight: string;
        nine: string;
        dot: string;
        zero: string;
      };
      accessible?: boolean;
      style?: any;
      activeOpacity?: number;
      buttonSize?: number;
      buttonItemStyle?: any;
      buttonAreaStyle?: any;
      buttonTextStyle?: any;
      numericDisabled?: boolean;
      rightBottomButton?: React.ReactNode;
      rightBottomButtonDisabled?: boolean;
      rightBottomButtonSize?: number;
      rightBottomAccessibilityLabel?: string;
      rightBottomButtonItemStyle?: any;
      onRightBottomButtonPress?: (key: string) => void;
    },
    ref: any
  ) => {
    const [input, setInput] = useState(amount || "");
    ref.current = {
      clear: () => {
        if (input.length > 0) {
          setInput(input.slice(0, -1));
        }
      },
      clearAll: () => {
        if (input.length > 0) {
          setInput("");
        }
      },
    };

    useEffect(() => {
      if (amount === null) {
        setInput("");
      }
    }, [amount]);

    const onButtonPressHandle = (key: any, value: any) => {
      // only 1 dot

      if (
        input && // so we allow starting with a .
        key === "dot" &&
        input.includes(".")
      ) {
        console.log("exiting 1: ", input);
        return;
        // don't allow it to add multiple dots
      }

      if (
        input.includes(".") &&
        input.substring(input.indexOf(".")).length === 10
      ) {
        console.log("exiting 2");
        return;
      }

      const parsedInput = new BigNumber((input || "").replace(/,/g, ""));

      // if starts with ".", add the number after it
      if ((!input || parsedInput.isNaN()) && key === "dot") {
        setInput("0" + value);
        return;
      }

      if ((!input || parsedInput.isNaN()) && value) {
        setInput(value);
        return;
      }

      // 2 digits after the dot
      if (input.length < numLength) {
        // make sure the input isn't nan
        if (parsedInput.isNaN()) {
          setInput("");
          return;
        }

        setInput(input + "" + value);
        Haptics.impactAsync(Haptics.ImpactFeedbackStyle.Light);
      }
    };

    useEffect(() => {
      if (onValueChange !== undefined) {
        // Alert.alert("input: " + input);

        onValueChange(input);
      }
    }, [input]);

    return (
      <View style={[NumpadStyle.container, style]}>
        <View style={[NumpadStyle.buttonAreaContainer, buttonAreaStyle]}>
          <ButtonItem
            disabled={numericDisabled}
            accessible={accessible}
            activeOpacity={activeOpacity}
            onButtonPress={() => onButtonPressHandle("one", "1")}
            buttonSize={buttonSize}
            text={buttonTextByKey.one}
            customTextStyle={buttonTextStyle}
            customViewStyle={buttonItemStyle}
          />
          <ButtonItem
            disabled={numericDisabled}
            accessible={accessible}
            activeOpacity={activeOpacity}
            onButtonPress={() => onButtonPressHandle("two", "2")}
            buttonSize={buttonSize}
            text={buttonTextByKey.two}
            customTextStyle={buttonTextStyle}
            customViewStyle={buttonItemStyle}
          />
          <ButtonItem
            disabled={numericDisabled}
            accessible={accessible}
            activeOpacity={activeOpacity}
            onButtonPress={() => onButtonPressHandle("three", "3")}
            buttonSize={buttonSize}
            text={buttonTextByKey.three}
            customTextStyle={buttonTextStyle}
            customViewStyle={buttonItemStyle}
          />
          <ButtonItem
            disabled={numericDisabled}
            accessible={accessible}
            activeOpacity={activeOpacity}
            onButtonPress={() => onButtonPressHandle("four", "4")}
            buttonSize={buttonSize}
            text={buttonTextByKey.four}
            customTextStyle={buttonTextStyle}
            customViewStyle={buttonItemStyle}
          />
          <ButtonItem
            disabled={numericDisabled}
            accessible={accessible}
            activeOpacity={activeOpacity}
            onButtonPress={() => onButtonPressHandle("five", "5")}
            buttonSize={buttonSize}
            text={buttonTextByKey.five}
            customTextStyle={buttonTextStyle}
            customViewStyle={buttonItemStyle}
          />
          <ButtonItem
            disabled={numericDisabled}
            accessible={accessible}
            activeOpacity={activeOpacity}
            onButtonPress={() => onButtonPressHandle("six", "6")}
            buttonSize={buttonSize}
            text={buttonTextByKey.six}
            customTextStyle={buttonTextStyle}
            customViewStyle={buttonItemStyle}
          />
          <ButtonItem
            disabled={numericDisabled}
            accessible={accessible}
            activeOpacity={activeOpacity}
            onButtonPress={() => onButtonPressHandle("seven", "7")}
            buttonSize={buttonSize}
            text={buttonTextByKey.seven}
            customTextStyle={buttonTextStyle}
            customViewStyle={buttonItemStyle}
          />
          <ButtonItem
            disabled={numericDisabled}
            accessible={accessible}
            activeOpacity={activeOpacity}
            onButtonPress={() => onButtonPressHandle("eight", "8")}
            buttonSize={buttonSize}
            text={buttonTextByKey.eight}
            customTextStyle={buttonTextStyle}
            customViewStyle={buttonItemStyle}
          />
          <ButtonItem
            disabled={numericDisabled}
            accessible={accessible}
            activeOpacity={activeOpacity}
            onButtonPress={() => onButtonPressHandle("nine", "9")}
            buttonSize={buttonSize}
            text={buttonTextByKey.nine}
            customTextStyle={buttonTextStyle}
            customViewStyle={buttonItemStyle}
          />
          {allowDecimal ? (
            <ButtonItem
              disabled={numericDisabled}
              accessible={accessible}
              activeOpacity={activeOpacity}
              onButtonPress={() => onButtonPressHandle("dot", ".")}
              buttonSize={buttonSize}
              text={buttonTextByKey.dot}
              customTextStyle={buttonTextStyle}
              customViewStyle={buttonItemStyle}
            />
          ) : (
            <ViewHolder />
          )}
          <ButtonItem
            disabled={numericDisabled}
            accessible={accessible}
            activeOpacity={activeOpacity}
            onButtonPress={() => onButtonPressHandle("zero", "0")}
            buttonSize={buttonSize}
            text={buttonTextByKey.zero}
            customTextStyle={buttonTextStyle}
            customViewStyle={buttonItemStyle}
          />
          {rightBottomButton !== undefined ? (
            <ButtonItem
              disabled={rightBottomButtonDisabled}
              accessible={accessible}
              activeOpacity={activeOpacity}
              accessibilityLabel={rightBottomAccessibilityLabel}
              onButtonPress={() => {
                onRightBottomButtonPress("right_bottom");
                // this is hacky but we need it bc the "sell all" fills in the input amount

                if (amount) {
                  const rawAmount = amount.replace(/,/g, "").slice(0, -1);
                  const newAmount = new BigNumber(rawAmount);

                  // if (newAmount.isNaN()) {
                  //   setInput("");
                  //   return;
                  // }

                  const format = numbro(newAmount.toNumber()).format(
                    "0,0.[000000]"
                  );

                  setInput(format);
                  return;
                }
              }}
              customViewStyle={rightBottomButtonItemStyle}
              customComponent={rightBottomButton}
              buttonSize={rightBottomButtonSize}
            />
          ) : (
            <ViewHolder />
          )}
        </View>
      </View>
    );
  }
);

NumericPad.defaultProps = {
  buttonTextByKey: {
    one: "1",
    two: "2",
    three: "3",
    four: "4",
    five: "5",
    six: "6",
    seven: "7",
    eight: "8",
    nine: "9",
    dot: ".",
    zero: "0",
  },
  accessible: false,
  onButtonPress: () => {},
  onRightButtonPress: () => {},
  style: { paddingVertical: 12 },
  activeOpacity: 0.9,
  buttonTextStyle: { color: "#000", fontSize: 30, fontWeight: "400" },
  rightBottomAccessibilityLabel: "right_bottom",
  numericDisabled: false,
  rightBottomButtonDisabled: false,
  allowDecimal: true,
};

const NumpadStyle = StyleSheet.create({
  container: {
    alignItems: "center",
  },
  buttonAreaContainer: {
    alignItems: "center",
    alignContent: "center",
    flexDirection: "row",
    flexWrap: "wrap",
  },
  buttonContainer: {
    marginBottom: 12,
    width: "33%",
    alignItems: "center",
    justifyContent: "center",
  },
  buttonView: {
    textAlign: "center",
    alignItems: "center",
    justifyContent: "center",
  },
  buttonText: {
    color: "#000",
    fontSize: 22,
    fontWeight: "bold",
  },
});

export default NumericPad;
