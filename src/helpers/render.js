const render = (event, context, path, width, height, borders, land, mesh, sphere, points) => {
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

  context.beginPath();
  path(mesh);
  context.lineWidth = 0.5;
  context.strokeStyle = "#000";
  context.stroke();

  context.beginPath();
  path({type: "MultiPoint", coordinates: points});
  context.fillStyle = "#f00";
  context.fill();
};

export default render;
