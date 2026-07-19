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

console.log("VGPL Germany Support-Bot mit Gemini-Regelwerk-KI wird gestartet...");

// Bot-Client initialisieren
const client = new Client({
    intents: [
        GatewayIntentBits.Guilds,
        GatewayIntentBits.GuildMessages,
        GatewayIntentBits.MessageContent
    ]
});

// EXAKTE KANAL- UND KATEGORIE-KONFIGURATION FÜR DEN SUPPORT-BOT
const CONFIG = {
    TOKEN: process.env.DISCORD_TOKEN, // In den Render-Environment Variables eingetragen
    GEMINI_API_KEY: process.env.GEMINI_API_KEY || "", // Der Gemini API Key (wird in Render eingetragen)
    PANEL_CHANNEL_ID: '1527708821320106164', // Kanal für Support-Panel (#hilfe)
    CATEGORY_ID: '1527708420788977674', // Kategorie für Support-Tickets
    ADMIN_ROLE_NAME: 'Admin', // Genauer Name der Admin-Rolle
    HEAD_ADMIN_ROLE_NAME: 'Head Admin' // Genauer Name der Head-Admin-Rolle
};

// Das exklusive Wissen der VGPL Germany basierend auf dem hochgeladenen PDF-Regelwerk
const VGPL_KNOWLEDGE = `
Du bist der offizielle, hochprofessionelle KI-Support-Assistent der VGPL Germany (virtual Gaming Premier League). 
Deine Aufgabe ist es, Usern in Support-Tickets schnell, freundlich, sportlich und extrem präzise basierend auf dem offiziellen Regelwerk (Stand: FC 26 Saison 1) zu helfen.

ALLGEMEINE INFORMATIONEN:
- Liga: virtual Gaming Premier League (VGPL Germany).
- Spiel: EA SPORTS FC Pro Clubs (Crossplay auf PS5, Xbox Series X/S und PC).
- Website: https://virtualgamingpremierleague.com
- Kommunikationswege: VGPL Website, Discord, offizielle Social-Media-Kanäle.

OFFIZIELLES LIGAREGELWERK (WICHTIGSTE PARAGRAPHEN):

§3 VEREINE:
- Benötigt: 1 Manager, 1 stellvertretenden Manager, mindestens 7 aktive Spieler.

§4 SPIELERREGISTRIERUNG & TRANSFERS:
- Nur ein VGPL-Konto pro Spieler erlaubt. Multi-Accounts sind strengstens verboten (führen zu permanentem Bann).
- Pro Saison darf ein Spieler nur für einen Verein aktiv sein.
- Maximal 3 Transfers pro Saison sind standardmäßig erlaubt. Transfers sind nur innerhalb offizieller Transferphasen erlaubt, die von der Ligaleitung festgelegt werden.

§6 SPIELBETRIEB:
- Antrittspflicht: Teams müssen zum angesetzten Termin spielen.
- Mindestspielerzahl: Ein Spiel darf mit mindestens 7 Spielern begonnen werden.
- Verspätung: Wartezeit bis zu 10 Minuten. Danach kann ein Antrag auf 0:3 Wertung gestellt werden.

§7 VERBINDUNGSABBRÜCHE:
- Vor Spielbeginn: Neustart des Spiels.
- Innerhalb der ersten 10 Minuten: Wenn kein Tor gefallen ist und kein Platzverweis vorliegt, wird das Spiel wiederholt. Falls bereits ein Tor oder Platzverweis vorliegt, entscheidet die Ligaleitung.
- Nach der 10. Minute: Die Ligaleitung entscheidet anhand der Situation, des Spielstands, der Beweise und des Fairplay-Gedankens.

§17 GRÖSSENLIMITS (ZUR CHANCENGLEICHHEIT - EXTREM WICHTIG!):
- Innenverteidiger (IV): Maximal 1,87 m groß.
- Alle übrigen Feldspieler (inklusive ZDM, ZOM, ST etc.): Maximal 1,82 m groß.
- Torhüter: Keine Größenbeschränkung.
- Formationsregelungen:
  • 3er-Kette: maximal 3 Innenverteidiger mit 1,87 m.
  • 4er-Kette: maximal 2 Innenverteidiger mit 1,87 m; zusätzlich darf 1 ZDM 1,87 m groß sein.
  • 5er-Kette: maximal 3 Innenverteidiger mit 1,87 m.
- Sanktionen bei Verstoß: Erstverstoß = Verwarnung; Zweitverstoß = 0:3 Spielwertung gegen das Team; Vorsatz = 4 Wochen Sperre; wiederholter Betrug = Saison-Ausschluss.

§18 GESCHLECHTERREGELUNG:
- Das Pro Clubs Spieler-Geschlecht im Spiel muss dem tatsächlichen Geschlecht des echten Spielers entsprechen. (Verstoß: Verwarnung -> 1 Spiel Sperre -> 4 Wochen Sperre).

§19 STREAMPLICHT:
- Alle Ligaspiele müssen live auf Twitch, YouTube oder Kick übertragen werden.
- Streamlink spätestens 5 Minuten vor Anpfiff im Discord posten.
- VOD (Video on Demand) muss mindestens 48 Stunden öffentlich gespeichert bleiben.
- Spielstand und Gegnername müssen im Stream erkennbar sein.
- Verstoß: Verwarnung -> Zweitverstoß: 0:3 Wertung.

§20 LIVE-JOIN-VERBOT:
- Nach dem Anpfiff darf kein Spieler über die Live-Join-Funktion nachträglich ins laufende Spiel beitreten.
- Verstoß: Sofortige 0:3 Wertung gegen das Team.

§10 & §22 PROTESTE EINREICHEN:
- Proteste müssen innerhalb von 24 Stunden nach Spielende eingereicht werden.
- Ein Protest MUSS enthalten: Spieltag, Gegner, exakte Beschreibung des Regelverstoßes sowie klare Video- oder Bildbeweise. Proteste ohne Beweise werden ignoriert.

SANKTIONSKATALOG (KURZÜBERSICHT):
- Nichtantritt: 0:3 Wertung gegen das Team.
- Einsatz nicht registrierter oder gesperrter Spieler: 0:3 Wertung.
- Account-Sharing: 4 Wochen Sperre für den Spieler -> Saison-Ausschluss.
- Cheating / Modding: Saison-Ausschluss -> permanenten Bann.
- Beleidigungen: 1-3 Spiele Sperre -> 4-10 Spiele Sperre.
- Diskriminierung / Rassismus: Mindestens 8 Spiele Sperre -> permanenten Bann.
- Täuschung der Ligaleitung: 2 bis 6 Spiele Sperre -> Saison-Ausschluss.

DEINE VERHALTENSREGELN ALS KI:
- Sei stets höflich, professionell, neutral und sportlich im Ton.
- Beantworte Regelfragen basierend auf den obigen Paragraphen (z. B. Größenlimits, Disconnects, Streamregeln) präzise und nenne den Paragraphen, falls zutreffend.
- WICHTIG: Wenn der User eine Frage stellt, die du nicht weißt, wenn er einen Protest einreichen will, wenn er Ergebnisse werten lassen möchte, oder wenn er explizit nach einem "Admin", "Mensch", "Supporter" oder "Manager" verlangt, antworte höflich, dass du sofort das Admin-Team hinzuziehst. Füge am Ende deiner Antwort exakt das Wort "[ADMIN_PING_REQUIRED]" (ohne Anführungszeichen) hinzu, damit der Bot die Administratoren anpingt!
- Gib bei Fehlern auf der Website immer erst klassische KI-Tipps (Cache & Cookies löschen, Inkognito-Modus, Browser wechseln), bevor du Admins einschaltest.
`;

