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
   * The options for the actors.
   * Only used when `mode` is `secondary`, as the `main` mode will create a new auth identity no matter the identifier value passed.
   * @default { customer: { accessor: 'email' }, user: { accessor: 'email' } }
   */
  actorsOptions?: {
    [actorType: string]: {
      /**
       * The accessor to get the identifier from the actor.
       * @example
       * accessor: 'phone' // Will use the `phone` column of the actor as the identifier.
       */
      accessor: string
      /**
       * The accessor to get the entity id from the actor.
       * @example
       * entityIdAccessor: 'email' // Will use the `email` column of the actor as the entity id.
       */
      entityIdAccessor: string
    }
  }
}

export enum Events {
  OTP_GENERATED = 'otp.generated'
}

export type OtpGeneratedEvent = {
  identifier: string
  otp: string
}
