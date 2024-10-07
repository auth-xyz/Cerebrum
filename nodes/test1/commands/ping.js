import { EmbedBuilder } from 'discord.js';

export default {
    data: {
        name: 'ping',
        description: 'Check the bot\'s latency',
        options: []
    },
    async execute(interaction) {
        const latency = interaction.client.ws.ping;

        const embed = new EmbedBuilder()
            .setTitle('Bot Latency')
            .setColor('#0099ff')
            .setDescription(`🏓 Pong! The latency is **${latency}ms**.`)
            .setFooter({ text: `Requested by ${interaction.user.tag}`, iconURL: interaction.user.displayAvatarURL() })
            .setTimestamp();

        await interaction.reply({ embeds: [embed] });
    }
};

