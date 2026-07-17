// Erforderliche Module aus discord.js importieren
const {
    Client,
    GatewayIntentBits,
    ActionRowBuilder,
    ButtonBuilder,
    ButtonStyle,
    EmbedBuilder,
    PermissionFlagsBits,
    ChannelType
} = require('discord.js');

// Bot-Client mit den benötigten Intents initialisieren
const client = new Client({
    intents: [
        GatewayIntentBits.Guilds,
        GatewayIntentBits.GuildMessages,
        GatewayIntentBits.MessageContent
    ]
});

// KONFIGURATION
const CONFIG = {
    TOKEN: 'DEIN_BOT_TOKEN_HIER', // Ersetze dies mit deinem Bot-Token aus dem Discord Developer Portal
    PANEL_CHANNEL_ID: '1527708821320106164', // Kanal, in dem der Ticket-Button sein soll
    CATEGORY_ID: '1527708420788977674', // Kategorie, in der die Tickets erstellt werden sollen
    SUPPORT_ROLE_ID: 'DEINE_SUPPORT_ROLLE_ID_HIER' // Optional: ID der Support-Rolle, die Tickets sehen darf
};

// Event: Bot ist bereit
client.once('ready', async () => {
    console.log(`Eingeloggt als ${client.user.tag}!`);

    try {
        // Holen des Kanals, in dem das Ticket-Panel gesendet werden soll
        const channel = await client.channels.fetch(CONFIG.PANEL_CHANNEL_ID);
        if (!channel) {
            console.error('Der konfigurierte Panel-Kanal wurde nicht gefunden.');
            return;
        }

        // Überprüfen, ob bereits Nachrichten im Kanal existieren, um Spam zu vermeiden
        const messages = await channel.messages.fetch({ limit: 10 });
        const hasPanel = messages.some(msg => msg.embeds.length > 0 && msg.components.length > 0);

        if (!hasPanel) {
            // Erstelle das Embed für das Ticket-Panel
            const embed = new EmbedBuilder()
                .setTitle('📩 Support-Ticket erstellen')
                .setDescription('Benötigst du Hilfe oder hast eine Frage? Klicke auf den Button unten, um ein privates Support-Ticket zu öffnen. Unser Team wird sich schnellstmöglich bei dir melden!')
                .setColor('#2F3136')
                .setFooter({ text: 'Ticket-System' });

            // Erstelle den Button zum Öffnen des Tickets
            const button = new ButtonBuilder()
                .setCustomId('create_ticket')
                .setLabel('Ticket öffnen')
                .setEmoji('📩')
                .setStyle(ButtonStyle.Primary);

            const row = new ActionRowBuilder().addComponents(button);

            // Sende das Panel in den Kanal
            await channel.send({ embeds: [embed], components: [row] });
            console.log('Ticket-Panel erfolgreich gesendet!');
        } else {
            console.log('Das Ticket-Panel existiert bereits im Kanal. Kein erneutes Senden nötig.');
        }

    } catch (error) {
        console.error('Fehler beim Einrichten des Ticket-Panels:', error);
    }
});

