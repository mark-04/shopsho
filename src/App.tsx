import React, { createContext, useState } from "react";
import { JsxElement } from "typescript";
import { ApplicationState, Model } from "./CoreTypes";

const ModelContext = createContext({});

export default function App(
  state: ApplicationState,
  attachSelfToStateManager: ((setState: (state: ApplicationState) => void) => Model)
) {
  const [, setViewState] = useState(state);
  const model = attachSelfToStateManager(setViewState);

  return (
    <ModelContext.Provider value={model}>
      <>...</>
    </ModelContext.Provider>
  )
}