// Hilfsfunktion zur Kommunikation mit der Gemini-API mit Exponential Backoff bei Fehlern
async function askGemini(userQuery, retries = 5, delay = 1000) {
    const apiKey = CONFIG.GEMINI_API_KEY;
    if (!apiKey) {
        return "Support-Hinweis: Die KI ist aktuell im Standby-Modus. Bitte warte einen Moment, ein Admin wird gleich für dich da sein!";
    }

    const url = `https://generativelanguage.googleapis.com/v1beta/models/gemini-2.5-flash-preview-09-2025:generateContent?key=${apiKey}`;
    
    const payload = JSON.stringify({
        contents: [{ parts: [{ text: userQuery }] }],
        systemInstruction: { parts: [{ text: VGPL_KNOWLEDGE }] }
    });

    return new Promise((resolve) => {
        const makeRequest = (currentRetry) => {
            const req = https.request(url, {
                method: 'POST',
                headers: {
                    'Content-Type': 'application/json',
                    'Content-Length': Buffer.byteLength(payload)
                }
            }, (res) => {
                let data = '';
                res.on('data', chunk => data += chunk);
                res.on('end', () => {
                    try {
                        const json = JSON.parse(data);
                        const reply = json.candidates?.[0]?.content?.parts?.[0]?.text;
                        if (reply) {
                            resolve(reply);
                        } else {
                            handleError(new Error("Ungültiges API-Format von Google erhalten."));
                        }
                    } catch (e) {
                        handleError(e);
                    }
                });
            });

            const handleError = (err) => {
                if (currentRetry > 0) {
                    setTimeout(() => makeRequest(currentRetry - 1), delay * Math.pow(2, 5 - currentRetry));
                } else {
                    resolve("Ich habe gerade eine kleine Denkpause. Ein Admin wurde benachrichtigt und hilft dir gleich persönlich weiter!");
                }
            };

            req.on('error', handleError);
            req.write(payload);
            req.end();
        };

        makeRequest(retries);
    });
}

