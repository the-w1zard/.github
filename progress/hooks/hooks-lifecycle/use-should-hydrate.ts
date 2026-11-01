import { useMatches } from "#sauron";


export function useShouldHydrate() {
	return useMatches().some((match) => {
		if (!match.handle) return false;

		let { handle, data } = match;

		// handle must be an object to continue
		if (typeof handle !== "object") return false;
		if (handle === null) return false;
		if (Array.isArray(handle)) return false;
		if (!("hydrate" in handle)) return false;

		// get hydrate from handle (it may not exists)
		let hydrate = handle.hydrate as
			| undefined
			| boolean
			| ((data: unknown) => boolean);

		if (!hydrate) return false;

		if (typeof hydrate === "function") return hydrate(data);
		return hydrate;
	});
}
