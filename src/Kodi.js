import * as xbmc from 'xbmc';

import EventEmitter from 'events';

const config = require('../api_options.json');

const incr_backoff_factor = config.kodi.incremental_backoff_factor || 1.5;
const incr_backoff_max = config.kodi.incremental_backoff_max || 60000;


class Kodi extends EventEmitter {

  constructor() {
    super();
    this.api = new xbmc.XbmcApi();
    this.incr_backoff = 5000;

    this.shows = {};

    this.api.on('connection:open', () => {
      this.incr_backoff = 5000;
      console.log('Kodi: Connected.');
      this.getShows();
    });

    this.api.on('connection:close', () => {
      if (!this.api.connection.socket.connecting) {
        console.log('Kodi: Lost connnection.');
        this.handleDisconnect();
      }
    });

    this.api.on('api:episode', (details) => console.log('onEpisode', details));
    this.api.on('api:playerStopped', (details) => console.log('onPlayerStopped', details));

    this.api.on('notification:play', () => console.log('notification:onPlay'));
    this.api.on('notification:pause', () => console.log('notification:onPause'));
    this.api.on('notification:add', () => console.log('notification:onPause'));
    this.api.on('notification:clear', () => console.log('notification:onPause'));
    this.api.on('notification:scanstarted', () => console.log('notification:onPause'));
    this.api.on('notification:scanfinished', () => console.log('notification:onPause'));
    this.api.on('notification:screensaveractivated', () => console.log('notification:onPause'));
    this.api.on('notification:screensaverdeactivated', () => console.log('notification:onPause'));
  }

  connect() {
    const connection = new xbmc.TCPConnection({
      host: config.kodi.host,
      port: config.kodi.port,
      verbose: true,
    });

    this.api.setConnection(connection);

    this.api.connection.parser.onerror = () => {
      return function (ex) {
        if (ex.message.indexOf("Unexpected end") === 0 && this.api.connection.connecting) {
          // noop this is some weird bug...
          console.log("Kodi: ignored errror", ex.message)
        } else {
          console.log(ex.message)
          throw new Error("JSON parse error: " + ex);
        }
      };
    };

    // we dont want to wait forever for a potentially non-running kodi. Just try again with the incr_backoff
    connection.socket.setTimeout(3000, (data) => {
      if (connection.socket.connecting) {
        console.log('Kodi: Connection took too long to establish, disconnecting.');
        this.api.disconnect();
        this.handleDisconnect();
      }
    });
  }

  handleDisconnect() {
    console.log(`Kodi: Retrying connection in ${this.incr_backoff}ms.`);

    setTimeout(() => this.connect(), this.incr_backoff);

    this.incr_backoff *= incr_backoff_factor;
    if (this.incr_backoff > incr_backoff_max) {
      this.incr_backoff = incr_backoff_max;
    }
  }

  getShows(cb) {
    let count;
    let done_called = false;
    const done = () => {
      if (done_called) {
        return;
      }

      if (--count <= 0) {
        done_called = true;
        if (typeof cb === 'function') {
          cb(this.shows);
        }
      }
    }
    this.api.media.tvshows(null, (shows) => {
      this.shows = {};
      count = shows.length;
      shows.forEach((show) => {
        this.api.media.tvshow(show.tvshowid, {properties: ['imdbnumber']}, (details) => {
          this.shows[show.label] = {
            imdb: parseInt(details.imdbnumber, 10),
            id: show.tvshowid
          };
          done();
        });
      });
    });
  }

  getShowIMDBIdFromEpisodeId(episodeid, cb) {
    this.api.media.episode(episodeid, null, (episode) => {
      const done = () => {
        cb(this.shows[episode.showtitle].imdb);
      }
      if (this.shows[episode.showtitle]) {
        done();
      } else {
        this.getShows(done);
      }
    });

  }

}


export default Kodi;