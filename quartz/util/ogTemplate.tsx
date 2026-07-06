import { SocialImageOptions } from "./og"
import { getFontSpecificationName } from "./theme"
import { formatDate, getDate } from "../components/Date"
import readingTime from "reading-time"
import { i18n } from "../i18n"

// Letterpress-styled social card: a vermilion "second-ink" accent stripe, the
// site name in tracked small-caps, a big serif title, and a hairline meta rule.
// Kept close to satori's supported CSS subset (flex everywhere, no textTransform).
export const letterpressOgImage: SocialImageOptions["imageStructure"] = ({
  cfg,
  userOpts,
  title,
  description,
  fileData,
  iconBase64,
}) => {
  const { colorScheme } = userOpts
  const colors = cfg.theme.colors[colorScheme]
  const bodyFont = getFontSpecificationName(cfg.theme.typography.body)
  const headerFont = getFontSpecificationName(cfg.theme.typography.header)
  const useSmallerFont = title.length > 34

  const rawDate = getDate(cfg, fileData)
  const date = rawDate ? formatDate(rawDate, cfg.locale) : null
  const { minutes } = readingTime(fileData.text ?? "")
  const readingTimeText = i18n(cfg.locale).components.contentMeta.readingTime({
    minutes: Math.ceil(minutes),
  })

  return (
    <div
      style={{
        display: "flex",
        height: "100%",
        width: "100%",
        backgroundColor: colors.light,
        fontFamily: bodyFont,
      }}
    >
      {/* vermilion accent stripe */}
      <div style={{ display: "flex", width: "22px", height: "100%", backgroundColor: colors.tertiary }} />

      <div
        style={{
          display: "flex",
          flexDirection: "column",
          flex: 1,
          padding: "3.25rem 3.75rem",
          justifyContent: "space-between",
        }}
      >
        {/* site name */}
        <div style={{ display: "flex", alignItems: "center", gap: "0.9rem" }}>
          {iconBase64 && (
            <img src={iconBase64} width={44} height={44} style={{ borderRadius: "50%" }} />
          )}
          <div style={{ display: "flex", fontSize: 30, letterSpacing: "0.14em", color: colors.gray }}>
            {(cfg.pageTitle ?? "").toUpperCase()}
          </div>
        </div>

        {/* title + description */}
        <div style={{ display: "flex", flexDirection: "column" }}>
          <div style={{ display: "flex", marginBottom: "1.4rem" }}>
            <div
              style={{
                display: "-webkit-box",
                WebkitBoxOrient: "vertical",
                WebkitLineClamp: 3,
                overflow: "hidden",
                fontSize: useSmallerFont ? 66 : 82,
                fontFamily: headerFont,
                fontWeight: 700,
                color: colors.dark,
                lineHeight: 1.12,
              }}
            >
              {title}
            </div>
          </div>
          <div
            style={{
              display: "-webkit-box",
              WebkitBoxOrient: "vertical",
              WebkitLineClamp: 2,
              overflow: "hidden",
              fontSize: 34,
              color: colors.darkgray,
              lineHeight: 1.4,
            }}
          >
            {description}
          </div>
        </div>

        {/* meta rule */}
        <div
          style={{
            display: "flex",
            alignItems: "center",
            gap: "1.25rem",
            fontSize: 26,
            color: colors.gray,
            paddingTop: "1.4rem",
            borderTop: `2px solid ${colors.tertiary}`,
          }}
        >
          {date && <div style={{ display: "flex" }}>{date}</div>}
          {date && <div style={{ display: "flex" }}>·</div>}
          <div style={{ display: "flex" }}>{readingTimeText}</div>
        </div>
      </div>
    </div>
  )
}
