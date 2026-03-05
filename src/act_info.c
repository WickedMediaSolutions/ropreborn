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
 *  Much time and thought has gone into this software and you are          *
 *  benefitting.  We hope that you share your changes too.  What goes      *
 *  around, comes around.                                                  *
 **************************************************************************/

/***************************************************************************
 *   ROM 2.4 is copyright 1993-1998 Russ Taylor                            *
 *   ROM has been brought to you by the ROM consortium                     *
 *       Russ Taylor (rtaylor@hypercube.org)                               *
 *       Gabrielle Taylor (gtaylor@hypercube.org)                          *
 *       Brian Moore (zump@rom.org)                                        *
 *   By using this code, you have agreed to follow the terms of the        *
 *   ROM license, in the file Rom24/doc/rom.license                        *
 **************************************************************************/

/*   QuickMUD - The Lazy Man's ROM - $Id: act_info.c,v 1.3 2000/12/01 10:48:33 ring0 Exp $ */

#if defined(macintosh)
#include <types.h>
#else
#include <sys/types.h>
#include <sys/time.h>
#endif
#include <stdio.h>
#include <string.h>
#include <stdlib.h>
#include <ctype.h>
#include <time.h>
#include "merc.h"
#include "config.h"
#include "interp.h"
#include "magic.h"
#include "recycle.h"
#include "tables.h"
#include "lookup.h"

#ifndef MIN_REMORT_LEVEL
#define MIN_REMORT_LEVEL 50
#endif

#ifndef MAX_REMORTS
#define MAX_REMORTS 5
#endif

char *const where_name[] = {
    "<used as light>     ",
    "<worn on finger>    ",
    "<worn on finger>    ",
    "<worn around neck>  ",
    "<worn around neck>  ",
    "<worn on torso>     ",
    "<worn on head>      ",
    "<worn on legs>      ",
    "<worn on feet>      ",
    "<worn on hands>     ",
    "<worn on arms>      ",
    "<worn as shield>    ",
    "<worn about body>   ",
    "<worn about waist>  ",
    "<worn around wrist> ",
    "<worn around wrist> ",
    "<wielded>           ",
    "<held>              ",
    "<floating nearby>   ",
};


/* for  keeping track of the player count */
int max_on = 0;

/*
 * Local functions.
 */
char *format_obj_to_char args ((OBJ_DATA * obj, CHAR_DATA * ch, bool fShort));
void show_list_to_char args ((OBJ_DATA * list, CHAR_DATA * ch,
                              bool fShort, bool fShowNothing));
void show_char_to_char_0 args ((CHAR_DATA * victim, CHAR_DATA * ch));
void show_char_to_char_1 args ((CHAR_DATA * victim, CHAR_DATA * ch));
void show_char_to_char args ((CHAR_DATA * list, CHAR_DATA * ch));
bool check_blind args ((CHAR_DATA * ch));

static bool npc_should_be_pink (CHAR_DATA * victim)
{
    if (!IS_NPC (victim))
        return FALSE;

    if (victim->pIndexData != NULL && victim->pIndexData->pShop != NULL)
        return FALSE;

    if (IS_SET (victim->act, ACT_PET)
        || IS_SET (victim->act, ACT_NOPURGE)
        || IS_SET (victim->act, ACT_TRAIN)
        || IS_SET (victim->act, ACT_PRACTICE)
        || IS_SET (victim->act, ACT_IS_HEALER)
        || IS_SET (victim->act, ACT_GAIN)
        || IS_SET (victim->act, ACT_IS_CHANGER))
        return FALSE;

    if (!IS_SET (victim->act, ACT_AGGRESSIVE) && victim->fighting == NULL)
        return FALSE;

    return TRUE;
}

static const char *sect_passive_summary (int sect)
{
    switch (sect)
    {
        default:
            return "No special passive bonuses.";
        case 0:
            return "+2 cast level and 5% mana reduction on support spells; 6% less spell damage taken.";
        case 1:
            return "+2 cast level and 8% mana reduction on support spells; 5% less damage taken.";
        case 2:
            return "10% lower mana costs on all spells; +1 cast level baseline.";
        case 3:
            return "+3 cast level and 12% mana reduction on support spells.";
        case 4:
            return "+3 cast level on offensive spells; +15% melee damage.";
        case 5:
            return "+2 cast level and 5% mana reduction on offensive spells; 12% melee crit for +20% damage.";
        case 6:
            return "+4 cast level on offensive spells; +12% spell damage (with +5% mana strain).";
        case 7:
            return "+2 cast level and 5% mana reduction on support spells; 10% chance to reduce incoming damage by 20%.";
    }
}

static const char *sect_active_name (int sect)
{
    switch (sect)
    {
        default:
            return "Unknown Invocation";
        case 0:
            return "Aegis of Aethelhelm";
        case 1:
            return "Crisis Heal";
        case 2:
            return "Transmute";
        case 3:
            return "Renewal Bloom";
        case 4:
            return "Tyrant's Brand";
        case 5:
            return "Shadow Clone";
        case 6:
            return "Frost Nova";
        case 7:
            return "Storm Step";
    }
}

static const char *sect_active_summary (int sect)
{
    switch (sect)
    {
        default:
            return "No sect active available.";
        case 0:
            return "Defensive ward: grants sanctuary to self for a short duration.";
        case 1:
            return "Emergency healing: restores a large amount of hit points to an ally.";
        case 2:
            return "Arcane exchange: sacrifice health to recover mana.";
        case 3:
            return "Nature renewal: restore hit points and movement to an ally.";
        case 4:
            return "Domination strike: heavy damage and temporary strength penalty.";
        case 5:
            return "Shadow clone: grants a short agility surge to self.";
        case 6:
            return "Frost nova: burst spell damage that can briefly stagger a target.";
        case 7:
            return "Storm step: veil yourself in speed and invisibility.";
    }
}

static int sect_active_mana_cost (int sect)
{
    switch (sect)
    {
        default:
            return 30;
        case 0:
            return 40;
        case 1:
            return 45;
        case 2:
            return 20;
        case 3:
            return 35;
        case 4:
            return 45;
        case 5:
            return 30;
        case 6:
            return 50;
        case 7:
            return 35;
    }
}

static const char *warpoint_season_name (void)
{
    if (time_info.month >= 0 && time_info.month <= 3)
        return "Spring";
    if (time_info.month >= 4 && time_info.month <= 7)
        return "Summer";
    if (time_info.month >= 8 && time_info.month <= 11)
        return "Autumn";
    return "Winter";
}

static int warpoint_season_bonus_percent (void)
{
    if (time_info.month >= 0 && time_info.month <= 3)
        return WARPOINT_SEASON_SPRING_BONUS;
    if (time_info.month >= 4 && time_info.month <= 7)
        return WARPOINT_SEASON_SUMMER_BONUS;
    if (time_info.month >= 8 && time_info.month <= 11)
        return WARPOINT_SEASON_AUTUMN_BONUS;
    return WARPOINT_SEASON_WINTER_BONUS;
}

static const char *warpoint_event_name (void)
{
    if (time_info.day >= WARPOINT_EVENT_FINALE_START
        && time_info.day <= WARPOINT_EVENT_FINALE_END)
        return "Finale Clash";

    if (time_info.day >= WARPOINT_EVENT_MID_START
        && time_info.day <= WARPOINT_EVENT_MID_END)
        return "Midseason Surge";

    if (time_info.day >= WARPOINT_EVENT_OPENING_START
        && time_info.day <= WARPOINT_EVENT_OPENING_END)
        return "Opening Clash";

    return "None";
}

static int warpoint_event_bonus_percent (void)
{
    if (time_info.day >= WARPOINT_EVENT_FINALE_START
        && time_info.day <= WARPOINT_EVENT_FINALE_END)
        return WARPOINT_EVENT_FINALE_BONUS;

    if (time_info.day >= WARPOINT_EVENT_MID_START
        && time_info.day <= WARPOINT_EVENT_MID_END)
        return WARPOINT_EVENT_MID_BONUS;

    if (time_info.day >= WARPOINT_EVENT_OPENING_START
        && time_info.day <= WARPOINT_EVENT_OPENING_END)
        return WARPOINT_EVENT_OPENING_BONUS;

    return 0;
}



char *format_obj_to_char (OBJ_DATA * obj, CHAR_DATA * ch, bool fShort)
{
    static char buf[MAX_STRING_LENGTH];

    buf[0] = '\0';

    if ((fShort && (obj->short_descr == NULL || obj->short_descr[0] == '\0'))
        || (obj->description == NULL || obj->description[0] == '\0'))
        return buf;

    if (IS_OBJ_STAT (obj, ITEM_INVIS))
        strcat (buf, "(Invis) ");
    if (IS_AFFECTED (ch, AFF_DETECT_EVIL) && IS_OBJ_STAT (obj, ITEM_EVIL))
        strcat (buf, "(Red Aura) ");
    if (IS_AFFECTED (ch, AFF_DETECT_GOOD) && IS_OBJ_STAT (obj, ITEM_BLESS))
        strcat (buf, "(Blue Aura) ");
    if (IS_AFFECTED (ch, AFF_DETECT_MAGIC) && IS_OBJ_STAT (obj, ITEM_MAGIC))
        strcat (buf, "(Magical) ");
    if (IS_OBJ_STAT (obj, ITEM_GLOW))
        strcat (buf, "(Glowing) ");
    if (IS_OBJ_STAT (obj, ITEM_HUM))
        strcat (buf, "(Humming) ");

    if (fShort)
    {
        if (obj->short_descr != NULL)
            strcat (buf, obj->short_descr);
    }
    else
    {
        if (obj->description != NULL)
            strcat (buf, obj->description);
    }

    return buf;
}



/*
 * Show a list to a character.
 * Can coalesce duplicated items.
 */
void show_list_to_char (OBJ_DATA * list, CHAR_DATA * ch, bool fShort,
                        bool fShowNothing)
{
    char buf[MAX_STRING_LENGTH];
    BUFFER *output;
    char **prgpstrShow;
    int *prgnShow;
    char *pstrShow;
    OBJ_DATA *obj;
    int nShow;
    int iShow;
    int count;
    bool fCombine;
    bool fRoomObjects;

    if (ch->desc == NULL)
        return;

    fRoomObjects = (!fShort && !fShowNothing);

    /*
     * Alloc space for output lines.
     */
    output = new_buf ();

    count = 0;
    for (obj = list; obj != NULL; obj = obj->next_content)
        count++;
    prgpstrShow = alloc_mem (count * sizeof (char *));
    prgnShow = alloc_mem (count * sizeof (int));
    nShow = 0;

    /*
     * Format the list of objects.
     */
    for (obj = list; obj != NULL; obj = obj->next_content)
    {
        if (obj->wear_loc == WEAR_NONE && can_see_obj (ch, obj))
        {
            pstrShow = format_obj_to_char (obj, ch, fShort);

            fCombine = FALSE;

            if (IS_NPC (ch) || IS_SET (ch->comm, COMM_COMBINE))
            {
                /*
                 * Look for duplicates, case sensitive.
                 * Matches tend to be near end so run loop backwords.
                 */
                for (iShow = nShow - 1; iShow >= 0; iShow--)
                {
                    if (!strcmp (prgpstrShow[iShow], pstrShow))
                    {
                        prgnShow[iShow]++;
                        fCombine = TRUE;
                        break;
                    }
                }
            }

            /*
             * Couldn't combine, or didn't want to.
             */
            if (!fCombine)
            {
                prgpstrShow[nShow] = str_dup (pstrShow);
                prgnShow[nShow] = 1;
                nShow++;
            }
        }
    }

    /*
     * Output the formatted list.
     */
    for (iShow = 0; iShow < nShow; iShow++)
    {
        if (prgpstrShow[iShow][0] == '\0')
        {
            free_string (prgpstrShow[iShow]);
            continue;
        }

        if (IS_NPC (ch) || IS_SET (ch->comm, COMM_COMBINE))
        {
            if (prgnShow[iShow] != 1)
            {
                sprintf (buf, "(%2d) ", prgnShow[iShow]);
                add_buf (output, buf);
            }
            else
            {
                add_buf (output, "     ");
            }
        }
        if (fRoomObjects)
            add_buf (output, "{Y");
        add_buf (output, prgpstrShow[iShow]);
        if (fRoomObjects)
            add_buf (output, "{x");
        add_buf (output, "\n\r");
        free_string (prgpstrShow[iShow]);
    }

    if (fShowNothing && nShow == 0)
    {
        if (IS_NPC (ch) || IS_SET (ch->comm, COMM_COMBINE))
            send_to_char ("     ", ch);
        send_to_char ("Nothing.\n\r", ch);
    }
    page_to_char (buf_string (output), ch);

    /*
     * Clean up.
     */
    free_buf (output);
    free_mem (prgpstrShow, count * sizeof (char *));
    free_mem (prgnShow, count * sizeof (int));

    return;
}



