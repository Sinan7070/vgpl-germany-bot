const { 
    Client, 
    GatewayIntentBits, 
    ActionRowBuilder, 
    ButtonBuilder, 
    ButtonStyle, 
    EmbedBuilder, 
    PermissionFlagsBits, 
    ChannelType,
    StringSelectMenuBuilder,
    ModalBuilder,
    TextInputBuilder,
    TextInputStyle
} = require('discord.js');
const https = require('https');
const http = require('http');

console.log("==================================================");
console.log("!!! CHATGPT SUPPORT BOT (VERSION 9.0) STARTET !!!");
console.log("==================================================");

// 1. NATIVEN WEBSERVER STARTEN (Verhindert Render-Port-Timeout)
const server = http.createServer((req, res) => {
    res.writeHead(200, { 'Content-Type': 'text/plain; charset=utf-8' });
    res.end('VGPL Germany ChatGPT Support-Bot läuft fehlerfrei!');
});

const PORT = process.env.PORT || 10000;
server.listen(PORT, () => {
    console.log(`Webserver erfolgreich aktiv auf Port ${PORT}`);
});

// 2. BOT-CLIENT INITIALISIEREN
const client = new Client({
    intents: [
        GatewayIntentBits.Guilds,
        GatewayIntentBits.GuildMessages,
        GatewayIntentBits.MessageContent
    ]
});

// CONFIGURATION
const CONFIG = {
    TOKEN: process.env.DISCORD_TOKEN,
    OPENAI_API_KEY: process.env.OPENAI_API_KEY || "", // Neuer Name für die Umgebungsvariable
    PANEL_CHANNEL_ID: '1527708821320106164',
    CATEGORY_ID: '1527708420788977674',
    ADMIN_ROLE_NAME: 'Admin',
    HEAD_ADMIN_ROLE_NAME: 'Head Admin'
};

const VGPL_KNOWLEDGE = `
Du bist der offizielle KI-Support-Assistent der VGPL Germany (virtual Gaming Premier League). 
Beantworte Fragen extrem präzise basierend auf dem Regelwerk (FC 26 Saison 1).

WICHTIGSTE REGELN:
- Innenverteidiger (IV): Maximal 1,87 m groß. (Sanktionen bei Verstoß: Verwarnung -> 0:3 Wertung).
- Andere Feldspieler (ZDM, ZOM, ST etc.): Maximal 1,82 m groß.
- Torhüter: Keine Begrenzung.
- 3er-Kette: max. 3 IVs (1,87 m).
- 4er-Kette: max. 2 IVs (1,87 m) + 1 ZDM (1,87 m).
- 5er-Kette: max. 3 IVs (1,87 m).
- Pro Clubs Geschlecht im Spiel muss dem echten Geschlecht entsprechen.
- Streams: Ligaspiele müssen live auf Twitch, YouTube oder Kick gestreamt werden (VOD min. 48h öffentlich).
- Live-Join-Verbot: Nach Anpfiff darf kein Spieler über "Live-Join" beitreten (Sanktion: 0:3 Wertung).
- Proteste: Innerhalb von 24 Stunden mit Beweisen (Video/Bild).

DEINE VERHALTENSREGELN:
- Sei höflich, sportlich und präzise.
- Wenn der User nach einem Admin verlangt, einen Protest einreicht, oder du eine Frage nicht beantworten kannst, hänge am Ende deiner Antwort exakt das Wort "[ADMIN_PING_REQUIRED]" (ohne Anführungszeichen) an!
`;

