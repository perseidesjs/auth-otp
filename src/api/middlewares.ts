import {
  defineMiddlewares,
  validateAndTransformBody,
} from "@medusajs/framework/http"
import { PostAuthActorTypeOtpGenerateSchema } from "./auth/[actor_type]/otp/generate/validators"
import { PostAuthActorTypeOtpVerifySchema } from "./auth/[actor_type]/otp/verify/validators"

export default defineMiddlewares({
  routes: [
    {
      matcher: "/auth/:actor_type/otp/generate",
      method: "POST",
      middlewares: [
        validateAndTransformBody(PostAuthActorTypeOtpGenerateSchema),
      ],
    },
    {
      matcher: "/auth/:actor_type/otp/verify",
      method: "POST",
      middlewares: [
        validateAndTransformBody(PostAuthActorTypeOtpVerifySchema),
      ],
    },
  ],
})