export default class Submission {
  round: number;
  longitude: number;
  latitude: number;

  constructor(round: number, longitude: number, latitude: number) {
    this.round = round;
    this.longitude = longitude;
    this.latitude = latitude;
  }
}
