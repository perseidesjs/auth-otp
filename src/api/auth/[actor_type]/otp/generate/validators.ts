import { z } from "@medusajs/framework/zod"

export const PostAuthActorTypeOtpGenerateSchema = z.object({
	identifier: z.string().min(1),
})

export type PostAuthActorTypeOtpGenerateSchema = z.infer<
	typeof PostAuthActorTypeOtpGenerateSchema
>
