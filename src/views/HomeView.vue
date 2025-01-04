<script lang="ts">
import * as d3 from 'd3';
import drag from '../helpers/drag.js';
import render from '../helpers/render.js';
import { geoVoronoi } from 'd3-geo-voronoi';
import * as topojson from 'topojson-client';
import world from '../data/countries.json';
import Point from "@/classes/point.ts";

export default {
  data: () => {
    const points: Point[] = [];
    return {
      points,
      land: topojson.feature(world, world.objects.land),
      borders: topojson.mesh(world, world.objects.countries, (a, b) => a !== b),
      sphere: ({ type: 'Sphere' }),
      path: undefined,
      projection: undefined,
      context: undefined,
      mesh: undefined,
      latitude: 0,
      longitude: 0,
      label: '',
      url: '',
      csv: ''
    };
  },
  computed: {
    arrayPoints (): number[][] {
      return this.points.map(point => [point.longitude, point.latitude]);
    },
    height () {
      return this.width;
    },
    width () {
      return Math.min(window.innerWidth, window.innerHeight * .9);
    }
  },
  methods: {
    chart () {
      return d3.select(this.context.canvas)
        .call(drag(this.projection).on("drag.render", this.dragged))
        .call(render, this.context, this.path, this.width, this.height, this.borders, this.land, this.mesh, this.sphere, this.arrayPoints)
        .node();
    },
    dragged () {
      render(null, this.context, this.path, this.width, this.height, this.borders, this.land, this.mesh, this.sphere, this.arrayPoints);
    },
    addPoints () {
      this.points.push(new Point(this.longitude, this.latitude, this.label, this.url));
      this.longitude = 0;
      this.latitude = 0;
      this.label = '';
      this.url = '';
      this.mesh = geoVoronoi(this.arrayPoints).cellMesh();
      localStorage.setItem('geo_points', JSON.stringify(this.points));
      this.chart();
    },
    removePoint (index: number) {
      this.points.splice(index, 1);
      this.mesh = geoVoronoi(this.arrayPoints).cellMesh();
      localStorage.setItem('geo_points', JSON.stringify(this.points));
      this.chart();
    },
    save () {
      localStorage.setItem('geo_points', JSON.stringify(this.points));
      this.chart();
    },
    parseCoordinates (event: ClipboardEvent) {
      const clipboardData = event.clipboardData;
      if (clipboardData) {
        const pastedData = clipboardData.getData('text/plain');
        if (pastedData.indexOf('.') > -1 && pastedData.indexOf(',') > pastedData.indexOf('.')) {
          const [latitude, longitude] = pastedData.split(',');
          this.latitude = parseFloat(latitude);
          this.longitude = parseFloat(longitude);
        } else {
          this.latitude = parseFloat(pastedData);
        }
      }
    },
    downloadCsv () {
      const csv = this.points.map(p => [p.latitude, p.longitude, p.label, p.url].join(',')).join('\n');
      const blob = new Blob([csv], { type: 'text/csv' });
      const url = URL.createObjectURL(blob);
      const a = document.createElement('a');
      a.href = url;
      a.download = 'geo_points.csv';
      a.click();
      URL.revokeObjectURL(url);
    },
    readFile () {
      const csv = this.$refs.csv.files[0];
      const reader = new FileReader();
      reader.onload = () => {
        this.csv = reader.result;
      };
      reader.readAsText(csv);
    },
    importCsv () {
      this.$refs.csv.value = '';
      const points = this.csv.split('\n').map((p: string) => {
        const [longitude, latitude, label, url] = p.split(',');
        return new Point(parseFloat(latitude), parseFloat(longitude), label, url);
      });
      points.forEach(p => {
        const index = this.points.findIndex(point => point.latitude === p.latitude && point.longitude === p.longitude);
        if (index > -1) {
          this.points[index] = p;
        } else {
          this.points.push(p);
        }
      });
      this.mesh = geoVoronoi(this.arrayPoints).cellMesh();
      localStorage.setItem('geo_points', JSON.stringify(this.points));
      this.chart();
    }
  },
  mounted () {
    this.points = JSON.parse(localStorage.getItem('geo_points') ?? '[]').map(p => {
      if (Array.isArray(p)) {
        return new Point(p[0], p[1], '', '');
      } else {
        return new Point(p.longitude, p.latitude, p.label, p.url);
      }
    });
    this.projection = d3.geoOrthographic()
      .fitExtent([[1, 1], [this.width - 1, this.height - 1]], this.sphere)
      .rotate([0, -30]);
    this.context = this.$refs.canvas.getContext('2d');
    this.mesh = geoVoronoi(this.arrayPoints).cellMesh();
    this.path = d3.geoPath(this.projection, this.context).pointRadius(1.5);
    this.chart();
  }
};
</script>

<template>
  <main>
    <div ref="container" class="main-container">
      <canvas ref="canvas" :height="height" :width="width"></canvas>
    </div>
    <div class="message is-primary">
      <div class="message-body">
        <p>Add your photo locations below. Any changes are saved to your localStorage (like cookies), and are not uploaded or anything.</p>
        <p>Import a csv (comma separated values - can be exported from excel) file with no column headers, columns should be latitude (req), longitude (req), label (opt), url (opt). Any repeat locations will be replaced, otherwise they will be added.</p>
      </div>
    </div>
    <div class="field has-addons">
      <div class="control">
        <button class="button is-small is-static">Import CSV</button>
      </div>
      <div class="control">
        <input class="input is-small" type="file" ref="csv" @change="readFile()" />
      </div>
      <div class="control">
        <button class="button is-small is-info" @click="importCsv()">Import CSV</button>
      </div>
      <div class="control">
        <button class="button is-small is-primary" @click="downloadCsv()">Export CSV</button>
      </div>
    </div>
    <div class="table-container">
      <table class="table">
        <thead>
          <tr>
            <th>Latitude</th>
            <th>Longitude</th>
            <th>Label</th>
            <th>Image</th>
            <th></th>
          </tr>
        </thead>
        <tbody>
          <tr v-for="(point, index) in points" :key="index">
            <td>{{ point.latitude }}</td>
            <td>{{ point.longitude }}</td>
            <td><input type="text" class="input is-small" placeholder="Label" v-model="point.label" @blur="save"></td>
            <td><img v-if="point.url" :src="point.url" class="thumbnail"><input v-else type="text" class="input is-small" placeholder="URL" v-model="point.url" @blur="save"></td>
            <td><button class="button is-small is-danger" @click="removePoint(index)">X</button></td>
          </tr>
          <tr>
            <td><input type="number" class="input is-small" v-model.number="latitude" @paste.prevent="parseCoordinates"></td>
            <td><input type="number" class="input is-small" v-model.number="longitude"></td>
            <td><input type="text" class="input is-small" placeholder="Label" v-model="label"></td>
            <td><input type="text" class="input is-small" placeholder="URL" v-model="url"></td>
            <td><button @click="addPoints()" class="button is-small is-primary">+</button></td>
          </tr>
        </tbody>
      </table>
    </div>
  </main>
</template>
