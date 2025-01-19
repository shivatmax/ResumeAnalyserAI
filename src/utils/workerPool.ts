export class WorkerPool {
  private workers: Worker[] = [];
  private queue: Array<{
    file: File;
    // eslint-disable-next-line @typescript-eslint/no-explicit-any
    resolve: (value: any) => void;
    // eslint-disable-next-line @typescript-eslint/no-explicit-any
    reject: (reason?: any) => void;
  }> = [];
  private activeWorkers = 0;

  constructor(
    private poolSize: number,
    private workerScript: string,
    private workerOptions?: WorkerOptions
  ) {
    // Initialize worker pool
    for (let i = 0; i < poolSize; i++) {
      this.workers.push(new Worker(workerScript, workerOptions));
    }
  }

  async process(
    file: File,
    userId: string,
    jobId: string,
    // eslint-disable-next-line @typescript-eslint/no-explicit-any
    supabaseConfig: any
    // eslint-disable-next-line @typescript-eslint/no-explicit-any
  ): Promise<any> {
    return new Promise((resolve, reject) => {
      const worker = this.getAvailableWorker();

      if (worker && this.activeWorkers < this.poolSize) {
        this.processWithWorker(
          worker,
          file,
          userId,
          jobId,
          supabaseConfig,
          resolve,
          reject
        );
      } else {
        this.queue.push({ file, resolve, reject });
      }
    });
  }

  private getAvailableWorker(): Worker | null {
    return this.workers.find((worker) => worker.onmessage === null) || null;
  }

  private processWithWorker(
    worker: Worker,
    file: File,
    userId: string,
    jobId: string,
    // eslint-disable-next-line @typescript-eslint/no-explicit-any
    supabaseConfig: any,
    // eslint-disable-next-line @typescript-eslint/no-explicit-any
    resolve: (value: any) => void,
    // eslint-disable-next-line @typescript-eslint/no-explicit-any
    reject: (reason?: any) => void
  ) {
    this.activeWorkers++;

    worker.onmessage = (e) => {
      this.activeWorkers--;
      worker.onmessage = null;

      if (e.data.success) {
        resolve(e.data.result);
      } else {
        reject(e.data.error);
      }

      // Process next item in queue
      if (this.queue.length > 0) {
        const next = this.queue.shift()!;
        this.processWithWorker(
          worker,
          next.file,
          userId,
          jobId,
          supabaseConfig,
          next.resolve,
          next.reject
        );
      }
    };

    worker.postMessage({ file, userId, jobId, supabaseConfig });
  }
}
