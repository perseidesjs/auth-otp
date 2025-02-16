<p align="center">
  <a href="https://www.github.com/perseidesjs">
  <picture>
    <source media="(prefers-color-scheme: dark)" srcset="./.github/dark_mode.png" width="128" height="128">
    <source media="(prefers-color-scheme: light)" srcset="./.github/light_mode.png" width="128" height="128">
    <img alt="Perseides logo" src="./.github/light_mode.png">
    </picture>
  </a>
</p>
<h1 align="center">
  @perseidesjs/auth-otp
</h1>

<p align="center">
  <img src="https://img.shields.io/npm/v/@perseidesjs/auth-otp" alt="npm version">
  <img src="https://img.shields.io/github/license/perseidesjs/auth-otp" alt="GitHub license">
</p>

<h4 align="center">
  <a href="https://perseides.org">Website</a> |
  <a href="https://www.medusajs.com">Medusa</a>
</h4>

<p align="center">
  An OTP Auth Provider for Medusa 2.x
</p>

> [!WARNING]
> This package is currently in alpha. Features may change without notice. Feel free to submit feature requests and bug reports through [GitHub Issues](https://github.com/perseidesjs/auth-otp/issues).

<p align="center">
  <img src="./.github/preview.gif" alt="Preview of @perseidesjs/auth-otp in action">
</p>

## Features

- 🔐 Secure OTP-based authentication for Medusa 2.x
- ⚡ Easy integration with existing Medusa auth system
- ⚙️ Configurable OTP length and expiration
- 🔧 Built with TypeScript for better type safety

## Prerequisites

- Medusa Server (v2.x)
- Node.js (v16 or later)
- Redis (for OTP storage)

## Installation

1. Install the package using your preferred package manager:

```bash
npm install @perseidesjs/auth-otp
# or
yarn add @perseidesjs/auth-otp
# or
pnpm add @perseidesjs/auth-otp
```

2. Add the OTP provider to your Medusa configuration (`medusa-config.js`):

```ts
// In your medusa-config.js
module.exports = {
  // ... other configurations
  modules: [
    {
      resolve: "@medusajs/medusa/auth",
      options: {
        providers: [
          {
            resolve: "@perseidesjs/auth-otp/providers/otp",
            id: "otp",
            dependencies: [Modules.CACHE, ContainerRegistrationKeys.LOGGER]
          },
        ],
      },
    }
  ],
}
```

## Configuration Options

The OTP provider can be configured with the following options:

```ts
{
  resolve: "@perseidesjs/auth-otp/providers/otp",
  id: "otp",
  dependencies: [Modules.CACHE, ContainerRegistrationKeys.LOGGER],
  options: {
    // Number of digits in the OTP code (default: 6)
    digits: 6,
    
    // Time-to-live for OTP codes in seconds (default: 300 - 5 minutes)
    ttl: 60 * 5,
    
    // Additional options will be documented as they become available
  }
}
```

## License

This project is licensed under the [MIT License](LICENSE).