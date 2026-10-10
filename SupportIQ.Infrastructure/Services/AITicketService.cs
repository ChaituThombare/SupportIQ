using Microsoft.EntityFrameworkCore;
using SupportIQ.Application.DTOs.AI;
using SupportIQ.Application.Interfaces;
using SupportIQ.Infrastructure.Data;
using SupportIQ.Domain.Entities;
using System;
using System.Collections.Generic;
using System.Linq;
using System.Text;
using System.Threading.Tasks;

namespace SupportIQ.Infrastructure.Services
{
    public class AITicketService : IAITicketService
    {
        private readonly SupportIQDbContext _context;
        private readonly IAIProvider _aIProvider;

        public AITicketService(SupportIQDbContext context, IAIProvider aIProvider)
        {
            _context = context;
            _aIProvider = aIProvider;
        }

        public async Task<AITicketAnalysisResponse?> AnalyzeTicketAsync(int ticketId, CancellationToken cancellationToken = default)
        {
            var ticket = await _context.Tickets.FirstOrDefaultAsync(t => t.TicketId == ticketId, cancellationToken);

            if (ticket == null)
            {
                return null;
            }

            var result = await _aIProvider.AnalyzeTicketAsync(ticket.Subject, ticket.Description, cancellationToken);

            var allowedCategories = new[] 
            { 
                "Payment", "Order", "Delivery", "Product", "Refund", "Account", "Technical", "Other"
            };

            var allowedPriorities = new[]
            {
                "Low", "Medium", "High", "Critical"
            };

            var categoryName = allowedCategories.FirstOrDefault(c => c.Equals(result.Category.Trim(), StringComparison.OrdinalIgnoreCase)) ?? "Other";

            var priority = allowedPriorities.FirstOrDefault(p => p.Equals(result.Priority.Trim(), StringComparison.OrdinalIgnoreCase)) ?? "Low";

            var suggestedResponse = result.SuggestedResponse?.Trim();

            if (string.IsNullOrWhiteSpace(suggestedResponse))
            {
                throw new InvalidOperationException("AI did not generate a usable suggested response.");
            }

            var categoryId = await _context.Categories
                .Where(c => c.CategoryName == categoryName && c.IsActive)
                .Select(c => (int?)c.CategoryId)
                .FirstOrDefaultAsync(cancellationToken);

            if(categoryId == null)
            {
                throw new InvalidOperationException($"Active category '{categoryName}' not found.");
            }

            ticket.CategoryId = categoryId.Value;
            ticket.Priority = priority;
            ticket.IsAIClassified = true;
            ticket.UpdatedOn = DateTime.Now;

            var existingSuggestion = await _context.Messages
                .Where(m => m.TicketId == ticketId &&
                       m.IsAISuggested && m.SenderType == "AI")
                .OrderByDescending(m => m.CreatedOn)
                .ThenByDescending(m => m.MessageId)
                .FirstOrDefaultAsync(cancellationToken);

            if(existingSuggestion == null)
            {
                existingSuggestion = new Message
                {
                    TicketId = ticketId,
                    SenderId = ticket.CustomerId,
                    SenderType = "AI",
                    IsAISuggested = true,
                    MessageText = suggestedResponse,
                    CreatedOn = DateTime.Now
                };

                _context.Messages.Add(existingSuggestion);
            }
            else
            {
                existingSuggestion.MessageText = suggestedResponse;
                existingSuggestion.CreatedOn = DateTime.Now;
            }

            await _context.SaveChangesAsync(cancellationToken);

            return new AITicketAnalysisResponse
            {
                TicketId = ticket.TicketId,
                Category = categoryName,
                Priority = priority,
                SuggestedResponse = suggestedResponse.Trim(),
                IsAIClassified = true
            };
        }
    }
}