void show_char_to_char_0 (CHAR_DATA * victim, CHAR_DATA * ch)
{
    char buf[MAX_STRING_LENGTH], message[MAX_STRING_LENGTH];

    buf[0] = '\0';

    if (IS_SET (victim->comm, COMM_AFK))
        strcat (buf, "[AFK] ");
    if (IS_AFFECTED (victim, AFF_INVISIBLE))
        strcat (buf, "(Invis) ");
    if (victim->invis_level >= LEVEL_HERO)
        strcat (buf, "(Wizi) ");
    if (IS_AFFECTED (victim, AFF_HIDE))
        strcat (buf, "(Hide) ");
    if (IS_AFFECTED (victim, AFF_CHARM))
        strcat (buf, "(Charmed) ");
    if (IS_AFFECTED (victim, AFF_PASS_DOOR))
        strcat (buf, "(Translucent) ");
    if (IS_AFFECTED (victim, AFF_FAERIE_FIRE))
        strcat (buf, "(Pink Aura) ");
    if (IS_EVIL (victim) && IS_AFFECTED (ch, AFF_DETECT_EVIL))
        strcat (buf, "(Red Aura) ");
    if (IS_GOOD (victim) && IS_AFFECTED (ch, AFF_DETECT_GOOD))
        strcat (buf, "(Golden Aura) ");
    if (IS_AFFECTED (victim, AFF_SANCTUARY))
        strcat (buf, "(White Aura) ");
    if (!IS_NPC (victim) && IS_SET (victim->act, PLR_KILLER))
        strcat (buf, "(KILLER) ");
    if (!IS_NPC (victim) && IS_SET (victim->act, PLR_THIEF))
        strcat (buf, "(THIEF) ");
    if (victim->position == victim->start_pos
        && victim->long_descr[0] != '\0')
    {
        if (npc_should_be_pink (victim))
            strcat (buf, "{C");
        strcat (buf, victim->long_descr);
        if (npc_should_be_pink (victim))
            strcat (buf, "{x");
        send_to_char (buf, ch);
        return;
    }

    strcat (buf, PERS (victim, ch));
    if (!IS_NPC (victim) && !IS_SET (ch->comm, COMM_BRIEF)
        && victim->position == POS_STANDING && ch->on == NULL)
        strcat (buf, victim->pcdata->title);

    switch (victim->position)
    {
        case POS_DEAD:
            strcat (buf, " is DEAD!!");
            break;
        case POS_MORTAL:
            strcat (buf, " is mortally wounded.");
            break;
        case POS_INCAP:
            strcat (buf, " is incapacitated.");
            break;
        case POS_STUNNED:
            strcat (buf, " is lying here stunned.");
            break;
        case POS_SLEEPING:
            if (victim->on != NULL)
            {
                if (IS_SET (victim->on->value[2], SLEEP_AT))
                {
                    sprintf (message, " is sleeping at %s.",
                             victim->on->short_descr);
                    strcat (buf, message);
                }
                else if (IS_SET (victim->on->value[2], SLEEP_ON))
                {
                    sprintf (message, " is sleeping on %s.",
                             victim->on->short_descr);
                    strcat (buf, message);
                }
                else
                {
                    sprintf (message, " is sleeping in %s.",
                             victim->on->short_descr);
                    strcat (buf, message);
                }
            }
            else
                strcat (buf, " is sleeping here.");
            break;
        case POS_RESTING:
            if (victim->on != NULL)
            {
                if (IS_SET (victim->on->value[2], REST_AT))
                {
                    sprintf (message, " is resting at %s.",
                             victim->on->short_descr);
                    strcat (buf, message);
                }
                else if (IS_SET (victim->on->value[2], REST_ON))
                {
                    sprintf (message, " is resting on %s.",
                             victim->on->short_descr);
                    strcat (buf, message);
                }
                else
                {
                    sprintf (message, " is resting in %s.",
                             victim->on->short_descr);
                    strcat (buf, message);
                }
            }
            else
                strcat (buf, " is resting here.");
            break;
        case POS_SITTING:
            if (victim->on != NULL)
            {
                if (IS_SET (victim->on->value[2], SIT_AT))
                {
                    sprintf (message, " is sitting at %s.",
                             victim->on->short_descr);
                    strcat (buf, message);
                }
                else if (IS_SET (victim->on->value[2], SIT_ON))
                {
                    sprintf (message, " is sitting on %s.",
                             victim->on->short_descr);
                    strcat (buf, message);
                }
                else
                {
                    sprintf (message, " is sitting in %s.",
                             victim->on->short_descr);
                    strcat (buf, message);
                }
            }
            else
                strcat (buf, " is sitting here.");
            break;
        case POS_STANDING:
            if (victim->on != NULL)
            {
                if (IS_SET (victim->on->value[2], STAND_AT))
                {
                    sprintf (message, " is standing at %s.",
                             victim->on->short_descr);
                    strcat (buf, message);
                }
                else if (IS_SET (victim->on->value[2], STAND_ON))
                {
                    sprintf (message, " is standing on %s.",
                             victim->on->short_descr);
                    strcat (buf, message);
                }
                else
                {
                    sprintf (message, " is standing in %s.",
                             victim->on->short_descr);
                    strcat (buf, message);
                }
            }
            else
                strcat (buf, " is here.");
            break;
        case POS_FIGHTING:
            strcat (buf, " is here, fighting ");
            if (victim->fighting == NULL)
                strcat (buf, "thin air??");
            else if (victim->fighting == ch)
                strcat (buf, "YOU!");
            else if (victim->in_room == victim->fighting->in_room)
            {
                strcat (buf, PERS (victim->fighting, ch));
                strcat (buf, ".");
            }
            else
                strcat (buf, "someone who left??");
            break;
    }

    strcat (buf, "\n\r");
    buf[0] = UPPER (buf[0]);
    if (npc_should_be_pink (victim))
    {
        char color_buf[MAX_STRING_LENGTH * 2];
        snprintf (color_buf, sizeof (color_buf), "{C%s{x", buf);
        strncpy (buf, color_buf, sizeof (buf) - 1);
        buf[sizeof (buf) - 1] = '\0';
    }
    send_to_char (buf, ch);
    return;
}



void show_char_to_char_1 (CHAR_DATA * victim, CHAR_DATA * ch)
{
    char buf[MAX_STRING_LENGTH];
    OBJ_DATA *obj;
    int iWear;
    int percent;
    bool found;

    if (can_see (victim, ch))
    {
        if (ch == victim)
            act ("$n looks at $mself.", ch, NULL, NULL, TO_ROOM);
        else
        {
            act ("$n looks at you.", ch, NULL, victim, TO_VICT);
            act ("$n looks at $N.", ch, NULL, victim, TO_NOTVICT);
        }
    }

    if (victim->description[0] != '\0')
    {
        send_to_char (victim->description, ch);
    }
    else
    {
        act ("You see nothing special about $M.", ch, NULL, victim, TO_CHAR);
    }

    if (victim->max_hit > 0)
        percent = (100 * victim->hit) / victim->max_hit;
    else
        percent = -1;

    strcpy (buf, PERS (victim, ch));

    if (percent >= 100)
        strcat (buf, " is in excellent condition.\n\r");
    else if (percent >= 90)
        strcat (buf, " has a few scratches.\n\r");
    else if (percent >= 75)
        strcat (buf, " has some small wounds and bruises.\n\r");
    else if (percent >= 50)
        strcat (buf, " has quite a few wounds.\n\r");
    else if (percent >= 30)
        strcat (buf, " has some big nasty wounds and scratches.\n\r");
    else if (percent >= 15)
        strcat (buf, " looks pretty hurt.\n\r");
    else if (percent >= 0)
        strcat (buf, " is in awful condition.\n\r");
    else
        strcat (buf, " is bleeding to death.\n\r");

    buf[0] = UPPER (buf[0]);
    send_to_char (buf, ch);

    found = FALSE;
    for (iWear = 0; iWear < MAX_WEAR; iWear++)
    {
        if ((obj = get_eq_char (victim, iWear)) != NULL
            && can_see_obj (ch, obj))
        {
            if (!found)
            {
                send_to_char ("\n\r", ch);
                act ("$N is using:", ch, NULL, victim, TO_CHAR);
                found = TRUE;
            }
            send_to_char (where_name[iWear], ch);
            send_to_char (format_obj_to_char (obj, ch, TRUE), ch);
            send_to_char ("\n\r", ch);
        }
    }

    if (victim != ch && !IS_NPC (ch)
        && number_percent () < get_skill (ch, gsn_peek))
    {
        send_to_char ("\n\rYou peek at the inventory:\n\r", ch);
        check_improve (ch, gsn_peek, TRUE, 4);
        show_list_to_char (victim->carrying, ch, TRUE, TRUE);
    }

    return;
}



void show_char_to_char (CHAR_DATA * list, CHAR_DATA * ch)
{
    CHAR_DATA *rch;

    for (rch = list; rch != NULL; rch = rch->next_in_room)
    {
        if (rch == ch)
            continue;

        if (get_trust (ch) < rch->invis_level)
            continue;

        if (can_see (ch, rch))
        {
            show_char_to_char_0 (rch, ch);
        }
        else if (room_is_dark (ch->in_room)
                 && IS_AFFECTED (rch, AFF_INFRARED))
        {
            send_to_char ("You see glowing red eyes watching YOU!\n\r", ch);
        }
    }

    return;
}



bool check_blind (CHAR_DATA * ch)
{

    if (!IS_NPC (ch) && IS_SET (ch->act, PLR_HOLYLIGHT))
        return TRUE;

    if (IS_AFFECTED (ch, AFF_BLIND))
    {
        send_to_char ("You can't see a thing!\n\r", ch);
        return FALSE;
    }

    return TRUE;
}

/* changes your scroll */
void do_scroll (CHAR_DATA * ch, char *argument)
{
    char arg[MAX_INPUT_LENGTH];
    char buf[100];
    int lines;

    one_argument (argument, arg);

    if (arg[0] == '\0')
    {
        if (ch->lines == 0)
            send_to_char ("You do not page long messages.\n\r", ch);
        else
        {
            sprintf (buf, "You currently display %d lines per page.\n\r",
                     ch->lines + 2);
            send_to_char (buf, ch);
        }
        return;
    }

    if (!is_number (arg))
    {
        send_to_char ("You must provide a number.\n\r", ch);
        return;
    }

    lines = atoi (arg);

    if (lines == 0)
    {
        send_to_char ("Paging disabled.\n\r", ch);
        ch->lines = 0;
        return;
    }

    if (lines < 10 || lines > 100)
    {
        send_to_char ("You must provide a reasonable number.\n\r", ch);
        return;
    }

    sprintf (buf, "Scroll set to %d lines.\n\r", lines);
    send_to_char (buf, ch);
    ch->lines = lines - 2;
}

/* RT does socials */
void do_socials (CHAR_DATA * ch, char *argument)
{
    char buf[MAX_STRING_LENGTH];
    int iSocial;
    int col;

    col = 0;

    for (iSocial = 0; social_table[iSocial].name[0] != '\0'; iSocial++)
    {
        snprintf (buf, sizeof (buf), "%-12.12s", social_table[iSocial].name);
        send_to_char (buf, ch);
        if (++col % 6 == 0)
            send_to_char ("\n\r", ch);
    }

    if (col % 6 != 0)
        send_to_char ("\n\r", ch);
    return;
}



/* RT Commands to replace news, motd, imotd, etc from ROM */

void do_motd (CHAR_DATA * ch, char *argument)
{
    do_function (ch, &do_help, "motd");
}

void do_imotd (CHAR_DATA * ch, char *argument)
{
    do_function (ch, &do_help, "imotd");
}

void do_rules (CHAR_DATA * ch, char *argument)
{
    do_function (ch, &do_help, "rules");
}

void do_story (CHAR_DATA * ch, char *argument)
{
    do_function (ch, &do_help, "story");
}

void do_wizlist (CHAR_DATA * ch, char *argument)
{
    do_function (ch, &do_help, "wizlist");
}

/* RT this following section holds all the auto commands from ROM, as well as
   replacements for config */

void do_autolist (CHAR_DATA * ch, char *argument)
{
    /* lists most player flags */
    if (IS_NPC (ch))
        return;

    send_to_char ("   action     status\n\r", ch);
    send_to_char ("---------------------\n\r", ch);

    send_to_char ("autoassist     ", ch);
    if (IS_SET (ch->act, PLR_AUTOASSIST))
        send_to_char ("{GON{x\n\r", ch);
    else
        send_to_char ("{DOFF{x\n\r", ch);

    send_to_char ("autoexit       ", ch);
    if (IS_SET (ch->act, PLR_AUTOEXIT))
        send_to_char ("{GON{x\n\r", ch);
    else
        send_to_char ("{DOFF{x\n\r", ch);

    send_to_char ("autogold       ", ch);
    if (IS_SET (ch->act, PLR_AUTOGOLD))
        send_to_char ("{GON{x\n\r", ch);
    else
        send_to_char ("{DOFF{x\n\r", ch);

    send_to_char ("autoloot       ", ch);
    if (IS_SET (ch->act, PLR_AUTOLOOT))
        send_to_char ("{GON{x\n\r", ch);
    else
        send_to_char ("{DOFF{x\n\r", ch);

    send_to_char ("autosac        ", ch);
    if (IS_SET (ch->act, PLR_AUTOSAC))
        send_to_char ("{GON{x\n\r", ch);
    else
        send_to_char ("{DOFF{x\n\r", ch);

    send_to_char ("autosplit      ", ch);
    if (IS_SET (ch->act, PLR_AUTOSPLIT))
        send_to_char ("{GON{x\n\r", ch);
    else
        send_to_char ("{DOFF{x\n\r", ch);

    send_to_char ("telnetga       ", ch);
    if (IS_SET (ch->comm, COMM_TELNET_GA))
	    send_to_char ("{GON{x\n\r", ch);
    else
	    send_to_char ("{DOFF{x\n\r",ch);

    send_to_char ("compact mode   ", ch);
    if (IS_SET (ch->comm, COMM_COMPACT))
        send_to_char ("{GON{x\n\r", ch);
    else
        send_to_char ("{DOFF{x\n\r", ch);

    send_to_char ("prompt         ", ch);
    if (IS_SET (ch->comm, COMM_PROMPT))
        send_to_char ("{GON{x\n\r", ch);
    else
        send_to_char ("{DOFF{x\n\r", ch);

    send_to_char ("combine items  ", ch);
    if (IS_SET (ch->comm, COMM_COMBINE))
        send_to_char ("{GON{x\n\r", ch);
    else
        send_to_char ("{DOFF{x\n\r", ch);

    if (!IS_SET (ch->act, PLR_CANLOOT))
        send_to_char ("Your corpse is safe from thieves.\n\r", ch);
    else
        send_to_char ("Your corpse may be looted.\n\r", ch);

    if (IS_SET (ch->act, PLR_NOSUMMON))
        send_to_char ("You cannot be summoned.\n\r", ch);
    else
        send_to_char ("You can be summoned.\n\r", ch);

    if (IS_SET (ch->act, PLR_NOFOLLOW))
        send_to_char ("You do not welcome followers.\n\r", ch);
    else
        send_to_char ("You accept followers.\n\r", ch);
}

void do_autoassist (CHAR_DATA * ch, char *argument)
{
    if (IS_NPC (ch))
        return;

    if (IS_SET (ch->act, PLR_AUTOASSIST))
    {
        send_to_char ("Autoassist removed.\n\r", ch);
        REMOVE_BIT (ch->act, PLR_AUTOASSIST);
    }
    else
    {
        send_to_char ("You will now assist when needed.\n\r", ch);
        SET_BIT (ch->act, PLR_AUTOASSIST);
    }
}

void do_autoexit (CHAR_DATA * ch, char *argument)
{
    if (IS_NPC (ch))
        return;

    if (IS_SET (ch->act, PLR_AUTOEXIT))
    {
        send_to_char ("Exits will no longer be displayed.\n\r", ch);
        REMOVE_BIT (ch->act, PLR_AUTOEXIT);
    }
    else
    {
        send_to_char ("Exits will now be displayed.\n\r", ch);
        SET_BIT (ch->act, PLR_AUTOEXIT);
    }
}

void do_autogold (CHAR_DATA * ch, char *argument)
{
    if (IS_NPC (ch))
        return;

    if (IS_SET (ch->act, PLR_AUTOGOLD))
    {
        send_to_char ("Autogold removed.\n\r", ch);
        REMOVE_BIT (ch->act, PLR_AUTOGOLD);
    }
    else
    {
        send_to_char ("Automatic gold looting set.\n\r", ch);
        SET_BIT (ch->act, PLR_AUTOGOLD);
    }
}

