import { createWorkflow, when, WorkflowResponse } from "@medusajs/framework/workflows-sdk"
import { emitEventStep } from "@medusajs/medusa/core-flows"
import { Events, OtpOptions } from "../types"
import { getAuthIdentityStep } from "./steps/get-auth-identity-step"
import { generateOtpStep } from "./steps/generate-otp-step"
import { getActorStep } from "./steps/get-actor-step"
import { isDefined } from "@medusajs/framework/utils"

/**
 * This workflow is used to generate a TOTP (Time-based One-Time Password) for a given identifier.
 * It should only be used when the OTP plugin is configured as the main authentication provider.
 * This is a private workflow that is used internally by the `/api/auth/[actor_type]/otp/generate` API route.
 */
const generateSecondaryModeOtpWorkflow = createWorkflow(
  "generate-secondary-mode-otp",
  function (input: { identifier: string, actorType: string, actorOptions: Required<OtpOptions>['actorsOptions'][string] }) {
    const actorResult = getActorStep({
      identifier: input.identifier,
      actorType: input.actorType,
      actorOptions: input.actorOptions
    })


    const authIdentityResult = when(actorResult, ({ actor }) => isDefined(actor) && isDefined(actor.data) && actor.data.length > 0).then(() => getAuthIdentityStep({
      identifier: input.identifier,
      actorType: input.actorType,
      actorOptions: input.actorOptions,
      foundActor: actorResult.actor.data[0]
    }))


    const generatedOtpResult = when({ authIdentityResult }, (result) =>
      isDefined(result.authIdentityResult)
        && isDefined(result.authIdentityResult.authIdentity)
        && isDefined(result.authIdentityResult.authIdentity.id)
    ).then(() => generateOtpStep({
      authIdentityId: authIdentityResult!.authIdentity.id,
      identifier: input.identifier
    }))

    emitEventStep({
      eventName: Events.OTP_GENERATED,
      data: {
        identifier: input.identifier,
        otp: generatedOtpResult
      }
    })

    return new WorkflowResponse('OK')
  }
)

export default generateSecondaryModeOtpWorkflow


