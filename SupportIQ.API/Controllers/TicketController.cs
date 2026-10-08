using System.IdentityModel.Tokens.Jwt;
using System.Security.Claims;
using Microsoft.AspNetCore.Authorization;
using Microsoft.AspNetCore.Mvc;
using SupportIQ.Application.DTOs.Tickets;
using SupportIQ.Application.Interfaces;

namespace SupportIQ.API.Controllers
{
    [ApiController]
    [Route("api/[controller]")]
    [Authorize(Roles = "Customer")]
    public class TicketController : ControllerBase
    {
        private readonly ITicketService _ticketService;

        public TicketController(ITicketService ticketService)
        {
            _ticketService = ticketService;
        }

        [HttpPost]
        public async Task<IActionResult> CreateTicket(CreateTicketRequest request)
        {
            var userIdClaim = User.FindFirstValue(JwtRegisteredClaimNames.Sub) ?? User.FindFirstValue(ClaimTypes.NameIdentifier);

            if (!int.TryParse(userIdClaim, out var customerId))
            {
                return Unauthorized(new 
                { 
                    message = "Invalid user identity." 
                });
            }
            try
            {
                var result = await _ticketService.CreateTicketAsync(request, customerId);

                return CreatedAtAction(nameof(CreateTicket), new { id = result.TicketId },
                    result);
            }
            catch (InvalidOperationException ex)
            {
                return BadRequest(new
                {
                    message = ex.Message
                });
            }
        }

        [HttpGet("my")]
        public async Task<IActionResult> GetMyTickets()
        {
            var userIdClaims = User.FindFirstValue(JwtRegisteredClaimNames.Sub) ?? User.FindFirstValue(ClaimTypes.NameIdentifier);

            if(!int.TryParse(userIdClaims, out var customerId))
            {
                return Unauthorized(new
                {
                    message = "Invalid user identity."
                });
            }

            var tickets = await _ticketService.GetMyTicketAsync(customerId);

            return Ok(tickets);
        }
    }
}
