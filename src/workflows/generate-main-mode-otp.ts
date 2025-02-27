import { createWorkflow, when, WorkflowResponse } from "@medusajs/framework/workflows-sdk"
import { emitEventStep } from "@medusajs/medusa/core-flows"
import { getAuthIdentityStep } from "./steps/get-auth-identity-step"
import { Events } from "../types"
import OtpAuthProviderService from "../providers/otp/services/otp"
import { generateOtpStep } from "./steps/generate-otp-step"

/**
 * This workflow is used to generate a TOTP (Time-based One-Time Password) for a given identifier.
 * It should only be used when the OTP plugin is configured as the main authentication provider.
 * This is a private workflow that is used internally by the `/api/auth/[actor_type]/otp/generate` API route.
 */
const generateMainModeOtpWorkflow = createWorkflow(
  "generate-main-mode-otp",
  function (input: { identifier: string, actorType: string }) {
    const authIdentityResult = getAuthIdentityStep({ identifier: input.identifier, provider: OtpAuthProviderService.identifier, actorType: input.actorType })
    const generatedOtpResult = when(authIdentityResult, (result) => !!result.authIdentity && !!result.authIdentity.id).then(() => {
      return generateOtpStep({ authIdentityId: authIdentityResult.authIdentity.id, identifier: input.identifier })
    })

    when({ otp: generatedOtpResult?.otp }, (result) => !!result.otp).then(() => {
      emitEventStep({
        eventName: Events.OTP_GENERATED,
        data: {
          identifier: input.identifier,
          otp: generatedOtpResult
        }
      })
    })

    return new WorkflowResponse('OK')
  }
)

export default generateMainModeOtpWorkflow


