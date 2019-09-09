## To test:
- Test handleCraft when a price is undefined
- Test starting inventory of new player
- Test settlement selection (with value of 0)
- Test ammo container type match
- Test that the world is populated with items, animals, etc.
- Test handleBelt
- Test ammo decrease in inventory when equipping ammo
- Test handleChat (with text and also empty input)
- Test Utils.nextTo with all combinations of building/animal vs building/animal, next to each other and not
- Test Battle.computeTof()
- Find a way to test itemsRespaw and other time-related aspects (spawn, pick up, call respawn method)
- Test tutorial manually (reset start)
- Test new player manually
=> After bug, systematically create test!

Admin
Analytics
Cleaning
Commenting
Deployment
Design document
Testing
Packaging

## Misc TODO
- Adapt animations and delays for firearms
- At some point, compute vigor for Civs, own inventories etc.
- Update Westward main page + trailer
- Change battle priority when player joins fight
- In battle against NPC, have players have turns much more often
- Make tiles above battle tiles transparent; same with buildings in fight?
- Introduce new wood ingredient obtained from timber, crafting wood, made in bulk (but then tune down timber prod)
-> For shield, guns...?
- Better notifications
- Don't disable walk with build panel
- New movement system
- add esc shortcut
- "new" marker
- Events formatting
- Autorepair & rebuild of civ buildings
- Make size of tutorial boxes adapt to text
- No decimal in defaut prices (happens in one lumber camp)
- Ability: display threat level in animal tooltip
- Ability: display fighter health bars
- Look towards cursor
- Zoom-out in towers
- Silhouette of marker behind trees
- Togle legend, toggle marker types
- Alarm bell
- Flip trees horizontally to introduce variety
- Acc boosting ability
- Disengage button
- Social campfires
- Send individual map marker updates instead of full lists
- Have towers dissipate more FoW?
- SZ system for plants, disappears based on harvest frequency
(-> Remove marker files, have it generated dynamically, etc.)
- Spawn wolf colors based on N-S axis
- Animation when hit (player, npc...)
- No silhouette behind dead trees

Bugs:
- Issue with bear animations
- Remains TTL not working
- Fix glitch
Features:
- Test respawn, test new player
- Regional missions menu
-> Status: wild, settled, occupied, contested, ...
-> Missions based on buildings in region (build)
-> Missions based on items in region (building & player inventories) (produce)
-> Missions based on tower coverage
-> General info: how many regions settled, which regions are the most dangerous/currently contested, which
regions are the most/least developed
-> # days since last attack
-> Resource nodes missions (trade missions for unavailable resources)
-> 

-> Top-down smart missions: start from target amounts of items + tower coverage
Deduce harvest/trade missions for ingredients
List produce missions when ingredients are available
Build a min. ratio of (work)shops to players

