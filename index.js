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
console.log("!!! HILFE & SUPPORT BOT STARTET !!!");
console.log("==================================================");

// 1. WEBSERVER FÜR RENDER KEEP-ALIVE
const server = http.createServer((req, res) => {
    res.writeHead(200, { 'Content-Type': 'text/plain; charset=utf-8' });
    res.end('Hilfe-Bot läuft fehlerfrei!');
});

const PORT = process.env.PORT || 10000;
server.listen(PORT, () => console.log(`Webserver aktiv auf Port ${PORT}`));

// 2. BOT CLIENT INITIALISIERUNG
const client = new Client({
    intents: [
        GatewayIntentBits.Guilds,
        GatewayIntentBits.GuildMessages,
        GatewayIntentBits.MessageContent
    ]
});

// KONFIGURATION
const CONFIG = {
    TOKEN: process.env.DISCORD_TOKEN,
    OPENAI_API_KEY: process.env.OPENAI_API_KEY || "",
    
    PANEL_CHANNEL_ID: '1527708821320106164', // Support Kanal ID (#hilfe)
    CATEGORY_ID: '1527708420788977674',      // KATEGORIE ID für neue Tickets
    
    ADMIN_ROLE_NAME: 'Admin',
    HEAD_ADMIN_ROLE_NAME: 'Head Admin'
};

// VGPL Regelwerk & KI-Wissen
const VGPL_KNOWLEDGE = `
Du bist der offizielle KI-Support-Assistent der VGPL Germany.
Deine Aufgabe ist es, Usern in Support-Tickets schnell, freundlich und präzise bei Fragen zum Regelwerk, Spielbetrieb und Technik zu helfen.

ALLGEMEINE REGELN & ABLAUF:
- Spiel: EA SPORTS FC Pro Clubs (Crossplay)
- Kadergröße: Mindestens 7 aktive Spieler pro Team.
- Mindestspielerzahl pro Match: 7 Spieler (weniger führt zu Wertung).
- Wartezeit bei Matches: Max. 10 Minuten nach Anstoßzeit.
- Verbindungsabbruch: Abbruch in den ersten 10 Min. ohne Tor -> Spielwiederholung.
- Größenlimits: IV max 1,87 m / Feldspieler max 1,82 m.
- Streampflicht: Jedes Spiel muss von mindestens einem Spieler gestreamt werden.
- Proteste: Müssen innerhalb von 24 Stunden mit Video-Beweis eingereicht werden.
`;

// ChatGPT API Aufruf
async function askBotBrain(userQuery) {
    const apiKey = CONFIG.OPENAI_API_KEY;
    if (!apiKey) return "🤖 [KI-Support] Hinweis: KI-Schlüssel nicht konfiguriert.";

    const payload = JSON.stringify({
        model: "gpt-4o-mini",
        messages: [
            { role: "system", content: VGPL_KNOWLEDGE },
            { role: "user", content: userQuery }
        ],
        temperature: 0.5
    });

    const options = {
        hostname: 'api.openai.com',
        path: '/v1/chat/completions',
        method: 'POST',
        headers: {
            'Authorization': `Bearer ${apiKey.trim()}`,
            'Content-Type': 'application/json',
            'Content-Length': Buffer.byteLength(payload)
        }
    };

    return new Promise((resolve) => {
        const req = https.request(options, (res) => {
            let data = '';
            res.on('data', chunk => data += chunk);
            res.on('end', () => {
                try {
                    const json = JSON.parse(data);
                    if (res.statusCode !== 200) {
                        resolve(`🤖 [KI-Support] Bitte erstelle eine Nachricht im Ticket, ein Teammitglied hilft dir bald.`);
                        return;
                    }
                    const reply = json.choices?.[0]?.message?.content;
                    resolve(reply || "🤖 [KI-Support] Keine Antwort erhalten.");
                } catch (e) {
                    resolve(`🤖 [KI-Support] Systemverarbeitung läuft.`);
                }
            });
        });
        req.on('error', () => resolve(`🤖 [KI-Support] Verbindung wird neu aufgebaut.`));
        req.write(payload);
        req.end();
    });
}

