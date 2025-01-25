import type {GeoPath, GeoSphere} from "d3";
import type {MultiLineString, FeatureCollection, MultiPoint} from "geojson";
import type {Selection} from "d3-selection";

const render = (
  event: Selection<HTMLCanvasElement, unknown, null, undefined> | null,
  context: CanvasRenderingContext2D,
  path: GeoPath,
  width: number,
  height: number,
  borders: MultiLineString,
  land: FeatureCollection,
  mesh: FeatureCollection,
  sphere: GeoSphere,
  points: number[][],
  colours: string[],
  lat: number,
  lng: number,
  found: number | undefined,
  selectedLat: number,
  selectedLng: number
  ): void => {
  context.clearRect(0, 0, width, height);

  context.beginPath();
  path(sphere);
  context.fillStyle = "#849fff";
  context.fill();
  // context.strokeStyle = "#000";
  // context.lineWidth = 1.5;
  // context.stroke();

  context.beginPath();
  path(land);
  context.fillStyle = "#ccc";
  context.fill();
  context.beginPath();
  path(borders);
  context.strokeStyle = "#fff";
  context.lineWidth = 0.5;
  context.stroke();

  // context.beginPath(), path(arc), context.stroke();

  let i = 0;
  for (const polygon of mesh.features) {
    const mod = i % colours.length;
    context.beginPath();
    path(polygon);
    context.lineWidth = 1;
    if (lng !== 0 && lat !== 0 && found !== undefined && found === i) {
      context.strokeStyle = "#000dff";
      context.lineWidth = 3;
      context.stroke();
      context.fillStyle = 'rgba(0,0,255,0.5)';
      context.fill();
    } else {
      context.strokeStyle = colours[mod] + ')';
      context.stroke();
      context.fillStyle = colours[mod] + ',0.5)';
      context.fill();
    }
    i++;
  }

  context.beginPath();
  path({type: "MultiPoint", coordinates: points} as MultiPoint);
  context.fillStyle = "#f00";
  context.fill();

  if (lng !== 0 && lat !== 0) {
    context.beginPath();
    path({type: "Point", coordinates: [lng, lat]});
    context.fillStyle = "#000dff";
    context.fill();
  }

  if (selectedLng !== 0 && selectedLat !== 0) {
    context.beginPath();
    path({type: "Point", coordinates: [selectedLng, selectedLat]});
    context.fillStyle = "#37ff00";
    context.fill();
  }
};

export default render;
