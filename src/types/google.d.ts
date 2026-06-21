interface GoogleOAuthTokenResponse {
  access_token?: string
  expires_in?: number
  error?: string
  error_description?: string
}

interface GoogleOAuthClientError {
  message?: string
  type?: string
}

interface GoogleOAuthTokenClient {
  requestAccessToken(options?: { prompt?: string }): void
}

interface GoogleOAuthTokenClientConfig {
  client_id: string
  scope: string
  callback(response: GoogleOAuthTokenResponse): void
  error_callback?(error: GoogleOAuthClientError): void
}

interface Window {
  google?: {
    accounts: {
      oauth2: {
        initTokenClient(
          config: GoogleOAuthTokenClientConfig,
        ): GoogleOAuthTokenClient
      }
    }
  }
}
