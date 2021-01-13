import Head from "next/head";
import styles from "../styles/Home.module.css";
import useTodos from "./services/todos";

export default function Home() {
  const todosQuery = useTodos();
  const { updateLoading, actions } = todosQuery;

  const todos = todosQuery?.data?.todos || [];

  const onCreateTodo = (e) => {
    e.preventDefault();
    const titleInput = e.target.querySelector("[name=title]");
    actions.createTodo({
      variables: { title: titleInput.value },
      onCompleted: () => (titleInput.value = ""),
    });
  };

  const onDeleteTodo = ({ id }) => (e) => {
    e.preventDefault();
    actions.deleteTodo({ variables: { id } });
  };

  const onUpdateTodo = ({ id, done }) => (e) => {
    actions.updateTodo({ variables: { id, done: !done } });
  };

  const onClearDone = () => {
    const ids = todos.filter((todo) => todo.done).map((todo) => todo.id);
    actions.deleteTodos({ variables: { ids } });
  };

  return (
    <div className={styles.container}>
      <Head>
        <title>Todos</title>
      </Head>
      <ul className={styles.list}>
        {todos.map((todo) => (
          <li key={todo.id} className={styles["list-item"]}>
            <input
              type="checkbox"
              checked={todo.done}
              onChange={onUpdateTodo(todo)}
            />
            <span>{todo.title}</span>
            <button onClick={onDeleteTodo(todo)} disabled={updateLoading}>
              X
            </button>
          </li>
        ))}
      </ul>
      <button onClick={onClearDone}>Clear Done</button>
      <form onSubmit={onCreateTodo} disabled={updateLoading}>
        <input type="text" name="title" />
        <button type="submit" disabled={updateLoading}>
          Create Todo
        </button>
      </form>
    </div>
  );
}
