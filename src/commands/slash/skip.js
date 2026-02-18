const { SlashCommandBuilder, EmbedBuilder } = require('discord.js');

module.exports = {
    data: new SlashCommandBuilder()
        .setName('skip')
        .setDescription('Пропустить текущий трек'),

    async execute(interaction, client) {
        const player = client.getPlayer(interaction.guildId);

        if (!player.isPlaying) {
            return interaction.reply({
                content: '❌ Сейчас ничего не воспроизводится!',
                ephemeral: true
            });
        }

        const currentTrack = player.currentTrack;
        player.skip();

        const embed = new EmbedBuilder()
            .setColor(0xFFFF00)
            .setTitle('⏭️ Трек пропущен')
            .setDescription(`Пропущен: ${currentTrack?.title || 'Неизвестный трек'}`);

        await interaction.reply({ embeds: [embed] });
    },
};
