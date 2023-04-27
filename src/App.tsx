//@ts-nocheck

import { ApplicationState, Model } from "./CoreTypes";
import { Component, createContext } from "react";
import MainSection from "./components/MainSection";

export const ModelContext = createContext({});

// `Props` are passed to the `App` component from a state manager.
// The state manager must be initialized before the `App` component.
// When components need to update their state, e.g. in response to user's actions, 
// they are not allowed to do so directly.
// Instead, they must notify a state manager about the action, performed
// by the user, by calling the appropriate method of a `model` object.   
// The model is a thin layer between the state manager and React components.
// It is exposed to all components by the state manager through the ModelContext. 
// When a component calls, e.g. `model.addList(...)` method, the rerendering
// of a new list may be delayed by the state manager until, e.g. this new list 
// record was successfully written to the IndexedDB; the rendering of the list 
// could also be calcelled altogether in case of e.g. a database related error,
// in which case a state manager will change the view state to render an error message.  
type Props = {
  state: ApplicationState,
  attachSelfToStateManager: ((triggerViewUpdate: (state: ApplicationState) => void) => Model)
}

export default class App extends Component {
  constructor(props: Props) {
    super(props);
    this.state = props.state;
    this.model = this.props.attachSelfToStateManager(this.setState.bind(this));
  }

  render = () => (
    <ModelContext.Provider value={this.model}>
      <MainSection shoppingLists={this.state.shoppingLists} />
    </ModelContext.Provider>
  )
}