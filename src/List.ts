export type List<T> = null | { head: T, tail: List<T> }

export function cons<T>(head: T, tail: List<T>): List<T> {
  return { head, tail };
}

export function iter<T>(f: (elt: T) => void, l: List<T>): void {
  while (l !== null) {
    f(l.head);
    l = l.tail;
  }
}

export function project<T>(pred: (elt: T) => boolean, f: (elt: T) => T, l: List<T>): void {
  while (l !== null) {
    if (pred(l.head))
      l.head = f(l.head);

    // @ts-ignore
    l = l.tail;
  }
}

export function append<T>(elt: T, l: List<T>): List<T> {
  if (l === null)
    return cons(elt, l);

  while (l !== null) {
    if (l.tail === null) {
      l.tail = cons(elt, null);
      break;
    }

    l = l.tail;
  }

  return l;
}

export function appendBefore<T>(elt: T, pred: (x: T) => boolean, l: List<T>): List<T> {
  if (l === null || pred(l.head))
    return cons(elt, l);

  while (l !== null && l.tail !== null) {
    if (pred(l.tail.head)) {
      l.tail = cons(elt, l.tail);
      break;
    }

    l = l.tail;
  }

  return l;
}

export function appendAfter<T>(elt: T, pred: (x: T) => boolean, l: List<T>): List<T> {
  while (l !== null) {
    if (pred(l.head)) {
      l.tail = cons(elt, l.tail);
      break;
    }

    l = l.tail;
  }

  return l;
}

// removes element from the list and returns it
export function removeElt<T>(pred: (elt: T) => boolean, l: List<T>): T {
  let elt;

  while (l !== null && l.tail !== null) {
    if (pred(l.tail.head)) {
      elt = l.tail.head;
      l.tail = l.tail.tail;
      l = l.tail;
    } else {
      l = l.tail;
    }
  }

  return elt;
}

export function moveEltBefore<T>(eltPred: (elt: T) => boolean, sibPred: (sib: T) => boolean, l: List<T>): List<T> {
  const elt = removeElt(eltPred, l);

  if (elt)
    return appendBefore(elt, sibPred, l);
  else
    return l;
}

export function moveEltAfter<T>(eltPred: (elt: T) => boolean, sibPred: (sib: T) => boolean, l: List<T>): List<T> {
  const elt = removeElt(eltPred, l);

  if (elt)
    return appendAfter(elt, sibPred, l);
  else
    return l;
}

export function fromArray<T>(arr: Array<T>): List<T> {
  let l: List<T> = null;

  for (let i = (arr.length - 1); i >= 0; i--) {
    l = cons(arr[i], l);
  };

  return l;
}

export function toArray<T>(l: List<T>): Array<T> {
  const res: T[] = [];

  while (l !== null) {
    res.push(l.head);
    l = l.tail;
  }

  return res;
}