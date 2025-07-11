import { EventEmitter } from 'events';

export type AsyncTask<T> = () => Promise<T>;

export interface SerialExecutor {
  readonly isActive: boolean;

  size(): number;

  execute<T>(task: AsyncTask<T>, timeout?: number): Promise<T>;
}

export function createSerialExecutor(): SerialExecutor {
  return new SerialExecutorImpl();
}

export class SerialExecutorTimeoutError extends Error {
  constructor(key: string, timeout: number) {
    super();
    this.message = `execute:${key} was ${timeout} ms timeout`;
  }
}

type AsyncTaskRegistry<T> = {
  task: AsyncTask<T>;
  key: string;
};

class SerialExecutorImpl implements SerialExecutor {
  private readonly queue: AsyncTaskRegistry<any>[] = [];
  isActive = false;
  private count = 0;
  private readonly ee: EventEmitter = new EventEmitter();

  constructor() {
    this.queue = [];
    this.ee = new EventEmitter();
    this.isActive = false;
  }

  private _activate() {
    this.isActive = true;
    process.nextTick(() => this._execute());
  }

  size(): number {
    return this.queue.length;
  }

  private _generateUniqueKey() {
    this.count++;
    return `${this.count}-${new Date().getTime()}-${Math.random()}`;
  }

  async execute<T>(_task: AsyncTask<T>, timeout: null | number = null) {
    let task: AsyncTask<T | Error> = _task;
    const key = this._generateUniqueKey();
    if (timeout !== null) {
      const timeoutError = new SerialExecutorTimeoutError(key, timeout);
      task = () =>
        Promise.race([
          _task(),
          new Promise<Error>((resolve, reject) =>
            setTimeout(() => {
              reject(timeoutError);
            }, timeout),
          ),
        ]);
    }
    this.queue.push({
      task,
      key,
    });
    if (!this.isActive) this._activate();
    return new Promise<T>((resolve, reject) => {
      this.ee.once(`executed:${key}`, (err, result) => {
        err ? reject(err) : resolve(result);
      });
    });
  }

  private _dequeue<T>(): AsyncTaskRegistry<T> | undefined {
    return this.queue.shift();
  }

  private async _execute() {
    const reg = this._dequeue();
    if (reg) {
      try {
        const result = await reg.task();
        this.ee.emit(`executed:${reg.key}`, null, result);
      } catch (e) {
        this.ee.emit(`executed:${reg.key}`, e, null);
      } finally {
        process.nextTick(() => this._execute());
      }
    } else {
      this.isActive = false;
    }
  }
}
