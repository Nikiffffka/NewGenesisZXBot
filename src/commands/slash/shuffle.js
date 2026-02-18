const { SlashCommandBuilder, EmbedBuilder } = require('discord.js');

module.exports = {
    data: new SlashCommandBuilder()
        .setName('shuffle')
        .setDescription('Перемешать очередь'),

    async execute(interaction, client) {
        const player = client.getPlayer(interaction.guildId);

        if (player.queue.length < 2) {
            return interaction.reply({
                content: '❌ Недостаточно треков в очереди для перемешивания!',
                ephemeral: true
            });
        }

        player.shuffle();

        const embed = new EmbedBuilder()
            .setColor(0x9932CC)
            .setTitle('🔀 Очередь перемешана')
            .setDescription(`Перемешано ${player.queue.length} треков`);

        await interaction.reply({ embeds: [embed] });
    },
};
