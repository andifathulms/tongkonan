/** @type {import('next').NextConfig} */
const basePath = process.env.NEXT_PUBLIC_BASE_PATH ?? ''

// Static export only. There is no server anywhere in this project, so anything
// that would require one (image optimisation, rewrites, middleware) is off.
/*
 * The year the export was built.
 *
 * The maker's mark dates the artefact the reader is holding, and on a static
 * site that is the build. It is read here rather than in the component
 * because the component ends up in the client bundle — Sheet is a server
 * component but the four route clients import it — so `new Date()` inside it
 * would run in the browser, disagree with the HTML the moment the build year
 * went stale, and hydrate-mismatch on every page. Next inlines this into both
 * bundles at build time, so the two can never disagree.
 */
const buildYear = String(new Date().getFullYear())

const nextConfig = {
  env: { NEXT_PUBLIC_BUILD_YEAR: buildYear },
  output: 'export',
  basePath,
  trailingSlash: true,
  images: { unoptimized: true },
  reactStrictMode: true,
}

export default nextConfig
