const { SlashCommandBuilder, EmbedBuilder } = require('discord.js');

module.exports = {
    data: new SlashCommandBuilder()
        .setName('nowplaying')
        .setDescription('Показать текущий трек'),

    async execute(interaction, client) {
        const player = client.getPlayer(interaction.guildId);

        if (!player.currentTrack) {
            return interaction.reply({
                content: '❌ Сейчас ничего не воспроизводится!',
                ephemeral: true
            });
        }

        const track = player.currentTrack;

        const embed = new EmbedBuilder()
            .setColor(0x1DB954)
            .setTitle('🎵 Сейчас играет')
            .setDescription(`[${track.title}](${track.url})`)
            .setThumbnail(track.thumbnail)
            .addFields(
                { name: 'Автор', value: track.author, inline: true },
                { name: 'Длительность', value: formatDuration(track.duration), inline: true },
                { name: 'Статус', value: player.isPaused ? '⏸️ На паузе' : '▶️ Воспроизводится', inline: true }
            );

        await interaction.reply({ embeds: [embed] });
    },
};

function formatDuration(seconds) {
    const mins = Math.floor(seconds / 60);
    const secs = seconds % 60;
    return `${mins}:${secs.toString().padStart(2, '0')}`;
}