void do_autoloot (CHAR_DATA * ch, char *argument)
{
    char arg[MAX_INPUT_LENGTH];

    if (IS_NPC (ch))
        return;

    one_argument (argument, arg);

    if (arg[0] != '\0')
    {
        if (!str_cmp (arg, "on"))
        {
            if (!IS_SET (ch->act, PLR_AUTOLOOT))
                SET_BIT (ch->act, PLR_AUTOLOOT);
            send_to_char ("{CAutoloot:{x {GON{x {W- automatic corpse looting enabled.{x\n\r", ch);
            return;
        }

        if (!str_cmp (arg, "off"))
        {
            if (IS_SET (ch->act, PLR_AUTOLOOT))
                REMOVE_BIT (ch->act, PLR_AUTOLOOT);
            send_to_char ("{CAutoloot:{x {DOFF{x {W- automatic corpse looting disabled.{x\n\r", ch);
            return;
        }

        if (str_cmp (arg, "toggle"))
        {
            send_to_char ("{CUsage:{x {Wautoloot <on|off|toggle>{x\n\r", ch);
            return;
        }
    }

    if (IS_SET (ch->act, PLR_AUTOLOOT))
    {
        REMOVE_BIT (ch->act, PLR_AUTOLOOT);
        send_to_char ("{CAutoloot:{x {DOFF{x {W- automatic corpse looting disabled.{x\n\r", ch);
    }
    else
    {
        SET_BIT (ch->act, PLR_AUTOLOOT);
        send_to_char ("{CAutoloot:{x {GON{x {W- automatic corpse looting enabled.{x\n\r", ch);
    }
}

void do_autosac (CHAR_DATA * ch, char *argument)
{
    char arg[MAX_INPUT_LENGTH];

    if (IS_NPC (ch))
        return;

    one_argument (argument, arg);

    if (arg[0] != '\0')
    {
        if (!str_cmp (arg, "on"))
        {
            if (!IS_SET (ch->act, PLR_AUTOSAC))
                SET_BIT (ch->act, PLR_AUTOSAC);
            send_to_char ("{CAutosac:{x {GON{x {W- automatic corpse sacrifice enabled.{x\n\r", ch);
            return;
        }

        if (!str_cmp (arg, "off"))
        {
            if (IS_SET (ch->act, PLR_AUTOSAC))
                REMOVE_BIT (ch->act, PLR_AUTOSAC);
            send_to_char ("{CAutosac:{x {DOFF{x {W- automatic corpse sacrifice disabled.{x\n\r", ch);
            return;
        }

        if (str_cmp (arg, "toggle"))
        {
            send_to_char ("{CUsage:{x {Wautosac <on|off|toggle>{x\n\r", ch);
            return;
        }
    }

    if (IS_SET (ch->act, PLR_AUTOSAC))
    {
        REMOVE_BIT (ch->act, PLR_AUTOSAC);
        send_to_char ("{CAutosac:{x {DOFF{x {W- automatic corpse sacrifice disabled.{x\n\r", ch);
    }
    else
    {
        SET_BIT (ch->act, PLR_AUTOSAC);
        send_to_char ("{CAutosac:{x {GON{x {W- automatic corpse sacrifice enabled.{x\n\r", ch);
        if (!IS_SET (ch->act, PLR_AUTOLOOT))
            send_to_char ("{YTip:{x enable {Wautoloot{x so loot is attempted before autosac.{x\n\r", ch);
    }
}

void do_autosplit (CHAR_DATA * ch, char *argument)
{
    if (IS_NPC (ch))
        return;

    if (IS_SET (ch->act, PLR_AUTOSPLIT))
    {
        send_to_char ("Autosplitting removed.\n\r", ch);
        REMOVE_BIT (ch->act, PLR_AUTOSPLIT);
    }
    else
    {
        send_to_char ("Automatic gold splitting set.\n\r", ch);
        SET_BIT (ch->act, PLR_AUTOSPLIT);
    }
}

void do_autoall (CHAR_DATA *ch, char * argument)
{
    if (IS_NPC(ch))
        return;

    if (!strcmp (argument, "on"))
    {
        SET_BIT(ch->act,PLR_AUTOASSIST);
        SET_BIT(ch->act,PLR_AUTOEXIT);
        SET_BIT(ch->act,PLR_AUTOGOLD);
        SET_BIT(ch->act,PLR_AUTOLOOT);
        SET_BIT(ch->act,PLR_AUTOSAC);
        SET_BIT(ch->act,PLR_AUTOSPLIT);

        send_to_char("All autos turned on.\n\r",ch);
    }
    else if (!strcmp (argument, "off"))
    {
        REMOVE_BIT (ch->act, PLR_AUTOASSIST);
        REMOVE_BIT (ch->act, PLR_AUTOEXIT);
        REMOVE_BIT (ch->act, PLR_AUTOGOLD);
        REMOVE_BIT (ch->act, PLR_AUTOLOOT);
        REMOVE_BIT (ch->act, PLR_AUTOSAC);
        REMOVE_BIT (ch->act, PLR_AUTOSPLIT);

        send_to_char("All autos turned off.\n\r", ch);
    }
    else
        send_to_char("Usage: autoall [on|off]\n\r", ch);
}

void do_brief (CHAR_DATA * ch, char *argument)
{
    if (IS_SET (ch->comm, COMM_BRIEF))
    {
        send_to_char ("Full descriptions activated.\n\r", ch);
        REMOVE_BIT (ch->comm, COMM_BRIEF);
    }
    else
    {
        send_to_char ("Short descriptions activated.\n\r", ch);
        SET_BIT (ch->comm, COMM_BRIEF);
    }
}

void do_compact (CHAR_DATA * ch, char *argument)
{
    if (IS_SET (ch->comm, COMM_COMPACT))
    {
        send_to_char ("Compact mode removed.\n\r", ch);
        REMOVE_BIT (ch->comm, COMM_COMPACT);
    }
    else
    {
        send_to_char ("Compact mode set.\n\r", ch);
        SET_BIT (ch->comm, COMM_COMPACT);
    }
}

void do_show (CHAR_DATA * ch, char *argument)
{
    if (IS_SET (ch->comm, COMM_SHOW_AFFECTS))
    {
        send_to_char ("Affects will no longer be shown in score.\n\r", ch);
        REMOVE_BIT (ch->comm, COMM_SHOW_AFFECTS);
    }
    else
    {
        send_to_char ("Affects will now be shown in score.\n\r", ch);
        SET_BIT (ch->comm, COMM_SHOW_AFFECTS);
    }
}

void do_prompt (CHAR_DATA * ch, char *argument)
{
    char buf[MAX_STRING_LENGTH];
    char arg[MAX_INPUT_LENGTH];
    char original[MAX_STRING_LENGTH];
    int exp_to_level;

    strncpy (original, argument, sizeof (original) - 1);
    original[sizeof (original) - 1] = '\0';
    argument = one_argument (argument, arg);

    exp_to_level = IS_NPC (ch) ? 0 :
        (ch->level + 1) * exp_per_level (ch, ch->pcdata->points) - ch->exp;

    if (arg[0] == '\0')
    {
        if (IS_SET (ch->comm, COMM_PROMPT))
        {
            send_to_char ("You will no longer see prompts.\n\r", ch);
            REMOVE_BIT (ch->comm, COMM_PROMPT);
        }
        else
        {
            send_to_char ("You will now see prompts.\n\r", ch);
            SET_BIT (ch->comm, COMM_PROMPT);
        }
        return;
    }

    if (!str_cmp (arg, "all"))
    {
        sprintf (buf,
                 "{M========================================{x\n\r"
                 "{C            CUSTOMIZE YOUR PLAYER PROMPT{x\n\r"
                 "{M========================================{x\n\r\n\r"
                 "{GPick a default prompt by using 'prompt <letter>':{x\n\r"
                 "{G[A]{x {W%d/%dhp %d/%dmv %d/%dm >{x\n\r"
                 "{G[B]{x {W%d/%dh %d/%dmv %d/%dm >{x\n\r"
                 "{G[C]{x {W%dH %dM >{x\n\r"
                 "{G[D]{x {W%dH %dMv %dMa>{x\n\r"
                 "{G[E]{x {W%dH %dMv %dMa >{x\n\r"
                 "{G[F]{x {W%d/%dH %d/%dMv %dMa >{x\n\r"
                 "{G[G]{x {W%dh %dm {YXL:%d{x {W>{x\n\r"
                 "{G[H]{x {W%d/%dH %d/%dMv %dMa {YXL(%d){x {W>{x\n\r"
                 "{G[I]{x {W%dhp %dmv %dma ({Y%d{W) >{x\n\r"
                 "{G[J]{x {WH:%d/%d M:%d/%d {YXL:%d{x {W>{x\n\r"
                 "{G[K]{x {WH:%d M:%d Ma:%d {YXL:%d{x {W>{x\n\r"
                 "{G[L]{x {W%dh %dm ({Y%d{W) >{x\n\r"
                 "{G[M]{x {W%dh %dm ({Y%d{W) >{x\n\r"
                 "{G[N]{x {W%dh %dmv %dma ({Y%d{W) >{x\n\r"
                 "{G[O]{x {WH:%d/%d M:%d/%d {YXL:%d{x {W>{x\n\r"
                 "{G[P]{x {WH:%d/%d M:%d/%d {YXL:%d{x {W>{x\n\r"
                 "{WOr make your own prompt.  (see help prompt).{x\n\r",
                 ch->hit, ch->max_hit, ch->move, ch->max_move, ch->mana,
                 ch->max_mana,
                 ch->hit, ch->max_hit, ch->move, ch->max_move, ch->mana,
                 ch->max_mana,
                 ch->hit, ch->move,
                 ch->hit, ch->move, ch->mana,
                 ch->hit, ch->move, ch->mana,
                 ch->hit, ch->max_hit, ch->move, ch->max_move, ch->mana,
                 ch->hit, ch->move, exp_to_level,
                 ch->hit, ch->max_hit, ch->move, ch->max_move, ch->mana,
                 exp_to_level,
                 ch->hit, ch->move, ch->mana, exp_to_level,
                 ch->hit, ch->max_hit, ch->move, ch->max_move, exp_to_level,
                 ch->hit, ch->move, ch->mana, exp_to_level,
                 ch->hit, ch->move, exp_to_level,
                 ch->hit, ch->move, exp_to_level,
                 ch->hit, ch->move, ch->mana, exp_to_level,
                 ch->hit, ch->max_hit, ch->move, ch->max_move, exp_to_level,
                 ch->hit, ch->max_hit, ch->move, ch->max_move, exp_to_level);
        send_to_char (buf, ch);
        return;
    }

    if (strlen (arg) == 1)
    {
        switch (UPPER (arg[0]))
        {
            case 'A': strcpy (buf, "%h/%Hhp %v/%Vmv %m/%Mm > "); break;
            case 'B': strcpy (buf, "%h/%Hh %v/%Vmv %m/%Mm > "); break;
            case 'C': strcpy (buf, "%hH %vM > "); break;
            case 'D': strcpy (buf, "%hH %vMv %mMa> "); break;
            case 'E': strcpy (buf, "%hH %vMv %mMa > "); break;
            case 'F': strcpy (buf, "%h/%HH %v/%VMv %mMa > "); break;
            case 'G': strcpy (buf, "%hh %vm XL:%X > "); break;
            case 'H': strcpy (buf, "%h/%HH %v/%VMv %mMa XL(%X) > "); break;
            case 'I': strcpy (buf, "%hhp %vmv %mma (%X) > "); break;
            case 'J': strcpy (buf, "H:%h/%H M:%v/%V XL:%X > "); break;
            case 'K': strcpy (buf, "H:%h M:%v Ma:%m XL:%X > "); break;
            case 'L': strcpy (buf, "%hh %vm (%X) > "); break;
            case 'M': strcpy (buf, "%hh %vm (%X) > "); break;
            case 'N': strcpy (buf, "%hh %vmv %mma (%X) > "); break;
            case 'O': strcpy (buf, "H:%h/%H M:%v/%V XL:%X > "); break;
            case 'P': strcpy (buf, "H:%h/%H M:%v/%V XL:%X > "); break;
            default:
                strncpy (buf, original, sizeof (buf) - 1);
                buf[sizeof (buf) - 1] = '\0';
                break;
        }
    }
    else
    {
        strncpy (buf, original, sizeof (buf) - 1);
        buf[sizeof (buf) - 1] = '\0';
    }

    if (strlen (buf) > 50)
        buf[50] = '\0';

    smash_tilde (buf);
    if (str_suffix ("%c", buf))
        strcat (buf, " ");

    if (!str_cmp (arg, "on"))
    {
        send_to_char ("You will now see prompts.\n\r", ch);
        SET_BIT (ch->comm, COMM_PROMPT);
        return;
    }
    if (!str_cmp (arg, "off"))
    {
        send_to_char ("You will no longer see prompts.\n\r", ch);
        REMOVE_BIT (ch->comm, COMM_PROMPT);
        return;
    }

    free_string (ch->prompt);
    ch->prompt = str_dup (buf);
    sprintf (buf, "Prompt set to %s\n\r", ch->prompt);
    send_to_char (buf, ch);
    return;
}

void do_top (CHAR_DATA * ch, char *argument)
{
    DESCRIPTOR_DATA *d;
    CHAR_DATA *wch;
    CHAR_DATA *top_chars[100];
    int count = 0;
    int i;
    int j;
    char buf[MAX_STRING_LENGTH];

    for (d = descriptor_list; d != NULL; d = d->next)
    {
        if (d->connected != CON_PLAYING || d->character == NULL)
            continue;

        wch = (d->original != NULL) ? d->original : d->character;

        if (IS_NPC (wch) || !can_see (ch, wch))
            continue;

        if (count < 100)
            top_chars[count++] = wch;
    }

    for (i = 0; i < count - 1; i++)
    {
        for (j = i + 1; j < count; j++)
        {
            if (top_chars[j]->warpoint > top_chars[i]->warpoint)
            {
                CHAR_DATA *tmp = top_chars[i];
                top_chars[i] = top_chars[j];
                top_chars[j] = tmp;
            }
        }
    }

    send_to_char ("[Top Ten List of PKillers (Good/Evil and Evil/Good)]\n\r\n\r", ch);

    for (i = 0; i < 10; i++)
    {
        if (i < count)
        {
            sprintf (buf,
                     "* #%-2d %-25s (Rank %d) --> %-6d warpoints\n\r",
                     i + 1,
                     top_chars[i]->name,
                     top_chars[i]->profession_rank,
                     top_chars[i]->warpoint);
        }
        else
        {
            sprintf (buf,
                     "* #%-2d %-25s (Rank 0) --> %-6d warpoints\n\r",
                     i + 1,
                     "Free-Slot",
                     0);
        }
        send_to_char (buf, ch);
    }
}

void do_combine (CHAR_DATA * ch, char *argument)
{
    if (IS_SET (ch->comm, COMM_COMBINE))
    {
        send_to_char ("Long inventory selected.\n\r", ch);
        REMOVE_BIT (ch->comm, COMM_COMBINE);
    }
    else
    {
        send_to_char ("Combined inventory selected.\n\r", ch);
        SET_BIT (ch->comm, COMM_COMBINE);
    }
}

void do_noloot (CHAR_DATA * ch, char *argument)
{
    if (IS_NPC (ch))
        return;

    if (IS_SET (ch->act, PLR_CANLOOT))
    {
        send_to_char ("Your corpse is now safe from thieves.\n\r", ch);
        REMOVE_BIT (ch->act, PLR_CANLOOT);
    }
    else
    {
        send_to_char ("Your corpse may now be looted.\n\r", ch);
        SET_BIT (ch->act, PLR_CANLOOT);
    }
}

