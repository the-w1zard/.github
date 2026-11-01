import { useMatches } from "@remix-run/react";
import type { Locales } from "./get-client-locales";

export function useLocales(): Locales {
	let matches = useMatches();

	if (!matches) return undefined;
	if (matches.length === 0) return undefined;

	let [rootMatch] = matches;

	// check if rootMatch exists and has data
	if (!rootMatch) return undefined;
	if (!rootMatch.data) return undefined;

	let { data } = rootMatch;

	// check if data is an object and has locales
	if (typeof data !== "object") return undefined;
	if (data === null) return undefined;
	if (Array.isArray(data)) return undefined;
	if (!("locales" in data)) return undefined;

	let { locales } = data;

	// check the type of value of locales
	// it could be a string
	// or it could be an array of strings
	if (
		Array.isArray(locales) &&
		locales.every((value) => typeof value === "string")
	) {
		return locales;
	}

	if (typeof locales === "string") return [locales];

	// finally, return undefined
	return undefined;
}
