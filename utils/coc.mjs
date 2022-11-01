import _fetch from "node-fetch";
import {} from 'dotenv/config'

const fetch = (URI) =>
  _fetch(URI, {
    method: "GET",
    headers: {
      Authorization: `Bearer ${process.env.CLASH_API_TOKEN}`,
    },
  });

export default {
  fetchRaidInfo: (clanTag) =>
    fetch(
      `https://api.clashofclans.com/v1/clans/${encodeURIComponent(
        clanTag
      )}/capitalraidseasons?limit=2`
    ),
  fetchClanInfo: (clanTag) =>
    fetch(
      `https://api.clashofclans.com/v1/clans/${encodeURIComponent(
        clanTag
      )}`
    ),
  fetchClanMembersInfo: (clanTag) =>
    fetch(
      `https://api.clashofclans.com/v1/clans/${encodeURIComponent(
        clanTag
      )}/members`
    ),
  fetchPlayerInfo: (memberTag) =>
    fetch(
      `https://api.clashofclans.com/v1/players/${encodeURIComponent(memberTag)}`
    ),
};
