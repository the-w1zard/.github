import { useCallback, useEffect, useRef } from "#sauron";
import type {
	FetcherWithComponents,
	SubmitFunction,
	SubmitOptions,
} from "@remix-run/react";
import { useFetcher } from "@remix-run/react";

type SubmitTarget = Parameters<SubmitFunction>["0"];


type DebounceSubmitFunction = (
	target: SubmitTarget,
	options?: SubmitOptions & { debounceTimeout?: number },
) => void;

type DebouncedFetcher<Data = unknown> = Omit<
	FetcherWithComponents<Data>,
	"submit"
> & { submit: DebounceSubmitFunction };


export function useDebounceFetcher<Data>(
	opts?: Parameters<typeof useFetcher>[0],
) {
	let timeoutRef = useRef<Timer>(null);

	useEffect(() => {
		// no initialize step required since timeoutRef defaults undefined
		let timeout = timeoutRef.current;
		return () => {
			if (timeout) clearTimeout(timeout);
		};
	}, []);

	let fetcher = useFetcher<Data>(opts) as DebouncedFetcher<Data>;

	// Clone the original submit to avoid a recursive loop
	const originalSubmit = fetcher.submit;

	fetcher.submit = useCallback(
		(target, { debounceTimeout = 0, ...options } = {}) => {
			if (timeoutRef.current) clearTimeout(timeoutRef.current);
			if (!debounceTimeout || debounceTimeout <= 0) {
				return originalSubmit(target, options);
			}

			timeoutRef.current = setTimeout(() => {
				originalSubmit(target, options);
			}, debounceTimeout);
		},
		[originalSubmit],
	);

	return fetcher;
}
