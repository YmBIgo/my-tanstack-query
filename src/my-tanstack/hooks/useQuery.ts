import * as React from "react";
import {Observer} from "../observer";
import { QueryFunction } from "../type";

export const useQuery = (queryKey: string, queryFn: QueryFunction<any, any>, retryCount: number, retryDelay: number) => {
    const [observer] = React.useState(() => new Observer<any, any>(queryKey, queryFn, retryCount, retryDelay));
    const result = React.useSyncExternalStore(
        React.useCallback(
        (onStoreChange) => {
          const unsubscribe = observer.subscribe(onStoreChange);
          observer.createResult();
          return unsubscribe
        }
      , [observer, queryKey]),
      () => observer.getCurrentResult(),
      () => observer.getCurrentResult(),
    );
    React.useEffect(() => {
        observer.setOptions(queryKey, queryFn, retryCount, retryDelay);
    }, [queryKey]);

    return {result};
}