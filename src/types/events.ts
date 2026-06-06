export interface IEventProvider {
  on: (event: string, cb: (data: unknown) => void) => void;
  emit: (event: string, data: unknown) => void;
  flush: () => void;
}