-> Quantify resources nodes on the right side of frontier, 
production capacity (based on # buildings of a given time) / some kind of "GDP",
- Make smart missions based on these indicators (+ as many others as possible)
-> List of missions based on existing buildings, local rarity and/or locally available resources,
tower coverage, offensive goals if civ buildings / recent attacks ...

- Restore dragging
- Button to toggle regions (borders and banner names)
- Button to toggle legend
- Add borders to legend
- Icon for unbuilt building (lower half colored)
- Toggle markers by click on legend
- UI to filter on building types
- Display item rarity in inventory (check if doesn't conflit with shop)
- Treat all the numerical aspects that abilities can impact on as stats? Allows equipment to act as well. E.g.
fitting more in backpack, more actions per turn, ... (not so for "boolean" effects)
- Belt & backpack & gold capacity + corresponding items (incl. defaults)
- Abilities
- Daily quests
- Arrow stocks in towers  + make them throw stones when no better ammo
- Leaderboards
  

Quests:
"enemy civ is gonna attack in x days, you should produce x many swords, do this and that..."
Collective missions (on top of ebb and flow of frontier warfare)
Rivalry between regions


María:
- Footprints
- Bear anim (walk, attack, die w/ & w/o arrows)
- Player anim naked
-> Look into superimposing equipment programmatically
-> One basic player overlay for all
-> Civs are similar but with different overlays
- Make overlays based on actual game items
- Vary Civ overlays
- Add "pick up", "look at map", "check in bag" ... anims
- UI improvements
- Wear and tear and wounds
- Add taunts and emotes anims
- More wildlife
-> Some feathery creature that does melee attacks and drops feathers (remove as pickup object)
- Diagonal movements 

Sérgio:
- New Civ huts/cabins
- More civ buidings (e.g. towers)
- Basic cliffs
- Mines
- Differentiate under construction/destroyed
- Multiple construction stages,
- Multiple building levels...

Crafting:
- Multiply variants of functional items (weapons, storage, ability-related...)
- Distinguish animal pelts and animal leathers, also based on color
- Each basic material (plant, pelt, mineral...) must have multiple uses
- Think about N-S spread



Juice: https://retrovx.github.io/phaser3Juice/?utm_source=gamedevjsweekly&utm_medium=email
https://medium.com/@DeepMotionInc/2d-game-animation-creature-2d-v-s-spine-2d-1bdb9a4e19b5
https://medium.com/@kestrelm/2d-skeletal-animation-in-phaser-3-tutorial-3ed468fb6bd0


##Tutorial:
First few words about permanent sandbox, collaborative survival, etc.

Part 1: buildings
- Just arrived, need to settle
- A few buildings present, and towers, safe zone
- Point out useful buildings (workshop, brewery) are under construction buy other players, but need wood; 
prompt to go build a lumbercamp at the proper location (building tut + auto resources tut, depletion...)
- Explain that with that building, you can benefit other players, and their progress will benefit you in turn (access to crafting)
- Insist that buildings are permanent and that everyone can see and interact with everyone else's buildings

Part 2: exploration, crafting, trade and wildlife
- Prompt to go craft potion, point out that a specific ingredient is missing
- Buy one in shop
- Prompt to go explore fog of war in a certain area (explain fog of war) + map tuto
- When resource found, tuto about pick up resources and ecology
- Once picked, ambush, attack by wildlife, battle tuto
- food tuto (mention use for boosting production as well)
- Go back, sell and craft (trade & craft tuto)
- Talk about fatigue + prompt to build a shack (go back to lumber camp to get more timber,
added when part 2 boots)

Part 3: enemy civ
- Point out that lumber camp is exposed, need to build a tower
- Immeditaley following, civs attack, explain geopolitical climate
- Tougher fight, better equipment will be needed!

Closing comments about pros and cons of starting in a settled/wild region, ultimate goal of surviving by pushing enemy civ back,

## Criteria before going public:
- Full metal and gunpowder industry
- Basic abilitiy system
- Missions menu
-> Daily quests
-> Try to come up with something about enemy civ (# enemy camps ...)
-> Leaderboards


##################################################
##################################################
##################################################

###############
V1 level:
###############

Admin
-----
Look into push notificatins server (https://www.pushsafer.com/dashboard)
Improve admin tables
Flush screenshots
Make cmd line system
Edit buildings stock
Push desktop notifications for player connects
Set coordinates
Maintenance mode
Secure

Analytics:
---------
- Fix event desc about enemy types
- Log giving food to buildings in particular
- Log repairs
- Log submenus
- Log nb connected in monit: http://pm2.keymetrics.io/docs/usage/process-metrics/#process-metrics
- Display market prices
- Button to flush events
- Bundle events from one player into sessions
- Log session-wide stats: duration, how many players visit a building during session, do this, do that...
- Push desktop notifications for player connects
- Look for nice statistical library (https://dzone.com/articles/4-useful-javascript-libraries-for-data-analysis-an)
-> Or export as CSV and explore in SPSS?
- Compute "concentration" stat of items
- Compute inflation, GDP & potential GDP, growth
- Log drains and faucets
- Log where items are bought/sold
- Log pathfinding destinations, consider making heatmap in the long term
- Log as many things as possible: session duration, distance travelled per session, time spent in settlement per session, in nature per session,
interactions with buildings, time spent in each individual menu, step at which tutorial is most often finished, etc.
- Cluster "heavy" players vs "small-time" players and look for differences between the two
- Analyze sessions of one-time players who never come back
- Find other meaningful clusters (maybe in unsupervized fashion)
- Compare behaviors to how you expect the game to be played

Cleaning:
--------
Use ES6 classes
Speed up server boot time and webpack build
Performance:
- Concile the two coexisting menu update systems: the one used by updateSelf and the one used by updateBuilding
-> All menus have an update() method called on display; upon new server data, only update() the current menu
-> DOn't call all updates on display; update when receiving server data, and that's it
- Rethink the calling of all events on menu open

- Make audio sprite
- Remove unnecessary files
- Use pool for notifications
- Fix "already existing/non-existing" bugs
- Pathmaking instead of pahfinding?
- Dont send full building inventories when buying/selling (send arrays of deltas)
- Look into gzipping maps
Order:
- Display sprites in text: http://sbcgames.io/add-sprites-into-font-as-characters/
- Auto pack tileset.png
- Clean all tutorial stuff
- Store buildings data in separate files for the rendering stuff and the economic stuff;
-> At least for economuc stuff, do it in json5
- Send a digested config file from server to client
-> Include JSON files (items, animals...); allows to
--> Hide content
--> Send only useful fields
--> Move to JSON5 
- Look up and put as many parameters as possible in conf
- Proper initial cursor (using continuous polling or sth?)
- Central shared list of entities
- Remove global engine hover/out events, use local ones in animals, buildings...
- From 10.0: use pointer.worldX and worldY to handle location clicks
- Deal differently with net updates when visibility lost (https://developer.mozilla.org/en-US/docs/Web/API/Page_Visibility_API)
- Use containers
- Clean schemas
- Move UI stuff from Engine to UI
- Rework longslot system
- Setters/getters everywhere
- Centralize all texts (incl. stats, equip, and even item descriptions)
- Remove "longslot" stuff intended for stretching longslots vertically?

Packaging
---------
Player accounts and auth
Landing page
Wiki (self or check existing platform, Steam...)
Forum (self or check existing platform, Steam...)

Content:
-------
* Ambiance
- Use all the AoE2 sounds
- From : https://forums.rpgmakerweb.com/index.php?threads/whtdragons-animals-and-running-horses-now-with-more-dragons.53552/
-> Add seagulls, birds, frogs, small mammals, fishes (tinted), ...
-> Have fun with unicorn
- Carcasses, traces of fight, craters
- Paths along most-travelled paths
- Location sfx for each building
- Maximum ambient noises
-> Multiple categories (weather, animals, terrain...), distinct random intervals
* Battle system
- Bombs:
-> Stats??
-> Greater effect against buildings
-> Sound effect
-> Throw animation?
-> Variable damage based on bomb type
-> Factor defense in
- traps, poisons, potions, oils...
- burn effects inflicted by (crimson?) explosives
(-> trap bonuses to explorers? Natural crafting recipe to them?)
- Increase fatigue when fighting
- Effect of fatigue on fighting
( - Camera follows active figher? Could be more dynamic ; possibly with deadzone to avoid twitch)
- Gunpowder mechanics; remove it from bullet recipe?)
(- New interface:
Timer at bottom, icon of active fighter on the left, queue of others on the right
Skip turn below
Health and fatigue above, numerically + battle counters (movement, actions...)
Belt slots above + ammo slots + active weapon (ranged vs melee)
=> Allow both melee & ranged equipped at same type, ranged active by default)
(- Compute probability of items breaking and discard them)
(- Identify characters in the way of ranged attacks)
(- Anti-friendly fire safety for bombs)
(- Display health of enemies somehow)
(- Let NPC use items (restore health, ...))
(- 3-way battles)
* Civics
- Civic abilities
- Elections
- Naming officials
(- variable civic xp when committing, based on factors
- Taxes
- Change settlement
- Update population based on players (requires permanent players)
- Server side: check that not committing twice to same building)
* Character panel
-> Indicate starvation level of settlement
- restore "setClass" to use to compute different XP gains per class
- Adjust XP gains per class
- Display health, fatigue and gold permanently in HUD
- Remove % stats panel
- Redisplay committment slots
- Ability points
- Ability system
- Events log
- Add help back
* Craftsmen gameplay
- Think of short, nice names 
- Abilities
- Lock some recipes on abilities
- At some point, made scrollable recipes panel 
- Quests
- Mystery potion that uses all plants in game, as a challenge
- Lock some recipes based on dev level
-> keep locked recipes but disable them (indicate why)
(
- XP based on multiple factors
Backpacks, gold pouches of various sizes...)
(- Recipes for golden ore -> gold ingots -> currency)
(- Tiers)
(- Upgrades)
(- Naming)
(- Dismantling)
(- Distinct interfaces for forging & brewing?
-> Furnace mechanics? (Duration and temperature, coald and/or wood as fuel...)
-> Brewing mechanics? (Brew duration, fuel as well...))
(- Add dosage mechanic when brewing) 
(- Full list of items)
* Explorer gameplay
- Map mechanics:
- Buggy building centering in fort?
-> Zoom:
--> Fix zoom-out out of map bounds
--> Zoom in/out with scroll 
--> Decide what level of zoom for Fort and Minimap
-> Data sync:
--> Iterate over markers of one map, if not in second map, add them
--> Each player memorizes own markers (when building is displayed in surrounding AOIs), reset when visitting fort
--> Danger markers automatically added to map when player dies
--> Destoyed building: automatically deletes marker in corresponding fort
--> Sync when visitting fort
--> Fort sync first: absorb markers from player, reset player
--> Player sync: copy fort markers
-> Fog of war:
--> Map instance stores list of AOIs together with timestamp
--> Player memorizes visitted AOIs
--> Two-way sync when visitting fort
--> Mini-masks per AOI, only applied if timestamp smaller than x
--> Work-out nice geometry
-> Clusters:
--> Split both zoom-level into chunks
--> Map all AOIs and markers to world map chunks
--> download only the relevant chunks, on the fly
-> Minimap: circular mask, no zoom buttons, no drag/drag following player, no fog of war
-> Future: custom markers, not synced
-> Future: markes about animal and plant populations, synced with fort, can be enabled/disabled on map
- Quests
- Civic XP when synchronizing enemy camps
- Less XP based on lvl (up to 0 XP around settlements past a certain level)
- Bonuses
- Show plant markers based on ability
* Enemy civ
// Lookup "tribal concept art" for inspiration on civs look
//: one single building type that spawns civs at regular intervals + map icons
-> Sprinkle several camps around settlements
- Inclusion of buildings in fights
- Targetting of buildings by civs
- Processing of attacks, destruction
- Settlement attack behavior (what time intervals, how many...)
- Allow players to attack buildings
- Tower behavior
- Auto-repair (for both settlers and civs), link to commitment
(- Wander behavior (squad), patrols
- Territory zones: if player step in, send small squad to track
- Name generator
- Camp economy
- Civs loot equipment and equip it
- Civs gain XP, level-up, become stronger (increase associated xp reward accordingly)
- Reflect that in hover card
- Test NPC vs animals)
* Help
- Review existing help buttons
- Add missing help buttons (including on specific lines to describe fatigue, food surplus...)
- Make tutorial quests (commitment & civic xp, battle, crafting...)
- Pop-up boxes describing things first time (first time in fort, workshop, character menu...)
* Inventory
- Click window: display stat effects
- Belt mechanics (quick-use slots for potions, bombs and weapons)
- Backpack mechanics, money pouches, ...
- Gunpowder mechanics (multiple pouches?)
- Dropping items
* Merchant gameplay
- Shops
- Caravans
- Homeland trade
- Inns
- Quests
- Bonuses
- Tax evasion
- Less XP based on level
* Misc
- Fatigue 
-> Accumulate it with actions, server-side ("stamina"): walking, committing, crafting, ...
-> Relate to food surplus
-> Display in character panel
-> Impact on actions
- Rest
- Campfires (+ leftovers + orientation pin + long distance smoke pins)
- Fix continuous movement system
- New camera system? ("dead zone")
=> Try new Phaser 3.11 deadzone first 
https://www.gamasutra.com/blogs/ItayKeren/20150511/243083/Scroll_Back_The_Theory_and_Practice_of_Cameras_in_SideScrollers.php
-> Doesn't follow in central rect window, only follows when getting out of it and until player stops
( allows for small position adjustments)
or
-> Doesn't follow (except in battle)
-> Only follow when click destination is in screen margins (define margins size)
-> Space to interrupt movement?
or
-> Moves when cursor on sides (refresh pins), to some extent
-> Also moves using keystrokes; space to center
- Respawn losses?
- Messaging
- Leaderboards
- View info on other players (levels...)
- Guilds
* Orientations
- Pins for gunshots and explosions (requires special networking for long-distance sounds)
-> Much slower noise variation according to distance (since heard from very far)
-> Pin disappears after a few seconds
- Pins for alarm bells (same)
* Settlement defense
- Enable commander to build towers
- Buildings health
- Show updated health in fort
- Set up stats of towers and forts
- Towers behave as animals and trigger fights (same battle behavior)
- Manage arrows stock? Need for arrow economy? Ammo economy?
- Same with forts
- Enable commander to build barracks
- Production of NPC troops
- Set up stats of troops
- Make troops engage enemies
- Troops control: no grouping with players, but list of orders to dispatch
-> Orders: go guard location x, patrol at location x
-> NPC will deploy appropriate move behavior accordingly and aggro any enemies automatically
(+ add in check for aggro code, detection of neighboring battle cells, so it intervenes in ongoing fights too)
-> Map-based interface in the fort, on the left list of troops (with randomly generated names),
select them, select order, and select location
-> NPC lvl-up like players, full soldier mode, improve battle abilities (can be checked in menu)
-> "training mode", costs money and food, make soldier unavailable, comes back lvled-up (higher level, higher cost)
-> Each has own equipment; resource flow to barracks, all items stored there can freely be assigned
to soldiers 
-> For training and change of equipment, soldier need to be at barracks to make changes ("come back" order)
- Maintaining troops consumes food as well (more than players? Less?)
* Settlement economy
Stop sending commit slots repeatedly
Hide commit button when already committed
Implement and test decommitment from db data
Modify update commit code to accomodate for commitment of > 1 turn
Have hunter huts produce pelts (good for leather economy)
Recipe: paper cartridges (paper also for bombs?)?
Make recipes (randomly?) for 5 consumables (potion, antidote, steady stuff...) + create ingredients
Recipes for fancy bullets and bombs
- Resource flow from all resource buildings to trade post
- Gold flow from tarde post to fort
- Fork trade post gold flow to fork and workshop
- Set reward of recipes for settlement (0 = disabled)
- Make spawn zones for plants/shrooms/etc.
- Dev levels
- Impact of dev level on exploration XP reward
- Let chancellor set prices in trade post
- Trade with overseas
- Salaries for officials, taxes
- Allow creation of new buildings (fixed locations to begin with)
- Lists of items rewarded by civic xp
* Soldier gameplay
- New compute battle destination in server/NPC?
- Battle cursors use new "next to" logic
- Monster variety & more spawn zones
- Abilities
- Quests
(- Whole ecology, variants of animals along north/south axis,
-> Brown wolves south, black ones south more powerful, same with gray and white wolves north
+ unicorn
- Rare/strong foes)
(- Advanced XP)

Deployment:
----------
-> Don't load sounds in preload, load in create and don't play them unless found in cache (bonus)
-> Don't commit compiled files, compile after push and have env variable determine mode
https://snowbillr.github.io/blog//2018-04-09-a-modern-web-development-setup-for-phaser-3/
https://github.com/nkholski/phaser3-es6-webpack
-> Custom Phaser build (bonus)
https://medium.com/@louigi.verona/reducing-phasers-filesize-custom-phaser-builds-4a0314819a38
-> https://codeutopia.net/blog/2015/01/06/es6-what-are-the-benefits-of-the-new-features-in-practice/
-> Uglifiy/minify/mangle for production
-> Maintain Docker image?
- Desktop app (automated)
-> https://electronjs.org/docs/tutorial/application-distribution
- Full CI pipeline: flatten->gather->upload (flatten and gather not necessary for 100% of commits, so need to be able to select them with flags)
- Tool to automatically merge all graphic assets in atlases?
- Secure chunk access? (check client position before serving)


Design document:
---------------
- Re-read regularly
- Make big visual tool for items/plants/animals/crafting (https://visjs.org/network_examples.html)
- Make Excel tables (crafting, inventory, bestiary, abilities ...)
- Make feature matrix
- Consequence graphs
- Tidy up (charts, tables, Latex formulas...)
- For v1 schedule: follow https://www.youtube.com/watch?v=moW8-MXjivs priorization method from (36:00)

Polish:
------
Visual:
- Use new Phaser 3.11 setTintFill to add halo over hovered game entities?
- Add weapons to temporary character sprites
- More dramatic apparition of battle tiles
- "Tip of the day"
- Revamp class selection
- Fix continuous movement
- Polish title screen (leaves, bird passing in the distance...)
- Fade-in/out transitions (wait for containers?)
- Show "new" tag when opening inventory
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
- Noise when clicking on building (each building its noise)
- Noise when clicking on non-walkable tile
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
- https://hackernoon.com/testing-node-js-in-2018-10a04dd77391
- Mocha + Chai :https://hackernoon.com/a-crash-course-on-testing-with-node-js-6c7428d3da02
- Sinon: https://www.sitepoint.com/sinon-tutorial-javascript-testing-mocks-spies-stubs/
- https://semaphoreci.com/community/tutorials/best-practices-for-spies-stubs-and-mocks-in-sinon-js
- Use Jasmine for client-side tests? Selenium for visual ones?
- Make lists of bugs happening and think about tests to make to catch them, at the finest granularity possible
- Tests on inventory manipulations, proper display of stats in items (w.r.t names used in Stats)
- Entering and re-entering workshop
- Add security tests that check config values, tutorial start, nothing in "on initialize" ...
- Test the connexion of an old player to see if it crashes or not; build sth, start a fight, etc.
- Manually run it before deployment
- Have the testing pipeline work with both development and production code (run it once, prodify, then check again, the upload)
- Optimize: remove divisions, benchmark runtimes, etc.

World building:
--------------
Make items belong to spawnzones, for respawn logic
Make respawn depend on proximity of cluster to civilization
Set up proximity between related item and animal spawn zones
Building editor (set shapes etc.)
Manage spawn zones in editor
Patches of dirt

UI:
---
- 8-directional characters, + attack (ranged & melee), object, die animations ...
- Movement target indicator
- Better battle tiles
- Battle UI
- Crafting/Workshop UI
- Better orientation pins (w/ way to indicate if in-fight)
- Better new player screens (class selection, settlement selection...)
- Abilities screen, civic screen...
- Landscape, trees, ...
- Animals (w/ animations)
- Enemy civs, enemy camps 
- Logo 

Pillars:
1) The War
2) The Economy
3) The Wild


Chapter 1
1) The War
- Too little building damage from civs
----
2) The Economy
- No repair?
- It's much easier to craft a gun than arrows and string-based stuff!
- Add sulfur mines
- Problem with food consumption?
- Tune down ores production a bit? 

---
- Rethink "per cycle" display in prod panel
- Introduce new wood ingredient obtained from timber, crafting wood, made in bulk (but then tune down timber prod)
-> For shield, guns...?
- Currency? (+ flow from trade post and workshop to fort) / money flow
- Fix the right amount of buildings in each settlement, their output per turn, turn duration
-> Simulate?
- Tune economy
- Starvation (impact) (think of ways to make it painfully visible)
- Settlement-oriented HUD: see below
-> Adapt positioning of orienation pins
- Compass
- Bell when attack
- Missions menu
(-> Eventually: missions, quests & achievements)
(-> Missions: bring food, defend, commit, follow chancellor directives,
defend trade routes, scout, maintain supplies)
(-> Control quests distribution?)
- Commitment lasts multiple turns; fix repeat send of commit slots
3) The Wild
=> Update texts
=> Test with someone

