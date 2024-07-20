import AsyncStorage from "@react-native-async-storage/async-storage";
import axios from "axios";
import { constants } from "src/config";
import { getAuthToken } from "src/utils/firebase";

const client = axios.create({
  baseURL: constants.apiUrl,
});

client.interceptors.request.use(async (config): Promise<any> => {
  const token = await getAuthToken();

  // console.log(didToken);
  // return the headers to the context so httpLink can read them
  return {
    headers: {
      ...config.headers,
      Authorization: token ? `Bearer ${token}` : "",
      //   ...(xUserEmail ? { "x-user-email": xUserEmail } : {}),
    },
  };
});

export { client };
