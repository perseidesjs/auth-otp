import { AuthIdentityDTO, ICacheService } from "@medusajs/framework/types"
import { Modules, ContainerRegistrationKeys } from "@medusajs/framework/utils"
import { createStep, StepResponse } from "@medusajs/framework/workflows-sdk"
import getPluginOptions from "../../utils/get-plugin-options"
import { OtpUtils } from "../../utils/otp"

export const generateOtpStep = createStep(
  "generate-otp",
  async (input: {
    authIdentity: AuthIdentityDTO
    identifier: string
  }, { container }) => {
    const cacheService = container.resolve<ICacheService>(Modules.CACHE)
    const configModule = container.resolve(ContainerRegistrationKeys.CONFIG_MODULE)
    const pluginOptions = getPluginOptions(configModule)

    const otp = OtpUtils.generateRandomOTP(pluginOptions.digits)

    // Store the OTP in the cache with the configured TTL
    await cacheService.set(`totp:${input.authIdentity.id}`, otp, pluginOptions.ttl)

    return new StepResponse({
      ...input,
      otp,
    })
  }
)