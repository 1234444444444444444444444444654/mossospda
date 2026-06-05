const { MongoClient } = require("mongodb");

const DISCORD_CLIENT_ID = "1488651862021509231";
const DISCORD_CLIENT_SECRET = "z0m5dk25kHxEX65q3AmeDXNnhXhMmQu4";
const GUILD_ID = "1484169356396204042";
const REQUIRED_ROLE = "1486761352017215600";
const PLATES_CHANNEL_ID = "1487706683684950138";

const RANK_ROLES = [
  { id: "MAJOR_ROLE_ID", name: "Major", level: 10 },
  { id: "INTENDENT_ROLE_ID", name: "Intendent", level: 9 },
  { id: "COMMISSIONER_ROLE_ID", name: "Comissari", level: 8 },
  { id: "INSPECTOR_ROLE_ID", name: "Inspector", level: 7 },
  { id: "SOTSINSPECTOR_ROLE_ID", name: "Sotsinspector", level: 6 },
  { id: "SERGENT_ROLE_ID", name: "Sergent", level: 5 },
  { id: "CAPORAL_ROLE_ID", name: "Caporal", level: 4 },
  { id: "AGENT_ROLE_ID", name: "Agent", level: 3 },
  { id: "MOSSO_ROLE_ID", name: "Mosso", level: 2 },
  { id: "PRACTIQUES_ROLE_ID", name: "Mosso en Pràctiques", level: 1 },
];

const SUPERIOR_SCALE_MIN_LEVEL = 6;