void do_nofollow (CHAR_DATA * ch, char *argument)
{
    if (IS_NPC (ch))
        return;

    if (IS_SET (ch->act, PLR_NOFOLLOW))
    {
        send_to_char ("You now accept followers.\n\r", ch);
        REMOVE_BIT (ch->act, PLR_NOFOLLOW);
    }
    else
    {
        send_to_char ("You no longer accept followers.\n\r", ch);
        SET_BIT (ch->act, PLR_NOFOLLOW);
        die_follower (ch);
    }
}

void do_nosummon (CHAR_DATA * ch, char *argument)
{
    if (IS_NPC (ch))
    {
        if (IS_SET (ch->imm_flags, IMM_SUMMON))
        {
            send_to_char ("You are no longer immune to summon.\n\r", ch);
            REMOVE_BIT (ch->imm_flags, IMM_SUMMON);
        }
        else
        {
            send_to_char ("You are now immune to summoning.\n\r", ch);
            SET_BIT (ch->imm_flags, IMM_SUMMON);
        }
    }
    else
    {
        if (IS_SET (ch->act, PLR_NOSUMMON))
        {
            send_to_char ("You are no longer immune to summon.\n\r", ch);
            REMOVE_BIT (ch->act, PLR_NOSUMMON);
        }
        else
        {
            send_to_char ("You are now immune to summoning.\n\r", ch);
            SET_BIT (ch->act, PLR_NOSUMMON);
        }
    }
}

void do_look (CHAR_DATA * ch, char *argument)
{
    char buf[MAX_STRING_LENGTH];
    char arg1[MAX_INPUT_LENGTH];
    char arg2[MAX_INPUT_LENGTH];
    char arg3[MAX_INPUT_LENGTH];
    EXIT_DATA *pexit;
    CHAR_DATA *victim;
    OBJ_DATA *obj;
    char *pdesc;
    int door;
    int number, count;

    if (ch->desc == NULL)
        return;

    if (ch->position < POS_SLEEPING)
    {
        send_to_char ("You can't see anything but stars!\n\r", ch);
        return;
    }

    if (ch->position == POS_SLEEPING)
    {
        send_to_char ("You can't see anything, you're sleeping!\n\r", ch);
        return;
    }

    if (!check_blind (ch))
        return;

    if (!IS_NPC (ch)
        && !IS_SET (ch->act, PLR_HOLYLIGHT) && room_is_dark (ch->in_room))
    {
        send_to_char ("It is pitch black ... \n\r", ch);
        show_char_to_char (ch->in_room->people, ch);
        return;
    }

    argument = one_argument (argument, arg1);
    argument = one_argument (argument, arg2);
    number = number_argument (arg1, arg3);
    count = 0;

    if (arg1[0] == '\0' || !str_cmp (arg1, "auto"))
    {
        /* 'look' or 'look auto' */
        send_to_char ("{W", ch);
        send_to_char (ch->in_room->name, ch);
        send_to_char ("{x", ch);

        if ((IS_IMMORTAL (ch)
             && (IS_NPC (ch) || IS_SET (ch->act, PLR_HOLYLIGHT)))
            || IS_BUILDER (ch, ch->in_room->area))
        {
            sprintf (buf, " {C[{BRoom %d{C]{x", ch->in_room->vnum);
            send_to_char (buf, ch);
        }

        send_to_char ("\n\r", ch);

        if (arg1[0] == '\0'
            || (!IS_NPC (ch) && !IS_SET (ch->comm, COMM_BRIEF)))
        {
            send_to_char ("  ", ch);
            send_to_char ("{D", ch);
            send_to_char (ch->in_room->description, ch);
            send_to_char ("{x", ch);
        }

        send_to_char ("\n\r", ch);
        do_function (ch, &do_exits, "auto");

        show_char_to_char (ch->in_room->people, ch);
        show_list_to_char (ch->in_room->contents, ch, FALSE, FALSE);
        return;
    }

    if (!str_cmp (arg1, "i") || !str_cmp (arg1, "in")
        || !str_cmp (arg1, "on"))
    {
        /* 'look in' */
        if (arg2[0] == '\0')
        {
            send_to_char ("Look in what?\n\r", ch);
            return;
        }

        if ((obj = get_obj_here (ch, arg2)) == NULL)
        {
            send_to_char ("You do not see that here.\n\r", ch);
            return;
        }

        switch (obj->item_type)
        {
            default:
                send_to_char ("That is not a container.\n\r", ch);
                break;

            case ITEM_DRINK_CON:
                if (obj->value[1] <= 0)
                {
                    send_to_char ("It is empty.\n\r", ch);
                    break;
                }

                sprintf (buf, "It's %sfilled with  a %s liquid.\n\r",
                         obj->value[1] < obj->value[0] / 4
                         ? "less than half-" :
                         obj->value[1] < 3 * obj->value[0] / 4
                         ? "about half-" : "more than half-",
                         liq_table[obj->value[2]].liq_color);

                send_to_char (buf, ch);
                break;

            case ITEM_CONTAINER:
            case ITEM_CORPSE_NPC:
            case ITEM_CORPSE_PC:
                if (IS_SET (obj->value[1], CONT_CLOSED))
                {
                    send_to_char ("It is closed.\n\r", ch);
                    break;
                }

                act ("$p holds:", ch, obj, NULL, TO_CHAR);
                show_list_to_char (obj->contains, ch, TRUE, TRUE);
                break;
        }
        return;
    }

    if ((victim = get_char_room (ch, arg1)) != NULL)
    {
        show_char_to_char_1 (victim, ch);
        return;
    }

    for (obj = ch->carrying; obj != NULL; obj = obj->next_content)
    {
        if (can_see_obj (ch, obj))
        {                        /* player can see object */
            pdesc = get_extra_descr (arg3, obj->extra_descr);
            if (pdesc != NULL)
            {
                if (++count == number)
                {
                    send_to_char (pdesc, ch);
                    return;
                }
                else
                    continue;
            }

            pdesc = get_extra_descr (arg3, obj->pIndexData->extra_descr);
            if (pdesc != NULL)
            {
                if (++count == number)
                {
                    send_to_char (pdesc, ch);
                    return;
                }
                else
                    continue;
            }

            if (is_name (arg3, obj->name))
                if (++count == number)
                {
                    send_to_char (obj->description, ch);
                    send_to_char ("\n\r", ch);
                    return;
                }
        }
    }

    for (obj = ch->in_room->contents; obj != NULL; obj = obj->next_content)
    {
        if (can_see_obj (ch, obj))
        {
            pdesc = get_extra_descr (arg3, obj->extra_descr);
            if (pdesc != NULL)
                if (++count == number)
                {
                    send_to_char (pdesc, ch);
                    return;
                }

            pdesc = get_extra_descr (arg3, obj->pIndexData->extra_descr);
            if (pdesc != NULL)
                if (++count == number)
                {
                    send_to_char (pdesc, ch);
                    return;
                }

            if (is_name (arg3, obj->name))
                if (++count == number)
                {
                    send_to_char (obj->description, ch);
                    send_to_char ("\n\r", ch);
                    return;
                }
        }
    }

    pdesc = get_extra_descr (arg3, ch->in_room->extra_descr);
    if (pdesc != NULL)
    {
        if (++count == number)
        {
            send_to_char (pdesc, ch);
            return;
        }
    }

    if (count > 0 && count != number)
    {
        if (count == 1)
            sprintf (buf, "You only see one %s here.\n\r", arg3);
        else
            sprintf (buf, "You only see %d of those here.\n\r", count);

        send_to_char (buf, ch);
        return;
    }

    if (!str_cmp (arg1, "n") || !str_cmp (arg1, "north"))
        door = 0;
    else if (!str_cmp (arg1, "e") || !str_cmp (arg1, "east"))
        door = 1;
    else if (!str_cmp (arg1, "s") || !str_cmp (arg1, "south"))
        door = 2;
    else if (!str_cmp (arg1, "w") || !str_cmp (arg1, "west"))
        door = 3;
    else if (!str_cmp (arg1, "u") || !str_cmp (arg1, "up"))
        door = 4;
    else if (!str_cmp (arg1, "d") || !str_cmp (arg1, "down"))
        door = 5;
    else
    {
        send_to_char ("You do not see that here.\n\r", ch);
        return;
    }

    /* 'look direction' */
    if ((pexit = ch->in_room->exit[door]) == NULL)
    {
        send_to_char ("Nothing special there.\n\r", ch);
        return;
    }

    if (pexit->description != NULL && pexit->description[0] != '\0')
        send_to_char (pexit->description, ch);
    else
        send_to_char ("Nothing special there.\n\r", ch);

    if (pexit->keyword != NULL
        && pexit->keyword[0] != '\0' && pexit->keyword[0] != ' ')
    {
        if (IS_SET (pexit->exit_info, EX_CLOSED))
        {
            act ("The $d is closed.", ch, NULL, pexit->keyword, TO_CHAR);
        }
        else if (IS_SET (pexit->exit_info, EX_ISDOOR))
        {
            act ("The $d is open.", ch, NULL, pexit->keyword, TO_CHAR);
        }
    }

    return;
}

/* RT added back for the hell of it */
void do_read (CHAR_DATA * ch, char *argument)
{
    do_function (ch, &do_look, argument);
}

void do_examine (CHAR_DATA * ch, char *argument)
{
    char buf[MAX_STRING_LENGTH];
    char arg[MAX_INPUT_LENGTH];
    OBJ_DATA *obj;

    one_argument (argument, arg);

    if (arg[0] == '\0')
    {
        send_to_char ("Examine what?\n\r", ch);
        return;
    }

    do_function (ch, &do_look, arg);

    if ((obj = get_obj_here (ch, arg)) != NULL)
    {
        switch (obj->item_type)
        {
            default:
                break;

            case ITEM_JUKEBOX:
                do_function (ch, &do_play, "list");
                break;

            case ITEM_MONEY:
                if (obj->value[0] == 0)
                {
                    if (obj->value[1] == 0)
                        sprintf (buf,
                                 "Odd...there's no coins in the pile.\n\r");
                    else if (obj->value[1] == 1)
                        sprintf (buf, "Wow. One gold coin.\n\r");
                    else
                        sprintf (buf,
                                 "There are %d gold coins in the pile.\n\r",
                                 obj->value[1]);
                }
                else if (obj->value[1] == 0)
                {
                    if (obj->value[0] == 1)
                        sprintf (buf, "Wow. One silver coin.\n\r");
                    else
                        sprintf (buf,
                                 "There are %d silver coins in the pile.\n\r",
                                 obj->value[0]);
                }
                else
                    sprintf (buf,
                             "There are %d gold and %d silver coins in the pile.\n\r",
                             obj->value[1], obj->value[0]);
                send_to_char (buf, ch);
                break;

            case ITEM_DRINK_CON:
            case ITEM_CONTAINER:
            case ITEM_CORPSE_NPC:
            case ITEM_CORPSE_PC:
                sprintf (buf, "in %s", argument);
                do_function (ch, &do_look, buf);
        }
    }

    return;
}



/*
 * Thanks to Zrin for auto-exit part.
 */
void do_exits (CHAR_DATA * ch, char *argument)
{
    extern char *const dir_name[];
    char buf[MAX_STRING_LENGTH];
    EXIT_DATA *pexit;
    bool found;
    bool fAuto;
    int door;

    fAuto = !str_cmp (argument, "auto");

    if (!check_blind (ch))
        return;

    if (fAuto)
        sprintf (buf, "{B[Exits:");
    else if (IS_IMMORTAL (ch))
        sprintf (buf, "Obvious exits from room %d:\n\r", ch->in_room->vnum);
    else
        sprintf (buf, "Obvious exits:\n\r");

    found = FALSE;
    for (door = 0; door <= 5; door++)
    {
        if ((pexit = ch->in_room->exit[door]) != NULL
            && pexit->u1.to_room != NULL
            && can_see_room (ch, pexit->u1.to_room))
        {
            found = TRUE;
            if (fAuto)
            {
                strcat (buf, " ");
                if (IS_SET (pexit->exit_info, EX_CLOSED))
                    strcat (buf, "[");
                strcat (buf, dir_name[door]);
                if (IS_SET (pexit->exit_info, EX_CLOSED))
                    strcat (buf, "]");
            }
            else
            {
                if (IS_SET (pexit->exit_info, EX_CLOSED))
                    continue;
                sprintf (buf + strlen (buf), "%-5s - %s",
                         capitalize (dir_name[door]),
                         room_is_dark (pexit->u1.to_room)
                         ? "Too dark to tell" : pexit->u1.to_room->name);
                if (IS_IMMORTAL (ch))
                    sprintf (buf + strlen (buf),
                             " (room %d)\n\r", pexit->u1.to_room->vnum);
                else
                    sprintf (buf + strlen (buf), "\n\r");
            }
        }
    }

    if (!found)
        strcat (buf, fAuto ? " none" : "{DNone.{x\n\r");

    if (fAuto)
        strcat (buf, "]{x\n\r");

    send_to_char (buf, ch);
    return;
}

void do_worth (CHAR_DATA * ch, char *argument)
{
    char buf[MAX_STRING_LENGTH];

    if (IS_NPC (ch))
    {
           sprintf (buf, "{WYou have{x {Y%ld gold{x {Wand{x {Y%ld silver{x.\n\r",
                 ch->gold, ch->silver);
        send_to_char (buf, ch);
        return;
    }

    sprintf (buf, "{WYou have{x {Y%ld gold{x {Wand{x {Y%ld silver{x.\n\r",
             ch->gold, ch->silver);
    send_to_char (buf, ch);
    sprintf (buf, "{WYou have{x {C%d experience{x.\n\r", ch->exp);
    send_to_char (buf, ch);
    sprintf (buf, "{WYou need{x {G%d more experience{x {Wto advance{x.\n\r",
             (ch->level + 1) * exp_per_level (ch, ch->pcdata->points) - ch->exp);
    send_to_char (buf, ch);

    return;
}

