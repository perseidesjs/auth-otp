import type { MedusaRequest, MedusaResponse } from "@medusajs/framework/http"
import { ContainerRegistrationKeys } from "@medusajs/framework/utils"
import getPluginOptions from "../../../../../utils/get-plugin-options"
import preRegisterCheckWorkflow from "../../../../../workflows/pre-register-check"
import type { PostAuthActorTypeOtpPreRegisterSchema } from "./validators"

export const POST = async (
	req: MedusaRequest<PostAuthActorTypeOtpPreRegisterSchema>,
	res: MedusaResponse,
) => {
	const logger = req.scope.resolve(ContainerRegistrationKeys.LOGGER)

	const { identifier } = req.validatedBody
	const actorType = req.params.actor_type

	const configModule = req.scope.resolve(
		ContainerRegistrationKeys.CONFIG_MODULE,
	)
	const pluginOptions = getPluginOptions(configModule)

	const accessorsPerActor = pluginOptions.accessorsPerActor?.[actorType]

	await preRegisterCheckWorkflow(req.scope)
		.run({
			input: {
				identifier,
				actorType,
				accessorsPerActor,
			},
		})
		.catch((error) => {
			if (pluginOptions.http?.alwaysReturnSuccess) {
				if (pluginOptions.http.warnOnError) {
					logger.error(error)
				}
				return
			}
			throw error
		})

	res.send({
		message:
			"Please validate the OTP to continue with the registration process.",
	})
}
