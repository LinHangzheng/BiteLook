export interface TaskResult<T> {
  index: number;
  success: boolean;
  data?: T;
  error?: string;
}

export async function processConcurrently<TInput, TOutput>(
  items: TInput[],
  processor: (item: TInput, index: number) => Promise<TOutput>,
  options: {
    concurrency: number;
    onProgress?: (completed: number, total: number, result: TaskResult<TOutput>) => void;
    onError?: (index: number, error: Error) => void;
  }
): Promise<TaskResult<TOutput>[]> {
  const { concurrency, onProgress, onError } = options;
  const results: TaskResult<TOutput>[] = new Array(items.length);
  let completed = 0;

  // Create a queue of tasks with their indices
  const queue = items.map((item, index) => ({ item, index }));

  // Worker function that processes tasks from the queue
  const worker = async (): Promise<void> => {
    while (queue.length > 0) {
      const task = queue.shift();
      if (!task) break;

      try {
        const data = await processor(task.item, task.index);
        const result: TaskResult<TOutput> = {
          index: task.index,
          success: true,
          data,
        };
        results[task.index] = result;
        completed++;

        if (onProgress) {
          onProgress(completed, items.length, result);
        }
      } catch (error) {
        const err = error instanceof Error ? error : new Error(String(error));
        const result: TaskResult<TOutput> = {
          index: task.index,
          success: false,
          error: err.message,
        };
        results[task.index] = result;
        completed++;

        if (onError) {
          onError(task.index, err);
        }
        if (onProgress) {
          onProgress(completed, items.length, result);
        }
      }
    }
  };

  // Start N concurrent workers
  const workers = Array(Math.min(concurrency, items.length))
    .fill(null)
    .map(() => worker());

  await Promise.all(workers);

  return results;
}
