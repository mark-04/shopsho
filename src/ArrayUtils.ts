
export function isSubset<t>(arr1: t[], arr2: t[], equal?: ((a: t, b: t) => boolean)): boolean {
  for (let i = 0; i < arr1.length; i++) {
    const eq = equal || ((a, b) => a === b);
    const el1 = arr1[i];
    let isEl1InArr2 = false;

    for (let j = 0; j < arr2.length; j++) {
      const el2 = arr2[j];

      if (eq(el1, el2)) {
        isEl1InArr2 = true;
      }
    }

    if (!isEl1InArr2) {
      return false;
    }
  }

  return true;
}

export function union<t>(arr1: t[], arr2: t[], equal?: ((a: t, b: t) => boolean)): t[] {
  const eq = equal || ((a, b) => a === b);
  const result = structuredClone(arr1);

  for (let i = 0; i < arr2.length; i++) {
    const el2 = arr2[i];
    let el2InArr1 = false;

    for (let j = 0; j < arr1.length; j++) {
      const el1 = arr1[j];

      if (eq(el1, el2)) {
        el2InArr1 = true;
        break;
      }
    }

    if (!el2InArr1) {
      result.push(structuredClone(el2));
    }
  }

  return result;
}

export function difference<t>(arr1: t[], arr2: t[], equal?: ((a: t, b: t) => boolean)): t[] {
  const eq = equal || ((a, b) => a === b);
  const result: t[] = [];

  for (let i = 0; i < arr1.length; i++) {
    const el1 = arr1[i];
    let isEl1InArr2 = false;

    for (let j = 0; j < arr2.length; j++) {
      const el2 = arr2[j];

      if (eq(el1, el2)) {
        isEl1InArr2 = true;
        break;
      }
    }

    if (isEl1InArr2)
      continue;
    else
      result.push(el1);
  }

  return result;
}