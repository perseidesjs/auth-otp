import type { ICacheService } from "@medusajs/framework/types"
import { ContainerRegistrationKeys, Modules } from "@medusajs/framework/utils"
import { createStep, StepResponse } from "@medusajs/framework/workflows-sdk"
import getPluginOptions from "../../utils/get-plugin-options"
import { OtpUtils } from "../../utils/otp"

/**
 * Generates an OTP for a given key.
 *
 * @param input - The input for the step.
 * @param input.key - The key to generate the OTP for.
 * @param input.tag - The tag for the cache key.
 */
export const generateOtpStep = createStep(
	"generate-otp",
	async (
		input: {
			key: string
			tag?: string
		},
		{ container },
	) => {
		const cacheService = container.resolve<ICacheService>(Modules.CACHE)
		const configModule = container.resolve(
			ContainerRegistrationKeys.CONFIG_MODULE,
		)
		const pluginOptions = getPluginOptions(configModule)

		const otp = OtpUtils.generateRandomOTP(pluginOptions.digits)
		const key = input.tag ? `${input.tag}:${input.key}` : input.key
		const cacheKey = `otp:${key}`

		await cacheService.set(cacheKey, otp, pluginOptions.ttl)

		return new StepResponse({ otp })
	},
)
