Cleaning
* Battle system
* Crafting
* Exploration/travel
* HUD
* Equipment menu
* Movement:
* Player interactions
* Settlement defense
* Settlement economy
* Skills menu
* Trade
Design document
Polish
World building

###############
Prototype level:
###############

Cleaning:
--------
- Clean makeWorld up and compartimentalize (makeLake, fillLake, makeCliff (fillCliff?), etc.
- Remove unnecessary test code from client/Engine.js:start()
- Clean up Utils
- Write Readme detailling structure of code: assets, client/server/shared code (-> for production), tools (command-line scripts) and studio
- Move Geometry to studio
- Split server in two (game and dev server)
- Order files in studio
- Standardize the use of Utils methods for coordianes manipulations (gridtoline, lientogrid, tiletoiAOI, AOItotile, tileRelativeToAOI...)
- Sort-out shardness issues of Utils, and the need to have common properties such as tileWidth etc. readily available both in dev and prod
- Remove unnecessary map directories/files and assets
- Clean all files

Content:
-------
* Battle system
- Spawn a few monsters, have them roam about (movement, animation, sync...)
- Trigger battle when clicking on monster
- Compute and display battle grid
- Adjust camera
- Set up turns, and timers
- Menus to decide which action to take, on which target
- Movement on the battlefield
- Set up basic stats and formulas for melee attacks
- Mechanic for melee attacks
- Animation for melee attacks
- Stats and formulas for ranged attacks
- Mechanic for ranged attacks
- Identify characters in the way
- Factor in defensive equipment
- Monster AI
- Manage end of fight
- Respawn
- Battle experience
- Spawn loot
- Readjust camera
- Sync battles with other players
- Allow players to jump in
- Animal can spot players
- Battle triggered upon being spotted
- Add a few savages with roaming behaviour
- Expand battle AI for savages
- Improve roaming behavior of savages
- Have a permanent presence of savages and animals around settlements
* Crafting
- Design crafting system
- Crafting menu
- Crafting mechanic for health kits
- Display known formulas
- Block advanced formulas based on class and lvl
- Enable a dozen craftable items (minimal necessities for all other aspects of the game)
* Exploration/travel
- Have a permanent presence of a few pickup items around settlements
- Settlements
* Equipment menu
* HUD/Menus:
- Inventory
- Skills
- Crafting
- Status
- Chat
- Notifications/News
- Gold
- Health
* Movement:
- Update aoi server-side when ending path
- Create collision tiles at building locations
- Animate
- Verticality stuff (trees canopy, etc.)
* Player interactions
- Chat
- Give items/money
* Settlement defense

* Settlement economy
* Skills menu
* Trade

Design document:
---------------
- Find nice to-do list system
- Finish copying notes
- Make Excel tables (inventory, bestiary, ...)
- Make powerpoint
- Tidy up (charts, tables, Latex formulas...)

Polish:
------
- Mouse cursor; changes over buttons and buildings (differently if possible)
- Highlight buttons and buildings on hover
- Custom movement marker
- Sound effects when clicking (for moving, on buttons in menus, sounds of shuffling pages...)
- Noise when walking
- Noise when clicking on building (each building its noise)
- Noise when clicking on non-walkable tile
- Polish existing content
- Footsteps, light effects, sound effects (on actions + environment: birds, water, ...)
- HUD, title screen, animations ...
- Animal noises when beasts in proximity, animal footsteps, player footsteps noise
- Carcasses, traces of fight

World building:
--------------
- Check usefulness of addCorners
- Do not create chunk files for chunks which contain only water (sum(data) = nbChunks*292)
- Process multiple paths (test on Australia with its lakes?)
- Remove points along the edges of the map from paths (clamp to map limits and then prune)
- Try and make east coast with rivers and lakes
- Have a universal ChunkEdit class used accross all tools for all types of modifications
-> Or a ChunkHolder class which stores chunks in some way and only expose a addTile method which is used by the editor/geometry classes as a callback
-> Possibly the same chunk management both in live edit and with tools; remake the redo/switch function by getting rid
of the awkward temporary chunks, and instead, when editing, make a backup copy of affected chunks, and when redo/switch,
just restore it
- Fix saving tool
- Investigate the possibility of making cliffs from terrain data of the east coast
- Fix cliif outlines
- Add forests
- Add random elements

###############
V1 level:
###############

Content:
-------
* Battle system
- Anti-friendly fire safety for ranged attacks
- Stats and formulas for bombs
- Mechanic for bombs
- Anti-friendly fire safety for bombs
- Shield stats and formulas
- Shield mechanics
- Increase fatigue when fighting
- Effect of fatigue on fighting
- Loss of equipment upon respawning
- Compute probability of items breaking and discard them
- Accommodate NPC
* Crafting
- Determine quality level based on artisan level
- Design upgrade system
- Upgrade menu
- Upgrade mechanic based on quality
- Increase fatigue when crafting
- Effect of fatigue on crafting
- Set up tool to define hunting areas
- Have wildlife spawn accordingly
* Daily quests
* Exploration/travel:
- Travel increases fatigue
- Spotting of settlements, with indicator
- Spotting of inns, with indicator
- Spotting of wildlife and enemies, with indicator
- Spotting of other players
- Increase range based on class and possible items
* (Mini)map system
* Equipment menu
* HUD/Menus
- Fatigue meter
- Minimap
- Daily quests
* (Mini)map system
* Movement
- Check paths and block if error
- Keep track of player position along path on server
- Adjust movement duration based on latency
- Remove possible echo
- Investigate smoothenPath and compressPath)
- Hold & click
* NPC
* Settlement defense
* Settlement economy
* Skills menu
* Trade
* Tutorial

Deployment:
----------
- Flatten chunks and reduce them to arrays only
- Code to load flattened chunks in game
- Separate as much as possible the code required for production and the code required for testing
- Tool to gather, uglify and compress all relevant source files and move them to production directory
- Automate git upload to Heroku (http://radek.io/2015/10/27/nodegit/)
- Full pipeline: flatten->gather->upload (flatten and gather not necessary for 100% of commits, so need to be able to select them with flags)
- Improve flattening by making transparency checks
- Tool to automatically merge all graphic assets in atlases?
- Secure chunk access? (check client position before serving)


Testing:
-------
- Figure out testing:
- Have a test server, test database a test map set up
- Open browser and run test script in test world
- Manually run it before deployment
- Have the testing pipeline work with both development and production code (run it once, prodify, then check again, the upload)
- Optimize: remove divisions, benchmark runtimes, etc.

###############
V2 level:
###############
- PvP
- Naval exploration