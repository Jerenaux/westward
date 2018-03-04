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

- Think about typical gameplay scenarios and decide milestones accordingly
- Profiles: new vs old player, focused on self vs setllement, x 4 classes

Then:
- Make Westward page
- Trailer
- Have 2 settlements, with important differences
- Several very different buildings 
- World map-based settlement selection menu (mention key aspects, display enemy civ threats)
- Class selection menu (describe impact on settlements)
- Help buttons *everywhere*
- Add short descriptions to items
- One-time single-panel combat tutorial when first combat
- One-time single-panel intro text when first login
- Orientation panel in char menu hinting at what to do and where to go (w/ map?)
Goal: 1h of gameplay?

Week:
-----
Battle: update hover card of life bar
Fort: staff
Fort: dev lvl progress bar glitch
Construction: notification of civic xp gain
Economic loop: test all updates of all menus 
Economic loop: harvest herbs
Net: ghost animals when transitioning aoi? + removal of non-existing ones
UI: test tooltip of items (after having added hpmax)
UI: display event pop-ups after skinning
UI: dont tween progress bars when opening menu
UI: accessories tooltip glitch
UI: bubble doesn't show when taking before moving
Character: upon de-commit, slots are not cleared
Character: display stat modifiers details

Finish:  test economy for a while;
decide duration of all cycles (eco, spawn...); inspect all panes and set interesting values to everything

Cleaning:
--------
Performance:
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
- Setters/getters everywhere
- Clean orientation code based on tweens, not previous pos?
- Streamline getNext/recycle stuff
- Hero class, StatsManager, EquipmentManager (NetworkManager?)
- Clean up Building.update() and updateSelf()
- Centralize all texts
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
- Animals have sorted list of targets, iteratr through it when first one not reachable for some reason
-> Deal with big battlefields; focus camera on active player (problem: if far away, surrounding AOIs not displayed), ...
- Animal can trigger fights
* Ecosystem
- Listing and distribution of pick-up resources
- Listing and distribution (and yield) of building resources
- Listing and distribution of animals
- Work out location and mechanics of enemy civ.  
* Inventory
- Have only one ammo type equiped at all time (depending on weapon), for rdmg stat
- Pick up items
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
- Finish copying notes (currently: in ambiance, npc dialogues)
- Make Excel tables (crafting, inventory, bestiary, ...)
- Make powerpoint
- Make feature matrix
- Consequence graphs
- Tidy up (charts, tables, Latex formulas...)
- For v1 schedule: follow https://www.youtube.com/watch?v=moW8-MXjivs priorization method from (36:00)

Polish:
------
Visual:
- Show "new" tag when opening inventory
- Cut corners of big battlezones? (but make sure it doesn't impact integrity)
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
- Item descriptions
- Keyboard shortcuts for menus?
- Categories of items? (How to concile with various backpack sizes)? Sorting of items?
- Feedback for rejected paths because too long (question mark, sound, ...)
- Polish existing content
- Footsteps, light effects, sound effects (on actions + environment: birds, water, ...)
- HUD, title screen, animations ...
- Animal noises when beasts in proximity, animal footsteps, player footsteps noise
- Carcasses, traces of fight
- Fix panel tweens (positions not update often enough?)
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
* Cheat-proof everything 
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

