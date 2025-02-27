/**
 * Configuration options for the OTP authentication plugin.
 *
 * @property {number} digits - The number of digits the OTP should have. Default is 6.
 *
 * @property {number} ttl - The time-to-live of the OTP in seconds. Default is 300 (5 minutes).
 *
 * @property {Object} accessorsPerActor - Maps actor types (e.g., 'customer', 'user') to their identifier accessors.
 *   This configuration tells the OTP system how to find and identify different types of actors in your system.
 *   Only used when `mode` is `secondary`, as the `main` mode will create a new auth identity regardless of the identifier.
 *
 *   For example, if you want customers to authenticate using their phone number instead of email:
 *   ```
 *   {
 *     customer: {
 *       accessor: 'phone',       // Will look up customers by their phone field
 *       entityIdAccessor: 'id'   // Will use the customer's ID as the entity ID in AuthIdentity
 *     }
 *   }
 *   ```
 *
 *   The `accessor` defines which field to use when looking up an actor by the provided identifier.
 *   For example, with `accessor: 'phone'`, the system will check `customer.phone` to find matching customers.
 *
 *   The `entityIdAccessor` defines which field to use as the entity ID when creating or looking up
 *   an AuthIdentity. This is particularly important when integrating with other auth providers.
 *
 *   Default is: { customer: { accessor: 'email', entityIdAccessor: 'id' }, user: { accessor: 'email', entityIdAccessor: 'id' } }
 */
export type OtpOptions = {
  /** The number of digits the OTP should have. @default 6 */
  digits: number

  /** The time to live of the OTP in seconds. @default 60 * 5 (5 minutes) */
  ttl: number
  /**
   * Maps actor types to their identifier accessors for authentication.
   * This tells the system which fields to use when looking up actors and creating auth identities.
   *
   * Only used when `mode` is `secondary`, as the `main` mode will create a new auth identity
   * regardless of the identifier value passed.
   *
   * @example
   * // Allow customers to authenticate using phone numbers:
   * {
   *   customer: {
   *     accessor: 'phone',       // Will look up customers by their phone field
   *     entityIdAccessor: 'email'   // Will look up for an AuthIdentity with the customer's email as the `entity_id`
   *   }
   * }
   *
   * @default { customer: { accessor: 'email', entityIdAccessor: 'id' }, user: { accessor: 'email', entityIdAccessor: 'id' } }
   */
  accessorsPerActor?: {
    [actorType: string]: {
      /**
       * The field name used to look up an actor by the provided identifier.
       * For example, with `accessor: 'phone'`, the system will check `customer.phone` to find matching customers.
       *
       * @example
       * accessor: 'phone' // Will use the `phone` column of the actor as the identifier
       */
      accessor: string

      /**
       * The field name used to get the entity ID when creating or looking up an AuthIdentity.
       * This is particularly important when integrating with other auth providers.
       *
       * @example
       * entityIdAccessor: 'id' // Will use the `id` column of the actor as the entity ID in AuthIdentity
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
