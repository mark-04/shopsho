import { append, appendBefore, List, project, removeElt, cons, moveEltBefore } from "./List";

import {
  uuid,
  tag,
  ApplicationState,
  StateRecord,
  ShoppingList,
  ShoppingListItem,
  ShoppingListRecord,
  ShoppingListItemType
} from "./CoreTypes";

import {
  toArray as listToArray,
  fromArray as listFromArray
} from "./List";

import { difference, union } from "./ArrayUtils";

const DB_NAME = "db";
const DB_VERSION = 1;
const DB_APP_STATE_STORE_NAME = "applicationState";
const DB_SHOPPING_LIST_STORE_NAME = "shoppingLists";


function openDatabase(): Promise<IDBDatabase> {
  return new Promise((resolve, reject) => {
    const openDbRequest = window.indexedDB.open(DB_NAME, DB_VERSION);

    openDbRequest.onsuccess = (_) => resolve(openDbRequest.result);
    openDbRequest.onerror = (_) => reject(openDbRequest.error);

    openDbRequest.onupgradeneeded = (_) => {
      const db: IDBDatabase = openDbRequest.result;

      // Initialize shopping list store (see `ShoppingListRecord` in CoreTypes)
      db.createObjectStore(DB_SHOPPING_LIST_STORE_NAME, { keyPath: "id" });

      // Initialize application state store (see `StateRecord` in CoreTypes)
      db.createObjectStore(DB_APP_STATE_STORE_NAME, { keyPath: "id" })
        .transaction.oncomplete = (_) => {
          db.transaction(DB_APP_STATE_STORE_NAME, "readwrite")
            // Add an empty state record to the object store
            .objectStore(DB_APP_STATE_STORE_NAME).add({
              id: DB_VERSION,
              tags: [],
              query: {},
              shoppingLists: null,
            } as StateRecord)
        }
    };
  })
}

function getApplicationState(db: IDBDatabase): Promise<ApplicationState> {
  return new Promise((resolve, reject) => {
    const transaction = db.transaction([DB_SHOPPING_LIST_STORE_NAME, DB_APP_STATE_STORE_NAME], "readonly");
    transaction.onerror = (_) => reject(transaction.error);

    const listStore = transaction.objectStore(DB_SHOPPING_LIST_STORE_NAME);
    const stateStore = transaction.objectStore(DB_APP_STATE_STORE_NAME);

    const getStateRequest = stateStore.get(DB_VERSION);
    getStateRequest.onsuccess = (_) => {
      const { tags, query, shoppingLists: ids } = getStateRequest.result as StateRecord;

      function getList(id: uuid): Promise<ShoppingListRecord> {
        return new Promise((resolve) => {
          const getListRequest = listStore.get(id);
          getListRequest.onsuccess = () => (resolve(getListRequest.result));
        })
      }

      const getAllLists = listToArray(ids).map(getList);

      Promise.all(getAllLists)
        .then(listArr => resolve({ tags, query, shoppingLists: listFromArray(listArr), isNetworkAvailable: true }))
        .catch(error => reject(error))
    }
  })
}

function addList(db: IDBDatabase, list: ShoppingList): Promise<void> {
  return new Promise((resolve, reject) => {
    const transaction = db.transaction([DB_SHOPPING_LIST_STORE_NAME, DB_APP_STATE_STORE_NAME], "readwrite");
    transaction.oncomplete = (_) => resolve();
    transaction.onabort = (_) => reject();

    const listStore = transaction.objectStore(DB_SHOPPING_LIST_STORE_NAME);
    const stateStore = transaction.objectStore(DB_APP_STATE_STORE_NAME);

    const addListRequest = listStore.add(list);
    addListRequest.onsuccess = (_) => {
      const getStateRequest = stateStore.get(DB_VERSION);
      getStateRequest.onsuccess = (_) => {
        const state = getStateRequest.result as StateRecord;
        state.shoppingLists = append(list.id, state.shoppingLists);
        state.query = {};

        stateStore.put(state);
      }
    }
  })
}

