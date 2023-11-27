import {sleep} from "./utils";

export interface Retryer<TData> {
    promise: Promise<TData>
    cancel: () => void
    cancelRetry: () => void
    continueRetry: () => void
}

export function createRetryer<TData, TError>(
    fn: () => TData | Promise<TData>,
    onSuccess: (data: TData) => void,
    onFail: (failureCount: number, error: TError) => void,
    onError: (error: TError) => void,
    retry: number | boolean | undefined,
    retryDeply: number
): Retryer<TData> {
    let isRetryCancelled = false
    let failureCount = 0
    let isResolved = false
    let promiseResolve: (data: TData) => void;
    let promiseReject: (error: TError) => void;
    const promise = new Promise<TData>((outerResolve, outerReject) => {
        promiseReject = outerReject;
        promiseResolve = outerResolve;
    });
    const cancel = (): void => {
        if (!isResolved) {
            reject(new Error("retry canceled"));
        }
    }
    const cancelRetry = () => {
        isRetryCancelled = true
    }
    const continueRetry = () => {
        isRetryCancelled = false
    }
    const resolve = (value: any) => {
        if (!isResolved) {
            isResolved = true;
            onSuccess(value);
            promiseResolve(value)
        }
    }
    const reject = (value: any) => {
        if (!isResolved) {
            isResolved = true;
            onError(value);
            // promiseReject(value);
        }
    }
    const run = () => {
        if (isResolved) return;
        let promiseOrValue: any
        try{
            promiseOrValue = fn();
        } catch(error) {
            promiseOrValue = Promise.reject(error)
        }
        Promise.resolve(promiseOrValue)
        .then(resolve)
        .catch((error) => {
            if (isResolved) return
            const retryCount = retry ?? 0;
            const shouldRetry =
                retryCount === true ||
                (typeof retryCount === "number" && failureCount < retryCount );
            if (isRetryCancelled || !shouldRetry) {
                reject(error);
                return;
            }
            failureCount++;
            onFail(failureCount, error);
            sleep(retryDeply).then(() => {
                if (isRetryCancelled) reject(error);
                else run();
            });
        })
    }
    run();

    return {
        promise,
        cancel,
        cancelRetry,
        continueRetry
    }
}