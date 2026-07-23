import { Box, Stack, Typography } from '@mui/material'
import type { CertificateModel } from './certificateModel'

// The income certificate, as a page.
//
// One component serves as both the on-screen preview and the printed sheet, so
// there is no second renderer to drift from, and `@page` gives it real A4
// geometry.
//
// Colours are literal rather than palette roles: a printed document has no dark
// mode, the same exception AGENTS.md records for the PDF.
//
// Direction is the MODEL's, not the app's, so an English certificate reads LTR
// while the interface stays Persian. Everything below uses logical properties
// (`textAlign: start`, `marginInline*`) to follow the `dir` on the root rather
// than the app-wide RTL cache.

const INK = '#18191b'
const MUTED = '#494b50'
// Carries the smallest type on the page: the footnote, the average basis, the
// serial label and the «به حروف» label. The design's #7c7e83 measured 4.06:1 on
// the sheet and 3.75:1 on TINT, under the 4.5:1 bar on both. Darkened in HSL
// lightness only (222.9° hue and 2.7% saturation held, 50% to 44.5%) by the
// least that clears both: 4.96:1 on #ffffff, 4.58:1 on TINT. #707176 also
// clears, but at 4.5006:1 on TINT, which is thinner than one rounding step.
const FAINT = '#6e7075'
const RULE = '#c8cbcf'
const HAIRLINE = '#e3e5e8'
const TINT = '#f4f6fa'
const BRAND = '#3460d6'

// Nothing on this sheet is set smaller. The footnote sat at 8.5px, which is
// 6.4pt on printed A4, below what any print style guide allows, and contrast
// does not rescue type that small. Three sizes were raised to meet this.
const FLOOR = 9.5

export interface IncomeCertificateProps {
  model: CertificateModel
  variant?: 'page' | 'preview'
}

