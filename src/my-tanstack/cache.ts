import {Query, QueryState} from "./query";
import {matchQuery} from "./utils";
import type {QueryFilter} from "./utils";

export class Cache {
    queries: Map<string, Query<any, any>>;
    constructor(){
        this.queries = new Map<string, Query<any, any>>()
    }
    build<TData, TError>(queryKey: string, retryCount: number, retryDelay: number, state: QueryState<TData, TError>) {
        const queryHash = this.findOfGenerateRandId(queryKey);
        let query = this.get<TData, TError>(String(queryHash));
        if (!query) {
            query = new Query(queryKey, queryHash, state, retryCount, retryDelay)
            this.add(query);
        }
        return query;
    }
    get<TData, TError>(queryHash: string) {
        return this.queries.get(queryHash) as Query<TData, TError> | undefined
    }
    getAll(): Query<any, any>[] {
        return [...this.queries.values()];
    }
    add(query: Query<any, any>) {
        if (this.queries.has(query.queryHash)) return;
        this.queries.set(query.queryHash, query);
    }
    find(filter: QueryFilter): Query<any, any> | undefined {
        return this.getAll().find((query: Query<any, any>) => matchQuery(filter, query))
    }
    findAll(filter: QueryFilter): Query<any, any>[] {
        return Object.keys(filter).length > 0
            ? this.getAll().filter((query) => matchQuery(filter, query))
            : this.getAll();
    }
    findOfGenerateRandId(queryKey: string): string {
        const existsQueryKey = Object.values(this.queries);
        if (existsQueryKey.includes(queryKey)) {
            return Object.keys(this.queries).find((key) => this.queries.get(key)?.queryKey === queryKey) ?? "";
        }
        const existsQueryHash = Object.keys(this.queries);
        if (existsQueryHash.length === 10000000) {
            throw new Error("Max queryHash Key Number 10000000 exceeded.");
        }
        let newId = 0;
        let isLoop = true;
        while(isLoop) {
            const randomNumber = Math.random()*10000000;
            if (existsQueryHash.includes(String(randomNumber))) continue;
            newId = randomNumber;
            return String(newId);
        }
        return "";
    }
}