void do_warpoint (CHAR_DATA * ch, char *argument)
{
    char buf[MAX_STRING_LENGTH];
    const char *rank_name;
    int next_threshold;
    int season_bonus;
    int event_bonus;
    int world_damage_bonus;
    int world_mana_scale;
    int world_xp_bonus;

    if (IS_NPC (ch))
    {
        send_to_char ("Mobs do not have warpoint progression.\n\r", ch);
        return;
    }

    if (ch->warpoint < 100)
    {
        rank_name = "Novice";
        next_threshold = 100;
    }
    else if (ch->warpoint < 500)
    {
        rank_name = "Adept";
        next_threshold = 500;
    }
    else if (ch->warpoint < 1000)
    {
        rank_name = "Veteran";
        next_threshold = 1000;
    }
    else if (ch->warpoint < 2500)
    {
        rank_name = "Champion";
        next_threshold = 2500;
    }
    else
    {
        rank_name = "Legend";
        next_threshold = -1;
    }

    sprintf (buf, "{C=== {WWarpoint Status{C ==={x\n\r");
    send_to_char (buf, ch);

    sprintf (buf, "{GWarpoints:{x %d\n\r", ch->warpoint);
    send_to_char (buf, ch);

    sprintf (buf, "{GRank:{x %s\n\r", rank_name);
    send_to_char (buf, ch);

    season_bonus = warpoint_season_bonus_percent ();
    event_bonus = warpoint_event_bonus_percent ();

    sprintf (buf, "{GSeason:{x %s ({Y+%d%%{x warpoint gain)\n\r",
             warpoint_season_name (), season_bonus);
    send_to_char (buf, ch);

    sprintf (buf, "{GEvent:{x %s ({Y+%d%%{x warpoint gain)\n\r",
             warpoint_event_name (), event_bonus);
    send_to_char (buf, ch);

    world_damage_bonus = rop_world_event_damage_percent ();
    world_mana_scale = rop_world_event_mana_scale_percent ();
    world_xp_bonus = rop_world_event_xp_percent ();

    sprintf (buf, "{GWorld Event:{x %s\n\r", rop_world_event_name ());
    send_to_char (buf, ch);

    sprintf (buf,
             "{GWorld Effects:{x damage %+d%%, mana cost %d%%, xp %+d%%\n\r",
             world_damage_bonus,
             world_mana_scale,
             world_xp_bonus);
    send_to_char (buf, ch);

    if (next_threshold > 0)
    {
        sprintf (buf, "{GTo next rank:{x %d\n\r",
                 UMAX (0, next_threshold - ch->warpoint));
        send_to_char (buf, ch);
    }
    else
    {
        send_to_char ("{GYou are at the highest rank tier.{x\n\r", ch);
    }
}

void do_rank (CHAR_DATA * ch, char *argument)
{
    do_warpoint (ch, argument);
}

void do_sect (CHAR_DATA * ch, char *argument)
{
    char arg[MAX_INPUT_LENGTH];
    char target_name[MAX_INPUT_LENGTH];
    char buf[MAX_STRING_LENGTH];
    int sect;

    if (IS_NPC (ch))
    {
        send_to_char ("Mobs are not part of player sects.\n\r", ch);
        return;
    }

    argument = one_argument (argument, arg);

    if (arg[0] == '\0')
    {
        if (ch->sect_number < 0 || ch->sect_number >= MAX_SECT)
        {
            send_to_char ("You are not currently assigned to a sect.\n\r", ch);
            return;
        }

        sprintf (buf, "{C=== {WSect Status{C ==={x\n\r");
        send_to_char (buf, ch);
        sprintf (buf, "{GSect:{x %s ({W%s{x)\n\r",
                 sect_table[ch->sect_number].name,
                 sect_table[ch->sect_number].who_name);
        send_to_char (buf, ch);

        sprintf (buf, "{GAlignment Lock:{x %d\n\r", ch->alignment);
        send_to_char (buf, ch);

        sprintf (buf, "{GHall VNUM:{x %d\n\r",
                 sect_table[ch->sect_number].hall_vnum);
        send_to_char (buf, ch);

        sprintf (buf, "{GPath:{x %s\n\r", sect_table[ch->sect_number].description);
        send_to_char (buf, ch);

        sprintf (buf, "{GPassive:{x %s\n\r",
             sect_passive_summary (ch->sect_number));
        send_to_char (buf, ch);

           sprintf (buf, "{GActive:{x %s ({Ymana %d{x)\n\r",
                  sect_active_name (ch->sect_number),
                  sect_active_mana_cost (ch->sect_number));
           send_to_char (buf, ch);

           sprintf (buf, "{GInvoke:{x %s\n\r",
                  sect_active_summary (ch->sect_number));
           send_to_char (buf, ch);
        return;
    }

    if (!str_cmp (arg, "list"))
    {
        send_to_char ("{C=== {WSect List{C ==={x\n\r", ch);
        for (sect = 0; sect < MAX_SECT; sect++)
        {
            sprintf (buf, "{Y%2d{x) %-12s  %-4s  align:%2d  hall:%d\n\r",
                     sect + 1,
                     sect_table[sect].name,
                     sect_table[sect].who_name,
                     sect_table[sect].alignment,
                     sect_table[sect].hall_vnum);
            send_to_char (buf, ch);
        }
        return;
    }

    if (!str_cmp (arg, "info"))
    {
        argument = one_argument (argument, arg);
        if (arg[0] == '\0')
        {
            send_to_char ("Syntax: sect info <name|number>\n\r", ch);
            return;
        }

        if (is_number (arg))
        {
            sect = atoi (arg) - 1;
            if (sect < 0 || sect >= MAX_SECT)
            {
                send_to_char ("That is not a valid sect number.\n\r", ch);
                return;
            }
        }
        else
        {
            for (sect = 0; sect < MAX_SECT; sect++)
            {
                if (!str_prefix (arg, sect_table[sect].name))
                    break;
            }

            if (sect >= MAX_SECT)
            {
                send_to_char ("No sect found by that name.\n\r", ch);
                return;
            }
        }

        sprintf (buf, "{C=== {WSect Info{C ==={x\n\r");
        send_to_char (buf, ch);
        sprintf (buf, "{GSect:{x %s ({W%s{x)\n\r",
                 sect_table[sect].name,
                 sect_table[sect].who_name);
        send_to_char (buf, ch);
        sprintf (buf, "{GAvatar:{x %s\n\r", sect_table[sect].avatar_string);
        send_to_char (buf, ch);
        sprintf (buf, "{GAlignment:{x %d\n\r", sect_table[sect].alignment);
        send_to_char (buf, ch);
        sprintf (buf, "{GHall VNUM:{x %d\n\r", sect_table[sect].hall_vnum);
        send_to_char (buf, ch);
        sprintf (buf, "{GPath:{x %s\n\r", sect_table[sect].description);
        send_to_char (buf, ch);
        sprintf (buf, "{GPassive:{x %s\n\r", sect_passive_summary (sect));
        send_to_char (buf, ch);
        sprintf (buf, "{GActive:{x %s ({Ymana %d{x)\n\r",
                 sect_active_name (sect), sect_active_mana_cost (sect));
        send_to_char (buf, ch);
        sprintf (buf, "{GInvoke:{x %s\n\r", sect_active_summary (sect));
        send_to_char (buf, ch);
        return;
    }

    if (!str_cmp (arg, "active") || !str_cmp (arg, "invoke"))
    {
        CHAR_DATA *victim;
        AFFECT_DATA af;
        int cost;

        if (ch->sect_number < 0 || ch->sect_number >= MAX_SECT)
        {
            send_to_char ("You are not currently assigned to a sect.\n\r", ch);
            return;
        }

        argument = one_argument (argument, target_name);
        cost = sect_active_mana_cost (ch->sect_number);

        if (!str_cmp (arg, "active") && target_name[0] == '\0')
        {
            sprintf (buf, "{G%s{x ({Ymana %d{x): %s\n\r",
                     sect_active_name (ch->sect_number),
                     cost,
                     sect_active_summary (ch->sect_number));
            send_to_char (buf, ch);
            send_to_char ("Usage: sect invoke [target]\n\r", ch);
            return;
        }

        if (ch->mana < cost)
        {
            send_to_char ("You lack the mana to invoke your sect power.\n\r", ch);
            return;
        }

        WAIT_STATE (ch, 2 * PULSE_VIOLENCE);
        ch->mana -= cost;

        switch (ch->sect_number)
        {
            default:
                send_to_char ("Your sect has no active invocation.\n\r", ch);
                break;

            case 0:            /* Aethelhelm */
            {
                int sn = skill_lookup ("sanctuary");
                if (sn > 0)
                    affect_strip (ch, sn);
                af.where = TO_AFFECTS;
                af.type = sn > 0 ? sn : 0;
                af.level = ch->level;
                af.duration = UMAX (2, ch->level / 15);
                af.location = APPLY_NONE;
                af.modifier = 0;
                af.bitvector = AFF_SANCTUARY;
                affect_to_char (ch, &af);
                send_to_char ("A radiant aegis surrounds you.\n\r", ch);
                act ("$n is wrapped in a radiant aegis.", ch, NULL, NULL, TO_ROOM);
                break;
            }

            case 1:            /* Kiri */
            {
                int heal;
                victim = target_name[0] == '\0' ? ch : get_char_room (ch, target_name);
                if (victim == NULL)
                {
                    send_to_char ("They are not here.\n\r", ch);
                    ch->mana += cost;
                    return;
                }
                heal = dice (4, 20) + ch->level * 2;
                victim->hit = UMIN (victim->max_hit, victim->hit + heal);
                update_pos (victim);
                if (victim == ch)
                    send_to_char ("Sacred grace restores your wounds.\n\r", ch);
                else
                {
                    act ("You invoke sacred grace upon $N.", ch, NULL, victim, TO_CHAR);
                    act ("$n invokes sacred grace upon you.", ch, NULL, victim, TO_VICT);
                    act ("$n invokes sacred grace upon $N.", ch, NULL, victim, TO_NOTVICT);
                }
                break;
            }

            case 2:            /* Baalzom */
            {
                int hp_cost;
                int mana_gain;
                hp_cost = UMAX (20, ch->max_hit / 12);
                if (ch->hit <= hp_cost + 5)
                {
                    send_to_char ("You are too weak to transmute life into mana.\n\r", ch);
                    ch->mana += cost;
                    return;
                }
                mana_gain = UMAX (25, ch->level + number_range (20, 40));
                ch->hit -= hp_cost;
                ch->mana = UMIN (ch->max_mana, ch->mana + mana_gain);
                send_to_char ("You transmute vitality into arcane focus.\n\r", ch);
                break;
            }

            case 3:            /* Ishta */
            {
                int heal;
                victim = target_name[0] == '\0' ? ch : get_char_room (ch, target_name);
                if (victim == NULL)
                {
                    send_to_char ("They are not here.\n\r", ch);
                    ch->mana += cost;
                    return;
                }
                heal = dice (3, 16) + ch->level;
                victim->hit = UMIN (victim->max_hit, victim->hit + heal);
                victim->move = UMIN (victim->max_move, victim->move + heal / 2);
                update_pos (victim);
                if (victim == ch)
                    send_to_char ("Vital renewal flows through your body.\n\r", ch);
                else
                {
                    act ("You call a renewal bloom upon $N.", ch, NULL, victim, TO_CHAR);
                    act ("$n calls a renewal bloom upon you.", ch, NULL, victim, TO_VICT);
                }
                break;
            }

            case 4:            /* Zod */
            {
                int sn = skill_lookup ("weaken");
                int dam;
                victim = get_char_room (ch, target_name);
                if (victim == NULL)
                {
                    send_to_char ("Invoke Tyrant's Brand on whom?\n\r", ch);
                    ch->mana += cost;
                    return;
                }
                if (victim == ch)
                {
                    send_to_char ("You cannot brand yourself.\n\r", ch);
                    ch->mana += cost;
                    return;
                }
                if (is_safe (ch, victim))
                {
                    ch->mana += cost;
                    return;
                }
                dam = dice (5, 14) + ch->level;
                damage (ch, victim, dam, sn > 0 ? sn : TYPE_HIT, DAM_NEGATIVE, TRUE);
                af.where = TO_AFFECTS;
                af.type = sn > 0 ? sn : 0;
                af.level = ch->level;
                af.duration = 2;
                af.location = APPLY_STR;
                af.modifier = -2;
                af.bitvector = AFF_WEAKEN;
                affect_join (victim, &af);
                act ("$N reels under your tyrant's brand.", ch, NULL, victim, TO_CHAR);
                break;
            }

            case 5:            /* Jalaal */
            {
                int sn = skill_lookup ("haste");
                if (sn > 0)
                    affect_strip (ch, sn);
                af.where = TO_AFFECTS;
                af.type = sn > 0 ? sn : 0;
                af.level = ch->level;
                af.duration = UMAX (2, ch->level / 20);
                af.location = APPLY_DEX;
                af.modifier = 2;
                af.bitvector = AFF_HASTE;
                affect_to_char (ch, &af);
                send_to_char ("A shadow clone blurs your movements.\n\r", ch);
                act ("$n blurs into shadowed afterimages.", ch, NULL, NULL, TO_ROOM);
                break;
            }

            case 6:            /* Xix */
            {
                int sn = skill_lookup ("frost breath");
                int dam;
                victim = get_char_room (ch, target_name);
                if (victim == NULL)
                {
                    send_to_char ("Invoke Frost Nova on whom?\n\r", ch);
                    ch->mana += cost;
                    return;
                }
                if (victim == ch)
                {
                    send_to_char ("You cannot frost nova yourself.\n\r", ch);
                    ch->mana += cost;
                    return;
                }
                if (is_safe (ch, victim))
                {
                    ch->mana += cost;
                    return;
                }
                dam = dice (6, 12) + ch->level;
                damage (ch, victim, dam, sn > 0 ? sn : TYPE_HIT, DAM_COLD, TRUE);
                WAIT_STATE (victim, PULSE_VIOLENCE);
                act ("Your frost nova staggers $N.", ch, NULL, victim, TO_CHAR);
                break;
            }

            case 7:            /* Talice */
            {
                int sn = skill_lookup ("invis");
                if (sn > 0)
                    affect_strip (ch, sn);
                af.where = TO_AFFECTS;
                af.type = sn > 0 ? sn : 0;
                af.level = ch->level;
                af.duration = UMAX (2, ch->level / 20);
                af.location = APPLY_DEX;
                af.modifier = 1;
                af.bitvector = AFF_INVISIBLE;
                affect_to_char (ch, &af);
                send_to_char ("You step through a storm veil and vanish.\n\r", ch);
                act ("$n vanishes behind a crackling veil.", ch, NULL, NULL, TO_ROOM);
                break;
            }
        }
        return;
    }

    send_to_char ("Syntax: sect\n\r", ch);
    send_to_char ("        sect list\n\r", ch);
    send_to_char ("        sect info <name|number>\n\r", ch);
    send_to_char ("        sect active\n\r", ch);
    send_to_char ("        sect invoke [target]\n\r", ch);
}

void do_remort (CHAR_DATA * ch, char *argument)
{
    char buf[MAX_STRING_LENGTH];

    if (IS_NPC (ch))
    {
        send_to_char ("Mobs cannot remort.\n\r", ch);
        return;
    }

    if (ch->level < MIN_REMORT_LEVEL)
    {
        sprintf (buf,
                 "You must reach level %d before remorting.\n\r",
                 MIN_REMORT_LEVEL);
        send_to_char (buf, ch);
        return;
    }

    if (ch->remort_count >= MAX_REMORTS)
    {
        sprintf (buf,
                 "You have reached the remort cap of %d.\n\r",
                 MAX_REMORTS);
        send_to_char (buf, ch);
        return;
    }

    ch->remort_count++;
    ch->profession_rank++;
    ch->remort_benefits_applied = TRUE;

    ch->remort_hp_bonus += 5;
    ch->remort_move_bonus += 5;
    ch->remort_skill_slots += 2;

    if (ch->remort_count >= 2)
        ch->remort_no_food = TRUE;

    if (ch->remort_count >= 3)
        ch->remort_no_drink = TRUE;

    ch->max_hit += 5;
    ch->max_move += 5;

    ch->level = 1;
    ch->exp = exp_per_level (ch, ch->pcdata->points);
    ch->hit = ch->max_hit;
    ch->move = ch->max_move;
    ch->mana = ch->max_mana;

    save_char_obj (ch);

    sprintf (buf,
             "You have remorted! Count: %d/%d, Profession Rank: %d.\n\r"
             "Bonuses: +%d max hp, +%d max move, +%d skill adept cap.\n\r",
             ch->remort_count, MAX_REMORTS, ch->profession_rank,
             ch->remort_hp_bonus, ch->remort_move_bonus,
             ch->remort_skill_slots);
    send_to_char (buf, ch);
}


