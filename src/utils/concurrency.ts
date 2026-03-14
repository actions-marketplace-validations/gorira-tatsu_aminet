export class Semaphore {
  private queue: Array<() => void> = [];
  private running = 0;

  constructor(private readonly concurrency: number) {}

  async acquire(): Promise<void> {
    if (this.running < this.concurrency) {
      this.running++;
      return;
    }
    return new Promise<void>((resolve) => {
      this.queue.push(resolve);
    });
  }

  release(): void {
    this.running--;
    const next = this.queue.shift();
    if (next) {
      this.running++;
      next();
    }
  }

  async run<T>(fn: () => Promise<T>): Promise<T> {
    await this.acquire();
    try {
      return await fn();
    } finally {
      this.release();
    }
  }
}

export async function mapConcurrent<T, R>(
  items: T[],
  concurrency: number,
  fn: (item: T) => Promise<R>,
): Promise<R[]> {
  const semaphore = new Semaphore(concurrency);
  return Promise.all(items.map((item) => semaphore.run(() => fn(item))));
}
