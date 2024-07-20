import BigNumber from "bignumber.js";
import numbro from "numbro";
import React, { useState, useEffect, useRef } from "react";
import { Animated, Text, TextStyle, View } from "react-native";
import { D } from "src/utils/helpers";

const AnimatedNumber = ({
  valueCents,
  style,
}: {
  valueCents: number;
  style: TextStyle;
}) => {
  const animatedValue = useRef(new Animated.Value(valueCents)).current;
  const [displayValue, setDisplayValue] = useState(0);

  useEffect(() => {
    Animated.timing(animatedValue, {
      toValue: valueCents,
      duration: 500,
      useNativeDriver: true,
    }).start();

    const listenerId = animatedValue.addListener((v) => {
      setDisplayValue(v.value);
    });

    return () => {
      animatedValue.removeListener(listenerId);
    };
  }, [valueCents, animatedValue]);

  if (!valueCents) {
    return (
      <View>
        <Text style={style}>$0.00</Text>
      </View>
    );
  }

  return (
    <View>
      <Text style={style}>{getValueFormatted(displayValue)}</Text>
    </View>
  );
};

export const getValueFormatted = (valueCents: number) => {
  const { value, isSmallNumber } = getValue(valueCents);
  if (isSmallNumber) return `$${numbro(value).format("0,0.[00000000]")}`;
  return D(value * 100).toFormat("$0,0.00");
};

export const getValue = (valueCents: number) => {
  const isSmallNumber = new BigNumber(valueCents).lte(110);

  const value = isSmallNumber
    ? parseFloat(numbro(valueCents).divide(100).format("0,0.[00000000]"))
    : D(valueCents).toUnit();

  return { value, isSmallNumber };
};

export default AnimatedNumber;
