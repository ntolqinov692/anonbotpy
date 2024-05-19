from telegram.ext import Updater, CommandHandler, MessageHandler, Filters

# Bot token and channel ID
BOT_TOKEN = "YOUR_BOT_TOKEN"
CHANNEL_ID = "YOUR_CHANNEL_ID"

def start(update, context):
    update.message.reply_text("Hello! I'm your anonymous message forwarder bot.")

def forward_message(update, context):
    message = update.message.text
    context.bot.send_message(CHANNEL_ID, message)
    update.message.reply_text("Your message has been sent anonymously to the channel.")

def main():
    updater = Updater(BOT_TOKEN, use_context=True)
    dp = updater.dispatcher

    dp.add_handler(CommandHandler("start", start))
    dp.add_handler(MessageHandler(Filters.text & ~Filters.command, forward_message))

    updater.start_polling()
    updater.idle()

if __name__ == "__main__":
    main()
