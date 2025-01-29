import type {GeoPath, GeoSphere} from "d3";
import type {MultiLineString, FeatureCollection, MultiPoint} from "geojson";
import type {Selection} from "d3-selection";
import Point from "@/classes/point.ts";

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
  points: Point[],
  colours: string[],
  lat: number,
  lng: number,
  found: number | undefined,
  mouseX: number,
  mouseY: number,
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
  path({type: "MultiPoint", coordinates: points.map((point) => [point.longitude, point.latitude])} as MultiPoint);
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

  if (mouseX && mouseY) {
    const hoverRadius = 4;
    let closestPoint = null;
    let closestRendered = null;
    const closestDistance = hoverRadius;
    points.forEach(point => {
      const renderedPoint = path.centroid({type: "Point", coordinates: [point.longitude, point.latitude]});
      const distance = Math.sqrt(Math.pow(renderedPoint[0] - mouseX, 2) + Math.pow(renderedPoint[1] - mouseY, 2));
      if (distance < closestDistance) {
        closestPoint = point;
        closestRendered = {
          x: renderedPoint[0],
          y: renderedPoint[1]
        };
      }
    });
    context.fillStyle = "#f00";


    if (lng !== 0 && lat !== 0) {
      const renderedRound = path.centroid({type: "Point", coordinates: [lng, lat]});
      const roundDistance = Math.sqrt(Math.pow(renderedRound[0] - mouseX, 2) + Math.pow(renderedRound[1] - mouseY, 2));
      if (roundDistance < closestDistance) {
        closestPoint = new Point(lng, lat, 'Current round');
        closestRendered = {
          x: renderedRound[0],
          y: renderedRound[1]
        };
        context.fillStyle = "#000dff";
      }
    }
    if (closestPoint && closestRendered) {
      const oldRadius = path.pointRadius();
      path.pointRadius(hoverRadius);

      context.beginPath();
      path({type: "Point", coordinates: [closestPoint.longitude, closestPoint.latitude]});
      context.fill();

      // Tooltip
      // context.fillStyle = "#fff";
      // context.fillRect(closestRendered.x - width / 2, closestRendered.y - height - 10, width, height)
      // context.strokeStyle = "#000";
      // context.strokeRect(closestRendered.x - width / 2, closestRendered.y - height - 10, width, height)
      context.fillStyle = "#fff";
      context.font = "bold 14px sans";
      context.textAlign = "center";
      context.fillText(closestPoint.label, closestRendered.x, closestRendered.y - 15);

      path.pointRadius(oldRadius);
    }
  }
};

export default render;
