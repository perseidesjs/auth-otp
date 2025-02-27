import {
  MedusaRequest,
  MedusaResponse,
} from "@medusajs/framework/http"
import { type PostAuthActorTypeOtpGenerateSchema } from "./validators"
import generateProviderModeOtpWorkflow from "../../../../../workflows/generate-main-mode-otp"
import generateSecondaryModeOtpWorkflow from "../../../../../workflows/generate-secondary-mode-otp"
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


  if (pluginOptions.mode === 'main') {
    await generateProviderModeOtpWorkflow(req.scope).run({
      input: identifier
    })
  } else {
    await generateSecondaryModeOtpWorkflow(req.scope).run({
      input: {
        identifier,
        identifierKey: pluginOptions.identifierKey!,
        actorType
      }
    })
  }

  res.send('If an account exists with this identifier, an OTP will be sent to the user')
}