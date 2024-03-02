import { useState, useEffect } from 'react';
import { useReactTable, getCoreRowModel, getPaginationRowModel, getSortedRowModel, flexRender, RowData } from '@tanstack/react-table';
import { useForm, SubmitHandler } from 'react-hook-form';
import axios from 'axios';
import Modal from './Modal';


declare module '@tanstack/react-table' {
  // eslint-disable-next-line @typescript-eslint/no-unused-vars
  interface TableMeta<TData extends RowData> {
    updateData: (rowIndex: number, value: unknown) => void
  }
}


interface Todo {
  id: number;
  title: string;
  completed: boolean;
  actions: number;
}

interface TodoForm {
  title: string;
}

function App() {
  const [todos, setTodos] = useState<Todo[]>([]);
  const { register, handleSubmit, reset, formState: { errors } } = useForm<TodoForm>();
  const { register: registerEdit, handleSubmit: handleSubmitEdit, reset: resetEdit, formState: formStateEdit } = useForm<Todo>();
  const [formData, setFormData] = useState<Todo | null>(null);

  const tableInstance = useReactTable({
    columns: [
      { accessorKey: 'id', header: 'ID' },
      { accessorKey: 'title', header: 'Title' },
      { accessorKey: 'completed', header: 'Completed' },
    ],
    data: todos,
    getCoreRowModel: getCoreRowModel(),
    getPaginationRowModel: getPaginationRowModel(),
    getSortedRowModel: getSortedRowModel(),
    meta: {
      updateData: (rowIndex, value) => {
        setTodos(old =>
          old.map((row, index) => {
            if (index === rowIndex) {
              return {
                ...old[rowIndex]!,
                title: value,
              } as Todo
            }
            return row
          })
        )
      },
    },
  });


  const fetchTodos = async () => {
    try {
      const response = await axios.get<Todo[]>('https://jsonplaceholder.typicode.com/todos');
      setTodos(response.data.map((todo) => ({ ...todo, actions: todo.id })));
    } catch (error) {
      alert('Error fetching todos')
      console.error('Error fetching todos:', error);
    }
  };

  const addTodo: SubmitHandler<TodoForm> = async (data) => {
    try {
      const response = await axios.post<Todo>('https://jsonplaceholder.typicode.com/todos', data);
      setTodos((prevTodos) => [{ ...response.data, actions: response.data.id }, ...prevTodos]);
      reset();
    } catch (error) {
      console.error('Error adding todo:', error);
    }
  };

  const cancelEditTodo = () => {
    setFormData(null);
  };

  const editTodo: SubmitHandler<Todo> = async (data) => {
    try {
      await axios.put(`https://jsonplaceholder.typicode.com/todos/${data.id}`, data);
      setTodos((prevTodos) => {
        return prevTodos.map((todo) =>
          todo.id === data.id ? { ...todo, title: data.title } : todo
        );
      });
      setFormData((prevFormData) => ({
        ...prevFormData!,
        title: data.title,
      }));
      tableInstance.options.meta?.updateData(tableInstance.getRowModel().rows.find(row => row.original.id == data.id)?.index as number, data.title)
      cancelEditTodo();
    } catch (error) {
      alert('Error editing todo...')
      console.error('Error editing todo:', error);
    }
  };

  const deleteTodo = async (id: number) => {
    try {
      await axios.delete(`https://jsonplaceholder.typicode.com/todos/${id}`);
      setTodos((prevTodos) => prevTodos.filter((todo) => todo.id !== id));
    } catch (error) {
      alert('Error deleting todo...')
      console.error('Error deleting todo:', error);
    }
  };

  const toggleTodoStatus = async (id: number, completed: boolean) => {
    try {
      await axios.patch(`https://jsonplaceholder.typicode.com/todos/${id}`, { completed: !completed });
      setTodos((prevTodos) => {
        return prevTodos.map((todo) =>
          todo.id === id ? { ...todo, completed: !completed } : todo
        );
      });
    } catch (error) {
      alert('Error updating todo...')
      console.error('Error toggling todo status:', error);
    }
  };

  useEffect(() => {
    fetchTodos();
  }, []);

  return (
    <>
      <div className="container mx-auto p-4">
        <h1 className="text-3xl font-bold mb-4 text-center">Todo App</h1>

        <form onSubmit={handleSubmit(addTodo)} className="mb-4 max-w-5xl mx-auto">
          <div className="flex flex-col lg:flex-row gap-4">
            <input
              {...register('title', { required: 'Todo title is required' })}
              type="text"
              placeholder="Todo Title"
              className={`mr-2 p-2 border rounded focus:outline-none focus:border-blue-500 flex-grow ${errors.title ? 'border-red-500' : ''}`}
            />
            <button type="submit" className="bg-blue-500 text-white p-2 rounded">
              Add Todo
            </button>
          </div>
          {errors.title && <p className="text-red-500 text-sm mt-1">{errors.title.message}</p>}
        </form>

        <div className="relative overflow-x-auto">
          <table className="w-full text-sm text-left text-gray-500 table-auto max-w-5xl mx-auto">
            <thead className="text-xs text-gray-700 uppercase bg-gray-50">
              {tableInstance.getHeaderGroups().map((headerGroup) => (
                <tr key={headerGroup.id}>
                  {headerGroup.headers.map((header) => (
                    <th key={header.id} scope="col" className="px-6 py-3">
                      {header.isPlaceholder ? null : flexRender(header.column.columnDef.header, header.getContext())}
                    </th>
                  ))}
                  <th scope="col" className="px-6 py-3">
                    Actions
                  </th>
                </tr>
              ))}
            </thead>
            <tbody>
              {tableInstance.getRowModel().rows.map((row) => (
                <tr key={row.id} className="bg-white border-b">
                  {row.getVisibleCells().map((cell) => (
                    <td key={cell.id} className="px-6 py-4">
                      {cell.column.columnDef.header === 'Completed' ? (
                        <button
                          onClick={() => toggleTodoStatus(row.original.id, row.original.completed)}
                          className={`bg-${row.original.completed ? 'green' : 'yellow'}-500 text-white font-bold bg-opacity-80 text-xs p-1 rounded`}
                        >
                          {row.original.completed ? 'Finished' : 'Pending'}
                        </button>
                      ) : cell.column.columnDef.header === 'Title' ? (
                        <>
                          {formData && formData.id === row.original.id ? (
                            <form onSubmit={handleSubmitEdit(editTodo)} className="w-full">
                              <div className='flex'>
                                <input {...registerEdit('id')} type="hidden" value={row.original.id} />
                                <input
                                  {...registerEdit('title', { required: 'Todo title is required' })}
                                  type="text"
                                  className={`mr-2 p-2 border rounded focus:outline-none focus:border-green-500 flex-grow ${errors.title ? 'border-red-500' : ''
                                    }`}
                                  value={formData.title}
                                  onChange={(e) => setFormData({ ...formData, title: e.target.value })}
                                />
                                <div className='flex gap-2'>
                                  <button type="submit" className="bg-blue-500 text-white p-2 rounded">
                                    Save
                                  </button>
                                  <button
                                    type="button"
                                    onClick={() => cancelEditTodo()}
                                    className="bg-yellow-500 text-white p-2 rounded"
                                  >
                                    Cancel
                                  </button>
                                </div>
                              </div>
                                {formStateEdit.errors.title && (
                                  <p className="text-red-500 text-sm mt-1">{formStateEdit.errors.title.message}</p>
                                )}
                            </form>
                            ) : row.original.title
                          }
                        </>
                      ) : (
                        flexRender(cell.column.columnDef.cell, cell.getContext())
                      )}
                    </td>
                  ))}
                  <td className="px-6 py-4">
                    <div className='flex gap-2'>
                      {!formData || formData.id !== row.original.id ? (
                        <button
                          onClick={() => {
                            resetEdit()
                            setFormData({ ...row.original });
                          }}
                          className="bg-blue-500 text-white p-2 rounded mr-2"
                        >
                          Edit
                        </button>
                      ) : null}
                      <button onClick={() => deleteTodo(row.original.id)} className="bg-red-500 text-white p-2 rounded">
                        Delete
                      </button>
                    </div>
                  </td>
                </tr>
              ))}
            </tbody>
          </table>
        </div>
      </div>
      <Modal />
    </>
  );
}

export default App;
