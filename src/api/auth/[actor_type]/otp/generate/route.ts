import {
  MedusaRequest,
  MedusaResponse,
} from "@medusajs/framework/http"
import { type PostAuthActorTypeOtpGenerateSchema } from "./validators"
import generateSecondaryModeOtpWorkflow from "../../../../../workflows/generate-otp"
import { ContainerRegistrationKeys } from "@medusajs/framework/utils"
import getPluginOptions from "../../../../../utils/get-plugin-options"

export const POST = async (
  req: MedusaRequest<PostAuthActorTypeOtpGenerateSchema>,
  res: MedusaResponse
) => {
  const { identifier } = req.validatedBody
  const actorType = req.params.actor_type

  const configModule = req.scope.resolve(ContainerRegistrationKeys.CONFIG_MODULE)
  const pluginOptions = getPluginOptions(configModule)

  const accessorsPerActor = pluginOptions.accessorsPerActor![actorType]

  await generateSecondaryModeOtpWorkflow(req.scope).run({
    input: {
      identifier,
      actorType,
      accessorsPerActor
    }
  })

  res.send('If an account exists with this identifier, an OTP will be sent to the user')
}