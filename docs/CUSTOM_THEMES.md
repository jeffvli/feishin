# Custom Themes

Custom themes let you add your own light and dark themes to the **desktop** app without rebuilding Feishin. Drop JSON theme files into the Themes folder; Feishin watches that folder and reloads themes when files change.

Custom themes are **Electron / desktop only**. They are not available in the web or Docker builds.

---

## Getting started

1. Open **Settings → General → Theme**.
2. Under **Custom Themes**, click **Open Folder** to reveal the Themes directory.
3. Add a `.json` file (for example `my-theme.json`).
4. Select the theme from the Theme dropdown (it appears under Dark or Light based on `mode`).

You can also click **Reload** in Settings if a change was not picked up automatically.

### Themes folder location

| Platform | Typical path |
|----------|----------------|
| Windows | `%APPDATA%\feishin\Themes` |
| macOS | `~/Library/Application Support/feishin/Themes` |
| Linux | `~/.config/feishin/Themes` |

In development builds the folder name is under `feishin-dev` instead of `feishin`.

Theme files must be **`.json` files in the root of the Themes folder** (not nested in subfolders). Linked stylesheets may live next to them or in subfolders, as long as they stay inside Themes.

---

## Theme file format

Each theme is a single JSON object.

```json
{
  "mode": "dark",
  "extends": "defaultDark",
  "colors": {
    "primary": "rgb(53, 116, 252)",
    "background": "rgb(12, 12, 12)",
    "foreground": "rgb(225, 225, 225)"
  },
  "app": {
    "scrollbar-size": "9px"
  },
  "mantineOverride": {
    "primaryShade": {
      "dark": 6
    }
  },
  "stylesheets": ["my-theme.css"]
}
```

### Identity

| Derived from | Behavior |
|--------------|----------|
| **id** | Filename without `.json` (e.g. `rose-pine-custom.json` → `rose-pine-custom`) |
| **label** | Title-cased id with `-` / `_` replaced by spaces (e.g. `Rose Pine Custom`) |

Use a unique filename. The id is what appears in settings and what you use when another theme `extends` this one.

### Fields

