/***************************************************************************
 *  Original Diku Mud copyright (C) 1990, 1991 by Sebastian Hammer,        *
 *  Michael Seifert, Hans Henrik Strfeldt, Tom Madsen, and Katja Nyboe.    *
 *                                                                         *
 *  Merc Diku Mud improvments copyright (C) 1992, 1993 by Michael          *
 *  Chastain, Michael Quan, and Mitchell Tse.                              *
 *                                                                         *
 *  In order to use any part of this Merc Diku Mud, you must comply with   *
 *  both the original Diku license in 'license.doc' as well the Merc       *
 *  license in 'license.txt'.  In particular, you may not remove either of *
 *  these copyright notices.                                               *
 *                                                                         *
 *  Thanks to abaddon for proof-reading our comm.c and pointing out bugs.  *
 *  Any remaining bugs are, of course, our work, not his.  :)              *
 *                                                                         *
 *  Much time and thought has gone into this software and you are          *
 *  benefitting.  We hope that you share your changes too.  What goes      *
 *  around, comes around.                                                  *
 ***************************************************************************/

/***************************************************************************
*    ROM 2.4 is copyright 1993-1998 Russ Taylor                             *
*    ROM has been brought to you by the ROM consortium                      *
*        Russ Taylor (rtaylor@hypercube.org)                                *
*        Gabrielle Taylor (gtaylor@hypercube.org)                           *
*        Brian Moore (zump@rom.org)                                         *
*    By using this code, you have agreed to follow the terms of the         *
*    ROM license, in the file Rom24/doc/rom.license                         *
****************************************************************************/

/****************************************************************************
 *   This file is just the stock nanny() function ripped from comm.c. It    *
 *   seems to be a popular task for new mud coders, so what the heck?       *
 ***************************************************************************/

#if defined(macintosh)
#include <types.h>
#else
#include <sys/types.h>
#include <sys/time.h>
#endif

#include <ctype.h>
#include <errno.h>
#include <stdio.h>
#include <string.h>
#include <stdlib.h>
#include <time.h>
#include <unistd.h>                /* OLC -- for close read write etc */
#include <stdarg.h>                /* printf_to_char */

#include "merc.h"
#include "config.h"
#include "interp.h"
#include "recycle.h"
#include "tables.h"

#if    defined(macintosh) || defined(MSDOS)
extern const char echo_off_str[];
extern const char echo_on_str[];
extern const char go_ahead_str[];
#endif

#if    defined(unix)
#include <fcntl.h>
#include <netdb.h>
#include <netinet/in.h>
#include <sys/socket.h>
#include "telnet.h"
extern const char echo_off_str[];
extern const char echo_on_str[];
extern const char go_ahead_str[];
#endif

/*
 * OS-dependent local functions.
 */
#if defined(macintosh) || defined(MSDOS)
void game_loop_mac_msdos args ((void));
bool read_from_descriptor args ((DESCRIPTOR_DATA * d));
bool write_to_descriptor args ((int desc, char *txt, int length));
#endif

#if defined(unix)
void game_loop_unix args ((int control));
int init_socket args ((int port));
void init_descriptor args ((int control));
bool read_from_descriptor args ((DESCRIPTOR_DATA * d));
bool write_to_descriptor args ((int desc, char *txt, int length));
#endif

/*
 *  * Other local functions (OS-independent).
 *   */
bool check_parse_name args ((char *name));
bool check_reconnect args ((DESCRIPTOR_DATA * d, char *name, bool fConn));
bool check_playing args ((DESCRIPTOR_DATA * d, char *name));

/*
 * Global variables.
 */
extern DESCRIPTOR_DATA *descriptor_list;    /* All open descriptors     */
extern DESCRIPTOR_DATA *d_next;        /* Next descriptor in loop  */
extern FILE *fpReserve;                /* Reserved file handle     */
extern bool god;                        /* All new chars are gods!  */
extern bool merc_down;                    /* Shutdown         */
extern bool wizlock;                    /* Game is wizlocked        */
extern bool newlock;                    /* Game is newlocked        */
extern char str_boot_time[MAX_INPUT_LENGTH];
extern time_t current_time;            /* time of this pulse */

