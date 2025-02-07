export default class Round {
  longitude: number;
  latitude: number;
  ongoing: boolean;
  number: number;
  water: boolean;

  constructor(longitude: number, latitude: number, ongoing: boolean, number: number, water: boolean) {
    this.longitude = longitude;
    this.latitude = latitude;
    this.ongoing = ongoing;
    this.number = number;
    this.water = water;
  }
}
