declare module 'd3-geo-voronoi' {
  import type { FeatureCollection, Polygon} from "geojson";

  export type GeoVoronoi = {
    polygons: () => FeatureCollection | false;
    triangles: () => FeatureCollection | false;
    links: () => FeatureCollection | false;
    mesh: () => MultiLineString | false;
    cellMesh: () => MultiLineString | false;
    find: (x: number, y: number, radius?: number) => number;
    hull: () => Polygon | null;
  };

  export function geoVoronoi(data: number[][] | FeatureCollection): GeoVoronoi

  export function geoVoronoi(): (data: number[][] | FeatureCollection | null) => GeoVoronoi
}

