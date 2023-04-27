import React, { useContext } from "react";
import { ModelContext } from "../App";
import { toArray as listToArray } from "../List";

import { ShoppingList, ShoppingListItem, ShoppingListItemType } from "../CoreTypes";

export default function ShoppingList(props) {
  const list = props.list as ShoppingList;
  const {
    isPinned,
    items,
  } = list;

  const renderTask = (task) => (<p>{task.content}</p>);
  const renderTasks = (tasks) => listToArray(tasks).map(renderTask);

  const title = items?.head;
  const tasks = items?.tail;

  const model = useContext(ModelContext);
  return (
    <div className="flex flex-col">
      <strong>
        {isPinned ? "pinned" : "not pinned"}
      </strong>

      {title && <h2>title.content</h2>}
      {tasks && renderTasks(tasks)}
    </div>
  );
}