void do_score (CHAR_DATA * ch, char *argument)
{
    char buf[MAX_STRING_LENGTH];
    const char *class_name;
    int exp_to_level;
    const char *rank_name = "Novice";
    class_name = IS_NPC (ch) ? "mobile" :
        (get_profession (ch) != NULL ? get_profession (ch)->name : class_table[ch->class].name);
    exp_to_level = IS_NPC (ch) ? 0 :
        ((ch->level + 1) * exp_per_level (ch, ch->pcdata->points) - ch->exp);

    if (!IS_NPC (ch))
    {
        if (ch->warpoint < 100)
        {
            rank_name = "Novice";
        }
        else if (ch->warpoint < 500)
        {
            rank_name = "Adept";
        }
        else if (ch->warpoint < 1000)
        {
            rank_name = "Veteran";
        }
        else if (ch->warpoint < 2500)
        {
            rank_name = "Champion";
        }
        else
        {
            rank_name = "Legend";
        }
    }

    send_to_char ("{W[+]-=-=-=-=-=-=-=-=-=-=-=-=-=-=-=-=-=-=-=-=-=-=-=-=-=-=-=-=-=-=-=-=-=-=-=-[+]{x\n\r", ch);
    send_to_char ("{W                           --- Rites of Passage ---{x\n\r", ch);
    send_to_char ("{W[+]-=-=-=-=-=-=-=-=-=-=-=-=-=-=-=-=-=-=-=-=-=-=-=-=-=-=-=-=-=-=-=-=-=-=-=-[+]{x\n\r", ch);

    sprintf (buf,
             "    {DThou art{x {R%s{x {Dthe{x {R%s{x {Y%s{D.{x\n\r",
             ch->name,
             race_table[ch->race].name,
             class_name);
    send_to_char (buf, ch);

    sprintf (buf,
             "    {DYour deeds rank you as{x {Y%s{x {Damongst your{x {R%s{D ancestors.{x\n\r\n\r",
             rank_name,
             race_table[ch->race].name);
    send_to_char (buf, ch);

    sprintf (buf,
             "   {DYou are{x {W%d{x {Dyears of age ({x{W%d Hours{D) and level{x {W%d{D.{x\n\r",
             get_age (ch),
             (ch->played + (int) (current_time - ch->logon)) / 3600,
             ch->level);
    send_to_char (buf, ch);

    sprintf (buf,
             "   {DYou have gained{x {W%d{x {Dexperience and need{x {W%d{D more to level.{x\n\r\n\r",
             ch->exp,
             UMAX (0, exp_to_level));
    send_to_char (buf, ch);

    sprintf (buf,
             "   {DYou have{x {W%d{x {Dpractices to improve your skills and spells.{x\n\r\n\r",
             ch->practice);
    send_to_char (buf, ch);

    sprintf (buf,
             "   {DHealth :{x {B%d{x  {D/{x {B%d{x        {DAttack Power Bonus:{x {W%d{x       {DWar Points:{x {W%d{x\n\r",
             ch->hit, ch->max_hit, GET_DAMROLL (ch), ch->warpoint);
    send_to_char (buf, ch);

    sprintf (buf,
             "   {DStamina:{x {G%d{x  {D/{x {G%d{x        {DOffensive Bonus   :{x {W%d{x       {DWimpy      :{x {W%d{x\n\r",
             ch->move, ch->max_move, GET_HITROLL (ch), ch->wimpy);
    send_to_char (buf, ch);

    sprintf (buf,
             "   {DMana   :{x {M%d{x  {D/{x {M%d{x        {DEvasion Bonus     :{x {W%d{x       {DRemorts    :{x {W%d{x\n\r",
             ch->mana, ch->max_mana, UMAX (0, 100 - GET_AC (ch, AC_EXOTIC)), ch->remort_count);
    send_to_char (buf, ch);

    sprintf (buf,
             "   {DYou are carrying{x {W%ld{D gold{x {Dand{x {W%ld{D silver.{x\n\r",
             ch->gold, ch->silver);
    send_to_char (buf, ch);

    sprintf (buf,
             "   {DYou are carrying{x {W%ld{D kg(s) of weight.{x\n\r",
             get_carry_weight (ch) / 10);
    send_to_char (buf, ch);

    send_to_char ("{W[+]-=-=-=-=-=-=-=-=-=-=-=-=-=-=-=-=-=-=-=-=-=-=-=-=-=-=-=-=-=-=-=-=-=-=-=-[+]{x\n\r", ch);

    if (!IS_NPC (ch) && ch->pcdata->condition[COND_DRUNK] > 10)
        send_to_char ("{RYou are drunk.{x\n\r", ch);
    if (!IS_NPC (ch) && ch->pcdata->condition[COND_THIRST] == 0)
        send_to_char ("{RYou are thirsty.{x\n\r", ch);
    if (!IS_NPC (ch) && ch->pcdata->condition[COND_HUNGER] == 0)
        send_to_char ("{RYou are hungry.{x\n\r", ch);

    switch (ch->position)
    {
        case POS_DEAD:
            send_to_char ("{RYou are DEAD!!{x\n\r", ch);
            break;
        case POS_MORTAL:
            send_to_char ("{RYou are mortally wounded.{x\n\r", ch);
            break;
        case POS_INCAP:
            send_to_char ("{RYou are incapacitated.{x\n\r", ch);
            break;
        case POS_STUNNED:
            send_to_char ("{RYou are stunned.{x\n\r", ch);
            break;
        case POS_SLEEPING:
            send_to_char ("{GYou are sleeping.{x\n\r", ch);
            break;
        case POS_RESTING:
            send_to_char ("{GYou are resting.{x\n\r", ch);
            break;
        case POS_SITTING:
            send_to_char ("{GYou are sitting.{x\n\r", ch);
            break;
        case POS_STANDING:
            send_to_char ("{GYou are standing.{x\n\r", ch);
            break;
        case POS_FIGHTING:
            send_to_char ("{RYou are fighting.{x\n\r", ch);
            break;
    }

    if (IS_SET (ch->comm, COMM_SHOW_AFFECTS))
        do_function (ch, &do_affects, "");
}

void do_affects (CHAR_DATA * ch, char *argument)
{
    AFFECT_DATA *paf, *paf_last = NULL;
    char buf[MAX_STRING_LENGTH];

    if (ch->affected != NULL)
    {
        send_to_char ("You are affected by the following spells:\n\r", ch);
        for (paf = ch->affected; paf != NULL; paf = paf->next)
        {
            if (paf_last != NULL && paf->type == paf_last->type)
                if (ch->level >= 20)
                    sprintf (buf, "                      ");
                else
                    continue;
            else
                sprintf (buf, "Spell: %-15s", skill_table[paf->type].name);

            send_to_char (buf, ch);

            if (ch->level >= 20)
            {
                sprintf (buf,
                         ": modifies %s by %d ",
                         affect_loc_name (paf->location), paf->modifier);
                send_to_char (buf, ch);
                if (paf->duration == -1)
                    sprintf (buf, "permanently");
                else
                    sprintf (buf, "for %d hours", paf->duration);
                send_to_char (buf, ch);
            }

            send_to_char ("\n\r", ch);
            paf_last = paf;
        }
    }
    else
        send_to_char ("You are not affected by any spells.\n\r", ch);

    return;
}



char *const day_name[] = {
    "the Moon", "the Bull", "Deception", "Thunder", "Freedom",
    "the Great Gods", "the Sun"
};

char *const month_name[] = {
    "Winter", "the Winter Wolf", "the Frost Giant", "the Old Forces",
    "the Grand Struggle", "the Spring", "Nature", "Futility", "the Dragon",
    "the Sun", "the Heat", "the Battle", "the Dark Shades", "the Shadows",
    "the Long Shadows", "the Ancient Darkness", "the Great Evil"
};

void do_time (CHAR_DATA * ch, char *argument)
{
    extern char str_boot_time[];
    char buf[MAX_STRING_LENGTH];
    char *suf;
    int day;

    day = time_info.day + 1;

    if (day > 4 && day < 20)
        suf = "th";
    else if (day % 10 == 1)
        suf = "st";
    else if (day % 10 == 2)
        suf = "nd";
    else if (day % 10 == 3)
        suf = "rd";
    else
        suf = "th";

    sprintf (buf,
             "It is %d o'clock %s, Day of %s, %d%s the Month of %s.\n\r",
             (time_info.hour % 12 == 0) ? 12 : time_info.hour % 12,
             time_info.hour >= 12 ? "pm" : "am",
             day_name[day % 7], day, suf, month_name[time_info.month]);
    send_to_char (buf, ch);
    sprintf (buf, "ROM started up at %s\n\rThe system time is %s.\n\r",
             str_boot_time, (char *) ctime (&current_time));

    send_to_char (buf, ch);
    return;
}



void do_weather (CHAR_DATA * ch, char *argument)
{
    char buf[MAX_STRING_LENGTH];

    static char *const sky_look[4] = {
        "cloudless",
        "cloudy",
        "rainy",
        "lit by flashes of lightning"
    };

    if (!IS_OUTSIDE (ch))
    {
        send_to_char ("You can't see the weather indoors.\n\r", ch);
        return;
    }

    sprintf (buf, "The sky is %s and %s.\n\r",
             sky_look[weather_info.sky],
             weather_info.change >= 0
             ? "a warm southerly breeze blows"
             : "a cold northern gust blows");
    send_to_char (buf, ch);
    return;
}

void do_help (CHAR_DATA * ch, char *argument)
{
    HELP_DATA *pHelp;
    BUFFER *output;
    bool found = FALSE;
    char argall[MAX_INPUT_LENGTH], argone[MAX_INPUT_LENGTH];
    int level;

    output = new_buf ();

    if (argument[0] == '\0')
        argument = "summary";

    /* this parts handles help a b so that it returns help 'a b' */
    argall[0] = '\0';
    while (argument[0] != '\0')
    {
        argument = one_argument (argument, argone);
        if (argall[0] != '\0')
            strcat (argall, " ");
        strcat (argall, argone);
    }

    if (!str_cmp (argall, "summary"))
    {
        add_buf (output,
                 "{M========================================{x\n\r"
                 "{W              HELP SYSTEM{x\n\r"
                 "{M========================================{x\n\r\n\r"
                 "{CMovement Commands...        Grouping Commands...{x\n\r"
                 "{Wnorth south east west up down   follow group gtell split{x\n\r"
                 "{Wexits recall                                    (optional text){x\n\r\n\r"
                 "{CObject Commands...          Information Cmds...{x\n\r"
                 "{Wget put drop give sacrifice    help credits commands areas{x\n\r"
                 "{Wwear wield hold                report score time weather where who{x\n\r\n\r"
                 "{CCombat Commands...          Misc Commands...{x\n\r"
                 "{Wkill flee kick rescue disarm  ! save quit{x\n\r"
                 "{Wbackstab cast wimpy           practice train{x\n\r\n\r"
                 "{WFor more help, type {G'help <topic>'{W for any command, skill, or spell.{x\n\r"
                 "{WAlso help on: {YDAMAGE DEATH EXPERIENCE NEWS STORY TICK WIZLIST{x\n\r");
        page_to_char (buf_string (output), ch);
        free_buf (output);
        return;
    }

    if (!str_cmp (argall, "newbie") || !str_cmp (argall, "help newbie"))
    {
        add_buf (output,
                 "{M========================================{x\n\r"
                 "{C          TOP 10 THINGS NEW PLAYERS SHOULD KNOW{x\n\r"
                 "{M========================================{x\n\r\n\r"
                 "{C1. Alignment Defines Your Allies and Enemies{x\n\r"
                 "   {WYour alignment (good or evil) determines who can attack you. Only\n\r"
                 "   opposite alignments can PK each other. Type {Ghelp alignment{W to learn\n\r"
                 "   more. You cannot change alignment after creation!{x\n\r\n\r"
                 "{C2. Use CONSIDER and SCAN Before Every Fight{x\n\r"
                 "   {WAlways {Gconsider <mob>{W before attacking - it tells you if you can win.\n\r"
                 "   Use {Gscan{W to see creatures in adjacent rooms. Sometimes consider fails,\n\r"
                 "   so try again if you get no response. The command {Ggconsider{W works for\n\r"
                 "   groups.{x\n\r\n\r"
                 "{C3. Death Penalties Scale With Level{x\n\r"
                 "   {WAt level 1-20, death penalties are minimal - explore freely! Higher levels\n\r"
                 "   lose more XP on death. Your corpse contains your gear, so retrieve it\n\r"
                 "   quickly. Type {Ghelp death{W for full details.{x\n\r\n\r"
                 "{G======================== QUICK REFERENCE COMMANDS ========================{x\n\r"
                 "   {Ghelp <topic>{W      - Get help on any topic{x\n\r"
                 "   {Gcommands{W          - List every command available to you{x\n\r"
                 "   {Gwho{W               - See who's online{x\n\r"
                 "   {Gwhere{W             - See your current location{x\n\r"
                 "   {Gscore{W             - View your character stats{x\n\r"
                 "   {Ginventory{W         - Check what you're carrying{x\n\r"
                 "   {Gequipment{W         - Check what you're wearing{x\n\r"
                 "   {Gweight{W            - Check your carry weight{x\n\r"
                 "   {Gsocials{W           - Express yourself to players around you{x\n\r");
        page_to_char (buf_string (output), ch);
        free_buf (output);
        return;
    }

    if (!str_cmp (argall, "gossip") || !str_cmp (argall, "chat"))
    {
        add_buf (output,
                 "{M========================================{x\n\r"
                 "{C              COMMUNICATION CHANNELS{x\n\r"
                 "{M========================================{x\n\r\n\r"
                 "{GSyntax: {Wgossip <message>   {G- Send to all interested players{x\n\r"
                 "{GSyntax: {Wquestion <message> {G- Ask a question to all{x\n\r"
                 "{GSyntax: {Wanswer <message>   {G- Answer the current question{x\n\r"
                 "{GSyntax: {Wshout <message>    {G- Shout to all awake players{x\n\r"
                 "{GSyntax: {Wyell <message>     {G- Yell to players in your area{x\n\r\n\r"
                 "{CGOSSIP / . (DOT){x\n\r"
                 "   {WSends your message to all players interested in gossip.\n\r"
                 "   Type {Wgossip{W with no arguments to toggle whether you hear gossip.\n\r"
                 "   The {W.{W (dot) command is a quick shortcut for gossip.{x\n\r");
        page_to_char (buf_string (output), ch);
        free_buf (output);
        return;
    }

    if (!str_cmp (argall, "immtalk") || !str_cmp (argall, "pray"))
    {
        add_buf (output,
                 "{M========================================{x\n\r"
                 "{C                 COMMUNICATE WITH ADMINS{x\n\r"
                 "{M========================================{x\n\r\n\r"
                 "{GSyntax: {Wimmtalk <message>{x\n\r"
                 "{GSyntax: {W: <message>{x\n\r\n\r"
                 "{G** DO USE IMMTALK FOR:{x\n\r"
                 "   {W- Important rule questions\n\r"
                 "   - Report bugs or exploits\n\r"
                 "   - Report player harassment\n\r"
                 "   - Emergency situations\n\r"
                 "   - Issues requiring immediate admin attention{x\n\r\n\r"
                 "{R** DO NOT USE IMMTALK FOR:{x\n\r"
                 "   {W- Requesting battlegrounds (use gossip instead)\n\r"
                 "   - General questions (use help or gossip)\n\r"
                 "   - Spamming or testing\n\r"
                 "   - Complaining about deaths or losses{x\n\r");
        page_to_char (buf_string (output), ch);
        free_buf (output);
        return;
    }

    for (pHelp = help_first; pHelp != NULL; pHelp = pHelp->next)
    {
        level = (pHelp->level < 0) ? -1 * pHelp->level - 1 : pHelp->level;

        if (level > get_trust (ch))
            continue;

        if (is_name (argall, pHelp->keyword))
        {
            /* add seperator if found */
            if (found)
                add_buf (output,
                         "\n\r============================================================\n\r\n\r");
            if (pHelp->level >= 0 && str_cmp (argall, "imotd"))
            {
                add_buf (output, pHelp->keyword);
                add_buf (output, "\n\r");
            }

            /*
             * Strip leading '.' to allow initial blanks.
             */
            if (pHelp->text[0] == '.')
                add_buf (output, pHelp->text + 1);
            else
                add_buf (output, pHelp->text);
            found = TRUE;
            /* small hack :) */
            if (ch->desc != NULL && ch->desc->connected != CON_PLAYING
                && ch->desc->connected != CON_GEN_GROUPS)
                break;
        }
    }

    if (!found)
	{
        send_to_char ("No help on that word.\n\r", ch);
		/*
		 * Let's log unmet help requests so studious IMP's can improve their help files ;-)
		 * But to avoid idiots, we will check the length of the help request, and trim to
		 * a reasonable length (set it by redefining MAX_CMD_LEN in merc.h).  -- JR
		 */
		if (strlen(argall) > MAX_CMD_LEN)
		{
			argall[MAX_CMD_LEN - 1] = '\0';
			log_f ("Excessive command length: %s requested %s.", ch->name, argall);
			send_to_char ("That was rude!\n\r", ch);
		}
		/* OHELPS_FILE is the "orphaned helps" files. Defined in merc.h -- JR */
		else
		{
			append_file (ch, OHELPS_FILE, argall);
		}
	}
    else
        page_to_char (buf_string (output), ch);
    free_buf (output);
}


