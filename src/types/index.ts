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
}

export enum Events {
  OTP_GENERATED = 'otp.generated'
}

export type OtpGeneratedEvent = {
  identifier: string
  otp: string
}
