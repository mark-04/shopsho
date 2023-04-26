// length is handy for implementing efficient `toArray(...)` and `fromArray(...)` conversions
export type List<T> = null | { head: T, tail: List<T>, length: number }

export function length<T>(l: List<T>): number {
  if (l === null)
    return 0;
  else
    return l.length;
}

export function cons<T>(head: T, tail: List<T>): List<T> {
  return { head, tail, length: length(tail) + 1 };
}

export function iter<T>(f: (elt: T) => void, l: List<T>) {
  while (l !== null) {
    f(l.head);
    l = l.tail;
  }
}

export function reverse<T>(l: List<T>): List<T> {
  let res: List<T> = null;
  iter((elt) => { res = cons(elt, res); }, l);

  return res;
}

export function map<A, B>(f: (elt: A) => B, l: List<A>): List<B> {
  let res: List<B> = null;
  iter((elt) => { res = cons(f(elt), res); }, l);

  return reverse(res);
}

export function project<A>(pred: (elt: A) => boolean, f: (elt: A) => A, l: List<A>): List<A> {
  if (l === null)
    return l;

  if (pred(l.head))
    return (cons(f(l.head), l.tail));
  else
    return (cons(l.head, project(pred, f, l.tail)))
}

// Add element to the end of the list 
export function append<T>(elt: T, l: List<T>): List<T> {
  if (l === null)
    return cons(elt, l);
  else
    return { head: l.head, tail: (append(elt, l.tail)), length: (l.length + 1), }
}

export function appendBefore<T>(elt: T, pred: (x: T) => boolean, list: List<T>): List<T> {
  if (list === null)
    return null;

  if (pred(list.head))
    return cons(elt, list);
  else
    return cons(list.head, appendBefore(elt, pred, list.tail))
}

export function appendAfter<T>(elt: T, pred: (x: T) => boolean, list: List<T>): List<T> {
  if (list === null)
    return null;

  if (pred(list.head))
    return { head: list.head, tail: { head: elt, tail: list.tail, length: list.length }, length: list.length + 1 };
  else
    return cons(list.head, appendAfter(elt, pred, list.tail))
}

export function extractElt<T>(pred: (x: T) => boolean, list: List<T>, storeElt?: { element?: T }): List<T> {
  if (list === null)
    return null;

  if (pred(list.head)) {
    if (storeElt)
      storeElt.element = list.head;

    return list.tail;
  } else {
    return cons(list.head, extractElt(pred, list.tail, storeElt))
  }
}

export function removeElt<T>(pred: (x: T) => boolean, list: List<T>): List<T> {
  return extractElt(pred, list);
}

export function fromArray<T>(arr: Array<T>): List<T> {
  let l: List<T> = null;

  for (let i = (arr.length - 1); i >= 0; i--) {
    l = cons(arr[i], l);
  };

  return l;
}

export function toArray<T>(l: List<T>): Array<T> {
  if (l === null)
    return [];
  else {
    const arr = new Array(l.length);

    for (let i = l.length - 1; i >= 0; i--) {
      //@ts-ignore
      arr[i] = l.head;
      //@ts-ignore
      l = l.tail;
    }

    return arr;
  }
}