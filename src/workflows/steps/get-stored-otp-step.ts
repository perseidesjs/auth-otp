import type { ICacheService } from "@medusajs/framework/types"
import { Modules } from "@medusajs/framework/utils"
import { createStep, StepResponse } from "@medusajs/framework/workflows-sdk"

/**
 * Gets a stored OTP for a given key.
 *
 * @param input - The input for the step.
 * @param input.key - The key to get the OTP for.
 * @param input.tag - The tag for the cache key.
 */
export const getStoredOtpStep = createStep(
	"get-stored-otp",
	async (
		input: {
			key: string
			tag?: string
		},
		{ container },
	) => {
		const cacheService = container.resolve<ICacheService>(Modules.CACHE)
		const key = input.tag ? `${input.tag}:${input.key}` : input.key
		const cacheKey = `otp:${key}`
		const storedOtp = await cacheService.get<string>(cacheKey)

		if (!storedOtp) {
			throw new Error("OTP not found")
		}

		return new StepResponse({ storedOtp })
	},
)
