Cleaning
* Battle system
* Inventory
* Settlement defense
* Settlement economy
* Settlement management
Design document
Polish

###############
Prototype level:
###############

Week:
-----
*1 item/recipe a day*
Bug: wrong building displayed in commit slots
Bug: re-entering building needs two clicks
Bug: no animals on buildings (wrong collisions?)
Bug: wrong click area of foundations
UI: test snapshot of bugs of menus
Design document
One-time single-panel combat tutorial when first combat
Test second settlement (fort and respawn)
World map-based settlement selection menu (mention key startegic aspects, display enemy civ threats)
Fort: staff (msg: you need civic lvl2 to vote for governor)
Battle: monsters trigger fights (move spawn zones)
Economic loop: harvest herbs (scatter roots)
Economic loop: clamp settlement resources (at least food to 0)
Help: One-time single-panel intro text when first login
Help: buttons in menus
Help: buttons in buildings
Equipment slot descriptions (guns less accurate, ...)
Quick-craft recipes: bow, potion + arrow, hatchet
Start equipment: sword, bow, quiver, 5 arrows, 1 potion, some gold

Finish:
-------
Trailer
Decide cycle (eco, spawn)
Make sure all menus have something interesting to show 
Test economy for a while
When forge, update equip advice to include crafting
Reread all tips and help
Economic loop: test all updates of all menus
Synchronize presentation page, maybe explicit which features are still absent
Online shop: tunic, shield, a few arrows, a few potions
Permanent players
Polish

Economy build-up:
----------------
*1 item/recipe a day*
Make recipes for 5 items (sword, bullets, bombs...) + create ingredients
Make recipes (randomly?) for 5 consumables (potion, antidote, steady stuff...) + create ingredients
Recipes for fancy bullets and bombs
Add recipes for all intermediary ingredients
Workshop building, interface = usual crafting menu
Add shop interface as well
Display recipes with building and class restrictions
Scatter basic ingredients
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


Cleaning:
--------
Performance:
- Fix "already existing/non-existing" bugs
- Use Phaser tilemaps?
- Animals keep their target
- "Sleep" mode for NPC when no player in currentAOI.entities (change flags on AOI transition, not on every NPC update loop iteration)
- Pathmaking instead of pahfinding?
- Concile the two coexisting menu update systems: the one used by updateSelf and the one used by updateBuilding
-> All menus have an update() method called on display; upon new server data, only update() the current menu
- Dont send full building inventories when buying/selling (send arrays of deltas)
- Use pools for players, animals, ...
- Fix null values in left-fringe chunks (fixed?)
->nulls in corrupted chunks likely arise from "undefined" values being converted to null by JSON.stringify
-> Happens on the fringe -> because for these drawShore returns undefined?!
- listCollisions: don't store water tiles, only shore etc.
- Flattening: second pass to delete water-only chunks based on visibility
- Flattening based on transparency
- Store tiles of the shape of a building somewhere instead of recomputing (e.g. in canBuild) [May be obsolete if buildings have rect shapes in future]
Order:
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
* Battle system
Bug: bubble at wrong location after respawn
- Animals have sorted list of targets, iteratr through it when first one not reachable for some reason
-> Deal with big battlefields; focus camera on active player (problem: if far away, surrounding AOIs not displayed), ...
- Animal can trigger fights
* Ecosystem
- Listing and distribution of pick-up resources
- Listing and distribution (and yield) of building resources
- Listing and distribution of animals
- Roots obtained from "harvesting" plants (yields flower + root; different plants, different flowers and roots)
- Work out location and mechanics of enemy civ.  
* Inventory
- Add crafting recipes
- Gold hover card (in buildings too)
- Have only one ammo type equiped at all time (depending on weapon), for rdmg stat
- Two resources for guns: bullets and powder (different powders with different properties)
* Movement
- Improve timeline and orientation using the onStart callbacks of individual tweens
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
- Yellow pins for unbuilt buildings
- Move stock around buildings
- Let chancellor set prices in trade post
- Automatic shop systemn in port for chancellor
- Trade with overseas
- Restrict prerogatives based on official position
- Let governor name chancellors
- Salaries for officials
- Work out settlement levels
* Settlement management
- Restrict prerogatives based on official position
- Enable governor to name chancellors and commanders
- Election of governors

