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
console.log("!!! VGPL ALL-IN-ONE BOT (VERSION 13.7) STARTET !!!");
console.log("==================================================");

// 1. WEBSERVER FÜR RENDER KEEP-ALIVE
const server = http.createServer((req, res) => {
    res.writeHead(200, { 'Content-Type': 'text/plain; charset=utf-8' });
    res.end('VGPL Germany All-In-One Bot läuft fehlerfrei und ist online!');
});

const PORT = process.env.PORT || 10000;
server.listen(PORT, () => {
    console.log(`Webserver erfolgreich aktiv auf Port ${PORT}`);
});

// 2. BOT CLIENT INITIALISIERUNG
const client = new Client({
    intents: [
        GatewayIntentBits.Guilds,
        GatewayIntentBits.GuildMessages,
        GatewayIntentBits.MessageContent
    ]
});

// CONFIGURATION (EXAKTE TRENNUNG ZWISCHEN TEXT-KANÄLEN UND KATEGORIEN)
const CONFIG = {
    TOKEN: process.env.DISCORD_TOKEN,
    OPENAI_API_KEY: process.env.OPENAI_API_KEY || "",
    
    // NORMALE SUPPORT-TICKETS
    PANEL_CHANNEL_ID: '1527708821320106164',     // Text-Kanal Support Panel (#hilfe)
    CATEGORY_ID: '1527708420788977674',          // KATEGORIE für Support-Tickets
    
    // TEAM-REGISTRIERUNG
    TEAM_REG_CHANNEL_ID: '1527710839396634816',  // Text-Kanal für Button "Team registrieren"
    TEAM_REG_CATEGORY_ID: '1527711258709594273', // KATEGORIE für erstellte Team-Tickets
    ADMIN_REG_CHANNEL_ID: '1527737699442753597', // Admin Text-Kanal mit 3 Buttons

    // KOOPERATIONEN
    KOOP_REG_CHANNEL_ID: '1527713678101844030',  // Text-Kanal für Dropdown "Kooperation anfragen"
    KOOP_CATEGORY_ID: '1527714318752415844',     // KATEGORIE für erstellte Kooperations-Tickets
    KOOP_ADMIN_CHANNEL_ID: '1529505141223592047',// Admin Text-Kanal mit 3 Buttons

    // ROLLEN
    ADMIN_ROLE_NAME: 'Admin',
    HEAD_ADMIN_ROLE_NAME: 'Head Admin'
};

// Das exklusive Wissen der VGPL Germany basierend auf dem Regelwerk
const VGPL_KNOWLEDGE = `
Du bist der offizielle, hochprofessionelle KI-Support-Assistent der VGPL Germany (virtual Gaming Premier League). 
Deine Aufgabe ist es, Usern in Support-Tickets schnell, freundlich, sportlich und extrem präzise basierend auf dem offiziellen Regelwerk (Stand: FC 26 Saison 1) zu helfen.

ALLGEMEINE INFORMATIONEN:
- Liga: virtual Gaming Premier League (VGPL Germany).
- Spiel: EA SPORTS FC Pro Clubs (Crossplay auf PS5, Xbox Series X/S und PC).
- Website: https://virtualgamingpremierleague.com
- Kommunikationswege: VGPL Website, Discord, offizielle Social-Media-Kanäle.

OFFIZIELLES LIGAREGELWERK (WICHTIGSTE PARAGRAPHEN):
§3 VEREINE: 1 Manager, 1 stellvertretenden Manager, mindestens 7 active Spieler.
§4 SPIELERREGISTRIERUNG & TRANSFERS: Nur 1 Konto pro Spieler. Multi-Accounts verboten. Max 3 Transfers pro Saison.
§6 SPIELBETRIEB: Antrittspflicht. Mindestspielerzahl: 7 Spieler. Wartezeit: 10 Minuten.
§7 VERBINDUNGSABBRÜCHE: Abbruch vor/in den ersten 10 Min ohne Tor = Wiederholung.
§17 GRÖSSENLIMITS: IV: Max 1,87 m. Feldspieler: Max 1,82 m. Torhüter: Keine Grenze. 3er-Kette (max 3 IV), 4er-Kette (max 2 IV + 1 ZDM mit 1,87 m), 5er-Kette (max 3 IV).
§18 GESCHLECHTERREGELUNG: Pro Clubs Geschlecht muss echtem Geschlecht entsprechen.
§19 STREAMPLICHT: Alle Spiele live streamen. VOD 48h öffentlich speichern.
§20 LIVE-JOIN-VERBOT: Kein Nachjoinen im laufenden Spiel (0:3 Wertung).
§10 & §22 PROTESTE: Innerhalb von 24h mit Videobeweis einreichen.

DEINE VERHALTENSREGELN ALS KI:
- Sei stets höflich, professionell und sportlich.
- Bei Fragen zu Ergebnissen, Protesten oder Admin-Anfragen antworte höflich und hänge exakt "[ADMIN_PING_REQUIRED]" am Ende an.
`;

