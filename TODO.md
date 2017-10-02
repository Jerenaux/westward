World building
Design document
Clean code
Movement


* Cleaning:
- Clean up Utils
- Move Geometry to studio?
- Split server in two (game and dev server)
- Order files in studio
- Standardize the use of Utils methods for coordianes manipulations (gritoline, lientogrid, tiletoiAOI, AOItotile, tileRelativeToAOI...)
- Have a universal ChunkEdit class used accross all tools for all types of modifications
-> Or a ChunkHolder class which stores chunks in some way and only expose a addTile method which is used by the editor/geometry classes as a callback
-> Possibly the same chunk management both in live edit and with tools; remake the redo/switch function by getting rid
of the awkward temporary chunks, and instead, when editing, make a backup copy of affected chunks, and when redo/switch,
just restore it
- Clean Chunk and ChunkEdit for obsolete methods
- Sort-out shardness of Utils, and the need to have common properties such as tileWidth etc. readily available both in dev and prod
- Clean makeWorld up and compartimentalize (makeLake, fillLake, makeCliff (fillCliff?), etc.
- Remove unnecessary test code from client/Engine.js:start()
-----
*Moving:
https://www.npmjs.com/package/pathfinding
- Fix pathfinding bugs
- Investigate smoothenPath and compressPath, especially for networking
- Hold & click
- Verticality stuff (trees canopy, etc.)
- Make a Uitls.getDuration method to return duration based on distance
- Animate
-----
* Deployment
- Two repositories, for production and development, with node scripts taking care
of copying what is needed from one to the other (+ uglifying and compressing etc.)
-> Possible to programmatically push?  http://radek.io/2015/10/27/nodegit/
- Somehow remove/disable debug components automatically
- Desktop app a simple terminal that gets everything from server (= exact same
appearance and behaviour, reduced code visibility, and possibly *no* node-modules)
- Scripts to group what is needed for the app, uglify/compress and build
- Migrate Geometry to server to hide it?
- Secure chunk access? (check client position before serving)
-----
* Tools:
- Top-down visibility optimization (create a lookup table of transparency)
- Prune map files more
- Testing (make part of the pipeline)
-----
* World editor:
- Fix all anomalies


Axes of progress:
- Battle system
- Exploration
- Trade
- Crafting
- Settlement defense
- Settlement economy
- Polish (footsteps, sound and light effects, HUD...)
- Testing
- Benchmark operations (divisions, creating objects vs reusing them, etc.)
- Cleaning
- Tutorial
- Daily quests
- Map
+ World building, design document, ...