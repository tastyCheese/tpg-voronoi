# tpg-voronoi

A tool for creating Voronoi diagrams from a set of geolocated points. Designed for finding the closest photos to an arbitrary point for Travel Pics Game.

## TODO/Wish list
In no particular order:

- [ ] Write this document
- [x] Successfully display photo points on the sphere
- [x] Display Voronoi diagram on the sphere
- [ ] Appropriate credit to open source libraries/snippets & collaborators
- [ ] Allow input of arbitrary points
- [ ] Receive input as lat/long (most people's default?) and convert to long/lat (what d3 expects)
- [ ] Implement localStorage for saving points
- [ ] Host somewhere (I have a plan)
- [ ] Set up github actions for deployment
- [ ] Make TypeScript stop complaining about everything

## Project Setup

```sh
npm install
```

### Compile and Hot-Reload for Development

```sh
npm run dev
```

### Type-Check, Compile and Minify for Production

```sh
npm run build
```

### Lint with [ESLint](https://eslint.org/)

```sh
npm run lint
```