Design document:
---------------
- Make numeric simulations linking everything:
-> Time to acquire dev level goals based on building production rates, varying number of buildings, productivity, etc.
-> Evolution of food surplus based on number of players, buildings, etc.
-> Set all these paremeters in a virtual settlement, simulate one day/week/month/year buy iteratively computing all cycles and their consequences in that time, then see results
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
- Move marker on move() event (in addition to mousemove) and handle keeping pressed
- Polish title screen (leaves, bird passing in the distance...)
- Fade-in/out transitions (wait for containers?)
- Favicon
- Show "new" tag when opening inventory
- Cut corners of big battlezones? (but make sure it doesn't impact integrity: save integrity path and used it for that)
- Variety of small "talk" bubbles in reaction to things happening (+ symbol bubbles?)
- Adapt bubble duration (in bubble.display) depending on number of words
- Different mouse cursors depending on battle situation
- Add dirt below buildings
- Find better font
- Pop-up notifications after actions
- Fix tooltips displaying too long on equipped equipment slots
- Display stats effects relative to current equipment
- Help buttons everywhere
- Animation when using item, throwing item, equipping... (reactive, before getting network response)
- Menu sprites change size when hovered / clicked
- Hover cards over craftring buttons
- Hower card over gold indicator
- Highlight buttons and buildings on hover
- When hovering equipment, highlight corresponding equip slot
- Use particle emitters for several cool effects, like cloud puffs, dust, lights, etc.
- Light effect layer
- Add cloud silhouettes
- Custom movement marker
- Different footpritns for different animals
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
- Feedback for rejected paths because too long (question mark, sound, ...)
- Polish existing content
- Footsteps, light effects, sound effects (on actions + environment: birds, water, ...)
- HUD, title screen, animations ...
- Animal noises when beasts in proximity, animal footsteps, player footsteps noise
- Carcasses, traces of fight
- Varied and nice landmarks to give life to the world and act as waypoints


###############
V1 level:
###############

Analytics:
---------
- Use gameanalytics? http://phaser.io/tutorials/game-analytics
- Log as many things as possible: session duration, distance travelled per session, time spent in settlement per session, in nature per session,
interactions with buildings, time spent in each individual menu, etc.
- Cluster "heavy" players vs "small-time" players and look for differences between the two
- Analyze sessions of one-time players who never come back
- Find other meaningful clusters (maybe in unsupervized fashion)
- Compare behaviors to how you expect the game to be played

Content:
-------
* Cheat-proof everything , secure admin
- Including crafting recipes
* Battle system
- Fighters queue indicating participants and upcoming turns
- Battle experience
- Identify characters in the way of ranged attacks
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
* Character menu:
- Lvl-up system
- Make actions generate an entry in events log
- Events log: what you did (and effects: xp gains, health gains, ...), the notifications you got, what you said and people around said
- Daily quests
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
- Campfires
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
*Inventory:
- Add possibility to throw item, (incl. number)
- Allow to use multiple items in one action
* Inns
(- Enable players to put construction site)
(- Enable players to commit to construction)
- Shop management (custom stock, prices...)
- Set respawn fee
- Set respawn site
- Chat
- Gazette
* Mail system (using birds)
* (Mini)map system
* Movement
- Check paths and block if error
- Keep track of player position along path on server
- Adjust movement duration based on latency
- Remove possible echo
- Investigate smoothenPath and compressPath)
- Hold & click
* NPC
* Pop-up fade-out notifications to everything in corners (+ log in character menu)
* Player interactions:
- Display menu when click on players, display buttons (give item, give money)
- Give items/money
* Settlement defense
* Settlement economy
- Fixed building spots; number increases with dev level
* Skills menu
* Trade
- Enable bonuses of merchants
- Allow merchants and artisans to build their shops
* Tutorial
* World map
- Menu with static image
- Minimap
- Fog of war and exploration (chunks-based)

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

Testing:
-------
- Make public attributions to assets you used
- Figure out testing:
- Have a test server, test database a test map set up
- Open browser and run test script in test world
- Manually run it before deployment
- Have the testing pipeline work with both development and production code (run it once, prodify, then check again, the upload)
- Optimize: remove divisions, benchmark runtimes, etc.

Tools:
------
Custom chunk editor:
- Arrows on the fringes of the window allow to move quickly to adjacent chunks
- See borders of adjacent chunks to match fringe tiles
- Preserve whatever extra info is in the JSON file (vs Tiled who rewrites it)
- Versioning of individual chunks (saved in separate folder), for unlimited undos


World building:
--------------
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

###############
V2 level:
###############
- PvP
- Naval exploration

