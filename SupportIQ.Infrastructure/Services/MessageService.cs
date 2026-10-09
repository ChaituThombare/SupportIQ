using Microsoft.EntityFrameworkCore;
using SupportIQ.Application.DTOs.Messages;
using SupportIQ.Application.Interfaces;
using Microsoft.Identity.Client;
using SupportIQ.Domain.Entities;
using SupportIQ.Infrastructure.Data;
using System;
using System.Collections.Generic;
using System.Linq;
using System.Text;
using System.Threading.Tasks;

namespace SupportIQ.Infrastructure.Services
{
    public class MessageService : IMessageService 
    {
        private readonly SupportIQDbContext _context;

        public MessageService(SupportIQDbContext context)
        {
            _context = context;
        }

        private async Task<bool> CanAccessTicketAsync(int ticketId, int userId, string role)
        {
            return await _context.Tickets.AnyAsync(t => t.TicketId == ticketId && (
                (role == "Customer" && t.CustomerId == userId) ||
                (role == "Agent" && t.AssignedAgentId == userId) || role == "Admin"
            ));
        }

        public async Task<List<MessageResponse>> GetConversationAsync(int ticketId, int userId, string role)
        {
            var canAccess = await CanAccessTicketAsync(ticketId, userId, role);

            if (!canAccess)
            {
                throw new UnauthorizedAccessException("You do not have access to this ticket conversation.");
            }

            return await _context.Messages
                .AsNoTracking()
                .Where(m => m.TicketId == ticketId)
                .OrderBy(m => m.CreatedOn)
                .ThenBy(m => m.MessageId)
                .Select(m => new MessageResponse
                {
                    MessageId = m.MessageId,
                    TicketId = m.TicketId,
                    SenderId = m.SenderId,
                    SenderType = m.SenderType,
                    MessageText = m.MessageText,
                    IsAISuggested = m.IsAISuggested,
                    CreatedOn = m.CreatedOn
                })
                .ToListAsync();
        }

        public async Task<MessageResponse?> SendMessageAsync(int ticketId, int userId, string role, string messageText)
        {
            messageText = messageText.Trim();

            if(string.IsNullOrWhiteSpace(messageText))
            {
                throw new ArgumentException("Message text cannot be empty or whitespace.");
            }

            if(messageText.Length > 5000)
            {
                throw new ArgumentException("Message cannot exceed 5000 characters.");
            }

            if(role != "Customer" && role != "Agent" && role != "Admin")
            {
                throw new UnauthorizedAccessException("This role cannot send messages.");
            }

            var ticket = await _context.Tickets.FirstOrDefaultAsync(t => t.TicketId == ticketId);

            if(ticket == null)
            {
                return null;
            }

            var canAccess = await CanAccessTicketAsync(ticketId, userId, role);

            if (!canAccess)
            {
                throw new UnauthorizedAccessException("You do not have permission to send messages on this ticket.");
            }

            if(ticket.Status == "Closed") 
            { 
                throw new InvalidOperationException("This ticket is closed and cannot receive new message.");
            }

            var message = new Message
            {
                TicketId = ticketId,
                SenderId = userId,
                SenderType = role,
                MessageText = messageText,
                IsAISuggested = false,
                CreatedOn = DateTime.Now
            };

            _context.Messages.Add(message);

            ticket.UpdatedOn = DateTime.Now;

            await _context.SaveChangesAsync();

            return new MessageResponse
            {
                MessageId = message.MessageId,
                TicketId = message.TicketId,
                SenderId = message.SenderId,
                SenderType = message.SenderType,
                MessageText = message.MessageText,
                IsAISuggested = message.IsAISuggested,
                CreatedOn = message.CreatedOn
            };
        }
    }
}
