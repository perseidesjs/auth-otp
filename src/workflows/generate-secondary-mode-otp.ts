import { createWorkflow, when, WorkflowResponse } from "@medusajs/framework/workflows-sdk"
import { emitEventStep } from "@medusajs/medusa/core-flows"
import { Events } from "../types"
import { getAuthIdentityStep } from "./steps/get-auth-identity-step"
import { generateOtpStep } from "./steps/generate-otp-step"
import { isPresent } from "@medusajs/framework/utils"

/**
 * This workflow is used to generate a TOTP (Time-based One-Time Password) for a given identifier.
 * It should only be used when the OTP plugin is configured as the main authentication provider.
 * This is a private workflow that is used internally by the `/api/auth/[actor_type]/otp/generate` API route.
 */
const generateSecondaryModeOtpWorkflow = createWorkflow(
  "generate-secondary-mode-otp",
  function (input: { identifier: string, actorType: string }) {
    const authIdentityResult = getAuthIdentityStep({ identifier: input.identifier, actorType: input.actorType })

    const generatedOtpResult = when(
      authIdentityResult,
      (result) => !!result.authIdentity && !!result.authIdentity.id
    ).then(() => {
      return generateOtpStep({ authIdentityId: authIdentityResult.authIdentity.id, identifier: input.identifier })
    })

    when({ otp: generatedOtpResult?.otp }, (result) => isPresent(result.otp)).then(() => {
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

export default generateSecondaryModeOtpWorkflow


