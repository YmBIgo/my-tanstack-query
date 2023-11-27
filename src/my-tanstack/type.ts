export type QueryStatus = 'pending' | 'error' | 'success'

export type QueryFunction<TData, TQueryKey> =
    (context?: {queryKey: TQueryKey}) => TData | Promise<TData>

export type QueryObserverResult<TData, TError> = {
    status: string;
    data: TData | undefined;
    error: TError | null | undefined;
    isLoading: boolean;
    isError: boolean;
}