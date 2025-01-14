// @ts-expect-error No declaration file for module
import versor from "versor";
import * as d3 from "d3";

const drag = (projection: d3.GeoProjection): d3.DragBehavior<Element, unknown, unknown> => {
  let v0: number;
  let q0: number;
  let r0: [number, number, number];
  let a0: number;
  let l: number;

  function pointer(event: DragEvent, that: HTMLElement) {
    const t = d3.pointers(event, that);

    if (t.length !== l) {
      l = t.length;
      if (l > 1) a0 = Math.atan2(t[1][1] - t[0][1], t[1][0] - t[0][0]);
      dragstarted.apply(that, [event]);
    }

    // For multitouch, average positions and compute rotation.
    if (l > 1) {
      const x = d3.mean(t, p => p[0]);
      const y = d3.mean(t, p => p[1]);
      const a = Math.atan2(t[1][1] - t[0][1], t[1][0] - t[0][0]);
      return [x, y, a];
    }

    return t[0];
  }

  function dragstarted({x, y}: {x: number, y: number}) {
    const a = projection.invert ? projection.invert([x, y]) : null;
    v0 = versor.cartesian(a);
    q0 = versor(r0 = projection.rotate());
  }

  function dragged(event: DragEvent) {
    const rotatedProjection = projection.rotate(r0);
    const a = rotatedProjection.invert ? rotatedProjection.invert([event.x, event.y]) : null;
    const v1 = versor.cartesian(a);
    const delta = versor.delta(v0, v1);
    let q1 = versor.multiply(q0, delta);

    const that = this as HTMLElement;
    // For multitouch, compose with a rotation around the axis.
    const p = pointer(event, that);
    if (p[2]) {
      const d = (p[2] - a0) / 2;
      const s = -Math.sin(d);
      const c = Math.sign(Math.cos(d));
      q1 = versor.multiply([Math.sqrt(1 - s * s), 0, 0, c * s], q1);
    }

    const rotation_vector = versor.rotation(q1);
    rotation_vector[2] = 0;
    projection.rotate(rotation_vector);

    // In vicinity of the antipode (unstable) of q0, restart.
    if (delta[0] < 0.7) dragstarted.apply(that, [event]);
  }

  return d3.drag()
    .on("start", dragstarted)
    .on("drag", dragged);
};

export default drag;
