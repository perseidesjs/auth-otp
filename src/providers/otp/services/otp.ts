import { AuthenticationInput, AuthIdentityProviderService, AuthenticationResponse, ICacheService, Logger, AuthIdentityDTO } from "@medusajs/framework/types"
import { AbstractAuthModuleProvider, ContainerRegistrationKeys, isDefined, MedusaError, Modules } from "@medusajs/framework/utils"
import { OtpUtils } from "../../../utils/otp"
import { OtpOptions } from "../../../types"

type InjectedDependencies = {
  [Modules.CACHE]: ICacheService
  [ContainerRegistrationKeys.LOGGER]: Logger
}

export const OTP_RETURN_KEY = "otp_generated"

export class OtpAuthProviderService extends AbstractAuthModuleProvider {
  static identifier = "otp"

  protected cacheService_: ICacheService
  protected logger_: Logger
  protected options_: OtpOptions

  constructor(container: InjectedDependencies, options: OtpOptions) {
    super()
    this.cacheService_ = container[Modules.CACHE]
    this.logger_ = container[ContainerRegistrationKeys.LOGGER]
    this.options_ = options || OtpUtils.DEFAULT_OPTIONS
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

    if (!isDefined(identifier) || !isDefined(otp)) {
      return {
        success: false,
        error: "Identifier and OTP are required"
      }
    }

    const authIdentity = await authIdentityProviderService.retrieve({
      entity_id: identifier
    }).catch(() => null)

    if (!authIdentity) {
      // If there is no matching identity, we don't want to leak any information so we return a success
      this.logger_.warn(`No matching identity found`)
      return {
        success: false,
        error: "Invalid OTP"
      }
    }
    // We're in a case we want to verify the OTP
    const isValid = await this.verify(authIdentity.id, otp)

    if (!isValid) {
      return {
        success: false,
        error: `Invalid OTP`
      }
    }

    return {
      success: true,
      authIdentity
    }
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
      authIdentity = await authIdentityProviderService.create({
        entity_id: data.body!.identifier,
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

  getOptions(): OtpOptions {
    return this.options_
  }
}

export default OtpAuthProviderService