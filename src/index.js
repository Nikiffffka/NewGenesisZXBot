require('dotenv').config();

// На некоторых сетях Discord Voice стабильнее работает через IPv4.
try {
    const dns = require('dns');
    if (typeof dns.setDefaultResultOrder === 'function') {
        dns.setDefaultResultOrder('ipv4first');
    }
} catch (e) {
    // Игнорируем, если API недоступно в текущем runtime.
}

// Устанавливаем путь к FFmpeg до загрузки других модулей
const ffmpegPath = require('ffmpeg-static');
process.env.FFMPEG_PATH = ffmpegPath;

const { Client, GatewayIntentBits, Collection } = require('discord.js');
const { startServer } = require('./server');
const { loadCommands, registerCommands } = require('./commands');
const { MusicPlayer } = require('./music/player');

// Создаем клиент Discord
const client = new Client({
    intents: [
        GatewayIntentBits.Guilds,
        GatewayIntentBits.GuildVoiceStates,
        GatewayIntentBits.GuildMessages,
        GatewayIntentBits.MessageContent,
    ],
});

// Коллекция команд
client.commands = new Collection();

// Музыкальные плееры для каждой гильдии
client.musicPlayers = new Map();

// Функция для получения или создания плеера
client.getPlayer = (guildId) => {
    if (!client.musicPlayers.has(guildId)) {
        client.musicPlayers.set(guildId, new MusicPlayer(guildId));
    }
    return client.musicPlayers.get(guildId);
};

// Загружаем команды
loadCommands(client);

// Событие готовности бота
client.once('ready', async () => {
    console.log(`✅ Бот ${client.user.tag} запущен!`);
    
    // Регистрируем slash-команды
    await registerCommands(client);
    
    // Запускаем веб-сервер
    startServer(client);
});

// Обработка slash-команд
client.on('interactionCreate', async (interaction) => {
    if (!interaction.isChatInputCommand()) return;

    const command = client.commands.get(interaction.commandName);

    if (!command) {
        console.error(`Команда ${interaction.commandName} не найдена.`);
        return;
    }

    try {
        await command.execute(interaction, client);
    } catch (error) {
        console.error(error);
        const errorMessage = { content: '❌ Произошла ошибка при выполнении команды!', ephemeral: true };
        
        if (interaction.replied || interaction.deferred) {
            await interaction.followUp(errorMessage);
        } else {
            await interaction.reply(errorMessage);
        }
    }
});

// Запуск бота
client.login(process.env.DISCORD_TOKEN);
