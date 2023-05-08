type ListTy<T> = { head?: T, tail?: ListTy<T>, normalized?: boolean }

export const empty: <T>() => ListTy<T>
export const isList: <T>(list: ListTy<T>) => boolean
export const isEmpty: <T>(list: ListTy<T>) => boolean
export const prepend: <T>(elt: T, list: ListTy<T>) => void
export const tail: <T>(list: ListTy<T>) => ListTy<T>
export const iter: <T>(f: (elt: T) => void, list: ListTy<T>) => void
export const project: <T>(pred: ((elt: T) => boolean), f: ((elt: T) => T), list: ListTy<T>) => void
export const projectAll: <T>(pred: ((elt: T) => boolean), f: ((elt: T) => T), l: ListTy<T>) => void
export const append: <T>(elt: T, list: ListTy<T>) => void
export const appendBefore: <T>(elt: T, pred: ((elt: T) => boolean), list: ListTy<T>) => void
export const appendAfter: <T>(elt: T, pred: ((elt: T) => boolean), list: ListTy<T>) => void
export const findElt: <T>(pred: ((elt: T) => boolean), list: ListTy<T>) => T
export const removeElt: <T>(pred: ((elt: T) => boolean), list: ListTy<T>) => T
export const moveEltToFront: <T>(pred: ((elt: T) => boolean), list: ListTy<T>) => void
export const moveEltBefore: <T>(eltPred: ((elt: T) => boolean), sibPred: ((sib: T) => boolean), list: ListTy<T>) => void
export const moveEltAfter: <T>(eltPred: ((elt: T) => boolean), sibPred: ((sib: T) => boolean), list: ListTy<T>) => void
export const fromArray: <T>(arr: Array<T>) => ListTy<T>
export const toArray: <T>(list: ListTy<T>) => Array<T>

export class List {
  #value: ListTy<T>;

  constructor(list: ListTy<T>);
  unwrap: () => ListTy<T>;
  isEmpty: () => boolean;
  prepend: (elt: T) => List;
  project: (pred: (elt: T) => void, f: (elt: T) => void) => List;
  projectAll: (pred: (elt: T) => void, f: (elt: T) => void) => List;
  append: (elt: T) => List;
  appendBefore: (elt: T, pred: (elt: T) => boolean) => List;
  appendAfter: (elt: T, pred: (elt: T) => boolean) => List;
  findElt: (pred: ((elt: T) => boolean)) => T;
  removeElt: (pred: ((elt: T) => boolean)) => T;
  moveEltToFront: (pred: ((elt: T) => boolean)) => List;
  moveEltBefore: (eltPred: ((elt: T) => boolean), sibPred: ((sib: T) => boolean)) => List;
  moveEltAfter: (eltPred: ((elt: T) => boolean), sibPred: ((sib: T) => boolean)) => List;
}