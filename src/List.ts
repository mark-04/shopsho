//@ts-nocheck
// TS inferes general List<T> type, i.e. { head?: T, tail?: List<T>, [normalized]?: boolean }, 
// for a given <obj> even in if-branches with <obj>.hasOwnProperty(...) check(s) 
// i.e. it disallows accessing <obj>.head and/or <obj>.tail because it believes that
//      the <obj> may not have these properties, even in those blocks of code where 
//      we know for sure that those properties are present
// I don't feel like working around this issue right now, so let this file be unchecked for now

// Procedures for working with mutable singly-linked lists 

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
//  Write "const list = List.empty(); prepende(5, list); prepende(7, list)" instead
//  That way, list is guaranteed to always be normalized

//  WARNING: Cyclic lists are not rejected during normalization 
//           Despite that, procedures in this library are not guaranteed to terminate 
//           when working with cyclic lists
//  In other words, passing cyclic lists to procedures in this library should be avoided 
//  because it can cause an infinite loop

type List<T> = { head?: T, tail?: List<T>, normalized?: boolean }

export const empty: <T>() => List<T> =
  () => ({ normalized: true })

export const isList: <T>(list: List<T>) => boolean =
  (list) => (
    typeof list === "object" && list !== null && !Array.isArray(list)
  );
const isNotList: <T>(list: List<T>) => boolean =
  (list) => !isList(list);

const errorIfNotList: <T>(list: List<T>) => void =
  (list) => {
    if (isNotList(list)) {
      throw new Error("Not a list");
    }
  }

// does not check if a list is valid: 
// NOTE: lists can be valid even if they have not been normalized,
//       however, the contrary is not true; if the list is normalized, it is guaranteed to be valid
// if it is necessary to ensure that the list is valid,
// List.errorIfNotList(...) should be called instead
const isNormalized: (list: List<T>) => boolean =
  (list) => !!list.normalized;

// does not check if a list is normalized
// should always be called after List.normalize(...) had been called
const isNotEmpty: <T>(list: List<T>) => boolean =
  (list) => list.hasOwnProperty("head");

// does not check if a list is normalized
// should always be called after List.normalize(...) had been called
export const isEmpty: <T>(list: List<T>) => boolean =
  (list) => !list.hasOwnProperty("head");

// does not check if a list is normalized
// should always be called after List.normalize(...) had been called
const errorIfEmpty: <T>(list: List<T>) => void =
  (list) => {
    if (isEmpty(list)) {
      throw new Error("Empty list");
    }
  }

// errors when given invalid list 
// WARNING: cyclic lists are not rejected as invalid, however they are not supported either 
// WARNING: most procedures in this library are not guaranteed to terminate when working with cyclic lists   
const normalize: <T>(list: List<T>) => void =
  (list) => {
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
      list[normalized] = true;

      return;
    }

    if (listStartPtr.hasOwnProperty("head") && !listStartPtr.hasOwnProperty("tail")) {
      list.head = listStartPtr.head;
      list.tail = {};
      list[normalized] = true;

      return;
    }

    if (listStartPtr.hasOwnProperty("head") && listStartPtr.hasOwnProperty("tail")) {
      list.head = listStartPtr.head;
      list.tail = listStartPtr.tail;
      list[normalized] = true;

      return;
    }
  }

export const prepend: <T>(elt: T, list: List<T>) => void =
  (elt, list) => {
    normalize(list);

    if (isEmpty(list)) {
      list.head = elt;
      list.tail = empty();
    } else {
      normalize(list.tail);
      list.tail = { head: list.head, tail: list.tail };
      list.tail[normalized] = true;
      list.head = elt;
      list[normalized] = true;
    }
  }

// errors when given an empty list
// normalizes the list and its tail before returning it 
export const tail: <T>(list: List<T>) => List<T> =
  (list) => {
    normalize(list);
    errorIfEmpty(list);
    normalize(list.tail);

    return list.tail;
  }

export const iter: <T>(f: (elt: T) => void, list: List<T>) => void =
  (f, list) => {
    normalize(list);

    while (isNotEmpty(list)) {
      f(list.head);
      list = list.tail;
      normalize(list);
    }
  }

// selects an element of the list that satisfies the predicate and modifies it in place 
// by applying f to it and storing the result as a new value 
export const project: <T>(pred: ((elt: T) => boolean), f: ((elt: T) => T), list: List<T>) => void =
  (pred, f, list) => {
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

export const projectAll: <T>(pred: ((elt: T) => boolean), f: ((elt: T) => T), l: List<T>) => void =
  (pred, f, list) => {
    normalize(list);

    while (isNotEmpty(list)) {
      if (pred(list.head)) {
        list.head = f(list.head);
      }

      list = list.tail;
      normalize(list);
    }
  }

export const append: <T>(elt: T, list: List<T>) => void =
  (elt, list) => {
    normalize(list);

    while (isNotEmpty(list)) {
      list = list.tail;
      normalize(list);
    }

    list.head = elt;
    normalize(list);
  }

export const appendBefore: <T>(elt: T, pred: ((elt: T) => boolean), list: List<T>) => void =
  (elt, pred, list) => {
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
        list.tail[normalized] = true;
        list.tail.head = elt;

        return;
      }

      list = list.tail;
      normalize(list);
    }
  }

export const appendAfter: <T>(elt: T, pred: ((elt: T) => boolean), list: List<T>) => void =
  (elt, pred, list) => {
    normalize(list);

    while (isNotEmpty(list)) {
      if (pred(list.head)) {
        normalize(list.tail);
        list.tail = { head: elt, tail: list.tail };
        list.tail[normalized] = true;

        return;
      }

      list = list.tail;
      normalize(list);
    }
  }

// errors if the element was not found
export const findElt: <T>(pred: ((elt: T) => boolean), list: List<T>) => T | notFound =
  (pred, list) => {
    normalize(list);

    let elt: T;
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
export const removeElt: <T>(pred: ((elt: T) => boolean), list: List<T>) => T | notFound =
  (pred, list) => {
    normalize(list);

    let elt: T;
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
export const moveEltToFront: <T>(pred: ((elt: T) => boolean), list: List<T>) => void =
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
export const moveEltBefore: <T>(eltPred: ((elt: T) => boolean), sibPred: ((sib: T) => boolean), list: List<T>) => void =
  (eltPred, sibPred, list) => {
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

export const moveEltAfter: <T>(eltPred: ((elt: T) => boolean), sibPred: ((sib: T) => boolean), list: List<T>) => void =
  (eltPred, sibPred, list) => {
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

export const fromArray: <T>(arr: Array<T>) => List<T> =
  (arr) => {
    const list = empty();

    for (let i = (arr.length - 1); i >= 0; i--) {
      prepend(arr[i], list);
    }

    return list;
  }

export const toArray: <T>(list: List<T>) => Array<T> =
  (list) => {
    const arr: T[];
    iter((elt) => arr.push(elt), list);

    return arr;
  }