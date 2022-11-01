import CoCAPI from "./coc.mjs";

export const findOpenClans = async (seed, MAX_CLANS_TO_SCRAPE = 1000) => {
  const scrapedClans = {};

  const scrapeClan = async (clanTag) => {
    const scrapedClanLength = Object.keys(scrapedClans).length;
    // Only scrape if clan is hasn't been scraped already and until a critical length is reached.
    if (!scrapedClans[clanTag] && scrapedClanLength <= MAX_CLANS_TO_SCRAPE)
      try {
        console.log(`Scraping Clan - ${clanTag}`);
        scrapedClans[clanTag] = true; // Mark this clan as scraped to prevent loops

        const _response = await CoCAPI.fetchRaidInfo(clanTag);
        const _raidData = await _response.json();

        _raidData?.items?.forEach((weekend) => {
          // Check clans attacked on that raid weekend
          weekend.attackLog?.forEach((raid) => {
            const _tag = raid.defender?.tag;
            if (scrapedClans[_tag] == null) {
              scrapedClans[_tag] = false; // New clan identified, mark it as unscraped
            }
          });
          // Check clans defended on that raid weekend
          weekend.defenseLog?.forEach((raid) => {
            const _tag = raid.attacker?.tag;
            if (scrapedClans[_tag] == null) {
              scrapedClans[_tag] = false; // New clan identified, mark it as unscraped
            }
          });
        });

        // Find next clan that has not been scraped yet
        const nextClan = Object.keys(scrapedClans).find(
          (_clan) => !scrapedClans[_clan]
        );
        await scrapeClan(nextClan);
      } catch (e) {
        console.log(new Date(), "Exception", e);
      }
  };
  await scrapeClan(seed);

  const clans = Object.keys(scrapedClans);
  const clanInfo = await Promise.all(
    clans.map(async (clanTag) => {
      const _response = await CoCAPI.fetchClanInfo(clanTag);
      const _clanData = await _response.json();
      return {
        tag: _clanData?.tag,
        name: _clanData?.name,
        status: _clanData?.type,
        requiredTownhallLevel: _clanData?.requiredTownhallLevel,
        requiredTrophies: _clanData?.requiredTrophies,
        requiredVersusTrophies: _clanData?.requiredVersusTrophies,
        capitalHallLevel: _clanData?.clanCapital?.capitalHallLevel,
      };
    })
  );
  return (clanInfo.filter((x) => x.status === "open"));
};
