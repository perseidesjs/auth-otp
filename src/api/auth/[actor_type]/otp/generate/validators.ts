import { z } from "zod"


export const PostAuthActorTypeOtpGenerateSchema = z.object({
  identifier: z.string().min(1),
})

export type PostAuthActorTypeOtpGenerateSchema = z.infer<typeof PostAuthActorTypeOtpGenerateSchema>