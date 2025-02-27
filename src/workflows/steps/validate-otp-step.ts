import { createStep, StepResponse } from "@medusajs/framework/workflows-sdk"

export const validateOtpStep = createStep(
  "validate-otp",
  async (input: {
    storedOtp: string | undefined
    otp: string
  }) => {
    if (!input.storedOtp) {
      throw new Error("Stored OTP not found")
    }

    return new StepResponse({ isValid: input.storedOtp === input.otp })
  }
)