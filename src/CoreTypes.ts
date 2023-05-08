import type { List, ListTy } from "./List"

export type dbid = number
export type uuid = string
export type tag = string

// Model object represents the actions 
// a user can perform while interacting with the app.
// These actions do not cover all possible state changes, 
// only those a user has control over (hence the name, `Model`, i.e. user's mental model).
export type Model = {
  addList: (list: ShoppingList) => Promise<void>,
  pinList: (listID: uuid) => Promise<void>,
  removeList: (listID: uuid) => Promise<void>,
  addTagsToList: (listID: uuid, tags: tag[]) => Promise<void>,
  removeTagsFromList: (listID: uuid, tags: tag[]) => Promise<void>,
  addListItem: (listID: uuid, listItem: ShoppingListItem) => Promise<void>,
  moveListItem: (listID: uuid, listItemID: uuid, nextSiblingID: uuid) => Promise<void>,
  removeListItem: (listID: uuid, listItemID: uuid) => Promise<void>,
  editListItem: (listID: uuid, listItemID: uuid, content: string) => Promise<void>,
  markListItemCompleted: (listID: uuid, listItemID: uuid) => Promise<void>,
  markListItemPending: (listID: uuid, listItemID: uuid) => Promise<void>,
}

// `ApplicationState` is passed to `React.useState(...)` hook.
// It is the only piece of state that we use for rendering.
// React components are not in controll of the state,  
// i.e. they never make `setState(...)` calls directly.
// All the state management is handled by the state manager.  
export type ApplicationState = {
  tags: tag[];
  query: ShoppingListQuery,
  shoppingLists: ListTy<ShoppingList>,
  isNetworkAvailable: boolean,
}

// Types for objects in IndexedDB's object stores
export type StateRecord = {
  id: dbid,
  tags: tag[],
  query: ShoppingListQuery,
  shoppingLists: ListTy<uuid>,
}
export type ShoppingListRecord =
  ShoppingList;

export type ShoppingListQuery = {
  tags?: tag[],
  searchTerm?: string,
}

export type ShoppingList = {
  id: uuid,
  tags: Array<tag>,
  isPinned: boolean,
  items: ListTy<ShoppingListItem>,
}

export type ShoppingListItem = {
  id: uuid,
  type: ShoppingListItemType,
  content: string,
  searchTermMatches: SearchTermMatchOffset[],
}

export type SearchTermMatchOffset = [number, number]

export enum ShoppingListItemType {
  Title = "title",
  PendingTask = "pendingTask",
  CompletedTask = "completedTask",
}