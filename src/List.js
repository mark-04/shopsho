// Procedures for working with mutable singly-linked lists 

// Because we want to be able to easily store our lists in IndexedDB, 
// a list must be representable as a plain object without prototypical chain or other fancy stuff. 
// Therefore, this library makes no effort to encapsulate state and behaviour of lists, but instead
// exports many procedures that work with list-like objects, i.e. objects of List<T> type (see List.d.ts) 

// However, it may be convienient to have a List class (at least, writting code that deals with
// classes is, arguably, more idiomatic in Javascript than, say, calling plain procedures)
// Because of that, this library also exports a wrapper class List (see below)

//  As far as this library is concerned, there are two types of lists:
//    1. normalized
//      - a normalized empty list of type List<T> is always represen as { normalized: true } object
//      - a normalized non-empty list is represented as { head: T, tail: List<T>, normalized: true } object,
//        whose propery tail is a normalized list 
//    2. non-normalized 
//      - a non-normalized empty list of type List<T> may be represented as {}, or {tail: {}}, or {tail: {tail: {}}}, etc.
//      - a non-normalized non-empty list may be represended as {head: T, tail: List<T>}, or {tail: {head: T, tail: List<T>}}
//        or {tail: {tail: {head: T, tail: List<T>}}}, etc.
//      - both empty and non-empty non-normalized lists may have a property "normalized" but, if they do, 
//        this property must be set to false

//  Most procedures in this library, when given non-normalized lists, will normalize them automatically,
//  although, when the list is deep, it is not guaranteed that all its sublists will be normalized as well
//  Therefore, it is recommended to always construct lists using procedures exported by this library    

//  For example, avoid writting "const list = {head: 7, tail: {head: 5}}" 
//  Write "const list = new List().prepend(5).prepend(7)" instead
//  That way, list is guaranteed to always be normalized

//  WARNING: Cyclic lists are not rejected during normalization 
//           Despite that, procedures in this library are not guaranteed to terminate 
//           when working with cyclic lists
//  In other words, passing cyclic lists to procedures in this library should be avoided 
//  because it can cause an infinite loop

export const empty = () => ({ normalized: true });

export const isList = (list) => (
  typeof list === "object" && list !== null && !Array.isArray(list)
);
const isNotList = (list) => !isList(list);

const errorIfNotList = (list) => {
  if (isNotList(list)) {
    throw new Error("Not a list");
  }
}

// does not check if a list is valid: 
// NOTE: lists can be valid even if they have not been normalized,
//       however, the contrary is not true; if the list is normalized, it is guaranteed to be valid
// if it is necessary to ensure that the list is valid,
// List.errorIfNotList(...) should be called instead
const isNormalized = (list) => !!list.normalized;

// does not check if a list is normalized
// should always be called after List.normalize(...) had been called
const isNotEmpty = (list) => list.hasOwnProperty("head");

// does not check if a list is normalized
// should always be called after List.normalize(...) had been called
export const isEmpty = (list) => !list.hasOwnProperty("head");

// does not check if a list is normalized
// should always be called after List.normalize(...) had been called
const errorIfEmpty = (list) => {
  if (isEmpty(list)) {
    throw new Error("Empty list");
  }
}

// errors when given invalid list 
// WARNING: cyclic lists are not rejected as invalid, however they are not supported either 
// WARNING: most procedures in this library are not guaranteed to terminate when working with cyclic lists   
const normalize = (list) => {
  errorIfNotList(list);

  if (isNormalized(list)) {
    return;
  }

  let listStartPtr = list;

  while (!listStartPtr.hasOwnProperty("head") && listStartPtr.hasOwnProperty("tail")) {
    listStartPtr = listStartPtr.tail;
    errorIfNotList(listStartPtr);
  }

  if (!listStartPtr.hasOwnProperty("head") && !listStartPtr.hasOwnProperty("tail")) {
    delete list.tail;
    list.normalized = true;

    return;
  }

  if (listStartPtr.hasOwnProperty("head") && !listStartPtr.hasOwnProperty("tail")) {
    list.head = listStartPtr.head;
    list.tail = empty();
    list.normalized = true;

    return;
  }

  if (listStartPtr.hasOwnProperty("head") && listStartPtr.hasOwnProperty("tail")) {
    list.head = listStartPtr.head;
    list.tail = listStartPtr.tail;
    list.normalized = true;

    return;
  }
}

export const prepend = (elt, list) => {
  normalize(list);

  if (isEmpty(list)) {
    list.head = elt;
    list.tail = empty();
  } else {
    normalize(list.tail);
    list.tail = { head: list.head, tail: list.tail };
    list.tail.normalized = true;
    list.head = elt;
  }
}

// errors when given an empty list
// normalizes the list and its tail before returning it 
export const tail = (list) => {
  normalize(list);
  errorIfEmpty(list);
  normalize(list.tail);

  return list.tail;
}

export const iter = (f, list) => {
  normalize(list);

  while (isNotEmpty(list)) {
    f(list.head);
    list = list.tail;
    normalize(list);
  }
}

