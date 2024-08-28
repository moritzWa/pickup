import React from "react";
import { StyleSheet, View, Linking } from "react-native";
import { WebView } from "react-native-webview";
import { useNavigation } from "@react-navigation/native";

const InternalBrowser = ({ route }: { route: any }) => {
  const { url } = route.params;
  const navigation = useNavigation();

  const handleWebViewError = (syntheticEvent: any) => {
    const { nativeEvent } = syntheticEvent;
    if (
      nativeEvent.domain === "NSURLErrorDomain" &&
      nativeEvent.code === -1022
    ) {
      Linking.openURL(url);
      navigation.goBack();
    }
  };

  return (
    <View style={styles.container}>
      <WebView
        source={{ uri: url }}
        allowsBackForwardNavigationGestures
        onError={handleWebViewError}
      />
    </View>
  );
};

const styles = StyleSheet.create({
  container: {
    flex: 1,
    marginTop: 70,
  },
});

export default InternalBrowser;
