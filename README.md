# Unovis

A generator of Constructivist prints, after El Lissitzky, Alexander Rodchenko, Kazimir Malevich,
Lyubov Popova, Gustav Klutsis, Varvara Stepanova and the Stenberg brothers. Each artist has their own
compositional grammar rather than a colour swap: Lissitzky drives a wedge into a disc, Rodchenko
shouts through a cone of type, Stepanova prints cotton.

Every print comes from a seed. The same artist and seed always give the same print, at any size, so a
link like `#klutsis-q00001` reproduces it exactly.

**Live app:** https://dene-.github.io/unovis/ (installable, works offline)

## Features

- Seven artists, nine ink sets, and plates that switch layers on and off without reshuffling the rest
- Sheets from square to 21:9 in portrait or landscape, saved as PNG or JPG from HD up to 8K
- Swipe the print left for a new one and right to go back; on phones the controls live in a bottom sheet
- Installable PWA: offline after the first visit, and saving goes through the share sheet on phones

## Development

Requires Node 22 or newer.

```sh
npm install
npm run dev      # start the dev server
npm test         # unit tests
npm run check    # type-check Svelte and TypeScript
npm run lint     # Prettier and ESLint
npm run build    # static build in ./build
```

## How it is put together

```
src/lib/engine/        pure drawing engine, no Svelte
  composer.ts          the Composer interface artists draw through, and its seeded implementation
  artists/             one module per artist; each implements Artist.compose()
  render/              paints a Composition onto a canvas, and the paper texture
src/lib/app/           application logic: preferences, session history, saving, deep links
src/lib/attachments/   swipe and bottom-sheet gestures
src/lib/components/    Svelte components
src/routes/            the single page
src/service-worker.ts  offline cache
```

Artists only know the `Composer` interface: they ask it for random values scoped to one layer, and
hand it drawing operations tagged with the ink plate they print on. Rendering, misregistration and
paper texture happen afterwards, in `render/`. Adding an artist means adding one module to
`artists/` and registering it in `artists/index.ts`.

Each layer of a composition draws from its own random stream, which is why switching a plate off or
changing the inks leaves everything else where it was.

## Deployment

Pushes to `main` are checked, tested, built and deployed to GitHub Pages by
`.github/workflows/ci.yml`. The build reads `BASE_PATH` so the app works under the repository's
subpath.
