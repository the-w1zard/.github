import { useMemo } from "#sauron";
import { useFetchers, useNavigation, useRevalidator } from "@remix-run/react";

export function useGlobalNavigationState() {
	let { state: navigationState } = useNavigation();
	let { state: revalidatorState } = useRevalidator();
	let fetchers = useFetchers();

	return useMemo(
		function getGlobalNavigationState() {
			return [
				navigationState,
				// The type cast here is used to remove RevalidatorState from the union
				revalidatorState as "idle" | "loading",
				...fetchers.map((fetcher) => fetcher.state),
			];
		},
		[navigationState, revalidatorState, fetchers],
	);
}



