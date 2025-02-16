import { AuthenticationInput, AuthIdentityProviderService, AuthenticationResponse, ICacheService, Logger, AuthIdentityDTO, IEventBusModuleService } from "@medusajs/framework/types"
import { AbstractAuthModuleProvider, ContainerRegistrationKeys, isDefined, MedusaError, Modules } from "@medusajs/framework/utils"
import { createHmac, randomBytes } from 'node:crypto'

type InjectedDependencies = {
  [Modules.CACHE]: ICacheService
  [ContainerRegistrationKeys.LOGGER]: Logger
}

type ProviderOptions = {
  /** the number of digits the OTP should have @default 6 */
  digits: number
  /** the time to live of the OTP in seconds @default 60 * 5 (5 minutes) */
  ttl: number
}

export const OTP_RETURN_KEY = "otp_generated"

class OTPAuthProviderService extends AbstractAuthModuleProvider {
  static identifier = "otp"

  protected cacheService_: ICacheService
  protected logger_: Logger
  protected options_: ProviderOptions

  constructor(container: InjectedDependencies, options: ProviderOptions = {
    digits: 6,
    ttl: 60 * 5
  }) {
    super()
    this.cacheService_ = container[Modules.CACHE]
    this.logger_ = container[ContainerRegistrationKeys.LOGGER]
    this.options_ = options
  }

  /**
   * Generate a TOTP (Time-based One-Time Password)
   * @param secret The secret to generate the OTP from
   * @param timeStep The time step to use for the OTP
   * @returns {string} The OTP
   */
  generateTOTP(secret: string, timeStep: number): string {
    const time = Math.floor(Date.now() / 1000 / timeStep)

    const hmac = createHmac('sha1', Buffer.from(secret, 'hex'))
    hmac.update(Buffer.from(time.toString(), 'utf-8'))
    const hmacResult = hmac.digest()

    const offset = hmacResult[hmacResult.length - 1] & 0xf
    const binary =
      ((hmacResult[offset] & 0x7f) << 24) |
      ((hmacResult[offset + 1] & 0xff) << 16) |
      ((hmacResult[offset + 2] & 0xff) << 8) |
      (hmacResult[offset + 3] & 0xff)

    return (binary % Math.pow(10, this.options_.digits)).toString().padStart(this.options_.digits, '0')
  }

  /**
   * Verify the OTP
   * @param key The key to verify the OTP for
   * @param providedOtp The OTP to verify
   * @returns {boolean} True if the OTP is valid, false otherwise
   */
  async verify(key: string, providedOtp: string): Promise<boolean> {
    const storedOtp = await this.cacheService_.get(`totp:${key}`)

    const isValid = storedOtp === providedOtp

    if (isValid) {
      await this.cacheService_.invalidate(`totp:${key}`)
    }

    return isValid
  }

  async authenticate(
    data: AuthenticationInput,
    authIdentityProviderService: AuthIdentityProviderService
  ): Promise<AuthenticationResponse> {

    const identifier = data.body?.identifier
    const otp = data.body?.otp

    if (!isDefined(identifier)) {
      return {
        success: false,
        error: "Identifier is required"
      }
    }


    const authIdentity = await authIdentityProviderService.retrieve({
      entity_id: identifier
    }).catch(() => null)

    if (!authIdentity) {
      // If there is no matching identity, we don't want to leak any information so we return a success
      this.logger_.warn(`No matching identity found`)
      return {
        success: true,
        location: OTP_RETURN_KEY
      }
    }

    if (isDefined(identifier) && !isDefined(otp)) {
      // We're in a case we want to send the OTP to the user
      const otpSecret = authIdentity.provider_identities?.find((provider) => provider.provider === this.identifier)?.provider_metadata?.otp_secret as string | undefined

      if (!otpSecret) {
        this.logger_.error(`No OTP secret found for identity ${authIdentity.id}, make sure that you have registered the identity with the OTP auth module`)
        return {
          success: false,
          error: "Invalid request"
        }
      }

      const totp = this.generateTOTP(otpSecret, this.options_.ttl)
      await this.cacheService_.set(`totp:${authIdentity.id}`, totp, this.options_.ttl)

      return {
        success: true,
        location: OTP_RETURN_KEY
      }
    }

    if (isDefined(identifier) && isDefined(otp)) {
      // We're in a case we want to verify the OTP
      const isValid = await this.verify(authIdentity.id, otp)

      if (!isValid) {
        return {
          success: false,
          error: `Invalid OTP for ${identifier}`
        }
      }

      return {
        success: true,
        authIdentity
      }
    }

    return {
      success: true,
      location: OTP_RETURN_KEY
    }
  }


  /**
   * Generate a random secret for the customer that will be used to generate the OTP
   * @returns {string} The secret
   */
  generateOTPSecret(): string {
    return randomBytes(32).toString('hex')
  }

  async register(
    data: AuthenticationInput,
    authIdentityProviderService: AuthIdentityProviderService
  ): Promise<AuthenticationResponse> {
    if (!isDefined(data.body?.identifier)) {
      return {
        success: false,
        error: "Identifier is required"
      }
    }

    let authIdentity: AuthIdentityDTO | undefined
    try {
      authIdentity = await authIdentityProviderService.retrieve({
        entity_id: data.body!.identifier,
      })
    } catch (error: unknown) {
      if (!(error instanceof MedusaError)) return { success: false, error: JSON.stringify(error) }

      if (error.type !== MedusaError.Types.NOT_FOUND) return { success: false, error: error.message }

      // If the identity is not found, we create it
      const otpSecret = this.generateOTPSecret()
      authIdentity = await authIdentityProviderService.create({
        entity_id: data.body!.identifier,
        provider_metadata: {
          otp_secret: otpSecret
        }
      })
    }

    if (!authIdentity) {
      return {
        success: false,
        error: "Failed to create identity"
      }
    }

    return {
      success: true,
      authIdentity
    }
  }
}

export default OTPAuthProviderService
