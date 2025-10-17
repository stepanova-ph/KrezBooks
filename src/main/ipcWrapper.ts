export interface IpcResponse<T = any> {
  success: boolean;
  data?: T;
  error?: string;
}

export async function handleIpcRequest<T>(
  handler: () => Promise<T>
): Promise<IpcResponse<T>> {
  try {
    const data = await handler();
    return { success: true, data };
  } catch (error) {
    console.error('IPC handler error:', error);
    return {
      success: false,
      error: error instanceof Error ? error.message : 'Unknown error',
    };
  }
}