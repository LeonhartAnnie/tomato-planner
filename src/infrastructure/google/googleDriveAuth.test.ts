import { afterEach, beforeEach, describe, expect, it, vi } from 'vitest'
import { createGoogleDriveTokenProvider } from './googleDriveAuth'
import { GOOGLE_DRIVE_APPDATA_SCOPE } from './googleDriveTypes'

describe('Google Drive token provider', () => {
  let tokenCallback: (response: GoogleOAuthTokenResponse) => void =
    () => undefined
  const requestAccessToken = vi.fn()
  const initTokenClient = vi.fn(
    (config: GoogleOAuthTokenClientConfig): GoogleOAuthTokenClient => {
      tokenCallback = config.callback
      return { requestAccessToken }
    },
  )

  beforeEach(() => {
    vi.stubEnv('VITE_GOOGLE_CLIENT_ID', 'test-client-id')
    requestAccessToken.mockClear()
    initTokenClient.mockClear()
    window.google = {
      accounts: { oauth2: { initTokenClient } },
    }
  })

  afterEach(() => {
    vi.unstubAllEnvs()
    window.google = undefined
  })

  it('requests authorization immediately when Google Identity Services is ready', () => {
    const provider = createGoogleDriveTokenProvider()

    const accessToken = provider.getAccessToken(GOOGLE_DRIVE_APPDATA_SCOPE)

    expect(requestAccessToken).toHaveBeenCalledOnce()
    tokenCallback({ access_token: 'drive-token', expires_in: 3600 })
    return expect(accessToken).resolves.toBe('drive-token')
  })

  it('reuses an unexpired in-memory token for the same scope', async () => {
    const provider = createGoogleDriveTokenProvider()
    const firstToken = provider.getAccessToken(GOOGLE_DRIVE_APPDATA_SCOPE)
    tokenCallback({ access_token: 'drive-token', expires_in: 3600 })
    await firstToken

    await expect(
      provider.getAccessToken(GOOGLE_DRIVE_APPDATA_SCOPE),
    ).resolves.toBe('drive-token')
    expect(initTokenClient).toHaveBeenCalledOnce()
    expect(requestAccessToken).toHaveBeenCalledOnce()
  })

  it('requests a new token after the cached token expires', async () => {
    let currentTime = 0
    const provider = createGoogleDriveTokenProvider({
      now: () => currentTime,
    })
    const firstToken = provider.getAccessToken(GOOGLE_DRIVE_APPDATA_SCOPE)
    tokenCallback({ access_token: 'first-token', expires_in: 60 })
    await firstToken

    currentTime = 31_000
    const secondToken = provider.getAccessToken(GOOGLE_DRIVE_APPDATA_SCOPE)

    expect(requestAccessToken).toHaveBeenCalledTimes(2)
    tokenCallback({ access_token: 'second-token', expires_in: 60 })
    await expect(secondToken).resolves.toBe('second-token')
  })
})
