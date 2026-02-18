const { SlashCommandBuilder, EmbedBuilder } = require('discord.js');

module.exports = {
    data: new SlashCommandBuilder()
        .setName('play')
        .setDescription('Воспроизвести музыку')
        .addStringOption(option =>
            option.setName('query')
                .setDescription('URL или название трека')
                .setRequired(true)),

    async execute(interaction, client) {
        const query = interaction.options.getString('query');
        const member = interaction.member;
        const voiceChannel = member.voice.channel;

        if (!voiceChannel) {
            return interaction.reply({
                content: '❌ Вы должны находиться в голосовом канале!',
                ephemeral: true
            });
        }

        await interaction.deferReply();

        const player = client.getPlayer(interaction.guildId);

        // Подключаемся к каналу если не подключены
        if (!player.connection) {
            const connected = await player.connect(voiceChannel);
            if (!connected) {
                return interaction.editReply('❌ Не удалось подключиться к голосовому каналу!');
            }
        }

        // Добавляем трек
        const result = await player.addTrack(query);

        if (!result) {
            return interaction.editReply('❌ Не удалось найти трек!');
        }

        const embed = new EmbedBuilder()
            .setColor(0x00FF00);

        if (result.type === 'playlist') {
            embed.setTitle('📋 Плейлист добавлен')
                .setDescription(`Добавлено ${result.count} треков из "${result.name}"`);
        } else {
            embed.setTitle('🎵 Трек добавлен в очередь')
                .setDescription(`[${result.track.title}](${result.track.url})`)
                .setThumbnail(result.track.thumbnail)
                .addFields(
                    { name: 'Автор', value: result.track.author, inline: true },
                    { name: 'Длительность', value: formatDuration(result.track.duration), inline: true }
                );
        }

        await interaction.editReply({ embeds: [embed] });

        // Начинаем воспроизведение если плеер не играет
        if (!player.isPlaying) {
            await player.playNext();
        }
    },
};

function formatDuration(seconds) {
    const mins = Math.floor(seconds / 60);
    const secs = seconds % 60;
    return `${mins}:${secs.toString().padStart(2, '0')}`;
}