Chapter 2
1) The War
- New "building damage" stat (allows introducing specialized weapons: maces, ...)
=> Ranged weapon have very low building damage, melee weapon more, maces and axes much more, bombs a lot
- Multiple bomb types with variable stats
- Barracks and troops (need food inflow to barracks)
-> Troops need food to train + count for recurring food consumption
- Fortified civ camps, rebuilds
- More involved raid mechanics (patrols, list of units ready to raid, units coming back to base, units healing when at base) using a more complex states scheme
- NPC use ranged attacks (no firarms and bombs though)
2) The Economy 
(automatic economy)
- More advanced simulations to balance resources
- Permanent, named players
- Dev. levels
- Impact on crafting, buildings, ...
- New buildings, settlements expansion
- Homeland trade (automatic)
- Cash crops
- Economy orientation by chancellors
- Backpacks, purses, belts, gloves (remove shields) ...
- War economy (tower ammunitions, ...)
3) The Wild
- New World 
- Fog of war (timed)
-> Display a square on the map
-> Display visibleAOIs on fort map -> convex hull?
-> Have visibleAOIs set depend on buildings, esp. towers
-> Synchronize player.visittedAOIs to fort
-> Own fog of wars for players, update own map as they wander, synchronize when back to fort
- Icons synchronization
- Resources & misc map icons
- Trade routes (chancellors only), mark on maps
- Fatigue & rest, impact on everything
- Different pelts and leathers, rework crafting recipes, full pelt economy

