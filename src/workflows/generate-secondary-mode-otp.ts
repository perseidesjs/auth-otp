import { createWorkflow, WorkflowResponse } from "@medusajs/framework/workflows-sdk"
import { emitEventStep } from "@medusajs/medusa/core-flows"
import { Events } from "../types"
import { getAuthIdentityStep } from "./steps/get-auth-identity-step"
import { generateOtpStep } from "./steps/generate-totp-step"

/**
 * This workflow is used to generate a TOTP (Time-based One-Time Password) for a given identifier.
 * It should only be used when the OTP plugin is configured as the main authentication provider.
 * This is a private workflow that is used internally by the `/api/auth/[actor_type]/otp/generate` API route.
 */
const generateSecondaryModeOtpWorkflow = createWorkflow(
  "generate-secondary-mode-otp",
  function (input: { identifier: string, identifierKey: string, actorType: string }) {
    const { authIdentity } = getAuthIdentityStep({ identifier: input.identifier, actorType: input.actorType })
    const { otp } = generateOtpStep({ authIdentity, identifier: input.identifier })

    emitEventStep({
      eventName: Events.OTP_GENERATED,
      data: {
        identifier: input.identifier,
        otp
      }
    })

    return new WorkflowResponse('OK')
  }
)

export default generateSecondaryModeOtpWorkflow


