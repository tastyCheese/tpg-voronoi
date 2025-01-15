# tpg-voronoi

A tool for creating Voronoi diagrams from a set of geolocated points. Designed for finding the closest photos to an arbitrary point for Travel Pics Game.

## Website

Website is hosted [here](https://tpg.scottytremaine.uk/)

## Credits

This project is by [Nathan Edwards](https://github.com/npfedwards) (scottytremaine on discord).

The voronoi diagram is created using the [d3](https://www.npmjs.com/package/d3) library with [d3-geo-voronoi](https://www.npmjs.com/package/d3-geo-voronoi).

Basis for the initial code is from [this](https://observablehq.com/@d3/world-airports-voronoi) and [this](https://observablehq.com/@d3/world-tour)

### Contributors

- [tastyCheese (Gleb Pavliuk)](https://github.com/tastyCheese)

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
