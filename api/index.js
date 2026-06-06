const { MongoClient, ObjectId } = require("mongodb");

const DISCORD_CLIENT_ID = "1488651862021509231";
const DISCORD_CLIENT_SECRET = "7-8E16m-wb673l5xYaba8I9CVltENBDR";
const GUILD_ID = "1484169356396204042";
const REQUIRED_ROLES = [
  "1484971616344608819", // Major
  "1484971554751381579", // Comissari
  "1484971480050700470", // Intendent
  "1502473804759433308", // Inspector Jefe
  "1484971390909157437", // Inspector
  "1500052261739429888", // Inspector en Pràctiques
  "1484971303470370906", // Sots-Inspector
  "1484971112390459583", // Sergent
  "1487507338054336552", // Sergent en Pràctiques
  "1484971012138471475", // Caporal
  "1484970937467277368", // Mosso
  "1486761352017215600", // Mosso en Pràctiques
];
const PLATES_CHANNEL_ID = "1487706683684950138";
const PROMOTIONS_CHANNEL_ID = "1486432212223135754";
const SANCTIONS_CHANNEL_ID = "1504964626071421090";

// Sanction roles
const SANCTION_ROLE_1 = "1486780536541417562";
const SANCTION_ROLE_2 = "1486780637775007834";
const SANCTION_ROLE_3 = "1486780695539093769";

const RANK_ROLES = [
  { id: "1484971616344608819", name: "Major", level: 12 },
  { id: "1484971554751381579", name: "Comissari", level: 11 },
  { id: "1484971480050700470", name: "Intendent", level: 10 },
  { id: "1502473804759433308", name: "Inspector Jefe", level: 9 },
  { id: "1484971390909157437", name: "Inspector", level: 8 },
  { id: "1500052261739429888", name: "Inspector en Pràctiques", level: 7 },
  { id: "1484971303470370906", name: "Sots-Inspector", level: 6 },
  { id: "1484971112390459583", name: "Sergent", level: 5 },
  { id: "1487507338054336552", name: "Sergent en Pràctiques", level: 4 },
  { id: "1484971012138471475", name: "Caporal", level: 3 },
  { id: "1484970937467277368", name: "Mosso", level: 2 },
  { id: "1486761352017215600", name: "Mosso en Pràctiques", level: 1 },
];

const SUPERIOR_SCALE_MIN_LEVEL = 9;

const PLATES_MAP = {
  "1126572002807926855": "CME-100",
  "1266410275955802187": "CME-101",
  "1120386197571776562": "CME-102",
  "829582138428882967": "CME-103",
  "1276624455229116417": "CME-104",
  "1177685977586741249": "CME-105",
  "1459275913635299424": "CME-106",
  "1458931685944070176": "CME-107",
  "1501591806385586257": "CME-108",
  "1152933918056665109": "CME-109",
  "1086671038059921480": "CME-110",
  "1398318142647963668": "CME-111",
  "1294310639870939136": "CME-112",
  "1355536642911375420": "CME-113",
  "1509583777309921393": "CME-114",
  "1278824829264330785": "CME-115",
  "1439706868237992109": "CME-116",
  "1032033336773849089": "CME-117",
  "917348261667409970": "CME-118",
  "715624813409992726": "CME-119",
  "1468664574948675744": "CME-120",
  "792737273514426368": "CME-121",
  "1498793094232019229": "CME-122",
  "1322249599209177279": "CME-123",
  "1265335555122663497": "CME-124",
  "1137731676995338240": "CME-125",
  "1051820766678745138": "CME-126",
  "1057036007897301013": "CME-127",
  "1394785239234253000": "CME-128",
  "1142527446210580612": "CME-129",
  "1490856531439124632": "CME-130",
  "1414662792371376251": "CME-131",
  "823126253187891200": "CME-132",
  "1382068939755884626": "CME-133",
  "1187803274003370037": "CME-134",
  "963174846978752525": "CME-135",
  "742828076202721290": "CME-136",
  "1474496353932673201": "CME-137",
  "1117419125967421571": "CME-138",
  "1400471734557081722": "CME-139",
  "816405964123144198": "CME-140",
  "1122919923132407958": "CME-140B",
  "1057662909502718053": "CME-141",
};

let cachedClient = null;

async function getDb() {
  if (cachedClient) {
    try {
      await cachedClient.db("admin").command({ ping: 1 });
    } catch {
      cachedClient = null;
    }
  }
  if (!cachedClient) {
    cachedClient = new MongoClient(process.env.MONGODB_URI, {
      serverSelectionTimeoutMS: 5000,
      socketTimeoutMS: 10000,
    });
    await cachedClient.connect();
  }
  return cachedClient.db("mossos_pda");
}

async function discordApi(path, token) {
  const res = await fetch(`https://discord.com/api/v10${path}`, {
    headers: { Authorization: `Bearer ${token}` },
  });
  if (!res.ok) throw new Error(`Discord API error: ${res.status}`);
  return res.json();
}

async function discordBotApi(path) {
  const res = await fetch(`https://discord.com/api/v10${path}`, {
    headers: { Authorization: `Bot ${process.env.DISCORD_BOT_TOKEN}` },
  });
  if (!res.ok) throw new Error(`Discord Bot API error: ${res.status}`);
  return res.json();
}

async function sendDiscordEmbed(channelId, embeds) {
  const res = await fetch(`https://discord.com/api/v10/channels/${channelId}/messages`, {
    method: "POST",
    headers: {
      Authorization: `Bot ${process.env.DISCORD_BOT_TOKEN}`,
      "Content-Type": "application/json",
    },
    body: JSON.stringify({ embeds }),
  });
  return res.json();
}

async function editDiscordMessage(channelId, messageId, embeds) {
  await fetch(`https://discord.com/api/v10/channels/${channelId}/messages/${messageId}`, {
    method: "PATCH",
    headers: {
      Authorization: `Bot ${process.env.DISCORD_BOT_TOKEN}`,
      "Content-Type": "application/json",
    },
    body: JSON.stringify({ embeds }),
  });
}

