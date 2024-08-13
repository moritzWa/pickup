import AsyncStorage from "@react-native-async-storage/async-storage";
import { useCallback, useMemo } from "react";
import { useDispatch, useSelector } from "react-redux";
import { colors } from "src/components";
import { IS_IPAD } from "src/config";
import { setTheme } from "src/redux/reducers/globalState";
import { ReduxState } from "src/redux/types";

export const useTheme = () => {
  const theme = useSelector((state: ReduxState) => state.global.theme);
  const dispatch = useDispatch();

  const _toggleDarkMode = useCallback(async () => {
    try {
      const newTheme = theme === "light" ? "dark" : "light";
      await AsyncStorage.setItem("theme", newTheme);
      dispatch(setTheme(newTheme));
    } catch (error) {
      console.log(error);
    }
  }, [theme]);

  const data = useMemo(
    () => ({
      bgPrimary: theme === "light" ? "#DFDCFB" : "#050129",
      background: theme === "light" ? colors.white : colors.black,
      medBackground: theme === "light" ? colors.gray90 : colors.gray05,
      blueBackground:
        theme === "light" ? colors.lightBlue100 : colors.lightBlue10,
      greenBackground: theme === "light" ? colors.green100 : colors.green10,
      secondaryBackground: theme === "light" ? "#F5F5F5" : "#292929",
      secondaryBackground2: theme === "light" ? colors.gray80 : colors.gray20,
      ternaryBackground:
        theme === "light"
          ? colors.bgLightNeutralTertiary
          : colors.bgDarkNeutralTertiary,
      darkerBackground: theme === "light" ? colors.gray50 : colors.gray50,
      secondaryButtonBackground:
        theme === "light" ? colors.gray85 : colors.gray10,
      header:
        theme === "light"
          ? colors.textLightNeutralPrimary
          : colors.textDarkNeutralPrimary,
      theme,
      activityIndicator: theme === "light" ? colors.gray60 : colors.gray50,
      textSecondary:
        theme === "light"
          ? colors.textLightNeutralSecondary
          : colors.textDarkNeutralSecondary,
      textSubtle:
        theme === "light"
          ? colors.textLightNeutralSubtle
          : colors.textDarkNeutralSubtle,
      textPrimary:
        theme === "light"
          ? colors.textLightNeutralPrimary
          : colors.textDarkNeutralPrimary,
      text: theme === "light" ? colors.gray30 : colors.gray60,
      placeholder: theme === "light" ? colors.gray60 : colors.gray30,
      border: theme === "light" ? colors.gray90 : colors.gray10,
      borderDark: theme === "light" ? colors.gray80 : colors.gray20,
      toggleDarkMode: _toggleDarkMode,
      fontSize: {
        text: IS_IPAD ? 22 : 16,
        header: IS_IPAD ? 30 : 22,
      },
    }),
    [theme, _toggleDarkMode]
  );

  return data;
};
