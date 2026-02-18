const { SlashCommandBuilder } = require('discord.js');
const { REST, Routes } = require('discord.js');
const path = require('path');
const fs = require('fs');

// Загрузка команд
function loadCommands(client) {
    const commandsPath = path.join(__dirname, 'slash');
    
    // Создаем папку если её нет
    if (!fs.existsSync(commandsPath)) {
        fs.mkdirSync(commandsPath, { recursive: true });
    }

    const commandFiles = fs.readdirSync(commandsPath).filter(file => file.endsWith('.js'));

    for (const file of commandFiles) {
        const filePath = path.join(commandsPath, file);
        const command = require(filePath);
        
        if ('data' in command && 'execute' in command) {
            client.commands.set(command.data.name, command);
            console.log(`✅ Команда загружена: ${command.data.name}`);
        } else {
            console.log(`⚠️ Команда ${filePath} не имеет обязательных полей "data" или "execute"`);
        }
    }
}

// Регистрация slash-команд
async function registerCommands(client) {
    const commands = [];
    const commandsPath = path.join(__dirname, 'slash');
    const commandFiles = fs.readdirSync(commandsPath).filter(file => file.endsWith('.js'));

    for (const file of commandFiles) {
        const filePath = path.join(commandsPath, file);
        const command = require(filePath);
        if ('data' in command) {
            commands.push(command.data.toJSON());
        }
    }

    const rest = new REST().setToken(process.env.DISCORD_TOKEN);

    try {
        console.log(`🔄 Обновление ${commands.length} slash-команд...`);

        // Регистрируем команды глобально или для конкретной гильдии
        if (process.env.GUILD_ID) {
            await rest.put(
                Routes.applicationGuildCommands(process.env.CLIENT_ID, process.env.GUILD_ID),
                { body: commands },
            );
        } else {
            await rest.put(
                Routes.applicationCommands(process.env.CLIENT_ID),
                { body: commands },
            );
        }

        console.log(`✅ Успешно обновлено ${commands.length} команд!`);
    } catch (error) {
        console.error('Ошибка регистрации команд:', error);
    }
}

module.exports = { loadCommands, registerCommands };
