import React, { useContext } from "react";
import { ModelContext } from "../App";
import { toArray as listToArray } from "../List";
import ShoppingList from "./ShoppingList";
import { Model, ShoppingList as ShoppingListTy } from "../CoreTypes";
import { uuid as mkUUID } from "../UUID";

export default function MainSection(props) {
  const model = useContext(ModelContext) as Model;
  const lists = props.shoppingLists;

  const emptyList: () => ShoppingListTy =
    () => ({ id: mkUUID(), tags: [], isPinned: false, items: {} });

  const renderShoppingLists = (lists) => listToArray(lists).map((list) => <ShoppingList list={list} />)
  const handleAddList = () => model.addList(emptyList());

  return (
    <>
      <button onClick={handleAddList}>+Додати список</button>
      {lists && renderShoppingLists(lists)}
    </>
  )
}