// SETUP DES HILFE-PANELS
async function setupHelpPanel(statusLogger = console.log) {
    try {
        const ch = await client.channels.fetch(CONFIG.PANEL_CHANNEL_ID).catch(() => null);
        if (!ch) return await statusLogger(`❌ Support-Kanal (${CONFIG.PANEL_CHANNEL_ID}) nicht gefunden!`);

        const embed = new EmbedBuilder()
            .setTitle('📩 VGPL Germany Support-Center')
            .setDescription('Wähle unten im Menü die passende Kategorie aus, um ein Ticket zu öffnen. Unser Support-Bot hilft dir sofort!')
            .setColor('#0099FF')
            .setFooter({ text: 'VGPL Germany Support' });

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

        await ch.send({ embeds: [embed], components: [new ActionRowBuilder().addComponents(selectMenu)] });
        await statusLogger(`✅ Hilfe-Panel erfolgreich in #${ch.name} gesendet!`);
    } catch (e) {
        await statusLogger(`❌ Fehler beim Senden des Hilfe-Panels: ${e.message}`);
    }
}

// BOT BEREIT
client.once('ready', async () => {
    console.log(`Eingeloggt als ${client.user.tag}!`);
    setTimeout(async () => await setupHelpPanel(), 2000);
});

// INTERAKTIONEN (Hilfe Dropdown, Modals & Schließen-Button)
client.on('interactionCreate', async (interaction) => {
    const guild = interaction.guild;
    if (!guild) return;

    const adminRole = guild.roles.cache.find(r => r.name.toLowerCase() === CONFIG.ADMIN_ROLE_NAME.toLowerCase());
    const headAdminRole = guild.roles.cache.find(r => r.name.toLowerCase() === CONFIG.HEAD_ADMIN_ROLE_NAME.toLowerCase());

    // 1. DROPDOWN-AUSWAHL
    if (interaction.isStringSelectMenu() && interaction.customId === 'select_support_category') {
        const choice = interaction.values[0];

        if (choice === 'ticket_transfer') {
            const modal = new ModalBuilder().setCustomId('modal_transfer').setTitle('1. Transfer Problem');
            modal.addComponents(
                new ActionRowBuilder().addComponents(new TextInputBuilder().setCustomId('discord_name').setLabel('Discord Name').setStyle(TextInputStyle.Short).setValue(interaction.user.tag)),
                new ActionRowBuilder().addComponents(new TextInputBuilder().setCustomId('ids').setLabel('EA-ID / PSN / Xbox ID').setStyle(TextInputStyle.Short).setRequired(true)),
                new ActionRowBuilder().addComponents(new TextInputBuilder().setCustomId('team_alt').setLabel('Aktuelles Team').setStyle(TextInputStyle.Short).setRequired(true)),
                new ActionRowBuilder().addComponents(new TextInputBuilder().setCustomId('team_neu').setLabel('Gewünschtes Team').setStyle(TextInputStyle.Short).setRequired(true)),
                new ActionRowBuilder().addComponents(new TextInputBuilder().setCustomId('error_text').setLabel('Fehlermeldung').setStyle(TextInputStyle.Paragraph).setRequired(true))
            );
            return interaction.showModal(modal);
        }

        if (choice === 'ticket_ergebnis') {
            const modal = new ModalBuilder().setCustomId('modal_ergebnis').setTitle('2. Ergebnis Problem');
            modal.addComponents(
                new ActionRowBuilder().addComponents(new TextInputBuilder().setCustomId('heim').setLabel('Heimteam').setStyle(TextInputStyle.Short).setRequired(true)),
                new ActionRowBuilder().addComponents(new TextInputBuilder().setCustomId('gast').setLabel('Auswärtsteam').setStyle(TextInputStyle.Short).setRequired(true)),
                new ActionRowBuilder().addComponents(new TextInputBuilder().setCustomId('erg_alt').setLabel('Eingetragenes Ergebnis').setStyle(TextInputStyle.Short).setRequired(true)),
                new ActionRowBuilder().addComponents(new TextInputBuilder().setCustomId('erg_neu').setLabel('Korrektes Ergebnis').setStyle(TextInputStyle.Short).setRequired(true)),
                new ActionRowBuilder().addComponents(new TextInputBuilder().setCustomId('spieltag').setLabel('Spieltag').setStyle(TextInputStyle.Short).setRequired(true))
            );
            return interaction.showModal(modal);
        }

        if (choice === 'ticket_verstoss') {
            const modal = new ModalBuilder().setCustomId('modal_verstoss').setTitle('3. Regelverstoß melden');
            modal.addComponents(
                new ActionRowBuilder().addComponents(new TextInputBuilder().setCustomId('team_eigen').setLabel('Eigenes Team').setStyle(TextInputStyle.Short).setRequired(true)),
                new ActionRowBuilder().addComponents(new TextInputBuilder().setCustomId('team_gegner').setLabel('Gegnerisches Team').setStyle(TextInputStyle.Short).setRequired(true)),
                new ActionRowBuilder().addComponents(new TextInputBuilder().setCustomId('art').setLabel('Art des Verstoßes').setStyle(TextInputStyle.Short).setRequired(true)),
                new ActionRowBuilder().addComponents(new TextInputBuilder().setCustomId('uhrzeit').setLabel('Uhrzeit des Vorfalls').setStyle(TextInputStyle.Short).setRequired(true)),
                new ActionRowBuilder().addComponents(new TextInputBuilder().setCustomId('beschreibung').setLabel('Beschreibung').setStyle(TextInputStyle.Paragraph).setRequired(true))
            );
            return interaction.showModal(modal);
        }

        if (choice === 'ticket_website') {
            const modal = new ModalBuilder().setCustomId('modal_website').setTitle('4. Website Problem');
            modal.addComponents(
                new ActionRowBuilder().addComponents(new TextInputBuilder().setCustomId('seite').setLabel('Betroffene Seite').setStyle(TextInputStyle.Short).setRequired(true)),
                new ActionRowBuilder().addComponents(new TextInputBuilder().setCustomId('aktion').setLabel('Durchgeführte Aktion').setStyle(TextInputStyle.Short).setRequired(true)),
                new ActionRowBuilder().addComponents(new TextInputBuilder().setCustomId('fehler').setLabel('Fehlermeldung').setStyle(TextInputStyle.Paragraph).setRequired(false)),
                new ActionRowBuilder().addComponents(new TextInputBuilder().setCustomId('browser').setLabel('Browser').setStyle(TextInputStyle.Short).setRequired(true))
            );
            return interaction.showModal(modal);
        }

        if (choice === 'ticket_account') {
            const modal = new ModalBuilder().setCustomId('modal_account').setTitle('5. Account / Profil Problem');
            modal.addComponents(
                new ActionRowBuilder().addComponents(new TextInputBuilder().setCustomId('discord_name').setLabel('Discord Name').setStyle(TextInputStyle.Short).setValue(interaction.user.tag)),
                new ActionRowBuilder().addComponents(new TextInputBuilder().setCustomId('ids').setLabel('EA-ID / PSN / Xbox ID').setStyle(TextInputStyle.Short).setRequired(true)),
                new ActionRowBuilder().addComponents(new TextInputBuilder().setCustomId('feld').setLabel('Profilfeld').setStyle(TextInputStyle.Short).setRequired(true)),
                new ActionRowBuilder().addComponents(new TextInputBuilder().setCustomId('zeit').setLabel('Seit wann besteht das Problem?').setStyle(TextInputStyle.Short).setRequired(true))
            );
            return interaction.showModal(modal);
        }

        if (choice === 'ticket_disconnect') {
            const modal = new ModalBuilder().setCustomId('modal_disconnect').setTitle('6. Spielabbruch / Disconnect');
            modal.addComponents(
                new ActionRowBuilder().addComponents(new TextInputBuilder().setCustomId('teams').setLabel('Beide Teamnamen').setStyle(TextInputStyle.Short).setRequired(true)),
                new ActionRowBuilder().addComponents(new TextInputBuilder().setCustomId('stand').setLabel('Spielstand bei Abbruch').setStyle(TextInputStyle.Short).setRequired(true)),
                new ActionRowBuilder().addComponents(new TextInputBuilder().setCustomId('minute').setLabel('Minute des Abbruchs').setStyle(TextInputStyle.Short).setRequired(true)),
                new ActionRowBuilder().addComponents(new TextInputBuilder().setCustomId('wer').setLabel('Wer ist disconnected?').setStyle(TextInputStyle.Short).setRequired(true))
            );
            return interaction.showModal(modal);
        }

        if (choice === 'ticket_sonstiges') {
            const modal = new ModalBuilder().setCustomId('modal_sonstiges').setTitle('7. Sonstiges Problem');
            modal.addComponents(
                new ActionRowBuilder().addComponents(new TextInputBuilder().setCustomId('betreff').setLabel('Kurzer Betreff').setStyle(TextInputStyle.Short).setRequired(true)),
                new ActionRowBuilder().addComponents(new TextInputBuilder().setCustomId('beschreibung').setLabel('Beschreibung des Problems').setStyle(TextInputStyle.Paragraph).setRequired(true))
            );
            return interaction.showModal(modal);
        }
    }

    // 2. FORMULAR-SUBMIT & TICKET-ERSTELLUNG
    if (interaction.isModalSubmit() && interaction.customId.startsWith('modal_')) {
        await interaction.deferReply({ ephemeral: true });

        const member = interaction.member;
        const customId = interaction.customId;
        
        let ticketPrefix = 'hilfe';
        let embedTitle = 'Support Ticket';
        let fields = [];

        if (customId === 'modal_transfer') {
            ticketPrefix = 'transfer';
            embedTitle = '🔄 Transfer Problem';
            fields = [
                { name: 'Discord', value: interaction.fields.getTextInputValue('discord_name'), inline: true },
                { name: 'EA-ID', value: interaction.fields.getTextInputValue('ids'), inline: true },
                { name: 'Altes Team', value: interaction.fields.getTextInputValue('team_alt'), inline: true },
                { name: 'Neues Team', value: interaction.fields.getTextInputValue('team_neu'), inline: true },
                { name: 'Fehlermeldung', value: interaction.fields.getTextInputValue('error_text') }
            ];
        } else if (customId === 'modal_ergebnis') {
            ticketPrefix = 'ergebnis';
            embedTitle = '📊 Ergebnis Problem';
            fields = [
                { name: 'Heimteam', value: interaction.fields.getTextInputValue('heim'), inline: true },
                { name: 'Auswärtsteam', value: interaction.fields.getTextInputValue('gast'), inline: true },
                { name: 'Eingetragen', value: interaction.fields.getTextInputValue('erg_alt'), inline: true },
                { name: 'Soll sein', value: interaction.fields.getTextInputValue('erg_neu'), inline: true },
                { name: 'Spieltag', value: interaction.fields.getTextInputValue('spieltag'), inline: true }
            ];
        } else if (customId === 'modal_verstoss') {
            ticketPrefix = 'verstoss';
            embedTitle = '⚠️ Regelverstoß gemeldet';
            fields = [
                { name: 'Eigenes Team', value: interaction.fields.getTextInputValue('team_eigen'), inline: true },
                { name: 'Gegner', value: interaction.fields.getTextInputValue('team_gegner'), inline: true },
                { name: 'Art des Verstoßes', value: interaction.fields.getTextInputValue('art'), inline: true },
                { name: 'Uhrzeit', value: interaction.fields.getTextInputValue('uhrzeit'), inline: true },
                { name: 'Beschreibung', value: interaction.fields.getTextInputValue('beschreibung') }
            ];
        } else if (customId === 'modal_website') {
            ticketPrefix = 'website';
            embedTitle = '🌐 Website Problem';
            fields = [
                { name: 'Seite', value: interaction.fields.getTextInputValue('seite'), inline: true },
                { name: 'Aktion', value: interaction.fields.getTextInputValue('aktion'), inline: true },
                { name: 'Browser', value: interaction.fields.getTextInputValue('browser'), inline: true },
                { name: 'Fehler', value: interaction.fields.getTextInputValue('fehler') || 'Keine' }
            ];
        } else if (customId === 'modal_account') {
            ticketPrefix = 'profil';
            embedTitle = '👤 Account / Profil Problem';
            fields = [
                { name: 'Discord', value: interaction.fields.getTextInputValue('discord_name'), inline: true },
                { name: 'EA-ID', value: interaction.fields.getTextInputValue('ids'), inline: true },
                { name: 'Profilfeld', value: interaction.fields.getTextInputValue('feld'), inline: true },
                { name: 'Besteht seit', value: interaction.fields.getTextInputValue('zeit'), inline: true }
            ];
        } else if (customId === 'modal_disconnect') {
            ticketPrefix = 'disconnect';
            embedTitle = '🔌 Spielabbruch / Disconnect';
            fields = [
                { name: 'Teams', value: interaction.fields.getTextInputValue('teams'), inline: true },
                { name: 'Spielstand', value: interaction.fields.getTextInputValue('stand'), inline: true },
                { name: 'Minute', value: interaction.fields.getTextInputValue('minute'), inline: true },
                { name: 'Partei', value: interaction.fields.getTextInputValue('wer'), inline: true }
            ];
        } else if (customId === 'modal_sonstiges') {
            ticketPrefix = 'sonstiges';
            embedTitle = '📝 Sonstiges Anliegen';
            fields = [
                { name: 'Betreff', value: interaction.fields.getTextInputValue('betreff') },
                { name: 'Beschreibung', value: interaction.fields.getTextInputValue('beschreibung') }
            ];
        }

        try {
            const permissionOverwrites = [
                { id: guild.roles.everyone.id, deny: [PermissionFlagsBits.ViewChannel] },
                { id: member.id, allow: [PermissionFlagsBits.ViewChannel, PermissionFlagsBits.SendMessages, PermissionFlagsBits.ReadMessageHistory, PermissionFlagsBits.AttachFiles] },
                { id: client.user.id, allow: [PermissionFlagsBits.ViewChannel, PermissionFlagsBits.SendMessages, PermissionFlagsBits.ReadMessageHistory, PermissionFlagsBits.ManageChannels] }
            ];

            if (adminRole) permissionOverwrites.push({ id: adminRole.id, allow: [PermissionFlagsBits.ViewChannel, PermissionFlagsBits.SendMessages, PermissionFlagsBits.ReadMessageHistory] });
            if (headAdminRole) permissionOverwrites.push({ id: headAdminRole.id, allow: [PermissionFlagsBits.ViewChannel, PermissionFlagsBits.SendMessages, PermissionFlagsBits.ReadMessageHistory] });

            const ticketChannel = await guild.channels.create({
                name: `${ticketPrefix}-${member.user.username.toLowerCase()}`,
                type: ChannelType.GuildText,
                parent: CONFIG.CATEGORY_ID,
                permissionOverwrites: permissionOverwrites
            });

            const infoEmbed = new EmbedBuilder().setTitle(embedTitle).setDescription(`Ticket erstellt von ${member}`).addFields(fields).setColor('#0099FF').setTimestamp();
            
            const aiReply = await askBotBrain(`User hat Support-Ticket geöffnet mit Betreff: ${embedTitle}. Antworte freundlich.`);
            const aiEmbed = new EmbedBuilder().setTitle('🤖 VGPL Support-KI').setDescription(aiReply).setColor('#2F3136').setFooter({ text: 'VGPL Germany Support' });
            
            const closeButton = new ButtonBuilder().setCustomId('close_ticket').setLabel('Ticket schließen').setEmoji('🔒').setStyle(ButtonStyle.Danger);

            await ticketChannel.send({ content: `${member}`, embeds: [infoEmbed, aiEmbed], components: [new ActionRowBuilder().addComponents(closeButton)] });
            await interaction.editReply({ content: `Dein Support-Ticket wurde erstellt: ${ticketChannel}`, ephemeral: true });
        } catch (e) {
            console.error(e);
            await interaction.editReply({ content: 'Fehler beim Erstellen des Tickets.', ephemeral: true });
        }
    }

    // 3. TICKET SCHLIESSEN
    if (interaction.isButton() && interaction.customId === 'close_ticket') {
        await interaction.reply({ content: '🔒 Ticket wird in 5 Sekunden geschlossen...' });
        setTimeout(() => interaction.channel.delete().catch(() => {}), 5000);
    }
});

