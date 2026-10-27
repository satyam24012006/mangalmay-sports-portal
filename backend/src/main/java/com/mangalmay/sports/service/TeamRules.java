package com.mangalmay.sports.service;

import java.util.regex.Matcher;
import java.util.regex.Pattern;

/**
 * Derives roster limits from the sport's free-text teamSize:
 *  "11 players"        -> 11 to 15 names (squad + up to 4 substitutes), team name required
 *  "Singles / Doubles" -> 1 to 2 names, team name optional
 *  anything else       -> 1 to 20 names
 * Change the numbers here if the sports department has different rules.
 */
public record TeamRules(int min, int max, boolean teamNameRequired) {
    private static final Pattern PLAYERS = Pattern.compile("(\\d+)\\s*player", Pattern.CASE_INSENSITIVE);
    private static final int SUBSTITUTES = 4;

    public static TeamRules parse(String teamSize) {
        if (teamSize != null) {
            Matcher m = PLAYERS.matcher(teamSize);
            if (m.find()) {
                int n = Integer.parseInt(m.group(1));
                return new TeamRules(n, n + SUBSTITUTES, true);
            }
            String t = teamSize.toLowerCase();
            if (t.contains("single") || t.contains("double")) return new TeamRules(1, 2, false);
        }
        return new TeamRules(1, 20, false);
    }
}
