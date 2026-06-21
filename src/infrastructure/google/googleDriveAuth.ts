export interface GoogleDriveTokenProvider {
  getAccessToken(scope: string): Promise<string>
}

interface CachedAccessToken {
  token: string
  scope: string
  expiresAt: number
}

interface CreateGoogleDriveTokenProviderOptions {
  now?: () => number
}

const GOOGLE_IDENTITY_SCRIPT_ID = 'google-identity-services'
const GOOGLE_IDENTITY_SCRIPT_URL = 'https://accounts.google.com/gsi/client'

let googleIdentityLoadPromise: Promise<void> | undefined

const TOKEN_EXPIRY_MARGIN_MS = 30_000
const FALLBACK_TOKEN_LIFETIME_MS = 60_000

const loadGoogleIdentityServices = (): Promise<void> => {
  if (window.google?.accounts.oauth2) {
    return Promise.resolve()
  }
  if (googleIdentityLoadPromise) {
    return googleIdentityLoadPromise
  }

  googleIdentityLoadPromise = new Promise<void>((resolve, reject) => {
    const existingScript = document.getElementById(GOOGLE_IDENTITY_SCRIPT_ID)
    const script =
      existingScript instanceof HTMLScriptElement
        ? existingScript
        : document.createElement('script')

    script.addEventListener(
      'load',
      () => {
        if (window.google?.accounts.oauth2) {
          resolve()
        } else {
          reject(new Error('Google Identity Services failed to initialize'))
        }
      },
      { once: true },
    )
    script.addEventListener(
      'error',
      () => reject(new Error('Unable to load Google Identity Services')),
      { once: true },
    )

    if (!existingScript) {
      script.id = GOOGLE_IDENTITY_SCRIPT_ID
      script.src = GOOGLE_IDENTITY_SCRIPT_URL
      script.async = true
      script.defer = true
      document.head.append(script)
    }
  })

  return googleIdentityLoadPromise
}

export const createGoogleDriveTokenProvider = (
  options: CreateGoogleDriveTokenProviderOptions = {},
): GoogleDriveTokenProvider => {
  const now = options.now ?? Date.now
  let cachedAccessToken: CachedAccessToken | undefined

  const requestNewAccessToken = (
    clientId: string,
    scope: string,
  ): Promise<string> =>
    new Promise<string>((resolve, reject) => {
      const oauth2 = window.google?.accounts.oauth2
      if (!oauth2) {
        reject(new Error('Google Identity Services is unavailable'))
        return
      }

      const tokenClient = oauth2.initTokenClient({
        client_id: clientId,
        scope,
        callback: (response) => {
          if (response.error || !response.access_token) {
            reject(
              new Error(
                response.error_description ??
                  response.error ??
                  'Google authorization did not return an access token',
              ),
            )
            return
          }

          const lifetimeMs = response.expires_in
            ? Math.max(
                response.expires_in * 1_000 - TOKEN_EXPIRY_MARGIN_MS,
                0,
              )
            : FALLBACK_TOKEN_LIFETIME_MS
          cachedAccessToken = {
            token: response.access_token,
            scope,
            expiresAt: now() + lifetimeMs,
          }
          resolve(response.access_token)
        },
        error_callback: (error) =>
          reject(
            new Error(
              error.message ?? error.type ?? 'Google authorization failed',
            ),
          ),
      })
      tokenClient.requestAccessToken()
    })

  return {
    getAccessToken: (scope) => {
      if (
        cachedAccessToken?.scope === scope &&
        cachedAccessToken.expiresAt > now()
      ) {
        return Promise.resolve(cachedAccessToken.token)
      }

      cachedAccessToken = undefined
      const clientId = import.meta.env.VITE_GOOGLE_CLIENT_ID?.trim()
      if (!clientId) {
        return Promise.reject(
          new Error('VITE_GOOGLE_CLIENT_ID is not configured'),
        )
      }

      if (window.google?.accounts.oauth2) {
        return requestNewAccessToken(clientId, scope)
      }

      return loadGoogleIdentityServices().then(() =>
        requestNewAccessToken(clientId, scope),
      )
    },
  }
}

export const googleDriveTokenProvider = createGoogleDriveTokenProvider()
