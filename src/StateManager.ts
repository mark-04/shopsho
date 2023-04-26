import {
  difference, union
} from "./ArrayUtils";

import {
  uuid, tag,
  ApplicationState,
  ShoppingList,
  ShoppingListItem,
  ShoppingListItemType,
  Model
} from "./CoreTypes";

import Db from "./DBUtils";

import {
  append, cons, moveEltBefore, project, removeElt
} from "./List";

export class StateManager {
  db: IDBDatabase;
  state: ApplicationState;
  notifyOnStateChange?: ((state: ApplicationState) => void);

  constructor(db: IDBDatabase, state: ApplicationState) {
    this.db = db;
    this.state = state;
  }

  public attachView = (notifyOnStateChange: (state: ApplicationState) => void): Model => {
    this.notifyOnStateChange = notifyOnStateChange;
    return {
      addList: this.addList,
      pinList: this.pinList,
      removeList: this.removeList,
      addTagsToList: this.addTagsToList,
      removeTagsFromList: this.removeTagsFromList,
      addListItem: this.addListItem,
      moveListItem: this.moveListItem,
      removeListItem: this.removeListItem,
      editListItem: this.editListItem,
      markListItemCompleted: this.markListItemCompleted,
      markListItemPending: this.markListItemPending,
    }
  }

  private addList = async (list: ShoppingList): Promise<void> => {
    await Db.addList(this.db, list);

    this.state.shoppingLists = append(list, this.state.shoppingLists);
    this.state.query = {};

    if (this.notifyOnStateChange) {
      this.notifyOnStateChange(this.state);
    }
  }

  private pinList = async (listID: uuid): Promise<void> => {
    await Db.pinList(this.db, listID);

    const list = removeElt(l => l.id === listID, this.state.shoppingLists);
    list.isPinned = true;
    this.state.shoppingLists = cons(list, this.state.shoppingLists);

    if (this.notifyOnStateChange) {
      this.notifyOnStateChange(this.state);
    }
  }

  private removeList = async (listID: uuid): Promise<void> => {
    await Db.removeList(this.db, listID);

    removeElt(l => l.id === listID, this.state.shoppingLists);

    if (this.notifyOnStateChange) {
      this.notifyOnStateChange(this.state);
    }
  }

  private addTagsToList = async (listID: uuid, tags: tag[]): Promise<void> => {
    await Db.addTagsToList(this.db, listID, tags);

    this.state.tags = union(this.state.tags, tags);

    project(
      l => l.id === listID,
      l => (l.tags = union(l.tags, tags), l),
      this.state.shoppingLists
    );

    if (this.notifyOnStateChange) {
      this.notifyOnStateChange(this.state);
    }
  }

  private removeTagsFromList = async (listID: uuid, tags: tag[]): Promise<void> => {
    await Db.removeTagsFromList(this.db, listID, tags);

    this.state.tags = difference(this.state.tags, tags);

    project(
      l => l.id === listID,
      l => (l.tags = difference(l.tags, tags), l),
      this.state.shoppingLists
    );

    if (this.notifyOnStateChange) {
      this.notifyOnStateChange(this.state);
    }
  }

  private addListItem = async (listID: uuid, listItem: ShoppingListItem): Promise<void> => {
    await Db.addListItem(this.db, listID, listItem);

    project(
      l => l.id === listID,
      l => (l.items = append(listItem, l.items), l),
      this.state.shoppingLists
    );

    if (this.notifyOnStateChange) {
      this.notifyOnStateChange(this.state);
    }
  }

  private moveListItem = async (listID: uuid, listItemID: uuid, nextSiblingID: uuid): Promise<void> => {
    await Db.moveListItem(this.db, listID, listItemID, nextSiblingID);

    project(
      l => l.id === listID,
      l => (l.items = moveEltBefore(i => i.id === listItemID, s => s.id === nextSiblingID, l.items), l),
      this.state.shoppingLists
    );

    if (this.notifyOnStateChange) {
      this.notifyOnStateChange(this.state);
    }
  }

  private removeListItem = async (listID: uuid, listItemID: uuid): Promise<void> => {
    await Db.removeListItem(this.db, listID, listItemID);

    project(
      l => l.id === listID,
      l => (removeElt(i => i.id === listItemID, l.items), l),
      this.state.shoppingLists
    );

    if (this.notifyOnStateChange) {
      this.notifyOnStateChange(this.state);
    }
  }

  private editListItem = async (listID: uuid, listItemID: uuid, content: string): Promise<void> => {
    await Db.editListItem(this.db, listID, listItemID, content);

    project(
      l => l.id === listID,
      l => (project(i => i.id === listItemID, i => (i.content = content, i), l.items), l),
      this.state.shoppingLists
    );

    if (this.notifyOnStateChange) {
      this.notifyOnStateChange(this.state);
    }
  }

  private markListItemCompleted = async (listID: uuid, listItemID: uuid): Promise<void> => {
    await Db.markListItemCompleted(this.db, listID, listItemID);

    const type = ShoppingListItemType.CompletedTask;
    project(
      l => l.id === listID,
      l => (project(i => i.id === listItemID, i => (i.type = type, i), l.items), l),
      this.state.shoppingLists
    );

    if (this.notifyOnStateChange) {
      this.notifyOnStateChange(this.state)
    }
  }

  private markListItemPending = async (listID: uuid, listItemID: uuid): Promise<void> => {
    await Db.markListItemCompleted(this.db, listID, listItemID);

    const type = ShoppingListItemType.PendingTask;
    project(
      l => l.id === listID,
      l => (project(i => i.id === listItemID, i => (i.type = type, i), l.items), l),
      this.state.shoppingLists
    );

    if (this.notifyOnStateChange) {
      this.notifyOnStateChange(this.state)
    }
  }
}
