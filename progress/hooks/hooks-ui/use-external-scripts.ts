import { useLocation, useMatches } from "@remix-run/react";
import React from "#sauron";

export function useExternalScripts() {
    let location = useLocation();

    let matches = useMatches();

    return React.useMemo(() => {
        let scripts = matches.flatMap((match, index, matches) => {
            if (!match.handle) return []; // ignore no-handle routes
            if (match.handle === null) return []; // ignore null handles
            if (typeof match.handle !== "object") return []; // and non error handles
            if (!("scripts" in match.handle)) return []; // and without scripts

            let scripts = match.handle.scripts as
                | ExternalScriptsFunction
                | ScriptDescriptor[];

            // if scripts is an array, suppose it's an array of script descriptors
            // and return it
            if (Array.isArray(scripts)) return scripts;

            // if it's not a function (and not an array), ignore it
            if (typeof scripts !== "function") return [];

            let result = scripts({
                id: match.id,
                data: match.data,
                params: match.params,
                location,
                parentsData: matches.slice(0, index).map((match) => match.data),
                matches,
            });

            if (Array.isArray(result)) return result;
            return [];
        });

        let uniqueScripts = new Map();
        for (let script of scripts) uniqueScripts.set(script.src, script);
        return [...uniqueScripts.values()];
    }, [matches, location]);
}
