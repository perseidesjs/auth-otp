import { ICacheService } from "@medusajs/framework/types"
import { Modules, ContainerRegistrationKeys } from "@medusajs/framework/utils"
import { createStep, StepResponse } from "@medusajs/framework/workflows-sdk"
import getPluginOptions from "../../utils/get-plugin-options"
import { OtpUtils } from "../../utils/otp"

export const generateOtpStep = createStep(
  "generate-otp",
  async (input: {
    authIdentityId: string
    identifier: string
  }, { container }) => {
    const cacheService = container.resolve<ICacheService>(Modules.CACHE)
    const configModule = container.resolve(ContainerRegistrationKeys.CONFIG_MODULE)
    const pluginOptions = getPluginOptions(configModule)

    const otp = OtpUtils.generateRandomOTP(pluginOptions.digits)
    const cacheKey = `totp:${input.authIdentityId}`

    await cacheService.set(cacheKey, otp, pluginOptions.ttl)

    return new StepResponse({ otp })
  }
)