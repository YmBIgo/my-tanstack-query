import { Query, QueryState } from "./query";
import { Cache } from "./cache";
import { QueryFunction, QueryObserverResult } from "./type";
import { Subscribable } from "./subscribable";

export class Observer<TData, TError> extends Subscribable<any> {
    currentQuery?: Query<TData, TError>;
    currentQueryCache?: Cache;
    currentQueryResult?: QueryObserverResult<TData, TError>;
    queryKey: string;
    queryFn: QueryFunction<TData, string>;
    retryCount: number;
    retryDelay: number;
    state: QueryState<TData, TError>;

    constructor(queryKey: string, queryFn: QueryFunction<TData, string>, retryCount: number, retryDelay: number, state?: QueryState<TData, TError>) {
        super();
        this.currentQueryCache = new Cache();
        this.queryKey = queryKey;
        this.queryFn = queryFn;
        this.retryCount = retryCount;
        this.retryDelay = retryDelay;
        if (!state) this.state = {
            data: undefined,
            dataUpdateCount: 0,
            error: undefined,
            errorUpdateCount: 0,
            fetchFailureCount: 0,
            status: "pending"
        };
        else this.state = state;
        this.setOptions();
    }
    protected onSubscribe(): void {
        if (this.listeners.size === 1) {
            this.createResult();
        }
    }
    protected onUnsubscribe(): void {
        if (!this.hasListeners()) {
            this.destroy()
        }
    }
    destroy(): void {
        this.listeners = new Set()
    }
    async setOptions(queryKey?: string, queryFn?: QueryFunction<TData, string>, retryCount?: number, retryDelay?: number) {
        const prevQuery = this.currentQuery;
        // if (queryKey === this.queryKey && queryFn === this.queryFn)
        this.setQueryKey(queryKey);
        this.setQueryFn(queryFn);
        this.setRetry(retryCount, retryDelay);
        this.updateQuery();
        if (prevQuery !== this.currentQuery && this.currentQuery?.state.status !== "error") {
            await this.executeFetch()
        }
        this.createResult();
    }
    updateQuery() {
        const query = this.currentQueryCache?.build(this.queryKey, this.retryCount, this.retryDelay, this.state);
        if (query === this.currentQuery) return;
        this.currentQuery = query;
    }
    executeFetch(): Promise<TData> {
        this.createResult();
        const existsQuery = this.currentQueryCache?.find({queryKey: this.currentQuery?.queryKey})
        if (existsQuery?.state.status === "success"){
            this.currentQuery = existsQuery;
            return Promise.resolve(this.currentQuery?.state.data!);
        }
        return this.currentQuery!.fetch(this.queryFn);
    }
    createResult() {
        const state = this.currentQuery?.state;
        this.currentQueryResult = {
            status: state?.status!,
            data: state?.data,
            error: state?.error,
            isLoading: state?.status === "pending",
            isError: state?.status === "error"
        }
        this.listeners.forEach((listener) => {
            listener(this.currentQueryResult)
        })
    }
    async getOptimisticResult() {
        this.updateQuery();
        await this.executeFetch();
        const result = this.createResult();
        return result;
    }
    getCurrentResult() {
        return this.currentQueryResult;
    }
    setQueryKey(queryKey?: string) {
        if (queryKey) this.queryKey = queryKey;
    }
    setQueryFn(queryFn?: QueryFunction<TData, string>) {
        if (queryFn) this.queryFn = queryFn;
    }
    setRetry(retryCount?: number, retryDelay?: number) {
        if (retryCount) this.retryCount = retryCount;
        if (retryDelay) this.retryDelay = retryDelay;
    }
}
