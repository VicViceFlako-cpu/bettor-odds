export default async function handler(req, res) {
  res.setHeader('Access-Control-Allow-Origin', '*');
  res.setHeader('Access-Control-Allow-Methods', 'GET');

  const { sport } = req.query;
  if (!sport) return res.status(400).json({ error: 'Missing sport parameter' });

  const API_KEY = '2e7f79219669f2c22384183e68d8fea3';
  const BOOKS = 'draftkings,fanduel,betmgm,caesars,bet365,espnbet,pointsbetus,hardrockbet,bovada';

  try {
    const url = `https://api.the-odds-api.com/v4/sports/${sport}/odds/?apiKey=${API_KEY}&regions=us&markets=h2h,spreads,totals&oddsFormat=american&bookmakers=${BOOKS}`;
    const response = await fetch(url);
    const data = await response.json();
    res.status(200).json(data);
  } catch (err) {
    res.status(500).json({ error: err.message });
  }
}