// ChatGPT API Aufruf
async function askBotBrain(userQuery) {
    const apiKey = CONFIG.OPENAI_API_KEY;
    if (!apiKey) return "🤖 [VGPL KI-Support] Fehler: API-Schlüssel fehlt!";

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
                        resolve(`🤖 [VGPL KI-Support] Bitte entschuldige, ich habe gerade eine kurze Denkpause.`);
                        return;
                    }
                    const reply = json.choices?.[0]?.message?.content;
                    resolve(reply || "🤖 [VGPL KI-Support] Keine Antwort erhalten.");
                } catch (e) {
                    resolve(`🤖 [VGPL KI-Support] Systemfehler bei Verarbeitung.`);
                }
            });
        });
        req.on('error', () => resolve(`🤖 [VGPL KI-Support] Systemverbindung fehlgeschlagen.`));
        req.write(payload);
        req.end();
    });
}

// DIREKTES UND KUGELSICHERES SENDEN ALLER 3 PANELS IN DIE TEXT-KANÄLE
async function setupAllPanels(statusLogger = console.log) {
    statusLogger("🔄 Starte das Senden aller 3 Panels...");

    // 1. SUPPORT-PANEL (#hilfe - Text-Kanal ID: 1527708821320106164)
    try {
        const supportChannel = await client.channels.fetch(CONFIG.PANEL_CHANNEL_ID).catch(() => null);
        if (supportChannel && typeof supportChannel.send === 'function') {
            const embed = new EmbedBuilder()
                .setTitle('📩 VGPL Germany Support-Center')
                .setDescription('Wähle unten im Menü die passende Kategorie aus, um ein Ticket zu öffnen. Unser Support-Bot hilft dir sofort!')
                .setColor('#0099FF')
                .setFooter({ text: 'VGPL Germany Support' });

            const selectMenu = new StringSelectMenuBuilder()
                .setCustomId('select_support_category')
                .setPlaceholder('Support-Kategorie auswählen...')
                .addOptions([
                    { label: '1. Transfer Problem', value: 'ticket_transfer', description: 'Probleme beim Transfer von Spielern', emoji: '🔄' },
                    { label: '2. Ergebnis Problem', value: 'ticket_ergebnis', description: 'Fehlerhaft eingetragene Ergebnisse', emoji: '📊' },
                    { label: '3. Regelverstoß melden', value: 'ticket_verstoss', description: 'Cheating, Beleidigungen etc. melden', emoji: '⚠️' },
                    { label: '4. Website Problem', value: 'ticket_website', description: 'Fehler auf der Website melden', emoji: '🌐' },
                    { label: '5. Account / Profil Problem', value: 'ticket_account', description: 'Falsche Daten im Spielerprofil', emoji: '👤' },
                    { label: '6. Spielabbruch / Disconnect', value: 'ticket_disconnect', description: 'Verbindungsabbruch während des Matches', emoji: '🔌' },
                    { label: '7. Sonstiges', value: 'ticket_sonstiges', description: 'Für alle anderen Anliegen', emoji: '📝' }
                ]);

            await supportChannel.send({ embeds: [embed], components: [new ActionRowBuilder().addComponents(selectMenu)] });
            statusLogger('✅ 1. Support-Panel (#hilfe) erfolgreich gesendet.');
        } else {
            statusLogger(`❌ 1. Support-Kanal ID (${CONFIG.PANEL_CHANNEL_ID}) nicht gefunden oder ungültig!`);
        }
    } catch (e) {
        statusLogger(`❌ Fehler Support-Panel: ${e.message}`);
    }

    // 2. TEAM-REGISTRIERUNG PANEL (Text-Kanal ID: 1527710839396634816)
    try {
        const regChannel = await client.channels.fetch(CONFIG.TEAM_REG_CHANNEL_ID).catch(() => null);
        if (regChannel && typeof regChannel.send === 'function') {
            const regEmbed = new EmbedBuilder()
                .setTitle('🏆 Team registrieren')
                .setDescription('Möchtest du dein Team für die neue Saison der VGPL Germany anmelden?\n\nKlicke auf den Button unten, um das Formular auszufüllen und deine Teambewerbung zu starten!')
                .setColor('#FFCC00')
                .setFooter({ text: 'VGPL Germany Registrierung' });

            const regButton = new ButtonBuilder()
                .setCustomId('btn_open_team_reg')
                .setLabel('Team registrieren')
                .setEmoji('🏆')
                .setStyle(ButtonStyle.Primary);

            await regChannel.send({ embeds: [regEmbed], components: [new ActionRowBuilder().addComponents(regButton)] });
            statusLogger('✅ 2. Team-Registrierungs-Panel erfolgreich gesendet.');
        } else {
            statusLogger(`❌ 2. Team-Reg-Kanal ID (${CONFIG.TEAM_REG_CHANNEL_ID}) nicht gefunden oder ungültig!`);
        }
    } catch (e) {
        statusLogger(`❌ Fehler Team-Reg-Panel: ${e.message}`);
    }

    // 3. KOOPERATION DROPDOWN PANEL (Text-Kanal ID: 1527713678101844030)
    try {
        const koopChannel = await client.channels.fetch(CONFIG.KOOP_REG_CHANNEL_ID).catch(() => null);
        if (koopChannel && typeof koopChannel.send === 'function') {
            const koopEmbed = new EmbedBuilder()
                .setTitle('🤝 Kooperation anfragen')
                .setDescription('Möchtest du eine Partnerschaft, ein Sponsoring oder eine Event-Kooperation mit der VGPL Germany eingehen?\n\nWähle unten im Menü die passende Art der Kooperation aus, um das Formular auszufüllen!')
                .setColor('#9B59B6')
                .setFooter({ text: 'VGPL Germany Kooperationen' });

            const koopSelectMenu = new StringSelectMenuBuilder()
                .setCustomId('select_koop_category')
                .setPlaceholder('Art der Kooperation auswählen...')
                .addOptions([
                    { label: 'Partner / Sponsor', value: 'koop_partner', description: 'Sponsoring-Angebote oder feste Partnerschaften', emoji: '🤝' },
                    { label: 'Andere Liga / eSports Organisation', value: 'koop_liga', description: 'Zusammenarbeit zwischen Ligen oder Teams', emoji: '🎮' },
                    { label: 'Content Creator / Streamer', value: 'koop_streamer', description: 'Partnerschaften für Streamer und Creator', emoji: '📱' },
                    { label: 'Medienpartner', value: 'koop_medien', description: 'Presse, News oder Content-Sharing', emoji: '📰' },
                    { label: 'Unternehmen', value: 'koop_firma', description: 'B2B Anfragen, Firmenkooperationen', emoji: '🏢' },
                    { label: 'Sonstiges', value: 'koop_sonstiges', description: 'Alle anderen Kooperations-Ideen', emoji: '🌐' }
                ]);

            await koopChannel.send({ embeds: [koopEmbed], components: [new ActionRowBuilder().addComponents(koopSelectMenu)] });
            statusLogger('✅ 3. Kooperations-Panel (Dropdown) erfolgreich gesendet.');
        } else {
            statusLogger(`❌ 3. Koop-Kanal ID (${CONFIG.KOOP_REG_CHANNEL_ID}) nicht gefunden oder ungültig!`);
        }
    } catch (e) {
        statusLogger(`❌ Fehler Koop-Panel: ${e.message}`);
    }
}

