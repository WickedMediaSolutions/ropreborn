/*
 * config.h - ROM 2.4 Magic Numbers Configuration
 * 
 * This file centralizes all configurable constants that were previously
 * hardcoded throughout the codebase. Modify these values to tune server
 * behavior without recompiling individual source files.
 * 
 * NOTE: This file supplements merc.h and should be included AFTER merc.h
 * to avoid redefinition conflicts. Only NEW constants for RoP and config
 * are defined here; existing ROM constants remain in merc.h.
 */

#ifndef __CONFIG_H__
#define __CONFIG_H__

/*
 * ========================
 * Server Network Settings
 * ========================
 */

/* Default port for the MUD server */
#define DEFAULT_PORT            4000

/* Minimum allowed port number (must be > 1024 for non-root) */
#define MIN_PORT                1024

/* IMC2 network default port */
#define IMC_DEFAULT_PORT        3737


/*
 * ========================
 * Additional Buffer Limits
 * ========================
 * NOTE: MAX_STRING_LENGTH, MAX_INPUT_LENGTH etc are defined in merc.h
 */

/* Maximum log buffer size (must match declaration in db.c) */
#define MAX_LOG_BUFFER          (2 * MAX_INPUT_LENGTH)

/* Maximum socket buffer size for network I/O */
#define MAX_SOCKET_BUFFER       32768


/*
 * ========================
 * Character & Game Limits
 * ========================
 * NOTE: MAX_LEVEL, MAX_CLASS, MAX_PC_RACE are defined in merc.h
 */

/* Minimum level to allow a remort (should match or exceed MAX_LEVEL-8) */
#define MIN_REMORT_LEVEL        50

/* Maximum number of remorts allowed per character */
#define MAX_REMORTS             5

/* Base XP multiplier for level progression tuning */
#define EXP_BASE_MULTIPLIER     100


/*
 * ========================
 * Base Hit Points (Profession-specific)
 * ========================
 */

/* Base hit points per level for warrior class */
#define HP_BASE_WARRIOR         20

/* Base hit points per level for cleric class */
#define HP_BASE_CLERIC          15

/* Base hit points per level for mage class */
#define HP_BASE_MAGE            10

/* Base hit points per level for thief class */
#define HP_BASE_THIEF           15


/*
 * ========================
 * Warpoint Economy Settings (RoP)
 * ========================
 */

/* Base warpoints awarded for killing opposite-alignment player */
#define WARPOINT_KILL_BASE      10

/* Level difference bonus: +1 warpoint per X levels above victim */
#define WARPOINT_LEVEL_BONUS    5

/* Maximum level difference bonus */
#define WARPOINT_LEVEL_MAX      20

/* Percentage of warpoints lost on death */
#define WARPOINT_DEATH_LOSS     15

/* Number of consecutive kills before anti-farm penalty kicks in */
#define FARM_KILL_THRESHOLD     5

/* Hours before farm counter resets */
#define FARM_RESET_HOURS        1

/* Minimum XP bonus at rank 1 (percent) */
#define RANK_1_XP_BONUS         1

/* Maximum XP bonus at legend rank (percent) */
#define RANK_MAX_XP_BONUS       10

/* Warpoint decay percentage (daily) */
#define WARPOINT_DECAY_PERCENT  1

/* Days before decay starts on inactive players */
#define WARPOINT_DECAY_START    7

/* Day of month for monthly warpoint rank reset */
#define WARPOINT_RESET_DAY      1

/* Seasonal warpoint gain modifiers (percent) */
#define WARPOINT_SEASON_SPRING_BONUS 10
#define WARPOINT_SEASON_SUMMER_BONUS 20
#define WARPOINT_SEASON_AUTUMN_BONUS 5
#define WARPOINT_SEASON_WINTER_BONUS 15

/* Monthly event windows (day 0-34) and bonus percentages */
#define WARPOINT_EVENT_OPENING_START 0
#define WARPOINT_EVENT_OPENING_END   6
#define WARPOINT_EVENT_OPENING_BONUS 10

#define WARPOINT_EVENT_MID_START     16
#define WARPOINT_EVENT_MID_END       20
#define WARPOINT_EVENT_MID_BONUS     15

#define WARPOINT_EVENT_FINALE_START  28
#define WARPOINT_EVENT_FINALE_END    34
#define WARPOINT_EVENT_FINALE_BONUS  25


/*
 * ========================
 * Timeout Settings (seconds)
 * ========================
 */

/* Seconds before idle connection is closed */
#define IDLE_TIMEOUT            300

/* Seconds before idle wizard is forced to quit */
#define IDLE_WIZARD_TIMEOUT     600

/* Seconds before corpse decays and items are lost */
#define CORPSE_DECAY_TIME       3600

/* Corpse owner-exclusive protection window in object timer ticks */
#define CORPSE_OWNER_LOCK_TICKS 15

/* Protected death bag decay in object timer ticks */
#define DEATH_BAG_TIMER_TICKS   90

/* Seconds for other game timeouts */
#define LOGIN_TIMEOUT           180


/*
 * ========================
 * Game Mechanics (Death & PvP)
 * ========================
 */

/* Experience loss percentage on death */
#define DEATH_EXP_LOSS_PERCENT  10

/* Percentage of inventory lost on death */
#define DEATH_ITEM_LOSS_PERCENT 50

/* Percentage of equipped items lost on death (usually 100%) */
#define DEATH_EQUIPPED_LOSS_PERCENT 100

/* Minimum level difference for XP reward (pvp anti-twinking) */
#define MIN_LEVEL_DIFF_FOR_XP   10

/* Level difference before NO XP awarded entirely */
#define LEVEL_DIFF_NO_XP        20

/* Base gold from mobile (percent multiplier) */
#define MOB_GOLD_BASE           100

/* Healing rate multiplier for HP regen while resting */
#define HEAL_RATE_BASE          100

/* Mana rate multiplier for mana regen while meditating */
#define MANA_RATE_BASE          100


/*
 * ========================
 * Area & World Settings
 * ========================
 */

/* Starting room vnum for new players */
#define ROOM_VNUM_START         3001

/* RoP onboarding room for new characters */
#define ROOM_VNUM_STARTING_VILLAGE 18400

/* Altar room vnum (default clan/sect halls meeting point) */
#ifndef ROOM_VNUM_ALTAR
#define ROOM_VNUM_ALTAR         3001
#endif

/* Limbo room vnum (fallback location if character gets stuck) */
#define ROOM_VNUM_LIMBO         2

/* Maximum number of areas that can be loaded at startup */
#define MAX_AREAS               100

/*
 * ========================
 * Dynamic World Events
 * ========================
 */

/* Event day windows (day 0-34) */
#define WORLD_EVENT_BLOODMOON_START 7
#define WORLD_EVENT_BLOODMOON_END   10

#define WORLD_EVENT_HARMONY_START   21
#define WORLD_EVENT_HARMONY_END     24

#define WORLD_EVENT_ASCENDANT_START 30
#define WORLD_EVENT_ASCENDANT_END   34


/*
 * ========================
 * Reserved File Handles
 * ========================
 */

/* File opened to keep FD count stable on low ulimit systems */
#ifndef NULL_FILE
#define NULL_FILE               "/dev/null"
#endif


#endif /* __CONFIG_H__ */
