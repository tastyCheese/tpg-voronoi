<script lang="ts">
import * as d3 from 'd3';
import drag from '../helpers/drag.js';
import render from '../helpers/render.js';
import canvasMousePos from '../helpers/canvasMousePos.ts';
import { geoVoronoi } from 'd3-geo-voronoi';
import * as topojson from 'topojson-client';
import world from '../data/countries.json';
import Point from "@/classes/point.ts";
import type {Topology, Objects, GeometryObject} from "topojson-specification";
import type {FeatureCollection, GeoJsonProperties} from "geojson";
import axios from 'axios';
import useClipboard from 'vue-clipboard3';
import haversine from "@/helpers/haversine.ts";

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
      antipodeFound: undefined as number | undefined,
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
      mouseX: 0,
      mouseY: 0,
      selectedX: 0,
      selectedY: 0,
      selectedLat: 0,
      selectedLng: 0,
      playerNames: [],
      discordUsername: '',
      editIndex: -1
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
    },
    meshColours (): string[] {
      if (this.mesh && this.mesh.features.length > 0) {
        const colours: string[] = [];
        for (const poly of this.mesh.features) {
          if (poly.properties && poly.properties.neighbours) {
            const notAllowedColours = poly.properties.neighbours.map((n: number) => {
              if (colours[n]) {
                return colours[n];
              } else {
                return false;
              }
            });
            colours.push(this.colours.find(a => notAllowedColours.indexOf(a) === -1) ?? 'rgba(255, 255, 255)');
          }
        }
        return colours;
      }
      return this.colours;
    }
  },
  methods: {
    chart () {
      if (this.context !== undefined && this.path !== undefined) {
        const canvas = this.context?.canvas;
        return d3.select(canvas)
          // @ts-expect-error - The Generics in d3 get this messy, selection vs DragEvent gets confused here
          .call(drag(this.projection).on("drag.render", this.dragged))
          .call(render, this.context, this.path, this.width, this.height, this.borders, this.land, this.mesh, this.sphere, this.points, this.meshColours, this.currentLatitude, this.currentLongitude, this.found, this.antipodeFound, this.mouseX, this.mouseY)
          .on('click', this.clicked)
          .on('mousemove', this.mouseMoved)
          .node();
      }
    },
    dragged () {
      if (this.context !== undefined && this.path !== undefined) {
        render(null, this.context!, this.path!, this.width, this.height, this.borders, this.land, this.mesh, this.sphere, this.points, this.meshColours, this.currentLatitude, this.currentLongitude, this.found, this.antipodeFound, this.mouseX, this.mouseY);
      }
    },
    addPoints () {
      this.points.push(new Point(this.longitude, this.latitude, this.label, this.url));
      this.longitude = 0;
      this.latitude = 0;
      this.label = '';
      this.url = '';
      this.update();
    },
    removePoint (index: number) {
      this.points.splice(index, 1);
      this.save();
    },
    update () {
      this.mesh = geoVoronoi(this.arrayPoints).polygons() as FeatureCollection;
      this.found = geoVoronoi(this.arrayPoints).find(this.currentLongitude, this.currentLatitude);
      this.antipodeFound = geoVoronoi(this.arrayPoints).find(this.currentLongitude + 180 > 180 ? this.currentLongitude - 180 : this.currentLongitude + 180, -this.currentLatitude);
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
      this.update();
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
      return { backgroundColor: this.meshColours[index] };
    },
    highlightLine (index: number) {
      if (this.currentLongitude !== 0 && this.currentLatitude !== 0 && this.found !== undefined && this.found === index) {
        return { backgroundColor: 'rgb(0, 0, 255)' };
      } else if (this.currentLongitude !== 0 && this.currentLatitude !== 0 && this.antipodeFound !== undefined && this.antipodeFound === index) {
        return { backgroundColor: 'rgb(140, 0, 255)' };
      }
    },
    mouseMoved (event: MouseEvent) {
      if (this.context !== undefined) {
        const mousePos = canvasMousePos(this.context?.canvas, event.x, event.y);
        this.mouseX = mousePos.x;
        this.mouseY = mousePos.y;
        this.chart();
      }
    },
    clicked (event: MouseEvent) {
      this.selectedX = event.x;
      this.selectedY = event.y;
      // TODO Need to convert this into lng lat somehow.
      // this.chart();
    },
    async getRoundFromTasty() {
      // https://tpg.tastedcheese.site/php/db_utils.php?func=getRounds
      try {
        const data = await axios.get('https://tpg.tastedcheese.site/php/db_utils.php?func=getRounds');
        console.log(data);

        if (data && data.data && data.data.length > 0) {
          const ongoingRound = data.data.pop();
          if (ongoingRound.ongoing) {
            if (ongoingRound.latitude && ongoingRound.longitude) {
              this.currentLatitude = ongoingRound.latitude;
              this.currentLongitude = ongoingRound.longitude;
            }
          }
        }
      } catch (e) {
        if (e instanceof Error) {
          console.log(e.message);
        }
        return;
      }
    },
    async getPlayersFromTasty() {
      // https://tpg.tastedcheese.site/php/db_utils.php?func=getPlayers
      try {
        const data = await axios.get('https://tpg.tastedcheese.site/php/db_utils.php?func=getPlayers');
        console.log(data);

        if (data && data.data) {
          this.playerNames = data.data;
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
          this.update();
        }
      } catch (e) {
        if (e instanceof Error) {
          console.log(e.message);
        }
        return;
      }
    },
    async copy (point: Point) {
      const { toClipboard } = useClipboard();
      await toClipboard(`${point.latitude}, ${point.longitude}`);
    },
    distance (point: Point) {
      if (this.currentLongitude !== 0 && this.currentLatitude !== 0) {
        const distance = haversine(this.currentLatitude, this.currentLongitude, point.latitude, point.longitude);
        if (distance > 10000) {
          return (distance / 1000).toFixed(2) + 'km';
        } else if (distance > 2000) {
          return (distance / 1000).toFixed(3) + 'km';
        } else {
          return distance + 'm';
        }
      }
      return '';
    },
    antipodeDistance (point: Point) {
      if (this.currentLongitude !== 0 && this.currentLatitude !== 0) {
        const distance = haversine(-this.currentLatitude, this.currentLongitude + 180 > 180 ? this.currentLongitude - 180 : this.currentLongitude + 180, point.latitude, point.longitude);
        if (distance > 10000) {
          return (distance / 1000).toFixed(2) + 'km';
        } else if (distance > 2000) {
          return (distance / 1000).toFixed(3) + 'km';
        } else {
          return distance + 'm';
        }
      }
      return '';
    }
  },
  watch: {
    currentLatitude () {
      if (this.arrayPoints.length === 0 || !this.currentLongitude || !this.currentLatitude) {
        return;
      }
      this.update();
    },
    currentLongitude () {
      if (this.arrayPoints.length === 0 || !this.currentLongitude || !this.currentLatitude) {
        return;
      }
      this.update();
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
      this.antipodeFound = geoVoronoi(this.arrayPoints).find(this.currentLongitude + 180 > 180 ? this.currentLongitude - 180 : this.currentLongitude + 180, -this.currentLatitude);
    }
    this.chart();
    this.getPlayersFromTasty();
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
          <div class="control">
            <button class="button is-small is-info" @click="getRoundFromTasty">Load ongoing round</button>
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
          <option v-for="player in playerNames" :key="player" :value="player"></option>
        </datalist>
        <input class="input is-small" type="text" placeholder="Discord Name" list="players-from-tasty" autocomplete="off" v-model="discordUsername">
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
            <th></th>
            <th>Label</th>
            <th>Image</th>
            <th>Distance</th>
            <th>Antipode Dist.</th>
            <th></th>
          </tr>
        </thead>
        <tbody>
        <tr>
          <td></td>
          <td><input type="number" class="input is-small" v-model.number="latitude" @paste.prevent="parseCoordinates"></td>
          <td><input type="number" class="input is-small" v-model.number="longitude"></td>
          <td></td>
          <td><input type="text" class="input is-small" placeholder="Label" v-model="label"></td>
          <td><input type="text" class="input is-small" placeholder="URL" v-model="url"></td>
          <td></td>
          <td></td>
          <td><button @click="addPoints()" class="button is-small is-primary">+</button></td>
        </tr>
          <tr v-for="(point, index) in points" :key="index" :style="highlightLine(index)">
            <td :style="backgroundColour(index)">&nbsp;</td>
            <td v-if="editIndex === index"><input type="number" class="input is-small" v-model.number="point.latitude"></td>
            <td v-else :class="{'has-text-white': highlightLine(index)}">{{ point.latitude }}</td>
            <td v-if="editIndex === index"><input type="number" class="input is-small" v-model.number="point.longitude"></td>
            <td v-else :class="{'has-text-white': highlightLine(index)}">{{ point.longitude }}</td>
            <td><button class="button is-small is-primary has-text-white" @click="copy(point)"><font-awesome-icon icon="fa-solid fa-copy" /></button></td>
            <td v-if="editIndex === index"><input type="text" class="input is-small" placeholder="Label" v-model="point.label"></td>
            <td v-else :class="{'has-text-white': highlightLine(index)}">{{ point.label }}</td>
            <td v-if="editIndex === index"><input type="text" class="input is-small" placeholder="URL" v-model="point.url"></td>
            <td v-else><img v-if="point.url" :src="point.url" class="thumbnail" :alt="point.label"></td>
            <td :class="{'has-text-white': highlightLine(index)}">{{ distance(point) }}</td>
            <td :class="{'has-text-white': highlightLine(index)}">{{ antipodeDistance(point) }}</td>
            <td>
              <div class="field has-addons">
                <div class="control">
                  <button class="button is-small is-success" v-if="editIndex === index" @click="save(); editIndex = -1"><font-awesome-icon icon="fa-solid fa-save"></font-awesome-icon></button>
                  <button class="button is-small is-info" v-else @click="save(); editIndex = index"><font-awesome-icon icon="fa-solid fa-pencil"></font-awesome-icon></button>
                </div>
                <div class="control">
                  <button class="button is-small is-danger" @click="removePoint(index)"><font-awesome-icon icon="fa-solid fa-times"></font-awesome-icon></button>
                </div>
              </div>
            </td>
          </tr>
        </tbody>
      </table>
    </div>
  </main>
</template>
