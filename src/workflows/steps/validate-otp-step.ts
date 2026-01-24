import { createStep, StepResponse } from "@medusajs/framework/workflows-sdk"

/**
 * Validates an OTP for a given stored OTP and OTP.
 *
 * @param input - The input for the step.
 * @param input.storedOtp - The stored OTP to validate.
 * @param input.otp - The OTP to validate.
 */
export const validateOtpStep = createStep(
	"validate-otp",
	async (input: { storedOtp: string | undefined; otp: string }) => {
		if (!input.storedOtp) {
			throw new Error("Stored OTP not found")
		}

		return new StepResponse({ isValid: input.storedOtp === input.otp })
	},
)
