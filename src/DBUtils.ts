import { append, appendBefore, List, project, removeElt, extractElt, cons } from "./List";

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

function getApplicationState(db: IDBDatabase): Promise<ApplicationState> {
  return new Promise((resolve, reject) => {
    const stateRecordRequest = requestStateRecord(db);
    stateRecordRequest.onsuccess = (_) => {
      const { tags, query, shoppingLists: shoppingListIDs } = stateRecordRequest.result;

      getAllShoppingListRecords(shoppingListIDs)
        .then(listArr => resolve({ tags, query, shoppingLists: listFromArray(listArr), isNetworkAvailable: true }))
        .catch(error => reject(error))
    };
    stateRecordRequest.onerror = (_) => reject(stateRecordRequest.error);

    function requestStateRecord(db: IDBDatabase): IDBRequest {
      return db
        .transaction([DB_APP_STATE_STORE_NAME], "readonly")
        .objectStore(DB_APP_STATE_STORE_NAME)
        .get(DB_VERSION)
    }

    function getAllShoppingListRecords(ids: List<uuid>): Promise<Array<ShoppingList>> {
      const shoppingListsStore = db.transaction([DB_SHOPPING_LIST_STORE_NAME]).objectStore(DB_SHOPPING_LIST_STORE_NAME);

      return Promise.all(listToArray(ids).map(getShoppingListRecord(shoppingListsStore)));
    }

    function getShoppingListRecord(store: IDBObjectStore) {
      return function (id: uuid): Promise<ShoppingListRecord> {
        return new Promise((resolve, reject) => {
          const request = store.get(id);
          request.onsuccess = () => (resolve(request.result));
          request.onerror = () => (reject(request.error));
        })
      }
    }
  })
}

function openDatabase(): Promise<IDBDatabase> {
  return new Promise((resolve, reject) => {
    const openDbRequest = window.indexedDB.open(DB_NAME, DB_VERSION);

    openDbRequest.onsuccess = (_) => resolve(openDbRequest.result);
    openDbRequest.onerror = (_) => reject(openDbRequest.error);
    openDbRequest.onupgradeneeded = (_) => {
      const db: IDBDatabase = openDbRequest.result;
      initilizeShoppingListObjectStore(db);
      initilizeStateObjectStore(db);
    };

    function initilizeShoppingListObjectStore(db: IDBDatabase): void {
      db.createObjectStore(DB_SHOPPING_LIST_STORE_NAME, { keyPath: "id" });
    }

    function initilizeStateObjectStore(db: IDBDatabase): void {
      db.createObjectStore(DB_APP_STATE_STORE_NAME, { keyPath: "id" })
        .transaction
        .oncomplete = (_) => storeEmptyStateRecord(db);
    }

    function storeEmptyStateRecord(db: IDBDatabase): void {
      db.transaction(DB_APP_STATE_STORE_NAME, "readwrite")
        .objectStore(DB_APP_STATE_STORE_NAME)
        .add({
          id: DB_VERSION,
          tags: [],
          query: {},
          shoppingLists: null,
        } as StateRecord)
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
        state.shoppingLists = removeElt((id) => id === listID, state.shoppingLists);

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

          const pinnedID: { element?: string } = {};
          const restIDs = extractElt((id) => id === listID, state.shoppingLists, pinnedID);

          if (!pinnedID.element)
            transaction.abort(); // should never happen 
          else {
            state.shoppingLists = cons(pinnedID.element, restIDs);
            stateStore.put(state);
          }
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
    transaction.oncomplete = (_) => { resolve(); };
    transaction.onabort = (_) => { reject(); };

    const store = transaction.objectStore(DB_SHOPPING_LIST_STORE_NAME);
    const getListRequest = store.get(listID);

    getListRequest.onerror = (_) => { transaction.abort(); };
    getListRequest.onsuccess = (_) => {
      const list = getListRequest.result as ShoppingList;
      list.items = append(listItem, list.items);

      const putListRequest = store.put(list);
      putListRequest.onerror = (_) => { transaction.abort(); };
    }
  })
}

function moveListItem(db: IDBDatabase, listID: uuid, listItemID: uuid, nextSiblingID: uuid): Promise<void> {
  return new Promise((resolve, reject) => {
    const transaction = db.transaction(DB_APP_STATE_STORE_NAME, "readwrite");
    transaction.oncomplete = (_) => { resolve(); };
    transaction.onabort = (_) => { reject(); };

    const store = transaction.objectStore(DB_SHOPPING_LIST_STORE_NAME);
    const getListRequest = store.get(listID);
    getListRequest.onerror = (_) => { transaction.abort(); };
    getListRequest.onsuccess = (_) => {
      const list = getListRequest.result as ShoppingList;

      const storeElt: any = {};
      const restElts = extractElt((item) => item.id === listItemID, list.items, storeElt);

      if (!storeElt.element)
        transaction.abort();
      else {
        list.items = appendBefore(storeElt.element, (x) => x.id === nextSiblingID, restElts);

        const putListRequest = store.put(list);
        putListRequest.onerror = (_) => { transaction.abort(); };
      }
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
    getListRequest.onerror = (_) => transaction.abort();
    getListRequest.onsuccess = (_) => {
      const list = getListRequest.result as ShoppingList;
      list.items = removeElt((elt) => elt.id === listItemID, list.items);

      const putListRequest = store.put(list);
      putListRequest.onerror = (_) => transaction.abort();
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
    getListRequest.onerror = (_) => transaction.abort();
    getListRequest.onsuccess = (_) => {
      const list = getListRequest.result as ShoppingList;
      list.items = project((elt) => elt.id === listItemID, (elt) => (elt.content = content, elt), list.items);

      const putListRequest = store.put(list);
      putListRequest.onerror = (_) => transaction.abort();
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
    getListRequest.onerror = (_) => transaction.abort();
    getListRequest.onsuccess = (_) => {
      const list = getListRequest.result as ShoppingList;
      const completed = ShoppingListItemType.CompletedTask;
      list.items = project((elt) => elt.id === listItemID, (elt) => (elt.type = completed, elt), list.items);

      const putListRequest = store.put(list);
      putListRequest.onerror = (_) => transaction.abort();
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
    getListRequest.onerror = (_) => transaction.abort();
    getListRequest.onsuccess = (_) => {
      const list = getListRequest.result as ShoppingList;
      const pending = ShoppingListItemType.PendingTask;
      list.items = project((elt) => elt.id === listItemID, (elt) => (elt.type = pending, elt), list.items);

      const putListRequest = store.put(list);
      putListRequest.onerror = (_) => transaction.abort();
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
