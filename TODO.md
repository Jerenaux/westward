Admin
Analytics
Cleaning
* Ambiance
* Battle system
* Civics
* Craftsmen gameplay
* Explorer gameplay
* Inventory
* Merchant gameplay
* Misc
* Orientation
* Packaging
* Settlement defense
* Settlement economy
* Soldier gameplay
Deployment
Design document
Polish
Testing
World Building
Free

###############
V1 level:
###############

Admin
-----
Set gold
Set coordinates
Set settlement parameters
Display last and *next* cycles
Dump db
Secure

Analytics:
---------
- Implement custom analytics, save in db
- Look for nice statistical library
- Log drains and faucets
- Log as many things as possible: session duration, distance travelled per session, time spent in settlement per session, in nature per session,
interactions with buildings, time spent in each individual menu, etc.
- Cluster "heavy" players vs "small-time" players and look for differences between the two
- Analyze sessions of one-time players who never come back
- Find other meaningful clusters (maybe in unsupervized fashion)
- Compare behaviors to how you expect the game to be played

Cleaning:
--------
Performance:
- Use pool for notifications
- Avoid duplicate pins in maps, danger pins etc.
- Fix "already existing/non-existing" bugs
- Animals keep their target
- "Sleep" mode for NPC when no player in currentAOI.entities (change flags on AOI transition, not on every NPC update loop iteration)
- Pathmaking instead of pahfinding?
- Concile the two coexisting menu update systems: the one used by updateSelf and the one used by updateBuilding
-> All menus have an update() method called on display; upon new server data, only update() the current menu
- Dont send full building inventories when buying/selling (send arrays of deltas)
- Fix null values in left-fringe chunks (fixed?)
->nulls in corrupted chunks likely arise from "undefined" values being converted to null by JSON.stringify
-> Happens on the fringe -> because for these drawShore returns undefined?!
- listCollisions: don't store water tiles, only shore etc.
- Flattening: second pass to delete water-only chunks based on visibility
- Flattening based on transparency
- Store tiles of the shape of a building somewhere instead of recomputing (e.g. in canBuild) [May be obsolete if buildings have rect shapes in future]
Order:
- Config: toggle aggro
- Move spawnZone data to JSON file
- Central config file: https://github.com/lorenwest/node-config/wiki/Configuration-Files
- Use data registry for data exchange between scenes (see Phaser World 119)
- Client-side, GameObject use tx and ty while Moving use tileX and tileY (and they both have a setPosition method)
=> fix in processItemClick, etc, test a lot
- Put settlement stuff in database
- Clean scene transition code
- Move UI stuff from Engine to UI
- Settlements: after compute food surplus, one central method to broadcast it to buildings and players, using one
common "formatFoorSurplus" method to decide exact formatting (witg a reciprocal function client-side)
- Building update: somehow check for fields in data not in map, and make a warning?
- Remove quick fixes about setFrame (big buttons, ctrl+f on quick fix)
- Deduce food_id from database
- Use schemas for players
- "getName()" method to get items names rather than accessing dict
- Rework longslot system
- Rethink the calling of all events on menu open
- Setters/getters everywhere
- Remove Engine.updateInventory() (moved to Inventory)
- Clean orientation code based on tweens, not previous pos?
- Hero class, StatsManager, EquipmentManager (NetworkManager?)
- Clean up Building.update() and updateSelf()
- Centralize all texts (incl. stats, equip, and even item descriptions)
- Remove the shop-specific code from enterBuilding (use onEnter event if need be, manage inventory filters properly)
- Tie input events to game objects, rather than global functions (use topOnly)
- Remove unnecessary files (esp. sprites)
- Remove "longslot" stuff intended for stretching longslots vertically?
- Find out how to generate graphics objects (grid tiles, gradients...) programmatically for various uses
- Use events gameobject events for input + custom events for updating menus (https://phaser.io/phaser3/devlog/112)
- One clean, central way to manage tilesets, config variables, depth, blitters... (blitter selection in client/Chunk, "mawLayer" field in WorldEditor ...)
- Give toString method to custom objects to replace [this.constructor.name this.id] ...
- Decide what to do with assets/maps folder, both for dev and prod
- Merge all the addXXX and removeXXX methods (but keepl separate lists) + merge addXXX loops in updateWorld()
- Split server in two (game and dev server)
- Remove unnecessary Geometry methods (and world-building methods from studio/Engine)

Content:
-------
* Ambiance
- Plants spawn in clusters
- Specific zones for all items, not random spread
- Footsteps to all creatures, sound effects (on actions + environment: birds, water, ...)
- Animal noises when beasts in proximity, animal footsteps, player footsteps noise
- Carcasses, traces of fight, traces of campfires
- Paths along most-travelled paths
* Battle system
- Get arrows back when skinning
- Animals have sorted list of targets, iteratr through it when first one not reachable for some reason
-> Deal with big battlefields; focus camera on active player (problem: if far away, surrounding AOIs not displayed), ...
- Fighters queue indicating participants and upcoming turns
- Identify characters in the way of ranged attacks
- Anti-friendly fire safety for ranged attacks
- Stats and formulas for bombs
- Mechanic for bombs
- Anti-friendly fire safety for bombs
- Shield stats and formulas
- Shield mechanics
- Increase fatigue when fighting
- Effect of fatigue on fighting
- Compute probability of items breaking and discard them
- Accommodate NPC
* Civics
- Civic levels
- Elections
- Naming officials
* Craftsmen gameplay
- XP
- Bonuses
- Recipes
- Tier
- Upgrades
- Naming
- Quests
* Explorer gameplay
- XP
- Bonuses
- Fog of war
- Map mechanics
- Quests
* Inventory
- In shops, filter-out bought/sold items by graying them, but still display
- Dropping items
- Belt mechanics (quick-use slots for potions, bombs and weapons)
- Backpack mechanics
- Gunpowder mechanics (multiple pouches?)
- Ammo types
* Merchant gameplay
- XP
- Bonuses
- Shops
- Caravans
- Homeland trade
- Inns
- Quests
* Misc
- Fix continuous movement system
- Events log
- Fatigue
- Rest
- Campfires
- Respawn losses
- Messaging -> Very first mail is a RP mail giving some background about the game
- Leaderboards
- Guilds
* Orientation
* Packaging
-> Determine new player by querying server
-> Nb connected, permanent players, player names, ..
-> Cheat-proof
* Settlement defense
- Enable commander to build towers
- Set up stats of towers and forts
- Towers behave as animals and trigger fights (same battle behavior)
- Same with forts
- Enable commander to build barracks
- Production of NPC troops
- Set up stats of troops
- Make troops engage enemies
* Settlement economy
Stop sending commit slots repeatedly
Hide commit button when already committed
Implement and test decommitment from db data
Recipe: paper cartridges (paper also for bombs?)?
Make recipes (randomly?) for 5 consumables (potion, antidote, steady stuff...) + create ingredients
Recipes for fancy bullets and bombs
Workshop building, interface = usual crafting menu
-> update advice
Add shop interface as well
Display recipes with building and class restrictions
Update help text of recipes
Coal mine
Resource flow to trade post
Gold flow from tarde post to fort
Add all other mines (iron, sulfur, gold) + flows
Add wood and stone flow to trade post
Specific interface for workshop, with own stock and settlement stock + gold
-> 100% own stock or 100% city stock to begin with
-> If using city stock, created item also lands in city stock
Fork trade post gold flow to fork and workshop
Set reward of recipes for settlement (0 = disabled)
Golden ore flow from mine to workshop
Recipe for golden ore -> gold ingots
Recipe for gold ingots -> currency
Addition "fuel" field (wood)
Add dialog to allow using own stuff for missing ingredients when city-forging
Make spawn zones for plants/shrooms/etc.
Make separate brewing interface, similar but with adjustable dosage
Add "brewing" time
Add checkboxes for what should be boiled or grinded
- Resources flow
- Let chancellor set prices in trade post
- Trade with overseas
- Salaries for officials, taxes
- New buildings
- Dev levels
* Soldier gameplay
- XP
- Bonuses
- Bombs
- Rare/strong foes
- Quests

Deployment:
----------
- Flatten chunks and reduce them to arrays only
- Code to load flattened chunks in game
- Separate as much as possible the code required for production and the code required for testing
- Tool to gather, uglify and compress all relevant source files and move them to production directory
- Automate git upload to Heroku (http://radek.io/2015/10/27/nodegit/)
- Full pipeline: flatten->gather->upload (flatten and gather not necessary for 100% of commits, so need to be able to select them with flags)
- Tool to automatically merge all graphic assets in atlases?
- Way to interact with Node server online, without restarting (e.g. change variables, reload data...)
- Improve flattening by making transparency checks
- Secure chunk access? (check client position before serving)
- Desktop app (automated)

Design document:
---------------
-> Market research
- Finish copying notes (currently: in ambiance, npc dialogues)
- Concile all texts (doc, crafting.txt)
- Decide list of buildings, items, ...
- Make Excel tables (crafting, inventory, bestiary, ...)
- Make powerpoint
- Make feature matrix
- Consequence graphs
- Tidy up (charts, tables, Latex formulas...)
- For v1 schedule: follow https://www.youtube.com/watch?v=moW8-MXjivs priorization method from (36:00)

Polish:
------
Visual:
- Use sprite with animations
- "Tip of the day"
- Revamp class selection
- Fix continuous movement
- Polish title screen (leaves, bird passing in the distance...)
- Fade-in/out transitions (wait for containers?)
- Favicon
- Show "new" tag when opening inventory
- Cut corners of big battlezones? (but make sure it doesn't impact integrity: save integrity path and used it for that)
- Variety of small "talk" bubbles in reaction to things happening (+ symbol bubbles?)
- Adapt bubble duration (in bubble.display) depending on number of words
- Add dirt below buildings
- Animation when using item, throwing item, equipping... (reactive, before getting network response)
- Hover frame for closing cross
- Hover background for inventory tiles?
- Hower card over gold indicator
- When hovering equipment, highlight corresponding equip slot
- Use particle emitters for several cool effects, like cloud puffs, dust when walking, lights, etc.
- Light effect layer (https://www.codeandweb.com/texturepacker/tutorials/how-to-create-light-effects-in-phaser3)
- Add cloud silhouettes
- Custom movement marker
- Use matter.js to simulate wind on leaves? (Dead/alive leaves flying on screen)
Sound:
- Sound effects when clicking (for moving, on buttons in menus, sounds of shuffling pages...)
- Noise when walking
- Noise when clicking on building (each building its noise)
- Noise when clicking on non-walkable tile
- Unique noise for items
- Crafting SFX
General:
- Keyboard shortcuts for menus?
- Categories of items? (How to concile with various backpack sizes)? Sorting of items?
- Polish existing content
- Light effects
- HUD, title screen, animations ...
- Varied and nice landmarks to give life to the world and act as waypoints

Testing:
-------
- Make numeric simulations linking everything:
-> Time to acquire dev level goals based on building production rates, varying number of buildings, productivity, etc.
-> Evolution of food surplus based on number of players, buildings, etc.
-> Set all these paremeters in a virtual settlement, simulate one day/week/month/year buy iteratively computing all cycles and their consequences in that time, then see results
- Figure out testing:
- Have a test server, test database a test map set up
- Open browser and run test script in test world
- Manually run it before deployment
- Have the testing pipeline work with both development and production code (run it once, prodify, then check again, the upload)
- Optimize: remove divisions, benchmark runtimes, etc.

World building:
--------------
-> Custom pathfinding, World editor, manage spawn zones...
Custom chunk editor:
- Arrows on the fringes of the window allow to move quickly to adjacent chunks
- See borders of adjacent chunks to match fringe tiles
- Preserve whatever extra info is in the JSON file (vs Tiled who rewrites it)
- Versioning of individual chunks (saved in separate folder), for unlimited undos
- Add random elements (w/ scripts to remove them):
-> Patches of dirt
-> Tree decorations: flowers, stones, bushes
- Add cliffs in empty areas
-> Add random decorations to cliffs (stones in bends, ...)
- Compute tree density and spread random trees around accordingly?
- No tree if busy 3cells to the left? Or when planing tree, log width cells to right as no-go position
- Fix loops (lakes ...)
- Plan for more layers in dev
- Store forests and trees separately (trees.json) during dev?
-> During flattening, read that file and draw trees tile by tile
-> Test high-layers after flattening
