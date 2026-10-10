using SupportIQ.Application.Interfaces;
using System.Net.Http;
using Microsoft.EntityFrameworkCore;
using SupportIQ.Infrastructure.Data;
using SupportIQ.Domain.Entities;
using SupportIQ.Application.DTOs.Tickets;

namespace SupportIQ.Infrastructure.Services
{
    public class TicketService : ITicketService
    {
        private readonly SupportIQDbContext _context;
        private readonly IAITicketService _aiTicketService;

        public TicketService(SupportIQDbContext context, IAITicketService aiTicketService)
        {
            _context = context;
            _aiTicketService = aiTicketService;
        }

        public async Task<TicketResponse> CreateTicketAsync(CreateTicketRequest request, int customerId)
        {
            var customerExists = await _context.Users
                .AnyAsync(u => u.UserId == customerId && u.IsActive && u.Role.RoleName == "Customer");

            if (!customerExists)
            {
                throw new InvalidOperationException("Customer not found.");
            }

            if (request.CategoryId.HasValue)
            {
                var categoryExists = await _context.Categories
                    .AnyAsync(c => c.CategoryId == request.CategoryId.Value && c.IsActive);

                if (!categoryExists)
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

            try
            {
                await _aiTicketService.AnalyzeTicketAsync(ticket.TicketId);
            }
            catch(HttpRequestException) { }
            catch (InvalidOperationException) { }
            catch (OperationCanceledException) { }

            return MapToResponse(ticket);
        }

        public async Task<List<TicketResponse>> GetMyTicketAsync(int customerId)
        {
            return await _context.Tickets
                    .AsNoTracking()
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

        public async Task<TicketResponse?> GetTicketByIdAsync(int ticketId, int customerId)
        {
            return await _context.Tickets
                .AsNoTracking()
                .Where(t => t.TicketId == ticketId &&
                       t.CustomerId == customerId)
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
                .FirstOrDefaultAsync();
        }

        public async Task<List<TicketResponse>> GetAgentQueueAsync()
        {
            return await _context.Tickets
                .AsNoTracking()
                .Where(t => t.AssignedAgentId == null &&
                    t.Status != "Resolved" &&
                    t.Status != "Closed")
                .OrderBy(t => t.CreatedOn)
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

        public async Task<List<TicketResponse>> GetAssignedTicketAsync(int agentId)
        {
            return await _context.Tickets
                .AsNoTracking()
                .Where(t => t.AssignedAgentId == agentId &&
                       t.Status != "Resolved" &&
                       t.Status != "Closed")
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

        public async Task<TicketResponse?> AssignTicketAsync(int ticketId, int agentId)
        {
            var agent = await _context.Users
                .Include(u => u.Role)
                .FirstOrDefaultAsync(u => u.UserId == agentId && u.IsActive && u.Role.RoleName == "Agent");

            if(agent == null)
            {
                throw new InvalidOperationException("Agent not found.");
            }

            var ticket = await _context.Tickets
                .FirstOrDefaultAsync(t => t.TicketId == ticketId);

            if(ticket == null)
            {
                return null;
            }

            ticket.AssignedAgentId = agentId;
            ticket.UpdatedOn = DateTime.Now;

            await _context.SaveChangesAsync();

            return MapToResponse(ticket);
        }

        private static TicketResponse MapToResponse(Ticket ticket)
        {
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

        public async Task<TicketResponse?> UpdateTicketStatusAsync(int ticketId, string status, int userId, bool isAdmin)
        {
            var allowedStatuses = new[]
            {
                "Open", "InProgress", "Resolved", "Closed"
            };

            if(!allowedStatuses.Contains(status))
            {
                throw new ArgumentException("Invalid ticket status.");
            }

            var ticket = await _context.Tickets
                .FirstOrDefaultAsync(t => t.TicketId == ticketId);
            
            if (ticket == null)
            {
                return null;
            }
            
            if(!isAdmin && ticket.AssignedAgentId != userId)
            {
                throw new UnauthorizedAccessException("You can update only tickets assigned to you.");
            }

            if(status == "Closed" && ticket.Status != "Resolved")
            {
                throw new InvalidOperationException("Ticket can only be closed if it is resolved.");
            }

            if(ticket.Status == "Closed" && status != "Closed")
            {
                throw new InvalidOperationException("Closed tickets cannot be updated.");
            }

            ticket.Status = status;
            ticket.UpdatedOn = DateTime.Now;

            if(status == "Resolved")
            {
                ticket.ResolvedOn = DateTime.Now;
            }

            await _context.SaveChangesAsync();

            return MapToResponse(ticket);
        }

        public async Task<TicketResponse?> UpdateTicketPriorityAsync(int ticketId, string priority, int userId, bool isAdmin)
        {
            var allowedPriorities = new[]
            {
                "Low", "Medium", "High", "Critical"
            };

            if (!allowedPriorities.Contains(priority))
            {
                throw new ArgumentException("Invalid ticket priority.");
            }

            var ticket = await _context.Tickets
                .FirstOrDefaultAsync(t => t.TicketId == ticketId);

            if (ticket == null)
            {
                return null;
            }

            if (!isAdmin && ticket.AssignedAgentId != userId)
            {
                throw new UnauthorizedAccessException("You can update only tickets assigned to you.");
            }

            if (ticket.Status == "Closed")
            {
                throw new InvalidOperationException("Priority cannot be changes on a closed ticket.");
            }

            ticket.Priority = priority;
            ticket.UpdatedOn = DateTime.Now;

            await _context.SaveChangesAsync();

            return MapToResponse(ticket);
        }
    }
}
