export interface GoogleHttpTransport {
  getJson<T>(url: string, accessToken: string): Promise<T>
  getText(url: string, accessToken: string): Promise<string>
  postMultipart<T>(
    url: string,
    accessToken: string,
    metadata: Record<string, unknown>,
    content: string,
    contentType: string,
  ): Promise<T>
  patchMedia<T>(
    url: string,
    accessToken: string,
    content: string,
    contentType: string,
  ): Promise<T>
}