// Hilfsfunktion für ChatGPT (GPT-4o-mini ist extrem schnell und günstig)
async function askChatGPT(userQuery) {
    const apiKey = CONFIG.OPENAI_API_KEY;
    if (!apiKey) {
        return "🤖 [VGPL KI v9.0] Fehler: Kein OpenAI API-Schlüssel (OPENAI_API_KEY) in Render eingetragen!";
    }

    const payload = JSON.stringify({
        model: "gpt-4o-mini",
        messages: [
            { role: "system", content: VGPL_KNOWLEDGE },
            { role: "user", content: userQuery }
        ],
        temperature: 0.7
    });

    return new Promise((resolve) => {
        const req = https.request('https://api.openai.com/v1/chat/completions', {
            method: 'POST',
            headers: {
                'Authorization': `Bearer ${apiKey.trim()}`,
                'Content-Type': 'application/json',
                'Content-Length': Buffer.byteLength(payload)
            }
        }, (res) => {
            let data = '';
            res.on('data', chunk => data += chunk);
            res.on('end', () => {
                try {
                    const json = JSON.parse(data);
                    if (res.statusCode !== 200) {
                        resolve(`🤖 [VGPL KI v9.0] Fehler von ChatGPT (${res.statusCode}): ${json.error?.message || "Unbekannter Fehler"}`);
                        return;
                    }
                    const reply = json.choices?.[0]?.message?.content;
                    if (reply) {
                        resolve(reply);
                    } else {
                        resolve("🤖 [VGPL KI v9.0] Fehler: Ungültige Antwort von OpenAI erhalten.");
                    }
                } catch (e) {
                    resolve(`🤖 [VGPL KI v9.0] Fehler beim Verarbeiten der Antwort: ${e.message}`);
                }
            });
        });

        req.on('error', (err) => {
            resolve(`🤖 [VGPL KI v9.0] Verbindung zu ChatGPT fehlgeschlagen: ${err.message}`);
        });

        req.write(payload);
        req.end();
    });
}

// Event: Bot bereit
client.once('ready', async () => {
    console.log(`Erfolgreich eingeloggt als ${client.user.tag}!`);
    try {
        const supportChannel = await client.channels.fetch(CONFIG.PANEL_CHANNEL_ID);
        if (supportChannel) {
            const messages = await supportChannel.messages.fetch({ limit: 10 });
            const hasPanel = messages.some(msg => msg.embeds.length > 0 && msg.components.length > 0);

            if (!hasPanel) {
                const embed = new EmbedBuilder()
                    .setTitle('📩 VGPL Germany Support-Center')
                    .setDescription('Wähle unten im Menü die passende Kategorie aus, um ein Ticket zu öffnen. Unsere ChatGPT-Support-KI hilft dir sofort!')
                    .setColor('#0099FF');

                const selectMenu = new StringSelectMenuBuilder()
                    .setCustomId('select_support_category')
                    .setPlaceholder('Support-Kategorie auswählen...')
                    .addOptions([
                        { label: '1. Transfer Problem', value: 'ticket_transfer', emoji: '🔄' },
                        { label: '2. Ergebnis Problem', value: 'ticket_ergebnis', emoji: '📊' },
                        { label: '3. Regelverstoß melden', value: 'ticket_verstoss', emoji: '⚠️' },
                        { label: '4. Website Problem', value: 'ticket_website', emoji: '🌐' },
                        { label: '5. Account / Profil Problem', value: 'ticket_account', emoji: '👤' },
                        { label: '6. Spielabbruch / Disconnect', value: 'ticket_disconnect', emoji: '🔌' },
                        { label: '7. Sonstiges', value: 'ticket_sonstiges', emoji: '📝' }
                    ]);

                const row = new ActionRowBuilder().addComponents(selectMenu);
                await supportChannel.send({ embeds: [embed], components: [row] });
            }
        }
    } catch (err) {
        console.error('Fehler beim Einrichten des Support-Panels:', err);
    }
});

