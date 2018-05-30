using System;
using System.Collections.Generic;
using System.Linq;
using System.Web;

namespace CryptoTransChatBot.Service
{
    public class IChatBotService
    {
        string PostContentToLex(string messageToSend);

        Task<PostTextResponse> SendTextMsgToLex(string messageToSend, Dictionary<string, string> lexSessionAttributes, string sessionId);

        Task<PostTextResponse> SendTextMsgToLex(string messageToSend, string sessionId);

        Task<Stream> SendAudioMsgToLex(Stream audioToSend);
    }
}