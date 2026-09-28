export function getErrorMessage(error: unknown): string {

  // CHECK if it's a proper Error object (most of the time it is)
  if (error instanceof Error) {
    return error.message;
  }

  // CHECK if it's a string instead
  if (typeof error === 'string') {
    return error;
  }

  // OTHERWISE just turn error into a readable string
  return String(error);
}
