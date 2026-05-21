export default async function handler(req, res) {
  res.setHeader('Access-Control-Allow-Origin', '*');
  res.setHeader('Access-Control-Allow-Methods', 'GET');

  const { sport } = req.query;
  if (!sport) return res.status(400).json({ error: 'Missing sport parameter' });

  const API_KEY = 'c997825601b7e1e9975c1f46caae0d6d';
  const BOOKS = 'draftkings,fanduel,betmgm,caesars,bet365,espnbet,pointsbetus,hardrockbet,bovada';

  try {
    // First check if sport has any upcoming events (cheap call, saves quota)
    const checkUrl = `https://api.the-odds-api.com/v4/sports/${sport}/events?apiKey=${API_KEY}`;
    const checkRes = await fetch(checkUrl);
    const events = await checkRes.json();

    // If no events or API error, return empty array without burning odds quota
    if (!Array.isArray(events) || events.length === 0) {
      return res.status(200).json([]);
    }

    // Sport has events — fetch full odds
    const url = `https://api.the-odds-api.com/v4/sports/${sport}/odds/?apiKey=${API_KEY}&regions=us&markets=h2h,spreads,totals&oddsFormat=american&bookmakers=${BOOKS}`;
    const response = await fetch(url);
    const data = await response.json();
    res.status(200).json(data);
  } catch (err) {
    res.status(500).json({ error: err.message });
  }
}
