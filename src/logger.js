import bunyan from 'bunyan';

var log = bunyan.createLogger({
  name: 'kotosomo',
    streams: [{
        path: './kotosomo.log'
  }]
});

export default log;