/* whois command */
void do_whois (CHAR_DATA * ch, char *argument)
{
    char arg[MAX_INPUT_LENGTH];
    BUFFER *output;
    char buf[MAX_STRING_LENGTH];
    char const *class;
    DESCRIPTOR_DATA *d;
    bool found = FALSE;

    one_argument (argument, arg);

    if (arg[0] == '\0')
    {
        send_to_char ("You must provide a name.\n\r", ch);
        return;
    }

    output = new_buf ();

    for (d = descriptor_list; d != NULL; d = d->next)
    {
        CHAR_DATA *wch;

        if (d->connected != CON_PLAYING || !can_see (ch, d->character))
            continue;

        wch = (d->original != NULL) ? d->original : d->character;

        if (!can_see (ch, wch))
            continue;

        if (!str_prefix (arg, wch->name))
        {
            found = TRUE;

            /* work out the printing */
            class = get_profession (wch) != NULL ? get_profession (wch)->who_name : class_table[wch->class].who_name;
            switch (wch->level)
            {
                case MAX_LEVEL - 0:
                    class = "IMP";
                    break;
                case MAX_LEVEL - 1:
                    class = "CRE";
                    break;
                case MAX_LEVEL - 2:
                    class = "SUP";
                    break;
                case MAX_LEVEL - 3:
                    class = "DEI";
                    break;
                case MAX_LEVEL - 4:
                    class = "GOD";
                    break;
                case MAX_LEVEL - 5:
                    class = "IMM";
                    break;
                case MAX_LEVEL - 6:
                    class = "DEM";
                    break;
                case MAX_LEVEL - 7:
                    class = "ANG";
                    break;
                case MAX_LEVEL - 8:
                    class = "AVA";
                    break;
            }

            /* a little formatting */
            sprintf (buf, "[%2d %6s %s] %s%s%s%s%s%s%s%s\n\r",
                     wch->level,
                     wch->race <
                     MAX_PC_RACE ? pc_race_table[wch->
                                                 race].who_name : "     ",
                     class, wch->incog_level >= LEVEL_HERO ? "(Incog) " : "",
                     wch->invis_level >= LEVEL_HERO ? "(Wizi) " : "",
                     clan_table[wch->clan].who_name, IS_SET (wch->comm,
                                                             COMM_AFK) ?
                     "[AFK] " : "", IS_SET (wch->act,
                                            PLR_KILLER) ? "(KILLER) " : "",
                     IS_SET (wch->act, PLR_THIEF) ? "(THIEF) " : "",
                     wch->name, IS_NPC (wch) ? "" : wch->pcdata->title);
            add_buf (output, buf);
        }
    }

    if (!found)
    {
        send_to_char ("No one of that name is playing.\n\r", ch);
        return;
    }

    page_to_char (buf_string (output), ch);
    free_buf (output);
}


/*
 * New 'who' command originally by Alander of Rivers of Mud.
 */
void do_who (CHAR_DATA * ch, char *argument)
{
    char buf[MAX_STRING_LENGTH];
    char buf2[MAX_STRING_LENGTH];
    BUFFER *output;
    DESCRIPTOR_DATA *d;
    int iClass;
    int iRace;
    int iClan;
    int iLevelLower;
    int iLevelUpper;
    int nNumber;
    int nMatch;
    bool rgfClass[MAX_CLASS];
    bool rgfRace[MAX_PC_RACE];
    bool rgfClan[MAX_CLAN];
    bool fClassRestrict = FALSE;
    bool fClanRestrict = FALSE;
    bool fClan = FALSE;
    bool fRaceRestrict = FALSE;
    bool fImmortalOnly = FALSE;
    bool hasImmortalsShown = FALSE;
    bool showedMortalDivider = FALSE;

    /*
     * Set default arguments.
     */
    iLevelLower = 0;
    iLevelUpper = MAX_LEVEL;
    for (iClass = 0; iClass < MAX_CLASS; iClass++)
        rgfClass[iClass] = FALSE;
    for (iRace = 0; iRace < MAX_PC_RACE; iRace++)
        rgfRace[iRace] = FALSE;
    for (iClan = 0; iClan < MAX_CLAN; iClan++)
        rgfClan[iClan] = FALSE;

    /*
     * Parse arguments.
     */
    nNumber = 0;
    for (;;)
    {
        char arg[MAX_STRING_LENGTH];

        argument = one_argument (argument, arg);
        if (arg[0] == '\0')
            break;

        if (is_number (arg))
        {
            switch (++nNumber)
            {
                case 1:
                    iLevelLower = atoi (arg);
                    break;
                case 2:
                    iLevelUpper = atoi (arg);
                    break;
                default:
                    send_to_char ("Only two level numbers allowed.\n\r", ch);
                    return;
            }
        }
        else
        {

            /*
             * Look for classes to turn on.
             */
            if (!str_prefix (arg, "immortals"))
            {
                fImmortalOnly = TRUE;
            }
            else
            {
                iClass = class_lookup (arg);
                if (iClass == -1)
                {
                    iRace = race_lookup (arg);

                    if (iRace == 0 || iRace >= MAX_PC_RACE)
                    {
                        if (!str_prefix (arg, "clan"))
                            fClan = TRUE;
                        else
                        {
                            iClan = clan_lookup (arg);
                            if (iClan)
                            {
                                fClanRestrict = TRUE;
                                rgfClan[iClan] = TRUE;
                            }
                            else
                            {
                                send_to_char
                                    ("That's not a valid race, class, or clan.\n\r",
                                     ch);
                                return;
                            }
                        }
                    }
                    else
                    {
                        fRaceRestrict = TRUE;
                        rgfRace[iRace] = TRUE;
                    }
                }
                else
                {
                    fClassRestrict = TRUE;
                    rgfClass[iClass] = TRUE;
                }
            }
        }
    }

    /*
     * Now show matching chars.
     */
    nMatch = 0;
    buf[0] = '\0';
    output = new_buf ();

    add_buf (output, "{W-----------------------------------------------------------------------------{x\n\r");

    for (d = descriptor_list; d != NULL; d = d->next)
    {
        CHAR_DATA *wch;

        /*
         * Check for match against restrictions.
         * Don't use trust as that exposes trusted mortals.
         */
        if (d->connected != CON_PLAYING || !can_see (ch, d->character))
            continue;

        wch = (d->original != NULL) ? d->original : d->character;

        if (!can_see (ch, wch))
            continue;

        if (wch->level < iLevelLower
            || wch->level > iLevelUpper
            || (fImmortalOnly && wch->level < LEVEL_IMMORTAL)
            || (fClassRestrict && !rgfClass[wch->class])
            || (fRaceRestrict && !rgfRace[wch->race])
            || (fClan && !is_clan (wch))
            || (fClanRestrict && !rgfClan[wch->clan]))
            continue;

        nMatch++;

        /*
         * Format it up.
         */
        if (wch->level >= LEVEL_IMMORTAL)
        {
            hasImmortalsShown = TRUE;
            sprintf (buf, "  {M[ -* Coder *- ]{x {W%s%s%s%s%s%s{x\n\r",
                     IS_SET (wch->comm, COMM_AFK) ? "<AFK> " : "",
                     wch->incog_level >= LEVEL_HERO ? "<Incog> " : "",
                     wch->invis_level >= LEVEL_HERO ? "<Wizi> " : "",
                     wch->name,
                     IS_NPC (wch) ? "" : " ",
                     IS_NPC (wch) ? "" : wch->pcdata->title);
        }
        else
        {
            if (hasImmortalsShown && !showedMortalDivider)
            {
                add_buf (output, "{W- - - - - - - - - - - - - - - - - - - - - - - - - - - - - - - - - - - - - - -{x\n\r");
                showedMortalDivider = TRUE;
            }
            sprintf (buf, "  [ {RLevel %2d{x ] {D%s%s{x\n\r",
                     wch->level,
                     wch->name,
                     IS_NPC (wch) ? "" : wch->pcdata->title);
        }
        add_buf (output, buf);
    }

    sprintf (buf2, "{W-----------------------------------------------------------------------------{x\n\r"
             "{WThere are %d players visible to you and %d total players.{x\n\r",
             nMatch, nMatch);
    add_buf (output, buf2);
    page_to_char (buf_string (output), ch);
    free_buf (output);
    return;
}

void do_count (CHAR_DATA * ch, char *argument)
{
    int count;
    DESCRIPTOR_DATA *d;
    char buf[MAX_STRING_LENGTH];

    count = 0;

    for (d = descriptor_list; d != NULL; d = d->next)
        if (d->connected == CON_PLAYING && can_see (ch, d->character))
            count++;

    max_on = UMAX (count, max_on);

    if (max_on == count)
        sprintf (buf,
                 "There are %d characters on, the most so far today.\n\r",
                 count);
    else
        sprintf (buf,
                 "There are %d characters on, the most on today was %d.\n\r",
                 count, max_on);

    send_to_char (buf, ch);
}

void do_inventory (CHAR_DATA * ch, char *argument)
{
    send_to_char ("{C--- {W[Inventory]{C ---{x\n\r", ch);
    send_to_char ("{WYou are carrying:{x\n\r", ch);
    show_list_to_char (ch->carrying, ch, TRUE, TRUE);
    return;
}



void do_equipment (CHAR_DATA * ch, char *argument)
{
    OBJ_DATA *obj;
    int iWear;
    bool found;

    send_to_char ("{WYou are using:{x\n\r", ch);
    found = FALSE;
    for (iWear = 0; iWear < MAX_WEAR; iWear++)
    {
        if ((obj = get_eq_char (ch, iWear)) == NULL)
            continue;

        send_to_char ("{G", ch);
        send_to_char (where_name[iWear], ch);
        send_to_char ("{x ", ch);
        if (can_see_obj (ch, obj))
        {
            send_to_char ("{C", ch);
            send_to_char (format_obj_to_char (obj, ch, TRUE), ch);
            send_to_char ("{x\n\r", ch);
        }
        else
        {
            send_to_char ("something.\n\r", ch);
        }
        found = TRUE;
    }

    if (!found)
        send_to_char ("{DNothing equipped.{x\n\r", ch);

    return;
}



void do_compare (CHAR_DATA * ch, char *argument)
{
    char arg1[MAX_INPUT_LENGTH];
    char arg2[MAX_INPUT_LENGTH];
    OBJ_DATA *obj1;
    OBJ_DATA *obj2;
    int value1;
    int value2;
    char *msg;

    argument = one_argument (argument, arg1);
    argument = one_argument (argument, arg2);

    if ((obj1 = get_obj_carry (ch, arg1, ch)) == NULL)
    {
        send_to_char ("You do not have that item.\n\r", ch);
        return;
    }

    if (arg2[0] == '\0')
    {
        for (obj2 = ch->carrying; obj2 != NULL; obj2 = obj2->next_content)
        {
            if (obj2->wear_loc != WEAR_NONE && can_see_obj (ch, obj2)
                && obj1->item_type == obj2->item_type
                && (obj1->wear_flags & obj2->wear_flags & ~ITEM_TAKE) != 0)
                break;
        }

        if (obj2 == NULL)
        {
            send_to_char ("You aren't wearing anything comparable.\n\r", ch);
            return;
        }
    }

    else if ((obj2 = get_obj_carry (ch, arg2, ch)) == NULL)
    {
        send_to_char ("You do not have that item.\n\r", ch);
        return;
    }

    msg = NULL;
    value1 = 0;
    value2 = 0;

    if (obj1 == obj2)
    {
        msg = "You compare $p to itself.  It looks about the same.";
    }
    else if (obj1->item_type != obj2->item_type)
    {
        msg = "You can't compare $p and $P.";
    }
    else
    {
        switch (obj1->item_type)
        {
            default:
                msg = "You can't compare $p and $P.";
                break;

            case ITEM_ARMOR:
                value1 = obj1->value[0] + obj1->value[1] + obj1->value[2];
                value2 = obj2->value[0] + obj2->value[1] + obj2->value[2];
                break;

            case ITEM_WEAPON:
                if (obj1->pIndexData->new_format)
                    value1 = (1 + obj1->value[2]) * obj1->value[1];
                else
                    value1 = obj1->value[1] + obj1->value[2];

                if (obj2->pIndexData->new_format)
                    value2 = (1 + obj2->value[2]) * obj2->value[1];
                else
                    value2 = obj2->value[1] + obj2->value[2];
                break;
        }
    }

    if (msg == NULL)
    {
        if (value1 == value2)
            msg = "$p and $P look about the same.";
        else if (value1 > value2)
            msg = "$p looks better than $P.";
        else
            msg = "$p looks worse than $P.";
    }

    act (msg, ch, obj1, obj2, TO_CHAR);
    return;
}