Chapter 3:
1) The War
- Unit types & counters
- Advanced battle mechanics & UI (need belts first)
- Automated raids by commander, displayed to entice players
-> Force player battle pathfinding to fit in battle cells
-> Adapth pathfinding for multi-cell entities
-> trimPath for multicell entities
2) The Economy
- Pinning recipes on UI (so as not to have to memorize ingredients)
- Governor & officials
- Elections
- Taxes
- Citizenship changes
- Tuning of cash flows
- Manual homeland trade
3) The Wild
- Look into GameObject.willRender to see if can be used to know when a sprit is hidden by a tree, tower... 

Chapter 4:
Fancy title screen (with number of players, events stream, map background...)
Class selection
Player abilities
Advanced XP systems
Class quests & civic quests (endless supply in missions menu)
Personal shops & caravans
World-building: items, fauna & flora
Corresponding spawn mechanics
Corresponding admin tools
Advanced crafting mechanics & interface
Recipes mechanics
Tiers, brittleness, ...
New geography, adding world content
Corresponding editing tools
Ambient elements
Civ style
Advanced civ mechanics
Messaging
Advanced social features
Diplomacy
...



Interface upgrades:
- Class selection
- Settlement selection
- Crafting menu
- Battle interface
- HUD


UI
# Put settlement to the forefront
- Name next to minimap
- Lvl, # citizens, # buildings?, # troops
- Food (also update prod and build panels)
- Security? 
- Bell icon when attacks
- Blinking icon on map when attacks?
- Displayed for the settlement currently visited
- Help icon to invite to visit fort for more details
- Compass icon pointing towards local Fort at all time (if equipped)
- Death icons + "last attacks" icons
- Display health bar of buildings? Show damage somehow (smoke w/ particles?)