/* Returns TRUE if a player race belongs to the evil homeland. */
static bool race_uses_evil_homeland(const char *race_name)
{
    if (race_name == NULL || race_name[0] == '\0')
        return FALSE;

    /* Evil roster (supports both legacy and ROP naming variants). */
    if (!str_cmp(race_name, "troll")
        || !str_cmp(race_name, "ogre")
        || !str_cmp(race_name, "duergar")
        || !str_cmp(race_name, "orc")
        || !str_cmp(race_name, "skaven")
        || !str_cmp(race_name, "illithid")
        || !str_cmp(race_name, "drow")
        || !str_cmp(race_name, "lich")
        || !str_cmp(race_name, "kenku")
        || !str_cmp(race_name, "revenant")
        || !str_cmp(race_name, "minotaur")
        || !str_cmp(race_name, "goblin")
        || !str_cmp(race_name, "undead")
        || !str_cmp(race_name, "gnoll")
        || !str_cmp(race_name, "void-touched"))
        return TRUE;

    return FALSE;
}

/* Resolve homeland start room by race, with safe fallbacks. */
static ROOM_INDEX_DATA *get_homeland_start_room(CHAR_DATA *ch)
{
    ROOM_INDEX_DATA *room = NULL;
    const char *race_name = race_table[ch->race].name;

    if (race_uses_evil_homeland(race_name))
        room = get_room_index(ROOM_VNUM_OBSIDIAN_TOWER);
    else
        room = get_room_index(ROOM_VNUM_ADAAR_TOWER);

    if (room == NULL)
        room = get_room_index(ROOM_VNUM_STARTING_VILLAGE);
    if (room == NULL)
        room = get_room_index(ROOM_VNUM_SCHOOL);

    return room;
}

/* Pretty display name for race list in character creation. */
static void format_race_name(const char *in, char *out, size_t out_size)
{
    size_t i;

    if (out_size == 0)
        return;

    if (in == NULL || in[0] == '\0')
    {
        out[0] = '\0';
        return;
    }

    snprintf(out, out_size, "%s", in);
    out[0] = UPPER(out[0]);

    for (i = 1; out[i] != '\0'; i++)
    {
        if (out[i - 1] == '-' || out[i - 1] == ' ')
            out[i] = UPPER(out[i]);
    }
}

/* Print a 2-column race list grouped by homeland alignment. */
static void send_race_selection_table(DESCRIPTOR_DATA *d)
{
    int race;
    int good_count = 0;
    int evil_count = 0;
    int row;
    int rows;
    int good_races[MAX_PC_RACE];
    int evil_races[MAX_PC_RACE];
    char left_name[32];
    char right_name[32];
    char line[128];

    for (race = 1; race_table[race].name != NULL; race++)
    {
        if (!race_table[race].pc_race)
            continue;

        if (race_uses_evil_homeland(race_table[race].name))
            evil_races[evil_count++] = race;
        else
            good_races[good_count++] = race;
    }

    send_to_desc("\n\rRace Selection\n\r", d);
    send_to_desc("------------------------------\n\r", d);
    send_to_desc("Good Races                Evil Races\n\r", d);
    send_to_desc("----------------------    ----------------------\n\r", d);

    rows = (good_count > evil_count) ? good_count : evil_count;
    for (row = 0; row < rows; row++)
    {
        left_name[0] = '\0';
        right_name[0] = '\0';

        if (row < good_count)
            format_race_name(race_table[good_races[row]].name, left_name, sizeof(left_name));
        if (row < evil_count)
            format_race_name(race_table[evil_races[row]].name, right_name, sizeof(right_name));

        snprintf(line, sizeof(line), "%-22s    %-22s\n\r", left_name, right_name);
        send_to_desc(line, d);
    }
}


/*
 * Deal with sockets that haven't logged in yet.
 */
