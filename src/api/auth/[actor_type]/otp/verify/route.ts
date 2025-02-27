import {
  MedusaRequest,
  MedusaResponse,
} from "@medusajs/framework/http"
import { type PostAuthActorTypeOtpVerifySchema } from "./validators"
import { ContainerRegistrationKeys, MedusaError } from "@medusajs/framework/utils"
import getPluginOptions from "../../../../../utils/get-plugin-options"
import verifyOtpWorkflow from "../../../../../workflows/verify-otp"
import { generateJwtTokenForAuthIdentity } from "@medusajs/medusa/api/auth/utils/generate-jwt-token"

export const POST = async (
  req: MedusaRequest<PostAuthActorTypeOtpVerifySchema>,
  res: MedusaResponse
) => {
  const { identifier, otp } = req.validatedBody
  const actorType = req.params.actor_type

  const configModule = req.scope.resolve(ContainerRegistrationKeys.CONFIG_MODULE)
  const pluginOptions = getPluginOptions(configModule)

  if (pluginOptions.mode === 'main') {
    console.warn(`OTP verification through the API route is not supported in main mode, please use the /api/auth/otp/verify endpoint instead`)
    throw new MedusaError(MedusaError.Types.INVALID_DATA, `Cannot verify OTP`)
  }

  const { result } = await verifyOtpWorkflow(req.scope).run({
    input: {
      identifier,
      otp,
      actorType,
      actorOptions: pluginOptions.actorsOptions![actorType]
    }
  })

  if (result.isValid) {
    const { http } = configModule.projectConfig
    const token = generateJwtTokenForAuthIdentity({ authIdentity: result.authIdentity!, actorType }, {
      secret: http.jwtSecret,
      expiresIn: http.jwtExpiresIn
    })

    res.send({
      token
    })
  } else {
    throw new MedusaError(MedusaError.Types.INVALID_DATA, `Invalid OTP`)
  }
}