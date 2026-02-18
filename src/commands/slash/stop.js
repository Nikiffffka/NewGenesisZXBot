const { SlashCommandBuilder, EmbedBuilder } = require('discord.js');

module.exports = {
    data: new SlashCommandBuilder()
        .setName('stop')
        .setDescription('Остановить воспроизведение и очистить очередь'),

    async execute(interaction, client) {
        const player = client.getPlayer(interaction.guildId);

        if (!player.isPlaying && player.queue.length === 0) {
            return interaction.reply({
                content: '❌ Нечего останавливать!',
                ephemeral: true
            });
        }

        player.stop();

        const embed = new EmbedBuilder()
            .setColor(0xFF0000)
            .setTitle('⏹️ Воспроизведение остановлено')
            .setDescription('Очередь очищена');

        await interaction.reply({ embeds: [embed] });
    },
};