void nanny (DESCRIPTOR_DATA * d, char *argument)
{
    DESCRIPTOR_DATA *d_old, *d_next;
    char buf[MAX_STRING_LENGTH];
    char arg[MAX_INPUT_LENGTH];
    CHAR_DATA *ch;
    char *pwdnew;
    char *p;
    int iClass, race, i, weapon;
    bool fOld;
    extern int mud_telnetga, mud_ansicolor;

    /* Delete leading spaces UNLESS character is writing a note */
	if (d->connected != CON_NOTE_TEXT)
	{
		while ( isspace(*argument) )
			argument++;
	}
    ch = d->character;

    switch (d->connected)
    {

        default:
            bug ("Nanny: bad d->connected %d.", d->connected);
            close_socket (d);
            return;

        case CON_PRESS_ENTER:
            /* Wait for user to press enter, then show the banner */
            {
                extern char *help_greeting;
                if (help_greeting[0] == '.')
                    send_to_desc (help_greeting + 1, d);
                else
                    send_to_desc (help_greeting, d);
            }
            send_to_desc ("\n\rOptions: <Playername>, Create <player>, or Quit.\n\r", d);
            d->connected = CON_GET_NAME;
            break;


        case CON_GET_NAME:
            {
                char arg1[MAX_INPUT_LENGTH];
                char arg2[MAX_INPUT_LENGTH];
                char pName[MAX_INPUT_LENGTH];
                char *tmparg = argument;
                
                if (argument[0] == '\0')
                {
                    close_socket (d);
                    return;
                }

                /* Parse the command */
                tmparg = one_argument(tmparg, arg1);
                tmparg = one_argument(tmparg, arg2);
                
                /* Handle special commands */
                if (!str_cmp(arg1, "quit") || !str_cmp(arg1, "exit"))
                {
                    close_socket (d);
                    return;
                }

                /* Determine the player name to use */
                if (!str_cmp(arg1, "create"))
                {
                    /* "Create <playername>" format */
                    if (arg2[0] == '\0')
                    {
                        send_to_desc ("Create what? Usage: Create <playername>\n\rOptions: <Playername>, Create <player>, or Quit.\n\r", d);
                        return;
                    }
                    strcpy(pName, arg2);
                }
                else
                {
                    /* Regular login with playername */
                    strcpy(pName, arg1);
                }

                pName[0] = UPPER (pName[0]);
                if (!check_parse_name (pName))
                {
                    send_to_desc ("Illegal name, try another.\n\rOptions: <Playername>, Create <player>, or Quit.\n\r", d);
                    return;
                }

                fOld = load_char_obj (d, pName);
                ch = d->character;

                if (IS_SET (ch->act, PLR_DENY))
                {
                    sprintf (log_buf, "Denying access to %s@%s.", pName,
                             d->host);
                    log_string (log_buf);
                    send_to_desc ("You are denied access.\n\r", d);
                    close_socket (d);
                    return;
                }

                if (check_ban (d->host, BAN_PERMIT)
                    && !IS_SET (ch->act, PLR_PERMIT))
                {
                    send_to_desc ("Your site has been banned from this mud.\n\r",
                                  d);
                    close_socket (d);
                    return;
                }

                if (check_reconnect (d, pName, FALSE))
                {
                    fOld = TRUE;
                }
                else
                {
                    if (wizlock && !IS_IMMORTAL (ch))
                    {
                        send_to_desc ("The game is wizlocked.\n\r", d);
                        close_socket (d);
                        return;
                    }
                }

                if (fOld)
                {
                    /* Old player */
                    send_to_desc ("Password: ", d);
                    write_to_buffer (d, echo_off_str, 0);
                    d->connected = CON_GET_OLD_PASSWORD;
                    return;
                }
                else
                {
                    /* New player */
                    if (newlock)
                    {
                        send_to_desc ("The game is newlocked.\n\r", d);
                        close_socket (d);
                        return;
                    }

                    if (check_ban (d->host, BAN_NEWBIES))
                    {
                        send_to_desc
                            ("New players are not allowed from your site.\n\r",
                             d);
                        close_socket (d);
                        return;
                    }

                    sprintf (buf, "Did I get that right, %s (Y/N)? ", pName);
                    send_to_desc (buf, d);
                    d->connected = CON_CONFIRM_NEW_NAME;
                    return;
                }
            }
            break;

        case CON_GET_OLD_PASSWORD:
#if defined(unix)
            write_to_buffer (d, "\n\r", 2);
#endif

            if (strcmp (crypt (argument, ch->pcdata->pwd), ch->pcdata->pwd))
            {
                send_to_desc ("Wrong password.\n\r", d);
                close_socket (d);
                return;
            }

            write_to_buffer (d, echo_on_str, 0);

            if (check_playing (d, ch->name))
                return;

            if (check_reconnect (d, ch->name, TRUE))
                return;

            sprintf (log_buf, "%s@%s has connected.", ch->name, d->host);
            log_string (log_buf);
            wiznet (log_buf, NULL, NULL, WIZ_SITES, 0, get_trust (ch));

            if (ch->desc->ansi)
                SET_BIT (ch->act, PLR_COLOUR);
            else
                REMOVE_BIT (ch->act, PLR_COLOUR);

            if (IS_IMMORTAL (ch))
            {
                do_function (ch, &do_help, "imotd");
                d->connected = CON_READ_IMOTD;
            }
            else
            {
                do_function (ch, &do_help, "motd");
                d->connected = CON_READ_MOTD;
            }
            break;

/* RT code for breaking link */

        case CON_BREAK_CONNECT:
            switch (*argument)
            {
                case 'y':
                case 'Y':
                    for (d_old = descriptor_list; d_old != NULL;
                         d_old = d_next)
                    {
                        d_next = d_old->next;
                        if (d_old == d || d_old->character == NULL)
                            continue;

                        if (str_cmp (ch->name, d_old->original ?
                                     d_old->original->name : d_old->
                                     character->name))
                            continue;

                        close_socket (d_old);
                    }
                    if (check_reconnect (d, ch->name, TRUE))
                        return;
                    send_to_desc ("Reconnect attempt failed.\n\rName: ", d);
                    if (d->character != NULL)
                    {
                        free_char (d->character);
                        d->character = NULL;
                    }
                    d->connected = CON_GET_NAME;
                    break;

                case 'n':
                case 'N':
                    send_to_desc ("Name: ", d);
                    if (d->character != NULL)
                    {
                        free_char (d->character);
                        d->character = NULL;
                    }
                    d->connected = CON_GET_NAME;
                    break;

                default:
                    send_to_desc ("Please type Y or N? ", d);
                    break;
            }
            break;

        case CON_CONFIRM_NEW_NAME:
            switch (*argument)
            {
                case 'y':
                case 'Y':
                    sprintf (buf,
                             "New character.\n\rGive me a password for %s: %s",
                             ch->name, echo_off_str);
                    send_to_desc (buf, d);
                    d->connected = CON_GET_NEW_PASSWORD;
                    if (ch->desc->ansi)
                        SET_BIT (ch->act, PLR_COLOUR);
                    break;

                case 'n':
                case 'N':
                    send_to_desc ("Ok, what IS it, then? ", d);
                    free_char (d->character);
                    d->character = NULL;
                    d->connected = CON_GET_NAME;
                    break;

                default:
                    send_to_desc ("Please type Yes or No? ", d);
                    break;
            }
            break;

        case CON_GET_NEW_PASSWORD:
#if defined(unix)
            write_to_buffer (d, "\n\r", 2);
#endif

            if (strlen (argument) < 5)
            {
                send_to_desc
                    ("Password must be at least five characters long.\n\rPassword: ",
                     d);
                return;
            }

            pwdnew = crypt (argument, ch->name);
            for (p = pwdnew; *p != '\0'; p++)
            {
                if (*p == '~')
                {
                    send_to_desc
                        ("New password not acceptable, try again.\n\rPassword: ",
                         d);
                    return;
                }
            }

            free_string (ch->pcdata->pwd);
            ch->pcdata->pwd = str_dup (pwdnew);
            send_to_desc ("Please retype password: ", d);
            d->connected = CON_CONFIRM_NEW_PASSWORD;
            break;

        case CON_CONFIRM_NEW_PASSWORD:
#if defined(unix)
            write_to_buffer (d, "\n\r", 2);
#endif

            if (strcmp (crypt (argument, ch->pcdata->pwd), ch->pcdata->pwd))
            {
                send_to_desc ("Passwords don't match.\n\rRetype password: ",
                              d);
                d->connected = CON_GET_NEW_PASSWORD;
                return;
            }

            write_to_buffer (d, echo_on_str, 0);
            send_race_selection_table(d);
            send_to_desc ("\n\rWhat is your race? (type 'help <race>' for details) ", d);
            d->connected = CON_GET_NEW_RACE;
            break;

        case CON_GET_NEW_RACE:
            one_argument (argument, arg);

            if (!strcmp (arg, "help"))
            {
                argument = one_argument (argument, arg);
                if (arg[0] == '\0')
                {
                    send_to_desc ("Use: help <race>   Example: help drow\n\r", d);
                    send_race_selection_table(d);
                }
                else
                    do_function (ch, &do_help, arg);

                send_to_desc ("\n\rWhat is your race? (type 'help <race>' for details) ", d);
                break;
            }

            race = race_lookup (argument);

            if (race == 0 || !race_table[race].pc_race)
            {
                send_to_desc ("That is not a valid race.\n\r", d);
                send_race_selection_table(d);
                send_to_desc ("\n\rWhat is your race? (type 'help <race>' for details) ", d);
                break;
            }

            ch->race = race;
            /* initialize stats */
            for (i = 0; i < MAX_STATS; i++)
                ch->perm_stat[i] = pc_race_table[race].stats[i];
            ch->affected_by = ch->affected_by | race_table[race].aff;
            ch->imm_flags = ch->imm_flags | race_table[race].imm;
            ch->res_flags = ch->res_flags | race_table[race].res;
            ch->vuln_flags = ch->vuln_flags | race_table[race].vuln;
            ch->form = race_table[race].form;
            ch->parts = race_table[race].parts;

            /* add skills */
            for (i = 0; i < 5; i++)
            {
                if (pc_race_table[race].skills[i] == NULL)
                    break;
                group_add (ch, pc_race_table[race].skills[i], FALSE);
            }
            /* add cost */
            ch->pcdata->points = pc_race_table[race].points;
            ch->size = pc_race_table[race].size;

            send_to_desc ("What is your sex (M/F)? ", d);
            d->connected = CON_GET_NEW_SEX;
            break;


        case CON_GET_NEW_SEX:
            switch (argument[0])
            {
                case 'm':
                case 'M':
                    ch->sex = SEX_MALE;
                    ch->pcdata->true_sex = SEX_MALE;
                    break;
                case 'f':
                case 'F':
                    ch->sex = SEX_FEMALE;
                    ch->pcdata->true_sex = SEX_FEMALE;
                    break;
                default:
                    send_to_desc ("That's not a sex.\n\rWhat IS your sex? ",
                                  d);
                    return;
            }

            strcpy (buf, "Select a profession [");
            {
                bool first_class = TRUE;
            for (iClass = 0; iClass < MAX_PROFESSION; iClass++)
            {
                if (profession_table[iClass].name == NULL || profession_table[iClass].name[0] == '\0')
                    continue;
                if (!first_class)
                    strcat (buf, " ");
                strcat (buf, profession_table[iClass].name);
                first_class = FALSE;
            }
            }
            strcat (buf, "]: ");
            write_to_buffer (d, buf, 0);
            d->connected = CON_GET_NEW_CLASS;
            break;

        case CON_GET_NEW_CLASS:
            iClass = class_lookup (argument);

            if (iClass == -1)
            {
                send_to_desc ("That's not a class.\n\rWhat IS your class? ",
                              d);
                return;
            }

            ch->class = iClass;

            sprintf (log_buf, "%s@%s new player.", ch->name, d->host);
            log_string (log_buf);
            wiznet ("Newbie alert!  $N sighted.", ch, NULL, WIZ_NEWBIE, 0, 0);
            wiznet (log_buf, NULL, NULL, WIZ_SITES, 0, get_trust (ch));

            write_to_buffer (d, "\n\r", 2);
            {
                char sect_buf[512];
                int i;
                strcpy(sect_buf, "Available sects:\n\r");
                for (i = 0; i < MAX_SECT; i++) {
                    char line[128];
                    snprintf(line, sizeof(line), "%d) %s - %s\n\r", i+1, sect_table[i].name, sect_table[i].description ? sect_table[i].description : "");
                    strcat(sect_buf, line);
                }
                strcat(sect_buf, "Select a sect (1-8): ");
                send_to_desc(sect_buf, d);
            }
            d->connected = CON_SELECT_SECT;
            break;

        case CON_GET_ALIGNMENT:
            switch (argument[0])
            {
                case 'g':
                case 'G':
                    ch->alignment = 750;
                    break;
                case 'n':
                case 'N':
                    ch->alignment = 0;
                    break;
                case 'e':
                case 'E':
                    ch->alignment = -750;
                    break;
                default:
                    send_to_desc ("That's not a valid alignment.\n\r", d);
                    send_to_desc ("Which alignment (G/N/E)? ", d);
                    return;
            }

            write_to_buffer (d, "\n\r", 0);

            group_add (ch, "rom basics", FALSE);
            group_add (ch,
                       get_profession (ch) != NULL ? get_profession (ch)->base_group : class_table[ch->class].base_group,
                       FALSE);
            ch->pcdata->learned[gsn_recall] = 50;
            send_to_desc ("Do you wish to customize this character?\n\r", d);
            send_to_desc
                ("Customization takes time, but allows a wider range of skills and abilities.\n\r",
                 d);
            send_to_desc ("Customize (Y/N)? ", d);
            d->connected = CON_DEFAULT_CHOICE;
            break;

        case CON_SELECT_SECT:
        {
            int sect_choice = atoi(argument);
            
            if (sect_choice < 1 || sect_choice > 8)
            {
                send_to_desc ("That's not a valid sect (1-8).\n\r", d);
                send_to_desc ("Which sect (1-8)? ", d);
                return;
            }
            
            ch->sect_number = sect_choice - 1;

            if (sect_table[ch->sect_number].base_group != NULL
                && sect_table[ch->sect_number].base_group[0] != '\0')
            {
                group_add (ch, sect_table[ch->sect_number].base_group, FALSE);
            }
            
            /* Set alignment based on sect */
            if (sect_table[ch->sect_number].alignment == 1)
            {
                ch->alignment = 1000;
            }
            else if (sect_table[ch->sect_number].alignment == -1)
            {
                ch->alignment = -1000;
            }
            else
            {
                ch->alignment = 0;
            }
            
            write_to_buffer (d, "\n\r", 0);
            send_to_desc ("Perfect! Continue...\n\r", d);
            // Begin stat allocation step (customization)
            send_to_desc ("You may now allocate your starting stat points.\n\r", d);
            send_to_desc ("Type the stat you wish to increase (str, dex, con, wis, int) or 'done' when finished.\n\r", d);
            ch->pcdata->stat_points = 10; // Example: 10 points to spend
            d->connected = CON_ROP_STAT_ALLOCATION;
            break;
        }

        case CON_ROP_STAT_ALLOCATION:
            if (ch->pcdata->stat_points <= 0 || !str_cmp(argument, "done")) {
                send_to_desc("Stat allocation complete.\n\r", d);
                ch->gen_data = new_gen_data();
                ch->gen_data->points_chosen = ch->pcdata->points;
                do_function(ch, &do_help, "group header");
                list_group_costs(ch);
                write_to_buffer(d, "You already have the following skills:\n\r", 0);
                do_function(ch, &do_skills, "");
                do_function(ch, &do_help, "menu choice");
                d->connected = CON_GEN_GROUPS;
                break;
            }

            if (!str_cmp(argument, "str")) {
                ch->perm_stat[STAT_STR]++;
                ch->pcdata->stat_points--;
                send_to_desc("Increased Strength. ", d);
            } else if (!str_cmp(argument, "dex")) {
                ch->perm_stat[STAT_DEX]++;
                ch->pcdata->stat_points--;
                send_to_desc("Increased Dexterity. ", d);
            } else if (!str_cmp(argument, "con")) {
                ch->perm_stat[STAT_CON]++;
                ch->pcdata->stat_points--;
                send_to_desc("Increased Constitution. ", d);
            } else if (!str_cmp(argument, "wis")) {
                ch->perm_stat[STAT_WIS]++;
                ch->pcdata->stat_points--;
                send_to_desc("Increased Wisdom. ", d);
            } else if (!str_cmp(argument, "int")) {
                ch->perm_stat[STAT_INT]++;
                ch->pcdata->stat_points--;
                send_to_desc("Increased Intelligence. ", d);
            } else {
                send_to_desc("Type a stat to increase (str, dex, con, wis, int) or 'done'.\n\r", d);
            }

            {
                char statbuf[256];
                snprintf(statbuf, sizeof(statbuf), "Points left: %d\n\rSTR: %d  DEX: %d  CON: %d  WIS: %d  INT: %d\n\r", ch->pcdata->stat_points, ch->perm_stat[STAT_STR], ch->perm_stat[STAT_DEX], ch->perm_stat[STAT_CON], ch->perm_stat[STAT_WIS], ch->perm_stat[STAT_INT]);
                send_to_desc(statbuf, d);
            }
            break;

        case CON_DEFAULT_CHOICE:
            write_to_buffer (d, "\n\r", 2);
            switch (argument[0])
            {
                case 'y':
                case 'Y':
                    ch->gen_data = new_gen_data ();
                    ch->gen_data->points_chosen = ch->pcdata->points;
                    do_function (ch, &do_help, "group header");
                    list_group_costs (ch);
                    write_to_buffer (d,
                                     "You already have the following skills:\n\r",
                                     0);
                    do_function (ch, &do_skills, "");
                    do_function (ch, &do_help, "menu choice");
                    d->connected = CON_GEN_GROUPS;
                    break;
                case 'n':
                case 'N':
                    group_add (ch,
                               get_profession (ch) != NULL ? get_profession (ch)->default_group : class_table[ch->class].default_group,
                               TRUE);
                    write_to_buffer (d, "\n\r", 2);
                    write_to_buffer (d,
                                     "Please pick a weapon from the following choices:\n\r",
                                     0);
                    buf[0] = '\0';
                    for (i = 0; weapon_table[i].name != NULL; i++)
                        if (ch->pcdata->learned[*weapon_table[i].gsn] > 0)
                        {
                            strcat (buf, weapon_table[i].name);
                            strcat (buf, " ");
                        }
                    strcat (buf, "\n\rYour choice? ");
                    write_to_buffer (d, buf, 0);
                    d->connected = CON_PICK_WEAPON;
                    break;
                default:
                    write_to_buffer (d, "Please answer (Y/N)? ", 0);
                    return;
            }
            break;

        case CON_PICK_WEAPON:
            write_to_buffer (d, "\n\r", 2);
            weapon = weapon_lookup (argument);
            if (weapon == -1
                || ch->pcdata->learned[*weapon_table[weapon].gsn] <= 0)
            {
                write_to_buffer (d,
                                 "That's not a valid selection. Choices are:\n\r",
                                 0);
                buf[0] = '\0';
                for (i = 0; weapon_table[i].name != NULL; i++)
                    if (ch->pcdata->learned[*weapon_table[i].gsn] > 0)
                    {
                        strcat (buf, weapon_table[i].name);
                        strcat (buf, " ");
                    }
                strcat (buf, "\n\rYour choice? ");
                write_to_buffer (d, buf, 0);
                return;
            }

            ch->pcdata->learned[*weapon_table[weapon].gsn] = 40;
            write_to_buffer (d, "\n\r", 2);
            do_function (ch, &do_help, "motd");
            d->connected = CON_READ_MOTD;
            break;

        case CON_GEN_GROUPS:
            send_to_char ("\n\r", ch);

            if (!str_cmp (argument, "done"))
            {
                if (ch->pcdata->points == pc_race_table[ch->race].points)
                {
                    send_to_char ("You didn't pick anything.\n\r", ch);
                    break;
                }

                if (ch->pcdata->points < 40 + pc_race_table[ch->race].points)
                {
                    sprintf (buf,
                             "You must take at least %d points of skills and groups",
                             40 + pc_race_table[ch->race].points);
                    send_to_char (buf, ch);
                    break;
                }

                sprintf (buf, "Creation points: %d\n\r", ch->pcdata->points);
                send_to_char (buf, ch);
                sprintf (buf, "Experience per level: %d\n\r",
                         exp_per_level (ch, ch->gen_data->points_chosen));
                if (ch->pcdata->points < 40)
                    ch->train = (40 - ch->pcdata->points + 1) / 2;
                free_gen_data (ch->gen_data);
                ch->gen_data = NULL;
                send_to_char (buf, ch);
                write_to_buffer (d, "\n\r", 2);
                write_to_buffer (d,
                                 "Please pick a weapon from the following choices:\n\r",
                                 0);
                buf[0] = '\0';
                for (i = 0; weapon_table[i].name != NULL; i++)
                    if (ch->pcdata->learned[*weapon_table[i].gsn] > 0)
                    {
                        strcat (buf, weapon_table[i].name);
                        strcat (buf, " ");
                    }
                strcat (buf, "\n\rYour choice? ");
                write_to_buffer (d, buf, 0);
                d->connected = CON_PICK_WEAPON;
                break;
            }

            if (!parse_gen_groups (ch, argument))
                send_to_char
                    ("Choices are: list,learned,premise,add,drop,info,help, and done.\n\r",
                     ch);

            do_function (ch, &do_help, "menu choice");
            break;

        case CON_READ_IMOTD:
            write_to_buffer (d, "\n\r", 2);
            do_function (ch, &do_help, "imotd");
            write_to_buffer (d,
                             "\n\rWelcome to Rites of Passage, enjoy your stay...\n\r\n\r",
                             0);
            ch->next = char_list;
            char_list = ch;
            d->connected = CON_PLAYING;
            reset_char (ch);
            break;

		/* states for new note system, (c)1995-96 erwin@pip.dknet.dk */
		/* ch MUST be PC here; have nwrite check for PC status! */

		case CON_NOTE_TO:
			handle_con_note_to (d, argument);
			break;

		case CON_NOTE_SUBJECT:
			handle_con_note_subject (d, argument);
			break;

		case CON_NOTE_EXPIRE:
			handle_con_note_expire (d, argument);
			break;

		case CON_NOTE_TEXT:
			handle_con_note_text (d, argument);
			break;

		case CON_NOTE_FINISH:
			handle_con_note_finish (d, argument);
			break;

        case CON_READ_MOTD:
            if (ch->pcdata == NULL || ch->pcdata->pwd[0] == '\0')
            {
                write_to_buffer (d, "Warning! Null password!\n\r", 0);
                write_to_buffer (d,
                                 "Please report old password with bug.\n\r",
                                 0);
                write_to_buffer (d,
                                 "Type 'password null <new password>' to fix.\n\r",
                                 0);
            }

            write_to_buffer (d,
                             "\n\rWelcome to Rites of Passage, enjoy your stay...\n\r\n\r",
                             0);
            ch->next = char_list;
            char_list = ch;
            d->connected = CON_PLAYING;
            reset_char (ch);

            if (ch->level == 0)
            {
		if(mud_ansicolor)
                	SET_BIT (ch->act, PLR_COLOUR);
		if(mud_telnetga)
			SET_BIT (ch->comm, COMM_TELNET_GA);

                ch->perm_stat[get_profession (ch) != NULL ? get_profession (ch)->attr_prime : class_table[ch->class].attr_prime] += 3;

                ch->level = 1;
                ch->exp = exp_per_level (ch, ch->pcdata->points);
                ch->hit = ch->max_hit;
                ch->mana = ch->max_mana;
                ch->move = ch->max_move;
                ch->train = 3;
                ch->practice = 5;
                sprintf (buf, "the %s", title_table[ch->class][ch->level]
                         [ch->sex == SEX_FEMALE ? 1 : 0]);
                set_title (ch, buf);

                do_function (ch, &do_outfit, "");
                obj_to_char (create_object (get_obj_index (OBJ_VNUM_MAP), 0),
                             ch);

                {
                    ROOM_INDEX_DATA *start_room = get_homeland_start_room(ch);
                    if (start_room != NULL)
                        char_to_room(ch, start_room);
                    else
                        char_to_room(ch, get_room_index(ROOM_VNUM_TEMPLE));
                }
                send_to_char ("\n\r", ch);
                do_function (ch, &do_help, "newbie info");
                send_to_char ("\n\r", ch);
            }
            else if (ch->in_room != NULL)
            {
                char_to_room (ch, ch->in_room);
            }
            else if (IS_IMMORTAL (ch))
            {
                char_to_room (ch, get_room_index (ROOM_VNUM_CHAT));
            }
            else
            {
                char_to_room (ch, get_room_index (ROOM_VNUM_TEMPLE));
            }

            act ("$n has entered the game.", ch, NULL, NULL, TO_ROOM);
            do_function (ch, &do_look, "auto");

            wiznet ("$N has left real life behind.", ch, NULL,
                    WIZ_LOGINS, WIZ_SITES, get_trust (ch));

            if (ch->pet != NULL)
            {
                char_to_room (ch->pet, ch->in_room);
                act ("$n has entered the game.", ch->pet, NULL, NULL,
                     TO_ROOM);
            }

			send_to_char("\n", ch);
            do_function (ch, &do_board, "");
            break;
    }

    return;
}

