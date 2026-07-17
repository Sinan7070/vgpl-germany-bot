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

console.log("VGPL Germany Multiformular-Bot wird geladen...");

// Bot-Client initialisieren
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
    PANEL_CHANNEL_ID: '1527708821320106164', // Kanal für das Ticket-Panel
    CATEGORY_ID: '1527708420788977674', // Kategorie für erstellte Tickets
    ADMIN_ROLE_NAME: 'Admin', // Der genaue Name deiner Admin-Rolle
    HEAD_ADMIN_ROLE_NAME: 'Head Admin' // Der genaue Name deiner Head-Admin-Rolle
};

// Dummy-Webserver für Render
if (process.env.PORT || 3000) {
    const http = require('http');
    const port = process.env.PORT || 3000;
    http.createServer((req, res) => {
        res.writeHead(200, { 'Content-Type': 'text/plain' });
        res.end('VGPL Germany Ticket Bot läuft online!\n');
    }).listen(port, () => {
        console.log(`Webserver aktiv auf Port ${port}`);
    });
}

// Event: Bot ist bereit
client.once('ready', async () => {
    console.log(`Eingeloggt als ${client.user.tag}!`);

    try {
        const channel = await client.channels.fetch(CONFIG.PANEL_CHANNEL_ID);
        if (!channel) {
            console.error('Der konfigurierte Panel-Kanal wurde nicht gefunden.');
            return;
        }

        // Altes Panel entfernen, um Spam zu verhindern
        const messages = await channel.messages.fetch({ limit: 10 });
        const hasPanel = messages.some(msg => msg.embeds.length > 0 && msg.components.length > 0);

        if (!hasPanel) {
            const embed = new EmbedBuilder()
                .setTitle('📩 Support-Ticket erstellen')
                .setDescription('Benötigst du Hilfe, möchtest du einen Verstoß melden oder gibt es Probleme?\n\nWähle unten im Menü die passende Kategorie aus, um ein Ticket zu öffnen. Fülle anschließend das Formular aus.')
                .setColor('#FF0000')
                .setThumbnail(channel.guild.iconURL())
                .setFooter({ text: 'VGPL Germany Support-System' });

            // Dropdown-Menü für die Kategorien
            const selectMenu = new StringSelectMenuBuilder()
                .setCustomId('select_ticket_category')
                .setPlaceholder('Wähle eine Ticket-Kategorie...')
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

            await channel.send({ embeds: [embed], components: [row] });
            console.log('Ticket-Panel erfolgreich gesendet!');
        } else {
            console.log('Das Ticket-Panel existiert bereits.');
        }
    } catch (error) {
        console.error('Fehler beim Einrichten des Ticket-Panels:', error);
    }
});

