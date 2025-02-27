export type OtpOptions = {
  /** the number of digits the OTP should have @default 6 */
  digits: number
  /** the time to live of the OTP in seconds @default 60 * 5 (5 minutes) */
  ttl: number
  /**
   * The mode of the OTP plugin.
   * - 'main': Use OTP as the primary auth provider. Creates new auth identities and overrides other providers.
   * - 'secondary': Use OTP alongside existing auth providers (e.g. email/password) as an additional authentication method that will generate JWT tokens on the fly.
   * @default 'main'
   */
  mode: 'main' | 'secondary'
  /**
   * The key to use as identifier when in secondary mode.
   * This allows sending OTP to different channels like email or phone.
   * @example 'email' or 'phone'
   * Only used when `mode` is 'secondary'
   * @default 'email'
   */
  identifierKey?: string
}

export enum Events {
  OTP_GENERATED = 'otp.generated'
}

export type OtpGeneratedEvent = {
  identifier: string
  otp: string
}
