// Home wallpapers. Each id has a `.wallpaper--<id>` class in assets/css/wallpapers.css.
export const DEFAULT_WALLPAPER = "none";

export const WALLPAPERS = [
  { id: DEFAULT_WALLPAPER, label: "None" },
  { id: "grid", label: "Grid" },
  { id: "dots", label: "Dots" },
  { id: "topo", label: "Topographic" },
  { id: "circuit", label: "Circuit" },
  { id: "waves", label: "Waves" },
  { id: "blueprint", label: "Blueprint" },
  { id: "diagonal", label: "Diagonal" },
  { id: "hex", label: "Honeycomb" },
  { id: "cross", label: "Crosses" },
];

/** Returns the id when it is a known wallpaper, else the default. */
export const normalizeWallpaper = (id) =>
  WALLPAPERS.some((wallpaper) => wallpaper.id === id) ? id : DEFAULT_WALLPAPER;

/** CSS classes for a container that shows the wallpaper. None gives no class. */
export const wallpaperClasses = (id) =>
  id === DEFAULT_WALLPAPER ? [] : ["wallpaper", `wallpaper--${id}`];
