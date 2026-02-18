const { SlashCommandBuilder, EmbedBuilder } = require('discord.js');

module.exports = {
    data: new SlashCommandBuilder()
        .setName('resume')
        .setDescription('Продолжить воспроизведение'),

    async execute(interaction, client) {
        const player = client.getPlayer(interaction.guildId);

        if (!player.isPaused) {
            return interaction.reply({
                content: '❌ Воспроизведение не на паузе!',
                ephemeral: true
            });
        }

        player.resume();

        const embed = new EmbedBuilder()
            .setColor(0x00FF00)
            .setTitle('▶️ Воспроизведение возобновлено')
            .setDescription(`Сейчас играет: ${player.currentTrack?.title || 'Неизвестный трек'}`);

        await interaction.reply({ embeds: [embed] });
    },
};
