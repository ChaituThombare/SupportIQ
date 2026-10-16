using Microsoft.AspNetCore.Authorization;
using Microsoft.AspNetCore.Mvc;
using Microsoft.EntityFrameworkCore;
using SupportIQ.Application.Interfaces;
using SupportIQ.Infrastructure.Data;
using SupportIQ.Infrastructure.Services;
using System.IdentityModel.Tokens.Jwt;
using System.Security.Claims;

namespace SupportIQ.API.Controllers
{
    [ApiController]
    [Route("api/Ticket/{id:int}/ai-analysis")]
    [Authorize(Roles = "Agent,Admin")]
    public class TicketAIController : ControllerBase
    {
        private readonly IAITicketService _aITicketService;
        private readonly SupportIQDbContext _context;
        private readonly ILogger<TicketAIController> _logger;

        public TicketAIController(IAITicketService aITicketService, SupportIQDbContext context, ILogger<TicketAIController> logger)
        {
            _aITicketService = aITicketService;
            _context = context;
            _logger = logger;
        }

        private int? GetCurrentUserId()
        {
            var userIdClaim = User.FindFirstValue(ClaimTypes.NameIdentifier) ??
                User.FindFirstValue(JwtRegisteredClaimNames.Sub);

            return int.TryParse(userIdClaim, out var userId) ? userId : null;
        }

        [HttpPost]
        public async Task<IActionResult> AnalyzeTicket(int id, CancellationToken cancellationToken)
        {
            var userId = GetCurrentUserId();

            if(userId is null)
            {
                return Unauthorized(new
                {
                    message = "Invalid user identity."
                });
            }

            var isAdmin = User.IsInRole("Admin");

            var ticket = await _context.Tickets
                .AsNoTracking()
                .Where(t => t.TicketId == id)
                .Select(t => new
                {
                    t.TicketId,
                    t.AssignedAgentId
                })
                .FirstOrDefaultAsync(cancellationToken);

            if(ticket is null)
            {
                return NotFound(new
                {
                    message = "Ticket not found."
                });
            }

            if (!isAdmin && ticket.AssignedAgentId != userId.Value)
                return Forbid();

            try
            {
                var result = await _aITicketService.AnalyzeTicketAsync(id, cancellationToken);

                if (result is null)
                {
                    return NotFound(new
                    {
                        message = "Ticket not found."
                    });
                }

                return Ok(result);
            }
            catch(OperationCanceledException) when (cancellationToken.IsCancellationRequested)
            {
                throw;
            }
            catch(OperationCanceledException ex)
            {
                _logger.LogWarning(ex, "AI analysis was cancelled or timed out for ticket {TicketId}.", id);

                return StatusCode(StatusCodes.Status503ServiceUnavailable, new
                {
                    message = "AI analysis was timed out. The ticket remains saved."
                });
            }
            catch (HttpRequestException ex)
            {
                _logger.LogError(
                    ex,
                    "Gemini API request failed for ticket {ticketId}.", id);

                return StatusCode(StatusCodes.Status503ServiceUnavailable, new
                {
                    message = "AI service is currently unavailable. The ticket remains saved."
                });
            }
            catch (InvalidOperationException ex)
            {
                _logger.LogError(ex, "AI analysis failed for {TicketId}.", id);
                
                return StatusCode(StatusCodes.Status503ServiceUnavailable, new
                {
                    message = "AI analysis could not be completed. The ticket remains saaved."
                });
            }
        }
    }
}