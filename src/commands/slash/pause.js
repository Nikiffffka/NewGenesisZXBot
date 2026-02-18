const { SlashCommandBuilder, EmbedBuilder } = require('discord.js');

module.exports = {
    data: new SlashCommandBuilder()
        .setName('pause')
        .setDescription('Поставить воспроизведение на паузу'),

    async execute(interaction, client) {
        const player = client.getPlayer(interaction.guildId);

        if (!player.isPlaying) {
            return interaction.reply({
                content: '❌ Сейчас ничего не воспроизводится!',
                ephemeral: true
            });
        }

        if (player.isPaused) {
            return interaction.reply({
                content: '❌ Воспроизведение уже на паузе!',
                ephemeral: true
            });
        }

        player.pause();

        const embed = new EmbedBuilder()
            .setColor(0xFFA500)
            .setTitle('⏸️ Пауза')
            .setDescription('Воспроизведение приостановлено');

        await interaction.reply({ embeds: [embed] });
    },
};
