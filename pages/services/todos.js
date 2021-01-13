import { gql, useMutation, useQuery } from "@apollo/client";

const DELETE_TODO = gql`
  mutation deleteTodo($id: uuid!) {
    delete_todos(where: { id: { _eq: $id } }) {
      returning {
        id
      }
    }
  }
`;

const DELETE_TODOS = gql`
  mutation deleteTodos($ids: [uuid!]!) {
    delete_todos(where: { id: { _in: $ids } }) {
      returning {
        id
      }
    }
  }
`;

const CREATE_TODO = gql`
  mutation createTodo($title: String!) {
    insert_todos(objects: { title: $title }) {
      returning {
        id
        title
        done
      }
    }
  }
`;

const UPDATE_TODO = gql`
  mutation updateTodo($id: uuid!, $done: Boolean!) {
    update_todos(_set: { done: $done }, where: { id: { _eq: $id } }) {
      returning {
        id
        done
      }
    }
  }
`;

const TODOS = gql`
  query getTodos {
    todos {
      id
      title
      done
    }
  }
`;

const useTodos = () => {
  const todosQuery = useQuery(TODOS);

  const [createTodo, { loading: createTodoLoading }] = useMutation(
    CREATE_TODO,
    {
      update(cache, { data }) {
        const newTodos = data?.insert_todos?.returning || [];

        cache.modify({
          fields: {
            todos(existingTodos = []) {
              return [...existingTodos, ...newTodos];
            },
          },
        });
      },
    }
  );

  const [updateTodo, { loading: updateTodoLoading }] = useMutation(
    UPDATE_TODO,
    {
      update(cache, { data }) {
        const updatedTodo = data?.update_todos?.returning?.[0];

        cache.modify({
          id: cache.identify(updatedTodo),
          fields: {
            done() {
              return updatedTodo.done;
            },
          },
        });
      },
    }
  );

  const [deleteTodo, { loading: deleteTodoLoading }] = useMutation(
    DELETE_TODO,
    {
      update(cache, { data }) {
        const removedTodo = data?.delete_todos?.returning?.[0];

        cache.modify({
          fields: {
            todos(existingTodos = [], { readField }) {
              return existingTodos.filter((todo) => {
                return readField("id", todo) !== removedTodo.id;
              });
            },
          },
        });
      },
    }
  );

  const [deleteTodos, { loading: deleteTodosLoading }] = useMutation(
    DELETE_TODOS,
    {
      update(cache, { data }) {
        const removedTodos = data?.delete_todos?.returning.reduce(
          (set, todo) => {
            set.add(todo.id);
            return set;
          },
          new Set()
        );

        cache.modify({
          fields: {
            todos(existingTodos = [], { readField }) {
              return existingTodos.filter(
                (todo) => !removedTodos.has(readField("id", todo))
              );
            },
          },
        });
      },
    }
  );

  const updateLoading =
    createTodoLoading ||
    updateTodoLoading ||
    deleteTodoLoading ||
    deleteTodosLoading;

  return {
    ...todosQuery,
    updateLoading,
    actions: { deleteTodos, createTodo, updateTodo, deleteTodo },
  };
};

export default useTodos;
