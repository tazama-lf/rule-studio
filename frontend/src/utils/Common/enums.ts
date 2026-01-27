export const CookieStorage = 'cookie';
export const SessionStorage = 'SessionStorage';
export const LocalStorage = 'LocalStorage';

export type StorageType =
  | typeof CookieStorage
  | typeof SessionStorage
  | typeof LocalStorage;