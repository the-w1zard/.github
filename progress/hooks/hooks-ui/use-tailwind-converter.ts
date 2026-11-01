import { useState, useCallback, useMemo } from "#sauron";

interface HSL {
  h: number; // 0-360
  s: number; // 0-100
  l: number; // 0-100
  a?: number; // 0-1 (optional alpha)
}

interface OKLCH {
  l: number; // 0-1
  c: number; // 0-0.4 (chroma)
  h: number; // 0-360
  a?: number; // 0-1 (optional alpha)
}

interface ColorConversion {
  hslV3: string;
  hslV4: string;
  oklch: string;
  hex: string;
  rgb: string;
  rgba: string;
}

interface UseTailwindConverterReturn {
  // Current color values
  hslV3: string;
  hslV4: string;
  oklch: string;
  hex: string;
  rgb: string;
  
  // Conversion functions
  convertFromHSLv3: (hsl: string) => void;
  convertFromHSLv4: (hsl: string) => void;
  convertFromOKLCH: (oklch: string) => void;
  convertFromHex: (hex: string) => void;
  convertFromRGB: (rgb: string) => void;
  
  // Utility functions
  getHSLv3Object: () => HSL;
  getHSLv4Object: () => HSL;
  getOKLCHObject: () => OKLCH;
  getColorConversion: () => ColorConversion;
  
  // Batch conversion
  convertAll: (color: string) => ColorConversion;
  
  // Reset
  reset: () => void;
}

// Default color (Tailwind blue-500)
const DEFAULT_COLOR = {
  hslV3: 'hsl(217, 91%, 60%)',
  hslV4: 'hsl(217 91% 60%)',
  oklch: 'oklch(0.623 0.214 259.815)',
  hex: '#3b82f6',
  rgb: 'rgb(59, 130, 246)'
};

