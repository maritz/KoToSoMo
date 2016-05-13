import Request from 'request-promise';

const config = require('../api_options.json');

class Sonarr {

  constructor() {
    this.getShows();
  }

  async getShows() {
    this.shows = {};

    return this.shows;
  }



}


export default Sonarr;