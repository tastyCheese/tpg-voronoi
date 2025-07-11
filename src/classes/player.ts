export default class Player {
  discord_id: string;
  name: string;
  username: string;

  constructor(discord_id: string, name: string, username: string) {
    this.discord_id = discord_id;
    this.name = name;
    this.username = username;
  }
}
