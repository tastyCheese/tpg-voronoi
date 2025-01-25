<script lang="ts">
import * as d3 from 'd3';
import drag from '../helpers/drag.js';
import render from '../helpers/render.js';
import { geoVoronoi } from 'd3-geo-voronoi';
import * as topojson from 'topojson-client';
import world from '../data/countries.json';
import Point from "@/classes/point.ts";
import type {Topology, Objects, GeometryObject} from "topojson-specification";
import type {FeatureCollection, GeoJsonProperties} from "geojson";
import axios from 'axios';

export default {
  data: () => {
    const topoWorld: Topology<Objects<GeoJsonProperties>> = world as unknown as Topology<Objects<GeoJsonProperties>>;
    const points: Point[] = [];
    const sphere: d3.GeoSphere = { type: 'Sphere' };
    const zoomLevel: number = 0.5;
    const projection = d3.geoOrthographic()
      .fitExtent([[1, 1], [window.innerWidth - 1, window.innerHeight * .9 - 1]], sphere)
      .rotate([0, -30])
      .scale(Math.min(window.innerWidth, window.innerHeight * .9) * zoomLevel);
    const mesh = geoVoronoi([]).polygons() as FeatureCollection;
    return {
      points,
      land: topojson.feature(topoWorld, topoWorld.objects.land) as FeatureCollection,
      borders: topojson.mesh(topoWorld, topoWorld.objects.countries as GeometryObject, (a, b) => a !== b),
      sphere,
      path: undefined as d3.GeoPath | undefined,
      projection,
      context: undefined as CanvasRenderingContext2D | undefined,
      mesh,
      found: undefined as number | undefined,
      latitude: 0,
      longitude: 0,
      label: '',
      url: '',
      csv: '',
      zoomLevel,
      colours: [
        'rgba(31, 119, 180',
        'rgba(255, 127, 14',
        'rgba(44, 160, 44',
        'rgba(214, 39, 40',
        'rgba(148, 103, 189',
        'rgba(140, 86, 75',
        'rgba(227, 119, 194',
        'rgba(127, 127, 127',
        'rgba(188, 189, 34',
        'rgba(23, 190, 207',
      ],
      currentLatitude: 0,
      currentLongitude: 0,
      selectedX: 0,
      selectedY: 0,
      selectedLat: 0,
      selectedLng: 0,
      discordUsername: ''
    };
  },
  computed: {
    arrayPoints (): number[][] {
      return this.points.map(point => [point.longitude, point.latitude]);
    },
    height () {
      return window.innerHeight * .9;
    },
    width () {
      return window.innerWidth;
    }
  },
  methods: {
    chart () {
      if (this.context !== undefined && this.path !== undefined) {
        const canvas = this.context?.canvas;
        return d3.select(canvas)
          // @ts-expect-error - The Generics in d3 get this messy, selection vs DragEvent gets confused here
          .call(drag(this.projection).on("drag.render", this.dragged))
          .call(render, this.context, this.path, this.width, this.height, this.borders, this.land, this.mesh, this.sphere, this.arrayPoints, this.colours, this.currentLatitude, this.currentLongitude, this.found, this.selectedLat, this.selectedLng)
          .on('click', this.clicked)
          .node();
      }
    },
    dragged () {
      if (this.context !== undefined && this.path !== undefined) {
        render(null, this.context!, this.path!, this.width, this.height, this.borders, this.land, this.mesh, this.sphere, this.arrayPoints, this.colours, this.currentLatitude, this.currentLongitude, this.found, this.selectedLat, this.selectedLng);
      }
    },
    addPoints () {
      this.points.push(new Point(this.longitude, this.latitude, this.label, this.url));
      this.longitude = 0;
      this.latitude = 0;
      this.label = '';
      this.url = '';
      this.mesh = geoVoronoi(this.arrayPoints).polygons() as FeatureCollection;
      this.found = geoVoronoi(this.arrayPoints).find(this.currentLongitude, this.currentLatitude);
      this.save();
    },
    removePoint (index: number) {
      this.points.splice(index, 1);
      this.mesh = geoVoronoi(this.arrayPoints).polygons() as FeatureCollection;
      this.found = geoVoronoi(this.arrayPoints).find(this.currentLongitude, this.currentLatitude);
      this.save();
    },
    save () {
      localStorage.setItem('geo_points', JSON.stringify(this.points));
      localStorage.setItem('current_location', JSON.stringify({ latitude: this.currentLatitude, longitude: this.currentLongitude }));
      this.chart();
    },
    parseCoordinates (event: ClipboardEvent, isCurrentLocation: boolean = false) {
      console.log(event, isCurrentLocation);
      const clipboardData = event.clipboardData;
      if (clipboardData) {
        const pastedData = clipboardData.getData('text/plain');
        if (pastedData.indexOf('.') > -1 && pastedData.indexOf(',') > pastedData.indexOf('.')) {
          const [latitude, longitude] = pastedData.split(',');
          if (isCurrentLocation) {
            this.currentLatitude = parseFloat(latitude);
            this.currentLongitude = parseFloat(longitude);
          } else {
            this.latitude = parseFloat(latitude);
            this.longitude = parseFloat(longitude);
          }
        } else {
          if (isCurrentLocation) {
            this.currentLatitude = parseFloat(pastedData);
          } else {
            this.latitude = parseFloat(pastedData);
          }
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
      const fileList = (this.$refs.csv as HTMLInputElement)?.files;
      const csv = (fileList || [])[0];
      if (!csv) {
        return;
      }
      const reader = new FileReader();
      reader.onload = () => {
        this.csv = reader.result ? reader.result.toString() : '';
      };
      reader.readAsText(csv);
    },
    importCsv () {
      (this.$refs.csv as HTMLInputElement).value = '';
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
      this.mesh = geoVoronoi(this.arrayPoints).polygons() as FeatureCollection;
      this.found = geoVoronoi(this.arrayPoints).find(this.currentLongitude, this.currentLatitude);
      this.save();
    },
    zoom (direction: 'in' | 'out', scale: number = 1.5) {
      this.zoomLevel = direction === 'in' ? Math.min(this.zoomLevel * scale, 15) : Math.max(this.zoomLevel / scale, 0.5);
      this.projection.scale(Math.min(this.width, this.height) * this.zoomLevel);
      this.chart();
    },
    wheelZoom (event: WheelEvent) {
      if (event.ctrlKey) {
        event.preventDefault();
        this.zoom(event.deltaY > 0 ? 'out' : 'in', 1.2);
      }
    },
    backgroundColour (index: number) {
      const mod = index % this.colours.length;
      return { backgroundColor: this.colours[mod] };
    },
    highlightLine (index: number) {
      if (this.currentLongitude !== 0 && this.currentLatitude !== 0 && this.found !== undefined && this.found === index) {
        return { backgroundColor: 'rgb(0, 0, 255)' };
      }
    },
    clicked (event: MouseEvent) {
      this.selectedX = event.x;
      this.selectedY = event.y;
      // TODO Need to convert this into lng lat somehow.
      // this.chart();
    },
    async getPlayersFromTasty(datalistId: string) {
      // https://tpg.tastedcheese.site/php/db_utils.php?func=getPlayers
      try {
        const datalist = document.getElementById(datalistId);
        if (!datalist) {
          return;
        }
        datalist.innerHTML = '';

        const data = await axios.get('https://tpg.tastedcheese.site/php/db_utils.php?func=getPlayers');
        console.log(data);

        if (data && data.data) {
          const names = data.data as string[];
          names.forEach(name => {
            const option = document.createElement('option');
            option.value = name;
            datalist.appendChild(option);
          });
        }
      } catch (e) {
        if (e instanceof Error) {
          console.log(e.message);
        }
        return;
      }
    },
    async importFromTasty () {
      // https://tastedcheese.site/php/db_utils.php?func=getUserSubmissions&name=scottytremaine
      if (!this.discordUsername) {
        return;
      }
      try {
        const data = await axios.get(`https://tpg.tastedcheese.site/php/db_utils.php?func=getUserSubmissions&name=${this.discordUsername}`);
        console.log(data);
        if (data && data.data) {
          const points = data.data as Point[];
          points.forEach(p => {
            const index = this.points.findIndex(point => point.latitude.toFixed(5) === p.latitude.toFixed(5) && point.longitude.toFixed(5) === p.longitude.toFixed(5));
            if (index > -1) {
              // this.points[index] = p; Do not overwrite
            } else {
              this.points.push(p);
            }
          });
          this.mesh = geoVoronoi(this.arrayPoints).polygons() as FeatureCollection;
          this.found = geoVoronoi(this.arrayPoints).find(this.currentLongitude, this.currentLatitude);
          this.save();
        }
      } catch (e) {
        if (e instanceof Error) {
          console.log(e.message);
        }
        return;
      }
    }
  },
  watch: {
    currentLatitude () {
      this.found = geoVoronoi(this.arrayPoints).find(this.currentLongitude, this.currentLatitude);
      this.save();
    },
    currentLongitude () {
      this.found = geoVoronoi(this.arrayPoints).find(this.currentLongitude, this.currentLatitude);
      this.save();
    }
  },
  mounted () {
    this.points = (JSON.parse(localStorage.getItem('geo_points') ?? '[]') as Point[] | number[][]).map(p => {
      if (Array.isArray(p)) {
        return new Point(p[0], p[1], '', '');
      } else {
        return new Point(p.longitude, p.latitude, p.label, p.url);
      }
    });
    const currentLocation = JSON.parse(localStorage.getItem('current_location') ?? '{"latitude": 0, "longitude": 0}');
    this.currentLatitude = currentLocation.latitude;
    this.currentLongitude = currentLocation.longitude;
    this.context = (this.$refs.canvas as HTMLCanvasElement).getContext('2d') ?? undefined;
    this.path = d3.geoPath(this.projection, this.context).pointRadius(1.5);
    if (this.arrayPoints.length > 0) {
      this.mesh = geoVoronoi(this.arrayPoints).polygons() as FeatureCollection;
      this.found = geoVoronoi(this.arrayPoints).find(this.currentLongitude, this.currentLatitude);
    }
    this.chart();
  }
};
</script>

<template>
  <main>
    <div ref="container" class="main-container" style="margin-top: 40px;">
      <div class="field has-addons" style="position: absolute; top: 5%; left: 5%">
        <div class="control">
          <button class="button" @click="zoom('in')">+</button>
        </div>
        <div class="control">
          <button class="button" @click="zoom('out')">-</button>
        </div>
      </div>
      <div style="position: absolute; top: 5%; right: 5%; display: flex; flex-direction: column; align-items: flex-end">
        <div class="field has-addons">
          <div class="control">
            <button class="button is-small is-static">Current Loc</button>
          </div>
          <div class="control">
            <input type="number" v-model.number="currentLatitude" placeholder="Latitude" class="input is-small" @paste.prevent="parseCoordinates($event, true)">
          </div>
          <div class="control">
            <input type="number" v-model.number="currentLongitude" placeholder="Longitude" class="input is-small">
          </div>
        </div>
        <div v-if="!currentLatitude || !currentLongitude" class="message is-danger">
          <div class="message-body">
            <p><small>Add current TPG location to highlight the closest photo.</small></p>
          </div>
        </div>
      </div>
      <canvas ref="canvas" :height="height" :width="width" @wheel="wheelZoom($event)"></canvas>
    </div>
    <div class="message is-primary">
      <div class="message-body">
        <p>Made for <a href="https://bit.ly/tpgrules">Travel Picture Game</a> by scottytremaine. Check out the <a href="https://github.com/npfedwards/tpg-voronoi">Github repository</a> if you want to contribute.</p>
        <p>Add your photo locations below to display a voronoi diagram of the area closest to each photo. Any changes are saved to your localStorage (like cookies), and are not uploaded or anything.</p>
        <p>Pasting a lat, long into the latitude box will auto split them for you.</p>
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
    <div class="field has-addons">
      <div class="control">
        <button class="button is-small is-static">Import Previously Submitted</button>
      </div>
      <div class="control">
        <datalist id="players-from-tasty">
          <option value="Loading..."></option>
        </datalist>
        <input class="input is-small" type="text" placeholder="Discord Username" v-model="discordUsername" list="players-from-tasty" @click.once="getPlayersFromTasty('players-from-tasty')">
      </div>
      <div class="control">
        <button class="button is-small is-info" @click="importFromTasty()">Import from tpg.tastedcheese.site</button>
      </div>
    </div>
    <div class="table-container">
      <table class="table">
        <thead>
          <tr>
            <td></td>
            <th>Latitude</th>
            <th>Longitude</th>
            <th>Label</th>
            <th>Image</th>
            <th></th>
          </tr>
        </thead>
        <tbody>
        <tr>
          <td></td>
          <td><input type="number" class="input is-small" v-model.number="latitude" @paste.prevent="parseCoordinates"></td>
          <td><input type="number" class="input is-small" v-model.number="longitude"></td>
          <td><input type="text" class="input is-small" placeholder="Label" v-model="label"></td>
          <td><input type="text" class="input is-small" placeholder="URL" v-model="url"></td>
          <td><button @click="addPoints()" class="button is-small is-primary">+</button></td>
        </tr>
          <tr v-for="(point, index) in points" :key="index" :style="highlightLine(index)">
            <td :style="backgroundColour(index)">&nbsp;</td>
            <td>{{ point.latitude }}</td>
            <td>{{ point.longitude }}</td>
            <td><input type="text" class="input is-small" placeholder="Label" v-model="point.label" @blur="save"></td>
            <td><img v-if="point.url" :src="point.url" class="thumbnail"><input v-else type="text" class="input is-small" placeholder="URL" v-model="point.url" @blur="save"></td>
            <td><button class="button is-small is-danger" @click="removePoint(index)">X</button></td>
          </tr>
        </tbody>
      </table>
    </div>
  </main>
</template>
