import type { MetadataRoute } from "next";

export default function manifest(): MetadataRoute.Manifest {
  return {
    name: "MyMemo - A Voice Into Eternity",
    short_name: "MyMemo",
    description: "Record a video message for your loved ones, to last forever.",
    start_url: "/",
    display: "standalone",
    background_color: "#fbf6ec",
    theme_color: "#b8863b",
    icons: [
      {
        src: "/icons/icon-192.png",
        sizes: "192x192",
        type: "image/png",
      },
      {
        src: "/icons/icon-512.png",
        sizes: "512x512",
        type: "image/png",
      },
      {
        src: "/icons/icon-maskable-512.png",
        sizes: "512x512",
        type: "image/png",
        purpose: "maskable",
      },
    ],
  };
}