// Interaktionen abfangen (Menüauswahl & Formular-Absendungen)
client.on('interactionCreate', async (interaction) => {
    const guild = interaction.guild;
    if (!guild) return;

    // Finde die Admin-Rollen auf dem Server
    const adminRole = guild.roles.cache.find(r => r.name.toLowerCase() === CONFIG.ADMIN_ROLE_NAME.toLowerCase());
    const headAdminRole = guild.roles.cache.find(r => r.name.toLowerCase() === CONFIG.HEAD_ADMIN_ROLE_NAME.toLowerCase());

    // 1. DOCKDOWN MENÜ AUSWAHL -> MODAL (FORMULAR) ÖFFNEN
    if (interaction.isStringSelectMenu() && interaction.customId === 'select_ticket_category') {
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
                new ActionRowBuilder().addComponents(new TextInputBuilder().setCustomId('art').setLabel('Art des Verstoßes').setPlaceholder('z.B. Beleidigung, Glitching, Cheating').setStyle(TextInputStyle.Short).setRequired(true)),
                new ActionRowBuilder().addComponents(new TextInputBuilder().setCustomId('uhrzeit').setLabel('Uhrzeit des Vorfalls').setStyle(TextInputStyle.Short).setRequired(true)),
                new ActionRowBuilder().addComponents(new TextInputBuilder().setCustomId('beschreibung').setLabel('Beschreibung').setStyle(TextInputStyle.Paragraph).setRequired(true))
            );
            return interaction.showModal(modal);
        }

        if (choice === 'ticket_website') {
            const modal = new ModalBuilder().setCustomId('modal_website').setTitle('4. Website Problem');
            modal.addComponents(
                new ActionRowBuilder().addComponents(new TextInputBuilder().setCustomId('seite').setLabel('Welche Seite ist betroffen?').setStyle(TextInputStyle.Short).setRequired(true)),
                new ActionRowBuilder().addComponents(new TextInputBuilder().setCustomId('aktion').setLabel('Welche Aktion hast du durchgeführt?').setStyle(TextInputStyle.Short).setRequired(true)),
                new ActionRowBuilder().addComponents(new TextInputBuilder().setCustomId('fehler').setLabel('Fehlermeldung').setStyle(TextInputStyle.Paragraph).setRequired(false)),
                new ActionRowBuilder().addComponents(new TextInputBuilder().setCustomId('browser').setLabel('Browser (Chrome, Safari, Firefox usw.)').setStyle(TextInputStyle.Short).setRequired(true))
            );
            return interaction.showModal(modal);
        }

        if (choice === 'ticket_account') {
            const modal = new ModalBuilder().setCustomId('modal_account').setTitle('5. Account / Profil Problem');
            modal.addComponents(
                new ActionRowBuilder().addComponents(new TextInputBuilder().setCustomId('discord_name').setLabel('Discord Name').setStyle(TextInputStyle.Short).setValue(interaction.user.tag)),
                new ActionRowBuilder().addComponents(new TextInputBuilder().setCustomId('ids').setLabel('EA-ID / PSN / Xbox ID').setStyle(TextInputStyle.Short).setRequired(true)),
                new ActionRowBuilder().addComponents(new TextInputBuilder().setCustomId('feld').setLabel('Welches Profilfeld ist falsch?').setStyle(TextInputStyle.Short).setRequired(true)),
                new ActionRowBuilder().addComponents(new TextInputBuilder().setCustomId('zeit').setLabel('Seit wann besteht das Problem?').setStyle(TextInputStyle.Short).setRequired(true))
            );
            return interaction.showModal(modal);
        }

        if (choice === 'ticket_disconnect') {
            const modal = new ModalBuilder().setCustomId('modal_disconnect').setTitle('6. Spielabbruch / Disconnect');
            modal.addComponents(
                new ActionRowBuilder().addComponents(new TextInputBuilder().setCustomId('teams').setLabel('Beide Teamnamen').setStyle(TextInputStyle.Short).setRequired(true)),
                new ActionRowBuilder().addComponents(new TextInputBuilder().setCustomId('stand').setLabel('Spielstand zum Zeitpunkt des Abruchs').setStyle(TextInputStyle.Short).setRequired(true)),
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

    // 2. FORMULAR WURDE ABGESCHICKT -> TICKET ERSTELLEN
    if (interaction.isModalSubmit()) {
        await interaction.deferReply({ ephemeral: true });

        const member = interaction.member;
        const customId = interaction.customId;
       
        let ticketPrefix = 'ticket';
        let embedTitle = 'Support Ticket';
        let fields = [];
        let botResponse = '';
        let pingAdmin = false;

        // Formulardaten auslesen & Logik definieren
        if (customId === 'modal_transfer') {
            ticketPrefix = 'transfer';
            embedTitle = '🔄 Transfer Problem';
            const discName = interaction.fields.getTextInputValue('discord_name');
            const gameId = interaction.fields.getTextInputValue('ids');
            const teamAlt = interaction.fields.getTextInputValue('team_alt');
            const teamNeu = interaction.fields.getTextInputValue('team_neu');
            const errMsg = interaction.fields.getTextInputValue('error_text');

            fields = [
                { name: 'Discord Name', value: discName, inline: true },
                { name: 'EA-ID / PSN / Xbox ID', value: gameId, inline: true },
                { name: 'Aktuelles Team', value: teamAlt, inline: true },
                { name: 'Gewünschtes Team', value: teamNeu, inline: true },
                { name: 'Fehlermeldung (Text)', value: errMsg }
            ];

            botResponse = `**KI-Assistent:**\nDanke für deine Angaben.\nBitte prüfe zusätzlich:\n• Hast du bereits 3 Transfers in dieser Saison genutzt?\n• Bist du noch in einem anderen Team registriert?\n• Ist das Transferfenster aktuell geöffnet?\n\n*Falls der Fehler weiterhin besteht, antworte hier im Chat mit **TRANSFER FEHLER BESTÄTIGT** und lade einen Screenshot hoch.*`;
            pingAdmin = false; // Nur bei Chat-Bestätigung pingen!
        }

        else if (customId === 'modal_ergebnis') {
            ticketPrefix = 'ergebnis';
            embedTitle = '📊 Ergebnis Problem';
            const heim = interaction.fields.getTextInputValue('heim');
            const gast = interaction.fields.getTextInputValue('gast');
            const eAlt = interaction.fields.getTextInputValue('erg_alt');
            const eNeu = interaction.fields.getTextInputValue('erg_neu');
            const spieltag = interaction.fields.getTextInputValue('spieltag');

            fields = [
                { name: 'Heimteam', value: heim, inline: true },
                { name: 'Auswärtsteam', value: gast, inline: true },
                { name: 'Eingetragenes Ergebnis', value: eAlt, inline: true },
                { name: 'Korrektes Ergebnis', value: eNeu, inline: true },
                { name: 'Spieltag', value: spieltag, inline: true }
            ];

            botResponse = `**KI-Assistent:**\nDas Ergebnisproblem wurde erfasst.\nBitte stelle sicher, dass du einen Screenshot hochlädst, der das vollständige Endergebnis zeigt. Ein Admin wird den Fall prüfen und gegebenenfalls korrigieren.`;
            pingAdmin = true; // Sofort Admin markieren
        }

        else if (customId === 'modal_verstoss') {
            ticketPrefix = 'verstoss';
            embedTitle = '⚠️ Regelverstoß gemeldet';
            const teamEigen = interaction.fields.getTextInputValue('team_eigen');
            const teamGegner = interaction.fields.getTextInputValue('team_gegner');
            const art = interaction.fields.getTextInputValue('art');
            const uhrzeit = interaction.fields.getTextInputValue('uhrzeit');
            const beschreibung = interaction.fields.getTextInputValue('beschreibung');

            fields = [
                { name: 'Eigenes Team', value: teamEigen, inline: true },
                { name: 'Gegnerisches Team', value: teamGegner, inline: true },
                { name: 'Art des Verstoßes', value: art, inline: true },
                { name: 'Uhrzeit des Vorfalls', value: uhrzeit, inline: true },
                { name: 'Beschreibung', value: beschreibung }
            ];

            botResponse = `**KI-Assistent:**\nDer Regelverstoß wurde aufgenommen.\nBitte lade einen eindeutigen Beweis (Screenshot oder Video) hoch. Ohne visuelle Beweise kann der Fall möglicherweise nicht bearbeitet werden.`;
            pingAdmin = true; // Sofort Admin markieren
        }

        else if (customId === 'modal_website') {
            ticketPrefix = 'website';
            embedTitle = '🌐 Website Problem';
            const seite = interaction.fields.getTextInputValue('seite');
            const aktion = interaction.fields.getTextInputValue('aktion');
            const fehler = interaction.fields.getTextInputValue('fehler') || 'Keine Angabe';
            const browser = interaction.fields.getTextInputValue('browser');

            fields = [
                { name: 'Betroffene Seite', value: seite, inline: true },
                { name: 'Durchgeführte Aktion', value: aktion, inline: true },
                { name: 'Browser', value: browser, inline: true },
                { name: 'Fehlermeldung', value: fehler }
            ];

            botResponse = `**KI-Assistent:**\nBitte versuche zuerst:\n• Browser neu starten\n• Cache & Cookies löschen\n• Inkognito-Modus verwenden\n• Einen anderen Browser testen\n\n*Wenn der Fehler weiterhin besteht, schreibe eine kurze Nachricht. Ein Website-Administrator wird dann benachrichtigt.*`;
            pingAdmin = false; // Erst nach KI-Check
        }

        else if (customId === 'modal_account') {
            ticketPrefix = 'profil';
            embedTitle = '👤 Account / Profil Problem';
            const discName = interaction.fields.getTextInputValue('discord_name');
            const gameId = interaction.fields.getTextInputValue('ids');
            const feld = interaction.fields.getTextInputValue('feld');
            const zeit = interaction.fields.getTextInputValue('zeit');

            fields = [
                { name: 'Discord Name', value: discName, inline: true },
                { name: 'EA-ID / PSN / Xbox ID', value: gameId, inline: true },
                { name: 'Falsches Profilfeld', value: feld, inline: true },
                { name: 'Besteht seit', value: zeit, inline: true }
            ];

            botResponse = `**KI-Assistent:**\nBitte überprüfe, ob du dein Profil bereits gespeichert hast. Änderungen können bis zu einigen Minuten benötigen, um auf der Plattform angezeigt zu werden.`;
            pingAdmin = false; // Admin-Ping nur bei Daten-Konflikten
        }

        else if (customId === 'modal_disconnect') {
            ticketPrefix = 'disconnect';
            embedTitle = '🔌 Spielabbruch / Disconnect';
            const teams = interaction.fields.getTextInputValue('teams');
            const stand = interaction.fields.getTextInputValue('stand');
            const minute = interaction.fields.getTextInputValue('minute');
            const wer = interaction.fields.getTextInputValue('wer');

            fields = [
                { name: 'Teams', value: teams, inline: true },
                { name: 'Spielstand bei Abbruch', value: stand, inline: true },
                { name: 'Minute des Abbruchs', value: minute, inline: true },
                { name: 'Disconnected Partei', value: wer, inline: true }
            ];

            botResponse = `**KI-Assistent:**\nDer Disconnect-Fall wurde registriert.\nBitte lade hier einen Screenshot oder ein Video hoch, damit die Ligaleitung über eine Wiederholung oder Wertung entscheiden kann.`;
            pingAdmin = true; // Sofort pingen
        }

        else if (customId === 'modal_sonstiges') {
            ticketPrefix = 'sonstiges';
            embedTitle = '📝 Sonstiges Anliegen';
            const betreff = interaction.fields.getTextInputValue('betreff');
            const beschreibung = interaction.fields.getTextInputValue('beschreibung');

            fields = [
                { name: 'Betreff', value: betreff },
                { name: 'Beschreibung', value: beschreibung }
            ];

            botResponse = `**KI-Assistent:**\nDanke für deine Nachricht. Ein Supporter wird dein Anliegen prüfen. Falls du weitere Informationen oder einen Screenshot hast, sende diese bitte einfach direkt in dieses Ticket.`;
            pingAdmin = false; // Kein Admin-Ping standardmäßig
        }

        try {
            // Berechtigungen für das Ticket festlegen (User + Bot)
            const permissionOverwrites = [
                {
                    id: guild.roles.everyone.id,
                    deny: [PermissionFlagsBits.ViewChannel],
                },
                {
                    id: member.id,
                    allow: [
                        PermissionFlagsBits.ViewChannel,
                        PermissionFlagsBits.SendMessages,
                        PermissionFlagsBits.ReadMessageHistory,
                        PermissionFlagsBits.AttachFiles,
                        PermissionFlagsBits.EmbedLinks
                    ],
                },
                {
                    id: client.user.id,
                    allow: [
                        PermissionFlagsBits.ViewChannel,
                        PermissionFlagsBits.SendMessages,
                        PermissionFlagsBits.ReadMessageHistory,
                        PermissionFlagsBits.AttachFiles,
                        PermissionFlagsBits.EmbedLinks,
                        PermissionFlagsBits.ManageChannels
                    ]
                }
            ];

            // Wenn "Admin" Rolle existiert, füge sie dem Ticket-Kanal hinzu
            if (adminRole) {
                permissionOverwrites.push({
                    id: adminRole.id,
                    allow: [
                        PermissionFlagsBits.ViewChannel,
                        PermissionFlagsBits.SendMessages,
                        PermissionFlagsBits.ReadMessageHistory,
                        PermissionFlagsBits.AttachFiles,
                        PermissionFlagsBits.EmbedLinks,
                        PermissionFlagsBits.ManageChannels
                    ]
                });
            }

            // Wenn "Head Admin" Rolle existiert, füge sie dem Ticket-Kanal hinzu
            if (headAdminRole) {
                permissionOverwrites.push({
                    id: headAdminRole.id,
                    allow: [
                        PermissionFlagsBits.ViewChannel,
                        PermissionFlagsBits.SendMessages,
                        PermissionFlagsBits.ReadMessageHistory,
                        PermissionFlagsBits.AttachFiles,
                        PermissionFlagsBits.EmbedLinks,
                        PermissionFlagsBits.ManageChannels
                    ]
                });
            }

            // Ticketkanal erstellen
            const ticketChannel = await guild.channels.create({
                name: `${ticketPrefix}-${member.user.username.toLowerCase()}`,
                type: ChannelType.GuildText,
                parent: CONFIG.CATEGORY_ID,
                permissionOverwrites: permissionOverwrites,
                topic: `Formular-Ticket von ${member.user.tag}`
            });

            // Erstelle das Embed mit den Antworten aus dem Formular
            const infoEmbed = new EmbedBuilder()
                .setTitle(embedTitle)
                .setDescription(`Dieses Ticket wurde von ${member} erstellt. Unten findest du die Angaben aus dem Formular.`)
                .addFields(fields)
                .setColor('#0099FF')
                .setTimestamp();

            // Erstelle das Embed für die automatische KI-Antwort
            const aiEmbed = new EmbedBuilder()
                .setTitle('🤖 System-Antwort')
                .setDescription(botResponse)
                .setColor('#2F3136')
                .setTimestamp();

            // Schließen-Button
            const closeButton = new ButtonBuilder()
                .setCustomId('close_ticket')
                .setLabel('Ticket schließen')
                .setEmoji('🔒')
                .setStyle(ButtonStyle.Danger);

            const row = new ActionRowBuilder().addComponents(closeButton);

            // Ping-String zusammenbauen
            let contentString = `${member}`;
            if (pingAdmin) {
                if (adminRole) contentString += ` | ${adminRole}`;
                if (headAdminRole) contentString += ` | ${headAdminRole}`;
            }

            await ticketChannel.send({
                content: contentString,
                embeds: [infoEmbed, aiEmbed],
                components: [row]
            });

            await interaction.editReply({
                content: `Dein Ticket wurde erfolgreich erstellt: ${ticketChannel}`,
                ephemeral: true
            });

        } catch (error) {
            console.error('Fehler beim Erstellen des Formular-Tickets:', error);
            await interaction.editReply({
                content: 'Es gab einen Fehler beim Generieren deines Tickets. Bitte informiere einen Administrator.',
                ephemeral: true
            });
        }
    }

    // 3. TICKET SCHLIESSEN INTERAKTION
    if (interaction.isButton() && interaction.customId === 'close_ticket') {
        await interaction.reply({ content: '🔒 Dieses Ticket wird in 5 Sekunden geschlossen und gelöscht...' });
        setTimeout(async () => {
            try {
                await interaction.channel.delete();
            } catch (err) {
                console.error('Fehler beim Löschen des Tickets:', err);
            }
        }, 5000);
    }
});

// 4. INTERAKTIVES CHAT-CHECKING (Verzögerte Pings über Texteingaben)
client.on('messageCreate', async (message) => {
    if (message.author.bot) return;

    if (message.channel.parentId === CONFIG.CATEGORY_ID) {
        const adminRole = message.guild.roles.cache.find(r => r.name.toLowerCase() === CONFIG.ADMIN_ROLE_NAME.toLowerCase());
        const headAdminRole = message.guild.roles.cache.find(r => r.name.toLowerCase() === CONFIG.HEAD_ADMIN_ROLE_NAME.toLowerCase());
       
        // Regel für Transfer-Tickets
        if (message.channel.name.startsWith('transfer-')) {
            if (message.content.toUpperCase().includes('TRANSFER FEHLER BESTÄTIGT')) {
                let pingContent = `🔔 **Admin-Benachrichtigung:** Ein Fehler wurde bestätigt. `;
                const mentions = [];
               
                if (adminRole) {
                    pingContent += `${adminRole} `;
                    mentions.push(adminRole.id);
                }
                if (headAdminRole) {
                    pingContent += `${headAdminRole} `;
                    mentions.push(headAdminRole.id);
                }
               
                pingContent += `, bitte prüfen!`;

                await message.reply({
                    content: pingContent,
                    allowedMentions: { roles: mentions }
                });
            }
        }

        // Regel für Website-Tickets
        if (message.channel.name.startsWith('website-')) {
            const messages = await message.channel.messages.fetch({ limit: 5 });
            const userMessages = messages.filter(m => !m.author.bot);
           
            if (userMessages.size === 2) {
                let pingContent = `🔔 **Admin-Benachrichtigung:** Die Standard-Lösungsschritte haben nicht geholfen. `;
                const mentions = [];
               
                if (adminRole) {
                    pingContent += `${adminRole} `;
                    mentions.push(adminRole.id);
                }
                if (headAdminRole) {
                    pingContent += `${headAdminRole} `;
                    mentions.push(headAdminRole.id);
                }
               
                pingContent += `, bitte übernehmen!`;

                await message.reply({
                    content: pingContent,
                    allowedMentions: { roles: mentions }
                });
            }
        }
    }
});

// Login
client.login(CONFIG.TOKEN);
