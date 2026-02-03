---
"@perseidesjs/auth-otp": minor
---

Add event priority configuration option

Developers can now configure priority levels for OTP events via plugin options:

```ts
import { EventPriority } from "@medusajs/framework/utils"
import { Events } from "@perseidesjs/auth-otp"

{
  resolve: "@perseidesjs/auth-otp",
  options: {
    events: {
      [Events.OTP_GENERATED]: { priority: EventPriority.CRITICAL },
      [Events.PRE_REGISTER_OTP_GENERATED]: { priority: EventPriority.HIGH }
    }
  }
}
```

Priority levels (from `@medusajs/framework/utils`):
- `CRITICAL` (10) - Highest priority
- `HIGH` (50)
- `DEFAULT` (100) - Used when not specified
- `LOW` (500)
- `LOWEST` (2097152)