async function sendDiscordDM(userId, content, embeds = null) {
  const dmRes = await fetch(`https://discord.com/api/v10/users/@me/channels`, {
    method: "POST",
    headers: {
      Authorization: `Bot ${process.env.DISCORD_BOT_TOKEN}`,
      "Content-Type": "application/json",
    },
    body: JSON.stringify({ recipient_id: userId }),
  });
  const dm = await dmRes.json();
  const payload = embeds ? { embeds } : { content };
  await fetch(`https://discord.com/api/v10/channels/${dm.id}/messages`, {
    method: "POST",
    headers: {
      Authorization: `Bot ${process.env.DISCORD_BOT_TOKEN}`,
      "Content-Type": "application/json",
    },
    body: JSON.stringify(payload),
  });
}

async function setDiscordNickname(userId, nickname) {
  await fetch(`https://discord.com/api/v10/guilds/${GUILD_ID}/members/${userId}`, {
    method: "PATCH",
    headers: {
      Authorization: `Bot ${process.env.DISCORD_BOT_TOKEN}`,
      "Content-Type": "application/json",
    },
    body: JSON.stringify({ nick: nickname }),
  });
}

async function addDiscordRole(userId, roleId) {
  await fetch(`https://discord.com/api/v10/guilds/${GUILD_ID}/members/${userId}/roles/${roleId}`, {
    method: "PUT",
    headers: { Authorization: `Bot ${process.env.DISCORD_BOT_TOKEN}` },
  });
}

async function removeDiscordRole(userId, roleId) {
  await fetch(`https://discord.com/api/v10/guilds/${GUILD_ID}/members/${userId}/roles/${roleId}`, {
    method: "DELETE",
    headers: { Authorization: `Bot ${process.env.DISCORD_BOT_TOKEN}` },
  });
}

async function getNextPlateNumber(db) {
  const agents = await db.collection("agents").find({}).toArray();
  let maxNum = 141;
  for (const a of agents) {
    if (a.plate) {
      const match = a.plate.match(/CME-(\d+)/);
      if (match) {
        const num = parseInt(match[1]);
        if (num > maxNum) maxNum = num;
      }
    }
  }
  for (const p of Object.values(PLATES_MAP)) {
    const match = p.match(/CME-(\d+)/);
    if (match) {
      const num = parseInt(match[1]);
      if (num > maxNum) maxNum = num;
    }
  }
  return `CME-${maxNum + 1}`;
}

async function getRobloxAvatar(username) {
  try {
    const userRes = await fetch(`https://users.roblox.com/v1/usernames/users`, {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({ usernames: [username], excludeBannedUsers: false }),
    });
    const userData = await userRes.json();
    if (!userData.data || userData.data.length === 0) return null;
    const userId = userData.data[0].id;
    const avatarRes = await fetch(
      `https://thumbnails.roblox.com/v1/users/avatar-headshot?userIds=${userId}&size=150x150&format=Png&isCircular=false`
    );
    const avatarData = await avatarRes.json();
    if (avatarData.data && avatarData.data.length > 0) {
      return { url: avatarData.data[0].imageUrl, robloxId: userId };
    }
    return null;
  } catch {
    return null;
  }
}

async function getMemberLevel(discordId) {
  const memberRes = await fetch(
    `https://discord.com/api/v10/guilds/${GUILD_ID}/members/${discordId}`,
    { headers: { Authorization: `Bot ${process.env.DISCORD_BOT_TOKEN}` } }
  );
  if (!memberRes.ok) return { level: 0, rank: null, roles: [] };
  const member = await memberRes.json();
  let highestLevel = 0;
  let highestRank = null;
  for (const role of RANK_ROLES) {
    if (member.roles.includes(role.id) && role.level > highestLevel) {
      highestLevel = role.level;
      highestRank = role;
    }
  }
  return { level: highestLevel, rank: highestRank, roles: member.roles };
}

async function saveLog(db, { type, adminDiscordId, adminName, targetDiscordId, targetName, description }) {
  await db.collection("logs").insertOne({
    type, adminDiscordId, adminName, targetDiscordId, targetName, description,
    createdAt: new Date(),
  });
}

function buildNickname(rankName, firstName, plate, isMossoPractiques = false) {
  if (isMossoPractiques) {
    return `Mosso.P I ${firstName} I ${plate}`;
  }
  const rankShort = rankName.replace("en Pràctiques", "P").replace("Sots-Inspector", "SI").replace("Inspector Jefe", "I.Jefe");
  return `${rankShort} I ${firstName} I ${plate}`;
}

