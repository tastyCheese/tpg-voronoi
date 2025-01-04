export default class Point {
  longitude: number;
  latitude: number;
  label: string;
  url: string;

  constructor(longitude: number, latitude: number, label: string, url: string) {
    this.longitude = longitude;
    this.latitude = latitude;
    this.label = label;
    this.url = url;
  }
}
