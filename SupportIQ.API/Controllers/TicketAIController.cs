using Microsoft.AspNetCore.Authorization;
using Microsoft.AspNetCore.Mvc;
using Microsoft.EntityFrameworkCore;
using SupportIQ.Application.Interfaces;
using SupportIQ.Infrastructure.Data;
using System.IdentityModel.Tokens.Jwt;
using System.Net;
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

        public TicketAIController(
            IAITicketService aITicketService,
            SupportIQDbContext context,
            ILogger<TicketAIController> logger)
        {
            _aITicketService = aITicketService;
            _context = context;
            _logger = logger;
        }

        private int? GetCurrentUserId()
        {
            var userIdClaim =
                User.FindFirstValue(ClaimTypes.NameIdentifier) ??
                User.FindFirstValue(JwtRegisteredClaimNames.Sub);

            return int.TryParse(userIdClaim, out var userId)
                ? userId
                : null;
        }

        [HttpPost]
        public async Task<IActionResult> AnalyzeTicket(
            int id,
            CancellationToken cancellationToken)
        {
            var userId = GetCurrentUserId();

            if (userId is null)
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

            if (ticket is null)
            {
                return NotFound(new
                {
                    message = "Ticket not found."
                });
            }

            // Agents may analyze only tickets assigned to them.
            // Admins may analyze any existing ticket.
            if (!isAdmin && ticket.AssignedAgentId != userId.Value)
            {
                return Forbid();
            }

            try
            {
                var result = await _aITicketService.AnalyzeTicketAsync(
                    id,
                    cancellationToken);

                if (result is null)
                {
                    return NotFound(new
                    {
                        message = "Ticket not found."
                    });
                }

                return Ok(result);
            }
            catch (OperationCanceledException)
                when (cancellationToken.IsCancellationRequested)
            {
                // The client disconnected or explicitly cancelled the request.
                throw;
            }
            catch (OperationCanceledException ex)
            {
                _logger.LogWarning(
                    ex,
                    "AI analysis timed out for ticket {TicketId}.",
                    id);

                return StatusCode(
                    StatusCodes.Status503ServiceUnavailable,
                    new
                    {
                        message =
                            "AI analysis timed out after 55 seconds. " +
                            "The ticket remains saved. Please retry."
                    });
            }
            catch (HttpRequestException ex)
            {
                // The exception message contains the upstream HTTP status
                // and response body when Gemini returned an HTTP error.
                _logger.LogError(
                    ex,
                    "Gemini API request failed for ticket {TicketId}.",
                    id);

                var (httpStatus, clientMessage) = ex.StatusCode switch
                {
                    HttpStatusCode.Unauthorized =>
                        (
                            StatusCodes.Status502BadGateway,
                            "Google rejected AI:ApiKey as invalid. Replace it " +
                            "with a valid Gemini API key and restart the API."
                        ),

                    HttpStatusCode.Forbidden =>
                        (
                            StatusCodes.Status502BadGateway,
                            "Google denied this API key access to Gemini. Check " +
                            "Gemini API access and the key's restrictions."
                        ),

                    HttpStatusCode.NotFound =>
                        (
                            StatusCodes.Status502BadGateway,
                            "Gemini could not find the configured model. Check AI:Model."
                        ),

                    HttpStatusCode.BadRequest =>
                        (
                            StatusCodes.Status502BadGateway,
                            "Gemini rejected the request. Check the request format " +
                            "and configured model. See backend logs for details."
                        ),

                    HttpStatusCode.TooManyRequests =>
                        (
                            StatusCodes.Status429TooManyRequests,
                            "Gemini rejected the request because a model or project rate " +
                            "limit was reached. Wait for the limit to reset, reduce " +
                            "AI requests, or enable billing to raise your limits."
                        ),

                    HttpStatusCode.RequestTimeout =>
                        (
                            StatusCodes.Status504GatewayTimeout,
                            "Gemini did not respond in time. Please retry."
                        ),

                    _ when ex.StatusCode.HasValue &&
                           (int)ex.StatusCode.Value >= 500 =>
                        (
                            StatusCodes.Status503ServiceUnavailable,
                            "Gemini is temporarily unavailable. Please retry shortly."
                        ),

                    _ =>
                        (
                            StatusCodes.Status503ServiceUnavailable,
                            "Could not connect to Gemini. Check network access " +
                            "and backend logs."
                        )
                };

                return StatusCode(
                    httpStatus,
                    new
                    {
                        message = clientMessage
                    });
            }
            catch (InvalidOperationException ex)
            {
                _logger.LogError(
                    ex,
                    "AI analysis failed for ticket {TicketId}.",
                    id);

                return StatusCode(
                    StatusCodes.Status503ServiceUnavailable,
                    new
                    {
                        message =
                            "AI analysis could not be completed. Check the " +
                            "backend logs for configuration or response errors."
                    });
            }
        }
    }
}
