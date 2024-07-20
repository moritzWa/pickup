import { configureStore } from "@reduxjs/toolkit";
import logger from "redux-logger";

import { reducers } from "./reducers/reducers";
import { constants } from "src/config";
import { hasValue } from "src/core";

const middleware = [constants.redux.logger ? logger : null].filter(hasValue);

export const store = configureStore({
  reducer: reducers,
  middleware: (getDefaultMiddleware) =>
    getDefaultMiddleware().concat(...middleware),
});
