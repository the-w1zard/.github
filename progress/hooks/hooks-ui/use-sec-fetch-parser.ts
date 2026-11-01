import {  useCallback } from "#sauron";

export function useSecFetchParser() {
  const parseSecFetchHeaders = useCallback((req: Request): SecFetchData | null => {
    const dest = req.headers.get("sec-fetch-dest");
    const mode = req.headers.get("sec-fetch-mode");
    const site = req.headers.get("sec-fetch-site");
    const user = req.headers.get("sec-fetch-user") === "?1";

    if (!dest || !mode || !site) return null;

    return { dest, mode, site, user };
  }, []);

  const parseFromHeadersObject = useCallback((headers: Record<string, string>): SecFetchData | null => {
    const dest = headers["sec-fetch-dest"];
    const mode = headers["sec-fetch-mode"];
    const site = headers["sec-fetch-site"];
    const user = headers["sec-fetch-user"] === "?1";

    if (!dest || !mode || !site) return null;

    return { dest, mode, site, user };
  }, []);

  const isSecFetchSupported = useCallback((req: Request): boolean => {
    return req.headers.has("sec-fetch-dest") || 
           req.headers.has("sec-fetch-mode") || 
           req.headers.has("sec-fetch-site");
  }, []);

  const validateSecFetch = useCallback((
    secFetchData: SecFetchData, 
    allowedSites: string[] = ["same-origin", "same-site"],
    allowedDests: string[] = ["document", "empty"]
  ): boolean => {
    return allowedSites.includes(secFetchData.site) && 
           allowedDests.includes(secFetchData.dest);
  }, []);

  return { 
    parseSecFetchHeaders, 
    parseFromHeadersObject, 
    isSecFetchSupported, 
    validateSecFetch 
  };
}


/**
 * 
 * import { json } from "@remix-run/node";
import type { LoaderFunctionArgs } from "@remix-run/node";
import { getSecFetchDest } from "./SecFetchParsers";

export async function loader({ request }: LoaderFunctionArgs) {
  const secFetchDest = getSecFetchDest(request);
  if (secFetchDest === "iframe") {
    // Handle iframe request differently
    return json({ message: "Request from an iframe" });
  }

  return json({ message: "Standard request" });
}



http://googleusercontent.com/immersive_entry_chip/1

#### Demo

Here is an example of how to use the rolling cookie timers middleware in your Remix `loader`.

```typescript
import { json } from "@remix-run/node";
import type { LoaderFunctionArgs } from "@remix-run/node";
import { createRollingCookieTimers } from "./RollingCookieTimers";

const rollingTimers = createRollingCookieTimers("my-session");

export async function loader({ request }: LoaderFunctionArgs) {
  const response = new Response();
  await rollingTimers({ request, response });

  return json({ message: "Cookie updated" }, { headers: response.headers });
}



http://googleusercontent.com/immersive_entry_chip/2

#### Demo

You can use this middleware to time different parts of your loader function.

```typescript
import { json } from "@remix-run/node";
import type { LoaderFunctionArgs } from "@remix-run/node";
import { createServerTiming } from "./ServerTiming";

const timing = createServerTiming();

export async function loader({ request }: LoaderFunctionArgs) {
  const response = new Response();

  timing.start("data-fetch");
  await new Promise(resolve => setTimeout(resolve, 500));
  const data = { message: "Hello, world!" };
  timing.end("data-fetch", "fetching data");

  timing.addHeaders({ request, response });

  return json(data, { headers: response.headers });
}



These files should give you a good starting point for your project. Let me know if you would like me to generate the next batch of components, including Singleton Middleware and Batcher Middleware. **/
