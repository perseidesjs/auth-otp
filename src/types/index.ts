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
 *       entityIdAccessor: 'email'   // Will look up for an AuthIdentity with the customer's email as the `entity_id`
 *     }
 *   }
 *   ```
 *
 * You can also use an array of accessors to look up an actor by multiple fields.
 * For example, if you want to look up a customer by multiple fields:
 *   ```
 *   {
 *     customer: { accessor: ['phone', 'email'], entityIdAccessor: 'id' }
 *   }
 *   ```
 *
 *   The `accessor` defines which field to use when looking up an actor by the provided identifier.
 *   For example, with `accessor: 'phone'`, the system will check `customer.phone` to find matching customers.
 *
 *   The `entityIdAccessor` defines which field to use as the entity ID when looking up
 *   an AuthIdentity.
 *
 *   When using the `emailpass` auth provider for example, the `entityIdAccessor` will be the `email` field.
 *   This is because the `emailpass` auth provider uses the `email` field when creating an auth identity.
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
			 * accessor: ['phone', 'email'] // Will use the `phone` or `email` column of the actor as the identifier
			 */
			accessor: string | string[]

			/**
			 * The field name used to get the entity ID when looking up an AuthIdentity.
			 *
			 * @example
			 * entityIdAccessor: 'email' // Will use the `email` column of the actor as the entity ID in AuthIdentity
			 */
			entityIdAccessor: string
		}
	}

	http?: {
		/**
		 * Controls how errors are handled in HTTP responses when generating OTPs.
		 *
		 * @property {boolean} alwaysReturnSuccess - When true, always returns a success response regardless of errors
		 * to prevent data leakage. When false, actual errors will be returned in the response.
		 * @default true
		 *
		 * @property {boolean} throwOnError - When true, throws errors that occur during OTP generation.
		 * When false, errors are caught and handled according to alwaysReturnSuccess.
		 * @default false
		 */
		alwaysReturnSuccess?: boolean
		/**
		 * When true, logs a warning when an error occurs during OTP generation.
		 * @default true
		 */
		warnOnError?: boolean
	}
}

export enum Events {
	OTP_GENERATED = "otp.generated",
	PRE_REGISTER_OTP_GENERATED = "pre-register.otp.generated",
}

export type OtpGeneratedEvent = {
	identifier: string
	otp: string
}
