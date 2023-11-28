import * as React from "react";
import {useQuery} from "./my-tanstack/hooks/useQuery"
import axios from "axios";

export const App = () => {
  const [todoId, setTodoId] = React.useState<number>(1);
  const {result} = useQuery(`hoge${todoId}`, () => {
    return axios.get(`https://jsonplaceholder.typicode.com/todos/${todoId}`).then(res => res.data);
   }, 3, 3000);
  const onClickIncrement = async() => {
    setTodoId(todoId+1);
  }
  const onClickDecrement = async() => {
    if (todoId === 1) return;
    setTodoId(todoId-1);
  }
  if (result?.isLoading) {
    return (
      <p>Loading...</p>
    )
  }
  if (result?.isError) {
    return (
      <p>Error</p>
    )
  }
  return(
    <div>
      Hello Qiita!!
      <p>user id : {result?.data?.userId}</p>
      <p>title : {result?.data?.title}</p>
      <p>id : {result?.data?.id}</p>
      <button onClick={onClickIncrement}>increment</button>
      <button onClick={onClickDecrement}>decrement</button>
      {/*result?.data.map((todo: any) => {
        return (
          <div>
            <p>
              {todo.userId}
              {todo.title}
            </p>
          </div>
        )
      })*/}
    </div>
  );
};