// Event: Bot ist bereit
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
                    .setDescription('Benötigst du Hilfe, hast du Fragen oder möchtest du ein Problem melden?\n\nWähle unten im Menü die passende Kategorie aus, um ein Ticket zu öffnen. Unser intelligenter Support-Bot hilft dir sofort!')
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

                const row = new ActionRowBuilder().addComponents(selectMenu);
                await supportChannel.send({ embeds: [embed], components: [row] });
                console.log('Support-Panel erfolgreich gesendet!');
            }
        }
    } catch (err) {
        console.error('Fehler beim Einrichten des Support-Panels:', err);
    }
});

// Interaktionen verarbeiten (Menüauswahl, Modals, Buttons)
client.on('interactionCreate', async (interaction) => {
    const guild = interaction.guild;
    if (!guild) return;

    const adminRole = guild.roles.cache.find(r => r.name.toLowerCase() === CONFIG.ADMIN_ROLE_NAME.toLowerCase());
    const headAdminRole = guild.roles.cache.find(r => r.name.toLowerCase() === CONFIG.HEAD_ADMIN_ROLE_NAME.toLowerCase());

    // 1. DROPDOWN SUPPORT-MENÜ GEWÄHLT -> MODALS ÖFFNEN
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

    // 2. MODAL ABGESCHICKT -> TICKET ERSTELLEN & ERSTKONTAKT PER KI GENERIEREN
    if (interaction.isModalSubmit()) {
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
            const id = interaction.fields.getTextInputValue('ids');
            const teamAlt = interaction.fields.getTextInputValue('team_alt');
            const teamNeu = interaction.fields.getTextInputValue('team_neu');
            const err = interaction.fields.getTextInputValue('error_text');
            fields = [
                { name: 'Discord Name', value: interaction.fields.getTextInputValue('discord_name'), inline: true },
                { name: 'EA-ID / Platform ID', value: id, inline: true },
                { name: 'Altes Team', value: teamAlt, inline: true },
                { name: 'Neues Team', value: teamNeu, inline: true },
                { name: 'Fehlermeldung', value: err }
            ];
            contextForAI = `User hat ein Transfer-Problem gemeldet. EA-ID: ${id}. Wechsel von ${teamAlt} zu ${teamNeu}. Fehlermeldung: ${err}. Begrüße ihn und gib ihm Hilfe zum Transfersystem.`;
        }

        else if (customId === 'modal_ergebnis') {
            ticketPrefix = 'ergebnis';
            embedTitle = '📊 Ergebnis Problem';
            const heim = interaction.fields.getTextInputValue('heim');
            const gast = interaction.fields.getTextInputValue('gast');
            const eAlt = interaction.fields.getTextInputValue('erg_alt');
            const eNeu = interaction.fields.getTextInputValue('erg_neu');
            fields = [
                { name: 'Heimteam', value: heim, inline: true },
                { name: 'Auswärtsteam', value: gast, inline: true },
                { name: 'Eingetragen', value: eAlt, inline: true },
                { name: 'Soll sein', value: eNeu, inline: true },
                { name: 'Spieltag', value: interaction.fields.getTextInputValue('spieltag'), inline: true }
            ];
            contextForAI = `User meldet fehlerhaftes Ergebnis. ${heim} gegen ${gast}, eingetragen war ${eAlt}, korrekt ist ${eNeu}. Bitte um Screenshots und sage ihm, dass ein Admin es bearbeiten wird. (Füge [ADMIN_PING_REQUIRED] am Ende hinzu!)`;
        }

        else if (customId === 'modal_verstoss') {
            ticketPrefix = 'verstoss';
            embedTitle = '⚠️ Regelverstoß gemeldet';
            fields = [
                { name: 'Eigenes Team', value: interaction.fields.getTextInputValue('team_eigen'), inline: true },
                { name: 'Gegner', value: interaction.fields.getTextInputValue('team_gegner'), inline: true },
                { name: 'Art des Verstoßes', value: interaction.fields.getTextInputValue('art'), inline: true },
                { name: 'Uhrzeit', value: interaction.fields.getTextInputValue('uhrzeit'), inline: true },
                { name: 'Beschreibung', value: interaction.fields.getTextInputValue('beschreibung') }
            ];
            contextForAI = `User meldet Regelverstoß im Match ${interaction.fields.getTextInputValue('team_eigen')} gegen ${interaction.fields.getTextInputValue('team_gegner')}. Verstoß: ${interaction.fields.getTextInputValue('art')}. Erinnere ihn freundlich an die Pflicht, Videobeweise hochzuladen.`;
        }

        else if (customId === 'modal_website') {
            ticketPrefix = 'website';
            embedTitle = '🌐 Website Problem';
            fields = [
                { name: 'Seite', value: interaction.fields.getTextInputValue('seite'), inline: true },
                { name: 'Aktion', value: interaction.fields.getTextInputValue('aktion'), inline: true },
                { name: 'Browser', value: interaction.fields.getTextInputValue('browser'), inline: true },
                { name: 'Fehlermeldung', value: interaction.fields.getTextInputValue('fehler') || 'Keine' }
            ];
            contextForAI = `User meldet Website-Fehler auf Seite: ${interaction.fields.getTextInputValue('seite')}. Aktion: ${interaction.fields.getTextInputValue('aktion')}. Gib ihm klassische Tipps wie Cache leeren, Inkognito-Modus oder Browser-Wechsel.`;
        }

        else if (customId === 'modal_account') {
            ticketPrefix = 'profil';
            embedTitle = '👤 Account / Profil Problem';
            fields = [
                { name: 'Discord', value: interaction.fields.getTextInputValue('discord_name'), inline: true },
                { name: 'EA-ID', value: interaction.fields.getTextInputValue('ids'), inline: true },
                { name: 'Profilfeld', value: interaction.fields.getTextInputValue('feld'), inline: true },
                { name: 'Besteht seit', value: interaction.fields.getTextInputValue('zeit'), inline: true }
            ];
            contextForAI = `User hat ein Account- oder Profilproblem bezüglich des Feldes: ${interaction.fields.getTextInputValue('feld')}.`;
        }

        else if (customId === 'modal_disconnect') {
            ticketPrefix = 'disconnect';
            embedTitle = '🔌 Spielabbruch / Disconnect';
            fields = [
                { name: 'Teams', value: interaction.fields.getTextInputValue('teams'), inline: true },
                { name: 'Spielstand bei Abbruch', value: interaction.fields.getTextInputValue('stand'), inline: true },
                { name: 'Abbruchs-Minute', value: interaction.fields.getTextInputValue('minute'), inline: true },
                { name: 'Partei', value: interaction.fields.getTextInputValue('wer'), inline: true }
            ];
            contextForAI = `User meldet Verbindungsabbruch im Spiel ${interaction.fields.getTextInputValue('teams')} bei Minute ${interaction.fields.getTextInputValue('minute')}. Fordere Screenshots und sage, dass Admins die Regeln anwenden werden.`;
        }

        else if (customId === 'modal_sonstiges') {
            ticketPrefix = 'sonstiges';
            embedTitle = '📝 Sonstiges Anliegen';
            fields = [
                { name: 'Betreff', value: interaction.fields.getTextInputValue('betreff') },
                { name: 'Beschreibung', value: interaction.fields.getTextInputValue('beschreibung') }
            ];
            contextForAI = `User meldet sonstiges Anliegen. Betreff: ${interaction.fields.getTextInputValue('betreff')}. Beschreibung: ${interaction.fields.getTextInputValue('beschreibung')}. Antworte freundlich und versuche im Rahmen deiner Möglichkeiten zu helfen.`;
        }

        try {
            // Berechtigungen aufsetzen
            const permissionOverwrites = [
                { id: guild.roles.everyone.id, deny: [PermissionFlagsBits.ViewChannel] },
                { id: member.id, allow: [PermissionFlagsBits.ViewChannel, PermissionFlagsBits.SendMessages, PermissionFlagsBits.ReadMessageHistory, PermissionFlagsBits.AttachFiles, PermissionFlagsBits.EmbedLinks] },
                { id: client.user.id, allow: [PermissionFlagsBits.ViewChannel, PermissionFlagsBits.SendMessages, PermissionFlagsBits.ReadMessageHistory, PermissionFlagsBits.AttachFiles, PermissionFlagsBits.EmbedLinks, PermissionFlagsBits.ManageChannels] }
            ];

            if (adminRole) {
                permissionOverwrites.push({ id: adminRole.id, allow: [PermissionFlagsBits.ViewChannel, PermissionFlagsBits.SendMessages, PermissionFlagsBits.ReadMessageHistory, PermissionFlagsBits.AttachFiles, PermissionFlagsBits.EmbedLinks, PermissionFlagsBits.ManageChannels] });
            }
            if (headAdminRole) {
                permissionOverwrites.push({ id: headAdminRole.id, allow: [PermissionFlagsBits.ViewChannel, PermissionFlagsBits.SendMessages, PermissionFlagsBits.ReadMessageHistory, PermissionFlagsBits.AttachFiles, PermissionFlagsBits.EmbedLinks, PermissionFlagsBits.ManageChannels] });
            }

            // Ticketkanal erstellen
            const ticketChannel = await guild.channels.create({
                name: `${ticketPrefix}-${member.user.username.toLowerCase()}`,
                type: ChannelType.GuildText,
                parent: CONFIG.CATEGORY_ID,
                permissionOverwrites: permissionOverwrites,
                topic: `Support-Ticket von ${member.user.tag}`
            });

            // Info-Embed mit den Formulardaten erstellen
            const infoEmbed = new EmbedBuilder()
                .setTitle(embedTitle)
                .setDescription(`Dieses Ticket wurde von ${member} geöffnet.`)
                .addFields(fields)
                .setColor('#0099FF')
                .setTimestamp();

            // Erste intelligente Antwort von Gemini holen
            const aiRawReply = await askGemini(contextForAI);
            const aiCleanReply = aiRawReply.replace('[ADMIN_PING_REQUIRED]', '').trim();

            const aiEmbed = new EmbedBuilder()
                .setTitle('🤖 VGPL Support-KI')
                .setDescription(aiCleanReply)
                .setColor('#2F3136')
                .setFooter({ text: 'Gemini KI-Support' })
                .setTimestamp();

            const closeButton = new ButtonBuilder()
                .setCustomId('close_ticket')
                .setLabel('Ticket schließen')
                .setEmoji('🔒')
                .setStyle(ButtonStyle.Danger);

            const row = new ActionRowBuilder().addComponents(closeButton);

            // Alles senden
            await ticketChannel.send({
                content: `${member}`,
                embeds: [infoEmbed, aiEmbed],
                components: [row]
            });

            // Falls die KI sofort merkt, dass sie Admins braucht
            if (aiRawReply.includes('[ADMIN_PING_REQUIRED]')) {
                let alertString = `🔔 **Admin-Support benötigt:** `;
                const mentions = [];
                if (adminRole) { alertString += `${adminRole} `; mentions.push(adminRole.id); }
                if (headAdminRole) { alertString += `${headAdminRole} `; mentions.push(headAdminRole.id); }
                alertString += `, bitte prüfen!`;

                await ticketChannel.send({
                    content: alertString,
                    allowedMentions: { roles: mentions }
                });
            }

            await interaction.editReply({
                content: `Dein Support-Ticket wurde erfolgreich erstellt: ${ticketChannel}`,
                ephemeral: true
            });

        } catch (error) {
            console.error('Fehler beim Erstellen des Tickets:', error);
            await interaction.editReply({
                content: 'Es gab einen Fehler beim Generieren deines Tickets. Bitte wende dich an die Administration.',
                ephemeral: true
            });
        }
    }

    // 3. TICKET SCHLIESSEN BUTTON
    if (interaction.isButton() && interaction.customId === 'close_ticket') {
        await interaction.reply({ content: '🔒 Dieses Ticket wird in 5 Sekunden geschlossen...' });
        setTimeout(async () => {
            try {
                await interaction.channel.delete();
            } catch (err) {
                console.error(err);
            }
        }, 5000);
    }
});