| Field | Required | Description |
|-------|----------|-------------|
| `mode` | No (default `dark`) | `"dark"` or `"light"`. Controls which theme group the theme appears in and the app color scheme. |
| `extends` | No | Built-in theme id or another custom theme’s id (filename without `.json`). Your theme is merged on top of the base. |
| `colors` | No | Palette overrides. Invalid CSS colors are dropped and shown as a warning in Settings. |
| `app` | No | App chrome / layout CSS variable overrides. |
| `mantineOverride` | No | Partial [Mantine theme override](https://mantine.dev/theming/theme-object/). |
| `stylesheets` | No | Array of CSS file paths **relative to the Themes folder**. Contents are inlined when the theme is active. Paths that escape the Themes folder are ignored. |

Unspecified color and app values fall back to Feishin’s default theme (and then to anything provided by `extends`).

---

## Colors

Supported `colors` keys:

| Key | Typical use |
|-----|-------------|
| `background` | Main app background |
| `background-alternate` | Alternate / nested background |
| `surface` | Cards, inputs, elevated surfaces |
| `surface-foreground` | Text on surfaces |
| `foreground` | Primary text |
| `foreground-muted` | Secondary / muted text |
| `primary` | Accent / primary action color (also drives generated primary shades) |
| `black` | Black token |
| `white` | White token |
| `state-error` | Error state |
| `state-info` | Info state |
| `state-success` | Success state |
| `state-warning` | Warning state |

Values must be valid CSS colors recognized by Feishin’s color validator (for example `rgb(...)`, `rgba(...)`, `#rrggbb`, `#rgb`). Named CSS colors like `red` are rejected. Invalid entries are ignored and listed under Custom Themes warnings in Settings.

---

## App variables

Supported `app` keys (CSS values as strings):

| Key | Description |
|-----|-------------|
| `content-max-width` | Max width of main content |
| `root-font-size` | Root font size |
| `overlay-header` | Header overlay background |
| `overlay-subheader` | Subheader overlay background |
| `scrollbar-size` | Scrollbar thickness |
| `scrollbar-handle-background` | Scrollbar handle |
| `scrollbar-handle-hover-background` | Handle on hover |
| `scrollbar-handle-active-background` | Handle when active |
| `scrollbar-handle-border-radius` | Handle corner radius |
| `scrollbar-track-background` | Scrollbar track |
| `scrollbar-track-hover-background` | Track on hover |
| `scrollbar-track-active-background` | Track when active |
| `scrollbar-track-border-radius` | Track corner radius |

---

## Extending themes

Use `extends` to start from a built-in or another custom theme and only override what you need.

```json
{
  "mode": "dark",
  "extends": "nord",
  "colors": {
    "primary": "#88c0d0"
  }
}
```

Rules:

- Custom theme fields always win over the theme they extend.
- Custom → custom chains are flattened when loading (depth limit of 10; cycles are ignored).
- If `extends` is a built-in id, merging with that built-in’s defaults happens in the renderer.
- If `extends` is omitted, the theme still merges onto Feishin’s shared default palette.

### Built-in theme ids

Use these as `extends` values (same ids as in Settings):

`ayuDark`, `ayuLight`, `catppuccinLatte`, `catppuccinMocha`, `defaultDark`, `defaultLight`, `dracula`, `everforestDark`, `everforestLight`, `githubDark`, `githubLight`, `glassyDark`, `gruvboxDark`, `gruvboxLight`, `highContrastDark`, `highContrastLight`, `materialDark`, `materialLight`, `monokai`, `nightOwl`, `nord`, `oneDark`, `rosePine`, `rosePineDawn`, `rosePineMoon`, `shadesOfPurple`, `solarizedDark`, `solarizedLight`, `tokyoNight`, `vscodeDarkPlus`, `vscodeLightPlus`, `zenburn`

---

## Linked stylesheets

For larger visual overrides (glass effects, layout tweaks, etc.), point `stylesheets` at CSS files inside the Themes folder:

```json
{
  "mode": "dark",
  "extends": "defaultDark",
  "stylesheets": ["overrides/my-theme.css"]
}
```

```text
Themes/
  my-theme.json
  overrides/
    my-theme.css
```

Notes:

- Feishin watches **JSON** theme files for automatic reload. After editing only a CSS file, click **Reload** in Settings (or touch/save the `.json` file) so stylesheets are re-read.
- Empty or unreadable stylesheet paths are skipped with a console warning.

---

## Examples

### Minimal accent-only dark theme

`accent-blue.json`:

```json
{
  "mode": "dark",
  "extends": "defaultDark",
  "colors": {
    "primary": "rgb(80, 160, 255)"
  }
}
```

### Full light palette

`paper-light.json`:

```json
{
  "mode": "light",
  "colors": {
    "background": "rgb(250, 249, 246)",
    "background-alternate": "rgb(242, 240, 235)",
    "surface": "rgb(255, 255, 255)",
    "surface-foreground": "rgb(40, 40, 40)",
    "foreground": "rgb(30, 30, 30)",
    "foreground-muted": "rgb(110, 110, 110)",
    "primary": "rgb(180, 83, 9)",
    "black": "rgb(0, 0, 0)",
    "white": "rgb(255, 255, 255)",
    "state-error": "rgb(185, 28, 28)",
    "state-info": "rgb(37, 99, 235)",
    "state-success": "rgb(22, 163, 74)",
    "state-warning": "rgb(217, 119, 6)"
  },
  "app": {
    "overlay-header": "linear-gradient(rgb(250 249 246 / 50%) 0%, rgb(250 249 246 / 80%))",
    "scrollbar-handle-background": "rgba(120, 120, 120, 30%)"
  },
  "mantineOverride": {
    "primaryShade": {
      "light": 5
    }
  }
}
```

### Theme that extends another custom theme

`nord-soft.json`:

```json
{
  "mode": "dark",
  "extends": "nord",
  "colors": {
    "background": "rgb(36, 41, 51)",
    "surface": "rgb(46, 52, 64)"
  }
}
```

---

## Troubleshooting

| Symptom | What to check |
|---------|----------------|
| Theme missing from the list | File must be `.json` in the Themes root; use **Reload**. |
| Theme shows an error in Settings | JSON is invalid or not a top-level object. Fix the file and reload. |
| Theme loads with a warning | One or more `colors` values were invalid and ignored. |
| CSS changes not applying | Edit/save the `.json` or click **Reload**; stylesheet watch is tied to JSON changes. |
| Extending does nothing / looks wrong | Confirm the `extends` id matches a built-in id or another custom filename (without `.json`). Avoid circular chains. |

Broken themes still appear in Settings with their error message so you can fix them without digging through logs.
