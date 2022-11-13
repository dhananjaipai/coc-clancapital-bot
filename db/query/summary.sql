SELECT
    (
        case when Donations.total > Loot.total then 1 else 0 end
    ) as status,
    Loot.tag as tag,
    Loot.name as name,
    Loot.total as looted,
    Loot.clans as lootedClans,
    Donations.total as donated,
    Donations.clans as donatedClans
FROM
    (
        SELECT
            tag,
            name,
            sum(amount) as total,
            group_concat(distinct(clan)) as clans
        FROM
            Records
        WHERE
            type = "loot"
            AND time > date('now', '-4 day', 'weekday 5')
        GROUP BY
            tag
    ) as Loot
    LEFT JOIN (
        SELECT
            tag,
            name,
            sum(amount) as total,
            group_concat(distinct(clan)) as clans
        FROM
            Records
        WHERE
            type = "donation"
            AND time > date('now', '-4 day', 'weekday 5')
        GROUP BY
            tag
    ) as Donations ON Loot.tag = Donations.tag
ORDER BY
    donatedClans desc;