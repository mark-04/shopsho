import Db from "./DBUtils";
import { StateManager } from "./StateManager";
import React from "react";
import { createRoot } from "react-dom/client";
import App from "./App";

async () => {
  const db = await Db.openDatabase();
  const state = await Db.getApplicationState(db);
  const stateManager = new StateManager(db, state);

  const rootNode = document.getElementById("root");

  if (rootNode)
    createRoot(rootNode).render(
      <App
        state={state}
        attachSelfToStateManager={stateManager.attachView}
      />
    );
}