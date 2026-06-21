import type { GoogleHttpTransport } from './googleHttpTransport'

const assertSuccessfulResponse = async (response: Response): Promise<void> => {
  if (!response.ok) {
    const details = await response.text()
    throw new Error(
      `Google API request failed (${response.status} ${response.statusText})${
        details ? `: ${details}` : ''
      }`,
    )
  }
}

const requestJson = async <T>(
  url: string,
  init: RequestInit,
): Promise<T> => {
  const response = await fetch(url, init)
  await assertSuccessfulResponse(response)
  return (await response.json()) as T
}

export const fetchGoogleHttpTransport: GoogleHttpTransport = {
  getJson: <T>(url: string, accessToken: string) =>
    requestJson<T>(url, {
      headers: { Authorization: `Bearer ${accessToken}` },
    }),

  getText: async (url, accessToken) => {
    const response = await fetch(url, {
      headers: { Authorization: `Bearer ${accessToken}` },
    })
    await assertSuccessfulResponse(response)
    return response.text()
  },

  postMultipart: <T>(
    url: string,
    accessToken: string,
    metadata: Record<string, unknown>,
    content: string,
    contentType: string,
  ) => {
    const boundary = `tomato-planner-${crypto.randomUUID()}`
    const body = [
      `--${boundary}`,
      'Content-Type: application/json; charset=UTF-8',
      '',
      JSON.stringify(metadata),
      `--${boundary}`,
      `Content-Type: ${contentType}`,
      '',
      content,
      `--${boundary}--`,
      '',
    ].join('\r\n')

    return requestJson<T>(url, {
      method: 'POST',
      headers: {
        Authorization: `Bearer ${accessToken}`,
        'Content-Type': `multipart/related; boundary=${boundary}`,
      },
      body,
    })
  },

  patchMedia: <T>(
    url: string,
    accessToken: string,
    content: string,
    contentType: string,
  ) =>
    requestJson<T>(url, {
      method: 'PATCH',
      headers: {
        Authorization: `Bearer ${accessToken}`,
        'Content-Type': contentType,
      },
      body: content,
    }),
}
