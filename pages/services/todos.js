import { gql, useMutation, useQuery } from "@apollo/client";

const DELETE_TODO = gql`
  mutation deleteTodo($id: uuid!) {
    delete_todos_by_pk(id: $id) {
      id
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
    insert_todos_one(object: { title: $title }) {
      id
      title
      done
    }
  }
`;

const UPDATE_TODO = gql`
  mutation updateTodo($id: uuid!, $data: todos_set_input!) {
    update_todos_by_pk(_set: $data, pk_columns: { id: $id }) {
      id
      done
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

const useTodos = ({ input }) => {
  const todosQuery = useQuery(TODOS);

  const [createTodo, { loading: createTodoLoading }] = useMutation(
    CREATE_TODO,
    {
      update(cache, { data }) {
        const newTodo = data?.insert_todos_one;
        if (!newTodo) return;

        cache.modify({
          fields: {
            todos(existingTodos = [], { toReference }) {
              return [...existingTodos, toReference(newTodo)];
            },
          },
        });
      },
      onCompleted() {
        input.value = "";
      },
    }
  );

  const [updateTodo, { loading: updateTodoLoading }] = useMutation(UPDATE_TODO);

  const [deleteTodo, { loading: deleteTodoLoading }] = useMutation(
    DELETE_TODO,
    {
      update(cache, { data }) {
        const removedTodo = data?.delete_todos_by_pk;
        if (!removedTodo) return;
        cache.evict({ id: cache.identify(removedTodo) });
      },
    }
  );

  const [deleteTodos, { loading: deleteTodosLoading }] = useMutation(
    DELETE_TODOS,
    {
      update(cache, { data }) {
        const removedTodos = data?.delete_todos?.returning || [];
        removedTodos.forEach((todo) => {
          cache.evict({ id: cache.identify(todo) });
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