// Plates mapping discord_id -> plate
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
  if (!cachedClient) {
    cachedClient = new MongoClient(process.env.MONGODB_URI);
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

async function sendDiscordDM(userId, content) {
  const dmRes = await fetch(`https://discord.com/api/v10/users/@me/channels`, {
    method: "POST",
    headers: {
      Authorization: `Bot ${process.env.DISCORD_BOT_TOKEN}`,
      "Content-Type": "application/json",
    },
    body: JSON.stringify({ recipient_id: userId }),
  });
  const dm = await dmRes.json();
  await fetch(`https://discord.com/api/v10/channels/${dm.id}/messages`, {
    method: "POST",
    headers: {
      Authorization: `Bot ${process.env.DISCORD_BOT_TOKEN}`,
      "Content-Type": "application/json",
    },
    body: JSON.stringify({ content }),
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
  // Also check static map
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
    const userRes = await fetch(
      `https://users.roblox.com/v1/usernames/users`,
      {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ usernames: [username], excludeBannedUsers: false }),
      }
    );
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
      if (!memberRes.ok) {
        return res.redirect(`/?error=not_in_server`);
      }
      const member = await memberRes.json();
      if (!member.roles.includes(REQUIRED_ROLE)) {
        return res.redirect(`/?error=no_role`);
      }

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

console.log("✅ Redirecting with token:", tokens.access_token ? "YES" : "NO");
return res.redirect(redirectUrl);
    }

    // ── AUTH: Get user info ──────────────────────────────────────────────────
    if (path === "/api/auth/me" && req.method === "GET") {
      const token = req.headers.authorization?.replace("Bearer ", "");
      if (!token) return res.status(401).json({ error: "No token" });

      const db = await getDb();
      const session = await db.collection("sessions").findOne({ accessToken: token });
      if (!session) return res.status(401).json({ error: "Invalid session" });

      const memberRes = await fetch(
        `https://discord.com/api/v10/guilds/${GUILD_ID}/members/${session.discordId}`,
        { headers: { Authorization: `Bot ${process.env.DISCORD_BOT_TOKEN}` } }
      );
      const member = await memberRes.json();

      let highestRank = null;
      let highestLevel = 0;
      for (const role of RANK_ROLES) {
        if (member.roles.includes(role.id) && role.level > highestLevel) {
          highestLevel = role.level;
          highestRank = role;
        }
      }

      const agent = await db.collection("agents").findOne({ discordId: session.discordId });
      const staticPlate = PLATES_MAP[session.discordId] || null;
      const plate = agent?.plate || staticPlate;

      return res.status(200).json({
        discordId: session.discordId,
        username: session.username,
        globalName: session.globalName,
        avatar: session.avatar,
        roles: member.roles,
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
      if (!fullName || !dni || !robloxUsername) {
        return res.status(400).json({ error: "Faltan datos" });
      }

      const robloxData = await getRobloxAvatar(robloxUsername);
      if (!robloxData) return res.status(400).json({ error: "Usuario de Roblox no encontrado" });

      const memberRes = await fetch(
        `https://discord.com/api/v10/guilds/${GUILD_ID}/members/${session.discordId}`,
        { headers: { Authorization: `Bot ${process.env.DISCORD_BOT_TOKEN}` } }
      );
      const member = await memberRes.json();

      let highestRank = { name: "Mosso en Pràctiques", level: 1 };
      let highestLevel = 0;
      for (const role of RANK_ROLES) {
        if (member.roles.includes(role.id) && role.level > highestLevel) {
          highestLevel = role.level;
          highestRank = role;
        }
      }

      let plate = PLATES_MAP[session.discordId] || null;
      let isNewPlate = false;

      if (!plate) {
        plate = await getNextPlateNumber(db);
        isNewPlate = true;
      }

      const firstName = fullName.trim().split(" ")[0];
      const nickname = `Mosso.P I ${firstName} I ${plate}`;

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

      // Set Discord nickname
      try {
        await setDiscordNickname(session.discordId, nickname);
      } catch {}

      // Send embed to plates channel
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
            "La identificación policial es la forma en que un agente acredita oficialmente que pertenece a las Fuerzas y Cuerpos de Seguridad. Se realiza mostrando la TIP o cartera policial, donde aparece su número profesional y los elementos que legitiman su autoridad.\n\nUn ciudadano, incluido un detenido, puede solicitar esta identificación **cuando esté siendo objeto de una actuación policial**, especialmente si el agente va de paisano o existen dudas sobre su condición. El agente debe identificarse salvo en situaciones excepcionales que puedan poner en riesgo la operación o la seguridad.\n\nEl agente no está obligado a dar datos personales privados, sino únicamente su identificación profesional, normalmente mediante el número TIP.\n\nLa identificación policial garantiza transparencia, responsabilidad y control legal sobre la actuación de la autoridad dentro del Estado de derecho.",
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
        createdAt: new Date(),
      };

      const result = await db.collection("services").insertOne(service);
      return res.status(200).json({ success: true, serviceId: result.insertedId });
    }

    // ── FICHAJE: Pausar/Reanudar servicio ────────────────────────────────────
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

    // ── FICHAJE: Finalizar servicio ──────────────────────────────────────────
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
        {
          $set: {
            status: "finished",
            endTime: now,
            totalSeconds,
            activeSeconds,
            pauseSeconds,
          },
        }
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

    // ── HISTORIAL: Mis servicios ─────────────────────────────────────────────
    if (path === "/api/services/mine" && req.method === "GET") {
      const token = req.headers.authorization?.replace("Bearer ", "");
      const db = await getDb();
      const session = await db.collection("sessions").findOne({ accessToken: token });
      if (!session) return res.status(401).json({ error: "Unauthorized" });

      const services = await db
        .collection("services")
        .find({ discordId: session.discordId, status: "finished" })
        .sort({ createdAt: -1 })
        .limit(50)
        .toArray();

      const totalActive = services.reduce((acc, s) => acc + (s.activeSeconds || 0), 0);
      return res.status(200).json({ services, totalActive });
    }

    // ── TOP: Ranking servicios ───────────────────────────────────────────────
    if (path === "/api/services/top" && req.method === "GET") {
      const db = await getDb();
      const top = await db
        .collection("services")
        .aggregate([
          { $match: { status: "finished" } },
          {
            $group: {
              _id: "$discordId",
              totalActive: { $sum: "$activeSeconds" },
              count: { $sum: 1 },
            },
          },
          { $sort: { totalActive: -1 } },
          { $limit: 20 },
        ])
        .toArray();

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

    // ── ADMIN: Todos los servicios (escala superior) ─────────────────────────
    if (path === "/api/admin/services" && req.method === "GET") {
      const token = req.headers.authorization?.replace("Bearer ", "");
      const db = await getDb();
      const session = await db.collection("sessions").findOne({ accessToken: token });
      if (!session) return res.status(401).json({ error: "Unauthorized" });

      const memberRes = await fetch(
        `https://discord.com/api/v10/guilds/${GUILD_ID}/members/${session.discordId}`,
        { headers: { Authorization: `Bot ${process.env.DISCORD_BOT_TOKEN}` } }
      );
      const member = await memberRes.json();

      let highestLevel = 0;
      for (const role of RANK_ROLES) {
        if (member.roles.includes(role.id) && role.level > highestLevel) {
          highestLevel = role.level;
        }
      }
      if (highestLevel < SUPERIOR_SCALE_MIN_LEVEL) {
        return res.status(403).json({ error: "No autorizado" });
      }

      const targetId = url.searchParams.get("discordId");
      const query = targetId ? { discordId: targetId } : {};
      const services = await db
        .collection("services")
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

      const memberRes = await fetch(
        `https://discord.com/api/v10/guilds/${GUILD_ID}/members/${session.discordId}`,
        { headers: { Authorization: `Bot ${process.env.DISCORD_BOT_TOKEN}` } }
      );
      const member = await memberRes.json();
      let highestLevel = 0;
      for (const role of RANK_ROLES) {
        if (member.roles.includes(role.id) && role.level > highestLevel) {
          highestLevel = role.level;
        }
      }
      if (highestLevel < SUPERIOR_SCALE_MIN_LEVEL) {
        return res.status(403).json({ error: "No autorizado" });
      }

      const body = req.body || (await parseBody(req));
      const { serviceId, activeSeconds, cancelled, motivo } = body;

      const { ObjectId } = require("mongodb");
      const service = await db.collection("services").findOne({ _id: new ObjectId(serviceId) });
      if (!service) return res.status(404).json({ error: "Servicio no encontrado" });

      if (cancelled) {
        await db.collection("services").updateOne(
          { _id: new ObjectId(serviceId) },
          { $set: { status: "cancelled", cancelMotivo: motivo, cancelledBy: session.discordId } }
        );
      } else {
        await db.collection("services").updateOne(
          { _id: new ObjectId(serviceId) },
          { $set: { activeSeconds: parseInt(activeSeconds), editedBy: session.discordId, editMotivo: motivo } }
        );
      }

      // Notify agent via DM
      const msg = cancelled
        ? `⚠️ Tu servicio del ${new Date(service.startTime).toLocaleDateString("es")} ha sido **anulado** por la escala superior.\n📝 Motivo: ${motivo}`
        : `ℹ️ Tu servicio del ${new Date(service.startTime).toLocaleDateString("es")} ha sido **modificado** por la escala superior.\n⏱️ Nuevo tiempo activo: ${formatSeconds(parseInt(activeSeconds))}\n📝 Motivo: ${motivo}`;

      try {
        await sendDiscordDM(service.discordId, msg);
      } catch {}

      return res.status(200).json({ success: true });
    }

    // ── AGENTS: Listar agentes (admin) ───────────────────────────────────────
    if (path === "/api/admin/agents" && req.method === "GET") {
      const token = req.headers.authorization?.replace("Bearer ", "");
      const db = await getDb();
      const session = await db.collection("sessions").findOne({ accessToken: token });
      if (!session) return res.status(401).json({ error: "Unauthorized" });

      const memberRes = await fetch(
        `https://discord.com/api/v10/guilds/${GUILD_ID}/members/${session.discordId}`,
        { headers: { Authorization: `Bot ${process.env.DISCORD_BOT_TOKEN}` } }
      );
      const member = await memberRes.json();
      let highestLevel = 0;
      for (const role of RANK_ROLES) {
        if (member.roles.includes(role.id) && role.level > highestLevel) {
          highestLevel = role.level;
        }
      }
      if (highestLevel < SUPERIOR_SCALE_MIN_LEVEL) {
        return res.status(403).json({ error: "No autorizado" });
      }

      const agents = await db.collection("agents").find({}).toArray();
      return res.status(200).json({ agents });
    }

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
      try {
        resolve(JSON.parse(body));
      } catch {
        resolve({});
      }
    });
  });
}
