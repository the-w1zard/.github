import { useCallback, useEffect, useRef } from "#sauron";
import type { SubmitFunction, SubmitOptions } from "@remix-run/react";
import { useSubmit } from "@remix-run/react";

type SubmitTarget = Parameters<SubmitFunction>["0"];


export function useDebounceSubmit() {
	let timeoutRef = useRef<Timer | undefined>(null);

	useEffect(() => {
		// no initialize step required since timeoutRef defaults undefined
		let timeout = timeoutRef.current;
		return () => {
			if (timeout) clearTimeout(timeout);
		};
	}, []);

	// Clone the original submit to avoid a recursive loop
	const originalSubmit = useSubmit();

	const submit = useCallback(
		(
			target: SubmitTarget,
			options?: SubmitOptions & {
				/** Submissions within this timeout will be canceled */
				debounceTimeout?: number;
			},
		) => {
			if (timeoutRef.current) clearTimeout(timeoutRef.current);
			if (!options?.debounceTimeout || options.debounceTimeout <= 0) {
				return originalSubmit(target, options);
			}

			return new Promise<void>((resolve) => {
				timeoutRef.current = setTimeout(() => {
					resolve(originalSubmit(target, options));
				}, options.debounceTimeout);
			});
		},
		[originalSubmit],
	);

	return submit;
}
