import { difference, union } from "./ArrayUtils";
import { uuid, tag, ApplicationState, ShoppingList, ShoppingListItem, Model } from "./CoreTypes";
import Db from "./DBUtils";
import { cons, extractElt, project, removeElt } from "./List";

export class StateManager {
  db: IDBDatabase;
  state: ApplicationState;
  model: Model;
  triggerViewUpdate?: ((state: ApplicationState) => void);

  constructor(db: IDBDatabase, state: ApplicationState) {
    this.db = db;
    this.state = state;
    this.model = {
      //... 
    };
  }

  attachView = (triggerViewUpdate: (state: ApplicationState) => void): Model => {
    this.triggerViewUpdate = triggerViewUpdate;
    return this.model;
  }

  private addList = async (list: ShoppingList, triggerViewUpdate: (state: ApplicationState) => void): Promise<void> => {
    await Db.addList(this.db, list);
    this.state.query = {};

    if (this.triggerViewUpdate)
      triggerViewUpdate(this.state);
  }

  //TODO
}





//   async function pinList(listID: uuid, triggerViewUpdate: (state: ApplicationState) => void): Promise<void> {
//     await Db.pinList(db, listID);

//     const capturedList: { element?: ShoppingList } = {};
//     const restLists = extractElt((list) => list.id === listID, state.shoppingLists, capturedList);

//     if (!capturedList.element)
//       throw new Error(); // should never happen

//     const list = capturedList.element;
//     list.isPinned = true;
//     state.shoppingLists = cons(list, restLists);

//     triggerViewUpdate(state);
//   }

//   async function removeList(listID: uuid, triggerViewUpdate: (state: ApplicationState) => void): Promise<void> {
//     await Db.removeList(db, listID);

//     state.shoppingLists = removeElt((list) => list.id === listID, state.shoppingLists);
//     triggerViewUpdate(state);
//   }

//   async function addTagsToList(listID: uuid, tags: tag[], triggerViewUpdate: (state: ApplicationState) => void) {
//     await Db.addTagsToList(db, listID, tags);

//     state.tags = union(state.tags, tags);
//     state.shoppingLists = project(
//       (list) => list.id === listID,
//       (list) => (list.tags = union(list.tags, tags), list),
//       state.shoppingLists
//     );
//     triggerViewUpdate(state);
//   }

//   async function removeTagsFromList(listID: uuid, tags: tag[], triggerViewUpdate: (state: ApplicationState) => void) {
//     await Db.removeTagsFromList(db, listID, tags);

//     state.tags = difference(state.tags, tags);
//     state.shoppingLists = project(
//       (list) => list.id === listID,
//       (list) => (list.tags = difference(list.tags, tags), list),
//       state.shoppingLists
//     );
//     triggerViewUpdate(state);
//   }

//   async function addListItem(listID: uuid, listItem: ShoppingListItem): Promise<void> {
//     await Db.addListItem(db, listID, listItem);
