import '@mui/material/styles'

// MD3 colour roles that MUI's palette has no slot for. Declared here so
// `theme.palette.surfaceContainerHigh` type-checks everywhere instead of
// components reaching back into `tokens.ts` for raw hex.
//
// NOTE: this file must NOT be named `theme.d.ts`. A `.d.ts` sitting next to a
// `.ts` of the same name is treated by TypeScript as that file's generated
// declaration output and is silently excluded from the program, which makes
// the augmentation below vanish with no error.
declare module '@mui/material/styles' {
  interface Palette {
    surfaceContainerHigh: string
    outlineVariant: string
    outline: string
    glassSurface: string
    glassBorder: string
  }

  interface PaletteOptions {
    surfaceContainerHigh?: string
    outlineVariant?: string
    outline?: string
    glassSurface?: string
    glassBorder?: string
  }
}
