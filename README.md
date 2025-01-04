# tpg-voronoi

A tool for creating Voronoi diagrams from a set of geolocated points. Designed for finding the closest photos to an arbitrary point for Travel Pics Game.

## Website

Website is hosted [here](https://tpg.scottytremaine.uk/)

## Credits

This project is by Nathan Edwards (scottytremaine on discord).

The voronoi diagram is created using the [d3](https://www.npmjs.com/package/d3) library with [d3-geo-voronoi](https://www.npmjs.com/package/d3-geo-voronoi).

Basis for the initial code is from [this](https://observablehq.com/@d3/world-airports-voronoi) and [this](https://observablehq.com/@d3/world-tour)


## TODO/Wish list
In no particular order:

- [x] Write this document
- [x] Successfully display photo points on the sphere
- [x] Display Voronoi diagram on the sphere
- [x] Appropriate credit to open source libraries/snippets & collaborators
- [x] Allow input of arbitrary points
- [x] Receive input as lat/long (most people's default?) and convert to long/lat (what d3 expects)
- [x] Implement localStorage for saving points
- [x] Host somewhere (I have a plan)
- [ ] Set up github actions for deployment
- [ ] Make TypeScript stop complaining about everything
- [x] Make it easy to paste a google formatted lat, long string in one
- [ ] Make it look nice
- [ ] Make it work on mobile
- [ ] Colour the areas
- [ ] Zoom
- [ ] Allow csv *upload* of points
- [ ] And download
- [x] Labels on photos
- [ ] Labels on map

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