// BOT BEREIT
client.once('ready', async () => {
    console.log(`Erfolgreich eingeloggt als ${client.user.tag}!`);
    setTimeout(async () => {
        await setupAllPanels();
    }, 2000);
});

// INTERAKTIONEN (Menüauswahl, Buttons, Modals)
client.on('interactionCreate', async (interaction) => {
    const guild = interaction.guild;
    if (!guild) return;

    const adminRole = guild.roles.cache.find(r => r.name.toLowerCase() === CONFIG.ADMIN_ROLE_NAME.toLowerCase());
    const headAdminRole = guild.roles.cache.find(r => r.name.toLowerCase() === CONFIG.HEAD_ADMIN_ROLE_NAME.toLowerCase());

    // 1. SUPPORT-DROPDOWN MENÜ GEWÄHLT
    if (interaction.isStringSelectMenu() && interaction.customId === 'select_support_category') {
        const choice = interaction.values[0];

        if (choice === 'ticket_transfer') {
            const modal = new ModalBuilder().setCustomId('modal_transfer').setTitle('1. Transfer Problem');
            modal.addComponents(
                new ActionRowBuilder().addComponents(new TextInputBuilder().setCustomId('discord_name').setLabel('Discord Name').setStyle(TextInputStyle.Short).setValue(interaction.user.tag)),
                new ActionRowBuilder().addComponents(new TextInputBuilder().setCustomId('ids').setLabel('EA-ID / PSN / Xbox ID').setStyle(TextInputStyle.Short).setRequired(true)),
                new ActionRowBuilder().addComponents(new TextInputBuilder().setCustomId('team_alt').setLabel('Aktuelles Team').setStyle(TextInputStyle.Short).setRequired(true)),
                new ActionRowBuilder().addComponents(new TextInputBuilder().setCustomId('team_neu').setLabel('Gewünschtes Team').setStyle(TextInputStyle.Short).setRequired(true)),
                new ActionRowBuilder().addComponents(new TextInputBuilder().setCustomId('error_text').setLabel('Fehlermeldung (Text)').setStyle(TextInputStyle.Paragraph).setRequired(true))
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
                new ActionRowBuilder().addComponents(new TextInputBuilder().setCustomId('browser').setLabel('Browser (Chrome, Safari etc.)').setStyle(TextInputStyle.Short).setRequired(true))
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

    // 2. KLICK AUF "TEAM REGISTRIEREN" BUTTON
    if (interaction.isButton() && interaction.customId === 'btn_open_team_reg') {
        const modal = new ModalBuilder()
            .setCustomId('modal_team_registration')
            .setTitle('🏆 Team registrieren');

        modal.addComponents(
            new ActionRowBuilder().addComponents(new TextInputBuilder().setCustomId('reg_teamname').setLabel('Teamname').setStyle(TextInputStyle.Short).setRequired(true)),
            new ActionRowBuilder().addComponents(new TextInputBuilder().setCustomId('reg_manager').setLabel('Manager Name').setStyle(TextInputStyle.Short).setPlaceholder('z.B. Max / @Manager').setRequired(true)),
            new ActionRowBuilder().addComponents(new TextInputBuilder().setCustomId('reg_kader').setLabel('Anzahl Spieler & Plattform').setStyle(TextInputStyle.Short).setPlaceholder('z.B. 11 Spieler, PS5 / Crossplay').setRequired(true)),
            new ActionRowBuilder().addComponents(new TextInputBuilder().setCustomId('reg_experience').setLabel('Schon mal in einer Liga gespielt?').setStyle(TextInputStyle.Short).setPlaceholder('z.B. Ja, in der Pro Ligas / Nein').setRequired(true))
        );

        return interaction.showModal(modal);
    }

    // 3. KOOPERATION DROPDOWN AUSGEWÄHLT
    if (interaction.isStringSelectMenu() && interaction.customId === 'select_koop_category') {
        const selectedVal = interaction.values[0];
        
        let titleMap = {
            'koop_partner': '🤝 Partner / Sponsor',
            'koop_liga': '🎮 Andere Liga / eSports Orga',
            'koop_streamer': '📱 Content Creator / Streamer',
            'koop_medien': '📰 Medienpartner',
            'koop_firma': '🏢 Unternehmen',
            'koop_sonstiges': '🌐 Sonstiges'
        };

        const modalTitle = titleMap[selectedVal] || '🤝 Kooperation anfragen';

        const modal = new ModalBuilder()
            .setCustomId(`modal_koop_${selectedVal}`)
            .setTitle(modalTitle);

        modal.addComponents(
            new ActionRowBuilder().addComponents(new TextInputBuilder().setCustomId('koop_name').setLabel('Dein Name / Discord Name').setStyle(TextInputStyle.Short).setValue(interaction.user.tag).setRequired(true)),
            new ActionRowBuilder().addComponents(new TextInputBuilder().setCustomId('koop_org').setLabel('Organisation / Firma / Liga / Team').setStyle(TextInputStyle.Short).setRequired(true)),
            new ActionRowBuilder().addComponents(new TextInputBuilder().setCustomId('koop_link').setLabel('Webseite oder Social Media Link').setStyle(TextInputStyle.Short).setPlaceholder('z.B. Instagram, Twitch, Web-URL (optional)').setRequired(false)),
            new ActionRowBuilder().addComponents(new TextInputBuilder().setCustomId('koop_desc').setLabel('Beschreibung & Zeitraum der Kooperation').setStyle(TextInputStyle.Paragraph).setRequired(true)),
            new ActionRowBuilder().addComponents(new TextInputBuilder().setCustomId('koop_offer').setLabel('Was bietet ihr / Was erwartet ihr?').setStyle(TextInputStyle.Paragraph).setPlaceholder('Geben & Nehmen (Win-Win Situation beschreiben)').setRequired(true))
        );

        return interaction.showModal(modal);
    }

    // 4. ABSCHICKEN EINES SUPPORT-MODALS
    if (interaction.isModalSubmit() && interaction.customId.startsWith('modal_') && interaction.customId !== 'modal_team_registration' && !interaction.customId.startsWith('modal_koop_')) {
        await interaction.deferReply({ ephemeral: true });

        const member = interaction.member;
        const customId = interaction.customId;
        
        let ticketPrefix = 'ticket';
        let embedTitle = 'Support Ticket';
        let fields = [];
        let contextForAI = '';

        if (customId === 'modal_transfer') {
            ticketPrefix = 'transfer';
            embedTitle = '🔄 Transfer Problem';
            fields = [
                { name: 'Discord Name', value: interaction.fields.getTextInputValue('discord_name'), inline: true },
                { name: 'EA-ID / Platform ID', value: interaction.fields.getTextInputValue('ids'), inline: true },
                { name: 'Altes Team', value: interaction.fields.getTextInputValue('team_alt'), inline: true },
                { name: 'Neues Team', value: interaction.fields.getTextInputValue('team_neu'), inline: true },
                { name: 'Fehlermeldung', value: interaction.fields.getTextInputValue('error_text') }
            ];
            contextForAI = `User hat Transfer-Problem gemeldet. Hilf ihm.`;
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
            contextForAI = `Ergebnis-Korrektur gemeldet. Screenshots anfordern. [ADMIN_PING_REQUIRED]`;
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
            contextForAI = `Regelverstoß gemeldet. Videobeweise anfordern. [ADMIN_PING_REQUIRED]`;
        } else if (customId === 'modal_website') {
            ticketPrefix = 'website';
            embedTitle = '🌐 Website Problem';
            fields = [
                { name: 'Seite', value: interaction.fields.getTextInputValue('seite'), inline: true },
                { name: 'Aktion', value: interaction.fields.getTextInputValue('aktion'), inline: true },
                { name: 'Browser', value: interaction.fields.getTextInputValue('browser'), inline: true },
                { name: 'Fehler', value: interaction.fields.getTextInputValue('fehler') || 'Keine' }
            ];
            contextForAI = `Website-Fehler gemeldet. Cache leeren empfehlen.`;
        } else if (customId === 'modal_account') {
            ticketPrefix = 'profil';
            embedTitle = '👤 Account / Profil Problem';
            fields = [
                { name: 'Discord', value: interaction.fields.getTextInputValue('discord_name'), inline: true },
                { name: 'EA-ID', value: interaction.fields.getTextInputValue('ids'), inline: true },
                { name: 'Profilfeld', value: interaction.fields.getTextInputValue('feld'), inline: true },
                { name: 'Besteht seit', value: interaction.fields.getTextInputValue('zeit'), inline: true }
            ];
            contextForAI = `Account-Problem gemeldet.`;
        } else if (customId === 'modal_disconnect') {
            ticketPrefix = 'disconnect';
            embedTitle = '🔌 Spielabbruch / Disconnect';
            fields = [
                { name: 'Teams', value: interaction.fields.getTextInputValue('teams'), inline: true },
                { name: 'Spielstand', value: interaction.fields.getTextInputValue('stand'), inline: true },
                { name: 'Minute', value: interaction.fields.getTextInputValue('minute'), inline: true },
                { name: 'Partei', value: interaction.fields.getTextInputValue('wer'), inline: true }
            ];
            contextForAI = `Disconnect gemeldet. [ADMIN_PING_REQUIRED]`;
        } else if (customId === 'modal_sonstiges') {
            ticketPrefix = 'sonstiges';
            embedTitle = '📝 Sonstiges Anliegen';
            fields = [
                { name: 'Betreff', value: interaction.fields.getTextInputValue('betreff') },
                { name: 'Beschreibung', value: interaction.fields.getTextInputValue('beschreibung') }
            ];
            contextForAI = `Sonstiges Anliegen. Hilf freundlich.`;
        }

        try {
            const permissionOverwrites = [
                { id: guild.roles.everyone.id, deny: [PermissionFlagsBits.ViewChannel] },
                { id: member.id, allow: [PermissionFlagsBits.ViewChannel, PermissionFlagsBits.SendMessages, PermissionFlagsBits.ReadMessageHistory, PermissionFlagsBits.AttachFiles] },
                { id: client.user.id, allow: [PermissionFlagsBits.ViewChannel, PermissionFlagsBits.SendMessages, PermissionFlagsBits.ReadMessageHistory, PermissionFlagsBits.ManageChannels] }
            ];

            if (adminRole) permissionOverwrites.push({ id: adminRole.id, allow: [PermissionFlagsBits.ViewChannel, PermissionFlagsBits.SendMessages, PermissionFlagsBits.ReadMessageHistory, PermissionFlagsBits.ManageChannels] });
            if (headAdminRole) permissionOverwrites.push({ id: headAdminRole.id, allow: [PermissionFlagsBits.ViewChannel, PermissionFlagsBits.SendMessages, PermissionFlagsBits.ReadMessageHistory, PermissionFlagsBits.ManageChannels] });

            // Erstelle Support Ticket in Kategorie 1527708420788977674
            const ticketChannel = await guild.channels.create({
                name: `${ticketPrefix}-${member.user.username.toLowerCase()}`,
                type: ChannelType.GuildText,
                parent: CONFIG.CATEGORY_ID,
                permissionOverwrites: permissionOverwrites
            });

            const infoEmbed = new EmbedBuilder().setTitle(embedTitle).setDescription(`Geöffnet von ${member}`).addFields(fields).setColor('#0099FF').setTimestamp();
            const aiRawReply = await askBotBrain(contextForAI);
            const aiEmbed = new EmbedBuilder().setTitle('🤖 VGPL Support-KI').setDescription(aiRawReply.replace('[ADMIN_PING_REQUIRED]', '').trim()).setColor('#2F3136').setFooter({ text: 'VGPL Germany Support' });
            const closeButton = new ButtonBuilder().setCustomId('close_ticket').setLabel('Ticket schließen').setEmoji('🔒').setStyle(ButtonStyle.Danger);

            await ticketChannel.send({ content: `${member}`, embeds: [infoEmbed, aiEmbed], components: [new ActionRowBuilder().addComponents(closeButton)] });
            await interaction.editReply({ content: `Dein Support-Ticket wurde erstellt: ${ticketChannel}`, ephemeral: true });
        } catch (e) {
            console.error(e);
            await interaction.editReply({ content: 'Fehler beim Erstellen des Tickets.', ephemeral: true });
        }
    }

    // 5. ABSCHICKEN DES TEAM-REGISTRIERUNGS FORMULARS
    if (interaction.isModalSubmit() && interaction.customId === 'modal_team_registration') {
        await interaction.deferReply({ ephemeral: true });

        const member = interaction.member;
        const teamname = interaction.fields.getTextInputValue('reg_teamname');
        const manager = interaction.fields.getTextInputValue('reg_manager');
        const kader = interaction.fields.getTextInputValue('reg_kader');
        const experience = interaction.fields.getTextInputValue('reg_experience');

        try {
            const permissionOverwrites = [
                { id: guild.roles.everyone.id, deny: [PermissionFlagsBits.ViewChannel] },
                { id: member.id, allow: [PermissionFlagsBits.ViewChannel, PermissionFlagsBits.SendMessages, PermissionFlagsBits.ReadMessageHistory, PermissionFlagsBits.AttachFiles] },
                { id: client.user.id, allow: [PermissionFlagsBits.ViewChannel, PermissionFlagsBits.SendMessages, PermissionFlagsBits.ReadMessageHistory, PermissionFlagsBits.ManageChannels] }
            ];

            if (adminRole) permissionOverwrites.push({ id: adminRole.id, allow: [PermissionFlagsBits.ViewChannel, PermissionFlagsBits.SendMessages, PermissionFlagsBits.ReadMessageHistory, PermissionFlagsBits.ManageChannels] });
            if (headAdminRole) permissionOverwrites.push({ id: headAdminRole.id, allow: [PermissionFlagsBits.ViewChannel, PermissionFlagsBits.SendMessages, PermissionFlagsBits.ReadMessageHistory, PermissionFlagsBits.ManageChannels] });

            // Erstelle Team-Ticket in KATEGORIE 1527711258709594273
            const ticketChannel = await guild.channels.create({
                name: `teamreg-${member.user.username.toLowerCase()}`,
                type: ChannelType.GuildText,
                parent: CONFIG.TEAM_REG_CATEGORY_ID,
                permissionOverwrites: permissionOverwrites
            });

            const mainEmbed = new EmbedBuilder()
                .setTitle('🏆 Neue Team-Registrierung')
                .setDescription(`Dieses Ticket wurde von ${member} erstellt.`)
                .addFields(
                    { name: 'Teamname', value: teamname },
                    { name: 'Manager Name', value: manager },
                    { name: 'Anzahl Spieler & Plattform', value: kader },
                    { name: 'Schon mal in einer Liga gespielt?', value: experience }
                )
                .setColor('#FFCC00')
                .setTimestamp();

            const closeButton = new ButtonBuilder().setCustomId('close_ticket').setLabel('Ticket schließen').setEmoji('🔒').setStyle(ButtonStyle.Danger);
            await ticketChannel.send({ content: `${member}`, embeds: [mainEmbed], components: [new ActionRowBuilder().addComponents(closeButton)] });

            const okEmbed = new EmbedBuilder()
                .setTitle('🤖 System-Antwort')
                .setDescription(`✅ **Team-Anmeldung erfolgreich eingereicht!**\n\nVielen Dank für deine Registrierung. Das Admin-Team prüft deine Daten in Kürze.`)
                .setColor('#00FF00')
                .setTimestamp();

            await ticketChannel.send({ embeds: [okEmbed] });

            const adminChannel = await guild.channels.fetch(CONFIG.ADMIN_REG_CHANNEL_ID).catch(() => null);
            if (adminChannel && typeof adminChannel.send === 'function') {
                const adminEmbed = new EmbedBuilder()
                    .setTitle('📥 NEUE TEAM-ANMELDUNG EINGEGANGEN')
                    .setDescription(`**Erstellt von:** ${member} (${member.user.tag})\n**Ticket-Kanal:** ${ticketChannel}`)
                    .addFields(
                        { name: 'Teamname', value: teamname, inline: true },
                        { name: 'Manager Name', value: manager, inline: true },
                        { name: 'Kader & Plattform', value: kader, inline: false },
                        { name: 'Vorerfahrung', value: experience, inline: false },
                        { name: 'Status', value: '⏳ Ausstehend (Neu eingegangen)', inline: false }
                    )
                    .setColor('#FFCC00')
                    .setTimestamp();

                const btnProcess = new ButtonBuilder().setCustomId(`adm_proc_${ticketChannel.id}`).setLabel('In Bearbeitung').setEmoji('⏳').setStyle(ButtonStyle.Secondary);
                const btnAccept = new ButtonBuilder().setCustomId(`adm_acc_${ticketChannel.id}`).setLabel('Akzeptiert').setEmoji('✅').setStyle(ButtonStyle.Success);
                const btnReject = new ButtonBuilder().setCustomId(`adm_rej_${ticketChannel.id}`).setLabel('Abgelehnt').setEmoji('❌').setStyle(ButtonStyle.Danger);

                await adminChannel.send({ embeds: [adminEmbed], components: [new ActionRowBuilder().addComponents(btnProcess, btnAccept, btnReject)] });
            }

            await interaction.editReply({ content: `Deine Team-Registrierung wurde erstellt: ${ticketChannel}`, ephemeral: true });

        } catch (e) {
            console.error(e);
            await interaction.editReply({ content: 'Fehler beim Erstellen der Registrierung.', ephemeral: true });
        }
    }

    // 6. ABSCHICKEN DES KOOPERATIONS FORMULARS
    if (interaction.isModalSubmit() && interaction.customId.startsWith('modal_koop_')) {
        await interaction.deferReply({ ephemeral: true });

        const member = interaction.member;
        const name = interaction.fields.getTextInputValue('koop_name');
        const org = interaction.fields.getTextInputValue('koop_org');
        const link = interaction.fields.getTextInputValue('koop_link') || 'Keine Angabe';
        const desc = interaction.fields.getTextInputValue('koop_desc');
        const offer = interaction.fields.getTextInputValue('koop_offer');

        try {
            const permissionOverwrites = [
                { id: guild.roles.everyone.id, deny: [PermissionFlagsBits.ViewChannel] },
                { id: member.id, allow: [PermissionFlagsBits.ViewChannel, PermissionFlagsBits.SendMessages, PermissionFlagsBits.ReadMessageHistory, PermissionFlagsBits.AttachFiles] },
                { id: client.user.id, allow: [PermissionFlagsBits.ViewChannel, PermissionFlagsBits.SendMessages, PermissionFlagsBits.ReadMessageHistory, PermissionFlagsBits.ManageChannels] }
            ];

            if (adminRole) permissionOverwrites.push({ id: adminRole.id, allow: [PermissionFlagsBits.ViewChannel, PermissionFlagsBits.SendMessages, PermissionFlagsBits.ReadMessageHistory, PermissionFlagsBits.ManageChannels] });
            if (headAdminRole) permissionOverwrites.push({ id: headAdminRole.id, allow: [PermissionFlagsBits.ViewChannel, PermissionFlagsBits.SendMessages, PermissionFlagsBits.ReadMessageHistory, PermissionFlagsBits.ManageChannels] });

            // Erstelle Kooperations-Ticket in KATEGORIE 1527714318752415844
            const ticketChannel = await guild.channels.create({
                name: `koop-${member.user.username.toLowerCase()}`,
                type: ChannelType.GuildText,
                parent: CONFIG.KOOP_CATEGORY_ID,
                permissionOverwrites: permissionOverwrites
            });

            const mainEmbed = new EmbedBuilder()
                .setTitle('🤝 Neue Kooperations-Anfrage')
                .setDescription(`Diese Anfrage wurde von ${member} erstellt.`)
                .addFields(
                    { name: 'Name / Discord', value: name, inline: true },
                    { name: 'Orga / Firma / Team', value: org, inline: true },
                    { name: 'Webseite / Social Media', value: link, inline: false },
                    { name: 'Beschreibung & Zeitraum', value: desc, inline: false },
                    { name: 'Angebot & Erwartungen', value: offer, inline: false }
                )
                .setColor('#9B59B6')
                .setTimestamp();

            const closeButton = new ButtonBuilder().setCustomId('close_ticket').setLabel('Ticket schließen').setEmoji('🔒').setStyle(ButtonStyle.Danger);
            await ticketChannel.send({ content: `${member}`, embeds: [mainEmbed], components: [new ActionRowBuilder().addComponents(closeButton)] });

            const okEmbed = new EmbedBuilder()
                .setTitle('🤖 System-Antwort')
                .setDescription(`✅ **Kooperations-Anfrage erfolgreich eingereicht!**\n\nVielen Dank für dein Interesse. Unser Ligateam prüft dein Angebot und meldet sich in Kürze hier.`)
                .setColor('#00FF00')
                .setTimestamp();

            await ticketChannel.send({ embeds: [okEmbed] });

            const adminChannel = await guild.channels.fetch(CONFIG.KOOP_ADMIN_CHANNEL_ID).catch(() => null);
            if (adminChannel && typeof adminChannel.send === 'function') {
                const adminEmbed = new EmbedBuilder()
                    .setTitle('📥 NEUE KOOPERATION EINGEGANGEN')
                    .setDescription(`**Erstellt von:** ${member} (${member.user.tag})\n**Ticket-Kanal:** ${ticketChannel}`)
                    .addFields(
                        { name: 'Name / Discord', value: name, inline: true },
                        { name: 'Orga / Firma', value: org, inline: true },
                        { name: 'Link', value: link, inline: false },
                        { name: 'Beschreibung', value: desc, inline: false },
                        { name: 'Angebot & Erwartung', value: offer, inline: false },
                        { name: 'Status', value: '⏳ Ausstehend (Neu eingegangen)', inline: false }
                    )
                    .setColor('#9B59B6')
                    .setTimestamp();

                const btnProcess = new ButtonBuilder().setCustomId(`adm_proc_${ticketChannel.id}`).setLabel('In Bearbeitung').setEmoji('⏳').setStyle(ButtonStyle.Secondary);
                const btnAccept = new ButtonBuilder().setCustomId(`adm_acc_${ticketChannel.id}`).setLabel('Akzeptiert').setEmoji('✅').setStyle(ButtonStyle.Success);
                const btnReject = new ButtonBuilder().setCustomId(`adm_rej_${ticketChannel.id}`).setLabel('Abgelehnt').setEmoji('❌').setStyle(ButtonStyle.Danger);

                await adminChannel.send({ embeds: [adminEmbed], components: [new ActionRowBuilder().addComponents(btnProcess, btnAccept, btnReject)] });
            }

            await interaction.editReply({ content: `Deine Kooperations-Anfrage wurde erstellt: ${ticketChannel}`, ephemeral: true });

        } catch (e) {
            console.error(e);
            await interaction.editReply({ content: 'Fehler beim Erstellen der Anfrage.', ephemeral: true });
        }
    }

    // 7. ADMIN-BUTTON-INTERAKTIONEN
    if (interaction.isButton() && (interaction.customId.startsWith('adm_proc_') || interaction.customId.startsWith('adm_acc_') || interaction.customId.startsWith('adm_rej_'))) {
        await interaction.deferUpdate();

        const action = interaction.customId.substring(0, 8);
        const ticketChannelId = interaction.customId.substring(9);
        const ticketChannel = await guild.channels.fetch(ticketChannelId).catch(() => null);
        const adminUser = interaction.user;

        const oldEmbed = interaction.message.embeds[0];
        if (!oldEmbed) return;

        const updatedFields = oldEmbed.fields.map(field => {
            if (field.name === 'Status') {
                if (action === 'adm_proc') return { name: 'Status', value: `⏳ **In Bearbeitung** durch ${adminUser}`, inline: false };
                if (action === 'adm_acc') return { name: 'Status', value: `✅ **Akzeptiert** durch ${adminUser}`, inline: false };
                if (action === 'adm_rej') return { name: 'Status', value: `❌ **Abgelehnt** durch ${adminUser}`, inline: false };
            }
            return field;
        });

        let newColor = '#FFCC00';
        if (action === 'adm_proc') newColor = '#3498DB';
        if (action === 'adm_acc') newColor = '#2ECC71';
        if (action === 'adm_rej') newColor = '#E74C3C';

        const newAdminEmbed = EmbedBuilder.from(oldEmbed).setFields(updatedFields).setColor(newColor);
        await interaction.message.edit({ embeds: [newAdminEmbed] });

        if (ticketChannel) {
            if (action === 'adm_proc') {
                const statusEmbed = new EmbedBuilder().setTitle('⏳ Status-Update: In Bearbeitung').setDescription(`Deine Anfrage wird aktuell von **${adminUser.username}** bearbeitet. Bitte gedulde dich einen Moment.`).setColor('#3498DB').setTimestamp();
                await ticketChannel.send({ embeds: [statusEmbed] });
            } else if (action === 'adm_acc') {
                const statusEmbed = new EmbedBuilder().setTitle('✅ Status-Update: Akzeptiert!').setDescription(`Glückwunsch! Deine Anfrage wurde von **${adminUser.username}** offiziell **akzeptiert**.\n\nVielen Dank für dein Engagement!`).setColor('#2ECC71').setTimestamp();
                await ticketChannel.send({ embeds: [statusEmbed] });
            } else if (action === 'adm_rej') {
                const statusEmbed = new EmbedBuilder().setTitle('❌ Status-Update: Abgelehnt').setDescription(`Deine Anfrage wurde von **${adminUser.username}** abgelehnt. Falls du Fragen dazu hast, antworte direkt hier im Chat.`).setColor('#E74C3C').setTimestamp();
                await ticketChannel.send({ embeds: [statusEmbed] });
            }
        }
    }

    // 8. BUTTON "TICKET SCHLIESSEN"
    if (interaction.isButton() && interaction.customId === 'close_ticket') {
        await interaction.reply({ content: '🔒 Ticket wird in 5 Sekunden geschlossen...' });
        setTimeout(() => interaction.channel.delete().catch(() => {}), 5000);
    }
});

// 9. CHAT NACHRICHTEN VERARBEITEN (ADMIN-BEFEHL !setup & KI-ANTWORTEN)
client.on('messageCreate', async (message) => {
    if (message.author.bot) return;

    // FREIER SETUP BEFEHL FÜR PANELS
    if (message.content.trim() === '!setup') {
        let logBuffer = [];
        const statusMsg = await message.reply('🔄 Starte Panel-Einrichtung...');
        
        await setupAllPanels(async (msgText) => {
            logBuffer.push(msgText);
            await statusMsg.edit(`🔄 **Setup-Fortschritt:**\n${logBuffer.join('\n')}`).catch(() => {});
        });
        
        return;
    }

    const channelName = message.channel.name ? message.channel.name.toLowerCase() : '';
    const isStrictTicketChannel = 
        channelName.startsWith('transfer-') ||
        channelName.startsWith('ergebnis-') ||
        channelName.startsWith('verstoss-') ||
        channelName.startsWith('website-') ||
        channelName.startsWith('profil-') ||
        channelName.startsWith('disconnect-') ||
        channelName.startsWith('sonstiges-') ||
        channelName.startsWith('teamreg-') ||
        channelName.startsWith('koop-') ||
        channelName.startsWith('ticket-');

    if (!isStrictTicketChannel) return;

    const isUserAdmin = message.member?.roles.cache.some(role => 
        role.name.toLowerCase() === CONFIG.ADMIN_ROLE_NAME.toLowerCase() || 
        role.name.toLowerCase() === CONFIG.HEAD_ADMIN_ROLE_NAME.toLowerCase()
    );

    if (isUserAdmin) return;

    try {
        await message.channel.sendTyping();
        const rawMessages = await message.channel.messages.fetch({ limit: 8 });
        const contextLines = [];
        Array.from(rawMessages.values()).reverse().forEach(msg => {
            contextLines.push(`${msg.author.bot ? "KI" : msg.author.username}: ${msg.content}`);
        });

        const reply = await askBotBrain(`Support-Ticket Chatverlauf:\n${contextLines.join('\n')}\nAntwort:`);
        await message.reply({ content: reply.replace('[ADMIN_PING_REQUIRED]', '').trim() });
    } catch (e) {
        console.error(e);
    }
});

client.login(CONFIG.TOKEN);

