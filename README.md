### Description

This is a small service that listens to your Kodi when you watched an episode (or marked it as watched/unwatched) and syncs your monitored status in Sonarr. 
This way Sonarr won't download things you've already seen.

**Requires node v6!** (you could change the babel build to support lower versions)

### Running

Make sure you edit the api_options.json file first, to add the proper hosts, ports and the sonarr api_key.

```
npm install --production && npm run build && npm run start
```

### Development

```
npm install && npm run start-dev
```

##### Why not just a Kodi plugin?
Too lazy to learn Kodi plugin development stuff, plus this way it can run on a different machine. Some Kodi installs run on crazy environments.
