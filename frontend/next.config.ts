import type { NextConfig } from "next";

const nextConfig: NextConfig = {
  // Sprint A — CI hardening. Type errors must block the build again. We
  // previously set `ignoreBuildErrors: true` because third-party `.d.ts`
  // files dragged the tsc stage past 240s; that debt is now cleared (our
  // source is `tsc --noEmit` clean). If third-party type noise returns,
  // exclude those specific packages in tsconfig rather than re-enabling
  // this blanket escape hatch.
  turbopack: {},

  // Step 4 — photo-first imagery. Enable the Next Image optimizer for
  // the demo animal photo host (placedog.net). Swap in real shelter
  // CDNs (S3/R2 signed URLs, Shelterluv/Petfinder media) here at launch.
  images: {
    remotePatterns: [
      { protocol: "https", hostname: "placedog.net" },
    ],
  },
};

export default nextConfig;