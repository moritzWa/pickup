import { combineReducers } from "@reduxjs/toolkit";
import { ReducerWithInitialState } from "@reduxjs/toolkit/dist/createReducer";
import { ReduxState } from "../types";

// reducers
import { userReducer } from "./user";
import { globalStateReducer } from "./globalState";

const allReducers: Record<keyof ReduxState, ReducerWithInitialState<any>> = {
  user: userReducer,
  global: globalStateReducer,
};

export const reducers = combineReducers(allReducers);
