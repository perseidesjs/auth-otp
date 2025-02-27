import { createWorkflow, WorkflowResponse } from "@medusajs/framework/workflows-sdk"
import { emitEventStep } from "@medusajs/medusa/core-flows"
import { getAuthIdentityStep } from "./steps/get-auth-identity-step"
import { Events } from "../types"
import OtpAuthProviderService from "../providers/otp/services/otp"
import { generateOtpStep } from "./steps/generate-totp-step"

/**
 * This workflow is used to generate a TOTP (Time-based One-Time Password) for a given identifier.
 * It should only be used when the OTP plugin is configured as the main authentication provider.
 * This is a private workflow that is used internally by the `/api/auth/[actor_type]/otp/generate` API route.
 */
const generateMainModeOtpWorkflow = createWorkflow(
  "generate-main-mode-otp",
  function (identifier: string) {
    const { authIdentity } = getAuthIdentityStep({ identifier, provider: OtpAuthProviderService.identifier })
    const { otp } = generateOtpStep({ authIdentity, identifier })

    emitEventStep({
      eventName: Events.OTP_GENERATED,
      data: {
        identifier,
        otp
      }
    })

    return new WorkflowResponse('OK')
  }
)

export default generateMainModeOtpWorkflow