export const IncomeCertificate = ({ model, variant = 'page' }: IncomeCertificateProps) => {
  const page = variant === 'page'

  return (
    <Box
      dir={model.direction}
      lang={model.locale}
      sx={{
        backgroundColor: '#ffffff',
        color: INK,
        textAlign: 'start',
        boxSizing: 'border-box',
        width: page ? '210mm' : '100%',
        minHeight: page ? '297mm' : 0,
        marginInline: page ? 'auto' : 0,
        padding: page ? '18mm 16mm' : 0,
        boxShadow: page ? '0 1px 3px rgba(24,25,27,.16), 0 8px 32px rgba(24,25,27,.10)' : 'none',
        '@media print': {
          width: 'auto',
          minHeight: 0,
          padding: 0,
          boxShadow: 'none',
        },
      }}
    >
      {/* Letterhead. The issuing tool names itself plainly: a document that
          overclaims its own authority is discarded the moment a clerk catches
          it, and takes everything attached to it along. */}
      <Stack direction="row" sx={{ alignItems: 'flex-start', justifyContent: 'space-between', gap: 3 }}>
        <Box>
          <Typography sx={{ color: BRAND, fontSize: 11, fontWeight: 700, letterSpacing: '.06em', mb: 0.75 }}>{model.issuer}</Typography>
          <Typography component="h1" sx={{ fontSize: 24, fontWeight: 700, lineHeight: 1.25 }}>
            {model.title}
          </Typography>
          <Typography sx={{ color: MUTED, fontSize: 11, mt: 0.5 }}>{model.subtitle}</Typography>
        </Box>

        <Box sx={{ textAlign: 'end', flexShrink: 0 }}>
          <Typography sx={{ color: FAINT, fontSize: FLOOR, letterSpacing: '.04em' }}>{model.serialLabel}</Typography>
          <Typography sx={{ fontSize: 12, fontWeight: 600, fontVariantNumeric: 'tabular-nums' }}>{model.serial}</Typography>
        </Box>
      </Stack>

      <Box sx={{ borderBottom: `2px solid ${INK}`, mt: 2, mb: 2.5 }} />

      {model.identity.length > 0 ? <RowBlock rows={model.identity} /> : null}

      <RowBlock rows={model.summary} />

      {/* The total, twice: in figures and «به حروف», the way a formal financial
          document states it. Words cannot be altered by adding a zero. */}
      <Box sx={{ backgroundColor: TINT, border: `1px solid ${HAIRLINE}`, borderRadius: '10px', p: 2, mt: 2.5 }}>
        <Stack direction="row" sx={{ alignItems: 'baseline', justifyContent: 'space-between', gap: 2 }}>
          <Typography sx={{ color: MUTED, fontSize: 11 }}>{model.totalLabel}</Typography>
          <Typography sx={{ fontSize: 20, fontWeight: 700, fontVariantNumeric: 'tabular-nums' }}>{model.totalFigure}</Typography>
        </Stack>
        {model.totalInWords ? (
          <Stack direction="row" sx={{ alignItems: 'baseline', justifyContent: 'space-between', gap: 2, mt: 1 }}>
            <Typography sx={{ color: FAINT, fontSize: 10 }}>{model.totalInWordsLabel}</Typography>
            <Typography sx={{ color: MUTED, fontSize: 11, textAlign: 'end' }}>{model.totalInWords}</Typography>
          </Stack>
        ) : null}
      </Box>

      <Typography component="h2" sx={{ fontSize: 13, fontWeight: 700, mt: 3, mb: 1.25 }}>
        {model.breakdownTitle}
      </Typography>

      {/* A plain table rather than MUI's, a printed document wants hairlines
          and a header that repeats across a page break, not hover states. */}
      <Box
        component="table"
        sx={{
          width: '100%',
          borderCollapse: 'collapse',
          fontSize: 10.5,
          '& th, & td': { padding: '6px 8px', borderBottom: `1px solid ${HAIRLINE}`, textAlign: 'start' },
          '& th': { color: MUTED, fontWeight: 600, fontSize: FLOOR, borderBottom: `1px solid ${RULE}` },
          '& td.num, & th.num': { textAlign: 'end', fontVariantNumeric: 'tabular-nums' },
          '& thead': { display: 'table-header-group' },
          '& tr': { breakInside: 'avoid' },
        }}
      >
        <thead>
          <tr>
            <th>{model.columns.month}</th>
            <th className="num">{model.columns.count}</th>
            <th className="num">{model.columns.amount}</th>
          </tr>
        </thead>
        <tbody>
          {model.months.map((row) => (
            <tr key={row.key}>
              <td>{row.month}</td>
              <td className="num">{row.count}</td>
              <td className="num">{row.amount}</td>
            </tr>
          ))}
        </tbody>
      </Box>

      <Typography sx={{ color: FAINT, fontSize: FLOOR, mt: 1.5, lineHeight: 1.7 }}>{model.averageBasis}</Typography>

      <Box sx={{ borderTop: `1px solid ${HAIRLINE}`, mt: 3, pt: 1.5 }}>
        <Typography sx={{ color: FAINT, fontSize: FLOOR, lineHeight: 1.8 }}>{model.footnote}</Typography>
      </Box>
    </Box>
  )
}

const RowBlock = ({ rows }: { rows: CertificateModel['identity'] }) => (
  <Stack sx={{ mb: 2 }}>
    {rows.map((row) => (
      <Stack
        key={row.label}
        direction="row"
        sx={{ alignItems: 'baseline', gap: 2, py: 0.75, borderBottom: `1px solid ${HAIRLINE}`, '&:last-of-type': { borderBottom: 0 } }}
      >
        <Typography sx={{ color: MUTED, fontSize: 10.5, width: '34%', flexShrink: 0 }}>{row.label}</Typography>
        <Typography sx={{ fontSize: 11.5, fontWeight: 500 }}>{row.value}</Typography>
      </Stack>
    ))}
  </Stack>
)
