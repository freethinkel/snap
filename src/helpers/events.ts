export const wait = (ms: number) => new Promise((rslv) => setTimeout(rslv, ms));

export const debounce =
  (ms: number) =>
  <T extends (...p: any[]) => void>(cb: T): T => {
    let isCooldown = false;

    return function () {
      if (isCooldown) return;

      //@ts-ignore
      cb.apply(this, arguments);

      isCooldown = true;

      setTimeout(() => (isCooldown = false), ms);
    } as T;
  };

export const throttle =
  (ms: number) =>
  <T extends (...p: any[]) => void>(cb: T): T => {
    let isThrottled = false;
    let savedArgs: any;
    let savedThis: any;

    function wrapper() {
      if (isThrottled) {
        savedArgs = arguments;
        //@ts-ignore
        savedThis = this;
        return;
      }

      //@ts-ignore
      cb.apply(this, arguments);

      isThrottled = true;

      setTimeout(function () {
        isThrottled = false;
        if (savedArgs) {
          wrapper.apply(savedThis, savedArgs);
          savedArgs = savedThis = null;
        }
      }, ms);
    }

    return wrapper as T;
  };
