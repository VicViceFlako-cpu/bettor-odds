export default async function handler(req, res) {
  res.setHeader('Access-Control-Allow-Origin', '*');
  res.setHeader('Access-Control-Allow-Methods', 'GET');

  const { sport, eventId } = req.query;
  if (!sport || !eventId) return res.status(400).json({ error: 'Missing sport or eventId' });

  const API_KEY = 'c997825601b7e1e9975c1f46caae0d6d';
  const BOOKS = 'draftkings,fanduel,betmgm,caesars,espnbet,pointsbetus,hardrockbet,bovada';

  // Player prop markets by sport
  const PROP_MARKETS = {
    basketball_nba:        'player_points,player_rebounds,player_assists,player_threes,player_blocks,player_steals,player_points_rebounds_assists',
    americanfootball_nfl:  'player_pass_yds,player_rush_yds,player_reception_yds,player_receptions,player_pass_tds,player_rush_tds,player_anytime_td',
    baseball_mlb:          'batter_hits,batter_home_runs,batter_rbis,batter_strikeouts,pitcher_strikeouts,pitcher_hits_allowed',
    icehockey_nhl:         'player_points,player_goals,player_assists,player_shots_on_goal',
    mma_mixed_martial_arts:'fighter_win_method',
    boxing_boxing:         'fighter_win_method',
  };

  const markets = PROP_MARKETS[sport] || 'player_points';

  try {
    // Correct endpoint for non-featured markets (props) — must use /events/{eventId}/odds
    const url = `https://api.the-odds-api.com/v4/sports/${sport}/events/${eventId}/odds?apiKey=${API_KEY}&regions=us&markets=${markets}&oddsFormat=american&bookmakers=${BOOKS}`;
    const response = await fetch(url);
    const text = await response.text();

    // Parse and check for API errors
    let data;
    try { data = JSON.parse(text); } catch { return res.status(500).json({ error: 'Invalid JSON from API', raw: text.slice(0, 200) }); }

    if (data.error_code || data.message) {
      return res.status(400).json({ error: data.message || data.error_code, detail: data });
    }

    // API returns a single event object, wrap in array for consistency
    res.status(200).json(Array.isArray(data) ? data : [data]);
  } catch (err) {
    res.status(500).json({ error: err.message });
  }
}
