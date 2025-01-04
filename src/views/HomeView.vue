<script lang="ts">
import * as d3 from 'd3';
import drag from '../helpers/drag.js';
import render from '../helpers/render.js';
import { geoVoronoi } from 'd3-geo-voronoi';
import * as topojson from 'topojson-client';
import world from '../data/countries.json';

export default {
  data: () => {
    return {
      points: [
        [[-1.5636426, 54.777029], [10.16699, 46.21582], [-6.787428367747737, 57.423226306079734], [-8.024211882515775, 31.602785170501562]]
      ],
      land: topojson.feature(world, world.objects.land),
      borders: topojson.mesh(world, world.objects.countries, (a, b) => a !== b),
      sphere: ({ type: 'Sphere' }),
      height: 928,
      width: 928,
      path: undefined,
      projection: undefined,
      context: undefined,
      mesh: undefined
    };
  },
  methods: {
    chart () {
      return d3.select(this.context.canvas)
        .call(drag(this.projection).on("drag.render", this.dragged))
        .call(render, this.context, this.path, this.width, this.height, this.borders, this.land, this.mesh, this.sphere, this.points)
        .node();
    },
    dragged () {
      console.log('dragged', this.path);
      render(null, this.context, this.path, this.width, this.height, this.borders, this.land, this.mesh, this.sphere, this.points);
    }
  },
  mounted () {
    this.projection = d3.geoOrthographic()
      .fitExtent([[1, 1], [this.width - 1, this.height - 1]], this.sphere)
      .rotate([0, -30]);
    this.context = this.$refs.canvas.getContext('2d');
    this.mesh = geoVoronoi(this.points).cellMesh();
    this.path = d3.geoPath(this.projection, this.context).pointRadius(1.5);
    this.chart();
  }
};
</script>

<template>
  <main>
    <canvas ref="canvas" :height="height" :width="width"></canvas>
  </main>
</template>