function removeList(db: IDBDatabase, listID: uuid): Promise<void> {
  return new Promise((resolve, reject) => {
    const transaction = db.transaction([DB_SHOPPING_LIST_STORE_NAME, DB_APP_STATE_STORE_NAME], "readwrite");
    transaction.oncomplete = (_) => resolve();
    transaction.onabort = (_) => reject();

    const listStore = transaction.objectStore(DB_SHOPPING_LIST_STORE_NAME);
    const stateStore = transaction.objectStore(DB_APP_STATE_STORE_NAME);

    listStore.delete(listID).onsuccess = (_) => {
      const getStateRequest = stateStore.get(DB_VERSION);
      getStateRequest.onsuccess = (_) => {
        const state = getStateRequest.result as StateRecord;
        removeElt((id) => id === listID, state.shoppingLists);

        stateStore.put(state);
      }
    }
  })
}

function pinList(db: IDBDatabase, listID: uuid): Promise<void> {
  return new Promise((resolve, reject) => {
    const transaction = db.transaction([DB_SHOPPING_LIST_STORE_NAME, DB_APP_STATE_STORE_NAME], "readwrite");
    transaction.oncomplete = (_) => resolve();
    transaction.onabort = (_) => reject();

    const listStore = transaction.objectStore(DB_SHOPPING_LIST_STORE_NAME);
    const stateStore = transaction.objectStore(DB_APP_STATE_STORE_NAME);

    const getListRequest = listStore.get(listID);
    getListRequest.onsuccess = (_) => {
      const list = getListRequest.result as ShoppingList;
      list.isPinned = true;

      listStore.put(list).onsuccess = (_) => {
        const getStateRequest = stateStore.get(DB_VERSION);
        getStateRequest.onsuccess = (_) => {
          const state = getStateRequest.result as StateRecord;
          // remove element from whatever position it is and put it in the head of a list
          const id = removeElt((id) => id === listID, state.shoppingLists);
          state.shoppingLists = cons(id, state.shoppingLists);

          stateStore.put(state);
        }
      }
    }
  })
}

function addTagsToList(db: IDBDatabase, listID: uuid, tags: tag[]): Promise<void> {
  return new Promise((resolve, reject) => {
    const transaction = db.transaction([DB_SHOPPING_LIST_STORE_NAME, DB_APP_STATE_STORE_NAME], "readwrite");
    transaction.oncomplete = (_) => resolve();
    transaction.onabort = (_) => reject();

    const listStore = transaction.objectStore(DB_SHOPPING_LIST_STORE_NAME);
    const stateStore = transaction.objectStore(DB_APP_STATE_STORE_NAME);

    const getListRequest = listStore.get(listID);
    getListRequest.onsuccess = (_) => {
      const list = getListRequest.result;
      list.tags = union(list.tags, tags);

      listStore.put(list).onsuccess = (_) => {
        const getStateRequest = stateStore.get(DB_VERSION);
        getStateRequest.onsuccess = (_) => {
          const state = getStateRequest.result as StateRecord;
          state.tags = union(state.tags, tags);

          stateStore.put(state);
        }
      }
    }
  })
}

function removeTagsFromList(db: IDBDatabase, listID: uuid, tags: tag[]): Promise<void> {
  return new Promise((resolve, reject) => {
    const transaction = db.transaction([DB_SHOPPING_LIST_STORE_NAME, DB_APP_STATE_STORE_NAME], "readwrite");
    transaction.oncomplete = (_) => resolve();
    transaction.onabort = (_) => reject();

    const listStore = transaction.objectStore(DB_SHOPPING_LIST_STORE_NAME);
    const stateStore = transaction.objectStore(DB_APP_STATE_STORE_NAME);

    const getListRequest = listStore.get(listID);
    getListRequest.onsuccess = (_) => {
      const list = getListRequest.result;
      list.tags = difference(list.tags, tags);

      listStore.put(list).onsuccess = (_) => {
        const getStateRequest = stateStore.get(DB_VERSION);
        getStateRequest.onsuccess = (_) => {
          const state = getStateRequest.result as StateRecord;
          state.tags = difference(state.tags, tags);

          stateStore.put(state);
        }
      }
    }
  })
}

