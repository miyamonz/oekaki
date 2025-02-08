import { atom } from "jotai";

// postMessageをフィルタしたうえで、特定の条件にマッチしたらなにかするみたいな書き方のほうがいいだろう
const messageEventAtom = atom<MessageEvent | null>(null);
messageEventAtom.onMount = (set) => {
  const handler = (event: MessageEvent) => {
    set(event);
  };
  window.addEventListener("message", handler);
  return () => {
    window.removeEventListener("message", handler);
  };
};
export const messageEventFromOutsideAtom = atom((get) => {
  const event = get(messageEventAtom);
  if (event?.origin === window.location.origin) return null;
  return event;
});
