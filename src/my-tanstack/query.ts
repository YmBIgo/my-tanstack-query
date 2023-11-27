import { QueryStatus, QueryFunction } from "./type";
import { createRetryer, Retryer } from "./retryer";

export interface QueryState<TData, TError> {
    data: TData | undefined;
    dataUpdateCount: number;
    error: TError | null | undefined;
    errorUpdateCount: number;
    fetchFailureCount: number;
    status: QueryStatus;
}

interface SuccessAction<TData> {
    data: TData | undefined
    type: "success"
}
interface ErrorAction<TError> {
    type: "error"
    error: TError
}
interface FailedAction<TError> {
    type: "failed"
    failureCount: number
    error: TError
}
interface InvalidAction {
    type: "invalidate"
}

export type Action<TData, TError> =
    | SuccessAction<TData>
    | FailedAction<TError>
    | ErrorAction<TError>
    // | InvalidAction

export class Query<TData, TError> {
    queryKey: string;
    queryHash: string;
    state: QueryState<TData, TError>;
    retryCount: number;
    retryDelay: number;
    retryer?: Retryer<TData>;
    promise?: Promise<TData>;

    constructor(queryKey: string,
                queryHash: string,
                state: QueryState<TData, TError>,
                retryCount: number,
                retryDelay: number) {
        this.queryKey = queryKey;
        this.queryHash = queryHash;
        this.state = state;
        this.retryCount = retryCount;
        this.retryDelay = retryDelay;
    }
    fetch(queryFn: QueryFunction<TData, string>):Promise<TData> {
        if (!queryFn) {
            return Promise.reject(new Error("lacking queryFn"));
        }
        const queryFnContext: {queryKey: string} = {queryKey: this.queryKey};
        this.retryer = createRetryer(
            () => queryFn(queryFnContext),
            (data: TData) => {
                this.dispatch({type: "success", data})
            },
            (failureCount: number, error: TError) => {
                this.dispatch({type: "failed", failureCount, error})
            },
            (error: TError) => {
                this.dispatch({type: "error", error})
            },
            this.retryCount,
            this.retryDelay
        )
        this.promise = this.retryer.promise;
        return this.promise;
    }
    dispatch(action: Action<TData, TError>) {
        const reducer = (state: QueryState<TData, TError>): QueryState<TData, TError> => {
            switch(action.type) {
                case "failed":
                    return {
                        ...state,
                        fetchFailureCount: action.failureCount
                    }
                case "success":
                    return {
                        ...state,
                        data: action.data,
                        dataUpdateCount: state.dataUpdateCount + 1,
                        status: "success",
                        error: null,
                        fetchFailureCount: 0
                    }
                case "error":
                    return {
                        ...state,
                        error: action.error as TError,
                        fetchFailureCount: state.fetchFailureCount + 1,
                        status: "error"
                    }
            }
        }
        this.state = reducer(this.state);
    }
}