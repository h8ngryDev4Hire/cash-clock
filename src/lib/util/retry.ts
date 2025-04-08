/**
 * Utility for retrying operations that might fail temporarily
 */

/**
 * Options for retrying an operation
 */
export interface RetryOptions {
  attempts: number;     // Number of attempts to try
  delay: number;        // Milliseconds to wait between attempts
  backoff?: boolean;    // Whether to use exponential backoff
  onRetry?: (attempt: number, error: Error) => void; // Called before each retry
}

/**
 * Function type for async operations that can be retried
 */
export type AsyncFunction<T> = (...args: any[]) => Promise<T>;

/**
 * Retry a function with configured retry logic
 * 
 * @param fn The async function to retry
 * @param options Retry configuration options
 * @param args Arguments to pass to the function
 * @returns Promise resolving to the function's result
 * @throws The last error if all attempts fail
 */
export async function retry<T>(
  fn: AsyncFunction<T>, 
  options: RetryOptions = { attempts: 3, delay: 500, backoff: true },
  ...args: any[]
): Promise<T> {
  let lastError: Error;
  
  for (let attempt = 1; attempt <= options.attempts; attempt++) {
    try {
      return await fn(...args);
    } catch (error) {
      lastError = error instanceof Error ? error : new Error(String(error));
      
      // If this is the last attempt, don't wait, just throw
      if (attempt === options.attempts) {
        throw lastError;
      }
      
      // Call onRetry callback if provided
      if (options.onRetry) {
        options.onRetry(attempt, lastError);
      }
      
      // Wait before next attempt
      const delayTime = options.backoff 
        ? options.delay * Math.pow(2, attempt - 1) 
        : options.delay;
        
      await new Promise(resolve => setTimeout(resolve, delayTime));
    }
  }
  
  // This should never be reached but TypeScript requires it
  throw lastError!;
} 