module.exports = async function handler(req, res) {
  res.setHeader("Access-Control-Allow-Origin", "*");
  res.setHeader("Access-Control-Allow-Methods", "GET,POST,PATCH,DELETE,OPTIONS");
  res.setHeader("Access-Control-Allow-Headers", "Content-Type, Authorization");
  if (req.method === "OPTIONS") return res.status(200).end();

  const url = new URL(req.url, `https://${req.headers.host}`);
  const path = url.pathname;

  try {
    // ── AUTH: OAuth2 callback ──────────────────────────────────────────────────
    if (path === "/api/auth/callback" && req.method === "GET") {
      const code = url.searchParams.get("code");
      if (!code) return res.status(400).json({ error: "No code" });

      const redirectUri = `${url.origin}/api/auth/callback`;
      const tokenRes = await fetch("https://discord.com/api/oauth2/token", {
        method: "POST",
        headers: { "Content-Type": "application/x-www-form-urlencoded" },
        body: new URLSearchParams({
          client_id: DISCORD_CLIENT_ID,
          client_secret: DISCORD_CLIENT_SECRET,
          grant_type: "authorization_code",
          code,
          redirect_uri: redirectUri,
        }),
      });
      const tokens = await tokenRes.json();
      if (!tokens.access_token) return res.status(400).json({ error: "Token error" });

      const discordUser = await discordApi("/users/@me", tokens.access_token);
      const memberRes = await fetch(
        `https://discord.com/api/v10/guilds/${GUILD_ID}/members/${discordUser.id}`,
        { headers: { Authorization: `Bot ${process.env.DISCORD_BOT_TOKEN}` } }
      );
      if (!memberRes.ok) return res.redirect(`/?error=not_in_server`);
      const member = await memberRes.json();
      if (!REQUIRED_ROLES.some(role => member.roles.includes(role))) return res.redirect(`/?error=no_role`);

      const db = await getDb();
      await db.collection("sessions").updateOne(
        { discordId: discordUser.id },
        {
          $set: {
            discordId: discordUser.id,
            accessToken: tokens.access_token,
            username: discordUser.username,
            globalName: discordUser.global_name,
            avatar: discordUser.avatar,
            roles: member.roles,
            updatedAt: new Date(),
          },
        },
        { upsert: true }
      );

      return res.redirect(`/?token=${tokens.access_token}&discord_id=${discordUser.id}`);
    }

    // ── AUTH: Get user info ──────────────────────────────────────────────────
    if (path === "/api/auth/me" && req.method === "GET") {
      const token = req.headers.authorization?.replace("Bearer ", "");
      if (!token) return res.status(401).json({ error: "No token" });

      const db = await getDb();
      const session = await db.collection("sessions").findOne({ accessToken: token });
      if (!session) return res.status(401).json({ error: "Invalid session" });

      const { level: highestLevel, rank: highestRank, roles } = await getMemberLevel(session.discordId);

      const agent = await db.collection("agents").findOne({ discordId: session.discordId });
      const staticPlate = PLATES_MAP[session.discordId] || null;
      const plate = agent?.plate || staticPlate;

      // Auto-sync rank if agent exists and rank changed
      if (agent && highestRank && agent.rank !== highestRank.name) {
        await db.collection("agents").updateOne(
          { discordId: session.discordId },
          { $set: { rank: highestRank.name, rankLevel: highestRank.level, updatedAt: new Date() } }
        );
        agent.rank = highestRank.name;
        agent.rankLevel = highestRank.level;
        // Update nickname
        const firstName = (agent.fullName || "").trim().split(" ")[0];
        const isMossoPractiques = highestRank.level === 1;
        const nickname = buildNickname(highestRank.name, firstName, plate, isMossoPractiques);
        try { await setDiscordNickname(session.discordId, nickname); } catch {}
      }

      return res.status(200).json({
        discordId: session.discordId,
        username: session.username,
        globalName: session.globalName,
        avatar: session.avatar,
        roles,
        rank: highestRank,
        isSuperiorScale: highestLevel >= SUPERIOR_SCALE_MIN_LEVEL,
        plate,
        agent,
      });
    }

    // ── AGENT: Register / Complete profile ──────────────────────────────────
    if (path === "/api/agent/register" && req.method === "POST") {
      const token = req.headers.authorization?.replace("Bearer ", "");
      const db = await getDb();
      const session = await db.collection("sessions").findOne({ accessToken: token });
      if (!session) return res.status(401).json({ error: "Unauthorized" });

      const body = req.body || (await parseBody(req));
      const { fullName, dni, robloxUsername } = body;
      if (!fullName || !dni || !robloxUsername) return res.status(400).json({ error: "Faltan datos" });

      const robloxData = await getRobloxAvatar(robloxUsername);
      if (!robloxData) return res.status(400).json({ error: "Usuario de Roblox no encontrado" });

      const { level: highestLevel, rank: highestRankObj } = await getMemberLevel(session.discordId);
      const highestRank = highestRankObj || { name: "Mosso en Pràctiques", level: 1 };

      let plate = PLATES_MAP[session.discordId] || null;
      let isNewPlate = false;
      if (!plate) {
        plate = await getNextPlateNumber(db);
        isNewPlate = true;
      }

      const firstName = fullName.trim().split(" ")[0];
      const isMossoPractiques = highestRank.level === 1;
      const nickname = buildNickname(highestRank.name, firstName, plate, isMossoPractiques);

      const agentData = {
        discordId: session.discordId,
        discordUsername: session.username,
        fullName,
        dni,
        robloxUsername,
        robloxId: robloxData.robloxId,
        robloxAvatar: robloxData.url,
        plate,
        rank: highestRank.name,
        rankLevel: highestRank.level,
        createdAt: new Date(),
        updatedAt: new Date(),
      };

      await db.collection("agents").updateOne(
        { discordId: session.discordId },
        { $set: agentData },
        { upsert: true }
      );

      try { await setDiscordNickname(session.discordId, nickname); } catch {}

      if (isNewPlate) {
        const mainEmbed = {
          color: 0x1a3a6b,
          title: "📋 NUEVA PLACA ASIGNADA",
          fields: [
            { name: "Usuario", value: `<@${session.discordId}> \`${session.username}\``, inline: true },
            { name: "Placa", value: `**${plate}**`, inline: true },
          ],
          thumbnail: { url: robloxData.url },
          timestamp: new Date().toISOString(),
        };
        const infoEmbed = {
          color: 0x1a3a6b,
          title: "¿Qué es el TIP y cuando te lo pueden solicitar?",
          description:
            "La identificación policial es la forma en que un agente acredita oficialmente que pertenece a las Fuerzas y Cuerpos de Seguridad...",
          image: {
            url: "https://media.discordapp.net/attachments/1495910520182673559/1512423936900599908/image.png?ex=6a240a0e&is=6a22b88e&hm=2513dc0fed668f5d6b357f593b71252e49a3ea4d641feb795ffadce59dfdf8f9&=&format=webp&quality=lossless",
          },
        };
        const msg = await sendDiscordEmbed(PLATES_CHANNEL_ID, [mainEmbed, infoEmbed]);
        await db.collection("agents").updateOne(
          { discordId: session.discordId },
          { $set: { plateMessageId: msg.id } }
        );
      }

      return res.status(200).json({ success: true, plate, agent: agentData });
    }

    // ── FICHAJE: Iniciar servicio ────────────────────────────────────────────
    if (path === "/api/service/start" && req.method === "POST") {
      const token = req.headers.authorization?.replace("Bearer ", "");
      const db = await getDb();
      const session = await db.collection("sessions").findOne({ accessToken: token });
      if (!session) return res.status(401).json({ error: "Unauthorized" });

      const active = await db.collection("services").findOne({
        discordId: session.discordId,
        status: { $in: ["active", "paused"] },
      });
      if (active) return res.status(400).json({ error: "Ya tienes un servicio activo" });

      const service = {
        discordId: session.discordId,
        startTime: new Date(),
        endTime: null,
        totalSeconds: 0,
        activeSeconds: 0,
        pauseSeconds: 0,
        status: "active",
        pauses: [],
        notes: "",
        multas: [],
        arrestos: [],
        createdAt: new Date(),
      };

      const result = await db.collection("services").insertOne(service);
      return res.status(200).json({ success: true, serviceId: result.insertedId });
    }

    // ── FICHAJE: Pausar/Reanudar ────────────────────────────────────────────
    if (path === "/api/service/pause" && req.method === "POST") {
      const token = req.headers.authorization?.replace("Bearer ", "");
      const db = await getDb();
      const session = await db.collection("sessions").findOne({ accessToken: token });
      if (!session) return res.status(401).json({ error: "Unauthorized" });

      const service = await db.collection("services").findOne({
        discordId: session.discordId,
        status: { $in: ["active", "paused"] },
      });
      if (!service) return res.status(404).json({ error: "No hay servicio activo" });

      const now = new Date();
      if (service.status === "active") {
        await db.collection("services").updateOne(
          { _id: service._id },
          {
            $set: { status: "paused", lastPauseStart: now },
            $push: { pauses: { start: now, end: null } },
          }
        );
        return res.status(200).json({ success: true, status: "paused" });
      } else {
        const pauseDuration = Math.floor((now - new Date(service.lastPauseStart)) / 1000);
        const pauses = service.pauses;
        pauses[pauses.length - 1].end = now;
        await db.collection("services").updateOne(
          { _id: service._id },
          {
            $set: { status: "active", lastPauseStart: null, pauses },
            $inc: { pauseSeconds: pauseDuration },
          }
        );
        return res.status(200).json({ success: true, status: "active" });
      }
    }

    // ── FICHAJE: Finalizar ──────────────────────────────────────────────────
    if (path === "/api/service/end" && req.method === "POST") {
      const token = req.headers.authorization?.replace("Bearer ", "");
      const db = await getDb();
      const session = await db.collection("sessions").findOne({ accessToken: token });
      if (!session) return res.status(401).json({ error: "Unauthorized" });

      const service = await db.collection("services").findOne({
        discordId: session.discordId,
        status: { $in: ["active", "paused"] },
      });
      if (!service) return res.status(404).json({ error: "No hay servicio activo" });

      const now = new Date();
      const totalSeconds = Math.floor((now - new Date(service.startTime)) / 1000);
      let pauseSeconds = service.pauseSeconds || 0;
      if (service.status === "paused" && service.lastPauseStart) {
        pauseSeconds += Math.floor((now - new Date(service.lastPauseStart)) / 1000);
      }
      const activeSeconds = totalSeconds - pauseSeconds;

      await db.collection("services").updateOne(
        { _id: service._id },
        { $set: { status: "finished", endTime: now, totalSeconds, activeSeconds, pauseSeconds } }
      );

      return res.status(200).json({ success: true, totalSeconds, activeSeconds, pauseSeconds });
    }

    // ── FICHAJE: Servicio activo ─────────────────────────────────────────────
    if (path === "/api/service/active" && req.method === "GET") {
      const token = req.headers.authorization?.replace("Bearer ", "");
      const db = await getDb();
      const session = await db.collection("sessions").findOne({ accessToken: token });
      if (!session) return res.status(401).json({ error: "Unauthorized" });

      const service = await db.collection("services").findOne({
        discordId: session.discordId,
        status: { $in: ["active", "paused"] },
      });
      return res.status(200).json({ service });
    }

    // ── SERVICIOS ACTIVOS (público) ──────────────────────────────────────────
    if (path === "/api/services/active-all" && req.method === "GET") {
      const db = await getDb();
      const activeServices = await db.collection("services")
        .find({ status: { $in: ["active", "paused"] } })
        .toArray();

      const withAgents = await Promise.all(
        activeServices.map(async (s) => {
          const agent = await db.collection("agents").findOne({ discordId: s.discordId });
          return {
            discordId: s.discordId,
            startTime: s.startTime,
            status: s.status,
            pauseSeconds: s.pauseSeconds || 0,
            lastPauseStart: s.lastPauseStart || null,
            multas: s.multas?.length || 0,
            arrestos: s.arrestos?.length || 0,
            plate: agent?.plate || "—",
            fullName: agent?.fullName || "Desconocido",
            rank: agent?.rank || "—",
            robloxAvatar: agent?.robloxAvatar || null,
          };
        })
      );
      return res.status(200).json({ active: withAgents });
    }

    // ── HISTORIAL: Mis servicios ─────────────────────────────────────────────
    if (path === "/api/services/mine" && req.method === "GET") {
      const token = req.headers.authorization?.replace("Bearer ", "");
      const db = await getDb();
      const session = await db.collection("sessions").findOne({ accessToken: token });
      if (!session) return res.status(401).json({ error: "Unauthorized" });

      const services = await db.collection("services")
        .find({ discordId: session.discordId, status: "finished" })
        .sort({ createdAt: -1 })
        .limit(50)
        .toArray();

      const totalActive = services.reduce((acc, s) => acc + (s.activeSeconds || 0), 0);
      return res.status(200).json({ services, totalActive });
    }

    // ── TOP: Ranking ─────────────────────────────────────────────────────────
    if (path === "/api/services/top" && req.method === "GET") {
      const db = await getDb();
      const top = await db.collection("services").aggregate([
        { $match: { status: "finished" } },
        { $group: { _id: "$discordId", totalActive: { $sum: "$activeSeconds" }, count: { $sum: 1 } } },
        { $sort: { totalActive: -1 } },
        { $limit: 20 },
      ]).toArray();

      const withAgents = await Promise.all(
        top.map(async (entry) => {
          const agent = await db.collection("agents").findOne({ discordId: entry._id });
          return {
            discordId: entry._id,
            totalActive: entry.totalActive,
            count: entry.count,
            plate: agent?.plate || "Sin placa",
            fullName: agent?.fullName || "Desconocido",
            rank: agent?.rank || "-",
            robloxAvatar: agent?.robloxAvatar || null,
          };
        })
      );

      return res.status(200).json({ top: withAgents });
    }

    // ── REGISTRAR MULTA/ARRESTO ──────────────────────────────────────────────
    if (path === "/api/service/registro" && req.method === "POST") {
      const token = req.headers.authorization?.replace("Bearer ", "");
      const db = await getDb();
      const session = await db.collection("sessions").findOne({ accessToken: token });
      if (!session) return res.status(401).json({ error: "Unauthorized" });

      const body = req.body || (await parseBody(req));
      const { tipo, nombreCiudadano, motivo, pruebas, notas, serviceId } = body;
      if (!tipo || !nombreCiudadano || !motivo) return res.status(400).json({ error: "Faltan datos" });

      const registro = {
        discordId: session.discordId,
        serviceId: serviceId || null,
        tipo, // 'multa' | 'arresto'
        nombreCiudadano,
        motivo,
        pruebas: pruebas || [],
        notas: notas || "",
        createdAt: new Date(),
      };

      const result = await db.collection("registros").insertOne(registro);

      // Attach to active service if exists
      if (serviceId) {
        const field = tipo === "multa" ? "multas" : "arrestos";
        await db.collection("services").updateOne(
          { _id: new ObjectId(serviceId) },
          { $push: { [field]: result.insertedId.toString() } }
        );
      } else {
        // Try attach to current active service
        const activeService = await db.collection("services").findOne({
          discordId: session.discordId,
          status: { $in: ["active", "paused"] },
        });
        if (activeService) {
          const field = tipo === "multa" ? "multas" : "arrestos";
          await db.collection("services").updateOne(
            { _id: activeService._id },
            { $push: { [field]: result.insertedId.toString() } }
          );
        }
      }

      return res.status(200).json({ success: true, id: result.insertedId });
    }

    // ── MIS REGISTROS ────────────────────────────────────────────────────────
    if (path === "/api/registros/mine" && req.method === "GET") {
      const token = req.headers.authorization?.replace("Bearer ", "");
      const db = await getDb();
      const session = await db.collection("sessions").findOne({ accessToken: token });
      if (!session) return res.status(401).json({ error: "Unauthorized" });

      const registros = await db.collection("registros")
        .find({ discordId: session.discordId })
        .sort({ createdAt: -1 })
        .limit(100)
        .toArray();

      return res.status(200).json({ registros });
    }

    // ── ADMIN: Todos los servicios ───────────────────────────────────────────
    if (path === "/api/admin/services" && req.method === "GET") {
      const token = req.headers.authorization?.replace("Bearer ", "");
      const db = await getDb();
      const session = await db.collection("sessions").findOne({ accessToken: token });
      if (!session) return res.status(401).json({ error: "Unauthorized" });

      const { level } = await getMemberLevel(session.discordId);
      if (level < SUPERIOR_SCALE_MIN_LEVEL) return res.status(403).json({ error: "No autorizado" });

      const targetId = url.searchParams.get("discordId");
      const query = targetId ? { discordId: targetId } : {};
      const services = await db.collection("services")
        .find(query)
        .sort({ createdAt: -1 })
        .limit(100)
        .toArray();

      return res.status(200).json({ services });
    }

    // ── ADMIN: Editar servicio ───────────────────────────────────────────────
    if (path === "/api/admin/service/edit" && req.method === "PATCH") {
      const token = req.headers.authorization?.replace("Bearer ", "");
      const db = await getDb();
      const session = await db.collection("sessions").findOne({ accessToken: token });
      if (!session) return res.status(401).json({ error: "Unauthorized" });

      const { level } = await getMemberLevel(session.discordId);
      if (level < SUPERIOR_SCALE_MIN_LEVEL) return res.status(403).json({ error: "No autorizado" });

      const body = req.body || (await parseBody(req));
      const { serviceId, activeSeconds, reduceSeconds, cancelled, motivo } = body;

      const service = await db.collection("services").findOne({ _id: new ObjectId(serviceId) });
      if (!service) return res.status(404).json({ error: "Servicio no encontrado" });

      let finalActiveSeconds = activeSeconds;
      if (reduceSeconds !== undefined) {
        finalActiveSeconds = Math.max(0, (service.activeSeconds || 0) - parseInt(reduceSeconds));
      }

      if (cancelled) {
        await db.collection("services").updateOne(
          { _id: new ObjectId(serviceId) },
          { $set: { status: "cancelled", cancelMotivo: motivo, cancelledBy: session.discordId } }
        );
      } else {
        await db.collection("services").updateOne(
          { _id: new ObjectId(serviceId) },
          { $set: { activeSeconds: parseInt(finalActiveSeconds), editedBy: session.discordId, editMotivo: motivo } }
        );
      }

const msg = cancelled
        ? `⚠️ Tu servicio del ${new Date(service.startTime).toLocaleDateString("es")} ha sido **anulado**.\n📝 Motivo: ${motivo}`
        : `ℹ️ Tu servicio del ${new Date(service.startTime).toLocaleDateString("es")} ha sido **modificado**.\n⏱️ Nuevo tiempo activo: ${formatSeconds(parseInt(finalActiveSeconds))}\n📝 Motivo: ${motivo}`;

      try { await sendDiscordDM(service.discordId, msg); } catch {}

      const adminAgentLog = await db.collection("agents").findOne({ discordId: session.discordId });
      const targetAgentLog = await db.collection("agents").findOne({ discordId: service.discordId });
      await saveLog(db, {
        type: cancelled ? 'service_cancel' : 'service_edit',
        adminDiscordId: session.discordId,
        adminName: adminAgentLog?.fullName || session.discordId,
        targetDiscordId: service.discordId,
        targetName: targetAgentLog?.fullName || service.discordId,
   description: cancelled
          ? `Servicio anulado. Motivo: ${motivo}`
          : `Servicio editado — restados ${formatSeconds(body.reduceSeconds || 0)}. Nuevo activo: ${formatSeconds(parseInt(finalActiveSeconds))}. Motivo: ${motivo}`,
      });

      return res.status(200).json({ success: true, newActiveSeconds: finalActiveSeconds });
    }

    // ── ADMIN: Listar agentes ────────────────────────────────────────────────
    if (path === "/api/admin/agents" && req.method === "GET") {
      const token = req.headers.authorization?.replace("Bearer ", "");
      const db = await getDb();
      const session = await db.collection("sessions").findOne({ accessToken: token });
      if (!session) return res.status(401).json({ error: "Unauthorized" });

      const { level } = await getMemberLevel(session.discordId);
      if (level < SUPERIOR_SCALE_MIN_LEVEL) return res.status(403).json({ error: "No autorizado" });

      const agents = await db.collection("agents").find({}).toArray();

      // Enrich with stats
      const enriched = await Promise.all(
        agents.map(async (a) => {
          const services = await db.collection("services")
            .find({ discordId: a.discordId, status: "finished" })
            .toArray();
          const totalActive = services.reduce((acc, s) => acc + (s.activeSeconds || 0), 0);
          const totalMultas = await db.collection("registros")
            .countDocuments({ discordId: a.discordId, tipo: "multa" });
          const totalArrestos = await db.collection("registros")
            .countDocuments({ discordId: a.discordId, tipo: "arresto" });
          const sanctions = await db.collection("sanciones")
            .find({ targetDiscordId: a.discordId })
            .sort({ createdAt: -1 })
            .toArray();
          return { ...a, totalActive, serviceCount: services.length, totalMultas, totalArrestos, sanctions };
        })
      );

      return res.status(200).json({ agents: enriched });
    }

    // ── ADMIN: Info de un agente ─────────────────────────────────────────────
    if (path === "/api/admin/agent" && req.method === "GET") {
      const token = req.headers.authorization?.replace("Bearer ", "");
      const db = await getDb();
      const session = await db.collection("sessions").findOne({ accessToken: token });
      if (!session) return res.status(401).json({ error: "Unauthorized" });

      const { level } = await getMemberLevel(session.discordId);
      if (level < SUPERIOR_SCALE_MIN_LEVEL) return res.status(403).json({ error: "No autorizado" });

      const targetId = url.searchParams.get("discordId");
      const agent = await db.collection("agents").findOne({ discordId: targetId });
      if (!agent) return res.status(404).json({ error: "Agente no encontrado" });

      const services = await db.collection("services")
        .find({ discordId: targetId })
        .sort({ createdAt: -1 })
        .limit(50)
        .toArray();

      const registros = await db.collection("registros")
        .find({ discordId: targetId })
        .sort({ createdAt: -1 })
        .limit(100)
        .toArray();

      const sanctions = await db.collection("sanciones")
        .find({ targetDiscordId: targetId })
        .sort({ createdAt: -1 })
        .toArray();

      const promotions = await db.collection("promotions")
        .find({ targetDiscordId: targetId })
        .sort({ createdAt: -1 })
        .toArray();

      return res.status(200).json({ agent, services, registros, sanctions, promotions });
    }

    // ── ADMIN: Ascenso/Descenso ──────────────────────────────────────────────
    if (path === "/api/admin/promotion" && req.method === "POST") {
      const token = req.headers.authorization?.replace("Bearer ", "");
      const db = await getDb();
      const session = await db.collection("sessions").findOne({ accessToken: token });
      if (!session) return res.status(401).json({ error: "Unauthorized" });

      const adminAgent = await db.collection("agents").findOne({ discordId: session.discordId });
      const { level: adminLevel } = await getMemberLevel(session.discordId);
      if (adminLevel < SUPERIOR_SCALE_MIN_LEVEL) return res.status(403).json({ error: "No autorizado" });

      const body = req.body || (await parseBody(req));
      const { targetDiscordId, newRankId, motivo, tipo } = body; // tipo: 'ascenso' | 'descenso'
      if (!targetDiscordId || !newRankId || !motivo || !tipo) return res.status(400).json({ error: "Faltan datos" });

      const newRank = RANK_ROLES.find(r => r.id === newRankId);
      if (!newRank) return res.status(400).json({ error: "Rango no válido" });

      const targetAgent = await db.collection("agents").findOne({ discordId: targetDiscordId });
      if (!targetAgent) return res.status(404).json({ error: "Agente no encontrado" });

      const { roles: currentRoles, rank: currentRank } = await getMemberLevel(targetDiscordId);

      // Remove all rank roles, add new one
      for (const rankRole of RANK_ROLES) {
        if (currentRoles.includes(rankRole.id)) {
          try { await removeDiscordRole(targetDiscordId, rankRole.id); } catch {}
        }
      }
      try { await addDiscordRole(targetDiscordId, newRankId); } catch {}

      // Update DB
      await db.collection("agents").updateOne(
        { discordId: targetDiscordId },
        { $set: { rank: newRank.name, rankLevel: newRank.level, updatedAt: new Date() } }
      );

      // Update nickname
      const firstName = (targetAgent.fullName || "").trim().split(" ")[0];
      const isMossoPractiques = newRank.level === 1;
      const nickname = buildNickname(newRank.name, firstName, targetAgent.plate, isMossoPractiques);
      try { await setDiscordNickname(targetDiscordId, nickname); } catch {}

      // Save promotion record
  await db.collection("promotions").insertOne({
        targetDiscordId,
        adminDiscordId: session.discordId,
        oldRank: currentRank?.name || "—",
        newRank: newRank.name,
        motivo,
        tipo,
        createdAt: new Date(),
      });

      await saveLog(db, {
        type: 'promotion',
        adminDiscordId: session.discordId,
        adminName: adminAgent?.fullName || session.username,
        targetDiscordId,
        targetName: targetAgent.fullName,
        description: `${tipo === 'ascenso' ? '⬆️ Ascenso' : '⬇️ Descenso'}: ${currentRank?.name || '—'} → ${newRank.name}. Motivo: ${motivo}`,
      });
      
      const isAscenso = tipo === "ascenso";
      const color = isAscenso ? 0x2da84a : 0xd94040;
      const image = isAscenso
        ? "https://media.discordapp.net/attachments/1488824374889943111/1512531218992992419/image.png?ex=6a246df8&is=6a231c78&hm=242aec7b0a5ac3c1462216e677b0c14fe94b56d4bdca4238fd418391db9bd3fd&=&format=webp&quality=lossless"
        : "https://media.discordapp.net/attachments/1488824374889943111/1512531599680471250/image.png?ex=6a246e52&is=6a231cd2&hm=aa63b2cc16b8126457c30a1bb328dbacfb6c3abb02fdd406018f809096309774&=&format=webp&quality=lossless";

      const embed = {
        color,
        title: isAscenso ? "🏅 ASCENSO" : "⬇️ DESCENSO",
        image: { url: image },
        fields: [
          { name: "Agente", value: `<@${targetDiscordId}> — \`${targetAgent.plate}\``, inline: true },
          { name: "Nombre", value: targetAgent.fullName, inline: true },
          { name: "\u200b", value: "\u200b", inline: false },
          { name: "Rango Anterior", value: currentRank?.name || "—", inline: true },
          { name: "Nuevo Rango", value: newRank.name, inline: true },
          { name: "Motivo", value: motivo, inline: false },
          { name: "Autorizado por", value: `<@${session.discordId}> — ${adminAgent?.fullName || session.username}`, inline: false },
        ],
        thumbnail: targetAgent.robloxAvatar ? { url: targetAgent.robloxAvatar } : undefined,
        timestamp: new Date().toISOString(),
        footer: { text: "Sistema PDA — Mossos d'Esquadra" },
      };

      try { await sendDiscordEmbed(PROMOTIONS_CHANNEL_ID, [embed]); } catch {}

      // DM to agent
      const dmEmbed = {
        ...embed,
        title: isAscenso ? "🏅 Has sido ascendido" : "⬇️ Has sido descendido de rango",
        description: `Tu nuevo rango es **${newRank.name}**`,
      };
      try { await sendDiscordDM(targetDiscordId, null, [dmEmbed]); } catch {}

      return res.status(200).json({ success: true });
    }

    // ── ADMIN: Sanciones ─────────────────────────────────────────────────────
    if (path === "/api/admin/sanction" && req.method === "POST") {
      const token = req.headers.authorization?.replace("Bearer ", "");
      const db = await getDb();
      const session = await db.collection("sessions").findOne({ accessToken: token });
      if (!session) return res.status(401).json({ error: "Unauthorized" });

      const adminAgent = await db.collection("agents").findOne({ discordId: session.discordId });
      const { level: adminLevel } = await getMemberLevel(session.discordId);
      if (adminLevel < SUPERIOR_SCALE_MIN_LEVEL) return res.status(403).json({ error: "No autorizado" });

      const body = req.body || (await parseBody(req));
      const { targetDiscordId, motivo, pruebas, tipo, ambito } = body; // ambito: 'ic' | 'ooc'
      if (!targetDiscordId || !motivo || !tipo || !ambito) return res.status(400).json({ error: "Faltan datos" });

      const targetAgent = await db.collection("agents").findOne({ discordId: targetDiscordId });
      if (!targetAgent) return res.status(404).json({ error: "Agente no encontrado" });

      // Count existing sanctions
      const existingSanctions = await db.collection("sanciones")
        .countDocuments({ targetDiscordId, status: "active" });
      const sanctionNumber = existingSanctions + 1;

      const sanction = {
        targetDiscordId,
        adminDiscordId: session.discordId,
        motivo,
        pruebas: pruebas || [],
        tipo, // descripción del tipo
        ambito, // 'ic' | 'ooc'
        sanctionNumber,
        status: "active",
        createdAt: new Date(),
      };

      const result = await db.collection("sanciones").insertOne(sanction);

      await saveLog(db, {
        type: 'sanction',
        adminDiscordId: session.discordId,
        adminName: adminAgent?.fullName || session.username,
        targetDiscordId,
        targetName: targetAgent.fullName,
        description: `Sanción ${sanctionNumber}/3 — ${ambito.toUpperCase()} — ${tipo}. Motivo: ${motivo}`,
      });
      
      // Handle roles
      const { roles: targetRoles } = await getMemberLevel(targetDiscordId);
      let roleAdded = null;
      if (sanctionNumber === 1) {
        if (!targetRoles.includes(SANCTION_ROLE_1)) {
          try { await addDiscordRole(targetDiscordId, SANCTION_ROLE_1); roleAdded = "Sanción 1"; } catch {}
        }
      } else if (sanctionNumber === 2) {
        if (!targetRoles.includes(SANCTION_ROLE_2)) {
          try { await addDiscordRole(targetDiscordId, SANCTION_ROLE_2); roleAdded = "Sanción 2"; } catch {}
        }
      } else if (sanctionNumber === 3) {
        if (!targetRoles.includes(SANCTION_ROLE_3)) {
          try { await addDiscordRole(targetDiscordId, SANCTION_ROLE_3); roleAdded = "Sanción 3"; } catch {}
        }
      }

      const pruebasText = pruebas?.length
        ? pruebas.map((p, i) => `[Prueba ${i + 1}](${p})`).join(" · ")
        : "Sin pruebas adjuntas";

      const embed = {
        color: 0xd94040,
        title: `🚨 SANCIÓN ${sanctionNumber}/3 — ${ambito.toUpperCase()}`,
        image: {
          url: "https://media.discordapp.net/attachments/1488824374889943111/1512531863640735744/image.png?ex=6a246e91&is=6a231d11&hm=96449e90f129524d73252598537da45d9426457d6df3ba708a11bd95c9804763&=&format=webp&quality=lossless",
        },
        fields: [
          { name: "Agente", value: `<@${targetDiscordId}> — \`${targetAgent.plate}\``, inline: true },
          { name: "Nombre", value: targetAgent.fullName, inline: true },
          { name: "\u200b", value: "\u200b", inline: false },
          { name: "Tipo", value: tipo, inline: true },
          { name: "Ámbito", value: ambito === "ic" ? "🔵 In-Character (IC)" : "🔴 Out-of-Character (OOC)", inline: true },
          { name: "Motivo", value: motivo, inline: false },
          { name: "Pruebas", value: pruebasText, inline: false },
          { name: "Sancionado por", value: `<@${session.discordId}> — ${adminAgent?.fullName || session.username}`, inline: false },
          { name: "Rol asignado", value: roleAdded || `Sin rol (${sanctionNumber}/3)`, inline: false },
        ],
        thumbnail: targetAgent.robloxAvatar ? { url: targetAgent.robloxAvatar } : undefined,
        timestamp: new Date().toISOString(),
        footer: { text: "Sistema PDA — Mossos d'Esquadra" },
      };

      try { await sendDiscordEmbed(SANCTIONS_CHANNEL_ID, [embed]); } catch {}

      const dmEmbed = {
        ...embed,
        title: `⚠️ Has recibido una sanción (${sanctionNumber}/3)`,
      };
      try { await sendDiscordDM(targetDiscordId, null, [dmEmbed]); } catch {}

      return res.status(200).json({ success: true, sanctionNumber });
    }

    // ── ADMIN: Ver sanciones de agente ───────────────────────────────────────
    if (path === "/api/admin/sanctions" && req.method === "GET") {
      const token = req.headers.authorization?.replace("Bearer ", "");
      const db = await getDb();
      const session = await db.collection("sessions").findOne({ accessToken: token });
      if (!session) return res.status(401).json({ error: "Unauthorized" });

      const { level } = await getMemberLevel(session.discordId);
      if (level < SUPERIOR_SCALE_MIN_LEVEL) return res.status(403).json({ error: "No autorizado" });

      const targetId = url.searchParams.get("discordId");
      const query = targetId ? { targetDiscordId: targetId } : {};
      const sanctions = await db.collection("sanciones")
        .find(query)
        .sort({ createdAt: -1 })
        .toArray();

      return res.status(200).json({ sanctions });
    }
    // ── ADMIN: Pausar/Reanudar servicio de un agente ─────────────────────────
if (path === "/api/admin/service/pause" && req.method === "POST") {
  const token = req.headers.authorization?.replace("Bearer ", "");
  const db = await getDb();
  const session = await db.collection("sessions").findOne({ accessToken: token });
  if (!session) return res.status(401).json({ error: "Unauthorized" });
  const { level } = await getMemberLevel(session.discordId);
  if (level < SUPERIOR_SCALE_MIN_LEVEL) return res.status(403).json({ error: "No autorizado" });
  const body = req.body || (await parseBody(req));
  const { discordId: targetId, serviceId } = body;
  const service = await db.collection("services").findOne({ _id: new ObjectId(serviceId) });
  if (!service) return res.status(404).json({ error: "Servicio no encontrado" });
  const now = new Date();
  let newStatus;
  if (service.status === "active") {
    await db.collection("services").updateOne(
      { _id: new ObjectId(serviceId) },
      { $set: { status: "paused", lastPauseStart: now }, $push: { pauses: { start: now, end: null } } }
    );
    newStatus = "paused";
    try { await sendDiscordDM(targetId, `⏸ Tu servicio ha sido **pausado** por un administrador.`); } catch {}
  } else {
    const pauseDuration = Math.floor((now - new Date(service.lastPauseStart)) / 1000);
    const pauses = service.pauses;
    pauses[pauses.length - 1].end = now;
    await db.collection("services").updateOne(
      { _id: new ObjectId(serviceId) },
      { $set: { status: "active", lastPauseStart: null, pauses }, $inc: { pauseSeconds: pauseDuration } }
    );
    newStatus = "active";
    try { await sendDiscordDM(targetId, `▶ Tu servicio ha sido **reanudado** por un administrador.`); } catch {}
  }
const adminAgentLog = await db.collection("agents").findOne({ discordId: session.discordId });
      const targetAgentLog = await db.collection("agents").findOne({ discordId: targetId });
      await saveLog(db, {
        type: 'service_pause',
        adminDiscordId: session.discordId,
        adminName: adminAgentLog?.fullName || session.discordId,
        targetDiscordId: targetId,
        targetName: targetAgentLog?.fullName || targetId,
        description: `Servicio ${newStatus === 'paused' ? 'pausado' : 'reanudado'} por administrador`,
      });
      return res.status(200).json({ success: true, status: newStatus });
    
    return res.status(404).json({ error: "Not found" });
  } catch (err) {
    console.error(err);
    return res.status(500).json({ error: err.message });
  }
};

function formatSeconds(s) {
  const h = Math.floor(s / 3600);
  const m = Math.floor((s % 3600) / 60);
  const sec = s % 60;
  return `${h}h ${m}m ${sec}s`;
}

async function parseBody(req) {
  return new Promise((resolve) => {
    let body = "";
    req.on("data", (chunk) => (body += chunk));
    req.on("end", () => {
      try { resolve(JSON.parse(body)); } catch { resolve({}); }
    });
  });
}