function addListItem(db: IDBDatabase, listID: uuid, listItem: ShoppingListItem): Promise<void> {
  return new Promise((resolve, reject) => {
    const transaction = db.transaction(DB_SHOPPING_LIST_STORE_NAME, "readwrite");
    transaction.oncomplete = (_) => resolve();
    transaction.onabort = (_) => reject();

    const store = transaction.objectStore(DB_SHOPPING_LIST_STORE_NAME);
    const getListRequest = store.get(listID);

    getListRequest.onsuccess = (_) => {
      const list = getListRequest.result as ShoppingList;
      list.items = append(listItem, list.items);

      store.put(list);
    }
  })
}

function moveListItem(db: IDBDatabase, listID: uuid, listItemID: uuid, nextSiblingID: uuid): Promise<void> {
  return new Promise((resolve, reject) => {
    const transaction = db.transaction(DB_APP_STATE_STORE_NAME, "readwrite");
    transaction.oncomplete = (_) => resolve();
    transaction.onabort = (_) => reject();

    const store = transaction.objectStore(DB_SHOPPING_LIST_STORE_NAME);

    const getListRequest = store.get(listID);
    getListRequest.onsuccess = (_) => {
      const list = getListRequest.result as ShoppingList;
      list.items = moveEltBefore(i => i.id === listItemID, s => s.id === nextSiblingID, list.items);

      store.put(list);
    }
  })
}

function removeListItem(db: IDBDatabase, listID: uuid, listItemID: uuid): Promise<void> {
  return new Promise((resolve, reject) => {
    const transaction = db.transaction(DB_SHOPPING_LIST_STORE_NAME, "readwrite");
    transaction.oncomplete = (_) => resolve();
    transaction.onabort = (_) => reject();

    const store = transaction.objectStore(DB_SHOPPING_LIST_STORE_NAME);

    const getListRequest = store.get(listID);
    getListRequest.onsuccess = (_) => {
      const list = getListRequest.result as ShoppingList;
      removeElt((elt) => elt.id === listItemID, list.items);

      store.put(list);
    }
  })
}

function editListItem(db: IDBDatabase, listID: uuid, listItemID: uuid, content: string): Promise<void> {
  return new Promise((resolve, reject) => {
    const transaction = db.transaction(DB_SHOPPING_LIST_STORE_NAME, "readwrite");
    transaction.oncomplete = (_) => resolve();
    transaction.onabort = (_) => reject();

    const store = transaction.objectStore(DB_SHOPPING_LIST_STORE_NAME);

    const getListRequest = store.get(listID);
    getListRequest.onsuccess = (_) => {
      const list = getListRequest.result as ShoppingList;
      project((l) => l.id === listItemID, (l) => (l.content = content, l), list.items);

      store.put(list);
    }
  })
}

function markListItemCompleted(db: IDBDatabase, listID: uuid, listItemID: uuid): Promise<void> {
  return new Promise((resolve, reject) => {
    const transaction = db.transaction(DB_SHOPPING_LIST_STORE_NAME, "readwrite");
    transaction.oncomplete = (_) => resolve();
    transaction.onabort = (_) => reject();

    const store = transaction.objectStore(DB_SHOPPING_LIST_STORE_NAME);

    const getListRequest = store.get(listID);
    getListRequest.onsuccess = (_) => {
      const list = getListRequest.result as ShoppingList;
      const completed = ShoppingListItemType.CompletedTask;
      project((l) => l.id === listItemID, (l) => (l.type = completed, l), list.items);

      store.put(list);
    }
  })
}

function markListItemPending(db: IDBDatabase, listID: uuid, listItemID: uuid): Promise<void> {
  return new Promise((resolve, reject) => {
    const transaction = db.transaction(DB_SHOPPING_LIST_STORE_NAME, "readwrite");
    transaction.oncomplete = (_) => resolve();
    transaction.onabort = (_) => reject();

    const store = transaction.objectStore(DB_SHOPPING_LIST_STORE_NAME);

    const getListRequest = store.get(listID);
    getListRequest.onsuccess = (_) => {
      const list = getListRequest.result as ShoppingList;
      const pending = ShoppingListItemType.PendingTask;
      project((l) => l.id === listItemID, (l) => (l.type = pending, l), list.items);

      store.put(list);
    }
  })
}

export default {
  openDatabase,
  getApplicationState,

  addList, pinList, removeList, addTagsToList, removeTagsFromList,
  addListItem, moveListItem, removeListItem, editListItem,
  markListItemCompleted, markListItemPending,
}