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

Settlement-focused experience:
- Checks out settlement status in fort
-> Food surplus bonuses/maluses
-> Development goals + "next level"
-> Resource levels
-> Buildings status
-> Military threats
-> Map legend
-> Officials
-> Taxes
(-> Disable official prerogatives)
- Based on that, determine mission: bring in resource, combat threat, build...
- Lack of food: hunt and kill something
- Lack of gold: sell furs
- Other: go and commit to relevant buildings
- Commit to buildings being built, until completion
- Earn civic xp with commitment
- Gray out some actions based on civic level
- Show dev level impact in stats panel
- Show committment slots in char panel

Then:
- Have 2 settlements, with important differences 
- World map-based settlement selection menu (mention key aspects, display enemy civ threats)
- Class selection menu (describe impact on settlements)
- Help buttons *everywhere*
- Add short descriptions to items
- One-time single-panel combat tutorial when first combat
- One-time single-panel intro text when first login
- Orientation panel in char menu hinting at what to do and where to go (w/ map?)
Goal: 1h of gameplay?

Random list:
Fort UI
Monster drops loot
Monster xp
Display stat effects in character panel + xp bars
Being-built panel (progress bar, material, productivity (commitment and dev level modifiers))
Resource building panel
Commitment, then functional commitment slots in char panel, + civic xp
Multiplayer fights
Help buttons
Item descriptions

Week:
Fort: next level requirements (+ add trade tax)
Fort: unlockables of next level
Fort: focus building pin on slot click (w/ tween)
Map: skull icons
Map: legend
Construction: display material slots
Construction: add commitment button
Construction: earn civic xp on commit (and use real numbers in character)
Economic loop: actual computation of productivity modifiers (real numbers)
Economic loop: add a functional resource building (to commit to)
Economic loop: productivity timer for construction
Economic loop: apply effect of food deficit on players
Economic loop: test all updates of all menus
Character: display committed buildings
Character: set class xp to 0, add respawn location message, add stats modifier message
Battle: skin dead animals
Battle: display event pop-ups after skinning
Battle: multiplayer fights
Finish: review base stats values


Cleaning:
--------
Performance:
- Dont send full building inventories when buying/selling (send arrays of deltas)
- Use pool for footsteps (see Groups, who now act as pools)
- Use pools for players, animals, ...
- Fix null values in left-fringe chunks (fixed?)
->nulls in corrupted chunks likely arise from "undefined" values being converted to null by JSON.stringify
-> Happens on the fringe -> because for these drawShore returns undefined?!
- listCollisions: don't store water tiles, only shore etc.
- Flattening: second pass to delete water-only chunks based on visibility
- Flattening based on transparency
- Store tiles of the shape of a building somewhere instead of recomputing (e.g. in canBuild) [May be obsolete if buildings have rect shapes in future]
- To check if update packets are empty: iterate over keys and check for emptyness using typeof (if array and length 0 ...)
Order:
- Find out how to generate graphics objects (grid tiles, gradients...) programmatically for various uses
- Use events gameobject events for input + custom events for updating menus (https://phaser.io/phaser3/devlog/112)
- One clean, central way to manage tilesets, config variables, depth, blitters... (blitter selection in client/Chunk, "mawLayer" field in WorldEditor ...)
- Give toString method to custom objects to replace [this.constructor.name this.id] ...
- Decide what to do with assets/maps folder, both for dev and prod
- Merge all the addXXX and removeXXX methods (but keepl separate lists) + merge addXXX loops in updateWorld()
- Split server in two (game and dev server)
- Remove unnecessary Geometry methods (and world-building methods from studio/Engine)
- Restructure UI, maybe remove UIElement, only have a set of generic functions to bind to interactive sprites?
- Anchor panel elements at center, not top-left
- Make chatbar panel a subclass of Panels? Wait to see if other panels don't need DOM elements

Content:
-------
* Battle system
- Respawn
- Respawn if disconnect
- Multiplayer fights (deal with: 1) stepping in active battlezone and 2) being into an appearing battlezone)
- Animal can trigger fights
- Have monsters drop loot
* Ecosystem
- Listing and distribution of pick-up resources
- Listing and distribution (and yield) of building resources
- Listing and distribution of animals
- Work out location and mechanics of enemy civ.  
* Inventory
- Pick up items
* Settlement defense
- Enable commander to build towers
- Set up stats of towers and forts
- Towers behave as animals and trigger fights
- Same with forts
- Enable commander to build barracks
- Production of NPC troops
- Set up stats of troops
- Make troops engage enemies
* Settlement economy
- Yellow pins for unbuilt buildings
- Mnenu for unbuilt buildings
- Commitment mechanic for building
- Resource loop from resource buildings
- Impact of commitment on resource gathering
- Move stock around buildings
- Let chancellor set prices in trade post
- Automatic shop systemn in port for chancellor
- Trade with overseas
- Restrict prerogatives based on official position
- Let governor name chancellors
- Salaries for officials
- Work out settlement levels
- Impact on player stats
* Settlement management
- Display settlement stats (level, resources...)
- More info on building hover
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
* Battle system
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

