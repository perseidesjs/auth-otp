import { createWorkflow, when, WorkflowResponse } from "@medusajs/framework/workflows-sdk"
import { getAuthIdentityStep } from "./steps/get-auth-identity-step"
import { getStoredOtpStep } from "./steps/get-stored-otp-step"
import { validateOtpStep } from "./steps/validate-otp-step"
import { isDefined, isPresent } from "@medusajs/framework/utils"
import { getActorStep } from "./steps/get-actor-step"
import { OtpOptions } from "../types"

/**
 * This workflow is used to verify a TOTP (Time-based One-Time Password) for a given identifier.
 * It should only be used when the OTP plugin is configured as the main authentication provider.
 * This is a private workflow that is used internally by the API routes for OTP verification.
 */
const verifyOtpWorkflow = createWorkflow(
  "verify-otp",
  function (input: { identifier: string, otp: string, actorType: string, accessorsPerActor: Required<OtpOptions>['accessorsPerActor'][string] }) {
    const actorResult = getActorStep({
      identifier: input.identifier,
      actorType: input.actorType,
      accessorsPerActor: input.accessorsPerActor
    })

    const authIdentityResult = when(actorResult, ({ actor }) => isDefined(actor) && isDefined(actor.data) && actor.data.length > 0).then(() => getAuthIdentityStep({
      identifier: input.identifier,
      actorType: input.actorType,
      accessorsPerActor: input.accessorsPerActor,
      foundActor: actorResult.actor.data[0]
    }))

    const storedOtpResult = when({ authIdentityResult }, (result) =>
      isDefined(result.authIdentityResult)
      && isDefined(result.authIdentityResult.authIdentity)
      && isDefined(result.authIdentityResult.authIdentity.id)
    ).then(() => {
      return getStoredOtpStep({
        authIdentityId: authIdentityResult!.authIdentity.id,
        identifier: input.identifier
      })
    })

    const validateOtpResult = when({ storedOtp: storedOtpResult?.storedOtp }, (result) =>
      isDefined(result.storedOtp)
    ).then(() => {
      return validateOtpStep({
        storedOtp: storedOtpResult?.storedOtp,
        otp: input.otp
      })
    })

    // If we reach this point, validation was successful
    return new WorkflowResponse({
      isValid: validateOtpResult?.isValid,
      authIdentity: authIdentityResult?.authIdentity
    })
  }
)

export default verifyOtpWorkflow