// 4. LIVE CHAT-KONTROLLE MIT DER GEMINI-KI (Antwortet auf jede Nachricht im Ticket)
client.on('messageCreate', async (message) => {
    if (message.author.bot) return;

    // Nur in der Support-Ticket-Kategorie oder auf Ticket-Kanäle reagieren
    const isTicketChannel = message.channel.name && (
        message.channel.name.startsWith('transfer-') ||
        message.channel.name.startsWith('ergebnis-') ||
        message.channel.name.startsWith('verstoss-') ||
        message.channel.name.startsWith('website-') ||
        message.channel.name.startsWith('profil-') ||
        message.channel.name.startsWith('disconnect-') ||
        message.channel.name.startsWith('sonstiges-')
    );

    if (message.channel.parentId === CONFIG.CATEGORY_ID || isTicketChannel) {
        try {
            // Ladeanzeige (Bot tippt...) aktivieren
            await message.channel.sendTyping();

            // Verlauf laden für besseren Kontext
            const rawMessages = await message.channel.messages.fetch({ limit: 12 });
            const contextLines = [];

            // Sicherstellen, dass wir die Collection korrekt in ein Array umwandeln und umdrehen
            const msgArray = Array.from(rawMessages.values()).reverse();

            msgArray.forEach(msg => {
                const authorName = msg.author.bot ? "KI-Assistent" : msg.author.username;
                contextLines.push(`${authorName}: ${msg.content}`);
            });

            const promptText = `Es gibt einen neuen Chatverlauf in einem VGPL-Support-Ticket. Antworte auf die letzte Nachricht von ${message.author.username}.\n\nBisheriger Verlauf:\n${contextLines.join('\n')}\n\nAntwort des KI-Assistenten:`;

            // KI fragen
            const aiRawReply = await askGemini(promptText);
            const aiCleanReply = aiRawReply.replace('[ADMIN_PING_REQUIRED]', '').trim();

            // Antwort senden
            await message.reply({ content: aiCleanReply });

            // Wenn die KI merkt, dass ein Mensch eingreifen soll (Befehl im Text enthalten)
            if (aiRawReply.includes('[ADMIN_PING_REQUIRED]')) {
                const adminRole = message.guild.roles.cache.find(r => r.name.toLowerCase() === CONFIG.ADMIN_ROLE_NAME.toLowerCase());
                const headAdminRole = message.guild.roles.cache.find(r => r.name.toLowerCase() === CONFIG.HEAD_ADMIN_ROLE_NAME.toLowerCase());

                let alertString = `🔔 **Admin-Support wurde hinzugerufen:** `;
                const mentions = [];
                if (adminRole) { alertString += `${adminRole} `; mentions.push(adminRole.id); }
                if (headAdminRole) { alertString += `${headAdminRole} `; mentions.push(headAdminRole.id); }
                alertString += `, bitte übernehmen!`;

                await message.channel.send({
                    content: alertString,
                    allowedMentions: { roles: mentions }
                });
            }
        } catch (error) {
            console.error("Fehler bei der Nachrichtenverarbeitung im Support-Ticket:", error);
        }
    }
});

// Sicherheitsnetz für unerwartete Fehler (damit der Bot niemals abstürzt)
process.on('unhandledRejection', error => {
    console.error('Unerwarteter unbehandelter Fehler:', error);
});
process.on('uncaughtException', error => {
    console.error('Unerwartete Ausnahme:', error);
});

// Login
client.login(CONFIG.TOKEN);

