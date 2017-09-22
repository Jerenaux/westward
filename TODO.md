* Cleaning:
- Restore "studio" capabilities
- Remove comment-out stuff
- Clean up Utils
- Move Geometry to studio?
- Split server in two (game and dev server)
* Procedural world
* Network
- AOI & Update packages
-- Get existing players on connect, sync movement using AOI/packages
- trim
- Interact with db
- Latency estimation
- Load existing player

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
- Button to add bezier
- Drag-drop points and update bezier
- Button to append new bezier at existing point
- Get path from bezier