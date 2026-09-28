/**
 * STORE implementation that works with React's useSyncExternalStore hook.
 * *
 * REFERENCE FROM
 * https://react.dev/reference/react/useSyncExternalStore
 */

import { useSyncExternalStore } from 'react';

export type Store<Value> = {
  getValue: () => Value;
  setValue: (newValue: Value) => void;
  subscribe: (listener: () => void) => () => void;
};

export function makeStore<Value>(startingValue: Value): Store<Value> {
  let currentValue = startingValue;
  const listeners = new Set<() => void>();

  function getValue() {
    return currentValue;
  }

  // SAVE the new value, THEN allow all listeners to re-render
  function setValue(newValue: Value) {
    currentValue = newValue;
    for (const listener of listeners) {
      listener();
    }
  }

  // ADD a listener and RETURN a function that removes it again
  function subscribe(listener: () => void) {
    listeners.add(listener);
    return () => {
      listeners.delete(listener);
    };
  }

  return { getValue, setValue, subscribe };
}

// READ a store inside a component AND allow the component to re-render when the store changes
export function useStoreValue<Value>(store: Store<Value>): Value {
  return useSyncExternalStore(store.subscribe, store.getValue);
}
