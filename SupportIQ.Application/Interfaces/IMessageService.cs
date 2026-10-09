using SupportIQ.Application.DTOs.Messages;
using System;
using System.Collections.Generic;
using System.Linq;
using System.Text;
using System.Threading.Tasks;

namespace SupportIQ.Application.Interfaces
{
    public interface IMessageService
    {
        Task<List<MessageResponse>> GetConversationAsync(int ticketId, int userId, string role);

        Task<MessageResponse?> SendMessageAsync(int ticketId, int userId, string role, string messageText);
    }
}