// 4. KI ANTWORTEN BEI CHAT-NACHRICHTEN IM TICKET
client.on('messageCreate', async (message) => {
    if (message.author.bot) return;

    // MANUELLES SETUP VIA !setup
    if (message.content.trim() === '!setup') {
        await setupHelpPanel((msg) => message.reply(msg));
        return;
    }

    const channelName = message.channel.name ? message.channel.name.toLowerCase() : '';
    const isTicketChannel = channelName.includes('-') && (
        channelName.startsWith('transfer-') ||
        channelName.startsWith('ergebnis-') ||
        channelName.startsWith('verstoss-') ||
        channelName.startsWith('website-') ||
        channelName.startsWith('profil-') ||
        channelName.startsWith('disconnect-') ||
        channelName.startsWith('sonstiges-') ||
        channelName.startsWith('hilfe-')
    );

    if (!isTicketChannel) return;

    const isUserAdmin = message.member?.roles.cache.some(role => 
        role.name.toLowerCase() === CONFIG.ADMIN_ROLE_NAME.toLowerCase() || 
        role.name.toLowerCase() === CONFIG.HEAD_ADMIN_ROLE_NAME.toLowerCase()
    );

    if (isUserAdmin) return;

    try {
        await message.channel.sendTyping();
        const reply = await askBotBrain(`User im Ticket sagt: ${message.content}`);
        await message.reply({ content: reply });
    } catch (e) {
        console.error(e);
    }
});

client.login(CONFIG.TOKEN);