// Helper functions
const helpers = {
  // Parse HSL string (supports both v3 and v4 formats)
  parseHSL: (hsl: string): HSL | null => {
    const match = hsl.match(/hsl\((\d+)(?:deg)?[,\s]+([\d.]+)%[,\s]+([\d.]+)%(?:[,\s]+\/([\d.]+))?\)/i);
    if (!match) return null;
    
    return {
      h: parseFloat(match[1]),
      s: parseFloat(match[2]),
      l: parseFloat(match[3]),
      a: match[4] ? parseFloat(match[4]) : undefined
    };
  },

  // Parse OKLCH string
  parseOKLCH: (oklch: string): OKLCH | null => {
    const match = oklch.match(/oklch\(([\d.]+)[\s]+([\d.]+)[\s]+([\d.]+)(?:[\s]+\/([\d.]+))?\)/i);
    if (!match) return null;
    
    return {
      l: parseFloat(match[1]),
      c: parseFloat(match[2]),
      h: parseFloat(match[3]),
      a: match[4] ? parseFloat(match[4]) : undefined
    };
  },

  // Parse HEX string
  parseHex: (hex: string): HSL | null => {
    hex = hex.replace(/^#/, '');
    let r, g, b;
    
    if (hex.length === 3) {
      r = parseInt(hex[0] + hex[0], 16);
      g = parseInt(hex[1] + hex[1], 16);
      b = parseInt(hex[2] + hex[2], 16);
    } else if (hex.length === 6) {
      r = parseInt(hex.substring(0, 2), 16);
      g = parseInt(hex.substring(2, 4), 16);
      b = parseInt(hex.substring(4, 6), 16);
    } else if (hex.length === 8) {
      r = parseInt(hex.substring(0, 2), 16);
      g = parseInt(hex.substring(2, 4), 16);
      b = parseInt(hex.substring(4, 6), 16);
    } else {
      return null;
    }
    
    return helpers.rgbToHSL(r, g, b);
  },

  // Parse RGB string
  parseRGB: (rgb: string): HSL | null => {
    const match = rgb.match(/rgba?\((\d+)[,\s]+(\d+)[,\s]+(\d+)(?:[,\s]+([\d.]+))?\)/i);
    if (!match) return null;
    
    const r = parseInt(match[1]);
    const g = parseInt(match[2]);
    const b = parseInt(match[3]);
    const a = match[4] ? parseFloat(match[4]) : undefined;
    
    const hsl = helpers.rgbToHSL(r, g, b);
    if (hsl && a !== undefined) {
      hsl.a = a;
    }
    
    return hsl;
  },

  // Convert RGB to HSL
  rgbToHSL: (r: number, g: number, b: number): HSL => {
    r /= 255;
    g /= 255;
    b /= 255;
    
    const max = Math.max(r, g, b);
    const min = Math.min(r, g, b);
    let h = 0, s = 0, l = (max + min) / 2;
    
    if (max !== min) {
      const d = max - min;
      s = l > 0.5 ? d / (2 - max - min) : d / (max + min);
      
      switch (max) {
        case r: h = (g - b) / d + (g < b ? 6 : 0); break;
        case g: h = (b - r) / d + 2; break;
        case b: h = (r - g) / d + 4; break;
      }
      
      h *= 60;
    }
    
    return {
      h: Math.round(h),
      s: Math.round(s * 100),
      l: Math.round(l * 100)
    };
  },

  // Convert HSL to RGB
  hslToRGB: (h: number, s: number, l: number): [number, number, number] => {
    s /= 100;
    l /= 100;
    
    const c = (1 - Math.abs(2 * l - 1)) * s;
    const x = c * (1 - Math.abs((h / 60) % 2 - 1));
    const m = l - c / 2;
    
    let r = 0, g = 0, b = 0;
    
    if (h >= 0 && h < 60) {
      [r, g, b] = [c, x, 0];
    } else if (h >= 60 && h < 120) {
      [r, g, b] = [x, c, 0];
    } else if (h >= 120 && h < 180) {
      [r, g, b] = [0, c, x];
    } else if (h >= 180 && h < 240) {
      [r, g, b] = [0, x, c];
    } else if (h >= 240 && h < 300) {
      [r, g, b] = [x, 0, c];
    } else {
      [r, g, b] = [c, 0, x];
    }
    
    return [
      Math.round((r + m) * 255),
      Math.round((g + m) * 255),
      Math.round((b + m) * 255)
    ];
  },

  // Convert HSL to OKLCH (simplified approximation)
  hslToOKLCH: (hsl: HSL): OKLCH => {
    // This is a simplified approximation since real HSL to OKLCH conversion
    // requires complex color space transformations
    // For accurate conversion, you'd need a proper color library
    
    // Approximation: convert lightness to OKLCH lightness (0-1 scale)
    const l = hsl.l / 100;
    
    // Simplified chroma calculation based on saturation
    const c = hsl.s / 100 * 0.4;
    
    // Hue remains the same
    const h = hsl.h;
    
    return { l, c, h, a: hsl.a };
  },

  // Convert OKLCH to HSL (simplified approximation)
  oklchToHSL: (oklch: OKLCH): HSL => {
    // Simplified inverse approximation
    const h = oklch.h;
    const s = Math.min(100, (oklch.c / 0.4) * 100);
    const l = oklch.l * 100;
    
    return { h, s, l, a: oklch.a };
  },

  // Format HSL for v3 (comma-separated)
  formatHSLv3: (hsl: HSL): string => {
    if (hsl.a !== undefined) {
      return `hsl(${hsl.h}, ${hsl.s}%, ${hsl.l}%, ${hsl.a})`;
    }
    return `hsl(${hsl.h}, ${hsl.s}%, ${hsl.l}%)`;
  },

  // Format HSL for v4 (space-separated)
  formatHSLv4: (hsl: HSL): string => {
    if (hsl.a !== undefined) {
      return `hsl(${hsl.h} ${hsl.s}% ${hsl.l}% / ${hsl.a})`;
    }
    return `hsl(${hsl.h} ${hsl.s}% ${hsl.l}%)`;
  },

  // Format OKLCH
  formatOKLCH: (oklch: OKLCH): string => {
    if (oklch.a !== undefined) {
      return `oklch(${oklch.l} ${oklch.c} ${oklch.h} / ${oklch.a})`;
    }
    return `oklch(${oklch.l} ${oklch.c} ${oklch.h})`;
  },

  // Convert HSL to HEX
  hslToHex: (hsl: HSL): string => {
    const [r, g, b] = helpers.hslToRGB(hsl.h, hsl.s, hsl.l);
    
    const toHex = (n: number) => {
      const hex = n.toString(16);
      return hex.length === 1 ? '0' + hex : hex;
    };
    
    return `#${toHex(r)}${toHex(g)}${toHex(b)}`;
  },

  // Convert HSL to RGB string
  hslToRGBString: (hsl: HSL): string => {
    const [r, g, b] = helpers.hslToRGB(hsl.h, hsl.s, hsl.l);
    
    if (hsl.a !== undefined) {
      return `rgba(${r}, ${g}, ${b}, ${hsl.a})`;
    }
    return `rgb(${r}, ${g}, ${b})`;
  },

  // Detect color format
  detectFormat: (color: string): 'hsl-v3' | 'hsl-v4' | 'oklch' | 'hex' | 'rgb' | 'unknown' => {
    if (color.startsWith('hsl(')) {
      return color.includes(',') ? 'hsl-v3' : 'hsl-v4';
    }
    if (color.startsWith('oklch(')) return 'oklch';
    if (color.startsWith('#')) return 'hex';
    if (color.startsWith('rgb')) return 'rgb';
    return 'unknown';
  }
};

export function useTailwindConverter(initialColor?: string): UseTailwindConverterReturn {
  const [hslV3, setHSLv3] = useState(DEFAULT_COLOR.hslV3);
  const [hslV4, setHSLv4] = useState(DEFAULT_COLOR.hslV4);
  const [oklch, setOKLCH] = useState(DEFAULT_COLOR.oklch);
  const [hex, setHex] = useState(DEFAULT_COLOR.hex);
  const [rgb, setRGB] = useState(DEFAULT_COLOR.rgb);

  // Update all color formats from HSL object
  const updateAllFromHSL = useCallback((hsl: HSL) => {
    setHSLv3(helpers.formatHSLv3(hsl));
    setHSLv4(helpers.formatHSLv4(hsl));
    setOKLCH(helpers.formatOKLCH(helpers.hslToOKLCH(hsl)));
    setHex(helpers.hslToHex(hsl));
    setRGB(helpers.hslToRGBString(hsl));
  }, []);

  // Update all color formats from OKLCH object
  const updateAllFromOKLCH = useCallback((oklchObj: OKLCH) => {
    const hsl = helpers.oklchToHSL(oklchObj);
    setOKLCH(helpers.formatOKLCH(oklchObj));
    setHSLv3(helpers.formatHSLv3(hsl));
    setHSLv4(helpers.formatHSLv4(hsl));
    setHex(helpers.hslToHex(hsl));
    setRGB(helpers.hslToRGBString(hsl));
  }, []);

  // Conversion functions
  const convertFromHSLv3 = useCallback((hslString: string) => {
    const hsl = helpers.parseHSL(hslString);
    if (hsl) updateAllFromHSL(hsl);
  }, [updateAllFromHSL]);

  const convertFromHSLv4 = useCallback((hslString: string) => {
    const hsl = helpers.parseHSL(hslString);
    if (hsl) updateAllFromHSL(hsl);
  }, [updateAllFromHSL]);

  const convertFromOKLCH = useCallback((oklchString: string) => {
    const oklchObj = helpers.parseOKLCH(oklchString);
    if (oklchObj) updateAllFromOKLCH(oklchObj);
  }, [updateAllFromOKLCH]);

  const convertFromHex = useCallback((hexString: string) => {
    const hsl = helpers.parseHex(hexString);
    if (hsl) updateAllFromHSL(hsl);
  }, [updateAllFromHSL]);

  const convertFromRGB = useCallback((rgbString: string) => {
    const hsl = helpers.parseRGB(rgbString);
    if (hsl) updateAllFromHSL(hsl);
  }, [updateAllFromHSL]);

  // Get color objects
  const getHSLv3Object = useCallback((): HSL => {
    return helpers.parseHSL(hslV3) || { h: 0, s: 0, l: 0 };
  }, [hslV3]);

  const getHSLv4Object = useCallback((): HSL => {
    return helpers.parseHSL(hslV4) || { h: 0, s: 0, l: 0 };
  }, [hslV4]);

  const getOKLCHObject = useCallback((): OKLCH => {
    return helpers.parseOKLCH(oklch) || { l: 0, c: 0, h: 0 };
  }, [oklch]);

  // Get all conversions
  const getColorConversion = useCallback((): ColorConversion => {
    return {
      hslV3,
      hslV4,
      oklch,
      hex,
      rgb,
      rgba: rgb // For backward compatibility
    };
  }, [hslV3, hslV4, oklch, hex, rgb]);

  // Batch conversion from any format
  const convertAll = useCallback((color: string): ColorConversion => {
    const format = helpers.detectFormat(color);
    
    switch (format) {
      case 'hsl-v3':
        convertFromHSLv3(color);
        break;
      case 'hsl-v4':
        convertFromHSLv4(color);
        break;
      case 'oklch':
        convertFromOKLCH(color);
        break;
      case 'hex':
        convertFromHex(color);
        break;
      case 'rgb':
        convertFromRGB(color);
        break;
      default:
        console.warn('Unknown color format:', color);
    }
    
    return getColorConversion();
  }, [convertFromHSLv3, convertFromHSLv4, convertFromOKLCH, convertFromHex, convertFromRGB, getColorConversion]);

  // Reset to default
  const reset = useCallback(() => {
    setHSLv3(DEFAULT_COLOR.hslV3);
    setHSLv4(DEFAULT_COLOR.hslV4);
    setOKLCH(DEFAULT_COLOR.oklch);
    setHex(DEFAULT_COLOR.hex);
    setRGB(DEFAULT_COLOR.rgb);
  }, []);

  // Initialize with provided color
  useMemo(() => {
    if (initialColor) {
      convertAll(initialColor);
    }
  }, [initialColor, convertAll]);

  return {
    // Current values
    hslV3,
    hslV4,
    oklch,
    hex,
    rgb,
    
    // Conversion functions
    convertFromHSLv3,
    convertFromHSLv4,
    convertFromOKLCH,
    convertFromHex,
    convertFromRGB,
    
    // Utility functions
    getHSLv3Object,
    getHSLv4Object,
    getOKLCHObject,
    getColorConversion,
    
    // Batch conversion
    convertAll,
    
    // Reset
    reset
  };
}

// Example usage component
export function TailwindConverterExample() {
  const converter = useTailwindConverter();
  
  return (
    <div>
      <div>
        <label>HSL v3:</label>
        <input 
          value={converter.hslV3}
          onChange={(e) => converter.convertFromHSLv3(e.target.value)}
        />
      </div>
      
      <div>
        <label>HSL v4:</label>
        <input 
          value={converter.hslV4}
          onChange={(e) => converter.convertFromHSLv4(e.target.value)}
        />
      </div>
      
      <div>
        <label>OKLCH:</label>
        <input 
          value={converter.oklch}
          onChange={(e) => converter.convertFromOKLCH(e.target.value)}
        />
      </div>
      
      <div>
        <button onClick={() => converter.reset()}>Reset</button>
      </div>
    </div>
  );
}
