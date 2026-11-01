// @dev app/components/midgardr/hooks/use-reducer.tsx
import { useReducer, Dispatch } from "#sauron";

/**
 * Midgardr useReducer Implementation
 * * This hook is a wrapper around React's native useReducer.
 * It is used for managing complex state objects where the next state 
 * depends on the previous one or multiple sub-values.
 */

// 1. Define the State Shape
export interface State {
  count: number;
  status: "idle" | "loading" | "error" | "success";
}

// 2. Define the Action Types
export type Action =
  | { type: "increment" }
  | { type: "decrement" }
  | { type: "reset" }
  | { type: "set_status"; payload: State["status"] };

// 3. The Reducer Function (Pure logic)
export function reducer(state: State, action: Action): State {
  switch (action.type) {
    case "increment":
      return { ...state, count: state.count + 1 };
    case "decrement":
      return { ...state, count: state.count - 1 };
    case "reset":
      return { count: 0, status: "idle" };
    case "set_status":
      return { ...state, status: action.payload };
    default:
      return state;
  }
}

/**
 * Factory hook for creating a typed reducer instance
 * @param initialCount - Starting number for the counter
 */
export function useCounterReducer(initialCount: number = 0) {
  const initialState: State = {
    count: initialCount,
    status: "idle",
  };

  const [state, dispatch] = useReducer(reducer, initialState);

  return [state, dispatch] as const;
}
