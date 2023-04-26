


export function query(query: shoppingListQuery, list: shoppingList, queryResults: queryResult[]): void {
  const tagsDoNotMatch = (
    query.tags && query.tags.length !== 0 && !isSubset(query.tags, list.tags)
  );

  if (tagsDoNotMatch) {
    return;
  }

  if (!query.searchTerm) {
    queryResults.push(list);

    return;
  }

  const searchTermLength = query.searchTerm.length;
  const termRegExp = new RegExp(query.searchTerm, "giu");

  function recordMatches(item: shoppingListItem): void {
    const { content } = item;

    const offsets: matchOffset[] = [];

    while ((termRegExp.exec(content)) !== null) {
      const startIx = termRegExp.lastIndex;
      const endIx = (startIx + (searchTermLength - 1));

      offsets.push([startIx, endIx]);
    }

    if (offsets.length > 0) {
      matches.push({ ...item, matches: offsets })
    }
  }

  iter(recordMatches, list.items);
} 