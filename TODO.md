Cleaning
* Battle system
* Character menu
* Crafting
* Exploration/travel
* HUD
* Inns
* Inventory
* Movement
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
- Use World server-side
- Move Geometry to studio
- Handle 404 errors when chunk file not found
- Clean up Utils
- Write Readme detailing structure of code: assets, client/server/shared code (-> for production), tools (command-line scripts) and studio
- Replace delete calls in updatePkg.clean() by something else
- Split server in two (game and dev server)
- Order files in studio
- Standardize the use of Utils methods for coordianes manipulations (gridtoline, lientogrid, tiletoiAOI, AOItotile, tileRelativeToAOI...)
- Remove unnecessary map directories/files and assets
- Remove unnecessary Geometry methods
- Restructure UI, maybe remove UIElement, only have a set of generic functions to bind to interactive sprites?
- Think about a Container class or something to affect the transforms of all children
- Clean all files

Content:
-------
* Battle system
- Display monsters, have them roam about (movement, animation, sync...)
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
* Character menu
- Health gauge, fatigue gauge
- Then: events log ; class bonuses ; buildings ; NPC
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
- Display inventory (in both inventory and crafting)
- Display number of items for each slot
- Equipment blocks
- Pick up items
- Display ammo amount next to weapon
- Use items from menu (healing)
- Equip items from menu
* Movement:
- Better depth sorting (not relying on tileY)
- Verticality stuff (trees canopy, etc.)
- Animate
* Player interactions
- Toggle chat by pressing enter
- Display speech bubble locally
- Broadcats bubble
- Display menu when click on players, display buttons (give item, give money)
- Give items/money
* Settlement defense
- Enable governor to name the commander
- Enable commander to build towers
- Set up stats of towers and forts
- Towers behave as animals and trigger fights
- Same with forts
- Enable commander to build barracks
- Production of NPC troops
- Set up stats of troops
- Make troops engage enemies
* Settlement economy
- Salaries for officials
- Let governor name chancellor
- Ressource stockpile in fort
- Let chancellor build each of every buildings
- Resource loop from resource buildings
- Impact of commitment on resource gathering
- Move stock around buildings
- Shop system in trade post
- Automatic shop systemn in port for chancellor
- Trade with overseas
* Trade
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
- Finish copying notes
- Make Excel tables (inventory, bestiary, ...)
- Make powerpoint
- Make feature matrix
- Consequence graphs
- Tidy up (charts, tables, Latex formulas...)
- For v1 schedule: follow https://www.youtube.com/watch?v=moW8-MXjivs priorization method from (36:00)

Polish:
------
- Highlight buttons and buildings on hover
- Button animation on big red closing cross in menus
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
- Try and make east coast with rivers and lakes
- Have a universal ChunkEdit class used accross all tools for all types of modifications
-> Or a ChunkHolder class which stores chunks in some way and only expose a addTile method which is used by the editor/geometry classes as a callback
-> Possibly the same chunk management both in live edit and with tools; remake the redo/switch function by getting rid
of the awkward temporary chunks, and instead, when editing, make a backup copy of affected chunks, and when redo/switch,
just restore it
- Fix saving tool
- Investigate the possibility of making cliffs from terrain data of the east coast
- Fix cliff outlines
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

###############
V2 level:
###############
- PvP
- Naval exploration



function create() {
    this.input.events.on('POINTER_DOWN_EVENT', function (event) {
        event.gameObject.setTint(0xff0000);
    });

    this.add.image(100, 400, 'atlas', 'supercars-parsec').setInteractive();
    var mech = this.add.image(200, 100, 'atlas');
    mech.setFrame('titan-mech');
    mech.setInteractive();

}