// Event: Interaktionen verarbeiten (Button-Klicks)
client.on('interactionCreate', async (interaction) => {
    // Nur Button-Interaktionen berücksichtigen
    if (!interaction.isButton()) return;

    // Prüfen, ob es sich um unseren Ticket-Button handelt
    if (interaction.customId === 'create_ticket') {
        await interaction.deferReply({ ephemeral: true });

        const guild = interaction.guild;
        const member = interaction.member;

        // Prüfen, ob bereits ein Ticket für diesen User existiert (Verhindert Spam)
        const channelName = `ticket-${member.user.username.toLowerCase()}`;
        const existingChannel = guild.channels.cache.find(c => c.name === channelName && c.parentId === CONFIG.CATEGORY_ID);

        if (existingChannel) {
            return interaction.editReply({
                content: `Du hast bereits ein offenes Ticket: ${existingChannel}`,
                ephemeral: true
            });
        }

        try {
            // Berechtigungen für den neuen Ticket-Kanal definieren
            const permissionOverwrites = [
                {
                    // Verhindert, dass normale User das Ticket sehen
                    id: guild.roles.everyone.id,
                    deny: [PermissionFlagsBits.ViewChannel],
                },
                {
                    // Erlaubt dem Ticket-Ersteller, das Ticket zu sehen und zu schreiben
                    id: member.id,
                    allow: [
                        PermissionFlagsBits.ViewChannel,
                        PermissionFlagsBits.SendMessages,
                        PermissionFlagsBits.ReadMessageHistory,
                        PermissionFlagsBits.AttachFiles
                    ],
                }
            ];

            // Wenn eine Support-Rolle definiert ist, füge Berechtigungen für sie hinzu
            if (CONFIG.SUPPORT_ROLE_ID && CONFIG.SUPPORT_ROLE_ID !== 'DEINE_SUPPORT_ROLLE_ID_HIER') {
                permissionOverwrites.push({
                    id: CONFIG.SUPPORT_ROLE_ID,
                    allow: [
                        PermissionFlagsBits.ViewChannel,
                        PermissionFlagsBits.SendMessages,
                        PermissionFlagsBits.ReadMessageHistory,
                        PermissionFlagsBits.AttachFiles
                    ],
                });
            }

            // Ticket-Kanal in der gewünschten Kategorie erstellen
            const ticketChannel = await guild.channels.create({
                name: channelName,
                type: ChannelType.GuildText,
                parent: CONFIG.CATEGORY_ID, // Hier wird die Kategorie-ID angewendet
                permissionOverwrites: permissionOverwrites,
                topic: `Ticket von ${member.user.tag} (ID: ${member.id})`
            });

            // Begrüßungsnachricht im Ticket-Kanal senden
            const welcomeEmbed = new EmbedBuilder()
                .setTitle('🎫 Ticket geöffnet')
                .setDescription(`Hallo ${member},\nvielen Dank für das Öffnen eines Tickets. Bitte beschreibe dein Anliegen so detailliert wie möglich.\n\nUnser Support-Team wird sich bald um dich kümmern.`)
                .setColor('#2F3136')
                .setTimestamp();

            // Button zum Schließen des Tickets erstellen
            const closeButton = new ButtonBuilder()
                .setCustomId('close_ticket')
                .setLabel('Ticket schließen')
                .setEmoji('🔒')
                .setStyle(ButtonStyle.Danger);

            const row = new ActionRowBuilder().addComponents(closeButton);

            await ticketChannel.send({
                content: `${member} | <@&${CONFIG.SUPPORT_ROLE_ID || ''}>`,
                embeds: [welcomeEmbed],
                components: [row]
            });

            // Dem Benutzer mitteilen, dass sein Ticket erstellt wurde
            await interaction.editReply({
                content: `Dein Ticket wurde erfolgreich erstellt: ${ticketChannel}`,
                ephemeral: true
            });

        } catch (error) {
            console.error('Fehler beim Erstellen des Tickets:', error);
            await interaction.editReply({
                content: 'Es gab einen Fehler beim Erstellen deines Tickets. Bitte wende dich an einen Administrator.',
                ephemeral: true
            });
        }
    }

    // Ticket schließen Logik
    if (interaction.customId === 'close_ticket') {
        await interaction.reply({ content: 'Dieses Ticket wird in Kürze geschlossen...' });
       
        // Warte 5 Sekunden und lösche dann den Kanal
        setTimeout(async () => {
            try {
                await interaction.channel.delete();
            } catch (error) {
                console.error('Fehler beim Löschen des Ticket-Kanals:', error);
            }
        }, 5000);
    }
});

// Bot einloggen
client.login(CONFIG.TOKEN);

eof
Anleitung zur Inbetriebnahme:
 * Node.js auf deinem Server/Computer installiert haben.
 * Installiere die discord.js-Bibliothek in deinem Projektordner mittels:
   npm install discord.js


