const { SlashCommandBuilder, EmbedBuilder } = require('discord.js');

module.exports = {
    data: new SlashCommandBuilder()
        .setName('leave')
        .setDescription('Отключиться от голосового канала'),

    async execute(interaction, client) {
        const player = client.getPlayer(interaction.guildId);

        if (!player.connection) {
            return interaction.reply({
                content: '❌ Бот не подключён к голосовому каналу!',
                ephemeral: true
            });
        }

        player.disconnect();

        const embed = new EmbedBuilder()
            .setColor(0xFF6347)
            .setTitle('👋 Отключено')
            .setDescription('Бот отключился от голосового канала');

        await interaction.reply({ embeds: [embed] });
    },
};
