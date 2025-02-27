import { z } from "zod"


export const PostAuthActorTypeOtpVerifySchema = z.object({
  identifier: z.string().min(1),
  otp: z.string().min(1),
})

export type PostAuthActorTypeOtpVerifySchema = z.infer<typeof PostAuthActorTypeOtpVerifySchema>