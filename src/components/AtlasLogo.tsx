import { SVGProps } from "react";

interface AtlasLogoProps extends SVGProps<SVGSVGElement> {
  variant?: "icon" | "horizontal";
  /** Cor da estrutura do "A" (linhas). Padrao: preto. Use "#FFFFFF" para fundos escuros. */
  strokeColor?: string;
  /** Cor do orbe (laranja por padrao). */
  accentColor?: string;
  /** Cor do wordmark "ATLAS" (so usado em variant="horizontal"). Padrao: mesmo de strokeColor. */
  textColor?: string;
}

/**
 * Logo oficial do sistema ATLAS.
 *
 * Uso basico:
 *   <AtlasLogo />                            // icone + wordmark, preto
 *   <AtlasLogo variant="icon" />             // so o icone
 *   <AtlasLogo strokeColor="#FFFFFF" />      // para header escuro
 *
 * Tamanho: controle via width/height ou className (ex: className="h-8 w-auto").
 */
export function AtlasLogo({
  variant = "horizontal",
  strokeColor = "#0F0F0F",
  accentColor = "#F97316",
  textColor,
  ...props
}: AtlasLogoProps) {
  const finalTextColor = textColor ?? strokeColor;

  if (variant === "icon") {
    return (
      <svg
        xmlns="http://www.w3.org/2000/svg"
        viewBox="0 0 110 110"
        role="img"
        aria-label="Atlas"
        {...props}
      >
        <title>Atlas</title>
        <path
          d="M 18 92 L 55 32 L 92 92"
          stroke={strokeColor}
          strokeWidth="13"
          strokeLinecap="round"
          strokeLinejoin="round"
          fill="none"
        />
        <circle cx="55" cy="26" r="11" fill={accentColor} />
      </svg>
    );
  }

  return (
    <svg
      xmlns="http://www.w3.org/2000/svg"
      viewBox="0 0 300 110"
      role="img"
      aria-label="Atlas"
      {...props}
    >
      <title>Atlas</title>
      <path
        d="M 18 92 L 55 32 L 92 92"
        stroke={strokeColor}
        strokeWidth="11"
        strokeLinecap="round"
        strokeLinejoin="round"
        fill="none"
      />
      <circle cx="55" cy="26" r="10" fill={accentColor} />
      <text
        x="120"
        y="78"
        fontFamily="Inter, system-ui, -apple-system, Segoe UI, sans-serif"
        fontSize="46"
        fontWeight="700"
        fill={finalTextColor}
        letterSpacing="1.5"
      >
        ATLAS
      </text>
    </svg>
  );
}

export default AtlasLogo;
