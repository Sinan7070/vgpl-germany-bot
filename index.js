// Erforderliche Module importieren
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

console.log("VGPL Germany Bot wird vorbereitet...");

// Bot-Client initialisieren
const client = new Client({
    intents: [
        GatewayIntentBits.Guilds,
        GatewayIntentBits.GuildMessages,
        GatewayIntentBits.MessageContent
    ]
});

// KONFIGURATION AUS UMGEBUNGSVARIABLEN
const CONFIG = {
    TOKEN: process.env.DISCORD_TOKEN,
    PANEL_CHANNEL_ID: '1527708821320106164',
    CATEGORY_ID: '1527708420788977674',
    SUPPORT_ROLE_ID: process.env.SUPPORT_ROLE_ID || ''
};

// Dummy-Webserver für Render (Verhindert Port-Timeout bei Web Services im Free-Tier)
if (process.env.PORT || 3000) {
    const http = require('http');
    const port = process.env.PORT || 3000;
    http.createServer((req, res) => {
        res.writeHead(200, { 'Content-Type': 'text/plain' });
        res.end('VGPL Germany Bot laeuft online!\n');
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

        const messages = await channel.messages.fetch({ limit: 10 });
        const hasPanel = messages.some(msg => msg.embeds.length > 0 && msg.components.length > 0);

        if (!hasPanel) {
            const embed = new EmbedBuilder()
                .setTitle('📩 Support-Ticket erstellen')
                .setDescription('Benötigst du Hilfe oder hast eine Frage? Klicke auf den Button unten, um ein privates Support-Ticket zu öffnen.')
                .setColor('#2F3136')
                .setFooter({ text: 'VGPL Germany' });

            const button = new ButtonBuilder()
                .setCustomId('create_ticket')
                .setLabel('Ticket öffnen')
                .setEmoji('📩')
                .setStyle(ButtonStyle.Primary);

            const row = new ActionRowBuilder().addComponents(button);

            await channel.send({ embeds: [embed], components: [row] });
            console.log('Ticket-Panel erfolgreich gesendet!');
        } else {
            console.log('Das Ticket-Panel existiert bereits.');
        }
    } catch (error) {
        console.error('Fehler beim Einrichten des Ticket-Panels:', error);
    }
});

// Event: Button-Interaktionen
client.on('interactionCreate', async (interaction) => {
    if (!interaction.isButton()) return;

    if (interaction.customId === 'create_ticket') {
        await interaction.deferReply({ ephemeral: true });

        const guild = interaction.guild;
        const member = interaction.member;
        const channelName = `ticket-${member.user.username.toLowerCase()}`;
        const existingChannel = guild.channels.cache.find(c => c.name === channelName && c.parentId === CONFIG.CATEGORY_ID);

        if (existingChannel) {
            return interaction.editReply({
                content: `Du hast bereits ein offenes Ticket: ${existingChannel}`,
                ephemeral: true
            });
        }

        try {
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
                        PermissionFlagsBits.AttachFiles
                    ],
                }
            ];

            if (CONFIG.SUPPORT_ROLE_ID) {
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

            const ticketChannel = await guild.channels.create({
                name: channelName,
                type: ChannelType.GuildText,
                parent: CONFIG.CATEGORY_ID,
                permissionOverwrites: permissionOverwrites,
                topic: `Ticket von ${member.user.tag}`
            });

            const welcomeEmbed = new EmbedBuilder()
                .setTitle('🎫 Ticket geöffnet')
                .setDescription(`Hallo ${member},\nvielen Dank für deine Anfrage. Bitte beschreibe dein Problem hier so genau wie möglich.\n\nDas Support-Team wird dir in Kürze helfen.`)
                .setColor('#2F3136')
                .setTimestamp();

            const closeButton = new ButtonBuilder()
                .setCustomId('close_ticket')
                .setLabel('Ticket schließen')
                .setEmoji('🔒')
                .setStyle(ButtonStyle.Danger);

            const row = new ActionRowBuilder().addComponents(closeButton);

            const mention = CONFIG.SUPPORT_ROLE_ID ? `<@&${CONFIG.SUPPORT_ROLE_ID}>` : '';
            await ticketChannel.send({
                content: `${member} ${mention}`.trim(),
                embeds: [welcomeEmbed],
                components: [row]
            });

            await interaction.editReply({
                content: `Dein Ticket wurde erstellt: ${ticketChannel}`,
                ephemeral: true
            });

        } catch (error) {
            console.error('Fehler beim Erstellen des Tickets:', error);
            await interaction.editReply({
                content: 'Fehler beim Erstellen des Tickets. Bitte wende dich an die Administration.',
                ephemeral: true
            });
        }
    }

    if (interaction.customId === 'close_ticket') {
        await interaction.reply({ content: 'Dieses Ticket wird in 5 Sekunden geschlossen und gelöscht...' });
        setTimeout(async () => {
            try {
                await interaction.channel.delete();
            } catch (err) {
                console.error('Fehler beim Löschen des Kanals:', err);
            }
        }, 5000);
    }
});

// Login mit Umgebungsvariable
client.login(CONFIG.TOKEN);
