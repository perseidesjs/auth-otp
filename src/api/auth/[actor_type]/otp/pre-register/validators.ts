import { z } from "@medusajs/framework/zod"

export const PostAuthActorTypeOtpPreRegisterSchema = z.object({
	identifier: z.string().min(1),
})

export type PostAuthActorTypeOtpPreRegisterSchema = z.infer<
	typeof PostAuthActorTypeOtpPreRegisterSchema
>
