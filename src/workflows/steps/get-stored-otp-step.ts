import { AuthIdentityDTO, ICacheService } from "@medusajs/framework/types"
import { Modules } from "@medusajs/framework/utils"
import { createStep, StepResponse, transform } from "@medusajs/framework/workflows-sdk"

export const getStoredOtpStep = createStep(
  "get-stored-otp",
  async (input: {
    authIdentityId: string
    identifier: string,
  }, { container }) => {
    const cacheService = container.resolve<ICacheService>(Modules.CACHE)
    const storedOtp = await cacheService.get<string>(`totp:${input.authIdentityId}`)

    if (!storedOtp) {
      throw new Error("OTP not found")
    }

    return new StepResponse({ storedOtp })
  }
)