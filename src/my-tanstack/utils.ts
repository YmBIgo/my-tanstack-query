import {Query} from "./query";

export type QueryTypeFilter = 'all' | 'active' | 'inactive';

export interface QueryFilter {
    queryKey?: string;
}


export function matchQuery(filter: QueryFilter, query: Query<any, any>) {
    const {queryKey} = filter;
    // queryKey のみ実装
    // FIXME: exact も実装したい
    if (queryKey) {
        return query.queryKey === queryKey;
    }
    return true;
}

export function sleep(timeout: number): Promise<void> {
    return new Promise((resolve, reject) => {
        setTimeout(resolve, timeout);
    })
}