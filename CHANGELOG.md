# @perseidesjs/auth-otp

## 3.1.0

### Minor Changes

- 6e8b60a: Upgrade to Medusa 2.13.0 and use @medusajs/framework/zod

## 3.0.1

### Patch Changes

- 78d71d4: Remove assets from package

## 3.0.0

### Major Changes

- 7860241: V3 : Upgraded to latest Medusa dependencies and allowed jwtOptions to be passed to the /verify API route

## 2.1.2

### Patch Changes

- 60a2fe9: Upgraded peerDependencies

## 2.1.1

### Patch Changes

- 28b08d4: Fixed the way we access the `app_metadata` inside the `get-auth-identity-step` by handling the `null` value

## 2.1.0

### Minor Changes

- ee82ee9: Upgraded to latest versions of Medusa

## 2.0.1

### Patch Changes

- 1f55b7d: Keywords update for better discoverability

## 2.0.0

### Major Changes

- bbc6414: Changed the plugin license to MIT

## 1.4.0

### Minor Changes

- 2ea3222: Enhance OTP authentication process with direct access for recently registered users

## 1.3.0

### Minor Changes

- 23dd317: Add pre-registration OTP workflow and validation
- a26f49f: Update OTP workflow steps to use 'key' instead of 'authIdentityId' and 'identifier'

### Patch Changes

- 8939555: Update OTP generation step to use 'tag' instead of 'purpose'

## 1.2.0

### Minor Changes

- b855685: Initial release
