import { FirebaseOptions, initializeApp } from "firebase/app";
import auth from "@react-native-firebase/auth";
import storage from "@react-native-firebase/storage";
import { Alert } from "react-native";

export { auth, storage };

const ASSETS_ROOT_URL = "https://firebasestorage.googleapis.com/";

export async function getAuthToken(): Promise<string | null> {
  return new Promise((resolve, reject) => {
    const currentUser = auth().currentUser;

    if (currentUser) {
      currentUser.getIdToken().then(resolve).catch(reject);
    } else {
      return resolve(null);
    }
  });
}

export const getFirebaseCDNUrl = (url: string): string => {
  // if (url.includes(ASSETS_ROOT_URL)) {
  //   // split by the last "." and add _200x200 to the name
  //   const path = url.split(".");
  //   const extension = path.pop();
  //   const name = path.join(".");
  //   const imageUrl = `${name}_200x200.${extension}`;

  //   // Alert.alert(imageUrl);
  //   return imageUrl;
  // }

  // for now we dont do anything

  return url;
};

export const __getPngImage = (img: string) => {
  if (!img) return "";
  return img.replace(".svg", ".png");
};
