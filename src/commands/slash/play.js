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

        // Добавляем трек
        const result = await player.addTrack(query);

        if (!result) {
            return interaction.editReply('❌ Не удалось найти трек!');
        }

        let warning = null;

        // Подключаемся к каналу если не подключены
        if (!player.isConnected()) {
            const connected = await player.connect(voiceChannel);
            if (!connected) {
                warning = '⚠️ Трек добавлен в очередь, но подключение к голосовому каналу не удалось.';
            }
        }

        // Начинаем воспроизведение если плеер не играет
        if (!warning && !player.isPlaying && player.isConnected()) {
            const started = await player.playNext();
            if (!started) {
                warning = '⚠️ Трек добавлен в очередь, но запуск воспроизведения не удался.';
            }
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

        const payload = { embeds: [embed] };
        if (warning) {
            payload.content = warning;
        }

        await interaction.editReply(payload);
    },
};

function formatDuration(seconds) {
    const mins = Math.floor(seconds / 60);
    const secs = seconds % 60;
    return `${mins}:${secs.toString().padStart(2, '0')}`;
}
