using SupportIQ.Application.Interfaces;
using Microsoft.EntityFrameworkCore;
using SupportIQ.Infrastructure.Data;
using SupportIQ.Domain.Entities;
using SupportIQ.Application.DTOs.Tickets;

namespace SupportIQ.Infrastructure.Services
{
    public class TicketService : ITicketService
    {
        private readonly SupportIQDbContext _context;

        public TicketService(SupportIQDbContext context)
        {
            _context = context;
        }

        public async Task<TicketResponse> CreateTicketAsync(CreateTicketRequest request, int customerId)
        {
            var customerExists = await _context.Users.AnyAsync(u => u.UserId == customerId);

            if (!customerExists)
            {
                throw new InvalidOperationException("Customer not found.");
            }

            if (request.CategoryId.HasValue)
            {
                var categoryExists = await _context.Categories.AnyAsync(c => c.CategoryId == request.CategoryId.Value && c.IsActive);

                if(!categoryExists)
                {
                    throw new InvalidOperationException("Selected category does not found or is inactive.");
                }
            }

            var ticket = new Ticket
            {
                CustomerId = customerId,
                Subject = request.Subject,
                Description = request.Description,
                CategoryId = request.CategoryId,
                Priority = "Low",
                Status = "Open",
                IsAIClassified = false,
                CreatedOn = DateTime.Now
            };

            _context.Tickets.Add(ticket);

            await _context.SaveChangesAsync();

            return new TicketResponse
            {
                TicketId = ticket.TicketId,
                CustomerId = ticket.CustomerId,
                Subject = ticket.Subject,
                Description = ticket.Description,
                CategoryId = ticket.CategoryId,
                Priority = ticket.Priority,
                Status = ticket.Status,
                IsAIClassified = ticket.IsAIClassified,
                CreatedOn = ticket.CreatedOn
            };
        }

        public async Task<List<TicketResponse>> GetMyTicketAsync(int customerId)
        {
            return await _context.Tickets
                    .Where(t => t.CustomerId == customerId)
                    .OrderByDescending(t => t.CreatedOn)
                    .Select(t => new TicketResponse
                    {
                        TicketId = t.TicketId,
                        CustomerId = t.CustomerId,
                        Subject = t.Subject,
                        Description = t.Description,
                        CategoryId = t.CategoryId,
                        Priority = t.Priority,
                        Status = t.Status,
                        IsAIClassified = t.IsAIClassified,
                        CreatedOn = t.CreatedOn
                    })
                    .ToListAsync();
        }
    }
}
