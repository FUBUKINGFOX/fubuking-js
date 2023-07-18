const ytdl  = require("ytdl-core")
const { SlashCommandBuilder, EmbedBuilder } = require("discord.js")
const { AudioPlayerStatus } = require("@discordjs/voice");
const { OWNER_ID } = require("../../config.json")
const { play , getplayer } = require("./bin/functions.js")


function delay(milliseconds){
    return new Promise(resolve => {
        setTimeout(resolve, milliseconds);
    });
}


module.exports = {
    data: new SlashCommandBuilder()
    .setName("play")
    .setDescription("play youtube song")
    .addStringOption((url) => {
        return url
        .setName("url")
        .setDescription("string or url to request song")
        .setRequired(true)
    }),
    async execute(interaction){

        // if (interaction.user.id != OWNER_ID){
        //     const embed = new EmbedBuilder()
        //     .setTitle("ERROR:[403]")
        //     .setDescription("this command is on closebeta.")
        //     .setColor(0xfff200)
        //     await interaction.reply({embeds:[embed]})
        //     return
        // }
       
        await play(interaction,interaction.options.getString("url"))
        const player = getplayer(interaction,false)

        if (interaction.replied || interaction.deferred) {
            await interaction.followUp(`queue ${interaction.options.getString("url")}`);
        } 
        else {
            await interaction.reply(`queue ${interaction.options.getString("url")}`);
        }

        player.on('error', error => {
            console.error('Error:', error.message);
        });
    }
}