// selects an element of the list that satisfies the predicate and modifies it in place 
// by applying f to it and storing the result as a new value 
export const project = (pred, f, list) => {
  normalize(list);

  while (isNotEmpty(list)) {
    if (pred(list.head)) {
      list.head = f(list.head);

      return;
    }

    list = list.tail;
    normalize(list);
  }
}

export const projectAll = (pred, f, list) => {
  normalize(list);

  while (isNotEmpty(list)) {
    if (pred(list.head)) {
      list.head = f(list.head);
    }

    list = list.tail;
    normalize(list);
  }
}

export const append = (elt, list) => {
  normalize(list);

  while (isNotEmpty(list)) {
    list = list.tail;
    normalize(list);
  }

  list.head = elt;
  list.normalized = false;
  normalize(list);
}

export const appendBefore = (elt, pred, list) => {
  normalize(list);

  if (isNotEmpty(list) && pred(list.head)) {
    prepend(elt, list);

    return;
  }

  normalize(list.tail);

  while (isNotEmpty(list) && isNotEmpty(list.tail)) {
    normalize(list.tail.tail);

    if (pred(list.tail.head)) {
      list.tail.tail = { head: list.tail.head, tail: list.tail.tail };
      list.tail.normalized = true;
      list.tail.head = elt;

      return;
    }

    list = list.tail;
    normalize(list);
  }
}

export const appendAfter = (elt, pred, list) => {
  normalize(list);

  while (isNotEmpty(list)) {
    if (pred(list.head)) {
      normalize(list.tail);
      list.tail = { head: elt, tail: list.tail };
      list.tail.normalized = true;

      return;
    }

    list = list.tail;
    normalize(list);
  }
}

// errors if the element was not found
export const findElt = (pred, list) => {
  normalize(list);

  let elt;
  let didFindElement = false;

  while (isNotEmpty(list)) {
    if (pred(list.head)) {
      elt = list.head;
      didFindElement = true;

      break;
    }

    list = list.tail;
    normalize(list);
  }

  if (!didFindElement) {
    throw new Error("Not found");
  }

  return elt;
}

// errors if the element was not found
export const removeElt = (pred, list) => {
  normalize(list);

  let elt;
  let didFindElement = false;

  while (isNotEmpty(list)) {
    if (pred(list.head)) {
      elt = list.head;
      didFindElement = true;

      delete list.head;
      normalize(list);

      break;
    }

    list = list.tail;
    normalize(list);
  }

  if (!didFindElement) {
    throw new Error("Not found");
  }

  return elt;
}

// errors if the element was not found
export const moveEltToFront =
  (pred, list) => {
    normalize(list);

    const listStartPtr = list;

    while (isNotEmpty(list)) {
      if (pred(list.head)) {
        let elt = list.head;
        delete list.head;
        prepend(elt, listStartPtr);
        didMoveElt = true;

        return;
      }

      list = list.tail;
      normalize(list);
    }

    throw new Error("Not found");
  }

// errors if either of the elements was not found  
export const moveEltBefore = (eltPred, sibPred, list) => {
  normalize(list);

  const listStartPtr = list;

  while (isNotEmpty(list)) {
    if (sibPred(list.head)) {
      const elt = removeElt(eltPred, listStartPtr);
      prepend(elt, list);

      return;
    }

    list = list.tail;
    normalize(list);
  }

  throw new Error("Not found");
}

export const moveEltAfter = (eltPred, sibPred, list) => {
  normalize(list);

  const listStartPtr = list;

  while (isNotEmpty(list)) {
    if (sibPred(list.head)) {
      const sib = list.head;
      const elt = removeElt(eltPred, listStartPtr);
      list.tail = { head: elt, tail: list.tail };
      normalize(list.tail);
      list.tail.head = sib;
      normalize(list.tail);

      return;
    }

    list = list.tail;
    normalize(list);
  }

  throw new Error("Not found");
}

export const fromArray = (arr) => {
  const list = empty();

  for (let i = (arr.length - 1); i >= 0; i--) {
    prepend(arr[i], list);
  }

  return list;
}

export const toArray = (list) => {
  const array = [];
  iter((elt) => array.push(elt), list);

  return array;
}

export class List {
  #value;

  constructor(list) {
    if (list) {
      normalize(list);

      this.#value = list;
    } else {
      this.#value = empty();
    }
  }

  unwrapp = () => (this.#value);
  isEmpty = () => (isEmpty(this.#value));
  prepend = (elt) => (prepend(elt, this.#value), this);
  project = (pred, f) => (project(pred, f, this.#value), this);
  projectAll = (pred, f) => (project(pred, f, this.#value), this);
  append = (elt) => (append(elt, this.#value), this);
  appendBefore = (elt, pred) => (appendBefore(elt, pred, this.#value), this);
  appendAfter = (elt, pred) => (appendAfter(elt, pred, this.#value), this);
  findElt = (pred) => (findElt(pred, this.#value), this);
  removeElt = (pred) => (removeElt(pred, this.#value), this);
  moveEltToFront = (pred) => (moveEltToFront(pred, this.#value), this);
  moveEltBefore = (eltPred, sibPred) => (moveEltBefore(eltPred, sibPred, this.#value), this);
  moveEltAfter = (eltPred, sibPred) => (moveEltAfter(eltPred, sibPred, this.#value), this);
}