Cleaning
* Battle system
* Crafting
* Exploration/travel
* HUD
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
- Clean up json: those in maps should be arrays; those in data should have numeric keys
- Decide what to do with assets/maps folder, both for dev and prod
- Merge all the addXXX and removeXXX methods (but keepl separate lists) + merge addXXX loops in updateWorld()
- Clean up Utils
- Split server in two (game and dev server)
- Standardize the use of Utils methods for coordianes manipulations (gridtoline, linetogrid, tiletoiAOI, AOItotile, tileRelativeToAOI...)
- Remove unnecessary Geometry methods
- Restructure UI, maybe remove UIElement, only have a set of generic functions to bind to interactive sprites?
- Think about a Container class or something to affect the transforms of all children, get rid of repeated finalize() calls
-> Store sprites in multiple arrays simultaneously; one common displayList, to toggle the visible state, and possibly other logical containers to adjust depth
-> Maybe position everything according to oirign
-> One manual call to finalize() at the end, if any
- Anchor panel elements at center, not top-left
- Make chatbar panel a subclass of Panels, so as not to overload Panel with things used for only one feature (make this a
general rule for code organization)
- Clean all files
- Do not rely on constructor.name, instead use custom field (like the old "category")
- Add ES6 syntax to PHPStorm (for ... of)
- Optimize copy of collision map in GameServer.findPath

Content:
-------
* Battle system
- Trigger battle when clicking on monster (process 'battle' event)
- Set up turns, and timers
- End battle if disconnect
- Visual cue to indicate that in battle (based on inFight flag)
- Visual cue to indicate who's turn it is
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
* Crafting
- Design crafting system
- Crafting menu
- Crafting mechanic for health kits
- Display known formulas
- Block advanced formulas based on class and lvl
- Enable a dozen craftable items (minimal necessities for all other aspects of the game)
* Exploration/travel
- Have a world to explore
- Have a permanent presence of a few pickup items around settlements
- Campfires
* HUD/Menus:
- Finish all menus
- Hover cards when hovering players
* Inns
(- Enable players to buy timber from settlements)
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
- Display menu when click on players, display buttons (give item, give money)
- Give items/money
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
(- Have a trade post built)
- Shop system, test with pre-filled inventories
- Have monsters drop loot
- Enable bonuses of merchants
- Allow merchants and artisans to build their shops
* World map
- Static image
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
- Add tweens to player/building panels (if the 9-slice breaks, make the tileSprites slightly bigger so that they overlap with the corners?)
- Feedback for rejected paths because too long (question mark, sound, ...)
- Menu sprites change size when hovered / clicked
- Hover cards over empty equipment slots
- Hover cards over craftring buttons
- Sound effects when clicking (for moving, on buttons in menus, sounds of shuffling pages...)
- Noise when walking
- Noise when clicking on building (each building its noise)
- Noise when clicking on non-walkable tile
- Unique noise for items
- Use particle emitters for several cool effects, like cloud puffs, dust, lights, etc.
- Crafting SFX
- Hower card over gold indicator
- Highlight buttons and buildings on hover
- Custom movement marker
- Polish existing content
- Footsteps, light effects, sound effects (on actions + environment: birds, water, ...)
- HUD, title screen, animations ...
- Animal noises when beasts in proximity, animal footsteps, player footsteps noise
- Carcasses, traces of fight
- Varied and nice landmarks to give life to the world and act as waypoints

World building:
--------------
- Store forests and trees separately (trees.json) during dev
-> During flattening, read that file and draw trees tile by tile
-> Test high-layers after flattening
- Different tree distribution based on geographical sectors
- Add random elements
- Investigate the possibility of making cliffs from terrain data of the east coast
- Rework cliffs

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
- Preserve whatever extra info is in the JSON file (vs Tiled who rewrites it)
- Versioning of individual chunks (saved in separate folder), for unlimited undos

###############
V2 level:
###############
- PvP
- Naval exploration

