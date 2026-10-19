// Routes Tailwind's colour palette through CSS variables (`--c-<family>-<shade>`)
// so each app theme can recolour the existing utility classes from styles.css.
// The fallbacks are Tailwind's default values, so the dark theme is unchanged.
(function configureTailwindPalette() {
  const PALETTES = {
    slate: {
      50: '248 250 252', 100: '241 245 249', 200: '226 232 240', 300: '203 213 225', 400: '148 163 184',
      500: '100 116 139', 600: '71 85 105', 700: '51 65 85', 800: '30 41 59', 900: '15 23 42', 950: '2 6 23'
    },
    amber: {
      50: '255 251 235', 100: '254 243 199', 200: '253 230 138', 300: '252 211 77', 400: '251 191 36',
      500: '245 158 11', 600: '217 119 6', 700: '180 83 9', 800: '146 64 14', 900: '120 53 15', 950: '69 26 3'
    },
    sky: {
      50: '240 249 255', 100: '224 242 254', 200: '186 230 253', 300: '125 211 252', 400: '56 189 248',
      500: '14 165 233', 600: '2 132 199', 700: '3 105 161', 800: '7 89 133', 900: '12 74 110', 950: '8 47 73'
    },
    rose: {
      50: '255 241 242', 100: '255 228 230', 200: '254 205 211', 300: '253 164 175', 400: '251 113 133',
      500: '244 63 94', 600: '225 29 72', 700: '190 18 60', 800: '159 18 57', 900: '136 19 55', 950: '76 5 25'
    },
    emerald: {
      50: '236 253 245', 100: '209 250 229', 200: '167 243 208', 300: '110 231 183', 400: '52 211 153',
      500: '16 185 129', 600: '5 150 105', 700: '4 120 87', 800: '6 95 70', 900: '6 78 59', 950: '2 44 34'
    },
    indigo: {
      50: '238 242 255', 100: '224 231 255', 200: '199 210 254', 300: '165 180 252', 400: '129 140 248',
      500: '99 102 241', 600: '79 70 229', 700: '67 56 202', 800: '55 48 163', 900: '49 46 129', 950: '30 27 75'
    }
  };

  const toColor = (name, fallback) => `rgb(var(--c-${name}, ${fallback}) / <alpha-value>)`;

  const colors = {
    white: toColor('white', '255 255 255'),
    black: toColor('black', '0 0 0')
  };

  for (const [family, shades] of Object.entries(PALETTES)) {
    colors[family] = Object.fromEntries(
      Object.entries(shades).map(([shade, rgb]) => [shade, toColor(`${family}-${shade}`, rgb)])
    );
  }

  tailwind.config = { theme: { extend: { colors } } };
})();
