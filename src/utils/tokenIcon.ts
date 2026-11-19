/**
 * Token symbols for the history "Total <token> claim" row. The files are the
 * assets exported from Figma (Core Components and the wallet files), kept at
 * the size Figma draws them inside the 40px disc: a full symbol is 40x40, a
 * bare mark (PAXG, KDA) is smaller and sits centred.
 */
export interface TokenIcon {
    src: string
    /** Fill behind the symbol, when it has one of its own. */
    bg?: string
    /** Crop applied to the image, when Figma crops it. */
    clipPath?: string
}

const TOKEN_ICONS: Record<string, { file: string, bg?: string, clipPath?: string }> = {
    USDC: { file: 'USDC.svg' },
    PAXG: { file: 'PAXG.svg' },
    KDA: { file: 'KDA.svg' },
    CSPR: { file: 'CSPR.png' },
    // The Cardano PNG is a blue disc on a white square. Figma crops the square
    // away and fills the rest of the 40px disc with the same blue.
    ADA: { file: 'ADA.png', bg: '#0033AD', clipPath: 'inset(3px 3px 3px 4px round 20px)' },
}

/** `undefined` for a token with no exported symbol; the caller keeps its own icon. */
export const tokenIcon = (symbol: string): TokenIcon | undefined => {
    const icon = TOKEN_ICONS[symbol.toUpperCase()]
    return icon && { src: `/shared/tokens/${icon.file}`, bg: icon.bg, clipPath: icon.clipPath }
}
