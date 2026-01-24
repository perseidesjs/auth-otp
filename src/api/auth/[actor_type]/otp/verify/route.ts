import { logger } from "@medusajs/framework"
import type { MedusaRequest, MedusaResponse } from "@medusajs/framework/http"
import {
	ContainerRegistrationKeys,
	MedusaError,
} from "@medusajs/framework/utils"
import { generateJwtTokenForAuthIdentity } from "@medusajs/medusa/api/auth/utils/generate-jwt-token"
import getPluginOptions from "../../../../../utils/get-plugin-options"
import verifyOtpWorkflow from "../../../../../workflows/verify-otp"
import type { PostAuthActorTypeOtpVerifySchema } from "./validators"

export const POST = async (
	req: MedusaRequest<PostAuthActorTypeOtpVerifySchema>,
	res: MedusaResponse,
) => {
	const { identifier, otp } = req.validatedBody
	const actorType = req.params.actor_type

	const configModule = req.scope.resolve(
		ContainerRegistrationKeys.CONFIG_MODULE,
	)
	const pluginOptions = getPluginOptions(configModule)

	try {
		const { result } = await verifyOtpWorkflow(req.scope).run({
			input: {
				identifier,
				otp,
				actorType,
				accessorsPerActor: pluginOptions.accessorsPerActor?.[actorType],
			},
		})

		if (result.isValid) {
			const { http } = configModule.projectConfig
			const token = await generateJwtTokenForAuthIdentity(
				{ authIdentity: result.authIdentity!, actorType },
				{
					secret: http.jwtSecret,
					expiresIn: http.jwtExpiresIn,
					options: http.jwtOptions,
				},
			)

			res.send({
				token,
			})
		} else {
			throw new MedusaError(MedusaError.Types.INVALID_DATA, `Invalid OTP`)
		}
	} catch (error) {
		if (pluginOptions.http?.alwaysReturnSuccess) {
			if (pluginOptions.http.warnOnError) {
				logger.error(error)
			}
			throw new MedusaError(MedusaError.Types.INVALID_DATA, `Invalid OTP`)
		}
		throw error
	}
}
