/** Parse a fetch Response body as JSON; surface readable errors when nginx/HTML errors slip through. */
export async function readJsonResponse<T>(res: Response): Promise<T> {
  const text = await res.text();
  try {
    return JSON.parse(text) as T;
  } catch {
    const hint =
      res.status === 413
        ? "File too large. Images must be under 8MB and videos under 50MB."
        : `Request failed (${res.status}). The server returned an unexpected response — try a smaller file or contact support.`;
    throw new Error(hint);
  }
}
