World building
Design document
Clean code
Movement

Next dev log:
Networking, pathfinding & splines
or
Netowrking, pathfinding & Australia
Lots owned to Phaserquest, nice architecture
Hacking pathfinding with arcane proxies
Need to be able to scale world at will

* Cleaning:
- Clean up Utils
- Move Geometry to studio?
- Remove phaser_map and mapbis
- Split server in two (game and dev server)
- Order files in studio
- Standardize the use of Utils methods for coordianes manipulations (gritoline, lientogrid, tiletoiAOI, AOItotile, tileRelativeToAOI...)
- Have a universal ChunkEdit class used accross all tools for all types of modifications
- Clean Chunk and ChunkEdit for obsolete methods
- Sort-out shardness of Utils, and the need to have common properties such as tileWidth etc. readily available both in dev and prod
-----
*Moving:
https://www.npmjs.com/package/pathfinding
- Investigate smoothenPath and compressPath, especially for networking
- Use of spaceMap
- Modify getNode
- Hold & click
- Verticality stuff
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
- Zoom-out even further
- Make proper coast out of path
- Remove anomalies
- Make path parser a separate tool, to output a JSON object to which to add other blueprint components (forest zones, lakes...)


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