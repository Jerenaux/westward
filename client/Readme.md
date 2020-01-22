## Client

This directory contain most of the files used by the client (the remaining ones being in the `/shared` folder). Most of
these files are used by being imported in one of the two main game scenes, `Engine` and `UI`, which are defined in `Engine.js`
and `UI.js` respectively (see explanation in [codebase structure](https://github.com/Jerenaux/westward/wiki/Structure-of-the-codebase)
wiki page.)

All these files are bundled by webpack into `dist/client.js`. 