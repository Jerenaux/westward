Cleaning
* Battle system
* Exploration/travel
* Inns
* Inventory
* Player interactions
* Settlement defense
* Settlement economy
* Trade
* World map
Design document
Polish
World building

###############
Prototype level:
###############

Cleaning:
--------
Performance:
- Use pool for footsteps (see Groups, who now act as pools)
- Fix null values in left-fringe chunks
->nulls in corrupted chunks likely arise from "undefined" values being converted to null by JSON.stringify
-> Happens on the fringe -> because for these drawShore returns undefined?!
- listCollisions: don't store water tiles, only shore etc.
- Flattening: second pass to delete water-only chunks based on visibility
- Flattening based on transparency
- Store tiles of the shape of a building somewhere instead of recomputing (e.g. in canBuild) [May be obsolete if buildings have rect shapes in future]
Order:
- One clean, central way to manage tilesets, depth, blitters... (blitter selection in client/Chunk, "mawLayer" field in WorldEditor ...)
- Give toString method to custom objects to replace [this.constructor.name this.id] ...
- Decide what to do with assets/maps folder, both for dev and prod
- Merge all the addXXX and removeXXX methods (but keepl separate lists) + merge addXXX loops in updateWorld()
- Split server in two (game and dev server)
- Remove unnecessary Geometry methods (and world-building methods from studio/Engine)
- Restructure UI, maybe remove UIElement, only have a set of generic functions to bind to interactive sprites?
- Think about a Container class or something to affect the transforms of all children, get rid of repeated finalize() calls
=> Use container game object from Phaser
-> Store sprites in multiple arrays simultaneously; one common displayList, to toggle the visible state, and possibly other logical containers to adjust depth
-> Maybe position everything according to oirign
-> One manual call to finalize() at the end, if any; or auto when adding to menu (the menu calls it in addPanel)
- Anchor panel elements at center, not top-left
- Make chatbar panel a subclass of Panels? Wait to see if other panels don't need DOM elements
- Make subclass of Panels for stats, and maybe others

Content:
-------
* Battle system
- Visual cue to indicate who's turn it is
- Visual timer
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
- Respawn if disconnect
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
- Compute and display battle grid
- Adjust camera
- Have a permanent presence of savages and animals around settlements
* Exploration/travel
- Have a world to explore
- Have a permanent presence of a few pickup items around settlements
- Campfires
- cf. Worldmap
* Inns
(- Enable players to put construction site)
(- Enable players to commit to construction)
- Shop system (custom stock, prices...)
- Set respawn fee
- Set respawn site
- Chat
- Gazette
* Inventory
- Make stats panel below equipment w/ icons
- Hover cards over items, show name and effect
- Usage block when clicking on item, two options: use or equip (show effect)
- Use items from menu (healing)
- Equip items from menu
- Unequip items from menu
- Display ammo amount next to weapon (melee weapons have a ref to the id of the corresponding ammo item; fetch the nb of that item in the player.inventory (refactor when multiple ammo types)
- Pick up items
* Player interactions
- Display speech bubble locally
- Broadcats bubble
- Show player name
* Settlement defense
- Enable commander to build towers
- Set up stats of towers and forts
- Towers behave as animals and trigger fights
- Same with forts
- Enable commander to build barracks
- Production of NPC troops
- Set up stats of troops
- Make troops engage enemies
- Restrict prerogatives based on official position
- Enable governor to name the commander
* Settlement economy
- Ressource stockpile in fort
- Let chancellor build each of every buildings
- Resource loop from resource buildings
- Impact of commitment on resource gathering
- Move stock around buildings
- Shop system in trade post
- Automatic shop systemn in port for chancellor
- Trade with overseas
- Restrict prerogatives based on official position
- Let governor name chancellor
- Salaries for officials
* Trade
- Shop system, test with pre-filled inventories
-> Display action slates in building panel; make "shop" action
-> Make shopping menu (two tabs, normal slots, click on item to select, adjust quantity in tablet below)
-> Display gold as item? Handle gold
- Have monsters drop loot
- Enable bonuses of merchants
- Allow merchants and artisans to build their shops
* World map
- Static image:
-> Split the map in k quadrants of l chunks
-> List the corresponding chunk id's and display the chunks
-> Save picture (with cartography())
-> Remove all
-> Next quadrant
- Menu with static image
- Minimap
- Fog of war and exploration (chunks-based)

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
- Fix tooltip positioning
- Find better font
- Menu sprites change size when hovered / clicked
- Hover cards over empty equipment slots
- Hover cards over craftring buttons
- Hower card over gold indicator
- Highlight buttons and buildings on hover
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
- Feedback for rejected paths because too long (question mark, sound, ...)
- Polish existing content
- Footsteps, light effects, sound effects (on actions + environment: birds, water, ...)
- HUD, title screen, animations ...
- Animal noises when beasts in proximity, animal footsteps, player footsteps noise
- Carcasses, traces of fight
- Fix panel tweens (positions not update often enough?)
- Varied and nice landmarks to give life to the world and act as waypoints

World building:
--------------
- Compute tree density and spread random trees around accordingly?
- No tree if busy 3cells to the left? Or when planing tree, log width cells to right as no-go position
- Add random elements
- Investigate the possibility of making cliffs from terrain data of the east coast
- Rework cliffs
- Fix loops (lakes ...)
- Plan for more layers in dev
- Store forests and trees separately (trees.json) during dev?
-> During flattening, read that file and draw trees tile by tile
-> Test high-layers after flattening

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
* Character menu:
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
* (Mini)map system
* Movement
- Check paths and block if error
- Keep track of player position along path on server
- Adjust movement duration based on latency
- Remove possible echo
- Investigate smoothenPath and compressPath)
- Hold & click
* NPC
* Player interactions:
- Display menu when click on players, display buttons (give item, give money)
- Give items/money
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

###############
V2 level:
###############
- PvP
- Naval exploration