void do_credits (CHAR_DATA * ch, char *argument)
{
    do_function (ch, &do_help, "diku");
    return;
}



void do_where (CHAR_DATA * ch, char *argument)
{
    char buf[MAX_STRING_LENGTH];
    char arg[MAX_INPUT_LENGTH];
    CHAR_DATA *victim;
    DESCRIPTOR_DATA *d;
    bool found;

    one_argument (argument, arg);

    if (arg[0] == '\0')
    {
        send_to_char ("Players near you:\n\r", ch);
        found = FALSE;
        for (d = descriptor_list; d; d = d->next)
        {
            if (d->connected == CON_PLAYING
                && (victim = d->character) != NULL && !IS_NPC (victim)
                && victim->in_room != NULL
                && !IS_SET (victim->in_room->room_flags, ROOM_NOWHERE)
                && (is_room_owner (ch, victim->in_room)
                    || !room_is_private (victim->in_room))
                && victim->in_room->area == ch->in_room->area
                && can_see (ch, victim))
            {
                found = TRUE;
                sprintf (buf, "%-28s %s\n\r",
                         victim->name, victim->in_room->name);
                send_to_char (buf, ch);
            }
        }
        if (!found)
            send_to_char ("None\n\r", ch);
    }
    else
    {
        found = FALSE;
        for (victim = char_list; victim != NULL; victim = victim->next)
        {
            if (victim->in_room != NULL
                && victim->in_room->area == ch->in_room->area
                && !IS_AFFECTED (victim, AFF_HIDE)
                && !IS_AFFECTED (victim, AFF_SNEAK)
                && can_see (ch, victim) && is_name (arg, victim->name))
            {
                found = TRUE;
                sprintf (buf, "%-28s %s\n\r",
                         PERS (victim, ch), victim->in_room->name);
                send_to_char (buf, ch);
                break;
            }
        }
        if (!found)
            act ("You didn't find any $T.", ch, NULL, arg, TO_CHAR);
    }

    return;
}




void do_consider (CHAR_DATA * ch, char *argument)
{
    char arg[MAX_INPUT_LENGTH];
    char buf[MAX_STRING_LENGTH];
    CHAR_DATA *victim;
    char *msg;
    int diff;

    one_argument (argument, arg);

    if (arg[0] == '\0')
    {
        send_to_char ("Consider killing whom?\n\r", ch);
        return;
    }

    if ((victim = get_char_room (ch, arg)) == NULL)
    {
        send_to_char ("They're not here.\n\r", ch);
        return;
    }

    if (is_safe (ch, victim))
    {
        send_to_char ("Don't even think about it.\n\r", ch);
        return;
    }

    if (!IS_NPC (ch) && !IS_NPC (victim))
    {
        if ((ch->alignment > 0 && victim->alignment < 0)
            || (ch->alignment < 0 && victim->alignment > 0))
        {
            send_to_char ("{GOpposed alignment:{x warpoint rewards apply on PK.\n\r", ch);
        }
        else
        {
            send_to_char ("{YSame alignment:{x no opposite-alignment warpoint bonus.\n\r", ch);
        }

        sprintf (buf,
                 "{GTarget Warpoints:{x %d  {GTarget Sect:{x %s\n\r",
                 victim->warpoint,
                 (victim->sect_number >= 0 && victim->sect_number < MAX_SECT)
                    ? sect_table[victim->sect_number].name
                    : "Unassigned");
        send_to_char (buf, ch);
    }

    diff = victim->level - ch->level;

    if (diff <= -10)
        msg = "You can kill $N naked and weaponless.";
    else if (diff <= -5)
        msg = "$N is no match for you.";
    else if (diff <= -2)
        msg = "$N looks like an easy kill.";
    else if (diff <= 1)
        msg = "The perfect match!";
    else if (diff <= 4)
        msg = "$N says 'Do you feel lucky, punk?'.";
    else if (diff <= 9)
        msg = "$N laughs at you mercilessly.";
    else
        msg = "Death will thank you for your gift.";

    act (msg, ch, NULL, victim, TO_CHAR);
    return;
}



void set_title (CHAR_DATA * ch, char *title)
{
    char buf[MAX_STRING_LENGTH];

    if (IS_NPC (ch))
    {
        bug ("Set_title: NPC.", 0);
        return;
    }

    if (title[0] != '.' && title[0] != ',' && title[0] != '!'
        && title[0] != '?')
    {
        buf[0] = ' ';
        strcpy (buf + 1, title);
    }
    else
    {
        strcpy (buf, title);
    }

    free_string (ch->pcdata->title);
    ch->pcdata->title = str_dup (buf);
    return;
}


static void sanitize_player_title(char *title)
{
    int i;

    if (title == NULL)
        return;

    if (strlen(title) > 45)
        title[45] = '\0';

    i = strlen(title);
    if (i > 0 && title[i - 1] == '{' && (i == 1 || title[i - 2] != '{'))
        title[i - 1] = '\0';

    smash_tilde(title);
}



void do_title (CHAR_DATA * ch, char *argument)
{
    if (IS_NPC (ch))
        return;

    if (argument[0] == '\0')
    {
        send_to_char ("Change your title to what?\n\r", ch);
        return;
    }

    sanitize_player_title(argument);

    if (argument[0] == '\0')
    {
        send_to_char ("Change your title to what?\n\r", ch);
        return;
    }

    set_title (ch, argument);
    send_to_char ("Ok.\n\r", ch);
}



void do_description (CHAR_DATA * ch, char *argument)
{
    char buf[MAX_STRING_LENGTH];

    if (argument[0] != '\0')
    {
        buf[0] = '\0';
        smash_tilde (argument);

        if (argument[0] == '-')
        {
            int len;
            bool found = FALSE;

            if (ch->description == NULL || ch->description[0] == '\0')
            {
                send_to_char ("No lines left to remove.\n\r", ch);
                return;
            }

            strcpy (buf, ch->description);

            for (len = strlen (buf); len > 0; len--)
            {
                if (buf[len] == '\r')
                {
                    if (!found)
                    {            /* back it up */
                        if (len > 0)
                            len--;
                        found = TRUE;
                    }
                    else
                    {            /* found the second one */

                        buf[len + 1] = '\0';
                        free_string (ch->description);
                        ch->description = str_dup (buf);
                        send_to_char ("Your description is:\n\r", ch);
                        send_to_char (ch->description ? ch->description :
                                      "(None).\n\r", ch);
                        return;
                    }
                }
            }
            buf[0] = '\0';
            free_string (ch->description);
            ch->description = str_dup (buf);
            send_to_char ("Description cleared.\n\r", ch);
            return;
        }
        if (argument[0] == '+')
        {
            if (ch->description != NULL)
                strcat (buf, ch->description);
            argument++;
            while (isspace (*argument))
                argument++;
        }

        if (strlen (buf) >= 1024)
        {
            send_to_char ("Description too long.\n\r", ch);
            return;
        }

        strcat (buf, argument);
        strcat (buf, "\n\r");
        free_string (ch->description);
        ch->description = str_dup (buf);
    }

    send_to_char ("Your description is:\n\r", ch);
    send_to_char (ch->description ? ch->description : "(None).\n\r", ch);
    return;
}



void do_report (CHAR_DATA * ch, char *argument)
{
    char buf[MAX_INPUT_LENGTH];

    sprintf (buf,
             "You say 'I have %d/%d hp %d/%d mana %d/%d mv %d xp.'\n\r",
             ch->hit, ch->max_hit,
             ch->mana, ch->max_mana, ch->move, ch->max_move, ch->exp);

    send_to_char (buf, ch);

    sprintf (buf, "$n says 'I have %d/%d hp %d/%d mana %d/%d mv %d xp.'",
             ch->hit, ch->max_hit,
             ch->mana, ch->max_mana, ch->move, ch->max_move, ch->exp);

    act (buf, ch, NULL, NULL, TO_ROOM);

    return;
}



void do_practice (CHAR_DATA * ch, char *argument)
{
    char buf[MAX_STRING_LENGTH];
    int sn;
    int class_index;

    if (IS_NPC (ch))
        return;

    class_index = rop_effective_class_index (ch->class);

    if (argument[0] == '\0')
    {
        int col;

        col = 0;
        for (sn = 0; sn < MAX_SKILL; sn++)
        {
            if (skill_table[sn].name == NULL)
                break;
            if (ch->level < skill_table[sn].skill_level[class_index]
                || ch->pcdata->learned[sn] < 1 /* skill is not known */ )
                continue;

            sprintf (buf, "%-18s %3d%%  ",
                     skill_table[sn].name, ch->pcdata->learned[sn]);
            send_to_char (buf, ch);
            if (++col % 3 == 0)
                send_to_char ("\n\r", ch);
        }

        if (col % 3 != 0)
            send_to_char ("\n\r", ch);

        sprintf (buf, "You have %d practice sessions left.\n\r",
                 ch->practice);
        send_to_char (buf, ch);
    }
    else
    {
        CHAR_DATA *mob;
        int adept;

        if (!IS_AWAKE (ch))
        {
            send_to_char ("In your dreams, or what?\n\r", ch);
            return;
        }

        for (mob = ch->in_room->people; mob != NULL; mob = mob->next_in_room)
        {
            if (IS_NPC (mob) && IS_SET (mob->act, ACT_PRACTICE))
                break;
        }

        if (mob == NULL)
        {
            send_to_char ("You can't do that here.\n\r", ch);
            return;
        }

        if (ch->practice <= 0)
        {
            send_to_char ("You have no practice sessions left.\n\r", ch);
            return;
        }

        if ((sn = find_spell (ch, argument)) < 0 || (!IS_NPC (ch)
                                                     && (ch->level <
                                                         skill_table
                                                         [sn].skill_level
                                                         [class_index]
                                                         || ch->
                                                         pcdata->learned[sn] < 1    /* skill is not known */
                                                         ||
                                                         skill_table
                                                         [sn].rating[class_index] ==
                                                         0)))
        {
            send_to_char ("You can't practice that.\n\r", ch);
            return;
        }

        adept = IS_NPC (ch) ? 100 : (get_profession (ch) != NULL ? get_profession (ch)->skill_adept : class_table[ch->class].skill_adept);
        adept = UMIN (100, adept + ch->remort_skill_slots);

        if (ch->pcdata->learned[sn] >= adept)
        {
            sprintf (buf, "You are already learned at %s.\n\r",
                     skill_table[sn].name);
            send_to_char (buf, ch);
        }
        else
        {
            ch->practice--;
            ch->pcdata->learned[sn] +=
                int_app[get_curr_stat (ch, STAT_INT)].learn /
                skill_table[sn].rating[class_index];
            if (ch->pcdata->learned[sn] < adept)
            {
                act ("You practice $T.",
                     ch, NULL, skill_table[sn].name, TO_CHAR);
                act ("$n practices $T.",
                     ch, NULL, skill_table[sn].name, TO_ROOM);
            }
            else
            {
                ch->pcdata->learned[sn] = adept;
                act ("You are now learned at $T.",
                     ch, NULL, skill_table[sn].name, TO_CHAR);
                act ("$n is now learned at $T.",
                     ch, NULL, skill_table[sn].name, TO_ROOM);
            }
        }
    }
    return;
}



/*
 * 'Wimpy' originally by Dionysos.
 */
void do_wimpy (CHAR_DATA * ch, char *argument)
{
    char buf[MAX_STRING_LENGTH];
    char arg[MAX_INPUT_LENGTH];
    int wimpy;

    one_argument (argument, arg);

    if (arg[0] == '\0')
        wimpy = ch->max_hit / 5;
    else
        wimpy = atoi (arg);

    if (wimpy < 0)
    {
        send_to_char ("Your courage exceeds your wisdom.\n\r", ch);
        return;
    }

    if (wimpy > ch->max_hit / 2)
    {
        send_to_char ("Such cowardice ill becomes you.\n\r", ch);
        return;
    }

    ch->wimpy = wimpy;
    sprintf (buf, "Wimpy set to %d hit points.\n\r", wimpy);
    send_to_char (buf, ch);
    return;
}



void do_password (CHAR_DATA * ch, char *argument)
{
    char arg1[MAX_INPUT_LENGTH];
    char arg2[MAX_INPUT_LENGTH];
    char *pArg;
    char *pwdnew;
    char *p;
    char cEnd;

    if (IS_NPC (ch))
        return;

    /*
     * Can't use one_argument here because it smashes case.
     * So we just steal all its code.  Bleagh.
     */
    pArg = arg1;
    while (isspace (*argument))
        argument++;

    cEnd = ' ';
    if (*argument == '\'' || *argument == '"')
        cEnd = *argument++;

    while (*argument != '\0')
    {
        if (*argument == cEnd)
        {
            argument++;
            break;
        }
        *pArg++ = *argument++;
    }
    *pArg = '\0';

    pArg = arg2;
    while (isspace (*argument))
        argument++;

    cEnd = ' ';
    if (*argument == '\'' || *argument == '"')
        cEnd = *argument++;

    while (*argument != '\0')
    {
        if (*argument == cEnd)
        {
            argument++;
            break;
        }
        *pArg++ = *argument++;
    }
    *pArg = '\0';

    if (arg1[0] == '\0' || arg2[0] == '\0')
    {
        send_to_char ("Syntax: password <old> <new>.\n\r", ch);
        return;
    }

    if (strcmp (crypt (arg1, ch->pcdata->pwd), ch->pcdata->pwd))
    {
        WAIT_STATE (ch, 40);
        send_to_char ("Wrong password.  Wait 10 seconds.\n\r", ch);
        return;
    }

    if (strlen (arg2) < 5)
    {
        send_to_char
            ("New password must be at least five characters long.\n\r", ch);
        return;
    }

    /*
     * No tilde allowed because of player file format.
     */
    pwdnew = crypt (arg2, ch->name);
    for (p = pwdnew; *p != '\0'; p++)
    {
        if (*p == '~')
        {
            send_to_char ("New password not acceptable, try again.\n\r", ch);
            return;
        }
    }

    free_string (ch->pcdata->pwd);
    ch->pcdata->pwd = str_dup (pwdnew);
    save_char_obj (ch);
    send_to_char ("Ok.\n\r", ch);
    return;
}

void do_telnetga (CHAR_DATA * ch, char *argument)
{
	if (IS_NPC (ch))
		return;

	if (IS_SET (ch->comm, COMM_TELNET_GA))
	{
		send_to_char ("Telnet GA removed.\n\r", ch);
		REMOVE_BIT (ch->comm, COMM_TELNET_GA);
	}
	else
	{
		send_to_char ("Telnet GA enabled.\n\r", ch);
		SET_BIT (ch->comm, COMM_TELNET_GA);
	}
}