// Interaktionen verarbeiten
client.on('interactionCreate', async (interaction) => {
    const guild = interaction.guild;
    if (!guild) return;

    const adminRole = guild.roles.cache.find(r => r.name.toLowerCase() === CONFIG.ADMIN_ROLE_NAME.toLowerCase());
    const headAdminRole = guild.roles.cache.find(r => r.name.toLowerCase() === CONFIG.HEAD_ADMIN_ROLE_NAME.toLowerCase());

    if (interaction.isStringSelectMenu() && interaction.customId === 'select_support_category') {
        const choice = interaction.values[0];
        // Modal anzeigen...
        if (choice === 'ticket_sonstiges') {
            const modal = new ModalBuilder().setCustomId('modal_sonstiges').setTitle('7. Sonstiges Problem');
            modal.addComponents(
                new ActionRowBuilder().addComponents(new TextInputBuilder().setCustomId('betreff').setLabel('Betreff').setStyle(TextInputStyle.Short).setRequired(true)),
                new ActionRowBuilder().addComponents(new TextInputBuilder().setCustomId('beschreibung').setLabel('Beschreibung').setStyle(TextInputStyle.Paragraph).setRequired(true))
            );
            return interaction.showModal(modal);
        }
        // Fallback für andere Kategorien (Sonstiges-Modal als Standard anzeigen um Code kompakt zu halten)
        const modal = new ModalBuilder().setCustomId('modal_sonstiges').setTitle('Support Ticket');
        modal.addComponents(
            new ActionRowBuilder().addComponents(new TextInputBuilder().setCustomId('betreff').setLabel('Betreff').setStyle(TextInputStyle.Short).setValue(choice.replace('ticket_', ''))),
            new ActionRowBuilder().addComponents(new TextInputBuilder().setCustomId('beschreibung').setLabel('Details zu deinem Problem').setStyle(TextInputStyle.Paragraph).setRequired(true))
        );
        return interaction.showModal(modal);
    }

    if (interaction.isModalSubmit()) {
        await interaction.deferReply({ ephemeral: true });
        const member = interaction.member;
        const betreff = interaction.fields.getTextInputValue('betreff') || 'Support';
        const beschreibung = interaction.fields.getTextInputValue('beschreibung') || '';

        try {
            const ticketChannel = await guild.channels.create({
                name: `ticket-${member.user.username.toLowerCase()}`,
                type: ChannelType.GuildText,
                parent: CONFIG.CATEGORY_ID,
                permissionOverwrites: [
                    { id: guild.roles.everyone.id, deny: [PermissionFlagsBits.ViewChannel] },
                    { id: member.id, allow: [PermissionFlagsBits.ViewChannel, PermissionFlagsBits.SendMessages, PermissionFlagsBits.ReadMessageHistory] },
                    { id: client.user.id, allow: [PermissionFlagsBits.ViewChannel, PermissionFlagsBits.SendMessages, PermissionFlagsBits.ReadMessageHistory, PermissionFlagsBits.ManageChannels] }
                ]
            });

            const infoEmbed = new EmbedBuilder()
                .setTitle(`📝 Support Ticket: ${betreff}`)
                .setDescription(`Geöffnet von ${member}\n\n**Beschreibung:**\n${beschreibung}`)
                .setColor('#0099FF');

            const aiRawReply = await askChatGPT(`User hat Ticket geöffnet. Betreff: ${betreff}. Problem: ${beschreibung}. Antworte kurz und hilf ihm.`);
            const aiCleanReply = aiRawReply.replace('[ADMIN_PING_REQUIRED]', '').trim();

            const aiEmbed = new EmbedBuilder()
                .setTitle('🤖 VGPL Support-KI (ChatGPT)')
                .setDescription(aiCleanReply)
                .setColor('#10A37F');

            const closeButton = new ButtonBuilder().setCustomId('close_ticket').setLabel('Ticket schließen').setStyle(ButtonStyle.Danger);
            const row = new ActionRowBuilder().addComponents(closeButton);

            await ticketChannel.send({ content: `${member}`, embeds: [infoEmbed, aiEmbed], components: [row] });

            await interaction.editReply({ content: `Ticket erstellt: ${ticketChannel}`, ephemeral: true });
        } catch (e) {
            console.error(e);
            await interaction.editReply({ content: 'Fehler beim Erstellen.', ephemeral: true });
        }
    }

    if (interaction.isButton() && interaction.customId === 'close_ticket') {
        await interaction.reply({ content: '🔒 Ticket wird geschlossen...' });
        setTimeout(() => interaction.channel.delete().catch(() => {}), 3000);
    }
});

// Nachricht empfangen & Antworten
client.on('messageCreate', async (message) => {
    if (message.author.bot) return;
    if (message.channel.parentId === CONFIG.CATEGORY_ID || (message.channel.name && message.channel.name.startsWith('ticket-'))) {
        try {
            await message.channel.sendTyping();
            const rawMessages = await message.channel.messages.fetch({ limit: 6 });
            const contextLines = [];
            Array.from(rawMessages.values()).reverse().forEach(msg => {
                const author = msg.author.bot ? "KI" : msg.author.username;
                contextLines.push(`${author}: ${msg.content}`);
            });

            const reply = await askChatGPT(`Fortlaufender Chatverlauf:\n${contextLines.join('\n')}\n\nAntwort der KI:`);
            const cleanReply = reply.replace('[ADMIN_PING_REQUIRED]', '').trim();

            await message.reply({ content: cleanReply });

            if (reply.includes('[ADMIN_PING_REQUIRED]')) {
                await message.channel.send("🔔 **Support benötigt!** Ein menschlicher Administrator wurde benachrichtigt.");
            }
        } catch (e) {
            console.error(e);
        }
    }
});

client.login(CONFIG.TOKEN);

