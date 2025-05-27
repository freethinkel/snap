import { emit, listen } from "@tauri-apps/api/event";
import { getCurrentWindow } from "@tauri-apps/api/window";

import { createEvent, createStore, sample } from "effector";

const appWindow = getCurrentWindow();

type Options<T> = {
  invalidate?: (store: T) => boolean;
  restoreMap?: (store: T) => T;
};

export const createSharedStore = <T>(
  name: string,
  initialValue: T,
  options?: Options<T>,
) => {
  const key = `snap__${name}`;
  const store = createStore(initialValue);

  const setValue = createEvent<T>();

  sample({
    clock: setValue,
    target: store,
  });

  try {
    if (localStorage.getItem(key)) {
      const cachedValue = JSON.parse(localStorage.getItem(key) || "") as T;
      if (!options?.invalidate?.(cachedValue)) {
        setValue(
          options?.restoreMap ? options?.restoreMap(cachedValue) : cachedValue,
        );
      }
    }
  } catch (_) {}

  let broadcast = true;

  store.watch((value) => {
    if (broadcast) {
      emit(key, { windowLabel: appWindow.label, value });
    }
    localStorage.setItem(key, JSON.stringify(value));
  });

  listen(key, (data) => {
    const { value, windowLabel } = data.payload as any;
    if (windowLabel !== appWindow.label) {
      broadcast = false;
      setValue(options?.restoreMap ? options?.restoreMap(value) : value);
      broadcast = true;
    }
  });

  return store;
};

export const createStoreFromPromise = <T>(promise: Promise<T>) => {
  const setValue = createEvent<T | null>();
  const $store = createStore<T | null>(null);

  sample({
    clock: setValue,
    target: $store,
  });

  promise.then((value) => setValue(value));

  return $store;
};
